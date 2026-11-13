-- שליחה אוטומטית של 4 סבבי WhatsApp. רץ כל 5 דקות (cron → wa-scheduler).
-- הסבבים של כל אירוע שקנה רשומות: מה שנשמר ב-settings_json.wa_schedule, ובלי שמירה — 4 ברירות המחדל
-- (שבוע וחצי לפני 10:00 · 4 ימים לפני 10:00 · ביום האירוע 09:00 · יומיים אחרי 10:00), כמו במסך.

create table if not exists public.wa_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  schedule_id text not null,
  template_id text not null,
  due_at timestamptz,
  status text not null default 'sending' check (status in ('sending','sent','partial','failed','skipped')),
  recipients int not null default 0,
  units int not null default 0,
  failed_ids uuid[] not null default '{}',
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (event_id, schedule_id)
);
alter table public.wa_schedule_runs enable row level security;
revoke all on public.wa_schedule_runs from anon, authenticated;
grant select on public.wa_schedule_runs to authenticated;
drop policy if exists wa_runs_read on public.wa_schedule_runs;
create policy wa_runs_read on public.wa_schedule_runs for select to authenticated using (public.owns_event(event_id));

create or replace function public.claim_due_wa_schedules()
returns table(run_id uuid, event_id uuid, schedule_id text, template_id text)
language sql security definer set search_path to '' as $function$
  with defs(id, tid, off, tm) as (values ('d0','invite',-11,'10:00'),('d1','reminder',-4,'10:00'),('d2','table',0,'09:00'),('d3','thanks',2,'10:00')),
  evs as (
    select e.id, e.date, case when jsonb_typeof(e.settings_json->'wa_schedule') = 'array' then e.settings_json->'wa_schedule' else '[]'::jsonb end as saved
      from public.events e
     where exists (select 1 from public.wa_balance b where b.event_id = e.id and (b.purchased > 0 or b.balance > 0))
  ),
  items as (
    -- נשמר במסך: אותו מזהה / תזמון נוסף
    select v.id as event_id, v.date, s from evs v cross join lateral jsonb_array_elements(v.saved) s
    union all
    -- 4 הסבבים שלא נשמרו עדיין: ברירת מחדל, תמיד דלוקים
    select v.id, v.date, jsonb_build_object('id', d.id, 'templateId', d.tid, 'off', d.off, 'time', d.tm, 'enabled', true)
      from evs v cross join defs d
     where not exists (select 1 from jsonb_array_elements(v.saved) x where x->>'id' = d.id)
  ),
  dated as (
    select i.event_id, i.s,
           case when (i.s->>'off') ~ '^-?\d+$' and i.date is not null then to_char(i.date + (i.s->>'off')::int, 'YYYY-MM-DD') else i.s->>'date' end as d
      from items i
  ),
  due as (
    select x.event_id, x.s->>'id' as schedule_id,
           coalesce(x.s->>'templateId', case x.s->>'id' when 'd1' then 'reminder' when 'd2' then 'table' when 'd3' then 'thanks' else 'invite' end) as template_id,
           (x.d || ' ' || (x.s->>'time'))::timestamp at time zone 'Asia/Jerusalem' as due_at
      from dated x
     where ((x.s->>'enabled')::boolean is true or (x.s->>'id') in ('d0','d1','d2','d3'))
       and x.d ~ '^\d{4}-\d{2}-\d{2}$' and x.s->>'time' ~ '^\d{2}:\d{2}$' and coalesce(x.s->>'id','') <> ''
  )
  insert into public.wa_schedule_runs (event_id, schedule_id, template_id, due_at)
  select d.event_id, d.schedule_id, d.template_id, d.due_at from due d
   where d.template_id in ('invite','reminder','table','thanks')
     and d.due_at <= now() and d.due_at > now() - interval '12 hours'
  on conflict (event_id, schedule_id) do nothing
  returning id, wa_schedule_runs.event_id, wa_schedule_runs.schedule_id, wa_schedule_runs.template_id
$function$;
revoke execute on function public.claim_due_wa_schedules() from public, anon, authenticated;
grant execute on function public.claim_due_wa_schedules() to service_role;

-- הפעלה כל 5 דקות (כמו sms-scheduler)
select cron.unschedule('wa-scheduler') where exists (select 1 from cron.job where jobname = 'wa-scheduler');
select cron.schedule('wa-scheduler', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://zcfosfaazvljnzipyzon.supabase.co/functions/v1/wa-scheduler',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 60000)
$cron$);
