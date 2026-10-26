-- ════════════════════════════════════════════════════════════════════════════
-- Sidor-IL · נעילת הרשאות (RLS)  —  הורץ ב-26.10.2026 כ-migrations:
--   rls_step1_helper_and_invite_functions, rls_step1b_get_invite_no_views,
--   rls_step2_lock_tables, rls_step3_is_admin_signed_in_only
-- דף ההזמנה בקוד עובד דרך get_invite / get_invite_guest / submit_rsvp.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── שלב 0: מי האדמין ───────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = 'amitgez331@gmail.com'
$$;
revoke execute on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;

-- בעלים של אירוע (או אדמין)
create or replace function public.owns_event(p_event uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.events e where e.id = p_event and e.user_id = auth.uid())
$$;
grant execute on function public.owns_event(uuid) to authenticated;

-- ─── שלב 1: אירועים — בלי רשימה ציבורית ────────────────────────────────────
drop policy if exists "invites public read"            on public.events;
drop policy if exists "public can view active invites" on public.events;
drop policy if exists "users see own events"           on public.events;
create policy events_owner on public.events for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ─── שלב 2: דף ההזמנה דרך פונקציות (מחזירות רק אירוע אחד לפי קוד) ─────────
-- פרטי ההזמנה לפי קוד, בלי user_id והגדרות פנימיות (לטבלת events אין עמודת views)
create or replace function public.get_invite(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select to_jsonb(e) - 'user_id' - 'settings_json'
    from public.events e where e.invite_code = p_code and e.invite_active limit 1
$$;

-- פרטי אורח מקישור אישי (?g=) — רק אם האורח שייך לאותה הזמנה
create or replace function public.get_invite_guest(p_code text, p_guest uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',g.id,'name',g.name,'phone',g.phone,
                            'guest_count',g.guest_count,'rsvp',g.rsvp)
    from public.guests g join public.events e on e.id = g.event_id
   where e.invite_code = p_code and e.invite_active and g.id = p_guest
$$;

-- אישור הגעה: מזהה כפילות טלפון, מעדכן אורח קיים או יוצר חדש
create or replace function public.submit_rsvp(
  p_code text, p_name text, p_phone text, p_count int, p_rsvp text,
  p_guest uuid default null, p_update_existing boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare ev uuid; d text; existing public.guests;
begin
  select id into ev from public.events where invite_code = p_code and invite_active;
  if ev is null then return jsonb_build_object('status','no_invite'); end if;
  if p_rsvp not in ('confirmed','declined','pending') then p_rsvp := 'pending'; end if;
  p_count := least(greatest(coalesce(p_count,1),1),30);

  -- אורח מזוהה מקישור אישי
  if p_guest is not null then
    update public.guests set rsvp = p_rsvp, guest_count = p_count,
           phone = coalesce(nullif(p_phone,''), phone), views = coalesce(views,0)+1
     where id = p_guest and event_id = ev;
    if found then return jsonb_build_object('status','updated'); end if;
  end if;

  -- אותו טלפון (רק ספרות, 972 = 0)
  d := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  if d like '972%' then d := '0' || substr(d,4); end if;
  if length(d) >= 9 then
    select * into existing from public.guests g
     where g.event_id = ev
       and (case when regexp_replace(coalesce(g.phone,''),'\D','','g') like '972%'
                 then '0'||substr(regexp_replace(g.phone,'\D','','g'),4)
                 else regexp_replace(coalesce(g.phone,''),'\D','','g') end) = d
     limit 1;
    if found then
      if not p_update_existing then
        return jsonb_build_object('status','phone_exists','name',existing.name,
          'guest_count',existing.guest_count,'rsvp',existing.rsvp,'phone',existing.phone);
      end if;
      update public.guests set rsvp = p_rsvp, guest_count = p_count, views = coalesce(views,0)+1
       where id = existing.id;
      return jsonb_build_object('status','updated');
    end if;
  end if;

  insert into public.guests(event_id,name,phone,rsvp,guest_count,views)
  values (ev, left(trim(p_name),120), nullif(p_phone,''), p_rsvp, p_count, 1);
  return jsonb_build_object('status','created');
end $$;

grant execute on function public.get_invite(text)                 to anon, authenticated;
grant execute on function public.get_invite_guest(text, uuid)     to anon, authenticated;
grant execute on function public.submit_rsvp(text,text,text,int,text,uuid,boolean) to anon, authenticated;

-- ─── שלב 3: אורחים, שולחנות, תקציב, יתרת SMS — רק בעל האירוע (או אדמין) ───
drop policy if exists "users see own guests" on public.guests;
create policy guests_owner on public.guests for all to authenticated
  using (public.owns_event(event_id)) with check (public.owns_event(event_id));

drop policy if exists "users see own tables" on public.tables;
create policy tables_owner on public.tables for all to authenticated
  using (public.owns_event(event_id)) with check (public.owns_event(event_id));

drop policy if exists "allow all"     on public.budget_items;
drop policy if exists "budget access" on public.budget_items;
create policy budget_owner on public.budget_items for all to authenticated
  using (public.owns_event(event_id)) with check (public.owns_event(event_id));

-- כרגע אין אף מדיניות → אף אחד לא יכול לקרוא/לכתוב (הפיצ'ר שבור)
create policy sms_owner on public.sms_balance for all to authenticated
  using (public.owns_event(event_id)) with check (public.owns_event(event_id));

-- ─── שלב 4: חבילות — משתמש רואה רק את שלו, רק אדמין מוסיף/מוחק ──────────────
drop policy if exists "Anyone can view packages"   on public.user_packages;
drop policy if exists "Anyone can insert packages" on public.user_packages;
drop policy if exists "Anyone can delete packages" on public.user_packages;
create policy packages_read  on public.user_packages for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy packages_admin on public.user_packages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── שלב 5: ניקיון ──────────────────────────────────────────────────────────
-- delete_user מוחק רק את המשתמש שקורא לה; סוגרים לאורחים לא מחוברים וקובעים search_path
alter function public.delete_user() set search_path = '';
revoke execute on function public.delete_user() from anon, public;
grant  execute on function public.delete_user() to authenticated;

notify pgrst, 'reload schema';
