-- הקשחת אבטחה (נובמבר 2026). לא משנה התנהגות לגולשים — רק סוגר דברים שלא היו צריכים להיות פתוחים.

-- 1) פונקציות מנהל ופונקציות פנימיות: לא נגישות למי שלא מחובר.
--    (פונקציות המנהל כבר בודקות is_admin() בפנים — זו שכבה נוספת.)
revoke execute on function public.admin_add_wa(uuid,integer,text,uuid) from public, anon;
grant  execute on function public.admin_add_wa(uuid,integer,text,uuid) to authenticated;
revoke execute on function public.admin_reject_wa_request(uuid) from public, anon;
grant  execute on function public.admin_reject_wa_request(uuid) to authenticated;
revoke execute on function public.admin_venue_candidates() from public, anon;
grant  execute on function public.admin_venue_candidates() to authenticated;
revoke execute on function public.request_wa(uuid,integer,numeric) from public, anon;
grant  execute on function public.request_wa(uuid,integer,numeric) to authenticated;
-- פונקציות טריגר: רצות מעצמן בשינוי שורה; אף אחד לא צריך לקרוא להן ישירות
revoke execute on function public.events_keep_owner() from public, anon, authenticated;
revoke execute on function public.guests_rsvp_notify() from public, anon, authenticated;
revoke execute on function public.sms_run_failed_notify() from public, anon, authenticated;

-- 2) אחסון התמונות: גולש לא מחובר לא יכול לקבל רשימה של כל הקבצים
--    (הצגת תמונה לפי הכתובת שלה ממשיכה לעבוד — הדלי ציבורי). משתמש מחובר רואה ברשימה רק את הקבצים שלו.
drop policy if exists "allow all 1o4y39n_0" on storage.objects;
drop policy if exists event_images_select on storage.objects;
create policy event_images_select on storage.objects for select to authenticated
  using (bucket_id = 'event-images' and (owner_id = (auth.uid())::text or public.is_admin()));
--    רק תמונות, עד 10MB (בלי SVG ובלי קבצי HTML — שלא יוכלו להעלות דף אינטרנט לשרת שלנו)
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
 where id = 'event-images';

-- 3) אישור הגעה: מי שמקליד טלפון שכבר רשום מקבל רק את השם הפרטי של האורח הקיים —
--    בלי מזהה האורח ובלי מספר הטלפון המלא (קודם חזרו כל הפרטים לכל מי שיש לו את קישור ההזמנה)
create or replace function public.submit_rsvp(p_code text, p_name text, p_phone text, p_count integer, p_rsvp text, p_guest uuid DEFAULT NULL::uuid, p_update_existing boolean DEFAULT false, p_extra jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare ev uuid; d text; existing public.guests; x jsonb;
begin
  select id into ev from public.events where invite_code = p_code and invite_active;
  if ev is null then return jsonb_build_object('status','no_invite'); end if;
  if p_rsvp is null or p_rsvp not in ('confirmed','declined','pending') then p_rsvp := 'pending'; end if;
  p_count := least(greatest(coalesce(p_count,1),1),30);
  x := case when jsonb_typeof(p_extra) = 'object' and length(p_extra::text) <= 2000 then p_extra end;

  if p_guest is not null then
    update public.guests set rsvp = p_rsvp, guest_count = p_count,
           phone = coalesce(nullif(p_phone,''), phone), views = coalesce(views,0)+1,
           rsvp_extra = coalesce(x, rsvp_extra)
     where id = p_guest and event_id = ev;
    if found then return jsonb_build_object('status','updated'); end if;
  end if;

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
        return jsonb_build_object('status','phone_exists',
          'name', split_part(trim(coalesce(existing.name,'')),' ',1),
          'guest_count', existing.guest_count, 'rsvp', existing.rsvp);
      end if;
      update public.guests set rsvp = p_rsvp, guest_count = p_count, views = coalesce(views,0)+1,
             rsvp_extra = coalesce(x, rsvp_extra)
       where id = existing.id;
      return jsonb_build_object('status','updated');
    end if;
  end if;

  if coalesce(trim(p_name),'') = '' then return jsonb_build_object('status','no_name'); end if;
  insert into public.guests(event_id,name,phone,rsvp,guest_count,views,rsvp_extra)
  values (ev, left(trim(p_name),120), nullif(trim(coalesce(p_phone,'')),''), p_rsvp, p_count, 1, x);
  return jsonb_build_object('status','created');
end $function$;
