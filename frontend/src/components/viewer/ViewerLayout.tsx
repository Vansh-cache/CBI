import { ReactNode, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router';
import { Eye, LayoutDashboard, LogOut, Menu, X, ArrowLeft } from 'lucide-react';
import type { User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';

interface ViewerLayoutProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
  dashboardName?: string;
}

export default function ViewerLayout({ user, onLogout, children, dashboardName }: ViewerLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  // Check if we're viewing a specific dashboard
  const isViewingDashboard = location.pathname.startsWith('/viewer/view/');

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Theme colors - Viewer: green (matches landing)
  const colors = {
    bg: isDark ? '#0f0f1a' : '#f1f5f9',
    header: isDark ? 'rgba(26, 26, 46, 0.92)' : 'rgba(255,255,255,0.98)',
    headerBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
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
    dropdownBg: isDark ? 'rgba(26, 26, 46, 0.98)' : '#ffffff',
    dropdownBorder: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
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
      {/* Top Navigation Bar */}
      <nav style={{
        background: colors.header,
        borderBottom: `1px solid ${colors.headerBorder}`,
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}>
            {/* Logo and Brand */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="mobile-menu-btn"
                style={{
                  marginRight: '12px',
                  background: 'none',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                {mobileMenuOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
              </button>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  background: colors.logoGradient,
                  padding: '10px',
                  borderRadius: '12px',
                  boxShadow: colors.logoShadow,
                }}>
                  <Eye style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <span style={{
                  marginLeft: '12px',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: colors.text,
                }}>
                  Cache BI
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="desktop-nav" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px'
            }}>
              {isViewingDashboard ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => navigate('/viewer/dashboard')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.textMuted,
                      transition: 'all 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.navHover;
                      e.currentTarget.style.color = colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    <ArrowLeft style={{ width: '20px', height: '20px' }} />
                  </button>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: colors.accentBg,
                    color: colors.accent,
                    fontWeight: 500,
                  }}>
                    <LayoutDashboard style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                    {dashboardName || 'Dashboard'}
                  </div>
                </div>
              ) : (
                <NavLink
                  to="/viewer/dashboard"
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    transition: 'all 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                    background: isActive ? colors.accentBg : 'transparent',
                    color: isActive ? colors.accent : colors.textMuted,
                    fontWeight: isActive ? 500 : 400,
                  })}
                >
                  <LayoutDashboard style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                  My Dashboards
                </NavLink>
              )}
            </div>

            {/* Right Section */}
            <div className="desktop-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <ThemeToggle size="sm" />

              {/* User Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.navHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: colors.accentBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ color: colors.accent, fontWeight: 500, fontSize: '14px' }}>
                      {user.first_name.charAt(0)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: colors.text,
                      margin: 0,
                    }}>
                      {user.first_name} {user.last_name}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: colors.textMuted,
                      margin: 0,
                    }}>
                      Viewer
                    </p>
                  </div>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '220px',
                    background: colors.dropdownBg,
                    borderRadius: '12px',
                    boxShadow: isDark
                      ? '0 10px 40px rgba(0,0,0,0.5)'
                      : '0 10px 40px rgba(0,0,0,0.1)',
                    border: `1px solid ${colors.headerBorder}`,
                    backdropFilter: isDark ? 'blur(20px)' : undefined,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '16px',
                      borderBottom: `1px solid ${colors.headerBorder}`,
                    }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: colors.text,
                        margin: 0,
                      }}>
                        {user.first_name} {user.last_name}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        margin: '4px 0 0 0',
                      }}>
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#ef4444',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDark
                          ? 'rgba(239, 68, 68, 0.15)'
                          : '#fef2f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <LogOut style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div style={{
            borderTop: `1px solid ${colors.headerBorder}`,
            background: colors.header,
            padding: '16px 24px',
          }}>
            <NavLink
              to="/viewer/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'all 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                background: isActive ? colors.accentBg : 'transparent',
                color: isActive ? colors.accent : colors.textMuted,
              })}
            >
              <LayoutDashboard style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              My Dashboards
            </NavLink>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="animate-fade-in" style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: isViewingDashboard ? 'none' : '1400px',
        margin: '0 auto',
        padding: isViewingDashboard ? '0' : '32px 24px',
        height: isViewingDashboard ? 'auto' : 'auto',
        minHeight: isViewingDashboard ? 'calc(100vh - 64px)' : 'auto',
        overflow: 'visible',
      }}>
        {children}
      </main>

      {/* Responsive styles */}
      <style>{`
        .mobile-menu-btn { display: none !important; }
        .desktop-nav { display: flex !important; }
        .desktop-right { display: flex !important; }
        @media (max-width: 767px) {
          .mobile-menu-btn { display: block !important; }
          .desktop-nav { display: none !important; }
          .desktop-right > *:not(:last-child) { display: none !important; }
        }
        @media (max-width: 1023px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}