import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

const API = "http://localhost:8081";

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
      position: "fixed",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      opacity,
      filter: "blur(110px)",
      pointerEvents: "none",
      zIndex: 0,
      transform: "translate(-50%, -50%)",
    }} />
  );
}

function Sidebar({ navigate, path }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 220,
        background: COLORS.bg.card,
        borderRight: "1px solid rgba(127, 119, 221, 0.1)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        padding: "1.5rem 1rem",
      }}
    >
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          marginBottom: "2.5rem",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          🚦
        </div>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1rem",
            color: COLORS.text.primary,
          }}
        >
          TrafficIQ
        </span>
      </div>

      <div
        style={{
          fontSize: "0.65rem",
          color: COLORS.text.subtle,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: "0.75rem",
          paddingLeft: 8,
        }}
      >
        Navigation
      </div>

      {[
        { label: "Dashboard", icon: "▣", p: "/admin", active: true },
        { label: "Sensors", icon: "◎", p: "/admin/locations" },
        { label: "Traffic Data", icon: "▦", p: "/admin/traffic" },
        { label: "Congestion", icon: "◈", p: "/admin/congestion" },
        { label: "Manage Users", icon: "👤", p: "/admin/users" },
        { label: "Signals", icon: "🚦", p: "/admin/signals" },
        { label: "Statistics", icon: "▤", p: "/admin/statistics" },
      ].map((item) => {
        const active = item.active;
        return (
          <div
            key={item.label}
            onClick={() => navigate(item.p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0.6rem 0.8rem",
              borderRadius: 10,
              marginBottom: 3,
              background: active ? `${COLORS.primary.light}1A` : "transparent",
              border: active
                ? `1px solid ${COLORS.primary.light}30`
                : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              color: active ? COLORS.primary.light : COLORS.text.muted,
              fontSize: "0.875rem",
              fontWeight: active ? 600 : 400,
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
            {active && (
              <div
                style={{
                  marginLeft: "auto",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: COLORS.primary.light,
                }}
              />
            )}
          </div>
        );
      })}

      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            height: 1,
            background: "rgba(127, 119, 221, 0.1)",
            margin: "0.75rem 0",
          }}
        />
        <div
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F0997B")}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.text.muted)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0.6rem 0.8rem",
            borderRadius: 10,
            cursor: "pointer",
            color: COLORS.text.muted,
            fontSize: "0.875rem",
            transition: "color 0.15s",
          }}
        >
          <span style={{ fontSize: 14 }}>⎋</span> Logout
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div
      style={{
        background: COLORS.bg.card,
        border: "1px solid rgba(127, 119, 221, 0.1)",
        borderTop: `2px solid ${color}`,
        borderRadius: 12,
        padding: "1.1rem 1.3rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.7rem",
          fontWeight: 800,
          color: color,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.68rem",
          color: COLORS.text.muted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
        }}
      >
        {label}
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
        background: hov ? COLORS.bg.hover : COLORS.bg.card,
        border: `1px solid ${hov ? color + "44" : "rgba(127, 119, 221, 0.1)"}`,
        borderRadius: 14,
        padding: "1.4rem 1.6rem",
        cursor: "pointer",
        transition: "all 0.22s",
        transform: hov ? "translateY(-3px)" : "none",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "1.2rem",
      }}
    >
      {hov && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />
      )}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          flexShrink: 0,
          background: color + "18",
          border: `1px solid ${color}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: COLORS.text.primary,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: COLORS.text.muted,
            fontWeight: 300,
            lineHeight: 1.5,
          }}
        >
          {desc}
        </div>
      </div>
      <div
        style={{
          marginLeft: "auto",
          color: hov ? color : COLORS.text.muted,
          fontSize: "1.1rem",
          transition: "color 0.2s",
        }}
      >
        ›
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const path = window.location.pathname;

  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [recentSensors, setRecentSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setPulse((v) => !v), 1200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/admin/sensors`, {
          headers: getHeaders(),
        });
        const data = await res.json();
        setStats({
          total: data.length,
          active: data.filter((s) => s.etat?.toUpperCase() === "ACTIF").length,
          inactive: data.filter((s) => s.etat?.toUpperCase() !== "ACTIF").length,
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
    {
      label: "Total Sensors",
      value: stats.total,
      color: COLORS.primary.light,
      icon: "📡",
    },
    {
      label: "Active",
      value: stats.active,
      color: COLORS.accent.teal,
      icon: "✅",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      color: COLORS.accent.coral,
      icon: "⚠️",
    },
  ];

  const quickActions = [
    {
      label: "Sensors",
      desc: "Add, edit or remove traffic sensors",
      icon: "◎",
      color: COLORS.primary.light,
      path: "/admin/locations",
    },
    {
      label: "Traffic Data",
      desc: "Browse and filter traffic records",
      icon: "▦",
      color: COLORS.accent.amber,
      path: "/admin/traffic",
    },
    {
      label: "Congestion",
      desc: "View and analyze congestion alerts",
      icon: "◈",
      color: COLORS.accent.coral,
      path: "/admin/congestion",
    },
    {
      label: "Manage Users",
      desc: "Create, edit or manage user accounts",
      icon: "👤",
      color: COLORS.primary.light,
      path: "/admin/users",
    },
    {
      label: "Traffic Signals",
      desc: "Control traffic lights and signs",
      icon: "🚦",
      color: COLORS.accent.teal,
      path: "/admin/signals",
    },
  ];

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: COLORS.bg.main,
        color: COLORS.text.primary,
        minHeight: "100vh",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(127, 119, 221, 0.3); color: #fff; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(127, 119, 221, 0.3); border-radius: 4px; }
      `}</style>

      <GlowOrb
        x="15%"
        y="20%"
        color={COLORS.primary.dark}
        size={500}
        opacity={0.1}
      />
      <GlowOrb
        x="85%"
        y="70%"
        color={COLORS.primary.light}
        size={400}
        opacity={0.08}
      />
      <GlowOrb
        x="50%"
        y="50%"
        color={COLORS.accent.teal}
        size={350}
        opacity={0.07}
      />

      <Sidebar navigate={navigate} path={path} />

      <div
        style={{
          marginLeft: 220,
          padding: "2.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.7rem",
                  fontWeight: 800,
                  color: COLORS.text.primary,
                  letterSpacing: "-0.5px",
                }}
              >
                Admin Dashboard
              </h1>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: `${COLORS.accent.teal}18`,
                  border: `1px solid ${COLORS.accent.teal}40`,
                  borderRadius: 100,
                  padding: "0.2rem 0.7rem",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: COLORS.accent.teal,
                    transform: `scale(${pulse ? 1 : 0.65})`,
                    transition: "transform 0.5s ease",
                    boxShadow: `0 0 5px ${COLORS.accent.teal}`,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: COLORS.accent.teal,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                  }}
                >
                  LIVE
                </span>
              </div>
            </div>
            <p
              style={{
                color: COLORS.text.muted,
                fontSize: "0.88rem",
                fontWeight: 300,
              }}
            >
              Welcome back — here's your city traffic overview.
            </p>
          </div>

          <div style={{ fontSize: "0.8rem", color: COLORS.text.muted, textAlign: "right" }}>
            <div style={{ color: COLORS.text.subtle, fontWeight: 500 }}>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginBottom: "2.5rem",
          }}
        >
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={loading ? "—" : card.value}
              color={card.color}
              icon={card.icon}
            />
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: COLORS.text.primary,
              marginBottom: "1rem",
            }}
          >
            Quick Access
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {quickActions.map((action) => (
              <QuickCard
                key={action.label}
                {...action}
                onClick={() => navigate(action.path)}
              />
            ))}
          </div>
        </div>

        {/* RECENT SENSORS */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: COLORS.text.primary,
              }}
            >
              Recent Sensors
            </h2>
            <button
              onClick={() => navigate("/admin/locations")}
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.primary.light}44`,
                color: COLORS.primary.light,
                borderRadius: 8,
                padding: "0.38rem 0.9rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = `${COLORS.primary.light}18`;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
              }}
            >
              View all →
            </button>
          </div>

          <div
            style={{
              background: COLORS.bg.card,
              border: "1px solid rgba(127, 119, 221, 0.1)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* HEAD */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 1fr 120px",
                padding: "0.75rem 1.4rem",
                borderBottom: "1px solid rgba(127, 119, 221, 0.06)",
                fontSize: "0.7rem",
                color: COLORS.text.subtle,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              <span>ID</span>
              <span>Name</span>
              <span>Zone</span>
              <span>Status</span>
            </div>

            {loading ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: COLORS.text.muted,
                  fontSize: "0.85rem",
                }}
              >
                Loading...
              </div>
            ) : recentSensors.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: COLORS.text.muted,
                  fontSize: "0.85rem",
                }}
              >
                No sensors yet
              </div>
            ) : (
              recentSensors.map((s, i) => {
                const active = s.etat?.toUpperCase() === "ACTIF";
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 1fr 120px",
                      padding: "0.9rem 1.4rem",
                      borderBottom:
                        i === recentSensors.length - 1
                          ? "none"
                          : "1px solid rgba(127, 119, 221, 0.06)",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: COLORS.text.subtle,
                        fontWeight: 600,
                      }}
                    >
                      #{s.id}
                    </span>
                    <span
                      style={{
                        fontSize: "0.88rem",
                        color: COLORS.text.primary,
                        fontWeight: 500,
                      }}
                    >
                      {s.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: COLORS.text.muted,
                      }}
                    >
                      {s.zone}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: active
                          ? `${COLORS.accent.teal}18`
                          : `${COLORS.accent.coral}18`,
                        border: `1px solid ${
                          active ? COLORS.accent.teal : COLORS.accent.coral
                        }44`,
                        color: active ? COLORS.accent.teal : "#F0997B",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.65rem",
                        borderRadius: 100,
                        width: "fit-content",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: active
                            ? COLORS.accent.teal
                            : COLORS.accent.coral,
                          display: "inline-block",
                        }}
                      />
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