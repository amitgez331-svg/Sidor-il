-- מחיקת אירוע מלוח הניהול.
-- מחיקת אירוע מוחקת (cascade) גם אורחים, שולחנות, יתרות ותנועות SMS/WhatsApp ובקשות רכישה.
-- לכן קודם נשמר סיכום ביומן deleted_events_log: פרטי האירוע ורשומות הרכישה (חובת שמירה של 7 שנים לפי דיני המס).
-- פרטי האורחים עצמם לא נשמרים ביומן — רק כמה היו.

create table if not exists public.deleted_events_log(
  id bigserial primary key,
  event_id uuid not null,
  user_id uuid,
  name text,
  event_date date,
  guests int,
  sms jsonb,
  wa jsonb,
  deleted_by uuid default auth.uid(),
  deleted_at timestamptz not null default now()
);
alter table public.deleted_events_log enable row level security;
revoke all on public.deleted_events_log from anon, authenticated;

create or replace function public.admin_delete_event(p_event uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.events; g int; t int;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into ev from public.events where id = p_event;
  if not found then raise exception 'event not found'; end if;
  select count(*) into g from public.guests where event_id = p_event;
  select count(*) into t from public.tables where event_id = p_event;
  insert into public.deleted_events_log(event_id, user_id, name, event_date, guests, sms, wa)
  values (p_event, ev.user_id, ev.name, ev.date, g,
    jsonb_build_object(
      'balance', (select to_jsonb(b) from public.sms_balance b where b.event_id = p_event),
      'requests', (select coalesce(jsonb_agg(to_jsonb(r)), '[]') from public.sms_requests r where r.event_id = p_event),
      'transactions', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public.sms_transactions x where x.event_id = p_event)),
    jsonb_build_object(
      'balance', (select to_jsonb(b) from public.wa_balance b where b.event_id = p_event),
      'requests', (select coalesce(jsonb_agg(to_jsonb(r)), '[]') from public.wa_requests r where r.event_id = p_event),
      'transactions', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public.wa_transactions x where x.event_id = p_event)));
  delete from public.events where id = p_event;
  return jsonb_build_object('guests', g, 'tables', t);
end $$;

revoke execute on function public.admin_delete_event(uuid) from public, anon;
grant execute on function public.admin_delete_event(uuid) to authenticated;
