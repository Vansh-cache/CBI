/**
 * Enhanced Chart Renderer - Power BI-style chart rendering with full formatting support
 * Supports conditional formatting, analytics lines, tooltips, and cross-filtering
 */

import React, { useMemo, useCallback } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    LineChart,
    AreaChart,
    PieChart,
    ScatterChart,
    ComposedChart,
    RadialBarChart,
    Treemap,
    Funnel,
    Bar,
    Line,
    Area,
    Pie,
    Cell,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    ReferenceArea,
    Label,
    LabelList,
} from 'recharts';
import { Widget } from '../../lib/widgetSystem';
import { VisualFormat } from '../../lib/formatPane';
import { useCrossFilter } from '../../contexts/CrossFilterContext';
import { ChartTooltipContent } from './EnhancedTooltip';
import { AnalyticsLinesRenderer, calculateStatistics } from './AnalyticsLines';

// Props
interface EnhancedChartRendererProps {
    widget: Widget;
    data: any[];
    width: number;
    height: number;
    isSelected?: boolean;
    isDimmed?: boolean;
    onDataPointClick?: (data: any, index: number) => void;
    theme?: 'light' | 'dark';
}

// Color utilities
const getDataColors = (format: VisualFormat, count: number, theme: 'light' | 'dark'): string[] => {
    const defaultColors = [
        '#0078d4', '#00bcf2', '#00b294', '#8764b8', '#e81123',
        '#ff8c00', '#ffd700', '#bad80a', '#107c10', '#00cccc',
        '#6b69d6', '#e3008c', '#8e8cd8', '#00b7c3', '#57a300',
    ];

    const colors = format.colors?.length
        ? format.colors
        : defaultColors;

    // Repeat colors if needed
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
};

// Apply conditional formatting to data
const applyConditionalFormatting = (
    value: number,
    rules: VisualFormat['conditionalFormatting'],
    field: string
): { color?: string; icon?: string } | null => {
    if (!rules?.length) return null;

    const fieldRules = rules.filter(r => r.field === field);

    for (const rule of fieldRules) {
        // Color scale
        if (rule.type === 'colorScale' && rule.minColor && rule.midColor && rule.maxColor) {
            const min = rule.minColor;
            const mid = rule.midColor;
            const max = rule.maxColor;
            const minVal = rule.minValue ?? 0;
            const maxVal = rule.maxValue ?? 100;
            const midVal = rule.midValue ?? (minVal + maxVal) / 2;

            let color: string;
            if (value <= midVal) {
                const t = (value - minVal) / (midVal - minVal);
                color = interpolateColor(min, mid, t);
            } else {
                const t = (value - midVal) / (maxVal - midVal);
                color = interpolateColor(mid, max, t);
            }
            return { color };
        }

        // Color rules
        if (rule.type === 'colorRules' && rule.rules) {
            for (const colorRule of rule.rules) {
                let match = false;
                switch (colorRule.operator) {
                    case 'greaterThan':
                        match = value > Number(colorRule.value);
                        break;
                    case 'lessThan':
                        match = value < Number(colorRule.value);
                        break;
                    case 'equals':
                        match = value === Number(colorRule.value);
                        break;
                    case 'between':
                        match = value >= Number(colorRule.value) && value <= Number(colorRule.value2 ?? colorRule.value);
                        break;
                }
                if (match) {
                    return { color: colorRule.color };
                }
            }
        }

        // Icon sets
        if (rule.type === 'icon' && rule.iconSet) {
            const percent = ((value - (rule.minValue ?? 0)) / ((rule.maxValue ?? 100) - (rule.minValue ?? 0))) * 100;
            // Use icon set type to determine appropriate icon
            return { icon: rule.iconSet };
        }
    }

    return null;
};

// Interpolate between two colors
const interpolateColor = (color1: string, color2: string, t: number): string => {
    const hex = (x: number) => x.toString(16).padStart(2, '0');
    const parse = (c: string) => ({
        r: parseInt(c.slice(1, 3), 16),
        g: parseInt(c.slice(3, 5), 16),
        b: parseInt(c.slice(5, 7), 16),
    });

    const c1 = parse(color1);
    const c2 = parse(color2);

    return '#' + hex(Math.round(c1.r + (c2.r - c1.r) * t)) +
        hex(Math.round(c1.g + (c2.g - c1.g) * t)) +
        hex(Math.round(c1.b + (c2.b - c1.b) * t));
};

// Format number for display
const formatNumber = (value: number, format?: string): string => {
    if (format === 'percent') {
        return `${(value * 100).toFixed(1)}%`;
    }
    if (format === 'currency') {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
    }
    if (typeof value === 'number') {
        if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
        if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value.toLocaleString();
    }
    return String(value);
};

// Bar/Column Chart Component
const BarChartRenderer: React.FC<EnhancedChartRendererProps & {
    layout: 'horizontal' | 'vertical';
    stacked?: boolean;
    percentStacked?: boolean;
}> = ({ widget, data, width, height, layout, stacked, percentStacked, onDataPointClick, theme, isDimmed }) => {
    const { format } = widget;
    const colors = getDataColors(format, data.length, theme || 'light');

    // Get value keys from data
    const valueKeys = useMemo(() => {
        if (!data.length) return [];
        return Object.keys(data[0]).filter(k => k !== 'name' && k !== 'category' && typeof data[0][k] === 'number');
    }, [data]);

    // Process data for percent stacked
    const processedData = useMemo(() => {
        if (!percentStacked) return data;

        return data.map(item => {
            const total = valueKeys.reduce((sum, key) => sum + (item[key] || 0), 0);
            const result: any = { ...item };
            valueKeys.forEach(key => {
                result[key] = total ? (item[key] / total) * 100 : 0;
            });
            return result;
        });
    }, [data, percentStacked, valueKeys]);

    const axisStyle = {
        fontSize: format.xAxis?.labelFontSize || 11,
        fill: format.xAxis?.labelColor || (theme === 'dark' ? '#a0a0a0' : '#666'),
        fontFamily: format.xAxis?.labelFontFamily || 'inherit',
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={processedData}
                layout={layout}
                margin={{
                    top: format.general?.padding || 10,
                    right: format.general?.padding || 10,
                    bottom: format.general?.padding || 10,
                    left: format.general?.padding || 10
                }}
            >
                {format.gridLines?.show && (
                    <CartesianGrid
                        strokeDasharray={format.gridLines.style === 'dashed' ? '3 3' : format.gridLines.style === 'dotted' ? '1 3' : '0'}
                        stroke={format.gridLines.color || (theme === 'dark' ? '#333' : '#e0e0e0')}
                        horizontal={format.gridLines.horizontal !== false}
                        vertical={format.gridLines.vertical !== false}
                    />
                )}

                {layout === 'vertical' ? (
                    <>
                        <XAxis
                            type="category"
                            dataKey="name"
                            tick={axisStyle}
                            axisLine={{ stroke: format.xAxis?.lineColor || '#ccc' }}
                            tickLine={{ stroke: format.xAxis?.lineColor || '#ccc' }}
                        />
                        <YAxis
                            type="number"
                            tick={axisStyle}
                            axisLine={{ stroke: format.yAxis?.lineColor || '#ccc' }}
                            tickLine={{ stroke: format.yAxis?.lineColor || '#ccc' }}
                            tickFormatter={(v) => formatNumber(v)}
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            type="number"
                            tick={axisStyle}
                            axisLine={{ stroke: format.xAxis?.lineColor || '#ccc' }}
                            tickFormatter={(v) => formatNumber(v)}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={axisStyle}
                            axisLine={{ stroke: format.yAxis?.lineColor || '#ccc' }}
                            width={100}
                        />
                    </>
                )}

                <Tooltip
                    content={<ChartTooltipContent theme={theme} />}
                    cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                />

                {format.legend?.show && (
                    <Legend
                        layout={format.legend.position === 'left' || format.legend.position === 'right' ? 'vertical' : 'horizontal'}
                        align={format.legend.position === 'left' ? 'left' : format.legend.position === 'right' ? 'right' : 'center'}
                        verticalAlign={format.legend.position === 'top' ? 'top' : format.legend.position === 'bottom' ? 'bottom' : 'middle'}
                        wrapperStyle={{ fontSize: format.legend.fontSize || 11 }}
                    />
                )}

                {valueKeys.map((key, index) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        fill={colors[index % colors.length]}
                        opacity={isDimmed ? 0.3 : 1}
                        stackId={stacked || percentStacked ? 'stack' : undefined}
                        radius={format.series?.barRadius ? [format.series.barRadius, format.series.barRadius, 0, 0] : undefined}
                        onClick={(data, index) => onDataPointClick?.(data, index)}
                    >
                        {format.dataLabels?.show && (
                            <LabelList
                                dataKey={key}
                                position={layout === 'vertical' ? 'top' : 'right'}
                                formatter={(v: number) => formatNumber(v)}
                                style={{ fontSize: format.dataLabels.fontSize || 10 }}
                            />
                        )}
                        {format.conditionalFormatting?.length && processedData.map((entry, i) => {
                            const cf = applyConditionalFormatting(entry[key], format.conditionalFormatting, key);
                            return cf?.color ? <Cell key={i} fill={cf.color} /> : <Cell key={i} fill={colors[index % colors.length]} />;
                        })}
                    </Bar>
                ))}

                {/* Analytics lines */}
                {widget.analyticsEnabled && valueKeys[0] && (
                    <AnalyticsLinesRenderer
                        data={data}
                        valueKey={valueKeys[0]}
                        chartType="bar"
                    />
                )}
            </BarChart>
        </ResponsiveContainer>
    );
};

// Line Chart Component
const LineChartRenderer: React.FC<EnhancedChartRendererProps & { showArea?: boolean }> = ({
    widget, data, width, height, onDataPointClick, theme, isDimmed, showArea
}) => {
    const { format } = widget;
    const colors = getDataColors(format, data.length, theme || 'light');

    const valueKeys = useMemo(() => {
        if (!data.length) return [];
        return Object.keys(data[0]).filter(k => k !== 'name' && k !== 'category' && typeof data[0][k] === 'number');
    }, [data]);

    const ChartComponent = showArea ? AreaChart : LineChart;
    const DataComponent = showArea ? Area : Line;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
                data={data}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
                {format.gridLines?.show && (
                    <CartesianGrid
                        strokeDasharray={format.gridLines.style === 'dashed' ? '3 3' : '0'}
                        stroke={format.gridLines.color || (theme === 'dark' ? '#333' : '#e0e0e0')}
                    />
                )}

                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: theme === 'dark' ? '#a0a0a0' : '#666' }}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: theme === 'dark' ? '#a0a0a0' : '#666' }}
                    tickFormatter={(v) => formatNumber(v)}
                />

                <Tooltip content={<ChartTooltipContent theme={theme} />} />

                {format.legend?.show && (
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                )}

                {valueKeys.map((key, index) => (
                    <DataComponent
                        key={key}
                        type={format.series?.lineType === 'step' ? 'step' : format.series?.lineType === 'natural' ? 'natural' : 'monotone'}
                        dataKey={key}
                        stroke={colors[index % colors.length]}
                        fill={showArea ? colors[index % colors.length] : undefined}
                        fillOpacity={showArea ? 0.3 : undefined}
                        strokeWidth={format.series?.lineWidth || 2}
                        dot={format.series?.showMarkers !== false ? {
                            fill: colors[index % colors.length],
                            r: format.series?.markerSize || 4,
                        } : false}
                        opacity={isDimmed ? 0.3 : 1}
                        onClick={(data, index) => onDataPointClick?.(data, index)}
                    />
                ))}

                {/* Analytics lines */}
                {widget.analyticsEnabled && valueKeys[0] && (
                    <AnalyticsLinesRenderer
                        data={data}
                        valueKey={valueKeys[0]}
                        chartType="line"
                    />
                )}
            </ChartComponent>
        </ResponsiveContainer>
    );
};

// Pie/Donut Chart Component
const PieChartRenderer: React.FC<EnhancedChartRendererProps & { isDonut?: boolean }> = ({
    widget, data, width, height, onDataPointClick, theme, isDimmed, isDonut
}) => {
    const { format } = widget;
    const colors = getDataColors(format, data.length, theme || 'light');

    const innerRadius = isDonut ? '60%' : 0;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius="80%"
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={format.series?.pieGap || 2}
                    onClick={(data, index) => onDataPointClick?.(data, index)}
                    label={format.dataLabels?.show ? ({
                        cx, cy, midAngle, innerRadius, outerRadius, percent, name, value
                    }: any) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                            <text
                                x={x}
                                y={y}
                                fill={theme === 'dark' ? '#fff' : '#333'}
                                textAnchor={x > cx ? 'start' : 'end'}
                                dominantBaseline="central"
                                fontSize={format.dataLabels?.fontSize || 11}
                            >
                                {format.dataLabels?.labelContent === 'percent'
                                    ? `${(percent * 100).toFixed(0)}%`
                                    : format.dataLabels?.labelContent === 'value'
                                        ? formatNumber(value)
                                        : name}
                            </text>
                        );
                    } : false}
                >
                    {data.map((entry, index) => {
                        const cf = applyConditionalFormatting(entry.value, format.conditionalFormatting, 'value');
                        return (
                            <Cell
                                key={`cell-${index}`}
                                fill={cf?.color || colors[index % colors.length]}
                                opacity={isDimmed ? 0.3 : 1}
                                stroke={format.general?.borderColor || (theme === 'dark' ? '#1f1f1f' : '#fff')}
                                strokeWidth={format.general?.borderWidth || 1}
                            />
                        );
                    })}
                </Pie>

                <Tooltip content={<ChartTooltipContent theme={theme} />} />

                {format.legend?.show && (
                    <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        wrapperStyle={{ fontSize: 11 }}
                    />
                )}
            </PieChart>
        </ResponsiveContainer>
    );
};

// Scatter/Bubble Chart Component
const ScatterChartRenderer: React.FC<EnhancedChartRendererProps & { isBubble?: boolean }> = ({
    widget, data, width, height, onDataPointClick, theme, isDimmed, isBubble
}) => {
    const { format } = widget;
    const colors = getDataColors(format, data.length, theme || 'light');

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                {format.gridLines?.show && (
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#e0e0e0'} />
                )}

                <XAxis
                    type="number"
                    dataKey="x"
                    name="X"
                    tick={{ fontSize: 11, fill: theme === 'dark' ? '#a0a0a0' : '#666' }}
                />
                <YAxis
                    type="number"
                    dataKey="y"
                    name="Y"
                    tick={{ fontSize: 11, fill: theme === 'dark' ? '#a0a0a0' : '#666' }}
                />

                <Tooltip content={<ChartTooltipContent theme={theme} />} cursor={{ strokeDasharray: '3 3' }} />

                {format.legend?.show && <Legend />}

                <Scatter
                    data={data}
                    fill={colors[0]}
                    opacity={isDimmed ? 0.3 : 1}
                    onClick={(data, index) => onDataPointClick?.(data, index)}
                >
                    {data.map((entry, index) => {
                        const cf = applyConditionalFormatting(entry.value || entry.y, format.conditionalFormatting, 'value');
                        return (
                            <Cell
                                key={`cell-${index}`}
                                fill={cf?.color || colors[index % colors.length]}
                                r={isBubble && entry.size ? Math.sqrt(entry.size) * 2 : format.series?.markerSize || 6}
                            />
                        );
                    })}
                </Scatter>

                {/* Analytics lines */}
                {widget.analyticsEnabled && (
                    <AnalyticsLinesRenderer
                        data={data}
                        valueKey="y"
                        chartType="scatter"
                    />
                )}
            </ScatterChart>
        </ResponsiveContainer>
    );
};

// Card/KPI Component
const CardRenderer: React.FC<EnhancedChartRendererProps> = ({
    widget, data, width, height, theme
}) => {
    const { format } = widget;
    const value = data[0]?.value ?? 0;
    const label = data[0]?.label ?? widget.name;
    const target = data[0]?.target;
    const trend = data[0]?.trend; // positive, negative, neutral
    const trendValue = data[0]?.trendValue;

    const cf = applyConditionalFormatting(value, format.conditionalFormatting, 'value');

    const valueColor = cf?.color || format.dataLabels?.color || (theme === 'dark' ? '#fff' : '#333');

    return (
        <div
            className="flex flex-col items-center justify-center h-full p-4"
            style={{
                backgroundColor: format.general?.backgroundColor || 'transparent',
                borderRadius: format.general?.borderRadius || 0,
            }}
        >
            <div
                className="text-sm font-medium mb-2"
                style={{ color: theme === 'dark' ? '#a0a0a0' : '#666' }}
            >
                {label}
            </div>
            <div
                className="text-4xl font-bold"
                style={{
                    color: valueColor,
                    fontSize: format.dataLabels?.fontSize || 48,
                    fontFamily: format.dataLabels?.fontFamily || 'inherit',
                }}
            >
                {formatNumber(value, format.dataLabels?.numberFormat)}
            </div>
            {target !== undefined && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                    <span style={{ color: theme === 'dark' ? '#a0a0a0' : '#666' }}>
                        Target: {formatNumber(target)}
                    </span>
                    {trendValue !== undefined && (
                        <span
                            className="flex items-center"
                            style={{
                                color: trend === 'positive' ? '#107c10' : trend === 'negative' ? '#e81123' : '#666'
                            }}
                        >
                            {trend === 'positive' ? '↑' : trend === 'negative' ? '↓' : '→'}
                            {trendValue}%
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// Gauge Component
const GaugeRenderer: React.FC<EnhancedChartRendererProps> = ({
    widget, data, width, height, theme
}) => {
    const { format } = widget;
    const value = data[0]?.value ?? 0;
    const min = data[0]?.min ?? 0;
    const max = data[0]?.max ?? 100;
    const target = data[0]?.target;

    const percentage = ((value - min) / (max - min)) * 100;
    const angle = (percentage / 100) * 180 - 90;

    const cf = applyConditionalFormatting(value, format.conditionalFormatting, 'value');

    return (
        <div className="relative flex items-center justify-center h-full">
            <svg viewBox="0 0 200 120" className="w-full h-full max-w-xs">
                {/* Background arc */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={theme === 'dark' ? '#333' : '#e0e0e0'}
                    strokeWidth="15"
                    strokeLinecap="round"
                />

                {/* Value arc */}
                <path
                    d={`M 20 100 A 80 80 0 0 1 ${20 + 160 * Math.min(percentage / 100, 1)} ${100 - Math.sin((percentage / 100) * Math.PI) * 80}`}
                    fill="none"
                    stroke={cf?.color || format.series?.colors?.[0] || '#0078d4'}
                    strokeWidth="15"
                    strokeLinecap="round"
                />

                {/* Target line */}
                {target !== undefined && (
                    <line
                        x1={100 + 70 * Math.cos(((target - min) / (max - min) * 180 - 90) * Math.PI / 180)}
                        y1={100 - 70 * Math.sin(((target - min) / (max - min) * 180 - 90) * Math.PI / 180)}
                        x2={100 + 90 * Math.cos(((target - min) / (max - min) * 180 - 90) * Math.PI / 180)}
                        y2={100 - 90 * Math.sin(((target - min) / (max - min) * 180 - 90) * Math.PI / 180)}
                        stroke={theme === 'dark' ? '#fff' : '#333'}
                        strokeWidth="3"
                    />
                )}

                {/* Value text */}
                <text
                    x="100"
                    y="85"
                    textAnchor="middle"
                    fill={cf?.color || (theme === 'dark' ? '#fff' : '#333')}
                    fontSize={format.dataLabels?.fontSize || 24}
                    fontWeight="bold"
                >
                    {formatNumber(value)}
                </text>

                {/* Min/Max labels */}
                <text x="25" y="115" fill={theme === 'dark' ? '#a0a0a0' : '#666'} fontSize="10">
                    {formatNumber(min)}
                </text>
                <text x="175" y="115" textAnchor="end" fill={theme === 'dark' ? '#a0a0a0' : '#666'} fontSize="10">
                    {formatNumber(max)}
                </text>
            </svg>
        </div>
    );
};

// Table Component
const TableRenderer: React.FC<EnhancedChartRendererProps> = ({
    widget, data, width, height, theme, onDataPointClick
}) => {
    const { format } = widget;

    const columns = useMemo(() => {
        if (!data.length) return [];
        return Object.keys(data[0]);
    }, [data]);

    return (
        <div
            className="h-full overflow-auto"
            style={{
                fontSize: format.dataLabels?.fontSize || 12,
                backgroundColor: format.general?.backgroundColor || 'transparent',
            }}
        >
            <table className="w-full border-collapse">
                <thead className="sticky top-0">
                    <tr style={{
                        backgroundColor: format.header?.backgroundColor || (theme === 'dark' ? '#2d2d2d' : '#f5f5f5'),
                    }}>
                        {columns.map(col => (
                            <th
                                key={col}
                                className="px-3 py-2 text-left font-semibold border-b"
                                style={{
                                    color: format.header?.color || (theme === 'dark' ? '#fff' : '#333'),
                                    borderColor: theme === 'dark' ? '#444' : '#e0e0e0',
                                }}
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className="hover:bg-opacity-50 cursor-pointer"
                            style={{
                                backgroundColor: rowIndex % 2 === 1
                                    ? (format.rows?.alternateBackground || (theme === 'dark' ? '#252525' : '#fafafa'))
                                    : 'transparent',
                            }}
                            onClick={() => onDataPointClick?.(row, rowIndex)}
                        >
                            {columns.map(col => {
                                const value = row[col];
                                const cf = typeof value === 'number'
                                    ? applyConditionalFormatting(value, format.conditionalFormatting, col)
                                    : null;

                                return (
                                    <td
                                        key={col}
                                        className="px-3 py-2 border-b"
                                        style={{
                                            color: cf?.color || (theme === 'dark' ? '#d0d0d0' : '#333'),
                                            borderColor: theme === 'dark' ? '#333' : '#e0e0e0',
                                        }}
                                    >
                                        {typeof value === 'number' ? formatNumber(value) : String(value)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Main Enhanced Chart Renderer
export const EnhancedChartRenderer: React.FC<EnhancedChartRendererProps> = (props) => {
    const { widget, data, width, height, theme = 'light' } = props;

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm">No data</p>
                </div>
            </div>
        );
    }

    // Render appropriate chart based on widget type
    switch (widget.type) {
        case 'clusteredBar':
            return <BarChartRenderer {...props} layout="horizontal" />;
        case 'stackedBar':
            return <BarChartRenderer {...props} layout="horizontal" stacked />;
        case 'percentStackedBar':
            return <BarChartRenderer {...props} layout="horizontal" percentStacked />;
        case 'clusteredColumn':
            return <BarChartRenderer {...props} layout="vertical" />;
        case 'stackedColumn':
            return <BarChartRenderer {...props} layout="vertical" stacked />;
        case 'percentStackedColumn':
            return <BarChartRenderer {...props} layout="vertical" percentStacked />;
        case 'line':
            return <LineChartRenderer {...props} />;
        case 'area':
        case 'stackedArea':
            return <LineChartRenderer {...props} showArea />;
        case 'pie':
            return <PieChartRenderer {...props} />;
        case 'donut':
            return <PieChartRenderer {...props} isDonut />;
        case 'scatter':
            return <ScatterChartRenderer {...props} />;
        case 'bubble':
            return <ScatterChartRenderer {...props} isBubble />;
        case 'card':
        case 'kpi':
            return <CardRenderer {...props} />;
        case 'gauge':
            return <GaugeRenderer {...props} />;
        case 'table':
        case 'matrix':
            return <TableRenderer {...props} />;
        default:
            // Default to bar chart
            return <BarChartRenderer {...props} layout="vertical" />;
    }
};

export default EnhancedChartRenderer;
