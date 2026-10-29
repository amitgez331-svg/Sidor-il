-- נייד של בעל השמחה (פרטי האירוע) — ליצירת קשר. לא משנה נתונים קיימים.
alter table public.events add column if not exists host_phone text;
notify pgrst, 'reload schema';
