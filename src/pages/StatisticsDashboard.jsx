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

function GlowOrb({ x, y, color, size=400, opacity=0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderLeft:`3px solid ${color}`, borderRadius:12, padding:"1.2rem 1.4rem", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", right:12, top:12, fontSize:22, opacity:0.12 }}>{icon}</div>
      <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.9rem", fontWeight:800, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:"0.72rem", color:COLORS.text.subtle, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

// ── Bar Chart SVG ──────────────────────────────────────
function BarChart({ data, color, height=180, label }) {
  if (!data || data.length === 0) return <div style={{ color:COLORS.text.subtle, textAlign:"center", padding:"2rem", fontSize:"0.85rem" }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(20, Math.floor(500 / data.length) - 8);

  return (
    <div>
      {label && <div style={{ fontSize:"0.72rem", color:COLORS.text.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>{label}</div>}
      <div style={{ overflowX:"auto" }}>
        <svg width={Math.max(500, data.length*(barW+8))} height={height+40} style={{ display:"block" }}>
          {data.map((d, i) => {
            const barH = Math.max(4, (d.value / max) * height);
            const x = i * (barW + 8) + 4;
            const y = height - barH + 4;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
                <text x={x + barW/2} y={height+18} textAnchor="middle" fontSize={10} fill={COLORS.text.subtle}>{d.label}</text>
                <text x={x + barW/2} y={y-4} textAnchor="middle" fontSize={10} fill={COLORS.text.muted}>{d.value}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── Donut Chart SVG ────────────────────────────────────
function DonutChart({ segments, size=160 }) {
  if (!segments || segments.length === 0) return <div style={{ color:COLORS.text.subtle, textAlign:"center", padding:"1rem", fontSize:"0.85rem" }}>No data</div>;
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ color:COLORS.text.subtle, textAlign:"center", padding:"1rem" }}>No data</div>;

  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.22;
  let angle = -Math.PI / 2;

  const arcs = segments.map(seg => {
    const fraction = seg.value / total;
    const startAngle = angle;
    const endAngle = angle + fraction * 2 * Math.PI;
    angle = endAngle;

    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + inner * Math.cos(startAngle), yi1 = cy + inner * Math.sin(startAngle);
    const xi2 = cx + inner * Math.cos(endAngle),   yi2 = cy + inner * Math.sin(endAngle);
    const large = fraction > 0.5 ? 1 : 0;

    return {
      ...seg, fraction,
      d: `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`
    };
  });

  return (
    <div style={{ display:"flex", alignItems:"center", gap:20 }}>
      <svg width={size} height={size}>
        {arcs.map((arc, i) => <path key={i} d={arc.d} fill={arc.color} opacity={0.9} />)}
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLORS.text.primary}>{total}</text>
        <text x={cx} y={cy+18} textAnchor="middle" fontSize={9} fill={COLORS.text.subtle}>TOTAL</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:seg.color, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:"0.78rem", color:COLORS.text.primary, fontWeight:600 }}>{seg.label}</div>
              <div style={{ fontSize:"0.68rem", color:COLORS.text.subtle }}>{seg.value} ({Math.round(seg.value/total*100)}%)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Line Chart SVG ─────────────────────────────────────
function LineChart({ data, color, height=140, label }) {
  if (!data || data.length < 2) return <div style={{ color:COLORS.text.subtle, textAlign:"center", padding:"2rem", fontSize:"0.85rem" }}>Not enough data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 500, h = height;
  const pts = data.map((d, i) => ({ x: (i/(data.length-1))*w, y: h - (d.value/max)*h*0.85 }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div>
      {label && <div style={{ fontSize:"0.72rem", color:COLORS.text.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>{label}</div>}
      <svg width="100%" viewBox={`0 0 ${w} ${h+30}`} style={{ display:"block" }}>
        {/* Grid lines */}
        {[0.25,0.5,0.75,1].map(f => (
          <line key={f} x1={0} y1={h-f*h*0.85} x2={w} y2={h-f*h*0.85} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        {/* Line */}
        <polyline points={polyline} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* Fill */}
        <polygon points={`0,${h} ${polyline} ${w},${h}`} fill={color} opacity={0.08} />
        {/* Dots + labels */}
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

export default function StatisticsDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);

  // Spark stats tables
  const [trafficStats, setTrafficStats]   = useState([]);   // TRAFFIC_STATS
  const [statusStats, setStatusStats]     = useState([]);   // TRAFFIC_STATUS_STATS
  const [weeklyStats, setWeeklyStats]     = useState([]);   // WEEKLY_VEHICLE_STATS

  // Summary from existing endpoints
  const [summary, setSummary] = useState({
    total: null, avgSpeed: null, volume: null, accidents: null,
    sensors: null, congestions: null, signals: null
  });

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1. Summary depuis les endpoints existants
        const [total, avgSpeed, volume, accidents, sensors, signals] = await Promise.allSettled([
          fetch(`${API}/api/admin/data/total`,               { headers:getHeaders() }).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/admin/data/speed/latestDate`,    { headers:getHeaders() }).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/admin/data/volume/latestDate`,   { headers:getHeaders() }).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/admin/data/accident/latestDate`, { headers:getHeaders() }).then(r=>r.ok?r.json():null),
          fetch(`${API}/api/users/sensors`,                  { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/users/signals`,                  { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
        ]);

        setSummary({
          total:      total.value,
          avgSpeed:   avgSpeed.value,
          volume:     volume.value,
          accidents:  accidents.value,
          sensors:    Array.isArray(sensors.value) ? sensors.value.length : 0,
          signals:    Array.isArray(signals.value) ? signals.value.length : 0,
        });

        // 2. Spark tables — GET /api/admin/stats/*
        const [ts, ss, ws] = await Promise.allSettled([
          fetch(`${API}/api/admin/stats/traffic`,  { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/stats/status`,   { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/admin/stats/weekly`,   { headers:getHeaders() }).then(r=>r.ok?r.json():[]),
        ]);

        setTrafficStats(Array.isArray(ts.value) ? ts.value : []);
        setStatusStats(Array.isArray(ss.value)  ? ss.value  : []);
        setWeeklyStats(Array.isArray(ws.value)  ? ws.value  : []);

      } catch (e) { console.error(e); showToast("Erreur de chargement", "error"); }
      finally { setLoading(false); }
    };

    load();
  }, []);

  // ── Données pour les graphiques ──

  // Bar chart: vitesse moyenne par zone
  const speedByZone = trafficStats
    .filter(s => s.vitesseMoyenne != null)
    .map(s => ({ label:`Z${s.locationId}`, value: Math.round(s.vitesseMoyenne) }))
    .slice(0, 12);

  // Bar chart: accidents par zone
  const accidentsByZone = trafficStats
    .filter(s => s.totalAccidents != null)
    .map(s => ({ label:`Z${s.locationId}`, value: s.totalAccidents }))
    .slice(0, 12);

  // Donut: distribution du statut de trafic
  const statusColors = { Blocked:COLORS.accent.coral, Heavy:"#E24B4A", Moderate:COLORS.accent.amber, "Low/Fluid":COLORS.accent.teal };
  const statusSegments = statusStats.map(s => ({
    label: s.statut || s.status,
    value: s.totalCount || s.count || 0,
    color: statusColors[s.statut || s.status] || COLORS.primary.light,
  }));

  // Donut: répartition hebdomadaire des véhicules (agrégé)
  const totalVoitures = weeklyStats.reduce((acc, w) => acc + (w.totalVoitures||0), 0);
  const totalCamions  = weeklyStats.reduce((acc, w) => acc + (w.totalCamions||0), 0);
  const totalVelos    = weeklyStats.reduce((acc, w) => acc + (w.totalVelos||0), 0);
  const vehicleSegments = [
    { label:"Cars",   value:totalVoitures, color:COLORS.primary.light },
    { label:"Trucks", value:totalCamions,  color:COLORS.accent.amber },
    { label:"Bikes",  value:totalVelos,    color:COLORS.accent.teal },
  ].filter(s => s.value > 0);

  // Line chart: volume total par semaine
  const volumeByWeek = weeklyStats
    .sort((a,b) => (a.semaine||0)-(b.semaine||0))
    .map(w => ({ label:`W${w.semaine}`, value:(w.totalVoitures||0)+(w.totalCamions||0)+(w.totalVelos||0) }));

  const fmt = (v, dec=1) => v != null ? Number(v).toFixed(dec) : "—";

  // Mock data si Spark pas encore lancé
  const hasSparkData = trafficStats.length > 0 || statusStats.length > 0 || weeklyStats.length > 0;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(127,119,221,0.3); color:#fff; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
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
        <div style={{ marginBottom:"2rem" }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Statistics</h1>
          <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>
            Traffic analytics — powered by Apache Spark
            {!hasSparkData && <span style={{ color:COLORS.accent.amber, marginLeft:8 }}>⚠ Run Spark batch to load analytics data</span>}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"4rem", color:COLORS.text.muted }}>
            <div style={{ width:50, height:50, border:`3px solid ${COLORS.primary.light}33`, borderTop:`3px solid ${COLORS.primary.light}`, borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 1rem" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading statistics...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:14, marginBottom:"2rem" }}>
              <StatCard label="Total Records"  value={(summary.total??0).toLocaleString()}    color={COLORS.primary.light} icon="📊" sub="Traffic data points" />
              <StatCard label="Avg Speed"      value={`${fmt(summary.avgSpeed)} km/h`}         color={COLORS.accent.amber}  icon="⚡" sub="Latest date average" />
              <StatCard label="Total Sensors"  value={summary.sensors??0}                      color={COLORS.accent.teal}   icon="◎" sub="Active monitoring zones" />
              <StatCard label="Volume Traffic" value={fmt(summary.volume,0)}                   color={COLORS.primary.light} icon="🚗" sub="Latest date total" />
              <StatCard label="Accidents"      value={summary.accidents??0}                    color={COLORS.accent.coral}  icon="⚠️" sub="Latest date signaled" />
              <StatCard label="Traffic Signals"value={summary.signals??0}                      color={COLORS.accent.amber}  icon="🚦" sub="Active signals" />
            </div>

            {/* ── SPARK ANALYTICS ── */}
            {!hasSparkData ? (
              <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:16, padding:"3rem", textAlign:"center" }}>
                <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>⚡</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"0.75rem" }}>Spark Analytics Not Available</h3>
                <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", lineHeight:1.7, maxWidth:480, margin:"0 auto 1.5rem" }}>
                  Run the Spark batch job to generate analytics data. Once available, you'll see speed distributions, accident heatmaps, and vehicle composition charts here.
                </p>
                <div style={{ background:COLORS.bg.hover, borderRadius:10, padding:"1rem 1.5rem", display:"inline-block", textAlign:"left" }}>
                  <div style={{ fontSize:"0.72rem", color:COLORS.text.subtle, marginBottom:6, fontWeight:600, textTransform:"uppercase" }}>Run Spark Batch</div>
                  <code style={{ fontSize:"0.8rem", color:COLORS.primary.light }}>spark-submit --class ...TrafficAnalysisBatch target/prTrafficUr-0.0.1-SNAPSHOT.jar</code>
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gap:"1.5rem" }}>

                {/* Row 1: Speed by zone + Status donut */}
                <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:"1.5rem" }}>
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.2rem" }}>⚡ Avg Speed by Zone</div>
                    <BarChart data={speedByZone} color={COLORS.accent.amber} label="km/h average per location" />
                  </div>
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.2rem" }}>🚦 Traffic Status Distribution</div>
                    <DonutChart segments={statusSegments} />
                  </div>
                </div>

                {/* Row 2: Accidents by zone + Vehicle composition donut */}
                <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:"1.5rem" }}>
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.2rem" }}>🚨 Total Accidents by Zone</div>
                    <BarChart data={accidentsByZone} color={COLORS.accent.coral} label="accidents per location" />
                  </div>
                  <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.2rem" }}>🚗 Vehicle Composition</div>
                    <DonutChart segments={vehicleSegments} />
                  </div>
                </div>

                {/* Row 3: Weekly volume line chart */}
                <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.2rem" }}>📈 Weekly Vehicle Volume</div>
                  <LineChart data={volumeByWeek} color={COLORS.primary.light} label="Total vehicles per week" />
                </div>

                {/* Row 4: Traffic stats table */}
                <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"1rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary }}>📊 Traffic Stats by Zone</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr", padding:"0.7rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.68rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
                    <span>Zone</span><span>Avg Speed</span><span>Total Volume</span><span>Accidents</span>
                  </div>
                  {trafficStats.slice(0,10).map((s, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr", padding:"0.8rem 1.4rem", borderBottom:i===Math.min(trafficStats.length,10)-1?"none":"1px solid rgba(127,119,221,0.05)", alignItems:"center" }}>
                      <span style={{ fontSize:"0.8rem", color:COLORS.primary.light, fontWeight:600 }}>#{s.locationId}</span>
                      <span style={{ fontSize:"0.85rem", color:COLORS.accent.amber }}>{s.vitesseMoyenne!=null?`${Number(s.vitesseMoyenne).toFixed(1)} km/h`:"—"}</span>
                      <span style={{ fontSize:"0.85rem", color:COLORS.text.primary }}>{s.volumeTotal!=null?Math.round(s.volumeTotal).toLocaleString():"—"}</span>
                      <span style={{ fontSize:"0.85rem", color:s.totalAccidents>0?COLORS.accent.coral:COLORS.accent.teal }}>{s.totalAccidents??0}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}