import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  UserPlus,
  Loader2,
  X,
} from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette } from '../../lib/themeColors';

// Mobile detection hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_by_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assignment_count?: number;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name: string;
}

interface Assignment {
  id: number;
  dashboard_id: number;
  user_id: number;
  permission_type: 'view' | 'edit';
  user_email: string;
  first_name: string;
  last_name: string;
}

const FEATURES = [
  { id: '1', name: 'Create Dashboards', admin: true, developer: true, viewer: false },
  { id: '2', name: 'Edit Dashboards', admin: true, developer: true, viewer: false },
  { id: '3', name: 'Delete Dashboards', admin: true, developer: false, viewer: false },
  { id: '4', name: 'Manage Users', admin: true, developer: false, viewer: false },
  { id: '5', name: 'Configure Data Sources', admin: true, developer: true, viewer: false },
  { id: '6', name: 'View Analytics', admin: true, developer: true, viewer: true },
  { id: '7', name: 'Export Data', admin: true, developer: true, viewer: true },
  { id: '8', name: 'API Access', admin: true, developer: true, viewer: false },
];

export default function AccessControl() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);
  const isMobile = useIsMobile();

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{
    dashboardId: number;
    dashboardName: string;
    assignments: Assignment[];
  } | null>(null);
  const [assignUserId, setAssignUserId] = useState<number | ''>('');
  const [assignPermission, setAssignPermission] = useState<'view' | 'edit'>('view');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  const fetchDashboards = useCallback(async () => {
    try {
      const res = await apiGet<Dashboard[]>('/api/dashboards');
      if (res.success && res.data)
        setDashboards(Array.isArray(res.data) ? res.data : []);
      else setDashboards([]);
    } catch {
      setDashboards([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiGet<User[]>('/api/users');
      if (res.success && res.data)
        setUsers(Array.isArray(res.data) ? res.data : []);
      else setUsers([]);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchDashboards(), fetchUsers()])
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [fetchDashboards, fetchUsers]);

  const openAssignModal = async (d: Dashboard) => {
    setAssignError('');
    setAssignUserId('');
    setAssignPermission('view');
    try {
      const res = await apiGet<Assignment[]>(`/api/dashboards/${d.id}/assignments`);
      const list = (res as { success?: boolean; data?: Assignment[] }).data;
      setAssignModal({
        dashboardId: d.id,
        dashboardName: d.name,
        assignments: Array.isArray(list) ? list : [],
      });
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Failed to load assignments');
      setAssignModal({
        dashboardId: d.id,
        dashboardName: d.name,
        assignments: [],
      });
    }
  };

  const closeAssignModal = () => {
    setAssignModal(null);
    setAssignError('');
    setAssignSubmitting(false);
    fetchDashboards();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal || assignUserId === '') return;
    setAssignError('');
    setAssignSubmitting(true);
    try {
      const res = await apiPost<unknown>(
        `/api/dashboards/${assignModal.dashboardId}/assign`,
        { user_id: Number(assignUserId), permission_type: assignPermission }
      );
      if (res.success) {
        const res2 = await apiGet<Assignment[]>(
          `/api/dashboards/${assignModal.dashboardId}/assignments`
        );
        const list = (res2 as { success?: boolean; data?: Assignment[] }).data;
        setAssignModal((m) =>
          m
            ? {
              ...m,
              assignments: Array.isArray(list) ? list : m.assignments,
            }
            : null
        );
        setAssignUserId('');
        fetchDashboards();
      } else {
        setAssignError((res as { message?: string }).message || 'Assign failed');
      }
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Assign failed');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const viewerUsers = users.filter((u) => u.role_name === 'viewer');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 600, color: colors.text, marginBottom: '0.25rem' }}>
          Access Control & Permissions
        </h2>
        <p style={{ color: colors.muted, fontSize: isMobile ? '0.875rem' : '1rem' }}>
          Assign dashboards to users. Admins and developers see all dashboards; viewers only see
          assigned ones.
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: palette.red.bg, color: palette.red.text, fontSize: '0.875rem' }}>{error}</div>
      )}

      {/* Dashboard Access */}
      <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Shield style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', marginRight: '0.5rem' }} />
            <h3 style={{ fontWeight: 600, color: colors.text }}>Dashboard Assignments</h3>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: colors.tableBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Dashboard
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Assignments
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboards.map((d, index) => (
                  <tr key={d.id} style={{ borderBottom: index < dashboards.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontWeight: 500, color: colors.text }}>{d.name}</span>
                      {d.description && (
                        <p style={{ fontSize: '0.875rem', color: colors.muted, marginTop: '0.125rem' }}>
                          {d.description}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: colors.muted }}>
                      {d.assignment_count != null ? d.assignment_count : '—'} user(s)
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => openAssignModal(d)}
                        style={{ display: 'inline-flex', alignItems: 'center', padding: '0.375rem 0.75rem', fontSize: '0.875rem', color: '#dc2626', backgroundColor: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      >
                        <UserPlus style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && dashboards.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: colors.muted }}>
            No dashboards yet. Create them from the Developer portal.
          </div>
        )}
      </div>

      {/* Feature Permissions (informational) */}
      <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Shield style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', marginRight: '0.5rem' }} />
            <h3 style={{ fontWeight: 600, color: colors.text }}>Feature Permissions by Role</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: colors.muted, marginTop: '0.25rem' }}>
            Managed by system RBAC. Admins and developers have full dashboard access.
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: colors.tableBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
              <tr>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Feature
                </th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Admin
                </th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Developer
                </th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Viewer
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, index) => (
                <tr key={f.id} style={{ borderBottom: index < FEATURES.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ fontWeight: 500, color: colors.text }}>{f.name}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        backgroundColor: f.admin ? palette.green.bg : palette.gray.bg,
                        color: f.admin ? palette.green.text : colors.muted
                      }}
                    >
                      {f.admin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        backgroundColor: f.developer ? palette.green.bg : palette.gray.bg,
                        color: f.developer ? palette.green.text : colors.muted
                      }}
                    >
                      {f.developer ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        backgroundColor: f.viewer ? palette.green.bg : palette.gray.bg,
                        color: f.viewer ? palette.green.text : colors.muted
                      }}
                    >
                      {f.viewer ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '1rem' }}>
          <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${colors.cardBorder}` }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text }}>
                Assign: {assignModal.dashboardName}
              </h3>
              <button
                onClick={closeAssignModal}
                style={{ padding: '0.25rem', color: colors.muted, backgroundColor: 'transparent', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assignError && (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: palette.red.bg, color: palette.red.text, fontSize: '0.875rem' }}>
                  {assignError}
                </div>
              )}
              <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.25rem' }}>User</label>
                  <select
                    value={assignUserId}
                    onChange={(e) =>
                      setAssignUserId(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  >
                    <option value="">Select user...</option>
                    {viewerUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.email})
                      </option>
                    ))}
                    {viewerUsers.length === 0 && (
                      <option value="" disabled>
                        No viewers found
                      </option>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.25rem' }}>
                    Permission
                  </label>
                  <select
                    value={assignPermission}
                    onChange={(e) =>
                      setAssignPermission(e.target.value as 'view' | 'edit')
                    }
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={assignUserId === '' || assignSubmitting}
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (assignUserId === '' || assignSubmitting) ? 0.5 : 1 }}
                >
                  {assignSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign
                </button>
              </form>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>Current assignments</h4>
                {assignModal.assignments.length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: colors.muted }}>None</p>
                ) : (
                  <ul style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {assignModal.assignments.map((a) => (
                      <li key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: colors.text }}>
                        <span>
                          {a.first_name} {a.last_name} ({a.user_email})
                        </span>
                        <span style={{ color: colors.muted }}>{a.permission_type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
