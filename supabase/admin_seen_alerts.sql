-- "צריך טיפול" באדמין: פריטים שסימנתי כמטופלים (נעלמים מהרשימה בכל מכשיר).
-- המפתח בנוי מתוכן הפריט, כך שאם משהו משתנה (בקשה חדשה, מספר אחר) הפריט חוזר.
create table if not exists public.admin_seen_alerts (
  key text primary key check (char_length(key) <= 600),
  seen_at timestamptz not null default now()
);
alter table public.admin_seen_alerts enable row level security;
revoke all on public.admin_seen_alerts from anon;
grant select, insert, update, delete on public.admin_seen_alerts to authenticated;
drop policy if exists admin_seen_all on public.admin_seen_alerts;
create policy admin_seen_all on public.admin_seen_alerts for all to authenticated using (public.is_admin()) with check (public.is_admin());
