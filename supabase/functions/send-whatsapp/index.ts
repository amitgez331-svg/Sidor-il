// send-whatsapp · שליחת סבב WhatsApp לאורחי אירוע.
// בטיחות: רק בעל האירוע (או שותף / אדמין). האורחים והטלפונים נטענים מהמסד, לא מהדפדפן.
// חיוב: רשומה אחת לאורח (בהודעה הראשונה שלו), 4 סבבים לכל רשומה, כל סבב פעם אחת. ראו engine.ts
// dry_run: מחזיר מה יקרה (כמה רשומות יירדו, מי יקבל ומי ידולג) בלי לשלוח ובלי לחייב.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { plan, ROUND_LABEL } from "./engine.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "צריך להתחבר" }, 401);

    const body = await req.json().catch(() => ({}));
    const eventId = String(body.event_id || "");
    const round = String(body.round || "");
    const dryRun = body.dry_run === true;
    const guestIds: string[] = Array.isArray(body.guest_ids) ? body.guest_ids.map(String) : [];
    const messages: Record<string, string> = body.messages && typeof body.messages === "object" ? body.messages : {};
    if (!eventId) return json({ error: "חסר אירוע" }, 400);

    const { data: owns } = await userClient.rpc("owns_event", { p_event: eventId });
    if (!owns) return json({ error: "אין הרשאה לאירוע הזה" }, 403);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [ev, gs, ts, bal, rec, rnd] = await Promise.all([
      admin.from("events").select("id,invite_code,settings_json").eq("id", eventId).maybeSingle(),
      admin.from("guests").select("id,name,phone,rsvp,table_id,short_code,lang").eq("event_id", eventId),
      admin.from("tables").select("id,name").eq("event_id", eventId),
      admin.from("wa_balance").select("balance").eq("event_id", eventId).maybeSingle(),
      admin.from("wa_guest_records").select("guest_id").eq("event_id", eventId),
      admin.from("wa_guest_rounds").select("guest_id,round").eq("event_id", eventId),
    ]);
    if (!ev.data) return json({ error: "האירוע לא נמצא" }, 404);
    const rounds = rnd.data || [];
    const roundsOf = new Map<string, number>();
    for (const r of rounds) roundsOf.set(r.guest_id, (roundsOf.get(r.guest_id) || 0) + 1);
    const p = plan({
      event: ev.data, guests: gs.data || [], tables: ts.data || [], targetIds: guestIds, round, messages,
      charged: new Set((rec.data || []).map((r: any) => r.guest_id)),
      sentRound: new Set(rounds.filter((r: any) => r.round === round).map((r: any) => r.guest_id)),
      roundsOf, balance: bal.data?.balance ?? 0,
    });
    if (p.error) return json({ error: p.error }, 400);

    const summary = {
      round, round_label: ROUND_LABEL[round], balance: p.balance, new_records: p.newRecords, free: p.free, enough: p.enough,
      will_send: p.send.map((s) => ({ id: s.id, name: s.name, charged: s.isNew, round_no: s.roundNo })),
      skipped: p.skipped,
    };
    if (dryRun) return json({ dry_run: true, ...summary });
    if (!p.send.length) return json({ ...summary, results: [], error: "אין למי לשלוח בסבב הזה" }, 400);
    if (!p.enough) return json({ ...summary, error: `אין מספיק רשומות WhatsApp: צריך ${p.newRecords}, יש ${p.balance}` }, 402);

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID"), token = Deno.env.get("TWILIO_AUTH_TOKEN"), from = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
    if (!sid || !token || !from) return json({ ...summary, error: "חשבון הוואטסאפ עוד לא מחובר. אפשר להריץ בדיקה בלי שליחה." }, 503);

    // חיוב לפני השליחה (אטומי בשרת): אם אין מספיק, לא נשלח כלום
    const newIds = p.send.filter((s) => s.isNew).map((s) => s.id);
    let balance = p.balance;
    if (newIds.length) {
      const { data, error } = await admin.rpc("wa_charge", { p_event: eventId, p_guests: newIds, p_note: `WhatsApp · ${ROUND_LABEL[round]} · ${newIds.length} אורחים חדשים` });
      if (error) return json({ ...summary, error: "אין מספיק רשומות WhatsApp" }, 402);
      balance = data;
    }

    const results: any[] = [], okIds: string[] = [], failNew: string[] = [];
    for (const s of p.send) {
      await new Promise((r) => setTimeout(r, 250));
      let ok = false, msg = "";
      try {
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: "Basic " + btoa(`${sid}:${token}`), "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ From: from, To: `whatsapp:+${s.phone}`, Body: s.text }).toString(),
        });
        const data = await res.json().catch(() => null);
        ok = res.ok; msg = data?.message || "";
      } catch (e) { msg = String(e); }
      if (ok) okIds.push(s.id); else if (s.isNew) failNew.push(s.id);
      results.push({ id: s.id, name: s.name, status: ok ? `נשלח ✓ · סבב ${s.roundNo} מתוך 4` : `שגיאה ✗ ${msg}`.trim(), charged: s.isNew && ok });
    }
    if (okIds.length) await admin.rpc("wa_mark_round", { p_event: eventId, p_guests: okIds, p_round: round });
    if (failNew.length) {
      const { data } = await admin.rpc("wa_refund", { p_event: eventId, p_guests: failNew, p_note: `החזר: ${failNew.length} הודעות WhatsApp שלא נשלחו` });
      if (typeof data === "number") balance = data;
    }
    if (okIds.length && (round === "invite" || round === "reminder")) {
      await admin.from("guests").update({ last_msg: round, last_msg_at: new Date().toISOString() }).in("id", okIds);
    }
    return json({ ...summary, results, balance, sent: okIds.length, refunded: failNew.length });
  } catch (err) {
    console.error("send-whatsapp error:", err);
    return json({ error: "שגיאה בשרת" }, 500);
  }
});
