// backup-export · מחזיר את הגיבוי היומי האחרון (JSON דחוס ב-gzip) לסקריפט הגיבוי ב-Google Drive.
// מוגן בקוד סודי: הכותרת x-backup-token חייבת להיות זהה לסוד BACKUP_EXPORT_TOKEN ב-Supabase.
// בלי הסוד מוגדר — הפונקציה כבויה (503).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const enc = new TextEncoder();
// השוואה בזמן קבוע, כדי שאי אפשר לנחש את הקוד לפי זמני תגובה
const same = (a: string, b: string) => {
  const x = enc.encode(a), y = enc.encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
};

Deno.serve(async (req) => {
  const secret = Deno.env.get("BACKUP_EXPORT_TOKEN") || "";
  if (secret.length < 24) return new Response("backup export disabled", { status: 503 });
  if (!same(req.headers.get("x-backup-token") || "", secret)) return new Response("unauthorized", { status: 401 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await admin.rpc("backup_latest");
  if (error || !data?.taken_at) return new Response("no backup", { status: 500 });

  const body = new Blob([JSON.stringify(data)]).stream().pipeThrough(new CompressionStream("gzip"));
  const day = String(data.taken_at).slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="sidoril-backup-${day}.json.gz"`,
      "Cache-Control": "no-store",
    },
  });
});
