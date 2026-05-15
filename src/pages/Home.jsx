import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  p200: "#AFA9EC", p400: "#7F77DD", p600: "#534AB7", p900: "#26215C",
  t400: "#1D9E75", t200: "#5DCAA5",
  coral: "#D85A30", amber: "#EF9F27",
  bg: "#09080F", bg2: "#110F1E", bg3: "#1A1730",
};

const features = [
  { icon:"⚡", title:"Real-Time Monitoring",  desc:"Track vehicle flow and speed across every city zone, live.",             color:C.p400  },
  { icon:"🧠", title:"Congestion Detection",  desc:"Instantly identify bottlenecks before they become gridlock.",            color:C.coral },
  { icon:"📊", title:"Smart Analytics",       desc:"Visualize trends, compare zones, and make data-driven decisions.",      color:C.amber },
  { icon:"🔒", title:"Secure & Role-Based",  desc:"Admin and user access levels with JWT-secured endpoints.",              color:C.t400  },
];

function GlowOrb({ x, y, color, size=400, opacity=0.18 }) {
  return <div style={{ position:"absolute", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(100px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

// ── Logo component réutilisable ──────────────────────────
function Logo({ size=32, fontSize="1.2rem", style={} }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize, color:"#fff", ...style }}>
      <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
        <img
          src="/logo.png"
          alt="TrafficIQ"
          onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
          style={{ width:size, height:size, borderRadius:size*0.25, objectFit:"cover" }}
        />
        <div style={{ display:"none", width:size, height:size, borderRadius:size*0.25, background:`linear-gradient(135deg,${C.p400},${C.p600})`, alignItems:"center", justifyContent:"center", fontSize:size*0.45 }}>
          🚦
        </div>
      </div>
      TrafficIQ
    </div>
  );
}

function FeatCard({ icon, title, desc, color }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:hov?C.bg3:C.bg2, border:`1px solid ${hov?color+"55":"rgba(255,255,255,0.07)"}`, borderRadius:16, padding:"1.8rem", transition:"all 0.25s", transform:hov?"translateY(-4px)":"none", position:"relative", overflow:"hidden", cursor:"default" }}
    >
      {hov && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color},transparent)` }} />}
      <div style={{ width:46, height:46, borderRadius:12, background:color+"18", border:`1px solid ${color}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:"1.1rem" }}>{icon}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#fff", marginBottom:"0.5rem" }}>{title}</div>
      <p style={{ fontSize:"0.85rem", color:"#7C7A99", lineHeight:1.7, margin:0, fontWeight:300 }}>{desc}</p>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [navHov, setNavHov] = useState(null);
  const [pulse, setPulse]   = useState(true);
  const [btnHov, setBtnHov] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setPulse(v => !v), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:"#f0f0f0", minHeight:"100vh", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        a{text-decoration:none;}
        ::selection{background:#7F77DD44;color:#fff;}
      `}</style>

      {/* ── NAV ── */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.2rem 3rem", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(9,8,15,0.88)", backdropFilter:"blur(16px)", position:"sticky", top:0, zIndex:100 }}>
        <div onClick={() => navigate("/")} style={{ cursor:"pointer" }}>
          <Logo size={32} fontSize="1.2rem" />
        </div>

        <nav style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          {[["Features","#features"],["About","#about"]].map(([label,href]) => (
            <a key={label} href={href}
              onMouseEnter={() => setNavHov(label)}
              onMouseLeave={() => setNavHov(null)}
              style={{ fontSize:"0.88rem", color:navHov===label?"#fff":"#7C7A99", transition:"color 0.2s", fontWeight:400 }}>
              {label}
            </a>
          ))}
          <button onClick={() => navigate("/login")}
            style={{ background:`linear-gradient(135deg,${C.p400},${C.p600})`, color:"#fff", border:"none", padding:"0.48rem 1.3rem", borderRadius:8, fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Login
          </button>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{ position:"relative", maxWidth:860, margin:"0 auto", padding:"7rem 3rem 5rem", textAlign:"center" }}>
        <GlowOrb x="15%" y="40%" color={C.p600} size={550} opacity={0.2}  />
        <GlowOrb x="85%" y="30%" color={C.p400} size={420} opacity={0.15} />
        <GlowOrb x="50%" y="85%" color={C.t400} size={360} opacity={0.1}  />

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.p900+"cc", border:`1px solid ${C.p600}66`, borderRadius:100, padding:"0.38rem 1rem 0.38rem 0.55rem", marginBottom:"2.2rem" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.t400, transform:`scale(${pulse?1:0.7})`, transition:"transform 0.5s ease", boxShadow:`0 0 6px ${C.t400}` }} />
            <span style={{ fontSize:"0.78rem", color:C.p200, fontWeight:500, letterSpacing:"0.06em" }}>Smart City Traffic Intelligence</span>
          </div>

          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(2.6rem,7vw,4.2rem)", fontWeight:800, lineHeight:1.08, letterSpacing:"-2px", color:"#fff", marginBottom:"1.5rem" }}>
            The smarter way to<br />
            <span style={{ background:`linear-gradient(135deg,${C.p200},${C.p400},${C.t200})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              manage urban traffic
            </span>
          </h1>

          <p style={{ fontSize:"1.05rem", color:"#7C7A99", maxWidth:480, margin:"0 auto 3rem", lineHeight:1.8, fontWeight:300 }}>
            Real-time monitoring, AI-powered congestion detection, and actionable insights — all in one platform built for modern cities.
          </p>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"1rem", flexWrap:"wrap" }}>
            <button
              onMouseEnter={() => setBtnHov("p")} onMouseLeave={() => setBtnHov(null)}
              onClick={() => navigate("/login")}
              style={{ background:`linear-gradient(135deg,${C.p400},${C.p600})`, color:"#fff", border:"none", padding:"0.9rem 2.4rem", borderRadius:10, fontSize:"0.95rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", boxShadow:btnHov==="p"?`0 0 32px ${C.p400}55`:"none", transform:btnHov==="p"?"translateY(-2px)":"none", transition:"all 0.2s" }}>
              Get Started →
            </button>
            <button
              onMouseEnter={() => setBtnHov("g")} onMouseLeave={() => setBtnHov(null)}
              onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}
              style={{ background:btnHov==="g"?"rgba(255,255,255,0.06)":"transparent", color:btnHov==="g"?"#fff":"#7C7A99", border:"1px solid rgba(255,255,255,0.1)", padding:"0.9rem 2.4rem", borderRadius:10, fontSize:"0.95rem", cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
              See Features
            </button>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ maxWidth:860, margin:"0 auto 5rem", padding:"0 3rem" }}>
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.p600}44,${C.p400}66,${C.p600}44,transparent)` }} />
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth:860, margin:"0 auto 7rem", padding:"0 3rem" }}>
        <div style={{ textAlign:"center", marginBottom:"3rem" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:"#fff", letterSpacing:"-0.5px", marginBottom:"0.7rem" }}>Everything you need</h2>
          <p style={{ color:"#7C7A99", fontSize:"0.92rem", fontWeight:300, maxWidth:400, margin:"0 auto", lineHeight:1.75 }}>
            A complete toolkit for city traffic management, from raw sensor data to actionable dashboards.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:16 }}>
          {features.map(f => <FeatCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="about" style={{ maxWidth:860, margin:"0 auto 7rem", padding:"0 3rem" }}>
        <div style={{ background:`linear-gradient(135deg,${C.p900}bb,${C.bg2})`, border:`1px solid ${C.p600}44`, borderRadius:20, padding:"3.5rem", textAlign:"center", position:"relative", overflow:"hidden" }}>
          <GlowOrb x="10%" y="50%" color={C.p600} size={300} opacity={0.25} />
          <GlowOrb x="90%" y="50%" color={C.p400} size={280} opacity={0.18} />
          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:C.t400+"18", border:`1px solid ${C.t400}40`, borderRadius:100, padding:"0.3rem 0.9rem", marginBottom:"1.4rem" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.t400 }} />
              <span style={{ fontSize:"0.75rem", color:C.t200, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase" }}>Open Platform</span>
            </div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:"#fff", letterSpacing:"-0.5px", marginBottom:"1rem" }}>
              Ready to take control<br />of your city's traffic?
            </h2>
            <p style={{ color:"#7C7A99", fontSize:"0.92rem", maxWidth:400, margin:"0 auto 2rem", lineHeight:1.78, fontWeight:300 }}>
              Join TrafficIQ and start making smarter, faster decisions with your traffic data today.
            </p>
            <button
              onClick={() => navigate("/login")}
              onMouseEnter={e => { e.target.style.boxShadow=`0 0 32px ${C.p400}55`; e.target.style.transform="translateY(-2px)"; }}
              onMouseLeave={e => { e.target.style.boxShadow="none"; e.target.style.transform="none"; }}
              style={{ background:`linear-gradient(135deg,${C.p400},${C.p600})`, color:"#fff", border:"none", padding:"0.9rem 2.6rem", borderRadius:10, fontSize:"0.95rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
              Get Started for Free →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"1.5rem 3rem", display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:"0.82rem", color:"#4A4868" }}>
        <Logo size={24} fontSize="0.9rem" />
        <span>© 2026 TrafficIQ · All rights reserved</span>
        <span style={{ color:"#3A3858" }}>Smart City Platform</span>
      </footer>
    </div>
  );
}