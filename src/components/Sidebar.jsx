import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div style={{
      width: "220px",
      height: "100vh",
      background: "#0f172a",
      position: "fixed",
      padding: "20px",
      color: "white"
    }}>
      <h2>🚦 TrafficIQ</h2>

      <br />

      

      <Link to="/dashboard" style={{ color: "white", display: "block", margin: "10px 0" }}>
        Dashboard
      </Link>

     
    </div>
  );
}