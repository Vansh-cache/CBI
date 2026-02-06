import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { LayoutDashboard, ArrowLeft, Loader2, Shield, Code, MonitorCheck, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const MicrosoftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
);

export default function UnifiedLogin() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();
    const { loginWithMicrosoft, loading, error: authError, clearError, isMsalConfigured } = useAuth();
    const { isDark } = useTheme();

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Theme colors
    const colors = {
        bg: isDark
            ? 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
        cardBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.98)',
        cardBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        text: isDark ? '#f1f5f9' : '#1e293b',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        inputBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        inputBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : '#d1d5db',
        inputPlaceholder: isDark ? '#64748b' : '#9ca3af',
        orbColor1: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
        orbColor2: isDark ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.15)',
        orbColor3: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
        gridColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        shadow: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.08)',
        errorBg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
        errorBorder: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        errorText: isDark ? '#fca5a5' : '#dc2626',
        linkColor: isDark ? '#fca5a5' : '#ef4444',
        linkHover: isDark ? '#fecaca' : '#dc2626',
    };

    const handleMicrosoftSignIn = async () => {
        setError('');
        clearError();
        try {
            const user = await loginWithMicrosoft(email.trim() || undefined);
            if (user.role_name === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role_name === 'developer') {
                navigate('/developer/dashboard');
            } else if (user.role_name === 'viewer') {
                navigate('/viewer/dashboard');
            } else {
                navigate('/');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : authError || 'Sign-in failed');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* CSS Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(3deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(249, 115, 22, 0.3); }
                }
                .input-focus:focus {
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
                    border-color: #ef4444 !important;
                }
                .btn-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 40px rgba(239, 68, 68, 0.5);
                }
                .role-card:hover {
                    transform: translateY(-4px);
                    border-color: ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(239, 68, 68, 0.3)'};
                    background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(239, 68, 68, 0.08)'};
                }
            `}</style>

            {/* Theme Toggle - Top Right */}
            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
                <ThemeToggle size="sm" />
            </div>

            {/* Animated Background Elements */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    top: '-15%',
                    right: '-10%',
                    width: '400px',
                    height: '400px',
                    background: `radial-gradient(circle, ${colors.orbColor1} 0%, transparent 70%)`,
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    animation: 'float 8s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-15%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    background: `radial-gradient(circle, ${colors.orbColor2} 0%, transparent 70%)`,
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    animation: 'float 10s ease-in-out infinite reverse',
                }} />
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px',
                    height: '300px',
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

            <div style={{
                maxWidth: '440px',
                width: '100%',
                position: 'relative',
                zIndex: 10,
                animation: isVisible ? 'slideUp 0.6s ease-out' : 'none',
            }}>
                {/* Back to Home */}
                <Link
                    to="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: colors.textMuted,
                        textDecoration: 'none',
                        marginBottom: '24px',
                        fontSize: '14px',
                        transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
                    onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
                >
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                    Back to Home
                </Link>

                {/* Login Card */}
                <div style={{
                    background: colors.cardBg,
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '40px',
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: `0 25px 50px -12px ${colors.shadow}`,
                    animation: isVisible ? 'animate-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
                    opacity: 0,
                }}>
                    {/* Logo & Header */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #ef4444, #f97316)',
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
                            animation: 'glow 3s ease-in-out infinite',
                        }}>
                            <LayoutDashboard style={{ width: '40px', height: '40px', color: 'white' }} />
                        </div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: colors.text,
                            marginBottom: '8px',
                            letterSpacing: '-0.5px'
                        }}>
                            Welcome Back
                        </h1>
                        <p style={{ color: colors.textMuted, fontSize: '1rem' }}>
                            Sign in to Cache BI
                        </p>
                    </div>

                    {/* Sign in with Microsoft */}
                    <div>
                        {/* Error Message */}
                        {(error || authError) && (
                            <div style={{
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: colors.errorBg,
                                border: `1px solid ${colors.errorBorder}`,
                                color: colors.errorText,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                marginBottom: '20px',
                            }}>
                                <svg style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '1px' }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error || authError}
                            </div>
                        )}

                        {/* Cache email (optional - pre-fills Microsoft login) */}
                        {isMsalConfigured && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: colors.text,
                                    marginBottom: '8px'
                                }}>
                                    Enter your Cache email
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '20px',
                                        height: '20px',
                                        color: colors.textMuted
                                    }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-focus"
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px 14px 48px',
                                            background: colors.inputBg,
                                            border: `1px solid ${colors.inputBorder}`,
                                            borderRadius: '12px',
                                            color: colors.text,
                                            fontSize: '15px',
                                            outline: 'none',
                                            transition: 'all 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
                                            boxSizing: 'border-box',
                                        }}
                                        placeholder="@cachedigitech.com"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                        )}

                        {isMsalConfigured ? (
                            <button
                                type="button"
                                onClick={handleMicrosoftSignIn}
                                disabled={loading}
                                className="btn-hover"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
                                    transition: 'all 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <MicrosoftIcon />
                                        Sign in with Microsoft
                                    </>
                                )}
                            </button>
                        ) : (
                            <div style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                border: `1px dashed ${colors.cardBorder}`,
                                color: colors.textMuted,
                                fontSize: '14px',
                                textAlign: 'center',
                            }}>
                                Microsoft sign-in is not configured. Set VITE_AZURE_CLIENT_ID and VITE_AZURE_TENANT_ID in your environment.
                            </div>
                        )}
                    </div>

                    {/* Role Info */}
                    <div style={{
                        marginTop: '32px',
                        paddingTop: '24px',
                        borderTop: `1px solid ${colors.cardBorder}`
                    }}>
                        <p style={{
                            textAlign: 'center',
                            color: colors.textMuted,
                            fontSize: '13px',
                            marginBottom: '16px'
                        }}>
                            You'll be redirected based on your role
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px'
                        }}>
                            {[
                                { icon: Shield, label: 'Admin', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
                                { icon: Code, label: 'Developer', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
                                { icon: MonitorCheck, label: 'Viewer', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
                            ].map((role, i) => (
                                <div
                                    key={i}
                                    className="role-card"
                                    style={{
                                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        border: `1px solid ${colors.cardBorder}`,
                                        borderRadius: '12px',
                                        padding: '16px 12px',
                                        textAlign: 'center',
                                        transition: 'all 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
                                        cursor: 'default',
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: role.bg,
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 10px',
                                    }}>
                                        <role.icon style={{ width: '20px', height: '20px', color: role.color }} />
                                    </div>
                                    <span style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500 }}>
                                        {role.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    color: colors.textMuted,
                    fontSize: '13px',
                    marginTop: '24px'
                }}>
                    © 2026 Cache BI Platform. All rights reserved.
                </p>
            </div>
        </div>
    );
}