/**
 * Analytics Lines Component - Power BI-style trend lines, reference lines, and forecasting
 * Supports: constant lines, min/max lines, average lines, median lines, percentile lines, 
 *           trend lines, forecast lines, and confidence bands
 */

import React, { useMemo } from 'react';
import {
    ReferenceLine,
    ReferenceArea,
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
} from 'recharts';
import { AnalyticsLine } from '../../lib/formatPane';

// Calculate statistics for analytics lines
export const calculateStatistics = (data: number[]): {
    min: number;
    max: number;
    average: number;
    median: number;
    sum: number;
    count: number;
    stdDev: number;
    percentile: (p: number) => number;
} => {
    if (!data || data.length === 0) {
        return {
            min: 0,
            max: 0,
            average: 0,
            median: 0,
            sum: 0,
            count: 0,
            stdDev: 0,
            percentile: () => 0,
        };
    }

    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);
    const count = data.length;
    const average = sum / count;

    // Standard deviation
    const squaredDiffs = data.map(v => Math.pow(v - average, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / count;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Median
    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Percentile function
    const percentile = (p: number): number => {
        const index = (p / 100) * (count - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    return {
        min: Math.min(...data),
        max: Math.max(...data),
        average,
        median,
        sum,
        count,
        stdDev,
        percentile,
    };
};

// Linear regression for trend lines
export const linearRegression = (data: Array<{ x: number; y: number }>): {
    slope: number;
    intercept: number;
    r2: number;
    predict: (x: number) => number;
} => {
    const n = data.length;
    if (n < 2) {
        return { slope: 0, intercept: 0, r2: 0, predict: () => 0 };
    }

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    data.forEach(point => {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
        sumYY += point.y * point.y;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const yMean = sumY / n;
    let ssRes = 0, ssTot = 0;
    data.forEach(point => {
        const yPred = slope * point.x + intercept;
        ssRes += Math.pow(point.y - yPred, 2);
        ssTot += Math.pow(point.y - yMean, 2);
    });
    const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    return {
        slope,
        intercept,
        r2,
        predict: (x: number) => slope * x + intercept,
    };
};

// Exponential smoothing for forecasting
export const exponentialSmoothing = (
    data: number[],
    alpha: number = 0.3,
    periods: number = 5
): { historical: number[]; forecast: number[] } => {
    if (data.length === 0) return { historical: [], forecast: [] };

    const smoothed: number[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
        smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
    }

    // Forecast future values
    const forecast: number[] = [];
    let lastSmoothed = smoothed[smoothed.length - 1];

    for (let i = 0; i < periods; i++) {
        forecast.push(lastSmoothed);
        // Simple dampening for future forecasts
        lastSmoothed = lastSmoothed * (1 - 0.02 * i);
    }

    return { historical: smoothed, forecast };
};

// Generate confidence band data
export const generateConfidenceBand = (
    data: Array<{ x: number; y: number }>,
    confidence: number = 95
): Array<{ x: number; upper: number; lower: number }> => {
    const regression = linearRegression(data);
    const n = data.length;

    if (n < 3) return [];

    // Calculate standard error
    let sumResidualsSq = 0;
    data.forEach(point => {
        const predicted = regression.predict(point.x);
        sumResidualsSq += Math.pow(point.y - predicted, 2);
    });
    const se = Math.sqrt(sumResidualsSq / (n - 2));

    // t-value for confidence interval (approximate for 95%)
    const tValue = confidence === 95 ? 1.96 : confidence === 99 ? 2.576 : 1.645;

    // Calculate mean of x
    const xMean = data.reduce((sum, p) => sum + p.x, 0) / n;
    const sumXXDiff = data.reduce((sum, p) => sum + Math.pow(p.x - xMean, 2), 0);

    return data.map(point => {
        const predicted = regression.predict(point.x);
        const marginOfError = tValue * se * Math.sqrt(1 / n + Math.pow(point.x - xMean, 2) / sumXXDiff);

        return {
            x: point.x,
            upper: predicted + marginOfError,
            lower: predicted - marginOfError,
        };
    });
};

interface AnalyticsLinesRendererProps {
    analytics: AnalyticsLine[];
    data: Record<string, any>[];
    xKey: string;
    yKey: string;
    chartWidth: number;
    chartHeight: number;
    mode: 'light' | 'dark';
}

/**
 * Renders analytics lines as Recharts reference elements
 */
export const AnalyticsLinesRenderer: React.FC<AnalyticsLinesRendererProps> = ({
    analytics,
    data,
    xKey,
    yKey,
    chartWidth,
    chartHeight,
    mode,
}) => {
    const isDark = mode === 'dark';

    const { statistics, trendLine, confidenceBand } = useMemo(() => {
        // Extract numeric y values
        const yValues = data
            .map(d => d[yKey])
            .filter((v): v is number => typeof v === 'number' && !isNaN(v));

        const stats = calculateStatistics(yValues);

        // Calculate trend line data
        const xyData = data
            .map((d, i) => ({
                x: i,
                y: typeof d[yKey] === 'number' ? d[yKey] : 0,
            }))
            .filter(d => !isNaN(d.y));

        const trend = linearRegression(xyData);
        const confidence = generateConfidenceBand(xyData, 95);

        return { statistics: stats, trendLine: trend, confidenceBand: confidence };
    }, [data, yKey]);

    const elements: React.ReactNode[] = [];

    analytics.forEach((line, index) => {
        if (!line.enabled) return;

        const key = `analytics-${line.type}-${index}`;
        const lineStyle = line.style || 'solid';
        const strokeDasharray = lineStyle === 'dashed' ? '5,5' : lineStyle === 'dotted' ? '2,2' : undefined;

        switch (line.type) {
            case 'constantLine':
                if (line.value !== undefined) {
                    elements.push(
                        <ReferenceLine
                            key={key}
                            y={line.value}
                            stroke={line.color}
                            strokeDasharray={strokeDasharray}
                            strokeWidth={line.thickness || 1}
                            label={line.showLabel ? {
                                value: line.label || `${line.value}`,
                                fill: isDark ? '#e5e7eb' : '#374151',
                                fontSize: 11,
                                position: 'right',
                            } : undefined}
                        />
                    );
                }
                break;

            case 'minLine':
                elements.push(
                    <ReferenceLine
                        key={key}
                        y={statistics.min}
                        stroke={line.color || '#ef4444'}
                        strokeDasharray={strokeDasharray}
                        strokeWidth={line.thickness || 1}
                        label={line.showLabel ? {
                            value: line.label || `Min: ${statistics.min.toLocaleString()}`,
                            fill: isDark ? '#e5e7eb' : '#374151',
                            fontSize: 11,
                            position: 'right',
                        } : undefined}
                    />
                );
                break;

            case 'maxLine':
                elements.push(
                    <ReferenceLine
                        key={key}
                        y={statistics.max}
                        stroke={line.color || '#22c55e'}
                        strokeDasharray={strokeDasharray}
                        strokeWidth={line.thickness || 1}
                        label={line.showLabel ? {
                            value: line.label || `Max: ${statistics.max.toLocaleString()}`,
                            fill: isDark ? '#e5e7eb' : '#374151',
                            fontSize: 11,
                            position: 'right',
                        } : undefined}
                    />
                );
                break;

            case 'averageLine':
                elements.push(
                    <ReferenceLine
                        key={key}
                        y={statistics.average}
                        stroke={line.color || '#eab308'}
                        strokeDasharray={strokeDasharray}
                        strokeWidth={line.thickness || 1}
                        label={line.showLabel ? {
                            value: line.label || `Avg: ${statistics.average.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                            fill: isDark ? '#e5e7eb' : '#374151',
                            fontSize: 11,
                            position: 'right',
                        } : undefined}
                    />
                );
                break;

            case 'medianLine':
                elements.push(
                    <ReferenceLine
                        key={key}
                        y={statistics.median}
                        stroke={line.color || '#8b5cf6'}
                        strokeDasharray={strokeDasharray}
                        strokeWidth={line.thickness || 1}
                        label={line.showLabel ? {
                            value: line.label || `Median: ${statistics.median.toLocaleString()}`,
                            fill: isDark ? '#e5e7eb' : '#374151',
                            fontSize: 11,
                            position: 'right',
                        } : undefined}
                    />
                );
                break;

            case 'percentileLine':
                const percentileValue = statistics.percentile(line.value || 75);
                elements.push(
                    <ReferenceLine
                        key={key}
                        y={percentileValue}
                        stroke={line.color || '#06b6d4'}
                        strokeDasharray={strokeDasharray}
                        strokeWidth={line.thickness || 1}
                        label={line.showLabel ? {
                            value: line.label || `P${line.value || 75}: ${percentileValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                            fill: isDark ? '#e5e7eb' : '#374151',
                            fontSize: 11,
                            position: 'right',
                        } : undefined}
                    />
                );
                break;

            case 'trendLine':
                // Trend line is rendered as a regular Line with calculated points
                // This requires the parent chart to include the trend data
                break;

            case 'forecastLine':
                // Forecast requires extending the data
                break;
        }
    });

    return <>{elements}</>;
};

/**
 * Component to render trend line overlay
 */
interface TrendLineOverlayProps {
    data: Record<string, any>[];
    xKey: string;
    yKey: string;
    color?: string;
    strokeWidth?: number;
    showEquation?: boolean;
    showR2?: boolean;
    mode: 'light' | 'dark';
}

export const TrendLineOverlay: React.FC<TrendLineOverlayProps> = ({
    data,
    xKey,
    yKey,
    color = '#6366f1',
    strokeWidth = 2,
    showEquation,
    showR2,
    mode,
}) => {
    const isDark = mode === 'dark';

    const { trendData, equation, r2 } = useMemo(() => {
        const xyData = data.map((d, i) => ({
            x: i,
            y: typeof d[yKey] === 'number' ? d[yKey] : 0,
            [xKey]: d[xKey],
        }));

        const regression = linearRegression(xyData);

        const trendPoints = xyData.map(d => ({
            ...d,
            trend: regression.predict(d.x),
        }));

        return {
            trendData: trendPoints,
            equation: `y = ${regression.slope.toFixed(2)}x + ${regression.intercept.toFixed(2)}`,
            r2: regression.r2,
        };
    }, [data, xKey, yKey]);

    return (
        <>
            <Line
                type="linear"
                data={trendData}
                dataKey="trend"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray="5,5"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
            />
            {(showEquation || showR2) && (
                <text
                    x={20}
                    y={20}
                    fill={isDark ? '#e5e7eb' : '#374151'}
                    fontSize={11}
                >
                    {showEquation && equation}
                    {showEquation && showR2 && ' | '}
                    {showR2 && `R² = ${(r2 * 100).toFixed(1)}%`}
                </text>
            )}
        </>
    );
};

/**
 * Component to render confidence band
 */
interface ConfidenceBandProps {
    data: Record<string, any>[];
    xKey: string;
    yKey: string;
    confidence?: 90 | 95 | 99;
    color?: string;
    opacity?: number;
}

export const ConfidenceBand: React.FC<ConfidenceBandProps> = ({
    data,
    xKey,
    yKey,
    confidence = 95,
    color = '#6366f1',
    opacity = 0.15,
}) => {
    const bandData = useMemo(() => {
        const xyData = data.map((d, i) => ({
            x: i,
            y: typeof d[yKey] === 'number' ? d[yKey] : 0,
            [xKey]: d[xKey],
        }));

        const band = generateConfidenceBand(xyData, confidence);

        return data.map((d, i) => ({
            ...d,
            upper: band[i]?.upper ?? 0,
            lower: band[i]?.lower ?? 0,
        }));
    }, [data, xKey, yKey, confidence]);

    return (
        <Area
            type="monotone"
            data={bandData}
            dataKey="upper"
            stroke="none"
            fill={color}
            fillOpacity={opacity}
        />
    );
};

/**
 * Analytics configuration panel
 */
interface AnalyticsConfigProps {
    analytics: AnalyticsLine[];
    onAnalyticsChange: (analytics: AnalyticsLine[]) => void;
    mode: 'light' | 'dark';
}

export const AnalyticsConfig: React.FC<AnalyticsConfigProps> = ({
    analytics,
    onAnalyticsChange,
    mode,
}) => {
    const isDark = mode === 'dark';

    const toggleLine = (type: AnalyticsLine['type']) => {
        const existing = analytics.find(a => a.type === type);
        if (existing) {
            onAnalyticsChange(
                analytics.map(a =>
                    a.type === type ? { ...a, show: !a.show } : a
                )
            );
        } else {
            // Add new analytics line
            const newLine: AnalyticsLine = {
                id: `analytics-${Date.now()}`,
                type,
                show: true,
                color: getDefaultColor(type),
                width: 2,
                style: 'dashed',
                showLabel: true,
                labelPosition: 'above',
            };
            onAnalyticsChange([...analytics, newLine]);
        }
    };

    const getDefaultColor = (type: AnalyticsLine['type']): string => {
        switch (type) {
            case 'min': return '#ef4444';
            case 'max': return '#22c55e';
            case 'average': return '#eab308';
            case 'median': return '#8b5cf6';
            case 'trend': return '#6366f1';
            case 'percentile': return '#06b6d4';
            case 'constant': return '#3b82f6';
            default: return '#9ca3af';
        }
    };

    const analyticsOptions: { type: AnalyticsLine['type']; label: string }[] = [
        { type: 'constant', label: 'Constant Line' },
        { type: 'min', label: 'Min Line' },
        { type: 'max', label: 'Max Line' },
        { type: 'average', label: 'Average Line' },
        { type: 'median', label: 'Median Line' },
        { type: 'percentile', label: 'Percentile Line' },
        { type: 'trend', label: 'Trend Line' },
    ];

    return (
        <div className="space-y-2">
            {analyticsOptions.map(({ type, label }) => {
                const line = analytics.find(a => a.type === type);
                const isEnabled = line?.show ?? false;

                return (
                    <label
                        key={type}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleLine(type)}
                            className="w-4 h-4 rounded border-2 cursor-pointer accent-blue-500"
                        />
                        <span
                            className="text-sm"
                            style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' }}
                        >
                            {label}
                        </span>
                        {isEnabled && line && (
                            <input
                                type="color"
                                value={line.color}
                                onChange={(e) => {
                                    onAnalyticsChange(
                                        analytics.map(a =>
                                            a.type === type ? { ...a, color: e.target.value } : a
                                        )
                                    );
                                }}
                                className="w-6 h-6 rounded border-0 cursor-pointer ml-auto"
                            />
                        )}
                    </label>
                );
            })}
        </div>
    );
};

export default AnalyticsLinesRenderer;
