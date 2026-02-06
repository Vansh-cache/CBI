import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Shield, Code, Eye, ArrowRight, BarChart3, Zap, Lock, Globe, ChevronDown, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './shared/ThemeToggle';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme colors
  const colors = {
    bg: isDark
      ? 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
    text: isDark ? '#ffffff' : '#1e293b',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    navBg: isDark ? 'rgba(15, 15, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    navBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
    cardBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    cardShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)',
    orbColor1: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    orbColor2: isDark ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.15)',
    orbColor3: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
    gridColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    badgeBg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    badgeBorder: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    badgeText: isDark ? '#fca5a5' : '#ef4444',
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, overflow: 'hidden' }}>
      {/* Animated Background Elements */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Floating orbs */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: `radial-gradient(circle, ${colors.orbColor1} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${colors.orbColor2} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'float 10s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${colors.orbColor3} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 6s ease-in-out infinite',
        }} />

        {/* Grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${colors.gridColor} 1px, transparent 1px),
                           linear-gradient(90deg, ${colors.gridColor} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.8), 0 0 60px rgba(249, 115, 22, 0.4); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .hover-lift { transition: all 0.4s ease; }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .hover-glow:hover {
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
        }
        .card-shine {
          position: relative;
          overflow: hidden;
        }
        .card-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s;
        }
        .card-shine:hover::before {
          left: 100%;
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '1rem 2rem',
        background: scrollY > 50 ? colors.navBg : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? `1px solid ${colors.navBorder}` : 'none',
        transition: 'all 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideIn 0.6s ease-out' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              padding: '10px',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            }}>
              <LayoutDashboard style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, letterSpacing: '-0.5px' }}>
              Cache BI
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ThemeToggle size="sm" />
            <Link
              to="/login"
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: 'white',
                borderRadius: '50px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
                animation: 'slideIn 0.6s ease-out 0.2s backwards',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        padding: '160px 24px 100px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: colors.badgeBg,
            border: `1px solid ${colors.badgeBorder}`,
            borderRadius: '50px',
            marginBottom: '32px',
            animation: isVisible ? 'slideUp 0.8s ease-out' : 'none',
          }}>
            <Sparkles style={{ width: '16px', height: '16px', color: colors.badgeText }} />
            <span style={{ color: colors.badgeText, fontSize: '14px', fontWeight: 500 }}>Powerful Analytics Platform</span>
          </div>

          {/* Main Heading */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 800,
            color: colors.text,
            marginBottom: '24px',
            lineHeight: 1.1,
            animation: isVisible ? 'slideUp 0.8s ease-out 0.1s backwards' : 'none',
          }}>
            Cache BI
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #ef4444, #f97316, #dc2626)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Visualization Suite
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '1.25rem',
            color: colors.textMuted,
            maxWidth: '640px',
            margin: '0 auto 48px',
            lineHeight: 1.7,
            animation: isVisible ? 'slideUp 0.8s ease-out 0.2s backwards' : 'none',
          }}>
            Transform your data into actionable insights with our comprehensive analytics and management platform. Built for teams of all sizes.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '60px',
            animation: isVisible ? 'slideUp 0.8s ease-out 0.3s backwards' : 'none',
          }}>
            <Link
              to="/login"
              className="hover-glow"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '18px 36px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: 'white',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '1.1rem',
                textDecoration: 'none',
                boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
              }}
            >
              Get Started Free
              <ArrowRight style={{ width: '20px', height: '20px' }} />
            </Link>
            <a
              href="#features"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '18px 36px',
                background: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                color: colors.text,
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '1.1rem',
                textDecoration: 'none',
                transition: 'all 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
              }}
            >
              Learn More
              <ChevronDown style={{ width: '20px', height: '20px', animation: 'bounce 2s infinite' }} />
            </a>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '60px',
            flexWrap: 'wrap',
            animation: isVisible ? 'fadeIn 1s ease-out 0.5s backwards' : 'none',
          }}>
            {[
              { icon: Users, label: '10K+ Users', color: '#ef4444' },
              { icon: BarChart3, label: '1M+ Charts', color: '#f97316' },
              { icon: TrendingUp, label: '99.9% Uptime', color: '#ef4444' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <stat.icon style={{ width: '28px', height: '28px', color: stat.color, margin: '0 auto 8px' }} />
                <div style={{ color: colors.text, fontWeight: 700, fontSize: '1.1rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        position: 'relative',
        zIndex: 10,
        padding: '100px 24px',
        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: colors.text, marginBottom: '16px' }}>
              Everything You Need
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
              A complete suite of tools for data visualization, management, and collaboration
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: BarChart3, title: 'Interactive Charts', desc: 'Build stunning visualizations with our drag-and-drop dashboard builder', color: '#ef4444' },
              { icon: Globe, title: 'API Integration', desc: 'Connect to any data source with our flexible API configuration', color: '#f97316' },
              { icon: Lock, title: 'Role-Based Access', desc: 'Secure your data with granular permissions and access controls', color: '#ef4444' },
              { icon: Zap, title: 'Real-time Updates', desc: 'Get instant updates with WebSocket-powered live data streaming', color: '#f59e0b' },
            ].map((feature, i) => (
              <div
                key={i}
                className="hover-lift card-shine"
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '20px',
                  padding: '32px',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  animation: isVisible ? 'slideUp 0.6s ease-out forwards' : 'none',
                  animationDelay: `${200 + i * 100}ms`,
                  opacity: 0,
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: `${feature.color}20`,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}>
                  <feature.icon style={{ width: '28px', height: '28px', color: feature.color }} />
                </div>
                <h3 style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: colors.textMuted, lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        padding: '100px 24px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: colors.text, marginBottom: '16px' }}>
              Three Powerful Portals
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
              Different interfaces designed for different roles, all working together seamlessly
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {[
              {
                icon: Shield,
                title: 'Admin Portal',
                desc: 'Full system control and configuration for administrators',
                gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
                shadow: 'rgba(239, 68, 68, 0.3)',
                features: ['User & Role Management', 'Data Source Configuration', 'System Analytics & Audit Logs'],
              },
              {
                icon: Code,
                title: 'Developer Portal',
                desc: 'Build and manage powerful visualizations',
                gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
                shadow: 'rgba(239, 68, 68, 0.3)',
                features: ['Dashboard Builder', 'Data Mapping Tools', 'API Configuration & Preview'],
              },
              {
                icon: Eye,
                title: 'Viewer Portal',
                desc: 'View and interact with assigned dashboards',
                gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
                shadow: 'rgba(239, 68, 68, 0.3)',
                features: ['Interactive Charts & Filters', 'Export to PDF/Image', 'Mobile Responsive View'],
              },
            ].map((portal, i) => (
              <div
                key={i}
                className="hover-lift"
                style={{
                  animation: 'slideUp 0.6s ease-out forwards',
                  animationDelay: `${300 + i * 120}ms`,
                  opacity: 0,
                  background: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '24px',
                  padding: '40px',
                  transition: 'all 0.4s cubic-bezier(0.33, 1, 0.68, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  width: '72px',
                  height: '72px',
                  background: portal.gradient,
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  boxShadow: `0 8px 30px ${portal.shadow}`,
                }}>
                  <portal.icon style={{ width: '36px', height: '36px', color: 'white' }} />
                </div>

                <h3 style={{ color: colors.text, fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
                  {portal.title}
                </h3>
                <p style={{ color: colors.textMuted, marginBottom: '24px', lineHeight: 1.6 }}>{portal.desc}</p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {portal.features.map((f, j) => (
                    <li key={j} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: colors.textMuted,
                      fontSize: '0.95rem',
                      marginBottom: '12px',
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: portal.gradient,
                      }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: '64px' }}>
            <Link
              to="/login"
              className="hover-glow"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '20px 48px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: 'white',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '1.2rem',
                textDecoration: 'none',
                boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
              }}
            >
              Sign In to Your Portal
              <ArrowRight style={{ width: '24px', height: '24px' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        padding: '32px 24px',
        borderTop: `1px solid ${colors.cardBorder}`,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              padding: '6px',
              borderRadius: '8px',
            }}>
              <LayoutDashboard style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <span style={{ color: colors.textMuted, fontSize: '14px' }}>
              © 2026 Cache BI Platform. All rights reserved.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy Policy', 'Terms of Service', 'Contact'].map((item, i) => (
              <a
                key={i}
                href="#"
                style={{ color: colors.textMuted, fontSize: '14px', textDecoration: 'none', transition: 'color 0.3s cubic-bezier(0.33, 1, 0.68, 1)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}