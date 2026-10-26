// שומר על פרויקט ה-Supabase פעיל: בתוכנית החינמית הוא מושהה אחרי 7 ימים בלי פעילות.
// מופעל פעם ביום ע"י Vercel Cron (ראו vercel.json) ומריץ שאילתה קטנה על מסד הנתונים.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://zcfosfaazvljnzipyzon.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZm9zZmFhenZsam56aXB5em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzU0MzYsImV4cCI6MjA5MTg1MTQzNn0.TG843P0ouzgewhxJbt3aphv-LICWqs3hbQL6v9VbTjE";

export default async function handler(req, res) {
  const started = Date.now();
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, supabaseStatus: r.status, ms: Date.now() - started });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e?.message || e), ms: Date.now() - started });
  }
}
