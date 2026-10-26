// send-sms · שליחת SMS אישי לאורחים דרך 019, עם יתרה שמנוהלת בשרת בלבד.
// 1. מזהה את המשתמש לפי ה-JWT ובודק שהאירוע שלו (או אדמין)
// 2. טוען את האורחים מהמסד (לא סומך על טלפונים שהגיעו מהדפדפן)
// 3. מוריד מהיתרה הודעה אחת לכל אורח (בלי קשר לאורך) לפני השליחה (אטומי)
// 4. שולח ב-bulk של 019 (הודעה אישית לכל אורח). אם 019 נכשל — מחזיר את היתרה
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ADMIN_EMAIL = "amitgez331@gmail.com";
const MAX_RECIPIENTS = 2500; // מגבלת bulk של 019

const normPhone = (p: string) => {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("972")) d = "0" + d.slice(3);
  return /^05\d{8}$/.test(d) ? d : "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "לא מחובר" }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { event_id, guest_ids, message, inviteUrl } = await req.json();
    if (!event_id || !Array.isArray(guest_ids) || !guest_ids.length || !String(message || "").trim())
      return json({ error: "חסרים פרטים לשליחה" }, 400);
    if (guest_ids.length > MAX_RECIPIENTS) return json({ error: `אפשר לשלוח עד ${MAX_RECIPIENTS} נמענים בפעם אחת` }, 400);

    // האירוע שייך למשתמש?
    const { data: ev } = await admin.from("events").select("id,user_id").eq("id", event_id).maybeSingle();
    const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL;
    if (!ev || (ev.user_id !== user.id && !isAdmin)) return json({ error: "אין הרשאה לאירוע הזה" }, 403);

    // האורחים — רק מהאירוע הזה, רק עם נייד תקין
    const { data: guests } = await admin.from("guests").select("id,name,phone,table_id").eq("event_id", event_id).in("id", guest_ids);
    const { data: tables } = await admin.from("tables").select("id,name").eq("event_id", event_id);
    const tableName = (id: string | null) => tables?.find((t) => t.id === id)?.name || "—";

    const items = (guests || []).map((g) => {
      const phone = normPhone(g.phone || "");
      const text = String(message)
        .replace(/{שם}/g, String(g.name || "").split(" ")[0])
        .replace(/{שם מלא}/g, g.name || "")
        .replace(/{קישור}/g, inviteUrl ? `${inviteUrl}?g=${g.id}` : "")
        .replace(/{שולחן}/g, tableName(g.table_id));
      return { id: g.id, name: g.name, phone, text, units: phone ? 1 : 0 };
    });
    const valid = items.filter((i) => i.phone);
    const skipped = items.filter((i) => !i.phone).map((i) => ({ name: i.name, phone: "", status: "דולג ✗ (אין נייד תקין)" }));
    if (!valid.length) return json({ results: skipped, error: "אין אורחים עם מספר נייד תקין" }, 400);
    const units = valid.reduce((s, i) => s + i.units, 0);

    // הורדה מהיתרה לפני השליחה
    const { data: newBal, error: debitErr } = await admin.rpc("sms_debit", { p_event: event_id, p_amount: units, p_note: `שליחה ל-${valid.length} אורחים` });
    if (debitErr) return json({ error: "שגיאה בעדכון היתרה" }, 500);
    if (newBal === -1) {
      const { data: b } = await admin.from("sms_balance").select("balance").eq("event_id", event_id).maybeSingle();
      return json({ error: "אין מספיק יתרת SMS", needed: units, balance: b?.balance ?? 0 }, 402);
    }

    // שליחה ל-019 (bulk: הודעה אישית לכל אורח)
    // שם השולח כפי שמאושר ב-019. מנקים רווחים; אם זה מספר טלפון — מנרמלים ל-05XXXXXXXX
    const rawSource = (Deno.env.get("SMS019_SOURCE") || "Sidor-IL").trim();
    const srcDigits = rawSource.replace(/[\s\-().+]/g, "");
    const source = /^\d+$/.test(srcDigits) ? (srcDigits.startsWith("972") ? "0" + srcDigits.slice(3) : srcDigits) : rawSource.replace(/\s+/g, "");
    const sourceShown = /^\d+$/.test(source) ? source.slice(0, 3) + "****" + source.slice(-3) : source;
    const body = {
      bulk: {
        user: { username: Deno.env.get("SMS019_USERNAME") },
        messages: { sms: valid.map((i) => ({ source, destinations: { phone: [{ _: i.phone }] }, message: i.text })) },
      },
    };
    let data: any = null, ok = false;
    try {
      const res = await fetch("https://019sms.co.il/api", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SMS019_TOKEN")}` },
        body: JSON.stringify(body),
      });
      data = await res.json().catch(() => null);
      ok = res.ok && data && Number(data.status) === 0;
    } catch (e) {
      data = { message: String(e) };
    }

    if (!ok) {
      // 019 לא קיבל את השליחה — מחזירים את כל היחידות
      const { data: refunded } = await admin.rpc("sms_refund", { p_event: event_id, p_amount: units, p_note: `החזר: 019 status ${data?.status ?? "?"}` });
      console.error("019 failed:", JSON.stringify(data), "source:", sourceShown, "raw length:", rawSource.length);
      const hint = Number(data?.status) === 515 ? ` שם השולח שנשלח: "${sourceShown}" — צריך להיות זהה בדיוק לשולח המאושר ב-019.` : "";
      return json({
        error: `ספק ה-SMS דחה את השליחה (${data?.message || "שגיאה לא ידועה"}).${hint} היתרה הוחזרה.`,
        provider_status: data?.status ?? null, balance: refunded,
        results: valid.map((i) => ({ name: i.name, phone: i.phone, status: "שגיאה ✗" })).concat(skipped),
      }, 502);
    }

    return json({
      results: valid.map((i) => ({ name: i.name, phone: i.phone, status: "נשלח ✓", units: i.units })).concat(skipped),
      units, balance: newBal, shipment_id: data?.shipment_id ?? null,
    });
  } catch (err) {
    console.error("send-sms error:", err);
    return json({ error: "שגיאה בשרת השליחה" }, 500);
  }
});
