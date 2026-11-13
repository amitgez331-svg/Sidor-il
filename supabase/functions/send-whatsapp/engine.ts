// מנוע שליחת WhatsApp: מי מקבל, כמה רשומות יורדות ומי נחסם. בלי תלות ב-Supabase/Twilio כדי שאפשר לבדוק אותו מקומית.
// רשומה אחת = אורח אחד = 4 סבבים. ההודעה הראשונה לאורח מורידה רשומה; כל סבב נשלח לכל אורח פעם אחת בלבד.

export const ROUNDS = ["invite", "reminder", "table", "thanks"] as const;
export const ROUND_LABEL: Record<string, string> = { invite: "הזמנה", reminder: "תזכורת", table: "מספר שולחן", thanks: "תודה" };
export const MAX_PER_CALL = 200;
export const MSG_MAX = 1500;
export const SHORT_LINK_HOST = "sidoril.com/i/";
const LANGS = ["he", "en", "ru", "uk", "ar", "am"];

// נייד לוואטסאפ בפורמט בינלאומי (ספרות בלבד). ישראלי 05XXXXXXXX → 9725XXXXXXXX; אחר: 8–15 ספרות עם קידומת מדינה
export function waPhone(p: string) {
  let d = String(p || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^05\d{8}$/.test(d)) d = "972" + d.slice(1);
  if (d.startsWith("9720")) d = "972" + d.slice(4);
  if (/^9725\d{8}$/.test(d)) return d;
  if (!d.startsWith("972") && /^[1-9]\d{7,14}$/.test(d)) return d;
  return "";
}

export function guestLang(ev: any, g: any) {
  if (LANGS.includes(g?.lang)) return g.lang;
  const l = ev?.settings_json?.guest_langs?.[g?.id];
  return LANGS.includes(l) ? l : "he";
}

// למי נשלח כל סבב. הלקוח שילם על 4 הודעות לכל רשומה, ולכן כולם מקבלים, חוץ מתזכורת:
// הזמנה — כולם · תזכורת — רק מי שעוד לא ענה · יום האירוע — כולם (מספר שולחן רק למי ששובץ) · תודה — כולם
export function eligible(round: string, g: any) {
  if (round === "reminder") return g.rsvp !== "confirmed" && g.rsvp !== "declined" ? "" : "כבר ענה על ההזמנה";
  return "";
}

export function tableLabel(num: number | undefined, name: string) {
  const n = String(name || "").replace(/^\s*\d+\s*/, "").trim();
  if (!num) return name || "—";
  return n && n !== `שולחן ${num}` ? `${num} (${n})` : String(num);
}

export function renderFor(text: string, g: any, tableName: (id: string | null) => string, inviteUrl: string) {
  // אורח שעוד לא שובץ: השורה עם מספר השולחן יורדת מההודעה
  // (אם באותה שורה יש גם קישור — רק מספר השולחן מתחלף ב-"—")
  if (!g.table_id) text = text.split("\n").filter((l) => !l.includes("{שולחן}") || l.includes("{קישור}")).join("\n").replace(/\n{3,}/g, "\n\n");
  return text
    .replace(/{שם}/g, String(g.name || "").split(" ")[0])
    .replace(/{שם מלא}/g, g.name || "")
    .replace(/{קישור}/g, g.short_code ? `${SHORT_LINK_HOST}${g.short_code}` : inviteUrl ? `${inviteUrl}?g=${g.id}` : "")
    .replace(/{שולחן}/g, tableName(g.table_id));
}

export type PlanInput = {
  event: any;
  guests: any[];            // כל אורחי האירוע (מהמסד)
  tables: any[];
  targetIds: string[];      // מי שהמשתמש בחר
  round: string;
  messages: Record<string, string>; // נוסח לכל שפה, לפחות he
  charged: Set<string>;     // אורחים שכבר חויבו ברשומה
  sentRound: Set<string>;   // אורחים שכבר קיבלו את הסבב הזה
  roundsOf: Map<string, number>; // כמה סבבים כל אורח כבר קיבל
  balance: number;
  limit?: number;           // כמה אורחים לכל היותר בקריאה (שליחה ידנית: 200)
};
export type PlanItem = { id: string; name: string; phone: string; text: string; isNew: boolean; roundNo: number };
export type Plan = { send: PlanItem[]; skipped: { id: string; name: string; reason: string }[]; newRecords: number; free: number; balance: number; enough: boolean; error?: string };

export function plan(p: PlanInput): Plan {
  const empty = (error: string): Plan => ({ send: [], skipped: [], newRecords: 0, free: 0, balance: p.balance, enough: false, error });
  if (!ROUNDS.includes(p.round as any)) return empty("סבב לא מוכר");
  const he = String(p.messages?.he ?? "").trim();
  if (!he) return empty("חסר נוסח הודעה");
  for (const [l, t] of Object.entries(p.messages || {})) {
    if (!LANGS.includes(l) || typeof t !== "string") return empty("נוסח לא תקין");
    if (t.length > MSG_MAX) return empty(`ההודעה ארוכה מ-${MSG_MAX} תווים`);
  }
  const want = new Set((p.targetIds || []).map(String));
  if (want.size > (p.limit ?? MAX_PER_CALL)) return empty(`עד ${p.limit ?? MAX_PER_CALL} אורחים בכל שליחה`);
  const nums = p.event?.settings_json?.table_nums || {};
  const tableName = (id: string | null) => { const t = p.tables.find((t) => t.id === id); return t ? tableLabel(nums[t.id], t.name) : "—"; };
  const inviteUrl = p.event?.invite_code ? `https://www.sidoril.com/#/invite/${p.event.invite_code}` : "";
  const send: PlanItem[] = [], skipped: Plan["skipped"] = [];
  // נייד שכבר קיבל את הסבב הזה (גם דרך אורח אחר באירוע) לא מקבל אותו שוב
  const gotRound = new Set<string>();
  for (const g of p.guests) if (p.sentRound.has(String(g.id))) { const ph = waPhone(g.phone); if (ph) gotRound.add(ph); }
  const seenPhone = new Set<string>();
  for (const g of p.guests) {
    if (!want.has(String(g.id))) continue;
    const skip = (reason: string) => skipped.push({ id: g.id, name: g.name, reason });
    const phone = waPhone(g.phone);
    if (!phone) { skip("אין נייד תקין"); continue; }
    if (p.sentRound.has(String(g.id))) { skip(`כבר קיבל את סבב ה${ROUND_LABEL[p.round]}`); continue; }
    if (gotRound.has(phone)) { skip(`הנייד הזה כבר קיבל את סבב ה${ROUND_LABEL[p.round]} דרך אורח אחר`); continue; }
    if (seenPhone.has(phone)) { skip("אותו נייד כמו אורח אחר ברשימה"); continue; }
    const why = eligible(p.round, g);
    if (why) { skip(why); continue; }
    const done = p.roundsOf.get(String(g.id)) || 0;
    if (done >= 4) { skip("כבר קיבל את כל 4 הסבבים של הרשומה"); continue; }
    seenPhone.add(phone);
    const lang = guestLang(p.event, g);
    const tpl = String(p.messages[lang] ?? "").trim() || he;
    send.push({ id: g.id, name: g.name, phone, text: renderFor(tpl, g, tableName, inviteUrl), isNew: !p.charged.has(String(g.id)), roundNo: done + 1 });
  }
  const newRecords = send.filter((s) => s.isNew).length;
  return { send, skipped, newRecords, free: send.length - newRecords, balance: p.balance, enough: p.balance >= newRecords };
}
