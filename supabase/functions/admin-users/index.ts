// admin-users · אדמין בלבד: פתיחת משתמש חדש עם מייל + סיסמה (מאומת מראש, בלי מייל אישור),
// אפשרות לחבילות מראש, והחלפת סיסמה למשתמש קיים
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ADMIN_EMAIL = "amitgez331@gmail.com";
const PACKAGES = ["basic", "sms", "auto", "staff"]; // כמו ALL_PACKAGES ב-App.jsx
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || (user.email || "").toLowerCase() !== ADMIN_EMAIL) return json({ error: "אדמין בלבד" }, 403);

    const body = await req.json().catch(() => ({}));
    const password = String(body.password || "");
    if (password.length < 8) return json({ error: "הסיסמה צריכה להיות לפחות 8 תווים" }, 400);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (body.action === "set_password") {
      const id = String(body.user_id || "");
      if (!id) return json({ error: "חסר משתמש" }, 400);
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // create
    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json({ error: "מייל לא תקין" }, 400);
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      const exists = /already|registered|exists/i.test(error.message);
      return json({ error: exists ? "כבר קיים משתמש עם המייל הזה" : error.message }, 400);
    }
    const uid = data.user!.id;
    const pkgs = (Array.isArray(body.packages) ? body.packages : []).filter((p: string) => PACKAGES.includes(p));
    let pkgError: string | null = null;
    if (pkgs.length) {
      const { error: e } = await admin.from("user_packages").insert(pkgs.map((p: string) => ({ user_id: uid, package_id: p })));
      if (e) pkgError = e.message;
    }
    return json({ ok: true, user_id: uid, email, packages: pkgError ? [] : pkgs, package_error: pkgError });
  } catch (err) {
    console.error("admin-users error:", err);
    return json({ error: "שגיאה בשרת" }, 500);
  }
});
