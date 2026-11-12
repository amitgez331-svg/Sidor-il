-- ספק שהופעל לו "חשבון ספק" באדמין (user_packages.package_id = 'vendor') מאושר אוטומטית כשהוא שומר את הפרופיל,
-- והאדמין מקבל התראה (admin_seen = false) עד שהוא מסמן "ראיתי".
alter table public.vendor_profiles add column if not exists admin_seen boolean not null default true;

create or replace function public.vendor_profile_guard() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
declare activated boolean;
begin
  new.updated_at := now();
  if public.is_admin() then return new; end if;
  activated := exists (select 1 from public.user_packages where user_id = new.user_id and package_id = 'vendor');
  if tg_op = 'INSERT' then
    new.verified := false; new.featured := false; new.featured_until := null; new.reject_reason := null;
    new.status := case when activated then 'approved' else 'pending' end;
    new.admin_seen := false;
    return new;
  end if;
  new.verified := old.verified; new.featured := old.featured; new.featured_until := old.featured_until;
  new.admin_seen := old.admin_seen;
  if old.status = 'rejected' then
    -- נדחה ע"י האדמין: תיקון חוזר לבדיקה, גם לספק מופעל
    new.status := 'pending'; new.reject_reason := null; new.admin_seen := false;
  elsif new.business_name is distinct from old.business_name then
    new.status := case when activated then 'approved' else 'pending' end; new.reject_reason := null; new.admin_seen := false;
  else
    new.status := old.status; new.reject_reason := old.reject_reason;
  end if;
  return new;
end $function$;
