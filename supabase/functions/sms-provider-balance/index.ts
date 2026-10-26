// sms-provider-balance · אדמין בלבד: יתרת ה-SMS בחשבון 019, מול כמה הודעות כבר נמכרו ללקוחות ועוד לא נשלחו
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ADMIN_EMAIL = "amitgez331@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || (user.email || "").toLowerCase() !== ADMIN_EMAIL) return json({ error: "אדמין בלבד" }, 403);

    const username = Deno.env.get("SMS019_USERNAME");
    const token = Deno.env.get("SMS019_TOKEN");
    if (!username || !token) return json({ configured: false, error: "חסרים SMS019_USERNAME / SMS019_TOKEN בהגדרות" }, 200);

    // יתרה ב-019
    let provider: any = null;
    try {
      const res = await fetch("https://019sms.co.il/api", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ balance: { user: { username } } }),
      });
      provider = await res.json().catch(() => null);
    } catch (e) {
      provider = { status: -1, message: String(e) };
    }
    const ok = provider && Number(provider.status) === 0;

    // כמה הודעות כבר "חייבים" ללקוחות (יתרות שנמכרו ועוד לא נשלחו)
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: bals } = await admin.from("sms_balance").select("balance");
    const committed = (bals || []).reduce((s: number, b: any) => s + (b.balance || 0), 0);

    return json({
      configured: true,
      ok,
      provider_balance: ok ? Number(provider.balance) : null,
      provider_message: provider?.message ?? null,
      provider_status: provider?.status ?? null,
      committed,
    });
  } catch (err) {
    console.error("sms-provider-balance error:", err);
    return json({ error: "שגיאה בבדיקת היתרה" }, 500);
  }
});
