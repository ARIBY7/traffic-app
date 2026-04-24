import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8081";
const PAGE_SIZE = 20;

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.08 }) {
  return (
    <div style={{
      position: "fixed", left: x, top: y,
      width: size, height: size, borderRadius: "50%",
      background: color, opacity, filter: "blur(110px)",
      pointerEvents: "none", zIndex: 0,
      transform: "translate(-50%, -50%)",
    }} />
  );
}

function Sidebar({ navigate, path }) {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
      background: COLORS.bg.card,
      borderRight: "1px solid rgba(127, 119, 221, 0.1)",
      display: "flex", flexDirection: "column",
      zIndex: 50, padding: "1.5rem 1rem",
    }}>
      <div onClick={() => navigate("/")} style={{
        display: "flex", alignItems: "center", gap: 8,
        cursor: "pointer", marginBottom: "2.5rem",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}>🚦</div>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800, fontSize: "1rem",
          color: COLORS.text.primary,
        }}>TrafficIQ</span>
      </div>

      <div style={{
        fontSize: "0.65rem", color: COLORS.text.subtle,
        letterSpacing: "0.12em", textTransform: "uppercase",
        fontWeight: 700, marginBottom: "0.75rem", paddingLeft: 8,
      }}>Navigation</div>

      {[
        { label: "Dashboard", icon: "▣", p: "/admin" },
        { label: "Sensors", icon: "◎", p: "/admin/locations" },
        { label: "Traffic Data", icon: "▦", p: "/admin/traffic", active: true },
        { label: "Congestion", icon: "◈", p: "/admin/congestion" },
        { label: "Manage Users", icon: "👤", p: "/admin/users" },
        { label: "Statistics", icon: "▤", p: "/admin/statistics" },
      ].map((item) => {
        const active = item.active;
        return (
          <div
            key={item.label}
            onClick={() => navigate(item.p)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "0.6rem 0.8rem", borderRadius: 10, marginBottom: 3,
              background: active ? `${COLORS.primary.light}1A` : "transparent",
              border: active ? `1px solid ${COLORS.primary.light}30` : "1px solid transparent",
              cursor: "pointer", transition: "all 0.15s",
              color: active ? COLORS.primary.light : COLORS.text.muted,
              fontSize: "0.875rem", fontWeight: active ? 600 : 400,
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
            {active && (
              <div style={{
                marginLeft: "auto", width: 5, height: 5,
                borderRadius: "50%", background: COLORS.primary.light,
              }} />
            )}
          </div>
        );
      })}

      <div style={{ marginTop: "auto" }}>
        <div style={{
          height: 1, background: "rgba(127, 119, 221, 0.1)",
          margin: "0.75rem 0",
        }} />
        <div
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F0997B")}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.text.muted)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "0.6rem 0.8rem", borderRadius: 10,
            cursor: "pointer", color: COLORS.text.muted,
            fontSize: "0.875rem", transition: "color 0.15s",
          }}
        >
          <span style={{ fontSize: 14 }}>⎋</span> Logout
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon, sub, loading }) {
  return (
    <div style={{
      background: COLORS.bg.card,
      border: "1px solid rgba(127, 119, 221, 0.1)",
      borderLeft: `3px solid ${color}`,
      borderRadius: 12,
      padding: "1.1rem 1.3rem",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", right: 12, top: 12,
        fontSize: 18, opacity: 0.15,
      }}>{icon}</div>

      <div style={{
        fontSize: "0.68rem", color: COLORS.text.muted,
        textTransform: "uppercase", letterSpacing: "0.1em",
        fontWeight: 700, marginBottom: 8,
      }}>{label}</div>

      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "1.7rem", fontWeight: 800,
        color: loading ? COLORS.text.muted : color,
        lineHeight: 1,
      }}>{loading ? "..." : value}</div>

      {sub && (
        <div style={{
          fontSize: "0.68rem", color: COLORS.text.muted,
          marginTop: 5,
        }}>{sub}</div>
      )}
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
        display: "grid",
        gridTemplateColumns: "50px 90px 80px 75px 60px 60px 60px 100px 100px",
        padding: "0.82rem 1.3rem",
        borderBottom: last ? "none" : "1px solid rgba(127, 119, 221, 0.06)",
        background: hov ? COLORS.bg.hover : "transparent",
        alignItems: "center",
        transition: "background 0.12s",
        borderLeft: `2px solid ${accidentColor}`,
      }}
    >
      <span style={{
        fontSize: "0.75rem", color: COLORS.text.subtle,
        fontWeight: 700,
      }}>#{row.id}</span>

      <span style={{
        fontSize: "0.82rem", color: COLORS.accent.amber,
        fontWeight: 600,
      }}>{row.vitesseMoy != null ? `${Number(row.vitesseMoy).toFixed(1)}km/h` : "—"}</span>

      <span style={{
        fontSize: "0.8rem", color: "#C8C6E8",
      }}>{row.volumeTraffic != null ? Number(row.volumeTraffic).toFixed(0) : "—"}</span>

      <span style={{
        fontSize: "0.8rem", color: COLORS.primary.light,
      }}>{row.nombreVoiture ?? "—"}</span>

      <span style={{
        fontSize: "0.75rem", color: COLORS.text.subtle,
      }}>{row.nombreCamions ?? "—"}</span>

      <span style={{
        fontSize: "0.75rem", color: COLORS.text.subtle,
      }}>{row.nombreVelos ?? "—"}</span>

      <span style={{
        fontSize: "0.72rem", color: COLORS.text.subtle,
      }}>{row.locationId ? `#${row.locationId}` : "—"}</span>

      <span style={{
        fontSize: "0.7rem", color: COLORS.text.subtle,
      }}>
        {row.dateHeure
          ? new Date(row.dateHeure).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </span>

      <div style={{
        display: "flex", justifyContent: "flex-end",
        alignItems: "center", gap: 4,
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: row.accidentSignale ? `${COLORS.accent.coral}15` : "rgba(255,255,255,0.04)",
          border: `1px solid ${row.accidentSignale ? COLORS.accent.coral + "40" : "rgba(255,255,255,0.07)"}`,
          color: row.accidentSignale ? "#F0997B" : COLORS.text.subtle,
          fontSize: "0.68rem", fontWeight: 600,
          padding: "0.15rem 0.55rem", borderRadius: 100,
        }}>
          <span style={{
            width: 4, height: 4, borderRadius: "50%",
            background: accidentColor, display: "inline-block",
          }} />
          {row.accidentSignale ? "Accident" : "Normal"}
        </span>

        <button
          onClick={() => onToggle(row.id)}
          title="Toggle accident"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: COLORS.text.subtle,
            borderRadius: 6,
            padding: "0.2rem 0.45rem",
            fontSize: "0.65rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ⇄
        </button>
      </div>
    </div>
  );
}

function LoadingOverlay({ message }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 60, height: 60,
          border: "3px solid rgba(127,119,221,0.3)",
          borderTop: `3px solid ${COLORS.primary.light}`,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 1.5rem",
        }} />
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.3rem", fontWeight: 700,
          color: COLORS.text.primary, marginBottom: "0.5rem",
        }}>Importing Data...</h2>
        <p style={{
          fontSize: "0.9rem", color: COLORS.text.muted,
          marginBottom: "1rem",
        }}>{message}</p>
      </div>
    </div>
  );
}

export default function TrafficDataDashboard() {
  const navigate = useNavigate();
  const path = window.location.pathname;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("Lecture du fichier CSV...");
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(0);

  const [stats, setStats] = useState({
    total: null,
    avgSpeed: null,
    volume: null,
    nbrTraffic: null,
    accidents: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [searchMode, setSearchMode] = useState("all");
  const [locInput, setLocInput] = useState("");
  const [dateInput, setDateInput] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const [total, avgSpeed, volume, nbrTraffic, accidents] = await Promise.all([
        fetch(`${API}/api/admin/data/total`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API}/api/admin/data/speed/latestDate`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API}/api/admin/data/volume/latestDate`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API}/api/admin/data/traffic/latestDate`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API}/api/admin/data/accident/latestDate`, { headers: getHeaders() }).then((r) => r.json()),
      ]);
      setStats({ total, avgSpeed, volume, nbrTraffic, accidents });
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/data`, { headers: getHeaders() });
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      if (res.status === 404) {
        setData([]);
        return;
      }
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
      setPage(0);
    } catch (e) {
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
    fetchAll();
  }, [fetchAll]);

  const handleImport = async () => {
    setImporting(true);
    setImportMessage("Lecture du fichier CSV...");

    try {
      console.log("📡 Appel endpoint import...");
      const res = await fetch(`${API}/api/location/load-data`, {
        method: "POST",
        headers: getHeaders(),
      });

      console.log("✓ Réponse reçue - Status:", res.status);

      if (res.status === 401) {
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Erreur API:", res.status, errorText);
        showToast(`Erreur lors de l'import (${res.status})`, "error");
        setImporting(false);
        return;
      }

      const responseText = await res.text();
      console.log("✓ Réponse:", responseText);

      setImportMessage("Traitement des données en cours...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setImportMessage("Rechargement des données...");
      await Promise.all([fetchStats(), fetchAll()]);

      showToast("✅ Données importées avec succès !");
      console.log("✅ Import terminé !");
    } catch (e) {
      console.error("❌ Erreur complète:", e);
      showToast("Erreur serveur lors de l'import", "error");
    } finally {
      setImporting(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/api/admin/data`, { headers: getHeaders() });
      const d = await res.json();
      if (!Array.isArray(d) || d.length === 0) {
        showToast("Aucune donnée à télécharger", "error");
        return;
      }
      const headers = ["id", "vitesseMoy", "volumeTraffic", "nombreVoiture", "nombreCamions", "nombreVelos", "locationId", "dateHeure", "accidentSignale"];
      const csv = [
        headers.join(","),
        ...d.map((r) => headers.map((h) => r[h] ?? "").join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traffic_data_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Données téléchargées !");
    } catch (e) {
      showToast("Erreur téléchargement", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleToggleAccident = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/data/updateAccidentStatus/${id}`, {
        method: "PUT",
        headers: getHeaders(),
      });
      if (!res.ok) {
        showToast("Erreur mise à jour", "error");
        return;
      }
      const updated = await res.json();
      setData((prev) => prev.map((d) => (d.id === id ? updated : d)));
      showToast("Statut mis à jour");
      fetchStats();
    } catch (e) {
      showToast("Erreur serveur", "error");
    }
  };

  const fetchByLocation = async () => {
    if (!locInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/data/location/${locInput.trim()}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        showToast("Aucune donnée pour cette location", "error");
        setData([]);
        return;
      }
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
      setPage(0);
    } catch (e) {
      showToast("Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchByDate = async () => {
    if (!dateInput) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/traffic/by-date?date=${dateInput}`, {
        headers: getHeaders(),
      });
      if (res.status === 404) {
        showToast("Aucune donnée pour cette date", "error");
        setData([]);
        return;
      }
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
      setPage(0);
    } catch (e) {
      showToast("Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchMode === "all") fetchAll();
    if (searchMode === "location") fetchByLocation();
    if (searchMode === "date") fetchByDate();
  };

  const paginated = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const fmt = (v, dec = 1) => (v != null ? Number(v).toFixed(dec) : "...");

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: COLORS.bg.main,
      color: COLORS.text.primary,
      minHeight: "100vh",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(127, 119, 221, 0.3); color: #fff; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(127, 119, 221, 0.3); border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
      `}</style>

      <GlowOrb x="10%" y="15%" color={COLORS.primary.dark} size={600} opacity={0.1} />
      <GlowOrb x="88%" y="72%" color={COLORS.accent.coral} size={450} opacity={0.08} />

      {importing && <LoadingOverlay message={importMessage} />}

      {toast && (
        <div style={{
          position: "fixed",
          top: "1.4rem",
          right: "1.4rem",
          zIndex: 999,
          background: toast.type === "error" ? `${COLORS.accent.coral}15` : `${COLORS.accent.teal}15`,
          border: `1px solid ${toast.type === "error" ? COLORS.accent.coral : COLORS.accent.teal}40`,
          color: toast.type === "error" ? "#F0997B" : COLORS.accent.teal,
          borderRadius: 12,
          padding: "0.7rem 1.1rem",
          fontSize: "0.85rem",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.type === "error" ? "⚠" : "✓"} {toast.msg}
        </div>
      )}

      <Sidebar navigate={navigate} path={path} />

      <div style={{
        marginLeft: 220,
        padding: "2.2rem 2.4rem",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1.8rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "1.6rem",
              fontWeight: 800,
              color: COLORS.text.primary,
              letterSpacing: "-0.5px",
              marginBottom: 4,
            }}>Traffic Data</h1>
            <p style={{
              color: COLORS.text.muted,
              fontSize: "0.85rem",
              fontWeight: 300,
            }}>
              {loading ? "Loading records..." : `${data.length.toLocaleString()} records loaded`}
            </p>
          </div>

          <div style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}>
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`,
                color: COLORS.text.primary,
                border: "none",
                borderRadius: 10,
                padding: "0.65rem 1.2rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: importing ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: importing ? 0.6 : 1,
                transition: "all 0.3s",
              }}
            >
              {importing ? "⏳ Importing..." : "⬆ Import CSV"}
            </button>

            <button
              onClick={() => {
                fetchAll();
                fetchStats();
              }}
              disabled={loading}
              style={{
                background: "transparent",
                border: "1px solid rgba(127, 119, 221, 0.2)",
                color: COLORS.text.muted,
                borderRadius: 10,
                padding: "0.65rem 1.2rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ↻ Refresh
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                background: "transparent",
                border: "1px solid rgba(127, 119, 221, 0.2)",
                color: COLORS.text.muted,
                borderRadius: 10,
                padding: "0.65rem 1.2rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {downloading ? "⏳" : "↓"} Download
            </button>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0,1fr))",
          gap: 12,
          marginBottom: "1.6rem",
        }}>
          <StatCard
            label="Total Records"
            value={(stats.total ?? 0).toLocaleString()}
            color={COLORS.primary.light}
            icon="📊"
            loading={statsLoading}
          />
          <StatCard
            label="Avg Speed"
            value={`${fmt(stats.avgSpeed)} km/h`}
            unit="latest date"
            color={COLORS.accent.amber}
            icon="⚡"
            loading={statsLoading}
          />
          <StatCard
            label="Volume"
            value={fmt(stats.volume, 0)}
            unit="latest date"
            color={COLORS.accent.teal}
            icon="🚗"
            loading={statsLoading}
          />
          <StatCard
            label="Traffic"
            value={(stats.nbrTraffic ?? 0).toLocaleString()}
            unit="latest date"
            color={COLORS.primary.light}
            icon="🛣️"
            loading={statsLoading}
          />
          <StatCard
            label="Accidents"
            value={stats.accidents ?? 0}
            unit="latest date"
            color={COLORS.accent.coral}
            icon="⚠️"
            loading={statsLoading}
          />
        </div>

        <div style={{
          background: COLORS.bg.card,
          border: "1px solid rgba(127, 119, 221, 0.1)",
          borderRadius: 14,
          padding: "1rem 1.4rem",
          marginBottom: "1.1rem",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div style={{
            display: "flex",
            background: COLORS.bg.hover,
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}>
            {["all", "location", "date"].map((m) => (
              <button
                key={m}
                onClick={() => setSearchMode(m)}
                style={{
                  background: searchMode === m
                    ? `linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`
                    : "transparent",
                  color: searchMode === m ? COLORS.text.primary : COLORS.text.muted,
                  border: "none",
                  borderRadius: 7,
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {m === "all" ? "All" : `By ${m}`}
              </button>
            ))}
          </div>

          {searchMode === "location" && (
            <input
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Location ID..."
              style={{
                flex: 1,
                minWidth: 140,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "0.55rem 0.9rem",
                fontSize: "0.85rem",
                color: COLORS.text.primary,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          )}
          {searchMode === "date" && (
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: 160,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "0.55rem 0.9rem",
                fontSize: "0.85rem",
                color: COLORS.text.primary,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          )}

          <button
            onClick={handleSearch}
            disabled={(searchMode === "location" && !locInput.trim()) || (searchMode === "date" && !dateInput)}
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`,
              color: COLORS.text.primary,
              border: "none",
              borderRadius: 10,
              padding: "0.55rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Search
          </button>

          {searchMode !== "all" && (
            <button
              onClick={() => {
                setLocInput("");
                setDateInput("");
                setSearchMode("all");
                fetchAll();
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: COLORS.text.muted,
                borderRadius: 10,
                padding: "0.55rem 1rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Clear ✕
            </button>
          )}
        </div>

        <div style={{
          background: COLORS.bg.card,
          border: "1px solid rgba(127, 119, 221, 0.1)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "50px 90px 80px 75px 60px 60px 60px 100px 100px",
            padding: "0.75rem 1.3rem",
            borderBottom: "1px solid rgba(127, 119, 221, 0.08)",
            fontSize: "0.65rem",
            color: COLORS.text.subtle,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}>
            <span>ID</span>
            <span>Speed</span>
            <span>Volume</span>
            <span>Cars</span>
            <span>Trucks</span>
            <span>Bikes</span>
            <span>Loc.</span>
            <span>Date</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>

          {loading ? (
            <div style={{
              padding: "3rem",
              textAlign: "center",
              color: COLORS.text.muted,
              fontSize: "0.88rem",
            }}>
              Loading...
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: "3.5rem", textAlign: "center" }}>
              <div style={{
                fontSize: "2rem",
                marginBottom: "0.75rem",
                opacity: 0.15,
              }}>📊</div>
              <div style={{
                color: COLORS.text.muted,
                fontSize: "0.88rem",
              }}>
                {data.length === 0
                  ? "No data — click Import CSV to load"
                  : "No records match filter"}
              </div>
            </div>
          ) : (
            paginated.map((row, i) => (
              <DataRow
                key={row.id ?? i}
                row={row}
                last={i === paginated.length - 1}
                onToggle={handleToggleAccident}
              />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: "1.1rem",
          }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: page === 0 ? COLORS.text.subtle : COLORS.text.muted,
                borderRadius: 8,
                padding: "0.5rem 1rem",
                fontSize: "0.82rem",
                cursor: page === 0 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Prev
            </button>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p =
                  totalPages <= 7
                    ? i
                    : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      background: page === p
                        ? `linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`
                        : "rgba(255,255,255,0.04)",
                      color: page === p ? COLORS.text.primary : COLORS.text.muted,
                      border: "none",
                      borderRadius: 7,
                      padding: "0.42rem 0.72rem",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      minWidth: 34,
                    }}
                  >
                    {p + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: page >= totalPages - 1 ? COLORS.text.subtle : COLORS.text.muted,
                borderRadius: 8,
                padding: "0.5rem 1rem",
                fontSize: "0.82rem",
                cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}