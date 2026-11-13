// wa-scheduler · נקרא כל 5 דקות ע"י pg_cron. שולח אוטומטית את 4 סבבי ה-WhatsApp של כל אירוע שקנה רשומות.
// claim_due_wa_schedules פותח הרצה לכל סבב שהגיע זמנו; ההרצה ממשיכה במנות עד שכולם קיבלו (ראו runner.ts).
// כל עוד חשבון הוואטסאפ לא מחובר — לא נפתחות הרצות, כך שאף סבב לא "נשרף" לפני החיבור.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { runAll } from "./runner.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID"), token = Deno.env.get("TWILIO_AUTH_TOKEN"), from = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
  if (!sid || !token || !from) return json({ processed: 0, skipped: "whatsapp not connected" });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    await admin.rpc("claim_due_wa_schedules");
    const count = await runAll({
      pending: async () => (await admin.from("wa_schedule_runs").select("id,event_id,schedule_id,template_id,created_at,recipients,units,failed_ids").eq("status", "sending").order("created_at").limit(20)).data || [],
      load: async (id) => {
        const [ev, gs, ts, bal, rec, rnd] = await Promise.all([
          admin.from("events").select("*").eq("id", id).maybeSingle(),
          admin.from("guests").select("id,name,phone,rsvp,table_id,short_code,lang").eq("event_id", id),
          admin.from("tables").select("id,name").eq("event_id", id),
          admin.from("wa_balance").select("balance").eq("event_id", id).maybeSingle(),
          admin.from("wa_guest_records").select("guest_id").eq("event_id", id),
          admin.from("wa_guest_rounds").select("guest_id,round").eq("event_id", id),
        ]);
        if (!ev.data) return null;
        return { event: ev.data, guests: gs.data || [], tables: ts.data || [], balance: bal.data?.balance ?? 0,
          charged: new Set((rec.data || []).map((r: any) => r.guest_id)), rounds: rnd.data || [] };
      },
      charge: async (ev, ids, note) => { const { data, error } = await admin.rpc("wa_charge", { p_event: ev, p_guests: ids, p_note: note }); if (error) throw error; return data; },
      refund: async (ev, ids, note) => { await admin.rpc("wa_refund", { p_event: ev, p_guests: ids, p_note: note }); },
      markRound: async (ev, ids, round) => { await admin.rpc("wa_mark_round", { p_event: ev, p_guests: ids, p_round: round }); },
      markMsg: async (ids, round) => { await admin.from("guests").update({ last_msg: round, last_msg_at: new Date().toISOString() }).in("id", ids); },
      send: async (phone, text) => {
        await new Promise((r) => setTimeout(r, 100));
        try {
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: "POST",
            headers: { Authorization: "Basic " + btoa(`${sid}:${token}`), "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ From: from, To: `whatsapp:+${phone}`, Body: text }).toString(),
          });
          const data = await res.json().catch(() => null);
          return { ok: res.ok, message: data?.message };
        } catch (e) { return { ok: false, message: String(e) }; }
      },
      update: async (id, patch) => { await admin.from("wa_schedule_runs").update(patch).eq("id", id); },
    });
    return json({ processed: count });
  } catch (err) {
    console.error("wa-scheduler error:", err);
    return json({ error: "scheduler failed" }, 500);
  }
});
