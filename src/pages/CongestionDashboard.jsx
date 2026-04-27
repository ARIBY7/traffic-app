import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

const API = "http://localhost:8081";
const PAGE_SIZE = 15;
const NIVEAUX = ["BLOCKED", "HEAVY", "MODERATE", "LOW"];
const CAUSES  = ["ACCIDENT", "SATURATION", "TRAFIC"];

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
function causeLabel(c) {
  const m = { ACCIDENT:"Accident", SATURATION:"Saturation", TRAFIC:"Dense Traffic" };
  return m[c?.toUpperCase()] || c || "—";
}

function GlowOrb({ x, y, color, size=400, opacity=0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

function Sidebar({ navigate, onLogout }) {
  return (
    <div style={{ position:"fixed", left:0, top:0, bottom:0, width:220, background:COLORS.bg.card, borderRight:"1px solid rgba(127,119,221,0.1)", display:"flex", flexDirection:"column", zIndex:50, padding:"1.5rem 1rem" }}>
      <div onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:"2.5rem" }}>
        <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🚦</div>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1rem", color:COLORS.text.primary }}>TrafficIQ</span>
      </div>
      <div style={{ fontSize:"0.65rem", color:COLORS.text.subtle, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:"0.75rem", paddingLeft:8 }}>Navigation</div>
      {[
        { label:"Dashboard",    icon:"▣", p:"/admin" },
        { label:"Sensors",      icon:"◎", p:"/admin/locations" },
        { label:"Traffic Data", icon:"▦", p:"/admin/traffic" },
        { label:"Congestion",   icon:"◈", p:"/admin/congestion", active:true },
        { label:"Manage Users", icon:"👤",p:"/admin/users" },
        { label:"Signals",      icon:"🚦",p:"/admin/signals" },
        { label:"Statistics",   icon:"▤", p:"/admin/statistics" },
      ].map((item) => (
        <div key={item.label} onClick={() => navigate(item.p)} style={{ display:"flex", alignItems:"center", gap:10, padding:"0.6rem 0.8rem", borderRadius:10, marginBottom:3, background:item.active?`${COLORS.primary.light}1A`:"transparent", border:item.active?`1px solid ${COLORS.primary.light}30`:"1px solid transparent", cursor:"pointer", color:item.active?COLORS.primary.light:COLORS.text.muted, fontSize:"0.875rem", fontWeight:item.active?600:400 }}>
          <span style={{ fontSize:14 }}>{item.icon}</span>{item.label}
          {item.active && <div style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:COLORS.primary.light }} />}
        </div>
      ))}
      <div style={{ marginTop:"auto" }}>
        <div style={{ height:1, background:"rgba(127,119,221,0.1)", margin:"0.75rem 0" }} />
        <div onClick={() => { localStorage.clear(); onLogout(); }} onMouseEnter={e=>e.currentTarget.style.color="#F0997B"} onMouseLeave={e=>e.currentTarget.style.color=COLORS.text.muted} style={{ display:"flex", alignItems:"center", gap:8, padding:"0.6rem 0.8rem", borderRadius:10, cursor:"pointer", color:COLORS.text.muted, fontSize:"0.875rem", transition:"color 0.15s" }}>
          <span style={{ fontSize:14 }}>⎋</span> Logout
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderTop:`2px solid ${color}`, borderRadius:12, padding:"1.1rem 1.3rem", textAlign:"center" }}>
      <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>{label}</div>
    </div>
  );
}

function NiveauBadge({ niveau, small }) {
  const color = niveauColor(niveau);
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:color+"20", border:`1px solid ${color}55`, color, fontSize:small?"0.68rem":"0.75rem", fontWeight:700, padding:small?"0.18rem 0.55rem":"0.28rem 0.75rem", borderRadius:6 }}>{niveauLabel(niveau)}</span>;
}

function CauseBadge({ cause }) {
  const map = { ACCIDENT:{color:COLORS.accent.coral,bg:COLORS.accent.coral+"18"}, SATURATION:{color:COLORS.primary.light,bg:COLORS.primary.light+"18"}, TRAFIC:{color:COLORS.accent.amber,bg:COLORS.accent.amber+"18"} };
  const s = map[cause?.toUpperCase()] || { color:"#7C7A99", bg:"rgba(255,255,255,0.04)" };
  return <span style={{ background:s.bg, color:s.color, fontSize:"0.72rem", fontWeight:600, padding:"0.2rem 0.6rem", borderRadius:6 }}>{causeLabel(cause)}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:COLORS.bg.card, border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, padding:"2rem", width:"100%", maxWidth:440 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:700, color:COLORS.text.primary }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:COLORS.text.muted, fontSize:"1.2rem", cursor:"pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CongestionDashboard() {
  const navigate = useNavigate();

  // ── table ──
  const [allData, setAllData]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);
  const [page, setPage]             = useState(0);
  const [filterMode, setFilterMode] = useState("zone");
  const [filterVal, setFilterVal]   = useState("");
  const [niveauSel, setNiveauSel]   = useState(NIVEAUX[0]);
  const [causeSel, setCauseSel]     = useState(CAUSES[0]);
  const [showDelete, setShowDelete] = useState(null);
  const [dateFilter, setDateFilter] = useState("");

  // ── Zone Details ──
  const [sensors, setSensors]                   = useState([]);
  const [selectedSensorId, setSelectedSensorId] = useState("");
  const [latestData, setLatestData]             = useState(null);
  const [latestLoading, setLatestLoading]       = useState(false);
  const [showLogout, setShowLogout]             = useState(false);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Au démarrage: sensors + toutes les congestions (4 niveaux combinés) ──
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
      setLoading(true);
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
        setAllData(unique);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };

    loadSensors();
    loadAllCongestions();
  }, []);

  // ── GET /api/users/congestions/latestOflocation/{locationId} ──
  const fetchLatestOfLocation = async (locId) => {
    if (!locId) return;
    setLatestLoading(true);
    setLatestData(null);
    try {
      const res = await fetch(`${API}/api/users/congestions/latestOflocation/${locId}`, { headers: getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) { showToast("No congestion data for this zone", "error"); return; }
      const dto = await res.json();
      setLatestData(dto);
    } catch (e) {
      console.error(e);
      showToast("Error loading zone data", "error");
    } finally {
      setLatestLoading(false);
    }
  };

  const handleSensorDropdownChange = (e) => {
    const id = e.target.value;
    setSelectedSensorId(id);
    if (id) fetchLatestOfLocation(id);
    else setLatestData(null);
  };

  // ── table search ──
  const fetchByLocation = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/congestions/location/${id}`, { headers: getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      if (res.status === 404) { setAllData([]); showToast("Aucune congestion pour cette location", "error"); return; }
      const d = await res.json();
      setAllData(Array.isArray(d) ? d : []);
      setPage(0);
    } catch (e) { console.error(e); showToast("Erreur", "error"); }
    finally { setLoading(false); }
  };

  const fetchByNiveau = async (niveau) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/congestions/niveau/${niveau}`, { headers: getHeaders() });
      if (res.status === 404) { setAllData([]); showToast("Aucune congestion pour ce niveau", "error"); return; }
      const d = await res.json();
      setAllData(Array.isArray(d) ? d : []);
      setPage(0);
    } catch (e) { console.error(e); showToast("Erreur", "error"); }
    finally { setLoading(false); }
  };

  const fetchByCause = async (cause) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/congestions/cause/${cause}`, { headers: getHeaders() });
      if (res.status === 404) { setAllData([]); showToast("Aucune congestion pour cette cause", "error"); return; }
      const d = await res.json();
      setAllData(Array.isArray(d) ? d : []);
      setPage(0);
    } catch (e) { console.error(e); showToast("Erreur", "error"); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    if (filterMode === "zone")   fetchByLocation(filterVal.trim());
    if (filterMode === "niveau") fetchByNiveau(niveauSel);
    if (filterMode === "cause")  fetchByCause(causeSel);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/api/admin/congestions/${showDelete.id}`, { method:"DELETE", headers:getHeaders() });
      if (!res.ok) { showToast("Erreur suppression", "error"); return; }
      showToast("Congestion supprimée");
      setShowDelete(null);
      setAllData(prev => prev.filter(c => c.id !== showDelete.id));
    } catch (e) { console.error(e); showToast("Erreur suppression", "error"); }
  };

  const counts = NIVEAUX.reduce((acc, n) => {
    acc[n] = allData.filter(c => c.niveau?.toUpperCase() === n.toUpperCase()).length;
    return acc;
  }, {});

  // filtre date côté client
  const filteredData = dateFilter
    ? allData.filter(c => {
        if (!c.heureDate) return false;
        const d = new Date(c.heureDate).toISOString().slice(0, 10);
        return d === dateFilter;
      })
    : allData;

  const paginated  = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // Sensor sélectionné (pour afficher son nom dans le panel)
  const selectedSensor = sensors.find(s => String(s.id) === String(selectedSensorId));

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(127,119,221,0.3); color:#fff; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
      `}</style>

      <GlowOrb x="10%" y="20%" color={COLORS.primary.dark} size={500} opacity={0.1} />
      <GlowOrb x="90%" y="70%" color={COLORS.accent.coral} size={400} opacity={0.08} />

      {toast && (
        <div style={{ position:"fixed", top:"1.5rem", right:"1.5rem", zIndex:999, background:toast.type==="error"?`${COLORS.accent.coral}18`:`${COLORS.accent.teal}18`, border:`1px solid ${toast.type==="error"?COLORS.accent.coral:COLORS.accent.teal}55`, color:toast.type==="error"?"#F0997B":COLORS.accent.teal, borderRadius:10, padding:"0.75rem 1.2rem", fontSize:"0.85rem", fontWeight:500, display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
          {toast.type==="error"?"⚠":"✓"} {toast.msg}
        </div>
      )}

      <Sidebar navigate={navigate} onLogout={() => setShowLogout(true)} />

      <div style={{ marginLeft:220, padding:"2.5rem", position:"relative", zIndex:1 }}>

        <div style={{ marginBottom:"1.5rem" }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Congestion Zones</h1>
          <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>Real-time congestion monitoring across all urban zones.</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:14, marginBottom:"1.5rem" }}>
          {[
            { label:"Blocked",  key:"BLOCKED",   color:COLORS.accent.coral, icon:"🔴" },
            { label:"Critical", key:"HEAVY",     color:"#E24B4A",           icon:"🟠" },
            { label:"High",     key:"MODERATE",  color:COLORS.accent.amber, icon:"🟡" },
            { label:"Moderate", key:"LOW",        color:COLORS.accent.teal,  icon:"🟢" },
          ].map(s => <StatCard key={s.key} label={s.label} value={counts[s.key]??0} color={s.color} icon={s.icon} />)}
        </div>

        {/* ══════════════════════════════════════════════
            ZONE DETAILS — dropdown depuis /api/users/sensors
            → appel latestOflocation/{locationId}
        ══════════════════════════════════════════════ */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.3rem 1.5rem", marginBottom:"1.2rem" }}>

          {/* Ligne header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:"1.3rem" }}>

            {/* Dropdown des sensors (zones) */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:"0.72rem", color:COLORS.text.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
                📍 Zone
              </span>
              <select
                value={selectedSensorId}
                onChange={handleSensorDropdownChange}
                style={{ background:COLORS.bg.hover, border:`1px solid ${COLORS.primary.light}55`, borderRadius:8, padding:"0.5rem 1rem", fontSize:"0.85rem", color:selectedSensorId?COLORS.text.primary:COLORS.text.muted, outline:"none", fontFamily:"inherit", cursor:"pointer", minWidth:230 }}
              >
                <option value="" style={{ background:COLORS.bg.card }}>— Select a zone —</option>
                {sensors.map(s => (
                  <option key={s.id} value={s.id} style={{ background:COLORS.bg.card }}>
                    {/* LocationDTO: id, name, zone */}
                    {s.name ? `${s.name} (Zone ${s.zone ?? s.id})` : `Location #${s.id}`}
                  </option>
                ))}
              </select>
              {sensors.length === 0 && (
                <span style={{ fontSize:"0.75rem", color:COLORS.text.subtle }}>Loading zones...</span>
              )}
            </div>

            {/* Last Updated */}
            <div style={{ textAlign:"right" }}>
              {latestLoading && <span style={{ fontSize:"0.8rem", color:COLORS.text.muted }}>Loading...</span>}
              {latestData && !latestLoading && (
                <>
                  <div style={{ fontSize:"0.65rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>Last Updated</div>
                  <div style={{ fontSize:"0.92rem", color:COLORS.primary.light, fontWeight:700, marginTop:2 }}>
                    {latestData.heureDate
                      ? new Date(latestData.heureDate).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })
                      : "—"}
                  </div>
                  {selectedSensor && (
                    <div style={{ fontSize:"0.72rem", color:COLORS.text.subtle, marginTop:2 }}>
                      {selectedSensor.name} — Zone {selectedSensor.zone ?? selectedSensorId}
                    </div>
                  )}
                </>
              )}
              {!latestData && !latestLoading && (
                <span style={{ fontSize:"0.78rem", color:COLORS.text.subtle, fontStyle:"italic" }}>Select a zone to see latest data</span>
              )}
            </div>
          </div>

          {/* 4 stats — données de CongestionDTO (latestOflocation) */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {[
              { icon:"🚗", label:"Vehicles",       value: latestData ? (latestData.nbrVehicule ?? "—") : "—",                                                                                          color: latestData ? COLORS.text.primary    : COLORS.text.subtle },
              { icon:"⚡", label:"Avg Speed km/h", value: latestData?.vitesseMoy    != null ? `${Number(latestData.vitesseMoy).toFixed(0)}`                                                         : "—", color: latestData ? COLORS.accent.amber   : COLORS.text.subtle },
              { icon:"📊", label:"Volume Traffic", value: latestData?.volumeTraffic != null ? `${Math.round(latestData.volumeTraffic)}`                                                             : "—", color: latestData ? COLORS.text.primary    : COLORS.text.subtle },
              { icon:"🚦", label:"Level",          value: latestData ? niveauLabel(latestData.niveau)                                                                                               : "—", color: latestData ? niveauColor(latestData?.niveau) : COLORS.text.subtle },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign:"center", background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"1rem", border: latestData ? `1px solid rgba(127,119,221,0.15)` : "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{stat.icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:stat.color, marginBottom:4 }}>{stat.value}</div>
                <div style={{ fontSize:"0.75rem", color:COLORS.text.muted, textTransform:"uppercase", fontWeight:600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.1rem 1.4rem", marginBottom:"1.2rem", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", background:COLORS.bg.hover, borderRadius:8, padding:3, gap:2 }}>
            {["zone","niveau","cause"].map(m => (
              <button key={m} onClick={() => setFilterMode(m)} style={{ background:filterMode===m?`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`:"transparent", color:filterMode===m?COLORS.text.primary:COLORS.text.muted, border:"none", borderRadius:6, padding:"0.35rem 0.85rem", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
                By {m}
              </button>
            ))}
          </div>

          {filterMode === "zone" && (
            <input value={filterVal} onChange={e => setFilterVal(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSearch()} placeholder="Location ID..." style={{ flex:1, minWidth:140, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit" }} />
          )}
          {filterMode === "niveau" && (
            <select value={niveauSel} onChange={e => setNiveauSel(e.target.value)} style={{ flex:1, minWidth:160, background:COLORS.bg.hover, border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
              {NIVEAUX.map(n => <option key={n} value={n} style={{ background:COLORS.bg.card }}>{niveauLabel(n)}</option>)}
            </select>
          )}
          {filterMode === "cause" && (
            <select value={causeSel} onChange={e => setCauseSel(e.target.value)} style={{ flex:1, minWidth:160, background:COLORS.bg.hover, border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
              {CAUSES.map(c => <option key={c} value={c} style={{ background:COLORS.bg.card }}>{causeLabel(c)}</option>)}
            </select>
          )}

          <button onClick={handleSearch} disabled={filterMode==="zone" && !filterVal.trim()} style={{ background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, color:COLORS.text.primary, border:"none", borderRadius:8, padding:"0.65rem 1.3rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Search</button>
          {/* Filtre par date */}
          <input
            type="date"
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setPage(0); }}
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.85rem", color:dateFilter?COLORS.text.primary:COLORS.text.muted, outline:"none", fontFamily:"inherit", cursor:"pointer", colorScheme:"dark" }}
          />

          {(allData.length > 0 || dateFilter) && (
            <button onClick={() => { setAllData([]); setFilterVal(""); setDateFilter(""); setPage(0); }} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.65rem 1rem", fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit" }}>Clear ✕</button>
          )}
        </div>

        {/* Table */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"0.85rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary }}>
              All Congestions {filteredData.length > 0 && `(${filteredData.length})`}
            </span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"55px 110px 120px 85px 85px 100px 110px 130px", padding:"0.75rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.68rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
            <span>ID</span><span>Level</span><span>Cause</span><span>Speed</span><span>Vehicles</span><span>Location</span><span>Date</span><span style={{ textAlign:"right" }}>Actions</span>
          </div>

          {loading ? (
            <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted, fontSize:"0.88rem" }}>Loading...</div>
          ) : paginated.length === 0 ? (
            <div style={{ padding:"3rem", textAlign:"center" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem", opacity:0.2 }}>🧠</div>
              <div style={{ color:COLORS.text.muted, fontSize:"0.88rem" }}>Use the search panel above to load congestion data</div>
            </div>
          ) : (
            paginated.map((c, i) => {
              const color = niveauColor(c.niveau);
              return (
                <div key={c.id} style={{ display:"grid", gridTemplateColumns:"55px 110px 120px 85px 85px 100px 110px 130px", padding:"0.85rem 1.4rem", borderBottom:i===paginated.length-1?"none":"1px solid rgba(127,119,221,0.06)", alignItems:"center", borderLeft:`2px solid ${color}` }}>
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.subtle, fontWeight:600 }}>#{c.id}</span>
                  <NiveauBadge niveau={c.niveau} small />
                  <CauseBadge cause={c.cause} />
                  <span style={{ fontSize:"0.82rem", color:COLORS.accent.amber, fontWeight:500 }}>{c.vitesseMoy!=null?`${Number(c.vitesseMoy).toFixed(1)} km/h`:"—"}</span>
                  <span style={{ fontSize:"0.82rem", color:"#D1D5DB" }}>{c.nbrVehicule??"—"}</span>
                  <span style={{ fontSize:"0.75rem", color:COLORS.text.subtle }}>{c.locationId?`Loc #${c.locationId}`:"—"}</span>
                  <span style={{ fontSize:"0.72rem", color:COLORS.text.subtle }}>{c.heureDate?new Date(c.heureDate).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"}</span>
                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                    <button onClick={() => setShowDelete(c)} style={{ background:COLORS.accent.coral+"18", border:`1px solid ${COLORS.accent.coral}44`, color:"#F0997B", borderRadius:6, padding:"0.25rem 0.6rem", fontSize:"0.72rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:"1.2rem" }}>
            <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:page===0?COLORS.text.subtle:COLORS.text.muted, borderRadius:8, padding:"0.5rem 1rem", fontSize:"0.82rem", cursor:page===0?"not-allowed":"pointer", fontFamily:"inherit" }}>← Prev</button>
            <div style={{ display:"flex", gap:4 }}>
              {Array.from({ length:Math.min(totalPages,7) }, (_,i) => {
                const p = totalPages<=7 ? i : Math.max(0,Math.min(page-3,totalPages-7))+i;
                return <button key={p} onClick={() => setPage(p)} style={{ background:page===p?`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`:"rgba(255,255,255,0.04)", color:page===p?COLORS.text.primary:COLORS.text.muted, border:"none", borderRadius:6, padding:"0.45rem 0.75rem", fontSize:"0.8rem", cursor:"pointer", fontFamily:"inherit", minWidth:36 }}>{p+1}</button>;
              })}
            </div>
            <button onClick={() => setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:page>=totalPages-1?COLORS.text.subtle:COLORS.text.muted, borderRadius:8, padding:"0.5rem 1rem", fontSize:"0.82rem", cursor:page>=totalPages-1?"not-allowed":"pointer", fontFamily:"inherit" }}>Next →</button>
          </div>
        )}
      </div>

      {/* ── Logout Confirmation Modal ── */}
      {showLogout && (
        <Modal title="Confirm Logout" onClose={() => setShowLogout(false)}>
          <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>👋</div>
            <p style={{ color:"#9CA3AF", fontSize:"0.95rem", lineHeight:1.7 }}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowLogout(false)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.4rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>
              Annuler
            </button>
            <button onClick={() => { localStorage.clear(); navigate("/"); }} style={{ background:`linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`, color:COLORS.text.primary, border:"none", borderRadius:8, padding:"0.68rem 1.4rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              Se déconnecter
            </button>
          </div>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete Congestion" onClose={() => setShowDelete(null)}>
          <p style={{ color:"#9CA3AF", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"1.5rem" }}>
            Are you sure you want to delete congestion <span style={{ color:COLORS.text.primary, fontWeight:600 }}>#{showDelete.id}</span>? This action cannot be undone.
          </p>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowDelete(null)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            <button onClick={handleDelete} style={{ background:COLORS.accent.coral, color:COLORS.text.primary, border:"none", borderRadius:8, padding:"0.68rem 1.4rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}