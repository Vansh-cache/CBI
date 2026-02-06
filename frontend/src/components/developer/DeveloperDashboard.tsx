import { Routes, Route, Navigate, useLocation } from 'react-router';
import type { User } from '../../contexts/AuthContext';
import DeveloperLayout from './DeveloperLayout';
import DeveloperHome from './DeveloperHome';
import DashboardBuilder from './DashboardBuilder';
import DashboardMapper from './DashboardMapper';
import DataMapping from './DataMapping';
import APIConfiguration from './APIConfiguration';
import DashboardPreview from './DashboardPreview';

interface DeveloperDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function DeveloperDashboard({ user, onLogout }: DeveloperDashboardProps) {
  const location = useLocation();
  
  // Check if we're on the builder or preview page (focused mode - no sidebar)
  const isBuilderRoute = location.pathname.includes('/builder') || location.pathname.includes('/preview');

  // If on builder/preview page, render without layout
  if (isBuilderRoute) {
    return (
      <Routes>
        <Route path="/builder/:id?" element={<DashboardBuilder />} />
        <Route path="/preview/:id" element={<DashboardPreview />} />
      </Routes>
    );
  }

  // Otherwise render with layout
  return (
    <DeveloperLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/developer/dashboard" replace />} />
        <Route path="/dashboard" element={<DeveloperHome />} />
        <Route path="/dashboard-mapper" element={<DashboardMapper />} />
        <Route path="/data-mapping" element={<DataMapping />} />
        <Route path="/api-config" element={<APIConfiguration />} />
      </Routes>
    </DeveloperLayout>
  );
}