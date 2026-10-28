-- כניסה לאולם, מעקב מתנות ושיתוף אירוע. לא משנה נתונים קיימים.

-- 1. אורחים: מתי נכנס לאולם + הערה למתנה (הסכום כבר בעמודה gift)
alter table public.guests
  add column if not exists arrived_at timestamptz,
  add column if not exists gift_note  text;

-- 2. שיתוף אירוע לפי מייל (בן/בת זוג, הורים)
create table if not exists public.event_members (
  event_id   uuid not null references public.events(id) on delete cascade,
  email      text not null check (email = lower(email)),
  created_at timestamptz not null default now(),
  primary key (event_id, email)
);
alter table public.event_members enable row level security;

-- המייל של המשתמש המחובר, רק אם אומת (כדי שאי אפשר יהיה להירשם עם מייל של מישהו אחר ולקבל גישה)
create or replace function public.my_verified_email() returns text
  language sql stable security definer set search_path to '' as $$
  select lower(u.email) from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
$$;

create or replace function public.is_event_owner(p_event uuid) returns boolean
  language sql stable security definer set search_path to '' as $$
  select exists (select 1 from public.events e where e.id = p_event and e.user_id = auth.uid())
$$;

create or replace function public.is_event_member(p_event uuid) returns boolean
  language sql stable security definer set search_path to '' as $$
  select exists (select 1 from public.event_members m where m.event_id = p_event and m.email = public.my_verified_email())
$$;

-- אורחים, שולחנות, תקציב ו-SMS: גם מי שהאירוע שותף איתו
create or replace function public.owns_event(p_event uuid) returns boolean
  language sql stable security definer set search_path to '' as $$
  select public.is_admin()
      or exists (select 1 from public.events e where e.id = p_event and e.user_id = auth.uid())
      or public.is_event_member(p_event)
$$;

-- האירוע עצמו: מי שהאירוע שותף איתו יכול לראות ולעדכן (לא למחוק)
drop policy if exists events_member_read on public.events;
create policy events_member_read on public.events for select to authenticated using (public.is_event_member(id));
drop policy if exists events_member_update on public.events;
create policy events_member_update on public.events for update to authenticated
  using (public.is_event_member(id)) with check (public.is_event_member(id));

-- אף אחד חוץ מהאדמין לא מעביר בעלות על אירוע
create or replace function public.events_keep_owner() returns trigger
  language plpgsql security definer set search_path to '' as $$
begin
  if new.user_id is distinct from old.user_id and not public.is_admin() then
    raise exception 'cannot change event owner';
  end if;
  return new;
end $$;
drop trigger if exists events_keep_owner on public.events;
create trigger events_keep_owner before update on public.events for each row execute function public.events_keep_owner();

-- רשימת השיתופים: בעל האירוע מנהל; מי ששותף רואה את השורה שלו
drop policy if exists members_owner on public.event_members;
create policy members_owner on public.event_members for all to authenticated
  using (public.is_event_owner(event_id) or public.is_admin()) with check (public.is_event_owner(event_id) or public.is_admin());
drop policy if exists members_self_read on public.event_members;
create policy members_self_read on public.event_members for select to authenticated
  using (email = public.my_verified_email());

-- החבילות של בעל האירוע (למי שהאירוע שותף איתו)
create or replace function public.event_packages(p_event uuid) returns text[]
  language sql stable security definer set search_path to '' as $$
  select case when public.owns_event(p_event) then
    (select coalesce(array_agg(up.package_id), '{}') from public.user_packages up
       join public.events e on e.user_id = up.user_id where e.id = p_event)
  end
$$;

revoke execute on function public.event_packages(uuid) from anon;
notify pgrst, 'reload schema';
