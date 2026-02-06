import { Routes, Route, Navigate } from 'react-router';
import { type User } from '../../contexts/AuthContext';
import AdminLayout from './AdminLayout';
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';
import OrganizationUsers from './OrganizationUsers';
import DataSourceManagement from './DataSourceManagement';
import AccessControl from './AccessControl';
import AuditLogs from './AuditLogs';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminOverview />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/organization-users" element={<OrganizationUsers />} />
        <Route path="/data-sources" element={<DataSourceManagement />} />
        <Route path="/access-control" element={<AccessControl />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
      </Routes>
    </AdminLayout>
  );
}