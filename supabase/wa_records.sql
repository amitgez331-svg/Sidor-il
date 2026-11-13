-- WhatsApp: רשומה אחת = אורח אחד = 4 סבבים (הזמנה, תזכורת, מספר שולחן, תודה).
-- ההודעה הראשונה לאורח מורידה רשומה אחת מהיתרה; שאר הסבבים שלו בלי חיוב; כל סבב פעם אחת לכל אורח.
-- רק השרת (send-whatsapp, service role) כותב לטבלאות ומחייב. הלקוח רק קורא.

create table if not exists public.wa_guest_records (
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null primary key references public.guests(id) on delete cascade,
  charged_at timestamptz not null default now()
);
create index if not exists wa_guest_records_event_idx on public.wa_guest_records (event_id);

create table if not exists public.wa_guest_rounds (
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  round text not null check (round in ('invite','reminder','table','thanks')),
  sent_at timestamptz not null default now(),
  primary key (guest_id, round)
);
create index if not exists wa_guest_rounds_event_idx on public.wa_guest_rounds (event_id);

alter table public.wa_guest_records enable row level security;
alter table public.wa_guest_rounds enable row level security;
revoke all on public.wa_guest_records, public.wa_guest_rounds from anon, authenticated;
grant select on public.wa_guest_records, public.wa_guest_rounds to authenticated;
drop policy if exists wa_records_read on public.wa_guest_records;
create policy wa_records_read on public.wa_guest_records for select to authenticated using (public.owns_event(event_id));
drop policy if exists wa_rounds_read on public.wa_guest_rounds;
create policy wa_rounds_read on public.wa_guest_rounds for select to authenticated using (public.owns_event(event_id));

-- חיוב: אורחים שעוד לא חויבו מקבלים רשומה, והיתרה יורדת בבת אחת. אין מספיק — שום דבר לא נשמר
create or replace function public.wa_charge(p_event uuid, p_guests uuid[], p_note text default null)
returns integer language plpgsql security definer set search_path to '' as $$
declare n int; nb int;
begin
  with ins as (
    insert into public.wa_guest_records(event_id, guest_id)
    select p_event, g.id from public.guests g where g.event_id = p_event and g.id = any(p_guests)
    on conflict (guest_id) do nothing
    returning 1)
  select count(*) into n from ins;
  if n = 0 then return coalesce((select balance from public.wa_balance where event_id = p_event), 0); end if;
  update public.wa_balance set balance = balance - n, sent = coalesce(sent,0) + n, updated_at = now()
   where event_id = p_event and balance >= n
  returning balance into nb;
  if nb is null then raise exception 'not enough whatsapp records (need %)', n; end if;
  insert into public.wa_transactions(event_id, records, kind, note) values (p_event, -n, 'send', p_note);
  return nb;
end $$;

-- החזר: אורח שחויב עכשיו אבל ההודעה אליו נכשלה, ועוד לא קיבל אף סבב — הרשומה חוזרת ליתרה
create or replace function public.wa_refund(p_event uuid, p_guests uuid[], p_note text default null)
returns integer language plpgsql security definer set search_path to '' as $$
declare n int; nb int;
begin
  with del as (
    delete from public.wa_guest_records r
     where r.event_id = p_event and r.guest_id = any(p_guests)
       and not exists (select 1 from public.wa_guest_rounds x where x.guest_id = r.guest_id)
    returning 1)
  select count(*) into n from del;
  if n = 0 then return coalesce((select balance from public.wa_balance where event_id = p_event), 0); end if;
  update public.wa_balance set balance = balance + n, sent = greatest(coalesce(sent,0) - n, 0), updated_at = now()
   where event_id = p_event returning balance into nb;
  insert into public.wa_transactions(event_id, records, kind, note) values (p_event, n, 'refund', p_note);
  return nb;
end $$;

-- סימון סבב שנשלח לאורחים
create or replace function public.wa_mark_round(p_event uuid, p_guests uuid[], p_round text)
returns integer language plpgsql security definer set search_path to '' as $$
declare n int;
begin
  with ins as (
    insert into public.wa_guest_rounds(event_id, guest_id, round)
    select p_event, g.id, p_round from public.guests g where g.event_id = p_event and g.id = any(p_guests)
    on conflict (guest_id, round) do nothing
    returning 1)
  select count(*) into n from ins;
  return n;
end $$;

revoke execute on function public.wa_charge(uuid, uuid[], text), public.wa_refund(uuid, uuid[], text), public.wa_mark_round(uuid, uuid[], text) from public, anon, authenticated;
grant execute on function public.wa_charge(uuid, uuid[], text), public.wa_refund(uuid, uuid[], text), public.wa_mark_round(uuid, uuid[], text) to service_role;
