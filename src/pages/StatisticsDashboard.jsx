import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const API = process.env.REACT_APP_API_URL || "http://localhost:8081";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

function getHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderLeft:`3px solid ${color}`, borderRadius:12, padding:"1.2rem 1.4rem", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", right:12, top:12, fontSize:22, opacity:0.12 }}>{icon}</div>
      <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.9rem", fontWeight:800, color, lineHeight:1 }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize:"0.72rem", color:COLORS.text.subtle, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, color, height = 180, unit = "" }) {
  if (!data || data.length === 0)
    return <div style={{ color:COLORS.text.subtle, textAlign:"center", padding:"2rem", fontSize:"0.85rem" }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(20, Math.floor(520 / data.length) - 8);
  return (
    <div style={{ overflowX:"auto" }}>
      <svg width={Math.max(520, data.length * (barW + 8))} height={height + 45} style={{ display:"block" }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={0} y1={(1-f)*height+4} x2={data.length*(barW+8)} y2={(1-f)*height+4} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / max) * height);
          const x = i * (barW + 8) + 4;
          const y = height - barH + 4;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
              <text x={x+barW/2} y={height+18} textAnchor="middle" fontSize={9}  fill={COLORS.text.subtle}>{d.label}</text>
              {barH > 18 && <text x={x+barW/2} y={y-4} textAnchor="middle" fontSize={9} fill={COLORS.text.muted}>{Math.round(d.value)}{unit}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ segments, size = 160 }) {
  if (!segments || segments.length === 0)
    return <div style={{ color:COLORS.text.subtle, textAlign:"center", padding:"1rem", fontSize:"0.85rem" }}>No data</div>;
  const total = segments.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0)
    return <div style={{ color:COLORS.text.subtle, textAlign:"center", padding:"1rem" }}>No data</div>;

  const cx = size/2, cy = size/2, r = size*0.38, inner = size*0.22;
  let angle = -Math.PI/2;
  const arcs = segments.map(seg => {
    const fraction = seg.value / total;
    const start = angle, end = angle + fraction*2*Math.PI;
    angle = end;
    const x1=cx+r*Math.cos(start), y1=cy+r*Math.sin(start);
    const x2=cx+r*Math.cos(end),   y2=cy+r*Math.sin(end);
    const xi1=cx+inner*Math.cos(start), yi1=cy+inner*Math.sin(start);
    const xi2=cx+inner*Math.cos(end),   yi2=cy+inner*Math.sin(end);
    const large = fraction > 0.5 ? 1 : 0;
    return { ...seg, fraction, d:`M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z` };
  });

  return (
    <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
      <svg width={size} height={size}>
        {arcs.map((arc, i) => <path key={i} d={arc.d} fill={arc.color} opacity={0.9} />)}
        <text x={cx} y={cy+5}  textAnchor="middle" fontSize={12} fontWeight={700} fill={COLORS.text.primary}>{Math.round(total).toLocaleString()}</text>
        <text x={cx} y={cy+18} textAnchor="middle" fontSize={9}  fill={COLORS.text.subtle}>TOTAL</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:seg.color, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:"0.78rem", color:COLORS.text.primary, fontWeight:600 }}>{seg.label}</div>
              <div style={{ fontSize:"0.68rem", color:COLORS.text.subtle }}>
                {Math.round(seg.value).toLocaleString()} ({Math.round(seg.fraction*100)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreaChart({ data, color, height = 150 }) {
  if (!data || data.length < 2)
    return <div style={{ color:COLORS.text.subtle, textAlign:"center", padding:"2rem", fontSize:"0.85rem" }}>Not enough data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 520, h = height;
  const pts = data.map((d, i) => ({ x:(i/(data.length-1))*w, y:h-(d.value/max)*h*0.85 }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const gradId = `grad${color.replace("#","")}`;
  return (
    <div style={{ overflowX:"auto" }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h+30}`} style={{ display:"block" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        {[0.25,0.5,0.75,1].map(f => (
          <line key={f} x1={0} y1={h-f*h*0.85} x2={w} y2={h-f*h*0.85} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        <polygon points={`0,${h} ${polyline} ${w},${h}`} fill={`url(#${gradId})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={color} />
            <text x={p.x} y={h+20} textAnchor="middle" fontSize={9} fill={COLORS.text.subtle}>{data[i].label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HorizontalBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value/max)*100, 100) : 0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:"0.8rem", color:COLORS.text.primary, fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:"0.8rem", color, fontWeight:700 }}>{Math.round(value).toLocaleString()}</span>
      </div>
      <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:100, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:100, transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  "Blocked":"#D85A30","Heavy":"#E24B4A","Moderate":"#EF9F27","Low/Fluid":"#1D9E75",
  "Fluide":"#1D9E75","Modéré":"#EF9F27","Dense":"#E24B4A","Bloqué":"#D85A30",
};
const VEHICLE_COLORS = ["#7F77DD","#EF9F27","#1D9E75","#D85A30"];
const ZONE_PALETTE   = ["#7F77DD","#1D9E75","#EF9F27","#D85A30","#E24B4A","#4A9EDD","#A855F7","#10B981"];

export default function StatisticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const [summary,       setSummary]       = useState({ total:null, avgSpeed:null, volume:null, accidents:null, sensors:0, signals:0 });
  const [locationStats, setLocationStats] = useState([]);
  const [statusPie,     setStatusPie]     = useState([]);
  const [vehiclePie,    setVehiclePie]    = useState([]);
  const [volumeBar,     setVolumeBar]     = useState([]);
  const [speedArea,     setSpeedArea]     = useState([]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [total, avgSpeed, volume, accidents, sens, sigs] = await Promise.allSettled([
          fetch(`${API}/api/admin/data/total`,               { headers:getHeaders() }).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/admin/data/speed/latestDate`,    { headers:getHeaders() }).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/admin/data/volume/latestDate`,   { headers:getHeaders() }).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/admin/data/accident/latestDate`, { headers:getHeaders() }).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/users/sensors`,                  { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/users/signals`,                  { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
        ]);
        setSummary({
          total:     total.value,
          avgSpeed:  avgSpeed.value,
          volume:    volume.value,
          accidents: accidents.value,
          sensors:   Array.isArray(sens.value) ? sens.value.length : 0,
          signals:   Array.isArray(sigs.value) ? sigs.value.length : 0,
        });

        // ── Vrais endpoints Spark (/api/admin/traffic-stats/*) ──
        const [locs, status, vehicle, volBar, spdArea] = await Promise.allSettled([
          fetch(`${API}/api/admin/traffic-stats/locations`,     { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/traffic-stats/status-pie`,    { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/traffic-stats/vehicle-pie/1`, { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/traffic-stats/volume-bar`,    { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/traffic-stats/speed-evolution`,{ headers:getHeaders() }).then(r=>r.ok?r.json():[]),
        ]);

        setLocationStats(Array.isArray(locs.value)    ? locs.value    : []);
        setStatusPie(    Array.isArray(status.value)  ? status.value  : []);
        setVehiclePie(   Array.isArray(vehicle.value) ? vehicle.value : []);
        setVolumeBar(    Array.isArray(volBar.value)  ? volBar.value  : []);
        setSpeedArea(    Array.isArray(spdArea.value) ? spdArea.value : []);

      } catch (e) { showToast("Erreur de chargement", "error"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ── ChartDataDTO : { label (ou name), value } ──
  const toChart = (arr) => arr.map(d => ({ label: d.label || d.name || "?", value: d.value || 0 }));

  const statusSegments = toChart(statusPie).map((d, i) => ({
    ...d, color: STATUS_COLORS[d.label] || ZONE_PALETTE[i % ZONE_PALETTE.length], fraction:0,
  }));

  const vehicleSegments = toChart(vehiclePie).filter(d => d.value > 0).map((d, i) => ({
    ...d, color: VEHICLE_COLORS[i % VEHICLE_COLORS.length], fraction:0,
  }));

  const volumeBarData = toChart(volumeBar).map(d => ({
    label: (d.label || "").substring(0, 12),
    value: Math.round(d.value),
  }));

  const speedAreaData = toChart(speedArea).map((d, i) => ({
    label: d.label || `S${i+1}`,
    value: Math.round(d.value),
  }));

  const locationTable = locationStats.map((s, i) => ({
    id:        s.LOCATION_ID    || s.location_id    || i+1,
    speed:     s.VITESSE_MOYENNE|| s.vitesseMoyenne || 0,
    volume:    s.VOLUME_TOTAL   || s.volumeTotal    || 0,
    accidents: s.TOTAL_ACCIDENTS|| s.totalAccidents || 0,
  }));

  const maxVolume    = Math.max(...volumeBarData.map(d => d.value), 1);
  const hasSparkData = statusPie.length > 0 || vehiclePie.length > 0 || volumeBar.length > 0 || speedArea.length > 0;
  const fmt = (v, dec=1) => v != null ? Number(v).toFixed(dec) : "—";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <GlowOrb x="15%" y="20%" color={COLORS.primary.dark} size={600} opacity={0.1} />
      <GlowOrb x="85%" y="65%" color={COLORS.accent.teal}  size={400} opacity={0.07} />

      {toast && (
        <div style={{ position:"fixed", top:"1.5rem", right:"1.5rem", zIndex:999, background:toast.type==="error"?`${COLORS.accent.coral}18`:`${COLORS.accent.teal}18`, border:`1px solid ${toast.type==="error"?COLORS.accent.coral:COLORS.accent.teal}55`, color:toast.type==="error"?"#F0997B":COLORS.accent.teal, borderRadius:10, padding:"0.75rem 1.2rem", fontSize:"0.85rem", fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>
          {toast.type==="error"?"⚠":"✓"} {toast.msg}
        </div>
      )}

      <Sidebar />

      <div style={{ marginLeft:220, padding:"2.5rem", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2rem" }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Statistics</h1>
            <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>Traffic analytics — powered by Apache Spark</p>
          </div>
          <div style={{ background:hasSparkData?`${COLORS.accent.teal}18`:`${COLORS.accent.amber}18`, border:`1px solid ${hasSparkData?COLORS.accent.teal:COLORS.accent.amber}44`, borderRadius:10, padding:"0.5rem 1rem", fontSize:"0.78rem", fontWeight:600, color:hasSparkData?COLORS.accent.teal:COLORS.accent.amber }}>
            {hasSparkData ? "⚡ Spark Data Loaded" : "⚠ Spark data not available"}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"4rem", color:COLORS.text.muted }}>
            <div style={{ width:50, height:50, border:`3px solid ${COLORS.primary.light}33`, borderTop:`3px solid ${COLORS.primary.light}`, borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 1rem" }} />
            Loading statistics...
          </div>
        ) : (
          <div style={{ animation:"fadeIn 0.4s ease" }}>

            {/* Summary Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:14, marginBottom:"2rem" }}>
              <StatCard label="Total Records"   value={(summary.total??0).toLocaleString()} color={COLORS.primary.light} icon="📊" sub="Traffic data points" />
              <StatCard label="Avg Speed"        value={`${fmt(summary.avgSpeed)} km/h`}      color={COLORS.accent.amber}  icon="⚡" sub="Latest date average" />
              <StatCard label="Volume Traffic"   value={fmt(summary.volume,0)}                color={COLORS.accent.teal}   icon="🚗" sub="Latest date total" />
              <StatCard label="Accidents"        value={summary.accidents??0}                 color={COLORS.accent.coral}  icon="⚠️" sub="Latest date flagged" />
              <StatCard label="Active Sensors"   value={summary.sensors}                      color={COLORS.primary.light} icon="◎" sub="Monitoring zones" />
              <StatCard label="Traffic Signals"  value={summary.signals}                      color={COLORS.accent.amber}  icon="🚦" sub="Deployed signals" />
            </div>

            {/* No Spark Data */}
            {!hasSparkData && (
              <div style={{ background:COLORS.bg.card, border:`1px solid ${COLORS.accent.amber}33`, borderRadius:16, padding:"2.5rem", textAlign:"center" }}>
                <div style={{ fontSize:"2.5rem", marginBottom:"1rem" }}>⚡</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"0.75rem" }}>Spark Analytics Not Available</h3>
                <p style={{ color:COLORS.text.muted, fontSize:"0.85rem", lineHeight:1.8, maxWidth:520, margin:"0 auto 1.5rem" }}>
                  Run the Spark batch job to populate the analytics tables :<br/>
                  <code style={{ color:COLORS.accent.amber }}>TRAFFIC_STATS</code> · <code style={{ color:COLORS.accent.amber }}>TRAFFIC_STATUS_STATS</code> · <code style={{ color:COLORS.accent.amber }}>WEEKLY_VEHICLE_STATS</code>
                </p>
                <div style={{ background:COLORS.bg.hover, borderRadius:10, padding:"0.9rem 1.4rem", display:"inline-block", textAlign:"left" }}>
                  <div style={{ fontSize:"0.65rem", color:COLORS.text.subtle, marginBottom:6, fontWeight:600, textTransform:"uppercase" }}>Run Spark Batch</div>
                  <code style={{ fontSize:"0.75rem", color:COLORS.primary.light }}>
                    spark-submit --class com.example.prtrafficur.batch.TrafficAnalysisBatch target/prTrafficUr-0.0.1-SNAPSHOT.jar
                  </code>
                </div>
              </div>
            )}

            {/* Spark Charts */}
            {hasSparkData && (
              <div style={{ display:"grid", gap:"1.5rem" }}>

                {/* Row 1 : Status Pie + Vehicle Pie */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:4 }}>🚦 Traffic Status Distribution</div>
                    <p style={{ fontSize:"0.72rem", color:COLORS.text.subtle, marginBottom:"1.2rem" }}>TRAFFIC_STATUS_STATS — Spark computed</p>
                    <DonutChart segments={statusSegments} size={160} />
                  </div>
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:4 }}>🚗 Vehicle Composition</div>
                    <p style={{ fontSize:"0.72rem", color:COLORS.text.subtle, marginBottom:"1.2rem" }}>WEEKLY_VEHICLE_STATS — Week 1</p>
                    <DonutChart segments={vehicleSegments} size={160} />
                  </div>
                </div>

                {/* Row 2 : Volume Bar */}
                {volumeBarData.length > 0 && (
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:4 }}>📊 Traffic Volume by Zone</div>
                    <p style={{ fontSize:"0.72rem", color:COLORS.text.subtle, marginBottom:"1.2rem" }}>TRAFFIC_STATS — total vehicles per location</p>
                    <BarChart data={volumeBarData} color={COLORS.primary.light} />
                  </div>
                )}

                {/* Row 3 : Volume Ranking horizontal */}
                {volumeBarData.length > 0 && (
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.4rem" }}>📍 Volume Ranking by Zone</div>
                    {volumeBarData.slice(0, 10).map((d, i) => (
                      <HorizontalBar key={i} label={d.label} value={d.value} max={maxVolume} color={ZONE_PALETTE[i % ZONE_PALETTE.length]} />
                    ))}
                  </div>
                )}

                {/* Row 4 : Speed / Weekly Evolution Area */}
                {speedAreaData.length > 0 && (
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:4 }}>📈 Weekly Vehicle Evolution</div>
                    <p style={{ fontSize:"0.72rem", color:COLORS.text.subtle, marginBottom:"1.2rem" }}>WEEKLY_VEHICLE_STATS — total vehicles per week</p>
                    <AreaChart data={speedAreaData} color={COLORS.accent.amber} height={160} />
                  </div>
                )}

                {/* Row 5 : Location Stats Table */}
                {locationTable.length > 0 && (
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
                    <div style={{ padding:"1rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary }}>📊 Traffic Stats by Location</span>
                      <span style={{ fontSize:"0.72rem", color:COLORS.text.subtle }}>TRAFFIC_STATS — Spark aggregated</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr", padding:"0.7rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.65rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700 }}>
                      <span>Location</span><span>Avg Speed</span><span>Total Volume</span><span>Accidents</span>
                    </div>
                    {locationTable.slice(0, 10).map((s, i) => (
                      <div key={i} style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr", padding:"0.85rem 1.4rem", borderBottom:i===Math.min(locationTable.length,10)-1?"none":"1px solid rgba(127,119,221,0.05)", alignItems:"center" }}>
                        <span style={{ fontSize:"0.8rem", color:COLORS.primary.light, fontWeight:600 }}>#{s.id}</span>
                        <span style={{ fontSize:"0.85rem", color:COLORS.accent.amber, fontWeight:500 }}>{s.speed!=null?`${Number(s.speed).toFixed(1)} km/h`:"—"}</span>
                        <span style={{ fontSize:"0.85rem", color:COLORS.text.primary }}>{s.volume!=null?Math.round(s.volume).toLocaleString():"—"}</span>
                        <span style={{ fontSize:"0.85rem", color:s.accidents>0?COLORS.accent.coral:COLORS.accent.teal, fontWeight:600 }}>
                          {s.accidents ?? 0} {s.accidents > 0 ? "⚠" : "✓"}
                        </span>
                      </div>
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