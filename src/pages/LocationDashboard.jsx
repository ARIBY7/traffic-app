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

// ✅ zones prédéfinies de Casablanca
const ZONES = [
  "Ain Chock", "Ain Sebaa", "Anfa", "Ben M'sik", "Bernoussi",
  "Hay Hassani", "Hay Mohammadi", "Maarif", "Medina", "Moulay Rachid",
  "Sidi Belyout", "Sidi Bernoussi", "Sidi Moumen", "Sidi Othmane",
  "Autre",
];

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function GlowOrb({ x, y, color, size = 400, opacity = 0.12 }) {
  return (
    <div style={{
      position: "fixed", left: x, top: y,
      width: size, height: size, borderRadius: "50%",
      background: color, opacity, filter: "blur(100px)",
      pointerEvents: "none", zIndex: 0,
      transform: "translate(-50%,-50%)",
    }} />
  );
}

function Badge({ etat }) {
  const active = etat?.toUpperCase() === "ACTIF";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: active ? `${C.t400}18` : `${C.coral}18`,
      border: `1px solid ${active ? C.t400 : C.coral}44`,
      color: active ? C.t200 : "#F0997B",
      fontSize: "0.72rem", fontWeight: 600,
      padding: "0.22rem 0.7rem", borderRadius: 100,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? C.t400 : C.coral, display: "inline-block" }} />
      {active ? "ACTIF" : "INACTIF"}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bg2,
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16, padding: "2rem",
        width: "100%", maxWidth: 440,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4A4868", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", options }) {
  const [focused, setFocused] = useState(false);
  const base = {
    width: "100%",
    background: focused ? C.bg3 : "rgba(255,255,255,0.04)",
    border: `1px solid ${focused ? C.p400 + "99" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 8, padding: "0.72rem 1rem",
    fontSize: "0.88rem", color: "#f0f0f0",
    outline: "none", fontFamily: "inherit",
    transition: "all 0.2s",
    boxShadow: focused ? `0 0 0 3px ${C.p400}18` : "none",
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: "0.75rem", color: "#7C7A99", marginBottom: 6, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
      {options ? (
        <select value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...base, cursor: "pointer" }}>
          {options.map(o => (
            <option key={o.value ?? o} value={o.value ?? o} style={{ background: C.bg2 }}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={base} />
      )}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: disabled ? "rgba(255,255,255,0.06)"
          : danger ? (hov ? "#b84a25" : C.coral)
          : hov ? C.p400 : `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
        color: disabled ? "#4A4868" : "#fff",
        border: "none", borderRadius: 8, padding: "0.72rem 1.4rem",
        fontSize: "0.88rem", fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.18s",
        boxShadow: hov && !disabled ? `0 0 20px ${danger ? C.coral : C.p400}44` : "none",
      }}>{children}</button>
  );
}

function ActionBtn({ onClick, color, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? color + "22" : "rgba(255,255,255,0.04)",
        border: `1px solid ${hov ? color + "55" : "rgba(255,255,255,0.08)"}`,
        color: hov ? color : "#7C7A99",
        borderRadius: 6, padding: "0.35rem 0.75rem",
        fontSize: "0.78rem", fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
      }}>{label}</button>
  );
}

function SensorRow({ sensor, last, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "60px 1fr 1fr 130px 160px",
        padding: "1rem 1.4rem",
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)",
        background: hov ? C.bg3 : "transparent",
        alignItems: "center", transition: "background 0.15s",
      }}>
      <span style={{ fontSize: "0.82rem", color: "#4A4868", fontWeight: 600 }}>#{sensor.id}</span>
      <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 500 }}>{sensor.name}</span>
      <span style={{ fontSize: "0.85rem", color: "#7C7A99" }}>{sensor.zone}</span>
      <Badge etat={sensor.etat} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <ActionBtn onClick={() => onEdit(sensor)}   color={C.p400}  label="Edit"   />
        <ActionBtn onClick={() => onDelete(sensor)} color={C.coral} label="Delete" />
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

  const emptyForm = { name: "", zone: ZONES[0], etat: "ACTIF" };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── GET ALL — /api/admin/sensors ──
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/sensors`, { headers: getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      setSensors(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── SEARCH ──
  const handleSearch = async () => {
    const val = searchVal.trim();
    if (!val) { setSearchResult(null); return; }
    setSearching(true);
    try {
      let url;
      // ✅ endpoints corrects du backend
      if (searchType === "id")   url = `${API}/api/admin/sensorId/${val}`;
      if (searchType === "name") url = `${API}/api/admin/sensorName/${encodeURIComponent(val)}`;
      if (searchType === "zone") url = `${API}/api/admin/sensorZone/${encodeURIComponent(val)}`;

      const res = await fetch(url, { headers: getHeaders() });

      if (!res.ok) {
        showToast("Aucun résultat trouvé", "error");
        setSearchResult(null);
        return;
      }

      const data = await res.json();
      // id et name retournent un objet, zone retourne une liste
      setSearchResult(Array.isArray(data) ? data : [data]);

    } catch (e) {
      console.error(e);
      showToast("Erreur de recherche", "error");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => { setSearchVal(""); setSearchResult(null); };

  // ── CREATE — POST /api/admin/newSensor ──
  const handleCreate = async () => {
    try {
      const res = await fetch(`${API}/api/admin/newSensor`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast("Location créée avec succès");
      setShowCreate(false); setForm(emptyForm); fetchAll();
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la création", "error");
    }
  };

  // ── UPDATE — PUT /api/admin/sensor/{id} ──
  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API}/api/admin/sensor/${showEdit.id}`, {
        method: "PUT", headers: getHeaders(), body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast("Location mise à jour");
      setShowEdit(null); setForm(emptyForm); fetchAll();
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  // ── DELETE — DELETE /api/admin/sensor/{id} ──
  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/api/admin/sensor/${showDelete.id}`, {
        method: "DELETE", headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast("Location supprimée");
      setShowDelete(null); clearSearch(); fetchAll();
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const openEdit = (sensor) => {
    setForm({ name: sensor.name, zone: sensor.zone, etat: sensor.etat || "ACTIF" });
    setShowEdit(sensor);
  };

  const displayed = searchResult ?? sensors;

  const searchLabels = { name: "Name", id: "ID", zone: "Zone" };
  const searchPlaceholders = {
    name: "Enter location name...",
    id:   "Enter location ID...",
    zone: "Enter zone name...",
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, color: "#f0f0f0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:#7F77DD44;color:#fff;}
        option{background:#110F1E;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#534AB755;border-radius:4px;}
      `}</style>

      <GlowOrb x="10%" y="20%" color={C.p600} size={500} opacity={0.12} />
      <GlowOrb x="90%" y="70%" color={C.p400} size={400} opacity={0.1}  />

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 999,
          background: toast.type === "error" ? `${C.coral}18` : `${C.t400}18`,
          border: `1px solid ${toast.type === "error" ? C.coral : C.t400}55`,
          color: toast.type === "error" ? "#F0997B" : C.t200,
          borderRadius: 10, padding: "0.75rem 1.2rem",
          fontSize: "0.85rem", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.type === "error" ? "⚠" : "✓"} {toast.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: C.bg2, borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", zIndex: 10, padding: "1.5rem 1rem",
      }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: "2.5rem" }}>
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

        {[
          { label: "Dashboard",    icon: "⊞",  path: "/admin"           },
          { label: "Locations",    icon: "📡",  path: "/admin/locations", active: true },
          { label: "Traffic Data", icon: "📊",  path: "/admin/traffic"   },
          { label: "Congestion",   icon: "🧠",  path: "/admin/congestion"},
          { label: "Statistics",   icon: "📈",  path: "/admin/statistics"},
        ].map(item => (
          <div key={item.label} onClick={() => navigate(item.path)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "0.65rem 0.8rem", borderRadius: 8, marginBottom: 4,
            background: item.active ? `${C.p400}18` : "transparent",
            border: item.active ? `1px solid ${C.p400}33` : "1px solid transparent",
            cursor: "pointer", transition: "all 0.18s",
            color: item.active ? C.p200 : "#4A4868",
            fontSize: "0.88rem", fontWeight: item.active ? 600 : 400,
          }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}

        <div style={{ marginTop: "auto" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "1rem" }} />
          <div onClick={() => { localStorage.clear(); navigate("/login"); }}
            onMouseEnter={e => e.currentTarget.style.color = "#F0997B"}
            onMouseLeave={e => e.currentTarget.style.color = "#4A4868"}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.65rem 0.8rem", borderRadius: 8, cursor: "pointer", color: "#4A4868", fontSize: "0.88rem", transition: "color 0.2s" }}>
            <span style={{ fontSize: 15 }}>🚪</span> Logout
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 220, padding: "2.5rem", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.7rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Locations</h1>
            <p style={{ color: "#4A4868", fontSize: "0.88rem", marginTop: 4, fontWeight: 300 }}>Manage your traffic sensor locations</p>
          </div>
          <PrimaryBtn onClick={() => { setForm(emptyForm); setShowCreate(true); }}>+ New Location</PrimaryBtn>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, marginBottom: "2rem" }}>
          {[
            { label: "Total",    value: sensors.length,                                                 color: C.p400  },
            { label: "Active",   value: sensors.filter(s => s.etat?.toUpperCase() === "ACTIF").length,  color: C.t400  },
            { label: "Inactive", value: sensors.filter(s => s.etat?.toUpperCase() !== "ACTIF").length,  color: C.coral },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.bg2, border: "1px solid rgba(255,255,255,0.07)",
              borderTop: `2px solid ${stat.color}`, borderRadius: 12, padding: "1.2rem 1.4rem",
            }}>
              <div style={{ fontSize: "0.72rem", color: "#4A4868", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{
          background: C.bg2, border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "1.2rem 1.4rem",
          marginBottom: "1.5rem",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          {/* TOGGLE */}
          <div style={{ display: "flex", background: C.bg3, borderRadius: 8, padding: 3, gap: 2 }}>
            {["name", "id", "zone"].map(type => (
              <button key={type} onClick={() => { setSearchType(type); clearSearch(); }} style={{
                background: searchType === type ? `linear-gradient(135deg, ${C.p400}, ${C.p600})` : "transparent",
                color: searchType === type ? "#fff" : "#4A4868",
                border: "none", borderRadius: 6, padding: "0.38rem 0.9rem",
                fontSize: "0.82rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
              }}>By {searchLabels[type]}</button>
            ))}
          </div>

          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder={searchPlaceholders[searchType]}
            style={{
              flex: 1, minWidth: 180,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "0.65rem 1rem",
              fontSize: "0.88rem", color: "#f0f0f0",
              outline: "none", fontFamily: "inherit",
            }}
          />

          <PrimaryBtn onClick={handleSearch} disabled={searching || !searchVal.trim()}>
            {searching ? "Searching..." : "Search"}
          </PrimaryBtn>

          {searchResult && (
            <button onClick={clearSearch} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: "#7C7A99", borderRadius: 8, padding: "0.65rem 1rem",
              fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
            }}>Clear ✕</button>
          )}
        </div>

        {/* RESULT COUNT */}
        {searchResult && (
          <div style={{ marginBottom: "0.75rem", fontSize: "0.8rem", color: "#4A4868" }}>
            {searchResult.length} result{searchResult.length !== 1 ? "s" : ""} found
          </div>
        )}

        {/* TABLE */}
        <div style={{ background: C.bg2, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "60px 1fr 1fr 130px 160px",
            padding: "0.85rem 1.4rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "0.72rem", color: "#4A4868",
            textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
          }}>
            <span>ID</span><span>Name</span><span>Zone</span><span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#4A4868", fontSize: "0.88rem" }}>Loading...</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#4A4868", fontSize: "0.88rem" }}>No locations found</div>
          ) : (
            displayed.map((s, i) => (
              <SensorRow key={s.id ?? i} sensor={s} last={i === displayed.length - 1}
                onEdit={openEdit} onDelete={setShowDelete} />
            ))
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <Modal title="New Location" onClose={() => setShowCreate(false)}>
          <FormField label="Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          {/* ✅ Zone = dropdown prédéfini */}
          <FormField label="Zone" value={form.zone}
            onChange={e => setForm({ ...form, zone: e.target.value })}
            options={ZONES} />
          <FormField label="Status" value={form.etat}
            onChange={e => setForm({ ...form, etat: e.target.value })}
            options={["ACTIF", "INACTIF"]} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setShowCreate(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#7C7A99", borderRadius: 8, padding: "0.68rem 1.2rem", fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <PrimaryBtn onClick={handleCreate} disabled={!form.name.trim()}>Create</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <Modal title={`Edit — ${showEdit.name}`} onClose={() => setShowEdit(null)}>
          <FormField label="Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          {/* ✅ Zone = dropdown prédéfini */}
          <FormField label="Zone" value={form.zone}
            onChange={e => setForm({ ...form, zone: e.target.value })}
            options={ZONES} />
          <FormField label="Status" value={form.etat}
            onChange={e => setForm({ ...form, etat: e.target.value })}
            options={["ACTIF", "INACTIF"]} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setShowEdit(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#7C7A99", borderRadius: 8, padding: "0.68rem 1.2rem", fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <PrimaryBtn onClick={handleUpdate} disabled={!form.name.trim()}>Save Changes</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {showDelete && (
        <Modal title="Delete Location" onClose={() => setShowDelete(null)}>
          <p style={{ color: "#9CA3AF", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Are you sure you want to delete <span style={{ color: "#fff", fontWeight: 600 }}>{showDelete.name}</span>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowDelete(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#7C7A99", borderRadius: 8, padding: "0.68rem 1.2rem", fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <PrimaryBtn danger onClick={handleDelete}>Delete</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}