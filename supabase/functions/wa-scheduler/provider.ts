// ספק הודעות WhatsApp — המקום היחיד שבו מתחברים לספק בפועל (משותף ל-send-whatsapp ול-wa-scheduler; wa-scheduler/provider.ts הוא עותק).
// כרגע אין ספק מחובר (מתכננים להתחבר ל-019), ולכן configured=false: שום הודעה לא נשלחת ושום רשומה לא יורדת.
// "בדיקה בלי שליחה" במסך הוואטסאפ ממשיכה לעבוד. כשמחברים ספק: ממלאים כאן את send() ומעבירים configured ל-true.
export const waProvider = {
  configured: false,
  name: "",
  async send(_phone: string, _text: string): Promise<{ ok: boolean; message?: string }> {
    return { ok: false, message: "ספק הוואטסאפ עוד לא מחובר" };
  },
};
