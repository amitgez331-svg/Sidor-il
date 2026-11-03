-- ספקים ומחירים: המלצות על ספקים + דיווחי מחיר למנה.
-- מתפרסם מיד לכל המשתמשים הרשומים. דיווח חריג מסומן אוטומטית (flagged) ומגיע לאישור בלוח הניהול.
-- דיווחי המחיר אנונימיים: האפליקציה לא מציגה מי דיווח.

create table if not exists public.plate_prices(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  venue_name text not null check (char_length(btrim(venue_name)) between 2 and 80),
  venue_key text generated always as (lower(regexp_replace(btrim(venue_name),'\s+',' ','g'))) stored,
  city text check (city is null or char_length(city)<=40),
  event_date date not null,
  guests int not null check (guests between 1 and 5000),
  price numeric(8,2) not null check (price>0 and price<100000),
  event_type text check (event_type is null or event_type in ('wedding','bar_mitzvah','brit','business','other')),
  includes text check (includes is null or char_length(includes)<=200),
  hidden boolean not null default false,
  flagged boolean not null default false,
  flag_reason text,
  created_at timestamptz not null default now()
);
create index if not exists plate_prices_venue_idx on public.plate_prices(venue_key);
-- המדווח בוחר: בעילום שם (null) או שם פרטי
alter table public.plate_prices add column if not exists author_name text check (author_name is null or char_length(author_name)<=30);

create table if not exists public.vendor_reviews(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check (category in ('venue','catering','dj','band','photo','design','makeup','attraction','other')),
  vendor_name text not null check (char_length(btrim(vendor_name)) between 2 and 80),
  vendor_key text generated always as (lower(regexp_replace(btrim(vendor_name),'\s+',' ','g'))) stored,
  city text check (city is null or char_length(city)<=40),
  rating int not null check (rating between 1 and 5),
  body text check (body is null or char_length(body)<=800),
  author_name text check (author_name is null or char_length(author_name)<=30),
  hidden boolean not null default false,
  flagged boolean not null default false,
  flag_reason text,
  created_at timestamptz not null default now()
);
create index if not exists vendor_reviews_vendor_idx on public.vendor_reviews(category,vendor_key);

-- ─── סימון חריגים (רץ בשרת, אי אפשר לעקוף מהדפדפן) ───
create or replace function public.plate_price_flag() returns trigger
language plpgsql security definer set search_path=public as $$
declare med numeric; n int; allmed numeric; alln int;
begin
  new.flagged:=false; new.flag_reason:=null; new.hidden:=false;
  select percentile_cont(0.5) within group (order by price), count(*) into med,n
    from plate_prices where venue_key=lower(regexp_replace(btrim(new.venue_name),'\s+',' ','g')) and not hidden;
  if n>=2 and abs(new.price-med)/med>0.4 then
    new.flagged:=true; new.flag_reason:=format('שונה מאוד מ-%s הדיווחים האחרים על האולם (חציון ₪%s)',n,round(med));
  else
    select percentile_cont(0.5) within group (order by price), count(*) into allmed,alln from plate_prices where not hidden;
    if alln>=5 and (new.price>allmed*2.5 or new.price<allmed*0.4) then
      new.flagged:=true; new.flag_reason:=format('רחוק מאוד מהחציון הכללי (₪%s)',round(allmed));
    elsif new.price<40 or new.price>2000 then
      new.flagged:=true; new.flag_reason:='מחיר למנה לא סביר';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists plate_price_flag on public.plate_prices;
create trigger plate_price_flag before insert on public.plate_prices for each row execute function public.plate_price_flag();

create or replace function public.vendor_review_flag() returns trigger
language plpgsql security definer set search_path=public as $$
declare av numeric; n int;
begin
  new.flagged:=false; new.flag_reason:=null; new.hidden:=false;
  select avg(rating), count(*) into av,n from vendor_reviews
    where category=new.category and vendor_key=lower(regexp_replace(btrim(new.vendor_name),'\s+',' ','g')) and not hidden;
  if n>=3 and abs(new.rating-av)>=2.5 then
    new.flagged:=true; new.flag_reason:=format('שונה מאוד מ-%s הדירוגים האחרים (ממוצע %s)',n,round(av,1));
  end if;
  return new;
end $$;
drop trigger if exists vendor_review_flag on public.vendor_reviews;
create trigger vendor_review_flag before insert on public.vendor_reviews for each row execute function public.vendor_review_flag();

-- ─── הרשאות ───
alter table public.plate_prices enable row level security;
alter table public.vendor_reviews enable row level security;

drop policy if exists pp_select on public.plate_prices;
create policy pp_select on public.plate_prices for select to authenticated using (not hidden or user_id=auth.uid() or public.is_admin());
drop policy if exists pp_insert on public.plate_prices;
create policy pp_insert on public.plate_prices for insert to authenticated with check (user_id=auth.uid());
drop policy if exists pp_admin_update on public.plate_prices;
create policy pp_admin_update on public.plate_prices for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists pp_delete on public.plate_prices;
create policy pp_delete on public.plate_prices for delete to authenticated using (user_id=auth.uid() or public.is_admin());

drop policy if exists vr_select on public.vendor_reviews;
create policy vr_select on public.vendor_reviews for select to authenticated using (not hidden or user_id=auth.uid() or public.is_admin());
drop policy if exists vr_insert on public.vendor_reviews;
create policy vr_insert on public.vendor_reviews for insert to authenticated with check (user_id=auth.uid());
drop policy if exists vr_admin_update on public.vendor_reviews;
create policy vr_admin_update on public.vendor_reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists vr_delete on public.vendor_reviews;
create policy vr_delete on public.vendor_reviews for delete to authenticated using (user_id=auth.uid() or public.is_admin());

-- פונקציות הטריגר רצות רק מהטריגר, לא כ-RPC
revoke execute on function public.plate_price_flag() from public, anon, authenticated;
revoke execute on function public.vendor_review_flag() from public, anon, authenticated;

revoke all on public.plate_prices, public.vendor_reviews from anon;
grant select, insert, update, delete on public.plate_prices, public.vendor_reviews to authenticated;
