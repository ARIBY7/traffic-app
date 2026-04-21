import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  p200: "#AFA9EC",
  p400: "#7F77DD",
  p600: "#534AB7",
  t400: "#1D9E75",
  t200: "#5DCAA5",
  coral: "#D85A30",
  amber: "#EF9F27",
  bg:   "#09080F",
  bg2:  "#110F1E",
  bg3:  "#1A1730",
};

const API = "http://localhost:8081";
const PAGE_SIZE = 20;

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.12 }) {
  return (
    <div style={{
      position: "fixed", left: x, top: y,
      width: size, height: size, borderRadius: "50%",
      background: color, opacity, filter: "blur(100px)",
      pointerEvents: "none", zIndex: 0,
      transform: "translate(-50%,-50%)",
    }} />
  );
}

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{
      background: C.bg2, border: "1px solid rgba(255,255,255,0.07)",
      borderTop: `2px solid ${color}`, borderRadius: 12,
      padding: "1.2rem 1.4rem", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: 14, top: 14, fontSize: 20, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: "0.72rem", color: "#4A4868", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem", fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "#4A4868", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function AccidentBadge({ val }) {
  const yes = val === true || val === 1;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: yes ? `${C.coral}18` : "rgba(255,255,255,0.04)",
      border: `1px solid ${yes ? C.coral + "44" : "rgba(255,255,255,0.08)"}`,
      color: yes ? "#F0997B" : "#4A4868",
      fontSize: "0.7rem", fontWeight: 600,
      padding: "0.2rem 0.6rem", borderRadius: 100,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: yes ? C.coral : "#4A4868", display: "inline-block" }} />
      {yes ? "Accident" : "Normal"}
    </span>
  );
}

function PrimaryBtn({ children, onClick, disabled, loading: isLoading }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled || isLoading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: disabled || isLoading ? "rgba(255,255,255,0.06)" : hov ? C.p400 : `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
        color: disabled || isLoading ? "#4A4868" : "#fff",
        border: "none", borderRadius: 8, padding: "0.72rem 1.4rem",
        fontSize: "0.88rem", fontWeight: 600,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.18s",
        boxShadow: hov && !disabled && !isLoading ? `0 0 20px ${C.p400}44` : "none",
        display: "flex", alignItems: "center", gap: 8,
      }}>
      {isLoading && (
        <span style={{
          width: 14, height: 14,
          border: "2px solid #ffffff44", borderTop: "2px solid #fff",
          borderRadius: "50%", animation: "spin 0.8s linear infinite",
          display: "inline-block", flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bg2, border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16, padding: "2rem",
        width: "100%", maxWidth: 460,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4A4868", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{ fontSize: "0.82rem", color: "#4A4868", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "0.88rem", color: color || "#fff", fontWeight: 600 }}>{value ?? "—"}</span>
    </div>
  );
}

function DataRow({ row, last, onView }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "55px 90px 90px 90px 75px 75px 75px 110px 110px",
        padding: "0.85rem 1.4rem",
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)",
        background: hov ? C.bg3 : "transparent",
        alignItems: "center", transition: "background 0.15s",
      }}>
      <span style={{ fontSize: "0.78rem", color: "#4A4868", fontWeight: 600 }}>#{row.id}</span>
      <span style={{ fontSize: "0.82rem", color: C.amber, fontWeight: 500 }}>
        {row.vitesseMoy != null ? `${Number(row.vitesseMoy).toFixed(1)} km/h` : "—"}
      </span>
      <span style={{ fontSize: "0.82rem", color: "#D1D5DB" }}>
        {row.volumeTraffic != null ? Number(row.volumeTraffic).toFixed(0) : "—"}
      </span>
      <span style={{ fontSize: "0.82rem", color: C.p200 }}>{row.nombreVoiture ?? "—"}</span>
      <span style={{ fontSize: "0.82rem", color: "#7C7A99" }}>{row.nombreCamions ?? "—"}</span>
      <span style={{ fontSize: "0.82rem", color: "#7C7A99" }}>{row.nombreVelos ?? "—"}</span>
      <span style={{ fontSize: "0.75rem", color: "#4A4868" }}>
        {row.locationId ? `#${row.locationId}` : row.location?.id ? `#${row.location.id}` : "—"}
      </span>
      <span style={{ fontSize: "0.72rem", color: "#4A4868" }}>
        {row.dateHeure
          ? new Date(row.dateHeure).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
          : "—"}
      </span>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
        <AccidentBadge val={row.accidentSignale} />
        <button onClick={() => onView(row)} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#7C7A99", borderRadius: 6, padding: "0.28rem 0.65rem",
          fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>View</button>
      </div>
    </div>
  );
}

export default function TrafficDataDashboard() {
  const navigate = useNavigate();

  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [importing, setImporting]     = useState(false);
  const [toast, setToast]             = useState(null);
  const [selected, setSelected]       = useState(null);
  const [locationId, setLocationId]   = useState("");
  const [filterAccident, setFilterAccident] = useState("all");
  const [page, setPage]               = useState(0);
  const [locations, setLocations]     = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── FETCH ALL DATA from all locations on mount ──
  // GET /api/admin/sensors → returns list of locations with listeDonnees
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/sensors`, { headers: getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) { showToast("Erreur de chargement", "error"); return; }
      const locs = await res.json();
      setLocations(Array.isArray(locs) ? locs : []);

      // flatten all listeDonnees from all locations
      const allDonnees = (Array.isArray(locs) ? locs : [])
        .flatMap(loc =>
          (Array.isArray(loc.listeDonnees) ? loc.listeDonnees : []).map(d => ({
            ...d,
            locationId: d.locationId ?? loc.id,
          }))
        );

      setData(allDonnees);
      setPage(0);
    } catch (e) {
      console.error(e);
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  // ── IMPORT DATA for a location — POST /api/location/{id}/load-data ──
  const handleImport = async () => {
    if (!locationId.trim()) { showToast("Entrez un Location ID", "error"); return; }
    setImporting(true);
    try {
      const res = await fetch(`${API}/api/location/${locationId.trim()}/load-data`, {
        method: "POST", headers: getHeaders(),
      });
      const text = await res.text();
      if (!res.ok) { showToast("Erreur lors de l'import", "error"); return; }
      showToast(text || "Données importées avec succès !");
      await fetchAllData(); // refresh all data after import
    } catch (e) {
      console.error(e);
      showToast("Erreur serveur", "error");
    } finally {
      setImporting(false);
    }
  };

  // ── FILTER ──
  const filtered = data.filter(d => {
    if (filterAccident === "accident") return d.accidentSignale === true;
    if (filterAccident === "normal")   return d.accidentSignale !== true;
    return true;
  });

  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // ── STATS ──
  const accidents = data.filter(d => d.accidentSignale === true).length;
  const avgSpeed  = data.length
    ? (data.reduce((s, d) => s + (d.vitesseMoy || 0), 0) / data.length).toFixed(1)
    : "—";
  const totalVol  = data.length
    ? data.reduce((s, d) => s + (d.volumeTraffic || 0), 0).toFixed(0)
    : "—";

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, color: "#f0f0f0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:#7F77DD44;color:#fff;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#534AB755;border-radius:4px;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <GlowOrb x="10%" y="20%" color={C.p600} size={500} opacity={0.12} />
      <GlowOrb x="90%" y="70%" color={C.amber} size={400} opacity={0.08} />

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 999,
          background: toast.type === "error" ? `${C.coral}18` : `${C.t400}18`,
          border: `1px solid ${toast.type === "error" ? C.coral : C.t400}55`,
          color: toast.type === "error" ? "#F0997B" : C.t200,
          borderRadius: 10, padding: "0.75rem 1.2rem",
          fontSize: "0.85rem", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.type === "error" ? "⚠" : "✓"} {toast.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: C.bg2, borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", zIndex: 10, padding: "1.5rem 1rem",
      }}>
        <div onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: "2.5rem" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>🚦</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1rem", color: "#fff" }}>TrafficIQ</span>
        </div>

        <div style={{ fontSize: "0.68rem", color: "#4A4868", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.75rem", paddingLeft: 8 }}>
          Navigation
        </div>

        {[
          { label: "Dashboard",    icon: "⊞",  path: "/admin"            },
          { label: "Locations",    icon: "📡",  path: "/admin/locations"  },
          { label: "Traffic Data", icon: "📊",  path: "/admin/traffic",    active: true },
          { label: "Congestion",   icon: "🧠",  path: "/admin/congestion" },
          { label: "Statistics",   icon: "📈",  path: "/admin/statistics" },
        ].map(item => (
          <div key={item.label} onClick={() => navigate(item.path)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "0.65rem 0.8rem", borderRadius: 8, marginBottom: 4,
            background: item.active ? `${C.p400}18` : "transparent",
            border: item.active ? `1px solid ${C.p400}33` : "1px solid transparent",
            cursor: "pointer", transition: "all 0.18s",
            color: item.active ? C.p200 : "#4A4868",
            fontSize: "0.88rem", fontWeight: item.active ? 600 : 400,
          }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}

        <div style={{ marginTop: "auto" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "1rem" }} />
          <div onClick={() => { localStorage.clear(); navigate("/login"); }}
            onMouseEnter={e => e.currentTarget.style.color = "#F0997B"}
            onMouseLeave={e => e.currentTarget.style.color = "#4A4868"}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.65rem 0.8rem", borderRadius: 8, cursor: "pointer", color: "#4A4868", fontSize: "0.88rem", transition: "color 0.2s" }}>
            <span>🚪</span> Logout
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 220, padding: "2.5rem", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.7rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
              Traffic Data
            </h1>
            <p style={{ color: "#4A4868", fontSize: "0.88rem", marginTop: 4, fontWeight: 300 }}>
              {loading ? "Loading records..." : `${data.length.toLocaleString()} records across ${locations.length} locations`}
            </p>
          </div>
          <button onClick={fetchAllData} disabled={loading} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: loading ? "#3A3858" : "#7C7A99", borderRadius: 8,
            padding: "0.65rem 1.2rem", fontSize: "0.85rem",
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>↻ Refresh</button>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: "1.5rem" }}>
          <StatCard label="Total Records"   value={loading ? "..." : data.length.toLocaleString()} color={C.p400}  icon="📊" />
          <StatCard label="Avg Speed"       value={loading ? "..." : `${avgSpeed} km/h`}            color={C.amber} icon="⚡" />
          <StatCard label="Total Volume"    value={loading ? "..." : Number(totalVol).toLocaleString()} color={C.t400} icon="🚗" sub="vehicles" />
          <StatCard label="Accidents"       value={loading ? "..." : accidents}                      color={C.coral} icon="⚠️" />
        </div>

        {/* IMPORT PANEL */}
        <div style={{
          background: C.bg2, border: `1px solid ${C.p600}44`,
          borderRadius: 14, padding: "1.2rem 1.6rem",
          marginBottom: "1.5rem",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "0.8rem", color: C.p200, fontWeight: 600 }}>📥 Import for location :</span>
          <input
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleImport()}
            placeholder="Location ID (ex: 1)"
            style={{
              flex: 1, minWidth: 140,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "0.6rem 1rem",
              fontSize: "0.88rem", color: "#f0f0f0",
              outline: "none", fontFamily: "inherit",
            }}
          />
          <PrimaryBtn onClick={handleImport} loading={importing} disabled={!locationId.trim()}>
            {importing ? "Importing..." : "Import"}
          </PrimaryBtn>
        </div>

        {/* FILTER BAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: C.bg3, borderRadius: 8, padding: 3, gap: 2 }}>
            {[
              { key: "all",      label: `All (${data.length})` },
              { key: "accident", label: `Accidents (${accidents})` },
              { key: "normal",   label: `Normal (${data.length - accidents})` },
            ].map(f => (
              <button key={f.key} onClick={() => { setFilterAccident(f.key); setPage(0); }} style={{
                background: filterAccident === f.key ? `linear-gradient(135deg, ${C.p400}, ${C.p600})` : "transparent",
                color: filterAccident === f.key ? "#fff" : "#4A4868",
                border: "none", borderRadius: 6, padding: "0.38rem 0.9rem",
                fontSize: "0.78rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
              }}>{f.label}</button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", fontSize: "0.78rem", color: "#4A4868" }}>
            Showing {paginated.length} of {filtered.length} records
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background: C.bg2, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "55px 90px 90px 90px 75px 75px 75px 110px 110px",
            padding: "0.85rem 1.4rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "0.68rem", color: "#4A4868",
            textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
          }}>
            <span>ID</span>
            <span>Speed</span>
            <span>Volume</span>
            <span>Cars</span>
            <span>Trucks</span>
            <span>Bikes</span>
            <span>Location</span>
            <span>Date</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#4A4868", fontSize: "0.88rem" }}>
              Loading all traffic records...
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.25 }}>📊</div>
              <div style={{ color: "#4A4868", fontSize: "0.88rem" }}>
                {data.length === 0
                  ? "No traffic data found — import data using the panel above"
                  : "No records match this filter"}
              </div>
            </div>
          ) : (
            paginated.map((row, i) => (
              <DataRow
                key={row.id ?? i}
                row={row}
                last={i === paginated.length - 1}
                onView={setSelected}
              />
            ))
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: "1.2rem" }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: page === 0 ? "#3A3858" : "#7C7A99", borderRadius: 8,
                padding: "0.5rem 1rem", fontSize: "0.82rem",
                cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>← Prev</button>

            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    background: page === p ? `linear-gradient(135deg, ${C.p400}, ${C.p600})` : "rgba(255,255,255,0.04)",
                    color: page === p ? "#fff" : "#4A4868",
                    border: "none", borderRadius: 6,
                    padding: "0.45rem 0.75rem", fontSize: "0.8rem",
                    cursor: "pointer", fontFamily: "inherit", minWidth: 36,
                  }}>{p + 1}</button>
                );
              })}
            </div>

            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: page >= totalPages - 1 ? "#3A3858" : "#7C7A99", borderRadius: 8,
                padding: "0.5rem 1rem", fontSize: "0.82rem",
                cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>Next →</button>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <Modal title={`Traffic Record #${selected.id}`} onClose={() => setSelected(null)}>
          <div style={{ marginBottom: "0.75rem" }}><AccidentBadge val={selected.accidentSignale} /></div>
          <DetailRow label="Vitesse moyenne" value={selected.vitesseMoy != null ? `${Number(selected.vitesseMoy).toFixed(2)} km/h` : "—"} color={C.amber} />
          <DetailRow label="Volume trafic"   value={selected.volumeTraffic != null ? Number(selected.volumeTraffic).toFixed(2) : "—"} />
          <DetailRow label="Nombre voitures" value={selected.nombreVoiture} color={C.p200} />
          <DetailRow label="Nombre camions"  value={selected.nombreCamions} />
          <DetailRow label="Nombre vélos"    value={selected.nombreVelos} />
          <DetailRow label="Location ID"     value={selected.locationId ?? selected.location?.id ?? "—"} />
          <DetailRow label="Date / Heure"    value={selected.dateHeure ? new Date(selected.dateHeure).toLocaleString("fr-FR") : "—"} color={C.t200} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button onClick={() => setSelected(null)} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: "#7C7A99", borderRadius: 8, padding: "0.68rem 1.4rem",
              fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit",
            }}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}