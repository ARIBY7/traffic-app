import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  p200: "#AFA9EC",
  p400: "#7F77DD",
  p600: "#534AB7",
  p900: "#26215C",
  t400: "#1D9E75",
  t200: "#5DCAA5",
  coral: "#D85A30",
  amber: "#EF9F27",
  bg:   "#09080F",
  bg2:  "#110F1E",
  bg3:  "#1A1730",
};

const API = "http://localhost:8081";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.12 }) {
  return (
    <div style={{
      position: "fixed", left: x, top: y,
      width: size, height: size, borderRadius: "50%",
      background: color, opacity,
      filter: "blur(100px)",
      pointerEvents: "none", zIndex: 0,
      transform: "translate(-50%,-50%)",
    }} />
  );
}

function Sidebar({ active }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(null);

  const items = [
    { label: "Dashboard",   icon: "⊞",  path: "/admin"           },
    { label: "Locations",   icon: "📡",  path: "/admin/locations"  },
    { label: "Traffic Data",icon: "📊",  path: "/admin/traffic"    },
    { label: "Congestion",  icon: "🧠",  path: "/admin/congestion" },
    { label: "Statistics",  icon: "📈",  path: "/admin/statistics" },
  ];

  return (
    <div style={{
      position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
      background: C.bg2, borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", zIndex: 10, padding: "1.5rem 1rem",
    }}>
      <div
        onClick={() => navigate("/")}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: "2.5rem" }}
      >
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

      {items.map(item => {
        const isActive = active === item.label;
        const isHov = hov === item.label;
        return (
          <div
            key={item.label}
            onClick={() => navigate(item.path)}
            onMouseEnter={() => setHov(item.label)}
            onMouseLeave={() => setHov(null)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "0.65rem 0.8rem", borderRadius: 8, marginBottom: 4,
              background: isActive ? `${C.p400}18` : isHov ? "rgba(255,255,255,0.03)" : "transparent",
              border: isActive ? `1px solid ${C.p400}33` : "1px solid transparent",
              cursor: "pointer", transition: "all 0.18s",
              color: isActive ? C.p200 : isHov ? "#9CA3AF" : "#4A4868",
              fontSize: "0.88rem", fontWeight: isActive ? 600 : 400,
            }}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </div>
        );
      })}

      <div style={{ marginTop: "auto" }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "1rem" }} />
        <div style={{
          padding: "0.65rem 0.8rem", marginBottom: "0.5rem",
          fontSize: "0.78rem", color: "#4A4868",
          borderRadius: 8, background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ color: "#7C7A99", fontWeight: 500, marginBottom: 2 }}>Admin</div>
          <div style={{ fontSize: "0.72rem" }}>ROLE_ADMIN</div>
        </div>
        <div
          onClick={() => { localStorage.clear(); navigate("/login"); }}
          onMouseEnter={e => e.currentTarget.style.color = "#F0997B"}
          onMouseLeave={e => e.currentTarget.style.color = "#4A4868"}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "0.65rem 0.8rem", borderRadius: 8,
            cursor: "pointer", color: "#4A4868", fontSize: "0.88rem",
            transition: "color 0.2s",
          }}
        >
          <span style={{ fontSize: 15 }}>🚪</span> Logout
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [recentSensors, setRecentSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setPulse(v => !v), 1200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/admin/sensors`, { headers: authHeaders() });
        const data = await res.json();
        setStats({
          total:    data.length,
          active:   data.filter(s => s.etat?.toUpperCase() === "ACTIF").length,
          inactive: data.filter(s => s.etat?.toUpperCase() !== "ACTIF").length,
        });
        setRecentSensors(data.slice(-5).reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Locations", value: stats.total,    color: C.p400,  icon: "📡" },
    { label: "Active",          value: stats.active,   color: C.t400,  icon: "✅" },
    { label: "Inactive",        value: stats.inactive, color: C.coral, icon: "⚠️" },
  ];

  const quickActions = [
    { label: "Manage Locations",  desc: "Add, edit or remove sensor locations",       icon: "📡", color: C.p400,  path: "/admin/locations"  },
    { label: "Traffic Data",      desc: "Browse and filter traffic records",           icon: "📊", color: C.amber, path: "/admin/traffic"    },
    { label: "Congestion Zones",  desc: "View and analyze congestion alerts",          icon: "🧠", color: C.coral, path: "/admin/congestion" },
    { label: "Statistics",        desc: "Global analytics and trend reports",          icon: "📈", color: C.t400,  path: "/admin/statistics" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, color: "#f0f0f0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:#7F77DD44;color:#fff;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#534AB755;border-radius:4px;}
      `}</style>

      <GlowOrb x="15%"  y="20%" color={C.p600} size={500} opacity={0.13} />
      <GlowOrb x="85%"  y="70%" color={C.p400} size={400} opacity={0.1}  />
      <GlowOrb x="50%"  y="50%" color={C.t400} size={350} opacity={0.07} />

      <Sidebar active="Dashboard" />

      {/* ── MAIN ── */}
      <div style={{ marginLeft: 220, padding: "2.5rem", position: "relative", zIndex: 1 }}>

        {/* TOP BAR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.7rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                Admin Dashboard
              </h1>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: `${C.t400}18`, border: `1px solid ${C.t400}40`,
                borderRadius: 100, padding: "0.2rem 0.7rem",
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: C.t400,
                  transform: `scale(${pulse ? 1 : 0.65})`, transition: "transform 0.5s ease",
                  boxShadow: `0 0 5px ${C.t400}`,
                }} />
                <span style={{ fontSize: "0.7rem", color: C.t200, fontWeight: 600, letterSpacing: "0.06em" }}>LIVE</span>
              </div>
            </div>
            <p style={{ color: "#4A4868", fontSize: "0.88rem", fontWeight: 300 }}>
              Welcome back — here's your city traffic overview.
            </p>
          </div>

          <div style={{ fontSize: "0.8rem", color: "#4A4868", textAlign: "right" }}>
            <div style={{ color: "#7C7A99", fontWeight: 500 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16, marginBottom: "2.5rem" }}>
          {statCards.map(card => (
            <div key={card.label} style={{
              background: C.bg2,
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: `2px solid ${card.color}`,
              borderRadius: 14, padding: "1.4rem 1.6rem",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", right: 16, top: 16,
                fontSize: 22, opacity: 0.25,
              }}>{card.icon}</div>
              <div style={{ fontSize: "0.72rem", color: "#4A4868", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10 }}>
                {card.label}
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "2.2rem", fontWeight: 800, color: card.color, lineHeight: 1 }}>
                {loading ? "—" : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>
            Quick Access
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
            {quickActions.map(action => (
              <QuickCard key={action.label} {...action} onClick={() => navigate(action.path)} />
            ))}
          </div>
        </div>

        {/* RECENT LOCATIONS */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
              Recent Locations
            </h2>
            <button
              onClick={() => navigate("/admin/locations")}
              style={{
                background: "transparent", border: `1px solid ${C.p400}44`,
                color: C.p200, borderRadius: 8,
                padding: "0.38rem 0.9rem", fontSize: "0.78rem",
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { e.target.style.background = `${C.p400}18`; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; }}
            >View all →</button>
          </div>

          <div style={{
            background: C.bg2, border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, overflow: "hidden",
          }}>
            {/* HEAD */}
            <div style={{
              display: "grid", gridTemplateColumns: "60px 1fr 1fr 120px",
              padding: "0.75rem 1.4rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.7rem", color: "#4A4868",
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
            }}>
              <span>ID</span><span>Name</span><span>Zone</span><span>Status</span>
            </div>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#4A4868", fontSize: "0.85rem" }}>Loading...</div>
            ) : recentSensors.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#4A4868", fontSize: "0.85rem" }}>No locations yet</div>
            ) : (
              recentSensors.map((s, i) => {
                const active = s.etat?.toUpperCase() === "ACTIF";
                return (
                  <div key={s.id} style={{
                    display: "grid", gridTemplateColumns: "60px 1fr 1fr 120px",
                    padding: "0.9rem 1.4rem",
                    borderBottom: i === recentSensors.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: "0.8rem", color: "#4A4868", fontWeight: 600 }}>#{s.id}</span>
                    <span style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: "0.85rem", color: "#7C7A99" }}>{s.zone}</span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: active ? `${C.t400}18` : `${C.coral}18`,
                      border: `1px solid ${active ? C.t400 : C.coral}44`,
                      color: active ? C.t200 : "#F0997B",
                      fontSize: "0.7rem", fontWeight: 600,
                      padding: "0.2rem 0.65rem", borderRadius: 100,
                      width: "fit-content",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? C.t400 : C.coral, display: "inline-block" }} />
                      {active ? "ACTIF" : "INACTIF"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ label, desc, icon, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.bg3 : C.bg2,
        border: `1px solid ${hov ? color + "44" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, padding: "1.4rem 1.6rem",
        cursor: "pointer", transition: "all 0.22s",
        transform: hov ? "translateY(-3px)" : "none",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", gap: "1.2rem",
      }}
    >
      {hov && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />}
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: color + "18", border: `1px solid ${color}35`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
      }}>{icon}</div>
      <div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: "0.8rem", color: "#4A4868", fontWeight: 300, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div style={{ marginLeft: "auto", color: hov ? color : "#4A4868", fontSize: "1.1rem", transition: "color 0.2s" }}>›</div>
    </div>
  );
}
