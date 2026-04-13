export default function Topbar() {
  return (
    <div style={{
      marginLeft: "220px",
      height: "60px",
      background: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 20px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    }}>
      <input
        placeholder="Search traffic data..."
        style={{
          padding: "8px",
          width: "250px"
        }}
      />

      <div>👤 Admin</div>
    </div>
  );
}