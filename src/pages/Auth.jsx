import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  p200: "#AFA9EC", p400: "#7F77DD", p600: "#534AB7", p900: "#26215C",
  t400: "#1D9E75", t300: "#25B88A", t200: "#5DCAA5",
  coral: "#D85A30", amber: "#EF9F27",
  bg: "#09080F", bg2: "#110F1E", bg3: "#1A1730",
};

function GlowOrb({ x, y, color, size = 400, opacity = 0.18 }) {
  return (
    <div style={{ position:"absolute", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(90px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />
  );
}

function StyledInput({ type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ width:"100%", background:focused?C.bg3:"rgba(255,255,255,0.04)", border:`1px solid ${focused?C.p400+"99":"rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"0.78rem 1rem", fontSize:"0.9rem", color:"#f0f0f0", outline:"none", transition:"all 0.2s", fontFamily:"inherit", boxShadow:focused?`0 0 0 3px ${C.p400}22`:"none" }}
    />
  );
}

// ── Password checker — mirrors backend validatePassword ────
function checkPassword(pwd) {
  const rules = [
    { id:"len",     label:"At least 8 characters",        ok: pwd.length >= 8 },
    { id:"upper",   label:"One uppercase letter",          ok: /[A-Z]/.test(pwd) },
    { id:"lower",   label:"One lowercase letter",          ok: /[a-z]/.test(pwd) },
    { id:"digit",   label:"One digit",                    ok: /[0-9]/.test(pwd) },
    { id:"special", label:"One special char (@#$%^&+=!)", ok: /[@#$%^&+=!]/.test(pwd) },
  ];
  const score = rules.filter(r => r.ok).length;
  return { rules, score, valid: score === 5 };
}

// ── Parse backend error messages into English UI text ──────
function parseBackendError(raw) {
  if (!raw) return "An unknown error occurred.";
  const msg = raw.startsWith("ERROR:") ? raw.slice(6).trim() : raw.trim();

  // Register errors
  if (msg.includes("Email already exists"))         return "This email address is already in use.";
  if (msg.includes("Username already exists"))      return "This username is already taken.";
  if (msg.includes("at least 8 characters"))       return "Password must be at least 8 characters long.";
  if (msg.includes("uppercase"))                   return "Password must contain at least one uppercase letter.";
  if (msg.includes("lowercase"))                   return "Password must contain at least one lowercase letter.";
  if (msg.includes("digit"))                       return "Password must contain at least one digit.";
  if (msg.includes("special character"))           return "Password must contain at least one special character (@#$%^&+=!).";

  // Login errors
  if (msg.includes("vérifier votre boîte mail"))   return "Please verify your email before signing in. Check your inbox (and spam folder).";
  if (msg.includes("désactivé"))                  return "Your account has been disabled. Please contact the administrator.";
  if (msg.includes("Identifiants invalides"))      return "Invalid email or password.";
  if (msg.includes("Compte bloqué"))              return "Account locked due to too many failed attempts. Please try again later.";
  if (msg.includes("non trouvé"))                 return "No account found with this email address.";

  return msg;
}

export default function Auth() {
  const [mode, setMode]       = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ mail:"", password:"" });
  const [regForm,   setRegForm]   = useState({ name:"", username:"", mail:"", passWord:"" });

  const pwdStrength = useMemo(() => checkPassword(regForm.passWord), [regForm.passWord]);

  const strengthColor = ["#3A3660","#D85A30","#EF9F27","#EF9F27","#1D9E75","#1D9E75"][pwdStrength.score];
  const strengthLabel = ["","Very weak","Weak","Fair","Strong","Excellent"][pwdStrength.score];

  const reset = (m) => { setMode(m); setError(""); setSuccess(""); setShowPwd(false); };

  // ── SIGN IN ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.mail)     { setError("Please enter your email address."); return; }
    if (!loginForm.password) { setError("Please enter your password."); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      const res  = await fetch("http://localhost:8081/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.text();

      if (!res.ok || data.startsWith("ERROR")) {
        setError(parseBackendError(data));
        return;
      }

      // ✅ Success — store JWT and redirect
      localStorage.setItem("token", data);
      const payload = JSON.parse(atob(data.split(".")[1]));
      localStorage.setItem("role", payload.role);
      navigate(payload.role === "ROLE_ADMIN" ? "/admin" : "/user");

    } catch { setError("Could not reach the server. Make sure the backend is running."); }
    finally  { setLoading(false); }
  };

  // ── SIGN UP ────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!regForm.name)     { setError("Full name is required."); return; }
    if (!regForm.username) { setError("Username is required."); return; }
    if (!regForm.mail)     { setError("Email address is required."); return; }
    if (!regForm.passWord) { setError("Password is required."); return; }
    if (!pwdStrength.valid){ setError("Password does not meet all security requirements."); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      const res  = await fetch("http://localhost:8081/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await res.text();

      if (!res.ok || data.startsWith("ERROR")) {
        setError(parseBackendError(data));
        return;
      }

      // ✅ Registration successful
      if (data.includes("e-mail de vérification n'a pas pu être envoyé")) {
        setSuccess("Account created! The verification email could not be sent (SMTP issue). Try signing in directly.");
      } else {
        setSuccess("Account created successfully! Check your inbox and click the verification link before signing in.");
      }
      setMode("login");
      setRegForm({ name:"", username:"", mail:"", passWord:"" });

    } catch { setError("Could not reach the server. Make sure the backend is running."); }
    finally  { setLoading(false); }
  };

  const isReg = mode === "register";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        input::placeholder { color:#4A4868; }
        ::selection { background:#7F77DD44; color:#fff; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        .shake { animation:shake 0.35s ease; }
      `}</style>

      <GlowOrb x="15%"  y="25%"  color={C.p600} size={500} opacity={0.2}  />
      <GlowOrb x="85%"  y="75%"  color={C.p400} size={400} opacity={0.15} />
      <GlowOrb x="50%"  y="55%"  color={C.t400} size={300} opacity={0.08} />

      {/* Logo */}
      <div onClick={() => navigate("/")} style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:10, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.3rem", color:"#fff", cursor:"pointer", marginBottom:"2rem" }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p400},${C.p600})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🚦</div>
        TrafficIQ
      </div>

      {/* Card */}
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:440, background:C.bg2, border:"1px solid rgba(255,255,255,0.07)", borderRadius:20, overflow:"hidden", boxShadow:`0 24px 80px rgba(0,0,0,0.5),0 0 0 1px ${C.p600}22` }}>

        {/* Tabs */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          {[["login","Sign In"],["register","Sign Up"]].map(([tab, label]) => (
            <button key={tab} onClick={() => reset(tab)} style={{ background:mode===tab?`linear-gradient(135deg,${C.p400},${C.p600})`:"transparent", color:mode===tab?"#fff":"#4A4868", border:"none", padding:"1rem", fontSize:"0.9rem", fontWeight:mode===tab?700:400, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding:"2rem" }}>

          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#fff", textAlign:"center", marginBottom:"0.4rem" }}>
            {isReg ? "Create your account" : "Welcome back"}
          </h2>
          <p style={{ textAlign:"center", fontSize:"0.82rem", color:"#4A4868", marginBottom:"1.6rem", fontWeight:300 }}>
            {isReg ? "Join TrafficIQ — real-time traffic monitoring for Casablanca" : "Sign in to access your traffic dashboard"}
          </p>

          {/* Error */}
          {error && (
            <div className="shake" style={{ background:"rgba(216,90,48,0.1)", border:"1px solid rgba(216,90,48,0.35)", borderRadius:8, padding:"0.65rem 1rem", fontSize:"0.83rem", color:"#F0997B", marginBottom:"1.2rem", lineHeight:1.6, display:"flex", gap:8 }}>
              <span style={{ flexShrink:0 }}>⚠</span> {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ background:"rgba(29,158,117,0.1)", border:"1px solid rgba(29,158,117,0.35)", borderRadius:8, padding:"0.65rem 1rem", fontSize:"0.83rem", color:C.t200, marginBottom:"1.2rem", lineHeight:1.6, display:"flex", gap:8 }}>
              <span style={{ flexShrink:0 }}>✓</span> {success}
            </div>
          )}

          {/* ══════════ SIGN UP FORM ══════════ */}
          {isReg && (
            <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:12 }}>

              <div>
                <label style={{ fontSize:"0.72rem", color:"#7C7A99", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Full Name</label>
                <StyledInput type="text" placeholder="e.g. Ahmed Bennali" value={regForm.name} onChange={e => setRegForm({...regForm, name:e.target.value})} />
              </div>

              <div>
                <label style={{ fontSize:"0.72rem", color:"#7C7A99", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Username</label>
                <StyledInput type="text" placeholder="e.g. ahmed.b" value={regForm.username} onChange={e => setRegForm({...regForm, username:e.target.value})} />
              </div>

              <div>
                <label style={{ fontSize:"0.72rem", color:"#7C7A99", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Email Address</label>
                <StyledInput type="email" placeholder="you@example.com" value={regForm.mail} onChange={e => setRegForm({...regForm, mail:e.target.value})} />
              </div>

              <div>
                <label style={{ fontSize:"0.72rem", color:"#7C7A99", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Password</label>
                <div style={{ position:"relative" }}>
                  <StyledInput type={showPwd?"text":"password"} placeholder="Min. 8 characters" value={regForm.passWord} onChange={e => setRegForm({...regForm, passWord:e.target.value})} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#4A4868", cursor:"pointer", fontSize:15 }}>
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {regForm.passWord.length > 0 && (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"0.85rem 1rem" }}>
                  {/* Strength bar */}
                  <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ flex:1, height:4, borderRadius:100, background:i<=pwdStrength.score?strengthColor:"rgba(255,255,255,0.07)", transition:"background 0.3s" }} />
                    ))}
                  </div>
                  <div style={{ fontSize:"0.7rem", color:strengthColor, fontWeight:700, marginBottom:10, letterSpacing:"0.06em" }}>
                    Strength: {strengthLabel}
                  </div>
                  {/* Rules checklist */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 8px" }}>
                    {pwdStrength.rules.map(r => (
                      <div key={r.id} style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.72rem", color:r.ok?C.t200:"#4A4268", transition:"color 0.2s" }}>
                        <span style={{ fontSize:10, fontWeight:700 }}>{r.ok ? "✓" : "○"}</span> {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width:"100%", background:loading?`${C.p400}66`:`linear-gradient(135deg,${C.p400},${C.p600})`, color:"#fff", border:"none", padding:"0.88rem", borderRadius:8, fontSize:"0.92rem", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.2s", marginTop:4 }}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* ══════════ SIGN IN FORM ══════════ */}
          {!isReg && (
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:12 }}>

              <div>
                <label style={{ fontSize:"0.72rem", color:"#7C7A99", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Email Address</label>
                <StyledInput type="email" placeholder="you@example.com" value={loginForm.mail} onChange={e => setLoginForm({...loginForm, mail:e.target.value})} />
              </div>

              <div>
                <label style={{ fontSize:"0.72rem", color:"#7C7A99", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Password</label>
                <div style={{ position:"relative" }}>
                  <StyledInput type={showPwd?"text":"password"} placeholder="Your password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password:e.target.value})} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#4A4868", cursor:"pointer", fontSize:15 }}>
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Email verification reminder */}
              <div style={{ background:"rgba(127,119,221,0.08)", border:"1px solid rgba(127,119,221,0.2)", borderRadius:8, padding:"0.55rem 0.85rem", fontSize:"0.76rem", color:"#7C7A99", display:"flex", gap:7, alignItems:"flex-start" }}>
                <span style={{ flexShrink:0 }}>📧</span>
                <span>A verification email is required before your first sign-in. Check your spam folder if you don't see it.</span>
              </div>

              <button type="submit" disabled={loading} style={{ width:"100%", background:loading?`${C.p400}66`:`linear-gradient(135deg,${C.p400},${C.p600})`, color:"#fff", border:"none", padding:"0.88rem", borderRadius:8, fontSize:"0.92rem", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.2s", marginTop:4 }}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Switch mode */}
          <p style={{ textAlign:"center", marginTop:"1.4rem", fontSize:"0.82rem", color:"#4A4868" }}>
            {isReg ? "Already have an account? " : "Don't have an account? "}
            <span onClick={() => reset(isReg?"login":"register")} style={{ color:C.p200, fontWeight:600, cursor:"pointer" }}>
              {isReg ? "Sign In" : "Sign Up"}
            </span>
          </p>
        </div>
      </div>

      {/* Back */}
      <p style={{ position:"relative", zIndex:1, marginTop:"1.5rem", fontSize:"0.8rem" }}>
        <span onClick={() => navigate("/")} style={{ color:"#4A4868", cursor:"pointer", transition:"color 0.2s" }}
          onMouseEnter={e=>e.target.style.color=C.p200} onMouseLeave={e=>e.target.style.color="#4A4868"}>
          ← Back to TrafficIQ
        </span>
      </p>
    </div>
  );
}