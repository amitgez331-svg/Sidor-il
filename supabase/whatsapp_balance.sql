-- יתרת WhatsApp לכל אירוע, ברשומות: רשומה = אורח אחד = סבב של 4 הודעות (₪1.8).
-- טבלאות נפרדות לגמרי מ-SMS (לא נוגעים בטבלאות ובפונקציות של SMS). לא משנה נתונים קיימים.

create table if not exists public.wa_balance (
  event_id   uuid primary key references public.events(id) on delete cascade,
  balance    integer not null default 0,
  purchased  integer not null default 0,
  sent       integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.wa_balance enable row level security;
drop policy if exists wa_balance_read on public.wa_balance;
create policy wa_balance_read on public.wa_balance for select to authenticated using (public.owns_event(event_id));

create table if not exists public.wa_requests (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null default auth.uid(),
  records    integer not null,
  price      numeric,
  status     text not null default 'pending',
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
alter table public.wa_requests enable row level security;
drop policy if exists wa_requests_read on public.wa_requests;
create policy wa_requests_read on public.wa_requests for select to authenticated using (public.owns_event(event_id));

create table if not exists public.wa_transactions (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  records    integer not null,
  kind       text not null,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.wa_transactions enable row level security;
drop policy if exists wa_tx_read on public.wa_transactions;
create policy wa_tx_read on public.wa_transactions for select to authenticated using (public.owns_event(event_id));

-- בקשת רכישה (רק בעל האירוע)
create or replace function public.request_wa(p_event uuid, p_records integer, p_price numeric)
  returns uuid language plpgsql security definer set search_path to '' as $$
declare rid uuid;
begin
  if not exists (select 1 from public.events e where e.id = p_event and e.user_id = auth.uid()) then
    raise exception 'not your event';
  end if;
  if p_records <= 0 or p_records > 100000 then raise exception 'bad amount'; end if;
  insert into public.wa_requests(event_id, user_id, records, price) values (p_event, auth.uid(), p_records, p_price)
  returning id into rid;
  return rid;
end $$;

-- אדמין: טעינת רשומות (מספר שלילי = הורדה) ואישור הבקשה אם צוינה
create or replace function public.admin_add_wa(p_event uuid, p_records integer, p_note text default null, p_request uuid default null)
  returns integer language plpgsql security definer set search_path to '' as $$
declare nb int;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_records = 0 or abs(p_records) > 100000 then raise exception 'bad amount'; end if;
  insert into public.wa_balance(event_id, balance, purchased) values (p_event, greatest(p_records, 0), greatest(p_records, 0))
  on conflict (event_id) do update
     set balance = greatest(public.wa_balance.balance + p_records, 0),
         purchased = public.wa_balance.purchased + greatest(p_records, 0),
         updated_at = now()
  returning balance into nb;
  insert into public.wa_transactions(event_id, records, kind, note) values (p_event, p_records, 'admin', p_note);
  if p_request is not null then
    update public.wa_requests set status = 'approved', handled_at = now() where id = p_request and event_id = p_event;
  end if;
  return nb;
end $$;

create or replace function public.admin_reject_wa_request(p_request uuid) returns void
  language plpgsql security definer set search_path to '' as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update public.wa_requests set status = 'rejected', handled_at = now() where id = p_request and status = 'pending';
end $$;

notify pgrst, 'reload schema';
