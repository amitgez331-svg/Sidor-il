-- התראות Push לבעלי אירועים + הערות אדמין. לא משנה נתונים קיימים.
-- זרימה: אורח עונה בדף ההזמנה → טריגר מוסיף שורה לתור (notify_outbox) ומעיר את push-notify →
-- הפונקציה שולחת לכל המכשירים של בעל האירוע ושל מי שהאירוע שותף איתו.

-- הערות פנימיות של האדמין על לקוח
create table if not exists public.admin_notes (
  user_id    uuid primary key,
  note       text,
  updated_at timestamptz not null default now()
);
alter table public.admin_notes enable row level security;
drop policy if exists admin_notes_admin on public.admin_notes;
create policy admin_notes_admin on public.admin_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- מכשירים שהפעילו התראות (כל משתמש רואה ומנהל רק את שלו)
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid(),
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- מפתחות VAPID (נוצרים פעם אחת ע"י push-notify). בלי policies = רק השרת
create table if not exists public.app_secrets (key text primary key, value text not null);
alter table public.app_secrets enable row level security;

-- תור ההתראות. בלי policies = רק השרת
create table if not exists public.notify_outbox (
  id         bigserial primary key,
  event_id   uuid references public.events(id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text,
  created_at timestamptz not null default now(),
  sent_at    timestamptz,
  sent_count int,
  error      text
);
alter table public.notify_outbox enable row level security;

-- למי שולחים: בעל האירוע + מי שהאירוע שותף איתו (מייל מאומת)
create or replace function public.event_recipient_ids(p_event uuid) returns setof uuid
  language sql stable security definer set search_path to '' as $$
  select e.user_id from public.events e where e.id = p_event
  union
  select u.id from public.event_members m
    join auth.users u on lower(u.email) = m.email and u.email_confirmed_at is not null
   where m.event_id = p_event
$$;
revoke execute on function public.event_recipient_ids(uuid) from public, anon, authenticated;

-- לקיחת התראות לשליחה (אטומי — שתי הפעלות במקביל לא ישלחו פעמיים)
create or replace function public.claim_notify_outbox() returns setof public.notify_outbox
  language sql security definer set search_path to '' as $$
  update public.notify_outbox set sent_at = now()
   where id in (select id from public.notify_outbox
                 where sent_at is null and created_at > now() - interval '1 day'
                 order by id limit 100 for update skip locked)
  returning *
$$;
revoke execute on function public.claim_notify_outbox() from public, anon, authenticated;

-- הערת פונקציית השליחה (בלי תוכן — היא רק מעבדת את התור)
create or replace function public.kick_push() returns void
  language plpgsql security definer set search_path to '' as $$
begin
  perform net.http_post(
    url := 'https://zcfosfaazvljnzipyzon.supabase.co/functions/v1/push-notify',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 30000);
end $$;
revoke execute on function public.kick_push() from public, anon, authenticated;

-- אורח אישר / ביטל הגעה בדף ההזמנה → התראה לבעל האירוע (אם לא כיבה ב"אישורי הגעה")
-- רק תשובה של אורח (בלי משתמש מחובר), לא שינוי שבעל האירוע עשה בעצמו
create or replace function public.guests_rsvp_notify() returns trigger
  language plpgsql security definer set search_path to '' as $$
declare ev record; n int;
begin
  if auth.uid() is not null then return new; end if;
  if new.rsvp is null or new.rsvp not in ('confirmed','declined') then return new; end if;
  if tg_op = 'UPDATE' and old.rsvp is not distinct from new.rsvp and old.guest_count is not distinct from new.guest_count then return new; end if;
  select id, name, settings_json into ev from public.events where id = new.event_id;
  if ev.id is null or coalesce(ev.settings_json->>'notifyRsvp', 'true') = 'false' then return new; end if;
  n := coalesce(new.guest_count, 1);
  insert into public.notify_outbox (event_id, kind, title, body) values (new.event_id, 'rsvp',
    case when new.rsvp = 'confirmed' then '🎉 ' || new.name || ' אישר/ה הגעה' || case when n > 1 then ' · ' || n || ' אנשים' else '' end
         else '😕 ' || new.name || ' לא יגיע/ה' end,
    ev.name);
  perform public.kick_push();
  return new;
exception when others then
  return new; -- התראה אף פעם לא חוסמת אישור הגעה
end $$;
drop trigger if exists guests_rsvp_notify on public.guests;
create trigger guests_rsvp_notify after insert or update of rsvp, guest_count on public.guests
  for each row execute function public.guests_rsvp_notify();

-- שליחת SMS אוטומטית נכשלה → התראה (אם לא כיבה "התראות אפליקציה")
create or replace function public.sms_run_failed_notify() returns trigger
  language plpgsql security definer set search_path to '' as $$
declare ev record;
begin
  if new.status <> 'failed' or old.status is not distinct from new.status then return new; end if;
  select id, name, settings_json into ev from public.events where id = new.event_id;
  if ev.id is null or coalesce(ev.settings_json->>'notifyApp', 'true') = 'false' then return new; end if;
  insert into public.notify_outbox (event_id, kind, title, body)
    values (new.event_id, 'system', '⚠️ שליחת SMS אוטומטית לא יצאה', ev.name || ': ' || coalesce(new.error, 'שגיאה'));
  perform public.kick_push();
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists sms_run_failed_notify on public.sms_schedule_runs;
create trigger sms_run_failed_notify after update of status on public.sms_schedule_runs
  for each row execute function public.sms_run_failed_notify();

notify pgrst, 'reload schema';
