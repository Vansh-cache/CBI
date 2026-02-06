import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart3,
  Eye,
  Clock,
  TrendingUp,
  Search,
  Star,
  Loader2,
} from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette } from '../../lib/themeColors';

// Responsive hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
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
  config: string | object;
  created_by: number;
  created_by_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permission_type?: 'view' | 'edit';
}

export default function ViewerHome() {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Theme support
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);
  const isMobile = useIsMobile();

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

  const filteredDashboards = dashboards.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDashboards = [...filteredDashboards].sort((a, b) => {
    const aFav = favorites.includes(String(a.id));
    const bFav = favorites.includes(String(b.id));
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  const widgetCount = (d: Dashboard) => {
    if (!d.config) return 0;
    try {
      const c = typeof d.config === 'string' ? JSON.parse(d.config) : d.config;
      // Check for multi-page structure first, then fall back to legacy single-page
      const pages = (c as { pages?: { widgets?: unknown[] }[] }).pages;
      if (Array.isArray(pages) && pages.length > 0) {
        // Count widgets across all pages
        return pages.reduce((total, page) => {
          const widgets = page.widgets;
          return total + (Array.isArray(widgets) ? widgets.length : 0);
        }, 0);
      }
      // Legacy: single-page structure
      const w = (c as { widgets?: unknown[] }).widgets;
      return Array.isArray(w) ? w.length : 0;
    } catch {
      return 0;
    }
  };

  const toggleFavorite = (dashboardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(dashboardId)
        ? prev.filter((id) => id !== dashboardId)
        : [...prev, dashboardId]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="animate-fade-in-down" style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: 700, color: colors.text, marginBottom: '0.5rem' }}>My Dashboards</h1>
          <p style={{ color: colors.muted, fontSize: isMobile ? '0.875rem' : '1rem' }}>Access your assigned analytics dashboards</p>
        </div>
        <div style={{ flex: 1, maxWidth: isMobile ? '100%' : '28rem' }}>
          <div style={{ position: 'relative' }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.muted }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dashboards..."
              style={{
                width: '100%',
                paddingLeft: '3rem',
                paddingRight: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                backgroundColor: colors.inputBg,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '0.5rem',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                fontSize: isMobile ? '1rem' : '0.875rem'
              }}
            />
          </div>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Available Dashboards</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 700, color: colors.text }}>
                {loading ? '—' : dashboards.length}
              </p>
            </div>
            <BarChart3 className="w-12 h-12" style={{ color: palette.red }} />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Favorites</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 700, color: colors.text }}>{favorites.length}</p>
            </div>
            <Star className="w-12 h-12" style={{ color: palette.orange }} />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '0.25rem' }}>Recently Viewed</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 700, color: colors.text }}>—</p>
            </div>
            <Clock className="w-12 h-12" style={{ color: palette.blue }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: palette.red }} />
        </div>
      ) : (
        <>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Your Dashboards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedDashboards.map((d, index) => {
                const isFavorite = favorites.includes(String(d.id));
                return (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/viewer/view/${d.id}`)}
                    className="hover-lift animate-fade-in-up group"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderRadius: '0.75rem',
                      boxShadow: colors.cardShadow,
                      border: `1px solid ${colors.cardBorder}`,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      animationDelay: `${Math.min(index, 8) * 50}ms`,
                      opacity: 0
                    }}
                  >
                    <button
                      onClick={(e) => toggleFavorite(String(d.id), e)}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        zIndex: 10,
                        padding: '0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: isFavorite ? `${palette.orange}30` : `${colors.cardBg}ee`,
                        color: isFavorite ? palette.orange : colors.muted,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Star
                        className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500' : ''}`}
                      />
                    </button>
                    <div style={{
                      height: '10rem',
                      background: isDark
                        ? 'linear-gradient(to bottom right, #2a1a1a, #1a1a2a)'
                        : 'linear-gradient(to bottom right, #fef2f2, #fff7ed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: `1px solid ${colors.cardBorder}`
                    }}>
                      <BarChart3 className="w-16 h-16 group-hover:opacity-100 transition-opacity" style={{ color: palette.red, opacity: 0.5 }} />
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }} className="group-hover:text-red-600 transition-colors">
                        {d.name}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: colors.muted, marginBottom: '1rem' }} className="line-clamp-2">
                        {d.description || 'No description'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', color: colors.muted }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Star
                            className={`w-4 h-4 mr-1 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''
                              }`}
                          />
                          <span>
                            {isFavorite ? 'Favorited' : 'Add to favorites'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <BarChart3 className="w-4 h-4 mr-1" />
                          <span>{widgetCount(d)} widgets</span>
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.cardBorder}` }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/viewer/view/${d.id}`);
                          }}
                          className="transition-smooth hover-scale"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {filteredDashboards.length === 0 && (
            <div style={{
              backgroundColor: colors.cardBg,
              borderRadius: '0.75rem',
              padding: '3rem',
              textAlign: 'center',
              border: `1px solid ${colors.cardBorder}`
            }}>
              <BarChart3 className="w-16 h-16 mx-auto mb-4" style={{ color: colors.muted }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>No Dashboards Found</h3>
              <p style={{ color: colors.muted }}>
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'No dashboards have been assigned to you yet'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Quick Tips */}
      <div>
        <h2 style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Quick Tips</h2>
        <div style={{
          background: 'linear-gradient(to right, #ef4444, #f97316)',
          borderRadius: '0.75rem',
          padding: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', gap: isMobile ? '1rem' : '0' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '0.5rem', marginRight: isMobile ? '0' : '1rem' }}>
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: isMobile ? '1rem' : '1.125rem' }}>
                Star Your Favorite Dashboards
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '0.75rem', fontSize: isMobile ? '0.875rem' : '1rem' }}>
                Click the star icon on any dashboard card to mark it as a favorite.
                Your starred dashboards appear at the top for quick access.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '0.875rem' : '1rem' }}>
                <li style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>•</span>
                  <span>Use the search bar to find specific dashboards</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>•</span>
                  <span>Dashboards update with the latest data</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
