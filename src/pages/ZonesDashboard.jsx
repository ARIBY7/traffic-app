import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

const API = process.env.REACT_APP_API_URL || "http://localhost:8081";
const TYPE_ROUTES = ["Urbaine", "Avenue", "Autoroute"];

const CASABLANCA_ZONES = [
  { nomQuartier: "Ain Chock",      typeRoute: "Urbaine" },
  { nomQuartier: "Ain Sebaa",      typeRoute: "Urbaine" },
  { nomQuartier: "Anfa",           typeRoute: "Avenue" },
  { nomQuartier: "Ben M'sik",      typeRoute: "Urbaine" },
  { nomQuartier: "Bernoussi",      typeRoute: "Urbaine" },
  { nomQuartier: "Hay Hassani",    typeRoute: "Urbaine" },
  { nomQuartier: "Hay Mohammadi",  typeRoute: "Urbaine" },
  { nomQuartier: "Maarif",         typeRoute: "Avenue" },
  { nomQuartier: "Medina",         typeRoute: "Urbaine" },
  { nomQuartier: "Moulay Rachid",  typeRoute: "Urbaine" },
  { nomQuartier: "Sidi Belyout",   typeRoute: "Autoroute" },
  { nomQuartier: "Sidi Bernoussi", typeRoute: "Urbaine" },
  { nomQuartier: "Sidi Moumen",    typeRoute: "Urbaine" },
  { nomQuartier: "Sidi Othmane",   typeRoute: "Urbaine" },
];

function getHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

function TypeBadge({ type }) {
  const map = {
    Urbaine:   { bg: "#7F77DD20", border: "#7F77DD55", color: "#7F77DD" },
    Avenue:    { bg: "#EF9F2720", border: "#EF9F2755", color: "#EF9F27" },
    Autoroute: { bg: "#1D9E7520", border: "#1D9E7555", color: "#1D9E75" },
  };
  const c = map[type] || map.Urbaine;
  return (
    <span style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.color, fontSize:"0.72rem", fontWeight:600, padding:"0.2rem 0.65rem", borderRadius:6, whiteSpace:"nowrap" }}>
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

  const [zones, setZones]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit]     = useState(null);
  const [showDelete, setShowDelete] = useState(null);

  const emptyForm = { nomQuartier:"", typeRoute:"Urbaine", latitude:"", longitude:"" };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/zones`, { headers: getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      setZones(Array.isArray(data) ? data : []);
    } catch { showToast("Erreur de chargement", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchZones(); }, []);

  // ✅ Ajoute uniquement les zones manquantes — pas de doublons
  const handleInitZones = async () => {
    setInitializing(true);
    try {
      const existing = zones.map(z => z.nomQuartier);
      const toCreate = CASABLANCA_ZONES.filter(z => !existing.includes(z.nomQuartier));
      if (toCreate.length === 0) {
        showToast("Toutes les zones existent déjà!");
        setInitializing(false);
        return;
      }
      for (const z of toCreate) {
        await fetch(`${API}/api/admin/zones`, {
          method: "POST", headers: getHeaders(), body: JSON.stringify(z),
        });
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
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({
          nomQuartier: form.nomQuartier,
          typeRoute: form.typeRoute,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
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
        method: "PUT", headers: getHeaders(),
        body: JSON.stringify({
          nomQuartier: form.nomQuartier,
          typeRoute: form.typeRoute,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Zone mise à jour!");
      setShowEdit(null); setForm(emptyForm); fetchZones();
    } catch { showToast("Erreur mise à jour", "error"); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/api/admin/zones/${showDelete.id}`, {
        method: "DELETE", headers: getHeaders(),
      });
      if (!res.ok) throw new Error();
      showToast("Zone supprimée!");
      setShowDelete(null); fetchZones();
    } catch { showToast("Erreur suppression", "error"); }
  };

  const openEdit = (zone) => {
    setForm({
      nomQuartier: zone.nomQuartier || "",
      typeRoute: zone.typeRoute || "Urbaine",
      latitude: zone.latitude || "",
      longitude: zone.longitude || "",
    });
    setShowEdit(zone);
  };

  const typeCount = (t) => zones.filter(z => z.typeRoute === t).length;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(127,119,221,0.3); color:#fff; }
        option { background:#110F1E; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(127,119,221,0.3); border-radius:4px; }
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

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Zones 📍</h1>
            <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>Gérer les zones de trafic de Casablanca</p>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button
              onClick={handleInitZones}
              disabled={initializing}
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", color:COLORS.text.muted, borderRadius:8, padding:"0.72rem 1.2rem", fontSize:"0.85rem", fontWeight:500, cursor:initializing?"not-allowed":"pointer", fontFamily:"inherit" }}
            >
              {initializing ? "⏳ Initialisation..." : "🏙 Init Casablanca"}
            </button>
            <button
              onClick={() => { setForm(emptyForm); setShowCreate(true); }}
              style={{ background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, color:"#FFFFFF", border:"none", borderRadius:8, padding:"0.72rem 1.4rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
            >
              + Nouvelle Zone
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:14, marginBottom:"2rem" }}>
          {[
            { label:"Total Zones",  value: zones.length,          color: COLORS.primary.light, icon:"📍" },
            { label:"Urbaine",      value: typeCount("Urbaine"),   color: COLORS.primary.light, icon:"🏘" },
            { label:"Avenue",       value: typeCount("Avenue"),    color: COLORS.accent.amber,  icon:"🛣" },
            { label:"Autoroute",    value: typeCount("Autoroute"), color: COLORS.accent.teal,   icon:"🛤" },
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
          <div style={{ display:"grid", gridTemplateColumns:"55px 1fr 130px 100px 100px 140px", padding:"0.85rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.72rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
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
            zones.map((z, i) => (
              <div
                key={z.id}
                style={{ display:"grid", gridTemplateColumns:"55px 1fr 130px 100px 100px 140px", padding:"0.9rem 1.4rem", borderBottom:i===zones.length-1?"none":"1px solid rgba(127,119,221,0.06)", alignItems:"center" }}
              >
                <span style={{ fontSize:"0.82rem", color:COLORS.text.subtle, fontWeight:600 }}>#{z.id}</span>
                <span style={{ fontSize:"0.9rem", color:COLORS.text.primary, fontWeight:500 }}>{z.nomQuartier}</span>
                <TypeBadge type={z.typeRoute} />
                <span style={{ fontSize:"0.78rem", color:COLORS.text.muted }}>{z.latitude ? Number(z.latitude).toFixed(4) : "—"}</span>
                <span style={{ fontSize:"0.78rem", color:COLORS.text.muted }}>{z.longitude ? Number(z.longitude).toFixed(4) : "—"}</span>
                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                  <button onClick={() => openEdit(z)} style={{ background:"rgba(127,119,221,0.1)", border:"1px solid rgba(127,119,221,0.3)", color:COLORS.primary.light, borderRadius:6, padding:"0.3rem 0.7rem", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Edit</button>
                  <button onClick={() => setShowDelete(z)} style={{ background:`${COLORS.accent.coral}18`, border:`1px solid ${COLORS.accent.coral}44`, color:"#F0997B", borderRadius:6, padding:"0.3rem 0.7rem", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
                </div>
              </div>
            ))
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