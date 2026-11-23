import { useState, useEffect, useCallback, useRef, useLayoutEffect, Fragment, lazy, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, sb, C, GRAD, ini, EVENT_KINDS, childOf, eventWords, normPhone, formatPhone, parseGuestLine, splitNamePhone, PhoneExistsDialog, Spinner, cdParts, useTick, IvCountdown, DEFAULT_MEALS, rsvpQOf, anyRsvpQ, GuestQR, INVITE_TEMPLATES, InviteConfetti, InvitePage, INVITE_STYLES, inviteStyleOf, INVITE_STYLE_CSS, ShortLinkRedirect, InviteRoute, inviteRouteMatch, shortRouteMatch } from "./invite-core.jsx";

const REF_KEY="sidor_ref";
// נכנסו דרך "כניסת מפיקים" (בלשונית הזו): פותחים את לוח המפיק ולא את האירוע האחרון
export const PRODUCER_ENTRY_KEY="sidor_producer_entry";
// סוג החשבון שנבחר בהרשמה ("vendor" = ספק). נשמר במכשיר כדי לשרוד גם כניסה עם Google
const ACCOUNT_KEY="sidor_account"; // ישן: בחירת "ספק" בהרשמה. כבר לא בשימוש, נמחק בכניסה
// ─── פרטי הקשר של Sidor-IL — במקום אחד בלבד ───
// SUPPORT_PHONE: המספר שמוצג באתר (טלפון + וואטסאפ). כרגע ריק: כפתורי הוואטסאפ והטלפון מוסתרים, וכל הפניות והרכישות עוברות למייל.
// כשיהיה מספר חדש — כותבים אותו כאן (למשל "05X-XXXXXXX"), וכל האתר מתעדכן: כפתורים, תחתית, מדיניות ונגישות
export const SUPPORT_PHONE="";
export const SUPPORT_MAIL="sidoril2026@gmail.com";
export const SUPPORT_WA=SUPPORT_PHONE?"972"+SUPPORT_PHONE.replace(/\D/g,"").replace(/^0/,""):"";
const SUPPORT_TEL=SUPPORT_PHONE.replace(/[^\d+]/g,"");
export const CONTACT_BY=SUPPORT_WA?"בוואטסאפ":"במייל";
export const contactUrl=(text="",subject="פנייה ל-Sidor-IL")=>SUPPORT_WA?`https://wa.me/${SUPPORT_WA}${text?`?text=${encodeURIComponent(text)}`:""}`:`mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent(subject)}${text?`&body=${encodeURIComponent(text)}`:""}`;
export const openContact=(text,subject)=>{const u=contactUrl(text,subject);try{if(SUPPORT_WA)window.open(u,"_blank","noopener,noreferrer");else window.location.href=u;}catch{}};
// שורות "טלפון / וואטסאפ" לטקסטים (מדיניות, נגישות, ביטול) — ריקות כשאין מספר
const CONTACT_LINES=(sep="\n")=>[SUPPORT_PHONE&&`טלפון: ${SUPPORT_PHONE}`,`אימייל: ${SUPPORT_MAIL}`,SUPPORT_WA&&`וואטסאפ: https://wa.me/${SUPPORT_WA}`].filter(Boolean).join(sep);
const JOIN_TEXT="היי, אני ספק / מפיק אירועים ואשמח להצטרף ל-Sidor-IL. אפשר פרטים?";
const JOIN_WA_URL=()=>contactUrl(JOIN_TEXT,"הצטרפות ספק / מפיק ל-Sidor-IL");
const openJoin=()=>openContact(JOIN_TEXT,"הצטרפות ספק / מפיק ל-Sidor-IL");
// ─── הסכמה לאחסון לא חיוני (באנר העוגיות) ───
// "all" = אישור · "essential" = דחייה · כל ערך אחר = עוד לא נבחר (כמו דחייה: לא שומרים דברים לא חיוניים).
// חיוני תמיד: ההתחברות, הבחירה הזו, ומצב הניווט בלשונית. לא חיוני: הפניה, חזרה למסך האחרון, הגדרות תצוגה ונגישות.
const COOKIE_KEY="sidor_cookie_ok";
const OPTIONAL_STORAGE=["sidor_ref","sidor_a11y","sidor_aside","sidor_event_id","sidor_last_screen","sidor_events_view","sidor_view_tip","sidor_push_ask"];
const REF_PENDING="sidor_ref_pending"; // קוד הפניה עד שהגולש בוחר (בלשונית בלבד, נמחק עם סגירתה)
function cookieChoice(){try{const v=localStorage.getItem(COOKIE_KEY);return v==="all"||v==="essential"?v:null;}catch{return null;}}
export function optSet(k,v){if(cookieChoice()!=="all")return;try{localStorage.setItem(k,v);}catch{}}
function setCookieChoice(choice){
  try{
    localStorage.setItem(COOKIE_KEY,choice);
    if(choice==="all"){const p=sessionStorage.getItem(REF_PENDING);if(p)localStorage.setItem(REF_KEY,p);}
    else OPTIONAL_STORAGE.forEach(k=>localStorage.removeItem(k)); // דחייה: מוחקים גם מה שכבר נשמר
    sessionStorage.removeItem(REF_PENDING);
  }catch{}
}
const openCookieSettings=()=>window.dispatchEvent(new Event("sidor-cookie-settings"));
const captureRef=()=>{try{const r=new URLSearchParams(window.location.search).get("ref");if(r&&/^[\w-]{2,40}$/.test(r)){const v=JSON.stringify({ref:r.toLowerCase(),at:Date.now()}),c=cookieChoice();if(c==="all")localStorage.setItem(REF_KEY,v);else if(!c)sessionStorage.setItem(REF_PENDING,v);}}catch{}};
export const myRefCode=u=>u?.id?u.id.replace(/-/g,"").slice(0,8):"";
const applyRef=async u=>{
  let r=null;try{const v=JSON.parse(localStorage.getItem(REF_KEY)||"null");if(v&&Date.now()-v.at<60*864e5)r=v.ref;}catch{}
  if(!u||!r)return;
  try{localStorage.removeItem(REF_KEY);}catch{}
  // רק משתמש שנרשם עכשיו (לא משתמש ותיק שלחץ על קישור), ולא הפניה עצמית
  if(u.user_metadata?.ref||r===myRefCode(u)||Date.now()-new Date(u.created_at).getTime()>3*864e5)return;
  await sb.auth.updateUser({data:{ref:r}}).catch(()=>{});
};
export const WaIcon=({size=16,color="#fff"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42"/></svg>
);
export const SMS_UNIT_PRICE=0.5, SMS_BUY_MIN=50, SMS_BUY_SLIDER_MAX=5000, SMS_BUY_MAX=20000, BASIC_PRICE=100;
// "כניסה לאולם" מוצגת רק למפיקי אירועים (חבילת producer), לא לזוגות ולא לבעלי אירוע רגילים
const fxReduced=()=>{try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches||(document.getElementById("a11y-style")?.textContent||"").includes("animation:none");}catch{return true;}};
// CountUp: מציג את הערך, ובפעם הראשונה שהוא נראה על המסך רץ אליו מ-0. "33%", "19/24", "1,250" — רק המספר הראשון רץ
export function CountUp({ value, ms=900 }) {
  const str=String(value??""),m=str.match(/^(\D*?)(\d[\d,]*)(.*)$/s);
  const target=m?parseInt(m[2].replace(/,/g,""),10):NaN;
  // ברירת מחדל: הערך האמיתי. הספירה רצה רק כשהמספר נראה בפועל, ואם הדפדפן לא מצייר (לשונית ברקע) — חוזרים לערך מעצמו
  const ref=useRef(null),[shown,setShown]=useState(null);
  useLayoutEffect(()=>{
    if(!m||!(target>0)||fxReduced()||!ref.current)return;
    let raf=0,fb=0,io,done=false;
    const start=()=>{
      setShown(0);const t0=performance.now();
      const step=t=>{const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);if(k<1){setShown(Math.round(target*e));raf=requestAnimationFrame(step);}else{done=true;setShown(null);}};
      raf=requestAnimationFrame(step);
      fb=setTimeout(()=>{if(!done){cancelAnimationFrame(raf);setShown(null);}},ms+500);
    };
    const r=ref.current.getBoundingClientRect();
    if(r.top<window.innerHeight&&r.bottom>0)start();
    else if("IntersectionObserver" in window){io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();start();}},{threshold:.4});io.observe(ref.current);}
    return()=>{cancelAnimationFrame(raf);clearTimeout(fb);io&&io.disconnect();};
  },[]);
  if(shown===null||!m)return <span ref={ref}>{str}</span>;
  const useComma=m[2].includes(",")||target>=1000;
  return <span ref={ref} aria-label={str}>{m[1]}{useComma?shown.toLocaleString("he-IL"):shown}{m[3]}</span>;
}
const FX_SEL=".sx-btn-primary,.lp-btn.lp-primary,.lp-btn.lp-white,.hm-pill.p,.pk-buy,.pk-btn,.ad-go,.vd-wa,.ev-live-go,.lp-btn.lp-ghost,.hm-pill";
function installFxRipple(){
  if(typeof window==="undefined"||window.__fxRipple)return;window.__fxRipple=true;
  document.addEventListener("pointerdown",e=>{
    if(e.button!==0||fxReduced())return;
    const el=e.target.closest?.(FX_SEL);if(!el||el.disabled)return;
    const cs=getComputedStyle(el);if(cs.overflow!=="hidden"){if(cs.position==="static")return;}
    const r=el.getBoundingClientRect(),d=Math.max(r.width,r.height)*2.2,sp=document.createElement("span");
    const light=el.classList.contains("lp-ghost")||(el.classList.contains("hm-pill")&&(el.classList.contains("g")||el.classList.contains("s")));
    sp.className="fx-ripple"+(light?" dark":"");sp.style.width=sp.style.height=d+"px";sp.style.left=(e.clientX-r.left)+"px";sp.style.top=(e.clientY-r.top)+"px";
    if(cs.overflow!=="hidden")el.style.overflow="hidden";
    el.appendChild(sp);setTimeout(()=>sp.remove(),600);
  },{passive:true});
}

// ─── RSVP BADGE ──────────────────────────────────────────────────────────────
function VenuePage({ onBack, onOpenAuth }) {
  useEffect(()=>{window.scrollTo(0,0);},[]);
  const wa=contactUrl("שלום, אני מעוניין לשמוע על שיתוף פעולה עם Sidor-IL","שיתוף פעולה עם Sidor-IL");
  const offers=[
    {icon:"🪑",bg:"#FFEFF5",title:"מערכת הושבה מתקדמת",desc:"ניהול מלא של סידורי הושבה לכל אירוע: ממשק גרירה, מפה אינטראקטיבית ופתק הושבה."},
    {icon:"✅",bg:"#E9FBF4",title:"אישורי הגעה דיגיטליים",desc:"שליחת הזמנות דיגיטליות ואישורי הגעה בוואטסאפ וב-SMS לכל האורחים."},
    {icon:"📟",bg:"#F1EAFF",title:"כניסה בלי תורים",desc:"עמדת טאבלט שבה האורח מקליד את השם ומקבל פתק שולחן, או צוות הושבה מקצועי ביום האירוע."},
    {icon:"📊",bg:"#FFF6E5",title:"כמה אירועים במקביל",desc:"מפיקים מנהלים את כל האירועים שלהם מחשבון אחד."},
    {icon:"🏷️",bg:"#EAF4FF",title:"המותג שלכם בהזמנה",desc:"הלוגו, השם והטלפון שלכם מופיעים בדף ההזמנה של כל האורחים."},
  ];
  const steps=[["1","מקבלים קישור אישי","קישור עם הקוד שלכם, למשל sidoril.com/?ref=השם-שלכם"],["2","שולחים ללקוחות","בוואטסאפ, במייל אחרי סגירת האירוע, או כ-QR על דלפק הקבלה"],["3","מקבלים תגמול","כל לקוח שנרשם דרך הקישור נרשם על שמכם, והתגמול לפי מה שנסכם איתכם"]];
  return(
    <PublicPage pageKey="venue">
      <PageHero crumbs={<><LpHomeCrumb onClick={onBack}/>{LP_SEP}<span>אולמות ומפיקים</span></>} title="אולמות ומפיקים"
        lead="שיתוף פעולה עם Sidor-IL: הושבה, אישורי הגעה וכניסה בלי תורים ללקוחות שלכם, עם המותג שלכם, ותוכנית שותפים.">
        <div className="lp-hero-cta" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          {onOpenAuth&&<button type="button" className="lp-btn lp-primary" onClick={()=>onOpenAuth("login")} style={{padding:"13px 32px 13px 14px",fontSize:18,minHeight:58}}>כניסה לחשבון<LpGo/></button>}
          <a href={wa} {...(SUPPORT_WA?{target:"_blank",rel:"noopener noreferrer"}:{})} className="lp-btn lp-ghost" style={{padding:"13px 30px",fontSize:18,minHeight:58}}>דברו איתנו {CONTACT_BY}</a>
        </div>
      </PageHero>
      <section className="lp-sheet" style={{background:"#EEF4FF",marginTop:28}}>
        <div className="lp-wrap">
          <LpTitle title="מה" accent="אנחנו מציעים" sub="הכלים שהזוגות והמשפחות שסוגרים אצלכם צריכים, במערכת אחת."/>
          <div className="lp-cards">
            {offers.map((o,i)=>(
              <div key={o.title} className="lp-pcard2 lp-lift" data-reveal style={{"--d":`${(i%3*.07).toFixed(2)}s`}}>
                <span className="lp-emo" style={{background:o.bg}} aria-hidden="true">{o.icon}</span>
                <h3>{o.title}</h3>
                <p>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="lp-sheet" style={{background:"#FFF0F6"}}>
        <div className="lp-wrap">
          <LpTitle title="תוכנית" accent="שותפים" sub="ממליצים על Sidor-IL לזוגות ולמשפחות שסוגרים אצלכם, ומקבלים תגמול על כל לקוח שמגיע דרככם."/>
          <ol className="lp-steps3">
            {steps.map(([n,t,d],i)=>(
              <li key={n} className="lp-pcard2" data-reveal style={{"--d":`${(i*.08).toFixed(2)}s`}}>
                <span className="lp-stepnum" aria-hidden="true">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <div style={{height:60}}/>
      <LpCtaBand title="מעוניינים בשיתוף פעולה?" text="צרו איתנו קשר: נפתח לכם קישור שותף, ונספר על התגמול ועל החבילות לאולמות ולמפיקים."
        primary={{href:wa,label:SUPPORT_WA?"שלחו הודעה בוואטסאפ":"שלחו מייל",external:!!SUPPORT_WA}} secondary={SUPPORT_WA?{href:`mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("שיתוף פעולה עם Sidor-IL")}`,label:"שלחו מייל"}:null}
        note={SUPPORT_PHONE?`${SUPPORT_PHONE} · א׳-ה׳ 9:00-17:00`:SUPPORT_MAIL}/>
    </PublicPage>
  );
}

// ─── HAMBURGER MENU ───────────────────────────────────────────────────────────
export function AccessibilityWidget() {
  const [open,setOpen]=useState(false);
  const [settings,setSettings]=useState(()=>{let saved={};try{saved=JSON.parse(localStorage.getItem("sidor_a11y")||"{}")||{};}catch{}return{
    fontSize:0,      // -1, 0, 1, 2
    contrast:false,  // ניגודיות גבוהה
    grayscale:false, // גווני אפור
    bigCursor:false, // סמן גדול
    stopAnim:false,  // עצור אנימציות
    dyslexia:false,  // גופן דיסלקציה
    highlight:false, // הדגש קישורים
    underline:false, // קו תחתי לקישורים
    ...saved};}); // נשמר בין כניסות, כדי שהגדרה שנבחרה לא תיעלם ברענון

  useEffect(()=>{
    const r=document.documentElement;
    // גודל טקסט
    const base=16;
    r.style.fontSize=(base+settings.fontSize*2)+"px";
    // ניגודיות — על html ולא על body: filter על body הופך אותו ל"מכיל" של position:fixed,
    // ואז כפתור הנגישות, הפאנל וכל הסרגלים הקבועים קופצים לתחתית הדף ונעלמים. על html (root) זה לא קורה
    document.body.style.filter="";
    r.style.filter=[
      settings.contrast?"contrast(150%)":"",
      settings.grayscale?"grayscale(100%)":"",
    ].filter(Boolean).join(" ")||"";
    optSet("sidor_a11y",JSON.stringify(settings));
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
      {active&&<span style={{fontSize:12,background:"rgba(255,255,255,.25)",borderRadius:4,padding:"2px 6px"}}>פעיל</span>}
    </button>
  );

  return(
    <>
      {/* כפתור צף */}
      {/* קליל: עיגול לבן קטן עם אייקון קווי (סמל הנגישות האוניברסלי), שקוף מעט עד שעוברים עליו */}
      <button onClick={()=>setOpen(o=>!o)} aria-label="תפריט נגישות" title="נגישות" className="sx-a11y-fab"
        style={{position:"fixed",bottom:20,right:20,zIndex:9999,width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,.92)",color:"#6B4FA0",border:"1.5px solid #E4DAF3",boxShadow:"0 2px 10px rgba(91,60,140,.14)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,opacity:open?1:.85,transition:"opacity .2s, transform .2s"}}>
        <style>{`.sx-a11y-fab:hover,.sx-a11y-fab:focus-visible{opacity:1!important;transform:scale(1.06)}`}</style>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="7" r="1.3" fill="currentColor" stroke="none"/>
          <path d="M7.5 9.5 12 10.5l4.5-1M12 10.5v3.5m0 0-2.5 4.5M12 14l2.5 4.5"/>
        </svg>
      </button>

      {/* פאנל */}
      {open&&(
        <div style={{position:"fixed",bottom:74,right:20,zIndex:9998,background:"#fff",borderRadius:18,boxShadow:"0 8px 40px rgba(0,0,0,.18)",width:280,direction:"rtl",overflow:"hidden",border:"2px solid #E2E8F0"}}>
          {/* כותרת */}
          <div style={{background:"#3A2464",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#fff",fontWeight:800,fontSize:15}}>♿ נגישות</div>
              <div style={{color:"rgba(255,255,255,.7)",fontSize:12,marginTop:2}}>תקן ישראלי 5568</div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>

          <div style={{padding:"14px 12px",maxHeight:420,overflowY:"auto"}}>
            {/* גודל טקסט */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#5F6B7D",fontWeight:700,marginBottom:8}}>גודל טקסט</div>
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
          <div style={{padding:"8px 12px",background:"#F7FAFC",borderTop:"1px solid #E2E8F0",fontSize:12,color:"#6E6585",textAlign:"center"}}>
            אתר זה עומד בתקן WCAG 2.1 AA
          </div>
        </div>
      )}
    </>
  );
}

// הלוגו של Sidor-IL: עיגול בגרדיאנט עם שולחן ו-6 כיסאות (id ייחודי לכל שימוש, בגלל ה-gradient)
export const SidorLogo=({size=40,id="sidorLogo"})=>(
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true" style={{flexShrink:0}}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF8A65"/><stop offset="55%" stopColor="#F0609E"/><stop offset="100%" stopColor="#9B6BFF"/></linearGradient></defs>
    <circle cx="18" cy="18" r="17" fill={`url(#${id})`}/>
    <circle cx="18" cy="18" r="7.5" fill="rgba(255,255,255,.3)" stroke="#fff" strokeWidth="1.5"/>
    {[0,60,120,180,240,300].map((deg,i)=>{const rad=deg*Math.PI/180;return <circle key={i} cx={18+12.5*Math.cos(rad)} cy={18+12.5*Math.sin(rad)} r="2.6" fill="#fff"/>;})}
  </svg>
);

// ─── LANDING ─────────────────────────────────────────────────────────────────
export const LP={ink:"#2B1D3F",muted:"#564C6C",rose:"#F0609E",coral:"#FF8A65",violet:"#9B6BFF",gold:"#E8B04A",mint:"#3CC8A0",sky:"#5AA9FF",cream:"#FFFBF7",lav:"#F4EEFF"};
// תמונות המסכים בדף הבית בכמה גדלים: הדפדפן מוריד רק את מה שמתאים למסך (במקום 2880px לתמונה שמוצגת ב-400px).
// חשוב: ב-<img> התכונה sizes לפני srcSet — React מציב תכונות לפי הסדר, ובלי sizes הדפדפן מתחיל להוריד את הגדולה
const LP_SRCSET={
  "/landing/seating-v2.jpg":"/landing/seating-v2-800.jpg 800w, /landing/seating-v2-1440.jpg 1440w, /landing/seating-v2.jpg 2880w",
  "/landing/rsvp-v2.jpg":"/landing/rsvp-v2-480.jpg 480w, /landing/rsvp-v2-780.jpg 780w, /landing/rsvp-v2.jpg 1170w",
};
// צילומי המסך בסיור (מוצגים ברוחב ~300-400px): 800 / 1440 / המקור 2880
const tourSrcSet=id=>`/landing/tour/${id}-800.jpg 800w, /landing/tour/${id}-1440.jpg 1440w, /landing/tour/${id}.jpg 2880w`;
const LANDING_CSS=`
  
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
  .lp-primary{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF 100%);background-size:200% 100%;background-position:0% 50%;color:#fff;box-shadow:0 12px 30px -8px rgba(240,96,158,.6),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .2s,box-shadow .25s,background-position .6s ease}
  .lp-primary:hover{background-position:100% 50%}
  .lp-primary:hover{box-shadow:0 20px 44px -10px rgba(240,96,158,.75),0 0 0 5px rgba(240,96,158,.14)}
  .lp-ghost{background:#fff;color:#2B1D3F;border:1.5px solid #E6DDF5;box-shadow:0 4px 14px rgba(43,29,63,.06)}
  .lp-ghost:hover{border-color:#F0609E;color:#C2397A;box-shadow:0 10px 26px rgba(240,96,158,.18)}
  .lp-nav-link{color:#5A5070;text-decoration:none;font-size:14px;font-weight:700;padding:8px 14px;border-radius:10px;transition:all .2s;white-space:nowrap}
  @media(max-width:1240px){.lp-hide-md{display:none!important}.lp-nav-link{padding:8px 10px}}
  .lp-nav-link:hover{color:#C2397A;background:#FFEFF5}
  .lp-card{position:relative;background:#fff;border:1px solid #EFE8F7;border-radius:24px;box-shadow:0 6px 24px -10px rgba(91,60,140,.15);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .3s;overflow:hidden}

  .lp-ev{transition:transform .35s,box-shadow .35s}
  .lp-ev:hover img{transform:scale(1.08)}
  .lp-grad{background:linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF,#F0609E,#FF8A65);background-size:300% 100%;background-position:30% 50%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .lp-underline{position:relative;display:inline-block}
  .lp-underline svg{position:absolute;right:0;left:0;bottom:-10px;width:100%;height:16px}
  @media(max-width:960px){.lp-hero{flex-direction:column!important;text-align:center}.lp-hero p{margin-inline:auto}.lp-hero-cta{justify-content:center}.lp-hide-sm{display:none!important}.lp-steps{grid-template-columns:1fr!important}.lp-feat{grid-template-columns:1fr 1fr!important}}
  @media(max-width:600px){.lp-feat{grid-template-columns:1fr!important}}
  /* נגישות ונייד (בדיקת UI/UX): דילוג לתוכן, אזורי לחיצה של 44px, תוויות קצרות בנייד, שאלות נפוצות */
  .lp-skip{position:absolute;right:12px;top:-70px;z-index:300;background:#2B1D3F;color:#fff!important;padding:12px 18px;border-radius:14px;font-weight:800;text-decoration:none;transition:top .2s}
  .lp-skip:focus{top:12px}
  .lp-sm{display:none}
  .lp-faq{border-bottom:1px solid #E6DDF0}
  .lp-faq summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:14px;padding:20px 2px;min-height:44px;font-size:18px;font-weight:800;color:#2B1D3F}
  .lp-faq summary::-webkit-details-marker{display:none}
  .lp-faq summary:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px;border-radius:20px}
  .lp-faq-ic{margin-right:auto;width:30px;height:30px;border-radius:50%;background:#FFEFF5;color:#C2397A;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;flex-shrink:0;transition:transform .25s,background .25s}
  .lp-faq[open] .lp-faq-ic{transform:rotate(45deg);background:linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF);color:#fff}
  .lp-faq p{padding:0 2px 22px;color:#3E3555;font-size:16px;line-height:1.75;max-width:62ch}
  .lp-foot a,.lp-foot button{display:inline-flex;align-items:center;gap:8px;min-height:32px}
  @media(max-width:600px){.lp-wa-fab{padding:13px!important;left:14px!important;bottom:14px!important}.lp-lg{display:none}.lp-sm{display:inline}.lp-navbtn{padding:9px 14px!important;white-space:nowrap}.lp-foot a,.lp-foot button{min-height:44px}}
  /* ─── שדרוג עיצוב (ui-ux-pro-max): Hero, בנטו וליטוש ─── */
  .lp h1,.lp h2{text-wrap:balance}
  .lp-num{font-variant-numeric:tabular-nums}
  /* בלי backdrop-filter: טשטוש מעל רקע שזז מחושב מחדש בכל פריים, וזה מה שהאט מסכים גדולים */
  .lp-glass{background:rgba(255,255,255,.86);border:1px solid rgba(255,255,255,.95);box-shadow:0 18px 40px -22px rgba(91,60,140,.35),inset 0 1px 0 #fff}
  .lp-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(220px,auto);gap:18px}
  .lp-b-a{grid-column:span 2;grid-row:span 2}
  .lp-b-w{grid-column:span 2}
  .lp-bento .lp-card{padding:26px;display:flex;flex-direction:column;border-radius:28px;border:none;box-shadow:none}
  .lp-bart{flex:1;min-height:130px;display:flex;align-items:center;justify-content:center;margin:-26px -26px 20px;position:relative;overflow:hidden}
  @media(max-width:960px){.lp-bento{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:600px){.lp-bento{grid-template-columns:1fr;grid-auto-rows:auto}.lp-b-a,.lp-b-w{grid-column:auto;grid-row:auto}}
  .lp-sticky{display:none}
  @media(max-width:768px){
    .lp-ba{grid-template-columns:1fr!important}
    .lp-sticky{display:flex;position:fixed;right:72px;left:72px;bottom:12px;z-index:98;align-items:center;gap:10px;background:rgba(255,255,255,.97);border:1px solid #EFE8F7;border-radius:20px;padding:8px 8px 8px 14px;box-shadow:0 18px 40px -14px rgba(91,60,140,.45);transform:translateY(160%);transition:transform .32s cubic-bezier(.2,.8,.2,1)}
    .lp-sticky.on{transform:none}
    .lp{padding-bottom:84px}
  }
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.fu{opacity:1!important;transform:none!important}}
  /* ביצועים: האנימציות של הפתיחה עוצרות כשגוללים ממנה, ומקטעים שמחוץ למסך לא מצוירים בכלל עד שמגיעים אליהם */
  .lp-hero-off #top *{animation-play-state:paused!important}
  .lp>section:not(#top),.lp>footer{content-visibility:auto;contain-intrinsic-size:auto 900px}
  .lp-hero-link{background:none;border:none;padding:12px 2px;color:#3E3555;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1.5px;transition:color .15s}
  .lp-hero-link:hover,.lp-hero-link:focus-visible{color:#C2397A}
  .lp-sec-sub{font-size:18px;color:#3E3555;max-width:60ch;margin:0;line-height:1.7}
  @media(max-width:640px){.lp-sec-sub{font-size:16px}}
  /* ההדגמה החיה בפתיחה: הגולש מושיב אורחים בעצמו */
  .lp-demo{flex:0 0 min(540px,100%);width:100%;max-width:540px}
  @media(max-width:960px){.lp-demo{flex:none}}
  .lp-seat{background:#fff;border-radius:28px;padding:18px;box-shadow:0 30px 70px -36px rgba(91,60,140,.45);text-align:right}
  .lp-floor{position:relative;width:100%;aspect-ratio:1/.82;border-radius:18px;background:radial-gradient(#E9E1F5 1px,transparent 1px) 0 0/16px 16px,#FDFBFF}
  .lp-tb{position:absolute;width:24%;aspect-ratio:1;transform:translate(-50%,-50%);background:none;border:none;padding:0;cursor:pointer;border-radius:50%;font-family:inherit}
  .lp-tb svg{display:block;width:100%;height:100%}
  .lp-tb-c{transition:fill .15s}
  .lp-tb:focus-visible,.lp-guest:focus-visible,.lp-seat-act:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}
  @media(hover:hover){.lp-tb:hover .lp-tb-c{fill:#FFEFF5}.lp-guest:hover{border-color:#F0609E}.lp-seat-act:hover{color:#C2397A}}
  .lp-guest{display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:7px 14px;border-radius:100px;border:1.5px solid #E6DDF5;background:#fff;color:#2B1D3F;font-family:inherit;font-size:14px;font-weight:800;cursor:grab;transition:background .15s,color .15s,border-color .15s}
  .lp-guest[aria-pressed="true"]{background:#2B1D3F;border-color:#2B1D3F;color:#fff}
  .lp-guest small{font-size:12px;font-weight:600;opacity:.85}
  .lp-seat-act{background:none;border:none;padding:10px 2px;min-height:44px;font-family:inherit;font-size:14px;font-weight:800;color:#3E3555;cursor:pointer;text-decoration:underline;text-underline-offset:4px}
  .lp-seat-act:disabled{opacity:.6;cursor:default}
  /* איך זה עובד: מסלול של 3 תחנות */
  .lp-steps{position:relative}
  .lp-steps::before{content:"";position:absolute;top:22px;right:22px;left:calc((100% - 56px)/3 - 22px);border-top:2px dashed #D9CCEB}
  .lp-step-n{position:relative;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;color:#2B1D3F;margin-bottom:18px}
  @media(max-width:960px){.lp-steps::before{display:none}}
  .lp-price{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
  .lp-faq-wrap{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px;align-items:start}
  @media(max-width:860px){.lp-price,.lp-faq-wrap{grid-template-columns:1fr}.lp-faq-wrap{gap:20px}}
  .lp-ev-card{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:400px;border-radius:24px;overflow:hidden;border:none;cursor:pointer;background:#2B1D3F;text-align:right;font-family:inherit;color:#fff;padding:0}
  .lp-ev-card:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
  .lp-ev-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
  @media(hover:hover){.lp-ev-card:hover img{transform:scale(1.05)}}
  .lp-ev-card::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(43,29,63,.94) 0%,rgba(43,29,63,.7) 42%,rgba(43,29,63,0) 72%)}
  @media(max-width:600px){.lp-ev-card{min-height:300px}}
  /* שפת העיצוב: כפתורי גלולה, תמונת אווירה, אזורים מעוגלים וכרטיסים רכים */
  .lp-btn{border-radius:999px}
  .lp-primary{box-shadow:0 14px 30px -12px rgba(240,96,158,.65)}
  .lp-primary:hover{box-shadow:0 18px 36px -12px rgba(240,96,158,.75)}
  .lp-ghost{border:1.5px solid #DCCFF0;box-shadow:none}
  .lp-white{background:#fff;color:#2B1D3F;box-shadow:0 14px 30px -12px rgba(30,16,60,.5)}
  .lp-white:hover{box-shadow:0 18px 36px -12px rgba(30,16,60,.6)}
  .lp-glass-btn{background:rgba(255,255,255,.16);color:#fff;border:1.5px solid rgba(255,255,255,.55)}
  .lp-glass-btn:hover{background:rgba(255,255,255,.26)}
  .lp-go{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:rgba(43,29,63,.09);flex-shrink:0;transition:transform .2s}
  .lp-primary .lp-go{background:rgba(255,255,255,.28)}
  .lp-btn:hover .lp-go{transform:translateX(-3px)}
  .lp-grad-light{background:linear-gradient(110deg,#FFE0B0,#FFB8D6 55%,#D9C8FF);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .lp-nav{transition:top .3s,right .3s,left .3s,background .3s,box-shadow .3s,border-radius .3s}
  .lp-nav-top .lp-nav-link{color:#fff}
  .lp-nav-top .lp-nav-link:hover{color:#fff;background:rgba(255,255,255,.18)}
  #top .lp-hero-link{color:#fff}
  #top .lp-hero-link:hover,#top .lp-hero-link:focus-visible{color:#FFE0B0}
  .lp-seat{border-radius:32px;box-shadow:0 34px 80px -30px rgba(20,8,50,.7)}
  .lp-card{border:none;border-radius:32px;box-shadow:0 18px 44px -28px rgba(91,60,140,.4)}
  .lp-bento .lp-card{border-radius:36px;box-shadow:0 18px 44px -28px rgba(91,60,140,.4)}
  .lp-circ{width:44px;height:44px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
  .lp-steps::before{display:none}
  .lp-step{background:#fff;border-radius:36px;padding:16px 16px 28px;box-shadow:0 18px 44px -28px rgba(91,60,140,.4)}
  .lp-faq{background:#fff;border:none;border-radius:24px;padding:0 20px;margin-bottom:10px;box-shadow:0 14px 34px -28px rgba(91,60,140,.45)}
  .lp-inside{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:5vw;align-items:center}
  .lp-devices{position:relative;aspect-ratio:1/.76}
  .lp-devices img{display:block;width:100%;height:auto}
  .lp-laptop{position:absolute;top:0;right:0;width:90%;border:9px solid #1C1430;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 30px 60px -24px rgba(15,5,40,.7)}
  .lp-phone{position:absolute;bottom:0;width:25%;border:6px solid #1C1430;border-radius:30px;overflow:hidden;background:#fff;box-shadow:0 26px 50px -18px rgba(15,5,40,.75)}
  .lp-phone img{aspect-ratio:390/760;object-fit:cover;object-position:top}
  .lp-ev-card{border-radius:32px}
  .lp-ev-chip{position:absolute;left:16px;bottom:16px;z-index:1;width:42px;height:42px;border-radius:50%;background:#fff;color:#6A3FCF;display:flex;align-items:center;justify-content:center;transition:transform .2s}
  @media(hover:hover){.lp-ev-card:hover .lp-ev-chip{transform:translateX(-4px)}}
  .lp-sticky{border-radius:100px;padding:6px;border:none}
  @media(max-width:860px){.lp-inside{grid-template-columns:1fr;gap:36px}.lp-phone{width:30%}}
  /* ─── v3: שפת תנועה אחידה (עקומות ומשכים לפי הסקיל animate) ─── */
  :root{--ease-out:cubic-bezier(0.23,1,0.32,1);--ease-in-out:cubic-bezier(0.77,0,0.175,1);--ease-drawer:cubic-bezier(0.32,0.72,0,1)}
  .lp{interpolate-size:allow-keywords}
  @supports (overflow-x:clip){.lp{overflow-x:clip!important}}
  .lp-wrap{max-width:1120px;margin:0 auto}
  .lp-sec{padding:110px 6vw;position:relative}
  .lp-sheet{margin:0 2vw;border-radius:56px;padding:110px 6vw;position:relative}
  @media(max-width:700px){.lp-sec,.lp-sheet{padding:76px 5vw}.lp-sheet{margin:0 8px;border-radius:36px}}
  .lp-h2{font-size:clamp(34px,4.8vw,64px);font-weight:900;line-height:1.08;letter-spacing:-.03em;margin-bottom:16px;color:#2B1D3F}
  .lp-h2:only-child{margin-bottom:0}
  /* כפתורים: לחיצה מורגשת, ריחוף רק עם עכבר */
  .lp-btn{transition:transform 160ms var(--ease-out),box-shadow 250ms var(--ease-out),background-color 200ms ease,border-color 200ms ease,color 200ms ease}
  .lp-primary{transition:transform 160ms var(--ease-out),box-shadow 250ms var(--ease-out),background-position 600ms ease}
  .lp-btn:hover{transform:none}
  .lp-btn:hover .lp-go{transform:none}
  .lp-go{transition:transform 200ms var(--ease-out)}
  @media(hover:hover) and (pointer:fine){.lp-btn:hover{transform:translateY(-2px)}.lp-btn:hover .lp-go{transform:translateX(-3px)}}
  .lp-btn:active{transform:scale(.97)}
  .lp-nav-link{transition:color 200ms ease,background-color 200ms ease}
  .lp-nav-link.on{background:#F1EAFF;color:#4A2C8F}
  .lp-nav-top .lp-nav-link.on{background:rgba(255,255,255,.2);color:#fff}
  .lp-faq-ic{transition:transform 200ms var(--ease-out)}
  .lp-sticky{transition:transform 300ms var(--ease-out)}
  /* הופעה בגלילה: פעם אחת, עם השהיה קטנה בין אחים (--d) */
  .lp-motion [data-reveal]{opacity:0;transform:translateY(32px);transition:opacity 900ms var(--ease-out) var(--d,0s),transform 1000ms var(--ease-out) var(--d,0s),translate 250ms var(--ease-out),box-shadow 250ms var(--ease-out)}
  .lp-motion [data-reveal="scale"]{transform:translateY(24px) scale(.96)}
  .lp-motion [data-reveal].in{opacity:1;transform:none}
  @media print{.lp-motion [data-reveal]{opacity:1!important;transform:none!important}}
  .lp-lift{transition:translate 250ms var(--ease-out),box-shadow 250ms var(--ease-out)}
  @media(hover:hover) and (pointer:fine){.lp-lift:hover{translate:0 -6px;box-shadow:0 30px 60px -30px rgba(91,60,140,.5)}}
  /* תפריט עליון: תמיד באותו מקום ובאותו גודל — רק הרקע והצל מתחלפים בגלילה */
  .lp-nav{transition:background-color 300ms var(--ease-out),box-shadow 300ms var(--ease-out)}
  .lp-motion .lp-nav{animation:lpNavIn 700ms var(--ease-out) both}
  @keyframes lpNavIn{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}
  .lp-burger{display:none;width:44px;height:44px;border-radius:50%;border:none;background:#F1EAFF;color:#2B1D3F;cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:5px;flex-shrink:0}
  .lp-nav-top .lp-burger{background:rgba(255,255,255,.18);color:#fff}
  .lp-burger span{display:block;width:18px;height:2px;border-radius:2px;background:currentColor}
  .lp-burger:focus-visible,.lp-menu-x:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}
  @media(max-width:960px){.lp-burger{display:inline-flex}}
  @media(max-width:600px){.lp-hide-xs{display:none!important}}
  .lp-menu{position:fixed;inset:0;z-index:160;background:rgba(20,10,40,.55);opacity:0;visibility:hidden;transition:opacity 300ms var(--ease-out),visibility 0s linear 300ms}
  .lp-menu.open{opacity:1;visibility:visible;transition:opacity 300ms var(--ease-out),visibility 0s}
  .lp-menu-sheet{position:absolute;top:0;right:0;left:0;max-height:100%;overflow:auto;background:#FFFBF7;border-radius:0 0 32px 32px;padding:12px 6vw 26px;transform:translateY(-100%);transition:transform 450ms var(--ease-drawer);box-shadow:0 30px 60px -30px rgba(20,10,40,.6)}
  .lp-menu.open .lp-menu-sheet{transform:none}
  .lp-menu-head{display:flex;align-items:center;justify-content:space-between;height:58px;margin-bottom:6px}
  .lp-menu-x{width:44px;height:44px;border-radius:50%;border:none;background:#F1EAFF;color:#2B1D3F;font-size:18px;font-weight:900;cursor:pointer}
  .lp-menu ul{list-style:none;margin:0 0 20px;padding:0}
  .lp-menu li{opacity:0;transform:translateY(-8px);transition:opacity 300ms var(--ease-out),transform 300ms var(--ease-out)}
  .lp-menu.open li{opacity:1;transform:none;transition-delay:var(--d,0s)}
  .lp-menu li a{display:flex;align-items:center;min-height:56px;font-size:24px;font-weight:900;color:#2B1D3F;text-decoration:none;border-bottom:1px solid #EFE6F5}
  .lp-menu-cta{display:grid;gap:10px;margin-bottom:8px}
  .lp-menu-cta .lp-btn{min-height:52px;font-size:16px;padding:12px 20px}
  .lp-menu-more{display:flex;gap:4px 20px;flex-wrap:wrap}
  /* פתיחה: תמונה שזזה לאט, אורות רכים, וכותרת שעולה שורה אחרי שורה */
  .lp-hero-sec{min-height:100vh;min-height:100svh;display:flex;align-items:center;position:relative;z-index:1;overflow:hidden;isolation:isolate;padding:128px 6vw 110px;border-radius:0 0 56px 56px;background:#2A1650;color:#fff}
  .lp-hero-bg{position:absolute;inset:0;z-index:-1;overflow:hidden}
  .lp-hero-bg img,.lp-cta3>img,.lp-cta3>picture>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:60% 40%}
  .lp-hero-tint{position:absolute;inset:0;background:linear-gradient(200deg,rgba(38,20,74,.84) 0%,rgba(70,38,122,.72) 55%,rgba(150,50,120,.62) 100%)}
  .lp-motion .lp-kb{animation:lpKB 26s var(--ease-in-out) infinite alternate;will-change:transform}
  @keyframes lpKB{from{transform:scale(1.14) translate3d(1.2%,0,0)}to{transform:scale(1.03) translate3d(-1.2%,-1%,0)}}
  .lp-bokeh{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  .lp-bokeh i{position:absolute;border-radius:50%;background:radial-gradient(circle,var(--c) 0%,rgba(255,255,255,0) 68%);opacity:calc(var(--o) * .6)}
  .lp-motion .lp-bokeh i{opacity:0;animation:lpBokeh var(--t) linear var(--dl) infinite;will-change:transform,opacity}
  @keyframes lpBokeh{0%{opacity:0;transform:translate3d(0,40px,0) scale(.85)}30%{opacity:var(--o)}70%{opacity:calc(var(--o) * .7)}100%{opacity:0;transform:translate3d(var(--dx),-110px,0) scale(1.1)}}
  .lp-h1{font-size:clamp(48px,7vw,104px);font-weight:900;line-height:1.02;letter-spacing:-.035em;margin-bottom:28px;color:#fff}
  .lp-line{display:block;overflow:hidden;padding:0 .05em .16em;margin-bottom:-.16em}
  .lp-line>span{display:inline-block}
  .lp-motion .lp-line>span{animation:lpLine 1100ms var(--ease-out) var(--d,0s) both}
  @keyframes lpLine{from{transform:translateY(112%)}to{transform:none}}
  .lp-motion .lp-rise{animation:lpRise 900ms var(--ease-out) var(--d,0s) both}
  @keyframes lpRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
  .lp-motion .lp-rise-side{animation:lpRiseSide 1100ms var(--ease-out) var(--d,0s) both}
  @keyframes lpRiseSide{from{opacity:0;transform:translateY(46px) scale(.97)}to{opacity:1;transform:none}}
  /* סרט סוגי האירועים: נע לאט, רק כשהוא על המסך, ונעצר בריחוף */
  .lp-ribbon{position:relative;z-index:3;height:78px;margin:-34px -5vw 0;display:flex;align-items:center;overflow:hidden;transform:rotate(-2deg);background:linear-gradient(90deg,#FF8A65,#F0609E 45%,#9B6BFF);box-shadow:0 22px 44px -22px rgba(120,40,110,.6)}
  .lp-ribbon-track{display:flex;flex-shrink:0;width:max-content}
  .lp-ribbon span{display:inline-flex;align-items:center;gap:26px;padding-inline:13px;font-size:clamp(24px,3.2vw,42px);font-weight:900;color:#fff;white-space:nowrap;letter-spacing:-.01em}
  .lp-ribbon span.o{color:transparent;-webkit-text-stroke:1.5px #fff}
  .lp-ribbon b{font-size:.55em;color:#FFE0B0;-webkit-text-stroke:0}
  .lp-motion .lp-ribbon-track{animation:lpMarq 44s linear infinite;animation-play-state:paused}
  .lp-motion .lp-ribbon.run .lp-ribbon-track{animation-play-state:running}
  @media(hover:hover) and (pointer:fine){.lp-motion .lp-ribbon.run:hover .lp-ribbon-track{animation-play-state:paused}}
  @keyframes lpMarq{from{transform:translateX(0)}to{transform:translateX(25%)}}
  @media(max-width:600px){.lp-ribbon{height:60px;margin-top:-26px}}
  /* לפני / אחרי */
  .lp-before{position:relative;padding:220px 6vw 100px;margin-top:-100px;background:#F6F3FF}
  @media(max-width:600px){.lp-before{margin-top:-82px;padding:150px 5vw 70px}}
  .lp-cmp{position:relative;aspect-ratio:2/1;border-radius:32px;overflow:hidden;background:#fff;box-shadow:0 44px 90px -46px rgba(60,35,110,.6);touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:ew-resize}
  @media(max-width:700px){.lp-cmp{aspect-ratio:4/5;border-radius:26px}}
  .lp-cmp-after,.lp-cmp-before{position:absolute;inset:0}
  .lp-cmp-after img{display:block;width:100%;height:100%;object-fit:cover;object-position:0 0;-webkit-user-drag:none}
  @media(max-width:700px){.lp-cmp-after img{object-position:36% 50%}}
  .lp-cmp-before{clip-path:inset(0 0 0 50%)}
  .lp-cmp-tag{position:absolute;top:16px;z-index:2;background:rgba(43,29,63,.88);color:#fff;font-size:14px;font-weight:800;padding:8px 16px;border-radius:999px;pointer-events:none}
  .lp-cmp-tag.before{right:16px}
  .lp-cmp-tag.after{left:16px}
  .lp-cmp-bar{position:absolute;top:0;bottom:0;left:0;width:0;z-index:4}
  .lp-cmp-bar::before{content:"";position:absolute;top:0;bottom:0;left:-1.5px;width:3px;background:#fff;box-shadow:0 0 0 1px rgba(43,29,63,.1),0 0 26px rgba(155,107,255,.7)}
  .lp-cmp-knob{position:absolute;top:50%;left:-28px;margin-top:-28px;width:56px;height:56px;border-radius:50%;background:#fff;color:#5B3FD0;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px -10px rgba(43,29,63,.55);cursor:grab;transition:scale 160ms var(--ease-out)}
  .lp-cmp:active .lp-cmp-knob{scale:.94;cursor:grabbing}
  .lp-cmp-knob:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
  .lp-cmp-cap{font-size:14px;color:#5F5675;margin-top:14px;text-align:left}
  .lp-xls{position:absolute;inset:0;display:flex;flex-direction:column;background:#fff;color:#1F2328}
  .lp-xls-bar{display:flex;align-items:center;gap:10px;flex-shrink:0;height:40px;padding:0 14px;background:#1E6E43;color:#fff;font-size:13px;font-weight:600}
  .lp-xls-bar b{width:22px;height:22px;border-radius:5px;background:#fff;color:#1E6E43;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:900}
  .lp-xls-tools{flex-shrink:0;height:30px;display:flex;align-items:center;gap:8px;padding:0 14px;background:#F3F3F3;border-bottom:1px solid #DADADA}
  .lp-xls-tools i{width:44px;height:10px;border-radius:3px;background:#DEDEDE}
  .lp-xls table{flex:1;width:100%;border-collapse:collapse;table-layout:fixed;font-size:13.5px}
  .lp-xls th,.lp-xls td{border:1px solid #E3E3E3;padding:0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right}
  .lp-xls th{height:24px;background:#F3F3F3;color:#5F5F5F;font-weight:600;font-size:12px;text-align:center}
  .lp-xls .n{width:38px;background:#F3F3F3;color:#5F5F5F;text-align:center;font-size:12px}
  .lp-xls tr.h td{font-weight:700;background:#E8F1EC}
  .lp-xls tr.x td:not(.n){text-decoration:line-through;color:#666666}
  .lp-xls tr.y td:not(.n){background:#FFF59D}
  .lp-xls td.r{color:#C62828;font-weight:800}
  .lp-note{position:absolute;z-index:1;width:178px;padding:12px 14px;background:#FFF1A6;color:#4A3B00;font-size:15px;font-weight:600;line-height:1.35;box-shadow:0 12px 24px -10px rgba(0,0,0,.35)}
  .lp-note.pink{background:#FFD6E7;color:#5A1036}
  @media(max-width:700px){.lp-xls .ph{display:none}.lp-xls table{font-size:12px}.lp-xls th,.lp-xls td{padding:0 6px}.lp-note{width:140px;font-size:13px;padding:9px 11px}}
  /* איך זה עובד: גוללים בטקסט, והמסך שלצידו מתחלף */
  .lp-how3{margin:0 2vw;border-radius:56px;padding:110px 6vw 90px;color:#fff;background:radial-gradient(900px 520px at 88% 0%,rgba(155,107,255,.38),transparent 62%),radial-gradient(760px 520px at 0% 100%,rgba(240,96,158,.24),transparent 62%),#1E1233}
  @media(max-width:700px){.lp-how3{margin:0 8px;border-radius:36px;padding:76px 5vw 40px}}
  .lp-story{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:5vw;align-items:start}
  .lp-story-col{position:relative}
  .lp-story-rail,.lp-story-fill{position:absolute;top:32vh;bottom:32vh;right:21px;width:2px;border-radius:2px}
  .lp-story-rail{background:rgba(255,255,255,.16)}
  .lp-story-fill{background:linear-gradient(#FF8A65,#F0609E,#9B6BFF);transform-origin:top;transition:transform 700ms var(--ease-out)}
  .lp-story-steps{list-style:none;margin:0;padding:0}
  .lp-story-step{position:relative;min-height:64vh;display:flex;flex-direction:column;justify-content:center;padding-right:70px;opacity:.55;transition:opacity 400ms var(--ease-out)}
  .lp-story-step.on{opacity:1}
  .lp-story-n{position:absolute;right:0;top:50%;margin-top:-22px;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;background:#1E1233;border:2px solid rgba(255,255,255,.35);color:#fff;transition:background-color 300ms ease,border-color 300ms ease,color 300ms ease}
  .lp-story-step.on .lp-story-n{background:var(--c);border-color:var(--c);color:#2B1D3F}
  .lp-story-step h3{font-size:clamp(26px,2.7vw,38px);font-weight:900;line-height:1.15;margin-bottom:12px;color:#fff}
  .lp-story-step p{font-size:18px;line-height:1.7;color:#E6DEF2;max-width:40ch}
  .lp-story-sm{display:none}
  .lp-story-stage{position:sticky;top:calc(50vh - 270px);height:540px}
  .lp-screen{position:absolute;inset:0;margin:0;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(26px) scale(.96);transition:opacity 600ms var(--ease-out),transform 700ms var(--ease-out)}
  .lp-screen.on{opacity:1;transform:none}
  .lp-frame{border:9px solid #0E0820;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 44px 90px -36px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.08)}
  .lp-frame img{display:block;width:100%;height:auto}
  .lp-screen.laptop .lp-frame{width:100%}
  .lp-screen.phone .lp-frame{width:258px;border-width:8px;border-radius:40px}
  .lp-screen.phone .lp-frame img,.lp-story-sm.phone img{aspect-ratio:390/760;object-fit:cover;object-position:top}
  .lp-screen-chip{position:absolute;bottom:56px;right:4%;background:#fff;color:#2B1D3F;font-size:15px;font-weight:800;padding:12px 16px;border-radius:16px;border-right:4px solid var(--c);box-shadow:0 18px 40px -14px rgba(0,0,0,.6);opacity:0;transform:translateY(12px);transition:opacity 400ms var(--ease-out),transform 500ms var(--ease-out)}
  .lp-screen.on .lp-screen-chip{opacity:1;transform:none;transition-delay:250ms}
  @media(max-width:960px){
    .lp-story{grid-template-columns:1fr}
    .lp-story-stage,.lp-story-rail,.lp-story-fill{display:none}
    .lp-story-step{min-height:0;opacity:1;padding:0 62px 44px 0}
    .lp-story-n{top:2px;margin-top:0}
    .lp-story-sm{display:block;margin:22px 0 0}
    .lp-story-sm.phone .lp-frame{width:min(240px,70%);margin:0 auto;border-width:7px;border-radius:34px}
  }
  /* יכולות: האיור בכל כרטיס מדגים את היכולת כשהכרטיס נכנס */
  .lp-ch{transform-box:fill-box;transform-origin:center}
  .lp-motion .lp-bento .in .lp-ch.f{animation:lpChair 450ms var(--ease-out) var(--d,0s) both}
  @keyframes lpChair{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
  .lp-motion .lp-bento .in .lp-bub1{animation:lpRise 500ms var(--ease-out) .25s both}
  .lp-slot{display:grid}
  .lp-slot>*{grid-area:1/1;justify-self:end;align-self:center}
  .lp-typing{display:inline-flex;align-items:center;gap:4px;background:#fff;border:1px solid #E6DAFF;border-radius:16px 16px 4px 16px;padding:12px 14px;opacity:0}
  .lp-typing i{width:6px;height:6px;border-radius:50%;background:#9B6BFF}
  .lp-motion .lp-bento .in .lp-typing{animation:lpTyping 950ms ease .8s both}
  @keyframes lpTyping{0%{opacity:0;transform:translateY(6px)}20%,75%{opacity:1;transform:none}100%{opacity:0;transform:none}}
  .lp-motion .lp-bento .in .lp-typing i{animation:lpDot 480ms ease-in-out .8s 2}
  .lp-motion .lp-bento .in .lp-typing i:nth-child(2){animation-delay:.9s}
  .lp-motion .lp-bento .in .lp-typing i:nth-child(3){animation-delay:1s}
  @keyframes lpDot{50%{transform:translateY(-4px)}}
  .lp-motion .lp-bento .in .lp-bub2{animation:lpPop 500ms var(--ease-out) 1.7s both}
  @keyframes lpPop{from{opacity:0;transform:translateY(8px) scale(.95)}to{opacity:1;transform:none}}
  .lp-motion .lp-bento .in .lp-chip{animation:lpPop 450ms var(--ease-out) var(--d,0s) both}
  .lp-motion .lp-bento .in .lp-ring{animation:lpRing 1200ms var(--ease-out) .3s both}
  @keyframes lpRing{from{stroke-dashoffset:163}}
  .lp-wa{transform-origin:bottom right}
  .lp-motion .lp-bento .in .lp-wa{animation:lpPop 600ms var(--ease-out) .35s both}
  .lp-motion .lp-bento .in .lp-scard{animation:lpDeal 700ms var(--ease-out) var(--d,0s) both}
  @keyframes lpDeal{from{opacity:0;transform:translateY(36px)}to{opacity:1;transform:none}}
  /* סוגי אירועים: בנייד — קרוסלה שגוללים באצבע */
  .lp-ev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
  @media(max-width:700px){.lp-ev-grid{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:80%;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -5vw;padding:4px 5vw 12px;scrollbar-width:none}.lp-ev-grid::-webkit-scrollbar{display:none}.lp-ev-grid>*{scroll-snap-align:center}}
  /* מחירים: מסגרת זוהרת שמסתובבת לאט סביב החבילה המומלצת */
  .lp-pwrap{display:flex;border-radius:28px}
  .lp-pcard{flex:1;border-radius:26px;padding:32px 30px;display:flex;flex-direction:column}
  .lp-glow{position:relative;padding:2px;overflow:hidden;isolation:isolate;box-shadow:0 30px 70px -34px rgba(240,96,158,.7)}
  .lp-glow::before{content:"";position:absolute;inset:-50%;z-index:-1;background:conic-gradient(from 0deg,#FF8A65,#F0609E,#9B6BFF,#5AA9FF,#3CC8A0,#FF8A65)}
  .lp-motion .lp-glow::before{animation:lpSpin 8s linear infinite}
  @keyframes lpSpin{to{transform:rotate(360deg)}}
  /* שאלות נפוצות: נפתחות בהחלקה (בדפדפנים שתומכים) */
  .lp-faq::details-content{block-size:0;overflow:clip;transition:block-size 200ms var(--ease-out),content-visibility 200ms allow-discrete}
  .lp-faq[open]::details-content{block-size:auto}
  .lp-faq p{transition:opacity 200ms var(--ease-out)}
  .lp-faq:not([open]) p{opacity:0}
  /* הסוף */
  .lp-cta3{margin:0 2vw 60px;padding:110px 5vw;position:relative;overflow:hidden;isolation:isolate;border-radius:56px;background:#4A2C8F;color:#fff}
  .lp-cta3>img,.lp-cta3>picture>img{z-index:-2}
  .lp-cta-tint{position:absolute;inset:0;z-index:-1;background:linear-gradient(120deg,rgba(150,40,110,.86),rgba(74,44,143,.86))}
  .lp-cta3 .lp-bokeh{z-index:-1}
  @media(max-width:700px){.lp-cta3{margin:0 8px 40px;border-radius:36px;padding:76px 6vw}}
  .lp-foot-top{position:relative;isolation:isolate}
  /* מפת האתר ליד הלוגו (ולא נדחקת לשורה מתחת): לוגו + 5 עמודות */
  @media(min-width:1001px){.lp-foot-top{display:grid!important;grid-template-columns:minmax(230px,280px) 1fr;align-items:start;gap:48px!important}
    .lp-foot-top > nav.lp-foot{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:24px 28px!important}}
  @media(min-width:601px) and (max-width:1000px){.lp-foot-top > nav.lp-foot{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px 28px!important;width:100%}}
  @media(max-width:600px){.lp-foot-top > nav.lp-foot{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 18px!important;width:100%}}
  .lp-foot-top > *:not(.lp-foot-mark){position:relative;z-index:1}
  .lp-foot-mark{position:absolute;z-index:0;left:50%;top:50%;translate:-50% -50%;direction:ltr;white-space:nowrap;pointer-events:none;user-select:none;font-family:'Fredoka','Heebo',sans-serif;font-weight:700;font-size:clamp(90px,19vw,280px);line-height:1;letter-spacing:-.05em;background:linear-gradient(180deg,rgba(155,107,255,.16) 0%,rgba(240,96,158,.10) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  @media(max-width:700px){.lp-foot-mark{font-size:27vw}}
  .lp-wordmark{direction:ltr;text-align:center;font-weight:900;font-size:clamp(72px,17vw,250px);line-height:.8;letter-spacing:-.05em;margin:36px 0 0;background:linear-gradient(180deg,rgba(124,75,214,.34),rgba(124,75,214,0) 92%);-webkit-background-clip:text;background-clip:text;color:transparent;user-select:none;white-space:nowrap}
  /* ─── v4: דפים ציבוריים (סוגי אירועים, מדריכים, מידע משפטי, אולמות) באותה שפה של דף הבית ─── */
  .lp main section[id]{scroll-margin-top:84px}
  .lp-phero{position:relative;z-index:1;overflow:hidden;isolation:isolate;padding:150px 6vw 96px;border-radius:0 0 56px 56px;background:#1E1233;color:#fff}
  .lp-phero-tint{position:absolute;inset:0;background:radial-gradient(900px 520px at 85% 0%,rgba(155,107,255,.42),transparent 62%),radial-gradient(760px 520px at 0% 100%,rgba(240,96,158,.28),transparent 62%)}
  .lp-phero.has-img .lp-phero-tint{background:linear-gradient(200deg,rgba(38,20,74,.86) 0%,rgba(70,38,122,.76) 55%,rgba(150,50,120,.66) 100%)}
  .lp-phero-in{position:relative;z-index:2;max-width:1120px;margin:0 auto;display:flex;align-items:center;gap:5vw}
  .lp-phero-copy{flex:1;min-width:0}
  .lp-phero-h1{font-size:clamp(34px,5vw,64px);line-height:1.08;margin-bottom:18px}
  .lp-phero-lead{font-size:clamp(17px,1.5vw,20px);line-height:1.7;color:#EFE8F7;max-width:56ch;margin-bottom:28px}
  .lp-phero-aside{flex:0 0 min(500px,46%)}
  .lp-crumbs{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:14px;font-weight:700;color:#D9CFEA;margin-bottom:18px}
  .lp-crumbs a{color:#fff;text-decoration:underline;text-underline-offset:3px}
  .lp-hmeta{display:flex;gap:10px;flex-wrap:wrap}
  .lp-hmeta span{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 14px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);font-size:14px;font-weight:700}
  @media(max-width:960px){.lp-phero{padding:120px 5vw 70px;border-radius:0 0 36px 36px}.lp-phero-in{flex-direction:column;align-items:stretch}.lp-phero-aside{flex:none;width:100%;max-width:540px;margin:0 auto}}
  .lp-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}
  .lp-pcard2{background:#fff;border-radius:28px;padding:24px 24px 26px;box-shadow:0 18px 44px -28px rgba(91,60,140,.4);display:flex;flex-direction:column;gap:10px;color:#2B1D3F;text-decoration:none}
  .lp-pcard2 h3{font-size:20px;font-weight:900;line-height:1.3}
  .lp-pcard2 p{font-size:16px;line-height:1.65;color:#3E3555}
  .lp-emo{width:54px;height:54px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:25px;flex-shrink:0}
  .lp-guides{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
  .lp-guides3{grid-template-columns:repeat(3,minmax(0,1fr))}
  .lp-gcard{display:flex;flex-direction:column;gap:10px;background:#fff;border-radius:28px;padding:24px;color:#2B1D3F;text-decoration:none;box-shadow:0 18px 44px -28px rgba(91,60,140,.4)}
  .lp-gcard h2,.lp-gcard h3{font-size:19px;font-weight:900;line-height:1.35}
  .lp-gcard p{font-size:15.5px;line-height:1.65;color:#3E3555}
  .lp-gmeta{margin-top:auto;padding-top:8px;display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;color:#5F5675}
  .lp-gfeat{grid-column:span 2;background:linear-gradient(150deg,#2E1A55,#4A2C8F 55%,#8A3FA8);color:#fff}
  .lp-gfeat h2{font-size:clamp(24px,2.4vw,32px)}
  .lp-gfeat p{color:#E9E2F3;font-size:17px;max-width:46ch}
  .lp-gfeat .lp-gmeta{color:#E2DAEE}
  .lp-gfeat .lp-emo{background:rgba(255,255,255,.14)!important}
  .lp-gfeat .lp-go{background:rgba(255,255,255,.2)}
  @media(hover:hover) and (pointer:fine){.lp-gcard:hover .lp-go{transform:translateX(-3px)}}
  .lp-gcard:focus-visible,.lp-chips a:focus-visible,.lp-toc a:focus-visible,.lp-tabs a:focus-visible,.lp-crumbs a:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
  @media(max-width:1100px){.lp-guides,.lp-guides3{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:640px){.lp-guides,.lp-guides3{grid-template-columns:1fr}.lp-gfeat{grid-column:auto}}
  .lp-doc{display:grid;grid-template-columns:250px minmax(0,1fr);gap:56px;align-items:start;max-width:1120px;margin:0 auto}
  .lp-doc.one{grid-template-columns:minmax(0,1fr);max-width:860px}
  .lp-toc{position:sticky;top:100px;font-size:14px}
  .lp-toc b{display:block;font-size:14px;font-weight:900;color:#2B1D3F;margin-bottom:12px}
  .lp-toc ol{list-style:none;margin:0;padding:0;border-right:2px solid #E6DDF0}
  .lp-toc a{display:block;padding:8px 14px 8px 0;margin-right:-2px;border-right:2px solid transparent;color:#5F5675;text-decoration:none;line-height:1.45;transition:color 200ms ease,border-color 200ms ease}
  .lp-toc a.on{color:#2B1D3F;font-weight:800;border-right-color:#F0609E}
  @media(hover:hover) and (pointer:fine){.lp-toc a:hover{color:#2B1D3F}}
  .lp-prose{background:#fff;border-radius:32px;padding:44px 48px;box-shadow:0 18px 44px -28px rgba(91,60,140,.35)}
  .lp-prose section{margin-bottom:34px}
  .lp-prose section:last-of-type{margin-bottom:24px}
  .lp-prose h2{font-size:clamp(21px,2vw,26px);font-weight:900;line-height:1.3;margin-bottom:12px;color:#2B1D3F}
  .lp-prose p{font-size:17px;line-height:1.9;color:#3E3555;white-space:pre-line}
  .lp-prose p a{color:#4A2C8F;font-weight:700}
  @media(max-width:960px){.lp-doc{grid-template-columns:1fr}.lp-toc{display:none}.lp-prose{padding:28px 22px;border-radius:26px}}
  .lp-tabs{display:flex;gap:8px;flex-wrap:wrap}
  .lp-tabs a{min-height:44px;display:inline-flex;align-items:center;padding:0 18px;border-radius:999px;font-weight:800;font-size:15px;text-decoration:none;color:#fff;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.35);transition:background-color 200ms ease,color 200ms ease}
  .lp-tabs a[aria-current="page"]{background:#fff;color:#2B1D3F;border-color:#fff}
  @media(hover:hover) and (pointer:fine){.lp-tabs a:not([aria-current]):hover{background:rgba(255,255,255,.22)}}
  .lp-chips{display:flex;gap:10px;flex-wrap:wrap}
  .lp-chips a{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 20px;border-radius:999px;background:#fff;color:#2B1D3F;font-weight:800;font-size:15px;text-decoration:none;box-shadow:0 10px 24px -18px rgba(91,60,140,.55);transition:translate 250ms var(--ease-out),box-shadow 250ms var(--ease-out)}
  @media(hover:hover) and (pointer:fine){.lp-chips a:hover{translate:0 -3px;box-shadow:0 16px 30px -18px rgba(91,60,140,.6)}}
  .lp-h3x{font-size:clamp(22px,2.2vw,28px);font-weight:900;margin-bottom:16px}
  .lp-steps3{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
  .lp-stepnum{width:44px;height:44px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#fff;background:linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)}
  @media(max-width:860px){.lp-steps3{grid-template-columns:1fr}}
  .lp-contact-box{margin-top:8px;padding:18px 22px;border-radius:22px;background:#F4EEFF;color:#2B1D3F;font-weight:700;font-size:15px;display:flex;gap:8px 18px;flex-wrap:wrap}
  .lp-contact-box a{color:#4A2C8F}
  .lp-ctanote{font-size:15px;margin-top:18px;color:#F1EAF8}
  /* ─── v5: דף הבית צבעוני ובהיר יותר — בועות זכוכית, מסכי מוצר, כפתורי גלולה לבנים ─── */
  .lp-hero-sec .lp-hero-tint{background:linear-gradient(200deg,rgba(76,40,140,.64) 0%,rgba(120,64,170,.52) 50%,rgba(214,86,150,.46) 100%)}
  .lp-hero-sec .lp-h1,.lp-hero-sec .lp-hero-lead{text-shadow:0 2px 14px rgba(50,30,100,.45),0 1px 3px rgba(40,22,80,.4)}
  .lp-pink{color:#FFC2DC}
  .lp-gold{color:#FFE08A}
  .lp-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:6px 0 14px;max-width:600px}
  .lp-fact{padding:13px 10px;border-radius:22px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.34);color:#fff;text-align:center}
  .lp-fact b{display:block;font-size:clamp(15px,1.3vw,19px);font-weight:900;line-height:1.15;overflow-wrap:anywhere}
  @media(max-width:600px){.lp-facts{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .lp-fact span{display:block;font-size:13px;font-weight:700;opacity:.95;margin-top:4px}
  @media(max-width:960px){.lp-facts{margin-inline:auto}}
  .lp-mock{position:relative;width:100%;aspect-ratio:1/.84}
  .lp-mock-tab{position:absolute;top:9%;right:0;width:94%;transform:perspective(1500px) rotateY(-12deg) rotateX(5deg);transform-origin:right center}
  .lp-mock-tab .lp-frame{border-width:10px;border-radius:24px;box-shadow:0 50px 90px -40px rgba(20,8,50,.8)}
  .lp-mock-phone{position:absolute;bottom:0;left:0;width:31%;rotate:-5deg}
  .lp-mock-phone .lp-frame{border-width:7px;border-radius:34px}
  .lp-mock-phone img{aspect-ratio:390/760;object-fit:cover;object-position:top}
  .lp-bub{position:absolute;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;padding:11px 16px;border-radius:18px;background:rgba(255,255,255,.95);color:#2B1D3F;font-size:14px;font-weight:800;box-shadow:0 18px 40px -16px rgba(30,16,60,.55)}
  .lp-bub i{width:10px;height:10px;border-radius:50%;flex-shrink:0}
  .lp-bub.b1{top:0;left:6%}
  .lp-bub.b2{bottom:30%;right:-2%}
  .lp-bub.b3{bottom:3%;left:35%}
  .lp-motion .lp-bub{animation:lpPop 600ms var(--ease-out) var(--d,0s) both,lpBob 5s ease-in-out calc(var(--d,0s) + .6s) infinite alternate}
  @keyframes lpBob{from{translate:0 0}to{translate:0 -10px}}
  @media(max-width:960px){.lp-mock{max-width:520px;margin:0 auto}.lp-bub{font-size:12px;padding:8px 12px}.lp-bub.b2{right:0}}
  /* 3 שלבים בשורה אחת */
  .lp-steprow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
  .lp-stepcard{background:#fff;border-radius:32px;overflow:hidden;box-shadow:0 22px 50px -30px rgba(60,35,110,.45);display:flex;flex-direction:column}
  .lp-stepart{position:relative;height:270px;overflow:hidden;border-radius:32px 32px 0 0;display:flex;justify-content:center;align-items:flex-start;padding-top:30px}
  .lp-stepart.phone .lp-frame{width:58%;border-width:7px;border-radius:30px 30px 0 0;border-bottom:none}
  .lp-stepart.phone img{aspect-ratio:390/760;object-fit:cover;object-position:top}
  .lp-stepart.laptop{align-items:center;padding:0 22px}
  .lp-stepart.laptop .lp-frame{width:100%;border-width:7px;border-radius:16px}
  @media(hover:hover) and (pointer:fine){.lp-stepart .lp-frame{transition:translate 400ms var(--ease-out)}.lp-stepcard:hover .lp-stepart .lp-frame{translate:0 -8px}}
  .lp-stepchip{position:absolute;bottom:16px;right:16px;background:#fff;color:#2B1D3F;font-size:13px;font-weight:800;padding:9px 13px;border-radius:14px;box-shadow:0 14px 30px -14px rgba(30,16,60,.5);border-right:4px solid var(--c)}
  .lp-motion .in .lp-stepchip{animation:lpPop 500ms var(--ease-out) .45s both}
  .lp-stepbody{padding:22px 26px 28px}
  .lp-stepbody h3{font-size:22px;font-weight:900;line-height:1.25;margin:12px 0 8px}
  .lp-stepbody p{font-size:16px;line-height:1.7;color:#3E3555}
  .lp-stepnum2{width:42px;height:42px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;background:var(--c);box-shadow:0 10px 20px -8px var(--c)}
  @media(max-width:960px){.lp-steprow{grid-template-columns:1fr;max-width:520px;margin:0 auto}}
  /* מחירים: ארבע חבילות בשורה אחת */
  .lp-price4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:stretch}
  .lp-price4 .lp-pcard{padding:28px 22px}
  .lp-price4 .lp-num{font-size:46px!important}
  @media(max-width:1100px){.lp-price4{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:640px){.lp-price4{grid-template-columns:1fr}}
  /* כפתור משני על רקע בהיר: גלולה לבנה עם צל, בלי מסגרת */
  .lp-ghost{background:#fff;border:none;box-shadow:0 14px 30px -14px rgba(43,29,63,.38)}
  .lp-ghost:hover{box-shadow:0 18px 36px -14px rgba(43,29,63,.45);color:#2B1D3F}
  /* רקעים פסטליים צבעוניים יותר לכרטיסי היכולות */
  .lp-bento .lp-card:nth-child(1) .lp-bart{background:linear-gradient(150deg,#FFE3EF,#EBDFFF)!important}
  .lp-bento .lp-card:nth-child(2) .lp-bart{background:linear-gradient(150deg,#EBDFFF,#DDC7FF)!important}
  .lp-bento .lp-card:nth-child(3) .lp-bart{background:linear-gradient(160deg,#DDF2FF,#BFE3FA)!important}
  .lp-bento .lp-card:nth-child(4) .lp-bart{background:linear-gradient(160deg,#E7F5EC,#C9E9D8)!important}
  .lp-bento .lp-card:nth-child(5) .lp-bart{background:linear-gradient(160deg,#E9FBF0,#FFEFD9)!important}
  .lp-bento .lp-card:nth-child(6) .lp-bart{background:linear-gradient(160deg,#FFF4DC,#FFE1C2)!important}
  .lp-cta-tint{background:linear-gradient(120deg,rgba(196,58,130,.78),rgba(110,70,200,.78))}
  /* ─── v6: רקע בהיר, גופן Fredoka, כל מקטע בצבע משלו ומשחק צבעים ─── */
  .lp{font-synthesis-weight:none}
  .lp h1,.lp h2,.lp h3,.lp-btn,.lp-nav-link,.lp-fact b,.lp-bub,.lp-num,.lp-ribbon span,.lp-stepnum2,.lp-stepnum,.lp-wordmark,.lp-chiprow span,.lp-faq summary,.lp-menu li a,.lp-stepchip,.lp-cmp-tag,.lp-screen-chip,.lp-gmeta,.lp-tabs a,.lp-chips a,.lp-hmeta span{font-family:'Fredoka','Heebo',sans-serif}
  .lp h1,.lp h2{font-weight:700;letter-spacing:-.01em}
  .lp-sheet{margin:0 2vw 28px}
  .lp-hero6{position:relative;z-index:1;overflow:hidden;min-height:100vh;min-height:100svh;display:flex;align-items:center;padding:132px 6vw 110px;color:#2B1D3F;
    background:radial-gradient(760px 520px at 92% 8%,#EFE4FF 0%,rgba(239,228,255,0) 62%),radial-gradient(680px 520px at 4% 40%,#FFE4F0 0%,rgba(255,228,240,0) 62%),radial-gradient(640px 440px at 50% 100%,#E2F6EE 0%,rgba(226,246,238,0) 60%),#FFFBF7}
  .lp-blobs{position:absolute;inset:0;pointer-events:none;z-index:0}
  .lp-hero6-photo{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
  .lp-hero6-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.2;filter:saturate(.75) brightness(1.35)}
  .lp-hero6-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,251,247,.55) 0%,rgba(255,251,247,.25) 45%,rgba(255,251,247,.85) 100%)}
  .lp-blobs i{position:absolute;border-radius:50%}
  .lp-blobs i:nth-child(1){width:220px;height:220px;top:14%;right:46%;background:radial-gradient(circle at 30% 30%,#FFFFFF,#E9DDFF 60%,#D9C6FF);opacity:.7}
  .lp-blobs i:nth-child(2){width:120px;height:120px;bottom:16%;right:8%;background:radial-gradient(circle at 30% 30%,#FFFFFF,#FFD6E8 60%,#FFB8D6);opacity:.75}
  .lp-blobs i:nth-child(3){width:90px;height:90px;top:22%;left:6%;background:radial-gradient(circle at 30% 30%,#FFFFFF,#CFF3E4 60%,#A8EBD2);opacity:.8}
  .lp-blobs i:nth-child(4){width:160px;height:160px;bottom:8%;left:38%;background:radial-gradient(circle at 30% 30%,#FFFFFF,#FFEBC7 60%,#FFD796);opacity:.6}
  .lp-motion .lp-blobs i{animation:lpFloat6 16s ease-in-out infinite alternate}
  .lp-motion .lp-blobs i:nth-child(2){animation-duration:12s;animation-delay:-3s}
  .lp-motion .lp-blobs i:nth-child(3){animation-duration:14s;animation-delay:-6s}
  .lp-motion .lp-blobs i:nth-child(4){animation-duration:18s;animation-delay:-2s}
  @keyframes lpFloat6{from{transform:translate3d(0,0,0)}to{transform:translate3d(18px,-30px,0)}}
  .lp-chiprow{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}
  .lp-chiprow span{display:inline-flex;align-items:center;min-height:34px;padding:0 14px;border-radius:999px;font-size:14px;font-weight:600;box-shadow:inset 0 0 0 1.5px currentColor}
  .lp-h1-6{color:#2B1D3F;font-size:clamp(50px,7vw,106px);line-height:1.04}
  .lp-h1-6 mark{color:inherit;padding:0 .14em;border-radius:.22em;background-repeat:no-repeat;background-position:right center;background-size:100% 100%;-webkit-box-decoration-break:clone;box-decoration-break:clone}
  .lp-h1-6 mark.mk1{background-image:linear-gradient(120deg,#FFD1E5,#FFB2D3)}
  .lp-h1-6 mark.mk2{background-image:linear-gradient(120deg,#C9F2E1,#9FE6CB)}
  .lp-motion .lp-h1-6 mark{animation:lpMark 900ms var(--ease-out) var(--md,1s) both}
  @keyframes lpMark{from{background-size:0% 100%}to{background-size:100% 100%}}
  .lp-facts6 .lp-fact{background:var(--bg);border:1.5px solid var(--bd);color:var(--fg)}
  .lp-facts6 .lp-fact span{opacity:1}
  #top.lp-hero6 .lp-hero-link{color:#4A2C8F}
  #top.lp-hero6 .lp-hero-link:hover,#top.lp-hero6 .lp-hero-link:focus-visible{color:#C2397A}
  .lp-banner{position:relative;border-radius:44px;padding:34px 26px 38px;background:linear-gradient(150deg,#E6D9FF 0%,#FFD3E6 55%,#FFE6C4 100%);box-shadow:0 44px 90px -44px rgba(120,60,170,.6)}
  .lp-banner-img{position:absolute;inset:14px;width:calc(100% - 28px);height:calc(100% - 28px);object-fit:cover;border-radius:34px}
  .lp-banner-tint{position:absolute;inset:14px;border-radius:34px;background:linear-gradient(180deg,rgba(124,75,214,.22),rgba(240,96,158,.34))}
  .lp-banner .lp-mock{position:relative;z-index:1}
  .lp-spark{position:absolute;z-index:2;pointer-events:none}
  .lp-motion .lp-spark{animation:twinkle 3s ease-in-out infinite}
  @media(max-width:960px){.lp-hero6{padding:112px 5vw 90px}.lp-banner{padding:24px 16px 28px;border-radius:34px}.lp-chiprow{justify-content:center}}
  /* ─── ליטוש: טיפוגרפיה, פתיחה פחות עמוסה, עובדות בפס אחד ─── */
  .lp h1,.lp h2,.lp h3{text-wrap:balance}
  .lp p,.lp li{text-wrap:pretty}
  html:has(.lp){scrollbar-color:#D9C6FF #FFFBF7}
  /* בועות הרקע: שקטות יותר ולא מאחורי הכותרת */
  .lp-blobs i:nth-child(1){width:150px;height:150px;top:9%;right:50%;opacity:.45}
  .lp-blobs i:nth-child(4){width:120px;height:120px;opacity:.4}
  /* ארבע העובדות: פס לבן אחד עם קווים דקים, המספר בצבע שלו (במקום ארבע קוביות בצבעים שונים) */
  .lp-facts6{gap:0;background:rgba(255,255,255,.88);border:1px solid #EFE6F7;border-radius:24px;padding:4px;box-shadow:0 18px 40px -30px rgba(91,60,140,.55);backdrop-filter:blur(6px)}
  .lp-facts6 .lp-fact{background:none;border:none;border-radius:0;color:#3E3555;padding:11px 8px}
  .lp-facts6 .lp-fact+.lp-fact{box-shadow:inset -1px 0 0 #EFE6F7}
  .lp-facts6 .lp-fact b{color:var(--fg);font-size:clamp(17px,1.4vw,21px)}
  .lp-facts6 .lp-fact span{color:#5F5675;font-weight:600}
  @media(max-width:600px){.lp-facts6 .lp-fact:nth-child(3){box-shadow:none}.lp-facts6 .lp-fact:nth-child(n+3){border-top:1px solid #EFE6F7}}
  /* בנייד: התגיות מעל הכותרת בשורה אחת שנגללת לצד, כדי שהכותרת והמוצר יעלו למעלה */
  @media(max-width:700px){.lp-blobs i:nth-child(1),.lp-blobs i:nth-child(3){display:none}}
  @media(max-width:700px){.lp-chiprow{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;margin:0 -5vw 18px;padding:2px 5vw;scrollbar-width:none}.lp-chiprow::-webkit-scrollbar{display:none}.lp-chiprow span{flex:0 0 auto}}
  /* דפים פנימיים: אותה פתיחה בהירה וצבעונית של דף הבית */
  .lp-phero{border-radius:0;color:#2B1D3F;
    background:radial-gradient(760px 520px at 92% 8%,#EFE4FF 0%,rgba(239,228,255,0) 62%),radial-gradient(680px 520px at 4% 40%,#FFE4F0 0%,rgba(255,228,240,0) 62%),radial-gradient(640px 440px at 50% 100%,#E2F6EE 0%,rgba(226,246,238,0) 60%),#FFFBF7}
  .lp-phero .lp-phero-h1{color:#2B1D3F}
  .lp-phero-lead{color:#3E3555}
  .lp-crumbs{color:#5F5675}
  .lp-crumbs a{color:#4A2C8F}
  .lp-hmeta span{background:#fff;border:1.5px solid #E0D3F7;color:#4A2C8F}
  .lp-tabs a{color:#4A2C8F;background:#fff;border:1.5px solid #E0D3F7}
  .lp-tabs a[aria-current="page"]{background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF);color:#fff;border-color:transparent}
  @media(hover:hover) and (pointer:fine){.lp-tabs a:not([aria-current]):hover{background:#F6F0FF}}
  .lp-phero .lp-banner{padding:26px 20px 30px}
  /* קישורים שנראים ככפתור או ככרטיס: הצבע שלהם, לא של הטקסט שמסביב (.lp a יורש צבע) */
  .lp a.lp-white,.lp a.lp-ghost{color:#2B1D3F}
  .lp a.lp-primary,.lp a.lp-glass-btn{color:#fff}
  .lp a.lp-gcard,.lp a.lp-pcard2{color:#2B1D3F}
  .lp a.lp-gcard.lp-gfeat{color:#fff}
  .lp-phero-in.has-aside .lp-phero-h1{font-size:clamp(32px,4vw,54px)}
`;

// אייקונים בקו דק (בסגנון אחיד במקום אימוג'י)
const LP_ICONS={
  sheet:<><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M4 9h16M4 15h16M10 3v18"/></>,
  map:<><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></>,
  ai:<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></>,
  users:<><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.6.1 4.6 1.8 5.3 4.9"/></>,
  check:<><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/></>,
  msg:<><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/></>,
  print:<><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></>,
  phone:<><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></>,
  mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>,
  pin:<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></>,
};
const LpIcon=({name,color,size=26})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{LP_ICONS[name]}</svg>
);


// שרשרת נורות תלויה מעל ה-Hero
// ביצועים: החוט סטטי, והנורות ב-3 שכבות שכל אחת מהבהבת כולה (opacity על השכבה = עבודה של כרטיס המסך).
// קודם כל נורה הבהבה לבד, וכל הרצועה (ברוחב המסך) צוירה מחדש בכל פריים — איטי במסכים גדולים
function StringLights() {
  const pts=Array.from({length:26},(_,i)=>i);
  const y=x=>30+Math.sin((x/1200)*Math.PI*3)*22+Math.sin((x/1200)*Math.PI*12)*6;
  const colors=["#E8B04A","#F0609E","#9B6BFF","#3CC8A0","#5AA9FF","#FF8A65"];
  const box={position:"absolute",top:62,left:0,width:"100%",height:90,pointerEvents:"none"};
  return(<>
    <svg viewBox="0 0 1200 90" preserveAspectRatio="none" style={box} aria-hidden="true">
      <path d={"M0 "+y(0)+pts.map(i=>{const x=i*48;return ` L${x} ${y(x)}`;}).join("")} fill="none" stroke="#CBBFE0" strokeWidth="1.5"/>
      {pts.map(i=>{const x=i*48+24;return <rect key={i} x={x-2.5} y={y(x)} width="5" height="5" rx="1" fill="#B8AACF"/>;})}
    </svg>
    {[0,1,2].map(g=>(
      <svg key={g} viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true"
        style={{...box,willChange:"opacity",animation:`bulb ${2.2+g*.6}s ease-in-out ${g*.55}s infinite`}}>
        {pts.filter(i=>i%3===g).map(i=>{const x=i*48+24;const c=colors[i%colors.length];return(
          <g key={i}>
            <circle cx={x} cy={y(x)+10} r="9" fill={c} opacity=".18"/>
            <ellipse cx={x} cy={y(x)+10} rx="4.2" ry="5.5" fill={c}/>
            <ellipse cx={x-1.3} cy={y(x)+8} rx="1.2" ry="1.8" fill="#fff" opacity=".7"/>
          </g>
        );})}
      </svg>
    ))}
  </>);
}

// הדגמה חיה בפתיחה: מושיבים אורחים על מפת אולם קטנה (לחיצה על שולחן, או גרירה במחשב).
// הכל מקומי בדפדפן: לא נשמר ולא נשלח לשום מקום
const SEAT_CAP=10;
const SEAT_TABLES=[
  {n:1,x:16,y:36,c:LP.rose,start:8},{n:2,x:16,y:62,c:LP.rose,start:7},
  {n:3,x:84,y:36,c:LP.sky,start:8},{n:4,x:84,y:62,c:LP.sky,start:8},
  {n:5,x:33,y:87,c:LP.mint,start:8},{n:6,x:67,y:87,c:LP.gold,start:9},
];
const SEAT_GUESTS=[
  {id:"rachel",name:"דודה רחל",c:LP.rose,note:"לא ליד דוד משה",ai:2},
  {id:"hana",name:"סבתא חנה",c:LP.rose,ai:1},
  {id:"yuval",name:"יובל",c:LP.sky,ai:3},
  {id:"maya",name:"מאיה",c:LP.sky,ai:4},
  {id:"roi",name:"רועי",c:LP.mint,ai:5},
];
const LpGo=({size=16})=>(
  <span className="lp-go" aria-hidden="true"><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></span>
);
function HeroSeating() {
  const [seats,setSeats]=useState({}),[pick,setPick]=useState("rachel"),[msg,setMsg]=useState(null),[fresh,setFresh]=useState(null),[busy,setBusy]=useState(false);
  const timers=useRef([]);
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  const waiting=SEAT_GUESTS.filter(g=>!seats[g.id]);
  const guest=waiting.find(g=>g.id===pick)||waiting[0]||null;
  const inTable=n=>SEAT_GUESTS.filter(g=>seats[g.id]===n);
  const place=(id,n)=>{
    const g=waiting.find(x=>x.id===id);
    if(!g||busy)return;
    const t=SEAT_TABLES.find(x=>x.n===n);
    if(g.id==="rachel"&&n===1){setMsg({bad:true,t:"דוד משה יושב בשולחן 1, ודודה רחל ביקשה לא לשבת לידו. נסו שולחן אחר."});return;}
    if(t.start+inTable(n).length>=SEAT_CAP){setMsg({bad:true,t:`שולחן ${n} מלא. נסו שולחן אחר.`});return;}
    const next=waiting.find(x=>x.id!==g.id);
    setSeats(s=>({...s,[g.id]:n}));setFresh(g.id);
    if(next)setPick(next.id);
    setMsg({t:next?`${g.name} בשולחן ${n}. עכשיו: ${next.name}.`:"כולם במקום."});
  };
  const autoSeat=()=>{
    const count={};SEAT_TABLES.forEach(t=>{count[t.n]=t.start+inTable(t.n).length;});
    const plan=waiting.map(g=>{
      const n=[g.ai,...SEAT_TABLES.map(t=>t.n)].find(x=>count[x]<SEAT_CAP&&!(g.id==="rachel"&&x===1));
      count[n]++;return [g,n];
    });
    setBusy(true);setMsg({t:"מסדרים לפי משפחות וחברים..."});
    timers.current=plan.map(([g,n],i)=>setTimeout(()=>{
      setSeats(s=>({...s,[g.id]:n}));setFresh(g.id);
      if(i===plan.length-1){setBusy(false);setMsg({t:"כולם במקום."});}
    },300+i*320));
  };
  const reset=()=>{timers.current.forEach(clearTimeout);setSeats({});setPick("rachel");setMsg(null);setFresh(null);setBusy(false);};
  return(
    <div className="lp-seat">
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,marginBottom:12,padding:"2px 4px 0"}}>
        <div style={{fontSize:18,fontWeight:900,color:LP.ink}}>נסו להושיב בעצמכם</div>
        <div style={{fontSize:13,color:LP.muted,whiteSpace:"nowrap"}}>דוגמה להמחשה</div>
      </div>
      <div className="lp-floor" dir="ltr">
        <div aria-hidden="true" style={{position:"absolute",top:"3%",left:"31%",width:"38%",height:"9%",borderRadius:100,background:"#FFE3EE",border:"1px solid #F3B6CF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"clamp(11px,2.6vw,13px)",fontWeight:900,color:"#9E2F62",direction:"rtl"}}>חתן וכלה</div>
        <div aria-hidden="true" style={{position:"absolute",top:"22%",left:"34%",width:"32%",height:"47%",borderRadius:14,border:"1px solid #EBCB8F",background:"repeating-conic-gradient(#FBF3E4 0 25%,#F6E7CC 0 50%) 0 0/28px 28px",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",fontSize:"clamp(12px,2.8vw,14px)",fontWeight:900,color:"#7A5412",direction:"rtl"}}>רחבת ריקודים</div>
        {SEAT_TABLES.map(t=>{
          const added=inTable(t.n),taken=t.start+added.length;
          return(
            <button key={t.n} type="button" className="lp-tb" style={{left:`${t.x}%`,top:`${t.y}%`}}
              aria-label={`שולחן ${t.n}, ${taken} מתוך ${SEAT_CAP} מקומות תפוסים`}
              onClick={()=>guest&&place(guest.id,t.n)}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();place(e.dataTransfer.getData("text/plain"),t.n);}}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                {Array.from({length:SEAT_CAP}).map((_,i)=>{
                  const d=i*36,a=d*Math.PI/180,g=i>=t.start?added[i-t.start]:null;
                  return <g key={i} transform={`translate(${(50+40*Math.sin(a)).toFixed(1)},${(50-40*Math.cos(a)).toFixed(1)}) rotate(${d})`}>
                    <rect className={g&&g.id===fresh?"sx-chair-new":undefined} x="-7.5" y="-5.5" width="15" height="11" rx="4.5" fill={i<t.start?t.c:g?g.c:"#E4DCF0"}/>
                  </g>;
                })}
                <circle className="lp-tb-c" cx="50" cy="50" r="27" fill="#fff" stroke={t.c} strokeWidth="2"/>
                <text x="50" y="58" textAnchor="middle" fontSize="23" fontWeight="900" fill={LP.ink} fontFamily="Heebo">{t.n}</text>
              </svg>
            </button>
          );
        })}
      </div>
      <p role="status" style={{minHeight:46,margin:"10px 4px 6px",fontSize:15,lineHeight:1.55,fontWeight:700,color:msg?.bad?"#B42318":LP.ink}}>
        {msg?msg.t:guest?`לחצו על שולחן כדי להושיב את ${guest.name}.`:""}
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
        {waiting.map(g=>(
          <button key={g.id} type="button" className="lp-guest" aria-pressed={guest?.id===g.id} draggable
            onClick={()=>{setPick(g.id);setMsg(null);}}
            onDragStart={e=>{e.dataTransfer.setData("text/plain",g.id);setPick(g.id);}}>
            <span aria-hidden="true" style={{width:10,height:10,borderRadius:"50%",background:g.c,flexShrink:0}}/>
            {g.name}{g.note&&<small>{g.note}</small>}
          </button>
        ))}
      </div>
      <div style={{marginTop:6}}>
        {waiting.length>0
          ?<button type="button" className="lp-seat-act" disabled={busy} onClick={autoSeat}>לתת ל-AI להושיב את השאר</button>
          :<button type="button" className="lp-seat-act" onClick={reset}>להתחיל מחדש</button>}
      </div>
    </div>
  );
}

// איורים קטנים לשלבי "איך זה עובד"
let INSTALL_EVT=null;
if(typeof window!=="undefined"){
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();INSTALL_EVT=e;window.dispatchEvent(new Event("sx-install"));});
  window.addEventListener("appinstalled",()=>{INSTALL_EVT=null;window.dispatchEvent(new Event("sx-install"));});
  // רישום ה-service worker (גם בלי התראות) כדי שהדפדפן יציע התקנה
  // הקוד הזה נטען אחרי הדף (קובץ נפרד), אז ייתכן שאירוע "load" כבר עבר — במקרה כזה נרשמים מיד
  if("serviceWorker" in navigator){const reg=()=>navigator.serviceWorker.register("/sw.js").catch(()=>{});document.readyState==="complete"?reg():window.addEventListener("load",reg);}
}
// isStandalone מוגדר ליד PushDevice
const installPlatform=()=>{const u=navigator.userAgent||"";return /iPhone|iPad|iPod/i.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)?"ios":/Android/i.test(u)?"android":"desktop";};
export function InstallAppButton({ style, label="📲 הורדת האפליקציה" }) {
  const [,tick]=useState(0),[help,setHelp]=useState(false);
  useEffect(()=>{const f=()=>tick(t=>t+1);window.addEventListener("sx-install",f);return()=>window.removeEventListener("sx-install",f);},[]);
  if(isStandalone())return null;
  const click=async()=>{
    if(INSTALL_EVT){const e=INSTALL_EVT;e.prompt();try{await e.userChoice;}catch{}INSTALL_EVT=null;tick(t=>t+1);return;}
    setHelp(true);
  };
  const p=installPlatform();
  const steps=p==="ios"
    ?[["1","פתחו את האתר בדפדפן Safari"],["2",<>לחצו על כפתור השיתוף <b>⬆️</b> בתחתית המסך</>],["3",<>גללו ובחרו <b>"הוספה למסך הבית"</b></>],["4",<>לחצו <b>"הוסף"</b>, והאייקון של Sidor-IL יופיע במסך הבית</>]]
    :p==="android"
    ?[["1","פתחו את האתר ב-Chrome"],["2",<>לחצו על התפריט <b>⋮</b> למעלה</>],["3",<>בחרו <b>"התקנת אפליקציה"</b> או <b>"הוספה למסך הבית"</b></>],["4","האייקון של Sidor-IL יופיע עם שאר האפליקציות"]]
    :[["1","פתחו את האתר ב-Chrome או Edge"],["2",<>לחצו על סמל ההתקנה <b>⊕</b> בצד שורת הכתובת</>],["3",<>או: תפריט <b>⋮</b> ← <b>"התקנת Sidor-IL"</b></>],["4","האפליקציה תיפתח בחלון משלה, עם קיצור דרך בשולחן העבודה"]];
  return(<>
    <button onClick={click} className="sx-btn" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,background:"#fff",color:"#3A2464",border:"1.5px solid #E6DDF5",borderRadius:12,padding:"10px 16px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'Heebo',sans-serif",...style}}>{label}</button>
    {help&&(
      <div onClick={()=>setHelp(false)} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(43,29,63,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div onClick={e=>e.stopPropagation()} dir="rtl" role="dialog" aria-label="התקנת האפליקציה" style={{background:"#fff",borderRadius:22,padding:"22px 20px",width:"100%",maxWidth:380,fontFamily:"'Heebo',sans-serif",boxShadow:"0 30px 70px -20px rgba(91,60,140,.55)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <img src="/icon-192.png" alt="" width={48} height={48} style={{borderRadius:12}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:18,fontWeight:900,color:"#2B1D3F"}}>התקנת Sidor-IL</div>
              <div style={{fontSize:12,color:"#7A6F8C"}}>חינם, בלי חנות אפליקציות, תופס כמעט אפס מקום</div>
            </div>
            <button onClick={()=>setHelp(false)} aria-label="סגירה" style={{background:"#F6F0FF",border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",flexShrink:0}}>✕</button>
          </div>
          {steps.map(([n,t])=>(
            <div key={n} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10,fontSize:14,color:"#3E3555",lineHeight:1.6}}>
              <span style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",fontSize:12,fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{n}</span>
              <span>{t}</span>
            </div>
          ))}
          <button onClick={()=>setHelp(false)} style={{width:"100%",marginTop:6,background:"linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF)",color:"#fff",border:"none",borderRadius:12,padding:12,fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>הבנתי</button>
        </div>
      </div>
    )}
  </>);
}

// תמיכה ועזרה מתוך האירוע: וואטסאפ או מייל, עם שם האירוע כבר בהודעה
// compact: בבר העליון בטלפון — "❓ עזרה" קצר
const goLanding=(id,auth)=>{
  try{sessionStorage.setItem("sidor_landing","1");if(auth)sessionStorage.setItem("sidor_open_auth",auth);}catch{}
  const url="/"+(id?"#"+id:"");
  if(window.location.pathname==="/"){history.replaceState(null,"",url);window.location.reload();}else window.location.href=url;
};
// ─── דפים ציבוריים (סוגי אירועים, מדריכים, מידע משפטי, אולמות): אותה שפה, תפריט, תחתית ותנועה של דף הבית ───
// הקישורים למקטעי דף הבית עוברים דרך goLanding (כדי שגם משתמש מחובר יראה את דף הבית)
const WA_SVG_D="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";
const LP_WA=contactUrl();
const LpWaFab=()=>!SUPPORT_WA?null:(
  <a href={LP_WA} target="_blank" rel="noopener noreferrer" aria-label="צ'אט בוואטסאפ"
    className="lp-wa-fab" style={{position:"fixed",bottom:20,left:20,background:"#0F7F40",color:"#fff",borderRadius:50,padding:"12px 20px",display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,boxShadow:"0 8px 24px rgba(37,211,102,.45)",zIndex:99,textDecoration:"none"}}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d={WA_SVG_D}/></svg>
    <span className="lp-lg">לחץ לצ'אט</span>
  </a>
);
// כותרת מקטע (כמו בדף הבית)
const LpTitle=({title,accent,sub,dark=false,mb=52})=>(
  <div data-reveal style={{marginBottom:mb,maxWidth:820}}>
    <h2 className="lp-h2" style={dark?{color:LP.cream}:undefined}>{title} {accent&&<span className={dark?"lp-grad-light":"lp-grad"}>{accent}</span>}</h2>
    {sub&&<p className="lp-sec-sub" style={dark?{color:"#E2DAEE"}:undefined}>{sub}</p>}
  </div>
);
// פתיחה של דף פנימי: רקע כהה עם אורות רכים (ותמונה, אם יש), כותרת שעולה, ומה שצריך מתחתיה
function PageHero({ crumbs, title, lead, img, aside, children }) {
  return(
    <section id="top" className="lp-phero">
      <div className="lp-blobs" aria-hidden="true"><i/><i/><i/><i/></div>
      <StringLights/>
      <div className={`lp-phero-in${aside?" has-aside":""}`}>
        <div className="lp-phero-copy">
          {crumbs&&<nav aria-label="פירורי לחם" className="lp-crumbs lp-rise" style={{"--d":".05s"}}>{crumbs}</nav>}
          <h1 className="lp-h1 lp-phero-h1"><span className="lp-line"><span style={{"--d":".12s"}}>{title}</span></span></h1>
          {lead&&<p className="lp-phero-lead lp-rise" style={{"--d":".34s"}}>{lead}</p>}
          {children&&<div className="lp-rise" style={{"--d":".46s"}}>{children}</div>}
        </div>
        {aside&&<div className="lp-phero-aside lp-rise-side" style={{"--d":".3s"}}>
          <div className="lp-banner">
            {img&&<img className="lp-banner-img" src={img} alt=""/>}
            {img&&<div className="lp-banner-tint" aria-hidden="true"/>}
            <div style={{position:"relative",zIndex:1}}>{aside}</div>
          </div>
        </div>}
      </div>
    </section>
  );
}
// פס הסיום עם תמונה: כפתור ראשי + וואטסאפ
function LpCtaBand({ title, text, primary, secondary, note }) {
  const sec=secondary===null?null:(secondary||{href:LP_WA,label:`דברו איתנו ${CONTACT_BY}`,external:!!SUPPORT_WA});
  const ext=x=>x.external?{target:"_blank",rel:"noopener noreferrer"}:{};
  return(
    <section className="lp-cta3" aria-label={title}>
      <picture><source media="(max-width:900px)" srcSet="/img/u/1773005695300-14b62bc85ba0_800.webp"/><img className="lp-kb" src="/img/u/1773005695300-14b62bc85ba0_1600.webp" alt="" loading="lazy"/></picture>
      <div className="lp-cta-tint" aria-hidden="true"/>
      <LpBokeh n={7}/>
      <div className="lp-wrap" style={{position:"relative"}}>
        <h2 data-reveal style={{fontSize:"clamp(32px,5vw,64px)",fontWeight:900,marginBottom:14,letterSpacing:"-.025em",lineHeight:1.08}}>{title}</h2>
        {text&&<p data-reveal style={{"--d":".08s",fontSize:19,marginBottom:32,lineHeight:1.65,maxWidth:"48ch"}}>{text}</p>}
        <div data-reveal style={{"--d":".16s",display:"flex",gap:14,flexWrap:"wrap"}}>
          <a href={primary.href} onClick={primary.onClick} {...ext(primary)} className="lp-btn lp-white" style={{padding:"13px 32px 13px 14px",fontSize:18,minHeight:60}}>{primary.label}<LpGo/></a>
          {sec&&<a href={sec.href} {...ext(sec)} className="lp-btn lp-glass-btn" style={{padding:"13px 30px",fontSize:16,minHeight:60}}>{sec.label}</a>}
        </div>
        {note&&<div className="lp-ctanote" data-reveal style={{"--d":".2s"}}>{note}</div>}
      </div>
    </section>
  );
}
// תוכן העניינים של מדריך או מסמך: נדבק בצד, והחלק שקוראים עכשיו מסומן. לא משנה את הכתובת (חשוב בדפים שנפתחים עם #)
function LpToc({ items, label="בדף הזה" }) {
  const [on,setOn]=useState(items[0]?.id);
  const key=items.map(i=>i.id).join();
  useEffect(()=>{
    setOn(items[0]?.id);
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setOn(e.target.id);}),{rootMargin:"-10% 0px -80% 0px"});
    items.forEach(it=>{const el=document.getElementById(it.id);if(el)io.observe(el);});
    return()=>io.disconnect();
  },[key]);
  const go=id=>e=>{e.preventDefault();setOn(id);document.getElementById(id)?.scrollIntoView({behavior:lpMotionOK()?"smooth":"auto",block:"start"});};
  return(
    <nav className="lp-toc" aria-label={label}>
      <b>{label}</b>
      <ol>{items.map(it=><li key={it.id}><a href={"#"+it.id} className={on===it.id?"on":undefined} aria-current={on===it.id?"location":undefined} onClick={go(it.id)}>{it.label}</a></li>)}</ol>
    </nav>
  );
}
// תחתית האתר — אחת לכל הדפים. בדף הבית הקישורים למקטעים הם עוגנים רגילים, בשאר הדפים עוברים לדף הבית
function SiteFooter({ home=false, onAuth, onVenue, loggedIn=false }) {
  const sec=(id,label)=>({href:home?"#"+id:"/#"+id,label,onClick:home?undefined:e=>{e.preventDefault();goLanding(id);}});
  const lg=(h,label)=>({href:home?h:"/"+h,label});
  const legal=[lg("#/terms","תנאי שימוש"),lg("#/privacy","מדיניות פרטיות"),lg("#/accessibility","הצהרת נגישות"),lg("#/cancel","ביטול עסקה")];
  const cols=[
    ["האתר",[sec("how","איך זה עובד"),sec("features","יכולות"),sec("events","סוגי אירועים"),sec("pricing","מחירים וחבילות"),{href:"/guides",label:"מדריכים וטיפים"},sec("contact","צור קשר")]],
    ["שירות",[{label:loggedIn?"האירועים שלי":"כניסה לחשבון",btn:()=>onAuth("login")},{label:"הרשמה חינם",btn:()=>onAuth("register")},{label:"ספקים ומפיקים: הצטרפות",href:JOIN_WA_URL(),ext:!!SUPPORT_WA},{label:"לאולמות ומפיקים",btn:onVenue}]],
    ["לפי אירוע",EVENT_LANDINGS.map(x=>({href:`/events/${x.slug}`,label:x.nav}))],
    ["מידע משפטי",legal],
  ];
  return(
    <footer style={{borderTop:"1px solid #EFE6F5",padding:"48px 6vw 0",background:"#F8F3FF",overflow:"hidden"}}>
      <div style={{maxWidth:1120,margin:"0 auto"}}>
        <div className="lp-foot-top" style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:40,marginBottom:40}}>
          <div className="lp-foot-mark" aria-hidden="true">Sidor-IL</div>
          <div style={{maxWidth:320}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
              <SidorLogo size={34} id="lpFootLogo"/>
              <span style={{fontWeight:900,fontSize:18}}>Sidor-IL</span>
            </div>
            <p style={{fontSize:14,color:LP.muted,lineHeight:1.8}}>פלטפורמה ישראלית לסידורי הושבה חכמים, אישורי הגעה והזמנות דיגיטליות. בנויה עבור זוגות, משפחות ומפיקי אירועים.</p>
            <InstallAppButton style={{marginTop:14,minHeight:44}}/>
          </div>
          {/* מפת אתר */}
          <nav aria-label="מפת אתר" className="lp-foot" style={{display:"flex",gap:"28px 48px",flexWrap:"wrap"}}>
            {cols.map(([head,links])=>(
              <div key={head}>
                <div style={{fontSize:14,fontWeight:900,marginBottom:14}}>{head}</div>
                <ul style={{listStyle:"none",margin:0,padding:0,display:"flex",flexDirection:"column",gap:9,fontSize:14}}>
                  {links.map(l=>(
                    <li key={l.label}>{l.btn
                      ?<button onClick={l.btn} style={{background:"none",border:"none",padding:0,color:LP.muted,fontSize:14,fontFamily:"inherit",cursor:"pointer",textAlign:"right"}}>{l.label}</button>
                      :<a href={l.href} onClick={l.onClick} {...(l.ext?{target:"_blank",rel:"noopener noreferrer"}:{})} style={{color:LP.muted,textDecoration:"none"}}>{l.label}</a>}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <div style={{fontSize:14,fontWeight:900,marginBottom:14}}>צור קשר</div>
              <div style={{display:"flex",flexDirection:"column",gap:9,fontSize:14,color:LP.muted}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><LpIcon name="pin" color={LP.rose} size={18}/>השושנים 30, נוף הגליל</div>
                {SUPPORT_WA&&<a href={LP_WA} target="_blank" rel="noopener noreferrer" style={{color:"#167A3E",textDecoration:"none",fontWeight:800}}><LpIcon name="msg" color="#167A3E" size={18}/>WhatsApp</a>}
                {SUPPORT_PHONE&&<a href={`tel:${SUPPORT_TEL}`} style={{textDecoration:"none"}}><LpIcon name="phone" color={LP.violet} size={18}/>{SUPPORT_PHONE}</a>}
                <a href="mailto:sidoril2026@gmail.com" style={{textDecoration:"none"}}><LpIcon name="mail" color={LP.coral} size={18}/>sidoril2026@gmail.com</a>
              </div>
            </div>
          </nav>
        </div>
        <div style={{borderTop:"1px solid #E9DFF3",paddingTop:20,paddingBottom:28,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,fontSize:13,color:LP.muted,alignItems:"center"}}>
          <span>© {new Date().getFullYear()} Sidor-IL · כל הזכויות שמורות</span>
          <span className="lp-foot" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            {legal.map(l=><a key={l.label} href={l.href} style={{textDecoration:"none"}}>{l.label}</a>)}
            <button type="button" onClick={openCookieSettings} style={{background:"none",border:"none",padding:0,font:"inherit",color:"inherit",cursor:"pointer"}}>הגדרות עוגיות</button>
          </span>
          <span>🇮🇱 מערכת ישראלית · נבנתה עם ❤️</span>
        </div>
      </div>
    </footer>
  );
}
// מעטפת לכל דף ציבורי: התפריט הצף, תפריט הנייד, התוכן, התחתית וכפתור הוואטסאפ
export function PublicPage({ pageKey, children, actions }) {
  const [scrolled,setScrolled]=useState(false),[off,setOff]=useState(false),[menu,setMenu]=useState(false);
  const [motion]=useState(lpMotionOK);
  const rootRef=useRef(null),menuRef=useRef(null),burgerRef=useRef(null);
  useEffect(()=>{
    const fn=()=>{setScrolled(window.scrollY>40);setOff(window.scrollY>window.innerHeight*.7);};
    fn();
    window.addEventListener("scroll",fn,{passive:true});
    return()=>window.removeEventListener("scroll",fn);
  },[]);
  useLpReveal(rootRef,pageKey);
  useEffect(()=>{
    if(!menu)return;
    document.body.style.overflow="hidden";
    const t=setTimeout(()=>menuRef.current?.querySelector("a,button")?.focus(),80);
    const esc=e=>{if(e.key==="Escape")setMenu(false);};
    window.addEventListener("keydown",esc);
    return()=>{clearTimeout(t);document.body.style.overflow="";window.removeEventListener("keydown",esc);burgerRef.current?.focus({preventScroll:true});};
  },[menu]);
  const trapTab=e=>{
    if(e.key!=="Tab"||!menuRef.current)return;
    const f=[...menuRef.current.querySelectorAll("a,button")];if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  };
  const toHome=id=>e=>{e.preventDefault();setMenu(false);goLanding(id||undefined);};
  const auth=m=>()=>{setMenu(false);goLanding(null,m);};
  return(
    <div ref={rootRef} className={`lp${motion?" lp-motion":""}${off?" lp-hero-off":""}`} dir="rtl" lang="he" style={{fontFamily:"'Heebo',sans-serif",background:LP.cream,color:LP.ink,minHeight:"100vh",overflowX:"hidden"}}>
      <style>{LANDING_CSS}</style>
      <a href="#main" className="lp-skip" onClick={e=>{e.preventDefault();document.getElementById("main")?.focus();}}>דלג לתוכן הראשי</a>
      <nav className="lp-nav" style={{position:"fixed",top:12,right:"3vw",left:"3vw",zIndex:100,height:64,display:"flex",alignItems:"center",padding:"0 18px 0 12px",gap:12,borderRadius:100,
        backgroundColor:scrolled?"rgba(255,255,255,.97)":"rgba(255,255,255,0)",boxShadow:scrolled?"0 16px 40px -20px rgba(60,35,110,.45)":"0 0 0 rgba(0,0,0,0)"}}>
        <a href="/" onClick={toHome(null)} style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none",flexShrink:0,color:LP.ink}}>
          <SidorLogo size={40} id="navLogo"/>
          <span style={{fontWeight:900,fontSize:21,letterSpacing:"-.02em"}}>Sidor-IL</span>
        </a>
        <div className="lp-hide-sm" style={{display:"flex",gap:2,marginRight:14}}>
          {LP_NAV.map(([id,l])=><a key={id} href={"/#"+id} className="lp-nav-link" onClick={toHome(id)}>{l}</a>)}
        </div>
        <div style={{flex:1}}/>
        {actions?actions(false):<>
        <button className="lp-btn lp-navbtn lp-ghost" onClick={auth("login")} style={{padding:"9px 20px",fontSize:14,minHeight:44}}>כניסה</button>
        <button className="lp-btn lp-navbtn lp-hide-xs lp-primary" onClick={auth("register")} style={{padding:"10px 20px",fontSize:14,minHeight:44}}><span className="lp-lg">התחילו להושיב</span><span className="lp-sm">התחילו</span></button>
        </>}
        <button ref={burgerRef} type="button" className="lp-burger" aria-label="פתיחת התפריט" aria-expanded={menu} aria-controls="lp-menu" onClick={()=>setMenu(true)}><span/><span/><span/></button>
      </nav>
      <div className={`lp-menu${menu?" open":""}`} onClick={e=>{if(e.target===e.currentTarget)setMenu(false);}}>
        <div id="lp-menu" ref={menuRef} className="lp-menu-sheet" role="dialog" aria-modal="true" aria-label="תפריט האתר" onKeyDown={trapTab}>
          <div className="lp-menu-head">
            <span style={{display:"flex",alignItems:"center",gap:10,fontWeight:900,fontSize:20}}><SidorLogo size={36} id="pubMenuLogo"/>Sidor-IL</span>
            <button type="button" className="lp-menu-x" aria-label="סגירת התפריט" onClick={()=>setMenu(false)}>✕</button>
          </div>
          <ul>
            {LP_NAV.map(([id,l],i)=>(
              <li key={id} style={{"--d":`${(.08+i*.05).toFixed(2)}s`}}><a href={"/#"+id} onClick={toHome(id)}>{l}</a></li>
            ))}
            <li style={{"--d":".33s"}}><a href="/guides">מדריכים וטיפים</a></li>
          </ul>
          {actions?<div className="lp-menu-cta">{actions(true)}</div>:<>
          <div className="lp-menu-cta">
            <button type="button" className="lp-btn lp-primary" onClick={auth("register")}>התחילו להושיב</button>
            <button type="button" className="lp-btn lp-ghost" onClick={auth("login")}>כניסה לחשבון</button>
          </div>
          <div className="lp-menu-more">
            <button type="button" className="lp-hero-link" onClick={openJoin}>ספקים ומפיקים: הצטרפות</button>
          </div>
          </>}
        </div>
      </div>
      <main id="main" tabIndex={-1} style={{outline:"none"}}>{children}</main>
      <SiteFooter onAuth={m=>goLanding(null,m)} onVenue={()=>goLanding(null,"venue")}/>
      <LpWaFab/>
    </div>
  );
}
const LpHomeCrumb=({onClick})=><a href="/" onClick={e=>{e.preventDefault();onClick?onClick():goLanding();}}>דף הבית</a>;
const LP_SEP=<span aria-hidden="true">›</span>;

// ─── דף הבית: מערכת התנועה ───
// אלמנטים עם data-reveal נכנסים בעדינות כשמגיעים אליהם (פעם אחת), ולולאות דקורטיביות (data-loop) רצות רק כשהן על המסך.
// עם "תנועה מופחתת" במכשיר — אין מצב מוסתר בכלל, והכל פשוט מוצג. "עצור אנימציות" בתפריט הנגישות עוצר הכל
export const lpMotionOK=()=>{try{return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch{return false;}};
function useLpReveal(rootRef,dep){
  useEffect(()=>{
    const root=rootRef.current;
    if(!root||!root.classList.contains("lp-motion"))return;
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{rootMargin:"0px 0px -10% 0px"});
    root.querySelectorAll("[data-reveal]:not(.in)").forEach(el=>io.observe(el));
    const lo=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle("run",e.isIntersecting)));
    root.querySelectorAll("[data-loop]").forEach(el=>lo.observe(el));
    // רשת ביטחון: אחרי גלילה (או קפיצה לקישור) — כל מה שכבר מעל תחתית המסך מוצג, גם אם ה-observer התעכב
    let t=0;
    const sweep=()=>{
      t=0;const vh=window.innerHeight;
      const hit=[...root.querySelectorAll("[data-reveal]:not(.in)")].filter(el=>el.getBoundingClientRect().top<vh*.95);
      hit.forEach(el=>{el.classList.add("in");io.unobserve(el);});
    };
    const onScroll=()=>{if(!t)t=setTimeout(sweep,180);};
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>{io.disconnect();lo.disconnect();window.removeEventListener("scroll",onScroll);clearTimeout(t);};
  },[dep]);
}
// אורות רכים שמרחפים לאט מעל התמונה, כמו נורות בערב. דקורטיבי בלבד
const LP_BOKEH=[[8,72,90,"255,214,150",.5,9,0,20],[18,40,40,"255,170,200",.55,7,1.2,-14],[27,84,120,"200,170,255",.3,11,2.4,26],[38,62,28,"255,230,170",.75,6,.6,-10],[46,30,64,"255,190,210",.38,10,3.1,18],[57,78,46,"255,214,150",.55,8,1.8,-22],[66,48,110,"190,160,255",.28,12,.3,14],[74,22,34,"255,240,200",.7,7,2.7,-12],[83,68,70,"255,170,200",.42,9,1,24],[92,40,26,"255,226,160",.75,6,3.6,-8],[4,28,30,"255,236,190",.65,8,4.2,10],[61,92,54,"210,180,255",.36,10,5,-16]];
const LpBokeh=({n=12})=>(
  <div className="lp-bokeh" aria-hidden="true">
    {LP_BOKEH.slice(0,n).map(([l,t,s,c,o,d,dl,dx],i)=>(
      <i key={i} style={{left:`${l}%`,top:`${t}%`,width:s,height:s,"--c":`rgba(${c},.95)`,"--o":o,"--t":`${d}s`,"--dl":`${dl}s`,"--dx":`${dx}px`}}/>
    ))}
  </div>
);
const LP_RIBBON=["חתונות","בר מצווה","בת מצווה","בריתות","ערבי חברה","כנסים"];
const LP_NAV=[["how","איך זה עובד"],["features","יכולות"],["vendors","ספקים ומחירים"],["events","סוגי אירועים"],["pricing","מחירים"]];

// לפני / אחרי: האקסל שכולם מכירים מול מפת האולם. גוררים את הידית (עכבר או אצבע) או משתמשים בחצים במקלדת.
// המיקום נכתב ישר ל-DOM (בלי רינדור בכל תזוזה). בגלילה אנכית בנייד המסך ממשיך לגלול כרגיל
const LP_TOUR=[
  {id:"home",tab:"מסך האירוע",t:"כל האירוע במבט אחד",d:"ספירה לאחור, מצב אישורי ההגעה וקיצור לכל כלי, ישר כשנכנסים.",pts:["כמה אישרו, כמה ממתינים וכמה לא מגיעים","הזמנה דיגיטלית עם התמונה שבחרתם","השלב הבא שכדאי לעשות"]},
  {id:"guests",tab:"ניהול אורחים",t:"רשימת מוזמנים אחת, מסודרת",d:"מייבאים מאקסל או מוסיפים ידנית, ועורכים כל שדה ישר בטבלה.",pts:["סינון לפי קרבה, שולחן, צפייה בהזמנה ושפה","שפת ההודעות לכל אורח בנפרד","מגיעים, ממתינים ולא מגיעים בצבעים"]},
  {id:"seating",tab:"מפת אולם",t:"מפת האולם שלכם",d:"גוררים אורחים לשולחנות ורואים מיד כמה מקומות נשארו בכל שולחן.",pts:["שולחנות עגולים, מרובעים ושולחן אבירים","הושבה אוטומטית בלחיצה","מסך מלא לעבודה נוחה"]},
  {id:"sms",tab:"SMS",t:"הזמנות ותזכורות ב-SMS",d:"בוחרים נוסח, רואים איך ההודעה תיראה בטלפון ושולחים לכולם או רק למי שעוד לא ענה.",pts:["3 סגנונות נוסח ב-6 שפות","כל אורח מקבל את ההודעה בשפה שלו","תצוגה מקדימה לפני שליחה"]},
  {id:"whatsapp",tab:"WhatsApp",t:"הודעות WhatsApp אישיות",d:"אותו נוסח אישי, עם שם האורח וקישור להזמנה, ישר לוואטסאפ.",pts:["שליחה לקבוצות לפי שפה","קישור אישי לאישור הגעה","מעקב מי קיבל את ההודעה"]},
  {id:"budget",tab:"תקציב",t:"התקציב בשליטה",d:"כל הוצאה, מקדמה ויתרה לתשלום במקום אחד, לפי קטגוריות.",pts:["כמה שולם וכמה נשאר","לאן הולך הכסף, לפי קטגוריה","ייצוא לאקסל"]},
  {id:"gifts",tab:"מתנות",t:"רישום מתנות",d:"רושמים מה כל אורח נתן, ורואים את הסכום הכולל בסוף הערב.",pts:["סכום ואמצעי תשלום לכל אורח","סינון לפי מי שנרשם ומי שעוד לא","ייצוא לאקסל"]},
  {id:"tasks",tab:"משימות",t:"רשימת משימות עד היום הגדול",d:"משימות לפי שלבים, עם תאריכים, כדי ששום דבר לא יישכח.",pts:["סימון משימה שבוצעה","תאריך יעד לכל משימה","אחוז התקדמות"]},
  {id:"details",tab:"פרטי האירוע",t:"פרטי האירוע והעיצוב",d:"שמות, תאריך, מקום ועיצוב ההזמנה הדיגיטלית, מקום אחד לכל ההגדרות.",pts:["סגנונות עיצוב להזמנה","שיתוף ניהול האירוע עם בן או בת הזוג","תמונת פתיחה משלכם"]},
  {id:"vendors",tab:"ספקים",t:"ספקים ומחירים מהקהילה",d:"מחירים אמיתיים ששילמו זוגות אחרים, לפי סוג ספק ואזור.",pts:["סינון לפי תחום ואזור","מחירים שדווחו על ידי משתמשים","פרטי הספק במקום אחד"]},
];
// הצצה למערכת: כרטיסים צבעוניים שנערמים אחד על השני בגלילה (sticky), מסך אמיתי בכל כרטיס
const STK_TONES=[
  {a:"#FFE8F1",b:"#FCCFE2",t:"#B0306B"},
  {a:"#EFE7FF",b:"#DCCBFF",t:"#6339CC"},
  {a:"#FFEDE4",b:"#FFD3BF",t:"#A8441C"},
  {a:"#E0F6EC",b:"#C2EBD8",t:"#1A6F4C"},
  {a:"#FFF3DA",b:"#FBE0A8",t:"#835500"},
];
// "ככה זה נראה מבפנים": 2 שורות של קוביות, בכל שורה קוביה אחת גדלה ומציגה את המסך, ובתורות הבאה בתור גדלה
const TOUR_IC={home:"🏠",guests:"👥",seating:"🪑",sms:"📱",whatsapp:"💬",budget:"💰",gifts:"🎁",tasks:"✅",details:"📋",vendors:"💡"};
// שורה אחת רגועה של 5 קוביות: הפעילה גדלה ומציגה את המסך וההסבר, השאר קוביות קטנות עם אייקון ושם
const TOUR_PICK=["home","guests","seating","sms","budget"];
const TOUR_CSS=`
  .lp-pk{display:flex;gap:16px;align-items:flex-start;--c:clamp(128px,13.4vw,160px)}
  .lp-pk-t{position:relative;flex:0 0 auto;width:var(--c);height:var(--c);border:none;margin:0;padding:0;border-radius:32px;overflow:hidden;cursor:pointer;text-align:right;font-family:inherit;color:#2B1D3F;background:#fff;box-shadow:0 18px 40px -28px rgba(60,35,110,.55),inset 0 0 0 1.5px #EFE6F7;transition:width 600ms cubic-bezier(0.77,0,0.175,1),height 600ms cubic-bezier(0.77,0,0.175,1),box-shadow 300ms ease}
  .lp-pk-t.on{width:calc(100% - 4 * var(--c) - 64px);height:416px;box-shadow:0 34px 70px -38px rgba(60,35,110,.6),inset 0 0 0 1.5px #EFE6F7}
  .lp-pk-t:focus-visible{outline:3px solid #9B6BFF;outline-offset:3px}
  @media(hover:hover) and (pointer:fine){.lp-pk-t:not(.on):hover{box-shadow:0 24px 44px -26px rgba(60,35,110,.6),inset 0 0 0 1.5px #E2D4F5}}
  .lp-pk-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:12px;text-align:center;transition:opacity 220ms ease}
  .lp-pk-face i{font-style:normal;width:60px;height:60px;border-radius:20px;background:linear-gradient(160deg,var(--a),var(--b));display:flex;align-items:center;justify-content:center;font-size:27px}
  .lp-pk-face b{font:700 16px/1.25 'Fredoka','Heebo',sans-serif;color:#2B1D3F}
  .lp-pk-t.on .lp-pk-face{opacity:0;pointer-events:none}
  .lp-pk-in{position:absolute;inset:0;display:flex;flex-direction:column;padding:14px;opacity:0;transition:opacity 220ms ease;min-width:340px}
  .lp-pk-t.on .lp-pk-in{opacity:1;transition-delay:320ms}
  .lp-pk-pic{display:block;border-radius:22px;padding:9px;background:linear-gradient(160deg,var(--a),var(--b))}
  .lp-pk-pic img{display:block;width:100%;height:auto;aspect-ratio:1440/900;border-radius:13px;background:#fff;box-shadow:0 14px 28px -18px rgba(43,29,63,.6)}
  .lp-pk-txt{display:block;padding:14px 8px 0}
  .lp-pk-tag{display:flex;align-items:center;gap:8px;font:700 14px 'Fredoka','Heebo',sans-serif;color:var(--t)}
  .lp-pk-h{display:block;font:700 21px/1.25 'Fredoka','Heebo',sans-serif;color:#2B1D3F;margin:5px 0 4px}
  .lp-pk-p{display:block;font-size:14.5px;line-height:1.6;color:#3A2F50;font-weight:600}
  .lp-pk-bar{position:absolute;top:0;right:28px;left:28px;height:3px;border-radius:0 0 3px 3px;overflow:hidden;opacity:0;z-index:2}
  .lp-pk-bar u{display:block;height:100%;width:100%;background:var(--t);transform-origin:right;transform:scaleX(0)}
  .lp-pk.auto .lp-pk-t.on .lp-pk-bar{opacity:1}
  .lp-pk.auto .lp-pk-t.on .lp-pk-bar u{animation:lpPkBar var(--dur) linear both}
  @keyframes lpPkBar{to{transform:scaleX(1)}}
  .lp-pk-cap{font-size:14px;color:#5F5675;margin-top:18px;text-align:center}
  .lp-devstrip{margin-top:30px;background:#fff;border-radius:28px;padding:20px 24px;display:flex;align-items:center;gap:18px 28px;flex-wrap:wrap;box-shadow:0 24px 50px -38px rgba(60,35,110,.55),inset 0 0 0 1px #EFE6F7}
  .lp-devstrip-h{font:700 19px/1.2 'Fredoka','Heebo',sans-serif;color:#2B1D3F;flex:0 0 auto}
  .lp-devstrip ul{list-style:none;margin:0;padding:0;display:flex;gap:14px 26px;flex:1 1 520px;flex-wrap:wrap}
  .lp-devstrip li{display:flex;gap:10px;align-items:flex-start;flex:1 1 180px;font-size:13.5px;color:#5F5675;line-height:1.5}
  .lp-devstrip li i{font-style:normal;font-size:20px;line-height:1}
  .lp-devstrip li b{display:block;font:700 15px 'Fredoka','Heebo',sans-serif;color:#2B1D3F;margin-bottom:2px}
  @media(max-width:700px){.lp-devstrip{padding:18px 16px}.lp-devstrip-h{flex-basis:100%}}
  /* מחשב: כל הקוביות בגובה המסך הפתוח (עמודות צרות לצדו) — בלי שטח ריק מתחת לקוביות הקטנות */
  @media(min-width:901px){
    .lp-pk-t{height:416px;background:linear-gradient(180deg,#fff 30%,var(--a))}
    .lp-pk-t.on{background:#fff}
  }
  @media(prefers-reduced-motion:reduce){.lp-pk-t,.lp-pk-in,.lp-pk-face{transition-duration:1ms!important}.lp-pk-bar{display:none}}
  @media(max-width:900px){
    .lp-pk{flex-direction:column;gap:10px}
    .lp-pk-t{width:100%;height:72px;border-radius:24px}
    .lp-pk-t.on{width:100%;height:362px}
    .lp-pk-face{flex-direction:row;justify-content:flex-start;padding:0 14px}
    .lp-pk-face i{width:46px;height:46px;font-size:22px;border-radius:16px}
    .lp-pk-in{min-width:0;padding:12px}
    .lp-pk-h{font-size:18px}
    .lp-pk-p{font-size:14px}
  }
`;
function ProductTour(){
  const items=TOUR_PICK.map(id=>LP_TOUR.find(x=>x.id===id)).filter(Boolean);
  const [act,setAct]=useState(0);
  const [auto,setAuto]=useState(()=>lpMotionOK());
  const [hold,setHold]=useState(false),[seen,setSeen]=useState(false);
  const boxRef=useRef(null);
  const DUR=2800;
  useEffect(()=>{const el=boxRef.current;if(!el||!window.IntersectionObserver)return;const io=new IntersectionObserver(([e])=>setSeen(e.isIntersecting),{threshold:.3});io.observe(el);return()=>io.disconnect();},[]);
  useEffect(()=>{
    if(!auto||hold||!seen)return;
    const iv=setInterval(()=>setAct(a=>(a+1)%items.length),DUR);
    return()=>clearInterval(iv);
  },[auto,hold,seen,items.length]);
  return(<div ref={boxRef}>
    <style>{TOUR_CSS}</style>
    <div className={`lp-pk${auto&&!hold&&seen?" auto":""}`} style={{"--dur":`${DUR}ms`}}
      onPointerEnter={e=>{if(e.pointerType==="mouse")setHold(true);}} onPointerLeave={()=>setHold(false)}
      onFocus={()=>setHold(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHold(false);}}>
      {items.map((x,k)=>{const on=act===k;const tone=STK_TONES[k%STK_TONES.length];return(
        <button key={x.id} type="button" className={`lp-pk-t${on?" on":""}`} aria-expanded={on} aria-label={`${x.tab}: ${x.t}`}
          style={{"--a":tone.a,"--b":tone.b,"--t":tone.t}}
          onClick={()=>{setAuto(false);setAct(k);}} onPointerEnter={e=>{if(e.pointerType==="mouse")setAct(k);}}>
          <span className="lp-pk-bar" aria-hidden="true"><u key={on?`on${act}`:"off"}/></span>
          <span className="lp-pk-face" aria-hidden="true"><i>{TOUR_IC[x.id]}</i><b>{x.tab}</b></span>
          <span className="lp-pk-in">
            <span className="lp-pk-pic"><img sizes="(max-width:700px) 80vw, 380px" srcSet={tourSrcSet(x.id)} src={`/landing/tour/${x.id}-800.jpg`} alt={`צילום מסך: ${x.tab} ב-Sidor-IL`} width="1440" height="900" loading="lazy" decoding="async"/></span>
            <span className="lp-pk-txt">
              <span className="lp-pk-tag"><span aria-hidden="true">{TOUR_IC[x.id]}</span>{x.tab}</span>
              <span className="lp-pk-h">{x.t}</span>
              <span className="lp-pk-p">{x.d}</span>
            </span>
          </span>
        </button>);})}
    </div>
    <div className="lp-pk-cap">מסכים אמיתיים מהמערכת, עם נתוני דוגמה</div>
    {/* היה מקטע נפרד "האירוע איתכם בכל מכשיר" — עכשיו פס אחד כאן, כדי שהדף יהיה קצר יותר */}
    <div className="lp-devstrip">
      <div className="lp-devstrip-h">האירוע איתכם בכל מכשיר</div>
      <ul>
        <li><i aria-hidden="true">📲</i><span><b>אפליקציה ישר מהאתר</b>בלי חנות אפליקציות, באייפון, באנדרואיד ובמחשב</span></li>
        <li><i aria-hidden="true">🔄</i><span><b>הכל נשמר בענן</b>אותו אירוע, מעודכן, בכל מקום שתתחברו</span></li>
        <li><i aria-hidden="true">👫</i><span><b>ניהול בשניים</b>משתפים את האירוע ועובדים עליו יחד</span></li>
      </ul>
      <InstallAppButton label="📲 הורדת האפליקציה" style={{background:"#2B1D3F",color:"#fff",border:"none",borderRadius:999,minHeight:48,padding:"0 22px",fontFamily:"'Fredoka','Heebo',sans-serif",fontSize:15,whiteSpace:"nowrap"}}/>
    </div>
  </div>);
}

// ספקים ומחירים: כותרת במרכז ותמונות של סוגי ספקים מסביב
const VR_U=id=>`/img/u/${id}_480x480.webp`;
const VR_TILES=[
  {id:"1519225421980-715cb0215aed",l:"אולמות וגנים",p:"t1"},
  {id:"1414235077428-338989a2e8c0",l:"קייטרינג",p:"t2"},
  {id:"1546805022-9c4e4ab7e3a3",l:"צלמים",p:"m1"},
  {id:"1571266028243-d220c6a7edbf",l:"תקליטנים",p:"m2"},
  {id:"1521543832500-49e69fb2bea2",l:"עיצוב ופרחים",p:"b1"},
  {id:"1535254973040-607b474cb50d",l:"עוגות וקינוחים",p:"b2"},
];
const VR_CSS=`
  .lp-vr{position:relative;min-height:1030px;display:flex;align-items:center;justify-content:center}
  .lp-vr-hall{width:100%;max-width:420px;background:#fff;border-radius:26px;padding:16px 18px;margin-bottom:22px;text-align:right;box-shadow:0 26px 54px -30px rgba(60,35,110,.6),0 0 0 6px rgba(255,255,255,.6)}
  .lp-vr-hall-top{display:flex;justify-content:space-between;align-items:center;font:800 15px 'Fredoka','Heebo',sans-serif;color:#2B1D3F;margin-bottom:10px}
  .lp-vr-hall-top small{font:700 12px 'Heebo',sans-serif;color:#6B5F80;background:#F4EEFF;border-radius:999px;padding:3px 9px}
  .lp-vr-hall-mid{display:flex;align-items:center;gap:14px;margin-bottom:12px}
  .lp-vr-hall-mid b{font:900 46px/1 'Fredoka','Heebo',sans-serif;background:linear-gradient(120deg,#F0609E,#9B6BFF);-webkit-background-clip:text;background-clip:text;color:transparent}
  .lp-vr-hall-mid span{font-size:15px;font-weight:700;color:#2B1D3F;line-height:1.4}
  .lp-vr-hall-mid small{display:block;font-size:13px;font-weight:600;color:#6B5F80}
  .lp-vr-days{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
  .lp-vr-days span{background:#F7F2FF;border-radius:14px;padding:8px 6px;text-align:center;font-size:13px;font-weight:700;color:#5B3C8C}
  .lp-vr-days b{display:block;font:900 18px 'Fredoka','Heebo',sans-serif;color:#2B1D3F}
  .lp-vr-tip{background:#FFF4F7;border-radius:14px;padding:10px 12px;font-size:13.5px;line-height:1.55;color:#7A1F48;font-weight:600}
  .lp-vr-c{position:relative;z-index:2;max-width:500px;text-align:center;display:flex;flex-direction:column;align-items:center}
  .lp-vr-c h2{margin:0 0 14px}
  .lp-vr-c p{font-size:18px;line-height:1.7;color:#3A2F50;margin:0 0 22px}
  .lp-vr-price{display:flex;align-items:center;gap:14px;background:#fff;border-radius:22px;padding:12px 18px;margin-bottom:22px;box-shadow:0 18px 40px -26px rgba(60,35,110,.55);text-align:right}
  .lp-vr-price b{font:900 34px/1 'Fredoka','Heebo',sans-serif;background:linear-gradient(120deg,#F0609E,#9B6BFF);-webkit-background-clip:text;background-clip:text;color:transparent}
  .lp-vr-price span{font-size:14px;line-height:1.45;color:#3A2F50}
  .lp-vr-price small{display:block;font-size:12px;color:#6B5F80}
  .lp-vr-t{position:absolute;z-index:1;width:clamp(160px,14.5vw,212px);aspect-ratio:1;border:none;padding:0;cursor:pointer;border-radius:30px;overflow:hidden;background:#EFE6F5;box-shadow:0 30px 60px -32px rgba(43,29,63,.65),0 0 0 6px #fff;rotate:var(--r);transition:rotate 220ms cubic-bezier(0.23,1,0.32,1),scale 220ms cubic-bezier(0.23,1,0.32,1)}
  .lp-vr-t img{width:100%;height:100%;object-fit:cover;display:block}
  .lp-vr-t::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 52%,rgba(30,14,50,.78) 100%)}
  .lp-vr-t span{position:absolute;z-index:1;bottom:14px;right:16px;left:16px;text-align:right;color:#fff;font:800 17px/1.2 'Fredoka','Heebo',sans-serif}
  .lp-vr-t:focus-visible{outline:3px solid #9B6BFF;outline-offset:6px}
  @media(hover:hover) and (pointer:fine){.lp-vr-t:hover{rotate:0deg;scale:1.04}}
  .lp-vr-t1{top:0;right:20%;--r:-4deg}.lp-vr-t2{top:0;left:20%;--r:4deg}
  .lp-vr-m1{top:50%;right:0;translate:0 -50%;--r:3deg}.lp-vr-m2{top:50%;left:0;translate:0 -50%;--r:-3deg}
  .lp-vr-b1{bottom:0;right:20%;--r:4deg}.lp-vr-b2{bottom:0;left:20%;--r:-4deg}
  @keyframes lpVrBob{50%{transform:translateY(-8px)}}
  .lp-motion .lp-vr-t{animation:lpVrBob 7s ease-in-out infinite;animation-delay:calc(var(--i) * -1.1s)}
  @media(prefers-reduced-motion:reduce){.lp-motion .lp-vr-t{animation:none}}
  .lp-vr-note{font-size:13px;color:#6B5F80;margin-top:12px}
  @media(max-width:1100px){.lp-vr-t1,.lp-vr-b1{right:16%}.lp-vr-t2,.lp-vr-b2{left:16%}}
  @media(max-width:900px){
    .lp-vr{min-height:0;flex-direction:column;gap:28px}
    .lp-vr-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%}
    .lp-vr-t{position:relative;inset:auto!important;translate:none!important;width:100%;border-radius:20px;box-shadow:0 18px 34px -22px rgba(43,29,63,.6),0 0 0 4px #fff}
    .lp-vr-t span{font-size:13px;bottom:9px;right:10px;left:10px}
    .lp-vr-c p{font-size:16px}
  }
`;
function VendorRing({onOpen,cta}){
  return(<>
    <style>{VR_CSS}</style>
    <div className="lp-vr">
      <div className="lp-vr-c">
        <h2 className="lp-h2">כמה שילמו זוגות אחרים?</h2>
        <p>מחירי מנות באולמות, ומחירים והמלצות על צלמים, תקליטנים, פרחים ועוד. משווים לפני שסוגרים.</p>
        <div className="lp-vr-hall" aria-label="דוגמה: מחיר מנה באולם">
          <div className="lp-vr-hall-top"><span>🏛️ מחיר מנה באולם</span><small>דוגמה להמחשה</small></div>
          <div className="lp-vr-hall-mid"><b className="lp-num">₪298</b><span>המחיר המקובל<small>טווח ₪265–345 · 4 דיווחים</small></span></div>
          <div className="lp-vr-days"><span>א׳–ד׳ <b>₪265</b></span><span>חמישי <b>₪285</b></span><span>שישי <b>₪345</b></span></div>
          <div className="lp-vr-tip">💡 ההצעה שלכם גבוהה ב-14% מהמקובל? בדקו אם יום אחר זול יותר.</div>
        </div>
        <button onClick={onOpen} className="lp-btn lp-primary" style={{padding:"15px 32px",fontSize:16}}>{cta}</button>
      </div>
      <div className="lp-vr-tiles">
        {VR_TILES.map((t,i)=>(
          <button key={t.id} type="button" className={`lp-vr-t lp-vr-${t.p}`} style={{"--i":i}} onClick={onOpen} aria-label={`${t.l}: מחירים והמלצות`}>
            <img src={VR_U(t.id)} alt="" loading="lazy" decoding="async" width="240" height="240"/><span>{t.l}</span>
          </button>
        ))}
      </div>
    </div>
  </>);
}

// "כל מה שצריך להושבה מושלמת": מפת אולם חיה במרכז, ו-6 כרטיסים בקשת מסביב עם הנפשות שחוזרות בלולאה
const FA_CSS=`
  .lp-fa-sec{background:linear-gradient(180deg,#D8CBFF 0%,#EADFFF 46%,#FFE1ED 100%)}
  .lp-fa{position:relative;min-height:985px}
  .lp-fa-c{position:relative;z-index:1;max-width:520px;margin:0 auto;text-align:center;display:flex;flex-direction:column;align-items:center}
  .lp-fa-c .lp-h2{font-size:clamp(34px,3.7vw,52px);margin-bottom:12px}
  .lp-fa-c > p{font-size:18px;line-height:1.65;color:#3A2F50;margin:0 0 20px}
  .lp-fa-map{width:100%;max-width:410px;background:#fff;border-radius:32px;padding:12px;box-shadow:0 36px 70px -38px rgba(60,35,110,.6),0 0 0 8px rgba(255,255,255,.5)}
  .lp-fa-map svg{display:block;width:100%;height:auto;border-radius:22px;background:radial-gradient(circle at 50% 40%,#FFF1F7,#F4EDFF 75%)}
  .lp-fa-mapcap{margin:16px 0 18px;max-width:420px;font-size:15.5px;line-height:1.6;color:#3A2F50}
  .lp-fa-mapcap b{display:block;font:900 20px/1.3 'Fredoka','Heebo',sans-serif;color:#2B1D3F;margin-bottom:2px}
  .lp-fa-card{position:absolute;width:268px;background:#fff;border-radius:28px;padding:12px 12px 18px;text-align:right;box-shadow:0 28px 56px -32px rgba(60,35,110,.6)}
  .lp-fa-p1{top:0;right:0}.lp-fa-p2{top:0;left:0}
  .lp-fa-p3{top:350px;right:3%}.lp-fa-p4{top:350px;left:3%}
  .lp-fa-p5{top:690px;right:23%}.lp-fa-p6{top:690px;left:23%}
  .lp-fa-art{position:relative;height:122px;border-radius:20px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--bg);margin-bottom:14px}
  .lp-fa-h{display:flex;align-items:center;gap:10px;padding:0 6px}
  .lp-fa-h .lp-circ{flex-shrink:0}
  .lp-fa-h h3{font:900 18px/1.25 'Fredoka','Heebo',sans-serif;color:#2B1D3F;margin:0}
  .lp-fa-h small{display:block;font-size:13px;font-weight:800;color:color-mix(in srgb,var(--t) 78%,#2B1D3F)}
  .lp-fa-card p{font-size:14.5px;line-height:1.6;color:#3E3555;margin:8px 6px 0}
  .lp-fa-ch{transform-box:fill-box;transform-origin:center}
  .lp-fa-bub{background:#fff;border:1px solid #E6DAFF;border-radius:14px 14px 14px 4px;padding:7px 11px;font-size:12px;font-weight:700;color:#2B1D3F;box-shadow:0 8px 18px -12px rgba(155,107,255,.6)}
  .lp-fa-slot{display:grid;justify-items:end}.lp-fa-slot>*{grid-area:1/1}
  .lp-fa-typing{display:none;align-items:center;gap:4px;background:#fff;border:1px solid #E6DAFF;border-radius:14px 14px 4px 14px;padding:10px 12px}
  .lp-fa-typing i{width:6px;height:6px;border-radius:50%;background:#9B6BFF}
  .lp-fa-rep{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(120deg,#9B6BFF,#F0609E);color:#fff;border-radius:14px 14px 4px 14px;padding:7px 11px;font-size:12px;font-weight:800}
  .lp-fa-chip{display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:100px;padding:5px 11px;font-size:12px;font-weight:800;color:#2B1D3F;box-shadow:0 6px 14px -10px rgba(60,35,110,.6)}
  .lp-fa-chip i{width:9px;height:9px;border-radius:50%;background:var(--c)}
  .lp-fa-wa{background:#fff;border-radius:16px 16px 4px 16px;padding:9px 12px;max-width:220px;font-size:12px;line-height:1.55;color:#2B1D3F;border:1px solid #CFEFDB;box-shadow:0 10px 22px -14px rgba(31,168,85,.6);transform-origin:bottom right}
  .lp-fa-wa em{font-style:normal;display:block;text-align:left;font-size:11px;color:#625B73}
  .lp-fa-sc{width:92px;background:#fff;border-radius:12px;padding:9px 8px;text-align:center;border:1px solid #F3E6C8;box-shadow:0 12px 22px -14px rgba(232,176,74,.8);rotate:var(--r)}
  .lp-fa-sc span{display:block;font-size:10px;font-weight:800;color:#6B5F80}
  .lp-fa-sc b{display:block;font:900 26px/1.1 'Fredoka','Heebo',sans-serif;color:var(--c)}
  .lp-fa-sc small{display:block;font-size:10.5px;font-weight:800;color:#2B1D3F}
  .lp-fa-xl{display:flex;align-items:center;gap:12px;direction:ltr}
  .lp-fa-sheet{width:54px;height:66px;border-radius:9px;background:#fff;border:1px solid #BFE3CF;display:grid;grid-template-rows:14px repeat(3,1fr);overflow:hidden;box-shadow:0 10px 18px -12px rgba(31,122,77,.7)}
  .lp-fa-sheet i{border-bottom:1px solid #DCEFE4}.lp-fa-sheet i:first-child{background:#1F7A4D;border:0}
  .lp-fa-rows{display:grid;gap:5px;direction:rtl}
  .lp-fa-rows span{background:#fff;border-radius:9px;padding:4px 10px;font-size:11.5px;font-weight:800;color:#2B1D3F;box-shadow:0 6px 14px -10px rgba(31,122,77,.7)}
  .lp-fa-rows span::after{content:" ✓";color:#1F7A4D}

  @keyframes lpFaFill{0%{opacity:0;transform:scale(.3)}5%{opacity:1;transform:scale(1)}84%{opacity:1;transform:scale(1)}92%,100%{opacity:0;transform:scale(1)}}
  @keyframes lpFaA1{0%{opacity:0;transform:translateY(6px)}6%,88%{opacity:1;transform:none}95%,100%{opacity:0;transform:none}}
  @keyframes lpFaTy{0%,14%{opacity:0}17%,34%{opacity:1}37%,100%{opacity:0}}
  @keyframes lpFaRep{0%,36%{opacity:0;transform:scale(.85)}41%,88%{opacity:1;transform:scale(1)}95%,100%{opacity:0;transform:scale(1)}}
  @keyframes lpFaDot{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes lpFaPop{0%{opacity:0;transform:scale(.6)}8%,84%{opacity:1;transform:scale(1)}93%,100%{opacity:0;transform:scale(1)}}
  @keyframes lpFaRing{0%{stroke-dashoffset:163}35%,84%{stroke-dashoffset:41}100%{stroke-dashoffset:163}}
  @keyframes lpFaWa{0%{opacity:0;transform:translateY(10px) scale(.95)}8%,86%{opacity:1;transform:none}94%,100%{opacity:0;transform:none}}
  @keyframes lpFaTick{0%,40%{color:#625B73}46%,100%{color:#1C6699}}
  @keyframes lpFaSway{0%{transform:translateY(0) rotate(0deg)}100%{transform:translateY(-6px) rotate(calc(var(--r) * -1.6))}}
  @keyframes lpFaRow{0%{opacity:0;transform:translateX(-36px)}9%,84%{opacity:1;transform:none}93%,100%{opacity:0;transform:none}}
  .lp-motion .lp-fa-ch{animation:lpFaFill 8s cubic-bezier(0.23,1,0.32,1) var(--d,0s) infinite both}
  .lp-motion .lp-fa-bub{animation:lpFaA1 7s ease-out infinite both}
  .lp-motion .lp-fa-typing{display:inline-flex;animation:lpFaTy 7s linear infinite both}
  .lp-motion .lp-fa-typing i{animation:lpFaDot 600ms ease-in-out infinite}
  .lp-motion .lp-fa-typing i:nth-child(2){animation-delay:.12s}.lp-motion .lp-fa-typing i:nth-child(3){animation-delay:.24s}
  .lp-motion .lp-fa-rep{animation:lpFaRep 7s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-fa-chip{animation:lpFaPop 6s cubic-bezier(0.23,1,0.32,1) var(--d,0s) infinite both}
  .lp-motion .lp-fa-ring{animation:lpFaRing 6s cubic-bezier(0.77,0,0.175,1) infinite both}
  .lp-motion .lp-fa-wa{animation:lpFaWa 7s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-fa-wa em{animation:lpFaTick 7s linear infinite both}
  .lp-motion .lp-fa-sc{animation:lpFaSway 2.8s ease-in-out var(--d,0s) infinite alternate}
  .lp-motion .lp-fa-rows span{animation:lpFaRow 6s cubic-bezier(0.23,1,0.32,1) var(--d,0s) infinite both}
  @media(prefers-reduced-motion:reduce){.lp-fa *{animation:none!important}.lp-fa-typing{display:none!important}}

  @media(max-width:1120px){
    .lp-fa{min-height:0}
    .lp-fa-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:34px}
    .lp-fa-card{position:static;width:auto}
  }
  @media(max-width:620px){
    .lp-fa-cards{grid-template-columns:1fr;gap:14px}
    .lp-fa-c > p{font-size:16px}
    .lp-fa-map{padding:8px;border-radius:26px}
  }
`;
function FeatureArc({onStart}){
  const chair=(x,y,d,c,f,dl)=>(
    <g key={`${x.toFixed(1)}-${y.toFixed(1)}`} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${d})`}>
      <rect x="-6" y="-4.5" width="12" height="9" rx="4" fill="#ECE6F5"/>
      {f&&<rect className="lp-fa-ch" style={{"--d":`${dl.toFixed(2)}s`}} x="-6" y="-4.5" width="12" height="9" rx="4" fill={c}/>}
    </g>
  );
  const table=(cx,cy,c,n,fill,ti)=>(<g key={n}>
    {Array.from({length:8}).map((_,i)=>{const d=i*45,a=d*Math.PI/180;return chair(cx+34*Math.sin(a),cy-34*Math.cos(a),d,c,i<fill,.2+ti*.55+i*.07);})}
    <circle cx={cx} cy={cy} r="23" fill="#fff" stroke={c} strokeOpacity=".5" strokeWidth="1.5"/>
    <text x={cx} y={cy+5} textAnchor="middle" fontSize="14" fontWeight="900" fill={LP.ink} fontFamily="Heebo">{n}</text>
  </g>);
  const card=(p,icon,c,bg,title,sub,desc,art)=>(
    <div className={`lp-fa-card lp-lift lp-fa-${p}`} style={{"--t":c,"--bg":bg}}>
      <div className="lp-fa-art" aria-hidden="true">{art}</div>
      <div className="lp-fa-h"><span className="lp-circ" style={{background:c+"22"}}><LpIcon name={icon} color={c} size={20}/></span><div><h3>{title}</h3><small>{sub}</small></div></div>
      <p>{desc}</p>
    </div>
  );
  return(<>
    <style>{FA_CSS}</style>
    <div className="lp-fa">
      <div className="lp-fa-c">
        <h2 className="lp-h2">כל מה שצריך להושבה <span className="lp-grad">מושלמת</span></h2>
        <p>כלים שנבנו במיוחד לחתונות, בר מצוות ואירועים גדולים.</p>
        <div className="lp-fa-map">
          <svg viewBox="0 0 320 220" aria-label="מפת אולם: השולחנות מתמלאים באורחים" role="img">
            <rect x="110" y="14" width="100" height="22" rx="11" fill="#FFE3EE" stroke="#F3B6CF"/>
            <text x="160" y="29" textAnchor="middle" fontSize="10" fontWeight="900" fill="#B13B72" fontFamily="Heebo">במה</text>
            <rect x="125" y="72" width="70" height="80" rx="12" fill="#FBF3E4" stroke="#EBCB8F"/>
            <text x="160" y="116" textAnchor="middle" fontSize="9" fontWeight="900" fill="#A87A22" fontFamily="Heebo">רחבה</text>
            {table(62,80,LP.rose,"1",7,0)}{table(258,80,LP.mint,"2",8,1)}{table(62,170,LP.sky,"3",5,2)}{table(258,170,LP.gold,"4",6,3)}
          </svg>
        </div>
        <div className="lp-fa-mapcap"><b>מפת אולם אינטראקטיבית</b>שולחנות עגולים, מרובעים ושולחן אבירים, במה, רחבה ובר. גוררים ורואים מיד כמה מקומות נשארו.</div>
        <button type="button" onClick={onStart} className="lp-btn lp-primary" style={{padding:"15px 32px",fontSize:16}}>מתחילים בחינם</button>
      </div>
      <div className="lp-fa-cards">
        {card("p1","ai",LP.violet,"linear-gradient(140deg,#F1EAFF,#FFEFF6)","סידור הושבה ב-AI","כותבים, וזה מסודר","כותבים העדפות בשפה חופשית, וה-AI מסדר את כולם לפי משפחות, חברים והפרדות.",
          <div style={{width:"88%",display:"grid",gap:8}}>
            <div className="lp-fa-bub" style={{justifySelf:"start"}}>"סבתא ליד הרחבה"</div>
            <div className="lp-fa-slot"><span className="lp-fa-typing"><i/><i/><i/></span><span className="lp-fa-rep"><LpIcon name="ai" color="#fff" size={13}/>סודר! 214 אורחים</span></div>
          </div>)}
        {card("p2","users","#1F62B5","linear-gradient(150deg,#E2F1FF,#C7E3FA)","קבוצות וצבעים","מי עם מי, במבט אחד","כל קבוצה בצבע משלה, ורואים במבט אחד מי יושב עם מי.",
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",padding:"0 14px"}}>
            {[["משפחה",LP.rose],["חברים",LP.sky],["עבודה",LP.mint],["שכנים",LP.gold],["צבא",LP.violet]].map(([l,c],i)=><span key={l} className="lp-fa-chip" style={{"--c":c,"--d":`${(i*.28).toFixed(2)}s`}}><i/>{l}</span>)}
          </div>)}
        {card("p3","check","#1F7A4D","linear-gradient(160deg,#E5F7EE,#C7EBD9)","אישורי הגעה מחוברים","מתעדכן לבד","מי שאישר נכנס לסידור, ומי שביטל משחרר מקום.",
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <svg width="70" height="70" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="#fff" strokeWidth="7"/><circle className="lp-fa-ring" cx="32" cy="32" r="26" fill="none" stroke={LP.mint} strokeWidth="7" strokeLinecap="round" strokeDasharray="163" strokeDashoffset="41" transform="rotate(-90 32 32)"/><text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="900" fill={LP.ink} fontFamily="Heebo">75%</text></svg>
            <div style={{fontSize:12.5,fontWeight:800,color:"#1F7A4D",lineHeight:1.7}}>✓ 168 מגיעים<br/><span style={{color:"#6B5F80"}}>⏳ 46 ממתינים</span></div>
          </div>)}
        {card("p4","msg","#B4471F","linear-gradient(140deg,#E9F8EF,#FFF0E2)","מספר שולחן לכל אורח","ב-SMS או WhatsApp","הודעה אישית עם שם האורח ומספר השולחן שלו. בלי תורים בכניסה.",
          <div className="lp-fa-wa"><b style={{color:"#167A3E",fontSize:11}}>Sidor-IL · WhatsApp</b><br/>שלום דנה! מחכים לך הערב.<br/><b>השולחן שלך: מספר 7</b><em>19:02 ✓✓</em></div>)}
        {card("p5","print","#835500","linear-gradient(160deg,#FFF4DC,#FFE2BE)","כרטיסי הושבה וקבלה","מוכנים להדפסה","רשימות לכל שולחן וכרטיסים מוכנים להדפסה, לעמדת הקבלה באולם.",
          <div style={{display:"flex",gap:14}}>
            {[["7","משפחת הכלה","#B8306F",-6],["12","חברים מהצבא","#1F62B5",5]].map(([n,l,c,r],i)=>(
              <div key={n} className="lp-fa-sc" style={{"--r":`${r}deg`,"--c":c,"--d":`${(-i*1.4).toFixed(1)}s`}}><span>שולחן</span><b className="lp-num">{n}</b><small>{l}</small></div>
            ))}
          </div>)}
        {card("p6","sheet","#1F7A4D","linear-gradient(150deg,#E8F7EE,#F3F0FF)","ייבוא מאקסל","רשימה מוכנה בדקה","מעלים את קובץ המוזמנים שכבר יש לכם, וכל האורחים נכנסים לרשימה.",
          <div className="lp-fa-xl">
            <div className="lp-fa-sheet"><i/><i/><i/><i/></div>
            <div className="lp-fa-rows">{["דנה כהן","יוסי לוי","משפחת אברהם"].map((n,i)=><span key={n} style={{"--d":`${(.3+i*.45).toFixed(2)}s`}}>{n}</span>)}</div>
          </div>)}
      </div>
    </div>
  </>);
}

// "מאקסל מבולגן למפה ברורה": האקסל מצד אחד, המפה מהצד השני, ושמות האורחים עוברים ביניהם בלולאה
const XM_ROWS=[["משה טל","6049","2"],["יעל שגיא","7420","לא",1],["אלון קפלן","3791","2"],["דנה וייס","","אולי",2],["ניל אורן","1533","לא ענה"],["רחל כהן","0000","1"],["דוד לוי","1371","2"],["משה פרץ","2742","לא",1]];
const XM_CSS=`
  .lp-xm{display:grid;grid-template-columns:minmax(0,1fr) 150px minmax(0,1.12fr);align-items:center;gap:0;max-width:1120px;margin:0 auto}
  .lp-xm-xl{position:relative;background:#fff;border-radius:18px;overflow:visible;box-shadow:0 34px 70px -40px rgba(43,29,63,.55);rotate:2deg;filter:saturate(.85)}
  .lp-xm-xl-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;background:#1F7A4D;color:#fff;border-radius:18px 18px 0 0;font:700 13px 'Heebo',sans-serif;direction:ltr;justify-content:flex-end}
  .lp-xm-xl-h i{font-style:normal;width:22px;height:22px;border-radius:5px;background:#fff;color:#1F7A4D;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px}
  .lp-xm-xl table{width:100%;border-collapse:collapse;font-size:13px;color:#2B1D3F;table-layout:fixed}
  .lp-xm-xl th{background:#F1F3F2;font-weight:700;color:#5F6B66;height:28px;border:1px solid #E1E5E3}
  .lp-xm-xl td{height:30px;border:1px solid #E6E9E7;padding:0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right}
  .lp-xm-xl td.n{width:30px;text-align:center;background:#F7F8F7;color:#8A938F;font-size:11px}
  .lp-xm-xl tr.x td:not(.n){text-decoration:line-through;color:#6E6880}
  .lp-xm-xl tr.y td:not(.n){background:#FFF6B8}
  .lp-xm-note{position:absolute;z-index:2;background:#FFE680;color:#5A4500;font:700 13px/1.35 'Heebo',sans-serif;padding:9px 12px;border-radius:4px;box-shadow:0 10px 20px -12px rgba(90,69,0,.7);max-width:150px}
  .lp-xm-note.a{top:84px;left:-22px;rotate:-6deg;background:#FFC9DD;color:#7A1F48}
  .lp-xm-note.b{bottom:-18px;right:24px;rotate:4deg}
  .lp-xm-flow{position:relative;height:300px;display:flex;align-items:center;justify-content:center}
  .lp-xm-flow > svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
  .lp-xm-dash{stroke-dasharray:6 8}
  .lp-xm-logo{position:relative;z-index:2;width:66px;height:66px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 36px -18px rgba(155,107,255,.9),0 0 0 8px rgba(255,255,255,.6)}
  .lp-xm-chip{position:absolute;z-index:3;left:50%;top:var(--y);translate:-50% -50%;white-space:nowrap;background:#fff;border-radius:999px;padding:6px 12px;font:800 12.5px 'Fredoka','Heebo',sans-serif;color:#2B1D3F;box-shadow:0 10px 22px -12px rgba(60,35,110,.65);display:inline-flex;align-items:center;gap:6px}
  .lp-xm-chip i{width:8px;height:8px;border-radius:50%;background:var(--c)}
  .lp-xm-map{background:#fff;border-radius:26px;padding:12px;box-shadow:0 40px 80px -40px rgba(60,35,110,.6),0 0 0 8px rgba(255,255,255,.55)}
  .lp-xm-map-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 8px 10px;font:800 14px 'Fredoka','Heebo',sans-serif;color:#2B1D3F}
  .lp-xm-map-h span{font:800 12px 'Heebo',sans-serif;color:#1F7A4D;background:#E3F6EC;border-radius:999px;padding:4px 10px}
  .lp-xm-map svg{display:block;width:100%;height:auto;border-radius:18px;background:radial-gradient(circle at 50% 35%,#FFF3F8,#F3ECFF 80%)}
  .lp-xm-ch{transform-box:fill-box;transform-origin:center}
  .lp-xm-pts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;max-width:1120px;margin:56px auto 0}
  .lp-xm-pt{background:#fff;border-radius:22px;padding:18px 20px;box-shadow:0 18px 40px -30px rgba(60,35,110,.55)}
  .lp-xm-pt s{display:block;font-size:14.5px;color:#625B73;margin-bottom:6px}
  .lp-xm-pt b{display:flex;gap:8px;align-items:flex-start;font:800 16.5px/1.4 'Fredoka','Heebo',sans-serif;color:#2B1D3F}
  .lp-xm-pt b::before{content:"";flex:0 0 auto;width:20px;height:20px;margin-top:1px;border-radius:50%;background:#3CC8A0 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5.5 10.5l3 3 6-7' fill='none' stroke='%23fff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/16px no-repeat}

  @keyframes lpXmFly{0%{opacity:0;transform:translateX(72px) scale(.9)}14%{opacity:1;transform:translateX(48px) scale(1)}80%{opacity:1;transform:translateX(-48px) scale(1)}94%,100%{opacity:0;transform:translateX(-72px) scale(.9)}}
  @keyframes lpXmFlyV{0%{opacity:0;transform:translateY(-46px) scale(.9)}14%{opacity:1;transform:translateY(-30px) scale(1)}80%{opacity:1;transform:translateY(30px) scale(1)}94%,100%{opacity:0;transform:translateY(46px) scale(.9)}}
  @keyframes lpXmDash{to{stroke-dashoffset:-28}}
  @keyframes lpXmFill{0%{opacity:0;transform:scale(.3)}5%{opacity:1;transform:scale(1)}84%{opacity:1;transform:scale(1)}92%,100%{opacity:0;transform:scale(1)}}
  @keyframes lpXmPulse{50%{box-shadow:0 18px 36px -18px rgba(240,96,158,.95),0 0 0 14px rgba(255,255,255,.35)}}
  .lp-motion .lp-xm-chip{animation:lpXmFly 4.5s cubic-bezier(0.77,0,0.175,1) var(--d) infinite both}
  .lp-motion .lp-xm-dash{animation:lpXmDash 1.2s linear infinite}
  .lp-motion .lp-xm-ch{animation:lpXmFill 9s cubic-bezier(0.23,1,0.32,1) var(--d,0s) infinite both}
  .lp-motion .lp-xm-logo{animation:lpXmPulse 2.4s ease-in-out infinite}
  @media(prefers-reduced-motion:reduce){.lp-xm *{animation:none!important}.lp-xm-chip{opacity:1!important}}

  @media(max-width:900px){
    .lp-xm{grid-template-columns:1fr;gap:0;max-width:560px}
    .lp-xm-xl{rotate:1deg}
    .lp-xm-note.a{left:-6px;top:auto;bottom:40px}
    .lp-xm-flow{height:150px}
    .lp-xm-flow > svg{display:none}
    .lp-xm-chip{left:var(--x);top:50%}
    .lp-motion .lp-xm-chip{animation-name:lpXmFlyV}
    .lp-xm-pts{grid-template-columns:1fr;gap:12px;margin-top:40px}
  }
  @media(max-width:520px){.lp-xm-xl td:nth-child(3),.lp-xm-xl th:nth-child(3){display:none}}
`;
function ExcelToMap(){
  const chair=(x,y,d,c,dl)=>(
    <g key={`${x.toFixed(1)}-${y.toFixed(1)}`} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${d})`}>
      <rect x="-5.5" y="-4" width="11" height="8" rx="3.5" fill="#E9E2F3"/>
      <rect className="lp-xm-ch" style={{"--d":`${dl.toFixed(2)}s`}} x="-5.5" y="-4" width="11" height="8" rx="3.5" fill={c}/>
    </g>);
  const T=[[70,96,LP.rose,"1"],[180,96,LP.violet,"2"],[290,96,LP.mint,"3"],[70,196,LP.sky,"4"],[180,196,LP.gold,"5"],[290,196,LP.coral,"6"]];
  return(<>
    <style>{XM_CSS}</style>
    <div className="lp-xm">
      <div className="lp-xm-xl" aria-label="לפני: קובץ אקסל של מוזמנים, עם שורות מחוקות, פתקים ותשובות לא ברורות" role="img">
        <div className="lp-xm-xl-h">מוזמנים_סופי_סופי (3).xlsx<i>X</i></div>
        <table aria-hidden="true"><thead><tr><th className="n"></th><th>שם</th><th>טלפון</th><th>מגיעים?</th></tr></thead>
          <tbody>{XM_ROWS.map(([n,p,c,t],i)=><tr key={n} className={t===1?"x":t===2?"y":undefined}><td className="n">{i+2}</td><td>{n}</td><td dir="ltr">{p?`052-•••-${p}`:""}</td><td>{c}</td></tr>)}</tbody>
        </table>
        <div className="lp-xm-note a" aria-hidden="true">עוד 46 לא ענו...</div>
        <div className="lp-xm-note b" aria-hidden="true">סבתא צריכה כיסא ליד היציאה!</div>
      </div>
      <div className="lp-xm-flow" aria-hidden="true">
        <svg viewBox="0 0 150 300" preserveAspectRatio="none"><path className="lp-xm-dash" d="M150 150 C110 80 40 220 0 150" fill="none" stroke="#C9B4F0" strokeWidth="2.5" strokeLinecap="round"/></svg>
        <div className="lp-xm-logo"><SidorLogo size={42} id="xmLogo"/></div>
        {[["דנה וייס",LP.rose,"22%","30%",0],["אלון קפלן",LP.violet,"78%","50%",1.5],["רחל כהן",LP.mint,"50%","70%",3]].map(([n,c,y,x,d])=>(
          <span key={n} className="lp-xm-chip" style={{"--c":c,"--y":y,"--x":x,"--d":`${d}s`}}><i/>{n}</span>
        ))}
      </div>
      <div className="lp-xm-map">
        <div className="lp-xm-map-h">מפת האולם<span>✓ כולם במקום</span></div>
        <svg viewBox="0 0 360 260" role="img" aria-label="אחרי: מפת אולם עם 6 שולחנות שמתמלאים באורחים">
          <rect x="120" y="14" width="120" height="24" rx="12" fill="#FFE3EE" stroke="#F3B6CF"/>
          <text x="180" y="30" textAnchor="middle" fontSize="11" fontWeight="900" fill="#B13B72" fontFamily="Heebo">במה</text>
          {T.map(([cx,cy,c,n],ti)=>(<g key={n}>
            {Array.from({length:8}).map((_,i)=>{const d=i*45,a=d*Math.PI/180;return chair(cx+33*Math.sin(a),cy-33*Math.cos(a),d,c,.25+ti*.7+i*.06);})}
            <circle cx={cx} cy={cy} r="22" fill="#fff" stroke={c} strokeOpacity=".55" strokeWidth="1.5"/>
            <text x={cx} y={cy+5} textAnchor="middle" fontSize="14" fontWeight="900" fill={LP.ink} fontFamily="Heebo">{n}</text>
          </g>))}
        </svg>
      </div>
    </div>
    <div className="lp-xm-pts">
      {[["5 גרסאות של אותו קובץ","רשימה אחת שכולם עורכים"],["פתקים על מי יושב ליד מי","קבוצות וצבעים על המפה"],["סופרים כיסאות ביד","רואים מיד כמה מקומות נשארו"]].map(([a,b])=>(
        <div key={a} className="lp-xm-pt" data-reveal><s>{a}</s><b>{b}</b></div>
      ))}
    </div>
  </>);
}

// "בכל מכשיר": מחשב וטלפון עם מסכים אמיתיים, אישור הגעה בטלפון שמתעדכן גם במחשב
const SA_CSS=`
  .lp-sa{align-items:flex-end!important;padding-top:0!important}
  .lp-sa-ph{position:relative;width:200px;height:236px;background:#fff;border:7px solid #1C1430;border-bottom:none;border-radius:30px 30px 0 0;overflow:hidden;box-shadow:0 30px 50px -30px rgba(43,29,63,.7);padding:16px 10px 0;direction:rtl;text-align:right}
  .lp-sa-ph::before{content:"";position:absolute;top:5px;left:50%;translate:-50% 0;width:56px;height:8px;border-radius:8px;background:#1C1430}
  .lp-sa-hd{font:800 13px 'Fredoka','Heebo',sans-serif;color:#2B1D3F;margin:4px 4px 8px;display:flex;justify-content:space-between;align-items:center}
  .lp-sa-hd small{font:700 10.5px 'Heebo',sans-serif;color:#6B5F80}
  .lp-sa-row{display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid #F3EEF8}
  .lp-sa-av{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:800 12px 'Heebo',sans-serif;color:#fff;background:var(--c);flex-shrink:0}
  .lp-sa-row b{flex:1;font-size:12.5px;font-weight:700;color:#2B1D3F}
  .lp-sa-tg{position:relative;width:26px;height:26px;flex-shrink:0}
  .lp-sa-tg span{position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900}
  .lp-sa-plus{background:#F1EAFF;color:#6339CC}
  .lp-sa-ok{background:#1F7A4D;color:#fff;opacity:0}
  .lp-sa-toast{position:absolute;bottom:10px;right:10px;left:10px;background:#2B1D3F;color:#fff;border-radius:12px;padding:8px 10px;font:800 12px 'Fredoka','Heebo',sans-serif;text-align:center}
  .lp-sa-map{position:relative;width:86%;height:228px;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 30px 50px -30px rgba(43,29,63,.7);overflow:hidden}
  .lp-sa-map svg{position:absolute;inset:0;width:100%;height:100%}
  .lp-sa-wait{position:absolute;bottom:0;right:0;left:0;height:58px;background:#F7F2FF;border-top:1px solid #ECE3F7;display:flex;align-items:center;gap:6px;padding:0 10px;direction:rtl}
  .lp-sa-wait em{font-style:normal;font:700 11px 'Heebo',sans-serif;color:#6B5F80}
  .lp-sa-chip{display:inline-flex;align-items:center;gap:5px;background:#fff;border-radius:999px;padding:5px 9px;font:800 11.5px 'Fredoka','Heebo',sans-serif;color:#2B1D3F;box-shadow:0 6px 14px -8px rgba(60,35,110,.6);white-space:nowrap}
  .lp-sa-chip i{width:8px;height:8px;border-radius:50%;background:var(--c)}
  .lp-sa-drag{position:absolute;z-index:2;bottom:16px;left:24px}
  .lp-sa-cur{position:absolute;left:-6px;bottom:-12px;width:18px;height:18px}
  .lp-sa-cnt{position:relative;display:inline-block;width:28px;height:14px}
  .lp-sa-cnt span{position:absolute;inset:0;text-align:center}
  .lp-sa-cnt .b{opacity:0}
  .lp-sa-ch{background:#F4FAF7}
  .lp-sa-ch .lp-sa-hd{color:#167A3E}
  .lp-sa-msg{margin:8px 2px 0;max-width:86%;background:#fff;border-radius:14px 14px 14px 4px;padding:8px 10px;font-size:12px;line-height:1.5;color:#2B1D3F;box-shadow:0 6px 16px -10px rgba(31,122,77,.6)}
  .lp-sa-msg em{font-style:normal;display:block;text-align:left;font-size:10px;color:#57506A}
  .lp-sa-msg.me{margin-right:auto;margin-left:2px;border-radius:14px 14px 4px 14px;background:#DFF6E8}
  .lp-sa-plane{position:absolute;z-index:3;width:30px;height:30px;left:-34px;bottom:30px}
  .lp-sa-sent{position:absolute;bottom:10px;right:10px;left:10px;background:#15803D;color:#fff;border-radius:12px;padding:8px 10px;font:800 12px 'Fredoka','Heebo',sans-serif;text-align:center}

  @keyframes lpSaPlus{0%{opacity:1}4%,72%{opacity:0}78%,100%{opacity:1}}
  @keyframes lpSaOk{0%{opacity:0;transform:scale(.4)}4%,72%{opacity:1;transform:scale(1)}78%,100%{opacity:0;transform:scale(1)}}
  @keyframes lpSaToast{0%,52%{opacity:0;transform:translateY(10px)}58%,86%{opacity:1;transform:none}92%,100%{opacity:0;transform:none}}
  @keyframes lpSaDrag{0%,12%{opacity:1;transform:translate(0,0) scale(1)}46%{opacity:1;transform:translate(var(--dx),var(--dy)) scale(.9)}52%,90%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.6)}91%{opacity:0;transform:translate(0,0) scale(1)}100%{opacity:1;transform:translate(0,0) scale(1)}}
  @keyframes lpSaSeat{0%,46%{opacity:0;transform:scale(.3)}52%,90%{opacity:1;transform:scale(1)}96%,100%{opacity:0;transform:scale(1)}}
  @keyframes lpSaA{0%,48%{opacity:1}52%,92%{opacity:0}96%,100%{opacity:1}}
  @keyframes lpSaB{0%,48%{opacity:0}52%,92%{opacity:1}96%,100%{opacity:0}}
  @keyframes lpSaPlane{0%{opacity:0;transform:translate(0,0) rotate(-10deg)}6%{opacity:1}22%{opacity:1;transform:translate(150px,-150px) rotate(-10deg)}26%,100%{opacity:0;transform:translate(170px,-170px) rotate(-10deg)}}
  @keyframes lpSaMsg{0%,18%{opacity:0;transform:translateY(10px) scale(.96)}24%,88%{opacity:1;transform:none}94%,100%{opacity:0;transform:none}}
  @keyframes lpSaTick{0%,38%{color:#57506A}44%,100%{color:#1C6699}}
  @keyframes lpSaRep{0%,50%{opacity:0;transform:translateY(10px) scale(.96)}56%,88%{opacity:1;transform:none}94%,100%{opacity:0;transform:none}}
  .lp-sa-ch{transform-box:fill-box;transform-origin:center}
  .lp-motion .lp-sa-plus{animation:lpSaPlus 6s ease var(--d) infinite both}
  .lp-motion .lp-sa-ok{animation:lpSaOk 6s cubic-bezier(0.23,1,0.32,1) var(--d) infinite both}
  .lp-motion .lp-sa-toast{animation:lpSaToast 6s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-sa-drag{animation:lpSaDrag 6s cubic-bezier(0.77,0,0.175,1) infinite both}
  .lp-motion .lp-sa-seat{transform-box:fill-box;transform-origin:center;animation:lpSaSeat 6s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-sa-cnt .a{animation:lpSaA 6s linear infinite both}
  .lp-motion .lp-sa-cnt .b{animation:lpSaB 6s linear infinite both}
  .lp-motion .lp-sa-plane{animation:lpSaPlane 6s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-sa-msg.me{animation:lpSaMsg 6s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-sa-msg.me em{animation:lpSaTick 6s linear infinite both}
  .lp-motion .lp-sa-msg.rep{animation:lpSaRep 6s cubic-bezier(0.23,1,0.32,1) infinite both}
  .lp-motion .lp-sa-sent{animation:lpSaToast 6s cubic-bezier(0.23,1,0.32,1) .4s infinite both}
  @media(prefers-reduced-motion:reduce){.lp-sa *{animation:none!important}}
  .lp-sa-noanim .lp-sa-ok{opacity:1}.lp-sa-noanim .lp-sa-plus{opacity:0}
`;
function HowStepArt({i}){
  if(i===0)return(
    <div className="lp-sa-ph">
      <div className="lp-sa-hd">📇 אנשי קשר<small>בוחרים מי מוזמן</small></div>
      {[["דנה כהן",LP.rose],["יוסי לוי",LP.violet],["רחל אברהם",LP.mint],["משפחת טל",LP.gold]].map(([n,c],k)=>(
        <div key={n} className="lp-sa-row" style={{"--c":c,"--d":`${(.5+k*.6).toFixed(1)}s`}}>
          <span className="lp-sa-av">{n[0]}</span><b>{n}</b>
          <span className="lp-sa-tg"><span className="lp-sa-plus">+</span><span className="lp-sa-ok">✓</span></span>
        </div>
      ))}
      <div className="lp-sa-toast">✓ 4 מוזמנים נוספו לרשימה</div>
    </div>);
  if(i===1){
    const seats=(cx,cy,c,n,extra)=>Array.from({length:8}).map((_,k)=>{const a=k*45*Math.PI/180,x=cx+30*Math.sin(a),y=cy-30*Math.cos(a);const on=k<n;const tgt=extra&&k===n;return <circle key={k} className={tgt?"lp-sa-seat":undefined} cx={x.toFixed(1)} cy={y.toFixed(1)} r="6" fill={on||tgt?c:"#E9E2F3"}/>;});
    return(
      <div className="lp-sa-map">
        <svg viewBox="0 0 260 228" aria-hidden="true">
          <rect x="85" y="10" width="90" height="20" rx="10" fill="#FFE3EE"/><text x="130" y="24" textAnchor="middle" fontSize="10" fontWeight="900" fill="#B13B72" fontFamily="Heebo">במה</text>
          {seats(72,92,LP.rose,6,false)}<circle cx="72" cy="92" r="19" fill="#fff" stroke={LP.rose} strokeOpacity=".5"/><text x="72" y="96" textAnchor="middle" fontSize="12" fontWeight="900" fill={LP.ink} fontFamily="Heebo">1</text>
          {seats(188,92,LP.violet,4,true)}<circle cx="188" cy="92" r="19" fill="#fff" stroke={LP.violet} strokeOpacity=".5"/><text x="188" y="96" textAnchor="middle" fontSize="12" fontWeight="900" fill={LP.ink} fontFamily="Heebo">2</text>
        </svg>
        <div style={{position:"absolute",top:132,left:"58%",font:"800 11px 'Heebo',sans-serif",color:"#6339CC",background:"#F1EAFF",borderRadius:99,padding:"2px 8px"}}><span className="lp-sa-cnt"><span className="a">4/8</span><span className="b">5/8</span></span></div>
        <div className="lp-sa-wait"><em>ממתינים:</em><span className="lp-sa-chip" style={{"--c":LP.mint}}><i/>אלון</span></div>
        <div className="lp-sa-drag" style={{"--dx":"96px","--dy":"-128px"}}>
          <span className="lp-sa-chip" style={{"--c":LP.violet}}><i/>רחל כהן</span>
          <svg className="lp-sa-cur" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l13 7-6 1.5L9.5 18z" fill="#2B1D3F" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </div>
      </div>);
  }
  return(
    <div className="lp-sa-ph lp-sa-ch">
      <div className="lp-sa-hd">💬 Sidor-IL<small>הודעה לאורחים</small></div>
      <div className="lp-sa-msg me">היי רחל! 🎉 מחכים לך הערב.<br/><b>השולחן שלך: 7</b><em>19:02 ✓✓</em></div>
      <div className="lp-sa-msg rep">תודה! נתראה 💃</div>
      <div className="lp-sa-sent">📤 נשלח לכל האורחים</div>
      <svg className="lp-sa-plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-7 18-2.5-7.5z" fill="#fff" stroke="#15803D" strokeWidth="1.6" strokeLinejoin="round"/></svg>
    </div>);
}

export const LP_STORY=[
  {t:"מעלים את המוזמנים",d:"מייבאים מאקסל או מוסיפים ידנית, ומסמנים קבוצות: משפחה קרובה, חברים מהצבא, עבודה.",c:LP.rose,img:"/landing/rsvp-v2.jpg",kind:"phone",alt:"איור: מוסיפים אנשי קשר לרשימת המוזמנים",chip:"36 מוזמנים נכנסו מהאקסל"},
  {t:"מסדרים את השולחנות",d:"בונים את מפת האולם וגוררים אורחים לשולחנות, או לוחצים על AI ומקבלים סידור מלא תוך שניות.",c:LP.violet,img:"/landing/seating-v2.jpg",kind:"laptop",alt:"איור: גוררים אורח לשולחן במפת האולם",chip:"שולחן 2 · משפחת החתן · 5/10"},
  {t:"האורחים יודעים איפה לשבת",d:"שולחים לכל אורח את מספר השולחן ב-SMS או WhatsApp, ומדפיסים כרטיסי הושבה לכניסה.",c:LP.mint,img:"/landing/invite-v2.jpg",kind:"phone",alt:"איור: הודעה לאורח עם מספר השולחן שלו",chip:"היי רחל, השולחן שלך: 7"},
];
function LandingPage({ onOpenAuth, onLogout, loggedIn=false }) {
  // הגעה מהבר שבדפים הפנימיים: גלילה למקטע (#how...) ופתיחת כניסה/הרשמה אם נבחרה
  useEffect(()=>{
    let auth=null;try{auth=sessionStorage.getItem("sidor_open_auth");sessionStorage.removeItem("sidor_open_auth");}catch{}
    // "לאולמות ומפיקים" מהתחתית של דף פנימי פותח כאן את דף האולמות
    if(auth==="venue"){setVenuePage(true);return;}
    if(auth){onOpenAuth(auth);return;}
    const id=window.location.hash.slice(1);
    if(/^[a-z]+$/.test(id))setTimeout(()=>document.getElementById(id)?.scrollIntoView(),120);
  },[]);
  const [scrolled,setScrolled]=useState(false);
  // בנייד: כפתור הרשמה דביק בתחתית, רק אחרי שגוללים מעבר לפתיחה (כפתור ה-Hero כבר לא נראה)
  const [pastHero,setPastHero]=useState(false);
  const [venuePage,setVenuePage]=useState(false);
  const [motion]=useState(lpMotionOK);
  const [spy,setSpy]=useState("");
  const [menu,setMenu]=useState(false);
  const rootRef=useRef(null),menuRef=useRef(null),burgerRef=useRef(null);

  useEffect(()=>{
    const fn=()=>{setScrolled(window.scrollY>40);setPastHero(window.scrollY>window.innerHeight*.85);};
    fn();
    window.addEventListener("scroll",fn,{passive:true});
    return()=>window.removeEventListener("scroll",fn);
  },[]);
  useLpReveal(rootRef,venuePage);
  // הקישור של המקטע שבמרכז המסך מודגש בתפריט העליון
  useEffect(()=>{
    if(venuePage)return;
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setSpy(e.target.id);}),{rootMargin:"-45% 0px -50% 0px"});
    ["top","before","how","features","vendors","events","pricing","faq","contact"].forEach(id=>{const el=document.getElementById(id);if(el)io.observe(el);});
    return()=>io.disconnect();
  },[venuePage]);
  // תפריט בנייד: נועל את הגלילה מאחור, Esc סוגר, והפוקוס חוזר לכפתור שפתח
  useEffect(()=>{
    if(!menu)return;
    document.body.style.overflow="hidden";
    const t=setTimeout(()=>menuRef.current?.querySelector("a,button")?.focus(),80);
    const esc=e=>{if(e.key==="Escape")setMenu(false);};
    window.addEventListener("keydown",esc);
    return()=>{clearTimeout(t);document.body.style.overflow="";window.removeEventListener("keydown",esc);burgerRef.current?.focus({preventScroll:true});};
  },[menu]);
  const trapTab=e=>{
    if(e.key!=="Tab"||!menuRef.current)return;
    const f=[...menuRef.current.querySelectorAll("a,button")];if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  };
  const go=fn=>()=>{setMenu(false);fn();};

  if(venuePage) return <VenuePage onBack={()=>setVenuePage(false)} onOpenAuth={onOpenAuth}/>;

  // כותרות מקטע מיושרות לימין, על קו אחד עם התוכן שמתחתן
  const sectionTitle=(kicker,title,accent,sub,opts={})=>(
    <div data-reveal style={{marginBottom:opts.mb??52,maxWidth:820}}>
      <h2 className="lp-h2" style={opts.dark?{color:LP.cream}:undefined}>
        {title} {accent&&<span className={opts.plain?undefined:opts.dark?"lp-grad-light":"lp-grad"}>{accent}</span>}
      </h2>
      {sub&&<p className="lp-sec-sub" style={opts.dark?{color:"#E2DAEE"}:undefined}>{sub}</p>}
    </div>
  );

  return(
    <div ref={rootRef} className={`lp${motion?" lp-motion":""}${pastHero?" lp-hero-off":""}`} dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:LP.cream,color:LP.ink,minHeight:"100vh",overflowX:"hidden"}}>
      <style>{LANDING_CSS}</style>
      <a href="#top" className="lp-skip">דלג לתוכן הראשי</a>

      {/* ─── NAV: גלולה צפה. שקופה מעל התמונה, לבנה כשגוללים ─── */}
      <nav className="lp-nav" style={{position:"fixed",top:12,right:"3vw",left:"3vw",zIndex:100,height:64,display:"flex",alignItems:"center",padding:"0 18px 0 12px",gap:12,borderRadius:100,
        backgroundColor:scrolled?"rgba(255,255,255,.97)":"rgba(255,255,255,0)",boxShadow:scrolled?"0 16px 40px -20px rgba(60,35,110,.45)":"0 0 0 rgba(0,0,0,0)"}}>
        <a href="#top" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none",flexShrink:0,color:LP.ink}}>
          <SidorLogo size={40} id="lpLogo"/>
          <span style={{fontWeight:900,fontSize:21,letterSpacing:"-.02em"}}>Sidor-IL</span>
        </a>
        <div className="lp-hide-sm" style={{display:"flex",gap:2,marginRight:14}}>
          {LP_NAV.map(([id,l])=>(
            <a key={id} href={"#"+id} className={`lp-nav-link${spy===id?" on":""}`} aria-current={spy===id?"location":undefined}>{l}</a>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button className="lp-btn lp-navbtn lp-ghost" onClick={()=>onOpenAuth("login")} style={{padding:"9px 20px",fontSize:14,minHeight:44}}>{loggedIn?<><span className="lp-lg">האירועים שלי</span><span className="lp-sm">האירועים</span></>:"כניסה"}</button>
        <button className="lp-btn lp-navbtn lp-hide-xs lp-primary" onClick={()=>onOpenAuth("register")} style={{padding:"10px 20px",fontSize:14,minHeight:44}}><span className="lp-lg">התחילו להושיב</span><span className="lp-sm">התחילו</span></button>
        <button ref={burgerRef} type="button" className="lp-burger" aria-label="פתיחת התפריט" aria-expanded={menu} aria-controls="lp-menu" onClick={()=>setMenu(true)}><span/><span/><span/></button>
      </nav>

      {/* ─── תפריט בנייד: גיליון שיורד מלמעלה ─── */}
      <div className={`lp-menu${menu?" open":""}`} onClick={e=>{if(e.target===e.currentTarget)setMenu(false);}}>
        <div id="lp-menu" ref={menuRef} className="lp-menu-sheet" role="dialog" aria-modal="true" aria-label="תפריט האתר" onKeyDown={trapTab}>
          <div className="lp-menu-head">
            <span style={{display:"flex",alignItems:"center",gap:10,fontWeight:900,fontSize:20}}><SidorLogo size={36} id="lpMenuLogo"/>Sidor-IL</span>
            <button type="button" className="lp-menu-x" aria-label="סגירת התפריט" onClick={()=>setMenu(false)}>✕</button>
          </div>
          <ul>
            {[...LP_NAV,["faq","שאלות נפוצות"]].map(([id,l],i)=>(
              <li key={id} style={{"--d":`${(.08+i*.05).toFixed(2)}s`}}><a href={"#"+id} onClick={()=>setMenu(false)}>{l}</a></li>
            ))}
          </ul>
          <div className="lp-menu-cta">
            <button type="button" className="lp-btn lp-primary" onClick={go(()=>onOpenAuth("register"))}>התחילו להושיב</button>
            <button type="button" className="lp-btn lp-ghost" onClick={go(()=>onOpenAuth("login"))}>{loggedIn?"האירועים שלי":"כניסה לחשבון"}</button>
          </div>
          <div className="lp-menu-more">
            <button type="button" className="lp-hero-link" onClick={go(openJoin)}>ספקים ומפיקים: הצטרפות</button>
          </div>
        </div>
      </div>

      {/* ─── HERO: רקע בהיר, בועות צבע, מילים מודגשות במרקר, ובאנר צבעוני עם מסכי המוצר ─── */}
      <section id="top" className="lp-hero6">
        {/* תמונת אולם בהירה מאוד, רק כאווירה ברקע */}
        {/* תמונת רקע עמומה מאוד (20%): בטלפון מספיקה הגרסה הקטנה (146KB במקום 463KB) */}
        <div className="lp-hero6-photo" aria-hidden="true"><picture><source media="(max-width:900px)" srcSet="/img/u/1780888207019-dd9121069a81_800.webp"/><img className="lp-kb" src="/img/u/1780888207019-dd9121069a81_1800.webp" alt="" fetchpriority="low"/></picture></div>
        <div className="lp-blobs" aria-hidden="true"><i/><i/><i/><i/></div>
        <StringLights/>
        <div className="lp-hero" style={{maxWidth:1200,margin:"0 auto",width:"100%",display:"flex",alignItems:"center",gap:"5vw",position:"relative",zIndex:2}}>
          <div style={{flex:1,minWidth:280}}>
            <div className="lp-chiprow lp-rise" style={{"--d":".05s"}}>
              {[["סידורי הושבה","#F1EAFF","#5B3FD0"],["אישורי הגעה","#E3F8EF","#156B4A"],["הזמנות דיגיטליות","#FFE6F0","#A3245E"],["כניסה לאולם","#E2F1FF","#1D5FA0"]].map(([t,bg,c])=><span key={t} style={{background:bg,color:c}}>{t}</span>)}
            </div>
            <h1 className="lp-h1 lp-h1-6">
              <span className="lp-line"><span style={{"--d":".15s"}}>כל <mark className="mk1" style={{"--md":"1s"}}>אורח</mark>.</span></span>{" "}
              <span className="lp-line"><span style={{"--d":".27s"}}>במקום <mark className="mk2" style={{"--md":"1.2s"}}>הנכון</mark>.</span></span>
            </h1>

            {/* המשפט הראשון אומר במפורש מה זה (הכותרת היא דימוי) */}
            <p className="lp-rise" style={{"--d":".5s",fontSize:"clamp(17px,1.6vw,21px)",color:"#3E3555",lineHeight:1.7,marginBottom:30,maxWidth:"42ch"}}>
              <b style={{color:LP.ink}}>סידורי הושבה ואישורי הגעה לחתונות ואירועים.</b>{" "}
              גוררים אורחים לשולחנות על מפת האולם או נותנים ל-AI לסדר לפי משפחות וחברים, וכל אורח מקבל את מספר השולחן שלו ב-SMS או בוואטסאפ.
            </p>

            <div className="lp-hero-cta lp-rise" style={{"--d":".62s",display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
              <button className="lp-btn lp-primary" onClick={()=>onOpenAuth("register")} style={{padding:"13px 32px 13px 14px",fontSize:18,minHeight:58}}>התחילו לסדר את האולם<LpGo/></button>
              <a href="#how" className="lp-btn lp-ghost" style={{padding:"13px 30px",fontSize:18,minHeight:58}}>איך זה עובד</a>
            </div>
            {/* בועות צבעוניות: עובדות על השירות (לא מספרים מומצאים) */}
            <div className="lp-facts lp-facts6 lp-rise" style={{"--d":".72s"}}>
              {[["₪0",`עד ${FREE_SEATING_LIMIT} מוזמנים`,"#E3F8EF","#9FE6CB","#156B4A"],[`₪${BASIC_PRICE}`,"לאירוע גדול","#F1EAFF","#D9C6FF","#4A2C8F"],["WhatsApp","ו-SMS לאישורים","#FFE6F0","#FFB8D6","#A3245E"],["2 דקות","ופותחים אירוע","#FFF4D6","#FFD796","#7A4E00"]].map(([v,l,bg,bd,fg])=>(
                <div key={l} className="lp-fact" style={{"--bg":bg,"--bd":bd,"--fg":fg}}><b>{v}</b><span>{l}</span></div>
              ))}
            </div>
            <div className="lp-hero-cta lp-rise" style={{"--d":".8s",display:"flex",alignItems:"center",gap:"2px 20px",flexWrap:"wrap"}}>
              <button onClick={openJoin} className="lp-hero-link">ספקים ומפיקים: הצטרפות</button>
              <InstallAppButton label="הורדת האפליקציה" style={{background:"none",border:"none",borderRadius:0,padding:"12px 2px",fontSize:15,color:"#4A2C8F",textDecoration:"underline",textUnderlineOffset:4}}/>
            </div>
          </div>

          <div className="lp-demo lp-rise-side" style={{"--d":".38s"}}>
            <div className="lp-banner">
              <img className="lp-banner-img" src="/img/u/1775476793931-cb484f197760_1100.webp" alt=""/>
              <div className="lp-banner-tint" aria-hidden="true"/>
              <svg className="lp-spark" style={{top:-14,right:30}} width="34" height="34" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0C10.8 6 14 9.2 20 10C14 10.8 10.8 14 10 20C9.2 14 6 10.8 0 10C6 9.2 9.2 6 10 0Z" fill="#FFD796"/></svg>
              <svg className="lp-spark" style={{bottom:24,left:-12,animationDelay:"1.2s"}} width="26" height="26" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0C10.8 6 14 9.2 20 10C14 10.8 10.8 14 10 20C9.2 14 6 10.8 0 10C6 9.2 9.2 6 10 0Z" fill="#F0609E"/></svg>
              <div className="lp-mock" role="img" aria-label="מסכי Sidor-IL: מפת האולם במחשב ורשימת אישורי ההגעה בנייד">
                {/* הדפדפן בוחר את הגודל המתאים למסך (מוצגות ברוחב ~410/~160 במחשב) — במקום להוריד תמונה ענקית */}
                <div className="lp-mock-tab"><div className="lp-frame"><img sizes="(max-width:700px) 70vw, 420px" srcSet={LP_SRCSET["/landing/seating-v2.jpg"]} src="/landing/seating-v2-1440.jpg" alt="" width="1440" height="655" decoding="async" style={{display:"block",width:"100%",height:"auto"}}/></div></div>
                <div className="lp-mock-phone"><div className="lp-frame"><img sizes="(max-width:700px) 26vw, 165px" srcSet={LP_SRCSET["/landing/rsvp-v2.jpg"]} src="/landing/rsvp-v2-480.jpg" alt="" width="390" height="760" decoding="async" style={{display:"block",width:"100%",height:"auto"}}/></div></div>
                <span className="lp-bub b1" style={{"--d":"1s"}} aria-hidden="true"><i style={{background:LP.mint}}/>רחל כהן אישרה הגעה</span>
                <span className="lp-bub b2" style={{"--d":"1.2s"}} aria-hidden="true"><i style={{background:LP.violet}}/>שולחן 2 · משפחת החתן · 5/10</span>
                <span className="lp-bub b3" style={{"--d":"1.4s"}} aria-hidden="true"><i style={{background:LP.rose}}/>36 מוזמנים · 12 מגיעים</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── סרט נע: סוגי האירועים (דקורטיבי — אותו מידע מופיע בהמשך) ─── */}
      <div className="lp-ribbon" data-loop aria-hidden="true">
        <div className="lp-ribbon-track">
          {[...LP_RIBBON,...LP_RIBBON,...LP_RIBBON,...LP_RIBBON].map((t,i)=><span key={i} className={i%2?"o":undefined}>{t}<b>✦</b></span>)}
        </div>
      </div>

      {/* (המקטע "מאקסל מבולגן למפה ברורה" הוסר — "איך זה עובד" מספר את אותו הדבר) */}

      {/* ─── HOW: 3 שלבים בשורה אחת, כל אחד עם המסך שלו ─── */}
      <section id="how" className="lp-sheet" style={{background:"#EEF9F4",marginTop:28}}>
        <div className="lp-wrap">
          {sectionTitle("","מהרשימה לאולם","ב-3 צעדים","בלי לשבור את הראש מי יושב ליד מי. אתם מחליטים, המערכת עושה את העבודה.",{plain:true})}
          <div className="lp-steprow">
            {LP_STORY.map((s,i)=>(
              <div key={i} className="lp-stepcard lp-lift" data-reveal style={{"--d":`${(i*.08).toFixed(2)}s`,"--c":s.c}}>
                <div className="lp-stepart lp-sa" role="img" aria-label={s.alt} style={{background:["linear-gradient(160deg,#FFE3EF,#FFC9DF)","linear-gradient(160deg,#EBDFFF,#DDC7FF)","linear-gradient(160deg,#E7F5EC,#C9E9D8)"][i]}}>
                  {i===0&&<style>{SA_CSS}</style>}
                  <HowStepArt i={i}/>
                </div>
                <div className="lp-stepbody">
                  <span className="lp-stepnum2" aria-hidden="true">{i+1}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES: מפת אולם חיה במרכז, ו-6 יכולות בקשת מסביב ─── */}
      <section id="features" className="lp-sheet lp-fa-sec">
        <div className="lp-wrap"><FeatureArc onStart={()=>onOpenAuth("register")}/></div>
      </section>

      {/* ─── סיור במערכת: מסך אמיתי לכל יכולת ─── */}
      <section id="tour" className="lp-sheet" style={{background:"#FBF8FF"}}>
        <div className="lp-wrap">
          {sectionTitle("","ככה זה נראה","מבפנים","כל הכלים לאירוע במקום אחד, עם המסך האמיתי של כל אחד מהם.",{plain:true})}
          <ProductTour/>
        </div>
      </section>

      {/* ─── בכל מכשיר, מכל מקום ─── */}

      {/* ─── ספקים ומחירים מהקהילה (פיצ'ר למשתמשים רשומים) ─── */}
      <section id="vendors" className="lp-sheet" style={{background:"#FFF0F6"}}>
        <div className="lp-wrap">
          <VendorRing onOpen={()=>onOpenAuth("vendors")} cta={loggedIn?"לספקים ולמחירים":"נרשמים בחינם ומשווים"}/>
          <div style={{marginTop:56}}><FeaturedSuppliers onJoin={openJoin}/></div>
        </div>
      </section>

      {/* ─── EVENTS ──────────────────────────────────────────────── */}
      <section id="events" className="lp-sheet" style={{background:"#FFF2E6"}}>
        <div className="lp-wrap">
          {sectionTitle("לכל אירוע","איזה רגע מיוחד","אתם מושיבים?","מ-50 אורחים בברית ועד 600 בחתונה, Sidor-IL מסדרת את כולם.",{plain:true})}
          <div className="lp-ev-grid">
            {[
              {title:"חתונות",desc:"צד חתן, צד כלה, חברים והורים, כל אחד בשולחן הנכון",img:"/img/u/1775476793931-cb484f197760_700.webp"},
              {title:"בר/ת מצווה",desc:"שולחן ילדים, שולחן משפחה ושולחן חברי ההורים בקליק",img:"/img/u/1792587545791-dbff25ac7905_700.webp"},
              {title:"בריתות",desc:"הושבה מהירה גם כשיש רק כמה ימים להתארגן",img:"/img/u/1510154221590-ff63e90a136f_700.webp"},
              {title:"אירועים עסקיים",desc:"הושבה לפי מחלקות, VIP ולקוחות",img:"/img/u/1511578314322-379afb476865_700.webp"},
            ].map((ev,i)=>(
              <button key={ev.title} type="button" className="lp-ev-card" data-reveal="scale" style={{"--d":`${(i*.07).toFixed(2)}s`}} onClick={()=>onOpenAuth("register")}>
                <img src={ev.img} alt="" loading="lazy"/>
                <span style={{position:"relative",zIndex:1,display:"block",padding:"0 22px 24px 66px"}}>
                  <span style={{display:"block",fontSize:27,fontWeight:900,lineHeight:1.2,marginBottom:6}}>{ev.title}</span>
                  <span style={{display:"block",fontSize:15.5,lineHeight:1.55}}>{ev.desc}</span>
                </span>
                <span className="lp-ev-chip" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING: מה משלמים על ההושבה, ומה רק אם שולחים הודעות ─── */}
      <section id="pricing" className="lp-sheet" style={{background:LP.lav}}>
        <div className="lp-wrap">
          {sectionTitle("מחירים","מחירים","שקופים",`חינם עד ${FREE_SEATING_LIMIT} מוזמנים, ₪${BASIC_PRICE} לאירוע גדול יותר, והודעות SMS ו-WhatsApp לפי כמות, כשצריך.`)}
          {(()=>{
            const card=(pkg,i)=>(
              <div key={pkg.name} className={`lp-pwrap${pkg.highlight?" lp-glow":""}`} data-reveal style={{"--d":`${(i*.08).toFixed(2)}s`}}>
                <div className="lp-pcard" style={{background:pkg.highlight?"linear-gradient(160deg,#4A2C8F,#8A3FA8 60%,#C2397A)":"#fff",color:pkg.highlight?"#fff":LP.ink,boxShadow:pkg.accent?`inset 0 7px 0 ${pkg.accent}`:undefined}}>
                  <h3 style={{fontSize:19,fontWeight:900,marginBottom:8}}>{pkg.name}</h3>
                  <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:22}}>
                    <span className="lp-num" style={{fontSize:60,fontWeight:900,lineHeight:1}}>{pkg.price}</span>
                    <span style={{fontSize:16,color:pkg.highlight?"#E2DAEE":LP.muted}}>{pkg.desc}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:11,marginBottom:28,flex:1}}>
                    {pkg.features.map(f=>(
                      <div key={f} style={{display:"flex",alignItems:"flex-start",gap:10,fontSize:16,lineHeight:1.5,color:pkg.highlight?"#F1ECF7":"#3E3555"}}>
                        <span style={{flexShrink:0,marginTop:2}}><LpIcon name="check" color={pkg.highlight?LP.mint:"#1F7A4D"} size={19}/></span>{f}
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>onOpenAuth("register")} className={`lp-btn ${pkg.highlight?"lp-white":"lp-ghost"}`} style={{width:"100%",padding:"15px",fontSize:16}}>{pkg.cta}</button>
                </div>
              </div>
            );
            return(<>
              <div className="lp-price4">
                {[
                  {name:"חינם",accent:"#3CC8A0",price:"₪0",desc:`עד ${FREE_SEATING_LIMIT} מוזמנים`,features:["כל הכלים פתוחים מההרשמה","אישורי הגעה עם קישור אישי","הזמנה דיגיטלית ושליחה דרך קישור",`סידורי הושבה ומפת אולם עד ${FREE_SEATING_LIMIT} מוזמנים`,"תקציב, משימות ומתנות"],cta:"מתחילים בחינם"},
                  {name:"פתיחת הושבה",price:`₪${BASIC_PRICE}`,desc:"לאירוע",features:[`סידורי הושבה מעל ${FREE_SEATING_LIMIT} מוזמנים`,"מפת אולם, גרירה והושבה אוטומטית","מספרי שולחנות והדפסת סידור ההושבה","תשלום חד-פעמי, בלי מנוי"],cta:"מתחילים להושיב",highlight:true},
                  {name:"הודעות WhatsApp",accent:"#25B864",price:"₪1.8",desc:"לרשומה",features:["4 סבבי WhatsApp אוטומטיים","הזמנה ותזכורת למי שלא אישר","ביום האירוע עם מספר שולחן","בלי צורך בחבילה"],cta:"לפרטים"},
                  {name:"SMS",accent:"#5AA9FF",price:"₪0.5",desc:"להודעה",features:["בוחרים כמות בדיוק לפי הצורך","הזמנה, תזכורת, מספר שולחן ותודה","תוספת מוקד מתקשר: ₪0.8 לרשומה","בלי צורך בחבילה"],cta:"לפרטים"},
                ].map(card)}
              </div>
            </>);
          })()}
        </div>
      </section>

      {/* ─── שאלות נפוצות (מה שזוגות שואלים לפני שנרשמים) ─── */}
      <section id="faq" className="lp-sheet" style={{background:"#FFF9E6"}}>
        <div className="lp-faq-wrap">
          {sectionTitle("שאלות נפוצות","יש שאלות?","יש תשובות.","כל מה שכדאי לדעת לפני שמתחילים לסדר את האולם.",{mb:0,plain:true})}
          <div>
            {[
              ["כמה זה עולה?",`ההרשמה וכל הכלים חינם: אישורי הגעה, הזמנה דיגיטלית, תקציב ומשימות. סידורי הושבה בחינם עד ${FREE_SEATING_LIMIT} מוזמנים, ולאירוע גדול יותר פתיחה חד-פעמית של ₪${BASIC_PRICE}. הודעות SMS ו-WhatsApp נקנות לפי כמות, רק אם צריך.`],
              ["צריך להתקין משהו?","לא. Sidor-IL עובד בדפדפן במחשב, בטאבלט ובטלפון. אפשר גם להוסיף אותו למסך הבית בטלפון ולפתוח כמו אפליקציה."],
              ["איך האורחים מאשרים הגעה?","כל אורח מקבל קישור אישי להזמנה הדיגיטלית, בוואטסאפ או ב-SMS. הוא מאשר בלחיצה, בוחר כמה מגיעים, והתשובה מופיעה אצלכם מיד."],
              ["אפשר לעבוד על זה יחד עם בן/בת הזוג או ההורים?","כן. משתפים את האירוע לפי כתובת מייל, וכולם רואים ומעדכנים את אותה רשימה ואת אותה מפת אולם בזמן אמת."],
              ["מה קורה ביום האירוע?","בכניסה לאולם אפשר לחפש אורח לפי שם או לסרוק QR, לראות את מספר השולחן שלו ולסמן שהגיע. אפשר גם להזמין צוות הושבה או עמדת טאבלט."],
              ["הפרטים של האורחים שלנו שמורים?","כן. הפרטים מוצפנים בדרך, נשמרים בשרתים מאובטחים, ורק אתם ומי ששיתפתם רואים אותם. אנחנו לא משתמשים בהם לשיווק. הפרטים המלאים במדיניות הפרטיות."],
            ].map(([q,a],i)=>(
              <details key={q} className="lp-faq" data-reveal style={{"--d":`${(i*.05).toFixed(2)}s`}}>
                <summary>{q}<span className="lp-faq-ic" aria-hidden="true">+</span></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── המלצות / מספרים אמיתיים, ומיד אחריהם נקודות האמון — כל ההוכחות במקום אחד ─── */}
      <LandingTestimonials/>

      {/* ─── נקודות אמון לפני הכפתור האחרון (עובדות בלבד, בלי מספרים מומצאים) ─── */}
      <section aria-label="למה לסמוך עלינו" style={{padding:"10px 6vw 70px"}}>
        <div className="lp-wrap" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16}}>
          {[
            ["check","#1F7A4D","#E9FBF4","₪0 להתחלה",`בלי כרטיס אשראי, והושבה חינם עד ${FREE_SEATING_LIMIT} מוזמנים.`],
            ["users","#B8306F","#FFEFF5","בנוי לאירועים בישראל","עברית מלאה, חתונות, בריתות ובר/בת מצווה."],
            ["msg","#167A3E","#EAF8EF",SUPPORT_WA?"תמיכה בוואטסאפ":"תמיכה אישית","שואלים ומקבלים תשובה מאדם אמיתי."],
            ["map","#6A3FCF","#F1EAFF","הפרטים שלכם מוגנים","תקשורת מוצפנת, ורק אתם רואים את האורחים."],
          ].map(([ic,c,bg,t,d],i)=>(
            <div key={t} className="lp-lift" data-reveal style={{"--d":`${(i*.07).toFixed(2)}s`,background:bg,borderRadius:28,padding:"22px 22px 24px"}}>
              <span className="lp-circ" style={{background:"#fff",marginBottom:12}}><LpIcon name={ic} color={c} size={22}/></span>
              <h3 style={{fontSize:18,fontWeight:900,marginBottom:4}}>{t}</h3>
              <p style={{fontSize:16,color:"#3E3555",lineHeight:1.6}}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section id="contact" className="lp-cta3">
        <picture><source media="(max-width:900px)" srcSet="/img/u/1773005695300-14b62bc85ba0_800.webp"/><img className="lp-kb" src="/img/u/1773005695300-14b62bc85ba0_1600.webp" alt="" loading="lazy"/></picture>
        <div className="lp-cta-tint" aria-hidden="true"/>
        <LpBokeh n={7}/>
        <div className="lp-wrap" style={{position:"relative"}}>
          <h2 data-reveal style={{fontSize:"clamp(34px,5.4vw,72px)",fontWeight:900,marginBottom:14,letterSpacing:"-.025em",lineHeight:1.08}}>הגיע הזמן להושיב את כולם</h2>
          <p data-reveal style={{"--d":".08s",fontSize:19,marginBottom:32,lineHeight:1.65,maxWidth:"46ch"}}>פותחים אירוע, מעלים את המוזמנים, ותוך כמה דקות יש לכם סידור הושבה.</p>
          <div data-reveal style={{"--d":".16s",display:"flex",gap:14,flexWrap:"wrap"}}>
            <button onClick={()=>onOpenAuth("register")} className="lp-btn lp-white" style={{padding:"13px 32px 13px 14px",fontSize:18,minHeight:60}}>צרו סידור הושבה עכשיו<LpGo/></button>
            <a href={contactUrl()} {...(SUPPORT_WA?{target:"_blank",rel:"noopener noreferrer"}:{})} className="lp-btn lp-glass-btn" style={{padding:"13px 30px",fontSize:16,minHeight:60}}>דברו איתנו {CONTACT_BY}</a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <SiteFooter home onAuth={onOpenAuth} onVenue={()=>setVenuePage(true)} loggedIn={loggedIn}/>

      {/* כפתור הרשמה דביק — נייד בלבד, אחרי הפתיחה */}
      <div className={`lp-sticky${pastHero?" on":""}`} aria-hidden={!pastHero}>
        <button className="lp-btn lp-primary" tabIndex={pastHero?0:-1} onClick={()=>onOpenAuth("register")} style={{flex:1,padding:"12px 18px",fontSize:15,minHeight:48,whiteSpace:"nowrap"}}>התחילו בחינם</button>
      </div>

      {/* WhatsApp FAB (רק כשיש מספר) */}
      {SUPPORT_WA&&<a href={contactUrl()} target="_blank" rel="noopener noreferrer" aria-label="צ'אט בוואטסאפ"
        className="lp-wa-fab" style={{position:"fixed",bottom:20,left:20,background:"#0F7F40",color:"#fff",borderRadius:50,padding:"12px 20px",display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,boxShadow:"0 8px 24px rgba(37,211,102,.45)",zIndex:99,textDecoration:"none"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span className="lp-lg">לחץ לצ'אט</span>
      </a>}
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
const AUTH_DOWN="⚠️ שרת ההתחברות לא זמין כרגע. נסו שוב בעוד כמה דקות, ואם זה ממשיך  -  צרו איתנו קשר.";
// שגיאות רשת (השרת לא עונה) מגיעות בלי הודעה ברורה  -  מציגים הודעה מובנת
export const authErrorText=e=>{
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
  // כניסה אחת לכולם. חשבון ספק / מפיק נפתח אחרי שמפעילים אותו באדמין
  const [mode,setMode]=useState(initMode==="register"||initMode==="reset"?initMode:"login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [load,setLoad]=useState(false);
  const [googleLoad,setGoogleLoad]=useState(false);
  const [resetSent,setResetSent]=useState(false);
  // אחרי הרשמה: מסך "בדקו את המייל" במקום הטופס (כדי שלא ילחצו שוב "יצירת חשבון")
  const [signupSent,setSignupSent]=useState(""),[resent,setResent]=useState("");
  const resend=async()=>{setResent("…");try{const{error}=await sb.auth.resend({type:"signup",email:signupSent,options:{emailRedirectTo:window.location.origin}});setResent(error?"לא הצלחנו לשלוח שוב. נסו בעוד דקה":"✓ נשלח שוב");}catch{setResent("לא הצלחנו לשלוח שוב. נסו בעוד דקה");}};

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
        if(!data.session)setSignupSent(email.trim());
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
  // Esc סוגר, והפוקוס עובר לחלון
  const boxRef=useRef(null);
  useEffect(()=>{
    const esc=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",esc);
    const t=setTimeout(()=>boxRef.current?.querySelector("input,button")?.focus(),60);
    return()=>{window.removeEventListener("keydown",esc);clearTimeout(t);};
  },[]);

  const title=mode==="register"?["בואו נושיב את","כולם"]:mode==="reset"?["שחזור","סיסמה"]:["ברוכים","השבים"];
  const sub=mode==="register"?"פותחים חשבון בחינם ומתחילים לסדר את האולם":mode==="reset"?"נשלח לכם קישור לאיפוס הסיסמה":"אותה כניסה לאירועים, למפיקים ולספקים";
  const icon="🪑";
  const okMsg=err.startsWith("✅");
  return(<>
    <style>{`
      .ad-ov{position:fixed;inset:0;z-index:200;background:rgba(43,29,63,.42);backdrop-filter:blur(4px);animation:adFade 250ms cubic-bezier(0.23,1,0.32,1) both}
      .ad{position:fixed;z-index:201;right:0;left:0;bottom:0;margin:0 auto;max-width:480px;max-height:94vh;overflow:auto;direction:rtl;font-family:'Heebo',sans-serif;color:#2B1D3F;border-radius:32px 32px 0 0;padding:22px 24px 32px;
        background:radial-gradient(420px 260px at 90% 0%,#EFE4FF 0%,rgba(239,228,255,0) 70%),radial-gradient(380px 260px at 0% 20%,#FFE4F0 0%,rgba(255,228,240,0) 70%),#FFFBF7;
        box-shadow:0 -20px 60px -20px rgba(43,29,63,.45);animation:adUp 420ms cubic-bezier(0.32,0.72,0,1) both}
      @media(min-width:700px){.ad{top:50%;bottom:auto;transform:translateY(-50%);border-radius:32px;animation:adPop 260ms cubic-bezier(0.23,1,0.32,1) both}}
      @keyframes adFade{from{opacity:0}}
      @keyframes adUp{from{transform:translateY(100%)}}
      @keyframes adPop{from{opacity:0;transform:translateY(-50%) scale(.96)}to{opacity:1;transform:translateY(-50%)}}
      @media(prefers-reduced-motion:reduce){.ad,.ad-ov{animation:none}}
      .ad h2,.ad .ad-f{font-family:'Fredoka','Heebo',sans-serif}
      .ad h2{font-size:28px;font-weight:700;line-height:1.15;margin:0}
      .ad mark{color:inherit;padding:0 .12em;border-radius:.22em;background:linear-gradient(120deg,#FFD1E5,#FFB2D3)}
      .ad-x{position:absolute;top:16px;left:16px;width:40px;height:40px;border-radius:50%;border:none;background:#fff;color:#2B1D3F;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 8px 20px -10px rgba(43,29,63,.4)}
      .ad-ic{width:62px;height:62px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;background:linear-gradient(135deg,#FFE0EE,#E9DDFF);box-shadow:0 12px 26px -12px rgba(155,107,255,.6);margin-bottom:12px}
      .ad-acct{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
      .ad-acct button{border-radius:20px;padding:12px 8px;cursor:pointer;font-family:inherit;text-align:center;border:2px solid transparent;transition:border-color 200ms ease,background-color 200ms ease}
      .ad-g{width:100%;min-height:52px;background:#fff;color:#2B1D3F;border:none;border-radius:999px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 12px 26px -14px rgba(43,29,63,.4);font-family:'Fredoka','Heebo',sans-serif}
      .ad-or{display:flex;align-items:center;gap:10px;margin:16px 0;color:#5F5675;font-size:13px;font-weight:600}
      .ad-or:before,.ad-or:after{content:"";flex:1;height:1px;background:#E6DDF0}
      .ad-tabs{display:flex;background:#F1EAFF;border-radius:999px;padding:4px;margin-bottom:18px}
      .ad-tabs button{flex:1;min-height:42px;border-radius:999px;border:none;background:transparent;font-size:15px;font-weight:700;color:#5F5675;cursor:pointer;font-family:'Fredoka','Heebo',sans-serif;transition:background-color 200ms ease,color 200ms ease}
      .ad-tabs button[aria-pressed="true"]{background:#fff;color:#4A2C8F;box-shadow:0 8px 18px -10px rgba(74,44,143,.5)}
      .ad label{display:block;font-size:14px;font-weight:700;margin-bottom:6px;color:#3E3555}
      .ad input{width:100%;box-sizing:border-box;min-height:52px;background:#fff;border:1.5px solid #E6DDF5;border-radius:16px;padding:12px 16px;font-size:16px;color:#2B1D3F;outline:none;font-family:inherit;transition:border-color 200ms ease,box-shadow 200ms ease}
      .ad input:focus{border-color:#9B6BFF;box-shadow:0 0 0 4px rgba(155,107,255,.18)}
      .ad-go{width:100%;min-height:56px;border:none;border-radius:999px;color:#fff;font-size:17px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Fredoka','Heebo',sans-serif;background:linear-gradient(120deg,#FF8A65,#F0609E 45%,#9B6BFF);box-shadow:0 16px 32px -14px rgba(240,96,158,.7);transition:transform 160ms cubic-bezier(0.23,1,0.32,1),opacity 200ms ease}
      .ad-go:active{transform:scale(.97)}
      .ad-go:disabled{opacity:.5;cursor:default}
      .ad-link{background:none;border:none;padding:0;font-family:inherit;font-size:14px;color:#4A2C8F;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
      .ad button:focus-visible,.ad a:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}
      .ad-msg{border-radius:16px;padding:11px 14px;font-size:14px;margin-bottom:12px;line-height:1.5}
      .ad-fine{font-size:12px;color:#5F5675;text-align:center;line-height:1.6;margin:10px 0 0}
      .ad-fine a{color:#4A2C8F}
    `}</style>
    <div className="ad-ov" onClick={onClose}/>
    <div className="ad" ref={boxRef} role="dialog" aria-modal="true" aria-label={title.join(" ")}>
      <button type="button" className="ad-x" aria-label="סגירה" onClick={onClose}>✕</button>
      <div style={{textAlign:"center",marginBottom:20,paddingTop:6}}>
        <span className="ad-ic" aria-hidden="true">{icon}</span>
        <h2>{title[0]} <mark>{title[1]}</mark></h2>
        <div style={{fontSize:15,color:"#5F5675",marginTop:6}}>{sub}</div>
      </div>
      {signupSent?(
        <div role="status" style={{textAlign:"center",padding:"6px 0 6px"}}>
          <div style={{fontSize:42,marginBottom:10}} aria-hidden="true">📧</div>
          <div className="ad-f" style={{fontSize:20,fontWeight:700,marginBottom:6}}>כמעט סיימנו! בדקו את המייל</div>
          <p style={{fontSize:15,color:"#3E3555",margin:"0 0 6px",lineHeight:1.6}}>שלחנו קישור אימות ל-<b dir="ltr">{signupSent}</b>.</p>
          <p style={{fontSize:14,color:"#5F5675",margin:"0 0 18px",lineHeight:1.6}}>לוחצים על הקישור במייל, והחשבון נפתח. אם המייל לא הגיע תוך כמה דקות, בדקו בתיקיית הספאם.</p>
          <button type="button" className="ad-go" onClick={()=>{setSignupSent("");setResent("");setMode("login");}}>כבר אישרתי, לכניסה</button>
          <div style={{marginTop:12,fontSize:14,color:"#5F5675"}}>
            {resent?<span aria-live="polite">{resent}</span>:<>לא הגיע? <button type="button" onClick={resend} style={{background:"none",border:"none",padding:4,color:"#4A2C8F",fontWeight:700,textDecoration:"underline",textUnderlineOffset:3,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>שליחה חוזרת</button></>}
          </div>
        </div>
      ):mode==="reset"?(
        resetSent?(
          <div style={{textAlign:"center",padding:"10px 0 6px"}}>
            <div style={{fontSize:42,marginBottom:10}} aria-hidden="true">📧</div>
            <div className="ad-f" style={{fontSize:19,fontWeight:700,marginBottom:6}}>נשלח מייל לשחזור!</div>
            <div style={{fontSize:14,color:"#5F5675",marginBottom:18}}>בדקו את תיבת הדואר ולחצו על הקישור לאיפוס הסיסמה.</div>
            <button type="button" className="ad-go" onClick={()=>{setMode("login");setResetSent(false);}}>חזרה לכניסה</button>
          </div>
        ):(
          <div>
            <label htmlFor="ad-mail">אימייל</label>
            <input id="ad-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" onKeyDown={e=>e.key==="Enter"&&email&&submit()} style={{marginBottom:14}}/>
            {err&&<div className="ad-msg" role="alert" style={{background:"#FEF2F2",color:"#B42318"}}>{err}</div>}
            <button type="button" className="ad-go" onClick={submit} disabled={load||!email}>{load?<><Spinner size={18} color="#fff"/>שולח...</>:"שליחת קישור לאיפוס"}</button>
            <p style={{textAlign:"center",marginTop:14}}><button type="button" className="ad-link" onClick={()=>setMode("login")}>חזרה לכניסה</button></p>
          </div>
        )
      ):(
        <div>
          <button type="button" className="ad-g" onClick={loginWithGoogle} disabled={googleLoad}>
            {googleLoad?<Spinner size={20} color="#4285F4"/>:<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
            {googleLoad?"מתחבר...":"המשך עם Google"}
          </button>
          <div className="ad-or">או עם אימייל</div>
          <div className="ad-tabs">
            {[["login","כניסה"],["register","הרשמה"]].map(([v,l])=>(
              <button key={v} type="button" aria-pressed={mode===v} onClick={()=>{setMode(v);setErr("");}}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:12}}>
            <div><label htmlFor="ad-mail">אימייל</label><input id="ad-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div>
            <div><label htmlFor="ad-pass">סיסמה{mode==="register"?" (לפחות 6 תווים)":""}</label><input id="ad-pass" type="password" value={pass} onChange={e=>setPass(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          </div>
          {mode==="login"&&<div style={{textAlign:"left",marginBottom:14}}><button type="button" className="ad-link" onClick={()=>{setMode("reset");setErr("");}}>שכחתי סיסמה</button></div>}
          {err&&<div className="ad-msg" role="alert" style={{background:okMsg?"#E9FBF0":"#FEF2F2",color:okMsg?"#1F7A4D":"#B42318"}}>{err}</div>}
          <button type="button" className="ad-go" onClick={submit} disabled={load||!email||!pass}>
            {load?<><Spinner size={18} color="#fff"/>מעבד...</>:mode==="login"?"כניסה":"יצירת חשבון"}
          </button>
          <p style={{fontSize:14,color:"#5F5675",textAlign:"center",marginTop:14}}>
            {mode==="login"?"אין חשבון? ":"יש חשבון? "}
            <button type="button" className="ad-link" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"הרשמה":"כניסה"}</button>
          </p>
          <p className="ad-fine">בהרשמה או בכניסה (גם עם Google) אתם מסכימים ל<a href="#/terms" onClick={onClose}>תנאי השימוש</a> ול<a href="#/privacy" onClick={onClose}>מדיניות הפרטיות</a></p>
          {/* הודעה לפי סעיף 11 לחוק הגנת הפרטיות (תיקון 13): חובה / מטרה / בעל השליטה / מי מקבל / עיון ותיקון */}
          <p className="ad-fine" style={{marginTop:6}}>אין חובה חוקית למסור את הפרטים, אך בלעדיהם אי אפשר לפתוח חשבון. האימייל משמש להתחברות ולעדכונים על החשבון. בעל השליטה במידע: Sidor-IL (sidoril2026@gmail.com). המידע נשמר אצל ספקי התשתית שלנו בלבד, ואפשר לעיין בו ולבקש לתקנו.</p>
        </div>
      )}
    </div>
  </>);
}

// ─── EVENT PICKER ─────────────────────────────────────────────────────────────
const b64ToBytes=s=>{const p="=".repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(b,c=>c.charCodeAt(0));};
const bytesToB64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone=()=>window.matchMedia?.("(display-mode: standalone)").matches||navigator.standalone===true;
const pushSupported=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
// הפעלת התראות במכשיר הנוכחי: "on" / "denied" / "off" (המשתמש לא אישר). זורק אם השרת לא זמין
async function enablePush(){
  const perm=await Notification.requestPermission();
  if(perm!=="granted")return perm==="denied"?"denied":"off";
  const reg=await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const{data,error}=await sb.functions.invoke("push-notify",{body:{action:"key"}});
  if(error||!data?.publicKey)throw new Error("לא הצלחנו להתחבר לשרת ההתראות");
  const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(data.publicKey)});
  const{error:e2}=await sb.from("push_subscriptions").upsert({endpoint:sub.endpoint,p256dh:bytesToB64(sub.getKey("p256dh")),auth:bytesToB64(sub.getKey("auth")),user_agent:navigator.userAgent.slice(0,200)});
  if(e2)throw e2;
  return "on";
}
// ─── הצעה במסך הבית של האירוע: "לקבל התראה כשאורח מאשר?" ───
// מופיעה רק כשהמכשיר תומך, ההתראות עוד לא הופעלו בו ולא נחסמו. "לא עכשיו" מסתיר ל-14 יום
const PUSH_ASK_KEY="sidor_push_ask";
const PUSH_ASK_CSS=`
.pa{position:relative;display:flex;gap:14px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid #EDE4F7;border-radius:18px;padding:14px 16px;box-shadow:0 10px 28px -18px rgba(91,60,140,.45);overflow:hidden}.pa-ic{flex:none;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:linear-gradient(140deg,#FFE9E1,#FCE1EE 55%,#EFE6FF)}
.pa-ic span{display:inline-block;transform-origin:50% 8%}
@media (prefers-reduced-motion:no-preference){.pa{animation:paIn .42s cubic-bezier(.23,1,.32,1) both}.pa-ic span{animation:paRing 1.1s .5s ease-in-out 2}}
@keyframes paIn{from{opacity:0;transform:translateY(8px)}}
@keyframes paRing{0%,100%{transform:rotate(0)}15%{transform:rotate(16deg)}35%{transform:rotate(-14deg)}55%{transform:rotate(9deg)}75%{transform:rotate(-5deg)}}
.pa-tx{flex:1 1 200px;min-width:0}
.pa-t{font-size:15px;font-weight:800;color:#2B1D3F;line-height:1.4}
.pa-d{font-size:13px;color:#5E5470;line-height:1.5;margin-top:2px}
.pa-bt{display:flex;gap:8px;flex-wrap:wrap}
.pa-go{border:none;border-radius:100px;padding:10px 18px;font:800 14px/1 'Heebo',sans-serif;color:#fff;cursor:pointer;background:linear-gradient(120deg,#FF8A65,#F0609E,#9B6BFF);min-height:40px}
.pa-no{border:none;background:none;border-radius:100px;padding:10px 12px;font:700 13px/1 'Heebo',sans-serif;color:#6E6585;cursor:pointer;min-height:40px}
.pa-go:disabled{opacity:.6;cursor:default}
.pa-go:focus-visible,.pa-no:focus-visible{outline:3px solid #9B6BFF;outline-offset:2px}`;
export function PushAsk({ style }) {
  const [show,setShow]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  useEffect(()=>{let off=false;(async()=>{
    try{
      if(!pushSupported()||Notification.permission==="denied")return;
      const until=Number(localStorage.getItem(PUSH_ASK_KEY)||0);if(until>Date.now()||sessionStorage.getItem(PUSH_ASK_KEY))return;
      const reg=await navigator.serviceWorker.getRegistration("/sw.js").catch(()=>null);
      const sub=await reg?.pushManager.getSubscription().catch(()=>null);
      if(!sub&&!off)setShow(true);
    }catch{}
  })();return()=>{off=true;};},[]);
  if(!show)return null;
  // בלי הסכמה לשמירה במכשיר: מוסתר רק עד סגירת האפליקציה
  const later=()=>{optSet(PUSH_ASK_KEY,String(Date.now()+14*864e5));try{sessionStorage.setItem(PUSH_ASK_KEY,"1");}catch{}setShow(false);};
  const go=async()=>{
    setBusy(true);setMsg("");
    try{
      const r=await enablePush();
      if(r==="on"){setMsg("✅ ההתראות הופעלו. מעכשיו תקבלו כאן עדכון על כל אישור הגעה");setTimeout(()=>setShow(false),3500);}
      else if(r==="denied"){setMsg("ההתראות נחסמו בטלפון. אפשר לאפשר אותן בהגדרות הטלפון ← אפליקציות ← Sidor-IL ← התראות");}
      else later();
    }catch(e){setMsg("❌ "+(e.message||"ההפעלה לא הצליחה, נסו שוב"));}
    setBusy(false);
  };
  return(
    <div className="pa" role="region" aria-label="התראות" style={style}>
      <style>{PUSH_ASK_CSS}</style>
      <div className="pa-ic" aria-hidden="true"><span>🔔</span></div>
      <div className="pa-tx">
        <div className="pa-t">{msg||"לקבל התראה כשאורח מאשר הגעה?"}</div>
        {!msg&&<div className="pa-d">ישר לטלפון, גם כשהאפליקציה סגורה. אפשר לכבות בכל רגע בהגדרות.</div>}
      </div>
      {!msg.startsWith("✅")&&<div className="pa-bt">
        <button type="button" className="pa-go" onClick={go} disabled={busy}>{busy?"מפעיל...":"הפעלת התראות"}</button>
        <button type="button" className="pa-no" onClick={later}>לא עכשיו</button>
      </div>}
    </div>
  );
}
export function PushDevice() {
  const supported="serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
  const [state,setState]=useState("checking"); // checking | unsupported | ios | denied | off | on
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  useEffect(()=>{(async()=>{
    if(!supported){setState(isIOS()&&!isStandalone()?"ios":"unsupported");return;}
    if(Notification.permission==="denied"){setState("denied");return;}
    const reg=await navigator.serviceWorker.getRegistration("/sw.js").catch(()=>null);
    const sub=await reg?.pushManager.getSubscription().catch(()=>null);
    setState(sub?"on":"off");
  })();},[]);
  const enable=async()=>{
    setBusy(true);setMsg("");
    try{
      const r=await enablePush();
      if(r!=="on"){setState(r);setBusy(false);return;}
      setState("on");setMsg("✅ ההתראות הופעלו במכשיר הזה");
    }catch(e){setMsg("❌ "+(e.message||"ההפעלה נכשלה"));}
    setBusy(false);
  };
  const disable=async()=>{
    setBusy(true);setMsg("");
    try{
      const reg=await navigator.serviceWorker.getRegistration("/sw.js");
      const sub=await reg?.pushManager.getSubscription();
      if(sub){await sb.from("push_subscriptions").delete().eq("endpoint",sub.endpoint);await sub.unsubscribe();}
      setState("off");
    }catch(e){setMsg("❌ "+(e.message||"הכיבוי נכשל"));}
    setBusy(false);
  };
  const test=async()=>{
    setBusy(true);setMsg("");
    const{data,error}=await sb.functions.invoke("push-notify",{body:{action:"test"}});
    setMsg(error||!data?.sent?"❌ התראת הבדיקה לא נשלחה":"📨 נשלחה התראת בדיקה");
    setBusy(false);
  };
  const btn=(primary)=>({background:primary?"#3A2464":"#fff",color:primary?"#fff":"#3A2464",border:primary?"none":"1.5px solid #D6CCE6",borderRadius:10,padding:"9px 14px",fontSize:13,fontWeight:800,cursor:busy?"default":"pointer",fontFamily:"inherit",opacity:busy?.6:1});
  return(
    <div style={{background:state==="on"?"#F0FFF4":"#F7F3FB",border:`1px solid ${state==="on"?"#9AE6B4":"#E9DFF3"}`,borderRadius:12,padding:"12px 14px",marginBottom:6}}>
      <div style={{fontSize:13,fontWeight:800,color:"#1a1a1a",marginBottom:4}}>📲 התראות במכשיר הזה {state==="on"&&<span style={{color:"#276749"}}>· פעילות</span>}</div>
      <div style={{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:8}}>
        {state==="ios"?"באייפון: פתחו את האתר בספארי ← שיתוף ← \"הוספה למסך הבית\", ואז הפעילו כאן התראות מתוך האייקון."
          :state==="unsupported"?"הדפדפן הזה לא תומך בהתראות. נסו בכרום או באדג׳."
          :state==="denied"?"ההתראות נחסמו לאתר. אפשרו אותן בהגדרות הדפדפן (סמל המנעול ליד הכתובת) ונסו שוב."
          :"קבלו התראה לטלפון או למחשב כשאורח מאשר או מבטל הגעה, גם כשהאתר סגור."}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {state==="off"&&<button onClick={enable} disabled={busy} style={btn(true)}>{busy?"מפעיל...":"🔔 הפעל התראות במכשיר הזה"}</button>}
        {state==="on"&&<><button onClick={test} disabled={busy} style={btn(true)}>📨 שלח התראת בדיקה</button><button onClick={disable} disabled={busy} style={btn(false)}>כבה במכשיר הזה</button></>}
      </div>
      {msg&&<div role="status" style={{fontSize:12,fontWeight:700,marginTop:8,color:msg.startsWith("❌")?"#C53030":"#276749"}}>{msg}</div>}
    </div>
  );
}

// ─── המלצות לקוחות (testimonials): הלקוח שולח, האדמין מאשר, רק מאושרות בדף הבית ───
export const Stars=({value,onChange,size=22})=>(
  <div style={{display:"flex",gap:2,direction:"ltr"}} role={onChange?"radiogroup":undefined} aria-label="דירוג">
    {[1,2,3,4,5].map(n=>onChange
      ?<button key={n} type="button" onClick={()=>onChange(n)} aria-label={`${n} כוכבים`} aria-pressed={value===n} style={{background:"none",border:"none",cursor:"pointer",fontSize:size,padding:0,color:n<=value?"#F5B301":"#D9D3E3"}}>★</button>
      :<span key={n} aria-hidden="true" style={{fontSize:size,color:n<=value?"#F5B301":"#D9D3E3"}}>★</span>)}
  </div>
);
// "דרגו אותנו": אותו דירוג נשמר באתר (מופיע אחרי אישור) ומתפרסם גם בגוגל בלחיצה, עם הטקסט מועתק ומספר הכוכבים
function LandingTestimonials() {
  const [items,setItems]=useState([]),[stats,setStats]=useState(null);
  useEffect(()=>{
    sb.from("testimonials").select("id,name,event_label,text,rating").eq("approved",true).order("created_at",{ascending:false}).limit(6).then(({data})=>setItems(data||[])).catch(()=>{});
    sb.rpc("public_stats").then(({data})=>setStats(data||null)).catch(()=>{});
  },[]);
  const showStats=stats&&stats.events>=20;
  if(!items.length&&!showStats)return null;
  // רק מספרים (עוד אין המלצות): פס אחד רחב — הכותרת בצד אחד והמספרים פרוסים בצד השני, בלי חצי מסך ריק
  if(!items.length)return(
    <section id="reviews" aria-label="Sidor-IL במספרים" style={{padding:"34px 2vw 62px"}}>
      <style>{`.lp-nums{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:28px 48px;flex-wrap:wrap;background:#fff;border-radius:40px;padding:34px 48px;box-shadow:0 30px 60px -44px rgba(91,60,140,.5),inset 0 0 0 1px #F1E9F8}
        .lp-nums h2{margin:0;font-size:clamp(28px,3.2vw,42px);line-height:1.1;color:#2B1D3F}
        .lp-nums dl{display:flex;margin:0;flex-wrap:wrap}
        .lp-nums dl div{padding:4px 34px;text-align:center}
        .lp-nums dl div+div{box-shadow:inset -1px 0 0 #EFE6F7}
        .lp-nums dd{margin:0;font:700 clamp(30px,3.4vw,46px)/1.05 'Fredoka','Heebo',sans-serif;color:#7C3AED;font-variant-numeric:tabular-nums}
        .lp-nums dt{font-size:14px;color:#5F5675;font-weight:700;margin-top:6px}
        @media(max-width:700px){.lp-nums{padding:26px 14px;border-radius:30px;justify-content:center;text-align:center}.lp-nums dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%}.lp-nums dl div{padding:4px 6px}.lp-nums dd{font-size:clamp(20px,6.4vw,28px)}.lp-nums dt{font-size:12px}}`}</style>
      <div className="lp-nums" data-reveal>
        <h2>Sidor-IL במספרים</h2>
        <dl>
          {[[stats.events,"אירועים נוהלו"],[stats.guests,"אורחים הוזמנו"],[stats.seated,"אורחים הושבו"]].map(([v,l])=>(
            <div key={l} style={{display:"flex",flexDirection:"column-reverse"}}><dt>{l}</dt><dd>{Number(v).toLocaleString("he-IL")}+</dd></div>
          ))}
        </dl>
      </div>
    </section>
  );
  return(
    <section id="reviews" style={{padding:"70px 6vw",background:"#fff"}}>
      <div style={{maxWidth:1120,margin:"0 auto"}}>
        {/* "מה אומרים עלינו" רק כשיש המלצות אמיתיות; כשיש רק מספרים — כותרת שמתארת מספרים */}
        <h2 style={{fontSize:"clamp(32px,4.6vw,60px)",fontWeight:900,letterSpacing:"-.025em",lineHeight:1.1,margin:"0 0 10px",color:"#2B1D3F"}}>{items.length?"מה אומרים עלינו":"Sidor-IL במספרים"}</h2>
        {showStats&&<div style={{display:"flex",gap:14,flexWrap:"wrap",margin:"18px 0 30px"}}>
          {[[stats.events,"אירועים נוהלו"],[stats.guests,"אורחים הוזמנו"],[stats.seated,"אורחים הושבו"]].map(([v,l])=>(
            <div key={l} style={{background:"#F8F3FF",borderRadius:18,padding:"14px 24px",textAlign:"center",minWidth:140}}>
              <div style={{fontSize:30,fontWeight:900,color:"#9147D6"}}>{Number(v).toLocaleString("he-IL")}+</div>
              <div style={{fontSize:13,color:"#6E6585",fontWeight:700}}>{l}</div>
            </div>
          ))}
        </div>}
        {items.length>0&&<a href={GOOGLE_PROFILE_URL} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:4,fontSize:15,fontWeight:800,color:"#1a73e8",textDecoration:"none"}}><span style={{color:"#F4B400"}} aria-hidden="true">★</span> קראו עלינו גם בגוגל</a>}
        {items.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginTop:18}}>
          {items.map(t=>(
            <figure key={t.id} style={{margin:0,background:"#FBF8FD",border:"1px solid #EFE6F5",borderRadius:20,padding:20}}>
              {t.rating&&<Stars value={t.rating} size={18}/>}
              <blockquote style={{margin:"10px 0 12px",fontSize:15,lineHeight:1.8,color:"#3E3555"}}>"{t.text}"</blockquote>
              <figcaption style={{fontSize:13,fontWeight:800,color:"#2B1D3F"}}>{t.name}{t.event_label?<span style={{fontWeight:500,color:"#6E6585"}}> · {t.event_label}</span>:null}</figcaption>
            </figure>
          ))}
        </div>}
      </div>
    </section>
  );
}

// ─── פרופיל מפיק: השם, הנייד והלוגו שמוצגים בתחתית ההזמנה לאורחים (רק לחשבון מפיק) ───
const GOOGLE_PROFILE_URL="https://g.page/r/CSW-aObv3rBVEBM";
export const FREE_SEATING_LIMIT=50;
export const LAST_SCREEN_KEY="sidor_last_screen";
const RESTORABLE_SCREENS=["home","settings","seating","rsvp","import","budget","packages","sms","whatsapp","user_settings","settings_event","invite","add","contacts","checkin","gifts","tasks","vendors"];
// פתיחה חדשה של האתר/האפליקציה (לא רענון באותה לשונית) מתחילה במסך הראשי
const FRESH_OPEN=(()=>{try{const f=!sessionStorage.getItem("sidor_tab");sessionStorage.setItem("sidor_tab","1");return f;}catch{return false;}})();
// מסך לפתוח בכניסה הבאה לאירוע (למשל "לספקים ולמחירים" מדף הבית)
// המסך שאליו נכנסים בפתיחת האירוע הבאה (חד פעמי). דרך פונקציות, כי גם מערכת הניהול (קובץ נפרד) קובעת אותו
export const PENDING_SCREEN={v:null};
export const setPendingScreen=v=>{PENDING_SCREEN.v=v;};
export const readLastScreen=eventId=>{
  try{const s=JSON.parse(localStorage.getItem(LAST_SCREEN_KEY)||"null");
    if(s&&s.eventId===eventId&&RESTORABLE_SCREENS.includes(s.screen))return FRESH_OPEN?{...s,screen:"home"}:s;}catch{}
  return null;
};

export const SUPPLIER_CATS=[["venue","🏛️","אולמות וגני אירועים"],["catering","🍽️","קייטרינג"],["photo","📸","צלמי סטילס"],["video","🎥","צלמי וידאו"],["dj","🎧","DJ"],["band","🎷","להקות ונגנים"],
  ["producer","🎬","הפקת אירועים"],["design","💐","עיצוב ופרחים"],["dress","👗","שמלות כלה וערב"],["suit","🤵","חליפות חתן"],["makeup","💄","איפור ושיער"],["attraction","🎡","אטרקציות"],
  ["magnets","🧲","מגנטים ועמדות צילום"],["bar","🍸","בר ושייקים"],["cake","🎂","עוגות וקינוחים"],["invitations","💌","הזמנות ומיתוג"],["rabbi","📜","רבנים ועורכי טקס"],
  ["transport","🚌","הסעות"],["jewelry","💍","טבעות ותכשיטים"],["fireworks","🎆","זיקוקים ואפקטים"],["lighting","💡","תאורה והגברה"],["other","✨","אחר"]];
export const SUPPLIER_CAT=Object.fromEntries(SUPPLIER_CATS.map(([k,i,l])=>[k,{icon:i,label:l}]));
export const SUPPLIER_REGIONS=[["all","כל הארץ"],["north","צפון"],["center","מרכז ושרון"],["jerusalem","ירושלים והסביבה"],["south","דרום"]];
export const SUPPLIER_REGION=Object.fromEntries(SUPPLIER_REGIONS);
export const isFeatured=v=>v.featured&&(!v.featured_until||v.featured_until>=new Date().toISOString().slice(0,10));
const isNewVendor=v=>Date.now()-new Date(v.created_at).getTime()<30*864e5;
// הקטנת תמונה בדפדפן לפני העלאה (JPEG, עד max פיקסלים בצלע הארוכה) — חוסך אחסון וזמן העלאה
export const waLink=p=>{const n=normPhone(p);return n?`https://wa.me/972${n.slice(1)}`:null;};
const extLink=u=>!u?null:/^https?:\/\//i.test(u)?u:`https://${u}`;

// בועת "הצטרפות ספקים" בדף הבית
const JOIN_CSS=`
  .lp-join{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:center;gap:22px;max-width:980px;margin:0 auto;padding:22px 26px 22px 22px;border-radius:999px;color:#fff;
    background:linear-gradient(250deg,#4E23A8 0%,#7F4DE8 42%,#D4458A 80%,#E8603F 100%);box-shadow:0 34px 70px -34px rgba(155,60,170,.85),0 0 0 8px rgba(255,255,255,.7),0 0 0 9px rgba(155,107,255,.25)}
  .lp-join::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(120px 80px at 18% 20%,rgba(255,255,255,.35),transparent 70%),radial-gradient(160px 90px at 82% 110%,rgba(255,255,255,.25),transparent 70%)}
  .lp-join-dots i{position:absolute;z-index:-1;border-radius:50%;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.4)}
  .lp-join-dots i:nth-child(1){width:46px;height:46px;top:-14px;left:30%}
  .lp-join-dots i:nth-child(2){width:18px;height:18px;bottom:10px;left:42%}
  .lp-join-dots i:nth-child(3){width:28px;height:28px;top:14px;left:58%}
  .lp-join-dots i:nth-child(4){width:12px;height:12px;bottom:18px;right:34%}
  .lp-join-dots i:nth-child(5){width:64px;height:64px;bottom:-30px;left:20%}
  .lp-join-ics{display:flex;flex-shrink:0}
  .lp-join-ics span{width:58px;height:58px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:27px;box-shadow:0 12px 24px -12px rgba(43,29,63,.6);border:3px solid rgba(255,255,255,.7)}
  .lp-join-ics span+span{margin-inline-start:-16px}
  .lp-join-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  .lp-join-txt b{font:900 clamp(19px,2vw,24px)/1.2 'Fredoka','Heebo',sans-serif}
  .lp-join-txt span{font-size:15.5px;line-height:1.5;opacity:.96}
  .lp-join-btn{flex-shrink:0;min-height:52px;padding:0 26px;border:none;border-radius:999px;background:#fff;color:#2B1D3F;font:800 16px 'Fredoka','Heebo',sans-serif;cursor:pointer;box-shadow:0 14px 28px -14px rgba(43,29,63,.7);transition:scale 160ms cubic-bezier(0.23,1,0.32,1)}
  .lp-join-btn:active{scale:.97}
  .lp-join-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
  @media(hover:hover) and (pointer:fine){.lp-join-btn:hover{scale:1.04}}
  @keyframes lpJoinFloat{50%{transform:translateY(-6px)}}
  .lp-motion .lp-join-ics span{animation:lpJoinFloat 4.5s ease-in-out infinite}
  .lp-motion .lp-join-ics span:nth-child(2){animation-delay:-1.5s}.lp-motion .lp-join-ics span:nth-child(3){animation-delay:-3s}
  @media(prefers-reduced-motion:reduce){.lp-motion .lp-join-ics span{animation:none}}
  @media(max-width:760px){
    .lp-join{flex-direction:column;text-align:center;border-radius:36px;padding:26px 20px 22px;gap:14px}
    .lp-join-ics span{width:50px;height:50px;font-size:23px}
    .lp-join-btn{width:100%}
  }
`;

// דף הבית: ספקים מובילים (מאושרים + מסומנים כמובילים), והזמנה לספקים להצטרף
function FeaturedSuppliers({ onJoin }) {
  const [list,setList]=useState([]),[open,setOpen]=useState(null);
  useEffect(()=>{sb.from("vendor_profiles").select("*").eq("status","approved").eq("featured",true).then(({data})=>setList((data||[]).filter(isFeatured).slice(0,8)),()=>{});},[]);
  return(
    <div style={{marginBottom:28}}>
      {list.length>0&&<>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{fontSize:18,fontWeight:900,color:LP.ink}}>⭐ ספקים מובילים</div>
          <div style={{flex:1,height:1,background:"#F0E8F4"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14,marginBottom:14}}>
          {list.map(v=><SupplierCard key={v.user_id} v={v} onOpen={setOpen}/>)}
        </div>
      </>}
      <style>{JOIN_CSS}</style>
      <div className="lp-join">
        <span className="lp-join-dots" aria-hidden="true"><i/><i/><i/><i/><i/></span>
        <span className="lp-join-ics" aria-hidden="true"><span>📸</span><span>🎧</span><span>🏛️</span></span>
        <span className="lp-join-txt"><b>צלמים, DJ, אולמות וספקים?</b><span>פרופיל עסק בחינם, מול זוגות ומשפחות שמתכננים אירוע</span></span>
        <button onClick={onJoin} className="lp-join-btn">דברו איתנו על הצטרפות ←</button>
      </div>
      <SupplierDetails v={open} onClose={()=>setOpen(null)}/>
    </div>
  );
}

// כרטיס ספק (ברשימה ובדף הבית)
export function SupplierCard({ v, onOpen, compact=false }) {
  const cat=SUPPLIER_CAT[v.category]||SUPPLIER_CAT.other;
  return(
    <button onClick={()=>onOpen?.(v)} className="sx-btn" style={{all:"unset",cursor:"pointer",display:"flex",flexDirection:"column",background:"#fff",borderRadius:18,overflow:"hidden",border:`1.5px solid ${isFeatured(v)?"#F3D08A":"#F0E8F8"}`,boxShadow:isFeatured(v)?"0 10px 28px -14px rgba(232,176,74,.6)":"0 2px 12px rgba(155,107,255,.08)",fontFamily:"'Heebo',sans-serif",direction:"rtl",textAlign:"right"}}>
      <div style={{position:"relative",height:compact?110:140,background:v.photos?.[0]?`#F6F0FF url("${v.photos[0]}") center/cover`:"linear-gradient(135deg,#FFF4EE,#F6F0FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>
        {!v.photos?.[0]&&cat.icon}
        <div style={{position:"absolute",top:8,right:8,display:"flex",gap:5}}>
          {/* "מקודם": מיקום מוביל ניתן בתשלום, ולכן מסומן כקידום (שקיפות כלפי הגולשים) */}
          {isFeatured(v)&&<span title="ספק מוביל — מקום בולט בתשלום" style={{background:"#FFF4DC",color:"#7A4E00",border:"1px solid #E8B04A",borderRadius:100,padding:"3px 9px",fontSize:12,fontWeight:900}}>⭐ מוביל · מקודם</span>}
          {isNewVendor(v)&&<span style={{background:"#E3F8F1",color:"#14614A",border:"1px solid #3CC8A0",borderRadius:100,padding:"3px 9px",fontSize:12,fontWeight:900}}>חדש</span>}
        </div>
      </div>
      <div style={{padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
        {v.logo_url?<img src={v.logo_url} alt="" style={{width:44,height:44,borderRadius:12,objectFit:"cover",border:"1px solid #F0E8F8",flexShrink:0}}/>
          :<span style={{width:44,height:44,borderRadius:12,background:"#F6F0FF",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cat.icon}</span>}
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:15,fontWeight:900,color:"#2B1D3F",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.business_name}{v.verified&&<span title="עסק רשום שנבדק" style={{color:"#3CC8A0",marginRight:4}}>✓</span>}</div>
          <div style={{fontSize:12,color:"#7A6F8C"}}>{cat.icon} {cat.label}{v.region?` · ${SUPPLIER_REGION[v.region]}`:""}{v.price_from?` · החל מ-₪${Number(v.price_from).toLocaleString()}`:""}</div>
        </div>
      </div>
    </button>
  );
}

// פרטי ספק מלאים: גלריה, תיאור ויצירת קשר
export function SupplierDetails({ v, onClose, user, event, own=false }) {
  const [img,setImg]=useState(0);
  useEffect(()=>{setImg(0);},[v?.user_id]);
  if(!v)return null;
  const cat=SUPPLIER_CAT[v.category]||SUPPLIER_CAT.other,photos=v.photos||[];
  const b={display:"inline-flex",alignItems:"center",gap:6,borderRadius:12,padding:"10px 14px",fontSize:14,fontWeight:800,textDecoration:"none",fontFamily:"inherit"};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(43,29,63,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" role="dialog" aria-label={v.business_name} style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:620,maxHeight:"92vh",overflowY:"auto",fontFamily:"'Heebo',sans-serif"}}>
        {photos.length>0&&<div style={{position:"relative",background:"#111"}}>
          <img src={photos[img]} alt={`${v.business_name} · תמונה ${img+1}`} style={{width:"100%",maxHeight:380,objectFit:"contain",display:"block"}}/>
          {photos.length>1&&<div style={{display:"flex",gap:6,padding:8,overflowX:"auto",background:"#1a1a1a"}}>
            {photos.map((p,i)=><img key={p} src={p} alt="" onClick={()=>setImg(i)} style={{width:64,height:48,objectFit:"cover",borderRadius:8,cursor:"pointer",outline:i===img?"2px solid #F0609E":"none"}}/>)}
          </div>}
        </div>}
        <div style={{padding:"18px 20px 22px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            {v.logo_url&&<img src={v.logo_url} alt="" style={{width:56,height:56,borderRadius:14,objectFit:"cover",border:"1px solid #F0E8F8"}}/>}
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:900,color:"#2B1D3F"}}>{v.business_name}</div>
              <div style={{fontSize:13,color:"#7A6F8C"}}>{cat.icon} {cat.label}{v.region?` · ${SUPPLIER_REGION[v.region]}`:""}{v.city?` · ${v.city}`:""}</div>
            </div>
            <button onClick={onClose} aria-label="סגירה" style={{background:"#F6F0FF",border:"none",borderRadius:10,width:34,height:34,cursor:"pointer",flexShrink:0}}>✕</button>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {isFeatured(v)&&<span style={{background:"#FFF6E2",color:"#8A5A00",borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800}}>⭐ ספק מוביל</span>}
            {v.verified&&<span style={{background:"#E9FBF4",color:"#1F8F6C",borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800}}>✓ עסק רשום</span>}
            {v.price_from>0&&<span style={{background:"#F6F0FF",color:"#5B3C8C",borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:800}}>החל מ-₪{Number(v.price_from).toLocaleString()}</span>}
          </div>
          {v.description&&<p style={{fontSize:14,color:"#3E3555",lineHeight:1.8,whiteSpace:"pre-line",marginBottom:14}}>{v.description}</p>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {waLink(v.phone)&&<a href={`${waLink(v.phone)}?text=${encodeURIComponent(`היי ${v.business_name}, ראיתי אתכם ב-Sidor-IL ואשמח לפרטים`)}`} target="_blank" rel="noopener noreferrer" style={{...b,background:"#25D366",color:"#fff"}}><WaIcon size={16}/> וואטסאפ</a>}
            {v.phone&&<a href={`tel:${v.phone}`} style={{...b,background:"#F6F0FF",color:"#3A2464"}}>📞 {v.phone}</a>}
            {v.email&&<a href={`mailto:${v.email}`} style={{...b,background:"#F6F0FF",color:"#3A2464"}}>✉️ מייל</a>}
            {extLink(v.website)&&<a href={extLink(v.website)} target="_blank" rel="noopener noreferrer" style={{...b,background:"#F6F0FF",color:"#3A2464"}}>🌐 אתר</a>}
            {extLink(v.instagram)&&<a href={extLink(v.instagram)} target="_blank" rel="noopener noreferrer" style={{...b,background:"#F6F0FF",color:"#3A2464"}}>📷 אינסטגרם</a>}
            {extLink(v.facebook)&&<a href={extLink(v.facebook)} target="_blank" rel="noopener noreferrer" style={{...b,background:"#F6F0FF",color:"#3A2464"}}>👍 פייסבוק</a>}
          </div>
          {own?<div style={{marginTop:16,background:"#F6F0FF",borderRadius:16,padding:"12px 14px",fontSize:13.5,color:"#3E3555",lineHeight:1.6}}>📩 כאן לקוחות רואים כפתור "בקשת הצעת מחיר". הפניות שלהם מגיעות אליכם לאזור הספקים.</div>
            :user&&v.status==="approved"&&v.user_id!==user.id&&<VendorLeadForm key={v.user_id} v={v} user={user} event={event}/>}
        </div>
      </div>
    </div>
  );
}

// ─── פנייה לספק: הלקוח משאיר פרטים, והפנייה נשמרת ב-vendor_leads ומופיעה לספק באזור הספקים ───
function VendorLeadForm({ v, user, event }) {
  const nm=String(user?.user_metadata?.full_name||user?.user_metadata?.name||"").trim();
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[err,setErr]=useState("");
  const [f,setF]=useState(()=>({name:nm,phone:"",event_date:event?.date?String(event.date).slice(0,10):"",guests:"",message:""}));
  const set=(k,val)=>setF(x=>({...x,[k]:val}));
  const inp={width:"100%",boxSizing:"border-box",border:"1.5px solid #E6DDF5",borderRadius:14,padding:"10px 12px",fontSize:14.5,fontFamily:"inherit",outline:"none",background:"#fff",color:"#2B1D3F",minHeight:46};
  const lbl=(t,req)=><div style={{fontSize:12.5,fontWeight:800,color:"#3E3555",marginBottom:5}}>{t}{req&&<span style={{color:"#C53030"}}> *</span>}</div>;
  const send=async()=>{
    setErr("");
    if(f.name.trim().length<2)return setErr("נא למלא שם");
    if(!normPhone(f.phone))return setErr("נא למלא נייד תקין, כדי שהספק יוכל לחזור אליכם");
    setBusy(true);
    const{error}=await sb.from("vendor_leads").insert({vendor_id:v.user_id,user_id:user.id,event_id:event?.id||null,name:f.name.trim().slice(0,60),phone:f.phone.trim().slice(0,20),
      event_date:f.event_date||null,guests:f.guests===""?null:Math.min(5000,Math.max(1,parseInt(f.guests)||0))||null,message:f.message.trim().slice(0,600)||null});
    setBusy(false);
    if(error)return setErr(/limit|too many/i.test(error.message)?"שלחתם הרבה פניות היום. נסו שוב מחר.":"הפנייה לא נשלחה: "+error.message);
    setDone(true);
  };
  if(done)return <div role="status" style={{marginTop:16,background:"#EFFAF3",border:"1.5px solid #BDEFDD",borderRadius:18,padding:"14px 16px",color:"#1F7A4D",fontSize:14.5,fontWeight:700,lineHeight:1.6}}>✓ הפנייה נשלחה ל{v.business_name}. הם יחזרו אליכם לנייד {f.phone.trim()}.</div>;
  if(!open)return <button type="button" onClick={()=>setOpen(true)} className="sx-btn" style={{marginTop:16,width:"100%",minHeight:50,border:"none",borderRadius:999,background:GRAD,color:"#fff",fontSize:15.5,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>📩 בקשת הצעת מחיר</button>;
  return(
    <div style={{marginTop:16,background:"#FCFAFE",border:"1.5px solid #EFE6F7",borderRadius:20,padding:16}}>
      <div style={{fontSize:16,fontWeight:900,color:"#2B1D3F",marginBottom:4}}>📩 בקשת הצעת מחיר מ{v.business_name}</div>
      <div style={{fontSize:13,color:"#5E5470",marginBottom:12}}>הפרטים נשלחים לספק בלבד, כדי שיוכל לחזור אליכם.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10,marginBottom:10}}>
        <div>{lbl("שם",1)}<input value={f.name} onChange={e=>set("name",e.target.value)} maxLength={60} style={inp}/></div>
        <div>{lbl("נייד",1)}<input value={f.phone} onChange={e=>set("phone",e.target.value)} type="tel" inputMode="tel" dir="ltr" maxLength={20} placeholder="050-0000000" style={{...inp,textAlign:"right"}}/></div>
        <div>{lbl("תאריך האירוע")}<input type="date" value={f.event_date} onChange={e=>set("event_date",e.target.value)} dir="ltr" style={{...inp,textAlign:"right"}}/></div>
        <div>{lbl("כמה אורחים, בערך")}<input value={f.guests} onChange={e=>set("guests",e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric" placeholder="למשל 250" style={inp}/></div>
      </div>
      <div style={{marginBottom:10}}>{lbl("מה חשוב לכם?")}<textarea value={f.message} onChange={e=>set("message",e.target.value)} maxLength={600} rows={3} placeholder="סוג האירוע, מיקום, מה אתם מחפשים..." style={{...inp,resize:"vertical",minHeight:84,lineHeight:1.6}}/></div>
      {err&&<div role="alert" style={{fontSize:13.5,color:"#B42318",fontWeight:700,marginBottom:10}}>{err}</div>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button type="button" onClick={send} disabled={busy} className="sx-btn" style={{flex:"1 1 200px",minHeight:48,border:"none",borderRadius:999,background:GRAD,color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",opacity:busy?.6:1}}>{busy?"שולח...":"שליחת הפנייה"}</button>
        <button type="button" onClick={()=>setOpen(false)} style={{minHeight:48,padding:"0 18px",border:"1.5px solid #E6DDF5",borderRadius:999,background:"#fff",color:"#3A2464",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>
      </div>
      <div style={{fontSize:12,color:"#5F5675",marginTop:10,lineHeight:1.6}}>בשליחה אתם מאשרים להעביר לספק את השם, הנייד ופרטי האירוע שמילאתם. אפשר לבקש מחיקה לפי <a href="#/privacy" style={{color:C.blue}}>מדיניות הפרטיות</a>.</div>
    </div>
  );
}
// אצל הספק: לוח ניהול הפניות. מספרים, סינון, וואטסאפ / חיוג, הצעת מחיר ושלב הטיפול
export const ADMIN_EMAIL="amitgez331@gmail.com";
// Supabase שומר מיילים באותיות קטנות  -  השוואה בלי תלות ברישיות
export const isAdminUser=u=>!!u?.email&&u.email.toLowerCase()===ADMIN_EMAIL;

// החבילות שנמכרות היום (כמו בדף החבילות). המזהים הם מה שהמסכים בודקים (auto = WhatsApp)
const CONTACT_TXT=`Sidor-IL\nעוסק מורשה מס' 203887450\nהשושנים 30, נוף הגליל\n${CONTACT_LINES()}`;
const LEGAL_PAGES={
  terms:{title:"תנאי שימוש",updated:"נובמבר 2026",sections:[
    {title:"1. כללי",text:`ברוכים הבאים ל-Sidor-IL ("השירות", "אנחנו"; עוסק מורשה מס' 203887450, השושנים 30, נוף הגליל), פלטפורמה לניהול אירועים בכתובת sidoril.com: סידורי הושבה, אישורי הגעה, הזמנות דיגיטליות, שליחת הודעות לאורחים וכלים נלווים.\n\nהשימוש בשירות, כולל הרשמה, יצירת אירוע או רכישת חבילה, מהווה הסכמה לתנאים אלה ולמדיניות הפרטיות. אם אינכם מסכימים, אנא אל תשתמשו בשירות. התנאים מנוסחים בלשון זכר מטעמי נוחות בלבד ופונים לכל המגדרים.`},
    {title:"2. ההרשמה והחשבון",text:`• השימוש בשירות מיועד לבני 18 ומעלה.\n• יש למסור פרטים נכונים ולשמור על סודיות פרטי ההתחברות. אתם אחראים לכל פעולה שנעשית בחשבונכם.\n• בעל אירוע רשאי לשתף את האירוע עם אנשים נוספים (למשל בן/בת זוג או הורים). מי ששותף יכול לצפות ולערוך את פרטי האירוע, והאחריות על מתן הגישה היא של בעל האירוע.\n• אנו רשאים להשעות או לסגור חשבון שנעשה בו שימוש בניגוד לתנאים או לחוק.`},
    {title:"3. השירותים והחבילות",text:`• חלק מהשירות ניתן ללא תשלום, וחלקו בחבילות בתשלום (כגון החבילה הבסיסית, הודעות SMS, הודעות WhatsApp, צוות הושבה ועמדת טאבלט), כמפורט בדף החבילות.\n• המחיר המחייב הוא המחיר שמוצג באתר ומאושר מולנו בעת הרכישה. כל המחירים באתר כוללים מע"מ.\n• על כל תשלום תונפק קבלה או חשבונית מס כדין.\n• החבילה מופעלת לאחר אישור התשלום.\n• יתרת הודעות SMS שנרכשה משמשת לאירוע שעבורו נרכשה. הודעה נחשבת לנוצלה כשנשלחה לספק ההודעות.\n• הודעות WhatsApp נמכרות לפי רשומה. רשומה היא אורח אחד (או משפחה עם מספר טלפון אחד), והיא כוללת עד 4 הודעות: הזמנה, תזכורת (נשלחת רק למי שעוד לא ענה), הודעה ביום האירוע (עם מספר השולחן למי ששובץ) והודעת תודה. ההודעות נשלחות אוטומטית במועדים שבתזמון, או ידנית מהמסך. רשומה נחשבת לנוצלה כשנשלחה לאורח ההודעה הראשונה, וכל אחת מ-4 ההודעות נשלחת לאורח פעם אחת. הודעה שלא נשלחה בגלל תקלה אצל ספק ההודעות אינה מנצלת רשומה.`},
    {title:"4. ביטול עסקה והחזרים",text:`ביטול עסקה ייעשה בהתאם לחוק הגנת הצרכן, התשמ"א-1981 ולתקנות הגנת הצרכן (ביטול עסקה), התשע"א-2010:\n\n• ניתן לבטל רכישה בתוך 14 ימים ממועד העסקה (או ממועד קבלת פרטי העסקה, לפי המאוחר), ובלבד שהביטול נעשה לפחות 2 ימים שאינם ימי מנוחה לפני מועד מתן השירות (למשל לפני מועד האירוע שאליו הוזמנו צוות הושבה או עמדת טאבלט).\n• הודעת ביטול אפשר למסור ${SUPPORT_PHONE?"בוואטסאפ, באימייל, בטלפון":"באימייל"} או דרך דף "ביטול עסקה" באתר: https://www.sidoril.com/#/cancel\n• בביטול יוחזר הסכום ששולם בתוך 14 ימים מקבלת הודעת הביטול, בניכוי דמי ביטול בשיעור 5% ממחיר העסקה או 100 ₪, לפי הנמוך מביניהם.\n• לא יינתן החזר עבור חלק מהשירות שכבר ניתן או נוצל (למשל הודעות SMS שכבר נשלחו).\n• צרכן שהוא אדם עם מוגבלות, אזרח ותיק או עולה חדש, רשאי לבטל עסקה שנעשתה בשיחה טלפונית (לרבות שיחה עם נציג בוואטסאפ) בתוך 4 חודשים, בהתאם לחוק.`},
    {title:"5. אחריות המשתמש לתוכן ולפרטי האורחים",text:`• אתם אחראים לכל המידע שאתם מזינים לשירות, ובכלל זה שמות וטלפונים של אורחים.\n• אתם מצהירים כי יש לכם זכות להשתמש בפרטי האורחים לצורך הזמנתם לאירוע ויצירת קשר בנוגע אליו.\n• ההודעות לאורחים (SMS ו-WhatsApp) נשלחות בשמכם ולפי הוראותיכם. אתם השולחים, ואנו מספקים את הכלי הטכני בלבד.\n• השירות מיועד לשליחת הזמנות, תזכורות ועדכונים הנוגעים לאירוע בלבד. אין להשתמש בו לשליחת דבר פרסומת או הודעות שאינן קשורות לאירוע, ובכלל זה בניגוד לסעיף 30א לחוק התקשורת (בזק ושידורים), התשמ"ב-1982.\n• אין להעלות תוכן פוגעני, מטעה או מפר זכויות של אחרים, ובכלל זה תמונות שאין לכם זכות להשתמש בהן.\n• מפיק או בעל מקצוע שמנהל אירועים עבור לקוחות אחראי לקבל את הסכמת לקוחותיו להזנת פרטיהם ופרטי אורחיהם לשירות.`},
    {title:"5א. עיבוד פרטי האורחים עבורכם",text:`לגבי פרטי האורחים שאתם מזינים, אתם בעלי השליטה במידע ואנו מחזיקים ומעבדים אותו עבורכם בלבד: לצורך מתן השירות, לפי הוראותיכם, ובאמצעי אבטחה סבירים. איננו משתמשים בפרטים אלה לכל מטרה אחרת, ואיננו מוסרים אותם לאחרים מלבד הספקים הנדרשים להפעלת השירות (כמפורט במדיניות הפרטיות). עם מחיקת האירוע נמחקים פרטי האורחים שלו.`},
    {title:"5ב. תקופת שמירת המידע",text:`השירות נועד לניהול אירוע, ולא לאחסון קבוע של רשימות אנשי קשר. פרטי האורחים של כל אירוע נשמרים עד 12 חודשים מתאריך האירוע, ולאחר מכן אנו רשאים למחוק אותם או להפוך אותם לאנונימיים, בלי הודעה נוספת. חשבון שלא נעשה בו שימוש 24 חודשים עשוי להימחק לאחר הודעה מוקדמת באימייל. באחריותכם לייצא ולשמור עותק של מה שתרצו לפני כן (למשל ייצוא לאקסל). לא נהיה אחראים לאובדן מידע שנמחק בהתאם לסעיף זה. הפרטים המלאים במדיניות הפרטיות.`},
    {title:"5ג. המלצות ודירוגים",text:`המלצה שאתם שולחים דרך האתר עשויה להתפרסם באתר עם השם שבחרתם להציג, לאחר אישורנו. אנו מפרסמים רק המלצות אמיתיות של לקוחות, ולא עורכים את תוכנן מלבד תיקון שגיאות כתיב. ניתן לבקש בכל עת להסיר המלצה.`},
    {title:"5ד. מדריך הספקים",text:`• ספק שנרשם למדריך אחראי לכך שכל הפרטים, המחירים והתמונות שהוא מפרסם נכונים, שייכים לו או שיש לו זכות לפרסמם, ושהוא פועל כדין (כולל רישיונות והיתרים הנדרשים בתחומו).\n• פרופיל מוצג לאחר אישורנו, או מיד עם פרסומו אם הפעלנו לספק חשבון ספק (במקרה זה אנו בודקים אותו לאחר הפרסום). אנו רשאים לסרב לפרופיל, לבקש תיקונים, לסמן "עסק רשום" לאחר בדיקת מספר העוסק או ח.פ, או להסיר פרופיל שמפר את התנאים, לפי שיקול דעתנו.\n• "ספק מוביל" הוא מיקום בולט בתשלום, ומסומן באתר כ"מקודם". הוא אינו המלצה שלנו על איכות הספק.\n• Sidor-IL אינה צד להתקשרות בין גולשים לספקים, אינה בודקת את טיב השירות של הספקים ואינה אחראית לו. ההתקשרות, התשלום וכל מחלוקת הם בין הגולש לספק בלבד.\n• ספק יכול לעדכן את הפרופיל או למחוק אותו בכל עת מאזור הספקים.`},
    {title:"5ו. פניות לספקים והצעות מחיר",text:`• "בקשת הצעת מחיר" מעבירה לספק את הפרטים שמילאתם, כדי שיחזור אליכם. מלאו רק פרטים שאתם מסכימים שהספק יקבל.\n• הצעת מחיר שספק שולח דרך האתר היא הצעה של הספק בלבד. Sidor-IL אינה צד לה, אינה מתחייבת למחיר או לשירות, והתשלום וכל מחלוקת הם בין הלקוח לספק.\n• ספק רשאי להשתמש בפרטי הפנייה רק כדי לחזור ללקוח בנוגע לפנייה זו, ולא לשלוח לו דבר פרסומת בלי הסכמתו (סעיף 30א לחוק התקשורת).\n• אנו רשאים להגביל מספר פניות כדי למנוע הצפה, ולהסיר ספק שעושה שימוש לרעה בפניות.`},
    {title:"5ה. דיווחי מחירים והמלצות על ספקים",text:`• דיווח מחיר או המלצה על ספק צריכים להתבסס על ניסיון אישי ואמיתי שלכם. אין לפרסם מידע כוזב, מטעה או פוגעני, ואין לפרסם תוכן שעלול להוות לשון הרע לפי חוק איסור לשון הרע, התשכ"ה-1965.\n• ספק אינו רשאי לפרסם המלצות על עצמו או על מתחריו.\n• ההמלצות והדיווחים משקפים את דעת הכותבים בלבד ולא את עמדתנו. אנו רשאים לסמן, להסתיר או להסיר דיווח או המלצה שנראים חריגים, לא אמינים או מפרים את התנאים, ולפעול לפי בקשת הסרה מוצדקת של ספק.\n• פרסום בעילום שם אפשרי, אך פרטי המפרסם נשמרים אצלנו ועשויים להימסר אם נחויב לכך על פי דין.`},
    {title:"6. זמינות השירות",text:`אנו עושים מאמץ שהשירות יפעל באופן רציף ותקין, אך ייתכנו תקלות, הפסקות לצורך תחזוקה או עיכובים אצל ספקים חיצוניים (כגון ספקי SMS ו-WhatsApp). מומלץ לשמור עותק של רשימת האורחים וסידור ההושבה (למשל באמצעות כפתורי ההדפסה והייצוא) לקראת יום האירוע.`},
    {title:"7. הגבלת אחריות",text:`השירות ניתן כפי שהוא (AS IS). ככל שהדין מתיר, לא נהיה אחראים לנזק עקיף או תוצאתי הנובע מהשימוש בשירות או מחוסר היכולת להשתמש בו, ובכלל זה הודעה שלא נמסרה או עוכבה אצל ספק חיצוני. בכל מקרה, אחריותנו הכוללת לא תעלה על הסכום ששילמתם עבור השירות הרלוונטי. אין באמור כדי לגרוע מזכויות שאינן ניתנות להתניה על פי דין.`},
    {title:"8. קניין רוחני",text:`כל הזכויות באתר, בעיצובו, בקוד ובתכנים שלנו שמורות ל-Sidor-IL. התוכן שאתם מזינים (פרטי האירוע, האורחים, תמונות ונוסחים) נשאר שלכם, ואתם מעניקים לנו רשות להשתמש בו לצורך מתן השירות בלבד.`},
    {title:"9. שינויים בתנאים",text:`אנו רשאים לעדכן תנאים אלה מעת לעת. שינוי מהותי יפורסם באתר. המשך השימוש לאחר העדכון מהווה הסכמה לתנאים המעודכנים. עסקה שכבר בוצעה תמשיך להיות כפופה לתנאים שהיו בתוקף בעת ביצועה.`},
    {title:"10. דין וסמכות שיפוט",text:`על תנאים אלה חלים דיני מדינת ישראל. סמכות השיפוט נתונה לבתי המשפט המוסמכים בישראל, בהתאם לדין.`},
    {title:"11. יצירת קשר",text:CONTACT_TXT},
  ]},
  privacy:{title:"מדיניות פרטיות",updated:"נובמבר 2026",sections:[
    {title:"1. כללי ובעל השליטה במידע",text:`Sidor-IL ("אנחנו") מפעילה את השירות בכתובת sidoril.com. מדיניות זו מסבירה איזה מידע נאסף, למה, עם מי הוא משותף ומה הזכויות שלכם, בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 (כולל תיקון מס' 13) ולתקנות מכוחו.\n\nבעל השליטה במידע על המשתמשים הרשומים, הספקים והגולשים: Sidor-IL, עוסק מורשה מס' 203887450, השושנים 30, נוף הגליל. אימייל: sidoril2026@gmail.com${SUPPORT_PHONE?`, טלפון: ${SUPPORT_PHONE}`:""}.\n\nלגבי פרטי האורחים של אירוע, בעלי השליטה הם בעלי האירוע שהזינו אותם (או שהאורחים מסרו להם דרך דף ההזמנה), ואנו מחזיקים ומעבדים את המידע עבורם (ראו סעיף 7).\n\nאין חובה חוקית למסור לנו מידע. עם זאת, בלי פרטי חשבון לא ניתן להשתמש בשירות, בלי פרטי אורחים לא ניתן לשלוח להם הזמנות או להושיב אותם, ובלי פרטי אישור הגעה לא ניתן לרשום את התשובה של האורח.`},
    {title:"2. מידע שאנו אוספים",text:`• פרטי חשבון: שם, כתובת אימייל, ופרטי התחברות (סיסמה מוצפנת, או התחברות עם חשבון Google).\n• פרטי האירוע: סוג האירוע, שמות בעלי השמחה, תאריך, מקום וכתובת, נוסחים, תמונת הזמנה וקישורי Bit / PayBox.\n• פרטי אורחים שאתם מזינים: שם, טלפון, קטגוריה, מספר מוזמנים, אישור הגעה, שיבוץ לשולחן, הערות, סימון כניסה לאולם וסכום מתנה (אם רשמתם).\n• מידע שאורחים מוסרים בדף ההזמנה: שם, טלפון, אישור הגעה ומספר מגיעים, ואם בעל האירוע ביקש: סוג מנה, מספר ילדים, צורך בהסעה והערות למטבח.\n• אלרגיות והערות למטבח עשויות לכלול מידע על בריאות. מסירתן אינה חובה, והן מוצגות רק לבעל האירוע ולמי שהוא שיתף איתו, לצורך הכנת האוכל באירוע בלבד.\n• קוד הפניה: אם הגעתם דרך קישור של לקוח, אולם או מפיק (?ref=), נשמור את הקוד בחשבון כדי לדעת מי הפנה אתכם.\n• המלצות שאתם שולחים, ופרטי פרופיל מפיק (שם עסק, טלפון ולוגו) למי שמשתמש בחשבון מפיק.\n• ספקים שנרשמים למדריך הספקים: שם העסק, תחום, אזור ועיר, איש קשר, טלפון, אימייל, אתר ורשתות חברתיות, תיאור, מחיר התחלתי, לוגו ותמונות עבודה. פרטים אלה מוצגים לכל הגולשים לאחר אישורנו, או מיד עם פרסום הפרופיל אם הפעלנו לספק חשבון ספק. סוג העסק ומספר עוסק / ח.פ (שאצל עוסק פטור או מורשה הוא מספר תעודת הזהות) משמשים לאימות העסק בלבד ואינם מוצגים לאף אחד.\n• דיווחי מחירי מנות והמלצות על ספקים שאתם מפרסמים במדור "ספקים ומחירים", עם השם שבחרתם להציג או בעילום שם.\n• פניות לספקים: כשאתם שולחים "בקשת הצעת מחיר" לספק, נשמרים ונמסרים לספק שבחרתם השם, הנייד, תאריך האירוע, מספר האורחים המשוער והפרטים שכתבתם. הצעת המחיר שהספק שולח לכם נשמרת יחד עם הפנייה.\n• שפת ההודעות של כל אורח (אם בחרתם שפה אחרת מעברית), כדי לשלוח לו את ההודעות בשפה שלו.\n• הרשאות מכשיר, רק כשאתם מפעילים אותן: מצלמה לסריקת QR בכניסה לאולם (התמונה אינה נשמרת ואינה נשלחת אלינו), והתראות (Push) על אישורי הגעה.\n• מידע טכני בסיסי הנדרש להפעלת השירות (כגון כתובת IP ויומני שרת), ואחסון מקומי בדפדפן לשמירת הגדרות והתחברות.`},
    {title:"3. מטרות השימוש",text:`• מתן השירות: ניהול האירוע, האורחים וסידור ההושבה.\n• שליחת הזמנות, תזכורות ועדכונים לאורחים לפי הוראותיכם (SMS ו-WhatsApp).\n• הצגת מספר השולחן וקוד QR אישי לאורח שאישר הגעה, וסימון כניסתו לאולם.\n• הצעת שמות וכתובות של אולמות בעת הקלדת מקום האירוע (מקום שהוזן על ידי לקוח יחיד אינו מוצג ללקוחות אחרים).\n• טיפול ברכישות, תמיכה ויצירת קשר בנוגע לשירות.\n• אבטחת השירות ועמידה בדרישות הדין.\n\nאיננו משתמשים בפרטי האורחים לשיווק ואיננו פונים אליהם מיוזמתנו. איננו שולחים לכם דברי פרסומת בלי הסכמתכם, בהתאם לסעיף 30א לחוק התקשורת.`},
    {title:"4. שיתוף עם צדדים שלישיים",text:`איננו מוכרים או משכירים מידע אישי. מידע מועבר רק לספקים הנדרשים להפעלת השירות, לצורך זה בלבד:\n\n• Supabase: מסד נתונים, התחברות ואחסון קבצים (שרתים באיחוד האירופי).\n• Vercel: אירוח האתר.\n• 019 SMS: שליחת הודעות SMS.\n• ספק שפניתם אליו דרך "בקשת הצעת מחיר": מקבל את פרטי הפנייה שמילאתם, כדי לחזור אליכם. מרגע זה הספק אחראי למידע שקיבל.\n• Google: התחברות עם חשבון Google למי שבוחר בה. הגופן של האתר נטען מהשרת שלנו ולא מ-Google.\n• WhatsApp (Meta): הודעות שאתם שולחים דרך אפליקציית WhatsApp שלכם, או דרך ספק הודעות WhatsApp כשהשירות פעיל.\n• Google Maps ו-Waze: רק כשלוחצים על קישור הניווט לאולם.\n• Google Drive: עותק גיבוי מוצפן בהעברה של מסד הנתונים נשמר פעם בשבוע בחשבון Google Drive פרטי של Sidor-IL, לצורך שחזור במקרה תקלה בלבד. נשמרים 8 העותקים האחרונים והישנים נמחקים.\n• שירותי ההתראות של הדפדפן (כגון Google, Apple ו-Mozilla): מעבירים התראות Push למי שהפעיל אותן, בלי פרטי האורחים עצמם.\n• הספקים פועלים לפי תנאי השירות והסכמי עיבוד המידע (DPA) שלהם, ומקבלים רק את המידע הדרוש לשירות שהם נותנים.\n\nבנוסף, מידע יימסר לרשויות אם נחויב לכך על פי דין. חלק מהספקים מאחסנים מידע מחוץ לישראל (בעיקר באיחוד האירופי ובארצות הברית), בהתאם לתקנות הגנת הפרטיות (העברת מידע אל מאגרי מידע שמחוץ לגבולות המדינה).`},
    {title:"5. אבטחת מידע",text:`המידע מאוחסן בשרתים מאובטחים, התעבורה מוצפנת (HTTPS), והגישה לנתוני כל אירוע מוגבלת לבעליו ולמי שהוא שיתף איתו. אנו נוקטים אמצעים סבירים ומקובלים להגנה על המידע, אך אין אפשרות להבטיח הגנה מוחלטת. במקרה של אירוע אבטחה חמור נפעל בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), ובכלל זה נדווח לרשות להגנת הפרטיות ונעדכן את מי שנפגע, כנדרש בדין.`},
    {title:"6. שמירת מידע ומחיקתו",text:`אנו שומרים מידע אישי רק כל עוד הוא נחוץ למטרה שלשמה נאסף, בהתאם לחוק הגנת הפרטיות (כפי שתוקן בתיקון מס' 13) ולתקנות אבטחת מידע. בפועל:\n\n• פרטי אורחים, שולחנות, אישורי הגעה, מתנות והערות למטבח: נשמרים עד 12 חודשים מתאריך האירוע. לאחר מכן אנו רשאים למחוק אותם או להפוך אותם לאנונימיים (למשל להשאיר רק מספרים כלליים כמו כמות אורחים), בלי הודעה נוספת. מומלץ לייצא לאקסל את מה שתרצו לשמור לפני כן.\n• פרטי האירוע עצמו (שם, תאריך, מקום): נשמרים כל עוד החשבון פעיל, כדי שתוכלו לחזור לאירוע.\n• חשבון שלא נעשה בו שימוש במשך 24 חודשים: אנו רשאים למחוק אותו ואת כל המידע שבו, לאחר הודעה מוקדמת לכתובת האימייל של החשבון.\n• רכישות, חשבוניות ותנועות יתרה: נשמרות עד 7 שנים, כנדרש בדיני המס וניהול הספרים, גם אם החשבון נמחק.\n• גיבויים: עותקי גיבוי נשמרים עד 14 יום ונמחקים אוטומטית, כך שמידע שנמחק נעלם גם מהגיבויים בתוך תקופה זו.\n• דיווחי מחירים והמלצות על ספקים: עשויים להישאר בשירות גם לאחר מחיקת החשבון, בלי שמכם ובלי פרטים מזהים.\n• פניות לספקים והצעות מחיר: נשמרות עד שהספק מוחק אותן, ולכל היותר 24 חודשים ממועד הפנייה. ניתן לבקש מאיתנו למחוק פנייה ששלחתם.\n\nניתן בכל עת למחוק אירוע (כולל כל פרטי האורחים שלו) או את החשבון כולו ממסך ההגדרות, או לפנות אלינו בבקשה למחיקה. מידע שנדרש לשמור על פי דין, או לצורך בירור מחלוקת או תביעה, יישמר רק לתקופה הנדרשת לכך.`},
    {title:"7. האחריות שלכם על פרטי האורחים",text:`כשאתם מזינים פרטי אורחים, אתם מצהירים שיש לכם זכות להשתמש בהם לצורך הזמנתם לאירוע ויצירת קשר בנוגע אליו. לגבי מידע זה אתם בעלי השליטה, ואנו מעבדים אותו בשמכם ולפי הוראותיכם.`},
    {title:"8. הזכויות שלכם",text:`על פי חוק הגנת הפרטיות, אתם זכאים לעיין במידע שנשמר עליכם, לבקש לתקן מידע שגוי או לא מעודכן, ולבקש את מחיקתו. אורח שפרטיו נמסרו לנו על ידי בעל אירוע רשאי לפנות אלינו או לבעל האירוע.\n\nלמימוש הזכויות: sidoril2026@gmail.com${SUPPORT_PHONE?`, טלפון ${SUPPORT_PHONE}`:""}, או בדואר: Sidor-IL, השושנים 30, נוף הגליל. נשיב בתוך 30 ימים. ספק יכול גם לעדכן או למחוק את הפרופיל שלו בעצמו מאזור הספקים.\n\nאם לדעתכם לא טיפלנו כראוי בפנייה, באפשרותכם להגיש תלונה לרשות להגנת הפרטיות במשרד המשפטים.`},
    {title:"9. עוגיות ואחסון מקומי",text:`האתר משתמש באחסון מקומי בדפדפן (Local Storage / Session Storage). בכניסה הראשונה תתבקשו לאשר או לדחות את השמירה שאינה חיונית.\n\nנשמר תמיד, כי בלעדיו השירות לא יעבוד:\n• שמירת ההתחברות לחשבון.\n• הבחירה שלכם באישור או בדחייה.\n• קוד הגישה לעמדת הכניסה לאולם שהגדרתם, ומצב הניווט בלשונית הפתוחה.\n\nנשמר רק אם אישרתם:\n• האירוע והמסך האחרונים, כדי לחזור אליהם אחרי רענון.\n• הגדרות תצוגה ונגישות (למשל גודל טקסט וניגודיות). בלי אישור הן פועלות עד רענון הדף.\n• קוד הפניה שהגעתם איתו (?ref=), לעד 60 יום, כדי לשייך אותו לחשבון בהרשמה.\n\nבדחייה השירות ממשיך לעבוד במלואו, ומה שכבר נשמר מהרשימה השנייה נמחק. אפשר לשנות את הבחירה בכל עת בכפתור שבסעיף זה או ב"הגדרות עוגיות" בתחתית דף הבית.\n\nאיננו משתמשים בעוגיות פרסום, בכלי מעקב או בכלי אנליטיקה של צד שלישי. אם נוסיף כלים כאלה בעתיד, נעדכן מדיניות זו ונבקש את הסכמתכם מראש. ניתן גם למחוק את המידע השמור דרך הגדרות הדפדפן; במקרה זה תתבקשו להתחבר מחדש.`},
    {title:"10. קטינים",text:`פתיחת חשבון מיועדת לבני 18 ומעלה. פרטי אורחים קטינים מוזנים על ידי בעל האירוע ובאחריותו.`},
    {title:"11. שינויים במדיניות",text:`נעדכן מדיניות זו לפי הצורך. שינוי מהותי יפורסם באתר, ותאריך העדכון האחרון מופיע בראש הדף.`},
    {title:"12. יצירת קשר",text:CONTACT_TXT},
  ]},
  accessibility:{title:"הצהרת נגישות",updated:"נובמבר 2026",sections:[
    {title:"מחויבות לנגישות",text:`אנו ב-Sidor-IL רואים חשיבות רבה במתן שירות שוויוני לכל המשתמשים, ובכלל זה אנשים עם מוגבלות. אנו פועלים להנגיש את האתר בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998, לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ולתקן הישראלי ת"י 5568 המבוסס על הנחיות WCAG 2.0 ברמה AA.`},
    {title:"מה עשינו באתר",text:`• תפריט נגישות (כפתור הנגישות בפינת המסך): הגדלה והקטנה של הטקסט, ניגודיות גבוהה, גווני אפור, סמן גדול, עצירת אנימציות, גופן קריא, הדגשת קישורים וקו תחתי לקישורים. ההגדרות נשמרות גם אחרי רענון.\n• מבנה דף בעברית מימין לשמאל, עם הגדרת שפה וכיוון, וכותרת ראשית בכל מסך.\n• תמיכה בניווט במקלדת וסימון פוקוס ברכיבים עיקריים.\n• טקסט חלופי לתמונות, ושמות נגישים לכפתורים, לקישורים ולשדות טפסים, לשימוש עם קוראי מסך.\n• תוויות גלויות בטפסים (למשל בטופס אישור ההגעה), והודעות שגיאה בטקסט.\n• ניגודיות צבעים לטקסט לפי רמה AA.\n• כיבוד הגדרת "הפחתת תנועה" של מערכת ההפעלה.\n• התאמה לצפייה בטלפון, בטאבלט ובמחשב.`},
    {title:"בדיקת הנגישות",text:`האתר נבדק לאחרונה בנובמבר 2026: בדיקה אוטומטית בכלי axe לפי WCAG 2.0 ברמה AA בדף הבית, בדף ההזמנה לאורח, במסכי ניהול האירוע ובדפי המידע המשפטי, במחשב ובטלפון, ובדיקה ידנית של ניווט מקלדת, ניגודיות, טקסט חלופי ותוויות. הבעיות שנמצאו תוקנו.`},
    {title:"מגבלות ידועות",text:`למרות מאמצינו, ייתכן שחלקים מהאתר עדיין אינם נגישים במלואם:\n\n• מפת האולם וגרירת אורחים לשולחנות מבוססות על גרירה בעכבר או במגע. כחלופה, ניתן לשבץ אורחים מתצוגת הרשימה ולהשתמש בהושבה האוטומטית.\n• סריקת QR בכניסה לאולם דורשת מצלמה. כחלופה, ניתן לחפש אורח לפי שם.\n• תכנים שמעלים המשתמשים עצמם (כגון תמונת הזמנה, תמונות ספקים ונוסחי הודעות) אינם בשליטתנו.\n• שירותים חיצוניים שהאתר מקשר אליהם (כגון התחברות עם Google, WhatsApp, Bit, PayBox, Waze ו-Google Maps) מונגשים על ידי מפעיליהם.\n• דפי ההדפסה (סידור הושבה, כרטיסי שולחן ורשימות) מיועדים להדפסה על נייר. המידע שבהם זמין גם במסכי האתר עצמם.\n\nאנו ממשיכים לשפר את הנגישות באופן שוטף.`},
    {title:"נתקלתם בבעיה?",text:`אם נתקלתם בקושי בשימוש באתר, או שיש לכם הצעה לשיפור, נשמח לשמוע ולסייע. אנא ציינו את הדף, תיאור הבעיה וסוג הדפדפן או הטכנולוגיה המסייעת.\n\nרכז/ת הנגישות של Sidor-IL:\n${CONTACT_LINES()}\n\nנשתדל להשיב בתוך 7 ימי עבודה.`},
    {title:"הסדרי נגישות בשירות",text:`השירות ניתן באופן מקוון בלבד, ואין קבלת קהל פיזית. ניתן לקבל סיוע ${SUPPORT_PHONE?"טלפוני, בוואטסאפ או במייל":"במייל"} בשימוש באתר, בהקמת האירוע ובהזנת אורחים, לרבות עבור אנשים עם מוגבלות.`},
  ]},
  cancel:{title:"ביטול עסקה",updated:"נובמבר 2026",sections:[
    {title:"איך מבטלים",text:`רכשתם חבילה ורוצים לבטל? אפשר לשלוח הודעת ביטול בכל אחת מהדרכים:\n\n• ${CONTACT_LINES("\n• ")}\n\nבהודעה ציינו: שם מלא, כתובת האימייל של החשבון, מספר טלפון, והחבילה שברצונכם לבטל.`},
    {title:"מה קורה אחרי ההודעה",text:`• נאשר את קבלת הודעת הביטול.\n• ההחזר יבוצע בתוך 14 ימים מקבלת ההודעה, באותו אמצעי תשלום ששימש לרכישה (או בהעברה בנקאית, בתיאום).\n• דמי ביטול: 5% ממחיר העסקה או 100 ₪, לפי הנמוך מביניהם.\n• לא יוחזר תשלום עבור חלק מהשירות שכבר ניתן או נוצל, כגון הודעות SMS שכבר נשלחו.\n\nהתנאים המלאים מופיעים בסעיף 4 בתנאי השימוש: https://www.sidoril.com/#/terms`},
  ]},
};
const LEGAL_ROUTES={"#/terms":"terms","#/privacy":"privacy","#/accessibility":"accessibility","#/cancel":"cancel"};
// הודעת עוגיות: רק עוגיות ואחסון חיוניים, אז הודעה (בלי חסימה) שנסגרת ב"הבנתי" ונזכרת בדפדפן
function CookieNotice() {
  const [show,setShow]=useState(()=>!cookieChoice());
  // "הגדרות עוגיות" (בתחתית דף הבית ובמדיניות הפרטיות) פותח את הבחירה מחדש
  useEffect(()=>{const fn=()=>setShow(true);window.addEventListener("sidor-cookie-settings",fn);return()=>window.removeEventListener("sidor-cookie-settings",fn);},[]);
  if(!show)return null;
  const pick=c=>{setCookieChoice(c);setShow(false);};
  const b={border:"none",borderRadius:10,padding:"9px 20px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit",minHeight:40};
  return(
    <div role="region" aria-label="הודעת עוגיות" dir="rtl" className="sx-cookie" style={{position:"fixed",bottom:12,left:12,right:12,zIndex:400,maxWidth:560,margin:"0 auto",background:"#2B1D3F",color:"#fff",borderRadius:16,padding:"12px 16px",boxShadow:"0 10px 30px rgba(0,0,0,.25)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",fontFamily:"'Heebo',sans-serif"}}>
      {/* בנייד: מעל כפתורי הוואטסאפ והנגישות שבפינות התחתונות, כדי לא להסתיר אותם */}
      {/* כשחלון פתוח (הרשמה, אשף אירוע וכו') ההודעה מוסתרת עד שהוא נסגר — שלא תסתיר את כפתור "יצירת חשבון" */}
      <style>{`@media(max-width:640px){.sx-cookie{bottom:88px!important}} body:has([aria-modal="true"]) .sx-cookie{display:none!important}`}</style>
      <div style={{flex:"1 1 240px",fontSize:13,lineHeight:1.6}}>🍪 מה שחיוני להתחברות ולפעולת האתר נשמר תמיד. באישור נשמור גם העדפות נוחות: חזרה למסך האחרון, הגדרות תצוגה ונגישות וקוד הפניה. בלי פרסום ובלי מעקב. <a href="#/privacy" style={{color:"#F9C6DD",fontWeight:700}}>מדיניות הפרטיות</a></div>
      {/* שני הכפתורים באותו גודל ובאותו מקום: דחייה קלה בדיוק כמו אישור */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>pick("all")} style={{...b,background:"#fff",color:"#2B1D3F"}}>אישור</button>
        <button onClick={()=>pick("essential")} style={{...b,background:"#fff",color:"#2B1D3F"}}>דחייה</button>
      </div>
    </div>
  );
}
function LegalPage({ kind }) {
  const page=LEGAL_PAGES[kind]||LEGAL_PAGES.privacy;
  useEffect(()=>{window.scrollTo(0,0);document.title=`${page.title} · Sidor-IL`;return()=>{document.title="Sidor-IL — סידורי הושבה ואישורי הגעה לחתונות ואירועים";};},[kind]);
  const linkify=t=>t.split(/(https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+)/g).map((p,i)=>/^https?:\/\//.test(p)?<a key={i} href={p} target="_blank" rel="noopener noreferrer">{p}</a>:/@/.test(p)&&/^[\w.+-]+@/.test(p)?<a key={i} href={"mailto:"+p}>{p}</a>:p);
  const toc=page.sections.map((s,i)=>({id:"l"+(i+1),label:s.title}));
  const withToc=toc.length>2;
  return(
    <PublicPage pageKey={kind}>
      <PageHero crumbs={<><LpHomeCrumb/>{LP_SEP}<span>מידע משפטי</span></>} title={page.title} lead={`עדכון אחרון: ${page.updated}`}>
        <nav aria-label="מידע משפטי" className="lp-tabs">
          {Object.entries(LEGAL_ROUTES).map(([h,k])=>(
            <a key={k} href={h} aria-current={k===kind?"page":undefined}>{LEGAL_PAGES[k].title}</a>
          ))}
        </nav>
      </PageHero>
      <section className="lp-sec">
        <div className={`lp-doc${withToc?"":" one"}`}>
          {withToc&&<LpToc items={toc}/>}
          <article className="lp-prose" data-reveal>
            {page.sections.map(({title,text},i)=>(
              <section key={title} id={"l"+(i+1)}>
                <h2>{title}</h2>
                <p>{linkify(text)}</p>
                {kind==="privacy"&&title.startsWith("9.")&&<button type="button" onClick={openCookieSettings} className="lp-btn lp-ghost" style={{marginTop:14,padding:"10px 20px",fontSize:15}}>שינוי הבחירה (הגדרות עוגיות)</button>}
              </section>
            ))}
            <div className="lp-contact-box">
              <span>לשאלות:</span>
              <a href="mailto:sidoril2026@gmail.com">sidoril2026@gmail.com</a>
              {SUPPORT_PHONE&&<a href={`tel:${SUPPORT_TEL}`}>{SUPPORT_PHONE}</a>}
              {SUPPORT_WA&&<a href={LP_WA} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            </div>
          </article>
        </div>
      </section>
    </PublicPage>
  );
}

// ─── מדריכים (sidoril.com/guides/...) — כתובות רגילות (לא #) כדי שגוגל יאנדקס ───
const GUIDES=[
  {slug:"wedding-checklist",icon:"✅",title:"צ'קליסט לחתונה: מה לעשות ומתי",desc:"לוח זמנים מסודר להכנות לחתונה, משנה לפני ועד יום אחרי, כדי ששום דבר לא ייפול בין הכיסאות.",sections:[
    {h:"שנה עד חצי שנה לפני",p:"זה השלב של ההחלטות הגדולות. קודם כל תאריך ותקציב כללי, כי שניהם מכתיבים את כל השאר. אחר כך רשימת מוזמנים ראשונית: גם אם היא לא סופית, היא קובעת את גודל האולם.\n\n• סגירת אולם או גן אירועים\n• סגירת צלם ו-DJ או להקה (הטובים נתפסים מוקדם)\n• התחלת חיפוש שמלה וחליפה"},
    {h:"6 עד 3 חודשים לפני",p:"עכשיו סוגרים את הפרטים: עיצוב ופרחים, איפור ושיער (כולל ניסיון), טבעות ועיצוב ההזמנה. כדאי גם לפתוח תיק נישואין ברבנות כשלושה חודשים לפני, כדי לא להיות בלחץ של מסמכים ברגע האחרון."},
    {h:"חודשיים עד חודש לפני",p:"שולחים הזמנות לאורחים, בערך חודשיים לפני. הזמנה דיגיטלית עם קישור אישי חוסכת הדפסה ונותנת לכם אישורי הגעה בזמן אמת. כחודש לפני שולחים תזכורת למי שעוד לא ענה."},
    {h:"החודש האחרון",p:"• סידור הושבה ראשוני כשלושה שבועות לפני\n• מספר מנות סופי מול האולם (לפי אישורי ההגעה)\n• סידור הושבה סופי והדפסת כרטיסי שולחן שבוע לפני\n• תשלומים לספקים והכנת מעטפות"},
    {h:"ביום האירוע ואחריו",p:"ביום האירוע שולחים לאורחים את מספר השולחן, ובכניסה סורקים את ה-QR כדי לדעת מי הגיע. אחרי האירוע: הודעת תודה לאורחים ורישום המתנות."},
    {h:"איך לא לשכוח כלום",p:"ב-Sidor-IL יש מסך משימות עם כל הרשימה הזו, מותאמת לתאריך האירוע שלכם. כל משימה מקבלת תאריך יעד, ומה שבאיחור מסומן באדום."},
  ]},
  {slug:"seating-tips",icon:"🪑",title:"סידור הושבה לחתונה: 8 טיפים שיחסכו לכם ויכוחים",desc:"איך לבנות סידור הושבה שכולם מרוצים ממנו: קבוצות, שולחנות, אילוצים ומה עושים עם מי שלא מסתדר.",sections:[
    {h:"1. מתחילים מקבוצות, לא משמות",p:"מחלקים את המוזמנים לקטגוריות: משפחה קרובה, משפחה מורחבת, חברים מהעבודה, מהצבא, חברים של ההורים. קבוצה שיושבת יחד נהנית יותר, והסידור נבנה הרבה יותר מהר."},
    {h:"2. שולחן מלא עדיף על שולחן חצי ריק",p:"עדיף 10 אנשים בשולחן של 10 מאשר שני שולחנות של 6. שולחנות חצי ריקים מורידים את האווירה ועולים לכם יותר."},
    {h:"3. רושמים אילוצים מראש",p:"מי חייב לשבת יחד (זוגות, משפחות עם ילדים) ומי בשום אופן לא ליד מי. כשהאילוצים כתובים, אין צורך לזכור אותם בראש, והסידור האוטומטי ישמור עליהם."},
    {h:"4. המשפחה הקרובה קרוב לרחבה",p:"השולחנות הקרובים לבמה ולרחבה הולכים להורים, לסבים ולחברים הכי קרובים. מבוגרים מעדיפים מקום רחוק מהרמקולים."},
    {h:"5. בונים על אישורי הגעה, לא על הרשימה",p:"מושיבים רק מי שאישר הגעה. כך לא נשארים כיסאות ריקים ולא נפתחים שולחנות מיותרים."},
    {h:"6. משאירים שולחן גמיש",p:"תמיד יש מישהו שמגיע בלי לאשר. שולחן אחד עם כמה מקומות פנויים יחסוך לכם בלגן בכניסה."},
    {h:"7. מדפיסים לכניסה",p:"רשימה לפי א-ב עם מספר השולחן, או כרטיס שם לכל אורח, עוזרים למארחים בכניסה. עוד יותר טוב: QR אישי שמציג לאורח את השולחן שלו."},
    {h:"8. נותנים למחשב לעשות את העבודה הקשה",p:"ב-Sidor-IL אפשר לגרור אורחים לשולחנות על מפת האולם, או ללחוץ על הושבה אוטומטית שמושיבה לפי קטגוריות ושומרת על כללי \"ביחד\" ו\"לא ליד\"."},
  ]},
  {slug:"rsvp-guide",icon:"💌",title:"אישורי הגעה: מתי לשלוח, מה לכתוב ואיך לקבל תשובות",desc:"המדריך המלא לאישורי הגעה: תזמון, נוסח, תזכורות ומה עושים עם מי שלא עונה.",sections:[
    {h:"מתי לשלוח את ההזמנה",p:"בדרך כלל כחודשיים לפני האירוע. מוקדם מדי, אנשים שוכחים. מאוחר מדי, הם כבר תכננו משהו אחר. לאירוע קטן או לברית אפשר לשלוח גם שבוע-שבועיים לפני."},
    {h:"מה לכתוב",p:"קצר ואישי: שם האורח, מה האירוע, תאריך ומקום, וקישור לאישור הגעה. הודעה עם השם של האורח מקבלת הרבה יותר תשובות מהודעה כללית.\n\nלדוגמה: \"שלום דנה! מוזמנים לחתונה שלנו 💍 יום חמישי, 14 ביוני, באולמי הגן. לאישור הגעה: [קישור]\""},
    {h:"תזכורת למי שלא ענה",p:"כחודש לפני שולחים תזכורת רק למי שעוד לא אישר. אין צורך להטריד את מי שכבר ענה. שבוע-שבועיים אחר כך אפשר תזכורת אחרונה, או טלפון."},
    {h:"SMS, WhatsApp או טלפון?",p:"SMS מגיע לכל טלפון ולא תלוי באפליקציה. WhatsApp מרגיש אישי יותר. טלפונים הם הדרך הכי יעילה לתפוס את האחרונים שלא ענו. השילוב של כולם נותן את אחוז התשובות הכי גבוה."},
    {h:"ביום האירוע",p:"בבוקר האירוע שולחים לכל מי שאישר את מספר השולחן שלו. זה חוסך תורים בכניסה ונותן לאורחים הרגשה שחיכו להם."},
    {h:"לעשות את זה אוטומטית",p:"ב-Sidor-IL קובעים פעם אחת מתי לשלוח הזמנה, תזכורת, מספר שולחן ותודה, וההודעות יוצאות בזמן. כל תשובה מתעדכנת אצלכם מיד."},
  ]},
  {slug:"how-many-will-come",icon:"📊",title:"כמה מוזמנים באמת יגיעו? איך להעריך אחוז הגעה",desc:"איך להעריך כמה אורחים יגיעו בפועל, מה משפיע על זה, ומתי לסגור מספר מנות מול האולם.",sections:[
    {h:"למה זה כל כך חשוב",p:"האולם מחייב לפי מספר מנות שסוגרים מראש. הזמנתם יותר מדי, שילמתם על כיסאות ריקים. פחות מדי, ויש לחץ ברגע האחרון."},
    {h:"מה משפיע על אחוז ההגעה",p:"• יום בשבוע: באמצע השבוע מגיעים פחות מאשר בסוף שבוע\n• מרחק: אירוע רחוק מהמרכז מוריד את ההגעה\n• עונה וחגים: בקיץ ובתקופת חגים יש יותר ביטולים\n• הקרבה: משפחה קרובה כמעט תמיד מגיעה, מכרים רחוקים פחות"},
    {h:"איך מעריכים מראש",p:"מחלקים את הרשימה לקבוצות לפי קרבה ומעריכים לכל קבוצה בנפרד. נהוג להניח שמשפחה וחברים קרובים יגיעו כמעט כולם, ושבקבוצות הרחוקות יותר יגיעו פחות. זו הערכה בלבד, ולכן אישורי הגעה הם מה שקובע בסוף."},
    {h:"מתי סוגרים מספר",p:"בדרך כלל כשבועיים לפני האירוע, לפי מי שאישר הגעה, ועוד מרווח קטן למי שיגיע בלי לאשר. כדאי לשאול את האולם מה המרווח שהם מאפשרים לשנות ברגע האחרון."},
    {h:"לראות את המספרים בזמן אמת",p:"ב-Sidor-IL רואים כל רגע כמה אישרו, כמה לא מגיעים וכמה עוד לא ענו, בספירת אנשים (לא רק רשומות). ביום האירוע, סריקת ה-QR בכניסה מראה כמה הגיעו בפועל."},
  ]},
  {slug:"wedding-invitation-wording",icon:"✍️",title:"נוסח הזמנה לחתונה: 6 דוגמאות מוכנות להעתקה",desc:"נוסחים להזמנה לחתונה, מרשמי ועד קליל, להזמנה מודפסת ולהודעת וואטסאפ, ומה חייב להופיע בכל הזמנה.",sections:[
    {h:"מה חייב להופיע בהזמנה",p:"• שמות החתן והכלה (ולפעמים גם של ההורים)\n• יום בשבוע ותאריך, לועזי ועברי אם רוצים\n• שעת קבלת פנים ושעת חופה\n• שם האולם וכתובת מלאה\n• דרך לאשר הגעה: קישור, טלפון או QR"},
    {h:"נוסח מסורתי",p:"\"בשמחה ובהודיה לה' יתברך, אנו שמחים להזמינכם לחתונת ילדינו [שם החתן] ו[שם הכלה], שתתקיים אי\"ה ביום [יום], [תאריך], ב[שם האולם]. קבלת פנים בשעה [שעה], חופה וקידושין בשעה [שעה]. משפחות [שם] ו[שם]\""},
    {h:"נוסח מודרני",p:"\"אחרי [מספר] שנים ביחד, החלטנו שהגיע הזמן לחגוג! [שם] ו[שם] מתחתנים ומזמינים אתכם לחגוג איתנו ביום [יום], [תאריך], ב[מקום]. נתחיל ב-[שעה] ונמשיך עד שהרגליים יכאבו.\""},
    {h:"נוסח קצר לוואטסאפ",p:"\"היי [שם]! 💍 אנחנו מתחתנים ונשמח מאוד לראות אתכם. יום [יום], [תאריך], ב[מקום]. כל הפרטים ואישור הגעה בקישור: [קישור]\"\n\nבהודעה בוואטסאפ עדיף קצר: האורח לוחץ על הקישור ורואה שם את כל השאר."},
    {h:"נוסח מההורים",p:"\"[שמות ההורים] שמחים להזמינכם לחגוג עמנו את נישואי ילדנו [שם] עם [שם], בת/בן [שמות ההורים]. השמחה תתקיים ביום [יום], [תאריך], ב[מקום].\""},
    {h:"תזכורת למי שלא ענה",p:"\"היי [שם], רק מזכירים שהחתונה שלנו מתקרבת 🙂 נשמח לדעת אם אתם מגיעים, זה לוקח 10 שניות: [קישור]\"\n\nתזכורת עדינה ואישית עם השם של האורח מקבלת הרבה יותר תשובות."},
    {h:"לשלוח לכל אורח בשמו",p:"ב-Sidor-IL כותבים את הנוסח פעם אחת עם {שם}, וכל אורח מקבל הודעה עם השם שלו וקישור אישי לאישור הגעה. התשובות נכנסות לרשימה מיד."},
  ]},
  {slug:"thank-you-message",icon:"🙏",title:"נוסח הודעת תודה לאורחים אחרי החתונה או האירוע",desc:"דוגמאות להודעת תודה לאורחים אחרי חתונה, בר/בת מצווה וברית, מתי לשלוח, ואיך לשלוח לכולם בלי לשבת על זה ערב שלם.",sections:[
    {h:"מתי שולחים",p:"הכי טוב יום או יומיים אחרי האירוע, כשהחוויה עוד טרייה. גם שבוע אחרי זה בסדר גמור. העיקר לשלוח."},
    {h:"תודה כללית לכל האורחים",p:"\"תודה ענקית שבאתם לשמוח איתנו! הנוכחות שלכם עשתה לנו את הערב, ואנחנו מודים על כל ברכה, חיבוק ומתנה ❤️ באהבה, [שמות]\""},
    {h:"תודה אישית למשפחה וחברים קרובים",p:"\"[שם], רצינו להגיד תודה מיוחדת. היה לנו כל כך חשוב שתהיו שם, ובזכותכם הערב היה מושלם. אוהבים מאוד, [שמות]\""},
    {h:"תודה אחרי בר/בת מצווה",p:"\"תודה רבה שבאתם לחגוג איתנו את שמחת המצווה של [שם]! היה מרגש לראות את כולכם, ותודה על המתנות והברכות. משפחת [שם]\""},
    {h:"תודה אחרי ברית",p:"\"תודה לכל מי שבא לשמוח איתנו בברית של [שם]. השמחה שלנו גדלה בזכותכם 💙 משפחת [שם]\""},
    {h:"לשלוח לכולם בקלות",p:"ב-Sidor-IL, יום אחרי האירוע מופיעה במסך הבית הודעת תודה מוכנה עם השמות שלכם, ואפשר לשלוח אותה בוואטסאפ בלחיצה. שם גם רושמים את המתנות שקיבלתם."},
  ]},
  {slug:"bar-mitzvah-planning",icon:"✡️",title:"איך לתכנן בר מצווה או בת מצווה: המדריך המלא",desc:"לוח זמנים לתכנון בר/בת מצווה: אולם, עלייה לתורה, הזמנות, הושבה של ילדים ומבוגרים, ומה לא לשכוח.",sections:[
    {h:"שנה עד חצי שנה לפני",p:"• בוחרים סוג אירוע: ערב באולם, אירוע בוקר, טיול משפחתי או שילוב\n• סוגרים מקום ותאריך\n• לבר מצווה: מתאמים עלייה לתורה ומורה לקריאה"},
    {h:"3 חודשים לפני",p:"סוגרים צלם, DJ ותוכן לערב. זה הזמן להחליט על ברכות, מצגת או סרטון, ולבנות רשימת מוזמנים ראשונה: משפחה, חברים של ההורים וחברים של הילד."},
    {h:"חודש וחצי לפני",p:"שולחים הזמנות. בבר/בת מצווה יש שני קהלים: מבוגרים וילדים, וכדאי לדעת מראש כמה מכל אחד, כי זה משפיע על מנות ועל ההושבה."},
    {h:"ההושבה: ילדים ומבוגרים",p:"החברים מהכיתה יושבים ביחד בשולחן או שניים קרוב לרחבה. משפחה קרובה ליד ההורים, וחברים של ההורים לפי מעגלים (עבודה, שכונה, צבא). שולחן אבירים ארוך עובד מצוין לחברים של הילד."},
    {h:"שבוע לפני",p:"מספר מנות סופי לאולם, סידור הושבה סופי, והודעה לאורחים עם השעה והכתובת. ביום האירוע: כל אורח מקבל את מספר השולחן שלו."},
    {h:"לעשות את זה פשוט",p:"ב-Sidor-IL פותחים אירוע בר/בת מצווה, מייבאים את הרשימה, שולחים הזמנה עם קישור לאישור הגעה, ומושיבים על מפת האולם. ההושבה האוטומטית יודעת להפריד בין קבוצות, כמו ילדים ומבוגרים."},
  ]},
];
// זמן קריאה משוער (כ-180 מילים לדקה)
const guideMinutes=g=>Math.max(2,Math.round(g.sections.reduce((n,s)=>n+(s.h+" "+s.p).split(/\s+/).length,0)/180));
const LP_TINTS=["#FFEFF5","#F1EAFF","#E9FBF4","#FFF6E5","#EAF4FF","#FFF0E8","#F4EEFF"];
function GuideCard({ g, i=0, feat=false, H="h2" }) {
  return(
    <a href={`/guides/${g.slug}`} className={`lp-gcard lp-lift${feat?" lp-gfeat":""}`} data-reveal style={{"--d":`${(i%4*.07).toFixed(2)}s`}}>
      <span className="lp-emo" style={{background:LP_TINTS[i%LP_TINTS.length]}} aria-hidden="true">{g.icon}</span>
      <H>{g.title}</H>
      <p>{g.desc}</p>
      <span className="lp-gmeta"><span>{guideMinutes(g)} דקות קריאה</span><LpGo/></span>
    </a>
  );
}
function GuidesPage({ slug }) {
  const g=slug?GUIDES.find(x=>x.slug===slug):null;
  useEffect(()=>{
    window.scrollTo(0,0);
    const title=g?`${g.title} | Sidor-IL`:"מדריכים לתכנון אירוע | Sidor-IL";
    const desc=g?g.desc:"מדריכים מעשיים לתכנון חתונה ואירועים: צ'קליסט, סידור הושבה, אישורי הגעה ואחוז הגעה.";
    document.title=title;
    const m=document.querySelector('meta[name="description"]'),old=m?.getAttribute("content");m?.setAttribute("content",desc);
    const c=document.querySelector('link[rel="canonical"]'),oldC=c?.getAttribute("href");c?.setAttribute("href",`https://www.sidoril.com/guides${g?"/"+g.slug:""}`);
    return()=>{document.title="Sidor-IL — סידורי הושבה ואישורי הגעה לחתונות ואירועים";if(old)m.setAttribute("content",old);if(oldC)c.setAttribute("href",oldC);};
  },[slug]);
  const cta=<LpCtaBand title="מתכננים אירוע?" text="סידור הושבה, אישורי הגעה, משימות ותקציב, הכל במקום אחד. בחינם להתחלה."
    primary={{href:"/",label:"פתחו אירוע ב-Sidor-IL",onClick:e=>{e.preventDefault();goLanding(null,"register");}}}/>;
  if(slug&&!g)return(
    <PublicPage pageKey="guide-404">
      <PageHero crumbs={<><LpHomeCrumb/>{LP_SEP}<a href="/guides">מדריכים</a></>} title="המדריך לא נמצא" lead="אולי הקישור השתנה. כל המדריכים מחכים לכם כאן.">
        <a href="/guides" className="lp-btn lp-primary" style={{padding:"13px 32px 13px 14px",fontSize:18,minHeight:58}}>לכל המדריכים<LpGo/></a>
      </PageHero>
      <div style={{height:80}}/>
    </PublicPage>
  );
  if(!g)return(
    <PublicPage pageKey="guides">
      <PageHero crumbs={<><LpHomeCrumb/>{LP_SEP}<span>מדריכים</span></>} title="מדריכים לתכנון אירוע"
        lead="טיפים מעשיים לחתונה, בר/בת מצווה, ברית וכל אירוע: מה לעשות, מתי, ואיך לחסוך כאב ראש."/>
      <section className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-guides">
            {GUIDES.map((x,i)=><GuideCard key={x.slug} g={x} i={i} feat={i===0}/>)}
          </div>
        </div>
      </section>
      {cta}
    </PublicPage>
  );
  const others=GUIDES.filter(x=>x.slug!==g.slug).slice(0,3);
  const toc=g.sections.map((s,i)=>({id:"s"+(i+1),label:s.h}));
  return(
    <PublicPage pageKey={g.slug}>
      <PageHero crumbs={<><LpHomeCrumb/>{LP_SEP}<a href="/guides">מדריכים</a>{LP_SEP}<span>{g.title}</span></>} title={g.title} lead={g.desc}>
        <div className="lp-hmeta"><span><span aria-hidden="true">{g.icon}</span>{guideMinutes(g)} דקות קריאה</span><span>{g.sections.length} חלקים</span></div>
      </PageHero>
      <section className="lp-sec">
        <div className="lp-doc">
          <LpToc items={toc}/>
          <article className="lp-prose" data-reveal>
            {g.sections.map((s,i)=>(
              <section key={s.h} id={"s"+(i+1)}>
                <h2>{s.h}</h2>
                <p>{s.p}</p>
              </section>
            ))}
          </article>
        </div>
      </section>
      <section className="lp-sec" style={{paddingTop:0}} aria-label="עוד מדריכים">
        <div className="lp-wrap">
          <h2 className="lp-h3x" data-reveal>עוד מדריכים</h2>
          <div className="lp-guides lp-guides3">
            {others.map((x,i)=><GuideCard key={x.slug} g={x} i={i+1} H="h3"/>)}
          </div>
        </div>
      </section>
      {cta}
    </PublicPage>
  );
}

// דפי נחיתה לפי סוג אירוע (sidoril.com/events/<סוג>) — לחיפוש בגוגל ולקמפיינים
const EVENT_LANDINGS=[
  {slug:"wedding",icon:"💍",nav:"חתונה",title:"סידור הושבה ואישורי הגעה לחתונה",
    desc:"מערכת לסידור הושבה לחתונה: מפת אולם, הושבה אוטומטית, אישורי הגעה ב-SMS ובוואטסאפ, וכניסה מסודרת לאולם. מתחילים בחינם.",
    lead:"מ-300 מוזמנים ועד המנה האחרונה מול האולם: כל מה שצריך כדי לדעת מי מגיע ואיפה כל אחד יושב, בלי אקסלים ובלי ויכוחים.",
    points:[["🗺️","מפת אולם אמיתית","גוררים שולחנות, רחבה ובמה, ומושיבים אורחים בגרירה."],["✨","הושבה אוטומטית","לפי קטגוריות (משפחת הכלה, חברים מהצבא...) ועם כללי \"ביחד\" ו\"לא ליד\"."],["💌","אישורי הגעה","הזמנה דיגיטלית עם קישור אישי, תזכורות למי שלא ענה, ומספרים בזמן אמת."],["📊","מספר מנות מדויק","רואים כמה אנשים אישרו (לא רק רשומות), כדי לסגור מספר נכון מול האולם."],["🎟️","כניסה בלי תורים","QR אישי, רשימה מודפסת, עמדת טאבלט או צוות הושבה ביום החתונה."],["🎁","מתנות ותקציב","רישום מתנות, מעקב הוצאות ומשימות לפי תאריך החתונה."]],
    faq:[["כמה זמן לפני החתונה מתחילים?","מומלץ לפתוח את האירוע כשיש רשימת מוזמנים ראשונית, ולשלוח הזמנות כחודשיים לפני."],["אפשר לייבא את רשימת המוזמנים?","כן, מאקסל או מאנשי הקשר בטלפון."],["החתן והכלה יכולים לעבוד יחד?","כן, משתפים את האירוע וכל אחד עובד מהטלפון שלו."]]},
  {slug:"bar-mitzvah",icon:"✡️",nav:"בר/בת מצווה",title:"סידור הושבה ואישורי הגעה לבר מצווה ובת מצווה",
    desc:"סידור הושבה לבר ובת מצווה: מפת אולם, שולחן ילדים, אישורי הגעה ב-SMS ובוואטסאפ והושבה אוטומטית. מתחילים בחינם.",
    lead:"משפחה מורחבת, חברים מהכיתה ומהחוגים, והורים של חברים: מסדרים את כולם במקום אחד, בלי להתבלבל.",
    points:[["🗺️","מפת אולם","שולחנות עגולים, אבירים ושולחנות ילדים, בדיוק כמו באולם."],["👦","שולחן ילדים בקלות","קטגוריה נפרדת לחברים של חתן או כלת המצווה, והושבה אוטומטית לפיה."],["💌","אישורי הגעה","הזמנה דיגיטלית עם תאריך, שעה ומקום, ותזכורות למי שלא ענה."],["📊","ספירה מדויקת","כמה מבוגרים, כמה ילדים, ומי עוד לא ענה."],["🎟️","כניסה מסודרת","כל אורח מקבל את מספר השולחן שלו ביום האירוע."],["🧾","משימות ותקציב","רשימת משימות מותאמת לתאריך ומעקב הוצאות."]],
    faq:[["אפשר לעשות גם אירוע בוקר בבית הכנסת?","כן, פותחים אירוע נפרד לכל חלק."],["מתאים גם לבת מצווה?","כן, בוחרים את סוג האירוע וההזמנה מותאמת אליו."]]},
  {slug:"brit",icon:"👶",nav:"ברית",title:"אישורי הגעה והושבה לברית ולבריתה",
    desc:"הזמנה דיגיטלית ואישורי הגעה לברית תוך דקות: שולחים בוואטסאפ, רואים מי מגיע, ומושיבים בקלות. מתחילים בחינם.",
    lead:"ברית מתארגנת בשבוע אחד. שולחים הזמנה דיגיטלית כבר היום, ורואים בזמן אמת מי מגיע.",
    points:[["⚡","הזמנה תוך דקות","ממלאים תאריך, שעה ומקום, ומקבלים קישור מוכן לשליחה."],["💬","שליחה בוואטסאפ","הודעה מעוצבת עם קישור לאישור הגעה, ישר מהטלפון."],["📊","מי מגיע","רואים מי אישר, כמה אנשים, ומי עוד לא ענה."],["🗺️","הושבה פשוטה","מסדרים שולחנות במפה או מדפיסים רשימה לכניסה."]],
    faq:[["אפשר להשתמש גם לבריתה?","כן, עורכים את נוסח ההזמנה כמו שרוצים."],["צריך להתקין אפליקציה?","לא, הכל עובד מהדפדפן בטלפון ובמחשב."]]},
  {slug:"business",icon:"💼",nav:"אירוע עסקי",title:"ניהול רישום והושבה לאירועים עסקיים וכנסים",
    desc:"אישורי הגעה, הושבה וצ'ק-אין לכנסים, ערבי חברה ואירועי לקוחות: רשימות, QR בכניסה ועמדת טאבלט. מתחילים בחינם.",
    lead:"ערב חברה, כנס לקוחות או השקה: יודעים מי נרשם, מסדרים שולחנות לפי מחלקות וחברות, ומקבלים את האורחים בכניסה במהירות.",
    points:[["📋","רשימות מוזמנים","ייבוא מאקסל, חלוקה לפי חברה או מחלקה."],["💌","הזמנה ואישור הגעה","דף הזמנה מקצועי עם פרטי האירוע וקישור אישי לכל מוזמן."],["🗺️","הושבה לפי קבוצות","מפת אולם והושבה אוטומטית לפי חברה או צוות."],["📟","צ'ק-אין בכניסה","סריקת QR או עמדת טאבלט שבה האורח מקליד את השם ומקבל את השולחן."],["📊","נתונים בזמן אמת","כמה נרשמו, כמה הגיעו בפועל ומי חסר."]],
    faq:[["אפשר לנהל כמה אירועים במקביל?","כן, כל אירוע מנוהל בנפרד מאותו חשבון."],["יש שירות בשטח?","כן, אפשר להזמין צוות הושבה או עמדת טאבלט ליום האירוע."]]},
];
const LP_EVENT_IMG={wedding:"photo-1775476793931-cb484f197760","bar-mitzvah":"photo-1792587545791-dbff25ac7905",brit:"photo-1510154221590-ff63e90a136f",business:"photo-1511578314322-379afb476865"};
const LP_EVENT_FOR={wedding:"לחתונה","bar-mitzvah":"לבר/בת מצווה",brit:"לברית",business:"לאירוע עסקי"};
function EventLandingPage({ slug }) {
  const p=EVENT_LANDINGS.find(x=>x.slug===slug);
  useEffect(()=>{
    window.scrollTo(0,0);
    if(!p)return;
    document.title=`${p.title} | Sidor-IL`;
    const m=document.querySelector('meta[name="description"]'),old=m?.getAttribute("content");m?.setAttribute("content",p.desc);
    const c=document.querySelector('link[rel="canonical"]'),oldC=c?.getAttribute("href");c?.setAttribute("href",`https://www.sidoril.com/events/${p.slug}`);
    const ld=document.createElement("script");ld.type="application/ld+json";
    ld.text=JSON.stringify({"@context":"https://schema.org","@type":"FAQPage",mainEntity:p.faq.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))});
    document.head.appendChild(ld);
    return()=>{document.title="Sidor-IL — סידורי הושבה ואישורי הגעה לחתונות ואירועים";if(old)m.setAttribute("content",old);if(oldC)c.setAttribute("href",oldC);ld.remove();};
  },[slug]);
  if(!p)return(
    <PublicPage pageKey="event-404">
      <PageHero crumbs={<><LpHomeCrumb/></>} title="הדף לא נמצא" lead="אולי הקישור השתנה. אפשר לחזור לדף הבית או לבחור סוג אירוע.">
        <div className="lp-chips">{EVENT_LANDINGS.map(x=><a key={x.slug} href={`/events/${x.slug}`}><span aria-hidden="true">{x.icon}</span>{x.nav}</a>)}</div>
      </PageHero>
      <div style={{height:80}}/>
    </PublicPage>
  );
  const start=`/?ref=lp-${p.slug}`;
  const img=`/img/u/${String(LP_EVENT_IMG[p.slug]).replace(/^photo-/,"")}_1800.webp`;
  return(
    <PublicPage pageKey={p.slug}>
      <PageHero img={img} crumbs={<><LpHomeCrumb/>{LP_SEP}<span>{p.nav}</span></>} title={p.title} lead={p.lead} aside={<HeroSeating/>}>
        <div className="lp-hero-cta" style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:18}}>
          <a href={start} className="lp-btn lp-primary" style={{padding:"13px 32px 13px 14px",fontSize:18,minHeight:58}}>פתחו אירוע בחינם<LpGo/></a>
          <a href="#ev-what" className="lp-btn lp-ghost" style={{padding:"13px 30px",fontSize:18,minHeight:58}}>מה מקבלים</a>
        </div>
        <div className="lp-facts lp-facts6">
          {[["₪0",`עד ${FREE_SEATING_LIMIT} מוזמנים`,"#E3F8EF","#9FE6CB","#156B4A"],["בלי","כרטיס אשראי","#F1EAFF","#D9C6FF","#4A2C8F"],["WhatsApp","ו-SMS לאישורים","#FFE6F0","#FFB8D6","#A3245E"],["2 דקות","ופותחים אירוע","#FFF4D6","#FFD796","#7A4E00"]].map(([v,l,bg,bd,fg])=>(
            <div key={l} className="lp-fact" style={{"--bg":bg,"--bd":bd,"--fg":fg}}><b>{v}</b><span>{l}</span></div>
          ))}
        </div>
      </PageHero>
      <section id="ev-what" className="lp-sheet" style={{background:"#EEF9F4",marginTop:28}}>
        <div className="lp-wrap">
          <LpTitle title="כל מה שצריך" accent={LP_EVENT_FOR[p.slug]} sub={p.desc}/>
          <div className="lp-cards">
            {p.points.map(([ic,h,t],k)=>(
              <div key={h} className="lp-pcard2 lp-lift" data-reveal style={{"--d":`${(k%3*.07).toFixed(2)}s`}}>
                <span className="lp-emo" style={{background:LP_TINTS[k%LP_TINTS.length]}} aria-hidden="true">{ic}</span>
                <h3>{h}</h3>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="lp-sheet" style={{background:"#F6F3FF"}}>
        <div className="lp-wrap">
          <LpTitle title="מאקסל מבולגן" accent="למפה ברורה" sub="מעלים את הרשימה שכבר יש לכם, ו-Sidor-IL הופכת אותה למפת אולם מסודרת, שבה רואים מי יושב איפה."/>
          <ExcelToMap/>
        </div>
      </section>
      <section className="lp-sheet" style={{background:"#FFF9E6"}}>
        <div className="lp-faq-wrap">
          <LpTitle title="שאלות" accent="ותשובות" sub="מה שכדאי לדעת לפני שמתחילים." mb={0}/>
          <div>
            {p.faq.map(([q,a],i)=>(
              <details key={q} className="lp-faq" data-reveal style={{"--d":`${(i*.05).toFixed(2)}s`}}>
                <summary>{q}<span className="lp-faq-ic" aria-hidden="true">+</span></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="lp-sec" style={{paddingTop:0}} aria-label="סוגי אירועים נוספים">
        <div className="lp-wrap">
          <h2 className="lp-h3x" data-reveal>עוד סוגי אירועים</h2>
          <div className="lp-chips" data-reveal style={{"--d":".06s"}}>
            {EVENT_LANDINGS.filter(x=>x.slug!==p.slug).map(x=><a key={x.slug} href={`/events/${x.slug}`}><span aria-hidden="true">{x.icon}</span>{x.nav}</a>)}
            <a href="/guides"><span aria-hidden="true">📚</span>מדריכים</a>
          </div>
        </div>
      </section>
      <LpCtaBand title="מוכנים להתחיל?" text="פותחים אירוע תוך דקה, בלי כרטיס אשראי." primary={{href:start,label:"פתחו אירוע ב-Sidor-IL"}}/>
    </PublicPage>
  );
}

// קישור אישי קצר מ-SMS (sidoril.com/i/<קוד>)  -  מתרגם לדף ההזמנה של האורח

// ─── מערכת הניהול נטענת רק כשצריך (אחרי כניסה): app-heavy.jsx ───
const loadHeavy=()=>import("./app-heavy.jsx");
const heavyPart=name=>{const L=lazy(()=>loadHeavy().then(m=>({default:m[name]})));return function HeavyPart(props){return <Suspense fallback={<HeavyLoading/>}><L {...props}/></Suspense>;};};
function HeavyLoading(){return <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner size={36}/></div>;}
const SeatingApp=heavyPart("SeatingApp");
// מסך האדמין עובר קודם דרך אימות דו־שלבי (AdminSecure), ורק אחריו מוצג AdminDashboard
const AdminSecure=heavyPart("AdminSecure");
const CreateEventScreen=heavyPart("CreateEventScreen");
const SupplierHome=heavyPart("SupplierHome");
const AdminLogin=heavyPart("AdminLogin");
// מתחילים להוריד את המערכת ברקע כשמשתמש מחובר (או כשהדפדפן פנוי), כדי שהמעבר אליה יהיה מיידי
export const prefetchHeavy=()=>{try{loadHeavy();}catch{}};

export default function App() {
  useEffect(()=>{installFxRipple();},[]);
  const [user,setUser]=useState(null),[event,setEvent]=useState(null),[checking,setChecking]=useState(true),[authMode,setAuthMode]=useState(null);
  // משתמש מחובר: מורידים את מערכת הניהול ברקע כבר עכשיו, כדי שהכניסה לאירוע תהיה מיידית
  useEffect(()=>{if(user)prefetchHeavy();},[user]);
  // משתמש מחובר שעבר לדף הבית: רענון באותה לשונית נשאר בדף הבית (ולא קופץ לאירועים)
  // כניסה חדשה לאתר (לא רענון באותה לשונית) תמיד בדף הבית — גם למשתמש מחובר ("האירועים שלי" מכניס למערכת).
  // חוץ מ: האפליקציה המותקנת (נפתחת ישר למערכת), ואדמין שפותח אירוע בלשונית חדשה
  const [showLanding,setShowLanding]=useState(()=>{try{
    if(sessionStorage.getItem("sidor_landing")==="1")return true;
    if(localStorage.getItem("sidor_open_now")){localStorage.removeItem("sidor_open_now");return false;}
    return FRESH_OPEN&&!isStandalone();
  }catch{return false;}});
  useEffect(()=>{try{showLanding?sessionStorage.setItem("sidor_landing","1"):sessionStorage.removeItem("sidor_landing");}catch{}},[showLanding]);
  // מעבר בין דף הבית, רשימת האירועים ואירוע — תמיד מלמעלה (אחרת בנייד נשארת הגלילה של הדף הקודם)
  useEffect(()=>{if(window.location.hash.length>1&&showLanding)return;try{window.scrollTo(0,0);}catch{}},[showLanding,event?.id]);
  const [legal,setLegal]=useState(LEGAL_ROUTES[window.location.hash]||null);
  const [,setHashTick]=useState(0);
  const [showResetPw,setShowResetPw]=useState(false);
  const [resetPw,setResetPw]=useState({newP:"",confirm:"",msg:null,loading:false});

  useEffect(()=>{
    // כל שינוי בכתובת (#) מרנדר מחדש — למשל "→ לאתר" מדף הניהול
    const onHash=()=>{setLegal(LEGAL_ROUTES[window.location.hash]||null);setHashTick(t=>t+1);};
    window.addEventListener("hashchange",onHash);
    // זיהוי קישור שחזור סיסמה בלבד (לא כניסה עם גוגל)
    const hash=window.location.hash;
    if(hash.includes("type=recovery")){
      setShowResetPw(true);
    }
    return()=>window.removeEventListener("hashchange",onHash);
  },[]);

  // ספק: נבחר "ספק" בהרשמה (במכשיר הזה) או שיש לו פרופיל ספק → אזור הספקים. "לאירועים שלי" עובר לאירועים (עד סגירת הלשונית)
  // ברירת המחדל בפתיחת האתר: מי שיש לו אירועים נכנס לאירועים; רק ספק בלי אירועים נכנס לאזור הספקים.
  // בחירה מפורשת בלשונית הזו (sessionStorage): "1" = לאירועים, "0" = לאזור הספקים
  const [isVendor,setIsVendor]=useState(false),[hasEvents,setHasEvents]=useState(null),[vendorSetup,setVendorSetup]=useState(false);
  const [vendorChoice,setVendorChoice]=useState(()=>{try{return sessionStorage.getItem("sidor_vendor_events");}catch{return null;}});
  const setVendorEvents=v=>{const c=v?"1":"0";setVendorChoice(c);try{sessionStorage.setItem("sidor_vendor_events",c);}catch{}};
  const vendorView=vendorChoice==="0"?true:vendorChoice==="1"?false:hasEvents===false;
  useEffect(()=>{
    if(!user){setHasEvents(null);return;}
    Promise.all([
      sb.from("events").select("id").eq("user_id",user.id).limit(1),
      sb.from("event_members").select("event_id").eq("email",String(user.email||"").toLowerCase()).limit(1),
    ]).then(([a,b])=>setHasEvents(!!((a.data||[]).length||(b.data||[]).length)),()=>setHasEvents(true));
  },[user?.id,event?.id]);
  useEffect(()=>{
    if(!user){setIsVendor(false);return;}
    try{localStorage.removeItem(ACCOUNT_KEY);}catch{}
    Promise.all([sb.from("vendor_profiles").select("user_id").eq("user_id",user.id).maybeSingle(),sb.from("user_packages").select("package_id").eq("user_id",user.id).eq("package_id","vendor")])
      .then(([a,b])=>{const pkg=!!(b.data||[]).length;setIsVendor(!!a.data||pkg);setVendorSetup(pkg&&!a.data);},()=>{});
  },[user?.id]);

  const selectEvent=(ev,scr="home")=>{
    // כניסה לאירוע מהרשימה למסך הראשי (או למסך שביקשו, למשל כניסה לאולם מלוח המפיק). שחזור המסך האחרון הוא רק לרענון דף
    if(ev)optSet(LAST_SCREEN_KEY,JSON.stringify({eventId:ev.id,screen:typeof scr==="string"?scr:"home",view:readLastScreen(ev.id)?.view||"list"}));
    setEvent(ev);
    if(ev)optSet("sidor_event_id",ev.id);
    else localStorage.removeItem("sidor_event_id");
  };

  // ← useEffect חייב להיות לפני כל return!
  useEffect(()=>{
    captureRef();
    sb.auth.getSession().then(async({data})=>{
      const u=data.session?.user||null;
      setUser(u);
      applyRef(u);
      // שחזור האירוע האחרון אחרי רענון דף
      const savedId=localStorage.getItem("sidor_event_id");
      let producerEntry=false;try{producerEntry=!!sessionStorage.getItem(PRODUCER_ENTRY_KEY);}catch{}
      if(u&&savedId&&!producerEntry){
        // RLS מחזיר רק אירוע שלי או אירוע ששותף איתי
        const{data:ev}=await sb.from("events").select("*").eq("id",savedId).maybeSingle();
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
        if(evt==="SIGNED_IN")applyRef(session.user);
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

  const shortMatch=shortRouteMatch();
  if(shortMatch)return <ShortLinkRedirect short={shortMatch[1]}/>;
  const guideMatch=path.match(/^\/guides(?:\/([\w-]+))?\/?$/);
  if(guideMatch)return <><GuidesPage slug={guideMatch[1]||null}/><AccessibilityWidget/></>;
  const lpMatch=path.match(/^\/events\/([\w-]+)\/?$/);
  if(lpMatch)return <><EventLandingPage slug={lpMatch[1]}/><AccessibilityWidget/></>;

  if(inviteRouteMatch())return <InviteRoute/>;

  if(checking)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><Spinner size={40}/></div>);

  // ניתוב לדף אדמין  -  לפני כל שאר הניתובים!
  if(isAdmin){
    if(!isAdminUser(user))return(
      <AdminLogin onSuccess={u=>{setUser(u);}} onClose={()=>window.location.hash=""}/>
    );
    return(<><style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AdminSecure user={user} onLogout={logout}/>
    </>);
  }

  if(legal) return <><LegalPage kind={legal}/><AccessibilityWidget/></>;

  // דף איפוס סיסמה
  if(showResetPw) return(
    <div dir="rtl" style={{minHeight:"100vh",background:"#FBF7FC",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Heebo',sans-serif",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:32,width:"100%",maxWidth:400,boxShadow:"0 8px 32px rgba(91,60,140,.12)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>🔑</div>
          <div style={{fontSize:20,fontWeight:900,color:"#1a1a1a"}}>הגדרת סיסמה חדשה</div>
          <div style={{fontSize:13,color:"#6E6585",marginTop:4}}>הזן את הסיסמה החדשה שלך</div>
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

  if(!user||showLanding) return(<><style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}} @keyframes slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:none;opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}} @media(min-width:768px){.nav-link{display:block!important;}} @media(max-width:767px){.hide-mobile{display:none!important;}}`}</style>
    {/* משתמש מחובר שחזר לדף הבית: כפתורי הכניסה מחזירים אותו ישר למערכת */}
    <LandingPage onOpenAuth={mode=>{
      setShowLanding(false);
      // הצטרפות ספקים / מפיקים: פנייה אלינו בוואטסאפ (אין הרשמה נפרדת)
      if(mode==="join"||mode==="producer"||mode==="vendor"){openJoin();return;}
      // "לספקים ולמחירים": מחובר עם אירוע פתוח — ישר למסך הספקים של האירוע; לא מחובר — הרשמה
      if(mode==="vendors"){
        if(user&&event)setPendingScreen("vendors");
        if(!user)setAuthMode("register");
        return;
      }
      // "האירועים שלי" (מחובר): תמיד לרשימת האירועים (לא ישר לאירוע האחרון), גם לספק — לא לאזור הספקים
      if(mode==="login"&&user){setVendorEvents(true);selectEvent(null);}
      if(!user)setAuthMode(mode);
    }} onLogout={user?logout:null} loggedIn={!!user}/>
    {authMode&&<AuthDrawer mode={authMode} onClose={()=>setAuthMode(null)} onAuth={u=>{setUser(u);setAuthMode(null);setShowLanding(false);}}/>}
    <AccessibilityWidget/>
    <CookieNotice/>
  </>);

  if(!event&&isVendor&&vendorView)return(<><style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <SupplierHome user={user} onLogout={logout} onEvents={()=>setVendorEvents(true)} onBackToLanding={()=>setShowLanding(true)}/>
    <CookieNotice/>
  </>);

  if(!event)return(<><style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <CreateEventScreen user={user} onSelect={selectEvent} onLogout={logout} onBackToLanding={()=>setShowLanding(true)} onVendor={isVendor?()=>setVendorEvents(false):null} vendorSetup={vendorSetup}/>
    <CookieNotice/>
  </>);

  return(<><style>{`*{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}`}</style>
  <SeatingApp user={user} event={event} onBack={()=>selectEvent(null)} onUpdate={data=>setEvent(ev=>({...ev,...data}))} onLogout={logout} onHome={()=>setShowLanding(true)}/><CookieNotice/>
  {isAdminUser(user)&&event.user_id&&event.user_id!==user.id&&(
    <div role="status" dir="rtl" style={{position:"fixed",zIndex:400,bottom:14,left:"50%",translate:"-50% 0",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:"calc(100vw - 24px)",background:"#2B1D3F",color:"#fff",borderRadius:100,padding:"8px 10px 8px 16px",fontFamily:"'Heebo',sans-serif",fontSize:13,fontWeight:700,boxShadow:"0 18px 40px -16px rgba(20,5,50,.7)"}}>
      <span>👑 מצב אדמין: אירוע של לקוח. כל שינוי נשמר אצלו.</span>
      <button onClick={()=>{selectEvent(null);window.location.href="/#/admin";}} style={{background:"#fff",color:"#2B1D3F",border:"none",borderRadius:100,padding:"6px 12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>חזרה לאדמין</button>
    </div>
  )}</>);
}
