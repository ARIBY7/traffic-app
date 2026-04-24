import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home                 from "./pages/Home";
import Auth                 from "./pages/Auth";
import AdminDashboard       from "./pages/AdminDashboard";
import LocationDashboard    from "./pages/LocationDashboard";
import TrafficDataDashboard from "./pages/TrafficDataDashboard";
import CongestionDashboard  from "./pages/CongestionDashboard";
import UserPage             from "./pages/UserPage";
import ManageUsersDashboard from './pages/ManageUsersDashboard';


import SignalsDashboard from "./pages/SignalsDashboard"; 

const PrivateRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");
  if (!token) return <Navigate to="/login" />;
  if (roleRequired && role !== roleRequired) return <Navigate to="/" />;
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

        {/* Admin */}
        <Route path="/admin" element={
          <PrivateRoute roleRequired="ROLE_ADMIN">
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/locations" element={
          <PrivateRoute roleRequired="ROLE_ADMIN">
            <LocationDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/traffic" element={
          <PrivateRoute roleRequired="ROLE_ADMIN">
            <TrafficDataDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/congestion" element={
          <PrivateRoute roleRequired="ROLE_ADMIN">
            <CongestionDashboard />
          </PrivateRoute>
        } />

        {/* User */}
        <Route path="/user" element={
          <PrivateRoute roleRequired="ROLE_USER">
            <UserPage />
          </PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

        <Route path="/admin/users" element={<ManageUsersDashboard />} /> 
        <Route path="/admin/signals" element={<SignalsDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;