-- אימות דו־שלבי לאדמין: is_admin() מחזיר true רק כשההתחברות עברה גם קוד מאפליקציית אימות (aal2).
-- כך גם מי שהשיג את סיסמת האדמין לא יכול לקרוא נתוני לקוחות או להפעיל פעולות אדמין.
-- מייל האדמין נשמר ב-app_secrets (key='admin_email', רק השרת קורא) כדי שלא יופיע בקוד.
-- אובדן הטלפון עם אפליקציית האימות: מוחקים את החיבור במסד (auth.mfa_factors של משתמש האדמין) ומחברים מחדש.
create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path to '' as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = coalesce((select lower(value) from public.app_secrets where key = 'admin_email'), '-')
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;
