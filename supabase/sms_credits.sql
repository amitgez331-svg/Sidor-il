-- ════════════════════════════════════════════════════════════════════════════
-- Sidor-IL · יתרת SMS מאובטחת  —  הורץ ב-27.10.2026 כ-migration: sms_credits_ledger_and_secure_balance
-- יתרה משתנה רק דרך השרת (שליחה) או האדמין (הוספה ידנית / אישור בקשת רכישה).
-- ════════════════════════════════════════════════════════════════════════════

-- יתרה אחת לכל אירוע, לא שלילית
alter table public.sms_balance add constraint sms_balance_event_unique unique (event_id);
alter table public.sms_balance alter column balance set not null, alter column balance set default 0;
alter table public.sms_balance add constraint sms_balance_nonneg check (balance >= 0);

-- יומן של כל שינוי ביתרה (הוספת אדמין, שליחה, החזר)
create table if not exists public.sms_transactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  amount int not null,                       -- + הוספה / - שימוש
  kind text not null check (kind in ('admin','purchase','send','refund')),
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists sms_transactions_event_idx on public.sms_transactions(event_id, created_at desc);
alter table public.sms_transactions enable row level security;
create policy sms_tx_read on public.sms_transactions for select to authenticated using (public.owns_event(event_id));

-- בקשות רכישה (תשלום ידני, האדמין מאשר)
create table if not exists public.sms_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  amount int not null check (amount > 0 and amount <= 100000),
  price numeric,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
alter table public.sms_requests enable row level security;
create policy sms_req_read on public.sms_requests for select to authenticated using (public.owns_event(event_id));

-- יתרה: קריאה בלבד לבעל האירוע/אדמין. כל שינוי דרך הפונקציות למטה
drop policy if exists sms_owner on public.sms_balance;
create policy sms_read on public.sms_balance for select to authenticated using (public.owns_event(event_id));

-- לקוח מבקש לרכוש (לא משנה יתרה)
create or replace function public.request_sms(p_event uuid, p_amount int, p_price numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare rid uuid;
begin
  if not exists (select 1 from public.events e where e.id = p_event and e.user_id = auth.uid()) then
    raise exception 'not your event';
  end if;
  insert into public.sms_requests(event_id, user_id, amount, price) values (p_event, auth.uid(), p_amount, p_price)
  returning id into rid;
  return rid;
end $$;

-- אדמין מוסיף/מוריד יתרה (ואופציונלית מאשר בקשה)
create or replace function public.admin_add_sms(p_event uuid, p_amount int, p_note text default null, p_request uuid default null)
returns int language plpgsql security definer set search_path = '' as $$
declare nb int;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_amount = 0 or abs(p_amount) > 100000 then raise exception 'bad amount'; end if;
  insert into public.sms_balance(event_id, balance, total_purchased, total_sent)
       values (p_event, greatest(p_amount,0), greatest(p_amount,0), 0)
  on conflict (event_id) do update
     set balance = greatest(public.sms_balance.balance + p_amount, 0),
         total_purchased = public.sms_balance.total_purchased + greatest(p_amount,0),
         updated_at = now()
  returning balance into nb;
  insert into public.sms_transactions(event_id, amount, kind, note) values (p_event, p_amount, 'admin', p_note);
  if p_request is not null then
    update public.sms_requests set status = 'approved', handled_at = now() where id = p_request and event_id = p_event;
  end if;
  return nb;
end $$;

create or replace function public.admin_reject_sms_request(p_request uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update public.sms_requests set status = 'rejected', handled_at = now() where id = p_request and status = 'pending';
end $$;

-- שרת בלבד: הורדה אטומית לפני שליחה; מחזיר יתרה חדשה או -1 אם אין מספיק
create or replace function public.sms_debit(p_event uuid, p_amount int, p_note text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare nb int;
begin
  update public.sms_balance set balance = balance - p_amount, total_sent = total_sent + p_amount, updated_at = now()
   where event_id = p_event and balance >= p_amount
  returning balance into nb;
  if nb is null then return -1; end if;
  insert into public.sms_transactions(event_id, amount, kind, note, created_by) values (p_event, -p_amount, 'send', p_note, null);
  return nb;
end $$;

create or replace function public.sms_refund(p_event uuid, p_amount int, p_note text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare nb int;
begin
  update public.sms_balance set balance = balance + p_amount, total_sent = greatest(total_sent - p_amount,0), updated_at = now()
   where event_id = p_event returning balance into nb;
  insert into public.sms_transactions(event_id, amount, kind, note, created_by) values (p_event, p_amount, 'refund', p_note, null);
  return nb;
end $$;

-- אדמין: רשימת משתמשים עם מייל
create or replace function public.admin_list_users()
returns table(user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query select u.id, u.email::text, u.created_at, u.last_sign_in_at from auth.users u order by u.created_at desc;
end $$;

revoke execute on function public.request_sms(uuid,int,numeric) from public, anon;
revoke execute on function public.admin_add_sms(uuid,int,text,uuid) from public, anon;
revoke execute on function public.admin_reject_sms_request(uuid) from public, anon;
revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.sms_debit(uuid,int,text) from public, anon, authenticated;
revoke execute on function public.sms_refund(uuid,int,text) from public, anon, authenticated;
grant execute on function public.request_sms(uuid,int,numeric) to authenticated;
grant execute on function public.admin_add_sms(uuid,int,text,uuid) to authenticated;
grant execute on function public.admin_reject_sms_request(uuid) to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.sms_debit(uuid,int,text) to service_role;
grant execute on function public.sms_refund(uuid,int,text) to service_role;

notify pgrst, 'reload schema';
