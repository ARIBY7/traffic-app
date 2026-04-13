export default function KpiCard({ title, value, icon }) {
  return (
    <div style={{
      background: "white",
      padding: "15px",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      width: "200px"
    }}>
      <h4>{icon} {title}</h4>
      <h2>{value}</h2>
    </div>
  );
}