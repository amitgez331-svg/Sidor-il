-- הפניות: האדמין רואה דרך איזה קוד (?ref=) כל משתמש נרשם.
-- הקוד נשמר במטא-דאטה של המשתמש (auth.users.raw_user_meta_data->>'ref') מהדפדפן. לא משנה נתונים קיימים.
create or replace function public.admin_list_referrals()
  returns table(user_id uuid, ref text) language plpgsql security definer set search_path to '' as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select u.id, u.raw_user_meta_data->>'ref'
    from auth.users u
    where coalesce(u.raw_user_meta_data->>'ref', '') <> '';
end $$;
revoke execute on function public.admin_list_referrals() from public, anon;
grant execute on function public.admin_list_referrals() to authenticated;

notify pgrst, 'reload schema';
