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
function GuestModal({ guest, eventId, onSave, onClose, existingGuests=[] }) {
  const [name,setName]=useState(guest?.name||"");
  const [phone,setPhone]=useState(guest?.phone||"");
  const [rsvp,setRsvp]=useState(guest?.rsvp||"pending");
  const [count,setCount]=useState(guest?.guest_count||1);
  const [dupGuest,setDupGuest]=useState(null);
  const isEdit=!!guest?.id;

  const handleSave=()=>{
    if(!name.trim())return;
    // בדיקת כפילות רק בהוספה חדשה
    if(!isEdit){
      const nameClean=name.trim().toLowerCase();
      const phoneClean=phone.trim().replace(/\D/g,"");
      const found=existingGuests.find(g=>{
        const nameMatch=g.name.trim().toLowerCase()===nameClean;
        const phoneMatch=phoneClean&&g.phone&&g.phone.replace(/\D/g,"")===phoneClean;
        return nameMatch||phoneMatch;
      });
      if(found){setDupGuest(found);return;}
    }
    onSave({name:name.trim(),phone:phone.trim(),rsvp,guest_count:count});
  };

  // מודל כפילות
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

        <button onClick={handleSave} disabled={!name.trim()}
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
  return(<div style={{display:"flex",gap:8,justifyContent:"center",direction:"ltr"}}>{[["d","ימים"],["h","שעות"],["m","דקות"],["s","שניות"]].map(([k,l])=>(<div key={k} style={{textAlign:"center",background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 10px",minWidth:52}}><div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1}}>{String(time[k]).padStart(2,"0")}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.7)",marginTop:2}}>{l}</div></div>))}</div>);
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
          {icon:"🪑",title:"מערכת הושבה מתקדמת",desc:"ניהול מלא של סידורי הושבה לכל אירוע — ממשק גרירה, מפה אינטראקטיבית ופתק הושבה."},
          {icon:"✅",title:"אישורי הגעה דיגיטליים",desc:"שליחת הזמנות דיגיטליות ואישורי הגעה בוואטסאפ ו-SMS לכל האורחים."},
          {icon:"💳",title:"מתנות באשראי",desc:"מערכת תשלומים דיגיטלית לקבלת מתנות מהאורחים — מאובטח ומהיר."},
          {icon:"📊",title:"לוח בקרה לאולמות",desc:"ניהול אירועים מרובים במקביל מלוח בקרה מרכזי אחד — חיסכון בזמן ובכסף."},
          {icon:"🏷️",title:"White Label",desc:"המערכת תופיע תחת המותג שלך — הלוגו, הצבעים והשם שלך."},
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
function LandingPage({ onOpenAuth, onLogout }) {
  const [scrolled,setScrolled]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [venuePage,setVenuePage]=useState(false);

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

  if(venuePage) return <VenuePage onBack={()=>setVenuePage(false)} onOpenAuth={onOpenAuth}/>;

  const eventTypes = [
    { emoji:"💍", title:"חתונות", desc:"התארסתם? מזל טוב! ניהול החתונה בקלות.", img:"https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
    { emoji:"✡️", title:"בר/ת מצווה", desc:"גיל המצוות הגיע. תכנון נכון ביחד עם ההורים.", img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80" },
    { emoji:"👶", title:"בריתות", desc:"הבייבי נולד? ארגון אירוע אפילו בטווח קצר.", img:"https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80" },
    { emoji:"💼", title:"אירועים עסקיים", desc:"מערכת מתקדמת לניהול אירוע עסקי מכל גודל.", img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80" },
  ];

  return(
    <div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,right:0,left:0,zIndex:100,background:"#fff",borderBottom:`1px solid ${C.border}`,height:66,display:"flex",alignItems:"center",padding:"0 5vw",gap:12,boxShadow:scrolled?"0 2px 16px rgba(26,63,163,.07)":"none",transition:"box-shadow .3s"}}>
        {/* המבורגר — ראשון = הכי ימני */}
        <button onClick={()=>setMenuOpen(true)}
          style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,width:38,height:38,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,flexShrink:0,padding:0}}>
          <span style={{width:16,height:2,background:C.blue,borderRadius:1,display:"block"}}/>
          <span style={{width:16,height:2,background:C.blue,borderRadius:1,display:"block"}}/>
          <span style={{width:16,height:2,background:C.blue,borderRadius:1,display:"block"}}/>
        </button>
        {/* כניסה */}
        <button onClick={()=>onOpenAuth("login")}
          style={{background:"transparent",color:C.blue,border:`2px solid ${C.blue}`,borderRadius:8,padding:"7px 18px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
          כניסה
        </button>
        {/* קישורים — גלויים רק בדסקטופ */}
        <div style={{flex:1,display:"flex",gap:6,alignItems:"center",justifyContent:"flex-end"}}>
          {[["#","ראשי"],["#features","פיצ'רים"],["#how","איך עובד"],["#pricing","מחירים"],["#contact","צור קשר"]].map(([h,l])=>(
            <a key={h} href={h} className="nav-link"
              style={{color:C.text,textDecoration:"none",fontSize:14,fontWeight:600,padding:"6px 12px",borderRadius:8,display:"none",transition:"background .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.blueXL;e.currentTarget.style.color=C.blue;}}
              onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.text;}}>{l}</a>
          ))}
        </div>
        {/* לוגו — משמאל */}
        <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.blue},${C.blueL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#fff",fontWeight:900}}>◈</div>
          <span style={{fontWeight:900,fontSize:19,color:C.blue,letterSpacing:"-.02em"}}>Sidor-IL</span>
        </div>
      </nav>

      {menuOpen&&<HamburgerMenu onOpenAuth={onOpenAuth} onClose={()=>setMenuOpen(false)} onVenuePage={()=>setVenuePage(true)} onLogout={onLogout}/>}

      {/* HERO */}
      <section style={{minHeight:"92vh",display:"flex",alignItems:"center",padding:"100px 6vw 60px",background:"linear-gradient(135deg,#F0F4FF 0%,#E8EEFF 50%,#F5F8FF 100%)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"rgba(74,122,255,.06)",top:-100,left:-100,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"rgba(41,82,200,.05)",bottom:-50,right:"10%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:0,right:0,left:0,height:4,background:`linear-gradient(90deg,${C.blue},${C.blueL},${C.blue})`}}/>
        <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:1080,margin:"0 auto",display:"flex",alignItems:"center",gap:48,flexWrap:"wrap",justifyContent:"center"}}>
          {/* טקסט */}
          <div style={{flex:1,minWidth:280,animation:"fadeUp .7s ease both"}}>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(36px,4.5vw,64px)",fontWeight:800,lineHeight:1.08,color:C.text,letterSpacing:"-.03em",marginBottom:20}}>
              ניהול אירוע מושלם,<br/>
              <span style={{background:`linear-gradient(135deg,${C.blue},${C.blueL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>בלי כאבי ראש</span>
            </h1>
            <p style={{fontSize:17,color:C.muted,lineHeight:1.75,marginBottom:34}}>ממשק מתקדם לתכנון וניהול אירוע מושלם — סידורי הושבה, אישורי הגעה, ניהול מוזמנים ופתק הושבה.</p>
            <div style={{display:"flex",gap:13,flexWrap:"wrap"}}>
              <button onClick={()=>onOpenAuth("register")} style={{background:`linear-gradient(135deg,${C.blue},${C.blueL})`,color:"#fff",border:"none",borderRadius:14,padding:"16px 34px",fontSize:17,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 8px 28px rgba(74,122,255,.45)`}}>🚀 הרשמה בחינם</button>
              <button onClick={()=>onOpenAuth("login")} style={{background:"#fff",color:C.blue,border:`2px solid ${C.border}`,borderRadius:14,padding:"15px 26px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>צפו בהדגמה</button>
            </div>
          </div>
          {/* טלפון mockup */}
          <div style={{flexShrink:0,display:"flex",justifyContent:"center"}}>
            <div style={{width:235,height:490,borderRadius:38,background:"#111",padding:8,boxShadow:"0 40px 90px rgba(13,27,75,.3),0 8px 24px rgba(13,27,75,.15)",position:"relative",border:"1px solid #333"}}>
              <div style={{position:"absolute",top:13,left:"50%",transform:"translateX(-50%)",width:9,height:9,borderRadius:"50%",background:"#222",zIndex:10,border:"1px solid #444"}}/>
              <div style={{borderRadius:30,overflow:"hidden",height:"100%",background:"#f9f9f9",display:"flex",flexDirection:"column",direction:"rtl"}}>
                <div style={{height:190,position:"relative",overflow:"hidden",background:"linear-gradient(160deg,#1B3A8C,#4A7AFF)"}}>
                  <img src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,.1),rgba(0,0,0,.55))"}}/>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#fff",padding:12}}>
                    <div style={{fontSize:19,fontWeight:900,textShadow:"0 2px 8px rgba(0,0,0,.6)",letterSpacing:1}}>עמית & אורנה</div>
                    <div style={{fontSize:11,opacity:.9,marginTop:3,fontWeight:600}}>מתחתנים</div>
                  </div>
                </div>
                <div style={{flex:1,background:"#fff",borderRadius:"14px 14px 0 0",marginTop:-12,padding:"12px 10px",overflow:"hidden"}}>
                  <div style={{textAlign:"center",borderBottom:"1px solid #eee",paddingBottom:8,marginBottom:8}}>
                    <div style={{fontSize:9.5,color:"#555",fontWeight:600}}>יום חמישי, 30 באפריל 2026</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#111",lineHeight:1.1,marginTop:1}}>19:30</div>
                    <div style={{fontSize:10,fontWeight:700,color:"#222",marginTop:2}}>אולמי Sidor-IL</div>
                    <div style={{fontSize:9,color:"#888",marginTop:1}}>📍 השושנים 30, נוף הגליל</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:8}}>
                    {[["🔗","שתפו"],["📅","יומן"],["🚗","נווט"]].map(([ic,t])=>(
                      <div key={t} style={{background:"#f7f7f7",border:"1px solid #eee",borderRadius:8,padding:"5px 2px",textAlign:"center"}}>
                        <div style={{fontSize:13}}>{ic}</div>
                        <div style={{fontSize:8,color:"#555",fontWeight:600,marginTop:1}}>{t}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"#f9f9f9",borderRadius:10,padding:"8px"}}>
                    <div style={{fontSize:11,fontWeight:900,color:"#111",textAlign:"center",marginBottom:2}}>אישור הגעה</div>
                    <div style={{fontSize:8,color:"#888",textAlign:"center",marginBottom:6}}>נשמח לראותכם בין אורחינו</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:5}}>
                      <div style={{background:"#fff",border:"1px solid #ddd",borderRadius:6,padding:"5px 4px",fontSize:8,color:"#bbb",textAlign:"center"}}>שם פרטי</div>
                      <div style={{background:"#fff",border:"1px solid #ddd",borderRadius:6,padding:"5px 4px",fontSize:8,color:"#bbb",textAlign:"center"}}>שם משפחה</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                      <div style={{background:"#2D9B5A",borderRadius:6,padding:"5px",fontSize:9,fontWeight:700,color:"#fff",textAlign:"center"}}>✓ מגיעים</div>
                      <div style={{background:"#fff",border:"2px solid #D63B3B",borderRadius:6,padding:"5px",fontSize:9,fontWeight:700,color:"#D63B3B",textAlign:"center"}}>✗ לא מגיעים</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 ICONS BAR */}
      <div style={{background:"#fff",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"28px 6vw"}}>
        <div style={{maxWidth:700,margin:"0 auto",display:"flex",justifyContent:"center",gap:"clamp(20px,5vw,60px)",flexWrap:"wrap"}}>
          {[
            {icon:<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label:"אישורי הגעה", sub:"בוואטסאפ"},
            {icon:<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, label:"אישורים", sub:"טלפוניים"},
            {icon:<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, label:"מתנות", sub:"באשראי"},
            {icon:<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, label:"סידורי הושבה", sub:"מלאים"},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer"}}>
              <div style={{width:64,height:64,borderRadius:"50%",border:`2px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blueL;e.currentTarget.style.boxShadow=`0 4px 16px ${C.blueL}33`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow="none";}}>
                {item.icon}
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.text}}>{item.label}</div>
                <div style={{fontSize:11,color:C.muted}}>{item.sub}</div>
              </div>
            </div>
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

      {/* AUDIENCE - 3 כרטיסים אחד מתחת לשני */}
      <section style={{padding:"88px 6vw",background:C.bg}} id="audience">
        <div style={{maxWidth:780,margin:"0 auto"}}>
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",marginBottom:52,textAlign:"center"}}>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.3vw,44px)",fontWeight:800,color:C.text,marginBottom:12}}>לנהל אירוע בראש שקט</h2>
            <p style={{fontSize:16,color:C.muted,maxWidth:600,margin:"0 auto"}}>כל מה שצריך לאירוע מושלם — במקום אחד.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {[
              {icon:"💳",title:"מתנות באשראי",color:C.gold,bg:"#FFF8E1",desc:"האורחים שלכם יכולים לתת מתנה דיגיטלית בקליק אחד — בלי מזומן, בלי עיכובים. מתחברים בקלות ומקבלים את המתנה ישירות.",features:["תשלום מאובטח ומהיר","ללא עמלות נסתרות","קבלת המתנה באופן מיידי","היסטוריית תשלומים מלאה"]},
              {icon:"🪑",title:"סידורי הושבה",color:C.blue,bg:C.blueXL,desc:"כלי דיגיטלי ומהיר לסידורי שולחנות וניהול האורחים — עם עדכוני הגעה בזמן אמת וממשק גרירה נוח.",features:["מפה אינטראקטיבית של האולם","גרירת אורחים לשולחנות","שולחן עגול, מרובע ואבירים","פתק הושבה להדפסה מיידית"]},
              {icon:"✅",title:"אישורי הגעה",color:C.success,bg:"#F0FFF6",desc:"קליק אחד והאורחים מאשרים הגעה בכל מקום ובכל זמן — דרך SMS, וואטסאפ או הזמנה דיגיטלית.",features:["אישור בוואטסאפ ו-SMS","עדכון בזמן אמת","כמות מגיעים לכל אורח","ניהול רשימת ממתינים"]},
            ].map((item,i)=>(
              <Card key={item.title} className="fu" style={{opacity:0,transform:"translateY(22px)",transition:`opacity .6s ${i*.1}s,transform .6s ${i*.1}s`,padding:"32px 36px",display:"flex",alignItems:"flex-start",gap:24,border:`1.5px solid ${C.border}`}}>
                <div style={{width:60,height:60,borderRadius:18,background:item.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>
                  {item.icon}
                </div>
                <div style={{flex:1}}>
                  <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:C.text,marginBottom:8}}>{item.title}</h3>
                  <p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:14}}>{item.desc}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {item.features.map(f=>(
                      <span key={f} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.text,background:item.bg,borderRadius:100,padding:"4px 12px"}}>
                        <span style={{color:item.color,fontWeight:800}}>✓</span>{f}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{padding:"88px 6vw",background:C.bg,textAlign:"center"}} id="pricing">
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s,transform .6s",marginBottom:52}}>
            <div style={{display:"inline-block",fontSize:12,fontWeight:700,color:C.blueL,background:C.blueXL,border:`1px solid rgba(74,122,255,.25)`,borderRadius:100,padding:"5px 16px",marginBottom:12}}>מחירים</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.3vw,44px)",fontWeight:800,color:C.text,marginBottom:12}}>לכל החבילות והמחירים</h2>
            <p style={{fontSize:16,color:C.muted}}>שקוף ופשוט — ללא הפתעות.</p>
          </div>

          {/* 4 חבילות */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20,maxWidth:1040,margin:"0 auto 40px"}}>
            {[
              {
                id:"basic",name:"בסיס + הושבה",price:"₪150",period:"החל מ",color:C.blue,bg:C.blueXL,
                badge:null,
                features:["שליחה ידנית בוואטסאפ","קבלת אישורי הגעה","סידורי הושבה מלאים","מפה אינטראקטיבית","פתק הושבה להדפסה"],
              },
              {
                id:"sms",name:"הודעות SMS",price:"₪70",period:"החל מ",color:"#059669",bg:"#F0FFF6",
                badge:"📱 SMS",
                features:["הכל בחבילת בסיס","שליחת SMS לכל האורחים","תזמון הודעות אוטומטי","אישורי הגעה ב-SMS","תזכורות לפני האירוע"],
              },
              {
                id:"whatsapp",name:"הודעות WhatsApp",price:"₪80",period:"החל מ",color:"#25D366",bg:"#F0FFF6",
                badge:"💬 WhatsApp",featured:true,
                features:["שליחה אוטומטית בוואטסאפ","תזכורת לפני האירוע","תודה לאחר האירוע","אישורי הגעה ללא הגבלה","מגיב אוטומטי לשאלות"],
              },
              {
                id:"vip",name:"VIP הכל כלול",price:"₪250",period:"החל מ",color:"#B45309",bg:"#FFFBEB",
                badge:"👑 VIP",
                features:["הכל בחבילת WhatsApp","סבב שיחות טלפוני לאורחים","מספר שולחן ב-SMS ביום האירוע","סגנון הזמנה פרימיום","תמיכה ייעודית 24/7"],
              },
              {
                id:"reception",name:"עמדת קבלת פנים",price:"₪1,300",period:"החל מ",color:"#7C3AED",bg:"#F5F3FF",
                badge:"💎 פרימיום",
                features:["עמדת קבלת פנים עם דיילים/ות","חלוקת פתקיות הושבה לאורחים","צמצום רזרבות במהלך ההושבה","ניהול תורים בכניסה","תיאום מלא עם צוות האולם"],
              },
              {
                id:"production",name:"הפקת אירוע",price:"בהתאם",period:"לייעוץ חינם",color:"#DB2777",bg:"#FFF0F6",
                badge:"✨ פרימיום",
                features:["אטרקציות לאירוע","ניהול אלכוהול / בר אקטיבי","עיצובים לאירוע","אתם חולמים — אנחנו מגשימים","ייעוץ אישי ללא עלות"],
              },
            ].map((p,i)=>(
              <div key={p.id} className="fu" onClick={()=>onOpenAuth("register")}
                style={{opacity:0,transform:"translateY(22px)",transition:`opacity .6s ${i*.1}s,transform .6s ${i*.1}s`,
                  border:`2px solid ${p.featured?p.color:C.border}`,borderRadius:22,padding:"28px 22px",textAlign:"right",
                  background:p.featured?`linear-gradient(145deg,${C.blue},${C.blueM})`:C.surface,
                  position:"relative",cursor:"pointer",
                  boxShadow:p.featured?`0 8px 32px ${C.blueL}44`:"none"}}>
                {p.badge&&<div style={{position:"absolute",top:-12,right:20,background:p.featured?C.gold:p.color,color:p.featured?C.text:"#fff",fontSize:11,fontWeight:800,padding:"3px 12px",borderRadius:100}}>{p.badge}</div>}
                <div style={{fontSize:11,fontWeight:800,color:p.featured?"rgba(255,255,255,.6)":C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>{p.name}</div>
                <div style={{fontSize:38,fontWeight:900,color:p.featured?"#fff":p.color,lineHeight:1,marginBottom:2}}>{p.price}</div>
                <div style={{fontSize:12,color:p.featured?"rgba(255,255,255,.55)":C.muted,marginBottom:18}}>{p.period}</div>
                <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:8,marginBottom:20,textAlign:"right"}}>
                  {p.features.map(f=>(<li key={f} style={{fontSize:13,display:"flex",alignItems:"center",gap:7,color:p.featured?"rgba(255,255,255,.88)":C.text}}>
                    <span style={{color:p.featured?"#6EE7A7":p.color,fontWeight:900,flexShrink:0}}>✓</span>{f}
                  </li>))}
                </ul>
                <div style={{width:"100%",padding:"11px",borderRadius:10,fontSize:14,fontWeight:700,textAlign:"center",
                  background:p.featured?"rgba(255,255,255,.2)":p.color,
                  color:"#fff",border:p.featured?"2px solid rgba(255,255,255,.3)":"none"}}>
                  לרכישה מהירה ←
                </div>
              </div>
            ))}
          </div>

          {/* חבילות SMS */}
          <div className="fu" style={{opacity:0,transform:"translateY(22px)",transition:"opacity .6s .2s,transform .6s .2s",background:C.surface,borderRadius:20,padding:"32px",border:`1px solid ${C.border}`,maxWidth:700,margin:"0 auto"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>📱 רכישת SMS בנפרד</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>ניתן לרכוש רשומות SMS בנוסף לכל חבילה</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:12}}>
              {[[150,"₪70"],[300,"₪90"],[500,"₪120"],[800,"₪170"],[1000,"₪200"],[2000,"₪330"]].map(([sms,price])=>(
                <div key={sms} onClick={()=>onOpenAuth("register")} style={{border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 8px",textAlign:"center",cursor:"pointer",background:C.bg}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blueL;e.currentTarget.style.background=C.blueXL;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bg;}}>
                  <div style={{fontSize:22,fontWeight:900,color:C.blue,lineHeight:1}}>{sms.toLocaleString()}</div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:8}}>הודעות SMS</div>
                  <div style={{fontSize:16,fontWeight:800,color:C.text}}>{price}</div>
                  <div style={{fontSize:11,color:C.blueL,fontWeight:700,marginTop:4}}>לרכישה ←</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:C.muted,textAlign:"center"}}>רכישה מהירה ומאובטחת · Apple Pay · Google Pay · Bit · Visa · Mastercard</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"96px 6vw",background:`linear-gradient(145deg,${C.blue},#122e8c,${C.blueM})`,textAlign:"center",position:"relative",overflow:"hidden"}} id="contact">
        <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"14px 14px"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,50px)",fontWeight:800,color:"#fff",marginBottom:14}}>מוכן להתחיל?</h2>
          <p style={{fontSize:17,color:"rgba(255,255,255,.7)",marginBottom:38}}>הצטרף לאלפי זוגות שכבר עשו את זה נכון.</p>
          <div style={{display:"flex",gap:13,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>onOpenAuth("register")} style={{background:"#fff",color:C.blue,border:"none",borderRadius:14,padding:"15px 36px",fontSize:17,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 28px rgba(0,0,0,.15)"}}>🚀 הרשמה בחינם</button>
            <a href="https://wa.me/972526817102" target="_blank" rel="noopener" style={{background:"#25D366",color:"#fff",border:"none",borderRadius:10,padding:"14px 28px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"none",display:"flex",alignItems:"center",gap:8}}>💬 WhatsApp</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#070D28",color:"rgba(255,255,255,.45)",padding:"54px 6vw 30px"}}>
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:40,marginBottom:44,justifyContent:"space-between"}}>
            {/* לוגו ופרטים */}
            <div style={{maxWidth:320}}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
                <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${C.blue},${C.blueL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",fontWeight:900}}>◈</div>
                <span style={{fontWeight:900,fontSize:17,color:"#fff"}}>Sidor-IL</span>
              </div>
              <p style={{fontSize:13,color:"rgba(255,255,255,.38)",lineHeight:1.8,marginBottom:16}}>פלטפורמה ישראלית לניהול סידורי הושבה חכמים. בנויה עבור זוגות ומפיקי אירועים.</p>
            </div>
            {/* צור קשר */}
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"rgba(255,255,255,.75)",marginBottom:16}}>צור קשר</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.5)",lineHeight:2.4,display:"flex",flexDirection:"column",gap:4}}>
                <div>📍 השושנים 30, נוף הגליל</div>
                <a href="https://wa.me/972526817102" target="_blank" rel="noopener" style={{color:"#25D366",textDecoration:"none",fontWeight:700}}>💬 לחץ לצ'אט ב-WhatsApp</a>
                <div>📞 052-681-7102</div>
                <div>⏰ א׳-ה׳: 9:00-17:00 | שישי: 9:00-12:00</div>
              </div>
            </div>
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
      <a href="https://wa.me/972526817102" target="_blank" rel="noopener" style={{position:"fixed",bottom:24,left:24,background:"#25D366",color:"#fff",borderRadius:50,padding:"12px 20px",display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,boxShadow:"0 4px 20px rgba(37,211,102,.45)",zIndex:99,textDecoration:"none"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        לחץ לצ'אט
      </a>
    </div>
  );
}

// ─── AUTH DRAWER ──────────────────────────────────────────────────────────────
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
        const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/`});
        if(error)throw error;
        setResetSent(true);
      } else if(mode==="login"){
        const{data,error}=await sb.auth.signInWithPassword({email,password:pass});
        if(error)throw error;
        onAuth(data.user);
      } else {
        const{data,error}=await sb.auth.signUp({email,password:pass});
        if(error)throw error;
        if(data.user&&!data.user.email_confirmed_at)setErr("✅ נשלח מייל אימות!");
        else onAuth(data.user);
      }
    }catch(e){
      setErr(e.message==="Invalid login credentials"?"❌ אימייל או סיסמה שגויים":e.message);
    }
    setLoad(false);
  };

  const loginWithGoogle=async()=>{setGoogleLoad(true);await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/`}});setGoogleLoad(false);};

  return(<>
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(13,27,75,.5)",backdropFilter:"blur(6px)"}}/>
    <div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:201,background:C.surface,borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",maxWidth:480,margin:"0 auto",animation:"slideUp .3s ease both",direction:"rtl"}}>
      <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 24px"}}/>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:52,height:52,borderRadius:15,background:`linear-gradient(135deg,${C.blue},${C.blueL})`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:10}}>◈</div>
        <div style={{fontWeight:900,fontSize:20,color:C.blue}}>Sidor-IL</div>
        <div style={{fontSize:12,color:C.muted,marginTop:2}}>סידורי הושבה חכמים</div>
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
  const [userPackages,setUserPackages]=useState([]);
  const hasPkg=(id)=>userPackages.includes(id)||userPackages.includes("vip");

  useEffect(()=>{loadAll();const fn=()=>setMobile(isMobile());window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[event.id]);
  const loadAll=async()=>{setLoading(true);const [{data:tData},{data:gData},{data:pkgData}]=await Promise.all([sb.from("tables").select("*").eq("event_id",event.id).order("created_at"),sb.from("guests").select("*").eq("event_id",event.id).order("created_at"),sb.from("user_packages").select("package_id").eq("user_id",user.id)]);setTables((tData||[]).map(t=>({...t,guests:(gData||[]).filter(g=>g.table_id===t.id)})));setGuests((gData||[]).filter(g=>!g.table_id));setUserPackages((pkgData||[]).map(p=>p.package_id));setLoading(false);};
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
            {icon:"🤖",label:"AI סידור חכם",nav:"ai",highlight2:true},
            {icon:"📊",label:"ייבוא אורחים",nav:"import"},
            {icon:"🖨️",label:"חיפוש אורח",nav:"receipt"},
            {icon:"➕",label:"הוסף אורח",nav:"add"},
            {icon:"🪑➕",label:"הוסף שולחן",nav:"addTable"},
            {icon:"💰",label:"ניהול תקציב",nav:"budget"},
            {icon:"📦",label:"חבילות",nav:"packages",highlight3:true},
            {icon:"📱",label:"הודעות SMS",nav:"sms",locked:!hasPkg("sms")},
            {icon:"💬",label:"הודעות WhatsApp",nav:"whatsapp",locked:!hasPkg("whatsapp")},
            {icon:"⚙️",label:"הגדרות",nav:"settings"},
          ].map(item=>(
            <Card key={item.nav}
              onClick={()=>{
                if(item.locked){setModal("locked");return;}
                if(item.nav==="receipt")setModal("receipt");
                else if(item.nav==="addTable")setModal("addTable");
                else setScreen(item.nav);
              }}
              style={{padding:"18px 16px",cursor:"pointer",display:"flex",flexDirection:"column",gap:8,
                border:`1.5px solid ${item.highlight?C.blueL:item.highlight2?"#7C3AED":item.highlight3?"#B45309":C.border}`,
                background:item.highlight?C.blueXL:item.highlight2?"#F5F3FF":item.highlight3?"#FFFBEB":item.locked?"#F9FAFB":C.surface,
                opacity:item.locked?.6:1,position:"relative"}}>
              {item.locked&&<div style={{position:"absolute",top:8,left:8,fontSize:12}}>🔒</div>}
              <div style={{width:44,height:44,borderRadius:13,
                background:item.highlight?`linear-gradient(135deg,${C.blueM},${C.blueL})`:
                  item.highlight2?"linear-gradient(135deg,#7C3AED,#A855F7)":
                  item.highlight3?"linear-gradient(135deg,#B45309,#D97706)":
                  item.locked?"#E5E7EB":C.blueXL,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{item.icon}</div>
              <div style={{fontWeight:700,fontSize:14,
                color:item.highlight?C.blue:item.highlight2?"#7C3AED":item.highlight3?"#B45309":item.locked?C.muted:C.text}}>
                {item.label}
              </div>
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
          {screen==="home"?event.name:screen==="seating"?"🪑 סידורי הושבה":screen==="add"?"➕ הוסף אורח":screen==="import"?"📊 ייבוא אורחים":screen==="rsvp"?"✅ אישורי הגעה":screen==="invite"?"💌 הזמנה דיגיטלית":screen==="budget"?"💰 ניהול תקציב":screen==="ai"?"🤖 AI סידור חכם":screen==="packages"?"📦 חבילות":screen==="sms"?"📱 הודעות SMS":screen==="whatsapp"?"💬 הודעות WhatsApp":screen==="settings"?"⚙️ הגדרות":event.name}
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
            <button onClick={()=>setScreen("contacts")} style={{width:"100%",background:C.surface,color:C.blue,border:`2px solid ${C.blueL}`,borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              📱 ייבא מאנשי קשר
            </button>
            <button onClick={()=>{loadAll();setScreen("home");}} style={{width:"100%",background:"transparent",color:C.blue,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:10}}>
              סיום ✓
            </button>
          </div>
        )}
        {modal==="addGuest"&&<GuestModal eventId={event.id} onClose={()=>setModal(null)} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onSave={async(data)=>{await addGuest(data);setModal(null);}}/>}
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
                {/* שורת שם */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0}}>{g.name[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.text}}>{g.name}</div>
                    {g.phone&&<div style={{fontSize:11,color:C.muted}}>{g.phone}</div>}
                  </div>
                </div>
                {/* כפתורי RSVP */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
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
                {/* כפתור מחיקה */}
                <button onClick={async()=>{
                  if(!window.confirm(`למחוק את "${g.name}" מהרשימה?`))return;
                  await sb.from("guests").delete().eq("id",g.id);
                  setGuests(gs=>gs.filter(x=>x.id!==g.id));
                  setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).filter(x=>x.id!==g.id)})));
                }} style={{width:"100%",background:"#FEF2F2",border:`1px solid ${C.danger}30`,borderRadius:10,padding:"8px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:C.danger,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  🗑️ מחק אורח
                </button>
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
        {screen==="packages"&&<PackagesScreen event={event} onBack={()=>setScreen("home")}/>}
        {screen==="sms"&&<SMSScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>}
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
        {screen==="ai"&&<AISeatingScreen event={event} tables={tables} guests={guests} onApply={async(assignments)=>{
          setSaving(true);
          for(const{guestId,tableId}of assignments){
            await sb.from("guests").update({table_id:tableId||null}).eq("id",guestId);
          }
          await loadAll();
          setSaving(false);
          setScreen("seating");
        }}/>}
        {screen==="budget"&&<BudgetScreen event={event}/>}
        {screen==="contacts"&&<ContactsScreen event={event} onAdd={async(list)=>{setSaving(true);await sb.from("guests").insert(list.map(c=>({name:c.name,phone:c.phone||null,rsvp:"pending",guest_count:1,event_id:event.id,table_id:null})));await loadAll();setSaving(false);setScreen("add");}}/>}
        {screen==="settings"&&(
          <div style={{padding:24,direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
            <Card style={{padding:16,marginBottom:14}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:4}}>מחובר כ</div>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{user.email}</div>
            </Card>
            <Btn danger full onClick={async()=>{await sb.auth.signOut();setScreen("home");}}>🚪 התנתק</Btn>
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

// ─── BUDGET SCREEN ────────────────────────────────────────────────────────────
function BudgetScreen({ event }) {
  const CATS = ["אולם","קייטרינג","צילום","מוזיקה","פרחים","הלבשה","הסעות","מתנות","אחר"];
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",amount:"",type:"expense",category:"אחר",paid:false,note:""});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    sb.from("budget_items").select("*").eq("event_id",event.id).order("created_at",{ascending:false})
      .then(({data})=>{setItems(data||[]);setLoading(false);});
  },[event.id]);

  const totalExpense=items.filter(i=>i.type==="expense").reduce((s,i)=>s+Number(i.amount),0);
  const totalIncome=items.filter(i=>i.type==="income").reduce((s,i)=>s+Number(i.amount),0);
  const totalPaid=items.filter(i=>i.type==="expense"&&i.paid).reduce((s,i)=>s+Number(i.amount),0);
  const balance=totalIncome-totalExpense;

  const save=async()=>{
    if(!form.name.trim()||!form.amount)return;
    setSaving(true);
    const{data}=await sb.from("budget_items").insert({...form,amount:Number(form.amount),event_id:event.id}).select().single();
    if(data)setItems(prev=>[data,...prev]);
    setForm({name:"",amount:"",type:"expense",category:"אחר",paid:false,note:""});
    setShowForm(false);setSaving(false);
  };

  const togglePaid=async(item)=>{
    await sb.from("budget_items").update({paid:!item.paid}).eq("id",item.id);
    setItems(prev=>prev.map(i=>i.id===item.id?{...i,paid:!i.paid}:i));
  };

  const deleteItem=async(id)=>{
    await sb.from("budget_items").delete().eq("id",id);
    setItems(prev=>prev.filter(i=>i.id!==id));
  };

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:16,paddingBottom:80}}>

      {/* סיכום */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Card style={{padding:"14px",borderTop:`3px solid ${C.danger}`}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>סה״כ הוצאות</div>
          <div style={{fontSize:22,fontWeight:900,color:C.danger}}>₪{totalExpense.toLocaleString()}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>שולם: ₪{totalPaid.toLocaleString()}</div>
        </Card>
        <Card style={{padding:"14px",borderTop:`3px solid ${C.success}`}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>סה״כ הכנסות</div>
          <div style={{fontSize:22,fontWeight:900,color:C.success}}>₪{totalIncome.toLocaleString()}</div>
          <div style={{fontSize:11,color:balance>=0?C.success:C.danger,marginTop:3,fontWeight:700}}>
            יתרה: {balance>=0?"+ ":"- "}₪{Math.abs(balance).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* פס התקדמות תשלום */}
      {totalExpense>0&&<Card style={{padding:"12px 14px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:6}}>
          <span>שולם מתוך הוצאות</span>
          <span style={{fontWeight:700,color:C.blue}}>{Math.round(totalPaid/totalExpense*100)}%</span>
        </div>
        <div style={{height:8,background:C.blueXL,borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.min(100,totalPaid/totalExpense*100)}%`,background:`linear-gradient(90deg,${C.success},#4AE89A)`,borderRadius:4,transition:"width .5s"}}/>
        </div>
      </Card>}

      {/* כפתור הוספה */}
      <button onClick={()=>setShowForm(f=>!f)} style={{width:"100%",background:showForm?"#FEF2F2":`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:showForm?C.danger:"#fff",border:showForm?`2px solid ${C.danger}30`:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        {showForm?"✕ סגור":"➕ הוסף פריט"}
      </button>

      {/* טופס הוספה */}
      {showForm&&<Card style={{padding:16,marginBottom:16,border:`1.5px solid ${C.blueL}`}}>
        {/* סוג */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {[["expense","💸 הוצאה"],["income","💵 הכנסה"]].map(([v,l])=>(
            <button key={v} onClick={()=>setForm(f=>({...f,type:v}))} style={{background:form.type===v?(v==="expense"?C.danger:C.success):"#f5f5f5",color:form.type===v?"#fff":C.text,border:"none",borderRadius:12,padding:"10px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
        {/* שם */}
        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="שם הפריט (למשל: צלם)"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
        {/* סכום */}
        <input value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="סכום (₪)" type="number"
          style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
        {/* קטגוריה */}
        {form.type==="expense"&&<div style={{marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>קטגוריה</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{background:form.category===c?C.blueM:C.blueXL,color:form.category===c?"#fff":C.text,border:`1px solid ${form.category===c?C.blueM:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>
            ))}
          </div>
        </div>}
        {/* שולם */}
        {form.type==="expense"&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,background:C.blueXL,borderRadius:11,padding:"10px 14px"}}>
          <input type="checkbox" id="paid" checked={form.paid} onChange={e=>setForm(f=>({...f,paid:e.target.checked}))} style={{width:18,height:18,cursor:"pointer"}}/>
          <label htmlFor="paid" style={{fontSize:14,fontWeight:600,color:C.text,cursor:"pointer"}}>✅ שולם כבר</label>
        </div>}
        <button onClick={save} disabled={saving||!form.name.trim()||!form.amount} style={{width:"100%",background:form.name.trim()&&form.amount?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#E8EEFF",color:form.name.trim()&&form.amount?"#fff":C.muted,border:"none",borderRadius:12,padding:"12px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          {saving?"שומר...":"שמור פריט ✓"}
        </button>
      </Card>}

      {/* רשימת פריטים */}
      {loading?<div style={{display:"flex",justifyContent:"center",padding:32}}><Spinner size={32}/></div>:
        items.length===0?<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:48}}>💰</div><p style={{color:C.muted,fontSize:14,marginTop:8}}>אין עדיין פריטים</p></div>:
        items.map(item=>(
          <Card key={item.id} style={{padding:"12px 14px",marginBottom:10,opacity:item.paid?.7:1,border:`1.5px solid ${item.type==="income"?C.success+"44":item.paid?C.border:C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:40,height:40,borderRadius:12,background:item.type==="income"?"#F0FFF6":"#FEF2F2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {item.type==="income"?"💵":"💸"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14,fontWeight:700,color:C.text}}>{item.name}</span>
                  {item.paid&&<span style={{fontSize:10,background:"#F0FFF6",color:C.success,borderRadius:100,padding:"1px 7px",fontWeight:700}}>✓ שולם</span>}
                </div>
                {item.category&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{item.category}</div>}
              </div>
              <div style={{textAlign:"left",flexShrink:0}}>
                <div style={{fontSize:16,fontWeight:900,color:item.type==="income"?C.success:C.danger}}>
                  {item.type==="income"?"+":"-"}₪{Number(item.amount).toLocaleString()}
                </div>
              </div>
            </div>
            {item.type==="expense"&&<div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={()=>togglePaid(item)} style={{flex:1,background:item.paid?"#F0FFF6":C.blueXL,color:item.paid?C.success:C.blue,border:`1px solid ${item.paid?C.success+"44":C.border}`,borderRadius:10,padding:"7px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {item.paid?"✓ שולם":"סמן כשולם"}
              </button>
              <button onClick={()=>deleteItem(item.id)} style={{background:"#FEF2F2",border:`1px solid ${C.danger}30`,borderRadius:10,padding:"7px 12px",fontSize:13,cursor:"pointer",color:C.danger,fontFamily:"inherit",fontWeight:700}}>🗑️</button>
            </div>}
            {item.type==="income"&&<div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
              <button onClick={()=>deleteItem(item.id)} style={{background:"#FEF2F2",border:`1px solid ${C.danger}30`,borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",color:C.danger,fontFamily:"inherit",fontWeight:700}}>🗑️ מחק</button>
            </div>}
          </Card>
        ))
      }
    </div>
  );
}

// ─── CONTACTS SCREEN ──────────────────────────────────────────────────────────
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
            <div style={{width:36,height:36,borderRadius:"50%",background:selected.has(c.id)?`linear-gradient(135deg,${C.blueM},${C.blueL})`:"#E8EEFF",color:selected.has(c.id)?"#fff":C.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0,transition:"all .15s"}}>
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
  const [smsPkg,setSmsPkg]=useState(null);

  const packages=[
    {id:"basic",name:"בסיס + הושבה",price:150,sub:"החל מ",color:C.blue,icon:"🪑",
     features:["שליחה ידנית בוואטסאפ","קבלת אישורי הגעה ללא הגבלה","סידורי הושבה מלאים","מפה אינטראקטיבית","פתק הושבה להדפסה","AI סידור חכם"]},
    {id:"sms",name:"הודעות SMS",price:70,sub:"החל מ",color:"#059669",icon:"📱",badge:"SMS",
     features:["הכל בחבילת בסיס","שליחת SMS לכל האורחים","תזמון הודעות אוטומטי","תזכורות לפני האירוע","אישורי הגעה ב-SMS"]},
    {id:"whatsapp",name:"WhatsApp אוטומטי",price:80,sub:"החל מ",color:"#25D366",icon:"💬",badge:"WhatsApp",featured:true,
     features:["הכל בחבילת SMS","שליחה אוטומטית בוואטסאפ","תזכורת לפני האירוע","הודעת תודה לאחר האירוע","מגיב אוטומטי לשאלות"]},
    {id:"vip",name:"VIP הכל כלול",price:250,sub:"החל מ",color:"#B45309",icon:"👑",badge:"VIP",
     features:["הכל בחבילת WhatsApp","📞 סבב שיחות טלפוני לאורחים","מספר שולחן ב-SMS ביום האירוע","סגנון הזמנה פרימיום","תמיכה ייעודית 24/7"]},
    {id:"reception",name:"עמדת קבלת פנים",price:1300,sub:"החל מ",color:"#7C3AED",icon:"💎",badge:"פרימיום",
     features:["עמדת קבלת פנים עם דיילים/ות","חלוקת פתקיות הושבה לאורחים","צמצום רזרבות במהלך ההושבה","ניהול תורים בכניסה","תיאום מלא עם צוות האולם"]},
    {id:"production",name:"הפקת אירוע",price:"ייעוץ",sub:"לייעוץ חינם",color:"#DB2777",icon:"✨",badge:"חלומות",
     features:["🎪 אטרקציות לאירוע","🍸 ניהול אלכוהול / בר אקטיבי","🎨 עיצובים לאירוע","💫 אתם חולמים — אנחנו מגשימים","📞 ייעוץ אישי ללא עלות"]},
  ];

  const smsPacks=[[150,70],[300,90],[500,120],[800,170],[1000,200],[2000,330]];
  const vipPacks=[["עד 100","₪250"],["עד 150","₪370"],["עד 200","₪480"],["עד 250","₪590"],["עד 300","₪690"],["עד 350","₪790"],["עד 400","₪880"],["עד 450","₪970"],["עד 500","₪1,050"],["עד 550","₪1,130"],["עד 600","₪1,200"],["עד 650","₪1,300"],["עד 700","₪1,400"],["עד 750","₪1,500"],["עד 800","₪1,600"]];

  const handlePurchase=(pkg,extraSms=null)=>{
    const total=pkg.price+(extraSms?extraSms[1]:0);
    alert(`בקרוב! תשלום של ₪${total} עבור חבילת "${pkg.name}"${extraSms?` + ${extraSms[0]} SMS`:""}\nמערכת PayPlus תשולב בקרוב.`);
  };

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:80}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#B45309,#D97706)`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:"12px 12px"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:4}}>שדרג את האירוע שלך</div>
          <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>👑 חבילות Sidor-IL</div>
        </div>
      </div>

      <div style={{padding:16}}>
        {/* חבילות */}
        {packages.map((pkg,i)=>(
          <div key={pkg.id} onClick={()=>setSelectedPkg(selectedPkg?.id===pkg.id?null:pkg)}
            style={{background:C.surface,border:`2px solid ${selectedPkg?.id===pkg.id?pkg.color:C.border}`,borderRadius:18,padding:"18px 16px",marginBottom:12,cursor:"pointer",position:"relative",
              boxShadow:selectedPkg?.id===pkg.id?`0 4px 20px ${pkg.color}33`:"none",transition:"all .2s"}}>
            {pkg.badge&&<div style={{position:"absolute",top:-10,right:16,background:pkg.color,color:"#fff",fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:100}}>{pkg.badge}</div>}
            {pkg.featured&&<div style={{position:"absolute",top:-10,left:16,background:C.gold,color:C.text,fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:100}}>⭐ הכי פופולרי</div>}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:selectedPkg?.id===pkg.id?12:0}}>
              <div style={{width:44,height:44,borderRadius:12,background:pkg.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{pkg.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15,color:C.text}}>{pkg.name}</div>
                <div style={{fontSize:13,color:C.muted,marginTop:1}}>לחץ לפרטים נוספים</div>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:1}}>{pkg.sub}</div>
                <div style={{fontSize:22,fontWeight:900,color:pkg.color}}>{typeof pkg.price==="number"?`₪${pkg.price.toLocaleString()}`:pkg.price}</div>
              </div>
            </div>
            {selectedPkg?.id===pkg.id&&(
              <div>
                <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:7,marginBottom:16}}>
                  {pkg.features.map(f=>(
                    <li key={f} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.text}}>
                      <span style={{color:pkg.color,fontWeight:900,flexShrink:0}}>✓</span>{f}
                    </li>
                  ))}
                </ul>

                {/* VIP — טבלת מחירים לפי רשומות, לחיצה מעדכנת מחיר */}
                {pkg.id==="vip"&&(
                  <div style={{background:C.bg,borderRadius:12,padding:12,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>בחר כמות רשומות:</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,maxHeight:220,overflowY:"auto"}}>
                      {vipPacks.map(([label,price])=>(
                        <div key={label}
                          onClick={e=>{e.stopPropagation();setSmsPkg([label,parseInt(price.replace(/[₪,]/g,""))]);}}
                          style={{border:`1.5px solid ${smsPkg?.[0]===label?"#B45309":C.border}`,borderRadius:8,padding:"8px",display:"flex",justifyContent:"space-between",alignItems:"center",background:smsPkg?.[0]===label?"#FFFBEB":C.surface,cursor:"pointer"}}>
                          <span style={{fontSize:12,color:C.muted}}>{label}</span>
                          <span style={{fontSize:13,fontWeight:800,color:"#B45309"}}>{price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp — טבלת מחירים לפי רשומות */}
                {pkg.id==="whatsapp"&&(
                  <div style={{background:C.bg,borderRadius:12,padding:12,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>בחר כמות רשומות:</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,maxHeight:220,overflowY:"auto"}}>
                      {[["עד 50","80"],["עד 100","120"],["עד 150","180"],["עד 200","240"],["עד 250","280"],["עד 300","340"],["עד 350","390"],["עד 400","430"],["עד 450","480"],["עד 500","520"],["עד 550","560"],["עד 600","600"],["עד 650","630"],["עד 700","660"],["עד 750","690"],["עד 800","720"]].map(([label,price])=>(
                        <div key={label}
                          onClick={e=>{e.stopPropagation();setSmsPkg([label,parseInt(price)]);}}
                          style={{border:`1.5px solid ${smsPkg?.[0]===label?"#25D366":C.border}`,borderRadius:8,padding:"8px",display:"flex",justifyContent:"space-between",alignItems:"center",background:smsPkg?.[0]===label?"#F0FFF4":C.surface,cursor:"pointer"}}>
                          <span style={{fontSize:12,color:C.muted}}>{label} רשומות</span>
                          <span style={{fontSize:13,fontWeight:800,color:"#25D366"}}>₪{price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SMS — הוסף חבילת SMS */}
                {pkg.id==="sms"&&(
                  <div style={{background:C.bg,borderRadius:12,padding:12,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>בחר כמות SMS:</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                      {smsPacks.map(([sms,price])=>(
                        <div key={sms} onClick={e=>{e.stopPropagation();setSmsPkg(smsPkg?.[0]===sms?null:[sms,price]);}}
                          style={{border:`1.5px solid ${smsPkg?.[0]===sms?C.blue:C.border}`,borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"pointer",background:smsPkg?.[0]===sms?C.blueXL:C.surface}}>
                          <div style={{fontSize:14,fontWeight:800,color:C.blue}}>{sms.toLocaleString()}</div>
                          <div style={{fontSize:9,color:C.muted}}>SMS</div>
                          <div style={{fontSize:12,fontWeight:700,color:C.text}}>₪{price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* עמדת קבלת פנים / הפקת אירוע — צור קשר בלבד */}
                {(pkg.id==="reception"||pkg.id==="production")?(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <a href={`https://wa.me/972526817102?text=${encodeURIComponent(pkg.id==="production"?"שלום, אני מעוניין לשמוע על הפקת אירוע ולקבל הצעת מחיר":"שלום, אני מעוניין לשמוע על עמדת קבלת פנים")}`} target="_blank" rel="noopener"
                      onClick={e=>e.stopPropagation()}
                      style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      💬 יצירת קשר בוואטסאפ
                    </a>
                    <a href="tel:0526817102" onClick={e=>e.stopPropagation()}
                      style={{width:"100%",background:C.blueXL,color:C.blue,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      📞 התקשר עכשיו
                    </a>
                  </div>
                ):(
                  <button onClick={e=>{e.stopPropagation();
                    const finalPrice=smsPkg?smsPkg[1]:pkg.price;
                    alert(`בקרוב! תשלום של ₪${finalPrice.toLocaleString()} עבור חבילת "${pkg.name}"\nמערכת PayPlus תשולב בקרוב.`);
                  }}
                    style={{width:"100%",background:`linear-gradient(135deg,${pkg.color},${pkg.color}CC)`,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    לרכישה מהירה ← {smsPkg?`₪${smsPkg[1].toLocaleString()}`:typeof pkg.price==="number"?`₪${pkg.price.toLocaleString()}`:pkg.price}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* PayPlus */}
        <div style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:6}}>תשלום מאובטח דרך PayPlus</div>
          <div style={{display:"flex",justifyContent:"center",gap:12,fontSize:20}}>
            🍎 <span style={{fontSize:13,fontWeight:700,color:C.text}}>Apple Pay</span>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>Google Pay</span>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>Bit</span>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>Visa</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SMS SCREEN ───────────────────────────────────────────────────────────────
function SMSScreen({ event, guests }) {
  const [balance]=useState(0);
  const [msgType,setMsgType]=useState("reminder");
  const [customMsg,setCustomMsg]=useState("");
  const [scheduled,setScheduled]=useState("");

  const templates={
    reminder:`שלום {שם}, מזכירים לך על האירוע "${event.name}" בתאריך ${event.date||"הקרוב"}. נשמח לראותך! - Sidor-IL`,
    table:`שלום {שם}, מספר השולחן שלך באירוע "${event.name}" הוא: שולחן {מספר}. ביום האירוע ${event.date||""}`,
    thanks:`שלום {שם}, תודה שהגעת ל"${event.name}"! שמחנו לחגוג אתך. - Sidor-IL`,
    confirm:`שלום {שם}, אנחנו מצפים לראותך ב"${event.name}"! אנא אשר הגעתך: ${window.location.origin}/#/invite/${event.invite_code||""}`,
  };

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:16,paddingBottom:80}}>
      {/* יתרה */}
      <Card style={{padding:16,marginBottom:16,background:balance===0?"#FEF2F2":C.blueXL,border:`1.5px solid ${balance===0?C.danger:C.blueL}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:12,color:C.muted,fontWeight:700}}>יתרת הודעות SMS</div>
            <div style={{fontSize:28,fontWeight:900,color:balance===0?C.danger:C.blue}}>{balance.toLocaleString()}</div>
          </div>
          <button onClick={()=>alert("בקרוב! רכישת SMS דרך PayPlus")}
            style={{background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",border:"none",borderRadius:12,padding:"10px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            + רכש SMS
          </button>
        </div>
        {balance===0&&<div style={{fontSize:12,color:C.danger,marginTop:8}}>⚠️ אין יתרת SMS. רכוש חבילה כדי לשלוח הודעות.</div>}
      </Card>

      {/* סוג הודעה */}
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>בחר סוג הודעה:</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[["reminder","⏰ תזכורת"],["table","🪑 מספר שולחן"],["thanks","🙏 תודה"],["confirm","✅ אישור הגעה"]].map(([v,l])=>(
          <button key={v} onClick={()=>{setMsgType(v);setCustomMsg(templates[v]);}}
            style={{background:msgType===v?`linear-gradient(135deg,${C.blueM},${C.blueL})`:C.blueXL,color:msgType===v?"#fff":C.text,border:`1.5px solid ${msgType===v?"transparent":C.border}`,borderRadius:12,padding:"10px 8px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {l}
          </button>
        ))}
      </div>

      {/* תוכן ההודעה */}
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:8}}>תוכן ההודעה:</div>
      <textarea value={customMsg||templates[msgType]} onChange={e=>setCustomMsg(e.target.value)}
        style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:12,fontSize:13,color:C.text,outline:"none",fontFamily:"inherit",minHeight:100,boxSizing:"border-box",resize:"vertical",marginBottom:14,direction:"rtl"}}/>

      {/* תזמון */}
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:8}}>תזמון שליחה (אופציונלי):</div>
      <input type="datetime-local" value={scheduled} onChange={e=>setScheduled(e.target.value)}
        style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:16}}/>

      {/* סטטיסטיקות */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Card style={{padding:"12px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:C.blue}}>{guests.length}</div>
          <div style={{fontSize:11,color:C.muted}}>אורחים לשליחה</div>
        </Card>
        <Card style={{padding:"12px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:balance>=guests.length?C.success:C.danger}}>{balance}</div>
          <div style={{fontSize:11,color:C.muted}}>יתרת SMS</div>
        </Card>
      </div>

      <button disabled={balance===0}
        onClick={()=>balance>0&&alert(`נשלחו ${guests.length} הודעות SMS!`)}
        style={{width:"100%",background:balance===0?"#E5E7EB":`linear-gradient(135deg,#059669,#10B981)`,color:balance===0?C.muted:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:balance===0?"default":"pointer",fontFamily:"inherit"}}>
        {balance===0?"🔒 רכוש SMS כדי לשלוח":`📱 שלח ל-${guests.length} אורחים`}
      </button>
    </div>
  );
}

// ─── WHATSAPP SCREEN ──────────────────────────────────────────────────────────
function WhatsAppScreen({ event, guests }) {
  const [selected,setSelected]=useState(null);

  const eventDate=event.date?new Date(event.date):null;
  const calcDate=(daysBefore)=>{
    if(!eventDate)return null;
    const d=new Date(eventDate);
    d.setDate(d.getDate()-daysBefore);
    return d;
  };
  const calcAfter=(daysAfter)=>{
    if(!eventDate)return null;
    const d=new Date(eventDate);
    d.setDate(d.getDate()+daysAfter);
    return d;
  };
  const fmtDate=(d)=>{
    if(!d)return "לפי תאריך האירוע";
    const days=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
    return `${d.toLocaleDateString("he-IL",{day:"2-digit",month:"2-digit",year:"numeric"})}\nיום ${days[d.getDay()]}`;
  };

  const schedules=[
    {id:"invite",  label:"1. הזמנות",   icon:"✈️", channel:"WhatsApp",    date:calcDate(25), desc:"שליחת הזמנה דיגיטלית עם לינק לאישור הגעה לכל האורחים"},
    {id:"reminder",label:"2. סבב נוסף", icon:"✈️", channel:"WhatsApp",    date:calcDate(18), desc:"תזכורת למי שעוד לא אישר הגעה — שליחה אוטומטית"},
    {id:"phone",   label:"3. טלפונים",  icon:"📞", channel:"מוקד אנושי",  date:calcDate(11), desc:"סבב שיחות טלפוני לאורחים שלא הגיבו — בחבילת VIP"},
    {id:"smsrem",  label:"4. תזכורות",  icon:"🔔", channel:"SMS",         date:calcDate(8),  desc:"תזכורת SMS לכל האורחים לקראת האירוע"},
    {id:"table",   label:"5. מס' שולחן",icon:"🪑", channel:"SMS",         date:calcDate(0),  desc:"שליחת מספר שולחן לכל אורח ביום האירוע"},
    {id:"thanks",  label:"6. תודות",    icon:"👍", channel:"SMS",         date:calcAfter(3), desc:"הודעת תודה לאחר האירוע — עד 7 ימים אחרי"},
  ];

  const channelColor=(ch)=>ch==="WhatsApp"?"#25D366":ch==="מוקד אנושי"?"#6B7280":"#3B82F6";

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:16,paddingBottom:80}}>
      {/* כותרת */}
      <div style={{background:"linear-gradient(135deg,#075E54,#25D366)",borderRadius:16,padding:"16px",marginBottom:16,color:"#fff"}}>
        <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>💬 מערכת הודעות אוטומטית</div>
        <div style={{fontSize:12,opacity:.85,marginBottom:8}}>המועדים מחושבים אוטומטית לפי תאריך האירוע שלך</div>
        {eventDate
          ?<div style={{fontSize:13,fontWeight:700,background:"rgba(255,255,255,.2)",borderRadius:8,padding:"6px 10px",display:"inline-block"}}>📅 {fmtDate(eventDate).replace("\n"," ")}</div>
          :<div style={{fontSize:12,color:"rgba(255,255,255,.75)"}}>⚠️ הגדר תאריך אירוע כדי לראות מועדים מדויקים</div>}
      </div>

      <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:4}}>המועדים שנקבעו אוטומטית:</div>
      <div style={{fontSize:11,color:C.muted,marginBottom:14}}>(ניתן לשנות מועדים לאחר רכישת החבילה)</div>

      {/* גריד 3x2 כמו diginet */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
        {schedules.map((s)=>(
          <div key={s.id} onClick={()=>setSelected(selected===s.id?null:s.id)}
            style={{background:C.surface,border:`1.5px solid ${selected===s.id?channelColor(s.channel):C.border}`,borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",transition:"all .2s"}}>
            {/* אייקון עגול */}
            <div style={{width:46,height:46,borderRadius:"50%",border:`2px solid ${channelColor(s.channel)}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto 8px",background:`${channelColor(s.channel)}11`}}>
              {s.icon}
            </div>
            <div style={{fontWeight:800,fontSize:12,color:C.text,marginBottom:5}}>{s.label}</div>
            <div style={{display:"inline-block",fontSize:10,fontWeight:700,background:channelColor(s.channel),color:"#fff",borderRadius:100,padding:"2px 7px",marginBottom:6}}>
              {s.channel}
            </div>
            <div style={{fontSize:10,color:C.muted,lineHeight:1.5,whiteSpace:"pre-line"}}>
              {s.date?fmtDate(s.date):"לפי תאריך האירוע"}
            </div>
            <div style={{fontSize:10,color:channelColor(s.channel),fontWeight:600,marginTop:6,borderTop:`1px solid ${C.border}`,paddingTop:6}}>
              למידע נוסף
            </div>
            {selected===s.id&&(
              <div style={{marginTop:8,padding:"8px",background:C.bg,borderRadius:8,textAlign:"right"}}>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>{s.desc}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* בחירת כמות רשומות */}
      <Card style={{padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:12}}>בחירת כמות רשומות:</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[["עד 50 רשומות","₪80"],["עד 100 רשומות","₪120"],["עד 150 רשומות","₪180"],["עד 200 רשומות","₪240"],["עד 250 רשומות","₪280"],["עד 300 רשומות","₪340"],["עד 350 רשומות","₪390"],["עד 400 רשומות","₪430"],["עד 450 רשומות","₪480"],["עד 500 רשומות","₪520"],["עד 550 רשומות","₪560"],["עד 600 רשומות","₪600"],["עד 650 רשומות","₪630"],["עד 700 רשומות","₪660"],["עד 750 רשומות","₪690"],["עד 800 רשומות","₪720"]].map(([label,price])=>(
            <div key={label} onClick={()=>alert(`בקרוב! תשלום ${price} דרך PayPlus`)}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#25D366";e.currentTarget.style.background="#F0FFF4";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bg;}}>
              <span style={{fontSize:14,fontWeight:600,color:C.text}}>{label}</span>
              <span style={{fontSize:15,fontWeight:800,color:"#25D366"}}>{price} ←</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{background:C.blueXL,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px",textAlign:"center"}}>
        <div style={{fontSize:11,color:C.muted}}>תשלום מאובטח דרך PayPlus · Apple Pay · Google Pay · Bit · Visa</div>
      </div>
    </div>
  );
}

// ─── AI SEATING SCREEN ────────────────────────────────────────────────────────
function AISeatingScreen({ event, tables, guests, onApply }) {
  const [instructions,setInstructions]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");

  const allGuests=[...guests,...tables.flatMap(t=>(t.guests||[]).map(g=>({...g,currentTable:t.name})))];

  const runAI=async()=>{
    if(!instructions.trim()){setError("כתוב הנחיות לפני הפעלת ה-AI");return;}
    if(tables.length===0){setError("צור שולחנות קודם");return;}
    if(allGuests.length===0){setError("הוסף אורחים קודם");return;}
    setLoading(true);setError("");setResult(null);

    const prompt=`אתה עוזר לסידורי הושבה לאירועים בעברית.

רשימת האורחים:
${allGuests.map(g=>`- ${g.name} (ID: ${g.id})${g.currentTable?` [כרגע בשולחן: ${g.currentTable}]`:""}`).join("\n")}

רשימת השולחנות:
${tables.map(t=>`- ${t.name} (ID: ${t.id}, מקומות: ${t.seats}, תפוס: ${(t.guests||[]).length})`).join("\n")}

הנחיות המשתמש:
${instructions}

החזר JSON בלבד (ללא טקסט נוסף) בפורמט:
{"assignments":[{"guestId":"...","tableId":"...","reason":"..."}],"summary":"תקציר בעברית של הסידור"}

שבץ כל אורח לשולחן מתאים לפי ההנחיות. שים לב לא לחרוג ממספר המקומות.`;

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:2000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await res.json();
      const text=data.content?.[0]?.text||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setResult(parsed);
    }catch(e){
      setError("שגיאה בחיבור ל-AI. נסה שוב.");
    }
    setLoading(false);
  };

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",padding:16,paddingBottom:80}}>
      {/* הסבר */}
      <div style={{background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",border:"1.5px solid #7C3AED30",borderRadius:16,padding:16,marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:800,color:"#7C3AED",marginBottom:6}}>🤖 איך עובד?</div>
        <div style={{fontSize:13,color:"#6D28D9",lineHeight:1.7}}>כתוב הנחיות בעברית חופשית — מי לא יושב עם מי, מי צריך לשבת קרוב לבמה, משפחות ביחד וכו'. ה-AI יסדר את כל האורחים אוטומטית.</div>
      </div>

      {/* סטטיסטיקות */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[[allGuests.length,"👥","אורחים"],[tables.length,"🪑","שולחנות"],[tables.reduce((s,t)=>s+t.seats,0)-allGuests.filter(g=>g.table_id).length,"🆓","מקומות פנויים"]].map(([v,ic,l])=>(
          <Card key={l} style={{padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:20}}>{ic}</div>
            <div style={{fontSize:20,fontWeight:900,color:C.blue}}>{v}</div>
            <div style={{fontSize:10,color:C.muted}}>{l}</div>
          </Card>
        ))}
      </div>

      {/* שדה הנחיות */}
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:8}}>✍️ כתוב הנחיות לסידור</div>
      <textarea
        value={instructions}
        onChange={e=>setInstructions(e.target.value)}
        placeholder={"לדוגמה:\n• משפחת כהן לא יושבת ליד משפחת לוי\n• הורי הכלה ליד הבמה\n• ילדים בשולחן נפרד\n• חברים מהצבא ביחד"}
        style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:14,fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",minHeight:140,boxSizing:"border-box",resize:"vertical",marginBottom:12,lineHeight:1.6}}
      />

      {/* דוגמאות מהירות */}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {["זוגות ביחד","ילדים בשולחן נפרד","קשישים קרוב לבמה","חברים מהעבודה ביחד"].map(tip=>(
          <button key={tip} onClick={()=>setInstructions(p=>p+(p?"\n":"")+tip)}
            style={{background:C.blueXL,color:C.blue,border:`1px solid ${C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            + {tip}
          </button>
        ))}
      </div>

      {error&&<div style={{background:"#FEF2F2",border:`1px solid ${C.danger}30`,borderRadius:12,padding:"10px 14px",fontSize:13,color:C.danger,marginBottom:12}}>{error}</div>}

      {/* כפתור הפעלה */}
      <button onClick={runAI} disabled={loading}
        style={{width:"100%",background:loading?"#E9D5FF":`linear-gradient(135deg,#7C3AED,#A855F7)`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:loading?"default":"pointer",fontFamily:"inherit",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:loading?"none":"0 4px 20px rgba(124,58,237,.4)"}}>
        {loading?<><Spinner size={20} color="#fff"/>מחשב סידור אופטימלי...</>:"🤖 הפעל AI לסידור חכם"}
      </button>

      {/* תוצאה */}
      {result&&(
        <div style={{background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",border:"1.5px solid #7C3AED40",borderRadius:16,padding:16,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:800,color:"#7C3AED",marginBottom:8}}>✨ הצעת סידור</div>
          {result.summary&&<div style={{fontSize:13,color:"#6D28D9",lineHeight:1.7,marginBottom:12,background:"#fff",borderRadius:10,padding:"10px 12px"}}>{result.summary}</div>}
          <div style={{maxHeight:200,overflowY:"auto",marginBottom:12}}>
            {result.assignments?.slice(0,8).map((a,i)=>{
              const g=allGuests.find(x=>String(x.id)===String(a.guestId));
              const t=tables.find(x=>String(x.id)===String(a.tableId));
              if(!g||!t)return null;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid #EDE9FE`}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#7C3AED,#A855F7)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{g.name[0]}</div>
                  <div style={{flex:1,fontSize:13,color:C.text,fontWeight:600}}>{g.name}</div>
                  <div style={{fontSize:11,color:"#7C3AED",fontWeight:700,background:"#EDE9FE",borderRadius:8,padding:"2px 8px"}}>→ {t.name}</div>
                </div>
              );
            })}
            {result.assignments?.length>8&&<div style={{fontSize:12,color:C.muted,textAlign:"center",padding:"8px 0"}}>ועוד {result.assignments.length-8} אורחים...</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>setResult(null)} style={{background:"#fff",color:"#7C3AED",border:"1.5px solid #7C3AED40",borderRadius:12,padding:"11px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>↩ נסה שוב</button>
            <button onClick={()=>onApply(result.assignments)} style={{background:`linear-gradient(135deg,#7C3AED,#A855F7)`,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✅ אשר ויישם</button>
          </div>
        </div>
      )}
    </div>
  );
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
  // duplicate detection
  const [dupGuest,setDupGuest]=useState(null); // the existing guest found
  const [showDupModal,setShowDupModal]=useState(false);

  useEffect(()=>{
    sb.from("events").select("*").eq("invite_code",code).eq("invite_active",true).single()
      .then(({data})=>{setEvent(data||null);setLoading(false);});
  },[code]);

  const doInsert=async()=>{
    const fullName=`${firstName.trim()}${lastName.trim()?" "+lastName.trim():""}`;
    await sb.from("guests").insert({name:fullName,phone:phone.trim()||null,rsvp,guest_count:guestCount,event_id:event.id,table_id:null});
    setSubmitted(true);setSubmitting(false);setShowDupModal(false);
  };

  const doUpdate=async()=>{
    await sb.from("guests").update({rsvp,guest_count:guestCount,phone:phone.trim()||dupGuest.phone||null}).eq("id",dupGuest.id);
    setSubmitted(true);setSubmitting(false);setShowDupModal(false);
  };

  const submit=async()=>{
    if(!firstName.trim()||!rsvp)return;
    setSubmitting(true);
    const fullName=`${firstName.trim()}${lastName.trim()?" "+lastName.trim():""}`;
    // בדוק כפילות לפי שם או טלפון
    let query=sb.from("guests").select("*").eq("event_id",event.id);
    const nameClean=fullName.trim().toLowerCase();
    const phoneClean=phone.trim();
    const{data:existing}=await query;
    const found=(existing||[]).find(g=>{
      const nameMatch=g.name.trim().toLowerCase()===nameClean;
      const phoneMatch=phoneClean&&g.phone&&g.phone.replace(/\D/g,"")===phoneClean.replace(/\D/g,"");
      return nameMatch||phoneMatch;
    });
    if(found){
      setDupGuest(found);
      setShowDupModal(true);
      setSubmitting(false);
      return;
    }
    await doInsert();
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}`}</style>
      {showDupModal&&<DupModal/>}

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


// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
const ADMIN_EMAIL="Amitgez331@gmail.com";

const ALL_PACKAGES=[
  {id:"basic",name:"בסיס + הושבה",color:"#1B3A8C",icon:"🪑"},
  {id:"sms",name:"הודעות SMS",color:"#059669",icon:"📱"},
  {id:"whatsapp",name:"WhatsApp אוטומטי",color:"#25D366",icon:"💬"},
  {id:"vip",name:"VIP הכל כלול",color:"#B45309",icon:"👑"},
  {id:"reception",name:"עמדת קבלת פנים",color:"#7C3AED",icon:"💎"},
  {id:"production",name:"הפקת אירוע",color:"#DB2777",icon:"✨"},
];

function AdminDashboard({ user, onLogout }) {
  const [users,setUsers]=useState([]);
  const [events,setEvents]=useState([]);
  const [packages,setPackages]=useState({}); // {user_id: [pkg_id, ...]}
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("users");
  const [search,setSearch]=useState("");
  const [stats,setStats]=useState({users:0,events:0,guests:0});
  const [saving,setSaving]=useState(null);

  useEffect(()=>{loadData();},[]);

  const loadData=async()=>{
    setLoading(true);
    const [{data:evData},{data:gData},{data:pkgData}]=await Promise.all([
      sb.from("events").select("*").order("created_at",{ascending:false}),
      sb.from("guests").select("id,event_id"),
      sb.from("user_packages").select("*"),
    ]);
    const evList=evData||[];
    const gList=gData||[];
    const pkgList=pkgData||[];

    // קיבוץ אירועים לפי user_id
    const userMap={};
    evList.forEach(ev=>{
      if(!userMap[ev.user_id])userMap[ev.user_id]={user_id:ev.user_id,events:[],guests:0};
      userMap[ev.user_id].events.push(ev);
    });
    gList.forEach(g=>{
      const ev=evList.find(e=>e.id===g.event_id);
      if(ev&&userMap[ev.user_id])userMap[ev.user_id].guests++;
    });

    // קיבוץ חבילות לפי user_id
    const pkgMap={};
    pkgList.forEach(p=>{
      if(!pkgMap[p.user_id])pkgMap[p.user_id]=[];
      pkgMap[p.user_id].push(p.package_id);
    });

    setEvents(evList);
    setUsers(Object.values(userMap));
    setPackages(pkgMap);
    setStats({users:Object.keys(userMap).length,events:evList.length,guests:gList.length});
    setLoading(false);
  };

  const togglePackage=async(userId,pkgId,hasIt)=>{
    setSaving(`${userId}-${pkgId}`);
    if(hasIt){
      await sb.from("user_packages").delete().eq("user_id",userId).eq("package_id",pkgId);
      setPackages(prev=>({...prev,[userId]:(prev[userId]||[]).filter(p=>p!==pkgId)}));
    } else {
      await sb.from("user_packages").insert({user_id:userId,package_id:pkgId});
      setPackages(prev=>({...prev,[userId]:[...(prev[userId]||[]),pkgId]}));
    }
    setSaving(null);
  };

  const filteredUsers=users.filter(u=>
    !search||u.events.some(e=>e.name?.toLowerCase().includes(search.toLowerCase()))||
    u.user_id.toLowerCase().includes(search.toLowerCase())
  );
  const filteredEvents=events.filter(e=>
    e.name?.toLowerCase().includes(search.toLowerCase())||
    e.user_id?.toLowerCase().includes(search.toLowerCase())
  );

  return(
    <div style={{minHeight:"100vh",background:"#0D1117",color:"#E6EDF3",fontFamily:"'Heebo',sans-serif",direction:"rtl"}}>
      {/* TOP BAR */}
      <div style={{background:"#161B22",borderBottom:"1px solid #30363D",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1B3A8C,#4A7AFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>◈</div>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:"#fff"}}>Sidor-IL Admin</div>
            <div style={{fontSize:11,color:"#888"}}>{user.email}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={loadData} style={{background:"#21262D",color:"#E6EDF3",border:"1px solid #30363D",borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>🔄 רענן</button>
          <button onClick={onLogout} style={{background:"#DA3633",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>יציאה</button>
        </div>
      </div>

      <div style={{padding:"20px"}}>
        {/* סטטיסטיקות */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
          {[[stats.users,"👥","משתמשים","#1B3A8C"],[stats.events,"📅","אירועים","#059669"],[stats.guests,"🎊","אורחים","#B45309"]].map(([v,ic,l,col])=>(
            <div key={l} style={{background:"#161B22",border:"1px solid #30363D",borderRadius:12,padding:"16px",borderTop:`3px solid ${col}`}}>
              <div style={{fontSize:24,marginBottom:2}}>{ic}</div>
              <div style={{fontSize:28,fontWeight:900,color:col}}>{v}</div>
              <div style={{fontSize:12,color:"#888",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        {/* חיפוש */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש לפי שם אירוע..."
          style={{width:"100%",background:"#161B22",border:"1px solid #30363D",borderRadius:10,padding:"10px 16px",fontSize:14,color:"#E6EDF3",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:14}}/>

        {/* טאבים */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["users","👥 משתמשים + חבילות"],["events","📅 אירועים"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{background:tab===id?"#1B3A8C":"#21262D",color:"#E6EDF3",border:`1px solid ${tab===id?"#4A7AFF":"#30363D"}`,borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {label}
            </button>
          ))}
        </div>

        {loading?(
          <div style={{textAlign:"center",padding:40}}><Spinner size={36}/></div>
        ):tab==="users"?(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {filteredUsers.map(u=>(
              <div key={u.user_id} style={{background:"#161B22",border:"1px solid #30363D",borderRadius:14,padding:"16px"}}>
                {/* מידע משתמש */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:11,color:"#888",marginBottom:2}}>User ID</div>
                    <div style={{fontSize:12,fontWeight:700,color:"#E6EDF3",fontFamily:"monospace"}}>{u.user_id.slice(0,16)}...</div>
                    <div style={{fontSize:11,color:"#888",marginTop:4}}>{u.events.length} אירועים · {u.guests} אורחים</div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,justifyContent:"flex-end"}}>
                    {u.events.slice(0,2).map(ev=>(
                      <span key={ev.id} style={{background:"#21262D",border:"1px solid #30363D",borderRadius:6,padding:"3px 8px",fontSize:11,color:"#E6EDF3"}}>{ev.name}</span>
                    ))}
                  </div>
                </div>

                {/* חבילות */}
                <div style={{borderTop:"1px solid #30363D",paddingTop:12}}>
                  <div style={{fontSize:11,color:"#888",marginBottom:8}}>חבילות פעילות:</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {ALL_PACKAGES.map(pkg=>{
                      const hasIt=(packages[u.user_id]||[]).includes(pkg.id);
                      const isSaving=saving===`${u.user_id}-${pkg.id}`;
                      return(
                        <button key={pkg.id} onClick={()=>togglePackage(u.user_id,pkg.id,hasIt)}
                          disabled={isSaving}
                          style={{background:hasIt?pkg.color+"33":"#21262D",border:`1.5px solid ${hasIt?pkg.color:"#30363D"}`,borderRadius:10,padding:"8px 10px",fontSize:12,fontWeight:700,color:hasIt?pkg.color:"#888",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
                          {isSaving?<Spinner size={12} color={pkg.color}/>:<span>{pkg.icon}</span>}
                          <span style={{flex:1,textAlign:"right"}}>{pkg.name}</span>
                          <span style={{fontSize:16}}>{hasIt?"✓":"+"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length===0&&<div style={{textAlign:"center",color:"#888",padding:40}}>אין משתמשים</div>}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filteredEvents.map(ev=>(
              <div key={ev.id} style={{background:"#161B22",border:"1px solid #30363D",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:800,fontSize:15,color:"#E6EDF3",marginBottom:2}}>{ev.name}</div>
                  <div style={{fontSize:11,color:"#888"}}>{ev.date||"ללא תאריך"} · {ev.event_type||"חתונה"}</div>
                </div>
                <span style={{background:ev.invite_active?"#05906922":"#DA363322",color:ev.invite_active?"#10B981":"#F85149",border:`1px solid ${ev.invite_active?"#10B98144":"#F8514944"}`,borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:700}}>
                  {ev.invite_active?"✓ הזמנה פעילה":"✗ כבויה"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Root() {
  const [user,setUser]=useState(null),[event,setEvent]=useState(null),[checking,setChecking]=useState(true),[authMode,setAuthMode]=useState(null),[showLanding,setShowLanding]=useState(false);

  const selectEvent=(ev)=>{
    setEvent(ev);
    if(ev)sessionStorage.setItem("currentEventId",ev.id);
    else sessionStorage.removeItem("currentEventId");
  };

  // ← useEffect חייב להיות לפני כל return!
  useEffect(()=>{
    sb.auth.getSession().then(async({data})=>{
      const u=data.session?.user||null;
      setUser(u);
      if(u){
        const savedId=sessionStorage.getItem("currentEventId");
        if(savedId){
          const{data:ev}=await sb.from("events").select("*").eq("id",savedId).eq("user_id",u.id).single();
          if(ev)setEvent(ev);
        }
      }
      setChecking(false);
    });
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{
      if(!session?.user){setUser(null);setEvent(null);sessionStorage.removeItem("currentEventId");}
      else setUser(session.user);
    });
    return()=>subscription.unsubscribe();
  },[]);

  const logout=async()=>{await sb.auth.signOut();setUser(null);setEvent(null);sessionStorage.removeItem("currentEventId");setShowLanding(false);};

  const path=window.location.pathname;
  const hash=window.location.hash;

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

  const inviteMatch=path.match(/^\/invite\/([a-z0-9]+)$/i)||hash.match(/^#\/invite\/([a-z0-9]+)$/i);
  if(inviteMatch){
    return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style><InvitePage code={inviteMatch[1]}/></>);
  }

  if(checking)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><Spinner size={40}/></div>);

  // ניתוב לדף אדמין — לפני כל שאר הניתובים!
  const isAdmin=hash==="#/admin"||path==="/admin";
  if(isAdmin){
    if(!user||user.email!==ADMIN_EMAIL)return(
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0D1117",direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
        <div style={{textAlign:"center",color:"#fff"}}>
          <div style={{fontSize:48,marginBottom:16}}>🔒</div>
          <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>גישה מוגבלת</div>
          <div style={{fontSize:14,color:"#888",marginBottom:24}}>עליך להתחבר עם חשבון האדמין</div>
          <button onClick={()=>setAuthMode("login")} style={{background:"#2952C8",color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>התחבר</button>
          {authMode&&<AuthDrawer mode={authMode} onClose={()=>setAuthMode(null)} onAuth={u=>{setUser(u);setAuthMode(null);}}/>}
        </div>
      </div>
    );
    return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AdminDashboard user={user} onLogout={logout}/>
    </>);
  }

  if(!user||showLanding)return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}} @keyframes slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:none;opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}} @media(min-width:768px){.nav-link{display:block!important;}} @media(max-width:767px){.hide-mobile{display:none!important;}}`}</style>
    <LandingPage onOpenAuth={mode=>{setShowLanding(false);setAuthMode(mode);}} onLogout={user?logout:null}/>
    {authMode&&<AuthDrawer mode={authMode} onClose={()=>setAuthMode(null)} onAuth={u=>{setUser(u);setAuthMode(null);setShowLanding(false);}}/>}
  </>);

  if(!event)return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <EventPicker user={user} onSelect={selectEvent} onLogout={logout} onBackToLanding={()=>setShowLanding(true)}/>
  </>);

  return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}`}</style>
  <SeatingApp user={user} event={event} onBack={()=>selectEvent(null)} onUpdate={e=>setEvent(e)} onLogout={logout}/></>);
}
