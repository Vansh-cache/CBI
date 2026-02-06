import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, MoreVertical, UserPlus, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette, getRoleBadgeColors, getStatusBadgeColors } from '../../lib/themeColors';

interface BackendUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name: 'admin' | 'developer' | 'viewer';
  is_active: boolean;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

export default function UserManagement() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: 2,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<BackendUser[]>('/api/users');
      if (res.success && res.data) setUsers(Array.isArray(res.data) ? res.data : []);
      else setUsers([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiGet<Role[]>('/api/users/roles');
      if (res.success && res.data) setRoles(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const filteredUsers = users.filter((user) => {
    const name = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role_name === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      developer: 'bg-indigo-100 text-indigo-700',
      viewer: 'bg-green-100 text-green-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadgeColor = (active: boolean) => {
    return active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role_id: 2,
    });
    setFormError('');
    setEditingId(null);
    setShowAddModal(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await apiPost<BackendUser>('/api/users', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role_id: form.role_id,
      });
      if (res.success) {
        await fetchUsers();
        resetForm();
      } else {
        setFormError(res.message || 'Failed to create user');
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
      };
      if (form.password) payload.password = form.password;
      if (roles.length) payload.role_id = form.role_id;
      const res = await apiPut<BackendUser>(`/api/users/${id}`, payload);
      if (res.success) {
        await fetchUsers();
        resetForm();
      } else {
        setFormError(res.message || 'Failed to update user');
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setSubmitting(true);
    try {
      const res = await apiDelete<unknown>(`/api/users/${id}`);
      if (res.success) {
        await fetchUsers();
        resetForm();
      } else {
        setError(res.message || 'Failed to delete user');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (u: BackendUser) => {
    setForm({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      password: '',
      role_id: u.role_id,
    });
    setEditingId(u.id);
    setShowAddModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.text, marginBottom: '0.25rem' }}>User Management</h2>
          <p style={{ color: colors.muted }}>Create, edit, and manage user accounts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setForm({ first_name: '', last_name: '', email: '', password: '', role_id: 2 });
            setShowAddModal(true);
          }}
          style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: palette.red.bg, color: palette.red.text, fontSize: '0.875rem' }}>{error}</div>
      )}

      {/* Search and Filters */}
      <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: colors.muted }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name or email..."
              style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="viewer">Viewer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}`, overflow: 'hidden' }}>
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
                    User
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Role
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Created
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const roleBadge = getRoleBadgeColors(user.role_name, isDark);
                  const statusBadge = getStatusBadgeColors(user.is_active, isDark);
                  return (
                    <tr key={user.id} style={{ borderBottom: index < filteredUsers.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: palette.gray.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: colors.muted, fontWeight: 500 }}>
                              {user.first_name.charAt(0)}
                              {user.last_name.charAt(0)}
                            </span>
                          </div>
                          <div style={{ marginLeft: '1rem' }}>
                            <div style={{ fontWeight: 500, color: colors.text }}>
                              {user.first_name} {user.last_name}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: colors.muted }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '9999px', backgroundColor: roleBadge.bg, color: roleBadge.text }}>
                          {user.role_name.charAt(0).toUpperCase() + user.role_name.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '9999px', backgroundColor: statusBadge.bg, color: statusBadge.text }}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: colors.muted }}>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEdit(user)}
                            style={{ padding: '0.5rem', color: colors.muted, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'color 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseOut={(e) => e.currentTarget.style.color = colors.muted}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={submitting}
                            style={{ padding: '0.5rem', color: colors.muted, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'color 0.2s', opacity: submitting ? 0.5 : 1 }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                            onMouseOut={(e) => e.currentTarget.style.color = colors.muted}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredUsers.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: colors.muted }}>No users found</div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: colors.cardBg, borderRadius: '1rem', maxWidth: '28rem', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: palette.red.bg, padding: '0.75rem', borderRadius: '0.5rem' }}>
                <UserPlus style={{ width: '1.5rem', height: '1.5rem', color: palette.red.text }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, marginLeft: '0.75rem' }}>
                {editingId ? 'Edit User' : 'Add New User'}
              </h3>
            </div>

            <form
              onSubmit={(e) => (editingId ? handleUpdate(e, editingId) : handleAdd(e))}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {formError && (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: palette.red.bg, color: palette.red.text, fontSize: '0.875rem' }}>{formError}</div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  placeholder="john@company.com"
                  required
                  readOnly={!!editingId}
                />
                {editingId && (
                  <p style={{ fontSize: '0.75rem', color: colors.muted, marginTop: '0.25rem' }}>Email cannot be changed</p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                  Password {editingId && '(leave blank to keep unchanged)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  placeholder="••••••••"
                  required={!editingId}
                  minLength={6}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>Role</label>
                <select
                  value={form.role_id}
                  onChange={(e) => setForm((f) => ({ ...f, role_id: parseInt(e.target.value, 10) }))}
                  style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                >
                  {roles.length > 0
                    ? roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                      </option>
                    ))
                    : (
                      <>
                        <option value={1}>Admin</option>
                        <option value={2}>Developer</option>
                        <option value={3}>Viewer</option>
                      </>
                    )}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ flex: 1, padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, color: colors.text, borderRadius: '0.5rem', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.5 : 1, transition: 'background-color 0.2s' }}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
