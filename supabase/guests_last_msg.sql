-- איזו הודעה אחרונה נשלחה לכל אורח (לסטטוס באישורי הגעה: הזמנה ראשונה → תזכורת → מגיע / לא מגיע).
-- מתעדכן בשליחה ידנית (SMS / WhatsApp, מהדפדפן) ובשליחה האוטומטית (sms-scheduler).
-- רק הזמנה ותזכורת נשמרות — הודעות שולחן ותודה לא משנות את מצב אישור ההגעה.
alter table public.guests add column if not exists last_msg text check (last_msg is null or last_msg in ('invite','reminder'));
alter table public.guests add column if not exists last_msg_at timestamptz;
