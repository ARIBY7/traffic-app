import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (!role) {
      navigate("/login");
    }
  }, []);

  return (
    <div>
      <h1>👤 User Space</h1>
      <p>Welcome to traffic platform</p>
    </div>
  );
}