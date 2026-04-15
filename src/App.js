import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Auth from "./pages/Auth";

import UserPage from "./pages/UserPage";
import AdminDashboard    from "./pages/AdminDashboard";

import LocationDashboard from "./pages/LocationDashboard";

// 🔐 Route protégée par token JWT + rôle
const PrivateRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        {/* Protégées */}
        <Route
          path="/admin"
          element={
            <PrivateRoute roleRequired="ROLE_ADMIN">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/user"
          element={
            <PrivateRoute roleRequired="ROLE_USER">
              <UserPage />
            </PrivateRoute>
          } 
        />
        
        {/* Fallback — toute route inconnue → home */}
        <Route path="*" element={<Navigate to="/" />} />

       <Route path="/admin"           element={<PrivateRoute roleRequired="ROLE_ADMIN"><AdminDashboard /></PrivateRoute>} />
       <Route path="/admin/locations" element={<PrivateRoute roleRequired="ROLE_ADMIN"><LocationDashboard /></PrivateRoute>} />
       
      </Routes>
    </BrowserRouter>
  );
}

export default App;
