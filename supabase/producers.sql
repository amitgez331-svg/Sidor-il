-- גרסה ראשונה למפיקי אירועים: פרופיל מפיק (מיתוג בהזמנה), גישה מוגבלת לזוג, תבניות אולם.
-- חשבון מפיק = חבילה "producer" ב-user_packages (האדמין מסמן). לא משנה נתונים קיימים.

-- 1. תפקיד בשיתוף: editor = שותף מלא (כמו היום), couple = גישה מוגבלת (בלי מחיקת אורחים ושולחנות)
alter table public.event_members add column if not exists role text not null default 'editor';
alter table public.event_members drop constraint if exists event_members_role_check;
alter table public.event_members add constraint event_members_role_check check (role in ('editor','couple'));

create or replace function public.is_event_couple(p_event uuid) returns boolean
  language sql stable security definer set search_path to '' as $$
  select not public.is_event_owner(p_event) and not public.is_admin() and exists (
    select 1 from public.event_members m
     where m.event_id = p_event and m.email = public.my_verified_email() and m.role = 'couple')
$$;

-- מדיניות מגבילה (מצטרפת ב-AND לקיימות): זוג עם גישה מוגבלת לא מוחק אורחים ושולחנות
drop policy if exists guests_couple_no_delete on public.guests;
create policy guests_couple_no_delete on public.guests as restrictive for delete to authenticated
  using (not public.is_event_couple(event_id));
drop policy if exists tables_couple_no_delete on public.tables;
create policy tables_couple_no_delete on public.tables as restrictive for delete to authenticated
  using (not public.is_event_couple(event_id));

-- 2. פרופיל מפיק: שם, נייד ולוגו שמוצגים בהזמנה לאורחים
create table if not exists public.producer_profiles (
  user_id        uuid primary key default auth.uid(),
  brand_name     text,
  phone          text,
  logo_url       text,
  show_on_invite boolean not null default true,
  updated_at     timestamptz not null default now()
);
alter table public.producer_profiles enable row level security;
drop policy if exists producer_own on public.producer_profiles;
create policy producer_own on public.producer_profiles for all to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- 3. תבניות אולם שמורות (שולחנות + במה/בר/כניסה), לכל משתמש
create table if not exists public.hall_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  name       text not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.hall_templates enable row level security;
drop policy if exists hall_templates_own on public.hall_templates;
create policy hall_templates_own on public.hall_templates for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. דף ההזמנה: בלי הנייד של בעל השמחה, ועם המיתוג של המפיק (אם בעל האירוע הוא מפיק שבחר להציג)
create or replace function public.get_invite(p_code text) returns jsonb
  language sql stable security definer set search_path to '' as $$
  select (to_jsonb(e) - 'user_id' - 'host_phone') || jsonb_build_object('brand', (
           select jsonb_build_object('name', pp.brand_name, 'phone', pp.phone, 'logo', pp.logo_url)
             from public.producer_profiles pp
            where pp.user_id = e.user_id and pp.show_on_invite
              and coalesce(pp.brand_name, '') <> ''
              and exists (select 1 from public.user_packages up where up.user_id = e.user_id and up.package_id = 'producer')))
    from public.events e where e.invite_code = p_code and e.invite_active limit 1
$$;

notify pgrst, 'reload schema';
