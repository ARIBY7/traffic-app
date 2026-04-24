import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ❌ pas connecté
  if (!token) {
    return <Navigate to="/login" />;
  }

  // ❌ mauvais rôle
  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/user" />;
  }

  return children;
}