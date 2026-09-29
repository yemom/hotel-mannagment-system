import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ClientDashboard from "./pages/ClientDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import LandingPage from "./pages/LandingPage";
import PublicRooms from "./pages/PublicRooms";
import RoomDetail from "./pages/RoomDetail";
import SpaPage from "./pages/SpaPage";
import PublicRestaurant from "./pages/PublicRestaurant";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

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
      {/* ── Public Pages (no authentication required) ── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/rooms" element={<PublicRooms />} />
      <Route path="/rooms/:id" element={<RoomDetail />} />
      <Route path="/spa" element={<SpaPage />} />
      <Route path="/restaurant" element={<PublicRestaurant />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* ── Auth Pages ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* ── Access Denied ── */}
      <Route
        path="/access-denied"
        element={
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <h1>403 — Access Denied</h1>
            <p style={{ color: "#64748b" }}>You don't have permission to view this page.</p>
            <a href="/" style={{ color: "#064e3b", fontWeight: 600 }}>Return to Home</a>
          </div>
        }
      />

      {/* ── Protected Client Dashboard ── */}
      <Route
        path="/client/*"
        element={
          <ProtectedClientRoute>
            <ClientDashboard />
          </ProtectedClientRoute>
        }
      />

      {/* ── Protected Staff Dashboard ── */}
      <Route
        path="/staff/*"
        element={
          <ProtectedStaffRoute>
            <StaffDashboard />
          </ProtectedStaffRoute>
        }
      />

      {/* ── Fallback ── */}
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
