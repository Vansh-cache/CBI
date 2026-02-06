import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
  Users,
  LayoutDashboard,
  Database,
  Activity,
  Key,
  Shield,
  Loader2,
} from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';

interface OverviewCounts {
  users: number;
  dashboards: number;
  datasets: number;
  apiConfigs: number;
}

export default function AdminOverview() {
  const { isDark } = useTheme();
  const [counts, setCounts] = useState<OverviewCounts>({
    users: 0,
    dashboards: 0,
    datasets: 0,
    apiConfigs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme colors
  const colors = {
    text: isDark ? '#f1f5f9' : '#1e293b',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.98)',
    cardBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    cardShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)',
    sectionBorder: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
  };

  const colorPalette = {
    blue: {
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
      text: isDark ? '#60a5fa' : '#2563eb',
      icon: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
    },
    purple: {
      bg: isDark ? 'rgba(147, 51, 234, 0.15)' : '#faf5ff',
      text: isDark ? '#a78bfa' : '#9333ea',
      icon: isDark ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff',
    },
    green: {
      bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
      text: isDark ? '#4ade80' : '#16a34a',
      icon: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
    },
    orange: {
      bg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#fff7ed',
      text: isDark ? '#fb923c' : '#ea580c',
      icon: isDark ? 'rgba(249, 115, 22, 0.2)' : '#ffedd5',
    },
    red: {
      bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      text: isDark ? '#f87171' : '#dc2626',
      icon: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
    },
  };

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, dashRes, dataRes, apiRes] = await Promise.all([
        apiGet<unknown[]>('/api/users'),
        apiGet<unknown[]>('/api/dashboards'),
        apiGet<unknown[]>('/api/data/datasets'),
        apiGet<unknown[]>('/api/admin/api-configs'),
      ]);
      setCounts({
        users: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
        dashboards: Array.isArray(dashRes.data) ? dashRes.data.length : 0,
        datasets: Array.isArray(dataRes.data) ? dataRes.data.length : 0,
        apiConfigs: Array.isArray(apiRes.data) ? apiRes.data.length : 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const kpiCards = [
    {
      title: 'Total Users',
      value: loading ? '—' : counts.users.toLocaleString(),
      icon: Users,
      color: 'blue' as const,
      description: 'Registered system users',
    },
    {
      title: 'Active Dashboards',
      value: loading ? '—' : counts.dashboards,
      icon: LayoutDashboard,
      color: 'purple' as const,
      description: 'Published dashboards',
    },
    {
      title: 'Data Sources',
      value: loading ? '—' : counts.datasets,
      icon: Database,
      color: 'green' as const,
      description: 'Connected data sources',
    },
    {
      title: 'API Configurations',
      value: loading ? '—' : counts.apiConfigs,
      icon: Key,
      color: 'orange' as const,
      description: 'Configured API connections',
    },
  ];

  const managementSections = [
    {
      title: 'User Management',
      icon: Users,
      description: 'Manage users, roles, and permissions',
      link: '/admin/users',
      count: counts.users,
      color: 'blue' as const,
    },
    {
      title: 'Data Sources',
      icon: Database,
      description: 'Configure and manage data connections',
      link: '/admin/data-sources',
      count: counts.datasets,
      color: 'green' as const,
    },
    {
      title: 'Access Control',
      icon: Shield,
      description: 'Control dashboard and feature access',
      link: '/admin/access-control',
      count: counts.dashboards,
      color: 'purple' as const,
    },
    {
      title: 'API Configuration',
      icon: Key,
      description: 'Manage API keys and endpoints',
      link: '/admin/api-config',
      count: counts.apiConfigs,
      color: 'orange' as const,
    },
  ];

  if (loading && counts.users === 0 && counts.dashboards === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Loader2 style={{ width: '40px', height: '40px', color: '#ef4444', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="animate-fade-in-down">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.text, marginBottom: '4px' }}>System Overview</h2>
        <p style={{ color: colors.textMuted }}>Manage your Cache BI dashboard system</p>
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: colorPalette.red.bg, color: colorPalette.red.text, fontSize: '14px' }}>{error}</div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {kpiCards.map((kpi, i) => {
          const palette = colorPalette[kpi.color];
          return (
            <div
              key={kpi.title}
              className="hover-lift"
              style={{
                background: colors.cardBg, borderRadius: '20px', padding: '28px', border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow, transition: 'all 0.4s cubic-bezier(0.33, 1, 0.68, 1)', backdropFilter: 'blur(10px)',
                animation: 'animate-fade-in-up 0.5s ease-out forwards',
                animationDelay: `${i * 80}ms`,
                opacity: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = isDark ? '0 20px 40px rgba(0,0,0,0.35)' : '0 20px 40px rgba(0,0,0,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = colors.cardShadow; }}
            >
              <div style={{ marginBottom: '16px' }}>
                <div style={{ background: palette.icon, padding: '12px', borderRadius: '12px', display: 'inline-flex' }}>
                  <kpi.icon style={{ width: '24px', height: '24px', color: palette.text }} />
                </div>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: palette.text, marginBottom: '4px' }}>{kpi.title}</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, marginBottom: '8px' }}>{kpi.value}</p>
              <p style={{ fontSize: '14px', color: colors.textMuted }}>{kpi.description}</p>
            </div>
          );
        })}
      </div>

      {/* Management Sections */}
      <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text, marginBottom: '16px' }}>Quick Access</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {managementSections.map((section, i) => {
            const palette = colorPalette[section.color];
            return (
              <Link
                key={section.title}
                to={section.link}
                className="hover-lift"
                style={{
                  background: colors.cardBg, borderRadius: '20px', padding: '28px', border: `1px solid ${colors.cardBorder}`,
                  boxShadow: colors.cardShadow, textDecoration: 'none', transition: 'all 0.4s cubic-bezier(0.33, 1, 0.68, 1)', backdropFilter: 'blur(10px)',
                  animation: 'animate-fade-in-up 0.5s ease-out forwards',
                  animationDelay: `${500 + i * 80}ms`,
                  opacity: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = isDark ? '0 20px 40px rgba(0,0,0,0.35)' : '0 20px 40px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = colors.cardShadow; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ background: palette.icon, padding: '12px', borderRadius: '12px', transition: 'transform 0.35s cubic-bezier(0.33, 1, 0.68, 1)' }}>
                    <section.icon style={{ width: '24px', height: '24px', color: palette.text }} />
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: palette.text }}>
                    {loading ? '—' : section.count}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                  {section.title}
                </h4>
                <p style={{ fontSize: '14px', color: colors.textMuted }}>{section.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      <div className="animate-fade-in-up animate-delay-300">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text, marginBottom: '16px' }}>System Status</h3>
        <div style={{ background: colors.cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${colors.cardBorder}`, boxShadow: colors.cardShadow, transition: 'transform 0.35s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.35s cubic-bezier(0.33, 1, 0.68, 1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${colors.sectionBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: colorPalette.green.icon, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                  <Activity style={{ width: '20px', height: '20px', color: colorPalette.green.text }} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 500, color: colors.text }}>API Services</h4>
                  <p style={{ fontSize: '14px', color: colors.textMuted }}>All services operational</p>
                </div>
              </div>
              <span style={{ padding: '4px 12px', background: colorPalette.green.bg, color: colorPalette.green.text, borderRadius: '9999px', fontSize: '14px', fontWeight: 500 }}>
                Online
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${colors.sectionBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: colorPalette.blue.icon, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                  <Database style={{ width: '20px', height: '20px', color: colorPalette.blue.text }} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 500, color: colors.text }}>Database Connection</h4>
                  <p style={{ fontSize: '14px', color: colors.textMuted }}>All connections stable</p>
                </div>
              </div>
              <span style={{ padding: '4px 12px', background: colorPalette.green.bg, color: colorPalette.green.text, borderRadius: '9999px', fontSize: '14px', fontWeight: 500 }}>
                Healthy
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: colorPalette.purple.icon, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                  <Key style={{ width: '20px', height: '20px', color: colorPalette.purple.text }} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 500, color: colors.text }}>API Authentication</h4>
                  <p style={{ fontSize: '14px', color: colors.textMuted }}>JWT-secured endpoints</p>
                </div>
              </div>
              <span style={{ padding: '4px 12px', background: colorPalette.green.bg, color: colorPalette.green.text, borderRadius: '9999px', fontSize: '14px', fontWeight: 500 }}>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs CTA */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text }}>Audit Logs</h3>
          <Link
            to="/admin/audit-logs"
            style={{ fontSize: '14px', color: '#ef4444', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
          >
            View All Logs →
          </Link>
        </div>
        <div style={{ background: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.cardBorder}`, boxShadow: colors.cardShadow, padding: '32px', textAlign: 'center' }}>
          <LayoutDashboard style={{ width: '48px', height: '48px', margin: '0 auto 8px', color: colors.textMuted, opacity: 0.5 }} />
          <p style={{ color: colors.textMuted }}>View full audit history and system activity in Audit Logs.</p>
        </div>
      </div>
    </div>
  );
}
