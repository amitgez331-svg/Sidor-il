-- גיבוי חיצוני (שכבה 2): הגיבוי היומי האחרון מ-backup.snapshots כ-JSON אחד.
-- רק service_role (פונקציית השרת backup-export) יכולה לקרוא לזה — לא דפדפן, לא משתמשים מחוברים.
create or replace function public.backup_latest()
returns jsonb language sql security definer set search_path='' as $$
  select jsonb_build_object(
    'taken_at', max(s.taken_at),
    'tables', jsonb_object_agg(s.tbl, s.data))
  from backup.snapshots s
  where s.taken_at = (select max(taken_at) from backup.snapshots);
$$;
revoke all on function public.backup_latest() from public, anon, authenticated;
grant execute on function public.backup_latest() to service_role;
