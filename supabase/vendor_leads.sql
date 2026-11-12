-- פניות לקוחות לספקים: לקוח מחובר שולח "בקשת הצעת מחיר" מפרופיל הספק, והספק רואה אותה באזור הספקים.
create table if not exists public.vendor_leads (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles(user_id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  name text not null check (char_length(name) between 2 and 60),
  phone text not null check (char_length(phone) between 9 and 20),
  event_date date,
  guests int check (guests between 1 and 5000),
  message text check (char_length(message) <= 600),
  status text not null default 'new' check (status in ('new','contacted','quoted','won','closed')),
  quote_price int check (quote_price between 1 and 10000000),
  quote_note text check (char_length(quote_note) <= 600),
  quoted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists vendor_leads_vendor_idx on public.vendor_leads (vendor_id, created_at desc);
create index if not exists vendor_leads_user_idx on public.vendor_leads (user_id, created_at desc);

alter table public.vendor_leads enable row level security;
revoke all on public.vendor_leads from anon;
grant select, insert, update, delete on public.vendor_leads to authenticated;

-- שולחים רק בשם עצמכם, רק לספק מאושר, ולא לעצמכם
drop policy if exists vl_insert on public.vendor_leads;
create policy vl_insert on public.vendor_leads for insert to authenticated
  with check (user_id = auth.uid() and vendor_id <> auth.uid()
    and exists (select 1 from public.vendor_profiles v where v.user_id = vendor_id and v.status = 'approved'));
-- רואים: הספק, מי ששלח, והאדמין
drop policy if exists vl_select on public.vendor_leads;
create policy vl_select on public.vendor_leads for select to authenticated
  using (vendor_id = auth.uid() or user_id = auth.uid() or public.is_admin());
-- מעדכנים (רק שלב הטיפול והצעת המחיר, ראו הטריגר) ומוחקים: הספק או האדמין
drop policy if exists vl_update on public.vendor_leads;
create policy vl_update on public.vendor_leads for update to authenticated
  using (vendor_id = auth.uid() or public.is_admin()) with check (vendor_id = auth.uid() or public.is_admin());
drop policy if exists vl_delete on public.vendor_leads;
create policy vl_delete on public.vendor_leads for delete to authenticated
  using (vendor_id = auth.uid() or public.is_admin());

-- הגבלה נגד הצפה: עד 20 פניות ביום למשתמש, ופנייה אחת לאותו ספק כל 10 דקות
create or replace function public.vendor_leads_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare s text;
begin
  if tg_op = 'INSERT' then
    new.status := 'new';
    new.created_at := now();
    new.quote_price := null; new.quote_note := null; new.quoted_at := null;
    if (select count(*) from public.vendor_leads where user_id = new.user_id and created_at > now() - interval '1 day') >= 20 then
      raise exception 'too many leads today (limit 20)';
    end if;
    if exists (select 1 from public.vendor_leads where user_id = new.user_id and vendor_id = new.vendor_id and created_at > now() - interval '10 minutes') then
      raise exception 'too many leads to this vendor, try later (limit)';
    end if;
    return new;
  end if;
  -- עדכון: הספק משנה רק את שלב הטיפול ואת הצעת המחיר
  if not public.is_admin() then
    old.status := new.status; old.quote_price := new.quote_price; old.quote_note := new.quote_note; old.quoted_at := new.quoted_at;
    return old;
  end if;
  return new;
end $$;
drop trigger if exists vendor_leads_guard on public.vendor_leads;
create trigger vendor_leads_guard before insert or update on public.vendor_leads
  for each row execute function public.vendor_leads_guard();
