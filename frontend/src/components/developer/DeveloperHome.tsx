import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, Copy, BarChart3, Loader2 } from 'lucide-react';
import { apiDelete } from '../../lib/api';
import { useNavigate } from 'react-router';
import { apiGet } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette } from '../../lib/themeColors';

interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  config: string | object;
  created_by: number;
  created_by_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assignment_count?: number;
}

export default function DeveloperHome() {
  const [deletingId, setDeletingId] = useState<number | null>(null);
    const handleDelete = async (dashboardId: number) => {
      if (!window.confirm('Are you sure you want to delete this dashboard? This action cannot be undone.')) return;
      setDeletingId(dashboardId);
      try {
        await apiDelete(`/api/dashboards/${dashboardId}`);
        setDashboards((prev) => prev.filter((d) => d.id !== dashboardId));
      } catch (e) {
        alert('Failed to delete dashboard.');
      } finally {
        setDeletingId(null);
      }
    };
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Theme support
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);

  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<Dashboard[]>('/api/dashboards');
      if (res.success && res.data) {
        setDashboards(Array.isArray(res.data) ? res.data : []);
      } else {
        setDashboards([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch dashboards');
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  const widgetCount = (d: Dashboard) => {
    if (!d.config) return 0;
    try {
      const c = typeof d.config === 'string' ? JSON.parse(d.config) : d.config;
      const w = (c as { widgets?: unknown[] }).widgets;
      return Array.isArray(w) ? w.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="animate-fade-in-down" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.text, marginBottom: '0.25rem' }}>My Dashboards</h2>
          <p style={{ color: colors.muted }}>Create and manage your dashboards</p>
        </div>
        <button
          onClick={() => navigate('/developer/builder')}
          className="hover-scale transition-smooth"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          New Dashboard
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          borderRadius: '0.5rem',
          backgroundColor: `${palette.red}20`,
          color: palette.red,
          fontSize: '0.875rem'
        }}>{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          className="hover-lift animate-fade-in-up"
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: colors.cardShadow,
            border: `1px solid ${colors.cardBorder}`,
            animationDelay: '80ms',
            opacity: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Total Dashboards</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 700, color: colors.text }}>
                {loading ? '—' : dashboards.length}
              </p>
            </div>
            <BarChart3 className="w-8 h-8" style={{ color: palette.purple }} />
          </div>
        </div>
        <div
          className="hover-lift animate-fade-in-up"
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: colors.cardShadow,
            border: `1px solid ${colors.cardBorder}`,
            animationDelay: '160ms',
            opacity: 0
          }}
        >
          <div>
            <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Active</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 700, color: palette.green }}>
              {loading ? '—' : dashboards.filter((d) => d.is_active).length}
            </p>
          </div>
        </div>
        <div
          className="hover-lift animate-fade-in-up"
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: colors.cardShadow,
            border: `1px solid ${colors.cardBorder}`,
            animationDelay: '240ms',
            opacity: 0
          }}
        >
          <div>
            <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Total Widgets</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 700, color: palette.blue }}>
              {loading ? '—' : dashboards.reduce((s, d) => s + widgetCount(d), 0)}
            </p>
          </div>
        </div>
        <div
          className="hover-lift animate-fade-in-up"
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: colors.cardShadow,
            border: `1px solid ${colors.cardBorder}`,
            animationDelay: '320ms',
            opacity: 0
          }}
        >
          <div>
            <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Assignments</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 700, color: palette.purple }}>
              {loading
                ? '—'
                : dashboards.reduce((s, d) => s + (d.assignment_count ?? 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: palette.purple }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboards.map((d, i) => (
            <div
              key={d.id}
              className="hover-lift animate-fade-in-up"
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '0.75rem',
                boxShadow: colors.cardShadow,
                border: `1px solid ${colors.cardBorder}`,
                overflow: 'hidden',
                animationDelay: `${i * 60}ms`,
                opacity: 0
              }}
            >
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text }}>{d.name}</h3>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          borderRadius: '9999px',
                          backgroundColor: d.is_active ? `${palette.green}20` : `${palette.gray}20`,
                          color: d.is_active ? palette.green : palette.gray
                        }}
                      >
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.75rem' }}>
                      {d.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: colors.muted }}>
                      <span>By {d.created_by_email ?? '—'}</span>
                      <span>•</span>
                      <span>
                        {d.created_at
                          ? new Date(d.created_at).toLocaleDateString()
                          : '—'}
                      </span>
                      <span>•</span>
                      <span>{widgetCount(d)} widgets</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: `1px solid ${colors.cardBorder}` }}>
                  <div style={{ fontSize: '0.875rem', color: colors.muted }}>
                    {(d.assignment_count ?? 0)} assignment(s)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => navigate(`/developer/preview/${d.id}`)}
                      style={{ padding: '0.5rem', color: colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/developer/builder/${d.id}`)}
                      style={{ padding: '0.5rem', color: colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      style={{ padding: '0.5rem', color: colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Duplicate (coming soon)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      style={{ padding: '0.5rem', color: colors.muted, background: 'none', border: 'none', cursor: deletingId === d.id ? 'wait' : 'pointer', opacity: deletingId === d.id ? 0.5 : 1 }}
                      title="Delete"
                      disabled={deletingId === d.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && dashboards.length === 0 && (
        <div style={{
          backgroundColor: colors.cardBg,
          borderRadius: '0.75rem',
          padding: '3rem',
          textAlign: 'center',
          border: `1px solid ${colors.cardBorder}`
        }}>
          <BarChart3 className="w-16 h-16 mx-auto mb-4" style={{ color: colors.muted }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>No dashboards yet</h3>
          <p style={{ color: colors.muted, marginBottom: '1rem' }}>Create your first dashboard to get started.</p>
          <button
            onClick={() => navigate('/developer/builder')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            New Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
