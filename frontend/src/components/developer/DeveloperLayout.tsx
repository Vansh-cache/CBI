import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Wand2,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  Code
} from 'lucide-react';
import type { User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';

interface DeveloperLayoutProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
}

export default function DeveloperLayout({ user, onLogout, children }: DeveloperLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { to: '/developer/dashboard', icon: LayoutDashboard, label: 'My Dashboards' },
    { to: '/developer/builder', icon: Wand2, label: 'Dashboard Builder' },
    { to: '/developer/data-mapping', icon: Database, label: 'Data Mapping' },
    { to: '/developer/api-config', icon: Settings, label: 'API Configuration' }
  ];

  // Theme colors - Developer: indigo-purple (matches landing)
  const colors = {
    bg: isDark ? '#0f0f1a' : '#f1f5f9',
    sidebar: isDark ? 'rgba(26, 26, 46, 0.92)' : 'rgba(255,255,255,0.98)',
    sidebarBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    header: isDark ? 'rgba(26, 26, 46, 0.92)' : 'rgba(255,255,255,0.98)',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    accent: '#ef4444',
    logoGradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    logoShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
    accentBg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
    accentHover: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
    accentText: isDark ? '#fca5a5' : '#dc2626',
    navHover: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    navActive: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    cardBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    cardShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)',
    orb1: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
    orb2: isDark ? 'rgba(249, 115, 22, 0.18)' : 'rgba(249, 115, 22, 0.1)',
    gridColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background (Landing style) */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px',
          background: `radial-gradient(circle, ${colors.orb1} 0%, transparent 70%)`, borderRadius: '50%',
          filter: 'blur(60px)', animation: 'portal-float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-10%', width: '500px', height: '500px',
          background: `radial-gradient(circle, ${colors.orb2} 0%, transparent 70%)`, borderRadius: '50%',
          filter: 'blur(80px)', animation: 'portal-float 10s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${colors.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${colors.gridColor} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 20,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: sidebarOpen ? 'fixed' : 'relative',
        inset: sidebarOpen ? '0 auto 0 0' : undefined,
        width: '260px',
        background: colors.sidebar,
        borderRight: `1px solid ${colors.sidebarBorder}`,
        backdropFilter: 'blur(20px)',
        zIndex: 30,
        boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.2)' : '4px 0 24px rgba(0,0,0,0.06)',
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: `1px solid ${colors.sidebarBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              background: colors.logoGradient,
              padding: '10px',
              borderRadius: '12px',
              boxShadow: colors.logoShadow,
            }}>
              <Code style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <span style={{
              marginLeft: '12px',
              fontWeight: 600,
              color: colors.text,
              fontSize: '16px',
            }}>
              Dev Portal
            </span>
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.textMuted,
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: '16px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'all 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                background: isActive ? colors.accentBg : 'transparent',
                color: isActive ? colors.accent : colors.textMuted,
                fontWeight: isActive ? 500 : 400,
              })}
            >
              <item.icon style={{ width: '20px', height: '20px', marginRight: '12px' }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div style={{
          padding: '16px',
          borderTop: `1px solid ${colors.sidebarBorder}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: colors.accentBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: colors.accent, fontWeight: 500 }}>
                {user.first_name.charAt(0)}
              </span>
            </div>
            <div style={{ marginLeft: '12px', flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 500,
                color: colors.text,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.first_name} {user.last_name}
              </p>
              <p style={{
                fontSize: '12px',
                color: colors.textMuted,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              fontSize: '14px',
              color: colors.accent,
              background: 'transparent',
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.accentBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
        {/* Top Bar */}
        <header style={{
          height: '64px',
          background: colors.header,
          borderBottom: `1px solid ${colors.sidebarBorder}`,
          backdropFilter: isDark ? 'blur(20px)' : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: colors.textMuted,
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              <Menu style={{ width: '24px', height: '24px' }} />
            </button>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: colors.text,
              margin: 0,
            }}>
              Developer Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ThemeToggle size="sm" />
            <span style={{ fontSize: '14px', color: colors.textMuted }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="animate-fade-in" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'transparent',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}