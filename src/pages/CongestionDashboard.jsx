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

function NiveauBadge({ niveau }) {
  const map = {
    CRITIQUE: { bg: `${C.coral}18`, border: `${C.coral}44`, color: "#F0997B", dot: C.coral },
    HAUT:     { bg: `${C.amber}18`, border: `${C.amber}44`, color: "#F5C96A", dot: C.amber },
    MOYEN:    { bg: `${C.p400}18`,  border: `${C.p400}44`,  color: C.p200,    dot: C.p400  },
  };
  const s = map[niveau] || map.MOYEN;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, fontSize: "0.72rem", fontWeight: 600,
      padding: "0.22rem 0.7rem", borderRadius: 100,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {niveau}
    </span>
  );
}

function CauseBadge({ cause }) {
  const map = {
    ACCIDENT:      { color: "#F0997B", bg: `${C.coral}15` },
    SATURATION:    { color: C.p200,    bg: `${C.p400}15`  },
    "TRAFIC DENSE":{ color: "#F5C96A", bg: `${C.amber}15` },
  };
  const s = map[cause] || { color: "#7C7A99", bg: "rgba(255,255,255,0.04)" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: "0.7rem", fontWeight: 600,
      padding: "0.2rem 0.6rem", borderRadius: 6,
    }}>{cause || "—"}</span>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: C.bg2, border: "1px solid rgba(255,255,255,0.07)",
      borderTop: `2px solid ${color}`, borderRadius: 12,
      padding: "1.2rem 1.4rem", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: 14, top: 14, fontSize: 20, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: "0.72rem", color: "#4A4868", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem", fontWeight: 800, color }}>{value}</div>
    </div>
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
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{ fontSize: "0.82rem", color: "#4A4868", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "0.88rem", color: color || "#fff", fontWeight: 600 }}>{value ?? "—"}</span>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, danger, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: disabled ? "rgba(255,255,255,0.06)"
          : danger ? (hov ? "#b84a25" : C.coral)
          : hov ? C.p400 : `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
        color: disabled ? "#4A4868" : "#fff",
        border: "none", borderRadius: 8,
        padding: small ? "0.5rem 1rem" : "0.72rem 1.4rem",
        fontSize: small ? "0.8rem" : "0.88rem", fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.18s",
        boxShadow: hov && !disabled ? `0 0 20px ${danger ? C.coral : C.p400}44` : "none",
      }}>{children}</button>
  );
}

function ActionBtn({ onClick, color, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? color + "22" : "rgba(255,255,255,0.04)",
        border: `1px solid ${hov ? color + "55" : "rgba(255,255,255,0.08)"}`,
        color: hov ? color : "#7C7A99",
        borderRadius: 6, padding: "0.32rem 0.7rem",
        fontSize: "0.76rem", fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
      }}>{label}</button>
  );
}

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function CongestionDashboard() {
  const navigate = useNavigate();

  const [allCongestions, setAllCongestions]       = useState([]);
  const [criticalCongestions, setCriticalCongestions] = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [toast, setToast]                         = useState(null);
  const [tab, setTab]                             = useState("all");  // "all" | "critical"
  const [selected, setSelected]                   = useState(null);   // detail modal
  const [showDelete, setShowDelete]               = useState(null);
  const [locationIdSearch, setLocationIdSearch]   = useState("");
  const [zoneResult, setZoneResult]               = useState(null);
  const [searching, setSearching]                 = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── FETCH ALL via locations → on récupère les congestions par zone (locationId)
  // Pour l'overview on charge les critiques depuis /api/users/congestions/critical
  const fetchCritical = async () => {
    try {
      const res = await fetch(`${API}/api/users/congestions/critical`, { headers: getHeaders() });
      if (res.status === 404) { setCriticalCongestions([]); return; }
      const data = await res.json();
      setCriticalCongestions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // Charge les congestions d'une zone/location
  const fetchByLocation = async (locationId) => {
    setSearching(true);
    try {
      const res = await fetch(`${API}/api/users/congestions/zone/${locationId}`, { headers: getHeaders() });
      if (res.status === 404) { setZoneResult([]); showToast("Aucune congestion pour cette location", "error"); return; }
      if (!res.ok) { showToast("Erreur de chargement", "error"); return; }
      const data = await res.json();
      setZoneResult(Array.isArray(data) ? data : []);
      setAllCongestions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); showToast("Erreur serveur", "error"); }
    finally { setSearching(false); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCritical();
      setLoading(false);
    };
    init();
  }, []);

  // ── DELETE — DELETE /api/admin/congestions/{id} ──
  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/api/admin/congestions/${showDelete.id}`, {
        method: "DELETE", headers: getHeaders(),
      });
      if (!res.ok) throw new Error();
      showToast("Congestion supprimée");
      setShowDelete(null);
      // refresh
      if (locationIdSearch) fetchByLocation(locationIdSearch);
      await fetchCritical();
      setAllCongestions(prev => prev.filter(c => c.id !== showDelete.id));
    } catch { showToast("Erreur lors de la suppression", "error"); }
  };

  const displayed = tab === "critical" ? criticalCongestions : allCongestions;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, color: "#f0f0f0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:#7F77DD44;color:#fff;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#534AB755;border-radius:4px;}
      `}</style>

      <GlowOrb x="10%" y="20%" color={C.p600} size={500} opacity={0.12} />
      <GlowOrb x="90%" y="70%" color={C.coral} size={400} opacity={0.08} />

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
          { label: "Traffic Data", icon: "📊",  path: "/admin/traffic"    },
          { label: "Congestion",   icon: "🧠",  path: "/admin/congestion", active: true },
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
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.7rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            Congestion
          </h1>
          <p style={{ color: "#4A4868", fontSize: "0.88rem", marginTop: 4, fontWeight: 300 }}>
            Monitor and manage traffic congestion zones
          </p>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, marginBottom: "2rem" }}>
          <StatCard label="Critical Zones"    value={criticalCongestions.length}                                    color={C.coral} icon="🔴" />
          <StatCard label="Accidents"          value={criticalCongestions.filter(c => c.cause === "ACCIDENT").length} color={C.amber} icon="⚠️" />
          <StatCard label="Loaded (zone)"      value={allCongestions.length}                                          color={C.p400}  icon="📊" />
        </div>

        {/* SEARCH BY LOCATION ID */}
        <div style={{
          background: C.bg2, border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "1.2rem 1.4rem",
          marginBottom: "1.5rem",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: "0.8rem", color: "#7C7A99", fontWeight: 500, whiteSpace: "nowrap" }}>
            Load by Location ID :
          </div>
          <input
            value={locationIdSearch}
            onChange={e => setLocationIdSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchByLocation(locationIdSearch)}
            placeholder="Enter location ID..."
            style={{
              flex: 1, minWidth: 160,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "0.65rem 1rem",
              fontSize: "0.88rem", color: "#f0f0f0",
              outline: "none", fontFamily: "inherit",
            }}
          />
          <PrimaryBtn
            onClick={() => fetchByLocation(locationIdSearch)}
            disabled={searching || !locationIdSearch.trim()}
          >
            {searching ? "Loading..." : "Load"}
          </PrimaryBtn>
          {zoneResult && (
            <button onClick={() => { setZoneResult(null); setAllCongestions([]); setLocationIdSearch(""); }}
              style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "#7C7A99", borderRadius: 8, padding: "0.65rem 1rem",
                fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
              }}>Clear ✕</button>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1rem" }}>
          {[
            { key: "all",      label: `Zone Results (${allCongestions.length})` },
            { key: "critical", label: `Critical (${criticalCongestions.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: tab === t.key ? `linear-gradient(135deg, ${C.p400}, ${C.p600})` : "rgba(255,255,255,0.04)",
              color: tab === t.key ? "#fff" : "#7C7A99",
              border: `1px solid ${tab === t.key ? "transparent" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, padding: "0.5rem 1.1rem",
              fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* TABLE */}
        <div style={{ background: C.bg2, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
          {/* HEADER */}
          <div style={{
            display: "grid", gridTemplateColumns: "55px 100px 120px 90px 90px 100px 1fr 130px",
            padding: "0.85rem 1.4rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "0.7rem", color: "#4A4868",
            textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
          }}>
            <span>ID</span>
            <span>Niveau</span>
            <span>Cause</span>
            <span>Vitesse</span>
            <span>Véhicules</span>
            <span>Volume</span>
            <span>Date</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {/* ROWS */}
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#4A4868", fontSize: "0.88rem" }}>Loading...</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.3 }}>🧠</div>
              <div style={{ color: "#4A4868", fontSize: "0.88rem" }}>
                {tab === "all" ? "Enter a location ID to load congestion data" : "No critical congestions found"}
              </div>
            </div>
          ) : (
            displayed.map((c, i) => (
              <CongestionRow
                key={c.id ?? i}
                congestion={c}
                last={i === displayed.length - 1}
                onView={() => setSelected(c)}
                onDelete={() => setShowDelete(c)}
              />
            ))
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <Modal title={`Congestion #${selected.id}`} onClose={() => setSelected(null)}>
          <div style={{ marginBottom: "1rem" }}>
            <NiveauBadge niveau={selected.niveau} />
            <span style={{ marginLeft: 8 }}><CauseBadge cause={selected.cause} /></span>
          </div>
          <DetailRow label="Vitesse moyenne"  value={selected.vitesseMoy ? `${selected.vitesseMoy} km/h` : "—"} color={C.amber} />
          <DetailRow label="Nombre véhicules" value={selected.nbrVehicule} />
          <DetailRow label="Volume trafic"    value={selected.volumeTraffic ? `${selected.volumeTraffic} véh/h` : "—"} />
          <DetailRow label="Date / Heure"     value={formatDate(selected.heureDate)} color={C.p200} />
          <DetailRow label="Location"         value={selected.location?.name ?? `ID ${selected.location?.id ?? "—"}`} />
          <DetailRow label="Signal impacté"   value={selected.signalImpacte?.id ? `Signal #${selected.signalImpacte.id}` : "—"} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: "1.5rem" }}>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#7C7A99", borderRadius: 8, padding: "0.68rem 1.2rem", fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>Close</button>
            <PrimaryBtn danger onClick={() => { setSelected(null); setShowDelete(selected); }}>Delete</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {showDelete && (
        <Modal title="Delete Congestion" onClose={() => setShowDelete(null)}>
          <p style={{ color: "#9CA3AF", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Are you sure you want to delete congestion <span style={{ color: "#fff", fontWeight: 600 }}>#{showDelete.id}</span>?
            This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowDelete(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#7C7A99", borderRadius: 8, padding: "0.68rem 1.2rem", fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <PrimaryBtn danger onClick={handleDelete}>Delete</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CongestionRow({ congestion: c, last, onView, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "55px 100px 120px 90px 90px 100px 1fr 130px",
        padding: "0.9rem 1.4rem",
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)",
        background: hov ? C.bg3 : "transparent",
        alignItems: "center", transition: "background 0.15s",
      }}>
      <span style={{ fontSize: "0.8rem", color: "#4A4868", fontWeight: 600 }}>#{c.id}</span>
      <NiveauBadge niveau={c.niveau} />
      <CauseBadge cause={c.cause} />
      <span style={{ fontSize: "0.85rem", color: C.amber, fontWeight: 500 }}>
        {c.vitesseMoy != null ? `${c.vitesseMoy} km/h` : "—"}
      </span>
      <span style={{ fontSize: "0.85rem", color: "#D1D5DB" }}>{c.nbrVehicule ?? "—"}</span>
      <span style={{ fontSize: "0.82rem", color: "#7C7A99" }}>
        {c.volumeTraffic != null ? `${c.volumeTraffic}` : "—"}
      </span>
      <span style={{ fontSize: "0.78rem", color: "#4A4868" }}>{
        c.heureDate ? new Date(c.heureDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"
      }</span>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <ActionBtn onClick={onView}   color={C.p400}  label="View"   />
        <ActionBtn onClick={onDelete} color={C.coral} label="Delete" />
      </div>
    </div>
  );
}