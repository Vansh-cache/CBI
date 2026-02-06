/**
 * Enhanced Tooltip Component - Power BI-style interactive tooltips
 * Supports default tooltips, report page tooltips, and custom content
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import {
    TooltipData,
    TooltipField,
    calculateTooltipPosition,
    globalTooltipManager,
    formatTooltipValue,
    calculateTrend,
} from '../../lib/tooltipManager';

interface EnhancedTooltipProps {
    mode: 'light' | 'dark';
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({ mode }) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const isDark = mode === 'dark';

    useEffect(() => {
        const unsubscribe = globalTooltipManager.subscribe(setTooltip);
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!tooltip?.visible || !tooltipRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = tooltipRef.current?.getBoundingClientRect();
            if (!rect) return;

            const pos = calculateTooltipPosition(
                e.clientX,
                e.clientY,
                rect.width,
                rect.height,
                window.innerWidth,
                window.innerHeight,
                15
            );

            setPosition(pos);
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [tooltip?.visible]);

    if (!tooltip?.visible || tooltip.fields.length === 0) return null;

    return (
        <div
            ref={tooltipRef}
            className="fixed pointer-events-none z-[9999] animate-fade-in"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translateZ(0)',
            }}
        >
            <div
                className="rounded-lg shadow-xl border-2 overflow-hidden"
                style={{
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    borderColor: isDark ? 'rgba(55, 65, 81, 1)' : 'rgba(229, 231, 235, 1)',
                    backdropFilter: 'blur(10px)',
                    minWidth: 180,
                    maxWidth: 320,
                }}
            >
                {/* Title/Category */}
                {(tooltip.title || tooltip.category) && (
                    <div
                        className="px-4 py-2.5 border-b"
                        style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        }}
                    >
                        <span
                            className="text-sm font-semibold"
                            style={{ color: isDark ? '#f9fafb' : '#111827' }}
                        >
                            {tooltip.title || tooltip.category}
                        </span>
                    </div>
                )}

                {/* Fields */}
                <div className="px-4 py-3 space-y-2.5">
                    {tooltip.fields.map((field, idx) => (
                        <TooltipFieldRow key={idx} field={field} isDark={isDark} />
                    ))}
                </div>

                {/* Custom Content */}
                {tooltip.customContent && (
                    <div
                        className="px-4 py-3 border-t"
                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                    >
                        {tooltip.customContent}
                    </div>
                )}
            </div>
        </div>
    );
};

interface TooltipFieldRowProps {
    field: TooltipField;
    isDark: boolean;
}

const TooltipFieldRow: React.FC<TooltipFieldRowProps> = ({ field, isDark }) => {
    return (
        <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2 min-w-0">
                {field.color && (
                    <span
                        className="inline-block w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: field.color }}
                    />
                )}
                {field.icon && (
                    <span className="text-sm">{field.icon}</span>
                )}
                <span
                    className="text-[13px] truncate font-medium"
                    style={{ color: isDark ? 'rgba(226, 232, 240, 0.85)' : 'rgba(55, 65, 81, 0.9)' }}
                >
                    {field.label}
                </span>
            </div>
            <span
                className="text-[13px] font-bold shrink-0"
                style={{ color: isDark ? '#f9fafb' : '#111827' }}
            >
                {typeof field.value === 'number'
                    ? field.value.toLocaleString()
                    : String(field.value)}
            </span>
        </div>
    );
};

/**
 * Card Tooltip - For KPI and Card visuals with trend indicators
 */
interface CardTooltipProps {
    title: string;
    value: number | string;
    previousValue?: number;
    format?: string;
    trend?: { direction: 'up' | 'down' | 'flat'; percentage: number; color: string };
    additionalFields?: TooltipField[];
    mode: 'light' | 'dark';
    position: { x: number; y: number };
    visible: boolean;
}

export const CardTooltip: React.FC<CardTooltipProps> = ({
    title,
    value,
    previousValue,
    format,
    trend,
    additionalFields,
    mode,
    position,
    visible,
}) => {
    const isDark = mode === 'dark';

    const calculatedTrend = useMemo(() => {
        if (trend) return trend;
        if (typeof value === 'number' && typeof previousValue === 'number') {
            return calculateTrend(value, previousValue);
        }
        return null;
    }, [value, previousValue, trend]);

    if (!visible) return null;

    const TrendIcon = calculatedTrend?.direction === 'up'
        ? TrendingUp
        : calculatedTrend?.direction === 'down'
            ? TrendingDown
            : Minus;

    return (
        <div
            className="fixed pointer-events-none z-[9999] animate-fade-in"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            <div
                className="rounded-lg shadow-xl border-2 overflow-hidden min-w-[200px]"
                style={{
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    borderColor: isDark ? 'rgba(55, 65, 81, 1)' : 'rgba(229, 231, 235, 1)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                {/* Title */}
                <div
                    className="px-4 py-2.5 border-b"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    }}
                >
                    <span
                        className="text-sm font-semibold"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                    >
                        {title}
                    </span>
                </div>

                {/* Value with Trend */}
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <span
                            className="text-2xl font-bold"
                            style={{ color: isDark ? '#f9fafb' : '#111827' }}
                        >
                            {typeof value === 'number' ? formatTooltipValue(value, format) : value}
                        </span>

                        {calculatedTrend && (
                            <div className="flex items-center gap-1">
                                <TrendIcon
                                    className="w-5 h-5"
                                    style={{ color: calculatedTrend.color }}
                                />
                                <span
                                    className="text-sm font-semibold"
                                    style={{ color: calculatedTrend.color }}
                                >
                                    {calculatedTrend.percentage.toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>

                    {previousValue !== undefined && (
                        <div className="mt-1">
                            <span
                                className="text-xs"
                                style={{ color: isDark ? 'rgba(226, 232, 240, 0.6)' : 'rgba(55, 65, 81, 0.6)' }}
                            >
                                Previous: {typeof previousValue === 'number' ? formatTooltipValue(previousValue, format) : previousValue}
                            </span>
                        </div>
                    )}
                </div>

                {/* Additional Fields */}
                {additionalFields && additionalFields.length > 0 && (
                    <div
                        className="px-4 py-3 border-t space-y-2"
                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                    >
                        {additionalFields.map((field, idx) => (
                            <TooltipFieldRow key={idx} field={field} isDark={isDark} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Chart Tooltip - Enhanced tooltip for chart data points
 */
interface ChartTooltipContentProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>;
    label?: string | number;
    mode: 'light' | 'dark';
    valueFormat?: string;
    showPercent?: boolean;
    total?: number;
}

export const ChartTooltipContent: React.FC<ChartTooltipContentProps> = ({
    active,
    payload,
    label,
    mode,
    valueFormat,
    showPercent,
    total,
}) => {
    if (!active || !payload || payload.length === 0) return null;

    const isDark = mode === 'dark';

    return (
        <div
            className="rounded-lg border-2 px-4 py-3 shadow-xl"
            style={{
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderColor: isDark ? 'rgba(55, 65, 81, 1)' : 'rgba(229, 231, 235, 1)',
                backdropFilter: 'blur(10px)',
            }}
        >
            {/* Label/Category */}
            {label !== undefined && label !== null && (
                <div
                    className="text-sm font-semibold mb-2 pb-1.5 border-b"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                        color: isDark ? '#f9fafb' : '#111827',
                    }}
                >
                    {String(label)}
                </div>
            )}

            {/* Values */}
            <div className="space-y-2">
                {payload.map((entry, idx) => {
                    const percent = showPercent && total
                        ? ((entry.value / total) * 100).toFixed(1)
                        : null;

                    return (
                        <div key={idx} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="inline-block w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.color || '#118DFF' }}
                                />
                                <span
                                    className="text-[13px] truncate font-medium"
                                    style={{ color: isDark ? 'rgba(226, 232, 240, 0.85)' : 'rgba(55, 65, 81, 0.9)' }}
                                >
                                    {String(entry.name || entry.dataKey || '')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span
                                    className="text-[13px] font-bold"
                                    style={{ color: isDark ? '#f9fafb' : '#111827' }}
                                >
                                    {formatTooltipValue(entry.value, valueFormat)}
                                </span>
                                {percent && (
                                    <span
                                        className="text-[11px]"
                                        style={{ color: isDark ? 'rgba(226, 232, 240, 0.6)' : 'rgba(55, 65, 81, 0.6)' }}
                                    >
                                        ({percent}%)
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Info Tooltip - Simple informational tooltip
 */
interface InfoTooltipProps {
    content: string | React.ReactNode;
    mode: 'light' | 'dark';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, mode }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const isDark = mode === 'dark';

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 8,
            });
        }
        setVisible(true);
    };

    return (
        <div className="relative inline-block">
            <button
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setVisible(false)}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-help"
            >
                <Info
                    className="w-4 h-4"
                    style={{ color: isDark ? 'rgba(226, 232, 240, 0.5)' : 'rgba(55, 65, 81, 0.5)' }}
                />
            </button>

            {visible && (
                <div
                    className="fixed z-[9999] animate-fade-in pointer-events-none"
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div
                        className="rounded-lg shadow-lg border px-3 py-2 text-xs max-w-[240px]"
                        style={{
                            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                            borderColor: isDark ? 'rgba(55, 65, 81, 1)' : 'rgba(229, 231, 235, 1)',
                            color: isDark ? 'rgba(226, 232, 240, 0.9)' : 'rgba(55, 65, 81, 0.9)',
                        }}
                    >
                        {content}
                    </div>
                    {/* Arrow */}
                    <div
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                        style={{
                            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                            borderTop: `1px solid ${isDark ? 'rgba(55, 65, 81, 1)' : 'rgba(229, 231, 235, 1)'}`,
                            borderLeft: `1px solid ${isDark ? 'rgba(55, 65, 81, 1)' : 'rgba(229, 231, 235, 1)'}`,
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default EnhancedTooltip;
