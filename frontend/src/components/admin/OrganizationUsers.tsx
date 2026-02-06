import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Loader2, RefreshCw, Search } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../lib/api';
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

interface OrgUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  givenName: string;
  surname: string;
  inCacheBi: boolean;
  cacheBiUserId?: number;
  cacheBiRoleId?: number;
}

interface Role {
  id: number;
  name: string;
}

export default function OrganizationUsers() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);
  const isMobile = useIsMobile();

  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState<OrgUser | null>(null);
  const [assignRoleId, setAssignRoleId] = useState<number>(3);
  const [assigning, setAssigning] = useState(false);
  const [updateRoleId, setUpdateRoleId] = useState<{ userId: number; roleId: number } | null>(null);

  const filteredUsers = orgUsers.filter((ou) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (ou.displayName || `${ou.givenName} ${ou.surname}`.trim() || '').toLowerCase();
    const mail = (ou.mail || '').toLowerCase();
    const upn = (ou.userPrincipalName || '').toLowerCase();
    return name.includes(q) || mail.includes(q) || upn.includes(q);
  });

  const fetchOrgUsers = useCallback(async () => {
    try {
      const res = await apiGet<OrgUser[]>('/api/admin/organization-users');
      if (res.success && res.data) setOrgUsers(Array.isArray(res.data) ? res.data : []);
      else setOrgUsers([]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organization users');
      setOrgUsers([]);
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
    setLoading(true);
    Promise.all([fetchOrgUsers(), fetchRoles()]).catch(() => { });
  }, [fetchOrgUsers, fetchRoles]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;
    const email = (assignModal.mail || assignModal.userPrincipalName || '').trim();
    if (!email) {
      setError('User has no email in Microsoft 365. Cannot assign.');
      return;
    }
    setError(null);
    setAssigning(true);
    try {
      const res = await apiPost('/api/admin/organization-users/assign', {
        azure_oid: assignModal.id,
        email,
        first_name: assignModal.givenName || '',
        last_name: assignModal.surname || '',
        role_id: assignRoleId,
      });
      if (res.success) {
        setAssignModal(null);
        fetchOrgUsers();
      } else {
        setError((res as { message?: string }).message || 'Assign failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assign failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateRole = async (cacheBiUserId: number, roleId: number) => {
    setUpdateRoleId({ userId: cacheBiUserId, roleId });
    try {
      await apiPut(`/api/admin/organization-users/${cacheBiUserId}/role`, { role_id: roleId });
      fetchOrgUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdateRoleId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 600, color: colors.text, marginBottom: '0.25rem' }}>
          Organization Users
        </h2>
        <p style={{ color: colors.muted, fontSize: isMobile ? '0.875rem' : '1rem' }}>
          {isMobile ? 'Assign Microsoft 365 users to Cache BI.' : 'View users from your Microsoft 365 organization and assign them Developer or Viewer roles to grant access to Cache BI.'}
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: palette.red.bg, color: palette.red.text, fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: colors.cardBg,
        borderRadius: '0.75rem',
        boxShadow: colors.cardShadow,
        border: `1px solid ${colors.cardBorder}`,
      }}>
        <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', borderBottom: `1px solid ${colors.cardBorder}`, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: isMobile ? '0.75rem' : '1rem' }}>
          <h3 style={{ fontWeight: 600, color: colors.text, fontSize: isMobile ? '1rem' : '1.125rem' }}>Microsoft 365 Users</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: isMobile ? 'none' : '1 1 200px', maxWidth: isMobile ? '100%' : '280px' }}>
            <Search style={{ width: '1rem', height: '1rem', color: colors.muted, flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: '0.5rem',
                backgroundColor: colors.inputBg,
                color: colors.text,
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={() => { setLoading(true); fetchOrgUsers(); }}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: isMobile ? '0.625rem 1rem' : '0.5rem 1rem',
              fontSize: '0.875rem',
              color: '#ef4444',
              backgroundColor: 'transparent',
              border: isMobile ? `1px solid ${colors.cardBorder}` : 'none',
              borderRadius: '0.5rem',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw style={{ width: '1rem', height: '1rem', animation: loading ? 'spin 1s linear infinite' : undefined }} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: isMobile ? '2rem' : '3rem', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ef4444' }} />
          </div>
        ) : orgUsers.length === 0 ? (
          <div style={{ padding: isMobile ? '2rem 1rem' : '3rem', textAlign: 'center', color: colors.muted, fontSize: isMobile ? '0.875rem' : '1rem' }}>
            No organization users found. Ensure Azure configuration and User.Read.All permission are set.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: isMobile ? '2rem 1rem' : '3rem', textAlign: 'center', color: colors.muted, fontSize: isMobile ? '0.875rem' : '1rem' }}>
            No users match &quot;{search}&quot;
          </div>
        ) : isMobile ? (
          /* Mobile Card View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem' }}>
            {filteredUsers.map((ou) => (
              <div key={ou.id} style={{ padding: '1rem', backgroundColor: colors.tableBg, borderRadius: '0.5rem', border: `1px solid ${colors.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: colors.text, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ou.displayName || `${ou.givenName} ${ou.surname}`.trim() || ou.mail || ou.userPrincipalName}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: colors.muted, marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ou.mail || ou.userPrincipalName}
                    </div>
                  </div>
                  {!ou.inCacheBi && (
                    <button
                      onClick={() => {
                        setError(null);
                        setAssignModal(ou);
                        setAssignRoleId(3);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.625rem',
                        fontSize: '0.8125rem',
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: `1px solid #ef4444`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <UserPlus style={{ width: '0.875rem', height: '0.875rem' }} />
                      Assign
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {ou.inCacheBi ? (
                    <>
                      <span style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 500, borderRadius: '9999px', backgroundColor: palette.green.bg, color: palette.green.text }}>
                        In Cache BI
                      </span>
                      {ou.cacheBiRoleId && (
                        <select
                          value={ou.cacheBiRoleId}
                          onChange={(e) => handleUpdateRole(ou.cacheBiUserId!, Number(e.target.value))}
                          disabled={!!updateRoleId}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            border: `1px solid ${colors.inputBorder}`,
                            borderRadius: '0.375rem',
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                          }}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      )}
                    </>
                  ) : (
                    <span style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 500, borderRadius: '9999px', backgroundColor: palette.gray.bg, color: colors.muted }}>
                      Not assigned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop Table View */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: colors.tableBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    User
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    Role
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((ou, idx) => (
                  <tr key={ou.id} style={{ borderBottom: idx < filteredUsers.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontWeight: 500, color: colors.text }}>{ou.displayName || `${ou.givenName} ${ou.surname}`.trim() || ou.mail || ou.userPrincipalName}</span>
                      <p style={{ fontSize: '0.875rem', color: colors.muted, marginTop: '0.125rem' }}>
                        {ou.mail || ou.userPrincipalName}
                      </p>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                      {ou.inCacheBi ? (
                        <span style={{ color: palette.green.text }}>In Cache BI</span>
                      ) : (
                        <span style={{ color: colors.muted }}>Not assigned</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {ou.inCacheBi && ou.cacheBiRoleId ? (
                        <select
                          value={ou.cacheBiRoleId}
                          onChange={(e) => handleUpdateRole(ou.cacheBiUserId!, Number(e.target.value))}
                          disabled={!!updateRoleId}
                          style={{
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.875rem',
                            border: `1px solid ${colors.inputBorder}`,
                            borderRadius: '0.5rem',
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                          }}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: colors.muted }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      {!ou.inCacheBi && (
                        <button
                          onClick={() => {
                            setError(null);
                            setAssignModal(ou);
                            setAssignRoleId(3);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.875rem',
                            color: '#ef4444',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          <UserPlus style={{ width: '1rem', height: '1rem' }} />
                          Assign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: isMobile ? '0' : '1rem' }}>
          <div style={{ backgroundColor: colors.cardBg, borderRadius: isMobile ? '1rem 1rem 0 0' : '0.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: isMobile ? '100%' : '28rem', padding: isMobile ? '1.25rem' : '1.5rem' }}>
            <h3 style={{ fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>
              Assign to Cache BI
            </h3>
            <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {assignModal.displayName || assignModal.mail || assignModal.userPrincipalName}
            </p>
            <form onSubmit={handleAssign}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.25rem' }}>Role</label>
                <select
                  value={assignRoleId}
                  onChange={(e) => setAssignRoleId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '0.5rem',
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    fontSize: isMobile ? '1rem' : '0.875rem',
                  }}
                >
                  <option value={2}>Developer</option>
                  <option value={3}>Viewer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
                    fontSize: isMobile ? '0.9375rem' : '0.875rem',
                    color: colors.muted,
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
                    fontSize: isMobile ? '0.9375rem' : '0.875rem',
                    color: 'white',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: assigning ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
