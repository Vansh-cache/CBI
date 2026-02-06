import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  LayoutDashboard,
  UserPlus,
  Loader2,
  X,
  Trash2,
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette } from '../../lib/themeColors';

interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_by_email?: string;
  is_active: boolean;
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
  dashboard_name?: string;
}

export default function DashboardMapper() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);

  const [viewMode, setViewMode] = useState<'dashboard' | 'user'>('dashboard');
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
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
  const [unassigningId, setUnassigningId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, usersRes, assignRes] = await Promise.all([
        apiGet<Dashboard[]>('/api/dashboards'),
        apiGet<User[]>('/api/users'),
        apiGet<Assignment[]>('/api/dashboards/assignments'),
      ]);

      setDashboards(Array.isArray(dashRes.data) ? dashRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setAllAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setDashboards([]);
      setUsers([]);
      setAllAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

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
    setUnassigningId(null);
    fetchData();
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
          m ? { ...m, assignments: Array.isArray(list) ? list : m.assignments } : null
        );
        setAssignUserId('');
        fetchData();
      } else {
        setAssignError((res as { message?: string }).message || 'Assign failed');
      }
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Assign failed');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleUnassign = async (dashboardId: number, userId: number, assignmentId: number) => {
    setUnassigningId(assignmentId);
    try {
      await apiDelete(`/api/dashboards/${dashboardId}/assign/${userId}`);
      setAssignModal((m) =>
        m
          ? { ...m, assignments: m.assignments.filter((a) => a.id !== assignmentId) }
          : null
      );
      fetchData();
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Unassign failed');
    } finally {
      setUnassigningId(null);
    }
  };

  const viewerUsers = users.filter((u) => u.role_name === 'viewer');

  const assignmentsByUser = users
    .filter((u) => u.role_name === 'viewer')
    .map((u) => ({
      user: u,
      assignments: allAssignments.filter((a) => a.user_id === u.id),
    }));

  const cardStyle = {
    backgroundColor: colors.cardBg,
    borderRadius: '0.75rem',
    boxShadow: colors.cardShadow,
    border: `1px solid ${colors.cardBorder}`,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.text, marginBottom: '0.25rem' }}>
          Dashboard Mapper
        </h2>
        <p style={{ color: colors.muted }}>
          Assign dashboards to users and see which dashboard is assigned to which user.
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: palette.red.bg, color: palette.red.text, fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* View toggle */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setViewMode('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: viewMode === 'dashboard' ? colors.accentBg : 'transparent',
            color: viewMode === 'dashboard' ? '#ef4444' : colors.muted,
            fontWeight: viewMode === 'dashboard' ? 600 : 400,
          }}
        >
          <LayoutDashboard style={{ width: '1rem', height: '1rem' }} />
          By Dashboard
        </button>
        <button
          onClick={() => setViewMode('user')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: viewMode === 'user' ? colors.accentBg : 'transparent',
            color: viewMode === 'user' ? '#ef4444' : colors.muted,
            fontWeight: viewMode === 'user' ? 600 : 400,
          }}
        >
          <Users style={{ width: '1rem', height: '1rem' }} />
          By User
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ef4444' }} />
        </div>
      ) : viewMode === 'dashboard' ? (
        <div style={cardStyle}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${colors.cardBorder}` }}>
            <h3 style={{ fontWeight: 600, color: colors.text }}>Dashboards & Assignments</h3>
            <p style={{ fontSize: '0.875rem', color: colors.muted, marginTop: '0.25rem' }}>
              Click Assign to add users to a dashboard
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: colors.tableBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    Dashboard
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    Assigned Users
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboards.map((d, index) => {
                  const assigned = allAssignments.filter((a) => a.dashboard_id === d.id);
                  return (
                    <tr key={d.id} style={{ borderBottom: index < dashboards.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ fontWeight: 500, color: colors.text }}>{d.name}</span>
                        {d.description && (
                          <p style={{ fontSize: '0.875rem', color: colors.muted, marginTop: '0.125rem' }}>
                            {d.description}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                        {assigned.length === 0 ? (
                          <span style={{ color: colors.muted }}>None</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {assigned.map((a) => (
                              <span key={a.id} style={{ color: colors.text }}>
                                {a.first_name} {a.last_name} ({a.user_email}) — {a.permission_type}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => openAssignModal(d)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.875rem',
                            color: '#ef4444',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          <UserPlus style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                          Assign
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {dashboards.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: colors.muted }}>
              No dashboards yet. Create them from the Dashboard Builder.
            </div>
          )}
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${colors.cardBorder}` }}>
            <h3 style={{ fontWeight: 600, color: colors.text }}>Users & Their Dashboards</h3>
            <p style={{ fontSize: '0.875rem', color: colors.muted, marginTop: '0.25rem' }}>
              View which dashboards each user has access to
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: colors.tableBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    User
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    Assigned Dashboards
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignmentsByUser.map(({ user, assignments }, index) => (
                  <tr key={user.id} style={{ borderBottom: index < assignmentsByUser.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontWeight: 500, color: colors.text }}>
                        {user.first_name} {user.last_name}
                      </span>
                      <p style={{ fontSize: '0.875rem', color: colors.muted, marginTop: '0.125rem' }}>
                        {user.email}
                      </p>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                      {assignments.length === 0 ? (
                        <span style={{ color: colors.muted }}>No dashboards assigned</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {assignments.map((a) => (
                            <span key={a.id} style={{ color: colors.text }}>
                              {a.dashboard_name} — {a.permission_type}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assignmentsByUser.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: colors.muted }}>
              No viewer users found.
            </div>
          )}
        </div>
      )}

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
                    onChange={(e) => setAssignUserId(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  >
                    <option value="">Select user...</option>
                    {viewerUsers.filter((u) => !assignModal.assignments.some((a) => a.user_id === u.id)).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.email})
                      </option>
                    ))}
                    {viewerUsers.filter((u) => !assignModal.assignments.some((a) => a.user_id === u.id)).length === 0 && (
                      <option value="" disabled>All viewers assigned or no viewers</option>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.25rem' }}>Permission</label>
                  <select
                    value={assignPermission}
                    onChange={(e) => setAssignPermission(e.target.value as 'view' | 'edit')}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={assignUserId === '' || assignSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: assignUserId === '' || assignSubmitting ? 0.5 : 1,
                  }}
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
                  <ul style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {assignModal.assignments.map((a) => (
                      <li
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        }}
                      >
                        <span style={{ color: colors.text }}>
                          {a.first_name} {a.last_name} ({a.user_email}) — {a.permission_type}
                        </span>
                        <button
                          onClick={() => handleUnassign(assignModal.dashboardId, a.user_id, a.id)}
                          disabled={unassigningId === a.id}
                          style={{
                            padding: '0.25rem',
                            color: palette.red.text,
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: unassigningId === a.id ? 'wait' : 'pointer',
                          }}
                          title="Unassign"
                        >
                          {unassigningId === a.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
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
