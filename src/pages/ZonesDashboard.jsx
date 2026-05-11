import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

const API = process.env.REACT_APP_API_URL || "http://localhost:8081";

// ✅ Item 9 — Nouveaux types de route
const TYPE_ROUTES = ["HIGHWAY", "BOULEVARD", "AVENUE", "STREET", "COASTAL_ROAD", "INTERSECTION"];

const CASABLANCA_ZONES = [
  { nomQuartier: "Ain Chock",      typeRoute: "STREET"       },
  { nomQuartier: "Ain Sebaa",      typeRoute: "BOULEVARD"    },
  { nomQuartier: "Anfa",           typeRoute: "AVENUE"       },
  { nomQuartier: "Ben M'sik",      typeRoute: "STREET"       },
  { nomQuartier: "Bernoussi",      typeRoute: "STREET"       },
  { nomQuartier: "Hay Hassani",    typeRoute: "BOULEVARD"    },
  { nomQuartier: "Hay Mohammadi",  typeRoute: "STREET"       },
  { nomQuartier: "Maarif",         typeRoute: "AVENUE"       },
  { nomQuartier: "Medina",         typeRoute: "INTERSECTION" },
  { nomQuartier: "Moulay Rachid",  typeRoute: "STREET"       },
  { nomQuartier: "Sidi Belyout",   typeRoute: "COASTAL_ROAD" },
  { nomQuartier: "Sidi Bernoussi", typeRoute: "STREET"       },
  { nomQuartier: "Sidi Moumen",    typeRoute: "HIGHWAY"      },
  { nomQuartier: "Sidi Othmane",   typeRoute: "STREET"       },
];

function getHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

// ✅ Badge mis à jour avec les nouveaux types
function TypeBadge({ type }) {
  const map = {
    HIGHWAY:      { bg: "#1D9E7520", border: "#1D9E7555", color: "#1D9E75" },
    BOULEVARD:    { bg: "#7F77DD20", border: "#7F77DD55", color: "#7F77DD" },
    AVENUE:       { bg: "#EF9F2720", border: "#EF9F2755", color: "#EF9F27" },
    STREET:       { bg: "#AFA9EC20", border: "#AFA9EC55", color: "#AFA9EC" },
    COASTAL_ROAD: { bg: "#378ADD20", border: "#378ADD55", color: "#378ADD" },
    INTERSECTION: { bg: "#D85A3020", border: "#D85A3055", color: "#D85A30" },
  };
  const c = map[type] || { bg:"rgba(255,255,255,0.06)", border:"rgba(255,255,255,0.15)", color:"#888" };
  return (
    <span style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.color, fontSize:"0.7rem", fontWeight:600, padding:"0.2rem 0.65rem", borderRadius:6, whiteSpace:"nowrap" }}>
      {type || "—"}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:COLORS.bg.card, border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, padding:"2rem", width:"100%", maxWidth:440, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:700, color:COLORS.text.primary }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:COLORS.text.muted, fontSize:"1.2rem", cursor:"pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"rgba(255,255,255,0.04)",
  border:"1px solid rgba(255,255,255,0.1)", borderRadius:8,
  padding:"0.72rem 1rem", fontSize:"0.88rem", color:"#FFFFFF",
  outline:"none", fontFamily:"inherit",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:"0.75rem", color:"#7C7A99", marginBottom:6, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

function ZoneForm({ form, setForm }) {
  return (
    <>
      <Field label="Nom du quartier">
        <input
          value={form.nomQuartier}
          onChange={e => setForm({ ...form, nomQuartier: e.target.value })}
          style={inputStyle}
          placeholder="ex: Ain Chock"
        />
      </Field>
      {/* ✅ Dropdown avec nouveaux types */}
      <Field label="Type de route">
        <select value={form.typeRoute} onChange={e => setForm({ ...form, typeRoute: e.target.value })} style={{ ...inputStyle, cursor:"pointer" }}>
          {TYPE_ROUTES.map(t => <option key={t} value={t} style={{ background:"#110F1E" }}>{t}</option>)}
        </select>
      </Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Field label="Latitude (optionnel)">
          <input type="number" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} style={inputStyle} placeholder="33.5731" />
        </Field>
        <Field label="Longitude (optionnel)">
          <input type="number" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} style={inputStyle} placeholder="-7.5898" />
        </Field>
      </div>
    </>
  );
}

export default function ZonesDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ✅ Lire ?id= depuis l'URL (vient du clic sur zone dans LocationDashboard)
  const highlightId = searchParams.get("id") ? parseInt(searchParams.get("id")) : null;
  const highlightRef = useRef(null);

  const [zones, setZones]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [showEdit, setShowEdit]         = useState(null);
  const [showDelete, setShowDelete]     = useState(null);

  const emptyForm = { nomQuartier:"", typeRoute:"STREET", latitude:"", longitude:"" };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/zones`, { headers: getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      setZones(Array.isArray(data) ? data : []);
    } catch { showToast("Erreur de chargement", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchZones(); }, []);

  // ✅ Scroll vers la zone highlightée après chargement
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior:"smooth", block:"center" });
    }
  }, [zones, highlightId]);

  const handleInitZones = async () => {
    setInitializing(true);
    try {
      const res = await fetch(`${API}/api/users/zones`, { headers: getHeaders() });
      const existing = res.ok ? await res.json() : [];
      const existingNames = (Array.isArray(existing) ? existing : []).map(z => z.nomQuartier);
      const toCreate = CASABLANCA_ZONES.filter(z => !existingNames.includes(z.nomQuartier));
      if (toCreate.length === 0) { showToast("Toutes les zones existent déjà!"); setInitializing(false); return; }
      for (const z of toCreate) {
        await fetch(`${API}/api/admin/zones`, { method:"POST", headers:getHeaders(), body:JSON.stringify(z) });
      }
      showToast(`${toCreate.length} zone(s) ajoutée(s)!`);
      fetchZones();
    } catch { showToast("Erreur initialisation", "error"); }
    finally { setInitializing(false); }
  };

  const handleCreate = async () => {
    if (!form.nomQuartier.trim()) { showToast("Nom requis", "error"); return; }
    try {
      const res = await fetch(`${API}/api/admin/zones`, {
        method:"POST", headers:getHeaders(),
        body:JSON.stringify({
          nomQuartier: form.nomQuartier,
          typeRoute:   form.typeRoute,
          latitude:    form.latitude  ? parseFloat(form.latitude)  : null,
          longitude:   form.longitude ? parseFloat(form.longitude) : null,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Zone créée!");
      setShowCreate(false); setForm(emptyForm); fetchZones();
    } catch { showToast("Erreur création", "error"); }
  };

  const handleUpdate = async () => {
    if (!form.nomQuartier.trim()) { showToast("Nom requis", "error"); return; }
    try {
      const res = await fetch(`${API}/api/admin/zones/${showEdit.id}`, {
        method:"PUT", headers:getHeaders(),
        body:JSON.stringify({
          nomQuartier: form.nomQuartier,
          typeRoute:   form.typeRoute,
          latitude:    form.latitude  ? parseFloat(form.latitude)  : null,
          longitude:   form.longitude ? parseFloat(form.longitude) : null,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Zone mise à jour!");
      setShowEdit(null); setForm(emptyForm); fetchZones();
    } catch { showToast("Erreur mise à jour", "error"); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/api/admin/zones/${showDelete.id}`, { method:"DELETE", headers:getHeaders() });
      if (!res.ok) throw new Error();
      showToast("Zone supprimée!");
      setShowDelete(null); fetchZones();
    } catch { showToast("Erreur suppression", "error"); }
  };

  const openEdit = (zone) => {
    setForm({
      nomQuartier: zone.nomQuartier || "",
      typeRoute:   zone.typeRoute   || "STREET",
      latitude:    zone.latitude    || "",
      longitude:   zone.longitude   || "",
    });
    setShowEdit(zone);
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(127,119,221,0.3); color:#fff; }
        option { background:#110F1E; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
        @keyframes pulse-border { 0%,100% { box-shadow: 0 0 0 0 rgba(127,119,221,0.4); } 50% { box-shadow: 0 0 0 6px rgba(127,119,221,0); } }
      `}</style>

      <GlowOrb x="10%" y="20%" color={COLORS.primary.dark} size={500} opacity={0.1} />
      <GlowOrb x="90%" y="70%" color={COLORS.accent.teal}  size={400} opacity={0.07} />

      {toast && (
        <div style={{ position:"fixed", top:"1.5rem", right:"1.5rem", zIndex:999, background:toast.type==="error"?`${COLORS.accent.coral}18`:`${COLORS.accent.teal}18`, border:`1px solid ${toast.type==="error"?COLORS.accent.coral:COLORS.accent.teal}55`, color:toast.type==="error"?"#F0997B":COLORS.accent.teal, borderRadius:10, padding:"0.75rem 1.2rem", fontSize:"0.85rem", fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>
          {toast.type==="error" ? "⚠" : "✓"} {toast.msg}
        </div>
      )}

      <Sidebar />

      <div style={{ marginLeft:220, padding:"2.5rem", position:"relative", zIndex:1 }}>

        {/* ✅ Banner si on vient d'un sensor */}
        {highlightId && (
          <div style={{ background:`${COLORS.primary.light}12`, border:`1px solid ${COLORS.primary.light}44`, borderRadius:10, padding:"0.7rem 1.2rem", marginBottom:"1.2rem", fontSize:"0.85rem", color:COLORS.primary.light, display:"flex", alignItems:"center", gap:8 }}>
            📍 Zone #{highlightId} mise en évidence — venant de la page Sensors
            <button onClick={() => navigate("/admin/zones")} style={{ marginLeft:"auto", background:"transparent", border:"none", color:COLORS.text.muted, cursor:"pointer", fontSize:"0.8rem" }}>✕ Effacer</button>
          </div>
        )}

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Zones 📍</h1>
            <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>Gérer les zones de trafic de Casablanca</p>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={handleInitZones} disabled={initializing} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", color:COLORS.text.muted, borderRadius:8, padding:"0.72rem 1.2rem", fontSize:"0.85rem", fontWeight:500, cursor:initializing?"not-allowed":"pointer", fontFamily:"inherit" }}>
              {initializing ? "⏳ Initialisation..." : "🏙 Init Casablanca"}
            </button>
            <button onClick={() => { setForm(emptyForm); setShowCreate(true); }} style={{ background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, color:"#FFFFFF", border:"none", borderRadius:8, padding:"0.72rem 1.4rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              + Nouvelle Zone
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:14, marginBottom:"2rem" }}>
          {[
            { label:"Total Zones",   value:zones.length,                                         color:COLORS.primary.light, icon:"📍" },
            { label:"Highway",       value:zones.filter(z=>z.typeRoute==="HIGHWAY").length,       color:COLORS.accent.teal,   icon:"🛤" },
            { label:"Boulevard",     value:zones.filter(z=>z.typeRoute==="BOULEVARD").length,     color:COLORS.primary.light, icon:"🏘" },
            { label:"Avenue",        value:zones.filter(z=>z.typeRoute==="AVENUE").length,        color:COLORS.accent.amber,  icon:"🛣" },
          ].map(s => (
            <div key={s.label} style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderTop:`2px solid ${s.color}`, borderRadius:12, padding:"1.1rem 1.3rem", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"55px 1fr 150px 100px 100px 140px", padding:"0.85rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.72rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
            <span>ID</span><span>Quartier</span><span>Type</span><span>Latitude</span><span>Longitude</span><span style={{ textAlign:"right" }}>Actions</span>
          </div>

          {loading ? (
            <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted }}>Chargement...</div>
          ) : zones.length === 0 ? (
            <div style={{ padding:"3rem", textAlign:"center" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem", opacity:0.3 }}>📍</div>
              <div style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginBottom:"1rem" }}>
                Aucune zone — cliquez sur "Init Casablanca" pour créer les 14 zones automatiquement
              </div>
            </div>
          ) : (
            zones.map((z, i) => {
              const isHighlighted = z.id === highlightId;
              return (
                <div
                  key={z.id}
                  ref={isHighlighted ? highlightRef : null}
                  style={{
                    display:"grid", gridTemplateColumns:"55px 1fr 150px 100px 100px 140px",
                    padding:"0.9rem 1.4rem",
                    borderBottom:i===zones.length-1?"none":"1px solid rgba(127,119,221,0.06)",
                    alignItems:"center",
                    // ✅ Highlight de la zone venant du clic depuis Sensors
                    background: isHighlighted ? `${COLORS.primary.light}10` : "transparent",
                    borderLeft: isHighlighted ? `3px solid ${COLORS.primary.light}` : "3px solid transparent",
                    animation: isHighlighted ? "pulse-border 1.5s ease-in-out 2" : "none",
                    transition:"background 0.3s",
                  }}
                >
                  <span style={{ fontSize:"0.82rem", color:isHighlighted?COLORS.primary.light:COLORS.text.subtle, fontWeight:600 }}>#{z.id}</span>
                  <span style={{ fontSize:"0.9rem", color:COLORS.text.primary, fontWeight: isHighlighted ? 700 : 500 }}>{z.nomQuartier}</span>
                  <TypeBadge type={z.typeRoute} />
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.muted }}>{z.latitude  ? Number(z.latitude).toFixed(4)  : "—"}</span>
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.muted }}>{z.longitude ? Number(z.longitude).toFixed(4) : "—"}</span>
                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                    <button onClick={() => openEdit(z)} style={{ background:"rgba(127,119,221,0.1)", border:"1px solid rgba(127,119,221,0.3)", color:COLORS.primary.light, borderRadius:6, padding:"0.3rem 0.7rem", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Edit</button>
                    <button onClick={() => setShowDelete(z)} style={{ background:`${COLORS.accent.coral}18`, border:`1px solid ${COLORS.accent.coral}44`, color:"#F0997B", borderRadius:6, padding:"0.3rem 0.7rem", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Nouvelle Zone" onClose={() => setShowCreate(false)}>
          <ZoneForm form={form} setForm={setForm} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setShowCreate(false)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={handleCreate} disabled={!form.nomQuartier.trim()} style={{ background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, color:"#FFF", border:"none", borderRadius:8, padding:"0.72rem 1.4rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Créer</button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title={`Modifier — ${showEdit.nomQuartier}`} onClose={() => setShowEdit(null)}>
          <ZoneForm form={form} setForm={setForm} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setShowEdit(null)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={handleUpdate} disabled={!form.nomQuartier.trim()} style={{ background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, color:"#FFF", border:"none", borderRadius:8, padding:"0.72rem 1.4rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sauvegarder</button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <Modal title="Supprimer la zone" onClose={() => setShowDelete(null)}>
          <p style={{ color:"#9CA3AF", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"1.5rem" }}>
            Supprimer la zone <span style={{ color:COLORS.text.primary, fontWeight:600 }}>{showDelete.nomQuartier}</span> ?
            <br />
            <span style={{ fontSize:"0.82rem", color:COLORS.accent.coral }}>⚠ Les sensors liés à cette zone seront affectés.</span>
          </p>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowDelete(null)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={handleDelete} style={{ background:COLORS.accent.coral, color:"#FFF", border:"none", borderRadius:8, padding:"0.72rem 1.4rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}