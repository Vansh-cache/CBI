/**
 * Loading Screen - Premium branded loading experience for Cache BI
 * Features: orbital rings, animated particles, glassmorphism, fade-in entrance
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart3 } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Loading...'
}) => {
    const { isDark } = useTheme();
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setEntered(true));
    }, []);

    const c = {
        bg: isDark
            ? 'linear-gradient(140deg, #07070f 0%, #0d0d1f 40%, #111827 100%)'
            : 'linear-gradient(140deg, #f0f4f8 0%, #dfe6ed 40%, #e8ecf1 100%)',
        orbA: isDark ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.14)',
        orbB: isDark ? 'rgba(249, 115, 22, 0.18)' : 'rgba(249, 115, 22, 0.10)',
        orbC: isDark ? 'rgba(168, 85, 247, 0.14)' : 'rgba(168, 85, 247, 0.08)',
        grid: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)',
        card: isDark ? 'rgba(12, 12, 24, 0.82)' : 'rgba(255, 255, 255, 0.78)',
        cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        cardShadow: isDark
            ? '0 25px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset'
            : '0 25px 80px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.6) inset',
        textMuted: isDark ? '#64748b' : '#94a3b8',
        textSub: isDark ? '#94a3b8' : '#64748b',
        track: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        ring: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
        ringGlow: isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.25)',
        particleA: isDark ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.5)',
        particleB: isDark ? 'rgba(249,115,22,0.5)' : 'rgba(249,115,22,0.4)',
        particleC: isDark ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.35)',
    };

    const accent = 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)';

    return (
        <div
            style={{
                minHeight: '100vh',
                background: c.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                opacity: entered ? 1 : 0,
                transition: 'opacity 0.6s ease',
            }}
        >
            {/* ── Background layer ── */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* Orbs */}
                <div style={{ position: 'absolute', top: '-12%', right: '-8%', width: 520, height: 520, background: `radial-gradient(circle, ${c.orbA} 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(70px)', animation: 'lsFloat 10s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', bottom: '-18%', left: '-12%', width: 600, height: 600, background: `radial-gradient(circle, ${c.orbB} 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(90px)', animation: 'lsFloat 13s ease-in-out infinite reverse' }} />
                <div style={{ position: 'absolute', top: '30%', left: '55%', width: 380, height: 380, background: `radial-gradient(circle, ${c.orbC} 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(70px)', animation: 'lsFloat 15s ease-in-out infinite 2s' }} />

                {/* Grid */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px), linear-gradient(90deg, ${c.grid} 1px, transparent 1px)`, backgroundSize: '60px 60px', animation: 'lsGridPan 25s linear infinite' }} />

                {/* Floating particles */}
                {[
                    { x: '15%', y: '20%', s: 4, d: '8s', color: c.particleA },
                    { x: '75%', y: '15%', s: 3, d: '11s', color: c.particleB },
                    { x: '85%', y: '70%', s: 5, d: '9s', color: c.particleA },
                    { x: '25%', y: '75%', s: 3, d: '13s', color: c.particleC },
                    { x: '55%', y: '85%', s: 4, d: '10s', color: c.particleB },
                    { x: '40%', y: '10%', s: 3, d: '14s', color: c.particleC },
                    { x: '65%', y: '45%', s: 3, d: '12s', color: c.particleA },
                    { x: '10%', y: '50%', s: 4, d: '9s', color: c.particleB },
                ].map((p, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: p.x,
                            top: p.y,
                            width: p.s,
                            height: p.s,
                            borderRadius: '50%',
                            background: p.color,
                            boxShadow: `0 0 ${p.s * 3}px ${p.color}`,
                            animation: `lsParticle ${p.d} ease-in-out infinite`,
                            animationDelay: `${i * 0.7}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── Card ── */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '48px 52px',
                    borderRadius: '24px',
                    background: c.card,
                    border: `1px solid ${c.cardBorder}`,
                    boxShadow: c.cardShadow,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '28px',
                    minWidth: '340px',
                    transform: entered ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
                    transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* Shine overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '1px',
                        borderRadius: '23px',
                        pointerEvents: 'none',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: '200%',
                            height: '100%',
                            background: `linear-gradient(105deg, transparent 35%, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'} 50%, transparent 65%)`,
                            animation: 'lsShine 5s ease-in-out infinite',
                        }}
                    />
                </div>

                {/* ── Orbital icon ── */}
                <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Ambient glow */}
                    <div style={{ position: 'absolute', width: 165, height: 165, borderRadius: '50%', background: `radial-gradient(circle, ${c.ringGlow}, transparent 70%)`, filter: 'blur(16px)', animation: 'lsPulse 3s ease-in-out infinite' }} />

                    {/* Outer orbit ring */}
                    <div style={{ position: 'absolute', width: 138, height: 138, borderRadius: '50%', border: `2.5px solid ${c.ring}`, animation: 'lsOrbitReverse 8s linear infinite' }}>
                        <div style={{ position: 'absolute', top: -5, left: '50%', marginLeft: -5, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 14px rgba(239,68,68,0.6)' }} />
                    </div>

                    {/* Inner orbit ring */}
                    <div style={{ position: 'absolute', width: 115, height: 115, borderRadius: '50%', border: `2px solid ${c.ring}`, animation: 'lsOrbit 6s linear infinite' }}>
                        <div style={{ position: 'absolute', bottom: -4, right: '10%', width: 8, height: 8, borderRadius: '50%', background: '#f97316', boxShadow: '0 0 12px rgba(249,115,22,0.6)' }} />
                    </div>

                    {/* Spinner ring */}
                    <div
                        style={{
                            position: 'absolute',
                            width: 96,
                            height: 96,
                            borderRadius: '50%',
                            border: `3px solid ${c.track}`,
                            borderTopColor: '#ef4444',
                            borderRightColor: '#f97316',
                            animation: 'lsSpin 1.8s linear infinite',
                        }}
                    />

                    {/* Icon */}
                    <div
                        style={{
                            width: 70,
                            height: 70,
                            background: accent,
                            borderRadius: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 36px rgba(239, 68, 68, 0.4), 0 0 0 5px rgba(239,68,68,0.08)',
                            animation: 'lsPulse 3s ease-in-out infinite',
                        }}
                    >
                        <BarChart3 size={32} color="white" strokeWidth={2.5} />
                    </div>
                </div>

                {/* ── Brand ── */}
                <div style={{ textAlign: 'center' }}>
                    <h1
                        style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            background: accent,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '8px',
                            letterSpacing: '-0.8px',
                            lineHeight: 1.1,
                        }}
                    >
                        Cache BI
                    </h1>
                    <p style={{ fontSize: '13px', color: c.textSub, margin: 0, fontWeight: 500 }}>
                        {message}
                    </p>
                </div>

                {/* ── Progress bar ── */}
                <div
                    style={{
                        width: '240px',
                        height: '4px',
                        backgroundColor: c.track,
                        borderRadius: '999px',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            width: '30%',
                            height: '100%',
                            background: accent,
                            borderRadius: '999px',
                            boxShadow: '0 0 12px rgba(239,68,68,0.4)',
                            animation: 'lsProgress 2.4s ease-in-out infinite',
                        }}
                    />
                </div>

                {/* ── Status dots ── */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {['Connecting', 'Authenticating', 'Preparing'].map((label, i) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#a855f7',
                                    boxShadow: `0 0 8px ${i === 0 ? 'rgba(239,68,68,0.5)' : i === 1 ? 'rgba(249,115,22,0.5)' : 'rgba(168,85,247,0.5)'}`,
                                    animation: `lsDotPulse 2s ease-in-out infinite ${i * 0.4}s`,
                                }}
                            />
                            <span style={{ fontSize: '11px', color: c.textMuted, letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 500 }}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Animations ── */}
            <style>{`
                @keyframes lsFloat {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-25px) rotate(4deg); }
                }
                @keyframes lsGridPan {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(60px, 60px); }
                }
                @keyframes lsParticle {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
                    25% { transform: translateY(-18px) scale(1.3); opacity: 1; }
                    50% { transform: translateY(-8px) scale(0.8); opacity: 0.4; }
                    75% { transform: translateY(-22px) scale(1.1); opacity: 0.8; }
                }
                @keyframes lsSpin {
                    to { transform: rotate(360deg); }
                }
                @keyframes lsOrbit {
                    to { transform: rotate(360deg); }
                }
                @keyframes lsOrbitReverse {
                    to { transform: rotate(-360deg); }
                }
                @keyframes lsPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.06); opacity: 0.88; }
                }
                @keyframes lsProgress {
                    0% { left: -30%; }
                    50% { left: 70%; }
                    100% { left: 100%; }
                }
                @keyframes lsShine {
                    0% { transform: translateX(-80%); }
                    100% { transform: translateX(40%); }
                }
                @keyframes lsDotPulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.4); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
