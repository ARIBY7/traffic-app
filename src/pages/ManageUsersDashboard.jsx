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
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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

function StatusBadge({ active }) {
  const isActive = active === true || active === "true" || active === "ACTIF";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:isActive?`${COLORS.accent.teal}18`:`${COLORS.accent.coral}18`, border:`1px solid ${isActive?COLORS.accent.teal:COLORS.accent.coral}44`, color:isActive?COLORS.accent.teal:"#F0997B", fontSize:"0.7rem", fontWeight:700, padding:"0.2rem 0.65rem", borderRadius:100 }}>
      <span style={{ width:4, height:4, borderRadius:"50%", background:isActive?COLORS.accent.teal:COLORS.accent.coral, display:"inline-block" }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ReportStatusBadge({ status }) {
  const map = {
    PENDING:  { color: COLORS.accent.amber, label: "Pending"  },
    APPROVED: { color: COLORS.accent.teal,  label: "Approved" },
    REJECTED: { color: COLORS.accent.coral, label: "Rejected" },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{ background:s.color+"18", border:`1px solid ${s.color}44`, color:s.color, fontSize:"0.7rem", fontWeight:700, padding:"0.2rem 0.65rem", borderRadius:100 }}>
      {s.label}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:COLORS.bg.card, border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, padding:"2rem", width:"100%", maxWidth:wide?620:460, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:700, color:COLORS.text.primary }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:COLORS.text.muted, fontSize:"1.2rem", cursor:"pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── USER PROFILE MODAL ──────────────────────────────────
function UserProfileModal({ user, onClose, reports, onStatusChange, onDelete }) {
  const [details, setDetails]           = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toggling, setToggling]         = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/admin/userDetails/${user.id}`, { headers: getHeaders() });
        if (res.status === 401) { navigate("/login"); return; }
        const d = res.ok ? await res.json() : user;
        setDetails(d);

        const mail = d.mail || user.mail;
        if (mail) {
          const histRes = await fetch(
            `${API}/api/admin/history/user/${encodeURIComponent(mail)}`,
            { headers: getHeaders() }
          );
          if (histRes.ok) {
            const hist = await histRes.json();
            setLoginHistory(Array.isArray(hist) ? hist : []);
          }
        }
      } catch (e) {
        setDetails(user);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id]);

  const handleToggleStatus = async () => {
    const d = details || user;
    const newStatus = !d.active;
    setToggling(true);
    try {
      const res = await fetch(
        `${API}/api/admin/changeStatus/${d.id}?status=${newStatus}`,
        { method: "PUT", headers: getHeaders() }
      );
      if (!res.ok) throw new Error();
      setDetails(prev => ({ ...prev, active: newStatus }));
      onStatusChange(d.id, newStatus);
    } catch (e) {
      console.error("Toggle status failed", e);
    } finally {
      setToggling(false);
    }
  };

  const userReports = reports.filter(r => r.userId === user.id);

  if (loading) {
    return (
      <Modal title="User Profile" onClose={onClose} wide>
        <div style={{ textAlign:"center", padding:"2rem", color:COLORS.text.muted }}>Loading...</div>
      </Modal>
    );
  }

  const d = details || user;
  const lastLogin = loginHistory.length > 0 && loginHistory[0].timestamp
    ? new Date(loginHistory[0].timestamp).toLocaleString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
    : "—";

  return (
    <Modal title="User Profile" onClose={onClose} wide>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:"1.5rem", padding:"1.2rem", background:"rgba(127,119,221,0.06)", borderRadius:12, border:"1px solid rgba(127,119,221,0.12)" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#fff" }}>
          {d.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.05rem", fontWeight:700, color:COLORS.text.primary, marginBottom:2 }}>
            {d.name || "—"}
          </div>
          {/* ✅ Username */}
          {d.username && (
            <div style={{ fontSize:"0.78rem", color:COLORS.primary.light, fontWeight:600, marginBottom:3 }}>
              @{d.username}
            </div>
          )}
          <div style={{ fontSize:"0.78rem", color:COLORS.text.muted, marginBottom:6 }}>{d.mail || "—"}</div>
          <StatusBadge active={d.active} />
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:"0.65rem", color:COLORS.text.subtle, textTransform:"uppercase", fontWeight:600, marginBottom:4 }}>User ID</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:COLORS.primary.light }}>#{d.id}</div>
        </div>
      </div>

      {/* ✅ Info Cards — 6 cases */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:"1.5rem" }}>
        {[
          { label:"Full Name",  value: d.name     || "—" },
          { label:"Username",   value: d.username ? `@${d.username}` : "—", highlight: true },
          { label:"Email",      value: d.mail     || "—" },
          { label:"Status",     value: d.active ? "Active" : "Inactive" },
          { label:"User ID",    value: `#${d.id}` },
          { label:"Last Login", value: lastLogin },
        ].map(info => (
          <div key={info.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"0.75rem 1rem", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:"0.62rem", color:COLORS.text.subtle, textTransform:"uppercase", fontWeight:600, letterSpacing:"0.08em", marginBottom:4 }}>{info.label}</div>
            <div style={{ fontSize:"0.82rem", color: info.highlight ? COLORS.primary.light : COLORS.text.primary, fontWeight:500, wordBreak:"break-all" }}>{info.value}</div>
          </div>
        ))}
      </div>

      {/* Login History */}
      <div style={{ marginBottom:"1.5rem" }}>
        <div style={{ fontSize:"0.78rem", color:COLORS.text.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.75rem" }}>
          🕐 Login History
        </div>
        <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
          {loginHistory.length === 0 ? (
            <div style={{ padding:"1.2rem", textAlign:"center", color:COLORS.text.subtle, fontSize:"0.82rem" }}>No login history found</div>
          ) : (
            loginHistory.slice(0, 5).map((log, i) => {
              const isSuccess = log.status === "SUCCESS";
              const date = log.timestamp
                ? new Date(log.timestamp).toLocaleString("fr-FR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })
                : "—";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"0.65rem 1rem", borderBottom:i===Math.min(loginHistory.length,5)-1?"none":"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:14, color:isSuccess?COLORS.accent.teal:COLORS.accent.coral }}>{isSuccess ? "✓" : "✕"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.8rem", color:COLORS.text.primary, fontWeight:500 }}>{date}</div>
                    <div style={{ fontSize:"0.72rem", color:COLORS.text.muted }}>
                      {log.recentActivity || (isSuccess ? "Login successful" : "Failed attempt")}
                    </div>
                  </div>
                  <div style={{ fontSize:"0.7rem", color:COLORS.text.subtle }}>{log.ipAddress || "—"}</div>
                  <span style={{ fontSize:"0.68rem", fontWeight:700, color:isSuccess?COLORS.accent.teal:COLORS.accent.coral, background:isSuccess?`${COLORS.accent.teal}15`:`${COLORS.accent.coral}15`, padding:"0.15rem 0.5rem", borderRadius:6 }}>
                    {log.status || (isSuccess ? "Success" : "Failed")}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* User Reports */}
      {userReports.length > 0 && (
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ fontSize:"0.78rem", color:COLORS.text.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.75rem" }}>
            📢 Reports ({userReports.length})
          </div>
          <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
            {userReports.map((r, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"0.65rem 1rem", borderBottom:i===userReports.length-1?"none":"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize:"0.72rem", color:COLORS.text.subtle }}>#{r.id}</span>
                <span style={{ fontSize:"0.8rem", color:COLORS.text.primary, flex:1 }}>{r.type}</span>
                <ReportStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Actions modal : Close | Disable/Enable | 🗑 Delete */}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:"1rem", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onClose} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.65rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>
          Close
        </button>
        <button
          onClick={handleToggleStatus}
          disabled={toggling}
          style={{
            background: d.active ? `${COLORS.accent.coral}18` : `${COLORS.accent.teal}18`,
            border: `1px solid ${d.active ? COLORS.accent.coral : COLORS.accent.teal}55`,
            color: d.active ? "#F0997B" : COLORS.accent.teal,
            borderRadius:8, padding:"0.65rem 1.2rem", fontSize:"0.88rem", fontWeight:600,
            cursor: toggling ? "not-allowed" : "pointer", fontFamily:"inherit",
          }}
        >
          {toggling ? "..." : d.active ? "🔒 Disable" : "✅ Enable"}
        </button>
        {/* ✅ Delete reste ici dans le modal */}
        <button
          onClick={() => { onDelete(d); onClose(); }}
          style={{ background:COLORS.accent.coral, color:"#fff", border:"none", borderRadius:8, padding:"0.65rem 1.2rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
        >
          🗑 Delete
        </button>
      </div>
    </Modal>
  );
}

// ── CONFIRM DELETE MODAL ─────────────────────────────────
function DeleteModal({ user, onClose, onConfirm }) {
  return (
    <Modal title="Delete User" onClose={onClose}>
      <p style={{ color:"#9CA3AF", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"1.5rem" }}>
        Are you sure you want to delete <span style={{ color:COLORS.text.primary, fontWeight:600 }}>{user.name}</span>?
        This action cannot be undone.
      </p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.68rem 1.2rem", fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
        <button onClick={() => onConfirm(user)} style={{ background:COLORS.accent.coral, color:"#fff", border:"none", borderRadius:8, padding:"0.68rem 1.4rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
      </div>
    </Modal>
  );
}

// ── MAIN ────────────────────────────────────────────────
export default function ManageUsersDashboard() {
  const navigate = useNavigate();

  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);
  const [searchVal, setSearchVal]       = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching]       = useState(false);
  const [viewUser, setViewUser]         = useState(null);
  const [showDelete, setShowDelete]     = useState(null);
  const [reports, setReports]           = useState([]);
  const [activeTab, setActiveTab]       = useState("users");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ✅ filtre status

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: getHeaders() });
      if (res.status === 401) { navigate("/login"); return; }
      if (res.status === 403) { showToast("Access denied — Admin only", "error"); setLoading(false); return; }
      if (!res.ok) { showToast(`Error ${res.status}`, "error"); setLoading(false); return; }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API}/api/admin/reports`, { headers:getHeaders() });
      if (!res.ok) throw new Error();
      setReports(await res.json());
    } catch (e) {
      setReports([
        { id:1, userId:null, userName:"Ahmed Bennali", type:"ACCIDENT",   locationId:1, date:"2026-04-28T10:30:00", status:"PENDING"  },
        { id:2, userId:null, userName:"Sara El Fassi", type:"SATURATION", locationId:2, date:"2026-04-28T11:15:00", status:"APPROVED" },
        { id:3, userId:null, userName:"Youssef Alami", type:"TRAFIC",     locationId:3, date:"2026-04-27T14:00:00", status:"PENDING"  },
      ]);
    }
  };

  useEffect(() => { fetchAll(); fetchReports(); }, []);

  const handleStatusChange = (userId, newStatus) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: newStatus } : u));
    if (searchResult) setSearchResult(prev => prev.map(u => u.id === userId ? { ...u, active: newStatus } : u));
    showToast(newStatus ? "User enabled ✅" : "User disabled 🔒");
  };

  const handleToggleFromTable = async (user) => {
    const newStatus = !user.active;
    try {
      const res = await fetch(
        `${API}/api/admin/changeStatus/${user.id}?status=${newStatus}`,
        { method: "PUT", headers: getHeaders() }
      );
      if (!res.ok) throw new Error();
      handleStatusChange(user.id, newStatus);
    } catch (e) {
      showToast("Erreur lors du changement de statut", "error");
    }
  };

  const handleDelete = async (user) => {
    try {
      const res = await fetch(`${API}/api/admin/user/${user.id}`, { method:"DELETE", headers:getHeaders() });
      if (!res.ok) throw new Error();
      showToast("User deleted");
      setShowDelete(null);
      fetchAll();
    } catch (e) {
      showToast("Error deleting", "error");
    }
  };

  const handleSearch = async () => {
    const val = searchVal.trim();
    if (!val) { setSearchResult(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API}/api/users/name/${encodeURIComponent(val)}`, { headers:getHeaders() });
      if (!res.ok) { showToast("No user found", "error"); setSearchResult(null); return; }
      const data = await res.json();
      setSearchResult(Array.isArray(data) ? data : [data]);
    } catch (e) { showToast("Error", "error"); }
    finally { setSearching(false); }
  };

  const clearSearch = () => { setSearchVal(""); setSearchResult(null); };

  const handleReportAction = async (reportId, action) => {
    try {
      await fetch(`${API}/api/admin/reports/${reportId}/${action}`, { method:"PUT", headers:getHeaders() });
    } catch (e) { /* mock */ }
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED" } : r));
    showToast(`Report ${action === "approve" ? "approved ✓" : "rejected ✕"}`);
  };

  // ✅ Filtre status appliqué sur la liste
  const baseList   = searchResult ?? users;
  const displayed  = statusFilter === "ALL"
    ? baseList
    : statusFilter === "ACTIVE"
      ? baseList.filter(u => u.active === true)
      : baseList.filter(u => u.active === false);
  const pendingReports = reports.filter(r => r.status === "PENDING").length;
  const causeIcon      = { ACCIDENT:"🚨", SATURATION:"🚗", TRAFIC:"🛣️" };

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

        <div style={{ marginBottom:"2rem" }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.7rem", fontWeight:800, color:COLORS.text.primary, letterSpacing:"-0.5px" }}>Manage Users</h1>
          <p style={{ color:COLORS.text.muted, fontSize:"0.88rem", marginTop:4, fontWeight:300 }}>User accounts and report validation</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:14, marginBottom:"2rem" }}>
          {[
            { label:"Total Users",     value:users.length,                            color:COLORS.primary.light, icon:"👥" },
            { label:"Active",          value:users.filter(u=>u.active===true).length,  color:COLORS.accent.teal,  icon:"✅" },
            { label:"Inactive",        value:users.filter(u=>u.active===false).length, color:COLORS.accent.coral, icon:"🔒" },
            { label:"Pending Reports", value:pendingReports,                           color:COLORS.accent.amber,  icon:"📋" },
          ].map(s => <StatCard key={s.label} label={s.label} value={s.value} color={s.color} icon={s.icon} />)}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:COLORS.bg.hover, borderRadius:10, padding:4, gap:3, marginBottom:"1.5rem", width:"fit-content" }}>
          {[
            { key:"users",   label:"👥 Users" },
            { key:"reports", label:`📋 Reports${pendingReports>0?` (${pendingReports})`:""}`},
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background:activeTab===tab.key?`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`:"transparent",
              color:activeTab===tab.key?COLORS.text.primary:COLORS.text.muted,
              border:"none", borderRadius:7, padding:"0.5rem 1.2rem", fontSize:"0.85rem",
              fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ── TAB USERS ── */}
        {activeTab === "users" && (
          <>
            <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, padding:"1rem 1.4rem", marginBottom:"1.2rem", display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:"0.78rem", color:COLORS.text.muted, fontWeight:600, whiteSpace:"nowrap" }}>🔍 Search by name</span>
              <input value={searchVal} onChange={e=>setSearchVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()}
                placeholder="Enter user name..." style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.88rem", color:COLORS.text.primary, outline:"none", fontFamily:"inherit" }} />
              <button onClick={handleSearch} disabled={searching||!searchVal.trim()} style={{ background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`, color:"#fff", border:"none", borderRadius:8, padding:"0.6rem 1.2rem", fontSize:"0.85rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                {searching ? "..." : "Search"}
              </button>
              {searchResult && <button onClick={clearSearch} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#7C7A99", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit" }}>Clear ✕</button>}
              {/* ✅ Dropdown filtre par status */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ background:COLORS.bg.hover, border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.6rem 1rem", fontSize:"0.85rem", color:statusFilter==="ALL"?COLORS.text.muted:statusFilter==="ACTIVE"?COLORS.accent.teal:"#F0997B", outline:"none", fontFamily:"inherit", cursor:"pointer" }}
              >
                <option value="ALL"      style={{ background:COLORS.bg.card, color:"#fff" }}>All Users</option>
                <option value="ACTIVE"   style={{ background:COLORS.bg.card, color:"#1D9E75" }}>✅ Active</option>
                <option value="INACTIVE" style={{ background:COLORS.bg.card, color:"#F0997B" }}>🔒 Inactive</option>
              </select>
            </div>

            {searchResult && <div style={{ marginBottom:"0.75rem", fontSize:"0.8rem", color:COLORS.text.muted }}>{searchResult.length} result{searchResult.length!==1?"s":""} found</div>}

            {/* ✅ Table — ID | Name | Email | Status | Actions (View + Disable/Enable) */}
            <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"55px 1fr 1fr 90px 170px", padding:"0.8rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.68rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
                <span>ID</span>
                <span>Name</span>
                <span>Email</span>
                <span>Status</span>
                <span style={{ textAlign:"right" }}>Actions</span>
              </div>

              {loading ? (
                <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted }}>Loading...</div>
              ) : displayed.length === 0 ? (
                <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted }}>No users found</div>
              ) : (
                displayed.map((u, i) => (
                  <div key={u.id??i} style={{ display:"grid", gridTemplateColumns:"55px 1fr 1fr 90px 170px", padding:"0.9rem 1.4rem", borderBottom:i===displayed.length-1?"none":"1px solid rgba(127,119,221,0.06)", alignItems:"center" }}>
                    <span style={{ fontSize:"0.8rem", color:COLORS.text.subtle, fontWeight:600 }}>#{u.id}</span>

                    {/* Name + username */}
                    <div>
                      <div style={{ fontSize:"0.88rem", color:COLORS.text.primary, fontWeight:500 }}>{u.name}</div>
                      {u.username && <div style={{ fontSize:"0.7rem", color:COLORS.primary.light, marginTop:1 }}>@{u.username}</div>}
                    </div>

                    {/* ✅ Email */}
                    <span style={{ fontSize:"0.8rem", color:COLORS.text.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {u.mail || "—"}
                    </span>

                    <StatusBadge active={u.active} />

                    {/* ✅ View + Disable ou Enable — PAS de Delete ici */}
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                      <button onClick={() => setViewUser(u)} style={{ background:`${COLORS.primary.light}18`, border:`1px solid ${COLORS.primary.light}44`, color:COLORS.primary.light, borderRadius:6, padding:"0.28rem 0.75rem", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        View
                      </button>
                      {u.active ? (
                        <button onClick={() => handleToggleFromTable(u)} style={{ background:`${COLORS.accent.coral}18`, border:`1px solid ${COLORS.accent.coral}44`, color:"#F0997B", borderRadius:6, padding:"0.28rem 0.75rem", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                          🔒 Disable
                        </button>
                      ) : (
                        <button onClick={() => handleToggleFromTable(u)} style={{ background:`${COLORS.accent.teal}18`, border:`1px solid ${COLORS.accent.teal}44`, color:COLORS.accent.teal, borderRadius:6, padding:"0.28rem 0.75rem", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                          ✅ Enable
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── TAB REPORTS ── */}
        {activeTab === "reports" && (
          <div style={{ background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.1)", borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"0.85rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"0.95rem", fontWeight:700, color:COLORS.text.primary }}>Incident Reports ({reports.length})</span>
              <span style={{ fontSize:"0.75rem", color:COLORS.text.subtle }}>Approve or reject user-submitted reports</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"55px 1fr 110px 120px 110px 160px", padding:"0.7rem 1.4rem", borderBottom:"1px solid rgba(127,119,221,0.06)", fontSize:"0.65rem", color:COLORS.text.subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>
              <span>ID</span><span>User</span><span>Type</span><span>Date</span><span>Status</span><span style={{ textAlign:"right" }}>Action</span>
            </div>
            {reports.length === 0 ? (
              <div style={{ padding:"3rem", textAlign:"center", color:COLORS.text.muted }}>No reports yet</div>
            ) : (
              reports.map((r, i) => (
                <div key={r.id} style={{ display:"grid", gridTemplateColumns:"55px 1fr 110px 120px 110px 160px", padding:"0.85rem 1.4rem", borderBottom:i===reports.length-1?"none":"1px solid rgba(127,119,221,0.06)", alignItems:"center" }}>
                  <span style={{ fontSize:"0.78rem", color:COLORS.text.subtle, fontWeight:600 }}>#{r.id}</span>
                  <div>
                    <div style={{ fontSize:"0.85rem", color:COLORS.text.primary, fontWeight:500 }}>{r.userName || `User #${r.userId}`}</div>
                    <div style={{ fontSize:"0.7rem", color:COLORS.text.subtle }}>Zone #{r.locationId}</div>
                  </div>
                  <span style={{ fontSize:"0.8rem" }}>{causeIcon[r.type]||"📋"} {r.type}</span>
                  <span style={{ fontSize:"0.72rem", color:COLORS.text.muted }}>{r.date?new Date(r.date).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"}</span>
                  <ReportStatusBadge status={r.status} />
                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                    {r.status === "PENDING" ? (
                      <>
                        <button onClick={() => handleReportAction(r.id,"approve")} style={{ background:`${COLORS.accent.teal}18`, border:`1px solid ${COLORS.accent.teal}44`, color:COLORS.accent.teal, borderRadius:6, padding:"0.28rem 0.7rem", fontSize:"0.72rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✓ Approve</button>
                        <button onClick={() => handleReportAction(r.id,"reject")}  style={{ background:`${COLORS.accent.coral}18`, border:`1px solid ${COLORS.accent.coral}44`, color:"#F0997B", borderRadius:6, padding:"0.28rem 0.7rem", fontSize:"0.72rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✕ Reject</button>
                      </>
                    ) : (
                      <span style={{ fontSize:"0.72rem", color:COLORS.text.subtle, fontStyle:"italic" }}>Processed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ✅ Profile Modal — avec Delete à côté de Close */}
      {viewUser && (
        <UserProfileModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          reports={reports}
          onStatusChange={handleStatusChange}
          onDelete={(u) => { setViewUser(null); setShowDelete(u); }}
        />
      )}

      {/* ✅ Confirm Delete séparé */}
      {showDelete && (
        <DeleteModal
          user={showDelete}
          onClose={() => setShowDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}