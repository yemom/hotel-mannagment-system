import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ClientDashboard from './pages/ClientDashboard';
import StaffDashboard from './pages/StaffDashboard';

const RootRedirect = () => {
  const { currentUser, role } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'receptionist') {
    return <Navigate to="/staff" replace />;
  }

  return <Navigate to="/client" replace />;
};

const ProtectedStaffRoute = ({ children }) => {
  const { currentUser, role } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  // Allow switching for demo convenience, or enforce role
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
      {/* Root redirect based on role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Shared Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Client Dashboard (Guest Consumer Experience) */}
      <Route
        path="/client/*"
        element={
          <ProtectedClientRoute>
            <ClientDashboard />
          </ProtectedClientRoute>
        }
      />

      {/* Receptionist Dashboard (Staff Operational Admin) */}
      <Route
        path="/staff/*"
        element={
          <ProtectedStaffRoute>
            <StaffDashboard />
          </ProtectedStaffRoute>
        }
      />

      {/* Backward-compatibility redirects for staff subroutes */}
      <Route path="/rooms" element={<Navigate to="/staff/rooms" replace />} />
      <Route path="/reservations" element={<Navigate to="/staff/reservations" replace />} />
      <Route path="/guests" element={<Navigate to="/staff/guests" replace />} />
      <Route path="/pricing" element={<Navigate to="/staff/pricing" replace />} />
      <Route path="/reports" element={<Navigate to="/staff/reports" replace />} />
      <Route path="/booking" element={<Navigate to="/client" replace />} />

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
