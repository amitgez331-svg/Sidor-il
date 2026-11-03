-- מועדי התזמונים צמודים לתאריך האירוע.
-- כל תזמון ב-settings_json.sms_schedule / wa_schedule נשמר גם כ-off (ימים ביחס לתאריך האירוע).
-- המועד בפועל = events.date + off, כך שכשמשנים את תאריך האירוע כל הסבבים זזים איתו.
-- בלי off (או בלי תאריך אירוע) משתמשים ב-date כמו קודם.

create or replace function public.claim_due_sms_schedules()
 returns table(run_id uuid, event_id uuid, schedule_id text, template_id text)
 language sql
 security definer
 set search_path to ''
as $function$
  with items as (
    select e.id as event_id, s,
           case when (s->>'off') ~ '^-?\d+$' and e.date is not null
                then to_char(e.date + (s->>'off')::int, 'YYYY-MM-DD')
                else s->>'date' end as d
      from public.events e
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(e.settings_json->'sms_schedule') = 'array' then e.settings_json->'sms_schedule' else '[]'::jsonb end) s
  ), due as (
    select i.event_id, i.s->>'id' as schedule_id,
           coalesce(i.s->>'templateId', case i.s->>'id' when 'd1' then 'reminder' when 'd2' then 'table' when 'd3' then 'thanks' else 'invite' end) as template_id,
           (i.d || ' ' || (i.s->>'time'))::timestamp at time zone 'Asia/Jerusalem' as due_at
      from items i
     where (i.s->>'enabled')::boolean is true
       and i.d ~ '^\d{4}-\d{2}-\d{2}$'
       and i.s->>'time' ~ '^\d{2}:\d{2}$'
       and coalesce(i.s->>'id','') <> ''
  )
  insert into public.sms_schedule_runs (event_id, schedule_id, template_id, due_at)
  select d.event_id, d.schedule_id, d.template_id, d.due_at
    from due d
   where d.due_at <= now() and d.due_at > now() - interval '12 hours'
  on conflict (event_id, schedule_id) do nothing
  returning id, sms_schedule_runs.event_id, sms_schedule_runs.schedule_id, sms_schedule_runs.template_id
$function$;

-- תזמונים קיימים: off לפי המרחק בין המועד השמור לתאריך האירוע.
-- מועד שרחוק יותר מ-90 יום מהאירוע נשאר מתאריך ישן (האירוע הוזז) — סבבי ברירת המחדל חוזרים להפרש הרגיל
update public.events e
   set settings_json = e.settings_json || (
     select jsonb_object_agg(k, (
       select jsonb_agg(case
           when s ? 'off' then s
           when coalesce(s->>'date','') ~ '^\d{4}-\d{2}-\d{2}$' and abs((s->>'date')::date - e.date) <= 90
             then s || jsonb_build_object('off', (s->>'date')::date - e.date)
           when s->>'id' in ('d0','d1','d2','d3')
             then s || jsonb_build_object('off', case s->>'id' when 'd0' then -11 when 'd1' then -4 when 'd2' then 0 else 2 end)
           else s end)
         from jsonb_array_elements(e.settings_json->k) s))
       from unnest(array['sms_schedule','wa_schedule']) k
      where jsonb_typeof(e.settings_json->k) = 'array' and jsonb_array_length(e.settings_json->k) > 0)
 where e.date is not null
   and (jsonb_typeof(e.settings_json->'sms_schedule') = 'array' and jsonb_array_length(e.settings_json->'sms_schedule') > 0
     or jsonb_typeof(e.settings_json->'wa_schedule') = 'array' and jsonb_array_length(e.settings_json->'wa_schedule') > 0);
