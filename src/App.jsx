import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zcfosfaazvljnzipyzon.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZm9zZmFhenZsam56aXB5em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzU0MzYsImV4cCI6MjA5MTg1MTQzNn0.TG843P0ouzgewhxJbt3aphv-LICWqs3hbQL6v9VbTjE";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// פלטת הצבעים של המערכת  -  תואמת לדף הבית (אפרסק · ורוד · סגול על רקע שמנת)
// שמות המפתחות נשארו היסטוריים (blue*) כדי לא לשבור שימושים קיימים
const C = {
  bg:"#FBF7FC", surface:"#FFFFFF", border:"#EDE4F5",
  blue:"#3A2464", blueM:"#F0609E", blueL:"#9B6BFF", blueXL:"#F7F1FD",
  text:"#2B1D3F", muted:"#6E6585", success:"#2FA57A",
  danger:"#E04B5A", gold:"#E8B04A", info:"#5AA9FF",
  coral:"#FF8A65",
};
const GRAD=`linear-gradient(120deg,${C.coral},${C.blueM},${C.blueL})`;

// ─── שיתוף ההזמנה בוואטסאפ ────────────────────────────────────────────────────
const WA_GREEN="#25D366";
const inviteShareText=(event,url)=>{
  const title=event.event_type==="wedding"&&event.groom_name&&event.bride_name
    ?`💍 ${event.groom_name} ו${event.bride_name} מתחתנים!`:`🎉 ${event.name}`;
  const date=event.date?new Date(event.date).toLocaleDateString("he-IL",{weekday:"long",day:"numeric",month:"long"}):"";
  return [title,date&&`📅 ${date}${event.event_time?" · "+event.event_time:""}`,event.venue&&`📍 ${event.venue}`,"","נשמח לראותכם! לפרטים ולאישור הגעה 👇",url].filter(x=>x!==false&&x!==undefined&&x!==null).join("\n");
};
// שדה תאריך מימין לשמאל: מציג את התאריך בעברית ("יום ב׳, 14 ביוני 2027") ופותח את בורר התאריכים של הדפדפן.
// שדה ה-date המקורי מציג 14/06/2027 משמאל לימין עם האייקון בצד הלא נכון.
function DateField({ value, onChange, style, compact=false, placeholder="בחרו תאריך" }) {
  const ref=useRef(null);
  const d=value?new Date(value+"T00:00:00"):null;
  const txt=d&&!isNaN(d)?d.toLocaleDateString("he-IL",compact?{day:"numeric",month:"short",year:"numeric"}:{weekday:"short",day:"numeric",month:"long",year:"numeric"}):placeholder;
  const open=()=>{try{ref.current?.showPicker();}catch{ref.current?.focus();}};
  return(
    <div onClick={open} style={{...style,position:"relative",display:"flex",alignItems:"center",gap:6,direction:"rtl",textAlign:"right",cursor:"pointer"}}>
      <span style={{flex:1,minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:d?undefined:"#A0AEC0"}}>{txt}</span>
      <span aria-hidden="true" style={{flexShrink:0}}>📅</span>
      <input ref={ref} type="date" value={value||""} onChange={e=>onChange(e.target.value)} aria-label={txt}
        style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0,border:"none",padding:0,margin:0,cursor:"pointer"}}/>
    </div>
  );
}
const shareInviteWA=(event,url)=>window.open("https://wa.me/?text="+encodeURIComponent(inviteShareText(event,url)),"_blank","noopener,noreferrer");
const WaIcon=({size=16,color="#fff"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42"/></svg>
);
const WaButton=({event,url,label="שלח בוואטסאפ",style={}})=>(
  <button onClick={()=>shareInviteWA(event,url)} className="sx-btn" title="פותח וואטסאפ עם הודעה מוכנה וקישור להזמנה"
    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,background:WA_GREEN,color:"#fff",border:"none",borderRadius:12,
      padding:"10px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 18px -8px rgba(37,211,102,.75)",...style}}>
    <WaIcon/>{label}
  </button>
);

const TABLE_TYPES = {
  round:  { label:"עגול",         icon:"⭕", defaultSeats:8  },
  rect:   { label:"מרובע",        icon:"⬛", defaultSeats:10 },
  knight: { label:"שולחן אבירים", icon:"👑", defaultSeats:20 },
};

const RELATION_COLORS = {
  "משפחה קרובה":   "#F0609E",
  "משפחה מורחבת":  "#FF8A65",
  "חברים קרובים":  "#2FA57A",
  "חברים רחוקים":  "#5AA9FF",
  "חברים של ההורים":"#9B6BFF",
  "ללא שיוך":      "#B8AECB",
};

// תאריך בעברית ("יום חמישי, 30 באפריל 2026") במקום 2026-04-30 — נקרא נכון מימין לשמאל
const fmtDateHe=(d,opts={day:"numeric",month:"long",year:"numeric"})=>{
  if(!d)return "";
  const x=typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)?new Date(d+"T00:00:00"):new Date(d);
  return isNaN(x)?String(d):x.toLocaleDateString("he-IL",opts);
};
const pct    = t => t.seats ? Math.round((t.guests||[]).length/t.seats*100) : 0;
const sColor = t => { const g=(t.guests||[]).length; return g>=t.seats?C.danger:g>=t.seats*.8?C.gold:C.success; };
const isMobile = () => window.innerWidth < 1024;

// השוואת טלפונים: רק ספרות, ו-972 בהתחלה נחשב כמו 0 (‎+972 52… = 052…)
const normPhone = p => { let d=String(p||"").replace(/\D/g,""); if(d.startsWith("972"))d="0"+d.slice(3); return d.length>=9?d:""; };
// אורך מרבי להודעת SMS (אימוג'י = 2 תווים). הקישור האישי ב-SMS הוא קצר: sidoril.com/i/<קוד>
const SMS_MAX=200;
const SHORT_LINK_HOST="sidoril.com/i/";
const SMS_PACKS=[[150,70],[300,90],[500,120],[800,170],[1000,200],[2000,330]];
const findByPhone = (list,phone,exceptId) => { const n=normPhone(phone); return n?(list||[]).find(g=>g.id!==exceptId&&normPhone(g.phone)===n):null; };

// ─── שמירת אורח ───────────────────────────────────────────────────────────────
// עדכון/הוספה עם בדיקת שגיאות. אם עמודת הקטגוריה (relation) עוד לא קיימת במסד  -  שומרים את שאר הפרטים ומודיעים
const RELATION_MISSING_MSG="⚠️ הפרטים נשמרו, אבל הקטגוריה לא נשמרה (חסרה עמודת קטגוריה במסד הנתונים).";
const isRelationErr=e=>!!e&&/relation/i.test(`${e.message||""} ${e.details||""} ${e.hint||""}`);
const saveGuestRow=async(id,patch)=>{
  let {error}=await sb.from("guests").update(patch).eq("id",id);
  if(error&&"relation" in patch&&isRelationErr(error)){
    const {relation,...rest}=patch;
    ({error}=await sb.from("guests").update(rest).eq("id",id));
    if(!error){alert(RELATION_MISSING_MSG);return {ok:true,relationSkipped:true};}
  }
  if(error){alert("❌ השמירה נכשלה: "+(error.message||"שגיאה לא ידועה"));return {ok:false,error};}
  return {ok:true};
};
const insertGuestRow=async(row)=>{
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
const formatPhone = raw => {
  let d=String(raw??"").replace(/\D/g,"");
  if(d.startsWith("972"))d="0"+d.slice(3);
  if(d.length===9&&/^[2-9]/.test(d))d="0"+d;
  if(d.length===10&&d.startsWith("05"))return d.slice(0,3)+"-"+d.slice(3);
  return d||"";
};
// שורה חופשית ← שם + טלפון (+ מספר מוזמנים אם יש מספר קטן בסוף, למשל "שרה לוי, 4").
// הטלפון יכול להיות בכל מקום בשורה, מופרד בפסיק, רווח, טאב או כל דבר אחר
const parseGuestLine = line => {
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
const splitNamePhone = (name,phone) => {
  const n=String(name||"").trim();
  if(normPhone(phone))return {name:n,phone:String(phone).trim()};
  const p=parseGuestLine(n);
  return p.phone&&p.name?{name:p.name,phone:p.phone}:{name:n,phone:String(phone||"").trim()};
};
// שורה מגיליון אקסל ← שם + טלפון, לפי שמות עמודות נפוצים (ואם אין  -  מנחשים מהתוכן)
const parseSheetRow = r => {
  const keys=Object.keys(r);
  const k=re=>keys.find(x=>re.test(String(x).trim()));
  const phoneKey=k(/טלפון|פלאפון|נייד|סלולרי|phone|mobile|tel|cell/i);
  const fullKey=k(/^(שם מלא|שם|name|full ?name|guest)$/i)||k(/שם מלא|full ?name/i);
  const firstKey=k(/שם פרטי|first/i), lastKey=k(/שם משפחה|משפחה|last|surname/i);
  const countKey=k(/כמות|מוזמנים|אורחים|מספר אורחים|count|guests|qty/i);
  let name=fullKey?String(r[fullKey]??""):[firstKey&&r[firstKey],lastKey&&r[lastKey]].filter(Boolean).join(" ");
  let phone=phoneKey?formatPhone(r[phoneKey]):"";
  let count=countKey?Math.min(30,Math.max(1,parseInt(r[countKey])||1)):1;
  if(name&&!phone){
    // הטלפון נכתב בתוך עמודת השם  -  מפרידים
    const p=parseGuestLine(name); if(p.phone){name=p.name;phone=p.phone;}
  }
  if(!name){
    // בלי כותרות מוכרות: מחברים את כל התאים ומפרידים לבד
    const p=parseGuestLine(keys.map(x=>r[x]).join(" "));
    name=p.name; phone=phone||p.phone; if(!countKey)count=p.count;
  }
  return {name:String(name).trim(),phone,count};
};
// מכינים רשימה לשמירה: מדלגים על טלפונים שכבר קיימים (באירוע או פעמיים באותו קובץ)
const prepareImport = (parsed,existing,eventId) => {
  const seen=new Set((existing||[]).map(g=>normPhone(g.phone)).filter(Boolean));
  const toInsert=[],dupes=[];
  for(const p of parsed){
    if(!p.name||p.name.length<2)continue;
    const n=normPhone(p.phone);
    if(n&&seen.has(n)){dupes.push(p);continue;}
    if(n)seen.add(n);
    toInsert.push({name:p.name,phone:p.phone||null,rsvp:"pending",guest_count:p.count||1,event_id:eventId,table_id:null});
  }
  return {toInsert,dupes};
};
const importSummary = ({toInsert,dupes}) => {
  const withPhone=toInsert.filter(g=>g.phone).length;
  let msg=`✅ יובאו ${toInsert.length} אורחים (${withPhone} עם טלפון)`;
  if(dupes.length)msg+=`\n⚠️ ${dupes.length} דולגו כי מספר הטלפון כבר קיים ברשימה:\n`+dupes.slice(0,8).map(d=>`• ${d.name} ${d.phone}`).join("\n")+(dupes.length>8?"\n...":"");
  return msg;
};

// חלון "המספר כבר קיים": האפשרות היחידה היא לעדכן את מספר המוזמנים של האורח הקיים
function PhoneExistsDialog({ guest, count, setCount, onUpdate, onBack, busy=false, zIndex=320 }) {
  return(
    <div style={{position:"fixed",inset:0,zIndex,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Heebo',sans-serif"}} onClick={onBack}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" style={{background:"#fff",borderRadius:24,padding:"26px 22px 22px",width:"100%",maxWidth:420,boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)",animation:"sxPopIn .35s cubic-bezier(.3,1.4,.5,1) both"}}>
        <div style={{width:58,height:58,borderRadius:18,background:"#FFF4E0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 12px"}}>📞</div>
        <div style={{fontWeight:900,fontSize:19,color:C.text,textAlign:"center",marginBottom:6}}>המספר הזה כבר קיים ברשימה</div>
        <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:16,lineHeight:1.6}}>אי אפשר לרשום את אותו מספר טלפון פעמיים.<br/>אפשר לעדכן את מספר המוזמנים של האורח הקיים:</div>
        <div style={{background:C.blueXL,borderRadius:16,padding:"12px 14px",marginBottom:16,border:`1.5px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:GRAD,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,flexShrink:0}}>{guest.name?.[0]}</div>
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

const Spinner = ({size=24,color=C.blue}) => (
  <div style={{width:size,height:size,borderRadius:"50%",border:`2.5px solid ${color}22`,borderTopColor:color,animation:"spin .7s linear infinite",flexShrink:0}}/>
);

const Btn = ({children,primary,ghost,danger,small,full,onClick,disabled,style={}}) => (
  <button onClick={onClick} disabled={disabled} className={`sx-btn${primary?" sx-btn-primary":""}`} style={{
    background:danger?C.danger:primary?GRAD:ghost?"transparent":C.surface,
    color:(primary||danger)?"#fff":ghost?C.blue:C.text,
    border:`1.5px solid ${danger?C.danger:primary?"transparent":ghost?C.blue:C.border}`,
    borderRadius:14,padding:small?"7px 16px":"11px 22px",fontSize:small?12:14,fontWeight:700,
    cursor:disabled?"not-allowed":"pointer",opacity:disabled?.45:1,fontFamily:"inherit",transition:"transform .18s,box-shadow .2s,filter .2s",
    width:full?"100%":"auto",boxShadow:primary?`0 8px 22px -6px ${C.blueM}88`:"none",backgroundSize:primary?"200% 100%":undefined,...style,
  }}>{children}</button>
);

const Card = ({children,style={},...props}) => (
  <div style={{background:C.surface,borderRadius:18,border:`1px solid ${C.border}`,boxShadow:"0 2px 12px rgba(91,60,140,0.06)",...style}} {...props}>{children}</div>
);

const Inp = ({value,onChange,placeholder,onKeyDown,type="text",style={}}) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
    style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",...style}}/>
);


// ─── TABLE NODE ───────────────────────────────────────────────────────────────
// שולחן על מפת האולם: מפה לבנה, כיסאות בצבע קבוצת האורח, טבעת מילוי והדגשה בגרירה
const EMPTY_SEAT="#EEE7F6", EMPTY_SEAT_STROKE="#DCCFEA";
const guestColor=g=>RELATION_COLORS[g?.relation]||C.blueL;
const fillColor=(occ,total)=>occ===0?"#DCCFEA":occ>=total?C.danger:occ>=total*.8?C.gold:C.success;

// כיסא מעוגל שמסובב לכיוון השולחן
// אורח שהושב הרגע מקבל אנימציית "קפיצה" של הכיסא
const Chair=({x,y,deg,guest,freshIds,w=13,h=10})=>(
  <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${deg})`}>
    <g className={guest&&freshIds?.has(guest.id)?"sx-chair-new":undefined}>
      <rect x={-w/2} y={-h/2+1.2} width={w} height={h} rx={4.5} fill="rgba(58,36,100,.12)"/>
      <rect x={-w/2} y={-h/2} width={w} height={h} rx={4.5}
        fill={guest?guestColor(guest):EMPTY_SEAT} stroke={guest?"rgba(255,255,255,.9)":EMPTY_SEAT_STROKE} strokeWidth={1.3}>
        {guest&&<title>{guest.name}</title>}
      </rect>
      <rect x={-w/2+2.5} y={-h/2-2.6} width={w-5} height={3} rx={1.5} fill={guest?guestColor(guest):EMPTY_SEAT_STROKE} opacity={.75}/>
    </g>
  </g>
);

// פרץ נצנוצים סביב שולחן כשאורח מושב בו (גדול יותר כשהשולחן מתמלא)
const BURST_COLORS=["#FF8A65","#F0609E","#9B6BFF","#E8B04A","#2FA57A","#5AA9FF"];
const Burst=({big})=>(
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

function TableNode({ table, selected, highlight=false, locked=false, onMouseDown, onDrop }) {
  const [over,setOver]=useState(false);
  const guests=table.guests||[];
  const occupied=guests.length;
  const total=table.seats||10;
  const full=occupied>=total;
  const ring=fillColor(occupied,total);
  // צבע השולחן לפי הקטגוריה הנפוצה אצל היושבים בו (כמו מפת האולם בדף הבית); שולחן ריק — סגול עדין
  const accent=(()=>{const cnt={};guests.forEach(g=>{const r=g.relation||"ללא שיוך";cnt[r]=(cnt[r]||0)+1;});const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0];return top?(RELATION_COLORS[top]||"#B8AECB"):"#C9B6EC";})();
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
    <div onMouseDown={onMouseDown} {...dp} title={tip}
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
      {tableNum&&<span style={{fontSize:big,fontWeight:900,color:C.blue,lineHeight:1}}>{tableNum}</span>}
      <span style={{fontSize:10,fontWeight:800,lineHeight:1.2,color:full?C.danger:occupied?C.muted:"#A99FBD",background:full?"#FDECEE":"transparent",borderRadius:100,padding:full?"0 6px":0}}>
        {occupied}/{total}
      </span>
      {tableName&&<span style={{fontSize:9,fontWeight:800,color:C.text,maxWidth:"80%",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{tableName}</span>}
    </div>
  );
  const selRing=(shape)=>selected&&shape;

  // ─── שולחן אבירים: מלבן ארוך עם כיסאות משני הצדדים ───
  if(table.type==="knight"){
    const W=180,H=60,pad=16,SW=W+pad*2,SH=H+pad*2;
    const top=Math.ceil(total/2),bottom=total-top;
    const chairs=[];
    for(let i=0;i<top;i++)chairs.push(<Chair key={"t"+i} x={pad+W/(top+1)*(i+1)} y={pad-8} deg={0} freshIds={fresh} guest={guests[i]}/>);
    for(let i=0;i<bottom;i++)chairs.push(<Chair key={"b"+i} x={pad+W/(bottom+1)*(i+1)} y={pad+H+8} deg={180} freshIds={fresh} guest={guests[top+i]}/>);
    return wrap(SW,SH,table.x-pad,table.y-pad,<>
      {chairs}
      {selRing(<rect x={pad-6} y={pad-6} width={W+12} height={H+12} rx={18} fill="none" stroke={C.blueL} strokeWidth={2} strokeDasharray="5 4"/>)}
      <rect x={pad} y={pad} width={W} height={H} rx={14} fill="#fff"/>
      <rect x={pad} y={pad} width={W} height={H} rx={14} fill={`url(#tc${uid})`} stroke={ring} strokeWidth={2.5}/>
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
    for(let i=0;i<topN;i++)chairs.push(<Chair key={"t"+i} x={pad+W/(topN+1)*(i+1)} y={pad-9} deg={0} freshIds={fresh} guest={guests[k++]}/>);
    for(let i=0;i<rightN;i++)chairs.push(<Chair key={"r"+i} x={pad+W+9} y={pad+H/(rightN+1)*(i+1)} deg={90} freshIds={fresh} guest={guests[k++]}/>);
    for(let i=0;i<bottomN;i++)chairs.push(<Chair key={"b"+i} x={pad+W/(bottomN+1)*(i+1)} y={pad+H+9} deg={180} freshIds={fresh} guest={guests[k++]}/>);
    for(let i=0;i<leftN;i++)chairs.push(<Chair key={"l"+i} x={pad-9} y={pad+H/(leftN+1)*(i+1)} deg={270} freshIds={fresh} guest={guests[k++]}/>);
    return wrap(SW,SH,table.x-pad,table.y-pad,<>
      {chairs}
      {selRing(<rect x={pad-7} y={pad-7} width={W+14} height={H+14} rx={20} fill="none" stroke={C.blueL} strokeWidth={2} strokeDasharray="5 4"/>)}
      <rect x={pad} y={pad} width={W} height={H} rx={16} fill="#fff"/>
      <rect x={pad} y={pad} width={W} height={H} rx={16} fill={`url(#tc${uid})`} stroke={ring} strokeWidth={2.5}/>
      <rect x={pad+6} y={pad+6} width={W-12} height={H-12} rx={11} fill="none" stroke={accent} strokeOpacity=".4" strokeDasharray="4 4"/>
      <Flowers x={pad+W/2} y={pad+14} s={.7}/>
    </>,labelBox({left:pad,top:pad+8,width:W,height:H-8}));
  }

  // ─── שולחן עגול: כיסאות סביב, טבעת התקדמות ומרכז פרחוני ───
  const R=50,seatDist=R+15,S=(seatDist+14)*2,cx=S/2,cy=S/2;
  const circ=2*Math.PI*(R+5);
  const chairs=Array.from({length:total},(_,i)=>{
    const deg=i*(360/total);const a=deg*Math.PI/180;
    return <Chair key={i} x={cx+seatDist*Math.sin(a)} y={cy-seatDist*Math.cos(a)} deg={deg} freshIds={fresh} guest={guests[i]}/>;
  });
  return wrap(S,S,table.x,table.y,<>
    {chairs}
    {selRing(<circle cx={cx} cy={cy} r={R+11} fill="none" stroke={C.blueL} strokeWidth={2} strokeDasharray="5 4"/>)}
    <circle cx={cx} cy={cy} r={R} fill="#fff"/>
    <circle cx={cx} cy={cy} r={R} fill={`url(#tc${uid})`} stroke={accent} strokeOpacity=".45" strokeWidth={1.5}/>
    {/* טבעת התקדמות  -  כמה מהשולחן מלא */}
    <circle cx={cx} cy={cy} r={R+5} fill="none" stroke="#F1EAF8" strokeWidth={3.5}/>
    <circle cx={cx} cy={cy} r={R+5} fill="none" stroke={ring} strokeWidth={3.5} strokeLinecap="round"
      strokeDasharray={`${circ*Math.min(occupied/total,1)} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray .4s"}}/>
    <circle cx={cx} cy={cy} r={R-9} fill="none" stroke={accent} strokeOpacity=".3" strokeDasharray="3 5"/>
    <Flowers x={cx} y={cy-29} s={.85}/>
  </>,labelBox({inset:0,paddingTop:12},22));
}

// ─── RSVP BADGE ──────────────────────────────────────────────────────────────
const RsvpBadge = ({rsvp}) => {
  const map = {confirmed:{bg:"#F0FFF6",color:C.success,label:"מגיע ✓"},declined:{bg:"#FEF2F2",color:C.danger,label:"לא מגיע ✗"},pending:{bg:C.blueXL,color:C.muted,label:"ממתין..."}};
  const s = map[rsvp||"pending"];
  return <span style={{fontSize:11,fontWeight:700,background:s.bg,color:s.color,borderRadius:100,padding:"2px 9px",whiteSpace:"nowrap"}}>{s.label}</span>;
};

function GuestChip({ guest, tableId, onRemove }) {
  return(<div draggable={true} onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(guest.id));if(tableId)e.dataTransfer.setData("fromTable",String(tableId));}} style={{display:"flex",alignItems:"center",gap:8,background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:12,padding:"7px 11px",cursor:"grab",marginBottom:6}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.blueL} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
    <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{guest.name[0]}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:13,fontWeight:600,color:C.text}}>{guest.name}</div>
      {guest.phone&&<div style={{fontSize:11,color:C.muted}}>{guest.phone}</div>}
    </div>
    <RsvpBadge rsvp={guest.rsvp}/>
    {onRemove&&<button onClick={()=>onRemove(guest)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:0,lineHeight:1,flexShrink:0}}>×</button>}
  </div>);
}

// ─── ADD/EDIT GUEST MODAL ─────────────────────────────────────────────────────
function GuestModal({ guest, eventId, onSave, onClose, existingGuests=[], desktop=false, onUpdateExisting }) {
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
            <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>האורח הקיים</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>{dupGuest.name[0]}</div>
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
        <input value={name} onChange={e=>setName(e.target.value)} onBlur={moveNamePhone} placeholder="ישראל ישראלי"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>מספר פלאפון</div>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="050-0000000" type="tel"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>כמות מגיעים</div>
        <div style={{display:"flex",alignItems:"center",gap:12,background:C.blueXL,borderRadius:12,padding:"10px 14px",marginBottom:14}}>
          <button onClick={()=>setCount(c=>Math.max(1,c-1))} style={{width:32,height:32,borderRadius:8,background:"#fff",border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
          <span style={{flex:1,textAlign:"center",fontSize:18,fontWeight:800,color:C.blue}}>{count}</span>
          <button onClick={()=>setCount(c=>c+1)} style={{width:32,height:32,borderRadius:8,background:"#fff",border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
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
              style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:C.blue,cursor:"pointer",fontFamily:"inherit"}}>
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
                  color:relation===r?"#fff":"#718096",transition:"all .15s"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:relation===r?"rgba(255,255,255,.7)":RELATION_COLORS[r]||"#805AD5",flexShrink:0}}/>
                {r}
              </button>
            ))}
          </div>

          {/* הוספת קטגוריה חדשה */}
          {addingCat&&(
            <div style={{marginTop:10,background:C.blueXL,borderRadius:12,padding:12}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6,fontWeight:700}}>שם הקטגוריה החדשה:</div>
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

function ReceiptModal({ tables, onClose }) {
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
          <div style={{fontSize:11,fontWeight:900,letterSpacing:2,color:C.blue,marginBottom:6}}>Sidor-IL</div>
          <div style={{fontSize:12,color:C.muted}}>שם האורח</div>
          <div style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:10}}>{res.guest.name}</div>
          <div style={{border:`3px solid ${C.text}`,borderRadius:10,padding:"10px",marginBottom:8}}>
            <div style={{fontSize:12,color:C.muted}}>שולחן מספר</div>
            <div style={{fontSize:48,fontWeight:900,lineHeight:1,color:C.blue}}>{res.num}</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>{res.table.name}</div>
          </div>
          <div style={{fontSize:11,color:C.muted}}>ברוך הבא! 🎉</div>
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

function Countdown({ date }) {
  const [time,setTime]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{const calc=()=>{const diff=new Date(date)-new Date();if(diff<=0){setTime({d:0,h:0,m:0,s:0});return;}setTime({d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)});};calc();const id=setInterval(calc,1000);return()=>clearInterval(id);},[date]);
  return(<div style={{display:"flex",gap:8,justifyContent:"center"}}>{[["d","ימים"],["h","שעות"],["m","דקות"],["s","שניות"]].map(([k,l])=>(<div key={k} style={{textAlign:"center",background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 10px",minWidth:52}}><div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1}}>{String(time[k]).padStart(2,"0")}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.7)",marginTop:2}}>{l}</div></div>))}</div>);
}

// ─── VENUE PAGE ───────────────────────────────────────────────────────────────
function VenuePage({ onBack, onOpenAuth }) {
  return(
    <div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,minHeight:"100vh"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"12px 12px"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",marginBottom:16}}>← חזרה</button>
          <h1 style={{fontSize:24,fontWeight:900,color:"#fff",marginBottom:8}}>🏢 אולמות ומפיקים</h1>
          <p style={{fontSize:14,color:"rgba(255,255,255,.75)"}}>שיתוף פעולה עם Sidor-IL</p>
        </div>
      </div>

      <div style={{padding:"24px 20px",maxWidth:640,margin:"0 auto"}}>
        {/* מה אנחנו מציעים */}
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:16}}>מה אנחנו מציעים?</div>
        {[
          {icon:"🪑",title:"מערכת הושבה מתקדמת",desc:"ניהול מלא של סידורי הושבה לכל אירוע  -  ממשק גרירה, מפה אינטראקטיבית ופתק הושבה."},
          {icon:"✅",title:"אישורי הגעה דיגיטליים",desc:"שליחת הזמנות דיגיטליות ואישורי הגעה בוואטסאפ ו-SMS לכל האורחים."},
          {icon:"💳",title:"מתנות באשראי",desc:"מערכת תשלומים דיגיטלית לקבלת מתנות מהאורחים  -  מאובטח ומהיר."},
          {icon:"📊",title:"לוח בקרה לאולמות",desc:"ניהול אירועים מרובים במקביל מלוח בקרה מרכזי אחד  -  חיסכון בזמן ובכסף."},
          {icon:"🏷️",title:"White Label",desc:"המערכת תופיע תחת המותג שלך  -  הלוגו, הצבעים והשם שלך."},
        ].map((item,i)=>(
          <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",marginBottom:12,display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{width:44,height:44,borderRadius:12,background:C.blueXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{item.icon}</div>
            <div>
              <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:4}}>{item.title}</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{item.desc}</div>
            </div>
          </div>
        ))}

        {/* צור קשר */}
        <div style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,borderRadius:20,padding:"24px 20px",marginTop:8,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"12px 12px"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:6}}>מעוניינים בשיתוף פעולה?</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.75)",marginBottom:20,lineHeight:1.6}}>צרו איתנו קשר ונשמח לספר לכם על החבילות המיוחדות לאולמות ומפיקי אירועים.</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <a href="https://wa.me/972526817102?text=שלום, אני מעוניין לשמוע על שיתוף פעולה עם Sidor-IL" target="_blank" rel="noopener"
                style={{background:"#25D366",color:"#fff",borderRadius:12,padding:"13px 20px",fontSize:15,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                שלח הודעה בוואטסאפ
              </a>
              <a href="mailto:info@sidor-il.co.il?subject=שיתוף פעולה עם Sidor-IL"
                style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"2px solid rgba(255,255,255,.3)",borderRadius:12,padding:"12px 20px",fontSize:15,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
                ✉️ שלח מייל
              </a>
              <div style={{textAlign:"center",color:"rgba(255,255,255,.6)",fontSize:13,marginTop:4}}>
                📞 052-681-7102 · א׳-ה׳ 9:00-17:00
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HAMBURGER MENU ───────────────────────────────────────────────────────────
function HamburgerMenu({ onOpenAuth, onClose, onVenuePage, onLogout }) {
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
              <div style={{fontSize:10,color:"rgba(255,255,255,.65)",marginTop:2}}>סידורי הושבה חכמים</div>
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
          <a href="https://wa.me/972526817102" style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none",color:C.muted,fontSize:12,fontWeight:600}}>
            <span style={{fontSize:15}}>💬</span> לחץ לצ'אט ב-WhatsApp
          </a>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>📞 052-681-7102 · א׳-ה׳ 9:00-17:00</div>
        </div>
      </div>
    </>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
// ─── ACCESSIBILITY WIDGET ────────────────────────────────────────────────────
function AccessibilityWidget() {
  const [open,setOpen]=useState(false);
  const [settings,setSettings]=useState({
    fontSize:0,      // -1, 0, 1, 2
    contrast:false,  // ניגודיות גבוהה
    grayscale:false, // גווני אפור
    bigCursor:false, // סמן גדול
    stopAnim:false,  // עצור אנימציות
    dyslexia:false,  // גופן דיסלקציה
    highlight:false, // הדגש קישורים
    underline:false, // קו תחתי לקישורים
  });

  useEffect(()=>{
    const r=document.documentElement;
    // גודל טקסט
    const base=16;
    r.style.fontSize=(base+settings.fontSize*2)+"px";
    // ניגודיות
    document.body.style.filter=[
      settings.contrast?"contrast(150%)":"",
      settings.grayscale?"grayscale(100%)":"",
    ].filter(Boolean).join(" ")||"none";
    // אנימציות
    const style=document.getElementById("a11y-style")||document.createElement("style");
    style.id="a11y-style";
    style.textContent=[
      settings.stopAnim?"*{animation:none!important;transition:none!important;}":"",
      settings.dyslexia?"*{font-family:'Arial',sans-serif!important;letter-spacing:.05em!important;word-spacing:.1em!important;line-height:1.8!important;}":"",
      settings.highlight?"a,button{outline:3px solid #FFD700!important;outline-offset:2px!important;}":"",
      settings.underline?"a{text-decoration:underline!important;}":"",
      settings.bigCursor?"*{cursor:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='4' cy='4' r='3' fill='black'/%3E%3C/svg%3E\") 4 4,auto!important;}":"",
    ].join("\n");
    document.head.appendChild(style);
  },[settings]);

  const toggle=(key)=>setSettings(s=>({...s,[key]:!s[key]}));
  const reset=()=>setSettings({fontSize:0,contrast:false,grayscale:false,bigCursor:false,stopAnim:false,dyslexia:false,highlight:false,underline:false});

  const BtnOpt=({icon,label,active,onClick})=>(
    <button onClick={onClick}
      style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:active?"#3A2464":"#F7FAFC",color:active?"#fff":"#1A202C",border:`2px solid ${active?"#3A2464":"#E2E8F0"}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600,textAlign:"right",transition:"all .15s"}}>
      <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {active&&<span style={{fontSize:11,background:"rgba(255,255,255,.25)",borderRadius:4,padding:"2px 6px"}}>פעיל</span>}
    </button>
  );

  return(
    <>
      {/* כפתור צף */}
      <button onClick={()=>setOpen(o=>!o)} aria-label="תפריט נגישות"
        style={{position:"fixed",bottom:24,left:24,zIndex:9999,width:52,height:52,borderRadius:"50%",background:"#3A2464",color:"#fff",border:"3px solid #fff",boxShadow:"0 4px 20px rgba(91,60,140,.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
        ♿
      </button>

      {/* פאנל */}
      {open&&(
        <div style={{position:"fixed",bottom:86,left:24,zIndex:9998,background:"#fff",borderRadius:18,boxShadow:"0 8px 40px rgba(0,0,0,.18)",width:280,direction:"rtl",overflow:"hidden",border:"2px solid #E2E8F0"}}>
          {/* כותרת */}
          <div style={{background:"#3A2464",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#fff",fontWeight:800,fontSize:15}}>♿ נגישות</div>
              <div style={{color:"rgba(255,255,255,.7)",fontSize:11,marginTop:2}}>תקן ישראלי 5568</div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>

          <div style={{padding:"14px 12px",maxHeight:420,overflowY:"auto"}}>
            {/* גודל טקסט */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>גודל טקסט</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={()=>setSettings(s=>({...s,fontSize:Math.max(-1,s.fontSize-1)}))}
                  style={{flex:1,background:"#F7FAFC",border:"2px solid #E2E8F0",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:16,fontWeight:700}}>A−</button>
                <span style={{flex:1,textAlign:"center",fontSize:13,fontWeight:600,color:"#2D3748"}}>{["קטן","רגיל","גדול","גדול מאוד"][settings.fontSize+1]}</span>
                <button onClick={()=>setSettings(s=>({...s,fontSize:Math.min(2,s.fontSize+1)}))}
                  style={{flex:1,background:"#F7FAFC",border:"2px solid #E2E8F0",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:18,fontWeight:700}}>A+</button>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <BtnOpt icon="🌑" label="ניגודיות גבוהה" active={settings.contrast} onClick={()=>toggle("contrast")}/>
              <BtnOpt icon="⬛" label="גווני אפור" active={settings.grayscale} onClick={()=>toggle("grayscale")}/>
              <BtnOpt icon="⏸" label="עצור אנימציות" active={settings.stopAnim} onClick={()=>toggle("stopAnim")}/>
              <BtnOpt icon="📖" label="גופן לדיסלקציה" active={settings.dyslexia} onClick={()=>toggle("dyslexia")}/>
              <BtnOpt icon="🔗" label="הדגש קישורים" active={settings.highlight} onClick={()=>toggle("highlight")}/>
              <BtnOpt icon="_" label="קו תחתי לקישורים" active={settings.underline} onClick={()=>toggle("underline")}/>
              <BtnOpt icon="🖱" label="סמן גדול" active={settings.bigCursor} onClick={()=>toggle("bigCursor")}/>
            </div>
          </div>

          {/* אפס */}
          <div style={{padding:"10px 12px",borderTop:"1px solid #E2E8F0"}}>
            <button onClick={reset} style={{width:"100%",background:"#FFF5F5",color:"#C53030",border:"2px solid #FED7D7",borderRadius:10,padding:"9px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              🔄 אפס הכל
            </button>
          </div>

          {/* תחתית  -  מידע */}
          <div style={{padding:"8px 12px",background:"#F7FAFC",borderTop:"1px solid #E2E8F0",fontSize:10,color:"#aaa",textAlign:"center"}}>
            אתר זה עומד בתקן WCAG 2.1 AA
          </div>
        </div>
      )}
    </>
  );
}

// ─── LANDING ─────────────────────────────────────────────────────────────────
const LP={ink:"#2B1D3F",muted:"#6E6585",rose:"#F0609E",coral:"#FF8A65",violet:"#9B6BFF",gold:"#E8B04A",mint:"#3CC8A0",sky:"#5AA9FF",cream:"#FFFBF7",lav:"#F4EEFF"};
const LANDING_CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes pulse{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}
  @keyframes shine{0%{transform:translateX(120%) skewX(-20deg)}60%,100%{transform:translateX(-220%) skewX(-20deg)}}
  @keyframes seatIn{0%,6%{fill:#ECE6F5}16%,90%{fill:var(--c)}100%{fill:#ECE6F5}}
  @keyframes dragGuest{0%,10%{transform:translate(0,0) rotate(-4deg);opacity:0}18%{opacity:1}55%{transform:translate(-178px,96px) rotate(3deg);opacity:1}64%,100%{transform:translate(-178px,96px) scale(.4);opacity:0}}
  @keyframes toastIn{0%,58%{opacity:0;transform:translateY(10px) scale(.95)}64%,92%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-6px)}}
  @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(50%)}}
  @keyframes blob{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-40px) scale(1.08)}66%{transform:translate(-25px,20px) scale(.95)}}
  @keyframes twinkle{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
  @keyframes bulb{0%,100%{opacity:.55}50%{opacity:1}}
  @keyframes ring{from{stroke-dashoffset:176}to{stroke-dashoffset:44}}
  @keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
  .lp a{color:inherit}
  .lp-btn{position:relative;overflow:hidden;border:none;cursor:pointer;font-family:inherit;font-weight:800;border-radius:16px;transition:transform .2s,box-shadow .25s,background .2s,border-color .2s;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
  .lp-btn:hover{transform:translateY(-3px)}
  .lp-btn:active{transform:translateY(0) scale(.98)}
  .lp-btn:focus-visible{outline:3px solid ${"#9B6BFF"};outline-offset:3px}
  .lp-primary{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF 100%);background-size:200% 100%;color:#fff;box-shadow:0 12px 30px -8px rgba(240,96,158,.6),inset 0 1px 0 rgba(255,255,255,.35);animation:gradShift 6s ease infinite;text-shadow:0 1px 2px rgba(80,20,60,.2)}
  .lp-primary:hover{box-shadow:0 20px 44px -10px rgba(240,96,158,.75),0 0 0 5px rgba(240,96,158,.14)}
  .lp-primary::after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:shine 3.2s ease-in-out infinite}
  .lp-ghost{background:#fff;color:#2B1D3F;border:1.5px solid #E6DDF5;box-shadow:0 4px 14px rgba(43,29,63,.06)}
  .lp-ghost:hover{border-color:#F0609E;color:#C2397A;box-shadow:0 10px 26px rgba(240,96,158,.18)}
  .lp-nav-link{color:#5A5070;text-decoration:none;font-size:14px;font-weight:700;padding:8px 14px;border-radius:10px;transition:all .2s}
  .lp-nav-link:hover{color:#C2397A;background:#FFEFF5}
  .lp-card{position:relative;background:#fff;border:1px solid #EFE8F7;border-radius:24px;box-shadow:0 6px 24px -10px rgba(91,60,140,.15);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .3s;overflow:hidden}
  .lp-card::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1.5px;background:linear-gradient(135deg,#FF8A65,#F0609E,#9B6BFF);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .35s;pointer-events:none}
  .lp-card:hover{transform:translateY(-8px);box-shadow:0 28px 60px -22px rgba(155,107,255,.45)}
  .lp-card:hover::before{opacity:1}
  .lp-card:hover .lp-ic{transform:scale(1.1) rotate(-6deg)}
  .lp-ic{transition:transform .35s cubic-bezier(.2,.8,.2,1)}
  .lp-ev{transition:transform .35s,box-shadow .35s}
  .lp-ev:hover img{transform:scale(1.08)}
  .lp-ev:hover{transform:translateY(-6px);box-shadow:0 26px 50px -20px rgba(240,96,158,.4)}
  .lp-grad{background:linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF,#F0609E,#FF8A65);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gradShift 7s ease infinite}
  .lp-underline{position:relative;display:inline-block}
  .lp-underline svg{position:absolute;right:0;left:0;bottom:-10px;width:100%;height:16px}
  .fu{opacity:0;transform:translateY(28px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.8,.2,1)}
  @media(max-width:960px){.lp-hero{flex-direction:column!important;text-align:center}.lp-hero p{margin-inline:auto}.lp-hero-cta{justify-content:center}.lp-plan{transform:scale(.88);margin:-24px 0}.lp-hide-sm{display:none!important}.lp-steps{grid-template-columns:1fr!important}.lp-feat{grid-template-columns:1fr 1fr!important}}
  @media(max-width:600px){.lp-feat{grid-template-columns:1fr!important}.lp-plan{transform:scale(.7);margin:-66px -60px}}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.fu{opacity:1!important;transform:none!important}}
`;

// אייקונים בקו דק (בסגנון אחיד במקום אימוג'י)
const LP_ICONS={
  map:<><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></>,
  ai:<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></>,
  users:<><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.6.1 4.6 1.8 5.3 4.9"/></>,
  check:<><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/></>,
  msg:<><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/></>,
  print:<><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></>,
};
const LpIcon=({name,color,size=26})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{LP_ICONS[name]}</svg>
);

// נצנוצים פזורים ברקע
const Sparkles=({items})=>(<>
  {items.map(([top,left,size,delay,color],i)=>(
    <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"
      style={{position:"absolute",top,left,animation:`twinkle ${2.6+i%3*.7}s ease-in-out ${delay}s infinite`,pointerEvents:"none"}}>
      <path d="M10 0C10.8 6 14 9.2 20 10C14 10.8 10.8 14 10 20C9.2 14 6 10.8 0 10C6 9.2 9.2 6 10 0Z" fill={color}/>
    </svg>
  ))}
</>);

// שרשרת נורות תלויה מעל ה-Hero
function StringLights() {
  const pts=Array.from({length:26},(_,i)=>i);
  const y=x=>30+Math.sin((x/1200)*Math.PI*3)*22+Math.sin((x/1200)*Math.PI*12)*6;
  const colors=["#E8B04A","#F0609E","#9B6BFF","#3CC8A0","#5AA9FF","#FF8A65"];
  return(
    <svg viewBox="0 0 1200 90" preserveAspectRatio="none" style={{position:"absolute",top:62,left:0,width:"100%",height:90,pointerEvents:"none"}} aria-hidden="true">
      <path d={"M0 "+y(0)+pts.map(i=>{const x=i*48;return ` L${x} ${y(x)}`;}).join("")} fill="none" stroke="#CBBFE0" strokeWidth="1.5"/>
      {pts.map(i=>{const x=i*48+24;const c=colors[i%colors.length];return(
        <g key={i} style={{animation:`bulb ${1.8+(i%4)*.5}s ease-in-out ${i*.15}s infinite`}}>
          <circle cx={x} cy={y(x)+10} r="9" fill={c} opacity=".18"/>
          <rect x={x-2.5} y={y(x)} width="5" height="5" rx="1" fill="#B8AACF"/>
          <ellipse cx={x} cy={y(x)+10} rx="4.2" ry="5.5" fill={c}/>
          <ellipse cx={x-1.3} cy={y(x)+8} rx="1.2" ry="1.8" fill="#fff" opacity=".7"/>
        </g>
      );})}
    </svg>
  );
}

// מפת אולם מאוירת ומונפשת: שולחנות שמתמלאים באורחים
function SeatingPlanDemo() {
  const tables=[
    {x:78,y:150,n:"1",c:LP.rose,d:0},{x:78,y:270,n:"2",c:LP.rose,d:.6},
    {x:382,y:150,n:"3",c:LP.sky,d:1.2},{x:382,y:270,n:"4",c:LP.sky,d:1.8},
    {x:150,y:375,n:"5",c:LP.mint,d:2.4},{x:310,y:375,n:"6",c:LP.gold,d:3},
  ];
  const chairs=10;
  return(
    <div className="lp-plan" style={{position:"relative",width:460,height:460,flexShrink:0}}>
      <div style={{position:"absolute",inset:-50,background:"radial-gradient(circle at 60% 40%,rgba(240,96,158,.28),transparent 60%),radial-gradient(circle at 30% 70%,rgba(155,107,255,.25),transparent 60%)",filter:"blur(30px)"}}/>
      <div style={{position:"relative",width:"100%",height:"100%",borderRadius:32,background:"#fff",border:"1px solid #EFE8F7",boxShadow:"0 50px 100px -40px rgba(91,60,140,.45),0 0 0 8px rgba(255,255,255,.6)",overflow:"hidden"}}>
        <svg direction="ltr" viewBox="0 0 460 460" width="460" height="460" style={{position:"absolute",inset:0}} role="img" aria-label="הדגמה של מפת הושבה באולם">
          <defs>
            <pattern id="lpDots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#E9E1F5"/></pattern>
            <pattern id="lpParquet" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#FBF3E4"/><path d="M0 0h10v10H0zM10 10h10v10H10z" fill="#F6E7CC"/>
            </pattern>
            <radialGradient id="lpCloth" cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#fff"/><stop offset="100%" stopColor="#F3EDFB"/></radialGradient>
            <linearGradient id="lpHead" x1="0" x2="1"><stop offset="0%" stopColor="#FFE3EE"/><stop offset="100%" stopColor="#EEE4FF"/></linearGradient>
            <filter id="lpSh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#5B3C8C" floodOpacity=".16"/></filter>
          </defs>
          <rect width="460" height="460" fill="url(#lpDots)"/>
          {/* כותרת המפה */}
          <text x="430" y="34" textAnchor="end" fill={LP.ink} fontSize="15" fontWeight="900" fontFamily="Heebo">מפת האולם</text>
          <text x="430" y="52" textAnchor="end" fill={LP.muted} fontSize="11" fontFamily="Heebo">חתונת נועה ואיתי · 214 אורחים</text>
          <g transform="translate(30,26)"><rect width="74" height="24" rx="12" fill="#E9FBF4"/><circle cx="14" cy="12" r="4" fill={LP.mint}/><text x="44" y="16" textAnchor="middle" fill="#1F8F6C" fontSize="11" fontWeight="800" fontFamily="Heebo">נשמר</text></g>
          {/* שולחן חתן-כלה */}
          <g filter="url(#lpSh)">
            <rect x="150" y="72" width="160" height="34" rx="17" fill="url(#lpHead)" stroke="#F3B6CF"/>
          </g>
          {Array.from({length:6}).map((_,i)=><rect key={i} x={166+i*24} y="110" width="14" height="9" rx="4" fill={LP.rose} opacity=".85"/>)}
          <text x="230" y="94" textAnchor="middle" fill="#B13B72" fontSize="12" fontWeight="900" fontFamily="Heebo">💍 שולחן חתן וכלה</text>
          {/* רחבת ריקודים */}
          <g filter="url(#lpSh)"><rect x="168" y="160" width="124" height="150" rx="18" fill="url(#lpParquet)" stroke="#EBCB8F"/></g>
          <text x="230" y="232" textAnchor="middle" fill="#A87A22" fontSize="13" fontWeight="900" fontFamily="Heebo">רחבת ריקודים</text>
          <text x="230" y="252" textAnchor="middle" fontSize="18">✨</text>
          {/* שולחנות עגולים */}
          {tables.map(t=>(
            <g key={t.n}>
              {Array.from({length:chairs}).map((_,i)=>{
                const deg=i*(360/chairs);const a=deg*Math.PI/180;
                const cx=t.x+40*Math.sin(a),cy=t.y-40*Math.cos(a);
                return <rect key={i} x="-7" y="-5" width="14" height="10" rx="4.5" transform={`translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${deg})`}
                  fill="#ECE6F5" style={{"--c":t.c,animation:`seatIn 8s ease-in-out ${t.d+i*.13}s infinite`}}/>;
              })}
              <g filter="url(#lpSh)"><circle cx={t.x} cy={t.y} r="29" fill="url(#lpCloth)" stroke={t.c} strokeOpacity=".45" strokeWidth="1.5"/></g>
              {/* סידור פרחים במרכז */}
              {[0,72,144,216,288].map(d=>{const a=d*Math.PI/180;return <circle key={d} cx={t.x+6*Math.cos(a)} cy={t.y-4+6*Math.sin(a)} r="4" fill={t.c} opacity=".55"/>;})}
              <circle cx={t.x} cy={t.y-4} r="3" fill={LP.gold}/>
              <text x={t.x} y={t.y+17} textAnchor="middle" fill={LP.ink} fontSize="10" fontWeight="900" fontFamily="Heebo">שולחן {t.n}</text>
            </g>
          ))}
          {/* מקרא */}
          <g transform="translate(30,428)" fontFamily="Heebo" fontSize="11" fontWeight="700" fill={LP.muted}>
            {[["משפחה",LP.rose],["חברים",LP.sky],["עבודה",LP.mint],["שכנים",LP.gold]].map(([l,c],i)=>(
              <g key={l} transform={`translate(${i*72},0)`}><circle cx="6" cy="-4" r="5" fill={c}/><text x="16" y="0">{l}</text></g>
            ))}
          </g>
        </svg>
        {/* אורח נגרר */}
        <div style={{position:"absolute",top:142,right:14,animation:"dragGuest 8s ease-in-out infinite",zIndex:3}}>
          <div style={{background:"#fff",color:LP.ink,borderRadius:100,padding:"6px 12px 6px 8px",fontSize:12,fontWeight:800,boxShadow:"0 12px 28px rgba(91,60,140,.3)",border:"1px solid #F3D3E2",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:7}}>
            <span style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${LP.coral},${LP.rose})`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>ר</span>
            דודה רחל
          </div>
          <div style={{fontSize:20,marginTop:-2,marginRight:8}}>👆</div>
        </div>
        {/* טוסט הצלחה */}
        <div style={{position:"absolute",bottom:52,right:20,left:20,background:"#fff",border:"1px solid #BDEFDD",borderRadius:14,padding:"10px 14px",color:"#1F8F6C",fontSize:13,fontWeight:800,display:"flex",alignItems:"center",gap:8,animation:"toastIn 8s ease infinite",boxShadow:"0 14px 30px -10px rgba(60,200,160,.5)"}}>
          <span style={{width:22,height:22,borderRadius:"50%",background:LP.mint,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✓</span>
          דודה רחל הושבה בשולחן 2 · משפחה · 9/10
        </div>
      </div>
      {/* כרטיסים צפים */}
      <div className="lp-hide-sm" style={{position:"absolute",top:-22,left:-44,background:"#fff",borderRadius:20,padding:"12px 16px",boxShadow:"0 22px 44px -14px rgba(91,60,140,.4)",animation:"float 5s ease-in-out infinite",display:"flex",alignItems:"center",gap:12,border:"1px solid #EFE8F7"}}>
        <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${LP.violet},${LP.rose})`,display:"flex",alignItems:"center",justifyContent:"center"}}><LpIcon name="ai" color="#fff" size={22}/></div>
        <div>
          <div style={{fontSize:11,color:LP.violet,fontWeight:800}}>AI סידר עכשיו</div>
          <div style={{fontSize:18,fontWeight:900,color:LP.ink,lineHeight:1.1}}>214 אורחים</div>
          <div style={{fontSize:11,color:LP.muted}}>ב-22 שולחנות · 12 שניות</div>
        </div>
      </div>
      <div className="lp-hide-sm" style={{position:"absolute",bottom:96,left:-58,background:"#fff",borderRadius:20,padding:"12px 16px",boxShadow:"0 22px 44px -14px rgba(91,60,140,.4)",animation:"float 6s ease-in-out 1s infinite",display:"flex",alignItems:"center",gap:12,border:"1px solid #EFE8F7"}}>
        <svg width="46" height="46" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#F1ECF8" strokeWidth="7"/>
          <circle cx="32" cy="32" r="28" fill="none" stroke={LP.mint} strokeWidth="7" strokeLinecap="round" strokeDasharray="176" strokeDashoffset="44" transform="rotate(-90 32 32)" style={{animation:"ring 2.2s ease-out both"}}/>
          <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="900" fill={LP.ink} fontFamily="Heebo">75%</text>
        </svg>
        <div>
          <div style={{fontSize:13,fontWeight:900,color:LP.ink}}>אישרו הגעה</div>
          <div style={{fontSize:11,color:LP.muted}}>מתעדכן בהושבה אוטומטית</div>
        </div>
      </div>
      <div className="lp-hide-sm" style={{position:"absolute",top:120,right:-40,background:"#fff",borderRadius:16,padding:"9px 13px",boxShadow:"0 18px 36px -14px rgba(91,60,140,.4)",animation:"float 5.5s ease-in-out .5s infinite",fontSize:12,fontWeight:800,color:"#C2397A",border:"1px solid #F8D6E5"}}>
        🚫 לא ליד דוד משה
      </div>
    </div>
  );
}

// איורים קטנים לשלבי "איך זה עובד"
const StepArt=({kind})=>{
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

function LandingPage({ onOpenAuth, onLogout, loggedIn=false }) {
  const [scrolled,setScrolled]=useState(false);
  const [venuePage,setVenuePage]=useState(false);

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",fn);
    return()=>window.removeEventListener("scroll",fn);
  },[]);

  useEffect(()=>{
    const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.opacity=1;x.target.style.transform="none";obs.unobserve(x.target);}});},{threshold:.12});
    const t=setTimeout(()=>document.querySelectorAll(".fu").forEach(el=>obs.observe(el)),100);
    return()=>{clearTimeout(t);obs.disconnect();};
  },[venuePage]);

  if(venuePage) return <VenuePage onBack={()=>setVenuePage(false)} onOpenAuth={onOpenAuth}/>;

  const sectionTitle=(kicker,title,accent,sub)=>(
    <div className="fu" style={{textAlign:"center",marginBottom:56}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:13,fontWeight:800,color:"#C2397A",background:"#FFEFF5",border:"1px solid #F8D6E5",borderRadius:100,padding:"6px 16px",marginBottom:18}}>✦ {kicker}</div>
      <h2 style={{fontSize:"clamp(30px,4.2vw,54px)",fontWeight:900,lineHeight:1.15,letterSpacing:"-.02em",marginBottom:16,color:LP.ink}}>
        {title} {accent&&<span className="lp-grad">{accent}</span>}
      </h2>
      {sub&&<p style={{fontSize:17,color:LP.muted,maxWidth:560,margin:"0 auto",lineHeight:1.75}}>{sub}</p>}
    </div>
  );

  const marqueeItems=[["🪑","גרירה ושחרור לשולחנות",LP.rose],["✨","סידור הושבה ב-AI",LP.violet],["👨‍👩‍👧","קיבוץ לפי משפחות וחברים",LP.sky],["🚫","הפרדה בין אורחים",LP.coral],["🖨️","כרטיסי הושבה להדפסה",LP.gold],["✅","אישורי הגעה בזמן אמת",LP.mint],["📱","מספר שולחן ב-SMS ו-WhatsApp",LP.sky],["📊","ייבוא מאקסל",LP.mint]];

  return(
    <div className="lp" dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:LP.cream,color:LP.ink,minHeight:"100vh",overflowX:"hidden"}}>
      <style>{LANDING_CSS}</style>

      {/* ─── NAV ─────────────────────────────────────────────────── */}
      <nav style={{position:"fixed",top:0,right:0,left:0,zIndex:100,height:70,display:"flex",alignItems:"center",padding:"0 5vw",gap:14,
        background:scrolled?"rgba(255,251,247,.85)":"transparent",backdropFilter:scrolled?"blur(18px) saturate(1.5)":"none",
        borderBottom:scrolled?"1px solid #F0E8F4":"1px solid transparent",boxShadow:scrolled?"0 6px 24px -14px rgba(91,60,140,.25)":"none",transition:"all .3s"}}>
        <a href="#top" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none",flexShrink:0}}>
          <svg width="40" height="40" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <defs><linearGradient id="lpLogo" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF8A65"/><stop offset="55%" stopColor="#F0609E"/><stop offset="100%" stopColor="#9B6BFF"/></linearGradient></defs>
            <circle cx="18" cy="18" r="17" fill="url(#lpLogo)"/>
            <circle cx="18" cy="18" r="7.5" fill="rgba(255,255,255,.3)" stroke="#fff" strokeWidth="1.5"/>
            {[0,60,120,180,240,300].map((deg,i)=>{const rad=deg*Math.PI/180;return <circle key={i} cx={18+12.5*Math.cos(rad)} cy={18+12.5*Math.sin(rad)} r="2.6" fill="#fff"/>;})}
          </svg>
          <span style={{fontWeight:900,fontSize:21,letterSpacing:"-.02em"}}>Sidor-IL</span>
        </a>
        <div className="lp-hide-sm" style={{display:"flex",gap:2,marginRight:18}}>
          {[["#how","איך זה עובד"],["#features","יכולות"],["#events","סוגי אירועים"],["#pricing","מחירים"]].map(([h,l])=>(
            <a key={h} href={h} className="lp-nav-link">{l}</a>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button className="lp-btn lp-ghost" onClick={()=>onOpenAuth("login")} style={{padding:"9px 20px",fontSize:14}}>{loggedIn?"האירועים שלי":"כניסה"}</button>
        <button className="lp-btn lp-primary" onClick={()=>onOpenAuth("register")} style={{padding:"10px 20px",fontSize:14}}>התחילו להושיב</button>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section id="top" style={{minHeight:"100vh",display:"flex",alignItems:"center",position:"relative",overflow:"hidden",padding:"150px 6vw 90px",
        background:"linear-gradient(180deg,#FFF4EE 0%,#FFF7FB 45%,#FFFBF7 100%)"}}>
        <div style={{position:"absolute",top:"-8%",right:"-6%",width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,96,158,.22),transparent 65%)",animation:"blob 16s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"-10%",left:"-8%",width:560,height:560,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,107,255,.2),transparent 65%)",animation:"blob 20s ease-in-out 2s infinite"}}/>
        <div style={{position:"absolute",top:"30%",left:"35%",width:340,height:340,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,176,74,.16),transparent 65%)",animation:"blob 18s ease-in-out 4s infinite"}}/>
        <StringLights/>
        <Sparkles items={[["22%","6%",18,0,LP.gold],["70%","44%",14,.8,LP.rose],["30%","52%",12,1.4,LP.violet],["82%","12%",20,.4,LP.coral],["18%","88%",14,1.1,LP.violet],["60%","92%",12,.2,LP.gold]]}/>

        <div className="lp-hero" style={{maxWidth:1200,margin:"0 auto",width:"100%",display:"flex",alignItems:"center",gap:"5vw",position:"relative",zIndex:2}}>
          <div style={{flex:1,minWidth:280,animation:"fadeUp .9s ease both"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"#fff",border:"1px solid #F0E3EF",borderRadius:100,padding:"7px 16px 7px 10px",marginBottom:26,boxShadow:"0 6px 20px -8px rgba(240,96,158,.35)"}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:LP.mint,display:"inline-block",animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:13,color:"#5A5070",fontWeight:700}}>🪑 מערכת סידורי ההושבה החכמה לאירועים</span>
            </div>

            <h1 style={{fontSize:"clamp(44px,6vw,84px)",fontWeight:900,lineHeight:1.04,letterSpacing:"-.035em",marginBottom:26,color:LP.ink}}>
              כל אורח.<br/>
              <span className="lp-underline"><span className="lp-grad">במקום הנכון.</span>
                <svg viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true"><path d="M4 11 C 80 2, 200 2, 296 9" stroke="url(#lpUl)" strokeWidth="5" fill="none" strokeLinecap="round"/><defs><linearGradient id="lpUl"><stop offset="0%" stopColor="#9B6BFF"/><stop offset="100%" stopColor="#FF8A65"/></linearGradient></defs></svg>
              </span>
            </h1>

            <p style={{fontSize:"clamp(16px,1.5vw,19px)",color:LP.muted,lineHeight:1.85,marginBottom:34,maxWidth:520}}>
              סידור ההושבה הוא החלק הכי מלחיץ בתכנון האירוע  -  עד עכשיו.
              גוררים אורחים לשולחנות על מפת האולם, נותנים ל-AI לסדר לפי משפחות וחברים,
              ושולחים לכל אורח את מספר השולחן שלו. <b style={{color:LP.ink}}>בלי אקסלים, בלי ויכוחים.</b>
            </p>

            <div className="lp-hero-cta" style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:40}}>
              <button className="lp-btn lp-primary" onClick={()=>onOpenAuth("register")} style={{padding:"18px 36px",fontSize:17}}>
                סדרו את האולם בחינם ←
              </button>
              <a href="#how" className="lp-btn lp-ghost" style={{padding:"18px 28px",fontSize:16}}>
                <span style={{width:26,height:26,borderRadius:"50%",background:"#FFEFF5",color:LP.rose,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10}}>▶</span>
                איך זה עובד
              </a>
            </div>

            <div className="lp-hero-cta" style={{display:"flex",gap:22,flexWrap:"wrap"}}>
              {[["ai","דקות","לסידור כל האולם",LP.violet,"#F1EAFF"],["check","0 ₪","להתחלה",LP.mint,"#E9FBF4"],["users","עברית","מותאם לאירועים בישראל",LP.rose,"#FFEFF5"]].map(([ic,big,small,c,bg])=>(
                <div key={small} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:44,height:44,borderRadius:14,background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}><LpIcon name={ic} color={c} size={22}/></div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:900}}>{big}</div>
                    <div style={{fontSize:12,color:LP.muted}}>{small}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SeatingPlanDemo/>
        </div>
      </section>

      {/* ─── MARQUEE ─────────────────────────────────────────────── */}
      <div style={{overflow:"hidden",padding:"22px 0",background:"#fff",borderTop:"1px solid #F3ECF5",borderBottom:"1px solid #F3ECF5"}} aria-hidden="true">
        <div style={{display:"flex",gap:14,width:"max-content",animation:"marquee 38s linear infinite"}}>
          {[...marqueeItems,...marqueeItems].map(([ic,t,c],i)=>(
            <span key={i} style={{fontSize:15,fontWeight:800,color:LP.ink,whiteSpace:"nowrap",background:c+"14",border:`1px solid ${c}33`,borderRadius:100,padding:"9px 18px",display:"inline-flex",alignItems:"center",gap:8}}>{ic} {t}</span>
          ))}
        </div>
      </div>

      {/* ─── HOW ─────────────────────────────────────────────────── */}
      <section id="how" style={{padding:"110px 6vw",position:"relative"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          {sectionTitle("איך זה עובד","מרשימת מוזמנים לאולם מסודר","ב-3 צעדים","בלי לשבור את הראש מי יושב ליד מי. אתם מחליטים, המערכת עושה את העבודה.")}
          <div className="lp-steps" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,position:"relative"}}>
            {[
              [1,"מעלים את המוזמנים","מייבאים מאקסל או מוסיפים ידנית, ומסמנים קבוצות: משפחה קרובה, חברים מהצבא, עבודה...",LP.rose],
              [2,"מסדרים את השולחנות","בונים את מפת האולם, גוררים אורחים לשולחנות  -  או לוחצים על AI ומקבלים סידור מלא תוך שניות.",LP.violet],
              [3,"האורחים יודעים איפה לשבת","שולחים לכל אורח את מספר השולחן ב-SMS או WhatsApp, ומדפיסים כרטיסי הושבה לכניסה.",LP.mint],
            ].map(([n,t,d,c],i)=>(
              <div key={n} className="lp-card fu" style={{padding:"26px 26px 30px",transitionDelay:`${i*.12}s`}}>
                <div style={{background:`linear-gradient(160deg,${c}12,#fff 70%)`,borderRadius:18,margin:"-6px -6px 4px",padding:"6px 6px 0"}}>
                  <StepArt kind={n}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{width:32,height:32,borderRadius:10,background:c,color:"#fff",fontWeight:900,fontSize:15,display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 14px -4px ${c}`}}>{n}</span>
                  <div style={{fontSize:19,fontWeight:900}}>{t}</div>
                </div>
                <div style={{fontSize:15,color:LP.muted,lineHeight:1.75}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────── */}
      <section id="features" style={{padding:"100px 6vw 110px",position:"relative",background:"linear-gradient(180deg,#FFFBF7,#F8F3FF 50%,#FFFBF7)"}}>
        <Sparkles items={[["8%","10%",16,0,LP.violet],["14%","86%",14,.6,LP.gold],["88%","50%",12,1,LP.rose]]}/>
        <div style={{maxWidth:1120,margin:"0 auto",position:"relative"}}>
          {sectionTitle("היכולות","כל מה שצריך להושבה","מושלמת","כלים שנבנו במיוחד לחתונות, בר מצוות ואירועים גדולים.")}
          <div className="lp-feat" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:22}}>
            {[
              {icon:"map",c:LP.rose,title:"מפת אולם אינטראקטיבית",desc:"שולחנות עגולים, מרובעים ושולחן אבירים. גוררים, מזיזים ורואים בזמן אמת כמה מקומות נשארו.",tag:"הכי פופולרי"},
              {icon:"ai",c:LP.violet,title:"סידור הושבה ב-AI",desc:"כותבים העדפות בשפה חופשית  -  \"סבתא ליד הרחבה, החברים מהעבודה ביחד\"  -  וה-AI מסדר את כולם.",tag:"חדש"},
              {icon:"users",c:LP.sky,title:"קבוצות וצבעים",desc:"כל קבוצת אורחים בצבע משלה, כך שרואים במבט אחד שמשפחה יושבת יחד וחברים ליד חברים."},
              {icon:"check",c:LP.mint,title:"אישורי הגעה מחוברים להושבה",desc:"מי שאישר נכנס לסידור, מי שביטל משחרר מקום. ההושבה תמיד מעודכנת למספרים האמיתיים."},
              {icon:"msg",c:LP.coral,title:"מספר שולחן לכל אורח",desc:"הודעה אישית ב-SMS או WhatsApp עם שם האורח ומספר השולחן שלו. בלי תורים בכניסה."},
              {icon:"print",c:LP.gold,title:"כרטיסי הושבה וקבלה",desc:"מפיקים רשימות לכל שולחן וכרטיסי הושבה להדפסה, מוכנים לעמדת הקבלה באולם."},
            ].map((f,i)=>(
              <div key={f.title} className="lp-card fu" style={{padding:"30px 26px",transitionDelay:`${i*.07}s`}}>
                <div style={{position:"absolute",top:-40,left:-40,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${f.c}22,transparent 70%)`,pointerEvents:"none"}}/>
                {f.tag&&<span style={{position:"absolute",top:20,left:20,background:f.c+"18",border:`1px solid ${f.c}55`,color:f.c,fontSize:11,fontWeight:900,borderRadius:100,padding:"3px 11px"}}>{f.tag}</span>}
                <div className="lp-ic" style={{width:58,height:58,borderRadius:18,background:`linear-gradient(135deg,${f.c}26,${f.c}0D)`,border:`1px solid ${f.c}33`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
                  <LpIcon name={f.icon} color={f.c} size={28}/>
                </div>
                <div style={{fontSize:18,fontWeight:900,marginBottom:10}}>{f.title}</div>
                <div style={{fontSize:14.5,color:LP.muted,lineHeight:1.75}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EVENTS ──────────────────────────────────────────────── */}
      <section id="events" style={{padding:"100px 6vw"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          {sectionTitle("לכל אירוע","איזה רגע מיוחד","אתם מושיבים?","מ-50 אורחים בברית ועד 600 בחתונה  -  Sidor-IL מסדרת את כולם.")}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:22}}>
            {[
              {emoji:"💍",title:"חתונות",desc:"צד חתן, צד כלה, חברים והורים  -  כל אחד בשולחן הנכון",img:"https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80",c:LP.rose},
              {emoji:"✡️",title:"בר/ת מצווה",desc:"שולחן ילדים, שולחן משפחה ושולחן חברי ההורים בקליק",img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500&q=80",c:LP.sky},
              {emoji:"👶",title:"בריתות",desc:"הושבה מהירה גם כשיש רק כמה ימים להתארגן",img:"https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500&q=80",c:LP.mint},
              {emoji:"💼",title:"אירועים עסקיים",desc:"הושבה לפי מחלקות, VIP ולקוחות  -  מקצועי ומדויק",img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80",c:LP.violet},
            ].map((ev,i)=>(
              <button key={ev.title} className="lp-ev fu" onClick={()=>onOpenAuth("register")}
                style={{transitionDelay:`${i*.1}s`,borderRadius:24,overflow:"hidden",border:"1px solid #EFE8F7",cursor:"pointer",background:"#fff",textAlign:"right",fontFamily:"inherit",color:LP.ink,padding:0,boxShadow:"0 8px 26px -14px rgba(91,60,140,.25)"}}>
                <div style={{height:200,overflow:"hidden",position:"relative"}}>
                  <img src={ev.img} alt={ev.title} loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .6s ease"}}/>
                  <div style={{position:"absolute",inset:0,background:`linear-gradient(to top,${ev.c}55,transparent 55%)`}}/>
                  <div style={{position:"absolute",bottom:12,right:12,background:"rgba(255,255,255,.92)",backdropFilter:"blur(6px)",borderRadius:100,padding:"6px 14px",fontSize:15,fontWeight:900}}>{ev.emoji} {ev.title}</div>
                </div>
                <div style={{padding:"16px 18px 20px"}}>
                  <p style={{fontSize:14,color:LP.muted,lineHeight:1.6,marginBottom:12}}>{ev.desc}</p>
                  <span style={{fontSize:14,color:ev.c,fontWeight:900}}>התחילו להושיב ←</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" style={{padding:"100px 6vw",background:"linear-gradient(180deg,#FFFBF7,#FFF3F7 50%,#FFFBF7)"}}>
        <div style={{maxWidth:1020,margin:"0 auto"}}>
          {sectionTitle("מחירים","מחירים","שקופים","מתחילים בחינם, משדרגים כשהאירוע מתקרב.")}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:22,alignItems:"stretch"}}>
            {[
              {name:"חינם",price:"₪0",desc:"תמיד",features:["הזמנה דיגיטלית","שיתוף ידני של הקישור"],cta:"התחילו בחינם",highlight:false,c:LP.sky},
              {name:"מתקדמת",price:"₪150",desc:"לאירוע",features:["כל מה שבבסיסית","מפת סידורי הושבה מלאה","סידור הושבה ב-AI","ייבוא מוזמנים מאקסל"],cta:"אני רוצה הושבה מושלמת",highlight:true,c:LP.rose},
              {name:"בסיסית",price:"₪50",desc:"לאירוע",features:["כל מה שבחינם","אישורי הגעה","WhatsApp אישי"],cta:"בחירה בבסיסית",highlight:false,c:LP.mint},
            ].map((pkg,i)=>(
              <div key={pkg.name} className="lp-card fu"
                style={{transitionDelay:`${i*.1}s`,borderRadius:28,padding:"38px 30px",display:"flex",flexDirection:"column",overflow:"visible",
                  ...(pkg.highlight?{background:"linear-gradient(170deg,#fff,#FFF2F8)",border:"2px solid #F7B7D3",boxShadow:"0 34px 80px -30px rgba(240,96,158,.55)"}:{})}}>
                {pkg.highlight&&<div style={{position:"absolute",top:-15,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",fontSize:12,fontWeight:900,borderRadius:100,padding:"6px 18px",whiteSpace:"nowrap",boxShadow:"0 8px 20px -6px rgba(240,96,158,.6)"}}>⭐ הכי משתלם להושבה</div>}
                <div style={{fontSize:15,fontWeight:900,color:pkg.c,marginBottom:10}}>{pkg.name}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                  <span style={{fontSize:52,fontWeight:900,lineHeight:1,color:LP.ink}}>{pkg.price}</span>
                  <span style={{fontSize:14,color:LP.muted}}>{pkg.desc}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12,margin:"26px 0 30px",flex:1}}>
                  {pkg.features.map(f=>(
                    <div key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:15,color:"#4A4060"}}>
                      <span style={{width:22,height:22,borderRadius:"50%",background:pkg.c+"1F",color:pkg.c,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <button onClick={()=>onOpenAuth("register")} className={`lp-btn ${pkg.highlight?"lp-primary":"lp-ghost"}`} style={{width:"100%",padding:"15px",fontSize:15}}>
                  {pkg.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section id="contact" style={{padding:"70px 6vw 110px"}}>
        <div className="fu" style={{maxWidth:1060,margin:"0 auto",borderRadius:36,padding:"70px 30px",textAlign:"center",position:"relative",overflow:"hidden",
          background:"linear-gradient(120deg,#FF9A76 0%,#F0609E 50%,#9B6BFF 100%)",boxShadow:"0 40px 100px -34px rgba(240,96,158,.7)"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,.25) 1.5px,transparent 1.5px)",backgroundSize:"22px 22px",opacity:.6}}/>
          {/* שולחנות מאוירים בצדדים */}
          <svg className="lp-hide-sm" viewBox="0 0 120 120" width="150" height="150" style={{position:"absolute",top:20,right:24,opacity:.35,animation:"float 6s ease-in-out infinite"}} aria-hidden="true">
            {Array.from({length:8}).map((_,i)=>{const d=i*45,a=d*Math.PI/180;return <rect key={i} x="-8" y="-6" width="16" height="12" rx="5" transform={`translate(${(60+42*Math.sin(a)).toFixed(1)},${(60-42*Math.cos(a)).toFixed(1)}) rotate(${d})`} fill="#fff"/>;})}
            <circle cx="60" cy="60" r="28" fill="#fff"/>
          </svg>
          <svg className="lp-hide-sm" viewBox="0 0 120 120" width="120" height="120" style={{position:"absolute",bottom:20,left:30,opacity:.3,animation:"float 7s ease-in-out 1s infinite"}} aria-hidden="true">
            {Array.from({length:8}).map((_,i)=>{const d=i*45,a=d*Math.PI/180;return <rect key={i} x="-8" y="-6" width="16" height="12" rx="5" transform={`translate(${(60+42*Math.sin(a)).toFixed(1)},${(60-42*Math.cos(a)).toFixed(1)}) rotate(${d})`} fill="#fff"/>;})}
            <circle cx="60" cy="60" r="28" fill="#fff"/>
          </svg>
          <Sparkles items={[["14%","30%",18,0,"#fff"],["70%","70%",14,.8,"#fff"],["24%","78%",12,1.3,"#FFE7A8"]]}/>
          <div style={{position:"relative",zIndex:1,color:"#fff"}}>
            <h2 style={{fontSize:"clamp(30px,4.6vw,58px)",fontWeight:900,marginBottom:16,letterSpacing:"-.02em",lineHeight:1.1,textShadow:"0 2px 12px rgba(120,30,90,.2)"}}>
              הגיע הזמן להושיב את כולם 🪑
            </h2>
            <p style={{fontSize:18,color:"rgba(255,255,255,.95)",marginBottom:36,lineHeight:1.7,maxWidth:560,marginInline:"auto"}}>
              פותחים אירוע בחינם, מעלים את המוזמנים, ותוך כמה דקות יש לכם סידור הושבה שכולם יאהבו.
            </p>
            <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={()=>onOpenAuth("register")} className="lp-btn" style={{background:"#fff",color:"#C2397A",padding:"18px 40px",fontSize:18,boxShadow:"0 16px 40px rgba(90,20,70,.3)"}}>
                🚀 צרו סידור הושבה עכשיו
              </button>
              <a href="https://wa.me/972526817102" target="_blank" rel="noopener noreferrer" className="lp-btn"
                style={{background:"rgba(255,255,255,.18)",color:"#fff",border:"1.5px solid rgba(255,255,255,.7)",padding:"18px 30px",fontSize:16,backdropFilter:"blur(6px)"}}>
                💬 דברו איתנו
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{borderTop:"1px solid #EFE6F5",padding:"48px 6vw 32px",background:"#F8F3FF"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:40,marginBottom:40}}>
            <div style={{maxWidth:320}}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
                <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#FF8A65,#F0609E,#9B6BFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff"}}>◈</div>
                <span style={{fontWeight:900,fontSize:18}}>Sidor-IL</span>
              </div>
              <p style={{fontSize:14,color:LP.muted,lineHeight:1.8}}>פלטפורמה ישראלית לסידורי הושבה חכמים, אישורי הגעה והזמנות דיגיטליות. בנויה עבור זוגות, משפחות ומפיקי אירועים.</p>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:900,marginBottom:14}}>צור קשר</div>
              <div style={{display:"flex",flexDirection:"column",gap:9,fontSize:14,color:LP.muted}}>
                <div>📍 השושנים 30, נוף הגליל</div>
                <a href="https://wa.me/972526817102" target="_blank" rel="noopener noreferrer" style={{color:"#1FA855",textDecoration:"none",fontWeight:800}}>💬 WhatsApp</a>
                <a href="tel:0526817102" style={{textDecoration:"none"}}>📞 052-681-7102</a>
              </div>
            </div>
          </div>
          <div style={{borderTop:"1px solid #E9DFF3",paddingTop:20,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,fontSize:13,color:LP.muted,alignItems:"center"}}>
            <span>© {new Date().getFullYear()} Sidor-IL · כל הזכויות שמורות</span>
            <a href="#/privacy" style={{textDecoration:"none"}}>מדיניות פרטיות</a>
            <span>🇮🇱 מערכת ישראלית · נבנתה עם ❤️</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/972526817102" target="_blank" rel="noopener noreferrer" aria-label="צ'אט בוואטסאפ"
        style={{position:"fixed",bottom:88,left:24,background:"#25D366",color:"#fff",borderRadius:50,padding:"12px 20px",display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,boxShadow:"0 8px 24px rgba(37,211,102,.45)",zIndex:99,textDecoration:"none"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        לחץ לצ'אט
      </a>
    </div>
  );
}


const AUTH_ERRORS={
  "Invalid login credentials":"❌ אימייל או סיסמה שגויים",
  "Email not confirmed":"📧 המייל עדיין לא אומת  -  בדקו את תיבת הדואר (וגם בספאם)",
  "User already registered":"⚠️ המייל הזה כבר רשום  -  נסו להיכנס או לשחזר סיסמה",
  "Password should be at least 6 characters":"❌ הסיסמה חייבת להכיל לפחות 6 תווים",
  "Unable to validate email address: invalid format":"❌ כתובת המייל לא תקינה",
  "Email rate limit exceeded":"⏳ נשלחו יותר מדי מיילים  -  נסו שוב בעוד כמה דקות",
};
const AUTH_DOWN="⚠️ שרת ההתחברות לא זמין כרגע. נסו שוב בעוד כמה דקות, ואם זה ממשיך  -  צרו קשר בוואטסאפ.";
// שגיאות רשת (השרת לא עונה) מגיעות בלי הודעה ברורה  -  מציגים הודעה מובנת
const authErrorText=e=>{
  if(!e)return "";
  if(e.name==="AuthRetryableFetchError"||e.status===0||/fetch|network|load failed/i.test(e.message||""))return AUTH_DOWN;
  return AUTH_ERRORS[e.message]||("❌ "+e.message);
};
// בדיקה מהירה שהשרת זמין לפני מעבר לעמוד של Google (אחרת הדפדפן נתקע בדף שגיאה)
const authServerUp=async()=>{
  try{const r=await fetch(`${SUPABASE_URL}/auth/v1/health`,{headers:{apikey:SUPABASE_KEY}});return r.ok;}
  catch{return false;}
};

function AuthDrawer({ mode:initMode, onClose, onAuth }) {
  const [mode,setMode]=useState(initMode);
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [load,setLoad]=useState(false);
  const [googleLoad,setGoogleLoad]=useState(false);
  const [resetSent,setResetSent]=useState(false);

  const submit=async()=>{
    setErr("");setLoad(true);
    try{
      if(mode==="reset"){
        const{error}=await sb.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin});
        if(error)throw error;
        setResetSent(true);
      } else if(mode==="login"){
        const{data,error}=await sb.auth.signInWithPassword({email:email.trim(),password:pass});
        if(error)throw error;
        onAuth(data.user);
      } else {
        if(pass.length<6)throw new Error("Password should be at least 6 characters");
        const{data,error}=await sb.auth.signUp({email:email.trim(),password:pass,options:{emailRedirectTo:window.location.origin}});
        if(error)throw error;
        // Supabase מחזיר משתמש בלי identities כשהמייל כבר רשום
        if(data.user&&data.user.identities?.length===0)throw new Error("User already registered");
        if(!data.session)setErr("✅ נשלח מייל אימות! לחצו על הקישור במייל כדי להפעיל את החשבון.");
        else onAuth(data.user);
      }
    }catch(e){
      setErr(authErrorText(e));
    }
    setLoad(false);
  };

  const loginWithGoogle=async()=>{
    setGoogleLoad(true);setErr("");
    if(!(await authServerUp())){setErr(AUTH_DOWN);setGoogleLoad(false);return;}
    const{error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
    if(error){setErr(authErrorText(error));setGoogleLoad(false);}
  };

  return(<>
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)"}}/>
    <div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:201,background:C.surface,borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",maxWidth:480,margin:"0 auto",animation:"slideUp .3s ease both",direction:"rtl"}}>
      <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 24px"}}/>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:58,height:58,borderRadius:18,background:"linear-gradient(135deg,#F5C46B,#E2588F,#8A4BFF)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:10,boxShadow:"0 10px 28px rgba(226,88,143,.4)"}}>🪑</div>
        <div style={{fontWeight:900,fontSize:22,color:C.text}}>{mode==="register"?"בואו נושיב את כולם":"ברוכים השבים"}</div>
        <div style={{fontSize:13,color:C.muted,marginTop:4}}>{mode==="register"?"פותחים חשבון בחינם ומתחילים לסדר את האולם":"היכנסו כדי להמשיך בסידור ההושבה"}</div>
      </div>

      {/* שחזור סיסמה */}
      {mode==="reset"?(
        <div>
          {resetSent?(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:40,marginBottom:12}}>📧</div>
              <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:8}}>נשלח מייל לשחזור!</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:20}}>בדוק את תיבת הדואר שלך ולחץ על הקישור לאיפוס הסיסמה.</div>
              <button onClick={()=>{setMode("login");setResetSent(false);}} style={{background:C.blueXL,color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>חזרה לכניסה</button>
            </div>
          ):(
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:6}}>שחזור סיסמה</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:16}}>הכנס את המייל שלך ונשלח לך קישור לאיפוס.</div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="אימייל"
                style={{background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",marginBottom:12}}/>
              {err&&<div style={{background:"#FEF2F2",border:`1px solid ${C.danger}30`,borderRadius:12,padding:"10px 14px",fontSize:13,color:C.danger,marginBottom:12}}>{err}</div>}
              <Btn primary full onClick={submit} disabled={load||!email}>{load?<><Spinner size={18} color="#fff"/>שולח...</>:"שלח קישור לאיפוס ←"}</Btn>
              <p style={{fontSize:13,color:C.muted,textAlign:"center",marginTop:14}}>
                <span onClick={()=>setMode("login")} style={{color:C.blue,fontWeight:700,cursor:"pointer"}}>חזרה לכניסה</span>
              </p>
            </div>
          )}
        </div>
      ):(
        <div>
          {/* Google */}
          <button onClick={loginWithGoogle} disabled={googleLoad} style={{width:"100%",background:"#fff",color:"#444",border:"1.5px solid #ddd",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
            {googleLoad?<Spinner size={20} color="#4285F4"/>:<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>}
            {googleLoad?"מתחבר...":"התחבר עם Google"}
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.muted,fontWeight:600}}>או</span><div style={{flex:1,height:1,background:C.border}}/>
          </div>
          <div style={{display:"flex",background:C.blueXL,borderRadius:14,padding:4,marginBottom:20}}>
            {[["login","כניסה"],["register","הרשמה"]].map(([v,l])=>(
              <button key={v} onClick={()=>{setMode(v);setErr("");}} style={{flex:1,padding:"10px 0",borderRadius:11,background:mode===v?C.surface:"transparent",border:"none",fontWeight:700,fontSize:14,color:mode===v?C.blue:C.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="אימייל" style={{background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="סיסמה (מינימום 6 תווים)" onKeyDown={e=>e.key==="Enter"&&submit()} style={{background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
          </div>
          {mode==="login"&&(
            <div style={{textAlign:"left",marginBottom:12}}>
              <span onClick={()=>{setMode("reset");setErr("");}} style={{fontSize:13,color:C.blue,fontWeight:600,cursor:"pointer"}}>שכחתי סיסמה</span>
            </div>
          )}
          {err&&<div style={{background:err.startsWith("✅")?"#F0FFF6":"#FEF2F2",border:`1px solid ${err.startsWith("✅")?C.success:C.danger}30`,borderRadius:12,padding:"10px 14px",fontSize:13,color:err.startsWith("✅")?C.success:C.danger,marginBottom:12}}>{err}</div>}
          <Btn primary full onClick={submit} disabled={load||!email||!pass} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:16}}>
            {load?<><Spinner size={18} color="#fff"/>מעבד...</>:mode==="login"?"כניסה ←":"צור חשבון ←"}
          </Btn>
          <p style={{fontSize:13,color:C.muted,textAlign:"center",marginTop:16}}>
            {mode==="login"?"אין חשבון? ":"יש חשבון? "}
            <span onClick={()=>setMode(mode==="login"?"register":"login")} style={{color:C.blue,fontWeight:700,cursor:"pointer"}}>{mode==="login"?"הירשם":"כנס"}</span>
          </p>
        </div>
      )}
    </div>
  </>);
}

// ─── EVENT PICKER ─────────────────────────────────────────────────────────────
function EventPicker({ user, onSelect, onLogout, onBackToLanding }) {
  const [events,setEvents]=useState([]),[loading,setLoading]=useState(true),[creating,setCreating]=useState(false),[showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",date:"",event_type:"wedding",bride_name:"",groom_name:"",venue:"",venue_address:"",event_time:"",welcome_text:""});
  const [editEvent,setEditEvent]=useState(null);

  const updateEvent=async(data)=>{
    await sb.from("events").update(data).eq("id",editEvent.id);
    setEvents(evs=>evs.map(e=>e.id===editEvent.id?{...e,...data}:e));
    setEditEvent(null);
  };
  const loadEvents=async()=>{setLoading(true);const{data}=await sb.from("events").select("*").eq("user_id",user.id).order("date",{ascending:true});setEvents(data||[]);setLoading(false);};
  const create=async()=>{
    if(!form.name.trim())return;
    setCreating(true);
    const invite_code=Math.random().toString(36).slice(2,10);
    const{data,error}=await sb.from("events").insert({...form,name:form.name.trim(),user_id:user.id,invite_code,invite_active:true}).select().single();
    if(!error)onSelect(data);
    setCreating(false);
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
        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="חתונת עמית ואורנה"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>

        {form.event_type==="wedding"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שם החתן</div>
            <input value={form.groom_name} onChange={e=>setForm(f=>({...f,groom_name:e.target.value}))} placeholder="יוסי" style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"8px 6px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שם הכלה</div>
            <input value={form.bride_name} onChange={e=>setForm(f=>({...f,bride_name:e.target.value}))} placeholder="רחל" style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"8px 6px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
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
        <input value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} placeholder="אולם הגן, תל אביב"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>

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
              {ev.date&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>📅 {new Date(ev.date).toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}</div>}
              {ev.venue&&<div style={{fontSize:11,color:C.muted}}>📍 {ev.venue}</div>}
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
            ["שם האירוע","name","text","חתונת עמית ואורנה"],
            ["שם החתן","groom_name","text","יוסי"],
            ["שם הכלה","bride_name","text","רחל"],
            ["תאריך","date","date",""],
            ["שעה","event_time","time",""],
            ["שם האולם","venue","text","אולם הגן"],
            ["כתובת מלאה (לניווט)","venue_address","text","רחוב הרצל 1, תל אביב"],
          ].map(([label,field,type,ph])=>(
            <div key={field} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>{label}</div>
              <input type={type} value={editEvent[field]||""} onChange={e=>setEditEvent(ev=>({...ev,[field]:e.target.value}))} placeholder={ph}
                style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
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
function BottomNav({ active, onChange, userPackages=[], totalGuests=0, trialExpired=false }) {
  const hasSeating=userPackages.some(p=>["seating","sms","auto","vip","staff"].includes(p.package_id??p));
  const hasRsvp=userPackages.some(p=>["basic","seating","sms","auto","vip","staff"].includes(p.package_id??p));
  const isFreePlan=userPackages.length===0;
  const items=[
    {id:"home",icon:"🏠",label:"ראשי"},
    {id:"seating",icon:"🪑",label:"הושבה",locked:!hasSeating},
    {id:"rsvp",icon:"✅",label:"הגעה",locked:!hasRsvp},
    {id:"add",icon:"➕",label:"הוסף",locked:isFreePlan&&totalGuests>=50},
    {id:"settings",icon:"⚙️",label:"הגדרות"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:80,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",height:64,boxShadow:"0 -4px 20px rgba(91,60,140,0.08)"}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>{
          if(item.locked){
            if(item.id==="seating") alert("🔒 סידורי הושבה זמינים בחבילה המתקדמת ומעלה (₪150)");
            else if(item.id==="add") alert("🔒 הגעת למגבלת 50 אורחים בחבילה החינמית. שדרג כדי להוסיף עוד.");
            return;
          }
          onChange(item.id);
        }}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit",padding:"6px 0",position:"relative",opacity:item.locked?.5:1}}>
          <span style={{fontSize:20,lineHeight:1,filter:active===item.id?"none":"grayscale(1)",opacity:active===item.id?1:.5}}>{item.icon}</span>
          <span style={{fontSize:10,fontWeight:700,color:active===item.id?C.blue:C.muted}}>{item.label}</span>
          {item.locked&&<span style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",fontSize:8,background:"#FEF3C7",color:"#B45309",borderRadius:4,padding:"1px 4px",fontWeight:800}}>🔒</span>}
          {active===item.id&&<div style={{position:"absolute",bottom:0,width:32,height:3,borderRadius:"3px 3px 0 0",background:`linear-gradient(90deg,${C.blueM},${C.blueL})`}}/>}
        </button>
      ))}
    </div>
  );
}

// ─── EDIT TABLE MODAL ─────────────────────────────────────────────────────────
function EditTableModal({ table, onSave, onDelete, onClose }) {
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
              <span style={{fontSize:11,fontWeight:700,color:type===k?"#fff":C.text}}>{v.label}</span>
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <label style={{display:"flex",flexDirection:"column",gap:4,width:90,flexShrink:0}}>
            <span style={{fontSize:11,fontWeight:800,color:C.muted}}>מספר שולחן</span>
            <input type="number" min="1" value={num} onChange={e=>setNum(e.target.value.replace(/\D/g,""))} aria-label="מספר שולחן"
              style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 10px",fontSize:16,fontWeight:900,color:C.blue,textAlign:"center",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </label>
          <label style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
            <span style={{fontSize:11,fontWeight:800,color:C.muted}}>שם השולחן</span>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="שם השולחן..."
              style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </label>
        </div>
        {num&&<div style={{fontSize:11,color:C.muted,marginTop:-6,marginBottom:12}}>אם המספר תפוס בשולחן אחר — השולחנות יחליפו מספרים</div>}

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
function MobileSeating({ tables, guests, search, setSearch, newGuest, setNewGuest, addGuest, dropOnTable, removeFromTable, onAddTable, onEditTable, onDeleteTable, onEditGuest, onPrint }) {
  const [tab,setTab]=useState("guests"),[picked,setPicked]=useState(null),[expanded,setExpanded]=useState(null),[editTable,setEditTable]=useState(null);
  const assign=async tableId=>{if(!picked)return;await dropOnTable(tableId,picked.id,picked.table_id||null);setPicked(null);setTab("guests");};
  return(<div style={{display:"flex",flexDirection:"column",flex:1,background:C.bg}}>
    {picked&&<div style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,fontSize:14,flexShrink:0}}>
      <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{picked.name[0]}</div>
      <span style={{flex:1,fontWeight:700}}>{picked.name}  -  בחר שולחן</span>
      <button onClick={()=>setPicked(null)} style={{background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>ביטול</button>
    </div>}

    <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
      {[["guests",`👥 אורחים (${guests.length})`],["tables",`🪑 שולחנות (${tables.length})`]].map(([v,l])=>(
        <button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:"14px 0",border:"none",borderBottom:`3px solid ${tab===v?C.blueL:"transparent"}`,background:"none",color:tab===v?C.blue:C.muted,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
      ))}
    </div>

    <div style={{flex:1,overflowY:"auto",padding:16}}>
      {tab==="guests"&&<>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש אורח..." style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>
        {guests.length===0
          ?<div style={{textAlign:"center",padding:"50px 0"}}><div style={{fontSize:52}}>🎉</div><p style={{color:C.success,fontWeight:700,marginTop:10,fontSize:16}}>כולם מוסבים!</p></div>
          :guests.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())).map(g=>(
            <Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",marginBottom:8,border:`1.5px solid ${picked?.id===g.id?C.blueL:C.border}`,background:picked?.id===g.id?C.blueXL:C.surface}}>
              <div onClick={()=>{setPicked(g);setTab("tables");}} style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0,cursor:"pointer"}}>{g.name[0]}</div>
              <div onClick={()=>{setPicked(g);setTab("tables");}} style={{flex:1,cursor:"pointer",minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text}}>{g.name}</div>
                {g.phone&&<div style={{fontSize:11,color:C.muted}}>{g.phone}</div>}
              </div>
              <RsvpBadge rsvp={g.rsvp}/>
              <button onClick={e=>{e.stopPropagation();onEditGuest(g);}} style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:9,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,flexShrink:0}}>✏️</button>
            </Card>
          ))
        }
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <input value={newGuest} onChange={e=>setNewGuest(e.target.value)} placeholder="+ הוסף אורח חדש" onKeyDown={e=>e.key==="Enter"&&addGuest()} style={{flex:1,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={addGuest} style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"12px 20px",fontSize:20,fontWeight:700,cursor:"pointer"}}>+</button>
        </div>
      </>}

      {tab==="tables"&&<>
        <button onClick={onAddTable} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 14px ${C.blueL}44`}}>
          ➕ הוסף שולחן חדש
        </button>
        {onPrint&&tables.length>0&&<button onClick={onPrint} style={{width:"100%",background:C.surface,color:C.blue,border:`2px solid ${C.blueL}`,borderRadius:14,padding:"12px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>
          🖨️ הדפס סידור הושבה
        </button>}

        {tables.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:48}}>🪑</div><p style={{color:C.muted,fontSize:14,marginTop:8}}>אין עדיין שולחנות</p></div>}

        {tables.map((t)=>{
          const sc=sColor(t),exp=expanded===t.id,isFull=(t.guests||[]).length>=t.seats;
          return(
            <Card key={t.id} style={{marginBottom:12,overflow:"hidden",border:`1.5px solid ${picked&&!isFull?C.blueL:C.border}`,opacity:picked&&isFull?.4:1}}>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div onClick={()=>picked?(!isFull&&assign(t.id)):setExpanded(exp?null:t.id)} style={{display:"flex",alignItems:"center",gap:12,flex:1,cursor:picked&&isFull?"not-allowed":"pointer",background:picked&&!isFull?C.blueXL:"none",margin:"-14px -16px",padding:"14px 16px"}}>
                  <div title="מספר שולחן" style={{width:46,height:46,borderRadius:13,background:GRAD,color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>
                    <span style={{fontSize:20,fontWeight:900}}>{t.num||""}</span><span style={{fontSize:11}}>{TABLE_TYPES[t.type]?.icon}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:15,color:C.text}}>{String(t.name||"").replace(/^\s*\d+\s*/,"")||`שולחן ${t.num}`}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{TABLE_TYPES[t.type]?.label} · {t.seats-(t.guests||[]).length} פנויים</div>
                  </div>
                  {picked
                    ?isFull?<span style={{fontSize:12,color:C.danger,fontWeight:700}}>מלא</span>:<span style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",borderRadius:10,padding:"6px 14px",fontSize:13,fontWeight:700}}>שבץ +</span>
                    :<div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:900,color:sc}}>{(t.guests||[]).length}</div><div style={{fontSize:10,color:C.muted}}>מתוך {t.seats}</div></div>
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

    {editTable&&<EditTableModal table={editTable} onClose={()=>setEditTable(null)}
      onSave={async(id,name,type,seats)=>{await onEditTable(id,name,type,seats);setEditTable(null);}}
      onDelete={async(id)=>{await onDeleteTable(id);setEditTable(null);}}
    />}
  </div>);
}

// ─── SEATING APP ──────────────────────────────────────────────────────────────
// ─── MOBILE SETTINGS SCREEN ──────────────────────────────────────────────────
function MobileSettingsScreen({ user, event, sb, setGuests, setScreen }) {
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
    await sb.from("events").update({settings_json:settings}).eq("id",event.id);
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
            <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>{event.groom_name&&event.bride_name?`${event.groom_name} & ${event.bride_name}`:event.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{user.email}</div>
          </div>
        </div>
        <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
          {[["שם פרטי",event.groom_name||""],["שם משפחה",event.bride_name||""],["מס' נייד",user.phone||" - "]].map(([l,v])=>(
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
        {[
          {label:"התראות אפליקציה",desc:"התראות מערכת ועדכונים שוטפים",val:notifyApp,onChange:v=>{setNotifyApp(v);saveNotify("notifyApp",v);}},
          {label:"אישורי הגעה",desc:"התראה על כל אישור, ביטול או עדכון מהאורחים",val:notifyRsvp,onChange:v=>{setNotifyRsvp(v);saveNotify("notifyRsvp",v);}},
        ].map(item=>(
          <div key={item.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #f5f5f5"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{item.label}</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{item.desc}</div></div>
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
        <div style={{fontSize:12,color:"#888",marginBottom:12,lineHeight:1.6}}>מחיקת החשבון תמחק לצמיתות את כל הנתונים  -  אורחים, שולחנות, אירוע ופרטי חשבון. לא ניתן לשחזר.</div>
        <button onClick={async()=>{
          const first=window.confirm("האם אתה בטוח שברצונך למחוק את החשבון לצמיתות?\nכל הנתונים יימחקו ולא ניתן לשחזרם.");
          if(!first)return;
          const second=window.confirm("אישור אחרון - מחיקה סופית של החשבון?");
          if(!second)return;
          try{
            await sb.from("guests").delete().eq("event_id",event.id);
            await sb.from("tables").delete().eq("event_id",event.id);
            await sb.from("events").delete().eq("id",event.id);
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
function MobileRsvpScreen({ guests, tables, event, sb, setGuests, setTables, setModal }) {
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

  const updateRsvp=async(g,rsvp)=>{
    await sb.from("guests").update({rsvp}).eq("id",g.id);
    setGuests(gs=>gs.map(x=>x.id===g.id?{...x,rsvp}:x));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(x=>x.id===g.id?{...x,rsvp}:x)})));
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
            {[["confirmed","✓ מגיעים"],["declined","✗ לא מגיעים"],["pending","? אולי מגיעים"],["no_answer","📞 לא ענו"],["sent","✈️ נשלחה הודעה"],["not_shown","🕐 לא הוצגה הזמנה"]].map(([val,label])=>(
              <button key={val} onClick={()=>updateRsvp(statusModal,val)} style={{background:statusModal.rsvp===val?"#3D5475":"#f5f5f5",color:statusModal.rsvp===val?"#fff":"#333",border:"1.5px solid #e5e5e5",borderRadius:50,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
            ))}
          </div>
        </div>
      </div>}

      {/* סטטיסטיקות */}
      <div style={{background:"#fff",padding:"16px 16px 12px",borderBottom:"1px solid #eee"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center",marginBottom:12}}>
          <div><div style={{fontSize:30,fontWeight:900,color:"#3A2464",lineHeight:1}}>{allGuests.length}</div><div style={{fontSize:11,color:"#666",fontWeight:600}}>מוזמנים</div></div>
          <div><div style={{fontSize:30,fontWeight:900,color:"#C53030",lineHeight:1}}>{declined}</div><div style={{fontSize:11,color:"#666",fontWeight:600}}>לא מגיעים</div></div>
          <div><div style={{fontSize:30,fontWeight:900,color:"#276749",lineHeight:1}}>{confirmed}</div><div style={{fontSize:11,color:"#666",fontWeight:600}}>מגיעים</div></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setModal("addGuest")} style={{flex:1,background:"#3D5475",color:"#fff",border:"none",borderRadius:50,padding:"10px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>➕ הוסף מוזמן</button>
        </div>
      </div>

      {/* חיפוש */}
      <div style={{padding:"10px 16px"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש..." style={{width:"100%",border:"1px solid #e5e5e5",borderRadius:50,padding:"9px 16px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#f9f9f9"}}/>
      </div>

      {/* טבלה */}
      <div style={{background:"#fff",margin:"0 12px",borderRadius:14,overflow:"hidden",border:"1px solid #eee",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 90px 80px",padding:"10px 14px",background:"#f5f5f5",borderBottom:"1px solid #eee"}}>
          {["שם מלא","טלפון","סטטוס"].map(h=><div key={h} style={{fontSize:11,fontWeight:800,color:"#555",textAlign:"center"}}>{h}</div>)}
        </div>
        {filtered.map((g,i)=>(
          <div key={g.id} style={{display:"grid",gridTemplateColumns:"1fr 90px 80px",padding:"11px 14px",borderBottom:i<filtered.length-1?"1px solid #f0f0f0":"none",background:i%2===0?"#fff":"#fafafa",alignItems:"center"}}>
            <div onClick={()=>openEdit(g)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(120deg,#F0609E,#9B6BFF)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{g.name?.[0]}</div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{g.name}</div>
                {g.guest_count>1&&<div style={{fontSize:10,color:"#888"}}>({g.guest_count})</div>}
              </div>
            </div>
            <div style={{fontSize:10,color:"#666",textAlign:"center"}}>{g.phone||" - "}</div>
            <div onClick={()=>setStatusModal(g)} style={{textAlign:"center",cursor:"pointer"}}>
              <span style={{fontSize:10,fontWeight:700,color:rsvpColor(g.rsvp),background:rsvpBg(g.rsvp),borderRadius:50,padding:"3px 8px",whiteSpace:"nowrap"}}>{rsvpLabel(g.rsvp)}</span>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{padding:20,textAlign:"center",color:"#aaa",fontSize:13}}>לא נמצאו אורחים</div>}
      </div>
      <div style={{textAlign:"center",fontSize:11,color:"#999",margin:"8px 0 16px"}}>{filtered.length} מתוך {allGuests.length} אורחים</div>
    </div>
  );
}

// מסך שדורש חבילה (כמו בתפריט הצד)
const screenLocked=(id,userPackages)=>{
  const has=list=>userPackages.some(p=>list.includes(p.package_id??p));
  if(id==="rsvp")return !has(["basic","seating","sms","auto","vip","staff"]);
  if(id==="seating")return !has(["seating","sms","auto","vip","staff"]);
  if(id==="sms")return !has(["sms","auto","vip"]);
  if(id==="whatsapp")return !has(["auto","vip"]);
  if(id==="ai"||id==="budget"||id==="import")return userPackages.length===0;
  return false;
};
// המסך האחרון (ותצוגת ההושבה) נשמר בדפדפן כדי שרענון יחזיר לאותו מקום באותו אירוע
const LAST_SCREEN_KEY="sidor_last_screen";
const RESTORABLE_SCREENS=["home","settings","seating","rsvp","import","budget","packages","sms","whatsapp","user_settings","settings_event","invite","add","contacts"];
const readLastScreen=eventId=>{
  try{const s=JSON.parse(localStorage.getItem(LAST_SCREEN_KEY)||"null");
    if(s&&s.eventId===eventId&&RESTORABLE_SCREENS.includes(s.screen))return s;}catch{}
  return null;
};

function SeatingApp({ user, event, onBack, onUpdate, onLogout, onHome }) {
  const updateEvent=async(data)=>{await sb.from("events").update(data).eq("id",event.id);onUpdate?.(data);};
  const logout=onLogout||(async()=>{await sb.auth.signOut();});
  const [tables,setTables]=useState([]),[guests,setGuests]=useState([]),[selected,setSelected]=useState(null),[view,setView]=useState(()=>readLastScreen(event.id)?.view||"map"),[screen,setScreen]=useState(()=>readLastScreen(event.id)?.screen||"home"),[modal,setModal]=useState(null),[editGuestData,setEditGuestData]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[search,setSearch]=useState(""),[newGuest,setNewGuest]=useState(""),[mobile,setMobile]=useState(isMobile());
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [zoom,setZoom]=useState(1);
  const mapBoxRef=useRef(null);
  const [,setBoxTick]=useState(0);
  // ─── מצלמת המפה: זום + הזזה (pan). האולם הוא משטח פתוח; המצלמה מחליטה מה רואים ───
  const [pan,setPan]=useState({x:0,y:0});
  const panRef=useRef(pan);panRef.current=pan;
  const zoomRef=useRef(zoom);zoomRef.current=zoom;
  const hallLayerRef=useRef(null);
  const ZMIN=.3,ZMAX=1.8;
  // גבולות כל שולחן ביחס לנקודת המיקום שלו (כמו שהוא מצויר ב-TableNode)
  const tableBox=t=>t.type==="knight"?[t.x-16,t.y-16,t.x+196,t.y+76]:t.type==="rect"?[t.x-18,t.y-18,t.x+128,t.y+98]:[t.x,t.y,t.x+158,t.y+158];
  const FIX_SIZE={stage:[300,70],bar:[130,56],entrance:[150,34]};
  // מיקום ברירת מחדל לבמה/בר/כניסה (כשלא הוזזו ידנית) נקבע לפי השולחנות — ומתעדכן רק כשמוסיפים/מוחקים שולחן,
  // לא כשגוררים שולחן (כדי שהבמה לא תקפוץ בזמן הזזה)
  const fixDefRef=useRef(null);
  useEffect(()=>{fixDefRef.current=null;},[event.id,tables.length]);
  const fixDefaults=()=>{
    if(fixDefRef.current)return fixDefRef.current;
    const bs=tables.map(tableBox);
    const [x0,y0,x1,y1]=bs.length?[Math.min(...bs.map(b=>b[0])),Math.min(...bs.map(b=>b[1])),Math.max(...bs.map(b=>b[2])),Math.max(...bs.map(b=>b[3]))]:[0,120,800,420];
    const cx=(x0+x1)/2;
    const d={stage:{x:Math.round(cx-150),y:Math.round(y0-92)},bar:{x:Math.round(cx+190),y:Math.round(y0-86)},entrance:{x:Math.round(cx-75),y:Math.round(y1+22)}};
    if(!loading)fixDefRef.current=d;
    return d;
  };
  const fixPos=k=>{const p=(hallRef.current||{})[k];return p&&typeof p.x==="number"?{x:p.x,y:p.y}:fixDefaults()[k];};
  // המלבן שמכיל את כל השולחנות + במה/בר/כניסה
  const contentBox=(list=tables)=>{
    const bs=[...list.map(tableBox),...Object.keys(FIX_SIZE).map(k=>{const p=fixPos(k);return [p.x,p.y,p.x+FIX_SIZE[k][0],p.y+FIX_SIZE[k][1]];})];
    return [Math.min(...bs.map(b=>b[0])),Math.min(...bs.map(b=>b[1])),Math.max(...bs.map(b=>b[2])),Math.max(...bs.map(b=>b[3]))];
  };
  // מצייר את המצלמה ישר על ה-DOM (חלק בזמן גרירה), ושומר ל-state בסוף
  const paintCam=(p=panRef.current,z=zoomRef.current)=>{
    if(hallLayerRef.current)hallLayerRef.current.style.transform=`translate(${p.x}px,${p.y}px) scale(${z})`;
    const el=mapBoxRef.current;if(el){el.style.backgroundPosition=`${p.x}px ${p.y}px,0 0`;el.style.backgroundSize=`${22*z}px ${22*z}px,100% 100%`;}
  };
  const setCam=(p,z=zoomRef.current)=>{panRef.current=p;zoomRef.current=z;paintCam(p,z);setPan(p);setZoom(z);};
  // התאמה למסך: כל השולחנות גדולים ככל האפשר ובמרכז. יותר שולחנות = זום קטן יותר.
  // בהתאמה האוטומטית הזום לא יורד מתחת ל-FIT_MIN כדי שהשולחנות יישארו קריאים (מה שבחוץ — מזיזים בחיצים/גרירה);
  // "⤢ הכל" (all=true) מראה את כל האולם בכל גודל
  const FIT_MIN=.78;
  const manualZoomRef=useRef(false);
  const fitZoom=(list=tables,all=false)=>{
    const el=mapBoxRef.current;if(!el)return;
    manualZoomRef.current=false;
    const cw=el.clientWidth,ch=el.clientHeight;
    const [x0,y0,x1,y1]=contentBox(list);
    const bw=Math.max(x1-x0,320),bh=Math.max(y1-y0,240);
    const zFit=Math.min((cw-28)/bw,(ch-28)/bh);
    const z=+Math.min(1.6,Math.max(all?ZMIN:Math.min(FIT_MIN,1.6),zFit)).toFixed(3);
    setCam({x:Math.round((cw-(x1-x0)*z)/2-x0*z),y:Math.round((ch-(y1-y0)*z)/2-y0*z)},z);
  };
  // זום סביב נקודה במסך (ברירת מחדל: מרכז המפה)
  const zoomAt=(factor,cx,cy)=>{
    const el=mapBoxRef.current;if(!el)return;
    manualZoomRef.current=true;
    if(cx==null){cx=el.clientWidth/2;cy=el.clientHeight/2;}
    const z0=zoomRef.current,z=Math.min(ZMAX,Math.max(ZMIN,z0*factor)),p=panRef.current;
    setCam({x:cx-(cx-p.x)*z/z0,y:cy-(cy-p.y)*z/z0},z);
  };
  const zoomBy=d=>zoomAt(d>0?1.15:1/1.15);
  const panBy=(dx,dy)=>{manualZoomRef.current=true;const p=panRef.current;setCam({x:p.x+dx,y:p.y+dy});};
  // גרירת הרקע מזיזה את המפה; לחיצה בלי תזוזה מבטלת בחירת שולחן
  const startPan=e=>{
    if(e.button!==0)return;
    const el=mapBoxRef.current,sx=e.clientX,sy=e.clientY,p0=panRef.current;let moved=false,raf=0,p=p0;
    el.style.cursor="grabbing";
    const mv=me=>{const dx=me.clientX-sx,dy=me.clientY-sy;if(!moved&&Math.abs(dx)+Math.abs(dy)<4)return;moved=true;p={x:p0.x+dx,y:p0.y+dy};panRef.current=p;if(!raf)raf=requestAnimationFrame(()=>{raf=0;paintCam(p);});};
    const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);el.style.cursor="";
      if(moved){manualZoomRef.current=true;setPan(p);}else setSelected(null);};
    window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
  };
  useEffect(()=>{
    if(screen!=="seating"||view!=="map"||!mapBoxRef.current)return;
    const el=mapBoxRef.current;
    fitZoom();
    // כשהחלון/המסך המלא/התפריט משנים גודל — מתאימים מחדש (אלא אם המשתמש הזיז/הגדיל בעצמו)
    const ro=new ResizeObserver(()=>{setBoxTick(t=>t+1);if(!manualZoomRef.current)fitZoom();});
    ro.observe(el);
    // גלגלת/משטח מגע: הזזה; Ctrl+גלגלת (או צביטה): זום סביב הסמן
    const wheel=e=>{
      e.preventDefault();
      if(e.ctrlKey||e.metaKey){const r=el.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.0025),e.clientX-r.left,e.clientY-r.top);}
      else panBy(-e.deltaX,-e.deltaY);
    };
    el.addEventListener("wheel",wheel,{passive:false});
    // חיצים במקלדת מזיזים את המפה (לא בתוך שדה טקסט)
    const key=e=>{
      if(/input|textarea|select/i.test(e.target.tagName)||e.ctrlKey||e.metaKey)return;
      const d={ArrowLeft:[120,0],ArrowRight:[-120,0],ArrowUp:[0,120],ArrowDown:[0,-120]}[e.key];
      if(d){e.preventDefault();panBy(d[0],d[1]);}
    };
    window.addEventListener("keydown",key);
    return()=>{ro.disconnect();el.removeEventListener("wheel",wheel);window.removeEventListener("keydown",key);};
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
  const [asideOpen,setAsideOpen]=useState(()=>{try{return localStorage.getItem("sidor_aside")!=="0";}catch{return true;}});
  useEffect(()=>{try{localStorage.setItem("sidor_aside",asideOpen?"1":"0");}catch{}},[asideOpen]);
  // בחירת שולחן פותחת את הרשימה (שם עורכים את היושבים בו)
  useEffect(()=>{if(selected&&!mapFull)setAsideOpen(true);},[selected]);
  useEffect(()=>{if(screen!=="seating"||view!=="map")setMapFull(false);},[screen,view]);
  useEffect(()=>{
    if(!mapFull)return;
    const onKey=e=>{if(e.key==="Escape")setMapFull(false);};
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[mapFull]);
  useEffect(()=>{if(screen==="seating"&&view==="map")setTimeout(()=>fitZoom(),30);},[mapFull]);
  // במסך ההושבה מקפלים את התפריט הראשי כדי לתת למפה יותר מקום (אפשר לפתוח שוב ב-☰)
  useEffect(()=>{setSidebarOpen(screen!=="seating");},[screen]);
  const [mapFind,setMapFind]=useState("");
  // פריסת האולם (מיקום במה/בר/כניסה + נעילת מפה) נשמרת באירוע: settings_json.hall
  const [hall,setHall]=useState(()=>event.settings_json?.hall||{});
  const hallRef=useRef(hall);hallRef.current=hall;
  useEffect(()=>{setHall(event.settings_json?.hall||{});},[event.id]);
  const mapLocked=!!hall.locked;
  const saveHall=async next=>{
    setHall(next);
    const settings={...(event.settings_json||{}),hall:next};
    event.settings_json=settings;
    const{error}=await sb.from("events").update({settings_json:settings}).eq("id",event.id);
    if(error)alert("❌ פריסת האולם לא נשמרה: "+error.message);
  };
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
    const waiting=guests.length?`<h2>ממתינים להושבה (${guests.length})</h2><p class="wait">${guests.map(g=>esc(g.name)).join(" · ")}</p>`:"";
    const title=esc(event.name||"סידור הושבה"),date=event.date?fmtDateHe(event.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"";
    const w=window.open("","_blank");if(!w){alert("הדפדפן חסם את חלון ההדפסה — אפשרו חלונות קופצים לאתר");return;}
    w.document.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>סידור הושבה · ${title}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&display=swap');
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
  const [userPackages,setUserPackages]=useState([]);
  const [trialExpired] = useState(false);
  const [trialHours] = useState(0);
  const [editTableData,setEditTableData]=useState(null);
  const hasPkg=(id)=>userPackages.includes(id)||userPackages.includes("vip");

  useEffect(()=>{
    const last=readLastScreen(event.id);
    setScreen(last?.screen||"home");if(last?.view)setView(last.view);
    loadAll();
    const fn=()=>setMobile(isMobile());
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[event.id]);
  // שמירת המסך הנוכחי לרענון הבא
  useEffect(()=>{try{localStorage.setItem(LAST_SCREEN_KEY,JSON.stringify({eventId:event.id,screen,view}));}catch{}},[event.id,screen,view]);
  // מסך שנשמר אבל נעול (למשל החבילה הסתיימה) — חוזרים לראשי
  useEffect(()=>{if(!loading&&screenLocked(screen,userPackages))setScreen("home");},[loading,userPackages]);
  const loadAll=async(silent=false)=>{if(silent!==true)setLoading(true);const [{data:tData},{data:gData},{data:pkgData}]=await Promise.all([sb.from("tables").select("*").eq("event_id",event.id).order("created_at"),sb.from("guests").select("*").eq("event_id",event.id).order("created_at"),sb.from("user_packages").select("package_id").eq("user_id",user.id)]);setTables((tData||[]).map(t=>({...t,guests:(gData||[]).filter(g=>g.table_id===t.id)})));setGuests((gData||[]).filter(g=>!g.table_id));setUserPackages((pkgData||[]).map(p=>p.package_id));setLoading(false);};
  const moveTablePos=useCallback((id,x,y)=>setTables(ts=>ts.map(t=>t.id===id?{...t,x:Math.max(0,x),y:Math.max(0,y)}:t)),[]);
  const saveTablePos=async(id,x,y)=>await sb.from("tables").update({x,y}).eq("id",id);

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
    const snap=v=>Math.max(0,Math.round(v/10)*10);
    const wOf=t=>t.type==="knight"?240:200;
    const sorted=[...tables].sort((a,b)=>a.y-b.y);
    const rows=[];
    sorted.forEach(t=>{const r=rows[rows.length-1];if(r&&t.y-r[0].y<100)r.push(t);else rows.push([t]);});
    const next={};let prevY=-Infinity;
    rows.forEach(r=>{
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
  // שולחן חדש נכנס למקום הפנוי הראשון ברשת שליד השולחנות הקיימים (לא על שולחן אחר)
  const freeSpot=type=>{
    const bs=tables.map(tableBox);
    const x0=bs.length?Math.min(...bs.map(b=>b[0])):80,y0=bs.length?Math.min(...bs.map(b=>b[1])):140;
    const cols=Math.max(4,Math.ceil(Math.sqrt(tables.length+1))+1),w=type==="knight"?240:200;
    for(let r=0;r<60;r++)for(let c=0;c<cols;c++){
      const x=x0+c*200,y=y0+r*190,nb=tableBox({x,y,type});
      if(!bs.some(b=>nb[0]<b[2]+20&&nb[2]+20>b[0]&&nb[1]<b[3]+20&&nb[3]+20>b[1]))return {x,y};
    }
    return {x:x0,y:y0+bs.length*40};
  };
  const doAddTable=async(name,type)=>{if(!name?.trim())return;setSaving(true);const seats=TABLE_TYPES[type].defaultSeats;const spot=freeSpot(type);const{data}=await sb.from("tables").insert({name:name.trim(),type,seats,x:spot.x,y:spot.y,event_id:event.id}).select().single();if(data)setTables(ts=>[...ts,{...data,guests:[]}]);setSaving(false);setModal(null);};
  const selTable=tables.find(t=>t.id===selected);
  const seated=tables.reduce((s,t)=>s+(t.guests||[]).length,0);
  const total=seated+guests.length;
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
        <AISeatingScreen event={event} tables={tables} guests={guests} onApply={applyAutoSeating} onClose={()=>setModal(null)} saving={saving}/>
      </div>
    </div>
  );

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,flexDirection:"column",gap:14}}><Spinner size={40}/><p style={{color:C.muted,fontSize:15,fontFamily:"'Heebo',sans-serif"}}>טוען...</p></div>);

  if(mobile){
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
      const checks=[
        {label:"יצירת אירוע",done:true},
        {label:"בחירת חבילה",done:userPackages.length>0},
        {label:"הוספת מוזמנים",done:allG.length>0},
        {label:"יצירת תזמון הודעות",done:false},
      ];
      const checksDone=checks.filter(c=>c.done).length;
      const checksPct=Math.round(checksDone/checks.length*100);

      return(
      <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",background:"linear-gradient(160deg,#FFF4EE 0%,#FFF7FB 45%,#F6F0FF 100%)",minHeight:"100vh",paddingBottom:80}}>

        {/* ─── באנר ראשי ─── */}
        <div style={{background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",margin:"12px 14px",borderRadius:20,padding:"22px 20px",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(155,107,255,.3)"}}>
          <div style={{position:"absolute",top:-30,left:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
          <div style={{position:"absolute",bottom:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:600,marginBottom:4}}>סקירה כללית</div>
            <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:14,lineHeight:1.2}}>
              {event.groom_name&&event.bride_name?`החתונה של ${event.groom_name} ו${event.bride_name}`:event.name}
            </div>
            {daysLeft!==null&&daysLeft>0?(
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div style={{background:"rgba(0,0,0,.25)",borderRadius:12,padding:"8px 10px",textAlign:"center",minWidth:54}}>
                  <div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1}}>{daysLeft}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.7)"}}>ימים</div>
                </div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.8)",fontWeight:700}}>
                  📅 {eventDate?.toLocaleDateString("he-IL",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                </div>
              </div>
            ):(
              <div style={{fontSize:13,color:"rgba(255,255,255,.7)"}}>
                {event.date?`📅 ${eventDate?.toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})} ${event.event_time||""}`:"תאריך לא הוגדר"}
              </div>
            )}
          </div>
        </div>

        {/* ─── צ'קליסט ─── */}
        <div style={{background:"#fff",margin:"0 14px 12px",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(155,107,255,.08)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F"}}>השלמו את האירוע</div>
              <div style={{fontSize:12,color:"#888"}}>{checksDone} / {checks.length}</div>
            </div>
            <div style={{width:44,height:44,borderRadius:"50%",background:checksPct===100?"#F0FFF4":"#FFF1F6",border:`3px solid ${checksPct===100?"#276749":"#9147D6"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:checksPct===100?"#276749":"#9147D6"}}>
              {checksPct}%
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {checks.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:12,background:c.done?"#F0FFF4":"#FAFAFA",border:`1px solid ${c.done?"#9AE6B4":"#E2E8F0"}`}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:c.done?"#25D366":"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>
                  {c.done?"✓":""}
                </div>
                <span style={{fontSize:12,fontWeight:700,color:c.done?"#276749":"#999",textDecoration:c.done?"line-through":"none"}}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── התקדמות אישורי הגעה ─── */}
        <div style={{background:"#fff",margin:"0 14px 12px",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(155,107,255,.08)"}}>
          <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F",marginBottom:14}}>התקדמות אישורי הגעה</div>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
            {/* עיגול */}
            <div style={{position:"relative",width:70,height:70,flexShrink:0}}>
              <svg width="70" height="70" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="28" fill="none" stroke="#f0f0f0" strokeWidth="6"/>
                <circle cx="35" cy="35" r="28" fill="none" stroke="#25D366" strokeWidth="6"
                  strokeDasharray={`${rsvpPct*1.759} 175.9`}
                  strokeLinecap="round" transform="rotate(-90 35 35)"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#2B1D3F"}}>{rsvpPct}%</div>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
              {[["#25D366","מגיעים",confirmed],["#FC8181","לא מגיעים",declined],["#F6AD55","ממתינים לתשובה",pending]].map(([col,label,val])=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
                  <span style={{fontSize:12,color:"#555",flex:1}}>{label}</span>
                  <span style={{fontSize:13,fontWeight:800,color:"#2B1D3F"}}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>setScreen("rsvp")} style={{background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              ✅ אישורי הגעה
            </button>
            <button onClick={()=>{const url=inviteUrl;if(navigator.share)navigator.share({title:event.name,url});else navigator.clipboard.writeText(url).then(()=>alert("הקישור הועתק!"));}}
              style={{background:"#FBF7FC",color:"#9147D6",border:"1.5px solid #E9D9F7",borderRadius:12,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              🔗 שתף הזמנה
            </button>
          </div>
        </div>

        {/* ─── קישור להזמנה ─── */}
        <div style={{background:"#fff",margin:"0 14px 12px",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(155,107,255,.08)"}}>
          <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F",marginBottom:8}}>קישור להזמנה</div>
          <div style={{fontSize:12,color:"#888",marginBottom:12}}>שתף את הקישור עם האורחים</div>
          <div style={{background:"#FBF8FD",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#9147D6",fontFamily:"monospace",marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",direction:"ltr"}}>
            🔗 {inviteUrl}
          </div>
          <div style={{display:"flex",gap:8}}>
            <WaButton event={event} url={inviteUrl} style={{flex:1.4,padding:"12px",fontSize:14}}/>
            <button onClick={()=>navigator.clipboard.writeText(inviteUrl).then(()=>alert("הועתק!"))}
              style={{flex:1,background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              🔗 העתק
            </button>
          </div>
        </div>

        {/* ─── תפריט מהיר ─── */}
        <div style={{padding:"0 14px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#888",marginBottom:10}}>פעולות מהירות</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {icon:"🪑",label:"סידורי הושבה",nav:"seating",bg:"#FFF1F6",color:"#9147D6"},
              {icon:"💌",label:"הזמנה דיגיטלית",nav:"invite",bg:"#E6F0FF",color:"#3B6BF5"},
              {icon:"➕",label:"הוסף אורח",nav:"add",bg:"#FFF6EF",color:"#1a8c5a"},
              {icon:"📱",label:"הודעות SMS",nav:"sms",bg:"#FFF5E6",color:"#B45309"},
              {icon:"💬",label:"WhatsApp",nav:"whatsapp",bg:"#FFF6EF",color:"#1a8c5a"},
              {icon:"📦",label:"חבילות",nav:"packages",bg:"#FFF0FB",color:"#B03A8C"},
              {icon:"💰",label:"תקציב",nav:"budget",bg:"#FFFBE6",color:"#B48009"},
              {icon:"⚙️",label:"הגדרות",nav:"settings",bg:"#F5F5F5",color:"#555"},
            ].map(item=>(
              <div key={item.nav} onClick={()=>setScreen(item.nav)}
                style={{background:"#fff",borderRadius:16,padding:"16px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,boxShadow:"0 2px 8px rgba(155,107,255,.07)",border:"1px solid rgba(155,107,255,.06)",transition:"all .2s"}}
                onTouchStart={e=>e.currentTarget.style.transform="scale(.97)"}
                onTouchEnd={e=>e.currentTarget.style.transform="none"}>
                <div style={{width:38,height:38,borderRadius:12,background:item.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                  {item.icon}
                </div>
                <span style={{fontSize:13,fontWeight:700,color:"#2B1D3F"}}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );};

    return(<div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      {/* TOP BAR */}
      <div style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {screen==="home"
          ? <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",whiteSpace:"nowrap"}}>→ האירועים שלי</button>
          : <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit"}}>→ חזרה</button>
        }
        <span style={{flex:1,fontWeight:800,fontSize:15,color:"#fff",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
          {screen==="home"?event.name:screen==="seating"?"🪑 סידורי הושבה":screen==="add"?"➕ הוסף אורח":screen==="import"?"📊 ייבוא אורחים":screen==="rsvp"?"✅ אישורי הגעה":screen==="invite"?"💌 הזמנה דיגיטלית":screen==="budget"?"💰 ניהול תקציב":screen==="ai"?"🤖 AI סידור חכם":screen==="packages"?"📦 חבילות":screen==="sms"?"📱 הודעות SMS":screen==="whatsapp"?"💬 הודעות WhatsApp":screen==="settings"?"⚙️ הגדרות":event.name}
        </span>
        {saving&&<Spinner size={16} color="rgba(255,255,255,.8)"/>}
        {screen==="seating"&&<button onClick={undo} disabled={!lastUndo||saving} aria-label="ביטול פעולה" title={lastUndo?`ביטול: ${lastUndo.label}`:"אין פעולה לבטל"} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:"6px 10px",cursor:lastUndo?"pointer":"default",fontSize:12,fontWeight:800,fontFamily:"inherit",whiteSpace:"nowrap",opacity:lastUndo?1:.5}}>↩ בטל</button>}
        {screen==="seating"&&<button onClick={()=>setModal("autoSeat")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:800,fontFamily:"inherit",whiteSpace:"nowrap"}}>🤖 הושבה אוטומטית</button>}
      </div>

      <div style={{flex:1,overflow:"auto"}}>
        {screen==="home"&&<HomeScreen/>}
        {screen==="seating"&&<MobileSeating tables={tablesNum} onPrint={printSeating} guests={guests} search={search} setSearch={setSearch} newGuest={newGuest} setNewGuest={setNewGuest} addGuest={addGuest} dropOnTable={dropOnTable} removeFromTable={removeFromTable} onAddTable={()=>setModal("addTable")} onEditTable={editTable} onDeleteTable={deleteTable} onEditGuest={g=>setEditGuestData(g)}/>}
        {editGuestData&&<GuestModal guest={editGuestData} eventId={event.id} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onUpdateExisting={async(g,c)=>{await editGuest(g.id,{name:g.name,phone:g.phone,rsvp:g.rsvp,guest_count:c});setModal(null);setEditGuestData(null);}} onClose={()=>setEditGuestData(null)} onSave={async(data)=>{await editGuest(editGuestData.id,data);setEditGuestData(null);}}/>}
        {screen==="add"&&(
          <div style={{padding:20,direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>הוסף אורחים אחד אחד עם כל הפרטים</div>
            {guests.slice(-5).reverse().map(g=>(
              <Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{g.name[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>{g.name}</div>
                  {g.phone&&<div style={{fontSize:11,color:C.muted}}>{g.phone}</div>}
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
        {modal==="addGuest"&&(userPackages.length===0&&total>=50
          ?<div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setModal(null)}>
            <div style={{background:"#fff",borderRadius:20,padding:24,maxWidth:360,width:"100%",direction:"rtl",textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:12}}>🔒</div>
              <div style={{fontSize:17,fontWeight:900,color:"#1a1a1a",marginBottom:8}}>הגעת למגבלת 50 אורחים</div>
              <div style={{fontSize:13,color:"#666",marginBottom:20,lineHeight:1.6}}>בחבילה החינמית ניתן להוסיף עד 50 אורחים. שדרג לחבילה הבסיסית (₪50) כדי להוסיף ללא הגבלה.</div>
              <button onClick={()=>{setModal(null);setScreen("packages");}} style={{width:"100%",background:"linear-gradient(120deg,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>📦 שדרג חבילה</button>
            </div>
          </div>
          :<GuestModal eventId={event.id} onClose={()=>setModal(null)} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onUpdateExisting={async(g,c)=>{await editGuest(g.id,{name:g.name,phone:g.phone,rsvp:g.rsvp,guest_count:c});setModal(null);setEditGuestData(null);}} onSave={async(data)=>{await addGuest(data);setModal(null);}}/>
        )}
        {screen==="rsvp"&&<MobileRsvpScreen guests={guests} tables={tables} event={event} sb={sb} setGuests={setGuests} setTables={setTables} setModal={setModal}/>}
        {screen==="import"&&(
          <div style={{padding:20,direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
            <div style={{background:C.blueXL,border:`2px dashed ${C.blueL}`,borderRadius:16,padding:24,textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:36,marginBottom:8}}>📊</div>
              <div style={{fontSize:15,fontWeight:700,color:C.blue,marginBottom:4}}>ייבוא מ-Excel</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>קובץ אקסל עם עמודות שם וטלפון (מזהה גם "שם מלא", "שם פרטי"+"שם משפחה", "נייד", "פלאפון")</div>
              <label style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",borderRadius:12,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-block"}}>
                📂 בחר קובץ Excel
                <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={async e=>{
                  const file=e.target.files[0];if(!file)return;
                  setSaving(true);
                  try{
                    const{read,utils}=await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
                    const buf=await file.arrayBuffer();
                    const wb=read(buf);
                    const ws=wb.Sheets[wb.SheetNames[0]];
                    const rows=utils.sheet_to_json(ws);
                    const res=prepareImport(rows.map(parseSheetRow),[...guests,...tables.flatMap(t=>t.guests||[])],event.id);
                    if(res.toInsert.length>0){await sb.from("guests").insert(res.toInsert);await loadAll();}
                    alert(importSummary(res));
                  }catch(err){alert("שגיאה בקריאת הקובץ");}
                  setSaving(false);
                }}/>
              </label>
            </div>
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
        {screen==="packages"&&<PackagesScreen event={event} onBack={()=>setScreen("home")}/>}
        {screen==="sms"&&<SMSScreen event={event} tables={tables} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
        {screen==="whatsapp"&&<WhatsAppScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
        {modal==="locked"&&(
          <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setModal(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:480,direction:"rtl"}}>
              <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:48,marginBottom:8}}>🔒</div>
                <div style={{fontSize:18,fontWeight:900,color:C.text,marginBottom:6}}>פיצ'ר פרימיום</div>
                <div style={{fontSize:14,color:C.muted,lineHeight:1.7}}>פיצ'ר זה זמין בחבילות בתשלום.<br/>שדרג עכשיו וקבל גישה מלאה.</div>
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
        {screen==="contacts"&&<ContactsScreen event={event} onAdd={async(list)=>{setSaving(true);await sb.from("guests").insert(list.map(c=>({name:c.name,phone:c.phone||null,rsvp:"pending",guest_count:1,event_id:event.id,table_id:null})));await loadAll();setSaving(false);setScreen("add");}}/>}
        {screen==="settings"&&<EventDetailsScreen event={event} sb={sb} user={user} onLogout={logout} onUpdate={updateEvent}/>}
        {screen==="user_settings"&&<MobileSettingsScreen user={user} event={event} sb={sb} setGuests={setGuests} setScreen={setScreen}/>}
        {screen==="settings_event"&&<EventDetailsScreen event={event} sb={sb} user={user} onLogout={logout} onUpdate={updateEvent}/>}
      </div>
      <BottomNav active={screen} onChange={setScreen} userPackages={userPackages} totalGuests={total} trialExpired={trialExpired}/>
      {modal==="receipt"&&<ReceiptModal tables={tablesNum} onClose={()=>setModal(null)}/>}
      {modal==="addTable"&&<AddTableModal onConfirm={doAddTable} onClose={()=>setModal(null)}/>}
      {autoSeatModal}
    </div>);
  }

  const navItems=[
    {id:"home",icon:"🏠",label:"ראשי"},
    {id:"settings",icon:"📋",label:"פרטי האירוע"},
    {id:"seating",icon:"🪑",label:"סידורי הושבה"},
    {id:"rsvp",icon:"✅",label:"אישורי הגעה"},
    {id:"import",icon:"📊",label:"ייבוא אורחים"},
    {id:"budget",icon:"💰",label:"ניהול תקציב"},
    {id:"packages",icon:"📦",label:"חבילות"},
    {id:"sms",icon:"📱",label:"הודעות SMS"},
    {id:"whatsapp",icon:"💬",label:"WhatsApp"},
    {id:"user_settings",icon:"⚙️",label:"הגדרות"},
  ];

  return(<div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,color:C.text,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* TOP HEADER */}
    <header style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"0 18px",height:54,position:"sticky",top:0,zIndex:90,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
      <button onClick={()=>setSidebarOpen(o=>!o)}
        style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",cursor:"pointer",borderRadius:10,padding:"6px 10px",display:"flex",flexDirection:"column",gap:4,alignItems:"center",justifyContent:"center",width:36,height:36,flexShrink:0}}>
        <span style={{width:16,height:2,background:"#fff",borderRadius:1,display:"block"}}/>
        <span style={{width:16,height:2,background:"#fff",borderRadius:1,display:"block"}}/>
        <span style={{width:16,height:2,background:"#fff",borderRadius:1,display:"block"}}/>
      </button>
      {screen!=="home"
        ?<button onClick={()=>setScreen("home")} className="sx-btn" style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",borderRadius:10,padding:"5px 12px"}}>→ חזרה</button>
        :<button onClick={onBack} className="sx-btn" style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",borderRadius:10,padding:"5px 12px"}}>→ כל האירועים</button>}
      <span style={{fontWeight:800,fontSize:15,color:"#fff",flex:1}}>{event.name}</span>
      {saving&&<Spinner size={16} color="rgba(255,255,255,.8)"/>}
      {screen==="seating"&&<div style={{display:"flex",gap:4}}>{[["map","🗺 מפה"],["list","📋 רשימה"],["guests","👥 אורחים"]].map(([v,l])=>(<button key={v} onClick={()=>setView(v)} style={{background:view===v?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.15)",color:view===v?C.blue:"#fff",border:`2px solid ${view===v?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.4)"}`,borderRadius:10,padding:"6px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:view===v?"0 2px 8px rgba(0,0,0,0.2)":"none",transition:"all .15s"}}>{l}</button>))}</div>}
      <span style={{background:"rgba(255,255,255,.15)",color:"#fff",borderRadius:100,fontSize:12,fontWeight:700,padding:"3px 12px"}}>{seated}/{total}</span>
      {screen==="seating"&&<>{view!=="map"&&undoBtn({padding:"5px 12px",border:"1px solid rgba(255,255,255,.3)"})}<button onClick={()=>setModal("autoSeat")} style={{background:"rgba(255,255,255,.95)",border:"none",color:C.blue,borderRadius:10,padding:"5px 13px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>🤖 הושבה אוטומטית</button>
      <button onClick={addTable} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",borderRadius:10,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ שולחן</button>
      <button onClick={()=>setModal("receipt")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",borderRadius:10,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🖨️ חפש</button></>}
      <button onClick={()=>onHome?.()} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",color:"rgba(255,255,255,.8)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",borderRadius:10,padding:"5px 12px"}}>🏠 דף הבית</button>
    </header>

    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      {/* SIDEBAR */}
      {sidebarOpen&&(()=>{
        // צבע לכל כפתור  -  אייקון באריח צבעוני; הכפתור הפעיל בגרדיאנט של המותג
        const NAV_COLORS={home:C.blueM,settings:C.blueL,seating:C.coral,rsvp:C.success,import:C.info,budget:C.gold,packages:"#9147D6",sms:C.info,whatsapp:WA_GREEN,ai:C.blueL,user_settings:C.muted};
        const days=event.date?Math.ceil((new Date(event.date)-new Date())/864e5):null;
        return(
        <div className="sx-side" style={{width:236,background:"linear-gradient(180deg,#FFFFFF 0%,#FBF6FE 100%)",display:"flex",flexDirection:"column",flexShrink:0,height:"100%",overflowY:"auto",borderLeft:`1px solid ${C.border}`,boxShadow:"4px 0 24px -12px rgba(91,60,140,.18)",scrollbarWidth:"none"}}>
          <style>{`
            .sx-side::-webkit-scrollbar{display:none}
            .sx-nav{position:relative;display:flex;align-items:center;gap:11px;margin:3px 10px;padding:9px 10px;border-radius:14px;cursor:pointer;
              color:${C.text};font-size:14.5px;font-weight:700;border:1px solid transparent;background:transparent;
              transition:background .18s,transform .18s,box-shadow .2s,border-color .18s,color .18s}
            .sx-nav .sx-ic{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;
              background:color-mix(in srgb,var(--c) 14%,#fff);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 22%,transparent);transition:transform .25s cubic-bezier(.3,1.5,.5,1)}
            .sx-nav:hover{background:#fff;border-color:${C.border};transform:translateX(-4px);box-shadow:0 8px 18px -12px rgba(91,60,140,.45)}
            .sx-nav:hover .sx-ic{transform:scale(1.12) rotate(-6deg)}
            .sx-nav:focus-visible{outline:3px solid ${C.blueL};outline-offset:1px}
            .sx-nav.on{background:${GRAD};color:#fff;font-weight:900;box-shadow:0 10px 22px -10px ${C.blueM};transform:none}
            .sx-nav.on .sx-ic{background:rgba(255,255,255,.22);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}
            .sx-nav.on::before{content:"";position:absolute;right:-10px;top:10px;bottom:10px;width:4px;border-radius:4px;background:${C.blueM}}
            .sx-nav.locked{color:#9C93AE}
            .sx-nav.locked .sx-ic{filter:grayscale(.6);opacity:.75}
            @media (prefers-reduced-motion:reduce){.sx-nav,.sx-nav .sx-ic{transition:none}.sx-nav:hover{transform:none}}
          `}</style>

          {/* כרטיס האירוע הנוכחי */}
          <div style={{margin:"14px 12px 6px",borderRadius:18,padding:"14px 14px 12px",background:GRAD,color:"#fff",position:"relative",overflow:"hidden",boxShadow:`0 14px 28px -14px ${C.blueM}`,flexShrink:0}}>
            <div style={{position:"absolute",top:-24,left:-24,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.16)"}}/>
            <div style={{position:"absolute",bottom:-30,right:-14,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.1)"}}/>
            <div style={{position:"relative"}}>
              <div style={{fontSize:10,fontWeight:800,opacity:.85,letterSpacing:".04em",marginBottom:4}}>האירוע הנוכחי</div>
              <div style={{fontSize:15,fontWeight:900,lineHeight:1.3,marginBottom:6}}>{event.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                {days!==null&&days>=0&&<span style={{background:"rgba(255,255,255,.24)",borderRadius:100,padding:"2px 9px",fontSize:11,fontWeight:900}}>⏳ עוד {days} ימים</span>}
                {event.date&&<span style={{fontSize:11,fontWeight:700,opacity:.92}}>📅 {new Date(event.date).toLocaleDateString("he-IL",{day:"numeric",month:"short"})}</span>}
              </div>
              {event.venue&&<div style={{fontSize:11,opacity:.85,marginTop:4}}>📍 {event.venue}</div>}
            </div>
          </div>

          <nav style={{flex:"1 0 auto",padding:"6px 0 8px"}} aria-label="תפריט ניהול">
            {navItems.map(item=>{
              const isLocked=(()=>{
                return screenLocked(item.id,userPackages);
              })();
              const on=screen===item.id;
              return(
                <div key={item.id} role="button" tabIndex={0} aria-current={on?"page":undefined}
                  className={`sx-nav${on?" on":""}${isLocked?" locked":""}`} style={{"--c":NAV_COLORS[item.id]||C.blueL}}
                  onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.currentTarget.click();}}}
                  onClick={()=>{
                    if(isLocked){setScreen("packages");return;}
                    if(item.id==="receipt")setModal("receipt");
                    else if(item.id==="addTable")setModal("addTable");
                    else setScreen(item.id);
                  }}>
                  <span className="sx-ic">{item.icon}</span>
                  <span style={{flex:1}}>{item.label}</span>
                  {isLocked&&<span title="דורש חבילה" style={{fontSize:10,background:"#FFF4E0",color:"#B07A12",borderRadius:100,padding:"2px 7px",fontWeight:800}}>🔒</span>}
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

      {/* תוכן ראשי */}
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0}}>

      {screen==="home"&&(
      <div style={{flex:1,overflowY:"auto",background:"linear-gradient(160deg,#FFF4EE 0%,#FFF7FB 45%,#F6F0FF 100%)",padding:"24px 28px",direction:"rtl"}}>
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
          const checks=[
            {label:"יצירת אירוע",done:true},
            {label:"בחירת חבילה",done:userPackages.length>0},
            {label:"הוספת מוזמנים",done:allG.length>0},
            {label:"יצירת תזמון הודעות",done:false},
          ];
          const checksDone=checks.filter(c=>c.done).length;
          const checksPct=Math.round(checksDone/checks.length*100);
          return(
            <div>
              {/* ─── שורה עליונה: באנר + צ'קליסט ─── */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:20,marginBottom:20}}>
                {/* באנר */}
                <div style={{background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",borderRadius:20,padding:"28px 32px",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(155,107,255,.25)"}}>
                  <div style={{position:"absolute",top:-30,left:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
                  <div style={{position:"absolute",bottom:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
                  <div style={{position:"relative",zIndex:1}}>
                    <div style={{fontSize:12,color:"rgba(255,255,255,.65)",marginBottom:6}}>סקירה כללית</div>
                    <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:16,lineHeight:1.1}}>
                      {event.groom_name&&event.bride_name?`החתונה של ${event.groom_name} ו${event.bride_name}`:event.name}
                    </div>
                    {daysLeft!==null&&daysLeft>0?(
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{background:"rgba(0,0,0,.25)",borderRadius:14,padding:"10px 18px",display:"flex",alignItems:"center",gap:8}}>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{daysLeft}</div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.7)"}}>ימים</div>
                          </div>
                        </div>
                        <div style={{fontSize:14,color:"rgba(255,255,255,.8)",fontWeight:700}}>
                          📅 {eventDate?.toLocaleDateString("he-IL",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                          {event.event_time&&` · ${event.event_time}`}
                        </div>
                      </div>
                    ):(
                      <div style={{fontSize:14,color:"rgba(255,255,255,.7)"}}>
                        {event.date?`📅 ${fmtDateHe(event.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}${event.event_time?` · ${event.event_time}`:""}`:"תאריך לא הוגדר"}
                        {event.venue&&` · 📍 ${event.venue}`}
                      </div>
                    )}
                    <div style={{display:"flex",gap:10,marginTop:20}}>
                      <button onClick={()=>setScreen("invite")}
                        style={{background:"#fff",color:"#9147D6",border:"none",borderRadius:12,padding:"10px 20px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                        👁 צפה בהזמנה
                      </button>
                      <WaButton event={event} url={inviteUrl} style={{padding:"10px 18px",fontSize:14,boxShadow:"0 8px 20px -8px rgba(0,0,0,.35)"}}/>
                      <button onClick={()=>{navigator.clipboard.writeText(inviteUrl).then(()=>alert("הועתק!"));}}
                        style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1.5px solid rgba(255,255,255,.3)",borderRadius:12,padding:"10px 20px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        🔗 העתק קישור
                      </button>
                    </div>
                  </div>
                </div>

                {/* צ'קליסט */}
                <div style={{background:"#fff",borderRadius:20,padding:"24px",boxShadow:"0 2px 16px rgba(155,107,255,.08)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:900,color:"#2B1D3F"}}>השלמו את האירוע</div>
                      <div style={{fontSize:12,color:"#888",marginTop:2}}>{checksDone} / {checks.length} הושלמו</div>
                    </div>
                    <div style={{width:52,height:52,borderRadius:"50%",background:checksPct===100?"#F0FFF4":"#FFF1F6",border:`3px solid ${checksPct===100?"#276749":"#9147D6"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:checksPct===100?"#276749":"#9147D6"}}>
                      {checksPct}%
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {checks.map((c,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:c.done?"#F0FFF4":"#FAFAFA",border:`1px solid ${c.done?"#9AE6B4":"#E2E8F0"}`}}>
                        <div style={{width:24,height:24,borderRadius:"50%",background:c.done?"#25D366":"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,color:"#fff"}}>
                          {c.done?"✓":""}
                        </div>
                        <span style={{fontSize:13,fontWeight:700,color:c.done?"#276749":"#999",textDecoration:c.done?"line-through":"none"}}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ─── שורה אמצעית: אישורי הגעה + קישור + פעולות אחרונות ─── */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:20}}>
                {/* אישורי הגעה */}
                <div style={{background:"#fff",borderRadius:20,padding:"22px",boxShadow:"0 2px 16px rgba(155,107,255,.08)"}}>
                  <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F",marginBottom:14}}>התקדמות אישורי הגעה</div>
                  <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
                    <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="28" fill="none" stroke="#f0f0f0" strokeWidth="6"/>
                        <circle cx="36" cy="36" r="28" fill="none" stroke="#25D366" strokeWidth="6"
                          strokeDasharray={`${rsvpPct*1.759} 175.9`}
                          strokeLinecap="round" transform="rotate(-90 36 36)"/>
                      </svg>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#2B1D3F"}}>{rsvpPct}%</div>
                    </div>
                    <div style={{flex:1}}>
                      {[["#25D366","מגיעים",confirmed],["#FC8181","לא מגיעים",declined],["#F6AD55","ממתינים",pending]].map(([col,label,val])=>(
                        <div key={label} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
                          <span style={{fontSize:12,color:"#555",flex:1}}>{label}</span>
                          <span style={{fontSize:14,fontWeight:800,color:"#2B1D3F"}}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>setScreen("rsvp")}
                    style={{width:"100%",background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    ✅ אישורי הגעה
                  </button>
                </div>

                {/* קישור הזמנה */}
                <div style={{background:"#fff",borderRadius:20,padding:"22px",boxShadow:"0 2px 16px rgba(155,107,255,.08)"}}>
                  <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F",marginBottom:6}}>קישור להזמנה</div>
                  <div style={{fontSize:12,color:"#888",marginBottom:14}}>שתף עם האורחים</div>
                  <div style={{background:"#FBF8FD",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:11,color:"#9147D6",fontFamily:"monospace",marginBottom:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",direction:"ltr"}}>
                    {inviteUrl}
                  </div>
                  <WaButton event={event} url={inviteUrl} label="שלח את ההזמנה בוואטסאפ" style={{width:"100%",padding:"12px",fontSize:14,marginBottom:8}}/>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>navigator.clipboard.writeText(inviteUrl).then(()=>alert("הועתק!"))}
                      style={{flex:1,background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      🔗 העתק
                    </button>
                    <button onClick={()=>window.open(inviteUrl,"_blank")}
                      style={{flex:1,background:"#F6F0FF",color:"#9147D6",border:"1.5px solid #E9D9F7",borderRadius:12,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      👁 צפה
                    </button>
                  </div>
                </div>

                {/* פעולות מהירות */}
                <div style={{background:"#fff",borderRadius:20,padding:"22px",boxShadow:"0 2px 16px rgba(155,107,255,.08)"}}>
                  <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F",marginBottom:14}}>פעולות מהירות</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {[
                      {icon:"🪑",label:"סידורי הושבה",nav:"seating"},
                      {icon:"📱",label:"הודעות SMS",nav:"sms"},
                      {icon:"💬",label:"WhatsApp",nav:"whatsapp"},
                      {icon:"➕",label:"הוסף אורח",nav:"add"},
                    ].map(item=>(
                      <button key={item.nav} onClick={()=>setScreen(item.nav)}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:"#FBF8FD",border:"1px solid #E2E8F0",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:"#2B1D3F",transition:"all .15s",textAlign:"right"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#FFF1F6";e.currentTarget.style.borderColor="#9147D6";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="#FBF8FD";e.currentTarget.style.borderColor="#E2E8F0";}}>
                        <span style={{fontSize:18}}>{item.icon}</span>
                        <span>{item.label}</span>
                        <span style={{marginRight:"auto",color:"#aaa"}}>←</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    )}


    {/* מסכי תוכן */}
    {screen!=="home"&&screen==="seating"&&<div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 54px)"}}>
      {!asideOpen&&(
        <button onClick={()=>setAsideOpen(true)} title="פתיחת רשימת האורחים" className="sx-btn"
          style={{flexShrink:0,width:38,background:C.surface,border:"none",borderLeft:`1px solid ${C.border}`,cursor:"pointer",fontFamily:"inherit",color:C.blue,fontWeight:900,fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:8,paddingTop:14}}>
          <span>👥</span><span style={{writingMode:"vertical-rl",letterSpacing:1}}>אורחים ({guests.length})</span><span>‹</span>
        </button>
      )}
      <aside style={{width:asideOpen?320:0,display:asideOpen?"flex":"none",background:C.surface,borderLeft:`1px solid ${C.border}`,flexDirection:"column",overflow:"hidden",flexShrink:0}}>
        {selTable?(
          <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
            {/* כפתור חזרה  -  בולט */}
            <div style={{padding:"10px 14px",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,flexShrink:0}}>
              <button onClick={()=>setSelected(null)}
                style={{width:"100%",background:"rgba(255,255,255,.2)",border:"2px solid rgba(255,255,255,.6)",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:800,fontFamily:"inherit",borderRadius:10,padding:"9px",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                ← חזרה לרשימת אורחים
              </button>
            </div>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,background:C.blueXL,flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontWeight:800,fontSize:15,color:C.text}}>{selTable.name}</span>
                <span style={{background:sColor(selTable)+"22",color:sColor(selTable),borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px"}}>{(selTable.guests||[]).length}/{selTable.seats}</span>
              </div>
              <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct(selTable)}%`,background:`linear-gradient(90deg,${C.blueM},${C.blueL})`,borderRadius:3,transition:"width .3s"}}/>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
              {(selTable.guests||[]).length===0&&<p style={{color:C.muted,fontSize:13,textAlign:"center",marginTop:20}}>גרור אורחים לכאן</p>}
              {(selTable.guests||[]).map(g=>(
                <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));e.dataTransfer.setData("fromTable",String(selTable.id));}}
                  style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"9px 11px",marginBottom:6,cursor:"grab"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.blueL}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{g.name[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{g.name}</div>
                    <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                      {g.relation&&<span style={{fontSize:10,background:C.blueXL,color:C.blue,borderRadius:100,padding:"1px 6px",fontWeight:600}}>{g.relation}</span>}
                      <RsvpBadge rsvp={g.rsvp}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <button onClick={e=>{e.stopPropagation();setEditGuestData(g);}} style={{background:C.blueXL,border:`1px solid ${C.border}`,color:C.blue,borderRadius:7,padding:"4px 7px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✏️</button>
                    <button onClick={async e=>{e.stopPropagation();await removeFromTable(selTable.id,g);}}
                      style={{background:"#FFF5F5",border:`1px solid #FED7D7`,color:"#C53030",borderRadius:7,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700,whiteSpace:"nowrap"}}>
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
            <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:C.blueXL,flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontWeight:800,fontSize:14,color:C.text}}>ממתינים להושבה</span>
                <span style={{background:C.gold+"22",color:C.gold,borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px",marginRight:"auto",marginLeft:8}}>{guests.length}</span>
                <button onClick={()=>setAsideOpen(false)} title="קיפול הרשימה — המפה תקבל את כל הרוחב" aria-label="קיפול רשימת האורחים"
                  style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,cursor:"pointer",fontSize:15,fontWeight:900,lineHeight:1,flexShrink:0}}>›</button>
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש..." style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 14px"}}>
              {guests.length===0&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40}}>🎉</div><p style={{color:C.success,fontWeight:700,fontSize:14,marginTop:8}}>כולם מוסבים!</p></div>}
              {guests.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())).map(g=>(
                <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));}}
                  style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 11px",cursor:"grab",marginBottom:6}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.blueL}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0,position:"relative"}}>
                    {g.name[0]}
                    <div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:"50%",background:RELATION_COLORS[g.relation]||"#CBD5E0",border:"2px solid #fff"}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{g.name}</div>
                    <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                      {g.relation&&<span style={{fontSize:10,background:RELATION_COLORS[g.relation]+"22"||C.blueXL,color:RELATION_COLORS[g.relation]||C.blue,borderRadius:100,padding:"1px 6px",fontWeight:600}}>{g.relation}</span>}
                      <RsvpBadge rsvp={g.rsvp}/>
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setEditGuestData(g);}} style={{background:C.blueXL,border:`1px solid ${C.border}`,color:C.blue,borderRadius:7,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700,flexShrink:0}}>✏️</button>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,flexShrink:0,background:"#fff"}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={newGuest} onChange={e=>setNewGuest(e.target.value)} placeholder="שם אורח חדש..."
                  style={{flex:1,background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit"}}
                  onKeyDown={e=>e.key==="Enter"&&addGuest()}/>
                <button onClick={addGuest} style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:12,padding:"9px 16px",cursor:"pointer",fontSize:16,fontWeight:700}}>+</button>
              </div>
              <button onClick={()=>setModal("addGuest")} style={{width:"100%",background:C.blueXL,color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ➕ הוסף עם פרטים מלאים
              </button>
            </div>
          </div>
        )}
      </aside>
      <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
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
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"10px 16px",background:"#fff",borderBottom:`1px solid ${C.border}`,flexShrink:0,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,minWidth:220}}>
                  <div style={{fontSize:13,fontWeight:900,color:C.text,whiteSpace:"nowrap"}}>{seated}/{total} הושבו</div>
                  <div style={{flex:1,height:8,background:"#F1EAF8",borderRadius:100,overflow:"hidden",minWidth:90}}>
                    <div style={{position:"relative",overflow:"hidden",height:"100%",width:`${p}%`,background:GRAD,borderRadius:100,transition:"width .5s cubic-bezier(.3,1.3,.5,1)"}}><span className="sx-shine"/></div>
                  </div>
                  <span style={{fontSize:12,fontWeight:900,color:C.blueM}}>{p}%</span>
                </div>
                <div style={{display:"flex",gap:6,fontSize:12,fontWeight:700}}>
                  <span style={{background:"#E9FBF4",color:C.success,borderRadius:100,padding:"4px 10px"}}>🪑 {Math.max(allSeats-seated,0)} מקומות פנויים</span>
                  <span style={{background:"#FDECEE",color:C.danger,borderRadius:100,padding:"4px 10px"}}>{fullTables} שולחנות מלאים</span>
                </div>
                <div style={{position:"relative",marginRight:"auto"}}>
                  <input value={mapFind} onChange={e=>setMapFind(e.target.value)} placeholder="🔍 איפה יושב/ת...?"
                    style={{width:190,background:C.blueXL,border:`1.5px solid ${q&&!found?C.danger:C.border}`,borderRadius:10,padding:"7px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit"}}/>
                  {q&&<span style={{position:"absolute",left:8,top:8,fontSize:11,fontWeight:800,color:found?C.success:C.danger}}>{found?`${found} ✓`:"לא נמצא"}</span>}
                </div>
                <button onClick={()=>saveHall({...hallRef.current,locked:!mapLocked})} className="sx-btn" aria-pressed={mapLocked}
                  title={mapLocked?"המפה נעולה  -  לחצו כדי לאפשר הזזה":"נעילת המפה: שולחנות, במה, בר וכניסה לא יזוזו (גרירת אורחים עדיין עובדת)"}
                  style={{background:mapLocked?"#FFF4E0":"#fff",border:`1.5px solid ${mapLocked?C.gold:C.border}`,color:mapLocked?"#8A5A00":C.blue,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                  {mapLocked?"🔒 המפה נעולה":"🔓 נעל מפה"}
                </button>
                <button disabled={mapLocked} onClick={alignTables} className="sx-btn"
                  title={mapLocked?"המפה נעולה":"מיישר את השולחנות לשורות ועמודות ישרות, קרוב למקום שבו הנחתם אותם"}
                  style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.blue,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:800,cursor:mapLocked?"not-allowed":"pointer",fontFamily:"inherit",opacity:mapLocked?.45:1}}>
                  📐 יישר שולחנות
                </button>
                {undoBtn()}
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <button style={zBtn} onClick={()=>zoomBy(-.1)} aria-label="הקטן">−</button>
                  <button style={{...zBtn,width:48,fontSize:11}} onClick={()=>fitZoom()} title="התאם למסך">{Math.round(zoom*100)}%</button>
                  <button style={zBtn} onClick={()=>zoomBy(.1)} aria-label="הגדל">+</button>
                  <button style={{...zBtn,width:"auto",padding:"0 8px",fontSize:11}} onClick={()=>fitZoom()} title="השולחנות בגודל נוח, במרכז המסך">⤢ התאם</button>
                  <button style={{...zBtn,width:"auto",padding:"0 8px",fontSize:11}} onClick={()=>fitZoom(tables,true)} title="כל האולם על המסך, גם אם השולחנות קטנים">🗺 הכל</button>
                </div>
                {/* הזזת המפה: חיצים (גם במקלדת), גרירת הרקע או גלגלת */}
                <div style={{display:"flex",alignItems:"center",gap:3}} title="הזזת המפה · אפשר גם לגרור את הרקע או להשתמש בחיצים במקלדת">
                  {[["→",-140,0,"ימינה"],["↑",0,140,"למעלה"],["↓",0,-140,"למטה"],["←",140,0,"שמאלה"]].map(([ic,dx,dy,l])=>(
                    <button key={l} style={zBtn} onClick={()=>panBy(dx,dy)} aria-label={`הזז את המפה ${l}`}>{ic}</button>
                  ))}
                </div>
                {mapFull&&<button onClick={addTable} className="sx-btn"
                  style={{background:"#fff",border:`1.5px solid ${C.border}`,color:C.blue,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                  + שולחן
                </button>}
                <button onClick={()=>setMapFull(f=>!f)} className={mapFull?"sx-btn":"sx-btn sx-btn-primary"}
                  title={mapFull?"יציאה ממסך מלא (Esc)":"פתיחת המפה על כל המסך"}
                  style={{background:mapFull?"#fff":GRAD,color:mapFull?C.blue:"#fff",border:mapFull?`1.5px solid ${C.border}`:"none",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:mapFull?"none":`0 6px 16px -6px ${C.blueM}`}}>
                  {mapFull?"✕ יציאה ממסך מלא":"⛶ מסך מלא"}
                </button>
              </div>
            );
          })()}
          <div onDragOver={e=>e.preventDefault()}
            onDrop={e=>{if(e.defaultPrevented)return;e.preventDefault();}}
            onMouseDown={startPan}
            ref={mapBoxRef} dir="ltr"
            style={{flex:1,minHeight:0,overflow:"hidden",position:"relative",cursor:"grab",
              backgroundColor:"#FFFDFB",backgroundImage:"radial-gradient(circle,#E9DEF2 1.2px,transparent 1.4px),linear-gradient(180deg,rgba(255,230,240,.55),rgba(255,253,251,0) 45%)",
              backgroundSize:`${22*zoom}px ${22*zoom}px,100% 100%`,backgroundPosition:`${pan.x}px ${pan.y}px,0 0`}}>
            {(()=>{
              // שכבת האולם: מיקומים בקואורדינטות של האולם; המצלמה (הזזה+זום) מוחלת עליה
              const [cx0,cy0,cx1,cy1]=contentBox();
              const MAP_W=Math.max(cx1+200,1000),MAP_H=Math.max(cy1+200,700);
              const q=mapFind.trim().toLowerCase();
              return(
                <div dir="rtl" ref={hallLayerRef} style={{position:"absolute",top:0,left:0,width:MAP_W,height:MAP_H,transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transformOrigin:"0 0",willChange:"transform"}}>

                  {/* כתמי צבע רכים ונצנוצים ברקע  -  כמו בדף הבית */}
                  <div className="sx-anim" style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:"18%",left:"-6%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,96,158,.13),transparent 65%)",animation:"sxBlob 18s ease-in-out infinite"}}/>
                    <div style={{position:"absolute",bottom:"-10%",right:"-4%",width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,107,255,.13),transparent 65%)",animation:"sxBlob 22s ease-in-out 3s infinite"}}/>
                    <div style={{position:"absolute",top:"45%",left:"42%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,176,74,.10),transparent 65%)",animation:"sxBlob 20s ease-in-out 6s infinite"}}/>
                    {[["12%","8%",14,0,"#E8B04A"],["70%","6%",11,.7,"#F0609E"],["24%","92%",13,1.2,"#9B6BFF"],["82%","88%",15,.4,"#FF8A65"],["55%","50%",10,1.6,"#9B6BFF"],["88%","40%",12,.9,"#E8B04A"]].map(([top,left,s,d,c],i)=>(
                      <svg key={i} width={s} height={s} viewBox="0 0 20 20" style={{position:"absolute",top,left,animation:`sxTwinkle ${2.4+(i%3)*.7}s ease-in-out ${d}s infinite`}}>
                        <path d="M10 0C10.8 6 14 9.2 20 10C14 10.8 10.8 14 10 20C9.2 14 6 10.8 0 10C6 9.2 9.2 6 10 0Z" fill={c}/>
                      </svg>
                    ))}
                  </div>

                  {/* ─── במה, בר וכניסה  -  ניתנים לגרירה (אלא אם המפה נעולה); המיקום נשמר באירוע ─── */}
                  {(()=>{
                    const FIX={stage:{w:300,h:70},bar:{w:130,h:56},entrance:{w:150,h:34}};
                    // מיקום קבוע: נשמר באירוע, או ברירת מחדל שנקבעה פעם אחת (לא זז כשמזיזים שולחנות)
                    const posOf=fixPos;
                    const radius=(k,p,r)=>`${r}px`;
                    // גרירה חלקה: מזיזים את האלמנט ישירות ושומרים רק בסוף
                    const startDrag=(k,e)=>{
                      if(mapLocked||e.button!==0)return;
                      e.stopPropagation();e.preventDefault();
                      const node=e.currentTarget,s=posOf(k),sx=e.clientX,sy=e.clientY,z=zoomRef.current;let nx=s.x,ny=s.y,raf=0;
                      const mv=me=>{
                        nx=Math.round(s.x+(me.clientX-sx)/z);ny=Math.round(s.y+(me.clientY-sy)/z);
                        if(!raf)raf=requestAnimationFrame(()=>{raf=0;node.style.left=nx+"px";node.style.top=ny+"px";});
                      };
                      const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);
                        if(nx!==s.x||ny!==s.y){const prev=hallRef.current[k];saveHall({...hallRef.current,[k]:{x:nx,y:ny}});
                          pushUndo(`הזזת ${k==="stage"?"הבמה":k==="bar"?"הבר":"הכניסה"}`,()=>saveHall({...hallRef.current,[k]:prev??s}));}};
                      window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
                    };
                    const common=k=>{const p=posOf(k);return {
                      onMouseDown:e=>startDrag(k,e),
                      title:mapLocked?undefined:"גררו כדי להזיז",
                      className:mapLocked?"":"sx-fixture",
                      style:{position:"absolute",left:p.x,top:p.y,width:FIX[k].w,height:FIX[k].h,zIndex:5,userSelect:"none",cursor:mapLocked?"default":"grab"},
                    };};
                    const st=posOf("stage"),br=posOf("bar"),en=posOf("entrance");
                    return(<>
                      <div {...common("stage")} style={{...common("stage").style,background:"linear-gradient(120deg,#FF8A65,#F0609E 50%,#9B6BFF)",borderRadius:radius("stage",st,26),
                        boxShadow:"0 14px 30px -10px rgba(240,96,158,.6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <div style={{position:"absolute",top:7,left:24,right:24,display:"flex",justifyContent:"space-between",pointerEvents:"none"}}>
                          {[0,1,2,3,4,5,6].map(i=>{const c=["#FFF3C4","#FFD3E6","#E6DAFF"][i%3];return <span key={i} className="sx-anim" style={{width:7,height:7,borderRadius:"50%",background:c,boxShadow:`0 0 10px ${c}`,animation:`sxTwinkle ${1.4+(i%3)*.5}s ease-in-out ${i*.18}s infinite`}}/>;})}
                        </div>
                        <div style={{textAlign:"center",marginTop:12,color:"#fff",pointerEvents:"none"}}>
                          <div style={{fontSize:15,fontWeight:900,letterSpacing:1}}>🎤 במה</div>
                          <div style={{fontSize:10,opacity:.85,fontWeight:700}}>חתן · כלה · להקה</div>
                        </div>
                      </div>
                      <div {...common("bar")} style={{...common("bar").style,background:"#fff",border:"1.5px solid #EADFF3",borderRadius:radius("bar",br,18),
                        boxShadow:"0 10px 24px -14px rgba(91,60,140,.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <span style={{fontSize:18,pointerEvents:"none"}}>🥂</span>
                        <span style={{fontSize:12,fontWeight:900,color:C.blue,pointerEvents:"none"}}>בר</span>
                      </div>
                      <div {...common("entrance")} style={{...common("entrance").style,background:"#fff",border:"1.5px solid #EADFF3",borderRadius:radius("entrance",en,16),
                        display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <span style={{fontSize:12,fontWeight:900,color:C.muted,pointerEvents:"none"}}>🚪 כניסה</span>
                      </div>
                    </>);
                  })()}
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
                      setSelected(t.id);
                      if(mapLocked)return; // מפה נעולה: אפשר לבחור שולחן, לא להזיז
                      // גרירה חלקה: מזיזים את העוטף ישירות (בלי לרנדר את כל המסך בכל תזוזה) ושומרים בסוף
                      const node=e.currentTarget.closest("[data-tid]");
                      const sx=e.clientX,sy=e.clientY,bx=t.x,by=t.y,z=zoomRef.current;let posX=bx,posY=by,raf=0;
                      const mv=me=>{
                        posX=Math.round(bx+(me.clientX-sx)/z);posY=Math.round(by+(me.clientY-sy)/z);
                        if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(node){node.style.left=posX+"px";node.style.top=posY+"px";}});
                      };
                      const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);
                        if(posX!==bx||posY!==by){moveTablePos(t.id,posX,posY);saveTablePos(t.id,posX,posY);pushUndo(`הזזת ${t.name}`,()=>restoreTablePos([{id:t.id,x:bx,y:by}]));}};
                      window.addEventListener("mousemove",mv);
                      window.addEventListener("mouseup",up);
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
              );
            })()}
          </div>
          <div style={{padding:"7px 16px",background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",gap:14,fontSize:11,color:C.muted,flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(RELATION_COLORS).map(([k,c])=><span key={k} style={{display:"inline-flex",alignItems:"center",gap:5,fontWeight:700}}><span style={{width:10,height:10,borderRadius:3,background:c}}/>{k}</span>)}
            <span style={{marginRight:"auto"}}>💡 גררו אורח מהרשימה אל שולחן · גררו שולחן כדי להזיז · עמדו על שולחן לראות מי יושב בו</span>
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
              background:"rgba(255,255,255,.97)",backdropFilter:"blur(8px)",border:`1px solid ${C.border}`,borderRadius:18,boxShadow:"0 24px 50px -20px rgba(91,60,140,.45)",zIndex:20,overflow:"hidden"};
            const avatar=g=>(<span style={{width:28,height:28,borderRadius:"50%",background:RELATION_COLORS[g.relation]||C.blueL,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>{g.name[0]}</span>);
            const smallBtn={border:`1px solid ${C.border}`,background:C.blueXL,color:C.blue,borderRadius:8,padding:"4px 7px",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0};
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
                          {g.relation&&<div style={{fontSize:10,color:C.muted}}>{g.relation}</div>}
                        </div>
                        <button onClick={()=>setEditGuestData(g)} title="עריכת אורח" style={smallBtn}>✏️</button>
                        <button onClick={()=>removeFromTable(selTable.id,g)} title="הוצאה מהשולחן" style={{...smallBtn,background:"#FFF2F4",color:C.danger,borderColor:"#F9D2D8"}}>הוצא</button>
                      </div>
                    ))}
                    <div style={{border:`2px dashed ${C.blueL}66`,borderRadius:12,padding:"10px",textAlign:"center",color:C.blue,fontSize:12,fontWeight:800,background:C.blueXL}}>
                      ⬇ שחררו כאן אורח להושבה בשולחן
                    </div>
                  </div>
                  <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`,fontSize:11,color:C.muted,lineHeight:1.5}}>
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
                  <span style={{background:C.gold+"26",color:"#B07A12",borderRadius:100,padding:"1px 9px",fontSize:12}}>{guests.length}</span>
                  <span style={{marginRight:"auto",color:C.muted,fontSize:12}}>{fullListOpen?"▲":"▼"}</span>
                </button>
                {fullListOpen&&(
                  <div style={{overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6}}>
                    {guests.length===0&&<div style={{textAlign:"center",padding:"18px 6px",color:C.success,fontWeight:800,fontSize:13}}>🎉 כולם הושבו!</div>}
                    {guests.map(g=>(
                      <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));}}
                        style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"7px 10px",cursor:"grab"}}>
                        {avatar(g)}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:800,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                          {g.relation&&<div style={{fontSize:10,color:C.muted}}>{g.relation}</div>}
                        </div>
                        <button onClick={()=>setEditGuestData(g)} title="עריכת אורח" style={smallBtn}>✏️</button>
                      </div>
                    ))}
                    <div style={{fontSize:11,color:C.muted,textAlign:"center",padding:"4px 0 2px"}}>💡 לחצו על שולחן כדי לנהל את האורחים שבו</div>
                  </div>
                )}
              </div>
            );
          })()}
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
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
            {tablesNum.map(t=>(
              <Card key={t.id} style={{padding:16,border:`1.5px solid ${selected===t.id?C.blueL:C.border}`}}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{e.preventDefault();const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(t.id,gid,f);}}>
                {/* כותרת שולחן */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                    <span title="מספר שולחן" style={{minWidth:30,height:30,borderRadius:9,background:GRAD,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,flexShrink:0,padding:"0 6px"}}>{t.num}</span>
                    <span style={{fontSize:16}}>{TABLE_TYPES[t.type]?.icon}</span>
                    <span style={{fontWeight:800,fontSize:14,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(t.name||"").replace(/^\s*\d+\s*/,"")||`שולחן ${t.num}`}</span>
                    <button onClick={()=>setEditTableData(t)} title="עריכת שולחן ומספר" style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:2}}>✏️</button>
                  </div>
                  <span style={{background:sColor(t)+"22",color:sColor(t),borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px"}}>{(t.guests||[]).length}/{t.seats}</span>
                </div>
                <div style={{height:4,background:C.blueXL,borderRadius:2,overflow:"hidden",marginBottom:10}}>
                  <div style={{height:"100%",width:`${pct(t)}%`,background:`linear-gradient(90deg,${C.blueM},${C.blueL})`,transition:"width .4s"}}/>
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
                          color:"#C53030",cursor:"pointer",fontSize:10,fontWeight:900,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          flexShrink:0,lineHeight:1,padding:0}}>×</button>
                    </div>
                  ))}
                </div>
                {/* אזור גרירה + drop */}
                {(t.guests||[]).length>0&&(
                  <div style={{border:`2px dashed ${C.border}`,borderRadius:8,padding:"6px",textAlign:"center",color:C.muted,fontSize:11}}>
                    ⬇ שחרר אורח לשולחן זה
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>}
        {view==="guests"&&<div style={{flex:1,overflowY:"auto",padding:20}}>
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            {[{l:"סה״כ",v:total,c:C.blue,i:"👥"},{l:"מוסבים",v:seated,c:C.success,i:"✅"},{l:"ממתינים",v:guests.length,c:C.gold,i:"⏳"},{l:"פנויים",v:tables.reduce((s,t)=>s+t.seats,0)-seated,c:C.blueM,i:"🪑"}].map(({l,v,c,i})=>(
              <Card key={l} style={{padding:"14px 18px",borderTop:`3px solid ${c}`,minWidth:110}}>
                <div style={{fontSize:20,marginBottom:2}}>{i}</div>
                <div style={{fontSize:24,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:3,fontWeight:600}}>{l}</div>
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
                  <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{g.name[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{g.name}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
                      {g.relation&&<span style={{fontSize:10,background:C.blueXL,color:C.blue,borderRadius:100,padding:"1px 6px"}}>{g.relation}</span>}
                      {tbl&&<span style={{fontSize:10,background:"#F0FFF4",color:C.success,borderRadius:100,padding:"1px 6px"}}>🪑 שולחן {numOf(tbl)} · {tbl.name}</span>}
                      <RsvpBadge rsvp={g.rsvp}/>
                    </div>
                  </div>
                  <button onClick={()=>setEditGuestData(g)} style={{background:C.blueXL,border:`1px solid ${C.border}`,color:C.blue,borderRadius:7,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700,flexShrink:0}}>✏️</button>
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
        {screen==="packages"&&<PackagesScreen event={event} onBack={()=>setScreen("home")}/>}
        {screen==="sms"&&<SMSScreen event={event} tables={tables} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
        {screen==="whatsapp"&&<WhatsAppScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
        {screen==="budget"&&<BudgetScreen event={event}/>}
        {screen==="invite"&&<InviteSettings event={event} onUpdate={()=>setScreen("home")}/>}
        {screen==="add"&&<div style={{direction:"rtl"}}><button onClick={()=>setModal("addGuest")} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>➕ הוסף אורח חדש</button>{guests.slice(-10).reverse().map(g=>(<Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:8}}><div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800}}>{g.name[0]}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{g.name}</div>{g.phone&&<div style={{fontSize:11,color:C.muted}}>{g.phone}</div>}</div><RsvpBadge rsvp={g.rsvp}/></Card>))}</div>}
        {screen==="settings"&&<EventDetailsScreen event={event} sb={sb} user={user} onLogout={logout} onUpdate={updateEvent}/>}
        {screen==="user_settings"&&<MobileSettingsScreen user={user} event={event} sb={sb} setGuests={setGuests} setScreen={setScreen}/>}
        {screen==="rsvp"&&<DesktopRsvpTable guests={guests} tables={tables} event={event} sb={sb} loadAll={loadAll} setGuests={setGuests} setTables={setTables} onAddGuest={()=>setModal("addGuest")}/>}
        {screen==="import"&&<div style={{direction:"rtl"}}>
          {/* ייבוא מ-Excel */}
          <div style={{background:C.blueXL,border:`2px dashed ${C.blueL}`,borderRadius:16,padding:24,textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:36,marginBottom:8}}>📊</div>
            <div style={{fontSize:16,fontWeight:800,color:C.blue,marginBottom:4}}>ייבוא מ-Excel</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>קובץ אקסל עם עמודות שם וטלפון (מזהה גם "שם מלא", "שם פרטי"+"שם משפחה", "נייד", "פלאפון")</div>
            <label style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",borderRadius:12,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-block"}}>
              📂 בחר קובץ Excel
              <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={async e=>{
                const file=e.target.files[0];if(!file)return;
                setSaving(true);
                try{
                  const{read,utils}=await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
                  const buf=await file.arrayBuffer();
                  const wb=read(buf);
                  const ws=wb.Sheets[wb.SheetNames[0]];
                  const rows=utils.sheet_to_json(ws);
                  const res=prepareImport(rows.map(parseSheetRow),[...guests,...tables.flatMap(t=>t.guests||[])],event.id);
                  if(res.toInsert.length>0){await sb.from("guests").insert(res.toInsert);await loadAll();}
                  alert(importSummary(res));
                }catch(err){alert("שגיאה בקריאת הקובץ. וודא שיש עמודת 'שם'");}
                setSaving(false);
              }}/>
            </label>
          </div>
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
    {autoSeatModal}
    {/* WhatsApp צף */}
    <a href="https://wa.me/972526817102" target="_blank" rel="noopener"
      style={{position:"fixed",bottom:90,left:24,background:"#25D366",color:"#fff",borderRadius:"50%",width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,.5)",zIndex:200,textDecoration:"none"}}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
    <AccessibilityWidget/>
      </div>{/* end main content */}
    </div>{/* end flex row */}
  </div>);
}

// ─── BUDGET SCREEN ────────────────────────────────────────────────────────────
// ─── DESKTOP RSVP TABLE ───────────────────────────────────────────────────────
// ─── EVENT DETAILS SCREEN ─────────────────────────────────────────────────────
// ─── EVENT DETAILS SCREEN ─────────────────────────────────────────────────────
function EventDetailsScreen({ event, sb, user, onLogout, onUpdate }) {
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
    welcome_text:event.welcome_text||"",
    personal_text:event.personal_text||"",
    name_display:event.name_display||"full",
    invite_image:event.invite_image||"",
    bit_link:event.bit_link||"",
    paybox_link:event.paybox_link||"",
  });
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [myRole,setMyRole]=useState(event.my_role||"groom");
  const [settings,setSettings]=useState({
    confetti: event.settings_json?.confetti??true,
    popupRsvp: event.settings_json?.popupRsvp??false,
    autoRsvp: event.settings_json?.autoRsvp??true,
    tableNum: event.settings_json?.tableNum??true,
    hebrewDate: event.settings_json?.hebrewDate??true,
    countdown: event.settings_json?.countdown??true,
    shareBtn: event.settings_json?.shareBtn??true,
  });

  const save=async()=>{
    setSaving(true);
    await sb.from("events").update({...form,my_role:myRole,settings_json:settings}).eq("id",event.id);
    Object.assign(event,{...form,my_role:myRole,settings_json:settings});
    setSaving(false);setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const hebrewDate=(dateStr)=>{
    if(!dateStr)return "";
    try{const d=new Date(dateStr);return d.toLocaleDateString("he-IL-u-ca-hebrew",{day:"numeric",month:"long",year:"numeric"});}catch{return "";}
  };

  const Field=({label,value,onChange,placeholder,type="text",maxLen,hint})=>(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontSize:12,color:"#718096",fontWeight:700}}>{label}{hint&&<span style={{color:"#aaa",fontWeight:400}}>  -  {hint}</span>}</div>
        {maxLen&&<div style={{fontSize:11,color:"#aaa"}}>{(value||"").length}/{maxLen}</div>}
      </div>
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen}
        style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",color:"#1A202C"}}/>
    </div>
  );

  return(
    <div style={{direction:"rtl",padding:"20px 16px",width:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <div style={{fontSize:22,fontWeight:900,color:"#1A202C"}}>פרטי האירוע שלכם</div>
          <div style={{fontSize:13,color:"#718096"}}>ניתן לערוך ולתקן את פרטי האירוע שלכם</div>
        </div>
        <button onClick={save} disabled={saving}
          style={{background:saved?"#276749":"#2B6CB0",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          {saving?"שומר...":saved?"✓ נשמר!":"עדכון פרטים"}
        </button>
      </div>

      {/* מי אני + שמות */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px",marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:16,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>👫 פרטי בני הזוג</div>

        {/* מי אני */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>מי אני: *</div>
          <div style={{display:"flex",gap:8}}>
            {[["groom","החתן"],["bride","הכלה"]].map(([v,l])=>(
              <button key={v} onClick={()=>setMyRole(v)}
                style={{flex:1,padding:"9px",borderRadius:8,border:`1.5px solid ${myRole===v?"#E53E3E":"#E2E8F0"}`,
                  background:myRole===v?"#E53E3E":"#fff",color:myRole===v?"#fff":"#718096",
                  cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>שם החתן: * <span style={{color:"#aaa",fontWeight:400}}>({(form.groom_name||"").length}/25)</span></div>
            <input value={form.groom_name} onChange={e=>setForm(f=>({...f,groom_name:e.target.value}))} placeholder="עמית" maxLength={25}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>שם הכלה: * <span style={{color:"#aaa",fontWeight:400}}>({(form.bride_name||"").length}/25)</span></div>
            <input value={form.bride_name} onChange={e=>setForm(f=>({...f,bride_name:e.target.value}))} placeholder="אורנה" maxLength={25}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>

        {/* הורים */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:16}}>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>הורי החתן: <span style={{color:"#aaa",fontWeight:400}}>({(form.groom_father||"").length}/75)</span></div>
            <input value={form.groom_father} onChange={e=>setForm(f=>({...f,groom_father:e.target.value}))} placeholder="שמות הורי החתן" maxLength={75}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>הורי הכלה: <span style={{color:"#aaa",fontWeight:400}}>({(form.bride_father||"").length}/75)</span></div>
            <input value={form.bride_father} onChange={e=>setForm(f=>({...f,bride_father:e.target.value}))} placeholder="שמות הורי הכלה" maxLength={75}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      {/* תאריך ושעה */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px",marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:16,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>📅 תאריך האירוע</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>תאריך האירוע</div>
            <DateField value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
            {form.date&&<div style={{fontSize:11,color:"#718096",marginTop:6,fontWeight:600}}>✡️ <span dir="rtl">{hebrewDate(form.date)}</span></div>}
          </div>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>שעת קבלת פנים</div>
            <input type="time" value={form.reception_time} onChange={e=>setForm(f=>({...f,reception_time:e.target.value}))}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>שעת תחילת הטקס</div>
            <input type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      {/* מקום */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px",marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:16,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>📍 מקום האירוע</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:12}}>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>שם מקום האירוע: * <span style={{color:"#aaa",fontWeight:400}}>({(form.venue||"").length}/55)</span></div>
            <input value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} placeholder="אלכסנדר" maxLength={55}
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>כתובת האירוע: *</div>
            <input value={form.venue_address} onChange={e=>setForm(f=>({...f,venue_address:e.target.value}))} placeholder="א.ת. עמק חפר, המסיק 2"
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>מיקום האירוע על גבי מפה:</div>
            <input value={form.venue_map} onChange={e=>setForm(f=>({...f,venue_map:e.target.value}))} placeholder="קישור Waze / Google Maps"
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>מספר טלפון של מקום האירוע:</div>
            <input value={form.venue_phone} onChange={e=>setForm(f=>({...f,venue_phone:e.target.value}))} placeholder="098332266" type="tel"
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      {/* נוסח הזמנה */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px",marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>💌 נוסח להזמנה הדיגיטלית</div>
        <div style={{fontSize:12,color:"#718096",marginBottom:12}}>טקסט זה יחליף את הטקסט ברירת המחדל שיופיע בגוף ההזמנה הדיגיטלית. הטקסט יוצג בתבניות "דיגיטלי" ו"פורטרט" בלבד.</div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
          <div style={{fontSize:12,color:"#718096",fontWeight:700}}>נוסח ההזמנה</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {form.welcome_text?.trim()&&<button onClick={()=>setForm(f=>({...f,welcome_text:""}))}
              style={{fontSize:11,color:"#C53030",background:"#FFF5F5",border:"1px solid #FC8181",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>
              איפוס לברירת מחדל
            </button>}
            <div style={{fontSize:11,color:"#aaa"}}>{(form.welcome_text||"").length}/800</div>
          </div>
        </div>
        <textarea value={form.welcome_text} onChange={e=>setForm(f=>({...f,welcome_text:e.target.value}))} maxLength={800}
          placeholder={"אנו שמחים להזמינכם לחגוג איתנו..."}
          style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:80,resize:"vertical",marginBottom:14}}/>

        <div style={{fontSize:12,color:"#718096",marginBottom:8}}>כדי להדגיש את הכתב בנוסח, הוסיפו 2 כוכביות משני צדי הטקסט ללא רווח, לדוגמה: **טקסט**</div>

        <div style={{marginTop:12}}>
          <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>תצוגת שם אורחת בהזמנה אישית</div>
          <div style={{fontSize:12,color:"#718096",marginBottom:8}}>בחרו האם להציג את שמות האורחים בהזמנה האישית בקישור שהם מקבלים:</div>
          <select value={form.name_display} onChange={e=>setForm(f=>({...f,name_display:e.target.value}))}
            style={{border:"1.5px solid #E2E8F0",borderRadius:10,padding:"9px 14px",fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff",color:"#1A202C",width:"fit-content"}}>
            <option value="full">שם מלא (פרטי + משפחה)</option>
            <option value="first">שם פרטי בלבד</option>
            <option value="none">ללא שם</option>
          </select>
        </div>
      </div>

      {/* העלאת תמונת הזמנה */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px",marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>🖼️ תמונת הזמנה</div>
        <div style={{fontSize:12,color:"#718096",marginBottom:14}}>העלה תמונת הזמנה שתופיע בהזמנה הדיגיטלית. התמונה תוצג מעל הטקסט.</div>

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
          <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,color:C.blue}}>
            📁 העלה מהמחשב
            <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
              const file=e.target.files[0];
              if(!file)return;
              if(file.size>5*1024*1024){alert("הקובץ גדול מדי. מקסימום 5MB");return;}
              const path=`invite_images/${event.id}_${Date.now()}.${file.name.split(".").pop()}`;
              const{error}=await sb.storage.from("event-images").upload(path,file,{upsert:true});
              if(error){alert("שגיאה בהעלאה: "+error.message);return;}
              const{data}=sb.storage.from("event-images").getPublicUrl(path);
              setForm(f=>({...f,invite_image:data.publicUrl}));
            }}/>
          </label>
          <div style={{display:"flex",flex:1,gap:8}}>
            <input value={form.invite_image} onChange={e=>setForm(f=>({...f,invite_image:e.target.value}))}
              placeholder="או הכנס קישור לתמונה (URL)..."
              style={{flex:1,border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          </div>
        </div>
      </div>

      {/* קישורי תשלום  -  Bit / Paybox */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px",marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:4,borderBottom:"1px solid #F7FAFC",paddingBottom:12}}>💝 קישורי מתנה דיגיטלית</div>
        <div style={{fontSize:12,color:"#718096",marginBottom:16}}>הוסף קישור לBit או Paybox  -  יופיע כפתור "תן מתנה" בהזמנה הדיגיטלית.</div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Bit */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#1DB954",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💚</div>
              <div style={{fontSize:13,fontWeight:700,color:"#1A202C"}}>Bit</div>
            </div>
            <input value={form.bit_link} onChange={e=>setForm(f=>({...f,bit_link:e.target.value}))}
              placeholder="https://bit.ly/... או מספר הטלפון"
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>

          {/* Paybox */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#6B46C1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💜</div>
              <div style={{fontSize:13,fontWeight:700,color:"#1A202C"}}>Paybox</div>
            </div>
            <input value={form.paybox_link} onChange={e=>setForm(f=>({...f,paybox_link:e.target.value}))}
              placeholder="https://payboxapp.com/..."
              style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>

        {(form.bit_link||form.paybox_link)&&(
          <div style={{marginTop:14,background:"#F0FFF4",border:"1px solid #9AE6B4",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#276749"}}>
            ✅ כפתור "תן מתנה" יופיע בהזמנה הדיגיטלית
          </div>
        )}
      </div>

      {/* הגדרות נוספות */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px",marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
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
              <div style={{fontSize:12,color:"#718096",marginTop:2}}>{item.desc}</div>
            </div>
            <div onClick={()=>setSettings(s=>({...s,[item.key]:!s[item.key]}))}
              style={{width:44,height:24,borderRadius:12,background:settings[item.key]?"#276749":"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0,marginRight:8}}>
              <div style={{position:"absolute",top:2,right:settings[item.key]?2:18,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"right .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* התנתקות */}
      <div style={{background:"#fff",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 8px rgba(0,0,0,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:"#718096"}}>מחובר כ: <strong>{user.email}</strong></div>
        <button onClick={onLogout}
          style={{background:"#FFF5F5",color:"#C53030",border:"1.5px solid #FEB2B2",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          🚪 התנתק
        </button>
      </div>
    </div>
  );
}
function DesktopRsvpTable({ guests, tables, event, sb, loadAll, setGuests, setTables, onAddGuest }) {
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

  const filtered=allGuests
    .filter(g=>g.name.toLowerCase().includes(search.toLowerCase())||(g.phone&&g.phone.includes(search)))
    .filter(g=>filterRsvp==="all"||g.rsvp===filterRsvp||(filterRsvp==="pending"&&(!g.rsvp||g.rsvp==="pending")));

  const updateRsvp=async(g,rsvp)=>{
    await sb.from("guests").update({rsvp}).eq("id",g.id);
    setGuests(gs=>gs.map(x=>x.id===g.id?{...x,rsvp}:x));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(x=>x.id===g.id?{...x,rsvp}:x)})));
  };

  const saveEdit=async()=>{
    if(!editG)return;
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
    const res=await saveGuestRow(editG.id,{
      name:editG.name,phone:editG.phone,rsvp:editG.rsvp,
      guest_count:editG.guest_count,relation:editG.relation,
      note:editG.note||"",gift:newGift
    });
    if(!res.ok){setSaving(false);return;}
    // סנכרון מתנה לניהול תקציב
    if(newGift!==oldGift){
      const budgetName=`מתנה  -  ${editG.name}`;
      const{data:existing}=await sb.from("budget_items").select("id").eq("event_id",event.id).eq("name",budgetName).maybeSingle();
      if(newGift>0){
        if(existing){
          await sb.from("budget_items").update({amount:newGift}).eq("id",existing.id);
        }else{
          await sb.from("budget_items").insert({name:budgetName,amount:newGift,advance:newGift,type:"income",category:"מתנות",event_id:event.id});
        }
      }else if(existing){
        await sb.from("budget_items").delete().eq("id",existing.id);
      }
    }
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
    <div style={{direction:"rtl",width:"100%",display:"flex",flexDirection:"column"}}>
      {phoneDup&&<PhoneExistsDialog guest={phoneDup} count={dupCount} setCount={setDupCount} busy={saving} onBack={()=>setPhoneDup(null)} onUpdate={updateDupCount}/>}
      {/* כותרת + כפתורים */}
      <div style={{padding:"16px 24px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,color:"#1A202C"}}>אישורי הגעה</div>
          <div style={{fontSize:13,color:"#718096"}}>טבלת ניהול מוזמנים לאירוע</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowCats(s=>!s)}
            style={{background:showCats?"#EBF8FF":"#fff",color:"#2B6CB0",border:"1.5px solid #BEE3F8",borderRadius:10,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            🏷️ קטגוריות
          </button>
          <button onClick={onAddGuest}
            style={{background:"#2B6CB0",color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            ➕ הוסף מוזמנת
          </button>
        </div>
      </div>

      {/* פאנל קטגוריות */}
      {showCats&&(
        <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#1A202C",marginBottom:14}}>🏷️ ניהול קטגוריות קרבה</div>

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
                  }} style={{background:"#276749",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓</button>
                  <button onClick={()=>setEditingCat(null)}
                    style={{background:"#F7FAFC",color:"#718096",border:"1px solid #E2E8F0",borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                </div>
              ) : (
                // תצוגה רגילה
                <div key={name} style={{display:"flex",alignItems:"center",gap:6,background:color+"15",border:`1.5px solid ${color}44`,borderRadius:20,padding:"5px 12px"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:700,color:color}}>{name}</span>
                  <button onClick={()=>setEditingCat({oldName:name,newName:name,color})}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:12,padding:"0 2px",lineHeight:1}}>✏️</button>
                  <button onClick={()=>{const c={...customCats};delete c[name];setCustomCats(c);delete RELATION_COLORS[name];}}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:14,padding:0,lineHeight:1}}>×</button>
                </div>
              )
            ))}
          </div>

          {/* הוספת קטגוריה */}
          <div style={{borderTop:"1px solid #F0F0F0",paddingTop:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#718096",marginBottom:8}}>הוסף קטגוריה חדשה:</div>
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
              }} style={{background:"#2B6CB0",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                + הוסף
              </button>
            </div>
          </div>
        </div>
      )}

      {/* סטטיסטיקות */}
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        {[
          {label:"מגיעים",value:confirmed,color:"#276749",bg:"#F0FFF4",active:filterRsvp==="confirmed",filter:"confirmed"},
          {label:"לא מגיעים",value:declined,color:"#C53030",bg:"#FFF5F5",active:filterRsvp==="declined",filter:"declined"},
          {label:"ממתינים",value:allGuests.filter(g=>!g.rsvp||g.rsvp==="pending").reduce((s,g)=>s+(g.guest_count||1),0),color:"#718096",bg:"#F7FAFC",active:filterRsvp==="pending",filter:"pending"},
          {label:"מוזמנים",value:total,color:"#2C5282",bg:"#EBF8FF",active:filterRsvp==="all",filter:"all"},
        ].map(s=>(
          <div key={s.label} onClick={()=>setFilterRsvp(s.filter)}
            style={{background:s.active?s.color:s.bg,border:`1.5px solid ${s.active?s.color:s.color+"33"}`,borderRadius:10,padding:"10px 16px",flex:1,textAlign:"center",cursor:"pointer",transition:"all .15s"}}>
            <div style={{fontSize:24,fontWeight:900,color:s.active?"#fff":s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:12,color:s.active?"rgba(255,255,255,.8)":s.color,marginTop:3,fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* חיפוש */}
      <div style={{background:"#fff",borderRadius:10,border:"1.5px solid #E2E8F0",padding:"9px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{color:"#999"}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש באישורי הגעה..."
          style={{border:"none",outline:"none",fontSize:14,color:"#1A202C",flex:1,fontFamily:"inherit",background:"transparent"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:16}}>×</button>}
      </div>

      {/* טבלה  -  מקצה לקצה */}
      </div>
      <div style={{background:"#fff",boxShadow:"0 2px 16px rgba(0,0,0,.08)",overflowX:"auto",borderTop:"2px solid #C3D3F5",borderBottom:"2px solid #C3D3F5",width:"100%"}}>
        <table style={{width:"100%",minWidth:960,borderCollapse:"collapse",fontSize:14}}>
          <thead>
            <tr style={{background:"#3A2464",borderBottom:"3px solid #122e70"}}>
              {["שם מלא","הוזמנו","אישרו","מס' נייד","שולחן","קרבה","מתנה","עדכון אחרון","👁","הגעה","פעולות"].map((h,i)=>(
                <th key={h} style={{padding:"13px "+(i===0?"16px":"10px"),textAlign:i===0||i===5?"right":"center",fontWeight:800,color:"#fff",fontSize:13,borderRight:i>0?"1px solid rgba(255,255,255,.15)":"none",whiteSpace:"nowrap"}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={11} style={{padding:32,textAlign:"center",color:"#aaa"}}>אין אורחים</td></tr>}
            {filtered.map((g)=>{
              const relColor=RELATION_COLORS[g.relation];
              const rowBg=relColor?relColor+"18":"#fff";
              const updatedAt=g.updated_at||g.created_at;
              const dateStr=updatedAt?
                new Date(updatedAt).toLocaleDateString("he-IL",{day:"numeric",month:"short",year:"numeric"})
                +" · "+new Date(updatedAt).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})
                :" - ";
              return(
              <tr key={g.id} style={{borderBottom:"2px solid #E2E8F0",background:rowBg,transition:"filter .1s"}}
                onMouseEnter={e=>e.currentTarget.style.filter="brightness(.96)"}
                onMouseLeave={e=>e.currentTarget.style.filter="none"}>
                {/* שם */}
                <td style={{padding:"11px 12px",borderRight:"1px solid #E2E8F0",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:relColor||"#CBD5E0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{g.name[0]}</div>
                    <span style={{fontWeight:700,color:"#1A202C",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</span>
                  </div>
                </td>
                <td style={{padding:"11px 8px",textAlign:"center",fontWeight:800,fontSize:13,color:"#2D3748",borderRight:"1px solid #E2E8F0"}}>{g.guest_count||1}</td>
                <td style={{padding:"12px 10px",textAlign:"center",borderRight:"1px solid #E2E8F0"}}>
                  <span style={{fontWeight:900,fontSize:13,color:g.rsvp==="confirmed"?"#276749":"#CBD5E0"}}>{g.rsvp==="confirmed"?g.guest_count||1:0}</span>
                </td>
                <td style={{padding:"11px 8px",color:"#4A5568",direction:"ltr",textAlign:"right",fontSize:12,fontWeight:600,borderRight:"1px solid #E2E8F0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.phone||" - "}</td>
                <td style={{padding:"12px 10px",textAlign:"center",borderRight:"1px solid #E2E8F0"}}>
                  {getTableNum(g)?<span style={{background:"#3A2464",color:"#fff",borderRadius:5,padding:"2px 7px",fontWeight:800,fontSize:12}}>{getTableNum(g)}</span>:<span style={{color:"#CBD5E0"}}> - </span>}
                </td>
                <td style={{padding:"11px 8px",borderRight:"1px solid #E2E8F0",overflow:"hidden"}}>
                  {g.relation&&<span style={{display:"inline-flex",alignItems:"center",gap:3,background:(relColor||"#CBD5E0")+"25",border:`1.5px solid ${relColor||"#CBD5E0"}66`,borderRadius:20,padding:"2px 7px",fontSize:12,fontWeight:700,color:relColor||"#718096",whiteSpace:"nowrap"}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:relColor||"#CBD5E0",display:"inline-block",flexShrink:0}}/>{g.relation}
                  </span>}
                </td>
                <td style={{padding:"12px 10px",textAlign:"center",borderRight:"1px solid #E2E8F0"}}>
                  {g.gift&&g.gift>0?<span style={{background:"#FFFFF0",color:"#B7791F",border:"1.5px solid #FAF089",borderRadius:5,padding:"2px 6px",fontWeight:800,fontSize:12}}>₪{g.gift}</span>:<span style={{color:"#CBD5E0",fontSize:10}}> - </span>}
                </td>
                <td style={{padding:"11px 8px",color:"#718096",fontSize:11,textAlign:"center",whiteSpace:"nowrap",borderRight:"1px solid #E2E8F0",overflow:"hidden",textOverflow:"ellipsis"}}>{dateStr}</td>
                <td style={{padding:"12px 10px",textAlign:"center",borderRight:"1px solid #E2E8F0"}}>
                  <span style={{color:"#718096",fontSize:11}}>{g.views||0}</span>
                </td>
                <td style={{padding:"11px 6px",borderRight:"1px solid #E2E8F0"}}>
                  <select value={g.rsvp||"pending"} onChange={async e=>await updateRsvp(g,e.target.value)}
                    style={{border:`1.5px solid ${g.rsvp==="confirmed"?"#9AE6B4":g.rsvp==="declined"?"#FEB2B2":"#CBD5E0"}`,
                      background:g.rsvp==="confirmed"?"#F0FFF4":g.rsvp==="declined"?"#FFF5F5":"#F7FAFC",
                      color:g.rsvp==="confirmed"?"#276749":g.rsvp==="declined"?"#C53030":"#718096",
                      borderRadius:6,padding:"4px 3px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",outline:"none",width:"100%"}}>
                    <option value="pending">לא הופצה</option>
                    <option value="confirmed">מגיעה ✓</option>
                    <option value="declined">לא מגיעה ✗</option>
                  </select>
                </td>
                <td style={{padding:"11px 6px"}}>
                  <div style={{display:"flex",gap:3}}>
                    <button onClick={()=>setEditG({...g})} style={{background:"#EBF8FF",color:"#2B6CB0",border:"1.5px solid #BEE3F8",borderRadius:5,padding:"4px 7px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
                    <button onClick={()=>deleteGuest(g)} style={{background:"#FFF5F5",color:"#C53030",border:"1.5px solid #FED7D7",borderRadius:5,padding:"4px 5px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑️</button>
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        <div style={{padding:"12px 16px",borderTop:"2px solid #E2E8F0",fontSize:13,color:"#718096",textAlign:"center",background:"#F7FAFC",fontWeight:600}}>
          מציג {filtered.length} מתוך {allGuests.length} אורחים
        </div>
      </div>

      {/* מקרא קטגוריות */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14,padding:"0 24px 16px"}}>
        {Object.entries(RELATION_COLORS).map(([rel,col])=>(
          <div key={rel} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#718096"}}>
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
              <div style={{border:"1.5px solid #E2E8F0",borderRadius:20,padding:"5px 16px",fontSize:13,fontWeight:700,color:"#1A202C"}}>עריכת מוזמנת</div>
              <button onClick={()=>setEditG(null)} style={{background:"#F7FAFC",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,color:"#718096",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>

            {/* שם */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>שם המוזמנת:</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input value={editG.name?.split(" ").slice(1).join(" ")||""} 
                  onChange={e=>setEditG(g=>({...g,name:(g.name?.split(" ")[0]||"")+" "+e.target.value}))}
                  placeholder="שם משפחה"
                  style={{border:"none",borderBottom:"1.5px solid #E2E8F0",padding:"8px 0",fontSize:15,outline:"none",fontFamily:"inherit",textAlign:"right"}}/>
                <input value={editG.name?.split(" ")[0]||""} 
                  onChange={e=>setEditG(g=>({...g,name:e.target.value+" "+(g.name?.split(" ").slice(1).join(" ")||"")}))}
                  placeholder="שם פרטי"
                  style={{border:"none",borderBottom:"1.5px solid #E2E8F0",padding:"8px 0",fontSize:15,outline:"none",fontFamily:"inherit",textAlign:"right"}}/>
              </div>
            </div>

            {/* טלפון + כמות */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>הנייד שלהם:</div>
                <input value={editG.phone||""} onChange={e=>setEditG(g=>({...g,phone:e.target.value}))} type="tel"
                  style={{width:"100%",border:"none",borderBottom:"1.5px solid #E2E8F0",padding:"8px 0",fontSize:15,outline:"none",fontFamily:"inherit",direction:"ltr",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>כמות אורחים:</div>
                <div style={{display:"flex",alignItems:"center",gap:10,border:"1.5px solid #E2E8F0",borderRadius:8,padding:"6px 12px"}}>
                  <button onClick={()=>setEditG(g=>({...g,guest_count:Math.max(1,(g.guest_count||1)-1)}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,fontWeight:700,color:"#2B6CB0"}}>−</button>
                  <span style={{flex:1,textAlign:"center",fontSize:16,fontWeight:800}}>{editG.guest_count||1}</span>
                  <button onClick={()=>setEditG(g=>({...g,guest_count:(g.guest_count||1)+1}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,fontWeight:700,color:"#2B6CB0"}}>+</button>
                </div>
              </div>
            </div>

            {/* קרבה */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>קטגוריית קרבה:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {RELATIONS.map(r=>(
                  <button key={r} onClick={()=>setEditG(g=>({...g,relation:r}))}
                    style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      border:`1.5px solid ${editG.relation===r?RELATION_COLORS[r]||"#E53E3E":"#E2E8F0"}`,
                      background:editG.relation===r?RELATION_COLORS[r]||"#E53E3E":"#fff",
                      color:editG.relation===r?"#fff":"#718096",transition:"all .15s"}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* מצב הגעה */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:8}}>מצב הגעה:</div>
              <select value={editG.rsvp||"pending"} onChange={e=>setEditG(g=>({...g,rsvp:e.target.value}))}
                style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff"}}>
                <option value="pending">לא הופצה הזמנה</option>
                <option value="confirmed">מגיעה</option>
                <option value="declined">לא מגיעה</option>
              </select>
            </div>

            {/* מתנה + הערה */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <div>
                <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>מתנה ₪</div>
                <input type="number" value={editG.gift||0} onChange={e=>setEditG(g=>({...g,gift:e.target.value}))} min={0}
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:6}}>הערה</div>
                <input value={editG.note||""} onChange={e=>setEditG(g=>({...g,note:e.target.value}))} placeholder="הערה..."
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={saveEdit} disabled={saving}
                style={{flex:2,background:"#2B6CB0",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {saving?"שומר...":"עדכון פרטים"}
              </button>
              <button onClick={()=>setEditG(null)}
                style={{flex:1,background:"#F7FAFC",color:"#718096",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ביטול וחזרה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function BudgetScreen({ event }) {
  const CATS=["אולם","קייטרינג","צילום","מוזיקה","פרחים","הלבשה","הסעות","מתנות","אחר"];
  const CAT_COLORS={"אולם":"#3182CE","קייטרינג":"#DD6B20","צילום":"#805AD5","מוזיקה":"#D69E2E","פרחים":"#38A169","הלבשה":"#D53F8C","הסעות":"#319795","מתנות":"#E53E3E","אחר":"#718096"};
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [form,setForm]=useState({name:"",amount:"",advance:"0",type:"expense",category:"אחר",note:""});
  const [saving,setSaving]=useState(false);
  const [filterType,setFilterType]=useState("all");

  useEffect(()=>{
    sb.from("budget_items").select("*").eq("event_id",event.id).order("created_at",{ascending:false})
      .then(({data,error})=>{
        if(error)console.error("budget_items error:",error.message);
        setItems(data||[]);setLoading(false);
      });
  },[]);

  const totalExpenses=items.filter(i=>i.type==="expense").reduce((s,i)=>s+Number(i.amount||0),0);
  const totalIncome=items.filter(i=>i.type==="income").reduce((s,i)=>s+Number(i.amount||0),0);
  const guestIncome=items.filter(i=>i.type==="income"&&i.category==="מתנות").reduce((s,i)=>s+Number(i.amount||0),0);
  const profit=totalIncome-totalExpenses;

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

  const filtered=items.filter(i=>filterType==="all"||i.type===filterType);

  if(loading)return<div style={{padding:40,textAlign:"center"}}><Spinner size={32}/></div>;

  return(
    <div style={{direction:"rtl",width:"100%"}}>
      <div style={{padding:"16px 16px 0"}}>
      {/* כותרת */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,color:"#1A202C"}}>ניהול תקציב</div>
          <div style={{fontSize:13,color:"#718096"}}>מעקב הכנסות והוצאות לאירוע</div>
        </div>
        <button onClick={()=>{setEditItem(null);setForm({name:"",amount:"",advance:"0",type:"expense",category:"אחר",note:""});setShowForm(true);}}
          style={{background:"#2B6CB0",color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          ➕ הוסף פריט
        </button>
      </div>

      {/* סטטיסטיקות */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        {[
          {label:"רווח / הפסד",value:profit,color:profit>=0?"#276749":"#C53030",bg:profit>=0?"#F0FFF4":"#FFF5F5",prefix:"₪"},
          {label:"סה״כ הוצאות",value:totalExpenses,color:"#C53030",bg:"#FFF5F5",prefix:"₪"},
          {label:"סה״כ הכנסות",value:totalIncome,color:"#276749",bg:"#F0FFF4",prefix:"₪"},
          {label:"הכנסות מאורחים",value:guestIncome,color:"#2C5282",bg:"#EBF8FF",prefix:"₪"},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,border:`1.5px solid ${s.color}33`,borderRadius:12,padding:"14px 18px",flex:1,minWidth:140,textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:900,color:s.color,lineHeight:1}}>{s.prefix}{s.value.toLocaleString()}</div>
            <div style={{fontSize:12,color:s.color,marginTop:4,fontWeight:600,opacity:.8}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* פילטר */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["all","הכל"],["expense","הוצאות"],["income","הכנסות"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilterType(v)}
            style={{background:filterType===v?"#3A2464":"#fff",color:filterType===v?"#fff":"#2B6CB0",border:"2px solid #BEE3F8",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {l}
          </button>
        ))}
      </div>

      {/* טבלה */}
      <div style={{background:"#fff",boxShadow:"0 2px 16px rgba(0,0,0,.08)",overflowX:"auto",borderTop:"2px solid #C3D3F5",borderBottom:"2px solid #C3D3F5",width:"100%"}}>
        <table style={{width:"100%",minWidth:320,borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:"#3A2464",borderBottom:"3px solid #122e70"}}>
              <th style={{padding:"10px 12px",textAlign:"right",fontWeight:800,color:"#fff",fontSize:12}}>מוצר</th>
              <th style={{padding:"10px 8px",textAlign:"center",fontWeight:800,color:"#fff",fontSize:12,borderRight:"1px solid rgba(255,255,255,.15)"}}>סכום</th>
              <th style={{padding:"10px 8px",textAlign:"center",fontWeight:800,color:"#fff",fontSize:12,borderRight:"1px solid rgba(255,255,255,.15)"}}>נשאר</th>
              <th style={{padding:"10px 8px",textAlign:"center",fontWeight:800,color:"#fff",fontSize:12}}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&(
              <tr><td colSpan={4} style={{padding:"40px",textAlign:"center",color:"#aaa",fontSize:14}}>אין נתונים בטבלה</td></tr>
            )}
            {filtered.map(item=>{
              const catColor=CAT_COLORS[item.category]||"#718096";
              const remain=Number(item.amount||0)-Number(item.advance||0);
              return(
                <tr key={item.id} style={{borderBottom:"1px solid #E2E8F0",background:catColor+"10",transition:"filter .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.filter="brightness(.96)"}
                  onMouseLeave={e=>e.currentTarget.style.filter="none"}>
                  <td style={{padding:"10px 12px",borderRight:"1px solid #E2E8F0",maxWidth:150}}>
                    <div style={{fontWeight:800,color:"#1A202C",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                    <div style={{fontSize:10,color:item.type==="expense"?"#C53030":"#276749",marginTop:1,fontWeight:700}}>{item.type==="expense"?"הוצאה":"הכנסה"} · {item.category}</div>
                  </td>
                  <td style={{padding:"10px 8px",textAlign:"center",fontWeight:800,fontSize:13,color:item.type==="expense"?"#C53030":"#276749",borderRight:"1px solid #E2E8F0"}}>
                    ₪{Number(item.amount||0).toLocaleString()}
                  </td>
                  <td style={{padding:"10px 8px",textAlign:"center",fontWeight:700,fontSize:13,borderRight:"1px solid #E2E8F0"}}>
                    {remain>0?<span style={{color:"#C53030",fontWeight:800}}>₪{remain.toLocaleString()}</span>:<span style={{color:"#276749",fontWeight:800}}>✓</span>}
                  </td>
                  <td style={{padding:"10px 8px"}}>
                    <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                      <button onClick={()=>{setEditItem(item);setForm({name:item.name,amount:String(item.amount),advance:String(item.advance||0),type:item.type,category:item.category,note:item.note||""});setShowForm(true);}}
                        style={{background:"#EBF8FF",color:"#2B6CB0",border:"1px solid #BEE3F8",borderRadius:6,padding:"5px 10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
                      <button onClick={()=>deleteItem(item.id)}
                        style={{background:"#FFF5F5",color:"#C53030",border:"1px solid #FED7D7",borderRadius:6,padding:"5px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:"12px 16px",borderTop:"2px solid #E2E8F0",fontSize:13,color:"#718096",textAlign:"center",background:"#F7FAFC",fontWeight:600}}>
          מציג {filtered.length} מתוך {items.length} שורות
        </div>
      </div>

      {/* מודל הוספה/עריכה */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setShowForm(false);setEditItem(null);}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:460,maxWidth:"95vw",direction:"rtl",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:17,fontWeight:900,color:"#1A202C"}}>{editItem?"✏️ עריכת פריט":"➕ הוסף פריט תקציב"}</div>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{background:"#F7FAFC",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,color:"#718096"}}>×</button>
            </div>

            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:5}}>מוצר / שירות *</div>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="לדוגמה: אולמי הגן"
                style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:5}}>סוג</div>
                <div style={{display:"flex",gap:6}}>
                  {[["expense","הוצאה"],["income","הכנסה"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setForm(f=>({...f,type:v}))}
                      style={{flex:1,padding:"8px",borderRadius:8,border:`1.5px solid ${form.type===v?(v==="expense"?"#FEB2B2":"#9AE6B4"):"#E2E8F0"}`,
                        background:form.type===v?(v==="expense"?"#FFF5F5":"#F0FFF4"):"#fff",
                        color:form.type===v?(v==="expense"?"#C53030":"#276749"):"#718096",
                        cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:5}}>קטגוריה</div>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff"}}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:5}}>סכום כולל ₪</div>
                <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0"
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:5}}>מקדמה ששולמה ₪</div>
                <input type="number" value={form.advance} onChange={e=>setForm(f=>({...f,advance:e.target.value}))} placeholder="0"
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,color:"#718096",fontWeight:700,marginBottom:5}}>הערה</div>
              <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="הערות נוספות..."
                style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:60,resize:"vertical"}}/>
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={saveItem} disabled={saving||!form.name.trim()||!form.amount}
                style={{flex:2,background:"#2B6CB0",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {saving?"שומר...":editItem?"עדכן פריט":"הוסף פריט ✓"}
              </button>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}}
                style={{flex:1,background:"#F7FAFC",color:"#718096",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
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
function ContactsScreen({ event, onAdd }) {
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
              {selected.has(c.id)?"✓":c.name[0]}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{c.name}</div>
              {c.phone&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{c.phone}</div>}
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
function PackagesScreen({ event, onBack }) {
  const [selectedPkg,setSelectedPkg]=useState(null);
  const [selectedTier,setSelectedTier]=useState(null); // לחבילות עם מחיר לפי כמות

  const TIER5=[["עד 50",80],["עד 100",120],["עד 150",180],["עד 200",240],["עד 250",280],["עד 300",340],["עד 350",390],["עד 400",430],["עד 450",480],["עד 500",520],["עד 550",560],["עד 600",600],["עד 650",630],["עד 700",660],["עד 750",690],["עד 800",720]];
  const TIER6=[["עד 100",250],["עד 150",370],["עד 200",480],["עד 250",590],["עד 300",690],["עד 350",790],["עד 400",880],["עד 450",970],["עד 500",1050],["עד 550",1130],["עד 600",1200],["עד 650",1300],["עד 700",1400],["עד 750",1500],["עד 800",1600]];

  const packages=[
    {
      id:"free", name:"חינם", price:0, priceLabel:"₪0", color:"#64748B", icon:"🎁",
      badge:null, featured:false,
      desc:"התחל בחינם, שתף ידנית",
      features:["✅ הזמנה דיגיטלית יפה","✅ שיתוף ידני בוואטסאפ","❌ אישורי הגעה אוטומטיים","❌ שליחת SMS","❌ WhatsApp אוטומטי","❌ סידורי הושבה"],
    },
    {
      id:"basic", name:"בסיסית", price:50, priceLabel:"₪50", color:"#3182CE", icon:"💌",
      badge:null, featured:false,
      desc:"הזמנה + אישורי הגעה",
      features:["✅ הזמנה דיגיטלית יפה","✅ שיתוף ידני + קישור אישי","✅ אישורי הגעה דרך WhatsApp האישי","✅ עדכון בזמן אמת","❌ שליחה אוטומטית","❌ סידורי הושבה"],
    },
    {
      id:"seating", name:"מתקדמת", price:150, priceLabel:"₪150", color:C.blue, icon:"🪑",
      badge:"פופולרי", featured:true,
      desc:"הכל + סידורי הושבה",
      features:["✅ כל מה שבבסיסית","✅ סידורי הושבה מלאים","✅ מפה אינטראקטיבית של האולם","✅ גרירת אורחים לשולחנות","✅ פתק הושבה להדפסה","✅ AI סידור חכם"],
    },
    {
      id:"sms", name:"SMS", price:null, priceLabel:"לפי כמות", color:"#059669", icon:"📱",
      badge:"תוספת", featured:false,
      desc:"דורש חבילה מתקדמת + ₪100",
      note:"דורש חבילת מתקדמת (₪150). תוספת ₪100 לסידורי הושבה.",
      smsPacks:[[150,70],[300,90],[500,120],[800,170],[1000,200],[2000,330]],
      features:["✅ כל מה שבמתקדמת","✅ שליחת SMS לכל האורחים","✅ תזכורות לפני האירוע","✅ מספר שולחן ב-SMS ביום האירוע","✅ הודעת תודה אחרי האירוע"],
    },
    {
      id:"auto", name:"אוטומציה", price:null, priceLabel:"לפי כמות", color:"#25D366", icon:"💬",
      badge:"חדש", featured:false,
      desc:"WhatsApp אוטומטי + SMS",
      note:"דורש חבילת מתקדמת (₪150). תוספת ₪100 לסידורי הושבה.",
      tiers:TIER5,
      features:["✅ כל מה שבמתקדמת","✅ 2 סבבי שליחה בוואטסאפ אוטומטי","✅ תזכורת SMS לקראת האירוע","✅ הודעת תודה אחרי האירוע","✅ שליחה אוטומטית לאורחים שלא ענו"],
    },
    {
      id:"staff", name:"צוות הושבה", price:1300, priceLabel:"החל מ ₪1,300", color:"#7C3AED", icon:"👥",
      badge:"שירות פרימיום", featured:false,
      desc:"2 אנשי צוות ביום האירוע",
      features:["✅ 2 אנשי צוות מקצועיים ביום האירוע","✅ חלוקת פתקי הושבה לאורחים","✅ ניהול תורים בכניסה","✅ תיאום מול צוות האולם","✅ צמצום עומס ברזרבות","⚠️ תיתכן תוספת מרחק"],
    },
    {
      id:"vip", name:"VIP + מוקד", price:null, priceLabel:"לפי כמות", color:"#B45309", icon:"👑",
      badge:"VIP", featured:false,
      desc:"הכל + שיחות טלפוניות",
      tiers:TIER6,
      features:["✅ כל מה שבאוטומציה","✅ 3 סבבי שיחות טלפוניות ע\"י מוקד אנושי","✅ סבב שיחות חוזרות לאורחים שטרם אישרו","✅ דוח מפורט של כל השיחות","✅ תמיכה ייעודית"],
    },
  ];

  const handleBuy=(pkg)=>{
    if(pkg.id==="free") return;
    let msg=`לרכישת חבילת "${pkg.name}"`;
    if(selectedTier) msg+=` - ${selectedTier[0]} רשומות - ₪${selectedTier[1].toLocaleString()}`;
    else if(pkg.price) msg+=` - ₪${pkg.price}`;
    window.open(`https://wa.me/972526817102?text=${encodeURIComponent("שלום, אני מעוניין "+msg)}`, "_blank");
  };

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:80}}>

      {/* כותרת */}
      <div style={{background:"linear-gradient(120deg,#F0609E,#9B6BFF)",padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",backgroundSize:"12px 12px"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:4}}>שדרג את האירוע שלך</div>
          <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>📦 חבילות Sidor-IL</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.65)",marginTop:6}}>בחר את החבילה שמתאימה לך</div>
        </div>
      </div>

      <div style={{padding:16}}>
        {packages.map((pkg)=>{
          const isOpen=selectedPkg?.id===pkg.id;
          return(
            <div key={pkg.id}
              style={{background:"#fff",border:`2px solid ${isOpen?pkg.color:pkg.featured?"#CBD5E0":"#E2E8F0"}`,
                borderRadius:18,marginBottom:12,overflow:"hidden",
                boxShadow:isOpen?`0 4px 20px ${pkg.color}33`:pkg.featured?"0 2px 12px rgba(0,0,0,.08)":"none",
                transition:"all .2s"}}>

              {/* ראש כרטיס */}
              <div onClick={()=>{setSelectedPkg(isOpen?null:pkg);setSelectedTier(null);}}
                style={{padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                {pkg.badge&&<div style={{position:"absolute",fontSize:10,fontWeight:800,background:pkg.color,color:"#fff",padding:"2px 8px",borderRadius:100}}/>}
                <div style={{width:46,height:46,borderRadius:13,background:pkg.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
                  {pkg.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontWeight:900,fontSize:15,color:"#1a1a1a"}}>{pkg.name}</div>
                    {pkg.badge&&<span style={{fontSize:10,fontWeight:800,background:pkg.color,color:"#fff",padding:"2px 8px",borderRadius:100}}>{pkg.badge}</span>}
                    {pkg.featured&&<span style={{fontSize:10,fontWeight:800,background:"#FEF3C7",color:"#B45309",padding:"2px 8px",borderRadius:100}}>⭐ הכי פופולרי</span>}
                  </div>
                  <div style={{fontSize:12,color:"#888",marginTop:2}}>{pkg.desc}</div>
                </div>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:900,color:pkg.color}}>{pkg.priceLabel}</div>
                  {pkg.price===0&&<div style={{fontSize:10,color:"#888"}}>תמיד</div>}
                </div>
              </div>

              {/* תוכן מורחב */}
              {isOpen&&(
                <div style={{padding:"0 16px 16px",borderTop:"1px solid #f0f0f0"}}>

                  {/* הערה לחבילות שדורשות מתקדמת */}
                  {pkg.note&&(
                    <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"10px 12px",marginBottom:14,marginTop:14,fontSize:12,color:"#B45309",fontWeight:700}}>
                      ⚠️ {pkg.note}
                    </div>
                  )}

                  {/* פיצ'רים */}
                  <div style={{marginTop:pkg.note?0:14,marginBottom:16}}>
                    {pkg.features.map(f=>(
                      <div key={f} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:f.startsWith("❌")?"#999":"#1a1a1a",marginBottom:7,textDecoration:f.startsWith("❌")?"line-through":"none"}}>
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* בחירת כמות לחבילות אוטומציה ו-VIP */}
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

                  {/* בחירת כמות SMS */}
                  {pkg.smsPacks&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:8}}>בחר כמות SMS:</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                        {pkg.smsPacks.map(([sms,price])=>(
                          <div key={sms} onClick={e=>{e.stopPropagation();setSelectedTier(selectedTier?.[0]===sms?null:[sms,price]);}}
                            style={{border:`1.5px solid ${selectedTier?.[0]===sms?pkg.color:"#E2E8F0"}`,borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"pointer",background:selectedTier?.[0]===sms?pkg.color+"11":"#fff"}}>
                            <div style={{fontSize:14,fontWeight:800,color:pkg.color}}>{sms.toLocaleString()}</div>
                            <div style={{fontSize:9,color:"#888",marginBottom:2}}>SMS</div>
                            <div style={{fontSize:12,fontWeight:700,color:"#333"}}>₪{price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* כפתור */}
                  {pkg.id==="free"?(
                    <div style={{background:"#F0FFF4",border:"1px solid #9AE6B4",borderRadius:12,padding:"12px",textAlign:"center",fontSize:13,color:"#276749",fontWeight:700}}>
                      ✅ אתה משתמש בחבילה זו כעת
                    </div>
                  ):(
                    <button onClick={e=>{e.stopPropagation();handleBuy(pkg);}}
                      disabled={!!(pkg.tiers||pkg.smsPacks)&&!selectedTier}
                      style={{width:"100%",background:(pkg.tiers||pkg.smsPacks)&&!selectedTier?"#E2E8F0":`linear-gradient(135deg,${pkg.color},${pkg.color}CC)`,
                        color:(pkg.tiers||pkg.smsPacks)&&!selectedTier?"#999":"#fff",
                        border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,
                        cursor:(pkg.tiers||pkg.smsPacks)&&!selectedTier?"not-allowed":"pointer",fontFamily:"inherit",
                        display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      {(pkg.tiers||pkg.smsPacks)&&!selectedTier?"בחר כמות רשומות תחילה":"💬 פנה לרכישה בוואטסאפ"}
                      {selectedTier&&` - ₪${selectedTier[1].toLocaleString()}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* תשלום */}
        <div style={{background:"#EEF2FF",border:"1px solid #E9D9F7",borderRadius:14,padding:"14px 16px",textAlign:"center",marginTop:8}}>
          <div style={{fontSize:12,color:"#555",marginBottom:4}}>💳 תשלום מאובטח</div>
          <div style={{fontSize:11,color:"#888"}}>Apple Pay · Google Pay · Bit · Visa · Mastercard</div>
        </div>
      </div>
    </div>
  );
}

// ─── SMS SCREEN ───────────────────────────────────────────────────────────────
// ─── תזמון שליחות (SMS / וואטסאפ) ─────────────────────────────────────────────
// 4 תזמוני ברירת מחדל לפי תאריך האירוע + תזמונים נוספים שהמשתמש מוסיף.
// הכול נשמר באירוע: settings_json.sms_schedule / settings_json.wa_schedule
const SCHEDULE_DEFAULTS=[
  {id:"d0",offset:-11,label:"שבוע וחצי לפני",desc:"הזמנה ראשונה",time:"10:00",icon:"💌",templateId:"invite"},
  {id:"d1",offset:-4,label:"4 ימים לפני",desc:"תזכורת לממתינים",time:"10:00",icon:"🔔",templateId:"reminder"},
  {id:"d2",offset:0,label:"ביום האירוע",desc:"מספר שולחן",time:"09:00",icon:"🎉",templateId:"table"},
  {id:"d3",offset:2,label:"יומיים אחרי",desc:"הודעת תודה",time:"10:00",icon:"💙",templateId:"thanks"},
];
// SMS בלבד: שליחה אוטומטית ע"י sms-scheduler בשרת (כל 5 דקות). הנמענים לפי הנוסח — כמו recipientsFor בשרת
const SCHEDULE_TO={invite:"כל האורחים",reminder:"ממתינים לאישור",table:"מגיעים ששובצו לשולחן",thanks:"מגיעים"};
const SCHEDULE_LATE_HOURS=12;
function ScheduleEditor({ event, storeKey, templates, accent, onPickTemplate, auto=false }) {
  const eventD=event.date?new Date(event.date):null;
  // סטטוס שליחה אוטומטית לכל תזמון
  const [runs,setRuns]=useState({});
  const loadRuns=async()=>{
    if(!auto)return;
    const{data}=await sb.from("sms_schedule_runs").select("schedule_id,status,recipients,units,error,finished_at,created_at").eq("event_id",event.id);
    setRuns(Object.fromEntries((data||[]).map(r=>[r.schedule_id,r])));
  };
  useEffect(()=>{loadRuns().catch(()=>{});const iv=auto?setInterval(()=>loadRuns().catch(()=>{}),60000):null;return()=>iv&&clearInterval(iv);},[event.id,auto]);
  const autoStatus=s=>{
    const r=runs[s.id];
    const fmt=t=>new Date(t).toLocaleString("he-IL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    if(r?.status==="sent")return{c:C.success,bg:"#EFFAF3",t:`✓ נשלח אוטומטית ${fmt(r.finished_at||r.created_at)} ל-${r.recipients} אורחים (${r.units} SMS)`};
    if(r?.status==="failed")return{c:C.danger,bg:"#FFF2F4",t:`✗ לא נשלח: ${r.error||"שגיאה"}. אפשר לשלוח ידנית למטה.`};
    if(r?.status==="skipped")return{c:"#8A5A00",bg:"#FFF8E8",t:`⏭ דולג: ${r.error||""}`};
    if(r?.status==="sending")return{c:C.blue,bg:"#F4EEFC",t:"⏳ שולח עכשיו…"};
    if(!s.enabled)return null;
    const to=SCHEDULE_TO[s.templateId]||SCHEDULE_TO.invite;
    if(!s.date||!s.time)return{c:"#8A5A00",bg:"#FFF8E8",t:"⚠️ חסר תאריך או שעה — לא יישלח"};
    const due=new Date(`${s.date}T${s.time}:00`);
    if(due>new Date())return{c:C.blue,bg:"#F4EEFC",t:`🤖 יישלח אוטומטית אל: ${to}`};
    if(Date.now()-due<SCHEDULE_LATE_HOURS*3600e3)return{c:C.blue,bg:"#F4EEFC",t:`⏳ יישלח בדקות הקרובות אל: ${to}`};
    return{c:"#8A5A00",bg:"#FFF8E8",t:"⚠️ המועד עבר — לא יישלח אוטומטית. שנה מועד או שלח ידנית."};
  };
  const calcDate=off=>{if(!eventD)return "";const d=new Date(eventD);d.setDate(d.getDate()+off);return d.toISOString().split("T")[0];};
  // מיזוג: ברירות מחדל + מה שנשמר (שינויי זמן/הפעלה) + תזמונים נוספים
  const build=()=>{
    const saved=event.settings_json?.[storeKey]||[];
    const byId=Object.fromEntries(saved.map(s=>[s.id,s]));
    const base=SCHEDULE_DEFAULTS.map(d=>({...d,date:calcDate(d.offset),enabled:false,...(byId[d.id]||{})}));
    const extra=saved.filter(s=>s.custom);
    return [...base,...extra];
  };
  const [items,setItems]=useState(build);
  const [editing,setEditing]=useState(false);
  const [status,setStatus]=useState(""); // "", "saving", "saved", "error"
  useEffect(()=>{setItems(build());},[event.id]);

  const persist=async next=>{
    setStatus("saving");
    // שומרים רק את מה שצריך: מזהה, זמן, הפעלה, ולתזמונים נוספים גם תווית ותבנית
    const payload=next.map(s=>s.custom?{id:s.id,custom:true,label:s.label,icon:s.icon,desc:s.desc,templateId:s.templateId,date:s.date,time:s.time,enabled:s.enabled}
      :{id:s.id,templateId:s.templateId,date:s.date,time:s.time,enabled:s.enabled});
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
  const inp={width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"7px 8px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff"};

  return(
    <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text}}>⏰ תזמון שליחות</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {status==="saving"&&<span style={{fontSize:11,color:C.muted}}>שומר…</span>}
          {status==="saved"&&<span style={{fontSize:11,color:C.success,fontWeight:800}}>✓ נשמר</span>}
          <button onClick={()=>editing?save():setEditing(true)} className="sx-btn"
            style={{background:editing?accent:"#F7F1FD",color:editing?"#fff":C.blue,border:`1px solid ${editing?accent:C.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
            {editing?"💾 שמור תזמונים":"✏️ ערוך תזמונים"}
          </button>
        </div>
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:-4,marginBottom:10,lineHeight:1.6}}>
        {auto?"🤖 תזמון פעיל נשלח אוטומטית במועד (שעון ישראל), פעם אחת, וכל אורח = 1 מהיתרה. ודאו שיש מספיק יתרה.":"🔔 תזכורת בלבד: הודעות וואטסאפ לא נשלחות אוטומטית, צריך לשלוח אותן מכאן במועד."}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {items.map(s=>{
          const d=s.date?new Date(s.date+"T00:00:00"):null;
          const disp=d?d.toLocaleDateString("he-IL",{weekday:"short",day:"numeric",month:"short"}):"לא הוגדר";
          const tpl=templates.find(t=>t.id===s.templateId);
          const preview=tpl?tpl.text.replace(/{שם}/g,"[שם האורח]").replace(/{קישור}/g,"[קישור]").replace(/{שולחן}/g,"[מס' שולחן]").substring(0,80)+"…":"";
          return(
            <div key={s.id} style={{border:`1.5px solid ${s.enabled?C.border:"#E9E4EF"}`,borderRadius:12,padding:"9px 12px",background:s.enabled?"#FCFAFE":"#F6F4F8",opacity:s.enabled?1:.6}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:s.enabled?6:0}}>
                <span style={{fontSize:18}}>{s.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  {editing&&s.custom
                    ?<input value={s.label} onChange={e=>update(s.id,{label:e.target.value})} style={{...inp,padding:"4px 8px",fontWeight:800}} placeholder="שם התזמון"/>
                    :<div style={{fontSize:12,fontWeight:800,color:C.text}}>{s.label}</div>}
                  {s.desc&&<div style={{fontSize:10,color:C.muted}}>{s.desc}</div>}
                </div>
                {!editing&&s.enabled&&<div style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{disp} · {s.time}</div>}
                {editing&&s.custom&&<button onClick={()=>remove(s.id)} title="מחיקת תזמון" style={{background:"#FFF2F4",border:"1px solid #F4C7CD",color:C.danger,borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>מחק</button>}
                <div role="switch" aria-checked={s.enabled} tabIndex={0} onClick={()=>toggle(s.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle(s.id);}}}
                  style={{width:38,height:22,borderRadius:11,background:s.enabled?accent:"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,left:s.enabled?18:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                </div>
              </div>
              {s.enabled&&<>
                <div style={{background:"#F4EEFC",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#4A3D66",lineHeight:1.5,marginBottom:editing?8:0}}>
                  📝 {preview}
                  {onPickTemplate&&<button onClick={()=>onPickTemplate(s.templateId)} style={{display:"inline-block",marginRight:6,background:accent,color:"#fff",border:"none",borderRadius:5,padding:"2px 6px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>ערוך נוסח</button>}
                </div>
                {auto&&!editing&&(()=>{const st=autoStatus(s);return st&&<div style={{marginTop:6,background:st.bg,color:st.c,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,lineHeight:1.5}}>{st.t}</div>;})()}
                {editing&&<div style={{display:"grid",gridTemplateColumns:s.custom?"1fr 1fr 1fr":"1fr 1fr",gap:8,marginTop:4}}>
                  {s.custom&&<div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:3}}>הודעה</div>
                    <select value={s.templateId} onChange={e=>update(s.id,{templateId:e.target.value})} style={inp}>
                      {templates.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                    </select></div>}
                  <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:3}}>תאריך</div><DateField compact value={s.date||""} onChange={v=>update(s.id,{date:v})} style={inp}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:3}}>שעה</div><input type="time" dir="ltr" value={s.time||""} onChange={e=>update(s.id,{time:e.target.value})} style={inp}/></div>
                </div>}
              </>}
            </div>
          );
        })}
        {editing&&<button onClick={addCustom} className="sx-btn" style={{background:"#fff",border:`1.5px dashed ${accent}`,color:C.blue,borderRadius:10,padding:"9px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>+ הוסף תזמון נוסף</button>}
        {editing&&<button onClick={save} className="sx-btn sx-btn-primary" style={{background:GRAD,color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>💾 שמור תזמונים</button>}
        {!eventD&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"7px 10px",fontSize:11,color:"#B45309"}}>⚠️ הגדר תאריך אירוע בפרטי האירוע כדי לחשב תאריכים אוטומטית</div>}
      </div>
    </div>
  );
}

// בחירת נמענים (SMS / וואטסאפ): ברירת מחדל  -  אף קבוצה לא מסומנת. נשלח רק למה שמסומן
const RECIPIENT_GROUPS=[
  {v:"all",      l:"כולם",      c:"#2B6CB0", match:()=>true},
  {v:"pending",  l:"ממתינים",   c:"#718096", match:g=>!g.rsvp||g.rsvp==="pending"},
  {v:"confirmed",l:"מגיעים",    c:"#276749", match:g=>g.rsvp==="confirmed"},
  {v:"declined", l:"לא מגיעים", c:"#C53030", match:g=>g.rsvp==="declined"},
];
const pickRecipients=(withPhone,sel)=>{
  const groups=RECIPIENT_GROUPS.filter(f=>sel.includes(f.v));
  return groups.length?withPhone.filter(g=>groups.some(f=>f.match(g))):[];
};
// "כולם" מחליף את כל השאר; קבוצה ספציפית מבטלת את "כולם"
const toggleRecipient=(sel,v)=>sel.includes(v)?sel.filter(x=>x!==v):v==="all"?["all"]:[...sel.filter(x=>x!=="all"),v];
function RecipientPicker({ withPhone, value, onChange }) {
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

function SMSScreen({ event, guests, tables=[] }) {
  const groomName = event.groom_name || "החתן";
  const brideName = event.bride_name || "הכלה";

  const eventDateObj = event.date ? new Date(event.date) : null;
  const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const eventDate = eventDateObj
    ? `יום ${days[eventDateObj.getDay()]}, ${eventDateObj.toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}`
    : "בקרוב";

  const inviteUrl = `${window.location.origin}/#/invite/${event.invite_code||""}`;

  // טקסט לפי סוג האירוע
  const eventType=event.event_type||"wedding";
  const eventEmoji=eventType==="wedding"?"💍":eventType==="bar_mitzvah"?"✡️":eventType==="brit"?"👶":"💼";
  const eventName=eventType==="wedding"?`חתונת ${groomName} ו${brideName}`:eventType==="bar_mitzvah"?`בר-מצווה של ${groomName||event.name}`:eventType==="brit"?`ברית של ${event.name}`:event.name;
  const coupleRef=eventType==="wedding"?`${groomName} ו${brideName}`:(groomName||event.name);

  const defaultSmsInviteText=`שלום {שם}! 💌\nמוזמנים ל${eventName}! ${eventEmoji}\nנשמח לראותך ביום המיוחד.\n📅 ${eventDate}\n📍 ${event.venue||"יפורסם בקרוב"}\nלאישור הגעה: {קישור}`;
  const smsInviteText=event.welcome_text?.trim()||defaultSmsInviteText;

  const TEMPLATES = [
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
      text:`שלום {שם}! מחכים לך ב${eventName}! 🎊\nהשולחן שלך: מספר {שולחן}\n📅 ${eventDate}\n📍 ${event.venue||""}`,
    },
    {
      id:"thanks",
      label:"💙 תודה אחרי האירוע",
      text:`שלום {שם}! תודה רבה שהגעת ל${eventName}! 💙\nשמחנו לחגוג איתך.\nבאהבה, ${coupleRef} ${eventEmoji}`,
    },
  ];

  const [selectedTemplate,setSelectedTemplate]=useState(TEMPLATES[0].id);
  const [msgText,setMsgText]=useState(TEMPLATES[0].text);
  const [sendTo,setSendTo]=useState([]);
  const [sending,setSending]=useState(false);
  const [progress,setProgress]=useState(0);
  const [results,setResults]=useState(null);
  const [previewGuest,setPreviewGuest]=useState(null);
  const [smsBalance,setSmsBalance]=useState(null);

  useEffect(()=>{
    if(guests.length>0&&!previewGuest)setPreviewGuest(guests[0]);
  },[guests]);

  // כשנוסח ההזמנה משתנה בפרטי האירוע  -  עדכן את ה-template
  useEffect(()=>{
    if(selectedTemplate==="invite"){
      setMsgText(smsInviteText);
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
  const toSend=pickRecipients(withPhone,sendTo);
  const tableOf=id=>tables.find(t=>t.id===id)?.name||"—";

  // אותה החלפה כמו בשרת השליחה (קישור קצר אישי)
  const buildPreview=(g)=>{
    if(!g)return msgText;
    return msgText
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
  const buyPackage=(amount,price)=>setBuyPack({amount,price});
  const confirmPurchase=async()=>{
    const{amount,price}=buyPack;
    const{error}=await sb.rpc("request_sms",{p_event:event.id,p_amount:amount,p_price:price});
    if(error){alert("❌ לא הצלחנו לשלוח את הבקשה: "+error.message);return;}
    const msg=`היי! אני רוצה לרכוש ${amount} הודעות SMS ב-₪${price} לאירוע "${event.name}".`;
    window.open("https://wa.me/972526817102?text="+encodeURIComponent(msg),"_blank","noopener,noreferrer");
    setBuyPack(null);await loadBalance();
  };

  const pickTemplate=(t)=>{setSelectedTemplate(t.id);setMsgText(t.text);};

  const sendAll=async()=>{
    if(toSend.length===0){alert(sendTo.length?"אין אורחים עם מספר טלפון בקבוצה שנבחרה":"בחר למי לשלוח");return;}
    if(tooLong){alert(`ההודעה ארוכה מ-${SMS_MAX} תווים (${longest.len} אצל ${longest.name}). קצר את הנוסח.`);return;}
    if(smsBalance!==null&&smsBalance<totalSmsNeeded){
      alert(`אין מספיק SMS!\nנדרש: ${totalSmsNeeded} | יתרה: ${smsBalance}\nרכוש SMS נוספים למטה.`);return;
    }
    if(!window.confirm(`לשלוח SMS ל-${toSend.length} אורחים? (${totalSmsNeeded} SMS)`))return;
    setSending(true);setProgress(0);setResults(null);
    let p=0;const iv=setInterval(()=>{p=Math.min(p+4,92);setProgress(p);},300);
    try{
      // השרת טוען את האורחים מהמסד, מוריד מהיתרה ושולח דרך 019
      const{data,error}=await sb.functions.invoke("send-sms",{
        body:{event_id:event.id,guest_ids:toSend.map(g=>g.id),message:msgText,inviteUrl}
      });
      let body=data;
      if(error){try{body=await error.context?.json();}catch{body=null;}}
      if(body?.results)setResults(body.results);
      if(typeof body?.balance==="number")setSmsBalance(body.balance);
      if(error||body?.error){
        alert("⚠️ "+(body?.error||error?.message||"שגיאה בשליחה")+(body?.needed?`\nנדרש: ${body.needed} | יתרה: ${body.balance}`:""));
      }else setProgress(100);
    }catch(e){
      alert("שגיאה בשליחה: "+e.message);
    }
    clearInterval(iv);
    setSending(false);
  };

  const sentOk=results?.filter(r=>r.status?.includes("✓")).length||0;
  const sentFail=results?.filter(r=>r.status?.includes("✗")).length||0;

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:"12px",paddingBottom:80}}>
      <style>{`
        @media(max-width:768px){
          .msg-grid{grid-template-columns:1fr!important;}
          .msg-preview{display:none!important;}
          .wa-grid{grid-template-columns:1fr!important;}
          .wa-preview{display:none!important;}
        }
      `}</style>

      {/* כותרת */}
      <div style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,borderRadius:16,padding:"18px 20px",marginBottom:16,color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>📱 שליחת SMS</div>
          <div style={{fontSize:13,opacity:.85}}>הודעה אישית לכל אורח עם השם שלו</div>
          <div style={{fontSize:12,marginTop:6,background:"rgba(255,255,255,.2)",borderRadius:8,padding:"4px 10px",display:"inline-block",fontWeight:700}}>
            {groomName} ו{brideName} 💍
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,.2)",borderRadius:12,padding:"10px 16px",textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:900}}>{withPhone.length}</div>
          <div style={{fontSize:11,opacity:.85}}>עם טלפון</div>
        </div>
      </div>

      {/* יתרת SMS */}
      <div style={{background:"#fff",borderRadius:14,padding:"14px 18px",marginBottom:16,border:`1.5px solid ${!hasBalance&&smsBalance!==null&&smsBalance<totalSmsNeeded?"#FC8181":C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:12,background:smsBalance===0?"#FFF5F5":smsBalance===null?"#F7FAFC":"#F0FFF4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
            {smsBalance===null?"⏳":smsBalance===0?"⚠️":"📊"}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:C.text}}>יתרת SMS</div>
            <div style={{fontSize:11,color:C.muted}}>
              {totalSmsNeeded>0?`נדרש לשליחה: ${totalSmsNeeded} SMS`:sendTo.length?"נדרש לשליחה: 0 SMS":"בחר למי לשלוח · נדרש: 0 SMS"}
            </div>
          </div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,fontWeight:900,color:smsBalance===0?"#E53E3E":smsBalance!==null&&smsBalance<totalSmsNeeded?"#DD6B20":"#276749",lineHeight:1}}>
            {smsBalance===null?"...":smsBalance.toLocaleString()}
          </div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600}}>הודעות זמינות</div>
        </div>
      </div>

      {/* כפתורי רכישת SMS */}
      <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>🛒 רכישת SMS</div>
        {pendingReq.length>0&&(
          <div style={{background:"#FFF8E8",border:"1px solid #F5DDA6",borderRadius:12,padding:"10px 12px",marginBottom:12,fontSize:12,color:"#8A5A00",fontWeight:700}}>
            ⏳ ממתין לאישור תשלום: {pendingReq.map(r=>`${r.amount} הודעות (₪${r.price})`).join(" · ")}
            <div style={{fontWeight:500,marginTop:3}}>היתרה תיטען מיד אחרי שהתשלום יאושר.</div>
          </div>
        )}
        {buyPack&&(
          <div style={{position:"fixed",inset:0,zIndex:320,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setBuyPack(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"24px 22px",width:"100%",maxWidth:400,textAlign:"center",boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)"}}>
              <div style={{fontSize:40,marginBottom:6}}>📱</div>
              <div style={{fontSize:19,fontWeight:900,color:C.text}}>{buyPack.amount} הודעות SMS</div>
              <div style={{fontSize:28,fontWeight:900,background:GRAD,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",margin:"4px 0 12px"}}>₪{buyPack.price}</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:16,textAlign:"right",background:C.blueXL,borderRadius:12,padding:"10px 12px"}}>
                1. לחיצה על "שלח בקשה" פותחת וואטסאפ עם הפרטים<br/>
                2. נשלח לך פרטי תשלום (Bit / העברה)<br/>
                3. אחרי התשלום ההודעות נטענות ליתרה שלך
              </div>
              <button onClick={confirmPurchase} className="sx-btn" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:WA_GREEN,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:8}}>
                <WaIcon size={18}/> שלח בקשה בוואטסאפ
              </button>
              <button onClick={()=>setBuyPack(null)} style={{background:"none",border:"none",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>
            </div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {SMS_PACKS.map(([amt,price])=>(
            <div key={amt} onClick={()=>buyPackage(amt,price)}
              style={{border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 8px",textAlign:"center",cursor:"pointer",background:C.bg,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blueM;e.currentTarget.style.background=C.blueXL;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bg;}}>
              <div style={{fontSize:18,fontWeight:900,color:C.blue}}>{amt}</div>
              <div style={{fontSize:9,color:C.muted,marginBottom:4}}>הודעות</div>
              <div style={{fontSize:13,fontWeight:800,color:C.text}}>₪{price}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:C.muted,textAlign:"center",marginTop:10}}>
          💳 תשלום ב-Bit או בהעברה · ההודעות נטענות אחרי אישור התשלום
        </div>
      </div>

      <div className="msg-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

        {/* עמודה שמאל - עריכה */}
        <div style={{minWidth:0}}>

          {/* בחירת נוסח */}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>📝 בחר נוסח</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {TEMPLATES.map(t=>(
                <div key={t.id} onClick={()=>pickTemplate(t)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,
                    border:`2px solid ${selectedTemplate===t.id?C.blueM:C.border}`,
                    background:selectedTemplate===t.id?C.blueXL:"#fff",
                    cursor:"pointer",transition:"all .15s"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:selectedTemplate===t.id?C.blueM:C.border,flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:700,color:selectedTemplate===t.id?C.blue:C.text}}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* עריכת הודעה */}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:6}}>✏️ עריכת הודעה</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.6}}>
              משתנים:&nbsp;
              {["{שם}","{שם מלא}","{קישור}","{שולחן}"].map(v=>(
                <code key={v} style={{background:C.blueXL,padding:"1px 6px",borderRadius:4,marginLeft:4,fontSize:11}}>{v}</code>
              ))}
            </div>
            <textarea value={msgText} onChange={e=>setMsgText(e.target.value)}
              style={{width:"100%",minHeight:140,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",
                fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",lineHeight:1.8,
                boxSizing:"border-box",direction:"rtl",color:C.text}}/>
            {/* ספירת תווים */}
            <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:6,fontSize:11,color:tooLong?C.danger:C.muted,fontWeight:tooLong?800:400}}>
              <span>{longest.len}/{SMS_MAX} תווים{longest.name?` (הכי ארוכה: ${longest.name})`:""}</span>
              <span>{tooLong?`⚠️ קצר ב-${longest.len-SMS_MAX} תווים`:"✓ בתוך המגבלה"}</span>
            </div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>הספירה כוללת את השם, השולחן והקישור האישי ({SHORT_LINK_HOST}…, {SHORT_LINK_HOST.length+7} תווים). אימוג'י = 2 תווים.</div>
          </div>

          {/* פילטר */}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>👥 למי לשלוח?</div>
            <RecipientPicker withPhone={withPhone} value={sendTo} onChange={setSendTo}/>
            <div style={{fontSize:11,color:C.muted,margin:"8px 0 12px"}}>
              {sendTo.length?`${toSend.length} אורחים · ${totalSmsNeeded} SMS`:"לא נבחרו נמענים  -  לא יישלח כלום"}
            </div>

          {/* תזמון שליחה SMS  -  נשמר באירוע */}
          <ScheduleEditor event={event} storeKey="sms_schedule" templates={TEMPLATES} accent={C.blueM} auto
            onPickTemplate={id=>{const tp=TEMPLATES.find(x=>x.id===id);setSelectedTemplate(id);setMsgText(tp?.text||"");}}/>

          </div>

          {/* כפתור שליחה */}
          <button onClick={sendAll} disabled={sending||toSend.length===0||!hasBalance||tooLong}
            style={{width:"100%",background:sending||toSend.length===0||!hasBalance||tooLong?"#A0AEC0":`linear-gradient(135deg,${C.blue},${C.blueM})`,
              color:"#fff",border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:800,
              cursor:sending||toSend.length===0||!hasBalance||tooLong?"default":"pointer",fontFamily:"inherit",
              boxShadow:sending||toSend.length===0||!hasBalance||tooLong?"none":"0 4px 20px rgba(41,82,200,.4)",transition:"all .2s"}}>
            {sending?`שולח... ${progress}%`:tooLong?`⚠️ ההודעה ארוכה מ-${SMS_MAX} תווים`:!hasBalance?`⚠️ אין מספיק SMS (יתרה: ${smsBalance||0})`:toSend.length===0?"בחר למי לשלוח":`📱 שלח SMS ל-${toSend.length} אורחים (${totalSmsNeeded} SMS)`}
          </button>

          {/* Progress Bar */}
          {(sending||progress>0)&&(
            <div style={{marginTop:10,background:"#E2E8F0",borderRadius:100,height:8,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.blue},${C.blueL})`,borderRadius:100,transition:"width .3s"}}/>
            </div>
          )}

          {/* תוצאות */}
          {results&&(
            <div style={{marginTop:16,background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
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
        <div className="msg-preview">
          <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)",position:"sticky",top:20}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>👁 תצוגה מקדימה</div>

            {guests.length>0&&(
              <select value={previewGuest?.id||""} onChange={e=>setPreviewGuest(guests.find(g=>String(g.id)===e.target.value)||null)}
                style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:14,background:"#fff",color:C.text}}>
                {guests.map(g=>(
                  <option key={g.id} value={g.id}>{g.name}{g.phone?" ✓":""}</option>
                ))}
              </select>
            )}

            {/* בועת SMS */}
            <div style={{background:"#1C1C1E",borderRadius:14,overflow:"hidden"}}>
              <div style={{background:"#2C2C2E",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:C.blueM,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0}}>
                  {previewGuest?.name?.[0]||"א"}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{previewGuest?.name||"אורח לדוגמה"}</div>
                  <div style={{fontSize:11,color:"#8E8E93"}}>SMS</div>
                </div>
              </div>
              <div style={{padding:16}}>
                <div style={{background:"#3A3A3C",borderRadius:"0 12px 12px 12px",padding:"10px 14px",maxWidth:"90%",display:"inline-block"}}>
                  <div style={{fontSize:13,color:"#fff",lineHeight:1.8,whiteSpace:"pre-wrap",direction:"rtl"}}>
                    {buildPreview(previewGuest)}
                  </div>
                  <div style={{fontSize:10,color:"#8E8E93",textAlign:"left",marginTop:6}}>
                    {new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
              </div>
            </div>

            {/* מידע */}
            <div style={{marginTop:14,background:!hasBalance&&smsBalance!==null?"#FFF5F5":C.blueXL,border:`1.5px solid ${!hasBalance&&smsBalance!==null?"#FC8181":C.border}`,borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:12,color:C.text,lineHeight:1.8}}>
                ✅ מחובר ל-<strong>019 SMS</strong><br/>
                📊 {toSend.length} אורחים × 1 = <strong>{totalSmsNeeded} SMS</strong><br/>
                💳 יתרה: <strong style={{color:!hasBalance&&smsBalance!==null?"#E53E3E":"#276749"}}>{smsBalance===null?"טוען...":`${smsBalance} SMS`}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WHATSAPP SCREEN ──────────────────────────────────────────────────────────
function WhatsAppScreen({ event, guests }) {
  const [waPkg,setWaPkg]=useState(null); // null=בחירה, "auto"=חבילה5, "vip"=חבילה6
  const groomName = event.groom_name || "החתן";
  const brideName = event.bride_name || "הכלה";
  const coupleStr = `${groomName} ו${brideName}`;

  // תאריך בפורמט עברי נכון: יום ב׳, 30 באפריל 2026
  const eventDateObj = event.date ? new Date(event.date) : null;
  const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const eventDate = eventDateObj
    ? `יום ${days[eventDateObj.getDay()]}, ${eventDateObj.toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}`
    : "בקרוב";

  const inviteUrl = `${window.location.origin}/#/invite/${event.invite_code||""}`;

  // טקסט לפי סוג האירוע
  const eventType=event.event_type||"wedding";
  const eventEmoji=eventType==="wedding"?"💍":eventType==="bar_mitzvah"?"✡️":eventType==="brit"?"👶":"💼";
  const eventName=eventType==="wedding"?`חתונת ${groomName} ו${brideName}`:eventType==="bar_mitzvah"?`בר-מצווה של ${groomName||event.name}`:eventType==="brit"?`ברית של ${event.name}`:event.name;
  const coupleRef=eventType==="wedding"?`${groomName} ו${brideName}`:(groomName||event.name);
  const greeting=eventType==="wedding"?"ליום המאושר בחיינו":"לאירוע המיוחד שלנו";

  const defaultInviteText=`שלום {שם}! 💌\n\nמוזמנים ל${eventName}! ${eventEmoji}\n\nנרגשים להזמין אותך ${greeting} ונשמח מאוד לראותך!\n\n📅 תאריך: ${eventDate}\n📍 מקום: ${event.venue||"יפורסם בקרוב"}\n\n👇 לאישור הגעה לחץ כאן:\n{קישור}\n\nבאהבה,\n${coupleRef} ${eventEmoji}`;
  const inviteText=event.welcome_text?.trim()||defaultInviteText;

  const TEMPLATES = [
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
      text:`שלום {שם}! 🎊\n\nמחכים לך היום ב${eventName}!\n\n🪑 השולחן שלך: מספר {שולחן}\n\n📅 ${eventDate}\n📍 ${event.venue||""}\n\n👇 לפרטים נוספים:\n{קישור}\n\nנתראה בקרוב! 🥂`,
    },
    {
      id:"thanks",
      label:"💙 תודה אחרי האירוע",
      text:`שלום {שם}! 💙\n\nתודה רבה שהגעת ל${eventName}!\nשמחנו כל כך לחגוג איתך את היום המיוחד הזה 🥰\n\nבאהבה רבה,\n${coupleRef} ${eventEmoji}`,
    },
  ];

  const [selectedTemplate,setSelectedTemplate]=useState(TEMPLATES[0].id);
  const [msgText,setMsgText]=useState(TEMPLATES[0].text);
  const [sendTo,setSendTo]=useState([]);
  const [sending,setSending]=useState(false);
  const [progress,setProgress]=useState(0);
  const [results,setResults]=useState(null);
  const [previewGuest,setPreviewGuest]=useState(null);

  // כשנוסח ההזמנה משתנה בפרטי האירוע  -  עדכן את ה-template
  useEffect(()=>{
    if(selectedTemplate==="invite"){
      setMsgText(inviteText);
    }
  },[event.welcome_text]);

  useEffect(()=>{
    if(guests.length>0&&!previewGuest)setPreviewGuest(guests[0]);
  },[guests]);

  const withPhone=guests.filter(g=>g.phone&&g.phone.trim().length>6);
  const toSend=pickRecipients(withPhone,sendTo);

  const buildPreview=(g)=>{
    if(!g)return msgText;
    return msgText
      .replace(/{שם}/g,g.name.split(" ")[0])
      .replace(/{שם מלא}/g,g.name)
      .replace(/{קישור}/g,`${inviteUrl}?g=${g.id}`)
      .replace(/{שולחן}/g,"3");
  };

  const pickTemplate=(t)=>{setSelectedTemplate(t.id);setMsgText(t.text);};

  const sendAll=async()=>{
    if(toSend.length===0){alert("אין אורחים לשליחה עם מספר טלפון");return;}
    if(!window.confirm(`לשלוח הודעה ל-${toSend.length} אורחים?`))return;
    setSending(true);setProgress(0);setResults(null);
    try{
      let p=0;
      const iv=setInterval(()=>{p=Math.min(p+3,92);setProgress(p);},400);
      const{data,error}=await sb.functions.invoke("send-whatsapp",{
        body:{guests:toSend.map(g=>({id:g.id,name:g.name,phone:g.phone})),message:msgText,inviteUrl}
      });
      clearInterval(iv);
      if(error)throw new Error(error.message);
      setProgress(100);
      setResults(data?.results||[]);
    }catch(e){
      alert("שגיאה בשליחה: "+e.message);
    }
    setSending(false);
  };

  const [scheduledDate,setScheduledDate]=useState("");
  const [scheduledTime,setScheduledTime]=useState("09:00");
  const [showSchedule,setShowSchedule]=useState(false);
  const [waScheduleEnabled,setWaScheduleEnabled]=useState([true,true,true,true]);

  const sentOk=results?.filter(r=>r.status?.includes("✓")).length||0;
  const sentFail=results?.filter(r=>r.status?.includes("✗")).length||0;

  // מסך בחירת חבילה
  if(!waPkg) return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:16,paddingBottom:80}}>
      <div style={{background:"linear-gradient(135deg,#075E54,#25D366)",borderRadius:16,padding:"20px",marginBottom:24,color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:22,marginBottom:6}}>💬</div>
        <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>שליחת WhatsApp</div>
        <div style={{fontSize:13,opacity:.85}}>בחר את סוג השירות שרכשת</div>
      </div>

      <div style={{background:"#FFF8E1",border:"1px solid #FDE68A",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#B45309",display:"flex",gap:8,alignItems:"flex-start"}}>
        <span style={{fontSize:16,flexShrink:0}}>ℹ️</span>
        <span>מחיר החבילה נקבע לפי <strong>מספר האורחים באירוע</strong> ולא לפי כמות הודעות. בחר את הטווח המתאים לגודל האירוע שלך.</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div onClick={()=>setWaPkg("auto")}
          style={{background:"#fff",border:"2px solid #25D366",borderRadius:20,padding:"20px 16px",cursor:"pointer",textAlign:"center",boxShadow:"0 4px 16px rgba(37,211,102,.15)"}}>
          <div style={{fontSize:36,marginBottom:10}}>💬</div>
          <div style={{fontSize:15,fontWeight:900,color:"#075E54",marginBottom:6}}>אוטומציה</div>
          <div style={{fontSize:11,color:"#555",lineHeight:1.6,marginBottom:12}}>2 סבבי שליחה אוטומטית<br/>SMS תזכורת + תודה</div>
          <div style={{fontSize:12,fontWeight:700,color:"#25D366",background:"#F0FFF4",borderRadius:8,padding:"4px 0"}}>החל מ ₪80</div>
        </div>
        <div onClick={()=>setWaPkg("vip")}
          style={{background:"#fff",border:"2px solid #B45309",borderRadius:20,padding:"20px 16px",cursor:"pointer",textAlign:"center",boxShadow:"0 4px 16px rgba(180,83,9,.15)"}}>
          <div style={{fontSize:36,marginBottom:10}}>👑</div>
          <div style={{fontSize:15,fontWeight:900,color:"#B45309",marginBottom:6}}>VIP + מוקד</div>
          <div style={{fontSize:11,color:"#555",lineHeight:1.6,marginBottom:12}}>הכל באוטומציה<br/>+ 3 סבבי שיחות טלפוניות</div>
          <div style={{fontSize:12,fontWeight:700,color:"#B45309",background:"#FFFBEB",borderRadius:8,padding:"4px 0"}}>החל מ ₪250</div>
        </div>
      </div>

      {/* הבדל */}
      <div style={{background:"#F8FAFF",border:"1px solid #E2E8F0",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:12,color:"#555",fontWeight:700,marginBottom:8}}>ההבדל בין החבילות:</div>
        <div style={{fontSize:12,color:"#666",lineHeight:1.9}}>
          💬 <strong>אוטומציה</strong> - שליחה אוטומטית לכל האורחים, SMS תזכורת ותודה<br/>
          👑 <strong>VIP + מוקד</strong> - כנ"ל + נציגים אנושיים מתקשרים לכל אורח שלא ענה
        </div>
      </div>

      {/* רכישה */}
      <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:800,color:"#1a1a1a",marginBottom:12}}>לא רכשת עדיין?</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <a href={`https://wa.me/972526817102?text=${encodeURIComponent("שלום, אני מעוניין בחבילת אוטומציה WhatsApp")}`}
            target="_blank" rel="noopener"
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FFF4",border:"1px solid #9AE6B4",borderRadius:12,padding:"12px 14px",textDecoration:"none"}}>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#075E54"}}>💬 אוטומציה</div>
              <div style={{fontSize:11,color:"#555"}}>החל מ ₪80</div>
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"#25D366"}}>לרכישה ←</div>
          </a>
          <a href={`https://wa.me/972526817102?text=${encodeURIComponent("שלום, אני מעוניין בחבילת VIP + מוקד WhatsApp")}`}
            target="_blank" rel="noopener"
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:12,padding:"12px 14px",textDecoration:"none"}}>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#B45309"}}>👑 VIP + מוקד</div>
              <div style={{fontSize:11,color:"#555"}}>החל מ ₪250</div>
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"#B45309"}}>לרכישה ←</div>
          </a>
        </div>
      </div>
    </div>
  );


  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:"12px",paddingBottom:80}}>
      <style>{`@media(max-width:768px){.wa-grid{grid-template-columns:1fr!important;}.wa-preview{display:none!important;}}`}</style>
      {/* כותרת */}
      <div style={{background:"linear-gradient(135deg,#075E54,#25D366)",borderRadius:16,padding:"18px 20px",marginBottom:20,color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>
              {waPkg==="vip"?"👑 VIP + מוקד":"💬 אוטומציה"}
            </div>
            <div style={{fontSize:13,opacity:.85}}>הודעה אישית לכל אורח עם השם שלו</div>
            <div style={{fontSize:12,marginTop:6,background:"rgba(255,255,255,.2)",borderRadius:8,padding:"4px 10px",display:"inline-block",fontWeight:700}}>
              {coupleStr} 💍
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,.2)",borderRadius:12,padding:"10px 16px",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:900}}>{withPhone.length}</div>
            <div style={{fontSize:11,opacity:.85}}>עם טלפון</div>
          </div>
        </div>
        <button onClick={()=>setWaPkg(null)}
          style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.4)",color:"#fff",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          ← חזור לבחירת חבילה
        </button>
      </div>

      <div className="wa-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

        {/* עמודה שמאל  -  עריכה */}
        <div style={{minWidth:0}}>

          {/* בחירת נוסח */}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>📝 בחר נוסח</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {TEMPLATES.map(t=>(
                <div key={t.id} onClick={()=>pickTemplate(t)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,
                    border:`2px solid ${selectedTemplate===t.id?"#25D366":C.border}`,
                    background:selectedTemplate===t.id?"#F0FFF4":"#fff",
                    cursor:"pointer",transition:"all .15s"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:selectedTemplate===t.id?"#25D366":C.border,flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:700,color:selectedTemplate===t.id?"#276749":C.text}}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* עריכת הודעה */}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:6}}>✏️ עריכת הודעה</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.6}}>
              משתנים זמינים:&nbsp;
              {["{שם}","{שם מלא}","{קישור}","{שולחן}"].map(v=>(
                <code key={v} style={{background:C.blueXL,padding:"1px 6px",borderRadius:4,marginLeft:4,fontSize:11}}>{v}</code>
              ))}
            </div>
            <textarea value={msgText} onChange={e=>setMsgText(e.target.value)}
              style={{width:"100%",minHeight:180,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",
                fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",lineHeight:1.8,
                boxSizing:"border-box",direction:"rtl",color:C.text}}/>
          </div>

          {/* פילטר */}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>👥 למי לשלוח?</div>
            <RecipientPicker withPhone={withPhone} value={sendTo} onChange={setSendTo}/>
            <div style={{fontSize:11,color:C.muted,marginTop:8}}>
              {sendTo.length?`${toSend.length} אורחים`:"לא נבחרו נמענים  -  לא יישלח כלום"}
            </div>
          </div>

          {/* תזמון שליחה וואטסאפ  -  נשמר באירוע */}
          <ScheduleEditor event={event} storeKey="wa_schedule" templates={TEMPLATES} accent={WA_GREEN}
            onPickTemplate={id=>{const tp=TEMPLATES.find(x=>x.id===id);setSelectedTemplate(id);setMsgText(tp?.text||"");}}/>

          {/* כפתור שליחה */}
          <button onClick={sendAll} disabled={sending||toSend.length===0}
            style={{width:"100%",background:sending||toSend.length===0?"#A0AEC0":"linear-gradient(135deg,#075E54,#25D366)",
              color:"#fff",border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:800,
              cursor:sending||toSend.length===0?"default":"pointer",fontFamily:"inherit",
              boxShadow:sending||toSend.length===0?"none":"0 4px 20px rgba(37,211,102,.4)",transition:"all .2s"}}>
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
            <div style={{marginTop:16,background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
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
        <div className="wa-preview">
          <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)",position:"sticky",top:20}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>👁 תצוגה מקדימה</div>

            {guests.length>0&&(
              <select value={previewGuest?.id||""} onChange={e=>setPreviewGuest(guests.find(g=>String(g.id)===e.target.value)||null)}
                style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:14,background:"#fff",color:C.text}}>
                {guests.map(g=>(
                  <option key={g.id} value={g.id}>{g.name}{g.phone?" ✓":""}</option>
                ))}
              </select>
            )}

            {/* בועת WhatsApp */}
            <div style={{background:"#ECE5DD",borderRadius:14,overflow:"hidden"}}>
              {/* header */}
              <div style={{background:"#075E54",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0}}>
                  {previewGuest?.name?.[0]||"א"}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{previewGuest?.name||"אורח לדוגמה"}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>מחובר</div>
                </div>
              </div>
              {/* הודעה */}
              <div style={{padding:16}}>
                <div style={{background:"#fff",borderRadius:"0 12px 12px 12px",padding:"10px 14px",maxWidth:"90%",boxShadow:"0 1px 3px rgba(0,0,0,.1)",display:"inline-block"}}>
                  <div style={{fontSize:13,color:"#1A202C",lineHeight:1.8,whiteSpace:"pre-wrap",direction:"rtl"}}>
                    {buildPreview(previewGuest)}
                  </div>
                  <div style={{fontSize:10,color:"#999",textAlign:"left",marginTop:6}}>
                    {new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})} ✓✓
                  </div>
                </div>
              </div>
            </div>

            {/* אזהרה */}
            <div style={{marginTop:14,background:"#FFFBEB",border:"1.5px solid #F6E05E",borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:12,color:"#744210",lineHeight:1.7}}>
                ⚠️ <strong>לפני שליחה:</strong> ודא שהגדרת את Twilio Secrets ב-Supabase. ללא הגדרה  -  ההודעות לא יישלחו.
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
function planAutoSeating(guests,tables,{byCategory=true,fillEmpty=true,cats=null}={}){
  const relOf=g=>g.relation||"ללא שיוך";
  const slots=tables.map((t,i)=>{
    const rels={};(t.guests||[]).forEach(g=>{rels[relOf(g)]=(rels[relOf(g)]||0)+1;});
    return {id:t.id,name:t.name,idx:i,used:(t.guests||[]).length,free:Math.max(0,(t.seats||10)-(t.guests||[]).length),rels};
  });
  const main=s=>Object.entries(s.rels).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const pick=(rel,need)=>{
    const open=slots.filter(s=>s.free>0);
    if(!open.length)return null;
    if(rel){const same=open.filter(s=>s.used>0&&main(s)===rel).sort((a,b)=>b.free-a.free);if(same.length)return same[0];}
    if(fillEmpty){
      const empty=open.filter(s=>s.used===0);
      if(empty.length){const fits=empty.filter(s=>s.free>=need).sort((a,b)=>a.free-b.free);return fits[0]||empty.sort((a,b)=>b.free-a.free)[0];}
      return open.sort((a,b)=>a.used-b.used||a.idx-b.idx)[0];
    }
    return open.sort((a,b)=>a.idx-b.idx)[0];
  };
  const groups={},rest0=[];
  guests.forEach(g=>{if(byCategory&&(!cats||cats.includes(relOf(g))))(groups[relOf(g)]||=[]).push(g);else rest0.push(g);});
  const assignments=[];
  // קודם הקטגוריות שיושבות ביחד (הגדולה ראשונה), בסוף כל השאר
  [...Object.entries(groups).sort((a,b)=>b[1].length-a[1].length),...(rest0.length?[["",rest0]]:[])].forEach(([rel,list])=>{
    const rest=[...list];
    while(rest.length){
      const s=pick(rel,rest.length);if(!s)break;
      rest.splice(0,s.free).forEach(g=>{
        assignments.push({guestId:g.id,tableId:s.id,reason:`${rel?rel+" → ":""}${s.name}`});
        s.used++;s.free--;s.rels[relOf(g)]=(s.rels[relOf(g)]||0)+1;
      });
    }
  });
  return assignments;
}

function AISeatingScreen({ event, tables, guests, onApply, onClose, saving=false }) {
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
  useEffect(()=>{setResult(null);},[groupByRelation,fillEmpty,cats.join("|")]);

  const runSmartSeating=()=>{
    setLoading(true);
    setTimeout(()=>{
      const assignments=planAutoSeating(guests,tables,{byCategory:groupByRelation,fillEmpty,cats});
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
          <div style={{fontSize:13,color:"#718096"}}>משבץ את האורחים שעוד לא יושבים, לפי קטגוריות ומקומות פנויים. אורחים שכבר שובצו לא זזים.</div>
        </div>
        {onClose&&<button onClick={onClose} aria-label="סגירה" style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:10,width:36,height:36,fontSize:16,cursor:"pointer",flexShrink:0}}>✕</button>}
      </div>

      {/* סטטיסטיקות */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        {[[guests.length,"👥","ממתינים להושבה"],[tables.length,"🪑","שולחנות"],[tables.reduce((s,t)=>s+Math.max(0,t.seats-(t.guests||[]).length),0),"🆓","מקומות פנויים"]].map(([v,ic,l])=>(
          <div key={l} style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:12,padding:"14px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:24}}>{ic}</div>
            <div style={{fontSize:24,fontWeight:900,color:"#2B6CB0"}}>{v}</div>
            <div style={{fontSize:11,color:"#718096",marginTop:2}}>{l}</div>
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
              <div style={{fontSize:12,color:"#718096"}}>{item.desc}</div>
            </div>
            <div role="switch" aria-checked={item.val} tabIndex={0} onClick={()=>item.set(s=>!s)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();item.set(s=>!s);}}}
              style={{width:44,height:24,borderRadius:12,background:item.val?"#276749":"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,right:item.val?2:20,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"right .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
        ))}
        {groupByRelation&&catList.length>0&&(
          <div style={{paddingTop:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{flex:1,fontSize:12,fontWeight:800,color:"#4A3D66"}}>אילו קטגוריות ישבו ביחד? <span style={{fontWeight:500,color:"#718096"}}>(השאר ישובצו בכל מקום פנוי)</span></div>
              <button onClick={()=>setCats(cats.length===catList.length?[]:catList)} style={{background:"none",border:"none",color:"#2B6CB0",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{cats.length===catList.length?"נקה הכל":"סמן הכל"}</button>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {catList.map(c=>{const on=cats.includes(c),col=RELATION_COLORS[c]||"#718096";return(
                <button key={c} onClick={()=>toggleCat(c)} aria-pressed={on}
                  style={{display:"flex",alignItems:"center",gap:6,background:on?col:"#fff",color:on?"#fff":col,border:`1.5px solid ${col}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                  {on?"✓":"○"} {c} <span style={{opacity:.85}}>({catCounts[c]})</span>
                </button>
              );})}
            </div>
          </div>
        )}
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
              <span style={{fontSize:12,fontWeight:700,color:RELATION_COLORS[rel]||"#718096"}}>{rel}</span>
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
            {result.assignments.length>10&&<div style={{fontSize:11,color:"#718096",marginTop:4}}>ועוד {result.assignments.length-10} אורחים...</div>}
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
function AddTableModal({ onConfirm, onClose }) {
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
              <span style={{fontSize:10,color:type===k?"rgba(255,255,255,.7)":"#6E6585"}}>{v.defaultSeats} מקומות</span>
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
const INVITE_TEMPLATES = {
  wedding: [
    { id:"classic",   name:"קלאסי",    bg:"linear-gradient(160deg,#1a0a2e,#3d1f6e,#6b3fa0)", overlay:"rgba(0,0,0,.45)", img:"https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", titleColor:"#fff", accent:"#E8C4FF" },
    { id:"romantic",  name:"רומנטי",   bg:"linear-gradient(160deg,#3d0a0a,#7a1f1f,#c45050)", overlay:"rgba(0,0,0,.4)",  img:"https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80", titleColor:"#fff", accent:"#FFB3B3" },
    { id:"elegant",   name:"אלגנטי",   bg:"linear-gradient(160deg,#0a0a0a,#2a2a2a,#4a4a4a)", overlay:"rgba(0,0,0,.5)",  img:"https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80", titleColor:"#fff", accent:"#FFD700" },
    { id:"natural",   name:"טבעי",     bg:"linear-gradient(160deg,#0a2a1a,#1a5a2a,#2d8a4a)", overlay:"rgba(0,0,0,.4)",  img:"https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=80", titleColor:"#fff", accent:"#90EE90" },
    { id:"bright",    name:"בהיר",     bg:"linear-gradient(160deg,#f5f0ff,#e8d5ff,#d0b0ff)", overlay:"rgba(255,255,255,.2)", img:"https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", titleColor:"#2d0060", accent:"#7B2FBE" },
  ],
  bar_mitzvah: [
    { id:"blue",      name:"כחול",     bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.4)",  img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80", titleColor:"#fff", accent:"#7DC4FF" },
    { id:"gold",      name:"זהב",      bg:"linear-gradient(160deg,#1a1000,#3d2800,#7a5000)", overlay:"rgba(0,0,0,.45)", img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80", titleColor:"#fff", accent:"#FFD700" },
  ],
  brit: [
    { id:"soft",      name:"עדין",     bg:"linear-gradient(160deg,#0a2a1a,#1a5a2a,#2d8a4a)", overlay:"rgba(0,0,0,.35)", img:"https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80", titleColor:"#fff", accent:"#90EE90" },
    { id:"pink",      name:"ורוד",     bg:"linear-gradient(160deg,#3a0a2a,#7a1f5a,#c45090)", overlay:"rgba(0,0,0,.35)", img:"https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80", titleColor:"#fff", accent:"#FFB3D9" },
  ],
  business: [
    { id:"dark",      name:"כהה",      bg:"linear-gradient(160deg,#0a0a0a,#1a1a1a,#2a2a2a)", overlay:"rgba(0,0,0,.5)",  img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", titleColor:"#fff", accent:"#FFD700" },
    { id:"navy",      name:"נייבי",    bg:"linear-gradient(160deg,#0a1a3a,#1B3A8C,#2952C8)", overlay:"rgba(0,0,0,.4)",  img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", titleColor:"#fff", accent:"#7DC4FF" },
  ],
  other: [
    { id:"party",     name:"מסיבה",    bg:"linear-gradient(160deg,#1B3A8C,#2952C8,#4A7AFF)", overlay:"rgba(0,0,0,.4)",  img:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80", titleColor:"#fff", accent:"#A0C4FF" },
  ],
};

function InvitePage({ code, guestId }) {
  const [event,setEvent]=useState(null);
  const [loading,setLoading]=useState(true);
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [phoneState,setPhone]=useState("");
  const [guestCount,setGuestCount]=useState(1);
  const [rsvp,setRsvp]=useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [knownGuest,setKnownGuest]=useState(null); // אורח מזוהה מהקישור
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
    });
    if(error||!data||["no_invite","no_name"].includes(data.status)){
      setSaveError(error?"לא הצלחנו לשמור את האישור. בדקו את החיבור ונסו שוב.":data?.status==="no_name"?"נא למלא שם":"ההזמנה כבר לא פעילה");
      setSubmitting(false);return;
    }
    if(data.status==="phone_exists"){
      setDupGuest(data);setGuestCount(c=>Math.max(c,1));setPhoneDupInv(true);setSubmitting(false);return;
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
          <div style={{fontSize:11,fontWeight:700,color:"#6B7DB3",marginBottom:6}}>האורח הקיים</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#2952C8,#4A7AFF)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>{dupGuest?.name?.[0]}</div>
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
        </div>
      </div>
    );
  }

  return(
    <div dir="rtl" style={{minHeight:"100vh",fontFamily:"'Heebo',sans-serif",background:"#f9f9f9"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}} @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
      {showDupModal&&DupModal()}
      {phoneDupInv&&dupGuest&&<PhoneExistsDialog guest={dupGuest} count={guestCount} setCount={setGuestCount} busy={submitting}
        zIndex={450} onBack={()=>setPhoneDupInv(false)} onUpdate={doUpdate}/>}

      {/* אפקט קונפטי */}
      {(event.settings_json?.confetti??true)&&(()=>{
        const pieces=[...Array(18)].map((_,i)=>({
          left:`${Math.random()*100}%`,
          color:["#FFD700","#FF6B6B","#4ECDC4","#A29BFE","#FD79A8","#55EFC4"][i%6],
          size:`${8+Math.random()*8}px`,
          delay:`${Math.random()*3}s`,
          dur:`${3+Math.random()*3}s`,
          borderRadius:i%3===0?"50%":"2px",
        }));
        return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
          {pieces.map((p,i)=><div key={i} style={{position:"absolute",top:-20,left:p.left,width:p.size,height:p.size,background:p.color,borderRadius:p.borderRadius,animation:`confettiFall ${p.dur} ${p.delay} linear infinite`,opacity:0.8}}/>)}
        </div>;
      })()}

      {/* ספירה לאחור */}
      {(event.settings_json?.countdown??true)&&eventDate&&(()=>{
        const now=new Date();
        const diff=eventDate-now;
        if(diff<=0)return null;
        const days=Math.floor(diff/(1000*60*60*24));
        const hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
        const mins=Math.floor((diff%(1000*60*60))/(1000*60));
        return(
          <div style={{background:"linear-gradient(135deg,#1B3A8C,#2952C8)",padding:"10px 16px",textAlign:"center",direction:"rtl"}}>
            <div style={{display:"inline-flex",gap:16,alignItems:"center"}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,.75)",fontWeight:600}}>⏳ עוד</span>
              {days>0&&<span style={{color:"#fff",fontWeight:800,fontSize:14}}>{days} ימים</span>}
              <span style={{color:"#fff",fontWeight:800,fontSize:14}}>{hours} שעות</span>
              <span style={{color:"#fff",fontWeight:800,fontSize:14}}>{mins} דקות</span>
              <span style={{fontSize:11,color:"rgba(255,255,255,.75)",fontWeight:600}}>לאירוע</span>
            </div>
          </div>
        );
      })()}

      <div style={{position:"relative",height:"55vw",maxHeight:360,minHeight:240,overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`url(${tmpl.img})`,backgroundSize:"cover",backgroundPosition:"center"}}/>
        <div style={{position:"absolute",inset:0,background:tmpl.overlay}}/>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,7vw,52px)",fontWeight:800,color:"#fff",lineHeight:1.2,textShadow:"0 2px 20px rgba(0,0,0,.5)",marginBottom:8}}>
            {event.bride_name&&event.groom_name?<>{event.groom_name} & {event.bride_name}<br/><span style={{fontSize:"clamp(16px,4vw,28px)",fontWeight:600,opacity:.9}}>מתחתנים</span></>:event.name}
          </div>
        </div>
      </div>

      <div style={{background:"#fff",maxWidth:480,margin:"0 auto",padding:"24px 20px",boxShadow:"0 -8px 30px rgba(0,0,0,.08)",borderRadius:"20px 20px 0 0",marginTop:-20,position:"relative"}}>

        {/* תמונת הזמנה */}
        {event.invite_image&&(
          <div style={{marginBottom:20,borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.1)"}}>
            <img src={event.invite_image} alt="הזמנה" style={{width:"100%",maxHeight:300,objectFit:"contain",display:"block"}}
              onError={e=>{e.target.parentElement.style.display="none";}}/>
          </div>
        )}

        {event.welcome_text&&<p style={{fontSize:15,color:"#555",lineHeight:1.8,textAlign:"center",marginBottom:20,fontStyle:"italic"}}>"{event.welcome_text}"</p>}

        <div style={{borderTop:"1px solid #eee",borderBottom:"1px solid #eee",padding:"16px 0",marginBottom:20,textAlign:"center"}}>
          {dateStr&&<div style={{direction:"ltr",display:"inline-block"}}>{dateStr}</div>}
          {(event.settings_json?.hebrewDate??true)&&event.date&&(()=>{
            try{
              const d=new Date(event.date);
              const heb=new Intl.DateTimeFormat("he-IL-u-ca-hebrew",{year:"numeric",month:"long",day:"numeric"}).format(d);
              return <div style={{fontSize:12,color:"#888",marginBottom:4}}>{heb}</div>;
            }catch{return null;}
          })()}
          {event.event_time&&<div style={{fontSize:18,fontWeight:900,color:"#111",marginBottom:8,letterSpacing:".05em"}}>{event.event_time}</div>}
          {event.venue&&<div style={{fontSize:15,fontWeight:700,color:"#333",marginBottom:2}}>{event.venue}</div>}
          {event.venue_address&&<div style={{fontSize:13,color:"#888",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>📍 {event.venue_address}</div>}
          {/* מספר שולחן  -  מוצג אם האורח אישר הגעה ויש לו שולחן */}
          {(event.settings_json?.tableNum??true)&&knownGuest?.table_id&&knownGuest?.rsvp==="confirmed"&&(
            <div style={{marginTop:12,background:"linear-gradient(135deg,#1B3A8C,#2952C8)",color:"#fff",borderRadius:12,padding:"10px 16px",display:"inline-block"}}>
              <span style={{fontSize:13,fontWeight:700}}>🪑 השולחן שלך: </span>
              <span style={{fontSize:16,fontWeight:900}}>{knownGuest.table_name||knownGuest.table_id}</span>
            </div>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
          {event.venue_address&&<button onClick={()=>navigate("waze")} style={{background:"none",border:"1px solid #ddd",borderRadius:12,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>🚗</span><span style={{fontSize:11,color:"#555",fontWeight:600}}>נווט לאירוע</span>
          </button>}
          {eventDate&&<button onClick={addCalendar} style={{background:"none",border:"1px solid #ddd",borderRadius:12,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>📅</span><span style={{fontSize:11,color:"#555",fontWeight:600}}>הוסף ליומן</span>
          </button>}
          {(event.settings_json?.shareBtn??true)&&<button onClick={share} style={{background:"none",border:"1px solid #ddd",borderRadius:12,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>🔗</span><span style={{fontSize:11,color:"#555",fontWeight:600}}>שתפו את האירוע</span>
          </button>}
        </div>

        {/* כפתורי מתנה  -  Bit / Paybox */}
        {(event.bit_link||event.paybox_link)&&(
          <div style={{marginBottom:24}}>
            <div style={{fontSize:13,fontWeight:700,color:"#888",textAlign:"center",marginBottom:10}}>💝 שלח מתנה דיגיטלית</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              {event.bit_link&&(
                <a href={event.bit_link} target="_blank" rel="noopener"
                  style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",background:"linear-gradient(135deg,#1DB954,#17a347)",color:"#fff",borderRadius:14,textDecoration:"none",fontSize:14,fontWeight:800,boxShadow:"0 4px 14px rgba(29,185,84,.35)"}}>
                  💚 Bit
                </a>
              )}
              {event.paybox_link&&(
                <a href={event.paybox_link} target="_blank" rel="noopener"
                  style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",background:"linear-gradient(135deg,#6B46C1,#553C9A)",color:"#fff",borderRadius:14,textDecoration:"none",fontSize:14,fontWeight:800,boxShadow:"0 4px 14px rgba(107,70,193,.35)"}}>
                  💜 Paybox
                </a>
              )}
            </div>
          </div>
        )}

        <div style={{background:"#f9f9f9",borderRadius:16,padding:20,marginBottom:20}}>
          <h3 style={{fontSize:20,fontWeight:900,color:"#111",textAlign:"center",marginBottom:4}}>אישור הגעה</h3>
          <p style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:18}}>נשמח לראותכם בין אורחינו</p>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="שם פרטי"
              style={{background:"#fff",border:"1px solid #ddd",borderRadius:10,padding:"12px 14px",fontSize:14,color:"#111",outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
            <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="שם משפחה"
              style={{background:"#fff",border:"1px solid #ddd",borderRadius:10,padding:"12px 14px",fontSize:14,color:"#111",outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
          </div>

          <input value={phoneState} onChange={e=>setPhone(e.target.value)} placeholder="מספר נייד" type="tel"
            style={{width:"100%",background:"#fff",border:"1px solid #ddd",borderRadius:10,padding:"12px 14px",fontSize:14,color:"#111",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>

          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:"#555",marginBottom:10}}>בחירת כמות אורחים</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
              <button onClick={()=>setGuestCount(c=>Math.max(1,c-1))} style={{width:36,height:36,borderRadius:"50%",background:"#fff",border:"1px solid #ddd",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
              <span style={{fontSize:24,fontWeight:900,color:"#111",minWidth:32,textAlign:"center"}}>{guestCount}</span>
              <button onClick={()=>setGuestCount(c=>c+1)} style={{width:36,height:36,borderRadius:"50%",background:"#fff",border:"1px solid #ddd",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <button onClick={()=>setRsvp("confirmed")} style={{background:rsvp==="confirmed"?"#2D9B5A":"#fff",color:rsvp==="confirmed"?"#fff":"#2D9B5A",border:"2px solid #2D9B5A",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:800,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              ✓ מגיעים
            </button>
            <button onClick={()=>setRsvp("declined")} style={{background:rsvp==="declined"?"#D63B3B":"#fff",color:rsvp==="declined"?"#fff":"#D63B3B",border:"2px solid #D63B3B",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:800,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              ✗ לא מגיעים
            </button>
          </div>

          {saveError&&<div role="alert" style={{background:"#FDECEE",color:"#C53030",border:"1px solid #F9D2D8",borderRadius:12,padding:"10px 12px",fontSize:13,fontWeight:700,marginBottom:10,textAlign:"center"}}>⚠️ {saveError}</div>}
          <button onClick={submit} disabled={!firstName.trim()||!rsvp||submitting}
            style={{width:"100%",background:firstName.trim()&&rsvp?"#1B3A8C":"#ccc",color:"#fff",border:"none",borderRadius:12,padding:"15px",fontSize:16,fontWeight:800,cursor:firstName.trim()&&rsvp?"pointer":"default",fontFamily:"inherit",transition:"all .15s"}}>
            {submitting?"שולח...":"שלח אישור ←"}
          </button>
        </div>

        <div style={{textAlign:"center",fontSize:12,color:"#aaa",paddingBottom:20}}>
          מופעל על ידי ◈ Sidor-IL
        </div>
      </div>
    </div>
  );
}

// ─── INVITE SETTINGS (inside app) ─────────────────────────────────────────────
function InviteSettings({ event, onUpdate }) {
  const [templateId,setTemplateId]=useState(event.template_id||"classic");
  const [saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[copied,setCopied]=useState(false);

  const [inviteCode,setInviteCode]=useState(event.invite_code||"");
  useEffect(()=>{if(!event.invite_code){const code=Math.random().toString(36).slice(2,10);sb.from("events").update({invite_code:code}).eq("id",event.id).then(()=>setInviteCode(code));}},[]);
  const save=async()=>{setSaving(true);await sb.from("events").update({template_id:templateId}).eq("id",event.id);onUpdate({...event,template_id:templateId,invite_code:inviteCode});setSaved(true);setTimeout(()=>setSaved(false),2500);setSaving(false);};
  const inviteUrl=`${window.location.origin}/#/invite/${inviteCode}`;
  const copy=()=>{navigator.clipboard.writeText(inviteUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const shareWA=()=>shareInviteWA(event,inviteUrl);
  const templates=INVITE_TEMPLATES[event.event_type||"wedding"]||INVITE_TEMPLATES.other;

  return(
    <div style={{padding:20,direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:100}}>
      <Card style={{padding:16,marginBottom:20,border:`2px solid ${C.blueL}`}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>🔗 לינק ההזמנה</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>שלח לאורחים  -  יוכלו לאשר הגעה ולקבל פרטים</div>
        <div style={{background:C.blueXL,borderRadius:10,padding:"8px 6px",fontSize:11,color:C.blue,fontFamily:"monospace",marginBottom:12,wordBreak:"break-all",lineHeight:1.5}}>{inviteCode?inviteUrl:"טוען..."}</div>
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
        <div style={{fontSize:11,color:C.muted,marginTop:8}}>לשינוי הפרטים  -  חזור לרשימת האירועים ולחץ ✏️</div>
      </Card>

      <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:12}}>🎨 בחר עיצוב הזמנה</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
        {templates.map(tmpl=>(
          <div key={tmpl.id} onClick={()=>setTemplateId(tmpl.id)} style={{cursor:"pointer",borderRadius:14,overflow:"hidden",border:`3px solid ${templateId===tmpl.id?C.blueL:"transparent"}`,boxShadow:templateId===tmpl.id?`0 4px 16px ${C.blueL}44`:"none",transition:"all .2s"}}>
            <div style={{height:80,background:tmpl.bg,backgroundImage:`url(${tmpl.img})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
              <div style={{position:"absolute",inset:0,background:tmpl.overlay}}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",padding:4}}>
                <span style={{fontSize:10,fontWeight:800,color:"#fff",textShadow:"0 1px 4px rgba(0,0,0,.5)",textAlign:"center",lineHeight:1.3}}>{event.bride_name&&event.groom_name?`${event.groom_name} & ${event.bride_name}`:event.name}</span>
              </div>
            </div>
            <div style={{background:templateId===tmpl.id?C.blueL:C.surface,padding:"6px",textAlign:"center",fontSize:11,fontWeight:700,color:templateId===tmpl.id?"#fff":C.text}}>{tmpl.name}</div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} style={{width:"100%",background:saved?C.success:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"background .3s"}}>
        {saving?"שומר...":(saved?"✓ נשמר!":"💾 שמור עיצוב")}
      </button>
    </div>
  );
}



// ─── CREATE EVENT SCREEN ──────────────────────────────────────────────────────
function CreateEventScreen({ user, onSelect, onLogout, onBackToLanding }) {
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",date:"",event_type:"wedding",groom_name:"",bride_name:"",venue:"",venue_address:"",event_time:""});

  useEffect(()=>{
    sb.from("events").select("*").eq("user_id",user.id).order("created_at",{ascending:false})
      .then(async({data})=>{
        const evs=data||[];
        setEvents(evs);
        if(evs.length===0)setShowForm(true);
        setLoading(false);
      });
  },[]);

  const create=async()=>{
    if(!form.name.trim())return;
    setCreating(true);
    const invite_code=Math.random().toString(36).slice(2,10);
    const{data,error}=await sb.from("events").insert({...form,name:form.name.trim(),user_id:user.id,invite_code,invite_active:true}).select().single();
    if(!error&&data)onSelect(data);
    setCreating(false);
  };

  const eventTypeEmoji=(t)=>t==="wedding"?"💍":t==="bar_mitzvah"?"✡️":t==="brit"?"👶":t==="business"?"💼":"🎉";
  const eventTypeName=(t)=>t==="wedding"?"חתונה":t==="bar_mitzvah"?"בר/ת מצווה":t==="brit"?"ברית":t==="business"?"עסקי":"אחר";

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f0e6ff,#e6f0ff,#e6fff0)"}}><Spinner size={40} color="#9147D6"/></div>);

  return(
    <div dir="rtl" style={{minHeight:"100vh",fontFamily:"'Heebo',sans-serif",background:"linear-gradient(160deg,#FFF4EE 0%,#FFF7FB 45%,#F6F0FF 100%)",position:"relative",overflowX:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} .ev-card:hover{box-shadow:0 8px 32px rgba(155,107,255,.18)!important;transform:translateY(-3px)!important;}`}</style>

      {/* TOP NAV */}
      <header style={{background:"rgba(255,255,255,.7)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(155,107,255,.1)",padding:"0 32px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBackToLanding&&<button onClick={onBackToLanding} className="sx-btn"
            style={{background:"#fff",color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"6px 12px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
            → דף הבית
          </button>}
          <div style={{width:32,height:32,borderRadius:9,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff"}}>◈</div>
          <span style={{fontWeight:900,fontSize:18,color:"#2B1D3F"}}>Sidor-IL</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:13,color:"#888"}}>{user.email}</div>
          <button onClick={onLogout}
            style={{background:"#FFF0F0",color:"#C53030",border:"1.5px solid #FED7D7",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            התנתק ←
          </button>
        </div>
      </header>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px"}}>

        {/* כותרת */}
        <div style={{background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",borderRadius:24,padding:"32px 40px",marginBottom:36,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 8px 32px rgba(155,107,255,.25)",animation:"fadeUp .5s ease both"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{background:"rgba(255,255,255,.15)",borderRadius:100,padding:"4px 12px",fontSize:12,color:"rgba(255,255,255,.9)",fontWeight:600}}>⚙️ ניהול האירועים</span>
            </div>
            <h1 style={{fontSize:"clamp(26px,3.5vw,40px)",fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.1}}>האירועים שלי</h1>
            <p style={{fontSize:14,color:"rgba(255,255,255,.7)"}}>צרו ונהלו את כל האירועים שלכם במקום אחד</p>
          </div>
          <button onClick={()=>setShowForm(true)}
            style={{background:"#fff",color:"#9147D6",border:"none",borderRadius:14,padding:"14px 28px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(0,0,0,.15)",flexShrink:0}}>
            + אירוע חדש
          </button>
        </div>

        {/* כרטיסי אירועים */}
        {events.length===0&&!showForm&&(
          <div style={{textAlign:"center",padding:"80px 0",animation:"fadeUp .5s ease both"}}>
            <div style={{fontSize:64,marginBottom:16}}>🎉</div>
            <div style={{fontSize:20,fontWeight:800,color:"#2B1D3F",marginBottom:8}}>אין עדיין אירועים</div>
            <div style={{fontSize:14,color:"#888",marginBottom:28}}>צור את האירוע הראשון שלך עכשיו</div>
            <button onClick={()=>setShowForm(true)}
              style={{background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:14,padding:"14px 36px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              + צור אירוע חדש
            </button>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:20,marginBottom:32}}>
          {events.map((ev,i)=>{
            const confirmedCount=0; // נטען בנפרד אם צריך
            const typeEmoji=eventTypeEmoji(ev.event_type);
            const eventDate=ev.date?new Date(ev.date):null;
            const monthNames=["ינו","פבר","מרץ","אפר","מאי","יוני","יולי","אוג","ספט","אוק","נוב","דצמ"];
            const dayNum=eventDate?eventDate.getDate():null;
            const monthStr=eventDate?monthNames[eventDate.getMonth()]:"";
            const daysLeft=eventDate?Math.ceil((eventDate-new Date())/(1000*60*60*24)):null;
            return(
              <div key={ev.id} className="ev-card"
                onClick={()=>onSelect(ev)}
                style={{background:"#fff",borderRadius:20,padding:"24px",cursor:"pointer",
                  boxShadow:"0 2px 16px rgba(155,107,255,.08)",
                  border:"1px solid rgba(155,107,255,.08)",
                  animation:`fadeUp .4s ease ${i*.08}s both`,
                  transition:"all .2s",position:"relative",overflow:"hidden"}}>
                {/* גרדיאנט עדין בפינה */}
                <div style={{position:"absolute",top:-20,left:-20,width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,107,255,.06) 0%,transparent 70%)"}}/>

                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{background:"#F0FFF4",color:"#276749",border:"1px solid #9AE6B4",borderRadius:100,padding:"2px 10px",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                        ✓ פעיל
                      </span>
                    </div>
                    <div style={{fontSize:17,fontWeight:900,color:"#2B1D3F",marginBottom:4}}>{ev.name}</div>
                    {eventDate&&<div style={{fontSize:12,color:"#888"}}>{eventDate.toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}</div>}
                  </div>
                  {dayNum&&(
                    <div style={{background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",borderRadius:14,padding:"8px 12px",textAlign:"center",flexShrink:0,minWidth:52}}>
                      <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{dayNum}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,.8)",fontWeight:600}}>{monthStr}</div>
                    </div>
                  )}
                </div>

                {/* פס התקדמות */}
                <div style={{borderTop:"1px solid #f0f0f0",paddingTop:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:32,height:32,borderRadius:"50%",border:"2.5px solid #9147D6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#9147D6"}}>0%</div>
                      <span style={{fontSize:13,color:"#555",fontWeight:600}}>0%</span>
                    </div>
                    <span style={{fontSize:13,color:"#888"}}>0 מגיעים</span>
                  </div>
                  <div style={{height:4,background:"#f0f0f0",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:"0%",background:"linear-gradient(90deg,#9147D6,#9B6BFF)",borderRadius:2}}/>
                  </div>
                </div>

                {daysLeft!==null&&daysLeft>0&&(
                  <div style={{marginTop:12,fontSize:11,color:"#9147D6",fontWeight:700,background:"rgba(155,107,255,.06)",borderRadius:8,padding:"5px 10px",display:"inline-block"}}>
                    ⏰ עוד {daysLeft} ימים
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* טופס יצירת אירוע */}
        {showForm&&(
          <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.4)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
            <div style={{background:"#fff",borderRadius:24,padding:"36px 32px",width:"100%",maxWidth:520,direction:"rtl",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.2)",animation:"fadeUp .3s ease both"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <h2 style={{fontSize:22,fontWeight:900,color:"#2B1D3F"}}>✨ אירוע חדש</h2>
                <button onClick={()=>setShowForm(false)} style={{background:"#f5f5f5",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,color:"#666",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>

              {/* סוג אירוע */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:10}}>סוג האירוע</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["wedding","💍","חתונה"],["bar_mitzvah","✡️","בר/ת מצווה"],["brit","👶","ברית"],["business","💼","עסקי"]].map(([v,ic,l])=>(
                    <button key={v} onClick={()=>setForm(f=>({...f,event_type:v}))}
                      style={{background:form.event_type===v?"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)":"#FBF8FD",color:form.event_type===v?"#fff":"#2B1D3F",border:`2px solid ${form.event_type===v?"transparent":"#E2E8F0"}`,borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                      {ic} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* שמות (לחתונה) */}
              {form.event_type==="wedding"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:6}}>שם החתן</div>
                    <input value={form.groom_name} onChange={e=>setForm(f=>({...f,groom_name:e.target.value}))} placeholder="עמית"
                      style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#9147D6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:6}}>שם הכלה</div>
                    <input value={form.bride_name} onChange={e=>setForm(f=>({...f,bride_name:e.target.value}))} placeholder="אורנה"
                      style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#9147D6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                </div>
              )}

              {/* שם האירוע */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:6}}>שם האירוע *</div>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="חתונת עמית ואורנה"
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:15,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
                  onFocus={e=>e.target.style.borderColor="#9147D6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
              </div>

              {/* תאריך + שעה */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:6}}>תאריך</div>
                  <DateField value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}
                    style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:6}}>שעה</div>
                  <input type="time" dir="ltr" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))}
                    style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor="#9147D6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                </div>
              </div>

              {/* אולם */}
              <div style={{marginBottom:28}}>
                <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:6}}>שם האולם / מקום</div>
                <input value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} placeholder="אולמי הגן, תל אביב"
                  style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
                  onFocus={e=>e.target.style.borderColor="#9147D6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
              </div>

              <button onClick={create} disabled={creating||!form.name.trim()}
                style={{width:"100%",background:form.name.trim()?"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)":"#E2E8F0",color:form.name.trim()?"#fff":"#aaa",border:"none",borderRadius:14,padding:"15px",fontSize:16,fontWeight:800,cursor:form.name.trim()?"pointer":"default",fontFamily:"inherit",transition:"all .2s"}}>
                {creating?"יוצר...":"✨ צור אירוע"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
// כניסת אדמין דרך חשבון Supabase אמיתי (לא סיסמה בקוד שכל אחד יכול לקרוא)
function AdminLogin({ onSuccess, onClose }) {
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
        <div style={{fontSize:13,color:"#888",marginBottom:28}}>כניסה עם חשבון האדמין</div>
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
        <button onClick={onClose} style={{background:"none",border:"none",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          חזרה לאתר
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
const ADMIN_EMAIL="amitgez331@gmail.com";
// Supabase שומר מיילים באותיות קטנות  -  השוואה בלי תלות ברישיות
const isAdminUser=u=>!!u?.email&&u.email.toLowerCase()===ADMIN_EMAIL;

const ALL_PACKAGES=[
  {id:"basic",name:"בסיס + הושבה",color:"#3A2464",icon:"🪑"},
  {id:"sms",name:"הודעות SMS",color:"#059669",icon:"📱"},
  {id:"whatsapp",name:"WhatsApp אוטומטי",color:"#25D366",icon:"💬"},
  {id:"vip",name:"VIP הכל כלול",color:"#B45309",icon:"👑"},
  {id:"reception",name:"עמדת קבלת פנים",color:"#7C3AED",icon:"💎"},
  {id:"production",name:"הפקת אירוע",color:"#DB2777",icon:"✨"},
];

function AdminDashboard({ user, onLogout }) {
  const [users,setUsers]=useState([]);       // [{user_id,email,created_at,last_sign_in_at,events:[],guests:0}]
  const [events,setEvents]=useState([]);
  const [packages,setPackages]=useState({}); // {user_id: [pkg_id, ...]}
  const [balances,setBalances]=useState({}); // {event_id: balance}
  const [requests,setRequests]=useState([]);
  const [txs,setTxs]=useState([]);
  const [guestCount,setGuestCount]=useState({}); // {event_id: n}
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("requests");
  const [search,setSearch]=useState("");
  const [saving,setSaving]=useState(null);
  const [addFor,setAddFor]=useState(null);   // {event, request?}
  const [addAmount,setAddAmount]=useState(500);
  const [addNote,setAddNote]=useState("");
  const [toast,setToast]=useState("");
  const [provider,setProvider]=useState(null); // יתרה בחשבון 019 מול מה שכבר נמכר ללקוחות

  const flash=m=>{setToast(m);setTimeout(()=>setToast(""),2600);};
  const loadProvider=async()=>{
    const{data,error}=await sb.functions.invoke("sms-provider-balance",{body:{}});
    setProvider(error?{error:"לא ניתן לבדוק את היתרה ב-019"}:data);
  };
  useEffect(()=>{loadProvider();},[]);

  const [updatedAt,setUpdatedAt]=useState(null);
  // silent: רענון ברקע בלי ספינר (כשחוזרים לחלון / כל 30 שניות)
  const loadData=async(silent=false)=>{
    if(!silent)setLoading(true);
    const [ev,g,pk,bal,req,tx,us]=await Promise.all([
      sb.from("events").select("id,name,user_id,date,event_type,venue,invite_active,created_at").order("created_at",{ascending:false}),
      sb.from("guests").select("event_id"),
      sb.from("user_packages").select("user_id,package_id"),
      sb.from("sms_balance").select("event_id,balance,total_purchased,total_sent"),
      sb.from("sms_requests").select("*").order("created_at",{ascending:false}).limit(100),
      sb.from("sms_transactions").select("*").order("created_at",{ascending:false}).limit(60),
      sb.rpc("admin_list_users"),
    ]);
    const evList=ev.data||[];
    const gc={};(g.data||[]).forEach(x=>{gc[x.event_id]=(gc[x.event_id]||0)+1;});
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

  const togglePackage=async(userId,pkgId,hasIt)=>{
    setSaving(`${userId}-${pkgId}`);
    const{error}=hasIt
      ?await sb.from("user_packages").delete().eq("user_id",userId).eq("package_id",pkgId)
      :await sb.from("user_packages").insert({user_id:userId,package_id:pkgId});
    if(error)flash("❌ "+error.message);
    else setPackages(prev=>({...prev,[userId]:hasIt?(prev[userId]||[]).filter(p=>p!==pkgId):[...(prev[userId]||[]),pkgId]}));
    setSaving(null);
  };

  const openAdd=(event,request=null)=>{setAddFor({event,request});setAddAmount(request?.amount||500);setAddNote(request?`אישור תשלום ₪${request.price??""}`:"");};
  // כמה חסר ב-019 כדי לכסות את מה שכבר נמכר + הכמות החדשה (0 = יש מספיק / לא ידוע)
  const providerShort=amt=>provider?.ok&&amt>0?Math.max(0,(provider.committed||0)+amt-(provider.provider_balance||0)):0;
  const doAdd=async()=>{
    const amt=parseInt(addAmount,10);
    if(!amt){flash("הזן כמות");return;}
    const short=providerShort(amt);
    if(short>0&&!window.confirm(`⚠️ בחשבון ה-019 חסרות ${short.toLocaleString()} הודעות כדי לכסות את כל מה שנמכר ללקוחות.\nמומלץ לטעון את חשבון ה-019 קודם.\n\nלהמשיך בכל זאת?`))return;
    setSaving("add");
    const{data,error}=await sb.rpc("admin_add_sms",{p_event:addFor.event.id,p_amount:amt,p_note:addNote||null,p_request:addFor.request?.id||null});
    setSaving(null);
    if(error){flash("❌ "+error.message);return;}
    flash(`✅ ${amt>0?"נוספו":"הורדו"} ${Math.abs(amt)} SMS · יתרה חדשה: ${data}`);
    setAddFor(null);loadData();
  };
  const reject=async r=>{
    if(!window.confirm(`לדחות בקשה ל-${r.amount} הודעות?`))return;
    const{error}=await sb.rpc("admin_reject_sms_request",{p_request:r.id});
    if(error)flash("❌ "+error.message);else{flash("הבקשה נדחתה");loadData();}
  };

  const q=search.trim().toLowerCase();
  const fUsers=users.filter(u=>!q||(u.email||"").toLowerCase().includes(q)||u.events.some(e=>e.name?.toLowerCase().includes(q)));
  const fEvents=events.filter(e=>!q||e.name?.toLowerCase().includes(q)||emailOf(e.user_id).toLowerCase().includes(q));
  const totalBalance=Object.values(balances).reduce((s,b)=>s+(b.balance||0),0);
  const totalGuests=Object.values(guestCount).reduce((s,n)=>s+n,0);
  const fmtDate=d=>d?new Date(d).toLocaleDateString("he-IL",{day:"numeric",month:"short",year:"2-digit"}):"—";
  const card={background:"#fff",border:`1px solid ${C.border}`,borderRadius:18,boxShadow:"0 6px 20px -14px rgba(91,60,140,.35)"};
  const chip=(bg,fg)=>({background:bg,color:fg,borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800,whiteSpace:"nowrap"});
  const TABS=[["requests","🛒 בקשות SMS",pending.length],["events","📅 אירועים ו-SMS",events.length],["users","👥 משתמשים וחבילות",users.length],["log","🧾 יומן SMS",null]];
  const TX_LABEL={admin:"הוספת אדמין",purchase:"רכישה",send:"שליחה",refund:"החזר"};

  return(
    <div dir="rtl" style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Heebo',sans-serif"}}>
      <style>{`.adm-tab:hover{background:#fff!important;border-color:${C.blueL}!important}.adm-row:hover{border-color:${C.blueL}!important;box-shadow:0 10px 24px -16px rgba(91,60,140,.5)!important}`}</style>

      {/* כותרת */}
      <div style={{background:GRAD,color:"#fff",padding:"18px 24px 64px"}}>
        <div style={{maxWidth:1180,margin:"0 auto",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{width:44,height:44,borderRadius:14,background:"rgba(255,255,255,.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🛡️</div>
          <div style={{flex:1,minWidth:180}}>
            <div style={{fontWeight:900,fontSize:22}}>ניהול Sidor-IL</div>
            <div style={{fontSize:12,opacity:.9}}>{user.email}{updatedAt&&` · עודכן ${updatedAt.toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`}</div>
          </div>
          <button onClick={()=>{window.location.hash="";}} className="sx-btn" style={{background:"rgba(255,255,255,.2)",color:"#fff",border:"1px solid rgba(255,255,255,.4)",borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>→ לאתר</button>
          <button onClick={refreshAll} className="sx-btn" style={{background:"rgba(255,255,255,.2)",color:"#fff",border:"1px solid rgba(255,255,255,.4)",borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🔄 רענן</button>
          <button onClick={onLogout} className="sx-btn" style={{background:"#fff",color:C.danger,border:"none",borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>יציאה</button>
        </div>
      </div>

      <div style={{maxWidth:1180,margin:"-46px auto 0",padding:"0 20px 40px"}}>
        {/* נתונים */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:18}}>
          {[["👥","משתמשים",users.length,C.blueL],["📅","אירועים",events.length,C.coral],["🎊","אורחים",totalGuests,C.gold],["📱","יתרת SMS כוללת",totalBalance,C.info],["🛒","בקשות ממתינות",pending.length,pending.length?C.danger:C.success]].map(([ic,l,v,c])=>(
            <div key={l} style={{...card,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:44,height:44,borderRadius:14,background:c+"1F",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{ic}</div>
              <div>
                <div style={{fontSize:24,fontWeight:900,lineHeight:1,color:C.text}}>{loading?"…":v.toLocaleString()}</div>
                <div style={{fontSize:12,color:C.muted,fontWeight:700,marginTop:3}}>{l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* יתרה בספק (019) מול מה שנמכר ללקוחות */}
        <div style={{...card,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",
          borderRight:`4px solid ${!provider?C.border:provider.ok?(providerShort(1)>0?C.danger:C.success):C.gold}`}}>
          <div style={{width:44,height:44,borderRadius:14,background:C.blueXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏦</div>
          <div style={{flex:1,minWidth:220}}>
            <div style={{fontWeight:900,fontSize:15}}>חשבון 019 (ספק ה-SMS)</div>
            {!provider?<div style={{fontSize:13,color:C.muted}}>בודק יתרה…</div>
              :provider.ok?<div style={{fontSize:13,color:C.muted}}>
                יתרה ב-019: <b style={{color:C.text}}>{(provider.provider_balance??0).toLocaleString()}</b> ·
                נמכרו ללקוחות ועוד לא נשלחו: <b style={{color:C.text}}>{(provider.committed??0).toLocaleString()}</b> ·
                פנוי למכירה: <b style={{color:(provider.provider_balance-provider.committed)<0?C.danger:C.success}}>{((provider.provider_balance??0)-(provider.committed??0)).toLocaleString()}</b>
              </div>
              :<div style={{fontSize:13,color:"#8A5A00"}}>{provider.configured===false?"⚠️ החיבור ל-019 עוד לא הוגדר (SMS019_USERNAME / SMS019_TOKEN)":`⚠️ ${provider.error||"019 החזיר שגיאה"}${provider.provider_status!=null?` (סטטוס ${provider.provider_status})`:""}`}</div>}
          </div>
          <button onClick={loadProvider} className="sx-btn" style={{background:"#fff",color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 12px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🔄 בדוק שוב</button>
        </div>

        {/* טאבים + חיפוש */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:14}}>
          {TABS.map(([id,label,count])=>(
            <button key={id} onClick={()=>setTab(id)} className={tab===id?"":"adm-tab"}
              style={{background:tab===id?GRAD:"#fff",color:tab===id?"#fff":C.text,border:`1.5px solid ${tab===id?"transparent":C.border}`,borderRadius:12,padding:"9px 14px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:7,boxShadow:tab===id?`0 8px 18px -8px ${C.blueM}`:"none"}}>
              {label}
              {count!==null&&<span style={{background:tab===id?"rgba(255,255,255,.25)":(id==="requests"&&count?"#FDECEE":C.blueXL),color:tab===id?"#fff":(id==="requests"&&count?C.danger:C.muted),borderRadius:100,padding:"0 8px",fontSize:12}}>{count}</span>}
            </button>
          ))}
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש לפי מייל או שם אירוע..."
            style={{marginRight:"auto",minWidth:240,flex:"0 1 320px",background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"9px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit"}}/>
        </div>

        {loading?(
          <div style={{textAlign:"center",padding:60}}><Spinner size={36}/></div>
        ):tab==="requests"?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
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
                <div style={{display:"flex",gap:6,flexWrap:"wrap",fontSize:12}}>
                  <span style={chip(C.blueXL,C.text)}>📅 {ev.date?fmtDate(ev.date):"ללא תאריך"}</span>
                  <span style={chip(C.blueXL,C.text)}>🎊 {guestCount[ev.id]||0} אורחים</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,background:C.blueXL,borderRadius:14,padding:"10px 12px"}}>
                  <div style={{fontSize:22}}>📱</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:20,fontWeight:900,lineHeight:1}}>{(b?.balance??0).toLocaleString()}</div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:700}}>יתרת SMS · נשלחו {b?.total_sent??0}</div>
                  </div>
                  <button onClick={()=>openAdd(ev)} className="sx-btn sx-btn-primary" style={{background:GRAD,color:"#fff",border:"none",borderRadius:12,padding:"9px 14px",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>+ הוסף SMS</button>
                </div>
              </div>
            );})}
            {fEvents.length===0&&<div style={{...card,padding:30,textAlign:"center",color:C.muted}}>לא נמצאו אירועים</div>}
          </div>
        ):tab==="users"?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {fUsers.map(u=>(
              <div key={u.user_id} className="adm-row" style={{...card,padding:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:GRAD,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17}}>{(u.email||"?")[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:900,fontSize:15,direction:"ltr",textAlign:"right"}}>{u.email||u.user_id}</div>
                    <div style={{fontSize:12,color:C.muted}}>הצטרף {fmtDate(u.created_at)} · כניסה אחרונה {fmtDate(u.last_sign_in_at)}</div>
                  </div>
                  <span style={chip(C.blueXL,C.text)}>{u.events.length} אירועים</span>
                  <span style={chip(C.blueXL,C.text)}>{u.guests} אורחים</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6}}>
                  {ALL_PACKAGES.map(pkg=>{
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
      </div>

      {/* חלון הוספת SMS */}
      {addFor&&(
        <div style={{position:"fixed",inset:0,zIndex:320,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setAddFor(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"22px",width:"100%",maxWidth:430,boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)"}}>
            <div style={{fontSize:19,fontWeight:900,marginBottom:2}}>📱 {addFor.request?"אישור רכישה":"הוספת SMS"}</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:14}}>{addFor.event.name} · יתרה כרגע {balances[addFor.event.id]?.balance??0}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
              {SMS_PACKS.map(([a])=>(
                <button key={a} onClick={()=>setAddAmount(a)} style={{background:+addAmount===a?GRAD:C.blueXL,color:+addAmount===a?"#fff":C.text,border:"none",borderRadius:10,padding:"9px 0",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>{a}</button>
              ))}
            </div>
            <div style={{fontSize:12,fontWeight:800,color:C.muted,margin:"4px 0 6px"}}>כמות (אפשר מספר שלילי כדי להוריד)</div>
            <input type="number" value={addAmount} onChange={e=>setAddAmount(e.target.value)} dir="ltr"
              style={{width:"100%",boxSizing:"border-box",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",fontSize:18,fontWeight:900,color:C.text,outline:"none",fontFamily:"inherit",marginBottom:10,textAlign:"center"}}/>
            {providerShort(+addAmount||0)>0&&(
              <div style={{background:"#FDECEE",border:"1px solid #F4C7CD",color:C.danger,borderRadius:12,padding:"8px 12px",fontSize:12,fontWeight:800,marginBottom:10}}>
                ⚠️ אחרי ההוספה יחסרו ב-019 {providerShort(+addAmount).toLocaleString()} הודעות. כדאי לטעון את חשבון ה-019 קודם.
              </div>
            )}
            <input value={addNote} onChange={e=>setAddNote(e.target.value)} placeholder="הערה (למשל: שולם ב-Bit)"
              style={{width:"100%",boxSizing:"border-box",background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",marginBottom:14}}/>
            <button onClick={doAdd} disabled={saving==="add"} className="sx-btn sx-btn-primary"
              style={{width:"100%",background:GRAD,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:6,opacity:saving==="add"?.6:1}}>
              {saving==="add"?"שומר...":+addAmount<0?`הורד ${Math.abs(+addAmount)} SMS`:`טען ${(+addAmount||0).toLocaleString()} SMS`}
            </button>
            <button onClick={()=>setAddFor(null)} style={{width:"100%",background:"none",border:"none",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",padding:6}}>ביטול</button>
          </div>
        </div>
      )}

      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.text,color:"#fff",borderRadius:14,padding:"12px 18px",fontSize:14,fontWeight:800,zIndex:400,boxShadow:"0 14px 30px -10px rgba(0,0,0,.4)"}}>{toast}</div>}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
function PrivacyPage() {
  return(
    <div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:"#f9f9f9",minHeight:"100vh"}}>
      <div style={{background:"#fff",borderBottom:"1px solid #eee",padding:"16px 6vw",display:"flex",alignItems:"center",gap:16}}>
        <a href="#" onClick={e=>{e.preventDefault();window.location.hash="";}} style={{color:C.blue,textDecoration:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>← חזור לדף הבית</a>
        <span style={{color:"#ccc"}}>|</span>
        <span style={{fontWeight:800,color:"#1a1a1a",fontSize:15}}>Sidor-IL</span>
      </div>
      <div style={{maxWidth:800,margin:"0 auto",padding:"48px 24px 80px"}}>
        <h1 style={{fontSize:28,fontWeight:900,color:"#1a1a1a",marginBottom:8}}>מדיניות פרטיות</h1>
        <p style={{fontSize:13,color:"#888",marginBottom:40}}>עדכון אחרון: ינואר 2025</p>

        {[
          {title:"1. כללי",text:`Sidor-IL ("החברה", "אנחנו") מפעילה את הפלטפורמה בכתובת sidoril.com ("השירות"). מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך בעת השימוש בשירות. בשימושך בשירות, אתה מסכים לאיסוף ושימוש במידע בהתאם למדיניות זו.`},
          {title:"2. מידע שאנו אוספים",text:`אנו אוספים את סוגי המידע הבאים:\n\n• מידע אישי: שם, כתובת אימייל, מספר טלפון בעת ההרשמה.\n• מידע על האירוע: פרטי האירוע, רשימות אורחים, פרטי אורחים שמוזנים על ידך.\n• מידע טכני: כתובת IP, סוג דפדפן, דפים שנצפו, זמני גישה.\n• מידע שימוש: אופן השימוש בתכונות השירות.`},
          {title:"3. שימוש במידע",text:`אנו משתמשים במידע לצורך:\n\n• מתן השירות וניהול חשבונך.\n• שליחת הודעות SMS ו-WhatsApp לאורחים בשמך, בהתאם להוראותיך.\n• שיפור השירות וחווית המשתמש.\n• משלוח עדכונים חשובים על השירות.\n• עמידה בדרישות חוקיות.`},
          {title:"4. אחסון ואבטחת מידע",text:`המידע שלך מאוחסן בשרתים מאובטחים של Supabase (AWS). אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע. עם זאת, אין אנו יכולים להבטיח אבטחה מוחלטת של מידע המועבר דרך האינטרנט.`},
          {title:"5. מידע על אורחים",text:`בעת שימוש בשירות, אתה מעלה פרטי אורחים (שמות, טלפונים). אתה מצהיר כי קיבלת את ההסכמה הנדרשת לשמירת פרטים אלה. אנו לא נשתמש בפרטי האורחים לכל מטרה מלבד מתן השירות לך. פרטי האורחים נמחקים עם מחיקת האירוע.`},
          {title:"6. שיתוף מידע עם צדדים שלישיים",text:`אנו לא מוכרים או משכירים מידע אישי. אנו עשויים לשתף מידע עם:\n\n• ספקי שירות: Supabase (אחסון), Twilio (WhatsApp), 019 SMS - לצורך מתן השירות בלבד.\n• רשויות: אם מחויבים על פי חוק.\n\nכל הספקים כפופים להסכמי סודיות.`},
          {title:"7. זכויותיך",text:`בהתאם לחוק הגנת הפרטיות, יש לך זכות:\n\n• לעיין במידע האישי שנשמר עליך.\n• לתקן מידע שגוי.\n• למחוק את חשבונך ואת המידע הקשור אליו.\n• לבטל הסכמה לקבלת הודעות שיווקיות.\n\nלמימוש זכויותיך, צור קשר: sidoril2026@gmail.com`},
          {title:"8. עוגיות (Cookies)",text:`אנו משתמשים בעוגיות חיוניות לפעולת השירות. אין אנו משתמשים בעוגיות מעקב פרסומי. ניתן לחסום עוגיות בהגדרות הדפדפן, אך הדבר עלול לפגוע בפעולת השירות.`},
          {title:"9. פרטיות קטינים",text:`השירות אינו מיועד לילדים מתחת לגיל 18. אנו לא אוספים ביודעין מידע מקטינים. אם נודע לנו שנאסף מידע מקטין, נמחק אותו מיידית.`},
          {title:"10. שינויים במדיניות",text:`אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יועברו בהודעה לאימייל הרשום. המשך השימוש בשירות לאחר פרסום השינויים מהווה הסכמה למדיניות המעודכנת.`},
          {title:"11. יצירת קשר",text:`לכל שאלה בנושא פרטיות:\n\nSidor-IL\nהשושנים 30, נוף הגליל\nטלפון: 052-681-7102\nאימייל: sidoril2026@gmail.com\nוואטסאפ: https://wa.me/972526817102`},
        ].map(({title,text})=>(
          <div key={title} style={{marginBottom:32}}>
            <h2 style={{fontSize:17,fontWeight:900,color:"#1a1a1a",marginBottom:10,borderRight:"3px solid "+C.blue,paddingRight:12}}>{title}</h2>
            <p style={{fontSize:14,color:"#444",lineHeight:1.9,whiteSpace:"pre-line"}}>{text}</p>
          </div>
        ))}

        <div style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px",marginTop:40,fontSize:13,color:C.blue,fontWeight:700}}>
          📧 לשאלות: sidoril2026@gmail.com | 📞 052-681-7102
        </div>
      </div>
    </div>
  );
}

// קישור אישי קצר מ-SMS (sidoril.com/i/<קוד>)  -  מתרגם לדף ההזמנה של האורח
function ShortLinkRedirect({ short }) {
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

export default function App() {
  const [user,setUser]=useState(null),[event,setEvent]=useState(null),[checking,setChecking]=useState(true),[authMode,setAuthMode]=useState(null),[showLanding,setShowLanding]=useState(false);
  const [showPrivacy,setShowPrivacy]=useState(window.location.hash==="#/privacy");
  const [showResetPw,setShowResetPw]=useState(false);
  const [resetPw,setResetPw]=useState({newP:"",confirm:"",msg:null,loading:false});

  useEffect(()=>{
    const onHash=()=>setShowPrivacy(window.location.hash==="#/privacy");
    window.addEventListener("hashchange",onHash);
    // זיהוי קישור שחזור סיסמה בלבד (לא כניסה עם גוגל)
    const hash=window.location.hash;
    if(hash.includes("type=recovery")){
      setShowResetPw(true);
    }
    return()=>window.removeEventListener("hashchange",onHash);
  },[]);

  const selectEvent=(ev)=>{
    setEvent(ev);
    if(ev)localStorage.setItem("sidor_event_id",ev.id);
    else localStorage.removeItem("sidor_event_id");
  };

  // ← useEffect חייב להיות לפני כל return!
  useEffect(()=>{
    sb.auth.getSession().then(async({data})=>{
      const u=data.session?.user||null;
      setUser(u);
      // שחזור האירוע האחרון אחרי רענון דף
      const savedId=localStorage.getItem("sidor_event_id");
      if(u&&savedId){
        const{data:ev}=await sb.from("events").select("*").eq("id",savedId).eq("user_id",u.id).maybeSingle();
        if(ev)setEvent(ev);
        else localStorage.removeItem("sidor_event_id");
      }
      setChecking(false);
    }).catch(()=>setChecking(false));
    const{data:{subscription}}=sb.auth.onAuthStateChange((evt,session)=>{
      if(evt==="PASSWORD_RECOVERY")setShowResetPw(true);
      if(!session?.user){
        setUser(null);setEvent(null);localStorage.removeItem("sidor_event_id");
      } else {
        setUser(session.user);
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  const logout=async()=>{await sb.auth.signOut();setUser(null);setEvent(null);localStorage.removeItem("sidor_event_id");localStorage.removeItem("sidor_admin");setShowLanding(false);};

  const path=window.location.pathname;
  const hash=window.location.hash;
  const isAdmin=hash==="#/admin"||path==="/admin";

  // טיפול באימות מייל
  const isAuthConfirm=path==="/auth/confirm"||hash.includes("token_hash");
  if(isAuthConfirm){
    const params=new URLSearchParams(hash.replace("#","").replace("?",""));
    const tokenHash=params.get("token_hash");
    const type=params.get("type");
    if(tokenHash&&type){
      sb.auth.verifyOtp({token_hash:tokenHash,type}).then(({data,error})=>{
        if(!error)window.location.href="/";
        else window.location.href="/?error=verification_failed";
      });
    } else {
      window.location.href="/";
    }
    return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,flexDirection:"column",gap:14,fontFamily:"'Heebo',sans-serif",direction:"rtl"}}>
      <Spinner size={40}/>
      <p style={{color:C.muted,fontSize:15}}>מאמת את המייל שלך...</p>
    </div>);
  }

  const shortMatch=path.match(/^\/i\/([a-z0-9]+)\/?$/i);
  if(shortMatch)return <ShortLinkRedirect short={shortMatch[1]}/>;

  const inviteMatch=path.match(/^\/invite\/([a-z0-9]+)/i)||hash.match(/^#\/invite\/([a-z0-9]+)/i);
  if(inviteMatch){
    const guestId=new URLSearchParams(window.location.search).get("g")||
      hash.includes("?g=")&&hash.split("?g=")[1]||null;
    return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style><InvitePage code={inviteMatch[1]} guestId={guestId}/></>);
  }

  if(checking)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><Spinner size={40}/></div>);

  // ניתוב לדף אדמין  -  לפני כל שאר הניתובים!
  if(isAdmin){
    if(!isAdminUser(user))return(
      <AdminLogin onSuccess={u=>{setUser(u);}} onClose={()=>window.location.hash=""}/>
    );
    return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AdminDashboard user={user} onLogout={logout}/>
    </>);
  }

  if(showPrivacy) return <PrivacyPage/>;

  // דף איפוס סיסמה
  if(showResetPw) return(
    <div dir="rtl" style={{minHeight:"100vh",background:"#FBF7FC",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Heebo',sans-serif",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:32,width:"100%",maxWidth:400,boxShadow:"0 8px 32px rgba(91,60,140,.12)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>🔑</div>
          <div style={{fontSize:20,fontWeight:900,color:"#1a1a1a"}}>הגדרת סיסמה חדשה</div>
          <div style={{fontSize:13,color:"#888",marginTop:4}}>הזן את הסיסמה החדשה שלך</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input type="password" placeholder="סיסמה חדשה" value={resetPw.newP}
            onChange={e=>setResetPw(r=>({...r,newP:e.target.value}))}
            style={{border:"1.5px solid #E2E8F0",borderRadius:12,padding:"12px 16px",fontSize:14,fontFamily:"inherit",outline:"none"}}/>
          <input type="password" placeholder="אימות סיסמה חדשה" value={resetPw.confirm}
            onChange={e=>setResetPw(r=>({...r,confirm:e.target.value}))}
            style={{border:"1.5px solid #E2E8F0",borderRadius:12,padding:"12px 16px",fontSize:14,fontFamily:"inherit",outline:"none"}}/>
          {resetPw.msg&&<div style={{fontSize:13,fontWeight:700,color:resetPw.msg.err?"#C53030":"#276749",textAlign:"center"}}>{resetPw.msg.txt}</div>}
          <button onClick={async()=>{
            if(resetPw.newP!==resetPw.confirm){setResetPw(r=>({...r,msg:{err:true,txt:"הסיסמאות לא תואמות"}}));return;}
            if(resetPw.newP.length<6){setResetPw(r=>({...r,msg:{err:true,txt:"סיסמה חייבת להכיל לפחות 6 תווים"}}));return;}
            setResetPw(r=>({...r,loading:true,msg:null}));
            const{error}=await sb.auth.updateUser({password:resetPw.newP});
            if(error){setResetPw(r=>({...r,loading:false,msg:{err:true,txt:authErrorText(error)}}));}
            else{
              setResetPw(r=>({...r,loading:false,msg:{err:false,txt:"✅ הסיסמה עודכנה בהצלחה!"}}));
              setTimeout(()=>{setShowResetPw(false);window.location.hash="";},2000);
            }
          }} disabled={resetPw.loading}
            style={{background:"linear-gradient(120deg,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
            {resetPw.loading?"מעדכן...":"עדכן סיסמה"}
          </button>
        </div>
      </div>
    </div>
  );

  if(!user||showLanding) return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}} @keyframes slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:none;opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}} @media(min-width:768px){.nav-link{display:block!important;}} @media(max-width:767px){.hide-mobile{display:none!important;}}`}</style>
    {/* משתמש מחובר שחזר לדף הבית: כפתורי הכניסה מחזירים אותו ישר למערכת */}
    <LandingPage onOpenAuth={mode=>{setShowLanding(false);if(!user)setAuthMode(mode);}} onLogout={user?logout:null} loggedIn={!!user}/>
    {authMode&&<AuthDrawer mode={authMode} onClose={()=>setAuthMode(null)} onAuth={u=>{setUser(u);setAuthMode(null);setShowLanding(false);}}/>}
    <AccessibilityWidget/>
  </>);

  if(!event)return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <CreateEventScreen user={user} onSelect={selectEvent} onLogout={logout} onBackToLanding={()=>setShowLanding(true)}/>
  </>);

  return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}`}</style>
  <SeatingApp user={user} event={event} onBack={()=>selectEvent(null)} onUpdate={data=>setEvent(ev=>({...ev,...data}))} onLogout={logout} onHome={()=>setShowLanding(true)}/></>);
}
