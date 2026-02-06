import { Routes, Route, Navigate } from 'react-router';
import type { User } from '../../contexts/AuthContext';
import { DashboardNameProvider, useDashboardName } from '../../contexts/DashboardNameContext';
import ViewerLayout from './ViewerLayout';
import ViewerHome from './ViewerHome';
import InteractiveDashboard from './InteractiveDashboard';

interface ViewerDashboardProps {
  user: User;
  onLogout: () => void;
}

function ViewerDashboardContent({ user, onLogout }: ViewerDashboardProps) {
  const { dashboardName } = useDashboardName();
  
  return (
    <ViewerLayout user={user} onLogout={onLogout} dashboardName={dashboardName || undefined}>
      <Routes>
        <Route path="/" element={<Navigate to="/viewer/dashboard" replace />} />
        <Route path="/dashboard" element={<ViewerHome />} />
        <Route path="/view/:id" element={<InteractiveDashboard />} />
      </Routes>
    </ViewerLayout>
  );
}

export default function ViewerDashboard({ user, onLogout }: ViewerDashboardProps) {
  return (
    <DashboardNameProvider>
      <ViewerDashboardContent user={user} onLogout={onLogout} />
    </DashboardNameProvider>
  );
}