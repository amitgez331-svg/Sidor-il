// sms-scheduler · נקרא כל 5 דקות ע"י pg_cron (ראו supabase/sms_scheduler.sql).
// תופס תזמוני SMS שהגיע זמנם ושולח אותם בדיוק כמו send-sms: יתרה בשרת, הודעה אחת לכל אורח, החזר אם 019 נכשל.
// אין צורך בהרשאה: הפונקציה שולחת רק תזמונים שבעל האירוע הפעיל ושהגיע זמנם, וכל תזמון נשלח פעם אחת בלבד.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { runScheduler } from "./engine.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // שם השולח כמו ב-send-sms
  const rawSource = (Deno.env.get("SMS019_SOURCE") || "Sidor-IL").trim();
  const srcDigits = rawSource.replace(/[\s\-().+]/g, "");
  const source = /^\d+$/.test(srcDigits) ? (srcDigits.startsWith("972") ? "0" + srcDigits.slice(3) : srcDigits) : rawSource.replace(/\s+/g, "");

  try {
    const count = await runScheduler({
      claim: async () => {
        const { data, error } = await admin.rpc("claim_due_sms_schedules");
        if (error) throw error;
        return data || [];
      },
      loadEvent: async (id) => (await admin.from("events").select("*").eq("id", id).maybeSingle()).data,
      loadGuests: async (id) => (await admin.from("guests").select("id,name,phone,rsvp,table_id,short_code").eq("event_id", id)).data || [],
      loadTables: async (id) => (await admin.from("tables").select("id,name").eq("event_id", id)).data || [],
      debit: async (ev, units, note) => {
        const { data, error } = await admin.rpc("sms_debit", { p_event: ev, p_amount: units, p_note: note });
        if (error) throw error;
        return data;
      },
      refund: async (ev, units, note) => { await admin.rpc("sms_refund", { p_event: ev, p_amount: units, p_note: note }); },
      send: async (items) => {
        try {
          const res = await fetch("https://019sms.co.il/api", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SMS019_TOKEN")}` },
            body: JSON.stringify({
              bulk: {
                user: { username: Deno.env.get("SMS019_USERNAME") },
                messages: { sms: items.map((i) => ({ source, destinations: { phone: [{ _: i.phone }] }, message: i.text })) },
              },
            }),
          });
          const data = await res.json().catch(() => null);
          const ok = res.ok && data && Number(data.status) === 0;
          if (!ok) console.error("019 failed:", JSON.stringify(data));
          return { ok, status: data?.status, message: data?.message };
        } catch (e) {
          return { ok: false, message: String(e) };
        }
      },
      finish: async (runId, patch) => {
        await admin.from("sms_schedule_runs").update({ ...patch, finished_at: new Date().toISOString() }).eq("id", runId);
      },
    });
    return json({ processed: count });
  } catch (err) {
    console.error("sms-scheduler error:", err);
    return json({ error: "scheduler failed" }, 500);
  }
});
