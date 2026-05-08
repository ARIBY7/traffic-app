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

function getHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderTop:`2px solid ${color}`, borderRadius:12, padding:"1.1rem 1.3rem", textAlign:"center" }}>
      <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>{label}</div>
    </div>
  );
}

function Badge({ etat }) {
  const active = etat?.toUpperCase() === "ACTIF";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:active?`${COLORS.accent.teal}18`:`${COLORS.accent.coral}18`, border:`1px solid ${active?COLORS.accent.teal:COLORS.accent.coral}44`, color:active?COLORS.accent.teal:"#F0997B", fontSize:"0.72rem", fontWeight:600, padding:"0.22rem 0.7rem", borderRadius:100 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:active?COLORS.accent.teal:COLORS.accent.coral, display:"inline-block" }} />
      {active ? "ACTIF" : "INACTIF"}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:COLORS.bg.card, border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, padding:"2rem", width:"100%", maxWidth:440, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:700, color:COLORS.text.primary }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:COLORS.text.muted, fontSize:"1.2rem", cursor:"pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", options }) {
  const [focused, setFocused] = useState(false);
  const base = { width:"100%", background:focused?COLORS.bg.hover:"rgba(255,255,255,0.04)", border:`1px solid ${focused?COLORS.primary.light+"99":"rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"0.72rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", transition:"all 0.2s" };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:"0.75rem", color:"#7C7A99", marginBottom:6, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</label>
      {options ? (
        <select value={value} onChange={onChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ ...base, cursor:"pointer" }}>
          {options.map(o => <option key={o} value={o} style={{ background:COLORS.bg.card }}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={base} />
      )}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:disabled?"rgba(255,255,255,0.06)":danger?(hov?"#b84a25":COLORS.accent.coral):(hov?COLORS.primary.light:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`),
      color:disabled?COLORS.text.muted:COLORS.text.primary, border:"none", borderRadius:8,
      padding:"0.72rem 1.4rem", fontSize:"0.88rem", fontWeight:600,
      cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.18s",
    }}>{children}</button>
  );
}

function ActionBtn({ onClick, color, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?color+"22":"rgba(255,255,255,0.04)", border:`1px solid ${hov?color+"55":"rgba(255,255,255,0.08)"}`,
      color:hov?color:"#7C7A99", borderRadius:6, padding:"0.35rem 0.75rem",
      fontSize:"0.78rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.18s",
    }}>{label}</button>
  );
}

function getZoneName(zone) {
  if (!zone) return "—";
  if (typeof zone === "string") return zone;
  return zone.nomQuartier || zone.name || "—";
}

function SensorRow({ sensor, last, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      display:"grid", gridTemplateColumns:"55px 1fr 1fr 110px 110px 150px",
      padding:"1rem 1.4rem", borderBottom:last?"none":"1px solid rgba(127,119,221,0.06)",
      background:hov?COLORS.bg.hover:"transparent", alignItems:"center", transition:"background 0.15s",
    }}>
      <span style={{ fontSize:"0.82rem", color:COLORS.text.subtle, fontWeight:600 }}>#{sensor.id}</span>
      <span style={{ fontSize:"0.9rem", color:COLORS.text.primary, fontWeight:500 }}>{sensor.name}</span>
      <span style={{ fontSize:"0.85rem", color:COLORS.text.muted }}>{getZoneName(sensor.zone)}</span>
      <Badge etat={sensor.etat} />
      <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:sensor.accidentSignale?`${COLORS.accent.coral}18`:"rgba(255,255,255,0.04)", border:`1px solid ${sensor.accidentSignale?COLORS.accent.coral+"44":"rgba(255,255,255,0.08)"}`, color:sensor.accidentSignale?"#F0997B":COLORS.text.muted, fontSize:"0.7rem", fontWeight:600, padding:"0.22rem 0.65rem", borderRadius:100 }}>
        <span style={{ width:5, height:5, borderRadius:"50%", background:sensor.accidentSignale?COLORS.accent.coral:COLORS.text.muted, display:"inline-block" }} />
        {sensor.accidentSignale ? "Accident" : "Normal"}
      </span>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <ActionBtn onClick={()=>onEdit(sensor)} color={COLORS.primary.light} label="Edit" />
        <ActionBtn onClick={()=>onDelete(sensor)} color={COLORS.accent.coral} label="Delete" />
      </div>
    </div>
  );
}

export default function LocationDashboard() {
  const navigate = useNavigate();

  const [sensors, setSensors]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);
  const [searchType, setSearchType]     = useState("name");
  const [searchVal, setSearchVal]       = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching]       = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [showEdit, setShowEdit]         = useState(null);
  const [showDelete, setShowDelete]     = useState(null);

  const [zones, setZones] = useState([]);
  const emptyForm = { name:"", zoneId:"", zoneName:"", etat:"ACTIF", accidentSignale:false };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/sensors`, { headers:getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      setSensors(Array.isArray(data) ? data : []);
    } catch (e) { showToast("Erreur de chargement", "error"); }
    finally { setLoading(false); }
  };

  // ✅ Charge les zones depuis l'API — pas de création automatique
  // Pour créer les zones, aller sur la page /admin/zones
  const fetchZones = async () => {
    try {
      const res = await fetch(`${API}/api/admin/zones`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setZones(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAll(); fetchZones(); }, []);

  const handleSearch = async () => {
    const val = searchVal.trim();
    if (!val) { setSearchResult(null); return; }
    setSearching(true);
    try {
      let url;
      if (searchType === "id")   url = `${API}/api/users/sensorId/${val}`;
      if (searchType === "name") url = `${API}/api/users/sensorName/${encodeURIComponent(val)}`;
      if (searchType === "zone") url = `${API}/api/users/sensorZone/${encodeURIComponent(val)}`;
      const res = await fetch(url, { headers:getHeaders() });
      if (!res.ok) { showToast("Aucun résultat trouvé", "error"); setSearchResult(null); return; }
      const data = await res.json();
      setSearchResult(Array.isArray(data) ? data : [data]);
    } catch (e) { showToast("Erreur de recherche", "error"); }
    finally { setSearching(false); }
  };

  const clearSearch = () => { setSearchVal(""); setSearchResult(null); };

  const handleCreate = async () => {
    if (!form.zoneId) { showToast("Sélectionnez une zone", "error"); return; }
    try {
      const body = {
        name: form.name,
        zone: { id: parseInt(form.zoneId), nomQuartier: form.zoneName },
        etat: form.etat,
        accidentSignale: form.accidentSignale,
      };
      const res = await fetch(`${API}/api/admin/newSensor`, { method:"POST", headers:getHeaders(), body:JSON.stringify(body) });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast("Sensor créé avec succès");
      setShowCreate(false); setForm(emptyForm); fetchAll();
    } catch (e) { console.error(e); showToast("Erreur lors de la création", "error"); }
  };

  const handleUpdate = async () => {
    if (!form.zoneId) { showToast("Sélectionnez une zone", "error"); return; }
    try {
      const body = {
        name: form.name,
        zone: { id: parseInt(form.zoneId), nomQuartier: form.zoneName },
        etat: form.etat,
        accidentSignale: form.accidentSignale,
      };
      const res = await fetch(`${API}/api/admin/sensor/${showEdit.id}`, { method:"PUT", headers:getHeaders(), body:JSON.stringify(body) });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast("Sensor mis à jour");
      setShowEdit(null); setForm(emptyForm); fetchAll();
    } catch (e) { console.error(e); showToast("Erreur lors de la mise à jour", "error"); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/api/admin/sensor/${showDelete.id}`, { method:"DELETE", headers:getHeaders() });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast("Sensor supprimé");
      setShowDelete(null); clearSearch(); fetchAll();
    } catch (e) { showToast("Erreur lors de la suppression", "error"); }
  };

  const openEdit = (sensor) => {
    const zoneId = sensor.zone?.id ? String(sensor.zone.id) : "";
    const zoneName = getZoneName(sensor.zone);
    setForm({
      name: sensor.name,
      zoneId,
      zoneName,
      etat: sensor.etat || "ACTIF",
      accidentSignale: sensor.accidentSignale || false,
    });
    setShowEdit(sensor);
  };

  const displayed = searchResult ?? sensors;
  const searchLabels = { name:"Name", id:"ID", zone:"Zone" };
  const searchPlaceholders = { name:"Enter sensor name...", id:"Enter sensor ID...", zone:"Enter zone name..." };

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
      <GlowOrb x="90%" y="70%" color={COLORS.primary.light} size={400} opacity={0.08} />

      {toast && (
        <div style={{ position:"fixed", top:"1.5rem", right:"1.5rem", zIndex:999, background:toast.type==="error"?`${COLORS.accent.coral}18`:`${COLORS.accent.teal}18`, border:`1px solid ${toast.type==="error"?COLORS.accent.coral:COLORS.accent.teal}55`, color:toast.type==="error"?"#F0997B":COLORS.accent.teal, borderRadius:10, padding:"0.75rem 1.2rem", fontSize:"0.85rem", fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>
          {toast.type==="error"?"⚠":"✓"} {toast.msg}
        </div>
      )}

      <Sidebar />

      <div style={{ marginLeft:220, padding:"2.5rem", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Sensors</h1>
            <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>Manage your traffic sensors</p>
          </div>
          <PrimaryBtn onClick={() => { setForm(emptyForm); setShowCreate(true); }}>+ New Sensor</PrimaryBtn>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:14, marginBottom:"2rem" }}>
          {[
            { label:"Total Sensors", value:sensors.length,                                            color:COLORS.primary.light, icon:"📡" },
            { label:"Active",        value:sensors.filter(s=>s.etat?.toUpperCase()==="ACTIF").length, color:COLORS.accent.teal,   icon:"✅" },
            { label:"Inactive",      value:sensors.filter(s=>s.etat?.toUpperCase()!=="ACTIF").length, color:COLORS.accent.coral,  icon:"⚠️" },
            { label:"Accidents",     value:sensors.filter(s=>s.accidentSignale===true).length,        color:COLORS.accent.amber,  icon:"🚨" },
          ].map(stat => <StatCard key={stat.label} {...stat} />)}
        </div>

        {/* Search */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.2rem 1.4rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", background:COLORS.bg.hover, borderRadius:8, padding:3, gap:2 }}>
            {["name","id","zone"].map(type => (
              <button key={type} onClick={() => { setSearchType(type); clearSearch(); }} style={{
                background:searchType===type?`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`:"transparent",
                color:searchType===type?COLORS.text.primary:COLORS.text.muted,
                border:"none", borderRadius:6, padding:"0.38rem 0.9rem", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit",
              }}>By {searchLabels[type]}</button>
            ))}
          </div>
          <input value={searchVal} onChange={e=>setSearchVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()}
            placeholder={searchPlaceholders[searchType]} style={{ flex:1, minWidth:180, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.65rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit" }} />
          <PrimaryBtn onClick={handleSearch} disabled={searching||!searchVal.trim()}>{searching?"Searching...":"Search"}</PrimaryBtn>
          {searchResult && <button onClick={clearSearch} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.65rem 1rem", fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit" }}>Clear ✕</button>}
        </div>

        {searchResult && <div style={{ marginBottom:"0.75rem", fontSize:"0.8rem", color:COLORS.text.muted }}>{searchResult.length} result{searchResult.length!==1?"s":""} found</div>}

        {/* Table */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"55px 1fr 1fr 110px 110px 150px", padding:"0.85rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.72rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
            <span>ID</span><span>Name</span><span>Zone</span><span>Status</span><span>Accident</span><span style={{ textAlign:"right" }}>Actions</span>
          </div>
          {loading ? (
            <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted }}>Loading...</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted }}>No sensors found</div>
          ) : (
            displayed.map((s, i) => <SensorRow key={s.id??i} sensor={s} last={i===displayed.length-1} onEdit={openEdit} onDelete={setShowDelete} />)
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Sensor" onClose={()=>setShowCreate(false)}>
          <FormField label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:"0.75rem", color:"#7C7A99", marginBottom:6, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>Zone</label>
            <select value={form.zoneId} onChange={e=>{
              const z = zones.find(z=>String(z.id)===e.target.value);
              setForm({...form, zoneId:e.target.value, zoneName: z?.nomQuartier||""});
            }} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.72rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
              <option value="">-- Sélectionner une zone --</option>
              {zones.map(z => <option key={z.id} value={z.id} style={{ background:"#110F1E" }}>{z.nomQuartier}</option>)}
            </select>
            {zones.length === 0 && (
              <div style={{ fontSize:"0.75rem", color:COLORS.accent.coral, marginTop:4 }}>
                ⚠ Aucune zone — allez d'abord sur <strong>Zones 📍</strong> pour les créer
              </div>
            )}
          </div>
          <FormField label="Status" value={form.etat} onChange={e=>setForm({...form,etat:e.target.value})} options={["ACTIF","INACTIF"]} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={()=>setShowCreate(false)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            <PrimaryBtn onClick={handleCreate} disabled={!form.name.trim()}>Create</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title={`Edit — ${showEdit.name}`} onClose={()=>setShowEdit(null)}>
          <FormField label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:"0.75rem", color:"#7C7A99", marginBottom:6, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>Zone</label>
            <select value={form.zoneId} onChange={e=>{
              const z = zones.find(z=>String(z.id)===e.target.value);
              setForm({...form, zoneId:e.target.value, zoneName: z?.nomQuartier||""});
            }} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.72rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
              <option value="">-- Sélectionner une zone --</option>
              {zones.map(z => <option key={z.id} value={z.id} style={{ background:"#110F1E" }}>{z.nomQuartier}</option>)}
            </select>
          </div>
          <FormField label="Status" value={form.etat} onChange={e=>setForm({...form,etat:e.target.value})} options={["ACTIF","INACTIF"]} />
          <FormField label="Accident signalé" value={form.accidentSignale?"true":"false"} onChange={e=>setForm({...form,accidentSignale:e.target.value==="true"})} options={["false","true"]} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={()=>setShowEdit(null)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            <PrimaryBtn onClick={handleUpdate} disabled={!form.name.trim()}>Save Changes</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <Modal title="Delete Sensor" onClose={()=>setShowDelete(null)}>
          <p style={{ color:"#9CA3AF", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"1.5rem" }}>
            Are you sure you want to delete sensor <span style={{ color:COLORS.text.primary, fontWeight:600 }}>{showDelete.name}</span>?
          </p>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>setShowDelete(null)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            <PrimaryBtn danger onClick={handleDelete}>Delete</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}