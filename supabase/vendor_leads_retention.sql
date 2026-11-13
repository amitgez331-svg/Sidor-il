-- מחיקה אוטומטית של פניות לספקים שעברו 24 חודשים (כמו שכתוב במדיניות הפרטיות, סעיף 6). רץ כל לילה ב-02:30 UTC.
select cron.unschedule('vendor-leads-retention') where exists (select 1 from cron.job where jobname = 'vendor-leads-retention');
select cron.schedule('vendor-leads-retention', '30 2 * * *', $c$delete from public.vendor_leads where created_at < now() - interval '24 months'$c$);
