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

function StatCard({ label, value, sub, color, icon, loading, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: COLORS.bg.card,
        border: `1px solid ${hov && onClick ? color+"55" : "rgba(127,119,221,0.1)"}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 14, padding: "1.3rem 1.5rem",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        transform: hov && onClick ? "translateY(-2px)" : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position:"absolute", right:14, top:14, fontSize:20, opacity:0.12 }}>{icon}</div>
      <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:loading?"#3A3660":color, lineHeight:1, marginBottom:6 }}>
        {loading ? "—" : value}
      </div>
      {sub && <div style={{ fontSize:"0.72rem", color:COLORS.text.subtle }}>{sub}</div>}
    </div>
  );
}

function SystemBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:"0.8rem", color:COLORS.text.primary, fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:"0.8rem", color, fontWeight:700 }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:100, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:100, transition:"width 1s ease" }} />
      </div>
    </div>
  );
}

function NiveauBadge({ niveau }) {
  const map = {
    BLOCKED:  { label:"Blocked",  color:COLORS.accent.coral },
    HEAVY:    { label:"Heavy",    color:"#E24B4A" },
    MODERATE: { label:"Moderate", color:COLORS.accent.amber },
    LOW:      { label:"Low",      color:COLORS.accent.teal },
  };
  const s = map[niveau?.toUpperCase()] || { label:niveau||"—", color:COLORS.primary.light };
  return (
    <span style={{ background:s.color+"20", border:`1px solid ${s.color}55`, color:s.color, fontSize:"0.68rem", fontWeight:700, padding:"0.18rem 0.5rem", borderRadius:6 }}>
      {s.label}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pulse, setPulse]   = useState(true);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalRecords: 0, avgSpeed: 0, accidents: 0,
    totalSensors: 0, activeSensors: 0,
    totalSignals: 0, totalCongestions: 0,
    pendingCongestions: 0, approvedCongestions: 0,
  });
  const [recentCongestions, setRecentCongestions] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setPulse(v => !v), 1200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [records, sens, sigs, congs, speed, accidents] = await Promise.allSettled([
          fetch(`${API}/api/admin/data/total`,            { headers:getHeaders() }).then(r => r.ok ? r.json() : 0),
          fetch(`${API}/api/users/sensors`,               { headers:getHeaders() }).then(r => r.ok ? r.json() : []),
          fetch(`${API}/api/users/signals`,               { headers:getHeaders() }).then(r => r.ok ? r.json() : []),
          fetch(`${API}/api/admin/congestions`,           { headers:getHeaders() }).then(r => r.ok ? r.json() : []),
          fetch(`${API}/api/admin/data/speed/latestDate`, { headers:getHeaders() }).then(r => r.ok ? r.json() : 0),
          fetch(`${API}/api/users/data/niveau/accidents`, { headers:getHeaders() }).then(r => r.ok ? r.json() : 0),
        ]);

        const sensList  = Array.isArray(sens.value)  ? sens.value  : [];
        const congsList = Array.isArray(congs.value) ? congs.value : [];
        const sigsList  = Array.isArray(sigs.value)  ? sigs.value  : [];

        const active   = sensList.filter(s => s.etat?.toUpperCase() === "ACTIF" || s.active === true).length;
        const pending  = congsList.filter(c => c.status === "PENDING").length;
        const approved = congsList.filter(c => c.status === "APPROVED").length;

        setStats({
          totalRecords:        records.value  ?? 0,
          avgSpeed:            speed.value    ?? 0,
          accidents:           accidents.value ?? 0,
          totalSensors:        sensList.length,
          activeSensors:       active,
          totalSignals:        sigsList.length,
          totalCongestions:    congsList.length,
          pendingCongestions:  pending,
          approvedCongestions: approved,
        });

        const sorted = [...congsList].sort((a,b) => new Date(b.heureDate) - new Date(a.heureDate));
        setRecentCongestions(sorted.slice(0, 5));
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const fmt = (v, dec=1) => v != null ? Number(v).toFixed(dec) : "—";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(127,119,221,0.3); color:#fff; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
      `}</style>

      <GlowOrb x="15%" y="20%" color={COLORS.primary.dark} size={500} opacity={0.1} />
      <GlowOrb x="85%" y="70%" color={COLORS.accent.teal}  size={400} opacity={0.07} />

      <Sidebar />

      <div style={{ marginLeft:220, padding:"2.5rem", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2rem" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>
                Admin Dashboard
              </h1>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${COLORS.accent.teal}18`, border:`1px solid ${COLORS.accent.teal}40`, borderRadius:100, padding:"0.2rem 0.7rem" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:COLORS.accent.teal, transform:`scale(${pulse?1:0.65})`, transition:"transform 0.5s ease", boxShadow:`0 0 5px ${COLORS.accent.teal}` }} />
                <span style={{ fontSize:"0.7rem", color:COLORS.accent.teal, fontWeight:600, letterSpacing:"0.06em" }}>LIVE</span>
              </div>
            </div>
            <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", fontWeight:300 }}>
              Welcome back — here's your city traffic overview.
            </p>
          </div>
          <div style={{ fontSize:"0.8rem", color:COLORS.text.subtle, fontWeight:500 }}>
            {new Date().toLocaleDateString("en-GB", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </div>
        </div>

        {/* ── Row 1 : Key metrics ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:14, marginBottom:"1.5rem" }}>
          <StatCard label="Traffic Records" value={(stats.totalRecords??0).toLocaleString()} color={COLORS.primary.light} icon="📊" sub="All data points"      loading={loading} onClick={() => navigate("/admin/traffic")} />
          <StatCard label="Avg Speed"        value={`${fmt(stats.avgSpeed,2)} km/h`}          color={COLORS.accent.amber}  icon="⚡" sub="Latest date average"  loading={loading} />
          <StatCard label="Total Accidents"  value={(stats.accidents??0).toLocaleString()}    color={COLORS.accent.coral}  icon="🚨" sub="Across all records"   loading={loading} onClick={() => navigate("/admin/traffic")} />
        </div>

        {/* ── Row 2 : Infrastructure + Congestion ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"1.5rem" }}>

          {/* System Health */}
          <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.4rem" }}>
              🏗️ Infrastructure
            </div>
            {loading ? (
              <div style={{ color:COLORS.text.muted, fontSize:"0.85rem" }}>Loading...</div>
            ) : (
              <>
                <SystemBar label="Active Sensors"    value={stats.activeSensors}      max={stats.totalSensors||1}       color={COLORS.accent.teal} />
                <SystemBar label="Total Sensors"     value={stats.totalSensors}       max={stats.totalSensors||1}       color={COLORS.primary.light} />
                <SystemBar label="Traffic Signals"   value={stats.totalSignals}       max={Math.max(stats.totalSignals,10)} color={COLORS.accent.amber} />
                <div style={{ marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:20 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:COLORS.accent.teal }}>{stats.activeSensors}</div>
                    <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:600 }}>Active</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:COLORS.accent.coral }}>{stats.totalSensors - stats.activeSensors}</div>
                    <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:600 }}>Inactive</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:COLORS.accent.amber }}>{stats.totalSignals}</div>
                    <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:600 }}>Signals</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Congestion Overview */}
          <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.5rem" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.4rem" }}>
              ◈ Congestion Overview
            </div>
            {loading ? (
              <div style={{ color:COLORS.text.muted, fontSize:"0.85rem" }}>Loading...</div>
            ) : (
              <>
                <SystemBar label="Total Congestions" value={stats.totalCongestions}    max={stats.totalCongestions||1}  color={COLORS.accent.coral} />
                <SystemBar label="Approved"           value={stats.approvedCongestions} max={stats.totalCongestions||1} color={COLORS.accent.teal} />
                <SystemBar label="Pending Review"     value={stats.pendingCongestions}  max={stats.totalCongestions||1} color={COLORS.accent.amber} />
                <div style={{ marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:20 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:COLORS.accent.coral }}>{stats.totalCongestions}</div>
                    <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:600 }}>Total</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:COLORS.accent.teal }}>{stats.approvedCongestions}</div>
                    <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:600 }}>Approved</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:COLORS.accent.amber }}>{stats.pendingCongestions}</div>
                    <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:600 }}>Pending</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Recent Congestions ── */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.05rem", fontWeight:700, color:COLORS.text.primary }}>Recent Congestions</h2>
            <button onClick={() => navigate("/admin/congestion")}
              onMouseEnter={e=>e.currentTarget.style.background=`${COLORS.primary.light}18`}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              style={{ background:"transparent", border:`1px solid ${COLORS.primary.light}44`, color:COLORS.primary.light, borderRadius:8, padding:"0.38rem 0.9rem", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"background 0.15s" }}>
              View all →
            </button>
          </div>

          <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"55px 105px 115px 85px 1fr 130px", padding:"0.7rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.65rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700 }}>
              <span>ID</span><span>Level</span><span>Cause</span><span>Speed</span><span>Sensor</span><span>Date</span>
            </div>

            {loading ? (
              <div style={{ padding:"2.5rem", textAlign:"center", color:COLORS.text.muted }}>Loading...</div>
            ) : recentCongestions.length === 0 ? (
              <div style={{ padding:"2.5rem", textAlign:"center", color:COLORS.text.muted }}>No congestion data yet</div>
            ) : recentCongestions.map((c, i) => {
              const borderColor = { BLOCKED:COLORS.accent.coral, HEAVY:"#E24B4A", MODERATE:COLORS.accent.amber, LOW:COLORS.accent.teal }[c.niveau?.toUpperCase()] || COLORS.primary.light;
              return (
                <div key={c.id} style={{ display:"grid", gridTemplateColumns:"55px 105px 115px 85px 1fr 130px", padding:"0.88rem 1.4rem", borderBottom:i===recentCongestions.length-1?"none":"1px solid rgba(127,119,221,0.06)", alignItems:"center", borderLeft:`2px solid ${borderColor}` }}>
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.subtle, fontWeight:600 }}>#{c.id}</span>
                  <NiveauBadge niveau={c.niveau} />
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.muted }}>{c.cause || "—"}</span>
                  <span style={{ fontSize:"0.82rem", color:COLORS.accent.amber, fontWeight:500 }}>
                    {c.vitesseMoy != null ? `${Number(c.vitesseMoy).toFixed(1)} km/h` : "—"}
                  </span>
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.muted }}>
                    {c.locationId ? `#${c.locationId}` : "—"}
                  </span>
                  <span style={{ fontSize:"0.72rem", color:COLORS.text.subtle }}>
                    {c.heureDate ? new Date(c.heureDate).toLocaleString("en-GB", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}