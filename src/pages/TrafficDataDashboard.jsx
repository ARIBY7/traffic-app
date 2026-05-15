import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const API = process.env.REACT_APP_API_URL || "http://localhost:8081";
const PAGE_SIZE = 20;

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
  return (
    <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />
  );
}

// ✅ StatCard cliquable (optionnel)
function StatCard({ label, value, color, icon, loading, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.bg.card,
        border: active ? `1px solid ${color}55` : "1px solid rgba(127,119,221,0.1)",
        borderLeft: `3px solid ${color}`,
        borderRadius: 12,
        padding: "1.1rem 1.3rem",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "border 0.2s, background 0.2s",
        background: active ? `${color}10` : COLORS.bg.card,
      }}
    >
      <div style={{ position:"absolute", right:12, top:12, fontSize:18, opacity:0.15 }}>{icon}</div>
      <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:loading?COLORS.text.muted:color, lineHeight:1 }}>
        {loading ? "..." : value}
      </div>
      {onClick && <div style={{ fontSize:"0.62rem", color:color, marginTop:6, opacity:0.7 }}>{active ? "✕ Clear filter" : "Click to filter"}</div>}
    </div>
  );
}

function DataRow({ row, last, onToggle }) {
  const [hov, setHov] = useState(false);
  const accidentColor = row.accidentSignale ? COLORS.accent.coral : COLORS.accent.teal;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"grid",
        gridTemplateColumns:"50px 90px 80px 75px 60px 60px 60px 110px 110px",
        padding:"0.82rem 1.3rem",
        borderBottom: last ? "none" : "1px solid rgba(127,119,221,0.06)",
        background: hov ? COLORS.bg.hover : "transparent",
        alignItems:"center",
        transition:"background 0.12s",
        borderLeft:`2px solid ${accidentColor}`,
      }}
    >
      <span style={{ fontSize:"0.75rem", color:COLORS.text.subtle, fontWeight:700 }}>#{row.id}</span>
      <span style={{ fontSize:"0.82rem", color:COLORS.accent.amber, fontWeight:600 }}>
        {row.vitesseMoy != null ? `${Number(row.vitesseMoy).toFixed(2)} km/h` : "—"}
      </span>
      <span style={{ fontSize:"0.8rem", color:"#C8C6E8" }}>
        {row.volumeTraffic != null ? Number(row.volumeTraffic).toFixed(2) : "—"}
      </span>
      <span style={{ fontSize:"0.8rem", color:COLORS.primary.light }}>{row.nombreVoiture ?? "—"}</span>
      <span style={{ fontSize:"0.75rem", color:COLORS.text.subtle }}>{row.nombreCamions ?? "—"}</span>
      <span style={{ fontSize:"0.75rem", color:COLORS.text.subtle }}>{row.nombreVelos ?? "—"}</span>
      <span style={{ fontSize:"0.72rem", color:COLORS.text.subtle }}>{row.locationId ? `#${row.locationId}` : "—"}</span>
      <span style={{ fontSize:"0.7rem", color:COLORS.text.subtle }}>
        {row.dateHeure ? new Date(row.dateHeure).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—"}
      </span>
      <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:4 }}>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:4,
          background: row.accidentSignale ? `${COLORS.accent.coral}15` : "rgba(255,255,255,0.04)",
          border:`1px solid ${row.accidentSignale ? COLORS.accent.coral+"40" : "rgba(255,255,255,0.07)"}`,
          color: row.accidentSignale ? "#F0997B" : COLORS.text.subtle,
          fontSize:"0.68rem", fontWeight:600, padding:"0.15rem 0.55rem", borderRadius:100,
        }}>
          <span style={{ width:4, height:4, borderRadius:"50%", background:accidentColor, display:"inline-block" }} />
          {row.accidentSignale ? "Accident" : "Normal"}
        </span>
        <button onClick={() => onToggle(row.id)} title="Toggle accident" style={{
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
          color:COLORS.text.subtle, borderRadius:6, padding:"0.2rem 0.45rem",
          fontSize:"0.65rem", cursor:"pointer", fontFamily:"inherit",
        }}>⇄</button>
      </div>
    </div>
  );
}

function LoadingOverlay({ message }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:60, height:60, border:"3px solid rgba(127,119,221,0.3)", borderTop:`3px solid ${COLORS.primary.light}`, borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 1.5rem" }} />
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.3rem", fontWeight:700, color:COLORS.text.primary, marginBottom:"0.5rem" }}>Importing Data...</h2>
        <p style={{ fontSize:"0.9rem", color:COLORS.text.muted }}>{message}</p>
      </div>
    </div>
  );
}

export default function TrafficDataDashboard() {
  const navigate = useNavigate();

  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [downloading, setDownloading]     = useState(false);
  const [importing, setImporting]         = useState(false);
  const [importMessage, setImportMessage] = useState("Lecture du fichier CSV...");
  const [toast, setToast]                 = useState(null);
  const [page, setPage]                   = useState(0);
  const [stats, setStats]                 = useState({ total:null, avgSpeed:null, volume:null, nbrTraffic:null, accidents:null });
  const [statsLoading, setStatsLoading]   = useState(true);
  const [searchMode, setSearchMode]       = useState("all");
  const [locInput, setLocInput]           = useState("");
  const [dateInput, setDateInput]         = useState("");
  // ✅ Filtre accidents
  const [accidentFilter, setAccidentFilter] = useState(false);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const [total, avgSpeed, volume, nbrTraffic, accidents] = await Promise.all([
        fetch(`${API}/api/admin/data/total`,               { headers:getHeaders() }).then(r => r.json()),
        fetch(`${API}/api/admin/data/speed/latestDate`,    { headers:getHeaders() }).then(r => r.json()),
        fetch(`${API}/api/admin/data/volume/latestDate`,   { headers:getHeaders() }).then(r => r.json()),
        fetch(`${API}/api/admin/data/traffic/latestDate`,  { headers:getHeaders() }).then(r => r.json()),
        fetch(`${API}/api/users/data/niveau/accidents`, { headers:getHeaders() }).then(r => r.json()),
      ]);
      setStats({ total, avgSpeed, volume, nbrTraffic, accidents });
    } catch(e) { console.error(e); }
    finally { setStatsLoading(false); }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/data`, { headers:getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) { setData([]); return; }
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
      setPage(0);
    } catch(e) { showToast("Erreur de chargement", "error"); }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchStats(); fetchAll(); }, [fetchAll]);

  const handleImport = async () => {
    setImporting(true); setImportMessage("Lecture du fichier CSV...");
    try {
      const res = await fetch(`${API}/api/location/load-data`, { method:"POST", headers:getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) { showToast(`Erreur import (${res.status})`, "error"); return; }
      setImportMessage("Traitement des données...");
      await new Promise(r => setTimeout(r, 3000));
      setImportMessage("Rechargement...");
      await Promise.all([fetchStats(), fetchAll()]);
      showToast("✅ Données importées !");
    } catch(e) { showToast("Erreur serveur", "error"); }
    finally { setImporting(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/api/admin/data`, { headers:getHeaders() });
      const d = await res.json();
      if (!Array.isArray(d) || d.length === 0) { showToast("Aucune donnée", "error"); return; }
      const hdrs = ["id","vitesseMoy","volumeTraffic","nombreVoiture","nombreCamions","nombreVelos","locationId","dateHeure","accidentSignale"];
      const csv = [hdrs.join(","), ...d.map(r => hdrs.map(h => r[h] ?? "").join(","))].join("\n");
      const blob = new Blob([csv], { type:"text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `traffic_${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      showToast("Téléchargé !");
    } catch(e) { showToast("Erreur téléchargement", "error"); }
    finally { setDownloading(false); }
  };

  const handleToggleAccident = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/data/updateAccidentStatus/${id}`, { method:"PUT", headers:getHeaders() });
      if (!res.ok) { showToast("Erreur mise à jour", "error"); return; }
      const updated = await res.json();
      setData(prev => prev.map(d => String(d.id) === String(id) ? updated : d));
      showToast("Statut mis à jour");
      fetchStats();
    } catch(e) { showToast("Erreur serveur", "error"); }
  };

  const fetchByLocation = async () => {
    if (!locInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/data/location/${locInput.trim()}`, { headers:getHeaders() });
      if (!res.ok) { showToast("Aucune donnée pour cette location", "error"); setData([]); return; }
      const d = await res.json();
      setData(Array.isArray(d) ? d : []); setPage(0);
    } catch(e) { showToast("Erreur", "error"); }
    finally { setLoading(false); }
  };

  const fetchByDate = async () => {
    if (!dateInput) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/traffic/by-date?date=${dateInput}`, { headers:getHeaders() });
      if (res.status === 404) { showToast("Aucune donnée pour cette date", "error"); setData([]); return; }
      const d = await res.json();
      setData(Array.isArray(d) ? d : []); setPage(0);
    } catch(e) { showToast("Erreur", "error"); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    setAccidentFilter(false); // reset filtre accident sur nouvelle recherche
    if (searchMode === "all")      fetchAll();
    if (searchMode === "location") fetchByLocation();
    if (searchMode === "date")     fetchByDate();
  };

  // ✅ Applique le filtre accident sur les données affichées
  const filteredData = accidentFilter ? data.filter(r => r.accidentSignale === true) : data;
  const paginated    = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages   = Math.ceil(filteredData.length / PAGE_SIZE);
  const fmt = (v, dec = 1) => v != null ? Number(v).toFixed(dec) : "—";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(127,119,221,0.3); color:#fff; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.4); }
      `}</style>

      <GlowOrb x="10%" y="15%" color={COLORS.primary.dark} size={600} opacity={0.1} />
      <GlowOrb x="88%" y="72%" color={COLORS.accent.coral} size={450} opacity={0.08} />

      {importing && <LoadingOverlay message={importMessage} />}

      {toast && (
        <div style={{ position:"fixed", top:"1.4rem", right:"1.4rem", zIndex:999, background:toast.type==="error"?`${COLORS.accent.coral}15`:`${COLORS.accent.teal}15`, border:`1px solid ${toast.type==="error"?COLORS.accent.coral:COLORS.accent.teal}40`, color:toast.type==="error"?"#F0997B":COLORS.accent.teal, borderRadius:12, padding:"0.7rem 1.1rem", fontSize:"0.85rem", fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>
          {toast.type==="error" ? "⚠" : "✓"} {toast.msg}
        </div>
      )}

      <Sidebar />

      <div style={{ marginLeft:220, padding:"2.2rem 2.4rem", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.8rem", gap:"1rem", flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px", marginBottom:4 }}>Traffic Data</h1>
            <p style={{ color:COLORS.text.muted, fontSize:"0.85rem", fontWeight:300 }}>
              {loading ? "Loading records..." : `${filteredData.length.toLocaleString()}${accidentFilter ? " accidents" : ""} / ${data.length.toLocaleString()} records`}
            </p>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={handleImport} disabled={importing} style={{ background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, color:COLORS.text.primary, border:"none", borderRadius:10, padding:"0.65rem 1.2rem", fontSize:"0.875rem", fontWeight:600, cursor:importing?"not-allowed":"pointer", fontFamily:"inherit", opacity:importing?0.6:1 }}>
              {importing ? "⏳ Importing..." : "⬆ Import CSV"}
            </button>
            <button onClick={() => { fetchAll(); fetchStats(); setAccidentFilter(false); }} disabled={loading} style={{ background:"transparent", border:"1px solid rgba(127,119,221,0.2)", color:COLORS.text.muted, borderRadius:10, padding:"0.65rem 1.2rem", fontSize:"0.875rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>↻ Refresh</button>
            <button onClick={handleDownload} disabled={downloading} style={{ background:"transparent", border:"1px solid rgba(127,119,221,0.2)", color:COLORS.text.muted, borderRadius:10, padding:"0.65rem 1.2rem", fontSize:"0.875rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{downloading ? "⏳" : "↓"} Download</button>
          </div>
        </div>

        {/* ✅ Stat Cards — Accidents cliquable pour filtrer */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:12, marginBottom:"1.6rem" }}>
          <StatCard label="Total Records" value={(stats.total ?? 0).toLocaleString()} color={COLORS.primary.light} icon="📊" loading={statsLoading} />
          <StatCard label="Avg Speed"     value={`${fmt(stats.avgSpeed, 2)} km/h`}       color={COLORS.accent.amber}  icon="⚡" loading={statsLoading} />
          <StatCard label="Volume"        value={fmt(stats.volume, 2)}                   color={COLORS.accent.teal}   icon="🚗" loading={statsLoading} />
          <StatCard label="Traffic"       value={(stats.nbrTraffic ?? 0).toLocaleString()} color={COLORS.primary.light} icon="🛣️" loading={statsLoading} />
          {/* ✅ Carte Accidents cliquable → filtre la table */}
          <StatCard
            label="Total Accidents"
            value={(stats.accidents ?? 0).toLocaleString()}
            color={COLORS.accent.coral}
            icon="⚠️"
            loading={statsLoading}
            active={accidentFilter}
            onClick={() => { setAccidentFilter(f => !f); setPage(0); }}
          />
        </div>

        {/* ✅ Banner filtre actif */}
        {accidentFilter && (
          <div style={{ background:`${COLORS.accent.coral}12`, border:`1px solid ${COLORS.accent.coral}44`, borderRadius:10, padding:"0.6rem 1.2rem", marginBottom:"1rem", fontSize:"0.85rem", color:"#F0997B", display:"flex", alignItems:"center", gap:8 }}>
            🚨 Filtre actif — Affichage des accidents uniquement ({filteredData.length} records)
            <button onClick={() => { setAccidentFilter(false); setPage(0); }} style={{ marginLeft:"auto", background:"transparent", border:"none", color:"#F0997B", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 }}>✕ Effacer</button>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1rem 1.4rem", marginBottom:"1.1rem", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", background:COLORS.bg.hover, borderRadius:8, padding:3, gap:2 }}>
            {["all","location","date"].map(m => (
              <button key={m} onClick={() => setSearchMode(m)} style={{
                background:searchMode===m?`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`:"transparent",
                color:searchMode===m?COLORS.text.primary:COLORS.text.muted,
                border:"none", borderRadius:7, padding:"0.35rem 0.85rem", fontSize:"0.78rem",
                fontWeight:600, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize",
              }}>{m === "all" ? "All" : `By ${m}`}</button>
            ))}
          </div>
          {searchMode === "location" && (
            <input value={locInput} onChange={e => setLocInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleSearch()}
              placeholder="Location ID..." style={{ flex:1, minWidth:140, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"0.55rem 0.9rem", fontSize:"0.85rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit" }} />
          )}
          {searchMode === "date" && (
            <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
              style={{ flex:1, minWidth:160, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"0.55rem 0.9rem", fontSize:"0.85rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", colorScheme:"dark" }} />
          )}
          <button onClick={handleSearch} disabled={(searchMode==="location"&&!locInput.trim())||(searchMode==="date"&&!dateInput)} style={{ background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, color:COLORS.text.primary, border:"none", borderRadius:10, padding:"0.55rem 1.25rem", fontSize:"0.875rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Search</button>
          {searchMode !== "all" && (
            <button onClick={() => { setLocInput(""); setDateInput(""); setSearchMode("all"); fetchAll(); }} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:COLORS.text.muted, borderRadius:10, padding:"0.55rem 1rem", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Clear ✕</button>
          )}
        </div>

        {/* Table */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"50px 90px 80px 75px 60px 60px 60px 110px 110px", padding:"0.75rem 1.3rem", borderBottom:"1px solid rgba(127,119,221,0.08)", fontSize:"0.65rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>
            <span>ID</span><span>Speed</span><span>Volume</span><span>Cars</span><span>Trucks</span><span>Bikes</span><span>Loc.</span><span>Date</span><span style={{ textAlign:"right" }}>Status</span>
          </div>
          {loading ? (
            <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted, fontSize:"0.88rem" }}>Loading...</div>
          ) : paginated.length === 0 ? (
            <div style={{ padding:"3.5rem", textAlign:"center" }}>
              <div style={{ fontSize:"2rem", marginBottom:"0.75rem", opacity:0.15 }}>📊</div>
              <div style={{ color:COLORS.text.muted, fontSize:"0.88rem" }}>
                {data.length === 0 ? "No data — click Import CSV to load" : accidentFilter ? "Aucun accident trouvé" : "No records match filter"}
              </div>
            </div>
          ) : (
            paginated.map((row, i) => (
              <DataRow key={row.id ?? i} row={row} last={i===paginated.length-1} onToggle={handleToggleAccident} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:"1.1rem" }}>
            <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:page===0?COLORS.text.subtle:COLORS.text.muted, borderRadius:8, padding:"0.5rem 1rem", fontSize:"0.82rem", cursor:page===0?"not-allowed":"pointer", fontFamily:"inherit" }}>← Prev</button>
            <div style={{ display:"flex", gap:3 }}>
              {Array.from({ length:Math.min(totalPages,7) }, (_,i) => {
                const p = totalPages <= 7 ? i : Math.max(0, Math.min(page-3, totalPages-7)) + i;
                return <button key={p} onClick={() => setPage(p)} style={{ background:page===p?`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`:"rgba(255,255,255,0.04)", color:page===p?COLORS.text.primary:COLORS.text.muted, border:"none", borderRadius:7, padding:"0.42rem 0.72rem", fontSize:"0.78rem", cursor:"pointer", fontFamily:"inherit", minWidth:34 }}>{p+1}</button>;
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:page>=totalPages-1?COLORS.text.subtle:COLORS.text.muted, borderRadius:8, padding:"0.5rem 1rem", fontSize:"0.82rem", cursor:page>=totalPages-1?"not-allowed":"pointer", fontFamily:"inherit" }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}