import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

const API = "http://localhost:8081";
const NIVEAUX = ["BLOCKED", "HEAVY", "MODERATE", "LOW"];

// ── Coordonnées GPS exactes — clés = NOM_QUARTIER exact de la DB ──
const ZONE_COORDS = {
  "Ain Chock":      [33.5366, -7.5731],
  "Ain Sebaa":      [33.6089, -7.5314],
  "Anfa":           [33.5910, -7.6580],
  "Ben M'sik":      [33.5534, -7.5514],
  "Ben Msik":       [33.5534, -7.5514],
  "Bernoussi":      [33.6203, -7.5108],
  "Hay Hassani":    [33.5667, -7.6833],
  "Hay Mohammadi":  [33.5731, -7.5614],
  "Maarif":         [33.5856, -7.6364],
  "Medina":         [33.5992, -7.6189],
  "Moulay Rachid":  [33.5411, -7.5689],
  "Sidi Belyout":   [33.5975, -7.6253],
  "Sidi Bernoussi": [33.6072, -7.5086],
  "Sidi Moumen":    [33.5897, -7.5136],
  "Sidi Othmane":   [33.5692, -7.5786],
  "Corniche Ain Diab": [33.5987, -7.6908],
};

// ── Types de zones (TYPE_ROUTE DB) avec couleur et emoji ──
const ZONE_TYPE_META = {
  // Nouveaux types (après SQL UPDATE)
  HIGHWAY:      { label:"Highway",      color:"#E24B4A", emoji:"🛣️" },
  BOULEVARD:    { label:"Boulevard",    color:"#7F77DD", emoji:"🛤️" },
  AVENUE:       { label:"Avenue",       color:"#EF9F27", emoji:"🚦" },
  STREET:       { label:"Street",       color:"#4A9EDD", emoji:"🏙️" },
  COASTAL_ROAD: { label:"Coastal Road", color:"#1D9E75", emoji:"🌊" },
  INTERSECTION: { label:"Intersection", color:"#D85A30", emoji:"✖️" },
  // Anciens types déjà dans la DB
  Urbaine:      { label:"Urbaine",      color:"#7F77DD", emoji:"🏙️" },
  Autoroute:    { label:"Autoroute",    color:"#E24B4A", emoji:"🛣️" },
  Avenue:       { label:"Avenue",       color:"#EF9F27", emoji:"🚦" },
};

const CASABLANCA_CENTER = [33.5892, -7.6114];

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ✅ Extraire le mail du JWT
function getMailFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.email || payload.mail || null;
  } catch { return null; }
}

function niveauColor(n) {
  switch (n?.toUpperCase()) {
    case "BLOCKED":  return "#D85A30";
    case "HEAVY":    return "#E24B4A";
    case "MODERATE": return "#EF9F27";
    case "LOW":      return "#1D9E75";
    default:         return "#7F77DD";
  }
}

function niveauLabel(n) {
  return { BLOCKED:"Blocked", HEAVY:"Critical", MODERATE:"High", LOW:"Moderate" }[n?.toUpperCase()] || n || "Unknown";
}

function createColoredIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
    iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12],
  });
}

function GlowOrb({ x, y, color, size=400, opacity=0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

const REPORT_TYPES = [
  { value:"ACCIDENT",   label:"🚨 Accident",      color: "#D85A30" },
  { value:"SATURATION", label:"🚗 Saturation",    color: "#EF9F27" },
  { value:"TRAFIC",     label:"🛣️ Dense Traffic", color: "#7F77DD" },
];

const NIVEAUX_REPORT = ["LOW", "MODERATE", "HEAVY", "BLOCKED"];

export default function UserPage() {
  const navigate = useNavigate();

  // ✅ Profile utilisateur
  const [profile, setProfile]           = useState(null);
  const [sensors, setSensors]           = useState([]);
  const [signals, setSignals]           = useState([]);
  const [congestions, setCongestions]   = useState([]);
  const [loadingData, setLoadingData]   = useState(true);
  const [toast, setToast]               = useState(null);
  const [pulse, setPulse]               = useState(true);

  // Report
  const [reportZoneId, setReportZoneId]     = useState("");
  const [reportSignalId, setReportSignalId] = useState("");
  const [reportType, setReportType]         = useState("ACCIDENT");
  const [reportNiveau, setReportNiveau]     = useState("MODERATE");
  const [reporting, setReporting]           = useState(false);
  const [reportSuccess, setReportSuccess]   = useState(false);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const t = setInterval(() => setPulse(v => !v), 1200);
    return () => clearInterval(t);
  }, []);

  // ✅ Charger le profil utilisateur depuis le backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API}/api/user/profile`, { headers: getHeaders() });
        if (res.status === 401) { navigate("/login"); return; }
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch(e) { console.error(e); }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const loadSensors = async () => {
      try {
        const res = await fetch(`${API}/api/users/sensors`, { headers: getHeaders() });
        if (res.status === 401) { navigate("/login"); return; }
        const data = await res.json();
        setSensors(Array.isArray(data) ? data : []);
      } catch(e) { console.error(e); }
    };

    const loadSignals = async () => {
      try {
        const res = await fetch(`${API}/api/users/signals`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          setSignals(Array.isArray(data) ? data : []);
        }
      } catch(e) { console.error(e); }
    };

    const loadCongestions = async () => {
      try {
        const results = await Promise.allSettled(
          NIVEAUX.map(n =>
            fetch(`${API}/api/users/congestions/niveau/${n}`, { headers: getHeaders() })
              .then(r => r.ok ? r.json() : []).catch(() => [])
          )
        );
        const combined = results.filter(r => r.status === "fulfilled").flatMap(r => Array.isArray(r.value) ? r.value : []);
        const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());
        unique.sort((a, b) => new Date(b.heureDate) - new Date(a.heureDate));
        setCongestions(unique);
      } catch(e) { console.error(e); }
      finally { setLoadingData(false); }
    };

    loadSensors();
    loadSignals();
    loadCongestions();
  }, []);

  // ✅ Filtrer les signaux selon la zone sélectionnée
  const signalsForZone = signals.filter(s => String(s.locationId) === String(reportZoneId));

  // ✅ Report corrigé — POST /api/user/report-congestion avec CongestionReportDTO
  const handleReport = async () => {
    if (!reportZoneId) { showToast("Please select a zone", "error"); return; }
    if (!reportSignalId) { showToast("Please select a signal", "error"); return; }
    setReporting(true);
    try {
      const mail = getMailFromToken();
      const body = {
        mail:       mail,
        locationId: parseInt(reportZoneId),
        signalId:   parseInt(reportSignalId),
        cause:      reportType,
        niveau:     reportNiveau,
      };
      const res = await fetch(`${API}/api/user/report-congestion`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setReportSuccess(true);
      showToast("✅ Report submitted!");
      setReportZoneId(""); setReportSignalId(""); setReportType("ACCIDENT"); setReportNiveau("MODERATE");
      setTimeout(() => setReportSuccess(false), 3000);
    } catch(e) {
      showToast("Error submitting report", "error");
    } finally { setReporting(false); }
  };

  const getLatestCongestionForSensor = (sensorId) =>
    congestions.find(c => c.locationId === sensorId);

  // ✅ Priorité : coords DB (latitude/longitude) → ZONE_COORDS par nom → fallback aléatoire
  const getSensorCoords = (sensor) => {
    // 1. Coords directes depuis la DB via zoneLatitude/zoneLongitude
    if (sensor.zoneLatitude && sensor.zoneLongitude)
      return [parseFloat(sensor.zoneLatitude), parseFloat(sensor.zoneLongitude)];
    // 2. Coords par nom de zone dans le dictionnaire
    if (sensor.zone && ZONE_COORDS[sensor.zone])
      return ZONE_COORDS[sensor.zone];
    // 3. Fallback déterministe basé sur l'ID (pas random pour éviter les sauts)
    const seed = (sensor.id || 1) * 7919;
    const dlat = ((seed % 100) - 50) / 1000;
    const dlng = ((seed % 137) - 68) / 1000;
    return [CASABLANCA_CENTER[0] + dlat, CASABLANCA_CENTER[1] + dlng];
  };

  const counts = NIVEAUX.reduce((acc, n) => {
    acc[n] = congestions.filter(c => c.niveau?.toUpperCase() === n).length;
    return acc;
  }, {});

  // ✅ Nom affiché depuis le profil
  const displayName = profile?.username ? `@${profile.username}` : profile?.name || "User";
  const displayInitial = (profile?.name || "U")[0]?.toUpperCase();

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        .leaflet-container { border-radius:12px; }
        .leaflet-popup-content-wrapper { background:#110F1E !important; border:1px solid rgba(127,119,221,0.3) !important; border-radius:10px !important; color:white !important; box-shadow:0 8px 32px rgba(0,0,0,0.6) !important; }
        .leaflet-popup-tip { background:#110F1E !important; }
        .leaflet-popup-content { margin:12px 16px !important; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
        select option { background:#110F1E; }
      `}</style>

      <GlowOrb x="10%" y="15%" color={COLORS.primary.dark} size={500} opacity={0.1} />
      <GlowOrb x="85%" y="70%" color={COLORS.accent.coral} size={400} opacity={0.07} />

      {toast && (
        <div style={{ position:"fixed", top:"1.5rem", right:"1.5rem", zIndex:999, background:toast.type==="error"?`${COLORS.accent.coral}18`:`${COLORS.accent.teal}18`, border:`1px solid ${toast.type==="error"?COLORS.accent.coral:COLORS.accent.teal}55`, color:toast.type==="error"?"#F0997B":COLORS.accent.teal, borderRadius:10, padding:"0.75rem 1.4rem", fontSize:"0.88rem", fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>
          {toast.type==="error"?"⚠":"✓"} {toast.msg}
        </div>
      )}

      {/* NAVBAR */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:60, background:COLORS.bg.card, borderBottom:"1px solid rgba(127,119,221,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 2rem", zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🚦</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1rem", color:COLORS.text.primary }}>TrafficIQ</span>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:`${COLORS.accent.teal}18`, border:`1px solid ${COLORS.accent.teal}40`, borderRadius:100, padding:"0.15rem 0.6rem", marginLeft:8 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:COLORS.accent.teal, transform:`scale(${pulse?1:0.6})`, transition:"transform 0.5s ease" }} />
            <span style={{ fontSize:"0.65rem", color:COLORS.accent.teal, fontWeight:600 }}>LIVE</span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {/* ✅ Avatar avec initiale + nom + username */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#fff" }}>
              {displayInitial}
            </div>
            <div>
              <div style={{ fontSize:"0.82rem", fontWeight:600, color:COLORS.text.primary }}>
                {profile?.name || "..."}
              </div>
              <div style={{ fontSize:"0.65rem", color:COLORS.primary.light, fontWeight:600 }}>
                {profile?.username ? `@${profile.username}` : "USER"}
              </div>
            </div>
          </div>
          <button onClick={() => {
              const reports = localStorage.getItem("allReports");
              localStorage.clear();
              if (reports) localStorage.setItem("allReports", reports);
              navigate("/");
            }}
            onMouseEnter={e=>e.currentTarget.style.color="#F0997B"}
            onMouseLeave={e=>e.currentTarget.style.color=COLORS.text.muted}
            style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:COLORS.text.muted, borderRadius:8, padding:"0.4rem 0.9rem", fontSize:"0.8rem", cursor:"pointer", fontFamily:"inherit" }}>
            ⎋ Logout
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div style={{ paddingTop:80, padding:"80px 2rem 2rem", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:"1.5rem" }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Traffic Map</h1>
          <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>Real-time congestion across Casablanca — click on a zone to see details</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:"1.5rem" }}>
          {[
            { label:"Blocked",  key:"BLOCKED",  color:"#D85A30", icon:"🔴" },
            { label:"Critical", key:"HEAVY",    color:"#E24B4A", icon:"🟠" },
            { label:"High",     key:"MODERATE", color:"#EF9F27", icon:"🟡" },
            { label:"Moderate", key:"LOW",      color:"#1D9E75", icon:"🟢" },
          ].map(s => (
            <div key={s.key} style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderTop:`2px solid ${s.color}`, borderRadius:12, padding:"1rem", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:s.color }}>{loadingData?"—":counts[s.key]??0}</div>
              <div style={{ fontSize:"0.65rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:700, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* MAP + REPORT */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:"1.5rem", marginBottom:"1.5rem" }}>

          {/* CARTE */}
          <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"1rem 1.2rem", borderBottom:"1px solid rgba(127,119,221,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary }}>🗺️ Casablanca — Live Traffic</span>
              <div style={{ display:"flex", gap:12 }}>
                {[{ color:"#D85A30", label:"Blocked" },{ color:"#EF9F27", label:"High" },{ color:"#1D9E75", label:"OK" },{ color:"#7F77DD", label:"No data" }].map(l => (
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:l.color }} />
                    <span style={{ fontSize:"0.68rem", color:COLORS.text.muted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <MapContainer center={CASABLANCA_CENTER} zoom={12} style={{ height:"420px", width:"100%" }} scrollWheelZoom={true}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {sensors.map(sensor => {
                const coords = getSensorCoords(sensor);
                const cong   = getLatestCongestionForSensor(sensor.id);
                const color  = cong ? niveauColor(cong.niveau) : COLORS.primary.light;
                return (
                  <Marker key={sensor.id} position={coords} icon={createColoredIcon(color)}>
                    <Popup>
                      <div style={{ minWidth:190 }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:"white", marginBottom:4 }}>
                          📍 {sensor.name || `Zone #${sensor.id}`}
                        </div>
                        {/* ✅ Badge type de zone — supporte zoneType, typeRoute, ou zone name */}
                        {(() => {
                          const typeKey = sensor.zoneType || sensor.typeRoute || sensor.zoneTypeRoute;
                          const meta = typeKey ? (ZONE_TYPE_META[typeKey] || { label:typeKey, color:"#7F77DD", emoji:"📍" }) : null;
                          if (meta) return (
                            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:meta.color+"22", border:`1px solid ${meta.color}55`, color:meta.color, fontSize:"0.68rem", fontWeight:700, padding:"0.15rem 0.55rem", borderRadius:6, marginBottom:10 }}>
                              {meta.emoji} {meta.label}
                            </div>
                          );
                          if (sensor.zone) return (
                            <div style={{ fontSize:"0.72rem", color:"#9CA3AF", marginBottom:8 }}>{sensor.zone}</div>
                          );
                          return null;
                        })()}
                        {cong ? (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                            {[
                              { label:"LEVEL",    value:niveauLabel(cong.niveau), color },
                              { label:"SPEED",    value:cong.vitesseMoy!=null?`${Number(cong.vitesseMoy).toFixed(0)} km/h`:"—", color:"#EF9F27" },
                              { label:"VEHICLES", value:cong.nbrVehicule??"—", color:"white" },
                              { label:"CAUSE",    value:cong.cause||"—", color:"white" },
                            ].map(stat => (
                              <div key={stat.label} style={{ background:"rgba(255,255,255,0.05)", borderRadius:6, padding:"6px 8px", textAlign:"center" }}>
                                <div style={{ fontSize:"0.65rem", color:"#6B7280", marginBottom:2 }}>{stat.label}</div>
                                <div style={{ fontSize:"0.85rem", fontWeight:700, color:stat.color }}>{stat.value}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize:"0.8rem", color:"#6B7280", fontStyle:"italic" }}>No congestion data</div>
                        )}
                      </div>
                    </Popup>
                    {cong && <Circle center={coords} radius={300} pathOptions={{ color, fillColor:color, fillOpacity:0.12, weight:1 }} />}
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* ✅ REPORT PANEL corrigé */}
          <div style={{ background:COLORS.bg.card, border:`1px solid ${reportSuccess?"rgba(29,158,117,0.4)":"rgba(127,119,221,0.1)"}`, borderRadius:14, padding:"1.4rem", display:"flex", flexDirection:"column", gap:12, transition:"border 0.3s" }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:COLORS.text.primary, marginBottom:4 }}>📢 Report an Incident</h2>
              <p style={{ fontSize:"0.78rem", color:COLORS.text.muted, fontWeight:300, lineHeight:1.5 }}>Help other users by signaling a problem in your zone</p>
            </div>

            {/* Zone */}
            <div>
              <label style={{ display:"block", fontSize:"0.72rem", color:"#7C7A99", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Zone (Sensor)</label>
              <select value={reportZoneId} onChange={e => { setReportZoneId(e.target.value); setReportSignalId(""); }}
                style={{ width:"100%", background:COLORS.bg.hover, border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.85rem", color:reportZoneId?COLORS.text.primary:COLORS.text.muted, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
                <option value="">— Select zone —</option>
                {sensors.map(s => <option key={s.id} value={s.id}>{s.name || `Zone #${s.id}`}</option>)}
              </select>
            </div>

            {/* Signal (filtré par zone) */}
            <div>
              <label style={{ display:"block", fontSize:"0.72rem", color:"#7C7A99", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Signal</label>
              <select value={reportSignalId} onChange={e => setReportSignalId(e.target.value)}
                disabled={!reportZoneId}
                style={{ width:"100%", background:COLORS.bg.hover, border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.85rem", color:reportSignalId?COLORS.text.primary:COLORS.text.muted, outline:"none", fontFamily:"inherit", cursor:reportZoneId?"pointer":"not-allowed", opacity:reportZoneId?1:0.5 }}>
                <option value="">— Select signal —</option>
                {signalsForZone.map(s => <option key={s.id} value={s.id}>{s.type} #{s.id}</option>)}
              </select>
              {reportZoneId && signalsForZone.length === 0 && (
                <div style={{ fontSize:"0.72rem", color:COLORS.accent.coral, marginTop:4 }}>⚠ No signal for this zone</div>
              )}
            </div>

            {/* Niveau */}
            <div>
              <label style={{ display:"block", fontSize:"0.72rem", color:"#7C7A99", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Level</label>
              <select value={reportNiveau} onChange={e => setReportNiveau(e.target.value)}
                style={{ width:"100%", background:COLORS.bg.hover, border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.85rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
                {NIVEAUX_REPORT.map(n => <option key={n} value={n}>{niveauLabel(n)}</option>)}
              </select>
            </div>

            {/* Type */}
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:"0.72rem", color:"#7C7A99", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Type</label>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {REPORT_TYPES.map(type => (
                  <div key={type.value} onClick={() => setReportType(type.value)} style={{ display:"flex", alignItems:"center", gap:12, padding:"0.7rem 1rem", borderRadius:10, border:`1px solid ${reportType===type.value?type.color+"66":"rgba(255,255,255,0.08)"}`, background:reportType===type.value?type.color+"12":"transparent", cursor:"pointer", transition:"all 0.18s" }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${reportType===type.value?type.color:"rgba(255,255,255,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {reportType === type.value && <div style={{ width:7, height:7, borderRadius:"50%", background:type.color }} />}
                    </div>
                    <span style={{ fontSize:"0.85rem", fontWeight:600, color:reportType===type.value?type.color:COLORS.text.primary }}>{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleReport} disabled={!reportZoneId||!reportSignalId||reporting} style={{
              width:"100%", padding:"0.85rem",
              background: reportSuccess
                ? `linear-gradient(135deg,${COLORS.accent.teal},#16a085)`
                : (!reportZoneId||!reportSignalId||reporting) ? "rgba(255,255,255,0.06)"
                : `linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`,
              color:(!reportZoneId||!reportSignalId||reporting)&&!reportSuccess?COLORS.text.muted:COLORS.text.primary,
              border:"none", borderRadius:10, fontSize:"0.9rem", fontWeight:700,
              cursor:(!reportZoneId||!reportSignalId||reporting)?"not-allowed":"pointer",
              fontFamily:"inherit", transition:"all 0.25s",
            }}>
              {reportSuccess ? "✅ Submitted!" : reporting ? "Submitting..." : "🚨 Submit Report"}
            </button>
          </div>
        </div>

        {/* Liste congestions */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"0.9rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary }}>
              Recent Congestions {congestions.length > 0 && `(${congestions.length})`}
            </span>
            <span style={{ fontSize:"0.72rem", color:COLORS.text.subtle }}>Read only</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"50px 100px 110px 80px 80px 1fr 120px", padding:"0.7rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.65rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
            <span>ID</span><span>Level</span><span>Cause</span><span>Speed</span><span>Vehicles</span><span>Zone</span><span>Date</span>
          </div>
          {loadingData ? (
            <div style={{ padding:"2rem", textAlign:"center", color:COLORS.text.muted }}>Loading...</div>
          ) : congestions.length === 0 ? (
            <div style={{ padding:"2rem", textAlign:"center", color:COLORS.text.muted }}>No congestion data</div>
          ) : (
            congestions.slice(0, 8).map((c, i) => {
              const color = niveauColor(c.niveau);
              const sensor = sensors.find(s => s.id === c.locationId);
              return (
                <div key={c.id} style={{ display:"grid", gridTemplateColumns:"50px 100px 110px 80px 80px 1fr 120px", padding:"0.8rem 1.4rem", borderBottom:i===Math.min(congestions.length,8)-1?"none":"1px solid rgba(127,119,221,0.06)", alignItems:"center", borderLeft:`2px solid ${color}` }}>
                  <span style={{ fontSize:"0.75rem", color:COLORS.text.subtle, fontWeight:600 }}>#{c.id}</span>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:color+"20", border:`1px solid ${color}55`, color, fontSize:"0.7rem", fontWeight:700, padding:"0.18rem 0.55rem", borderRadius:6 }}>{niveauLabel(c.niveau)}</span>
                  <span style={{ fontSize:"0.75rem", color:COLORS.text.muted }}>{c.cause||"—"}</span>
                  <span style={{ fontSize:"0.78rem", color:"#EF9F27", fontWeight:500 }}>{c.vitesseMoy!=null?`${Number(c.vitesseMoy).toFixed(0)} km/h`:"—"}</span>
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.primary }}>{c.nbrVehicule??"—"}</span>
                  <span style={{ fontSize:"0.75rem", color:COLORS.text.muted }}>{sensor?.name??`Loc #${c.locationId??"—"}`}</span>
                  <span style={{ fontSize:"0.68rem", color:COLORS.text.subtle }}>{c.heureDate?new Date(c.heureDate).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}