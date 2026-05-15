import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const API = process.env.REACT_APP_API_URL || "http://localhost:8081";

// ✅ Item 11 — Types en anglais
const SIGNAL_TYPES = ["TRAFFIC_LIGHT", "VMS_SIGN", "BOOM_BARRIER"];

// ✅ Item 12 — États en anglais selon le type
const SIGNAL_STATES = {
  TRAFFIC_LIGHT: ["RED", "GREEN", "ORANGE"],
  VMS_SIGN:      ["CLOSE_ZONE", "OPEN_ROAD"],
  BOOM_BARRIER:  ["CLOSED", "OPENED"],
};

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};

function getHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.08 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

// ✅ Item 15 — Stat cards avec count par type
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderTop:`2px solid ${color}`, borderRadius:12, padding:"1.1rem 1.3rem", textAlign:"center" }}>
      <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:"0.68rem", color:COLORS.text.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>{label}</div>
    </div>
  );
}

// ✅ Item 12 — Badge état avec couleurs anglais
function StatusBadge({ state }) {
  const colors = {
    RED:        COLORS.accent.coral,
    GREEN:      COLORS.accent.teal,
    ORANGE:     COLORS.accent.amber,
    CLOSE_ZONE: COLORS.accent.coral,
    OPEN_ROAD:  COLORS.accent.teal,
    CLOSED:     COLORS.accent.coral,
    OPENED:     COLORS.accent.teal,
    // fallback anciens états français
    ROUGE:      COLORS.accent.coral,
    VERT:       COLORS.accent.teal,
  };
  const color = colors[state?.toUpperCase()] || COLORS.primary.light;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:color+"18", border:`1px solid ${color}44`, color, fontSize:"0.72rem", fontWeight:600, padding:"0.22rem 0.7rem", borderRadius:100 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:color, display:"inline-block" }} />
      {state || "—"}
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

function FormField({ label, value, onChange, type = "text", options, placeholder }) {
  const [focused, setFocused] = useState(false);
  const base = { width:"100%", background:focused?COLORS.bg.hover:"rgba(255,255,255,0.04)", border:`1px solid ${focused?COLORS.primary.light+"99":"rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"0.72rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", transition:"all 0.2s" };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:"0.75rem", color:"#7C7A99", marginBottom:6, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</label>
      {options ? (
        <select value={value} onChange={onChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ ...base, cursor:"pointer" }}>
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o} style={{ background:COLORS.bg.card }}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={base} />
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

// ✅ Item 13 — LocationID ajouté dans la row
function SignalRow({ signal, last, onEdit, onDelete, onEmergency }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      display:"grid", gridTemplateColumns:"55px 1fr 130px 80px 130px 140px",
      padding:"1rem 1.4rem", borderBottom:last?"none":"1px solid rgba(127,119,221,0.06)",
      background:hov?COLORS.bg.hover:"transparent", alignItems:"center", transition:"background 0.15s",
    }}>
      <span style={{ fontSize:"0.82rem", color:COLORS.text.subtle, fontWeight:600 }}>#{signal.id}</span>
      <span style={{ fontSize:"0.9rem", color:COLORS.text.primary, fontWeight:500 }}>{signal.type}</span>
      <StatusBadge state={signal.etatActuel} />
      {/* ✅ Item 13 — LocationID */}
      <span style={{ fontSize:"0.8rem", color:COLORS.primary.light, fontWeight:500 }}>
        {signal.locationId ? `#${signal.locationId}` : "—"}
      </span>
      <span style={{ fontSize:"0.72rem", color:COLORS.text.muted }}>
        {signal.derniereModification
          ? new Date(signal.derniereModification).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })
          : "—"}
      </span>
      <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
        <ActionBtn onClick={()=>onEdit(signal)}     color={COLORS.primary.light} label="Edit" />
        <ActionBtn onClick={()=>onDelete(signal)}   color={COLORS.accent.coral}  label="Delete" />
        <ActionBtn onClick={()=>onEmergency(signal)} color={COLORS.accent.amber}  label="🚨" />
      </div>
    </div>
  );
}

export default function SignalsDashboard() {
  const navigate = useNavigate();

  const [signals, setSignals]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);
  const [searchType, setSearchType]     = useState("type");
  const [searchVal, setSearchVal]       = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching]       = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [showEdit, setShowEdit]         = useState(null);
  const [showDelete, setShowDelete]     = useState(null);

  const emptyForm = { type:"", etatActuel:"", locationId:"" };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/signals`, { headers:getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      if (res.status === 404) { setSignals([]); return; }
      const data = await res.json();
      setSignals(Array.isArray(data) ? data : []);
    } catch (e) { showToast("Error loading signals", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ✅ Item 14 — Search by SignalType (filtre côté frontend sur les données chargées)
  const handleSearch = async () => {
    const val = searchVal.trim().toUpperCase();
    if (!val) { setSearchResult(null); return; }
    setSearching(true);
    try {
      if (searchType === "type") {
        // Filtre local par type
        const filtered = signals.filter(s => s.type?.toUpperCase().includes(val));
        setSearchResult(filtered);
      } else {
        // Filtre local par état
        const filtered = signals.filter(s => s.etatActuel?.toUpperCase().includes(val));
        setSearchResult(filtered);
      }
      if ((searchResult?.length ?? 0) === 0) showToast("No results found", "error");
    } catch (e) { showToast("Search error", "error"); }
    finally { setSearching(false); }
  };

  const clearSearch = () => { setSearchVal(""); setSearchResult(null); };

  const handleCreate = async () => {
    if (!form.type || !form.etatActuel || !form.locationId) { showToast("Please fill all fields", "error"); return; }
    try {
      const res = await fetch(`${API}/api/admin/newSignal`, {
        method:"POST", headers:getHeaders(),
        body:JSON.stringify({ type:form.type, etatActuel:form.etatActuel, locationId:parseInt(form.locationId) }),
      });
      if (!res.ok) throw new Error();
      showToast("Signal created successfully");
      setShowCreate(false); setForm(emptyForm); fetchAll();
    } catch (e) { showToast("Error creating signal", "error"); }
  };

  const handleUpdate = async () => {
    if (!form.etatActuel) { showToast("Select a state", "error"); return; }
    try {
      // ✅ Backend attend @RequestParam String state — pas un body JSON
      const res = await fetch(`${API}/api/admin/updateSignal/${showEdit.id}?state=${form.etatActuel}`, {
        method:"PUT", headers:getHeaders(),
      });
      if (!res.ok) throw new Error();
      showToast("Signal updated successfully");
      setShowEdit(null); setForm(emptyForm); fetchAll();
    } catch (e) { showToast("Error updating signal", "error"); }
  };

  const handleDelete = async () => {
    // ⚠️ Aucun @DeleteMapping dans SignalRestController
    // Ajoute dans le controller : @DeleteMapping("/api/admin/signal/{id}") public void deleteSignal(@PathVariable Long id) { signalRepository.deleteById(id); }
    showToast("Delete endpoint not implemented in backend", "error");
    setShowDelete(null);
  };

  const handleEmergency = async (signal) => {
    try {
      const res = await fetch(`${API}/api/admin/signalEmergency/${signal.locationId}`, { method:"POST", headers:getHeaders() });
      if (!res.ok) throw new Error();
      showToast("🚨 Emergency protocol activated!");
      fetchAll();
    } catch (e) { showToast("Error activating emergency protocol", "error"); }
  };

  const openEdit = (signal) => {
    setForm({ type:signal.type, etatActuel:signal.etatActuel, locationId:signal.locationId||"" });
    setShowEdit(signal);
  };

  const displayed        = searchResult ?? signals;
  const availableStates  = SIGNAL_STATES[form.type] || [];

  // ✅ Item 14 — Search dropdown avec types anglais
  const searchTypeOptions = searchType === "type" ? SIGNAL_TYPES : [];

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
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Traffic Signals</h1>
            <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>Manage traffic lights and signs</p>
          </div>
          <PrimaryBtn onClick={() => { setForm(emptyForm); setShowCreate(true); }}>+ New Signal</PrimaryBtn>
        </div>

        {/* ✅ Item 15 — Stat cards avec count par type anglais */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:14, marginBottom:"2rem" }}>
          {[
            { label:"Total Signals",  value:signals.length,                                              color:COLORS.primary.light, icon:"🚦" },
            { label:"Traffic Light",  value:signals.filter(s=>s.type==="TRAFFIC_LIGHT").length,          color:COLORS.accent.amber,  icon:"🚦" },
            { label:"VMS Sign",       value:signals.filter(s=>s.type==="VMS_SIGN").length,               color:COLORS.accent.teal,   icon:"📋" },
            { label:"Boom Barrier",   value:signals.filter(s=>s.type==="BOOM_BARRIER").length,           color:COLORS.accent.coral,  icon:"🚧" },
          ].map(stat => <StatCard key={stat.label} {...stat} />)}
        </div>

        {/* ✅ Item 14 — Search by SignalType avec dropdown */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1.2rem 1.4rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", background:COLORS.bg.hover, borderRadius:8, padding:3, gap:2 }}>
            {["type","state"].map(t => (
              <button key={t} onClick={() => { setSearchType(t); clearSearch(); }} style={{
                background:searchType===t?`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`:"transparent",
                color:searchType===t?COLORS.text.primary:COLORS.text.muted,
                border:"none", borderRadius:6, padding:"0.38rem 0.9rem", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit",
              }}>By {t === "type" ? "Type" : "State"}</button>
            ))}
          </div>

          {/* ✅ Si search by type → dropdown avec les types anglais */}
          {searchType === "type" ? (
            <select value={searchVal} onChange={e => setSearchVal(e.target.value)} style={{ flex:1, minWidth:180, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.65rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
              <option value="">-- Select type --</option>
              {SIGNAL_TYPES.map(t => <option key={t} value={t} style={{ background:COLORS.bg.card }}>{t}</option>)}
            </select>
          ) : (
            <input value={searchVal} onChange={e=>setSearchVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()}
              placeholder="Enter state (RED, GREEN, OPENED...)" style={{ flex:1, minWidth:180, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.65rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit" }} />
          )}

          <PrimaryBtn onClick={handleSearch} disabled={searching||!searchVal.trim()}>{searching?"Searching...":"Search"}</PrimaryBtn>
          {searchResult && <button onClick={clearSearch} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.65rem 1rem", fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit" }}>Clear ✕</button>}
        </div>

        {searchResult && <div style={{ marginBottom:"0.75rem", fontSize:"0.8rem", color:COLORS.text.muted }}>{searchResult.length} result{searchResult.length!==1?"s":""} found</div>}

        {/* ✅ Item 13 — Table avec colonne LocationID */}
        <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"55px 1fr 130px 80px 130px 140px", padding:"0.85rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.72rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
            <span>ID</span>
            <span>Type</span>
            <span>State</span>
            <span>Loc.</span>      {/* ✅ Item 13 */}
            <span>Last Update</span>
            <span style={{ textAlign:"right" }}>Actions</span>
          </div>
          {loading ? (
            <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted }}>Loading...</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted }}>No signals found</div>
          ) : (
            displayed.map((s, i) => <SignalRow key={s.id??i} signal={s} last={i===displayed.length-1} onEdit={openEdit} onDelete={setShowDelete} onEmergency={handleEmergency} />)
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Signal" onClose={()=>setShowCreate(false)}>
          {/* ✅ Item 10/11 — Types en anglais */}
          <FormField label="Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value,etatActuel:""})} options={SIGNAL_TYPES} />
          {/* ✅ Item 12 — États selon le type sélectionné */}
          <FormField label="State" value={form.etatActuel} onChange={e=>setForm({...form,etatActuel:e.target.value})} options={availableStates} />
          <FormField label="Location ID" value={form.locationId} onChange={e=>setForm({...form,locationId:e.target.value})} type="number" placeholder="ex: 1" />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={()=>setShowCreate(false)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            <PrimaryBtn onClick={handleCreate} disabled={!form.type||!form.etatActuel||!form.locationId}>Create</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title={`Edit — ${showEdit.type}`} onClose={()=>setShowEdit(null)}>
          <FormField label="State" value={form.etatActuel} onChange={e=>setForm({...form,etatActuel:e.target.value})} options={SIGNAL_STATES[form.type]||[]} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={()=>setShowEdit(null)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            <PrimaryBtn onClick={handleUpdate} disabled={!form.etatActuel}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <Modal title="Delete Signal" onClose={()=>setShowDelete(null)}>
          <p style={{ color:"#9CA3AF", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"1.5rem" }}>
            Are you sure you want to delete signal <span style={{ color:COLORS.text.primary, fontWeight:600 }}>{showDelete.type}</span>?
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