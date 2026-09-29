import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ClientDashboard from "./pages/ClientDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import LandingPage from "./pages/LandingPage";
import PublicRooms from "./pages/PublicRooms";
import SpaPage from "./pages/SpaPage";
import PublicRestaurant from "./pages/PublicRestaurant";

const ProtectedStaffRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ProtectedClientRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing Page — always accessible, no auth required */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Catalog Pages */}
      <Route path="/rooms" element={<PublicRooms />} />
      <Route path="/spa" element={<SpaPage />} />
      <Route path="/restaurant" element={<PublicRestaurant />} />

      {/* Shared Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Access Denied */}
      <Route
        path="/access-denied"
        element={
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <h1>403 — Access Denied</h1>
            <p style={{ color: "#64748b" }}>
              You don't have permission to view this page.
            </p>
            <a href="/" style={{ color: "#064e3b", fontWeight: 600 }}>
              Return to Home
            </a>
          </div>
        }
      />

      {/* Client Dashboard (Guest Consumer Experience) */}
      <Route
        path="/client/*"
        element={
          <ProtectedClientRoute>
            <ClientDashboard />
          </ProtectedClientRoute>
        }
      />

      {/* Staff Dashboard (Receptionist / Admin) */}
      <Route
        path="/staff/*"
        element={
          <ProtectedStaffRoute>
            <StaffDashboard />
          </ProtectedStaffRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
