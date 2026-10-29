// push-notify · שליחת התראות Push לבעלי אירועים.
// בלי גוף: מעבד את התור (notify_outbox) — נקרא מטריגר במסד, ולכן לא דורש התחברות (הוא לא מקבל תוכן מבחוץ).
// {action:"key"}: מחזיר את המפתח הציבורי (ויוצר זוג מפתחות VAPID בפעם הראשונה; הפרטי נשמר רק במסד).
// {action:"test"}: התראת בדיקה למכשירים של המשתמש המחובר.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const url = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function vapid() {
  const read = async () => {
    const { data } = await admin.from("app_secrets").select("key,value").in("key", ["vapid_public", "vapid_private"]);
    const m = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
    return m.vapid_public && m.vapid_private ? { pub: m.vapid_public, priv: m.vapid_private } : null;
  };
  let k = await read();
  if (!k) {
    const g = webpush.generateVAPIDKeys();
    // אם שתי הפעלות יצרו במקביל — נשאר הראשון
    await admin.from("app_secrets").upsert([{ key: "vapid_public", value: g.publicKey }, { key: "vapid_private", value: g.privateKey }], { onConflict: "key", ignoreDuplicates: true });
    k = await read();
  }
  webpush.setVapidDetails("mailto:sidoril2026@gmail.com", k!.pub, k!.priv);
  return k!;
}

// שליחה למכשירים של רשימת משתמשים. מכשיר שכבר לא קיים (404/410) נמחק
async function sendTo(userIds: string[], payload: Record<string, unknown>) {
  if (!userIds.length) return 0;
  const { data: subs } = await admin.from("push_subscriptions").select("endpoint,p256dh,auth").in("user_id", userIds);
  let ok = 0;
  await Promise.all((subs || []).map(async (s: any) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 86400 });
      ok++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      else console.error("push failed:", e?.statusCode, e?.body || e?.message);
    }
  }));
  return ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const keys = await vapid();

    if (body.action === "key") return json({ publicKey: keys.pub });

    if (body.action === "test") {
      const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: "צריך להתחבר" }, 401);
      const sent = await sendTo([user.id], { title: "🔔 ההתראות פועלות", body: "מעכשיו תקבלו כאן עדכונים על האירוע", url: "/" });
      return json({ sent });
    }

    // עיבוד התור
    const { data: items, error } = await admin.rpc("claim_notify_outbox");
    if (error) throw error;
    for (const it of items || []) {
      const { data: ids } = await admin.rpc("event_recipient_ids", { p_event: it.event_id });
      const userIds = (ids || []).map((r: any) => (typeof r === "string" ? r : r.event_recipient_ids)).filter(Boolean);
      const sent = await sendTo(userIds, { title: it.title, body: it.body || "", url: "/" });
      await admin.from("notify_outbox").update({ sent_count: sent }).eq("id", it.id);
    }
    return json({ processed: (items || []).length });
  } catch (err) {
    console.error("push-notify error:", err);
    return json({ error: "שגיאה בשרת" }, 500);
  }
});
