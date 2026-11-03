-- גיבוי יומי בתוך בסיס הנתונים (שכבה 1).
-- כל לילה ב-01:00 UTC נשמר עותק JSON של הטבלאות החשובות ב-backup.snapshots. נשמרים 14 ימים.
-- הסכמה backup לא חשופה ל-API; הגישה רק דרך פונקציות admin_* שבודקות is_admin().
-- מגן ממחיקה בטעות / באג. לא מגן מאובדן הפרויקט כולו (לשם — גיבוי חיצוני או Supabase Pro).

create schema if not exists backup;
revoke all on schema backup from public, anon, authenticated;

create table if not exists backup.snapshots(
  id bigserial primary key,
  taken_at timestamptz not null default now(),
  tbl text not null,
  row_count int not null,
  data jsonb not null
);
create index if not exists snapshots_taken_idx on backup.snapshots(taken_at, tbl);

create or replace function backup.take_snapshot() returns int
language plpgsql security definer set search_path=public,backup as $$
declare t text; n int:=0; ts timestamptz:=now();
begin
  foreach t in array array['events','guests','tables','event_members','budget_items','sms_balance','sms_transactions',
    'wa_balance','wa_transactions','user_packages','hall_templates','producer_profiles','testimonials','plate_prices','vendor_reviews'] loop
    if to_regclass('public.'||t) is not null then
      -- הכינוי snap_row ולא x: לטבלת tables יש עמודה בשם x
      execute format('insert into backup.snapshots(taken_at,tbl,row_count,data) select $1,%L,count(*),coalesce(jsonb_agg(to_jsonb(snap_row)),''[]''::jsonb) from public.%I snap_row',t,t) using ts;
      n:=n+1;
    end if;
  end loop;
  delete from backup.snapshots where taken_at < now()-interval '14 days';
  return n;
end $$;
revoke all on function backup.take_snapshot() from public, anon, authenticated;

select cron.schedule('daily-backup','0 1 * * *','select backup.take_snapshot()');

-- ─── למנהל: רשימת גיבויים ───
create or replace function public.admin_backup_list()
returns table(taken_at timestamptz, events int, guests int, tables int)
language plpgsql security definer set search_path=public,backup as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query
    select s.taken_at,
      max(case when s.tbl='events' then s.row_count end)::int,
      max(case when s.tbl='guests' then s.row_count end)::int,
      max(case when s.tbl='tables' then s.row_count end)::int
    from backup.snapshots s group by s.taken_at order by s.taken_at desc;
end $$;

-- ─── למנהל: מה היה באירוע בגיבוי מסוים (לפני שמשחזרים) ───
create or replace function public.admin_backup_event(p_taken timestamptz, p_event uuid)
returns jsonb language plpgsql security definer set search_path=public,backup as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'event',(select e from backup.snapshots s, jsonb_array_elements(s.data) e where s.taken_at=p_taken and s.tbl='events' and e->>'id'=p_event::text limit 1),
    'guests',(select count(*) from backup.snapshots s, jsonb_array_elements(s.data) e where s.taken_at=p_taken and s.tbl='guests' and e->>'event_id'=p_event::text),
    'tables',(select count(*) from backup.snapshots s, jsonb_array_elements(s.data) e where s.taken_at=p_taken and s.tbl='tables' and e->>'event_id'=p_event::text),
    'now_guests',(select count(*) from guests where event_id=p_event),
    'now_tables',(select count(*) from tables where event_id=p_event)) into r;
  return r;
end $$;

-- ─── למנהל: שחזור אירוע (אורחים, שולחנות והגדרות המפה) מגיבוי ───
-- קודם נלקח גיבוי של המצב הנוכחי (אפשר לחזור אחורה). הטריגרים כבויים בזמן השחזור כדי שלא יישלחו התראות "אישר הגעה"
create or replace function public.admin_restore_event(p_taken timestamptz, p_event uuid)
returns jsonb language plpgsql security definer set search_path=public,backup as $$
declare g int; t int; ev jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if not exists(select 1 from backup.snapshots where taken_at=p_taken and tbl='guests') then raise exception 'backup not found'; end if;
  perform backup.take_snapshot();
  set local session_replication_role = replica;
  delete from guests where event_id=p_event;
  delete from tables where event_id=p_event;
  insert into tables select * from jsonb_populate_recordset(null::public.tables,
    (select coalesce(jsonb_agg(e),'[]'::jsonb) from backup.snapshots s, jsonb_array_elements(s.data) e where s.taken_at=p_taken and s.tbl='tables' and e->>'event_id'=p_event::text));
  get diagnostics t = row_count;
  insert into guests select * from jsonb_populate_recordset(null::public.guests,
    (select coalesce(jsonb_agg(e),'[]'::jsonb) from backup.snapshots s, jsonb_array_elements(s.data) e where s.taken_at=p_taken and s.tbl='guests' and e->>'event_id'=p_event::text));
  get diagnostics g = row_count;
  select e into ev from backup.snapshots s, jsonb_array_elements(s.data) e where s.taken_at=p_taken and s.tbl='events' and e->>'id'=p_event::text limit 1;
  if ev is not null then update events set settings_json=ev->'settings_json' where id=p_event; end if;
  set local session_replication_role = origin;
  return jsonb_build_object('guests',g,'tables',t);
end $$;

revoke execute on function public.admin_backup_list(), public.admin_backup_event(timestamptz,uuid), public.admin_restore_event(timestamptz,uuid) from public, anon;
grant execute on function public.admin_backup_list(), public.admin_backup_event(timestamptz,uuid), public.admin_restore_event(timestamptz,uuid) to authenticated;
