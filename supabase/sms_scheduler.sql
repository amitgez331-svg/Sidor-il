-- Sidor-IL · מנוע שליחה אוטומטי לתזמוני SMS
-- migration: sms_scheduler
-- התזמונים עצמם נשמרים באירוע (settings_json.sms_schedule: id, date, time, enabled, templateId).
-- כל 5 דקות pg_cron קורא לפונקציית sms-scheduler, שתופסת את התזמונים שהגיע זמנם ושולחת.

-- ─── רישום שליחות: כל תזמון נשלח פעם אחת בלבד ──────────────────────────────
create table if not exists public.sms_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  schedule_id text not null,
  template_id text not null,
  due_at timestamptz not null,
  status text not null default 'sending' check (status in ('sending','sent','failed','skipped')),
  recipients int not null default 0,
  units int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (event_id, schedule_id)
);
alter table public.sms_schedule_runs enable row level security;
-- בעל האירוע (או אדמין) רואה את הסטטוס; רק השרת כותב
drop policy if exists sms_runs_owner_read on public.sms_schedule_runs;
create policy sms_runs_owner_read on public.sms_schedule_runs for select to authenticated
  using (public.owns_event(event_id));
revoke insert, update, delete on public.sms_schedule_runs from anon, authenticated;

-- ─── תפיסת תזמונים שהגיע זמנם (אטומי: unique מונע שליחה כפולה) ─────────────
-- תאריך+שעה הם שעון ישראל. תזמון שעבר עליו יותר מ-12 שעות לא נשלח (למשל הופעל באיחור).
create or replace function public.claim_due_sms_schedules()
returns table (run_id uuid, event_id uuid, schedule_id text, template_id text)
language sql volatile security definer set search_path = '' as $$
  with due as (
    -- תזמוני ברירת המחדל (d0-d3) לא תמיד שמרו templateId — לפי SCHEDULE_DEFAULTS ב-App.jsx
    select e.id as event_id, s->>'id' as schedule_id,
           coalesce(s->>'templateId', case s->>'id' when 'd1' then 'reminder' when 'd2' then 'table' when 'd3' then 'thanks' else 'invite' end) as template_id,
           ((s->>'date') || ' ' || (s->>'time'))::timestamp at time zone 'Asia/Jerusalem' as due_at
      from public.events e
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(e.settings_json->'sms_schedule') = 'array' then e.settings_json->'sms_schedule' else '[]'::jsonb end) s
     where (s->>'enabled')::boolean is true
       and s->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
       and s->>'time' ~ '^\d{2}:\d{2}$'
       and coalesce(s->>'id','') <> ''
  )
  insert into public.sms_schedule_runs (event_id, schedule_id, template_id, due_at)
  select d.event_id, d.schedule_id, d.template_id, d.due_at
    from due d
   where d.due_at <= now() and d.due_at > now() - interval '12 hours'
  on conflict (event_id, schedule_id) do nothing
  returning id, sms_schedule_runs.event_id, sms_schedule_runs.schedule_id, sms_schedule_runs.template_id
$$;
revoke execute on function public.claim_due_sms_schedules() from public, anon, authenticated;
grant execute on function public.claim_due_sms_schedules() to service_role;

-- ─── הפעלה כל 5 דקות ────────────────────────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('sms-scheduler') where exists (select 1 from cron.job where jobname = 'sms-scheduler');
select cron.schedule('sms-scheduler', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://zcfosfaazvljnzipyzon.supabase.co/functions/v1/sms-scheduler',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 60000)
$cron$);

notify pgrst, 'reload schema';
