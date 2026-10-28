-- שדות ממסך "פרטי האירוע" (הגדרות) שלא היו בטבלה, ולכן כל שמירה של המסך נדחתה
-- (כולל שם החתן והכלה). כולן טקסט ואופציונליות; לא משנה נתונים קיימים.
alter table public.events
  add column if not exists groom_father   text,
  add column if not exists bride_father   text,
  add column if not exists reception_time text,
  add column if not exists venue_map      text,
  add column if not exists venue_phone    text,
  add column if not exists personal_text  text,
  add column if not exists name_display   text default 'full',
  add column if not exists my_role        text;
