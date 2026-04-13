import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "ROLE_ADMIN") {
      navigate("/login");
    }
  }, []);

  return (
    <div>
      <h1>👑 Admin Dashboard</h1>
    </div>
  );
}