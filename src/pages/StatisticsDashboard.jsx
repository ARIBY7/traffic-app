import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const API = process.env.REACT_APP_API_URL || "http://localhost:8081";

const C = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent:  { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27", blue: "#4A9EDD" },
  bg:      { main: "#09080F", card: "#110F1E", hover: "#17142A", glass: "rgba(17,15,30,0.8)" },
  text:    { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
  border:  "rgba(127,119,221,0.1)",
};

const ZONE_PAL = ["#7F77DD","#1D9E75","#EF9F27","#D85A30","#4A9EDD","#A855F7","#10B981","#F59E0B"];

const STATUS_MAP = {
  "Low/Fluid": C.accent.teal,  "Fluide":  C.accent.teal,
  "Moderate":  C.accent.amber, "Modéré":  C.accent.amber,
  "Heavy":     "#E24B4A",      "Dense":   "#E24B4A",
  "Blocked":   C.accent.coral, "Bloqué":  C.accent.coral,
};
const VEH_COLORS = [C.primary.light, C.accent.amber, C.accent.teal, C.accent.coral];

function getHeaders() {
  const t = localStorage.getItem("token");
  return { "Content-Type":"application/json", ...(t?{Authorization:`Bearer ${t}`}:{}) };
}

// ── Glow background ──────────────────────────────────────
function GlowOrb({ x, y, color, size=400, opacity=0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(120px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub, loading, trend }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:C.bg.card, border:`1px solid ${hov?color+"33":C.border}`, borderLeft:`3px solid ${color}`, borderRadius:14, padding:"1.3rem 1.5rem", position:"relative", overflow:"hidden", transition:"all 0.2s", transform:hov?"translateY(-2px)":"none" }}>
      <div style={{ position:"absolute", right:14, top:14, fontSize:24, opacity:0.1 }}>{icon}</div>
      <div style={{ fontSize:"0.65rem", color:C.text.muted, textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:700, marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:loading?"#2A2850":color, lineHeight:1, marginBottom:6, transition:"color 0.3s" }}>
        {loading ? <div style={{ width:80, height:32, background:"rgba(255,255,255,0.04)", borderRadius:6, animation:"shimmer 1.5s infinite" }} /> : value}
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        {sub && <div style={{ fontSize:"0.7rem", color:C.text.subtle }}>{sub}</div>}
        {trend != null && (
          <div style={{ fontSize:"0.72rem", color:trend>=0?C.accent.teal:C.accent.coral, fontWeight:600, background:trend>=0?`${C.accent.teal}15`:`${C.accent.coral}15`, padding:"0.15rem 0.5rem", borderRadius:100 }}>
            {trend>=0?"↑":"↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────
function DonutChart({ segments, size=180, title }) {
  const [hovered, setHovered] = useState(null);
  if (!segments?.length) return <Empty />;
  const total = segments.reduce((s,d) => s+(d.value||0), 0);
  if (!total) return <Empty />;

  const cx=size/2, cy=size/2, r=size*0.37, inner=size*0.23;
  let angle = -Math.PI/2;
  const arcs = segments.map((seg,idx) => {
    const fraction = seg.value/total;
    const start=angle, end=angle+fraction*2*Math.PI;
    angle=end;
    const x1=cx+r*Math.cos(start), y1=cy+r*Math.sin(start);
    const x2=cx+r*Math.cos(end),   y2=cy+r*Math.sin(end);
    const xi1=cx+inner*Math.cos(start), yi1=cy+inner*Math.sin(start);
    const xi2=cx+inner*Math.cos(end),   yi2=cy+inner*Math.sin(end);
    const large=fraction>0.5?1:0;
    return { ...seg, fraction, idx, d:`M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z` };
  });

  const active = hovered!=null ? arcs[hovered] : null;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
      <div style={{ position:"relative", flexShrink:0 }}>
        <svg width={size} height={size}>
          {arcs.map((arc,i) => (
            <path key={i} d={arc.d} fill={arc.color} opacity={hovered==null||hovered===i?0.92:0.35}
              style={{ cursor:"pointer", transition:"opacity 0.2s" }}
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} />
          ))}
          <text x={cx} y={cy-(active?8:4)} textAnchor="middle" fontSize={active?11:13} fontWeight={700} fill={active?active.color:C.text.primary}>
            {active ? active.label : Math.round(total).toLocaleString()}
          </text>
          <text x={cx} y={cy+(active?10:14)} textAnchor="middle" fontSize={9} fill={C.text.subtle}>
            {active ? `${Math.round(active.value).toLocaleString()} (${(active.fraction*100).toFixed(1)}%)` : "TOTAL"}
          </text>
        </svg>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
        {segments.map((seg,i) => (
          <div key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
            style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", opacity:hovered==null||hovered===i?1:0.4, transition:"opacity 0.2s" }}>
            <div style={{ width:10, height:10, borderRadius:3, background:seg.color, flexShrink:0, boxShadow:`0 0 6px ${seg.color}66` }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"0.8rem", color:C.text.primary, fontWeight:600 }}>{seg.label}</div>
              <div style={{ fontSize:"0.68rem", color:C.text.subtle, marginTop:1 }}>
                {Math.round(seg.value).toLocaleString()} · {(seg.value/total*100).toFixed(1)}%
              </div>
            </div>
            <div style={{ width:60, height:4, background:"rgba(255,255,255,0.05)", borderRadius:100, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${seg.value/total*100}%`, background:seg.color, borderRadius:100 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────
function BarChart({ data, color, height=200, unit="" }) {
  const [hov, setHov] = useState(null);
  if (!data?.length) return <Empty />;
  const max = Math.max(...data.map(d=>d.value), 1);
  const barW = Math.max(18, Math.floor(560/data.length)-8);
  const W = Math.max(560, data.length*(barW+8));

  return (
    <div style={{ overflowX:"auto", overflowY:"hidden" }}>
      <svg width={W} height={height+50} style={{ display:"block" }}>
        {/* Grid */}
        {[0.25,0.5,0.75,1].map(f=>(
          <g key={f}>
            <line x1={0} y1={(1-f)*height+4} x2={W} y2={(1-f)*height+4} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={4} y={(1-f)*height+2} fontSize={8} fill={C.text.subtle}>{Math.round(max*f)}</text>
          </g>
        ))}
        {data.map((d,i)=>{
          const barH = Math.max(4,(d.value/max)*height);
          const x = i*(barW+8)+4;
          const y = height-barH+4;
          const isHov = hov===i;
          return (
            <g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} style={{ cursor:"pointer" }}>
              {/* Shadow */}
              {isHov && <rect x={x-2} y={y-2} width={barW+4} height={barH+2} rx={6} fill={color} opacity={0.15} />}
              <rect x={x} y={y} width={barW} height={barH} rx={4}
                fill={isHov?color:color+"BB"} style={{ transition:"fill 0.15s" }} />
              {/* Gradient top */}
              <rect x={x} y={y} width={barW} height={Math.min(barH,8)} rx={4} fill="rgba(255,255,255,0.12)" />
              <text x={x+barW/2} y={height+20} textAnchor="middle" fontSize={9} fill={C.text.subtle}
                style={{ overflow:"hidden", textOverflow:"ellipsis" }}>
                {d.label.length>8?d.label.slice(0,8)+"…":d.label}
              </text>
              {isHov && (
                <g>
                  <rect x={x+barW/2-24} y={y-28} width={48} height={20} rx={4} fill={C.bg.card} stroke={color} strokeWidth={1} />
                  <text x={x+barW/2} y={y-14} textAnchor="middle" fontSize={9} fill={color} fontWeight={700}>
                    {Math.round(d.value)}{unit}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Area Chart ────────────────────────────────────────────
function AreaChart({ data, color, height=160 }) {
  const [hov, setHov] = useState(null);
  if (!data||data.length<2) return <Empty msg="Not enough data" />;

  const max   = Math.max(...data.map(d=>d.value), 1);
  const W     = 560, H = height;
  const PAD   = 36;   // padding gauche/droite
  const PTOP  = 40;   // padding haut pour tooltip
  const innerW = W - PAD * 2;

  // ── Y-axis : valeurs arrondies propres ──
  const niceNum = (val) => {
    if (val >= 1_000_000) return `${(val/1_000_000).toFixed(1)}M`;
    if (val >= 1_000)     return `${Math.round(val/1_000)}k`;
    return Math.round(val).toString();
  };
  const yTicks = [0.25, 0.5, 0.75, 1].map(f => ({
    f, val: max * f, y: PTOP + H - f * H * 0.85
  }));

  const pts = data.map((d,i) => ({
    x: PAD + (i/(data.length-1)) * innerW,
    y: PTOP + H - (d.value/max) * H * 0.85,
  }));

  const mainPts  = pts.slice(0, -1);
  const lastPt   = pts[pts.length-1];
  const prevPt   = pts[pts.length-2];
  const mainLine = mainPts.map(p=>`${p.x},${p.y}`).join(" ");
  const gId      = `ag${color.replace("#","")}`;

  return (
    <div style={{ overflowX:"auto" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${PTOP + H + 50}`} style={{ display:"block" }}>
        <defs>
          <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Grid + Y labels */}
        {yTicks.map(({f, val, y}) => (
          <g key={f}>
            <line x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={PAD-6} y={y+4} textAnchor="end" fontSize={9} fill={C.text.subtle}>
              {niceNum(val)}
            </text>
          </g>
        ))}

        {/* Fill */}
        <polygon
          points={`${PAD},${PTOP+H} ${mainLine} ${prevPt.x},${PTOP+H}`}
          fill={`url(#${gId})`}
        />

        {/* Main line */}
        <polyline points={mainLine} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Dashed segment to partial last point */}
        <line x1={prevPt.x} y1={prevPt.y} x2={lastPt.x} y2={lastPt.y}
          stroke={color} strokeWidth={2} strokeDasharray="5 4" opacity={0.5} />

        {/* Points + labels */}
        {pts.map((p,i) => {
          const isPartial = data[i]?.partial;
          return (
            <g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} style={{ cursor:"pointer" }}>
              <circle cx={p.x} cy={p.y}
                r={hov===i?6:isPartial?4:3}
                fill={isPartial?"#3A3660":hov===i?color:"#110F1E"}
                stroke={isPartial?"#6B6A99":color}
                strokeWidth={isPartial?1.5:2}
                style={{ transition:"r 0.15s" }} />

              {i % 2 === 0 && (
                <text x={p.x} y={PTOP+H+20} textAnchor="middle" fontSize={9}
                  fill={isPartial?"#6B6A99":C.text.subtle}>
                  {data[i].label}
                </text>
              )}
              {isPartial && (
                <text x={p.x} y={PTOP+H+34} textAnchor="middle" fontSize={8} fill="#6B6A99">partial</text>
              )}

              {/* Tooltip */}
              {hov===i && (
                <g>
                  <rect x={p.x-42} y={p.y-46} width={84} height={30} rx={5}
                    fill={C.bg.card} stroke={isPartial?"#6B6A99":color} strokeWidth={1} />
                  <text x={p.x} y={p.y-28} textAnchor="middle" fontSize={11}
                    fill={isPartial?"#9CA3AF":color} fontWeight={700}>
                    {niceNum(data[i].value)}
                  </text>
                  <text x={p.x} y={p.y-14} textAnchor="middle" fontSize={8} fill={C.text.subtle}>
                    {data[i].label}{isPartial?" · incomplete":""}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Horizontal Progress Bar ───────────────────────────────
function HBar({ label, value, max, color, rank }) {
  const [hov, setHov] = useState(false);
  const pct = max>0?Math.min((value/max)*100,100):0;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:"0.6rem 0", borderBottom:"1px solid rgba(255,255,255,0.04)", transition:"background 0.15s" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {rank && <span style={{ fontSize:"0.65rem", color:C.text.subtle, fontWeight:700, width:16 }}>#{rank}</span>}
          <span style={{ fontSize:"0.82rem", color:hov?C.text.primary:C.text.muted, fontWeight:hov?600:400, transition:"all 0.15s" }}>{label}</span>
        </div>
        <span style={{ fontSize:"0.82rem", color, fontWeight:700 }}>{Math.round(value).toLocaleString()}</span>
      </div>
      <div style={{ height:6, background:"rgba(255,255,255,0.04)", borderRadius:100, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}66,${color})`, borderRadius:100, transition:"width 1s ease, opacity 0.2s", opacity:hov?1:0.8 }} />
      </div>
    </div>
  );
}

// ── Table Row ─────────────────────────────────────────────
function TableRow({ s, i, last }) {
  const [hov, setHov] = useState(false);
  const hasAccident = s.accidents > 0;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"grid", gridTemplateColumns:"70px 1fr 1fr 1fr 100px", padding:"0.9rem 1.4rem", borderBottom:last?"none":"1px solid rgba(127,119,221,0.05)", alignItems:"center", background:hov?C.bg.hover:"transparent", transition:"background 0.12s", borderLeft:`2px solid ${hasAccident?C.accent.coral:C.accent.teal}` }}>
      <span style={{ fontSize:"0.82rem", color:C.primary.light, fontWeight:700 }}>#{s.id}</span>
      <div>
        <div style={{ fontSize:"0.88rem", color:C.accent.amber, fontWeight:600 }}>{s.speed!=null?`${Number(s.speed).toFixed(1)} km/h`:"—"}</div>
        <div style={{ fontSize:"0.65rem", color:C.text.subtle, marginTop:2 }}>avg speed</div>
      </div>
      <div>
        <div style={{ fontSize:"0.88rem", color:C.text.primary, fontWeight:500 }}>{s.volume!=null?Math.round(s.volume).toLocaleString():"—"}</div>
        <div style={{ fontSize:"0.65rem", color:C.text.subtle, marginTop:2 }}>total volume</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:hasAccident?C.accent.coral:C.accent.teal }}>{s.accidents??0}</span>
        <span style={{ fontSize:"0.7rem", color:hasAccident?C.accent.coral:C.accent.teal }}>{hasAccident?"⚠ accident":"✓ clean"}</span>
      </div>
      <div>
        <div style={{ height:6, background:"rgba(255,255,255,0.04)", borderRadius:100, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.min((s.speed/120)*100,100)}%`, background:`linear-gradient(90deg,${C.accent.amber}66,${C.accent.amber})`, borderRadius:100 }} />
        </div>
        <div style={{ fontSize:"0.62rem", color:C.text.subtle, marginTop:3 }}>speed index</div>
      </div>
    </div>
  );
}

function Empty({ msg="No data available" }) {
  return <div style={{ textAlign:"center", padding:"2.5rem", color:C.text.subtle, fontSize:"0.85rem" }}>{msg}</div>;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom:"1.4rem" }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:C.text.primary }}>{children}</div>
      {sub && <div style={{ fontSize:"0.72rem", color:C.text.subtle, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:C.bg.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.6rem", ...style }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
export default function StatisticsDashboard() {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const [sparkBadge, setSparkBadge] = useState(false);

  // Data states
  const [summary,       setSummary]       = useState({ total:null, avgSpeed:null, volume:null, accidents:null, sensors:0, signals:0 });
  const [statusPie,     setStatusPie]     = useState([]);
  const [vehiclePie,    setVehiclePie]    = useState([]);
  const [volumeBar,     setVolumeBar]     = useState([]);
  const [speedArea,     setSpeedArea]     = useState([]);
  const [locationStats, setLocationStats] = useState([]);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // ── Summary endpoints ──
        const [total, speed, volume, accidents, sens, sigs] = await Promise.allSettled([
          fetch(`${API}/api/admin/data/total`,               {headers:getHeaders()}).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/admin/data/speed/latestDate`,    {headers:getHeaders()}).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/admin/data/volume/latestDate`,   {headers:getHeaders()}).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/users/data/niveau/accidents`,    {headers:getHeaders()}).then(r=>r.ok?r.json():0),
          fetch(`${API}/api/users/sensors`,                  {headers:getHeaders()}).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/users/signals`,                  {headers:getHeaders()}).then(r=>r.ok?r.json():[]),
        ]);
        setSummary({
          total:     total.value,
          avgSpeed:  speed.value,
          volume:    volume.value,
          accidents: accidents.value,
          sensors:   Array.isArray(sens.value)?sens.value.length:0,
          signals:   Array.isArray(sigs.value)?sigs.value.length:0,
        });

        // ── Spark endpoints ──
        const [locs, statusR, vehicleR, volR, spdR] = await Promise.allSettled([
          fetch(`${API}/api/admin/traffic-stats/locations`,      {headers:getHeaders()}).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/traffic-stats/status-pie`,     {headers:getHeaders()}).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/traffic-stats/vehicle-pie/1`,  {headers:getHeaders()}).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/traffic-stats/volume-bar`,     {headers:getHeaders()}).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/traffic-stats/speed-evolution`,{headers:getHeaders()}).then(r=>r.ok?r.json():[]),
        ]);

        const loc  = Array.isArray(locs.value)    ? locs.value    : [];
        const stat = Array.isArray(statusR.value) ? statusR.value : [];
        const veh  = Array.isArray(vehicleR.value)? vehicleR.value: [];
        const vol  = Array.isArray(volR.value)    ? volR.value    : [];
        const spd  = Array.isArray(spdR.value)    ? spdR.value    : [];

        setLocationStats(loc);
        setStatusPie(stat);
        setVehiclePie(veh);
        setVolumeBar(vol);
        setSpeedArea(spd);

        const hasData = stat.length>0||veh.length>0||vol.length>0||spd.length>0;
        setSparkBadge(hasData);

      } catch(e) { showToast("Loading error", "error"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ── Transform data for charts ──
  const toChart = arr => arr.map(d=>({ label:d.label||d.name||"?", value:d.value||0 }));

  const statusSegs = toChart(statusPie).map((d,i)=>({
    ...d, color:STATUS_MAP[d.label]||ZONE_PAL[i%ZONE_PAL.length], fraction:0
  }));

  const vehicleSegs = toChart(vehiclePie).filter(d=>d.value>0).map((d,i)=>({
    ...d, color:VEH_COLORS[i%VEH_COLORS.length], fraction:0
  }));

  // ── Volume bar : exactement ce que le backend retourne ──
  const volData = toChart(volumeBar).map(d=>({
    label: (d.label||"").slice(0, 12),
    value: Math.round(d.value),
  }));

  // ── Speed evolution : toutes les semaines non vides, dernier point = partiel ──
  const allWeeks = toChart(speedArea).filter(d => d.value > 0);
  const spdData = allWeeks
    .slice(0, 20)
    .map((d, i) => ({
      label: `S${i + 1}`,
      value: Math.round(d.value),
      partial: i === allWeeks.slice(0, 20).length - 1, // dernier point = semaine incomplète
    }));

  // ── Location table : exactement ce que le backend retourne ──
  const locTable = locationStats.map((s,i)=>({
    id:        s.LOCATION_ID    || s.location_id    || i+1,
    speed:     s.VITESSE_MOYENNE|| s.vitesseMoyenne || s.VITESSE_MOY || 0,
    volume:    s.VOLUME_TOTAL   || s.volumeTotal    || 0,
    accidents: s.TOTAL_ACCIDENTS|| s.totalAccidents || 0,
  })).sort((a,b)=>b.volume-a.volume);
  const maxVol = Math.max(...volData.map(d=>d.value), 1);

  const fmt = (v,d=1) => v!=null ? Number(v).toFixed(d) : "—";
  const hasSparkData = sparkBadge;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg.main, color:C.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.25); border-radius:4px; }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      `}</style>

      <GlowOrb x="10%" y="15%" color={C.primary.dark}  size={700} opacity={0.08} />
      <GlowOrb x="90%" y="60%" color={C.accent.teal}   size={500} opacity={0.06} />
      <GlowOrb x="50%" y="90%" color={C.accent.coral}  size={400} opacity={0.05} />

      {toast && (
        <div style={{ position:"fixed", top:"1.5rem", right:"1.5rem", zIndex:999, background:toast.type==="error"?`${C.accent.coral}18`:`${C.accent.teal}18`, border:`1px solid ${toast.type==="error"?C.accent.coral:C.accent.teal}55`, color:toast.type==="error"?"#F0997B":C.accent.teal, borderRadius:10, padding:"0.75rem 1.2rem", fontSize:"0.85rem", fontWeight:500, display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(8px)" }}>
          {toast.type==="error"?"⚠":"✓"} {toast.msg}
        </div>
      )}

      <Sidebar />

      <div style={{ marginLeft:220, padding:"2.5rem", position:"relative", zIndex:1 }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2.5rem" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:C.text.primary, letterSpacing:"-0.5px" }}>
                Statistics
              </h1>
              {hasSparkData && (
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${C.accent.teal}18`, border:`1px solid ${C.accent.teal}40`, borderRadius:100, padding:"0.25rem 0.75rem" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.accent.teal, animation:"pulse 1.5s infinite" }} />
                  <span style={{ fontSize:"0.7rem", color:C.accent.teal, fontWeight:700, letterSpacing:"0.06em" }}>SPARK LIVE</span>
                </div>
              )}
            </div>
            <p style={{ color:C.text.muted, fontSize:"0.88rem", fontWeight:300 }}>
              Traffic intelligence dashboard — Apache Spark analytics engine
            </p>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"0.75rem", color:C.text.subtle, marginBottom:4 }}>Last refreshed</div>
            <div style={{ fontSize:"0.85rem", color:C.text.muted, fontWeight:500 }}>
              {new Date().toLocaleTimeString("en-GB", {hour:"2-digit",minute:"2-digit"})}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"5rem", color:C.text.muted }}>
            <div style={{ width:52, height:52, border:`3px solid ${C.primary.light}22`, borderTop:`3px solid ${C.primary.light}`, borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 1.2rem" }} />
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:C.text.muted }}>Loading analytics...</div>
            <div style={{ fontSize:"0.8rem", color:C.text.subtle, marginTop:6 }}>Fetching Spark data from backend</div>
          </div>
        ) : (
          <div style={{ animation:"fadeIn 0.5s ease" }}>

            {/* ── ROW 1 : Summary Cards ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,minmax(0,1fr))", gap:12, marginBottom:"2rem" }}>
              <StatCard label="Records"       value={(summary.total??0).toLocaleString()} color={C.primary.light} icon="📊" sub="Data points"     loading={loading} />
              <StatCard label="Avg Speed"     value={`${fmt(summary.avgSpeed,2)} km/h`}   color={C.accent.amber}  icon="⚡" sub="Latest date"     loading={loading} />
              <StatCard label="Volume"        value={fmt(summary.volume,2)}               color={C.accent.teal}   icon="🚗" sub="Latest total"    loading={loading} />
              <StatCard label="Accidents"     value={(summary.accidents??0).toLocaleString()} color={C.accent.coral} icon="🚨" sub="All time"     loading={loading} />
              <StatCard label="Sensors"       value={summary.sensors}                     color={C.primary.light} icon="◎" sub="Active zones"    loading={loading} />
              <StatCard label="Signals"       value={summary.signals}                     color={C.accent.amber}  icon="🚦" sub="Deployed"        loading={loading} />
            </div>

            {/* ── No Spark Data message ── */}
            {!hasSparkData ? (
              <Card style={{ textAlign:"center", padding:"3rem" }}>
                <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>⚡</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:700, color:C.text.primary, marginBottom:8 }}>Spark Analytics Not Yet Available</div>
                <p style={{ color:C.text.muted, fontSize:"0.85rem", lineHeight:1.8, maxWidth:500, margin:"0 auto 1.5rem" }}>
                  The Spark batch job needs to run to populate the analytics tables.<br/>
                  Tables required: <code style={{color:C.accent.amber}}>TRAFFIC_STATS</code> · <code style={{color:C.accent.amber}}>TRAFFIC_STATUS_STATS</code> · <code style={{color:C.accent.amber}}>WEEKLY_VEHICLE_STATS</code>
                </p>
                <div style={{ background:C.bg.hover, borderRadius:10, padding:"1rem 1.5rem", display:"inline-block", textAlign:"left", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:"0.65rem", color:C.text.subtle, marginBottom:6, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Run command</div>
                  <code style={{ fontSize:"0.78rem", color:C.primary.light }}>
                    spark-submit --class com.example.prtrafficur.batch.TrafficAnalysisBatch target/prTrafficUr-0.0.1-SNAPSHOT.jar
                  </code>
                </div>
              </Card>
            ) : (
              <div style={{ display:"grid", gap:"1.5rem" }}>

                {/* ── ROW 2 : Status Donut + Vehicle Donut ── */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                  <Card>
                    <SectionTitle sub="From TRAFFIC_STATUS_STATS — Spark computed">🚦 Traffic Status Distribution</SectionTitle>
                    <DonutChart segments={statusSegs} size={180} />
                  </Card>
                  <Card>
                    <SectionTitle sub="From WEEKLY_VEHICLE_STATS — Week 1">🚗 Vehicle Type Composition</SectionTitle>
                    <DonutChart segments={vehicleSegs} size={180} />
                  </Card>
                </div>

                {/* ── ROW 3 : Volume Bar Chart ── */}
                {volData.length > 0 && (
                  <Card>
                    <SectionTitle sub="From TRAFFIC_STATS — total vehicle count per zone">📊 Traffic Volume by Zone</SectionTitle>
                    <BarChart data={volData} color={C.primary.light} height={200} />
                  </Card>
                )}

                {/* ── ROW 4 : Volume Ranking + Area Chart ── */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>

                  {/* Ranking */}
                  {volData.length > 0 && (
                    <Card>
                      <SectionTitle sub="Sorted by total volume">📍 Zone Volume Ranking</SectionTitle>
                      {volData.slice(0,8).map((d,i)=>(
                        <HBar key={i} rank={i+1} label={d.label} value={d.value} max={maxVol} color={ZONE_PAL[i%ZONE_PAL.length]} />
                      ))}
                    </Card>
                  )}

                  {spdData.length > 0 && (
                    <Card>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.4rem" }}>
                        <SectionTitle sub="From WEEKLY_VEHICLE_STATS — total vehicles per week">📈 Weekly Vehicle Evolution</SectionTitle>
                        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem", color:"#6B6A99", background:"rgba(107,106,153,0.1)", border:"1px solid rgba(107,106,153,0.2)", borderRadius:8, padding:"0.25rem 0.65rem", flexShrink:0 }}>
                          <span style={{ width:20, borderBottom:"2px dashed #6B6A99", display:"inline-block" }} />
                          Partial week
                        </div>
                      </div>
                      {spdData.length < 2
                        ? <Empty msg="Not enough weekly data" />
                        : <AreaChart data={spdData} color={C.accent.amber} height={180} />
                      }
                    </Card>
                  )}
                </div>

                {/* ── ROW 5 : Location Stats Table ── */}
                {locTable.length > 0 && (
                  <div style={{ background:C.bg.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                    {/* Header */}
                    <div style={{ padding:"1.2rem 1.4rem", borderBottom:`1px solid rgba(127,119,221,0.06)`, display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(127,119,221,0.04)" }}>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:C.text.primary }}>📊 Traffic Stats by Location</div>
                        <div style={{ fontSize:"0.72rem", color:C.text.subtle, marginTop:3 }}>TRAFFIC_STATS — Spark aggregated · sorted by volume</div>
                      </div>
                      <div style={{ background:`${C.accent.teal}15`, border:`1px solid ${C.accent.teal}33`, borderRadius:8, padding:"0.35rem 0.8rem", fontSize:"0.72rem", color:C.accent.teal, fontWeight:600 }}>
                        {locTable.length} locations
                      </div>
                    </div>
                    {/* Column headers */}
                    <div style={{ display:"grid", gridTemplateColumns:"70px 1fr 1fr 1fr 100px", padding:"0.7rem 1.4rem", borderBottom:`1px solid rgba(127,119,221,0.06)`, fontSize:"0.65rem", color:C.text.subtle, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, background:"rgba(255,255,255,0.01)" }}>
                      <span>Location</span><span>Avg Speed</span><span>Total Volume</span><span>Accidents</span><span>Speed Index</span>
                    </div>
                    {locTable.slice(0,10).map((s,i)=>(
                      <TableRow key={i} s={s} i={i} last={i===Math.min(locTable.length,10)-1} />
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}