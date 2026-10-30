-- שאלות נוספות באישור ההגעה + המלצות לקוחות + נתונים ציבוריים לדף הבית. לא משנה נתונים קיימים.

-- 1. תשובות נוספות של האורח (מנות, ילדים, אלרגיות, הסעה)
--    {"meals":{"רגיל":2,"טבעוני":1},"kids":1,"allergies":"בוטנים","transport":true}
alter table public.guests add column if not exists rsvp_extra jsonb;

-- submit_rsvp עם פרמטר חדש p_extra (אופציונלי). שאר ההתנהגות בדיוק כמו קודם
drop function if exists public.submit_rsvp(text, text, text, integer, text, uuid, boolean);
create or replace function public.submit_rsvp(p_code text, p_name text, p_phone text, p_count integer, p_rsvp text,
                                              p_guest uuid default null, p_update_existing boolean default false, p_extra jsonb default null)
  returns jsonb language plpgsql security definer set search_path to '' as $function$
declare ev uuid; d text; existing public.guests; x jsonb;
begin
  select id into ev from public.events where invite_code = p_code and invite_active;
  if ev is null then return jsonb_build_object('status','no_invite'); end if;
  if p_rsvp is null or p_rsvp not in ('confirmed','declined','pending') then p_rsvp := 'pending'; end if;
  p_count := least(greatest(coalesce(p_count,1),1),30);
  -- רק אובייקט קטן נשמר
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
        return jsonb_build_object('status','phone_exists','id',existing.id,'name',existing.name,
          'guest_count',existing.guest_count,'rsvp',existing.rsvp,'phone',existing.phone);
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
grant execute on function public.submit_rsvp(text, text, text, integer, text, uuid, boolean, jsonb) to anon, authenticated;

-- קישור אישי: מחזירים גם את התשובות הנוספות כדי שהאורח יראה מה ענה
create or replace function public.get_invite_guest(p_code text, p_guest uuid) returns jsonb
  language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('id',g.id,'name',g.name,'phone',g.phone,
                            'guest_count',g.guest_count,'rsvp',g.rsvp,
                            'table_id',g.table_id,'table_name',t.name,'rsvp_extra',g.rsvp_extra)
    from public.guests g
    join public.events e on e.id = g.event_id
    left join public.tables t on t.id = g.table_id
   where e.invite_code = p_code and e.invite_active and g.id = p_guest
$$;

-- 2. המלצות לקוחות: לקוח שולח (ממתינה), האדמין מאשר. רק מאושרות מוצגות בדף הבית
create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid default auth.uid(),
  name        text not null,
  event_label text,
  text        text not null,
  rating      int check (rating between 1 and 5),
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.testimonials enable row level security;
-- מבקר לא מחובר: רק מאושרות (בלי לקרוא לפונקציית האדמין, שאין לו הרשאה אליה)
drop policy if exists testimonials_public_read on public.testimonials;
drop policy if exists testimonials_anon_read on public.testimonials;
create policy testimonials_anon_read on public.testimonials for select to anon using (approved);
drop policy if exists testimonials_auth_read on public.testimonials;
create policy testimonials_auth_read on public.testimonials for select to authenticated
  using (approved or public.is_admin() or user_id = auth.uid());
drop policy if exists testimonials_user_insert on public.testimonials;
create policy testimonials_user_insert on public.testimonials for insert to authenticated
  with check ((user_id = auth.uid() and not approved) or public.is_admin());
drop policy if exists testimonials_admin_update on public.testimonials;
create policy testimonials_admin_update on public.testimonials for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists testimonials_admin_delete on public.testimonials;
create policy testimonials_admin_delete on public.testimonials for delete to authenticated using (public.is_admin());

-- 3. נתונים ציבוריים לדף הבית (רק מספרים כוללים, בלי שום פרט אישי)
create or replace function public.public_stats() returns jsonb
  language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'events', (select count(*) from public.events),
    'guests', (select coalesce(sum(coalesce(guest_count, 1)), 0) from public.guests),
    'seated', (select count(*) from public.guests where table_id is not null))
$$;
grant execute on function public.public_stats() to anon, authenticated;

notify pgrst, 'reload schema';
