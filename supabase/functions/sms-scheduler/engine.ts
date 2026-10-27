// מנוע התזמונים: נוסחים, נמענים ושליחה. בלי תלות ב-Supabase/Deno כדי שאפשר יהיה לבדוק אותו מקומית.

export const SMS_MAX = 200; // כמו ב-send-sms
export const SHORT_LINK_HOST = "sidoril.com/i/";
export const MAX_RECIPIENTS = 2500;

export const normPhone = (p: string) => {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("972")) d = "0" + d.slice(3);
  return /^05\d{8}$/.test(d) ? d : "";
};

// שם האירוע במשפט + חתימה, לפי סוג האירוע — כמו eventWords ב-App.jsx
const EMOJI: Record<string, string> = { wedding: "💍", bar_mitzvah: "✡️", brit: "👶", business: "💼", other: "🎉" };
export function eventWords(e: any) {
  const t = EMOJI[e?.event_type] ? e.event_type : "wedding";
  const g = String(e?.groom_name || "").trim(), b = String(e?.bride_name || "").trim(), n = String(e?.name || "").trim();
  const name = t === "wedding" ? (g && b ? `חתונת ${g} ו${b}` : g || b ? `חתונת ${g || b}` : "חתונתנו")
    : t === "bar_mitzvah" ? (g ? `שמחת המצווה של ${g}` : n || "שמחת המצווה")
    : t === "brit" ? (g ? `ברית המילה של ${g}` : n || "ברית המילה")
    : (n || "האירוע שלנו");
  const hosts = t === "wedding" ? (g && b ? `${g} ו${b}` : g || b || n) : (t === "bar_mitzvah" || t === "brit") ? (String(e?.groom_father || "").trim() || g || n) : (g || n);
  return { name, hosts, emoji: EMOJI[t] };
}
// קישור Bit / PayBox לשורת "💝 למתנה" — כמו giftLink ב-App.jsx
export function giftLink(e: any) {
  const bit = String(e?.bit_link || "").trim(), pb = String(e?.paybox_link || "").trim();
  if (bit) return /^https?:\/\//i.test(bit) ? bit : `Bit ${bit}`;
  return pb;
}

// אותם נוסחים כמו במסך ה-SMS (SMSScreen ב-App.jsx) — לשנות בשני המקומות
export function buildTemplates(event: any): Record<string, string> {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const d = event.date ? new Date(event.date) : null;
  const eventDate = d
    ? `יום ${days[d.getUTCDay()]}, ${d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`
    : "בקרוב";
  const ew = eventWords(event);
  const eventEmoji = ew.emoji, eventName = ew.name, coupleRef = ew.hosts;
  const link = giftLink(event);
  const giftAdd = (t: string) => link && !t.includes(link) ? `${t}\n💝 למתנה: ${link}` : t;
  const defaultInvite = `שלום {שם}! 💌\nמוזמנים ל${eventName}! ${eventEmoji}\nנשמח לראותך ביום המיוחד.\n📅 ${eventDate}\n📍 ${event.venue || "יפורסם בקרוב"}\nלאישור הגעה: {קישור}`;
  return {
    invite: giftAdd(String(event.welcome_text || "").trim() || defaultInvite),
    reminder: `שלום {שם}! עוד לא אישרת הגעה ל${eventName}.\nנשמח לדעת אם תגיע 🙏\nלאישור הגעה: {קישור}`,
    table: giftAdd(`שלום {שם}! מחכים לך ב${eventName}! 🎊\nהשולחן שלך: מספר {שולחן}\n📅 ${eventDate}\n📍 ${event.venue || ""}`),
    thanks: `שלום {שם}! תודה רבה שהגעת ל${eventName}! 💙\nשמחנו לחגוג איתך.\nבאהבה, ${coupleRef} ${eventEmoji}`,
  };
}

// למי נשלח כל נוסח (מוצג גם במסך התזמונים)
export function recipientsFor(templateId: string, guests: any[]) {
  if (templateId === "reminder") return guests.filter((g) => !g.rsvp || g.rsvp === "pending");
  if (templateId === "table") return guests.filter((g) => g.rsvp === "confirmed" && g.table_id);
  if (templateId === "thanks") return guests.filter((g) => g.rsvp === "confirmed");
  return guests; // invite / אחר: כולם
}

// "3 (משפחת הכלה)" — כמו tableLabel ב-App.jsx
export function tableLabel(num: number | undefined, name: string) {
  const n = String(name || "").replace(/^\s*\d+\s*/, "").trim();
  if (!num) return name || "—";
  return n && n !== `שולחן ${num}` ? `${num} (${n})` : String(num);
}

export function renderFor(text: string, g: any, tableName: (id: string | null) => string, inviteUrl: string) {
  return text
    .replace(/{שם}/g, String(g.name || "").split(" ")[0])
    .replace(/{שם מלא}/g, g.name || "")
    .replace(/{קישור}/g, g.short_code ? `${SHORT_LINK_HOST}${g.short_code}` : inviteUrl ? `${inviteUrl}?g=${g.id}` : "")
    .replace(/{שולחן}/g, tableName(g.table_id));
}

export type Claim = { run_id: string; event_id: string; schedule_id: string; template_id: string };
export type Deps = {
  claim: () => Promise<Claim[]>;
  loadEvent: (id: string) => Promise<any>;
  loadGuests: (eventId: string) => Promise<any[]>;
  loadTables: (eventId: string) => Promise<any[]>;
  debit: (eventId: string, units: number, note: string) => Promise<number>; // -1 = אין יתרה
  refund: (eventId: string, units: number, note: string) => Promise<void>;
  send: (items: { phone: string; text: string }[]) => Promise<{ ok: boolean; status?: unknown; message?: string }>;
  finish: (runId: string, patch: { status: string; recipients?: number; units?: number; error?: string | null }) => Promise<void>;
};

// שליחת תזמון אחד. כל שגיאה נרשמת בתזמון עצמו ולא עוצרת את השאר.
export async function runOne(c: Claim, deps: Deps) {
  try {
    const ev = await deps.loadEvent(c.event_id);
    if (!ev) return await deps.finish(c.run_id, { status: "skipped", error: "האירוע לא נמצא" });
    const text = buildTemplates(ev)[c.template_id] ?? buildTemplates(ev).invite;
    const [guests, tables] = await Promise.all([deps.loadGuests(c.event_id), deps.loadTables(c.event_id)]);
    const nums = ev.settings_json?.table_nums || {};
    const tableName = (id: string | null) => { const t = tables.find((t) => t.id === id); return t ? tableLabel(nums[t.id], t.name) : "—"; };
    const inviteUrl = ev.invite_code ? `https://www.sidoril.com/#/invite/${ev.invite_code}` : "";
    const valid = recipientsFor(c.template_id, guests)
      .map((g) => ({ name: g.name, phone: normPhone(g.phone || ""), text: renderFor(text, g, tableName, inviteUrl) }))
      .filter((i) => i.phone);
    if (!valid.length) return await deps.finish(c.run_id, { status: "skipped", error: "אין נמענים עם נייד תקין" });
    if (valid.length > MAX_RECIPIENTS) return await deps.finish(c.run_id, { status: "failed", recipients: valid.length, error: `יותר מ-${MAX_RECIPIENTS} נמענים` });
    const long = valid.find((i) => i.text.length > SMS_MAX);
    if (long) return await deps.finish(c.run_id, { status: "failed", recipients: valid.length, error: `ההודעה ל-${long.name} ארוכה מ-${SMS_MAX} תווים (${long.text.length})` });

    const units = valid.length; // הודעה אחת לכל אורח
    const bal = await deps.debit(c.event_id, units, `תזמון אוטומטי: ${valid.length} אורחים`);
    if (bal === -1) return await deps.finish(c.run_id, { status: "failed", recipients: valid.length, error: `אין מספיק יתרת SMS (נדרש ${units})` });

    const res = await deps.send(valid);
    if (!res.ok) {
      await deps.refund(c.event_id, units, `החזר תזמון: 019 status ${res.status ?? "?"}`);
      return await deps.finish(c.run_id, { status: "failed", recipients: valid.length, error: `ספק ה-SMS דחה את השליחה (${res.message || "שגיאה"}). היתרה הוחזרה.` });
    }
    await deps.finish(c.run_id, { status: "sent", recipients: valid.length, units, error: null });
  } catch (e) {
    await deps.finish(c.run_id, { status: "failed", error: "שגיאה בשרת: " + String((e as Error)?.message || e) }).catch(() => {});
  }
}

export async function runScheduler(deps: Deps) {
  const claims = await deps.claim();
  for (const c of claims) await runOne(c, deps);
  return claims.length;
}
