// Shared theme color utilities for consistent theming across components
export const getThemeColors = (isDark: boolean) => ({
    // Base colors
    bg: isDark ? '#0f0f1a' : '#f1f5f9',
    bgGradient: isDark
        ? 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',

    // Text colors
    text: isDark ? '#f1f5f9' : '#1e293b',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    muted: isDark ? '#94a3b8' : '#64748b', // Alias for textMuted
    textSecondary: isDark ? '#cbd5e1' : '#475569',

    // Card colors
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    cardBorder: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    cardShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',

    // Input colors
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    inputBorder: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db',
    inputFocus: '#ef4444',

    // Table colors
    tableBg: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
    tableHeader: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
    tableRowHover: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
    tableBorder: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',

    // Section borders
    sectionBorder: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',

    // Modal overlay
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBg: isDark ? '#1a1a2e' : '#ffffff',

    // Power BI–style builder colors (matches reference image)
    pbiSidebar: isDark ? '#2d2d2d' : '#2d2d2d',
    pbiSidebarBorder: isDark ? '#404040' : '#404040',
    pbiCanvas: isDark ? '#edeeef' : '#edeeef',
    pbiRibbon: isDark ? '#2d2d2d' : '#2d2d2d',
    pbiRibbonBorder: isDark ? '#404040' : '#404040',
    pbiBucketBg: isDark ? '#2d2d30' : '#ffffff',
    pbiBucketBorder: isDark ? '#3c3c3c' : '#d4d4d4',
    pbiText: isDark ? '#cccccc' : '#cccccc',
    pbiTextMuted: isDark ? '#999999' : '#999999',
    pbiAccent: '#0078d4',
    pbiAccentHover: '#106ebe',
    pbiGreen: '#107c10',
    accentBg: isDark ? 'rgba(0,120,212,0.12)' : 'rgba(0,120,212,0.08)',
});

export const getColorPalette = (isDark: boolean) => ({
    blue: {
        bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
        text: isDark ? '#60a5fa' : '#2563eb',
        icon: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
        badge: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
        badgeText: isDark ? '#60a5fa' : '#1d4ed8',
    },
    purple: {
        bg: isDark ? 'rgba(147, 51, 234, 0.15)' : '#faf5ff',
        text: isDark ? '#a78bfa' : '#9333ea',
        icon: isDark ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff',
        badge: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        badgeText: isDark ? '#fca5a5' : '#dc2626',
    },
    indigo: {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
        text: isDark ? '#fca5a5' : '#ef4444',
        icon: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        badge: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        badgeText: isDark ? '#fca5a5' : '#dc2626',
    },
    green: {
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
        text: isDark ? '#4ade80' : '#16a34a',
        icon: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
        badge: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
        badgeText: isDark ? '#4ade80' : '#15803d',
    },
    orange: {
        bg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#fff7ed',
        text: isDark ? '#fb923c' : '#ea580c',
        icon: isDark ? 'rgba(249, 115, 22, 0.2)' : '#ffedd5',
        badge: isDark ? 'rgba(249, 115, 22, 0.2)' : '#ffedd5',
        badgeText: isDark ? '#fb923c' : '#c2410c',
    },
    red: {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
        text: isDark ? '#f87171' : '#dc2626',
        icon: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        badge: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        badgeText: isDark ? '#f87171' : '#b91c1c',
    },
    gray: {
        bg: isDark ? 'rgba(107, 114, 128, 0.15)' : '#f9fafb',
        text: isDark ? '#9ca3af' : '#6b7280',
        icon: isDark ? 'rgba(107, 114, 128, 0.2)' : '#f3f4f6',
        badge: isDark ? 'rgba(107, 114, 128, 0.2)' : '#f3f4f6',
        badgeText: isDark ? '#9ca3af' : '#374151',
    },
});

// Role badge colors based on theme
export const getRoleBadgeColors = (role: string, isDark: boolean) => {
    const palette = getColorPalette(isDark);
    const roleColors: Record<string, { bg: string; text: string }> = {
        admin: { bg: palette.red.badge, text: palette.red.badgeText },
        developer: { bg: palette.indigo.badge, text: palette.indigo.badgeText },
        viewer: { bg: palette.red.badge, text: palette.red.badgeText },
    };
    return roleColors[role] || { bg: palette.gray.badge, text: palette.gray.badgeText };
};

// Status badge colors based on theme
export const getStatusBadgeColors = (active: boolean, isDark: boolean) => {
    const palette = getColorPalette(isDark);
    return active
        ? { bg: palette.green.badge, text: palette.green.badgeText }
        : { bg: palette.gray.badge, text: palette.gray.badgeText };
};
