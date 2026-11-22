// מערכת הניהול (מסכי האירוע, מפת ההושבה, אדמין, יצירת אירוע, אזור הספקים) — נטענת רק אחרי כניסה למערכת,
// כדי שמבקר חדש בדף הבית לא יוריד אותה. משתמשת ברכיבים ובעזרים המשותפים מ-App.jsx ומ-invite-core.jsx
import { useState, useEffect, useCallback, useRef, useLayoutEffect, Fragment } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, sb, C, GRAD, ini, EVENT_KINDS, childOf, eventWords, normPhone, formatPhone, parseGuestLine, splitNamePhone, PhoneExistsDialog, Spinner, cdParts, useTick, IvCountdown, DEFAULT_MEALS, rsvpQOf, anyRsvpQ, GuestQR, INVITE_TEMPLATES, InviteConfetti, InvitePage, INVITE_STYLES, inviteStyleOf, INVITE_STYLE_CSS, ShortLinkRedirect, InviteRoute, inviteRouteMatch, shortRouteMatch } from "./invite-core.jsx";

import { WaIcon, SMS_UNIT_PRICE, SMS_BUY_MIN, SMS_BUY_SLIDER_MAX, SMS_BUY_MAX, BASIC_PRICE, FREE_SEATING_LIMIT, CountUp, contactUrl, SUPPORT_WA, SUPPORT_MAIL, SUPPORT_PHONE, LP, isStandalone, InstallAppButton, lpMotionOK, LP_STORY, Stars, myRefCode, PushDevice, optSet, PENDING_SCREEN, readLastScreen, LAST_SCREEN_KEY, AccessibilityWidget, openContact, CONTACT_BY, waLink, isFeatured, SUPPLIER_CATS, SUPPLIER_REGIONS, SupplierCard, SupplierDetails, SUPPLIER_CAT, PublicPage, setPendingScreen, PRODUCER_ENTRY_KEY, SidorLogo, ADMIN_EMAIL, authErrorText, isAdminUser, SUPPLIER_REGION } from "./App.jsx";

export const WA_GREEN="#15803D"; // ירוק כהה מספיק לטקסט לבן (ניגודיות 5:1, תקן נגישות)
// הודעת ההזמנה לשליחה ידנית בוואטסאפ: באותו סגנון של הזמנת ה-SMS, אבל בלי שם (נשלחת לכולם אותו דבר)
export const inviteShareText=(event,url)=>{
  const ew=eventWords(event);
  const d=event.date?new Date(event.date):null;
  const days=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const date=d&&!isNaN(d)?`יום ${days[d.getDay()]}, ${d.toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}`:"בקרוב";
  const gift=giftLine(event);
  const own=event.welcome_text?.trim();
  if(own){
    const t=own.replace(/[ \t]*\{שם( מלא)?\}/g,"").replace(/\{שולחן\}/g,"");
    const body=t.includes("{קישור}")?t.replace(/\{קישור\}/g,url):`${t}\n\n👇 לאישור הגעה:\n${url}`;
    return gift&&!body.includes(giftLink(event))?`${body}\n\n${gift}`:body;
  }
  // *טקסט* = מודגש בוואטסאפ
  const wed=event.event_type==="wedding"&&event.groom_name&&event.bride_name;
  const title=wed?`${event.groom_name} ו${event.bride_name} מתחתנים!`:`מוזמנים ל${ew.name}!`;
  // משפט הפתיחה לפי סוג האירוע
  const intro={
    wedding:[`שמחים להזמין אתכם לחגוג איתנו`,`את היום המיוחד שלנו ${ew.emoji}`],
    business:[`נשמח לארח אתכם באירוע ${ew.emoji}`],
  }[ew.type]||[`שמחים להזמין אתכם לחגוג איתנו ${ew.emoji}`];
  // חתונה בלי שמות בני הזוג — בלי חתימה (אחרת נחתם בשם האירוע)
  const sign=ew.type==="wedding"&&!event.groom_name&&!event.bride_name?"":ew.hosts;
  return [`✨ *${title}* ✨`,``,...intro,``,
    `📅 *${date}*`,...(event.event_time?[`🕗 *${event.event_time}*`]:[]),`📍 *${event.venue||"יפורסם בקרוב"}*`,``,
    `✅ *לאישור הגעה:*`,url,``,ew.type==="business"?`נשמח לראותכם!`:`נשמח לראותכם! ❤️`,...(sign?[sign]:[]),...(gift?[``,gift]:[])].join("\n");
};
// api.whatsapp.com ולא wa.me: ההפניה של wa.me שוברת אימוג'י (מופיעים כ-�)
export const waShareUrl=text=>"https://api.whatsapp.com/send?text="+encodeURIComponent(text);
// שדה תאריך מימין לשמאל: מציג את התאריך בעברית ("יום ב׳, 14 ביוני 2027") ופותח את בורר התאריכים של הדפדפן.
// שדה ה-date המקורי מציג 14/06/2027 משמאל לימין עם האייקון בצד הלא נכון.
export function DateField({ value, onChange, style, compact=false, placeholder="בחרו תאריך" }) {
  const ref=useRef(null);
  const d=value?new Date(value+"T00:00:00"):null;
  const txt=d&&!isNaN(d)?d.toLocaleDateString("he-IL",compact?{day:"numeric",month:"short",year:"numeric"}:{weekday:"short",day:"numeric",month:"long",year:"numeric"}):placeholder;
  const open=()=>{try{ref.current?.showPicker();}catch{ref.current?.focus();}};
  return(
    <div onClick={open} style={{...style,position:"relative",display:"flex",alignItems:"center",gap:6,direction:"rtl",textAlign:"right",cursor:"pointer"}}>
      <span style={{flex:1,minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:d?undefined:"#6B6380"}}>{txt}</span>
      <span aria-hidden="true" style={{flexShrink:0}}>📅</span>
      <input ref={ref} type="date" value={value||""} onChange={e=>onChange(e.target.value)} aria-label={txt}
        style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0,border:"none",padding:0,margin:0,cursor:"pointer"}}/>
    </div>
  );
}
export const shareInviteWA=(event,url)=>window.open(waShareUrl(inviteShareText(event,url)),"_blank","noopener,noreferrer");
// קודי הפניה: sidoril.com/?ref=<קוד> (אולם, שותף, חבר מביא חבר, דף הזמנה) נשמר במכשיר ל-60 יום
// ונרשם פעם אחת על משתמש חדש. האדמין רואה מי הגיע דרך איזה קוד
export const onColor=c=>{const h=String(c||"").replace("#","");const x=h.length===3?h.split("").map(v=>v+v).join(""):h.slice(0,6);const n=parseInt(x,16);if(isNaN(n))return "#fff";const r=n>>16&255,g=n>>8&255,b=n&255;return (0.299*r+0.587*g+0.114*b)>165?"#2B1D3F":"#fff";};
export const WaButton=({event,url,label="שלח בוואטסאפ",style={}})=>(
  <button onClick={()=>shareInviteWA(event,url)} className="sx-btn" title="פותח וואטסאפ עם הודעה מוכנה וקישור להזמנה"
    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,background:"#0F7F40",color:"#fff",border:"none",borderRadius:12,
      padding:"10px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 18px -10px rgba(15,127,64,.6)",...style}}>
    {/* ירוק וואטסאפ כהה: טקסט לבן על #25D366 קריא רק ב-2:1, על #0F7F40 ב-5:1 */}
    <WaIcon/>{label}
  </button>
);

export const TABLE_TYPES = {
  round:  { label:"עגול",         icon:"⭕", defaultSeats:8  },
  rect:   { label:"מרובע",        icon:"⬛", defaultSeats:10 },
  knight: { label:"שולחן אבירים", icon:"👑", defaultSeats:20 },
};

// ─── מפת האולם: גדלים (ביחידות המפה) ואלמנטים שאפשר להוסיף ───
// שולחן עגול ≈ 160 יחידות. "ענק" (xl) הוא התקרה: האולם לא נפתח מעבר לזה
export const HALL_SIZES={s:[1400,880],m:[1800,1120],l:[2300,1420],xl:[2900,1800]};
export const HALL_SIZE_ORDER=["s","m","l","xl"];
export const HALL_MARGIN=40;
// עיצוב כמו מפת האולם המאוירת בדף הבית (SeatingPlanDemo): במה ושולחן חתן-כלה כגלולה ורודה-סגולה,
// רחבה בפרקט, ושאר האלמנטים כרטיס לבן עם אריח אייקון בצבע (tile). w/h: גודל התחלתי
export const HALL_ITEM_KINDS={
  stage:   {label:"במה",              icon:"🎤",w:340,h:64, pill:true},
  head:    {label:"שולחן חתן וכלה",   icon:"💍",w:300,h:54, pill:true,chairs:true},
  dance:   {label:"רחבת ריקודים",     icon:"✨",w:300,h:340,dance:true},
  bar:     {label:"בר",               icon:"🥂",w:170,h:64, tile:"#FFF0F6"},
  entrance:{label:"כניסה",            icon:"🚪",w:180,h:50, tile:"#F1EAFF"},
  dj:      {label:"עמדת DJ",          icon:"🎧",w:150,h:64, tile:"#EEF5FF"},
  chuppah: {label:"חופה",             icon:"💐",w:170,h:170,tile:"#FFF0F6",round:true},
  buffet:  {label:"מזנון / בופה",     icon:"🍽️",w:260,h:64, tile:"#FFF6E2"},
  photo:   {label:"פינת צילום",       icon:"📸",w:160,h:100,tile:"#EEF5FF"},
  kids:    {label:"פינת ילדים",       icon:"🧸",w:190,h:140,tile:"#E9FBF4"},
  gifts:   {label:"עמדת מתנות",       icon:"🎁",w:160,h:64, tile:"#FFF0F6"},
  wc:      {label:"שירותים",          icon:"🚻",w:150,h:64, tile:"#F3F1F7"},
  text:    {label:"טקסט חופשי",       icon:"🏷️",w:180,h:56, tile:"#F1EAFF"},
};

// תבניות אולם מוכנות: אילו שולחנות ואלמנטים. המיקומים מחושבים ב"סידור מושלם" אחרי הטעינה
export const BUILTIN_HALLS=[
  {id:"b-wed150",icon:"💍",name:"חתונה קלאסית",desc:"15 שולחנות עגולים · עד 150 מוזמנים",tables:[["round",10,15]],items:["stage","head","dance","bar","entrance"]},
  {id:"b-wed300",icon:"💍",name:"חתונה גדולה",desc:"30 שולחנות עגולים · עד 300 מוזמנים",tables:[["round",10,30]],items:["stage","head","dance","dj","bar","entrance"]},
  {id:"b-knight",icon:"👑",name:"חתונה בשולחנות אבירים",desc:"10 שולחנות אבירים · עד 200 מוזמנים",tables:[["knight",20,10]],items:["stage","head","dance","bar","entrance"]},
  {id:"b-garden",icon:"🌿",name:"גן אירועים מעורב",desc:"15 עגולים + 5 אבירים · עד 250 מוזמנים",tables:[["round",10,15],["knight",20,5]],items:["chuppah","stage","dance","bar","entrance"]},
  {id:"b-mitzva",icon:"✡️",name:"בר / בת מצווה",desc:"12 שולחנות עגולים · עד 120 מוזמנים",tables:[["round",10,12]],items:["stage","dance","dj","photo","bar","entrance"]},
  {id:"b-small",icon:"👶",name:"ברית / אירוע קטן",desc:"6 שולחנות מרובעים · עד 60 מוזמנים",tables:[["rect",10,6]],items:["buffet","gifts","entrance"]},
  {id:"b-biz",icon:"💼",name:"אירוע עסקי",desc:"10 שולחנות עגולים · עד 100 משתתפים",tables:[["round",10,10]],items:["stage","buffet","entrance"]},
];
// תצוגה מקדימה קטנה של תבנית: שמורה — לפי המיקומים; מוכנה — במה למעלה ושולחנות ברשת
export function HallPreview({ tpl }) {
  const W=120,H=76;
  let shapes=[];
  if(tpl.data?.tables?.length){
    const ts=tpl.data.tables,xs=ts.map(t=>t.x),ys=ts.map(t=>t.y);
    const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const s=Math.min((W-16)/Math.max(1,x1-x0),(H-24)/Math.max(1,y1-y0));
    shapes=ts.map(t=>({type:t.type,x:8+(t.x-x0)*s,y:18+(t.y-y0)*s}));
  }else if(tpl.tables){
    const list=tpl.tables.flatMap(([type,,n])=>Array(n).fill(type));
    const cols=Math.ceil(Math.sqrt(list.length*1.8)),rows=Math.ceil(list.length/cols);
    shapes=list.map((type,i)=>({type,x:8+(i%cols)*((W-16)/Math.max(1,cols-1||1)),y:22+Math.floor(i/cols)*((H-28)/Math.max(1,rows-1||1))}));
  }
  return(
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{flexShrink:0,background:"#FFFBF7",borderRadius:10,border:"1px solid #F0E8F4"}}>
      <rect x={W/2-22} y={4} width={44} height={7} rx={3.5} fill="#F0609E" opacity=".75"/>
      {shapes.map((t,i)=>t.type==="knight"
        ?<rect key={i} x={t.x-2} y={t.y-6} width={4} height={12} rx={2} fill="#9B6BFF"/>
        :t.type==="rect"?<rect key={i} x={t.x-3.5} y={t.y-3.5} width={7} height={7} rx={1.5} fill="#9B6BFF"/>
        :<circle key={i} cx={t.x} cy={t.y} r={3.6} fill="#9B6BFF"/>)}
    </svg>
  );
}

export const RELATION_COLORS = {
  "משפחה קרובה":   "#F0609E",
  "משפחה מורחבת":  "#FF8A65",
  "חברים קרובים":  "#2FA57A",
  "חברים רחוקים":  "#5AA9FF",
  "חברים של ההורים":"#9B6BFF",
  "ללא שיוך":      "#B8AECB",
};

// תאריך בעברית ("יום חמישי, 30 באפריל 2026") במקום 2026-04-30 — נקרא נכון מימין לשמאל
export const fmtDateHe=(d,opts={day:"numeric",month:"long",year:"numeric"})=>{
  if(!d)return "";
  const x=typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)?new Date(d+"T00:00:00"):new Date(d);
  return isNaN(x)?String(d):x.toLocaleDateString("he-IL",opts);
};
// שורת אירוע לשמירה: עמודת date היא מסוג date, ולכן תאריך ריק נשלח כ-null (אחרת כל השמירה נדחית)
export const eventRow=d=>("date" in d&&!d.date)?{...d,date:null}:d;
// תאריך עברי באותיות לפי התאריך הלועזי: "יום ב׳, כ״ג בסיון תשפ״ז"
export const heNum=n=>{
  const L=[[400,"ת"],[300,"ש"],[200,"ר"],[100,"ק"],[90,"צ"],[80,"פ"],[70,"ע"],[60,"ס"],[50,"נ"],[40,"מ"],[30,"ל"],[20,"כ"],[10,"י"],[9,"ט"],[8,"ח"],[7,"ז"],[6,"ו"],[5,"ה"],[4,"ד"],[3,"ג"],[2,"ב"],[1,"א"]];
  let s="";n=n%1000;
  while(n>0){if(n===15||n===16){s+=n===15?"טו":"טז";break;}const [v,c]=L.find(([v])=>v<=n);s+=c;n-=v;}
  return s.length>1?s.slice(0,-1)+"״"+s.slice(-1):s+"׳";
};
export const hebrewDateStr=(dateStr,withDay=false)=>{
  if(!dateStr)return "";
  try{
    const d=new Date(String(dateStr).slice(0,10)+"T12:00:00");if(isNaN(d))return "";
    const parts=new Intl.DateTimeFormat("he-u-ca-hebrew-nu-latn",{day:"numeric",month:"long",year:"numeric"}).formatToParts(d);
    const get=t=>parts.find(p=>p.type===t)?.value||"";
    const day=parseInt(get("day"),10),year=parseInt(get("year"),10),month=get("month").replace(/^ב/,"");
    if(!day||!year||!month)return "";
    const wd=["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","שבת"][d.getDay()];
    return `${withDay?(wd==="שבת"?"שבת, ":`יום ${wd}, `):""}${heNum(day)} ב${month} ${heNum(year)}`;
  }catch{return "";}
};
// שדה "שם האולם" עם הצעות מהרשימה הפנימית (venue_suggestions). אפשר תמיד להקליד חופשי;
// בחירת הצעה ממלאת גם את הכתובת (onPick)
export function VenueInput({ value, onChange, onPick, style, inputStyle, ...rest }) {
  const [list,setList]=useState([]),[open,setOpen]=useState(false),[hi,setHi]=useState(-1);
  const q=String(value||"").trim();
  useEffect(()=>{
    if(!open||q.length<2){setList([]);return;}
    let live=true;
    const t=setTimeout(async()=>{const{data}=await sb.rpc("venue_suggestions",{p_q:q});if(live){setList((data||[]).filter(v=>v.name!==q||v.address));setHi(-1);}},200);
    return()=>{live=false;clearTimeout(t);};
  },[q,open]);
  const pick=v=>{onPick?.({name:v.name,address:v.address||""});setOpen(false);setList([]);};
  const show=open&&list.length>0;
  return(
    <div style={{position:"relative",...style}}>
      <input {...rest} value={value} autoComplete="off" role="combobox" aria-expanded={show} aria-autocomplete="list"
        onChange={e=>{onChange(e.target.value);setOpen(true);}}
        onFocus={e=>{setOpen(true);rest.onFocus?.(e);}}
        onBlur={e=>{setTimeout(()=>setOpen(false),150);rest.onBlur?.(e);}}
        onKeyDown={e=>{
          if(!show)return;
          if(e.key==="ArrowDown"){e.preventDefault();setHi(h=>Math.min(list.length-1,h+1));}
          else if(e.key==="ArrowUp"){e.preventDefault();setHi(h=>Math.max(-1,h-1));}
          else if(e.key==="Enter"&&hi>=0){e.preventDefault();pick(list[hi]);}
          else if(e.key==="Escape")setOpen(false);
        }}
        style={inputStyle}/>
      {show&&<div role="listbox" style={{position:"absolute",top:"calc(100% + 4px)",insetInlineStart:0,insetInlineEnd:0,zIndex:50,background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:12,boxShadow:"0 12px 28px -12px rgba(43,29,63,.35)",overflow:"hidden",maxHeight:260,overflowY:"auto"}}>
        {list.map((v,i)=>(
          <div key={v.name} role="option" aria-selected={i===hi} onMouseDown={e=>{e.preventDefault();pick(v);}} onMouseEnter={()=>setHi(i)}
            style={{padding:"9px 12px",cursor:"pointer",background:i===hi?"#F6F0FF":"#fff",borderBottom:"1px solid #F4EEFC",textAlign:"right"}}>
            <div style={{fontSize:14,fontWeight:800,color:"#2B1D3F"}}>📍 {v.name}</div>
            {v.address&&<div style={{fontSize:12,color:"#8A7FA0",marginTop:1}}>{v.address}</div>}
          </div>
        ))}
        <div style={{padding:"6px 12px",fontSize:12,color:"#A0AEC0",background:"#FBF9FD"}}>לא ברשימה? פשוט המשיכו להקליד</div>
      </div>}
    </div>
  );
}
// האירועים שלי + אירועים ששיתפו איתי (event_members לפי המייל המאומת). אירוע משותף מסומן _shared
export const loadMyEvents=async(user,orderBy,asc)=>{
  const [{data:own},{data:mem}]=await Promise.all([
    sb.from("events").select("*").eq("user_id",user.id).order(orderBy,{ascending:asc}),
    sb.from("event_members").select("event_id").eq("email",String(user.email||"").toLowerCase()),
  ]);
  const ids=(mem||[]).map(m=>m.event_id).filter(id=>!(own||[]).some(e=>e.id===id));
  if(!ids.length)return own||[];
  const{data:shared}=await sb.from("events").select("*").in("id",ids);
  return [...(own||[]),...(shared||[]).map(e=>({...e,_shared:true}))];
};
// ─── סוגי אירועים: שמות השדות ונוסח ההודעות לפי הסוג ───
// groom_name = השם הראשי (חתן / חתן-כלת המצווה / התינוק / המארח), bride_name = רק בחתונה (הכלה)
export const COUPLE_TYPES={
  mf:{label:"חתן וכלה",emoji:"💍",a:"שם החתן",b:"שם הכלה",pa:"הורי החתן",pb:"הורי הכלה",roles:[["groom","החתן"],["bride","הכלה"]]},
  mm:{label:"חתן וחתן",emoji:"💍",a:"שם החתן הראשון",b:"שם החתן השני",pa:"הורי החתן הראשון",pb:"הורי החתן השני",roles:[["groom","החתן הראשון"],["bride","החתן השני"]]},
  ff:{label:"כלה וכלה",emoji:"💍",a:"שם הכלה הראשונה",b:"שם הכלה השנייה",pa:"הורי הכלה הראשונה",pb:"הורי הכלה השנייה",roles:[["groom","הכלה הראשונה"],["bride","הכלה השנייה"]]},
};
export const coupleOf=e=>COUPLE_TYPES[e?.couple_type||e?.settings_json?.coupleType]?(e.couple_type||e.settings_json.coupleType):"mf";
// בבר/בת מצווה ובברית: בן או בת (settings_json.childGender, בטופס היצירה child_gender)
export const CHILD_KINDS={
  bar_mitzvah:{m:{people:"✡️ פרטי חתן המצווה",a:"שם חתן המצווה"},f:{people:"✡️ פרטי כלת המצווה",a:"שם כלת המצווה"}},
  brit:{m:{people:"👶 פרטי הברית",a:"שם התינוק"},f:{people:"👶 פרטי שמחת הבת",a:"שם התינוקת"}},
};
export const eventKind=e=>{const k=EVENT_KINDS[e?.event_type]||EVENT_KINDS.wedding;
  if(k===EVENT_KINDS.wedding)return {...k,...COUPLE_TYPES[coupleOf(e)]};
  const ck=CHILD_KINDS[e?.event_type]?.[childOf(e)];return ck?{...k,...ck}:k;};
// בורר סוג הזוג (יצירת אירוע ופרטי האירוע)
export function CouplePicker({ value, onChange }) {
  return(
    <div role="radiogroup" aria-label="בני הזוג" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {Object.entries(COUPLE_TYPES).map(([id,c])=>{const on=(value||"mf")===id;return(
        <button key={id} type="button" role="radio" aria-checked={on} onClick={()=>onChange(id)}
          style={{flex:"1 1 110px",background:on?"#FFE6F0":"#fff",color:"#2B1D3F",border:`2px solid ${on?"#F0609E":"#EFE8F7"}`,borderRadius:100,padding:"10px 14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka','Heebo',sans-serif",transition:"border-color 200ms ease,background-color 200ms ease"}}>
          {on?"✓ ":""}{c.label}
        </button>);})}
    </div>
  );
}
// שם האירוע בתוך משפט ("מוזמנים ל…", "מחכים לך ב…") וחתימה ("באהבה, …"). כמו buildTemplates ב-sms-scheduler
export const giftLink=e=>{
  const bit=String(e?.bit_link||"").trim(),pb=String(e?.paybox_link||"").trim();
  if(bit)return /^https?:\/\//i.test(bit)?bit:`Bit ${bit}`;
  return pb;
};
export const giftLine=e=>{const l=giftLink(e);return l?`💝 למתנה: ${l}`:"";};
// תווית שולחן לאורחים: "3 (משפחת הכלה)" — המספר מ-settings_json.table_nums; בלי מספר — השם בלבד.
// אותה פונקציה ב-send-sms וב-sms-scheduler (tableLabel) — לשנות בכל המקומות
export const tableLabel=(num,name)=>{
  const n=String(name||"").replace(/^\s*\d+\s*/,"").trim();
  if(!num)return name||"—";
  return n&&n!==`שולחן ${num}`?`${num} (${n})`:String(num);
};
export const pct    = t => t.seats ? Math.round((t.guests||[]).length/t.seats*100) : 0;
export const sColor = t => { const g=(t.guests||[]).length; return g>=t.seats?C.danger:g>=t.seats*.8?C.gold:C.success; };
export const isMobile = () => window.innerWidth < 1024;

// השוואת טלפונים: רק ספרות, ו-972 בהתחלה נחשב כמו 0 (‎+972 52… = 052…)
export const SMS_MAX=200;
export const SHORT_LINK_HOST="sidoril.com/i/";
export const SMS_PACKS=[[150,70],[300,90],[500,120],[800,170],[1000,200],[2000,330]]; // כמויות מהירות באדמין
// רכישת SMS לפי כמות חופשית: מחיר להודעה × כמות.
// הודעות נקנות בנפרד. BASIC_PRICE = פתיחת הושבה מעל FREE_SEATING_LIMIT מוזמנים.
// hasBasicPkg כולל גם חבילות ישנות (sms / auto) שנרכשו כשהן כללו את הבסיסית
export const isProducerPkg=pkgs=>(pkgs||[]).some(p=>(p?.package_id??p)==="producer");
export const PRODUCER_ONLY=["checkin"];
export const hasBasicPkg=pkgs=>(pkgs||[]).some(p=>["basic","seating","sms","auto","vip","staff","producer"].includes(p?.package_id??p));
export const smsTotal=(q,base=0,unit=SMS_UNIT_PRICE)=>Math.round(q*unit*100)/100+base;
// חבילת הודעות WhatsApp: 4 סבבים אוטומטיים, מחיר לפי רשומה (אורח / משפחה עם טלפון אחד)
export const WA_RECORD_PRICE=1.8;
// תוספת מוקד מתקשר (נציגים מתקשרים לאורחים שלא אישרו) — אפשר להוסיף ל-SMS או ל-WhatsApp
export const CALL_RECORD_PRICE=0.8;
export const callTotal=r=>Math.round(r*CALL_RECORD_PRICE*100)/100;
export const WA_ROUNDS=["סבב 1 · הזמנה ובקשה לאישור הגעה","סבב 2 · תזכורת למי שעוד לא אישר","סבב 3 · ביום האירוע (עם מספר השולחן)","סבב 4 · תודה אחרי האירוע"];
export const fmtShekel=n=>`₪${n.toLocaleString("he-IL",{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})}`;
// בחירת כמות SMS: מד + שדה כמות, וחישוב סה״כ (כולל החבילה הבסיסית ברכישה ראשונה)
// callOn/onCallOn: תוספת מוקד מתקשר. callRecords: כמה רשומות למוקד (ב-WhatsApp = הכמות עצמה, ב-SMS נבחר בנפרד)
export const pickerTotal=({value,baseFee=0,unitPrice=SMS_UNIT_PRICE,callOn=false,callRecords})=>smsTotal(value,baseFee,unitPrice)+(callOn?callTotal(callRecords??value):0);
// baseOn/onBaseOn: סימון ✓ לחבילה הבסיסית (₪100, מסומן אוטומטית ברכישה ראשונה). baseOwned: כבר ברשות הלקוח
export function SmsQuantityPicker({ value, onChange, color=C.blue, baseFee=0, unitPrice=SMS_UNIT_PRICE, unitWord="הודעות", question="כמה הודעות?", callOn=false, onCallOn, callRecords, onCallRecords, baseOn, onBaseOn, baseOwned=false }) {
  const clamp=v=>Math.min(SMS_BUY_MAX,Math.max(SMS_BUY_MIN,Math.round(Number(v)||SMS_BUY_MIN)));
  const [txt,setTxt]=useState(String(value));
  useEffect(()=>{setTxt(String(value));},[value]);
  const recs=callRecords??value;
  return(
    <div style={{background:"#FBF8FF",border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 16px"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:800,color:C.text,flex:1}}>{question}</span>
        <input type="number" inputMode="numeric" min={SMS_BUY_MIN} max={SMS_BUY_MAX} value={txt} aria-label={`כמות ${unitWord}`}
          onChange={e=>{setTxt(e.target.value);const n=Number(e.target.value);if(n>=SMS_BUY_MIN&&n<=SMS_BUY_MAX)onChange(Math.round(n));}}
          onBlur={()=>{const v=clamp(txt);setTxt(String(v));onChange(v);}}
          style={{width:110,textAlign:"center",border:`1.5px solid ${color}`,borderRadius:10,padding:"8px 6px",fontSize:17,fontWeight:900,color,outline:"none",fontFamily:"inherit",background:"#fff"}}/>
      </div>
      <input type="range" min={SMS_BUY_MIN} max={SMS_BUY_SLIDER_MAX} step={50} value={Math.min(value,SMS_BUY_SLIDER_MAX)} aria-label="מד כמות הודעות"
        onChange={e=>onChange(Number(e.target.value))} style={{width:"100%",accentColor:color,cursor:"pointer",direction:"ltr"}}/>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,fontWeight:700,direction:"ltr"}}><span>{SMS_BUY_MIN}</span><span>{SMS_BUY_SLIDER_MAX.toLocaleString()}+</span></div>
      {/* החבילה הבסיסית: ✓ מסומן אוטומטית ומוסיף ₪100 (אלא אם כבר נרכשה) */}
      {onBaseOn&&baseFee>0&&<div style={{marginTop:10,background:baseOwned?"#F0FFF4":baseOn?"#F4EEFC":"#fff",border:`1.5px solid ${baseOwned?"#9AE6B4":baseOn?C.blueL:C.border}`,borderRadius:12,padding:"10px 12px"}}>
        {/* חובה: אם הבסיסית עוד לא נרכשה היא נוספת (₪100) ואי אפשר לבטל; אם כבר נרכשה — לא מחויבים */}
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"default",fontSize:13,fontWeight:800,color:C.text}}>
          <input type="checkbox" checked disabled readOnly style={{width:18,height:18,accentColor:baseOwned?C.success:C.blueM}}/>
          🪑 חבילה בסיסית <span style={{fontWeight:600,color:C.muted,fontSize:12}}>(סידורי הושבה + אישורי הגעה)</span>
          <span style={{marginRight:"auto",fontWeight:900,color:baseOwned?C.success:C.blue}}>{baseOwned?"✓ כבר ברשותך":`+${fmtShekel(BASIC_PRICE)}`}</span>
        </label>
        {!baseOwned&&<div style={{fontSize:12,color:C.muted,marginTop:6,fontWeight:700}}>נוספת אוטומטית כי עוד לא נרכשה · חד-פעמי</div>}
      </div>}
      {/* תוספת מוקד מתקשר */}
      {onCallOn&&<div style={{marginTop:10,background:callOn?"#FFFBEB":"#fff",border:`1.5px solid ${callOn?"#F6C26B":C.border}`,borderRadius:12,padding:"10px 12px"}}>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:800,color:C.text}}>
          <input type="checkbox" checked={callOn} onChange={e=>onCallOn(e.target.checked)} style={{width:18,height:18,accentColor:"#B45309"}}/>
          📞 להוסיף מוקד מתקשר <span style={{fontWeight:600,color:C.muted,fontSize:12}}>(נציגים מתקשרים לאורחים שלא אישרו · +{fmtShekel(CALL_RECORD_PRICE)} לרשומה)</span>
        </label>
        {callOn&&onCallRecords&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,fontSize:12.5,color:C.muted,fontWeight:700}}>
          כמה רשומות (אורחים) באירוע?
          <input type="number" min={1} value={recs} aria-label="כמות רשומות למוקד" onChange={e=>onCallRecords(Math.max(1,Math.round(Number(e.target.value)||1)))}
            style={{width:90,textAlign:"center",border:"1.5px solid #F6C26B",borderRadius:9,padding:"6px",fontSize:15,fontWeight:900,color:"#B45309",outline:"none",fontFamily:"inherit"}}/>
        </div>}
      </div>}
      <div style={{marginTop:10,background:"#fff",borderRadius:12,padding:"10px 12px",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:5}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:C.muted,fontWeight:700}}>
          <span>{value.toLocaleString()} {unitWord} × {fmtShekel(unitPrice)}</span><span>{fmtShekel(smsTotal(value,0,unitPrice))}</span>
        </div>
        {callOn&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:C.muted,fontWeight:700}}>
          <span>📞 מוקד מתקשר: {recs.toLocaleString()} רשומות × {fmtShekel(CALL_RECORD_PRICE)}</span><span>{fmtShekel(callTotal(recs))}</span>
        </div>}
        {baseFee>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:C.muted,fontWeight:700}}>
          <span>✓ חבילה בסיסית (חד-פעמי)</span><span>{fmtShekel(baseFee)}</span>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:baseFee>0||callOn?`1px dashed ${C.border}`:"none",paddingTop:baseFee>0||callOn?6:0}}>
          <span style={{fontSize:13,fontWeight:800,color:C.text}}>סה״כ לתשלום</span>
          <span style={{fontSize:18,fontWeight:900,color}}>{fmtShekel(pickerTotal({value,baseFee,unitPrice,callOn,callRecords:recs}))}</span>
        </div>
      </div>
    </div>
  );
}
export const findByPhone = (list,phone,exceptId) => { const n=normPhone(phone); return n?(list||[]).find(g=>g.id!==exceptId&&normPhone(g.phone)===n):null; };

// ─── שמירת אורח ───────────────────────────────────────────────────────────────
// עדכון/הוספה עם בדיקת שגיאות. אם עמודת הקטגוריה (relation) עוד לא קיימת במסד  -  שומרים את שאר הפרטים ומודיעים
export const RELATION_MISSING_MSG="⚠️ הפרטים נשמרו, אבל הקטגוריה לא נשמרה (חסרה עמודת קטגוריה במסד הנתונים).";
export const isRelationErr=e=>!!e&&/relation/i.test(`${e.message||""} ${e.details||""} ${e.hint||""}`);
export const saveGuestRow=async(id,patch)=>{
  let {error}=await sb.from("guests").update(patch).eq("id",id);
  if(error&&"relation" in patch&&isRelationErr(error)){
    const {relation,...rest}=patch;
    ({error}=await sb.from("guests").update(rest).eq("id",id));
    if(!error){alert(RELATION_MISSING_MSG);return {ok:true,relationSkipped:true};}
  }
  if(error){alert("❌ השמירה נכשלה: "+(error.message||"שגיאה לא ידועה"));return {ok:false,error};}
  return {ok:true};
};
export const insertGuestRow=async(row)=>{
  let {data,error}=await sb.from("guests").insert(row).select().single();
  if(error&&"relation" in row&&isRelationErr(error)){
    const {relation,...rest}=row;
    ({data,error}=await sb.from("guests").insert(rest).select().single());
    if(!error)alert(RELATION_MISSING_MSG);
  }
  if(error)alert("❌ ההוספה נכשלה: "+(error.message||"שגיאה לא ידועה"));
  return {data,error};
};

// ─── ייבוא אורחים ─────────────────────────────────────────────────────────────
// טלפון בתצוגה אחידה: 05X-XXXXXXX (אקסל מוחק את ה-0 בהתחלה  -  מחזירים אותו)
export const parseSheetRow = r => {
  const keys=Object.keys(r);
  const k=re=>keys.find(x=>re.test(String(x).trim()));
  const phoneKey=keys.find(x=>/טלפון|פלאפון|נייד|סלולרי|phone|mobile|tel|cell/i.test(String(x).trim())&&!/label|type|סוג/i.test(String(x)));
  const fullKey=k(/^(שם מלא|שם|name|full ?name|guest)$/i)||k(/שם מלא|full ?name/i)
    ||keys.find(x=>/שם|name|אורח|מוזמן|איש קשר|contact/i.test(String(x))&&!/פרטי|משפחה|first|last|given|family|middle|user|file|אירוע|אולם/i.test(String(x)));
  const firstKey=k(/^(שם פרטי|first ?name|given ?name)$/i)||k(/שם פרטי|first|given/i);
  const middleKey=k(/^(middle ?name|additional ?name)$/i);
  const lastKey=k(/^(שם משפחה|last ?name|family ?name|surname)$/i)||k(/שם משפחה|משפחה|last|surname|family/i);
  const countKey=k(/כמות|מוזמנים|אורחים|מספר אורחים|count|guests|qty/i);
  let name=fullKey&&String(r[fullKey]??"").trim()?String(r[fullKey]):[firstKey&&r[firstKey],middleKey&&r[middleKey],lastKey&&r[lastKey]].filter(Boolean).join(" ");
  // כל המספרים מעמודות "Phone N - Value" (Google) — מעדיפים נייד ישראלי
  const valueKeys=keys.filter(x=>/phone.*value/i.test(x));
  const phones=(valueKeys.length?valueKeys:phoneKey?[phoneKey]:[]).flatMap(x=>String(r[x]??"").split(/:::|\n/)).map(s=>formatPhone(s.trim())).filter(Boolean);
  let phone=phones.find(p=>/^05/.test(p))||phones[0]||"";
  let count=countKey?Math.min(30,Math.max(1,parseInt(r[countKey])||1)):1;
  if(name&&!phone){
    // הטלפון נכתב בתוך עמודת השם  -  מפרידים
    const p=parseGuestLine(name); if(p.phone){name=p.name;phone=p.phone;}
  }
  if(name&&!phone){
    // עמודת הטלפון בשם לא מוכר ("מספר", "Mobile 2"...)  -  מחפשים תא שכולו מספר טלפון
    for(const x of keys){if(x===countKey)continue;const v=String(r[x]??"").trim();
      if(/^[\d\s\-+().]{9,}$/.test(v)){const p=parseGuestLine(v);if(p.phone){phone=p.phone;break;}}}
  }
  if(!name){
    // בלי כותרות מוכרות: מחברים את כל התאים ומפרידים לבד
    const p=parseGuestLine(keys.map(x=>r[x]).join(" "));
    name=p.name; phone=phone||p.phone; if(!countKey)count=p.count;
  }
  return {name:String(name).trim(),phone,count};
};
// קריאת קובץ אקסל/CSV לשורות. CSV נקרא כטקסט UTF-8 (קובץ Google Contacts בלי BOM — אחרת העברית משתבשת)
// כל קובץ: שורת הכותרות יכולה להיות אחרי שורת כותרת/ריקות, או שאין כותרות בכלל (אז כל שורה היא אורח),
// והרשימה יכולה להיות בכל גיליון  -  נבחר הגיליון עם הכי הרבה שורות של אורחים
// כותרת ודאית (מילה מוכרת, או "שם ..."/"מס' ...") מול רמז חלש (מכיל טלפון/אורחים...); "שמעון" לא נחשב כותרת
export const SHEET_HEADER_RE=/^(#|מס'?|מספר|שם|שם מלא|name|טלפון|פלאפון|נייד|סלולרי|phone|mobile|tel|cell|כמות|מוזמנים|אורחים|count|guests|qty|צד|קרבה|הערות?|notes?|e-?mail|מייל|אימייל|כתובת|שולחן|table)$|^(שם|מס'?|מספר)\s|name|phone|mobile/i;
export const SHEET_HINT_RE=/טלפון|פלאפון|נייד|אורח|מוזמן|משפחה|פרטי|כמות|קשר|first|last/i;
export const sheetToGuestRows = rows => {
  rows=rows.filter(r=>r.some(c=>String(c).trim()));
  const isHeader=r=>{const cells=r.map(c=>String(c).trim()).filter(Boolean);
    if(!cells.length||cells.some(c=>parseGuestLine(c).phone))return false;
    return cells.some(c=>SHEET_HEADER_RE.test(c))||cells.filter(c=>SHEET_HINT_RE.test(c)).length>=2;};
  const h=rows.slice(0,15).findIndex(isHeader);
  if(h<0)return rows.map(r=>Object.fromEntries(r.map((c,i)=>["__col"+i,c])));
  const head=rows[h].map((c,i)=>String(c).trim()||"__col"+i);
  return rows.slice(h+1).map(r=>Object.fromEntries(head.map((k,i)=>[k,r[i]??""])));
};
export const readSheetRows = async file => {
  const{read,utils}=await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
  const wb=/\.csv$/i.test(file.name)?read((await file.text()).replace(/^﻿/,""),{type:"string"}):read(await file.arrayBuffer());
  let best=[],bestN=0;
  for(const n of wb.SheetNames){
    const rows=sheetToGuestRows(utils.sheet_to_json(wb.Sheets[n],{header:1,defval:""}));
    const good=rows.map(parseSheetRow).filter(p=>p.name&&p.name.length>=2).length;
    if(good>bestN){best=rows;bestN=good;}
  }
  return best;
};
// ─── ייבוא חכם: כל עמודה מזוהה לפי הכותרת שלה וגם לפי מה שכתוב בה. כשלא בטוחים — מי שמעלה מסמן איזו עמודה היא מה ───
export const IMPORT_ROLES=[["","לא לייבא"],["name","שם מלא"],["first","שם פרטי"],["last","שם משפחה"],["phone","טלפון"],["count","כמות מוזמנים"],["rsvp","אישור הגעה"]];
export const IMPORT_ROLE_LABEL=Object.fromEntries(IMPORT_ROLES);
// undefined = כותרת לא מוכרת (מחליטים לפי התוכן), "" = עמודה מוכרת שלא מייבאים (שולחן, הערות, מייל...)
export const importHeaderRole=raw=>{
  const h=String(raw??"").trim().replace(/[:*]+$/,"").trim();
  if(!h||/^__col/.test(h))return undefined;
  if(/label|type|סוג/i.test(h))return "";
  if(/טלפון|פלאפון|נייד|סלולרי|phone|mobile|^tel|cell|וואטסאפ|whatsapp/i.test(h))return "phone";
  if(/שם פרטי|^פרטי$|first|given/i.test(h))return "first";
  if(/שם משפחה|^משפחה$|last ?name|surname|family/i.test(h))return "last";
  if(/כמות|נפשות|^מוזמנים$|^אורחים$|^אנשים$|מס(פר|'|\.)?\s*(ה)?(מוזמנים|אורחים|אנשים|מקומות|מגיעים|משתתפים)|count|guests|qty|pax|people/i.test(h))return "count";
  if(/אישור|סטטוס|status|rsvp|הגעה|מגיע/i.test(h))return "rsvp";
  if(/שולחן|table|^צד$|קרבה|קבוצה|group|הערה|הערות|note|מייל|email|e-mail|כתובת|address|^עיר$|city|מתנה|gift|סכום|^#$|^מס'?\.?$|סידורי|serial|^id$/i.test(h))return "";
  if(/שם|name|אורח|מוזמן|איש קשר|contact/i.test(h)&&!/אירוע|אולם|קובץ|user|file/i.test(h))return "name";
  return undefined;
};
export const isPhoneCell=v=>/^[\d\s\-+().\/]{9,}$/.test(v)&&!!parseGuestLine(v).phone;
export const RSVP_YES=/^(כן|מגיע|מגיעה|מגיעים|אישר|אישרה|אישרו|מאשר|מאשרת|מאושר|confirmed|yes|y|v|✓|✔|✅)$/i;
export const RSVP_NO=/^(לא|לא מגיע.*|לא מגיעה.*|לא מגיעים.*|לא יגיע.*|לא תגיע.*|declined|no|n|x|✗|✘|❌)$/i;
export const RSVP_MAYBE=/^(אולי|לא בטוח.*|ממתין.*|טרם|pending|maybe|\?)$/i;
export const importRsvp=v=>{v=String(v??"").trim();return RSVP_YES.test(v)?"confirmed":RSVP_NO.test(v)?"declined":"pending";};
export const importColStats=(body,i)=>{
  const vals=body.slice(0,300).map(r=>String(r[i]??"").trim()).filter(Boolean),n=vals.length||1;
  const rate=fn=>vals.filter(fn).length/n;
  return {filled:vals.length,phone:rate(isPhoneCell),int:rate(v=>/^\d{1,2}$/.test(v)&&+v>=1&&+v<=30),
    rsvp:rate(v=>RSVP_YES.test(v)||RSVP_NO.test(v)||RSVP_MAYBE.test(v)),text:rate(v=>/[A-Za-z\u0590-\u05FF]{2}/.test(v))};
};
export const importColName=(head,i)=>head&&String(head[i]??"").trim()?`"${String(head[i]).trim()}"`:`${i<26?String.fromCharCode(65+i):i+1} (בלי כותרת)`;
export const importFindHeader=rows=>{
  const isHeader=r=>{const cells=r.map(c=>String(c).trim()).filter(Boolean);
    if(!cells.length||cells.some(c=>parseGuestLine(c).phone))return false;
    return cells.some(c=>SHEET_HEADER_RE.test(c))||cells.filter(c=>SHEET_HINT_RE.test(c)).length>=2||cells.filter(c=>importHeaderRole(c)).length>=2;};
  return rows.slice(0,15).findIndex(isHeader);
};
export const importAutoRoles=(rows,h)=>{
  const body=rows.slice(h+1),head=h>=0?rows[h]:null;
  const width=Math.max(0,...rows.slice(0,300).map(r=>r.length));
  const roles=[],reasons=[],nameCands=[],byHeader=[];let unsure=false;
  for(let i=0;i<width;i++){
    const st=importColStats(body,i),hr=head?importHeaderRole(head[i]):undefined;
    byHeader[i]=hr!==undefined;
    if(!st.filled){roles.push("");continue;}
    if(hr===""&&st.phone>=.6){roles.push("phone");continue;} // כותרת כמו "מס" — אבל כל התאים מספרי טלפון
    if(hr!==undefined){
      if(hr==="phone"&&st.phone<.3){unsure=true;reasons.push(`בעמודה ${importColName(head,i)} כמעט אין מספרי טלפון`);}
      if(hr==="count"&&st.int<.5){unsure=true;reasons.push(`בעמודה ${importColName(head,i)} אין מספרים של כמות מוזמנים`);}
      if(["name","first","last"].includes(hr)&&st.phone>.6){unsure=true;reasons.push(`בעמודה ${importColName(head,i)} יש מספרי טלפון ולא שמות`);}
      roles.push(hr);continue;
    }
    let r="";
    if(st.phone>=.6)r="phone";
    else if(st.rsvp>=.7)r="rsvp";
    else if(st.int>=.8){r="count";unsure=true;reasons.push(`לא ברור מה המספרים בעמודה ${importColName(head,i)}: כמות מוזמנים, או משהו אחר כמו מספר שולחן?`);}
    else if(st.text>=.6)nameCands.push(i);
    roles.push(r);
  }
  if(!roles.some(r=>r==="name"||r==="first"||r==="last")){
    if(nameCands.length)roles[nameCands[0]]="name";
    if(nameCands.length>1){unsure=true;reasons.push("יש בקובץ כמה עמודות של טקסט, ולא ברור איזו מהן היא שם האורח");}
    if(!nameCands.length){unsure=true;reasons.push("לא מצאנו עמודה של שמות");}
  }
  if(roles.includes("last")&&!roles.includes("first")&&!roles.includes("name")){unsure=true;reasons.push("מצאנו שם משפחה אבל לא שם פרטי");}
  // כל תפקיד בעמודה אחת. שתי עמודות טלפון בלי כותרות — לא יודעים איזו לקחת
  const first={};
  roles.forEach((r,i)=>{if(!r)return;if(first[r]===undefined){first[r]=i;return;}
    if(r==="phone"&&!byHeader[i]&&!byHeader[first[r]]){unsure=true;reasons.push("יש יותר מעמודה אחת של מספרי טלפון");}
    roles[i]="";});
  return {roles,unsure,reasons:[...new Set(reasons)]};
};
export const importRowsFromRoles=(body,roles)=>body.map(r=>{
  const get=role=>roles.map((x,i)=>x===role?String(r[i]??"").trim():"").filter(Boolean);
  let name=get("name").join(" ")||[...get("first"),...get("last")].join(" ");
  const pc=get("phone")[0]||"";
  let phone=pc?(parseGuestLine(pc).phone||formatPhone(pc)):"";
  if(name&&!phone){const p=parseGuestLine(name);if(p.phone&&p.name){name=p.name;phone=p.phone;}}
  const cc=get("count")[0];
  const count=cc?Math.min(30,Math.max(1,parseInt(cc)||1)):1;
  const rs=get("rsvp")[0];
  return {name:name.replace(/\s+/g," ").trim(),phone,count,rsvp:rs?importRsvp(rs):"pending"};
});
// קורא את הקובץ ומחזיר את הגיליון עם הכי הרבה אורחים, את הזיהוי, והאם צריך שמי שמעלה יסמן
export const analyzeSheetFile=async file=>{
  const{read,utils}=await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
  const wb=/\.csv$/i.test(file.name)?read((await file.text()).replace(/^\uFEFF/,""),{type:"string"}):read(await file.arrayBuffer());
  let best=null;
  for(const n of wb.SheetNames){
    const rows=utils.sheet_to_json(wb.Sheets[n],{header:1,defval:""}).filter(r=>r.some(c=>String(c).trim()));
    if(!rows.length)continue;
    const h=importFindHeader(rows);
    // קובץ Google Contacts: עמודות "Phone 1 - Value" — המנוע הקודם כבר יודע לקרוא אותו
    if(h>=0&&rows[h].some(c=>/phone \d+ - value/i.test(String(c)))){
      const parsed=sheetToGuestRows(rows).map(parseSheetRow),score=parsed.filter(p=>p.name&&p.name.length>=2).length;
      const rank=score+parsed.filter(p=>p.name&&p.phone).length+.5;
      if(!best||rank>best.rank)best={legacy:true,parsed,score,rank,unsure:false,reasons:[]};
      continue;
    }
    const a=importAutoRoles(rows,h),parsed=importRowsFromRoles(rows.slice(h+1),a.roles);
    // הגיליון של האורחים: הכי הרבה שמות וטלפונים, ובשוויון — זה שהזיהוי בו בטוח (ולא גיליון סיכום)
    const good=parsed.filter(p=>p.name&&p.name.length>=2),score=good.length;
    const rank=score+good.filter(p=>p.phone).length+(a.unsure?0:.5);
    if(!best||rank>best.rank)best={rows,h,...a,parsed,score,rank,sheet:n,file:file.name};
  }
  if(best&&!best.legacy&&!best.score&&!best.unsure){best.unsure=true;best.reasons=["לא הצלחנו לקרוא שמות מהקובץ"];}
  return best;
};
export const importDetectedNote=a=>{
  if(!a||a.legacy||!a.roles)return "";
  const head=a.h>=0?a.rows[a.h]:null;
  const parts=a.roles.map((r,i)=>r?`${IMPORT_ROLE_LABEL[r]} ← ${importColName(head,i)}`:null).filter(Boolean);
  return parts.length?"זיהינו את העמודות: "+parts.join(" · "):"";
};
// חלון "איזו עמודה היא מה?" — נפתח רק כשהזיהוי לא בטוח
export function ImportMapper({ data, onImport, onCancel, busy }) {
  const [roles,setRoles]=useState(data.roles),[h,setH]=useState(data.h);
  const titleRef=useRef(null);
  useEffect(()=>{titleRef.current?.focus();const k=e=>{if(e.key==="Escape")onCancel();};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);},[]);
  const head=h>=0?data.rows[h]:null,body=data.rows.slice(h+1);
  const width=roles.length;
  const cols=[...Array(width).keys()].filter(i=>(head&&String(head[i]??"").trim())||body.slice(0,300).some(r=>String(r[i]??"").trim()));
  const parsed=importRowsFromRoles(body,roles).filter(p=>p.name&&p.name.length>=2);
  const hasName=roles.some(r=>r==="name"||r==="first"||r==="last");
  const setRole=(i,r)=>setRoles(rs=>rs.map((x,j)=>j===i?r:(r&&x===r?"":x)));
  const RS={confirmed:"מגיע",declined:"לא מגיע",pending:"ממתין"};
  const th={padding:"8px 8px 6px",background:"#F6F0FF",borderBottom:`1px solid ${C.border}`,minWidth:130,verticalAlign:"top"};
  return(
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:12,direction:"rtl",fontFamily:"'Heebo',sans-serif"}} onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="imap-t" onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:820,maxHeight:"92vh",overflowY:"auto",padding:"22px 22px 18px",boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)",textAlign:"right"}}>
        <h2 id="imap-t" ref={titleRef} tabIndex={-1} style={{margin:"0 0 6px",fontSize:20,fontWeight:800,color:C.text,outline:"none"}}>איזו עמודה היא מה?</h2>
        <p style={{margin:"0 0 10px",fontSize:14,color:C.text,lineHeight:1.6}}>לא הצלחנו לזהות בוודאות את כל העמודות בקובץ <b dir="auto">{data.file}</b>. בחרו מעל כל עמודה מה יש בה, ובדקו בדוגמה למטה שהאורחים נראים נכון.</p>
        {data.reasons?.length>0&&<ul style={{margin:"0 0 12px",padding:"10px 28px 10px 14px",background:"#FFF7E6",border:"1px solid #F5D9A0",borderRadius:12,fontSize:13,color:"#7A4B00",lineHeight:1.7}}>
          {data.reasons.map(r=><li key={r}>{r}</li>)}
        </ul>}
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:700,color:C.text,marginBottom:10,cursor:"pointer",width:"fit-content"}}>
          <input type="checkbox" checked={h>=0} onChange={e=>setH(e.target.checked?(data.h>=0?data.h:0):-1)} style={{width:18,height:18,accentColor:"#9B6BFF"}}/>
          השורה הראשונה היא כותרות, לא אורח
        </label>
        <div style={{overflowX:"auto",border:`1.5px solid ${C.border}`,borderRadius:14}}>
          <table style={{borderCollapse:"collapse",width:"100%",fontSize:13}}>
            <thead><tr>
              {cols.map(i=>(
                <th key={i} scope="col" style={th}>
                  <select value={roles[i]} onChange={e=>setRole(i,e.target.value)} aria-label={`מה יש בעמודה ${importColName(head,i)}`}
                    style={{width:"100%",fontFamily:"inherit",fontSize:13,fontWeight:800,padding:"7px 8px",borderRadius:10,border:`1.5px solid ${roles[i]?"#9B6BFF":C.border}`,background:roles[i]?"#fff":"#FAF8FC",color:roles[i]?"#4A2C8F":C.muted,cursor:"pointer"}}>
                    {IMPORT_ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                  {head&&<div style={{marginTop:6,fontSize:12,fontWeight:700,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:180}} dir="auto">{String(head[i]??"").trim()||"(בלי כותרת)"}</div>}
                </th>))}
            </tr></thead>
            <tbody>
              {body.slice(0,6).map((r,ri)=>(
                <tr key={ri}>
                  {cols.map(i=><td key={i} dir="auto" style={{padding:"7px 10px",borderTop:ri?`1px solid ${C.border}`:"none",color:roles[i]?C.text:"#9A8FA8",background:roles[i]?"#fff":"#FCFBFD",whiteSpace:"nowrap",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",textAlign:"right"}}>{String(r[i]??"")}</td>)}
                </tr>))}
            </tbody>
          </table>
        </div>
        {body.length>6&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>ועוד {(body.length-6).toLocaleString("he-IL")} שורות</div>}
        <div style={{marginTop:14,background:"#F4FBF7",border:"1px solid #BFE6D2",borderRadius:14,padding:"12px 14px"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#15603A",marginBottom:6}}>כך האורחים ייכנסו לרשימה</div>
          {parsed.length?parsed.slice(0,3).map((p,k)=>(
            <div key={k} style={{fontSize:13,color:C.text,padding:"3px 0",display:"flex",flexWrap:"wrap",gap:"2px 12px"}}>
              <b dir="auto">{p.name}</b>
              <span dir="ltr" style={{color:p.phone?C.text:"#9A8FA8"}}>{p.phone||"בלי טלפון"}</span>
              <span>{p.count} {p.count===1?"מוזמן":"מוזמנים"}</span>
              {roles.includes("rsvp")&&<span>{RS[p.rsvp]}</span>}
            </div>)):<div style={{fontSize:13,color:"#B42318",fontWeight:700}}>עוד אין אורחים. סמנו את עמודת השם.</div>}
        </div>
        {!hasName&&<div role="alert" style={{marginTop:10,fontSize:13,fontWeight:700,color:"#B42318"}}>צריך לסמן לפחות עמודה אחת של שם (שם מלא, או שם פרטי ושם משפחה).</div>}
        <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
          <button type="button" className="sx-btn sx-btn-primary" disabled={!hasName||!parsed.length||busy} onClick={()=>onImport(parsed)}
            style={{flex:"1 1 220px",border:"none",borderRadius:14,padding:"13px 18px",fontSize:15,fontWeight:800,fontFamily:"inherit",cursor:hasName&&parsed.length&&!busy?"pointer":"default",color:"#fff",background:"linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)",backgroundSize:"200% 100%",opacity:hasName&&parsed.length&&!busy?1:.5}}>
            {busy?"מייבא...":`ייבוא ${parsed.length.toLocaleString("he-IL")} אורחים`}
          </button>
          <button type="button" onClick={onCancel} style={{flex:"0 1 auto",background:"#fff",border:`1.5px solid ${C.border}`,color:C.text,borderRadius:14,padding:"12px 18px",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// כרטיס ייבוא מ-Google Contacts: הוראות ייצוא + בחירת הקובץ
export function GoogleContactsImport({ onFile }) {
  return(
    <div style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:20,textAlign:"right"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{width:38,height:38,borderRadius:11,background:"#EAF2FF",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#EA4335" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>
        </span>
        <div>
          <div style={{fontSize:15,fontWeight:900,color:C.text}}>ייבוא מאנשי הקשר של Google</div>
          <div style={{fontSize:12,color:C.muted}}>שם + נייד לכל איש קשר, בלי כפילויות</div>
        </div>
      </div>
      <ol style={{margin:"0 0 14px",paddingInlineStart:20,fontSize:13,color:"#4A3D66",lineHeight:1.8}}>
        <li>פתחו את <a href="https://contacts.google.com" target="_blank" rel="noopener noreferrer" style={{color:C.blue,fontWeight:800}}>Google Contacts</a> (אפשר לסמן רק את מי שרוצים להזמין)</li>
        <li>לחצו על ⋮ ← <b>ייצוא</b> (Export) ← בחרו <b>Google CSV</b> ← ייצוא</li>
        <li>העלו כאן את הקובץ שירד (contacts.csv)</li>
      </ol>
      <label style={{background:"#1765CC",color:"#fff",borderRadius:12,padding:"10px 20px",fontSize:14,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
        📂 העלאת קובץ מ-Google
        <input type="file" accept=".csv" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];e.target.value="";if(f)onFile(f);}}/>
      </label>
      <div style={{fontSize:12,color:C.muted,marginTop:8}}>עובד גם עם ייצוא CSV מ-Outlook ומ-iCloud</div>
    </div>
  );
}
// מכינים רשימה לשמירה: מדלגים על טלפונים שכבר קיימים (באירוע או פעמיים באותו קובץ)
export const prepareImport = (parsed,existing,eventId) => {
  const seen=new Set((existing||[]).map(g=>normPhone(g.phone)).filter(Boolean));
  const toInsert=[],dupes=[];
  for(const p of parsed){
    if(!p.name||p.name.length<2)continue;
    const n=normPhone(p.phone);
    if(n&&seen.has(n)){dupes.push(p);continue;}
    if(n)seen.add(n);
    toInsert.push({name:p.name,phone:p.phone||null,rsvp:["confirmed","declined"].includes(p.rsvp)?p.rsvp:"pending",guest_count:p.count||1,event_id:eventId,table_id:null});
  }
  return {toInsert,dupes};
};
export const importSummary = ({toInsert,dupes}) => {
  const withPhone=toInsert.filter(g=>g.phone).length;
  let msg=`✅ יובאו ${toInsert.length} אורחים (${withPhone} עם טלפון)`;
  if(dupes.length)msg+=`\n⚠️ ${dupes.length} דולגו כי מספר הטלפון כבר קיים ברשימה:\n`+dupes.slice(0,8).map(d=>`• ${d.name} ${d.phone}`).join("\n")+(dupes.length>8?"\n...":"");
  return msg;
};

// חלון "המספר כבר קיים": האפשרות היחידה היא לעדכן את מספר המוזמנים של האורח הקיים
export const Btn = ({children,primary,ghost,danger,small,full,onClick,disabled,style={}}) => (
  <button onClick={onClick} disabled={disabled} className={`sx-btn${primary?" sx-btn-primary":""}`} style={{
    background:danger?C.danger:primary?GRAD:ghost?"transparent":C.surface,
    color:(primary||danger)?"#fff":ghost?C.blue:C.text,
    border:`1.5px solid ${danger?C.danger:primary?"transparent":ghost?C.blue:C.border}`,
    borderRadius:100,padding:small?"7px 16px":"11px 22px",fontSize:small?12:14,fontWeight:700,
    cursor:disabled?"not-allowed":"pointer",opacity:disabled?.45:1,fontFamily:"inherit",transition:"transform .18s,box-shadow .2s,filter .2s",
    width:full?"100%":"auto",boxShadow:primary?`0 8px 22px -6px ${C.blueM}88`:"none",backgroundSize:primary?"200% 100%":undefined,...style,
  }}>{children}</button>
);

export const Card = ({children,style={},...props}) => (
  <div style={{background:C.surface,borderRadius:24,border:"1px solid #F3EDF9",boxShadow:"0 18px 40px -30px rgba(91,60,140,.55)",...style}} {...props}>{children}</div>
);

export const Inp = ({value,onChange,placeholder,onKeyDown,type="text",style={}}) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
    style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",...style}}/>
);


// ─── TABLE NODE ───────────────────────────────────────────────────────────────
// שולחן על מפת האולם: מפה לבנה, כיסאות בצבע קבוצת האורח, טבעת מילוי והדגשה בגרירה
export const EMPTY_SEAT="#EEE7F6", EMPTY_SEAT_STROKE="#DCCFEA";
export const guestColor=g=>RELATION_COLORS[g?.relation]||C.blueL;
export const fillColor=(occ,total)=>occ===0?"#DCCFEA":occ>=total?C.danger:occ>=total*.8?C.gold:C.success;
export const TABLE_TINTS=["#F0609E","#9B6BFF","#3CC8A0","#5AA9FF","#E8B04A","#FF8A65"];
export const tableTint=(t,num)=>{const n=parseInt(num,10);if(n>0)return TABLE_TINTS[(n-1)%TABLE_TINTS.length];let h=0;for(const ch of String(t.id||""))h=(h*31+ch.charCodeAt(0))>>>0;return TABLE_TINTS[h%TABLE_TINTS.length];};

// כיסא מעוגל שמסובב לכיוון השולחן
// אורח שהושב הרגע מקבל אנימציית "קפיצה" של הכיסא
export const Chair=({x,y,deg,guest,freshIds,tint,w=13,h=10})=>(
  <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${deg})`}>
    <g className={guest&&freshIds?.has(guest.id)?"sx-chair-new":undefined}>
      <rect x={-w/2} y={-h/2+1.2} width={w} height={h} rx={4.5} fill="rgba(58,36,100,.10)"/>
      {tint?<>
        <rect x={-w/2} y={-h/2} width={w} height={h} rx={4.5} fill={guest?tint:`${tint}2E`} stroke={guest?"rgba(255,255,255,.95)":`${tint}66`} strokeWidth={1.2}>
          {guest&&<title>{guest.name}</title>}
        </rect>
        {guest&&<circle cx={0} cy={0.5} r={1.9} fill={guestColor(guest)} stroke="rgba(255,255,255,.85)" strokeWidth={0.8}/>}
      </>:<>
        <rect x={-w/2} y={-h/2} width={w} height={h} rx={4.5}
          fill={guest?guestColor(guest):EMPTY_SEAT} stroke={guest?"rgba(255,255,255,.9)":EMPTY_SEAT_STROKE} strokeWidth={1.3}>
          {guest&&<title>{guest.name}</title>}
        </rect>
        <rect x={-w/2+2.5} y={-h/2-2.6} width={w-5} height={3} rx={1.5} fill={guest?guestColor(guest):EMPTY_SEAT_STROKE} opacity={.75}/>
      </>}
    </g>
  </g>
);

// פרץ נצנוצים סביב שולחן כשאורח מושב בו (גדול יותר כשהשולחן מתמלא)
export const BURST_COLORS=["#FF8A65","#F0609E","#9B6BFF","#E8B04A","#2FA57A","#5AA9FF"];
export const Burst=({big})=>(
  <div className="sx-anim" style={{position:"absolute",left:"50%",top:"50%",width:0,height:0,pointerEvents:"none",zIndex:20}}>
    {Array.from({length:big?22:12}).map((_,i,arr)=>(
      <span key={i} style={{position:"absolute",left:0,top:0,width:big?9:7,height:big?9:7,borderRadius:i%3?"50%":2,
        background:BURST_COLORS[i%BURST_COLORS.length],"--a":`${i*(360/arr.length)}deg`,"--d":`${(big?78:58)+(i%3)*10}px`,
        animation:`sxBurst ${big?.95:.75}s cubic-bezier(.2,.7,.3,1) both`}}/>
    ))}
    {big&&<span style={{position:"absolute",left:0,top:-40,whiteSpace:"nowrap",background:GRAD,color:"#fff",fontSize:12,fontWeight:900,
      borderRadius:100,padding:"4px 12px",boxShadow:`0 8px 18px -6px ${C.blueM}`,animation:"sxFloatUp 1.6s ease both"}}>מלא! 🎉</span>}
  </div>
);

export function TableNode({ table, selected, highlight=false, locked=false, onMouseDown, onDrop }) {
  const [over,setOver]=useState(false);
  const guests=table.guests||[];
  const occupied=guests.length;
  const total=table.seats||10;
  const full=occupied>=total;
  // טבעת ההתקדמות בצבע השולחן; מלא = אדום
  const ring=full?C.danger:occupied===0?"#DCCFEA":null;
  // צבע השולחן לפי הקטגוריה הנפוצה אצל היושבים בו (כמו מפת האולם בדף הבית); שולחן ריק — סגול עדין
  const tableNumEarly=table.num?String(table.num):(table.name?.match(/\d+/)?.[0]||"");
  const accent=tableTint(table,tableNumEarly);
  const ringC=ring||accent;
  const uid=String(table.id).replace(/[^a-z0-9]/gi,"");
  // סידור פרחים במרכז השולחן (עלי כותרת בצבע השולחן ולב זהוב)
  const Flowers=({x,y,s=1})=>(<g pointerEvents="none">
    {[0,72,144,216,288].map(d=>{const a=(d-90)*Math.PI/180;return <circle key={d} cx={x+5.5*s*Math.cos(a)} cy={y+5.5*s*Math.sin(a)} r={3.6*s} fill={accent} opacity=".6"/>;})}
    <circle cx={x} cy={y} r={2.8*s} fill="#E8B04A"/>
  </g>);
  // מזהים אורחים שנוספו מאז הרינדור הקודם  -  לאנימציית כיסא ופרץ נצנוצים
  const prevIds=useRef(null);
  const [fresh,setFresh]=useState(()=>new Set());
  const [burst,setBurst]=useState(null);
  const idsKey=guests.map(g=>g.id).join(",");
  useEffect(()=>{
    const now=new Set(guests.map(g=>g.id));
    const before=prevIds.current;
    prevIds.current=now;
    if(!before)return; // רינדור ראשון  -  בלי אנימציה
    const added=[...now].filter(id=>!before.has(id));
    if(!added.length)return;
    setFresh(new Set(added));
    setBurst({big:occupied>=total,key:Date.now()});
    const t1=setTimeout(()=>setFresh(new Set()),700),t2=setTimeout(()=>setBurst(null),1700);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[idsKey]);
  const dp={
    onDragOver:e=>{e.preventDefault();e.stopPropagation();if(!over)setOver(true);},
    onDragLeave:()=>setOver(false),
    onDrop:e=>{e.preventDefault();e.stopPropagation();setOver(false);onDrop(e);},
  };
  const tableNum=table.num?String(table.num):(table.name?.match(/\d+/)?.[0]||"");
  const tableName=table.name?.replace(/^\d+\s*/,"").trim()||"";
  const tip=`${table.name} · ${occupied}/${total}`+(guests.length?"\n"+guests.map(g=>"• "+g.name).join("\n"):"");
  const glow=over?(full?`drop-shadow(0 0 14px ${C.danger}aa)`:`drop-shadow(0 0 16px ${C.blueM}cc)`)
    :highlight?`drop-shadow(0 0 16px ${C.gold})`
    :selected?`drop-shadow(0 8px 22px ${C.blueL}88)`:"drop-shadow(0 4px 10px rgba(58,36,100,.14))";
  const wrap=(w,h,left,top,children,label)=>(
    <div onPointerDown={onMouseDown} {...dp} title={tip}
      style={{position:"absolute",left,top,width:w,height:h,cursor:locked?"pointer":"grab",userSelect:"none",zIndex:selected||over?10:1,
        filter:glow,transform:over?"scale(1.06)":highlight?"scale(1.04)":"none",transition:"transform .18s,filter .2s"}}>
      <svg width={w} height={h} style={{overflow:"visible"}}>
        <defs>
          <radialGradient id={`tc${uid}`} cx="40%" cy="35%" r="75%"><stop offset="0%" stopColor="#fff"/><stop offset="70%" stopColor="#FDFAFF"/><stop offset="100%" stopColor={accent} stopOpacity=".22"/></radialGradient>
        </defs>
        {children}
      </svg>
      {label}
      {burst&&<Burst key={burst.key} big={burst.big}/>}
    </div>
  );
  const labelBox=(style,big=20)=>(
    <div style={{position:"absolute",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none",gap:1,textAlign:"center",...style}}>
      {tableNum&&<span style={{fontSize:big,fontWeight:900,color:`color-mix(in srgb,${accent} 62%,#2B1D3F)`,lineHeight:1}}>{tableNum}</span>}
      {/* כמות ושם השולחן בגודל שנקרא גם בזום הפתיחה (היה 10/9 — כ-8 פיקסלים על המסך) */}
      <span style={{fontSize:13,fontWeight:800,lineHeight:1.2,color:full?C.danger:occupied?"#5F5675":"#8E84A3",background:full?"#FDECEE":"transparent",borderRadius:100,padding:full?"0 6px":0,fontVariantNumeric:"tabular-nums"}}>
        {occupied}/{total}
      </span>
      {tableName&&<span style={{fontSize:12,fontWeight:800,color:C.text,maxWidth:"84%",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",lineHeight:1.25}}>{tableName}</span>}
    </div>
  );
  const selRing=(shape)=>selected&&shape;

  // ─── שולחן אבירים: מלבן ארוך עם כיסאות משני הצדדים ───
  if(table.type==="knight"){
    const W=180,H=60,pad=16,SW=W+pad*2,SH=H+pad*2;
    const top=Math.ceil(total/2),bottom=total-top;
    const chairs=[];
    for(let i=0;i<top;i++)chairs.push(<Chair key={"t"+i} x={pad+W/(top+1)*(i+1)} y={pad-8} deg={0} freshIds={fresh} tint={accent} guest={guests[i]}/>);
    for(let i=0;i<bottom;i++)chairs.push(<Chair key={"b"+i} x={pad+W/(bottom+1)*(i+1)} y={pad+H+8} deg={180} freshIds={fresh} tint={accent} guest={guests[top+i]}/>);
    return wrap(SW,SH,table.x-pad,table.y-pad,<>
      {chairs}
      {selRing(<rect x={pad-6} y={pad-6} width={W+12} height={H+12} rx={18} fill="none" stroke={C.blueL} strokeWidth={2} strokeDasharray="5 4"/>)}
      <rect x={pad} y={pad} width={W} height={H} rx={14} fill="#fff"/>
      <rect x={pad} y={pad} width={W} height={H} rx={14} fill={`url(#tc${uid})`} stroke={ringC} strokeWidth={2.5}/>
      <rect x={pad+6} y={pad+6} width={W-12} height={H-12} rx={10} fill="none" stroke={accent} strokeOpacity=".4" strokeDasharray="4 4"/>
      <text x={pad+14} y={pad+H/2+5} fontSize="14" textAnchor="middle">👑</text>
      <Flowers x={pad+W-18} y={pad+H/2} s={.8}/>
    </>,labelBox({left:pad,top:pad,width:W,height:H},16));
  }

  // ─── שולחן מרובע: כיסאות בארבעה צדדים ───
  if(table.type==="rect"){
    const W=110,H=80,pad=18,SW=W+pad*2,SH=H+pad*2;
    const topN=Math.ceil(total/4),bottomN=Math.ceil(total/4),leftN=Math.floor(total/4),rightN=total-topN-bottomN-leftN;
    let k=0;const chairs=[];
    for(let i=0;i<topN;i++)chairs.push(<Chair key={"t"+i} x={pad+W/(topN+1)*(i+1)} y={pad-9} deg={0} freshIds={fresh} tint={accent} guest={guests[k++]}/>);
    for(let i=0;i<rightN;i++)chairs.push(<Chair key={"r"+i} x={pad+W+9} y={pad+H/(rightN+1)*(i+1)} deg={90} freshIds={fresh} tint={accent} guest={guests[k++]}/>);
    for(let i=0;i<bottomN;i++)chairs.push(<Chair key={"b"+i} x={pad+W/(bottomN+1)*(i+1)} y={pad+H+9} deg={180} freshIds={fresh} tint={accent} guest={guests[k++]}/>);
    for(let i=0;i<leftN;i++)chairs.push(<Chair key={"l"+i} x={pad-9} y={pad+H/(leftN+1)*(i+1)} deg={270} freshIds={fresh} tint={accent} guest={guests[k++]}/>);
    return wrap(SW,SH,table.x-pad,table.y-pad,<>
      {chairs}
      {selRing(<rect x={pad-7} y={pad-7} width={W+14} height={H+14} rx={20} fill="none" stroke={C.blueL} strokeWidth={2} strokeDasharray="5 4"/>)}
      <rect x={pad} y={pad} width={W} height={H} rx={16} fill="#fff"/>
      <rect x={pad} y={pad} width={W} height={H} rx={16} fill={`url(#tc${uid})`} stroke={ringC} strokeWidth={2.5}/>
      <rect x={pad+6} y={pad+6} width={W-12} height={H-12} rx={11} fill="none" stroke={accent} strokeOpacity=".4" strokeDasharray="4 4"/>
      <Flowers x={pad+W/2} y={pad+14} s={.7}/>
    </>,labelBox({left:pad,top:pad+8,width:W,height:H-8}));
  }

  // ─── שולחן עגול: כיסאות סביב, טבעת התקדמות ומרכז פרחוני ───
  const R=50,seatDist=R+15,S=(seatDist+14)*2,cx=S/2,cy=S/2;
  const circ=2*Math.PI*(R+5);
  const chairs=Array.from({length:total},(_,i)=>{
    const deg=i*(360/total);const a=deg*Math.PI/180;
    return <Chair key={i} x={cx+seatDist*Math.sin(a)} y={cy-seatDist*Math.cos(a)} deg={deg} freshIds={fresh} tint={accent} guest={guests[i]}/>;
  });
  return wrap(S,S,table.x,table.y,<>
    {chairs}
    {selRing(<circle cx={cx} cy={cy} r={R+11} fill="none" stroke={C.blueL} strokeWidth={2} strokeDasharray="5 4"/>)}
    <circle cx={cx} cy={cy} r={R} fill="#fff"/>
    <circle cx={cx} cy={cy} r={R} fill={`url(#tc${uid})`} stroke={accent} strokeOpacity=".6" strokeWidth={2}/>
    {/* טבעת התקדמות  -  כמה מהשולחן מלא */}
    <circle cx={cx} cy={cy} r={R+5} fill="none" stroke="#F1EAF8" strokeWidth={3.5}/>
    <circle cx={cx} cy={cy} r={R+5} fill="none" stroke={ringC} strokeWidth={3.5} strokeLinecap="round"
      strokeDasharray={`${circ*Math.min(occupied/total,1)} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray .4s"}}/>
    <Flowers x={cx} y={cy-29} s={.85}/>
  </>,labelBox({inset:0,paddingTop:12},22));
}

// ─── לוח המפיק: הגעה בזמן אמת. כל אורח שמסומן "הגיע" בכניסה לאולם (guests.arrived_at) נספר כאן, רענון כל 15 שניות ───
export function LiveArrivals({ events, onOpen }) {
  const [rows,setRows]=useState(null),[now,setNow]=useState(Date.now());
  const ids=events.map(e=>e.id).join(",");
  useEffect(()=>{
    if(!ids)return;
    let alive=true;
    const load=()=>sb.from("guests").select("event_id,rsvp,guest_count,arrived_at").in("event_id",ids.split(",")).then(({data})=>{if(alive){setRows(data||[]);setNow(Date.now());}},()=>{});
    load();
    const iv=setInterval(()=>{if(document.visibilityState==="visible")load();},15000);
    const tick=setInterval(()=>setNow(Date.now()),30000);
    return()=>{alive=false;clearInterval(iv);clearInterval(tick);};
  },[ids]);
  if(!events.length)return null;
  const ago=t=>{const m=Math.max(0,Math.round((now-Date.parse(t))/6e4));return m<1?"עכשיו":m<60?`לפני ${m} דק'`:`לפני ${Math.floor(m/60)} שע'`;};
  return(
    <div className="ev-live" role="region" aria-label="הגעה בזמן אמת">
      <div className="ev-live-h"><span className="dot" aria-hidden="true"/>הגעה בזמן אמת · היום</div>
      {events.map(e=>{
        const gs=(rows||[]).filter(g=>g.event_id===e.id),n=g=>g.guest_count||1;
        const came=gs.filter(g=>g.arrived_at),cameN=came.reduce((a,g)=>a+n(g),0);
        const confN=gs.filter(g=>g.rsvp==="confirmed").reduce((a,g)=>a+n(g),0);
        const goal=Math.max(confN,cameN),pct=goal?Math.min(100,Math.round(cameN/goal*100)):0;
        const last=came.map(g=>g.arrived_at).sort().pop();
        const recent=came.filter(g=>now-Date.parse(g.arrived_at)<15*6e4).reduce((a,g)=>a+n(g),0);
        return(
          <div key={e.id} className="ev-live-row">
            <div className="ev-live-name">{eventWords(e).emoji} {e.name}{e.event_time?<small> · {String(e.event_time).slice(0,5)}</small>:null}{e.venue?<small> · {e.venue}</small>:null}</div>
            <div className="ev-live-big" aria-live="polite"><b>{rows?<CountUp value={cameN.toLocaleString("he-IL")}/>:"…"}</b><span>הגיעו מתוך {confN.toLocaleString("he-IL")} שאישרו</span></div>
            <div className="ev-live-bar" aria-hidden="true"><u style={{width:`${pct}%`}}/></div>
            <div className="ev-live-meta">
              <span>{pct}% מהמאשרים</span>
              {recent>0&&<span className="up">+{recent} ב-15 הדקות האחרונות</span>}
              <span>{last?`אחרון הגיע ${ago(last)}`:"עוד אף אחד לא סומן כהגיע"}</span>
            </div>
            <button type="button" className="ev-live-go" onClick={()=>onOpen(e)}>לכניסה לאולם ←</button>
          </div>);
      })}
    </div>
  );
}

// ─── אפקטים: מספרים שרצים ואדווה ───
// עצירת אנימציות: הגדרת המכשיר, או "עצור אנימציות" בתפריט הנגישות (style#a11y-style)
export const RsvpBadge = ({rsvp}) => {
  // "ממתין..." נראה כמו טקסט שנחתך — מילה מלאה וקצרה; גוונים כהים מספיק לקריאה על הרקע הבהיר
  const map = {confirmed:{bg:"#E9F7EF",color:"#1F7A4D",label:"מגיע ✓"},declined:{bg:"#FDECEC",color:"#B42318",label:"לא מגיע ✗"},pending:{bg:"#F1ECF7",color:"#5F5675",label:"ממתין"}};
  const s = map[rsvp]||map.pending;
  return <span style={{fontSize:12,fontWeight:700,background:s.bg,color:s.color,borderRadius:100,padding:"2px 9px",whiteSpace:"nowrap",flex:"none"}}>{s.label}</span>;
};

export function GuestChip({ guest, tableId, onRemove }) {
  return(<div draggable={true} onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(guest.id));if(tableId)e.dataTransfer.setData("fromTable",String(tableId));}} style={{display:"flex",alignItems:"center",gap:8,background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:12,padding:"7px 11px",cursor:"grab",marginBottom:6}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.blueL} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
    <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{ini(guest.name)}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:13,fontWeight:600,color:C.text}}>{guest.name}</div>
      {guest.phone&&<div style={{fontSize:12,color:C.muted}}>{guest.phone}</div>}
    </div>
    <RsvpBadge rsvp={guest.rsvp}/>
    {onRemove&&<button onClick={()=>onRemove(guest)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:0,lineHeight:1,flexShrink:0}}>×</button>}
  </div>);
}

// ─── ADD/EDIT GUEST MODAL ─────────────────────────────────────────────────────
export function GuestModal({ guest, eventId, onSave, onClose, existingGuests=[], desktop=false, onUpdateExisting }) {
  const [name,setName]=useState(guest?.name||"");
  const [phone,setPhone]=useState(guest?.phone||"");
  const [rsvp,setRsvp]=useState(guest?.rsvp||"pending");
  const [count,setCount]=useState(guest?.guest_count||1);
  const [relation,setRelation]=useState(guest?.relation||"ללא שיוך");
  const [customRelations,setCustomRelations]=useState([]);
  const [addingCat,setAddingCat]=useState(false);
  const [newCat,setNewCat]=useState("");
  const [dupGuest,setDupGuest]=useState(null);
  const [phoneDup,setPhoneDup]=useState(null);
  const [dupCount,setDupCount]=useState(1);
  const [busy,setBusy]=useState(false);
  const isEdit=!!guest?.id;

  const COLORS=["#E53E3E","#DD6B20","#38A169","#3182CE","#805AD5","#D69E2E","#D53F8C","#319795"];
  const [newCatColor,setNewCatColor]=useState(COLORS[0]);

  const allRelations=[...Object.keys(RELATION_COLORS),...customRelations];

  // טלפון שהוקלד בתוך שדה השם עובר לשדה הטלפון (כשיוצאים מהשדה ובשמירה)
  const moveNamePhone=()=>{const sp=splitNamePhone(name,phone);if(sp.name!==name.trim()||sp.phone!==phone.trim()){setName(sp.name);setPhone(sp.phone);}return sp;};
  const handleSave=()=>{
    const sp=moveNamePhone();const name=sp.name,phone=sp.phone;
    if(!name.trim())return;
    // טלפון שכבר קיים (גם בעריכה, אצל אורח אחר)  -  אסור לשמור כפול; מציעים רק לעדכן מספר מוזמנים
    const byPhone=findByPhone(existingGuests,phone,guest?.id);
    if(byPhone){setPhoneDup(byPhone);setDupCount(Math.max(byPhone.guest_count||1,count));return;}
    if(!isEdit){
      const nameClean=name.trim().toLowerCase();
      const found=existingGuests.find(g=>g.name.trim().toLowerCase()===nameClean);
      if(found){setDupGuest(found);return;}
    }
    onSave({name:name.trim(),phone:phone.trim(),rsvp,guest_count:count,relation});
  };

  if(phoneDup){
    return <PhoneExistsDialog guest={phoneDup} count={dupCount} setCount={setDupCount} busy={busy}
      onBack={()=>setPhoneDup(null)}
      onUpdate={async()=>{
        if(!onUpdateExisting){setPhoneDup(null);return;}
        setBusy(true);await onUpdateExisting(phoneDup,dupCount);setBusy(false);
      }}/>;
  }

  // מודל כפילות (שם זהה בלבד  -  יכולים להיות שני אנשים עם אותו שם)
  if(dupGuest){
    return(
      <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",width:"100%",maxWidth:480,direction:"rtl"}}>
          <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
          <div style={{width:60,height:60,borderRadius:18,background:"#FFF8E1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 14px"}}>🔍</div>
          <div style={{fontWeight:900,fontSize:18,color:C.text,textAlign:"center",marginBottom:6}}>מצאנו אורח דומה!</div>
          <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:18}}>כבר קיים אורח עם שם או טלפון זהה</div>
          {/* כרטיס האורח הקיים */}
          <div style={{background:C.blueXL,borderRadius:14,padding:"14px 16px",marginBottom:20,border:`1.5px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>האורח הקיים</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>{ini(dupGuest.name)}</div>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:C.text}}>{dupGuest.name}</div>
                {dupGuest.phone&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>📞 {dupGuest.phone}</div>}
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>
                  {dupGuest.rsvp==="confirmed"?"✅ מגיע":dupGuest.rsvp==="declined"?"❌ לא מגיע":"⏳ ממתין"}
                </div>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={()=>onSave({name:name.trim(),phone:phone.trim(),rsvp,guest_count:count},true)} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              ➕ הוסף כאורח חדש בנפרד
            </button>
            <button onClick={()=>setDupGuest(null)} style={{width:"100%",background:"#fff",color:C.text,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              ← חזרה לטופס
            </button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:desktop?"center":"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:desktop?"20px":"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
        <div style={{fontWeight:800,fontSize:18,color:C.text,marginBottom:18}}>{isEdit?"✏️ עריכת אורח":"➕ הוסף אורח"}</div>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>שם מלא *</div>
        <input value={name} onChange={e=>setName(e.target.value)} onBlur={moveNamePhone} placeholder="ישראל ישראלי" aria-label="שם מלא"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>מספר פלאפון</div>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="050-0000000" type="tel" aria-label="מספר פלאפון" inputMode="tel"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>כמות מגיעים</div>
        <div style={{display:"flex",alignItems:"center",gap:12,background:C.blueXL,borderRadius:12,padding:"10px 14px",marginBottom:14}}>
          <button onClick={()=>setCount(c=>Math.max(1,c-1))} aria-label="פחות מגיעים" style={{width:32,height:32,borderRadius:8,background:"#fff",border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
          <span style={{flex:1,textAlign:"center",fontSize:18,fontWeight:800,color:C.blue}}>{count}</span>
          <button onClick={()=>setCount(c=>c+1)} aria-label="עוד מגיע" style={{width:32,height:32,borderRadius:8,background:"#fff",border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
        </div>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>סטטוס הגעה</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {[["confirmed","✓ מגיע","#F0FFF6",C.success],["pending","⏳ ממתין",C.blueXL,C.blue],["declined","✗ לא מגיע","#FEF2F2",C.danger]].map(([v,l,bg,col])=>(
            <button key={v} onClick={()=>setRsvp(v)} style={{background:rsvp===v?col:bg,color:rsvp===v?"#fff":col,border:`2px solid ${rsvp===v?col:C.border}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,transition:"all .15s"}}>{l}</button>
          ))}
        </div>

        {/* קטגוריית קרבה */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted}}>קטגוריית קרבה</div>
            <button onClick={()=>setAddingCat(a=>!a)}
              style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:700,color:C.blue,cursor:"pointer",fontFamily:"inherit"}}>
              {addingCat?"✕ ביטול":"+ הוסף קטגוריה"}
            </button>
          </div>

          {/* עיגול צבע גדול */}
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:RELATION_COLORS[relation]||newCatColor||"#CBD5E0",boxShadow:`0 4px 16px ${RELATION_COLORS[relation]||"#CBD5E0"}88`,transition:"background .3s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>
              {relation?relation[0]:"?"}
            </div>
          </div>

          {/* כפתורי קטגוריה */}
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {allRelations.map(r=>(
              <button key={r} onClick={()=>setRelation(r)}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                  border:`1.5px solid ${relation===r?RELATION_COLORS[r]||"#805AD5":"#E2E8F0"}`,
                  background:relation===r?RELATION_COLORS[r]||"#805AD5":"#fff",
                  color:relation===r?onColor(RELATION_COLORS[r]||"#805AD5"):"#5F6B7D",transition:"all .15s"}} aria-pressed={relation===r}>
                <div style={{width:8,height:8,borderRadius:"50%",background:relation===r?"rgba(255,255,255,.7)":RELATION_COLORS[r]||"#805AD5",flexShrink:0}}/>
                {r}
              </button>
            ))}
          </div>

          {/* הוספת קטגוריה חדשה */}
          {addingCat&&(
            <div style={{marginTop:10,background:C.blueXL,borderRadius:12,padding:12}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:6,fontWeight:700}}>שם הקטגוריה החדשה:</div>
              <input value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="לדוגמה: עמיתים לעבודה"
                style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:8}}/>
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                {COLORS.map(col=>(
                  <div key={col} onClick={()=>setNewCatColor(col)}
                    style={{width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:`3px solid ${newCatColor===col?"#1A202C":"transparent"}`,transition:"border .15s"}}/>
                ))}
              </div>
              <button onClick={()=>{if(!newCat.trim())return;setCustomRelations(r=>[...r,newCat.trim()]);RELATION_COLORS[newCat.trim()]=newCatColor;setRelation(newCat.trim());setNewCat("");setAddingCat(false);}}
                style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:10,padding:"9px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ✓ הוסף קטגוריה
              </button>
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={!name.trim()}
          style={{width:"100%",background:name.trim()?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#F6F0FF",color:name.trim()?"#fff":C.muted,border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:name.trim()?"pointer":"default",fontFamily:"inherit"}}>
          {isEdit?"שמור שינויים ✓":"הוסף אורח ✓"}
        </button>
      </div>
    </div>
  );
}

export function ReceiptModal({ tables, onClose }) {
  const [q,setQ]=useState(""),[res,setRes]=useState(null),[nf,setNf]=useState(false);
  const search=v=>{setQ(v);setRes(null);setNf(false);if(!v.trim())return;for(let i=0;i<tables.length;i++){const t=tables[i],g=(t.guests||[]).find(g=>g.name.toLowerCase().includes(v.toLowerCase()));if(g){setRes({guest:g,table:t,num:t.num||i+1});return;}}setNf(true);};
  const print=()=>{if(!res)return;const w=window.open("","_blank","width=320,height=420");w.document.write(`<html><head><style>body{font-family:monospace;width:280px;margin:0 auto;padding:16px;direction:rtl}.logo{text-align:center;font-size:18px;font-weight:900;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:14px}.name{font-size:26px;font-weight:900;margin-bottom:14px}.box{border:3px solid #000;border-radius:8px;padding:12px;text-align:center;margin-bottom:14px}.num{font-size:56px;font-weight:900;line-height:1}.footer{text-align:center;font-size:11px;border-top:1px dashed #000;padding-top:10px;color:#888}</style></head><body><div class="logo">Sidor-IL</div><div style="font-size:12px;color:#666">שם האורח</div><div class="name">${res.guest.name}</div><div class="box"><div style="font-size:13px;color:#444">שולחן מספר</div><div class="num">${res.num}</div><div style="font-size:16px;font-weight:700">${res.table.name}</div></div><div class="footer">ברוך הבא! sidor-il.co.il</div></body></html>`);w.document.close();setTimeout(()=>{w.focus();w.print();},400);};
  return(<div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl"}}>
      <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🖨️</div>
          <div><div style={{fontWeight:800,fontSize:16,color:C.text}}>חיפוש אורח</div><div style={{fontSize:12,color:C.muted}}>הדפסת פתק שולחן</div></div>
        </div>
        <button onClick={onClose} style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:700,color:C.blue,cursor:"pointer",fontFamily:"inherit"}}>✕ סגור</button>
      </div>
      <input value={q} onChange={e=>search(e.target.value)} placeholder="הקלד שם אורח..." style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>
      {res&&<div style={{background:C.blueXL,border:`2px solid ${C.blueL}`,borderRadius:16,overflow:"hidden",marginBottom:12}}>
        <div style={{background:"#fff",margin:12,borderRadius:12,border:`1px dashed ${C.border}`,padding:"16px",textAlign:"center",fontFamily:"monospace"}}>
          <div style={{fontSize:12,fontWeight:900,letterSpacing:2,color:C.blue,marginBottom:6}}>Sidor-IL</div>
          <div style={{fontSize:12,color:C.muted}}>שם האורח</div>
          <div style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:10}}>{res.guest.name}</div>
          <div style={{border:`3px solid ${C.text}`,borderRadius:10,padding:"10px",marginBottom:8}}>
            <div style={{fontSize:12,color:C.muted}}>שולחן מספר</div>
            <div style={{fontSize:48,fontWeight:900,lineHeight:1,color:C.blue}}>{res.num}</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>{res.table.name}</div>
          </div>
          <div style={{fontSize:12,color:C.muted}}>ברוך הבא! 🎉</div>
        </div>
        <div style={{padding:"0 12px 12px",display:"flex",gap:8}}>
          <button onClick={()=>{setRes(null);setQ("");}} style={{flex:1,background:C.surface,color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← חזרה</button>
          <button onClick={print} style={{flex:2,background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🖨️ הדפס פתק</button>
        </div>
      </div>}
      {nf&&<div style={{background:"#FEF2F2",border:`1px solid ${C.danger}30`,borderRadius:12,padding:"12px",textAlign:"center",color:C.danger,fontSize:14,marginBottom:12}}>לא נמצא "{q}"</div>}
      {!q&&<div style={{textAlign:"center",color:C.muted,fontSize:14,padding:"20px 0"}}>🔍 הקלד שם לחיפוש</div>}
    </div>
  </div>);
}

export function Countdown({ date }) {
  const [time,setTime]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{const calc=()=>{const diff=new Date(date)-new Date();if(diff<=0){setTime({d:0,h:0,m:0,s:0});return;}setTime({d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)});};calc();const id=setInterval(calc,1000);return()=>clearInterval(id);},[date]);
  return(<div style={{display:"flex",gap:8,justifyContent:"center"}}>{[["d","ימים"],["h","שעות"],["m","דקות"],["s","שניות"]].map(([k,l])=>(<div key={k} style={{textAlign:"center",background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 10px",minWidth:52}}><div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1}}>{String(time[k]).padStart(2,"0")}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:2}}>{l}</div></div>))}</div>);
}

// ─── VENUE PAGE ───────────────────────────────────────────────────────────────
export function HamburgerMenu({ onOpenAuth, onClose, onVenuePage, onLogout }) {
  const menuItems = [
    { label:"ראשי", href:"#" },
    { label:"סידורי הושבה", href:"#features" },
    { label:"אישורי הגעה", href:"#features" },
    { label:"חבילות ומחירים", href:"#pricing" },
    { label:"אולמות / מפיקים", href:"#", onClick:()=>{onVenuePage&&onVenuePage();onClose();} },
    { label:"צור קשר", href:"#contact" },
  ];
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(13,27,75,.55)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,zIndex:201,width:280,maxWidth:"85vw",background:"#fff",boxShadow:"-4px 0 40px rgba(13,27,75,.15)",display:"flex",flexDirection:"column",direction:"rtl"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"24px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#fff",fontWeight:900}}>◈</div>
            <div>
              <div style={{fontWeight:900,fontSize:17,color:"#fff",lineHeight:1}}>Sidor-IL</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.65)",marginTop:2}}>סידורי הושבה חכמים</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
        </div>
        {/* Links */}
        <div style={{flex:1,overflowY:"auto"}}>
          {menuItems.map(item=>(
            <a key={item.label} href={item.href} onClick={item.onClick||onClose}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",textDecoration:"none",color:C.text,fontSize:15,fontWeight:600,borderBottom:`1px solid ${C.border}`}}
              onMouseEnter={e=>e.currentTarget.style.background=C.blueXL}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <span>{item.label}</span>
              <span style={{color:C.muted,fontSize:13}}>›</span>
            </a>
          ))}
        </div>
        {/* Buttons */}
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:10,borderTop:`1px solid ${C.border}`}}>
          {onLogout ? (
            <button onClick={()=>{onLogout();onClose();}}
              style={{background:"#FEF2F2",color:C.danger,border:`1.5px solid ${C.danger}30`,borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              🚪 התנתק
            </button>
          ) : (
            <>
              <button onClick={()=>{onOpenAuth("register");onClose();}}
                style={{background:`linear-gradient(135deg,${C.blue},${C.blueL})`,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                הרשמה בחינם
              </button>
              <button onClick={()=>{onOpenAuth("login");onClose();}}
                style={{background:"transparent",color:C.blue,border:`2px solid ${C.blue}`,borderRadius:10,padding:"11px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                כניסה למערכת
              </button>
            </>
          )}
        </div>
        {/* Contact */}
        <div style={{padding:"12px 20px",background:C.bg,borderTop:`1px solid ${C.border}`}}>
          <a href={contactUrl()} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none",color:C.muted,fontSize:12,fontWeight:600}}>
            <span style={{fontSize:15}}>{SUPPORT_WA?"💬":"✉️"}</span> {SUPPORT_WA?"לחץ לצ'אט ב-WhatsApp":SUPPORT_MAIL}
          </a>
          {SUPPORT_PHONE&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>📞 {SUPPORT_PHONE} · א׳-ה׳ 9:00-17:00</div>}
        </div>
      </div>
    </>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
// ─── ACCESSIBILITY WIDGET ────────────────────────────────────────────────────
export const StepArt=({kind})=>{
  const box={width:"100%",height:130,display:"block",marginBottom:18};
  if(kind===1) return(
    <svg direction="ltr" viewBox="0 0 240 130" style={box} aria-hidden="true">
      <rect x="40" y="10" width="160" height="112" rx="14" fill="#fff" stroke="#EFE8F7"/>
      <rect x="40" y="10" width="160" height="26" rx="14" fill="#F4EEFF"/><rect x="40" y="24" width="160" height="12" fill="#F4EEFF"/>
      <text x="186" y="28" textAnchor="end" fontSize="11" fontWeight="900" fill={LP.ink} fontFamily="Heebo">רשימת מוזמנים</text>
      {[[LP.rose,"משפחה",112],[LP.sky,"חברים",92],[LP.mint,"עבודה",104],[LP.gold,"שכנים",80]].map(([c,l,w],i)=>(
        <g key={l} transform={`translate(0,${48+i*18})`}>
          <circle cx="186" cy="0" r="5" fill={c}/>
          <rect x={176-w} y="-4" width={w-46} height="8" rx="4" fill="#EEE9F6"/>
          <rect x="54" y="-7" width="40" height="14" rx="7" fill={c} opacity=".15"/>
          <text x="74" y="4" textAnchor="middle" fontSize="9" fontWeight="800" fill={c} fontFamily="Heebo">{l}</text>
        </g>
      ))}
      <g style={{animation:"float 3.5s ease-in-out infinite"}}>
        <rect x="6" y="64" width="44" height="52" rx="8" fill="#1F9D55"/><text x="28" y="96" textAnchor="middle" fontSize="16" fontWeight="900" fill="#fff" fontFamily="Heebo">X</text>
        <path d="M50 88h14" stroke={LP.violet} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 4"/>
      </g>
    </svg>
  );
  if(kind===2) return(
    <svg direction="ltr" viewBox="0 0 240 130" style={box} aria-hidden="true">
      {Array.from({length:10}).map((_,i)=>{const d=i*36,a=d*Math.PI/180;return <rect key={i} x="-9" y="-6" width="18" height="12" rx="5" transform={`translate(${(120+48*Math.sin(a)).toFixed(1)},${(66-48*Math.cos(a)).toFixed(1)}) rotate(${d})`} fill={i<7?[LP.rose,LP.sky,LP.violet][i%3]:"#ECE6F5"}/>;})}
      <circle cx="120" cy="66" r="34" fill="#fff" stroke="#EADFF7" strokeWidth="2"/>
      {[0,72,144,216,288].map(d=>{const a=d*Math.PI/180;return <circle key={d} cx={120+8*Math.cos(a)} cy={62+8*Math.sin(a)} r="5" fill={LP.rose} opacity=".5"/>;})}
      <circle cx="120" cy="62" r="4" fill={LP.gold}/>
      <text x="120" y="88" textAnchor="middle" fontSize="10" fontWeight="900" fill={LP.ink} fontFamily="Heebo">7/10</text>
      <g style={{animation:"float 3s ease-in-out infinite"}}>
        <rect x="170" y="14" width="62" height="24" rx="12" fill="#fff" stroke="#F3D3E2"/><circle cx="220" cy="26" r="7" fill={LP.coral}/>
        <text x="196" y="30" textAnchor="middle" fontSize="10" fontWeight="800" fill={LP.ink} fontFamily="Heebo">סבתא</text>
        <path d="M176 40 Q160 52 156 50" stroke={LP.violet} strokeWidth="2" fill="none" strokeDasharray="3 4"/>
      </g>
    </svg>
  );
  return(
    <svg direction="ltr" viewBox="0 0 240 130" style={box} aria-hidden="true">
      <rect x="80" y="4" width="80" height="124" rx="16" fill={LP.ink}/><rect x="86" y="12" width="68" height="108" rx="11" fill="#FBF8FF"/>
      <rect x="108" y="16" width="24" height="5" rx="2.5" fill={LP.ink}/>
      <g style={{animation:"float 3.2s ease-in-out infinite"}}>
        <rect x="92" y="34" width="56" height="44" rx="10" fill="#DCF8C6"/>
        <text x="142" y="50" textAnchor="end" fontSize="8" fontWeight="700" fill="#2B4A2B" fontFamily="Heebo">היי רחל 💛</text>
        <text x="142" y="62" textAnchor="end" fontSize="8" fill="#2B4A2B" fontFamily="Heebo">השולחן שלך</text>
        <text x="120" y="75" textAnchor="middle" fontSize="12" fontWeight="900" fill="#1F7A3F" fontFamily="Heebo">שולחן 7</text>
      </g>
      <rect x="92" y="84" width="56" height="26" rx="8" fill="#fff" stroke="#EFE8F7"/>
      <text x="120" y="101" textAnchor="middle" fontSize="9" fontWeight="800" fill={LP.violet} fontFamily="Heebo">✓ אישרתי הגעה</text>
      <g transform="translate(176,40)" style={{animation:"sway 3s ease-in-out infinite",transformOrigin:"24px 0"}}>
        <path d="M24 0v10" stroke="#CBBFE0"/><rect x="2" y="10" width="44" height="54" rx="6" fill="#fff" stroke="#EADFF7"/>
        <text x="24" y="32" textAnchor="middle" fontSize="9" fill={LP.muted} fontFamily="Heebo">כרטיס הושבה</text>
        <text x="24" y="52" textAnchor="middle" fontSize="18" fontWeight="900" fill={LP.rose} fontFamily="Heebo">7</text>
      </g>
      <g transform="translate(24,52)"><rect width="42" height="42" rx="12" fill="#E9FBF4"/><path d="M12 22l7 7 12-14" stroke={LP.mint} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>
    </svg>
  );
};

// ─── התקנת האפליקציה (PWA): manifest.webmanifest + sw.js ───
// Chrome / Edge / Samsung: חלון ההתקנה של המערכת (beforeinstallprompt). iPhone ושאר הדפדפנים: הוראות קצרות
export function SupportMenu({ event, compact=false }) {
  // open = מיקום הכפתור במסך. התפריט ב-position:fixed כי הבאנר חותך (overflow:hidden)
  const [open,setOpen]=useState(null);
  const ref=useRef(null);
  useEffect(()=>{if(!open)return;const close=e=>{if(!ref.current?.contains(e.target))setOpen(null);};const off=()=>setOpen(null);
    document.addEventListener("pointerdown",close);window.addEventListener("scroll",off,true);window.addEventListener("resize",off);
    return()=>{document.removeEventListener("pointerdown",close);window.removeEventListener("scroll",off,true);window.removeEventListener("resize",off);};},[open]);
  const toggle=e=>{if(open){setOpen(null);return;}const r=e.currentTarget.getBoundingClientRect();setOpen({top:r.bottom+8,left:Math.max(8,Math.min(r.left,window.innerWidth-248))});};
  const intro=`שלום, אני צריך/ה עזרה באירוע "${event?.name||""}"`;
  const opt={display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,textDecoration:"none",color:C.text,fontSize:14,fontWeight:800};
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={toggle} aria-expanded={!!open} aria-haspopup="menu" className="sx-btn"
        style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:compact?"6px 10px":"5px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
        {compact?"❓ עזרה":"❓ תמיכה ועזרה"}
      </button>
      {open&&(
        <div role="menu" style={{position:"fixed",top:open.top,left:open.left,zIndex:400,background:"#fff",borderRadius:16,padding:6,width:240,boxShadow:"0 18px 40px -12px rgba(91,60,140,.45)",border:`1px solid ${C.border}`,direction:"rtl"}}>
          <div style={{fontSize:11,color:C.muted,padding:"6px 10px 4px"}}>נשמח לעזור, בדרך כלל עונים תוך כמה שעות</div>
          {SUPPORT_WA&&<a role="menuitem" href={`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(intro+":\n")}`} target="_blank" rel="noopener noreferrer" onClick={()=>setOpen(null)} style={{...opt,background:"#F0FFF4"}}>
            <WaIcon size={20}/> שליחה בוואטסאפ
          </a>}
          <a role="menuitem" href={`mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("עזרה: "+(event?.name||"Sidor-IL"))}&body=${encodeURIComponent(intro+".\n\n")}`} onClick={()=>setOpen(null)} style={{...opt,marginTop:4}}>
            <span style={{fontSize:18}}>✉️</span> שליחה במייל
          </a>
          {!isStandalone()&&<div style={{borderTop:`1px solid ${C.border}`,marginTop:6,paddingTop:6}}>
            <InstallAppButton style={{width:"100%",border:"none",background:"#F6F0FF",justifyContent:"flex-start",padding:"11px 14px",borderRadius:12}}/>
          </div>}
        </div>
      )}
    </div>
  );
}

// הבר של דף הבית, קבוע למעלה, בדפים הפנימיים (מדיניות, מדריכים, סוגי אירועים, אולמות).
// כל לחיצה חוזרת לדף הבית (גם למשתמש מחובר) ולמקטע שנבחר; כניסה/הרשמה נפתחות שם
export const LANDING_SECTIONS=[["how","איך זה עובד"],["features","יכולות"],["vendors","ספקים ומחירים"],["events","סוגי אירועים"],["pricing","מחירים"]];
// טעינה מחדש תמיד (גם כשרק ה-# משתנה), כדי שהאפליקציה תקרא את sidor_landing ותציג את דף הבית
export const XLS_ROWS=[
  ["משה טל","052-•••-6049","2","4?",""],
  ["יעל שגיא","052-•••-7420","לא","—","","x"],
  ["אלון קפלן","052-•••-8791","??","","לבדוק עם אמא"],
  ["דנה וייס","","אולי","7 או 12","","y"],
  ["גיל אורן","052-•••-1533","לא ענה","",""],
  ["רחל כהן","052-•••-0000","1","","לא ליד דוד משה!!","r"],
  ["דוד לוי","052-•••-1371","2","3",""],
  ["נועה פרץ","052-•••-2742","לא","","","x"],
  ["יוסי מזרחי","052-•••-4113","2","?","פלוס 1?"],
];
// סיור במערכת: צילום מסך אמיתי (נתוני דוגמה) לכל יכולת, בלשוניות
export const DEV_CSS=`
  .lp-dev{position:relative;overflow:hidden;isolation:isolate;margin:0 2vw 28px;border-radius:56px;padding:90px 6vw;color:#fff;background:linear-gradient(125deg,#3F1D8F 0%,#7646D9 48%,#D2508F 100%)}
  .lp-dev::before,.lp-dev::after{content:"";position:absolute;z-index:-1;border-radius:50%;filter:blur(40px);opacity:.55}
  .lp-dev::before{width:420px;height:420px;background:#FF8AC0;left:-120px;bottom:-160px}
  .lp-dev::after{width:360px;height:360px;background:#8FD3FF;right:30%;top:-180px;opacity:.35}
  .lp-dev-in{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.15fr);gap:48px;align-items:center}
  .lp-dev-txt h2{font:900 clamp(34px,4.2vw,56px)/1.08 'Fredoka','Heebo',sans-serif;margin:0 0 16px;letter-spacing:-.02em}
  .lp-dev-txt h2 span{background:linear-gradient(120deg,#FFD3E6,#FFE7B8);-webkit-background-clip:text;background-clip:text;color:transparent}
  .lp-dev-txt > p{font-size:18px;line-height:1.7;margin:0 0 24px;color:rgba(255,255,255,.92);max-width:46ch}
  .lp-dev-pts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:28px}
  .lp-dev-pt{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:20px;padding:14px 12px;display:flex;flex-direction:column;gap:8px}
  .lp-dev-pt i{font-style:normal;width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:19px}
  .lp-dev-pt b{font:800 15px/1.3 'Fredoka','Heebo',sans-serif}
  .lp-dev-pt span{font-size:13px;line-height:1.5;color:rgba(255,255,255,.85)}
  .lp-dev-cta{display:inline-flex;align-items:center;min-height:54px;padding:0 30px;border:none;border-radius:999px;background:#fff;color:#4A2C8F;font:800 17px 'Fredoka','Heebo',sans-serif;cursor:pointer;box-shadow:0 18px 36px -18px rgba(20,5,50,.8);transition:scale 160ms cubic-bezier(0.23,1,0.32,1)}
  .lp-dev-acts{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
  .lp-dev-acts .sx-btn small{display:block;font:600 11px 'Heebo',sans-serif;color:rgba(255,255,255,.75)}
  .lp-dev-ic{font-size:22px}
  .lp-dev-note{margin-top:12px;font-size:13.5px;color:rgba(255,255,255,.82)}
  .lp-dev-cta:active{scale:.97}.lp-dev-cta:focus-visible{outline:3px solid #fff;outline-offset:3px}
  @media(hover:hover) and (pointer:fine){.lp-dev-cta:hover{scale:1.04}}
  .lp-dev-stage{position:relative;aspect-ratio:600/440}
  .lp-dev-lap{position:absolute;top:4%;right:0;width:86%}
  .lp-dev-scr{border:10px solid #1C1430;border-bottom-width:14px;border-radius:20px 20px 6px 6px;overflow:hidden;background:#fff;box-shadow:0 40px 70px -34px rgba(10,0,30,.8)}
  .lp-dev-scr img{display:block;width:100%;height:auto;aspect-ratio:1440/900}
  .lp-dev-base{height:16px;margin:0 -7%;background:linear-gradient(180deg,#E9E3F2,#B9AFCB);border-radius:0 0 18px 18px;position:relative}
  .lp-dev-base::after{content:"";position:absolute;top:0;left:50%;translate:-50% 0;width:18%;height:6px;border-radius:0 0 8px 8px;background:#A89EBB}
  .lp-dev-ph{position:absolute;left:2%;bottom:0;width:25%;border:7px solid #1C1430;border-radius:30px;overflow:hidden;background:#fff;box-shadow:0 34px 60px -26px rgba(10,0,30,.85)}
  .lp-dev-ph img{display:block;width:100%;height:auto;aspect-ratio:1170/2280;object-fit:cover}
  .lp-dev-ph::before{content:"";position:absolute;z-index:1;top:6px;left:50%;translate:-50% 0;width:34%;height:9px;border-radius:9px;background:#1C1430}
  .lp-dev-sync{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
  .lp-dev-sync path{stroke-dasharray:5 8}
  .lp-dev-toast{position:absolute;z-index:3;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;background:#fff;color:#2B1D3F;border-radius:14px;padding:8px 12px;font:800 13px 'Fredoka','Heebo',sans-serif;box-shadow:0 16px 30px -16px rgba(10,0,30,.8)}
  .lp-dev-toast i{font-style:normal;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#fff;background:#1F7A4D}
  .lp-dev-t1{left:0;bottom:66%}
  .lp-dev-t2{right:6%;top:0}
  .lp-dev-t2 i{background:#9B6BFF}
  @keyframes lpDevFloat{50%{transform:translateY(-8px)}}
  @keyframes lpDevFloat2{50%{transform:translateY(6px)}}
  @keyframes lpDevT1{0%,6%{opacity:0;transform:translateY(8px) scale(.94)}12%,78%{opacity:1;transform:none}86%,100%{opacity:0;transform:none}}
  @keyframes lpDevT2{0%,34%{opacity:0;transform:translateY(8px) scale(.94)}40%,80%{opacity:1;transform:none}88%,100%{opacity:0;transform:none}}
  @keyframes lpDevDash{to{stroke-dashoffset:-26}}
  .lp-motion .lp-dev-lap{animation:lpDevFloat 7s ease-in-out infinite}
  .lp-motion .lp-dev-ph{animation:lpDevFloat2 6s ease-in-out infinite}
  .lp-motion .lp-dev-t1{animation:lpDevT1 6s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-dev-t2{animation:lpDevT2 6s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-dev-sync path{animation:lpDevDash 1.1s linear infinite}
  @media(prefers-reduced-motion:reduce){.lp-dev *{animation:none!important}}
  @media(max-width:900px){
    .lp-dev{margin:0 8px 20px;border-radius:36px;padding:56px 5vw 44px}
    .lp-dev-in{grid-template-columns:1fr;gap:34px}
    .lp-dev-pts{grid-template-columns:1fr;gap:8px}
    .lp-dev-pt{flex-direction:row;align-items:center;padding:10px 12px}
    .lp-dev-pt span{display:none}
    .lp-dev-txt > p{font-size:16px}
    .lp-dev-toast{font-size:11.5px;padding:6px 9px}
  }
`;
export function DevicesSection({onStart}){
  const moving=lpMotionOK();
  return(<section className="lp-dev" aria-labelledby="lp-dev-h">
    <style>{DEV_CSS}</style>
    <div className="lp-dev-in">
      <div className="lp-dev-txt">
        <h2 id="lp-dev-h">האירוע איתכם <span>בכל מכשיר</span></h2>
        <p>מתחילים במחשב בבית וממשיכים מהטלפון בדרך לאולם. כל שינוי נשמר מיד, ומחכה לכם בכל מכשיר, גם אצל בן או בת הזוג.</p>
        <div className="lp-dev-pts">
          <div className="lp-dev-pt"><i aria-hidden="true">📲</i><b>אפליקציה ישר מהאתר</b><span>בלי חנות אפליקציות: מתקינים מכאן, והאייקון מופיע במסך הבית</span></div>
          <div className="lp-dev-pt"><i aria-hidden="true">🔄</i><b>הכל נשמר בענן</b><span>אותו אירוע, מעודכן, בכל מקום שתתחברו</span></div>
          <div className="lp-dev-pt"><i aria-hidden="true">👫</i><b>ניהול בשניים</b><span>משתפים את האירוע ועובדים עליו יחד</span></div>
        </div>
        <div className="lp-dev-acts">
          <button type="button" className="lp-dev-cta" onClick={onStart}>מתחילים בחינם</button>
          <InstallAppButton label={<><span className="lp-dev-ic" aria-hidden="true">📲</span><span><small>להורדה מהאתר</small>האפליקציה של Sidor-IL</span></>} style={{background:"#1C1430",color:"#fff",border:"1.5px solid rgba(255,255,255,.35)",borderRadius:999,minHeight:54,padding:"0 22px",gap:10,fontFamily:"'Fredoka','Heebo',sans-serif",fontSize:15,textAlign:"right",lineHeight:1.15}}/>
        </div>
        <div className="lp-dev-note">בלי חנות אפליקציות: עובד באייפון, באנדרואיד ובמחשב</div>
      </div>
      <div className="lp-dev-stage" aria-hidden="true">
        <svg className="lp-dev-sync" viewBox="0 0 600 440" preserveAspectRatio="none">
          <path d="M110 150 C150 60 240 40 300 90" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="3" strokeLinecap="round"/>
          {moving&&<circle r="6" fill="#FFE7B8"><animateMotion dur="2.4s" repeatCount="indefinite" path="M110 150 C150 60 240 40 300 90"/></circle>}
        </svg>
        <div className="lp-dev-lap">
          <div className="lp-dev-scr"><img src="/landing/tour/home.jpg" alt="" width="1440" height="900" loading="lazy" decoding="async"/></div>
          <div className="lp-dev-base"/>
        </div>
        <div className="lp-dev-ph"><img src="/landing/rsvp-v2.jpg" alt="" width="1170" height="2280" loading="lazy" decoding="async"/></div>
        <div className="lp-dev-toast lp-dev-t1"><i>✓</i>דנה כהן אישרה הגעה</div>
        <div className="lp-dev-toast lp-dev-t2"><i>↻</i>עודכן גם במחשב</div>
      </div>
    </div>
  </section>);
}

// "מהרשימה לאולם ב-3 צעדים": הנפשה לכל צעד — מוסיפים אנשי קשר, מסדרים בשולחן, שולחים לאורחים
export function CompareSlider() {
  const boxRef=useRef(null),topRef=useRef(null),barRef=useRef(null),knobRef=useRef(null);
  const pos=useRef(50),hint=useRef([]),drag=useRef(null),touched=useRef(false);
  const apply=p=>{
    const box=boxRef.current;if(!box)return;
    p=Math.max(0,Math.min(100,p));pos.current=p;
    topRef.current.style.clipPath=`inset(0 0 0 ${p}%)`;
    barRef.current.style.transform=`translateX(${(p/100*box.clientWidth).toFixed(1)}px)`;
    const r=Math.round(p);
    knobRef.current.setAttribute("aria-valuenow",String(r));
    knobRef.current.setAttribute("aria-valuetext",`${100-r}% אקסל, ${r}% מפת אולם`);
  };
  const stopHint=()=>{hint.current.forEach(a=>a.cancel());hint.current=[];};
  useLayoutEffect(()=>{
    const box=boxRef.current;if(!box)return;
    apply(pos.current);
    const ro=new ResizeObserver(()=>apply(pos.current));ro.observe(box);
    // רמז חד-פעמי כשהרכיב נכנס למסך: הידית זזה לשני הצדדים וחוזרת לאמצע, כדי שיבינו שאפשר לגרור
    let timer=0,io=null;
    if(lpMotionOK()&&box.animate){
      io=new IntersectionObserver(([e])=>{
        if(!e.isIntersecting)return;
        io.disconnect();
        timer=setTimeout(()=>{
          if(touched.current)return;
          const W=box.clientWidth,ease="cubic-bezier(0.77, 0, 0.175, 1)",ps=[50,64,38,50],o={duration:2400};
          hint.current=[
            topRef.current.animate(ps.map(p=>({clipPath:`inset(0 0 0 ${p}%)`,easing:ease})),o),
            barRef.current.animate(ps.map(p=>({transform:`translateX(${(p/100*W).toFixed(1)}px)`,easing:ease})),o),
          ];
          hint.current[0].onfinish=()=>{hint.current=[];};
        },450);
      },{threshold:.6});
      io.observe(box);
    }
    return()=>{ro.disconnect();if(io)io.disconnect();clearTimeout(timer);stopHint();};
  },[]);
  const xToP=x=>{const r=boxRef.current.getBoundingClientRect();return (x-r.left)/r.width*100;};
  const onDown=e=>{
    if(e.pointerType==="mouse"&&e.button!==0)return;
    touched.current=true;stopHint();
    // עכבר: הידית קופצת מיד לנקודה. אצבע: רק אחרי תנועה אופקית (כדי לא להפריע לגלילה)
    drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,on:e.pointerType==="mouse"};
    if(drag.current.on){try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}apply(xToP(e.clientX));}
  };
  const onMove=e=>{
    const d=drag.current;if(!d||d.id!==e.pointerId)return;
    if(!d.on){
      const dx=Math.abs(e.clientX-d.x),dy=Math.abs(e.clientY-d.y);
      if(dx<6||dx<dy)return;
      d.on=true;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
    }
    apply(xToP(e.clientX));
  };
  const onUp=e=>{if(drag.current&&drag.current.id===e.pointerId)drag.current=null;};
  const onKey=e=>{
    const s=e.shiftKey?20:5,k=e.key;let p=null;
    if(k==="ArrowLeft"||k==="ArrowDown")p=pos.current-s;
    else if(k==="ArrowRight"||k==="ArrowUp")p=pos.current+s;
    else if(k==="Home")p=0;
    else if(k==="End")p=100;
    if(p===null)return;
    e.preventDefault();touched.current=true;stopHint();apply(p);
  };
  return(
    <div className="lp-cmp" ref={boxRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <div className="lp-cmp-after">
        <img src="/landing/seating-v3.jpg" alt="אחרי: מסך סידורי ההושבה ב-Sidor-IL, עם סרגל הכלים, מפת האולם ורשימת האורחים שממתינים להושבה" width="1600" height="800" loading="lazy" draggable="false"/>
        <span className="lp-cmp-tag after" aria-hidden="true">אחרי</span>
      </div>
      <div className="lp-cmp-before" ref={topRef} role="img" aria-label="לפני: רשימת מוזמנים באקסל, עם שורות מחוקות, סימני שאלה והערות בצד">
        <div className="lp-xls" aria-hidden="true">
          <div className="lp-xls-bar"><b>X</b>מוזמנים_סופי_סופי (3).xlsx</div>
          <div className="lp-xls-tools"><i/><i/><i/><i/><i/></div>
          <table>
            <thead><tr><th className="n"/><th>A</th><th className="ph">B</th><th>C</th><th>D</th><th>E</th></tr></thead>
            <tbody>
              <tr className="h"><td className="n">1</td><td>שם</td><td className="ph">טלפון</td><td>מגיעים?</td><td>שולחן</td><td>הערות</td></tr>
              {XLS_ROWS.map(([nm,ph,co,tb,note,f],i)=>(
                <tr key={i} className={f||undefined}><td className="n">{i+2}</td><td>{nm}</td><td className="ph">{ph}</td><td>{co}</td><td>{tb}</td><td className={f==="r"?"r":undefined}>{note}</td></tr>
              ))}
              {[11,12].map(n=><tr key={n}><td className="n">{n}</td><td/><td className="ph"/><td/><td/><td/></tr>)}
            </tbody>
          </table>
          <div className="lp-note" style={{right:"6%",bottom:"8%",rotate:"-4deg"}}>סבתא צריכה כיסא ליד היציאה</div>
          <div className="lp-note pink" style={{right:"30%",top:"40%",rotate:"3deg"}}>עוד 46 לא ענו...</div>
        </div>
        <span className="lp-cmp-tag before" aria-hidden="true">לפני</span>
      </div>
      <div className="lp-cmp-bar" ref={barRef}>
        <div ref={knobRef} className="lp-cmp-knob" role="slider" tabIndex={0} aria-label="השוואה בין האקסל למפת האולם" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50} aria-valuetext="50% אקסל, 50% מפת אולם" onKeyDown={onKey}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>
        </div>
      </div>
    </div>
  );
}

// איך זה עובד: במחשב הטקסט נגלל והמסך שלצידו מתחלף לפי השלב שבמרכז המסך. בנייד — כל שלב עם התמונה שלו
export function HowStory() {
  const [act,setAct]=useState(0);
  const refs=useRef([]);
  useEffect(()=>{
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setAct(+e.target.dataset.i);}),{rootMargin:"-45% 0px -45% 0px"});
    refs.current.forEach(el=>el&&io.observe(el));
    return()=>io.disconnect();
  },[]);
  return(
    <div className="lp-story">
      <div className="lp-story-col">
        <span className="lp-story-rail" aria-hidden="true"/>
        <span className="lp-story-fill" aria-hidden="true" style={{transform:`scaleY(${act/(LP_STORY.length-1)})`}}/>
        <ol className="lp-story-steps">
          {LP_STORY.map((s,i)=>(
            <li key={i} ref={el=>{refs.current[i]=el;}} data-i={i} className={`lp-story-step${act===i?" on":""}`} style={{"--c":s.c}}>
              <span className="lp-story-n" aria-hidden="true">{i+1}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              <figure className={`lp-story-sm ${s.kind}`}><div className="lp-frame"><img src={s.img} alt={s.alt} loading="lazy"/></div></figure>
            </li>
          ))}
        </ol>
      </div>
      <div className="lp-story-stage" aria-hidden="true">
        {LP_STORY.map((s,i)=>(
          <figure key={i} className={`lp-screen ${s.kind}${act===i?" on":""}`}>
            <div className="lp-frame"><img src={s.img} alt="" loading="lazy"/></div>
            <span className="lp-screen-chip" style={{"--c":s.c}}>{s.chip}</span>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function EventPicker({ user, onSelect, onLogout, onBackToLanding }) {
  const [events,setEvents]=useState([]),[loading,setLoading]=useState(true),[creating,setCreating]=useState(false),[showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",date:"",event_type:"wedding",bride_name:"",groom_name:"",venue:"",venue_address:"",event_time:"",welcome_text:""});
  const [editEvent,setEditEvent]=useState(null);

  const updateEvent=async(raw)=>{
    const data=eventRow(raw);
    const{error}=await sb.from("events").update(data).eq("id",editEvent.id);
    if(error){alert("השמירה נכשלה: "+error.message);return;}
    setEvents(evs=>evs.map(e=>e.id===editEvent.id?{...e,...data}:e));
    setEditEvent(null);
  };
  const loadEvents=async()=>{setLoading(true);setEvents(await loadMyEvents(user,"date",true));setLoading(false);};
  const create=async()=>{
    if(!form.name.trim())return;
    setCreating(true);
    const invite_code=Math.random().toString(36).slice(2,10);
    const{data,error}=await sb.from("events").insert(eventRow({...form,name:form.name.trim(),user_id:user.id,invite_code,invite_active:true})).select().single();
    setCreating(false);
    if(error){alert("יצירת האירוע נכשלה: "+error.message);return;}
    onSelect(data);
  };
  const eventTypes=[["wedding","💍 חתונה"],["bar_mitzvah","✡️ בר/ת מצווה"],["brit","👶 ברית"],["business","💼 עסקי"],["other","🎉 אחר"]];

  useEffect(()=>{loadEvents();},[]);

  return(<div dir="rtl" style={{minHeight:"100vh",background:C.bg,fontFamily:"'Heebo',sans-serif",paddingBottom:40}}>
    <div style={{background:`linear-gradient(145deg,${C.blue},${C.blueM})`,padding:"32px 20px 28px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"12px 12px"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:12,color:"rgba(255,255,255,0.65)",fontWeight:600}}>שלום!</div><div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{user.email.split("@")[0]}</div></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onBackToLanding} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",color:"rgba(255,255,255,.85)",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>🏠 דף הבית</button>
            <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"none",color:"rgba(255,255,255,.9)",borderRadius:12,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>יציאה</button>
          </div>
        </div>
      </div>
    </div>
    <div style={{padding:"20px 16px",maxWidth:640,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,color:C.text}}>האירועים שלי</div>
        <Btn primary small onClick={()=>setShowForm(f=>!f)}>{showForm?"סגור ✕":"+ אירוע חדש"}</Btn>
      </div>

      {showForm&&<Card style={{padding:18,marginBottom:16,border:`1.5px solid ${C.blueL}`}}>
        <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:14}}>✨ יצירת אירוע חדש</div>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>סוג האירוע</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
          {eventTypes.map(([v,l])=>(
            <button key={v} onClick={()=>setForm(f=>({...f,event_type:v}))} style={{background:form.event_type===v?`linear-gradient(135deg,${C.blueM},${C.blueL})`:C.blueXL,color:form.event_type===v?"#fff":C.text,border:`2px solid ${form.event_type===v?"transparent":C.border}`,borderRadius:11,padding:"9px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שם האירוע *</div>
        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>

        {form.event_type==="wedding"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שם החתן</div>
            <input value={form.groom_name} onChange={e=>setForm(f=>({...f,groom_name:e.target.value}))} style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"8px 6px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שם הכלה</div>
            <input value={form.bride_name} onChange={e=>setForm(f=>({...f,bride_name:e.target.value}))} style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"8px 6px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>}
        {form.event_type!=="wedding"&&<div style={{marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>{eventKind(form).a}</div>
          <input value={form.groom_name} onChange={e=>setForm(f=>({...f,groom_name:e.target.value,bride_name:""}))} placeholder="השם שיופיע בהודעות" style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"8px 6px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>תאריך</div>
            <DateField compact value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"8px 8px",fontSize:14,color:C.text,fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שעה</div>
            <input type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))} style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"8px 6px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שם האולם</div>
        <VenueInput value={form.venue} onChange={v=>setForm(f=>({...f,venue:v}))} onPick={v=>setForm(f=>({...f,venue:v.name,venue_address:v.address||f.venue_address}))} placeholder="אולם הגן, תל אביב"
          style={{marginBottom:10}} inputStyle={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>כתובת מלאה (לניווט)</div>
        <input value={form.venue_address} onChange={e=>setForm(f=>({...f,venue_address:e.target.value}))} placeholder="רחוב הרצל 1, תל אביב"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>טקסט הזמנה</div>
        <textarea value={form.welcome_text} onChange={e=>setForm(f=>({...f,welcome_text:e.target.value}))} placeholder="אנו שמחים להזמין אתכם לחגוג איתנו..."
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:70,resize:"vertical",marginBottom:14}}/>

        <Btn primary full disabled={creating||!form.name.trim()} onClick={create}>{creating?"יוצר...":"✨ צור אירוע ←"}</Btn>
      </Card>}

      {loading?<div style={{display:"flex",justifyContent:"center",padding:48}}><Spinner size={36}/></div>
        :events.length===0?<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:52,marginBottom:12}}>🎉</div><p style={{fontWeight:700,color:C.blue,fontSize:16}}>אין עדיין אירועים</p></div>
        :<div style={{display:"flex",flexDirection:"column",gap:12}}>
          {events.map(ev=>(<Card key={ev.id} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
            <div onClick={()=>onSelect(ev)} style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${C.blue}18,${C.blueL}18)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer",flexShrink:0}}>🎊</div>
            <div onClick={()=>onSelect(ev)} style={{flex:1,cursor:"pointer",minWidth:0}}>
              <div style={{fontWeight:800,fontSize:15,color:C.text,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{ev.name}</div>
              {ev.date&&<div style={{fontSize:12,color:C.muted,marginTop:1}}>📅 {new Date(ev.date).toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}</div>}
              {ev.venue&&<div style={{fontSize:12,color:C.muted}}>📍 {ev.venue}</div>}
            </div>
            <button onClick={e=>{e.stopPropagation();setEditEvent(ev);}} style={{background:C.blueXL,border:`2px solid ${C.blueL}`,borderRadius:10,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,flexShrink:0}}>✏️</button>
          </Card>))}
        </div>
      }
    </div>

    {editEvent&&(
      <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setEditEvent(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl",maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
          <div style={{fontWeight:800,fontSize:18,color:C.text,marginBottom:16}}>✏️ עריכת אירוע</div>

          <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>סוג האירוע</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
            {[["wedding","💍 חתונה"],["bar_mitzvah","✡️ בר/ת מצווה"],["brit","👶 ברית"],["business","💼 עסקי"],["other","🎉 אחר"]].map(([v,l])=>(
              <button key={v} onClick={()=>setEditEvent(ev=>({...ev,event_type:v}))} style={{background:(editEvent.event_type||"wedding")===v?`linear-gradient(135deg,${C.blueM},${C.blueL})`:C.blueXL,color:(editEvent.event_type||"wedding")===v?"#fff":C.text,border:`2px solid ${(editEvent.event_type||"wedding")===v?"transparent":C.border}`,borderRadius:11,padding:"9px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>

          {[
            ["שם האירוע","name","text",""],
            ["שם החתן","groom_name","text",""],
            ["שם הכלה","bride_name","text",""],
            ["תאריך","date","date",""],
            ["שעה","event_time","time",""],
            ["שם האולם","venue","text","אולם הגן"],
            ["כתובת מלאה (לניווט)","venue_address","text","רחוב הרצל 1, תל אביב"],
          ].map(([label,field,type,ph])=>(
            <div key={field} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>{label}</div>
              {field==="venue"
                ?<VenueInput value={editEvent.venue||""} onChange={v=>setEditEvent(ev=>({...ev,venue:v}))} onPick={v=>setEditEvent(ev=>({...ev,venue:v.name,venue_address:v.address||ev.venue_address}))} placeholder={ph}
                  inputStyle={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                :<input type={type} value={editEvent[field]||""} onChange={e=>setEditEvent(ev=>({...ev,[field]:e.target.value}))} placeholder={ph}
                style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>}
            </div>
          ))}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>טקסט הזמנה</div>
            <textarea value={editEvent.welcome_text||""} onChange={e=>setEditEvent(ev=>({...ev,welcome_text:e.target.value}))} placeholder="אנו שמחים להזמין..."
              style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:70,resize:"vertical"}}/>
          </div>
          <button onClick={()=>updateEvent(editEvent)} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.blueL}44`}}>
            💾 שמור שינויים
          </button>
        </div>
      </div>
    )}
  </div>);
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
export function BottomNav({ active, onChange, userPackages=[], totalGuests=0, trialExpired=false }) {
  // totalGuests = מספר המוזמנים (סכום guest_count): הושבה חינם עד FREE_SEATING_LIMIT
  const items=[
    {id:"home",icon:"🏠",label:"ראשי"},
    {id:"seating",icon:"🪑",label:"הושבה",locked:screenLocked("seating",userPackages,totalGuests)},
    {id:"rsvp",icon:"👥",label:"אורחים"},
    {id:"add",icon:"➕",label:"הוסף"},
    {id:"user_settings",icon:"⚙️",label:"הגדרות"},
  ];
  return(
    <nav aria-label="תפריט ראשי" style={{position:"fixed",bottom:0,right:0,left:0,zIndex:80,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",height:"calc(64px + env(safe-area-inset-bottom))",paddingBottom:"env(safe-area-inset-bottom)",boxSizing:"border-box",boxShadow:"0 -4px 20px rgba(91,60,140,0.08)"}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>{
          if(item.locked){
            alert(`🔒 סידורי הושבה בחינם עד ${FREE_SEATING_LIMIT} מוזמנים. לאירוע גדול יותר: פתיחה חד-פעמית של ₪${BASIC_PRICE}.`);
            onChange("packages");
            return;
          }
          onChange(item.id);
        }}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit",padding:"6px 0",position:"relative",opacity:item.locked?.5:1}}>
          <span style={{fontSize:20,lineHeight:1,filter:active===item.id?"none":"grayscale(1)",opacity:active===item.id?1:.5}}>{item.icon}</span>
          <span style={{fontSize:12,fontWeight:700,color:active===item.id?C.blue:C.muted}}>{item.label}</span>
          {item.locked&&<span style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",fontSize:8,background:"#FEF3C7",color:"#B45309",borderRadius:4,padding:"1px 4px",fontWeight:800}}>🔒</span>}
          {active===item.id&&<div style={{position:"absolute",bottom:0,width:32,height:3,borderRadius:"3px 3px 0 0",background:`linear-gradient(90deg,${C.blueM},${C.blueL})`}}/>}
        </button>
      ))}
    </nav>
  );
}

// ─── EDIT TABLE MODAL ─────────────────────────────────────────────────────────
export function EditTableModal({ table, onSave, onDelete, onClose }) {
  const [name,setName]=useState(table.name);
  const [type,setType]=useState(table.type);
  const [seats,setSeats]=useState(table.seats);
  const [num,setNum]=useState(table.num||"");
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
        <div style={{fontWeight:800,fontSize:18,color:C.text,marginBottom:4}}>✏️ עריכת שולחן</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:18}}>שנה שם, סוג או מספר מקומות</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {Object.entries(TABLE_TYPES).map(([k,v])=>(
            <button key={k} onClick={()=>{setType(k);setSeats(v.defaultSeats);}} style={{background:type===k?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#F6F0FF",border:`2px solid ${type===k?"transparent":C.border}`,borderRadius:14,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .15s"}}>
              <span style={{fontSize:22}}>{v.icon}</span>
              <span style={{fontSize:12,fontWeight:700,color:type===k?"#fff":C.text}}>{v.label}</span>
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <label style={{display:"flex",flexDirection:"column",gap:4,width:90,flexShrink:0}}>
            <span style={{fontSize:12,fontWeight:800,color:C.muted}}>מספר שולחן</span>
            <input type="number" min="1" value={num} onChange={e=>setNum(e.target.value.replace(/\D/g,""))} aria-label="מספר שולחן"
              style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 10px",fontSize:16,fontWeight:900,color:C.blue,textAlign:"center",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </label>
          <label style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
            <span style={{fontSize:12,fontWeight:800,color:C.muted}}>שם השולחן</span>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="שם השולחן..."
              style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </label>
        </div>
        {num&&<div style={{fontSize:12,color:C.muted,marginTop:-6,marginBottom:12}}>אם המספר תפוס בשולחן אחר — השולחנות יחליפו מספרים</div>}

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,background:C.blueXL,borderRadius:12,padding:"10px 14px"}}>
          <span style={{fontSize:14,fontWeight:600,color:C.text,flex:1}}>מספר מקומות</span>
          <button onClick={()=>setSeats(s=>Math.max(1,s-1))} style={{width:32,height:32,borderRadius:8,background:C.surface,border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
          <span style={{fontSize:18,fontWeight:800,color:C.blue,minWidth:32,textAlign:"center"}}>{seats}</span>
          <button onClick={()=>setSeats(s=>s+1)} style={{width:32,height:32,borderRadius:8,background:C.surface,border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onDelete(table.id)} style={{background:"#FEF2F2",color:C.danger,border:`1px solid ${C.danger}30`,borderRadius:12,padding:"12px 18px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑️ מחק</button>
          <button onClick={()=>name.trim()&&onSave(table.id,name,type,seats,parseInt(num,10)||null)} disabled={!name.trim()} style={{flex:1,background:name.trim()?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#F6F0FF",color:name.trim()?"#fff":C.muted,border:"none",borderRadius:12,padding:"12px",fontSize:15,fontWeight:700,cursor:name.trim()?"pointer":"default",fontFamily:"inherit"}}>
            שמור שינויים ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MOBILE SEATING ───────────────────────────────────────────────────────────
// מפת האולם בטלפון: אותם מיקומים שסידרו במחשב, מוקטנים לרוחב המסך. זום בכפתורים, הזזה בגלילה רגילה,
// נגיעה בשולחן פותחת אותו (או מושיבה את האורח שנבחר)
// מפת האולם בטלפון — זום אמיתי: כל המפה (שולחנות, כיתוב, במה) גדלה וקטנה יחד, המיקומים לא זזים ושום דבר לא עולה על משהו אחר.
// בפתיחה כל האולם נכנס למסגרת (ברוחב ובגובה). טלפון שוכב = המפה על כל המסך (ב-MobileSeating).
// הזזה: לחיצה ארוכה על שולחן או על אלמנט ואז גרירה (החלקה רגילה גוללת). עכבר: גרירה רגילה. צביטה בשתי אצבעות = זום
export function MobileHallMap({ tables, items=[], hallBox, picked, onTable, onItem, onMoveTable, onMoveItem, snapTable, lockedIds, maxH="calc(100dvh - 300px)", fitBoth=false }) {
  const boxRef=useRef(null);
  const [size,setSize]=useState({w:340,h:300}),[z,setZ]=useState(1);
  const ZMIN=1,ZMAX=4; // 1 = כל האולם בתוך המסגרת
  const [drag,setDrag]=useState(null); // {key,x,y} — מיקום זמני בזמן גרירה
  const dragRef=useRef(null),pressRef=useRef(null),pinchRef=useRef(null),noClick=useRef(false),sRef=useRef(1),zRef=useRef(1),anchorRef=useRef(null);
  zRef.current=z;
  useEffect(()=>{const el=boxRef.current;if(!el)return;const upd=()=>setSize({w:el.clientWidth,h:el.clientHeight});const ro=new ResizeObserver(upd);ro.observe(el);upd();return()=>ro.disconnect();},[]);
  // זום סביב מרכז המסגרת: שומרים איזו נקודה במפה הייתה באמצע, ואחרי הזום גוללים כך שהיא נשארת באמצע
  const zoomTo=nz=>{const el=boxRef.current;nz=Math.min(ZMAX,Math.max(ZMIN,+nz.toFixed(3)));if(nz===zRef.current)return;
    if(el)anchorRef.current={fx:(el.scrollLeft+el.clientWidth/2)/Math.max(1,el.scrollWidth),fy:(el.scrollTop+el.clientHeight/2)/Math.max(1,el.scrollHeight)};
    setZ(nz);};
  useLayoutEffect(()=>{const el=boxRef.current,a=anchorRef.current;if(!el||!a)return;anchorRef.current=null;
    el.scrollLeft=a.fx*el.scrollWidth-el.clientWidth/2;el.scrollTop=a.fy*el.scrollHeight-el.clientHeight/2;},[z]);
  // what: {kind:"t"|"i", o: השולחן/האלמנט}
  const canMove=what=>!picked&&(what.kind==="t"?!!onMoveTable&&!(lockedIds&&lockedIds.has(what.o.id)):!!onMoveItem&&!what.o.locked);
  const keyOf=what=>what.kind+":"+what.o.id;
  const startDrag=(what,cx,cy)=>{const x=what.o.x||0,y=what.o.y||0;dragRef.current={what,sx:cx,sy:cy,x,y,nx:x,ny:y};setDrag({key:keyOf(what),x,y});try{if(navigator.userActivation?.hasBeenActive!==false)navigator.vibrate?.(15);}catch{}};
  const moveDrag=(cx,cy)=>{const d=dragRef.current;if(!d)return;const S=sRef.current,nx=d.x+(cx-d.sx)/S,ny=d.y+(cy-d.sy)/S;
    const p=d.what.kind==="t"&&snapTable?snapTable(d.what.o,nx,ny):{x:Math.round(nx),y:Math.round(ny)};
    d.nx=p.x;d.ny=p.y;setDrag({key:keyOf(d.what),x:p.x,y:p.y});};
  const endDrag=()=>{const d=dragRef.current;dragRef.current=null;setDrag(null);if(!d)return;noClick.current=true;setTimeout(()=>{noClick.current=false;},350);
    if(d.nx===d.x&&d.ny===d.y)return;
    d.what.kind==="t"?onMoveTable(d.what.o,d.nx,d.ny):onMoveItem(d.what.o,d.nx,d.ny);};
  // מגע: נרשם ישירות (לא דרך React) כדי שאפשר יהיה לעצור את הגלילה בזמן גרירה או צביטה
  useEffect(()=>{const el=boxRef.current;if(!el)return;
    const dist=ts=>Math.hypot(ts[0].clientX-ts[1].clientX,ts[0].clientY-ts[1].clientY);
    const cancelPress=()=>{if(pressRef.current){clearTimeout(pressRef.current.timer);pressRef.current=null;}};
    const ts=e=>{if(e.touches.length===2){cancelPress();if(dragRef.current)endDrag();pinchRef.current={d0:dist(e.touches),z0:zRef.current};}};
    const tm=e=>{
      if(pinchRef.current&&e.touches.length===2){e.preventDefault();const p=pinchRef.current;zoomTo(p.z0*dist(e.touches)/p.d0);return;}
      const tc=e.touches[0];
      if(dragRef.current){e.preventDefault();moveDrag(tc.clientX,tc.clientY);return;}
      const pr=pressRef.current;if(pr&&Math.hypot(tc.clientX-pr.x,tc.clientY-pr.y)>10)cancelPress(); // החלקה = גלילה
    };
    const te=e=>{if(e.touches.length<2)pinchRef.current=null;cancelPress();if(dragRef.current&&!e.touches.length)endDrag();};
    el.addEventListener("touchstart",ts,{passive:true});el.addEventListener("touchmove",tm,{passive:false});
    el.addEventListener("touchend",te);el.addEventListener("touchcancel",te);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",te);el.removeEventListener("touchcancel",te);};
  });
  const onTouch=(what,e)=>{if(!canMove(what)||e.touches.length!==1)return;const tc=e.touches[0];
    const pr={x:tc.clientX,y:tc.clientY,timer:0};pr.timer=setTimeout(()=>{if(pressRef.current===pr){pressRef.current=null;startDrag(what,pr.x,pr.y);}},380);pressRef.current=pr;};
  const onMouse=(what,e)=>{if(e.pointerType!=="mouse"||e.button!==0||!canMove(what))return;const sx=e.clientX,sy=e.clientY;let on=false;
    const mv=me=>{if(!on&&Math.hypot(me.clientX-sx,me.clientY-sy)>4){on=true;startDrag(what,sx,sy);}if(on)moveDrag(me.clientX,me.clientY);};
    const up=()=>{window.removeEventListener("pointermove",mv);window.removeEventListener("pointerup",up);if(on)endDrag();};
    window.addEventListener("pointermove",mv);window.addEventListener("pointerup",up);};
  const tb=t=>t.type==="knight"?[t.x-16,t.y-16,t.x+196,t.y+76]:t.type==="rect"?[t.x-18,t.y-18,t.x+128,t.y+98]:[t.x,t.y,t.x+158,t.y+158];
  const boxes=[...tables.map(t=>tb({...t,x:t.x||0,y:t.y||0})),...items.map(i=>[i.x,i.y,i.x+i.w,i.y+i.h])];
  // הגבולות: האולם כמו במחשב (כולל ההרחבה), ולפחות כל מה שיש בו
  const P=30;let x0=0,y0=0,x1=1000,y1=600;
  if(boxes.length){x0=Math.min(...boxes.map(b=>b[0]))-P;y0=Math.min(...boxes.map(b=>b[1]))-P;x1=Math.max(...boxes.map(b=>b[2]))+P;y1=Math.max(...boxes.map(b=>b[3]))+P;}
  if(hallBox){x0=Math.min(x0,hallBox[0]);y0=Math.min(y0,hallBox[1]);x1=Math.max(x1,hallBox[2]);y1=Math.max(y1,hallBox[3]);}
  const HW=x1-x0,HH=y1-y0;
  // z=1: כל האולם בתוך המסגרת. מכאן רק הזום משתנה — הכל גדל וקטן באותו יחס
  // מסך מלא / טלפון שוכב: כל האולם בתוך המסך (רוחב וגובה). טלפון עומד: ברוחב המסך, והמסגרת בגובה האולם (בלי פס ריק)
  const S=(fitBoth?Math.min(size.w/HW,size.h/HH):size.w/HW)*z;sRef.current=S;
  const mapW=HW*S,mapH=HH*S;
  const pt=(x,y)=>[(x-x0)*S,(y-y0)*S]; // נקודה באולם ← נקודה במסך
  const zoomBtn={width:40,height:40,borderRadius:12,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:20,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 14px -8px rgba(91,60,140,.45)"};
  return(<div style={{position:"relative"}}>
    <div ref={boxRef} style={{overflow:"auto",borderRadius:18,background:"#FFFCFE",border:`1px solid ${C.border}`,...(fitBoth?{height:maxH}:{maxHeight:maxH,height:boxes.length?mapH+2:160}),display:"flex",WebkitOverflowScrolling:"touch"}}>
      {!boxes.length&&<div style={{margin:"auto",textAlign:"center",color:C.muted,fontSize:14,padding:20}}>אין עדיין שולחנות במפה. מוסיפים שולחן בכפתור "+ שולחן".</div>}
      {boxes.length>0&&<div dir="ltr" style={{position:"relative",margin:"auto",flexShrink:0,width:mapW,height:mapH,backgroundImage:"radial-gradient(#E9DDF7 1px,transparent 1px)",backgroundSize:`${40*S}px ${40*S}px`}}>
        {items.map(i0=>{
          const what={kind:"i",o:i0},moving=drag&&drag.key===keyOf(what),i=moving?{...i0,x:drag.x,y:drag.y}:i0;
          const K=HALL_ITEM_KINDS[i.kind]||{},label=i.label||K.label||"";
          const [cx,cy]=pt(i.x+i.w/2,i.y+i.h/2),iw=i.w*S,ih=i.h*S,fs=Math.min(14,Math.max(5,Math.min(ih*.42,iw*.16)));
          return(
          <button key={i.id} type="button" onClick={()=>{if(noClick.current||picked)return;onItem&&onItem(i0);}}
            onTouchStart={e=>onTouch(what,e)} onPointerDown={e=>onMouse(what,e)} onContextMenu={e=>e.preventDefault()}
            aria-label={`${label}${i.locked?", נעול":""}`} tabIndex={picked?-1:0}
            style={{position:"absolute",left:cx-iw/2,top:cy-ih/2,width:iw,height:ih,padding:0,borderRadius:Math.min(ih/2,40*S),cursor:picked?"default":moving?"grabbing":"pointer",
              zIndex:moving?5:0,transform:moving?"scale(1.06)":"none",transition:"transform 120ms ease-out",WebkitTouchCallout:"none",userSelect:"none",fontFamily:"inherit",
              background:i.kind==="dance"?"linear-gradient(135deg,#FFE3EF,#EDE2FF)":i.kind==="stage"?"linear-gradient(135deg,#FCE7F3,#E9DDFF)":"#fff",border:`1px solid ${i.locked?"#C9B6E4":"#EADFF5"}`,
              boxShadow:moving?"0 14px 26px -10px rgba(91,60,140,.55)":"none",
              display:"flex",alignItems:"center",justifyContent:"center",gap:fs*.3,fontSize:fs,fontWeight:800,color:"#4A2C8F",overflow:"hidden",whiteSpace:"nowrap",textAlign:"center",lineHeight:1}}>
            <span aria-hidden="true">{K.icon}</span>{iw>fs*5&&<span dir="rtl" style={{overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>}
            {i.locked&&<span aria-hidden="true" style={{fontSize:fs*.8}}>🔒</span>}
          </button>);})}
        {/* שולחן: הגודל, המסגרת והכיתוב יחסיים לזום — כמו ציור, כך שבשום זום שולחנות לא עולים זה על זה */}
        {tables.map(t0=>{
          const what={kind:"t",o:t0},moving=drag&&drag.key===keyOf(what),t=moving?{...t0,x:drag.x,y:drag.y}:t0;
          const n=(t.guests||[]).length,full=n>=t.seats,dim=picked&&full,round=!t.type||t.type==="round";
          const [bx0,by0,bx1,by1]=tb({...t,x:t.x||0,y:t.y||0}),[cx,cy]=pt((bx0+bx1)/2,(by0+by1)/2);
          const dw=(bx1-bx0)*S*.8,dh=round?dw:(by1-by0)*S*.72,u=Math.min(dw,round?dw:dh*1.25); // u = יחידת גודל לכיתוב
          const tint=tableTint(t,String(t.num||"")),ring=full?C.danger:n===0?"#D9CCEA":tint;
          const nm=String(t.name||"").replace(/^\s*(שולחן\s*)?\d+\s*/,"");
          return(
          <button key={t.id} type="button" onClick={()=>{if(noClick.current)return;!dim&&onTable(t0);}}
            onTouchStart={e=>onTouch(what,e)} onPointerDown={e=>onMouse(what,e)} onContextMenu={e=>e.preventDefault()}
            aria-label={`שולחן ${t.num||""}${nm?" "+nm:""}, ${n} מתוך ${t.seats}${picked?(full?", מלא":", להושבה כאן"):""}`}
            style={{position:"absolute",left:cx-dw/2,top:cy-dh/2,width:dw,height:dh,padding:0,borderRadius:round?"50%":Math.min(14,u*.2),cursor:dim?"not-allowed":moving?"grabbing":"pointer",opacity:dim?.35:1,
              zIndex:moving?5:1,transform:moving?"scale(1.1)":"none",transition:"transform 120ms ease-out",WebkitTouchCallout:"none",userSelect:"none",
              background:picked&&!full?"#FFF0F7":"#fff",border:`${Math.max(1.5,u*.05)}px solid ${ring}`,boxShadow:moving?`0 16px 28px -10px rgba(91,60,140,.6)`:picked&&!full?`0 0 0 ${Math.max(2,u*.06)}px ${C.blueM}33`:"0 4px 10px -6px rgba(91,60,140,.45)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",lineHeight:1.05,fontFamily:"inherit"}}>
            <b style={{fontSize:u*.3,color:C.text}}>{t.num||""}</b>
            <span style={{fontSize:u*.19,fontWeight:700,color:full?C.danger:"#5F5675",fontVariantNumeric:"tabular-nums"}}>{n}/{t.seats}</span>
            {lockedIds&&lockedIds.has(t.id)&&<span aria-hidden="true" style={{position:"absolute",top:-u*.08,left:-u*.08,fontSize:u*.18}}>🔒</span>}
            {nm&&<span dir="rtl" style={{position:"absolute",top:"100%",marginTop:u*.04,maxWidth:dw*1.35,fontSize:u*.17,fontWeight:700,color:"#4A4060",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",background:"rgba(255,252,254,.9)",borderRadius:4,padding:`0 ${u*.04}px`}}>{nm}</span>}
          </button>);})}
      </div>}
    </div>
    <div style={{position:"absolute",left:10,bottom:10,display:"flex",flexDirection:"column",gap:6}}>
      <button type="button" onClick={()=>zoomTo(z*1.35)} aria-label="הגדלת המפה" disabled={z>=ZMAX} style={{...zoomBtn,opacity:z>=ZMAX?.45:1}}>+</button>
      <button type="button" onClick={()=>zoomTo(z/1.35)} aria-label="הקטנת המפה" disabled={z<=ZMIN} style={{...zoomBtn,opacity:z<=ZMIN?.45:1}}>−</button>
    </div>
  </div>);
}

// סרגל המפה בטלפון: הוספת שולחן, הוספה לאולם, כלים (כמו במחשב) ומסך מלא. התפריטים נפתחים כגיליון מלמטה
export function MobileMapBar({ tools, onAddTable, onPrint, onPrintCards, onTemplates, full, onEnterFull, onExitFull, compact=false }) {
  const [open,setOpen]=useState(null); // "add" | "tools" | null
  const T=tools||{},locked=!!T.locked;
  // במסך מלא הסרגל נמוך יותר, כדי שלמפה יישאר כמה שיותר מקום
  const chip={display:"inline-flex",alignItems:"center",gap:5,height:compact?32:38,padding:compact?"0 11px":"0 13px",borderRadius:100,border:"1.5px solid #E9DDF7",background:"#fff",color:"#4A2C8F",fontSize:compact?13:13.5,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0};
  const prim={...chip,border:"none",background:GRAD,color:"#fff"};
  const row={display:"flex",alignItems:"center",gap:12,width:"100%",background:"none",border:"none",borderRadius:12,padding:"11px 10px",fontFamily:"inherit",textAlign:"right",cursor:"pointer",color:"#2B1D3F"};
  const go=fn=>()=>{setOpen(null);fn&&fn();};
  const ex=T.extra||{w:0,h:0};
  const sizeBtn=dis=>({width:38,height:38,borderRadius:10,border:"none",background:dis?"#F7F4FA":"#F4EEFC",color:C.blue,fontSize:20,fontWeight:900,cursor:dis?"default":"pointer",opacity:dis?.4:1,fontFamily:"inherit"});
  return(<>
    <div role="toolbar" aria-label="כלי המפה" style={{display:"flex",gap:compact?6:8,overflowX:"auto",padding:compact?"0 0 6px":"2px 0 10px",scrollbarWidth:"none"}}>
      <button type="button" style={prim} onClick={onAddTable}>+ שולחן</button>
      <button type="button" style={{...chip,opacity:locked?.5:1}} disabled={locked} onClick={()=>setOpen("add")} aria-haspopup="dialog">➕ הוסף לאולם</button>
      <button type="button" style={chip} onClick={()=>setOpen("tools")} aria-haspopup="dialog">🛠 כלים{locked?" · 🔒":""}</button>
      {full
        ?<button type="button" style={chip} onClick={onExitFull}>✕ יציאה</button>
        :<button type="button" style={chip} onClick={onEnterFull}>⛶ מסך מלא</button>}
    </div>
    {open&&<div onClick={()=>setOpen(null)} style={{position:"fixed",inset:0,background:"rgba(43,29,63,.35)",zIndex:1100,display:"flex",alignItems:"flex-end"}}>
      <div role="dialog" aria-modal="true" aria-label={open==="add"?"הוספה לאולם":"כלי המפה"} onClick={e=>e.stopPropagation()}
        style={{background:"#fff",width:"100%",borderRadius:"22px 22px 0 0",padding:"10px 14px calc(16px + env(safe-area-inset-bottom))",maxHeight:"78dvh",overflowY:"auto",direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
        <div aria-hidden="true" style={{width:44,height:5,borderRadius:9,background:"#E4DAF0",margin:"0 auto 10px"}}/>
        {open==="add"&&<>
          <div style={{fontSize:16,fontWeight:900,color:"#2B1D3F",margin:"0 6px 8px"}}>➕ הוספה לאולם</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {Object.entries(HALL_ITEM_KINDS).map(([k,K])=>(
              <button key={k} type="button" onClick={go(()=>T.addItem&&T.addItem(k))} style={{...row,background:"#FBF8FE",fontSize:14,fontWeight:800}}>
                <span aria-hidden="true" style={{fontSize:20}}>{K.icon}</span>{K.label}
              </button>))}
          </div>
        </>}
        {open==="tools"&&<>
          <div style={{fontSize:16,fontWeight:900,color:"#2B1D3F",margin:"0 6px 6px"}}>🛠 כלי המפה</div>
          {[
            ["✨","סידור מושלם","שולחנות בשורות ישרות מסביב לבמה ולרחבה",T.perfect,locked],
            ["📐","יישור","מיישר לשורות, קרוב למקום שבו הנחתם",T.align,locked],
            [T.grid?"▦":"▢",T.grid?"ריבועים: פעיל":"ריבועים: כבוי",T.grid?"שולחן נכנס למרכז ריבוע. לחיצה: גרירה חופשית":"גרירה חופשית. לחיצה: ריבועים",T.toggleGrid,false],
            ["🏛️","תבניות אולם","אולם מוכן, או אולם ששמרתם",onTemplates,locked],
            ["🖨️","הדפסת סידור ההושבה","רשימת השולחנות והיושבים",onPrint,false],
            ["🔢","כרטיסי שולחן","מספר גדול לכל שולחן",onPrintCards&&(()=>onPrintCards("tables")),false],
            ["🏷️","כרטיסי שם","כרטיס לכל אורח עם מספר השולחן",onPrintCards&&(()=>onPrintCards("names")),false],
            [locked?"🔓":"🔒",locked?"שחרור המפה":"נעילת המפה",locked?"אפשר שוב להזיז שולחנות ואלמנטים":"שולחנות ואלמנטים לא יזוזו (אורחים כן)",T.toggleLock,false],
          ].filter(r=>r[3]).map(([ic,l,d,fn,dis])=>(
            <button key={l} type="button" disabled={dis} onClick={go(fn)} style={{...row,opacity:dis?.45:1,cursor:dis?"not-allowed":"pointer"}}>
              <span aria-hidden="true" style={{fontSize:20,width:26,textAlign:"center"}}>{ic}</span>
              <span style={{display:"flex",flexDirection:"column",gap:1,minWidth:0}}><b style={{fontSize:14.5}}>{l}</b><small style={{fontSize:12.5,color:"#6E6585",fontWeight:500}}>{d}</small></span>
            </button>))}
          {/* גודל האולם: עוד שורות/עמודות של ריבועים ריקים — אותו גודל גם במפה במחשב */}
          {T.setExtra&&!locked&&<div style={{margin:"8px 6px 0",padding:"12px",background:"#FBF8FE",borderRadius:14}}>
            <div style={{fontSize:14,fontWeight:900,color:"#2B1D3F",marginBottom:8}}>↔ גודל האולם</div>
            {[["w","רוחב"],["h","אורך"]].map(([k,l])=>{const n=ex[k]||0;return(
              <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <span style={{flex:1,fontSize:14,fontWeight:700,color:"#4A4060"}}>{l}{n?` (+${n})`:""}</span>
                <button type="button" aria-label={`הקטנת ${l} האולם`} disabled={n<=0} onClick={()=>T.setExtra(k,Math.max(0,n-2))} style={sizeBtn(n<=0)}>−</button>
                <button type="button" aria-label={`הגדלת ${l} האולם`} disabled={n>=16} onClick={()=>T.setExtra(k,Math.min(16,n+2))} style={sizeBtn(n>=16)}>+</button>
              </div>);})}
          </div>}
          <button type="button" onClick={()=>setOpen(null)} style={{width:"100%",marginTop:12,background:"#F4EEFC",color:"#3A2464",border:"none",borderRadius:14,padding:"12px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>סגירה</button>
        </>}
      </div>
    </div>}
  </>);
}

// מפת האולם בטלפון (לשונית "מפה"). false = מסתיר אותה (נשארות רשימת האורחים והשולחנות)
export const PHONE_MAP=true;
export function MobileSeating({ tables, items=[], hallBox, mapTools, onMoveTable, snapTable, lockedIds, guests, declined=[], search, setSearch, newGuest, setNewGuest, addGuest, dropOnTable, removeFromTable, onAddTable, onEditTable, onDeleteTable, onEditGuest, onPrint, onPrintCards, onTemplates }) {
  const [tab,setTab]=useState("tables"),[picked,setPicked]=useState(null),[expanded,setExpanded]=useState(null),[editTable,setEditTable]=useState(null),[showDeclined,setShowDeclined]=useState(false);
  const [sheet,setSheet]=useState(null); // שולחן שנפתח מהמפה
  const [itemSheet,setItemSheet]=useState(null),[mapFull,setMapFull]=useState(false); // אלמנט באולם שנפתח מהמפה · מפה על כל המסך
  const itemT=itemSheet&&items.find(i=>i.id===itemSheet);
  // טלפון שוכב (מסך נמוך לרוחב): המפה נפתחת על כל המסך, בלי הכותרת והלשוניות שתופסות את רוב הגובה
  const lsQ="(orientation: landscape) and (max-height: 560px)";
  const [land,setLand]=useState(()=>{try{return window.matchMedia(lsQ).matches;}catch{return false;}});
  useEffect(()=>{let mq;try{mq=window.matchMedia(lsQ);}catch{return;}const f=()=>setLand(mq.matches);mq.addEventListener?.("change",f);window.addEventListener("resize",f);return()=>{mq.removeEventListener?.("change",f);window.removeEventListener("resize",f);};},[]);
  const full=mapFull||(land&&tab==="map");
  // "מסך מלא": מנסים להעביר את הטלפון למסך מלא אמיתי ולנעול לרוחב (אנדרואיד). באייפון אי אפשר לנעול מהאתר —
  // אז מופיעה בקשה לסובב את הטלפון, וברגע שהוא שוכב המפה מתפרסת על כל המסך
  const enterFull=async()=>{setMapFull(true);
    try{const d=document.documentElement;if(d.requestFullscreen&&!document.fullscreenElement)await d.requestFullscreen({navigationUI:"hide"});}catch{}
    try{await screen.orientation?.lock?.("landscape");}catch{}};
  const exitFull=()=>{setMapFull(false);try{screen.orientation?.unlock?.();}catch{}try{if(document.fullscreenElement)document.exitFullscreen?.();}catch{}
    if(land&&!mapFull)setTab("tables");}; // טלפון שוכב בלי "מסך מלא": יציאה = חזרה לרשימת השולחנות
  useEffect(()=>{if(tab!=="map"&&mapFull)exitFull();},[tab]);
  useEffect(()=>{if(!mapFull)return;const k=e=>{if(e.key==="Escape")exitFull();};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);},[mapFull]);
  // אחרי הזזה בטלפון: הודעה קצרה שהשינוי נשמר ויופיע גם במחשב
  const [savedTip,setSavedTip]=useState(false);const tipT=useRef(0);
  const flashSaved=()=>{setSavedTip(true);clearTimeout(tipT.current);tipT.current=setTimeout(()=>setSavedTip(false),2200);};
  const moveTableP=onMoveTable&&((t,x,y)=>{onMoveTable(t,x,y);flashSaved();});
  const moveItemP=mapTools?.moveItem&&((i,x,y)=>{mapTools.moveItem(i,x,y);flashSaved();});
  const lastSeat=useRef("tables"); // בחירת אורח מחזירה לתצוגה האחרונה: רשימת שולחנות או מפה
  useEffect(()=>{if(tab!=="guests")lastSeat.current=tab;},[tab]);
  const sheetT=sheet&&tables.find(t=>t.id===sheet);
  // מושיבים את האורח שנבחר. מהמפה — נשארים במפה כדי לראות אותו יושב
  const assign=async tableId=>{if(!picked)return;await dropOnTable(tableId,picked.id,picked.table_id||null);setPicked(null);if(tab!=="map")setTab("guests");};
  return(<div style={{display:"flex",flexDirection:"column",flex:1,background:C.bg}}>
    {picked&&<div style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,fontSize:14,flexShrink:0}}>
      <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ini(picked.name)}</div>
      <span style={{flex:1,fontWeight:700}}>{picked.name}  -  בחר שולחן</span>
      <button onClick={()=>setPicked(null)} style={{background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>ביטול</button>
    </div>}

    <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
      {[["guests",`👥 אורחים (${guests.length})`],["tables",`🪑 שולחנות (${tables.length})`],...(PHONE_MAP?[["map","🗺️ מפה"]]:[])].map(([v,l])=>(
        <button key={v} onClick={()=>setTab(v)} aria-pressed={tab===v} style={{flex:1,padding:"14px 0",border:"none",borderBottom:`3px solid ${tab===v?C.blueL:"transparent"}`,background:"none",color:tab===v?C.blue:C.muted,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
      ))}
    </div>

    <div style={{flex:1,overflowY:"auto",padding:16}}>
      {tab==="guests"&&<>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש אורח..." style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>
        {guests.length===0
          ?<div style={{textAlign:"center",padding:"50px 0"}}><div style={{fontSize:52}}>🎉</div><p style={{color:C.success,fontWeight:700,marginTop:10,fontSize:16}}>כולם מוסבים!</p></div>
          :guests.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())).map(g=>(
            <Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",marginBottom:8,border:`1.5px solid ${picked?.id===g.id?C.blueL:C.border}`,background:picked?.id===g.id?C.blueXL:C.surface}}>
              <div onClick={()=>{setPicked(g);setTab(lastSeat.current);}} style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0,cursor:"pointer"}}>{ini(g.name)}</div>
              <div onClick={()=>{setPicked(g);setTab(lastSeat.current);}} style={{flex:1,cursor:"pointer",minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text}}>{g.name}</div>
                {g.phone&&<div style={{fontSize:12,color:C.muted}}>{g.phone}</div>}
              </div>
              <RsvpBadge rsvp={g.rsvp}/>
              <button onClick={e=>{e.stopPropagation();onEditGuest(g);}} style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:9,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,flexShrink:0}}>✏️</button>
            </Card>
          ))
        }
        {/* מי שסימן "לא מגיע": מקופל כברירת מחדל, ואפשר עדיין לבחור ולהושיב אם התוכניות השתנו */}
        {declined.length>0&&<div style={{marginTop:14}}>
          <button onClick={()=>setShowDeclined(o=>!o)} aria-expanded={showDeclined}
            style={{width:"100%",display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:800,color:"#4A4060"}}>
            לא מגיעים <span style={{background:"#FDECEC",color:"#B42318",borderRadius:100,padding:"1px 9px",fontSize:12}}>{declined.length}</span>
            <span style={{marginRight:"auto",fontSize:12,color:"#5F5675"}}>{showDeclined?"הסתרה ▲":"הצגה ▼"}</span>
          </button>
          {showDeclined&&<>
            <div style={{fontSize:13,color:"#5F5675",margin:"8px 4px"}}>סימנו שלא מגיעים, ולכן לא נספרים להושבה. אם התוכניות השתנו — בוחרים אורח ושולחן.</div>
            {declined.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())).map(g=>(
              <Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",marginBottom:8,opacity:.8,border:`1.5px solid ${picked?.id===g.id?C.blueL:C.border}`,background:picked?.id===g.id?C.blueXL:"#FBFAFC"}}>
                <div onClick={()=>{setPicked(g);setTab(lastSeat.current);}} style={{width:38,height:38,borderRadius:"50%",background:"#B9B0C8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0,cursor:"pointer"}}>{ini(g.name)}</div>
                <div onClick={()=>{setPicked(g);setTab(lastSeat.current);}} style={{flex:1,cursor:"pointer",minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,color:C.text}}>{g.name}</div>
                  {g.phone&&<div style={{fontSize:12,color:"#5F5675"}}>{g.phone}</div>}
                </div>
                <RsvpBadge rsvp={g.rsvp}/>
                <button onClick={e=>{e.stopPropagation();onEditGuest(g);}} style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:9,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,flexShrink:0}}>✏️</button>
              </Card>
            ))}
          </>}
        </div>}
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <input value={newGuest} onChange={e=>setNewGuest(e.target.value)} placeholder="+ הוסף אורח חדש" onKeyDown={e=>e.key==="Enter"&&addGuest()} style={{flex:1,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={addGuest} style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"12px 20px",fontSize:20,fontWeight:700,cursor:"pointer"}}>+</button>
        </div>
      </>}

      {PHONE_MAP&&tab==="map"&&<div style={full?{position:"fixed",inset:0,zIndex:900,background:C.bg,padding:`calc(${land?6:10}px + env(safe-area-inset-top)) calc(8px + env(safe-area-inset-right)) calc(${land?6:10}px + env(safe-area-inset-bottom)) calc(8px + env(safe-area-inset-left))`,display:"flex",flexDirection:"column"}:undefined}>
        {picked&&full&&<div style={{background:GRAD,color:"#fff",borderRadius:12,padding:"7px 12px",marginBottom:6,fontSize:14,fontWeight:800,display:"flex",alignItems:"center",gap:8}}>
          <span style={{flex:1}}>{picked.name}: בחרו שולחן</span><button type="button" onClick={()=>setPicked(null)} style={{background:"rgba(255,255,255,.22)",border:"none",color:"#fff",borderRadius:8,padding:"5px 10px",fontWeight:800,fontFamily:"inherit",cursor:"pointer"}}>ביטול</button></div>}
        {!picked&&<MobileMapBar tools={mapTools} onAddTable={onAddTable} onPrint={onPrint} onPrintCards={onPrintCards} onTemplates={onTemplates} full={full} onEnterFull={enterFull} onExitFull={exitFull} compact={full}/>}
        {/* מסך מלא כשהטלפון עדיין עומד (אייפון): בקשה לסובב */}
        {full&&!land&&<div role="status" style={{display:"flex",alignItems:"center",gap:10,background:"#F4EEFC",color:"#3A2464",borderRadius:14,padding:"10px 12px",marginBottom:8,fontSize:14,fontWeight:800}}>
          <span aria-hidden="true" style={{fontSize:24,display:"inline-block",transform:"rotate(90deg)"}}>📱</span>סובבו את הטלפון לרוחב — המפה תתפרס על כל המסך בגדול</div>}
        {!picked&&!full&&<div style={{fontSize:13,color:"#5F5675",marginBottom:10,lineHeight:1.5}}>📱 "מסך מלא" או סיבוב הטלפון לרוחב — המפה על כל המסך. נגיעה בשולחן: מי יושב בו. לחיצה ארוכה וגרירה: הזזה. שתי אצבעות: זום.</div>}
        <MobileHallMap tables={tables} items={items} hallBox={full?null:hallBox} picked={picked} onTable={t=>picked?assign(t.id):setSheet(t.id)} onItem={i=>setItemSheet(i.id)}
          onMoveTable={moveTableP} onMoveItem={moveItemP} snapTable={snapTable} lockedIds={lockedIds}
          fitBoth={full} maxH={full?`calc(100dvh - ${(picked?44:38)+(land?12:20)+(!land?52:0)}px - env(safe-area-inset-top) - env(safe-area-inset-bottom))`:"calc(100dvh - 330px)"}/>
        {savedTip&&<div role="status" style={{position:"fixed",left:"50%",bottom:"calc(18px + env(safe-area-inset-bottom))",transform:"translateX(-50%)",zIndex:1200,background:"#2B1D3F",color:"#fff",borderRadius:100,padding:"9px 16px",fontSize:13.5,fontWeight:800,boxShadow:"0 12px 24px -12px rgba(43,29,63,.6)",whiteSpace:"nowrap"}}>✓ נשמר · מופיע גם במחשב</div>}
      </div>}

      {tab==="tables"&&<>
        {/* בזמן שבוחרים שולחן לאורח: רק השולחנות, בלי כפתורי הניהול שדוחפים אותם למטה */}
        {!picked&&<>
        <button onClick={onAddTable} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 14px ${C.blueL}44`}}>
          ➕ הוסף שולחן חדש
        </button>
        {onPrint&&tables.length>0&&<button onClick={onPrint} style={{width:"100%",background:C.surface,color:C.blue,border:`2px solid ${C.blueL}`,borderRadius:14,padding:"12px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>
          🖨️ הדפס סידור הושבה
        </button>}
        {onPrintCards&&tables.length>0&&<div style={{display:"flex",gap:8,marginTop:-6,marginBottom:14}}>
          {[["tables","🔢 כרטיסי שולחן"],["names","🏷️ כרטיסי שם"]].map(([k,l])=>(
            <button key={k} onClick={()=>onPrintCards(k)} style={{flex:1,background:C.surface,color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>}
        {onTemplates&&<button onClick={onTemplates} style={{width:"100%",background:C.surface,color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>🏛️ תבניות אולם (שמירה וטעינה)</button>}
        </>}

        {tables.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:48}}>🪑</div><p style={{color:C.muted,fontSize:14,marginTop:8}}>אין עדיין שולחנות</p></div>}

        {tables.map((t)=>{
          const sc=sColor(t),exp=expanded===t.id,isFull=(t.guests||[]).length>=t.seats;
          return(
            <Card key={t.id} style={{marginBottom:12,overflow:"hidden",border:`1.5px solid ${picked&&!isFull?C.blueL:C.border}`,opacity:picked&&isFull?.4:1}}>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div onClick={()=>picked?(!isFull&&assign(t.id)):setExpanded(exp?null:t.id)} style={{display:"flex",alignItems:"center",gap:12,flex:1,cursor:picked&&isFull?"not-allowed":"pointer",background:picked&&!isFull?C.blueXL:"none",margin:"-14px -16px",padding:"14px 16px"}}>
                  <div title="מספר שולחן" style={{width:46,height:46,borderRadius:13,background:GRAD,color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>
                    <span style={{fontSize:20,fontWeight:900}}>{t.num||""}</span><span style={{fontSize:12}}>{TABLE_TYPES[t.type]?.icon}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:15,color:C.text}}>{String(t.name||"").replace(/^\s*\d+\s*/,"")||`שולחן ${t.num}`}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{TABLE_TYPES[t.type]?.label} · {t.seats-(t.guests||[]).length} פנויים</div>
                  </div>
                  {picked
                    ?isFull?<span style={{fontSize:12,color:C.danger,fontWeight:700}}>מלא</span>:<span style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",borderRadius:10,padding:"6px 14px",fontSize:13,fontWeight:700}}>שבץ +</span>
                    :<div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:900,color:sc}}>{(t.guests||[]).length}</div><div style={{fontSize:12,color:C.muted}}>מתוך {t.seats}</div></div>
                  }
                </div>
                {!picked&&<button onClick={e=>{e.stopPropagation();setEditTable(t);}} style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:15,flexShrink:0}}>✏️</button>}
              </div>
              <div style={{height:4,background:C.blueXL}}><div style={{height:"100%",width:`${pct(t)}%`,background:sc,transition:"width .3s"}}/></div>
              {exp&&!picked&&<div style={{padding:"10px 16px"}}>
                {(t.guests||[]).length===0
                  ?<p style={{fontSize:13,color:C.muted,textAlign:"center",padding:"6px 0"}}>אין אורחים בשולחן</p>
                  :(t.guests||[]).map(g=>(
                    <div key={g.id} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                      <span style={{flex:1,fontSize:14,color:C.text}}>{g.name}</span>
                      <button onClick={()=>removeFromTable(t.id,g)} style={{background:"#FEF2F2",border:"none",color:C.danger,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",padding:"4px 10px",borderRadius:8}}>הסר</button>
                    </div>
                  ))
                }
              </div>}
            </Card>
          );
        })}
      </>}
    </div>

    {/* כרטיס אלמנט באולם (במה, בר...) שנפתח מהמפה: שינוי שם, נעילה, מחיקה */}
    {itemT&&<div onClick={()=>setItemSheet(null)} style={{position:"fixed",inset:0,background:"rgba(43,29,63,.35)",zIndex:1000,display:"flex",alignItems:"flex-end"}}>
      <div role="dialog" aria-modal="true" aria-label={itemT.label||HALL_ITEM_KINDS[itemT.kind]?.label} onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",borderRadius:"22px 22px 0 0",padding:"10px 18px calc(18px + env(safe-area-inset-bottom))",direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
        <div aria-hidden="true" style={{width:44,height:5,borderRadius:9,background:"#E4DAF0",margin:"0 auto 12px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <span aria-hidden="true" style={{fontSize:26}}>{HALL_ITEM_KINDS[itemT.kind]?.icon}</span>
          <div style={{flex:1,fontWeight:900,fontSize:17,color:C.text}}>{itemT.label||HALL_ITEM_KINDS[itemT.kind]?.label}{itemT.locked?" 🔒":""}</div>
        </div>
        <div style={{fontSize:13,color:"#5F5675",marginBottom:12}}>להזזה: לחיצה ארוכה על האלמנט במפה וגרירה.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["✏️","שינוי שם",()=>mapTools?.renameItem(itemT.id),false],[itemT.locked?"🔓":"🔒",itemT.locked?"שחרור":"נעילה",()=>mapTools?.toggleItemLock(itemT.id),false],["🗑","מחיקה",()=>{mapTools?.deleteItem(itemT.id);setItemSheet(null);},itemT.locked]].map(([ic,l,fn,dis])=>(
            <button key={l} type="button" disabled={dis} onClick={fn} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 6px",borderRadius:14,border:`1.5px solid ${l==="מחיקה"?"#FAD4DA":C.border}`,background:l==="מחיקה"?"#FFF5F6":"#fff",color:l==="מחיקה"?C.danger:C.blue,fontSize:14,fontWeight:800,cursor:dis?"not-allowed":"pointer",opacity:dis?.45:1,fontFamily:"inherit"}}>
              <span aria-hidden="true" style={{fontSize:20}}>{ic}</span>{l}</button>))}
        </div>
        <button type="button" onClick={()=>setItemSheet(null)} style={{width:"100%",marginTop:12,background:"#F4EEFC",color:"#3A2464",border:"none",borderRadius:14,padding:"12px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>סגירה</button>
      </div>
    </div>}

    {/* כרטיס שולחן שנפתח מהמפה: מי יושב, הוצאה מהשולחן ועריכה */}
    {sheetT&&!picked&&<div onClick={()=>setSheet(null)} style={{position:"fixed",inset:0,background:"rgba(43,29,63,.35)",zIndex:1000,display:"flex",alignItems:"flex-end"}}>
      <div role="dialog" aria-modal="true" aria-label={`שולחן ${sheetT.num||""}`} onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",borderRadius:"22px 22px 0 0",padding:"10px 18px calc(18px + env(safe-area-inset-bottom))",maxHeight:"70dvh",overflowY:"auto",direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
        <div aria-hidden="true" style={{width:44,height:5,borderRadius:9,background:"#E4DAF0",margin:"0 auto 12px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:46,height:46,borderRadius:13,background:GRAD,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,flexShrink:0}}>{sheetT.num||""}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:800,fontSize:16,color:C.text}}>{String(sheetT.name||"").replace(/^\s*\d+\s*/,"")||`שולחן ${sheetT.num}`}</div>
            <div style={{fontSize:13,color:"#5F5675"}}>{(sheetT.guests||[]).length} מתוך {sheetT.seats} · {Math.max(0,sheetT.seats-(sheetT.guests||[]).length)} פנויים</div>
          </div>
          <button onClick={()=>{setEditTable(sheetT);setSheet(null);}} aria-label="עריכת השולחן" style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:10,width:38,height:38,cursor:"pointer",fontSize:15}}>✏️</button>
        </div>
        {(sheetT.guests||[]).length===0
          ?<p style={{fontSize:14,color:"#5F5675",textAlign:"center",padding:"14px 0"}}>אין עדיין אורחים בשולחן</p>
          :(sheetT.guests||[]).map(g=>(
            <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{width:30,height:30,borderRadius:"50%",background:RELATION_COLORS[g.relation]||C.blueL,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,flexShrink:0}}>{ini(g.name)}</span>
              <span style={{flex:1,fontSize:14,color:C.text,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}{(g.guest_count||1)>1?` (${g.guest_count})`:""}</span>
              <button onClick={()=>removeFromTable(sheetT.id,g)} style={{background:"#FEF2F2",border:"none",color:C.danger,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",padding:"6px 12px",borderRadius:9}}>הוצאה</button>
            </div>
          ))}
        <button onClick={()=>{setSheet(null);setTab("guests");}} style={{width:"100%",marginTop:14,background:GRAD,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>➕ הושבת אורח</button>
      </div>
    </div>}

    {editTable&&<EditTableModal table={editTable} onClose={()=>setEditTable(null)}
      onSave={async(id,name,type,seats)=>{await onEditTable(id,name,type,seats);setEditTable(null);}}
      onDelete={async(id)=>{await onDeleteTable(id);setEditTable(null);}}
    />}
  </div>);
}

// ─── SEATING APP ──────────────────────────────────────────────────────────────
// ─── התראות Push במכשיר הנוכחי (public/sw.js + push_subscriptions + push-notify) ───
export const RATE_CSS=`
.rt{background:linear-gradient(135deg,#FFF8E6 0%,#FFF1F6 100%);border:1.5px solid #F3E3C8;border-radius:28px;padding:20px 22px;box-shadow:0 22px 44px -26px rgba(91,60,140,.5);direction:rtl;font-family:'Heebo',sans-serif}
.rt h3{margin:0;font-family:'Fredoka','Heebo',sans-serif;font-size:19px;font-weight:700;color:#2B1D3F}
.rt .sub{margin:4px 0 12px;font-size:13.5px;line-height:1.55;color:#3A2F50;font-weight:600}
.rt textarea,.rt input{width:100%;box-sizing:border-box;border:1.5px solid #EADBC4;border-radius:16px;background:#fff;padding:11px 14px;font-size:14px;font-family:inherit;color:#2B1D3F;outline:none}
.rt textarea{min-height:84px;resize:vertical;margin:10px 0 8px}
.rt textarea:focus,.rt input:focus{border-color:#9B6BFF;box-shadow:0 0 0 4px rgba(155,107,255,.16)}
.rt .note{font-size:12px;color:#5E5470;margin:8px 0 12px;line-height:1.5}
.rt .btn{min-height:46px;border:none;border-radius:100px;padding:0 22px;font-family:'Fredoka','Heebo',sans-serif;font-size:15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
.rt .btn.p{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF);color:#fff}
.rt .btn.g{background:#fff;color:#1a73e8;box-shadow:inset 0 0 0 1.5px #D2E3FC}
.rt .btn:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
.rt .done{display:flex;align-items:center;gap:10px;background:#fff;border-radius:18px;padding:10px 14px;font-size:14px;font-weight:700;color:#1F7A4D;margin:10px 0}
.rt .steps{display:grid;gap:8px;margin:4px 0 12px}
.rt .steps div{display:flex;gap:10px;align-items:center;font-size:13.5px;font-weight:600;color:#3A2F50}
.rt .steps b{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:#fff;color:#B4471F;display:inline-flex;align-items:center;justify-content:center;font-size:12px;box-shadow:inset 0 0 0 1.5px #F3D9C4}
.rt .err{font-size:13px;color:#B42318;font-weight:700;margin-bottom:8px}
`;
export function TestimonialCard({ user, event, style }) {
  const [mine,setMine]=useState(null),[rating,setRating]=useState(5),[text,setText]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[copied,setCopied]=useState(false);
  const defName=event.groom_name&&event.bride_name?`${event.groom_name} ו${event.bride_name}`:(event.groom_name||"");
  const [name,setName]=useState(defName);
  useEffect(()=>{sb.from("testimonials").select("id,approved,text,rating").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).then(({data})=>setMine(data?.[0]||false),()=>setMine(false));},[user.id]);
  const send=async()=>{
    if(text.trim().length<10){setMsg("כתבו לפחות משפט אחד 🙂");return;}
    setBusy(true);setMsg("");
    const label={wedding:"חתונה",bar_mitzvah:"בר/ת מצווה",brit:"ברית",business:"אירוע עסקי"}[event.event_type]||"אירוע";
    const row={name:(name.trim()||"לקוח/ה").slice(0,60),event_label:label,text:text.trim().slice(0,600),rating};
    const{error}=await sb.from("testimonials").insert(row);
    setBusy(false);
    if(error){setMsg("הדירוג לא נשמר: "+error.message);return;}
    setMine({approved:false,text:row.text,rating});
  };
  // לגוגל: מעתיקים את אותו טקסט ופותחים את חלון הביקורת (גוגל לא מאפשר לפרסם בשם המשתמש)
  const toGoogle=()=>{
    const t=mine?.text||"";
    const open=()=>window.open(GOOGLE_REVIEW_URL,"_blank","noopener,noreferrer");
    if(t&&navigator.clipboard){navigator.clipboard.writeText(t).then(()=>{setCopied(true);open();},open);}else open();
  };
  if(mine===null)return null;
  const r=mine?.rating||rating;
  return(
    <div className="rt" style={style}>
      <style>{RATE_CSS}</style>
      <h3>⭐ דרגו אותנו</h3>
      {mine?<>
        <div className="done">✓ {mine.approved?"הדירוג שלכם מופיע באתר שלנו. תודה! 💜":"הדירוג נשמר באתר שלנו, ויופיע אחרי אישור. תודה! 💜"}</div>
        <div className="sub">נשמח שיופיע גם בגוגל, כדי שזוגות אחרים יראו אותו:</div>
        <div className="steps">
          <div><b>1</b>{copied?"הטקסט הועתק ✓":"נעתיק לכם את מה שכתבתם"}</div>
          <div><b>2</b>בגוגל בוחרים {r} כוכבים ומדביקים את הטקסט</div>
        </div>
        <button type="button" className="btn g" onClick={toGoogle}><span style={{color:"#F4B400"}} aria-hidden="true">★</span> {copied?"פתיחת גוגל שוב":"פרסום אותו דירוג בגוגל"}</button>
      </>:<>
        <div className="sub">כותבים פעם אחת: הדירוג נשמר כאן באתר, ומשם בלחיצה מפרסמים אותו גם בגוגל.</div>
        <Stars value={rating} onChange={setRating} size={30}/>
        <textarea value={text} onChange={e=>setText(e.target.value)} maxLength={600} placeholder="מה הכי עזר לכם? (למשל: ההושבה האוטומטית חסכה לנו ערב שלם...)" aria-label="חוות הדעת"/>
        <input value={name} onChange={e=>setName(e.target.value)} maxLength={60} placeholder="השם שיופיע (למשל: נועה ואיתי)" aria-label="שם להצגה"/>
        <div className="note">בשליחה אתם מסכימים שנפרסם את חוות הדעת באתר עם השם שבחרתם. אפשר לבקש להסיר אותה בכל עת.</div>
        {msg&&<div role="alert" className="err">{msg}</div>}
        <button type="button" className="btn p" onClick={send} disabled={busy}>{busy?"שומר...":"שליחת הדירוג"}</button>
      </>}
    </div>
  );
}
// אדמין: אישור, הסתרה, מחיקה והוספה ידנית של המלצות אמיתיות
export function AdminTestimonials({ card }) {
  const [list,setList]=useState(null),[f,setF]=useState({name:"",event_label:"חתונה",text:"",rating:5}),[err,setErr]=useState("");
  const load=async()=>{const{data,error}=await sb.from("testimonials").select("*").order("approved").order("created_at",{ascending:false});setList(data||[]);if(error)setErr(error.message);};
  useEffect(()=>{load();},[]);
  const upd=async(t,patch)=>{const{error}=await sb.from("testimonials").update(patch).eq("id",t.id);if(error)setErr(error.message);else load();};
  const del=async t=>{if(!confirm(`למחוק את ההמלצה של ${t.name}?`))return;const{error}=await sb.from("testimonials").delete().eq("id",t.id);if(error)setErr(error.message);else load();};
  const add=async()=>{if(!f.name.trim()||f.text.trim().length<5)return;const{error}=await sb.from("testimonials").insert({...f,name:f.name.trim(),text:f.text.trim(),approved:true});if(error){setErr(error.message);return;}setF({name:"",event_label:"חתונה",text:"",rating:5});load();};
  const inp={border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",fontSize:14,fontFamily:"inherit",outline:"none",minWidth:0};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{...card,padding:16}}>
        <div style={{fontWeight:900,fontSize:15,marginBottom:4}}>➕ הוספת המלצה שקיבלתם</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>רק המלצות אמיתיות (למשל מוואטסאפ, באישור הלקוח). היא מתפרסמת מיד בדף הבית.</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          <input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="שם (למשל: נועה ואיתי)" aria-label="שם" style={{...inp,flex:"1 1 160px"}}/>
          <input value={f.event_label} onChange={e=>setF({...f,event_label:e.target.value})} placeholder="סוג אירוע" aria-label="סוג אירוע" style={{...inp,flex:"0 1 140px"}}/>
          <Stars value={f.rating} onChange={r=>setF({...f,rating:r})}/>
        </div>
        <textarea value={f.text} onChange={e=>setF({...f,text:e.target.value})} placeholder="טקסט ההמלצה" aria-label="טקסט ההמלצה" style={{...inp,width:"100%",minHeight:70,boxSizing:"border-box",resize:"vertical",marginBottom:8}}/>
        <button onClick={add} className="sx-btn" style={{background:GRAD,color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>הוסף ופרסם</button>
        {err&&<div role="alert" style={{color:C.danger,fontSize:13,fontWeight:700,marginTop:8}}>❌ {err}</div>}
      </div>
      {list===null?<Spinner size={22}/>:!list.length?<div style={{...card,padding:30,textAlign:"center",color:C.muted}}>עוד אין המלצות. לקוחות יכולים לשלוח מתוך "הגדרות" באתר.</div>
        :list.map(t=>(
          <div key={t.id} className="adm-row" style={{...card,padding:"12px 16px",borderRight:`4px solid ${t.approved?C.success:C.gold}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6}}>
              <span style={{fontWeight:900}}>{t.name}</span>
              <span style={{fontSize:12,color:C.muted}}>{t.event_label||""} · {new Date(t.created_at).toLocaleDateString("he-IL")}</span>
              {t.rating&&<Stars value={t.rating} size={14}/>}
              <span style={{marginRight:"auto",background:t.approved?"#E9FBF4":"#FFF4E0",color:t.approved?C.success:"#B07A12",borderRadius:100,padding:"2px 10px",fontSize:12,fontWeight:800}}>{t.approved?"מוצגת באתר":"ממתינה לאישור"}</span>
            </div>
            <div style={{fontSize:14,lineHeight:1.7,marginBottom:8}}>{t.text}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>upd(t,{approved:!t.approved})} className="sx-btn" style={{background:t.approved?"#fff":C.success,color:t.approved?C.text:"#fff",border:`1.5px solid ${t.approved?C.border:C.success}`,borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{t.approved?"הסתר מהאתר":"✅ אשר והצג"}</button>
              <button onClick={()=>del(t)} style={{background:"none",border:"none",color:"#A0AEC0",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>🗑️ מחק</button>
            </div>
          </div>
        ))}
    </div>
  );
}
// דף הבית: המלצות מאושרות + מספרים אמיתיים מהמערכת (מוצגים רק כשיש מספיק)
export function ProducerProfileCard({ user }) {
  const [isProducer,setIsProducer]=useState(false),[p,setP]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  useEffect(()=>{(async()=>{
    const [{data:pk},{data:pp}]=await Promise.all([
      sb.from("user_packages").select("package_id").eq("user_id",user.id),
      sb.from("producer_profiles").select("*").eq("user_id",user.id).maybeSingle(),
    ]);
    setIsProducer((pk||[]).some(x=>x.package_id==="producer"));
    setP(pp||{brand_name:"",phone:"",logo_url:"",show_on_invite:true});
  })();},[user.id]);
  if(!isProducer||!p)return null;
  const save=async next=>{
    setP(next);setMsg("");
    const{error}=await sb.from("producer_profiles").upsert({user_id:user.id,brand_name:next.brand_name||null,phone:next.phone||null,logo_url:next.logo_url||null,show_on_invite:!!next.show_on_invite,updated_at:new Date().toISOString()});
    setMsg(error?"❌ "+error.message:"✓ נשמר");
  };
  const upload=async file=>{
    if(!file)return;
    if(file.size>2*1024*1024){setMsg("❌ הלוגו גדול מדי (עד 2MB)");return;}
    setBusy(true);
    const path=`producer_logos/${user.id}_${Date.now()}.${(file.name.split(".").pop()||"png").toLowerCase()}`;
    const{error}=await sb.storage.from("event-images").upload(path,file,{upsert:true});
    setBusy(false);
    if(error){setMsg("❌ ההעלאה נכשלה: "+error.message);return;}
    save({...p,logo_url:sb.storage.from("event-images").getPublicUrl(path).data.publicUrl});
  };
  const inp={border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:13,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"};
  return(
    <div style={{background:"#fff",margin:"0 16px 12px",borderRadius:16,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,.06)",border:"1.5px solid #BAE6FD"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:4}}>
        <div style={{flex:1,fontSize:14,fontWeight:900,color:"#1a1a1a"}}>🎬 פרופיל מפיק</div>
        {msg&&<span style={{fontSize:12,fontWeight:800,color:msg.startsWith("❌")?"#C53030":"#276749"}}>{msg}</span>}
      </div>
      <div style={{fontSize:12,color:"#666",marginBottom:12}}>השם והלוגו שלכם יופיעו בתחתית ההזמנה לאורחים בכל האירועים שלכם ("בהפקת ...").</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <input defaultValue={p.brand_name||""} onBlur={e=>{if(e.target.value.trim()!==(p.brand_name||""))save({...p,brand_name:e.target.value.trim()});}} placeholder="שם העסק (למשל: הפקות שמחה)" aria-label="שם העסק" maxLength={60} style={inp}/>
        <input defaultValue={p.phone||""} onBlur={e=>{if(e.target.value.trim()!==(p.phone||""))save({...p,phone:e.target.value.trim()});}} placeholder="טלפון להצגה (לא חובה)" aria-label="טלפון" type="tel" dir="ltr" maxLength={20} style={{...inp,textAlign:"right"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          {p.logo_url&&<img src={p.logo_url} alt="הלוגו שלכם" style={{height:44,maxWidth:120,objectFit:"contain",borderRadius:8,border:"1px solid #eee",background:"#fff"}}/>}
          <label style={{background:"#F0F9FF",color:"#0E7490",border:"1.5px solid #BAE6FD",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
            {busy?"מעלה...":p.logo_url?"🔄 החלפת לוגו":"📁 העלאת לוגו"}
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];e.target.value="";upload(f);}}/>
          </label>
          {p.logo_url&&<button onClick={()=>save({...p,logo_url:""})} style={{background:"none",border:"none",color:"#A0AEC0",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>הסר לוגו</button>}
        </div>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <input type="checkbox" checked={!!p.show_on_invite} onChange={e=>save({...p,show_on_invite:e.target.checked})}/> להציג בהזמנה לאורחים
        </label>
      </div>
    </div>
  );
}

// ─── MOBILE SETTINGS SCREEN ──────────────────────────────────────────────────
// חבר מביא חבר: קישור אישי עם קוד ההפניה של המשתמש
export function InviteFriendsCard({ user }) {
  const [copied,setCopied]=useState(false);
  const link=`https://www.sidoril.com/?ref=${myRefCode(user)}`;
  const text=`היי! סידרתי את ההושבה ואישורי ההגעה לאירוע שלי ב-Sidor-IL וזה חסך לי המון כאב ראש 🙌\nשווה לנסות:\n${link}`;
  const copy=()=>{navigator.clipboard?.writeText(link).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});};
  if(!myRefCode(user))return null;
  return(
    <div style={{background:"#fff",margin:"0 16px 12px",borderRadius:16,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
      <div style={{fontSize:14,fontWeight:900,color:"#1a1a1a",marginBottom:4}}>🎁 הזמינו חברים</div>
      <div style={{fontSize:12,color:"#6E6585",lineHeight:1.6,marginBottom:12}}>מכירים מישהו שמתכנן חתונה או אירוע? שלחו לו את הקישור האישי שלכם, וכל מי שנרשם דרכו נרשם אצלנו על שמכם.</div>
      <div style={{display:"flex",alignItems:"center",gap:8,background:"#F7F3FB",borderRadius:10,padding:"9px 12px",marginBottom:10}}>
        <span style={{flex:1,fontSize:12,fontWeight:700,color:"#3A2464",direction:"ltr",textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link.replace("https://","")}</span>
        <button onClick={copy} style={{background:"none",border:"none",color:"#9147D6",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>{copied?"✓ הועתק":"📋 העתקה"}</button>
      </div>
      <a href={waShareUrl(text)} target="_blank" rel="noopener noreferrer"
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#25D366",color:"#fff",borderRadius:10,padding:11,fontSize:13,fontWeight:800,textDecoration:"none"}}>
        <WaIcon size={16}/> שליחה לחברים בוואטסאפ
      </a>
    </div>
  );
}

export function MobileSettingsScreen({ user, event, sb, setGuests, setScreen }) {
  const [pwForm,setPwForm]=useState({newP:"",confirm:""});
  const [pwMsg,setPwMsg]=useState(null);
  const [notifyRsvp,setNotifyRsvp]=useState(event.settings_json?.notifyRsvp??true);
  const [notifyApp,setNotifyApp]=useState(event.settings_json?.notifyApp??true);

  const changePw=async()=>{
    if(pwForm.newP!==pwForm.confirm){setPwMsg({err:true,txt:"הסיסמאות לא תואמות"});return;}
    if(pwForm.newP.length<6){setPwMsg({err:true,txt:"סיסמה חייבת להכיל לפחות 6 תווים"});return;}
    const{error}=await sb.auth.updateUser({password:pwForm.newP});
    if(error)setPwMsg({err:true,txt:error.message});
    else{setPwMsg({err:false,txt:"✅ הסיסמה עודכנה בהצלחה"});setPwForm({newP:"",confirm:""});}
  };

  const saveNotify=async(key,val)=>{
    const settings={...event.settings_json,[key]:val};
    const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
    if(error){alert("❌ ההגדרה לא נשמרה: "+error.message);return;}
    Object.assign(event,{settings_json:settings});
  };

  const Toggle=({val,onChange})=>(
    <div onClick={()=>onChange(!val)} style={{width:44,height:24,borderRadius:12,background:val?"#3A2464":"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",top:2,left:val?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
    </div>
  );

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:80}}>

      {/* פרופיל */}
      <div style={{background:"#fff",margin:"12px 16px",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{background:"linear-gradient(120deg,#F0609E,#9B6BFF)",padding:"16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff"}}>
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>{event.event_type==="wedding"&&event.groom_name&&event.bride_name?`${event.groom_name} & ${event.bride_name}`:event.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{user.email}</div>
          </div>
        </div>
        <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
          {/* השדות לפי סוג האירוע (חתונה: חתן וכלה; בר מצווה: חתן/כלת המצווה; ברית: התינוק...) */}
          {[[eventKind(event).a,event.groom_name||" - "],eventKind(event).b&&[eventKind(event).b,event.bride_name||" - "],["מס' נייד",event.host_phone||user.phone||" - "]].filter(Boolean).map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:8,borderBottom:"1px solid #f5f5f5"}}>
              <span style={{fontSize:13,color:"#555"}}>{l}</span>
              <span style={{fontSize:13,fontWeight:700,direction:l==="מס' נייד"?"ltr":"rtl"}}>{v}</span>
            </div>
          ))}
          <button onClick={()=>setScreen("settings")} style={{background:"#EEF2FF",color:"#3A2464",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
            📋 עריכת פרטי האירוע
          </button>
        </div>
      </div>

      <ProducerProfileCard user={user}/>
      <TestimonialCard user={user} event={event} style={{margin:"0 16px 12px"}}/>
      <InviteFriendsCard user={user}/>

      {/* שינוי סיסמה */}
      <div style={{background:"#fff",margin:"0 16px 12px",borderRadius:16,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{fontSize:14,fontWeight:900,color:"#1a1a1a",marginBottom:14}}>🔒 שינוי סיסמה</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input type="password" placeholder="סיסמה חדשה" value={pwForm.newP} onChange={e=>setPwForm(f=>({...f,newP:e.target.value}))}
            style={{border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <input type="password" placeholder="אימות סיסמה חדשה" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))}
            style={{border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          {pwMsg&&<div style={{fontSize:12,fontWeight:700,color:pwMsg.err?"#C53030":"#276749"}}>{pwMsg.txt}</div>}
          <button onClick={changePw} style={{background:"#3A2464",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
            שמור סיסמה חדשה
          </button>
        </div>
      </div>

      {/* התראות */}
      <div style={{background:"#fff",margin:"0 16px 12px",borderRadius:16,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{fontSize:14,fontWeight:900,color:"#1a1a1a",marginBottom:14}}>🔔 הגדרת התראות</div>
        <PushDevice/>
        {[
          {label:"אישורי הגעה",desc:"התראה כשאורח מאשר או מבטל הגעה בדף ההזמנה",val:notifyRsvp,onChange:v=>{setNotifyRsvp(v);saveNotify("notifyRsvp",v);}},
          {label:"התראות מערכת",desc:"התראה כששליחת SMS אוטומטית לא יצאה (למשל כשנגמרה היתרה)",val:notifyApp,onChange:v=>{setNotifyApp(v);saveNotify("notifyApp",v);}},
        ].map(item=>(
          <div key={item.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #f5f5f5"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{item.label}</div><div style={{fontSize:12,color:"#6E6585",marginTop:2}}>{item.desc}</div></div>
            <Toggle val={item.val} onChange={item.onChange}/>
          </div>
        ))}
      </div>

      {/* איפוס */}
      <div style={{background:"#fff",margin:"0 16px 12px",borderRadius:16,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{fontSize:14,fontWeight:900,color:"#1a1a1a",marginBottom:12}}>⚠️ איפוס</div>
        <button onClick={async()=>{
          if(!window.confirm("למחוק את כל אישורי ההגעה?"))return;
          await sb.from("guests").update({rsvp:"pending"}).eq("event_id",event.id);
          setGuests(gs=>gs.map(g=>({...g,rsvp:"pending"})));
        }} style={{width:"100%",background:"#FFF5F5",color:"#C53030",border:"1px solid #FED7D7",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          🔄 איפוס טבלת אישורי הגעה
        </button>
      </div>

      {/* מחיקת חשבון */}
      <div style={{background:"#fff",margin:"0 16px 12px",borderRadius:16,padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{fontSize:14,fontWeight:900,color:"#C53030",marginBottom:8}}>🗑️ מחיקת חשבון</div>
        <div style={{fontSize:12,color:"#6E6585",marginBottom:12,lineHeight:1.6}}>מחיקת החשבון תמחק לצמיתות את כל הנתונים  -  אורחים, שולחנות, אירוע ופרטי חשבון. לא ניתן לשחזר.</div>
        <button onClick={async()=>{
          const first=window.confirm("האם אתה בטוח שברצונך למחוק את החשבון לצמיתות?\nכל הנתונים יימחקו ולא ניתן לשחזרם.");
          if(!first)return;
          const second=window.confirm("אישור אחרון - מחיקה סופית של החשבון?");
          if(!second)return;
          try{
            // אירוע ששותף איתי לא נמחק עם החשבון שלי
            if(!event.user_id||event.user_id===user.id){
              await sb.from("guests").delete().eq("event_id",event.id);
              await sb.from("tables").delete().eq("event_id",event.id);
              await sb.from("events").delete().eq("id",event.id);
            }
            await sb.rpc("delete_user");
            await sb.auth.signOut();
          }catch(e){
            alert("שגיאה במחיקה: "+e.message);
          }
        }} style={{width:"100%",background:"#FFF5F5",color:"#C53030",border:"2px solid #FC8181",borderRadius:10,padding:"11px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
          🗑️ מחק חשבון לצמיתות
        </button>
      </div>

      {/* התנתקות */}
      <div style={{padding:"0 16px"}}>
        <button onClick={async()=>{await sb.auth.signOut();}}
          style={{width:"100%",background:"#FFF5F5",color:"#C53030",border:"1px solid #FED7D7",borderRadius:12,padding:"13px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
          🚪 התנתק
        </button>
      </div>
    </div>
  );
}

// ─── MOBILE RSVP SCREEN ──────────────────────────────────────────────────────
// ─── משימות לקראת האירוע (צ'קליסט) ─────────────────────────────────────────
// ברירת מחדל לפי סוג האירוע: [ימים ביחס לאירוע (שלילי = לפני), משימה, קטגוריה]. נשמר באירוע: settings_json.tasks
export const TASK_CATS={plan:["🗓️","תכנון"],vendor:["🤝","ספקים"],guests:["👥","מוזמנים"],look:["👗","לבוש ומראה"],admin:["📄","סידורים"],day:["🎉","יום האירוע"]};
export const TASK_DEFAULTS={
  wedding:[[-365,"קביעת תאריך ותקציב כללי","plan"],[-330,"רשימת מוזמנים ראשונית","guests"],[-300,"סגירת אולם / גן אירועים","vendor"],[-270,"סגירת צלם סטילס ווידאו","vendor"],[-270,"סגירת DJ / להקה","vendor"],[-240,"התחלת חיפוש שמלת כלה","look"],[-210,"סגירת עיצוב ופרחים","vendor"],[-180,"ניסיון איפור ושיער וסגירה","look"],[-180,"חליפת חתן","look"],[-150,"טבעות נישואין","look"],[-120,"עיצוב ההזמנה","guests"],[-90,"פתיחת תיק נישואין ברבנות","admin"],[-60,"שליחת הזמנות לאורחים","guests"],[-45,"סגירת רב / עורך טקס","admin"],[-30,"תזכורת לאורחים שלא אישרו הגעה","guests"],[-21,"סידור הושבה ראשוני","guests"],[-14,"מספר מנות סופי מול האולם","vendor"],[-7,"סידור הושבה סופי והדפסת כרטיסי שולחן","guests"],[-3,"תשלומים לספקים והכנת מעטפות","vendor"],[-1,"הכנת תיק לאירוע (טבעות, תעודות, מטען)","day"],[0,"שליחת מספרי שולחן לאורחים","day"],[2,"הודעות תודה לאורחים","guests"],[14,"רישום המתנות וסגירת חשבונות","plan"]],
  bar_mitzvah:[[-300,"קביעת תאריך ותקציב","plan"],[-270,"רשימת מוזמנים ראשונית","guests"],[-240,"סגירת אולם","vendor"],[-210,"סגירת צלם ו-DJ","vendor"],[-180,"תיאום עלייה לתורה / תפילין עם בית הכנסת","admin"],[-120,"התחלת לימוד הפרשה / הכנת דרשה","admin"],[-90,"לבוש לבר/בת המצווה ולמשפחה","look"],[-60,"שליחת הזמנות","guests"],[-30,"תזכורת לאורחים שלא אישרו","guests"],[-14,"מספר מנות סופי","vendor"],[-7,"סידור הושבה סופי והדפסה","guests"],[-3,"תשלומים לספקים","vendor"],[0,"שליחת מספרי שולחן לאורחים","day"],[2,"הודעות תודה לאורחים","guests"]],
  brit:[[-5,"תיאום מוהל","admin"],[-5,"סגירת מקום וקייטרינג","vendor"],[-4,"שליחת הזמנות","guests"],[-3,"בחירת סנדק וכיבודים","admin"],[-2,"צלם","vendor"],[-1,"סידור הושבה והדפסה","guests"],[0,"שליחת מספרי שולחן לאורחים","day"],[3,"הודעות תודה לאורחים","guests"]],
  other:[[-120,"קביעת תאריך ותקציב","plan"],[-100,"רשימת מוזמנים ראשונית","guests"],[-90,"סגירת מקום","vendor"],[-75,"סגירת ספקים (צילום, מוזיקה, כיבוד)","vendor"],[-45,"שליחת הזמנות","guests"],[-21,"תזכורת לאורחים שלא אישרו","guests"],[-10,"מספר מנות סופי","vendor"],[-5,"סידור הושבה והדפסה","guests"],[-2,"תשלומים לספקים","vendor"],[0,"שליחת מספרי שולחן לאורחים","day"],[2,"הודעות תודה לאורחים","guests"]],
};
TASK_DEFAULTS.business=TASK_DEFAULTS.other;
export const DAY_MS=864e5;
export const eventDay=event=>event?.date?new Date(event.date+"T00:00:00"):null;
// הרשימה: מה שנשמר, או ברירת המחדל של סוג האירוע
export const taskList=event=>{
  const saved=event?.settings_json?.tasks;
  if(Array.isArray(saved))return saved;
  // "קביעת תאריך" מסומנת כבוצעה אם כבר יש תאריך לאירוע
  return (TASK_DEFAULTS[event?.event_type]||TASK_DEFAULTS.wedding).map(([o,t,c],i)=>({id:"d"+i,t,o,c,done:!!event?.date&&t.startsWith("קביעת תאריך")}));
};
// תאריך יעד: ימים ביחס לאירוע (o) — זז עם תאריך האירוע. d (תאריך קבוע) רק למשימה שנוספה בלי תאריך אירוע
export const taskDue=(task,event)=>{
  const ev=eventDay(event);
  if(ev&&typeof task.o==="number")return new Date(ev.getTime()+task.o*DAY_MS);
  return task.d?new Date(task.d+"T00:00:00"):null;
};
// ימים בין תאריך (YYYY-MM-DD) לתאריך האירוע
export const taskOff=(d,event)=>{const ev=eventDay(event);return ev&&d?Math.round((new Date(d+"T00:00:00")-ev)/DAY_MS):null;};
export const today0=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};
// "באיחור" = עבר המועד אחרי שהאירוע נפתח. משימה שהמועד שלה עבר עוד לפני שהאירוע נפתח היא "להשלים בהקדם" (לא אדום)
export const eventOpened=event=>{const c=event?.created_at?new Date(event.created_at):null;if(!c||isNaN(c))return null;c.setHours(0,0,0,0);return c;};
// תאריך האירוע עבר: משימות שהיו אמורות להיעשות לפני האירוע כבר לא רלוונטיות — "עבר תאריך החתונה" (לא באיחור)
export const eventPassed=event=>{const ev=eventDay(event);return !!ev&&ev<today0();};
export const eventWord=event=>event?.event_type==="wedding"||!event?.event_type?"החתונה":"האירוע";
export const taskPastEvent=(task,event)=>{if(task.done||!eventPassed(event))return false;const d=taskDue(task,event);return d?d<=eventDay(event):(task.o??0)<=0;};
export const taskCatchUp=(task,event)=>{const d=taskDue(task,event),c=eventOpened(event);return !task.done&&d&&c&&d<c&&!taskPastEvent(task,event);};
export const taskLate=(task,event)=>{const d=taskDue(task,event);return !task.done&&d&&d<today0()&&!taskCatchUp(task,event)&&!taskPastEvent(task,event);};
export const sortTasks=(list,event)=>[...list].sort((a,b)=>(taskDue(a,event)?.getTime()??(a.o??9e9)*DAY_MS)-(taskDue(b,event)?.getTime()??(b.o??9e9)*DAY_MS));
export const fmtDue=d=>d?d.toLocaleDateString("he-IL",{day:"numeric",month:"short",year:d.getFullYear()!==new Date().getFullYear()?"numeric":undefined}):"";
// שמירת הרשימה באירוע (מיזוג עם שאר settings_json)
export const saveTasks=async(event,next)=>{
  const settings={...(event.settings_json||{}),tasks:next};
  event.settings_json=settings;
  const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
  if(error)alert("❌ המשימות לא נשמרו: "+error.message);
};

export function TasksScreen({ event }) {
  const [list,setList]=useState(()=>taskList(event));
  useEffect(()=>{setList(taskList(event));},[event.id]);
  // ברירת מחדל: הכל — משימה שהושלמה נשארת במקומה עם קו עליה (נותן מוטיבציה לראות התקדמות)
  const [filter,setFilter]=useState("all"),[title,setTitle]=useState(""),[due,setDue]=useState(""),[editId,setEditId]=useState(null);
  const update=next=>{setList(next);saveTasks(event,next);};
  const toggle=id=>update(list.map(t=>t.id===id?{...t,done:!t.done}:t));
  const remove=id=>update(list.filter(t=>t.id!==id));
  const rename=(id,t)=>{t=t.trim();if(t)update(list.map(x=>x.id===id?{...x,t}:x));setEditId(null);};
  // משימה חדשה עם תאריך נשמרת גם כ-o (ימים ביחס לאירוע), כדי שתזוז כשתאריך האירוע משתנה
  const add=()=>{if(!title.trim())return;const o=taskOff(due,event);update([...list,{id:"c"+Date.now().toString(36),t:title.trim(),c:"plan",d:due||null,...(o!=null?{o}:{}),done:false,custom:true}]);setTitle("");setDue("");};
  const ev=eventDay(event);
  // איפוס זמנים: משימות ברירת המחדל חוזרות למועד הרגיל ביחס לתאריך האירוע; משימה שהוספתם עם תאריך קבוע (בלי o) מוצמדת לתאריך האירוע.
  // סימון "בוצע", שמות ומשימות שנמחקו לא משתנים
  const resetTimes=()=>{
    if(!ev){alert("קודם צריך להגדיר תאריך אירוע בפרטי האירוע");return;}
    if(!window.confirm(`לאפס את תאריכי היעד של המשימות לפי תאריך האירוע (${ev.toLocaleDateString("he-IL")})?\nמה שסימנתם כבוצע נשאר מסומן.`))return;
    const defs=TASK_DEFAULTS[event?.event_type]||TASK_DEFAULTS.wedding;
    update(list.map(t=>{
      const m=/^d(\d+)$/.exec(t.id),def=m&&defs[+m[1]];
      if(def&&!t.custom){const{d,...rest}=t;return{...rest,o:def[0]};}
      if(typeof t.o!=="number"&&t.d){const o=taskOff(t.d,event);return Math.abs(o)>400?{...t,o:-7}:{...t,o};}
      return t;
    }));
  };
  const done=list.filter(t=>t.done).length,late=list.filter(t=>taskLate(t,event)).length;
  const pct=list.length?Math.round(done/list.length*100):0;
  const shown=sortTasks(list,event).filter(t=>filter==="all"||(filter==="open"?!t.done:filter==="late"?taskLate(t,event):t.done));
  // קבוצות לפי זמן ביחס לאירוע
  const bucket=t=>{
    const d=taskDue(t,event);const o=d&&ev?Math.round((d-ev)/DAY_MS):t.o;
    if(o==null)return"משימות נוספות";
    if(o<=-180)return"חצי שנה ויותר לפני";if(o<=-90)return"3–6 חודשים לפני";if(o<=-30)return"1–3 חודשים לפני";
    if(o<0)return"החודש האחרון";if(o===0)return"ביום האירוע";return"אחרי האירוע";
  };
  const groups=[];shown.forEach(t=>{const b=bucket(t);let g=groups.find(x=>x.b===b);if(!g)groups.push(g={b,items:[]});g.items.push(t);});
  const inp={border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",minWidth:0};
  return(
    <div style={{direction:"rtl",maxWidth:760,margin:"0 auto",padding:16,paddingBottom:90}}>
      <div style={{background:GRAD,borderRadius:18,padding:"18px 20px",color:"#fff",marginBottom:14,display:"flex",alignItems:"center",gap:16}}>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:900}}>✅ משימות לקראת האירוע</div>
          <div style={{fontSize:13,opacity:.9,marginTop:2}}>{done} מתוך {list.length} הושלמו{late?` · ${late} באיחור`:""}</div>
          <div style={{height:8,background:"rgba(255,255,255,.3)",borderRadius:100,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:"#fff",borderRadius:100,transition:"width .3s"}}/></div>
        </div>
        <div style={{fontSize:28,fontWeight:900}}>{pct}%</div>
      </div>
      {!ev&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#B45309",marginBottom:12}}>⚠️ הגדירו תאריך אירוע ב"פרטי האירוע" כדי שלכל משימה יופיע תאריך יעד.</div>}
      {eventPassed(event)&&<div style={{background:"#F7FAFC",border:"1px solid #E2E8F0",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#4A5568",marginBottom:12}}>📅 תאריך {eventWord(event)} עבר. המשימות שלפני {eventWord(event)} כבר לא רלוונטיות, ונשארו רק המשימות שאחריה (תודות, מתנות).</div>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {[["all","הכל"],["open","פתוחות"],["late",`באיחור${late?` (${late})`:""}`],["done","הושלמו"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} aria-pressed={filter===k} style={{background:filter===k?C.blue:"#fff",color:filter===k?"#fff":C.blue,border:`1.5px solid ${filter===k?C.blue:C.border}`,borderRadius:100,padding:"6px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
        ))}
        <button onClick={resetTimes} title="החזרת תאריכי היעד למועדים הרגילים לפי תאריך האירוע" style={{marginInlineStart:"auto",background:"#fff",color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:100,padding:"6px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>↺ איפוס זמנים</button>
      </div>
      <Card style={{padding:12,marginBottom:14,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add();}} placeholder="➕ משימה חדשה..." aria-label="משימה חדשה" style={{...inp,flex:"2 1 200px"}}/>
        <DateField compact value={due} onChange={setDue} placeholder="תאריך יעד" style={{...inp,flex:"1 1 130px"}}/>
        <button onClick={add} disabled={!title.trim()} style={{background:title.trim()?GRAD:"#E2E8F0",color:title.trim()?"#fff":"#999",border:"none",borderRadius:10,padding:"10px 18px",fontSize:14,fontWeight:900,cursor:title.trim()?"pointer":"default",fontFamily:"inherit"}}>הוסף</button>
      </Card>
      {groups.map(g=>(
        <div key={g.b} style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:900,color:C.muted,margin:"0 4px 8px"}}>{g.b}</div>
          {g.items.map(t=>{const d=taskDue(t,event),lt=taskLate(t,event),cat=TASK_CATS[t.c]||TASK_CATS.plan;return(
            <Card key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,background:t.done?"#F6FFF9":undefined,border:`1.5px solid ${lt?"#FEB2B2":t.done?"#C6F6D5":C.border}`,transition:"background .2s"}}>
              <button role="checkbox" aria-checked={t.done} aria-label={t.t} onClick={()=>toggle(t.id)}
                style={{width:26,height:26,borderRadius:8,border:`2px solid ${t.done?"#25D366":"#CBD5E0"}`,background:t.done?"#25D366":"#fff",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>{t.done?"✓":""}</button>
              <span title={cat[1]} style={{fontSize:16,flexShrink:0}}>{cat[0]}</span>
              <div style={{flex:1,minWidth:0}}>
                {editId===t.id
                  ?<input autoFocus defaultValue={t.t} onBlur={e=>rename(t.id,e.target.value)} onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape")setEditId(null);}} style={{...inp,width:"100%",padding:"6px 10px"}}/>
                  :<div onDoubleClick={()=>setEditId(t.id)} style={{fontSize:14,fontWeight:700,color:t.done?"#5D6B63":C.text,textDecoration:t.done?"line-through":"none",textDecorationThickness:2,textDecorationColor:"#25D366"}}>{t.t}</div>}
                {taskPastEvent(t,event)
                  ?<div style={{fontSize:12,color:"#A0AEC0",fontWeight:700}}>📅 עבר תאריך {eventWord(event)}</div>
                  :d&&<div style={{fontSize:12,color:lt?C.danger:taskCatchUp(t,event)?"#B45309":C.muted,fontWeight:lt||taskCatchUp(t,event)?800:500}}>{lt?"⚠️ באיחור · ":taskCatchUp(t,event)?"⏩ להשלים בהקדם · ":""}{fmtDue(d)}</div>}
              </div>
              <button onClick={()=>setEditId(t.id)} aria-label={`עריכת ${t.t}`} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#A0AEC0",padding:4}}>✏️</button>
              <button onClick={()=>remove(t.id)} aria-label={`מחיקת ${t.t}`} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#A0AEC0",padding:4}}>🗑️</button>
            </Card>
          );})}
        </div>
      ))}
      {!shown.length&&<div style={{textAlign:"center",color:C.muted,fontSize:14,padding:30}}>{filter==="late"?"🎉 אין משימות באיחור":filter==="open"?"🎉 כל המשימות הושלמו":"אין משימות"}</div>}
    </div>
  );
}
// קישור לכתיבת ביקורת בפרופיל העסק בגוגל
export const GOOGLE_REVIEW_URL="https://g.page/r/CSW-aObv3rBVEBM/review";
export const GoogleReviewButton=({style})=>(
  <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer"
    style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"#fff",color:"#1a73e8",border:"1.5px solid #D2E3FC",borderRadius:12,padding:"9px 12px",fontSize:13,fontWeight:800,textDecoration:"none",fontFamily:"inherit",...style}}>
    <span style={{color:"#F4B400"}}>★</span> דרגו אותנו בגוגל
  </a>
);
// אחרי האירוע (עד 30 יום): הודעת תודה מוכנה לאורחים, רישום מתנות והמלצה
export const thankYouText=event=>{
  const ew=eventWords(event);
  return ew.type==="business"
    ?`תודה רבה שהגעתם ל${ew.name}! 🙏\nהיה לנו כבוד לארח אתכם, ונשמח להיפגש שוב בקרוב.${ew.hosts?`\n${ew.hosts}`:""}`
    :`תודה ענקית שבאתם לשמוח איתנו ב${ew.name}! ${ew.emoji}\nהנוכחות שלכם עשתה לנו את הערב, ואנחנו מודים על כל ברכה, חיבוק ומתנה ❤️${ew.hosts?`\n\nבאהבה,\n${ew.hosts}`:""}`;
};
// ─── מסך הבית של האירוע: סגנון בהיר וצבעוני (גלולות, בועות, גופן מעוגל) בצבעי המותג ───
export const HOME_CSS=`
.hm-auto{background:#fff;border-radius:28px;padding:22px 24px;margin-top:18px;border:1.5px solid #EADFF6;box-shadow:0 22px 44px -26px rgba(91,60,140,.6)}
.hm-auto h2{margin:0;font-size:19px;font-weight:700;color:#2B1D3F}
.hm-auto > p{margin:4px 0 0;font-size:14px;color:#3A2F50;font-weight:600}
.hm-auto-tl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}
.hm-auto-tl div{background:#FBF8FF;border-radius:18px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.hm-auto-tl i{font-style:normal;font-size:18px}
.hm-auto-tl b{font-family:'Fredoka','Heebo',sans-serif;font-size:14.5px;font-weight:700;color:#2B1D3F}
.hm-auto-tl small{font-size:12.5px;font-weight:600;color:#5E5470}
.hm-auto-opts{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.hm-auto-opt{border:2px solid var(--b);border-radius:22px;padding:16px 18px;background:var(--bg);text-align:right;cursor:pointer;font-family:inherit;color:#2B1D3F;display:flex;flex-direction:column;gap:5px;transition:translate 200ms cubic-bezier(0.23,1,0.32,1),box-shadow 200ms cubic-bezier(0.23,1,0.32,1)}
@media(hover:hover) and (pointer:fine){.hm-auto-opt:hover{translate:0 -3px;box-shadow:0 18px 34px -22px rgba(60,35,110,.6)}}
.hm-auto-opt:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
.hm-auto-opt .top{display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:'Fredoka','Heebo',sans-serif;font-size:17px;font-weight:700}
.hm-auto-opt .top em{font-style:normal;font-size:12px;font-weight:700;color:#fff;background:var(--c);border-radius:100px;padding:3px 10px}
.hm-auto-opt .pr{font-family:'Fredoka','Heebo',sans-serif;font-size:22px;font-weight:700;color:var(--c)}
.hm-auto-opt .pr small{font-size:13px;color:#3A2F50;font-weight:600}
.hm-auto-opt .d{font-size:13.5px;line-height:1.55;color:#3A2F50;font-weight:600}
.hm-auto-opt .go{margin-top:6px;align-self:flex-start;font-family:'Fredoka','Heebo',sans-serif;font-size:14px;font-weight:700;color:#fff;background:var(--c);border-radius:100px;padding:8px 16px}
.hm-rev{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:linear-gradient(135deg,#FFF8E6,#FFF1F6);border-radius:28px;padding:18px 22px}
.hm-rev .s{font-size:22px;letter-spacing:2px;color:#E8A317}
.hm-rev div{flex:1;min-width:180px}
.hm-rev b{display:block;font-family:'Fredoka','Heebo',sans-serif;font-size:17px;font-weight:700;color:#2B1D3F}
.hm-rev span{font-size:13.5px;color:#3A2F50;font-weight:600}
@media(max-width:760px){.hm-auto{padding:18px 16px}.hm-auto-tl{grid-template-columns:1fr 1fr}.hm-auto-opts{grid-template-columns:1fr}}
.hm{font-synthesis-weight:none}
.hm h1,.hm h2,.hm h3,.hm .hm-f,.hm button{font-family:'Fredoka','Heebo',sans-serif}
.hm-hero{position:relative;overflow:hidden;border-radius:36px;padding:30px 34px;color:#2B1D3F;background:linear-gradient(150deg,#EFE4FF 0%,#FFE4F0 55%,#FFE9DC 100%);box-shadow:0 30px 70px -44px rgba(155,107,255,.7);display:grid;grid-template-columns:1fr auto;gap:26px;align-items:center}
.hm-hero > *{position:relative;z-index:1}
.hm-hero .hm-bub{position:absolute;z-index:0;border-radius:50%;background:rgba(255,255,255,.55);pointer-events:none}
.hm-hero h1{font-size:clamp(26px,3vw,40px);font-weight:700;line-height:1.12;margin:4px 0 8px}
.hm-greet{font-size:15px;font-weight:700;color:#7A3FBF}
.hm-when{font-size:15px;color:#3E3555;display:flex;flex-wrap:wrap;gap:6px 14px}
.hm-cd{display:flex;gap:10px;margin:18px 0 20px;flex-wrap:wrap;direction:ltr;justify-content:flex-end}
.hm-cd div{background:#fff;color:#2B1D3F;border-radius:20px;min-width:72px;padding:10px 12px 8px;text-align:center;box-shadow:0 14px 26px -16px rgba(43,29,63,.6)}
.hm-cd b{display:block;font-family:'Fredoka','Heebo',sans-serif;font-size:28px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.hm-cd span{font-size:13px;font-weight:600;color:#5E5470}
.hm-acts{display:flex;gap:10px;flex-wrap:wrap}
.hm-pill{position:relative;overflow:hidden;isolation:isolate;border:none;border-radius:100px;padding:12px 22px;font-size:15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;transition:translate 200ms cubic-bezier(0.23,1,0.32,1),box-shadow 200ms cubic-bezier(0.23,1,0.32,1)}
.hm-pill.w{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF);color:#fff;box-shadow:0 14px 28px -14px rgba(240,96,158,.7)}
.hm-pill.g{background:#fff;color:#4A2C8F;box-shadow:0 12px 24px -16px rgba(43,29,63,.55)}
.hm-pill.p{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF);color:#fff;box-shadow:0 14px 28px -14px rgba(240,96,158,.7)}
.hm-pill.s{background:#F6F0FF;color:#5B2FA8}
@media(hover:hover) and (pointer:fine){.hm-pill:hover{translate:0 -2px}}
.hm-pill:active{translate:0 1px}
.hm-invw{display:flex;flex-direction:column;align-items:center;gap:12px}
.hm-inv-tag{position:absolute;bottom:16px;right:50%;translate:50% 0;background:rgba(255,255,255,.92);color:#4A2C8F;border-radius:100px;padding:4px 12px;font-size:12px;font-weight:700;white-space:nowrap}
.hm-up{position:relative;display:inline-flex;align-items:center;gap:6px;background:#fff;color:#4A2C8F;border-radius:100px;padding:9px 16px;font-family:'Fredoka','Heebo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 10px 22px -16px rgba(43,29,63,.55)}
.hm-up:focus-within{outline:3px solid #9B6BFF;outline-offset:2px}
.hm-inv{position:relative;width:190px;aspect-ratio:3/4;border-radius:24px;background:#fff;padding:8px;rotate:-3deg;box-shadow:0 26px 50px -24px rgba(43,29,63,.7);display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;border:none}
.hm-inv img{width:100%;height:100%;object-fit:cover;border-radius:18px;display:block}
.hm-inv.e{background:rgba(255,255,255,.6);box-shadow:inset 0 0 0 2px #fff;color:#4A2C8F;flex-direction:column;gap:8px;font-size:15px;font-weight:700;text-align:center;padding:16px}
.hm-inv.e i{font-style:normal;width:52px;height:52px;border-radius:50%;background:#fff;color:#F0609E;display:flex;align-items:center;justify-content:center;font-size:26px}
.hm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.hm-stat{border-radius:26px;padding:18px 18px 16px;background:var(--bg);text-align:right;border:none;cursor:pointer;font-family:inherit;box-shadow:0 18px 36px -24px rgba(60,35,110,.55),inset 0 0 0 1.5px rgba(43,29,63,.09);transition:translate 200ms cubic-bezier(0.23,1,0.32,1)}
@media(hover:hover) and (pointer:fine){.hm-stat:hover{translate:0 -3px}}
.hm-stat .t{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;color:#2B1D3F}
.hm-stat .t i{font-style:normal;width:30px;height:30px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:15px}
.hm-stat b{display:block;font-family:'Fredoka','Heebo',sans-serif;font-size:38px;font-weight:700;line-height:1.1;margin:10px 0 2px;color:#2B1D3F;font-variant-numeric:tabular-nums}
.hm-stat small{font-size:13.5px;font-weight:700;color:#3A2F50}
.hm-h2{font-size:21px;font-weight:700;color:#2B1D3F;margin:26px 4px 12px}
.hm-sec{position:relative;background:rgba(255,255,255,.74);border:1.5px solid #EADFF6;border-radius:32px;padding:4px 18px 18px;margin-top:22px;box-shadow:0 24px 48px -36px rgba(91,60,140,.55)}
.hm-sec > .hm-h2{display:flex;align-items:center;gap:10px;margin:16px 4px 14px}
.hm-sec > .hm-h2::before{content:"";flex-shrink:0;width:6px;height:24px;border-radius:6px;background:linear-gradient(180deg,#F0609E,#9B6BFF)}
.hm-sec-m{margin:18px 14px 0;padding:2px 12px 14px;border-radius:28px}
.hm-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.hm-tile{background:#fff;border-radius:28px;padding:10px 10px 16px;border:1.5px solid #EADFF6;cursor:pointer;text-align:right;font-family:inherit;box-shadow:0 22px 44px -26px rgba(91,60,140,.6);transition:translate 200ms cubic-bezier(0.23,1,0.32,1),box-shadow 200ms cubic-bezier(0.23,1,0.32,1)}
@media(hover:hover) and (pointer:fine){.hm-tile:hover{translate:0 -4px;box-shadow:0 26px 50px -28px rgba(91,60,140,.6)}}
.hm-tile .art{height:84px;border-radius:20px;background:var(--bg);display:flex;align-items:center;justify-content:center;margin-bottom:12px;position:relative;overflow:hidden}
.hm-tile .art i{font-style:normal;width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 10px 20px -12px rgba(43,29,63,.5)}
.hm-tile .art.ph{height:132px;align-items:flex-end;justify-content:flex-start;padding:10px;box-sizing:border-box}
.hm-tile .art.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.04);transition:transform 600ms cubic-bezier(0.23,1,0.32,1)}
.hm-tile .art.ph:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(43,29,63,0) 45%,rgba(43,29,63,.28))}
.hm-tile .art.ph i{position:relative;z-index:1;width:44px;height:44px;font-size:21px}
@media(prefers-reduced-motion:no-preference){.hm-tile .art.ph img{animation:hmDrift 14s ease-in-out infinite alternate}.hm-tiles > *:nth-child(2) .art.ph img{animation-delay:-3.5s}.hm-tiles > *:nth-child(3) .art.ph img{animation-delay:-7s}.hm-tiles > *:nth-child(4) .art.ph img{animation-delay:-10.5s}}
@keyframes hmDrift{from{transform:scale(1.04) translate(0,0)}to{transform:scale(1.12) translate(-2%,-2%)}}
@media(hover:hover) and (pointer:fine){.hm-tile:hover .art.ph img{animation-play-state:paused}}
.hm-tile .row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:0 8px}
.hm-tile .row span{font-family:'Fredoka','Heebo',sans-serif;font-size:18px;font-weight:800;color:#2B1D3F}
.hm-tile .row b{font-family:'Fredoka','Heebo',sans-serif;font-size:17px;font-weight:700;color:#2B1D3F;font-variant-numeric:tabular-nums}
.hm-tile small{display:block;padding:4px 8px 0;font-size:13.5px;color:#3A2F50;font-weight:700}
.hm-tile .bar{height:6px;border-radius:99px;background:#F1ECF6;margin:10px 8px 0;overflow:hidden}
.hm-tile .bar u{display:block;height:100%;border-radius:99px;background:var(--c)}
.hm-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;margin-top:18px}
.hm-cardw > *{border-radius:28px!important;border:1.5px solid #EADFF6!important;box-shadow:0 22px 44px -26px rgba(91,60,140,.6)!important}
.hm-cardw > * > div:first-child > div > div:first-child,.hm-cardw h2{font-family:'Fredoka','Heebo',sans-serif}
.hm-rsvp{background:#fff;border-radius:28px;padding:22px 24px;border:1.5px solid #EADFF6;box-shadow:0 22px 44px -26px rgba(91,60,140,.6);display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center}
.hm-rsvp h2{grid-column:1/-1;margin:0;font-size:19px;font-weight:700;color:#2B1D3F;display:flex;justify-content:space-between;align-items:center}
.hm-donut{width:132px;height:132px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.hm-donut div{width:98px;height:98px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}
.hm-donut b{font-family:'Fredoka','Heebo',sans-serif;font-size:28px;font-weight:700;color:#2B1D3F;line-height:1}
.hm-donut small{font-size:12px;color:#5E5470;font-weight:600}
.hm-leg{display:flex;flex-direction:column;gap:10px}
.hm-leg div{display:flex;align-items:center;gap:10px;font-size:15px;color:#3E3555;background:#FBF8FD;border-radius:14px;padding:8px 12px}
.hm-leg i{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.hm-leg b{margin-inline-start:auto;font-variant-numeric:tabular-nums;color:#2B1D3F}
.hm-steps{background:#fff;border-radius:28px;padding:22px 24px;box-shadow:0 18px 40px -28px rgba(91,60,140,.5)}
.hm-steps h2{margin:0 0 4px;font-size:19px;font-weight:700;color:#2B1D3F}
.hm-step{width:100%;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;border:none;margin-top:8px;cursor:pointer;text-align:right;font-family:'Heebo',sans-serif!important;font-size:15px;font-weight:600;color:#3E3555;background:#FBF8FD}
.hm-step.n{background:#FFE9F2;color:#2B1D3F;font-weight:700}
.hm-step.d{background:#E7F8F0;color:#1F6B43;cursor:default;text-decoration:line-through}
.hm-step i{font-style:normal;width:26px;height:26px;border-radius:50%;border:2px solid #D9CCEA;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;background:#fff}
.hm-step.n i{border-color:#F0609E;color:#F0609E}
.hm-step.d i{border-color:#25A55F;background:#25A55F;color:#fff}
.hm-step em{font-style:normal;margin-inline-start:auto;font-size:12px;font-weight:700;border-radius:100px;padding:3px 10px;background:#fff;color:#B4236A}
.hm-pill:focus-visible,.hm-stat:focus-visible,.hm-tile:focus-visible,.hm-step:focus-visible,.hm-inv:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
@media(max-width:1100px){.hm-stats,.hm-tiles{grid-template-columns:repeat(2,1fr)}.hm-grid{grid-template-columns:1fr}}
/* טלפון: אותם כרטיסי קיצורי דרך כמו במחשב, מותאמים לרוחב צר; ושאר הפעולות כרטיסים קטנים באותו סגנון */
@media(max-width:600px){.hm-tiles{gap:10px}.hm-tile{border-radius:22px;padding:8px 8px 12px}.hm-tile .art.ph{height:96px;border-radius:16px;margin-bottom:8px}.hm-tile .art.ph i{width:36px;height:36px;font-size:18px}
  .hm-tile .row{padding:0 4px;gap:4px}.hm-tile .row span{font-size:15px}.hm-tile .row b{font-size:15px}.hm-tile small{padding:3px 4px 0;font-size:12px;line-height:1.35}.hm-tile .bar{margin:8px 4px 0}}
.hm-minis{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}
.hm-mini{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #EADFF6;border-radius:20px;padding:10px 12px;cursor:pointer;font-family:inherit;text-align:right;box-shadow:0 16px 30px -24px rgba(91,60,140,.6);transition:scale 120ms ease}
.hm-mini:active{scale:.97}
.hm-mini i{font-style:normal;width:38px;height:38px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}
.hm-mini span{font-family:'Fredoka','Heebo',sans-serif;font-size:14px;font-weight:700;color:#2B1D3F;line-height:1.25}
.hm-mini:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
@media(max-width:700px){.hm-hero{grid-template-columns:1fr;padding:24px 20px;border-radius:28px}.hm-inv{display:none}.hm-invw{flex-direction:row;justify-content:flex-start}.hm-cd div{min-width:64px}.hm-acts > *{flex:1 1 100%;justify-content:center}.hm-rsvp{grid-template-columns:1fr;justify-items:center}.hm-leg{width:100%}.hm-stat b{font-size:32px}}
@media(prefers-reduced-motion:reduce){.hm-pill,.hm-stat,.hm-tile{transition:none}}
@media(prefers-reduced-motion:no-preference){
  .hm-anim .hm-hero{animation:hmIn .6s cubic-bezier(0.23,1,0.32,1) both}
  .hm-anim .hm-hero .hm-cd div{animation:hmPop .5s cubic-bezier(0.23,1,0.32,1) both}
  .hm-anim .hm-hero .hm-cd div:nth-child(1){animation-delay:.25s}.hm-anim .hm-hero .hm-cd div:nth-child(2){animation-delay:.31s}.hm-anim .hm-hero .hm-cd div:nth-child(3){animation-delay:.37s}.hm-anim .hm-hero .hm-cd div:nth-child(4){animation-delay:.43s}
  .hm-anim .hm-inv{animation:hmCard .8s cubic-bezier(0.23,1,0.32,1) .2s both}
  .hm-anim .hm-stats > *,.hm-anim .hm-tiles > *{animation:hmIn .5s cubic-bezier(0.23,1,0.32,1) both}
  .hm-anim .hm-stats > *:nth-child(1){animation-delay:.12s}.hm-anim .hm-stats > *:nth-child(2){animation-delay:.17s}.hm-anim .hm-stats > *:nth-child(3){animation-delay:.22s}.hm-anim .hm-stats > *:nth-child(4){animation-delay:.27s}
  .hm-anim .hm-tiles > *:nth-child(1){animation-delay:.3s}.hm-anim .hm-tiles > *:nth-child(2){animation-delay:.35s}.hm-anim .hm-tiles > *:nth-child(3){animation-delay:.4s}.hm-anim .hm-tiles > *:nth-child(4){animation-delay:.45s}
  .hm-anim .hm-donut{animation:hmSpin .9s cubic-bezier(0.23,1,0.32,1) .35s both}
  .hm-hero .hm-bub{animation:hmFloat 7s ease-in-out infinite alternate}
  .hm-hero .hm-bub:nth-child(2){animation-duration:9s}.hm-hero .hm-bub:nth-child(3){animation-duration:5.5s}
  @media(hover:hover) and (pointer:fine){.hm-tile:hover .art i{transform:translateY(-3px) rotate(-6deg)}}
  .hm-tile .art i{transition:transform 250ms cubic-bezier(0.23,1,0.32,1)}
}
@keyframes hmIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes hmPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
@keyframes hmCard{from{opacity:0;transform:translateY(16px) rotate(4deg)}to{opacity:1;transform:none}}
@keyframes hmSpin{from{opacity:0;transform:rotate(-90deg) scale(.92)}to{opacity:1;transform:none}}
@keyframes hmFloat{from{transform:translate(0,0)}to{transform:translate(14px,-10px)}}
`;
// סרגל עליון בהיר: הכפתורים הישנים (לבן על שקוף) נצבעים כאן כגלולות בהירות, בלי לגעת בלוגיקה
// שכבת עיצוב משותפת לשאר המסכים (וואטסאפ, מתנות, משימות, כניסה לאולם, ספקים, חבילות ועוד):
// כרטיסים מעוגלים בלי מסגרת, כפתורי גלולה, באנרים בהירים ושדות מעוגלים — כמו מסך הבית
export const AP_CSS=`
.ap{font-synthesis-weight:none}
.ap [style*="border-radius: 12px"][style*="background: rgb(255, 255, 255)"],.ap [style*="border-radius: 14px"][style*="background: rgb(255, 255, 255)"],.ap [style*="border-radius: 16px"][style*="background: rgb(255, 255, 255)"],.ap [style*="border-radius: 18px"][style*="background: rgb(255, 255, 255)"],.ap [style*="border-radius: 20px"][style*="background: rgb(255, 255, 255)"]{border-radius:26px!important;border-color:transparent!important;box-shadow:0 18px 40px -30px rgba(91,60,140,.55)!important}
.ap button:not([role=switch]):not([style*="border-radius: 50%"]){border-radius:100px!important}
.ap button[style*="background: rgb(43, 108, 176)"],.ap button[style*="background: rgb(58, 36, 100)"],.ap button[style*="linear-gradient(135deg, rgb(58, 36, 100), rgb(240, 96, 158))"],.ap button[style*="background: rgb(27, 58, 140)"]{background:linear-gradient(120deg, rgb(255, 138, 101), rgb(240, 96, 158), rgb(155, 107, 255))!important;color:#fff!important;border:none!important;box-shadow:0 12px 26px -14px rgba(240,96,158,.7)!important}
.ap div[style*="linear-gradient(120deg, rgb(255, 138, 101), rgb(240, 96, 158), rgb(155, 107, 255))"][style*="padding"],.ap div[style*="linear-gradient(135deg, rgb(58, 36, 100), rgb(240, 96, 158))"][style*="padding"]{background:linear-gradient(150deg,#E6D9FF 0%,#FFD3E6 55%,#FFE6C4 100%)!important;color:#2B1D3F!important;border-radius:30px!important;box-shadow:0 26px 60px -42px rgba(120,60,170,.6)!important}
.ap div[style*="linear-gradient(120deg, rgb(255, 138, 101), rgb(240, 96, 158), rgb(155, 107, 255))"][style*="padding"] :is(div,span,h1,h2,h3,p,small,b),.ap div[style*="linear-gradient(135deg, rgb(58, 36, 100), rgb(240, 96, 158))"][style*="padding"] :is(div,span,h1,h2,h3,p,small,b){color:#2B1D3F!important}
.ap div[style*="linear-gradient(120deg, rgb(255, 138, 101), rgb(240, 96, 158), rgb(155, 107, 255))"][style*="padding"] [style*="rgba(255, 255, 255, 0.2"],.ap div[style*="linear-gradient(120deg, rgb(255, 138, 101), rgb(240, 96, 158), rgb(155, 107, 255))"][style*="padding"] [style*="rgba(255, 255, 255, 0.3"]{background:#fff!important}
.ap div[style*="linear-gradient(135deg, rgb(7, 94, 84), rgb(37, 211, 102))"][style*="padding"]{background:linear-gradient(150deg,#D9F7E8 0%,#E8FBF1 55%,#FFF6DC 100%)!important;color:#173D2F!important;border-radius:30px!important;box-shadow:0 26px 60px -42px rgba(20,120,80,.55)!important}
.ap div[style*="linear-gradient(135deg, rgb(7, 94, 84), rgb(37, 211, 102))"][style*="padding"] :is(div,span,h1,h2,h3,p,small,b){color:#173D2F!important}
.ap div[style*="linear-gradient(135deg, rgb(7, 94, 84), rgb(37, 211, 102))"][style*="padding"] [style*="rgba(255, 255, 255, 0.2"]{background:#fff!important}
.ap div[style*="rgb(240, 96, 158), rgb(155, 107, 255))"][style*="padding: 2"],.ap div[style*="rgb(240, 96, 158), rgb(155, 107, 255))"][style*="padding: 1"]{background:linear-gradient(150deg,#E6D9FF 0%,#FFD3E6 55%,#FFE6C4 100%)!important;color:#2B1D3F!important}
.ap div[style*="rgb(240, 96, 158), rgb(155, 107, 255))"][style*="padding: 2"] :is(div,span,h1,h2,h3,p,small,b),.ap div[style*="rgb(240, 96, 158), rgb(155, 107, 255))"][style*="padding: 1"] :is(div,span,h1,h2,h3,p,small,b){color:#2B1D3F!important}
.ap a[style*="background: rgb(37, 211, 102)"],.ap button[style*="background: rgb(37, 211, 102)"]{background:#0F7F40!important;color:#fff!important}
.ap [style*="background: rgb(37, 211, 102)"]:not(button):not(a){background:#0F7F40!important}
.ap input[style*="color: rgb(37, 211, 102)"]{color:#0F7F40!important}
.ap h1{font-size:clamp(24px,2.4vw,32px)!important;font-weight:700!important;color:#2B1D3F!important}
.ap h2,.ap h3{color:#2B1D3F}
.ap input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]),.ap textarea,.ap select{border-radius:16px!important;border-color:#E6DDF5!important;background-color:#fff}
.ap input:focus,.ap textarea:focus,.ap select:focus{border-color:#9B6BFF!important;box-shadow:0 0 0 4px rgba(155,107,255,.16)}
.ap button:focus-visible,.ap [role=button]:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}
`;
export const TOP_CSS=`
.sx-top{background:rgba(255,255,255,.9)!important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 16px 38px -24px rgba(60,35,110,.55),inset 0 0 0 1px rgba(155,107,255,.08);border:none;border-radius:100px;margin:10px 12px 6px}
.sx-app{background:radial-gradient(760px 420px at 92% 0%,#F3EAFF 0%,rgba(243,234,255,0) 62%),radial-gradient(600px 400px at 0% 0%,#FFEAF3 0%,rgba(255,234,243,0) 60%),#FFFBF7!important}
@media(max-width:700px){.sx-top{margin:8px 8px 4px;border-radius:24px}}
.sx-top .sx-title{color:#2B1D3F!important;font-family:'Fredoka','Heebo',sans-serif;font-weight:700!important;font-size:17px!important}
.sx-top button{background:#F6F0FF!important;color:#4A2C8F!important;border:none!important;border-radius:100px!important;font-family:'Fredoka','Heebo',sans-serif!important;font-weight:700!important;box-shadow:none!important}
.sx-top button.sx-prim{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)!important;color:#fff!important;box-shadow:0 10px 22px -12px rgba(240,96,158,.7)!important}
.sx-top button.sx-home{background:#fff!important;box-shadow:inset 0 0 0 1.5px #E9DDF7!important}
.sx-top button.sx-burger span{background:#4A2C8F!important}
.sx-top [role=tablist]{background:#F3EDFA!important;border:none!important;border-radius:100px!important}
.sx-top [role=tablist] button{background:transparent!important;color:#4A2C8F!important}
.sx-top [role=tablist] button[aria-selected=true]{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)!important;color:#fff!important;box-shadow:0 8px 18px -10px rgba(240,96,158,.7)!important}
/* בורר התצוגה בולט: גדול יותר, עם מסגרת, והאפשרויות הלא פעילות נראות כמו כפתורים */
.sx-top [role=tablist]{padding:4px!important;box-shadow:inset 0 0 0 1.5px #E2D4F5,0 10px 22px -16px rgba(91,60,140,.55)!important}
.sx-top [role=tablist] button{padding:9px 18px!important;font-size:14.5px!important}
.sx-top [role=tablist] button[aria-selected=false]{background:rgba(255,255,255,.7)!important}
@media(hover:hover) and (pointer:fine){.sx-top [role=tablist] button[aria-selected=false]:hover{background:#fff!important;box-shadow:inset 0 0 0 1.5px #D9C6FF!important}}
.sx-top .sx-view-lbl{font:700 13px 'Fredoka','Heebo',sans-serif;color:#6E6585;white-space:nowrap}
@media(max-width:1100px){.sx-top .sx-view-lbl{display:none}}
.sx-top .sx-count{background:#FFE9F2!important;color:#B4236A!important;font-family:'Fredoka','Heebo',sans-serif;font-size:13px!important}
.sx-top [role=status] button{background:#fff!important;color:#2B1D3F!important}
.sx-top button:focus-visible{outline:3px solid #9B6BFF!important;outline-offset:2px}
.sx-app{font-synthesis-weight:none}
${AP_CSS}
.sx-app h1,.sx-app h2,.sx-app h3,.sx-app h4,.sx-app button,.sx-app [role=tab],.sx-app label,.sx-app .sx-nav{font-family:'Fredoka','Heebo',sans-serif}
.sx-app [style*="font-weight: 900"],.sx-app [style*="font-weight: 800"],.sx-app b,.sx-app strong{font-family:'Fredoka','Heebo',sans-serif}
.sx-app input,.sx-app textarea,.sx-app select,.sx-app td{font-family:'Heebo',sans-serif}
.sx-app td [style*="font-weight: 900"],.sx-app td [style*="font-weight: 800"],.sx-app td b{font-family:'Fredoka','Heebo',sans-serif}
.sx-app .sx-map,.sx-app .sx-map *{font-family:'Heebo',sans-serif}
`;
export let hmT0=0;const hmFirst=()=>{const n=Date.now();if(!hmT0)hmT0=n;return n-hmT0<1500;};
// פרטי האירוע: כרטיס לכל נושא עם פס צבע משלו, שדות מעוגלים וגופן מעוגל לכותרות
export const ED_CSS=`
.ed .ed-inv{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#FFF6FA;border-radius:20px;padding:12px}
.ed .ed-inv-url{flex:1 1 260px;min-width:0;background:#fff;border-radius:14px;padding:11px 14px;font-size:13.5px;font-weight:600;color:#5B3C8C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}
.ed .ed-inv-btns{display:flex;gap:8px;flex-wrap:wrap}
.ed .ed-inv-btns button{min-height:44px;padding:0 16px;border:none;border-radius:100px;background:linear-gradient(120deg,#F0609E,#9B6BFF);color:#fff;font:700 14px 'Fredoka','Heebo',sans-serif;cursor:pointer}
.ed .ed-inv-btns button.wa{background:#15803D}
.ed .ed-inv-btns button:last-child{background:#fff;color:#5B3C8C;box-shadow:inset 0 0 0 1.5px #E6DDF5}
.ed .ed-inv-btns button.ok{background:#1F7A4D}
@media(max-width:700px){.ed .ed-inv-btns{width:100%}.ed .ed-inv-btns button{flex:1 1 auto;padding:0 10px}}
.ed .ed-share > *{border-radius:28px!important;border:none!important;box-shadow:0 18px 40px -28px rgba(91,60,140,.5)!important;margin-bottom:18px!important;background:linear-gradient(180deg,#FFF1D6 0%,#FFF8EA 45%,#fff 100%)!important}
.ed .ed-share button{border-radius:100px!important}
.ed .ed-card{background:linear-gradient(180deg,var(--t) 0,var(--t) 64px,#fff 64px)!important;padding-top:20px!important}
.ed .ed-card > div:first-child{font-family:'Fredoka','Heebo',sans-serif;font-size:19px!important;font-weight:700!important;color:#2B1D3F!important;border-bottom:none!important;margin-bottom:22px!important;padding-bottom:0!important;min-height:28px}
.ed .ed-card > div:nth-child(2):not([style*="grid"]){margin-top:0}
.ed input:not([type=file]):not([type=checkbox]),.ed textarea,.ed select{border-radius:16px!important;border:1.5px solid #E6DDF5!important;min-height:46px;background:#fff!important;color:#2B1D3F!important}
.ed input:focus,.ed textarea:focus,.ed select:focus{border-color:#9B6BFF!important;box-shadow:0 0 0 4px rgba(155,107,255,.16)}
.ed [role=switch]:focus-visible,.ed button:focus-visible,.ed label:focus-within{outline:3px solid #9B6BFF;outline-offset:2px}
@media(max-width:700px){.ed{padding:16px 12px 30px!important}.ed .ed-card{padding:18px 16px!important}.ed .ed-card [style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}
`;
// מסך התקציב
export const BUDGET_CSS=`
.bd .bd-card{background:#fff;border-radius:28px;padding:22px 24px;margin-bottom:16px;box-shadow:0 18px 40px -28px rgba(91,60,140,.5)}
.bd .bd-paid{height:12px;border-radius:99px;background:#FFF1D6;overflow:hidden;margin-bottom:18px}
.bd .bd-paid u{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3CC8A0,#25A55F)}
.bd .bd-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px 24px}
.bd .bd-cat{display:grid;grid-template-columns:110px 1fr auto;align-items:center;gap:10px;font-size:15px;color:#3E3555}
.bd .bd-cat span{display:flex;align-items:center;gap:8px;font-weight:600}
.bd .bd-cat i{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.bd .bd-cat b{font-family:'Fredoka','Heebo',sans-serif;color:#2B1D3F;font-variant-numeric:tabular-nums}
.bd .bd-bar{height:8px;border-radius:99px;background:#F3EEF8;overflow:hidden}
.bd .bd-bar u{display:block;height:100%;border-radius:99px}
@media(prefers-reduced-motion:no-preference){.bd .bd-paid u,.bd .bd-bar u{animation:bdGrow .8s cubic-bezier(0.23,1,0.32,1) both;transform-origin:right}}
@keyframes bdGrow{from{transform:scaleX(0)}to{transform:none}}
.bd-form input,.bd-form textarea,.bd-form select{border-radius:16px!important;border:1.5px solid #E6DDF5!important;min-height:46px;background:#fff!important}
.bd-form input:focus,.bd-form textarea:focus,.bd-form select:focus{border-color:#9B6BFF!important;box-shadow:0 0 0 4px rgba(155,107,255,.16)}
@media(max-width:700px){.bd > div{padding:16px 12px 0!important}.bd .bd-cat{grid-template-columns:90px 1fr auto}}
`;
// מסך ה-SMS: באנר בהיר, כרטיס לכל שלב בצבע משלו, טלפון בהיר לתצוגה
export const SMS_CSS=`
.sm .sm-hero{position:relative;overflow:hidden;background:linear-gradient(150deg,#E6D9FF 0%,#FFD3E6 55%,#FFE6C4 100%);border-radius:32px;padding:24px 28px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;box-shadow:0 26px 60px -40px rgba(120,60,170,.6)}
.sm .sm-bub{position:absolute;border-radius:50%;background:rgba(255,255,255,.45);pointer-events:none}
.sm .sm-bal{background:#fff;border-radius:22px;padding:10px 18px;text-align:center;box-shadow:0 14px 26px -16px rgba(43,29,63,.55)}
.sm .sm-bal b{display:block;font-family:'Fredoka','Heebo',sans-serif;font-size:30px;font-weight:700;line-height:1;color:#2B1D3F;font-variant-numeric:tabular-nums}
.sm .sm-bal span{font-size:13px;font-weight:600;color:#5E5470}
.sm .sm-card{background:linear-gradient(180deg,var(--t) 0,var(--t) 58px,#fff 58px);border-radius:28px;padding:18px 20px 20px;margin-bottom:16px;box-shadow:0 18px 40px -28px rgba(91,60,140,.5)}
.sm .sm-card > h2:first-child,.sm .sm-card > div:first-child > h2{font-family:'Fredoka','Heebo',sans-serif!important;font-size:18px!important;font-weight:700!important;color:#2B1D3F!important;margin-bottom:20px!important}
.sm .sm-phone{position:relative;max-width:320px;margin:4px auto 0;background:linear-gradient(180deg,#F6F0FF,#FFF4F8);border-radius:48px;overflow:hidden;border:11px solid #211B2C;box-shadow:0 0 0 2px #4A4258,0 40px 70px -34px rgba(43,29,63,.7),inset 0 0 0 1px rgba(255,255,255,.4);min-height:520px;padding-bottom:22px}
.sm .sm-phone::after{content:"";position:absolute;bottom:8px;left:50%;width:110px;height:5px;margin-left:-55px;border-radius:9px;background:#211B2C;opacity:.85}
.sm .sm-status{display:flex;align-items:center;justify-content:space-between;direction:ltr;padding:10px 20px 6px;font:600 13px/1 'Heebo',sans-serif;color:#211B2C;background:#fff}
.sm .sm-isl{width:86px;height:24px;border-radius:20px;background:#211B2C}
.sm .sm-ic{display:flex;align-items:flex-end;gap:2px}.sm .sm-ic i{width:3px;background:#211B2C;border-radius:1px}.sm .sm-ic i:nth-child(1){height:4px}.sm .sm-ic i:nth-child(2){height:6px}.sm .sm-ic i:nth-child(3){height:8px}.sm .sm-ic i:nth-child(4){height:10px}
.sm .sm-ic b{width:20px;height:10px;margin-left:5px;border-radius:3px;border:1.5px solid #211B2C;background:linear-gradient(90deg,#211B2C 70%,transparent 70%);background-clip:content-box;padding:1px}
.sm textarea:focus,.sm select:focus{border-color:#9B6BFF!important;box-shadow:0 0 0 4px rgba(155,107,255,.16)}
.sm [role=radio]:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}
@media(max-width:700px){.sm{padding:14px 12px 80px!important}.sm .sm-hero{padding:20px 18px;border-radius:26px}}
`;
export const hmGreet=()=>{const h=new Date().getHours();return h<5?"לילה טוב":h<12?"בוקר טוב":h<17?"צהריים טובים":h<21?"ערב טוב":"לילה טוב";};
// זמן עד האירוע: התאריך + שעת קבלת הפנים (או שעת האירוע) אם הוגדרה
// ימים · שעות · דקות · שניות, מימין לשמאל
export function HmCountdown({ target }){
  const c=useTick(target);if(!c)return null;
  return(<div className="hm-cd" role="timer" aria-label={`עוד ${c.d} ימים, ${c.h} שעות ו-${c.m} דקות`}>
    {[[c.d,"ימים"],[c.h,"שעות"],[c.m,"דקות"],[c.s,"שניות"]].map(([v,l])=><div key={l}><b>{l==="ימים"?v:String(v).padStart(2,"0")}</b><span>{l}</span></div>)}
  </div>);
}
export function useEventCountdown(event){
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(id);},[]);
  if(!event?.date)return null;
  const t=(event.reception_time||event.event_time||"00:00").slice(0,5);
  const target=new Date(`${String(event.date).slice(0,10)}T${/^\d\d:\d\d$/.test(t)?t:"00:00"}:00`).getTime();
  const ms=target-now;if(isNaN(ms)||ms<=0)return null;
  return{...cdParts(ms),target};
}
// תמונה שמעלים להזמנה מוקטנת אוטומטית (עד 1600 פיקסלים בצד הארוך, JPEG) כדי שתיטען מהר אצל האורחים
export async function resizeImageFile(file,max=1600){
  try{
    const url=URL.createObjectURL(file);
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});
    const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
    const c=document.createElement("canvas");c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);
    const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
    URL.revokeObjectURL(url);
    const blob=await new Promise(res=>c.toBlob(res,"image/jpeg",.86));
    return blob||file;
  }catch{return file;}
}
export async function uploadInviteImage(eventId,file){
  if(!file||!/^image\//.test(file.type||""))throw new Error("נא לבחור קובץ תמונה");
  if(file.size>25*1024*1024)throw new Error("הקובץ גדול מדי (עד 25MB)");
  const blob=await resizeImageFile(file);
  const path=`invite_images/${eventId}_${Date.now()}.jpg`;
  const{error}=await sb.storage.from("event-images").upload(path,blob,{upsert:true,contentType:"image/jpeg"});
  if(error)throw error;
  return sb.storage.from("event-images").getPublicUrl(path).data.publicUrl;
}
// "מה חדש מאז הביקור הקודם": מי אישר / ביטל הגעה מאז הפעם הקודמת שהזוג נכנס.
// בלי שינוי במסד: שומרים בדפדפן את מצב האישורים בסוף כל ביקור (רק באישור עוגיות נוחות) ומשווים בביקור הבא.
// התמונה של "הביקור הקודם" נקבעת פעם אחת לכל טעינת דף, כדי שהכרטיס לא ייעלם במעבר בין מסכים
export const NEWS_PREV={};
export function HomeNews({ event, guests, onGo, style }) {
  const key=`sidor_seen_${event.id}`;
  if(!(event.id in NEWS_PREV)){try{NEWS_PREV[event.id]=JSON.parse(localStorage.getItem(key)||"null");}catch{NEWS_PREV[event.id]=null;}}
  const prev=NEWS_PREV[event.id];
  const [hide,setHideS]=useState(()=>!!NEWS_PREV["hide_"+event.id]);
  const setHide=v=>{NEWS_PREV["hide_"+event.id]=v;setHideS(v);};
  const sig=guests.map(g=>g.id+":"+(g.rsvp||"pending")).join(",");
  useEffect(()=>{const t=setTimeout(()=>optSet(key,JSON.stringify({at:Date.now(),r:Object.fromEntries(guests.map(g=>[g.id,g.rsvp||"pending"]))})),1500);return()=>clearTimeout(t);},[sig]);
  if(hide||!prev?.r)return null;
  const changed=guests.filter(g=>(g.rsvp==="confirmed"||g.rsvp==="declined")&&prev.r[g.id]!==g.rsvp);
  if(!changed.length)return null;
  const conf=changed.filter(g=>g.rsvp==="confirmed"),dec=changed.filter(g=>g.rsvp==="declined");
  const ppl=l=>l.reduce((s,g)=>s+(g.guest_count||1),0);
  const names=l=>{const n=l.map(g=>String(g.name||"").split(" ")[0]).filter(Boolean);return n.length>3?`${n.slice(0,3).join(", ")} ועוד ${n.length-3}`:n.join(", ");};
  const ago=(()=>{const h=Math.round((Date.now()-(prev.at||0))/36e5);const d=Math.round(h/24);return h<1?"לפני פחות משעה":h===1?"לפני שעה":h===2?"לפני שעתיים":h<24?`לפני ${h} שעות`:d===1?"לפני יום":d===2?"לפני יומיים":`לפני ${d} ימים`;})();
  return(
    <section role="status" aria-label="מה חדש מאז הביקור הקודם" style={{background:"#fff",borderRadius:24,padding:"16px 18px",boxShadow:"0 18px 40px -30px rgba(91,60,140,.55),inset 0 0 0 1px #F1E9F8",display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap",...style}}>
      <span aria-hidden="true" style={{width:42,height:42,borderRadius:14,background:"linear-gradient(135deg,#FFE0EE,#E9DDFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🔔</span>
      <div style={{flex:"1 1 220px",minWidth:0}}>
        <div style={{font:"700 16px 'Fredoka','Heebo',sans-serif",color:"#2B1D3F",marginBottom:4}}>מאז הביקור הקודם <span style={{fontWeight:500,fontSize:13,color:"#6E6585"}}>({ago})</span></div>
        {conf.length>0&&<div style={{fontSize:14,color:"#1F6B43",fontWeight:700,lineHeight:1.6}}>✅ {conf.length===1?"אישר/ה הגעה":`${conf.length} אישרו הגעה`} ({ppl(conf)} אנשים): <span style={{fontWeight:500,color:"#3E3555"}}>{names(conf)}</span></div>}
        {dec.length>0&&<div style={{fontSize:14,color:"#B42318",fontWeight:700,lineHeight:1.6}}>✖️ {dec.length===1?"לא מגיע/ה":`${dec.length} לא מגיעים`}: <span style={{fontWeight:500,color:"#3E3555"}}>{names(dec)}</span></div>}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginInlineStart:"auto"}}>
        <button type="button" className="hm-pill g" onClick={()=>onGo("rsvp")} style={{padding:"9px 16px",fontSize:14}}>לרשימת האורחים</button>
        <button type="button" onClick={()=>setHide(true)} aria-label="הסתרת העדכון" style={{width:36,height:36,borderRadius:"50%",border:"none",background:"#F6F0FF",color:"#4A2C8F",cursor:"pointer",fontSize:14,fontWeight:900}}>✕</button>
      </div>
    </section>
  );
}
export function EventHomeHero({ event, inviteUrl, checksPct, onGo, noGuests=false }) {
  const [img,setImg]=useState(event.invite_image||"");
  const [upBusy,setUpBusy]=useState(false),[upErr,setUpErr]=useState("");
  const cover=coverImgOf(event.event_type,event.template_id);
  const onUpload=async e=>{
    const file=e.target.files?.[0];e.target.value="";if(!file)return;
    setUpBusy(true);setUpErr("");
    try{
      const url=await uploadInviteImage(event.id,file);
      const{error}=await sb.from("events").update({invite_image:url}).eq("id",event.id);
      if(error)throw error;
      event.invite_image=url;setImg(url);
    }catch(err){setUpErr(err.message||"ההעלאה נכשלה");}
    setUpBusy(false);
  };
  const cd=useEventCountdown(event);
  const [copied,setCopied]=useState(false);
  const title=event.groom_name&&event.bride_name?`החתונה של ${event.groom_name} ו${event.bride_name}`:event.name;
  const copy=()=>navigator.clipboard?.writeText(inviteUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});
  return(
    <section className="hm-hero" aria-labelledby="hm-title">
      <span className="hm-bub" aria-hidden="true" style={{width:220,height:220,top:-90,left:-60}}/>
      <span className="hm-bub" aria-hidden="true" style={{width:90,height:90,bottom:-30,left:"38%"}}/>
      <span className="hm-bub" aria-hidden="true" style={{width:46,height:46,top:24,left:"46%",background:"rgba(255,255,255,.22)"}}/>
      <div>
        <div className="hm-greet">{hmGreet()} 👋</div>
        <h1 id="hm-title">{title}</h1>
        <div className="hm-when">
          {event.date?<span>📅 {fmtDateHe(event.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}{event.event_time?` · ${event.event_time.slice(0,5)}`:""}</span>:<span>📅 תאריך לא הוגדר</span>}
          {hebrewDateStr(event.date)&&<span>✡️ {hebrewDateStr(event.date)}</span>}
          {event.venue&&<span>📍 {event.venue}</span>}
        </div>
        {cd?<HmCountdown target={cd.target}/>:<div style={{height:18}}/>}
        {checksPct===100&&<div style={{marginBottom:14,fontSize:15,fontWeight:700,color:"#1F6B43"}}>✓ כל שלבי ההכנה הושלמו</div>}
        {/* אירוע חדש בלי מוזמנים: הצעד הבא הוא להוסיף אותם — זה הכפתור הראשי. ההזמנה משנית עד שיש למי לשלוח */}
        {noGuests?<div className="hm-acts">
          <button className="hm-pill w" onClick={()=>onGo("import")}>➕ הוספת מוזמנים</button>
          <button className="hm-pill g" onClick={()=>onGo("invite")}>💌 צפייה בהזמנה</button>
        </div>:<div className="hm-acts">
          <button className="hm-pill w" onClick={()=>onGo("invite")}>💌 צפייה בהזמנה</button>
          <WaButton event={event} url={inviteUrl} style={{padding:"12px 20px",fontSize:15,borderRadius:100}}/>
          <button className="hm-pill g" onClick={copy}>{copied?"✓ הקישור הועתק":"🔗 העתקת הקישור"}</button>
        </div>}
      </div>
      <div className="hm-invw">
        <button className="hm-inv" onClick={()=>onGo("invite")} aria-label={img?"ההזמנה הדיגיטלית":"תמונת הפתיחה של ההזמנה"}>
          <img src={img||cover} alt="" loading="lazy"/>
          {!img&&<span className="hm-inv-tag">תמונת הפתיחה</span>}
        </button>
        <label className="hm-up" aria-busy={upBusy}>
          {upBusy?"⏳ מעלה...":img?"🔄 החלפת תמונה":"📷 העלאת תמונה"}
          <input type="file" accept="image/*" onChange={onUpload} disabled={upBusy} style={{position:"absolute",width:1,height:1,opacity:0,overflow:"hidden"}}/>
        </label>
        {upErr&&<div role="alert" style={{fontSize:12,color:"#B42318",fontWeight:700,textAlign:"center",maxWidth:190}}>{upErr}</div>}
      </div>
    </section>
  );
}
export function EventHomeStats({ confirmed, declined, pending, total, onOpen }) {
  const p=v=>total>0?Math.round(v/total*100):0;
  const items=[["👥","מוזמנים",total,total?"אנשים ברשימה":"עוד לא נוספו","#EFE6FF"],["✅","מגיעים",confirmed,`${p(confirmed)}% מהמוזמנים`,"#DFF6EC"],["⏳","ממתינים לתשובה",pending,`${p(pending)}% מהמוזמנים`,"#FFF1D6"],["✖️","לא מגיעים",declined,`${p(declined)}% מהמוזמנים`,"#FFE3EE"]];
  return(
    <div className="hm-stats">
      {items.map(([ic,l,v,s,bg])=>(
        <button key={l} className="hm-stat" style={{"--bg":bg}} onClick={onOpen}>
          <span className="t"><i aria-hidden="true">{ic}</i>{l}</span>
          <b><CountUp value={v}/></b><small>{s}</small>
        </button>))}
    </div>
  );
}
export function EventHomeTiles({ event, seated, total, people, tablesCount, onGo }) {
  const list=taskList(event),done=list.filter(t=>t.done).length,late=list.filter(t=>taskLate(t,event)).length;
  const pct=(a,b)=>b>0?Math.min(100,Math.round(a/b*100)):0;
  const tiles=[
    {go:"seating",ic:"🪑",img:"/img/u/1464366400600-7168b8af9bc3_640x360.webp",l:"סידורי הושבה",v:`${seated}/${total}`,s:`${tablesCount} שולחנות · ${total-seated} ממתינים לשיבוץ`,bg:"#FFE3EE",c:"#F0609E",bar:pct(seated,total)},
    {go:"rsvp",ic:"👥",img:"/img/u/1519225421980-715cb0215aed_640x360.webp",l:"ניהול אורחים",v:people??total,s:"הוספה, ייבוא ועריכה",bg:"#EFE6FF",c:"#9B6BFF"},
    {go:"invite",ic:"💌",img:"/img/u/1515934751635-c81c6bc9a2d8_640x360.webp",l:"הזמנה דיגיטלית",v:event.invite_image?"מוכנה":"לעיצוב",s:"עיצוב, נוסח וקישור לאורחים",bg:"#FFE9DC",c:"#FF8A65"},
    {go:"tasks",ic:"📋",img:"/img/u/1506784983877-45594efa4cbe_640x360.webp",l:"משימות",v:`${done}/${list.length}`,s:late?`${late} באיחור`:"הכול בזמן",bg:"#DFF6EC",c:"#3CC8A0",bar:pct(done,list.length)},
  ];
  return(
    <div className="hm-tiles">
      {tiles.map(t=>(
        <button key={t.go} className="hm-tile" style={{"--bg":t.bg,"--c":t.c}} onClick={()=>onGo(t.go)}>
          <div className="art ph" aria-hidden="true"><img src={t.img} alt="" loading="lazy" decoding="async"/><i>{t.ic}</i></div>
          <div className="row"><span>{t.l}</span><b><CountUp value={t.v}/></b></div>
          <small style={t.go==="tasks"&&late?{color:"#B42318"}:undefined}>{t.s}</small>
          {t.bar!==undefined&&<div className="bar" aria-hidden="true"><u style={{width:`${t.bar}%`}}/></div>}
        </button>))}
    </div>
  );
}
// מסך הבית: בחירת חבילה לשליחה מתוזמנת (המחירים מהחבילות הקיימות) + 4 המועדים לפי תאריך האירוע
export function HomeAutoSend({ event, records, onGo, style }) {
  const d0=event.date?new Date(event.date):null;
  const when=off=>{if(!d0)return "לפי תאריך האירוע";const d=new Date(d0);d.setDate(d.getDate()+off);return d.toLocaleDateString("he-IL",{day:"numeric",month:"short"});};
  // רק מה יישלח ומתי. המחירים במסך החבילות
  const sm={background:"#fff",border:"1.5px solid #E9DDF7",color:"#3A2464",borderRadius:100,padding:"9px 16px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"};
  return(
    <section className="hm-auto" aria-labelledby="hm-auto-h" style={style}>
      <h2 id="hm-auto-h">⏰ שליחה אוטומטית</h2>
      <p>ההודעות לאורחים יכולות לצאת לבד, במועדים האלה:</p>
      <div className="hm-auto-tl">
        {SCHEDULE_DEFAULTS.map(r=>(<div key={r.id}><i aria-hidden="true">{r.icon}</i><b>{r.desc}</b><small>{r.label} · {when(r.offset)}</small></div>))}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
        <button type="button" style={sm} onClick={()=>onGo("whatsapp")}>💬 WhatsApp אוטומטי</button>
        <button type="button" style={sm} onClick={()=>onGo("sms")}>📱 תזמון SMS</button>
        <button type="button" style={{...sm,border:"none",background:"none",color:"#9147D6"}} onClick={()=>onGo("packages")}>חבילות ומחירים ←</button>
      </div>
    </section>
  );
}
export function HomeRsvpDonut({ confirmed, declined, pending, total, onOpen }) {
  const a=total>0?confirmed/total*360:0,b=total>0?declined/total*360:0;
  const bg=total>0?`conic-gradient(#25A55F 0 ${a}deg,#E5566F ${a}deg ${a+b}deg,#E8A93A ${a+b}deg 360deg)`:"#F1ECF6";
  return(
    <section className="hm-rsvp" aria-labelledby="hm-rsvp-h">
      <h2 id="hm-rsvp-h">אישורי הגעה <button className="hm-pill s" style={{padding:"8px 16px",fontSize:14}} onClick={onOpen}>לרשימת האורחים</button></h2>
      <div className="hm-donut" style={{background:bg}} role="img" aria-label={`מגיעים ${confirmed}, לא מגיעים ${declined}, ממתינים ${pending}`}>
        <div><b>{total>0?Math.round(confirmed/total*100):0}%</b><small>אישרו הגעה</small></div>
      </div>
      <div className="hm-leg">
        <div><i style={{background:"#25A55F"}}/>מגיעים<b>{confirmed}</b></div>
        <div><i style={{background:"#E8A93A"}}/>ממתינים לתשובה<b>{pending}</b></div>
        <div><i style={{background:"#E5566F"}}/>לא מגיעים<b>{declined}</b></div>
      </div>
    </section>
  );
}
// תחתית מסך הבית: קישורי מתנה ודירוג — מקופלים, כדי שלא יפריעו לעבודה השוטפת
export function HomeMore({ event, children, style }) {
  const biz=eventWords(event).type==="business";
  return(
    <details className="hm-more" style={{marginTop:22,background:"#fff",border:"1px solid #EFE6F7",borderRadius:20,padding:"4px 18px",boxShadow:"0 2px 12px rgba(155,107,255,.06)",...style}}>
      <summary style={{cursor:"pointer",padding:"14px 0",fontSize:15,fontWeight:800,color:"#3A2464"}}>{biz?"⭐ דרגו אותנו":"💝 קישורי מתנה ודירוג"}</summary>
      <div style={{display:"grid",gap:14,paddingBottom:16}}>{children}</div>
    </details>
  );
}
// "הצעד הבא": פעולה אחת שכדאי לעשות עכשיו. רשימת השלבים המלאה מקופלת בתוכו.
// אחרי שכל השלבים הושלמו: תזכורת למי שעוד לא ענה (אם יש)
export function HomeNext({ checks, nextStep, pending, hasGuests, onGo, style }) {
  const done=checks.filter(c=>c.done).length;
  const box={background:"linear-gradient(135deg,#FFF6FA,#F5EEFF)",border:"1.5px solid #EADCF8",borderRadius:22,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",...style};
  const go={background:GRAD,color:"#fff",border:"none",borderRadius:100,padding:"11px 20px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"};
  if(nextStep)return(
    <section aria-labelledby="hm-next-h" style={{...box,display:"block"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <span aria-hidden="true" style={{width:44,height:44,borderRadius:14,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:"0 6px 14px -10px rgba(91,60,140,.5)"}}>👉</span>
        <div style={{flex:"1 1 200px",minWidth:0}}>
          <h2 id="hm-next-h" style={{margin:0,fontSize:13,fontWeight:800,color:"#9147D6"}}>הצעד הבא · {done} מתוך {checks.length} שלבים הושלמו</h2>
          <div style={{fontSize:18,fontWeight:900,color:"#2B1D3F",marginTop:2}}>{nextStep.label}</div>
        </div>
        {nextStep.go&&<button type="button" className="sx-btn sx-btn-primary" onClick={()=>onGo(nextStep.go)} style={go}>להמשיך ←</button>}
      </div>
      <details style={{marginTop:12}}>
        <summary style={{cursor:"pointer",fontSize:14,fontWeight:700,color:"#5E5470"}}>כל השלבים</summary>
        <div style={{marginTop:8}}><HomeSteps checks={checks} nextStep={nextStep} onGo={onGo} bare/></div>
      </details>
    </section>
  );
  if(hasGuests&&pending>0)return(
    <section aria-labelledby="hm-next-h" style={box}>
      <span aria-hidden="true" style={{width:44,height:44,borderRadius:14,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⏳</span>
      <div style={{flex:"1 1 200px",minWidth:0}}>
        <h2 id="hm-next-h" style={{margin:0,fontSize:13,fontWeight:800,color:"#9147D6"}}>הצעד הבא</h2>
        <div style={{fontSize:18,fontWeight:900,color:"#2B1D3F",marginTop:2}}>{pending} אורחים עוד לא ענו</div>
      </div>
      <button type="button" className="sx-btn sx-btn-primary" onClick={()=>onGo("sms")} style={go}>שליחת תזכורת ←</button>
    </section>
  );
  return null;
}
export function HomeSteps({ checks, nextStep, onGo, bare=false }) {
  const done=checks.filter(c=>c.done).length;
  return(
    <section className={`hm-steps${bare?" hm-steps-bare":""}`} aria-labelledby={bare?undefined:"hm-steps-h"} aria-label={bare?"שלבי השלמת האירוע":undefined}>
      {!bare&&<><h2 id="hm-steps-h">השלמת האירוע</h2>
      <div style={{fontSize:14,color:"#5E5470",fontWeight:600}}>{done} מתוך {checks.length} שלבים הושלמו</div></>}
      {checks.map((c,i)=>{const n=c===nextStep;return(
        <button key={i} className={`hm-step${c.done?" d":n?" n":""}`} disabled={c.done} onClick={()=>!c.done&&c.go&&onGo(c.go)}>
          <i aria-hidden="true">{c.done?"✓":i+1}</i>{c.label}{n&&<em>הצעד הבא</em>}
        </button>);})}
    </section>
  );
}

export function PostEventCard({ event, onGo, style }) {
  const [copied,setCopied]=useState(false);
  const d=event.date?new Date(event.date):null;
  const since=d&&!isNaN(d)?Math.floor((Date.now()-d.getTime())/864e5):null;
  if(since===null||since<1||since>30)return null;
  const text=thankYouText(event),biz=eventWords(event).type==="business";
  const copy=()=>{navigator.clipboard?.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});};
  const btn={background:"#fff",color:"#3A2464",border:"1.5px solid #E9DDF7",borderRadius:12,padding:"9px 12px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,textDecoration:"none"};
  return(
    <div style={{background:"linear-gradient(135deg,#FFF7FB,#F6F0FF)",border:"1.5px solid #E9DDF7",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(155,107,255,.08)",...style}}>
      <div style={{fontSize:16,fontWeight:900,color:"#2B1D3F",marginBottom:2}}>{biz?"🙏 האירוע הסתיים! מה עכשיו":"🙏 מזל טוב! מה עושים אחרי האירוע"}</div>
      <div style={{fontSize:12,color:"#6E6585",marginBottom:12}}>הודעת תודה מוכנה לאורחים. אפשר לשלוח אותה בוואטסאפ לקבוצות או לסטטוס.</div>
      <div style={{background:"#fff",borderRadius:12,padding:"10px 12px",fontSize:13,color:"#3E3555",lineHeight:1.7,whiteSpace:"pre-line",marginBottom:10,border:"1px solid #F0E8F8"}}>{text}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
        <a href={waShareUrl(text)} target="_blank" rel="noopener noreferrer" style={{...btn,background:"#25D366",color:"#fff",border:"none"}}><WaIcon size={15}/> שליחה בוואטסאפ</a>
        <button onClick={copy} style={btn}>{copied?"✓ הועתק":"📋 העתקת הנוסח"}</button>
        {!biz&&<button onClick={()=>onGo("gifts")} style={btn}>🎁 רישום מתנות</button>}
        <button onClick={()=>{document.querySelectorAll(".hm-more").forEach(d=>{d.open=true;});setTimeout(()=>document.querySelector(".hm-more .rt, .rt")?.scrollIntoView({behavior:"smooth",block:"center"}),50);}} style={btn}>⭐ דרגו אותנו</button>
      </div>
    </div>
  );
}

// קישורי מתנה (Bit / Paybox) גם במסך הבית — אותם שדות כמו בפרטי האירוע
export function GiftLinksCard({ event, style }) {
  const [bit,setBit]=useState(event.bit_link||""),[pb,setPb]=useState(event.paybox_link||"");
  const [edit,setEdit]=useState(!event.bit_link&&!event.paybox_link);
  const [saving,setSaving]=useState(false),[err,setErr]=useState("");
  if(eventWords(event).type==="business")return null;
  const save=async()=>{
    setSaving(true);setErr("");
    const data={bit_link:bit.trim()||null,paybox_link:pb.trim()||null};
    const{error}=await sb.from("events").update(data).eq("id",event.id);
    setSaving(false);
    if(error){setErr(error.message);return;}
    Object.assign(event,data);
    setEdit(!data.bit_link&&!data.paybox_link);
  };
  const line=giftLine({bit_link:bit,paybox_link:pb});
  const inp={width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const lbl=(bg,ic,t)=><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{width:24,height:24,borderRadius:7,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{ic}</div><div style={{fontSize:13,fontWeight:700,color:"#1A202C"}}>{t}</div></div>;
  return(
    <div style={{background:"#fff",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(155,107,255,.08)",...style}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}>
        <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F"}}>💝 קישורי מתנה דיגיטלית</div>
        {!edit&&<button onClick={()=>setEdit(true)} style={{background:"none",border:"none",color:"#9147D6",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>עריכה</button>}
      </div>
      {edit?(<>
        <div style={{fontSize:13,color:"#5F5675",marginBottom:12,lineHeight:1.6}}>הוסיפו Bit או PayBox: יופיע כפתור מתנה בהזמנה הדיגיטלית ושורת "💝 למתנה" בהודעות.<br/>
          קישור לתשלום (מתחיל ב-https) נפתח ישר באפליקציה. מספר טלפון — האורח מעתיק אותו בלחיצה ומעביר באפליקציה.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          <div>{lbl("#1DB954","💚","Bit")}<input value={bit} onChange={e=>setBit(e.target.value)} placeholder="קישור לתשלום או מספר טלפון" style={inp}/></div>
          <div>{lbl("#6B46C1","💜","PayBox")}<input value={pb} onChange={e=>setPb(e.target.value)} placeholder="קישור לקבוצה או מספר טלפון" style={inp}/></div>
        </div>
        {err&&<div style={{marginTop:10,fontSize:12,color:"#C53030"}}>שגיאה בשמירה: {err}</div>}
        <button onClick={save} disabled={saving} className="sx-btn" style={{width:"100%",marginTop:12,background:"linear-gradient(120deg,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{saving?"שומר...":"שמירה"}</button>
      </>):(
        <div style={{marginTop:8,background:"#F0FFF4",border:"1px solid #9AE6B4",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#276749",wordBreak:"break-all"}}>✅ {line}</div>
      )}
    </div>
  );
}

// כרטיס "המשימות הקרובות" למסך הבית
export function UpcomingTasks({ event, onOpen, style }) {
  // אחרי האירוע: לא מציגים את המשימות שלפניו (עבר תאריך החתונה)
  const list=taskList(event),open=sortTasks(list.filter(t=>!t.done&&!taskPastEvent(t,event)),event).slice(0,3);
  const late=list.filter(t=>taskLate(t,event)).length,done=list.filter(t=>t.done).length;
  return(
    <div style={{background:"#fff",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(155,107,255,.08)",...style}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F"}}>✅ המשימות הקרובות</div>
          <div style={{fontSize:12,color:"#5F5675"}}>{eventPassed(event)?`📅 עבר תאריך ${eventWord(event)}`:`${done} / ${list.length} הושלמו`}{late?<span style={{color:"#B42318",fontWeight:800}}> · {late} באיחור</span>:null}</div>
        </div>
        <button onClick={onOpen} style={{background:"#F6F0FF",border:"none",color:"#9147D6",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>לכל המשימות ←</button>
      </div>
      {open.length?open.map(t=>{const d=taskDue(t,event),lt=taskLate(t,event);return(
        <div key={t.id} onClick={onOpen} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:lt?"#FFF5F5":"#FAFAFA",border:`1px solid ${lt?"#FEB2B2":"#EEE"}`,marginBottom:6,cursor:"pointer"}}>
          <span style={{fontSize:15}}>{(TASK_CATS[t.c]||TASK_CATS.plan)[0]}</span>
          <span style={{flex:1,fontSize:13,fontWeight:700,color:"#2B1D3F"}}>{t.t}</span>
          {d&&<span style={{fontSize:12,color:lt?C.danger:taskCatchUp(t,event)?"#B45309":"#888",fontWeight:lt?800:500,whiteSpace:"nowrap"}}>{taskCatchUp(t,event)?"בהקדם":fmtDue(d)}</span>}
        </div>
      );}):<div style={{fontSize:13,color:"#276749",fontWeight:700}}>{eventPassed(event)?"🎉 אין משימות פתוחות אחרי האירוע":"🎉 כל המשימות הושלמו"}</div>}
    </div>
  );
}

// כרטיס "אישורי הגעה" למסך הראשי של האירוע: השאלה הראשונה של המסך ("כמה אישרו?") כמספר הכי גדול,
// פס אחד של מגיעים / לא מגיעים / ממתינים לפי האחוז האמיתי, ומה לעשות עכשיו
export function HomeRsvpCard({ confirmed, declined, pending, total, onOpen, onShare, style }) {
  const parts=[["מגיעים",confirmed,"#25A55F"],["לא מגיעים",declined,"#E5566F"],["ממתינים לתשובה",pending,"#E8A93A"]];
  const pct=v=>total>0?v/total*100:0;
  return(
    <section aria-labelledby="home-rsvp-h" style={{background:"#fff",borderRadius:20,padding:"22px 24px",border:"1px solid #F0E8F7",display:"flex",flexDirection:"column",...style}}>
      <h2 id="home-rsvp-h" style={{fontSize:16,fontWeight:900,color:"#2B1D3F",margin:"0 0 12px"}}>אישורי הגעה</h2>
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
        <span style={{fontSize:36,fontWeight:900,color:"#2B1D3F",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{confirmed}</span>
        <span style={{fontSize:15,fontWeight:700,color:"#2B1D3F"}}>מגיעים</span>
        <span style={{fontSize:14,color:"#6B6280",fontVariantNumeric:"tabular-nums"}}>מתוך {total} מוזמנים</span>
      </div>
      <div style={{fontSize:13,color:pending?"#8A5A00":"#1F7A4D",fontWeight:700,marginBottom:14}}>
        {total===0?"עוד לא נוספו מוזמנים":pending?`${pending} עוד לא ענו`:"כל המוזמנים ענו"}
      </div>
      {/* פס אחד מחולק לפי האחוז האמיתי, עם מרווח של 2px בין החלקים */}
      <div role="img" aria-label={parts.map(([l,v])=>`${l} ${v}`).join(", ")} style={{display:"flex",gap:2,height:10,borderRadius:99,overflow:"hidden",background:"#F1ECF6",marginBottom:14}}>
        {parts.map(([l,v,c])=>v>0&&<div key={l} style={{width:`${pct(v)}%`,background:c}}/>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
        {parts.map(([l,v,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:8,fontSize:14}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0}}/>
            <span style={{flex:1,color:"#4A4060"}}>{l}</span>
            <span style={{fontWeight:800,color:"#2B1D3F",fontVariantNumeric:"tabular-nums"}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginTop:"auto"}}>
        <button onClick={onOpen} className="sx-btn" style={{flex:1.3,background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>לרשימת האורחים ←</button>
        {onShare&&<button onClick={onShare} className="sx-btn" style={{flex:1,background:"#FBF7FC",color:"#7A3FBF",border:"1.5px solid #E9D9F7",borderRadius:12,padding:"11px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>שיתוף ההזמנה</button>}
      </div>
    </section>
  );
}

// ─── שאלות נוספות באישור ההגעה (מנות, ילדים, אלרגיות, הסעה) ───
// ההגדרה: settings_json.rsvpQ · התשובה של כל אורח: guests.rsvp_extra
export const rsvpExtrasSummary=(event,guests)=>{
  const q=rsvpQOf(event),meals={},allergies=[];let kids=0,transport=0,people=0,answered=0;
  guests.filter(g=>g.rsvp==="confirmed").forEach(g=>{
    const n=g.guest_count||1,x=g.rsvp_extra||{};people+=n;
    if(g.rsvp_extra)answered++;
    let picked=0;Object.entries(x.meals||{}).forEach(([k,v])=>{const c=Math.max(0,+v||0);if(c){meals[k]=(meals[k]||0)+c;picked+=c;}});
    if(q.meal&&picked<n)meals["לא צוין"]=(meals["לא צוין"]||0)+(n-picked);
    kids+=Math.max(0,+x.kids||0);
    if(x.transport)transport+=n;
    if(String(x.allergies||"").trim())allergies.push({name:g.name,text:String(x.allergies).trim()});
  });
  return {q,meals,kids,transport,allergies,people,answered};
};
export function printCateringReport(event,guests){
  const s=rsvpExtrasSummary(event,guests);
  const esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const title=esc(event.name||""),date=event.date?fmtDateHe(event.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"";
  const w=window.open("","_blank");if(!w){alert("הדפדפן חסם את חלון ההדפסה — אפשרו חלונות קופצים לאתר");return;}
  w.document.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>דוח לקייטרינג · ${title}</title><style>
    @font-face{font-family:Heebo;src:url(${window.location.origin}/fonts/heebo-hebrew-wght-normal.woff2) format("woff2");font-weight:100 900;unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:Heebo;src:url(${window.location.origin}/fonts/heebo-latin-wght-normal.woff2) format("woff2");font-weight:100 900}
    body{font-family:Heebo,Arial,sans-serif;color:#2B1D3F;margin:24px}h1{margin:0;font-size:24px}.sub{color:#6E6585;margin:4px 0 18px;font-size:13px}
    h2{font-size:16px;margin:20px 0 8px;border-bottom:2px solid #2B1D3F;padding-bottom:4px}table{border-collapse:collapse;font-size:14px;min-width:300px}td,th{border-bottom:1px solid #EEE6F7;padding:6px 10px;text-align:right}th{background:#F4EEFC}
    .big{font-size:22px;font-weight:900}.bar{margin-bottom:14px}.bar button{font:inherit;font-weight:700;padding:8px 16px;border-radius:8px;border:none;background:#2B1D3F;color:#fff;cursor:pointer}@media print{.bar{display:none}body{margin:10mm}}
  </style></head><body><div class="bar"><button onclick="print()">🖨️ הדפסה</button></div>
  <h1>דוח לקייטרינג ולאולם · ${title}</h1><div class="sub">${date}${event.venue?` · ${esc(event.venue)}`:""} · הודפס ${new Date().toLocaleDateString("he-IL")}</div>
  <div class="big">${s.people} אנשים אישרו הגעה${s.q.kids?` · מתוכם ${s.kids} ילדים`:""}</div>
  ${s.q.meal?`<h2>מנות</h2><table><tr><th>סוג מנה</th><th>כמות</th></tr>${Object.entries(s.meals).map(([k,v])=>`<tr><td>${esc(k)}</td><td><b>${v}</b></td></tr>`).join("")}</table>`:""}
  ${s.q.transport?`<h2>הסעה</h2><div>${s.transport} אנשים צריכים הסעה</div>`:""}
  ${s.q.allergies?`<h2>אלרגיות והערות (${s.allergies.length})</h2>${s.allergies.length?`<table><tr><th>אורח</th><th>אלרגיה / הערה</th></tr>${s.allergies.map(a=>`<tr><td>${esc(a.name)}</td><td>${esc(a.text)}</td></tr>`).join("")}</table>`:"<div>אין</div>"}`:""}
  </body></html>`);
  w.document.close();setTimeout(()=>{try{w.focus();w.print();}catch{}},600);
}
// כרטיס הסיכום במסך אישורי הגעה (רק אם הופעלה לפחות שאלה אחת)
export function RsvpExtrasCard({ event, guests, style }) {
  const s=rsvpExtrasSummary(event,guests);
  if(!anyRsvpQ(s.q))return null;
  const chip={background:"#F7F3FB",borderRadius:100,padding:"4px 10px",fontSize:12,fontWeight:800,color:"#2B1D3F"};
  return(
    <div style={{background:"#fff",borderRadius:16,padding:"14px 16px",boxShadow:"0 2px 10px rgba(155,107,255,.08)",border:"1px solid #EFE6F5",...style}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <div style={{flex:1,fontWeight:900,fontSize:14,color:"#2B1D3F"}}>🍽️ תשובות נוספות מהאורחים <span style={{fontWeight:500,color:"#6E6585",fontSize:12}}>({s.answered} ענו)</span></div>
        <button onClick={()=>printCateringReport(event,guests)} style={{background:"#2B1D3F",color:"#fff",border:"none",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🖨️ דוח לקייטרינג</button>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {s.q.meal&&Object.entries(s.meals).map(([k,v])=><span key={k} style={chip}>{k}: {v}</span>)}
        {s.q.kids&&<span style={chip}>👶 ילדים: {s.kids}</span>}
        {s.q.transport&&<span style={chip}>🚌 הסעה: {s.transport}</span>}
        {s.q.allergies&&<span style={{...chip,background:s.allergies.length?"#FFF5F5":"#F7F3FB",color:s.allergies.length?"#C53030":"#2B1D3F"}}>⚠️ אלרגיות: {s.allergies.length}</span>}
      </div>
    </div>
  );
}

// הדפסת אישורי הגעה: סיכום + רשימה לפי סטטוס (מגיעים / ממתינים / לא מגיעים). only = סטטוס אחד בלבד (או "all")
export function printRsvpList(event,allGuests,tables,only="all"){
  const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const ppl=g=>g.guest_count||1;
  const statusOf=g=>g.rsvp==="confirmed"||g.rsvp==="declined"?g.rsvp:"pending";
  const tableOf=g=>{const t=tables.find(t=>t.id===g.table_id);return t?tableLabel(event.settings_json?.table_nums?.[t.id],t.name):"";};
  const groups=[["confirmed","✓ מגיעים"],["pending","⏳ ממתינים לתשובה"],["declined","✗ לא מגיעים"]].filter(([k])=>only==="all"||only===k);
  const sum=k=>allGuests.filter(g=>statusOf(g)===k).reduce((n,g)=>n+ppl(g),0);
  const sections=groups.map(([k,label])=>{
    const list=allGuests.filter(g=>statusOf(g)===k).sort((a,b)=>a.name.localeCompare(b.name,"he"));
    if(!list.length)return `<h2>${label} (0)</h2><p class="empty">אין</p>`;
    return `<h2>${label} · ${list.length} רשומות · ${sum(k)} אנשים</h2><table><thead><tr><th>#</th><th>שם</th><th>טלפון</th><th>קטגוריה</th><th class="c">אנשים</th>${k==="declined"?"":"<th>שולחן</th>"}</tr></thead><tbody>${
      list.map((g,i)=>`<tr><td class="c">${i+1}</td><td>${esc(g.name)}</td><td dir="ltr">${esc(g.phone||"")}</td><td>${esc(g.relation&&g.relation!=="ללא שיוך"?g.relation:"")}</td><td class="c">${ppl(g)}</td>${k==="declined"?"":`<td>${esc(tableOf(g))}</td>`}</tr>`).join("")
    }</tbody></table>`;
  }).join("");
  const title=esc(event.name||"אישורי הגעה"),date=event.date?fmtDateHe(event.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"";
  const w=window.open("","_blank");if(!w){alert("הדפדפן חסם את חלון ההדפסה — אפשרו חלונות קופצים לאתר");return;}
  w.document.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>אישורי הגעה · ${title}</title><style>
    @font-face{font-family:Heebo;src:url(${window.location.origin}/fonts/heebo-hebrew-wght-normal.woff2) format("woff2");font-weight:100 900;unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:Heebo;src:url(${window.location.origin}/fonts/heebo-latin-wght-normal.woff2) format("woff2");font-weight:100 900}
    *{box-sizing:border-box}body{font-family:Heebo,Arial,sans-serif;color:#2B1D3F;margin:24px}
    h1{margin:0;font-size:24px}.sub{color:#6E6585;margin:4px 0 14px;font-size:13px}
    .sum{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px}.sum div{border:1.5px solid #CFC3E0;border-radius:10px;padding:8px 14px;font-size:13px}.sum b{font-size:18px;display:block}
    h2{font-size:16px;margin:24px 0 8px;border-bottom:2px solid #2B1D3F;padding-bottom:4px;break-after:avoid}
    table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #EEE6F7;padding:5px 8px;text-align:right}th{background:#F4EEFC}td.c,th.c{text-align:center}tr{break-inside:avoid}
    .empty{color:#8A7FA0;font-size:12px}.bar{margin-bottom:14px}.bar button{font:inherit;font-weight:700;padding:8px 16px;border-radius:8px;border:none;background:#2B1D3F;color:#fff;cursor:pointer}
    @media print{.bar{display:none}body{margin:10mm}}
  </style></head><body><div class="bar"><button onclick="print()">🖨️ הדפסה</button></div>
  <h1>אישורי הגעה · ${title}</h1><div class="sub">${date}${event.venue?` · ${esc(event.venue)}`:""} · הודפס ${new Date().toLocaleDateString("he-IL")}</div>
  <div class="sum"><div><b>${sum("confirmed")}</b>מגיעים</div><div><b>${sum("pending")}</b>ממתינים</div><div><b>${sum("declined")}</b>לא מגיעים</div><div><b>${allGuests.reduce((n,g)=>n+ppl(g),0)}</b>סה״כ מוזמנים</div></div>
  ${sections}</body></html>`);
  w.document.close();setTimeout(()=>{try{w.focus();w.print();}catch{}},600);
}

export function MobileRsvpScreen({ guests, tables, event, sb, setGuests, setTables, setModal, onImport }) {
  const allGuests=[...guests,...tables.flatMap(t=>t.guests||[])];
  const confirmed=allGuests.filter(g=>g.rsvp==="confirmed").reduce((s,g)=>s+(g.guest_count||1),0);
  const declined=allGuests.filter(g=>g.rsvp==="declined").reduce((s,g)=>s+(g.guest_count||1),0);
  const [statusModal,setStatusModal]=useState(null);
  const [editModal,setEditModal]=useState(null);
  const [editForm,setEditForm]=useState({});
  const openEdit=(g)=>{setEditModal(g);setEditForm({name:g.name||"",phone:g.phone||"",guest_count:g.guest_count||1,relation:g.relation||"ללא שיוך"});};
  const saveEdit=async()=>{
    const form={...editForm,...splitNamePhone(editForm.name,editForm.phone)};
    const res=await saveGuestRow(editModal.id,form);
    if(!res.ok)return;
    const applied=res.relationSkipped?(({relation,...r})=>r)(form):form;
    setGuests(gs=>gs.map(x=>x.id===editModal.id?{...x,...applied}:x));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(x=>x.id===editModal.id?{...x,...applied}:x)})));
    setEditModal(null);
  };
  const [search,setSearch]=useState("");
  const filtered=allGuests.filter(g=>!search||g.name?.includes(search)||g.phone?.includes(search));

  const updateRsvp=async(g,stage)=>{
    const patch=stagePatch(stage);
    const{error}=await sb.from("guests").update(patch).eq("id",g.id);
    if(error){alert("❌ לא נשמר: "+error.message);return;}
    setGuests(gs=>gs.map(x=>x.id===g.id?{...x,...patch}:x));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(x=>x.id===g.id?{...x,...patch}:x)})));
    setStatusModal(null);
  };

  const rsvpColor=(r)=>r==="confirmed"?"#276749":r==="declined"?"#C53030":"#888";
  const rsvpBg=(r)=>r==="confirmed"?"#F0FFF4":r==="declined"?"#FFF5F5":"#F7F7F7";
  const rsvpLabel=(r)=>r==="confirmed"?"✓ מגיע":r==="declined"?"✗ לא מגיע":"⏳ ממתין";

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:80}}>

      {/* מודל עריכת אורח */}
      {editModal&&<div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setEditModal(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,direction:"rtl",maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{fontSize:17,fontWeight:900,color:"#1a1a1a"}}>עריכת אורח</div>
            <button onClick={()=>setEditModal(null)} style={{width:30,height:30,borderRadius:"50%",border:"1px solid #eee",background:"#f5f5f5",cursor:"pointer",fontSize:16,fontWeight:900}}>×</button>
          </div>

          {/* שם */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:6}}>שם מלא</div>
            <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}
              style={{width:"100%",border:"1.5px solid #e5e5e5",borderRadius:10,padding:"11px 14px",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>

          {/* טלפון */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:6}}>מספר טלפון</div>
            <input value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))} type="tel" dir="ltr"
              style={{width:"100%",border:"1.5px solid #e5e5e5",borderRadius:10,padding:"11px 14px",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",textAlign:"right"}}/>
          </div>

          {/* כמות מגיעים */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:6}}>כמות מגיעים</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>setEditForm(f=>({...f,guest_count:Math.max(1,(f.guest_count||1)-1)}))}
                style={{width:36,height:36,borderRadius:10,border:"1.5px solid #e5e5e5",background:"#f9f9f9",fontSize:18,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
              <div style={{flex:1,textAlign:"center",fontSize:20,fontWeight:900,color:"#3A2464"}}>{editForm.guest_count||1}</div>
              <button onClick={()=>setEditForm(f=>({...f,guest_count:(f.guest_count||1)+1}))}
                style={{width:36,height:36,borderRadius:10,border:"1.5px solid #e5e5e5",background:"#f9f9f9",fontSize:18,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>
          </div>

          {/* קטגוריה */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:8}}>קטגוריה</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {Object.keys(RELATION_COLORS).map(r=>(
                <button key={r} onClick={()=>setEditForm(f=>({...f,relation:r}))}
                  style={{padding:"7px 14px",borderRadius:50,border:`2px solid ${editForm.relation===r?RELATION_COLORS[r]:"#e5e5e5"}`,
                    background:editForm.relation===r?RELATION_COLORS[r]:"#fff",
                    color:editForm.relation===r?"#fff":"#333",
                    fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* כפתורים */}
          <button onClick={saveEdit}
            style={{width:"100%",background:"#3D5475",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
            💾 שמור שינויים
          </button>
          <button onClick={()=>{setStatusModal(editModal);setEditModal(null);}}
            style={{width:"100%",background:"#EEF2FF",color:"#3D5475",border:"1px solid #E9D9F7",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
            ✏️ שנה סטטוס הגעה
          </button>
          <button onClick={async()=>{if(!window.confirm("למחוק?"))return;await sb.from("guests").delete().eq("id",editModal.id);setGuests(gs=>gs.filter(x=>x.id!==editModal.id));setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).filter(x=>x.id!==editModal.id)})));setEditModal(null);}}
            style={{width:"100%",background:"#FFF5F5",color:"#C53030",border:"1px solid #FED7D7",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            🗑️ מחק אורח
          </button>
        </div>
      </div>}

      {/* מודל שינוי סטטוס */}
      {statusModal&&<div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setStatusModal(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:360,direction:"rtl"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:900}}>שינוי מצב הגעה</div>
            <button onClick={()=>setStatusModal(null)} style={{width:30,height:30,borderRadius:"50%",border:"1px solid #eee",background:"#f5f5f5",cursor:"pointer",fontSize:16}}>×</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {RSVP_STAGES.map(([val,label])=>{const on=stageOf(statusModal)===val;return(
              <button key={val} onClick={()=>updateRsvp(statusModal,val)} aria-pressed={on} style={{background:on?"#3A2464":"#f5f5f5",color:on?"#fff":"#333",border:"1.5px solid #e5e5e5",borderRadius:50,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
            );})}
          </div>
        </div>
      </div>}

      {/* סטטיסטיקות */}
      <div style={{background:"#fff",padding:"16px 16px 12px",borderBottom:"1px solid #eee"}}>
        {/* אנשים (לפי מספר האורחים בכל רשומה), כמו במחשב — לא מספר הרשומות */}
        {(()=>{const ppl=g=>g.guest_count||1,totalP=allGuests.reduce((s,g)=>s+ppl(g),0),pendP=allGuests.filter(g=>!g.rsvp||g.rsvp==="pending").reduce((s,g)=>s+ppl(g),0);return(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,textAlign:"center",marginBottom:12,fontVariantNumeric:"tabular-nums"}}>
          {[[confirmed,"מגיעים","#1F7A4D"],[declined,"לא מגיעים","#C53030"],[pendP,"ממתינים","#8A5A00"],[totalP,"מוזמנים","#2B1D3F"]].map(([v,l,c])=>(
            <div key={l}><div style={{fontSize:26,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:12,color:"#4A4060",fontWeight:700,marginTop:3}}>{l}</div></div>
          ))}
        </div>);})()}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setModal("addGuest")} style={{flex:1,background:"#3D5475",color:"#fff",border:"none",borderRadius:50,padding:"10px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>➕ הוסף מוזמן</button>
        </div>
      </div>

      <RsvpExtrasCard event={event} guests={allGuests} style={{margin:"10px 16px 0"}}/>

      {/* חיפוש + ייבוא אורחים */}
      <div style={{padding:"10px 16px",display:"flex",gap:8}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש..." style={{flex:1,minWidth:0,border:"1px solid #e5e5e5",borderRadius:50,padding:"9px 16px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#f9f9f9"}}/>
        {onImport&&<button onClick={onImport} style={{flexShrink:0,background:"#fff",color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:50,padding:"8px 14px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>📊 ייבוא</button>}
        <button onClick={()=>printRsvpList(event,allGuests,tables)} aria-label="הדפסת אישורי הגעה" style={{flexShrink:0,background:"#fff",color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:50,padding:"8px 14px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>🖨️ הדפס</button>
      </div>

      {/* טבלה */}
      <div style={{background:"#fff",margin:"0 12px",borderRadius:14,overflow:"hidden",border:"1px solid #eee",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        {/* שורה בשתי שורות טקסט: השם ומספר האורחים, והטלפון מתחת (במקום עמודה צרה של 10px); הסטטוס בצד */}
        {filtered.map((g,i)=>(
          <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",minHeight:56,borderBottom:i<filtered.length-1?"1px solid #F2EEF6":"none"}}>
            <button onClick={()=>openEdit(g)} style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10,background:"none",border:"none",padding:0,cursor:"pointer",fontFamily:"inherit",textAlign:"right"}}>
              <span style={{width:32,height:32,borderRadius:"50%",background:RELATION_COLORS[g.relation]||"#9B8CB5",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{ini(g.name)}</span>
              <span style={{minWidth:0}}>
                <span style={{display:"block",fontSize:14,fontWeight:700,color:"#1F1730",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}{(g.guest_count||1)>1&&<span style={{fontWeight:500,color:"#5F5675"}}> · {g.guest_count} אורחים</span>}</span>
                <span style={{display:"block",fontSize:12,color:"#5F5675",direction:"ltr",textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{g.phone||"—"}</span>
              </span>
            </button>
            <button onClick={()=>setStatusModal(g)} aria-label={`שינוי מצב ההגעה של ${g.name}`} style={{flex:"none",background:"none",border:"none",padding:"6px 0",cursor:"pointer",fontFamily:"inherit"}}>
              {(()=>{const st=rsvpStage(g);return <span style={{fontSize:12,fontWeight:700,color:st.c,background:st.bg,borderRadius:50,padding:"4px 10px",whiteSpace:"nowrap"}}>{st.t}</span>;})()}
            </button>
          </div>
        ))}
        {filtered.length===0&&<div style={{padding:20,textAlign:"center",color:"#5F5675",fontSize:14}}>לא נמצאו אורחים</div>}
      </div>
      <div style={{textAlign:"center",fontSize:13,color:"#5F5675",margin:"8px 0 16px"}}>{filtered.length} מתוך {allGuests.length} רשומות</div>
    </div>
  );
}

// מסכים שזוג עם גישה מוגבלת לא רואה (הודעות וחבילות נשארות אצל בעל האירוע / המפיק)
export const COUPLE_HIDDEN=["sms","whatsapp","packages"];
// כל הכלים פתוחים בהרשמה. רק סידורי הושבה (והושבת AI) מעל FREE_SEATING_LIMIT מוזמנים דורשים את הבסיסית (₪100).
// הודעות SMS / WhatsApp נקנות בנפרד לפי כמות, בלי קשר לחבילה
export const guestPeople=list=>(list||[]).reduce((n,g)=>n+(g.guest_count||1),0);
export const screenLocked=(id,userPackages,people=0)=>{
  if(id==="seating"||id==="ai")return people>FREE_SEATING_LIMIT&&!hasBasicPkg(userPackages);
  return false;
};
// המסך האחרון (ותצוגת ההושבה) נשמר בדפדפן כדי שרענון יחזיר לאותו מקום באותו אירוע
export const takePendingScreen=()=>{const v=PENDING_SCREEN.v;PENDING_SCREEN.v=null;return v;};
export function SeatingApp({ user, event, onBack, onUpdate, onLogout, onHome }) {
  const updateEvent=async(raw)=>{const data=eventRow(raw);const{error}=await sb.from("events").update(data).eq("id",event.id);if(error){alert("השמירה נכשלה: "+error.message);return;}onUpdate?.(data);};
  const logout=onLogout||(async()=>{await sb.auth.signOut();});
  const [importMap,setImportMap]=useState(null);
  const [tables,setTables]=useState([]),[guests,setGuests]=useState([]),[selected,setSelected]=useState(null),[view,setView]=useState(()=>readLastScreen(event.id)?.view||"list"),[screen,setScreen]=useState(()=>readLastScreen(event.id)?.screen||"home"),[modal,setModal]=useState(null),[editGuestData,setEditGuestData]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[search,setSearch]=useState(""),[newGuest,setNewGuest]=useState(""),[mobile,setMobile]=useState(isMobile());
  // "הזמנה דיגיטלית" נפתחת בתוך פרטי האירוע (אין מסך נפרד)
  useEffect(()=>{if(screen==="invite")setScreen("settings");},[screen]);
  // מעבר למסך אחר (או כניסה לאירוע) תמיד מתחיל מלמעלה — בנייד הגלילה של המסך הקודם נשארה והמסך החדש נפתח באמצע/בתחתית
  useEffect(()=>{try{window.scrollTo(0,0);}catch{}},[screen]);
  // להושבה: רק מי שלא סימן "לא מגיע" (מי שלא מגיע לא מופיע ברשימת הממתינים ולא נכנס להושבה האוטומטית)
  const toSeat=guests.filter(g=>g.rsvp!=="declined");
  const declinedGuests=guests.filter(g=>g.rsvp==="declined"),[showDeclined,setShowDeclined]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [zoom,setZoom]=useState(1);
  const mapBoxRef=useRef(null);
  const [,setBoxTick]=useState(0);
  // ─── מצלמת המפה: זום + הזזה (pan). האולם הוא משטח פתוח; המצלמה מחליטה מה רואים ───
  const [pan,setPan]=useState({x:0,y:0});
  const panRef=useRef(pan);panRef.current=pan;
  const zoomRef=useRef(zoom);zoomRef.current=zoom;
  const hallLayerRef=useRef(null);
  const floorRef=useRef(null),gridLayerRef=useRef(null); // רצפת האולם והרשת — מתעדכנות ישירות כשהאולם גדל בזמן גרירה
  const ZMIN=.3,ZMAX=1.8;
  // גבולות כל שולחן ביחס לנקודת המיקום שלו (כמו שהוא מצויר ב-TableNode)
  const tableBox=t=>t.type==="knight"?[t.x-16,t.y-16,t.x+196,t.y+76]:t.type==="rect"?[t.x-18,t.y-18,t.x+128,t.y+98]:[t.x,t.y,t.x+158,t.y+158];
  // ─── אלמנטים באולם (במה, רחבה, בר, כניסה...) — settings_json.hall.items ───
  // אירוע ישן בלי items: במה/בר/כניסה במיקום שנשמר (hall.stage/bar/entrance) או ליד השולחנות.
  // אולם חדש (בלי שולחנות): במה, רחבה, בר וכניסה במקום קבוע
  const fixDefRef=useRef(null);
  useEffect(()=>{fixDefRef.current=null;},[event.id,tables.length]);
  const hallItems=()=>{
    const h=hallRef.current||{};
    if(Array.isArray(h.items))return h.items;
    if(fixDefRef.current)return fixDefRef.current;
    let items;
    if(!tables.length&&!h.stage){
      // אולם חדש: כמו ההדגמה בדף הבית — במה, שולחן חתן-כלה, רחבה, בר וכניסה
      const [W,H]=HALL_SIZES.m,K=HALL_ITEM_KINDS;
      items=[{id:"stage",kind:"stage",x:W/2-K.stage.w/2,y:40,w:K.stage.w,h:K.stage.h},{id:"head",kind:"head",x:W/2-K.head.w/2,y:134,w:K.head.w,h:K.head.h},
        {id:"dance",kind:"dance",x:W/2-K.dance.w/2,y:232,w:K.dance.w,h:K.dance.h},{id:"bar",kind:"bar",x:W-230,y:40,w:K.bar.w,h:K.bar.h},{id:"entrance",kind:"entrance",x:W/2-K.entrance.w/2,y:H-80,w:K.entrance.w,h:K.entrance.h}];
    }else{
      const bs=tables.map(tableBox);
      const [x0,y0,x1,y1]=bs.length?[Math.min(...bs.map(b=>b[0])),Math.min(...bs.map(b=>b[1])),Math.max(...bs.map(b=>b[2])),Math.max(...bs.map(b=>b[3]))]:[0,120,800,420];
      const cx=(x0+x1)/2,at=(k,dx,dy)=>h[k]&&typeof h[k].x==="number"?h[k]:{x:Math.round(cx+dx),y:Math.round(dy)};
      const s=at("stage",-150,y0-92),b=at("bar",190,y0-86),e=at("entrance",-75,y1+22);
      items=[{id:"stage",kind:"stage",x:s.x,y:s.y,w:300,h:70},{id:"bar",kind:"bar",x:b.x,y:b.y,w:130,h:56},{id:"entrance",kind:"entrance",x:e.x,y:e.y,w:150,h:34}];
    }
    if(!loading)fixDefRef.current=items;
    return items;
  };
  const itemBox=i=>[i.x,i.y,i.x+i.w,i.y+i.h];
  // המלבן שמכיל את כל השולחנות והאלמנטים
  const contentBox=(list=tables,items=hallItems())=>{
    const bs=[...list.map(tableBox),...items.map(itemBox)];
    if(!bs.length)return [0,0,0,0];
    return [Math.min(...bs.map(b=>b[0])),Math.min(...bs.map(b=>b[1])),Math.max(...bs.map(b=>b[2])),Math.max(...bs.map(b=>b[3]))];
  };
  // ─── גודל האולם: קבוע, עם תקרה (ענק). "אוטומטי" = הגודל הקטן שמכיל את כל מה שבאולם ───
  // הכל נמצא בתוך [0,0,W,H]; שולחנות ואלמנטים לא נגררים החוצה, והמצלמה לא יוצאת מהאולם
  const hallDims=(size=(hallRef.current||{}).size||"auto")=>{
    const [,,x1,y1]=contentBox();
    // גודל קבוע. (אירוע ישן שחורג ממנו — מגדילים כדי לא להסתיר שולחנות; גרירה רגילה לא יכולה לחרוג)
    if(HALL_SIZES[size])return [Math.max(HALL_SIZES[size][0],x1+HALL_MARGIN/2),Math.max(HALL_SIZES[size][1],y1+HALL_MARGIN/2)];
    const need=[x1+HALL_MARGIN/2,y1+HALL_MARGIN/2];
    const fit=HALL_SIZE_ORDER.map(k=>HALL_SIZES[k]).find(([w,h])=>w>=need[0]&&h>=need[1]);
    return fit||[Math.max(need[0],HALL_SIZES.xl[0]),Math.max(need[1],HALL_SIZES.xl[1])]; // אירוע ישן שחורג — לא חותכים
  };
  // מה שרואים: השולחנות והאלמנטים + שוליים, מורחב ליחס של המסך — בזום "כל האולם" זה ממלא את כל המפה.
  // עוד שולחנות = שטח גדול יותר = זום קטן יותר. עם מעט שולחנות הזום לא עולה על 1 (לא ענק)
  // שוליים: מקום לכפתורי הזום (משמאל למעלה) ולכותרת (מימין למטה) בלי לכסות שולחנות
  const HALL_PAD=90,GRID=200,HALL_EXTRA_DEF={w:2,h:0}; // w/h: ריבועים נוספים בסך הכל (חצי מכל צד): ברירת מחדל ריבוע פנוי אחד מימין ואחד משמאל
  const hallRect=()=>{
    const el=mapBoxRef.current,cw=el?.clientWidth||1000,ch=Math.max(el?.clientHeight||600,1);
    const [x0,y0,x1,y1]=contentBox();
    // האולם עוטף את מה שיש בו (לא נמתח לפרופורציות של המסך — אחרת הוא יוצא רחב וריק). להגדלה: כפתורי "גודל האולם"
    const w=Math.max(x1-x0+2*HALL_PAD,600),h=Math.max(y1-y0+2*HALL_PAD,400);
    const cx=(x0+x1)/2,cy=(y0+y1)/2;
    // "גודל האולם": עוד ריבועים ריקים משני הצדדים (הבמה נשארת באמצע). ברירת מחדל: 2 ריבועים מכל צד
    const ex=(hallRef.current||{}).extra||HALL_EXTRA_DEF,EW=(ex.w||0)*GRID,EH=(ex.h||0)*GRID;
    return [cx-w/2-EW/2,cy-h/2-EH/2,cx+w/2+EW/2,cy+h/2+EH/2];
  };
  // גרירה בתוך האולם: off = גבולות הצורה ביחס לנקודת המיקום
  const clampIn=(x,y,off,r=hallRect())=>({x:Math.round(Math.min(r[2]-off[2],Math.max(r[0]-off[0],x))),y:Math.round(Math.min(r[3]-off[3],Math.max(r[1]-off[1],y)))});
  const tableOff=type=>tableBox({x:0,y:0,type});
  // ─── רשת ריבועים במפה: שולחן שנגרר נכנס למרכז הריבוע הקרוב (הפנוי). hall.grid=false מכבה ───
  const gridOn=()=>(hallRef.current||{}).grid!==false;
  const snapToGrid=(t,x,y,hr)=>{
    const o=tableOff(t.type),ox=(o[0]+o[2])/2,oy=(o[1]+o[3])/2;
    // הרשת מעוגנת לנקודה 0,0 של המפה (לא לגבולות האולם שמשתנים בזום), כך שהריבועים זזים יחד עם השולחנות
    const cx=x+ox,cy=y+oy,col=Math.floor(cx/GRID),row=Math.floor(cy/GRID);
    // ריבוע תפוס = השולחן שם היה נוגע בשולחן אחר או בבמה/רחבה (לפי הגודל האמיתי)
    const others=[...tables.filter(o2=>o2.id!==t.id).map(tableBox),...hallItems().map(itemBox)];
    const hits=(x0,y0)=>{const b=[x0+o[0]-6,y0+o[1]-6,x0+o[2]+6,y0+o[3]+6];return others.some(q=>b[0]<q[2]&&b[2]>q[0]&&b[1]<q[3]&&b[3]>q[1]);};
    let best=null,bd=Infinity;
    for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){
      const c=col+dc,r=row+dr;
      const px=c*GRID+GRID/2,py=r*GRID+GRID/2;
      if(px<hr[0]||py<hr[1]||px>hr[2]||py>hr[3]||hits(px-ox,py-oy))continue;
      const d=Math.hypot(px-cx,py-cy);if(d<bd){bd=d;best={px,py,c,r};}
    }
    if(!best)return {...clampIn(x,y,o,hr),cell:null};
    // בלי clampIn: גבולות האולם על המסך משתנים בזום, והשולחן חייב להישאר בדיוק במרכז הריבוע
    return {x:Math.round(best.px-ox),y:Math.round(best.py-oy),cell:[best.c*GRID,best.r*GRID]};
  };
  // שולחן "ברשת" = המרכז שלו בדיוק במרכז ריבוע
  const onGrid=t=>{const o=tableOff(t.type),cx=t.x+(o[0]+o[2])/2,cy=t.y+(o[1]+o[3])/2,m=v=>((v%GRID)+GRID)%GRID;return Math.abs(m(cx)-GRID/2)<1&&Math.abs(m(cy)-GRID/2)<1;};
  // כל השולחנות לריבועים: מה שכבר בריבוע נשאר, השאר עובר לריבוע הפנוי הקרוב (לא על שולחן אחר, במה או רחבה).
  // שולחן נעול לא זז. מחזיר רק את מה שצריך להזיז: {id:{x,y}}
  const gridLayout=()=>{
    const placed=[...hallItems().map(itemBox),...tables.filter(t=>lockedTables.has(t.id)).map(tableBox)];
    const free=tables.filter(t=>!lockedTables.has(t.id)).sort((a,b)=>(onGrid(b)?1:0)-(onGrid(a)?1:0));
    const out={};
    for(const t of free){
      const o=tableOff(t.type),ox=(o[0]+o[2])/2,oy=(o[1]+o[3])/2;
      const cx=t.x+ox,cy=t.y+oy,col=Math.floor(cx/GRID),row=Math.floor(cy/GRID);
      let best=null,bd=Infinity;
      for(let dr=-4;dr<=4;dr++)for(let dc=-4;dc<=4;dc++){
        const c=col+dc,r=row+dr;
        const x=c*GRID+GRID/2-ox,y=r*GRID+GRID/2-oy,b=[x+o[0]-6,y+o[1]-6,x+o[2]+6,y+o[3]+6];
        if(placed.some(q=>b[0]<q[2]&&b[2]>q[0]&&b[1]<q[3]&&b[3]>q[1]))continue;
        const d=Math.hypot(c*GRID+GRID/2-cx,r*GRID+GRID/2-cy);if(d<bd){bd=d;best={x:Math.round(x),y:Math.round(y)};}
      }
      if(!best){placed.push(tableBox(t));continue;}
      placed.push(tableBox({...t,...best}));
      if(best.x!==t.x||best.y!==t.y)out[t.id]=best;
    }
    return out;
  };
  const snapCellRef=useRef(null);
  // המצלמה תחומה לאולם: קטן מהמסך — במרכז; גדול — אי אפשר לגלול מעבר לקירות
  const clampCam=(p,z=zoomRef.current)=>{
    const el=mapBoxRef.current;if(!el)return p;
    const [x0,y0,x1,y1]=hallRect();
    const ax=(lo,hi,size,start)=>{const len=(hi-lo)*z,a=lo*z+start;const S=90,want=len<=size?(size-len)/2:Math.min(S,Math.max(size-len-S,a)); /* S: קצת מעבר לקיר, כדי שהכפתורים והכרטיס בקצה לא יסתירו שולחנות */return start+(want-a);};
    return {x:Math.round(ax(x0,x1,el.clientWidth,p.x)),y:Math.round(ax(y0,y1,el.clientHeight,p.y))};
  };
  // הזום הכי רחוק = כל האולם ממלא את המפה
  const hallFillZoom=()=>{
    const el=mapBoxRef.current;if(!el)return ZMIN;
    const [x0,y0,x1,y1]=hallRect();
    return +Math.min(ZMAX,el.clientWidth/(x1-x0),el.clientHeight/(y1-y0)).toFixed(4);
  };
  // אפשר להקטין עוד קצת מ"כל האולם ממלא את המפה", כדי שכפתורי הזום והכרטיס שבתחתית לא יסתירו את מה שבקצוות
  const minZoom=()=>+(hallFillZoom()*.85).toFixed(4);
  // מצייר את המצלמה ישר על ה-DOM (חלק בזמן גרירה), ושומר ל-state בסוף
  const paintCam=(p=panRef.current,z=zoomRef.current)=>{
    if(hallLayerRef.current)hallLayerRef.current.style.transform=`translate(${p.x}px,${p.y}px) scale(${z})`;
  };
  const setCam=(p,z=zoomRef.current)=>{p=clampCam(p,z);panRef.current=p;zoomRef.current=z;paintCam(p,z);setPan(p);setZoom(z);};
  // המצב האוטומטי (פתיחה, הוספת/מחיקת שולחן, שינוי גודל חלון): כל האולם על המסך — אבל לא פחות מ-OPEN_ZOOM,
  // כי מתחת לזה השולחנות קטנים מדי. אז מראים את החלק העליון של האולם (במה ורחבה) במרכז, והשאר בהזזה.
  // all=true (כפתור ⤢): כל האולם על המסך בכל גודל
  const OPEN_ZOOM=.65;
  const manualZoomRef=useRef(false);
  // במסך מלא: השולחנות והאלמנטים ממלאים את כל המסך (גם כשיש מעט שולחנות — עד פי 1.6)
  const mapFullRef=useRef(false);
  const fitZoom=(all=false)=>{
    const el=mapBoxRef.current;if(!el)return;
    manualZoomRef.current=false;
    if(!all){
      // שוליים: משמאל כפתורי הזום וגודל האולם, למטה תווית השמירה — שלא יסתירו שולחנות
      // רגיל: כל האולם (כולל הריבועים הפנויים מסביב) על המסך. מסך מלא: השולחנות והאלמנטים ממלאים את המסך
      const full=mapFullRef.current,[cx0,cy0,cx1,cy1]=full?contentBox():hallRect(),cw=el.clientWidth,ch=el.clientHeight,IL=full?140:0,IR=full?28:0,IT=full?28:0,IB=full?84:0;
      if(cx1>cx0&&cy1>cy0){
        const zc=Math.min(full?1.6:1.25,ZMAX,(cw-IL-IR)/(cx1-cx0),(ch-IT-IB)/(cy1-cy0));
        if(full||zc>=.3){ // אולם ענק (פחות מ-30%) — החלק העליון של האולם וגלילה
          const zf=+Math.max(minZoom(),zc).toFixed(4);
          setCam({x:IL+(cw-IL-IR)/2-(cx0+cx1)/2*zf,y:IT+(ch-IT-IB)/2-(cy0+cy1)/2*zf},zf);return;
        }
      }
    }
    const [x0,y0,x1]=hallRect(),zFit=hallFillZoom(),z=all?zFit:+Math.max(zFit,Math.min(OPEN_ZOOM,ZMAX)).toFixed(4);
    setCam({x:el.clientWidth/2-(x0+x1)/2*z,y:-y0*z},z);
  };
  // זום סביב נקודה במסך (ברירת מחדל: מרכז המפה)
  const zoomAt=(factor,cx,cy)=>{
    const el=mapBoxRef.current;if(!el)return;
    manualZoomRef.current=true;
    if(cx==null){cx=el.clientWidth/2;cy=el.clientHeight/2;}
    const z0=zoomRef.current,z=+Math.min(ZMAX,Math.max(minZoom(),z0*factor)).toFixed(3),p=panRef.current;
    if(z===z0&&factor<1)return; // כבר בזום הכי רחוק
    setCam({x:cx-(cx-p.x)*z/z0,y:cy-(cy-p.y)*z/z0},z);
  };
  const zoomBy=d=>zoomAt(d>0?1.15:1/1.15);
  const panBy=(dx,dy)=>{manualZoomRef.current=true;const p=panRef.current;setCam({x:p.x+dx,y:p.y+dy});};
  // גרירת הרקע מזיזה את המפה; לחיצה בלי תזוזה מבטלת בחירת שולחן
  const startPan=e=>{
    if(e.button!==0)return;
    const el=mapBoxRef.current,sx=e.clientX,sy=e.clientY,p0=panRef.current;let moved=false,raf=0,p=p0;
    el.style.cursor="grabbing";
    const mv=me=>{const dx=me.clientX-sx,dy=me.clientY-sy;if(!moved&&Math.abs(dx)+Math.abs(dy)<4)return;moved=true;p=clampCam({x:p0.x+dx,y:p0.y+dy});panRef.current=p;if(!raf)raf=requestAnimationFrame(()=>{raf=0;paintCam(p);});};
    const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);el.style.cursor="";
      if(moved){manualZoomRef.current=true;setPan(p);}else{setSelected(null);setSelItem(null);}};
    window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
  };
  // המאזינים למטה נרשמים פעם אחת, אז הם קוראים לגרסה העדכנית של פונקציות המצלמה (עם גודל האולם הנוכחי),
  // ולא לעותק מהרגע שנרשמו — אחרת שינוי גודל חלון/סיבוב טאבלט מתאים את המפה לאולם הישן
  const camFnRef=useRef({});
  camFnRef.current={fitZoom,zoomAt,panBy,setCam,minZoom};
  useEffect(()=>{
    if(screen!=="seating"||view!=="map"||!mapBoxRef.current)return;
    const el=mapBoxRef.current;
    const fitZoom=(...a)=>camFnRef.current.fitZoom(...a),zoomAt=(...a)=>camFnRef.current.zoomAt(...a),panBy=(...a)=>camFnRef.current.panBy(...a),
      setCam=(...a)=>camFnRef.current.setCam(...a),minZoom=()=>camFnRef.current.minZoom();
    fitZoom();
    // כשהחלון/המסך המלא/התפריט משנים גודל — מתאימים מחדש (אלא אם המשתמש הזיז/הגדיל בעצמו)
    const ro=new ResizeObserver(()=>{setBoxTick(t=>t+1);if(!manualZoomRef.current)fitZoom();});
    ro.observe(el);
    // גלגלת / משטח מגע: הזזת המפה. Ctrl+גלגלת (או צביטה): זום סביב הסמן
    const wheel=e=>{
      e.preventDefault();
      // גלגלת של עכבר (קפיצות שלמות, בלי תזוזה לצד) = זום, כמו במפות. משטח מגע (תזוזות קטנות) = הזזה, צביטה = זום
      const mouseWheel=e.deltaMode===1||(e.deltaX===0&&Math.abs(e.deltaY)>=50&&Number.isInteger(e.deltaY));
      if(e.ctrlKey||e.metaKey||(mouseWheel&&!e.shiftKey)){const r=el.getBoundingClientRect(),d=Math.max(-120,Math.min(120,e.deltaMode===1?e.deltaY*33:e.deltaY));zoomAt(Math.exp(-d*.0025),e.clientX-r.left,e.clientY-r.top);}
      else{const k=e.deltaMode===1?33:1;panBy(-(e.shiftKey?e.deltaY:e.deltaX)*k,-(e.shiftKey?0:e.deltaY)*k);}
    };
    el.addEventListener("wheel",wheel,{passive:false});
    // טאבלט/מסך מגע: אצבע אחת על הרקע מזיזה, שתי אצבעות (צביטה) מגדילות ומקטינות
    let tch=null;
    const tPts=e=>[...e.touches].map(t=>({x:t.clientX,y:t.clientY}));
    const tStart=e=>{
      if(e.touches.length===1&&e.target.closest("[data-tid],.sx-fixture"))return; // גרירת שולחן — לא הזזת מפה
      const pts=tPts(e);tch={pts,p0:panRef.current,z0:zoomRef.current};
    };
    const tMove=e=>{
      if(!tch)return;e.preventDefault();
      const pts=tPts(e),r=el.getBoundingClientRect();
      if(pts.length>=2&&tch.pts.length>=2){
        const dist=a=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mid=a=>({x:(a[0].x+a[1].x)/2-r.left,y:(a[0].y+a[1].y)/2-r.top});
        const m0=mid(tch.pts),m=mid(pts),z=Math.min(ZMAX,Math.max(minZoom(),tch.z0*dist(pts)/Math.max(dist(tch.pts),1)));
        manualZoomRef.current=true;
        setCam({x:m.x-(m0.x-tch.p0.x)*z/tch.z0,y:m.y-(m0.y-tch.p0.y)*z/tch.z0},+z.toFixed(3));
      }else if(pts.length===1){
        manualZoomRef.current=true;
        setCam({x:tch.p0.x+pts[0].x-tch.pts[0].x,y:tch.p0.y+pts[0].y-tch.pts[0].y});
      }
    };
    const tEnd=e=>{tch=e.touches.length?{pts:tPts(e),p0:panRef.current,z0:zoomRef.current}:null;};
    el.addEventListener("touchstart",tStart,{passive:true});
    el.addEventListener("touchmove",tMove,{passive:false});
    el.addEventListener("touchend",tEnd);
    // חיצים במקלדת מזיזים את המפה (לא בתוך שדה טקסט)
    const key=e=>{
      if(/input|textarea|select/i.test(e.target.tagName)||e.ctrlKey||e.metaKey)return;
      const d={ArrowLeft:[120,0],ArrowRight:[-120,0],ArrowUp:[0,120],ArrowDown:[0,-120]}[e.key];
      if(d){e.preventDefault();panBy(d[0],d[1]);}
    };
    window.addEventListener("keydown",key);
    return()=>{ro.disconnect();el.removeEventListener("wheel",wheel);el.removeEventListener("touchstart",tStart);el.removeEventListener("touchmove",tMove);el.removeEventListener("touchend",tEnd);window.removeEventListener("keydown",key);};
  },[screen,view,sidebarOpen,tables.length,loading]);
  // חגיגה כשכל האורחים הושבו: קונפטי והודעה (רק במעבר ל-100%, לא בכל טעינה)
  const [celebrate,setCelebrate]=useState(false);
  const prevSeatedRef=useRef(null);
  useEffect(()=>{
    if(loading)return;
    const s=tables.reduce((n,t)=>n+(t.guests||[]).length,0), all=s+guests.length;
    const was=prevSeatedRef.current;prevSeatedRef.current=s;
    if(was!==null&&all>0&&s===all&&was<all){setCelebrate(true);const t=setTimeout(()=>setCelebrate(false),3600);return()=>clearTimeout(t);}
  },[tables,guests,loading]);
  // מסך מלא למפה: Esc יוצא; ביציאה מההושבה או מתצוגת המפה  -  חוזרים לתצוגה רגילה
  const [mapFull,setMapFull]=useState(false);
  const [fullListOpen,setFullListOpen]=useState(true);
  // רשימת האורחים שליד המפה: אפשר לקפל כדי לתת למפה את כל הרוחב (הבחירה נשמרת)
  // במסך צר (טאבלט) הרשימה מתחילה מקופלת, כדי שהמפה תקבל את הרוחב — אלא אם כבר בחרו אחרת
  const [asideOpen,setAsideOpen]=useState(()=>{try{const v=localStorage.getItem("sidor_aside");return v==null?window.innerWidth>=1200:v!=="0";}catch{return true;}});
  useEffect(()=>{optSet("sidor_aside",asideOpen?"1":"0");},[asideOpen]);
  // בחירת שולחן פותחת את הרשימה (שם עורכים את היושבים בו)
  useEffect(()=>{if(selected&&!mapFull)setAsideOpen(true);},[selected]);
  useEffect(()=>{if(screen!=="seating"||view!=="map")setMapFull(false);},[screen,view]);
  // כניסה/יציאה ממסך מלא: מתאימים את הזום מחדש (אחרי שהמפה קיבלה את הגודל החדש)
  useEffect(()=>{
    if(mapFullRef.current===mapFull)return;
    mapFullRef.current=mapFull;manualZoomRef.current=false;
    const r=requestAnimationFrame(()=>fitZoom());
    return()=>cancelAnimationFrame(r);
  },[mapFull]);
  useEffect(()=>{
    if(!mapFull)return;
    const onKey=e=>{if(e.key==="Escape")setMapFull(false);};
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[mapFull]);
  useEffect(()=>{if(screen==="seating"&&view==="map")setTimeout(()=>fitZoom(),30);},[mapFull]);  // במסך ההושבה מקפלים את התפריט הראשי כדי לתת למפה יותר מקום (אפשר לפתוח שוב ב-☰)
  useEffect(()=>{setSidebarOpen(screen!=="seating");},[screen]);
  const [mapFind,setMapFind]=useState("");
  // פריסת האולם (מיקום במה/בר/כניסה + נעילת מפה) נשמרת באירוע: settings_json.hall
  const [hall,setHall]=useState(()=>event.settings_json?.hall||{});
  const hallRef=useRef(hall);hallRef.current=hall;
  useEffect(()=>{setHall(event.settings_json?.hall||{});},[event.id]);
  const prevScreenRef=useRef(screen);
  useEffect(()=>{if(screen==="seating"&&prevScreenRef.current!=="seating")setView("list");prevScreenRef.current=screen;},[screen]);
  const mapLocked=!!hall.locked;
  // שולחן/במה הוזזו או נוספו (גם יישור ותבנית): האולם משתנה — מתאימים שוב, אלא אם המשתמש עשה זום ידני
  const layoutKey=tables.map(t=>`${t.x},${t.y}`).join("|")+JSON.stringify({...hall,locked:0});
  useEffect(()=>{if(screen==="seating"&&view==="map"&&!manualZoomRef.current)fitZoom();},[layoutKey]);
  // ריבועים פעילים: אחרי כל שינוי במפה (פתיחה, סידור מושלם, תבנית, שולחן חדש) כל שולחן חוזר למרכז ריבוע
  useEffect(()=>{
    if(loading||!gridOn()||!tables.length||tables.every(t=>!t.x&&!t.y))return;
    const fix=gridLayout(),ids=Object.keys(fix);if(!ids.length)return;
    setTables(ts=>ts.map(t=>fix[t.id]?{...t,...fix[t.id]}:t));
    ids.forEach(id=>saveTablePos(id,fix[id].x,fix[id].y));
  },[layoutKey,loading]);
  const saveHall=async(next,silent=false)=>{
    setHall(next);hallRef.current=next;
    const settings={...(event.settings_json||{}),hall:next};
    event.settings_json=settings;
    const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
    if(error&&!silent)alert("❌ פריסת האולם לא נשמרה: "+error.message);
  };
  // ─── סנכרון בין מכשירים: מה שהוזז בטלפון מופיע במחשב (ולהפך) ───
  // חוזרים לחלון/ללשונית, או כל 10 שניות כשמסך ההושבה פתוח: טוענים מחדש שולחנות, אורחים ופריסת האולם.
  // לא בזמן גרירה (אצבע/עכבר לחוצים) ולא בזמן שמירה, כדי ששום דבר לא יקפוץ מתחת ליד
  const savingRef=useRef(false);savingRef.current=saving;
  useEffect(()=>{
    if(screen!=="seating")return;
    let down=false,last=Date.now(),busy=false;
    const pd=()=>{down=true;},pu=()=>{down=false;};
    const sync=async(force)=>{
      if(busy||down||savingRef.current||document.visibilityState!=="visible")return;
      if(!force&&Date.now()-last<8000)return;
      busy=true;last=Date.now();
      try{
        const [{data:ev}]=await Promise.all([sb.from("events").select("settings_json").eq("id",event.id).maybeSingle(),loadAll(true)]);
        const h=ev?.settings_json?.hall;
        if(h&&!down&&JSON.stringify(h)!==JSON.stringify(hallRef.current||{})){event.settings_json={...(event.settings_json||{}),hall:h};setHall(h);hallRef.current=h;}
      }catch{}finally{busy=false;}
    };
    const onBack=()=>{if(document.visibilityState==="visible")sync(true);};
    const iv=setInterval(()=>sync(false),10000); // כל 10 שניות: מה שסודר בטלפון מופיע במחשב תוך רגע
    document.addEventListener("pointerdown",pd,true);document.addEventListener("pointerup",pu,true);document.addEventListener("pointercancel",pu,true);
    document.addEventListener("touchstart",pd,{capture:true,passive:true});document.addEventListener("touchend",pu,true);
    window.addEventListener("focus",onBack);document.addEventListener("visibilitychange",onBack);
    return()=>{clearInterval(iv);document.removeEventListener("pointerdown",pd,true);document.removeEventListener("pointerup",pu,true);document.removeEventListener("pointercancel",pu,true);
      document.removeEventListener("touchstart",pd,{capture:true});document.removeEventListener("touchend",pu,true);
      window.removeEventListener("focus",onBack);document.removeEventListener("visibilitychange",onBack);};
  },[screen,event.id]);
  // ─── עריכת האולם: גודל ואלמנטים ───
  const [selItem,setSelItem]=useState(null);
  const sizeKey=()=>{const s=(hallRef.current||{}).size;if(HALL_SIZES[s])return s;const [W,H]=hallDims("auto");return HALL_SIZE_ORDER.find(k=>HALL_SIZES[k][0]>=W&&HALL_SIZES[k][1]>=H)||"xl";};
  // שמירת אלמנטים (תמיד בפורמט החדש, עם גודל אולם קבוע) + ביטול
  const saveItems=(items,label,extra={})=>{
    const prev=hallRef.current||{};
    const {stage,bar,entrance,...rest}=prev;
    saveHall({...rest,size:sizeKey(),...extra,items});
    if(label)pushUndo(label,()=>saveHall(prev));
  };
  const itemLabel=it=>it.label||HALL_ITEM_KINDS[it.kind]?.label||"אלמנט";
  const updateItem=(id,patch,label)=>saveItems(hallItems().map(i=>i.id===id?{...i,...patch}:i),label);
  // נעילה של אלמנט / שולחן בודד: לא זז (גם לא בסידור מושלם וביישור). שולחן נעול עדיין מקבל אורחים
  const lockedTables=new Set(hall.lockedTables||[]);
  const toggleItemLock=id=>{const it=hallItems().find(i=>i.id===id);if(it)updateItem(id,{locked:!it.locked},`${it.locked?"שחרור":"נעילת"} ${itemLabel(it)}`);};
  const toggleTableLock=id=>{
    const prev=hallRef.current||{},cur=new Set(prev.lockedTables||[]);
    cur.has(id)?cur.delete(id):cur.add(id);
    saveHall({...prev,lockedTables:[...cur]});
    pushUndo(cur.has(id)?"נעילת שולחן":"שחרור שולחן",()=>saveHall(prev));
  };
  const deleteItem=id=>{const it=hallItems().find(i=>i.id===id);if(!it||it.locked)return;saveItems(hallItems().filter(i=>i.id!==id),`מחיקת ${itemLabel(it)}`);setSelItem(null);};
  const renameItem=id=>{const it=hallItems().find(i=>i.id===id);if(!it)return;const v=window.prompt("שם האלמנט במפה",itemLabel(it));if(v==null)return;updateItem(id,{label:v.trim().slice(0,30)||undefined},"שינוי שם");};
  // מקום פנוי באולם למלבן w×h (לא על שולחן או אלמנט אחר). off = גבולות הצורה ביחס לנקודת המיקום
  // near=true: המקום הפנוי הכי קרוב לרחבה (או לבמה) — ככה שולחנות חדשים מתקבצים סביבה ולא בפינה
  // r = המלבן לחיפוש [x0,y0,x1,y1]
  const findFree=(off,r,near=false)=>{
    const tw=off[2]-off[0],th=off[3]-off[1],items=hallItems();
    const bs=[...tables.map(tableBox),...items.map(itemBox)];
    const f=near&&(items.find(i=>i.kind==="dance")||items.find(i=>i.kind==="stage"));
    const fx=f?f.x+f.w/2:0,fy=f?f.y+f.h/2:0;
    let best=null,bd=Infinity;
    for(let y=r[1]+HALL_MARGIN;y+th<=r[3]-HALL_MARGIN/2;y+=30)for(let x=r[0]+HALL_MARGIN;x+tw<=r[2]-HALL_MARGIN/2;x+=30){
      const nb=[x,y,x+tw,y+th];
      if(bs.some(b=>nb[0]<b[2]+24&&nb[2]+24>b[0]&&nb[1]<b[3]+24&&nb[3]+24>b[1]))continue;
      if(!f)return {x:x-off[0],y:y-off[1]};
      const d=Math.hypot(x+tw/2-fx,(y+th/2-fy)*1.25);
      if(d<bd){bd=d;best={x:x-off[0],y:y-off[1]};}
    }
    return best;
  };
  const [addItemOpen,setAddItemOpen]=useState(false),[toolsOpen,setToolsOpen]=useState(false);
  const addItem=kind=>{
    setAddItemOpen(false);
    const K=HALL_ITEM_KINDS[kind],r=hallRect(),id=kind+"_"+Date.now().toString(36);
    // קודם המקום הקלאסי באולם שעל המסך (רחבה מול הבמה, כניסה למטה...), ואם הוא תפוס — המקום הפנוי הראשון
    const draft={id,kind,x:0,y:0,w:K.w,h:K.h};
    const c0=classicItems([...hallItems().filter(i=>i.kind!==kind).map(i=>({...i,x:i.x-r[0],y:i.y-r[1]})),draft],[r[2]-r[0],r[3]-r[1]]).find(i=>i.id===id);
    const classic={...c0,x:Math.round(c0.x+r[0]),y:Math.round(c0.y+r[1])};
    const others=[...tables.map(tableBox),...hallItems().map(itemBox)],cb=itemBox(classic);
    const p=!others.some(b=>cb[0]<b[2]+16&&cb[2]+16>b[0]&&cb[1]<b[3]+16&&cb[3]+16>b[1])?classic
      :findFree([0,0,K.w,K.h],r)||{x:Math.round((r[0]+r[2])/2-K.w/2),y:Math.round((r[1]+r[3])/2-K.h/2)};
    saveItems([...hallItems(),{id,kind,x:p.x,y:p.y,w:K.w,h:K.h}],`הוספת ${K.label}`);
    setSelItem(id);setSelected(null);
    // אם האלמנט החדש מחוץ לחלק של האולם שעל המסך — מזיזים את המפה כדי שיראו אותו
    setTimeout(()=>showBox(itemBox({x:p.x,y:p.y,w:K.w,h:K.h})),80);
  };
  const showBox=([bx0,by0,bx1,by1])=>{
    const el=mapBoxRef.current;if(!el)return;
    const z=zoomRef.current,P=panRef.current,W=el.clientWidth,H=el.clientHeight,m=40;
    const sx0=bx0*z+P.x,sy0=by0*z+P.y,sx1=bx1*z+P.x,sy1=by1*z+P.y;
    let dx=0,dy=0;
    if(sx0<m+70)dx=m+70-sx0;else if(sx1>W-m)dx=W-m-sx1; // משמאל: כפתורי הזום
    if(sy0<m)dy=m-sy0;else if(sy1>H-m)dy=H-m-sy1;
    if(dx||dy)setCam({x:P.x+dx,y:P.y+dy});
  };
  // פריסה קלאסית של האלמנטים באולם W×H: במה במרכז למעלה, DJ לידה, רחבה מול הבמה, בר בפינה, כניסה במרכז למטה,
  // חופה בפינה השנייה. שאר האלמנטים נשארים באותו מקום יחסי. [W0,H0] = גודל האולם הקודם
  const classicItems=(items,[W,H],[W0,H0]=[W,H],resize=false)=>{
    const M=HALL_MARGIN,by={};
    // resize: במה ורחבה גדלות עם האולם (באולם ענק רחבה קטנה נראית אבודה)
    const f=W/HALL_SIZES.s[0];
    items=items.map(i=>resize&&!i.locked&&(i.kind==="stage"||i.kind==="dance")?{...i,w:Math.round(HALL_ITEM_KINDS[i.kind].w*f),h:Math.round(HALL_ITEM_KINDS[i.kind].h*(i.kind==="dance"?f:Math.sqrt(f)))}:i);
    items.forEach(i=>{by[i.kind]=by[i.kind]||i;});
    const st=by.stage,out=[];
    items.forEach(i=>{
      let x,y;
      if(i.locked){out.push(i);return;} // נעול: נשאר בדיוק במקום
      if(i===by.stage){x=W/2-i.w/2;y=M;}
      else if(i===by.dj){x=st?W/2+st.w/2+30:W/2-i.w/2;y=st?M+(st.h-i.h)/2:M;}
      else if(i===by.head){x=W/2-i.w/2;y=st?M+st.h+30:M;}
      else if(i===by.dance){
        // מתחת לשולחן חתן-כלה (ולכיסאות שלו), או מתחת לבמה
        const headY=st?M+st.h+30:M;
        y=by.head?headY+by.head.h+44:st?M+st.h+46:Math.max(M,H*.3-i.h/2);x=W/2-i.w/2;
      }
      else if(i===by.bar){x=W-M-i.w;y=M;}
      else if(i===by.entrance){x=W/2-i.w/2;y=H-M/2-i.h;}
      else if(i===by.chuppah){x=M;y=M;}
      else{x=(i.x+i.w/2)*W/W0-i.w/2;y=(i.y+i.h/2)*H/H0-i.h/2;}
      out.push({...i,x:Math.round(Math.min(W-i.w,Math.max(0,x))),y:Math.round(Math.min(H-i.h,Math.max(0,y)))});
    });
    return out;
  };
  // ✨ סידור מושלם: האלמנטים בפריסה קלאסית, והשולחנות על רשת של עמודות ישרות (כמו באולם אמיתי) מסביב לרחבה ולבמה.
  // מספור מימין לשמאל ומלמעלה למטה. האולם: הקטן ביותר שהשולחנות נכנסים בו בריווח נוח (ככה הם הכי גדולים על המסך).
  // לא נכנס? ריווח קטן יותר, ואז אולם גדול יותר (עד ענק)
  const perfectLayout=async(startSize="s")=>{
    if(!tables.length){alert("אין עדיין שולחנות לסדר");return;}
    // שולחנות נעולים נשארים במקום, והשאר מסתדרים מסביבם
    const fixedT=tables.filter(t=>lockedTables.has(t.id)).map(tableBox);
    const sorted=tables.filter(t=>!lockedTables.has(t.id)).sort((a,b)=>(numOf(a)||999)-(numOf(b)||999));
    if(!sorted.length){alert("כל השולחנות נעולים. שחררו שולחן כדי שאפשר יהיה לסדר אותו.");return;}
    const [W0,H0]=HALL_SIZES[sizeKey()];
    const offs=sorted.map(t=>tableOff(t.type));
    const cw0=Math.max(...offs.map(o=>o[2]-o[0])),ch0=Math.max(...offs.map(o=>o[3]-o[1]));
    const pack=(W,H,gap,items)=>{
      const M=HALL_MARGIN,cw=cw0+gap,ch=ch0+gap;
      const cols=Math.floor((W-2*M+gap)/cw),rows=Math.floor((H-2*M+gap)/ch);
      const x0=(W-(cols*cw-gap))/2,y0=M;
      const blocks=[...items.map(i=>[i.x-22,i.y-22,i.x+i.w+22,i.y+i.h+22]),...fixedT.map(b=>[b[0]-gap/2,b[1]-gap/2,b[2]+gap/2,b[3]+gap/2])];
      const cells=[];
      for(let r=0;r<rows;r++)for(let c=cols-1;c>=0;c--){ // מימין לשמאל
        const b=[x0+c*cw,y0+r*ch,x0+c*cw+cw0,y0+r*ch+ch0];
        if(!blocks.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1]))cells.push(b);
      }
      if(cells.length<sorted.length)return null;
      // התאים הכי קרובים לרחבה (או לבמה / למרכז), ואז לפי סדר קריאה: שורה אחר שורה, מימין לשמאל
      const f=items.find(i=>i.kind==="dance")||items.find(i=>i.kind==="stage");
      const fx=f?f.x+f.w/2:W/2,fy=f?f.y+f.h/2:H/2;
      const near=[...cells].sort((a,b)=>Math.hypot((a[0]+a[2])/2-fx,((a[1]+a[3])/2-fy)*1.25)-Math.hypot((b[0]+b[2])/2-fx,((b[1]+b[3])/2-fy)*1.25)).slice(0,sorted.length);
      near.sort((a,b)=>a[1]-b[1]||b[0]-a[0]);
      const pos={};
      sorted.forEach((t,i)=>{const b=near[i],o=offs[i],tw=o[2]-o[0],th=o[3]-o[1];pos[t.id]={x:Math.round(b[0]+(cw0-tw)/2-o[0]),y:Math.round(b[1]+(ch0-th)/2-o[1])};});
      return pos;
    };
    // ריבועים פעילים: מסדרים ישר על הריבועים (כל שולחן במרכז ריבוע), הכי קרוב לרחבה / לבמה, בלי חפיפה
    // (שולחן אבירים רחב מריבוע, אז שני אבירים לא יוצאים צמודים). אחר כך מספור לפי סדר קריאה: מלמעלה למטה, מימין לשמאל
    const gridPack=(W,H,items)=>{
      const M=HALL_MARGIN;
      const blocks=[...items.map(i=>[i.x-22,i.y-22,i.x+i.w+22,i.y+i.h+22]),...fixedT];
      const f=items.find(i=>i.kind==="dance")||items.find(i=>i.kind==="stage");
      const fx=f?f.x+f.w/2:W/2,fy=f?f.y+f.h/2:H/2;
      const cells=[];
      for(let r=0;(r+1)*GRID<=H;r++)for(let c=0;(c+1)*GRID<=W;c++)cells.push([c*GRID+GRID/2,r*GRID+GRID/2]);
      cells.sort((a,b)=>Math.hypot(a[0]-fx,(a[1]-fy)*1.25)-Math.hypot(b[0]-fx,(b[1]-fy)*1.25));
      const placed=[],byType={};
      // שולחנות אבירים (ארוכים) נבחרים ראשונים, כדי שיקבלו מקומות רצופים ולא את מה שנשאר בשוליים
      const idx=sorted.map((t,i)=>i).sort((a,b)=>(sorted[b].type==="knight")-(sorted[a].type==="knight")||a-b);
      for(const i of idx){
        const o=offs[i],ox=(o[0]+o[2])/2,oy=(o[1]+o[3])/2;
        const cell=cells.find(([px,py])=>{
          const x=px-ox,y=py-oy,b=[x+o[0]-6,y+o[1]-6,x+o[2]+6,y+o[3]+6];
          if(b[0]<M/2||b[1]<M/2||b[2]>W-M/2||b[3]>H-M/2)return false;
          return ![...blocks,...placed].some(q=>b[0]<q[2]&&b[2]>q[0]&&b[1]<q[3]&&b[3]>q[1]);
        });
        if(!cell)return null;
        const x=Math.round(cell[0]-ox),y=Math.round(cell[1]-oy);
        placed.push([x+o[0],y+o[1],x+o[2],y+o[3]]);
        (byType[sorted[i].type]||=[]).push({x,y});
      }
      // מספור: בכל סוג שולחן, הנמוך במספר מקבל את המקום הראשון בסדר הקריאה
      const pos={};
      Object.entries(byType).forEach(([type,spots])=>{
        spots.sort((a,b)=>a.y-b.y||b.x-a.x);
        sorted.filter(t=>t.type===type).forEach((t,i)=>{pos[t.id]=spots[i];});
      });
      return pos;
    };
    const order=HALL_SIZE_ORDER.slice(HALL_SIZE_ORDER.indexOf(startSize));
    let res=null,size=null,itemsAt=null;
    for(const k of order){
      const dims=HALL_SIZES[k],items=classicItems(hallItems(),dims,[W0,H0],true);
      if(gridOn())res=gridPack(dims[0],dims[1],items);
      else for(const gap of [60,44,30]){res=pack(dims[0],dims[1],gap,items);if(res)break;}
      if(res){size=k;itemsAt=items;break;}
    }
    if(!res){alert("יש יותר מדי שולחנות גם לאולם בגודל ענק. אפשר להחליף חלק לשולחנות אבירים או להקטין את מספר השולחנות.");return;}
    const before=tables.map(t=>({id:t.id,x:t.x,y:t.y})),prevHall=hallRef.current||{};
    setTables(ts=>ts.map(t=>res[t.id]?{...t,...res[t.id]}:t));
    const {stage,bar,entrance,...rest}=prevHall;
    await Promise.all([...sorted.map(t=>saveTablePos(t.id,res[t.id].x,res[t.id].y)),saveHall({...rest,size,items:itemsAt})]);
    pushUndo("סידור מושלם",async()=>{await restoreTablePos(before);await saveHall(prevHall);});
    setTimeout(()=>fitZoom(),50);
  };
  // Delete / Backspace מוחק את האלמנט הנבחר; Esc מבטל בחירה
  useEffect(()=>{
    if(!selItem)return;
    const k=e=>{
      if(/input|textarea|select/i.test(e.target.tagName))return;
      if((e.key==="Delete"||e.key==="Backspace")&&!hallRef.current?.locked){e.preventDefault();deleteItem(selItem);}
      else if(e.key==="Escape")setSelItem(null);
    };
    window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);
  },[selItem]);
  // אירוע ישן: שומרים פעם אחת את גודל האולם והאלמנטים בפורמט החדש, ומזיזים פנימה מה שנמצא מחוץ לאולם (קואורדינטות שליליות)
  useEffect(()=>{
    if(loading||screen!=="seating")return;
    const h=hallRef.current||{};
    const [x0,y0]=contentBox();
    const dx=x0<0?Math.ceil((HALL_MARGIN-x0)/200)*200:0,dy=y0<0?Math.ceil((HALL_MARGIN-y0)/200)*200:0; // ריבועים שלמים (GRID)
    if(!dx&&!dy&&Array.isArray(h.items)&&HALL_SIZES[h.size])return;
    if(dx||dy){
      setTables(ts=>ts.map(t=>({...t,x:t.x+dx,y:t.y+dy})));
      tables.forEach(t=>saveTablePos(t.id,t.x+dx,t.y+dy));
    }
    const items=hallItems().map(i=>({...i,x:i.x+dx,y:i.y+dy}));
    const {stage,bar,entrance,...rest}=h;
    fixDefRef.current=null;
    // הגודל: הקטן שמכיל את הכל אחרי ההזזה
    const [,,x1,y1]=contentBox(tables.map(t=>({...t,x:t.x+dx,y:t.y+dy})),items);
    const size=HALL_SIZES[h.size]?h.size:(HALL_SIZE_ORDER.find(k=>HALL_SIZES[k][0]>=x1+HALL_MARGIN/2&&HALL_SIZES[k][1]>=y1+HALL_MARGIN/2)||"xl");
    saveHall({...rest,size,items},true);
  },[loading,screen,event.id]);
  // ─── מספרי שולחנות: נשמרים באירוע (settings_json.table_nums = {tableId: מספר}) ───
  // שולחן בלי מספר מקבל אחד אוטומטית: המספר שבתחילת השם (אם פנוי), אחרת המספר הפנוי הקטן ביותר
  const [tableNums,setTableNums]=useState(()=>event.settings_json?.table_nums||{});
  const tableNumsRef=useRef(tableNums);tableNumsRef.current=tableNums;
  useEffect(()=>{setTableNums(event.settings_json?.table_nums||{});},[event.id]);
  const saveTableNums=async next=>{
    setTableNums(next);tableNumsRef.current=next;
    const settings={...(event.settings_json||{}),table_nums:next};
    event.settings_json=settings;
    await sb.from("events").update({settings_json:settings}).eq("id",event.id);
  };
  const withNumbers=(list,nums)=>{
    const next={};list.forEach(t=>{if(nums[t.id])next[t.id]=nums[t.id];});
    const used=new Set(Object.values(next));
    list.filter(t=>!next[t.id]).forEach(t=>{
      const lead=parseInt(String(t.name||"").match(/^\s*(\d+)/)?.[1]||"",10);
      let n=lead>0&&!used.has(lead)?lead:1;while(used.has(n))n++;
      next[t.id]=n;used.add(n);
    });
    return next;
  };
  useEffect(()=>{
    if(loading||!tables.length)return;
    const next=withNumbers(tables,tableNumsRef.current);
    const cur=tableNumsRef.current;
    if(Object.keys(next).length!==Object.keys(cur).length||Object.keys(next).some(k=>next[k]!==cur[k]))saveTableNums(next);
  },[loading,tables.map(t=>t.id).join(",")]);
  const numOf=t=>tableNumsRef.current[t?.id]||tableNums[t?.id]||"";
  // שינוי מספר: אם המספר תפוס בשולחן אחר — מחליפים ביניהם
  const setTableNum=(id,n)=>{
    n=parseInt(n,10);if(!(n>0))return;
    const cur={...tableNumsRef.current},old=cur[id];
    const other=Object.keys(cur).find(k=>k!==id&&cur[k]===n);
    if(other)cur[other]=old;
    cur[id]=n;saveTableNums(cur);
  };
  const tablesNum=[...tables].map(t=>({...t,num:numOf(t)})).sort((a,b)=>(a.num||999)-(b.num||999));
  // הדפסת סידור ההושבה: לפי שולחנות + אינדקס אורחים לפי א-ב (לכניסה לאולם)
  const printSeating=()=>{
    const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    const ppl=g=>g.guest_count||1;
    const tName=t=>String(t.name||"").replace(/^\s*\d+\s*/,"")||`שולחן ${t.num}`;
    const cards=tablesNum.map(t=>{const gs=[...(t.guests||[])].sort((a,b)=>a.name.localeCompare(b.name,"he"));const n=gs.reduce((s,g)=>s+ppl(g),0);
      return `<section class="t"><header><span class="num">${t.num}</span><span class="nm">${esc(tName(t))}</span><span class="cnt">${n} אורחים · ${gs.length}/${t.seats} מקומות</span></header>
      ${gs.length?`<ol>${gs.map(g=>`<li>${esc(g.name)}${ppl(g)>1?` <b>×${ppl(g)}</b>`:""}${g.relation&&g.relation!=="ללא שיוך"?` <i>${esc(g.relation)}</i>`:""}</li>`).join("")}</ol>`:`<p class="empty">אין אורחים</p>`}</section>`;}).join("");
    const idx=tablesNum.flatMap(t=>(t.guests||[]).map(g=>({g,t}))).sort((a,b)=>a.g.name.localeCompare(b.g.name,"he"))
      .map(({g,t})=>`<tr><td>${esc(g.name)}</td><td class="c">${ppl(g)}</td><td class="c"><b>${t.num}</b></td><td>${esc(tName(t))}</td></tr>`).join("");
    const waiting=toSeat.length?`<h2>ממתינים להושבה (${toSeat.length})</h2><p class="wait">${toSeat.map(g=>esc(g.name)).join(" · ")}</p>`:"";
    const title=esc(event.name||"סידור הושבה"),date=event.date?fmtDateHe(event.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"";
    const w=window.open("","_blank");if(!w){alert("הדפדפן חסם את חלון ההדפסה — אפשרו חלונות קופצים לאתר");return;}
    w.document.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>סידור הושבה · ${title}</title><style>
      @font-face{font-family:Heebo;src:url(${window.location.origin}/fonts/heebo-hebrew-wght-normal.woff2) format("woff2");font-weight:100 900;unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:Heebo;src:url(${window.location.origin}/fonts/heebo-latin-wght-normal.woff2) format("woff2");font-weight:100 900}
      *{box-sizing:border-box}body{font-family:Heebo,Arial,sans-serif;color:#2B1D3F;margin:24px}
      h1{margin:0;font-size:24px}.sub{color:#6E6585;margin:4px 0 18px;font-size:13px}h2{font-size:17px;margin:26px 0 10px;border-bottom:2px solid #2B1D3F;padding-bottom:4px}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.t{border:1.5px solid #CFC3E0;border-radius:10px;padding:10px 12px;break-inside:avoid}
      .t header{display:flex;align-items:center;gap:8px;border-bottom:1px solid #EEE6F7;padding-bottom:6px;margin-bottom:6px}
      .num{background:#2B1D3F;color:#fff;border-radius:8px;min-width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:16px}
      .nm{font-weight:900;flex:1}.cnt{font-size:11px;color:#6E6585}ol{margin:0;padding-inline-start:20px;font-size:13px;line-height:1.6}i{color:#8A7FA0;font-size:11px;font-style:normal}
      .empty,.wait{color:#8A7FA0;font-size:12px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #EEE6F7;padding:5px 8px;text-align:right}th{background:#F4EEFC}td.c{text-align:center}
      .idx{columns:2;column-gap:24px}.idx table{break-inside:auto}.bar{margin-bottom:14px}.bar button{font:inherit;font-weight:700;padding:8px 16px;border-radius:8px;border:none;background:#2B1D3F;color:#fff;cursor:pointer}
      @media print{.bar{display:none}body{margin:10mm}.grid{grid-template-columns:repeat(3,1fr)}h2{break-after:avoid}.pb{break-before:page}}
    </style></head><body><div class="bar"><button onclick="print()">🖨️ הדפסה</button></div>
    <h1>סידור הושבה · ${title}</h1><div class="sub">${date}${event.venue?` · ${esc(event.venue)}`:""} · ${tablesNum.length} שולחנות · ${seated} מתוך ${total} הושבו</div>
    <h2>לפי שולחנות</h2><div class="grid">${cards}</div>
    <h2 class="pb">לפי שם אורח (א-ב)</h2><div class="idx"><table><thead><tr><th>שם</th><th>אורחים</th><th>שולחן</th><th>שם השולחן</th></tr></thead><tbody>${idx}</tbody></table></div>
    ${waiting}</body></html>`);
    w.document.close();setTimeout(()=>{try{w.focus();w.print();}catch{}},600);
  };
  // הדפסת כרטיסים: "tables" = כרטיס מספר לכל שולחן (מתקפל לאוהל), "names" = כרטיס שם לכל אורח עם מספר השולחן
  const printCards=kind=>{
    const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    const tName=t=>String(t.name||"").replace(/^\s*\d+\s*/,"");
    const title=esc(event.name||"");
    let body,css;
    if(kind==="tables"){
      if(!tablesNum.length){alert("אין שולחנות להדפסה");return;}
      // חצי עליון הפוך כדי שאחרי קיפול באמצע המספר ייראה משני הצדדים
      const face=t=>`<div class="face"><div class="ev">${title}</div><div class="n">${t.num}</div>${tName(t)&&tName(t)!==`שולחן ${t.num}`?`<div class="tn">${esc(tName(t))}</div>`:""}</div>`;
      body=tablesNum.map(t=>`<section class="tent"><div class="flip">${face(t)}</div><div class="fold"></div>${face(t)}</section>`).join("");
      css=`.tent{height:180mm;width:100%;display:flex;flex-direction:column;break-after:page;border:1px dashed #ddd}
        .tent>div:not(.fold){flex:1;display:flex}.flip{transform:rotate(180deg)}.fold{border-top:1px dashed #bbb}
        .face{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
        .ev{font-size:16px;color:#8A7FA0;font-weight:700}.n{font-size:150px;font-weight:900;line-height:1;color:#2B1D3F}.tn{font-size:24px;font-weight:700;color:#6E6585}`;
    }else{
      const list=tablesNum.flatMap(t=>(t.guests||[]).map(g=>({g,t}))).sort((a,b)=>a.g.name.localeCompare(b.g.name,"he"));
      if(!list.length){alert("עוד אין אורחים שהושבו בשולחנות");return;}
      body=`<div class="grid">${list.map(({g,t})=>`<div class="card"><div class="nm">${esc(g.name)}</div><div class="tb">שולחן <b>${t.num}</b></div></div>`).join("")}</div>`;
      css=`.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
        .card{height:45mm;border:1px dashed #ccc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;break-inside:avoid;padding:6px;text-align:center}
        .nm{font-size:20px;font-weight:900;color:#2B1D3F}.tb{font-size:15px;color:#6E6585}.tb b{font-size:22px;color:#F0609E}`;
    }
    const w=window.open("","_blank");if(!w){alert("הדפדפן חסם את חלון ההדפסה — אפשרו חלונות קופצים לאתר");return;}
    w.document.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>${kind==="tables"?"כרטיסי שולחן":"כרטיסי שם"} · ${title}</title><style>
      @font-face{font-family:Heebo;src:url(${window.location.origin}/fonts/heebo-hebrew-wght-normal.woff2) format("woff2");font-weight:100 900;unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:Heebo;src:url(${window.location.origin}/fonts/heebo-latin-wght-normal.woff2) format("woff2");font-weight:100 900}
      *{box-sizing:border-box}body{font-family:Heebo,Arial,sans-serif;margin:16px}
      .bar{margin-bottom:12px;font-size:13px;color:#6E6585}.bar button{font:inherit;font-weight:700;padding:8px 16px;border-radius:8px;border:none;background:#2B1D3F;color:#fff;cursor:pointer;margin-left:10px}
      ${css}@media print{.bar{display:none}body{margin:8mm}}
    </style></head><body><div class="bar"><button onclick="print()">🖨️ הדפסה</button>${kind==="tables"?"כרטיס לכל עמוד · מקפלים לאורך הקו המקווקו":"גוזרים לאורך הקווים המקווקווים"}</div>${body}</body></html>`);
    w.document.close();setTimeout(()=>{try{w.focus();w.print();}catch{}},600);
  };
  const [userPackages,setUserPackages]=useState([]);
  // מדריך הצעדים הראשונים במסך הבית: כל צעד פותח את המסך שלו, והצעד הבא מודגש
  const setupSteps=allG=>[
    {label:"יצירת אירוע",done:true},
    {label:"הוספת מוזמנים",go:mobile?"add":"import",done:allG.length>0},
    {label:"שליחת הזמנה לאורחים",go:"invite",done:allG.some(g=>g.rsvp==="confirmed"||g.rsvp==="declined")},
    {label:"בניית מפת האולם",go:"seating",done:tables.length>0},
    {label:"הושבת האורחים",go:"seating",done:tables.some(t=>(t.guests||[]).length>0)},
    // פתיחת הושבה נדרשת רק לאירוע מעל FREE_SEATING_LIMIT מוזמנים
    ...(guestPeople(allG)>FREE_SEATING_LIMIT?[{label:`פתיחת הושבה (מעל ${FREE_SEATING_LIMIT})`,go:"packages",done:hasBasicPkg(userPackages)}]:[]),
  ];
  const [trialExpired] = useState(false);
  const [trialHours] = useState(0);
  const [editTableData,setEditTableData]=useState(null);
  const hasPkg=(id)=>userPackages.includes(id)||userPackages.includes("vip");
  // אירוע ששותף איתי בגישה מוגבלת (זוג של מפיק): בלי הודעות וחבילות
  const [memberRole,setMemberRole]=useState(null);
  useEffect(()=>{
    if(!event.user_id||event.user_id===user.id){setMemberRole(null);return;}
    sb.from("event_members").select("role").eq("event_id",event.id).eq("email",String(user.email||"").toLowerCase()).maybeSingle().then(({data})=>setMemberRole(data?.role||"editor"));
  },[event.id]);
  const couple=memberRole==="couple";
  const producerOnly=id=>PRODUCER_ONLY.includes(id)&&(couple||!isProducerPkg(userPackages));
  const lockedFor=id=>screenLocked(id,userPackages,guestPeople([...guests,...tables.flatMap(t=>t.guests||[])]))||(couple&&COUPLE_HIDDEN.includes(id));

  useEffect(()=>{
    const last=readLastScreen(event.id);
    const pending=takePendingScreen();
    setScreen(pending||last?.screen||"home");if(last?.view)setView(last.view);
    loadAll();
    const fn=()=>setMobile(isMobile());
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[event.id]);
  // שמירת המסך הנוכחי לרענון הבא
  useEffect(()=>{optSet(LAST_SCREEN_KEY,JSON.stringify({eventId:event.id,screen,view}));},[event.id,screen,view]);
  // מסך נעול (למשל הושבה כשעברו את מגבלת המוזמנים בחינם): להושבה — למסך החבילות, לשאר — לראשי
  useEffect(()=>{if(!loading&&lockedFor(screen))setScreen(screen==="seating"||screen==="ai"?"packages":"home");},[loading,userPackages,memberRole,screen,guests,tables]);
  const loadAll=async(silent=false)=>{if(silent!==true)setLoading(true);const [{data:tData},{data:gData},{data:pkgData}]=await Promise.all([sb.from("tables").select("*").eq("event_id",event.id).order("created_at"),sb.from("guests").select("*").eq("event_id",event.id).order("created_at"),event.user_id&&event.user_id!==user.id
    // אירוע ששותף איתי: החבילות של בעל האירוע
    ?sb.rpc("event_packages",{p_event:event.id}).then(r=>({data:(r.data||[]).map(p=>({package_id:p}))}))
    :sb.from("user_packages").select("package_id").eq("user_id",user.id)]);setTables((tData||[]).map(t=>({...t,guests:(gData||[]).filter(g=>g.table_id===t.id)})));setGuests((gData||[]).filter(g=>!g.table_id));setUserPackages((pkgData||[]).map(p=>p.package_id));setLoading(false);};
  // בועת הסבר על בורר מפה/רשימה — פעם אחת לכל דפדפן
  const [viewTip,setViewTipRaw]=useState(()=>{try{return !localStorage.getItem("sidor_view_tip");}catch{return false;}});
  const setViewTip=v=>{setViewTipRaw(v);if(!v)optSet("sidor_view_tip","1");};
  const moveTablePos=useCallback((id,x,y)=>setTables(ts=>ts.map(t=>t.id===id?{...t,x,y}:t)),[]);
  const saveTablePos=async(id,x,y)=>await sb.from("tables").update({x:Math.round(x),y:Math.round(y)}).eq("id",id);

  // ─── ביטול פעולה (↩): שיבוץ/הוצאת אורחים, הושבה אוטומטית, הזזה ויישור שולחנות ───
  const [undoStack,setUndoStack]=useState([]);
  const pushUndo=(label,run)=>setUndoStack(s=>[...s.slice(-19),{label,run}]);
  // מחזיר אורחים לשולחן שהיו בו ([{id,table_id}])
  const restoreGuests=async list=>{
    const by={};list.forEach(({id,table_id})=>{(by[table_id??"null"]||=[]).push(id);});
    await Promise.all(Object.entries(by).map(([tid,ids])=>sb.from("guests").update({table_id:tid==="null"?null:tid}).in("id",ids)));
    await loadAll(true);
  };
  // מחזיר שולחנות למיקום הקודם ([{id,x,y}])
  const restoreTablePos=async list=>{
    setTables(ts=>ts.map(t=>{const p=list.find(o=>o.id===t.id);return p?{...t,x:p.x,y:p.y}:t;}));
    await Promise.all(list.map(p=>saveTablePos(p.id,p.x,p.y)));
  };
  const undo=async()=>{
    const top=undoStack[undoStack.length-1];if(!top||saving)return;
    setUndoStack(s=>s.slice(0,-1));setSaving(true);
    try{await top.run();}catch(e){alert("❌ הביטול לא הצליח: "+(e?.message||e));}
    setSaving(false);
  };
  const lastUndo=undoStack[undoStack.length-1];
  // Ctrl+Z במסך ההושבה (לא בתוך שדה טקסט)
  const undoRef=useRef(undo);undoRef.current=undo;
  useEffect(()=>{
    if(screen!=="seating")return;
    const onKey=e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==="z"&&!/input|textarea|select/i.test(e.target.tagName)){e.preventDefault();undoRef.current();}};
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[screen]);
  const undoBtn=(style={})=>(
    <button onClick={undo} disabled={!lastUndo||saving} title={lastUndo?`ביטול: ${lastUndo.label} (Ctrl+Z)`:"אין פעולה לבטל"} className="sx-btn"
      style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.blue,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:900,cursor:lastUndo?"pointer":"default",fontFamily:"inherit",whiteSpace:"nowrap",opacity:lastUndo?1:.45,...style}}>
      ↩ בטל{lastUndo?` · ${lastUndo.label}`:""}
    </button>
  );

  // יישור שולחנות במקום: שורות לפי הגובה שבו הונחו, ריווח אחיד בתוך השורה, בלי להזיז את המפה
  const alignTables=async()=>{
    if(!tables.length)return;
    const snap=v=>Math.round(v/10)*10; // גם שמאלה/מעל נקודה 0 — לא מושכים שולחנות חזרה
    const wOf=t=>t.type==="knight"?240:200;
    const sorted=[...tables].sort((a,b)=>a.y-b.y);
    const rows=[];
    sorted.forEach(t=>{const r=rows[rows.length-1];if(r&&t.y-r[0].y<100)r.push(t);else rows.push([t]);});
    const next={};let prevY=-Infinity;
    tables.forEach(t=>{if(lockedTables.has(t.id))next[t.id]={x:t.x,y:t.y};});
    rows.forEach(r=>{
      if(r.some(t=>lockedTables.has(t.id))){r.forEach(t=>{next[t.id]={x:t.x,y:t.y};});prevY=Math.max(prevY,...r.map(t=>t.y));return;} // שורה עם שולחן נעול — לא נוגעים בה
      const y=Math.max(snap(r.reduce((s,t)=>s+t.y,0)/r.length),prevY+180);prevY=y;
      let prevX=-Infinity,prevW=0;
      [...r].sort((a,b)=>a.x-b.x).forEach(t=>{const x=Math.max(snap(t.x),prevX+prevW);next[t.id]={x,y};prevX=x;prevW=wOf(t);});
    });
    const before=tables.map(t=>({id:t.id,x:t.x,y:t.y}));
    const changed=tables.filter(t=>next[t.id].x!==t.x||next[t.id].y!==t.y);
    if(!changed.length)return;
    setTables(ts=>ts.map(t=>({...t,...next[t.id]})));
    await Promise.all(changed.map(t=>saveTablePos(t.id,next[t.id].x,next[t.id].y)));
    pushUndo("יישור שולחנות",()=>restoreTablePos(before));
  };

  const dropOnTable=async(toId,guestId,fromId)=>{
    const allG=[...guests,...tables.flatMap(t=>t.guests||[])];
    const guest=allG.find(g=>String(g.id)===String(guestId));
    const toTable=tables.find(t=>String(t.id)===String(toId));
    if(!guest||!toTable)return;
    // בדוק שהשולחן לא מלא (אלא אם זה אותו שולחן)
    if(String(fromId)!==String(toId)&&(toTable.guests||[]).length>=toTable.seats)return;
    // אותו שולחן  -  אל תעשה כלום
    if(String(fromId)===String(toId))return;
    setSaving(true);
    await sb.from("guests").update({table_id:toId}).eq("id",guestId);
    pushUndo(`הושבת ${guest.name}`,()=>restoreGuests([{id:guest.id,table_id:guest.table_id||null}]));
    setTables(ts=>ts.map(t=>{
      // הסר מהשולחן הקודם
      if(fromId&&String(t.id)===String(fromId))return{...t,guests:(t.guests||[]).filter(g=>String(g.id)!==String(guestId))};
      // הוסף לשולחן החדש
      if(String(t.id)===String(toId))return{...t,guests:[...(t.guests||[]).filter(g=>String(g.id)!==String(guestId)),{...guest,table_id:toId}]};
      return t;
    }));
    // הסר מרשימת הממתינים
    setGuests(gs=>gs.filter(g=>String(g.id)!==String(guestId)));
    setSaving(false);
  };
  const removeFromTable=async(tid,guest)=>{setSaving(true);await sb.from("guests").update({table_id:null}).eq("id",guest.id);pushUndo(`הוצאת ${guest.name}`,()=>restoreGuests([{id:guest.id,table_id:tid}]));setTables(ts=>ts.map(t=>t.id===tid?{...t,guests:(t.guests||[]).filter(g=>g.id!==guest.id)}:t));setGuests(gs=>{const already=gs.some(g=>g.id===guest.id);return already?gs:[...gs,{...guest,table_id:null}];});setSaving(false);};
  const editTable=async(id,name,type,seats,num)=>{if(num&&Number(num)!==Number(tableNumsRef.current[id]))setTableNum(id,num);setSaving(true);await sb.from("tables").update({name,type,seats}).eq("id",id);setTables(ts=>ts.map(t=>t.id===id?{...t,name,type,seats}:t));setSaving(false);};
  const deleteTable=async(id)=>{setSaving(true);await sb.from("guests").update({table_id:null}).eq("table_id",id);await sb.from("tables").delete().eq("id",id);const freed=tables.find(t=>t.id===id)?.guests||[];setTables(ts=>ts.filter(t=>t.id!==id));setGuests(gs=>[...gs,...freed.map(g=>({...g,table_id:null}))]);setSaving(false);};
  const addGuest=async(data)=>{
    const sp=splitNamePhone(data?.name||newGuest,data?.phone);
    const name=sp.name;if(!name)return;
    // הוספה מהירה (שורת "שם אורח חדש") עם טלפון שכבר קיים  -  לא יוצרים כפול
    if(!data&&findByPhone([...guests,...tables.flatMap(t=>t.guests||[])],sp.phone)){alert(`📞 המספר ${sp.phone} כבר קיים ברשימה  -  אפשר לעדכן את האורח הקיים דרך ✏️`);return;}
    setSaving(true);
    const row={name,phone:sp.phone||null,rsvp:data?.rsvp||"pending",guest_count:data?.guest_count||1,event_id:event.id,table_id:null};
    if(data?.relation)row.relation=data.relation;
    const{data:d}=await insertGuestRow(row);
    if(d)setGuests(gs=>[...gs,{relation:row.relation,...d}]);
    setNewGuest("");setSaving(false);
  };
  const editGuest=async(id,data)=>{
    data={...data,...splitNamePhone(data.name,data.phone)};
    setSaving(true);
    const patch={name:data.name,phone:data.phone||null,rsvp:data.rsvp,guest_count:data.guest_count};
    if(data.relation!==undefined)patch.relation=data.relation;
    const res=await saveGuestRow(id,patch);
    if(res.ok){
      const applied=res.relationSkipped?(({relation,...r})=>r)(data):data;
      setGuests(gs=>gs.map(g=>g.id===id?{...g,...applied}:g));
      setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(g=>g.id===id?{...g,...applied}:g)})));
    }
    setSaving(false);
  };
  const addTable=async()=>{setModal("addTable");};
  // שולחן חדש: המקום הפנוי הכי קרוב לרחבה (לא על שולחן או אלמנט). אין מקום על המסך — מרחיבים את השטח (המפה תתכווץ)
  const freeSpot=type=>{
    const off=tableOff(type),r=hallRect();
    for(let g=0;g<=6;g++){
      const e=g*220,p=findFree(off,[r[0]-e,r[1],r[2]+e,r[3]+e*.7],true);
      if(p)return p;
    }
    const [,,,y1]=contentBox();
    return {x:Math.round(r[0]+HALL_MARGIN-off[0]),y:Math.round(y1+40-off[1])};
  };
  // x/y בטבלה הם מספרים שלמים — מעגלים (באירוע ריק המיקום הפנוי יוצא עם שבר והשמירה נכשלה)
  const doAddTable=async(name,type)=>{if(!name?.trim())return;setSaving(true);const seats=TABLE_TYPES[type].defaultSeats;const spot=freeSpot(type);const{data,error}=await sb.from("tables").insert({name:name.trim(),type,seats,x:Math.round(spot.x),y:Math.round(spot.y),event_id:event.id}).select().single();setSaving(false);if(error){alert("❌ השולחן לא נוסף: "+error.message);return;}if(data)setTables(ts=>[...ts,{...data,guests:[]}]);setModal(null);};
  // ─── תבניות אולם: שמירת מפת השולחנות (וגם במה/בר/כניסה) וטעינה לאירוע אחר באותו אולם ───
  const [tplOpen,setTplOpen]=useState(false),[tpls,setTpls]=useState(null);
  const saveTemplate=async()=>{
    if(!tables.length){alert("אין עדיין שולחנות לשמירה");return;}
    const name=window.prompt("שם התבנית (למשל: אולמי הגן · אולם A)",event.venue||"");
    if(!name?.trim())return;
    const data={tables:tablesNum.map(t=>({name:t.name,type:t.type,seats:t.seats,x:t.x,y:t.y,num:t.num})),hall:hallRef.current||{}};
    const{error}=await sb.from("hall_templates").insert({name:name.trim(),data});
    alert(error?"❌ התבנית לא נשמרה: "+error.message:`✅ התבנית "${name.trim()}" נשמרה (${data.tables.length} שולחנות)`);
  };
  const openTemplates=async()=>{
    setTplOpen(true);setTpls(null);
    const{data,error}=await sb.from("hall_templates").select("id,name,data,created_at").order("created_at",{ascending:false});
    setTpls(error?[]:data||[]);
  };
  const applyTemplate=async tpl=>{
    const seatedN=tables.reduce((n,t)=>n+(t.guests||[]).length,0);
    if(tables.length&&!window.confirm(`התבנית תחליף את ${tables.length} השולחנות הקיימים${seatedN?`, ו-${seatedN} אורחים יחזרו לממתינים להושבה`:""}. להמשיך?`))return;
    setSaving(true);
    if(tables.length){
      await sb.from("guests").update({table_id:null}).eq("event_id",event.id);
      const{error}=await sb.from("tables").delete().eq("event_id",event.id);
      if(error){setSaving(false);alert("❌ לא ניתן להחליף את השולחנות: "+error.message);await loadAll(true);return;}
    }
    const src=tpl.data?.tables||[];
    const{data:rows,error}=await sb.from("tables").insert(src.map(t=>({name:t.name,type:t.type,seats:t.seats,x:t.x,y:t.y,event_id:event.id}))).select();
    if(error){setSaving(false);alert("❌ טעינת התבנית נכשלה: "+error.message);await loadAll(true);return;}
    const nums={};(rows||[]).forEach((r,i)=>{nums[r.id]=src[i]?.num||i+1;});
    await saveTableNums(nums);
    await saveHall(tpl.data?.hall||{});
    await loadAll(true);setSaving(false);setTplOpen(false);
  };
  // תבנית מוכנה: מחליפה את השולחנות, מוסיפה את האלמנטים, ואז "סידור מושלם" מציב הכל (אחרי שהשולחנות החדשים נטענו)
  const pendingPerfectRef=useRef(false);
  const applyBuiltin=async tpl=>{
    const seatedN=tables.reduce((n,t)=>n+(t.guests||[]).length,0);
    if(tables.length&&!window.confirm(`התבנית "${tpl.name}" תחליף את ${tables.length} השולחנות הקיימים${seatedN?`, ו-${seatedN} אורחים יחזרו לממתינים להושבה`:""}. להמשיך?`))return;
    setSaving(true);
    if(tables.length){
      await sb.from("guests").update({table_id:null}).eq("event_id",event.id);
      const{error}=await sb.from("tables").delete().eq("event_id",event.id);
      if(error){setSaving(false);alert("❌ לא ניתן להחליף את השולחנות: "+error.message);await loadAll(true);return;}
    }
    let n=0;
    const rows=tpl.tables.flatMap(([type,seats,count])=>Array.from({length:count},()=>({name:`שולחן ${++n}`,type,seats,x:0,y:0,event_id:event.id})));
    const{data:ins,error}=await sb.from("tables").insert(rows).select();
    if(error){setSaving(false);alert("❌ טעינת התבנית נכשלה: "+error.message);await loadAll(true);return;}
    const nums={};(ins||[]).forEach((r,i)=>{nums[r.id]=i+1;});
    await saveTableNums(nums);
    const stamp=Date.now().toString(36);
    await saveHall({size:"s",items:tpl.items.map((k,i)=>({id:`${k}_${stamp}${i}`,kind:k,x:0,y:0,w:HALL_ITEM_KINDS[k].w,h:HALL_ITEM_KINDS[k].h}))});
    pendingPerfectRef.current=true;
    await loadAll(true);setSaving(false);setTplOpen(false);
    setScreen("seating");setView("map");
  };
  useEffect(()=>{if(pendingPerfectRef.current&&tables.length&&tables.every(t=>!t.x&&!t.y)){pendingPerfectRef.current=false;perfectLayout("s");}},[tables]);
  const deleteTemplate=async tpl=>{
    if(!window.confirm(`למחוק את התבנית "${tpl.name}"?`))return;
    const{error}=await sb.from("hall_templates").delete().eq("id",tpl.id);
    if(error)alert("❌ "+error.message);else setTpls(l=>(l||[]).filter(x=>x.id!==tpl.id));
  };
  const templatesModal=tplOpen&&(
    <div style={{position:"fixed",inset:0,zIndex:330,background:"rgba(43,29,63,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setTplOpen(false)}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" role="dialog" aria-label="תבניות אולם" style={{background:"#fff",borderRadius:20,padding:20,width:"100%",maxWidth:520,maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
          <div style={{flex:1,fontWeight:900,fontSize:17,color:C.text}}>🏛️ תבניות אולם</div>
          <button onClick={()=>setTplOpen(false)} aria-label="סגירה" style={{background:C.blueXL,border:"none",borderRadius:10,width:32,height:32,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>טוענים מפת שולחנות שמורה (כולל מספרים, במה, בר וכניסה). האורחים לא נמחקים, רק חוזרים לממתינים להושבה.</div>
        <div style={{fontSize:13,fontWeight:900,color:C.text,margin:"4px 0 8px"}}>✨ תבניות מוכנות</div>
        {BUILTIN_HALLS.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 10px",marginBottom:8}}>
            <HallPreview tpl={t}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text}}>{t.icon} {t.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{t.desc}</div>
              <div style={{fontSize:12,color:C.muted}}>{t.items.map(k=>HALL_ITEM_KINDS[k].icon).join(" ")}</div>
            </div>
            <button onClick={()=>applyBuiltin(t)} disabled={saving} style={{background:C.blue,color:"#fff",border:"none",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>📥 טען</button>
          </div>
        ))}
        <div style={{fontSize:13,fontWeight:900,color:C.text,margin:"16px 0 8px"}}>💾 התבניות שלי</div>
        <button onClick={saveTemplate} disabled={!tables.length} className="sx-btn" style={{width:"100%",background:tables.length?GRAD:"#E2E8F0",color:tables.length?"#fff":"#999",border:"none",borderRadius:12,padding:11,fontSize:14,fontWeight:900,cursor:tables.length?"pointer":"default",fontFamily:"inherit",marginBottom:14}}>💾 שמור את האולם הנוכחי כתבנית</button>
        {tpls===null?<div style={{textAlign:"center",padding:20}}><Spinner size={22}/></div>
          :!tpls.length?<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:16}}>עוד אין תבניות שמורות</div>
          :tpls.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 10px",marginBottom:8}}>
              <HallPreview tpl={t}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:14,color:C.text}}>{t.name}</div>
                <div style={{fontSize:12,color:C.muted}}>{(t.data?.tables||[]).length} שולחנות · {(t.data?.tables||[]).reduce((n,x)=>n+(x.seats||0),0)} מקומות · {new Date(t.created_at).toLocaleDateString("he-IL")}</div>
              </div>
              <button onClick={()=>applyTemplate(t)} disabled={saving} style={{background:C.blue,color:"#fff",border:"none",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>📥 טען</button>
              <button onClick={()=>deleteTemplate(t)} aria-label={`מחיקת ${t.name}`} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#A0AEC0"}}>🗑️</button>
            </div>
          ))}
      </div>
    </div>
  );
  const selTable=tables.find(t=>t.id===selected);
  const seated=tables.reduce((s,t)=>s+(t.guests||[]).length,0);
  const total=seated+guests.length;
  // ייבוא קובץ אורחים (אקסל / CSV / Google Contacts)
  const importSheetFile=async file=>{
    if(/\.vcf$/i.test(file.name)){alert("קובץ vCard לא נתמך. בייצוא מ-Google Contacts בחרו Google CSV.");return;}
    setSaving(true);
    let a=null;
    try{a=await analyzeSheetFile(file);}catch(err){setSaving(false);alert("לא הצלחנו לקרוא את הקובץ. ודאו שזה קובץ אקסל או CSV");return;}
    setSaving(false);
    if(!a){alert("הקובץ ריק. לא מצאנו בו שורות");return;}
    // לא בטוחים בזיהוי — מבקשים ממי שמעלה לסמן איזו עמודה היא מה
    if(a.unsure){setImportMap(a);return;}
    await importParsedGuests(a.parsed,importDetectedNote(a));
  };
  const importParsedGuests=async(parsed,note="")=>{
    setSaving(true);
    try{
      const res=prepareImport(parsed,[...guests,...tables.flatMap(t=>t.guests||[])],event.id);
      if(res.toInsert.length>0){const{error}=await sb.from("guests").insert(res.toInsert);if(error)throw error;await loadAll(true);}
      setImportMap(null);
      alert(res.toInsert.length||res.dupes.length?importSummary(res)+(note?"\n\n"+note:""):"לא נמצאו אורחים עם שם בקובץ");
    }catch(err){alert("שמירת האורחים נכשלה. נסו שוב");}
    setSaving(false);
  };
  const importMapModal=importMap&&<ImportMapper data={importMap} busy={saving} onCancel={()=>setImportMap(null)} onImport={p=>importParsedGuests(p)}/>;
  // הושבה אוטומטית (מתוך סידורי הושבה): עדכון אחד לכל שולחן במקום אחד לכל אורח
  const applyAutoSeating=async assignments=>{
    setSaving(true);
    const byTable={};assignments.forEach(a=>{(byTable[a.tableId]||=[]).push(a.guestId);});
    const res=await Promise.all(Object.entries(byTable).map(([tid,ids])=>sb.from("guests").update({table_id:tid}).in("id",ids)));
    const err=res.find(r=>r.error)?.error;
    pushUndo(`הושבה אוטומטית (${assignments.length})`,()=>restoreGuests(assignments.map(a=>({id:a.guestId,table_id:null}))));
    await loadAll(true);setSaving(false);
    if(err){alert("❌ חלק מהאורחים לא שובצו: "+err.message);return;}
    setModal(null);
  };
  const autoSeatModal=modal==="autoSeat"&&(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:12}} onClick={()=>setModal(null)}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.bg,borderRadius:22,width:"100%",maxWidth:720,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)"}}>
        <AISeatingScreen event={event} tables={tables} guests={toSeat} onApply={applyAutoSeating} onClose={()=>setModal(null)} saving={saving}/>
      </div>
    </div>
  );

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,flexDirection:"column",gap:14}}><Spinner size={40}/><p style={{color:C.muted,fontSize:15,fontFamily:"'Heebo',sans-serif"}}>טוען...</p></div>);

  if(mobile){
    // כותרת הסרגל העליון היא הכותרת הראשית של המסך — חוץ ממסכים שיש להם כותרת משלהם
    const TopTitleTag=["home","budget","sms"].includes(screen)?"span":"h1";
    const confirmed=guests.filter(g=>g.rsvp==="confirmed").reduce((s,g)=>s+(g.guest_count||1),0);
    const declined=guests.filter(g=>g.rsvp==="declined").reduce((s,g)=>s+(g.guest_count||1),0);
    const eventIcon=event.event_type==="wedding"?"💍":event.event_type==="bar_mitzvah"?"✡️":event.event_type==="brit"?"👶":"💼";

    const HomeScreen=()=>{
      const allG=[...guests,...tables.flatMap(t=>t.guests||[])];
      const confirmed=allG.filter(g=>g.rsvp==="confirmed").reduce((s,g)=>s+(g.guest_count||1),0);
      const declined=allG.filter(g=>g.rsvp==="declined").reduce((s,g)=>s+(g.guest_count||1),0);
      const pending=allG.filter(g=>!g.rsvp||g.rsvp==="pending").reduce((s,g)=>s+(g.guest_count||1),0);
      const totalG=allG.reduce((s,g)=>s+(g.guest_count||1),0);
      const rsvpPct=totalG>0?Math.round(confirmed/totalG*100):0;
      const inviteUrl=`${window.location.origin}/#/invite/${event.invite_code||""}`;
      const eventDate=event.date?new Date(event.date):null;
      const daysLeft=eventDate?Math.ceil((eventDate-new Date())/(1000*60*60*24)):null;
      // checklist
      const checks=setupSteps(allG);
      const nextStep=checks.find(c=>!c.done);
      const checksDone=checks.filter(c=>c.done).length;
      const checksPct=Math.round(checksDone/checks.length*100);

      return(
      <div className={`hm${hmFirst()?" hm-anim":""}`} style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",background:"radial-gradient(760px 520px at 92% 0%,#F8F3FF 0%,rgba(248,243,255,0) 62%),radial-gradient(680px 520px at 4% 40%,#FFF4F9 0%,rgba(255,244,249,0) 62%),#FFFEFC",minHeight:"100vh",paddingBottom:80}}>

        <style>{HOME_CSS}</style>
        <div style={{padding:"12px 14px 0"}}><EventHomeHero event={event} inviteUrl={inviteUrl} checksPct={checksPct} onGo={setScreen} noGuests={!allG.length}/></div>
        <div style={{padding:"0 14px"}}><HomeNews event={event} guests={allG} onGo={setScreen} style={{marginTop:12}}/></div>
        {/* סדר המסך כמו במחשב: מה לעשות עכשיו ← אישורי הגעה ← פעולות ← משימות ← שליחה אוטומטית ← השאר (מקופל) */}
        <div style={{padding:"12px 14px 0",display:"grid",gap:12}}>
          <PostEventCard event={event} onGo={setScreen}/>
          <HomeNext checks={checks} nextStep={nextStep} pending={pending} hasGuests={allG.length>0} onGo={setScreen}/>
          <HomeRsvpDonut confirmed={confirmed} declined={declined} pending={pending} total={totalG} onOpen={()=>setScreen("rsvp")}/>
        </div>

        {/* ─── קיצורי דרך: אותם כרטיסים עם תמונה כמו במחשב, ומתחתם שאר הפעולות באותו סגנון ─── */}
        <section className="hm-sec hm-sec-m" aria-labelledby="hm-short-m">
          <h2 className="hm-h2" id="hm-short-m">קיצורי דרך</h2>
          <EventHomeTiles event={event} seated={seated} total={total} people={totalG} tablesCount={tables.length} onGo={setScreen}/>
          <div className="hm-minis">
            {[
              {icon:"➕",label:"הוסף אורח",nav:"add",bg:"#FFF6EF",color:"#1a8c5a"},
              {icon:"📱",label:"הודעות SMS",nav:"sms",bg:"#FFF5E6",color:"#B45309"},
              {icon:"💬",label:"WhatsApp",nav:"whatsapp",bg:"#FFF6EF",color:"#1a8c5a"},
              {icon:"📦",label:"חבילות",nav:"packages",bg:"#FFF0FB",color:"#B03A8C"},
              {icon:"💰",label:"תקציב",nav:"budget",bg:"#FFFBE6",color:"#B48009"},
              {icon:"📷",label:"כניסה לאולם",nav:"checkin",bg:"#EEF7FF",color:"#2B6CB0"},
              {icon:"🎁",label:"מתנות",nav:"gifts",bg:"#FFF0F6",color:"#B03A8C"},
              {icon:"💡",label:"ספקים ומחירים",nav:"vendors",bg:"#F4EEFF",color:"#7C3AED"},
              {icon:"📋",label:"פרטי האירוע",nav:"settings",bg:"#F4EEFC",color:"#5B3C8C"},
              {icon:"⚙️",label:"הגדרות",nav:"user_settings",bg:"#F5F5F5",color:"#555"},
            ].filter(item=>!(couple&&COUPLE_HIDDEN.includes(item.nav))&&!producerOnly(item.nav)).map(item=>(
              <button key={item.nav} type="button" className="hm-mini" style={{"--bg":item.bg}} onClick={()=>lockedFor(item.nav)?setModal(couple&&COUPLE_HIDDEN.includes(item.nav)?null:"locked"):setScreen(item.nav)}>
                <i aria-hidden="true">{item.icon}</i><span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
        <div className="hm-cardw" style={{padding:"0 14px",display:"grid",gap:12}}>
          <UpcomingTasks event={event} onOpen={()=>setScreen("tasks")}/>
          <HomeAutoSend event={event} records={allG.length} onGo={setScreen} style={{margin:0}}/>
          <HomeMore event={event} style={{marginTop:0}}>
            <GiftLinksCard key={event.id} event={event} style={{margin:0,padding:0,boxShadow:"none"}}/>
            <TestimonialCard user={user} event={event}/>
          </HomeMore>
        </div>
      </div>
    );};

    return(<div dir="rtl" className="sx-app" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {/* TOP BAR */}
      <div className="sx-top" style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0,position:"relative",zIndex:5}}>
        <style>{TOP_CSS}</style>
        {screen==="home"
          ? <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",whiteSpace:"nowrap"}}>→ האירועים שלי</button>
          : <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit"}}>→ חזרה</button>
        }
        <TopTitleTag className="sx-title" style={{flex:1,margin:0,fontWeight:800,fontSize:15,color:"#fff",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
          {screen==="home"?event.name:screen==="seating"?"הושבה":screen==="add"?"➕ הוסף אורח":screen==="import"?"📊 ייבוא אורחים":screen==="rsvp"?"👥 ניהול אורחים":screen==="invite"?"💌 הזמנה דיגיטלית":screen==="budget"?"💰 ניהול תקציב":screen==="ai"?"🤖 AI סידור חכם":screen==="packages"?"📦 חבילות":screen==="sms"?"📱 הודעות SMS":screen==="whatsapp"?"💬 הודעות WhatsApp":screen==="checkin"?"📷 כניסה לאולם":screen==="gifts"?"🎁 מתנות":screen==="tasks"?"✅ משימות":screen==="settings"?"📋 פרטי האירוע":event.name}
        </TopTitleTag>
        {saving&&<Spinner size={16} color="#9B6BFF"/>}
        {screen!=="seating"&&<SupportMenu event={event} compact/>}
        {screen==="seating"&&<button onClick={undo} disabled={!lastUndo||saving} aria-label="ביטול פעולה" title={lastUndo?`ביטול: ${lastUndo.label}`:"אין פעולה לבטל"} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:"6px 10px",cursor:lastUndo?"pointer":"default",fontSize:12,fontWeight:800,fontFamily:"inherit",whiteSpace:"nowrap",opacity:lastUndo?1:.5}}>↩ בטל</button>}
        {screen==="seating"&&<button onClick={()=>setModal("autoSeat")} className="sx-prim" style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:800,fontFamily:"inherit",whiteSpace:"nowrap"}}>🤖 הושבה אוטומטית</button>}
      </div>

      <div className={["whatsapp","gifts","tasks","checkin","vendors","packages","user_settings","invite","import","contacts","add"].includes(screen)?"ap":undefined} style={{flex:1,overflow:"auto"}}>
        {screen==="home"&&<HomeScreen/>}
        {screen==="seating"&&<MobileSeating tables={tablesNum} items={hallItems()} hallBox={hallRect()}
          mapTools={{
            locked:mapLocked,grid:gridOn(),extra:hall.extra||HALL_EXTRA_DEF,
            addItem:k=>addItem(k),perfect:()=>perfectLayout(),align:()=>alignTables(),
            toggleGrid:()=>saveHall({...hallRef.current,grid:!gridOn()}),
            toggleLock:()=>saveHall({...hallRef.current,locked:!mapLocked}),
            setExtra:(k,v)=>{const before=hallRef.current,cur=(before.extra||HALL_EXTRA_DEF)[k]||0;saveHall({...before,extra:{...(before.extra||HALL_EXTRA_DEF),[k]:v}});pushUndo(v>cur?"הגדלת האולם":"הקטנת האולם",()=>saveHall(before));},
            renameItem,deleteItem,toggleItemLock,
            moveItem:mapLocked?null:(it,x,y)=>updateItem(it.id,{x:Math.round(x),y:Math.round(y)},`הזזת ${itemLabel(it)}`),
          }}
          onMoveTable={mapLocked?null:(t,x,y)=>{const bx=t.x||0,by=t.y||0;moveTablePos(t.id,x,y);saveTablePos(t.id,x,y);pushUndo(`הזזת ${t.name}`,()=>restoreTablePos([{id:t.id,x:bx,y:by}]));}}
          snapTable={(t,x,y)=>{if(!gridOn())return{x:Math.round(x),y:Math.round(y)};const r=snapToGrid(t,x,y,hallRect());return{x:r.x,y:r.y};}}
          lockedIds={lockedTables} onPrint={printSeating} onPrintCards={printCards} onTemplates={openTemplates} guests={toSeat} declined={declinedGuests} search={search} setSearch={setSearch} newGuest={newGuest} setNewGuest={setNewGuest} addGuest={addGuest} dropOnTable={dropOnTable} removeFromTable={removeFromTable} onAddTable={()=>setModal("addTable")} onEditTable={editTable} onDeleteTable={deleteTable} onEditGuest={g=>setEditGuestData(g)}/>}
        {editGuestData&&<GuestModal guest={editGuestData} eventId={event.id} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onUpdateExisting={async(g,c)=>{await editGuest(g.id,{name:g.name,phone:g.phone,rsvp:g.rsvp,guest_count:c});setModal(null);setEditGuestData(null);}} onClose={()=>setEditGuestData(null)} onSave={async(data)=>{await editGuest(editGuestData.id,data);setEditGuestData(null);}}/>}
        {screen==="add"&&(
          <div style={{padding:20,direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>הוסף אורחים אחד אחד עם כל הפרטים</div>
            {guests.slice(-5).reverse().map(g=>(
              <Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{ini(g.name)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>{g.name}</div>
                  {g.phone&&<div style={{fontSize:12,color:C.muted}}>{g.phone}</div>}
                </div>
                <RsvpBadge rsvp={g.rsvp}/>
              </Card>
            ))}
            <button onClick={()=>setModal("addGuest")} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 14px ${C.blueL}44`}}>
              ➕ הוסף אורח חדש
            </button>
            <button onClick={()=>setScreen("contacts")} style={{width:"100%",background:C.surface,color:C.blue,border:`2px solid ${C.blueL}`,borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              📱 ייבא מאנשי קשר
            </button>
            <button onClick={()=>{loadAll();setScreen("home");}} style={{width:"100%",background:"transparent",color:C.blue,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:10}}>
              סיום ✓
            </button>
          </div>
        )}
        {modal==="addGuest"&&(<GuestModal eventId={event.id} onClose={()=>setModal(null)} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onUpdateExisting={async(g,c)=>{await editGuest(g.id,{name:g.name,phone:g.phone,rsvp:g.rsvp,guest_count:c});setModal(null);setEditGuestData(null);}} onSave={async(data)=>{await addGuest(data);setModal(null);}}/>
        )}
        {screen==="rsvp"&&<MobileRsvpScreen guests={guests} tables={tables} event={event} sb={sb} setGuests={setGuests} setTables={setTables} setModal={setModal} onImport={()=>setScreen("import")}/>}
        {screen==="import"&&(
          <div style={{padding:20,direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
            <button onClick={()=>setScreen("rsvp")} style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.blue,borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>→ חזרה לניהול אורחים</button>
            {/* בטלפון: הדרכים המהירות קודם — אנשי הקשר שבטלפון והקלדה; אקסל בדרך כלל במחשב */}
            <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:10}}>איך להוסיף את המוזמנים?</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
              {[["📱","מאנשי הקשר בטלפון",()=>setScreen("contacts")],["✍️","הקלדה או הדבקה",()=>{const t=document.getElementById("importText");t?.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>t?.focus({preventScroll:true}),350);}],["📊","קובץ Excel",()=>document.getElementById("imp-xl")?.scrollIntoView({behavior:"smooth",block:"start"})]].map(([ic,l,fn])=>(
                <button key={l} type="button" onClick={fn} style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:16,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:"0 10px 22px -18px rgba(91,60,140,.55)",minHeight:84}}>
                  <span aria-hidden="true" style={{fontSize:24}}>{ic}</span>
                  <span style={{fontSize:13,fontWeight:800,color:C.text,lineHeight:1.3,textAlign:"center"}}>{l}</span>
                </button>))}
            </div>
            <div id="imp-xl" style={{background:C.blueXL,border:`2px dashed ${C.blueL}`,borderRadius:16,padding:24,textAlign:"center",marginBottom:20,scrollMarginTop:70}}>
              <div style={{fontSize:36,marginBottom:8}}>📊</div>
              <div style={{fontSize:15,fontWeight:700,color:C.blue,marginBottom:4}}>ייבוא מ-Excel</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>המערכת מזהה לבד שם, טלפון, כמות מוזמנים ואישור הגעה. אם משהו לא ברור, נבקש מכם לסמן איזו עמודה היא מה</div>
              <label style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",borderRadius:12,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-block"}}>
                📂 בחר קובץ Excel
                <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];e.target.value="";if(f)importSheetFile(f);}}/>
              </label>
            </div>
            <GoogleContactsImport onFile={importSheetFile}/>
            {importMapModal}
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:8}}>או הדבק שמות ידנית</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>שם וטלפון בכל שורה  -  אפשר להפריד ברווח, פסיק או להדביק ישר מאקסל</div>
            <textarea placeholder={"ישראל ישראלי, 050-1234567\nרונית לוי\nמשפחת כהן, 052-9876543\n..."} id="importText"
              style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:14,fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",minHeight:160,boxSizing:"border-box",marginBottom:14,resize:"vertical"}}/>
            <button onClick={async()=>{
              const text=document.getElementById("importText").value;
              const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
              const res=prepareImport(lines.map(parseGuestLine),[...guests,...tables.flatMap(t=>t.guests||[])],event.id);const toInsert=res.toInsert;if(res.dupes.length||toInsert.length)alert(importSummary(res));
              if(toInsert.length>0){setSaving(true);await sb.from("guests").insert(toInsert);await loadAll();setSaving(false);setScreen("home");}
            }} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
              ייבא וסיים ←
            </button>
          </div>
        )}
        {screen==="packages"&&<PackagesScreen event={event} userPackages={userPackages} recordCount={guests.length+tables.reduce((n,t)=>n+(t.guests||[]).length,0)} onBack={()=>setScreen("home")}/>}
        {screen==="sms"&&<SMSScreen event={event} userPackages={userPackages} tables={tables} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
        {screen==="whatsapp"&&<WhatsAppScreen event={event} userPackages={userPackages} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
        {modal==="locked"&&(
          <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setModal(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:480,direction:"rtl"}}>
              <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:48,marginBottom:8}}>🔒</div>
                <div style={{fontSize:18,fontWeight:900,color:C.text,marginBottom:6}}>סידורי הושבה מעל {FREE_SEATING_LIMIT} מוזמנים</div>
                <div style={{fontSize:14,color:C.muted,lineHeight:1.7}}>סידורי הושבה בחינם עד {FREE_SEATING_LIMIT} מוזמנים.<br/>לאירוע גדול יותר: פתיחה חד-פעמית של ₪{BASIC_PRICE}, בלי הגבלת מוזמנים.</div>
              </div>
              <button onClick={()=>{setModal(null);setScreen("packages");}}
                style={{width:"100%",background:`linear-gradient(135deg,#B45309,#D97706)`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
                👑 צפה בחבילות
              </button>
              <button onClick={()=>setModal(null)}
                style={{width:"100%",background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                סגור
              </button>
            </div>
          </div>
        )}
        {screen==="invite"&&<InviteSettings event={event} onUpdate={e=>setScreen("home")}/>}
        {screen==="budget"&&<BudgetScreen event={event}/>}
        {screen==="checkin"&&!producerOnly("checkin")&&<CheckinScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]} tables={tablesNum} onReload={()=>loadAll(true)}/>}
        {screen==="gifts"&&<GiftsScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]} onReload={()=>loadAll(true)}/>}
        {screen==="tasks"&&<TasksScreen event={event}/>}
        {screen==="vendors"&&<VendorsScreen user={user} event={event} mobile={mobile}/>}
        {screen==="contacts"&&<ContactsScreen event={event} onAdd={async(list)=>{
          // בלי כפילויות: מי שהמספר שלו כבר ברשימה לא נוסף שוב (כמו בייבוא מאקסל)
          setSaving(true);
          const res=prepareImport(list.map(c=>({name:c.name,phone:c.phone?formatPhone(c.phone):"",count:1})),[...guests,...tables.flatMap(t=>t.guests||[])],event.id);
          if(res.toInsert.length)await sb.from("guests").insert(res.toInsert);
          await loadAll();setSaving(false);
          if(res.dupes.length)alert(importSummary(res));
          setScreen("rsvp");}}/>}
        {screen==="settings"&&<EventDetailsScreen event={event} sb={sb} user={user} onLogout={logout} onUpdate={updateEvent}/>}
        {screen==="user_settings"&&<MobileSettingsScreen user={user} event={event} sb={sb} setGuests={setGuests} setScreen={setScreen}/>}
        {screen==="settings_event"&&<EventDetailsScreen event={event} sb={sb} user={user} onLogout={logout} onUpdate={updateEvent}/>}
      </div>
      <BottomNav active={screen} onChange={setScreen} userPackages={userPackages} totalGuests={guestPeople([...guests,...tables.flatMap(t=>t.guests||[])])} trialExpired={trialExpired}/>
      {modal==="receipt"&&<ReceiptModal tables={tablesNum} onClose={()=>setModal(null)}/>}
      {modal==="addTable"&&<AddTableModal onConfirm={doAddTable} onClose={()=>setModal(null)}/>}
      {autoSeatModal}{templatesModal}
    </div>);
  }

  const navItems=[
    {id:"home",icon:"🏠",label:"ראשי"},
    {id:"settings",icon:"📋",label:"פרטי האירוע"},
    {id:"seating",icon:"🪑",label:"סידורי הושבה"},
    {id:"rsvp",icon:"👥",label:"ניהול אורחים"},
    {id:"packages",icon:"📦",label:"חבילות"},
    {id:"sms",icon:"📱",label:"הודעות SMS"},
    {id:"whatsapp",icon:"💬",label:"WhatsApp"},
    {id:"budget",icon:"💰",label:"ניהול תקציב"},
    {id:"checkin",icon:"📷",label:"כניסה לאולם"},
    {id:"gifts",icon:"🎁",label:"מתנות"},
    {id:"tasks",icon:"✅",label:"משימות"},
    {id:"vendors",icon:"💡",label:"ספקים ומחירים"},
    {id:"user_settings",icon:"⚙️",label:"הגדרות"},
  ];

  return(<div dir="rtl" className="sx-app" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,color:C.text,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* TOP HEADER */}
    <header className="sx-top" style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"0 18px",height:60,position:"sticky",top:0,zIndex:90,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <style>{TOP_CSS}</style>
      <button onClick={()=>setSidebarOpen(o=>!o)} aria-label="תפריט המסכים" aria-expanded={!!sidebarOpen} className="sx-burger"
        style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",cursor:"pointer",borderRadius:10,padding:"6px 10px",display:"flex",flexDirection:"column",gap:4,alignItems:"center",justifyContent:"center",width:36,height:36,flexShrink:0}}>
        <span style={{width:16,height:2,background:"#fff",borderRadius:1,display:"block"}}/>
        <span style={{width:16,height:2,background:"#fff",borderRadius:1,display:"block"}}/>
        <span style={{width:16,height:2,background:"#fff",borderRadius:1,display:"block"}}/>
      </button>
      {screen!=="home"
        ?<button onClick={()=>setScreen("home")} className="sx-btn" style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",borderRadius:10,padding:"5px 12px"}}>→ חזרה</button>
        :<button onClick={onBack} className="sx-btn" style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",borderRadius:10,padding:"5px 12px"}}>→ כל האירועים</button>}
      <span className="sx-title" style={{fontWeight:800,fontSize:15,color:"#fff",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{event.name}</span>
      {saving&&<Spinner size={16} color="#9B6BFF"/>}
      {/* בורר תצוגה בולט (מפה / רשימה / אורחים): כפתור פעיל לבן, ובפעם הראשונה בועת הסבר */}
      {screen==="seating"&&<div style={{position:"relative",display:"flex",alignItems:"center",gap:8}}>
        <span className="sx-view-lbl" aria-hidden="true">תצוגה:</span>
        <div role="tablist" aria-label="תצוגת ההושבה" style={{display:"flex",gap:3,background:"rgba(0,0,0,.18)",border:"1px solid rgba(255,255,255,.35)",borderRadius:14,padding:3}}>
          {[["list","📋","רשימת שולחנות"],["map","🗺️","מפת האולם"],["guests","👥","אורחים"]].map(([v,ic,l])=>(
            <button key={v} role="tab" aria-selected={view===v} onClick={()=>{setView(v);setViewTip(false);}}
              style={{display:"flex",alignItems:"center",gap:6,background:view===v?"#fff":"transparent",color:view===v?C.blue:"#fff",border:"none",borderRadius:11,padding:"7px 14px",fontSize:13.5,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:view===v?"0 4px 12px rgba(0,0,0,.22)":"none",transition:"all .15s",whiteSpace:"nowrap"}}>
              <span style={{fontSize:16}}>{ic}</span>{l}
            </button>))}
        </div>
        {viewTip&&<div role="status" style={{position:"absolute",top:"calc(100% + 10px)",right:0,zIndex:95,background:"#2B1D3F",color:"#fff",borderRadius:12,padding:"10px 14px",fontSize:13,fontWeight:700,width:260,boxShadow:"0 12px 30px -10px rgba(0,0,0,.4)",lineHeight:1.5}}>
          <span style={{position:"absolute",top:-6,right:28,width:12,height:12,background:"#2B1D3F",transform:"rotate(45deg)"}}/>
          👆 כאן עוברים בין <b>מפת האולם</b> (גרירה על המפה) ל<b>רשימת השולחנות</b> (כרטיס לכל שולחן).
          <button onClick={()=>setViewTip(false)} style={{display:"block",marginTop:8,background:"#fff",color:"#2B1D3F",border:"none",borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>הבנתי</button>
        </div>}
      </div>}
      <span className="sx-count" title="אורחים ששובצו מתוך כל האורחים" style={{background:"rgba(255,255,255,.15)",color:"#fff",borderRadius:100,fontSize:12,fontWeight:700,padding:"5px 12px"}}>🪑 {seated}/{total}</span>
      <SupportMenu event={event}/>
      <button onClick={()=>onHome?.()} className="sx-home" style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",color:"rgba(255,255,255,.8)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",borderRadius:10,padding:"5px 12px"}}>🏠 דף הבית</button>
    </header>

    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      {/* SIDEBAR */}
      {sidebarOpen&&(()=>{
        // צבע לכל כפתור  -  אייקון באריח צבעוני; הכפתור הפעיל בגרדיאנט של המותג
        const NAV_COLORS={home:C.blueM,settings:C.blueL,seating:C.coral,rsvp:C.success,import:C.info,budget:C.gold,packages:"#9147D6",sms:C.info,whatsapp:WA_GREEN,ai:C.blueL,user_settings:C.muted};
        const NAV_GRAD={home:["#FFD6E8","#FF9CC6"],settings:["#E6DAFF","#B99BFF"],seating:["#FFE3D1","#FFB089"],rsvp:["#D6F5E5","#8EDDB8"],packages:["#EEDDFF","#C9A0FF"],sms:["#D9EEFF","#9CCBFF"],whatsapp:["#D4F7E2","#7FE0A8"],budget:["#FFF2CC","#FFD36B"],checkin:["#E2E8FF","#A9B8FF"],gifts:["#FFE2F0","#FFA8CF"],tasks:["#DDF7EA","#93E2BE"],vendors:["#FFF1D4","#FFC970"],user_settings:["#EFEBF5","#CFC6DE"]};
        const days=event.date?Math.ceil((new Date(event.date)-new Date())/864e5):null;
        return(
        <div className="sx-side" style={{width:240,background:"linear-gradient(180deg,#FFFFFF 0%,#FFF7FB 55%,#F6F0FF 100%)",display:"flex",flexDirection:"column",flexShrink:0,height:"100%",overflowY:"auto",borderLeft:`1px solid ${C.border}`,boxShadow:"4px 0 24px -12px rgba(91,60,140,.18)",scrollbarWidth:"none"}}>
          <style>{`
            .sx-side::-webkit-scrollbar{display:none}
            .sx-nav{position:relative;display:flex;align-items:center;gap:11px;margin:3px 10px;padding:7px 8px;border-radius:100px;cursor:pointer;font-family:'Fredoka','Heebo',sans-serif;font-synthesis-weight:none;
              color:${C.text};font-size:14.5px;font-weight:700;border:1px solid transparent;background:transparent;
              transition:background .18s,transform .18s,box-shadow .2s,border-color .18s,color .18s}
            .sx-nav .sx-ic{position:relative;width:38px;height:38px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;
              background:radial-gradient(120% 120% at 25% 15%,rgba(255,255,255,.85) 0%,rgba(255,255,255,0) 42%),linear-gradient(145deg,var(--g1,#F3E9FF),var(--g2,#D9C6FF));
              box-shadow:0 8px 16px -9px color-mix(in srgb,var(--g2,#D9C6FF) 85%,#2B1D3F),inset 0 -2px 0 rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.7);
              transition:transform .3s cubic-bezier(.3,1.6,.5,1),box-shadow .25s ease}
            .sx-nav .sx-ic > span{filter:drop-shadow(0 2px 2px rgba(43,29,63,.22));display:inline-block}
            .sx-nav:hover{background:#fff;border-color:${C.border};transform:translateX(-4px);box-shadow:0 8px 18px -12px rgba(91,60,140,.45)}
            .sx-nav:hover .sx-ic{transform:translateY(-2px) scale(1.1) rotate(-8deg);box-shadow:0 12px 20px -10px color-mix(in srgb,var(--g2,#D9C6FF) 90%,#2B1D3F),inset 0 -2px 0 rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.7)}
            .sx-nav.on .sx-ic:after{content:"";position:absolute;inset:-4px;border-radius:17px;border:2px solid color-mix(in srgb,var(--g2,#D9C6FF) 70%,#fff);opacity:.7}
            @media (prefers-reduced-motion:no-preference){
              .sx-nav.on .sx-ic > span{animation:sxFloat 2.8s ease-in-out infinite}
              .sx-nav.on .sx-ic:after{animation:sxRing 2.8s ease-in-out infinite}
            }
            @keyframes sxFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(-5deg)}}
            @keyframes sxRing{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.08);opacity:.35}}
            .sx-nav:focus-visible{outline:3px solid ${C.blueL};outline-offset:1px}
            .sx-nav.on{background:linear-gradient(120deg,#FFE4F0 0%,#EFE4FF 100%);color:#2B1D3F;font-weight:700;box-shadow:0 10px 22px -16px rgba(240,96,158,.6),inset 0 0 0 1.5px #F6CFE2;transform:none}
            .sx-nav.on .sx-ic{box-shadow:0 10px 18px -9px color-mix(in srgb,var(--g2,#D9C6FF) 90%,#2B1D3F),inset 0 -2px 0 rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.7)}
            .sx-nav.on::before{content:none}
            .sx-nav.locked{color:#9C93AE}
            .sx-nav.locked .sx-ic{filter:grayscale(.6);opacity:.75}
            @media (prefers-reduced-motion:reduce){.sx-nav,.sx-nav .sx-ic{transition:none}.sx-nav:hover,.sx-nav:hover .sx-ic{transform:none}}
          `}</style>

          {/* כרטיס האירוע הנוכחי */}
          <div style={{margin:"14px 12px 8px",borderRadius:26,padding:"16px 16px 14px",background:"linear-gradient(150deg,#EFE4FF 0%,#FFE4F0 55%,#FFE9DC 100%)",fontFamily:"'Fredoka','Heebo',sans-serif",color:"#2B1D3F",position:"relative",overflow:"hidden",boxShadow:"0 14px 28px -20px rgba(155,107,255,.6)",flexShrink:0}}>
            <div style={{position:"absolute",top:-24,left:-24,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.55)"}}/>
            <div style={{position:"absolute",bottom:-30,right:-14,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.4)"}}/>
            <div style={{position:"relative"}}>
              <div style={{fontSize:12,fontWeight:800,letterSpacing:".04em",marginBottom:4,color:"#7A3FBF"}}>האירוע הנוכחי</div>
              <div style={{fontSize:15,fontWeight:900,lineHeight:1.3,marginBottom:6}}>{event.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                {days!==null&&days>=0&&<span style={{background:"#fff",color:"#B4236A",borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:900}}>⏳ עוד {days} ימים</span>}
                {event.date&&<span style={{fontSize:12,fontWeight:700,color:"#3E3555"}}>📅 {new Date(event.date).toLocaleDateString("he-IL",{day:"numeric",month:"short"})}</span>}
              </div>
              {event.venue&&<div style={{fontSize:12,color:"#3E3555",marginTop:4}}>📍 {event.venue}</div>}
            </div>
          </div>

          <nav style={{flex:"1 0 auto",padding:"6px 0 8px"}} aria-label="תפריט ניהול">
            {navItems.filter(item=>!(couple&&COUPLE_HIDDEN.includes(item.id))&&!producerOnly(item.id)).map(item=>{
              const isLocked=(()=>{
                return lockedFor(item.id);
              })();
              const on=screen===item.id;
              return(
                <div key={item.id} role="button" tabIndex={0} aria-current={on?"page":undefined}
                  className={`sx-nav${on?" on":""}${isLocked?" locked":""}`} style={{"--c":NAV_COLORS[item.id]||C.blueL,"--g1":(NAV_GRAD[item.id]||NAV_GRAD.settings)[0],"--g2":(NAV_GRAD[item.id]||NAV_GRAD.settings)[1]}}
                  onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.currentTarget.click();}}}
                  onClick={()=>{
                    if(isLocked){setScreen("packages");return;}
                    if(item.id==="receipt")setModal("receipt");
                    else if(item.id==="addTable")setModal("addTable");
                    else setScreen(item.id);
                  }}>
                  <span className="sx-ic"><span>{item.icon}</span></span>
                  <span style={{flex:1}}>{item.label}</span>
                  {isLocked&&<span title="דורש חבילה" style={{fontSize:12,background:"#FFF4E0",color:"#B07A12",borderRadius:100,padding:"2px 7px",fontWeight:800}}>🔒</span>}
                  {item.id==="tasks"&&(()=>{const n=taskList(event).filter(t=>taskLate(t,event)).length;return n>0&&<span title={`${n} משימות באיחור`} style={{fontSize:12,background:C.danger,color:"#fff",borderRadius:100,padding:"2px 7px",fontWeight:800}}>{n}</span>;})()}
                </div>
              );
            })}
          </nav>
          <div style={{padding:"8px 10px 14px",borderTop:`1px solid ${C.border}`}}>
            <div role="button" tabIndex={0} className="sx-nav" style={{"--c":C.danger,color:C.danger,margin:"3px 0"}}
              onKeyDown={e=>{if(e.key==="Enter")logout();}} onClick={logout}>
              <span className="sx-ic">🚪</span><span>התנתק</span>
            </div>
          </div>
        </div>
        );
      })()}

      {/* תוכן ראשי — רקע בהיר עם הילות בצבעי המותג, כמו מסך הבית */}
      <div className={["whatsapp","gifts","tasks","checkin","vendors","packages","user_settings","invite","import","contacts","add"].includes(screen)?"ap":undefined} style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0,background:"radial-gradient(760px 520px at 92% 0%,#F3EAFF 0%,rgba(243,234,255,0) 62%),radial-gradient(680px 520px at 4% 50%,#FFEAF3 0%,rgba(255,234,243,0) 62%),#FFFBF7"}}>

      {screen==="home"&&(
      <div className={`hm${hmFirst()?" hm-anim":""}`} style={{flex:1,overflowY:"auto",background:"radial-gradient(760px 520px at 92% 0%,#F8F3FF 0%,rgba(248,243,255,0) 62%),radial-gradient(680px 520px at 4% 40%,#FFF4F9 0%,rgba(255,244,249,0) 62%),#FFFEFC",padding:"24px 28px 40px",direction:"rtl"}}>
        {(()=>{
          const allG=[...guests,...tables.flatMap(t=>t.guests||[])];
          const confirmed=allG.filter(g=>g.rsvp==="confirmed").reduce((s,g)=>s+(g.guest_count||1),0);
          const declined=allG.filter(g=>g.rsvp==="declined").reduce((s,g)=>s+(g.guest_count||1),0);
          const pending=allG.filter(g=>!g.rsvp||g.rsvp==="pending").reduce((s,g)=>s+(g.guest_count||1),0);
          const totalG=allG.reduce((s,g)=>s+(g.guest_count||1),0);
          const rsvpPct=totalG>0?Math.round(confirmed/totalG*100):0;
          const inviteUrl=`${window.location.origin}/#/invite/${event.invite_code||""}`;
          const eventDate=event.date?new Date(event.date):null;
          const daysLeft=eventDate?Math.ceil((eventDate-new Date())/(1000*60*60*24)):null;
          const checks=setupSteps(allG);
          const nextStep=checks.find(c=>!c.done);
          const checksDone=checks.filter(c=>c.done).length;
          const checksPct=Math.round(checksDone/checks.length*100);
          return(
            <div>
              <style>{HOME_CSS}</style>
              {/* סדר המסך: מה האירוע ← מה לעשות עכשיו ← איפה עומדים ← לאן להיכנס ← שליחה אוטומטית ← השאר (מקופל) */}
              <EventHomeHero event={event} inviteUrl={inviteUrl} checksPct={checksPct} onGo={setScreen} noGuests={!allG.length}/>
              <HomeNews event={event} guests={allG} onGo={setScreen} style={{marginTop:16}}/>
              <PostEventCard event={event} onGo={setScreen} style={{marginTop:16,padding:"22px 24px"}}/>
              <HomeNext checks={checks} nextStep={nextStep} pending={pending} hasGuests={allG.length>0} onGo={setScreen} style={{marginTop:16}}/>
              <div className="hm-grid">
                <HomeRsvpDonut confirmed={confirmed} declined={declined} pending={pending} total={totalG} onOpen={()=>setScreen("rsvp")}/>
                <div className="hm-cardw" style={{display:"grid"}}>
                  <UpcomingTasks event={event} onOpen={()=>setScreen("tasks")} style={{padding:"22px 24px"}}/>
                </div>
              </div>
              <section className="hm-sec" aria-labelledby="hm-short">
                <h2 className="hm-h2" id="hm-short">קיצורי דרך</h2>
                <EventHomeTiles event={event} seated={seated} total={total} people={totalG} tablesCount={tables.length} onGo={setScreen}/>
              </section>
              <HomeAutoSend event={event} records={allG.length} onGo={setScreen}/>
              <HomeMore event={event}>
                <GiftLinksCard key={event.id} event={event} style={{padding:"22px 24px",margin:0}}/>
                <TestimonialCard user={user} event={event}/>
              </HomeMore>

            </div>
          );
        })()}
      </div>
    )}


    {/* מסכי תוכן */}
    {/* במסך נמוך (מחשב נייד) המפה מקבלת לפחות ~620px גובה, והדף נגלל למטה — במקום מפה דחוסה מתחת לסרגל הכלים */}
    {screen!=="home"&&screen==="seating"&&<div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 76px)",gap:8,padding:8,boxSizing:"border-box",
      background:"radial-gradient(circle at 85% 0%,rgba(240,96,158,.10),transparent 40%),radial-gradient(circle at 10% 100%,rgba(155,107,255,.10),transparent 45%),#FBF7FE"}}>
      {/* כותרת המסך לקוראי מסך (במסך עצמו השם מופיע בלשוניות "מפת האולם / רשימת שולחנות") */}
      <h1 style={{position:"absolute",width:1,height:1,overflow:"hidden",clip:"rect(0 0 0 0)",whiteSpace:"nowrap",margin:-1}}>סידורי הושבה</h1>
      {/* עיצוב בסגנון המסך הראשי: כרטיסים לבנים מעוגלים, צל רך, אריחי אייקון צבעוניים */}
      <style>{`
        .sx-card{background:#fff;border:1px solid #EFE8F7;border-radius:20px;box-shadow:0 14px 34px -22px rgba(91,60,140,.45)}
        .sx-guest{transition:transform .15s,box-shadow .15s,border-color .15s}
        .sx-guest:hover{transform:translateY(-1px);border-color:${C.blueL}!important;box-shadow:0 8px 18px -12px rgba(91,60,140,.5)}
        .sx-ictile{width:34px;height:34px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
        .sx-stat{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #EFE8F7;border-radius:12px;padding:3px 9px 3px 10px;white-space:nowrap}
        .sx-tbar{display:flex;align-items:center;gap:10px;padding:10px;margin:10px 10px 10px;background:#fff;border-radius:24px;box-shadow:0 16px 34px -24px rgba(91,60,140,.6),inset 0 0 0 1px #F1E9F8;flex-shrink:0;flex-wrap:wrap;position:relative;z-index:5}
        .sx-grp{display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:#FBF7FE;border-radius:18px;padding:5px;box-shadow:inset 0 0 0 1px #F1E9F8}
        .sx-grp .sx-btn,.sx-grp > button,.sx-grp > div > button{border-radius:100px!important;height:34px!important;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding-top:0!important;padding-bottom:0!important;box-sizing:border-box;line-height:1}
        .sx-grp > div:not(.sx-stat){display:inline-flex;align-items:center;gap:4px}
        .sx-grp > div > button[aria-label^="הזז"]{width:34px!important;padding:0!important}
        .sx-grp input{height:34px;box-sizing:border-box;border-radius:100px!important}
        .sx-tbar{align-items:center;padding:6px!important;gap:6px!important;margin:6px 6px 6px!important;flex-wrap:wrap!important}
        .sx-tbar1{flex-wrap:nowrap!important;gap:8px!important;padding:7px 10px!important;position:relative;z-index:30}
        .sx-stat1{display:flex;align-items:center;gap:8px;background:#FBF7FE;border-radius:100px;padding:4px 12px 4px 6px!important;min-width:130px;flex:0 0 auto;box-shadow:inset 0 0 0 1px #F1E9F8}
        .sx-tb{height:36px;border-radius:100px!important;border:1.5px solid #E9DDF7!important;background:#fff!important;color:#4A2C8F!important;padding:0 14px!important;font-size:13px!important;font-weight:800!important;cursor:pointer;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;flex:0 0 auto}
        .sx-tb:disabled{opacity:.45;cursor:not-allowed}
        .sx-tb-p{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)!important;color:#fff!important;border:none!important;box-shadow:0 8px 18px -10px rgba(240,96,158,.7)}
        .sx-menu{position:absolute;top:calc(100% + 6px);right:0;z-index:41;background:#fff;border:1px solid #EFE6F7;border-radius:16px;box-shadow:0 18px 40px -16px rgba(43,29,63,.35);padding:6px}
        .sx-mi{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;border-radius:11px;padding:9px 10px;font-size:13px;font-weight:800;color:#2B1D3F;cursor:pointer;font-family:inherit;text-align:right}
        .sx-mi:hover:not(:disabled),.sx-mi:focus-visible{background:#F6F0FF}
        .sx-mi:disabled{opacity:.45;cursor:not-allowed}
        @media(max-width:1250px){.sx-tbar1{flex-wrap:wrap!important;row-gap:6px!important}}
        .sx-tbar .sx-grp{flex-wrap:nowrap!important;flex-shrink:0}
        .sx-tbar .sx-grp[aria-label="נתוני ההושבה"] .sx-stat:not(:first-child){display:none}
        .sx-grp{min-height:42px;padding:3px!important}
        .sx-stat{padding:2px 9px!important}
        .sx-stat .sx-ictile{width:26px;height:26px;border-radius:9px;font-size:13px}
        .sx-stat b{font-size:14px;font-weight:900;line-height:1}
        .sx-stat small{display:block;font-size:12px;color:#5F5675;font-weight:700}
        @media (prefers-reduced-motion:reduce){.sx-guest{transition:none}.sx-guest:hover{transform:none}}
      `}</style>
      {!asideOpen&&(
        <button onClick={()=>setAsideOpen(true)} title="פתיחת רשימת האורחים" className="sx-btn sx-card"
          style={{flexShrink:0,width:44,cursor:"pointer",fontFamily:"inherit",color:C.blue,fontWeight:900,fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:8,paddingTop:14}}>
          <span className="sx-ictile" style={{background:"#FFE9F2"}}>👥</span><span style={{writingMode:"vertical-rl",letterSpacing:1}}>אורחים ({toSeat.length})</span><span>‹</span>
        </button>
      )}
      <aside className="sx-card" style={{width:asideOpen?320:0,display:asideOpen?"flex":"none",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
        {selTable?(
          <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
            {/* כפתור חזרה  -  בולט */}
            <div style={{padding:"10px 14px",background:GRAD,flexShrink:0}}>
              <button onClick={()=>setSelected(null)}
                style={{width:"100%",background:"rgba(255,255,255,.2)",border:"2px solid rgba(255,255,255,.6)",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:800,fontFamily:"inherit",borderRadius:10,padding:"9px",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                ← חזרה לרשימת אורחים
              </button>
            </div>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,background:"linear-gradient(135deg,#FFF4F8,#F4EEFF)",flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:8}}>
                <span className="sx-ictile" style={{background:GRAD,color:"#fff",fontWeight:900,fontSize:15}}>{numOf(selTable)}</span>
                <span style={{fontWeight:800,fontSize:15,color:C.text,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(selTable.name||"").replace(/^\s*\d+\s*/,"")||`שולחן ${numOf(selTable)}`}</span>
                <span style={{background:sColor(selTable)+"22",color:sColor(selTable),borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px"}}>{(selTable.guests||[]).length}/{selTable.seats}</span>
              </div>
              <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct(selTable)}%`,background:`linear-gradient(90deg,${C.blueM},${C.blueL})`,borderRadius:3,transition:"width .3s"}}/>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
              {(selTable.guests||[]).length===0&&<p style={{color:C.muted,fontSize:13,textAlign:"center",marginTop:20}}>גרור אורחים לכאן</p>}
              {(selTable.guests||[]).map(g=>(
                <div key={g.id} draggable className="sx-guest" onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));e.dataTransfer.setData("fromTable",String(selTable.id));}}
                  style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"9px 11px",marginBottom:7,cursor:"grab"}}>
                  <div style={{width:32,height:32,borderRadius:11,background:RELATION_COLORS[g.relation]||C.blueL,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,flexShrink:0}}>{ini(g.name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{g.name}</div>
                    <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                      {g.relation&&<span style={{fontSize:12,background:C.blueXL,color:"#3A3050",borderRadius:100,padding:"1px 7px",fontWeight:600}}>{g.relation}</span>}
                      <RsvpBadge rsvp={g.rsvp}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <button onClick={e=>{e.stopPropagation();setEditGuestData(g);}} style={{background:C.blueXL,border:`1px solid ${C.border}`,color:C.blue,borderRadius:7,padding:"4px 7px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✏️</button>
                    <button onClick={async e=>{e.stopPropagation();await removeFromTable(selTable.id,g);}}
                      style={{background:"#FFF5F5",border:`1px solid #FED7D7`,color:"#C53030",borderRadius:7,padding:"4px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,whiteSpace:"nowrap"}}>
                      הוצא
                    </button>
                  </div>
                </div>
              ))}
              <div onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDrop={e=>{e.preventDefault();e.stopPropagation();const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(selTable.id,gid,f);}}
                style={{border:`2px dashed ${C.blueL}`,borderRadius:12,padding:"16px",textAlign:"center",color:C.blue,fontSize:13,marginTop:10,background:C.blueXL,fontWeight:700}}>
                ⬇ שחרר אורח כאן
              </div>
            </div>
            <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,flexShrink:0,background:"#fff"}}>
              <button onClick={()=>setModal("addGuest")} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:10,padding:"9px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ➕ הוסף אורח לשולחן
              </button>
            </div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
            <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:"linear-gradient(135deg,#FFF4F8,#F4EEFF)",flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8}}>
                <span className="sx-ictile" style={{background:"#FFE9F2"}}>👥</span>
                <span style={{fontWeight:900,fontSize:15,color:C.text}}>ממתינים להושבה</span>
                <span style={{background:C.gold+"22",color:C.gold,borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px",marginRight:"auto",marginLeft:8}}>{toSeat.length}</span>
                <button onClick={()=>setAsideOpen(false)} title="קיפול הרשימה — המפה תקבל את כל הרוחב" aria-label="קיפול רשימת האורחים"
                  style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,cursor:"pointer",fontSize:15,fontWeight:900,lineHeight:1,flexShrink:0}}>›</button>
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש..." style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 14px"}}>
              {toSeat.length===0&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40}}>🎉</div><p style={{color:C.success,fontWeight:700,fontSize:14,marginTop:8}}>כולם מוסבים!</p></div>}
              {toSeat.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())).map(g=>(
                <div key={g.id} draggable className="sx-guest" onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));}}
                  style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"8px 11px",cursor:"grab",marginBottom:7}}>
                  <div style={{width:32,height:32,borderRadius:11,background:RELATION_COLORS[g.relation]||C.blueL,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,flexShrink:0}}>
                    {ini(g.name)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{g.name}</div>
                    <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                      {g.relation&&<span style={{fontSize:12,background:(RELATION_COLORS[g.relation]||"#9B8CB5")+"22",color:"#3A3050",borderRadius:100,padding:"1px 7px",fontWeight:600,whiteSpace:"nowrap"}}>{g.relation}</span>}
                      <RsvpBadge rsvp={g.rsvp}/>
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setEditGuestData(g);}} style={{background:C.blueXL,border:`1px solid ${C.border}`,color:C.blue,borderRadius:7,padding:"4px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,flexShrink:0}}>✏️</button>
                </div>
              ))}
              {/* מי שסימן "לא מגיע": מקופל כברירת מחדל; אפשר עדיין לגרור לשולחן אם התוכניות השתנו */}
              {declinedGuests.length>0&&<div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                <button onClick={()=>setShowDeclined(o=>!o)} aria-expanded={showDeclined}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:8,background:"none",border:"none",padding:"4px 2px",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:800,color:"#4A4060"}}>
                  לא מגיעים <span style={{background:"#FDECEC",color:"#B42318",borderRadius:100,padding:"1px 9px",fontSize:12}}>{declinedGuests.length}</span>
                  <span style={{marginRight:"auto",fontSize:12,color:"#5F5675"}}>{showDeclined?"הסתרה ▲":"הצגה ▼"}</span>
                </button>
                {showDeclined&&<>
                  <div style={{fontSize:12,color:"#5F5675",margin:"6px 2px 8px",lineHeight:1.5}}>לא נספרים להושבה. אם התוכניות השתנו — גוררים לשולחן.</div>
                  {declinedGuests.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())).map(g=>(
                    <div key={g.id} draggable className="sx-guest" onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));}}
                      style={{display:"flex",alignItems:"center",gap:8,background:"#FBFAFC",border:`1px dashed ${C.border}`,borderRadius:14,padding:"8px 11px",cursor:"grab",marginBottom:7,opacity:.85}}>
                      <div style={{width:32,height:32,borderRadius:11,background:"#B9B0C8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,flexShrink:0}}>{ini(g.name)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.text}}>{g.name}</div>
                        <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                          {g.relation&&<span style={{fontSize:12,background:"#F1ECF7",color:"#3A3050",borderRadius:100,padding:"1px 7px",fontWeight:600,whiteSpace:"nowrap"}}>{g.relation}</span>}
                          <RsvpBadge rsvp={g.rsvp}/>
                        </div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();setEditGuestData(g);}} aria-label={`עריכת ${g.name}`} style={{background:C.blueXL,border:`1px solid ${C.border}`,color:C.blue,borderRadius:7,padding:"4px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,flexShrink:0}}>✏️</button>
                    </div>
                  ))}
                </>}
              </div>}
            </div>
            <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,flexShrink:0,background:"#fff"}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={newGuest} onChange={e=>setNewGuest(e.target.value)} placeholder="שם אורח חדש..."
                  style={{flex:1,background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit"}}
                  onKeyDown={e=>e.key==="Enter"&&addGuest()}/>
                <button onClick={addGuest} style={{background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:"9px 16px",cursor:"pointer",fontSize:16,fontWeight:700}}>+</button>
              </div>
              <button onClick={()=>setModal("addGuest")} style={{width:"100%",background:C.blueXL,color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ➕ הוסף עם פרטים מלאים
              </button>
            </div>
          </div>
        )}
      </aside>
      <main className="sx-card" style={{flex:1,minWidth:0,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {/* zIndex 250: מעל הכותרת והתפריטים, אבל מתחת לחלונות העריכה (300) כדי שייפתחו מעל המסך המלא */}
        {view==="map"&&<div style={mapFull?{position:"fixed",inset:0,zIndex:250,background:"#F6F0F8",display:"flex",flexDirection:"column",direction:"rtl",fontFamily:"'Heebo',sans-serif"}:{display:"contents"}}>
          {/* ─── סרגל כלים של המפה ─── */}
          {(()=>{
            const allSeats=tables.reduce((s,t)=>s+(t.seats||0),0);
            const fullTables=tables.filter(t=>(t.guests||[]).length>=t.seats).length;
            const p=total?Math.round(seated/total*100):0;
            const q=mapFind.trim().toLowerCase();
            const found=q?tables.filter(t=>(t.guests||[]).some(g=>g.name.toLowerCase().includes(q))).length:0;
            const zBtn={width:30,height:30,borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"};
            return(
              <div role="toolbar" aria-label="כלי המפה" className="sx-tbar sx-tbar1">
                {/* שורה אחת: מצב ההושבה · פעולות עיקריות · חיפוש · תפריט כלים · ביטול ומסך מלא. (הזזת המפה: גרירה, גלגלת או חיצים במקלדת) */}
                <div className="sx-stat sx-stat1" title={`${Math.max(allSeats-seated,0)} מקומות פנויים · ${fullTables} שולחנות מלאים · ${toSeat.length} ממתינים להושבה`}>
                  <span className="sx-ictile" style={{background:"#F1E8FF"}} aria-hidden="true">🪑</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:5,whiteSpace:"nowrap"}}><b style={{color:C.text}}>{seated}/{total}</b><small style={{display:"inline"}}>הושבו</small><span style={{marginRight:"auto",fontSize:12,fontWeight:900,color:"#B8306F"}}>{p}%</span></div>
                    <div style={{height:5,background:"#F1EAF8",borderRadius:100,overflow:"hidden",marginTop:3}}>
                      <div style={{height:"100%",width:`${p}%`,background:GRAD,borderRadius:100,transition:"width .5s cubic-bezier(.3,1.3,.5,1)"}}/>
                    </div>
                  </div>
                </div>
                <button onClick={addTable} className="sx-btn sx-tb" title="הוספת שולחן חדש למפה">+ שולחן</button>
                <button onClick={()=>setModal("autoSeat")} className="sx-btn sx-btn-primary sx-tb sx-tb-p" title="המערכת מושיבה את הממתינים לפי קבוצות">🤖 הושבה אוטומטית</button>
                {/* הוספת אלמנט לאולם: במה, רחבה, בר, כניסה... */}
                <div style={{position:"relative"}}>
                  <button disabled={mapLocked} onClick={()=>{setAddItemOpen(o=>!o);setToolsOpen(false);}} className="sx-btn sx-tb" aria-expanded={addItemOpen} aria-haspopup="menu" title={mapLocked?"המפה נעולה":"במה, רחבה, בר, כניסה ועוד"}>
                    ➕ הוסף לאולם ▾
                  </button>
                  {addItemOpen&&<>
                    <div onClick={()=>setAddItemOpen(false)} style={{position:"fixed",inset:0,zIndex:40}}/>
                    <div role="menu" className="sx-menu" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,width:300}}>
                      {Object.entries(HALL_ITEM_KINDS).map(([k,K])=>(
                        <button key={k} role="menuitem" onClick={()=>addItem(k)} className="sx-mi">
                          <span style={{fontSize:18}} aria-hidden="true">{K.icon}</span>{K.label}
                        </button>
                      ))}
                    </div>
                  </>}
                </div>
                <div style={{position:"relative",flex:"0 1 170px",minWidth:120}}>
                  <input value={mapFind} onChange={e=>setMapFind(e.target.value)} placeholder="🔍 איפה יושב/ת?" aria-label="חיפוש אורח במפה"
                    style={{width:"100%",boxSizing:"border-box",background:C.blueXL,border:`1.5px solid ${q&&!found?C.danger:C.border}`,borderRadius:100,padding:"8px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit",height:36}}/>
                  {q&&<span style={{position:"absolute",left:10,top:10,fontSize:12,fontWeight:800,color:found?C.success:C.danger}}>{found?`${found} ✓`:"לא נמצא"}</span>}
                </div>
                {/* כל כלי הסידור בתפריט אחד */}
                <div style={{position:"relative"}}>
                  <button onClick={()=>{setToolsOpen(o=>!o);setAddItemOpen(false);}} className="sx-btn sx-tb" aria-expanded={toolsOpen} aria-haspopup="menu">🛠 כלים{mapLocked?" · 🔒":""} ▾</button>
                  {toolsOpen&&<>
                    <div onClick={()=>setToolsOpen(false)} style={{position:"fixed",inset:0,zIndex:40}}/>
                    <div role="menu" className="sx-menu" style={{width:290,right:"auto",left:0}}>
                      {[
                        ["✨","סידור מושלם","שולחנות בשורות ישרות מסביב לבמה ולרחבה",()=>perfectLayout(),mapLocked],
                        ["📐","יישור","מיישר לשורות, קרוב למקום שבו הנחתם",alignTables,mapLocked],
                        [gridOn()?"▦":"▢",gridOn()?"ריבועים: פעיל":"ריבועים: כבוי",gridOn()?"שולחן נכנס למרכז ריבוע. לחיצה: גרירה חופשית":"גרירה חופשית. לחיצה: ריבועים",()=>saveHall({...hallRef.current,grid:!gridOn()}),false],
                        ["🏛️","תבניות אולם","אולם מוכן, או אולם ששמרתם",openTemplates,mapLocked],
                        ["🖨️","פתק שולחן","חיפוש אורח והדפסת פתק עם מספר השולחן",()=>setModal("receipt"),false],
                        [mapLocked?"🔓":"🔒",mapLocked?"שחרור המפה":"נעילת המפה",mapLocked?"אפשר שוב להזיז שולחנות ואלמנטים":"שולחנות ואלמנטים לא יזוזו (אורחים כן)",()=>saveHall({...hallRef.current,locked:!mapLocked}),false],
                      ].map(([ic,l,d,fn,dis])=>(
                        <button key={l} role="menuitem" disabled={dis} onClick={()=>{setToolsOpen(false);fn();}} className="sx-mi" title={dis?"המפה נעולה":undefined}>
                          <span style={{fontSize:18,width:24,textAlign:"center"}} aria-hidden="true">{ic}</span>
                          <span style={{display:"flex",flexDirection:"column",gap:1,minWidth:0}}><b style={{fontSize:13.5}}>{l}</b><small style={{fontSize:12,color:"#6E6585",fontWeight:500}}>{d}</small></span>
                        </button>
                      ))}
                    </div>
                  </>}
                </div>
                <div style={{display:"flex",gap:6,marginRight:"auto",alignItems:"center"}}>
                  {undoBtn({maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",height:36,borderRadius:100})}
                  <button onClick={()=>setMapFull(f=>!f)} className={mapFull?"sx-btn sx-tb":"sx-btn sx-btn-primary sx-tb sx-tb-p"}
                    title={mapFull?"יציאה ממסך מלא (Esc)":"פתיחת המפה על כל המסך"}>
                    {mapFull?"✕ יציאה":"⛶ מסך מלא"}
                  </button>
                </div>
              </div>
            );
          })()}
          <div onDragOver={e=>e.preventDefault()}
            onDrop={e=>{if(e.defaultPrevented)return;e.preventDefault();}}
            onMouseDown={startPan}
            ref={mapBoxRef} dir="ltr" className="sx-map"
            style={{flex:1,minHeight:0,overflow:"hidden",position:"relative",cursor:"grab",touchAction:"none",
              // רקע כמו ה-Hero בדף הבית: שמנת חמה עם הילה ורודה-סגולה
              backgroundColor:"#FFFBF7",backgroundImage:"radial-gradient(circle at 60% 35%,rgba(240,96,158,.16),transparent 55%),radial-gradient(circle at 30% 75%,rgba(155,107,255,.14),transparent 55%),linear-gradient(180deg,#FFF4EE,#FFF7FB 45%,#FFFBF7)",
              backgroundSize:"100% 100%,100% 100%,100% 100%"}}>
            {(()=>{
              // שכבת האולם: מיקומים בקואורדינטות של האולם; המצלמה (הזזה+זום) מוחלת עליה
              const [hx0,hy0,hx1,hy1]=hallRect();
              const MAP_W=Math.max(hx1,1000),MAP_H=Math.max(hy1,700);
              const q=mapFind.trim().toLowerCase();
              return(
                <>
                <div dir="rtl" ref={hallLayerRef} style={{position:"absolute",top:0,left:0,width:MAP_W,height:MAP_H,transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transformOrigin:"0 0",willChange:"transform"}}>
                  {/* רצפת האולם — כמו כרטיס המפה בדף הבית: לבן, נקודות עדינות, מסגרת וצל רך */}
                  <div ref={floorRef} aria-hidden="true" style={{position:"absolute",left:hx0+14,top:hy0+14,width:hx1-hx0-28,height:hy1-hy0-28,borderRadius:32,background:"#fff",backgroundImage:"radial-gradient(circle,#E9E1F5 1.4px,transparent 1.6px)",backgroundSize:"18px 18px",backgroundPosition:"2px 2px",border:"1px solid #EFE8F7",boxShadow:"0 50px 100px -40px rgba(91,60,140,.45),0 0 0 8px rgba(255,255,255,.6)",pointerEvents:"none"}}/>
                  {/* רשת הריבועים (GRID) + הריבוע שאליו ייכנס השולחן בזמן גרירה */}
                  {gridOn()&&<div ref={gridLayerRef} aria-hidden="true" style={{position:"absolute",left:hx0+14,top:hy0+14,width:hx1-hx0-28,height:hy1-hy0-28,borderRadius:32,pointerEvents:"none",
                    backgroundImage:"linear-gradient(to right,rgba(155,107,255,.16) 1.5px,transparent 1.5px),linear-gradient(to bottom,rgba(155,107,255,.16) 1.5px,transparent 1.5px)",
                    backgroundSize:`${GRID}px ${GRID}px`,backgroundPosition:`${(((-(hx0+14))%GRID)+GRID)%GRID}px ${(((-(hy0+14))%GRID)+GRID)%GRID}px`}}/>}
                  <div ref={snapCellRef} aria-hidden="true" style={{display:"none",position:"absolute",width:GRID,height:GRID,borderRadius:18,background:"rgba(155,107,255,.10)",border:"2px dashed rgba(155,107,255,.55)",pointerEvents:"none",transition:"left .08s,top .08s"}}/>

                  {/* כתמי צבע רכים ונצנוצים ברקע  -  כמו בדף הבית */}
                  <div className="sx-anim" style={{position:"absolute",left:hx0,top:hy0,width:hx1-hx0,height:hy1-hy0,borderRadius:28,pointerEvents:"none",overflow:"hidden"}}>
                    {/* סטטיים (בלי אנימציה): הם בתוך שכבת הזום, ואנימציה כאן מאטה גרירה וזום במסכים גדולים */}
                    <div style={{position:"absolute",top:"18%",left:"-6%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,96,158,.13),transparent 65%)"}}/>
                    <div style={{position:"absolute",bottom:"-10%",right:"-4%",width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,107,255,.13),transparent 65%)"}}/>
                    <div style={{position:"absolute",top:"45%",left:"42%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,176,74,.10),transparent 65%)"}}/>
                    {[["12%","8%",14,0,"#E8B04A"],["70%","6%",11,.7,"#F0609E"],["24%","92%",13,1.2,"#9B6BFF"],["82%","88%",15,.4,"#FF8A65"],["55%","50%",10,1.6,"#9B6BFF"],["88%","40%",12,.9,"#E8B04A"]].map(([top,left,s,d,c],i)=>(
                      <svg key={i} width={s} height={s} viewBox="0 0 20 20" style={{position:"absolute",top,left,opacity:.7}}>
                        <path d="M10 0C10.8 6 14 9.2 20 10C14 10.8 10.8 14 10 20C9.2 14 6 10.8 0 10C6 9.2 9.2 6 10 0Z" fill={c}/>
                      </svg>
                    ))}
                  </div>

                  {/* ─── אלמנטים באולם: במה, רחבה, בר, כניסה... לחיצה בוחרת; גרירה מזיזה; הפינה משנה גודל ─── */}
                  {hallItems().map(it=>{
                    const K=HALL_ITEM_KINDS[it.kind]||HALL_ITEM_KINDS.text,sel=selItem===it.id,label=itemLabel(it);
                    // גרירה חלקה (הזזה או שינוי גודל): מעדכנים את ה-DOM ישירות ושומרים בסוף, בתוך קירות האולם
                    const startItem=(e,mode)=>{
                      if(e.button!==0)return;
                      e.stopPropagation();e.preventDefault();
                      setSelItem(it.id);setSelected(null);
                      if(mapLocked||it.locked)return;
                      // האולם גדל בזמן הגרירה (כמו בשולחנות), כך שאפשר לגרור לכל כיוון בגרירה אחת
                      const node=e.currentTarget.closest("[data-item]"),sx=e.clientX,sy=e.clientY,z=zoomRef.current,h0=hallRect(),G=1200,r=[h0[0]-G,h0[1]-G,h0[2]+G,h0[3]+G];let n={...it},raf=0;
                      const mv=me=>{
                        const dx=(me.clientX-sx)/z,dy=(me.clientY-sy)/z;
                        n=mode==="move"?{...it,...clampIn(it.x+dx,it.y+dy,[0,0,it.w,it.h],r)}
                          :{...it,w:Math.round(Math.max(60,Math.min(r[2]-it.x,it.w+dx))),h:Math.round(Math.max(36,Math.min(r[3]-it.y,it.h+dy)))};
                        if(!raf)raf=requestAnimationFrame(()=>{raf=0;Object.assign(node.style,{left:n.x+"px",top:n.y+"px",width:n.w+"px",height:n.h+"px"});});
                      };
                      const up=()=>{window.removeEventListener("pointermove",mv);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up);
                        if(n.x!==it.x||n.y!==it.y||n.w!==it.w||n.h!==it.h)updateItem(it.id,{x:n.x,y:n.y,w:n.w,h:n.h},`${mode==="move"?"הזזת":"שינוי גודל"} ${label}`);};
                      window.addEventListener("pointermove",mv);window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);
                    };
                    const big=it.w>=150&&it.h>=90,fs=Math.max(12,Math.min(20,Math.min(it.w/10,it.h/2.8)));
                    const hBtn={width:30,height:30,borderRadius:9,border:"none",background:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px -4px rgba(43,29,63,.35)"};
                    // הסגנון של ההדגמה בדף הבית
                    const look=K.pill?{background:"linear-gradient(90deg,#FFE3EE,#EEE4FF)",border:"1.5px solid #F3B6CF",borderRadius:Math.min(it.h,it.w)/2,color:"#B13B72"}
                      :K.dance?{background:"repeating-conic-gradient(#F6E7CC 0 25%,#FBF3E4 0 50%) 0 0/20px 20px",border:"1.5px solid #EBCB8F",borderRadius:18,color:"#A87A22"}
                      :{background:"#fff",border:"1px solid #EFE8F7",borderRadius:K.round?"50%":16,color:LP.ink};
                    return(
                      <div key={it.id} data-item={it.id} onPointerDown={e=>startItem(e,"move")} onMouseDown={e=>e.stopPropagation()} title={mapLocked||it.locked?`${label}${it.locked?" · נעול":""}`:`${label} · גררו להזזה`}
                        className={mapLocked||it.locked?"":"sx-fixture"}
                        style={{position:"absolute",left:it.x,top:it.y,width:it.w,height:it.h,zIndex:sel?9:K.dance?1:2,userSelect:"none",cursor:mapLocked||it.locked?"default":"grab",
                          ...look,boxShadow:"0 3px 8px rgba(91,60,140,.16)",
                          outline:sel?"3px solid #9B6BFF":undefined,outlineOffset:3,
                          display:"flex",flexDirection:K.dance||(big&&!K.pill)?"column":"row",alignItems:"center",justifyContent:"center",gap:K.dance?2:big?6:8,textAlign:"center",padding:4,boxSizing:"border-box"}}>
                        {K.pill||K.dance?<>
                          {!K.dance&&<span style={{fontSize:fs*1.05,lineHeight:1,pointerEvents:"none"}}>{K.icon}</span>}
                          <span style={{fontSize:fs,fontWeight:900,lineHeight:1.15,pointerEvents:"none"}}>{label}</span>
                          {K.dance&&<span style={{fontSize:fs*1.4,lineHeight:1,pointerEvents:"none"}}>{K.icon}</span>}
                        </>:<>
                          <span style={{width:Math.min(40,it.h*.62),height:Math.min(40,it.h*.62),borderRadius:12,background:K.tile,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:Math.min(22,it.h*.36),flexShrink:0,pointerEvents:"none"}}>{K.icon}</span>
                          <span style={{fontSize:fs,fontWeight:900,lineHeight:1.15,pointerEvents:"none"}}>{label}</span>
                        </>}
                        {/* שולחן חתן-כלה: שורת כיסאות ורודים מתחת, כמו בהדגמה */}
                        {K.chairs&&<div style={{position:"absolute",top:"100%",left:"8%",right:"8%",marginTop:5,display:"flex",justifyContent:"space-around",pointerEvents:"none"}}>
                          {Array.from({length:Math.max(2,Math.min(12,Math.round(it.w/42)))}).map((_,i)=><span key={i} style={{width:16,height:10,borderRadius:4,background:LP.rose,opacity:.85}}/>)}
                        </div>}
                        {it.locked&&!sel&&<span aria-label="נעול" style={{position:"absolute",top:-10,left:-10,width:24,height:24,borderRadius:"50%",background:"#FFF4E0",border:"2px solid #fff",boxShadow:"0 2px 6px rgba(0,0,0,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,pointerEvents:"none"}}>🔒</span>}
                        {sel&&!mapLocked&&<>
                          {/* כפתורי עריכה מעל האלמנט */}
                          <div onMouseDown={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} style={{position:"absolute",top:-42,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6,zIndex:12}}>
                            <button onClick={()=>toggleItemLock(it.id)} title={it.locked?"שחרור: אפשר להזיז שוב":"נעילה: לא יזוז, גם לא בסידור מושלם"} aria-pressed={!!it.locked} aria-label={`${it.locked?"שחרור":"נעילת"} ${label}`} style={{...hBtn,background:it.locked?"#FFF4E0":"#fff"}}>{it.locked?"🔒":"🔓"}</button>
                            <button onClick={()=>renameItem(it.id)} title="שינוי שם" aria-label={`שינוי שם ל${label}`} style={hBtn}>✏️</button>
                            {!it.locked&&<button onClick={()=>deleteItem(it.id)} title="מחיקה מהמפה" aria-label={`מחיקת ${label}`} style={{...hBtn,background:"#FFF0F0"}}>🗑</button>}
                          </div>
                          {/* ידית שינוי גודל */}
                          {!it.locked&&<div onPointerDown={e=>startItem(e,"resize")} onMouseDown={e=>e.stopPropagation()} title="גררו לשינוי גודל" style={{position:"absolute",right:-9,bottom:-9,width:20,height:20,borderRadius:6,background:"#9B6BFF",border:"3px solid #fff",cursor:"nwse-resize",boxShadow:"0 2px 8px rgba(0,0,0,.25)",zIndex:12}}/>}
                        </>}
                      </div>
                    );
                  })}
                  {mapLocked&&<div style={{position:"absolute",top:10,left:10,zIndex:6,background:"rgba(255,244,224,.95)",border:`1px solid ${C.gold}`,color:"#8A5A00",borderRadius:100,padding:"4px 12px",fontSize:12,fontWeight:900,pointerEvents:"none"}}>🔒 המפה נעולה · גרירת אורחים פעילה</div>}

                  {tables.length===0&&(
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,color:C.muted,pointerEvents:"none"}}>
                      <div style={{fontSize:44}}>🪑</div>
                      <div style={{fontSize:16,fontWeight:900,color:C.text}}>האולם עדיין ריק</div>
                      <div style={{fontSize:13}}>הוסיפו שולחן ראשון והתחילו לגרור אליו אורחים</div>
                    </div>
                  )}

                  {/* ─── שולחנות ─── */}
                  {tables.map((t,ti)=>{
                    const hmd=e=>{
                      if(e.button!==0)return;
                      e.stopPropagation();
                      setSelected(t.id);setSelItem(null);
                      if(mapLocked||lockedTables.has(t.id))return; // מפה / שולחן נעולים: אפשר לבחור, לא להזיז
                      // גרירה חלקה: מזיזים את העוטף ישירות (בלי לרנדר את כל המסך בכל תזוזה) ושומרים בסוף
                      const node=e.currentTarget.closest("[data-tid]");
                      const sx=e.clientX,sy=e.clientY,bx=t.x,by=t.y,z=zoomRef.current,p0={...panRef.current};let posX=bx,posY=by,raf=0;
                      let cell=null,last=null,edgeRaf=0;
                      // האולם גדל בזמן הגרירה: שולחן שמתקרב לקצה מקבל עוד ריבוע מקום באותו כיוון — לכל ארבעת הכיוונים
                      // (עד MAXS). הרצפה והרשת מתעדכנות מיד, ואחרי השחרור האולם מחושב מחדש
                      const hr=[...hallRect()],o=tableOff(t.type),EDGE=GRID/2,MAXS=8000;
                      const growTo=(x,y)=>{let ch=false;
                        if(x+o[2]>hr[2]-EDGE&&hr[2]-hr[0]<MAXS){hr[2]=x+o[2]+GRID;ch=true;}
                        if(y+o[3]>hr[3]-EDGE&&hr[3]-hr[1]<MAXS){hr[3]=y+o[3]+GRID;ch=true;}
                        if(x+o[0]<hr[0]+EDGE&&hr[2]-hr[0]<MAXS){hr[0]=x+o[0]-GRID;ch=true;}
                        if(y+o[1]<hr[1]+EDGE&&hr[3]-hr[1]<MAXS){hr[1]=y+o[1]-GRID;ch=true;}
                        if(ch)[floorRef.current,gridLayerRef.current].forEach(el=>{if(el)Object.assign(el.style,{left:hr[0]+14+"px",top:hr[1]+14+"px",width:hr[2]-hr[0]-28+"px",height:hr[3]-hr[1]-28+"px"});});
                        if(ch&&gridLayerRef.current)gridLayerRef.current.style.backgroundPosition=`${(((-(hr[0]+14))%GRID)+GRID)%GRID}px ${(((-(hr[1]+14))%GRID)+GRID)%GRID}px`;
                      };
                      const place=()=>{
                        if(!last)return;
                        // המיקום לפי הסמן + כמה שהמפה זזה מאז תחילת הגרירה (בגלילה אוטומטית בקצה)
                        const p=panRef.current,rx=bx+(last.x-sx)/z+(p0.x-p.x)/z,ry=by+(last.y-sy)/z+(p0.y-p.y)/z;
                        growTo(rx,ry);
                        // עם רשת: השולחן קופץ לריבוע הקרוב כבר בזמן הגרירה, והריבוע מודגש
                        ({x:posX,y:posY,cell}=gridOn()?snapToGrid(t,rx,ry,hr):{...clampIn(rx,ry,o,hr),cell:null});
                        if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(node){node.style.left=posX+"px";node.style.top=posY+"px";}
                          const hl=snapCellRef.current;if(hl){if(cell){hl.style.display="block";hl.style.left=cell[0]+"px";hl.style.top=cell[1]+"px";}else hl.style.display="none";}});
                      };
                      // הסמן בקצה המפה: המפה גוללת לבד, כדי שאפשר יהיה להמשיך לגרור הלאה
                      const edgeTick=()=>{
                        edgeRaf=0;const box=mapBoxRef.current;if(!box||!last)return;
                        const r=box.getBoundingClientRect(),M=48,S=14;
                        const vx=last.x<r.left+M?S:last.x>r.right-M?-S:0,vy=last.y<r.top+M?S:last.y>r.bottom-M?-S:0;
                        if(vx||vy){const p=panRef.current;panRef.current={x:p.x+vx,y:p.y+vy};paintCam();place();edgeRaf=requestAnimationFrame(edgeTick);}
                      };
                      const mv=me=>{last={x:me.clientX,y:me.clientY};place();if(!edgeRaf)edgeRaf=requestAnimationFrame(edgeTick);};
                      const up=()=>{window.removeEventListener("pointermove",mv);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up);
                        if(edgeRaf){cancelAnimationFrame(edgeRaf);edgeRaf=0;}
                        if(raf){cancelAnimationFrame(raf);raf=0;if(node){node.style.left=posX+"px";node.style.top=posY+"px";}}
                        if(snapCellRef.current)snapCellRef.current.style.display="none";
                        // המפה גללה בזמן הגרירה: שומרים את מיקום המצלמה החדש
                        if(panRef.current.x!==p0.x||panRef.current.y!==p0.y){manualZoomRef.current=true;setPan({...panRef.current});}
                        if(posX!==bx||posY!==by){moveTablePos(t.id,posX,posY);saveTablePos(t.id,posX,posY);pushUndo(`הזזת ${t.name}`,()=>restoreTablePos([{id:t.id,x:bx,y:by}]));}
                        else [floorRef.current,gridLayerRef.current].forEach(el=>{if(el){const h=hallRect();Object.assign(el.style,{left:h[0]+14+"px",top:h[1]+14+"px",width:h[2]-h[0]-28+"px",height:h[3]-h[1]-28+"px"});}});};
                      window.addEventListener("pointermove",mv);
                      window.addEventListener("pointerup",up);
                      window.addEventListener("pointercancel",up);
                    };
                    const hit=!!q&&(t.guests||[]).some(g=>g.name.toLowerCase().includes(q));
                    return(
                      <div key={t.id} data-tid={t.id} onMouseDown={e=>e.stopPropagation()} style={{position:"absolute",left:t.x,top:t.y,zIndex:selected===t.id?10:3,opacity:q&&!hit?.35:1,transition:"opacity .2s"}}>
                        {/* כניסה מדורגת של השולחנות כשהמפה נפתחת */}
                        <div className="sx-anim" style={{position:"absolute",left:0,top:0,animation:`sxPopIn .55s cubic-bezier(.3,1.4,.5,1) ${Math.min(ti,12)*.07}s both`}}>
                        {/* המיקום נקבע ע"י העוטף  -  השולחן עצמו מצויר ביחס אליו */}
                        <TableNode table={{...t,x:0,y:0,num:numOf(t)}} selected={selected===t.id} highlight={hit} locked={mapLocked} onMouseDown={hmd}
                          onDrop={e=>{const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(t.id,gid,f);}}/>
                        </div>
                        {lockedTables.has(t.id)&&selected!==t.id&&<span aria-label="שולחן נעול" style={{position:"absolute",top:-8,left:-8,zIndex:30,width:22,height:22,borderRadius:"50%",background:"#FFF4E0",border:"2px solid #fff",boxShadow:"0 2px 6px rgba(0,0,0,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,pointerEvents:"none"}}>🔒</span>}
                        {selected===t.id&&!mapLocked&&(
                          <button onMouseDown={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();toggleTableLock(t.id);}}
                            title={lockedTables.has(t.id)?"שחרור: אפשר להזיז שוב":"נעילה: השולחן לא יזוז (גם לא בסידור מושלם). אורחים עדיין אפשר להושיב"}
                            aria-pressed={lockedTables.has(t.id)} aria-label={lockedTables.has(t.id)?"שחרור השולחן":"נעילת השולחן"}
                            style={{position:"absolute",top:-14,left:-14,zIndex:30,width:28,height:28,borderRadius:"50%",background:lockedTables.has(t.id)?"#FFF4E0":"#fff",border:`2px solid ${lockedTables.has(t.id)?C.gold:"#fff"}`,
                              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,boxShadow:"0 6px 14px -4px rgba(43,29,63,.4)"}}>{lockedTables.has(t.id)?"🔒":"🔓"}</button>
                        )}
                        {selected===t.id&&(
                          <button onMouseDown={e=>e.stopPropagation()}
                            onClick={e=>{e.stopPropagation();setEditTableData(t);}} title="עריכת שולחן"
                            style={{position:"absolute",top:-14,right:-14,zIndex:30,width:28,height:28,
                              borderRadius:"50%",background:GRAD,border:"2px solid #fff",color:"#fff",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              cursor:"pointer",fontSize:12,boxShadow:`0 6px 14px -4px ${C.blueM}`}}>✏️</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* מצב השמירה: תווית קטנה בפינה, כדי שלא תסתיר שולחנות */}
                <span role="status" style={{position:"absolute",right:14,bottom:12,zIndex:15,pointerEvents:"none",display:"inline-flex",alignItems:"center",gap:5,background:"rgba(233,251,244,.95)",color:"#17694F",borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800,boxShadow:"0 4px 12px -8px rgba(23,105,79,.5)"}}><span style={{width:7,height:7,borderRadius:"50%",background:LP.mint}}/>{saving?"שומר...":"נשמר"}</span>
                {/* כפתורי זום צפים על המפה (נוחים גם במסך מלא ובטאבלט) */}
                <div onMouseDown={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} style={{position:"absolute",left:14,top:14,zIndex:20,display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8}}>
                <div style={{display:"flex",flexDirection:"column",gap:6,background:"rgba(255,255,255,.92)",border:`1px solid ${C.border}`,borderRadius:14,padding:6,boxShadow:"0 10px 24px -12px rgba(91,60,140,.4)"}}>
                  {[["+","הגדלה",()=>zoomBy(1)],["%","חזרה לתצוגה הרגילה",()=>fitZoom()],["−","הקטנה",()=>zoomBy(-1)],["⤢","כל האולם על המסך",()=>fitZoom(true)]].map(([ic,l,fn])=>(
                    ic==="%"
                      ?<button key={l} onClick={fn} title={l} aria-label={`זום ${Math.round(zoom*100)}%. ${l}`} style={{width:40,height:24,borderRadius:8,border:"none",background:"transparent",color:"#5F5675",fontSize:12.5,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontVariantNumeric:"tabular-nums",padding:0}}>{Math.round(zoom*100)}%</button>
                      :<button key={l} onClick={fn} title={l} aria-label={l} style={{width:40,height:40,borderRadius:10,border:"none",background:ic==="+"||ic==="−"?"#F4EEFC":"#fff",color:C.blue,fontSize:ic==="+"||ic==="−"?22:16,fontWeight:900,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>{ic}</button>
                  ))}
                </div>
                {/* גודל האולם: עוד שורה/עמודה של ריבועים ריקים בכל לחיצה (ביטול עם ↩) */}
                {/* הקטנה: עד הגודל הקטן שעדיין מכיל את כל השולחנות והאלמנטים (בלי מקום נוסף) */}
                {!mapLocked&&<div role="group" aria-label="גודל האולם" dir="rtl" style={{display:"flex",flexDirection:"column",gap:4,background:"rgba(255,255,255,.92)",border:`1px solid ${C.border}`,borderRadius:14,padding:"6px 6px 7px",boxShadow:"0 10px 24px -12px rgba(91,60,140,.4)",fontFamily:"'Heebo',sans-serif"}}>
                  <div style={{fontSize:12,fontWeight:800,color:C.muted,textAlign:"center"}}>גודל האולם</div>
                  {[["w","↔","רוחב","האולם","מימין ומשמאל"],["h","↕","אורך","האולם","למעלה ולמטה"]].map(([k,ic,word,,where])=>{
                    const ex=hall.extra||HALL_EXTRA_DEF,n=ex[k]||0,step=2,max=n>=16,min=n<=0;
                    const set=(v,l)=>{const before=hallRef.current;saveHall({...before,extra:{...(before.extra||HALL_EXTRA_DEF),[k]:v}});pushUndo(l,()=>saveHall(before));
                      // מראים את כל האולם כדי שיראו את השינוי
                      setTimeout(()=>{fitZoom(true);manualZoomRef.current=true;},60);};
                    const bs=dis=>({width:32,height:32,borderRadius:9,border:"none",background:dis?"#F7F4FA":"#F4EEFC",color:C.blue,fontSize:18,fontWeight:900,lineHeight:1,cursor:dis?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",opacity:dis?.4:1,padding:0});
                    return(
                    <div key={k} style={{display:"flex",alignItems:"center",gap:4}}>
                      <span title={word} style={{width:30,display:"flex",flexDirection:"column",alignItems:"center",color:C.blue,lineHeight:1}}>
                        <span aria-hidden="true" style={{fontSize:15,fontWeight:900}}>{ic}</span>
                        <span style={{fontSize:12,fontWeight:800}}>{word}</span>
                      </span>
                      <button disabled={max} onClick={()=>set(n+step,`הגדלת ${word} האולם`)} aria-label={`הגדלת ${word} האולם`} title={max?"האולם כבר בגודל המקסימלי":`עוד מקום ל${word}, ${where}`} style={bs(max)}>+</button>
                      <button disabled={min} onClick={()=>set(Math.max(0,n-step),`הקטנת ${word} האולם`)} aria-label={`הקטנת ${word} האולם`} title={min?"האולם כבר בגודל הקטן ביותר שמכיל את כל השולחנות":`פחות מקום ל${word}`} style={bs(min)}>−</button>
                    </div>);})}
                </div>}
                </div>
                </>
              );
            })()}
          </div>
          {/* מקרא בשורה אחת (לא גונב גובה מהמפה) */}
          <div style={{padding:"6px 16px",background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",gap:"4px 14px",fontSize:12,color:"#4A4060",flexShrink:0,flexWrap:"nowrap",alignItems:"center",overflow:"hidden",whiteSpace:"nowrap"}}>
            {Object.entries(RELATION_COLORS).map(([k,c])=><span key={k} style={{display:"inline-flex",alignItems:"center",gap:5,fontWeight:700,flexShrink:0}}><span style={{width:10,height:10,borderRadius:3,background:c}}/>{k}</span>)}
            <span style={{marginRight:"auto",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}} title="גוררים אורח מהרשימה אל שולחן · גוררים שולחן כדי להזיז · גלגלת העכבר = זום · גרירת הרקע = הזזה">💡 גוררים אורח לשולחן · גלגלת = זום · גרירת הרקע = הזזה</span>
          </div>
          {celebrate&&(
            <div className="sx-anim" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:600,overflow:"hidden"}}>
              {Array.from({length:70}).map((_,i)=>(
                <span key={i} style={{position:"absolute",top:-20,left:`${(i*37)%100}%`,width:i%4?8:12,height:i%3?12:7,borderRadius:i%5?2:"50%",
                  background:BURST_COLORS[i%BURST_COLORS.length],opacity:.9,
                  animation:`sxConfetti ${2.4+(i%7)*.25}s cubic-bezier(.3,.6,.5,1) ${(i%10)*.09}s both`}}/>
              ))}
              <div style={{position:"absolute",left:"50%",top:"38%",background:"#fff",borderRadius:22,padding:"18px 28px",textAlign:"center",
                boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)",border:`2px solid ${C.blueM}33`,animation:"sxToastIn 3.4s ease both"}}>
                <div style={{fontSize:34,marginBottom:4}}>🎉</div>
                <div style={{fontSize:20,fontWeight:900,background:GRAD,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent"}}>כל האורחים הושבו!</div>
                <div style={{fontSize:13,color:C.muted,marginTop:4}}>סידור ההושבה מוכן · {seated} אורחים</div>
              </div>
            </div>
          )}
          {/* במסך מלא: חלונית צפה  -  שולחן נבחר (העברה/הוצאה/עריכה של אורחים) או רשימת הממתינים */}
          {mapFull&&(()=>{
            const panel={position:"absolute",bottom:52,right:16,width:fullListOpen?270:"auto",maxHeight:"min(66vh, calc(100vh - 170px))",display:"flex",flexDirection:"column",
              background:"rgba(255,255,255,.98)",border:`1px solid ${C.border}`,borderRadius:18,boxShadow:"0 24px 50px -20px rgba(91,60,140,.45)",zIndex:20,overflow:"hidden"};
            const avatar=g=>(<span style={{width:28,height:28,borderRadius:"50%",background:RELATION_COLORS[g.relation]||C.blueL,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>{ini(g.name)}</span>);
            const smallBtn={border:`1px solid ${C.border}`,background:C.blueXL,color:C.blue,borderRadius:8,padding:"4px 7px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0};
            const dropTo=(tableId)=>({
              onDragOver:e=>{e.preventDefault();e.stopPropagation();},
              onDrop:e=>{e.preventDefault();e.stopPropagation();const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(!gid)return;
                if(tableId)dropOnTable(tableId,gid,f);
                else if(f){const tb=tables.find(t=>String(t.id)===String(f));const g=tb&&(tb.guests||[]).find(x=>String(x.id)===String(gid));if(g)removeFromTable(tb.id,g);}},
            });

            // ─── שולחן נבחר ───
            if(selTable){
              const tg=selTable.guests||[];const fullT=tg.length>=selTable.seats;
              return(
                <div style={{...panel,width:280}}>
                  <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(160deg,${C.blueM}12,#fff)`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:15,fontWeight:900,color:C.text,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🪑 {selTable.name}</span>
                      <span style={{background:fillColor(tg.length,selTable.seats)+"22",color:fullT?C.danger:C.text,borderRadius:100,fontSize:12,fontWeight:900,padding:"2px 9px"}}>{tg.length}/{selTable.seats}</span>
                      <button onClick={()=>setEditTableData(selTable)} title="עריכת שולחן" style={smallBtn}>✏️</button>
                      <button onClick={()=>setSelected(null)} title="סגירה" style={{...smallBtn,background:"#fff"}}>✕</button>
                    </div>
                    <div style={{height:6,background:"#F1EAF8",borderRadius:100,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct(selTable)}%`,background:GRAD,borderRadius:100,transition:"width .4s"}}/>
                    </div>
                  </div>
                  <div style={{overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6}} {...dropTo(selTable.id)}>
                    {tg.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"10px 0"}}>השולחן ריק</div>}
                    {tg.map(g=>(
                      <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));e.dataTransfer.setData("fromTable",String(selTable.id));}}
                        style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"7px 9px",cursor:"grab"}}>
                        {avatar(g)}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:800,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                          {g.relation&&<div style={{fontSize:12,color:"#5F5675"}}>{g.relation}</div>}
                        </div>
                        <button onClick={()=>setEditGuestData(g)} title="עריכת אורח" style={smallBtn}>✏️</button>
                        <button onClick={()=>removeFromTable(selTable.id,g)} title="הוצאה מהשולחן" style={{...smallBtn,background:"#FFF2F4",color:C.danger,borderColor:"#F9D2D8"}}>הוצא</button>
                      </div>
                    ))}
                    <div style={{border:`2px dashed ${C.blueL}66`,borderRadius:12,padding:"10px",textAlign:"center",color:C.blue,fontSize:12,fontWeight:800,background:C.blueXL}}>
                      ⬇ שחררו כאן אורח להושבה בשולחן
                    </div>
                  </div>
                  <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`,fontSize:12,color:C.muted,lineHeight:1.5}}>
                    💡 להעברה: גררו אורח מהרשימה אל שולחן אחר במפה
                  </div>
                </div>
              );
            }

            // ─── רשימת הממתינים (אפשר גם לגרור לכאן אורח משולחן כדי להוציא אותו) ───
            return(
              <div style={panel} {...dropTo(null)}>
                <button onClick={()=>setFullListOpen(o=>!o)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"11px 14px",background:"none",border:"none",borderBottom:fullListOpen?`1px solid ${C.border}`:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:900,color:C.text}}>
                  👥 ממתינים להושבה
                  <span style={{background:C.gold+"26",color:"#B07A12",borderRadius:100,padding:"1px 9px",fontSize:12}}>{toSeat.length}</span>
                  <span style={{marginRight:"auto",color:C.muted,fontSize:12}}>{fullListOpen?"▲":"▼"}</span>
                </button>
                {fullListOpen&&(
                  <div style={{overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6}}>
                    {toSeat.length===0&&<div style={{textAlign:"center",padding:"18px 6px",color:C.success,fontWeight:800,fontSize:13}}>🎉 כולם הושבו!</div>}
                    {toSeat.map(g=>(
                      <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));}}
                        style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"7px 10px",cursor:"grab"}}>
                        {avatar(g)}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:800,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                          {g.relation&&<div style={{fontSize:12,color:"#5F5675"}}>{g.relation}</div>}
                        </div>
                        <button onClick={()=>setEditGuestData(g)} title="עריכת אורח" style={smallBtn}>✏️</button>
                      </div>
                    ))}
                    <div style={{fontSize:12,color:C.muted,textAlign:"center",padding:"4px 0 2px"}}>💡 לחצו על שולחן כדי לנהל את האורחים שבו</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>}
        {view!=="map"&&<div role="toolbar" aria-label="כלי ההושבה" className="sx-tbar">
                <div className="sx-grp" aria-label="פעולות הושבה">
                  <button onClick={addTable} className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.blue,borderRadius:100,padding:"7px 14px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>+ הוספת שולחן</button>
                  <button onClick={()=>setModal("autoSeat")} className="sx-btn sx-btn-primary" style={{background:GRAD,border:"none",color:"#fff",borderRadius:100,padding:"7px 14px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>🤖 הושבה אוטומטית</button>
                  <button onClick={()=>setModal("receipt")} className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.blue,borderRadius:100,padding:"7px 14px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}} title="חיפוש אורח והדפסת פתק עם מספר השולחן">🖨️ פתק שולחן</button>
                  {undoBtn()}
                </div>
        </div>}
        {view==="list"&&<div style={{flex:1,overflowY:"auto",padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:16,fontWeight:900,color:C.text}}>📋 סידור ההושבה לפי מספר שולחן</div>
              <div style={{fontSize:12,color:C.muted}}>{tables.length} שולחנות · {seated} מתוך {total} הושבו · לשינוי מספר: ✏️ על השולחן</div>
            </div>
            <button onClick={printSeating} className="sx-btn sx-btn-primary"
              style={{background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 8px 18px -8px ${C.blueM}`}}>
              🖨️ הדפס סידור הושבה
            </button>
            <button onClick={()=>printCards("tables")} className="sx-btn"
              style={{background:C.surface,color:C.blue,border:`1.5px solid ${C.blueL}`,borderRadius:12,padding:"10px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
              🔢 כרטיסי שולחן
            </button>
            <button onClick={()=>printCards("names")} className="sx-btn"
              style={{background:C.surface,color:C.blue,border:`1.5px solid ${C.blueL}`,borderRadius:12,padding:"10px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
              🏷️ כרטיסי שם
            </button>
            <button onClick={openTemplates} className="sx-btn"
              style={{background:C.surface,color:C.blue,border:`1.5px solid ${C.blueL}`,borderRadius:12,padding:"10px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
              🏛️ תבניות אולם
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
            {tablesNum.map(t=>{
              // השולחן עצמו מצויר כמו במפה (עגול / מרובע / אבירים, כיסאות בצבע הקבוצה); גודל האזור לפי הצורה
              const [sw,sh,ox,oy]=t.type==="knight"?[212,92,16,16]:t.type==="rect"?[146,116,18,18]:[158,158,0,0];
              return(
              <Card key={t.id} style={{padding:16,borderRadius:24,border:`1.5px solid ${selected===t.id?C.blueL:"#EFE8F7"}`,boxShadow:"0 10px 30px -18px rgba(91,60,140,.35)"}}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{e.preventDefault();const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(t.id,gid,f);}}>
                {/* כותרת שולחן */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                    <span title="מספר שולחן" style={{minWidth:30,height:30,borderRadius:9,background:tableTint(t,t.num),color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,flexShrink:0,padding:"0 6px"}}>{t.num}</span>
                    <span style={{fontSize:16}}>{TABLE_TYPES[t.type]?.icon}</span>
                    <span title={String(t.name||"").replace(/^\s*\d+\s*/,"")||undefined} style={{fontWeight:800,fontSize:14,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(t.name||"").replace(/^\s*\d+\s*/,"")||`שולחן ${t.num}`}</span>
                    <button onClick={()=>setEditTableData(t)} title="עריכת שולחן ומספר" style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:2}}>✏️</button>
                  </div>
                  <span style={{background:sColor(t)+"22",color:`color-mix(in srgb, ${sColor(t)} 55%, #000)`,borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px"}}>{(t.guests||[]).length}/{t.seats}</span>
                </div>
                {/* השולחן המצויר: גוררים אליו אורחים כמו במפה */}
                <div style={{position:"relative",height:sh+18,display:"flex",justifyContent:"center",margin:"4px 0 8px",background:"radial-gradient(circle at 50% 50%,#FFF7FB,transparent 70%)"}}>
                  <div style={{position:"relative",width:sw,height:sh,marginTop:9}}>
                    <TableNode table={{...t,x:ox,y:oy}} selected={false} locked onMouseDown={()=>{}}
                      onDrop={e=>{const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(t.id,gid,f);}}/>
                  </div>
                </div>
                {/* אורחים עם צבעי קטגוריה */}
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                  {(t.guests||[]).length===0?(
                    <div style={{border:`2px dashed ${C.border}`,borderRadius:10,padding:"10px",textAlign:"center",width:"100%",color:C.muted,fontSize:12}}>
                      ⬇ שחרר אורח כאן
                    </div>
                  ):(t.guests||[]).map(g=>(
                    <div key={g.id} draggable
                      onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));e.dataTransfer.setData("fromTable",String(t.id));}}
                      style={{display:"flex",alignItems:"center",gap:4,background:"#fff",border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 4px 3px 5px",fontSize:12,color:C.text,cursor:"grab"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.blueL}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      <div style={{width:12,height:12,borderRadius:"50%",background:RELATION_COLORS[g.relation]||"#CBD5E0",flexShrink:0}}/>
                      <span onClick={()=>setEditGuestData(g)} style={{cursor:"pointer"}}>{g.name}</span>
                      <button
                        onClick={async e=>{e.stopPropagation();await removeFromTable(t.id,g);}}
                        title="הסר מהשולחן"
                        style={{width:16,height:16,borderRadius:"50%",background:"#FEE2E2",border:"none",
                          color:"#C53030",cursor:"pointer",fontSize:12,fontWeight:900,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          flexShrink:0,lineHeight:1,padding:0}}>×</button>
                    </div>
                  ))}
                </div>
                {/* אזור גרירה + drop */}
                {(t.guests||[]).length>0&&(
                  <div style={{border:`2px dashed ${C.border}`,borderRadius:8,padding:"6px",textAlign:"center",color:C.muted,fontSize:12}}>
                    ⬇ שחרר אורח לשולחן זה
                  </div>
                )}
              </Card>
            );})}
          </div>
        </div>}
        {view==="guests"&&<div style={{flex:1,overflowY:"auto",padding:20}}>
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            {[{l:"סה״כ",v:total,c:C.blue,i:"👥"},{l:"מוסבים",v:seated,c:C.success,i:"✅"},{l:"ממתינים",v:toSeat.length,c:C.gold,i:"⏳"},{l:"פנויים",v:tables.reduce((s,t)=>s+t.seats,0)-seated,c:C.blueM,i:"🪑"}].map(({l,v,c,i})=>(
              <Card key={l} style={{padding:"14px 18px",borderTop:`3px solid ${c}`,minWidth:110}}>
                <div style={{fontSize:20,marginBottom:2}}>{i}</div>
                <div style={{fontSize:24,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:3,fontWeight:600}}>{l}</div>
              </Card>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
            {[...guests,...tables.flatMap(t=>t.guests||[])].map(g=>{
              const tbl=tables.find(t=>(t.guests||[]).some(x=>x.id===g.id));
              return(
                <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));if(tbl)e.dataTransfer.setData("fromTable",String(tbl.id));}}
                  style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",cursor:"grab",display:"flex",alignItems:"center",gap:10}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.blueL}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{ini(g.name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{g.name}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
                      {g.relation&&<span style={{fontSize:12,background:C.blueXL,color:"#3A3050",borderRadius:100,padding:"1px 7px"}}>{g.relation}</span>}
                      {tbl&&<span style={{fontSize:12,background:"#E9F7EF",color:"#1F7A4D",borderRadius:100,padding:"1px 7px"}}>🪑 שולחן {numOf(tbl)} · {tbl.name}</span>}
                      <RsvpBadge rsvp={g.rsvp}/>
                    </div>
                  </div>
                  <button onClick={()=>setEditGuestData(g)} style={{background:C.blueXL,border:`1px solid ${C.border}`,color:C.blue,borderRadius:7,padding:"4px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,flexShrink:0}}>✏️</button>
                </div>
              );
            })}
          </div>
        </div>}
      </main>
    </div>}

    {/* GuestModal לדסקטופ */}
    {editGuestData&&<GuestModal guest={editGuestData} eventId={event.id} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onUpdateExisting={async(g,c)=>{await editGuest(g.id,{name:g.name,phone:g.phone,rsvp:g.rsvp,guest_count:c});setModal(null);setEditGuestData(null);}} onClose={()=>setEditGuestData(null)} onSave={async(data)=>{await editGuest(editGuestData.id,data);setEditGuestData(null);}}/>}

    {/* EditTableModal לדסקטופ  -  נפתח מכפתור עריכה במפה */}
    {editTableData&&<EditTableModal table={{...editTableData,num:numOf(editTableData)}} onClose={()=>setEditTableData(null)}
      onSave={async(id,name,type,seats,num)=>{await editTable(id,name,type,seats,num);setEditTableData(null);}}
      onDelete={async(id)=>{await deleteTable(id);setEditTableData(null);setSelected(null);}}
    />}

    {/* שאר המסכים בדסקטופ */}
    {screen!=="home"&&screen!=="seating"&&(
      <div style={{flex:1,overflowY:"auto",width:"100%",padding:"24px 24px",boxSizing:"border-box"}}>
        {screen==="packages"&&<PackagesScreen event={event} userPackages={userPackages} recordCount={guests.length+tables.reduce((n,t)=>n+(t.guests||[]).length,0)} onBack={()=>setScreen("home")}/>}
        {screen==="sms"&&<SMSScreen event={event} userPackages={userPackages} tables={tables} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
        {screen==="whatsapp"&&<WhatsAppScreen event={event} userPackages={userPackages} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
        {screen==="budget"&&<BudgetScreen event={event}/>}
        {screen==="checkin"&&!producerOnly("checkin")&&<CheckinScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]} tables={tablesNum} onReload={()=>loadAll(true)}/>}
        {screen==="gifts"&&<GiftsScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]} onReload={()=>loadAll(true)}/>}
        {screen==="tasks"&&<TasksScreen event={event}/>}
        {screen==="vendors"&&<VendorsScreen user={user} event={event} mobile={mobile}/>}
        {screen==="invite"&&<InviteSettings event={event} onUpdate={()=>setScreen("home")}/>}
        {screen==="add"&&<div style={{direction:"rtl"}}><button onClick={()=>setModal("addGuest")} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>➕ הוסף אורח חדש</button>{guests.slice(-10).reverse().map(g=>(<Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:8}}><div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800}}>{ini(g.name)}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{g.name}</div>{g.phone&&<div style={{fontSize:12,color:C.muted}}>{g.phone}</div>}</div><RsvpBadge rsvp={g.rsvp}/></Card>))}</div>}
        {screen==="settings"&&<EventDetailsScreen event={event} sb={sb} user={user} onLogout={logout} onUpdate={updateEvent}/>}
        {screen==="user_settings"&&<MobileSettingsScreen user={user} event={event} sb={sb} setGuests={setGuests} setScreen={setScreen}/>}
        {screen==="rsvp"&&<DesktopRsvpTable guests={guests} tables={tables} event={event} sb={sb} loadAll={loadAll} setGuests={setGuests} setTables={setTables} onAddGuest={()=>setModal("addGuest")} onImport={()=>setScreen("import")}/>}
        {screen==="import"&&<div style={{direction:"rtl"}}>
          {/* ייבוא אורחים נפתח מתוך אישורי הגעה */}
          <button onClick={()=>setScreen("rsvp")} className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.blue,borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>→ חזרה לניהול אורחים</button>
          {/* ייבוא מ-Excel */}
          <div style={{background:C.blueXL,border:`2px dashed ${C.blueL}`,borderRadius:16,padding:24,textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:36,marginBottom:8}}>📊</div>
            <div style={{fontSize:16,fontWeight:800,color:C.blue,marginBottom:4}}>ייבוא מ-Excel</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>המערכת מזהה לבד שם, טלפון, כמות מוזמנים ואישור הגעה. אם משהו לא ברור, נבקש מכם לסמן איזו עמודה היא מה</div>
            <label style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",borderRadius:12,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-block"}}>
              📂 בחר קובץ Excel
              <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];e.target.value="";if(f)importSheetFile(f);}}/>
            </label>
          </div>
          <GoogleContactsImport onFile={importSheetFile}/>
          {importMapModal}
          {/* ייבוא ידני */}
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:8}}>או הדבק שמות ידנית</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:10}}>שם וטלפון בכל שורה  -  אפשר להפריד ברווח, פסיק או להדביק ישר מאקסל</div>
          <textarea id="importTextDesktop" placeholder={"ישראל ישראלי, 050-1234567\nרונית לוי\nמשפחת כהן, 052-9876543\n..."} style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:14,fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",minHeight:180,boxSizing:"border-box",resize:"vertical",marginBottom:14}}/>
          <button onClick={async()=>{
            const text=document.getElementById("importTextDesktop").value;
            const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
            const res=prepareImport(lines.map(parseGuestLine),[...guests,...tables.flatMap(t=>t.guests||[])],event.id);const toInsert=res.toInsert;if(res.dupes.length||toInsert.length)alert(importSummary(res));
            if(toInsert.length>0){setSaving(true);await sb.from("guests").insert(toInsert);await loadAll();setSaving(false);setScreen("home");}
          }} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            ייבא וסיים ←
          </button>
        </div>}
      </div>
    )}

    {modal==="addGuest"&&<GuestModal eventId={event.id} onClose={()=>setModal(null)} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onUpdateExisting={async(g,c)=>{await editGuest(g.id,{name:g.name,phone:g.phone,rsvp:g.rsvp,guest_count:c});setModal(null);setEditGuestData(null);}} onSave={async(data)=>{await addGuest(data);setModal(null);}} desktop={true}/>}
    {modal==="receipt"&&<ReceiptModal tables={tablesNum} onClose={()=>setModal(null)}/>}
    {modal==="addTable"&&<AddTableModal onConfirm={doAddTable} onClose={()=>setModal(null)}/>}
    {autoSeatModal}{templatesModal}
    {/* WhatsApp צף (רק כשיש מספר) */}
    {SUPPORT_WA&&<a href={contactUrl()} target="_blank" rel="noopener" aria-label="תמיכה בוואטסאפ"
      style={{position:"fixed",bottom:90,left:24,background:"#25D366",color:"#fff",borderRadius:"50%",width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,.5)",zIndex:200,textDecoration:"none"}}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>}
    <AccessibilityWidget/>
      </div>{/* end main content */}
    </div>{/* end flex row */}
  </div>);
}

// ─── BUDGET SCREEN ────────────────────────────────────────────────────────────
// ─── DESKTOP RSVP TABLE ───────────────────────────────────────────────────────
// ─── שיתוף האירוע: בעל האירוע מוסיף מיילים (בן/בת זוג, הורים) שיכולים לנהל אותו מהחשבון שלהם ───
export function ShareEventCard({ event, user }) {
  const owner=!event.user_id||event.user_id===user?.id;
  const [list,setList]=useState(null),[email,setEmail]=useState(""),[busy,setBusy]=useState(false),[role,setRole]=useState("editor");
  const load=async()=>{const{data,error}=await sb.from("event_members").select("email,role,created_at").eq("event_id",event.id).order("created_at");setList(error?[]:data||[]);};
  const setMemberRole=async(e,r)=>{const{error}=await sb.from("event_members").update({role:r}).eq("event_id",event.id).eq("email",e);if(error)alert("❌ "+error.message);else load();};
  useEffect(()=>{if(owner)load();},[event.id]);
  if(!owner)return(
    <div style={{background:"#EEF7FF",border:"1.5px solid #BEE3F8",borderRadius:14,padding:"12px 16px",marginBottom:16,fontSize:13,color:"#2B6CB0",fontWeight:700}}>🤝 האירוע הזה שותף איתך. אפשר לערוך הכול חוץ ממחיקת האירוע.</div>
  );
  const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const add=async()=>{
    const e=email.trim().toLowerCase();
    if(!valid||e===String(user.email||"").toLowerCase())return;
    setBusy(true);
    const{error}=await sb.from("event_members").insert({event_id:event.id,email:e,role});
    setBusy(false);
    if(error&&!/duplicate/i.test(error.message)){alert("❌ השיתוף נכשל: "+error.message);return;}
    setEmail("");load();
  };
  const remove=async e=>{
    if(!confirm(`להסיר את הגישה של ${e}?`))return;
    const{error}=await sb.from("event_members").delete().eq("event_id",event.id).eq("email",e);
    if(error)alert("❌ ההסרה נכשלה: "+error.message);else load();
  };
  return(
    <div style={{background:"#fff",borderRadius:14,padding:"20px 24px",marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
      <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4}}>🤝 שיתוף האירוע</div>
      <div style={{fontSize:12,color:"#5F6B7D",marginBottom:12}}>הוסיפו את המייל של בן/בת הזוג או ההורים. אחרי שיתחברו עם המייל הזה, האירוע יופיע אצלם ויוכלו לנהל אותו יחד איתכם.<br/><b>גישה מוגבלת</b>: מנהלים אורחים, אישורי הגעה והושבה, אבל בלי למחוק אורחים ושולחנות ובלי הודעות וחבילות. מתאים למפיק שמשתף את הזוג.</div>
      {(list||[]).map(m=>(
        <div key={m.email} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",marginBottom:6,borderRadius:10,background:"#F7FAFC",fontSize:13,flexWrap:"wrap"}}>
          <span style={{flex:1,direction:"ltr",textAlign:"right",minWidth:140}}>{m.email}</span>
          <select value={m.role||"editor"} onChange={e=>setMemberRole(m.email,e.target.value)} aria-label={`הרשאה של ${m.email}`} style={{border:"1px solid #E2E8F0",borderRadius:8,padding:"4px 6px",fontSize:12,fontFamily:"inherit",background:"#fff"}}>
            <option value="editor">שותף מלא</option><option value="couple">גישה מוגבלת</option>
          </select>
          <button onClick={()=>remove(m.email)} aria-label={`הסרת ${m.email}`} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#A0AEC0",fontFamily:"inherit"}}>✕ הסר</button>
        </div>
      ))}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add();}} type="email" dir="ltr" placeholder="name@gmail.com"
          style={{flex:"1 1 200px",minWidth:0,border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        <select value={role} onChange={e=>setRole(e.target.value)} aria-label="הרשאה" style={{border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px",fontSize:13,fontFamily:"inherit",background:"#fff"}}>
          <option value="editor">שותף מלא</option><option value="couple">גישה מוגבלת (לזוג)</option>
        </select>
        <button onClick={add} disabled={!valid||busy}
          style={{background:valid?"#2B6CB0":"#E2E8F0",color:valid?"#fff":"#aaa",border:"none",borderRadius:10,padding:"10px 18px",fontSize:14,fontWeight:700,cursor:valid?"pointer":"default",fontFamily:"inherit"}}>{busy?"...":"שתף"}</button>
      </div>
    </div>
  );
}

// ─── EVENT DETAILS SCREEN ─────────────────────────────────────────────────────
export function EventDetailsScreen({ event, sb, user, onLogout, onUpdate }) {
  const [form,setForm]=useState({
    name:event.name||"",
    groom_name:event.groom_name||"",
    bride_name:event.bride_name||"",
    groom_father:event.groom_father||"",
    bride_father:event.bride_father||"",
    date:event.date||"",
    event_time:event.event_time||"",
    reception_time:event.reception_time||"",
    venue:event.venue||"",
    venue_address:event.venue_address||"",
    venue_map:event.venue_map||"",
    venue_phone:event.venue_phone||"",
    host_phone:event.host_phone||"",
    welcome_text:event.welcome_text||"",
    personal_text:event.personal_text||"",
    name_display:event.name_display||"full",
    invite_image:event.invite_image||"",
    template_id:event.template_id||"classic",
    bit_link:event.bit_link||"",
    paybox_link:event.paybox_link||"",
  });
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [myRole,setMyRole]=useState(event.my_role||"groom");
  // קישור ההזמנה לאורחים (נוצר קוד אם עוד אין)
  const [inviteCode,setInviteCode]=useState(event.invite_code||"");
  const [linkCopied,setLinkCopied]=useState(false);
  useEffect(()=>{if(!event.invite_code){const code=Math.random().toString(36).slice(2,10);sb.from("events").update({invite_code:code}).eq("id",event.id).then(({error})=>{if(!error){event.invite_code=code;setInviteCode(code);}});}},[event.id]);
  const inviteUrl=inviteCode?`${window.location.origin}/#/invite/${inviteCode}`:"";
  const copyInvite=()=>{if(!inviteUrl)return;navigator.clipboard.writeText(inviteUrl).then(()=>{setLinkCopied(true);setTimeout(()=>setLinkCopied(false),2000);},()=>{});};
  const [settings,setSettings]=useState({
    coupleType: coupleOf(event),
    childGender: childOf(event)||"m",
    confetti: event.settings_json?.confetti??true,
    popupRsvp: event.settings_json?.popupRsvp??false,
    autoRsvp: event.settings_json?.autoRsvp??true,
    tableNum: event.settings_json?.tableNum??true,
    hebrewDate: event.settings_json?.hebrewDate??true,
    countdown: event.settings_json?.countdown??true,
    shareBtn: event.settings_json?.shareBtn??true,
    inviteStyle: inviteStyleOf(event),
    rsvpQ: rsvpQOf(event),
  });
  const setQ=patch=>setSettings(s=>({...s,rsvpQ:{...s.rsvpQ,...patch}}));
  const kind=eventKind({...event,event_type:event.event_type,couple_type:settings.coupleType,child_gender:settings.childGender});

  // שמירה אוטומטית: כל שינוי נשמר כשנייה אחרי שמפסיקים להקליד, וגם ביציאה מהמסך.
  // השמירות רצות אחת אחרי השנייה ותמיד עם הנתונים העדכניים (latestRef)
  const [saveErr,setSaveErr]=useState("");
  const latestRef=useRef(null),dirtyRef=useRef(false),chainRef=useRef(Promise.resolve()),timerRef=useRef(null);
  latestRef.current={form,myRole,settings};
  const save=()=>{
    clearTimeout(timerRef.current);
    dirtyRef.current=false;
    chainRef.current=chainRef.current.then(async()=>{
      const{form,myRole,settings}=latestRef.current;
      setSaving(true);
      // ממזגים עם settings_json הקיים: שם שמורים גם האולם, התזמונים ומספרי השולחנות
      const data=eventRow({...form,my_role:myRole,settings_json:{...(event.settings_json||{}),...settings}});
      const{error}=await sb.from("events").update(data).eq("id",event.id);
      setSaving(false);
      if(error){dirtyRef.current=true;setSaveErr(error.message);setSaved(false);return;}
      Object.assign(event,data);
      setSaveErr("");setSaved(true);
    });
    return chainRef.current;
  };
  const firstRef=useRef(true);
  useEffect(()=>{
    if(firstRef.current){firstRef.current=false;return;}
    dirtyRef.current=true;setSaved(false);
    clearTimeout(timerRef.current);
    timerRef.current=setTimeout(save,900);
  },[form,myRole,settings]);
  // יציאה מהמסך / סגירת הדף לפני שהשמירה רצה — שומרים מיד
  useEffect(()=>{
    const flush=()=>{if(dirtyRef.current)save();};
    window.addEventListener("pagehide",flush);
    return()=>{window.removeEventListener("pagehide",flush);flush();};
  },[]);

  const hebrewDate=d=>hebrewDateStr(d,true);

  const Field=({label,value,onChange,placeholder,type="text",maxLen,hint})=>(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700}}>{label}{hint&&<span style={{color:"#6E6585",fontWeight:400}}>  -  {hint}</span>}</div>
        {maxLen&&<div style={{fontSize:12,color:"#6E6585"}}>{(value||"").length}/{maxLen}</div>}
      </div>
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen}
        style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",color:"#1A202C"}}/>
    </div>
  );

  return(
    <div className="hm ed" style={{direction:"rtl",padding:"24px 24px 40px",width:"100%",maxWidth:1100,margin:"0 auto",boxSizing:"border-box"}}>
      <style>{HOME_CSS+ED_CSS}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:22,flexWrap:"wrap"}}>
        <div>
          <h1 style={{fontSize:"clamp(26px,2.6vw,34px)",fontWeight:700,color:"#2B1D3F",margin:"0 0 4px"}}>פרטי האירוע</h1>
          <div style={{fontSize:15,color:"#5E5470"}}>כל שינוי נשמר אוטומטית ומופיע מיד בהזמנה ובהודעות</div>
        </div>
        {/* מצב השמירה */}
        <div role="status" aria-live="polite" style={{flexShrink:0}}>
          {saveErr
            ?<button onClick={save} title={saveErr} style={{background:"#FFF5F5",color:"#C53030",border:"1.5px solid #FEB2B2",borderRadius:100,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>⚠️ לא נשמר · נסו שוב</button>
            :<span style={{display:"inline-block",background:saving?"#EBF8FF":saved?"#F0FFF4":"#F7FAFC",color:saving?"#2B6CB0":saved?"#276749":"#5F6B7D",border:"none",borderRadius:100,padding:"9px 16px",fontSize:14,fontWeight:700,fontFamily:"'Fredoka','Heebo',sans-serif"}}>
              {saving?"⏳ שומר...":saved?"✓ נשמר":"💾 שמירה אוטומטית"}
            </span>}
        </div>
      </div>

      {/* סגנון ההזמנה הדיגיטלית */}
      <div className="ed-card" style={{"--t":"#FFE6F0",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4}}>💌 הזמנה דיגיטלית</div>
        <div style={{fontSize:13,color:"#5E5470",margin:"0 0 14px"}}>הקישור שהאורחים מקבלים, הסגנון ותמונת הפתיחה. הכל נשמר אוטומטית.</div>
        <div className="ed-inv">
          <div className="ed-inv-url" dir="ltr">{inviteUrl||"טוען..."}</div>
          <div className="ed-inv-btns">
            <button type="button" onClick={copyInvite} className={linkCopied?"ok":undefined}>{linkCopied?"✓ הועתק":"📋 העתקת הקישור"}</button>
            <button type="button" onClick={()=>inviteUrl&&shareInviteWA(event,inviteUrl)} className="wa">💬 WhatsApp</button>
            <button type="button" onClick={()=>inviteUrl&&window.open(inviteUrl,"_blank","noopener")}>👁️ צפייה בהזמנה</button>
          </div>
        </div>
        <div style={{fontFamily:"'Fredoka','Heebo',sans-serif",fontSize:16,fontWeight:700,color:"#2B1D3F",margin:"20px 0 10px"}}>🎨 סגנון ההזמנה</div>
        <InviteStylePicker value={settings.inviteStyle} onChange={id=>setSettings(s=>({...s,inviteStyle:id}))} img={coverImgOf(event.event_type,form.template_id)} title={form.bride_name&&form.groom_name?`${form.groom_name} & ${form.bride_name}`:form.name}/>
        <div style={{fontFamily:"'Fredoka','Heebo',sans-serif",fontSize:16,fontWeight:700,color:"#2B1D3F",margin:"20px 0 10px"}}>🖼️ תמונת הפתיחה</div>
        <InviteCoverPicker eventType={event.event_type} value={form.template_id} onChange={id=>setForm(f=>({...f,template_id:id}))}/>
      </div>

      <div className="ed-share"><ShareEventCard event={event} user={user}/></div>

      {/* מי אני + שמות */}
      <div className="ed-card" style={{"--t":"#EFE6FF",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:16,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>{kind.people}</div>

        {/* מי אני  -  רק בחתונה */}
        {(event.event_type==="bar_mitzvah"||event.event_type==="brit")&&<div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>בן או בת:</div>
          <div role="radiogroup" aria-label="בן או בת" style={{display:"flex",gap:8}}>
            {[["m",event.event_type==="brit"?"👦 ברית לבן":"👦 בר מצווה"],["f",event.event_type==="brit"?"👧 שמחת בת":"👧 בת מצווה"]].map(([v,l])=>{const on=settings.childGender===v;return(
              <button key={v} type="button" role="radio" aria-checked={on} onClick={()=>setSettings(s=>({...s,childGender:v}))}
                style={{flex:1,background:on?"#FFE6F0":"#fff",color:"#2B1D3F",border:`2px solid ${on?"#F0609E":"#EFE8F7"}`,borderRadius:100,padding:"10px 14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka','Heebo',sans-serif"}}>{on?"✓ ":""}{l}</button>);})}
          </div>
        </div>}
        {(event.event_type||"wedding")==="wedding"&&<div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>בני הזוג:</div>
          <CouplePicker value={settings.coupleType} onChange={v=>setSettings(s=>({...s,coupleType:v}))}/>
        </div>}
        {kind.roles&&<div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>מי אני: *</div>
          <div style={{display:"flex",gap:8}}>
            {kind.roles.map(([v,l])=>(
              <button key={v} onClick={()=>setMyRole(v)}
                aria-pressed={myRole===v} style={{flex:1,padding:"11px",borderRadius:100,border:"none",boxShadow:myRole===v?"0 10px 22px -12px rgba(240,96,158,.7)":"inset 0 0 0 1.5px #E6DDF5",
                  background:myRole===v?"linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)":"#fff",color:myRole===v?"#fff":"#4A4060",
                  cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>
                {l}
              </button>
            ))}
          </div>
        </div>}

        <div style={{display:"grid",gridTemplateColumns:kind.b?"1fr 1fr":"1fr",gap:16}}>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>{kind.a}: {kind.b&&"* "}<span style={{color:"#6E6585",fontWeight:400}}>({(form.groom_name||"").length}/25)</span></div>
            <input aria-label={kind.a} value={form.groom_name} onChange={e=>setForm(f=>({...f,groom_name:e.target.value}))} placeholder={kind.b?"":"השם שיופיע בהזמנה ובהודעות"} maxLength={25}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          {kind.b&&<div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>{kind.b}: * <span style={{color:"#6E6585",fontWeight:400}}>({(form.bride_name||"").length}/25)</span></div>
            <input aria-label={kind.b} value={form.bride_name} onChange={e=>setForm(f=>({...f,bride_name:e.target.value}))} maxLength={25}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>}
        </div>

        {/* הורים / מארחים */}
        <div style={{display:"grid",gridTemplateColumns:kind.pb?"1fr 1fr":"1fr",gap:16,marginTop:16}}>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>{kind.pa}: <span style={{color:"#6E6585",fontWeight:400}}>({(form.groom_father||"").length}/75)</span></div>
            <input aria-label={kind.pa} value={form.groom_father} onChange={e=>setForm(f=>({...f,groom_father:e.target.value}))} placeholder={kind.pa} maxLength={75}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          {kind.pb&&<div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>{kind.pb}: <span style={{color:"#6E6585",fontWeight:400}}>({(form.bride_father||"").length}/75)</span></div>
            <input aria-label={kind.pb} value={form.bride_father} onChange={e=>setForm(f=>({...f,bride_father:e.target.value}))} placeholder={kind.pb} maxLength={75}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>}
        </div>

        {/* נייד של בעל השמחה — ליצירת קשר (מוצג גם בהגדרות ובאדמין) */}
        <div style={{marginTop:16}}>
          <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>📱 מספר נייד של בעל/ת השמחה <span style={{color:"#6E6585",fontWeight:400}}>(ליצירת קשר בנוגע לאירוע)</span></div>
          <input aria-label="מספר נייד של בעל/ת השמחה" value={form.host_phone} onChange={e=>setForm(f=>({...f,host_phone:e.target.value}))} placeholder="050-0000000" type="tel" dir="ltr" inputMode="tel" maxLength={20}
            style={{width:"100%",maxWidth:260,border:`1.5px solid ${form.host_phone&&!normPhone(form.host_phone)?"#FC8181":"#E2E8F0"}`,borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",textAlign:"right"}}/>
          {form.host_phone&&!normPhone(form.host_phone)&&<div style={{fontSize:12,color:"#C53030",marginTop:4}}>מספר נייד לא תקין</div>}
        </div>
        {!kind.b&&<div style={{fontSize:12,color:"#5F6B7D",marginTop:10}}>{kind.emoji} ההודעות ייכתבו כך: "מוזמנים ל{eventWords({...event,...form}).name}"</div>}
      </div>

      {/* תאריך ושעה */}
      <div className="ed-card" style={{"--t":"#FFE3EE",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:16,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>📅 תאריך האירוע</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>תאריך האירוע</div>
            <DateField value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
            {form.date&&hebrewDate(form.date)&&<div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,background:"#F6F0FF",border:"1px solid #E6DDF5",borderRadius:100,padding:"4px 12px",fontSize:13,color:"#3A2464",fontWeight:800}}>✡️ <span dir="rtl">{hebrewDate(form.date)}</span></div>}
          </div>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>שעת קבלת פנים</div>
            <input aria-label="שעת קבלת פנים" type="time" value={form.reception_time} onChange={e=>setForm(f=>({...f,reception_time:e.target.value}))}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>שעת תחילת הטקס</div>
            <input aria-label="שעת תחילת הטקס" type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      {/* מקום */}
      <div className="ed-card" style={{"--t":"#FFE9DC",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:16,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>📍 מקום האירוע</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:12}}>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>שם מקום האירוע: * <span style={{color:"#6E6585",fontWeight:400}}>({(form.venue||"").length}/55)</span></div>
            <VenueInput value={form.venue} onChange={v=>setForm(f=>({...f,venue:v}))} onPick={v=>setForm(f=>({...f,venue:v.name.slice(0,55),venue_address:v.address||f.venue_address}))} placeholder="אלכסנדר" maxLength={55}
              inputStyle={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>כתובת האירוע: *</div>
            <input aria-label="כתובת האירוע" value={form.venue_address} onChange={e=>setForm(f=>({...f,venue_address:e.target.value}))} placeholder="א.ת. עמק חפר, המסיק 2"
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>מיקום האירוע על גבי מפה:</div>
            <input aria-label="קישור למיקום במפה" value={form.venue_map} onChange={e=>setForm(f=>({...f,venue_map:e.target.value}))} placeholder="קישור Waze / Google Maps"
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>מספר טלפון של מקום האירוע:</div>
            <input aria-label="טלפון מקום האירוע" value={form.venue_phone} onChange={e=>setForm(f=>({...f,venue_phone:e.target.value}))} placeholder="098332266" type="tel"
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      {/* נוסח הזמנה */}
      <div className="ed-card" style={{"--t":"#DFF6EC",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>💌 נוסח להזמנה הדיגיטלית</div>
        <div style={{fontSize:12,color:"#5F6B7D",marginBottom:12}}>טקסט זה יחליף את הטקסט ברירת המחדל שיופיע בגוף ההזמנה הדיגיטלית. הטקסט יוצג בתבניות "דיגיטלי" ו"פורטרט" בלבד.</div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
          <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700}}>נוסח ההזמנה</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {form.welcome_text?.trim()&&<button onClick={()=>setForm(f=>({...f,welcome_text:""}))}
              style={{fontSize:12,color:"#C53030",background:"#FFF5F5",border:"1px solid #FC8181",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>
              איפוס לברירת מחדל
            </button>}
            <div style={{fontSize:12,color:"#6E6585"}}>{(form.welcome_text||"").length}/800</div>
          </div>
        </div>
        <textarea aria-label="נוסח ההזמנה" value={form.welcome_text} onChange={e=>setForm(f=>({...f,welcome_text:e.target.value}))} maxLength={800}
          placeholder={"אנו שמחים להזמינכם לחגוג איתנו..."}
          style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:80,resize:"vertical",marginBottom:14}}/>

        <div style={{fontSize:12,color:"#5F6B7D",marginBottom:8}}>כדי להדגיש את הכתב בנוסח, הוסיפו 2 כוכביות משני צדי הטקסט ללא רווח, לדוגמה: **טקסט**</div>

        <div style={{marginTop:12}}>
          <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>תצוגת שם אורחת בהזמנה אישית</div>
          <div style={{fontSize:12,color:"#5F6B7D",marginBottom:8}}>בחרו האם להציג את שמות האורחים בהזמנה האישית בקישור שהם מקבלים:</div>
          <select aria-label="תצוגת שם האורח בהזמנה" value={form.name_display} onChange={e=>setForm(f=>({...f,name_display:e.target.value}))}
            style={{border:"1.5px solid #E2E8F0",borderRadius:10,padding:"9px 14px",fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff",color:"#1A202C",width:"fit-content"}}>
            <option value="full">שם מלא (פרטי + משפחה)</option>
            <option value="first">שם פרטי בלבד</option>
            <option value="none">ללא שם</option>
          </select>
        </div>
      </div>

      {/* העלאת תמונת הזמנה */}
      <div className="ed-card" style={{"--t":"#E2F1FF",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>🖼️ תמונת הזמנה</div>
        <div style={{fontSize:12,color:"#5F6B7D",marginBottom:14}}>העלו תמונת הזמנה שתופיע בהזמנה הדיגיטלית ובמסך הבית של האירוע. כל תמונה מוקטנת אוטומטית לגודל המתאים, כך שאפשר להעלות גם תמונה ישירות מהטלפון.</div>

        {/* תצוגה מקדימה */}
        {form.invite_image&&(
          <div style={{marginBottom:12,position:"relative",display:"inline-block"}}>
            <img src={form.invite_image} alt="הזמנה" style={{maxWidth:"100%",maxHeight:200,borderRadius:10,objectFit:"contain",border:"1px solid #E2E8F0"}}
              onError={e=>{e.target.style.display="none";}}/>
            <button onClick={()=>setForm(f=>({...f,invite_image:""}))}
              style={{position:"absolute",top:-8,right:-8,width:24,height:24,borderRadius:"50%",background:"#E53E3E",color:"#fff",border:"none",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>×</button>
          </div>
        )}

        {/* העלאה */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <label style={{display:"flex",alignItems:"center",gap:8,padding:"11px 18px",background:"#F6F0FF",border:"none",borderRadius:100,cursor:"pointer",fontSize:14,fontWeight:700,color:"#4A2C8F"}}>
            📁 העלה מהמחשב
            <input type="file" accept="image/*" style={{position:"absolute",width:1,height:1,opacity:0,overflow:"hidden"}} onChange={async e=>{
              const file=e.target.files[0];e.target.value="";
              if(!file)return;
              try{const url=await uploadInviteImage(event.id,file);setForm(f=>({...f,invite_image:url}));}
              catch(err){alert("שגיאה בהעלאה: "+(err.message||""));}
            }}/>
          </label>
          <div style={{display:"flex",flex:1,gap:8}}>
            <input aria-label="קישור לתמונת ההזמנה" value={form.invite_image} onChange={e=>setForm(f=>({...f,invite_image:e.target.value}))}
              placeholder="או הכנס קישור לתמונה (URL)..."
              style={{flex:1,border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          </div>
        </div>
      </div>

      {/* קישורי תשלום  -  Bit / Paybox */}
      <div className="ed-card" style={{"--t":"#FFF1D6",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>💝 קישורי מתנה דיגיטלית</div>
        <div style={{fontSize:12,color:"#5F6B7D",marginBottom:16}}>הוסף קישור לBit או Paybox  -  יופיע כפתור "תן מתנה" בהזמנה הדיגיטלית, וגם שורת "💝 למתנה" בהודעות (הזמנה ומספר שולחן ב-SMS ובוואטסאפ).</div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Bit */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#1DB954",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💚</div>
              <div style={{fontSize:13,fontWeight:700,color:"#1A202C"}}>Bit</div>
            </div>
            <input aria-label="קישור או טלפון ל-Bit" value={form.bit_link} onChange={e=>setForm(f=>({...f,bit_link:e.target.value}))}
              placeholder="https://bit.ly/... או מספר הטלפון"
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>

          {/* Paybox */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#6B46C1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💜</div>
              <div style={{fontSize:13,fontWeight:700,color:"#1A202C"}}>Paybox</div>
            </div>
            <input aria-label="קישור ל-PayBox" value={form.paybox_link} onChange={e=>setForm(f=>({...f,paybox_link:e.target.value}))}
              placeholder="https://payboxapp.com/..."
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>

        {(form.bit_link||form.paybox_link)&&(
          <div style={{marginTop:14,background:"#F0FFF4",border:"1px solid #9AE6B4",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#276749"}}>
            ✅ כפתור "תן מתנה" יופיע בהזמנה הדיגיטלית, ובהודעות תתווסף השורה: <b>{giftLine(form)}</b>
          </div>
        )}
      </div>

      {/* שאלות נוספות באישור ההגעה */}
      <div className="ed-card" style={{"--t":"#F1EAFF",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>🍽️ שאלות נוספות באישור ההגעה</div>
        <div style={{fontSize:12,color:"#5F6B7D",margin:"8px 0 12px"}}>אורח שמאשר הגעה יענה גם על השאלות שתסמנו. התשובות מסוכמות במסך אישורי ההגעה, עם דוח מוכן לקייטרינג ולאולם.</div>
        {[
          {key:"meal",label:"סוג מנה",desc:"כמה מנות מכל סוג (לפי מספר המגיעים)"},
          {key:"kids",label:"כמה ילדים",desc:"מתוך המגיעים"},
          {key:"allergies",label:"אלרגיות והערות",desc:"טקסט חופשי לקייטרינג"},
          {key:"transport",label:"צריכים הסעה",desc:"כן / לא"},
        ].map(item=>(
          <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #F7FAFC"}}>
            <div><div style={{fontSize:14,fontWeight:700,color:"#1A202C"}}>{item.label}</div><div style={{fontSize:12,color:"#5F6B7D",marginTop:2}}>{item.desc}</div></div>
            <div role="switch" aria-checked={!!settings.rsvpQ[item.key]} aria-label={item.label} tabIndex={0} onClick={()=>setQ({[item.key]:!settings.rsvpQ[item.key]})} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setQ({[item.key]:!settings.rsvpQ[item.key]});}}}
              style={{width:44,height:24,borderRadius:12,background:settings.rsvpQ[item.key]?"#F0609E":"#CFC6DC",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0,marginRight:8}}>
              <div style={{position:"absolute",top:2,right:settings.rsvpQ[item.key]?2:18,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"right .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
        ))}
        {settings.rsvpQ.meal&&(
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>סוגי המנות (מופרדים בפסיק)</div>
            <input defaultValue={(settings.rsvpQ.mealOptions||DEFAULT_MEALS).join(", ")} aria-label="סוגי המנות"
              onBlur={e=>{const opts=e.target.value.split(/[,،]/).map(x=>x.trim()).filter(Boolean).slice(0,8);setQ({mealOptions:opts.length?opts:DEFAULT_MEALS});}}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        )}
      </div>

      {/* הגדרות נוספות */}
      <div className="ed-card" style={{"--t":"#E3F8EF",background:"#fff",borderRadius:28,padding:"24px",marginBottom:18,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:16,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>⚙️ הגדרות נוספות</div>
        {[
          {key:"confetti",label:"אפקט קונפטי",desc:"מציג אפקט קונפטי מעל תמונת הקאבר בהזמנה"},
          {key:"popupRsvp",label:"אישורי הגעה POPUP",desc:"מציג הודעה קופצת המכילה את האורח האחרון שאישר הגעה"},
          {key:"autoRsvp",label:"גלילה אוטומטית",desc:"בכניסה להזמנה העמוד ינגלל לאישור ההגעה באופן אוטומטי"},
          {key:"tableNum",label:"מספר שולחן בהזמנה",desc:"מציג את מספר השולחן בהזמנה לאורח שאישר הגעה"},
          {key:"hebrewDate",label:"תאריך עברי",desc:"מציג תאריך עברי בהזמנה לפי התאריך הלועזי"},
          {key:"countdown",label:"ספירה לאחור",desc:"מציג מונה ספירת ימים ושעות לקראת האירוע"},
          {key:"shareBtn",label:"כפתור שיתוף",desc:"מציג כפתור עם אפשרויות לשיתוף ההזמנה"},
        ].map(item=>(
          <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #F7FAFC"}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#1A202C"}}>{item.label}</div>
              <div style={{fontSize:12,color:"#5F6B7D",marginTop:2}}>{item.desc}</div>
            </div>
            <div role="switch" aria-checked={!!settings[item.key]} aria-label={item.label} tabIndex={0} onClick={()=>setSettings(s=>({...s,[item.key]:!s[item.key]}))}
              onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSettings(s=>({...s,[item.key]:!s[item.key]}));}}}
              style={{width:44,height:24,borderRadius:12,background:settings[item.key]?"#F0609E":"#CFC6DC",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0,marginRight:8}}>
              <div style={{position:"absolute",top:2,right:settings[item.key]?2:18,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"right .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* התנתקות */}
      <div style={{background:"#fff",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 8px rgba(0,0,0,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:"#5F6B7D"}}>מחובר כ: <strong>{user.email}</strong></div>
        <button onClick={onLogout}
          style={{background:"#FFF5F5",color:"#C53030",border:"1.5px solid #FEB2B2",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          🚪 התנתק
        </button>
      </div>
    </div>
  );
}
// עריכה מהירה בטבלה: לחיצה על התא פותחת שדה במקום; Enter / יציאה מהשדה שומרים, Esc מבטל
export function QuickCell({ value, children, type="text", options, onSave, style }) {
  const [edit,setEdit]=useState(false),[v,setV]=useState("");
  const start=()=>{setV(value??"");setEdit(true);};
  const done=async save=>{setEdit(false);if(save&&String(v??"")!==String(value??""))await onSave(v);};
  const inp={width:"100%",minWidth:60,border:"1.5px solid #9B6BFF",borderRadius:6,padding:"4px 6px",fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"};
  if(edit)return options
    ?<select autoFocus value={v} onChange={e=>{setV(e.target.value);}} onBlur={()=>done(true)} onKeyDown={e=>{if(e.key==="Escape")done(false);if(e.key==="Enter")e.target.blur();}} style={inp}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    :<input autoFocus type={type} value={v} onChange={e=>setV(e.target.value)} onBlur={()=>done(true)} onFocus={e=>e.target.select()}
        onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape")done(false);}} dir={type==="tel"?"ltr":undefined} style={inp}/>;
  return <div role="button" tabIndex={0} onClick={start} onKeyDown={e=>{if(e.key==="Enter")start();}} title="לחיצה לעריכה מהירה"
    style={{cursor:"text",borderRadius:6,padding:"2px 4px",margin:"-2px -4px",outline:"1px dashed transparent",transition:"outline-color .15s",...style}}
    onMouseEnter={e=>e.currentTarget.style.outlineColor="#C9B6F2"} onMouseLeave={e=>e.currentTarget.style.outlineColor="transparent"}>{children}</div>;
}

export function DesktopRsvpTable({ guests, tables, event, sb, loadAll, setGuests, setTables, onAddGuest, onImport }) {
  const allGuests=[...guests,...tables.flatMap(t=>t.guests||[])];
  const [search,setSearch]=useState("");
  const [editG,setEditG]=useState(null);
  const [saving,setSaving]=useState(false);
  const [filterRsvp,setFilterRsvp]=useState("all");
  const [phoneDup,setPhoneDup]=useState(null);
  const [dupCount,setDupCount]=useState(1);
  // עדכון מספר המוזמנים של האורח הקיים (במקום לשמור טלפון כפול)
  const updateDupCount=async()=>{
    setSaving(true);
    await sb.from("guests").update({guest_count:dupCount}).eq("id",phoneDup.id);
    const fix=x=>x.id===phoneDup.id?{...x,guest_count:dupCount}:x;
    setGuests(gs=>gs.map(fix));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(fix)})));
    setSaving(false);setPhoneDup(null);setEditG(null);
  };
  const RELATIONS=["משפחה קרובה","משפחה מורחבת","חברים קרובים","חברים רחוקים","חברים של ההורים","ללא שיוך"];

  const confirmed=allGuests.filter(g=>g.rsvp==="confirmed").reduce((s,g)=>s+(g.guest_count||1),0);
  const declined=allGuests.filter(g=>g.rsvp==="declined").reduce((s,g)=>s+(g.guest_count||1),0);
  const total=allGuests.reduce((s,g)=>s+(g.guest_count||1),0);

  // מסננים נוספים: קרבה, שיבוץ לשולחן, צפייה בהזמנה
  const [fRel,setFRel]=useState("all"),[fSeat,setFSeat]=useState("all"),[fView,setFView]=useState("all"),[fLang,setFLang]=useState("all");
  // שפת ההודעות לכל אורח (ברירת מחדל עברית) — נשמרת בעמודה guests.lang
  const langOfG=g=>guestLangOf(event,g);
  const setGuestLang=async(g,l)=>{
    const{error}=await sb.from("guests").update({lang:l}).eq("id",g.id);
    if(error){alert("❌ השפה לא נשמרה: "+error.message);return;}
    const fix=x=>x.id===g.id?{...x,lang:l}:x;
    setGuests(gs=>gs.map(fix));setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(fix)})));
  };
  const anyFilter=fRel!=="all"||fSeat!=="all"||fView!=="all"||fLang!=="all"||filterRsvp!=="all"||!!search;
  const filtered=allGuests
    .filter(g=>g.name.toLowerCase().includes(search.toLowerCase())||(g.phone&&g.phone.includes(search)))
    .filter(g=>filterRsvp==="all"||g.rsvp===filterRsvp||(filterRsvp==="pending"&&(!g.rsvp||g.rsvp==="pending")))
    .filter(g=>fRel==="all"||(g.relation||"ללא שיוך")===fRel)
    .filter(g=>fSeat==="all"||(fSeat==="seated"?!!g.table_id:!g.table_id))
    .filter(g=>fView==="all"||(fView==="viewed"?(g.views||0)>0:!(g.views>0)))
    .filter(g=>fLang==="all"||langOfG(g)===fLang);

  const updateRsvp=async(g,stage)=>{
    const patch=stagePatch(stage);
    const{error}=await sb.from("guests").update(patch).eq("id",g.id);
    if(error){alert("❌ לא נשמר: "+error.message);return;}
    setGuests(gs=>gs.map(x=>x.id===g.id?{...x,...patch}:x));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(x=>x.id===g.id?{...x,...patch}:x)})));
  };
  // עריכה מהירה של שדה אחד מתוך הטבלה
  const quickSave=async(g,field,raw)=>{
    let val=raw;
    if(field==="name"){val=String(raw).replace(/\s+/g," ").trim();if(val.length<2){alert("שם קצר מדי");return;}}
    if(field==="guest_count")val=Math.min(30,Math.max(1,parseInt(raw)||1));
    if(field==="gift"){const n=Number(String(raw).replace(/[^\d.]/g,""));val=n>0?n:null;}
    if(field==="phone"){val=String(raw).trim()?formatPhone(raw)||String(raw).trim():null;
      const dup=val&&findByPhone(allGuests,val,g.id);if(dup){alert(`המספר כבר שייך ל"${dup.name}"`);return;}}
    const{error}=await sb.from("guests").update({[field]:val}).eq("id",g.id);
    if(error){alert("❌ לא נשמר: "+error.message);return;}
    const fix=x=>x.id===g.id?{...x,[field]:val}:x;
    setGuests(gs=>gs.map(fix));setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(fix)})));
  };

  // הוספת מוזמנת: אותו חלון בדיוק כמו עריכה (שם פרטי/משפחה, נייד, כמות, קרבה, מצב הגעה, מתנה, הערה)
  const openAdd=()=>setEditG({_new:true,name:"",phone:"",guest_count:1,relation:"ללא שיוך",rsvp:"pending",gift:0,note:""});
  const saveEdit=async()=>{
    if(!editG)return;
    if(editG._new&&!String(editG.name||"").trim()){alert("נא למלא שם");return;}
    // טלפון שנכתב בתוך השם  -  מעבירים לשדה הטלפון
    {const sp=splitNamePhone(editG.name,editG.phone);if(sp.name!==String(editG.name||"").trim()){editG.name=sp.name;editG.phone=sp.phone;setEditG({...editG});}}
    // טלפון שכבר שייך לאורח אחר  -  לא שומרים כפול, רק מציעים לעדכן את מספר המוזמנים שלו
    const byPhone=findByPhone(allGuests,editG.phone,editG.id);
    if(byPhone){setPhoneDup(byPhone);setDupCount(Math.max(byPhone.guest_count||1,Number(editG.guest_count)||1));return;}
    const nameClean=editG.name.trim().toLowerCase();
    const dup=allGuests.find(g=>g.id!==editG.id&&g.name.trim().toLowerCase()===nameClean);
    if(dup){
      const ok=window.confirm(`קיים אורח דומה: "${dup.name}" (${dup.phone||"ללא טלפון"})\nהאם להמשיך בכל זאת?`);
      if(!ok)return;
    }
    setSaving(true);
    const oldGift=allGuests.find(g=>g.id===editG.id)?.gift||0;
    const newGift=Number(editG.gift||0);
    if(editG._new){
      const row={event_id:event.id,name:String(editG.name).replace(/\s+/g," ").trim(),phone:editG.phone||null,rsvp:editG.rsvp||"pending",
        guest_count:Number(editG.guest_count)||1,relation:editG.relation||"ללא שיוך",note:editG.note||"",gift:newGift,table_id:null};
      let{error}=await sb.from("guests").insert(row);
      // בסיס נתונים ישן בלי עמודת relation  -  שומרים בלעדיה
      if(error&&/relation/.test(error.message||"")){const{relation,...r}=row;({error}=await sb.from("guests").insert(r));}
      if(error){alert("❌ האורח לא נשמר: "+error.message);setSaving(false);return;}
    }else{
    const res=await saveGuestRow(editG.id,{
      name:editG.name,phone:editG.phone,rsvp:editG.rsvp,
      guest_count:editG.guest_count,relation:editG.relation,
      note:editG.note||"",gift:newGift
    });
    if(!res.ok){setSaving(false);return;}
    }
    // התקציב מחשב את המתנות ישירות מ-guests.gift (BudgetScreen), אין צורך בשורת תקציב נפרדת
    await loadAll();
    setSaving(false);setEditG(null);
  };

  const deleteGuest=async(g)=>{
    if(!window.confirm(`למחוק את "${g.name}"?`))return;
    await sb.from("guests").delete().eq("id",g.id);
    setGuests(gs=>gs.filter(x=>x.id!==g.id));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).filter(x=>x.id!==g.id)})));
  };

  const getTableNum=(g)=>{
    const t=tables.find(t=>(t.guests||[]).some(x=>x.id===g.id));
    return t?tables.indexOf(t)+1:null;
  };

  const [showCats,setShowCats]=useState(false);
  const [customCats,setCustomCats]=useState({...RELATION_COLORS});
  const [newCatName,setNewCatName]=useState("");
  const [newCatColor,setNewCatColor]=useState("#E53E3E");
  const [editingCat,setEditingCat]=useState(null); // {oldName, newName, color}
  const CAT_COLORS=["#E53E3E","#DD6B20","#38A169","#3182CE","#805AD5","#D69E2E","#D53F8C","#319795","#744210","#2C7A7B"];

  return(
    <div className="hm" style={{direction:"rtl",width:"100%",display:"flex",flexDirection:"column",paddingBottom:30}}>
      <style>{HOME_CSS}</style>
      {phoneDup&&<PhoneExistsDialog guest={phoneDup} count={dupCount} setCount={setDupCount} busy={saving} onBack={()=>setPhoneDup(null)} onUpdate={updateDupCount}/>}
      {/* כותרת + כפתורים */}
      <div style={{padding:"22px 24px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:18}}>
        <div>
          <h1 style={{fontSize:"clamp(26px,2.6vw,34px)",fontWeight:700,color:"#2B1D3F",margin:"0 0 4px"}}>ניהול אורחים</h1>
          {/* משפט על הנתונים: כמה רשומות וכמה עוד לא ענו */}
          <div style={{fontSize:14,color:"#5F5675"}}>{(()=>{const p=allGuests.filter(g=>!g.rsvp||g.rsvp==="pending").reduce((s,g)=>s+(g.guest_count||1),0);return `${allGuests.length} רשומות · ${total} מוזמנים${p?` · ${p} עוד לא ענו`:" · כולם ענו"}`;})()}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>setShowCats(s=>!s)} aria-pressed={showCats}
            style={{background:showCats?"#F1EAFF":"#fff",color:"#4A2C8F",border:"none",borderRadius:100,padding:"10px 18px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 10px 22px -16px rgba(43,29,63,.55)"}}>
            🏷️ קטגוריות
          </button>
          {onImport&&<button onClick={onImport}
            style={{background:"#fff",color:"#4A2C8F",border:"none",borderRadius:100,padding:"10px 18px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 10px 22px -16px rgba(43,29,63,.55)"}}>
            📊 ייבוא אורחים
          </button>}
          <button onClick={()=>printRsvpList(event,allGuests,tables,filterRsvp)} title={filterRsvp==="all"?"הדפסת כל רשימת האורחים":"הדפסת הסינון הנוכחי"}
            style={{background:"#fff",color:"#4A2C8F",border:"none",borderRadius:100,padding:"10px 18px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 10px 22px -16px rgba(43,29,63,.55)"}}>
            🖨️ הדפסה
          </button>
          <button onClick={openAdd} className="hm-pill p" style={{padding:"10px 22px",fontSize:14}}>
            + הוספת אורח
          </button>
        </div>
      </div>

      {/* פאנל קטגוריות */}
      {showCats&&(
        <div style={{background:"#fff",borderRadius:28,padding:22,marginBottom:16,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:"#2B1D3F",margin:"0 0 14px"}}>🏷️ קטגוריות קרבה</h2>

          {/* קטגוריות קיימות */}
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
            {Object.entries(customCats).map(([name,color])=>(
              editingCat?.oldName===name ? (
                // מצב עריכה
                <div key={name} style={{display:"flex",alignItems:"center",gap:6,background:"#F7FAFC",border:"1.5px solid #BEE3F8",borderRadius:12,padding:"6px 10px",flexWrap:"wrap"}}>
                  <div style={{width:14,height:14,borderRadius:"50%",background:editingCat.color,flexShrink:0,border:"2px solid #E2E8F0"}}/>
                  <input value={editingCat.newName} onChange={e=>setEditingCat(c=>({...c,newName:e.target.value}))}
                    style={{border:"1px solid #E2E8F0",borderRadius:6,padding:"3px 8px",fontSize:12,outline:"none",fontFamily:"inherit",width:120}}/>
                  <div style={{display:"flex",gap:4}}>
                    {CAT_COLORS.map(c=>(
                      <div key={c} onClick={()=>setEditingCat(ec=>({...ec,color:c}))}
                        style={{width:16,height:16,borderRadius:"50%",background:c,cursor:"pointer",border:`2px solid ${editingCat.color===c?"#1A202C":"transparent"}`}}/>
                    ))}
                  </div>
                  <button onClick={()=>{
                    const {oldName,newName,color:nc}=editingCat;
                    if(!newName.trim())return;
                    const c={...customCats};
                    delete c[oldName];
                    delete RELATION_COLORS[oldName];
                    c[newName.trim()]=nc;
                    RELATION_COLORS[newName.trim()]=nc;
                    setCustomCats(c);
                    setEditingCat(null);
                  }} style={{background:"#276749",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓</button>
                  <button onClick={()=>setEditingCat(null)}
                    style={{background:"#F7FAFC",color:"#5F6B7D",border:"1px solid #E2E8F0",borderRadius:6,padding:"3px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                </div>
              ) : (
                // תצוגה רגילה
                <div key={name} style={{display:"flex",alignItems:"center",gap:6,background:color+"15",border:`1.5px solid ${color}44`,borderRadius:20,padding:"5px 12px"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:700,color:color}}>{name}</span>
                  <button onClick={()=>setEditingCat({oldName:name,newName:name,color})}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#6E6585",fontSize:12,padding:"0 2px",lineHeight:1}}>✏️</button>
                  <button onClick={()=>{const c={...customCats};delete c[name];setCustomCats(c);delete RELATION_COLORS[name];}}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#6E6585",fontSize:14,padding:0,lineHeight:1}}>×</button>
                </div>
              )
            ))}
          </div>

          {/* הוספת קטגוריה */}
          <div style={{borderTop:"1px solid #F0F0F0",paddingTop:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#5F6B7D",marginBottom:8}}>הוסף קטגוריה חדשה:</div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="שם הקטגוריה..."
                style={{border:"1.5px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",flex:1,minWidth:150}}/>
              {/* תצוגת צבע נוכחי + בוחר */}
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:newCatColor,border:"2px solid #E2E8F0",flexShrink:0}}/>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {CAT_COLORS.map(c=>(
                    <div key={c} onClick={()=>setNewCatColor(c)}
                      style={{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",
                        border:`3px solid ${newCatColor===c?"#1A202C":"transparent"}`,
                        transform:newCatColor===c?"scale(1.2)":"scale(1)",
                        transition:"all .15s"}}/>
                  ))}
                </div>
              </div>
              <button onClick={()=>{
                if(!newCatName.trim())return;
                RELATION_COLORS[newCatName.trim()]=newCatColor;
                setCustomCats(c=>({...c,[newCatName.trim()]:newCatColor}));
                setNewCatName("");
              }} className="hm-pill p" style={{padding:"9px 18px",fontSize:14}}>
                + הוספה
              </button>
            </div>
          </div>
        </div>
      )}

      <RsvpExtrasCard event={event} guests={allGuests} style={{marginBottom:16}}/>

      {/* סטטיסטיקות */}
      <div className="hm-stats" style={{marginBottom:16}} role="group" aria-label="סינון לפי תשובה">
        {[
          {ic:"👥",label:"כל המוזמנים",value:total,bg:"#EFE6FF",ring:"#9B6BFF",filter:"all"},
          {ic:"✅",label:"מגיעים",value:confirmed,bg:"#DFF6EC",ring:"#25A55F",filter:"confirmed"},
          {ic:"⏳",label:"ממתינים לתשובה",value:allGuests.filter(g=>!g.rsvp||g.rsvp==="pending").reduce((s,g)=>s+(g.guest_count||1),0),bg:"#FFF1D6",ring:"#E8A93A",filter:"pending"},
          {ic:"✖️",label:"לא מגיעים",value:declined,bg:"#FFE3EE",ring:"#E5566F",filter:"declined"},
        ].map(s=>{const on=filterRsvp===s.filter;return(
          <button key={s.label} className="hm-stat" aria-pressed={on} onClick={()=>setFilterRsvp(s.filter)}
            style={{"--bg":s.bg,boxShadow:on?`0 0 0 3px ${s.ring}`:"none",padding:"14px 18px"}}>
            <span className="t"><i aria-hidden="true">{s.ic}</i>{s.label}</span>
            <b style={{fontSize:32,margin:"6px 0 0"}}>{s.value}</b>
            <small>{on?"מוצג ברשימה":"לחצו לסינון"}</small>
          </button>);})}
      </div>

      {/* חיפוש */}
      <div style={{background:"#fff",borderRadius:100,padding:"11px 20px",display:"flex",alignItems:"center",gap:10,marginBottom:16,boxShadow:"0 14px 30px -24px rgba(43,29,63,.6)"}}>
        <span aria-hidden="true">🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש לפי שם או טלפון..." aria-label="חיפוש אורח"
          style={{border:"none",outline:"none",fontSize:14,color:"#1A202C",flex:1,fontFamily:"inherit",background:"transparent"}}/>
        {search&&<button onClick={()=>setSearch("")} aria-label="ניקוי החיפוש" style={{background:"none",border:"none",cursor:"pointer",color:"#6E6585",fontSize:16}}>×</button>}
      </div>
      <div role="group" aria-label="מסננים" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <span style={{fontFamily:"'Fredoka','Heebo',sans-serif",fontSize:15,fontWeight:700,color:"#2B1D3F",marginLeft:4}}>🎚️ סינון:</span>
        {[["קרבה",fRel,setFRel,[["all","כל הקרבות"],...[...new Set([...Object.keys(customCats),...allGuests.map(g=>g.relation||"ללא שיוך")])].map(r=>[r,r])]],
          ["שולחן",fSeat,setFSeat,[["all","שולחן: הכל"],["seated","שובצו לשולחן"],["unseated","עוד לא שובצו"]]],
          ["צפייה בהזמנה",fView,setFView,[["all","צפייה: הכל"],["viewed","צפו בהזמנה"],["not","לא צפו בהזמנה"]]],
          ["שפת ההודעות",fLang,setFLang,[["all","🌍 כל השפות"],...MSG_LANGS.map(([c,n,fl])=>[c,`${fl} ${n}`])]]].map(([l,v,set,opts])=>(
          <select key={l} aria-label={`סינון לפי ${l}`} value={v} onChange={e=>set(e.target.value)}
            style={{border:"none",borderRadius:100,padding:"9px 14px",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer",outline:"none",
              background:v!=="all"?"#FFE6F0":"#fff",color:"#2B1D3F",boxShadow:v!=="all"?"0 0 0 2px #F0609E":"0 10px 22px -18px rgba(43,29,63,.6)"}}>
            {opts.map(([ov,ol])=><option key={ov} value={ov}>{ol}</option>)}
          </select>))}
        {anyFilter&&<button onClick={()=>{setFRel("all");setFSeat("all");setFView("all");setFLang("all");setFilterRsvp("all");setSearch("");}}
          style={{background:"none",border:"none",color:"#B4236A",fontSize:14,fontWeight:700,cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>ניקוי הסינון</button>}
        <span style={{marginRight:"auto",fontSize:14,color:"#5E5470",fontWeight:600}}>{filtered.length} מתוך {allGuests.length} רשומות</span>
      </div>

      {/* טבלה  -  מקצה לקצה */}
      </div>
      <div style={{background:"#fff",overflowX:"auto",borderRadius:28,margin:"0 24px",boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <style>{`.sx-rsvp-row:hover{background:#FFF7FB!important}`}</style>
        <table style={{width:"100%",minWidth:760,borderCollapse:"collapse",fontSize:14,fontVariantNumeric:"tabular-nums"}}>
          <thead>
            {/* כותרות שקטות: אפור, בלי פס צבעוני — הנתונים הם הדבר הבולט */}
            <tr style={{background:"#F6F0FF",borderBottom:"1px solid #ECE3F7",position:"sticky",top:0,zIndex:1}}>
              {["שם מלא","הוזמנו","אישרו","מס' נייד","שולחן","קרבה","מתנה","עדכון אחרון","הגעה","פעולות"].map((h,i)=>(
                <th key={h} style={{padding:"11px "+(i===0?"16px":"10px"),textAlign:i===0||i===5?"right":"center",fontWeight:700,color:"#4A4060",fontSize:13,whiteSpace:"nowrap"}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={10} style={{padding:32,textAlign:"center",color:"#6E6585"}}>{anyFilter?"אין אורחים שמתאימים לסינון":"אין אורחים"}</td></tr>}
            {filtered.map((g)=>{
              const relColor=RELATION_COLORS[g.relation];
              const updatedAt=g.updated_at||g.created_at,ud=updatedAt?new Date(updatedAt):null;
              // תאריך שלא ניתן לקרוא מוצג כקו, לא כ-"Invalid Date"
              const dateStr=ud&&!isNaN(ud)?
                ud.toLocaleDateString("he-IL",{day:"numeric",month:"short",year:"numeric"})
                +" · "+ud.toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})
                :"—";
              return(
              <tr key={g.id} className="sx-rsvp-row" style={{borderBottom:"1px solid #F0EBF5",background:"#fff"}}>
                {/* שם */}
                <td style={{padding:"11px 12px",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:relColor||"#CBD5E0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{ini(g.name)}</div>
                    <QuickCell value={g.name} onSave={v=>quickSave(g,"name",v)} style={{flex:1,minWidth:0,maxWidth:150}}>
                      <span title={g.name} style={{display:"block",fontWeight:700,color:"#1A202C",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</span>
                    </QuickCell>
                    <select value={langOfG(g)} onChange={e=>setGuestLang(g,e.target.value)} aria-label={`שפת ההודעות של ${g.name}`} title="שפת ההודעות"
                      style={{flexShrink:0,border:"none",borderRadius:100,background:langOfG(g)==="he"?"#F6F1FB":"#FFE6F0",padding:"3px 4px",fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"#2B1D3F",maxWidth:58}}>
                      {MSG_LANGS.map(([c,n,fl])=><option key={c} value={c}>{fl} {n}</option>)}
                    </select>
                  </div>
                </td>
                <td style={{padding:"11px 8px",textAlign:"center",fontWeight:800,fontSize:13,color:"#2D3748"}}>
                  <QuickCell value={g.guest_count||1} type="number" onSave={v=>quickSave(g,"guest_count",v)}>{g.guest_count||1}</QuickCell>
                </td>
                <td style={{padding:"12px 10px",textAlign:"center"}}>
                  <span style={{fontWeight:900,fontSize:13,color:g.rsvp==="confirmed"?"#1F7A4D":"#8E85A3"}}>{g.rsvp==="confirmed"?g.guest_count||1:0}</span>
                </td>
                <td style={{padding:"11px 8px",color:"#4A5568",direction:"ltr",textAlign:"right",fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  <QuickCell value={g.phone||""} type="tel" onSave={v=>quickSave(g,"phone",v)}>{g.phone||" - "}</QuickCell>
                </td>
                <td style={{padding:"12px 10px",textAlign:"center"}}>
                  {getTableNum(g)?<span style={{background:"#3A2464",color:"#fff",borderRadius:5,padding:"2px 7px",fontWeight:800,fontSize:12}}>{getTableNum(g)}</span>:<span style={{color:"#CBD5E0"}}> - </span>}
                </td>
                <td style={{padding:"11px 8px",overflow:"hidden"}}>
                  <QuickCell value={g.relation||"ללא שיוך"} options={[...new Set([...Object.keys(customCats),g.relation||"ללא שיוך"])]} onSave={v=>quickSave(g,"relation",v)}>
                    {g.relation?<span title={g.relation} style={{display:"inline-flex",alignItems:"center",gap:3,maxWidth:140,background:(relColor||"#CBD5E0")+"25",border:`1.5px solid ${relColor||"#CBD5E0"}66`,borderRadius:20,padding:"2px 7px",fontSize:12,fontWeight:700,color:"#3A3050",whiteSpace:"nowrap"}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:relColor||"#CBD5E0",display:"inline-block",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{g.relation}</span>
                    </span>:<span style={{color:"#CBD5E0"}}> - </span>}
                  </QuickCell>
                </td>
                <td style={{padding:"12px 10px",textAlign:"center"}}>
                  <QuickCell value={g.gift||""} type="number" onSave={v=>quickSave(g,"gift",v)}>
                    {g.gift&&g.gift>0?<span style={{background:"#FFFFF0",color:"#B7791F",border:"1.5px solid #FAF089",borderRadius:5,padding:"2px 6px",fontWeight:800,fontSize:12}}>₪{g.gift}</span>:<span style={{color:"#CBD5E0",fontSize:12}}> - </span>}
                  </QuickCell>
                </td>
                <td style={{padding:"11px 8px",color:"#5F5675",fontSize:12,textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dateStr}</td>
                <td style={{padding:"11px 6px"}}>
                  {/* מצב: לא הופצה → נשלחה הזמנה → נשלחה תזכורת → מגיע / לא מגיע (guests.last_msg) */}
                  {(()=>{const st=rsvpStage(g);return(
                  <select value={stageOf(g)} aria-label={`מצב ההגעה של ${g.name}`} onChange={async e=>{if(e.target.value)await updateRsvp(g,e.target.value);}}
                    title={g.last_msg_at&&(!g.rsvp||g.rsvp==="pending")?`נשלח ${new Date(g.last_msg_at).toLocaleString("he-IL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}`:undefined}
                    style={{border:`1.5px solid ${st.b}`,background:st.bg,color:st.c,
                      borderRadius:6,padding:"4px 3px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",outline:"none",width:"100%"}}>
                    {!stageOf(g)&&<option value="" disabled>לא הופצה</option>}
                    {RSVP_STAGES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>);})()}
                </td>
                <td style={{padding:"11px 6px"}}>
                  <div style={{display:"flex",gap:3}}>
                    <button onClick={()=>setEditG({...g})} aria-label={`עריכת ${g.name}`} style={{background:"#F6F0FF",border:"none",borderRadius:100,width:32,height:32,fontSize:13,cursor:"pointer",flexShrink:0}}>✏️</button>
                    <button onClick={()=>deleteGuest(g)} aria-label={`מחיקת ${g.name}`} style={{background:"#FFEFF2",border:"none",borderRadius:100,width:32,height:32,fontSize:13,cursor:"pointer",flexShrink:0}}>🗑️</button>
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        <div style={{padding:"12px 16px",borderTop:"1px solid #ECE5F3",fontSize:13,color:"#5F5675",textAlign:"center",background:"#FAF7FD",fontWeight:600}}>
          מציג {filtered.length} מתוך {allGuests.length} רשומות
        </div>
      </div>

      {/* מקרא קטגוריות */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14,padding:"0 24px 16px"}}>
        {Object.entries(RELATION_COLORS).map(([rel,col])=>(
          <div key={rel} style={{display:"flex",alignItems:"center",gap:5,fontSize:13,color:"#4A4060"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:col}}/>
            {rel}
          </div>
        ))}
      </div>

      {/* מודל עריכה מהירה  -  בסגנון diginet */}
      {editG&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setEditG(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:32,width:500,maxWidth:"95vw",direction:"rtl",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{border:"1.5px solid #E2E8F0",borderRadius:20,padding:"5px 16px",fontSize:13,fontWeight:700,color:"#1A202C"}}>{editG._new?"➕ הוספת אורח":"עריכת אורח"}</div>
              <button onClick={()=>setEditG(null)} style={{background:"#F7FAFC",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,color:"#5F6B7D",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>

            {/* שם */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>שם האורח:</div>
              {/* שם פרטי מימין (קודם), שם משפחה משמאל */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input value={editG.name?.split(" ")[0]||""}
                  onChange={e=>setEditG(g=>({...g,name:e.target.value+" "+(g.name?.split(" ").slice(1).join(" ")||"")}))}
                  placeholder="שם פרטי" aria-label="שם פרטי"
                  style={{border:"none",borderBottom:"1.5px solid #E2E8F0",padding:"8px 0",fontSize:15,outline:"none",fontFamily:"inherit",textAlign:"right"}}/>
                <input value={editG.name?.split(" ").slice(1).join(" ")||""}
                  onChange={e=>setEditG(g=>({...g,name:(g.name?.split(" ")[0]||"")+" "+e.target.value}))}
                  placeholder="שם משפחה" aria-label="שם משפחה"
                  style={{border:"none",borderBottom:"1.5px solid #E2E8F0",padding:"8px 0",fontSize:15,outline:"none",fontFamily:"inherit",textAlign:"right"}}/>
              </div>
            </div>

            {/* טלפון + כמות */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>מספר נייד:</div>
                <input value={editG.phone||""} onChange={e=>setEditG(g=>({...g,phone:e.target.value}))} type="tel" aria-label="מספר נייד" inputMode="tel"
                  style={{width:"100%",border:"none",borderBottom:"1.5px solid #E2E8F0",padding:"8px 0",fontSize:15,outline:"none",fontFamily:"inherit",direction:"ltr",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>כמות אורחים:</div>
                <div style={{display:"flex",alignItems:"center",gap:10,border:"1.5px solid #E2E8F0",borderRadius:8,padding:"6px 12px"}}>
                  <button onClick={()=>setEditG(g=>({...g,guest_count:Math.max(1,(g.guest_count||1)-1)}))} aria-label="פחות אורחים" style={{background:"none",border:"none",cursor:"pointer",fontSize:18,fontWeight:700,color:C.blue}}>−</button>
                  <span style={{flex:1,textAlign:"center",fontSize:16,fontWeight:800}}>{editG.guest_count||1}</span>
                  <button onClick={()=>setEditG(g=>({...g,guest_count:(g.guest_count||1)+1}))} aria-label="עוד אורח" style={{background:"none",border:"none",cursor:"pointer",fontSize:18,fontWeight:700,color:C.blue}}>+</button>
                </div>
              </div>
            </div>

            {/* קרבה */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>קטגוריית קרבה:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {RELATIONS.map(r=>(
                  <button key={r} onClick={()=>setEditG(g=>({...g,relation:r}))}
                    style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      border:`1.5px solid ${editG.relation===r?RELATION_COLORS[r]||"#E53E3E":"#E2E8F0"}`,
                      background:editG.relation===r?RELATION_COLORS[r]||"#E53E3E":"#fff",
                      color:editG.relation===r?onColor(RELATION_COLORS[r]||"#E53E3E"):"#5F6B7D",transition:"all .15s"}} aria-pressed={editG.relation===r}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* מצב הגעה */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>מצב הגעה:</div>
              <select value={editG.rsvp||"pending"} onChange={e=>setEditG(g=>({...g,rsvp:e.target.value}))} aria-label="מצב הגעה"
                style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff"}}>
                <option value="pending">ממתינים לתשובה</option>
                <option value="confirmed">מגיעים</option>
                <option value="declined">לא מגיעים</option>
              </select>
            </div>

            {/* מתנה + הערה */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <div>
                <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>מתנה ₪</div>
                <input type="number" value={editG.gift||0} onChange={e=>setEditG(g=>({...g,gift:e.target.value}))} min={0} aria-label="מתנה בשקלים" inputMode="decimal"
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:6}}>הערה</div>
                <input value={editG.note||""} onChange={e=>setEditG(g=>({...g,note:e.target.value}))} placeholder="הערה..." aria-label="הערה"
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={saveEdit} disabled={saving} className="sx-btn sx-btn-primary"
                style={{flex:2,background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                {saving?"שומר...":editG._new?"➕ הוספת אורח":"שמירת השינויים"}
              </button>
              <button onClick={()=>setEditG(null)}
                style={{flex:1,background:"#F7FAFC",color:"#5F6B7D",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ביטול וחזרה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export function BudgetScreen({ event }) {
  const CATS=["אולם","קייטרינג","צילום","מוזיקה","פרחים","הלבשה","הסעות","מתנות","אחר"];
  const CAT_COLORS={"אולם":"#3182CE","קייטרינג":"#DD6B20","צילום":"#805AD5","מוזיקה":"#D69E2E","פרחים":"#38A169","הלבשה":"#D53F8C","הסעות":"#319795","מתנות":"#E53E3E","אחר":"#5F6B7D"};
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [form,setForm]=useState({name:"",amount:"",advance:"0",type:"expense",category:"אחר",note:""});
  const [saving,setSaving]=useState(false);
  const [filterType,setFilterType]=useState("all");

  // מתנות מאורחים: מחושבות תמיד מ-guests.gift (מסך המתנות / כרטיס האורח), לא נשמרות כשורות בתקציב
  const [gifts,setGifts]=useState({sum:0,count:0});
  useEffect(()=>{
    sb.from("budget_items").select("*").eq("event_id",event.id).order("created_at",{ascending:false})
      .then(({data,error})=>{
        if(error)console.error("budget_items error:",error.message);
        setItems(data||[]);setLoading(false);
      });
    sb.from("guests").select("gift").eq("event_id",event.id).then(({data})=>{
      const g=(data||[]).map(x=>Number(x.gift)||0).filter(n=>n>0);
      setGifts({sum:g.reduce((a,b)=>a+b,0),count:g.length});
    });
  },[]);
  // שורות "מתנה - שם" שנוצרו פעם אוטומטית מכרטיס האורח: כבר כלולות בסכום המתנות, לא סופרים אותן פעמיים
  const isAutoGift=i=>i.type==="income"&&i.category==="מתנות"&&/^מתנה\s+-\s+/.test(String(i.name||""));
  const own=items.filter(i=>!isAutoGift(i));

  const totalExpenses=own.filter(i=>i.type==="expense").reduce((s,i)=>s+Number(i.amount||0),0);
  const totalIncome=own.filter(i=>i.type==="income").reduce((s,i)=>s+Number(i.amount||0),0)+gifts.sum;
  const guestIncome=own.filter(i=>i.type==="income"&&i.category==="מתנות").reduce((s,i)=>s+Number(i.amount||0),0)+gifts.sum;
  const profit=totalIncome-totalExpenses;
  // כמה עוד צריך לשלם לספקים (סכום פחות מקדמה, רק הוצאות) — המספר שהכי חשוב בזמן התכנון
  const leftToPay=own.filter(i=>i.type==="expense").reduce((s,i)=>s+Math.max(0,Number(i.amount||0)-Number(i.advance||0)),0);
  const openNew=(name="",category="אחר")=>{setEditItem(null);setForm({name,amount:"",advance:"0",type:"expense",category,note:""});setShowForm(true);};
  // ייצוא לאקסל: כל השורות + שורת מתנות וסיכום, מימין לשמאל
  const exportXlsx=async()=>{
    const rows=[["מוצר / שירות","סוג","קטגוריה","סכום","שולם (מקדמה)","נשאר לשלם","הערה"],
      ...(gifts.sum?[[`מתנות מאורחים (${gifts.count})`,"הכנסה","מתנות",gifts.sum,gifts.sum,0,"מחושב ממסך המתנות"]]:[]),
      ...own.map(i=>[i.name,i.type==="expense"?"הוצאה":"הכנסה",i.category||"",Number(i.amount||0),Number(i.advance||0),Math.max(0,Number(i.amount||0)-Number(i.advance||0)),i.note||""]),
      [],["סה״כ הוצאות","","",totalExpenses],["סה״כ הכנסות","","",totalIncome],["רווח / הפסד","","",profit]];
    const name=`תקציב - ${event?.name||"אירוע"}`.replace(/[\\/:*?"<>|]/g,"");
    let blob,ext="xlsx";
    try{
      const{utils,write}=await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
      const ws=utils.aoa_to_sheet(rows);ws["!cols"]=[{wch:26},{wch:8},{wch:12},{wch:11},{wch:13},{wch:12},{wch:28}];
      const wb=utils.book_new();wb.Workbook={Views:[{RTL:true}]};utils.book_append_sheet(wb,ws,"תקציב");
      blob=new Blob([write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    }catch{
      ext="csv";blob=new Blob(["﻿"+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
    }
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${name}.${ext}`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  };

  const saveItem=async()=>{
    if(!form.name.trim()||!form.amount)return;
    setSaving(true);
    try{
      if(editItem){
        const{data,error}=await sb.from("budget_items").update({
          name:form.name,amount:Number(form.amount),advance:Number(form.advance||0),
          type:form.type,category:form.category,note:form.note,event_id:event.id
        }).eq("id",editItem.id).select().single();
        if(error)throw error;
        setItems(is=>is.map(i=>i.id===editItem.id?data:i));
      }else{
        const{data,error}=await sb.from("budget_items").insert({
          name:form.name,amount:Number(form.amount),advance:Number(form.advance||0),
          type:form.type,category:form.category,note:form.note,event_id:event.id
        }).select().single();
        if(error)throw error;
        setItems(is=>[data,...is]);
      }
      setShowForm(false);setEditItem(null);
      setForm({name:"",amount:"",advance:"0",type:"expense",category:"אחר",note:""});
    }catch(e){
      alert("שגיאה בשמירה: "+e.message);
    }
    setSaving(false);
  };

  const deleteItem=async(id)=>{
    if(!window.confirm("למחוק פריט זה?"))return;
    await sb.from("budget_items").delete().eq("id",id);
    setItems(is=>is.filter(i=>i.id!==id));
  };

  const filtered=own.filter(i=>filterType==="all"||i.type===filterType);
  const showGifts=gifts.sum>0&&filterType!=="expense";

  if(loading)return<div style={{padding:40,textAlign:"center"}}><Spinner size={32}/></div>;
  // כמה שולם מתוך כל ההוצאות, ופילוח ההוצאות לפי קטגוריה (מהנתונים עצמם)
  const paidPct=totalExpenses>0?Math.round((totalExpenses-leftToPay)/totalExpenses*100):0;
  const byCat=Object.entries(own.filter(i=>i.type==="expense").reduce((m,i)=>{m[i.category||"אחר"]=(m[i.category||"אחר"]||0)+Number(i.amount||0);return m;},{})).sort((x,y)=>y[1]-x[1]);

  return(
    <div className="hm bd" style={{direction:"rtl",width:"100%",paddingBottom:30}}>
      <style>{HOME_CSS+BUDGET_CSS}</style>
      <div style={{padding:"22px 24px 0"}}>
      {/* כותרת */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:18}}>
        <div>
          <h1 style={{fontSize:"clamp(26px,2.6vw,34px)",fontWeight:700,color:"#2B1D3F",margin:"0 0 4px"}}>ניהול תקציב</h1>
          {/* משפט על הנתונים במקום תיאור הממשק */}
          <div style={{fontSize:14,color:"#5F5675"}}>{own.length?`${own.length===1?"פריט אחד":`${own.length} פריטים`}${leftToPay>0?` · נשאר לשלם לספקים ₪${leftToPay.toLocaleString()}`:" · הכל שולם"}`:"מעקב אחרי הוצאות, מקדמות ומתנות"}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {(own.length>0||gifts.sum>0)&&<button onClick={exportXlsx}
            style={{background:"#fff",color:"#4A2C8F",border:"none",borderRadius:100,padding:"10px 18px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 10px 22px -16px rgba(43,29,63,.55)"}}>
            ⬇️ ייצוא לאקסל
          </button>}
          <button onClick={()=>openNew()} className="hm-pill p" style={{padding:"10px 22px",fontSize:14}}>
            + הוספת הוצאה
          </button>
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div className="hm-stats" style={{marginBottom:16}}>
        {/* הוצאות → כמה עוד לשלם → הכנסות ומתנות → מאזן (הכנסות פחות הוצאות; "רווח" לא מתאים לחתונה) */}
        {[
          {ic:"💸",label:"סה״כ הוצאות",value:totalExpenses,bg:"#FFE3EE",sub:own.filter(i=>i.type==="expense").length?`${own.filter(i=>i.type==="expense").length} ספקים ושירותים`:"עוד לא נוספו"},
          {ic:"⏳",label:"נשאר לשלם",value:leftToPay,bg:"#FFF1D6",sub:totalExpenses>0?`שולמו ${paidPct}% מההוצאות`:"—"},
          {ic:"🎁",label:"הכנסות ומתנות",value:totalIncome,bg:"#DFF6EC",sub:gifts.count?`כולל ${gifts.count} מתנות מאורחים`:"מתעדכן ממסך המתנות"},
          {ic:"⚖️",label:"מאזן",value:profit,bg:"#EFE6FF",sign:true,sub:profit>=0?"הכנסות פחות הוצאות":"ההוצאות גבוהות מההכנסות"},
        ].map(s=>(
          <div key={s.label} className="hm-stat" style={{"--bg":s.bg,cursor:"default"}}>
            <span className="t"><i aria-hidden="true">{s.ic}</i>{s.label}</span>
            <b dir="ltr" style={{fontSize:"clamp(21px,2.3vw,30px)",whiteSpace:"nowrap",textAlign:"right",color:s.sign&&s.value<0?"#B42318":"#2B1D3F"}}>{s.sign&&s.value<0?"−":""}₪{Math.abs(s.value).toLocaleString()}</b>
            <small>{s.sub}</small>
          </div>
        ))}
      </div>

      {byCat.length>0&&(
        <section className="bd-card" aria-labelledby="bd-cat-h">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:10,flexWrap:"wrap",marginBottom:14}}>
            <h2 id="bd-cat-h" style={{margin:0,fontSize:19,fontWeight:700,color:"#2B1D3F"}}>לאן הולך הכסף</h2>
            <span style={{fontSize:14,color:"#5E5470",fontWeight:600}}>שולמו ₪{(totalExpenses-leftToPay).toLocaleString()} מתוך ₪{totalExpenses.toLocaleString()}</span>
          </div>
          <div className="bd-paid" role="img" aria-label={`שולמו ${paidPct} אחוז מההוצאות`}><u style={{width:`${paidPct}%`}}/></div>
          <div className="bd-cats">
            {byCat.map(([c,v])=>(
              <div key={c} className="bd-cat">
                <span><i style={{background:CAT_COLORS[c]||"#5F6B7D"}}/>{c}</span>
                <div className="bd-bar" aria-hidden="true"><u style={{width:`${Math.max(4,Math.round(v/totalExpenses*100))}%`,background:CAT_COLORS[c]||"#5F6B7D"}}/></div>
                <b dir="ltr">₪{v.toLocaleString()}</b>
              </div>))}
          </div>
        </section>
      )}

      {/* פילטר */}
      <div role="group" aria-label="סינון" style={{display:"inline-flex",gap:4,marginBottom:14,background:"#fff",borderRadius:100,padding:4,boxShadow:"0 10px 22px -18px rgba(43,29,63,.55)"}}>
        {[["all","הכל"],["expense","הוצאות"],["income","הכנסות"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilterType(v)} aria-pressed={filterType===v}
            style={{background:filterType===v?"linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)":"transparent",color:filterType===v?"#fff":"#4A2C8F",border:"none",borderRadius:100,padding:"8px 20px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>

      {/* טבלה */}
      <style>{`.sx-rsvp-row:hover{background:#FBF8FE!important}`}</style>
      {/* מצב ריק: מה עושים עכשיו, עם קיצורי דרך להוצאות הנפוצות (נפתח טופס עם השם והקטגוריה) */}
      {own.length===0&&!gifts.sum&&(
        <div className="bd-card" style={{textAlign:"center",background:"linear-gradient(180deg,#FFF1D6 0,#fff 120px)"}}>
          <div aria-hidden="true" style={{width:58,height:58,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 10px",boxShadow:"0 12px 24px -14px rgba(43,29,63,.5)"}}>💰</div>
          <h2 style={{fontSize:20,fontWeight:700,color:"#2B1D3F",margin:"0 0 6px"}}>עוד לא נוספו הוצאות</h2>
          <p style={{fontSize:14,color:"#4A4060",margin:"0 0 14px",lineHeight:1.6}}>מתחילים מההוצאות הגדולות. אפשר לרשום גם מקדמה, ונראה כמה נשאר לשלם לכל ספק.</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
            {[["אולם","אולם"],["קייטרינג","קייטרינג"],["צלם","צילום"],["DJ / להקה","מוזיקה"],["פרחים ועיצוב","פרחים"],["שמלה וחליפה","הלבשה"]].map(([n,c])=>(
              <button key={n} onClick={()=>openNew(n,c)} className="sx-btn"
                style={{background:"#fff",color:"#4A2C8F",border:"none",borderRadius:100,padding:"9px 16px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"inset 0 0 0 1.5px #E6DDF5"}}>+ {n}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{background:"#fff",overflowX:"auto",borderRadius:28,boxShadow:"0 18px 40px -28px rgba(91,60,140,.5)"}}>
        <table style={{width:"100%",minWidth:320,borderCollapse:"collapse",fontSize:13,fontVariantNumeric:"tabular-nums"}}>
          <thead>
            {/* כותרות שקטות: אפור על רקע בהיר — הסכומים הם מה שבולט */}
            <tr style={{background:"#F6F0FF",borderBottom:"1px solid #ECE3F7"}}>
              <th style={{padding:"12px 16px",textAlign:"right",fontWeight:700,color:"#4A4060",fontSize:13}}>מוצר / שירות</th>
              <th style={{padding:"10px 8px",textAlign:"center",fontWeight:700,color:"#4A4060",fontSize:13}}>סכום</th>
              <th style={{padding:"10px 8px",textAlign:"center",fontWeight:700,color:"#4A4060",fontSize:13}}>נשאר לשלם</th>
              <th style={{padding:"10px 8px",textAlign:"center",fontWeight:700,color:"#4A4060",fontSize:13}}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {showGifts&&(
              <tr style={{borderBottom:"1px solid #F0EBF5",background:"#F2FBF6"}}>
                <td style={{padding:"10px 12px",borderRight:"1px solid #E2E8F0"}}>
                  <div style={{fontWeight:800,color:"#1A202C",fontSize:13}}>🎁 מתנות מאורחים ({gifts.count})</div>
                  <div style={{fontSize:12,color:"#1F7A4D",marginTop:2,fontWeight:600}}>הכנסה · מתעדכן אוטומטית ממסך המתנות</div>
                </td>
                <td style={{padding:"10px 8px",textAlign:"center",fontWeight:800,fontSize:13,color:"#276749",borderRight:"1px solid #E2E8F0"}}>₪{gifts.sum.toLocaleString()}</td>
                <td style={{padding:"10px 8px",textAlign:"center",borderRight:"1px solid #E2E8F0"}}><span style={{color:"#276749",fontWeight:800}}>✓</span></td>
                <td style={{padding:"10px 8px",textAlign:"center",fontSize:12,color:"#5F5675"}}>אוטומטי</td>
              </tr>
            )}
            {filtered.length===0&&!showGifts&&(
              <tr><td colSpan={4} style={{padding:"28px",textAlign:"center",color:"#5F5675",fontSize:14}}>{own.length?"אין שורות בסינון הזה":"הפריטים שתוסיפו יופיעו כאן"}</td></tr>
            )}
            {filtered.map(item=>{
              const catColor=CAT_COLORS[item.category]||"#5F6B7D";
              const remain=Number(item.amount||0)-Number(item.advance||0);
              return(
                <tr key={item.id} className="sx-rsvp-row" style={{borderBottom:"1px solid #F0EBF5",background:"#fff"}}>
                  <td style={{padding:"10px 12px",maxWidth:180}}>
                    <div style={{fontWeight:800,color:"#1A202C",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                    <div style={{fontSize:12,color:"#5F5675",marginTop:2,fontWeight:600}}><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:catColor,marginLeft:5}}/>{item.type==="expense"?"הוצאה":"הכנסה"} · {item.category}</div>
                  </td>
                  <td style={{padding:"10px 8px",textAlign:"center",fontWeight:800,fontSize:14,color:item.type==="expense"?"#1A202C":"#1F7A4D"}}>
                    ₪{Number(item.amount||0).toLocaleString()}
                  </td>
                  <td style={{padding:"10px 8px",textAlign:"center",fontWeight:700,fontSize:14}}>
                    {item.type!=="expense"?<span style={{color:"#8E85A3"}}>—</span>:remain>0?<span style={{color:"#8A5A00",fontWeight:800}}>₪{remain.toLocaleString()}</span>:<span style={{color:"#1F7A4D",fontWeight:800}}>✓ שולם</span>}
                  </td>
                  <td style={{padding:"10px 8px"}}>
                    <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                      <button onClick={()=>{setEditItem(item);setForm({name:item.name,amount:String(item.amount),advance:String(item.advance||0),type:item.type,category:item.category,note:item.note||""});setShowForm(true);}}
                        aria-label={`עריכת ${item.name}`} style={{background:"#F6F0FF",color:"#4A2C8F",border:"none",borderRadius:100,width:34,height:34,fontSize:13,cursor:"pointer"}}>✏️</button>
                      <button onClick={()=>deleteItem(item.id)} aria-label={`מחיקת ${item.name}`}
                        style={{background:"#FFEFF2",color:"#B42318",border:"none",borderRadius:100,width:34,height:34,fontSize:13,cursor:"pointer"}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:"12px 16px",borderTop:"1px solid #F0EBF5",fontSize:13,color:"#5F5675",textAlign:"center",background:"#FBF8FD",fontWeight:600}}>
          מציג {filtered.length+(showGifts?1:0)} מתוך {own.length+(gifts.sum?1:0)} שורות
        </div>
      </div>

      {/* מודל הוספה/עריכה */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(43,29,63,.45)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setShowForm(false);setEditItem(null);}}>
          <div role="dialog" aria-modal="true" aria-label={editItem?"עריכת פריט":"הוספת הוצאה"} className="evs-form bd-form" onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:32,padding:28,width:480,maxWidth:"95vw",direction:"rtl",boxShadow:"0 30px 70px -20px rgba(43,29,63,.45)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontSize:21,fontWeight:700,color:"#2B1D3F",margin:0}}>{editItem?"עריכת פריט":"הוספת הוצאה או הכנסה"}</h2>
              <button aria-label="סגירה" onClick={()=>{setShowForm(false);setEditItem(null);}} style={{background:"#F1EAFF",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,color:"#5F6B7D"}}>×</button>
            </div>

            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:5}}>מוצר / שירות *</div>
              <input aria-label="מוצר או שירות" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="לדוגמה: אולמי הגן"
                style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:5}}>סוג</div>
                <div style={{display:"flex",gap:6}}>
                  {[["expense","הוצאה"],["income","הכנסה"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setForm(f=>({...f,type:v}))}
                      aria-pressed={form.type===v} style={{flex:1,padding:"10px",borderRadius:100,border:"none",boxShadow:form.type===v?"none":"inset 0 0 0 1.5px #E6DDF5",
                        background:form.type===v?(v==="expense"?"#FFE3EE":"#DFF6EC"):"#fff",
                        color:form.type===v?(v==="expense"?"#A3245E":"#156B4A"):"#4A4060",
                        cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:5}}>קטגוריה</div>
                <select aria-label="קטגוריה" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff"}}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:5}}>סכום כולל ₪</div>
                <input aria-label="סכום כולל" type="number" inputMode="numeric" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0"
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:5}}>מקדמה ששולמה ₪</div>
                <input aria-label="מקדמה ששולמה" type="number" inputMode="numeric" value={form.advance} onChange={e=>setForm(f=>({...f,advance:e.target.value}))} placeholder="0"
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:5}}>הערה</div>
              <textarea aria-label="הערה" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="הערות נוספות..."
                style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:60,resize:"vertical"}}/>
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={saveItem} disabled={saving||!form.name.trim()||!form.amount}
                style={{flex:2,background:"linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)",color:"#fff",border:"none",borderRadius:100,padding:"13px",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 14px 28px -14px rgba(240,96,158,.7)",opacity:saving||!form.name.trim()||!form.amount?.55:1}}>
                {saving?"שומר...":editItem?"עדכן פריט":"הוסף פריט ✓"}
              </button>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}}
                style={{flex:1,background:"#fff",color:"#4A4060",border:"none",boxShadow:"inset 0 0 0 1.5px #E6DDF5",borderRadius:100,padding:"12px",fontSize:15,fontWeight:700,cursor:"pointer"}}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
export function ContactsScreen({ event, onAdd }) {
  const [contacts,setContacts]=useState([]);
  const [selected,setSelected]=useState(new Set());
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(false);
  const [supported,setSupported]=useState(true);

  const loadContacts=async()=>{
    if(!("contacts" in navigator&&"ContactsManager" in window)){setSupported(false);return;}
    setLoading(true);
    try{
      const props=["name","tel"];
      const list=await navigator.contacts.select(props,{multiple:true});
      const parsed=list.map((c,i)=>({id:i,name:(c.name&&c.name[0])||"",phone:(c.tel&&c.tel[0])||""})).filter(c=>c.name.trim());
      setContacts(parsed);
    }catch(e){setSupported(false);}
    setLoading(false);
  };

  const toggleSelect=(id)=>{
    setSelected(prev=>{const s=new Set(prev);s.has(id)?s.delete(id):s.add(id);return s;});
  };

  const selectAll=()=>{
    const filtered=contacts.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
    if(selected.size===filtered.length)setSelected(new Set());
    else setSelected(new Set(filtered.map(c=>c.id)));
  };

  const handleAdd=()=>{
    const toAdd=contacts.filter(c=>selected.has(c.id));
    if(toAdd.length>0)onAdd(toAdd);
  };

  const filtered=contacts.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));

  if(!supported||contacts.length===0){
    return(
      <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:20}}>
        {!supported?(
          <>
            <div style={{textAlign:"center",padding:"30px 0 20px"}}>
              <div style={{fontSize:52,marginBottom:12}}>📱</div>
              <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:8}}>ייבוא מאנשי קשר</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.7}}>
                דפדפן זה לא תומך בגישה לאנשי קשר ישירות.<br/>
                השתמש ב-Chrome על Android או הוסף ידנית.
              </div>
            </div>
            <div style={{background:C.blueXL,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:8}}>💡 הדבק שמות ידנית</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:10}}>שם אחד בכל שורה, אפשר להוסיף טלפון אחרי פסיק</div>
              <textarea id="manualContacts" placeholder={"ישראל ישראלי, 050-1234567\nרונית לוי\nמשפחת כהן, 052-9876543"}
                style={{width:"100%",background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:11,padding:12,fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",minHeight:140,boxSizing:"border-box",resize:"vertical",marginBottom:10}}/>
              <button onClick={()=>{
                const text=document.getElementById("manualContacts").value;
                const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
                const parsed=lines.map((l,i)=>{const parts=l.split(",");return{id:i,name:parts[0].trim(),phone:parts[1]?.trim()||""};}).filter(c=>c.name.length>1);
                if(parsed.length>0)onAdd(parsed);
              }} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ➕ הוסף לרשימה
              </button>
            </div>
          </>
        ):(
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:52,marginBottom:12}}>📱</div>
            <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:8}}>טעינת אנשי קשר</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:24}}>לחץ לפתיחת אנשי הקשר בטלפון</div>
            <button onClick={loadContacts} disabled={loading} style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"14px 32px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:8}}>
              {loading?<><Spinner size={18} color="#fff"/>טוען...</>:"📲 פתח אנשי קשר"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",display:"flex",flexDirection:"column",height:"calc(100vh - 108px)"}}>
      {/* חיפוש + בחר הכל */}
      <div style={{padding:"12px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש שם..."
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,color:C.muted}}>{selected.size} נבחרו מתוך {filtered.length}</span>
          <button onClick={selectAll} style={{background:C.blueXL,color:C.blue,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {selected.size===filtered.length&&filtered.length>0?"בטל הכל":"בחר הכל"}
          </button>
        </div>
      </div>

      {/* רשימה */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 16px"}}>
        {filtered.map(c=>(
          <div key={c.id} onClick={()=>toggleSelect(c.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",marginBottom:8,borderRadius:14,background:selected.has(c.id)?C.blueXL:C.surface,border:`1.5px solid ${selected.has(c.id)?C.blueL:C.border}`,cursor:"pointer",transition:"all .15s"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:selected.has(c.id)?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#F6F0FF",color:selected.has(c.id)?"#fff":C.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0,transition:"all .15s"}}>
              {selected.has(c.id)?"✓":ini(c.name)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{c.name}</div>
              {c.phone&&<div style={{fontSize:12,color:C.muted,marginTop:1}}>{c.phone}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* כפתור הוספה */}
      {selected.size>0&&<div style={{padding:"12px 16px",background:C.surface,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
        <button onClick={handleAdd} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.blueL}44`}}>
          ➕ הוסף {selected.size} אורחים לרשימה
        </button>
      </div>}
    </div>
  );
}

// ─── PACKAGES SCREEN ──────────────────────────────────────────────────────────
export function PackagesScreen({ event, onBack, userPackages=[], recordCount=0 }) {
  // הודעות נקנות בנפרד, בלי חבילה בסיסית. הבסיסית (₪100) פותחת רק הושבה מעל FREE_SEATING_LIMIT מוזמנים
  const baseOwned=hasBasicPkg(userPackages);
  const smsBase=0;
  const waDefault=Math.max(50,Math.ceil((recordCount||100)/10)*10); // ברירת מחדל: מספר הרשומות באירוע
  // תוספת מוקד מתקשר לכל חבילה (sms / auto) + מספר הרשומות למוקד ב-SMS
  const [callOn,setCallOn]=useState({}), [callRecs,setCallRecs]=useState(waDefault);
  const waQty=()=>selectedTier?.[0]||waDefault, smsQty=()=>selectedTier?.[0]||300;
  const waSum=()=>pickerTotal({value:waQty(),baseFee:smsBase,unitPrice:WA_RECORD_PRICE,callOn:!!callOn.auto});
  const smsSum=()=>pickerTotal({value:smsQty(),baseFee:smsBase,callOn:!!callOn.sms,callRecords:callRecs});
  const callTxt=r=>` + מוקד מתקשר ל-${r.toLocaleString()} רשומות × ${fmtShekel(CALL_RECORD_PRICE)}`;
  const [selectedPkg,setSelectedPkg]=useState(null);
  const [selectedTier,setSelectedTier]=useState(null); // לחבילות עם מחיר לפי כמות


  const packages=[
    {
      id:"free", name:"חינם", price:0, priceLabel:"₪0", color:"#276749", icon:"🎁",
      badge:`עד ${FREE_SEATING_LIMIT} מוזמנים`, featured:false,
      desc:"כל הכלים פתוחים מההרשמה",
      features:["✅ אישורי הגעה עם קישור אישי לכל אורח","✅ הזמנה דיגיטלית יפה ושליחה דרך קישור","✅ רשימת מוזמנים ללא הגבלה, ייבוא מאקסל ואנשי קשר","✅ תקציב, משימות, מתנות וכניסה לאולם",`✅ סידורי הושבה ומפת אולם עד ${FREE_SEATING_LIMIT} מוזמנים`],
    },
    {
      id:"basic", name:"פתיחת הושבה", price:BASIC_PRICE, priceLabel:fmtShekel(BASIC_PRICE), color:C.blue, icon:"🪑",
      badge:"לאירוע", featured:true,
      desc:`סידורי הושבה מעל ${FREE_SEATING_LIMIT} מוזמנים · תשלום חד-פעמי`,
      features:["✅ סידורי הושבה ללא הגבלת מוזמנים","✅ מפת אולם, גרירה והושבה אוטומטית","✅ מספרי שולחנות והדפסת סידור ההושבה","✅ כל מה שבחבילה החינמית"],
    },
    {
      id:"sms", name:"SMS", price:null, priceLabel:`${fmtShekel(SMS_UNIT_PRICE)} להודעה`, color:"#059669", icon:"📱",
      badge:"לפי כמות", featured:false,
      desc:"בוחרים כמות · בלי חבילה",
      smsPicker:true,
      features:["✅ שליחת SMS לכל האורחים","✅ תזכורות לפני האירוע","✅ מספר שולחן ב-SMS ביום האירוע","✅ הודעת תודה אחרי האירוע",`📞 אפשר להוסיף מוקד מתקשר (+${fmtShekel(CALL_RECORD_PRICE)} לרשומה)`],
    },
    {
      id:"auto", name:"הודעות WhatsApp", price:null, priceLabel:`${fmtShekel(WA_RECORD_PRICE)} לרשומה`, color:"#25D366", icon:"💬",
      badge:"4 סבבים", featured:false,
      desc:"4 הודעות WhatsApp אוטומטיות לכל רשומה",
      note:"רשומה = אורח או משפחה עם מספר טלפון אחד.",
      waPicker:true,
      features:[...WA_ROUNDS.map(r=>"💬 "+r),`📞 אפשר להוסיף מוקד מתקשר (+${fmtShekel(CALL_RECORD_PRICE)} לרשומה)`],
    },
    {
      id:"staff", name:"צוות הושבה", price:1800, priceLabel:"החל מ ₪1,800", color:"#7C3AED", icon:"👥",
      badge:"שירות פרימיום", featured:false,
      desc:"2 אנשי צוות ביום האירוע",
      features:["✅ 2 אנשי צוות מקצועיים ביום האירוע","✅ חלוקת פתקי הושבה לאורחים","✅ ניהול תורים בכניסה","✅ הכוונה ועזרה במציאת מקום לאורחים","⚠️ תיתכן תוספת מרחק"],
    },
    {
      id:"kiosk", name:"עמדת טאבלט", price:1000, priceLabel:"החל מ ₪1,000", color:"#2B6CB0", icon:"📟",
      badge:"שירות עצמי", featured:false,
      desc:"2 טאבלטים בכניסה · האורחים מוציאים פתק לבד",
      features:["✅ 2 טאבלטים בכניסה לאולם","✅ האורח מקליד את השם ורואה את מספר השולחן","✅ הדפסת פתק הושבה לבד, בלי לחכות בתור","✅ סימון אוטומטי של מי שהגיע","✅ קל מאוד לתפעול","⚠️ תיתכן תוספת מרחק"],
    },
  ];

  const handleBuy=(pkg)=>{
    if(pkg.id==="free") return;
    let msg=`לרכישת חבילת "${pkg.name}"`;
    if(pkg.waPicker){const q=waQty();msg+=` - ${q.toLocaleString()} רשומות × ${fmtShekel(WA_RECORD_PRICE)} (4 סבבים)${callOn.auto?callTxt(q):""}${smsBase?` + חבילה בסיסית ${fmtShekel(smsBase)}`:""} - סה"כ ${fmtShekel(waSum())}`;}
    else if(pkg.smsPicker){const q=smsQty();msg+=` - ${q.toLocaleString()} הודעות × ${fmtShekel(SMS_UNIT_PRICE)}${callOn.sms?callTxt(callRecs):""}${smsBase?` + חבילה בסיסית ${fmtShekel(smsBase)}`:""} - סה"כ ${fmtShekel(smsSum())}`;}
    else if(selectedTier) msg+=` - ${selectedTier[0]} רשומות - ₪${selectedTier[1].toLocaleString()}`;
    else if(pkg.price) msg+=` - ${pkg.priceLabel||"₪"+pkg.price}`;
    openContact("שלום, אני מעוניין "+msg,"רכישת חבילה ב-Sidor-IL");
  };

  // פאנל הפרטים: נפתח מתחת לשורה של הריבוע שנבחר
  const panelRef=useRef(null);
  useEffect(()=>{if(selectedPkg&&panelRef.current)setTimeout(()=>panelRef.current?.scrollIntoView({behavior:"smooth",block:"nearest"}),60);},[selectedPkg?.id]);
  const clean=t=>String(t).replace(/^(✅|💬|📞|⚠️|❌)\s*/,"");
  const owned=pkg=>pkg.id==="free"||(pkg.id==="basic"&&baseOwned);
  return(
    <div className="pk" style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:80}}>
      <style>{PK_CSS}</style>
      <div className="pk-hero">
        <span className="pk-bub a" aria-hidden="true"/><span className="pk-bub b" aria-hidden="true"/>
        <h1>חבילות <span>Sidor-IL</span></h1>
        <p>בוחרים רק מה שצריך. כל הכלים הבסיסיים פתוחים בחינם, ומוסיפים הושבה, הודעות או שירות ביום האירוע.</p>
      </div>

      <div className="pk-grid">
        {packages.map(pkg=>{
          const isOpen=selectedPkg?.id===pkg.id;
          return(<Fragment key={pkg.id}>
            <div className={`pk-card${isOpen?" on":""}${pkg.featured?" feat":""}`} style={{"--c":pkg.id==="auto"?"#178A45":pkg.color}}>
              {pkg.featured&&<span className="pk-pop">⭐ הכי פופולרי</span>}
              <div className="pk-top">
                <span className="pk-ic" aria-hidden="true">{pkg.icon}</span>
                {pkg.badge&&<span className="pk-badge">{pkg.badge}</span>}
              </div>
              <h3>{pkg.name}</h3>
              <div className="pk-price">{pkg.priceLabel}{pkg.price===0&&<small> · תמיד</small>}</div>
              <p className="pk-desc">{pkg.desc}</p>
              <ul className="pk-feats">{pkg.features.filter(x=>!x.startsWith("⚠️")&&!x.startsWith("📞")).slice(0,3).map(x=><li key={x}>{clean(x)}</li>)}</ul>
              {owned(pkg)
                ?<div className="pk-own">{pkg.id==="free"?"✓ פתוחה לכל חשבון":"✓ כבר ברשותך"}</div>
                :<button type="button" className="pk-btn" aria-expanded={isOpen} onClick={()=>{setSelectedPkg(isOpen?null:pkg);setSelectedTier(null);}}>{isOpen?"סגירה":"בחירה"}</button>}
            </div>
            {isOpen&&(
              <div ref={panelRef} className="pk-panel" style={{"--c":pkg.id==="auto"?"#178A45":pkg.color}}>
                <div className="pk-panel-h"><span aria-hidden="true">{pkg.icon}</span>{pkg.name}<small>{pkg.priceLabel}</small></div>
                {pkg.note&&<div className="pk-note">⚠️ {pkg.note}</div>}
                <ul className="pk-all">{pkg.features.map(x=><li key={x} className={x.startsWith("⚠️")?"warn":x.startsWith("📞")?"plus":undefined}>{clean(x)}</li>)}</ul>
                {pkg.tiers&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:8}}>בחר כמות אורחים:</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,maxHeight:200,overflowY:"auto"}}>
                      {pkg.tiers.map(([label,price])=>(
                        <div key={label} onClick={e=>{e.stopPropagation();setSelectedTier(selectedTier?.[0]===label?null:[label,price]);}}
                          style={{border:`1.5px solid ${selectedTier?.[0]===label?pkg.color:"#E2E8F0"}`,borderRadius:8,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:selectedTier?.[0]===label?pkg.color+"11":"#fff",cursor:"pointer"}}>
                          <span style={{fontSize:12,color:"#666"}}>{label} רשומות</span>
                          <span style={{fontSize:13,fontWeight:800,color:pkg.color}}>₪{price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pkg.waPicker&&(
                  <div style={{marginBottom:14}}>
                    <SmsQuantityPicker value={selectedTier?.[0]||waDefault} color={pkg.color} baseFee={smsBase} unitPrice={WA_RECORD_PRICE} unitWord="רשומות" question="כמה רשומות (אורחים) באירוע?"
                      callOn={!!callOn.auto} onCallOn={v=>setCallOn(c=>({...c,auto:v}))}
                      onChange={q=>setSelectedTier([q,smsTotal(q,smsBase,WA_RECORD_PRICE)])}/>
                  </div>
                )}
                {pkg.smsPicker&&(
                  <div style={{marginBottom:14}}>
                    <SmsQuantityPicker value={selectedTier?.[0]||300} color={pkg.color} baseFee={smsBase} onChange={q=>setSelectedTier([q,smsTotal(q,smsBase)])}
                      callOn={!!callOn.sms} onCallOn={v=>setCallOn(c=>({...c,sms:v}))} callRecords={callRecs} onCallRecords={setCallRecs}/>
                  </div>
                )}
                <button onClick={e=>{e.stopPropagation();handleBuy(pkg);}} disabled={!!pkg.tiers&&!selectedTier} className="pk-buy">
                  {pkg.tiers&&!selectedTier?"בחר כמות רשומות תחילה":SUPPORT_WA?"💬 פנה לרכישה בוואטסאפ":"✉️ פנה לרכישה במייל"}
                  {pkg.waPicker?` - ${fmtShekel(waSum())}`:pkg.smsPicker?` - ${fmtShekel(smsSum())}`:selectedTier&&` - ₪${selectedTier[1].toLocaleString()}`}
                </button>
              </div>
            )}
          </Fragment>);
        })}
      </div>

      <div className="pk-pay">💳 תשלום מאובטח · Apple Pay · Google Pay · Bit · Visa · Mastercard</div>
    </div>
  );
}
// מסך החבילות: ריבועים בשפת העיצוב של מסך הבית
export const PK_CSS=`
.pk{padding:18px 20px 80px}
.pk h1,.pk h3,.pk button,.pk-price,.pk-panel-h{font-family:'Fredoka','Heebo',sans-serif}
.pk-hero{position:relative;overflow:hidden;isolation:isolate;border-radius:32px;padding:28px 30px;margin-bottom:20px;background:linear-gradient(150deg,#EFE4FF 0%,#FFE4F0 55%,#FFE9DC 100%);box-shadow:0 30px 70px -44px rgba(155,107,255,.7)}
.pk-hero h1{margin:0 0 6px;font-size:clamp(24px,2.6vw,32px);font-weight:700;color:#2B1D3F}
.pk-hero h1 span{background:linear-gradient(120deg,#F0609E,#9B6BFF);-webkit-background-clip:text;background-clip:text;color:transparent}
.pk-hero p{margin:0;font-size:15px;line-height:1.65;color:#3A2F50;max-width:60ch;font-weight:600}
.pk-bub{position:absolute;z-index:-1;border-radius:50%;background:rgba(255,255,255,.55)}
.pk-bub.a{width:180px;height:180px;left:-40px;top:-60px}.pk-bub.b{width:90px;height:90px;left:24%;bottom:-36px}
.pk-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;grid-auto-flow:row dense}
.pk-card{position:relative;background:#fff;border-radius:28px;padding:20px 20px 18px;display:flex;flex-direction:column;gap:6px;border:1.5px solid #EADFF6;box-shadow:0 22px 44px -30px rgba(91,60,140,.55);transition:translate 200ms cubic-bezier(0.23,1,0.32,1),box-shadow 200ms cubic-bezier(0.23,1,0.32,1),border-color 200ms ease}
@media(hover:hover) and (pointer:fine){.pk-card:hover{translate:0 -4px;box-shadow:0 28px 52px -30px rgba(91,60,140,.65)}}
.pk-card.on{border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 22%,transparent),0 26px 50px -30px rgba(91,60,140,.6)}
.pk-card.feat{border:2px solid transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF) border-box}
.pk-pop{position:absolute;top:-12px;left:18px;background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF);color:#fff;font:700 12px 'Fredoka','Heebo',sans-serif;border-radius:100px;padding:5px 12px;box-shadow:0 10px 20px -10px rgba(240,96,158,.8)}
.pk-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.pk-ic{width:54px;height:54px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:26px;background:color-mix(in srgb,var(--c) 14%,#fff)}
.pk-badge{font:700 12px 'Fredoka','Heebo',sans-serif;color:color-mix(in srgb,var(--c) 68%,#1A1030);background:color-mix(in srgb,var(--c) 12%,#fff);border-radius:100px;padding:4px 11px}
.pk-card h3{margin:0;font-size:19px;font-weight:700;color:#2B1D3F}
.pk-price{font-size:26px;font-weight:700;color:var(--c);line-height:1.2}
.pk-price small{font-size:13px;color:#5E5470;font-weight:600}
.pk-desc{margin:0;font-size:13.5px;line-height:1.55;color:#3A2F50;font-weight:600}
.pk-feats{list-style:none;margin:6px 0 12px;padding:0;display:grid;gap:6px;flex:1}
.pk-feats li,.pk-all li{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;line-height:1.5;color:#2B1D3F;font-weight:600}
.pk-feats li::before,.pk-all li::before{content:"✓";flex-shrink:0;width:19px;height:19px;border-radius:50%;background:color-mix(in srgb,var(--c) 16%,#fff);color:var(--c);font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;margin-top:1px}
.pk-all li.warn::before{content:"!";background:#FFF4E0;color:#8A5A00}
.pk-all li.plus::before{content:"+"}
.pk-btn{min-height:46px;border:none;border-radius:100px;background:color-mix(in srgb,var(--c) 78%,#1A1030);color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:scale 160ms cubic-bezier(0.23,1,0.32,1),filter 160ms ease}
.pk-card.feat .pk-btn{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)}
.pk-btn:active{scale:.97}.pk-btn:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
.pk-card.on .pk-btn{background:#fff;color:color-mix(in srgb,var(--c) 68%,#1A1030);box-shadow:inset 0 0 0 1.5px var(--c)}
.pk-own{min-height:46px;border-radius:100px;display:flex;align-items:center;justify-content:center;background:#EFFAF3;color:#1F7A4D;font:700 14px 'Fredoka','Heebo',sans-serif}
.pk-panel{grid-column:1/-1;background:#fff;border-radius:28px;padding:22px 24px;border:2px solid var(--c);box-shadow:0 26px 54px -32px rgba(91,60,140,.55);animation:pkIn 260ms cubic-bezier(0.23,1,0.32,1) both}
@keyframes pkIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.pk-panel{animation:none}}
.pk-panel-h{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;color:#2B1D3F;margin-bottom:12px}
.pk-panel-h small{margin-inline-start:auto;font-size:18px;color:var(--c)}
.pk-note{background:#FFFBEB;border:1px solid #FDE68A;border-radius:14px;padding:10px 12px;margin-bottom:12px;font-size:13px;color:#8A5A00;font-weight:700}
.pk-all{list-style:none;margin:0 0 16px;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px 16px}
.pk-buy{width:100%;min-height:50px;border:none;border-radius:100px;background:color-mix(in srgb,var(--c) 78%,#1A1030);color:#fff;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.pk-buy:disabled{background:#E2E8F0;color:#8A8599;cursor:not-allowed}
.pk-pay{margin-top:18px;text-align:center;font-size:13px;color:#5E5470;font-weight:600;background:#F7F2FF;border-radius:100px;padding:10px 16px}
@media(max-width:1100px){.pk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.pk{padding:14px 12px 90px}.pk-hero{padding:22px 20px;border-radius:26px}.pk-grid{grid-template-columns:1fr}.pk-panel{padding:18px 16px}}
`;

// ─── SMS SCREEN ───────────────────────────────────────────────────────────────
// ─── תזמון שליחות (SMS / וואטסאפ) ─────────────────────────────────────────────
// 4 תזמוני ברירת מחדל לפי תאריך האירוע + תזמונים נוספים שהמשתמש מוסיף.
// הכול נשמר באירוע: settings_json.sms_schedule / settings_json.wa_schedule
export const SCHEDULE_DEFAULTS=[
  {id:"d0",offset:-11,label:"שבוע וחצי לפני",desc:"הזמנה ראשונה",time:"10:00",icon:"💌",templateId:"invite"},
  {id:"d1",offset:-4,label:"4 ימים לפני",desc:"תזכורת לממתינים",time:"10:00",icon:"🔔",templateId:"reminder"},
  {id:"d2",offset:0,label:"ביום האירוע",desc:"מספר שולחן",time:"09:00",icon:"🎉",templateId:"table"},
  {id:"d3",offset:2,label:"יומיים אחרי",desc:"הודעת תודה",time:"10:00",icon:"💙",templateId:"thanks"},
];
// SMS בלבד: שליחה אוטומטית ע"י sms-scheduler בשרת (כל 5 דקות). הנמענים לפי הנוסח — כמו recipientsFor בשרת
export const SCHEDULE_TO={invite:"כל האורחים",reminder:"ממתינים לאישור",table:"מגיעים ששובצו לשולחן",thanks:"מגיעים"};
// WhatsApp: הלקוח שילם 4 הודעות לכל רשומה — כולם מקבלים, חוץ מתזכורת (רק מי שלא ענה). מספר שולחן רק למי ששובץ
export const WA_SCHEDULE_TO={invite:"כל האורחים",reminder:"מי שעוד לא אישר",table:"כל האורחים (עם מספר שולחן למי ששובץ)",thanks:"כל האורחים"};
export const SCHEDULE_LATE_HOURS=12;
// defaultOn: תזמוני ברירת המחדל מופעלים כל עוד המשתמש לא שינה אותם (בוואטסאפ: 4 הסבבים שבחבילה)
// lockDefaults: 4 הסבבים תמיד דלוקים (בוואטסאפ הם חלק מהרשומה שנקנתה)  -  בלי מתג כיבוי, אפשר רק לשנות מועד
export function ScheduleEditor({ event, storeKey, templates, accent, onPickTemplate, auto=false, defaultOn=false, lockDefaults=false, langNote="", runsTable="sms_schedule_runs", toMap=SCHEDULE_TO, autoNote="" }) {
  const eventD=event.date?new Date(event.date):null;
  // סטטוס שליחה אוטומטית לכל תזמון
  const [runs,setRuns]=useState({});
  const loadRuns=async()=>{
    if(!auto)return;
    const{data}=await sb.from(runsTable).select("schedule_id,status,recipients,units,error,finished_at,created_at").eq("event_id",event.id);
    setRuns(Object.fromEntries((data||[]).map(r=>[r.schedule_id,r])));
  };
  useEffect(()=>{loadRuns().catch(()=>{});const iv=auto?setInterval(()=>loadRuns().catch(()=>{}),60000):null;return()=>iv&&clearInterval(iv);},[event.id,auto]);
  const autoStatus=s=>{
    const r=runs[s.id];
    const fmt=t=>new Date(t).toLocaleString("he-IL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    const unitW=runsTable==="wa_schedule_runs"?"רשומות":"SMS";
    if(r?.status==="sent")return{c:"#1F7A4D",bg:"#EFFAF3",t:`✓ נשלח אוטומטית ${fmt(r.finished_at||r.created_at)} ל-${r.recipients} אורחים (${r.units} ${unitW})`};
    if(r?.status==="partial")return{c:"#8A5A00",bg:"#FFF8E8",t:`◐ נשלח ל-${r.recipients} אורחים (${r.units} ${unitW}). ${r.error||""}`};
    if(r?.status==="failed")return{c:"#B42318",bg:"#FFF2F4",t:`✗ לא נשלח: ${r.error||"שגיאה"}. אפשר לשלוח ידנית מהמסך הזה.`};
    if(r?.status==="skipped")return{c:"#8A5A00",bg:"#FFF8E8",t:`⏭ דולג: ${r.error||""}`};
    if(r?.status==="sending")return{c:C.blue,bg:"#F4EEFC",t:`⏳ שולח עכשיו…${r.recipients?` (${r.recipients} כבר קיבלו)`:""}`};
    if(!s.enabled)return null;
    const to=toMap[s.templateId]||toMap.invite;
    if(!s.date||!s.time)return{c:"#8A5A00",bg:"#FFF8E8",t:"⚠️ חסר תאריך או שעה — לא יישלח"};
    const due=new Date(`${s.date}T${s.time}:00`);
    if(due>new Date())return{c:C.blue,bg:"#F4EEFC",t:`🤖 יישלח אוטומטית אל: ${to}`};
    if(Date.now()-due<SCHEDULE_LATE_HOURS*3600e3)return{c:C.blue,bg:"#F4EEFC",t:`⏳ יישלח בדקות הקרובות אל: ${to}`};
    return{c:"#8A5A00",bg:"#FFF8E8",t:"⚠️ המועד עבר — לא יישלח אוטומטית. שנה מועד או שלח ידנית."};
  };
  const calcDate=off=>{if(!eventD)return "";const d=new Date(eventD);d.setDate(d.getDate()+off);return d.toISOString().split("T")[0];};
  // כל תזמון נשמר גם כ-off (ימים ביחס לתאריך האירוע): כשתאריך האירוע משתנה, המועדים זזים איתו.
  // השרת (claim_due_sms_schedules) מחשב את המועד מ-off באותה דרך
  const offOf=date=>event.date&&date?Math.round((Date.parse(date)-Date.parse(String(event.date).slice(0,10)))/864e5):null;
  // בלי off: מועד שרחוק יותר מ-90 יום מהאירוע הוא מתאריך ישן (האירוע הוזז)  -  חוזרים להפרש ברירת המחדל
  const dateOf=(s,defOff)=>Number.isInteger(s.off)&&eventD?calcDate(s.off)
    :defOff!=null&&eventD&&(!s.date||Math.abs(offOf(s.date))>90)?calcDate(defOff):s.date;
  // מיזוג: ברירות מחדל + מה שנשמר (שינויי זמן/הפעלה) + תזמונים נוספים
  const build=()=>{
    const saved=event.settings_json?.[storeKey]||[];
    const byId=Object.fromEntries(saved.map(s=>[s.id,s]));
    const base=SCHEDULE_DEFAULTS.map(d=>{const sv=byId[d.id]||{};return {...d,enabled:defaultOn,...sv,date:dateOf(sv,d.offset),...(lockDefaults?{enabled:true}:{})};});
    const extra=saved.filter(s=>s.custom).map(s=>({...s,date:dateOf(s)}));
    return [...base,...extra];
  };
  const [items,setItems]=useState(build);
  const [editing,setEditing]=useState(false);
  const [status,setStatus]=useState(""); // "", "saving", "saved", "error"
  useEffect(()=>{setItems(build());},[event.id,event.date]);

  const persist=async next=>{
    setStatus("saving");
    // שומרים רק את מה שצריך: מזהה, זמן, הפעלה, ולתזמונים נוספים גם תווית ותבנית
    const payload=next.map(s=>s.custom?{id:s.id,custom:true,label:s.label,icon:s.icon,desc:s.desc,templateId:s.templateId,date:s.date,off:offOf(s.date),time:s.time,enabled:s.enabled}
      :{id:s.id,templateId:s.templateId,date:s.date,off:offOf(s.date),time:s.time,enabled:s.enabled});
    const settings={...(event.settings_json||{}),[storeKey]:payload};
    const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
    if(error){setStatus("error");alert("❌ התזמונים לא נשמרו: "+error.message);return false;}
    event.settings_json=settings;
    setStatus("saved");setTimeout(()=>setStatus(s=>s==="saved"?"":s),2200);
    return true;
  };
  const update=(id,patch)=>setItems(arr=>arr.map(s=>s.id===id?{...s,...patch}:s));
  const toggle=id=>{const next=items.map(s=>s.id===id?{...s,enabled:!s.enabled}:s);setItems(next);persist(next);};
  const addCustom=()=>{
    const id="c"+Date.now().toString(36);
    setItems(arr=>[...arr,{id,custom:true,label:"תזמון נוסף",desc:"",icon:"⏰",templateId:templates[0]?.id||"invite",date:calcDate(-7)||"",time:"10:00",enabled:true}]);
    setEditing(true);
  };
  const remove=id=>{const next=items.filter(s=>s.id!==id);setItems(next);persist(next);};
  const save=async()=>{if(await persist(items))setEditing(false);};
  // איפוס זמנים: 4 הסבבים חוזרים למועד ולשעה הרגילים לפי תאריך האירוע (ההפעלה/כיבוי נשארים).
  // תזמון נוסף שהמועד שלו רחוק יותר מ-90 יום מהאירוע (תאריך ישן) עובר לשבוע לפני האירוע
  const resetTimes=async()=>{
    if(!eventD){alert("קודם צריך להגדיר תאריך אירוע בפרטי האירוע");return;}
    if(!window.confirm(`לאפס את זמני השליחה לפי תאריך האירוע (${eventD.toLocaleDateString("he-IL")})?\n\n• שבוע וחצי לפני · 10:00\n• 4 ימים לפני · 10:00\n• ביום האירוע · 09:00\n• יומיים אחרי · 10:00\n\nתזמונים נוספים עם תאריך ישן יעברו לשבוע לפני האירוע.`))return;
    const next=items.map(s=>{
      const d=SCHEDULE_DEFAULTS.find(x=>x.id===s.id);
      if(d)return{...s,date:calcDate(d.offset),time:d.time};
      return !s.date||Math.abs(offOf(s.date))>90?{...s,date:calcDate(-7)}:s;
    });
    setItems(next);if(await persist(next))setEditing(false);
  };
  const inp={width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"7px 8px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff"};

  return(
    <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text}}>⏰ תזמון שליחות</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {status==="saving"&&<span style={{fontSize:12,color:C.muted}}>שומר…</span>}
          {status==="saved"&&<span style={{fontSize:12,color:C.success,fontWeight:800}}>✓ נשמר</span>}
          <button onClick={resetTimes} title="החזרת כל הזמנים למועדים הרגילים לפי תאריך האירוע" className="sx-btn"
            style={{background:"#fff",color:C.blue,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
            ↺ איפוס זמנים
          </button>
          <button onClick={()=>editing?save():setEditing(true)} className="sx-btn"
            style={{background:editing?accent:"#F7F1FD",color:editing?"#fff":C.blue,border:`1px solid ${editing?accent:C.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
            {editing?"💾 שמור תזמונים":"✏️ ערוך תזמונים"}
          </button>
        </div>
      </div>
      <div style={{fontSize:12,color:C.muted,marginTop:-4,marginBottom:10,lineHeight:1.6}}>
        {autoNote||(auto?"🤖 תזמון פעיל נשלח אוטומטית במועד (שעון ישראל), פעם אחת, וכל אורח = 1 מהיתרה. ודאו שיש מספיק יתרה.":"🔔 תזכורת בלבד: הודעות וואטסאפ לא נשלחות אוטומטית, צריך לשלוח אותן מכאן במועד.")}
        {auto&&langNote&&<div style={{marginTop:4,color:"#4A2C8F",fontWeight:700}}>🌍 {langNote}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {items.map(s=>{
          const d=s.date?new Date(s.date+"T00:00:00"):null;
          const disp=d?d.toLocaleDateString("he-IL",{weekday:"short",day:"numeric",month:"short"}):"לא הוגדר";
          const tpl=templates.find(t=>t.id===s.templateId);
          const preview=tpl?tpl.text.replace(/{שם}/g,"[שם האורח]").replace(/{קישור}/g,"[קישור]").replace(/{שולחן}/g,"[מס' שולחן]").substring(0,80)+"…":"";
          return(
            <div key={s.id} style={{border:`1.5px solid ${s.enabled?C.border:"#E9E4EF"}`,borderRadius:12,padding:"9px 12px",background:s.enabled?"#FCFAFE":"#F6F4F8"}}>{/* כבוי: רקע אפור והמתג — בלי שקיפות, כדי שהטקסט יישאר קריא */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:s.enabled?6:0}}>
                <span style={{fontSize:18}}>{s.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  {editing&&s.custom
                    ?<input value={s.label} onChange={e=>update(s.id,{label:e.target.value})} style={{...inp,padding:"4px 8px",fontWeight:800}} placeholder="שם התזמון"/>
                    :<div style={{fontSize:12,fontWeight:800,color:C.text}}>{s.label}</div>}
                  {s.desc&&<div style={{fontSize:12,color:C.muted}}>{s.desc}</div>}
                </div>
                {!editing&&s.enabled&&<div style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{disp} · {s.time}</div>}
                {editing&&s.custom&&<button onClick={()=>remove(s.id)} title="מחיקת תזמון" style={{background:"#FFF2F4",border:"1px solid #F4C7CD",color:C.danger,borderRadius:8,padding:"3px 8px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>מחק</button>}
                {lockDefaults&&!s.custom
                  ?<span style={{fontSize:12,fontWeight:800,color:"#fff",background:accent,borderRadius:100,padding:"3px 9px",whiteSpace:"nowrap"}}>✓ דלוק</span>
                  :<div role="switch" aria-checked={s.enabled} aria-label={`הפעלת ${s.label||"התזמון"}`} tabIndex={0} onClick={()=>toggle(s.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle(s.id);}}}
                  style={{width:38,height:22,borderRadius:11,background:s.enabled?accent:"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,left:s.enabled?18:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                </div>}
              </div>
              {s.enabled&&<>
                <div style={{background:"#F4EEFC",borderRadius:8,padding:"6px 10px",fontSize:12,color:"#4A3D66",lineHeight:1.5,marginBottom:editing?8:0}}>
                  📝 {preview}
                  {onPickTemplate&&<button onClick={()=>onPickTemplate(s.templateId)} style={{display:"inline-block",marginRight:6,background:"#fff",color:"#3A2464",border:"1px solid #D9C8EE",borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>ערוך נוסח</button>}
                </div>
                {auto&&!editing&&(()=>{const st=autoStatus(s);return st&&<div style={{marginTop:6,background:st.bg,color:st.c,borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:700,lineHeight:1.5}}>{st.t}</div>;})()}
                {editing&&<div style={{display:"grid",gridTemplateColumns:s.custom?"1fr 1fr 1fr":"1fr 1fr",gap:8,marginTop:4}}>
                  {s.custom&&<div><div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:3}}>הודעה</div>
                    <select value={s.templateId} onChange={e=>update(s.id,{templateId:e.target.value})} style={inp}>
                      {templates.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                    </select></div>}
                  <div><div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:3}}>תאריך</div><DateField compact value={s.date||""} onChange={v=>update(s.id,{date:v})} style={inp}/></div>
                  <div><div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:3}}>שעה</div><input type="time" dir="ltr" value={s.time||""} onChange={e=>update(s.id,{time:e.target.value})} style={inp}/></div>
                </div>}
              </>}
            </div>
          );
        })}
        {editing&&<button onClick={addCustom} className="sx-btn" style={{background:"#fff",border:`1.5px dashed ${accent}`,color:C.blue,borderRadius:10,padding:"9px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>+ הוסף תזמון נוסף</button>}
        {editing&&<button onClick={save} className="sx-btn sx-btn-primary" style={{background:GRAD,color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>💾 שמור תזמונים</button>}
        {!eventD&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"7px 10px",fontSize:12,color:"#B45309"}}>⚠️ הגדר תאריך אירוע בפרטי האירוע כדי לחשב תאריכים אוטומטית</div>}
      </div>
    </div>
  );
}

// ─── שפות וטונים להודעות (SMS / וואטסאפ) ───
// שפת כל אורח נשמרת בעמודה guests.lang (ותמיכה לאחור ב-settings_json.guest_langs) — ברירת מחדל עברית
export const MSG_LANGS=[["he","עברית","🇮🇱"],["en","English","🇺🇸"],["ru","Русский","🇷🇺"],["uk","Українська","🇺🇦"],["ar","العربية","🇸🇦"],["am","አማርኛ","🇪🇹"]];
export const MSG_TONES=[["classic","קלאסי ומרגש"],["warm","חם ואישי"],["fun","שמח וקליל"]];
export const MSG_LOCALE={he:"he-IL",en:"en-US",ru:"ru-RU",uk:"uk-UA",ar:"ar-u-nu-latn",am:"am-ET"};
export const guestLangOf=(event,g)=>{const ok=l=>MSG_LANGS.some(x=>x[0]===l);if(g?.lang&&ok(g.lang))return g.lang;const l=event?.settings_json?.guest_langs?.[g?.id];return ok(l)?l:"he";};
// שם האירוע בתוך משפט, לפי סוג האירוע והשפה
export const MSG_EVENT={
  en:{wedding:"the wedding of {H}",bar_mitzvah:"the Bar/Bat Mitzvah of {G}",brit:"the Brit of {G}",other:"our celebration"},
  ru:{wedding:"свадьба {H}",bar_mitzvah:"бар/бат-мицва {G}",brit:"брит-мила {G}",other:"наш праздник"},
  uk:{wedding:"весілля {H}",bar_mitzvah:"бар/бат-міцва {G}",brit:"бріт-міла {G}",other:"наше свято"},
  ar:{wedding:"حفل زفاف {H}",bar_mitzvah:"بار/بات متسفا {G}",brit:"حفل بريت {G}",other:"مناسبتنا"},
  am:{wedding:"የ{H} ሠርግ",bar_mitzvah:"የ{G} ባር/ባት ሚትስቫ",brit:"የ{G} ብሪት",other:"ዝግጅታችን"},
};
export const MSG_TEXTS={
  he:{
    invite:{warm:"היי {שם} 💛\nנשמח כל כך שתהיו איתנו ב{E}.\n📅 {D} · 📍 {V}\nספרו לנו אם מגיעים: {קישור}",fun:"{שם}, יש חגיגה! 🎉\n{E} בדרך ואתם חייבים להיות שם!\n📅 {D} · 📍 {V}\nלחצו לאישור: {קישור}"},
    reminder:{warm:"היי {שם} 💛 רק מוודאים, תהיו איתנו ב{E}?\nלאישור הגעה: {קישור}",fun:"{שם}, אל תשאירו אותנו במתח 😄 מגיעים ל{E}?\n{קישור}"},
    table:{warm:"היי {שם} 💛 שמרנו לכם מקום בשולחן {שולחן}. מחכים לכם ב{E}!",fun:"{שם}, השולחן שלכם מוכן: {שולחן} 🪑🎉 נתראה ברחבה!"},
    thanks:{warm:"{שם}, תודה מכל הלב שהייתם איתנו 💛 זה היה לנו חשוב מאוד. באהבה, {H}",fun:"{שם}, איזה ערב! 🎉 תודה שחגגתם איתנו! {H}"},
  },
  en:{
    invite:{classic:"Dear {שם}, with great joy we invite you to {E}! {X}\n📅 {D}\n📍 {V}\nRSVP: {קישור}",warm:"Hi {שם} 💛 We'd love for you to celebrate {E} with us.\n📅 {D} · 📍 {V}\nLet us know you're coming: {קישור}",fun:"{שם}, party time! 🎉 {E} is coming up!\n📅 {D} · 📍 {V}\nTap to RSVP: {קישור}"},
    reminder:{classic:"Dear {שם}, we have not yet received your RSVP for {E}.\nPlease let us know: {קישור}",warm:"Hi {שם} 💛 Just checking in. Will you join us at {E}?\nRSVP here: {קישור}",fun:"{שם}, don't leave us guessing 😄 Are you coming to {E}?\n{קישור}"},
    table:{classic:"Dear {שם}, we look forward to seeing you at {E}.\nYour table: {שולחן}\n📍 {V}",warm:"Hi {שם} 💛 We saved you a seat at table {שולחן}. See you soon at {E}!",fun:"{שם}, your table is ready: {שולחן} 🪑🎉 See you on the dance floor!"},
    thanks:{classic:"Dear {שם}, thank you for celebrating {E} with us. {H} {X}",warm:"{שם}, thank you so much for being with us 💛 It meant the world to us. With love, {H}",fun:"{שם}, what a night! 🎉 Thanks for celebrating with us! {H}"},
  },
  ru:{
    invite:{classic:"Дорогой(ая) {שם}, с радостью приглашаем вас: {E}! {X}\n📅 {D}\n📍 {V}\nПодтвердите участие: {קישור}",warm:"{שם}, привет 💛 Будем счастливы видеть вас: {E}.\n📅 {D} · 📍 {V}\nОтветьте здесь: {קישור}",fun:"{שם}, праздник! 🎉 {E}!\n📅 {D} · 📍 {V}\nНажмите, чтобы ответить: {קישור}"},
    reminder:{classic:"Дорогой(ая) {שם}, мы ещё не получили ваш ответ ({E}).\nПожалуйста, подтвердите: {קישור}",warm:"{שם}, привет 💛 Вы будете с нами? ({E})\nОтветьте здесь: {קישור}",fun:"{שם}, ждём ответа 😄 Придёте? ({E})\n{קישור}"},
    table:{classic:"Дорогой(ая) {שם}, ждём вас! ({E})\nВаш стол: {שולחן}\n📍 {V}",warm:"{שם}, для вас готово место за столом {שולחן} 💛 До встречи!",fun:"{שם}, ваш стол: {שולחן} 🪑🎉 До встречи на танцполе!"},
    thanks:{classic:"Дорогой(ая) {שם}, спасибо, что разделили с нами этот праздник. {H} {X}",warm:"{שם}, огромное спасибо, что были с нами 💛 С любовью, {H}",fun:"{שם}, это был отличный вечер! 🎉 Спасибо! {H}"},
  },
  uk:{
    invite:{classic:"Дорогий(а) {שם}, з радістю запрошуємо вас: {E}! {X}\n📅 {D}\n📍 {V}\nПідтвердіть участь: {קישור}",warm:"{שם}, привіт 💛 Будемо щасливі бачити вас: {E}.\n📅 {D} · 📍 {V}\nВідповідайте тут: {קישור}",fun:"{שם}, свято! 🎉 {E}!\n📅 {D} · 📍 {V}\nНатисніть, щоб відповісти: {קישור}"},
    reminder:{classic:"Дорогий(а) {שם}, ми ще не отримали вашої відповіді ({E}).\nБудь ласка, підтвердіть: {קישור}",warm:"{שם}, привіт 💛 Ви будете з нами? ({E})\nВідповідайте тут: {קישור}",fun:"{שם}, чекаємо на відповідь 😄 Прийдете? ({E})\n{קישור}"},
    table:{classic:"Дорогий(а) {שם}, чекаємо на вас! ({E})\nВаш стіл: {שולחן}\n📍 {V}",warm:"{שם}, для вас готове місце за столом {שולחן} 💛 До зустрічі!",fun:"{שם}, ваш стіл: {שולחן} 🪑🎉 До зустрічі на танцполі!"},
    thanks:{classic:"Дорогий(а) {שם}, дякуємо, що розділили з нами це свято. {H} {X}",warm:"{שם}, щиро дякуємо, що були з нами 💛 З любов'ю, {H}",fun:"{שם}, це був чудовий вечір! 🎉 Дякуємо! {H}"},
  },
  ar:{
    invite:{classic:"عزيزي/عزيزتي {שם}، يسعدنا دعوتكم إلى {E}! {X}\n📅 {D}\n📍 {V}\nلتأكيد الحضور: {קישור}",warm:"مرحبًا {שם} 💛 يسعدنا جدًا أن تشاركونا {E}.\n📅 {D} · 📍 {V}\nأخبرونا هنا: {קישור}",fun:"{שם}، حان وقت الفرح! 🎉 {E}!\n📅 {D} · 📍 {V}\nاضغطوا للرد: {קישור}"},
    reminder:{classic:"عزيزي/عزيزتي {שם}، لم نتلقَّ تأكيد حضوركم بعد إلى {E}.\nيرجى التأكيد: {קישור}",warm:"مرحبًا {שם} 💛 هل ستكونون معنا في {E}؟\nأخبرونا هنا: {קישור}",fun:"{שם}، ننتظر ردكم 😄 هل ستأتون إلى {E}؟\n{קישור}"},
    table:{classic:"عزيزي/عزيزتي {שם}، بانتظاركم في {E}.\nطاولتكم: {שולחן}\n📍 {V}",warm:"{שם}، حجزنا لكم مكانًا على الطاولة {שולחן} 💛 نراكم قريبًا!",fun:"{שם}، طاولتكم جاهزة: {שולחן} 🪑🎉 نراكم على حلبة الرقص!"},
    thanks:{classic:"عزيزي/عزيزتي {שם}، شكرًا لمشاركتكم فرحتنا. {H} {X}",warm:"{שם}، شكرًا جزيلًا لوجودكم معنا 💛 مع المحبة، {H}",fun:"{שם}، كانت ليلة رائعة! 🎉 شكرًا لكم! {H}"},
  },
  am:{
    invite:{classic:"ውድ {שם}፣ ወደ {E} በደስታ እንጋብዝዎታለን! {X}\n📅 {D}\n📍 {V}\nመገኘትዎን ያረጋግጡ፦ {קישור}",warm:"ሰላም {שם} 💛 {E} ላይ ከእኛ ጋር ቢሆኑ በጣም ደስ ይለናል።\n📅 {D} · 📍 {V}\nእዚህ ይመልሱ፦ {קישור}",fun:"{שם}፣ የደስታ ጊዜ ነው! 🎉 {E}!\n📅 {D} · 📍 {V}\nለመመለስ ይጫኑ፦ {קישור}"},
    reminder:{classic:"ውድ {שם}፣ ለ{E} የመገኘት ማረጋገጫዎ ገና አልደረሰንም።\nእባክዎ ያረጋግጡ፦ {קישור}",warm:"ሰላም {שם} 💛 {E} ላይ ከእኛ ጋር ይሆናሉ?\nእዚህ ይመልሱ፦ {קישור}",fun:"{שם}፣ መልስዎን እየጠበቅን ነው 😄 ወደ {E} ይመጣሉ?\n{קישור}"},
    table:{classic:"ውድ {שם}፣ {E} ላይ እንጠብቅዎታለን።\nጠረጴዛዎ፦ {שולחן}\n📍 {V}",warm:"{שם}፣ በጠረጴዛ {שולחן} ቦታ ያዝንልዎ 💛 በቅርቡ እንገናኝ!",fun:"{שם}፣ ጠረጴዛዎ ዝግጁ ነው፦ {שולחן} 🪑🎉 በዳንስ እንገናኝ!"},
    thanks:{classic:"ውድ {שם}፣ ደስታችንን ስላካፈሉን እናመሰግናለን። {H} {X}",warm:"{שם}፣ ከእኛ ጋር ስለነበሩ በጣም እናመሰግናለን 💛 በፍቅር፣ {H}",fun:"{שם}፣ ድንቅ ምሽት ነበር! 🎉 እናመሰግናለን! {H}"},
  },
};
// בונה את הנוסח לסוג הודעה, טון ושפה. heClassic = הנוסח העברי הקלאסי של המסך (כולל נוסח אישי שנשמר)
export const buildMsgText=(event,type,tone,lang,heClassic)=>{
  if(lang==="he"&&tone==="classic")return heClassic;
  const ew=eventWords(event),k=EVENT_KINDS[event?.event_type]?event.event_type:"wedding";
  const g=String(event?.groom_name||"").trim(),b=String(event?.bride_name||"").trim();
  const hosts=k==="wedding"?(g&&b?`${g} & ${b}`:g||b||ew.hosts):(ew.hosts||g);
  const evName=lang==="he"?ew.name:(MSG_EVENT[lang]?.[k]||MSG_EVENT[lang]?.other||"").replace("{H}",hosts).replace("{G}",g||hosts);
  const d=event?.date?new Date(event.date):null;
  let dateStr="";try{dateStr=d&&!isNaN(d)?d.toLocaleDateString(MSG_LOCALE[lang]||"he-IL",{weekday:"long",day:"numeric",month:"long"}):"";}catch{dateStr=d?d.toLocaleDateString():"";}
  const tpl=MSG_TEXTS[lang]?.[type]?.[tone]||MSG_TEXTS.en[type]?.[tone]||heClassic;
  let t=tpl.replace(/\{E\}/g,evName).replace(/\{H\}/g,hosts).replace(/\{X\}/g,ew.emoji).replace(/\{D\}/g,dateStr).replace(/\{V\}/g,event?.venue||"");
  t=t.replace(/ · 📍 \n/g,"\n").replace(/\n📍 $/,"").replace(/📅  · /,"");
  const gl=giftLink(event);
  if(gl&&(type==="invite"||type==="table")&&!t.includes(gl))t+=`\n💝 ${gl}`;
  return t;
};
// שורת בחירת טון ושפות התצוגה/העריכה (משותף ל-SMS ולוואטסאפ)
export function MsgToneLangBar({ tone, onTone, langs, activeLang, onLang, accent="#F0609E" }) {
  return(
    <div style={{display:"grid",gap:10,marginBottom:12}}>
      <div role="radiogroup" aria-label="טון ההודעה" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {MSG_TONES.map(([v,l])=>(
          <button key={v} type="button" role="radio" aria-checked={tone===v} onClick={()=>onTone(v)}
            style={{border:"none",borderRadius:100,padding:"8px 14px",fontSize:14,fontWeight:700,cursor:"pointer",background:tone===v?accent:"#fff",color:tone===v?"#fff":"#3E3555",boxShadow:tone===v?"none":"inset 0 0 0 1.5px #E6DDF5"}}>
            {v==="classic"?"✨":v==="warm"?"💛":"🎉"} {l}
          </button>))}
      </div>
      {langs.length>1&&<div role="tablist" aria-label="שפת הנוסח" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {langs.map(([code,n])=>{const L=MSG_LANGS.find(x=>x[0]===code);return(
          <button key={code} type="button" role="tab" aria-selected={activeLang===code} onClick={()=>onLang(code)}
            style={{border:"none",borderRadius:100,padding:"6px 12px",fontSize:13,fontWeight:700,cursor:"pointer",background:activeLang===code?"#F6F0FF":"transparent",color:"#4A2C8F",boxShadow:activeLang===code?"inset 0 0 0 1.5px #C9B6F2":"none"}}>
            {L[2]} {L[1]} <span style={{opacity:.75}}>({n})</span>
          </button>);})}
      </div>}
    </div>
  );
}

// בחירת נמענים (SMS / וואטסאפ): ברירת מחדל  -  אף קבוצה לא מסומנת. נשלח רק למה שמסומן
export const RECIPIENT_GROUPS=[
  {v:"all",      l:"כולם",      c:"#2B6CB0", match:()=>true},
  {v:"pending",  l:"ממתינים",   c:"#5A6578", match:g=>g.rsvp!=="confirmed"&&g.rsvp!=="declined"},
  {v:"confirmed",l:"מגיעים",    c:"#276749", match:g=>g.rsvp==="confirmed"},
  {v:"declined", l:"לא מגיעים", c:"#C53030", match:g=>g.rsvp==="declined"},
];
// tid: נוסח התזכורת נשלח רק לממתינים, גם אם סומנו "כולם"/"מגיעים" (כמו recipientsFor בשרת)
// אחרי שליחה מוצלחת של הזמנה / תזכורת: מסמנים אצל האורחים מה נשלח (guests.last_msg) לסטטוס באישורי הגעה
export const markSent=async(ids,tid)=>{
  if(!ids.length||(tid!=="invite"&&tid!=="reminder"))return;
  await sb.from("guests").update({last_msg:tid,last_msg_at:new Date().toISOString()}).in("id",ids).then(()=>{},()=>{});
};
// מצב ההגעה לתצוגה: תשובה, ואם אין — מה נשלח אחרון
export const rsvpStage=g=>g.rsvp==="confirmed"?{t:"✓ מגיע",c:"#276749",bg:"#F0FFF4",b:"#9AE6B4"}
  :g.rsvp==="declined"?{t:"✗ לא מגיע",c:"#C53030",bg:"#FFF5F5",b:"#FEB2B2"}
  :g.last_msg==="reminder"?{t:"🔔 תזכורת",c:"#B45309",bg:"#FFF8E8",b:"#F5DDA6"}
  :g.last_msg==="invite"?{t:"💌 הזמנה ראשונה",c:"#2B6CB0",bg:"#EBF8FF",b:"#BEE3F8"}
  :{t:"לא הופצה",c:"#525A66",bg:"#F2F4F7",b:"#CBD5E0"};
// 4 שלבים לבחירה באישורי הגעה: הזמנה ראשונה → תזכורת → מגיע / לא מגיע.
// "הזמנה" ו"תזכורת" = עוד לא ענה (rsvp pending) + מה נשלח אחרון (last_msg); כך יודעים באיזה שלב האורח לא אישר
export const RSVP_STAGES=[["invite","💌 הזמנה ראשונה"],["reminder","🔔 תזכורת"],["confirmed","✓ מגיע"],["declined","✗ לא מגיע"]];
export const stageOf=g=>g.rsvp==="confirmed"||g.rsvp==="declined"?g.rsvp:g.last_msg==="reminder"||g.last_msg==="invite"?g.last_msg:"";
export const stagePatch=v=>v==="confirmed"||v==="declined"?{rsvp:v}:{rsvp:"pending",last_msg:v,last_msg_at:new Date().toISOString()};
export const pickRecipients=(withPhone,sel,tid)=>{
  const groups=RECIPIENT_GROUPS.filter(f=>sel.includes(f.v));
  const list=groups.length?withPhone.filter(g=>groups.some(f=>f.match(g))):[];
  return tid==="reminder"?list.filter(RECIPIENT_GROUPS[1].match):list;
};
// נוסח שהמשתמש שמר לכל סבב: settings_json.sms_texts / wa_texts ({invite:"...",reminder:"..."}).
// השמור מחליף את ברירת המחדל במסך ובשליחה האוטומטית (sms-scheduler קורא את sms_texts)
export const useSavedTexts=(event,storeKey,base)=>{
  const [saved,setSaved]=useState(event.settings_json?.[storeKey]||{});
  useEffect(()=>{setSaved(event.settings_json?.[storeKey]||{});},[event.id]);
  const templates=base.map(t=>({...t,def:t.text,custom:!!saved[t.id]?.trim(),text:saved[t.id]?.trim()||t.text}));
  const save=async(id,text)=>{
    const next={...saved};
    if(text.trim()&&text.trim()!==base.find(t=>t.id===id)?.text.trim())next[id]=text;else delete next[id];
    const settings={...(event.settings_json||{}),[storeKey]:next};
    const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
    if(error){alert("❌ הנוסח לא נשמר: "+error.message);return false;}
    event.settings_json=settings;setSaved(next);return true;
  };
  return [templates,save];
};
// כפתורי שמירה/איפוס מתחת לתיבת הנוסח
export function TemplateTextBar({ tpl, text, onSave, onReset, accent, autoNote }) {
  const [st,setSt]=useState("");
  if(!tpl)return null;
  const dirty=text!==tpl.text;
  const b={border:"none",borderRadius:9,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"};
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginTop:8}}>
      <button disabled={!dirty||st==="saving"} onClick={async()=>{setSt("saving");setSt(await onSave(text)?"saved":"");setTimeout(()=>setSt(s=>s==="saved"?"":s),2200);}}
        className="sx-btn" style={{...b,background:dirty?accent:"#E9E4EF",color:dirty?"#fff":"#4A4060",cursor:dirty?"pointer":"default"}}>
        {st==="saving"?"שומר…":`💾 שמירת הנוסח ל"${tpl.label.replace(/^\S+\s/,"")}"`}
      </button>
      {(tpl.custom||dirty)&&<button onClick={onReset} style={{...b,background:"#F7F1FD",color:C.blue}}>↺ נוסח מקורי</button>}
      {st==="saved"&&<span style={{fontSize:12,color:C.success,fontWeight:800}}>✓ נשמר{autoNote?" · ישמש גם בשליחה האוטומטית":""}</span>}
      {!st&&dirty&&<span style={{fontSize:12,color:"#8A5A00"}}>יש שינויים שלא נשמרו</span>}
      {!st&&!dirty&&tpl.custom&&<span style={{fontSize:12,color:C.muted}}>✏️ נוסח אישי שלך</span>}
    </div>
  );
}
// "כולם" מחליף את כל השאר; קבוצה ספציפית מבטלת את "כולם"
export const toggleRecipient=(sel,v)=>sel.includes(v)?sel.filter(x=>x!==v):v==="all"?["all"]:[...sel.filter(x=>x!=="all"),v];
export function RecipientPicker({ withPhone, value, onChange }) {
  return(
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {RECIPIENT_GROUPS.map(f=>{
        const on=value.includes(f.v);
        return(
          <button key={f.v} onClick={()=>onChange(toggleRecipient(value,f.v))} aria-pressed={on}
            style={{background:on?f.c:"#fff",color:on?"#fff":f.c,
              border:`2px solid ${f.c}`,borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
            {on?"✓ ":""}{f.l} ({withPhone.filter(f.match).length})
          </button>
        );
      })}
    </div>
  );
}

export function SMSScreen({ event, guests, tables=[], userPackages=[] }) {
  // הודעות נקנות בנפרד, בלי החבילה הבסיסית (היא פותחת רק הושבה מעל FREE_SEATING_LIMIT מוזמנים)
  const baseOwned=hasBasicPkg(userPackages);
  const baseOn=false, setBaseOn=()=>{};
  const smsBase=0;
  const ew=eventWords(event);
  const groomName = String(event.groom_name||"").trim();
  const brideName = String(event.bride_name||"").trim();

  const eventDateObj = event.date ? new Date(event.date) : null;
  const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const eventDate = eventDateObj
    ? `יום ${days[eventDateObj.getDay()]}, ${eventDateObj.toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}`
    : "בקרוב";

  const inviteUrl = `${window.location.origin}/#/invite/${event.invite_code||""}`;

  // טקסט לפי סוג האירוע (eventWords) + קישור מתנה אם הוגדר Bit/PayBox
  const eventEmoji=ew.emoji, eventName=ew.name, coupleRef=ew.hosts;
  const gift=giftLine(event), giftAdd=t=>gift&&!t.includes(giftLink(event))?`${t}\n${gift}`:t;

  const defaultSmsInviteText=`שלום {שם}! 💌\nמוזמנים ל${eventName}! ${eventEmoji}\nנשמח לראותך ביום המיוחד.\n📅 ${eventDate}\n📍 ${event.venue||"יפורסם בקרוב"}\nלאישור הגעה: {קישור}`;
  const smsInviteText=giftAdd(event.welcome_text?.trim()||defaultSmsInviteText);

  const BASE_TEMPLATES = [
    {
      id:"invite",
      label:"💌 הזמנה לאירוע",
      text:smsInviteText,
    },
    {
      id:"reminder",
      label:"🔔 תזכורת לממתינים",
      text:`שלום {שם}! עוד לא אישרת הגעה ל${eventName}.\nנשמח לדעת אם תגיע 🙏\nלאישור הגעה: {קישור}`,
    },
    {
      id:"table",
      label:"🪑 מספר שולחן",
      text:giftAdd(`שלום {שם}! מחכים לך ב${eventName}! 🎊\nהשולחן שלך: מספר {שולחן}\n📅 ${eventDate}\n📍 ${event.venue||""}`),
    },
    {
      id:"thanks",
      label:"💙 תודה אחרי האירוע",
      text:`שלום {שם}! תודה רבה שהגעת ל${eventName}! 💙\nשמחנו לחגוג איתך.\nבאהבה, ${coupleRef} ${eventEmoji}`,
    },
  ];
  const [TEMPLATES,saveText]=useSavedTexts(event,"sms_texts",BASE_TEMPLATES);

  const [selectedTemplate,setSelectedTemplate]=useState(TEMPLATES[0].id);
  const [msgText,setMsgText]=useState(TEMPLATES[0].text);
  const [sendTo,setSendTo]=useState([]);
  const [sending,setSending]=useState(false);
  const [progress,setProgress]=useState(0);
  const [results,setResults]=useState(null);
  const [previewGuest,setPreviewGuest]=useState(null);
  const [smsBalance,setSmsBalance]=useState(null);
  // טון + שפה: לכל אורח הנוסח בשפה שלו (guests.lang), ברירת מחדל עברית
  const [tone,setTone]=useState("classic"),[activeLang,setActiveLang]=useState("he"),[langEdits,setLangEdits]=useState({});
  const heClassicOf=id=>TEMPLATES.find(t=>t.id===id)?.text||"";
  const textFor=lang=>lang==="he"?msgText:(langEdits[lang]??((tone==="classic"&&langTextOf(lang,selectedTemplate))||buildMsgText(event,selectedTemplate,tone,lang,heClassicOf(selectedTemplate))));
  const chooseTone=v=>{setTone(v);setLangEdits({});setMsgText(buildMsgText(event,selectedTemplate,v,"he",heClassicOf(selectedTemplate)));};


  useEffect(()=>{
    if(guests.length>0&&!previewGuest)setPreviewGuest(guests[0]);
  },[guests]);

  // כשנוסח ההזמנה משתנה בפרטי האירוע  -  עדכן את ה-template
  useEffect(()=>{
    if(selectedTemplate==="invite"){
      setMsgText(TEMPLATES[0].text);
    }
  },[event.welcome_text]);

  // טעינת יתרת SMS ובקשות רכישה ממתינות
  const [pendingReq,setPendingReq]=useState([]);
  const [buyPack,setBuyPack]=useState(null); // חבילה שנבחרה  -  מציג הוראות תשלום
  const loadBalance=async()=>{
    const [{data},{data:reqs}]=await Promise.all([
      sb.from("sms_balance").select("balance").eq("event_id",event.id).maybeSingle(),
      sb.from("sms_requests").select("id,amount,price,status,created_at").eq("event_id",event.id).eq("status","pending").order("created_at",{ascending:false}),
    ]);
    setSmsBalance(data?.balance??0);setPendingReq(reqs||[]);
  };
  useEffect(()=>{
    loadBalance().catch(()=>setSmsBalance(0));
    // שליחה אוטומטית מתזמון מורידה מהיתרה בשרת — מרעננים כשחוזרים לחלון
    const refresh=()=>{if(document.visibilityState==="visible")loadBalance().catch(()=>{});};
    window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
    return()=>{window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[event.id]);

  const withPhone=guests.filter(g=>g.phone&&g.phone.trim().length>6);
  const toSend=pickRecipients(withPhone,sendTo,selectedTemplate);
  const langsUsed=Object.entries(withPhone.reduce((m,g)=>{const l=guestLangOf(event,g);m[l]=(m[l]||0)+1;return m;},{he:0})).sort((a,b)=>a[0]==="he"?-1:b[0]==="he"?1:b[1]-a[1]);
  const byLang=list=>Object.entries(list.reduce((m,g)=>{const l=guestLangOf(event,g);(m[l]||=[]).push(g);return m;},{}));

  const tableOf=id=>{const t=tables.find(t=>t.id===id);return t?tableLabel(event.settings_json?.table_nums?.[id],t.name):"—";};

  // נוסחים בשפות האורחים לשליחה האוטומטית. נשמר רק כשמשהו השתנה
  const [langSaved,setLangSaved]=useState(()=>event.settings_json?.sms_texts_lang||{});
  const otherLangs=langsUsed.filter(([l,n])=>l!=="he"&&n>0).map(([l])=>l).join(",");
  useEffect(()=>{
    const want={};
    otherLangs.split(",").filter(Boolean).forEach(l=>{want[l]={};TEMPLATES.forEach(t=>{want[l][t.id]=buildMsgText(event,t.id,"classic",l,t.text);});});
    const cur=event.settings_json?.sms_texts_i18n||{};
    if(JSON.stringify(cur)===JSON.stringify(want))return;
    const settings={...(event.settings_json||{}),sms_texts_i18n:want};
    sb.from("events").update({settings_json:settings}).eq("id",event.id).then(({error})=>{if(!error)event.settings_json=settings;},()=>{});
  },[event.id,otherLangs,event.date,event.venue,event.event_type,event.groom_name,event.bride_name]);
  const langTextOf=(lang,tid)=>String(langSaved?.[lang]?.[tid]||"").trim();
  const saveLangText=async(lang,tid,text)=>{
    const next={...langSaved,[lang]:{...(langSaved[lang]||{})}};
    if(text.trim())next[lang][tid]=text;else delete next[lang][tid];
    const settings={...(event.settings_json||{}),sms_texts_lang:next};
    const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
    if(error){alert("❌ הנוסח לא נשמר: "+error.message);return false;}
    event.settings_json=settings;setLangSaved(next);return true;
  };

  // אותה החלפה כמו בשרת השליחה (קישור קצר אישי)
  const buildPreview=(g)=>{
    if(!g)return msgText;
    return textFor(guestLangOf(event,g))
      .replace(/{שם}/g,g.name.split(" ")[0])
      .replace(/{שם מלא}/g,g.name)
      .replace(/{קישור}/g,`${SHORT_LINK_HOST}${g.short_code||"xxxxxxx"}`)
      .replace(/{שולחן}/g,tableOf(g.table_id));
  };

  // האורך נבדק על ההודעה האישית הארוכה ביותר (שם ושולחן משתנים בין אורחים)
  const lenGuests=toSend.length?toSend:withPhone;
  const longest=lenGuests.reduce((m,g)=>{const t=buildPreview(g);return t.length>m.len?{len:t.length,name:g.name}:m;},{len:buildPreview(previewGuest).length,name:previewGuest?.name||""});
  const tooLong=longest.len>SMS_MAX;
  // כל אורח = הודעה אחת מהיתרה
  const totalSmsNeeded=toSend.length;
  const hasBalance=smsBalance===null||smsBalance>=totalSmsNeeded;

  // רכישה: נוצרת בקשה; היתרה נטענת אחרי שהתשלום מאושר באדמין
  const [buyQty,setBuyQty]=useState(300);
  // טופס הרכישה: null = לפי היתרה (פתוח רק כשהיא 0), אחרת מה שהמשתמש בחר
  const [showBuy,setShowBuy]=useState(null);
  const buyOpen=showBuy??smsBalance===0;
  // תוספת מוקד מתקשר לרכישת SMS
  const [buyCall,setBuyCall]=useState(false), [buyCallRecs,setBuyCallRecs]=useState(Math.max(1,guests.length||100));
  const buySum=pickerTotal({value:buyQty,baseFee:smsBase,callOn:buyCall,callRecords:buyCallRecs});
  const buyPackage=(amount,price)=>setBuyPack({amount,price});
  const confirmPurchase=async()=>{
    const{amount,price}=buyPack;
    const{error}=await sb.rpc("request_sms",{p_event:event.id,p_amount:amount,p_price:price});
    if(error){alert("❌ לא הצלחנו לשלוח את הבקשה: "+error.message);return;}
    const msg=`היי! אני רוצה לרכוש ${amount} הודעות SMS${buyCall?` + מוקד מתקשר ל-${buyCallRecs} רשומות`:""}${smsBase?` + החבילה הבסיסית`:""} ב-${fmtShekel(Number(price))} לאירוע "${event.name}".`;
    openContact(msg,"בקשת רכישה ב-Sidor-IL");
    setBuyPack(null);await loadBalance();
  };

  const pickTemplate=(t)=>{setSelectedTemplate(t.id);setLangEdits({});setMsgText(buildMsgText(event,t.id,tone,"he",t.text));};

  const sendAll=async()=>{
    if(toSend.length===0){alert(sendTo.length?"אין אורחים עם מספר טלפון בקבוצה שנבחרה":"בחר למי לשלוח");return;}
    if(tooLong){alert(`ההודעה ארוכה מ-${SMS_MAX} תווים (${longest.len} אצל ${longest.name}). קצר את הנוסח.`);return;}
    if(smsBalance!==null&&smsBalance<totalSmsNeeded){
      alert(`אין מספיק SMS!\nנדרש: ${totalSmsNeeded} | יתרה: ${smsBalance}\nאפשר לקנות עוד בכפתור "קניית הודעות" למעלה.`);return;
    }
    if(!window.confirm(`לשלוח SMS ל-${toSend.length} אורחים? (${totalSmsNeeded} SMS)`))return;
    setSending(true);setProgress(0);setResults(null);
    let p=0;const iv=setInterval(()=>{p=Math.min(p+4,92);setProgress(p);},300);
    try{
      // השרת טוען את האורחים מהמסד, מוריד מהיתרה ושולח דרך 019
      // שליחה לפי שפה: כל קבוצה מקבלת את הנוסח בשפה שלה
      let error=null,body=null;const all=[];
      for(const [lang,gs] of byLang(toSend)){
        const r=await sb.functions.invoke("send-sms",{body:{event_id:event.id,guest_ids:gs.map(g=>g.id),message:textFor(lang),inviteUrl}});
        error=r.error;body=r.data;
        if(error){try{body=await error.context?.json();}catch{body=null;}}
        if(body?.results)all.push(...body.results);
        if(typeof body?.balance==="number")setSmsBalance(body.balance);
        if(error||body?.error)break;
      }
      if(all.length)setResults(all);
      if(error||body?.error){
        alert("⚠️ "+(body?.error||error?.message||"שגיאה בשליחה")+(body?.needed?`\nנדרש: ${body.needed} | יתרה: ${body.balance}`:""));
      }else{setProgress(100);await markSent(toSend.map(g=>g.id),selectedTemplate);}
    }catch(e){
      alert("שגיאה בשליחה: "+e.message);
    }
    clearInterval(iv);
    setSending(false);
  };

  const sentOk=results?.filter(r=>r.status?.includes("✓")).length||0;
  const sentFail=results?.filter(r=>r.status?.includes("✗")).length||0;

  return(
    <div className="hm sm" style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:"22px 24px",paddingBottom:80}}>
      <style>{HOME_CSS+SMS_CSS}</style>
      <style>{`
        @media(max-width:768px){
          .msg-grid{grid-template-columns:1fr!important;}
          .msg-preview{display:none!important;}
          .wa-grid{grid-template-columns:1fr!important;}
          .wa-preview{display:none!important;}
        }
      `}</style>

      {/* פס אחד: מה המסך הזה, כמה הודעות יש, ואיך קונים עוד. טופס הרכישה נפתח רק כשצריך */}
      <div className="sm-hero">
        <span className="sm-bub" aria-hidden="true" style={{width:160,height:160,top:-60,left:-40}}/>
        <span className="sm-bub" aria-hidden="true" style={{width:60,height:60,bottom:-18,left:"40%"}}/>
        <div style={{minWidth:0,position:"relative"}}>
          <h1 style={{fontSize:"clamp(26px,2.6vw,34px)",fontWeight:700,margin:"0 0 4px",color:"#2B1D3F"}}>שליחת SMS</h1>
          <div style={{fontSize:15,color:"#3E3555"}}>{ew.hosts} {ew.emoji} · {withPhone.length} אורחים עם טלפון</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
          <div className="sm-bal">
            <b>{smsBalance===null?"...":smsBalance.toLocaleString()}</b>
            <span>הודעות זמינות</span>
          </div>
          <button onClick={()=>setShowBuy(!buyOpen)} aria-expanded={buyOpen} aria-controls="sms-buy" className="hm-pill p" style={{padding:"12px 22px",fontSize:15}}>
            {buyOpen?"סגירת הרכישה":"קניית הודעות"}
          </button>
        </div>
      </div>

      {pendingReq.length>0&&(
        <div style={{background:"#FFF1D6",border:"none",borderRadius:20,padding:"12px 16px",marginBottom:16,fontSize:14,color:"#7A4E00",fontWeight:700}}>
          ⏳ ממתין לאישור תשלום: {pendingReq.map(r=>`${r.amount} הודעות (₪${r.price})`).join(" · ")}
          <div style={{fontWeight:500,marginTop:3}}>היתרה תיטען מיד אחרי שהתשלום יאושר.</div>
        </div>
      )}

      {/* רכישת SMS: סגור כברירת מחדל, פתוח מעצמו כשאין יתרה בכלל */}
      {buyOpen&&<div id="sms-buy" className="sm-card" style={{"--t":"#FFE9DC"}}>
        <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 12px"}}>קניית הודעות</h2>
        {buyPack&&(
          <div style={{position:"fixed",inset:0,zIndex:320,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setBuyPack(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"24px 22px",width:"100%",maxWidth:400,textAlign:"center",boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)"}}>
              <div style={{fontSize:40,marginBottom:6}}>📱</div>
              <div style={{fontSize:19,fontWeight:900,color:C.text}}>{buyPack.amount} הודעות SMS</div>
              <div style={{fontSize:28,fontWeight:900,background:GRAD,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",margin:"4px 0 12px"}}>{fmtShekel(Number(buyPack.price))}</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:16,textAlign:"right",background:C.blueXL,borderRadius:12,padding:"10px 12px"}}>
                1. לחיצה על "שלח בקשה" פותחת {SUPPORT_WA?"וואטסאפ":"מייל"} עם הפרטים<br/>
                2. נשלח לך פרטי תשלום (Bit / העברה)<br/>
                3. אחרי התשלום ההודעות נטענות ליתרה שלך
              </div>
              <button onClick={confirmPurchase} className="sx-btn" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:WA_GREEN,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:8}}>
                {SUPPORT_WA?<WaIcon size={18}/>:"✉️"} שלח בקשה {CONTACT_BY}
              </button>
              <button onClick={()=>setBuyPack(null)} style={{background:"none",border:"none",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>
            </div>
          </div>
        )}
        <SmsQuantityPicker value={buyQty} onChange={setBuyQty} baseFee={smsBase} baseOn={baseOn} onBaseOn={setBaseOn} baseOwned={baseOwned}
          callOn={buyCall} onCallOn={setBuyCall} callRecords={buyCallRecs} onCallRecords={setBuyCallRecs}/>
        <button onClick={()=>buyPackage(buyQty,buySum)} className="sx-btn sx-btn-primary"
          style={{width:"100%",marginTop:10,background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>
          🛒 רכישת {buyQty.toLocaleString()} הודעות{buyCall?" + מוקד":""}{smsBase?" + בסיסית":""} · {fmtShekel(buySum)}
        </button>
        <div style={{fontSize:12,color:"#5F5675",textAlign:"center",marginTop:10}}>
          💳 תשלום ב-Bit או בהעברה · ההודעות נטענות אחרי אישור התשלום
        </div>
      </div>}

      <div className="msg-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>

        {/* עמודה שמאל - עריכה: סדר הפעולות האמיתי, 1 נוסח ← 2 עריכה ← 3 נמענים ← שליחה */}
        <div style={{minWidth:0}}>

          {/* בחירת נוסח */}
          <div className="sm-card" style={{"--t":"#EFE6FF"}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 12px"}}>1. בוחרים נוסח</h2>
            <div role="radiogroup" aria-label="נוסח ההודעה" style={{display:"flex",flexDirection:"column",gap:8}}>
              {TEMPLATES.map(t=>(
                <div key={t.id} onClick={()=>pickTemplate(t)} role="radio" aria-checked={selectedTemplate===t.id} tabIndex={0}
                  onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pickTemplate(t);}}}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderRadius:100,
                    border:"none",boxShadow:selectedTemplate===t.id?"0 0 0 2px #F0609E":"inset 0 0 0 1.5px #EFE8F7",
                    background:selectedTemplate===t.id?"#FFE9F2":"#fff",
                    cursor:"pointer",transition:"box-shadow 200ms cubic-bezier(0.23,1,0.32,1),background-color 200ms ease"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${selectedTemplate===t.id?"#F0609E":"#D9CCEA"}`,background:selectedTemplate===t.id?"radial-gradient(circle,#F0609E 45%,#fff 50%)":"#fff",flexShrink:0}}/>
                  <span style={{fontSize:14,fontWeight:700,color:"#2B1D3F"}}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* עריכת הודעה */}
          <div className="sm-card" style={{"--t":"#FFE3EE"}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 6px"}}>2. עורכים את ההודעה</h2>
            <div style={{fontSize:12,color:"#5F5675",marginBottom:10,lineHeight:1.7}}>
              מתמלא לכל אורח:&nbsp;
              {["{שם}","{שם מלא}","{קישור}","{שולחן}"].map(v=>(
                <code key={v} style={{background:"#F6F0FF",color:"#4A2C8F",padding:"2px 9px",borderRadius:100,marginLeft:4,fontSize:12,fontFamily:"inherit",fontWeight:700}}>{v}</code>
              ))}
            </div>
            <MsgToneLangBar tone={tone} onTone={chooseTone} langs={langsUsed} activeLang={activeLang} onLang={setActiveLang} accent={"#B4236A"}/>
            <textarea id="sms-text" aria-label="נוסח ההודעה" value={activeLang==="he"?msgText:textFor(activeLang)} onChange={e=>{const v=e.target.value;activeLang==="he"?setMsgText(v):setLangEdits(x=>({...x,[activeLang]:v}));}} dir={activeLang==="he"||activeLang==="ar"?"rtl":"ltr"}
              style={{width:"100%",minHeight:150,border:"1.5px solid #E6DDF5",borderRadius:20,padding:"14px 16px",
                fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",lineHeight:1.8,
                boxSizing:"border-box",color:C.text}}/>
            {/* ספירת תווים */}
            <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:6,fontSize:12,color:tooLong?"#B42318":"#5F5675",fontWeight:tooLong?800:400}}>
              <span>{longest.len}/{SMS_MAX} תווים{longest.name?` (הכי ארוכה: ${longest.name})`:""}</span>
              <span>{tooLong?`⚠️ קצר ב-${longest.len-SMS_MAX} תווים`:"✓ בתוך המגבלה"}</span>
            </div>
            <div style={{fontSize:12,color:"#5F5675",marginTop:4}}>הספירה כוללת את השם, השולחן והקישור האישי ({SHORT_LINK_HOST}…, {SHORT_LINK_HOST.length+7} תווים). אימוג'י = 2 תווים.</div>
            {activeLang==="he"&&tone==="classic"&&<TemplateTextBar tpl={TEMPLATES.find(t=>t.id===selectedTemplate)} text={msgText} accent={C.blueM} autoNote
              onSave={t=>tooLong?(alert(`ההודעה ארוכה מ-${SMS_MAX} תווים. קצרו לפני השמירה.`),false):saveText(selectedTemplate,t)}
              onReset={async()=>{const tp=TEMPLATES.find(t=>t.id===selectedTemplate);if(tp.custom&&!confirm("לחזור לנוסח המקורי?"))return;if(tp.custom)await saveText(selectedTemplate,"");setMsgText(tp.def);}}/>}
            {activeLang!=="he"&&tone==="classic"&&(()=>{const L=MSG_LANGS.find(x=>x[0]===activeLang);const cur=textFor(activeLang),saved=langTextOf(activeLang,selectedTemplate),auto=buildMsgText(event,selectedTemplate,"classic",activeLang,heClassicOf(selectedTemplate));const dirty=cur!==(saved||auto);
              const bb={border:"none",borderRadius:9,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"};
              return <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginTop:8}}>
                <button disabled={!dirty} onClick={async()=>{if(tooLong){alert(`ההודעה ארוכה מ-${SMS_MAX} תווים. קצרו לפני השמירה.`);return;}if(await saveLangText(activeLang,selectedTemplate,cur===auto?"":cur))setLangEdits(x=>{const n={...x};delete n[activeLang];return n;});}} className="sx-btn"
                  style={{...bb,background:dirty?C.blueM:"#E9E4EF",color:dirty?"#fff":"#4A4060",cursor:dirty?"pointer":"default"}}>💾 שמירת הנוסח ({L?.[1]||activeLang})</button>
                {saved&&<button onClick={async()=>{if(!confirm("לחזור לנוסח המקורי בשפה הזו?"))return;if(await saveLangText(activeLang,selectedTemplate,""))setLangEdits(x=>{const n={...x};delete n[activeLang];return n;});}} style={{...bb,background:"#F7F1FD",color:C.blue}}>↺ נוסח מקורי</button>}
                {!dirty&&saved&&<span style={{fontSize:12,color:C.muted}}>✏️ נוסח אישי שלך · ישמש גם בשליחה האוטומטית</span>}
                {dirty&&<span style={{fontSize:12,color:"#8A5A00"}}>יש שינויים שלא נשמרו</span>}
              </div>;})()}
            {langsUsed.length>1&&<div style={{fontSize:12,color:"#5E5470",marginTop:8}}>🌍 כל אורח יקבל את ההודעה בשפה שנבחרה לו בניהול אורחים, גם בשליחה ידנית וגם בשליחה האוטומטית</div>}
          </div>

          {/* פילטר */}
          <div className="sm-card" style={{"--t":"#DFF6EC"}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 12px"}}>3. למי לשלוח?</h2>
            <RecipientPicker withPhone={withPhone} value={sendTo} onChange={setSendTo}/>
            <div style={{fontSize:13,color:"#5F5675",marginTop:8}}>
              {sendTo.length?`${toSend.length} אורחים, ${totalSmsNeeded} הודעות`:"עוד לא נבחרו נמענים"}
              {selectedTemplate==="reminder"&&<div style={{color:"#7A4E00",fontWeight:700,marginTop:3}}>🔔 תזכורת נשלחת רק לממתינים. מי שכבר אישר או סירב לא יקבל.</div>}
            </div>
          </div>

          {/* כפתור שליחה: מיד אחרי בחירת הנמענים. לא זמין = עדיין קריא ואומר מה חסר */}
          <button onClick={sendAll} disabled={sending||toSend.length===0||!hasBalance||tooLong}
            style={{width:"100%",background:sending||toSend.length===0||!hasBalance||tooLong?"#ECE8F1":"linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)",
              color:sending||toSend.length===0||!hasBalance||tooLong?"#4A4060":"#fff",border:"none",borderRadius:100,padding:"16px",fontSize:17,fontWeight:700,
              cursor:sending||toSend.length===0||!hasBalance||tooLong?"default":"pointer",fontFamily:"inherit",
              boxShadow:sending||toSend.length===0||!hasBalance||tooLong?"none":"0 16px 30px -14px rgba(240,96,158,.7)",transition:"box-shadow .2s"}}>
            {sending?`שולח... ${progress}%`:tooLong?`⚠️ ההודעה ארוכה מ-${SMS_MAX} תווים`:!hasBalance?`⚠️ אין מספיק SMS (יתרה: ${smsBalance||0})`:toSend.length===0?"בחר למי לשלוח":`📱 שלח SMS ל-${toSend.length} אורחים (${totalSmsNeeded} SMS)`}
          </button>
          {!hasBalance&&<button onClick={()=>{setShowBuy(true);setTimeout(()=>document.getElementById("sms-buy")?.scrollIntoView({behavior:"smooth",block:"center"}),60);}}
            style={{display:"block",margin:"10px auto 0",background:"none",border:"none",padding:6,color:C.blue,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>קניית הודעות</button>}

          {/* Progress Bar */}
          {(sending||progress>0)&&(
            <div style={{marginTop:10,background:"#E2E8F0",borderRadius:100,height:8,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#FF8A65,#F0609E,#9B6BFF)",borderRadius:100,transition:"width .3s"}}/>
            </div>
          )}

          {/* תוצאות */}
          {results&&(
            <div className="sm-card" style={{"--t":"#DFF6EC",marginTop:16}}>
              <div style={{display:"flex",gap:12,marginBottom:12}}>
                <div style={{flex:1,background:"#F0FFF4",borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:24,fontWeight:900,color:"#276749"}}>{sentOk}</div>
                  <div style={{fontSize:12,color:"#276749",fontWeight:700}}>נשלחו ✓</div>
                </div>
                <div style={{flex:1,background:"#FFF5F5",borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:24,fontWeight:900,color:"#C53030"}}>{sentFail}</div>
                  <div style={{fontSize:12,color:"#C53030",fontWeight:700}}>נכשלו ✗</div>
                </div>
              </div>
              <div style={{maxHeight:200,overflowY:"auto"}}>
                {results.map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                    <span style={{fontWeight:600,color:C.text}}>{r.name}</span>
                    <span style={{color:r.status?.includes("✓")?"#276749":"#C53030",fontWeight:700}}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* עמודה ימין  -  תצוגה מקדימה */}
        {/* תצוגה מקדימה במקומה (לא "נדבקת" וגולשת עם הגלילה) */}
        <div className="msg-preview">
          <div className="sm-card" style={{"--t":"#E2F1FF",marginBottom:0}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 12px"}}>ככה ההודעה תיראה</h2>

            {guests.length>0&&(
              <select aria-label="תצוגה מקדימה עבור אורח" value={previewGuest?.id||""} onChange={e=>setPreviewGuest(guests.find(g=>String(g.id)===e.target.value)||null)}
                style={{width:"100%",border:"1.5px solid #E6DDF5",borderRadius:100,padding:"10px 16px",fontSize:14,fontFamily:"inherit",outline:"none",marginBottom:14,background:"#fff",color:C.text}}>
                {guests.map(g=>(
                  <option key={g.id} value={g.id}>{g.name}{g.phone?" ✓":""}</option>
                ))}
              </select>
            )}

            {/* בועת SMS */}
            <div className="sm-phone">
              <div className="sm-status" aria-hidden="true"><span>{new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}</span><span className="sm-isl"/><span className="sm-ic"><i/><i/><i/><i/><b/></span></div>
              <div style={{background:"#fff",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #F0E8F7"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#F0609E,#9B6BFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0}}>
                  {ini(previewGuest?.name,"א")}
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#2B1D3F"}}>{previewGuest?.name||"אורח לדוגמה"}</div>
                  <div style={{fontSize:12,color:"#5E5470"}}>SMS</div>
                </div>
              </div>
              <div style={{padding:16}}>
                <div style={{background:"#fff",borderRadius:"4px 20px 20px 20px",padding:"12px 16px",maxWidth:"90%",display:"inline-block",boxShadow:"0 10px 24px -18px rgba(43,29,63,.6)"}}>
                  <div style={{fontSize:14,color:"#2B1D3F",lineHeight:1.8,whiteSpace:"pre-wrap",direction:["he","ar"].includes(guestLangOf(event,previewGuest))?"rtl":"ltr"}}>
                    {buildPreview(previewGuest)}
                  </div>
                  <div style={{fontSize:12,color:"#5E5470",textAlign:"left",marginTop:6}}>
                    {new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
              </div>
            </div>

            {/* מידע */}
            <div style={{marginTop:14,background:!hasBalance&&smsBalance!==null?"#FFEFF2":"#F6F0FF",border:"none",borderRadius:18,padding:"12px 16px"}}>
              <div style={{fontSize:13,color:C.text,lineHeight:1.7}}>
                {toSend.length?<>{toSend.length} אורחים יקבלו הודעה אחת כל אחד, ו-<strong>{totalSmsNeeded} הודעות</strong> ירדו מהיתרה.</>:"בוחרים נמענים בשלב 3, וכאן יופיע כמה הודעות ירדו מהיתרה."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* תזמון שליחה אוטומטית: נפרד מהשליחה הידנית, אחריה */}
      <div className="sm-card" style={{"--t":"#F1EAFF",marginTop:20}}>
        <ScheduleEditor event={event} storeKey="sms_schedule" templates={TEMPLATES} accent={C.blueM} auto
          langNote={otherLangs?`אורחים בשפה אחרת יקבלו כל תזמון בשפה שלהם (${otherLangs.split(",").map(l=>MSG_LANGS.find(x=>x[0]===l)?.[1]||l).join(", ")})`:""}
          onPickTemplate={id=>{const tp=TEMPLATES.find(x=>x.id===id);setSelectedTemplate(id);setMsgText(tp?.text||"");document.getElementById("sms-text")?.scrollIntoView({behavior:"smooth",block:"center"});}}/>
      </div>
    </div>
  );
}

// ─── WHATSAPP SCREEN ──────────────────────────────────────────────────────────
export function WhatsAppScreen({ event, guests, userPackages=[] }) {
  // חבילה: כמות רשומות × ₪1.8 + מוקד אופציונלי. נקנית בנפרד, בלי החבילה הבסיסית
  const baseOwned=hasBasicPkg(userPackages), baseOn=false, setBaseOn=()=>{}, smsBase=0;
  const [waQty,setWaQty]=useState(Math.max(50,Math.ceil((guests.length||100)/10)*10)), [waCall,setWaCall]=useState(false);
  const waSum=pickerTotal({value:waQty,baseFee:smsBase,unitPrice:WA_RECORD_PRICE,callOn:waCall});
  const ew=eventWords(event);
  const groomName = String(event.groom_name||"").trim();
  const brideName = String(event.bride_name||"").trim();
  const coupleStr = ew.hosts;

  // תאריך בפורמט עברי נכון: יום ב׳, 30 באפריל 2026
  const eventDateObj = event.date ? new Date(event.date) : null;
  const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const eventDate = eventDateObj
    ? `יום ${days[eventDateObj.getDay()]}, ${eventDateObj.toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}`
    : "בקרוב";

  const inviteUrl = `${window.location.origin}/#/invite/${event.invite_code||""}`;

  // טקסט לפי סוג האירוע (eventWords) + קישור מתנה אם הוגדר Bit/PayBox
  const eventEmoji=ew.emoji, eventName=ew.name, coupleRef=ew.hosts, greeting=ew.greeting;
  const gift=giftLine(event), giftAdd=t=>gift&&!t.includes(giftLink(event))?`${t}\n\n${gift}`:t;

  const defaultInviteText=`שלום {שם}! 💌\n\nמוזמנים ל${eventName}! ${eventEmoji}\n\nנרגשים להזמין אותך ${greeting} ונשמח מאוד לראותך!\n\n📅 תאריך: ${eventDate}\n📍 מקום: ${event.venue||"יפורסם בקרוב"}\n\n👇 לאישור הגעה לחץ כאן:\n{קישור}\n\nבאהבה,\n${coupleRef} ${eventEmoji}`;
  const inviteText=giftAdd(event.welcome_text?.trim()||defaultInviteText);

  const BASE_TEMPLATES = [
    {
      id:"invite",
      label:"💌 הזמנה לאירוע",
      text:inviteText,
    },
    {
      id:"reminder",
      label:"🔔 תזכורת לממתינים",
      text:`שלום {שם}! 👋\n\nעוד לא אישרת הגעה ל${eventName}.\nנשמח מאוד לדעת אם תוכל להגיע 🙏\n\n📅 ${eventDate}\n\n👇 לאישור הגעה לחץ כאן:\n{קישור}\n\nמחכים לך! 💙`,
    },
    {
      id:"table",
      label:"🪑 מספר שולחן",
      text:giftAdd(`שלום {שם}! 🎊\n\nמחכים לך היום ב${eventName}!\n\n🪑 השולחן שלך: מספר {שולחן}\n\n📅 ${eventDate}\n📍 ${event.venue||""}\n\n👇 לפרטים נוספים:\n{קישור}\n\nנתראה בקרוב! 🥂`),
    },
    {
      id:"thanks",
      label:"💙 תודה אחרי האירוע",
      text:`שלום {שם}! 💙\n\nתודה רבה שהגעת ל${eventName}!\nשמחנו כל כך לחגוג איתך את היום המיוחד הזה 🥰\n\nבאהבה רבה,\n${coupleRef} ${eventEmoji}`,
    },
  ];
  const [TEMPLATES,saveText]=useSavedTexts(event,"wa_texts",BASE_TEMPLATES);

  const [selectedTemplate,setSelectedTemplate]=useState(TEMPLATES[0].id);
  const [msgText,setMsgText]=useState(TEMPLATES[0].text);
  const [sendTo,setSendTo]=useState([]);
  const [sending,setSending]=useState(false);
  const [progress,setProgress]=useState(0);
  const [results,setResults]=useState(null);
  const [previewGuest,setPreviewGuest]=useState(null);
  // טון + שפה: לכל אורח הנוסח בשפה שלו (guests.lang), ברירת מחדל עברית
  const [tone,setTone]=useState("classic"),[activeLang,setActiveLang]=useState("he"),[langEdits,setLangEdits]=useState({});
  const heClassicOf=id=>TEMPLATES.find(t=>t.id===id)?.text||"";
  const textFor=lang=>lang==="he"?msgText:(langEdits[lang]??buildMsgText(event,selectedTemplate,tone,lang,heClassicOf(selectedTemplate)));
  const chooseTone=v=>{setTone(v);setLangEdits({});setMsgText(buildMsgText(event,selectedTemplate,v,"he",heClassicOf(selectedTemplate)));};


  // כשנוסח ההזמנה משתנה בפרטי האירוע  -  עדכן את ה-template
  useEffect(()=>{
    if(selectedTemplate==="invite"){
      setMsgText(TEMPLATES[0].text);
    }
  },[event.welcome_text]);

  useEffect(()=>{
    if(guests.length>0&&!previewGuest)setPreviewGuest(guests[0]);
  },[guests]);

  const withPhone=guests.filter(g=>g.phone&&g.phone.trim().length>6);
  const toSend=pickRecipients(withPhone,sendTo,selectedTemplate);
  const langsUsed=Object.entries(withPhone.reduce((m,g)=>{const l=guestLangOf(event,g);m[l]=(m[l]||0)+1;return m;},{he:0})).sort((a,b)=>a[0]==="he"?-1:b[0]==="he"?1:b[1]-a[1]);
  const byLang=list=>Object.entries(list.reduce((m,g)=>{const l=guestLangOf(event,g);(m[l]||=[]).push(g);return m;},{}));


  const buildPreview=(g)=>{
    if(!g)return msgText;
    return textFor(guestLangOf(event,g))
      .replace(/{שם}/g,g.name.split(" ")[0])
      .replace(/{שם מלא}/g,g.name)
      .replace(/{קישור}/g,`${inviteUrl}?g=${g.id}`)
      .replace(/{שולחן}/g,"3");
  };

  const pickTemplate=(t)=>{setSelectedTemplate(t.id);setLangEdits({});setMsgText(buildMsgText(event,t.id,tone,"he",t.text));};

  // נוסח לכל שפה שיש לאורחים שנבחרו (השרת בוחר לכל אורח את השפה שלו)
  const msgMap=list=>{const m={he:textFor("he")};list.forEach(g=>{const l=guestLangOf(event,g);if(!m[l])m[l]=textFor(l);});return m;};
  const callWa=async(dry)=>{
    const ids=toSend.map(g=>g.id),chunks=[];for(let i=0;i<ids.length;i+=150)chunks.push(ids.slice(i,i+150));
    const out={results:[],will_send:[],skipped:[],new_records:0,free:0,balance:null,enough:true,error:null};
    for(const c of chunks){
      const{data,error}=await sb.functions.invoke("send-whatsapp",{body:{event_id:event.id,guest_ids:c,round:selectedTemplate,messages:msgMap(toSend),dry_run:dry}});
      let b=data;if(error){try{b=await error.context?.json();}catch{b=null;}}
      if(!b){out.error=error?.message||"שגיאה בשרת";break;}
      out.results.push(...(b.results||[]));out.will_send.push(...(b.will_send||[]));out.skipped.push(...(b.skipped||[]));
      out.new_records+=b.new_records||0;out.free+=b.free||0;if(typeof b.balance==="number")out.balance=b.balance;if(b.enough===false)out.enough=false;
      if(b.error){out.error=b.error;break;}
    }
    return out;
  };
  const [check,setCheck]=useState(null),[checking,setChecking]=useState(false);
  useEffect(()=>{setCheck(null);},[selectedTemplate,sendTo.join(),event.id]);
  const runCheck=async()=>{
    if(toSend.length===0){alert("בחר למי לשלוח");return;}
    setChecking(true);setCheck(null);
    try{setCheck(await callWa(true));}catch(e){setCheck({error:e.message,will_send:[],skipped:[]});}
    setChecking(false);
  };
  const sendAll=async()=>{
    if(toSend.length===0){alert("אין אורחים לשליחה עם מספר טלפון");return;}
    if(!window.confirm(`לשלוח הודעה ל-${toSend.length} אורחים?\nאורח שעוד לא קיבל הודעה מוריד רשומה אחת מהיתרה; מי שכבר קיבל לא מחויב שוב.`))return;
    setSending(true);setProgress(0);setResults(null);
    let p=0;const iv=setInterval(()=>{p=Math.min(p+3,92);setProgress(p);},400);
    try{
      const r=await callWa(false);
      setResults([...r.results,...r.skipped.map(x=>({name:x.name,status:`דולג · ${x.reason}`}))]);
      if(r.error)alert("⚠️ "+r.error);else setProgress(100);
    }catch(e){alert("שגיאה בשליחה: "+e.message);}
    clearInterval(iv);setSending(false);loadWa().catch(()=>{});
  };

  const [scheduledDate,setScheduledDate]=useState("");
  const [scheduledTime,setScheduledTime]=useState("09:00");
  const [showSchedule,setShowSchedule]=useState(false);
  const [waScheduleEnabled,setWaScheduleEnabled]=useState([true,true,true,true]);

  const sentOk=results?.filter(r=>r.status?.includes("✓")).length||0;
  const sentFail=results?.filter(r=>r.status?.includes("✗")).length||0;

  // יתרת WhatsApp ברשומות (רשומה = אורח = סבב של 4 הודעות) + רכישה כמו ב-SMS:
  // בקשה נשמרת (request_wa), נפתח וואטסאפ עם הפרטים, והיתרה נטענת אחרי שהאדמין מאשר תשלום
  const [waBalance,setWaBalance]=useState(null),[waPending,setWaPending]=useState([]),[buyOpen,setBuyOpen]=useState(false),[buying,setBuying]=useState(false);
  const [waUsed,setWaUsed]=useState(0),[waRounds,setWaRounds]=useState({});
  const loadWa=async()=>{
    const [{data},{data:reqs},{data:rec},{data:rnd}]=await Promise.all([
      sb.from("wa_balance").select("balance").eq("event_id",event.id).maybeSingle(),
      sb.from("wa_requests").select("id,records,price,created_at").eq("event_id",event.id).eq("status","pending").order("created_at",{ascending:false}),
      sb.from("wa_guest_records").select("guest_id").eq("event_id",event.id),
      sb.from("wa_guest_rounds").select("guest_id,round").eq("event_id",event.id),
    ]);
    setWaBalance(data?.balance??0);setWaPending(reqs||[]);setWaUsed((rec||[]).length);
    setWaRounds((rnd||[]).reduce((m,r)=>{(m[r.guest_id]||=[]).push(r.round);return m;},{}));
  };
  useEffect(()=>{
    loadWa().catch(()=>setWaBalance(0));
    const refresh=()=>{if(document.visibilityState==="visible")loadWa().catch(()=>{});};
    window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
    return()=>{window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[event.id]);
  const waNeeded=withPhone.length, waShort=waBalance!==null&&waBalance<withPhone.filter(g=>!waRounds[g.id]).length;
  const confirmWaPurchase=async()=>{
    setBuying(true);
    const{error}=await sb.rpc("request_wa",{p_event:event.id,p_records:waQty,p_price:waSum});
    setBuying(false);
    if(error){alert("❌ לא הצלחנו לשלוח את הבקשה: "+error.message);return;}
    const msg=`שלום, אני מעוניין בחבילת "הודעות WhatsApp" - ${waQty.toLocaleString()} רשומות × ${fmtShekel(WA_RECORD_PRICE)} (סבב של 4 הודעות לכל רשומה)${waCall?` + מוקד מתקשר ל-${waQty.toLocaleString()} רשומות × ${fmtShekel(CALL_RECORD_PRICE)}`:""}${smsBase?` + חבילה בסיסית ${fmtShekel(smsBase)}`:""} - סה"כ ${fmtShekel(waSum)} לאירוע "${event.name}"`;
    openContact(msg,"בקשת רכישה ב-Sidor-IL");
    setBuyOpen(false);await loadWa();
  };
  const waPurchase=(<>
    {/* יתרת רשומות */}
    <div style={{background:"#fff",borderRadius:14,padding:"14px 18px",marginBottom:16,border:`1.5px solid ${waShort?"#FC8181":C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:waBalance?"#F0FFF4":"#FFF5F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{waBalance===null?"⏳":waBalance?"💬":"⚠️"}</div>
        <div>
          <div style={{fontSize:13,fontWeight:800,color:C.text}}>יתרת רשומות WhatsApp</div>
          <div style={{fontSize:12,color:C.muted}}>כל רשומה = אורח אחד = סבב של 4 הודעות · אורחים עם נייד: {waNeeded}</div>
          {waUsed>0&&<div style={{fontSize:12,color:"#156B45",fontWeight:700,marginTop:3}}>נוצלו {waUsed} רשומות · {Object.values(waRounds).filter(r=>r.length>=4).length} אורחים קיבלו את כל 4 הסבבים</div>}
        </div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,fontWeight:900,lineHeight:1,color:!waBalance?"#E53E3E":waShort?"#DD6B20":"#276749"}}>{waBalance===null?"...":waBalance.toLocaleString()}</div>
        <div style={{fontSize:12,color:C.muted,fontWeight:600}}>רשומות זמינות</div>
      </div>
    </div>

    {/* רכישת רשומות */}
    <div style={{background:"#fff",border:`2px solid ${WA_GREEN}`,borderRadius:18,overflow:"hidden",boxShadow:`0 4px 20px ${WA_GREEN}33`,marginBottom:16}}>
      <div style={{padding:16,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:46,height:46,borderRadius:13,background:WA_GREEN+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🛒</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontWeight:900,fontSize:15,color:"#1a1a1a"}}>רכישת רשומות WhatsApp</div>
            <span style={{fontSize:12,fontWeight:800,background:WA_GREEN,color:"#fff",padding:"2px 8px",borderRadius:100}}>4 סבבים</span>
          </div>
          <div style={{fontSize:12,color:"#6E6585",marginTop:2}}>{fmtShekel(WA_RECORD_PRICE)} לרשומה · סבב של 4 הודעות אוטומטיות לכל אורח</div>
        </div>
      </div>
      <div style={{padding:"0 16px 16px",borderTop:"1px solid #f0f0f0"}}>
        {waPending.length>0&&(
          <div style={{background:"#FFF8E8",border:"1px solid #F5DDA6",borderRadius:12,padding:"10px 12px",margin:"14px 0 0",fontSize:12,color:"#8A5A00",fontWeight:700}}>
            ⏳ ממתין לאישור תשלום: {waPending.map(r=>`${r.records} רשומות (₪${r.price})`).join(" · ")}
            <div style={{fontWeight:500,marginTop:3}}>היתרה תיטען מיד אחרי שהתשלום יאושר.</div>
          </div>
        )}
        <div style={{margin:"14px 0 8px"}}>
          {WA_ROUNDS.map(r=><div key={r} style={{fontSize:13,color:"#1a1a1a",marginBottom:6}}>💬 {r}</div>)}
        </div>
        <div style={{marginBottom:12}}>
          <SmsQuantityPicker value={waQty} onChange={setWaQty} color={WA_GREEN} baseFee={smsBase} baseOn={baseOn} onBaseOn={setBaseOn} baseOwned={baseOwned}
            unitPrice={WA_RECORD_PRICE} unitWord="רשומות" question="כמה רשומות (אורחים) לקנות?" callOn={waCall} onCallOn={setWaCall}/>
        </div>
        <button onClick={()=>setBuyOpen(true)} className="sx-btn"
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",boxSizing:"border-box",background:`linear-gradient(135deg,${WA_GREEN},${WA_GREEN}CC)`,color:"#fff",border:"none",borderRadius:12,padding:13,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
          🛒 רכישת {waQty.toLocaleString()} רשומות{waCall?" + מוקד":""}{smsBase?" + בסיסית":""} · {fmtShekel(waSum)}
        </button>
        <div style={{fontSize:12,color:C.muted,textAlign:"center",marginTop:8}}>💳 תשלום ב-Bit או בהעברה · הרשומות נטענות אחרי אישור התשלום</div>
      </div>
    </div>

    {buyOpen&&(
      <div style={{position:"fixed",inset:0,zIndex:320,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setBuyOpen(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"24px 22px",width:"100%",maxWidth:400,textAlign:"center",boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)"}}>
          <div style={{fontSize:40,marginBottom:6}}>💬</div>
          <div style={{fontSize:19,fontWeight:900,color:C.text}}>{waQty.toLocaleString()} רשומות WhatsApp</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>סבב של 4 הודעות לכל רשומה</div>
          <div style={{fontSize:28,fontWeight:900,color:"#075E54",margin:"6px 0 12px"}}>{fmtShekel(waSum)}</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:16,textAlign:"right",background:"#F0FFF4",borderRadius:12,padding:"10px 12px"}}>
            1. לחיצה על "שלח בקשה" פותחת {SUPPORT_WA?"וואטסאפ":"מייל"} עם הפרטים<br/>
            2. נשלח לך פרטי תשלום (Bit / העברה)<br/>
            3. אחרי התשלום הרשומות נטענות ליתרה שלך
          </div>
          <button onClick={confirmWaPurchase} disabled={buying} className="sx-btn" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:WA_GREEN,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:8}}>
            {SUPPORT_WA?<WaIcon size={18}/>:"✉️"} {buying?"שולח...":`שלח בקשה ${CONTACT_BY}`}
          </button>
          <button onClick={()=>setBuyOpen(false)} style={{background:"none",border:"none",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>
        </div>
      </div>
    )}
  </>);

  const waLangs=langsUsed.filter(([,n])=>n>0).map(([l])=>l).join(",");
  const waTextsKey=TEMPLATES.map(t=>t.text).join("|");
  useEffect(()=>{
    const want={he:Object.fromEntries(TEMPLATES.map(t=>[t.id,t.text]))};
    waLangs.split(",").filter(l=>l&&l!=="he").forEach(l=>{want[l]=Object.fromEntries(TEMPLATES.map(t=>[t.id,buildMsgText(event,t.id,"classic",l,t.text)]));});
    if(JSON.stringify(event.settings_json?.wa_texts_auto||{})===JSON.stringify(want))return;
    const settings={...(event.settings_json||{}),wa_texts_auto:want};
    sb.from("events").update({settings_json:settings}).eq("id",event.id).then(({error})=>{if(!error)event.settings_json=settings;},()=>{});
  },[event.id,waLangs,waTextsKey]);

  return(
    <div className="hm sm wa" style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:"22px 24px",paddingBottom:80}}>
      <style>{HOME_CSS+SMS_CSS+`@media(max-width:768px){.wa-grid{grid-template-columns:1fr!important;}.wa-preview{display:none!important;}}
        .wa .sm-hero{background:linear-gradient(150deg,#D4F5E4 0%,#E9FBF2 55%,#FFF4D9 100%)!important;box-shadow:0 26px 60px -40px rgba(20,120,80,.55)!important}
        .wa .wa-chat{background:#ECE5DD;background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1.2px);background-size:14px 14px}`}</style>
      {/* כותרת */}
      <div className="sm-hero">
        <span className="sm-bub" aria-hidden="true" style={{width:160,height:160,top:-60,left:-40}}/>
        <span className="sm-bub" aria-hidden="true" style={{width:60,height:60,bottom:-18,left:"40%"}}/>
        <div style={{minWidth:0,position:"relative"}}>
          <h1 style={{fontSize:"clamp(26px,2.6vw,34px)",fontWeight:700,margin:"0 0 4px",color:"#173D2F"}}>הודעות WhatsApp</h1>
          <div style={{fontSize:15,color:"#2F4F43"}}>הודעה אישית לכל אורח עם השם שלו · {coupleStr} 💍</div>
        </div>
        <div className="sm-bal" style={{position:"relative"}}>
          <b>{withPhone.length}</b>
          <span>אורחים עם טלפון</span>
        </div>
      </div>

      {waPurchase}

      <div className="wa-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

        {/* עמודה שמאל  -  עריכה */}
        <div style={{minWidth:0}}>

          {/* בחירת נוסח */}
          <div className="sm-card" style={{"--t":"#DFF6EC"}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 12px"}}>1. בוחרים נוסח</h2>
            <div role="radiogroup" aria-label="נוסח ההודעה" style={{display:"flex",flexDirection:"column",gap:8}}>
              {TEMPLATES.map(t=>(
                <div key={t.id} onClick={()=>pickTemplate(t)} role="radio" aria-checked={selectedTemplate===t.id} tabIndex={0}
                  onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pickTemplate(t);}}}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderRadius:100,border:"none",
                    boxShadow:selectedTemplate===t.id?"0 0 0 2px #15803D":"inset 0 0 0 1.5px #E4EFE8",
                    background:selectedTemplate===t.id?"#E3F8EC":"#fff",
                    cursor:"pointer",transition:"box-shadow 200ms cubic-bezier(0.23,1,0.32,1),background-color 200ms ease"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${selectedTemplate===t.id?"#15803D":"#C9DDD1"}`,background:selectedTemplate===t.id?"radial-gradient(circle,#15803D 45%,#fff 50%)":"#fff",flexShrink:0}}/>
                  <span style={{fontSize:14,fontWeight:700,color:"#173D2F"}}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* עריכת הודעה */}
          <div className="sm-card" style={{"--t":"#EFE6FF"}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 6px"}}>2. עורכים את ההודעה</h2>
            <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.6}}>
              משתנים זמינים:&nbsp;
              {["{שם}","{שם מלא}","{קישור}","{שולחן}"].map(v=>(
                <code key={v} style={{background:"#E3F8EC",color:"#156B45",padding:"2px 9px",borderRadius:100,marginLeft:4,fontSize:12,fontWeight:700,fontFamily:"inherit"}}>{v}</code>
              ))}
            </div>
            <MsgToneLangBar tone={tone} onTone={chooseTone} langs={langsUsed} activeLang={activeLang} onLang={setActiveLang} accent={"#0F7F40"}/>
            <textarea id="wa-text" aria-label="נוסח הודעת הוואטסאפ" value={activeLang==="he"?msgText:textFor(activeLang)} onChange={e=>{const v=e.target.value;activeLang==="he"?setMsgText(v):setLangEdits(x=>({...x,[activeLang]:v}));}} dir={activeLang==="he"||activeLang==="ar"?"rtl":"ltr"}
              style={{width:"100%",minHeight:180,border:"1.5px solid #DCEBE2",borderRadius:20,padding:"14px 16px",
                fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",lineHeight:1.8,
                boxSizing:"border-box",color:C.text}}/>
            {activeLang==="he"&&tone==="classic"&&<TemplateTextBar tpl={TEMPLATES.find(t=>t.id===selectedTemplate)} text={msgText} accent={WA_GREEN} onSave={t=>saveText(selectedTemplate,t)}
              onReset={async()=>{const tp=TEMPLATES.find(t=>t.id===selectedTemplate);if(tp.custom&&!confirm("לחזור לנוסח המקורי?"))return;if(tp.custom)await saveText(selectedTemplate,"");setMsgText(tp.def);}}/>}
            {langsUsed.length>1&&<div style={{fontSize:12,color:"#2F4F43",marginTop:8}}>🌍 כל אורח יקבל את ההודעה בשפה שנבחרה לו בניהול אורחים</div>}
          </div>

          {/* פילטר */}
          <div className="sm-card" style={{"--t":"#FFE3EE"}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 12px"}}>3. למי לשלוח?</h2>
            <RecipientPicker withPhone={withPhone} value={sendTo} onChange={setSendTo}/>
            <div style={{fontSize:12,color:C.muted,marginTop:8}}>
              {sendTo.length?`${toSend.length} אורחים`:"לא נבחרו נמענים  -  לא יישלח כלום"}
              {selectedTemplate==="reminder"&&<div style={{color:"#8A5A00",fontWeight:700,marginTop:3}}>🔔 תזכורת נשלחת רק לממתינים. מי שכבר אישר או סירב לא יקבל.</div>}
            </div>
          </div>

          {/* תזמון שליחה וואטסאפ  -  נשמר באירוע */}
          <ScheduleEditor event={event} storeKey="wa_schedule" templates={TEMPLATES} accent={WA_GREEN} defaultOn lockDefaults auto runsTable="wa_schedule_runs" toMap={WA_SCHEDULE_TO}
            autoNote="🤖 4 הסבבים נשלחים אוטומטית במועד (שעון ישראל), כל סבב פעם אחת. כל אורח = רשומה אחת לכל 4 ההודעות. תזכורת רק למי שעוד לא אישר; יום האירוע והתודה לכולם."
            onPickTemplate={id=>{const tp=TEMPLATES.find(x=>x.id===id);setSelectedTemplate(id);setMsgText(tp?.text||"");document.getElementById("wa-text")?.scrollIntoView({behavior:"smooth",block:"center"});}}/>

          {/* בדיקה בלי שליחה: כמה רשומות יירדו, מי יקבל ומי ידולג */}
          <button type="button" onClick={runCheck} disabled={checking||sending||toSend.length===0} className="sx-btn"
            style={{width:"100%",marginBottom:10,background:"#fff",color:"#0F5F32",border:"1.5px solid #9FDDB8",borderRadius:100,padding:"13px",fontSize:15,fontWeight:700,cursor:toSend.length?"pointer":"default",fontFamily:"inherit",opacity:toSend.length?1:.6}}>
            {checking?"בודק...":"🧪 בדיקה בלי שליחה"}
          </button>
          {check&&<div className="sm-card" role="status" style={{"--t":"#FFF4D9",marginBottom:12}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 10px"}}>🧪 תוצאת הבדיקה · {TEMPLATES.find(t=>t.id===selectedTemplate)?.label}</h2>
            {check.error&&!check.will_send?.length?<div style={{color:"#B42318",fontWeight:700,fontSize:14}}>{check.error}</div>:<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginBottom:10}}>
              {[[check.will_send.length,"יקבלו את ההודעה","#156B45","#E9FBF2"],[check.new_records,"רשומות יירדו מהיתרה",check.enough?"#7A4E00":"#B42318",check.enough?"#FFF8E8":"#FFF2F4"],[check.skipped.length,"ידולגו","#525A66","#F2F4F7"]].map(([v,l,c,bg])=>(
                <div key={l} style={{background:bg,borderRadius:14,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{l}</div></div>))}
            </div>
            <div style={{fontSize:13,color:"#3E3555",lineHeight:1.7,marginBottom:8}}>
              {check.free>0&&<div>✓ {check.free} אורחים כבר שולמו ברשומה ויקבלו בלי חיוב נוסף</div>}
              <div>יתרה עכשיו: <b>{check.balance??waBalance??0}</b> רשומות{check.new_records>0&&check.enough&&<> · אחרי השליחה: <b>{(check.balance??0)-check.new_records}</b></>}</div>
              {!check.enough&&<div style={{color:"#B42318",fontWeight:800}}>⚠️ אין מספיק רשומות. צריך עוד {check.new_records-(check.balance??0)}, והשליחה לא תצא.</div>}
            </div>
            <div style={{maxHeight:220,overflowY:"auto",borderTop:`1px solid ${C.border}`}}>
              {check.will_send.map(g=><div key={g.id} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"6px 4px",fontSize:12.5,borderBottom:`1px solid ${C.border}`}}><span style={{fontWeight:700}}>{g.name}</span><span style={{color:g.charged?"#7A4E00":"#156B45",fontWeight:700}}>סבב {g.round_no} מתוך 4 · {g.charged?"רשומה חדשה":"בלי חיוב"}</span></div>)}
              {check.skipped.map(g=><div key={g.id} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"6px 4px",fontSize:12.5,borderBottom:`1px solid ${C.border}`,color:"#5E5470"}}><span>{g.name}</span><span>דולג · {g.reason}</span></div>)}
            </div></>}
          </div>}

          {/* כפתור שליחה */}
          <button onClick={sendAll} disabled={sending||toSend.length===0}
            style={{width:"100%",marginTop:4,background:sending||toSend.length===0?"#ECE8F1":"linear-gradient(120deg,#0F7F40,#16A34A)",
              color:sending||toSend.length===0?"#4A4060":"#fff",border:"none",borderRadius:100,padding:"16px",fontSize:17,fontWeight:700,
              cursor:sending||toSend.length===0?"default":"pointer",fontFamily:"inherit",
              boxShadow:sending||toSend.length===0?"none":"0 16px 30px -14px rgba(15,127,64,.7)",transition:"box-shadow .2s"}}>
            {sending?`שולח... ${progress}%`:toSend.length===0?"בחר למי לשלוח":`💬 שלח ל-${toSend.length} אורחים`}
          </button>

          {/* Progress Bar */}
          {(sending||progress>0)&&(
            <div style={{marginTop:10,background:"#E2E8F0",borderRadius:100,height:8,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#075E54,#25D366)",borderRadius:100,transition:"width .3s"}}/>
            </div>
          )}

          {/* תוצאות */}
          {results&&(
            <div className="sm-card" style={{"--t":"#DFF6EC",marginTop:16}}>
              <div style={{display:"flex",gap:12,marginBottom:12}}>
                <div style={{flex:1,background:"#F0FFF4",borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:24,fontWeight:900,color:"#276749"}}>{sentOk}</div>
                  <div style={{fontSize:12,color:"#276749",fontWeight:700}}>נשלחו ✓</div>
                </div>
                <div style={{flex:1,background:"#FFF5F5",borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:24,fontWeight:900,color:"#C53030"}}>{sentFail}</div>
                  <div style={{fontSize:12,color:"#C53030",fontWeight:700}}>נכשלו ✗</div>
                </div>
              </div>
              <div style={{maxHeight:200,overflowY:"auto"}}>
                {results.map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                    <span style={{fontWeight:600,color:C.text}}>{r.name}</span>
                    <span style={{color:r.status?.includes("✓")?"#276749":"#C53030",fontWeight:700}}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* עמודה ימין  -  תצוגה מקדימה */}
        {/* תצוגה מקדימה במקומה (לא "נדבקת" וגולשת עם הגלילה) */}
        <div className="wa-preview">
          <div className="sm-card" style={{"--t":"#E2F1FF",marginBottom:0}}>
            <h2 style={{fontSize:15,fontWeight:800,color:C.text,margin:"0 0 12px"}}>ככה ההודעה תיראה</h2>

            {guests.length>0&&(
              <select aria-label="תצוגה מקדימה עבור אורח" value={previewGuest?.id||""} onChange={e=>setPreviewGuest(guests.find(g=>String(g.id)===e.target.value)||null)}
                style={{width:"100%",border:"1.5px solid #DCEBE2",borderRadius:100,padding:"10px 16px",fontSize:14,fontFamily:"inherit",outline:"none",marginBottom:14,background:"#fff",color:C.text}}>
                {guests.map(g=>(
                  <option key={g.id} value={g.id}>{g.name}{g.phone?" ✓":""}</option>
                ))}
              </select>
            )}

            {/* בועת WhatsApp */}
            <div className="sm-phone">
              <div className="sm-status" aria-hidden="true" style={{background:"#075E54",color:"#fff"}}><span>{new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}</span><span className="sm-isl"/><span className="sm-ic" style={{filter:"invert(1)"}}><i/><i/><i/><i/><b/></span></div>
              {/* header */}
              <div style={{background:"#075E54",padding:"10px 16px 12px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0}}>
                  {ini(previewGuest?.name,"א")}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{previewGuest?.name||"אורח לדוגמה"}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>מחובר</div>
                </div>
              </div>
              {/* הודעה */}
              <div className="wa-chat" style={{padding:16,minHeight:380}}>
                <div style={{background:"#fff",borderRadius:"4px 16px 16px 16px",padding:"10px 14px",maxWidth:"90%",boxShadow:"0 1px 3px rgba(0,0,0,.12)",display:"inline-block"}}>
                  <div style={{fontSize:13,color:"#1A202C",lineHeight:1.8,whiteSpace:"pre-wrap",direction:["he","ar"].includes(guestLangOf(event,previewGuest))?"rtl":"ltr"}}>
                    {buildPreview(previewGuest)}
                  </div>
                  <div style={{fontSize:12,color:"#6E6585",textAlign:"left",marginTop:6}}>
                    {new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})} ✓✓
                  </div>
                </div>
              </div>
            </div>

            {/* אזהרה */}
            <div style={{marginTop:14,background:"#FFF4D9",border:"none",borderRadius:18,padding:"12px 16px"}}>
              <div style={{fontSize:12,color:"#744210",lineHeight:1.7}}>
                💡 4 הסבבים יוצאים לבד במועדים שבתזמון. אפשר גם לשלוח סבב ידנית מכאן, ואורח שכבר קיבל אותו לא יקבל שוב.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI SEATING SCREEN ────────────────────────────────────────────────────────
// הושבה אוטומטית של האורחים שעוד לא שובצו. מקום = רשומת אורח (כמו בתצוגת השולחנות).
// byCategory: כל קטגוריה ביחד — קודם לשולחן שכבר יושבים בו אנשים מאותה קטגוריה, אחר כך לשולחן חדש.
// cats: רק הקטגוריות האלה יושבות ביחד (null = כולן); השאר משובצים אחריהן במקומות שנשארו.
// fillEmpty: שולחנות ריקים קודם (העדפה לשולחן ריק שהקבוצה נכנסת אליו בשלמותה), ואז הכי פחות מלאים.
// rules: כללי הושבה [{a,b,type:"together"|"apart"}]. כל צד הוא מזהה אורח, או "c:<קטגוריה>".
// "בנפרד": אף אורח מצד אחד לא יושב עם אורח מהצד השני. "ביחד": אורח-אורח באותו שולחן;
// אורח-קטגוריה = האורח מושב עם הקטגוריה; קטגוריה-קטגוריה = שתי הקטגוריות מושבות כקבוצה אחת
export function planAutoSeating(guests,tables,{byCategory=true,fillEmpty=true,cats=null,rules=[]}={}){
  const baseRel=g=>g.relation||"ללא שיוך";
  const everyone=[...guests,...tables.flatMap(t=>t.guests||[])];
  const catOf=s=>String(s).startsWith("c:")?String(s).slice(2):null;
  const idsOf=s=>{const c=catOf(s);return c!=null?everyone.filter(g=>baseRel(g)===c).map(g=>String(g.id)):[String(s)];};
  const over={};
  const relOf=g=>over[String(g.id)]||baseRel(g);
  const apart={},link={};
  const pair=(m,a,b)=>{(m[a]||=new Set()).add(b);(m[b]||=new Set()).add(a);};
  rules.forEach(r=>{
    const a=String(r.a||""),b=String(r.b||"");if(!a||!b||a===b)return;
    if(r.type==="apart"){idsOf(a).forEach(x=>idsOf(b).forEach(y=>{if(x!==y)pair(apart,x,y);}));return;}
    const ca=catOf(a),cb=catOf(b);
    if(ca==null&&cb==null)pair(link,a,b);
    else if(ca!=null&&cb!=null)idsOf(b).forEach(id=>{over[id]=ca;});
    else{const cat=ca??cb,g=ca!=null?b:a;over[g]=cat;}
  });
  const slots=tables.map((t,i)=>{
    const rels={};(t.guests||[]).forEach(g=>{rels[relOf(g)]=(rels[relOf(g)]||0)+1;});
    return {id:t.id,name:t.name,idx:i,used:(t.guests||[]).length,free:Math.max(0,(t.seats||10)-(t.guests||[]).length),rels,members:new Set((t.guests||[]).map(g=>String(g.id)))};
  });
  const seatedAt={};slots.forEach(s=>s.members.forEach(id=>{seatedAt[id]=s;}));
  const main=s=>Object.entries(s.rels).sort((a,b)=>b[1]-a[1])[0]?.[0];
  // השולחנות לפי סדר העדפה (הראשון שמתאים לכללים נבחר)
  const ordered=(rel,need)=>{
    const open=slots.filter(s=>s.free>0),out=[];
    if(rel)out.push(...open.filter(s=>s.used>0&&main(s)===rel).sort((a,b)=>b.free-a.free));
    if(fillEmpty){
      const empty=open.filter(s=>s.used===0);
      out.push(...empty.filter(s=>s.free>=need).sort((a,b)=>a.free-b.free),...empty.sort((a,b)=>b.free-a.free),...[...open].sort((a,b)=>a.used-b.used||a.idx-b.idx));
    }else out.push(...[...open].sort((a,b)=>a.idx-b.idx));
    return [...new Set(out)];
  };
  const clash=(unit,s)=>unit.some(g=>[...(apart[String(g.id)]||[])].some(x=>s.members.has(x)));
  // אורחים שצריכים לשבת ביחד הופכים ליחידה אחת
  const byId={};guests.forEach(g=>{byId[String(g.id)]=g;});
  const seen=new Set(),units=[];
  guests.forEach(g=>{
    const id=String(g.id);if(seen.has(id))return;
    const u=[],q=[id];seen.add(id);
    while(q.length){const c=q.shift();u.push(byId[c]);(link[c]||[]).forEach(x=>{if(byId[x]&&!seen.has(x)){seen.add(x);q.push(x);}});}
    units.push(u);
  });
  // אם מישהו מהיחידה צריך לשבת עם אורח שכבר יושב — השולחן שלו קודם
  const anchorOf=u=>{for(const g of u)for(const x of link[String(g.id)]||[])if(seatedAt[x])return seatedAt[x];return null;};
  const groups={},rest0=[];
  units.forEach(u=>{const r=relOf(u[0]);if(byCategory&&(!cats||cats.includes(r)))(groups[r]||=[]).push(u);else rest0.push(u);});
  const assignments=[];
  const place=(u,s,rel)=>u.forEach(g=>{
    assignments.push({guestId:g.id,tableId:s.id,reason:`${rel?rel+" → ":""}${s.name}`});
    s.used++;s.free--;s.rels[relOf(g)]=(s.rels[relOf(g)]||0)+1;s.members.add(String(g.id));
  });
  // קודם הקטגוריות שיושבות ביחד (הגדולה ראשונה), בסוף כל השאר
  const size=list=>list.reduce((n,u)=>n+u.length,0);
  [...Object.entries(groups).sort((a,b)=>size(b[1])-size(a[1])),...(rest0.length?[["",rest0]]:[])].forEach(([rel,list])=>{
    let left=size(list);
    list.forEach(u=>{
      const a=anchorOf(u);
      const s=[...(a?[a]:[]),...ordered(rel,left)].find(s=>s.free>=u.length&&!clash(u,s));
      if(s)place(u,s,rel);
      // אין שולחן שמכיל את כל היחידה — מושיבים אחד-אחד (עדיין בלי לשבור "בנפרד")
      else u.forEach(g=>{const s2=[...(a?[a]:[]),...ordered(rel,1)].find(s=>s.free>=1&&!clash([g],s));if(s2)place([g],s2,rel);});
      left-=u.length;
    });
  });
  return assignments;
}

// QR אישי לאורח (בדף ההזמנה) — הקישור האישי שלו, כך שגם מצלמה רגילה פותחת את ההזמנה
export const guestFromScan=(text,list)=>{
  const s=String(text||"");
  const id=s.match(/[?&]g=([0-9a-f-]{36})/i)?.[1]||s.match(/^[0-9a-f-]{36}$/i)?.[0];
  if(id)return list.find(g=>String(g.id)===id.toLowerCase())||null;
  const short=s.match(/\/i\/([A-Za-z0-9]+)/)?.[1];
  return short?list.find(g=>g.short_code===short)||null:null;
};
export function QrScanner({ onScan }) {
  const videoRef=useRef(null);
  const [err,setErr]=useState("");
  useEffect(()=>{
    let stream,stop=false,timer,detector=null,jsQR=null;
    const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
    (async()=>{
      try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});}
      catch{setErr("אין גישה למצלמה. אשרו גישה בדפדפן, או חפשו את האורח לפי שם.");return;}
      if(stop){stream.getTracks().forEach(t=>t.stop());return;}
      const v=videoRef.current;v.srcObject=stream;await v.play().catch(()=>{});
      if("BarcodeDetector" in window){try{detector=new window.BarcodeDetector({formats:["qr_code"]});}catch{}}
      if(!detector)jsQR=(await import("jsqr")).default;
      const tick=async()=>{
        if(stop)return;
        if(v.readyState>=2){
          try{
            if(detector){const r=await detector.detect(v);if(r[0])onScan(r[0].rawValue);}
            else{canvas.width=v.videoWidth;canvas.height=v.videoHeight;ctx.drawImage(v,0,0);const img=ctx.getImageData(0,0,canvas.width,canvas.height);const r=jsQR(img.data,img.width,img.height);if(r)onScan(r.data);}
          }catch{}
        }
        timer=setTimeout(tick,250);
      };
      tick();
    })();
    return()=>{stop=true;clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());};
  },[]);
  return err?<div style={{background:"#FFF5F5",border:"1px solid #FED7D7",color:"#C53030",borderRadius:14,padding:16,fontSize:13,fontWeight:700,textAlign:"center"}}>📷 {err}</div>
    :<div style={{position:"relative",borderRadius:16,overflow:"hidden",background:"#000",aspectRatio:"4/3"}}>
      <video ref={videoRef} playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      <div style={{position:"absolute",inset:"18%",border:"3px solid rgba(255,255,255,.85)",borderRadius:18,boxShadow:"0 0 0 999px rgba(0,0,0,.25)"}}/>
    </div>;
}
// פתק שולחן קטן להדפסה מהעמדה (מתאים גם למדפסת קבלות 80 מ"מ). מדפיס דרך מסגרת נסתרת כדי לא לצאת ממסך מלא
export function printSeatSlip(event,g,t){
  const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const title=event.groom_name&&event.bride_name?`${event.groom_name} & ${event.bride_name}`:event.name;
  const tname=t?String(t.name||"").replace(/^\s*\d+\s*/,"").trim():"";
  const f=document.createElement("iframe");
  f.style.cssText="position:fixed;width:0;height:0;border:0;left:-9999px";
  document.body.appendChild(f);
  const d=f.contentWindow.document;
  d.open();d.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><style>
    @page{size:80mm auto;margin:4mm}body{font-family:Heebo,Arial,sans-serif;color:#000;text-align:center;margin:0}
    .t{font-size:14px}.n{font-size:20px;font-weight:900;margin:8px 0 4px}.l{font-size:13px}.num{font-size:64px;font-weight:900;line-height:1}.sub{font-size:13px}
    hr{border:0;border-top:1px dashed #000;margin:10px 0}
  </style></head><body><div class="t">${esc(title)}</div><hr><div class="n">${esc(g.name)}</div>${
    t?`<div class="l">השולחן שלך</div><div class="num">${esc(t.num)}</div>${tname?`<div class="sub">${esc(tname)}</div>`:""}`:`<div class="l">גשו בבקשה לצוות הקבלה</div>`
  }<hr><div class="t">ברוכים הבאים! 🎉</div></body></html>`);d.close();
  setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print();}catch{}setTimeout(()=>f.remove(),1500);},300);
}
// קוד יציאה מהעמדה, נשמר במכשיר לכל אירוע (ברירת מחדל 1234)
export const kioskPinKey=id=>"sidor_kiosk_pin_"+id;
export const getKioskPin=id=>{try{return localStorage.getItem(kioskPinKey(id))||"1234";}catch{return "1234";}};

// ─── עמדת קבלת פנים לטאבלט: מסך מלא, האורח מקליד שם ורואה את מספר השולחן ───
// בלי טלפונים ובלי רשימה מלאה: תוצאות רק מ-2 אותיות, עד 6 שמות. יציאה רק עם קוד (שאורחים לא יצאו בטעות)
export function KioskMode({ event, guests, tables, onPick, autoPrint, showPrint, onClose }) {
  const [q,setQ]=useState(""),[shown,setShown]=useState(null);
  const [pinOpen,setPinOpen]=useState(false),[pin,setPin]=useState(""),[pinErr,setPinErr]=useState(false);
  const inputRef=useRef(null),timer=useRef(null);
  const pinRef=useRef("");
  const setPinBoth=v=>{pinRef.current=v;setPin(v);};
  // קוד ראשי שתמיד פותח, למקרה ששכחו את קוד המנהל
  const MASTER_PIN="1807";
  const pressPin=k=>{
    const code=getKioskPin(event.id);
    if(pinRef.current.length>=code.length)return;
    const v=pinRef.current+k;setPinBoth(v);setPinErr(false);
    if(v===MASTER_PIN){onClose();return;}
    if(v.length>=code.length){if(v===code)onClose();else{setPinErr(true);setTimeout(()=>{setPinBoth("");setPinErr(false);},700);}}
  };
  const tableOf=g=>tables.find(t=>t.id===g.table_id);
  const norm=s=>String(s||"").replace(/["'״׳\-]/g,"").trim();
  const qq=norm(q);
  const results=qq.length<2?[]:guests.filter(g=>g.rsvp!=="declined"&&norm(g.name).includes(qq)).slice(0,6);
  const pick=g=>{onPick?.(g);setShown(g);setQ("");if(autoPrint)printSeatSlip(event,g,tableOf(g));clearTimeout(timer.current);timer.current=setTimeout(()=>{setShown(null);inputRef.current?.focus();},9000);};
  useEffect(()=>{document.documentElement.requestFullscreen?.().catch(()=>{});return()=>{clearTimeout(timer.current);if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});};},[]);
  // המסך לא נכבה בזמן שהעמדה פתוחה (נועל שוב כשחוזרים ללשונית, כי הדפדפן משחרר את הנעילה כשהיא מוסתרת)
  const [awake,setAwake]=useState(null);
  useEffect(()=>{
    let lock=null,alive=true,busy=false;
    const grab=async()=>{
      if(!("wakeLock" in navigator)){setAwake(false);return;}
      if(busy||(lock&&!lock.released))return; // כבר נעול
      busy=true;
      try{
        const l=await navigator.wakeLock.request("screen");
        if(!alive){l.release();return;}
        lock=l;setAwake(true);
        l.addEventListener?.("release",()=>{if(lock===l)lock=null;});
      }catch{setAwake(false);}
      finally{busy=false;}
    };
    const onVis=()=>{if(document.visibilityState==="visible")grab();};
    grab();document.addEventListener("visibilitychange",onVis);
    return()=>{alive=false;document.removeEventListener("visibilitychange",onVis);lock?.release?.().catch(()=>{});};
  },[]);
  const title=event.groom_name&&event.bride_name?`${event.groom_name} & ${event.bride_name}`:event.name;
  return(
    <div dir="rtl" role="dialog" aria-label="עמדת קבלת פנים" style={{position:"fixed",inset:0,zIndex:600,background:"linear-gradient(160deg,#2B1D3F,#5B3C8C 55%,#9B6BFF)",color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",padding:"5vh 24px",fontFamily:"'Heebo',sans-serif",overflowY:"auto"}}>
      <button onClick={()=>{setPinBoth("");setPinErr(false);setPinOpen(true);}}
        title="יציאה עם קוד" style={{position:"absolute",top:14,left:14,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",color:"rgba(255,255,255,.7)",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔒 יציאה</button>
      {awake===false&&<div style={{position:"absolute",top:16,right:16,fontSize:12,color:"rgba(255,255,255,.88)",maxWidth:220,lineHeight:1.5}}>💡 המכשיר לא מאפשר לאתר להשאיר את המסך דלוק. כבו את נעילת המסך בהגדרות הטאבלט.</div>}
      {pinOpen&&(
        <div onClick={()=>setPinOpen(false)} style={{position:"fixed",inset:0,zIndex:10,background:"rgba(20,12,35,.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",color:"#2B1D3F",borderRadius:22,padding:"22px 20px",width:"100%",maxWidth:320,textAlign:"center",animation:pinErr?"shake .35s":"none"}}>
            <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
            <div style={{fontSize:17,fontWeight:900,marginBottom:4}}>🔒 יציאה מהעמדה</div>
            <div style={{fontSize:13,color:"#6E6585",marginBottom:14}}>הקלידו את הקוד</div>
            <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:16,direction:"ltr"}}>
              {Array.from({length:getKioskPin(event.id).length}).map((_,i)=>(
                <div key={i} style={{width:14,height:14,borderRadius:"50%",background:pinErr?"#E53E3E":i<pin.length?"#5B3C8C":"#E2DCEB"}}/>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,direction:"ltr"}}>
              {["1","2","3","4","5","6","7","8","9","✕","0","⌫"].map(k=>(
                <button key={k} onClick={()=>k==="✕"?setPinOpen(false):k==="⌫"?setPinBoth(pinRef.current.slice(0,-1)):pressPin(k)}
                  style={{background:k==="✕"||k==="⌫"?"#F4EEFC":"#fff",border:"1.5px solid #E2DCEB",borderRadius:14,padding:"14px 0",fontSize:22,fontWeight:800,color:"#2B1D3F",cursor:"pointer",fontFamily:"inherit"}}>{k}</button>
              ))}
            </div>
            {pinErr&&<div style={{color:"#E53E3E",fontSize:13,fontWeight:700,marginTop:10}}>קוד שגוי</div>}
          </div>
        </div>
      )}
      <div style={{fontSize:"clamp(16px,2.4vw,22px)",opacity:.85,marginTop:24}}>ברוכים הבאים</div>
      <div style={{fontSize:"clamp(30px,5vw,56px)",fontWeight:900,textAlign:"center",lineHeight:1.15,marginBottom:"4vh"}}>{title}</div>
      {shown?(
        <div onClick={()=>{setShown(null);inputRef.current?.focus();}} style={{textAlign:"center",cursor:"pointer",animation:"fadeUp .3s ease both"}}>
          <div style={{fontSize:"clamp(24px,4vw,40px)",fontWeight:800,marginBottom:12}}>שלום {String(shown.name).split(" ")[0]}! 🎉</div>
          {tableOf(shown)?<>
            <div style={{fontSize:"clamp(18px,2.6vw,26px)",opacity:.85}}>השולחן שלך</div>
            <div style={{fontSize:"clamp(90px,18vw,200px)",fontWeight:900,lineHeight:1}}>{tableOf(shown).num}</div>
            {String(tableOf(shown).name||"").replace(/^\s*\d+\s*/,"").trim()&&<div style={{fontSize:"clamp(16px,2.4vw,24px)",opacity:.8}}>{String(tableOf(shown).name).replace(/^\s*\d+\s*/,"").trim()}</div>}
          </>:<div style={{fontSize:"clamp(20px,3vw,30px)",background:"rgba(255,255,255,.15)",borderRadius:16,padding:"16px 24px"}}>גשו בבקשה לצוות הקבלה 🙏</div>}
          {showPrint&&<button onClick={e=>{e.stopPropagation();printSeatSlip(event,shown,tableOf(shown));}}
            style={{marginTop:24,background:"rgba(255,255,255,.95)",color:"#2B1D3F",border:"none",borderRadius:14,padding:"12px 26px",fontSize:18,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🖨️ הדפסת פתק שולחן</button>}
          <div style={{fontSize:14,opacity:.85,marginTop:20}}>לחצו כדי לחפש שם אחר</div>
        </div>
      ):(
        <div style={{width:"100%",maxWidth:640}}>
          <input ref={inputRef} autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="הקלידו את השם שלכם" aria-label="השם שלכם"
            style={{width:"100%",boxSizing:"border-box",fontSize:"clamp(22px,3.4vw,34px)",padding:"18px 22px",borderRadius:18,border:"none",outline:"none",fontFamily:"inherit",textAlign:"center",color:"#2B1D3F",boxShadow:"0 20px 40px -20px rgba(0,0,0,.5)"}}/>
          <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:10}}>
            {results.map(g=>(
              <button key={g.id} onClick={()=>pick(g)} style={{background:"rgba(255,255,255,.95)",color:"#2B1D3F",border:"none",borderRadius:16,padding:"16px 20px",fontSize:"clamp(20px,2.8vw,28px)",fontWeight:800,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{g.name}</button>
            ))}
            {qq.length>=2&&!results.length&&<div style={{textAlign:"center",opacity:.8,fontSize:18,marginTop:8}}>לא מצאנו את השם. נסו לכתוב אחרת, או גשו לצוות הקבלה 🙏</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckinScreen({ event, guests, tables, onReload }) {
  const [list,setList]=useState(guests);
  useEffect(()=>{setList(guests);},[guests]);
  const [kiosk,setKiosk]=useState(false),[markOnKiosk,setMarkOnKiosk]=useState(true);
  const [kioskPrint,setKioskPrint]=useState("button"); // off | button | auto
  const [kioskPin,setKioskPin]=useState(()=>getKioskPin(event.id));
  const saveKioskPin=v=>{const d=v.replace(/\D/g,"").slice(0,6);setKioskPin(d);try{if(d.length>=4)localStorage.setItem(kioskPinKey(event.id),d);}catch{}};
  const [scan,setScan]=useState(false),[found,setFound]=useState(null),[q,setQ]=useState("");
  const lastRef=useRef({text:"",at:0});
  const tableOf=g=>tables.find(t=>t.id===g.table_id);
  const ppl=g=>g.guest_count||1;
  const setArrived=async(g,on)=>{
    const arrived_at=on?new Date().toISOString():null;
    setList(l=>l.map(x=>x.id===g.id?{...x,arrived_at}:x));
    const{error}=await sb.from("guests").update({arrived_at}).eq("id",g.id);
    if(error)alert("❌ לא נשמר: "+error.message);else onReload?.();
  };
  const onScan=text=>{
    const now=Date.now();
    if(text===lastRef.current.text&&now-lastRef.current.at<4000)return;
    lastRef.current={text,at:now};
    const g=guestFromScan(text,list);
    if(!g){setFound({miss:true});return;}
    setFound({g,already:g.arrived_at});
    if(!g.arrived_at)setArrived(g,true);
    try{navigator.vibrate?.(120);}catch{}
  };
  const came=list.filter(g=>g.arrived_at),confirmed=list.filter(g=>g.rsvp==="confirmed");
  const qq=q.trim();
  const shown=qq?list.filter(g=>g.name?.includes(qq)||String(g.phone||"").replace(/\D/g,"").includes(qq.replace(/\D/g,"")||"~")):[];
  const TableBadge=({g})=>{const t=tableOf(g);return t?<span style={{background:GRAD,color:"#fff",borderRadius:10,padding:"4px 10px",fontWeight:900,fontSize:14,whiteSpace:"nowrap"}}>שולחן {t.num}</span>:<span style={{color:C.muted,fontSize:12}}>בלי שולחן</span>;};
  return(
    <div style={{direction:"rtl",maxWidth:560,margin:"0 auto",padding:16}}>
      {/* כותרת כמו בשאר המסכים (מתנות, תקציב, אורחים) */}
      <div style={{marginBottom:16}}>
        <h1 style={{fontSize:"clamp(26px,2.6vw,34px)",fontWeight:700,color:"#2B1D3F",margin:"0 0 4px"}}>כניסה לאולם</h1>
        <p style={{fontSize:15,color:"#5E5470",margin:0}}>סורקים את קוד ה-QR של האורח או מחפשים לפי שם, ורואים מיד את מספר השולחן שלו</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[[came.reduce((n,g)=>n+ppl(g),0),"נכנסו (אנשים)"],[confirmed.reduce((n,g)=>n+ppl(g),0),"אישרו הגעה (אנשים)"]].map(([v,l])=>(
          <Card key={l} style={{padding:14,textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:C.blue}}>{v}</div><div style={{fontSize:12,color:C.muted}}>{l}</div></Card>
        ))}
      </div>
      <button onClick={()=>{setScan(s=>!s);setFound(null);}} style={{width:"100%",background:scan?C.surface:GRAD,color:scan?C.blue:"#fff",border:scan?`2px solid ${C.blueL}`:"none",borderRadius:14,padding:14,fontSize:16,fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:12}}>
        {scan?"✕ סגור מצלמה":"📷 סריקת QR של אורח"}
      </button>
      <div style={{background:C.surface,border:`1.5px solid ${C.blueL}`,borderRadius:14,padding:12,marginBottom:12}}>
        <button onClick={()=>{if(kioskPin.length<4){alert("קוד היציאה צריך להיות לפחות 4 ספרות");return;}setKiosk(true);}} style={{width:"100%",background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:12,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
          📟 עמדת קבלת פנים לטאבלט (האורח מקליד את שמו ורואה שולחן)
        </button>
        <div style={{display:"grid",gap:8,fontSize:13,color:C.text}}>
          <label style={{display:"flex",alignItems:"center",gap:8}}>
            🔒 קוד יציאה:
            <input value={kioskPin} onChange={e=>saveKioskPin(e.target.value)} inputMode="numeric" aria-label="קוד יציאה מהעמדה"
              style={{width:90,padding:"6px 10px",borderRadius:10,border:`1.5px solid ${kioskPin.length<4?"#FC8181":C.border}`,fontSize:15,fontWeight:800,letterSpacing:3,textAlign:"center",fontFamily:"inherit",direction:"ltr"}}/>
            <span style={{fontSize:12,color:C.muted}}>4–6 ספרות</span>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
            <input type="checkbox" checked={markOnKiosk} onChange={e=>setMarkOnKiosk(e.target.checked)}/> לסמן "הגיע" כשאורח בוחר את שמו
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8}}>
            🖨️ הדפסת פתק שולחן:
            <select value={kioskPrint} onChange={e=>setKioskPrint(e.target.value)} style={{padding:"6px 10px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",background:"#fff"}}>
              <option value="off">בלי הדפסה</option>
              <option value="button">כפתור הדפסה לאורח</option>
              <option value="auto">הדפסה אוטומטית</option>
            </select>
          </label>
        </div>
      </div>
      {kiosk&&<KioskMode event={event} guests={list} tables={tables} onPick={g=>{if(markOnKiosk&&!g.arrived_at)setArrived(g,true);}} autoPrint={kioskPrint==="auto"} showPrint={kioskPrint!=="off"} onClose={()=>setKiosk(false)}/>}
      {scan&&<QrScanner onScan={onScan}/>}
      {found&&(found.miss
        ?<div style={{marginTop:12,background:"#FFF5F5",border:"1.5px solid #FED7D7",borderRadius:16,padding:16,textAlign:"center",color:"#C53030",fontWeight:800}}>❓ הקוד לא שייך לאורח באירוע הזה</div>
        :<div style={{marginTop:12,background:found.already?"#FFFBEB":"#F0FFF4",border:`1.5px solid ${found.already?"#FDE68A":"#9AE6B4"}`,borderRadius:16,padding:18,textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:C.text}}>{found.g.name}</div>
          <div style={{fontSize:13,color:C.muted,margin:"4px 0 10px"}}>{ppl(found.g)} אנשים{found.already?` · כבר נכנס ב-${new Date(found.already).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}`:" · ✓ סומן שהגיע"}</div>
          {tableOf(found.g)?<div style={{fontSize:44,fontWeight:900,color:C.blue,lineHeight:1}}>שולחן {tableOf(found.g).num}</div>:<div style={{fontSize:16,fontWeight:800,color:"#B45309"}}>עוד לא שובץ לשולחן</div>}
        </div>)}
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חיפוש אורח לפי שם או טלפון"
        style={{width:"100%",boxSizing:"border-box",marginTop:14,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:15,fontFamily:"inherit",outline:"none",background:C.surface}}/>
      <div style={{marginTop:10}}>
        {shown.slice(0,30).map(g=>(
          <Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:15,color:C.text}}>{g.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{ppl(g)} אנשים{g.arrived_at?" · ✓ הגיע":""}</div>
            </div>
            <TableBadge g={g}/>
            <button onClick={()=>setArrived(g,!g.arrived_at)} style={{background:g.arrived_at?"#F0FFF4":"#fff",color:g.arrived_at?"#276749":C.blue,border:`1.5px solid ${g.arrived_at?"#9AE6B4":C.blueL}`,borderRadius:10,padding:"7px 10px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{g.arrived_at?"↩ בטל":"✓ הגיע"}</button>
          </Card>
        ))}
        {qq&&!shown.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:10}}>לא נמצא אורח</div>}
      </div>
      <div style={{fontSize:12,color:C.muted,textAlign:"center",marginTop:12,lineHeight:1.7}}>💡 כל אורח שאישר הגעה רואה QR אישי בדף ההזמנה שלו. סורקים אותו בכניסה ורואים מיד את מספר השולחן.</div>
    </div>
  );
}

// ─── ספקים ומחירים: המלצות על ספקים + דיווחי מחיר למנה (vendor_reviews / plate_prices) ───
// מתפרסם מיד. דיווח שחורג מאוד מהשאר מסומן בשרת (trigger) כ"בבדיקה" ומגיע לאישור בלוח הניהול
export const VENDOR_CATS=[["venue","🏛️","אולם / גן"],["catering","🍽️","קייטרינג"],["dj","🎧","DJ"],["band","🎷","להקה"],["photo","📸","צלם / וידאו"],["design","💐","עיצוב ופרחים"],["makeup","💄","איפור ושיער"],["attraction","🎡","אטרקציות"],["other","✨","אחר"]];
export const VENDOR_CAT=Object.fromEntries(VENDOR_CATS.map(([k,i,l])=>[k,{icon:i,label:l}]));
export const normName=s=>String(s||"").trim().replace(/\s+/g," ").toLowerCase();
export const medianOf=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
export const HEB_DAYS=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
export const EVENT_TYPE_LABELS={wedding:"💍 חתונה",bar_mitzvah:"✡️ בר/בת מצווה",brit:"👶 ברית",business:"💼 אירוע עסקי",other:"🎉 אחר"};
// קבוצות ימים שמשפיעות על המחיר באולמות
export const dayGroup=d=>{const w=new Date(d+"T12:00:00").getDay();return w===4?"חמישי":w===5?"שישי":w===6?"מוצ״ש":"א׳–ד׳";};
export const flagNote=r=>r.flagged&&<div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:6,background:"#FFF6E2",border:"1px solid #F3D9A4",color:"#8A5A00",borderRadius:10,padding:"4px 10px",fontSize:12,fontWeight:700}}>⚠️ בבדיקה: {r.flag_reason||"שונה מהותית מהדיווחים האחרים"}</div>;

// ─── ספקים רשומים (vendor_profiles): הרשמה כספק, פרופיל עסק, אישור מנהל, ספק מוביל ───
export const BUSINESS_TYPES=[["patur","עוסק פטור"],["murshe","עוסק מורשה"],["company","חברה בע״מ"],["amuta","עמותה"]];
// ספרת ביקורת של ת.ז / ע.מ / ח.פ (9 ספרות)
export const validIsraeliId=s=>{const d=String(s||"").replace(/\D/g,"");if(!/^\d{5,9}$/.test(d))return false;const p=d.padStart(9,"0");let sum=0;for(let i=0;i<9;i++){let x=+p[i]*((i%2)+1);sum+=x>9?x-9:x;}return sum%10===0;};
// ספק מוביל = מסומן ועדיין בתוקף
export const compressImage=(file,max=1400,q=.82)=>new Promise((res,rej)=>{
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(b=>b?res(b):rej(new Error("compress")),"image/jpeg",q);};
  img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("לא קובץ תמונה"));};
  img.src=url;
});
export const uploadVendorImage=async(userId,file,max)=>{
  const blob=await compressImage(file,max);
  const path=`vendors/${userId}/${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}.jpg`;
  const{error}=await sb.storage.from("event-images").upload(path,blob,{contentType:"image/jpeg"});
  if(error)throw error;
  return sb.storage.from("event-images").getPublicUrl(path).data.publicUrl;
};
export const LEAD_STATUS=[["new","🆕 חדשה","#B4236A","#FFE9F2"],["contacted","📞 חזרתי ללקוח","#1F6FB2","#E8F2FC"],["quoted","💰 נשלחה הצעה","#7A4E00","#FFF4DC"],["won","🤝 נסגרה עסקה","#1F7A4D","#EFFAF3"],["closed","✕ לא רלוונטי","#525A66","#F2F4F7"]];
export const LEAD_FOR_CLIENT={new:"📨 נשלחה לספק",contacted:"📞 הספק יצר קשר",quoted:"💰 התקבלה הצעת מחיר",won:"🤝 סגרתם עם הספק",closed:"הפנייה נסגרה"};
export function VendorLeads({ user, business }) {
  const [list,setList]=useState(null),[err,setErr]=useState(""),[filter,setFilter]=useState("open"),[quoting,setQuoting]=useState(null),[q,setQ]=useState({price:"",note:""}),[busy,setBusy]=useState(false);
  const load=()=>sb.from("vendor_leads").select("*").eq("vendor_id",user.id).order("created_at",{ascending:false}).limit(500).then(({data,error})=>{if(error)setErr(error.message);setList(data||[]);},()=>setList([]));
  useEffect(()=>{load();},[user.id]);
  const patch=async(l,p)=>{setErr("");setList(a=>a.map(x=>x.id===l.id?{...x,...p}:x));const{error}=await sb.from("vendor_leads").update(p).eq("id",l.id);if(error){setErr(error.message);load();return false;}return true;};
  const del=async l=>{if(!window.confirm(`למחוק את הפנייה של ${l.name}?`))return;const{error}=await sb.from("vendor_leads").delete().eq("id",l.id);if(error)setErr(error.message);else setList(a=>a.filter(x=>x.id!==l.id));};
  const first=n=>String(n||"").split(" ")[0];
  const quoteText=(l,price,note)=>`היי ${first(l.name)}, כאן ${business||"הספק"} 😊\nבהמשך לפנייה שלך ב-Sidor-IL${l.event_date?` לאירוע ב-${new Date(l.event_date+"T00:00:00").toLocaleDateString("he-IL")}`:""}:\n💰 הצעת מחיר: ₪${Number(price).toLocaleString()}${note?`\n${note}`:""}\nאשמח לשמוע ממך!`;
  const openQuote=l=>{setQuoting(l.id);setQ({price:l.quote_price?String(l.quote_price):"",note:l.quote_note||""});};
  const saveQuote=async l=>{
    const price=parseInt(q.price,10);
    if(!price||price<1)return setErr("נא למלא מחיר");
    setBusy(true);
    const ok=await patch(l,{quote_price:Math.min(price,10000000),quote_note:q.note.trim().slice(0,600)||null,quoted_at:new Date().toISOString(),status:["won","closed"].includes(l.status)?l.status:"quoted"});
    setBusy(false);
    if(!ok)return;
    setQuoting(null);
    const wa=waLink(l.phone);
    if(wa&&window.confirm("ההצעה נשמרה, והזוג יראה אותה בפניות שלו. לשלוח אותה גם בוואטסאפ?"))window.open(`${wa}?text=${encodeURIComponent(quoteText(l,price,q.note.trim()))}`,"_blank","noopener,noreferrer");
  };
  const all=list||[],cnt=k=>all.filter(l=>(l.status||"new")===k).length;
  const won=all.filter(l=>l.status==="won"),wonSum=won.reduce((a,l)=>a+(Number(l.quote_price)||0),0);
  const FILTERS=[["open","בטיפול",l=>["new","contacted","quoted"].includes(l.status||"new")],["new","חדשות",l=>(l.status||"new")==="new"],["quoted","הצעות שנשלחו",l=>l.status==="quoted"],["won","עסקאות",l=>l.status==="won"],["all","הכל",()=>true]];
  const shown=all.filter((FILTERS.find(x=>x[0]===filter)||FILTERS[0])[2]);
  const fresh=cnt("new");
  return(
    <div className="vd-card vd-leads">
      <div className="vd-h" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>📩 פניות והצעות מחיר{fresh>0&&<span className="vd-new">{fresh===1?"פנייה חדשה":`${fresh} חדשות`}</span>}</div>
      <div className="vd-stats">
        <div><b>{fresh}</b><span>פניות חדשות</span></div>
        <div><b>{cnt("new")+cnt("contacted")}</b><span>מחכות להצעה</span></div>
        <div><b>{cnt("quoted")}</b><span>הצעות פתוחות</span></div>
        <div><b>{won.length}</b><span>{wonSum?`עסקאות · ₪${wonSum.toLocaleString()}`:"עסקאות שנסגרו"}</span></div>
      </div>
      {all.length>0&&<div className="vd-filters" role="tablist" aria-label="סינון פניות">{FILTERS.map(([k,t,fn])=>(
        <button key={k} type="button" role="tab" aria-selected={filter===k} className={filter===k?"on":""} onClick={()=>setFilter(k)}>{t} ({all.filter(fn).length})</button>))}</div>}
      {err&&<div role="alert" style={{fontSize:13,color:"#B42318",fontWeight:700,marginBottom:8}}>{err}</div>}
      {list===null?<div style={{textAlign:"center",padding:20}}><Spinner size={26}/></div>
      :!all.length?<div className="vd-empty">עוד אין פניות. כשלקוח ילחץ "בקשת הצעת מחיר" בפרופיל שלכם, הפנייה תופיע כאן, ומכאן שולחים לו הצעה.</div>
      :!shown.length?<div className="vd-empty">אין פניות בסינון הזה.</div>
      :<div className="vd-lead-list">{shown.map(l=>{
        const st=LEAD_STATUS.find(x=>x[0]===(l.status||"new"))||LEAD_STATUS[0];
        const wa=waLink(l.phone);
        return(
          <div key={l.id} className={`vd-lead${(l.status||"new")==="new"?" on":""}`}>
            <div className="vd-lead-top">
              <b>{l.name}</b>
              <span className="vd-lead-st" style={{color:st[2],background:st[3]}}>{st[1]}</span>
              <span className="vd-lead-at">{new Date(l.created_at).toLocaleDateString("he-IL",{day:"numeric",month:"short"})}</span>
            </div>
            <div className="vd-lead-meta">
              {l.event_date&&<span>📅 {new Date(l.event_date+"T00:00:00").toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}</span>}
              {l.guests>0&&<span>👥 {l.guests} אורחים</span>}
              <span dir="ltr">📱 {l.phone}</span>
            </div>
            {l.message&&<p className="vd-lead-msg">{l.message}</p>}
            {l.quote_price>0&&quoting!==l.id&&<div className="vd-quote">💰 ההצעה שלכם: <b>₪{Number(l.quote_price).toLocaleString()}</b>{l.quote_note&&<span> · {l.quote_note}</span>}</div>}
            {quoting===l.id&&<div className="vd-qform">
              <div className="vd-qrow">
                <label><span>מחיר (₪)</span><input value={q.price} onChange={e=>setQ(x=>({...x,price:e.target.value.replace(/\D/g,"").slice(0,8)}))} inputMode="numeric" placeholder="למשל 6500" autoFocus/></label>
                <label style={{flex:"2 1 220px"}}><span>מה כלול</span><input value={q.note} onChange={e=>setQ(x=>({...x,note:e.target.value}))} maxLength={600} placeholder="למשל: סטילס + וידאו, אלבום, 8 שעות"/></label>
              </div>
              <div className="vd-lead-acts" style={{marginTop:10}}>
                <button type="button" disabled={busy} onClick={()=>saveQuote(l)} className="vd-lead-wa" style={{background:"#2B1D3F",border:"none",cursor:"pointer"}}>{busy?"שומר...":"שמירת ההצעה"}</button>
                <button type="button" onClick={()=>setQuoting(null)} className="vd-lead-btn" style={{border:"none",cursor:"pointer"}}>ביטול</button>
              </div>
            </div>}
            {quoting!==l.id&&<div className="vd-lead-acts">
              <button type="button" onClick={()=>openQuote(l)} className="vd-lead-q">💰 {l.quote_price?"עדכון ההצעה":"שליחת הצעת מחיר"}</button>
              {wa&&<a className="vd-lead-wa" href={`${wa}?text=${encodeURIComponent(`היי ${first(l.name)}, כאן ${business||"הספק"}. קיבלנו את הפנייה שלך מ-Sidor-IL`)}`} target="_blank" rel="noopener noreferrer" onClick={()=>(l.status||"new")==="new"&&patch(l,{status:"contacted"})}><WaIcon size={15}/> וואטסאפ</a>}
              <a className="vd-lead-btn" href={`tel:${l.phone}`} onClick={()=>(l.status||"new")==="new"&&patch(l,{status:"contacted"})}>📞 חיוג</a>
              <select value={l.status||"new"} onChange={e=>patch(l,{status:e.target.value})} aria-label={`שלב הטיפול בפנייה של ${l.name}`} className="vd-lead-sel">
                {LEAD_STATUS.map(([k,t])=><option key={k} value={k}>{t}</option>)}
              </select>
              <button type="button" onClick={()=>del(l)} className="vd-lead-del" aria-label={`מחיקת הפנייה של ${l.name}`}>מחיקה</button>
            </div>}
          </div>);})}
      </div>}
    </div>
  );
}
// אצל הזוג: הפניות ששלחתי לספקים, והצעות המחיר שחזרו
export function MyVendorLeads({ user, vendors }) {
  const [list,setList]=useState([]),[open,setOpen]=useState(false);
  useEffect(()=>{if(!user)return;sb.from("vendor_leads").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100).then(({data})=>setList(data||[]),()=>{});},[user?.id]);
  if(!list.length)return null;
  const byId=Object.fromEntries((vendors||[]).map(v=>[v.user_id,v]));
  const quotes=list.filter(l=>l.quote_price>0).length;
  return(
    <div className="ml-box">
      <button type="button" className="ml-head" onClick={()=>setOpen(o=>!o)} aria-expanded={open}>
        <span>📩 הפניות שלי לספקים ({list.length}){quotes>0&&<em>{quotes===1?"הצעת מחיר אחת":`${quotes} הצעות מחיר`}</em>}</span>
        <span aria-hidden="true">{open?"▲":"▼"}</span>
      </button>
      {open&&<div className="ml-list">{list.map(l=>{const v=byId[l.vendor_id];return(
        <div key={l.id} className="ml-row">
          <div className="ml-top"><b>{v?.business_name||"ספק"}</b><span>{LEAD_FOR_CLIENT[l.status||"new"]||""}</span><small>{new Date(l.created_at).toLocaleDateString("he-IL",{day:"numeric",month:"short"})}</small></div>
          {l.quote_price>0&&<div className="ml-q">💰 ₪{Number(l.quote_price).toLocaleString()}{l.quote_note&&<span> · {l.quote_note}</span>}</div>}
          {v?.phone&&waLink(v.phone)&&<a className="ml-wa" href={`${waLink(v.phone)}?text=${encodeURIComponent(`היי ${v.business_name}, לגבי הפנייה שלי מ-Sidor-IL`)}`} target="_blank" rel="noopener noreferrer"><WaIcon size={14}/> לדבר עם הספק</a>}
        </div>);})}</div>}
    </div>
  );
}
export const ML_CSS=`
  .ml-box{background:#fff;border:1.5px solid #EFE6F7;border-radius:20px;margin-bottom:14px;overflow:hidden}
  .ml-head{all:unset;box-sizing:border-box;width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 16px;cursor:pointer;font:800 15px 'Heebo',sans-serif;color:#2B1D3F}
  .ml-head:focus-visible{outline:2px solid #9B6BFF;outline-offset:-2px}
  .ml-head em{font-style:normal;background:#FFF4DC;color:#7A4E00;border-radius:999px;padding:2px 10px;font-size:12.5px;margin-right:8px}
  .ml-list{display:grid;gap:8px;padding:0 12px 12px}
  .ml-row{background:#FCFAFE;border-radius:14px;padding:10px 12px}
  .ml-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:14px}.ml-top b{color:#2B1D3F}.ml-top span{color:#4A2C8F;font-weight:700;font-size:13px}.ml-top small{margin-right:auto;color:#6E6585}
  .ml-q{margin-top:5px;font-size:14px;color:#7A4E00;font-weight:800}.ml-q span{font-weight:500;color:#3E3555}
  .ml-wa{display:inline-flex;align-items:center;gap:5px;margin-top:7px;background:#15803D;color:#fff;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:800;text-decoration:none}
`;

// רשימת הספקים המאושרים (בתוך המערכת): סינון לפי תחום ואזור, מובילים קודם ואז החדשים
export function SupplierDirectory({ ui, user, event }) {
  const [list,setList]=useState(null),[cat,setCat]=useState(""),[region,setRegion]=useState(""),[q,setQ]=useState(""),[open,setOpen]=useState(null);
  useEffect(()=>{sb.from("vendor_profiles").select("*").eq("status","approved").then(({data})=>setList(data||[]));},[]);
  if(!list)return <div style={{textAlign:"center",padding:40}}><Spinner size={30}/></div>;
  const shown=list.filter(v=>(!cat||v.category===cat)&&(!region||v.region===region||v.region==="all")&&(!q.trim()||(v.business_name+" "+(v.description||"")+" "+(v.city||"")).includes(q.trim())))
    .sort((a,b)=>(isFeatured(b)-isFeatured(a))||String(b.created_at).localeCompare(String(a.created_at)));
  const sel={...ui.inp,flex:"1 1 160px",width:"auto"};
  return(<>
    <style>{ML_CSS}</style>
    <MyVendorLeads user={user} vendors={list}/>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
      <select value={cat} onChange={e=>setCat(e.target.value)} aria-label="תחום" style={sel}><option value="">כל התחומים</option>{SUPPLIER_CATS.map(([k,i,l])=><option key={k} value={k}>{i} {l}</option>)}</select>
      <select value={region} onChange={e=>setRegion(e.target.value)} aria-label="אזור" style={sel}><option value="">כל האזורים</option>{SUPPLIER_REGIONS.filter(([k])=>k!=="all").map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חיפוש לפי שם או עיר" style={sel}/>
    </div>
    {!shown.length?<div style={{...ui.card,textAlign:"center",color:"#6E6585"}}>{list.length?"לא נמצאו ספקים בסינון הזה":"עוד אין ספקים רשומים. בקרוב!"}</div>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>{shown.map(v=><SupplierCard key={v.user_id} v={v} onOpen={setOpen}/>)}</div>}
    <SupplierDetails v={open} onClose={()=>setOpen(null)} user={user} event={event}/>
  </>);
}

// טופס פרטי העסק (הרשמה ועריכה)
export function SupplierForm({ user, profile, priv, onSaved, onCancel }) {
  const [f,setF]=useState(()=>({business_name:"",category:"",contact_name:"",phone:"",email:"",region:"",city:"",website:"",instagram:"",facebook:"",price_from:"",description:"",logo_url:"",photos:[],...(profile||{}),price_from:profile?.price_from??""}));
  const [bt,setBt]=useState(priv?.business_type||""),[bid,setBid]=useState(priv?.business_id||"");
  const [busy,setBusy]=useState(""),[err,setErr]=useState("");
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const inp={width:"100%",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"10px 12px",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff"};
  const lbl=(t,req)=><div style={{fontSize:12,fontWeight:800,color:"#6E6585",marginBottom:5}}>{t}{req&&<span style={{color:"#E53E3E"}}> *</span>}</div>;
  const up=async(files,kind)=>{
    setErr("");
    const list=[...files].slice(0,kind==="logo"?1:6-f.photos.length);
    if(!list.length)return;
    setBusy(kind);
    try{
      const urls=[];for(const file of list)urls.push(await uploadVendorImage(user.id,file,kind==="logo"?400:1400));
      if(kind==="logo")set("logo_url",urls[0]);else setF(x=>({...x,photos:[...x.photos,...urls].slice(0,6)}));
    }catch(e){setErr("❌ ההעלאה נכשלה: "+(e.message||"שגיאה"));}
    setBusy("");
  };
  const save=async()=>{
    setErr("");
    const id=bid.replace(/\D/g,"");
    if(f.business_name.trim().length<2)return setErr("נא למלא שם עסק");
    if(!f.category)return setErr("נא לבחור תחום");
    if(!normPhone(f.phone))return setErr("נא למלא נייד תקין ליצירת קשר");
    if(!bt)return setErr("נא לבחור סוג עסק");
    if(!validIsraeliId(id))return setErr(`מספר ה${bt==="company"||bt==="amuta"?"ח.פ":"ע.מ"} לא תקין (9 ספרות)`);
    setBusy("save");
    const row={user_id:user.id,business_name:f.business_name.trim(),category:f.category,contact_name:f.contact_name.trim()||null,phone:f.phone.trim(),email:f.email.trim()||null,
      region:f.region||null,city:f.city.trim()||null,website:f.website.trim()||null,instagram:f.instagram.trim()||null,facebook:f.facebook.trim()||null,
      price_from:f.price_from===""?null:Math.max(0,parseInt(f.price_from)||0),description:f.description.trim()||null,logo_url:f.logo_url||null,photos:f.photos};
    const{error:e1}=await sb.from("vendor_profiles").upsert(row);
    const{error:e2}=e1?{}:await sb.from("vendor_private").upsert({user_id:user.id,business_type:bt,business_id:id.padStart(9,"0")});
    setBusy("");
    if(e1||e2)return setErr("❌ לא נשמר: "+(e1||e2).message);
    onSaved?.();
  };
  const grid2={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:12};
  return(
    <div style={{background:"#fff",borderRadius:20,padding:"20px",border:"1px solid #F0E8F8",boxShadow:"0 2px 12px rgba(155,107,255,.08)"}}>
      <div style={{fontSize:13,fontWeight:900,color:"#2B1D3F",marginBottom:10}}>🏪 פרטי העסק</div>
      <div style={grid2}>
        <div>{lbl("שם העסק",1)}<input value={f.business_name} onChange={e=>set("business_name",e.target.value)} maxLength={80} placeholder="למשל: סטודיו אור לצילום" style={inp}/></div>
        <div>{lbl("תחום",1)}<select value={f.category} onChange={e=>set("category",e.target.value)} style={inp}><option value="">בחרו תחום…</option>{SUPPLIER_CATS.map(([k,i,l])=><option key={k} value={k}>{i} {l}</option>)}</select></div>
        <div>{lbl("איש קשר")}<input value={f.contact_name} onChange={e=>set("contact_name",e.target.value)} maxLength={60} style={inp}/></div>
        <div>{lbl("נייד (וואטסאפ)",1)}<input value={f.phone} onChange={e=>set("phone",e.target.value)} type="tel" dir="ltr" inputMode="tel" maxLength={20} placeholder="050-0000000" style={{...inp,textAlign:"right"}}/></div>
        <div>{lbl("מייל לפניות (מוצג ללקוחות)")}<input value={f.email} onChange={e=>set("email",e.target.value)} type="email" dir="ltr" maxLength={120} placeholder="business@example.co.il" style={{...inp,textAlign:"right"}}/>
          {user.email&&f.email!==user.email&&<button type="button" onClick={()=>set("email",user.email)} style={{marginTop:5,background:"none",border:"none",padding:0,color:"#7C4DDB",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>השתמש במייל החשבון שלי</button>}</div>
        <div>{lbl("אזור פעילות")}<select value={f.region} onChange={e=>set("region",e.target.value)} style={inp}><option value="">בחרו…</option>{SUPPLIER_REGIONS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>
        <div>{lbl("עיר")}<input value={f.city} onChange={e=>set("city",e.target.value)} maxLength={40} style={inp}/></div>
        <div>{lbl("מחיר החל מ- (₪, רשות)")}<input value={f.price_from} onChange={e=>set("price_from",e.target.value.replace(/\D/g,""))} inputMode="numeric" style={inp}/></div>
      </div>
      <div style={{marginBottom:12}}>{lbl("על העסק")}<textarea value={f.description} onChange={e=>set("description",e.target.value)} maxLength={1000} rows={4} placeholder="מה אתם מציעים, ניסיון, סגנון, מה כלול…" style={{...inp,resize:"vertical",lineHeight:1.7}}/>
        <div style={{fontSize:12,color:"#6E6585",textAlign:"left"}}>{f.description.length}/1000</div></div>
      <div style={grid2}>
        <div>{lbl("אתר")}<input value={f.website} onChange={e=>set("website",e.target.value)} dir="ltr" maxLength={200} placeholder="www.example.co.il" style={{...inp,textAlign:"right"}}/></div>
        <div>{lbl("אינסטגרם")}<input value={f.instagram} onChange={e=>set("instagram",e.target.value)} dir="ltr" maxLength={200} placeholder="instagram.com/…" style={{...inp,textAlign:"right"}}/></div>
        <div>{lbl("פייסבוק")}<input value={f.facebook} onChange={e=>set("facebook",e.target.value)} dir="ltr" maxLength={200} placeholder="facebook.com/…" style={{...inp,textAlign:"right"}}/></div>
      </div>

      <div style={{fontSize:13,fontWeight:900,color:"#2B1D3F",margin:"18px 0 4px"}}>🧾 פרטים עסקיים</div>
      <div style={{fontSize:12,color:"#7A6F8C",marginBottom:10}}>לא מוצג ללקוחות. משמש רק לאימות העסק, ואחרי הבדיקה יופיע בפרופיל "✓ עסק רשום".</div>
      <div style={grid2}>
        <div>{lbl("סוג העסק",1)}<select value={bt} onChange={e=>setBt(e.target.value)} style={inp}><option value="">בחרו…</option>{BUSINESS_TYPES.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>
        <div>{lbl(bt==="company"||bt==="amuta"?"מספר ח.פ":"מספר ע.מ",1)}<input value={bid} onChange={e=>setBid(e.target.value.replace(/\D/g,"").slice(0,9))} inputMode="numeric" dir="ltr" placeholder="9 ספרות" style={{...inp,textAlign:"right"}}/></div>
      </div>

      <div style={{fontSize:13,fontWeight:900,color:"#2B1D3F",margin:"18px 0 8px"}}>🖼️ לוגו ותמונות</div>
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12}}>
        {f.logo_url?<img src={f.logo_url} alt="הלוגו" style={{width:64,height:64,borderRadius:14,objectFit:"cover",border:"1px solid #F0E8F8"}}/>:<span style={{width:64,height:64,borderRadius:14,background:"#F6F0FF",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🏷️</span>}
        <label style={{background:"#F6F0FF",color:"#3A2464",border:"1.5px solid #E6DDF5",borderRadius:12,padding:"9px 14px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
          {busy==="logo"?"מעלה…":f.logo_url?"🔄 החלפת לוגו":"📁 העלאת לוגו"}
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const fl=e.target.files;up(fl,"logo");e.target.value="";}}/>
        </label>
        {f.logo_url&&<button onClick={()=>set("logo_url","")} style={{background:"none",border:"none",color:"#A0AEC0",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>הסרה</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(96px,1fr))",gap:8}}>
        {f.photos.map((p,i)=>(
          <div key={p} style={{position:"relative",paddingTop:"75%",borderRadius:12,overflow:"hidden",background:`#F6F0FF url("${p}") center/cover`}}>
            <button onClick={()=>set("photos",f.photos.filter((_,j)=>j!==i))} aria-label={`הסרת תמונה ${i+1}`} style={{position:"absolute",top:4,left:4,background:"rgba(0,0,0,.55)",color:"#fff",border:"none",borderRadius:8,width:24,height:24,cursor:"pointer",fontSize:12}}>✕</button>
            {i===0&&<span style={{position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,.55)",color:"#fff",borderRadius:6,padding:"1px 6px",fontSize:12,fontWeight:800}}>ראשית</span>}
          </div>
        ))}
        {f.photos.length<6&&<label style={{border:"2px dashed #E6DDF5",borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,minHeight:72,cursor:"pointer",color:"#7A6F8C",fontSize:12,fontWeight:800}}>
          {busy==="photos"?"מעלה…":<><span style={{fontSize:22}}>＋</span>תמונה ({f.photos.length}/6)</>}
          <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{const fl=e.target.files;up(fl,"photos");e.target.value="";}}/>
        </label>}
      </div>

      {err&&<div role="alert" style={{marginTop:12,background:"#FFF5F5",border:"1px solid #FED7D7",color:"#C53030",borderRadius:12,padding:"9px 12px",fontSize:13,fontWeight:700}}>{err}</div>}
      <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
        <button onClick={save} disabled={!!busy} className="sx-btn sx-btn-primary" style={{flex:"1 1 200px",background:GRAD,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",opacity:busy?.6:1}}>
          {busy==="save"?"שומר…":profile?"💾 שמירת השינויים":"🚀 פרסום הפרופיל"}
        </button>
        {onCancel&&<button onClick={onCancel} style={{background:"#fff",color:"#3A2464",border:"1.5px solid #E6DDF5",borderRadius:14,padding:"13px 18px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>}
      </div>
      {/* הודעה לפי סעיף 11 לחוק הגנת הפרטיות (תיקון 13) */}
      <div style={{fontSize:12,color:"#5F5675",marginTop:10,lineHeight:1.6}}>
        בשליחה אתם מאשרים שהפרטים נכונים ושמותר לפרסם את פרטי העסק, פרטי הקשר והתמונות באתר, לפי <a href="#/terms" style={{color:C.blue}}>תנאי השימוש</a>.
        אין חובה חוקית למסור את הפרטים, אך בלעדיהם לא נוכל להציג את העסק. מספר ע.מ / ח.פ משמש לאימות העסק בלבד, אינו מוצג לאף אחד ונשמר רק אצלנו. בעל השליטה במידע: Sidor-IL (sidoril2026@gmail.com). אפשר לעיין בפרטים, לתקן אותם או למחוק את הפרופיל, לפי <a href="#/privacy" style={{color:C.blue}}>מדיניות הפרטיות</a>.
      </div>
    </div>
  );
}

// לוח הספק: סטטוס, תצוגה מקדימה, עריכה ושדרוג לספק מוביל
export function SupplierHome({ user, onLogout, onEvents, onBackToLanding }) {
  const [p,setP]=useState(undefined),[priv,setPriv]=useState(null),[edit,setEdit]=useState(false),[open,setOpen]=useState(null),[activated,setActivated]=useState(false);
  const load=async()=>{
    const [{data:a},{data:b},{data:c}]=await Promise.all([sb.from("vendor_profiles").select("*").eq("user_id",user.id).maybeSingle(),sb.from("vendor_private").select("*").eq("user_id",user.id).maybeSingle(),sb.from("user_packages").select("package_id").eq("user_id",user.id).eq("package_id","vendor")]);
    setP(a||null);setPriv(b||null);setActivated(!!(c||[]).length);
  };
  useEffect(()=>{load();},[user.id]);
  // הספק מוחק את הפרופיל בעצמו (זכות המחיקה): הפרטים העסקיים נמחקים איתו (on delete cascade)
  const removeProfile=async()=>{
    if(!window.confirm(`למחוק לצמיתות את הפרופיל של "${p?.business_name||"העסק"}" מהמדריך?\nהפרטים, התמונות ומספר העוסק יימחקו, ואי אפשר לשחזר.`))return;
    const{error}=await sb.from("vendor_profiles").delete().eq("user_id",user.id);
    if(error){alert("המחיקה נכשלה: "+error.message);return;}
    // גם הלוגו והתמונות (vendors/<uid>/...) נמחקים מהאחסון
    try{const st=sb.storage.from("event-images"),{data:files}=await st.list(`vendors/${user.id}`,{limit:100});
      if(files?.length)await st.remove(files.map(f=>`vendors/${user.id}/${f.name}`));}catch{}
    setP(null);setPriv(null);setEdit(false);
  };
  const upgrade=()=>openContact(`היי, אני ${p?.business_name||"ספק"} (${SUPPLIER_CAT[p?.category]?.label||""}) ב-Sidor-IL ואשמח לשמוע על שדרוג לספק מוביל`,"שדרוג לספק מוביל");
  const status=p&&({pending:{bg:"#FFF8E8",b:"#F5DDA6",c:"#8A5A00",t:"⏳ הפרופיל ממתין לאישור",s:"נבדוק את הפרטים בדרך כלל תוך יום-יומיים, ואז הפרופיל יופיע ללקוחות."},
    approved:{bg:"#E9FBF4",b:"#BDEFDD",c:"#17694F",t:"✓ הפרופיל מוצג ללקוחות",s:isFeatured(p)?`⭐ ספק מוביל${p.featured_until?` עד ${new Date(p.featured_until).toLocaleDateString("he-IL")}`:""}`:"זוגות ומשפחות שמתכננים אירוע רואים אתכם ברשימת הספקים."},
    rejected:{bg:"#FFF5F5",b:"#FED7D7",c:"#C53030",t:"✗ הפרופיל לא אושר",s:p.reject_reason||"תקנו את הפרטים ושלחו שוב."}}[p.status]);
  const navActs=inMenu=>(<>
    <button type="button" className={inMenu?"lp-btn lp-primary":"lp-btn lp-navbtn lp-ghost"} onClick={onEvents} style={inMenu?undefined:{padding:"9px 20px",fontSize:14,minHeight:44}}>{inMenu?"האירועים שלי":<><span className="lp-lg">האירועים שלי</span><span className="lp-sm">האירועים</span></>}</button>
    <button type="button" className={inMenu?"lp-btn lp-ghost":"lp-nav-link lp-hide-sm"} onClick={onLogout} style={inMenu?undefined:{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>התנתקות</button>
  </>);
  return(
    <PublicPage pageKey="vendor-area" actions={navActs}>
      <style>{VD_CSS}</style>
      <section className="vd-hero">
        <span className="vd-blob a" aria-hidden="true"/><span className="vd-blob b" aria-hidden="true"/>
        <div className="vd-in">
          <h1>{!p&&activated?<>החשבון שלך <span className="lp-grad">הופעל</span></>:!p?<>ברוכים הבאים, <span className="lp-grad">ספקים</span></>:<>אזור <span className="lp-grad">הספקים</span></>}</h1>
          <p>{!p&&activated?"החשבון שלך פתוח כחשבון ספק. נשאר צעד אחד: ממלאים כאן את פרטי העסק ולוחצים \"פרסום הפרופיל\". הפרופיל עולה מיד, ומהדף הזה מנהלים פניות והצעות מחיר."
            :!p?"ממלאים פעם אחת את פרטי העסק, והפרופיל עולה מיד לכל מי שמתכנן אירוע ב-Sidor-IL."
            :"כאן מנהלים את העסק: פניות מלקוחות, הצעות מחיר, והפרופיל כמו שהלקוחות רואים אותו."}</p>
          {!p&&<div className="vd-chips">{activated?<><span>✓ החשבון הופעל</span><span>📝 פרטי העסק, פעם אחת</span><span>📩 פניות והצעות מחיר במקום אחד</span></>
            :<><span>🆓 פרופיל עסק בחינם</span><span>💍 מול זוגות ומשפחות שמתכננים אירוע</span><span>⚡ הפרופיל עולה מיד</span></>}</div>}
        </div>
      </section>
      <div className="vd-body">
        {p===undefined?<div style={{textAlign:"center",padding:60}}><Spinner size={34}/></div>
        :!p||edit?<div className="vd-form">
          <SupplierForm user={user} profile={p} priv={priv} onSaved={()=>{setEdit(false);load();}} onCancel={p?()=>setEdit(false):null}/>
        </div>:<>
          <div className="vd-status" style={{background:status.bg,borderColor:status.b}}>
            <b style={{color:status.c}}>{status.t}</b>
            <span>{status.s}</span>
          </div>
          {p.status==="approved"?<VendorLeads user={user} business={p.business_name}/>
            :<div className="vd-card vd-leads"><div className="vd-h">📩 פניות והצעות מחיר</div><div className="vd-empty">אחרי שנאשר את הפרופיל, כאן יופיעו פניות מלקוחות, ומכאן שולחים להם הצעות מחיר ומנהלים את הטיפול.</div></div>}
          <div className="vd-grid">
            <div className="vd-card">
              <div className="vd-h">ככה הלקוחות רואים אתכם</div>
              <SupplierCard v={p} onOpen={setOpen}/>
              <div className="vd-acts">
                <button onClick={()=>setEdit(true)} className="lp-btn lp-primary">✏️ עריכת הפרופיל</button>
                <button onClick={()=>setOpen(p)} className="lp-btn lp-ghost">👁 תצוגה מלאה</button>
              </div>
              <button onClick={removeProfile} className="vd-del">מחיקת הפרופיל מהמדריך</button>
            </div>
            <div className="vd-card vd-up">
              <div className="vd-h">⭐ שדרוג לספק מוביל</div>
              <ul><li>מופיעים ראשונים ברשימת הספקים</li><li>מופיעים בדף הבית של Sidor-IL</li><li>תג "ספק מוביל" בולט על הכרטיס</li></ul>
              <button onClick={upgrade} className="vd-wa"><WaIcon size={17}/> דברו איתנו על שדרוג</button>
            </div>
          </div>
        </>}
        <div style={{textAlign:"center",marginTop:30}}>
          <button onClick={onEvents} className="vd-link">📅 מתכננים גם אירוע? מעבר לאירועים שלי</button>
        </div>
      </div>
      <SupplierDetails v={open} onClose={()=>setOpen(null)} own/>
    </PublicPage>
  );
}
// אזור הספקים: עיצוב בשפה של דף הבית
export const VD_CSS=`
  .vd-hero{position:relative;overflow:hidden;isolation:isolate;margin:96px 2vw 30px;border-radius:44px;padding:60px 6vw;background:linear-gradient(150deg,#EFE4FF 0%,#FFE4F0 55%,#FFE9DC 100%)}
  .vd-in{max-width:1120px;margin:0 auto}
  .vd-hero h1{font:900 clamp(34px,4.6vw,58px)/1.08 'Fredoka','Heebo',sans-serif;color:#2B1D3F;margin:0 0 14px;letter-spacing:-.02em}
  .vd-hero p{font-size:18px;line-height:1.7;color:#3A2F50;max-width:56ch;margin:0}
  .vd-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
  .vd-chips span{background:#fff;border-radius:999px;padding:10px 16px;font:700 14.5px 'Fredoka','Heebo',sans-serif;color:#2B1D3F;box-shadow:0 12px 24px -16px rgba(60,35,110,.55)}
  .vd-blob{position:absolute;z-index:-1;border-radius:50%;background:rgba(255,255,255,.55)}
  .vd-blob.a{width:260px;height:260px;left:-60px;top:-80px}.vd-blob.b{width:140px;height:140px;left:22%;bottom:-50px}
  .vd-body{max-width:900px;margin:0 auto 80px;padding:0 16px}
  .vd-form > div{border-radius:32px!important;border:none!important;box-shadow:0 26px 54px -32px rgba(91,60,140,.5)!important;padding:30px!important}
  .vd-form [style*="font-size: 13px"][style*="font-weight: 900"]{font-family:'Fredoka','Heebo',sans-serif!important;font-size:19px!important;font-weight:700!important;margin:6px 0 14px!important}
  .vd-form input:not([type=file]):not([type=checkbox]),.vd-form select,.vd-form textarea{border-radius:16px!important;border:1.5px solid #E6DDF5!important;min-height:46px;color:#2B1D3F}
  .vd-form input:focus,.vd-form select:focus,.vd-form textarea:focus{border-color:#9B6BFF!important;box-shadow:0 0 0 4px rgba(155,107,255,.16)}
  .vd-form button{font-family:'Fredoka','Heebo',sans-serif}
  .vd-status{border:1.5px solid;border-radius:24px;padding:16px 20px;margin-bottom:18px;display:flex;flex-direction:column;gap:3px}
  .vd-status b{font:700 18px 'Fredoka','Heebo',sans-serif}
  .vd-status span{font-size:14.5px;color:#3E3555}
  .vd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;align-items:start}
  .vd-card{background:#fff;border-radius:32px;padding:22px;box-shadow:0 26px 54px -34px rgba(91,60,140,.5)}
  .vd-h{font:700 18px 'Fredoka','Heebo',sans-serif;color:#2B1D3F;margin-bottom:12px}
  .vd-acts{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
  .vd-acts .lp-btn{flex:1;min-height:46px;padding:0 16px;font-size:15px}
  .vd-del{margin-top:12px;background:none;border:none;padding:6px 0;color:#B42318;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:underline}
  .vd-up{background:linear-gradient(135deg,#FFF6E2,#FFF0F6)}
  .vd-up ul{margin:0 0 16px;padding:0 18px 0 0;font-size:15px;line-height:1.9;color:#3A2F50}
  .vd-wa{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;background:#15803D;color:#fff;border:none;border-radius:999px;font:700 16px 'Fredoka','Heebo',sans-serif;cursor:pointer}
  .vd-link{background:none;border:none;color:#5B2FA8;font:700 15px 'Fredoka','Heebo',sans-serif;cursor:pointer;text-decoration:underline}
  .vd-leads{margin-bottom:18px}
  .vd-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
  .vd-stats div{background:#FCFAFE;border:1.5px solid #EFE6F7;border-radius:18px;padding:12px 14px;min-width:0}
  .vd-stats b{display:block;font:700 26px 'Fredoka','Heebo',sans-serif;color:#2B1D3F;line-height:1.1}
  .vd-stats span{font-size:13px;color:#5E5470;font-weight:700}
  .vd-filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
  .vd-filters button{border:none;border-radius:999px;padding:8px 14px;font:700 13.5px 'Heebo',sans-serif;background:#F6F0FF;color:#3A2464;cursor:pointer;min-height:36px}
  .vd-filters button.on{background:#2B1D3F;color:#fff}
  .vd-quote{margin-top:8px;background:#FFF8E8;border-radius:14px;padding:8px 12px;font-size:14px;color:#7A4E00}
  .vd-quote span{color:#3E3555}
  .vd-qform{margin-top:10px;background:#FFF8E8;border-radius:18px;padding:12px}
  .vd-qrow{display:flex;flex-wrap:wrap;gap:10px}
  .vd-qrow label{flex:1 1 140px;display:flex;flex-direction:column;gap:4px;font-size:12.5px;font-weight:800;color:#3E3555}
  .vd-qrow input{border:1.5px solid #F0D9A8;border-radius:14px;padding:9px 12px;font:500 14.5px 'Heebo',sans-serif;min-height:42px;background:#fff;color:#2B1D3F;outline:none}
  .vd-qrow input:focus{border-color:#E8B04A;box-shadow:0 0 0 3px rgba(232,176,74,.2)}
  .vd-lead-q{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;border:none;background:linear-gradient(135deg,#FFD9A0,#FFB6C9);color:#4A2A00;font:700 14px 'Fredoka','Heebo',sans-serif;cursor:pointer}
  @media(max-width:700px){.vd-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .vd-new{background:#C2185B;color:#fff;border-radius:999px;padding:3px 11px;font:700 13px 'Fredoka','Heebo',sans-serif}
  .vd-empty{background:#FCFAFE;border:1.5px dashed #E6DDF5;border-radius:20px;padding:18px;text-align:center;color:#5E5470;font-size:14.5px;line-height:1.6}
  .vd-lead-list{display:grid;gap:12px}
  .vd-lead{border:1.5px solid #EFE6F7;border-radius:22px;padding:14px 16px;background:#fff}
  .vd-lead.on{border-color:#F7B6D2;background:linear-gradient(135deg,#FFF6FA,#fff 60%)}
  .vd-lead-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .vd-lead-top b{font:700 17px 'Fredoka','Heebo',sans-serif;color:#2B1D3F}
  .vd-lead-st{border-radius:999px;padding:3px 10px;font-size:12.5px;font-weight:800}
  .vd-lead-at{margin-right:auto;font-size:12.5px;color:#6E6585}
  .vd-lead-meta{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:6px;font-size:14px;color:#3E3555}
  .vd-lead-msg{margin:8px 0 0;font-size:14px;line-height:1.7;color:#3A2F50;white-space:pre-line;background:#FCFAFE;border-radius:14px;padding:8px 12px}
  .vd-lead-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center}
  .vd-lead-wa,.vd-lead-btn{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;font:700 14px 'Fredoka','Heebo',sans-serif;text-decoration:none}
  .vd-lead-wa,.vd-leads a.vd-lead-wa{background:#15803D;color:#fff}.vd-lead-btn,.vd-leads a.vd-lead-btn{background:#F6F0FF;color:#3A2464}
  .vd-lead-sel{min-height:40px;border:1.5px solid #E6DDF5;border-radius:999px;padding:0 12px;font:600 14px 'Heebo',sans-serif;color:#2B1D3F;background:#fff}
  .vd-lead-del{background:none;border:none;color:#B42318;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:underline;margin-right:auto}
  @media(max-width:700px){.vd-hero{margin:86px 8px 20px;border-radius:32px;padding:34px 22px}.vd-hero p{font-size:16px}.vd-form > div{padding:18px!important;border-radius:26px!important}}
`;

export function VendorsScreen({ user, event, mobile }) {
  const [tab,setTab]=useState("suppliers");
  const [prices,setPrices]=useState(null),[reviews,setReviews]=useState(null),[err,setErr]=useState("");
  const load=async()=>{
    const [p,r]=await Promise.all([sb.from("plate_prices").select("*").order("created_at",{ascending:false}).limit(3000),sb.from("vendor_reviews").select("*").order("created_at",{ascending:false}).limit(3000)]);
    if(p.error||r.error)setErr((p.error||r.error).message);
    setPrices((p.data||[]).filter(x=>!x.hidden));setReviews((r.data||[]).filter(x=>!x.hidden));
  };
  useEffect(()=>{load();},[]);
  const card={background:"#fff",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(155,107,255,.08)",border:"1px solid #F0E8F8"};
  const inp={width:"100%",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"10px 12px",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff"};
  const lbl=t=><div style={{fontSize:12,fontWeight:800,color:"#6E6585",marginBottom:5}}>{t}</div>;
  const btn={background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:"11px 18px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"};
  return(
    <div dir="rtl" style={{padding:mobile?14:24,maxWidth:1000,margin:"0 auto",fontFamily:"'Heebo',sans-serif",paddingBottom:90}}>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:22,fontWeight:900,color:"#2B1D3F"}}>💡 ספקים ומחירים</div>
        <div style={{fontSize:13,color:"#6E6585",marginTop:2}}>מה שילמו זוגות אחרים, והמלצות על ספקים — מהקהילה של Sidor-IL. עוזר להשוות ולהתמקח.</div>
      </div>
      <div role="tablist" style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["suppliers","🏪 ספקים"],["prices","🍽️ מחירי מנות"],["reviews","⭐ המלצות על ספקים"]].map(([k,l])=>(
          <button key={k} role="tab" aria-selected={tab===k} onClick={()=>setTab(k)} style={{flex:mobile?1:"none",background:tab===k?"#2B1D3F":"#fff",color:tab===k?"#fff":"#2B1D3F",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"10px 18px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",minHeight:44}}>{l}</button>
        ))}
      </div>
      {err&&<div role="alert" style={{...card,color:"#C53030",marginBottom:12}}>⚠️ {err}</div>}
      {tab==="suppliers"?<SupplierDirectory ui={{card,inp,lbl,btn,mobile}} user={user} event={event}/>
        :prices===null?<div style={{textAlign:"center",padding:40}}><Spinner size={32}/></div>
        :tab==="prices"?<PlatePrices user={user} event={event} prices={prices} onAdded={load} ui={{card,inp,lbl,btn,mobile}}/>
        :<VendorReviews user={user} reviews={reviews} onAdded={load} ui={{card,inp,lbl,btn,mobile}}/>}
    </div>
  );
}

// הערכת שוק למחיר מנה (אולם רגיל, עונת שיא) לפי מדריכי מחירים שפורסמו ברשת לשנת 2026.
// מוצג בנפרד מדיווחי הקהילה, ומשמש להשוואה כשאין עדיין דיווחים
export const MARKET_PRICES={
  north:{label:"צפון",lo:200,hi:330,places:"חיפה, הקריות, העמקים, הגליל"},
  center:{label:"מרכז ושרון",lo:280,hi:450,places:"תל אביב, גוש דן, השרון"},
  jerusalem:{label:"ירושלים",lo:240,hi:400,places:"ירושלים והסביבה"},
  south:{label:"דרום",lo:200,hi:330,places:"באר שבע, אשדוד, אשקלון"},
};
export const REGION_WORDS={
  north:["חיפה","קריית","קרית","עפולה","נצרת","נוף הגליל","כרמיאל","טבריה","צפת","נהריה","עכו","יקנעם","עמק","גליל","טבעון","מגדל העמק","בית שאן","זכרון","זיכרון","חדרה","קיסריה","שפרעם","מעלות"],
  south:["באר שבע","אשדוד","אשקלון","אילת","נתיבות","אופקים","שדרות","דימונה","ערד","קריית גת","קרית גת","קריית מלאכי","נגב","ירוחם","מצפה רמון"],
  jerusalem:["ירושלים","בית שמש","מבשרת","מעלה אדומים","גוש עציון","אבו גוש"],
};
export const guessRegion=s=>{const t=String(s||"");return Object.keys(REGION_WORDS).find(r=>REGION_WORDS[r].some(w=>t.includes(w)))||"center";};
// מאגר שמתעדכן: מ-REGION_MIN_REPORTS דיווחים באזור, הטווח מחושב מהקהילה (רבעון תחתון–עליון) במקום הערכת השוק
export const REGION_MIN_REPORTS=5;
export const quantile=(a,p)=>{const s=[...a].sort((x,y)=>x-y),i=(s.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return s[lo]+(s[hi]-s[lo])*(i-lo);};
export const regionStats=prices=>Object.fromEntries(Object.entries(MARKET_PRICES).map(([k,m])=>{
  const v=prices.filter(p=>!p.flagged&&guessRegion(`${p.city||""} ${p.venue_name||""}`)===k).map(p=>Number(p.price));
  if(v.length<REGION_MIN_REPORTS)return [k,{...m,n:v.length,community:false}];
  return [k,{...m,lo:Math.round(quantile(v,.25)),hi:Math.round(quantile(v,.75)),mid:Math.round(medianOf(v)),n:v.length,community:true}];
}));

// בחירה: לפרסם בעילום שם או עם השם הפרטי
export const firstNameOf=u=>String(u?.user_metadata?.full_name||u?.user_metadata?.name||"").trim().split(/\s+/)[0]||"";
export function NameChoice({ anon, name, onChange, inp }) {
  const pill=on=>({flex:1,background:on?"#2B1D3F":"#fff",color:on?"#fff":"#2B1D3F",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"9px 10px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",minHeight:44});
  return(<div>
    <div style={{fontSize:12,fontWeight:800,color:"#6E6585",marginBottom:5}}>איך לפרסם?</div>
    <div role="radiogroup" aria-label="איך לפרסם" style={{display:"flex",gap:8}}>
      <button type="button" role="radio" aria-checked={anon} onClick={()=>onChange({anon:true,name})} style={pill(anon)}>🕶️ בעילום שם</button>
      <button type="button" role="radio" aria-checked={!anon} onClick={()=>onChange({anon:false,name})} style={pill(!anon)}>👤 עם השם שלי</button>
    </div>
    {!anon&&<input value={name} onChange={e=>onChange({anon,name:e.target.value})} maxLength={30} placeholder="השם שיוצג (למשל: נועה)" aria-label="השם שיוצג" style={{...inp,marginTop:8}}/>}
  </div>);
}

export function PlatePrices({ user, event, prices, onAdded, ui }) {
  const {card,inp,lbl,btn,mobile}=ui;
  const [q,setQ]=useState(event.venue||""),[quote,setQuote]=useState(""),[open,setOpen]=useState(false),[msg,setMsg]=useState(null),[busy,setBusy]=useState(false);
  const [f,setF]=useState({venue_name:event.venue||"",city:"",event_date:event.date||"",guests:"",price:"",event_type:EVENT_TYPE_LABELS[event.event_type]?event.event_type:"wedding",includes:"",anon:true,author_name:firstNameOf(user)});
  const venues=[...new Set(prices.map(p=>p.venue_name))];
  const nq=normName(q);
  const list=nq?prices.filter(p=>normName(p.venue_name).includes(nq)||normName(p.city).includes(nq)):prices;
  // הסטטיסטיקה בלי דיווחים "בבדיקה" — חריג לא מזיז את המחיר המקובל (חציון) עד שאושר
  const ok=list.filter(p=>!p.flagged);
  const vals=ok.map(p=>Number(p.price));
  const med=medianOf(vals);
  const groups=["א׳–ד׳","חמישי","שישי","מוצ״ש"].map(g=>{const v=ok.filter(p=>dayGroup(p.event_date)===g).map(p=>Number(p.price));return [g,medianOf(v),v.length];}).filter(x=>x[2]);
  const qv=Number(quote);
  const diff=med&&qv>0?Math.round((qv-med)/med*100):null;
  // אזור להערכת השוק: לפי מה שחיפשו / כתובת האולם, ואפשר להחליף
  const [regionPick,setRegionPick]=useState(null);
  const region=regionPick||guessRegion(`${q} ${list[0]?.city||""} ${event.venue_address||""}`);
  const regions=regionStats(prices);
  const mk=regions[region];
  const submit=async()=>{
    const price=Number(f.price),guests=Number(f.guests);
    if(normName(f.venue_name).length<2||!f.event_date||!(price>0)||!(guests>0)){setMsg({err:true,t:"מלאו שם אולם, תאריך, מספר אורחים ומחיר למנה"});return;}
    setBusy(true);setMsg(null);
    const{data,error}=await sb.from("plate_prices").insert({venue_name:f.venue_name.trim(),city:f.city.trim()||null,event_date:f.event_date,guests,price,event_type:f.event_type,includes:f.includes.trim()||null,author_name:f.anon?null:(f.author_name.trim().slice(0,30)||null),user_id:user.id}).select().single();
    setBusy(false);
    if(error){setMsg({err:true,t:"השמירה נכשלה: "+error.message});return;}
    setMsg({err:false,t:data?.flagged?"✅ פורסם. המחיר שונה מהותית מהדיווחים האחרים, אז הוא מסומן \"בבדיקה\" עד שנעבור עליו.":"✅ תודה! המחיר פורסם ויעזור לזוגות אחרים."});
    setOpen(false);setQ(f.venue_name.trim());onAdded();
  };
  return(<>
    {/* השוואה */}
    <div style={{...card,marginBottom:14}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"2fr 1fr",gap:12}}>
        <div>{lbl("אולם או עיר")}<input value={q} onChange={e=>setQ(e.target.value)} list="pp-venues" placeholder="למשל: אולמי הגן, חיפה..." style={inp}/>
          <datalist id="pp-venues">{venues.map(v=><option key={v} value={v}/>)}</datalist></div>
        <div>{lbl("ההצעה שקיבלתם (₪ למנה)")}<input value={quote} onChange={e=>setQuote(e.target.value.replace(/[^\d.]/g,""))} inputMode="decimal" placeholder="למשל 320" style={inp}/></div>
      </div>
      {ok.length?(<>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}>
          {[["מחיר",`₪${Math.round(med)}`],["טווח",`₪${Math.round(Math.min(...vals))}–${Math.round(Math.max(...vals))}`],["דיווחים",ok.length]].map(([l,v])=>(
            <div key={l} style={{flex:"1 1 120px",background:"#FBF8FD",borderRadius:14,padding:"10px 14px"}}><div style={{fontSize:12,color:"#6E6585",fontWeight:700}}>{l}</div><div style={{fontSize:20,fontWeight:900,color:"#2B1D3F",fontVariantNumeric:"tabular-nums"}}>{v}</div></div>
          ))}
        </div>
        {groups.length>1&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
          {groups.map(([g,m,n])=><span key={g} style={{background:"#F4EEFF",color:"#5B3C8C",borderRadius:100,padding:"4px 11px",fontSize:12,fontWeight:800}}>{g}: ₪{Math.round(m)} <span style={{fontWeight:600,color:"#8A7AA8"}}>({n})</span></span>)}
        </div>}
        {diff!==null&&<div style={{marginTop:12,borderRadius:14,padding:"12px 14px",fontSize:14,lineHeight:1.7,background:diff>8?"#FFF5F5":diff<-8?"#F0FFF4":"#F7F7FB",border:`1px solid ${diff>8?"#FED7D7":diff<-8?"#9AE6B4":"#E2E8F0"}`,color:"#2B1D3F"}}>
          {diff>8?<><b>ההצעה שלכם גבוהה ב-{diff}%</b> מהמחיר המקובל לפי {ok.length} דיווחים. 💡 טיפ למשא ומתן: ציינו שבאירועים דומים שילמו כ-₪{Math.round(med)} למנה{groups.length>1?", ובדקו אם יום אחר בשבוע זול יותר":""}.</>
            :diff<-8?<><b>ההצעה שלכם נמוכה ב-{-diff}%</b> מהמחיר המקובל. נשמע כמו מחיר טוב 👍 ודאו מה כלול במנה.</>
            :<>ההצעה שלכם <b>קרובה למחיר המקובל</b> (₪{Math.round(med)}). אפשר לנסות לבקש תוספת בלי תשלום, כמו בר או קבלת פנים מורחבת.</>}
        </div>}
      </>):<div style={{marginTop:14,color:"#6E6585",fontSize:14}}>{prices.length?"אין עדיין דיווחים מהקהילה שמתאימים לחיפוש. בינתיים אפשר להשוות להערכת השוק למטה.":"עוד אין דיווחים מהקהילה. בינתיים אפשר להשוות להערכת השוק למטה 👇"}</div>}
    </div>

    {/* הערכת שוק לפי אזור (מפרסומים ברשת) */}
    <div style={{...card,marginBottom:14}}>
      <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F"}}>📊 מחיר מנה מקובל לפי אזור</div>
      <div style={{fontSize:12,color:"#6E6585",marginBottom:10}}>מתעדכן מדיווחי הקהילה: באזור עם {REGION_MIN_REPORTS} דיווחים ומעלה — הטווח לפי מה שזוגות שילמו בפועל. עד אז — הערכת שוק 2026 ממדריכי מחירים ברשת (אולם רגיל, עונת שיא).</div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:8}}>
        {Object.entries(regions).map(([k,m])=>(
          <button key={k} onClick={()=>setRegionPick(k)} aria-pressed={region===k} style={{textAlign:"right",background:region===k?"linear-gradient(135deg,#FFF1F7,#F4EEFF)":"#fff",border:`1.5px solid ${region===k?"#C9A7F5":"#EDE6F5"}`,borderRadius:14,padding:"10px 12px",cursor:"pointer",fontFamily:"inherit"}}>
            <div style={{fontSize:13,fontWeight:900,color:"#2B1D3F"}}>{m.label}</div>
            <div style={{fontSize:17,fontWeight:900,color:"#9147D6",fontVariantNumeric:"tabular-nums"}}>₪{m.lo}–{m.hi}</div>
            <div style={{fontSize:12,fontWeight:800,color:m.community?"#1F8F6C":"#B07A12",marginTop:2}}>{m.community?`👥 לפי ${m.n} דיווחים`:`📊 הערכת שוק${m.n?` · ${m.n}/${REGION_MIN_REPORTS} דיווחים`:""}`}</div>
            <div style={{fontSize:12,color:"#6E6585",lineHeight:1.4}}>{m.places}</div>
          </button>
        ))}
      </div>
      {qv>0&&!ok.length&&<div style={{marginTop:12,borderRadius:14,padding:"12px 14px",fontSize:14,lineHeight:1.7,color:"#2B1D3F",background:qv>mk.hi?"#FFF5F5":qv<mk.lo?"#F0FFF4":"#F7F7FB",border:`1px solid ${qv>mk.hi?"#FED7D7":qv<mk.lo?"#9AE6B4":"#E2E8F0"}`}}>
        {qv>mk.hi?<><b>₪{qv} גבוה מהטווח המקובל ב{mk.label}</b> (₪{mk.lo}–{mk.hi}), בכ-{Math.round((qv-mk.hi)/mk.hi*100)}%. 💡 שווה להתמקח, לבדוק יום אחר בשבוע, או לברר מה כלול במנה.</>
          :qv<mk.lo?<><b>₪{qv} נמוך מהטווח המקובל ב{mk.label}</b> (₪{mk.lo}–{mk.hi}). נשמע כמו מחיר טוב 👍 ודאו מה כלול במנה.</>
          :<><b>₪{qv} בתוך הטווח המקובל ב{mk.label}</b> (₪{mk.lo}–{mk.hi}). אפשר לנסות לבקש תוספת בלי תשלום, כמו בר או קבלת פנים מורחבת.</>}
      </div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
        {["🗓️ א׳–ד׳ זול בדרך כלל ב-10%–25%","🔥 חמישי יקר יותר ב-15%–25%","❄️ בחורף (נובמבר–פברואר) הנחות של עד 20%–40%","🌳 גני אירועים ובוטיק — יקרים יותר"].map(t=>(
          <span key={t} style={{background:"#FBF8FD",border:"1px solid #EFE8F7",borderRadius:100,padding:"4px 11px",fontSize:12,fontWeight:700,color:"#5B3C8C"}}>{t}</span>
        ))}
      </div>
      <div style={{fontSize:12,color:"#6E6585",marginTop:8}}>* הטווח הוא הערכה. המחיר בפועל משתנה לפי האולם, התאריך ומה שכלול במנה. כל דיווח שלכם משפר את הדיוק לכולם 🙏</div>
    </div>

    {/* שיתוף מחיר */}
    {!open?<button onClick={()=>{setOpen(true);setMsg(null);}} style={{...btn,width:"100%",marginBottom:14,minHeight:48}}>➕ שתפו כמה שילמתם למנה (אנונימי)</button>
    :<div style={{...card,marginBottom:14,border:"1.5px solid #E9D8FD"}}>
      <div style={{fontSize:16,fontWeight:900,marginBottom:4}}>שיתוף מחיר מנה</div>
      <div style={{fontSize:12,color:"#6E6585",marginBottom:12}}>עוזר לזוגות אחרים להתמקח. בחרו אם להציג את השם הפרטי שלכם או לפרסם בעילום שם.</div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:10}}>
        <div>{lbl("שם האולם *")}<input value={f.venue_name} onChange={e=>setF(x=>({...x,venue_name:e.target.value}))} list="pp-venues" style={inp}/></div>
        <div>{lbl("עיר")}<input value={f.city} onChange={e=>setF(x=>({...x,city:e.target.value}))} style={inp}/></div>
        <div>{lbl("תאריך האירוע *")}<input type="date" value={f.event_date} onChange={e=>setF(x=>({...x,event_date:e.target.value}))} style={inp}/>
          {f.event_date&&<div style={{fontSize:12,color:"#6E6585",marginTop:3}}>יום {HEB_DAYS[new Date(f.event_date+"T12:00:00").getDay()]}</div>}</div>
        <div>{lbl("מספר אורחים *")}<input value={f.guests} onChange={e=>setF(x=>({...x,guests:e.target.value.replace(/\D/g,"")}))} inputMode="numeric" style={inp}/></div>
        <div>{lbl("מחיר למנה (₪) *")}<input value={f.price} onChange={e=>setF(x=>({...x,price:e.target.value.replace(/[^\d.]/g,"")}))} inputMode="decimal" style={inp}/></div>
        <div>{lbl("סוג האירוע")}<select value={f.event_type} onChange={e=>setF(x=>({...x,event_type:e.target.value}))} style={inp}>{Object.entries(EVENT_TYPE_LABELS).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>
        <div style={{gridColumn:mobile?"auto":"1 / -1"}}>{lbl("מה כלול במחיר")}<input value={f.includes} onChange={e=>setF(x=>({...x,includes:e.target.value}))} maxLength={200} placeholder="למשל: בר פתוח, קבלת פנים, ללא עיצוב" style={inp}/></div>
        <div style={{gridColumn:mobile?"auto":"1 / -1"}}><NameChoice anon={f.anon} name={f.author_name} inp={inp} onChange={({anon,name})=>setF(x=>({...x,anon,author_name:name}))}/></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={submit} disabled={busy} style={{...btn,flex:1,minHeight:44}}>{busy?"שומר...":"פרסום"}</button>
        <button onClick={()=>setOpen(false)} style={{...btn,background:"#fff",color:"#5B3C8C",border:"1.5px solid #E2E8F0"}}>ביטול</button>
      </div>
    </div>}
    {msg&&<div role="status" style={{...card,marginBottom:14,fontSize:14,fontWeight:700,color:msg.err?"#C53030":"#276749"}}>{msg.t}</div>}

    {/* הדיווחים */}
    {list.length>0&&<div style={card}>
      <div style={{fontSize:15,fontWeight:900,marginBottom:10}}>הדיווחים ({list.length})</div>
      {list.slice(0,100).map(p=>(
        <div key={p.id} style={{padding:"11px 0",borderTop:"1px solid #F3EEF8"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
            <b style={{fontSize:15,color:"#2B1D3F"}}>{p.venue_name}</b>{p.city&&<span style={{fontSize:12,color:"#6E6585"}}>{p.city}</span>}
            <span style={{marginRight:"auto",fontSize:18,fontWeight:900,color:"#9147D6",fontVariantNumeric:"tabular-nums"}}>₪{Math.round(p.price)}</span>
          </div>
          <div style={{fontSize:12.5,color:"#6E6585",marginTop:2}}>
            {new Date(p.event_date+"T12:00:00").toLocaleDateString("he-IL",{day:"numeric",month:"short",year:"numeric"})} · יום {HEB_DAYS[new Date(p.event_date+"T12:00:00").getDay()]} · {p.guests} אורחים{EVENT_TYPE_LABELS[p.event_type]?` · ${EVENT_TYPE_LABELS[p.event_type]}`:""}{p.includes?` · ${p.includes}`:""} · {p.author_name?`דיווח/ה: ${p.author_name}`:"בעילום שם"}
          </div>
          {flagNote(p)}
        </div>
      ))}
    </div>}
  </>);
}

export function VendorReviews({ user, reviews, onAdded, ui }) {
  const {card,inp,lbl,btn,mobile}=ui;
  const [cat,setCat]=useState("all"),[q,setQ]=useState(""),[open,setOpen]=useState(false),[openV,setOpenV]=useState(null),[msg,setMsg]=useState(null),[busy,setBusy]=useState(false);
  const [f,setF]=useState({category:"venue",vendor_name:"",city:"",rating:5,body:"",anon:false,author_name:firstNameOf(user)});
  const nq=normName(q);
  const shown=reviews.filter(r=>(cat==="all"||r.category===cat)&&(!nq||normName(r.vendor_name).includes(nq)||normName(r.city).includes(nq)));
  // קיבוץ לפי ספק (קטגוריה + שם)
  const vendors=Object.values(shown.reduce((m,r)=>{const k=r.category+"|"+normName(r.vendor_name);(m[k]||={key:k,name:r.vendor_name,category:r.category,city:r.city,list:[]}).list.push(r);return m;},{}))
    .map(v=>({...v,avg:v.list.reduce((s,r)=>s+r.rating,0)/v.list.length})).sort((a,b)=>b.list.length-a.list.length||b.avg-a.avg);
  const submit=async()=>{
    if(normName(f.vendor_name).length<2){setMsg({err:true,t:"כתבו את שם הספק"});return;}
    setBusy(true);setMsg(null);
    const{data,error}=await sb.from("vendor_reviews").insert({category:f.category,vendor_name:f.vendor_name.trim(),city:f.city.trim()||null,rating:f.rating,body:f.body.trim()||null,author_name:f.anon?null:(f.author_name.trim().slice(0,30)||null),user_id:user.id}).select().single();
    setBusy(false);
    if(error){setMsg({err:true,t:"השמירה נכשלה: "+error.message});return;}
    setMsg({err:false,t:data?.flagged?"✅ פורסם. הדירוג שונה מאוד משאר הדירוגים של הספק, אז הוא מסומן \"בבדיקה\" עד שנעבור עליו.":"✅ תודה! ההמלצה פורסמה."});
    setOpen(false);setCat(f.category);setQ(f.vendor_name.trim());onAdded();
  };
  return(<>
    <div style={{...card,marginBottom:14}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חיפוש לפי שם ספק או עיר" style={{...inp,marginBottom:10}}/>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[["all","🔎","הכל"],...VENDOR_CATS].map(([k,i,l])=>(
          <button key={k} onClick={()=>setCat(k)} aria-pressed={cat===k} style={{background:cat===k?"#9147D6":"#fff",color:cat===k?"#fff":"#5B3C8C",border:"1.5px solid #E9D8FD",borderRadius:100,padding:"7px 13px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",minHeight:36}}>{i} {l}</button>
        ))}
      </div>
    </div>

    {!open?<button onClick={()=>{setOpen(true);setMsg(null);}} style={{...btn,width:"100%",marginBottom:14,minHeight:48}}>➕ המליצו על ספק שעבדתם איתו</button>
    :<div style={{...card,marginBottom:14,border:"1.5px solid #E9D8FD"}}>
      <div style={{fontSize:16,fontWeight:900,marginBottom:12}}>המלצה על ספק</div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:10}}>
        <div>{lbl("סוג הספק")}<select value={f.category} onChange={e=>setF(x=>({...x,category:e.target.value}))} style={inp}>{VENDOR_CATS.map(([k,i,l])=><option key={k} value={k}>{i} {l}</option>)}</select></div>
        <div>{lbl("שם הספק *")}<input value={f.vendor_name} onChange={e=>setF(x=>({...x,vendor_name:e.target.value}))} maxLength={80} style={inp}/></div>
        <div>{lbl("עיר / אזור")}<input value={f.city} onChange={e=>setF(x=>({...x,city:e.target.value}))} maxLength={40} style={inp}/></div>
        <div><NameChoice anon={f.anon} name={f.author_name} inp={inp} onChange={({anon,name})=>setF(x=>({...x,anon,author_name:name}))}/></div>
        <div style={{gridColumn:mobile?"auto":"1 / -1"}}>{lbl("דירוג")}<Stars value={f.rating} onChange={n=>setF(x=>({...x,rating:n}))} size={30}/></div>
        <div style={{gridColumn:mobile?"auto":"1 / -1"}}>{lbl("איך היה?")}<textarea value={f.body} onChange={e=>setF(x=>({...x,body:e.target.value}))} maxLength={800} rows={3} placeholder="מה היה טוב, מה פחות, האם הייתם ממליצים..." style={{...inp,resize:"vertical"}}/></div>
      </div>
      <div style={{fontSize:12,color:"#6E6585",marginTop:8}}>כתבו רק על חוויה אישית ובאופן הוגן. ביקורת פוגענית או לא אמיתית תוסר.</div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={submit} disabled={busy} style={{...btn,flex:1,minHeight:44}}>{busy?"שומר...":"פרסום"}</button>
        <button onClick={()=>setOpen(false)} style={{...btn,background:"#fff",color:"#5B3C8C",border:"1.5px solid #E2E8F0"}}>ביטול</button>
      </div>
    </div>}
    {msg&&<div role="status" style={{...card,marginBottom:14,fontSize:14,fontWeight:700,color:msg.err?"#C53030":"#276749"}}>{msg.t}</div>}

    {vendors.length===0?<div style={{...card,color:"#6E6585",fontSize:14}}>{reviews.length?"אין ספקים שמתאימים לחיפוש.":"עוד אין המלצות. היו הראשונים להמליץ 🙏"}</div>
    :<div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:12}}>
      {vendors.map(v=>{const exp=openV===v.key;return(
        <div key={v.key} style={{...card,padding:"16px 18px"}}>
          <button onClick={()=>setOpenV(exp?null:v.key)} aria-expanded={exp} style={{all:"unset",cursor:"pointer",display:"block",width:"100%"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:40,height:40,borderRadius:12,background:"#FFF4F8",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{VENDOR_CAT[v.category]?.icon||"✨"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F"}}>{v.name}</div>
                <div style={{fontSize:12,color:"#6E6585"}}>{VENDOR_CAT[v.category]?.label}{v.city?` · ${v.city}`:""}</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:900,color:"#B07A12"}}>★ {v.avg.toFixed(1)}</div>
                <div style={{fontSize:12,color:"#6E6585"}}>{v.list.length} המלצות</div>
              </div>
            </div>
          </button>
          {exp&&v.list.map(r=>(
            <div key={r.id} style={{marginTop:10,paddingTop:10,borderTop:"1px solid #F3EEF8"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><Stars value={r.rating} size={14}/><span style={{fontSize:12,fontWeight:800,color:"#2B1D3F"}}>{r.author_name||"בעילום שם"}</span><span style={{fontSize:12,color:"#6E6585"}}>{new Date(r.created_at).toLocaleDateString("he-IL")}</span></div>
              {r.body&&<div style={{fontSize:13.5,color:"#4A4060",lineHeight:1.7,marginTop:4,whiteSpace:"pre-line"}}>{r.body}</div>}
              {flagNote(r)}
            </div>
          ))}
        </div>
      );})}
    </div>}
  </>);
}

// ─── מעקב מתנות: סכום והערה לכל אורח (guests.gift / gift_note) ───
export function GiftsScreen({ event, guests, onReload }) {
  const [list,setList]=useState(guests);
  useEffect(()=>{setList(guests);},[guests]);
  const [q,setQ]=useState(""),[only,setOnly]=useState("all");
  const save=async(g,patch)=>{
    setList(l=>l.map(x=>x.id===g.id?{...x,...patch}:x));
    const{error}=await sb.from("guests").update(patch).eq("id",g.id);
    if(error)alert("❌ לא נשמר: "+error.message);else onReload?.();
  };
  const gave=list.filter(g=>Number(g.gift)>0);
  const sum=gave.reduce((n,g)=>n+Number(g.gift),0);
  const shown=list.filter(g=>(!q.trim()||g.name?.includes(q.trim()))&&(only==="all"||(only==="gave"?Number(g.gift)>0:only==="came"?g.arrived_at||g.rsvp==="confirmed":!(Number(g.gift)>0)&&(g.arrived_at||g.rsvp==="confirmed"))))
    .sort((a,b)=>a.name.localeCompare(b.name,"he"));
  // קובץ xlsx אמיתי (מימין לשמאל) עם כל האורחים ושורת סה"כ. אם הספרייה לא נטענת  -  CSV שאקסל פותח
  const exportXlsx=async()=>{
    const sorted=[...list].sort((a,b)=>(Number(b.gift)||0)-(Number(a.gift)||0)||a.name.localeCompare(b.name,"he"));
    const rows=[["שם","טלפון","מוזמנים","הגיע/אישר","סכום מתנה","הערה"],
      ...sorted.map(g=>[g.name,g.phone||"",g.guest_count||1,g.arrived_at?"הגיע":g.rsvp==="confirmed"?"אישר":"",Number(g.gift)||"",g.gift_note||""]),
      [],["סה״כ","","","",sum,`${gave.length} נתנו מתנה`]];
    const name=`מתנות - ${event?.name||"אירוע"}`.replace(/[\\/:*?"<>|]/g,"");
    let blob,ext="xlsx";
    try{
      const{utils,write}=await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
      const ws=utils.aoa_to_sheet(rows);ws["!cols"]=[{wch:22},{wch:14},{wch:9},{wch:10},{wch:11},{wch:30}];
      const wb=utils.book_new();wb.Workbook={Views:[{RTL:true}]};utils.book_append_sheet(wb,ws,"מתנות");
      blob=new Blob([write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    }catch{
      ext="csv";blob=new Blob(["﻿"+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
    }
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${name}.${ext}`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  };
  const came=list.filter(g=>g.arrived_at||g.rsvp==="confirmed");
  const cameGave=came.filter(g=>Number(g.gift)>0).length;
  const FILTERS=[["all","כל האורחים",list.length],["came","הגיעו / אישרו",came.length],["gave","נתנו מתנה",gave.length],["missing","עוד לא נרשמה מתנה",came.length-cameGave]];
  const AV=["#F0609E","#9B6BFF","#FF8A65","#3CC8A0","#5AA9FF","#E8A93A"];
  return(
    <div className="hm gf" style={{direction:"rtl",maxWidth:960,margin:"0 auto",padding:"22px 24px 40px"}}>
      <style>{HOME_CSS+`
        .gf .gf-row{display:flex;align-items:center;gap:10px;background:#fff;border-radius:22px;padding:10px 14px;margin-bottom:8px;flex-wrap:wrap;box-shadow:0 12px 28px -24px rgba(91,60,140,.6)}
        .gf .gf-row.on{background:linear-gradient(90deg,#E7F8F0,#fff 70%)}
        .gf .gf-av{width:38px;height:38px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fredoka','Heebo',sans-serif;font-weight:700;font-size:16px;flex-shrink:0}
        .gf .gf-chip{display:inline-block;border-radius:100px;padding:2px 10px;font-size:12px;font-weight:700}
        .gf input{border:1.5px solid #E6DDF5!important;border-radius:100px!important;background:#fff;font-family:inherit;outline:none}
        .gf input:focus{border-color:#9B6BFF!important;box-shadow:0 0 0 4px rgba(155,107,255,.16)}
        .gf input.gf-search{border:none!important;box-shadow:none!important;background:transparent}
        .gf .gf-amt{position:relative}
        .gf .gf-amt span{position:absolute;right:12px;top:50%;translate:0 -50%;font-weight:700;color:#5E5470;pointer-events:none}
        @media(max-width:700px){.gf{padding:16px 12px 30px!important}}
      `}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap",marginBottom:18}}>
        <div>
          <h1 style={{fontSize:"clamp(26px,2.6vw,34px)",fontWeight:700,color:"#2B1D3F",margin:"0 0 4px"}}>מתנות</h1>
          <div style={{fontSize:15,color:"#5E5470"}}>{came.length?`נרשמה מתנה ל-${cameGave} מתוך ${came.length} שהגיעו או אישרו`:"רושמים כאן כמה כל אורח נתן, וזה מתעדכן גם בתקציב"}</div>
        </div>
        <button onClick={exportXlsx} disabled={!list.length} className="sx-btn"
          style={{background:"#fff",color:"#4A2C8F",border:"none",borderRadius:100,padding:"10px 18px",fontSize:14,fontWeight:700,cursor:list.length?"pointer":"default",opacity:list.length?1:.5,boxShadow:"0 10px 22px -16px rgba(43,29,63,.55)"}}>⬇️ ייצוא לאקסל</button>
      </div>
      <div className="hm-stats" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:14}}>
        {[["🎁","סה״כ מתנות",fmtShekel(sum),"#DFF6EC",gave.length?`מ-${gave.length} אורחים`:"עוד לא נרשמו"],["💌","נתנו מתנה",gave.length,"#FFE3EE",`מתוך ${list.length} ברשימה`],["📊","ממוצע למתנה",gave.length?fmtShekel(Math.round(sum/gave.length)):"—","#EFE6FF","לפי מה שנרשם"]].map(([ic,l,v,bg,sub])=>(
          <div key={l} className="hm-stat" style={{"--bg":bg,cursor:"default"}}>
            <span className="t"><i aria-hidden="true">{ic}</i>{l}</span>
            <b dir="ltr" style={{fontSize:"clamp(22px,2.4vw,32px)",textAlign:"right",whiteSpace:"nowrap"}}>{v}</b><small>{sub}</small>
          </div>))}
      </div>
      {came.length>0&&<div aria-hidden="true" style={{height:10,borderRadius:99,background:"#F1ECF6",overflow:"hidden",marginBottom:16}}><div style={{height:"100%",width:`${Math.round(cameGave/came.length*100)}%`,background:"linear-gradient(90deg,#3CC8A0,#25A55F)",borderRadius:99}}/></div>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:14}}>
        <div style={{flex:"1 1 220px",background:"#fff",borderRadius:100,padding:"4px 6px 4px 16px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 12px 26px -22px rgba(43,29,63,.6)"}}>
          <span aria-hidden="true">🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="חיפוש לפי שם" aria-label="חיפוש אורח" style={{flex:1,padding:"8px 4px",fontSize:15}} className="gf-search"/>
        </div>
        <div role="group" aria-label="סינון" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {FILTERS.map(([v,l,n])=>(
            <button key={v} onClick={()=>setOnly(v)} aria-pressed={only===v}
              style={{background:only===v?"linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)":"#fff",color:only===v?"#fff":"#4A2C8F",border:"none",borderRadius:100,padding:"9px 14px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:only===v?"0 10px 22px -12px rgba(240,96,158,.7)":"0 10px 22px -18px rgba(43,29,63,.55)"}}>
              {l} <span style={{opacity:.8,fontWeight:600}}>({n})</span>
            </button>))}
        </div>
      </div>
      {shown.map((g,i)=>{const gv=Number(g.gift)>0,stt=g.arrived_at?["✓ הגיע","#DFF6EC","#156B4A"]:g.rsvp==="confirmed"?["אישר הגעה","#E2F1FF","#1D5FA0"]:g.rsvp==="declined"?["לא מגיע","#FFE3EE","#A3245E"]:["ממתין","#FFF1D6","#7A4E00"];return(
        <div key={g.id} className={`gf-row${gv?" on":""}`}>
          <span className="gf-av" aria-hidden="true" style={{background:AV[(g.name||"").charCodeAt(0)%AV.length]}}>{ini(g.name)}</span>
          <div style={{flex:"1 1 150px",minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,color:"#2B1D3F",fontFamily:"'Fredoka','Heebo',sans-serif"}}>{g.name}</div>
            <span className="gf-chip" style={{background:stt[1],color:stt[2]}}>{stt[0]}</span>
          </div>
          <div className="gf-amt">
            <input key={"a"+g.id+g.gift} defaultValue={g.gift??""} inputMode="decimal" placeholder="סכום" aria-label={`סכום מתנה של ${g.name}`}
              onBlur={e=>{const v=e.target.value.replace(/[^\d.]/g,"");const n=v?Number(v):null;if(n!==(g.gift==null?null:Number(g.gift)))save(g,{gift:n});}}
              style={{width:120,padding:"10px 28px 10px 12px",fontSize:15,fontWeight:700,textAlign:"center",color:"#156B4A"}}/>
            <span aria-hidden="true">₪</span>
          </div>
          <input key={"n"+g.id+(g.gift_note||"")} defaultValue={g.gift_note||""} placeholder="הערה (צ׳ק, Bit…)" aria-label={`הערה למתנה של ${g.name}`}
            onBlur={e=>{const v=e.target.value.trim();if(v!==(g.gift_note||""))save(g,{gift_note:v||null});}}
            style={{flex:"1 1 150px",minWidth:0,padding:"10px 14px",fontSize:14}}/>
        </div>);})}
      {!shown.length&&<div style={{textAlign:"center",color:"#5E5470",fontSize:15,padding:28,background:"#fff",borderRadius:24}}>{q||only!=="all"?"אין אורחים שמתאימים לסינון":"עוד אין אורחים ברשימה"}</div>}
    </div>
  );
}

export function AISeatingScreen({ event, tables, guests, onApply, onClose, saving=false }) {
  const allGuests=[...guests,...tables.flatMap(t=>t.guests||[])];
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [groupByRelation,setGroupByRelation]=useState(true);
  const [fillEmpty,setFillEmpty]=useState(true);
  // הקטגוריות של מי שעוד לא יושב; ברירת מחדל: כולן מסומנות לישיבה ביחד
  const catCounts=guests.reduce((acc,g)=>{const r=g.relation||"ללא שיוך";acc[r]=(acc[r]||0)+1;return acc;},{});
  const catList=Object.keys(catCounts).sort((a,b)=>catCounts[b]-catCounts[a]);
  const [cats,setCats]=useState(catList);
  const toggleCat=c=>setCats(s=>s.includes(c)?s.filter(x=>x!==c):[...s,c]);
  // כללי הושבה (נשמרים באירוע: settings_json.seat_rules)
  const [rules,setRules]=useState(()=>event.settings_json?.seat_rules||[]);
  const [ruleA,setRuleA]=useState(""),[ruleB,setRuleB]=useState(""),[ruleType,setRuleType]=useState("apart");
  const byName=[...allGuests].sort((a,b)=>a.name.localeCompare(b.name,"he"));
  // צד בכלל: מזהה אורח או "c:<קטגוריה>"
  const allCats=[...new Set(allGuests.map(g=>g.relation||"ללא שיוך"))].sort((a,b)=>a.localeCompare(b,"he"));
  const nameOf=id=>{const s=String(id);if(s.startsWith("c:"))return allCats.includes(s.slice(2))?`קטגוריה "${s.slice(2)}"`:undefined;return allGuests.find(g=>String(g.id)===s)?.name;};
  const saveRules=async next=>{
    setRules(next);
    const settings={...(event.settings_json||{}),seat_rules:next};
    event.settings_json=settings;
    const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
    if(error)alert("❌ כללי ההושבה לא נשמרו: "+error.message);
  };
  const addRule=()=>{
    if(!ruleA||!ruleB||ruleA===ruleB)return;
    const next=[...rules.filter(r=>!((r.a===ruleA&&r.b===ruleB)||(r.a===ruleB&&r.b===ruleA))),{a:ruleA,b:ruleB,type:ruleType}];
    saveRules(next);setRuleA("");setRuleB("");
  };
  useEffect(()=>{setResult(null);},[groupByRelation,fillEmpty,cats.join("|"),rules.length]);

  const runSmartSeating=()=>{
    setLoading(true);
    setTimeout(()=>{
      const assignments=planAutoSeating(guests,tables,{byCategory:groupByRelation,fillEmpty,cats,rules:rules.filter(r=>nameOf(r.a)&&nameOf(r.b))});
      const left=guests.length-assignments.length;
      const summary=`שובצו ${assignments.length} אורחים מתוך ${guests.length} ממתינים${left>0?` · ${left} נשארו בלי מקום (הוסף שולחנות)`:""}`;
      setResult({assignments,summary});
      setLoading(false);
    },300);
  };

  return(
    <div style={{direction:"rtl",padding:24,maxWidth:700,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:20}}>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:900,color:"#1A202C",marginBottom:6}}>🤖 הושבה אוטומטית</div>
          <div style={{fontSize:13,color:"#5F6B7D"}}>משבץ את האורחים שעוד לא יושבים, לפי קטגוריות ומקומות פנויים. אורחים שכבר שובצו לא זזים.</div>
        </div>
        {onClose&&<button onClick={onClose} aria-label="סגירה" style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:10,width:36,height:36,fontSize:16,cursor:"pointer",flexShrink:0}}>✕</button>}
      </div>

      {/* סטטיסטיקות */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        {[[guests.length,"👥","ממתינים להושבה"],[tables.length,"🪑","שולחנות"],[tables.reduce((s,t)=>s+Math.max(0,t.seats-(t.guests||[]).length),0),"🆓","מקומות פנויים"]].map(([v,ic,l])=>(
          <div key={l} style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"14px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:24}}>{ic}</div>
            <div style={{fontSize:24,fontWeight:900,color:"#2B6CB0"}}>{v}</div>
            <div style={{fontSize:12,color:"#5F6B7D",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* הגדרות */}
      <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:20,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#1A202C",marginBottom:14}}>⚙️ אפשרויות סידור</div>
        {[
          {key:"groupByRelation",label:"סדר לפי קטגוריות",desc:"הקטגוריות המסומנות יושבות ביחד — וליד מי שכבר יושב מאותה קטגוריה",val:groupByRelation,set:setGroupByRelation},
          {key:"fillEmpty",label:"מלא שולחנות ריקים קודם",desc:"קבוצה עוברת לשולחן ריק שהיא נכנסת אליו בשלמותה, ואז לשולחנות הכי פחות מלאים",val:fillEmpty,set:setFillEmpty},
        ].map(item=>(
          <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #F7FAFC"}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#1A202C"}}>{item.label}</div>
              <div style={{fontSize:12,color:"#5F6B7D"}}>{item.desc}</div>
            </div>
            <div role="switch" aria-checked={item.val} aria-label={item.label} tabIndex={0} onClick={()=>item.set(s=>!s)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();item.set(s=>!s);}}}
              style={{width:44,height:24,borderRadius:12,background:item.val?"#276749":"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,right:item.val?2:20,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"right .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
        ))}
        {groupByRelation&&catList.length>0&&(
          <div style={{paddingTop:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{flex:1,fontSize:12,fontWeight:800,color:"#4A3D66"}}>אילו קטגוריות ישבו ביחד? <span style={{fontWeight:500,color:"#5F6B7D"}}>(השאר ישובצו בכל מקום פנוי)</span></div>
              <button onClick={()=>setCats(cats.length===catList.length?[]:catList)} style={{background:"none",border:"none",color:"#2B6CB0",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{cats.length===catList.length?"נקה הכל":"סמן הכל"}</button>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {catList.map(c=>{const on=cats.includes(c),col=RELATION_COLORS[c]||"#5F6B7D";return(
                <button key={c} onClick={()=>toggleCat(c)} aria-pressed={on}
                  style={{display:"flex",alignItems:"center",gap:6,background:on?col:"#fff",color:on?"#fff":col,border:`1.5px solid ${col}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                  {on?"✓":"○"} {c} <span style={{opacity:.85}}>({catCounts[c]})</span>
                </button>
              );})}
            </div>
          </div>
        )}
      </div>

      {/* כללי הושבה */}
      <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:20,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#1A202C",marginBottom:4}}>🤝 כללי הושבה</div>
        <div style={{fontSize:12,color:"#5F6B7D",marginBottom:12}}>מי חייב לשבת ביחד ומי לא ליד מי, לפי שם או לפי קטגוריה שלמה. ההושבה האוטומטית תשמור עליהם.</div>
        {rules.filter(r=>nameOf(r.a)&&nameOf(r.b)).map((r,i)=>(
          <div key={r.a+r.b} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",marginBottom:6,borderRadius:10,background:r.type==="apart"?"#FFF5F5":"#F0FFF4",border:`1px solid ${r.type==="apart"?"#FED7D7":"#C6F6D5"}`,fontSize:13}}>
            <span style={{flex:1}}><b>{nameOf(r.a)}</b> {r.type==="apart"?"🚫 לא ליד":"🤝 ביחד עם"} <b>{nameOf(r.b)}</b></span>
            <button onClick={()=>saveRules(rules.filter(x=>x!==r))} aria-label="מחיקת כלל" style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#A0AEC0"}}>✕</button>
          </div>
        ))}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",marginTop:6}}>
          {[[ruleA,setRuleA,"אורח / קטגוריה"],null,[ruleB,setRuleB,"אורח / קטגוריה"]].map((x,i)=>x?(
            <select key={i} value={x[0]} onChange={e=>x[1](e.target.value)} style={{flex:"1 1 140px",minWidth:0,padding:"8px 10px",borderRadius:10,border:"1.5px solid #E2E8F0",fontFamily:"inherit",fontSize:13,background:"#fff"}}>
              <option value="">{x[2]}</option>
              <optgroup label="קטגוריות">{allCats.map(c=><option key={c} value={"c:"+c}>📂 {c}</option>)}</optgroup>
              <optgroup label="אורחים">{byName.map(g=><option key={g.id} value={String(g.id)}>{g.name}</option>)}</optgroup>
            </select>
          ):(
            <select key={i} value={ruleType} onChange={e=>setRuleType(e.target.value)} style={{flex:"0 0 auto",padding:"8px 10px",borderRadius:10,border:"1.5px solid #E2E8F0",fontFamily:"inherit",fontSize:13,fontWeight:700,background:"#fff"}}>
              <option value="apart">🚫 לא ליד</option>
              <option value="together">🤝 ביחד עם</option>
            </select>
          ))}
          <button onClick={addRule} disabled={!ruleA||!ruleB||ruleA===ruleB}
            style={{background:ruleA&&ruleB&&ruleA!==ruleB?"#2B6CB0":"#E2E8F0",color:ruleA&&ruleB&&ruleA!==ruleB?"#fff":"#aaa",border:"none",borderRadius:10,padding:"9px 16px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>הוסף</button>
        </div>
      </div>

      {/* קטגוריות קיימות */}
      <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:20,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#1A202C",marginBottom:12}}>📊 פילוח לפי קטגוריה</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {Object.entries(
            [...guests,...tables.flatMap(t=>t.guests||[])].reduce((acc,g)=>{
              const r=g.relation||"ללא שיוך";
              acc[r]=(acc[r]||0)+(g.guest_count||1);
              return acc;
            },{})
          ).map(([rel,count])=>(
            <div key={rel} style={{display:"flex",alignItems:"center",gap:6,background:(RELATION_COLORS[rel]||"#CBD5E0")+"18",border:`1.5px solid ${(RELATION_COLORS[rel]||"#CBD5E0")}44`,borderRadius:20,padding:"5px 12px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:RELATION_COLORS[rel]||"#CBD5E0"}}/>
              <span style={{fontSize:12,fontWeight:700,color:RELATION_COLORS[rel]||"#5F6B7D"}}>{rel}</span>
              <span style={{fontSize:12,fontWeight:900,color:"#1A202C"}}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* תוצאה */}
      {result&&(
        <div style={{background:"#F0FFF4",border:"1.5px solid #9AE6B4",borderRadius:14,padding:20,marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:800,color:"#276749",marginBottom:8}}>✅ {result.summary}</div>
          <div style={{maxHeight:200,overflowY:"auto"}}>
            {result.assignments.slice(0,10).map((a,i)=>{
              const g=allGuests.find(x=>String(x.id)===String(a.guestId));
              return g?(
                <div key={i} style={{fontSize:12,color:"#2D3748",padding:"3px 0",borderBottom:"1px solid #C6F6D5"}}>
                  <span style={{fontWeight:700}}>{g.name}</span> → {a.reason}
                </div>
              ):null;
            })}
            {result.assignments.length>10&&<div style={{fontSize:12,color:"#5F6B7D",marginTop:4}}>ועוד {result.assignments.length-10} אורחים...</div>}
          </div>
        </div>
      )}

      {guests.length===0&&(
        <div style={{background:"#EBF8FF",border:"1.5px solid #BEE3F8",borderRadius:14,padding:20,textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:8}}>🎉</div>
          <div style={{fontSize:15,fontWeight:700,color:"#2B6CB0"}}>כל האורחים כבר מוסבים!</div>
        </div>
      )}

      <div style={{display:"flex",gap:10}}>
        <button onClick={runSmartSeating} disabled={loading||guests.length===0}
          style={{flex:2,background:guests.length===0?"#E2E8F0":"#2B6CB0",color:guests.length===0?"#aaa":"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:700,cursor:guests.length===0?"default":"pointer",fontFamily:"inherit"}}>
          {loading?"מסדר...":"🚀 סדר אוטומטית"}
        </button>
        {result&&result.assignments.length>0&&<button onClick={()=>onApply(result.assignments)} disabled={saving}
          style={{flex:1,background:"#276749",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,cursor:saving?"default":"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
          {saving?"שומר...":"✅ אשר והושב"}
        </button>}
      </div>
    </div>
  );
}
export function AddTableModal({ onConfirm, onClose }) {
  const [name,setName]=useState(""),[type,setType]=useState("round");
  useEffect(()=>{const k=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);},[]);
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 14px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontWeight:800,fontSize:18,color:"#2B1D3F"}}>➕ הוסף שולחן</div>
          <button onClick={onClose} aria-label="סגירה" style={{background:"#F6F0FF",border:"1.5px solid #D6E0FF",color:"#2B1D3F",borderRadius:10,width:34,height:34,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
        </div>
        <div style={{fontSize:13,color:"#6E6585",marginBottom:18}}>בחר סוג שולחן ושם</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
          {Object.entries(TABLE_TYPES).map(([k,v])=>(
            <button key={k} onClick={()=>setType(k)} style={{background:type===k?"linear-gradient(135deg,#C2397A,#9B6BFF)":"#F6F0FF",border:`2px solid ${type===k?"transparent":"#D6E0FF"}`,borderRadius:14,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all .15s"}}>
              <span style={{fontSize:24}}>{v.icon}</span>
              <span style={{fontSize:12,fontWeight:700,color:type===k?"#fff":"#2B1D3F"}}>{v.label}</span>
              <span style={{fontSize:12,color:type===k?"rgba(255,255,255,.7)":"#6E6585"}}>{v.defaultSeats} מקומות</span>
            </button>
          ))}
        </div>

        <input value={name} onChange={e=>setName(e.target.value)} placeholder="שם השולחן (למשל: שולחן 1, שולחן כבוד...)"
          onKeyDown={e=>e.key==="Enter"&&name.trim()&&onConfirm(name,type)}
          style={{width:"100%",background:"#F6F0FF",border:"1.5px solid #D6E0FF",borderRadius:14,padding:"13px 16px",fontSize:15,color:"#2B1D3F",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>

        <button onClick={()=>name.trim()&&onConfirm(name,type)} disabled={!name.trim()} style={{width:"100%",background:name.trim()?"linear-gradient(135deg,#C2397A,#9B6BFF)":"#F6F0FF",color:name.trim()?"#fff":"#6E6585",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:name.trim()?"pointer":"default",fontFamily:"inherit",transition:"all .15s"}}>
          צור שולחן {TABLE_TYPES[type]?.icon}
        </button>
      </div>
    </div>
  );
}

// ─── INVITE PAGE ──────────────────────────────────────────────────────────────
export function InviteStylePicker({ value, onChange, title, img }) {
  return(
    <div role="radiogroup" aria-label="סגנון ההזמנה" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(132px,1fr))",gap:12}}>
      {INVITE_STYLES.map(st=>{const on=value===st.id;return(
        <button key={st.id} type="button" role="radio" aria-checked={on} aria-label={`${st.name}: ${st.desc}`} onClick={()=>onChange(st.id)} className="iv-pick"
          style={{border:"none",padding:0,background:"none",cursor:"pointer",textAlign:"center",borderRadius:22,boxShadow:on?"0 0 0 3px #F0609E, 0 16px 30px -18px rgba(240,96,158,.8)":"0 12px 26px -20px rgba(43,29,63,.6)",transition:"box-shadow 200ms cubic-bezier(0.23,1,0.32,1), translate 200ms cubic-bezier(0.23,1,0.32,1)",overflow:"hidden",fontFamily:"'Heebo',sans-serif"}}>
          {/* תמונת הפתיחה שנבחרה, כמו בראש ההזמנה, עם שכבה בהירה */}
          <div style={{position:"relative",height:74,backgroundColor:"#EDE6F5",backgroundImage:img?`url(${img})`:undefined,backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(1.12) saturate(.95)"}}>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(255,255,255,.18),rgba(43,29,63,.28))"}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 8px",fontFamily:st.font,fontWeight:st.id==="minimal"?300:700,fontSize:14,color:"#fff",textShadow:"0 1px 6px rgba(0,0,0,.45)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title||"נועה & איתי"}</div>
          </div>
          <div style={{background:st.id==="evening"?"#3A2A52":st.bg,padding:"10px 10px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:7,marginTop:-10,position:"relative",borderRadius:"14px 14px 0 0"}}>
            <div style={{background:st.id==="evening"?"#4A3866":st.card,borderRadius:st.id==="minimal"?4:12,padding:"6px 10px",width:"86%",fontSize:12,color:st.id==="evening"?"#F3EAD8":st.ink,boxShadow:st.id==="minimal"?"inset 0 0 0 1px #111":"0 6px 14px -10px rgba(0,0,0,.3)"}}>14.06 · 19:30 · אולמי הגן</div>
            <span style={{display:"inline-block",background:st.accent,color:st.id==="evening"?"#241433":"#fff",borderRadius:100,padding:"3px 12px",fontSize:12,fontWeight:700}}>אישור הגעה</span>
          </div>
          <div style={{background:on?"#FFE9F2":"#fff",padding:"8px 16px 16px"}}>
            <div style={{fontFamily:"'Fredoka','Heebo',sans-serif",fontSize:14,fontWeight:700,color:"#2B1D3F"}}>{on?"✓ ":""}{st.name}</div>
            <div style={{fontSize:12,color:"#5E5470",lineHeight:1.4}}>{st.desc}</div>
          </div>
        </button>);})}
    </div>
  );
}
// בחירת תמונת הפתיחה (template_id) — בפרטי האירוע ובמסך ההזמנה
export function InviteCoverPicker({ eventType, value, onChange }) {
  const list=INVITE_TEMPLATES[eventType||"wedding"]||INVITE_TEMPLATES.other;
  return(
    <div role="radiogroup" aria-label="תמונת הפתיחה" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:10}}>
      {list.map(t=>{const on=(value||"classic")===t.id;return(
        <button key={t.id} type="button" role="radio" aria-checked={on} aria-label={t.name} onClick={()=>onChange(t.id)}
          style={{border:"none",padding:0,cursor:"pointer",borderRadius:18,overflow:"hidden",background:"#fff",boxShadow:on?"0 0 0 3px #F0609E, 0 14px 26px -16px rgba(240,96,158,.8)":"0 10px 22px -18px rgba(43,29,63,.6)",transition:"box-shadow 200ms cubic-bezier(0.23,1,0.32,1)"}}>
          <div style={{height:70,backgroundImage:`url(${t.img})`,backgroundSize:"cover",backgroundPosition:"center"}}/>
          <div style={{padding:"6px 4px",fontSize:13,fontWeight:700,color:"#2B1D3F",background:on?"#FFE9F2":"#fff",fontFamily:"'Fredoka','Heebo',sans-serif"}}>{on?"✓ ":""}{t.name}</div>
        </button>);})}
    </div>
  );
}
export const coverImgOf=(eventType,id)=>{const list=INVITE_TEMPLATES[eventType||"wedding"]||INVITE_TEMPLATES.other;return (list.find(t=>t.id===(id||"classic"))||list[0])?.img;};
// עיצוב דף ההזמנה לפי הסגנון שנבחר (קלאסי = בלי שינוי), והנפשות כניסה עדינות לכל הסגנונות
export function InviteSettings({ event, onUpdate }) {
  const [templateId,setTemplateId]=useState(event.template_id||"classic");
  const [saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[copied,setCopied]=useState(false);

  const [inviteCode,setInviteCode]=useState(event.invite_code||"");
  useEffect(()=>{if(!event.invite_code){const code=Math.random().toString(36).slice(2,10);sb.from("events").update({invite_code:code}).eq("id",event.id).then(()=>setInviteCode(code));}},[]);
  // בחירת עיצוב נשמרת מיד (בלי כפתור שמירה ובלי לצאת מהמסך)
  const [saveErr,setSaveErr]=useState("");
  const pickTemplate=async id=>{
    setTemplateId(id);setSaving(true);setSaved(false);
    const{error}=await sb.from("events").update({template_id:id}).eq("id",event.id);
    setSaving(false);
    if(error){setSaveErr(error.message);return;}
    event.template_id=id;setSaveErr("");setSaved(true);
  };
  // סגנון ההזמנה: נשמר מיד ב-settings_json (ממוזג עם שאר ההגדרות). אותו בורר נמצא גם בפרטי האירוע
  const [ivStyle,setIvStyle]=useState(()=>inviteStyleOf(event));
  const pickStyle=async id=>{
    setIvStyle(id);setSaving(true);setSaved(false);
    const settings={...(event.settings_json||{}),inviteStyle:id};
    const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
    setSaving(false);
    if(error){setSaveErr(error.message);return;}
    event.settings_json=settings;setSaveErr("");setSaved(true);
  };
  const inviteUrl=`${window.location.origin}/#/invite/${inviteCode}`;
  const copy=()=>{navigator.clipboard.writeText(inviteUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const shareWA=()=>shareInviteWA(event,inviteUrl);
  const templates=INVITE_TEMPLATES[event.event_type||"wedding"]||INVITE_TEMPLATES.other;

  return(
    <div style={{padding:20,direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:100}}>
      <Card style={{padding:16,marginBottom:20,border:`2px solid ${C.blueL}`}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>🔗 לינק ההזמנה</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>שלח לאורחים  -  יוכלו לאשר הגעה ולקבל פרטים</div>
        <div style={{background:C.blueXL,borderRadius:10,padding:"8px 6px",fontSize:12,color:C.blue,fontFamily:"monospace",marginBottom:12,wordBreak:"break-all",lineHeight:1.5}}>{inviteCode?inviteUrl:"טוען..."}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <button onClick={copy} style={{background:copied?C.success:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:10,padding:"10px 6px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {copied?"✓ הועתק":"📋 העתק"}
          </button>
          <button onClick={shareWA} style={{background:"#25D366",color:"#fff",border:"none",borderRadius:10,padding:"10px 6px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            💬 WhatsApp
          </button>
          <button onClick={()=>window.open(inviteUrl,"_blank")} style={{background:C.blueXL,color:C.blue,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 6px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            👁️ תצוגה
          </button>
        </div>
      </Card>

      <Card style={{padding:16,marginBottom:20,background:C.blueXL}}>
        <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>📋 פרטי האירוע בהזמנה</div>
        {[["📛",event.name],["📅",event.date?new Date(event.date).toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"}):"לא הוגדר"],["🕐",event.event_time||"לא הוגדר"],["📍",event.venue||"לא הוגדר"],["🏠",event.venue_address||"לא הוגדר"]].map(([icon,val])=>(
          <div key={icon} style={{display:"flex",gap:8,marginBottom:6,fontSize:13,color:C.text}}><span>{icon}</span><span>{val}</span></div>
        ))}
        <div style={{fontSize:12,color:C.muted,marginTop:8}}>לשינוי הפרטים: מסך "פרטי האירוע" (השינויים נשמרים אוטומטית)</div>
      </Card>

      <h2 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 4px"}}>🎨 סגנון ההזמנה</h2>
      <div style={{fontSize:13,color:C.muted,marginBottom:12}}>צבעים, גופן וצורת הכפתורים בדף שהאורחים רואים. אפשר לשנות גם מפרטי האירוע.</div>
      <div style={{marginBottom:22}}><InviteStylePicker value={ivStyle} onChange={pickStyle} img={coverImgOf(event.event_type,templateId)} title={event.bride_name&&event.groom_name?`${event.groom_name} & ${event.bride_name}`:event.name}/></div>
      <h2 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 12px"}}>🖼️ תמונת הפתיחה</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
        {templates.map(tmpl=>(
          <div key={tmpl.id} onClick={()=>pickTemplate(tmpl.id)} style={{cursor:"pointer",borderRadius:14,overflow:"hidden",border:`3px solid ${templateId===tmpl.id?C.blueL:"transparent"}`,boxShadow:templateId===tmpl.id?`0 4px 16px ${C.blueL}44`:"none",transition:"all .2s"}}>
            <div style={{height:80,background:tmpl.bg,backgroundImage:`url(${tmpl.img})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
              <div style={{position:"absolute",inset:0,background:tmpl.overlay}}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",padding:4}}>
                <span style={{fontSize:12,fontWeight:800,color:"#fff",textShadow:"0 1px 4px rgba(0,0,0,.5)",textAlign:"center",lineHeight:1.3}}>{event.bride_name&&event.groom_name?`${event.groom_name} & ${event.bride_name}`:event.name}</span>
              </div>
            </div>
            <div style={{background:templateId===tmpl.id?C.blueL:C.surface,padding:"6px",textAlign:"center",fontSize:12,fontWeight:700,color:templateId===tmpl.id?"#fff":C.text}}>{tmpl.name}</div>
          </div>
        ))}
      </div>

      <div role="status" aria-live="polite" style={{textAlign:"center",fontSize:13,fontWeight:800,color:saveErr?C.danger:saved?C.success:C.muted}}>
        {saveErr?<button onClick={()=>pickTemplate(templateId)} title={saveErr} style={{background:"#FFF5F5",color:"#C53030",border:"1.5px solid #FEB2B2",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>⚠️ העיצוב לא נשמר · נסו שוב</button>
          :saving?"⏳ שומר...":saved?"✓ העיצוב נשמר":"העיצוב שתבחרו נשמר אוטומטית"}
      </div>
    </div>
  );
}



// ─── אשף יצירת אירוע: שלב אחרי שלב, עם תצוגת הזמנה חיה בטלפון ───
export const WIZ_TYPES=[
  ["wedding","חתונה","אורחים, הושבה והזמנה","/img/u/1775476793931-cb484f197760_700.webp"],
  ["bar_mitzvah","בר/ת מצווה","חגיגה של כל המשפחה","/img/u/1792587545791-dbff25ac7905_700.webp"],
  ["brit","ברית / בריתה","שמחה ראשונה","/img/u/1510154221590-ff63e90a136f_700.webp"],
  ["business","אירוע עסקי","כנס, השקה או ערב חברה","/img/u/1511578314322-379afb476865_700.webp"],
  ["other","אירוע אחר","יום הולדת, אירוסין ועוד",null],
];
export const WIZ_COUPLE_ICON={mf:"🤵 👰",mm:"🤵 🤵",ff:"👰 👰"};
export const WIZ_CSS=`
.wz-ov{position:fixed;inset:0;z-index:200;background:rgba(43,29,63,.42);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px}
.wz{width:100%;max-width:1220px;min-height:min(760px,94vh);max-height:94vh;overflow:auto;border-radius:34px;background:radial-gradient(700px 420px at 100% 0%,#EFE4FF,rgba(239,228,255,0) 60%),radial-gradient(600px 420px at 0% 100%,#FFE4F0,rgba(255,228,240,0) 60%),#FFFBF7;box-shadow:0 40px 90px -30px rgba(43,29,63,.55);display:grid;grid-template-columns:1fr 400px;font-synthesis-weight:none;direction:rtl}
.wz h2,.wz h3,.wz button{font-family:'Fredoka','Heebo',sans-serif}
.wz-main{padding:26px 30px 28px;display:flex;flex-direction:column;min-width:0}
.wz-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px}
.wz-steps{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.9);border-radius:100px;padding:5px;box-shadow:0 12px 26px -20px rgba(43,29,63,.6);flex-wrap:wrap}
.wz-step{min-width:38px;height:36px;border-radius:100px;border:none;background:transparent;color:#6E6585;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;padding:0 12px;cursor:default;white-space:nowrap}
.wz-step.on{background:linear-gradient(120deg,#FFE4F0,#EFE4FF);color:#4A2C8F;font-weight:700;box-shadow:inset 0 0 0 1.5px #E3CFF4}
.wz-step.done{background:#DFF6EC;color:#1F7A4D;cursor:pointer}
.wz-x{width:40px;height:40px;border-radius:50%;border:none;background:#fff;color:#4A2C8F;font-size:18px;cursor:pointer;box-shadow:0 10px 22px -16px rgba(43,29,63,.6)}
.wz-body{flex:1;animation:wzIn .35s cubic-bezier(0.23,1,0.32,1) both}
.wz-body h2{font-size:clamp(24px,2.6vw,32px);font-weight:700;color:#2B1D3F;margin:0 0 4px}
.wz-sub{font-size:15px;color:#5E5470;margin:0 0 18px}
.wz-types{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.wz-card{position:relative;border:none;padding:0;border-radius:24px;overflow:hidden;cursor:pointer;min-height:150px;background:#F1EAFF;text-align:right;box-shadow:0 14px 30px -22px rgba(43,29,63,.6);transition:translate 200ms cubic-bezier(0.23,1,0.32,1),box-shadow 200ms cubic-bezier(0.23,1,0.32,1)}
@media(hover:hover) and (pointer:fine){.wz-card:hover{translate:0 -3px}}
.wz-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.wz-card .sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(28,16,40,.78) 100%)}
.wz-card .tx{position:absolute;bottom:12px;right:14px;left:14px;color:#fff}
.wz-card .tx b{display:block;font-family:'Fredoka','Heebo',sans-serif;font-size:19px;font-weight:700}
.wz-card .tx span{font-size:13px;opacity:.95}
.wz-card.plain{background:linear-gradient(150deg,#E6D9FF,#FFD3E6 55%,#FFE6C4)}
.wz-card.plain .sh{display:none}.wz-card.plain .tx{color:#2B1D3F}
.wz-card[aria-checked=true]{box-shadow:0 0 0 3px #9B6BFF,0 18px 34px -20px rgba(155,107,255,.8)}
.wz-card .ck{position:absolute;top:10px;left:10px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.75);display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff}
.wz-card[aria-checked=true] .ck{background:#9B6BFF}
.wz-couple{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.wz-cp{border:none;border-radius:24px;background:#fff;padding:22px 10px 18px;cursor:pointer;text-align:center;box-shadow:inset 0 0 0 1.5px #EFE8F7,0 12px 26px -22px rgba(43,29,63,.6);transition:box-shadow 200ms ease,background-color 200ms ease}
.wz-cp .ic{font-size:44px;line-height:1.2;letter-spacing:4px}
.wz-cp .lb{display:block;margin-top:10px;font-family:'Fredoka','Heebo',sans-serif;font-size:17px;font-weight:700;color:#2B1D3F}
.wz-cp[aria-checked=true]{background:#F6F0FF;box-shadow:0 0 0 3px #9B6BFF}
.wz-f{display:block;margin-bottom:14px}
.wz-f > span{display:block;font-size:14px;font-weight:700;color:#3E3555;margin-bottom:6px}
.wz-f input,.wz-f .wz-in{width:100%;border:1.5px solid #E6DDF5!important;border-radius:100px!important;padding:13px 18px!important;font-size:16px!important;background:#fff!important;outline:none;font-family:inherit;box-sizing:border-box;color:#2B1D3F}
.wz-f input:focus{border-color:#9B6BFF!important;box-shadow:0 0 0 4px rgba(155,107,255,.16)}
.wz-err{display:block;font-size:13px;color:#B42318;font-weight:700;margin-top:5px}
.wz-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.wz-row3{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px}
.wz-acts{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:22px;position:sticky;bottom:0;z-index:5;padding:14px 0 calc(12px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(255,251,247,0),rgba(255,251,247,.96) 28%)}
/* הכפתורים "חזרה / המשך" תמיד בתחתית החלון — גם בשלב העיצוב, שבו רשת התמונות ארוכה */
.wz-btn{border:none;border-radius:100px;padding:13px 26px;font-size:16px;font-weight:700;cursor:pointer}
.wz-btn.p{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF);color:#fff;box-shadow:0 14px 28px -14px rgba(240,96,158,.7)}
.wz-btn.g{background:#fff;color:#4A2C8F;box-shadow:inset 0 0 0 1.5px #E6DDF5}
.wz-btn.s{background:none;color:#7A3FBF;text-decoration:underline;padding:8px 10px}
.wz-btn:disabled{opacity:.5;cursor:default}
.wz-side{background:#3A2464 center/cover no-repeat;transition:background-image .4s ease;border-radius:0 34px 34px 0;justify-content:center;padding:22px 20px;display:flex;flex-direction:column;align-items:center;color:#fff}
.wz-side h3{font-size:17px;font-weight:700;margin:0 0 14px}
.wz-ph{width:240px;border-radius:40px;border:9px solid #1B1426;background:#fff;overflow:hidden;box-shadow:0 30px 60px -30px rgba(0,0,0,.7);position:relative}
.wz-ph .isl{position:absolute;top:8px;left:50%;margin-left:-38px;width:76px;height:20px;border-radius:20px;background:#1B1426;z-index:2}
.wz-ph .cv{height:210px;position:relative;background:#E6D9FF center/cover no-repeat}
.wz-ph .cv::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(28,16,40,.55))}
.wz-ph .nm{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 12px;color:#fff;font-family:'Fredoka','Heebo',sans-serif;font-weight:700;font-size:24px;line-height:1.15;text-shadow:0 2px 12px rgba(0,0,0,.45)}
.wz-ph .nm i{font-style:normal;font-size:20px;color:#FFD9A8}
.wz-ph .bd{padding:14px 14px 18px;text-align:center;color:#2B1D3F}
.wz-ph .dt{font-family:'Fredoka','Heebo',sans-serif;font-size:18px;font-weight:700}
.wz-ph .ln{font-size:13px;color:#5E5470;margin-top:3px}
.wz-ph .pl{display:inline-block;margin-top:12px;background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF);color:#fff;border-radius:100px;padding:7px 18px;font-size:13px;font-weight:700}
.wz-side small{margin-top:14px;font-size:13px;opacity:.9;text-align:center}
.wz button:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}
@keyframes wzIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.wz-body{animation:none}.wz-card{transition:none}}
@media(max-width:860px){.wz{grid-template-columns:1fr;max-height:96vh}.wz-side{display:none}.wz-types,.wz-couple{grid-template-columns:repeat(2,1fr)}.wz-main{padding:20px 16px}.wz-row3{grid-template-columns:1fr 1fr}.wz-row3 > :first-child{grid-column:1/-1}}
`;
export function CreateEventWizard({ form, setForm, evName, autoName, creating, onCreate, onClose }) {
  const wedding=form.event_type==="wedding";
  const kid=form.event_type==="bar_mitzvah"||form.event_type==="brit";
  const steps=[{id:"type",l:"סוג האירוע"},...(wedding?[{id:"couple",l:"מי חוגגים?"}]:[]),...(kid?[{id:"child",l:"בן או בת?"}]:[]),{id:"names",l:"שמות"},{id:"when",l:"מתי ואיפה?"},{id:"design",l:"עיצוב ההזמנה"},{id:"finish",l:"סיום"}];
  const [i,setI]=useState(0),[tried,setTried]=useState(false);
  const idx=Math.min(i,steps.length-1),st=steps[idx];
  const k=eventKind(form);
  const set=(key,v)=>setForm(f=>({...f,[key]:v}));
  const namesOk=wedding?!!(form.groom_name.trim()&&form.bride_name.trim()):!!form.groom_name.trim();
  const go=n=>{setTried(false);setI(Math.max(0,Math.min(n,steps.length-1)));};
  const next=()=>{if(st.id==="names"&&!namesOk){setTried(true);return;}go(idx+1);};
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);
  // תצוגה חיה
  const typeImg=WIZ_TYPES.find(t=>t[0]===form.event_type)?.[3];
  const cover=coverImgOf(form.event_type,form.template_id)||typeImg;
  const ivs=INVITE_STYLES.find(x=>x.id===(form.invite_style||"classic"))||INVITE_STYLES[0];
  const nameA=form.groom_name.trim()||(wedding?k.roles[0][1]:""),nameB=form.bride_name.trim()||(wedding?k.roles[1][1]:"");
  const dateStr=form.date?fmtDateHe(form.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"התאריך יופיע כאן";
  return(
    <div className="wz-ov" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <style>{WIZ_CSS}</style>
      <div className="wz" role="dialog" aria-modal="true" aria-label="יצירת אירוע חדש" style={typeImg||cover?{backgroundImage:`linear-gradient(180deg,rgba(255,251,247,.82),rgba(255,251,247,.9)),url(${typeImg||cover})`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}>
        <div className="wz-main">
          <div className="wz-top">
            <nav className="wz-steps" aria-label="שלבי יצירת האירוע">
              {steps.map((s2,j)=>(
                <button key={s2.id} type="button" className={`wz-step${j===idx?" on":j<idx?" done":""}`} aria-current={j===idx?"step":undefined}
                  onClick={()=>j<idx&&go(j)} aria-label={`שלב ${j+1}: ${s2.l}${j<idx?" (הושלם)":""}`}>
                  {j<idx?`✓ ${s2.l}`:s2.l}
                </button>))}
            </nav>
            <button type="button" className="wz-x" onClick={onClose} aria-label="סגירה">×</button>
          </div>

          <div className="wz-body" key={st.id}>
            {st.id==="type"&&<>
              <h2>איזה אירוע חוגגים?</h2>
              <p className="wz-sub">בוחרים סוג, וכל השאר מתאים את עצמו: השדות, ההזמנה וההודעות</p>
              <div className="wz-types" role="radiogroup" aria-label="סוג האירוע">
                {WIZ_TYPES.map(([v,l,d,img])=>(
                  <button key={v} type="button" role="radio" aria-checked={form.event_type===v} className={`wz-card${img?"":" plain"}`}
                    onClick={()=>{set("event_type",v);if(v!=="wedding")set("bride_name","");}}>
                    {img&&<img src={img} alt="" loading="lazy"/>}<span className="sh"/>
                    <span className="ck" aria-hidden="true">✓</span>
                    <span className="tx"><b>{l}</b><span>{d}</span></span>
                  </button>))}
              </div>
            </>}

            {st.id==="couple"&&<>
              <h2>מי מתחתנים?</h2>
              <p className="wz-sub">לפי הבחירה יופיעו השמות בהזמנה ובפרטי האירוע</p>
              <div className="wz-couple" role="radiogroup" aria-label="בני הזוג">
                {Object.entries(COUPLE_TYPES).map(([id,c])=>(
                  <button key={id} type="button" role="radio" aria-checked={(form.couple_type||"mf")===id} className="wz-cp" onClick={()=>set("couple_type",id)}>
                    <span className="ic" aria-hidden="true">{WIZ_COUPLE_ICON[id]}</span>
                    <span className="lb">{c.label}</span>
                  </button>))}
              </div>
            </>}

            {st.id==="child"&&<>
              <h2>{form.event_type==="brit"?"נולד בן או נולדה בת?":"בר מצווה או בת מצווה?"}</h2>
              <p className="wz-sub">לפי הבחירה יתאימו השדות, שם האירוע וההודעות</p>
              <div className="wz-couple" role="radiogroup" aria-label="בן או בת" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
                {[["m",form.event_type==="brit"?"ברית לבן":"בר מצווה","👦"],["f",form.event_type==="brit"?"שמחת בת / בריתה":"בת מצווה","👧"]].map(([v,l,ic])=>(
                  <button key={v} type="button" role="radio" aria-checked={(form.child_gender||"m")===v} className="wz-cp" onClick={()=>set("child_gender",v)}>
                    <span className="ic" aria-hidden="true">{ic}</span><span className="lb">{l}</span>
                  </button>))}
              </div>
            </>}

            {st.id==="names"&&<>
              <h2>{wedding?"איך קוראים לכם?":"מי בעלי השמחה?"}</h2>
              <p className="wz-sub">השמות יופיעו בהזמנה ובהודעות לאורחים</p>
              <label className="wz-f"><span>{k.a}</span>
                <input value={form.groom_name} onChange={e=>set("groom_name",e.target.value)} maxLength={25} autoFocus/>
                {tried&&!form.groom_name.trim()&&<em className="wz-err">צריך למלא {k.a.replace(/^שם /,"את שם ")}</em>}
              </label>
              {wedding&&<label className="wz-f"><span>{k.b}</span>
                <input value={form.bride_name} onChange={e=>set("bride_name",e.target.value)} maxLength={25}/>
                {tried&&!form.bride_name.trim()&&<em className="wz-err">צריך למלא {k.b.replace(/^שם /,"את שם ")}</em>}
              </label>}
              <div className={k.pb?"wz-row":undefined}>
                <label className="wz-f"><span>{k.pa} <small style={{fontWeight:500,color:"#6E6585"}}>(רשות)</small></span>
                  <input value={form.groom_father} onChange={e=>set("groom_father",e.target.value)} maxLength={75}/></label>
                {k.pb&&<label className="wz-f"><span>{k.pb} <small style={{fontWeight:500,color:"#6E6585"}}>(רשות)</small></span>
                  <input value={form.bride_father} onChange={e=>set("bride_father",e.target.value)} maxLength={75}/></label>}
              </div>
            </>}

            {st.id==="when"&&<>
              <h2>מתי ואיפה?</h2>
              <p className="wz-sub">לא חובה עכשיו, אפשר להשלים גם אחר כך בפרטי האירוע</p>
              <div className="wz-row3">
                <div className="wz-f"><span>תאריך האירוע</span>
                  <DateField value={form.date} onChange={v=>set("date",v)} style={{width:"100%",border:"1.5px solid #E6DDF5",borderRadius:100,padding:"13px 18px",fontSize:16,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
                  {hebrewDateStr(form.date)&&<span style={{display:"inline-block",marginTop:6,fontSize:13,color:"#4A2C8F",fontWeight:700}}>✡️ {hebrewDateStr(form.date,true)}</span>}
                </div>
                <label className="wz-f"><span>קבלת פנים</span><input type="time" dir="ltr" value={form.reception_time} onChange={e=>set("reception_time",e.target.value)}/></label>
                <label className="wz-f"><span>{wedding?"חופה":"תחילת האירוע"}</span><input type="time" dir="ltr" value={form.event_time} onChange={e=>set("event_time",e.target.value)}/></label>
              </div>
              <div className="wz-f"><span>שם האולם / מקום האירוע</span>
                <VenueInput value={form.venue} onChange={v=>setForm(f=>({...f,venue:v,venue_address:""}))} onPick={v=>setForm(f=>({...f,venue:v.name,venue_address:v.address||""}))} placeholder="אולמי הגן, תל אביב"
                  inputStyle={{width:"100%",border:"1.5px solid #E6DDF5",borderRadius:100,padding:"13px 18px",fontSize:16,outline:"none",fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
                {form.venue_address&&<span style={{display:"block",marginTop:6,fontSize:13,color:"#5E5470"}}>📍 {form.venue_address}</span>}
              </div>
            </>}

            {st.id==="design"&&<>
              <h2>איך ההזמנה תיראה?</h2>
              <p className="wz-sub">בוחרים תמונת פתיחה וסגנון. אפשר לשנות בכל רגע, וגם להעלות תמונה משלכם אחרי היצירה</p>
              <div style={{fontFamily:"'Fredoka','Heebo',sans-serif",fontSize:16,fontWeight:700,color:"#2B1D3F",margin:"0 0 8px"}}>🖼️ תמונת הפתיחה</div>
              <InviteCoverPicker eventType={form.event_type} value={form.template_id} onChange={v=>set("template_id",v)}/>
              <div style={{fontFamily:"'Fredoka','Heebo',sans-serif",fontSize:16,fontWeight:700,color:"#2B1D3F",margin:"18px 0 8px"}}>🎨 סגנון ההזמנה</div>
              <InviteStylePicker value={form.invite_style||"classic"} onChange={v=>set("invite_style",v)} img={coverImgOf(form.event_type,form.template_id)} title={wedding?`${nameA} & ${nameB}`:(form.groom_name.trim()||evName)}/>
            </>}

            {st.id==="finish"&&<>
              <h2>כמעט סיימנו</h2>
              <p className="wz-sub">בודקים את השם ויוצרים את האירוע</p>
              <label className="wz-f"><span>שם האירוע {autoName(form)?<small style={{fontWeight:500,color:"#6E6585"}}>(רשות)</small>:"*"}</span>
                <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder={autoName(form)||"למשל: יום ההולדת של דנה"}/></label>
              <label className="wz-f"><span>הנייד שלכם <small style={{fontWeight:500,color:"#6E6585"}}>(רשות · לעדכונים ולתמיכה)</small></span>
                <input value={form.host_phone} onChange={e=>set("host_phone",e.target.value)} placeholder="050-0000000" type="tel" dir="ltr" inputMode="tel" maxLength={20} style={{textAlign:"right"}}/>
                {form.host_phone&&!normPhone(form.host_phone)&&<em className="wz-err">מספר הנייד לא תקין</em>}
              </label>
              <div style={{background:"#fff",borderRadius:22,padding:"14px 18px",fontSize:15,color:"#3E3555",lineHeight:1.8,boxShadow:"0 12px 26px -22px rgba(43,29,63,.6)"}}>
                <b style={{fontFamily:"'Fredoka','Heebo',sans-serif",color:"#2B1D3F"}}>{evName||"האירוע שלכם"}</b><br/>
                {form.date?`📅 ${dateStr}`:"📅 בלי תאריך עדיין"}{form.event_time?` · ${form.event_time}`:""}<br/>
                {form.venue?`📍 ${form.venue}`:"📍 בלי מקום עדיין"}
              </div>
            </>}
          </div>

          <div className="wz-acts">
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {idx>0?<button type="button" className="wz-btn g" onClick={()=>go(idx-1)}>חזרה</button>:<button type="button" className="wz-btn g" onClick={onClose}>ביטול</button>}
              {(st.id==="when"||st.id==="design")&&<button type="button" className="wz-btn s" onClick={()=>go(idx+1)}>דלג</button>}
            </div>
            {st.id!=="finish"
              ?<button type="button" className="wz-btn p" onClick={next}>המשך ←</button>
              :<div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                <button type="button" className="wz-btn g" disabled={creating||!evName} onClick={()=>onCreate(true)}>צור והמשך לפרטים המלאים</button>
                <button type="button" className="wz-btn p" disabled={creating||!evName} onClick={()=>onCreate(false)}>{creating?"יוצר...":"✨ צור אירוע"}</button>
              </div>}
          </div>
        </div>

        <aside className="wz-side" aria-label="תצוגת ההזמנה" style={{backgroundImage:`linear-gradient(180deg,rgba(43,29,63,.55),rgba(43,29,63,.75)),url(${typeImg||cover})`}}>
          <h3>תצוגת ההזמנה</h3>
          <div className="wz-ph" aria-hidden="true">
            <span className="isl"/>
            <div className="cv" style={{backgroundImage:cover?`url(${cover})`:undefined}}>
              <div className="nm">{wedding?<>{nameA}<i>&</i>{nameB}</>:(form.groom_name.trim()||evName||"שם האירוע")}</div>
            </div>
            <div className="bd" style={{background:ivs.id==="evening"?"#2A1A3E":ivs.card,color:ivs.ink}}>
              <div className="dt" style={{fontFamily:ivs.font}}>{dateStr}</div>
              <div className="ln">{[form.reception_time&&`קבלת פנים ${form.reception_time}`,form.event_time&&`${wedding?"חופה":"תחילה"} ${form.event_time}`].filter(Boolean).join(" · ")||"השעות יופיעו כאן"}</div>
              <div className="ln">{form.venue?`📍 ${form.venue}`:"📍 המקום יופיע כאן"}</div>
              <span className="pl" style={{background:ivs.accent,color:ivs.id==="evening"?"#241433":"#fff"}}>אישור הגעה</span>
            </div>
          </div>
          <small>התצוגה מתעדכנת בזמן אמת בזמן שממלאים</small>
        </aside>
      </div>
    </div>
  );
}

// ─── CREATE EVENT SCREEN ──────────────────────────────────────────────────────
export function CreateEventScreen({ user, onSelect, onLogout, onBackToLanding, onVendor, vendorSetup=false }) {
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState(false);
  const [showForm,setShowForm]=useState(false);
  // מחיקת אירוע (רק בעל האירוע) — תמיד אחרי אישור בחלון
  const [delEv,setDelEv]=useState(null),[delBusy,setDelBusy]=useState(false),[delErr,setDelErr]=useState("");
  const doDelete=async()=>{
    if(!delEv)return;setDelBusy(true);setDelErr("");
    const{error}=await sb.from("events").delete().eq("id",delEv.id);
    setDelBusy(false);
    if(error){setDelErr(error.message||"המחיקה נכשלה");return;}
    try{if(localStorage.getItem("sidor_event_id")===String(delEv.id))localStorage.removeItem("sidor_event_id");}catch{}
    setEvents(es=>es.filter(e=>e.id!==delEv.id));setDelEv(null);
  };
  const editEvent=ev=>{setPendingScreen("settings");onSelect(ev);};
  const [form,setForm]=useState({name:"",date:"",event_type:"wedding",couple_type:"mf",child_gender:"m",template_id:"classic",invite_style:"classic",groom_name:"",bride_name:"",venue:"",venue_address:"",event_time:"",reception_time:"",groom_father:"",bride_father:"",host_phone:""});
  // שם אוטומטי לפי סוג האירוע והשמות (אם לא כתבו שם)
  const autoName=f=>{const g=f.groom_name.trim(),b=f.bride_name.trim();
    return f.event_type==="wedding"?(g&&b?`החתונה של ${g} ו${b}`:g||b?`החתונה של ${g||b}`:"")
      :f.event_type==="bar_mitzvah"?(g?`${f.child_gender==="f"?"בת המצווה":f.child_gender==="m"?"בר המצווה":"בר/ת המצווה"} של ${g}`:""):f.event_type==="brit"?(g?`${f.child_gender==="f"?"שמחת הבת":"הברית"} של ${g}`:""):g;};
  const evName=form.name.trim()||autoName(form);

  // נתונים לכל אירוע (אישרו / הושבו / יתרת SMS) + האם המשתמש מפיק
  const [stats,setStats]=useState({}),[balances,setBalances]=useState({}),[isProducer,setIsProducer]=useState(false);
  const [view,setView]=useState(()=>{try{return localStorage.getItem("sidor_events_view")||"";}catch{return "";}});
  const [range,setRange]=useState("upcoming"),[q,setQ]=useState("");
  // נכנסו דרך "כניסת מפיקים": אם החשבון עוד לא מפיק מציגים איך מצטרפים. הדגל נמחק כדי שרענון בתוך אירוע ישחזר אותו כרגיל
  const [producerEntry,setProducerEntry]=useState(()=>{try{const v=!!sessionStorage.getItem(PRODUCER_ENTRY_KEY);sessionStorage.removeItem(PRODUCER_ENTRY_KEY);return v;}catch{return false;}});
  const [statsReady,setStatsReady]=useState(false);
  useEffect(()=>{if(view)optSet("sidor_events_view",view);},[view]);
  useEffect(()=>{
    loadMyEvents(user,"created_at",false)
      .then(async data=>{
        const evs=data||[];
        setEvents(evs);
        if(evs.length===0&&!producerEntry)setShowForm(true);
        setLoading(false);
        const ids=evs.map(e=>e.id);
        const [{data:g},{data:b},{data:p},{data:t}]=await Promise.all([
          ids.length?sb.from("guests").select("event_id,rsvp,guest_count,table_id").in("event_id",ids):{data:[]},
          ids.length?sb.from("sms_balance").select("event_id,balance").in("event_id",ids):{data:[]},
          sb.from("user_packages").select("package_id").eq("user_id",user.id),
          ids.length?sb.from("tables").select("event_id").in("event_id",ids):{data:[]},
        ]);
        const st={};(g||[]).forEach(x=>{const s=st[x.event_id]||={rows:0,people:0,confirmed:0,declined:0,pending:0,seated:0,unseated:0,tables:0};const n=x.guest_count||1;s.rows++;s.people+=n;if(x.rsvp==="confirmed"){s.confirmed+=n;if(!x.table_id)s.unseated++;}else if(x.rsvp==="declined")s.declined+=n;else s.pending+=n;if(x.table_id)s.seated++;});
        (t||[]).forEach(x=>{(st[x.event_id]||={rows:0,people:0,confirmed:0,declined:0,pending:0,seated:0,unseated:0,tables:0}).tables++;});
        setStats(st);setBalances(Object.fromEntries((b||[]).map(x=>[x.event_id,x.balance])));
        setIsProducer((p||[]).some(x=>x.package_id==="producer"));
        setStatsReady(true);
      });
  },[]);

  // goDetails: אחרי היצירה נכנסים ישר ל"פרטי האירוע" להשלמת שאר הפרטים (נוסח, מפה, קישורי מתנה...)
  const create=async(goDetails=false)=>{
    if(!evName)return;
    if(form.host_phone&&!normPhone(form.host_phone)){alert("מספר הנייד לא תקין");return;}
    setCreating(true);
    const invite_code=Math.random().toString(36).slice(2,10);
    const {couple_type,invite_style,child_gender,...rest}=form;
    const clean=Object.fromEntries(Object.entries(rest).map(([k,v])=>[k,typeof v==="string"?v.trim():v]).filter(([k,v])=>v!==""||k==="date"));
    const sj={...(form.event_type==="wedding"&&couple_type&&couple_type!=="mf"?{coupleType:couple_type}:{}),...(invite_style&&invite_style!=="classic"?{inviteStyle:invite_style}:{}),...((form.event_type==="bar_mitzvah"||form.event_type==="brit")&&child_gender?{childGender:child_gender}:{})};
    const extra=Object.keys(sj).length?{settings_json:sj}:{};
    const{data,error}=await sb.from("events").insert(eventRow({...clean,...extra,name:evName,user_id:user.id,invite_code,invite_active:true})).select().single();
    setCreating(false);
    if(error||!data){alert("יצירת האירוע נכשלה: "+(error?.message||"נסו שוב"));return;}
    if(goDetails)setPendingScreen("settings");
    onSelect(data);
  };

  const eventTypeEmoji=(t)=>t==="wedding"?"💍":t==="bar_mitzvah"?"✡️":t==="brit"?"👶":t==="business"?"💼":"🎉";
  const eventTypeName=(t)=>t==="wedding"?"חתונה":t==="bar_mitzvah"?"בר/ת מצווה":t==="brit"?"ברית":t==="business"?"עסקי":"אחר";

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f0e6ff,#e6f0ff,#e6fff0)"}}><Spinner size={40} color="#9147D6"/></div>);

  return(
    <div dir="rtl" className="evs" style={{minHeight:"100vh",fontFamily:"'Heebo',sans-serif",position:"relative",overflowX:"hidden",
      background:"radial-gradient(760px 520px at 92% 0%,#F7F2FF 0%,rgba(247,242,255,0) 62%),radial-gradient(680px 520px at 4% 30%,#FFF4F9 0%,rgba(255,244,249,0) 62%),radial-gradient(640px 440px at 50% 100%,#F1FBF6 0%,rgba(241,251,246,0) 60%),#FFFEFC"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @media(max-width:600px){.ev-top{right:8px!important;left:8px!important;padding:0 10px!important}.ev-wrap{padding:96px 14px 20px!important}.ev-hero{flex-direction:column;align-items:stretch!important;gap:18px;padding:26px 20px!important}.ev-hero button{width:100%;justify-content:center}}
        /* שפת העיצוב של דף הבית: גופן מעוגל, גלולות, כרטיסים רכים וצבע לכל סוג אירוע */
        .evs h1,.evs h2,.evs button,.evs .ev-f{font-family:'Fredoka','Heebo',sans-serif}
        .evs{font-synthesis-weight:none}
        .evs h1 mark{color:inherit;padding:0 .12em;border-radius:.22em;background:linear-gradient(120deg,#FFD1E5,#FFB2D3)}
        .evs .ev-blobs i{position:absolute;border-radius:50%;pointer-events:none}
        .evs .ev-live{background:linear-gradient(135deg,#2B1D3F,#4A2C8F 60%,#7A3FBF);color:#fff;border-radius:26px;padding:18px 20px;margin-bottom:16px;box-shadow:0 26px 50px -28px rgba(43,29,63,.75)}
        .evs .ev-live-h{display:flex;align-items:center;gap:9px;font:700 15px 'Fredoka','Heebo',sans-serif;margin-bottom:10px;color:#FFE3EE}
        .evs .ev-live-h .dot{width:10px;height:10px;border-radius:50%;background:#FF5C8A;box-shadow:0 0 0 0 rgba(255,92,138,.7)}
        @media(prefers-reduced-motion:no-preference){.evs .ev-live-h .dot{animation:evPulse 1.6s ease-out infinite}}
        @keyframes evPulse{0%{box-shadow:0 0 0 0 rgba(255,92,138,.7)}100%{box-shadow:0 0 0 12px rgba(255,92,138,0)}}
        .evs .ev-live-row{background:rgba(255,255,255,.08);border-radius:20px;padding:14px 16px;display:grid;gap:8px}
        .evs .ev-live-row + .ev-live-row{margin-top:10px}
        .evs .ev-live-name{font-weight:800;font-size:15px}.evs .ev-live-name small{font-weight:600;opacity:.85;font-size:13px}
        .evs .ev-live-big{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
        .evs .ev-live-big b{font:700 44px/1 'Fredoka','Heebo',sans-serif;font-variant-numeric:tabular-nums;color:#fff}
        .evs .ev-live-big span{font-size:15px;color:#E9DDFF;font-weight:700}
        .evs .ev-live-bar{height:10px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}
        .evs .ev-live-bar u{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3CC8A0,#9BF0D2);transition:width 600ms cubic-bezier(0.23,1,0.32,1)}
        .evs .ev-live-meta{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:#E9DDFF;font-weight:600}
        .evs .ev-live-meta .up{color:#9BF0D2;font-weight:800}
        .evs .ev-live-go{justify-self:start;border:none;border-radius:999px;background:#fff;color:#2B1D3F;font:700 14px 'Fredoka','Heebo',sans-serif;padding:9px 16px;cursor:pointer;min-height:40px}
        .evs .ev-live-go:focus-visible{outline:3px solid #9BF0D2;outline-offset:2px}
        .evs .ev-tiles{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:16px}
        .evs .ev-tile{background:#fff;border-radius:18px;padding:14px 16px;border:1.5px solid #EFE6F7;box-shadow:0 14px 30px -24px rgba(91,60,140,.5);min-width:0}
        .evs .ev-tile > div:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        @media(max-width:1000px){.evs .ev-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:600px){.evs .ev-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
        /* כותרת "האירועים שלי": תמונות בהירות של סוגי אירועים, נעלמות לכיוון הטקסט */
        .evs .ev-hero{position:relative;overflow:hidden;isolation:isolate}
        .evs .ev-hero > :not(.ev-hero-ph){position:relative;z-index:1}
        .evs .ev-hero-ph{position:absolute;inset:0;z-index:0;display:flex;justify-content:flex-end;pointer-events:none;opacity:.34;filter:saturate(.8);-webkit-mask-image:linear-gradient(to right,#000 0%,rgba(0,0,0,.85) 28%,transparent 70%);mask-image:linear-gradient(to right,#000 0%,rgba(0,0,0,.85) 28%,transparent 70%)}
        .evs .ev-hero-ph img{width:17%;height:100%;object-fit:cover;display:block}
        @media(max-width:600px){.evs .ev-hero-ph{opacity:.26;-webkit-mask-image:linear-gradient(to top,#000 0%,rgba(0,0,0,.7) 35%,transparent 80%);mask-image:linear-gradient(to top,#000 0%,rgba(0,0,0,.7) 35%,transparent 80%)}.evs .ev-hero-ph img{width:25%}}
        .evs .ev-card{border-radius:28px!important;border:none!important;box-shadow:0 18px 44px -28px rgba(91,60,140,.45)!important;transition:translate 250ms cubic-bezier(0.23,1,0.32,1),box-shadow 250ms cubic-bezier(0.23,1,0.32,1)!important}
        @media(hover:hover) and (pointer:fine){.evs .ev-card:hover{translate:0 -5px;box-shadow:0 28px 56px -30px rgba(91,60,140,.55)!important}}
        .evs .ev-card:before{content:"";position:absolute;top:0;right:0;left:0;height:7px;background:var(--evc,#F0609E)}
        .evs .ev-new{background:rgba(255,255,255,.6)!important;border:2px dashed #D9C6FF!important;border-radius:28px!important}
        .evs .ev-new:hover,.evs .ev-new:focus-visible{background:#fff!important;border-color:#9B6BFF!important}
        .evs-form{border-radius:32px!important;background:radial-gradient(420px 260px at 90% 0%,#EFE4FF 0%,rgba(239,228,255,0) 70%),#FFFBF7!important}
        .evs-form h2{font-family:'Fredoka','Heebo',sans-serif;font-weight:700}
        .evs-form input,.evs-form textarea{border-radius:16px!important;min-height:48px;background:#fff!important;border-color:#E6DDF5!important}
        .evs-form input:focus,.evs-form textarea:focus{border-color:#9B6BFF!important;box-shadow:0 0 0 4px rgba(155,107,255,.18)}
        .evs-form > div > div > div:first-child,.evs-form label{color:#3E3555!important}
        .evs .sx-btn:focus-visible,.evs button:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}
      `}</style>
      <div className="ev-blobs" aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
        <i style={{width:200,height:200,top:90,left:"8%",background:"radial-gradient(circle at 30% 30%,#fff,#E9DDFF 60%,#D9C6FF)",opacity:.6}}/>
        <i style={{width:110,height:110,top:320,right:"4%",background:"radial-gradient(circle at 30% 30%,#fff,#FFD6E8 60%,#FFB8D6)",opacity:.65}}/>
        <i style={{width:80,height:80,bottom:120,left:"30%",background:"radial-gradient(circle at 30% 30%,#fff,#CFF3E4 60%,#A8EBD2)",opacity:.7}}/>
      </div>

      {/* TOP NAV */}
      <header className="ev-top" style={{background:"rgba(255,255,255,.97)",borderRadius:100,boxShadow:"0 16px 40px -20px rgba(60,35,110,.45)",padding:"0 14px 0 18px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",position:"fixed",top:12,right:"3vw",left:"3vw",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
          <SidorLogo size={36} id="evLogo"/>
          <span className="ev-f" style={{fontWeight:700,fontSize:20,color:"#2B1D3F",whiteSpace:"nowrap"}}>Sidor-IL</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {onVendor&&<button onClick={onVendor} className="sx-btn"
            style={{background:"#FFF4D6",color:"#7A4E00",border:"none",borderRadius:100,padding:"9px 14px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            🏪 אזור הספקים</button>}
          {onBackToLanding&&<button onClick={onBackToLanding} className="sx-btn"
            style={{background:"#fff",color:"#4A2C8F",border:"none",borderRadius:100,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 10px 22px -14px rgba(43,29,63,.45)"}}>
            דף הבית
          </button>}
          <button onClick={onLogout} title={user.email} className="sx-btn"
            style={{background:"#FFEFF2",color:"#B42318",border:"none",borderRadius:100,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            התנתקות
          </button>
        </div>
      </header>

      <div className="ev-wrap" style={{maxWidth:1100,margin:"0 auto",padding:"108px 24px 40px",position:"relative"}}>
        {vendorSetup&&onVendor&&<div role="status" style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",background:"linear-gradient(135deg,#FFF4D6,#FFE9F2)",borderRadius:24,padding:"16px 20px",marginBottom:18,boxShadow:"0 18px 40px -30px rgba(122,78,0,.6)"}}>
          <span style={{fontSize:30}} aria-hidden="true">🏪</span>
          <div style={{flex:"1 1 260px"}}>
            <div style={{fontSize:17,fontWeight:800,color:"#2B1D3F"}}>החשבון שלך הופעל כחשבון ספק</div>
            <div style={{fontSize:14,color:"#5E4A2A"}}>נשאר צעד אחד: ממלאים את פרטי העסק, והפרופיל עולה מיד לזוגות ולמשפחות.</div>
          </div>
          <button type="button" onClick={onVendor} className="sx-btn" style={{background:"#2B1D3F",color:"#fff",border:"none",borderRadius:999,padding:"12px 20px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",minHeight:46}}>להשלמת פרטי העסק</button>
        </div>}

        {/* כותרת: באנר צבעוני בהיר */}
        <div className="ev-hero" style={{background:"linear-gradient(150deg,#E6D9FF 0%,#FFD3E6 55%,#FFE6C4 100%)",borderRadius:36,padding:"30px 36px",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,boxShadow:"0 30px 70px -40px rgba(120,60,170,.6)",animation:"fadeUp .5s cubic-bezier(0.23,1,0.32,1) both"}}>
          <div className="ev-hero-ph" aria-hidden="true">{["1775476793931-cb484f197760","1792587545791-dbff25ac7905","1510154221590-ff63e90a136f","1511578314322-379afb476865"].map(id=><img key={id} src={`/img/u/${id}_500.webp`} alt="" loading="lazy" decoding="async"/>)}</div>
          <div>
            <h1 style={{fontSize:"clamp(28px,3.4vw,44px)",fontWeight:700,color:"#2B1D3F",margin:"0 0 8px",lineHeight:1.15}}>{isProducer?<>לוח <mark>המפיק</mark></>:<>האירועים <mark>שלי</mark></>}</h1>
            {/* משפט על הנתונים, לא על הממשק */}
            <p style={{fontSize:16,color:"#3E3555",margin:0}}>{(()=>{
              const t0=new Date();t0.setHours(0,0,0,0);
              const up=events.filter(e=>!e.date||new Date(e.date+"T00:00:00")>=t0);
              if(!events.length)return "עוד אין אירועים. מתחילים ביצירת האירוע הראשון";
              const next=up.filter(e=>e.date).sort((a,b)=>a.date.localeCompare(b.date))[0];
              const dd=next?Math.round((new Date(next.date+"T00:00:00")-t0)/864e5):null;
              return `${up.length===1?"אירוע קרוב אחד":`${up.length} אירועים קרובים`}${next?` · הקרוב ${dd===0?"היום":`בעוד ${dd} ימים`}`:""}`;
            })()}</p>
          </div>
          <button onClick={()=>setShowForm(true)} className="sx-btn"
            style={{background:"linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF)",color:"#fff",border:"none",borderRadius:100,padding:"14px 28px",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,flexShrink:0,boxShadow:"0 14px 30px -12px rgba(240,96,158,.65)"}}>
            + אירוע חדש
          </button>
        </div>

        {/* כרטיסי אירועים */}
        {events.length===0&&!showForm&&(
          <div style={{textAlign:"center",padding:"80px 0",animation:"fadeUp .5s ease both"}}>
            <div style={{fontSize:64,marginBottom:16}}>🎉</div>
            <div style={{fontSize:20,fontWeight:800,color:"#2B1D3F",marginBottom:8}}>אין עדיין אירועים</div>
            <div style={{fontSize:14,color:"#6E6585",marginBottom:28}}>צור את האירוע הראשון שלך עכשיו</div>
            <button onClick={()=>setShowForm(true)}
              style={{background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:14,padding:"14px 36px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              + צור אירוע חדש
            </button>
          </div>
        )}

        {/* מפיק: סיכום כל האירועים + מה דורש טיפול */}
        {isProducer&&events.length>0&&(()=>{
          const t0=new Date();t0.setHours(0,0,0,0);
          const dl=e=>e.date?Math.round((new Date(e.date+"T00:00:00")-t0)/864e5):null;
          const up=events.filter(e=>{const d=dl(e);return d===null||d>=0;});
          const sum=k=>up.reduce((n,e)=>n+((stats[e.id]||{})[k]||0),0);
          const people=sum("people"),conf=sum("confirmed");
          const attn=[];
          up.forEach(e=>{
            const d=dl(e);if(d===null||d>30)return;
            const s=stats[e.id]||{},cp=s.people?Math.round(s.confirmed/s.people*100):0,issues=[];
            if(!s.rows)issues.push("אין עדיין מוזמנים");
            else if(d<=21&&s.pending&&cp<50)issues.push(`${s.pending} ממתינים לתשובה (${cp}% אישרו)`);
            if(s.rows&&d<=10&&!s.tables)issues.push("אין מפת אולם");
            if(d<=7&&s.unseated)issues.push(`${s.unseated} שאישרו עוד לא הושבו`);
            if(issues.length)attn.push({e,d,issues});
          });
          attn.sort((a,b)=>a.d-b.d);
          const nowH=new Date().getHours();
          const liveEvs=events.filter(e=>{const d=dl(e);return d===0||(d===-1&&nowH<6);});
          const tiles=[["📅",up.length,"אירועים קרובים"],["⏳",up.filter(e=>{const d=dl(e);return d!==null&&d<=30;}).length,"ב-30 הימים הקרובים"],["👥",people.toLocaleString("he-IL"),"מוזמנים (קרובים)"],["✅",`${people?Math.round(conf/people*100):0}%`,`אישרו · ${conf.toLocaleString("he-IL")}`],["✉️",sum("pending").toLocaleString("he-IL"),"ממתינים לתשובה"],["⚠️",attn.length,"דורשים טיפול"]];
          return(<>
            {liveEvs.length>0&&<LiveArrivals events={liveEvs} onOpen={e=>onSelect(e,"checkin")}/>}
            <div className="ev-tiles">
              {tiles.map(([ic,v,l])=>(
                <div key={l} className="ev-tile">
                  <div style={{fontSize:12,color:"#6E6585",fontWeight:700,marginBottom:4}}>{ic} {l}</div>
                  <div style={{fontSize:24,fontWeight:900,color:l==="דורשים טיפול"&&attn.length?"#C53030":"#2B1D3F",fontVariantNumeric:"tabular-nums"}}>{statsReady?<CountUp value={v}/>:"…"}</div>
                </div>
              ))}
            </div>
            {statsReady&&attn.length>0&&(
              <div style={{background:"#FFF8F1",border:"1.5px solid #FBD38D",borderRadius:16,padding:"14px 16px",marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:900,color:"#9C4221",marginBottom:8}}>⚠️ דורשים טיפול ב-30 הימים הקרובים</div>
                {attn.map(({e,d,issues})=>(
                  <div key={e.id} onClick={()=>onSelect(e)} role="button" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,cursor:"pointer",background:"#fff",marginBottom:6,border:"1px solid #FEEBC8"}}>
                    <span style={{fontSize:12,fontWeight:900,color:d<=7?"#C53030":"#9C4221",minWidth:58}}>{d===0?"היום":`עוד ${d} ימים`}</span>
                    <span style={{fontSize:13,fontWeight:800,color:"#2B1D3F"}}>{eventTypeEmoji(e.event_type)} {e.name}</span>
                    <span style={{flex:1,fontSize:12,color:"#744210"}}>{issues.join(" · ")}</span>
                    <span style={{fontSize:12,fontWeight:800,color:"#9147D6",whiteSpace:"nowrap"}}>לאירוע ←</span>
                  </div>
                ))}
              </div>
            )}
          </>);
        })()}

        {/* מפיק: לוח בקרה בטבלה (אפשר לעבור לכרטיסים) */}
        {isProducer&&events.length>0&&(
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:16}}>
            {[["table","📋 טבלה"],["cards","🗂️ כרטיסים"]].map(([k,l])=>(
              <button key={k} onClick={()=>setView(k)} aria-pressed={(view||"table")===k} style={{background:(view||"table")===k?"#2B1D3F":"#fff",color:(view||"table")===k?"#fff":"#2B1D3F",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
        )}
        {isProducer&&(view||"table")==="table"&&events.length>0?(()=>{
          const t0=new Date();t0.setHours(0,0,0,0);
          const dl=e=>e.date?Math.round((new Date(e.date+"T00:00:00")-t0)/864e5):null;
          const list=events.filter(e=>{const d=dl(e);return range==="all"||(range==="upcoming"?(d===null||d>=0):(d!==null&&d<0));})
            .filter(e=>!q.trim()||[e.name,e.venue,e.groom_name,e.bride_name].some(x=>String(x||"").includes(q.trim())))
            .sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")*(range==="past"?-1:1));
          const pctCell=(v,col)=><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{flex:1,minWidth:40,height:6,background:"#EEE",borderRadius:3,overflow:"hidden"}}><div style={{width:v+"%",height:"100%",background:col}}/></div><span style={{fontSize:12,fontWeight:800,minWidth:32}}>{v}%</span></div>;
          return(
            <div style={{background:"#fff",borderRadius:20,padding:16,boxShadow:"0 2px 16px rgba(155,107,255,.08)",marginBottom:32}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                {[["upcoming","קרובים"],["past","עברו"],["all","הכל"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setRange(k)} aria-pressed={range===k} style={{background:range===k?"#9147D6":"#fff",color:range===k?"#fff":"#9147D6",border:"1.5px solid #E9D8FD",borderRadius:100,padding:"5px 14px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
                ))}
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חיפוש אירוע, אולם או שם" style={{flex:"1 1 200px",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"7px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:820,fontVariantNumeric:"tabular-nums"}}>
                  <thead><tr style={{background:"#F7F3FB",textAlign:"right"}}>{["אירוע","תאריך","עוד","התקדמות","מוזמנים","אישרו","ממתינים","הושבו","SMS"].map(h=><th key={h} style={{padding:"9px 10px",fontWeight:900,color:"#4A3D66",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                  <tbody>{list.map(e=>{const s=stats[e.id]||{},d=dl(e),conf=s.people?Math.round(s.confirmed/s.people*100):0,seat=s.rows?Math.round(s.seated/s.rows*100):0;return(
                    <tr key={e.id} onClick={()=>onSelect(e)} style={{borderTop:"1px solid #F0EAF7",cursor:"pointer"}} onMouseEnter={x=>x.currentTarget.style.background="#FBF8FE"} onMouseLeave={x=>x.currentTarget.style.background=""}>
                      <td style={{padding:"10px",fontWeight:800,color:"#2B1D3F"}}>{eventTypeEmoji(e.event_type)} {e.name}{e._shared&&<span style={{fontSize:12,color:"#0E7490",marginRight:6}}>משותף</span>}<div style={{fontSize:12,color:"#6E6585",fontWeight:500}}>{e.venue||""}</div></td>
                      <td style={{padding:"10px",whiteSpace:"nowrap"}}>{e.date?new Date(e.date+"T00:00:00").toLocaleDateString("he-IL",{day:"numeric",month:"short",year:"2-digit"}):"—"}</td>
                      <td style={{padding:"10px",whiteSpace:"nowrap",fontWeight:800,color:d!==null&&d>=0&&d<=14?"#C53030":"#666"}}>{d===null?"—":d<0?"עבר":d===0?"היום":`${d} ימים`}</td>
                      <td style={{padding:"10px",whiteSpace:"nowrap"}}>{(()=>{
                        // אותם שלבים כמו "השלמו את האירוע" במסך הראשי של האירוע
                        const steps=[["הוספת מוזמנים",s.rows>0],["שליחת הזמנה",(s.confirmed||0)+(s.declined||0)>0],["מפת אולם",s.tables>0],["הושבה",s.seated>0]];
                        const done=steps.filter(x=>x[1]).length,next=steps.find(x=>!x[1]);
                        return(<><div style={{display:"flex",gap:3,marginBottom:3}}>{steps.map(([l,ok])=><span key={l} title={l} style={{width:14,height:6,borderRadius:3,background:ok?"#25D366":"#E2E8F0"}}/>)}</div>
                          <div style={{fontSize:12,fontWeight:700,color:next?"#9147D6":"#276749"}}>{next?`הבא: ${next[0]}`:"✓ הכל מוכן"}</div></>);
                      })()}</td>
                      <td style={{padding:"10px"}}>{s.people||0}</td>
                      <td style={{padding:"10px",minWidth:110}}>{pctCell(conf,"#25D366")}</td>
                      <td style={{padding:"10px",color:s.pending?"#B45309":"#999",fontWeight:700}}>{s.pending||0}</td>
                      <td style={{padding:"10px",minWidth:110}}>{pctCell(seat,"#9147D6")}</td>
                      <td style={{padding:"10px",fontWeight:800,color:(balances[e.id]??0)===0?"#C53030":"#276749"}}>{balances[e.id]??0}</td>
                    </tr>
                  );})}</tbody>
                </table>
                {!list.length&&<div style={{textAlign:"center",color:"#6E6585",padding:24,fontSize:13}}>אין אירועים להצגה</div>}
              </div>
            </div>
          );
        })():
        // מספר העמודות לפי מספר האירועים, כדי שאירוע יחיד לא יעמוד לבד בשורה ריקה; התא האחרון הוא "אירוע חדש"
        events.length>0&&<div className="ev-grid" style={{display:"grid",gridTemplateColumns:events.length<=2?`repeat(${events.length+1},minmax(0,1fr))`:"repeat(auto-fill,minmax(300px,1fr))",gap:20,marginBottom:32}}>
          <style>{`@media(max-width:760px){.ev-grid{grid-template-columns:1fr!important}.ev-new{display:none!important}}
            .ev-new{transition:border-color .15s,background .15s}.ev-new:hover,.ev-new:focus-visible{border-color:#B98AF0!important;background:#FBF7FF!important}`}</style>
          {events.map((ev,i)=>{
            const typeEmoji=eventTypeEmoji(ev.event_type);
            const eventDate=ev.date?new Date(ev.date):null;
            const monthNames=["ינו","פבר","מרץ","אפר","מאי","יוני","יולי","אוג","ספט","אוק","נוב","דצמ"];
            const dayNum=eventDate?eventDate.getDate():null;
            const monthStr=eventDate?monthNames[eventDate.getMonth()]:"";
            const daysLeft=eventDate?Math.ceil((eventDate-new Date())/(1000*60*60*24)):null;
            return(
              <div key={ev.id} className="ev-card"
                onClick={()=>onSelect(ev)}
                style={{"--evc":({wedding:"#F0609E",bar_mitzvah:"#5AA9FF",brit:"#3CC8A0",business:"#9B6BFF"})[ev.event_type]||"#FF8A65",background:"#fff",borderRadius:20,padding:"28px 24px 24px",cursor:"pointer",
                  boxShadow:"0 2px 16px rgba(155,107,255,.08)",
                  border:"1px solid rgba(155,107,255,.08)",
                  animation:`fadeUp .4s ease ${i*.08}s both`,
                  transition:"all .2s",position:"relative",overflow:"hidden"}}>
                {/* התמונה של ההזמנה (שהועלתה, או תמונת הפתיחה שנבחרה) */}
                <div aria-hidden="true" style={{margin:"-28px -24px 16px",height:150,backgroundColor:"#F1EAFF",backgroundImage:`url(${ev.invite_image||coverImgOf(ev.event_type,ev.template_id)})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(28,16,40,.25))"}}/>
                </div>

                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:18}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"#6B6280",fontWeight:700,marginBottom:4}}>{({wedding:"חתונה",bar_mitzvah:"בר/בת מצווה",brit:"ברית",business:"אירוע עסקי"})[ev.event_type]||"אירוע"}{ev._shared?" · משותף איתי":""}</div>
                    <h2 style={{fontSize:19,fontWeight:900,color:"#2B1D3F",margin:"0 0 4px",lineHeight:1.25}}>{ev.name}</h2>
                    <div style={{fontSize:14,color:"#5F5675"}}>
                      {eventDate?eventDate.toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"}):"תאריך עוד לא נקבע"}
                      {ev.event_time?` · ${ev.event_time}`:""}{ev.venue?` · ${ev.venue}`:""}
                    </div>
                  </div>
                  {dayNum&&(
                    <div className="ev-f" style={{background:({wedding:"#FFE6F0",bar_mitzvah:"#E2F1FF",brit:"#E3F8EF",business:"#F1EAFF"})[ev.event_type]||"#FFF0E0",borderRadius:18,padding:"8px 12px",textAlign:"center",flexShrink:0,minWidth:60}}>
                      <div style={{fontSize:24,fontWeight:700,color:"#2B1D3F",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{dayNum}</div>
                      <div style={{fontSize:13,color:"#3E3555",fontWeight:700}}>{monthStr}</div>
                    </div>
                  )}
                </div>

                {/* אישורי הגעה: כמה מגיעים מתוך כמה, ופס אחד מחולק לפי האחוזים האמיתיים */}
                {(()=>{const s=stats[ev.id]||{},people=s.people||0,conf=s.confirmed||0,dec=s.declined||0,pend=s.pending||0,w=v=>people?`${v/people*100}%`:0;return(
                <div style={{background:"#FBF8FD",borderRadius:14,padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:24,fontWeight:900,color:"#2B1D3F",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{statsReady?conf:"…"}</span>
                    <span style={{fontSize:14,fontWeight:700,color:"#2B1D3F"}}>מגיעים</span>
                    <span style={{fontSize:14,color:"#6B6280",fontVariantNumeric:"tabular-nums"}}>מתוך {people} מוזמנים</span>
                  </div>
                  <div role="img" aria-label={`מגיעים ${conf}, לא מגיעים ${dec}, ממתינים ${pend}`} style={{display:"flex",gap:2,height:8,borderRadius:99,overflow:"hidden",background:"#EDE6F4"}}>
                    {conf>0&&<div style={{width:w(conf),background:"#25A55F"}}/>}
                    {dec>0&&<div style={{width:w(dec),background:"#E5566F"}}/>}
                    {pend>0&&<div style={{width:w(pend),background:"#E8A93A"}}/>}
                  </div>
                  <div style={{fontSize:13,color:pend?"#8A5A00":"#5F5675",fontWeight:700,marginTop:8}}>{!people?"עוד לא נוספו מוזמנים":pend?`${pend} עוד לא ענו`:"כל המוזמנים ענו"}</div>
                </div>);})()}

                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginTop:14,fontSize:14}}>
                  <span style={{color:"#7A3FBF",fontWeight:800}}>{daysLeft===null?"":daysLeft>0?`עוד ${daysLeft} ימים`:daysLeft===0?"היום!":"האירוע עבר"}</span>
                  <span style={{display:"flex",alignItems:"center",gap:6}}>
                    <button type="button" className="sx-btn" onClick={e=>{e.stopPropagation();editEvent(ev);}} aria-label={`עריכת פרטי ${ev.name}`}
                      style={{background:"#F6F0FF",color:"#4A2C8F",border:"none",borderRadius:100,padding:"7px 12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✏️ עריכה</button>
                    {!ev._shared&&ev.user_id===user.id&&<button type="button" className="sx-btn" onClick={e=>{e.stopPropagation();setDelErr("");setDelEv(ev);}} aria-label={`מחיקת ${ev.name}`}
                      style={{background:"#FFEFF2",color:"#B42318",border:"none",borderRadius:100,padding:"7px 12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>🗑️ מחיקה</button>}
                    <span style={{color:"#2B1D3F",fontWeight:800,marginRight:4}}>לאירוע ←</span>
                  </span>
                </div>
              </div>
            );
          })}
          <button onClick={()=>setShowForm(true)} className="ev-new"
            style={{background:"transparent",border:"2px dashed #D9C8EE",borderRadius:20,padding:24,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,color:"#2B1D3F"}}>
            <span style={{fontSize:18,fontWeight:900}}>+ אירוע חדש</span>
            <span style={{fontSize:14,color:"#5F5675"}}>חתונה, בר/ת מצווה, ברית או אירוע עסקי</span>
          </button>
        </div>}

        {/* אישור מחיקת אירוע */}
        {delEv&&(
          <div style={{position:"fixed",inset:0,zIndex:260,background:"rgba(43,29,63,.45)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget&&!delBusy)setDelEv(null);}}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="del-h" aria-describedby="del-d" className="evs-form" style={{background:"#fff",borderRadius:30,padding:"26px 24px",width:"100%",maxWidth:440,direction:"rtl",boxShadow:"0 30px 70px -20px rgba(43,29,63,.5)"}}>
              <div aria-hidden="true" style={{width:58,height:58,borderRadius:"50%",background:"#FFEFF2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 12px"}}>🗑️</div>
              <h2 id="del-h" style={{fontSize:21,fontWeight:700,color:"#2B1D3F",textAlign:"center",margin:"0 0 8px"}}>למחוק את "{delEv.name}"?</h2>
              <div id="del-d" style={{fontSize:14,color:"#3E3555",lineHeight:1.7,background:"#FFF6F7",borderRadius:18,padding:"12px 16px",marginBottom:16}}>
                המחיקה סופית ואי אפשר לשחזר אותה. יימחקו גם:
                <br/>• כל האורחים ואישורי ההגעה
                <br/>• השולחנות וסידור ההושבה
                <br/>• יתרת SMS ווואטסאפ שנקנתה לאירוע הזה
              </div>
              {delErr&&<div role="alert" style={{fontSize:13,color:"#B42318",fontWeight:700,marginBottom:10,textAlign:"center"}}>⚠️ {delErr}</div>}
              <div style={{display:"flex",gap:10}}>
                <button type="button" onClick={()=>setDelEv(null)} disabled={delBusy} autoFocus
                  style={{flex:1,background:"#fff",color:"#4A2C8F",border:"none",boxShadow:"inset 0 0 0 1.5px #E6DDF5",borderRadius:100,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer"}}>ביטול</button>
                <button type="button" onClick={doDelete} disabled={delBusy}
                  style={{flex:1,background:"#C2263E",color:"#fff",border:"none",borderRadius:100,padding:"13px",fontSize:15,fontWeight:700,cursor:delBusy?"default":"pointer",opacity:delBusy?.6:1}}>{delBusy?"מוחק...":"כן, למחוק לצמיתות"}</button>
              </div>
            </div>
          </div>
        )}
        {/* יצירת אירוע: אשף שלב אחרי שלב */}
        {showForm&&<CreateEventWizard form={form} setForm={setForm} evName={evName} autoName={autoName} creating={creating} onCreate={create} onClose={()=>setShowForm(false)}/>}
      </div>
    </div>
  );
}


// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
// כניסת אדמין דרך חשבון Supabase אמיתי (לא סיסמה בקוד שכל אחד יכול לקרוא)
export function AdminLogin({ onSuccess, onClose }) {
  const [email,setEmail]=useState(ADMIN_EMAIL);
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [load,setLoad]=useState(false);

  const submit=async()=>{
    if(!pass){setErr("הכנס סיסמה");return;}
    setLoad(true);setErr("");
    const{data,error}=await sb.auth.signInWithPassword({email:email.trim(),password:pass});
    setLoad(false);
    if(error){setErr(authErrorText(error));return;}
    if(!isAdminUser(data.user)){await sb.auth.signOut();setErr("⛔ לחשבון הזה אין הרשאת אדמין");return;}
    onSuccess(data.user);
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0D1117",direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
      <div style={{background:"#161B22",border:"1px solid #30363D",borderRadius:20,padding:"40px 32px",width:"90%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔐</div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:4}}>Sidor-IL Admin</div>
        <div style={{fontSize:13,color:"#6E6585",marginBottom:28}}>כניסה עם חשבון האדמין</div>
        <input type="email" dir="ltr" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="אימייל"
          style={{width:"100%",background:"#21262D",border:"1.5px solid #30363D",borderRadius:12,padding:"13px 16px",fontSize:15,color:"#E6EDF3",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
        <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="סיסמה" autoFocus
          style={{width:"100%",background:"#21262D",border:`1.5px solid ${err?"#F85149":"#30363D"}`,borderRadius:12,padding:"13px 16px",fontSize:16,color:"#E6EDF3",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:err?8:16,textAlign:"right"}}/>
        {err&&<div style={{fontSize:13,color:"#F85149",marginBottom:12}}>{err}</div>}
        <button onClick={submit} disabled={!pass||load}
          style={{width:"100%",background:!pass?"#21262D":"#3A2464",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:16,fontWeight:700,cursor:!pass?"default":"pointer",fontFamily:"inherit",marginBottom:12}}>
          {load?"מתחבר...":"כניסה ←"}
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6E6585",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          חזרה לאתר
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
export const ALL_PACKAGES=[
  {id:"basic",name:"בסיסית",color:"#3A2464",icon:"🪑"},
  {id:"sms",name:"SMS",color:"#059669",icon:"📱"},
  {id:"auto",name:"הודעות WhatsApp",color:"#25D366",icon:"💬"},
  {id:"staff",name:"צוות הושבה",color:"#7C3AED",icon:"👥"},
  {id:"kiosk",name:"עמדת טאבלט",color:"#2B6CB0",icon:"📟"},
  {id:"producer",name:"חשבון מפיק",color:"#0E7490",icon:"🎬"},
  {id:"vendor",name:"חשבון ספק",color:"#C2410C",icon:"🏪"},
];
// חבילות ישנות שעוד רשומות אצל משתמשים — מוצגות רק אצל מי שיש לו, כדי שאפשר יהיה להסיר
export const LEGACY_PACKAGES={whatsapp:"WhatsApp (ישן)",vip:"VIP (ישן)",reception:"עמדת קבלת פנים (ישן)",production:"הפקת אירוע (ישן)",seating:"הושבה (ישן)"};

// כרטיס לקוח באדמין: פרטים, אירועים עם סטטוס, חבילות, נייד (וואטסאפ) והערות פנימיות (admin_notes)
export function AdminCustomerCard({ user, stats, balances, pkgs, onOpenEvent, onClose }) {
  const [note,setNote]=useState(null),[saved,setSaved]=useState(""),[err,setErr]=useState("");
  useEffect(()=>{sb.from("admin_notes").select("note").eq("user_id",user.user_id).maybeSingle().then(({data,error})=>{setNote(data?.note||"");if(error)setErr(error.message);});},[user.user_id]);
  const saveNote=async()=>{
    setSaved("saving");
    const{error}=await sb.from("admin_notes").upsert({user_id:user.user_id,note,updated_at:new Date().toISOString()});
    if(error){setErr(error.message);setSaved("");return;}
    setErr("");setSaved("saved");setTimeout(()=>setSaved(""),2000);
  };
  useEffect(()=>{const k=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);},[]);
  const fmt=d=>d?new Date(d).toLocaleDateString("he-IL",{day:"numeric",month:"short",year:"numeric"}):"—";
  const phones=[...new Set(user.events.map(e=>e.host_phone).filter(p=>normPhone(p)))];
  const pkgName=id=>ALL_PACKAGES.find(p=>p.id===id)?.name||LEGACY_PACKAGES[id]||id;
  return(
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(43,29,63,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" role="dialog" aria-label={`כרטיס לקוח ${user.email||""}`} style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:640,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)"}}>
        <div style={{background:GRAD,color:"#fff",padding:"18px 20px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20}}>{(user.email||"?")[0].toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:900,fontSize:17,direction:"ltr",textAlign:"right",overflow:"hidden",textOverflow:"ellipsis"}}>{user.email||user.user_id}</div>
            <div style={{fontSize:12,opacity:.9}}>הצטרף {fmt(user.created_at)} · כניסה אחרונה {fmt(user.last_sign_in_at)}</div>
          </div>
          <button onClick={onClose} aria-label="סגירה" style={{background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:10,width:34,height:34,fontSize:16,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:20,display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {phones.map(p=><a key={p} href={`https://wa.me/972${normPhone(p).slice(1)}`} target="_blank" rel="noopener noreferrer" style={{background:"#25D366",color:"#fff",borderRadius:10,padding:"7px 12px",fontSize:13,fontWeight:800,textDecoration:"none",direction:"ltr"}}>💬 {p}</a>)}
            {user.email&&<a href={`mailto:${user.email}`} style={{background:C.blueXL,color:C.blue,borderRadius:10,padding:"7px 12px",fontSize:13,fontWeight:800,textDecoration:"none"}}>📧 מייל</a>}
            {!phones.length&&<span style={{fontSize:12,color:C.muted,alignSelf:"center"}}>לא הוזן נייד בפרטי האירוע</span>}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:900,marginBottom:6}}>📦 חבילות</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{pkgs.length?pkgs.map(p=><span key={p} style={{background:C.blueXL,borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800}}>{pkgName(p)}</span>):<span style={{fontSize:12,color:C.muted}}>חינם (בלי חבילה)</span>}</div>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:900,marginBottom:6}}>📅 אירועים ({user.events.length})</div>
            {user.events.map(ev=>{const s=stats[ev.id]||{},pct=s.people?Math.round(s.confirmed/s.people*100):0;return(
              <div key={ev.id} style={{border:`1px solid ${C.border}`,borderRadius:14,padding:"10px 12px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontWeight:900,fontSize:14}}>{ev.name}</div>
                    <div style={{fontSize:12,color:C.muted}}>{ev.date?fmt(ev.date):"ללא תאריך"}{ev.venue?` · ${ev.venue}`:""}</div>
                  </div>
                  <button onClick={()=>onOpenEvent(ev)} className="sx-btn" style={{background:GRAD,color:"#fff",border:"none",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>📅 פתח אירוע</button>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8,fontSize:12}}>
                  {[[`${s.people||0} מוזמנים`],[`${s.confirmed||0} אישרו (${pct}%)`],[`${s.pending||0} ממתינים`],[`${s.seated||0}/${s.rows||0} הושבו`],[`SMS: ${balances[ev.id]?.balance??0}`]].map(([t])=>(
                    <span key={t} style={{background:"#F7F3FB",borderRadius:100,padding:"3px 9px",fontWeight:700}}>{t}</span>
                  ))}
                </div>
              </div>
            );})}
            {!user.events.length&&<div style={{fontSize:13,color:C.muted}}>עוד לא נפתח אירוע</div>}
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
              <div style={{flex:1,fontSize:13,fontWeight:900}}>📝 הערות פנימיות <span style={{fontWeight:500,color:C.muted}}>(רק אתה רואה)</span></div>
              {saved==="saved"&&<span style={{fontSize:12,color:C.success,fontWeight:800}}>✓ נשמר</span>}
            </div>
            {note===null?<Spinner size={18}/>:<textarea value={note} onChange={e=>setNote(e.target.value)} onBlur={saveNote} placeholder={"לדוגמה: שילם בביט 15.10 · מעדיף שיחה בערב"}
              style={{width:"100%",minHeight:90,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>}
            {err&&<div role="alert" style={{fontSize:12,color:C.danger,marginTop:4}}>❌ {err}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
// הפניות: מי נרשם דרך איזה קוד (אולם/שותף, חבר מביא חבר, דף הזמנה) + יצירת קישור לשותף
// אדמין: דיווחי מחיר והמלצות על ספקים. "בבדיקה" (flagged) = חריג מהשאר — מאשרים (תקין), מסתירים או מוחקים
export function AdminVendorData({ card }) {
  const [rows,setRows]=useState(null),[show,setShow]=useState("flagged"),[err,setErr]=useState("");
  const load=async()=>{
    const [p,r]=await Promise.all([sb.from("plate_prices").select("*").order("created_at",{ascending:false}).limit(1000),sb.from("vendor_reviews").select("*").order("created_at",{ascending:false}).limit(1000)]);
    if(p.error||r.error)setErr((p.error||r.error).message);
    setRows([...(p.data||[]).map(x=>({...x,_t:"plate_prices"})),...(r.data||[]).map(x=>({...x,_t:"vendor_reviews"}))].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))));
  };
  useEffect(()=>{load();},[]);
  const upd=async(x,patch)=>{const{error}=await sb.from(x._t).update(patch).eq("id",x.id);if(error)setErr(error.message);else load();};
  const del=async x=>{if(!confirm("למחוק לצמיתות?"))return;const{error}=await sb.from(x._t).delete().eq("id",x.id);if(error)setErr(error.message);else load();};
  if(!rows)return <div style={card}><Spinner/></div>;
  const list=rows.filter(x=>show==="all"||(show==="flagged"?x.flagged&&!x.hidden:x.hidden));
  const b={border:"none",borderRadius:9,padding:"7px 12px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"};
  return(
    <div style={card}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {[["flagged",`⚠️ בבדיקה (${rows.filter(x=>x.flagged&&!x.hidden).length})`],["hidden",`🙈 מוסתרים (${rows.filter(x=>x.hidden).length})`],["all",`הכל (${rows.length})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setShow(k)} style={{...b,background:show===k?"#2B1D3F":"#F4EEFC",color:show===k?"#fff":"#2B1D3F"}}>{l}</button>
        ))}
      </div>
      {err&&<div style={{color:"#C53030",fontSize:13,marginBottom:8}}>⚠️ {err}</div>}
      {!list.length&&<div style={{color:"#6E6585",fontSize:14}}>אין פריטים כאן.</div>}
      {list.map(x=>(
        <div key={x._t+x.id} style={{borderTop:"1px solid #F0EAF7",padding:"10px 0"}}>
          <div style={{fontSize:14,fontWeight:800}}>
            {x._t==="plate_prices"?<>🍽️ {x.venue_name} · ₪{x.price} למנה · {x.guests} אורחים · {x.event_date}</>:<>⭐ {VENDOR_CAT[x.category]?.label}: {x.vendor_name} · {x.rating}/5</>}
          </div>
          {x.body&&<div style={{fontSize:13,color:"#555",marginTop:3}}>{x.body}</div>}
          {x.flag_reason&&<div style={{fontSize:12,color:"#8A5A00",marginTop:3}}>סיבה: {x.flag_reason}</div>}
          <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
            {x.flagged&&<button onClick={()=>upd(x,{flagged:false,flag_reason:null})} style={{...b,background:"#E9FBF4",color:"#1F8F6C"}}>✓ תקין</button>}
            <button onClick={()=>upd(x,{hidden:!x.hidden})} style={{...b,background:"#FFF6E2",color:"#8A5A00"}}>{x.hidden?"👁 החזר":"🙈 הסתר"}</button>
            <button onClick={()=>del(x)} style={{...b,background:"#FFF0F0",color:"#C53030"}}>🗑 מחק</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// גיבוי יומי בשרת (backup.snapshots, 14 ימים). שחזור אירוע: אורחים, שולחנות ומפה. לפני שחזור נלקח גיבוי של המצב הנוכחי
export function AdminBackups({ card, events }) {
  const [list,setList]=useState(null),[taken,setTaken]=useState(""),[ev,setEv]=useState(""),[info,setInfo]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState("");
  const load=async()=>{const{data,error}=await sb.rpc("admin_backup_list");if(error)setErr(error.message);setList(data||[]);};
  useEffect(()=>{load();},[]);
  useEffect(()=>{setInfo(null);setMsg("");if(!taken||!ev)return;
    sb.rpc("admin_backup_event",{p_taken:taken,p_event:ev}).then(({data,error})=>{if(error)setErr(error.message);else setInfo(data);});},[taken,ev]);
  const restore=async()=>{
    if(!confirm(`לשחזר את "${events.find(e=>e.id===ev)?.name||"האירוע"}" לגיבוי מ-${fmt(taken)}?\nהאורחים והשולחנות הנוכחיים יוחלפו (המצב הנוכחי נשמר קודם כגיבוי).`))return;
    setBusy(true);setErr("");
    const{data,error}=await sb.rpc("admin_restore_event",{p_taken:taken,p_event:ev});
    setBusy(false);
    if(error)setErr(error.message);else{load();setInfo(null);setMsg(`✓ שוחזרו ${data.guests} אורחים ו-${data.tables} שולחנות. המצב שלפני השחזור נשמר כגיבוי חדש ברשימה.`);}
  };
  const fmt=t=>new Date(t).toLocaleString("he-IL",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
  if(!list)return <div style={card}><Spinner/></div>;
  const sel={border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",fontSize:14,fontFamily:"inherit",background:"#fff",flex:"1 1 220px"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{...card,padding:16}}>
        <div style={{fontWeight:900,fontSize:15,marginBottom:4}}>💾 גיבוי יומי אוטומטי</div>
        <div style={{fontSize:12,color:C.muted}}>כל לילה בשעה 03:00–04:00 נשמר עותק של כל האירועים, האורחים והשולחנות. נשמרים 14 ימים אחורה.</div>
      </div>
      <div style={{...card,padding:16}}>
        <div style={{fontWeight:900,fontSize:15,marginBottom:10}}>שחזור אירוע</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <select value={ev} onChange={e=>setEv(e.target.value)} style={sel}>
            <option value="">בחרו אירוע…</option>
            {events.map(e=><option key={e.id} value={e.id}>{e.name||"ללא שם"}{e.date?` · ${e.date}`:""}</option>)}
          </select>
          <select value={taken} onChange={e=>setTaken(e.target.value)} style={sel}>
            <option value="">בחרו גיבוי…</option>
            {list.map(b=><option key={b.taken_at} value={b.taken_at}>{fmt(b.taken_at)}</option>)}
          </select>
        </div>
        {info&&(info.event
          ?<div style={{marginTop:12,fontSize:14,lineHeight:1.8}}>
              <div>בגיבוי: <b>{info.guests}</b> אורחים · <b>{info.tables}</b> שולחנות</div>
              <div style={{color:C.muted}}>עכשיו: {info.now_guests} אורחים · {info.now_tables} שולחנות</div>
              <button disabled={busy} onClick={restore} className="sx-btn" style={{marginTop:8,background:GRAD,color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{busy?"משחזר…":"↩️ שחזור לגיבוי הזה"}</button>
            </div>
          :<div style={{marginTop:12,fontSize:13,color:C.muted}}>האירוע לא היה קיים בגיבוי הזה.</div>)}
        {msg&&<div style={{marginTop:10,color:"#1F8F6C",fontWeight:800,fontSize:14}}>{msg}</div>}
        {err&&<div style={{marginTop:10,color:"#C53030",fontSize:13}}>⚠️ {err}</div>}
      </div>
      <div style={{...card,padding:"8px 16px"}}>
        {!list.length&&<div style={{padding:30,textAlign:"center",color:C.muted}}>עוד אין גיבויים. הראשון ייווצר הלילה.</div>}
        {list.map(b=>(
          <div key={b.taken_at} style={{display:"flex",justifyContent:"space-between",gap:10,padding:"9px 0",borderTop:`1px solid ${C.border}`,fontSize:14}}>
            <b>{fmt(b.taken_at)}</b>
            <span style={{color:C.muted}}>{b.events} אירועים · {b.guests} אורחים · {b.tables} שולחנות</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ניהול ספקים: אישור / דחייה, אימות עסק (ע.מ / ח.פ מוצג רק כאן), ספק מוביל עד תאריך
export function AdminSuppliers({ card }) {
  const [rows,setRows]=useState(null),[priv,setPriv]=useState({}),[show,setShow]=useState("pending"),[err,setErr]=useState(""),[open,setOpen]=useState(null),[leadN,setLeadN]=useState({});
  const load=async()=>{
    const [a,b,c]=await Promise.all([sb.from("vendor_profiles").select("*").order("created_at",{ascending:false}),sb.from("vendor_private").select("*"),sb.from("vendor_leads").select("vendor_id,status").limit(10000)]);
    if(a.error)setErr(a.error.message);
    setRows(a.data||[]);setPriv(Object.fromEntries((b.data||[]).map(x=>[x.user_id,x])));
    setLeadN((c.data||[]).reduce((m,l)=>{const x=m[l.vendor_id]||(m[l.vendor_id]={n:0,won:0});x.n++;if(l.status==="won")x.won++;return m;},{}));
  };
  useEffect(()=>{load();},[]);
  // יש ספקים שעלו אוטומטית ולא נבדקו: פותחים עליהם
  useEffect(()=>{if(rows&&show==="pending"&&!rows.some(v=>v.status==="pending")&&rows.some(v=>v.admin_seen===false&&v.status==="approved"))setShow("fresh");},[rows]);
  const upd=async(v,patch)=>{const{error}=await sb.from("vendor_profiles").update(patch).eq("user_id",v.user_id);if(error)setErr(error.message);else load();};
  const reject=v=>{const r=window.prompt(`סיבת הדחייה ל"${v.business_name}" (הספק יראה אותה):`,"חסרים פרטים");if(r==null)return;upd(v,{status:"rejected",admin_seen:true,reject_reason:r.trim().slice(0,300)||null});};
  const feature=v=>{
    if(isFeatured(v)){upd(v,{featured:false,featured_until:null});return;}
    const d=window.prompt("ספק מוביל לכמה ימים?","30");const n=parseInt(d,10);if(!n||n<1)return;
    upd(v,{featured:true,featured_until:new Date(Date.now()+n*864e5).toISOString().slice(0,10)});
  };
  const del=async v=>{if(!window.confirm(`למחוק לצמיתות את הספק "${v.business_name}"?`))return;const{error}=await sb.from("vendor_profiles").delete().eq("user_id",v.user_id);if(error)setErr(error.message);else load();};
  if(!rows)return <div style={card}><Spinner/></div>;
  const counts={fresh:rows.filter(v=>v.admin_seen===false&&v.status==="approved").length,pending:rows.filter(v=>v.status==="pending").length,approved:rows.filter(v=>v.status==="approved").length,rejected:rows.filter(v=>v.status==="rejected").length};
  const list=rows.filter(v=>show==="featured"?isFeatured(v):show==="fresh"?v.admin_seen===false&&v.status==="approved":v.status===show);
  const b={border:"none",borderRadius:9,padding:"7px 12px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"};
  return(
    <div style={card}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {[...(counts.fresh?[["fresh",`🆕 עלו אוטומטית (${counts.fresh})`]]:[]),["pending",`⏳ ממתינים (${counts.pending})`],["approved",`✓ מאושרים (${counts.approved})`],["featured",`⭐ מובילים (${rows.filter(isFeatured).length})`],["rejected",`✗ נדחו (${counts.rejected})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setShow(k)} style={{...b,background:show===k?"#2B1D3F":"#F4EEFC",color:show===k?"#fff":"#2B1D3F"}}>{l}</button>
        ))}
      </div>
      {err&&<div style={{color:"#C53030",fontSize:13,marginBottom:8}}>⚠️ {err}</div>}
      {!list.length&&<div style={{color:"#6E6585",fontSize:14}}>אין ספקים כאן.</div>}
      {list.map(v=>{const p=priv[v.user_id],cat=SUPPLIER_CAT[v.category]||SUPPLIER_CAT.other;return(
        <div key={v.user_id} style={{display:"flex",gap:12,alignItems:"flex-start",borderTop:"1px solid #F0EAF7",padding:"12px 0",flexWrap:"wrap"}}>
          {v.logo_url?<img src={v.logo_url} alt="" style={{width:48,height:48,borderRadius:12,objectFit:"cover"}}/>:<span style={{width:48,height:48,borderRadius:12,background:"#F6F0FF",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{cat.icon}</span>}
          <div style={{flex:"1 1 240px",minWidth:0}}>
            <div style={{fontSize:15,fontWeight:900}}>{v.admin_seen===false&&<span style={{background:"#F0609E",color:"#fff",borderRadius:100,padding:"1px 8px",fontSize:12,fontWeight:900,marginLeft:6}}>חדש</span>}{v.business_name} <span style={{fontSize:12,color:"#6E6585",fontWeight:600}}>· {cat.label}{v.region?` · ${SUPPLIER_REGION[v.region]}`:""}</span></div>
            <div style={{fontSize:12,color:"#555",marginTop:2,direction:"ltr",textAlign:"right"}}>{v.phone}{v.email?` · ${v.email}`:""}</div>
            <div style={{fontSize:12,color:p?(validIsraeliId(p.business_id)?"#1F8F6C":"#C53030"):"#C53030",marginTop:2,fontWeight:700}}>
              🧾 {p?`${BUSINESS_TYPES.find(([k])=>k===p.business_type)?.[1]||""} ${p.business_id} ${validIsraeliId(p.business_id)?"(ספרת ביקורת תקינה)":"(ספרת ביקורת לא תקינה!)"}`:"חסרים פרטים עסקיים"}
            </div>
            <div style={{fontSize:12,color:"#6E6585",marginTop:2}}>נרשם {new Date(v.created_at).toLocaleDateString("he-IL")} · {(v.photos||[]).length} תמונות{leadN[v.user_id]?` · 📩 ${leadN[v.user_id].n} פניות${leadN[v.user_id].won?` (${leadN[v.user_id].won} עסקאות)`:""}`:""}{v.reject_reason?` · סיבת דחייה: ${v.reject_reason}`:""}{isFeatured(v)&&v.featured_until?` · מוביל עד ${new Date(v.featured_until).toLocaleDateString("he-IL")}`:""}</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={()=>setOpen(v)} style={{...b,background:"#F4EEFC",color:"#2B1D3F"}}>👁 צפייה</button>
            {v.admin_seen===false&&v.status==="approved"&&<button onClick={()=>upd(v,{admin_seen:true,verified:v.verified||(!!p&&validIsraeliId(p.business_id))})} style={{...b,background:"#E9FBF4",color:"#1F8F6C"}}>✓ ראיתי, תקין</button>}
            {v.status!=="approved"&&<button onClick={()=>upd(v,{status:"approved",admin_seen:true,reject_reason:null,verified:!!p&&validIsraeliId(p.business_id)})} style={{...b,background:"#E9FBF4",color:"#1F8F6C"}}>✓ אישור</button>}
            {v.status!=="rejected"&&<button onClick={()=>reject(v)} style={{...b,background:"#FFF6E2",color:"#8A5A00"}}>✗ דחייה</button>}
            {v.status==="approved"&&<button onClick={()=>upd(v,{verified:!v.verified})} style={{...b,background:"#F0F9FF",color:"#0E7490"}}>{v.verified?"הסר \"עסק רשום\"":"✓ עסק רשום"}</button>}
            {v.status==="approved"&&<button onClick={()=>feature(v)} style={{...b,background:isFeatured(v)?"#FFF0F6":"#FFF6E2",color:isFeatured(v)?"#B13B72":"#8A5A00"}}>{isFeatured(v)?"⭐ הסר מוביל":"⭐ מוביל"}</button>}
            <button onClick={()=>del(v)} style={{...b,background:"#FFF0F0",color:"#C53030"}}>🗑</button>
          </div>
        </div>
      );})}
      <SupplierDetails v={open} onClose={()=>setOpen(null)}/>
    </div>
  );
}

export function AdminReferrals({ card, refs, users, packages, onCustomer }) {
  const [name,setName]=useState(""),[copied,setCopied]=useState("");
  const code=name.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^\w-]/g,"").slice(0,40);
  const link=code.length>=2?`https://www.sidoril.com/?ref=${code}`:"";
  const copy=t=>{navigator.clipboard?.writeText(t).then(()=>{setCopied(t);setTimeout(()=>setCopied(""),2000);}).catch(()=>{});};
  const byCode={};
  Object.entries(refs).forEach(([uid,r])=>{(byCode[r]||=[]).push(users.find(u=>u.user_id===uid)||{user_id:uid,email:null,events:[]});});
  const label=r=>{
    if(r==="invite")return{icon:"💌",txt:"דף הזמנה של אורח",sub:"אורחים שלחצו על \"נוצר ב-Sidor-IL\""};
    const friend=users.find(u=>myRefCode({id:u.user_id})===r);
    if(friend)return{icon:"🎁",txt:`חבר של ${friend.email||friend.user_id.slice(0,8)}`,sub:"חבר מביא חבר"};
    return{icon:"🤝",txt:r,sub:"קוד שותף (אולם / מפיק / קמפיין)"};
  };
  const rows=Object.entries(byCode).sort((a,b)=>b[1].length-a[1].length);
  const paid=u=>(packages[u.user_id]||[]).length>0;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{...card,padding:16}}>
        <div style={{fontWeight:900,fontSize:15,marginBottom:4}}>🔗 קישור לשותף חדש</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>כתבו שם באנגלית (למשל olamei-hagan), ותנו לאולם או למפיק את הקישור. כל מי שנרשם דרכו יופיע כאן.</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="שם השותף באנגלית" dir="ltr"
            style={{flex:"1 1 200px",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",fontSize:14,fontFamily:"inherit",outline:"none"}}/>
          {link&&<span style={{fontSize:13,fontWeight:700,direction:"ltr",color:C.text}}>{link}</span>}
          {link&&<button onClick={()=>copy(link)} className="sx-btn" style={{background:GRAD,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{copied===link?"✓ הועתק":"📋 העתקה"}</button>}
        </div>
      </div>
      {!rows.length&&<div style={{...card,padding:40,textAlign:"center",color:C.muted}}><div style={{fontSize:40}}>🎯</div><div style={{fontWeight:800,marginTop:6}}>עוד אין נרשמים דרך קישורי הפניה</div></div>}
      {rows.map(([r,us])=>{const l=label(r);return(
        <div key={r} className="adm-row" style={{...card,padding:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:10}}>
            <div style={{width:42,height:42,borderRadius:12,background:C.blueXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{l.icon}</div>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontWeight:900,fontSize:15}}>{l.txt}</div>
              <div style={{fontSize:12,color:C.muted}}>{l.sub} · קוד <span dir="ltr">{r}</span></div>
            </div>
            <span style={{background:C.blueXL,color:C.text,borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800}}>{us.length} נרשמו</span>
            <span style={{background:"#E9FBF4",color:C.success,borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800}}>{us.filter(paid).length} עם חבילה</span>
          </div>
          {us.map(u=>(
            <div key={u.user_id} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,padding:"7px 0",borderTop:`1px solid ${C.border}`}}>
              <span style={{flex:1,direction:"ltr",textAlign:"right"}}>{u.email||u.user_id.slice(0,8)}</span>
              <span style={{color:C.muted}}>{u.events?.length||0} אירועים</span>
              {paid(u)&&<span style={{color:C.success,fontWeight:800}}>💳</span>}
              <button onClick={()=>onCustomer(u.user_id)} style={{background:"none",border:"none",color:C.blue,fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>👤 כרטיס לקוח</button>
            </div>
          ))}
        </div>
      );})}
    </div>
  );
}

// ניהול רשימת האולמות שמוצעים ללקוחות: הוספה ידנית, אישור מקומות מהאירועים, עריכה ומחיקה
export function AdminVenues({ card }) {
  const [list,setList]=useState(null),[cands,setCands]=useState([]),[busy,setBusy]=useState(false),[err,setErr]=useState("");
  const [name,setName]=useState(""),[address,setAddress]=useState(""),[q,setQ]=useState("");
  const load=async()=>{
    const [v,c]=await Promise.all([sb.from("venues").select("*").order("name"),sb.rpc("admin_venue_candidates")]);
    setList(v.data||[]);setCands(c.data||[]);setErr(v.error?.message||c.error?.message||"");
  };
  useEffect(()=>{load();},[]);
  const add=async(n,a)=>{
    n=String(n||"").trim();if(!n)return;
    setBusy(true);
    const{error}=await sb.from("venues").insert({name:n,address:String(a||"").trim()||null});
    setBusy(false);
    if(error){setErr(/duplicate|unique/i.test(error.message)?`"${n}" כבר ברשימה`:error.message);return;}
    setErr("");setName("");setAddress("");load();
  };
  const update=async(v,patch)=>{const{error}=await sb.from("venues").update(patch).eq("id",v.id);if(error)setErr(error.message);else load();};
  const remove=async v=>{if(!confirm(`להסיר את "${v.name}" מהרשימה?`))return;const{error}=await sb.from("venues").delete().eq("id",v.id);if(error)setErr(error.message);else load();};
  const inp={border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",fontSize:14,fontFamily:"inherit",outline:"none",minWidth:0};
  const shown=(list||[]).filter(v=>!q.trim()||v.name.includes(q.trim())||(v.address||"").includes(q.trim()));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{...card,padding:16}}>
        <div style={{fontWeight:900,fontSize:15,marginBottom:4}}>🏛️ הוספת אולם לרשימה</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>האולמות ברשימה מוצעים ללקוחות כשהם מקלידים את שם המקום, והכתובת מתמלאת לבד. לקוח תמיד יכול גם להקליד מקום שלא ברשימה.</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="שם המקום" aria-label="שם המקום" style={{...inp,flex:"1 1 180px"}}/>
          <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="כתובת מלאה (לניווט)" aria-label="כתובת" style={{...inp,flex:"2 1 240px"}}/>
          <button onClick={()=>add(name,address)} disabled={!name.trim()||busy} className="sx-btn" style={{background:name.trim()?GRAD:"#E2E8F0",color:name.trim()?"#fff":"#999",border:"none",borderRadius:10,padding:"9px 18px",fontSize:14,fontWeight:900,cursor:name.trim()?"pointer":"default",fontFamily:"inherit"}}>הוסף</button>
        </div>
        {err&&<div role="alert" style={{color:C.danger,fontSize:13,fontWeight:700,marginTop:8}}>❌ {err}</div>}
      </div>

      {cands.length>0&&<div style={{...card,padding:16}}>
        <div style={{fontWeight:900,fontSize:15,marginBottom:4}}>💡 מקומות מהאירועים של הלקוחות ({cands.length})</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>עוד לא ברשימה. מקום שלקוח אחד בלבד הקליד מוצג רק לו, כדי לא לחשוף כתובת פרטית. הוסיפו את מה שהוא אולם אמיתי.</div>
        {cands.map(c=>(
          <div key={c.name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontWeight:800,fontSize:14}}>{c.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{c.address||"בלי כתובת"} · {c.users} לקוחות</div>
            </div>
            <button onClick={()=>add(c.name,c.address)} className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.blueL}`,color:C.blue,borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>➕ הוסף לרשימה</button>
          </div>
        ))}
      </div>}

      <div style={{...card,padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{flex:1,fontWeight:900,fontSize:15}}>📋 הרשימה ({(list||[]).length})</div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חיפוש" style={{...inp,width:180}}/>
        </div>
        {list===null?<Spinner size={20}/>:!shown.length?<div style={{color:C.muted,fontSize:13,padding:10,textAlign:"center"}}>{list.length?"לא נמצא":"הרשימה ריקה. הוסיפו את האולמות שאתם עובדים איתם."}</div>
          :shown.map(v=>(
          <div key={v.id} style={{display:"flex",gap:8,padding:"7px 0",borderTop:`1px solid ${C.border}`,flexWrap:"wrap",alignItems:"center"}}>
            <input key={"n"+v.id+v.name} defaultValue={v.name} aria-label="שם" onBlur={e=>{const n=e.target.value.trim();if(n&&n!==v.name)update(v,{name:n});}} style={{...inp,flex:"1 1 160px",fontWeight:800}}/>
            <input key={"a"+v.id+(v.address||"")} defaultValue={v.address||""} placeholder="כתובת" aria-label="כתובת" onBlur={e=>{const a=e.target.value.trim()||null;if(a!==(v.address||null))update(v,{address:a});}} style={{...inp,flex:"2 1 220px"}}/>
            <button onClick={()=>remove(v)} aria-label={`הסרת ${v.name}`} style={{background:"none",border:"none",color:"#A0AEC0",fontSize:15,cursor:"pointer"}}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
// סיסמה אקראית קריאה (בלי תווים שמתבלבלים כמו 0/O, 1/l)
export const randomPassword=()=>{const s="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";const a=crypto.getRandomValues(new Uint32Array(10));return [...a].map(n=>s[n%s.length]).join("");};
// הודעה ללקוח עם פרטי ההתחברות (נפתחת בוואטסאפ; בוחרים למי לשלוח)
export const loginShareText=(email,password)=>`שלום! נפתח לך חשבון ב-Sidor-IL 🎉\nכניסה: https://www.sidoril.com\nמייל: ${email}\nסיסמה: ${password}\nמומלץ להחליף סיסמה אחרי הכניסה הראשונה.`;
export function CredentialsBox({ email, password, onClose }) {
  const text=loginShareText(email,password);
  const [copied,setCopied]=useState(false);
  return(
    <div style={{background:"#F0FFF4",border:"1.5px solid #9AE6B4",borderRadius:14,padding:14,marginTop:12}}>
      <div style={{fontWeight:900,color:"#276749",marginBottom:8}}>✅ מוכן. פרטי ההתחברות (מוצגים רק עכשיו):</div>
      <div style={{direction:"ltr",textAlign:"left",fontFamily:"monospace",fontSize:14,background:"#fff",borderRadius:10,padding:"8px 12px",marginBottom:10}}>{email}<br/>{password}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>{navigator.clipboard?.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}} className="sx-btn" style={{background:"#fff",border:"1.5px solid #9AE6B4",color:"#276749",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{copied?"✓ הועתק":"📋 העתק הודעה"}</button>
        <a href={waShareUrl(text)} target="_blank" rel="noopener noreferrer" style={{background:"#25D366",color:"#fff",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:800,textDecoration:"none"}}>💬 שלח בוואטסאפ</a>
        {onClose&&<button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>סגור</button>}
      </div>
    </div>
  );
}
// פתיחת משתמש חדש מהאדמין: מייל + סיסמה, מאומת מראש (בלי מייל אישור), אפשר לסמן חבילות כבר עכשיו
export function AdminCreateUser({ card, onDone }) {
  const [open,setOpen]=useState(false);
  const [email,setEmail]=useState(""),[password,setPassword]=useState(()=>randomPassword()),[pkgs,setPkgs]=useState([]);
  const [busy,setBusy]=useState(false),[err,setErr]=useState(""),[done,setDone]=useState(null);
  const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())&&password.length>=8;
  const create=async()=>{
    setBusy(true);setErr("");
    const{data,error}=await sb.functions.invoke("admin-users",{body:{action:"create",email:email.trim(),password,packages:pkgs}});
    setBusy(false);
    const msg=data?.error||(error&&(await error.context?.json?.().catch(()=>null))?.error)||error?.message;
    if(msg||!data?.ok){setErr(msg||"הפתיחה נכשלה");return;}
    if(data.package_error)setErr("המשתמש נפתח, אבל החבילות לא נשמרו: "+data.package_error);
    setDone({email:data.email,password});setEmail("");setPassword(randomPassword());setPkgs([]);onDone?.();
  };
  if(!open)return(
    <button onClick={()=>setOpen(true)} className="sx-btn" style={{...card,padding:14,fontSize:15,fontWeight:900,color:C.blue,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>➕ פתיחת משתמש חדש</button>
  );
  const inp={border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:"inherit",outline:"none",direction:"ltr",minWidth:0};
  return(
    <div style={{...card,padding:16}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
        <div style={{flex:1,fontWeight:900,fontSize:15}}>➕ פתיחת משתמש חדש</div>
        <button onClick={()=>{setOpen(false);setDone(null);setErr("");}} aria-label="סגירה" style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:C.muted}}>✕</button>
      </div>
      <div style={{fontSize:12,color:C.muted,marginBottom:10}}>הלקוח יוכל להיכנס מיד עם המייל והסיסמה, בלי מייל אישור. אם הוא יתחבר עם גוגל באותו מייל, זה אותו חשבון.</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="email@example.com" aria-label="מייל" style={{...inp,flex:"2 1 220px"}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="סיסמה (8+ תווים)" aria-label="סיסמה" style={{...inp,flex:"1 1 150px",fontFamily:"monospace"}}/>
        <button onClick={()=>setPassword(randomPassword())} title="סיסמה אקראית" className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"0 12px",fontSize:16,cursor:"pointer"}}>🎲</button>
      </div>
      <div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:6}}>חבילות שיהיו פתוחות מההתחלה (לא חובה):</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {ALL_PACKAGES.map(p=>{const on=pkgs.includes(p.id);return(
          <button key={p.id} onClick={()=>setPkgs(s=>on?s.filter(x=>x!==p.id):[...s,p.id])} aria-pressed={on} className="sx-btn"
            style={{background:on?p.color+"18":"#fff",border:`1.5px solid ${on?p.color:C.border}`,color:on?p.color:C.muted,borderRadius:100,padding:"5px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{on?"✓":"+"} {p.icon} {p.name}</button>
        );})}
      </div>
      {err&&<div role="alert" style={{background:"#FFF2F4",color:C.danger,borderRadius:10,padding:"8px 12px",fontSize:13,fontWeight:700,marginBottom:10}}>❌ {err}</div>}
      <button onClick={create} disabled={!valid||busy} className="sx-btn sx-btn-primary"
        style={{background:valid?GRAD:"#E2E8F0",color:valid?"#fff":"#999",border:"none",borderRadius:12,padding:"11px 20px",fontSize:14,fontWeight:900,cursor:valid?"pointer":"default",fontFamily:"inherit"}}>{busy?"פותח...":"פתח משתמש"}</button>
      {done&&<CredentialsBox email={done.email} password={done.password} onClose={()=>setDone(null)}/>}
    </div>
  );
}
// החלפת סיסמה למשתמש קיים (למשל לקוח ששכח)
export function AdminPasswordModal({ user, onClose }) {
  const [password,setPassword]=useState(()=>randomPassword()),[busy,setBusy]=useState(false),[err,setErr]=useState(""),[done,setDone]=useState(false);
  const save=async()=>{
    setBusy(true);setErr("");
    const{data,error}=await sb.functions.invoke("admin-users",{body:{action:"set_password",user_id:user.user_id,password}});
    setBusy(false);
    const msg=data?.error||(error&&(await error.context?.json?.().catch(()=>null))?.error)||error?.message;
    if(msg||!data?.ok){setErr(msg||"ההחלפה נכשלה");return;}
    setDone(true);
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(43,29,63,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" style={{background:"#fff",borderRadius:18,padding:20,width:"100%",maxWidth:440}}>
        <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>🔑 סיסמה חדשה</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:12,direction:"ltr",textAlign:"right"}}>{user.email}</div>
        {!done?<>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <input value={password} onChange={e=>setPassword(e.target.value)} aria-label="סיסמה חדשה" style={{flex:1,minWidth:0,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:"monospace",direction:"ltr",outline:"none"}}/>
            <button onClick={()=>setPassword(randomPassword())} title="סיסמה אקראית" style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"0 12px",fontSize:16,cursor:"pointer"}}>🎲</button>
          </div>
          {err&&<div role="alert" style={{color:C.danger,fontSize:13,fontWeight:700,marginBottom:10}}>❌ {err}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={save} disabled={busy||password.length<8} style={{flex:1,background:password.length>=8?GRAD:"#E2E8F0",color:"#fff",border:"none",borderRadius:12,padding:11,fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>{busy?"שומר...":"החלף סיסמה"}</button>
            <button onClick={onClose} style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 16px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>
          </div>
        </>:<CredentialsBox email={user.email} password={password} onClose={onClose}/>}
      </div>
    </div>
  );
}

// ─── עיצוב האדמין: רקע בהיר, סרגל עליון צף ותפריט צד (כמו שאר האתר) ───
export const ADM_CSS=`
.adm{min-height:100vh;background:radial-gradient(1100px 560px at 100% -10%,#FFE9F3 0%,transparent 60%),radial-gradient(900px 500px at 0% 0%,#EFE7FF 0%,transparent 55%),#FBF8FF;color:#2B1D3F;font-family:'Heebo',sans-serif}
.adm h1,.adm h2,.adm h3,.adm button,.adm b,.adm strong,.adm [style*="font-weight: 900"],.adm [style*="font-weight: 800"]{font-family:'Fredoka','Heebo',sans-serif}
.adm-top{position:sticky;top:12px;z-index:50;margin:12px 16px 0;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:10px 14px;background:rgba(255,255,255,.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid #EFE6F8;border-radius:20px;box-shadow:0 14px 34px -24px rgba(91,60,140,.55)}
.adm-brand{display:flex;align-items:center;gap:10px;min-width:0}
.adm-logo{width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,#FFE3EE,#EDE3FF);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.adm-title{font:700 18px 'Fredoka','Heebo',sans-serif}
.adm-sub{font-size:12px;color:#6B5F80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adm-search{flex:1 1 260px;max-width:420px;margin-inline-start:auto;display:flex;align-items:center;gap:8px;background:#F7F2FC;border:1px solid #EDE3F7;border-radius:999px;padding:0 14px;min-height:42px;transition:border-color 180ms ease,box-shadow 180ms ease}
.adm-search input{flex:1;border:none;background:none;outline:none;font:inherit;font-size:14px;color:#2B1D3F;min-width:0}
.adm-search:focus-within{border-color:#B79CF0;box-shadow:0 0 0 3px rgba(155,107,255,.18)}
.adm-actions{display:flex;gap:8px}
.adm-btn{min-height:42px;padding:0 14px;border-radius:999px;border:1px solid #E9DFF5;background:#fff;color:#2B1D3F;font-size:14px;font-weight:600;cursor:pointer;transition:background-color 180ms ease,border-color 180ms ease}
.adm-btn.danger{color:#C53030}
.adm-layout{display:grid;grid-template-columns:244px minmax(0,1fr);gap:22px;max-width:1360px;margin:0 auto;padding:22px 16px 48px}
.adm-side{position:sticky;top:96px;align-self:start;display:flex;flex-direction:column;gap:14px;background:rgba(255,255,255,.72);border:1px solid #F0E8F7;border-radius:22px;padding:14px 10px;max-height:calc(100vh - 116px);overflow:auto}
.adm-glabel{font-size:12px;font-weight:700;color:#6B5F80;padding:0 10px 6px}
.adm-nav{width:100%;display:flex;align-items:center;gap:10px;min-height:44px;padding:0 10px;border:none;border-radius:14px;background:none;color:#2B1D3F;font-size:15px;font-weight:600;cursor:pointer;text-align:right;transition:background-color 160ms ease}
.adm-nic{width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#F6F1FB;font-size:15px;flex-shrink:0}
.adm-nl{flex:1}
.adm-nav.on{background:linear-gradient(120deg,#FFE6F0,#EFE6FF)}
.adm-nav.on .adm-nic{background:#fff}
@media(hover:hover) and (pointer:fine){.adm-nav:not(.on):hover{background:#FAF6FE}.adm-btn:hover{background:#FBF7FF;border-color:#CDB8F2}.adm-mini.ghost:hover{border-color:#CDB8F2}}
.adm-nav:focus-visible,.adm-btn:focus-visible,.adm-mini:focus-visible,.adm-link:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}
.adm-cnt{min-width:24px;height:22px;padding:0 7px;border-radius:999px;background:#EFE8F8;color:#5E5470;font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.adm-cnt.alert{background:#D6336C;color:#fff}
.adm-head{margin:2px 0 18px}
.adm-head h1{font-size:28px;font-weight:700;margin:0;line-height:1.25}
.adm-head p{font-size:14px;color:#6B5F80;margin-top:4px}
.adm-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px}
.adm-kpi{border-radius:20px;padding:16px 18px;border:1px solid rgba(255,255,255,.8)}
.adm-kpi-top{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#3E3555}
.adm-kpi-ic{width:30px;height:30px;border-radius:10px;background:rgba(255,255,255,.8);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800}
.adm-kpi-v{font:700 30px/1.1 'Fredoka','Heebo',sans-serif;margin:12px 0 4px}
.adm-kpi-s{font-size:12.5px;color:#5E5470}
.adm-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:16px}
.adm-card{background:#fff;border:1px solid #F0E8F7;border-radius:22px;padding:16px 18px;box-shadow:0 12px 30px -24px rgba(91,60,140,.5);min-width:0}
.adm-card-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.adm-card-h h2{font-size:17px;font-weight:700;margin:0}
.adm-link{background:none;border:none;color:#6D28D9;font-size:13px;font-weight:700;cursor:pointer;padding:6px;border-radius:8px}
.adm-empty{padding:22px 8px;text-align:center;color:#6B5F80;font-size:14px}
.adm-li{display:flex;align-items:center;gap:12px;padding:10px 2px;border-top:1px solid #F4EEF9}
.adm-card-h+.adm-li{border-top:none}
.adm-li-ic{width:34px;height:34px;border-radius:11px;background:color-mix(in srgb,var(--c,#9B6BFF) 12%,#fff);color:var(--c,#9B6BFF);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800}
.adm-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#F0609E,#9B6BFF);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}
.adm-li-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.adm-li-t b{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adm-li-t span{font-size:12px;color:#6B5F80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adm-days{width:48px;flex-shrink:0;text-align:center;background:#F6F1FB;border-radius:12px;padding:5px 0;font-size:11px;color:#6B5F80;line-height:1.2}
.adm-days b{display:block;font-size:16px;color:#2B1D3F}
.adm-bar{height:6px;border-radius:99px;background:#F1EAF8;margin-top:5px;overflow:hidden;max-width:240px}
.adm-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3CC8A0,#7BD8B9)}
.adm-mini{min-height:36px;padding:0 12px;border-radius:999px;border:none;background:linear-gradient(120deg,#E0447F,#8B5CF6);color:#fff;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0}
.adm-mini.ghost{background:#fff;color:#2B1D3F;border:1px solid #E9DFF5}
.adm-row:hover{border-color:#D9C8F5!important;box-shadow:0 14px 30px -20px rgba(91,60,140,.55)!important}
@media(max-width:1050px){.adm-grid2{grid-template-columns:1fr}}
@media(max-width:860px){.adm-layout{grid-template-columns:1fr;padding-top:14px}.adm-side{position:static;flex-direction:row;overflow-x:auto;max-height:none;padding:8px;gap:4px;border-radius:18px}.adm-group{display:contents}.adm-glabel{display:none}.adm-nav{width:auto;flex-shrink:0;white-space:nowrap}.adm-top{position:relative;top:0;margin:8px 8px 0}.adm-search{order:3;max-width:none;flex-basis:100%}.adm-head h1{font-size:24px}.adm-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.adm-kpi{padding:14px}.adm-kpi-v{font-size:24px}.adm-li{flex-wrap:wrap}.adm-li-t{flex-basis:calc(100% - 60px)}}
`;

export function AdminDashboard({ user, onLogout }) {
  const [users,setUsers]=useState([]);       // [{user_id,email,created_at,last_sign_in_at,events:[],guests:0}]
  const [events,setEvents]=useState([]);
  const [packages,setPackages]=useState({}); // {user_id: [pkg_id, ...]}
  const [balances,setBalances]=useState({}); // {event_id: balance}
  const [requests,setRequests]=useState([]);
  const [txs,setTxs]=useState([]);
  const [guestCount,setGuestCount]=useState({}); // {event_id: n}
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("overview");
  const [stats,setStats]=useState({});            // {event_id: {rows,people,confirmed,pending,seated,phones}}
  const [failedRuns,setFailedRuns]=useState([]);  // שליחות אוטומטיות שנכשלו / דולגו ב-14 הימים האחרונים
  const [custFor,setCustFor]=useState(null);      // כרטיס לקוח פתוח (user_id)
  const [waBalances,setWaBalances]=useState({});  // {event_id: רשומות WhatsApp}
  const [waUsedAdm,setWaUsedAdm]=useState({});   // {event_id: רשומות שנוצלו}
  const [waRequests,setWaRequests]=useState([]);  // בקשות רכישת WhatsApp
  const [refs,setRefs]=useState({});              // {user_id: קוד הפניה שדרכו נרשם}
  const [search,setSearch]=useState("");
  const [saving,setSaving]=useState(null);
  const [addFor,setAddFor]=useState(null);   // {event, request?}
  const [addAmount,setAddAmount]=useState(500);
  const [addNote,setAddNote]=useState("");
  const [toast,setToast]=useState("");
  const [provider,setProvider]=useState(null); // יתרה בחשבון 019 מול מה שכבר נמכר ללקוחות
  const [pwFor,setPwFor]=useState(null);       // משתמש שמחליפים לו סיסמה

  const flash=m=>{setToast(m);setTimeout(()=>setToast(""),2600);};
  const loadProvider=async()=>{
    const{data,error}=await sb.functions.invoke("sms-provider-balance",{body:{}});
    setProvider(error?{error:"לא ניתן לבדוק את היתרה ב-019"}:data);
  };
  useEffect(()=>{loadProvider();},[]);

  const [updatedAt,setUpdatedAt]=useState(null);
  // silent: רענון ברקע בלי ספינר (כשחוזרים לחלון / כל 30 שניות)
  const [producerProfs,setProducerProfs]=useState([]),[pendingVendors,setPendingVendors]=useState([]);
  // "צריך טיפול": פריטים שסומנו כמטופלים (טבלה admin_seen_alerts, לכל המכשירים). מפתח = תוכן הפריט
  const [seenAlerts,setSeenAlerts]=useState(new Set()),[showSeen,setShowSeen]=useState(false);
  useEffect(()=>{sb.from("admin_seen_alerts").select("key").then(({data})=>setSeenAlerts(new Set((data||[]).map(r=>r.key))),()=>{});
    sb.from("admin_seen_alerts").delete().lt("seen_at",new Date(Date.now()-90*864e5).toISOString()).then(()=>{},()=>{});},[]);
  const markSeen=async k=>{setSeenAlerts(x=>new Set([...x,k]));await sb.from("admin_seen_alerts").upsert({key:k,seen_at:new Date().toISOString()}).then(()=>{},()=>{});};
  const unmarkSeen=async k=>{setSeenAlerts(x=>{const n=new Set(x);n.delete(k);return n;});await sb.from("admin_seen_alerts").delete().eq("key",k).then(()=>{},()=>{});};
  const loadData=async(silent=false)=>{
    if(!silent)setLoading(true);
    const since=new Date(Date.now()-14*864e5).toISOString();
    // WhatsApp בטבלאות נפרדות (wa_balance / wa_requests) — לא קשור ל-SMS
    sb.from("wa_balance").select("event_id,balance,sent").then(({data})=>{setWaBalances(Object.fromEntries((data||[]).map(b=>[b.event_id,b.balance])));setWaUsedAdm(Object.fromEntries((data||[]).map(b=>[b.event_id,b.sent||0])));}).catch(()=>{});
    sb.from("wa_requests").select("*").order("created_at",{ascending:false}).limit(100).then(({data})=>setWaRequests(data||[])).catch(()=>{});
    sb.rpc("admin_list_referrals").then(({data})=>setRefs(Object.fromEntries((data||[]).map(r=>[r.user_id,r.ref])))).catch(()=>{});
    sb.from("producer_profiles").select("user_id,brand_name,phone,updated_at").then(({data})=>setProducerProfs(data||[])).catch(()=>{});
    sb.from("vendor_profiles").select("user_id,business_name,category,phone,status,admin_seen,created_at").or("status.eq.pending,admin_seen.eq.false").then(({data})=>setPendingVendors((data||[]).filter(v=>v.status!=="rejected"))).catch(()=>{});
    const [ev,g,pk,bal,req,tx,us,runs]=await Promise.all([
      sb.from("events").select("id,name,user_id,date,event_type,venue,invite_active,created_at,host_phone,settings_json").order("created_at",{ascending:false}),
      sb.from("guests").select("event_id,table_id,rsvp,guest_count,phone"),
      sb.from("user_packages").select("user_id,package_id"),
      sb.from("sms_balance").select("event_id,balance,total_purchased,total_sent"),
      sb.from("sms_requests").select("*").order("created_at",{ascending:false}).limit(100),
      sb.from("sms_transactions").select("*").order("created_at",{ascending:false}).limit(60),
      sb.rpc("admin_list_users"),
      sb.from("sms_schedule_runs").select("event_id,schedule_id,status,error,created_at").in("status",["failed","skipped"]).gte("created_at",since).order("created_at",{ascending:false}),
    ]);
    const evList=ev.data||[];
    const gc={};(g.data||[]).forEach(x=>{gc[x.event_id]=(gc[x.event_id]||0)+1;});
    // סטטיסטיקה לכל אירוע: אנשים שאישרו / ממתינים / הושבו / עם טלפון
    const st={};(g.data||[]).forEach(x=>{const s=st[x.event_id]||={rows:0,people:0,confirmed:0,pending:0,seated:0,phones:0};const n=x.guest_count||1;
      s.rows++;s.people+=n;if(x.rsvp==="confirmed")s.confirmed+=n;else if(x.rsvp!=="declined")s.pending+=n;if(x.table_id)s.seated++;if(normPhone(x.phone))s.phones++;});
    setStats(st);setFailedRuns(runs.data||[]);
    const pkgMap={};(pk.data||[]).forEach(p=>{(pkgMap[p.user_id]||=[]).push(p.package_id);});
    const balMap={};(bal.data||[]).forEach(b=>{balMap[b.event_id]=b;});
    // משתמשים: מהרשימה עם המיילים, ואם הפונקציה לא זמינה  -  לפי בעלי האירועים
    const base=(us.data&&!us.error)?us.data:[...new Set(evList.map(e=>e.user_id))].map(id=>({user_id:id,email:null}));
    const uList=base.map(u=>{const evs=evList.filter(e=>e.user_id===u.user_id);return {...u,events:evs,guests:evs.reduce((s,e)=>s+(gc[e.id]||0),0)};});
    setEvents(evList);setGuestCount(gc);setPackages(pkgMap);setBalances(balMap);
    setRequests(req.data||[]);setTxs(tx.data||[]);setUsers(uList);
    setLoading(false);setUpdatedAt(new Date());
  };
  // היתרות משתנות כשלקוחות שולחים — מרעננים אוטומטית
  useEffect(()=>{
    loadData();
    const refresh=()=>{if(document.visibilityState==="visible")loadData(true).catch(()=>{});};
    const iv=setInterval(refresh,30000);
    window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
    return()=>{clearInterval(iv);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[]);
  const refreshAll=()=>{loadData();loadProvider();};

  const emailOf=uid=>users.find(u=>u.user_id===uid)?.email||(uid?uid.slice(0,8)+"…":"");
  const eventOf=id=>events.find(e=>e.id===id);
  const pending=requests.filter(r=>r.status==="pending");
  const waPendingReqs=waRequests.filter(r=>r.status==="pending");
  const rejectWa=async r=>{
    if(!window.confirm(`לדחות בקשה ל-${r.records} רשומות WhatsApp?`))return;
    const{error}=await sb.rpc("admin_reject_wa_request",{p_request:r.id});
    if(error)flash("❌ "+error.message);else{flash("הבקשה נדחתה");loadData();}
  };

  const togglePackage=async(userId,pkgId,hasIt)=>{
    setSaving(`${userId}-${pkgId}`);
    const{error}=hasIt
      ?await sb.from("user_packages").delete().eq("user_id",userId).eq("package_id",pkgId)
      :await sb.from("user_packages").insert({user_id:userId,package_id:pkgId});
    if(error)flash("❌ "+error.message);
    else setPackages(prev=>({...prev,[userId]:hasIt?(prev[userId]||[]).filter(p=>p!==pkgId):[...(prev[userId]||[]),pkgId]}));
    setSaving(null);
  };

  // channel: "sms" או "wa" (רשומות WhatsApp). בקשה קובעת את הערוץ בעצמה
  const openAdd=(event,request=null,channel="sms")=>{const ch=request?.channel||channel;setAddFor({event,request,channel:ch});setAddAmount(request?.amount||(ch==="wa"?100:500));setAddNote(request?`אישור תשלום ₪${request.price??""}`:"");};
  // משיכת SMS בחזרה (ביטול / החזר כספי): כמות חיובית שנשלחת כשלילית ל-admin_add_sms, עד גובה היתרה
  const openPull=event=>{setAddFor({event,channel:"sms",pull:true});setAddAmount(balances[event.id]?.balance??0);setAddNote("");};
  // מחיקת אירוע: יומן deleted_events_log שומר את פרטי האירוע והרכישות; האורחים נמחקים
  const deleteEvent=async ev=>{
    const n=guestCount[ev.id]||0;
    if(!window.confirm(`למחוק את האירוע "${ev.name}"?\n${n} אורחים, השולחנות, היתרות והתזמונים יימחקו.\nאפשר לשחזר רק מגיבוי (עד 14 יום).`))return;
    if(window.prompt(`לאישור סופי הקלידו את שם האירוע:\n${ev.name}`)?.trim()!==String(ev.name||"").trim()){flash("המחיקה בוטלה");return;}
    setSaving("del-"+ev.id);
    const{data,error}=await sb.rpc("admin_delete_event",{p_event:ev.id});
    setSaving(null);
    if(error){flash("❌ "+error.message);return;}
    flash(`🗑 האירוע נמחק (${data.guests} אורחים, ${data.tables} שולחנות)`);loadData();
  };
  // כמה חסר ב-019 כדי לכסות את מה שכבר נמכר + הכמות החדשה (0 = יש מספיק / לא ידוע)
  const providerShort=amt=>provider?.ok&&amt>0?Math.max(0,(provider.committed||0)+amt-(provider.provider_balance||0)):0;
  const doAdd=async()=>{
    let amt=parseInt(addAmount,10);
    if(!amt){flash("הזן כמות");return;}
    if(addFor.pull){
      const bal=balances[addFor.event.id]?.balance??0;
      amt=Math.abs(amt);
      if(amt>bal){flash(`אפשר למשוך עד ${bal} (היתרה)`);return;}
      if(!window.confirm(`למשוך ${amt} SMS מ"${addFor.event.name}"?\nהיתרה תרד מ-${bal} ל-${bal-amt}.`))return;
      amt=-amt;
    }
    const wa=addFor.channel==="wa";
    const short=wa?0:providerShort(amt);
    if(short>0&&!window.confirm(`⚠️ בחשבון ה-019 חסרות ${short.toLocaleString()} הודעות כדי לכסות את כל מה שנמכר ללקוחות.\nמומלץ לטעון את חשבון ה-019 קודם.\n\nלהמשיך בכל זאת?`))return;
    setSaving("add");
    const{data,error}=wa
      ?await sb.rpc("admin_add_wa",{p_event:addFor.event.id,p_records:amt,p_note:addNote||null,p_request:addFor.request?.id||null})
      :await sb.rpc("admin_add_sms",{p_event:addFor.event.id,p_amount:amt,p_note:addNote||null,p_request:addFor.request?.id||null});
    setSaving(null);
    if(error){flash("❌ "+error.message);return;}
    flash(`✅ ${amt>0?"נוספו":"הורדו"} ${Math.abs(amt)} ${wa?"רשומות WhatsApp":"SMS"} · יתרה חדשה: ${data}`);
    setAddFor(null);loadData();
  };
  const reject=async r=>{
    if(!window.confirm(`לדחות בקשה ל-${r.amount} הודעות?`))return;
    const{error}=await sb.rpc("admin_reject_sms_request",{p_request:r.id});
    if(error)flash("❌ "+error.message);else{flash("הבקשה נדחתה");loadData();}
  };

  // כניסה לאירוע של לקוח: נפתח בלשונית חדשה, כמו שהלקוח רואה אותו
  const openEventAsAdmin=ev=>{try{localStorage.setItem("sidor_event_id",ev.id);localStorage.setItem("sidor_open_now","1");sessionStorage.removeItem("sidor_landing");}catch{}window.open("/","_blank");};
  const q=search.trim().toLowerCase();
  const fUsers=users.filter(u=>!q||(u.email||"").toLowerCase().includes(q)||u.events.some(e=>e.name?.toLowerCase().includes(q)));
  const fEvents=events.filter(e=>!q||e.name?.toLowerCase().includes(q)||emailOf(e.user_id).toLowerCase().includes(q));
  const totalBalance=Object.values(balances).reduce((s,b)=>s+(b.balance||0),0);
  const totalGuests=Object.values(guestCount).reduce((s,n)=>s+n,0);
  const fmtDate=d=>d?new Date(d).toLocaleDateString("he-IL",{day:"numeric",month:"short",year:"2-digit"}):"—";
  const card={background:"#fff",border:"1px solid #F0E8F7",borderRadius:20,boxShadow:"0 12px 30px -24px rgba(91,60,140,.5)"};
  const chip=(bg,fg)=>({background:bg,color:fg,borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800,whiteSpace:"nowrap"});
  // ─── צריך טיפול: מה דורש את תשומת הלב שלך עכשיו ───
  const day0=new Date();day0.setHours(0,0,0,0);
  const daysTo=d=>d?Math.round((new Date(d+"T00:00:00")-day0)/864e5):null;
  const ownerPkgs=uid=>packages[uid]||[];
  const attention=[];
  if(pending.length)attention.push({lvl:"red",icon:"🛒",text:`${pending.length} בקשות רכישת SMS ממתינות לאישור`,go:()=>setTab("requests")});
  if(waPendingReqs.length)attention.push({lvl:"red",icon:"💬",text:`${waPendingReqs.length} בקשות רכישת WhatsApp ממתינות לאישור`,go:()=>setTab("wa_requests")});
  // ספקים: ממתינים לאישור, וספקים מופעלים שנפתחו אוטומטית ועוד לא סומנו "ראיתי" (בלשונית "ספקים")
  {const pend=pendingVendors.filter(v=>v.status==="pending"),auto=pendingVendors.filter(v=>v.status==="approved");
  if(pend.length)attention.push({lvl:"red",icon:"🏪",text:pend.length===1?`ספק חדש מחכה לאישור · ${pend[0].business_name}`:`${pend.length} ספקים חדשים מחכים לאישור`,sub:pend.slice(0,3).map(v=>v.business_name).join(" · ")+' · מאשרים בלשונית "ספקים"',go:()=>setTab("suppliers")});
  if(auto.length)attention.push({lvl:"red",icon:"🏪",text:auto.length===1?`ספק חדש עלה לאתר · ${auto[0].business_name}`:`${auto.length} ספקים חדשים עלו לאתר`,sub:auto.slice(0,3).map(v=>v.business_name).join(" · ")+' · אושרו אוטומטית. בודקים ומסמנים "ראיתי" בלשונית "ספקים"',go:()=>setTab("suppliers")});}
  // בקשת חשבון מפיק: יש פרופיל מפיק אבל עוד אין חבילת מפיק. מפעילים ב"משתמשים וחבילות" ← "חשבון מפיק"
  producerProfs.filter(pp=>!(packages[pp.user_id]||[]).includes("producer")).forEach(pp=>{const em=(users.find(u=>u.user_id===pp.user_id)||{}).email||"";
    attention.push({lvl:"red",icon:"🎬",text:`בקשת חשבון מפיק · ${pp.brand_name||em||"משתמש"}`,sub:`${pp.phone||""}${em?" · "+em:""} · מפעילים ב"משתמשים וחבילות"`,go:()=>{setSearch(em);setTab("users");}});});
  failedRuns.forEach(r=>{const ev=eventOf(r.event_id);if(!ev)return;
    attention.push({lvl:r.status==="failed"?"red":"amber",icon:r.status==="failed"?"✗":"⏭",text:`שליחה אוטומטית ${r.status==="failed"?"נכשלה":"דולגה"} · ${ev.name}`,sub:`${r.error||""} · ${fmtDate(r.created_at)}`,ev});});
  events.filter(e=>{const d=daysTo(e.date);return d!==null&&d>=0&&d<=14;}).sort((a,b)=>a.date.localeCompare(b.date)).forEach(ev=>{
    const d=daysTo(ev.date),s=stats[ev.id]||{},when=d===0?"היום":d===1?"מחר":`בעוד ${d} ימים`;
    const smsOn=(ev.settings_json?.sms_schedule||[]).some(x=>x.enabled),bal=balances[ev.id]?.balance??0;
    if(smsOn&&bal<(s.phones||0))attention.push({lvl:"red",icon:"📱",text:`אין מספיק SMS לתזמון · ${ev.name} (${when})`,sub:`יתרה ${bal}, אורחים עם נייד ${s.phones||0}`,ev});
    if((s.confirmed||0)>0&&!s.seated)attention.push({lvl:"amber",icon:"🪑",text:`עוד לא הושיבו אף אחד · ${ev.name} (${when})`,sub:`${s.confirmed} אישרו הגעה`,ev});
    if(d<=7&&s.people&&s.pending/s.people>.3)attention.push({lvl:"amber",icon:"⏳",text:`${s.pending} עוד לא ענו · ${ev.name} (${when})`,sub:`מתוך ${s.people} מוזמנים`,ev});
    if(ownerPkgs(ev.user_id).includes("staff"))attention.push({lvl:"info",icon:"👥",text:`צוות הושבה · ${ev.name} · ${fmtDate(ev.date)} (${when})`,sub:ev.venue||"",ev});
    if(ownerPkgs(ev.user_id).includes("kiosk"))attention.push({lvl:"info",icon:"📟",text:`עמדת טאבלט (2 טאבלטים + מדפסת פתקים) · ${ev.name} · ${fmtDate(ev.date)} (${when})`,sub:ev.venue||"",ev});
    if(ownerPkgs(ev.user_id).some(p=>p==="auto"||p==="whatsapp")&&(ev.settings_json?.wa_schedule||[]).some(x=>x.enabled))attention.push({lvl:"info",icon:"💬",text:`סבבי WhatsApp לשליחה ידנית · ${ev.name} (${when})`,ev});
  });
  // פתיחת אירוע של לקוח (כאדמין) כדי לראות בדיוק מה הוא רואה
  const openEvent=ev=>{optSet("sidor_event_id",ev.id);optSet("sidor_last_screen",JSON.stringify({eventId:ev.id,screen:"home",view:"map"}));window.location.href="/";};
  // ─── עיצוב חדש: תפריט צד לפי נושאים + מסך סקירה ───
  const weekAgo=Date.now()-7*864e5,monthAgo=Date.now()-30*864e5;
  const newUsers=users.filter(u=>u.created_at&&new Date(u.created_at).getTime()>=weekAgo).length;
  const newEvents=events.filter(e=>e.created_at&&new Date(e.created_at).getTime()>=weekAgo).length;
  const income30=[...requests,...waRequests].filter(r=>r.status==="approved"&&new Date(r.handled_at||r.created_at).getTime()>=monthAgo).reduce((t,r)=>t+(+r.price||0),0);
  const upcoming=events.filter(e=>{const d=daysTo(e.date);return d!==null&&d>=0&&d<=30;}).sort((a,b)=>a.date.localeCompare(b.date));
  const recentUsers=[...users].filter(u=>u.created_at).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,5);
  attention.forEach(a=>{a.k=`${a.icon}|${a.text}|${a.sub||""}`.slice(0,600);});
  const seenItems=attention.filter(a=>seenAlerts.has(a.k));
  const openItems=attention.filter(a=>!seenAlerts.has(a.k));
  const handle=a=>{markSeen(a.k);a.go&&a.go();};
  const urgent=openItems.filter(a=>a.lvl!=="info");
  const NAV=[
    ["יומיומי",[["overview","🏠","סקירה",null],["attention","🔔","צריך טיפול",urgent.length],["requests","🛒","בקשות SMS",pending.length],["wa_requests","💬","בקשות WhatsApp",waPendingReqs.length]]],
    ["לקוחות",[["events","📅","אירועים ויתרות",events.length],["users","👥","משתמשים וחבילות",users.length],["referrals","🎯","הפניות",Object.keys(refs).length]]],
    ["תוכן ושותפים",[["venues","🏛️","אולמות",null],["suppliers","🏪","ספקים רשומים",null],["vendordata","💡","ספקים ומחירים",null],["reviews","⭐","המלצות",null]]],
    ["מערכת",[["backups","💾","גיבויים",null],["log","🧾","יומן SMS",null]]],
  ];
  const ALERT_TABS=["attention","requests","wa_requests"];
  const navItem=NAV.flatMap(g=>g[1]).find(x=>x[0]===tab)||NAV[0][1][0];
  const SUBS={overview:"מה קורה במערכת עכשיו ומה מחכה לך",attention:"בקשות רכישה, שליחות אוטומטיות שנכשלו ואירועים ב-14 הימים הקרובים",requests:"אישור תשלום וטעינת הודעות SMS ללקוחות",wa_requests:"אישור תשלום וטעינת רשומות WhatsApp",events:"יתרות SMS ו-WhatsApp לכל אירוע",users:"חבילות, סיסמאות וכרטיס לקוח",referrals:"מי הגיע דרך קוד הפניה",venues:"האולמות במאגר",suppliers:"ספקים שנרשמו לאתר",vendordata:"מחירים שדיווחו המשתמשים",reviews:"ההמלצות שמוצגות באתר",backups:"שחזור אירוע מגיבוי",log:"60 התנועות האחרונות"};
  const hello=(()=>{const h=new Date().getHours();return h<12?"בוקר טוב":h<17?"צהריים טובים":h<21?"ערב טוב":"לילה טוב";})();
  const TX_LABEL={admin:"הוספת אדמין",purchase:"רכישה",send:"שליחה",refund:"החזר"};
  const lvlColor=l=>l==="red"?C.danger:l==="amber"?"#B45309":C.blue;
  const providerCard=(
        <div style={{...card,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",
          borderRight:`4px solid ${!provider?C.border:provider.ok?(providerShort(1)>0?C.danger:C.success):C.gold}`}}>
          <div style={{width:44,height:44,borderRadius:14,background:C.blueXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏦</div>
          <div style={{flex:1,minWidth:220}}>
            <div style={{fontWeight:900,fontSize:15}}>חשבון 019 (ספק ה-SMS)</div>
            {!provider?<div style={{fontSize:13,color:C.muted}}>בודק יתרה…</div>
              :provider.ok?<div style={{fontSize:13,color:C.muted}}>
                יתרה ב-019: <b style={{color:C.text}}>{(provider.provider_balance??0).toLocaleString()}</b> ·
                נמכרו ללקוחות ועוד לא נשלחו: <b style={{color:C.text}}>{(provider.committed??0).toLocaleString()}</b> ·
                פנוי למכירה: <b style={{color:(provider.provider_balance-provider.committed)<0?"#B42318":"#1F7A4D"}}>{((provider.provider_balance??0)-(provider.committed??0)).toLocaleString()}</b>
              </div>
              :<div style={{fontSize:13,color:"#8A5A00"}}>{provider.configured===false?"⚠️ החיבור ל-019 עוד לא הוגדר (SMS019_USERNAME / SMS019_TOKEN)":`⚠️ ${provider.error||"019 החזיר שגיאה"}${provider.provider_status!=null?` (סטטוס ${provider.provider_status})`:""}`}</div>}
          </div>
          <button onClick={loadProvider} className="sx-btn" style={{background:"#fff",color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 12px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🔄 בדוק שוב</button>
        </div>
  );

  return(
    <div dir="rtl" className="adm">
      <style>{ADM_CSS}</style>
      <header className="adm-top">
        <div className="adm-brand">
          <span className="adm-logo" aria-hidden="true">🛡️</span>
          <div style={{minWidth:0}}>
            <div className="adm-title">ניהול Sidor-IL</div>
            <div className="adm-sub">{user.email}{updatedAt&&` · עודכן ${updatedAt.toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}`}</div>
          </div>
        </div>
        <label className="adm-search"><span aria-hidden="true">🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש לפי מייל או שם אירוע" aria-label="חיפוש לפי מייל או שם אירוע"/>
        </label>
        <div className="adm-actions">
          <button onClick={()=>{window.location.hash="";}} className="adm-btn">לאתר</button>
          <button onClick={refreshAll} className="adm-btn">🔄 רענון</button>
          <button onClick={onLogout} className="adm-btn danger">יציאה</button>
        </div>
      </header>

      <div className="adm-layout">
        <nav className="adm-side" aria-label="תפריט ניהול">
          {NAV.map(([g,items])=>(
            <div key={g} className="adm-group">
              <div className="adm-glabel">{g}</div>
              {items.map(([id,ic,label,count])=>(
                <button key={id} onClick={()=>setTab(id)} className={"adm-nav"+(tab===id?" on":"")} aria-current={tab===id?"page":undefined}>
                  <span className="adm-nic" aria-hidden="true">{ic}</span>
                  <span className="adm-nl">{label}</span>
                  {count!==null&&count>0&&<span className={"adm-cnt"+(ALERT_TABS.includes(id)?" alert":"")}>{count.toLocaleString()}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="adm-main">
          <div className="adm-head">
            <h1>{tab==="overview"?`${hello} 👋`:<><span aria-hidden="true">{navItem[1]}</span> {navItem[2]}</>}</h1>
            <p>{SUBS[navItem[0]]}</p>
          </div>
        {loading?(
          <div style={{textAlign:"center",padding:60}}><Spinner size={36}/></div>
        ):tab==="overview"?(
          <div>
            <div className="adm-kpis">
              {[["👥","משתמשים",users.length,newUsers?`+${newUsers} השבוע`:"אין חדשים השבוע","#F1EAFF"],
                ["📅","אירועים",events.length,newEvents?`+${newEvents} השבוע`:"אין חדשים השבוע","#FFE9F2"],
                ["🎊","אורחים במערכת",totalGuests,`${upcoming.length} אירועים ב-30 הימים הקרובים`,"#FFF4DE"],
                ["📱","יתרת SMS אצל לקוחות",totalBalance,"נמכרו ועוד לא נשלחו","#E6F4FF"],
                ["₪","הכנסות ב-30 יום",`₪${income30.toLocaleString()}`,"מבקשות רכישה שאושרו","#E6F8EF"]].map(([ic,l,v,sub,bg])=>(
                <div key={l} className="adm-kpi" style={{background:bg}}>
                  <div className="adm-kpi-top"><span className="adm-kpi-ic" aria-hidden="true">{ic}</span>{l}</div>
                  <div className="adm-kpi-v">{typeof v==="number"?v.toLocaleString():v}</div>
                  <div className="adm-kpi-s">{sub}</div>
                </div>
              ))}
            </div>

            <div className="adm-grid2">
              <section className="adm-card" aria-labelledby="adm-h-att">
                <div className="adm-card-h"><h2 id="adm-h-att">🔔 צריך טיפול</h2>{urgent.length>0&&<button className="adm-link" onClick={()=>setTab("attention")}>הכל ({urgent.length})</button>}</div>
                {!urgent.length?<div className="adm-empty">✅ אין כרגע שום דבר שדורש טיפול</div>
                  :urgent.slice(0,5).map((a,i)=>(
                  <div key={i} className="adm-li" style={{"--c":lvlColor(a.lvl)}}>
                    <span className="adm-li-ic" aria-hidden="true">{a.icon}</span>
                    <div className="adm-li-t"><b>{a.text}</b>{(a.sub||a.ev)&&<span>{a.sub}{a.ev?`${a.sub?" · ":""}${emailOf(a.ev.user_id)}`:""}</span>}</div>
                    {a.go?<button className="adm-mini" onClick={()=>handle(a)}>לטיפול</button>:<button className="adm-mini" onClick={()=>markSeen(a.k)} title="מסמן כמטופל ומוריד מהרשימה">✓ טופל</button>}
                    {a.ev&&<button className="adm-mini ghost" onClick={()=>openEvent(a.ev)}>פתח אירוע</button>}
                  </div>
                ))}
              </section>
              <section className="adm-card" aria-labelledby="adm-h-up">
                <div className="adm-card-h"><h2 id="adm-h-up">📅 אירועים ב-30 הימים הקרובים</h2><button className="adm-link" onClick={()=>setTab("events")}>כל האירועים</button></div>
                {!upcoming.length?<div className="adm-empty">אין אירועים בחודש הקרוב</div>
                  :upcoming.slice(0,6).map(ev=>{const st=stats[ev.id]||{},d=daysTo(ev.date),pct=st.people?Math.round((st.confirmed||0)/st.people*100):0;return(
                  <div key={ev.id} className="adm-li">
                    <span className="adm-days"><b>{d===0?"היום":d===1?"מחר":d}</b>{d>1?"ימים":""}</span>
                    <div className="adm-li-t">
                      <b>{ev.name}</b>
                      <span>{fmtDate(ev.date)} · {st.people||0} מוזמנים · {pct}% אישרו</span>
                      <div className="adm-bar" role="img" aria-label={`${pct}% אישרו הגעה`}><i style={{width:pct+"%"}}/></div>
                    </div>
                    <button className="adm-mini ghost" onClick={()=>setCustFor(ev.user_id)}>לקוח</button>
                    <button className="adm-mini ghost" onClick={()=>openEvent(ev)}>פתח</button>
                  </div>
                );})}
              </section>
            </div>

            {providerCard}

            <div className="adm-grid2">
              <section className="adm-card" aria-labelledby="adm-h-nu">
                <div className="adm-card-h"><h2 id="adm-h-nu">👋 משתמשים חדשים</h2><button className="adm-link" onClick={()=>setTab("users")}>כל המשתמשים</button></div>
                {!recentUsers.length?<div className="adm-empty">אין עדיין משתמשים</div>
                  :recentUsers.map(u=>(
                  <div key={u.user_id} className="adm-li">
                    <span className="adm-av" aria-hidden="true">{(u.email||"?")[0].toUpperCase()}</span>
                    <div className="adm-li-t"><b dir="ltr" style={{textAlign:"right"}}>{u.email||u.user_id}</b><span>הצטרף {fmtDate(u.created_at)} · {u.events.length} אירועים · {u.guests} אורחים</span></div>
                    <button className="adm-mini ghost" onClick={()=>setCustFor(u.user_id)}>כרטיס לקוח</button>
                  </div>
                ))}
              </section>
              <section className="adm-card" aria-labelledby="adm-h-tx">
                <div className="adm-card-h"><h2 id="adm-h-tx">🧾 תנועות SMS אחרונות</h2><button className="adm-link" onClick={()=>setTab("log")}>ליומן המלא</button></div>
                {!txs.length?<div className="adm-empty">אין עדיין תנועות SMS</div>
                  :txs.slice(0,5).map(t=>(
                  <div key={t.id} className="adm-li">
                    <span style={{...chip(t.amount>0?"#E9FBF4":"#FFF2F4",t.amount>0?"#1F7A4D":"#B42318"),minWidth:54,textAlign:"center"}}>{t.amount>0?"+":""}{t.amount}</span>
                    <div className="adm-li-t"><b>{TX_LABEL[t.kind]||t.kind}{eventOf(t.event_id)?` · ${eventOf(t.event_id).name}`:""}</b><span>{t.note?`${t.note} · `:""}{new Date(t.created_at).toLocaleString("he-IL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span></div>
                  </div>
                ))}
              </section>
            </div>
          </div>
        ):tab==="attention"?(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {!openItems.length&&<div style={{...card,padding:40,textAlign:"center",color:C.muted}}><div style={{fontSize:40}}>✅</div><div style={{fontWeight:800,marginTop:6}}>אין כרגע שום דבר שדורש טיפול</div><div style={{fontSize:13,marginTop:4}}>בודק: בקשות רכישה, שליחות אוטומטיות שנכשלו, ואירועים ב-14 הימים הקרובים</div></div>}
            {(showSeen?attention:openItems).map((a,i)=>{const col=a.lvl==="red"?C.danger:a.lvl==="amber"?"#B45309":C.blue,done=seenAlerts.has(a.k);return(
              <div key={a.k} className="adm-row" style={{...card,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",borderRight:`4px solid ${done?"#CBD5E0":col}`,opacity:done?.6:1}}>
                <div style={{width:38,height:38,borderRadius:12,background:col+"14",color:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,flexShrink:0}}>{a.icon}</div>
                <div style={{flex:1,minWidth:220}}>
                  <div style={{fontWeight:800,fontSize:14}}>{a.text}</div>
                  {(a.sub||a.ev)&&<div style={{fontSize:12,color:C.muted}}>{a.sub}{a.ev?`${a.sub?" · ":""}${emailOf(a.ev.user_id)}`:""}</div>}
                </div>
                {done?<button onClick={()=>unmarkSeen(a.k)} className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.text,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>↩ החזרה לרשימה</button>
                :<>{a.go&&<button onClick={()=>handle(a)} className="sx-btn" style={{background:GRAD,color:"#fff",border:"none",borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>לטיפול ←</button>}
                <button onClick={()=>markSeen(a.k)} className="sx-btn" title="מסמן כמטופל ומוריד מהרשימה" style={{background:"#EFFAF3",border:"1.5px solid #BDEFDD",color:"#1F7A4D",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>✓ טופל</button></>}
                {a.ev&&<button onClick={()=>setCustFor(a.ev.user_id)} className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.text,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>👤 כרטיס לקוח</button>}
                {a.ev&&<button onClick={()=>openEvent(a.ev)} className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.text,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>📅 פתח אירוע</button>}
              </div>
            );})}
            {seenItems.length>0&&<button onClick={()=>setShowSeen(v=>!v)} style={{alignSelf:"center",background:"none",border:"none",color:C.muted,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline",padding:8}}>
              {showSeen?"הסתרת מה שטופל":`הצגת ${seenItems.length} פריטים שסומנו כמטופלים`}</button>}
          </div>
        ):tab==="wa_requests"?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {waPendingReqs.length===0&&<div style={{...card,padding:40,textAlign:"center",color:C.muted}}><div style={{fontSize:40}}>✅</div><div style={{fontWeight:800,marginTop:6}}>אין בקשות WhatsApp ממתינות</div></div>}
            {waPendingReqs.map(r=>{const ev=eventOf(r.event_id);return(
              <div key={r.id} className="adm-row" style={{...card,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",borderRight:`4px solid ${WA_GREEN}`}}>
                <div style={{width:48,height:48,borderRadius:14,background:"#E9FBF4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontWeight:900,fontSize:16}}>{r.records.toLocaleString()} רשומות WhatsApp · ₪{r.price??"—"}</div>
                  <div style={{fontSize:13,color:C.muted}}>{ev?.name||"אירוע"} · {emailOf(r.user_id)} · {fmtDate(r.created_at)}</div>
                </div>
                <span style={chip("#E9FBF4","#276749")}>יתרה כרגע: {waBalances[r.event_id]??0}</span>
                <button onClick={()=>ev&&openAdd(ev,{id:r.id,amount:r.records,price:r.price,channel:"wa"})} className="sx-btn" style={{background:WA_GREEN,color:"#fff",border:"none",borderRadius:12,padding:"9px 16px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>✅ אשר תשלום והטען</button>
                <button onClick={()=>rejectWa(r)} className="sx-btn" style={{background:"#fff",color:C.danger,border:`1.5px solid #F4C7CD`,borderRadius:12,padding:"9px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>דחה</button>
              </div>
            );})}
            {waRequests.filter(r=>r.status!=="pending").length>0&&(
              <div style={{...card,padding:"12px 16px",marginTop:6}}>
                <div style={{fontSize:13,fontWeight:900,color:C.muted,marginBottom:8}}>בקשות שטופלו</div>
                {waRequests.filter(r=>r.status!=="pending").slice(0,10).map(r=>(
                  <div key={r.id} style={{display:"flex",gap:10,fontSize:13,padding:"6px 0",borderTop:`1px solid ${C.border}`}}>
                    <span style={chip(r.status==="approved"?"#E9FBF4":"#FDECEE",r.status==="approved"?C.success:C.danger)}>{r.status==="approved"?"אושרה":"נדחתה"}</span>
                    <span style={{flex:1}}>{r.records} רשומות · {eventOf(r.event_id)?.name||""}</span>
                    <span style={{color:C.muted}}>{fmtDate(r.handled_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ):tab==="requests"?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {providerCard}
            {pending.length===0&&<div style={{...card,padding:40,textAlign:"center",color:C.muted}}><div style={{fontSize:40}}>✅</div><div style={{fontWeight:800,marginTop:6}}>אין בקשות רכישה ממתינות</div></div>}
            {pending.map(r=>{const ev=eventOf(r.event_id);return(
              <div key={r.id} className="adm-row" style={{...card,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",borderRight:`4px solid ${C.gold}`}}>
                <div style={{width:48,height:48,borderRadius:14,background:"#FFF4E0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🛒</div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontWeight:900,fontSize:16}}>{r.amount.toLocaleString()} הודעות · ₪{r.price??"—"}</div>
                  <div style={{fontSize:13,color:C.muted}}>{ev?.name||"אירוע"} · {emailOf(r.user_id)} · {fmtDate(r.created_at)}</div>
                </div>
                <span style={chip(C.blueXL,C.muted)}>יתרה כרגע: {balances[r.event_id]?.balance??0}</span>
                <button onClick={()=>ev&&openAdd(ev,r)} className="sx-btn sx-btn-primary" style={{background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:"9px 16px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>✅ אשר תשלום והטען</button>
                <button onClick={()=>reject(r)} className="sx-btn" style={{background:"#fff",color:C.danger,border:`1.5px solid #F4C7CD`,borderRadius:12,padding:"9px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>דחה</button>
              </div>
            );})}
            {requests.filter(r=>r.status!=="pending").length>0&&(
              <div style={{...card,padding:"12px 16px",marginTop:6}}>
                <div style={{fontSize:13,fontWeight:900,color:C.muted,marginBottom:8}}>בקשות שטופלו</div>
                {requests.filter(r=>r.status!=="pending").slice(0,10).map(r=>(
                  <div key={r.id} style={{display:"flex",gap:10,fontSize:13,padding:"6px 0",borderTop:`1px solid ${C.border}`}}>
                    <span style={chip(r.status==="approved"?"#E9FBF4":"#FDECEE",r.status==="approved"?C.success:C.danger)}>{r.status==="approved"?"אושרה":"נדחתה"}</span>
                    <span style={{flex:1}}>{r.amount} הודעות · {eventOf(r.event_id)?.name||""}</span>
                    <span style={{color:C.muted}}>{fmtDate(r.handled_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ):tab==="events"?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:12}}>
            {fEvents.map(ev=>{const b=balances[ev.id];return(
              <div key={ev.id} className="adm-row" style={{...card,padding:16,display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:900,fontSize:16,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ev.name}</div>
                    <div style={{fontSize:12,color:C.muted}}>{emailOf(ev.user_id)}</div>
                  </div>
                  <span style={chip(ev.invite_active?"#E9FBF4":"#FDECEE",ev.invite_active?C.success:C.danger)}>{ev.invite_active?"הזמנה פעילה":"כבויה"}</span>
                </div>
                <button onClick={()=>openEventAsAdmin(ev)} className="sx-btn" style={{alignSelf:"stretch",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,background:"#F4EEFF",color:"#5B2FA8",border:"1.5px solid #E2D4F5",borderRadius:12,padding:"9px 12px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🔍 כניסה לאירוע</button>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",fontSize:12}}>
                  <span style={chip(C.blueXL,C.text)}>📅 {ev.date?fmtDate(ev.date):"ללא תאריך"}</span>
                  <span style={chip(C.blueXL,C.text)}>🎊 {guestCount[ev.id]||0} אורחים</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,background:C.blueXL,borderRadius:14,padding:"10px 12px"}}>
                  <div style={{fontSize:22}}>📱</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:20,fontWeight:900,lineHeight:1}}>{(b?.balance??0).toLocaleString()}</div>
                    <div style={{fontSize:12,color:C.muted,fontWeight:700}}>יתרת SMS · נשלחו {b?.total_sent??0}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <button onClick={()=>openAdd(ev)} className="sx-btn sx-btn-primary" style={{background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:"9px 14px",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>+ הוסף SMS</button>
                    {(b?.balance??0)>0&&<button onClick={()=>openPull(ev)} style={{background:"#fff",color:C.danger,border:"1.5px solid #F4C7CD",borderRadius:12,padding:"6px 10px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>↩️ משיכת SMS</button>}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"#F0FFF4",borderRadius:14,padding:"10px 12px"}}>
                  <div style={{fontSize:22}}>💬</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:20,fontWeight:900,lineHeight:1}}>{(waBalances[ev.id]??0).toLocaleString()}</div>
                    <div style={{fontSize:12,color:C.muted,fontWeight:700}}>רשומות WhatsApp (4 הודעות לרשומה){waUsedAdm[ev.id]?` · נוצלו ${waUsedAdm[ev.id]}`:""}</div>
                  </div>
                  <button onClick={()=>openAdd(ev,null,"wa")} className="sx-btn" style={{background:WA_GREEN,color:"#fff",border:"none",borderRadius:12,padding:"9px 14px",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>+ הוסף WhatsApp</button>
                </div>
                <button onClick={()=>deleteEvent(ev)} disabled={saving==="del-"+ev.id} style={{alignSelf:"flex-start",background:"none",border:"none",color:C.danger,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",padding:"2px 0"}}>{saving==="del-"+ev.id?"מוחק…":"🗑 מחיקת האירוע"}</button>
              </div>
            );})}
            {fEvents.length===0&&<div style={{...card,padding:30,textAlign:"center",color:C.muted}}>לא נמצאו אירועים</div>}
          </div>
        ):tab==="users"?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <AdminCreateUser card={card} onDone={()=>loadData(true)}/>
            {fUsers.map(u=>(
              <div key={u.user_id} className="adm-row" style={{...card,padding:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:GRAD,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17}}>{(u.email||"?")[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:900,fontSize:15,direction:"ltr",textAlign:"right"}}>{u.email||u.user_id}</div>
                    <div style={{fontSize:12,color:C.muted}}>הצטרף {fmtDate(u.created_at)} · כניסה אחרונה {fmtDate(u.last_sign_in_at)}{refs[u.user_id]&&<> · 🎯 הגיע דרך <b>{refs[u.user_id]}</b></>}</div>
                    {[...new Set(u.events.map(e=>e.host_phone).filter(p=>normPhone(p)))].map(p=>(
                      <a key={p} href={`https://wa.me/972${normPhone(p).slice(1)}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",fontSize:12,fontWeight:800,color:"#15803D",textDecoration:"none",marginTop:3,marginLeft:10,direction:"ltr"}}>💬 {p}</a>
                    ))}
                  </div>
                  <span style={chip(C.blueXL,C.text)}>{u.events.length} אירועים</span>
                  <span style={chip(C.blueXL,C.text)}>{u.guests} אורחים</span>
                  <button onClick={()=>setCustFor(u.user_id)} className="sx-btn" style={{background:GRAD,color:"#fff",border:"none",borderRadius:10,padding:"5px 10px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>👤 כרטיס לקוח</button>
                  <button onClick={()=>setPwFor(u)} className="sx-btn" style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.text,borderRadius:10,padding:"5px 10px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🔑 סיסמה חדשה</button>
                </div>
                {u.events.length>0&&<div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",background:"#FBF8FF",borderRadius:14,padding:"8px 10px",marginBottom:12}}>
                  <span style={{fontSize:12,fontWeight:800,color:C.muted}}>כניסה לאירועים שלו:</span>
                  {u.events.map(e=>(
                    <button key={e.id} onClick={()=>openEventAsAdmin(e)} className="sx-btn" title="נפתח בלשונית חדשה" style={{background:"#fff",color:"#5B2FA8",border:"1.5px solid #E2D4F5",borderRadius:100,padding:"5px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",maxWidth:240,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>🔍 {e.name||"אירוע"}</button>
                  ))}
                  <button onClick={()=>{setSearch(u.email||"");setTab("events");}} style={{background:"none",border:"none",color:"#5B2FA8",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>יתרות ופרטי האירועים</button>
                </div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6}}>
                  {[...ALL_PACKAGES,...(packages[u.user_id]||[]).filter(id=>!ALL_PACKAGES.some(p=>p.id===id)).map(id=>({id,name:LEGACY_PACKAGES[id]||id+" (ישן)",color:"#A0AEC0",icon:"🗄️"}))].map(pkg=>{
                    const hasIt=(packages[u.user_id]||[]).includes(pkg.id);
                    const isSaving=saving===`${u.user_id}-${pkg.id}`;
                    return(
                      <button key={pkg.id} onClick={()=>togglePackage(u.user_id,pkg.id,hasIt)} disabled={isSaving} className="sx-btn"
                        style={{background:hasIt?pkg.color+"18":"#fff",border:`1.5px solid ${hasIt?pkg.color:C.border}`,borderRadius:12,padding:"8px 10px",fontSize:13,fontWeight:800,color:hasIt?pkg.color:C.muted,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
                        {isSaving?<Spinner size={12} color={pkg.color}/>:<span>{pkg.icon}</span>}
                        <span style={{flex:1,textAlign:"right"}}>{pkg.name}</span>
                        <span style={{fontSize:15}}>{hasIt?"✓":"+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {fUsers.length===0&&<div style={{...card,padding:30,textAlign:"center",color:C.muted}}>לא נמצאו משתמשים</div>}
          </div>
        ):tab==="venues"?(
          <AdminVenues card={card}/>
        ):tab==="referrals"?(
          <AdminReferrals card={card} refs={refs} users={users} packages={packages} onCustomer={setCustFor}/>
        ):tab==="reviews"?(
          <AdminTestimonials card={card}/>
        ):tab==="vendordata"?(
          <AdminVendorData card={card}/>
        ):tab==="suppliers"?(
          <AdminSuppliers card={card}/>
        ):tab==="backups"?(
          <AdminBackups card={card} events={events}/>
        ):(
          <div style={{...card,padding:"8px 16px"}}>
            {txs.length===0&&<div style={{padding:30,textAlign:"center",color:C.muted}}>אין עדיין תנועות SMS</div>}
            {txs.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.border}`,fontSize:13,flexWrap:"wrap"}}>
                <span style={chip(t.amount>0?"#E9FBF4":"#FFF2F4",t.amount>0?C.success:C.danger)}>{t.amount>0?"+":""}{t.amount}</span>
                <span style={{fontWeight:800}}>{TX_LABEL[t.kind]||t.kind}</span>
                <span style={{flex:1,color:C.muted}}>{eventOf(t.event_id)?.name||""}{t.note?` · ${t.note}`:""}</span>
                <span style={{color:C.muted}}>{new Date(t.created_at).toLocaleString("he-IL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
              </div>
            ))}
          </div>
        )}
        </main>
      </div>

      {/* חלון הוספת SMS */}
      {addFor&&(
        <div style={{position:"fixed",inset:0,zIndex:320,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setAddFor(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"22px",width:"100%",maxWidth:430,boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)"}}>
            <div style={{fontSize:19,fontWeight:900,marginBottom:2}}>{addFor.channel==="wa"?"💬":"📱"} {addFor.pull?"משיכת SMS בחזרה":addFor.request?"אישור רכישה":addFor.channel==="wa"?"הוספת רשומות WhatsApp":"הוספת SMS"}</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:14}}>{addFor.event.name} · יתרה כרגע {addFor.channel==="wa"?`${waBalances[addFor.event.id]??0} רשומות WhatsApp`:balances[addFor.event.id]?.balance??0}</div>
            {addFor.pull?<>
              <div style={{fontSize:12,fontWeight:800,color:C.muted,margin:"4px 0 6px"}}>כמה SMS למשוך? (ברירת מחדל: כל היתרה)</div>
              <input type="number" min="1" value={addAmount} onChange={e=>setAddAmount(e.target.value)} dir="ltr"
                style={{width:"100%",boxSizing:"border-box",background:"#FFF5F5",border:"1.5px solid #F4C7CD",borderRadius:12,padding:"10px 12px",fontSize:18,fontWeight:900,color:C.text,outline:"none",fontFamily:"inherit",marginBottom:10,textAlign:"center"}}/>
              <input value={addNote} onChange={e=>setAddNote(e.target.value)} placeholder="סיבה (למשל: ביטול עסקה, הוחזר כסף)"
                style={{width:"100%",boxSizing:"border-box",background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",marginBottom:14}}/>
              <button onClick={doAdd} disabled={saving==="add"||!(+addAmount>0)} className="sx-btn"
                style={{width:"100%",background:C.danger,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:6,opacity:saving==="add"||!(+addAmount>0)?.6:1}}>
                {saving==="add"?"שומר...":`↩️ משיכת ${Math.abs(+addAmount||0).toLocaleString()} SMS`}
              </button>
              <button onClick={()=>setAddFor(null)} style={{width:"100%",background:"none",border:"none",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",padding:6}}>ביטול</button>
            </>:<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
              {(addFor.channel==="wa"?[[100],[200],[300],[400],[500],[700]]:SMS_PACKS).map(([a])=>(
                <button key={a} onClick={()=>setAddAmount(a)} style={{background:+addAmount===a?GRAD:C.blueXL,color:+addAmount===a?"#fff":C.text,border:"none",borderRadius:10,padding:"9px 0",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>{a}</button>
              ))}
            </div>
            <div style={{fontSize:12,fontWeight:800,color:C.muted,margin:"4px 0 6px"}}>כמות (אפשר מספר שלילי כדי להוריד)</div>
            <input type="number" value={addAmount} onChange={e=>setAddAmount(e.target.value)} dir="ltr"
              style={{width:"100%",boxSizing:"border-box",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",fontSize:18,fontWeight:900,color:C.text,outline:"none",fontFamily:"inherit",marginBottom:10,textAlign:"center"}}/>
            {addFor.channel!=="wa"&&providerShort(+addAmount||0)>0&&(
              <div style={{background:"#FDECEE",border:"1px solid #F4C7CD",color:C.danger,borderRadius:12,padding:"8px 12px",fontSize:12,fontWeight:800,marginBottom:10}}>
                ⚠️ אחרי ההוספה יחסרו ב-019 {providerShort(+addAmount).toLocaleString()} הודעות. כדאי לטעון את חשבון ה-019 קודם.
              </div>
            )}
            <input value={addNote} onChange={e=>setAddNote(e.target.value)} placeholder="הערה (למשל: שולם ב-Bit)"
              style={{width:"100%",boxSizing:"border-box",background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",marginBottom:14}}/>
            <button onClick={doAdd} disabled={saving==="add"} className="sx-btn sx-btn-primary"
              style={{width:"100%",background:GRAD,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:6,opacity:saving==="add"?.6:1}}>
              {saving==="add"?"שומר...":(()=>{const u=addFor.channel==="wa"?"רשומות WhatsApp":"SMS";return +addAmount<0?`הורד ${Math.abs(+addAmount)} ${u}`:`טען ${(+addAmount||0).toLocaleString()} ${u}`;})()}
            </button>
            <button onClick={()=>setAddFor(null)} style={{width:"100%",background:"none",border:"none",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",padding:6}}>ביטול</button>
            </>}
          </div>
        </div>
      )}

      {pwFor&&<AdminPasswordModal user={pwFor} onClose={()=>setPwFor(null)}/>}
      {custFor&&users.find(u=>u.user_id===custFor)&&<AdminCustomerCard user={users.find(u=>u.user_id===custFor)} stats={stats} balances={balances} pkgs={packages[custFor]||[]} onOpenEvent={openEvent} onClose={()=>setCustFor(null)}/>}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.text,color:"#fff",borderRadius:14,padding:"12px 18px",fontSize:14,fontWeight:800,zIndex:400,boxShadow:"0 14px 30px -10px rgba(0,0,0,.4)"}}>{toast}</div>}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
// ─── דפים משפטיים: תנאי שימוש, מדיניות פרטיות, הצהרת נגישות (#/terms, #/privacy, #/accessibility) ───
