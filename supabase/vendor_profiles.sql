-- ספקים (צלם, DJ, אולם...) שנרשמים לאתר: פרופיל עסק ציבורי + פרטים עסקיים פרטיים.
-- ספק חדש מחכה לאישור המנהל (status='pending'); רק ספק מאושר מוצג לאחרים.
-- "ספק מוביל" (featured) מוצג ראשון ובדף הבית — רק המנהל מסמן, אחרי שדרוג דרך צור קשר.

create table if not exists public.vendor_profiles(
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  business_name text not null check (char_length(btrim(business_name)) between 2 and 80),
  category text not null check (category in ('venue','catering','photo','video','dj','band','producer','design','dress','suit','makeup',
    'attraction','magnets','bar','cake','invitations','rabbi','transport','jewelry','fireworks','lighting','other')),
  contact_name text check (contact_name is null or char_length(contact_name)<=60),
  phone text check (phone is null or char_length(phone)<=20),
  email text check (email is null or char_length(email)<=120),
  website text check (website is null or char_length(website)<=200),
  instagram text check (instagram is null or char_length(instagram)<=200),
  facebook text check (facebook is null or char_length(facebook)<=200),
  region text check (region is null or region in ('north','center','jerusalem','south','all')),
  city text check (city is null or char_length(city)<=40),
  description text check (description is null or char_length(description)<=1000),
  price_from int check (price_from is null or price_from between 0 and 1000000),
  logo_url text check (logo_url is null or char_length(logo_url)<=500),
  photos text[] not null default '{}' check (cardinality(photos)<=6),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text check (reject_reason is null or char_length(reject_reason)<=300),
  verified boolean not null default false,
  featured boolean not null default false,
  featured_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vendor_profiles_list_idx on public.vendor_profiles(status, category);

-- פרטים עסקיים (ע.מ / ח.פ) — לעוסק פטור/מורשה זה מספר ת.ז, ולכן לא ציבורי: רק הספק והמנהל
create table if not exists public.vendor_private(
  user_id uuid primary key default auth.uid() references public.vendor_profiles(user_id) on delete cascade,
  business_type text not null check (business_type in ('patur','murshe','company','amuta')),
  business_id text not null check (business_id ~ '^[0-9]{9}$'),
  updated_at timestamptz not null default now()
);

-- הספק לא יכול לאשר את עצמו או לסמן "מוביל". שינוי שם העסק אחרי אישור מחזיר לבדיקה
create or replace function public.vendor_profile_guard() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  new.updated_at := now();
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.verified := false; new.featured := false; new.featured_until := null; new.reject_reason := null;
    return new;
  end if;
  new.verified := old.verified; new.featured := old.featured; new.featured_until := old.featured_until;
  if new.business_name is distinct from old.business_name or old.status = 'rejected' then
    new.status := 'pending'; new.reject_reason := null;
  else
    new.status := old.status; new.reject_reason := old.reject_reason;
  end if;
  return new;
end $$;
drop trigger if exists vendor_profile_guard on public.vendor_profiles;
create trigger vendor_profile_guard before insert or update on public.vendor_profiles for each row execute function public.vendor_profile_guard();
revoke execute on function public.vendor_profile_guard() from public, anon, authenticated;

alter table public.vendor_profiles enable row level security;
alter table public.vendor_private enable row level security;

-- אורח לא מחובר: רק ספקים מאושרים (ל-anon אין הרשאה להריץ is_admin)
drop policy if exists vp_select on public.vendor_profiles;
drop policy if exists vp_select_anon on public.vendor_profiles;
create policy vp_select_anon on public.vendor_profiles for select to anon using (status = 'approved');
create policy vp_select on public.vendor_profiles for select to authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists vp_insert on public.vendor_profiles;
create policy vp_insert on public.vendor_profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists vp_update on public.vendor_profiles;
create policy vp_update on public.vendor_profiles for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists vp_delete on public.vendor_profiles;
create policy vp_delete on public.vendor_profiles for delete to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists vpr_all on public.vendor_private;
create policy vpr_all on public.vendor_private for all to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

revoke all on public.vendor_profiles, public.vendor_private from anon;
grant select on public.vendor_profiles to anon;
grant select, insert, update, delete on public.vendor_profiles, public.vendor_private to authenticated;

-- הגיבוי היומי כולל גם את הספקים
create or replace function backup.take_snapshot() returns int
language plpgsql security definer set search_path=public,backup as $$
declare t text; n int:=0; ts timestamptz:=now();
begin
  foreach t in array array['events','guests','tables','event_members','budget_items','sms_balance','sms_transactions',
    'wa_balance','wa_transactions','user_packages','hall_templates','producer_profiles','testimonials','plate_prices','vendor_reviews',
    'vendor_profiles','vendor_private'] loop
    if to_regclass('public.'||t) is not null then
      execute format('insert into backup.snapshots(taken_at,tbl,row_count,data) select $1,%L,count(*),coalesce(jsonb_agg(to_jsonb(snap_row)),''[]''::jsonb) from public.%I snap_row',t,t) using ts;
      n:=n+1;
    end if;
  end loop;
  delete from backup.snapshots where taken_at < now()-interval '14 days';
  return n;
end $$;
revoke all on function backup.take_snapshot() from public, anon, authenticated;
