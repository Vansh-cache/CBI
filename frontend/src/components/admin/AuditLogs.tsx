import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette } from '../../lib/themeColors';

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  resource_type: string;
  resource_id: number | null;
  details: string | { success?: boolean };
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface AuditApiResponse {
  success: boolean;
  data?: AuditLog[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export default function AuditLogs() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = useCallback(async (page = 1, limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = (await apiGet<AuditLog[]>(
        `/api/admin/audit-logs?${params}`
      )) as unknown as AuditApiResponse;
      if (res.success && res.data) {
        setLogs(Array.isArray(res.data) ? res.data : []);
        if (res.pagination) {
          setPagination((p) => ({
            ...p,
            ...res.pagination!,
          }));
        }
      } else {
        setLogs([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1, 50);
  }, [fetchLogs]);

  const getStatus = (log: AuditLog): 'success' | 'failed' => {
    if (!log.details) return 'success';
    let d: { success?: boolean } = {};
    try {
      d = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details as object);
    } catch {
      return 'success';
    }
    return d?.success === false ? 'failed' : 'success';
  };

  const userDisplay = (log: AuditLog) => {
    if (log.user_email) return log.user_email;
    if (log.first_name || log.last_name) {
      return [log.first_name, log.last_name].filter(Boolean).join(' ');
    }
    return 'system';
  };

  const resourceDisplay = (log: AuditLog) => {
    if (log.resource_type && log.resource_id) return `${log.resource_type} #${log.resource_id}`;
    return log.resource_type || '—';
  };

  const filteredLogs = logs.filter((log) => {
    const user = userDisplay(log).toLowerCase();
    const action = log.action.toLowerCase();
    const resource = resourceDisplay(log).toLowerCase();
    const matchesSearch =
      user.includes(searchTerm.toLowerCase()) ||
      action.includes(searchTerm.toLowerCase()) ||
      resource.includes(searchTerm.toLowerCase());
    const status = getStatus(log);
    const matchesStatus =
      filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'success'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const successCount = logs.filter((l) => getStatus(l) === 'success').length;
  const failedCount = logs.filter((l) => getStatus(l) === 'failed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.text, marginBottom: '0.25rem' }}>Audit Logs</h2>
          <p style={{ color: colors.muted }}>Track all system activities and changes</p>
        </div>
        <button
          style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
          title="Export (coming soon)"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Logs
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: palette.red.bg, color: palette.red.text, fontSize: '0.875rem' }}>{error}</div>
      )}

      {/* Filters */}
      <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ gridColumn: 'span 2', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: colors.muted }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user, action, or resource..."
              style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as 'all' | 'success' | 'failed')
            }
            style={{ padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Total Events</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text }}>{logs.length}</p>
            </div>
            <FileText style={{ width: '2rem', height: '2rem', color: colors.muted }} />
          </div>
        </div>
        <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Successful</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{successCount}</p>
            </div>
            <CheckCircle style={{ width: '2rem', height: '2rem', color: '#4ade80' }} />
          </div>
        </div>
        <div style={{ backgroundColor: colors.cardBg, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Failed</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{failedCount}</p>
            </div>
            <XCircle style={{ width: '2rem', height: '2rem', color: '#f87171' }} />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
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
                    Timestamp
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    User
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Action
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Resource
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const status = getStatus(log);
                  const statusColors = status === 'success' ? palette.green : palette.red;
                  return (
                    <tr key={log.id} style={{ borderBottom: index < filteredLogs.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: colors.text, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : '—'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: palette.gray.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: colors.muted }}>
                              {userDisplay(log) === 'system'
                                ? 'SYS'
                                : userDisplay(log).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span style={{ marginLeft: '0.75rem', fontSize: '0.875rem', color: colors.text }}>
                            {userDisplay(log)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 500, color: colors.text }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: colors.muted }}>
                        {resourceDisplay(log)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {status === 'success' ? (
                            <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                          ) : (
                            <XCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                          )}
                          <span style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '9999px', backgroundColor: statusColors.bg, color: statusColors.text }}>
                            {status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredLogs.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: colors.muted }}>No audit logs found</div>
        )}
      </div>
    </div>
  );
}
