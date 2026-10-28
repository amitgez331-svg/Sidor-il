-- רשימת מקומות אירועים פנימית: הצעות בשדה "שם האולם" שממלאות גם את הכתובת.
-- מקורות ההצעות (בלי לחשוף כתובות פרטיות של לקוח אחד):
--   1. טבלת venues — אולמות שהאדמין אישר
--   2. מקום שלפחות 2 לקוחות שונים השתמשו בו (כמעט תמיד אולם אמיתי)
--   3. המקומות מהאירועים של המשתמש עצמו
create table if not exists public.venues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  created_at timestamptz not null default now()
);
create unique index if not exists venues_name_key on public.venues (lower(trim(name)));
alter table public.venues enable row level security;
drop policy if exists venues_admin on public.venues;
create policy venues_admin on public.venues for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.venue_suggestions(p_q text) returns table(name text, address text)
  language sql stable security definer set search_path to '' as $$
  with q as (select '%' || replace(replace(replace(trim(coalesce(p_q, '')), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pat),
  cand as (
    select v.name, v.address, 3 as rank from public.venues v
    union all
    select min(trim(e.venue)), mode() within group (order by nullif(trim(e.venue_address), '')), 2
      from public.events e where coalesce(trim(e.venue), '') <> ''
      group by lower(trim(e.venue)) having count(distinct e.user_id) >= 2
    union all
    select trim(e.venue), nullif(trim(e.venue_address), ''), 1 from public.events e
      where coalesce(trim(e.venue), '') <> '' and (e.user_id = auth.uid() or public.is_event_member(e.id))
  ),
  best as (
    select distinct on (lower(c.name)) c.name, c.address, c.rank
      from cand c, q where length(trim(coalesce(p_q, ''))) >= 2 and c.name ilike q.pat
      order by lower(c.name), c.rank desc, (c.address is null)
  )
  select b.name, b.address from best b order by b.rank desc, length(b.name), b.name limit 8
$$;
revoke execute on function public.venue_suggestions(text) from anon;

-- לאדמין: מקומות מהאירועים שעוד לא ברשימה (כדי לאשר ולהוסיף בלחיצה)
create or replace function public.admin_venue_candidates() returns table(name text, address text, users bigint)
  language sql stable security definer set search_path to '' as $$
  select min(trim(e.venue)), mode() within group (order by nullif(trim(e.venue_address), '')), count(distinct e.user_id)
    from public.events e
   where public.is_admin() and coalesce(trim(e.venue), '') <> ''
     and not exists (select 1 from public.venues v where lower(trim(v.name)) = lower(trim(e.venue)))
   group by lower(trim(e.venue))
   order by count(distinct e.user_id) desc, min(trim(e.venue))
$$;
revoke execute on function public.admin_venue_candidates() from anon;
notify pgrst, 'reload schema';
