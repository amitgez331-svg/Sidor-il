-- התראות Push לאדמין: משתמש חדש נרשם, בקשת רכישת SMS / WhatsApp, ספק חדש, בקשת חשבון מפיק, שליחה אוטומטית שנכשלה.
-- נכנס לאותו תור (notify_outbox) עם kind='admin' בלי אירוע; push-notify שולח למכשירים של האדמין (admin_recipient_ids).
-- כל טריגר עטוף ב-exception: התראה אף פעם לא חוסמת הרשמה או רכישה. לא משנה נתונים קיימים.

-- מי האדמין: המייל נשמר ב-app_secrets (key='admin_email', רק השרת קורא), כדי שלא יופיע בקוד. רק מייל מאומת
create or replace function public.admin_recipient_ids() returns setof uuid
  language sql stable security definer set search_path to '' as $$
  select u.id from auth.users u
   where lower(u.email) = (select lower(value) from public.app_secrets where key = 'admin_email') and u.email_confirmed_at is not null
$$;
revoke execute on function public.admin_recipient_ids() from public, anon, authenticated;

create or replace function public.admin_notify(p_title text, p_body text) returns void
  language plpgsql security definer set search_path to '' as $$
begin
  insert into public.notify_outbox (event_id, kind, title, body) values (null, 'admin', p_title, coalesce(p_body, ''));
  perform public.kick_push();
end $$;
revoke execute on function public.admin_notify(text, text) from public, anon, authenticated;

-- שם האירוע לגוף ההתראה
create or replace function public.event_name_of(p_event uuid) returns text
  language sql stable security definer set search_path to '' as $$
  select coalesce((select name from public.events where id = p_event), '')
$$;
revoke execute on function public.event_name_of(uuid) from public, anon, authenticated;

-- משתמש חדש נרשם
create or replace function public.admin_on_signup() returns trigger
  language plpgsql security definer set search_path to '' as $$
begin
  perform public.admin_notify('🎉 נרשם משתמש חדש', coalesce(new.email, new.phone, ''));
  return new;
exception when others then return new;
end $$;
drop trigger if exists admin_on_signup on auth.users;
create trigger admin_on_signup after insert on auth.users for each row execute function public.admin_on_signup();

-- בקשת רכישת SMS
create or replace function public.admin_on_sms_request() returns trigger
  language plpgsql security definer set search_path to '' as $$
begin
  perform public.admin_notify('🛒 בקשת רכישת SMS',
    coalesce(new.amount::text, '?') || ' הודעות' || coalesce(' · ' || new.price::text || ' ₪', '') || ' · ' || public.event_name_of(new.event_id));
  return new;
exception when others then return new;
end $$;
drop trigger if exists admin_on_sms_request on public.sms_requests;
create trigger admin_on_sms_request after insert on public.sms_requests for each row execute function public.admin_on_sms_request();

-- בקשת רכישת WhatsApp
create or replace function public.admin_on_wa_request() returns trigger
  language plpgsql security definer set search_path to '' as $$
begin
  perform public.admin_notify('💬 בקשת רכישת WhatsApp',
    coalesce(new.records::text, '?') || ' רשומות' || coalesce(' · ' || new.price::text || ' ₪', '') || ' · ' || public.event_name_of(new.event_id));
  return new;
exception when others then return new;
end $$;
drop trigger if exists admin_on_wa_request on public.wa_requests;
create trigger admin_on_wa_request after insert on public.wa_requests for each row execute function public.admin_on_wa_request();

-- ספק חדש
create or replace function public.admin_on_vendor() returns trigger
  language plpgsql security definer set search_path to '' as $$
begin
  perform public.admin_notify(case when new.status = 'pending' then '🏪 ספק חדש מחכה לאישור' else '🏪 ספק חדש נרשם' end,
    coalesce(nullif(new.business_name, ''), 'ספק') || coalesce(' · ' || nullif(new.category, ''), ''));
  return new;
exception when others then return new;
end $$;
drop trigger if exists admin_on_vendor on public.vendor_profiles;
create trigger admin_on_vendor after insert on public.vendor_profiles for each row execute function public.admin_on_vendor();

-- בקשת חשבון מפיק (נוצר פרופיל מפיק)
create or replace function public.admin_on_producer() returns trigger
  language plpgsql security definer set search_path to '' as $$
begin
  perform public.admin_notify('🎬 בקשת חשבון מפיק', coalesce(nullif(new.brand_name, ''), 'מפיק') || coalesce(' · ' || nullif(new.phone, ''), ''));
  return new;
exception when others then return new;
end $$;
drop trigger if exists admin_on_producer on public.producer_profiles;
create trigger admin_on_producer after insert on public.producer_profiles for each row execute function public.admin_on_producer();

-- שליחת SMS אוטומטית נכשלה: גם לאדמין (בעל האירוע כבר מקבל ב-sms_run_failed_notify)
create or replace function public.admin_on_sms_failed() returns trigger
  language plpgsql security definer set search_path to '' as $$
begin
  if new.status <> 'failed' or old.status is not distinct from new.status then return new; end if;
  perform public.admin_notify('⚠️ שליחה אוטומטית נכשלה', public.event_name_of(new.event_id) || ': ' || coalesce(new.error, 'שגיאה'));
  return new;
exception when others then return new;
end $$;
drop trigger if exists admin_on_sms_failed on public.sms_schedule_runs;
create trigger admin_on_sms_failed after update of status on public.sms_schedule_runs for each row execute function public.admin_on_sms_failed();

-- פונקציות הטריגר לא נקראות ישירות מבחוץ
revoke execute on function public.admin_on_signup(), public.admin_on_sms_request(), public.admin_on_wa_request(), public.admin_on_vendor(), public.admin_on_producer(), public.admin_on_sms_failed() from public, anon, authenticated;
