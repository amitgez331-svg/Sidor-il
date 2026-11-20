// דף ההזמנה לאורחים וכל מה שהוא צריך — בקובץ נפרד, כדי שאורח שפותח הזמנה בטלפון
// יוריד רק את החלק הזה, ולא את כל מערכת הניהול (מפת הושבה, אדמין, דף הבית...).
// App.jsx מייבא מכאן את אותם רכיבים ועזרים, אז אין כפילות.
import { useState, useEffect, useCallback, useRef, useLayoutEffect, Fragment } from "react";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://zcfosfaazvljnzipyzon.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZm9zZmFhenZsam56aXB5em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzU0MzYsImV4cCI6MjA5MTg1MTQzNn0.TG843P0ouzgewhxJbt3aphv-LICWqs3hbQL6v9VbTjE";
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// פלטת הצבעים של המערכת  -  תואמת לדף הבית (אפרסק · ורוד · סגול על רקע שמנת)
// שמות המפתחות נשארו היסטוריים (blue*) כדי לא לשבור שימושים קיימים
export const C = {
  bg:"#FBF7FC", surface:"#FFFFFF", border:"#EDE4F5",
  blue:"#3A2464", blueM:"#F0609E", blueL:"#9B6BFF", blueXL:"#F7F1FD",
  text:"#2B1D3F", muted:"#6E6585", success:"#2FA57A",
  danger:"#E04B5A", gold:"#E8B04A", info:"#5AA9FF",
  coral:"#FF8A65",
};
export const GRAD=`linear-gradient(120deg,${C.coral},${C.blueM},${C.blueL})`;

// ─── שיתוף ההזמנה בוואטסאפ ────────────────────────────────────────────────────
export const ini=(s,fb="?")=>{const m=String(s??"").match(/\p{L}|\p{N}/u);return m?m[0]:fb;};
export const EVENT_KINDS={
  wedding:    {emoji:"💍",people:"👫 פרטי בני הזוג",a:"שם החתן",b:"שם הכלה",pa:"הורי החתן",pb:"הורי הכלה",roles:[["groom","החתן"],["bride","הכלה"]]},
  bar_mitzvah:{emoji:"✡️",people:"✡️ פרטי חתן/כלת המצווה",a:"שם חתן/כלת המצווה",pa:"שמות ההורים"},
  brit:       {emoji:"👶",people:"👶 פרטי הברית",a:"שם התינוק",pa:"שמות ההורים"},
  business:   {emoji:"💼",people:"💼 פרטי המארחים",a:"שם החברה / המארח",pa:"איש קשר"},
  other:      {emoji:"🎉",people:"🎉 פרטי בעלי השמחה",a:"שם בעל/ת השמחה",pa:"המארחים"},
};
// בני הזוג בחתונה: חתן וכלה / חתן וחתן / כלה וכלה. נשמר ב-settings_json.coupleType (בטופס יצירה: couple_type)
export const childOf=e=>{const v=e?.child_gender||e?.settings_json?.childGender;return v==="m"||v==="f"?v:"";};
export const eventWords=e=>{
  const t=EVENT_KINDS[e?.event_type]?e.event_type:"wedding";
  const g=String(e?.groom_name||"").trim(),b=String(e?.bride_name||"").trim(),n=String(e?.name||"").trim();
  const name=t==="wedding"?(g&&b?`חתונת ${g} ו${b}`:g||b?`חתונת ${g||b}`:"חתונתנו")
    :t==="bar_mitzvah"?(g?`${childOf(e)==="f"?"בת המצווה":childOf(e)==="m"?"בר המצווה":"שמחת המצווה"} של ${g}`:n||"שמחת המצווה")
    :t==="brit"?(g?`${childOf(e)==="f"?"שמחת הבת":"ברית המילה"} של ${g}`:n||(childOf(e)==="f"?"שמחת הבת":"ברית המילה"))
    :(n||"האירוע שלנו");
  const hosts=t==="wedding"?(g&&b?`${g} ו${b}`:g||b||n):(t==="bar_mitzvah"||t==="brit")?(String(e?.groom_father||"").trim()||g||n):(g||n);
  return {type:t,name,hosts,emoji:EVENT_KINDS[t].emoji,greeting:t==="wedding"?"ליום המאושר בחיינו":"לאירוע המיוחד שלנו"};
};
// קישור למתנה (Bit / PayBox מפרטי האירוע). Bit יכול להיות גם מספר טלפון
export const normPhone = p => { let d=String(p||"").replace(/\D/g,""); if(d.startsWith("972"))d="0"+d.slice(3); return d.length>=9?d:""; };
// אורך מרבי להודעת SMS (אימוג'י = 2 תווים). הקישור האישי ב-SMS הוא קצר: sidoril.com/i/<קוד>
export const formatPhone = raw => {
  let d=String(raw??"").replace(/\D/g,"");
  if(d.startsWith("972"))d="0"+d.slice(3);
  if(d.length===9&&/^[2-9]/.test(d))d="0"+d;
  if(d.length===10&&d.startsWith("05"))return d.slice(0,3)+"-"+d.slice(3);
  return d||"";
};
// שורה חופשית ← שם + טלפון (+ מספר מוזמנים אם יש מספר קטן בסוף, למשל "שרה לוי, 4").
// הטלפון יכול להיות בכל מקום בשורה, מופרד בפסיק, רווח, טאב או כל דבר אחר
export const parseGuestLine = line => {
  const s=String(line||"").replace(/‏|‎/g,"").trim();
  // טלפון ישראלי: מתחיל ב-0 או ב-972 (עם/בלי +), עם או בלי רווחים ומקפים; גיבוי: 9 ספרות שמתחילות ב-5 (אקסל מחק את ה-0)
  const m=s.match(/(?:\+?972[\s\-.]?|\b0)(?:[\s\-.()]?\d){8,9}(?!\d)/)||s.match(/\b5\d{8}\b/);
  const phone=m?formatPhone(m[0]):"";
  const LABEL="(?:נייד|טלפון|טל'?|פלאפון|phone|tel|mobile)";
  let rest=m?s.slice(0,m.index).replace(new RegExp(LABEL+"\\s*[:.]?\\s*$","i"),"")+" "+s.slice(m.index+m[0].length):s;
  rest=rest.replace(new RegExp(LABEL+"\\s*:","gi")," ").replace(/\(\s*\)/g," ");
  let count=1;
  const cm=rest.match(/(?:^|[\s,;|\t])(\d{1,2})\s*$/);
  if(cm&&+cm[1]>=1&&+cm[1]<=30){count=+cm[1];rest=rest.slice(0,cm.index);}
  const name=rest.replace(/[,;|\t]+/g," ").replace(/\s+/g," ").trim().replace(/^[-–:.\s]+|[-–:.\s]+$/g,"");
  return {name,phone,count};
};
// אם הקלידו טלפון בתוך שדה השם ("עומרי גז 0526817106") ושדה הטלפון ריק  -  מפרידים
export const splitNamePhone = (name,phone) => {
  const n=String(name||"").trim();
  if(normPhone(phone))return {name:n,phone:String(phone).trim()};
  const p=parseGuestLine(n);
  return p.phone&&p.name?{name:p.name,phone:p.phone}:{name:n,phone:String(phone||"").trim()};
};
// שורה מגיליון אקסל ← שם + טלפון, לפי שמות עמודות נפוצים (ואם אין  -  מנחשים מהתוכן)
// גם קובץ "Google CSV" מ-Google Contacts: First/Middle/Last Name (או Given/Family Name)
// ו-"Phone 1 - Value" ליד "Phone 1 - Label" (שבו כתוב Mobile — לא מספר). כמה מספרים בתא מופרדים ב-" ::: "
export function PhoneExistsDialog({ guest, count, setCount, onUpdate, onBack, busy=false, zIndex=320 }) {
  return(
    <div style={{position:"fixed",inset:0,zIndex,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Heebo',sans-serif"}} onClick={onBack}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" style={{background:"#fff",borderRadius:24,padding:"26px 22px 22px",width:"100%",maxWidth:420,boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)",animation:"sxPopIn .35s cubic-bezier(.3,1.4,.5,1) both"}}>
        <div style={{width:58,height:58,borderRadius:18,background:"#FFF4E0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 12px"}}>📞</div>
        <div style={{fontWeight:900,fontSize:19,color:C.text,textAlign:"center",marginBottom:6}}>המספר הזה כבר קיים ברשימה</div>
        <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:16,lineHeight:1.6}}>אי אפשר לרשום את אותו מספר טלפון פעמיים.<br/>אפשר לעדכן את מספר המוזמנים של האורח הקיים:</div>
        <div style={{background:C.blueXL,borderRadius:16,padding:"12px 14px",marginBottom:16,border:`1.5px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:GRAD,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,flexShrink:0}}>{ini(guest.name)}</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:15,fontWeight:900,color:C.text}}>{guest.name}</div>
            <div style={{fontSize:12,color:C.muted,direction:"ltr",textAlign:"right"}}>{guest.phone}</div>
            <div style={{fontSize:12,color:C.muted}}>כרגע: {guest.guest_count||1} מוזמנים · {guest.rsvp==="confirmed"?"✅ מגיע":guest.rsvp==="declined"?"❌ לא מגיע":"⏳ ממתין"}</div>
          </div>
        </div>
        <div style={{fontSize:12,fontWeight:800,color:C.muted,marginBottom:8,textAlign:"center"}}>מספר מוזמנים מעודכן</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:18}}>
          <button onClick={()=>setCount(c=>Math.max(1,c-1))} aria-label="פחות" style={{width:44,height:44,borderRadius:14,border:`1.5px solid ${C.border}`,background:"#fff",fontSize:22,fontWeight:900,color:C.blue,cursor:"pointer"}}>−</button>
          <span style={{fontSize:32,fontWeight:900,color:C.text,minWidth:40,textAlign:"center"}}>{count}</span>
          <button onClick={()=>setCount(c=>Math.min(30,c+1))} aria-label="יותר" style={{width:44,height:44,borderRadius:14,border:"none",background:GRAD,fontSize:22,fontWeight:900,color:"#fff",cursor:"pointer"}}>+</button>
        </div>
        <button onClick={onUpdate} disabled={busy} className="sx-btn sx-btn-primary"
          style={{width:"100%",background:GRAD,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:8,opacity:busy?.6:1}}>
          {busy?"מעדכן...":"✅ עדכן מספר מוזמנים"}
        </button>
        <button onClick={onBack} style={{width:"100%",background:"transparent",color:C.muted,border:"none",padding:"8px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>→ חזרה</button>
      </div>
    </div>
  );
}

export const Spinner = ({size=24,color=C.blue}) => (
  <div style={{width:size,height:size,borderRadius:"50%",border:`2.5px solid ${color}22`,borderTopColor:color,animation:"spin .7s linear infinite",flexShrink:0}}/>
);

export function cdParts(ms){return{d:Math.floor(ms/864e5),h:Math.floor(ms/36e5)%24,m:Math.floor(ms/6e4)%60,s:Math.floor(ms/1e3)%60};}
export function useTick(target){
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[target]);
  const ms=target-now;return isNaN(ms)||ms<=0?null:cdParts(ms);
}
export function IvCountdown({ target }){
  const c=useTick(target);if(!c)return null;
  const it={color:"#fff",fontWeight:800,fontSize:14,fontVariantNumeric:"tabular-nums"};
  return(
    <div className="iv-cd" role="timer" aria-label={`עוד ${c.d} ימים לאירוע`} style={{background:"linear-gradient(135deg,#1B3A8C,#2952C8)",padding:"10px 16px",textAlign:"center",direction:"rtl"}}>
      <div style={{display:"inline-flex",gap:14,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
        <span style={{fontSize:13,color:"rgba(255,255,255,.9)",fontWeight:700}}>⏳ עד האירוע:</span>
        <span style={{display:"inline-flex",gap:14,direction:"ltr"}}>
          {c.d>0&&<span style={it} dir="rtl">{c.d} ימים</span>}
          <span style={it} dir="rtl">{c.h} שעות</span>
          <span style={it} dir="rtl">{c.m} דקות</span>
          <span style={it} dir="rtl">{String(c.s).padStart(2,"0")} שניות</span>
        </span>
      </div>
    </div>);
}
export const DEFAULT_MEALS=["רגיל","צמחוני","טבעוני","ללא גלוטן"];
export const rsvpQOf=event=>({meal:false,mealOptions:DEFAULT_MEALS,kids:false,allergies:false,transport:false,...(event?.settings_json?.rsvpQ||{})});
export const anyRsvpQ=q=>q.meal||q.kids||q.allergies||q.transport;
// סיכום מכל מי שאישר הגעה: מנות לפי סוג, ילדים, הסעה, ורשימת אלרגיות
export function GuestQR({ code, guestId }) {
  const [src,setSrc]=useState("");
  useEffect(()=>{
    let live=true;
    import("qrcode").then(m=>m.default.toDataURL(`https://www.sidoril.com/#/invite/${code}?g=${guestId}`,{width:240,margin:1,color:{dark:"#2B1D3F"}})).then(u=>{if(live)setSrc(u);}).catch(()=>{});
    return()=>{live=false;};
  },[code,guestId]);
  if(!src)return null;
  return(
    // מעל שכבת הקונפטי (zIndex 9999) כדי שלא תפריע לסריקה
    <div style={{background:"#fff",borderRadius:16,padding:"14px 14px 10px",display:"inline-block",textAlign:"center",boxShadow:"0 4px 18px rgba(0,0,0,.12)",position:"relative",zIndex:10000}}>
      <img src={src} alt="קוד QR אישי לכניסה" width={180} height={180} style={{display:"block"}}/>
      <div style={{fontSize:12,fontWeight:700,color:"#555",marginTop:6}}>הציגו בכניסה לאולם</div>
    </div>
  );
}

// ─── כניסה לאולם: סריקת QR מהקישור האישי של האורח (או חיפוש שם) → מספר השולחן + סימון "הגיע" (guests.arrived_at) ───
// מזהה את האורח מכל קישור שלנו: ?g=<id> (קישור אישי) או /i/<קוד> (קישור מקוצר ב-SMS)
export const INVITE_TEMPLATES = {
  wedding: [
    { id:"classic", name:"קלאסי", bg:"linear-gradient(160deg,#1a0a2e,#3d1f6e,#6b3fa0)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1592125661285-79820f2fdf7a_800.webp", titleColor:"#fff", accent:"#E8C4FF" },
    { id:"romantic", name:"רומנטי", bg:"linear-gradient(160deg,#3d0a0a,#7a1f1f,#c45050)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1520854221256-17451cc331bf_800.webp", titleColor:"#fff", accent:"#FFB3B3" },
    { id:"elegant", name:"אלגנטי", bg:"linear-gradient(160deg,#0a0a0a,#2a2a2a,#4a4a4a)", overlay:"rgba(0,0,0,.5)", img:"/img/u/1465495976277-4387d4b0b4c6_800.webp", titleColor:"#fff", accent:"#FFD700" },
    { id:"natural", name:"טבעי", bg:"linear-gradient(160deg,#0a2a1a,#1a5a2a,#2d8a4a)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1769812343890-4e406a33cfbe_800.webp", titleColor:"#fff", accent:"#90EE90" },
    { id:"bright", name:"פרחוני", bg:"linear-gradient(160deg,#f5f0ff,#e8d5ff,#d0b0ff)", overlay:"rgba(0,0,0,.3)", img:"/img/u/1469371670807-013ccf25f16a_800.webp", titleColor:"#fff", accent:"#FFB3D9" },
    { id:"barn", name:"אולם כפרי", bg:"linear-gradient(160deg,#1a0a2e,#3d1f6e,#6b3fa0)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1780888207019-dd9121069a81_800.webp", titleColor:"#fff", accent:"#FFD9A8" },
    { id:"garden", name:"טקס בגן", bg:"linear-gradient(160deg,#0a2a1a,#1a5a2a,#2d8a4a)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1522673607200-164d1b6ce486_800.webp", titleColor:"#fff", accent:"#C6F6D5" },
    { id:"rings", name:"טבעות", bg:"linear-gradient(160deg,#1a0a2e,#3d1f6e,#6b3fa0)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1515934751635-c81c6bc9a2d8_800.webp", titleColor:"#fff", accent:"#FFD1E5" },
    { id:"sea", name:"שקיעה בים", bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1629744418692-345355518e78_800.webp", titleColor:"#fff", accent:"#BEE3F8" },
    { id:"chandelier", name:"נברשת", bg:"linear-gradient(160deg,#1a1000,#3d2800,#7a5000)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1703432287852-28f965fc3749_800.webp", titleColor:"#fff", accent:"#FFD700" },
    { id:"lightsgarden", name:"גן מואר", bg:"linear-gradient(160deg,#0a2a1a,#1a5a2a,#2d8a4a)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1607861884586-c7cfaed16290_800.webp", titleColor:"#fff", accent:"#FFE8A3" },
    { id:"lights", name:"אורות", bg:"linear-gradient(160deg,#1a0a2e,#3d1f6e,#6b3fa0)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1723832348105-2e69f948135a_800.webp", titleColor:"#fff", accent:"#FFD9A8" },
    { id:"goldgreen", name:"זהב וירוק", bg:"linear-gradient(160deg,#0a2a1a,#1a5a2a,#2d8a4a)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1620022604911-126743712882_800.webp", titleColor:"#fff", accent:"#E8C46A" },
    { id:"white", name:"לבן", bg:"linear-gradient(160deg,#f5f0ff,#e8d5ff,#d0b0ff)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1700142611715-8a023c5eb8c5_800.webp", titleColor:"#fff", accent:"#FFD1E5" },
    { id:"botanic", name:"בוטני", bg:"linear-gradient(160deg,#0a2a1a,#1a5a2a,#2d8a4a)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1721176487015-5408ae0e9bc2_800.webp", titleColor:"#fff", accent:"#C6F6D5" },
    { id:"lanterns", name:"פנסים", bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1628024564458-b3dfcceb3f34_800.webp", titleColor:"#fff", accent:"#FFD27A" },
    { id:"aisle", name:"שביל נרות", bg:"linear-gradient(160deg,#0a0a0a,#2a2a2a,#4a4a4a)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1641524967324-6c7882b4be80_800.webp", titleColor:"#fff", accent:"#FFE0B2" },
    { id:"table", name:"שולחן חגיגי", bg:"linear-gradient(160deg,#1a0a2e,#3d1f6e,#6b3fa0)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1511795409834-ef04bbd61622_800.webp", titleColor:"#fff", accent:"#FFD9A8" },
  ],
  bar_mitzvah: [
    { id:"blue", name:"כחול", bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1533174072545-7a4b6ad7a6c3_800.webp", titleColor:"#fff", accent:"#7DC4FF" },
    { id:"gold", name:"משפחתי", bg:"linear-gradient(160deg,#1a1000,#3d2800,#7a5000)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1792587545791-dbff25ac7905_800.webp", titleColor:"#fff", accent:"#FFD700" },
    { id:"balloons", name:"בלונים", bg:"linear-gradient(160deg,#3a0a2a,#7a1f5a,#c45090)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1530103862676-de8c9debad1d_800.webp", titleColor:"#fff", accent:"#FFB3D9" },
    { id:"confetti", name:"קונפטי", bg:"linear-gradient(160deg,#0a2a3a,#1a5a7a,#2d8aaa)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1513151233558-d860c5398176_800.webp", titleColor:"#fff", accent:"#BEE3F8" },
    { id:"party", name:"מסיבה", bg:"linear-gradient(160deg,#0a0a0a,#2a2a2a,#4a4a4a)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1475721027785-f74eccf877e2_800.webp", titleColor:"#fff", accent:"#FFD700" },
    { id:"prayer", name:"תפילה", bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1638702919819-2bb988863024_800.webp", titleColor:"#fff", accent:"#BEE3F8" },
    { id:"kippah", name:"כיפה", bg:"linear-gradient(160deg,#f5f0ff,#e8d5ff,#d0b0ff)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1643992017839-1ed8679d145d_800.webp", titleColor:"#fff", accent:"#7DC4FF" },
  ],
  brit: [
    { id:"soft", name:"עדין", bg:"linear-gradient(160deg,#0a2a1a,#1a5a2a,#2d8a4a)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1555252333-9f8e92e65df9_800.webp", titleColor:"#fff", accent:"#90EE90" },
    { id:"pink", name:"משפחתי", bg:"linear-gradient(160deg,#3a0a2a,#7a1f5a,#c45090)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1510154221590-ff63e90a136f_800.webp", titleColor:"#fff", accent:"#FFB3D9" },
    { id:"sweet", name:"רך ומתוק", bg:"linear-gradient(160deg,#f5f0ff,#e8d5ff,#d0b0ff)", overlay:"rgba(0,0,0,.3)", img:"/img/u/1678192568478-9488ee55def6_800.webp", titleColor:"#fff", accent:"#FFD1E5" },
    { id:"summer", name:"קיצי", bg:"linear-gradient(160deg,#0a2a3a,#1a5a7a,#2d8aaa)", overlay:"rgba(0,0,0,.3)", img:"/img/u/1594150878496-a921e5af8907_800.webp", titleColor:"#fff", accent:"#BEE3F8" },
    { id:"hug", name:"חיבוק", bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.3)", img:"/img/u/1770831208183-92f98cf3845b_800.webp", titleColor:"#fff", accent:"#FFD9A8" },
    { id:"tinyhands", name:"ידיים קטנות", bg:"linear-gradient(160deg,#3a0a2a,#7a1f5a,#c45090)", overlay:"rgba(0,0,0,.3)", img:"/img/u/1647650096640-c5c608e1d259_800.webp", titleColor:"#fff", accent:"#FFD1E5" },
  ],
  business: [
    { id:"dark", name:"כהה", bg:"linear-gradient(160deg,#0a0a0a,#1a1a1a,#2a2a2a)", overlay:"rgba(0,0,0,.5)", img:"/img/u/1540575467063-178a50c2df87_800.webp", titleColor:"#fff", accent:"#FFD700" },
    { id:"navy", name:"כנס", bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1574155088851-0c770818ba40_800.webp", titleColor:"#fff", accent:"#7DC4FF" },
    { id:"hall", name:"אולם כנסים", bg:"linear-gradient(160deg,#0a0a0a,#2a2a2a,#4a4a4a)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1511578314322-379afb476865_800.webp", titleColor:"#fff", accent:"#FFD700" },
    { id:"talk", name:"הרצאה", bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1505373877841-8d25f7d46678_800.webp", titleColor:"#fff", accent:"#BEE3F8" },
    { id:"stage", name:"במה", bg:"linear-gradient(160deg,#0a0a0a,#2a2a2a,#4a4a4a)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1670028514318-0ac718c0590d_800.webp", titleColor:"#fff", accent:"#FFD700" },
  ],
  other: [
    { id:"party", name:"מסיבה", bg:"linear-gradient(160deg,#1B3A8C,#2952C8,#4A7AFF)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1492684223066-81342ee5ff30_800.webp", titleColor:"#fff", accent:"#A0C4FF" },
    { id:"balloons", name:"בלונים", bg:"linear-gradient(160deg,#3a0a2a,#7a1f5a,#c45090)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1530103862676-de8c9debad1d_800.webp", titleColor:"#fff", accent:"#FFB3D9" },
    { id:"confetti", name:"קונפטי", bg:"linear-gradient(160deg,#0a2a3a,#1a5a7a,#2d8aaa)", overlay:"rgba(0,0,0,.35)", img:"/img/u/1513151233558-d860c5398176_800.webp", titleColor:"#fff", accent:"#BEE3F8" },
    { id:"mic", name:"ערב חגיגי", bg:"linear-gradient(160deg,#0a0a0a,#2a2a2a,#4a4a4a)", overlay:"rgba(0,0,0,.45)", img:"/img/u/1475721027785-f74eccf877e2_800.webp", titleColor:"#fff", accent:"#FFD700" },
    { id:"hall", name:"אולם", bg:"linear-gradient(160deg,#1a0a2e,#3d1f6e,#6b3fa0)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1773005695300-14b62bc85ba0_800.webp", titleColor:"#fff", accent:"#FFD9A8" },
    { id:"lights", name:"אורות", bg:"linear-gradient(160deg,#1a0a2e,#3d1f6e,#6b3fa0)", overlay:"rgba(0,0,0,.4)", img:"/img/u/1723832348105-2e69f948135a_800.webp", titleColor:"#fff", accent:"#FFD9A8" },
  ],
};

// קונפטי בפתיחת ההזמנה: נוצר פעם אחת (לא מחדש בכל הקלדה), יורד פעמיים ונעצר — לא נופל על הטופס בזמן שהאורח ממלא
export function InviteConfetti() {
  const [pieces]=useState(()=>[...Array(18)].map((_,i)=>({
    left:`${Math.random()*100}%`,
    color:["#FFD700","#FF6B6B","#4ECDC4","#A29BFE","#FD79A8","#55EFC4"][i%6],
    size:`${8+Math.random()*8}px`,
    delay:`${Math.random()*3}s`,
    dur:`${3+Math.random()*3}s`,
    borderRadius:i%3===0?"50%":"2px",
  })));
  return <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
    {pieces.map((p,i)=><div key={i} style={{position:"absolute",top:-20,left:p.left,width:p.size,height:p.size,background:p.color,borderRadius:p.borderRadius,animation:`confettiFall ${p.dur} ${p.delay} linear 2 both`,opacity:0.8}}/>)}
  </div>;
}
export function InvitePage({ code, guestId }) {
  const [event,setEvent]=useState(null);
  const [loading,setLoading]=useState(true);
  const [firstName,setFirstName]=useState("");
  const [giftCopied,setGiftCopied]=useState(null); // "bit" / "paybox" אחרי העתקת מספר הטלפון
  const [lastName,setLastName]=useState("");
  const [phoneState,setPhone]=useState("");
  const [guestCount,setGuestCount]=useState(1);
  const [rsvp,setRsvp]=useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [knownGuest,setKnownGuest]=useState(null); // אורח מזוהה מהקישור
  const [extra,setExtra]=useState({meals:{},kids:0,allergies:"",transport:false}); // שאלות נוספות (אם בעל האירוע הפעיל)
  // duplicate detection
  const [dupGuest,setDupGuest]=useState(null);
  const [showDupModal,setShowDupModal]=useState(false);
  const [phoneDupInv,setPhoneDupInv]=useState(false); // הטלפון כבר רשום  -  מציעים רק עדכון מספר מוזמנים
  const resolvedRef=useRef(null); // שם/טלפון אחרי הפרדה (אם הטלפון נכתב בשדה השם)

  // דף ההזמנה פתוח לאורחים שלא מחוברים, לכן כל הגישה למסד עוברת דרך פונקציות מאובטחות:
  // get_invite (אירוע אחד לפי קוד) · get_invite_guest (קישור אישי) · submit_rsvp (שמירה + בדיקת טלפון כפול)
  const [saveError,setSaveError]=useState("");
  useEffect(()=>{
    (async()=>{
      const{data,error}=await sb.rpc("get_invite",{p_code:code});
      setEvent(!error&&data?data:null);setLoading(false);
      // קישור אישי (?g=)  -  ממלאים את פרטי האורח אוטומטית
      if(data&&guestId){
        const{data:g}=await sb.rpc("get_invite_guest",{p_code:code,p_guest:guestId});
        if(g){
          setKnownGuest(g);
          const parts=g.name?.split(" ")||[];
          setFirstName(parts[0]||"");
          setLastName(parts.slice(1).join(" ")||"");
          setPhone(g.phone||"");
          setGuestCount(g.guest_count||1);
          if(g.rsvp&&g.rsvp!=="pending")setRsvp(g.rsvp);
          if(g.rsvp_extra)setExtra(x=>({...x,...g.rsvp_extra,meals:g.rsvp_extra.meals||{}}));
        }
      }
    })();
  },[code,guestId]);

  // שליחה לשרת. updateExisting=true  -  אחרי שהאורח אישר "עדכן מספר מוזמנים" לטלפון שכבר קיים
  const sendRsvp=async(updateExisting=false)=>{
    const r=resolvedRef.current||{};
    const{data,error}=await sb.rpc("submit_rsvp",{
      p_code:code,p_name:r.name||"",p_phone:(r.phone||"").trim(),p_count:guestCount,p_rsvp:rsvp,
      p_guest:knownGuest?.id||null,p_update_existing:updateExisting,
      // תשובות נוספות נשלחות רק כשמאשרים הגעה ורק אם בעל האירוע הפעיל שאלות
      ...(rsvp==="confirmed"&&event&&anyRsvpQ(rsvpQOf(event))?{p_extra:{
        ...(rsvpQOf(event).meal?{meals:Object.fromEntries(Object.entries(extra.meals||{}).filter(([,v])=>+v>0))}:{}),
        ...(rsvpQOf(event).kids?{kids:Math.min(+extra.kids||0,guestCount)}:{}),
        ...(rsvpQOf(event).allergies?{allergies:String(extra.allergies||"").slice(0,300)}:{}),
        ...(rsvpQOf(event).transport?{transport:!!extra.transport}:{}),
      }}:{}),
    });
    if(error||!data||["no_invite","no_name"].includes(data.status)){
      setSaveError(error?"לא הצלחנו לשמור את האישור. בדקו את החיבור ונסו שוב.":data?.status==="no_name"?"נא למלא שם":"ההזמנה כבר לא פעילה");
      setSubmitting(false);return;
    }
    if(data.status==="phone_exists"){
      // השרת מחזיר רק שם פרטי (לא מזהה ולא טלפון) — מציגים את המספר שהאורח עצמו הקליד
      setDupGuest({...data,phone:(r.phone||"").trim()});setGuestCount(c=>Math.max(c,1));setPhoneDupInv(true);setSubmitting(false);return;
    }
    setSubmitted(true);setSubmitting(false);setShowDupModal(false);setPhoneDupInv(false);
  };
  const doInsert=()=>sendRsvp(false);
  const doUpdate=async()=>{setSubmitting(true);await sendRsvp(true);};

  const submit=async()=>{
    if(!firstName.trim()||!rsvp)return;
    setSubmitting(true);setSaveError("");
    // אורח שכתב את הטלפון בשדה השם  -  מפרידים לפני השמירה
    const sp=splitNamePhone(`${firstName.trim()} ${lastName.trim()}`,phoneState);
    let fullName=`${firstName.trim()}${lastName.trim()?" "+lastName.trim():""}`;
    let phone=phoneState.trim();
    if(sp.phone&&sp.phone!==phone){fullName=sp.name;phone=sp.phone;setPhone(sp.phone);const [f,...l]=sp.name.split(" ");setFirstName(f||"");setLastName(l.join(" "));}
    resolvedRef.current={name:fullName,phone};
    await sendRsvp(false);
  };

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#111"}}><Spinner size={40} color="#fff"/></div>);
  if(!event)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#111",fontFamily:"'Heebo',sans-serif",direction:"rtl"}}><div style={{textAlign:"center",color:"#fff"}}><div style={{fontSize:56,marginBottom:16}}>😕</div><div style={{fontSize:20,fontWeight:800}}>ההזמנה לא נמצאה</div></div></div>);

  const type=event.event_type||"wedding";
  const templates=INVITE_TEMPLATES[type]||INVITE_TEMPLATES.other;
  const tmpl=templates.find(t=>t.id===(event.template_id||"classic"))||templates[0];
  const eventDate=event.date?new Date(event.date):null;
  const dateStr=eventDate?eventDate.toLocaleDateString("he-IL",{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"";

  const share=()=>{
    const url=window.location.href;
    const text=`💌 הוזמנת ל${event.name}!\n${url}`;
    if(navigator.share){navigator.share({title:event.name,text,url});}
    else{navigator.clipboard.writeText(url);}
  };
  const navigate=(app)=>{const addr=encodeURIComponent(event.venue_address||event.venue||"");if(app==="waze")window.open(`https://waze.com/ul?q=${addr}`,"_blank");else window.open(`https://maps.google.com/?q=${addr}`,"_blank");};
  const addCalendar=()=>{
    if(!eventDate)return;
    const d=event.date.replace(/-/g,"");
    const t=(event.event_time||"19:00").replace(":","").padEnd(6,"0");
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${d}T${t}/${d}T${t}&location=${encodeURIComponent(event.venue_address||"")}`,"_blank");
  };

  // ── מודל כפילות ──
  const DupModal=()=>(
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(13,27,75,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"'Heebo',sans-serif",direction:"rtl"}}>
      <div style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",width:"100%",maxWidth:480,animation:"slideUp .3s ease both"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
        {/* אייקון */}
        <div style={{width:60,height:60,borderRadius:18,background:"#FFF8E1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>🔍</div>
        <div style={{fontWeight:900,fontSize:19,color:"#0D1B4B",textAlign:"center",marginBottom:6}}>מצאנו אורח דומה!</div>
        <div style={{fontSize:13,color:"#6B7DB3",textAlign:"center",marginBottom:20}}>קיים כבר ברשימה אורח עם שם או טלפון זהה</div>

        {/* כרטיס האורח הקיים */}
        <div style={{background:"#F0F4FF",borderRadius:14,padding:"14px 16px",marginBottom:22,border:"1.5px solid #D6E0FF"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#6B7DB3",marginBottom:6}}>האורח הקיים</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#2952C8,#4A7AFF)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>{ini(dupGuest?.name)}</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0D1B4B"}}>{dupGuest?.name}</div>
              {dupGuest?.phone&&<div style={{fontSize:12,color:"#6B7DB3",marginTop:2}}>📞 {dupGuest.phone}</div>}
              <div style={{fontSize:12,color:"#6B7DB3",marginTop:2}}>
                סטטוס: {dupGuest?.rsvp==="confirmed"?"✅ מגיע":dupGuest?.rsvp==="declined"?"❌ לא מגיע":"⏳ ממתין"}
              </div>
            </div>
          </div>
        </div>

        {/* כפתורות */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={doUpdate} style={{width:"100%",background:"linear-gradient(135deg,#2952C8,#4A7AFF)",color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            ✏️ עדכן את הסטטוס שלו
          </button>
          <button onClick={doInsert} style={{width:"100%",background:"#fff",color:"#0D1B4B",border:"1.5px solid #D6E0FF",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            ➕ הוסף כאורח חדש בנפרד
          </button>
          <button onClick={()=>{setShowDupModal(false);setSubmitting(false);}} style={{width:"100%",background:"transparent",color:"#6B7DB3",border:"none",borderRadius:14,padding:"10px",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
            ← חזרה לטופס
          </button>
        </div>
      </div>
    </div>
  );

  if(submitted){
    return(
      <div style={{minHeight:"100vh",background:tmpl.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Heebo',sans-serif",direction:"rtl",padding:20,position:"relative"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`url(${tmpl.img})`,backgroundSize:"cover",backgroundPosition:"center",opacity:.3}}/>
        <div style={{position:"relative",zIndex:1,textAlign:"center",color:"#fff"}}>
          <div style={{fontSize:80,marginBottom:20,animation:"float 3s ease-in-out infinite"}}>{rsvp==="confirmed"?"🎉":"💙"}</div>
          <div style={{fontSize:28,fontWeight:900,marginBottom:12}}>{rsvp==="confirmed"?"תודה! מחכים לך!":"תודה על העדכון"}</div>
          <div style={{fontSize:16,color:"rgba(255,255,255,.8)",lineHeight:1.8,maxWidth:300,margin:"0 auto"}}>
            {rsvp==="confirmed"?`${firstName}, האישור שלך התקבל!\nנשמח לראותך באירוע 🥂`:`${firstName}, קיבלנו את עדכונך 💙`}
          </div>
          {rsvp==="confirmed"&&knownGuest?.id&&<div style={{marginTop:22}}><GuestQR code={code} guestId={knownGuest.id}/></div>}
        </div>
      </div>
    );
  }

  return(
    <div dir="rtl" className={`iv iv-${inviteStyleOf(event)}`} style={{minHeight:"100vh",fontFamily:"'Heebo',sans-serif",background:"#f9f9f9"}}>
      <style>{INVITE_STYLE_CSS}</style>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}} @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
      {showDupModal&&DupModal()}
      {phoneDupInv&&dupGuest&&<PhoneExistsDialog guest={dupGuest} count={guestCount} setCount={setGuestCount} busy={submitting}
        zIndex={450} onBack={()=>setPhoneDupInv(false)} onUpdate={doUpdate}/>}

      {/* אפקט קונפטי */}
      {(event.settings_json?.confetti??true)&&<InviteConfetti/>}

      {/* ספירה לאחור */}
      {(event.settings_json?.countdown??true)&&eventDate&&<IvCountdown target={eventDate.getTime()}/>}

      <div style={{position:"relative",height:"55vw",maxHeight:360,minHeight:240,overflow:"hidden"}}>
        <div className="iv-kb" style={{position:"absolute",inset:0,backgroundImage:`url(${tmpl.img})`,backgroundSize:"cover",backgroundPosition:"center"}}/>
        <div style={{position:"absolute",inset:0,background:tmpl.overlay}}/>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center"}}>
          {/* גופן אחד לכל השורה (Syne בלי עברית הציג רק את ה-& בגופן אחר), וגדול יותר בנייד */}
          <h1 className="iv-title" style={{fontFamily:"'Heebo',sans-serif",fontSize:"clamp(34px,8.5vw,58px)",fontWeight:900,color:"#fff",lineHeight:1.12,letterSpacing:"-.01em",textShadow:"0 2px 18px rgba(0,0,0,.45)",margin:"0 0 8px"}}>
            {event.bride_name&&event.groom_name?<>{event.groom_name} & {event.bride_name}<br/><span style={{fontSize:"clamp(18px,4.6vw,28px)",fontWeight:700,opacity:.95}}>מתחתנים</span></>:event.name}
          </h1>
        </div>
      </div>

      <div className="iv-card" style={{background:"#fff",maxWidth:480,margin:"0 auto",padding:"24px 20px",boxShadow:"0 -8px 30px rgba(0,0,0,.08)",borderRadius:"20px 20px 0 0",marginTop:-20,position:"relative"}}>

        {/* תמונת הזמנה */}
        {event.invite_image&&(
          <div style={{marginBottom:20,borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.1)"}}>
            <img src={event.invite_image} alt="הזמנה" style={{width:"100%",maxHeight:300,objectFit:"contain",display:"block"}}
              onError={e=>{e.target.parentElement.style.display="none";}}/>
          </div>
        )}

        {event.welcome_text&&<p className="iv-welcome" style={{fontSize:15,color:"#555",lineHeight:1.8,textAlign:"center",marginBottom:20,fontStyle:"italic"}}>"{event.welcome_text}"</p>}

        <div className="iv-info" style={{borderTop:"1px solid #eee",borderBottom:"1px solid #eee",padding:"16px 0",marginBottom:20,textAlign:"center"}}>
          {dateStr&&<div style={{direction:"ltr",display:"inline-block"}}>{dateStr}</div>}
          {(event.settings_json?.hebrewDate??true)&&event.date&&(()=>{
            try{
              const d=new Date(event.date);
              const heb=new Intl.DateTimeFormat("he-IL-u-ca-hebrew",{year:"numeric",month:"long",day:"numeric"}).format(d);
              return <div style={{fontSize:14,color:"#666",marginBottom:4}}>{heb}</div>;
            }catch{return null;}
          })()}
          {event.event_time&&<div style={{fontSize:18,fontWeight:900,color:"#111",marginBottom:8,letterSpacing:".05em"}}>{event.event_time}</div>}
          {event.venue&&<div style={{fontSize:15,fontWeight:700,color:"#333",marginBottom:2}}>{event.venue}</div>}
          {event.venue_address&&<div style={{fontSize:13,color:"#6E6585",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>📍 {event.venue_address}</div>}
          {/* מספר שולחן  -  מוצג אם האורח אישר הגעה ויש לו שולחן */}
          {(event.settings_json?.tableNum??true)&&knownGuest?.table_id&&knownGuest?.rsvp==="confirmed"&&(
            <div style={{marginTop:12,background:"linear-gradient(135deg,#1B3A8C,#2952C8)",color:"#fff",borderRadius:12,padding:"10px 16px",display:"inline-block"}}>
              <span style={{fontSize:13,fontWeight:700}}>🪑 השולחן שלך: </span>
              {(()=>{const num=event.settings_json?.table_nums?.[knownGuest.table_id];const nm=String(knownGuest.table_name||"").replace(/^\s*\d+\s*/,"").trim();
                return num?<><span style={{fontSize:20,fontWeight:900}}>מספר {num}</span>{nm&&nm!==`שולחן ${num}`&&<span style={{fontSize:13,fontWeight:700,opacity:.9}}> · {nm}</span>}</>
                  :<span style={{fontSize:16,fontWeight:900}}>{knownGuest.table_name||"—"}</span>;})()}
            </div>
          )}
          {knownGuest?.id&&knownGuest?.rsvp==="confirmed"&&<div style={{marginTop:14}}><GuestQR code={code} guestId={knownGuest.id}/></div>}
        </div>

        {/* הכפתורים ממלאים את השורה לפי כמה שיש (2 או 3), במקום שלוש עמודות קבועות עם תא ריק */}
        {(()=>{const acts=[
            event.venue_address&&["🚗","נווט לאירוע",()=>navigate("waze")],
            eventDate&&["📅","הוסף ליומן",addCalendar],
            (event.settings_json?.shareBtn??true)&&["🔗","שתפו את האירוע",share],
          ].filter(Boolean);
          return acts.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:`repeat(${acts.length},1fr)`,gap:10,marginBottom:24}}>
            {acts.map(([ic,l,fn])=>(
              <button key={l} onClick={fn} className="sx-btn iv-act" style={{background:"#fff",border:"1px solid #DDD6E6",borderRadius:12,padding:"12px 6px",minHeight:64,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <span style={{fontSize:22}} aria-hidden="true">{ic}</span><span style={{fontSize:13,color:"#333",fontWeight:700}}>{l}</span>
              </button>
            ))}
          </div>);})()}

        {/* כפתורי מתנה  -  Bit / Paybox */}
        {(event.bit_link||event.paybox_link)&&(
          <div style={{marginBottom:24}}>
            <div className="iv-sub" style={{fontSize:14,fontWeight:700,color:"#555",textAlign:"center",marginBottom:10}}>💝 שלח מתנה דיגיטלית</div>
            {/* קישור (https) — נפתח ישר. מספר טלפון — ל-Bit ול-PayBox אין קישור ציבורי שפותח תשלום לפי מספר,
                לכן הכפתור מעתיק את המספר ומסביר מה לעשות (קודם הוא הוביל לכתובת שבורה) */}
            {(()=>{const isUrl=v=>/^https?:\/\//i.test(String(v||"").trim()),phoneOf=v=>String(v||"").replace(/[^\d+]/g,"");
              const fmt=p=>/^05\d{8}$/.test(p)?`${p.slice(0,3)}-${p.slice(3)}`:p;
              const items=[["bit","Bit","💚",event.bit_link,"linear-gradient(135deg,#1DB954,#17a347)","rgba(29,185,84,.35)"],["paybox","PayBox","💜",event.paybox_link,"linear-gradient(135deg,#6B46C1,#553C9A)","rgba(107,70,193,.35)"]].filter(x=>String(x[3]||"").trim());
              const st=(bg,sh)=>({display:"flex",alignItems:"center",gap:8,padding:"12px 18px",background:bg,color:"#fff",borderRadius:14,textDecoration:"none",fontSize:14,fontWeight:800,boxShadow:`0 4px 14px ${sh}`,border:"none",cursor:"pointer",fontFamily:"inherit"});
              return(<>
              <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                {items.map(([k,name,ic,val,bg,sh])=>isUrl(val)
                  ?<a key={k} href={String(val).trim()} target="_blank" rel="noopener noreferrer" style={st(bg,sh)}>{ic} {name}</a>
                  :<button key={k} onClick={()=>{const p=phoneOf(val);navigator.clipboard?.writeText(p).catch(()=>{});setGiftCopied(k);}} style={st(bg,sh)}>
                    {ic} {name} · <span style={{direction:"ltr",fontVariantNumeric:"tabular-nums"}}>{fmt(phoneOf(val))}</span>
                  </button>)}
              </div>
              {giftCopied&&<div role="status" style={{marginTop:10,fontSize:13,color:"#333",textAlign:"center",lineHeight:1.6}}>
                ✓ המספר הועתק. פתחו את אפליקציית {giftCopied==="bit"?"Bit":"PayBox"} והעבירו למספר הזה.
              </div>}
              </>);})()}
          </div>
        )}

        <div className="iv-rsvp" style={{background:"#f9f9f9",borderRadius:16,padding:20,marginBottom:20}}>
          <h3 className="iv-h" style={{fontSize:20,fontWeight:900,color:"#111",textAlign:"center",marginBottom:4}}>אישור הגעה</h3>
          <p style={{fontSize:14,color:"#666",textAlign:"center",marginBottom:18}}>נשמח לראותכם בין אורחינו</p>

          {/* תווית גלויה מעל כל שדה (כשהשדות מלאים מראש לא היה אפשר לדעת מה כל אחד), והשלמה אוטומטית של הטלפון */}
          {(()=>{const lbl={display:"block",fontSize:13,fontWeight:700,color:"#444",marginBottom:6},fld={background:"#fff",border:"1px solid #CFC8D9",borderRadius:10,padding:"12px 14px",fontSize:16,color:"#111",outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"};return(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <label><span style={lbl}>שם פרטי</span>
              <input value={firstName} onChange={e=>setFirstName(e.target.value)} autoComplete="given-name" style={fld}/></label>
            <label><span style={lbl}>שם משפחה</span>
              <input value={lastName} onChange={e=>setLastName(e.target.value)} autoComplete="family-name" style={fld}/></label>
          </div>
          <label style={{display:"block",marginBottom:16}}><span style={lbl}>מספר נייד</span>
            <input value={phoneState} onChange={e=>setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" style={{...fld,textAlign:"right"}}/></label>
          </>);})()}

          <div style={{textAlign:"center",marginBottom:16}}>
            <div id="inv-count-l" style={{fontSize:14,fontWeight:700,color:"#444",marginBottom:10}}>כמה תגיעו?</div>
            <div role="group" aria-labelledby="inv-count-l" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
              <button onClick={()=>setGuestCount(c=>Math.max(1,c-1))} aria-label="פחות אורחים" style={{width:44,height:44,borderRadius:"50%",background:"#fff",border:"1px solid #CFC8D9",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
              <span aria-live="polite" style={{fontSize:26,fontWeight:900,color:"#111",minWidth:32,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{guestCount}</span>
              <button onClick={()=>setGuestCount(c=>c+1)} aria-label="יותר אורחים" style={{width:44,height:44,borderRadius:"50%",background:"#fff",border:"1px solid #CFC8D9",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <button onClick={()=>setRsvp("confirmed")} aria-pressed={rsvp==="confirmed"} className="iv-yes" style={{background:rsvp==="confirmed"?"#1F7A4D":"#fff",color:rsvp==="confirmed"?"#fff":"#1F7A4D",border:"2px solid #1F7A4D",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:800,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              ✓ מגיעים
            </button>
            <button onClick={()=>setRsvp("declined")} aria-pressed={rsvp==="declined"} className="iv-no" style={{background:rsvp==="declined"?"#D63B3B":"#fff",color:rsvp==="declined"?"#fff":"#D63B3B",border:"2px solid #D63B3B",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:800,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              ✗ לא מגיעים
            </button>
          </div>

          {/* שאלות נוספות שבעל האירוע הפעיל — מוצגות מיד, ונעלמות רק כשבוחרים "לא מגיעים" (נשמרות רק עם "מגיעים") */}
          {rsvp!=="declined"&&anyRsvpQ(rsvpQOf(event))&&(()=>{const q=rsvpQOf(event),picked=Object.values(extra.meals||{}).reduce((a,b)=>a+(+b||0),0);
            const step=(v,set,max)=>(<div style={{display:"flex",alignItems:"center",gap:10}}>
              <button type="button" onClick={()=>set(Math.max(0,v-1))} aria-label="פחות" style={{width:30,height:30,borderRadius:"50%",background:"#fff",border:"1px solid #ddd",fontSize:17,cursor:"pointer",fontWeight:700}}>−</button>
              <span style={{minWidth:22,textAlign:"center",fontWeight:900,fontSize:16}}>{v}</span>
              <button type="button" onClick={()=>set(Math.min(max,v+1))} aria-label="יותר" disabled={v>=max} style={{width:30,height:30,borderRadius:"50%",background:"#fff",border:"1px solid #ddd",fontSize:17,cursor:v>=max?"default":"pointer",fontWeight:700,opacity:v>=max?.4:1}}>+</button>
            </div>);
            return(
            <div className="iv-extra" style={{background:"#fff",border:"1px solid #eee",borderRadius:12,padding:"12px 14px",marginBottom:14,textAlign:"right"}}>
              {q.meal&&<div style={{marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:800,color:"#333",marginBottom:6}}>🍽️ סוג מנה <span style={{fontWeight:500,color:"#6E6585"}}>(נבחרו {picked} מתוך {guestCount})</span></div>
                {(q.mealOptions||DEFAULT_MEALS).map(m=>{const v=+(extra.meals?.[m]||0);return(
                  <div key={m} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0"}}>
                    <span style={{fontSize:14,color:"#333"}}>{m}</span>
                    {step(v,n=>setExtra(x=>({...x,meals:{...x.meals,[m]:n}})),v+Math.max(0,guestCount-picked))}
                  </div>);})}
              </div>}
              {q.kids&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderTop:q.meal?"1px solid #f3f3f3":"none"}}>
                <span style={{fontSize:13,fontWeight:800,color:"#333"}}>👶 מתוכם ילדים</span>
                {step(Math.min(+extra.kids||0,guestCount),n=>setExtra(x=>({...x,kids:n})),guestCount)}
              </div>}
              {q.transport&&<label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",fontSize:13,fontWeight:800,color:"#333",cursor:"pointer",borderTop:"1px solid #f3f3f3"}}>
                <input type="checkbox" checked={!!extra.transport} onChange={e=>setExtra(x=>({...x,transport:e.target.checked}))}/> 🚌 צריכים הסעה
              </label>}
              {q.allergies&&<div style={{paddingTop:8,borderTop:"1px solid #f3f3f3"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#333",marginBottom:6}}>⚠️ אלרגיות או הערות למטבח <span style={{fontSize:12,fontWeight:600,color:"#6E6585"}}>(יוצג רק לבעלי האירוע)</span></div>
                <input value={extra.allergies||""} onChange={e=>setExtra(x=>({...x,allergies:e.target.value}))} maxLength={300} placeholder="לא חובה"
                  style={{width:"100%",background:"#fff",border:"1px solid #ddd",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>}
            </div>);})()}

          {saveError&&<div role="alert" style={{background:"#FDECEE",color:"#C53030",border:"1px solid #F9D2D8",borderRadius:12,padding:"10px 12px",fontSize:13,fontWeight:700,marginBottom:10,textAlign:"center"}}>⚠️ {saveError}</div>}
          {/* כפתור לא זמין נשאר קריא ואומר מה חסר (קודם: לבן על אפור בהיר, 1.6:1, בלי הסבר) */}
          {(()=>{const ready=firstName.trim()&&rsvp;return(
          <button onClick={submit} disabled={!ready||submitting} className="iv-send"
            style={{width:"100%",background:ready?"#1B3A8C":"#ECE8F1",color:ready?"#fff":"#4A4060",border:"none",borderRadius:12,padding:"15px",fontSize:16,fontWeight:800,cursor:ready?"pointer":"default",fontFamily:"inherit",transition:"all .15s"}}>
            {submitting?"שולח...":ready?"שלח אישור ←":!firstName.trim()?"נא למלא שם פרטי":"בחרו מגיעים או לא מגיעים"}
          </button>);})()}
          {/* הודעה לפי סעיף 11 לחוק הגנת הפרטיות (תיקון 13): חובה / מטרה / בעל השליטה / מי מקבל / עיון ותיקון */}
          <p style={{fontSize:12,color:"#5F5675",textAlign:"center",lineHeight:1.6,marginTop:10}}>
            אין חובה חוקית למסור את הפרטים, אך בלעדיהם לא נוכל לרשום את אישור ההגעה. הפרטים נמסרים ל{eventWords(event).hosts?`בעלי האירוע (${eventWords(event).hosts})`:"בעלי האירוע"}, שהם בעלי השליטה במידע, לצורך ניהול האירוע בלבד, ונשמרים עבורם ב-Sidor-IL. אפשר לבקש לעיין בפרטים ולתקן אותם. <a href="https://www.sidoril.com/#/privacy" target="_blank" rel="noopener noreferrer" style={{color:"#3E3555"}}>מדיניות פרטיות</a>
          </p>
        </div>

        {/* מיתוג המפיק (אם בעל האירוע הוא מפיק שבחר להציג) */}
        {event.brand?.name&&(
          <div className="iv-brand" style={{textAlign:"center",padding:"6px 0 14px"}}>
            {event.brand.logo&&<img src={event.brand.logo} alt={event.brand.name} style={{height:48,maxWidth:160,objectFit:"contain",display:"block",margin:"0 auto 6px"}} onError={e=>{e.target.style.display="none";}}/>}
            <div style={{fontSize:13,color:"#666",fontWeight:700}}>בהפקת {event.brand.name}</div>
            {event.brand.phone&&<a href={`tel:${String(event.brand.phone).replace(/[^\d+]/g,"")}`} style={{fontSize:13,color:"#555",textDecoration:"none",direction:"ltr",display:"inline-block"}}>📞 {event.brand.phone}</a>}
          </div>
        )}
        <a href="https://www.sidoril.com/?ref=invite" target="_blank" rel="noopener" className="iv-foot"
          style={{display:"block",textAlign:"center",textDecoration:"none",padding:"4px 12px 22px",color:"#6B6B6B",fontSize:13,lineHeight:1.7}}>
          נוצר ב־<b style={{color:"#7A5BB0"}}>◈ Sidor-IL</b><br/>
          <span style={{color:"#8A4E86",fontWeight:700}}>מתכננים אירוע? סידור הושבה ואישורי הגעה, התחילו בחינם ←</span>
        </a>
      </div>
    </div>
  );
}

// ─── סגנונות להזמנה הדיגיטלית (נשמר ב-settings_json.inviteStyle) ───
export const INVITE_STYLES=[
  {id:"classic",name:"קלאסי",desc:"תמונה גדולה וכרטיס לבן",bg:"#F4F4F4",card:"#fff",ink:"#111",accent:"#1B3A8C",font:"'Heebo',sans-serif"},
  {id:"pastel",name:"פסטל",desc:"צבעים רכים ובועות, בצבעי Sidor-IL",bg:"linear-gradient(150deg,#EFE4FF,#FFE4F0 55%,#FFE9DC)",card:"#FFFBF7",ink:"#2B1D3F",accent:"linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)",font:"'Fredoka','Heebo',sans-serif"},
  {id:"evening",name:"ערב",desc:"כהה ואלגנטי עם זהב",bg:"#1E1230",card:"#2A1A3E",ink:"#F3EAD8",accent:"#E8B04A",font:"'Heebo',sans-serif"},
  {id:"minimal",name:"מינימלי",desc:"שחור לבן, נקי ושקט",bg:"#fff",card:"#fff",ink:"#111",accent:"#111",font:"'Heebo',sans-serif"},
  {id:"garden",name:"גן",desc:"ירוק רענן וטבעי",bg:"linear-gradient(160deg,#E6F6EE,#F6FBF3)",card:"#fff",ink:"#173D2F",accent:"#277A5B",font:"'Fredoka','Heebo',sans-serif"},
];
export const inviteStyleOf=event=>INVITE_STYLES.find(x=>x.id===event?.settings_json?.inviteStyle)?.id||"classic";
// בורר עם תצוגה מוקטנת של כל סגנון
export const INVITE_STYLE_CSS=`
@media (prefers-reduced-motion:no-preference){
  .iv-kb{animation:ivKb 16s cubic-bezier(0.23,1,0.32,1) both}
  .iv-title{animation:ivRise .9s cubic-bezier(0.23,1,0.32,1) .15s both}
  .iv-card{animation:ivRise .7s cubic-bezier(0.23,1,0.32,1) .3s both}
  .iv-card > *{animation:ivRise .6s cubic-bezier(0.23,1,0.32,1) both}
  .iv-card > *:nth-child(1){animation-delay:.42s}.iv-card > *:nth-child(2){animation-delay:.5s}.iv-card > *:nth-child(3){animation-delay:.58s}
  .iv-card > *:nth-child(4){animation-delay:.66s}.iv-card > *:nth-child(5){animation-delay:.74s}.iv-card > *:nth-child(n+6){animation-delay:.82s}
  .iv-yes,.iv-no,.iv-act,.iv-send{transition:transform 160ms cubic-bezier(0.23,1,0.32,1),background-color 200ms ease,color 200ms ease!important}
  .iv-yes:active,.iv-no:active,.iv-act:active,.iv-send:active{transform:scale(.97)}
}
@keyframes ivKb{from{transform:scale(1.1)}to{transform:scale(1)}}
@keyframes ivRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.iv-pastel,.iv-garden{font-synthesis-weight:none}
.iv-pastel{background:radial-gradient(700px 500px at 90% 0%,#EFE4FF,rgba(239,228,255,0) 60%),radial-gradient(600px 500px at 0% 60%,#FFE4F0,rgba(255,228,240,0) 60%),#FFFBF7!important}
.iv-pastel .iv-cd{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)!important}
.iv-pastel .iv-title,.iv-pastel .iv-h{font-family:'Fredoka','Heebo',sans-serif!important;font-weight:700!important}
.iv-pastel .iv-card{background:#FFFBF7!important;border-radius:34px 34px 0 0!important}
.iv-pastel .iv-info{border:none!important;background:#fff;border-radius:26px;padding:18px!important;box-shadow:0 16px 34px -26px rgba(91,60,140,.6)}
.iv-pastel .iv-act{border:none!important;border-radius:22px!important;box-shadow:0 14px 28px -22px rgba(91,60,140,.6)}
.iv-pastel .iv-rsvp{background:#F6F0FF!important;border-radius:30px!important}
.iv-pastel .iv-rsvp input{border-radius:16px!important;border-color:#E6DDF5!important}
.iv-pastel .iv-yes,.iv-pastel .iv-no{border-radius:100px!important}
.iv-pastel .iv-send:not(:disabled){background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)!important;border-radius:100px!important;box-shadow:0 14px 28px -14px rgba(240,96,158,.7)}
.iv-evening{background:#1E1230!important}
.iv-evening .iv-cd{background:#2C1A44!important}
.iv-evening .iv-cd span{color:#E8B04A!important}
.iv-evening .iv-title{letter-spacing:.02em!important}
.iv-evening .iv-card{background:#2A1A3E!important;color:#F3EAD8;box-shadow:0 -10px 40px rgba(0,0,0,.4)!important}
.iv-evening .iv-welcome,.iv-evening .iv-sub{color:#E9DCC4!important}
.iv-evening .iv-info{border-color:rgba(232,176,74,.35)!important}
.iv-evening .iv-info div,.iv-evening .iv-info span{color:#F3EAD8!important}
.iv-evening .iv-act{background:#33214B!important;border-color:rgba(232,176,74,.5)!important}
.iv-evening .iv-act span{color:#F3EAD8!important}
.iv-evening .iv-rsvp{background:#33214B!important}
.iv-evening .iv-rsvp h3,.iv-evening .iv-rsvp p,.iv-evening .iv-rsvp label span,.iv-evening .iv-rsvp [id=inv-count-l],.iv-evening .iv-rsvp [aria-live]{color:#F3EAD8!important}
.iv-evening .iv-rsvp p a{color:#E8B04A!important}
.iv-evening .iv-extra{background:#2A1A3E!important;border-color:rgba(232,176,74,.3)!important}
.iv-evening .iv-extra span,.iv-evening .iv-extra div,.iv-evening .iv-extra label{color:#F3EAD8!important}
.iv-evening .iv-send:not(:disabled){background:#E8B04A!important;color:#241433!important}
.iv-evening .iv-foot,.iv-evening .iv-foot *,.iv-evening .iv-brand,.iv-evening .iv-brand *{color:#CDBFE0!important}
.iv-minimal{background:#fff!important}
.iv-minimal .iv-cd{background:#111!important}
.iv-minimal .iv-title{font-weight:300!important;letter-spacing:.03em!important}
.iv-minimal .iv-card{box-shadow:none!important;border-radius:0!important;border-top:1px solid #111}
.iv-minimal .iv-info{border-color:#111!important}
.iv-minimal .iv-act{border:1px solid #111!important;border-radius:100px!important}
.iv-minimal .iv-rsvp{background:#fff!important;border:1px solid #111;border-radius:0!important}
.iv-minimal .iv-rsvp input{border-color:#111!important;border-radius:0!important}
.iv-minimal .iv-yes,.iv-minimal .iv-no{border-radius:100px!important}
.iv-minimal .iv-send:not(:disabled){background:#111!important;border-radius:100px!important}
.iv-garden{background:linear-gradient(160deg,#E6F6EE,#F6FBF3)!important}
.iv-garden .iv-cd{background:#277A5B!important}
.iv-garden .iv-title,.iv-garden .iv-h{font-family:'Fredoka','Heebo',sans-serif!important;font-weight:700!important}
.iv-garden .iv-card{border-radius:30px 30px 0 0!important}
.iv-garden .iv-info{border-color:#CDEBDD!important}
.iv-garden .iv-act{border-color:#CDEBDD!important;border-radius:20px!important}
.iv-garden .iv-rsvp{background:#E9F7EF!important;border-radius:26px!important}
.iv-garden .iv-rsvp input{border-radius:14px!important;border-color:#BFE3D2!important}
.iv-garden .iv-yes,.iv-garden .iv-no{border-radius:100px!important}
.iv-garden .iv-send:not(:disabled){background:#277A5B!important;border-radius:100px!important}
`;

// ─── INVITE SETTINGS (inside app) ─────────────────────────────────────────────
export function ShortLinkRedirect({ short }) {
  const [missing,setMissing]=useState(false);
  useEffect(()=>{
    sb.rpc("resolve_guest_link",{p_short:short}).then(({data})=>{
      if(data?.code)window.location.replace(`/#/invite/${data.code}?g=${data.guest}`);
      else setMissing(true);
    }).catch(()=>setMissing(true));
  },[short]);
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,flexDirection:"column",gap:14,fontFamily:"'Heebo',sans-serif",direction:"rtl"}}>
      {missing
        ?<><div style={{fontSize:40}}>💌</div><p style={{color:C.text,fontSize:16,fontWeight:700}}>הקישור לא נמצא או שההזמנה כבר לא פעילה</p></>
        :<><Spinner size={40}/><p style={{color:C.muted,fontSize:15}}>פותח את ההזמנה...</p></>}
    </div>
  );
}


// מסלולי האורחים: /invite/<קוד> או #/invite/<קוד> (עם ?g=<אורח>), וקישור קצר /i/<קוד>
export const inviteRouteMatch=()=>{const p=window.location.pathname,h=window.location.hash;return p.match(/^\/invite\/([a-z0-9]+)/i)||h.match(/^#\/invite\/([a-z0-9]+)/i);};
export const shortRouteMatch=()=>window.location.pathname.match(/^\/i\/([a-z0-9]+)\/?$/i);
export function InviteRoute(){
  const m=inviteRouteMatch();if(!m)return null;
  const hash=window.location.hash;
  const guestId=new URLSearchParams(window.location.search).get("g")||
    hash.includes("?g=")&&hash.split("?g=")[1]||null;
  return(<><style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style><InvitePage code={m[1]} guestId={guestId}/></>);
}
