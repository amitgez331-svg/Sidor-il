-- Sidor-IL · קישור אישי קצר ל-SMS: sidoril.com/i/<7 תווים>
-- migration: guest_short_links

-- קוד אקראי בן 7 תווים (בלי תווים מבלבלים כמו l/1/o/0), ייחודי
create or replace function public.new_guest_short_code()
returns text language plpgsql volatile set search_path = '' as $$
declare a text := 'abcdefghijkmnpqrstuvwxyz23456789'; b bytea; c text; i int;
begin
  loop
    b := decode(replace(gen_random_uuid()::text,'-',''),'hex'); c := '';
    for i in 0..6 loop c := c || substr(a, 1 + (get_byte(b,i) % 32), 1); end loop;
    exit when not exists (select 1 from public.guests g where g.short_code = c);
  end loop;
  return c;
end $$;

alter table public.guests add column if not exists short_code text;
update public.guests set short_code = public.new_guest_short_code() where short_code is null;
alter table public.guests alter column short_code set default public.new_guest_short_code();
alter table public.guests alter column short_code set not null;
create unique index if not exists guests_short_code_key on public.guests(short_code);

-- קישור קצר -> קוד ההזמנה ומזהה האורח (רק כשההזמנה פעילה)
create or replace function public.resolve_guest_link(p_short text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('code', e.invite_code, 'guest', g.id)
    from public.guests g join public.events e on e.id = g.event_id
   where g.short_code = lower(p_short) and e.invite_active
   limit 1
$$;
revoke execute on function public.resolve_guest_link(text) from public;
grant execute on function public.resolve_guest_link(text) to anon, authenticated;
revoke execute on function public.new_guest_short_code() from public, anon;

notify pgrst, 'reload schema';
