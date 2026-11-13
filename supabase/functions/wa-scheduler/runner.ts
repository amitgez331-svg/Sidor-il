// מנוע השליחה האוטומטית של WhatsApp (4 הסבבים). בלי תלות ב-Supabase/Twilio כדי שאפשר לבדוק אותו מקומית.
// engine.ts כאן הוא עותק של supabase/functions/send-whatsapp/engine.ts — לשנות שם ולהעתיק.
// כל סבב שהגיע זמנו נשלח במנות (BATCH לכל הרצה, כל 5 דקות) עד שכל האורחים קיבלו. מי שכבר קיבל לא מקבל שוב,
// כך שהמשך ההרצה הבאה בטוח. אם הרשומות נגמרות: מי שכבר שולם מקבל, והחדשים שמעבר ליתרה מדולגים ונרשמים בתזמון.
import { plan, ROUND_LABEL } from "./engine.ts";

export const BATCH = 200; // ~0.4 שנ' לאורח → פחות מ-90 שניות להרצה, הרבה לפני ההרצה הבאה (5 דקות)
export const STALE_HOURS = 24;

export type Run = { id: string; event_id: string; schedule_id: string; template_id: string; created_at: string; recipients: number; units: number; failed_ids: string[] | null };
export type Loaded = { event: any; guests: any[]; tables: any[]; balance: number; charged: Set<string>; rounds: { guest_id: string; round: string }[] };
export type Deps = {
  pending: () => Promise<Run[]>;
  load: (eventId: string) => Promise<Loaded | null>;
  charge: (eventId: string, ids: string[], note: string) => Promise<number>; // זורק אם אין מספיק
  refund: (eventId: string, ids: string[], note: string) => Promise<void>;
  markRound: (eventId: string, ids: string[], round: string) => Promise<void>;
  markMsg?: (ids: string[], round: string) => Promise<void>;
  send: (phone: string, text: string) => Promise<{ ok: boolean; message?: string }>;
  update: (runId: string, patch: Record<string, unknown>) => Promise<void>;
  now?: () => number;
};

// ─── נוסח ברירת מחדל בעברית (אם מסך הוואטסאפ עוד לא שמר נוסחים באירוע) ───
const EMOJI: Record<string, string> = { wedding: "💍", bar_mitzvah: "✡️", brit: "👶", business: "💼", other: "🎉" };
function eventWords(e: any) {
  const t = EMOJI[e?.event_type] ? e.event_type : "wedding";
  const g = String(e?.groom_name || "").trim(), b = String(e?.bride_name || "").trim(), n = String(e?.name || "").trim();
  const name = t === "wedding" ? (g && b ? `חתונת ${g} ו${b}` : g || b ? `חתונת ${g || b}` : "חתונתנו")
    : t === "bar_mitzvah" ? (g ? `שמחת המצווה של ${g}` : n || "שמחת המצווה")
    : t === "brit" ? (g ? `ברית המילה של ${g}` : n || "ברית המילה") : (n || "האירוע שלנו");
  const hosts = t === "wedding" ? (g && b ? `${g} ו${b}` : g || b || n) : (t === "bar_mitzvah" || t === "brit") ? (String(e?.groom_father || "").trim() || g || n) : (g || n);
  return { name, hosts, emoji: EMOJI[t] };
}
export function defaultText(ev: any, tid: string) {
  const w = eventWords(ev);
  const d = ev?.date ? new Date(ev.date) : null;
  const date = d ? d.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "בקרוב";
  const venue = ev?.venue || "";
  if (tid === "reminder") return `שלום {שם}! 👋\n\nעוד לא אישרת הגעה ל${w.name}.\nנשמח מאוד לדעת אם תוכל להגיע 🙏\n\n📅 ${date}\n\n👇 לאישור הגעה:\n{קישור}`;
  if (tid === "table") return `שלום {שם}! 🎊\n\nמחכים לך היום ב${w.name}!\n\n🪑 השולחן שלך: מספר {שולחן}\n\n📍 ${venue}\n\n{קישור}`;
  if (tid === "thanks") return `שלום {שם}! 💙\n\nתודה רבה על ${w.name}!\nשמחנו כל כך לחגוג איתך 🥰\n\nבאהבה,\n${w.hosts} ${w.emoji}`;
  return String(ev?.welcome_text || "").trim() || `שלום {שם}! 💌\n\nמוזמנים ל${w.name}! ${w.emoji}\n\n📅 ${date}\n📍 ${venue || "יפורסם בקרוב"}\n\n👇 לאישור הגעה:\n{קישור}\n\nבאהבה,\n${w.hosts} ${w.emoji}`;
}
// הנוסח לכל שפה: מה שמסך הוואטסאפ שמר באירוע (wa_texts_auto), ובעברית גם נוסח אישי (wa_texts) או ברירת מחדל
export function textsFor(ev: any, tid: string): Record<string, string> {
  const auto = ev?.settings_json?.wa_texts_auto || {};
  const out: Record<string, string> = {};
  for (const [lang, m] of Object.entries(auto)) { const t = String((m as any)?.[tid] ?? "").trim(); if (t) out[lang] = t; }
  const own = String(ev?.settings_json?.wa_texts?.[tid] ?? "").trim();
  out.he = own || out.he || defaultText(ev, tid);
  return out;
}

export async function runOne(r: Run, deps: Deps) {
  const now = deps.now ? deps.now() : Date.now();
  const fail = (error: string) => deps.update(r.id, { status: "failed", error, finished_at: new Date(now).toISOString() });
  try {
    if (now - Date.parse(r.created_at) > STALE_HOURS * 3600e3) return await fail("השליחה לא הסתיימה בזמן");
    const d = await deps.load(r.event_id);
    if (!d?.event) return await deps.update(r.id, { status: "skipped", error: "האירוע לא נמצא", finished_at: new Date(now).toISOString() });
    const failed = new Set((r.failed_ids || []).map(String));
    const roundsOf = new Map<string, number>();
    for (const x of d.rounds) roundsOf.set(x.guest_id, (roundsOf.get(x.guest_id) || 0) + 1);
    const p = plan({
      event: d.event, guests: d.guests, tables: d.tables, round: r.template_id, messages: textsFor(d.event, r.template_id),
      targetIds: d.guests.map((g) => String(g.id)).filter((id) => !failed.has(id)), limit: 100000,
      charged: d.charged, sentRound: new Set(d.rounds.filter((x) => x.round === r.template_id).map((x) => x.guest_id)), roundsOf, balance: d.balance,
    });
    if (p.error) return await fail(p.error);
    const paid = p.send.filter((s) => !s.isNew), fresh = p.send.filter((s) => s.isNew);
    const affordable = fresh.slice(0, Math.max(0, d.balance)), short = fresh.length - affordable.length;
    const batch = [...paid, ...affordable].slice(0, BATCH);
    const doneNote = (extra = 0) => (short ? `${short} אורחים לא קיבלו כי נגמרו הרשומות. אפשר לקנות עוד ולשלוח ידנית.` : extra ? `${extra} הודעות נכשלו אצל ספק הוואטסאפ` : null);
    if (!batch.length) {
      const failedCount = failed.size;
      return await deps.update(r.id, { status: short || failedCount ? "partial" : r.recipients ? "sent" : "skipped", error: r.recipients || short || failedCount ? doneNote(failedCount) : "אין למי לשלוח בסבב הזה", finished_at: new Date(now).toISOString() });
    }
    const newIds = batch.filter((s) => s.isNew).map((s) => s.id);
    if (newIds.length) await deps.charge(r.event_id, newIds, `WhatsApp אוטומטי · ${ROUND_LABEL[r.template_id]} · ${newIds.length} אורחים חדשים`);
    const okIds: string[] = [], failNew: string[] = [], failAll: string[] = [];
    let lastErr = "";
    for (const s of batch) {
      const res = await deps.send(s.phone, s.text).catch((e) => ({ ok: false, message: String(e) }));
      if (res.ok) okIds.push(s.id); else { failAll.push(s.id); if (s.isNew) failNew.push(s.id); lastErr = res.message || lastErr; }
    }
    if (okIds.length) await deps.markRound(r.event_id, okIds, r.template_id);
    if (failNew.length) await deps.refund(r.event_id, failNew, `החזר: ${failNew.length} הודעות WhatsApp אוטומטיות שלא נשלחו`);
    if (okIds.length && deps.markMsg && (r.template_id === "invite" || r.template_id === "reminder")) await deps.markMsg(okIds, r.template_id).catch(() => {});
    const charged = newIds.filter((id) => okIds.includes(id)).length;
    const patch: Record<string, unknown> = { recipients: r.recipients + okIds.length, units: r.units + charged, failed_ids: [...failed, ...failAll] };
    if (!okIds.length) Object.assign(patch, { status: "failed", error: `ספק הוואטסאפ דחה את השליחה${lastErr ? ` (${lastErr})` : ""}. הרשומות הוחזרו.`, finished_at: new Date(now).toISOString() });
    await deps.update(r.id, patch);
  } catch (e) {
    await fail("שגיאה בשרת: " + String((e as Error)?.message || e)).catch(() => {});
  }
}

export async function runAll(deps: Deps) {
  const runs = await deps.pending();
  for (const r of runs) await runOne(r, deps);
  return runs.length;
}
