import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette } from '../../lib/themeColors';

export default function ViewerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loading, error: authError, clearError } = useAuth();

  // Theme support
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearError();
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    try {
      const user = await login(email.trim(), password);
      if (user.role_name === 'admin') navigate('/admin/dashboard');
      else if (user.role_name === 'developer') navigate('/developer/dashboard');
      else navigate('/viewer/dashboard');
    } catch {
      setError(authError || 'Invalid email or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(to bottom right, #0f0f1a, #1a1a2e)'
        : 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            color: colors.muted,
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <div style={{
          backgroundColor: colors.cardBg,
          borderRadius: '1rem',
          boxShadow: colors.cardShadow,
          padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              backgroundColor: `${palette.green}20`,
              width: '4rem',
              height: '4rem',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Eye className="w-8 h-8" style={{ color: palette.green }} />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: colors.text, marginBottom: '0.5rem' }}>Viewer Portal</h1>
            <p style={{ color: colors.muted }}>Access your dashboards</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {(error || authError) && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: `${palette.red}20`,
                color: palette.red,
                fontSize: '0.875rem'
              }}>
                {error || authError}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.muted }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '0.5rem',
                    outline: 'none'
                  }}
                  placeholder="viewer@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.muted }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '0.5rem',
                    outline: 'none'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" style={{ borderRadius: '0.25rem' }} />
                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: colors.muted }}>Remember me</span>
              </label>
              <a href="#" style={{ fontSize: '0.875rem', color: palette.green, textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
