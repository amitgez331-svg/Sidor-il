-- כפתור "התקשרו" בהזמנה: הנייד של בעל האירוע מוחזר לאורחים רק אם הפעיל "כפתור התקשרות" (settings_json.callBtn).
-- בלי ההגדרה — כמו קודם, הנייד לא נחשף בהזמנה.
create or replace function public.get_invite(p_code text) returns jsonb
  language sql stable security definer set search_path to '' as $$
  select (to_jsonb(e) - 'user_id' - 'host_phone')
         || case when coalesce(e.settings_json->>'callBtn', '') = 'true' and coalesce(e.host_phone, '') <> ''
                 then jsonb_build_object('host_phone', e.host_phone) else '{}'::jsonb end
         || jsonb_build_object('brand', (
           select jsonb_build_object('name', pp.brand_name, 'phone', pp.phone, 'logo', pp.logo_url)
             from public.producer_profiles pp
            where pp.user_id = e.user_id and pp.show_on_invite
              and coalesce(pp.brand_name, '') <> ''
              and exists (select 1 from public.user_packages up where up.user_id = e.user_id and up.package_id = 'producer')))
    from public.events e where e.invite_code = p_code and e.invite_active limit 1
$$;
