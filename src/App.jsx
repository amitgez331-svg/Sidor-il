import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zcfosfaazvljnzipyzon.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZm9zZmFhenZsam56aXB5em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzU0MzYsImV4cCI6MjA5MTg1MTQzNn0.TG843P0ouzgewhxJbt3aphv-LICWqs3hbQL6v9VbTjE";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  bg:"#F0F4FF", surface:"#FFFFFF", border:"#D6E0FF",
  blue:"#1B3A8C", blueM:"#2952C8", blueL:"#4A7AFF", blueXL:"#E8EEFF",
  text:"#0D1B4B", muted:"#6B7DB3", success:"#2D9B5A",
  danger:"#D63B3B", gold:"#F0A500", info:"#2E6FB5",
};

const TABLE_TYPES = {
  round:  { label:"עגול",         icon:"⭕", defaultSeats:8  },
  rect:   { label:"מרובע",        icon:"⬛", defaultSeats:10 },
  knight: { label:"שולחן אבירים", icon:"👑", defaultSeats:20 },
};

const pct    = t => t.seats ? Math.round((t.guests||[]).length/t.seats*100) : 0;
const sColor = t => { const g=(t.guests||[]).length; return g>=t.seats?C.danger:g>=t.seats*.8?C.gold:C.success; };
const isMobile = () => window.innerWidth < 768;

const Spinner = ({size=24,color=C.blue}) => (
  <div style={{width:size,height:size,borderRadius:"50%",border:`2.5px solid ${color}22`,borderTopColor:color,animation:"spin .7s linear infinite",flexShrink:0}}/>
);

const Btn = ({children,primary,ghost,danger,small,full,onClick,disabled,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:danger?C.danger:primary?`linear-gradient(135deg,${C.blueM},${C.blueL})`:ghost?"transparent":C.surface,
    color:(primary||danger)?"#fff":ghost?C.blue:C.text,
    border:`1.5px solid ${danger?C.danger:primary?"transparent":ghost?C.blue:C.border}`,
    borderRadius:14,padding:small?"7px 16px":"11px 22px",fontSize:small?12:14,fontWeight:700,
    cursor:"pointer",opacity:disabled?.45:1,fontFamily:"inherit",transition:"all .15s",
    width:full?"100%":"auto",boxShadow:primary?`0 4px 16px ${C.blueL}44`:"none",...style,
  }}>{children}</button>
);

const Card = ({children,style={},...props}) => (
  <div style={{background:C.surface,borderRadius:18,border:`1px solid ${C.border}`,boxShadow:"0 2px 12px rgba(27,58,140,0.06)",...style}} {...props}>{children}</div>
);

const Inp = ({value,onChange,placeholder,onKeyDown,type="text",style={}}) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
    style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",...style}}/>
);

// ─── TABLE NODE ───────────────────────────────────────────────────────────────
function TableNode({ table, selected, onMouseDown, onDrop }) {
  const sc=sColor(table),p=pct(table),guests=table.guests||[];
  const dp={onDragOver:e=>{e.preventDefault();e.stopPropagation();},onDrop:e=>{e.preventDefault();e.stopPropagation();onDrop(e);}};
  if(table.type==="knight"){const W=170,H=56;return(<div onMouseDown={onMouseDown} {...dp} style={{position:"absolute",left:table.x,top:table.y,width:W,height:H,cursor:"grab",userSelect:"none",zIndex:selected?10:1,filter:selected?`drop-shadow(0 4px 18px ${C.blueL}88)`:"drop-shadow(0 2px 8px #0002)"}}><svg width={W} height={H}><rect x={1} y={1} width={W-2} height={H-2} rx={10} fill={C.surface} stroke={selected?C.blueL:C.border} strokeWidth={selected?2:1}/>{p>0&&<rect x={4} y={4} width={(p/100)*(W-8)} height={H-8} rx={7} fill={sc} opacity={.18}/>}{Array.from({length:Math.min(table.seats,11)}).map((_,i)=><circle key={i} cx={12+i*14} cy={9} r={4} fill={i<guests.length?sc:C.border}/>)}</svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none"}}><span style={{fontSize:11,fontWeight:800,color:C.text}}>{table.name}</span><span style={{fontSize:10,color:C.muted}}>{guests.length}/{table.seats}</span></div></div>);}
  if(table.type==="rect"){const W=104,H=84;return(<div onMouseDown={onMouseDown} {...dp} style={{position:"absolute",left:table.x,top:table.y,width:W,height:H,cursor:"grab",userSelect:"none",zIndex:selected?10:1,filter:selected?`drop-shadow(0 4px 18px ${C.blueL}88)`:"drop-shadow(0 2px 8px #0002)"}}><svg width={W} height={H}><rect x={1} y={1} width={W-2} height={H-2} rx={8} fill={C.surface} stroke={selected?C.blueL:C.border} strokeWidth={selected?2:1}/>{p>0&&<rect x={4} y={4} width={(p/100)*(W-8)} height={H-8} rx={5} fill={sc} opacity={.15}/>}{Array.from({length:table.seats}).map((_,i)=>{const pr=Math.ceil(table.seats/2),row=i<pr?0:1,col=i%pr,x=10+col*(W-20)/(pr-1||1),y=row===0?8:H-8;return<circle key={i} cx={x} cy={y} r={4} fill={i<guests.length?sc:C.border}/>;})}</svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none"}}><span style={{fontSize:10,fontWeight:800,color:C.text}}>{table.name}</span><span style={{fontSize:9,color:C.muted}}>{guests.length}/{table.seats}</span></div></div>);}
  const R=52,circ=2*Math.PI*(R-8);
  return(<div onMouseDown={onMouseDown} {...dp} style={{position:"absolute",left:table.x,top:table.y,width:R*2+4,height:R*2+4,cursor:"grab",userSelect:"none",zIndex:selected?10:1,filter:selected?`drop-shadow(0 4px 18px ${C.blueL}88)`:"drop-shadow(0 2px 8px #0002)"}}><svg width={R*2+4} height={R*2+4}><circle cx={R+2} cy={R+4} r={R-1} fill="rgba(27,58,140,0.05)"/><circle cx={R+2} cy={R+2} r={R} fill={C.surface} stroke={selected?C.blueL:C.border} strokeWidth={selected?2:1}/>{p>0&&<circle cx={R+2} cy={R+2} r={R-8} fill="none" stroke={sc} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${(p/100)*circ} ${circ}`} transform={`rotate(-90 ${R+2} ${R+2})`} opacity={.8}/>}{Array.from({length:table.seats}).map((_,i)=>{const a=(i/table.seats)*Math.PI*2-Math.PI/2;return<circle key={i} cx={R+2+(R-2)*Math.cos(a)} cy={R+2+(R-2)*Math.sin(a)} r={3.5} fill={i<guests.length?sc:C.border}/>;})}</svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none"}}><span style={{fontSize:13}}>{TABLE_TYPES[table.type]?.icon}</span><span style={{fontSize:11,fontWeight:800,color:C.text,textAlign:"center",maxWidth:76,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{table.name}</span><span style={{fontSize:10,color:C.muted}}>{guests.length}/{table.seats}</span></div></div>);
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
function GuestModal({ guest, eventId, onSave, onClose }) {
  const [name,setName]=useState(guest?.name||"");
  const [phone,setPhone]=useState(guest?.phone||"");
  const [rsvp,setRsvp]=useState(guest?.rsvp||"pending");
  const [count,setCount]=useState(guest?.guest_count||1);
  const isEdit=!!guest?.id;

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
        <div style={{fontWeight:800,fontSize:18,color:C.text,marginBottom:18}}>{isEdit?"✏️ עריכת אורח":"➕ הוסף אורח"}</div>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>שם מלא *</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="ישראל ישראלי"
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
          {[["confirmed","✓ מגיע","#F0FFF6",C.success],["pending","⏳ ממתין",C.blueXL,C.blue],["declined","✗ לא מגיע","#FEF2F2",C.danger]].map(([v,l,bg,col])=>(
            <button key={v} onClick={()=>setRsvp(v)} style={{background:rsvp===v?col:bg,color:rsvp===v?"#fff":col,border:`2px solid ${rsvp===v?col:C.border}`,borderRadius:12,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,transition:"all .15s"}}>{l}</button>
          ))}
        </div>

        <button onClick={()=>name.trim()&&onSave({name:name.trim(),phone:phone.trim(),rsvp,guest_count:count})} disabled={!name.trim()}
          style={{width:"100%",background:name.trim()?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#E8EEFF",color:name.trim()?"#fff":C.muted,border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:name.trim()?"pointer":"default",fontFamily:"inherit"}}>
          {isEdit?"שמור שינויים ✓":"הוסף אורח ✓"}
        </button>
      </div>
    </div>
  );
}

function ReceiptModal({ tables, onClose }) {
  const [q,setQ]=useState(""),[res,setRes]=useState(null),[nf,setNf]=useState(false);
  const search=v=>{setQ(v);setRes(null);setNf(false);if(!v.trim())return;for(let i=0;i<tables.length;i++){const t=tables[i],g=(t.guests||[]).find(g=>g.name.toLowerCase().includes(v.toLowerCase()));if(g){setRes({guest:g,table:t,num:i+1});return;}}setNf(true);};
  const print=()=>{if(!res)return;const w=window.open("","_blank","width=320,height=420");w.document.write(`<html><head><style>body{font-family:monospace;width:280px;margin:0 auto;padding:16px;direction:rtl}.logo{text-align:center;font-size:18px;font-weight:900;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:14px}.name{font-size:26px;font-weight:900;margin-bottom:14px}.box{border:3px solid #000;border-radius:8px;padding:12px;text-align:center;margin-bottom:14px}.num{font-size:56px;font-weight:900;line-height:1}.footer{text-align:center;font-size:11px;border-top:1px dashed #000;padding-top:10px;color:#888}</style></head><body><div class="logo">Sidor-IL</div><div style="font-size:12px;color:#666">שם האורח</div><div class="name">${res.guest.name}</div><div class="box"><div style="font-size:13px;color:#444">שולחן מספר</div><div class="num">${res.num}</div><div style="font-size:16px;font-weight:700">${res.table.name}</div></div><div class="footer">ברוך הבא! sidor-il.co.il</div></body></html>`);w.document.close();setTimeout(()=>{w.focus();w.print();},400);};
  return(<div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl"}}><div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}}/><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🖨️</div><div><div style={{fontWeight:800,fontSize:16,color:C.text}}>חיפוש אורח</div><div style={{fontSize:12,color:C.muted}}>הדפסת פתק שולחן</div></div></div><input value={q} onChange={e=>search(e.target.value)} placeholder="הקלד שם אורח..." style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>{res&&<div style={{background:C.blueXL,border:`2px solid ${C.blueL}`,borderRadius:16,overflow:"hidden",marginBottom:12}}><div style={{background:"#fff",margin:12,borderRadius:12,border:`1px dashed ${C.border}`,padding:"16px",textAlign:"center",fontFamily:"monospace"}}><div style={{fontSize:11,fontWeight:900,letterSpacing:2,color:C.blue,marginBottom:6}}>Sidor-IL</div><div style={{fontSize:12,color:C.muted}}>שם האורח</div><div style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:10}}>{res.guest.name}</div><div style={{border:`3px solid ${C.text}`,borderRadius:10,padding:"10px",marginBottom:8}}><div style={{fontSize:12,color:C.muted}}>שולחן מספר</div><div style={{fontSize:48,fontWeight:900,lineHeight:1,color:C.blue}}>{res.num}</div><div style={{fontSize:15,fontWeight:700,color:C.text}}>{res.table.name}</div></div><div style={{fontSize:11,color:C.muted}}>ברוך הבא! 🎉</div></div><div style={{padding:"0 12px 12px"}}><Btn primary full onClick={print}>🖨️ הדפס פתק</Btn></div></div>}{nf&&<div style={{background:"#FEF2F2",border:`1px solid ${C.danger}30`,borderRadius:12,padding:"12px",textAlign:"center",color:C.danger,fontSize:14}}>לא נמצא "{q}"</div>}{!q&&<div style={{textAlign:"center",color:C.muted,fontSize:14,padding:"20px 0"}}>🔍 הקלד שם לחיפוש</div>}</div></div>);
}

function Countdown({ date }) {
  const [time,setTime]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{const calc=()=>{const diff=new Date(date)-new Date();if(diff<=0){setTime({d:0,h:0,m:0,s:0});return;}setTime({d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)});};calc();const id=setInterval(calc,1000);return()=>clearInterval(id);},[date]);
  return(<div style={{display:"flex",gap:8,justifyContent:"center"}}>{[["d","ימים"],["h","שעות"],["m","דקות"],["s","שניות"]].map(([k,l])=>(<div key={k} style={{textAlign:"center",background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 10px",minWidth:52}}><div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1}}>{String(time[k]).padStart(2,"0")}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.7)",marginTop:2}}>{l}</div></div>))}</div>);
}

// ─── HAMBURGER MENU ───────────────────────────────────────────────────────────
function HamburgerMenu({ onOpenAuth, onClose }) {
  const menuItems = [
    { icon:"🏠", label:"ראשי", href:"#" },
    { icon:"🪑", label:"סידורי הושבה", href:"#features" },
    { icon:"✅", label:"אישורי הגעה", href:"#features" },
    { icon:"💰", label:"חבילות ומחירים", href:"#pricing" },
    { icon:"🏢", label:"אולמות / מפיקים", href:"#audience" },
    { icon:"📞", label:"צור קשר", href:"#contact" },
  ];
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)"}}/>
      <div style={{position:"fixed",top:0,left:0,bottom:0,zIndex:201,width:300,maxWidth:"85vw",background:C.surface,boxShadow:"4px 0 40px rgba(13,27,75,.2)",display:"flex",flexDirection:"column",animation:"slideInLeft .3s ease both",direction:"rtl"}}>
        <div style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"32px 20px 24px",position:"relative"}}>
          <div style={{position:"absolute",inset:0,opacity:.07,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"12px 12px"}}/>
          <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative",zIndex:1}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#fff",fontWeight:900}}>◈</div>
            <div><div style={{fontWeight:900,fontSize:18,color:"#fff"}}>Sidor-IL</div><div style={{fontSize:11,color:"rgba(255,255,255,.65)"}}>סידורי הושבה חכמים</div></div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 0"}}>
          {menuItems.map(item=>(
            <a key={item.label} href={item.href} onClick={onClose} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",textDecoration:"none",color:C.text,fontSize:15,fontWeight:600,borderBottom:`1px solid ${C.border}`,transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=C.blueXL} onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <span style={{fontSize:20,width:28,textAlign:"center"}}>{item.icon}</span>
              {item.label}
              <span style={{marginRight:"auto",color:C.muted,fontSize:16}}>←</span>
            </a>
          ))}
        </div>
        <div style={{padding:20,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>{onOpenAuth("register");onClose();}} style={{background:`linear-gradient(135deg,${C.blue},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 16px ${C.blueL}44`}}>🚀 הרשמה בחינם</button>
          <button onClick={()=>{onOpenAuth("login");onClose();}} style={{background:"transparent",color:C.blue,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>כניסה למערכת</button>
        </div>
        <div style={{padding:"12px 20px",background:C.bg,fontSize:12,color:C.muted,textAlign:"center"}}>
          📞 052-681-7102 · ימים א׳-ה׳ 9:00-17:00
        </div>
      </div>
    </>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onOpenAuth }) {
  const [scrolled,setScrolled]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",fn);
    return()=>window.removeEventListener("scroll",fn);
  },[]);

  useEffect(()=>{
    const obs=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.opacity=1;x.target.style.transform="none";obs.unobserve(x.target);}});},{threshold:.1});
    setTimeout(()=>document.querySelectorAll(".fu").forEach(el=>obs.observe(el)),100);
    return()=>obs.disconnect();
  },[]);

  const eventTypes = [
    { emoji:"💍", title:"חתונות", desc:"מהתארסתם? מזל טוב! ניהול החתונה בקלות.", img:"https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
    { emoji:"✡️", title:"בר/ת מצווה", desc:"גיל המצוות הגיע. תכנון נכון ביחד עם ההורים.", img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80" },
    { emoji:"👶", title:"בריתות", desc:"הבייבי נולד? ארגון אירוע אפילו בטווח קצר.", img:"https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80" },
    { emoji:"💼", title:"אירועים עסקיים", desc:"מערכת מתקדמת לניהול אירוע עסקי מכל גודל.", img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80" },
  ];

  return(
    <div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,right:0,left:0,zIndex:100,background:scrolled?"rgba(255,255,255,.96)":"rgba(255,255,255,.92)",backdropFilter:"blur(16px)",borderBottom:scrolled?`1px solid ${C.border}`:"1px solid transparent",height:66,display:"flex",alignItems:"center",padding:"0 5vw",gap:16,transition:"all .3s",boxShadow:scrolled?"0 2px 20px rgba(26,63,163,.08)":"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${C.blue},${C.blueL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",fontWeight:900}}>◈</div>
          <span style={{fontWeight:900,fontSize:20,color:C.blue,letterSpacing:"-.02em"}}>Sidor-IL</span>
        </div>
        <div style={{display:"flex",gap:24,marginRight:"auto",alignItems:"center"}}>
          {[["#features","פיצ'רים"],["#how","איך עובד"],["#pricing","מחירים"],["#contact","צור קשר"]].map(([h,l])=>(
            <a key={h} href={h} style={{color:C.muted,textDecoration:"none",fontSize:14,fontWeight:600,display:"none"}} className="nav-link">{l}</a>
          ))}
        </div>
        <button onClick={()=>onOpenAuth("login")} style={{background:"transparent",color:C.blue,border:`2px solid ${C.border}`,borderRadius:12,padding:"8px 18px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>כניסה</button>
        <button onClick={()=>onOpenAuth("register")} style={{background:`linear-gradient(135deg,${C.blue},${C.blueL})`,color:"#fff",border:"none",borderRadius:12,padding:"9px 20px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.blueL}44`}}>הרשמה בחינם ←</button>
        <button onClick={()=>setMenuOpen(true)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:10,width:40,height:40,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,flexShrink:0}}>
          <span style={{width:18,height:2,background:C.blue,borderRadius:1,display:"block"}}/>
          <span style={{width:18,height:2,background:C.blue,borderRadius:1,display:"block"}}/>
          <span style={{width:18,height:2,background:C.blue,borderRadius:1,display:"block"}}/>
        </button>
      </nav>

      {menuOpen&&<HamburgerMenu onOpenAuth={onOpenAuth} onClose={()=>setMenuOpen(false)}/>}

      {/* HERO */}
      <section style={{minHeight:"100vh",display:"flex",alignItems:"center",padding:"100px 6vw 60px",background:C.surface,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,right:0,left:0,height:4,background:`linear-gradient(90deg,${C.blue},${C.blueL},${C.blue})`}}/>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 60% 70% at 100% 50%,rgba(74,122,255,.07),transparent),radial-gradient(ellipse 40% 40% at 0% 85%,rgba(26,63,163,.04),transparent)`}}/>
        {[{w:320,h:320,t:70,l:50},{w:230,h:230,t:110,l:90},{w:190,h:190,b:50,r:"7%"}].map((c,i)=>(
          <div key={i} style={{position:"absolute",width:c.w,height:c.h,borderRadius:"50%",border:`1.5px solid rgba(74,122,255,.1)`,top:c.t,left:c.l,bottom:c.b,right:c.r,animation:`float 8s ${i}s ease-in-out infinite`}}/>
        ))}
        <div style={{position:"relative",zIndex:1,maxWidth:580,animation:"fadeUp .7s ease both"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:C.blueXL,border:`1px solid rgba(74,122,255,.3)`,borderRadius:100,padding:"7px 16px",fontSize:13,fontWeight:700,color:C.blue,marginBottom:26}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:C.blueL,display:"inline-block",animation:"blink 2s infinite"}}/>
            211,283 אירועים הצטרפו! 🎉
          </div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(40px,5.5vw,72px)",fontWeight:800,lineHeight:1.08,color:C.text,letterSpacing:"-.03em",marginBottom:20}}>
            ניהול אירוע מושלם,<br/>
            <span style={{background:`linear-gradient(135deg,${C.blue},${C.blueL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>בלי כאבי ראש</span>
          </h1>
          <p style={{fontSize:17,color:C.muted,lineHeight:1.75,marginBottom:34}}>ממשק מתקדם לתכנון וניהול אירוע מושלם — סידורי הושבה, אישורי הגעה, ניהול מוזמנים ופתק הושבה.</p>
          <div style={{display:"flex",gap:13,flexWrap:"wrap",marginBottom:50}}>
            <button onClick={()=>onOpenAuth("register")} style={{background:`linear-gradient(135deg,${C.blue},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"16px 34px",fontSize:17,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 8px 28px rgba(74,122,255,.45)`,display:"flex",alignItems:"center",gap:8}}>🚀 הרשמה בחינם</button>
            <button onClick={()=>onOpenAuth("login")} style={{background:"transparent",color:C.blue,border:`2px solid ${C.border}`,borderRadius:14,padding:"15px 26px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>צפו בהדגמה</button>
          </div>
          <div style={{display:"flex",gap:32,flexWrap:"wrap",paddingTop:32,borderTop:`1px solid ${C.border}`}}>
            {[["211K+","אירועים"],["2M+","אורחים"],["4.9★","דירוג"],["2 דק'","הגדרה"]].map(([n,l])=>(
              <div key={l}><div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.blue,lineHeight:1}}>{n}</div><div style={{fontSize:12,color:C.muted,marginTop:3,fontWeight:600}}>{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <div style={{background:C.blueXL,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"16px 6vw"}}>
        <div style={{maxWidth:1080,margin:"0 auto",display:"flex",alignItems:"center",gap:32,flexWrap:"wrap",justifyContent:"center"}}>
          {["✅ ללא כרטיס אשראי","🔒 מאובטח SSL","📱 עובד בכל מכשיר","🇮🇱 מערכת ישראלית","🤖 AI חכם"].map(t=>(
            <span key={t} style={{fontSize:14,fontWeight:600,color:C.blue}}>{t}</span>
          ))}
        </div>
      </div>

      {/* EVENT TYPES */}
      <section style={{padding:"88px 6vw",background:C.surface}} id="events">
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",marginBottom:52,textAlign:"center"}}>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.3vw,44px)",fontWeight:800,color:C.text,marginBottom:12}}>אז מה אתם חוגגים?</h2>
            <p style={{fontSize:16,color:C.muted}}>ב-Sidor-IL ניהול ההושבה מותאם בדיוק לסוג האירוע שלכם.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:22}}>
            {eventTypes.map((ev,i)=>(
              <div key={ev.title} className="fu" style={{opacity:0,transform:"translateY(22px)",transition:`opacity .6s ${i*.08}s,transform .6s ${i*.08}s`,borderRadius:20,overflow:"hidden",cursor:"pointer",boxShadow:"0 4px 20px rgba(27,58,140,.08)",border:`1px solid ${C.border}`}}
                onMouseEnter={e=>{e.currentTarget.querySelector("img").style.transform="scale(1.05)";}} onMouseLeave={e=>{e.currentTarget.querySelector("img").style.transform="scale(1)";}}>
                <div style={{overflow:"hidden",height:180}}>
                  <img src={ev.img} alt={ev.title} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .4s ease"}}/>
                </div>
                <div style={{padding:"18px 18px 20px",background:C.surface}}>
                  <h3 style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:6}}>{ev.emoji} {ev.title}</h3>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:12}}>{ev.desc}</p>
                  <span style={{fontSize:13,color:C.blueL,fontWeight:700,cursor:"pointer"}}>למידע נוסף ←</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{padding:"88px 6vw",background:C.bg}} id="features">
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",marginBottom:52}}>
            <div style={{display:"inline-block",fontSize:12,fontWeight:700,color:C.blueL,background:C.blueXL,border:`1px solid rgba(74,122,255,.25)`,borderRadius:100,padding:"5px 16px",marginBottom:12}}>פיצ'רים</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.3vw,44px)",fontWeight:800,color:C.text,marginBottom:12}}>פיצ'רים, אבל באמת שווים</h2>
            <p style={{fontSize:16,color:C.muted,maxWidth:500}}>וזה רק חלק קטן מאוסף היכולות שניתן להגדיר עבור האירוע שלכם.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
            {[["🪑","סידורי הושבה","כלי דיגיטלי ומהיר לסידורי שולחנות וניהול האורחים כולל עדכוני הגעה בזמן אמת."],["✅","אישורי הגעה","קליק אחד והאורחים מאשרים הגעה בכל מקום ובכל זמן. SMS ווואטסאפ."],["🖨️","פתק הושבה","חפש שם אורח — קבל פתק מיידי עם מספר שולחן. כמו קיוסק מקצועי."],["📊","ייבוא מאנשי קשר","באמצעות האפליקציה ניתן להעלות אורחים ישירות מאנשי הקשר בנייד."],["🤖","AI חכם","תאר מי לא יושב עם מי — ה-AI יסדר הכל תוך שניות."],["📱","התראות בזמן אמת","קבל התראות כאשר אורח מאשר הגעה או מעדכן את מצב הגעתו."]].map(([icon,title,desc],i)=>(
              <div key={title} className="fu" style={{opacity:0,transform:"translateY(22px)",transition:`opacity .6s ${i*.07}s,transform .6s ${i*.07}s`,background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:26}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.borderColor=C.blueL;}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=C.border;}}>
                <div style={{width:52,height:52,borderRadius:15,background:`linear-gradient(135deg,${C.blue},${C.blueL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:23,marginBottom:16}}>{icon}</div>
                <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:7}}>{title}</div>
                <div style={{fontSize:14,color:C.muted,lineHeight:1.7}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section style={{padding:"88px 6vw",background:`linear-gradient(145deg,${C.blue},#122e9e,#1a4ac4)`,position:"relative",overflow:"hidden"}} id="how">
        <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"14px 14px"}}/>
        <div style={{maxWidth:1080,margin:"0 auto",position:"relative",zIndex:1}}>
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",marginBottom:52}}>
            <div style={{display:"inline-block",fontSize:12,fontWeight:700,color:"rgba(255,255,255,.9)",background:"rgba(255,255,255,.12)",borderRadius:100,padding:"5px 16px",marginBottom:12}}>איך עובד</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.3vw,44px)",fontWeight:800,color:"#fff",marginBottom:12}}>3 צעדים לאירוע מסודר</h2>
            <p style={{fontSize:16,color:"rgba(255,255,255,.65)"}}>פשוט, מהיר — ועובד.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:34}}>
            {[["01","הוסף אורחים","ייבא מ-Excel, מאנשי קשר, או הוסף ידנית. כל אורח עם שם, טלפון וכמות מגיעים."],["02","צור שולחנות","הגדר שולחנות עגולים, מרובעים, שולחן אבירים. סדר על מפת האולם."],["03","AI עושה השאר","תאר העדפות ו-AI יסדר הכל. הדפס פתקי הושבה לאורחים ביום האירוע."]].map(([n,t,d],i)=>(
              <div key={n} className="fu" style={{opacity:0,transform:"translateY(22px)",transition:`opacity .6s ${i*.12}s,transform .6s ${i*.12}s`}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:54,fontWeight:800,color:"rgba(255,255,255,.12)",lineHeight:1,marginBottom:10}}>{n}</div>
                <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:7}}>{t}</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.6)",lineHeight:1.7}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section style={{padding:"88px 6vw",background:C.bg}} id="audience">
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",marginBottom:52,textAlign:"center"}}>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.3vw,44px)",fontWeight:800,color:C.text,marginBottom:12}}>לנהל אירוע בראש שקט</h2>
            <p style={{fontSize:16,color:C.muted,maxWidth:600,margin:"0 auto"}}>תהליך שלם שמאפשר לכם בקליק אחד להזמין אורחים, לקבל אישורי הגעה ולחסוך המון התעסקות מיותרת.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22}}>
            <Card className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",padding:"42px 34px"}}>
              <div style={{display:"inline-block",fontSize:11,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",padding:"5px 14px",borderRadius:100,background:C.blueXL,color:C.blue,marginBottom:18}}>לזוגות</div>
              <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(20px,2.3vw,30px)",fontWeight:800,color:C.text,marginBottom:12}}>מתחתנים? מזל טוב! 💍</h3>
              <p style={{fontSize:15,color:C.muted,lineHeight:1.7,marginBottom:22}}>Sidor-IL מלווה אתכם מרגע שיש לכם רשימת אורחים ועד שהאורח האחרון יושב.</p>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:9,marginBottom:28}}>
                {["סידורי הושבה אינטואיטיביים","אישורי הגעה אוטומטיים","ניהול תקציב וספקים","שיתוף עם בן/בת הזוג","פתק הושבה ביום האירוע"].map(f=>(
                  <li key={f} style={{display:"flex",alignItems:"center",gap:9,fontSize:14,color:C.text}}><span style={{width:21,height:21,borderRadius:"50%",background:C.blueXL,color:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>✓</span>{f}</li>
                ))}
              </ul>
              <button onClick={()=>onOpenAuth("register")} style={{background:`linear-gradient(135deg,${C.blue},${C.blueL})`,color:"#fff",border:"none",borderRadius:13,padding:"12px 26px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>התחל בחינם ←</button>
            </Card>
            <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s .1s,transform .6s .1s",background:`linear-gradient(145deg,${C.blue},${C.blueM})`,borderRadius:24,padding:"42px 34px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,opacity:.07,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"14px 14px"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{display:"inline-block",fontSize:11,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",padding:"5px 14px",borderRadius:100,background:"rgba(255,255,255,.15)",color:"rgba(255,255,255,.9)",marginBottom:18}}>לאולמות ומפיקים</div>
                <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(20px,2.3vw,30px)",fontWeight:800,color:"#fff",marginBottom:12}}>מנהל אירועים מרובים? 🎪</h3>
                <p style={{fontSize:15,color:"rgba(255,255,255,.65)",lineHeight:1.7,marginBottom:22}}>לוח בקרה מקצועי לניהול לקוחות ואירועים במקביל — חסכון עצום בזמן.</p>
                <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:9,marginBottom:28}}>
                  {["אירועים ללא הגבלה","לוח בקרה מרכזי","White label — הלוגו שלך","API לאינטגרציה עם מערכות","תמיכה ייעודית 24/7"].map(f=>(
                    <li key={f} style={{display:"flex",alignItems:"center",gap:9,fontSize:14,color:"rgba(255,255,255,.88)"}}><span style={{width:21,height:21,borderRadius:"50%",background:"rgba(255,255,255,.2)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>✓</span>{f}</li>
                  ))}
                </ul>
                <button onClick={()=>onOpenAuth("register")} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"2px solid rgba(255,255,255,.3)",borderRadius:13,padding:"12px 26px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>לפרטים על Pro ←</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{padding:"88px 6vw",background:C.surface,textAlign:"center"}} id="pricing">
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",marginBottom:52}}>
            <div style={{display:"inline-block",fontSize:12,fontWeight:700,color:C.blueL,background:C.blueXL,border:`1px solid rgba(74,122,255,.25)`,borderRadius:100,padding:"5px 16px",marginBottom:12}}>מחירים</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.3vw,44px)",fontWeight:800,color:C.text,marginBottom:12}}>לכל החבילות והמחירים</h2>
            <p style={{fontSize:16,color:C.muted}}>שקוף ופשוט — ללא הפתעות.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(265px,1fr))",gap:20,maxWidth:900,margin:"0 auto"}}>
            {[
              {name:"חינמי",price:"₪0",period:"לתמיד",features:["עד 100 אורחים","עד 10 שולחנות","מפה אינטראקטיבית","AI בסיסי","פתק הושבה"],featured:false},
              {name:"זוג",price:"₪149",period:"לאירוע חד פעמי",features:["אורחים ללא הגבלה","AI מלא וחכם","אישורי הגעה SMS","ניהול תקציב","ייצוא PDF + Excel"],featured:true,badge:"⭐ הכי פופולרי"},
              {name:"מפיק Pro",price:"₪299",period:"לחודש",features:["אירועים ללא הגבלה","לוח בקרה מרכזי","White label","API + אינטגרציות","תמיכה ייעודית"],featured:false},
            ].map((p,i)=>(
              <div key={p.name} className="fu" style={{opacity:0,transform:"translateY(22px)",transition:`opacity .6s ${i*.1}s,transform .6s ${i*.1}s`,border:`1.5px solid ${p.featured?"transparent":C.border}`,borderRadius:22,padding:"34px 26px",textAlign:"right",background:p.featured?`linear-gradient(145deg,${C.blue},${C.blueM})`:C.bg,position:"relative"}}>
                {p.badge&&<div style={{position:"absolute",top:-12,right:26,background:`linear-gradient(135deg,${C.gold},#ffb830)`,color:C.text,fontSize:11,fontWeight:800,padding:"4px 14px",borderRadius:100}}>{p.badge}</div>}
                <div style={{fontSize:12,fontWeight:700,color:p.featured?"rgba(255,255,255,.6)":C.muted,marginBottom:7,textTransform:"uppercase",letterSpacing:".06em"}}>{p.name}</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:46,fontWeight:800,color:p.featured?"#fff":C.blue,lineHeight:1,marginBottom:3}}>{p.price}</div>
                <div style={{fontSize:13,color:p.featured?"rgba(255,255,255,.6)":C.muted,marginBottom:24}}>{p.period}</div>
                <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
                  {p.features.map(f=>(<li key={f} style={{fontSize:14,display:"flex",alignItems:"center",gap:8,color:p.featured?"rgba(255,255,255,.88)":C.text}}><span style={{color:p.featured?"#6EE7A7":C.success,fontWeight:800}}>✓</span>{f}</li>))}
                </ul>
                <button onClick={()=>onOpenAuth("register")} style={{width:"100%",padding:12,borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:p.featured?"rgba(255,255,255,.15)":"transparent",border:p.featured?"2px solid rgba(255,255,255,.3)":`2px solid ${C.blue}`,color:p.featured?"#fff":C.blue}}>
                  {p.featured?"בחר תוכנית":"התחל"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:"88px 6vw",background:C.bg}}>
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",marginBottom:52,textAlign:"center"}}>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.3vw,44px)",fontWeight:800,color:C.text,marginBottom:12}}>חגגו ונשארו לספר</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(275px,1fr))",gap:18}}>
            {[{t:"הייתי בטוח שסידורי הושבה זה קשמר. עם Sidor-IL סיימתי 280 אורחים תוך חצי שעה. ה-AI פשוט עשה הכל.",n:"דן לוי",e:"חתונה · פברואר 2025"},{t:"כמפיק — זה שינה לי את החיים. ניהול 12 אירועים בחודש ממסך אחד. הלקוחות מתרשמים.",n:"מיכל גרוס",e:"מפיקת אירועים"},{t:"אישורי ההגעה בוואטסאפ חסכו לנו שעות. ידענו בדיוק כמה מגיעים שבוע לפני. אין על זה.",n:"נעמה ויצמן",e:"בת מצווה · ינואר 2025"}].map((t,i)=>(
              <Card key={i} className="fu" style={{opacity:0,transform:"translateY(22px)",transition:`opacity .6s ${i*.1}s,transform .6s ${i*.1}s`,padding:24}}>
                <div style={{color:C.gold,fontSize:15,marginBottom:11}}>★★★★★</div>
                <p style={{fontSize:15,color:C.text,lineHeight:1.7,marginBottom:16}}>"{t.t}"</p>
                <div style={{display:"flex",alignItems:"center",gap:11}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${C.blue},${C.blueL})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15,flexShrink:0}}>{t.n[0]}</div>
                  <div><div style={{fontSize:14,fontWeight:700,color:C.text}}>{t.n}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{t.e}</div></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"96px 6vw",background:`linear-gradient(145deg,${C.blue},#122e8c,${C.blueM})`,textAlign:"center",position:"relative",overflow:"hidden"}} id="contact">
        <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"14px 14px"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,50px)",fontWeight:800,color:"#fff",marginBottom:14}}>מוכן להתחיל?</h2>
          <p style={{fontSize:17,color:"rgba(255,255,255,.7)",marginBottom:38}}>הצטרף ל-211,283 אירועים שכבר עשו את זה נכון.</p>
          <div style={{display:"flex",gap:13,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>onOpenAuth("register")} style={{background:"#fff",color:C.blue,border:"none",borderRadius:14,padding:"15px 36px",fontSize:17,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 28px rgba(0,0,0,.15)"}}>🚀 הרשמה בחינם</button>
            <a href="https://wa.me/972526817102" target="_blank" rel="noopener" style={{background:"#25D366",color:"#fff",border:"none",borderRadius:14,padding:"15px 28px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"none",display:"flex",alignItems:"center",gap:8}}>💬 WhatsApp</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#070D28",color:"rgba(255,255,255,.45)",padding:"54px 6vw 30px"}}>
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:38,marginBottom:44}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
                <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${C.blue},${C.blueL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",fontWeight:900}}>◈</div>
                <span style={{fontWeight:900,fontSize:17,color:"#fff"}}>Sidor-IL</span>
              </div>
              <p style={{fontSize:13,color:"rgba(255,255,255,.38)",lineHeight:1.8,maxWidth:270,marginBottom:16}}>פלטפורמה ישראלית לניהול סידורי הושבה חכמים. בנויה עבור זוגות ומפיקי אירועים.</p>
              <div style={{fontSize:13,color:"rgba(255,255,255,.5)",lineHeight:2}}>
                <div>📍 הבנאים 12, אשדוד</div>
                <div>📞 052-681-7102</div>
                <div>⏰ א׳-ה׳: 9:00-17:00 | שישי: 9:00-12:00</div>
              </div>
            </div>
            {[["מפת האתר",["אישורי הגעה","סידורי הושבה","חבילות ומחירים","אולמות / מפיקים","שאלות ותשובות","צור קשר"]],["חברה",["אודות","בלוג","קריירה","תנאי שימוש","פרטיות","נגישות"]],["עזרה",["מדריכים","תמיכה","API","שותפים","הורד אפליקציה"]]].map(([title,links])=>(
              <div key={title}><div style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,.75)",marginBottom:13}}>{title}</div><ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:9}}>{links.map(l=>(<li key={l}><a href="#" style={{color:"rgba(255,255,255,.38)",textDecoration:"none",fontSize:13,transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.38)"}>{l}</a></li>))}</ul></div>
            ))}
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:22,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,fontSize:12,alignItems:"center"}}>
            <span>© 2025 Sidor-IL · כל הזכויות שמורות</span>
            <div style={{display:"flex",gap:14}}>
              {["📘 פייסבוק","📸 אינסטגרם","🎵 טיקטוק"].map(s=>(<span key={s} style={{cursor:"pointer",transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.45)"}>{s}</span>))}
            </div>
            <span>🇮🇱 מערכת ישראלית · נבנתה עם ❤️</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/972526817102" target="_blank" rel="noopener" style={{position:"fixed",bottom:24,left:24,width:56,height:56,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 4px 20px rgba(37,211,102,.4)",zIndex:99,textDecoration:"none",animation:"float 3s ease-in-out infinite"}}>💬</a>
    </div>
  );
}

// ─── AUTH DRAWER ──────────────────────────────────────────────────────────────
function AuthDrawer({ mode:initMode, onClose, onAuth }) {
  const [mode,setMode]=useState(initMode),[email,setEmail]=useState(""),[pass,setPass]=useState(""),[err,setErr]=useState(""),[load,setLoad]=useState(false);
  const submit=async()=>{setErr("");setLoad(true);try{if(mode==="login"){const{data,error}=await sb.auth.signInWithPassword({email,password:pass});if(error)throw error;onAuth(data.user);}else{const{data,error}=await sb.auth.signUp({email,password:pass});if(error)throw error;if(data.user&&!data.user.email_confirmed_at)setErr("✅ נשלח מייל אימות!");else onAuth(data.user);}}catch(e){setErr(e.message==="Invalid login credentials"?"❌ אימייל או סיסמה שגויים":e.message);}setLoad(false);};
  return(<><div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)"}}/><div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:201,background:C.surface,borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",maxWidth:480,margin:"0 auto",animation:"slideUp .3s ease both",direction:"rtl"}}><div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 24px"}}/><div style={{textAlign:"center",marginBottom:24}}><div style={{width:52,height:52,borderRadius:15,background:`linear-gradient(135deg,${C.blue},${C.blueL})`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:10}}>◈</div><div style={{fontWeight:900,fontSize:20,color:C.blue}}>Sidor-IL</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>סידורי הושבה חכמים</div></div><div style={{display:"flex",background:C.blueXL,borderRadius:14,padding:4,marginBottom:20}}>{[["login","כניסה"],["register","הרשמה"]].map(([v,l])=>(<button key={v} onClick={()=>{setMode(v);setErr("");}} style={{flex:1,padding:"10px 0",borderRadius:11,background:mode===v?C.surface:"transparent",border:"none",fontWeight:700,fontSize:14,color:mode===v?C.blue:C.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>{l}</button>))}</div><div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="אימייל" style={{background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="סיסמה (מינימום 6 תווים)" onKeyDown={e=>e.key==="Enter"&&submit()} style={{background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",fontSize:15,color:C.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/></div>{err&&<div style={{background:err.startsWith("✅")?"#F0FFF6":"#FEF2F2",border:`1px solid ${err.startsWith("✅")?C.success:C.danger}30`,borderRadius:12,padding:"10px 14px",fontSize:13,color:err.startsWith("✅")?C.success:C.danger,marginBottom:12}}>{err}</div>}<Btn primary full onClick={submit} disabled={load||!email||!pass} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:16}}>{load?<><Spinner size={18} color="#fff"/>מעבד...</>:mode==="login"?"כניסה ←":"צור חשבון ←"}</Btn><p style={{fontSize:13,color:C.muted,textAlign:"center",marginTop:16}}>{mode==="login"?"אין חשבון? ":"יש חשבון? "}<span onClick={()=>setMode(mode==="login"?"register":"login")} style={{color:C.blue,fontWeight:700,cursor:"pointer"}}>{mode==="login"?"הירשם":"כנס"}</span></p></div></>);
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
  const loadEvents=async()=>{setLoading(true);const{data}=await sb.from("events").select("*").order("date",{ascending:true});setEvents(data||[]);setLoading(false);};
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
            <input value={form.groom_name} onChange={e=>setForm(f=>({...f,groom_name:e.target.value}))} placeholder="יוסי" style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 12px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שם הכלה</div>
            <input value={form.bride_name} onChange={e=>setForm(f=>({...f,bride_name:e.target.value}))} placeholder="רחל" style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 12px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>תאריך</div>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 12px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שעה</div>
            <input type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))} style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 12px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>

        <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>שם האולם/מקום</div>
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
function BottomNav({ active, onChange }) {
  return(<div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:80,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",height:64,boxShadow:"0 -4px 20px rgba(27,58,140,0.08)"}}>{[{id:"home",icon:"🏠",label:"ראשי"},{id:"seating",icon:"🪑",label:"הושבה"},{id:"rsvp",icon:"✅",label:"הגעה"},{id:"add",icon:"➕",label:"הוסף"},{id:"settings",icon:"⚙️",label:"הגדרות"}].map(item=>(<button key={item.id} onClick={()=>onChange(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit",padding:"6px 0",position:"relative"}}><span style={{fontSize:20,lineHeight:1,filter:active===item.id?"none":"grayscale(1)",opacity:active===item.id?1:.5}}>{item.icon}</span><span style={{fontSize:10,fontWeight:700,color:active===item.id?C.blue:C.muted}}>{item.label}</span>{active===item.id&&<div style={{position:"absolute",bottom:0,width:32,height:3,borderRadius:"3px 3px 0 0",background:`linear-gradient(90deg,${C.blueM},${C.blueL})`}}/>}</button>))}</div>);
}

// ─── EDIT TABLE MODAL ─────────────────────────────────────────────────────────
function EditTableModal({ table, onSave, onDelete, onClose }) {
  const [name,setName]=useState(table.name);
  const [type,setType]=useState(table.type);
  const [seats,setSeats]=useState(table.seats);
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
        <div style={{fontWeight:800,fontSize:18,color:C.text,marginBottom:4}}>✏️ עריכת שולחן</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:18}}>שנה שם, סוג או מספר מקומות</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {Object.entries(TABLE_TYPES).map(([k,v])=>(
            <button key={k} onClick={()=>{setType(k);setSeats(v.defaultSeats);}} style={{background:type===k?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#E8EEFF",border:`2px solid ${type===k?"transparent":C.border}`,borderRadius:14,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .15s"}}>
              <span style={{fontSize:22}}>{v.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color:type===k?"#fff":C.text}}>{v.label}</span>
            </button>
          ))}
        </div>

        <input value={name} onChange={e=>setName(e.target.value)} placeholder="שם השולחן..."
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:12}}/>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,background:C.blueXL,borderRadius:12,padding:"10px 14px"}}>
          <span style={{fontSize:14,fontWeight:600,color:C.text,flex:1}}>מספר מקומות</span>
          <button onClick={()=>setSeats(s=>Math.max(1,s-1))} style={{width:32,height:32,borderRadius:8,background:C.surface,border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
          <span style={{fontSize:18,fontWeight:800,color:C.blue,minWidth:32,textAlign:"center"}}>{seats}</span>
          <button onClick={()=>setSeats(s=>s+1)} style={{width:32,height:32,borderRadius:8,background:C.surface,border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onDelete(table.id)} style={{background:"#FEF2F2",color:C.danger,border:`1px solid ${C.danger}30`,borderRadius:12,padding:"12px 18px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑️ מחק</button>
          <button onClick={()=>name.trim()&&onSave(table.id,name,type,seats)} disabled={!name.trim()} style={{flex:1,background:name.trim()?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#E8EEFF",color:name.trim()?"#fff":C.muted,border:"none",borderRadius:12,padding:"12px",fontSize:15,fontWeight:700,cursor:name.trim()?"pointer":"default",fontFamily:"inherit"}}>
            שמור שינויים ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MOBILE SEATING ───────────────────────────────────────────────────────────
function MobileSeating({ tables, guests, search, setSearch, newGuest, setNewGuest, addGuest, dropOnTable, removeFromTable, onAddTable, onEditTable, onDeleteTable, onEditGuest }) {
  const [tab,setTab]=useState("guests"),[picked,setPicked]=useState(null),[expanded,setExpanded]=useState(null),[editTable,setEditTable]=useState(null);
  const assign=async tableId=>{if(!picked)return;await dropOnTable(tableId,picked.id,picked.table_id||null);setPicked(null);setTab("guests");};
  return(<div style={{display:"flex",flexDirection:"column",flex:1,background:C.bg}}>
    {picked&&<div style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,fontSize:14,flexShrink:0}}>
      <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{picked.name[0]}</div>
      <span style={{flex:1,fontWeight:700}}>{picked.name} — בחר שולחן</span>
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
            <Card key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:8,border:`1.5px solid ${picked?.id===g.id?C.blueL:C.border}`,background:picked?.id===g.id?C.blueXL:C.surface}}>
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

        {tables.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:48}}>🪑</div><p style={{color:C.muted,fontSize:14,marginTop:8}}>אין עדיין שולחנות</p></div>}

        {tables.map((t)=>{
          const sc=sColor(t),exp=expanded===t.id,isFull=(t.guests||[]).length>=t.seats;
          return(
            <Card key={t.id} style={{marginBottom:12,overflow:"hidden",border:`1.5px solid ${picked&&!isFull?C.blueL:C.border}`,opacity:picked&&isFull?.4:1}}>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div onClick={()=>picked?(!isFull&&assign(t.id)):setExpanded(exp?null:t.id)} style={{display:"flex",alignItems:"center",gap:12,flex:1,cursor:picked&&isFull?"not-allowed":"pointer",background:picked&&!isFull?C.blueXL:"none",margin:"-14px -16px",padding:"14px 16px"}}>
                  <div style={{width:46,height:46,borderRadius:13,background:sc+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{TABLE_TYPES[t.type]?.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:15,color:C.text}}>{t.name}</div>
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
function SeatingApp({ user, event, onBack }) {
  const [tables,setTables]=useState([]),[guests,setGuests]=useState([]),[selected,setSelected]=useState(null),[view,setView]=useState("map"),[screen,setScreen]=useState("home"),[modal,setModal]=useState(null),[editGuestData,setEditGuestData]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[search,setSearch]=useState(""),[newGuest,setNewGuest]=useState(""),[mobile,setMobile]=useState(isMobile());
  useEffect(()=>{loadAll();const fn=()=>setMobile(isMobile());window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[event.id]);
  const loadAll=async()=>{setLoading(true);const [{data:tData},{data:gData}]=await Promise.all([sb.from("tables").select("*").eq("event_id",event.id).order("created_at"),sb.from("guests").select("*").eq("event_id",event.id).order("created_at")]);setTables((tData||[]).map(t=>({...t,guests:(gData||[]).filter(g=>g.table_id===t.id)})));setGuests((gData||[]).filter(g=>!g.table_id));setLoading(false);};
  const moveTablePos=useCallback((id,x,y)=>setTables(ts=>ts.map(t=>t.id===id?{...t,x:Math.max(0,x),y:Math.max(0,y)}:t)),[]);
  const saveTablePos=async(id,x,y)=>await sb.from("tables").update({x,y}).eq("id",id);
  const dropOnTable=async(toId,guestId,fromId)=>{const allG=[...guests,...tables.flatMap(t=>t.guests||[])];const guest=allG.find(g=>String(g.id)===String(guestId));const toTable=tables.find(t=>t.id===toId);if(!guest||!toTable||(toTable.guests||[]).length>=toTable.seats)return;setSaving(true);await sb.from("guests").update({table_id:toId}).eq("id",guestId);setTables(ts=>ts.map(t=>{if(t.id===fromId)return{...t,guests:(t.guests||[]).filter(g=>String(g.id)!==String(guestId))};if(t.id===toId)return{...t,guests:[...(t.guests||[]),{...guest,table_id:toId}]};return t;}));setGuests(gs=>gs.filter(g=>String(g.id)!==String(guestId)));setSaving(false);};
  const removeFromTable=async(tid,guest)=>{setSaving(true);await sb.from("guests").update({table_id:null}).eq("id",guest.id);setTables(ts=>ts.map(t=>t.id===tid?{...t,guests:(t.guests||[]).filter(g=>g.id!==guest.id)}:t));setGuests(gs=>[...gs,{...guest,table_id:null}]);setSaving(false);};
  const editTable=async(id,name,type,seats)=>{setSaving(true);await sb.from("tables").update({name,type,seats}).eq("id",id);setTables(ts=>ts.map(t=>t.id===id?{...t,name,type,seats}:t));setSaving(false);};
  const deleteTable=async(id)=>{setSaving(true);await sb.from("guests").update({table_id:null}).eq("table_id",id);await sb.from("tables").delete().eq("id",id);const freed=tables.find(t=>t.id===id)?.guests||[];setTables(ts=>ts.filter(t=>t.id!==id));setGuests(gs=>[...gs,...freed.map(g=>({...g,table_id:null}))]);setSaving(false);};
  const addGuest=async(data)=>{
    const name=(data?.name||newGuest).trim();if(!name)return;
    setSaving(true);
    const{data:d}=await sb.from("guests").insert({name,phone:data?.phone||null,rsvp:data?.rsvp||"pending",guest_count:data?.guest_count||1,event_id:event.id,table_id:null}).select().single();
    if(d)setGuests(gs=>[...gs,d]);
    setNewGuest("");setSaving(false);
  };
  const editGuest=async(id,data)=>{
    setSaving(true);
    await sb.from("guests").update({name:data.name,phone:data.phone||null,rsvp:data.rsvp,guest_count:data.guest_count}).eq("id",id);
    setGuests(gs=>gs.map(g=>g.id===id?{...g,...data}:g));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(g=>g.id===id?{...g,...data}:g)})));
    setSaving(false);
  };
  const addTable=async()=>{setModal("addTable");};
  const doAddTable=async(name,type)=>{if(!name?.trim())return;setSaving(true);const seats=TABLE_TYPES[type].defaultSeats;const{data}=await sb.from("tables").insert({name:name.trim(),type,seats,x:100+tables.length*30,y:100+tables.length*20,event_id:event.id}).select().single();if(data)setTables(ts=>[...ts,{...data,guests:[]}]);setSaving(false);setModal(null);};
  const selTable=tables.find(t=>t.id===selected);
  const seated=tables.reduce((s,t)=>s+(t.guests||[]).length,0);
  const total=seated+guests.length;

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,flexDirection:"column",gap:14}}><Spinner size={40}/><p style={{color:C.muted,fontSize:15,fontFamily:"'Heebo',sans-serif"}}>טוען...</p></div>);

  if(mobile){
    const HomeScreen=()=>(<div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",background:C.bg,paddingBottom:80}}>
      <div style={{background:`linear-gradient(145deg,${C.blue},${C.blueM},${C.blueL})`,padding:"28px 20px 36px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:.07,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"12px 12px"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div><div style={{fontSize:13,color:"rgba(255,255,255,.7)",fontWeight:600}}>האירוע שלך</div><div style={{fontSize:22,fontWeight:900,color:"#fff"}}>{event.name}</div></div>
            <div style={{width:48,height:48,borderRadius:14,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>💍</div>
          </div>
          {event.date&&<div style={{marginBottom:16}}><div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginBottom:8,textAlign:"center"}}>⏳ נותרו</div><Countdown date={event.date}/></div>}
          <div style={{display:"flex",gap:8}}>
            {[["מוזמנים",total,C.blueXL,C.blue],["מגיעים",seated,"rgba(45,155,90,.2)","#4AE89A"],["ממתינים",guests.length,"rgba(240,165,0,.2)","#FFD060"]].map(([l,v,bg,col])=>(<div key={l} style={{flex:1,background:bg,borderRadius:12,padding:"10px 6px",textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:col,lineHeight:1}}>{v}</div><div style={{fontSize:11,color:"rgba(255,255,255,.8)",marginTop:2,fontWeight:600}}>{l}</div></div>))}
          </div>
        </div>
      </div>
      <div style={{background:C.surface,padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:C.muted,fontWeight:600}}>אורחים מוסבים</span><span style={{fontSize:13,fontWeight:800,color:C.blue}}>{seated}/{total}</span></div>
        <div style={{height:8,background:C.blueXL,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${total>0?(seated/total)*100:0}%`,background:`linear-gradient(90deg,${C.blueM},${C.blueL})`,borderRadius:4,transition:"width .5s"}}/></div>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:C.muted,marginBottom:14}}>ניהול האירוע</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {icon:"🪑",label:"סידורי הושבה",nav:"seating"},
            {icon:"✅",label:"אישורי הגעה",nav:"rsvp"},
            {icon:"💌",label:"הזמנה דיגיטלית",nav:"invite",highlight:true},
            {icon:"📊",label:"ייבוא אורחים",nav:"import"},
            {icon:"🖨️",label:"חיפוש אורח",nav:"receipt"},
            {icon:"➕",label:"הוסף אורח",nav:"add"},
            {icon:"🪑➕",label:"הוסף שולחן",nav:"addTable"},
            {icon:"⚙️",label:"הגדרות",nav:"settings"},
          ].map(item=>(
            <Card key={item.nav}
              onClick={()=>{if(item.nav==="receipt")setModal("receipt");else if(item.nav==="addTable")setModal("addTable");else setScreen(item.nav);}}
              style={{padding:"18px 16px",cursor:"pointer",display:"flex",flexDirection:"column",gap:8,border:`1.5px solid ${item.highlight?C.blueL:C.border}`,background:item.highlight?C.blueXL:C.surface}}>
              <div style={{width:44,height:44,borderRadius:13,background:item.highlight?`linear-gradient(135deg,${C.blueM},${C.blueL})`:C.blueXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{item.icon}</div>
              <div style={{fontWeight:700,fontSize:14,color:item.highlight?C.blue:C.text}}>{item.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>);

    return(<div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      {/* TOP BAR */}
      <div style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {screen==="home"
          ? <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>← הכל</button>
          : <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>← חזרה</button>
        }
        <span style={{flex:1,fontWeight:800,fontSize:15,color:"#fff",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
          {screen==="home"?event.name:screen==="seating"?"🪑 סידורי הושבה":screen==="add"?"➕ הוסף אורח":screen==="import"?"📊 ייבוא אורחים":screen==="rsvp"?"✅ אישורי הגעה":screen==="invite"?"💌 הזמנה דיגיטלית":screen==="settings"?"⚙️ הגדרות":event.name}
        </span>
        {saving&&<Spinner size={16} color="rgba(255,255,255,.8)"/>}
      </div>

      <div style={{flex:1,overflow:"auto"}}>
        {screen==="home"&&<HomeScreen/>}
        {screen==="seating"&&<MobileSeating tables={tables} guests={guests} search={search} setSearch={setSearch} newGuest={newGuest} setNewGuest={setNewGuest} addGuest={addGuest} dropOnTable={dropOnTable} removeFromTable={removeFromTable} onAddTable={()=>setModal("addTable")} onEditTable={editTable} onDeleteTable={deleteTable} onEditGuest={g=>setEditGuestData(g)}/>}
        {editGuestData&&<GuestModal guest={editGuestData} eventId={event.id} onClose={()=>setEditGuestData(null)} onSave={async(data)=>{await editGuest(editGuestData.id,data);setEditGuestData(null);}}/>}
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
            <button onClick={()=>{loadAll();setScreen("home");}} style={{width:"100%",background:"transparent",color:C.blue,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:10}}>
              סיום ✓
            </button>
          </div>
        )}
        {modal==="addGuest"&&<GuestModal eventId={event.id} onClose={()=>setModal(null)} onSave={async(data)=>{await addGuest(data);setModal(null);}}/>}
        {screen==="rsvp"&&(
          <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
              {[
                ["מגיעים",[...guests,...tables.flatMap(t=>t.guests||[])].filter(g=>g.rsvp==="confirmed").length,C.success],
                ["לא מגיעים",[...guests,...tables.flatMap(t=>t.guests||[])].filter(g=>g.rsvp==="declined").length,C.danger],
                ["ממתינים",[...guests,...tables.flatMap(t=>t.guests||[])].filter(g=>!g.rsvp||g.rsvp==="pending").length,C.gold],
              ].map(([l,v,c])=>(
                <Card key={l} style={{padding:"12px 8px",textAlign:"center",borderTop:`3px solid ${c}`}}>
                  <div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{l}</div>
                </Card>
              ))}
            </div>
            {[...guests,...tables.flatMap(t=>t.guests||[])].map(g=>(
              <Card key={g.id} style={{padding:"12px 14px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0}}>{g.name[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.text}}>{g.name}</div>
                    {g.phone&&<div style={{fontSize:11,color:C.muted}}>{g.phone}</div>}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  {[["confirmed","✓ מגיע","#F0FFF6",C.success],["pending","⏳ ממתין",C.blueXL,C.blue],["declined","✗ לא מגיע","#FEF2F2",C.danger]].map(([v,l,bg,col])=>(
                    <button key={v} onClick={async()=>{
                      await sb.from("guests").update({rsvp:v}).eq("id",g.id);
                      setGuests(gs=>[...gs.map(x=>x.id===g.id?{...x,rsvp:v}:x)]);
                      setTables(ts=>[...ts.map(t=>({...t,guests:[...(t.guests||[]).map(x=>x.id===g.id?{...x,rsvp:v}:x)]}))]);
                    }} style={{background:(g.rsvp||"pending")===v?col:bg,color:(g.rsvp||"pending")===v?"#fff":col,border:`2px solid ${(g.rsvp||"pending")===v?col:C.border}`,borderRadius:10,padding:"8px 4px",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,transition:"all .15s"}}>
                      {l}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
        {screen==="import"&&(
          <div style={{padding:20,direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
            <div style={{background:C.blueXL,border:`2px dashed ${C.blueL}`,borderRadius:16,padding:24,textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:36,marginBottom:8}}>📊</div>
              <div style={{fontSize:15,fontWeight:700,color:C.blue,marginBottom:4}}>ייבוא מ-Excel</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>קובץ .xlsx עם עמודות: שם, טלפון</div>
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
                    const guestsToImport=rows.map(r=>({
                      name:String(r["שם"]||r["name"]||r["Name"]||"").trim(),
                      phone:String(r["טלפון"]||r["phone"]||r["Phone"]||"").trim()||null,
                      rsvp:"pending",guest_count:1,event_id:event.id,table_id:null
                    })).filter(g=>g.name.length>1);
                    if(guestsToImport.length>0){await sb.from("guests").insert(guestsToImport);await loadAll();}
                    alert(`✅ יובאו ${guestsToImport.length} אורחים!`);
                  }catch(err){alert("שגיאה בקריאת הקובץ");}
                  setSaving(false);
                }}/>
              </label>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:8}}>או הדבק שמות ידנית</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>שם אחד בכל שורה (אפשר להוסיף טלפון אחרי פסיק)</div>
            <textarea placeholder={"ישראל ישראלי, 050-1234567\nרונית לוי\nמשפחת כהן, 052-9876543\n..."} id="importText"
              style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:14,fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",minHeight:160,boxSizing:"border-box",marginBottom:14,resize:"vertical"}}/>
            <button onClick={async()=>{
              const text=document.getElementById("importText").value;
              const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
              const toInsert=lines.map(l=>{const parts=l.split(",");return{name:parts[0].trim(),phone:parts[1]?.trim()||null,rsvp:"pending",guest_count:1,event_id:event.id,table_id:null};}).filter(g=>g.name.length>1);
              if(toInsert.length>0){setSaving(true);await sb.from("guests").insert(toInsert);await loadAll();setSaving(false);setScreen("home");}
            }} style={{width:"100%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
              ייבא וסיים ←
            </button>
          </div>
        )}
        {screen==="invite"&&<InviteSettings event={event} onUpdate={e=>setScreen("home")}/>}
        {screen==="settings"&&(
          <div style={{padding:24,direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
            <Card style={{padding:16,marginBottom:14}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:4}}>מחובר כ</div>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{user.email}</div>
            </Card>
            <Btn danger full onClick={async()=>{await sb.auth.signOut();window.location.reload();}}>🚪 התנתק</Btn>
          </div>
        )}
      </div>
      <BottomNav active={screen} onChange={setScreen}/>
      {modal==="receipt"&&<ReceiptModal tables={tables} onClose={()=>setModal(null)}/>}
      {modal==="addTable"&&<AddTableModal onConfirm={doAddTable} onClose={()=>setModal(null)}/>}
    </div>);
  }

  return(<div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,color:C.text,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
    <header style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,padding:"0 18px",height:54,position:"sticky",top:0,zIndex:90,display:"flex",alignItems:"center",gap:12}}>
      <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",borderRadius:10,padding:"5px 12px"}}>← הכל</button>
      <span style={{fontWeight:800,fontSize:15,color:"#fff",flex:1}}>{event.name}</span>
      {saving&&<Spinner size={16} color="rgba(255,255,255,.8)"/>}
      <div style={{display:"flex",gap:4}}>{[["map","🗺 מפה"],["list","📋"],["guests","👥"]].map(([v,l])=>(<button key={v} onClick={()=>setView(v)} style={{background:view===v?"rgba(255,255,255,.25)":"transparent",color:"#fff",border:`1px solid ${view===v?"rgba(255,255,255,.4)":"rgba(255,255,255,.2)"}`,borderRadius:10,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>))}</div>
      <span style={{background:"rgba(255,255,255,.15)",color:"#fff",borderRadius:100,fontSize:12,fontWeight:700,padding:"3px 12px"}}>{seated}/{total}</span>
      <button onClick={addTable} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",borderRadius:10,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ שולחן</button>
      <button onClick={()=>setModal("receipt")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",borderRadius:10,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🖨️ חפש</button>
    </header>
    <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 54px)"}}>
      <aside style={{width:250,background:C.surface,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {selTable?(<div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:C.blueXL}}>
            <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",padding:0,marginBottom:10}}>← חזרה</button>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontWeight:800,fontSize:15,color:C.text}}>{selTable.name}</span><span style={{background:sColor(selTable)+"22",color:sColor(selTable),borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px"}}>{(selTable.guests||[]).length}/{selTable.seats}</span></div>
            <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct(selTable)}%`,background:`linear-gradient(90deg,${C.blueM},${C.blueL})`,borderRadius:3,transition:"width .3s"}}/></div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
            {(selTable.guests||[]).length===0&&<p style={{color:C.muted,fontSize:13,textAlign:"center",marginTop:20}}>גרור אורחים לכאן</p>}
            {(selTable.guests||[]).map(g=><GuestChip key={g.id} guest={g} tableId={selTable.id} onRemove={g=>removeFromTable(selTable.id,g)}/>)}
            <div onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDrop={e=>{e.preventDefault();e.stopPropagation();const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(selTable.id,gid,f);}} style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"16px",textAlign:"center",color:C.muted,fontSize:13,marginTop:10,background:C.blueXL}}>+ שחרר כאן</div>
          </div>
        </div>):(<div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:C.blueXL}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontWeight:800,fontSize:14,color:C.text}}>ממתינים להושבה</span><span style={{background:C.gold+"22",color:C.gold,borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px"}}>{guests.length}</span></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש..." style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"10px 14px"}}>
            {guests.length===0&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40}}>🎉</div><p style={{color:C.success,fontWeight:700,fontSize:14,marginTop:8}}>כולם מוסבים!</p></div>}
            {guests.filter(g=>g.name.includes(search)).map(g=><GuestChip key={g.id} guest={g}/>)}
          </div>
          <div style={{padding:"12px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input value={newGuest} onChange={e=>setNewGuest(e.target.value)} placeholder="+ הוסף אורח" style={{flex:1,background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit"}} onKeyDown={e=>e.key==="Enter"&&addGuest()}/>
            <button onClick={addGuest} style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",fontSize:16,fontWeight:700}}>+</button>
          </div>
        </div>)}
      </aside>
      <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {view==="map"&&<>
          <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable");if(gid&&f){const g=tables.flatMap(t=>t.guests||[]).find(x=>String(x.id)===String(gid));if(g)removeFromTable(f,g);}}} onClick={()=>setSelected(null)} style={{flex:1,overflow:"auto",backgroundImage:`radial-gradient(ellipse at 30% 20%,rgba(74,122,255,.06),transparent 50%),linear-gradient(${C.border}80 1px,transparent 1px),linear-gradient(90deg,${C.border}80 1px,transparent 1px)`,backgroundSize:"auto,40px 40px,40px 40px"}}>
            <div style={{position:"relative",width:1400,height:900}}>
              <div style={{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",width:210,height:34,background:`linear-gradient(135deg,${C.blue}18,${C.blueL}12)`,border:`1px solid ${C.blueL}40`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:C.blue,letterSpacing:".1em",fontWeight:700}}>▲ במה ▲</div>
              {tables.map(t=>{const hmd=e=>{e.stopPropagation();setSelected(t.id);const ox=e.clientX-t.x,oy=e.clientY-t.y;const mv=me=>moveTablePos(t.id,me.clientX-ox,me.clientY-oy);const up=()=>{saveTablePos(t.id,t.x,t.y);window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);};return<TableNode key={t.id} table={t} selected={selected===t.id} onMouseDown={hmd} onDrop={e=>{const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(t.id,gid,f);}}/>;} )}
            </div>
          </div>
          <div style={{padding:"6px 16px",background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",gap:16,fontSize:11,color:C.muted}}>{Object.entries(TABLE_TYPES).map(([k,v])=><span key={k}>{v.icon} {v.label}</span>)}<span style={{marginRight:"auto"}}>💡 גרור שולחנות · שחרר אורחים</span></div>
        </>}
        {view==="list"&&<div style={{flex:1,overflowY:"auto",padding:20}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:14}}>{tables.map(t=>(<Card key={t.id} onClick={()=>{setSelected(t.id);setView("map");}} style={{padding:16,cursor:"pointer",border:`1.5px solid ${selected===t.id?C.blueL:C.border}`}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.blueL} onMouseLeave={e=>e.currentTarget.style.borderColor=selected===t.id?C.blueL:C.border}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>{TABLE_TYPES[t.type]?.icon}</span><span style={{fontWeight:800,fontSize:14,color:C.text}}>{t.name}</span></div><span style={{background:sColor(t)+"22",color:sColor(t),borderRadius:100,fontSize:12,fontWeight:700,padding:"2px 10px"}}>{(t.guests||[]).length}/{t.seats}</span></div><div style={{height:4,background:C.blueXL,borderRadius:2,overflow:"hidden",marginBottom:8}}><div style={{height:"100%",width:`${pct(t)}%`,background:`linear-gradient(90deg,${C.blueM},${C.blueL})`,transition:"width .4s"}}/></div><div style={{fontSize:11,color:C.muted}}>{(t.guests||[]).slice(0,3).map(g=>g.name).join(" · ")}{(t.guests||[]).length>3?` +${(t.guests||[]).length-3}`:""}</div></Card>))}</div></div>}
        {view==="guests"&&<div style={{flex:1,overflowY:"auto",padding:20}}><div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>{[{l:"סה״כ",v:total,c:C.blue,i:"👥"},{l:"מוסבים",v:seated,c:C.success,i:"✅"},{l:"ממתינים",v:guests.length,c:C.gold,i:"⏳"},{l:"פנויים",v:tables.reduce((s,t)=>s+t.seats,0)-seated,c:C.blueM,i:"🪑"}].map(({l,v,c,i})=>(<Card key={l} style={{padding:"14px 18px",borderTop:`3px solid ${c}`,minWidth:110}}><div style={{fontSize:20,marginBottom:2}}>{i}</div><div style={{fontSize:24,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:11,color:C.muted,marginTop:3,fontWeight:600}}>{l}</div></Card>))}</div>{tables.map(t=>(<Card key={t.id} style={{marginBottom:10,overflow:"hidden"}}><div style={{padding:"10px 16px",background:C.blueXL,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}><span>{TABLE_TYPES[t.type]?.icon}</span><span style={{fontWeight:800,flex:1,fontSize:14,color:C.text}}>{t.name}</span><span style={{background:sColor(t)+"22",color:sColor(t),borderRadius:100,fontSize:11,fontWeight:700,padding:"2px 10px"}}>{(t.guests||[]).length}/{t.seats}</span></div><div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:6}}>{(t.guests||[]).length===0?<span style={{color:C.muted,fontSize:13}}>אין אורחים</span>:(t.guests||[]).map(g=><span key={g.id} style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:100,padding:"3px 12px",fontSize:13,color:C.text}}>{g.name}</span>)}</div></Card>))}</div>}
      </main>
    </div>
    {modal==="receipt"&&<ReceiptModal tables={tables} onClose={()=>setModal(null)}/>}
    {modal==="addTable"&&<AddTableModal onConfirm={doAddTable} onClose={()=>setModal(null)}/>}
  </div>);
}

// ─── ADD TABLE MODAL ──────────────────────────────────────────────────────────
function AddTableModal({ onConfirm, onClose }) {
  const [name,setName]=useState(""),[type,setType]=useState("round");
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 20px"}}/>
        <div style={{fontWeight:800,fontSize:18,color:"#0D1B4B",marginBottom:4}}>➕ הוסף שולחן</div>
        <div style={{fontSize:13,color:"#6B7DB3",marginBottom:18}}>בחר סוג שולחן ושם</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
          {Object.entries(TABLE_TYPES).map(([k,v])=>(
            <button key={k} onClick={()=>setType(k)} style={{background:type===k?"linear-gradient(135deg,#2952C8,#4A7AFF)":"#E8EEFF",border:`2px solid ${type===k?"transparent":"#D6E0FF"}`,borderRadius:14,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all .15s"}}>
              <span style={{fontSize:24}}>{v.icon}</span>
              <span style={{fontSize:12,fontWeight:700,color:type===k?"#fff":"#0D1B4B"}}>{v.label}</span>
              <span style={{fontSize:10,color:type===k?"rgba(255,255,255,.7)":"#6B7DB3"}}>{v.defaultSeats} מקומות</span>
            </button>
          ))}
        </div>

        <input value={name} onChange={e=>setName(e.target.value)} placeholder="שם השולחן (למשל: שולחן 1, שולחן כבוד...)"
          onKeyDown={e=>e.key==="Enter"&&name.trim()&&onConfirm(name,type)}
          style={{width:"100%",background:"#E8EEFF",border:"1.5px solid #D6E0FF",borderRadius:14,padding:"13px 16px",fontSize:15,color:"#0D1B4B",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>

        <button onClick={()=>name.trim()&&onConfirm(name,type)} disabled={!name.trim()} style={{width:"100%",background:name.trim()?"linear-gradient(135deg,#2952C8,#4A7AFF)":"#E8EEFF",color:name.trim()?"#fff":"#6B7DB3",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:name.trim()?"pointer":"default",fontFamily:"inherit",transition:"all .15s"}}>
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

function InvitePage({ code }) {
  const [event,setEvent]=useState(null);
  const [loading,setLoading]=useState(true);
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [phone,setPhone]=useState("");
  const [guestCount,setGuestCount]=useState(1);
  const [rsvp,setRsvp]=useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);

  useEffect(()=>{
    sb.from("events").select("*").eq("invite_code",code).eq("invite_active",true).single()
      .then(({data})=>{setEvent(data||null);setLoading(false);});
  },[code]);

  const submit=async()=>{
    if(!firstName.trim()||!rsvp)return;
    setSubmitting(true);
    const fullName=`${firstName.trim()}${lastName.trim()?" "+lastName.trim():""}`;
    await sb.from("guests").insert({name:fullName,phone:phone.trim()||null,rsvp,guest_count:guestCount,event_id:event.id,table_id:null});
    setSubmitted(true);setSubmitting(false);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style>

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
        {event.welcome_text&&<p style={{fontSize:15,color:"#555",lineHeight:1.8,textAlign:"center",marginBottom:20,fontStyle:"italic"}}>"{event.welcome_text}"</p>}

        <div style={{borderTop:"1px solid #eee",borderBottom:"1px solid #eee",padding:"16px 0",marginBottom:20,textAlign:"center"}}>
          {dateStr&&<div style={{fontSize:14,fontWeight:700,color:"#333",marginBottom:4}}>{dateStr}</div>}
          {event.event_time&&<div style={{fontSize:18,fontWeight:900,color:"#111",marginBottom:8,letterSpacing:".05em"}}>{event.event_time}</div>}
          {event.venue&&<div style={{fontSize:15,fontWeight:700,color:"#333",marginBottom:2}}>{event.venue}</div>}
          {event.venue_address&&<div style={{fontSize:13,color:"#888",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>📍 {event.venue_address}</div>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
          {event.venue_address&&<button onClick={()=>navigate("waze")} style={{background:"none",border:"1px solid #ddd",borderRadius:12,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>🚗</span><span style={{fontSize:11,color:"#555",fontWeight:600}}>נווט לאירוע</span>
          </button>}
          {eventDate&&<button onClick={addCalendar} style={{background:"none",border:"1px solid #ddd",borderRadius:12,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>📅</span><span style={{fontSize:11,color:"#555",fontWeight:600}}>הוסף ליומן</span>
          </button>}
          <button onClick={share} style={{background:"none",border:"1px solid #ddd",borderRadius:12,padding:"12px 6px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>🔗</span><span style={{fontSize:11,color:"#555",fontWeight:600}}>שתפו את האירוע</span>
          </button>
        </div>

        <div style={{background:"#f9f9f9",borderRadius:16,padding:20,marginBottom:20}}>
          <h3 style={{fontSize:20,fontWeight:900,color:"#111",textAlign:"center",marginBottom:4}}>אישור הגעה</h3>
          <p style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:18}}>נשמח לראותכם בין אורחינו</p>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="שם פרטי"
              style={{background:"#fff",border:"1px solid #ddd",borderRadius:10,padding:"12px 14px",fontSize:14,color:"#111",outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
            <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="שם משפחה"
              style={{background:"#fff",border:"1px solid #ddd",borderRadius:10,padding:"12px 14px",fontSize:14,color:"#111",outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
          </div>

          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="מספר נייד" type="tel"
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
  const shareWA=()=>{window.open(`https://wa.me/?text=${encodeURIComponent("💌 הוזמנת ל"+event.name+"!\n"+inviteUrl)}`,"_blank");};
  const templates=INVITE_TEMPLATES[event.event_type||"wedding"]||INVITE_TEMPLATES.other;

  return(
    <div style={{padding:20,direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:100}}>
      <Card style={{padding:16,marginBottom:20,border:`2px solid ${C.blueL}`}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>🔗 לינק ההזמנה</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>שלח לאורחים — יוכלו לאשר הגעה ולקבל פרטים</div>
        <div style={{background:C.blueXL,borderRadius:10,padding:"10px 12px",fontSize:11,color:C.blue,fontFamily:"monospace",marginBottom:12,wordBreak:"break-all",lineHeight:1.5}}>{inviteCode?inviteUrl:"טוען..."}</div>
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
        <div style={{fontSize:11,color:C.muted,marginTop:8}}>לשינוי הפרטים — חזור לרשימת האירועים ולחץ ✏️</div>
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


// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Root() {
  const [user,setUser]=useState(null),[event,setEvent]=useState(null),[checking,setChecking]=useState(true),[authMode,setAuthMode]=useState(null),[showLanding,setShowLanding]=useState(false);

  const path=window.location.pathname;
  const hash=window.location.hash;
  const inviteMatch=path.match(/^\/invite\/([a-z0-9]+)$/i)||hash.match(/^#\/invite\/([a-z0-9]+)$/i);
  if(inviteMatch){
    return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style><InvitePage code={inviteMatch[1]}/></>);
  }

  useEffect(()=>{sb.auth.getSession().then(({data})=>{setUser(data.session?.user||null);setChecking(false);});const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>setUser(session?.user||null));return()=>subscription.unsubscribe();},[]);
  const logout=async()=>{await sb.auth.signOut();setUser(null);setEvent(null);setShowLanding(false);};

  if(checking)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><Spinner size={40}/></div>);

  if(!user||showLanding)return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}} @keyframes slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:none;opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}} @media(min-width:768px){.nav-link{display:block!important;}}`}</style>
    <LandingPage onOpenAuth={mode=>{setShowLanding(false);setAuthMode(mode);}}/>
    {authMode&&<AuthDrawer mode={authMode} onClose={()=>setAuthMode(null)} onAuth={u=>{setUser(u);setAuthMode(null);setShowLanding(false);}}/>}
  </>);

  if(!event)return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <EventPicker user={user} onSelect={setEvent} onLogout={logout} onBackToLanding={()=>setShowLanding(true)}/>
  </>);

  return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}`}</style>
  <SeatingApp user={user} event={event} onBack={()=>setEvent(null)} onUpdate={e=>setEvent(e)} onLogout={logout}/></>);
}
