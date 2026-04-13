import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Card({ title, value, icon, color }) {
  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "15px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      width: "220px",
      borderLeft: `6px solid ${color}`,
      transition: "0.3s"
    }}>
      <div style={{ fontSize: "28px" }}>{icon}</div>
      <h3>{title}</h3>
      <h1>{value}</h1>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div style={{ background: "#f4f6fb", minHeight: "100vh" }}>

      <Sidebar />
      <Topbar />

      <div style={{ marginLeft: "240px", padding: "30px" }}>

        <h1 style={{ marginBottom: "20px" }}>
          🚦 Traffic Dashboard
        </h1>

        {/* KPI GRID */}
        <div style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap"
        }}>
          <Card title="Total Vehicles" value="84,312" icon="🚗" color="#3b82f6" />
          <Card title="Avg Speed" value="47 km/h" icon="🚦" color="#22c55e" />
          <Card title="Congestion Zones" value="3" icon="⚠️" color="#ef4444" />
          <Card title="Sensors Online" value="28/32" icon="📡" color="#f59e0b" />
        </div>

        {/* CHART AREA SIMPLE */}
        <div style={{
          marginTop: "30px",
          background: "white",
          padding: "20px",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}>
          <h2>📊 Traffic Analytics</h2>

          <div style={{
            height: "200px",
            background: "#eef2ff",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#555"
          }}>
            📈 Chart Placeholder (we can add charts later)
          </div>
        </div>

      </div>
    </div>
  );
}