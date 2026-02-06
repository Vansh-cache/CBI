import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import DeveloperLogin from './components/developer/DeveloperLogin';
import DeveloperDashboard from './components/developer/DeveloperDashboard';
import ViewerLogin from './components/viewer/ViewerLogin';
import ViewerDashboard from './components/viewer/ViewerDashboard';
import LandingPage from './components/LandingPage';
import UnifiedLogin from './components/shared/UnifiedLogin';
import { LoadingScreen } from './components/shared/LoadingScreen';

function RoleRedirect({ role }: { role: string }) {
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'developer') return <Navigate to="/developer/dashboard" replace />;
  if (role === 'viewer') return <Navigate to="/viewer/dashboard" replace />;
  return <Navigate to="/" replace />;
}

function App() {
  const { user, loading, logout } = useAuth();
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayElapsed(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !minDelayElapsed) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Unified Login - redirects based on role */}
        <Route
          path="/login"
          element={
            user ? (
              <RoleRedirect role={user.role_name} />
            ) : (
              <UnifiedLogin />
            )
          }
        />

        {/* Admin */}
        <Route
          path="/admin/login"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/admin/*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role_name !== 'admin' ? (
              <RoleRedirect role={user.role_name} />
            ) : (
              <AdminDashboard user={user} onLogout={logout} />
            )
          }
        />

        {/* Developer */}
        <Route
          path="/developer/login"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/developer/*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role_name !== 'developer' ? (
              <RoleRedirect role={user.role_name} />
            ) : (
              <DeveloperDashboard user={user} onLogout={logout} />
            )
          }
        />

        {/* Viewer */}
        <Route
          path="/viewer/login"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/viewer/*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role_name !== 'viewer' ? (
              <RoleRedirect role={user.role_name} />
            ) : (
              <ViewerDashboard user={user} onLogout={logout} />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
