import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

const API = "http://localhost:8081";
const NIVEAUX = ["BLOCKED", "HEAVY", "MODERATE", "LOW"];

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function niveauColor(n) {
  switch (n?.toUpperCase()) {
    case "BLOCKED":  return COLORS.accent.coral;
    case "HEAVY":    return "#E24B4A";
    case "MODERATE": return COLORS.accent.amber;
    case "LOW":      return COLORS.accent.teal;
    default:         return COLORS.primary.light;
  }
}

function niveauLabel(n) {
  const m = { BLOCKED:"Blocked", HEAVY:"Critical", MODERATE:"High", LOW:"Moderate" };
  return m[n?.toUpperCase()] || n || "—";
}

function GlowOrb({ x, y, color, size=400, opacity=0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderTop:`2px solid ${color}`, borderRadius:12, padding:"1.1rem 1.3rem", textAlign:"center" }}>
      <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>{label}</div>
    </div>
  );
}

function NiveauBadge({ niveau }) {
  const color = niveauColor(niveau);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:color+"20", border:`1px solid ${color}55`, color, fontSize:"0.72rem", fontWeight:700, padding:"0.2rem 0.65rem", borderRadius:6 }}>
      {niveauLabel(niveau)}
    </span>
  );
}

export default function UserPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "User";

  // ── States ──
  const [sensors, setSensors]               = useState([]);
  const [allCongestions, setAllCongestions] = useState([]);
  const [loadingData, setLoadingData]       = useState(true);
  const [toast, setToast]                   = useState(null);
  const [pulse, setPulse]                   = useState(true);

  // Zone Details
  const [selectedZoneId, setSelectedZoneId]   = useState("");
  const [latestData, setLatestData]           = useState(null);
  const [latestLoading, setLatestLoading]     = useState(false);

  // Report
  const [reportZoneId, setReportZoneId]   = useState("");
  const [reportType, setReportType]       = useState("ACCIDENT");
  const [reporting, setReporting]         = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Pulse animation
  useEffect(() => {
    const t = setInterval(() => setPulse(v => !v), 1200);
    return () => clearInterval(t);
  }, []);

  // ── Charger sensors + congestions au démarrage ──
  useEffect(() => {
    const loadSensors = async () => {
      try {
        const res = await fetch(`${API}/api/users/sensors`, { headers: getHeaders() });
        if (res.status === 401) { navigate("/login"); return; }
        if (!res.ok) return;
        const data = await res.json();
        setSensors(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
    };

    const loadAllCongestions = async () => {
      try {
        const results = await Promise.allSettled(
          NIVEAUX.map(n =>
            fetch(`${API}/api/users/congestions/niveau/${n}`, { headers: getHeaders() })
              .then(r => r.ok ? r.json() : [])
              .catch(() => [])
          )
        );
        const combined = results
          .filter(r => r.status === "fulfilled")
          .flatMap(r => Array.isArray(r.value) ? r.value : []);
        const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());
        unique.sort((a, b) => new Date(b.heureDate) - new Date(a.heureDate));
        setAllCongestions(unique);
      } catch (e) { console.error(e); }
      finally { setLoadingData(false); }
    };

    loadSensors();
    loadAllCongestions();
  }, []);

  // ── Zone Details: GET /api/users/congestions/latestOflocation/{id} ──
  const fetchLatestOfZone = async (locId) => {
    if (!locId) { setLatestData(null); return; }
    setLatestLoading(true);
    setLatestData(null);
    try {
      const res = await fetch(`${API}/api/users/congestions/latestOflocation/${locId}`, { headers: getHeaders() });
      if (!res.ok) { showToast("No data for this zone", "error"); return; }
      setLatestData(await res.json());
    } catch (e) { console.error(e); showToast("Error loading zone", "error"); }
    finally { setLatestLoading(false); }
  };

  const handleZoneChange = (e) => {
    setSelectedZoneId(e.target.value);
    fetchLatestOfZone(e.target.value);
  };

  // ── Report: POST /api/users/report ──
  const handleReport = async () => {
    if (!reportZoneId) { showToast("Please select a zone", "error"); return; }
    setReporting(true);
    setReportSuccess(false);
    try {
      const res = await fetch(
        `${API}/api/users/report?locationId=${reportZoneId}&cause=${reportType}`,
        { method: "POST", headers: getHeaders() }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      setReportSuccess(true);
      showToast("✅ Report submitted successfully!");
      setReportZoneId("");
      setReportType("ACCIDENT");
      // Refresh congestions
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      showToast("Error submitting report", "error");
    } finally {
      setReporting(false);
    }
  };

  // Counts par niveau
  const counts = NIVEAUX.reduce((acc, n) => {
    acc[n] = allCongestions.filter(c => c.niveau?.toUpperCase() === n).length;
    return acc;
  }, {});

  const selectedSensor = sensors.find(s => String(s.id) === String(selectedZoneId));

  const REPORT_TYPES = [
    { value: "ACCIDENT",   label: "🚨 Accident",       desc: "Vehicle collision or road accident", color: COLORS.accent.coral },
    { value: "SATURATION", label: "🚗 Saturation",     desc: "Heavy traffic buildup",              color: COLORS.accent.amber },
    { value: "TRAFIC",     label: "🛣️ Dense Traffic",  desc: "Unusually dense road traffic",       color: COLORS.primary.light },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(127,119,221,0.3); color:#fff; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
        option { background:#110F1E; }
      `}</style>

      <GlowOrb x="10%" y="15%" color={COLORS.primary.dark} size={500} opacity={0.1} />
      <GlowOrb x="85%" y="70%" color={COLORS.accent.coral} size={400} opacity={0.07} />
      <GlowOrb x="50%" y="40%" color={COLORS.accent.teal} size={350} opacity={0.06} />

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:"1.5rem", right:"1.5rem", zIndex:999, background:toast.type==="error"?`${COLORS.accent.coral}18`:`${COLORS.accent.teal}18`, border:`1px solid ${toast.type==="error"?COLORS.accent.coral:COLORS.accent.teal}55`, color:toast.type==="error"?"#F0997B":COLORS.accent.teal, borderRadius:10, padding:"0.75rem 1.4rem", fontSize:"0.88rem", fontWeight:500, display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
          {toast.type==="error"?"⚠":"✓"} {toast.msg}
        </div>
      )}

      {/* ── NAVBAR ── */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:60, background:COLORS.bg.card, borderBottom:"1px solid rgba(127,119,221,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 2rem", zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🚦</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1rem", color:COLORS.text.primary }}>TrafficIQ</span>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:`${COLORS.accent.teal}18`, border:`1px solid ${COLORS.accent.teal}40`, borderRadius:100, padding:"0.15rem 0.6rem", marginLeft:8 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:COLORS.accent.teal, transform:`scale(${pulse?1:0.6})`, transition:"transform 0.5s ease", boxShadow:`0 0 5px ${COLORS.accent.teal}` }} />
            <span style={{ fontSize:"0.65rem", color:COLORS.accent.teal, fontWeight:600, letterSpacing:"0.06em" }}>LIVE</span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>👤</div>
            <div>
              <div style={{ fontSize:"0.82rem", fontWeight:600, color:COLORS.text.primary }}>{userName}</div>
              <div style={{ fontSize:"0.68rem", color:COLORS.accent.teal, fontWeight:600 }}>USER</div>
            </div>
          </div>
          <div style={{ width:1, height:30, background:"rgba(127,119,221,0.2)" }} />
          <button
            onClick={() => { localStorage.clear(); navigate("/"); }}
            style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:COLORS.text.muted, borderRadius:8, padding:"0.4rem 0.9rem", fontSize:"0.8rem", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}
            onMouseEnter={e => e.currentTarget.style.color="#F0997B"}
            onMouseLeave={e => e.currentTarget.style.color=COLORS.text.muted}
          >
            <span>⎋</span> Logout
          </button>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div style={{ paddingTop:80, padding:"80px 2.5rem 2.5rem", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:"2rem" }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>
            Traffic Overview
          </h1>
          <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>
            Real-time traffic conditions across all urban zones
          </p>
        </div>

        {/* ══════════════════════════════════
            1. STAT CARDS — Overview
        ══════════════════════════════════ */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:14, marginBottom:"2rem" }}>
          {[
            { label:"Blocked",  key:"BLOCKED",  color:COLORS.accent.coral, icon:"🔴" },
            { label:"Critical", key:"HEAVY",    color:"#E24B4A",           icon:"🟠" },
            { label:"High",     key:"MODERATE", color:COLORS.accent.amber, icon:"🟡" },
            { label:"Moderate", key:"LOW",      color:COLORS.accent.teal,  icon:"🟢" },
          ].map(s => <StatCard key={s.key} label={s.label} value={loadingData ? "—" : (counts[s.key]??0)} color={s.color} icon={s.icon} />)}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"2rem" }}>

          {/* ══════════════════════════════════
              2. ZONE DETAILS
          ══════════════════════════════════ */}
          <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.4rem" }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"1.2rem" }}>
              📍 Zone Details
            </h2>

            <select value={selectedZoneId} onChange={handleZoneChange} style={{ width:"100%", background:COLORS.bg.hover, border:`1px solid ${COLORS.primary.light}44`, borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.85rem", color:selectedZoneId?COLORS.text.primary:COLORS.text.muted, outline:"none", fontFamily:"inherit", cursor:"pointer", marginBottom:"1.2rem" }}>
              <option value="" style={{ background:COLORS.bg.card }}>— Select a zone —</option>
              {sensors.map(s => (
                <option key={s.id} value={s.id} style={{ background:COLORS.bg.card }}>
                  {s.name ? `${s.name} (Zone ${s.zone ?? s.id})` : `Location #${s.id}`}
                </option>
              ))}
            </select>

            {latestLoading && (
              <div style={{ textAlign:"center", padding:"1.5rem", color:COLORS.text.muted, fontSize:"0.85rem" }}>Loading...</div>
            )}

            {!latestData && !latestLoading && (
              <div style={{ textAlign:"center", padding:"1.5rem", color:COLORS.text.subtle, fontSize:"0.82rem", fontStyle:"italic" }}>
                Select a zone to see its latest congestion data
              </div>
            )}

            {latestData && !latestLoading && (
              <>
                {selectedSensor && (
                  <div style={{ marginBottom:"1rem", fontSize:"0.78rem", color:COLORS.text.muted }}>
                    📍 {selectedSensor.name} — Zone {selectedSensor.zone}
                    <span style={{ marginLeft:8, color:COLORS.primary.light, fontWeight:600 }}>
                      {latestData.heureDate ? new Date(latestData.heureDate).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : ""}
                    </span>
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
                  {[
                    { icon:"🚗", label:"Vehicles",    value: latestData.nbrVehicule ?? "—",                                                   color: COLORS.text.primary },
                    { icon:"⚡", label:"Avg Speed",   value: latestData.vitesseMoy != null ? `${Number(latestData.vitesseMoy).toFixed(0)} km/h` : "—", color: COLORS.accent.amber },
                    { icon:"📊", label:"Volume",      value: latestData.volumeTraffic != null ? Math.round(latestData.volumeTraffic) : "—",   color: COLORS.text.primary },
                    { icon:"🚦", label:"Level",       value: niveauLabel(latestData.niveau),                                                   color: niveauColor(latestData.niveau) },
                  ].map(stat => (
                    <div key={stat.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"0.9rem", textAlign:"center", border:`1px solid rgba(127,119,221,0.1)` }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{stat.icon}</div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.3rem", fontWeight:800, color:stat.color, marginBottom:3 }}>{stat.value}</div>
                      <div style={{ fontSize:"0.65rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ══════════════════════════════════
              3. REPORT AN INCIDENT
          ══════════════════════════════════ */}
          <div style={{ background:COLORS.bg.card, border:`1px solid ${reportSuccess?"rgba(29,158,117,0.4)":"rgba(127,119,221,0.1)"}`, borderRadius:14, padding:"1.4rem", transition:"border 0.3s" }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"0.4rem" }}>
              📢 Report an Incident
            </h2>
            <p style={{ fontSize:"0.78rem", color:COLORS.text.muted, marginBottom:"1.2rem", fontWeight:300 }}>
              Help other users by reporting traffic issues in your zone
            </p>

            {/* Zone selector */}
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ display:"block", fontSize:"0.72rem", color:"#7C7A99", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Zone</label>
              <select value={reportZoneId} onChange={e=>setReportZoneId(e.target.value)} style={{ width:"100%", background:COLORS.bg.hover, border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.85rem", color:reportZoneId?COLORS.text.primary:COLORS.text.muted, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
                <option value="" style={{ background:COLORS.bg.card }}>— Select your zone —</option>
                {sensors.map(s => (
                  <option key={s.id} value={s.id} style={{ background:COLORS.bg.card }}>
                    {s.name ? `${s.name} (Zone ${s.zone ?? s.id})` : `Location #${s.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Incident type */}
            <div style={{ marginBottom:"1.2rem" }}>
              <label style={{ display:"block", fontSize:"0.72rem", color:"#7C7A99", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Incident Type</label>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {REPORT_TYPES.map(type => (
                  <div
                    key={type.value}
                    onClick={() => setReportType(type.value)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"0.75rem 1rem", borderRadius:10, border:`1px solid ${reportType===type.value?type.color+"66":"rgba(255,255,255,0.08)"}`, background:reportType===type.value?type.color+"12":"transparent", cursor:"pointer", transition:"all 0.18s" }}
                  >
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${reportType===type.value?type.color:"rgba(255,255,255,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {reportType === type.value && <div style={{ width:8, height:8, borderRadius:"50%", background:type.color }} />}
                    </div>
                    <div>
                      <div style={{ fontSize:"0.85rem", fontWeight:600, color:reportType===type.value?type.color:COLORS.text.primary }}>{type.label}</div>
                      <div style={{ fontSize:"0.72rem", color:COLORS.text.muted, marginTop:1 }}>{type.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleReport}
              disabled={!reportZoneId || reporting}
              style={{
                width:"100%", padding:"0.85rem",
                background: reportSuccess
                  ? `linear-gradient(135deg,${COLORS.accent.teal},#16a085)`
                  : (!reportZoneId || reporting)
                  ? "rgba(255,255,255,0.06)"
                  : `linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`,
                color: (!reportZoneId || reporting) ? COLORS.text.muted : COLORS.text.primary,
                border:"none", borderRadius:10, fontSize:"0.9rem", fontWeight:700,
                cursor:(!reportZoneId||reporting)?"not-allowed":"pointer",
                fontFamily:"inherit", transition:"all 0.25s",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}
            >
              {reportSuccess ? "✅ Report Submitted!" : reporting ? "Submitting..." : "🚨 Submit Report"}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════
            4. LISTE CONGESTIONS — lecture seule
        ══════════════════════════════════ */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"1rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary }}>
              Current Congestions {allCongestions.length > 0 && `(${allCongestions.length})`}
            </span>
            <span style={{ fontSize:"0.72rem", color:COLORS.text.subtle }}>Read only — Admin manages this data</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"50px 100px 110px 80px 80px 1fr 120px", padding:"0.7rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.65rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
            <span>ID</span><span>Level</span><span>Cause</span><span>Speed</span><span>Vehicles</span><span>Zone</span><span>Date</span>
          </div>

          {loadingData ? (
            <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted, fontSize:"0.88rem" }}>Loading...</div>
          ) : allCongestions.length === 0 ? (
            <div style={{ padding:"3rem", textAlign:"center" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem", opacity:0.15 }}>🟢</div>
              <div style={{ color:COLORS.text.muted, fontSize:"0.88rem" }}>No congestion data available</div>
            </div>
          ) : (
            allCongestions.slice(0, 10).map((c, i) => {
              const color = niveauColor(c.niveau);
              const sensor = sensors.find(s => s.id === c.locationId);
              return (
                <div key={c.id} style={{ display:"grid", gridTemplateColumns:"50px 100px 110px 80px 80px 1fr 120px", padding:"0.85rem 1.4rem", borderBottom:i===Math.min(allCongestions.length,10)-1?"none":"1px solid rgba(127,119,221,0.06)", alignItems:"center", borderLeft:`2px solid ${color}` }}>
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.subtle, fontWeight:600 }}>#{c.id}</span>
                  <NiveauBadge niveau={c.niveau} />
                  <span style={{ fontSize:"0.72rem", color:COLORS.text.muted }}>{c.cause || "—"}</span>
                  <span style={{ fontSize:"0.8rem", color:COLORS.accent.amber, fontWeight:500 }}>{c.vitesseMoy!=null?`${Number(c.vitesseMoy).toFixed(0)} km/h`:"—"}</span>
                  <span style={{ fontSize:"0.8rem", color:COLORS.text.primary }}>{c.nbrVehicule??"—"}</span>
                  <span style={{ fontSize:"0.75rem", color:COLORS.text.muted }}>{sensor?.name ?? `Loc #${c.locationId??"—"}`}</span>
                  <span style={{ fontSize:"0.7rem", color:COLORS.text.subtle }}>{c.heureDate?new Date(c.heureDate).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"}</span>
                </div>
              );
            })
          )}

          {allCongestions.length > 10 && (
            <div style={{ padding:"0.85rem 1.4rem", textAlign:"center", borderTop:"1px solid rgba(127,119,221,0.06)", fontSize:"0.78rem", color:COLORS.text.muted }}>
              Showing 10 of {allCongestions.length} congestions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}