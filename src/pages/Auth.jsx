import { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  p200: "#AFA9EC",
  p400: "#7F77DD",
  p600: "#534AB7",
  p900: "#26215C",
  t400: "#1D9E75",
  t300: "#25B88A",
  t200: "#5DCAA5",
  coral: "#D85A30",
  amber: "#EF9F27",
  bg:   "#09080F",
  bg2:  "#110F1E",
  bg3:  "#1A1730",
};

function GlowOrb({ x, y, color, size = 400, opacity = 0.18 }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: size, height: size, borderRadius: "50%",
      background: color, opacity,
      filter: "blur(90px)",
      pointerEvents: "none", zIndex: 0,
      transform: "translate(-50%,-50%)",
    }} />
  );
}

function StyledInput({ type, name, placeholder, value, onChange, required = true }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      required={required}
      style={{
        width: "100%",
        background: focused ? C.bg3 : "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? C.p400 + "99" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 8,
        padding: "0.78rem 1rem",
        fontSize: "0.9rem",
        color: "#f0f0f0",
        outline: "none",
        transition: "all 0.2s",
        fontFamily: "inherit",
        boxShadow: focused ? `0 0 0 3px ${C.p400}22` : "none",
      }}
    />
  );
}

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ mail: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", mail: "", passWord: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("http://localhost:8081/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.text();
      if (!res.ok || data.startsWith("ERROR")) {
        setError("Email ou mot de passe incorrect"); return;
      }
      localStorage.setItem("token", data);
      const payload = JSON.parse(atob(data.split(".")[1]));
      localStorage.setItem("role", payload.role);
      navigate(payload.role === "ROLE_ADMIN" ? "/admin" : "/user");
    } catch { setError("Erreur serveur"); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("http://localhost:8081/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      if (!res.ok) { setError("Erreur lors de l'inscription"); return; }
      setSuccess("Compte créé ! Connectez-vous.");
      setMode("login");
    } catch { setError("Erreur serveur"); }
    finally { setLoading(false); }
  };

  const isReg = mode === "register";

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: C.bg,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:#4A4868;}
        ::selection{background:#7F77DD44;color:#fff;}
      `}</style>

      {/* GLOW ORBS — same as Home */}
      <GlowOrb x="15%"  y="25%"  color={C.p600} size={500} opacity={0.2}  />
      <GlowOrb x="85%"  y="75%"  color={C.p400} size={400} opacity={0.15} />
      <GlowOrb x="50%"  y="55%"  color={C.t400} size={300} opacity={0.08} />

      {/* LOGO */}
      <div
        onClick={() => navigate("/")}
        style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", gap: 10,
          fontFamily: "'Syne',sans-serif", fontWeight: 800,
          fontSize: "1.3rem", color: "#fff",
          cursor: "pointer", marginBottom: "2rem",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>🚦</div>
        TrafficIQ
      </div>

      {/* CARD */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 420,
        background: C.bg2,
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.p600}22`,
      }}>

        {/* TABS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {[["login", "Sign In"], ["register", "Sign Up"]].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => { setMode(tab); setError(""); setSuccess(""); }}
              style={{
                background: mode === tab
                  ? `linear-gradient(135deg, ${C.p400}, ${C.p600})`
                  : "transparent",
                color: mode === tab ? "#fff" : "#4A4868",
                border: "none",
                padding: "1rem",
                fontSize: "0.9rem",
                fontWeight: mode === tab ? 700 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                letterSpacing: "0.03em",
              }}
            >{label}</button>
          ))}
        </div>

        {/* BODY */}
        <div style={{ padding: "2rem" }}>

          <h2 style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: "1.4rem", fontWeight: 800,
            color: "#fff", textAlign: "center",
            marginBottom: "0.4rem",
          }}>
            {isReg ? "Create your account" : "Welcome back"}
          </h2>
          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#4A4868", marginBottom: "1.6rem", fontWeight: 300 }}>
            {isReg ? "Join TrafficIQ and start monitoring your city" : "Sign in to access your traffic dashboard"}
          </p>

          {/* ERROR */}
          {error && (
            <div style={{
              background: "rgba(216,90,48,0.1)", border: "1px solid rgba(216,90,48,0.3)",
              borderRadius: 8, padding: "0.6rem 1rem",
              fontSize: "0.82rem", color: "#F0997B",
              marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: 8,
            }}>⚠ {error}</div>
          )}

          {/* SUCCESS */}
          {success && (
            <div style={{
              background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.3)",
              borderRadius: 8, padding: "0.6rem 1rem",
              fontSize: "0.82rem", color: C.t200,
              marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: 8,
            }}>✓ {success}</div>
          )}

          {/* REGISTER FORM */}
          {isReg && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <StyledInput
                type="text" name="name" placeholder="Full name"
                value={regForm.name}
                onChange={e => setRegForm({ ...regForm, name: e.target.value })}
              />
              <StyledInput
                type="email" name="mail" placeholder="Email address"
                value={regForm.mail}
                onChange={e => setRegForm({ ...regForm, mail: e.target.value })}
              />
              <StyledInput
                type="password" name="passWord" placeholder="Password"
                value={regForm.passWord}
                onChange={e => setRegForm({ ...regForm, passWord: e.target.value })}
              />
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? `${C.p400}66` : `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
                  color: "#fff", border: "none",
                  padding: "0.88rem", borderRadius: 8,
                  fontSize: "0.92rem", fontWeight: 700,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "all 0.2s", marginTop: 4,
                }}
              >{loading ? "Creating..." : "Create Account"}</button>
            </form>
          )}

          {/* LOGIN FORM */}
          {!isReg && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <StyledInput
                type="email" name="mail" placeholder="Email address"
                value={loginForm.mail}
                onChange={e => setLoginForm({ ...loginForm, mail: e.target.value })}
              />
              <StyledInput
                type="password" name="password" placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? `${C.p400}66` : `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
                  color: "#fff", border: "none",
                  padding: "0.88rem", borderRadius: 8,
                  fontSize: "0.92rem", fontWeight: 700,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "all 0.2s", marginTop: 4,
                }}
              >{loading ? "Signing in..." : "Sign In"}</button>
            </form>
          )}

          {/* SWITCH */}
          <p style={{ textAlign: "center", marginTop: "1.4rem", fontSize: "0.82rem", color: "#4A4868" }}>
            {isReg ? "Already have an account? " : "Don't have an account? "}
            <span
              onClick={() => { setMode(isReg ? "login" : "register"); setError(""); setSuccess(""); }}
              style={{ color: C.p200, fontWeight: 600, cursor: "pointer" }}
            >{isReg ? "Sign In" : "Sign Up"}</span>
          </p>
        </div>
      </div>

      {/* BACK */}
      <p style={{ position: "relative", zIndex: 1, marginTop: "1.5rem", fontSize: "0.8rem" }}>
        <span
          onClick={() => navigate("/")}
          style={{ color: "#4A4868", cursor: "pointer", transition: "color 0.2s" }}
          onMouseEnter={e => e.target.style.color = C.p200}
          onMouseLeave={e => e.target.style.color = "#4A4868"}
        >← Back to TrafficIQ</span>
      </p>
    </div>
  );
}
