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

// ─── LUNSOUL THEME ────────────────────────────────────────────────────────────
const LS = {
  purple:    "#6C3DD4",
  purpleM:   "#7B4AE2",
  purpleL:   "#9B72F0",
  purpleXL:  "#F0EBFF",
  purpleBg:  "#F5F0FF",
  bg:        "#F0EFFE",
  white:     "#FFFFFF",
  text:      "#1A1035",
  muted:     "#7B7B9A",
  border:    "#E5E0F5",
  success:   "#22C55E",
  danger:    "#EF4444",
  warning:   "#F59E0B",
  headerH:   52,
};

const ADMIN_PASSWORD="Rene1807";
const ADMIN_EMAIL="Amitgez331@gmail.com";

// ─── LS UI COMPONENTS ───────────────────────────────────────────────────────

function ScreenBanner({ icon, title, subtitle, extra }) {
  return (
    <div style={{
      background: "linear-gradient(135deg,#5B2DB8,#7B4AE2,#9B72F0)",
      borderRadius: 20, padding: "28px 32px", marginBottom: 24,
      position: "relative", overflow: "hidden", direction: "rtl",
      display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      {/* Decorative circles */}
      <div style={{position:"absolute",top:-40,left:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.07)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-30,left:80,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.05)",pointerEvents:"none"}}/>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.65)",marginBottom:4}}>{subtitle}</div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-1px"}}>{title}</div>
      </div>
      <div style={{
        width:60,height:60,borderRadius:18,
        background:"rgba(255,255,255,.18)",
        border:"1.5px solid rgba(255,255,255,.3)",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:28,flexShrink:0
      }}>{icon}</div>
      {extra}
    </div>
  );
}
function StatCard({ value, label, color, bg, icon }) {
  return (
    <div style={{
      background: bg, borderRadius: 16,
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 8,
      border: `1px solid ${color}22`, flex: 1, minWidth: 0
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:28,fontWeight:900,color,lineHeight:1}}>{value}</div>
        <div style={{width:40,height:40,borderRadius:12,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{icon}</div>
      </div>
      <div style={{fontSize:12,fontWeight:600,color:color+"99"}}>{label}</div>
      <div style={{height:3,borderRadius:2,background:color+"30",marginTop:2}}>
        <div style={{height:"100%",width:"100%",borderRadius:2,background:color,opacity:.4}}/>
      </div>
    </div>
  );
}
function LSBtn({ children, primary, ghost, danger, small, full, onClick, disabled, style={}, icon }) {
  const base = {
    display:"flex",alignItems:"center",justifyContent:"center",gap:6,
    borderRadius:10, fontWeight:700, cursor:disabled?"default":"pointer",
    fontFamily:"inherit", transition:"all .15s", border:"none",
    opacity:disabled?.5:1,
    padding: small?"7px 14px":"11px 22px",
    fontSize: small?12:14,
    width: full?"100%":"auto",
  };
  const variant = primary
    ? {background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",color:"#fff",boxShadow:"0 4px 14px rgba(107,61,212,.4)"}
    : danger
    ? {background:"#FEF2F2",color:"#EF4444",border:"1.5px solid #FECACA"}
    : ghost
    ? {background:"transparent",color:LS.purple,border:`1.5px solid ${LS.border}`}
    : {background:LS.white,color:LS.text,border:`1.5px solid ${LS.border}`};
  return (
    <button onClick={onClick} disabled={disabled} style={{...base,...variant,...style}}
      onMouseEnter={e=>{if(!disabled&&primary)e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
      {icon&&<span>{icon}</span>}{children}
    </button>
  );
}
function LSNavItem({ item, active, onClick, locked }) {
  return (
    <div onClick={onClick}
      style={{
        display:"flex",alignItems:"center",gap:10,
        padding:"10px 16px",cursor:"pointer",
        borderRadius:10,margin:"2px 8px",
        background: active ? "linear-gradient(135deg,#5B2DB822,#7B4AE222)" : "transparent",
        color: active ? LS.purple : LS.muted,
        fontWeight: active ? 700 : 500,
        fontSize:14, transition:"all .15s",
        border: active ? `1px solid ${LS.purple}33` : "1px solid transparent",
      }}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background=LS.purpleXL;e.currentTarget.style.color=LS.purple;}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=LS.muted;}}}>
      <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
      <span style={{flex:1}}>{item.label}</span>
      {locked && <span style={{fontSize:10,background:"#FEF3C7",color:"#D97706",borderRadius:100,padding:"1px 6px",fontWeight:700}}>🔒</span>}
      {active && <span style={{width:6,height:6,borderRadius:"50%",background:LS.purple,flexShrink:0}}/>}
    </div>
  );
}
function LSInput({ value, onChange, placeholder, type="text", onKeyDown, label, style={} }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,...style}}>
      {label&&<div style={{fontSize:11,fontWeight:700,color:LS.muted,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
        style={{background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"11px 14px",fontSize:14,color:LS.text,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",transition:"border-color .2s"}}
        onFocus={e=>e.target.style.borderColor=LS.purple}
        onBlur={e=>e.target.style.borderColor=LS.border}/>
    </div>
  );
}


const TABLE_TYPES = {
  round:  { label:"עגול",         icon:"⭕", defaultSeats:8  },
  rect:   { label:"מרובע",        icon:"⬛", defaultSeats:10 },
  knight: { label:"שולחן אבירים", icon:"👑", defaultSeats:20 },
};

const RELATION_COLORS = {
  "משפחה קרובה":   "#E53E3E",
  "משפחה מורחבת":  "#DD6B20",
  "חברים קרובים":  "#38A169",
  "חברים רחוקים":  "#3182CE",
  "חברים של ההורים":"#805AD5",
  "ללא שיוך":      "#A0AEC0",
};

const pct    = t => t.seats ? Math.round((t.guests||[]).length/t.seats*100) : 0;
const sColor = t => { const g=(t.guests||[]).length; return g>=t.seats?C.danger:g>=t.seats*.8?C.gold:C.success; };
const isMobile = () => window.innerWidth < 1024;

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
  const guests=table.guests||[];
  const occupied=guests.length;
  const total=table.seats||10;
  const pctFull=total>0?occupied/total:0;
  const dp={onDragOver:e=>{e.preventDefault();e.stopPropagation();},onDrop:e=>{e.preventDefault();e.stopPropagation();onDrop(e);}};

  if(table.type==="knight"){
    const W=180,H=60;
    return(
      <div onMouseDown={onMouseDown} {...dp} style={{position:"absolute",left:table.x,top:table.y,width:W,height:H,cursor:"grab",userSelect:"none",zIndex:selected?10:1,filter:selected?"drop-shadow(0 4px 18px #00BCD488)":"drop-shadow(0 2px 8px #0002)"}}>
        <svg width={W} height={H}>
          <rect x={1} y={1} width={W-2} height={H-2} rx={12} fill="#00BCD4" stroke={selected?"#fff":"#00ACC1"} strokeWidth={selected?2.5:1.5}/>
          <rect x={4} y={4} width={W-8} height={H-8} rx={9} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="4 3"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none"}}>
          <span style={{fontSize:12,fontWeight:900,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>{table.name}</span>
          <span style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:700}}>{occupied}/{total}</span>
        </div>
      </div>
    );
  }

  if(table.type==="rect"){
    const W=110,H=80;
    const seatR=6;
    const S_W=W+seatR*4+4, S_H=H+seatR*4+4;
    const ox=(S_W-W)/2, oy=(S_H-H)/2;

    // כיסאות על 4 צדדים
    const topSeats=Math.ceil(total/4);
    const bottomSeats=Math.ceil(total/4);
    const leftSeats=Math.floor(total/4);
    const rightSeats=total-topSeats-bottomSeats-leftSeats;
    let seatIdx=0;
    const seatNodes=[];

    // למעלה
    for(let i=0;i<topSeats;i++){
      const x=ox+W/(topSeats+1)*(i+1);
      const y=oy-seatR-3;
      const taken=seatIdx<occupied;
      seatNodes.push(<g key={`t${i}`}>
        <circle cx={x} cy={y+1} r={seatR} fill="rgba(0,0,0,0.12)"/>
        <circle cx={x} cy={y} r={seatR} fill={taken?"#1565C0":"#B0BEC5"} stroke={taken?"#0D47A1":"#90A4AE"} strokeWidth={1}/>
        <circle cx={x} cy={y} r={2.5} fill={taken?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.35)"}/>
      </g>);
      seatIdx++;
    }
    // למטה
    for(let i=0;i<bottomSeats;i++){
      const x=ox+W/(bottomSeats+1)*(i+1);
      const y=oy+H+seatR+3;
      const taken=seatIdx<occupied;
      seatNodes.push(<g key={`b${i}`}>
        <circle cx={x} cy={y+1} r={seatR} fill="rgba(0,0,0,0.12)"/>
        <circle cx={x} cy={y} r={seatR} fill={taken?"#1565C0":"#B0BEC5"} stroke={taken?"#0D47A1":"#90A4AE"} strokeWidth={1}/>
        <circle cx={x} cy={y} r={2.5} fill={taken?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.35)"}/>
      </g>);
      seatIdx++;
    }
    // שמאל
    for(let i=0;i<leftSeats;i++){
      const x=ox-seatR-3;
      const y=oy+H/(leftSeats+1)*(i+1);
      const taken=seatIdx<occupied;
      seatNodes.push(<g key={`l${i}`}>
        <circle cx={x+1} cy={y+1} r={seatR} fill="rgba(0,0,0,0.12)"/>
        <circle cx={x} cy={y} r={seatR} fill={taken?"#1565C0":"#B0BEC5"} stroke={taken?"#0D47A1":"#90A4AE"} strokeWidth={1}/>
        <circle cx={x} cy={y} r={2.5} fill={taken?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.35)"}/>
      </g>);
      seatIdx++;
    }
    // ימין
    for(let i=0;i<rightSeats;i++){
      const x=ox+W+seatR+3;
      const y=oy+H/(rightSeats+1)*(i+1);
      const taken=seatIdx<occupied;
      seatNodes.push(<g key={`r${i}`}>
        <circle cx={x+1} cy={y+1} r={seatR} fill="rgba(0,0,0,0.12)"/>
        <circle cx={x} cy={y} r={seatR} fill={taken?"#1565C0":"#B0BEC5"} stroke={taken?"#0D47A1":"#90A4AE"} strokeWidth={1}/>
        <circle cx={x} cy={y} r={2.5} fill={taken?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.35)"}/>
      </g>);
      seatIdx++;
    }

    return(
      <div onMouseDown={onMouseDown} {...dp}
        style={{position:"absolute",left:table.x-ox,top:table.y-oy,width:S_W,height:S_H,
          cursor:"grab",userSelect:"none",zIndex:selected?10:1,
          filter:selected?"drop-shadow(0 4px 18px #00BCD488)":"drop-shadow(0 2px 8px #0002)"}}>
        <svg width={S_W} height={S_H}>
          {seatNodes}
          {/* צל שולחן */}
          <rect x={ox+2} y={oy+3} width={W} height={H} rx={12} fill="rgba(0,0,0,0.15)"/>
          {/* שולחן */}
          <rect x={ox} y={oy} width={W} height={H} rx={12} fill={selected?"#0288D1":"#00BCD4"} stroke={selected?"#fff":"#00ACC1"} strokeWidth={selected?2.5:1.5}/>
          {/* טבעת דקורטיבית */}
          <rect x={ox+5} y={oy+5} width={W-10} height={H-10} rx={8} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="5 3"/>
        </svg>
        <div style={{position:"absolute",left:ox,top:oy,width:W,height:H,
          display:"flex",alignItems:"center",justifyContent:"center",
          flexDirection:"column",pointerEvents:"none",gap:1}}>
          <span style={{fontSize:13,fontWeight:900,color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.3)",
            textAlign:"center",maxWidth:W-16,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
            {table.name?.match(/\d+/)?.[0]||table.name}
          </span>
          <span style={{fontSize:10,color:"rgba(255,255,255,0.9)",fontWeight:700}}>{occupied}/{total}</span>
          {table.name?.replace(/^\d+\s*/,"").trim()&&(
            <span style={{fontSize:8,color:"rgba(255,255,255,0.8)",fontWeight:600,
              textAlign:"center",maxWidth:W-16,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
              {table.name?.replace(/^\d+\s*/,"").trim()}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ─── עגול  -  סגנון עיטורים ─────────────────────────────────────────────────
  const R=52;           // רדיוס עיגול ראשי  -  גדול כמו ריבועי
  const seatR=6;        // רדיוס כיסא
  const seatDist=R+13;  // מרחק כיסאות מהמרכז
  const S=R*2+seatDist+seatR*2+8; // גודל כולל
  const cx=S/2, cy=S/2;

  const tableNum=table.name?.match(/\d+/)?.[0]||"";
  const tableName=table.name?.replace(/^\d+\s*/,"").trim()||"";

  // עיטורי שיניים
  const decoCount=20;
  const decos=Array.from({length:decoCount},(_,i)=>{
    const a=(i/decoCount)*Math.PI*2;
    const dr=R+5;
    return <circle key={i} cx={cx+dr*Math.cos(a)} cy={cy+dr*Math.sin(a)} r={2.5}
      fill={selected?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.4)"}/>;
  });

  // כיסאות  -  בדיוק לפי מספר המושבים, כחול=תפוס, אפור=פנוי
  const seats=Array.from({length:total},(_,i)=>{
    const a=(i/total)*Math.PI*2-Math.PI/2;
    const sx=cx+seatDist*Math.cos(a);
    const sy=cy+seatDist*Math.sin(a);
    const isTaken=i<occupied;
    return(
      <g key={i}>
        {/* צל כיסא */}
        <circle cx={sx+1} cy={sy+1} r={seatR} fill="rgba(0,0,0,0.15)"/>
        {/* כיסא */}
        <circle cx={sx} cy={sy} r={seatR}
          fill={isTaken?"#1565C0":"#B0BEC5"}
          stroke={isTaken?"#0D47A1":"#90A4AE"}
          strokeWidth={1.2}/>
        {/* נקודה מרכזית בכיסא */}
        <circle cx={sx} cy={sy} r={2.5}
          fill={isTaken?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.4)"}/>
      </g>
    );
  });

  return(
    <div onMouseDown={onMouseDown} {...dp}
      style={{position:"absolute",left:table.x,top:table.y,width:S,height:S,
        cursor:"grab",userSelect:"none",zIndex:selected?10:1,
        filter:selected?"drop-shadow(0 6px 22px rgba(0,188,212,0.65))":"drop-shadow(0 3px 12px rgba(0,0,0,0.18))"}}>
      <svg width={S} height={S}>
        {/* כיסאות  -  מאחורה */}
        {seats}
        {/* צל שולחן */}
        <circle cx={cx+2} cy={cy+3} r={R+1} fill="rgba(0,0,0,0.15)"/>
        {/* עיגול חיצוני קצה */}
        <circle cx={cx} cy={cy} r={R+2} fill={selected?"#0097A7":"#00ACC1"}/>
        {/* עיטורים */}
        {decos}
        {/* עיגול ראשי */}
        <circle cx={cx} cy={cy} r={R} fill={selected?"#0288D1":"#00BCD4"}/>
        {/* טבעת דקורטיבית פנימית */}
        <circle cx={cx} cy={cy} r={R-7} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="6 4"/>
        {/* מילוי פנימי עדין */}
        <circle cx={cx} cy={cy} r={R-14} fill="rgba(255,255,255,0.07)"/>
      </svg>

      {/* טקסט מרכזי */}
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
        justifyContent:"center",flexDirection:"column",pointerEvents:"none",gap:1}}>
        {tableNum&&(
          <span style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1,
            textShadow:"0 1px 4px rgba(0,0,0,0.35)"}}>{tableNum}</span>
        )}
        <span style={{fontSize:10,fontWeight:700,lineHeight:1.2,
          color:pctFull>=1?"#FF5252":pctFull>0.8?"#FFE082":"rgba(255,255,255,0.95)",
          textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
          {occupied} / {total}
        </span>
        {tableName&&(
          <span style={{fontSize:9,fontWeight:800,color:"#fff",
            textAlign:"center",maxWidth:R*1.5,overflow:"hidden",
            display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",
            textShadow:"0 1px 3px rgba(0,0,0,0.5)",marginTop:1,lineHeight:1.3}}>
            {tableName}
          </span>
        )}
      </div>
    </div>
  );
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




function GuestModal({ guest, eventId, onSave, onClose, existingGuests=[], desktop=false }) {
  const isEdit=!!guest;
  const [name,setName]=useState(guest?.name||"");
  const [phone,setPhone]=useState(guest?.phone||"");
  const [rsvp,setRsvp]=useState(guest?.rsvp||"pending");
  const [guestCount,setGuestCount]=useState(guest?.guest_count||1);
  const [relation,setRelation]=useState(guest?.relation||"");
  const [note,setNote]=useState(guest?.note||"");
  const [gift,setGift]=useState(guest?.gift||"");
  const [customRelations,setCustomRelations]=useState([]);
  const [addingCat,setAddingCat]=useState(false);
  const [newCat,setNewCat]=useState("");
  const [newCatColor,setNewCatColor]=useState("#6C3DD4");
  const allRelations=[...Object.keys(RELATION_COLORS),...customRelations];
  const COLORS=["#E53E3E","#DD6B20","#38A169","#3182CE","#805AD5","#D69E2E","#6C3DD4","#0891B2"];

  const handleSave=()=>{
    if(!name.trim())return;
    onSave({name:name.trim(),phone:phone.trim()||null,rsvp,guest_count:guestCount,relation,note,gift:Number(gift)||0});
  };

  const rsvpOptions=[["pending","⏳","ממתין","#F59E0B","#FFFBEB"],["confirmed","✅","מגיע","#22C55E","#ECFDF5"],["declined","❌","לא מגיע","#EF4444","#FEF2F2"]];

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(26,16,53,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:desktop?"center":"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:"#fff",borderRadius:desktop?"20px":"20px 20px 0 0",padding:desktop?"28px":"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(107,61,212,.2)"}}>
        <div style={{width:40,height:4,borderRadius:2,background:LS.border,margin:"0 auto 20px"}}/>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👤</div>
          <div>
            <div style={{fontWeight:900,fontSize:17,color:LS.text}}>{isEdit?"עריכת אורח":"הוספת אורח"}</div>
            <div style={{fontSize:12,color:LS.muted}}>מלא את פרטי האורח</div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
          <LSInput label="שם האורח *" value={name} onChange={setName} placeholder="ישראל ישראלי"/>
          <LSInput label="טלפון" type="tel" value={phone} onChange={setPhone} placeholder="050-0000000"/>

          {/* Guest count */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>מספר מגיעים</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setGuestCount(g=>Math.max(1,g-1))} style={{width:36,height:36,borderRadius:10,background:LS.purpleXL,border:`1.5px solid ${LS.border}`,fontSize:18,cursor:"pointer",fontFamily:"inherit",color:LS.purple,fontWeight:900}}>−</button>
              <span style={{fontSize:22,fontWeight:900,color:LS.text,minWidth:32,textAlign:"center"}}>{guestCount}</span>
              <button onClick={()=>setGuestCount(g=>g+1)} style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",border:"none",fontSize:18,cursor:"pointer",fontFamily:"inherit",color:"#fff",fontWeight:900}}>+</button>
            </div>
          </div>

          {/* RSVP */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>סטטוס אישור</div>
            <div style={{display:"flex",gap:8}}>
              {rsvpOptions.map(([v,icon,l,c,bg])=>(
                <button key={v} onClick={()=>setRsvp(v)}
                  style={{flex:1,background:rsvp===v?bg:"#fff",border:`2px solid ${rsvp===v?c:LS.border}`,borderRadius:10,padding:"8px 4px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:rsvp===v?c:LS.muted,transition:"all .15s"}}>
                  {icon}<br/>{l}
                </button>
              ))}
            </div>
          </div>

          {/* Gift */}
          <LSInput label="מתנה (₪)" type="number" value={String(gift)} onChange={setGift} placeholder="0"/>
        </div>

        {/* Relation */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,textTransform:"uppercase",letterSpacing:".05em"}}>קטגוריית קרבה</div>
            <button onClick={()=>setAddingCat(a=>!a)} style={{background:LS.purpleXL,border:`1px solid ${LS.border}`,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:LS.purple,cursor:"pointer",fontFamily:"inherit"}}>
              {addingCat?"✕ ביטול":"+ קטגוריה"}
            </button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {allRelations.map(r=>(
              <button key={r} onClick={()=>setRelation(r===relation?"":r)}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:100,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`1.5px solid ${relation===r?RELATION_COLORS[r]||LS.purple:LS.border}`,background:relation===r?RELATION_COLORS[r]||LS.purple:"#fff",color:relation===r?"#fff":LS.muted,transition:"all .15s"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:relation===r?"rgba(255,255,255,.7)":RELATION_COLORS[r]||LS.purple,flexShrink:0}}/>
                {r}
              </button>
            ))}
          </div>
          {addingCat&&(
            <div style={{marginTop:10,background:LS.purpleXL,borderRadius:12,padding:12}}>
              <LSInput value={newCat} onChange={setNewCat} placeholder="שם קטגוריה חדשה" style={{marginBottom:8}}/>
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                {COLORS.map(col=>(
                  <div key={col} onClick={()=>setNewCatColor(col)}
                    style={{width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:`3px solid ${newCatColor===col?"#1A1035":"transparent"}`,transition:"border .15s"}}/>
                ))}
              </div>
              <LSBtn primary full small onClick={()=>{if(!newCat.trim())return;setCustomRelations(r=>[...r,newCat.trim()]);RELATION_COLORS[newCat.trim()]=newCatColor;setRelation(newCat.trim());setNewCat("");setAddingCat(false);}}>
                ✓ הוסף קטגוריה
              </LSBtn>
            </div>
          )}
        </div>

        {/* Note */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>הערה</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="הערה על האורח..."
            style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:LS.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",resize:"vertical",minHeight:72,transition:"border-color .2s"}}
            onFocus={e=>e.target.style.borderColor=LS.purple} onBlur={e=>e.target.style.borderColor=LS.border}/>
        </div>

        <LSBtn primary full onClick={handleSave} disabled={!name.trim()} style={{fontSize:15}}>
          {isEdit?"שמור שינויים ✓":"הוסף אורח ✓"}
        </LSBtn>
      </div>
    </div>
  );
}


function ReceiptModal({ tables, onClose }) {
  const [q,setQ]=useState("");
  const [res,setRes]=useState(null);
  const [nf,setNf]=useState(false);

  const search=v=>{
    setQ(v);setRes(null);setNf(false);
    if(!v.trim())return;
    for(let i=0;i<tables.length;i++){
      const t=tables[i];
      const g=(t.guests||[]).find(g=>g.name.toLowerCase().includes(v.toLowerCase()));
      if(g){setRes({guest:g,table:t,num:i+1});return;}
    }
    setNf(true);
  };

  const print=()=>{
    if(!res)return;
    const w=window.open("","_blank","width=320,height=420");
    w.document.write(`<html><head><style>body{font-family:monospace;width:280px;margin:0 auto;padding:16px;direction:rtl}.logo{text-align:center;font-size:18px;font-weight:900;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:14px}.name{font-size:26px;font-weight:900;margin-bottom:14px}.box{border:3px solid #000;border-radius:8px;padding:12px;text-align:center;margin-bottom:14px}.num{font-size:56px;font-weight:900;line-height:1}.footer{text-align:center;font-size:11px;border-top:1px dashed #000;padding-top:10px;color:#888}</style></head><body><div class="logo">Sidor-IL</div><div style="font-size:12px;color:#666">שם האורח</div><div class="name">${res.guest.name}</div><div class="box"><div style="font-size:13px;color:#444">שולחן מספר</div><div class="num">${res.num}</div><div style="font-size:16px;font-weight:700">${res.table.name}</div></div><div class="footer">ברוך הבא! sidor-il.co.il</div></body></html>`);
    w.document.close();setTimeout(()=>{w.focus();w.print();},400);
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(26,16,53,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480,direction:"rtl",boxShadow:"0 -8px 40px rgba(107,61,212,.2)"}}>
        <div style={{width:40,height:4,borderRadius:2,background:LS.border,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🔍</div>
          <div>
            <div style={{fontWeight:900,fontSize:17,color:LS.text}}>חיפוש אורח</div>
            <div style={{fontSize:12,color:LS.muted}}>הדפסת פתק שולחן</div>
          </div>
          <LSBtn ghost small onClick={onClose} style={{marginRight:"auto"}}>✕ סגור</LSBtn>
        </div>

        <LSInput value={q} onChange={search} placeholder="הקלד שם אורח..." style={{marginBottom:14}}/>

        {res&&(
          <div style={{background:LS.purpleXL,border:`2px solid ${LS.purple}44`,borderRadius:16,overflow:"hidden",marginBottom:12}}>
            <div style={{background:"#fff",margin:12,borderRadius:12,border:`1px dashed ${LS.border}`,padding:"16px",textAlign:"center",fontFamily:"monospace"}}>
              <div style={{fontSize:11,fontWeight:900,letterSpacing:2,color:LS.purple,marginBottom:6}}>Sidor-IL</div>
              <div style={{fontSize:12,color:LS.muted}}>שם האורח</div>
              <div style={{fontSize:22,fontWeight:900,color:LS.text,marginBottom:10}}>{res.guest.name}</div>
              <div style={{border:`3px solid ${LS.purple}`,borderRadius:10,padding:"10px",marginBottom:8}}>
                <div style={{fontSize:12,color:LS.muted}}>שולחן מספר</div>
                <div style={{fontSize:48,fontWeight:900,lineHeight:1,color:LS.purple}}>{res.num}</div>
                <div style={{fontSize:15,fontWeight:700,color:LS.text}}>{res.table.name}</div>
              </div>
              <div style={{fontSize:11,color:LS.muted}}>ברוך הבא! 🎉</div>
            </div>
            <div style={{padding:"0 12px 12px",display:"flex",gap:8}}>
              <LSBtn ghost full small onClick={()=>{setRes(null);setQ("");}}>← חזרה</LSBtn>
              <LSBtn primary full small onClick={print} style={{flex:2}}>🖨️ הדפס פתק</LSBtn>
            </div>
          </div>
        )}
        {nf&&<div style={{background:"#FEF2F2",border:"1px solid #FECDCD",borderRadius:12,padding:"12px",textAlign:"center",color:"#DC2626",fontSize:14,marginBottom:12}}>לא נמצא "{q}"</div>}
        {!q&&<div style={{textAlign:"center",color:LS.muted,fontSize:14,padding:"20px 0"}}>🔍 הקלד שם לחיפוש</div>}
      </div>
    </div>
  );
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
      style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:active?"#1B3A8C":"#F7FAFC",color:active?"#fff":"#1A202C",border:`2px solid ${active?"#1B3A8C":"#E2E8F0"}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600,textAlign:"right",transition:"all .15s"}}>
      <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {active&&<span style={{fontSize:11,background:"rgba(255,255,255,.25)",borderRadius:4,padding:"2px 6px"}}>פעיל</span>}
    </button>
  );

  return(
    <>
      {/* כפתור צף */}
      <button onClick={()=>setOpen(o=>!o)} aria-label="תפריט נגישות"
        style={{position:"fixed",bottom:24,left:24,zIndex:9999,width:52,height:52,borderRadius:"50%",background:"#1B3A8C",color:"#fff",border:"3px solid #fff",boxShadow:"0 4px 20px rgba(27,58,140,.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
        ♿
      </button>

      {/* פאנל */}
      {open&&(
        <div style={{position:"fixed",bottom:86,left:24,zIndex:9998,background:"#fff",borderRadius:18,boxShadow:"0 8px 40px rgba(0,0,0,.18)",width:280,direction:"rtl",overflow:"hidden",border:"2px solid #E2E8F0"}}>
          {/* כותרת */}
          <div style={{background:"#1B3A8C",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
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

// ─── LANDING PAGE V2 ──────────────────────────────────────────────────────────
// החלף את function LandingPage הקיים ב-App.jsx
// - ללא סקשן אירועים, ללא סטטיסטיקות
// - פלאפון מתחלף עם אנימציה
// - אנימציות מטורפות

function LandingPage({ onOpenAuth, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [venuePage, setVenuePage] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [phoneSlide, setPhoneSlide] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  const phoneScreens = [
    {
      title: "הזמנה דיגיטלית",
      bg: `linear-gradient(160deg,${C.blue},${C.blueM})`,
      content: (
        <div style={{flex:1,background:"#fff",borderRadius:"14px 14px 0 0",marginTop:-12,padding:"14px 12px",direction:"rtl"}}>
          <div style={{textAlign:"center",marginBottom:10}}>
            <div style={{fontSize:10,color:"#888",fontWeight:600}}>הזמנה אישית לך 💌</div>
            <div style={{fontSize:17,fontWeight:900,color:"#111",marginTop:3}}>עמית & אורנה</div>
            <div style={{fontSize:10,color:C.blue,fontWeight:700,marginTop:2}}>30 באפריל 2026 · 19:30</div>
            <div style={{fontSize:10,color:"#888",marginTop:1}}>📍 אולמי הגן הקסום</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
            <div style={{background:"#2D9B5A",borderRadius:8,padding:"8px 4px",fontSize:10,fontWeight:800,color:"#fff",textAlign:"center"}}>✓ אני מגיע</div>
            <div style={{background:"#fff",border:"2px solid #D63B3B",borderRadius:8,padding:"8px 4px",fontSize:10,fontWeight:800,color:"#D63B3B",textAlign:"center"}}>✗ לא מגיע</div>
          </div>
          <div style={{background:C.blueXL,borderRadius:8,padding:"8px",textAlign:"center",fontSize:9,color:C.muted}}>📅 הוסף ליומן · 🚗 נווט</div>
        </div>
      )
    },
    {
      title: "ניהול אורחים",
      bg: `linear-gradient(160deg,#1B8C5A,#2DB86A)`,
      content: (
        <div style={{flex:1,background:"#fff",borderRadius:"14px 14px 0 0",marginTop:-12,padding:"12px 10px",direction:"rtl",overflowY:"auto"}}>
          <div style={{fontSize:11,fontWeight:800,color:"#111",marginBottom:8}}>רשימת אורחים</div>
          {[["דוד כהן","✅ מגיע","משפחה","#2D9B5A"],["שרה לוי","⏳ ממתין","חברים","#F0A500"],["יוסי מור","✅ מגיע","עבודה","#2D9B5A"],["רחל ב.","❌ לא מגיע","משפחה","#D63B3B"]].map(([n,s,r,c])=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid #f0f0f0"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.blueM},${C.blueL})`,color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{n[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:700,color:"#111"}}>{n}</div>
                <div style={{fontSize:9,color:c,fontWeight:600}}>{s}</div>
              </div>
              <div style={{fontSize:9,background:"#f0f0f0",borderRadius:100,padding:"2px 6px",color:"#666"}}>{r}</div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "סידורי הושבה",
      bg: `linear-gradient(160deg,#7B3FD4,#9B59D4)`,
      content: (
        <div style={{flex:1,background:"#fafafa",borderRadius:"14px 14px 0 0",marginTop:-12,padding:"10px 8px",direction:"rtl"}}>
          <div style={{fontSize:10,fontWeight:800,color:"#111",marginBottom:6,textAlign:"center"}}>מפת האולם</div>
          <svg width="100%" height="140" viewBox="0 0 200 140">
            <rect width="200" height="140" fill="#f5f5f5" rx="8"/>
            <rect x="75" y="2" width="50" height="20" fill="#7B3FD4" rx="4"/>
            <text x="100" y="15" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">במה</text>
            {[[30,45,8],[80,50,8],[130,45,8],[55,85,8],[105,90,8],[155,80,8]].map(([x,y,r],i)=>(
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill={i<4?"#4A7AFF":"#B0BEC5"} stroke="white" strokeWidth="1.5"/>
                <text x={x} y={y+3} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">{i+1}</text>
              </g>
            ))}
            <rect x="75" y="122" width="50" height="14" fill="#2C3E50" rx="3"/>
            <text x="100" y="131" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">כניסה</text>
          </svg>
          <div style={{display:"flex",gap:6,marginTop:4}}>
            <div style={{flex:1,background:"#4A7AFF22",borderRadius:6,padding:"4px",textAlign:"center",fontSize:8,color:C.blue,fontWeight:700}}>4 שובצו</div>
            <div style={{flex:1,background:"#CBD5E022",borderRadius:6,padding:"4px",textAlign:"center",fontSize:8,color:"#888",fontWeight:700}}>2 פנויים</div>
          </div>
        </div>
      )
    },
    {
      title: "WhatsApp אוטומטי",
      bg: `linear-gradient(160deg,#128C7E,#25D366)`,
      content: (
        <div style={{flex:1,background:"#ECE5DD",borderRadius:"14px 14px 0 0",marginTop:-12,padding:"12px 10px",direction:"rtl"}}>
          <div style={{fontSize:10,fontWeight:800,color:"#111",marginBottom:6,textAlign:"center"}}>💬 WhatsApp</div>
          {[
            {from:false,msg:"שלום דוד! 👋 מוזמן לחתונה של עמית & אורנה 💍\n📅 30.4.26 · 19:30\nאשר הגעתך בקישור ⬇️",t:"09:41"},
            {from:true,msg:"✅ אני מגיע! תודה",t:"09:45"},
            {from:false,msg:"🎉 מעולה! שולחן שלך: מספר 4\n📍 קרוב לבמה\nנתראה!",t:"09:46"},
          ].map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.from?"flex-start":"flex-end",marginBottom:6}}>
              <div style={{maxWidth:"80%",background:m.from?"#fff":"#DCF8C6",borderRadius:m.from?"12px 12px 12px 0":"12px 12px 0 12px",padding:"6px 8px",boxShadow:"0 1px 2px rgba(0,0,0,.12)"}}>
                <div style={{fontSize:9,color:"#111",lineHeight:1.4,whiteSpace:"pre-line"}}>{m.msg}</div>
                <div style={{fontSize:8,color:"#888",marginTop:2,textAlign:"right"}}>{m.t}</div>
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(e => {
      e.forEach(x => { if (x.isIntersecting) { x.target.style.opacity = 1; x.target.style.transform = "none"; obs.unobserve(x.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => document.querySelectorAll(".fu").forEach(el => obs.observe(el)), 100);
    return () => obs.disconnect();
  }, []);

  // Phone auto-rotate
  useEffect(() => {
    const id = setInterval(() => setPhoneSlide(s => (s + 1) % phoneScreens.length), 3500);
    return () => clearInterval(id);
  }, []);

  // Feature auto-rotate
  useEffect(() => {
    const id = setInterval(() => setActiveFeature(f => (f + 1) % 6), 2800);
    return () => clearInterval(id);
  }, []);

  if (venuePage) return <VenuePage onBack={() => setVenuePage(false)} onOpenAuth={onOpenAuth} />;

  const features = [
    { icon: "🪑", title: "סידורי הושבה", desc: "מפה אינטראקטיבית עם גרירה ושחרור", color: C.blue },
    { icon: "💬", title: "WhatsApp אוטומטי", desc: "6 סבבי הודעות לכל אורח", color: "#25D366" },
    { icon: "✅", title: "אישורי הגעה", desc: "קישור אישי לכל אורח", color: C.success },
    { icon: "🤖", title: "AI חכם", desc: "סידור אוטומטי תוך שניות", color: "#7B3FD4" },
    { icon: "📊", title: "ייבוא Excel", desc: "ייבוא מהיר מקובץ", color: "#276749" },
    { icon: "🖨️", title: "פתק הושבה", desc: "חפש שם, קבל שולחן מיידית", color: C.blueM },
  ];

  const hd = (n) => ({
    opacity: heroVisible ? 1 : 0,
    transform: heroVisible ? "none" : "translateY(32px)",
    transition: `opacity 0.9s ${n * 0.13}s ease, transform 0.9s ${n * 0.13}s cubic-bezier(0.16,1,0.3,1)`,
  });

  const currentScreen = phoneScreens[phoneSlide];

  return (
    <div dir="rtl" style={{ fontFamily: "'Heebo',sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes floatR{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(6deg)}}
        @keyframes orb{0%,100%{transform:scale(1) translate(0,0)}33%{transform:scale(1.12) translate(-18px,12px)}66%{transform:scale(0.93) translate(14px,-10px)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:.2}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
        @keyframes slideInRight{from{transform:translateX(50px);opacity:0}to{transform:none;opacity:1}}
        @keyframes phoneFadeIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:.35}100%{transform:scale(1.7);opacity:0}}
        @keyframes gradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .confetti-piece{position:absolute;top:-20px;border-radius:2px;animation:confettiFall linear infinite;pointer-events:none}
        @media(min-width:768px){.nav-link{display:block!important}}
        @media(max-width:900px){.hero-layout{flex-direction:column!important;align-items:center!important;text-align:center!important}.hero-btns{justify-content:center!important}.hero-steps{justify-content:center!important}}
        .nav-btn-primary:hover{transform:translateY(-2px)!important;box-shadow:0 10px 30px rgba(27,58,140,.45)!important}
        .cta-main:hover{transform:translateY(-3px)!important;box-shadow:0 18px 44px rgba(27,58,140,.5)!important}
        .feature-chip:hover{transform:translateY(-3px) scale(1.03)!important;box-shadow:0 8px 24px rgba(0,0,0,.1)!important}
        .faq-item:hover{background:${C.blueXL}!important}
      `}</style>

      {/* ── MARQUEE BANNER ── */}
      <div style={{ background: `linear-gradient(90deg,${C.blue},${C.blueM},${C.blueL},${C.blue})`, backgroundSize: "300% 100%", animation: "gradientMove 5s ease infinite", height: 36, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", animation: "marquee 18s linear infinite", whiteSpace: "nowrap" }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} style={{ color: "rgba(255,255,255,.9)", fontSize: 12, fontWeight: 700, paddingLeft: 60 }}>
              ✨ ניהול אירועים חכם &nbsp;&nbsp;·&nbsp;&nbsp; 💬 WhatsApp אוטומטי &nbsp;&nbsp;·&nbsp;&nbsp; 🪑 סידורי הושבה &nbsp;&nbsp;·&nbsp;&nbsp; 🤖 AI חכם &nbsp;&nbsp;·&nbsp;&nbsp; 📊 ייבוא Excel
            </span>
          ))}
        </div>
      </div>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 36, right: 0, left: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,.97)" : "rgba(255,255,255,.92)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? C.border : "rgba(214,224,255,.4)"}`,
        height: 62, display: "flex", alignItems: "center", padding: "0 5vw",
        flexDirection: "row-reverse",
        boxShadow: scrolled ? "0 4px 28px rgba(26,63,163,.09)" : "none",
        transition: "all .35s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: `conic-gradient(${C.blueL},${C.blue},${C.blueL})`, opacity: 0.3, animation: "spin 6s linear infinite" }} />
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ position: "relative" }}>
              <circle cx="18" cy="18" r="17" fill={`url(#navGrad)`} />
              <defs><radialGradient id="navGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#4A7AFF" /><stop offset="100%" stopColor="#1B3A8C" /></radialGradient></defs>
              <circle cx="18" cy="18" r="9" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
              {[0, 60, 120, 180, 240, 300].map((deg, i) => { const rad = deg * Math.PI / 180; return <circle key={i} cx={18 + 13 * Math.cos(rad)} cy={18 + 13 * Math.sin(rad)} r="2.8" fill="rgba(255,255,255,.85)" />; })}
            </svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: 19, color: C.blue, letterSpacing: "-.02em" }}>Sidor-IL</span>
        </div>
        <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center", flexDirection: "row-reverse", justifyContent: "flex-end" }}>
          {[["#", "ראשי"], ["#features", "פיצ'רים"], ["#pricing", "מחירים"], ["#contact", "צור קשר"]].map(([h, l]) => (
            <a key={h} href={h} className="nav-link"
              style={{ color: C.text, textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "6px 12px", borderRadius: 8, display: "none", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.blueXL; e.currentTarget.style.color = C.blue; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.text; }}>{l}</a>
          ))}
          <button onClick={() => onOpenAuth("login")} style={{ background: "transparent", color: C.blue, border: `2px solid ${C.blue}`, borderRadius: 8, padding: "7px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, transition: "all .2s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.blueXL}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            כניסה
          </button>
          <button onClick={() => onOpenAuth("register")} className="nav-btn-primary"
            style={{ background: `linear-gradient(135deg,${C.blue},${C.blueL})`, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, boxShadow: `0 4px 14px ${C.blueL}44`, transition: "all .25s" }}>
            הרשמה חינם
          </button>
          <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, width: 38, height: 38, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0, padding: 0 }}>
            {[0, 1, 2].map(i => <span key={i} style={{ width: 16, height: 2, background: C.blue, borderRadius: 1, display: "block" }} />)}
          </button>
        </div>
      </nav>

      {menuOpen && <HamburgerMenu onOpenAuth={onOpenAuth} onClose={() => setMenuOpen(false)} onVenuePage={() => setVenuePage(true)} onLogout={onLogout} />}

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px 8vw 60px", position: "relative", overflow: "hidden" }}>
        {/* Background photo */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1400)", backgroundSize: "cover", backgroundPosition: "center", filter: "blur(1.5px) brightness(.9)", transform: "scale(1.03)", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(240,244,255,.84)", zIndex: 1 }} />

        {/* Gradient orbs */}
        <div style={{ position: "absolute", top: "5%", right: "2%", width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle,${C.blueL}28,transparent 70%)`, animation: "orb 8s ease-in-out infinite", zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle,${C.blue}1a,transparent 70%)`, animation: "orb 10s ease-in-out infinite reverse", zIndex: 1, pointerEvents: "none" }} />

        {/* Confetti */}
        {[
          { left: "5%", color: "#4A7AFF", delay: "0s", dur: "4.2s", size: 8 }, { left: "12%", color: "#1B3A8C", delay: "0.5s", dur: "5.1s", size: 6 },
          { left: "20%", color: "#4A7AFF", delay: "1.1s", dur: "3.6s", size: 10 }, { left: "30%", color: "#90CDF4", delay: "1.6s", dur: "4.6s", size: 7 },
          { left: "40%", color: "#1B3A8C", delay: "0.3s", dur: "5.5s", size: 5 }, { left: "50%", color: "#4A7AFF", delay: "2.1s", dur: "4s", size: 9 },
          { left: "60%", color: "#BEE3F8", delay: "0.9s", dur: "3.9s", size: 6 }, { left: "70%", color: "#1B3A8C", delay: "1.3s", dur: "4.3s", size: 8 },
          { left: "80%", color: "#4A7AFF", delay: "0.2s", dur: "5.1s", size: 7 }, { left: "90%", color: "#90CDF4", delay: "1.9s", dur: "3.6s", size: 5 },
        ].map((c, i) => <div key={i} className="confetti-piece" style={{ left: c.left, width: c.size, height: c.size, background: c.color, animationDelay: c.delay, animationDuration: c.dur }} />)}

        <div className="hero-layout" style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", gap: "5vw", flexWrap: "wrap", justifyContent: "center" }}>

          {/* ─── HERO TEXT ─── */}
          <div style={{ flex: 1, minWidth: 300, order: 1 }}>
            {/* Live badge */}
            <div style={{ ...hd(0), display: "inline-flex", alignItems: "center", gap: 8, background: C.blueXL, border: `1.5px solid ${C.blueL}55`, borderRadius: 100, padding: "7px 18px", marginBottom: 24 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "blink 1.6s infinite", boxShadow: "0 0 8px #22C55E88" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>מערכת ניהול אירועים מתקדמת 🇮🇱</span>
            </div>

            {/* Headline */}
            <h1 style={{ ...hd(1), fontSize: "clamp(44px,6vw,82px)", fontWeight: 900, lineHeight: 1.02, color: C.text, marginBottom: 18, letterSpacing: "-3px" }}>
              האירוע שלך,{" "}
              <span style={{
                background: `linear-gradient(135deg,${C.blue} 0%,${C.blueL} 50%,#7B3FD4 100%)`,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite"
              }}>
                בסדר מושלם
              </span>
            </h1>

            <p style={{ ...hd(2), fontSize: "clamp(15px,1.5vw,19px)", color: "#2D3748", lineHeight: 1.8, marginBottom: 30, fontWeight: 500, maxWidth: 520 }}>
              סידורי הושבה, אישורי הגעה, WhatsApp אוטומטי ו-AI חכם —
              <br />כל מה שצריך לאירוע מושלם במקום אחד.
            </p>

            {/* CTAs */}
            <div className="hero-btns" style={{ ...hd(3), display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <button onClick={() => onOpenAuth("register")} className="cta-main"
                style={{ background: `linear-gradient(135deg,${C.blue},${C.blueL})`, color: "#fff", border: "none", borderRadius: 12, padding: "15px 36px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 32px rgba(27,58,140,.38)`, transition: "all .25s", letterSpacing: "-.3px" }}>
                🚀 התחילו בחינם
              </button>
              <a href="https://wa.me/972526817102" target="_blank" rel="noopener"
                style={{ background: "#25D366", color: "#fff", borderRadius: 12, padding: "14px 26px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, transition: "all .2s", boxShadow: "0 4px 16px rgba(37,211,102,.3)" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                💬 דברו איתנו
              </a>
            </div>

            {/* Trust signals */}
            <div style={{ ...hd(4), display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              {[["✓", "ללא כרטיס אשראי"], ["✓", "התחלה ב-2 דקות"], ["✓", "תמיכה בעברית"]].map(([ic, t]) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted, fontWeight: 600 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#22C55E22", color: "#22C55E", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic}</span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* ─── PHONE CAROUSEL ─── */}
          <div style={{ flexShrink: 0, position: "relative", order: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, ...hd(5) }}>
            {/* Floating elements */}
            {[{ top: "-25px", right: "-15px", emoji: "🌸", delay: "0s", dur: "3.2s" }, { top: "20px", left: "-28px", emoji: "✨", delay: ".5s", dur: "2.8s" }, { top: "180px", right: "-22px", emoji: "💍", delay: "1s", dur: "3.5s" }, { top: "320px", left: "-20px", emoji: "🎉", delay: ".3s", dur: "3s" }, { bottom: "60px", right: "-18px", emoji: "🌺", delay: ".8s", dur: "4s" }].map((f, i) => (
              <div key={i} style={{ position: "absolute", top: f.top, bottom: f.bottom, left: f.left, right: f.right, fontSize: 22, animation: `float ${f.dur} ${f.delay} ease-in-out infinite`, pointerEvents: "none", zIndex: 10 }}>{f.emoji}</div>
            ))}

            {/* Pulse rings */}
            <div style={{ position: "absolute", inset: -20, borderRadius: 56, border: `2px solid ${C.blueL}30`, animation: "pulseRing 2.8s ease-out infinite" }} />
            <div style={{ position: "absolute", inset: -8, borderRadius: 48, border: `1px solid ${C.blueL}20`, animation: "pulseRing 2.8s ease-out infinite .6s" }} />

            {/* Phone shell */}
            <div style={{ width: 248, height: 516, borderRadius: 44, background: "#0a0a0a", padding: 8, boxShadow: `0 48px 96px rgba(13,27,75,.38),0 0 0 1px #222,inset 0 1px 0 rgba(255,255,255,.1)`, position: "relative", zIndex: 2 }}>
              {/* Notch */}
              <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 80, height: 24, background: "#0a0a0a", borderRadius: 12, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a1a1a", border: "1.5px solid #333" }} />
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "#1a1a1a" }} />
              </div>

              {/* Screen */}
              <div key={phoneSlide} style={{ borderRadius: 36, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", direction: "rtl", animation: "phoneFadeIn .5s ease" }}>
                {/* Status bar */}
                <div style={{ background: currentScreen.bg, padding: "32px 14px 16px", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,.8)", fontWeight: 600 }}>9:41</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,.8)" }}>●●●</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", fontWeight: 600 }}>Sidor-IL</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginTop: 2 }}>{currentScreen.title}</div>
                  </div>
                </div>

                {/* Screen content */}
                {currentScreen.content}
              </div>
            </div>

            {/* Slide dots */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {phoneScreens.map((s, i) => (
                <button key={i} onClick={() => setPhoneSlide(i)}
                  style={{ width: phoneSlide === i ? 24 : 8, height: 8, borderRadius: 4, background: phoneSlide === i ? C.blue : C.border, border: "none", cursor: "pointer", transition: "all .3s ease", padding: 0 }} />
              ))}
            </div>

            {/* Screen label */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textAlign: "center", animation: "fadeIn .4s ease" }}>
              {currentScreen.title}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "88px 6vw", position: "relative", overflow: "hidden" }} id="how">
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg,${C.blue}F8,#0f2a7eF8,${C.blueM}F8)`, zIndex: 0 }} />
        {/* Seating tables decoration */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08, filter: "blur(1px)", pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
          {[[100, 100, 50], [280, 180, 60], [500, 110, 48], [720, 170, 55], [940, 100, 52], [1140, 190, 58], [190, 340, 56], [420, 370, 50], [650, 320, 60], [880, 360, 54], [1080, 340, 58]].map((t, i) => (
            <g key={i}>
              <circle cx={t[0]} cy={t[1]} r={t[2]} fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2.5" />
              {Array.from({ length: 8 }, (_, j) => { const a = (j / 8) * Math.PI * 2 - Math.PI / 2; return <circle key={j} cx={t[0] + (t[2] + 12) * Math.cos(a)} cy={t[1] + (t[2] + 12) * Math.sin(a)} r="6" fill="rgba(255,255,255,.65)" />; })}
            </g>
          ))}
        </svg>
        <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className="fu" style={{ opacity: 0, transform: "translateY(22px)", transition: "opacity .6s,transform .6s", marginBottom: 56, textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 100, padding: "6px 18px", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>⚡ פשוט, מהיר, עובד</span>
            </div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 14 }}>3 צעדים לאירוע מסודר</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.65)", maxWidth: 480, margin: "0 auto" }}>בלי אקסלים, בלי בלבול — רק אתם והאורחים שלכם.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 32 }}>
            {[["01", "הוסף אורחים", "ייבא מ-Excel, מאנשי קשר, או הוסף ידנית. כל אורח עם שם, טלפון וכמות מגיעים.", "📋"], ["02", "צור שולחנות", "הגדר שולחנות עגולים, מרובעים, שולחן אבירים. סדר על מפת האולם האינטראקטיבית.", "🗺️"], ["03", "AI עושה השאר", "תאר העדפות ו-AI יסדר הכל. שלח WhatsApp לכל אורח עם מספר שולחן ביום האירוע.", "🤖"]].map(([n, t, d, icon], i) => (
              <div key={n} className="fu" style={{ opacity: 0, transform: "translateY(22px)", transition: `opacity .6s ${i * .12}s,transform .6s ${i * .12}s` }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 48, fontWeight: 800, color: "rgba(255,255,255,.1)", lineHeight: 1, marginBottom: 8 }}>{n}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{t}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "88px 6vw", background: C.bg }} id="features">
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="fu" style={{ opacity: 0, transform: "translateY(22px)", transition: "opacity .6s,transform .6s", marginBottom: 56, textAlign: "center" }}>
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: C.blueL, background: C.blueXL, border: `1px solid ${C.blueL}33`, borderRadius: 100, padding: "6px 18px", marginBottom: 14 }}>כלים שבאמת שווים</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 800, color: C.text, marginBottom: 12 }}>כל מה שצריך לאירוע מושלם</h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 500, margin: "0 auto" }}>פיצ'רים שיהפכו את ניהול האירוע שלך לחוויה קלה ומהנה.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginBottom: 48 }}>
            {features.map((f, i) => (
              <div key={f.title} className="fu feature-chip"
                style={{ opacity: 0, transform: "translateY(22px)", transition: `opacity .6s ${i * .07}s,transform .6s ${i * .07}s`, background: C.surface, border: `1.5px solid ${activeFeature === i ? f.color + "55" : C.border}`, borderRadius: 20, padding: "26px", cursor: "pointer", boxShadow: activeFeature === i ? `0 8px 28px ${f.color}18` : "none", transition: "all .3s ease" }}
                onMouseEnter={() => setActiveFeature(i)}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 15, background: f.color + "15", border: `2px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{f.icon}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{f.title}</div>
                </div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{f.desc}</div>
                {activeFeature === i && <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: `linear-gradient(90deg,${f.color},${f.color}55)`, animation: "fadeIn .3s ease" }} />}
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button onClick={() => onOpenAuth("register")} className="cta-main"
              style={{ background: `linear-gradient(135deg,${C.blue},${C.blueL})`, color: "#fff", border: "none", borderRadius: 14, padding: "16px 52px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 32px rgba(74,122,255,.42)`, transition: "all .25s" }}>
              🚀 התחילו בחינם עכשיו
            </button>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>ללא כרטיס אשראי · התחלה מיידית · ביטול בכל עת</div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: "88px 6vw", background: C.surface }} id="pricing">
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="fu" style={{ opacity: 0, transform: "translateY(22px)", transition: "opacity .6s,transform .6s", marginBottom: 52, textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,3.3vw,44px)", fontWeight: 800, color: C.text, marginBottom: 12 }}>מחירים שקופים, ללא הפתעות</h2>
            <p style={{ fontSize: 16, color: C.muted }}>תשלום חד פעמי · ללא מנוי · שדרוג בכל עת</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
            {[
              { name: "BASIC", price: "חינם", desc: "להתנסות", color: C.blue, features: ["הזמנה דיגיטלית", "ניהול אורחים", "ייבוא מ-Excel", "סידורי הושבה", "תמיכה ב-6 שפות"] },
              { name: "SMART", price: "₪69", per: "ל-50 רשומות", desc: "הכי פופולרי ⭐", color: "#7B3FD4", hot: true, features: ["הכל ב-BASIC", "WhatsApp אוטומטי", "אישורי הגעה", "תזכורות + ניווט", "מעקב תשובות"] },
              { name: "PREMIUM", price: "₪99", per: "ל-50 רשומות", desc: "שקט נפשי מלא", color: C.success, features: ["הכל ב-SMART", "חייגן אוטומטי", "שיחה אנושית", "מתנות באשראי", "ניהול מלא"] },
            ].map((plan, i) => (
              <div key={plan.name} className="fu"
                style={{ opacity: 0, transform: "translateY(22px)", transition: `opacity .6s ${i * .1}s,transform .6s ${i * .1}s`, background: plan.hot ? `linear-gradient(145deg,${C.blue}08,#7B3FD408)` : C.surface, border: `${plan.hot ? 2.5 : 1.5}px solid ${plan.hot ? plan.color + "55" : C.border}`, borderRadius: 24, padding: "28px 24px", position: "relative", boxShadow: plan.hot ? `0 12px 40px ${plan.color}18` : "none" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 48px ${plan.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = plan.hot ? `0 12px 40px ${plan.color}18` : "none"; }}>
                {plan.hot && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${C.blue},#7B3FD4)`, color: "#fff", borderRadius: 100, padding: "4px 16px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>⭐ הכי פופולרי</div>}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 4 }}>{plan.desc}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{plan.name}</div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: plan.price === "חינם" ? 28 : 36, fontWeight: 900, color: plan.color }}>{plan.price}</span>
                    {plan.per && <span style={{ fontSize: 13, color: C.muted, marginRight: 6 }}>{plan.per}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                  {plan.features.map(f => <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: plan.color + "20", color: plan.color, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
                    {f}
                  </div>)}
                </div>
                <button onClick={() => onOpenAuth("register")} style={{ width: "100%", background: plan.hot ? `linear-gradient(135deg,${C.blue},#7B3FD4)` : "transparent", color: plan.hot ? "#fff" : plan.color, border: `2px solid ${plan.color}`, borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                  onMouseEnter={e => { if (!plan.hot) { e.currentTarget.style.background = plan.color + "15"; } }}
                  onMouseLeave={e => { if (!plan.hot) { e.currentTarget.style.background = "transparent"; } }}>
                  {plan.price === "חינם" ? "התחל חינם" : "בחר חבילה"} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "100px 6vw", textAlign: "center", position: "relative", overflow: "hidden" }} id="contact">
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1400)", backgroundSize: "cover", backgroundPosition: "center", filter: "blur(6px) brightness(.55)", transform: "scale(1.06)", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg,${C.blue}E8,#0d2060E8,${C.blueM}E8)`, zIndex: 1 }} />
        {/* Rings */}
        {[300, 500, 700].map((s, i) => (
          <div key={i} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: s, height: s, borderRadius: "50%", border: `1px solid rgba(255,255,255,${0.12 - i * 0.03})`, zIndex: 1, animation: `pulseRing ${3 + i}s ease-out infinite ${i * .6}s` }} />
        ))}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="fu" style={{ opacity: 0, transform: "translateY(22px)", transition: "opacity .6s,transform .6s" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎊</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,4vw,54px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>מוכנים להתחיל?</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.72)", marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>הצטרפו לאלפי זוגות שכבר ניהלו את האירוע שלהם עם Sidor-IL.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => onOpenAuth("register")} className="cta-main"
                style={{ background: "#fff", color: C.blue, border: "none", borderRadius: 14, padding: "16px 40px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 32px rgba(0,0,0,.18)", transition: "all .25s" }}>
                🚀 הרשמה בחינם
              </button>
              <a href="https://wa.me/972526817102" target="_blank" rel="noopener"
                style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 14, padding: "15px 30px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, transition: "all .2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#050C20", color: "rgba(255,255,255,.4)", padding: "56px 6vw 28px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 40, marginBottom: 44, justifyContent: "space-between" }}>
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.blue},${C.blueL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 900 }}>◈</div>
                <span style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>Sidor-IL</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.8 }}>פלטפורמה ישראלית לניהול סידורי הושבה חכמים. בנויה עבור זוגות ומפיקי אירועים.</p>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,.7)", marginBottom: 14 }}>צור קשר</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "rgba(255,255,255,.45)" }}>
                <div>📍 השושנים 30, נוף הגליל</div>
                <a href="https://wa.me/972526817102" target="_blank" rel="noopener" style={{ color: "#25D366", textDecoration: "none", fontWeight: 700 }}>💬 WhatsApp</a>
                <div>📞 052-681-7102</div>
                <div>⏰ א׳-ה׳: 9:00-17:00</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: 12, alignItems: "center" }}>
            <span>© 2025 Sidor-IL · כל הזכויות שמורות</span>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <a href="#/privacy" style={{ color: "rgba(255,255,255,.4)", textDecoration: "none" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.4)"}>מדיניות פרטיות</a>
              {["📘", "📸", "🎵"].map(s => <span key={s} style={{ cursor: "pointer" }}>{s}</span>)}
            </div>
            <span>🇮🇱 נבנתה עם ❤️</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


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
        const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:`https://sidoril.com`});
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

  const loginWithGoogle=async()=>{setGoogleLoad(true);await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:`https://sidoril.com`}});setGoogleLoad(false);};

  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(26,16,53,.6)",backdropFilter:"blur(8px)"}}/>
      <div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:201,background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 28px 44px",maxWidth:480,margin:"0 auto",direction:"rtl",boxShadow:"0 -8px 40px rgba(107,61,212,.2)"}}>
        <style>{"@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}"}</style>
        <div style={{animation:"slideUp .3s ease"}}>
          <div style={{width:40,height:4,borderRadius:2,background:LS.border,margin:"0 auto 24px"}}/>

          {/* Logo */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:18,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:10,boxShadow:"0 6px 20px rgba(107,61,212,.35)"}}>◈</div>
            <div style={{fontWeight:900,fontSize:22,color:LS.purple}}>Sidor-IL</div>
            <div style={{fontSize:12,color:LS.muted,marginTop:2}}>סידורי הושבה חכמים לאירועים</div>
          </div>

          {mode==="reset"?(
            <div>
              {resetSent?(
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{fontSize:44,marginBottom:12}}>📧</div>
                  <div style={{fontSize:17,fontWeight:800,color:LS.text,marginBottom:8}}>נשלח מייל לשחזור!</div>
                  <div style={{fontSize:13,color:LS.muted,marginBottom:20}}>בדוק את תיבת הדואר שלך.</div>
                  <LSBtn ghost onClick={()=>{setMode("login");setResetSent(false);}}>חזרה לכניסה</LSBtn>
                </div>
              ):(
                <>
                  <LSInput label="אימייל" type="email" value={email} onChange={setEmail} placeholder="your@email.com" style={{marginBottom:14}}/>
                  {err&&<div style={{background:"#FEF2F2",border:"1px solid #FECDCD",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#DC2626",marginBottom:12}}>{err}</div>}
                  <LSBtn primary full onClick={submit} disabled={load||!email}>
                    {load?<><div style={{width:16,height:16,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.4)",borderTopColor:"#fff",animation:"spin .7s linear infinite"}}/>שולח...</>:"שלח קישור לאיפוס ←"}
                  </LSBtn>
                  <p style={{fontSize:13,color:LS.muted,textAlign:"center",marginTop:14}}>
                    <span onClick={()=>setMode("login")} style={{color:LS.purple,fontWeight:700,cursor:"pointer"}}>חזרה לכניסה</span>
                  </p>
                </>
              )}
            </div>
          ):(
            <>
              {/* Google */}
              <button onClick={loginWithGoogle} disabled={googleLoad}
                style={{width:"100%",background:"#fff",color:"#333",border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                {googleLoad?<div style={{width:20,height:20,borderRadius:"50%",border:"2.5px solid #D4C9F0",borderTopColor:LS.purple,animation:"spin .7s linear infinite"}}/>:<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
                {googleLoad?"מתחבר...":"התחבר עם Google"}
              </button>

              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{flex:1,height:1,background:LS.border}}/><span style={{fontSize:12,color:LS.muted,fontWeight:600}}>או</span><div style={{flex:1,height:1,background:LS.border}}/>
              </div>

              {/* Mode toggle */}
              <div style={{display:"flex",background:LS.purpleXL,borderRadius:12,padding:4,marginBottom:18}}>
                {[["login","כניסה"],["register","הרשמה"]].map(([v,l])=>(
                  <button key={v} onClick={()=>{setMode(v);setErr("");}}
                    style={{flex:1,padding:"10px 0",borderRadius:9,background:mode===v?"#fff":"transparent",border:"none",fontWeight:700,fontSize:14,color:mode===v?LS.purple:LS.muted,cursor:"pointer",fontFamily:"inherit",transition:"all .2s",boxShadow:mode===v?"0 2px 8px rgba(107,61,212,.15)":"none"}}>
                    {l}
                  </button>
                ))}
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                <LSInput type="email" value={email} onChange={setEmail} placeholder="your@email.com" label="אימייל"/>
                <LSInput type="password" value={pass} onChange={setPass} placeholder="סיסמה (מינימום 6 תווים)" label="סיסמה" onKeyDown={e=>e.key==="Enter"&&submit()}/>
              </div>

              {mode==="login"&&(
                <div style={{textAlign:"left",marginBottom:12}}>
                  <span onClick={()=>{setMode("reset");setErr("");}} style={{fontSize:13,color:LS.purple,fontWeight:600,cursor:"pointer"}}>שכחתי סיסמה</span>
                </div>
              )}
              {err&&<div style={{background:err.startsWith("✅")?"#ECFDF5":"#FEF2F2",border:`1px solid ${err.startsWith("✅")?"#A7F3D0":"#FECDCD"}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:err.startsWith("✅")?"#059669":"#DC2626",marginBottom:12}}>{err}</div>}

              <LSBtn primary full onClick={submit} disabled={load||!email||!pass} style={{fontSize:15}}>
                {load?<><div style={{width:16,height:16,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.4)",borderTopColor:"#fff",animation:"spin .7s linear infinite"}}/>מעבד...</>:mode==="login"?"כניסה ←":"צור חשבון ←"}
              </LSBtn>

              <p style={{fontSize:13,color:LS.muted,textAlign:"center",marginTop:14}}>
                {mode==="login"?"אין חשבון? ":"יש חשבון? "}
                <span onClick={()=>setMode(mode==="login"?"register":"login")} style={{color:LS.purple,fontWeight:700,cursor:"pointer"}}>{mode==="login"?"הירשם":"כנס"}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}


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
            <input type="date" dir="ltr" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} dir="ltr" style={{width:"100%",background:C.blueXL,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"8px 6px",fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
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
  const hasSeating=userPackages.some(p=>["seating","sms","auto","vip","staff"].includes(p.package_id));
  const hasRsvp=userPackages.some(p=>["basic","seating","sms","auto","vip","staff"].includes(p.package_id));
  const isFreePlan=userPackages.length===0;
  const items=[
    {id:"home",icon:"🏠",label:"ראשי"},
    {id:"seating",icon:"🪑",label:"הושבה",locked:!hasSeating},
    {id:"rsvp",icon:"✅",label:"הגעה",locked:!hasRsvp},
    {id:"add",icon:"➕",label:"הוסף",locked:isFreePlan&&totalGuests>=50},
    {id:"settings",icon:"⚙️",label:"הגדרות"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:80,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",height:64,boxShadow:"0 -4px 20px rgba(27,58,140,0.08)"}}>
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
  const [type,setType]=useState(table.type||"round");
  const [seats,setSeats]=useState(table.seats||10);
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(26,16,53,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:380,direction:"rtl",boxShadow:"0 8px 40px rgba(107,61,212,.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>✏️</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:17,color:LS.text}}>עריכת שולחן</div>
            <div style={{fontSize:12,color:LS.muted}}>{table.name}</div>
          </div>
          <LSBtn danger small onClick={()=>{if(window.confirm("למחוק שולחן זה?"))onDelete();}}>🗑️</LSBtn>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
          <LSInput label="שם השולחן" value={name} onChange={setName} placeholder="שולחן 1"/>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>מספר מושבים</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setSeats(s=>Math.max(1,s-1))} style={{width:36,height:36,borderRadius:10,background:LS.purpleXL,border:`1.5px solid ${LS.border}`,fontSize:18,cursor:"pointer",fontFamily:"inherit",color:LS.purple,fontWeight:900}}>−</button>
              <span style={{fontSize:22,fontWeight:900,color:LS.text,minWidth:40,textAlign:"center"}}>{seats}</span>
              <button onClick={()=>setSeats(s=>s+1)} style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",border:"none",fontSize:18,cursor:"pointer",fontFamily:"inherit",color:"#fff",fontWeight:900}}>+</button>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>סוג שולחן</div>
            <div style={{display:"flex",gap:8}}>
              {Object.entries(TABLE_TYPES).map(([k,v])=>(
                <button key={k} onClick={()=>setType(k)}
                  style={{flex:1,padding:"10px 6px",borderRadius:10,border:`2px solid ${type===k?LS.purple:LS.border}`,background:type===k?LS.purpleXL:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:18}}>{v.icon}</div>
                  <div style={{fontSize:10,fontWeight:700,color:type===k?LS.purple:LS.muted,marginTop:3}}>{v.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:8}}>
          <LSBtn ghost full onClick={onClose}>ביטול</LSBtn>
          <LSBtn primary full onClick={()=>onSave(name,type,seats)} disabled={!name.trim()}>שמור ✓</LSBtn>
        </div>
      </div>
    </div>
  );
}


function MobileSeating({ tables, guests, search, setSearch, newGuest, setNewGuest, addGuest, dropOnTable, removeFromTable, onAddTable, onEditTable, onDeleteTable, onEditGuest }) {
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
    <div onClick={()=>onChange(!val)} style={{width:44,height:24,borderRadius:12,background:val?"#1B3A8C":"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",top:2,left:val?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
    </div>
  );

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:80}}>

      {/* פרופיל */}
      <div style={{background:"#fff",margin:"12px 16px",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{background:"linear-gradient(135deg,#1B3A8C,#2952C8)",padding:"16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff"}}>
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>{event.groom_name&&event.bride_name?`${event.groom_name} & ${event.bride_name}`:event.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{user.email}</div>
          </div>
        </div>
        <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
          {[["שם פרטי",event.groom_name||""],["שם משפחה",event.bride_name||""],["מס' נייד",user.phone||"—"]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:8,borderBottom:"1px solid #f5f5f5"}}>
              <span style={{fontSize:13,color:"#555"}}>{l}</span>
              <span style={{fontSize:13,fontWeight:700,direction:l==="מס' נייד"?"ltr":"rtl"}}>{v}</span>
            </div>
          ))}
          <button onClick={()=>setScreen("settings")} style={{background:"#EEF2FF",color:"#1B3A8C",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
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
          <button onClick={changePw} style={{background:"#1B3A8C",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
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
        <div style={{fontSize:12,color:"#888",marginBottom:12,lineHeight:1.6}}>מחיקת החשבון תמחק לצמיתות את כל הנתונים — אורחים, שולחנות, אירוע ופרטי חשבון. לא ניתן לשחזר.</div>
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
    await sb.from("guests").update(editForm).eq("id",editModal.id);
    setGuests(gs=>gs.map(x=>x.id===editModal.id?{...x,...editForm}:x));
    setTables(ts=>ts.map(t=>({...t,guests:(t.guests||[]).map(x=>x.id===editModal.id?{...x,...editForm}:x)})));
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
              <div style={{flex:1,textAlign:"center",fontSize:20,fontWeight:900,color:"#1B3A8C"}}>{editForm.guest_count||1}</div>
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
            style={{width:"100%",background:"#EEF2FF",color:"#3D5475",border:"1px solid #C7D2FE",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
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
          <div><div style={{fontSize:30,fontWeight:900,color:"#1B3A8C",lineHeight:1}}>{allGuests.length}</div><div style={{fontSize:11,color:"#666",fontWeight:600}}>מוזמנים</div></div>
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
              <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#1B3A8C,#4A7AFF)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{g.name?.[0]}</div>
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

// ─── SEATING VIEW UPGRADE ─────────────────────────────────────────────────────
// מחליף את הקטע שמתחיל ב-{screen!=="home"&&screen==="seating"&&
// עד סוף ה-</div> שלו
// סגנון: LunSoul - sidebar שמאלי עם אלמנטים, canvas לבן נקי, תחתית עם סטטיסטיקות

// ELEMENTS שמשתמש יכול לגרור לקנבס
const VENUE_ELEMENTS = [
  { id:"stage",   label:"במה",         icon:"🎵", color:"#7B3FD4", bg:"linear-gradient(135deg,#4A1E8C,#7B3FD4)" },
  { id:"entrance",label:"כניסה",       icon:"🚪", color:"#2C3E50", bg:"linear-gradient(135deg,#2C3E50,#34495E)" },
  { id:"bar",     label:"בר",          icon:"🍸", color:"#E94560", bg:"linear-gradient(135deg,#1A1A2E,#0F3460)" },
  { id:"dance",   label:"ריקודים",     icon:"💃", color:"#FF6B6B", bg:"linear-gradient(135deg,#FF6B6B,#FF8E8E)" },
  { id:"ceremony",label:"חופה",        icon:"💒", color:"#D4A017", bg:"linear-gradient(135deg,#8B6914,#D4A017)" },
  { id:"photo",   label:"צילום",       icon:"📸", color:"#2E86AB", bg:"linear-gradient(135deg,#1A5276,#2E86AB)" },
  { id:"gifts",   label:"מתנות",       icon:"🎁", color:"#E91E63", bg:"linear-gradient(135deg,#880E4F,#E91E63)" },
];

// ─── ELEMENT NODE (לאלמנטים בקנבס) ───
function VenueElementNode({ el, selected, onMouseDown }) {
  return (
    <div onMouseDown={onMouseDown}
      style={{
        position:"absolute", left:el.x, top:el.y,
        width:86, height:86, borderRadius:16,
        background:VENUE_ELEMENTS.find(v=>v.id===el.type)?.bg||"#666",
        border:`2.5px solid ${selected?"rgba(255,255,255,.9)":"rgba(255,255,255,.3)"}`,
        boxShadow: selected
          ? `0 8px 28px rgba(0,0,0,.35),0 0 0 3px rgba(255,255,255,.3)`
          : `0 4px 16px rgba(0,0,0,.22)`,
        cursor:"grab", userSelect:"none",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:4, zIndex: selected ? 15 : 4,
        transition:"box-shadow .2s, border-color .2s",
      }}>
      <div style={{fontSize:26}}>{VENUE_ELEMENTS.find(v=>v.id===el.type)?.icon||"⬜"}</div>
      <div style={{fontSize:10,fontWeight:800,color:"#fff",letterSpacing:.5,textShadow:"0 1px 3px rgba(0,0,0,.4)"}}>
        {el.label||VENUE_ELEMENTS.find(v=>v.id===el.type)?.label}
      </div>
    </div>
  );
}

// ─── UPGRADED SEATING SECTION ───
// זה מחליף את: {screen!=="home"&&screen==="seating"&&<div ...>

function SeatingSection({ tables, guests, selected, setSelected, search, setSearch,
  newGuest, setNewGuest, addGuest, dropOnTable, removeFromTable, onAddTable,
  editGuestData, setEditGuestData, editTable, deleteTable,
  moveTablePos, saveTablePos, setEditTableData, setModal, view, setView,
  saving, seated, total, venueElements, setVenueElements }) {

  const [canvasMode, setCanvasMode] = useState("venue"); // "venue" | "grid"
  const selTable = tables.find(t=>t.id===selected);

  const addVenueElement=(type)=>{
    const newEl={id:`el_${Date.now()}`,type,x:120+venueElements.length*24,y:80+venueElements.length*18};
    setVenueElements(v=>[...v,newEl]);
  };

  const moveElement=(id,x,y)=>setVenueElements(v=>v.map(e=>e.id===id?{...e,x:Math.max(0,x),y:Math.max(0,y)}:e));
  const removeElement=(id)=>setVenueElements(v=>v.filter(e=>e.id!==id));

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 52px)"}}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{width:300,background:"#fff",borderLeft:`1px solid ${LS.border}`,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
        {selTable?(
          // Selected table view
          <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
            <div style={{padding:"12px 14px",background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",flexShrink:0}}>
              <button onClick={()=>setSelected(null)}
                style={{width:"100%",background:"rgba(255,255,255,.18)",border:"1.5px solid rgba(255,255,255,.5)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",borderRadius:10,padding:"8px",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                ← חזרה לרשימת אורחים
              </button>
            </div>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${LS.border}`,background:LS.purpleXL,flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:800,fontSize:14,color:LS.text}}>{selTable.name}</span>
                <span style={{background:sColor(selTable)+"18",color:sColor(selTable),borderRadius:100,fontSize:12,fontWeight:700,padding:"3px 10px",border:`1px solid ${sColor(selTable)}33`}}>
                  {(selTable.guests||[]).length}/{selTable.seats}
                </span>
              </div>
              <div style={{height:6,background:LS.border,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct(selTable)}%`,background:"linear-gradient(90deg,#5B2DB8,#7B4AE2)",borderRadius:3,transition:"width .4s"}}/>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
              {(selTable.guests||[]).length===0&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:32,marginBottom:8}}>🪑</div><p style={{color:LS.muted,fontSize:13}}>גרור אורחים לכאן</p></div>}
              {(selTable.guests||[]).map(g=>(
                <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));e.dataTransfer.setData("fromTable",String(selTable.id));}}
                  style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"9px 10px",marginBottom:6,cursor:"grab",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=LS.purple;e.currentTarget.style.boxShadow=`0 2px 8px rgba(107,61,212,.1)`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=LS.border;e.currentTarget.style.boxShadow="none";}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{g.name[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:LS.text}}>{g.name}</div>
                    {g.relation&&<span style={{fontSize:10,background:RELATION_COLORS[g.relation]+"18"||LS.purpleXL,color:RELATION_COLORS[g.relation]||LS.purple,borderRadius:100,padding:"1px 7px",fontWeight:600}}>{g.relation}</span>}
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    <button onClick={e=>{e.stopPropagation();setEditGuestData(g);}} style={{background:LS.purpleXL,border:"none",color:LS.purple,borderRadius:7,padding:"4px 7px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✏️</button>
                    <button onClick={async e=>{e.stopPropagation();await removeFromTable(selTable.id,g);}} style={{background:"#FEF2F2",border:"none",color:"#DC2626",borderRadius:7,padding:"4px 7px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✕</button>
                  </div>
                </div>
              ))}
              <div onDragOver={e=>{e.preventDefault();e.stopPropagation();e.currentTarget.style.background=LS.purpleXL;e.currentTarget.style.borderColor=LS.purple;}}
                onDragLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=LS.purple+"55";}}
                onDrop={e=>{e.preventDefault();e.stopPropagation();e.currentTarget.style.background="transparent";const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(selTable.id,gid,f);}}
                style={{border:`2px dashed ${LS.purple}55`,borderRadius:12,padding:"18px",textAlign:"center",color:LS.purple,fontSize:12,marginTop:10,fontWeight:700,transition:"all .2s",cursor:"copy"}}>
                ⬇ שחרר אורח כאן
              </div>
            </div>
            <div style={{padding:"10px 14px",borderTop:`1px solid ${LS.border}`,flexShrink:0}}>
              <LSBtn primary full onClick={()=>setModal("addGuest")}>➕ הוסף אורח לשולחן</LSBtn>
            </div>
          </div>
        ):(
          // Guest list + elements
          <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
            {/* Elements panel - TABS */}
            <div style={{flexShrink:0}}>
              <div style={{display:"flex",borderBottom:`1px solid ${LS.border}`}}>
                {[["אורחים","👥"],["אלמנטים","🏛️"]].map(([l,ic],i)=>(
                  <button key={l} onClick={()=>document.getElementById("ls-tab-"+i)?.click()}
                    id={"ls-tab-btn-"+i}
                    style={{flex:1,padding:"11px",background:"#fff",border:"none",fontSize:13,fontWeight:600,color:LS.muted,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5,borderBottom:`2px solid transparent`,transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.color=LS.purple;}}
                    onMouseLeave={e=>{e.currentTarget.style.color=LS.muted;}}>
                    {ic} {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Elements grid */}
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${LS.border}`,background:LS.purpleXL,flexShrink:0}}>
              <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>אלמנטים לאולם</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {VENUE_ELEMENTS.map(el=>(
                  <button key={el.id} onClick={()=>addVenueElement(el.id)}
                    style={{background:el.bg,border:"none",borderRadius:10,padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,boxShadow:"0 2px 6px rgba(0,0,0,.15)",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 16px rgba(0,0,0,.25)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,.15)";}}>
                    <span style={{fontSize:16}}>{el.icon}</span>
                    <span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.9)"}}>{el.label}</span>
                  </button>
                ))}
                <button onClick={onAddTable}
                  style={{background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",border:"none",borderRadius:10,padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,boxShadow:"0 2px 8px rgba(107,61,212,.3)",transition:"all .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  <span style={{fontSize:16}}>🪑</span>
                  <span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.9)"}}>שולחן</span>
                </button>
              </div>
            </div>

            {/* Guests */}
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${LS.border}`,background:"#fff",flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:13,color:LS.text}}>ממתינים להושבה</span>
                <span style={{background:"#FFFBEB",color:"#D97706",borderRadius:100,fontSize:11,fontWeight:700,padding:"2px 8px",border:"1px solid #FDE68A"}}>{guests.length}</span>
              </div>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#ccc",pointerEvents:"none"}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש אורח..."
                  style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:10,padding:"8px 34px 8px 10px",fontSize:13,color:LS.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color .2s"}}
                  onFocus={e=>e.target.style.borderColor=LS.purple} onBlur={e=>e.target.style.borderColor=LS.border}/>
              </div>
            </div>

            <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
              {guests.length===0&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:40}}>🎉</div><p style={{color:LS.success,fontWeight:700,fontSize:13,marginTop:8}}>כולם מוסבים!</p></div>}
              {guests.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())).map(g=>(
                <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("guestId",String(g.id));}}
                  style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"8px 10px",cursor:"grab",marginBottom:6,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=LS.purple;e.currentTarget.style.boxShadow=`0 2px 8px rgba(107,61,212,.1)`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=LS.border;e.currentTarget.style.boxShadow="none";}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0,position:"relative"}}>
                    {g.name[0]}
                    <div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:"50%",background:RELATION_COLORS[g.relation]||"#CBD5E0",border:"2px solid #fff"}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:LS.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                    {g.relation&&<span style={{fontSize:10,color:RELATION_COLORS[g.relation]||LS.purple,fontWeight:600}}>{g.relation}</span>}
                  </div>
                  <button onClick={e=>{e.stopPropagation();setEditGuestData(g);}} style={{background:LS.purpleXL,border:"none",color:LS.purple,borderRadius:7,padding:"4px 7px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✏️</button>
                </div>
              ))}
            </div>

            <div style={{padding:"10px 14px",borderTop:`1px solid ${LS.border}`,flexShrink:0}}>
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                <input value={newGuest} onChange={e=>setNewGuest(e.target.value)} placeholder="שם אורח חדש..."
                  style={{flex:1,background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:10,padding:"8px 10px",fontSize:13,color:LS.text,outline:"none",fontFamily:"inherit",transition:"border-color .2s"}}
                  onFocus={e=>e.target.style.borderColor=LS.purple} onBlur={e=>e.target.style.borderColor=LS.border}
                  onKeyDown={e=>e.key==="Enter"&&addGuest()}/>
                <button onClick={addGuest} style={{background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:18,fontWeight:700}}>+</button>
              </div>
              <LSBtn ghost full small onClick={()=>setModal("addGuest")}>➕ הוסף עם פרטים מלאים</LSBtn>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN CANVAS ── */}
      <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",background:LS.bg}}>
        {/* Toolbar */}
        <div style={{height:46,background:"#fff",borderBottom:`1px solid ${LS.border}`,display:"flex",alignItems:"center",padding:"0 16px",gap:8,flexShrink:0}}>
          {/* Canvas mode toggle */}
          <div style={{display:"flex",background:LS.purpleXL,borderRadius:10,padding:3,gap:3}}>
            {[["venue","🏛️ אולם אירועים"],["grid","📐 רשת"]].map(([m,l])=>(
              <button key={m} onClick={()=>setCanvasMode(m)}
                style={{background:canvasMode===m?"linear-gradient(135deg,#5B2DB8,#7B4AE2)":"transparent",color:canvasMode===m?"#fff":LS.muted,border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{width:1,height:20,background:LS.border}}/>

          {/* View toggle */}
          <div style={{display:"flex",gap:3}}>
            {[["map","🗺 מפה"],["list","📋 שולחנות"],["guests","👥 כל האורחים"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)}
                style={{background:view===v?LS.purpleXL:"transparent",color:view===v?LS.purple:LS.muted,border:`1.5px solid ${view===v?LS.purple+"44":"transparent"}`,borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{flex:1}}/>
          <LSBtn primary small onClick={onAddTable} icon="🪑">הוסף שולחן</LSBtn>
          <LSBtn ghost small onClick={()=>setModal("receipt")} icon="🔍">חפש אורח</LSBtn>
        </div>

        {/* MAP VIEW */}
        {view==="map"&&(
          <div onDragOver={e=>e.preventDefault()} onDrop={e=>{if(e.defaultPrevented)return;e.preventDefault();}}
            onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}}
            style={{flex:1,overflow:"auto",position:"relative"}}>
            {(()=>{
              const MAP_W=Math.max(window.innerWidth-350,900);
              const MAP_H=Math.max(window.innerHeight-140,620);
              return(
                <div style={{
                  position:"relative",width:MAP_W,height:MAP_H,flexShrink:0,
                  margin:12,borderRadius:16,overflow:"hidden",
                  background: canvasMode==="grid"
                    ? "#fff"
                    : "linear-gradient(145deg,#F8F6FF,#F0EBFF)",
                  border:`1.5px solid ${LS.border}`,
                  boxShadow:"0 2px 16px rgba(107,61,212,.06)"
                }}
                onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}}>

                  {/* Background pattern */}
                  <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
                    {canvasMode==="grid"?(
                      <defs>
                        <pattern id="lsgrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EDE8FF" strokeWidth="1"/>
                        </pattern>
                        <pattern id="lsgridBig" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                          <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#D8D0F8" strokeWidth="1.5"/>
                        </pattern>
                      </defs>
                    ):(
                      <defs>
                        <pattern id="lsdots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                          <circle cx="15" cy="15" r="1.5" fill="#C4B5F4" opacity=".4"/>
                        </pattern>
                      </defs>
                    )}
                    <rect width="100%" height="100%" fill={canvasMode==="grid"?"url(#lsgrid)":"url(#lsdots)"}/>
                    {canvasMode==="grid"&&<rect width="100%" height="100%" fill="url(#lsgridBig)"/>}
                  </svg>

                  {/* Wall border */}
                  <div style={{position:"absolute",inset:0,border:`${canvasMode==="venue"?"3px":"1.5px"} solid ${canvasMode==="venue"?"#A78BFA":"#D8D0F8"}`,borderRadius:15,pointerEvents:"none",zIndex:2}}/>

                  {/* Venue label */}
                  {canvasMode==="venue"&&(
                    <div style={{position:"absolute",top:8,right:12,fontSize:11,color:"#A78BFA",fontWeight:700,opacity:.7,pointerEvents:"none",zIndex:3}}>
                      גררו שולחנות ואלמנטים למיקום הרצוי
                    </div>
                  )}

                  {/* Venue Elements */}
                  {venueElements.map(el=>{
                    let posX=el.x,posY=el.y;
                    const hmd=e=>{
                      e.stopPropagation();
                      setSelected("el_"+el.id);
                      const ox=e.clientX-posX,oy=e.clientY-posY;
                      const mv=me=>{posX=me.clientX-ox;posY=me.clientY-oy;moveElement(el.id,posX,posY);};
                      const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
                      window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
                    };
                    return <VenueElementNode key={el.id} el={el} selected={selected==="el_"+el.id} onMouseDown={hmd}/>;
                  })}

                  {/* Tables */}
                  {tables.map(t=>{
                    let posX=t.x,posY=t.y;
                    const hmd=e=>{
                      e.stopPropagation();setSelected(t.id);
                      const ox=e.clientX-posX,oy=e.clientY-posY;
                      const mv=me=>{posX=me.clientX-ox;posY=me.clientY-oy;moveTablePos(t.id,posX,posY);};
                      const up=()=>{saveTablePos(t.id,posX,posY);window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
                      window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
                    };
                    return(
                      <div key={t.id} style={{position:"absolute",left:t.x,top:t.y,zIndex:selected===t.id?10:3}}>
                        <TableNode table={t} selected={selected===t.id} onMouseDown={hmd}
                          onDrop={e=>{const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(t.id,gid,f);}}/>
                        {selected===t.id&&(
                          <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setEditTableData(t);}}
                            style={{position:"absolute",top:-12,right:-12,zIndex:30,width:26,height:26,borderRadius:"50%",background:"#fff",border:`2px solid ${LS.purple}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,boxShadow:"0 2px 8px rgba(107,61,212,.3)"}}>✏️</button>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state */}
                  {tables.length===0&&venueElements.length===0&&(
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",gap:12}}>
                      <div style={{fontSize:48,opacity:.25}}>🪑</div>
                      <div style={{fontSize:14,fontWeight:700,color:"#C4B5F4"}}>הוסף שולחנות ואלמנטים מהסרגל הצדדי</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* LIST VIEW */}
        {view==="list"&&(
          <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
              {tables.map(t=>(
                <div key={t.id}
                  style={{background:"#fff",borderRadius:16,border:`1.5px solid ${selected===t.id?LS.purple:LS.border}`,padding:16,transition:"all .2s",cursor:"pointer"}}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();const gid=e.dataTransfer.getData("guestId");const f=e.dataTransfer.getData("fromTable")||null;if(gid)dropOnTable(t.id,gid,f);}}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 4px 16px rgba(107,61,212,.1)`;e.currentTarget.style.borderColor=LS.purple+"55";}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=selected===t.id?LS.purple:LS.border;}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:18}}>{TABLE_TYPES[t.type]?.icon}</span>
                      <span style={{fontWeight:800,fontSize:14,color:LS.text}}>{t.name}</span>
                    </div>
                    <span style={{background:sColor(t)+"18",color:sColor(t),borderRadius:100,fontSize:12,fontWeight:700,padding:"3px 10px",border:`1px solid ${sColor(t)}33`}}>
                      {(t.guests||[]).length}/{t.seats}
                    </span>
                  </div>
                  <div style={{height:5,background:LS.purpleXL,borderRadius:3,overflow:"hidden",marginBottom:10}}>
                    <div style={{height:"100%",width:`${pct(t)}%`,background:"linear-gradient(90deg,#5B2DB8,#7B4AE2)",borderRadius:3,transition:"width .4s"}}/>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {(t.guests||[]).map(g=>(
                      <div key={g.id} draggable onDragStart={e=>{e.dataTransfer.setData("guestId",String(g.id));e.dataTransfer.setData("fromTable",String(t.id));}}
                        style={{background:LS.purpleXL,borderRadius:100,fontSize:11,color:LS.purple,padding:"3px 8px",fontWeight:600,cursor:"grab"}}>
                        {g.name.split(" ")[0]}
                      </div>
                    ))}
                    {(t.guests||[]).length===0&&<span style={{fontSize:12,color:LS.muted,fontStyle:"italic"}}>גרור אורחים לכאן</span>}
                  </div>
                </div>
              ))}
              <button onClick={onAddTable}
                style={{background:"transparent",border:`2px dashed ${LS.purple}44`,borderRadius:16,padding:16,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:LS.purple,fontWeight:700,fontSize:13,transition:"all .2s",minHeight:100}}
                onMouseEnter={e=>e.currentTarget.style.background=LS.purpleXL}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{fontSize:28}}>+</span>
                הוסף שולחן
              </button>
            </div>
          </div>
        )}

        {/* GUESTS VIEW */}
        {view==="guests"&&(
          <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
              {[...guests,...tables.flatMap(t=>(t.guests||[]).map(g=>({...g,_tableName:t.name})))].map(g=>(
                <div key={g.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${LS.border}`,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=LS.purple+"44";e.currentTarget.style.boxShadow=`0 2px 8px rgba(107,61,212,.08)`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=LS.border;e.currentTarget.style.boxShadow="none";}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,flexShrink:0}}>{g.name[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:LS.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                    <div style={{fontSize:11,color:g._tableName?"#22C55E":"#F59E0B",fontWeight:600,marginTop:1}}>
                      {g._tableName?`🪑 ${g._tableName}`:"⏳ לא מוסב"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div style={{height:44,background:"#fff",borderTop:`1px solid ${LS.border}`,display:"flex",alignItems:"center",padding:"0 16px",gap:10,flexShrink:0,fontSize:12,fontWeight:700}}>
          {[
            {label:`${tables.length} שולחנות`,icon:"🪑",color:LS.purple,bg:LS.purpleXL},
            {label:`${seated} משובצים`,icon:"👥",color:"#3B82F6",bg:"#EFF6FF"},
            {label:`${seated+(guests.length)>0?Math.round(seated/(seated+guests.length)*100):0}% שובצו`,icon:"📊",color:seated/(seated+guests.length||1)>=.8?"#22C55E":"#F59E0B",bg:seated/(seated+guests.length||1)>=.8?"#ECFDF5":"#FFFBEB"},
            {label:`${guests.length} ממתינים`,icon:"⏳",color:guests.length===0?"#22C55E":"#F59E0B",bg:guests.length===0?"#ECFDF5":"#FFFBEB"},
          ].map(s=>(
            <div key={s.label} style={{display:"flex",alignItems:"center",gap:5,background:s.bg,borderRadius:100,padding:"4px 12px",border:`1px solid ${s.color}22`}}>
              <span>{s.icon}</span><span style={{color:s.color}}>{s.label}</span>
            </div>
          ))}
          <div style={{flex:1}}/>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,color:LS.muted}}>מצב:</span>
            {[["venue","🏛️ אולם"],["grid","📐 רשת"]].map(([m,l])=>(
              <button key={m} onClick={()=>setCanvasMode(m)}
                style={{background:canvasMode===m?LS.purpleXL:"transparent",color:canvasMode===m?LS.purple:LS.muted,border:`1px solid ${canvasMode===m?LS.purple+"44":"transparent"}`,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function SeatingApp({ user, event, onBack, onUpdate, onLogout }) {
  const setShowLanding = onBack; // onBack === ()=>setShowLanding(true)
  const [tables,setTables]=useState([]),[guests,setGuests]=useState([]),[selected,setSelected]=useState(null),[view,setView]=useState("map"),[screen,setScreen]=useState("home"),[modal,setModal]=useState(null),[editGuestData,setEditGuestData]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[search,setSearch]=useState(""),[newGuest,setNewGuest]=useState(""),[mobile,setMobile]=useState(isMobile());
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [venueElements,setVenueElements]=useState([]);
  const [userPackages,setUserPackages]=useState([]);
  const [trialExpired] = useState(false);
  const [trialHours] = useState(0);
  const [editTableData,setEditTableData]=useState(null);
  const hasPkg=(id)=>userPackages.includes(id)||userPackages.includes("vip");

  useEffect(()=>{
    setScreen("home");
    loadAll();
    const fn=()=>setMobile(isMobile());
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[event.id]);
  const loadAll=async()=>{setLoading(true);const [{data:tData},{data:gData},{data:pkgData}]=await Promise.all([sb.from("tables").select("*").eq("event_id",event.id).order("created_at"),sb.from("guests").select("*").eq("event_id",event.id).order("created_at"),sb.from("user_packages").select("package_id").eq("user_id",user.id)]);setTables((tData||[]).map(t=>({...t,guests:(gData||[]).filter(g=>g.table_id===t.id)})));setGuests((gData||[]).filter(g=>!g.table_id));setUserPackages((pkgData||[]).map(p=>p.package_id));setLoading(false);};
  const moveTablePos=useCallback((id,x,y)=>setTables(ts=>ts.map(t=>t.id===id?{...t,x:Math.max(0,x),y:Math.max(0,y)}:t)),[]);
  const saveTablePos=async(id,x,y)=>await sb.from("tables").update({x,y}).eq("id",id);
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
  const removeFromTable=async(tid,guest)=>{setSaving(true);await sb.from("guests").update({table_id:null}).eq("id",guest.id);setTables(ts=>ts.map(t=>t.id===tid?{...t,guests:(t.guests||[]).filter(g=>g.id!==guest.id)}:t));setGuests(gs=>{const already=gs.some(g=>g.id===guest.id);return already?gs:[...gs,{...guest,table_id:null}];});setSaving(false);};
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
    const confirmed=guests.filter(g=>g.rsvp==="confirmed").reduce((s,g)=>s+(g.guest_count||1),0);
    const declined=guests.filter(g=>g.rsvp==="declined").reduce((s,g)=>s+(g.guest_count||1),0);
    const eventIcon=event.event_type==="wedding"?"💍":event.event_type==="bar_mitzva"?"✡️":event.event_type==="brit"?"👶":"💼";

    const HomeScreen=()=>(
      <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",background:"#f5f5f5",minHeight:"100vh",paddingBottom:80}}>

        {/* באנר ניסיון - מוסתר */}

        {/* כותרת האירוע */}
        <div style={{background:"#fff",padding:"20px 20px 16px",textAlign:"center",borderBottom:"1px solid #eee"}}>
          <div style={{fontSize:12,color:"#999",fontWeight:600,marginBottom:4}}>
            {event.event_type==="wedding"?"החתונה של":event.event_type==="bar_mitzva"?"בר-מצווה של":"האירוע של"}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
            <div style={{fontSize:26,fontWeight:900,color:"#1a1a1a",lineHeight:1.1}}>
              {event.groom_name&&event.bride_name?`${event.groom_name} & ${event.bride_name}`:event.name}
            </div>
            <span style={{fontSize:28}}>{eventIcon}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:400,margin:"0 auto"}}>
            <button onClick={()=>window.open(`${window.location.origin}/#/invite/${event.invite_code}`,"_blank")}
              style={{background:"#C0826A",color:"#fff",border:"none",borderRadius:12,padding:"14px 8px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
              לצפייה בהזמנה
            </button>
            <button onClick={()=>setScreen("rsvp")}
              style={{background:"#3D5475",color:"#fff",border:"none",borderRadius:12,padding:"14px 8px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
              אישורי הגעה
            </button>
          </div>
        </div>

        {/* סטטיסטיקות */}
        <div style={{background:"#fff",margin:"12px 16px",borderRadius:16,padding:"20px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
            <div><div style={{fontSize:36,fontWeight:900,color:"#1B3A8C",lineHeight:1}}>{total}</div><div style={{fontSize:12,color:"#666",marginTop:4,fontWeight:600}}>מוזמנים</div></div>
            <div><div style={{fontSize:36,fontWeight:900,color:"#C0392B",lineHeight:1}}>{declined}</div><div style={{fontSize:12,color:"#666",marginTop:4,fontWeight:600}}>לא מגיעים</div></div>
            <div><div style={{fontSize:36,fontWeight:900,color:"#27AE60",lineHeight:1}}>{confirmed}</div><div style={{fontSize:12,color:"#666",marginTop:4,fontWeight:600}}>מגיעים</div></div>
          </div>
          <div style={{marginTop:16,borderTop:"1px solid #f0f0f0",paddingTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:"#888",fontWeight:600}}>אורחים מוסבים</span>
              <span style={{fontSize:12,fontWeight:800,color:"#1B3A8C"}}>{seated}/{total}</span>
            </div>
            <div style={{height:8,background:"#EEF2FF",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${total>0?(seated/total)*100:0}%`,background:"linear-gradient(90deg,#1B3A8C,#4A7AFF)",borderRadius:4,transition:"width .5s"}}/>
            </div>
          </div>
        </div>

        {/* ספירה לאחור */}
        {event.date&&(()=>{
          const now=new Date();
          const diff=new Date(event.date)-now;
          if(diff<=0)return null;
          const days=Math.floor(diff/(1000*60*60*24));
          const hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
          return(
            <div style={{background:"#fff",margin:"0 16px 12px",borderRadius:16,padding:"14px 20px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
              <div style={{display:"flex",justifyContent:"center",gap:20,alignItems:"center"}}>
                <span style={{fontSize:12,color:"#888",fontWeight:600}}>לאירוע</span>
                <div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:900,color:"#1B3A8C",lineHeight:1}}>{hours}</div><div style={{fontSize:10,color:"#888"}}>שעות</div></div>
                {days>0&&<div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:900,color:"#1B3A8C",lineHeight:1}}>{days}</div><div style={{fontSize:10,color:"#888"}}>ימים</div></div>}
                <span style={{fontSize:12,color:"#888",fontWeight:600}}>⏳ עוד</span>
              </div>
            </div>
          );
        })()}

        {/* תפריט */}
        <div style={{padding:"0 16px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#999",marginBottom:10,marginRight:4}}>ניהול האירוע</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[
              {icon:"💌",label:"הזמנה",nav:"invite",color:"#6B21A8",bg:"#F5F0FF"},
              {icon:"✅",label:"אישורי הגעה",nav:"rsvp",color:"#276749",bg:"#F0FFF4"},
              {icon:"🪑",label:"הושבה",nav:"seating",color:"#1B3A8C",bg:"#EEF2FF"},
              {icon:"🤖",label:"AI חכם",nav:"ai",color:"#7C3AED",bg:"#F5F3FF"},
              {icon:"📊",label:"ייבוא",nav:"import",color:"#276749",bg:"#F0FFF4"},
              {icon:"🖨️",label:"חיפוש",nav:"receipt",color:"#1B3A8C",bg:"#EEF2FF"},
              {icon:"➕",label:"הוסף אורח",nav:"add",color:"#276749",bg:"#F0FFF4"},
              {icon:"💰",label:"תקציב",nav:"budget",color:"#B45309",bg:"#FFFBEB"},
              {icon:"📱",label:"SMS",nav:"sms",color:"#1B3A8C",bg:"#EEF2FF"},
              {icon:"💬",label:"WhatsApp",nav:"whatsapp",color:"#25D366",bg:"#F0FFF4"},
              {icon:"📦",label:"חבילות",nav:"packages",color:"#B45309",bg:"#FFFBEB"},
              {icon:"⚙️",label:"הגדרות",nav:"user_settings",color:"#555",bg:"#F7F7F7"},
            ].map(item=>{
              const hasPkg=(id)=>userPackages.some(p=>p.package_id===id||["seating","sms","auto","vip","staff"].includes(p.package_id)&&["seating","sms","whatsapp","ai"].includes(id)||p.package_id==="basic"&&id==="rsvp");
              const isLocked=(()=>{
                if(["packages","settings","invite","user_settings","home"].includes(item.nav)) return false;
                if(item.nav==="rsvp") return !userPackages.some(p=>["basic","seating","sms","auto","vip","staff"].includes(p.package_id));
                if(item.nav==="seating") return !userPackages.some(p=>["seating","sms","auto","vip","staff"].includes(p.package_id));
                if(item.nav==="sms") return !userPackages.some(p=>["sms","auto","vip"].includes(p.package_id));
                if(item.nav==="whatsapp") return !userPackages.some(p=>["auto","vip"].includes(p.package_id));
                if(item.nav==="ai"||item.nav==="budget"||item.nav==="import") return userPackages.length===0;
                return false;
              })();
              return(
                <div key={item.nav} onClick={()=>{
                    if(isLocked){setScreen("packages");return;}
                    if(item.nav==="receipt")setModal("receipt");
                    else if(item.nav==="addTable")setModal("addTable");
                    else setScreen(item.nav);
                  }}
                  style={{background:"#fff",borderRadius:14,padding:"16px 8px",textAlign:"center",cursor:"pointer",
                    boxShadow:"0 2px 8px rgba(0,0,0,.06)",position:"relative",border:`1px solid ${item.color}22`}}>
                  {isLocked&&<div style={{position:"absolute",top:6,left:6,fontSize:10,background:"#FEF3C7",color:"#B45309",borderRadius:5,padding:"1px 5px",fontWeight:700}}>🔒</div>}
                  <div style={{width:44,height:44,borderRadius:12,background:item.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 8px"}}>
                    {item.icon}
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:item.color,lineHeight:1.2}}>{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

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
        {modal==="addGuest"&&(userPackages.length===0&&total>=50
          ?<div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setModal(null)}>
            <div style={{background:"#fff",borderRadius:20,padding:24,maxWidth:360,width:"100%",direction:"rtl",textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:12}}>🔒</div>
              <div style={{fontSize:17,fontWeight:900,color:"#1a1a1a",marginBottom:8}}>הגעת למגבלת 50 אורחים</div>
              <div style={{fontSize:13,color:"#666",marginBottom:20,lineHeight:1.6}}>בחבילה החינמית ניתן להוסיף עד 50 אורחים. שדרג לחבילה הבסיסית (₪50) כדי להוסיף ללא הגבלה.</div>
              <button onClick={()=>{setModal(null);setScreen("packages");}} style={{width:"100%",background:"linear-gradient(135deg,#1B3A8C,#2952C8)",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>📦 שדרג חבילה</button>
            </div>
          </div>
          :<GuestModal eventId={event.id} onClose={()=>setModal(null)} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onSave={async(data)=>{await addGuest(data);setModal(null);}}/>
        )}
        {screen==="rsvp"&&<MobileRsvpScreen guests={guests} tables={tables} event={event} sb={sb} setGuests={setGuests} setTables={setTables} setModal={setModal}/>}
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
        {screen==="settings"&&<EventDetailsScreen event={event} sb={sb} user={user} onLogout={async()=>{await sb.auth.signOut();}} onUpdate={async(data)=>{await sb.from("events").update(data).eq("id",event.id);Object.assign(event,data);}}/>}
        {screen==="user_settings"&&<MobileSettingsScreen user={user} event={event} sb={sb} setGuests={setGuests} setScreen={setScreen}/>}
        {screen==="settings_event"&&<EventDetailsScreen event={event} sb={sb} user={user} onLogout={async()=>{await sb.auth.signOut();}} onUpdate={async(data)=>{await sb.from("events").update(data).eq("id",event.id);Object.assign(event,data);}}/>}
      </div>
      <BottomNav active={screen} onChange={setScreen} userPackages={userPackages} totalGuests={total} trialExpired={trialExpired}/>
      {modal==="receipt"&&<ReceiptModal tables={tables} onClose={()=>setModal(null)}/>}
      {modal==="addTable"&&<AddTableModal onConfirm={doAddTable} onClose={()=>setModal(null)}/>}
    </div>);
  }
// ─── LUNSOUL THEME CONSTANTS ──────────────────────────────────────────────────
// ─── SCREEN BANNER (Purple header for each screen like LunSoul) ──────────────


// ─── STAT CARD (Colored cards like LunSoul) ───────────────────────────────────


// ─── LS BUTTON ───────────────────────────────────────────────────────────────


// ─── LS NAV ITEM ─────────────────────────────────────────────────────────────


// ─── DESKTOP HOME SCREEN (LunSoul style) ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// SIDOR-IL — LUNSOUL FULL LAYOUT v3
// Header + Left Nav + Right Sidebar + HomeScreen
// ═══════════════════════════════════════════════════════════════

function LSHomeScreen({ event, setScreen, setModal, guests, tables, seated, total, userPackages, sb }) {
  const allGuests = [...guests, ...tables.flatMap(t => t.guests||[])];
  const confirmed = allGuests.filter(g=>g.rsvp==="confirmed").reduce((s,g)=>s+(g.guest_count||1),0);
  const declined  = allGuests.filter(g=>g.rsvp==="declined").reduce((s,g)=>s+(g.guest_count||1),0);
  const pending   = allGuests.filter(g=>!g.rsvp||g.rsvp==="pending").reduce((s,g)=>s+(g.guest_count||1),0);
  const totalGuests = allGuests.reduce((s,g)=>s+(g.guest_count||1),0);
  const rsvpPct = totalGuests > 0 ? Math.round((confirmed+declined)/totalGuests*100) : 0;

  // Countdown
  const [countdown, setCountdown] = useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{
    if(!event.date) return;
    const calc=()=>{
      const diff = new Date(event.date) - new Date();
      if(diff<=0){setCountdown({d:0,h:0,m:0,s:0});return;}
      setCountdown({
        d:Math.floor(diff/86400000),
        h:Math.floor((diff%86400000)/3600000),
        m:Math.floor((diff%3600000)/60000),
        s:Math.floor((diff%60000)/1000)
      });
    };
    calc();
    const id=setInterval(calc,1000);
    return()=>clearInterval(id);
  },[event.date]);

  // Progress steps
  const steps = [
    {label:"יצירת אירוע", done:true},
    {label:"בחירת חבילה", done:userPackages.length>0},
    {label:"הוספת מוזמנים", done:allGuests.length>0},
    {label:"יצירת תזמון הודעות", done:false},
  ];
  const doneCount = steps.filter(s=>s.done).length;
  const progressPct = Math.round(doneCount/steps.length*100);

  // Invite URL
  const inviteUrl = `${window.location.origin}/#/invite/${event.invite_code||""}`;

  return (
    <div style={{direction:"rtl",overflowY:"auto",flex:1,background:LS.bg,padding:"24px 28px"}}>

      {/* ── HERO BANNER ── */}
      <div style={{
        background:"linear-gradient(135deg,#5B2DB8 0%,#7B4AE2 50%,#9B72F0 100%)",
        borderRadius:20,padding:"28px 32px",marginBottom:20,
        position:"relative",overflow:"hidden",
      }}>
        {/* Decorative circles */}
        <div style={{position:"absolute",top:-60,left:-60,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,.06)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:120,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.04)",pointerEvents:"none"}}/>

        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16,position:"relative",zIndex:1}}>
          <div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.65)",fontWeight:600,marginBottom:6}}>סקירה כללית</div>
            <div style={{fontSize:"clamp(22px,2.5vw,30px)",fontWeight:900,color:"#fff",marginBottom:16}}>
              {event.groom_name&&event.bride_name?`החתונה של ${event.groom_name} ו${event.bride_name}`:event.name}
            </div>
            {/* Countdown */}
            {event.date&&(
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {[["d","ימים"],["h","שעות"],["m","דקות"],["s","שניות"]].map(([k,l],i)=>(
                    <span key={k} style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{background:"rgba(0,0,0,.25)",borderRadius:8,padding:"4px 10px",fontSize:15,fontWeight:900,color:"#fff",minWidth:36,textAlign:"center",display:"inline-block"}}>
                        {String(countdown[k]).padStart(2,"0")}
                      </span>
                      <span style={{fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:600}}>{l}</span>
                      {i<3&&<span style={{color:"rgba(255,255,255,.4)",fontSize:16,fontWeight:300}}>:</span>}
                    </span>
                  ))}
                </div>
                <div style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:100,padding:"5px 14px",fontSize:12,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:6}}>
                  <span>📅</span>
                  {new Date(event.date).toLocaleDateString("he-IL",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                </div>
                {event.date>new Date().toISOString()&&(
                  <div style={{background:"rgba(255,255,255,.2)",borderRadius:100,padding:"5px 14px",fontSize:12,fontWeight:700,color:"#fff"}}>
                    התאריך נקבע! 🎉
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Calendar icon */}
          <div style={{width:56,height:56,borderRadius:16,background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>📅</div>
        </div>
      </div>

      {/* ── PROGRESS ── */}
      <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",marginBottom:16,border:`1px solid ${LS.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:800,color:LS.text}}>השלימו את האירוע</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:13,color:LS.muted,fontWeight:600}}>{doneCount} / {steps.length}</div>
            <div style={{
              width:44,height:44,borderRadius:"50%",
              background:`conic-gradient(#7B4AE2 ${progressPct*3.6}deg, #EDE8FF ${progressPct*3.6}deg)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              position:"relative"
            }}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:LS.purple}}>{progressPct}%</div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {steps.map((s,i)=>(
            <div key={i} style={{
              display:"flex",alignItems:"center",gap:8,flex:"1 1 160px",
              padding:"12px 16px",borderRadius:12,
              background:s.done?"#ECFDF5":i===steps.filter(x=>x.done).length?"rgba(107,61,212,.06)":"#fafafa",
              border:`1.5px solid ${s.done?"#A7F3D0":i===steps.filter(x=>x.done).length?LS.purple+"44":"#F0F0F0"}`,
              cursor:!s.done?"pointer":"default",transition:"all .15s"
            }}
            onClick={()=>{if(!s.done&&i===1)setScreen("packages");else if(!s.done&&i===2)setScreen("rsvp");else if(!s.done&&i===3)setScreen("whatsapp");}}
            onMouseEnter={e=>{if(!s.done)e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:s.done?"#22C55E":i===steps.filter(x=>x.done).length?"linear-gradient(135deg,#5B2DB8,#7B4AE2)":"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {s.done?<span style={{color:"#fff",fontSize:13,fontWeight:900}}>✓</span>:<span style={{color:i===steps.filter(x=>x.done).length?"#fff":"#9CA3AF",fontSize:12}}>→</span>}
              </div>
              <span style={{fontSize:12,fontWeight:700,color:s.done?"#059669":i===steps.filter(x=>x.done).length?LS.purple:LS.muted}}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3 MAIN CARDS ROW ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>

        {/* RSVP Progress */}
        <div style={{background:"#fff",borderRadius:16,padding:"20px",border:`1px solid ${LS.border}`}}>
          <div style={{fontSize:14,fontWeight:800,color:LS.text,marginBottom:14}}>התקדמות אישורי הגעה</div>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
            <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
              <svg width="72" height="72" style={{transform:"rotate(-90deg)"}}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="#F3F0FF" strokeWidth="8"/>
                <circle cx="36" cy="36" r="30" fill="none" stroke="#F59E0B" strokeWidth="8"
                  strokeDasharray={`${rsvpPct*1.885} 188.5`} strokeLinecap="round"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:16,fontWeight:900,color:LS.text}}>{rsvpPct}%</div>
                <div style={{fontSize:9,color:LS.muted,fontWeight:600}}>שיעור מענה</div>
              </div>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
              {[["מגיעים","#22C55E",confirmed],["לא מגיעים","#EF4444",declined],["ממתינים","#F59E0B",pending]].map(([l,c,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
                    <span style={{fontSize:12,color:LS.muted}}>{l}</span>
                  </div>
                  <span style={{fontSize:14,fontWeight:800,color:LS.text}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <LSBtn primary full small onClick={()=>setScreen("rsvp")}>לניהול אורחים ←</LSBtn>
        </div>

        {/* Gifts */}
        <div style={{background:"#fff",borderRadius:16,padding:"20px",border:`1px solid ${LS.border}`,position:"relative",overflow:"hidden"}}>
          <div style={{fontSize:14,fontWeight:800,color:LS.text,marginBottom:8}}>פירוט מתנות</div>
          <div style={{fontSize:11,color:LS.muted,marginBottom:14}}>קבלו מתנות באשראי ישירות מהאורחים</div>
          {/* Blurred content - locked */}
          <div style={{filter:"blur(5px)",pointerEvents:"none",marginBottom:12}}>
            <div style={{fontSize:28,fontWeight:900,color:LS.purple}}>₪24,200</div>
            <div style={{height:6,borderRadius:3,background:"linear-gradient(90deg,#7B4AE2,#9B72F0,#F59E0B)",marginTop:8,marginBottom:8}}/>
            <div style={{fontSize:12,color:LS.muted}}>12 מתנות התקבלו</div>
          </div>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(255,255,255,.4)",backdropFilter:"blur(2px)"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#F59E0B,#D97706)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:10,boxShadow:"0 4px 14px rgba(245,158,11,.4)"}}>🔒</div>
            <div style={{fontSize:12,fontWeight:700,color:LS.text,marginBottom:4,textAlign:"center"}}>הפעלת מתנות</div>
            <div style={{fontSize:11,color:LS.muted,textAlign:"center",marginBottom:12}}>אפשרו לאורחים לשלוח מתנה בקלות</div>
            <LSBtn primary small onClick={()=>setScreen("settings")}>הפעלת מתנות</LSBtn>
          </div>
        </div>

        {/* Messages */}
        <div style={{background:"#fff",borderRadius:16,padding:"20px",border:`1px solid ${LS.border}`,position:"relative",overflow:"hidden"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{fontSize:14,fontWeight:800,color:LS.text}}>הודעות</div>
            <span style={{fontSize:18,color:LS.muted}}>✈️</span>
          </div>
          <div style={{fontSize:11,color:LS.muted,marginBottom:14,lineHeight:1.5}}>שליחה אוטומטית לכל האורחים בלחיצה אחת</div>
          {/* Blurred */}
          <div style={{filter:"blur(4px)",pointerEvents:"none",marginBottom:12}}>
            {[["הזמנה ראשונה","#22C55E","נשלח"],["תזכורת","#F59E0B","בהמתנה"],["תודה","#9CA3AF","טרם נשלח"]].map(([l,c,s])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${LS.border}`}}>
                <span style={{fontSize:12,color:LS.text}}>{l}</span>
                <span style={{fontSize:11,color:c,fontWeight:700}}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(255,255,255,.4)",backdropFilter:"blur(2px)"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:10,boxShadow:"0 4px 14px rgba(107,61,212,.35)"}}>🔒</div>
            <div style={{fontSize:12,fontWeight:700,color:LS.text,marginBottom:4,textAlign:"center"}}>הזמנות, תזכורות ותודות</div>
            <div style={{fontSize:11,color:LS.muted,textAlign:"center",marginBottom:12}}>נשלחות אוטומטית בזמן הנכון</div>
            <LSBtn primary small onClick={()=>setScreen("packages")} style={{background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)"}}>שדרוג חבילה ✨</LSBtn>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>

        {/* Recent activity */}
        <div style={{background:"#fff",borderRadius:16,padding:"20px",border:`1px solid ${LS.border}`}}>
          <div style={{fontSize:14,fontWeight:800,color:LS.text,marginBottom:14}}>פעילות אחרונה</div>
          {allGuests.filter(g=>g.rsvp!=="pending").length===0?(
            <div style={{textAlign:"center",padding:"20px 0",color:LS.muted,fontSize:13}}>עדיין אין תגובות</div>
          ):(
            allGuests.filter(g=>g.rsvp!=="pending").slice(0,4).map(g=>(
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${LS.border}`}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:g.rsvp==="confirmed"?"#DCFCE7":"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:g.rsvp==="confirmed"?"#16A34A":"#DC2626",flexShrink:0}}>{g.name[0]}</div>
                <div style={{flex:1,fontSize:12,fontWeight:600,color:LS.text}}>{g.name}</div>
                <span style={{fontSize:10,color:g.rsvp==="confirmed"?"#16A34A":"#DC2626",fontWeight:700}}>{g.rsvp==="confirmed"?"✓ מגיע":"✗ לא מגיע"}</span>
              </div>
            ))
          )}
        </div>

        {/* Quick actions */}
        <div style={{background:"#fff",borderRadius:16,padding:"20px",border:`1px solid ${LS.border}`}}>
          <div style={{fontSize:14,fontWeight:800,color:LS.text,marginBottom:14}}>פעולות מהירות</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {icon:"🏛️",label:"ספקים לאירוע",desc:"גלו ספקים מובילים",action:()=>{}},
              {icon:"👀",label:"צפה בהזמנה",desc:"ראה כאורח",action:()=>window.open(`${window.location.origin}/#/invite/${event.invite_code||""}`,"_blank")},
              {icon:"🎨",label:"שינוי עיצוב הזמנה",desc:"שנה תבנית וצבעים",action:()=>setScreen("invite")},
              {icon:"📦",label:"שינוי חבילה",desc:"שדרג או שנה",action:()=>setScreen("packages")},
              {icon:"🖼️",label:"שינוי תמונה",desc:"עדכן תמונה בהזמנה",action:()=>setScreen("settings")},
              {icon:"🍽️",label:"הוספת מנות",desc:"הוסף אפשרויות מנות",action:()=>setScreen("settings")},
            ].map(item=>(
              <div key={item.label} onClick={item.action}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,cursor:"pointer",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=LS.purpleXL;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                <div style={{width:36,height:36,borderRadius:10,background:LS.purpleXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{item.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:LS.text}}>{item.label}</div>
                  <div style={{fontSize:11,color:LS.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.desc}</div>
                </div>
                <span style={{color:LS.muted,fontSize:12}}>←</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite link + feedback */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Invite link */}
          <div style={{background:"#fff",borderRadius:16,padding:"20px",border:`1px solid ${LS.border}`,flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:LS.text,marginBottom:6}}>קישור להזמנה</div>
            <div style={{fontSize:11,color:LS.muted,marginBottom:12}}>שתף את הקישור להזמנה עם האורחים</div>
            <div style={{background:LS.purpleXL,borderRadius:10,padding:"8px 12px",fontSize:11,color:LS.purple,fontWeight:600,marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",border:`1px solid ${LS.purple}22`,direction:"ltr",textAlign:"left"}}>
              🔗 {inviteUrl.replace("https://","").substring(0,35)}...
            </div>
            <LSBtn primary full small onClick={()=>{navigator.clipboard.writeText(inviteUrl).then(()=>alert("הקישור הועתק!"));}}>העתק</LSBtn>
            <div style={{marginTop:12}}>
              <div style={{fontSize:11,color:LS.muted,marginBottom:8}}>שתף ברשתות החברתיות</div>
              <div style={{display:"flex",gap:8}}>
                {[["𝕏","#000"],["f","#1877F2"],["✈","#229ED9"],["💬","#25D366"]].map(([ic,bg])=>(
                  <div key={ic} style={{width:34,height:34,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:ic==="f"?15:12,fontWeight:900,cursor:"pointer",transition:"transform .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                    {ic}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div style={{background:"linear-gradient(135deg,#FFFBEB,#FEF3C7)",borderRadius:16,padding:"16px 20px",border:"1px solid #FDE68A",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#F59E0B,#D97706)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⭐</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:"#92400E"}}>נהנים מהמערכת?</div>
              <div style={{fontSize:11,color:"#B45309"}}>נשמח אם תשאירו לנו חוות דעת 💕</div>
            </div>
            <LSBtn small onClick={()=>{}} style={{background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#fff",border:"none",fontSize:11,flexShrink:0}}>השאר חוות דעת ⭐</LSBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FULL LUNSOUL DESKTOP APP ─────────────────────────────────────────────────
function LSDesktopApp({ user, event, onBack, tables, guests, selected, setSelected,
  view, setView, screen, setScreen, modal, setModal, editGuestData, setEditGuestData,
  loading, saving, search, setSearch, newGuest, setNewGuest, mobile,
  userPackages, trialExpired, trialHours, editTableData, setEditTableData,
  addGuest, editGuest, addTable, doAddTable, deleteTable, editTable,
  dropOnTable, removeFromTable, moveTablePos, saveTablePos,
  seated, total, loadAll, sb, setShowLanding,
  venueElements, setVenueElements }) {

  const [rightSub, setRightSub] = useState(null); // sub-screen in right sidebar

  const NAV_MAIN = [
    {id:"home",    icon:"📊", label:"סקירה כללית"},
    {id:"rsvp",    icon:"👥", label:"ניהול אורחים"},
    {id:"seating", icon:"🪑", label:"סידורי הושבה"},
    {id:"whatsapp",icon:"💬", label:"הודעות"},
    {id:"vendors", icon:"🏛️", label:"ספקים"},
    {id:"more",    icon:"⋯",  label:"עוד"},
  ];

  const NAV_MORE = [
    {id:"import", icon:"📊",label:"ייבוא אורחים"},
    {id:"budget", icon:"💰",label:"ניהול תקציב"},
    {id:"ai",     icon:"🤖",label:"AI חכם"},
    {id:"sms",    icon:"📱",label:"SMS"},
  ];

  const RIGHT_SETTINGS = [
    {id:"settings", icon:"👤",label:"פרטי האירוע",   sub:"שמות, תאריך ומיקום"},
    {id:"meals",    icon:"🍽️",label:"סוגי מנות",     sub:"העדפות מנות לאורחים"},
    {id:"gifts",    icon:"💝",label:"מתנות",          sub:"Bit והעברות"},
    {id:"seating",  icon:"🪑",label:"סידורי הושבה",  sub:"מצב הושבה ואפשרויות"},
    {id:"media",    icon:"🖼️",label:"מדיה",           sub:"תמונה ותיאור"},
    {id:"design",   icon:"🎨",label:"עיצוב",          sub:"תבנית וצבעים"},
    {id:"packages", icon:"📦",label:"חבילה",          sub:"בחירת חבילת אורחים"},
  ];

  const isLocked=(id)=>{
    if(["home","packages","settings","user_settings","invite","media","design","gifts","meals","seating_settings"].includes(id)) return false;
    if(id==="rsvp") return !userPackages.some(p=>["basic","seating","sms","auto","vip","staff"].includes(p));
    if(id==="seating") return !userPackages.some(p=>["seating","sms","auto","vip","staff"].includes(p));
    if(["sms","whatsapp"].includes(id)) return !userPackages.some(p=>["auto","vip"].includes(p));
    if(["ai","budget","import"].includes(id)) return userPackages.length===0;
    return false;
  };

  const nav=(id)=>{
    if(isLocked(id)){setScreen("packages");return;}
    if(id==="vendors"){window.open("https://sidor-il.co.il/vendors","_blank");return;}
    setScreen(id);
  };

  return (
    <div dir="rtl" style={{fontFamily:"'Heebo',sans-serif",background:LS.bg,color:LS.text,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#D4C9F0;border-radius:4px}
        .ls-nav-btn:hover{background:${LS.purpleXL}!important;color:${LS.purple}!important}
      `}</style>

      {/* ══ TOP HEADER ══ */}
      <header style={{
        height:52, background:"#fff",
        borderBottom:`1px solid ${LS.border}`,
        display:"flex", alignItems:"center",
        padding:"0 16px", flexShrink:0, gap:0, zIndex:100,
        boxShadow:"0 1px 8px rgba(107,61,212,.05)"
      }}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0,paddingLeft:12,borderLeft:`1px solid ${LS.border}`,marginLeft:12,height:52}}>
          <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:900}}>◈</div>
          <span style={{fontWeight:900,fontSize:15,color:LS.purple}}>Sidor-IL</span>
        </div>

        {/* Main nav */}
        <nav style={{display:"flex",flex:1,gap:0,alignItems:"center",height:"100%"}}>
          {NAV_MAIN.map(item=>(
            <button key={item.id} onClick={()=>nav(item.id)}
              style={{
                height:"100%", padding:"0 14px",
                background:screen===item.id?"transparent":"transparent",
                color:screen===item.id?LS.purple:LS.muted,
                border:"none",
                borderBottom:screen===item.id?`3px solid ${LS.purple}`:"3px solid transparent",
                fontSize:13,fontWeight:screen===item.id?700:500,
                cursor:"pointer",fontFamily:"inherit",
                display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",
                transition:"all .15s", position:"relative",
              }}
              className="ls-nav-btn">
              <span style={{fontSize:14}}>{item.icon}</span>
              {item.label}
              {isLocked(item.id)&&<span style={{fontSize:9,background:"#FEF3C7",color:"#D97706",borderRadius:4,padding:"1px 4px"}}>🔒</span>}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,paddingRight:12,borderRight:`1px solid ${LS.border}`,marginRight:12}}>
          {saving&&<div style={{width:14,height:14,borderRadius:"50%",border:"2px solid #D4C9F0",borderTopColor:LS.purple,animation:"spin .7s linear infinite"}}/>}

          {/* User */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,background:LS.purpleXL,border:`1px solid ${LS.border}`,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.background="#E0D9F5"}
            onMouseLeave={e=>e.currentTarget.style.background=LS.purpleXL}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:900}}>
              {(user.email||"U")[0].toUpperCase()}
            </div>
            <span style={{fontSize:12,fontWeight:600,color:LS.text}}>{event.groom_name||user.email?.split("@")[0]||"משתמש"}</span>
          </div>

          <button onClick={async()=>{await sb.auth.signOut();}}
            style={{background:"none",border:`1px solid ${LS.border}`,borderRadius:7,padding:"5px 10px",fontSize:12,fontWeight:600,color:LS.muted,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}
            onMouseEnter={e=>{e.currentTarget.style.color="#EF4444";e.currentTarget.style.borderColor="#FECDCD";}}
            onMouseLeave={e=>{e.currentTarget.style.color=LS.muted;e.currentTarget.style.borderColor=LS.border;}}>
            ← התנתק
          </button>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ══ MAIN CONTENT ══ */}
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0}}>

          {screen==="home"&&<LSHomeScreen event={event} setScreen={setScreen} setModal={setModal}
            guests={guests} tables={tables} seated={seated} total={total}
            userPackages={userPackages} sb={sb}/>}

          {screen==="seating"&&<SeatingSection
            tables={tables} guests={guests} selected={selected} setSelected={setSelected}
            search={search} setSearch={setSearch} newGuest={newGuest} setNewGuest={setNewGuest}
            addGuest={addGuest} dropOnTable={dropOnTable} removeFromTable={removeFromTable}
            onAddTable={addTable} editGuestData={editGuestData} setEditGuestData={setEditGuestData}
            editTable={editTable} deleteTable={deleteTable}
            moveTablePos={moveTablePos} saveTablePos={saveTablePos}
            setEditTableData={setEditTableData} setModal={setModal}
            view={view} setView={setView} saving={saving} seated={seated} total={total}
            venueElements={venueElements} setVenueElements={setVenueElements}/>}

          {screen==="rsvp"&&(
            <div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}>
              <ScreenBanner icon="👥" title="ניהול אורחים" subtitle="ניהול רשימת אורחים לאירוע"/>
              <DesktopRsvpTable guests={guests} tables={tables} event={event} sb={sb} loadAll={loadAll} setGuests={()=>{}} setTables={()=>{}} onAddGuest={()=>setModal("addGuest")}/>
            </div>
          )}

          {screen==="whatsapp"&&(
            <div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}>
              <ScreenBanner icon="💬" title="שליחת הודעות" subtitle="מרכז הודעות"/>
              <WhatsAppScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>
            </div>
          )}

          {screen==="sms"&&(
            <div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}>
              <ScreenBanner icon="📱" title="הודעות SMS" subtitle="שליחת הודעות SMS"/>
              <SMSScreen event={event} guests={[...guests,...tables.flatMap(t=>t.guests||[])]}/>
            </div>
          )}

          {screen==="import"&&(
            <div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}>
              <ScreenBanner icon="📊" title="ייבוא אורחים" subtitle="ייבוא מ-Excel או הדבקה"/>
              <div style={{background:"#fff",borderRadius:20,padding:28,border:`1px solid ${LS.border}`}}>
                <div style={{background:LS.purpleXL,border:`2px dashed ${LS.purple}55`,borderRadius:16,padding:32,textAlign:"center",marginBottom:24}}>
                  <div style={{fontSize:40,marginBottom:10}}>📊</div>
                  <div style={{fontSize:16,fontWeight:800,color:LS.purple,marginBottom:6}}>ייבוא מ-Excel</div>
                  <label style={{background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",color:"#fff",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-block"}}>
                    📂 בחר קובץ Excel
                    <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={async e=>{
                      const file=e.target.files[0];if(!file)return;
                      try{const{read,utils}=await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");const buf=await file.arrayBuffer();const wb=read(buf);const ws=wb.Sheets[wb.SheetNames[0]];const rows=utils.sheet_to_json(ws);const toImport=rows.map(r=>({name:String(r["שם"]||r["name"]||"").trim(),phone:String(r["טלפון"]||r["phone"]||"").trim()||null,rsvp:"pending",guest_count:1,event_id:event.id,table_id:null})).filter(g=>g.name.length>1);if(toImport.length>0){await sb.from("guests").insert(toImport);await loadAll();}alert(`✅ יובאו ${toImport.length} אורחים!`);}catch{alert("שגיאה");}
                    }}/>
                  </label>
                </div>
                <textarea id="importTextLS2" placeholder={"ישראל ישראלי, 050-1234567\nרונית לוי"} style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:14,padding:14,fontSize:14,color:LS.text,outline:"none",fontFamily:"inherit",minHeight:160,boxSizing:"border-box",marginBottom:14,resize:"vertical"}}/>
                <LSBtn primary full onClick={async()=>{const text=document.getElementById("importTextLS2")?.value||"";const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);const toInsert=lines.map(l=>{const p=l.split(",");return{name:p[0].trim(),phone:p[1]?.trim()||null,rsvp:"pending",guest_count:1,event_id:event.id,table_id:null};}).filter(g=>g.name.length>1);if(toInsert.length>0){await sb.from("guests").insert(toInsert);await loadAll();setScreen("rsvp");}}}>✓ ייבא אורחים</LSBtn>
              </div>
            </div>
          )}

          {screen==="budget"&&(<div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}><ScreenBanner icon="💰" title="ניהול תקציב" subtitle="מעקב הוצאות והכנסות"/><BudgetScreen event={event}/></div>)}
          {screen==="ai"&&(<div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}><ScreenBanner icon="🤖" title="AI סידור חכם" subtitle="סידור אוטומטי"/><AISeatingScreen event={event} tables={tables} guests={guests} onApply={async(a)=>{for(const{guestId,tableId}of a){await sb.from("guests").update({table_id:tableId||null}).eq("id",guestId);}await loadAll();setScreen("seating");}}/></div>)}
          {screen==="packages"&&(<div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}><ScreenBanner icon="📦" title="חבילות" subtitle="שדרג את הגרסה שלך"/><PackagesScreen event={event} onBack={()=>setScreen("home")}/></div>)}
          {screen==="settings"&&(<div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}><ScreenBanner icon="📋" title="פרטי האירוע" subtitle="הגדרות האירוע"/><EventDetailsScreen event={event} sb={sb} user={user} onLogout={async()=>sb.auth.signOut()} onUpdate={()=>{}}/></div>)}
          {screen==="user_settings"&&(<div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}><ScreenBanner icon="⚙️" title="הגדרות" subtitle="הגדרות המשתמש"/><MobileSettingsScreen user={user} event={event} sb={sb} setGuests={()=>{}} setScreen={setScreen}/></div>)}
          {screen==="invite"&&(<div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:LS.bg,direction:"rtl"}}><ScreenBanner icon="💌" title="הזמנה דיגיטלית" subtitle="עיצוב ושיתוף"/><InviteSettings event={event} onUpdate={()=>setScreen("home")}/></div>)}
        </div>

        {/* ══ RIGHT SIDEBAR ══ */}
        <aside style={{
          width:260, background:"#fff",
          borderRight:`1px solid ${LS.border}`,
          display:"flex", flexDirection:"column",
          flexShrink:0, height:"100%", overflowY:"auto",
        }}>
          {/* Back to events */}
          <div style={{padding:"11px 16px",borderBottom:`1px solid ${LS.border}`}}>
            <button onClick={()=>setShowLanding(true)}
              style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:LS.purple,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              ← חזרה לאירועים
            </button>
          </div>

          {/* Event info */}
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${LS.border}`}}>
            <div style={{fontSize:14,fontWeight:900,color:LS.text,marginBottom:5}}>
              {event.groom_name&&event.bride_name?`החתונה של ${event.groom_name} ואורנה`:event.name}
            </div>
            {event.date&&<div style={{fontSize:12,color:LS.muted,display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
              📅 {new Date(event.date).toLocaleDateString("he-IL",{day:"numeric",month:"short",year:"numeric"})}
            </div>}
            {/* Package badge */}
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"#FEF9C3",color:"#D97706",borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700,border:"1px solid #FDE68A",cursor:"pointer"}}
              onClick={()=>setScreen("packages")}>
              ✨ BASIC • 250 רשומות
            </div>
          </div>

          {/* Settings sections */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${LS.border}`}}>
            <div style={{padding:"6px 16px",fontSize:10,fontWeight:700,color:LS.muted,textTransform:"uppercase",letterSpacing:".06em"}}>הגדרות האירוע</div>
            {RIGHT_SETTINGS.map(item=>(
              <div key={item.id}
                onClick={()=>{
                  if(item.id==="packages")setScreen("packages");
                  else if(item.id==="seating")setScreen("seating");
                  else setScreen("settings");
                }}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",cursor:"pointer",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=LS.purpleXL}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:34,height:34,borderRadius:9,background:LS.purpleXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,border:`1px solid ${LS.border}`}}>
                  {item.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:LS.text}}>{item.label}</div>
                  <div style={{fontSize:11,color:LS.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.sub}</div>
                </div>
                <span style={{color:LS.muted,fontSize:11}}>←</span>
              </div>
            ))}
          </div>

          {/* View invite */}
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${LS.border}`}}>
            <button onClick={()=>window.open(`${window.location.origin}/#/invite/${event.invite_code||""}`,"_blank")}
              style={{width:"100%",background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 4px 12px rgba(107,61,212,.3)",marginBottom:6}}>
              👁 צפה בהזמנה
            </button>
            <button onClick={()=>setScreen("home")}
              style={{width:"100%",background:LS.purpleXL,color:LS.purple,border:`1px solid ${LS.border}`,borderRadius:12,padding:"8px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              ❓ עזרה ותמיכה
            </button>
          </div>

          {/* Footer links */}
          <div style={{padding:"12px 16px",marginTop:"auto"}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
              {["תקנון","נגישות","פרטיות"].map(s=>(
                <span key={s} style={{fontSize:11,color:LS.muted,cursor:"pointer"}}
                  onMouseEnter={e=>e.target.style.color=LS.purple}
                  onMouseLeave={e=>e.target.style.color=LS.muted}>{s}</span>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["צור קשר","חוות דעת"].map(s=>(
                <span key={s} style={{fontSize:11,color:LS.muted,cursor:"pointer"}}
                  onMouseEnter={e=>e.target.style.color=LS.purple}
                  onMouseLeave={e=>e.target.style.color=LS.muted}>{s}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}



  // ─── DESKTOP RETURN (LunSoul style) ─────────────────────
  return (
    <>
      <LSDesktopApp
        user={user} event={event} onBack={onBack}
        tables={tables} guests={guests} selected={selected} setSelected={setSelected}
        view={view} setView={setView} screen={screen} setScreen={setScreen}
        modal={modal} setModal={setModal}
        editGuestData={editGuestData} setEditGuestData={setEditGuestData}
        loading={loading} saving={saving}
        search={search} setSearch={setSearch}
        newGuest={newGuest} setNewGuest={setNewGuest}
        mobile={mobile}
        userPackages={userPackages.map(p=>p.package_id||p)}
        trialExpired={trialExpired} trialHours={trialHours}
        editTableData={editTableData} setEditTableData={setEditTableData}
        addGuest={addGuest} editGuest={editGuest} addTable={addTable} doAddTable={doAddTable}
        deleteTable={deleteTable} editTable={editTable}
        dropOnTable={dropOnTable} removeFromTable={removeFromTable}
        moveTablePos={moveTablePos} saveTablePos={saveTablePos}
        seated={seated} total={total} loadAll={loadAll} sb={sb}
        setShowLanding={setShowLanding}
        venueElements={venueElements} setVenueElements={setVenueElements}
      />
      {editGuestData&&<GuestModal guest={editGuestData} eventId={event.id} onClose={()=>setEditGuestData(null)} onSave={async(data)=>{await editGuest(editGuestData.id,data);setEditGuestData(null);}} desktop={true}/>}
      {editTableData&&<EditTableModal table={editTableData} onSave={async(name,type,seats)=>{await editTable(editTableData.id,name,type,seats);setEditTableData(null);}} onDelete={async()=>{await deleteTable(editTableData.id);setEditTableData(null);}} onClose={()=>setEditTableData(null)}/>}
      {modal==="addGuest"&&<GuestModal eventId={event.id} onClose={()=>setModal(null)} existingGuests={[...guests,...tables.flatMap(t=>t.guests||[])]} onSave={async(data)=>{await addGuest(data);setModal(null);}} desktop={true}/>}
      {modal==="receipt"&&<ReceiptModal tables={tables} onClose={()=>setModal(null)}/>}
      {modal==="addTable"&&<AddTableModal onConfirm={doAddTable} onClose={()=>setModal(null)}/>}
      <a href="https://wa.me/972526817102" target="_blank" rel="noopener"
        style={{position:"fixed",bottom:24,left:24,background:"#25D366",color:"#fff",borderRadius:"50%",width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,.5)",zIndex:200,textDecoration:"none"}}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <AccessibilityWidget/>
    </>
  );
}

// ─── BUDGET SCREEN ────────────────────────────────────────────────────────────
// ─── DESKTOP RSVP TABLE ───────────────────────────────────────────────────────
// ─── EVENT DETAILS SCREEN ─────────────────────────────────────────────────────
// ─── EVENT DETAILS SCREEN ─────────────────────────────────────────────────────
function EventDetailsScreen({ event, sb, user, onLogout, onUpdate }) {
  const [form,setForm]=useState({
    name:event.name||"",groom_name:event.groom_name||"",bride_name:event.bride_name||"",
    groom_father:event.groom_father||"",bride_father:event.bride_father||"",
    date:event.date||"",event_time:event.event_time||"",reception_time:event.reception_time||"",
    venue:event.venue||"",venue_address:event.venue_address||"",venue_map:event.venue_map||"",
    venue_phone:event.venue_phone||"",welcome_text:event.welcome_text||"",
    personal_text:event.personal_text||"",name_display:event.name_display||"full",
    invite_image:event.invite_image||"",bit_link:event.bit_link||"",paybox_link:event.paybox_link||"",
  });
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [myRole,setMyRole]=useState(event.my_role||"groom");
  const [settings,setSettings]=useState({
    confetti:event.settings_json?.confetti??true,popupRsvp:event.settings_json?.popupRsvp??false,
    autoRsvp:event.settings_json?.autoRsvp??true,tableNum:event.settings_json?.tableNum??true,
    hebrewDate:event.settings_json?.hebrewDate??true,countdown:event.settings_json?.countdown??true,
    shareBtn:event.settings_json?.shareBtn??true,
  });
  const [openSection,setOpenSection]=useState("couple");

  const save=async()=>{
    setSaving(true);
    await sb.from("events").update({...form,my_role:myRole,settings_json:settings}).eq("id",event.id);
    Object.assign(event,{...form,my_role:myRole,settings_json:settings});
    setSaving(false);setSaved(true);
    if(onUpdate)onUpdate({...event,...form});
    setTimeout(()=>setSaved(false),2500);
  };

  const hebrewDateStr=(dateStr)=>{
    if(!dateStr)return "";
    try{const d=new Date(dateStr);return d.toLocaleDateString("he-IL-u-ca-hebrew",{day:"numeric",month:"long",year:"numeric"});}catch{return "";}
  };

  // Section component
  const Section=({id,icon,title,children})=>{
    const isOpen=openSection===id;
    return(
      <div style={{background:"#fff",borderRadius:20,marginBottom:12,border:`1.5px solid ${isOpen?LS.purple+"44":LS.border}`,overflow:"hidden",transition:"border-color .2s"}}>
        <div onClick={()=>setOpenSection(isOpen?null:id)}
          style={{padding:"18px 22px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",background:isOpen?LS.purpleXL:"#fff",transition:"background .2s"}}
          onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background=LS.purpleXL+"88";}}
          onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background="#fff";}}>
          <div style={{width:38,height:38,borderRadius:12,background:isOpen?"linear-gradient(135deg,#5B2DB8,#7B4AE2)":LS.purpleXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,transition:"all .2s"}}>
            <span style={{filter:isOpen?"brightness(10)":"none"}}>{icon}</span>
          </div>
          <div style={{flex:1,fontSize:15,fontWeight:800,color:isOpen?LS.purple:LS.text}}>{title}</div>
          <span style={{color:LS.muted,fontSize:16,transition:"transform .2s",transform:isOpen?"rotate(180deg)":"none"}}>▾</span>
        </div>
        {isOpen&&<div style={{padding:"20px 22px",borderTop:`1px solid ${LS.border}`}}>{children}</div>}
      </div>
    );
  };

  const Field=({label,value,onChange,placeholder,type="text",maxLen,hint,half=false})=>(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <div style={{fontSize:11,fontWeight:700,color:LS.muted,textTransform:"uppercase",letterSpacing:".04em"}}>{label}{hint&&<span style={{color:"#ccc",fontWeight:400,fontSize:10,textTransform:"none"}}> — {hint}</span>}</div>
        {maxLen&&<div style={{fontSize:11,color:LS.muted}}>{(value||"").length}/{maxLen}</div>}
      </div>
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen}
        style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",color:LS.text,transition:"border-color .2s"}}
        onFocus={e=>e.target.style.borderColor=LS.purple} onBlur={e=>e.target.style.borderColor=LS.border}/>
    </div>
  );

  const Toggle=({label,desc,checked,onChange})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${LS.border}`}}>
      <div>
        <div style={{fontSize:14,fontWeight:700,color:LS.text}}>{label}</div>
        <div style={{fontSize:12,color:LS.muted,marginTop:2}}>{desc}</div>
      </div>
      <div onClick={onChange} style={{width:48,height:26,borderRadius:13,background:checked?"linear-gradient(135deg,#5B2DB8,#7B4AE2)":"#E5E7EB",cursor:"pointer",position:"relative",transition:"background .25s",flexShrink:0,marginRight:8,boxShadow:checked?"0 2px 8px rgba(107,61,212,.3)":"none"}}>
        <div style={{position:"absolute",top:3,right:checked?3:21,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"right .25s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
      </div>
    </div>
  );

  return(
    <div style={{direction:"rtl",padding:"0 0 40px",width:"100%",boxSizing:"border-box"}}>
      {/* Save button - sticky */}
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(240,235,254,.95)",backdropFilter:"blur(8px)",padding:"12px 0 12px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:13,color:LS.muted}}>מחובר כ: <strong style={{color:LS.text}}>{user.email}</strong></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onLogout} style={{background:"transparent",color:LS.danger,border:`1.5px solid ${LS.danger}44`,borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🚪 התנתק</button>
          <button onClick={save} disabled={saving}
            style={{background:saved?"linear-gradient(135deg,#059669,#22C55E)":"linear-gradient(135deg,#5B2DB8,#7B4AE2)",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(107,61,212,.3)",transition:"all .2s"}}>
            {saving?"שומר...":saved?"✓ נשמר!":"שמור שינויים"}
          </button>
        </div>
      </div>

      {/* 1. פרטי בני הזוג */}
      <Section id="couple" icon="💍" title="פרטי בני הזוג">
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".04em"}}>מי אני</div>
          <div style={{display:"flex",gap:8}}>
            {[["groom","🤵 החתן"],["bride","👰 הכלה"]].map(([v,l])=>(
              <button key={v} onClick={()=>setMyRole(v)}
                style={{flex:1,padding:"10px",borderRadius:12,border:`2px solid ${myRole===v?LS.purple:LS.border}`,background:myRole===v?"linear-gradient(135deg,#5B2DB8,#7B4AE2)":LS.purpleXL,color:myRole===v?"#fff":LS.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,transition:"all .2s"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="שם החתן *" value={form.groom_name} onChange={v=>setForm(f=>({...f,groom_name:v}))} placeholder="עמית" maxLen={25}/>
          <Field label="שם הכלה *" value={form.bride_name} onChange={v=>setForm(f=>({...f,bride_name:v}))} placeholder="אורנה" maxLen={25}/>
          <Field label="הורי החתן" value={form.groom_father} onChange={v=>setForm(f=>({...f,groom_father:v}))} placeholder="שמות הורי החתן" maxLen={75}/>
          <Field label="הורי הכלה" value={form.bride_father} onChange={v=>setForm(f=>({...f,bride_father:v}))} placeholder="שמות הורי הכלה" maxLen={75}/>
        </div>
        <Field label="שם האירוע *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="חתונת עמית ואורנה"/>
      </Section>

      {/* 2. תאריך ושעה */}
      <Section id="date" icon="📅" title="תאריך ושעה">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:".04em"}}>תאריך האירוע</div>
            <input type="date" dir="ltr" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
              style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",color:LS.text}}
              onFocus={e=>e.target.style.borderColor=LS.purple} onBlur={e=>e.target.style.borderColor=LS.border}/>
            {form.date&&<div style={{fontSize:11,color:LS.purple,marginTop:5,fontWeight:600}}>📅 {hebrewDateStr(form.date)}</div>}
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:".04em"}}>קבלת פנים</div>
            <input type="time" value={form.reception_time} onChange={e=>setForm(f=>({...f,reception_time:e.target.value}))}
              style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",color:LS.text}}/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:".04em"}}>תחילת טקס</div>
            <input type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))}
              style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",color:LS.text}}/>
          </div>
        </div>
      </Section>

      {/* 3. מקום האירוע */}
      <Section id="venue" icon="📍" title="מקום האירוע">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="שם המקום *" value={form.venue} onChange={v=>setForm(f=>({...f,venue:v}))} placeholder="אלכסנדר" maxLen={55}/>
          <Field label="כתובת *" value={form.venue_address} onChange={v=>setForm(f=>({...f,venue_address:v}))} placeholder="המסיק 2, עמק חפר"/>
          <Field label="קישור מפה" value={form.venue_map} onChange={v=>setForm(f=>({...f,venue_map:v}))} placeholder="Waze / Google Maps"/>
          <Field label="טלפון האולם" type="tel" value={form.venue_phone} onChange={v=>setForm(f=>({...f,venue_phone:v}))} placeholder="098332266"/>
        </div>
      </Section>

      {/* 4. הזמנה דיגיטלית */}
      <Section id="invite" icon="💌" title="נוסח ההזמנה הדיגיטלית">
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div style={{fontSize:11,fontWeight:700,color:LS.muted,textTransform:"uppercase",letterSpacing:".04em"}}>נוסח ההזמנה</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {form.welcome_text?.trim()&&<button onClick={()=>setForm(f=>({...f,welcome_text:""}))}
                style={{fontSize:11,color:LS.danger,background:"#FEF2F2",border:`1px solid ${LS.danger}44`,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>
                איפוס
              </button>}
              <div style={{fontSize:11,color:LS.muted}}>{(form.welcome_text||"").length}/800</div>
            </div>
          </div>
          <textarea value={form.welcome_text} onChange={e=>setForm(f=>({...f,welcome_text:e.target.value}))} maxLength={800}
            placeholder="אנו שמחים להזמינכם לחגוג איתנו..."
            style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:90,resize:"vertical",color:LS.text,transition:"border-color .2s"}}
            onFocus={e=>e.target.style.borderColor=LS.purple} onBlur={e=>e.target.style.borderColor=LS.border}/>
          <div style={{fontSize:11,color:LS.muted,marginTop:6}}>להדגשת טקסט: **טקסט** → <strong>טקסט</strong></div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".04em"}}>תצוגת שם אורח בהזמנה</div>
          <div style={{display:"flex",gap:8}}>
            {[["full","שם מלא"],["first","שם פרטי"],["none","ללא שם"]].map(([v,l])=>(
              <button key={v} onClick={()=>setForm(f=>({...f,name_display:v}))}
                style={{flex:1,padding:"9px",borderRadius:10,border:`1.5px solid ${form.name_display===v?LS.purple:LS.border}`,background:form.name_display===v?LS.purpleXL:"#fff",color:form.name_display===v?LS.purple:LS.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,transition:"all .15s"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 5. תמונת הזמנה */}
      <Section id="image" icon="🖼️" title="תמונת הזמנה">
        {form.invite_image&&(
          <div style={{marginBottom:14,position:"relative",display:"inline-block"}}>
            <img src={form.invite_image} alt="הזמנה" style={{maxWidth:"100%",maxHeight:180,borderRadius:12,objectFit:"contain",border:`1.5px solid ${LS.border}`}} onError={e=>e.target.style.display="none"}/>
            <button onClick={()=>setForm(f=>({...f,invite_image:""}))}
              style={{position:"absolute",top:-8,right:-8,width:24,height:24,borderRadius:"50%",background:LS.danger,color:"#fff",border:"none",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>×</button>
          </div>
        )}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",border:"none",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff",boxShadow:"0 4px 12px rgba(107,61,212,.3)"}}>
            📁 העלה תמונה
            <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
              const file=e.target.files[0];if(!file)return;
              if(file.size>5*1024*1024){alert("הקובץ גדול מדי. מקסימום 5MB");return;}
              const path=`invite_images/${event.id}_${Date.now()}.${file.name.split(".").pop()}`;
              const{error}=await sb.storage.from("event-images").upload(path,file,{upsert:true});
              if(error){alert("שגיאה בהעלאה: "+error.message);return;}
              const{data}=sb.storage.from("event-images").getPublicUrl(path);
              setForm(f=>({...f,invite_image:data.publicUrl}));
            }}/>
          </label>
          <div style={{flex:1,minWidth:200}}>
            <input value={form.invite_image} onChange={e=>setForm(f=>({...f,invite_image:e.target.value}))}
              placeholder="או הכנס קישור URL לתמונה..."
              style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",color:LS.text}}
              onFocus={e=>e.target.style.borderColor=LS.purple} onBlur={e=>e.target.style.borderColor=LS.border}/>
          </div>
        </div>
      </Section>

      {/* 6. קישורי תשלום */}
      <Section id="payment" icon="💝" title="קישורי מתנה דיגיטלית">
        <div style={{fontSize:12,color:LS.muted,marginBottom:16}}>הוסף קישור לBit או Paybox — יופיע כפתור "תן מתנה" בהזמנה.</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[["bit_link","Bit","💚","#1DB954","https://bit.ly/... או מספר טלפון"],["paybox_link","Paybox","💜","#6B46C1","https://payboxapp.com/..."]].map(([key,name,ic,color,ph])=>(
            <div key={key}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:30,height:30,borderRadius:9,background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{ic}</div>
                <div style={{fontSize:13,fontWeight:700,color:LS.text}}>{name}</div>
              </div>
              <input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}
                style={{width:"100%",background:LS.purpleXL,border:`1.5px solid ${LS.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",color:LS.text}}
                onFocus={e=>e.target.style.borderColor=LS.purple} onBlur={e=>e.target.style.borderColor=LS.border}/>
            </div>
          ))}
          {(form.bit_link||form.paybox_link)&&(
            <div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#059669"}}>
              ✅ כפתור "תן מתנה" יופיע בהזמנה הדיגיטלית
            </div>
          )}
        </div>
      </Section>

      {/* 7. הגדרות נוספות */}
      <Section id="settings" icon="⚙️" title="הגדרות נוספות">
        {[
          {key:"confetti",label:"אפקט קונפטי",desc:"מציג אפקט קונפטי מעל תמונת הקאבר"},
          {key:"popupRsvp",label:"אישורי הגעה Popup",desc:"מציג הודעה קופצת עם האורח האחרון שאישר"},
          {key:"autoRsvp",label:"גלילה אוטומטית",desc:"בכניסה להזמנה ינגלל לאישור ההגעה"},
          {key:"tableNum",label:"מספר שולחן בהזמנה",desc:"מציג מספר שולחן לאורח שאישר הגעה"},
          {key:"hebrewDate",label:"תאריך עברי",desc:"מציג תאריך עברי בהזמנה"},
          {key:"countdown",label:"ספירה לאחור",desc:"מציג מונה ימים ושעות לאירוע"},
          {key:"shareBtn",label:"כפתור שיתוף",desc:"מציג אפשרויות לשיתוף ההזמנה"},
        ].map(item=>(
          <Toggle key={item.key} label={item.label} desc={item.desc} checked={settings[item.key]} onChange={()=>setSettings(s=>({...s,[item.key]:!s[item.key]}))}/>
        ))}
      </Section>
    </div>
  );
}

function DesktopRsvpTable({ guests, tables, event, sb, loadAll, setGuests, setTables, onAddGuest }) {
  const allGuests=[...guests,...tables.flatMap(t=>t.guests||[])];
  const [search,setSearch]=useState("");
  const [editG,setEditG]=useState(null);
  const [saving,setSaving]=useState(false);
  const [filterRsvp,setFilterRsvp]=useState("all");
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
    const nameClean=editG.name.trim().toLowerCase();
    const phoneClean=(editG.phone||"").trim().replace(/\D/g,"");
    const dup=allGuests.find(g=>{
      if(g.id===editG.id)return false;
      const nameMatch=g.name.trim().toLowerCase()===nameClean;
      const phoneMatch=phoneClean&&g.phone&&g.phone.replace(/\D/g,"")===phoneClean;
      return nameMatch||phoneMatch;
    });
    if(dup){
      const ok=window.confirm(`קיים אורח דומה: "${dup.name}" (${dup.phone||"ללא טלפון"})\nהאם להמשיך בכל זאת?`);
      if(!ok)return;
    }
    setSaving(true);
    const oldGift=allGuests.find(g=>g.id===editG.id)?.gift||0;
    const newGift=Number(editG.gift||0);
    await sb.from("guests").update({
      name:editG.name,phone:editG.phone,rsvp:editG.rsvp,
      guest_count:editG.guest_count,relation:editG.relation,
      note:editG.note||"",gift:newGift
    }).eq("id",editG.id);
    // סנכרון מתנה לניהול תקציב
    if(newGift!==oldGift){
      const budgetName=`מתנה  -  ${editG.name}`;
      const{data:existing}=await sb.from("budget_items").select("id").eq("event_id",event.id).eq("name",budgetName).single();
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
            <tr style={{background:"#1B3A8C",borderBottom:"3px solid #122e70"}}>
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
                new Date(updatedAt).toLocaleDateString("he-IL",{day:"2-digit",month:"2-digit",year:"numeric"})
                +" | "+new Date(updatedAt).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})
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
                  {getTableNum(g)?<span style={{background:"#1B3A8C",color:"#fff",borderRadius:5,padding:"2px 7px",fontWeight:800,fontSize:12}}>{getTableNum(g)}</span>:<span style={{color:"#CBD5E0"}}> - </span>}
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
            style={{background:filterType===v?"#1B3A8C":"#fff",color:filterType===v?"#fff":"#2B6CB0",border:"2px solid #BEE3F8",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {l}
          </button>
        ))}
      </div>

      {/* טבלה */}
      <div style={{background:"#fff",boxShadow:"0 2px 16px rgba(0,0,0,.08)",overflowX:"auto",borderTop:"2px solid #C3D3F5",borderBottom:"2px solid #C3D3F5",width:"100%"}}>
        <table style={{width:"100%",minWidth:320,borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:"#1B3A8C",borderBottom:"3px solid #122e70"}}>
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
  const [selectedTier,setSelectedTier]=useState(null);

  const TIER5=[["עד 50",80],["עד 100",120],["עד 150",180],["עד 200",240],["עד 250",280],["עד 300",340],["עד 350",390],["עד 400",430],["עד 450",480],["עד 500",520]];
  const TIER6=[["עד 100",250],["עד 150",370],["עד 200",480],["עד 250",590],["עד 300",690],["עד 350",790],["עד 400",880],["עד 450",970],["עד 500",1050]];

  const packages=[
    {id:"free",name:"חינם",priceLabel:"₪0",color:"#64748B",icon:"🎁",badge:null,featured:false,desc:"התחל בחינם, שתף ידנית",features:[["הזמנה דיגיטלית יפה",true],["שיתוף ידני בוואטסאפ",true],["אישורי הגעה אוטומטיים",false],["שליחת SMS",false],["WhatsApp אוטומטי",false],["סידורי הושבה",false]]},
    {id:"basic",name:"בסיסית",priceLabel:"₪50",color:"#3B82F6",icon:"💌",badge:null,featured:false,desc:"הזמנה + אישורי הגעה",features:[["הזמנה דיגיטלית יפה",true],["שיתוף ידני + קישור אישי",true],["אישורי הגעה דרך WhatsApp",true],["עדכון בזמן אמת",true],["שליחה אוטומטית",false],["סידורי הושבה",false]]},
    {id:"seating",name:"מתקדמת",priceLabel:"₪150",color:LS.purple,icon:"🪑",badge:"⭐ הכי פופולרי",featured:true,desc:"הכל + סידורי הושבה",features:[["כל מה שבבסיסית",true],["סידורי הושבה מלאים",true],["מפה אינטראקטיבית",true],["גרירת אורחים לשולחנות",true],["פתק הושבה להדפסה",true],["AI סידור חכם",true]]},
    {id:"auto",name:"אוטומציה",priceLabel:"לפי כמות",color:"#22C55E",icon:"💬",badge:"חדש",featured:false,desc:"WhatsApp אוטומטי + SMS",tiers:TIER5,features:[["כל מה שבמתקדמת",true],["2 סבבי WhatsApp אוטומטי",true],["תזכורת SMS לקראת האירוע",true],["הודעת תודה אחרי האירוע",true],["שליחה לאורחים שלא ענו",true]]},
    {id:"sms",name:"SMS",priceLabel:"לפי כמות",color:"#059669",icon:"📱",badge:"תוספת",featured:false,desc:"שליחת SMS לאורחים",note:"דורש חבילת מתקדמת. תוספת ₪100.",smsPacks:[[150,70],[300,90],[500,120],[800,170],[1000,200]],features:[["כל מה שבמתקדמת",true],["שליחת SMS לכל האורחים",true],["תזכורות לפני האירוע",true],["מספר שולחן ב-SMS",true],["הודעת תודה",true]]},
    {id:"staff",name:"צוות הושבה",priceLabel:"החל מ ₪1,300",color:"#7C3AED",icon:"👥",badge:"שירות פרימיום",featured:false,desc:"2 אנשי צוות ביום האירוע",features:[["2 אנשי צוות ביום האירוע",true],["חלוקת פתקי הושבה",true],["ניהול תורים בכניסה",true],["תיאום מול צוות האולם",true],["צמצום עומס ברזרבות",true]]},
    {id:"vip",name:"VIP + מוקד",priceLabel:"לפי כמות",color:"#B45309",icon:"👑",badge:"VIP",featured:false,desc:"הכל + שיחות טלפוניות",tiers:TIER6,features:[["כל מה שבאוטומציה",true],["3 סבבי שיחות טלפוניות",true],["שיחות חוזרות לאורחים",true],["דוח מפורט של כל השיחות",true],["תמיכה ייעודית",true]]},
  ];

  const handleBuy=(pkg)=>{
    if(pkg.id==="free")return;
    let msg=`לרכישת חבילת "${pkg.name}"`;
    if(selectedTier)msg+=` - ${selectedTier[0]} רשומות - ₪${selectedTier[1].toLocaleString()}`;
    else if(pkg.price)msg+=` - ₪${pkg.price}`;
    window.open(`https://wa.me/972526817102?text=${encodeURIComponent("שלום, אני מעוניין "+msg)}`,"_blank");
  };

  return(
    <div style={{direction:"rtl",fontFamily:"'Heebo',sans-serif",paddingBottom:60}}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {packages.map(pkg=>{
          const isOpen=selectedPkg?.id===pkg.id;
          return(
            <div key={pkg.id} style={{background:"#fff",border:`2px solid ${isOpen?pkg.color:pkg.featured?pkg.color+"44":LS.border}`,borderRadius:18,overflow:"hidden",boxShadow:isOpen?`0 8px 28px ${pkg.color}22`:pkg.featured?`0 4px 16px ${pkg.color}15`:"none",transition:"all .2s"}}>
              <div onClick={()=>{setSelectedPkg(isOpen?null:pkg);setSelectedTier(null);}}
                style={{padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,borderRadius:14,background:pkg.color+"18",border:`1.5px solid ${pkg.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  {pkg.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <div style={{fontWeight:900,fontSize:15,color:LS.text}}>{pkg.name}</div>
                    {pkg.badge&&<span style={{fontSize:10,fontWeight:800,background:pkg.color,color:"#fff",padding:"2px 8px",borderRadius:100}}>{pkg.badge}</span>}
                  </div>
                  <div style={{fontSize:12,color:LS.muted}}>{pkg.desc}</div>
                </div>
                <div style={{textAlign:"left",flexShrink:0}}>
                  <div style={{fontSize:17,fontWeight:900,color:pkg.color}}>{pkg.priceLabel}</div>
                  <div style={{fontSize:10,color:LS.muted,textAlign:"center"}}>{isOpen?"▲ סגור":"▼ פתח"}</div>
                </div>
              </div>

              {isOpen&&(
                <div style={{padding:"0 18px 18px",borderTop:`1px solid ${LS.border}`}}>
                  {pkg.note&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"10px 12px",marginTop:14,marginBottom:14,fontSize:12,color:"#B45309",fontWeight:700}}>⚠️ {pkg.note}</div>}

                  <div style={{marginTop:pkg.note?0:14,marginBottom:16,display:"flex",flexDirection:"column",gap:6}}>
                    {pkg.features.map(([f,ok])=>(
                      <div key={f} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:ok?LS.text:LS.muted}}>
                        <span style={{width:18,height:18,borderRadius:"50%",background:ok?pkg.color+"18":"#F3F4F6",color:ok?pkg.color:"#9CA3AF",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ok?"✓":"✕"}</span>
                        <span style={{textDecoration:ok?"none":"line-through"}}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {pkg.tiers&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:LS.muted,marginBottom:8}}>בחר כמות אורחים:</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,maxHeight:200,overflowY:"auto"}}>
                        {pkg.tiers.map(([label,price])=>(
                          <div key={label} onClick={e=>{e.stopPropagation();setSelectedTier(selectedTier?.[0]===label?null:[label,price]);}}
                            style={{border:`1.5px solid ${selectedTier?.[0]===label?pkg.color:LS.border}`,borderRadius:10,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:selectedTier?.[0]===label?pkg.color+"12":"#fff",cursor:"pointer",transition:"all .15s"}}>
                            <span style={{fontSize:12,color:LS.muted}}>{label} רשומות</span>
                            <span style={{fontSize:13,fontWeight:800,color:pkg.color}}>₪{price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pkg.smsPacks&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:LS.muted,marginBottom:8}}>בחר כמות SMS:</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                        {pkg.smsPacks.map(([sms,price])=>(
                          <div key={sms} onClick={e=>{e.stopPropagation();setSelectedTier(selectedTier?.[0]===sms?null:[sms,price]);}}
                            style={{border:`1.5px solid ${selectedTier?.[0]===sms?pkg.color:LS.border}`,borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"pointer",background:selectedTier?.[0]===sms?pkg.color+"12":"#fff",transition:"all .15s"}}>
                            <div style={{fontSize:14,fontWeight:800,color:pkg.color}}>{sms.toLocaleString()}</div>
                            <div style={{fontSize:9,color:LS.muted,marginBottom:2}}>SMS</div>
                            <div style={{fontSize:12,fontWeight:700,color:LS.text}}>₪{price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pkg.id==="free"?(
                    <div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:12,padding:"12px",textAlign:"center",fontSize:13,color:"#059669",fontWeight:700}}>✅ אתה משתמש בחבילה זו כעת</div>
                  ):(
                    <LSBtn primary full onClick={e=>{e.stopPropagation();handleBuy(pkg);}} disabled={!!(pkg.tiers||pkg.smsPacks)&&!selectedTier}
                      style={{background:(pkg.tiers||pkg.smsPacks)&&!selectedTier?"#E5E7EB":`linear-gradient(135deg,${pkg.color},${pkg.color}CC)`,color:(pkg.tiers||pkg.smsPacks)&&!selectedTier?LS.muted:"#fff",boxShadow:"none"}}>
                      {(pkg.tiers||pkg.smsPacks)&&!selectedTier?"בחר כמות תחילה 👆":`💬 פנה לרכישה בוואטסאפ${selectedTier?` — ₪${selectedTier[1].toLocaleString()}`:""}` }
                    </LSBtn>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div style={{background:LS.purpleXL,border:`1px solid ${LS.border}`,borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
          <div style={{fontSize:12,color:LS.muted,marginBottom:4}}>💳 תשלום מאובטח</div>
          <div style={{fontSize:11,color:LS.muted}}>Apple Pay · Google Pay · Bit · Visa · Mastercard</div>
        </div>
      </div>
    </div>
  );
}


function SMSScreen({ event, guests }) {
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
  const [filterRsvp,setFilterRsvp]=useState("all");
  const [sending,setSending]=useState(false);
  const [progress,setProgress]=useState(0);
  const [results,setResults]=useState(null);
  const [previewGuest,setPreviewGuest]=useState(null);
  const [smsBalance,setSmsBalance]=useState(null);
  const [showSmsSchedule,setShowSmsSchedule]=useState(false);
  const [smsScheduleEnabled,setSmsScheduleEnabled]=useState([true,true,true,true]);

  useEffect(()=>{
    if(guests.length>0&&!previewGuest)setPreviewGuest(guests[0]);
  },[guests]);

  // כשנוסח ההזמנה משתנה בפרטי האירוע  -  עדכן את ה-template
  useEffect(()=>{
    if(selectedTemplate==="invite"){
      setMsgText(smsInviteText);
    }
  },[event.welcome_text]);

  // טעינת יתרת SMS מ-Supabase
  useEffect(()=>{
    sb.from("sms_balance").select("*").eq("event_id",event.id).single()
      .then(({data})=>{
        setSmsBalance(data?.balance??0);
      }).catch(()=>setSmsBalance(0));
  },[event.id]);

  const withPhone=guests.filter(g=>g.phone&&g.phone.trim().length>6);
  const toSend=filterRsvp==="all"?withPhone
    :filterRsvp==="pending"?withPhone.filter(g=>!g.rsvp||g.rsvp==="pending")
    :withPhone.filter(g=>g.rsvp===filterRsvp);

  const buildPreview=(g)=>{
    if(!g)return msgText;
    return msgText
      .replace(/{שם}/g,g.name.split(" ")[0])
      .replace(/{שם מלא}/g,g.name)
      .replace(/{קישור}/g,`${inviteUrl}?g=${g.id}`)
      .replace(/{שולחן}/g,"3");
  };

  const charCount=msgText.length;
  const smsCount=charCount<=160?1:Math.ceil(charCount/153);
  const totalSmsNeeded=smsCount*toSend.length;
  const hasBalance=smsBalance===null||smsBalance>=totalSmsNeeded;

  const buyPackage=async(amount,price)=>{
    if(!window.confirm(`לרכוש ${amount} SMS ב-₪${price}?\n(תשלום דרך PayPlus יתווסף בקרוב)`))return;
    // עדכן יתרה ב-Supabase
    const{data:existing}=await sb.from("sms_balance").select("*").eq("event_id",event.id).single().catch(()=>({data:null}));
    if(existing){
      const newBal=(existing.balance||0)+amount;
      await sb.from("sms_balance").update({balance:newBal,total_purchased:(existing.total_purchased||0)+amount,updated_at:new Date().toISOString()}).eq("event_id",event.id);
      setSmsBalance(newBal);
    } else {
      await sb.from("sms_balance").insert({event_id:event.id,balance:amount,total_purchased:amount,total_sent:0});
      setSmsBalance(amount);
    }
    alert(`✅ ${amount} SMS נוספו ליתרה שלך!`);
  };

  const pickTemplate=(t)=>{setSelectedTemplate(t.id);setMsgText(t.text);};

  const sendAll=async()=>{
    if(toSend.length===0){alert("אין אורחים לשליחה עם מספר טלפון");return;}
    if(smsBalance!==null&&smsBalance<totalSmsNeeded){
      alert(`אין מספיק SMS!\nנדרש: ${totalSmsNeeded} | יתרה: ${smsBalance}\nרכוש SMS נוספים למטה.`);return;
    }
    if(!window.confirm(`לשלוח SMS ל-${toSend.length} אורחים? (${totalSmsNeeded} SMS)`))return;
    setSending(true);setProgress(0);setResults(null);
    try{
      let p=0;
      const iv=setInterval(()=>{p=Math.min(p+4,92);setProgress(p);},300);
      const{data,error}=await sb.functions.invoke("send-sms",{
        body:{
          guests:toSend.map(g=>({id:g.id,name:g.name,phone:g.phone,table:g.table_id})),
          message:msgText,
          inviteUrl,
          source:"Sidor-IL",
        }
      });
      clearInterval(iv);
      if(error)throw new Error(error.message);
      setProgress(100);
      const res=data?.results||[];
      setResults(res);
      const sent=res.filter(r=>r.status?.includes("✓")).length*smsCount;
      if(sent>0&&smsBalance!==null){
        const newBal=Math.max(0,smsBalance-sent);
        await sb.from("sms_balance").update({balance:newBal,updated_at:new Date().toISOString()}).eq("event_id",event.id);
        setSmsBalance(newBal);
      }
    }catch(e){
      alert("שגיאה בשליחה: "+e.message);
    }
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
              {totalSmsNeeded>0?`נדרש לשליחה: ${totalSmsNeeded} SMS`:"בחר אורחים לשליחה"}
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[[150,70],[300,90],[500,120],[800,170],[1000,200],[2000,330]].map(([amt,price])=>(
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
          💳 תשלום מאובטח · Apple Pay · Google Pay · Bit · Visa
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
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:C.muted}}>
              <span>{charCount} תווים</span>
              <span style={{color:smsCount>1?C.danger:C.muted,fontWeight:smsCount>1?700:400}}>
                {smsCount} SMS {smsCount>1?"(מרובה)":""}
              </span>
            </div>
          </div>

          {/* פילטר */}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>👥 למי לשלוח?</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {v:"all",    l:`כולם (${withPhone.length})`,                                              c:"#2B6CB0"},
                {v:"pending",l:`ממתינים (${withPhone.filter(g=>!g.rsvp||g.rsvp==="pending").length})`,   c:"#718096"},
                {v:"confirmed",l:`מגיעים (${withPhone.filter(g=>g.rsvp==="confirmed").length})`,          c:"#276749"},
                {v:"declined", l:`לא מגיעים (${withPhone.filter(g=>g.rsvp==="declined").length})`,       c:"#C53030"},
              ].map(f=>(
                <button key={f.v} onClick={()=>setFilterRsvp(f.v)}
                  style={{background:filterRsvp===f.v?f.c:"#fff",color:filterRsvp===f.v?"#fff":f.c,
                    border:`2px solid ${f.c}`,borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,
                    cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {f.l}
                </button>
              ))}
            </div>

          {/* תזמון שליחה SMS */}
          {(()=>{
            const eventD=event.date?new Date(event.date):null;
            const calcDate=(daysOffset)=>{if(!eventD)return "";const d=new Date(eventD);d.setDate(d.getDate()+daysOffset);return d.toISOString().split("T")[0];};
            const templateMap=["invite","reminder","table","thanks"];
            const defs=[
              {label:"שבוע וחצי לפני",desc:"הזמנה ראשונה",date:calcDate(-11),time:"10:00",icon:"💌",templateId:"invite"},
              {label:"4 ימים לפני",desc:"תזכורת לממתינים",date:calcDate(-4),time:"10:00",icon:"🔔",templateId:"reminder"},
              {label:"ביום האירוע",desc:"מספר שולחן",date:calcDate(0),time:"09:00",icon:"🎉",templateId:"table"},
              {label:"יומיים אחרי",desc:"הודעת תודה",date:calcDate(2),time:"10:00",icon:"💙",templateId:"thanks"},
            ];
            return(
              <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:showSmsSchedule?10:0}}>
                  <div style={{fontSize:14,fontWeight:800,color:C.text}}>⏰ תזמון שליחות</div>
                  <button onClick={()=>setShowSmsSchedule(s=>!s)} style={{background:showSmsSchedule?"#EEF2FF":"#F7FAFC",color:showSmsSchedule?C.blue:"#555",border:`1px solid ${showSmsSchedule?C.blueL:"#E2E8F0"}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    {showSmsSchedule?"סגור":"ערוך תזמונים"}
                  </button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {defs.map((s,i)=>{
                    const d=s.date?new Date(s.date+"T00:00:00"):null;
                    const disp=d?d.toLocaleDateString("he-IL",{weekday:"short",day:"numeric",month:"short"}):"לא הוגדר";
                    const tpl=TEMPLATES.find(t=>t.id===s.templateId);
                    const preview=tpl?tpl.text.replace("{שם}","[שם האורח]").replace("{קישור}","[קישור]").replace("{שולחן}","[מס' שולחן]").substring(0,80)+"...":"";
                    return(
                      <div key={i} style={{border:`1.5px solid ${smsScheduleEnabled[i]?C.border:"#E2E8F0"}`,borderRadius:10,padding:"9px 12px",background:smsScheduleEnabled[i]?"#FAFAFA":"#F5F5F5",opacity:smsScheduleEnabled[i]?1:0.6}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:smsScheduleEnabled[i]?6:0}}>
                          <span style={{fontSize:17}}>{s.icon}</span>
                          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:C.text}}>{s.label}</div><div style={{fontSize:10,color:C.muted}}>{s.desc}</div></div>
                          {/* Toggle */}
                          <div onClick={()=>setSmsScheduleEnabled(arr=>{const n=[...arr];n[i]=!n[i];return n;})}
                            style={{width:38,height:22,borderRadius:11,background:smsScheduleEnabled[i]?C.blue:"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                            <div style={{position:"absolute",top:2,left:smsScheduleEnabled[i]?18:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                          </div>
                          {!showSmsSchedule&&smsScheduleEnabled[i]&&<div style={{fontSize:10,color:C.muted}}>{disp} {s.time}</div>}
                        </div>
                        {smsScheduleEnabled[i]&&<>
                        {/* תצוגת הטקסט */}
                        <div style={{background:"#EEF2FF",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#3D5475",lineHeight:1.5,marginBottom:showSmsSchedule?8:0}}>
                          📝 {preview}
                          <button onClick={()=>{setSelectedTemplate(s.templateId);setMsgText(tpl?.text||"");}}
                            style={{display:"inline-block",marginRight:6,background:C.blue,color:"#fff",border:"none",borderRadius:5,padding:"2px 6px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            ערוך
                          </button>
                        </div>
                        {showSmsSchedule&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
                          <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:3}}>תאריך</div><input type="date" dir="ltr" defaultValue={s.date} id={`sms_date_${i}`} dir="ltr" style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"7px 8px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>
                          <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:3}}>שעה</div><input type="time" defaultValue={s.time} id={`sms_time_${i}`} style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"7px 8px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>
                        </div>}
                        </>}
                      </div>
                    );
                  })}
                  {showSmsSchedule&&<button onClick={()=>{const saved=defs.map((s,i)=>({...s,date:document.getElementById("sms_date_"+i)?.value||s.date,time:document.getElementById("sms_time_"+i)?.value||s.time}));alert("✅ נשמר!\n"+saved.map(s=>s.icon+" "+s.label+": "+s.date+" "+s.time).join("\n"));setShowSmsSchedule(false);}} style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>💾 שמור תזמונים</button>}
                  {!eventD&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"7px 10px",fontSize:11,color:"#B45309"}}>⚠️ הגדר תאריך אירוע בפרטי האירוע</div>}
                </div>
              </div>
            );
          })()}

          </div>

          {/* כפתור שליחה */}
          <button onClick={sendAll} disabled={sending||toSend.length===0||!hasBalance}
            style={{width:"100%",background:sending||toSend.length===0||!hasBalance?"#A0AEC0":`linear-gradient(135deg,${C.blue},${C.blueM})`,
              color:"#fff",border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:800,
              cursor:sending||toSend.length===0||!hasBalance?"default":"pointer",fontFamily:"inherit",
              boxShadow:sending||toSend.length===0||!hasBalance?"none":"0 4px 20px rgba(41,82,200,.4)",transition:"all .2s"}}>
            {sending?`שולח... ${progress}%`:!hasBalance?`⚠️ אין מספיק SMS (יתרה: ${smsBalance||0})`:`📱 שלח SMS ל-${toSend.length} אורחים`}
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
                📊 {smsCount} SMS × {toSend.length} אורחים = <strong>{totalSmsNeeded} SMS</strong><br/>
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
  const [filterRsvp,setFilterRsvp]=useState("all");
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
  const toSend=filterRsvp==="all"?withPhone
    :filterRsvp==="pending"?withPhone.filter(g=>!g.rsvp||g.rsvp==="pending")
    :withPhone.filter(g=>g.rsvp===filterRsvp);

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
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {v:"all",    l:`כולם (${withPhone.length})`,                                               c:"#2B6CB0"},
                {v:"pending",l:`ממתינים (${withPhone.filter(g=>!g.rsvp||g.rsvp==="pending").length})`,    c:"#718096"},
                {v:"confirmed",l:`מגיעים (${withPhone.filter(g=>g.rsvp==="confirmed").length})`,           c:"#276749"},
                {v:"declined", l:`לא מגיעים (${withPhone.filter(g=>g.rsvp==="declined").length})`,        c:"#C53030"},
              ].map(f=>(
                <button key={f.v} onClick={()=>setFilterRsvp(f.v)}
                  style={{background:filterRsvp===f.v?f.c:"#fff",color:filterRsvp===f.v?"#fff":f.c,
                    border:`2px solid ${f.c}`,borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,
                    cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {/* תזמון שליחה */}
          <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:800,color:C.text}}>⏰ תזמון שליחות</div>
              <button onClick={()=>setShowSchedule(s=>!s)}
                style={{background:showSchedule?"#EEF2FF":"#F7FAFC",color:showSchedule?C.blue:"#555",border:`1px solid ${showSchedule?C.blueL:"#E2E8F0"}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {showSchedule?"סגור":"ערוך תזמונים"}
              </button>
            </div>

            {(()=>{
              // חישוב תאריכי ברירת מחדל לפי תאריך האירוע
              const eventD=event.date?new Date(event.date):null;
              const calcDate=(daysOffset)=>{
                if(!eventD) return "";
                const d=new Date(eventD);
                d.setDate(d.getDate()+daysOffset);
                return d.toISOString().split("T")[0];
              };

              const defaultSchedules=[
                {label:"שבוע וחצי לפני",desc:"הזמנה ראשונה",date:calcDate(-11),time:"10:00",icon:"💌",templateId:"invite"},
                {label:"4 ימים לפני",desc:"תזכורת לממתינים",date:calcDate(-4),time:"10:00",icon:"🔔",templateId:"reminder"},
                {label:"ביום האירוע",desc:"מספר שולחן",date:calcDate(0),time:"09:00",icon:"🎉",templateId:"table"},
                {label:"יומיים אחרי",desc:"הודעת תודה",date:calcDate(2),time:"10:00",icon:"💙",templateId:"thanks"},
              ];

              return(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {defaultSchedules.map((s,i)=>{
                    const key=`wa_schedule_${i}`;
                    const d=s.date?new Date(s.date+"T00:00:00"):null;
                    const displayDate=d?d.toLocaleDateString("he-IL",{weekday:"short",day:"numeric",month:"short"}):"תאריך לא הוגדר";
                    const tpl=TEMPLATES.find(t=>t.id===s.templateId);
                    const preview=tpl?tpl.text.replace("{שם}","[שם האורח]").replace("{קישור}","[קישור]").replace("{שולחן}","[מס' שולחן]").substring(0,80)+"...":"";
                    return(
                      <div key={i} style={{border:`1.5px solid ${waScheduleEnabled[i]?C.border:"#E2E8F0"}`,borderRadius:12,padding:"10px 12px",background:waScheduleEnabled[i]?"#FAFAFA":"#F5F5F5",opacity:waScheduleEnabled[i]?1:0.6}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:waScheduleEnabled[i]?6:0}}>
                          <div style={{fontSize:20,flexShrink:0}}>{s.icon}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:800,color:C.text}}>{s.label}</div>
                            <div style={{fontSize:11,color:C.muted}}>{s.desc}</div>
                          </div>
                          {/* Toggle */}
                          <div onClick={()=>setWaScheduleEnabled(arr=>{const n=[...arr];n[i]=!n[i];return n;})}
                            style={{width:38,height:22,borderRadius:11,background:waScheduleEnabled[i]?"#25D366":"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                            <div style={{position:"absolute",top:2,left:waScheduleEnabled[i]?18:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                          </div>
                          {!showSchedule&&waScheduleEnabled[i]&&(
                            <div style={{textAlign:"left",fontSize:11,color:C.muted}}>{displayDate} {s.time}</div>
                          )}
                        </div>
                        {waScheduleEnabled[i]&&<>
                        {/* תצוגת טקסט */}
                        <div style={{background:"#F0FFF4",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#276749",lineHeight:1.5,marginBottom:showSchedule?8:0}}>
                          📝 {preview}
                          <button onClick={()=>{setSelectedTemplate(s.templateId);setMsgText(tpl?.text||"");}}
                            style={{display:"inline-block",marginRight:6,background:"#25D366",color:"#fff",border:"none",borderRadius:5,padding:"2px 6px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            ערוך
                          </button>
                        </div>
                        {showSchedule&&(
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            <div>
                              <div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:3}}>תאריך</div>
                              <input type="date" dir="ltr" defaultValue={s.date} id={`wa_date_${i}`}
                                dir="ltr" style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"7px 8px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:3}}>שעה</div>
                              <input type="time" defaultValue={s.time} id={`wa_time_${i}`}
                                style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"7px 8px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                            </div>
                          </div>
                        )}
                        </>}
                      </div>
                    );
                  })}

                  {showSchedule&&(
                    <button onClick={()=>{
                      // שמירת כל 4 התזמונים
                      const saved=defaultSchedules.map((s,i)=>({
                        ...s,
                        date:document.getElementById(`wa_date_${i}`)?.value||s.date,
                        time:document.getElementById(`wa_time_${i}`)?.value||s.time,
                      }));
                      alert("✅ התזמונים נשמרו!\n"+saved.map(s=>`${s.icon} ${s.label}: ${s.date} ${s.time}`).join("\n"));
                      setShowSchedule(false);
                    }}
                      style={{background:`linear-gradient(135deg,${C.blue},${C.blueM})`,color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                      💾 שמור תזמונים
                    </button>
                  )}

                  {!eventD&&(
                    <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#B45309"}}>
                      ⚠️ הגדר תאריך אירוע בפרטי האירוע כדי לחשב תאריכים אוטומטית
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* כפתור שליחה */}
          <button onClick={sendAll} disabled={sending||toSend.length===0}
            style={{width:"100%",background:sending||toSend.length===0?"#A0AEC0":"linear-gradient(135deg,#075E54,#25D366)",
              color:"#fff",border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:800,
              cursor:sending||toSend.length===0?"default":"pointer",fontFamily:"inherit",
              boxShadow:sending||toSend.length===0?"none":"0 4px 20px rgba(37,211,102,.4)",transition:"all .2s"}}>
            {sending?`שולח... ${progress}%`:`💬 שלח ל-${toSend.length} אורחים`}
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
function AISeatingScreen({ event, tables, guests, onApply }) {
  const allGuests=[...guests,...tables.flatMap(t=>t.guests||[])];
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [groupByRelation,setGroupByRelation]=useState(true);
  const [fillEmpty,setFillEmpty]=useState(true);

  const runSmartSeating=()=>{
    setLoading(true);
    setTimeout(()=>{
      const unseated=[...guests]; // רק ממתינים
      const assignments=[];

      // קבץ לפי קטגוריה
      const byRelation={};
      unseated.forEach(g=>{
        const rel=g.relation||"ללא שיוך";
        if(!byRelation[rel])byRelation[rel]=[];
        byRelation[rel].push(g);
      });

      // עותק של שולחנות עם מקומות פנויים
      const tableSlots=tables.map(t=>({
        ...t,
        used:(t.guests||[]).length,
        free:t.seats-(t.guests||[]).length
      })).filter(t=>t.free>0);

      if(groupByRelation){
        // שבץ לפי קטגוריה  -  כל קטגוריה לשולחן אחד
        Object.entries(byRelation).forEach(([rel,gList])=>{
          let remaining=[...gList];
          for(const tbl of tableSlots){
            if(remaining.length===0)break;
            while(tbl.free>0&&remaining.length>0){
              const g=remaining.shift();
              assignments.push({guestId:g.id,tableId:tbl.id,reason:`${rel} → ${tbl.name}`});
              tbl.free--;tbl.used++;
            }
          }
        });
      }else{
        // שבץ לפי סדר  -  מלא שולחן אחד לפני הבא
        let remaining=[...unseated];
        for(const tbl of tableSlots){
          while(tbl.free>0&&remaining.length>0){
            const g=remaining.shift();
            assignments.push({guestId:g.id,tableId:tbl.id,reason:`סידור לפי זמינות → ${tbl.name}`});
            tbl.free--;
          }
        }
      }

      const summary=`שובצו ${assignments.length} אורחים מתוך ${unseated.length} ממתינים`;
      setResult({assignments,summary});
      setLoading(false);
    },600);
  };

  return(
    <div style={{direction:"rtl",padding:24,maxWidth:700,margin:"0 auto"}}>
      <div style={{fontSize:20,fontWeight:900,color:"#1A202C",marginBottom:6}}>🪑 סידור הושבה חכם</div>
      <div style={{fontSize:13,color:"#718096",marginBottom:20}}>סידור אוטומטי לפי קטגוריות ומקומות פנויים</div>

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
          {key:"groupByRelation",label:"קבץ לפי קטגוריית קרבה",desc:"משפחה קרובה ביחד, חברים ביחד וכו'",val:groupByRelation,set:setGroupByRelation},
          {key:"fillEmpty",label:"מלא שולחנות ריקים קודם",desc:"תעדוף שולחנות עם פחות אורחים",val:fillEmpty,set:setFillEmpty},
        ].map(item=>(
          <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #F7FAFC"}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#1A202C"}}>{item.label}</div>
              <div style={{fontSize:12,color:"#718096"}}>{item.desc}</div>
            </div>
            <div onClick={()=>item.set(s=>!s)}
              style={{width:44,height:24,borderRadius:12,background:item.val?"#276749":"#CBD5E0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,right:item.val?2:20,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"right .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
        ))}
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
        {result&&<button onClick={()=>onApply(result.assignments)}
          style={{flex:1,background:"#276749",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          ✅ אשר וסיים
        </button>}
      </div>
    </div>
  );
}

function AddTableModal({ onConfirm, onClose }) {
  const [name,setName]=useState("");
  const [type,setType]=useState("round");
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(26,16,53,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:380,direction:"rtl",boxShadow:"0 8px 40px rgba(107,61,212,.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🪑</div>
          <div>
            <div style={{fontWeight:900,fontSize:17,color:LS.text}}>הוסף שולחן</div>
            <div style={{fontSize:12,color:LS.muted}}>הגדר שם וסוג שולחן</div>
          </div>
        </div>

        <LSInput label="שם השולחן" value={name} onChange={setName} placeholder="שולחן 1" style={{marginBottom:14}} onKeyDown={e=>e.key==="Enter"&&name.trim()&&onConfirm(name,type)}/>

        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>סוג שולחן</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.entries(TABLE_TYPES).map(([k,v])=>(
              <button key={k} onClick={()=>setType(k)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,border:`2px solid ${type===k?LS.purple:LS.border}`,background:type===k?LS.purpleXL:"#fff",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                <span style={{fontSize:20}}>{v.icon}</span>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700,color:type===k?LS.purple:LS.text}}>{v.label}</div>
                  <div style={{fontSize:11,color:LS.muted}}>{v.defaultSeats} מושבים ברירת מחדל</div>
                </div>
                {type===k&&<div style={{marginRight:"auto",width:20,height:20,borderRadius:"50%",background:LS.purple,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:900}}>✓</div>}
              </button>
            ))}
          </div>
        </div>

        <div style={{display:"flex",gap:8}}>
          <LSBtn ghost full onClick={onClose}>ביטול</LSBtn>
          <LSBtn primary full onClick={()=>name.trim()&&onConfirm(name,type)} disabled={!name.trim()}>הוסף שולחן ✓</LSBtn>
        </div>
      </div>
    </div>
  );
}


function InvitePage({ code, guestId }) {
  const [event,setEvent]=useState(null);
  const [loading,setLoading]=useState(true);
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [phone,setPhone]=useState("");
  const [guestCount,setGuestCount]=useState(1);
  const [rsvp,setRsvp]=useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [knownGuest,setKnownGuest]=useState(null); // אורח מזוהה מהקישור
  // duplicate detection
  const [dupGuest,setDupGuest]=useState(null);
  const [showDupModal,setShowDupModal]=useState(false);

  useEffect(()=>{
    sb.from("events").select("*").eq("invite_code",code).eq("invite_active",true).single()
      .then(async({data})=>{
        setEvent(data||null);setLoading(false);
        if(data){
          sb.from("events").update({views:(data.views||0)+1}).eq("id",data.id);
          // אם יש guestId  -  טען את פרטי האורח ומלא אוטומטית
          if(guestId){
            const{data:g}=await sb.from("guests").select("*").eq("id",guestId).single();
            if(g){
              setKnownGuest(g);
              const parts=g.name?.split(" ")||[];
              setFirstName(parts[0]||"");
              setLastName(parts.slice(1).join(" ")||"");
              setPhone(g.phone||"");
              setGuestCount(g.guest_count||1);
              if(g.rsvp&&g.rsvp!=="pending")setRsvp(g.rsvp);
              // עדכן צפיות של האורח
              sb.from("guests").update({views:(g.views||0)+1}).eq("id",g.id);
            }
          }
        }
      });
  },[code,guestId]);

  const doInsert=async()=>{
    const fullName=`${firstName.trim()}${lastName.trim()?" "+lastName.trim():""}`;
    if(knownGuest){
      // עדכן את האורח הידוע מהקישור
      await sb.from("guests").update({rsvp,guest_count:guestCount,phone:phone.trim()||knownGuest.phone||null,views:(knownGuest.views||0)+1}).eq("id",knownGuest.id);
    } else {
      await sb.from("guests").insert({name:fullName,phone:phone.trim()||null,rsvp,guest_count:guestCount,event_id:event.id,table_id:null,views:1});
    }
    setSubmitted(true);setSubmitting(false);setShowDupModal(false);
  };

  const doUpdate=async()=>{
    await sb.from("guests").update({rsvp,guest_count:guestCount,phone:phone.trim()||dupGuest.phone||null,views:(dupGuest.views||0)+1}).eq("id",dupGuest.id);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}} @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
      {showDupModal&&<DupModal/>}

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


// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────

// ─── CREATE EVENT SCREEN ──────────────────────────────────────────────────────

function CreateEventScreen({ user, onSelect, onLogout }) {
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",date:"",event_type:"wedding",groom_name:"",bride_name:"",venue:"",venue_address:"",event_time:""});

  useEffect(()=>{
    sb.from("events").select("*").eq("user_id",user.id).order("created_at",{ascending:false})
      .then(({data})=>{
        const evs=data||[];
        setEvents(evs);
        if(evs.length===1){onSelect(evs[0]);return;}
        if(evs.length===0){setShowForm(true);}
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

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:LS.bg}}><div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${LS.border}`,borderTopColor:LS.purple,animation:"spin .7s linear infinite"}}/></div>);

  const eventTypes=[["wedding","💍","חתונה"],["bar_mitzvah","✡️","בר/ת מצווה"],["brit","👶","ברית"],["other","🎉","אחר"]];

  return(
    <div dir="rtl" style={{minHeight:"100vh",background:LS.bg,fontFamily:"'Heebo',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>

      {/* Header */}
      <header style={{background:"#fff",borderBottom:`1px solid ${LS.border}`,height:60,display:"flex",alignItems:"center",padding:"0 24px",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",fontWeight:900}}>◈</div>
          <span style={{fontWeight:900,fontSize:17,color:LS.purple}}>Sidor-IL</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          {events.length>0&&!showForm&&<LSBtn ghost small onClick={()=>setShowForm(true)} icon="✨">אירוע חדש</LSBtn>}
          {events.length>0&&showForm&&<LSBtn ghost small onClick={()=>setShowForm(false)}>← חזרה</LSBtn>}
          <LSBtn ghost small danger onClick={onLogout}>יציאה</LSBtn>
        </div>
      </header>

      {/* Events list */}
      {events.length>1&&!showForm?(
        <div style={{flex:1,padding:"32px 24px",maxWidth:680,margin:"0 auto",width:"100%"}}>
          {/* Page header */}
          <div style={{background:"linear-gradient(135deg,#5B2DB8,#7B4AE2,#9B72F0)",borderRadius:20,padding:"24px 28px",marginBottom:28,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-30,left:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,.07)",pointerEvents:"none"}}/>
            <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginBottom:4,fontWeight:600}}>ברוך הבא</div>
            <div style={{fontSize:26,fontWeight:900,color:"#fff"}}>האירועים שלי</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginTop:4}}>בחר אירוע להמשך ניהול</div>
          </div>

          {events.map(ev=>(
            <div key={ev.id} onClick={()=>onSelect(ev)}
              style={{background:"#fff",borderRadius:16,padding:"18px 20px",marginBottom:12,cursor:"pointer",border:`1.5px solid ${LS.border}`,display:"flex",alignItems:"center",gap:14,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=LS.purple;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(107,61,212,.12)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=LS.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
              <div style={{width:48,height:48,borderRadius:14,background:LS.purpleXL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {ev.event_type==="wedding"?"💍":ev.event_type==="bar_mitzvah"?"✡️":ev.event_type==="brit"?"👶":"🎉"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:16,color:LS.text}}>{ev.name}</div>
                {ev.date&&<div style={{fontSize:12,color:LS.muted,marginTop:2}}>📅 {new Date(ev.date).toLocaleDateString("he-IL",{day:"numeric",month:"long",year:"numeric"})}</div>}
                {ev.venue&&<div style={{fontSize:12,color:LS.muted}}>📍 {ev.venue}</div>}
              </div>
              <span style={{color:LS.purple,fontSize:20,fontWeight:900}}>←</span>
            </div>
          ))}
        </div>
      ):(
        /* Create form */
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
          <div style={{background:"#fff",borderRadius:24,padding:"36px 32px",width:"100%",maxWidth:520,boxShadow:"0 8px 40px rgba(107,61,212,.12)",border:`1px solid ${LS.border}`}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#5B2DB8,#7B4AE2)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:30,marginBottom:12,boxShadow:"0 8px 24px rgba(107,61,212,.3)"}}>✨</div>
              <div style={{fontSize:22,fontWeight:900,color:LS.text}}>צור אירוע חדש</div>
              <div style={{fontSize:13,color:LS.muted,marginTop:4}}>מלא את הפרטים הבסיסיים — ניתן לעדכן בכל עת</div>
            </div>

            {/* Event type */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:LS.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>סוג האירוע</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {eventTypes.map(([v,icon,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,event_type:v}))}
                    style={{background:form.event_type===v?"linear-gradient(135deg,#5B2DB8,#7B4AE2)":LS.purpleXL,color:form.event_type===v?"#fff":LS.text,border:`2px solid ${form.event_type===v?"transparent":LS.border}`,borderRadius:12,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}>
                    {icon} {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Names for wedding */}
            {form.event_type==="wedding"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <LSInput label="שם החתן" value={form.groom_name} onChange={v=>setForm(f=>({...f,groom_name:v}))} placeholder="עמית"/>
                <LSInput label="שם הכלה" value={form.bride_name} onChange={v=>setForm(f=>({...f,bride_name:v}))} placeholder="אורנה"/>
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
              <LSInput label="שם האירוע *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="חתונת עמית ואורנה"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <LSInput label="תאריך" type="date" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} placeholder=""/>
                <LSInput label="שעה" type="time" value={form.event_time} onChange={v=>setForm(f=>({...f,event_time:v}))} placeholder=""/>
              </div>
              <LSInput label="שם האולם / מקום" value={form.venue} onChange={v=>setForm(f=>({...f,venue:v}))} placeholder="אולמי הגן הקסום"/>
            </div>

            <LSBtn primary full onClick={create} disabled={creating||!form.name.trim()} style={{fontSize:16,padding:"14px"}}>
              {creating?<><div style={{width:18,height:18,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.4)",borderTopColor:"#fff",animation:"spin .7s linear infinite"}}/>יוצר...</>:"✨ צור אירוע ←"}
            </LSBtn>
          </div>
        </div>
      )}
    </div>
  );
}


function AdminLogin({ onSuccess, onClose }) {
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");

  const submit=()=>{
    if(!pass){setErr("הכנס סיסמה");return;}
    if(pass!==ADMIN_PASSWORD){setErr("❌ סיסמה שגויה");return;}
    localStorage.setItem("sidor_admin","1");
    onSuccess({email:ADMIN_EMAIL,id:"admin"});
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0D1117",direction:"rtl",fontFamily:"'Heebo',sans-serif"}}>
      <div style={{background:"#161B22",border:"1px solid #30363D",borderRadius:20,padding:"40px 32px",width:"90%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔐</div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:4}}>Sidor-IL Admin</div>
        <div style={{fontSize:13,color:"#888",marginBottom:28}}>הכנס סיסמת אדמין</div>
        <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="סיסמה" autoFocus
          style={{width:"100%",background:"#21262D",border:`1.5px solid ${err?"#F85149":"#30363D"}`,borderRadius:12,padding:"13px 16px",fontSize:16,color:"#E6EDF3",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:err?8:16,textAlign:"right"}}/>
        {err&&<div style={{fontSize:13,color:"#F85149",marginBottom:12}}>{err}</div>}
        <button onClick={submit} disabled={!pass}
          style={{width:"100%",background:!pass?"#21262D":"#1B3A8C",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:16,fontWeight:700,cursor:!pass?"default":"pointer",fontFamily:"inherit",marginBottom:12}}>
          כניסה ←
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          חזרה לאתר
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────

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
      if(u){
        const savedId=localStorage.getItem("sidor_event_id");
        if(savedId){
          const{data:ev}=await sb.from("events").select("*").eq("id",savedId).eq("user_id",u.id).single();
          if(ev){setEvent(ev);}
        }
      }
      setChecking(false);
    });
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{
      if(!session?.user){
        setUser(null);setEvent(null);localStorage.removeItem("sidor_event_id");
      } else {
        setUser(session.user);
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  const logout=async()=>{await sb.auth.signOut();setUser(null);setEvent(null);localStorage.removeItem("sidor_event_id");setShowLanding(false);};

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

  const inviteMatch=path.match(/^\/invite\/([a-z0-9]+)/i)||hash.match(/^#\/invite\/([a-z0-9]+)/i);
  if(inviteMatch){
    const guestId=new URLSearchParams(window.location.search).get("g")||
      hash.includes("?g=")&&hash.split("?g=")[1]||null;
    return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style><InvitePage code={inviteMatch[1]} guestId={guestId}/></>);
  }

  if(checking)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><Spinner size={40}/></div>);

  // ניתוב לדף אדמין  -  לפני כל שאר הניתובים!
  if(isAdmin){
    if(!user||(user.email!==ADMIN_EMAIL&&localStorage.getItem("sidor_admin")!=="1"))return(
      <AdminLogin onSuccess={u=>{setUser(u);}} onClose={()=>window.location.hash=""}/>
    );
    return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AdminDashboard user={user} onLogout={logout}/>
    </>);
  }

  if(showPrivacy) return <PrivacyPage/>;

  // דף איפוס סיסמה
  if(showResetPw) return(
    <div dir="rtl" style={{minHeight:"100vh",background:"#F0F4FF",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Heebo',sans-serif",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:32,width:"100%",maxWidth:400,boxShadow:"0 8px 32px rgba(27,58,140,.12)"}}>
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
            if(error){setResetPw(r=>({...r,loading:false,msg:{err:true,txt:error.message}}));}
            else{
              setResetPw(r=>({...r,loading:false,msg:{err:false,txt:"✅ הסיסמה עודכנה בהצלחה!"}}));
              setTimeout(()=>{setShowResetPw(false);window.location.hash="";},2000);
            }
          }} disabled={resetPw.loading}
            style={{background:"linear-gradient(135deg,#1B3A8C,#2952C8)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
            {resetPw.loading?"מעדכן...":"עדכן סיסמה"}
          </button>
        </div>
      </div>
    </div>
  );

  if(!user||showLanding||authMode) return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}} @keyframes slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:none;opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}} @media(min-width:768px){.nav-link{display:block!important;}} @media(max-width:767px){.hide-mobile{display:none!important;}}`}</style>
    <LandingPage onOpenAuth={mode=>{setAuthMode(mode);}} onLogout={user?logout:null}/>
    {authMode&&<AuthDrawer mode={authMode} onClose={()=>setAuthMode(null)} onAuth={u=>{setUser(u);setAuthMode(null);setShowLanding(false);}}/>}
    <AccessibilityWidget/>
  </>);

  if(!event)return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <CreateEventScreen user={user} onSelect={selectEvent} onLogout={logout}/>
  </>);

  return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}`}</style>
  <SeatingApp user={user} event={event} onBack={()=>setShowLanding(true)} onUpdate={e=>setEvent(e)} onLogout={logout}/></>);
}
