import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const COLORS = {
  primary: { light: "#7F77DD", dark: "#534AB7" },
  accent: { teal: "#1D9E75", coral: "#D85A30", amber: "#EF9F27" },
  bg: { main: "#09080F", card: "#110F1E", hover: "#17142A" },
  text: { primary: "#FFFFFF", muted: "#4A4268", subtle: "#3A3660" },
};
const API = "http://localhost:8081";
const NIVEAUX = ["BLOCKED", "HEAVY", "MODERATE", "LOW"];

const ZONE_COORDS = {
  "Ain Chock":[33.5366,-7.5731],"Ain Sebaa":[33.6089,-7.5314],"Anfa":[33.5910,-7.6580],
  "Ben M'sik":[33.5534,-7.5514],"Ben Msik":[33.5534,-7.5514],"Bernoussi":[33.6203,-7.5108],
  "Hay Hassani":[33.5667,-7.6833],"Hay Mohammadi":[33.5731,-7.5614],"Maarif":[33.5856,-7.6364],
  "Medina":[33.5992,-7.6189],"Moulay Rachid":[33.5411,-7.5689],"Sidi Belyout":[33.5975,-7.6253],
  "Sidi Bernoussi":[33.6072,-7.5086],"Sidi Moumen":[33.5897,-7.5136],"Sidi Othmane":[33.5692,-7.5786],
  "Corniche Ain Diab":[33.5987,-7.6908],
};
const CASABLANCA_CENTER = [33.5892, -7.6114];

function getHeaders() {
  const t = localStorage.getItem("token");
  return { "Content-Type":"application/json", ...(t?{Authorization:`Bearer ${t}`}:{}) };
}
function getMailFromToken() {
  try { const p=JSON.parse(atob(localStorage.getItem("token").split(".")[1])); return p.sub||p.email||p.mail||null; } catch{return null;}
}

function niveauColor(n) {
  return {BLOCKED:"#D85A30",HEAVY:"#E24B4A",MODERATE:"#EF9F27",LOW:"#1D9E75"}[n?.toUpperCase()]||"#7F77DD";
}
function niveauLabel(n) {
  return {BLOCKED:"Blocked",HEAVY:"Heavy",MODERATE:"Moderate",LOW:"Low"}[n?.toUpperCase()]||n||"—";
}

// ── Fly to location on map ──
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 15, {duration:1.2}); }, [position]);
  return null;
}

function createSensorIcon(color, size=20) {
  return L.divIcon({
    className:"",
    html:`<div style="width:${size}px;height:${size}px;background:${color};border:3px solid rgba(255,255,255,0.9);border-radius:50%;box-shadow:0 2px 12px ${color}88;"></div>`,
    iconSize:[size,size], iconAnchor:[size/2,size/2], popupAnchor:[0,-size/2],
  });
}
function createUserIcon() {
  return L.divIcon({
    className:"",
    html:`<div style="width:28px;height:28px;background:#7F77DD;border:4px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(127,119,221,0.3),0 4px 16px rgba(0,0,0,0.5);"></div>`,
    iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-16],
  });
}

function GlowOrb({ x, y, color, size=400, opacity=0.07 }) {
  return <div style={{ position:"fixed", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, opacity, filter:"blur(110px)", pointerEvents:"none", zIndex:0, transform:"translate(-50%,-50%)" }} />;
}

const REPORT_TYPES = [
  { value:"ACCIDENT",   label:"Accident",       icon:"🚨", color:"#D85A30" },
  { value:"SATURATION", label:"Saturation",     icon:"🚗", color:"#EF9F27" },
  { value:"TRAFIC",     label:"Dense Traffic",  icon:"🛣️", color:"#7F77DD" },
];
const NIVEAUX_REPORT = ["LOW","MODERATE","HEAVY","BLOCKED"];

// ── Congestion MiniBar ──
function MiniBar({ label, value, max, color }) {
  const pct = max>0 ? Math.min((value/max)*100,100) : 0;
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:"0.68rem", color:"#9CA3AF" }}>{label}</span>
        <span style={{ fontSize:"0.68rem", color, fontWeight:700 }}>{value}</span>
      </div>
      <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:100, transition:"width 0.6s" }} />
      </div>
    </div>
  );
}

export default function UserPage() {
  const navigate = useNavigate();
  const [profile,     setProfile]     = useState(null);
  const [sensors,     setSensors]     = useState([]);
  const [signals,     setSignals]     = useState([]);
  const [congestions, setCongestions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);
  const [pulse,       setPulse]       = useState(true);

  // Map
  const [userPosition,  setUserPosition]  = useState(null);
  const [locating,      setLocating]      = useState(false);
  const [nearestSensor, setNearestSensor] = useState(null);
  const [flyTo,         setFlyTo]         = useState(null);
  const [mapStyle,      setMapStyle]      = useState("dark"); // dark | standard | satellite

  // Search
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Selected zone panel
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [zoneDetail,     setZoneDetail]     = useState(null);
  const [loadingZone,    setLoadingZone]    = useState(false);

  // Report
  const [reportOpen,     setReportOpen]     = useState(false);
  const [reportZoneId,   setReportZoneId]   = useState("");
  const [reportSignalId, setReportSignalId] = useState("");
  const [reportType,     setReportType]     = useState("ACCIDENT");
  const [reportNiveau,   setReportNiveau]   = useState("MODERATE");
  const [reporting,      setReporting]      = useState(false);
  const [reportSuccess,  setReportSuccess]  = useState(false);

  // Favorites (localStorage)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fav_zones")||"[]"); } catch{return [];}
  });

  const showToast = (msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3500);
  };

  useEffect(() => { const t=setInterval(()=>setPulse(v=>!v),1200); return()=>clearInterval(t); },[]);

  useEffect(()=>{
    fetch(`${API}/api/user/profile`,{headers:getHeaders()})
      .then(r=>{ if(r.status===401){navigate("/login");return null;} return r.ok?r.json():null; })
      .then(d=>{ if(d) setProfile(d); }).catch(console.error);
  },[]);

  useEffect(()=>{
    const loadAll = async () => {
      setLoading(true);
      try {
        const [sensRes, sigRes, ...congResults] = await Promise.allSettled([
          fetch(`${API}/api/users/sensors`,{headers:getHeaders()}).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/users/signals`,{headers:getHeaders()}).then(r=>r.ok?r.json():[]),
          ...NIVEAUX.map(n=>fetch(`${API}/api/users/congestions/niveau/${n}`,{headers:getHeaders()}).then(r=>r.ok?r.json():[]).catch(()=>[])),
        ]);
        setSensors(Array.isArray(sensRes.value)?sensRes.value:[]);
        setSignals(Array.isArray(sigRes.value)?sigRes.value:[]);
        const combined = congResults.flatMap(r=>r.status==="fulfilled"&&Array.isArray(r.value)?r.value:[]);
        const unique = Array.from(new Map(combined.map(c=>[c.id,c])).values())
          .sort((a,b)=>new Date(b.heureDate)-new Date(a.heureDate));
        setCongestions(unique);
      } catch(e){console.error(e);}
      finally{setLoading(false);}
    };
    loadAll();
  },[]);

  // ── Zone detail panel ──
  const openZonePanel = async (sensor) => {
    setSelectedSensor(sensor);
    setLoadingZone(true);
    setZoneDetail(null);
    try {
      const res = await fetch(`${API}/api/users/congestions/latestOflocation/${sensor.id}`,{headers:getHeaders()});
      if(res.ok) setZoneDetail(await res.json());
    } catch(e){}
    setLoadingZone(false);
  };

  // ── Geolocation ──
  const haversine=(lat1,lon1,lat2,lon2)=>{
    const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  };

  const handleLocateMe = () => {
    if(!navigator.geolocation){showToast("Geolocation not supported","error");return;}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos=>{
      const{latitude:lat,longitude:lng}=pos.coords;
      setUserPosition([lat,lng]); setFlyTo([lat,lng]);
      let closest=null,minDist=Infinity;
      sensors.forEach(s=>{
        const c=getSensorCoords(s);
        const d=haversine(lat,lng,c[0],c[1]);
        if(d<minDist){minDist=d;closest={sensor:s,dist:d,coords:c};}
      });
      if(closest){
        setNearestSensor(closest);
        const cong=getCongestion(closest.sensor.id);
        if(cong&&["BLOCKED","HEAVY"].includes(cong.niveau?.toUpperCase()))
          showToast(`⚠ Heavy traffic near you — ${closest.sensor.name||"nearby zone"}!`,"error");
        else
          showToast(`📍 Nearest: ${closest.sensor.name||"Zone #"+closest.sensor.id} — ${closest.dist.toFixed(1)} km`);
      }
      setLocating(false);
    },()=>{showToast("Location access denied","error");setLocating(false);});
  };

  // ── Search zones ──
  useEffect(()=>{
    if(!searchQuery.trim()){setSearchResults([]);return;}
    const q=searchQuery.toLowerCase();
    setSearchResults(sensors.filter(s=>(s.name||"").toLowerCase().includes(q)||(s.zone||"").toLowerCase().includes(q)).slice(0,5));
  },[searchQuery,sensors]);

  const selectSearchResult = (sensor) => {
    const coords=getSensorCoords(sensor);
    setFlyTo(coords);
    openZonePanel(sensor);
    setSearchQuery(""); setSearchResults([]);
  };

  // ── Favorites ──
  const toggleFavorite = (sensorId) => {
    const next = favorites.includes(sensorId)
      ? favorites.filter(id=>id!==sensorId)
      : [...favorites,sensorId];
    setFavorites(next);
    localStorage.setItem("fav_zones",JSON.stringify(next));
  };

  // ── Report ──
  const handleReport = async () => {
    if(!reportZoneId){showToast("Select a zone","error");return;}
    if(!reportSignalId){showToast("Select a signal","error");return;}
    setReporting(true);
    try {
      const res=await fetch(`${API}/api/user/report-congestion`,{
        method:"POST",headers:getHeaders(),
        body:JSON.stringify({mail:getMailFromToken(),locationId:parseInt(reportZoneId),signalId:parseInt(reportSignalId),cause:reportType,niveau:reportNiveau}),
      });
      if(!res.ok) throw new Error();
      setReportSuccess(true); showToast("✅ Report submitted!");
      setReportZoneId(""); setReportSignalId(""); setReportType("ACCIDENT"); setReportNiveau("MODERATE");
      setTimeout(()=>{setReportSuccess(false);setReportOpen(false);},2000);
    } catch{showToast("Error submitting report","error");}
    finally{setReporting(false);}
  };

  const getSensorCoords = (s) => {
    if(s.zoneLatitude&&s.zoneLongitude) return[parseFloat(s.zoneLatitude),parseFloat(s.zoneLongitude)];
    if(s.zone&&ZONE_COORDS[s.zone]) return ZONE_COORDS[s.zone];
    const seed=(s.id||1)*7919;
    return[CASABLANCA_CENTER[0]+((seed%100)-50)/1000,CASABLANCA_CENTER[1]+((seed%137)-68)/1000];
  };
  const getCongestion = (id) => congestions.find(c=>c.locationId===id);

  const counts=NIVEAUX.reduce((a,n)=>{a[n]=congestions.filter(c=>c.niveau?.toUpperCase()===n).length;return a},{});
  const displayInitial=(profile?.name||"U")[0]?.toUpperCase();
  const signalsForZone=signals.filter(s=>String(s.locationId)===String(reportZoneId));

  // Map tiles
  const MAP_TILES = {
    dark:      { url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution:"© CartoDB" },
    standard:  { url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",             attribution:"© OpenStreetMap" },
  };
  const tile = MAP_TILES[mapStyle] || MAP_TILES.dark;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:COLORS.bg.main, color:COLORS.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .leaflet-container{border-radius:0;}
        .leaflet-popup-content-wrapper{background:#110F1E!important;border:1px solid rgba(127,119,221,0.3)!important;border-radius:12px!important;color:white!important;box-shadow:0 12px 40px rgba(0,0,0,0.7)!important;}
        .leaflet-popup-tip{background:#110F1E!important;}
        .leaflet-popup-content{margin:14px 18px!important;}
        .leaflet-control-zoom{border:1px solid rgba(127,119,221,0.2)!important;border-radius:10px!important;overflow:hidden;}
        .leaflet-control-zoom a{background:#110F1E!important;color:#7F77DD!important;border:none!important;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(127,119,221,0.3);border-radius:4px;}
        select option{background:#110F1E;}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ripple{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2.5);opacity:0}}
      `}</style>

      <GlowOrb x="10%" y="15%" color={COLORS.primary.dark} size={500} opacity={0.1} />
      <GlowOrb x="85%" y="70%" color={COLORS.accent.coral} size={400} opacity={0.07} />

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:"1.2rem", right:"1.2rem", zIndex:9999, background:toast.type==="error"?`${COLORS.accent.coral}18`:`${COLORS.accent.teal}18`, border:`1px solid ${toast.type==="error"?COLORS.accent.coral:COLORS.accent.teal}55`, color:toast.type==="error"?"#F0997B":COLORS.accent.teal, borderRadius:12, padding:"0.8rem 1.2rem", fontSize:"0.88rem", fontWeight:500, display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(12px)", animation:"fadeSlide 0.3s ease" }}>
          {toast.type==="error"?"⚠":"✓"} {toast.msg}
        </div>
      )}

      {/* ── NAVBAR ── */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:58, background:"rgba(17,15,30,0.92)", borderBottom:"1px solid rgba(127,119,221,0.12)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem", zIndex:200 }}>

        {/* Logo + LIVE */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <img src="/logo.png" alt="TrafficIQ"
              onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}
              style={{ width:30,height:30,borderRadius:8,objectFit:"cover" }} />
            <div style={{ display:"none",width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`,alignItems:"center",justifyContent:"center",fontSize:14 }}>🚦</div>
            <span style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1rem",color:COLORS.text.primary }}>TrafficIQ</span>
          </div>
          <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:`${COLORS.accent.teal}15`,border:`1px solid ${COLORS.accent.teal}35`,borderRadius:100,padding:"0.15rem 0.6rem" }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:COLORS.accent.teal,transform:`scale(${pulse?1:0.6})`,transition:"transform 0.5s ease" }} />
            <span style={{ fontSize:"0.65rem",color:COLORS.accent.teal,fontWeight:600 }}>LIVE</span>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ flex:1, maxWidth:360, margin:"0 1.5rem", position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", background:COLORS.bg.hover, border:"1px solid rgba(127,119,221,0.2)", borderRadius:10, padding:"0.45rem 0.9rem", gap:8 }}>
            <span style={{ fontSize:14, opacity:0.5 }}>🔍</span>
            <input
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Search a zone..."
              style={{ background:"none", border:"none", outline:"none", color:COLORS.text.primary, fontSize:"0.85rem", fontFamily:"inherit", flex:1, width:"100%" }}
            />
            {searchQuery && <span onClick={()=>setSearchQuery("")} style={{ cursor:"pointer", opacity:0.5, fontSize:14 }}>✕</span>}
          </div>
          {searchResults.length > 0 && (
            <div style={{ position:"absolute", top:"calc(100%+6px)", left:0, right:0, background:COLORS.bg.card, border:"1px solid rgba(127,119,221,0.2)", borderRadius:10, overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.5)", zIndex:999, animation:"fadeSlide 0.2s ease" }}>
              {searchResults.map((s,i)=>{
                const cong=getCongestion(s.id);
                const color=cong?niveauColor(cong.niveau):COLORS.text.subtle;
                return (
                  <div key={s.id} onClick={()=>selectSearchResult(s)}
                    style={{ display:"flex",alignItems:"center",gap:12,padding:"0.75rem 1rem",borderBottom:i<searchResults.length-1?"1px solid rgba(255,255,255,0.04)":"none",cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background=COLORS.bg.hover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ width:8,height:8,borderRadius:"50%",background:color,flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:"0.85rem",color:COLORS.text.primary,fontWeight:500 }}>{s.name||`Zone #${s.id}`}</div>
                      <div style={{ fontSize:"0.7rem",color:COLORS.text.subtle }}>{s.zone||""} {cong?`· ${niveauLabel(cong.niveau)}`:""}</div>
                    </div>
                    <div style={{ marginLeft:"auto",fontSize:"0.7rem",color:color,fontWeight:600 }}>{cong?niveauLabel(cong.niveau):"No data"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Avatar + actions */}
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <button onClick={()=>setReportOpen(true)}
            style={{ background:`${COLORS.accent.coral}18`,border:`1px solid ${COLORS.accent.coral}44`,color:"#F0997B",borderRadius:8,padding:"0.4rem 0.85rem",fontSize:"0.78rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5 }}>
            🚨 Report
          </button>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:800,color:"#fff" }}>
              {displayInitial}
            </div>
            <div style={{ lineHeight:1.2 }}>
              <div style={{ fontSize:"0.8rem",fontWeight:600,color:COLORS.text.primary }}>{profile?.name||"..."}</div>
              <div style={{ fontSize:"0.62rem",color:COLORS.primary.light }}>{profile?.username?`@${profile.username}`:"user"}</div>
            </div>
          </div>
          <button onClick={()=>{localStorage.clear();navigate("/");}}
            onMouseEnter={e=>e.currentTarget.style.color="#F0997B"}
            onMouseLeave={e=>e.currentTarget.style.color=COLORS.text.muted}
            style={{ background:"transparent",border:"1px solid rgba(255,255,255,0.08)",color:COLORS.text.muted,borderRadius:8,padding:"0.4rem 0.75rem",fontSize:"0.78rem",cursor:"pointer",fontFamily:"inherit",transition:"color 0.15s" }}>
            ⎋
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ paddingTop:58, display:"grid", gridTemplateColumns:"1fr 340px", height:"calc(100vh - 58px)" }}>

        {/* ── MAP (full height) ── */}
        <div style={{ position:"relative", overflow:"hidden" }}>

          {/* Map controls overlay */}
          <div style={{ position:"absolute", top:14, left:14, zIndex:500, display:"flex", flexDirection:"column", gap:8 }}>

            {/* Locate Me */}
            <button onClick={handleLocateMe} disabled={locating}
              style={{ background:locating?"rgba(127,119,221,0.2)":`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`,color:"#fff",border:"none",borderRadius:10,padding:"0.55rem 1rem",fontSize:"0.8rem",fontWeight:600,cursor:locating?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 16px rgba(0,0,0,0.4)",backdropFilter:"blur(8px)" }}>
              {locating?"⏳":"📍"} {locating?"Locating...":"Locate Me"}
            </button>

            {/* Map style toggle */}
            <div style={{ background:"rgba(17,15,30,0.85)",border:"1px solid rgba(127,119,221,0.2)",borderRadius:10,overflow:"hidden",backdropFilter:"blur(8px)" }}>
              {["dark","standard"].map(s=>(
                <button key={s} onClick={()=>setMapStyle(s)}
                  style={{ display:"block",width:"100%",padding:"0.45rem 0.9rem",background:mapStyle===s?`${COLORS.primary.light}22`:"transparent",color:mapStyle===s?COLORS.primary.light:COLORS.text.muted,border:"none",fontSize:"0.75rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s",textTransform:"capitalize" }}>
                  {s==="dark"?"🌑 Dark":"🗺️ Standard"}
                </button>
              ))}
            </div>
          </div>

          {/* Nearest zone banner */}
          {nearestSensor && (() => {
            const cong=getCongestion(nearestSensor.sensor.id);
            const color=cong?niveauColor(cong.niveau):COLORS.primary.light;
            return (
              <div style={{ position:"absolute", bottom:14, left:14, right:14, zIndex:500, background:"rgba(17,15,30,0.9)", border:`1px solid ${color}44`, borderRadius:12, padding:"0.8rem 1.1rem", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", gap:12, animation:"fadeSlide 0.3s ease" }}>
                <div style={{ position:"relative", width:10, height:10, flexShrink:0 }}>
                  <div style={{ width:10,height:10,borderRadius:"50%",background:color }} />
                  <div style={{ position:"absolute",inset:-4,borderRadius:"50%",border:`2px solid ${color}`,animation:"ripple 1.5s infinite" }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.8rem",color:COLORS.text.primary,fontWeight:600 }}>
                    Nearest zone: <span style={{color}}>{nearestSensor.sensor.name||`Zone #${nearestSensor.sensor.id}`}</span>
                    <span style={{ color:COLORS.text.subtle,fontWeight:400,marginLeft:6 }}>· {nearestSensor.dist.toFixed(1)} km</span>
                  </div>
                  {cong && (
                    <div style={{ fontSize:"0.72rem",color:COLORS.text.muted,marginTop:2 }}>
                      {niveauLabel(cong.niveau)} traffic · {cong.vitesseMoy!=null?`${Number(cong.vitesseMoy).toFixed(1)} km/h · `:""}
                      {["BLOCKED","HEAVY"].includes(cong.niveau?.toUpperCase())&&<span style={{color:"#F0997B",fontWeight:600}}>⚠ Avoid this route</span>}
                    </div>
                  )}
                </div>
                <button onClick={()=>openZonePanel(nearestSensor.sensor)}
                  style={{ background:`${color}18`,border:`1px solid ${color}44`,color,borderRadius:7,padding:"0.3rem 0.7rem",fontSize:"0.72rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>
                  Details
                </button>
              </div>
            );
          })()}

          {/* Stat pills overlay top-right */}
          <div style={{ position:"absolute", top:14, right:14, zIndex:500, display:"flex", flexDirection:"column", gap:6 }}>
            {[
              {key:"BLOCKED",  label:"Blocked",  color:"#D85A30"},
              {key:"HEAVY",    label:"Heavy",    color:"#E24B4A"},
              {key:"MODERATE", label:"Moderate", color:"#EF9F27"},
              {key:"LOW",      label:"Low",      color:"#1D9E75"},
            ].map(s=>(
              <div key={s.key} style={{ background:"rgba(17,15,30,0.85)",border:`1px solid ${s.color}33`,borderRadius:8,padding:"0.35rem 0.75rem",display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(8px)" }}>
                <div style={{ width:7,height:7,borderRadius:"50%",background:s.color }} />
                <span style={{ fontSize:"0.75rem",color:COLORS.text.primary,fontWeight:700 }}>{loading?"—":counts[s.key]}</span>
                <span style={{ fontSize:"0.68rem",color:s.color,fontWeight:500 }}>{s.label}</span>
              </div>
            ))}
          </div>

          <MapContainer center={CASABLANCA_CENTER} zoom={12} style={{ height:"100%",width:"100%" }} scrollWheelZoom zoomControl>
            <TileLayer url={tile.url} attribution={tile.attribution} />
            {flyTo && <FlyTo position={flyTo} />}

            {/* User marker */}
            {userPosition && (
              <>
                <Marker position={userPosition} icon={createUserIcon()}>
                  <Popup><div style={{color:"white",fontWeight:700}}>📍 You are here</div></Popup>
                </Marker>
                <Circle center={userPosition} radius={800} pathOptions={{color:"#7F77DD",fillColor:"#7F77DD",fillOpacity:0.06,weight:1,dashArray:"6 4"}} />
              </>
            )}

            {/* Sensor markers */}
            {sensors.map(sensor=>{
              const coords=getSensorCoords(sensor);
              const cong=getCongestion(sensor.id);
              const color=cong?niveauColor(cong.niveau):COLORS.primary.light;
              const isFav=favorites.includes(sensor.id);
              const isSelected=selectedSensor?.id===sensor.id;
              return (
                <Marker key={sensor.id} position={coords} icon={createSensorIcon(color,isSelected?26:20)}
                  eventHandlers={{click:()=>{openZonePanel(sensor);setFlyTo(coords);}}}>
                  <Popup>
                    <div style={{minWidth:200}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.95rem",fontWeight:700,color:"white"}}>{sensor.name||`Zone #${sensor.id}`}</div>
                        <span onClick={e=>{e.stopPropagation();toggleFavorite(sensor.id);}}
                          style={{cursor:"pointer",fontSize:16,opacity:isFav?1:0.3}}>{isFav?"⭐":"☆"}</span>
                      </div>
                      {cong?(
                        <div>
                          <div style={{display:"inline-flex",alignItems:"center",gap:4,background:color+"22",border:`1px solid ${color}44`,color,fontSize:"0.7rem",fontWeight:700,padding:"0.18rem 0.55rem",borderRadius:6,marginBottom:10}}>
                            {niveauLabel(cong.niveau)}
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                            {[
                              {label:"SPEED",value:cong.vitesseMoy!=null?`${Number(cong.vitesseMoy).toFixed(1)} km/h`:"—",color:"#EF9F27"},
                              {label:"VEHICLES",value:cong.nbrVehicule??"—",color:"white"},
                              {label:"CAUSE",value:cong.cause||"—",color:"white"},
                              {label:"STATUS",value:cong.status||"—",color:cong.status==="APPROVED"?"#1D9E75":"#EF9F27"},
                            ].map(st=>(
                              <div key={st.label} style={{background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                                <div style={{fontSize:"0.6rem",color:"#6B7280",marginBottom:2}}>{st.label}</div>
                                <div style={{fontSize:"0.82rem",fontWeight:700,color:st.color}}>{st.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ):(
                        <div style={{fontSize:"0.8rem",color:"#6B7280",fontStyle:"italic"}}>No congestion data</div>
                      )}
                    </div>
                  </Popup>
                  {cong&&<Circle center={coords} radius={350} pathOptions={{color,fillColor:color,fillOpacity:0.1,weight:1.5}} />}
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ background:COLORS.bg.card, borderLeft:"1px solid rgba(127,119,221,0.1)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Zone detail panel */}
          {selectedSensor ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {/* Header */}
              <div style={{ padding:"1.2rem 1.2rem 0.8rem", borderBottom:"1px solid rgba(127,119,221,0.08)" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700,color:COLORS.text.primary }}>
                    {selectedSensor.name||`Zone #${selectedSensor.id}`}
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    <span onClick={()=>toggleFavorite(selectedSensor.id)} style={{ cursor:"pointer",fontSize:18,opacity:favorites.includes(selectedSensor.id)?1:0.3 }}>
                      {favorites.includes(selectedSensor.id)?"⭐":"☆"}
                    </span>
                    <button onClick={()=>{setSelectedSensor(null);setZoneDetail(null);}}
                      style={{ background:"transparent",border:"none",color:COLORS.text.muted,fontSize:18,cursor:"pointer",padding:"0 2px" }}>✕</button>
                  </div>
                </div>
                <div style={{ fontSize:"0.72rem",color:COLORS.text.subtle }}>{selectedSensor.zone||""} · Sensor #{selectedSensor.id}</div>
              </div>

              {/* Zone stats */}
              <div style={{ padding:"1rem 1.2rem", flex:1, overflowY:"auto" }}>
                {loadingZone ? (
                  <div style={{ textAlign:"center",padding:"2rem",color:COLORS.text.muted }}>Loading...</div>
                ) : zoneDetail ? (() => {
                  const color=niveauColor(zoneDetail.niveau);
                  return (
                    <div style={{ animation:"fadeSlide 0.3s ease" }}>
                      {/* Level badge */}
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:"1rem" }}>
                        <div style={{ width:12,height:12,borderRadius:"50%",background:color,boxShadow:`0 0 8px ${color}` }} />
                        <span style={{ fontFamily:"'Syne',sans-serif",fontSize:"1.3rem",fontWeight:800,color }}>{niveauLabel(zoneDetail.niveau)}</span>
                        <span style={{ fontSize:"0.72rem",color:COLORS.text.subtle,marginLeft:"auto" }}>
                          {zoneDetail.heureDate?new Date(zoneDetail.heureDate).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"}):""}
                        </span>
                      </div>

                      {/* Key metrics */}
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1.2rem" }}>
                        {[
                          {icon:"⚡",label:"Avg Speed",value:zoneDetail.vitesseMoy!=null?`${Number(zoneDetail.vitesseMoy).toFixed(1)} km/h`:"—",color:COLORS.accent.amber},
                          {icon:"🚗",label:"Vehicles", value:zoneDetail.nbrVehicule??"-",color:COLORS.text.primary},
                          {icon:"📊",label:"Volume",   value:zoneDetail.volumeTraffic!=null?Math.round(zoneDetail.volumeTraffic).toLocaleString():"—",color:COLORS.text.primary},
                          {icon:"📍",label:"Cause",    value:zoneDetail.cause||"—",color:COLORS.text.muted},
                        ].map(m=>(
                          <div key={m.label} style={{ background:COLORS.bg.hover,borderRadius:10,padding:"0.75rem",textAlign:"center" }}>
                            <div style={{ fontSize:18,marginBottom:4 }}>{m.icon}</div>
                            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:"0.95rem",fontWeight:700,color:m.color }}>{m.value}</div>
                            <div style={{ fontSize:"0.62rem",color:COLORS.text.subtle,textTransform:"uppercase",fontWeight:600 }}>{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Congestion breakdown for this zone */}
                      <div style={{ marginBottom:"1.2rem" }}>
                        <div style={{ fontSize:"0.72rem",color:COLORS.text.subtle,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>
                          Zone Traffic Breakdown
                        </div>
                        {(() => {
                          const zoneCongs=congestions.filter(c=>c.locationId===selectedSensor.id);
                          const total=zoneCongs.length||1;
                          return NIVEAUX.map(n=>{
                            const cnt=zoneCongs.filter(c=>c.niveau?.toUpperCase()===n).length;
                            return <MiniBar key={n} label={niveauLabel(n)} value={cnt} max={total} color={niveauColor(n)} />;
                          });
                        })()}
                      </div>

                      {/* Report for this zone */}
                      <button onClick={()=>{setReportZoneId(String(selectedSensor.id));setReportOpen(true);}}
                        style={{ width:"100%",background:`${COLORS.accent.coral}15`,border:`1px solid ${COLORS.accent.coral}44`,color:"#F0997B",borderRadius:10,padding:"0.7rem",fontSize:"0.85rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                        🚨 Report incident in this zone
                      </button>
                    </div>
                  );
                })() : (
                  <div style={{ textAlign:"center",padding:"2rem",color:COLORS.text.muted,fontSize:"0.85rem",fontStyle:"italic" }}>
                    No congestion data for this zone
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Default panel — overview
            <div style={{ flex:1, overflowY:"auto", padding:"1.2rem" }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:"0.95rem",fontWeight:700,color:COLORS.text.primary,marginBottom:"1rem" }}>
                🗺️ Traffic Overview
              </div>

              {/* Stats row */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:"1.2rem" }}>
                {[
                  {label:"Blocked",  key:"BLOCKED",  color:"#D85A30",icon:"🔴"},
                  {label:"Heavy",    key:"HEAVY",    color:"#E24B4A",icon:"🟠"},
                  {label:"Moderate", key:"MODERATE", color:"#EF9F27",icon:"🟡"},
                  {label:"Low",      key:"LOW",      color:"#1D9E75",icon:"🟢"},
                ].map(s=>(
                  <div key={s.key} style={{ background:COLORS.bg.hover,borderRadius:12,padding:"0.85rem",textAlign:"center",border:`1px solid ${s.color}22` }}>
                    <div style={{ fontSize:18,marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif",fontSize:"1.4rem",fontWeight:800,color:s.color }}>{loading?"—":counts[s.key]}</div>
                    <div style={{ fontSize:"0.62rem",color:COLORS.text.muted,textTransform:"uppercase",fontWeight:600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Favorites */}
              {favorites.length > 0 && (
                <div style={{ marginBottom:"1.2rem" }}>
                  <div style={{ fontSize:"0.72rem",color:COLORS.text.subtle,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>⭐ Favorites</div>
                  {sensors.filter(s=>favorites.includes(s.id)).map(s=>{
                    const cong=getCongestion(s.id);
                    const color=cong?niveauColor(cong.niveau):COLORS.text.subtle;
                    return (
                      <div key={s.id} onClick={()=>{openZonePanel(s);setFlyTo(getSensorCoords(s));}}
                        style={{ display:"flex",alignItems:"center",gap:10,padding:"0.65rem 0.85rem",borderRadius:10,marginBottom:4,cursor:"pointer",background:COLORS.bg.hover,border:"1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(127,119,221,0.2)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.04)"}>
                        <div style={{ width:8,height:8,borderRadius:"50%",background:color,flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:"0.82rem",color:COLORS.text.primary,fontWeight:500 }}>{s.name||`Zone #${s.id}`}</div>
                          <div style={{ fontSize:"0.68rem",color:COLORS.text.subtle }}>{cong?niveauLabel(cong.niveau):"No data"}</div>
                        </div>
                        <span style={{ fontSize:"0.7rem",color:color,fontWeight:600 }}>›</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recent congestions */}
              <div>
                <div style={{ fontSize:"0.72rem",color:COLORS.text.subtle,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Recent Alerts</div>
                {congestions.slice(0,6).map((c,i)=>{
                  const color=niveauColor(c.niveau);
                  const sensor=sensors.find(s=>s.id===c.locationId);
                  return (
                    <div key={c.id} onClick={()=>sensor&&openZonePanel(sensor)}
                      style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"0.7rem 0",borderBottom:i<5?"1px solid rgba(127,119,221,0.06)":"none",cursor:sensor?"pointer":"default" }}>
                      <div style={{ width:8,height:8,borderRadius:"50%",background:color,flexShrink:0,marginTop:4 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",justifyContent:"space-between" }}>
                          <span style={{ fontSize:"0.8rem",color:COLORS.text.primary,fontWeight:500 }}>{sensor?.name||`Zone #${c.locationId}`}</span>
                          <span style={{ fontSize:"0.68rem",color:COLORS.text.subtle }}>{c.heureDate?new Date(c.heureDate).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit"}):"—"}</span>
                        </div>
                        <div style={{ display:"flex",gap:6,marginTop:2 }}>
                          <span style={{ fontSize:"0.68rem",color,fontWeight:600 }}>{niveauLabel(c.niveau)}</span>
                          {c.cause&&<span style={{ fontSize:"0.68rem",color:COLORS.text.subtle }}>· {c.cause}</span>}
                          {c.vitesseMoy!=null&&<span style={{ fontSize:"0.68rem",color:COLORS.accent.amber }}>· {Number(c.vitesseMoy).toFixed(0)} km/h</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── REPORT MODAL ── */}
      {reportOpen && (
        <div style={{ position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}
          onClick={()=>setReportOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:COLORS.bg.card,border:"1px solid rgba(127,119,221,0.2)",borderRadius:20,padding:"2rem",width:"100%",maxWidth:440,boxShadow:"0 24px 80px rgba(0,0,0,0.6)",animation:"fadeSlide 0.3s ease" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem" }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:700,color:COLORS.text.primary }}>📢 Report an Incident</div>
                <div style={{ fontSize:"0.75rem",color:COLORS.text.muted,marginTop:3 }}>Help other users by reporting a problem</div>
              </div>
              <button onClick={()=>setReportOpen(false)} style={{ background:"transparent",border:"none",color:COLORS.text.muted,fontSize:"1.3rem",cursor:"pointer" }}>✕</button>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {/* Zone */}
              <div>
                <label style={{ display:"block",fontSize:"0.72rem",color:"#7C7A99",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em" }}>Zone</label>
                <select value={reportZoneId} onChange={e=>{setReportZoneId(e.target.value);setReportSignalId("");}}
                  style={{ width:"100%",background:COLORS.bg.hover,border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"0.65rem 1rem",fontSize:"0.88rem",color:reportZoneId?COLORS.text.primary:COLORS.text.muted,outline:"none",fontFamily:"inherit",cursor:"pointer" }}>
                  <option value="">— Select zone —</option>
                  {sensors.map(s=><option key={s.id} value={s.id}>{s.name||`Zone #${s.id}`}</option>)}
                </select>
              </div>

              {/* Signal */}
              <div>
                <label style={{ display:"block",fontSize:"0.72rem",color:"#7C7A99",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em" }}>Signal</label>
                <select value={reportSignalId} onChange={e=>setReportSignalId(e.target.value)} disabled={!reportZoneId}
                  style={{ width:"100%",background:COLORS.bg.hover,border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"0.65rem 1rem",fontSize:"0.88rem",color:reportSignalId?COLORS.text.primary:COLORS.text.muted,outline:"none",fontFamily:"inherit",cursor:reportZoneId?"pointer":"not-allowed",opacity:reportZoneId?1:0.5 }}>
                  <option value="">— Select signal —</option>
                  {signalsForZone.map(s=><option key={s.id} value={s.id}>{s.type} #{s.id}</option>)}
                </select>
                {reportZoneId&&signalsForZone.length===0&&<div style={{ fontSize:"0.72rem",color:COLORS.accent.coral,marginTop:4 }}>⚠ No signal for this zone</div>}
              </div>

              {/* Type + Level on same row */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <div>
                  <label style={{ display:"block",fontSize:"0.72rem",color:"#7C7A99",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em" }}>Type</label>
                  <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                    {REPORT_TYPES.map(t=>(
                      <div key={t.value} onClick={()=>setReportType(t.value)}
                        style={{ display:"flex",alignItems:"center",gap:8,padding:"0.55rem 0.8rem",borderRadius:8,border:`1px solid ${reportType===t.value?t.color+"55":"rgba(255,255,255,0.07)"}`,background:reportType===t.value?t.color+"12":"transparent",cursor:"pointer",transition:"all 0.15s" }}>
                        <div style={{ width:14,height:14,borderRadius:"50%",border:`2px solid ${reportType===t.value?t.color:"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                          {reportType===t.value&&<div style={{ width:6,height:6,borderRadius:"50%",background:t.color }} />}
                        </div>
                        <span style={{ fontSize:"0.8rem",color:reportType===t.value?t.color:COLORS.text.primary,fontWeight:500 }}>{t.icon} {t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display:"block",fontSize:"0.72rem",color:"#7C7A99",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em" }}>Level</label>
                  <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                    {NIVEAUX_REPORT.map(n=>(
                      <div key={n} onClick={()=>setReportNiveau(n)}
                        style={{ display:"flex",alignItems:"center",gap:8,padding:"0.55rem 0.8rem",borderRadius:8,border:`1px solid ${reportNiveau===n?niveauColor(n)+"55":"rgba(255,255,255,0.07)"}`,background:reportNiveau===n?niveauColor(n)+"12":"transparent",cursor:"pointer",transition:"all 0.15s" }}>
                        <div style={{ width:8,height:8,borderRadius:"50%",background:niveauColor(n),opacity:reportNiveau===n?1:0.4 }} />
                        <span style={{ fontSize:"0.8rem",color:reportNiveau===n?niveauColor(n):COLORS.text.primary,fontWeight:reportNiveau===n?600:400 }}>{niveauLabel(n)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleReport} disabled={!reportZoneId||!reportSignalId||reporting}
                style={{ width:"100%",padding:"0.88rem",background:reportSuccess?`linear-gradient(135deg,${COLORS.accent.teal},#16a085)`:(!reportZoneId||!reportSignalId||reporting)?"rgba(255,255,255,0.06)":`linear-gradient(135deg,${COLORS.primary.light},${COLORS.primary.dark})`,color:(!reportZoneId||!reportSignalId||reporting)&&!reportSuccess?COLORS.text.muted:COLORS.text.primary,border:"none",borderRadius:10,fontSize:"0.92rem",fontWeight:700,cursor:(!reportZoneId||!reportSignalId||reporting)?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.25s",marginTop:4 }}>
                {reportSuccess?"✅ Submitted!":reporting?"Submitting...":"🚨 Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}