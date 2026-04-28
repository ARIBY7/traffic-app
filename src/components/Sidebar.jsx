import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

const NAV_ITEMS = [
  { label: "Dashboard",    icon: "▣",  path: "/admin" },
  { label: "Sensors",      icon: "◎",  path: "/admin/locations" },
  { label: "Traffic Data", icon: "▦",  path: "/admin/traffic" },
  { label: "Congestion",   icon: "◈",  path: "/admin/congestion" },
  { label: "Manage Users", icon: "👤", path: "/admin/users" },
  { label: "Signals",      icon: "🚦", path: "/admin/signals" },
  { label: "Statistics",   icon: "▤",  path: "/admin/statistics" },
];

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.bg.card,
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 16, padding: "2rem",
          width: "100%", maxWidth: 400,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👋</div>
        <h3 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.1rem", fontWeight: 700,
          color: COLORS.text.primary, marginBottom: "0.75rem",
        }}>
          Confirm Logout
        </h3>
        <p style={{ color: "#9CA3AF", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          Êtes-vous sûr de vouloir vous déconnecter ?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#7C7A99", borderRadius: 8,
              padding: "0.68rem 1.4rem", fontSize: "0.88rem",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`,
              color: COLORS.text.primary, border: "none",
              borderRadius: 8, padding: "0.68rem 1.4rem",
              fontSize: "0.88rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: COLORS.bg.card,
        borderRight: "1px solid rgba(127, 119, 221, 0.1)",
        display: "flex", flexDirection: "column",
        zIndex: 50, padding: "1.5rem 1rem",
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: "2.5rem" }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.primary.light}, ${COLORS.primary.dark})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>🚦</div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: "1rem",
            color: COLORS.text.primary,
          }}>TrafficIQ</span>
        </div>

        {/* Label Navigation */}
        <div style={{
          fontSize: "0.65rem", color: COLORS.text.subtle,
          letterSpacing: "0.12em", textTransform: "uppercase",
          fontWeight: 700, marginBottom: "0.75rem", paddingLeft: 8,
        }}>
          Navigation
        </div>

        {/* Nav Items */}
        {NAV_ITEMS.map((item) => {
          // active si le path correspond exactement ou commence par le path de l'item
          const active = item.path === "/admin"
            ? location.pathname === "/admin"
            : location.pathname.startsWith(item.path);

          return (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.6rem 0.8rem", borderRadius: 10, marginBottom: 3,
                background: active ? `${COLORS.primary.light}1A` : "transparent",
                border: active ? `1px solid ${COLORS.primary.light}30` : "1px solid transparent",
                cursor: "pointer", transition: "all 0.15s",
                color: active ? COLORS.primary.light : COLORS.text.muted,
                fontSize: "0.875rem", fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = COLORS.bg.hover;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
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

        {/* Logout */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ height: 1, background: "rgba(127, 119, 221, 0.1)", margin: "0.75rem 0" }} />
          <div
            onClick={() => setShowLogout(true)}
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

      {/* Logout Confirmation Modal */}
      {showLogout && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  );
}
