import React, { useState, useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Sector,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { ChevronRight, ChevronDown, RotateCcw, Plus, X, Lightbulb } from 'lucide-react';

/** Extended palette so many series stay visually distinct (Power BI–inspired + extra hues) */
const PBI_COLORS = [
  '#118DFF', // blue
  '#12239E', // navy
  '#E66C37', // orange
  '#6B007B', // purple
  '#00B7C3', // cyan
  '#744EC2', // violet
  '#D64550', // red
  '#7FBA00', // green
  '#FFB900', // amber
  '#4C78A8', // steel blue
  '#E91E63', // pink
  '#009688', // teal
  '#FF5722', // deep orange
  '#673AB7', // deep purple
  '#3F51B5', // indigo
  '#8BC34A', // light green
  '#FF9800', // orange
  '#795548', // brown
  '#607D8B', // blue grey
  '#9C27B0', // magenta
];

/** Lighten or darken a hex color. Factor > 0 = lighter, factor < 0 = darker */
function lightenColor(hex: string, factor: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex;
  const adjust = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (factor >= 0 ? (255 - c) * factor : c * factor))));
  const r = adjust(parseInt(m[1], 16));
  const g = adjust(parseInt(m[2], 16));
  const b = adjust(parseInt(m[3], 16));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

type ThemeMode = 'light' | 'dark';

function getChartTokens(mode: ThemeMode) {
  const isDark = mode === 'dark';
  return {
    grid: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(107, 114, 128, 0.14)',
    axis: isDark ? 'rgba(226, 232, 240, 0.78)' : 'rgba(55, 65, 81, 0.82)',
    tick: isDark ? 'rgba(226, 232, 240, 0.82)' : 'rgba(55, 65, 81, 0.88)',
    legend: isDark ? 'rgba(226, 232, 240, 0.88)' : 'rgba(17, 24, 39, 0.85)',
    tooltipBg: isDark ? 'rgba(17, 24, 39, 0.97)' : 'rgba(255, 255, 255, 0.99)',
    tooltipBorder: isDark ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.9)',
    tooltipText: isDark ? '#f9fafb' : '#111827',
    tooltipShadow: isDark ? '0 20px 50px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)' : '0 20px 50px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
    fontSize: 14,
  };
}

const tooltipContentStyle = { transition: 'opacity 0.2s ease, transform 0.2s ease' };

/** Resolve a solid color for tooltip dot from payload item (Recharts may pass fill as url() for pie). */
function getTooltipDotColor(
  p: any,
  index: number,
  options?: { pieData?: any[]; pieNameKey?: string; pieValueKey?: string; pieAccentColor?: string }
): string {
  const c = p?.color || p?.stroke;
  if (c && typeof c === 'string' && !c.startsWith('url')) return c;
  const fill = p?.fill;
  if (fill && typeof fill === 'string' && !fill.startsWith('url')) return fill;
  // Pie/donut: payload has fill as url(); resolve slice index from data so dot matches slice color
  if (options?.pieData && options.pieNameKey != null && options.pieValueKey != null) {
    const sliceIndex = (options.pieData as any[]).findIndex(
      (d) => String(d[options.pieNameKey!]) === String(p?.name) && Number(d[options.pieValueKey!]) === Number(p?.value)
    );
    if (sliceIndex >= 0) {
      return sliceIndex === 0 && options.pieAccentColor ? options.pieAccentColor : PBI_COLORS[sliceIndex % PBI_COLORS.length];
    }
  }
  return PBI_COLORS[index % PBI_COLORS.length];
}

export function PowerBITooltip({
  active,
  payload,
  label,
  mode,
  pieData,
  pieNameKey,
  pieValueKey,
  pieAccentColor,
}: {
  active?: boolean;
  payload?: any[];
  label?: unknown;
  mode: ThemeMode;
  /** Pass from Pie/Donut so tooltip dot matches slice color (gradient fill is not usable) */
  pieData?: any[];
  pieNameKey?: string;
  pieValueKey?: string;
  pieAccentColor?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const t = getChartTokens(mode);
  const pieOpts = pieData && pieNameKey != null && pieValueKey != null
    ? { pieData, pieNameKey, pieValueKey, pieAccentColor }
    : undefined;
  return (
    <div
      className="rounded-xl px-4 py-3 border"
      style={{
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        color: t.tooltipText,
        backdropFilter: 'blur(12px)',
        boxShadow: t.tooltipShadow,
        ...tooltipContentStyle,
      }}
    >
      {label !== undefined && label !== null && (
        <div className="text-base font-semibold mb-2 pb-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          {String(label)}
        </div>
      )}
      <div className="space-y-2">
        {payload.map((p: any, idx: number) => {
          const dotColor = getTooltipDotColor(p, idx, pieOpts);
          return (
            <div key={idx} className="flex items-center justify-between gap-6 text-[14px]">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0 border-2 border-white/30 shadow-sm"
                  style={{ backgroundColor: dotColor }}
                  title={String(p.name ?? '')}
                  aria-hidden
                />
                <span className="truncate font-medium">
                  {String(p.name ?? '')}
                </span>
              </div>
              <span className="font-bold">
                {typeof p.value === 'number' ? p.value.toLocaleString() : String(p.value ?? '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function commonAxisProps(mode: ThemeMode) {
  const t = getChartTokens(mode);
  return {
    stroke: t.axis,
    tick: { fill: t.tick, fontSize: t.fontSize },
    axisLine: true,
    tickLine: false,
    minTickGap: 10,
  } as const;
}

function commonGridProps(mode: ThemeMode) {
  const t = getChartTokens(mode);
  return {
    stroke: t.grid,
    strokeDasharray: '4 8',
    vertical: false,
    strokeWidth: 0.75,
  } as const;
}

function commonLegendProps(mode: ThemeMode) {
  const t = getChartTokens(mode);
  return {
    verticalAlign: 'top' as const,
    align: 'left' as const,
    iconType: 'circle' as const,
    iconSize: 10,
    wrapperStyle: { fontSize: t.fontSize, color: t.legend, paddingBottom: 6 },
  };
}

const commonTooltipProps = {
  isAnimationActive: true,
  animationDuration: 220,
  animationEasing: 'ease-out' as const,
  cursor: { fill: 'rgba(0,0,0,0.03)', stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1, strokeDasharray: '4 4' },
};

export function PowerBIBar({
  data,
  xKey,
  yKey,
  mode,
  id,
  layout = 'horizontal',
  onBarClick,
  accentColor,
  animations = false,
}: {
  data: unknown[];
  xKey?: string;
  yKey?: string;
  mode: ThemeMode;
  id: string;
  layout?: 'horizontal' | 'vertical';
  onBarClick?: (data: any) => void;
  accentColor?: string;
  animations?: boolean;
}) {
  const barColor = accentColor || PBI_COLORS[0];
  const barColor2 = accentColor ? barColor : mode === 'dark' ? '#0b5cab' : '#0b6bd6';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data as any[]}
        layout={layout}
        margin={{ top: 12, right: 10, bottom: 4, left: 8 }}
      >
        <defs>
          <linearGradient id={`pbi-bar-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lightenColor(barColor, 0.15)} stopOpacity={1} />
            <stop offset="100%" stopColor={barColor2} stopOpacity={0.92} />
          </linearGradient>
        </defs>
        <CartesianGrid {...commonGridProps(mode)} horizontal={layout === 'horizontal'} vertical={layout === 'vertical'} />
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
            <YAxis {...commonAxisProps(mode)} />
          </>
        ) : (
          <>
            <XAxis type="number" {...commonAxisProps(mode)} />
            <YAxis dataKey={xKey} type="category" {...commonAxisProps(mode)} width={100} />
          </>
        )}
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        <Bar
          dataKey={yKey}
          fill={`url(#pbi-bar-${id})`}
          radius={[10, 10, 0, 0]}
          isAnimationActive={animations}
          animationDuration={animations ? 350 : 0}
          animationEasing="ease-out"
          onClick={onBarClick}
          cursor="pointer"
          activeBar={animations ? { stroke: mode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)', strokeWidth: 2, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' } : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const PowerBIStackedBar = React.memo(({
  data,
  xKey,
  stackKeys,
  mode,
  layout = 'horizontal',
  onBarClick,
  accentColor,
  id = 'stacked-bar',
  animations = false,
}: {
  data: unknown[];
  xKey?: string;
  stackKeys: string[];
  mode: ThemeMode;
  layout?: 'horizontal' | 'vertical';
  onBarClick?: (data: any) => void;
  accentColor?: string;
  id?: string;
  animations?: boolean;
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data as any[]}
        layout={layout}
        margin={{ top: 12, right: 10, bottom: 4, left: 8 }}
      >
        <defs>
          {stackKeys.map((_, index) => {
            const baseColor = index === 0 && accentColor ? accentColor : PBI_COLORS[index % PBI_COLORS.length];
            return (
              <linearGradient key={index} id={`pbi-stacked-${id}-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lightenColor(baseColor, 0.25)} stopOpacity={1} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={0.9} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid {...commonGridProps(mode)} horizontal={layout === 'horizontal'} vertical={layout === 'vertical'} />
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
            <YAxis type="number" {...commonAxisProps(mode)} />
          </>
        ) : (
          <>
            <XAxis type="number" {...commonAxisProps(mode)} />
            <YAxis dataKey={xKey} type="category" {...commonAxisProps(mode)} width={100} />
          </>
        )}
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        {stackKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={`url(#pbi-stacked-${id}-${index})`}
            isAnimationActive={animations}
            animationDuration={animations ? 300 : 0}
            animationEasing="ease-out"
            radius={index === stackKeys.length - 1 ? (layout === 'horizontal' ? [10, 10, 0, 0] : [0, 10, 10, 0]) : [0, 0, 0, 0]}
            onClick={onBarClick}
            cursor="pointer"
            activeBar={animations ? { stroke: mode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)', strokeWidth: 2, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' } : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
});

export function PowerBILine({
  data,
  xKey,
  yKey,
  mode,
  accentColor,
  animations = false,
}: {
  data: unknown[];
  xKey?: string;
  yKey?: string;
  mode: ThemeMode;
  accentColor?: string;
  animations?: boolean;
}) {
  const strokeColor = accentColor || PBI_COLORS[0];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data as any[]} margin={{ top: 12, right: 10, bottom: 4, left: 8 }}>
        <CartesianGrid {...commonGridProps(mode)} />
        <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
        <YAxis {...commonAxisProps(mode)} />
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={strokeColor}
          strokeWidth={2.75}
          dot={false}
          activeDot={animations ? { r: 7, fill: strokeColor, stroke: mode === 'dark' ? 'rgba(255,255,255,0.9)' : '#fff', strokeWidth: 2.5, style: { transition: 'all 0.2s ease', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' } } : { r: 5 }}
          isAnimationActive={animations}
          animationDuration={animations ? 400 : 0}
          animationEasing="ease-out"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PowerBIArea({
  data,
  xKey,
  yKey,
  mode,
  id,
  accentColor,
  animations = false,
}: {
  data: unknown[];
  xKey?: string;
  yKey?: string;
  mode: ThemeMode;
  id: string;
  accentColor?: string;
  animations?: boolean;
}) {
  const fillTop = accentColor || PBI_COLORS[0];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data as any[]} margin={{ top: 12, right: 10, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id={`pbi-area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillTop} stopOpacity={0.45} />
            <stop offset="60%" stopColor={fillTop} stopOpacity={0.12} />
            <stop offset="100%" stopColor={fillTop} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...commonGridProps(mode)} />
        <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
        <YAxis {...commonAxisProps(mode)} />
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={fillTop}
          strokeWidth={2.5}
          fill={`url(#pbi-area-${id})`}
          isAnimationActive={animations}
          animationDuration={animations ? 400 : 0}
          animationEasing="ease-out"
          strokeLinecap="round"
          strokeLinejoin="round"
          activeDot={animations ? { r: 6, fill: fillTop, stroke: mode === 'dark' ? 'rgba(255,255,255,0.9)' : '#fff', strokeWidth: 2.5, style: { filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' } } : undefined}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PowerBIPie({
  data,
  nameKey,
  valueKey,
  mode,
  donut,
  onSliceClick,
  accentColor,
  id = 'pie',
  animations = false,
}: {
  data: { name: string; value: number }[];
  nameKey: string;
  valueKey: string;
  mode: ThemeMode;
  donut?: boolean;
  onSliceClick?: (data: { name: string; value: number }) => void;
  accentColor?: string;
  id?: string;
  animations?: boolean;
}) {
  const innerRadius = donut ? '55%' : 0;
  const outerRadius = donut ? '82%' : '86%';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 10, right: 10, bottom: 8, left: 10 }}>
        <defs>
          {data.map((_, index) => {
            const baseColor = index === 0 && accentColor ? accentColor : PBI_COLORS[index % PBI_COLORS.length];
            const lightColor = lightenColor(baseColor, 0.35);
            return (
              <linearGradient key={index} id={`pbi-pie-${id}-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={lightColor} stopOpacity={1} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={1} />
              </linearGradient>
            );
          })}
        </defs>
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} pieData={data} pieNameKey={nameKey} pieValueKey={valueKey} pieAccentColor={accentColor} />} {...commonTooltipProps} cursor={false} />
        <Pie
          data={data}
          nameKey={nameKey}
          dataKey={valueKey}
          cx="50%"
          cy="52%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={1}
          cornerRadius={10}
          isAnimationActive={animations}
          animationDuration={animations ? 300 : 0}
          animationEasing="ease-out"
          onClick={onSliceClick}
          cursor="pointer"
          activeShape={animations ? (props: any) => {
            const { cx, cy, innerRadius: ir, outerRadius: or, ...rest } = props;
            const orVal = typeof or === 'string' ? parseFloat(or) : (or ?? 80);
            const irVal = typeof ir === 'string' ? parseFloat(ir) : (ir ?? 0);
            const scaledOuter = orVal * 1.06;
            const scaledInner = irVal > 0 ? irVal * 1.02 : 0;
            return (
              <Sector
                {...rest}
                cx={cx}
                cy={cy}
                innerRadius={scaledInner}
                outerRadius={scaledOuter}
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.22))', transition: 'all 0.25s ease' }}
              />
            );
          } : undefined}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={`url(#pbi-pie-${id}-${index})`} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PowerBITreemap({
  data,
  mode,
  accentColor,
  id = 'treemap',
  animations = false,
}: {
  data: { name: string; value: number }[];
  mode: ThemeMode;
  accentColor?: string;
  id?: string;
  animations?: boolean;
}) {
  const baseColor = accentColor || PBI_COLORS[0];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={data}
        dataKey="value"
        stroke={mode === 'dark' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255,255,255,0.9)'}
        fill={`url(#pbi-treemap-${id})`}
        isAnimationActive={animations}
      >
        <defs>
          <linearGradient id={`pbi-treemap-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={lightenColor(baseColor, 0.35)} stopOpacity={1} />
            <stop offset="100%" stopColor={baseColor} stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
      </Treemap>
    </ResponsiveContainer>
  );
}

export function PowerBIScatter({
  data,
  xKey,
  yKey,
  mode,
  accentColor,
  id = 'scatter',
  animations = false,
}: {
  data: unknown[];
  xKey?: string;
  yKey?: string;
  mode: ThemeMode;
  accentColor?: string;
  id?: string;
  animations?: boolean;
}) {
  const baseColor = accentColor || PBI_COLORS[0];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 12, right: 10, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id={`pbi-scatter-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lightenColor(baseColor, 0.3)} stopOpacity={1} />
            <stop offset="100%" stopColor={baseColor} stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid {...commonGridProps(mode)} />
        <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
        <YAxis dataKey={yKey} {...commonAxisProps(mode)} />
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        <Scatter
          data={data as any[]}
          fill={`url(#pbi-scatter-${id})`}
          isAnimationActive={animations}
          animationDuration={animations ? 400 : 0}
          animationEasing="ease-out"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function PowerBIBubble({
  data,
  xKey,
  yKey,
  zKey,
  mode,
  accentColor,
  id = 'bubble',
  animations = false,
}: {
  data: unknown[];
  xKey?: string;
  yKey?: string;
  zKey?: string;
  mode: ThemeMode;
  accentColor?: string;
  id?: string;
  animations?: boolean;
}) {
  const baseColor = accentColor || PBI_COLORS[0];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 12, right: 10, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id={`pbi-bubble-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lightenColor(baseColor, 0.35)} stopOpacity={0.9} />
            <stop offset="100%" stopColor={baseColor} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid {...commonGridProps(mode)} />
        <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
        <YAxis dataKey={yKey} {...commonAxisProps(mode)} />
        <ZAxis dataKey={zKey} range={[60, 400]} />
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        <Scatter
          data={data as any[]}
          fill={`url(#pbi-bubble-${id})`}
          fillOpacity={0.85}
          isAnimationActive={animations}
          animationDuration={animations ? 400 : 0}
          animationEasing="ease-out"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function PowerBIWaterfall({
  data,
  xKey,
  yKey,
  mode,
  animations = false,
}: {
  data: unknown[];
  xKey?: string;
  yKey?: string;
  mode: ThemeMode;
  animations?: boolean;
}) {
  // Transform data to waterfall format with cumulative values
  const waterfallData = (data as any[]).map((item, index) => {
    const value = Number(item[yKey || 'value']) || 0;
    const prevSum = index === 0 ? 0 : (data as any[])
      .slice(0, index)
      .reduce((sum, d) => sum + (Number(d[yKey || 'value']) || 0), 0);

    return {
      ...item,
      start: prevSum,
      end: prevSum + value,
      value: value,
      isPositive: value >= 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={waterfallData} margin={{ top: 12, right: 10, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id="pbi-waterfall-pos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lightenColor('#ef4444', 0.25)} stopOpacity={1} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
          </linearGradient>
          <linearGradient id="pbi-waterfall-neg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lightenColor('#ef4444', 0.2)} stopOpacity={1} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <CartesianGrid {...commonGridProps(mode)} />
        <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
        <YAxis {...commonAxisProps(mode)} />
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        <Bar
          dataKey="value"
          radius={[8, 8, 4, 4]}
          isAnimationActive={animations}
          animationDuration={animations ? 300 : 0}
          animationEasing="ease-out"
          cursor="pointer"
          activeBar={animations ? { stroke: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.12)', strokeWidth: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' } : undefined}
        >
          {waterfallData.map((entry, index) => (
            <Cell key={index} fill={entry.isPositive ? 'url(#pbi-waterfall-pos)' : 'url(#pbi-waterfall-neg)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PowerBIFunnel({
  data,
  nameKey,
  valueKey,
  mode,
}: {
  data: unknown[];
  nameKey?: string;
  valueKey?: string;
  mode: ThemeMode;
}) {
  const t = getChartTokens(mode);
  const isDark = mode === 'dark';

  // Sort data by value descending for funnel effect
  const sortedData = [...(data as any[])].sort((a, b) =>
    (Number(b[valueKey || 'value']) || 0) - (Number(a[valueKey || 'value']) || 0)
  );

  const maxValue = Math.max(...sortedData.map(d => Number(d[valueKey || 'value']) || 0));

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-1">
        {sortedData.map((item, index) => {
          const value = Number(item[valueKey || 'value']) || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const name = String(item[nameKey || 'name'] || `Stage ${index + 1}`);

          const baseColor = PBI_COLORS[index % PBI_COLORS.length];
          const lightColor = lightenColor(baseColor, 0.25);
          const tooltipText = `${name}: ${value.toLocaleString()}`;
          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className="relative flex items-center justify-between px-4 py-3 rounded-md transition-all duration-300 hover:opacity-95 hover:scale-[1.02]"
                style={{
                  width: `${Math.max(percentage, 20)}%`,
                  background: `linear-gradient(135deg, ${lightColor} 0%, ${baseColor} 100%)`,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
                title={tooltipText}
              >
                <span className="text-base font-medium truncate">{name}</span>
                <span className="text-base font-bold ml-2">{value.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Aggregation helper for decomposition tree */
function aggValues(values: number[], agg?: string): number {
  if (values.length === 0) return 0;
  switch (agg) {
    case 'count': return values.length;
    case 'countDistinct': return new Set(values).size;
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min': return Math.min(...values);
    case 'max': return Math.max(...values);
    default: return values.reduce((a, b) => a + b, 0);
  }
}

const MAX_VISIBLE_NODES = 6;

export function PowerBIDecompositionTree({
  data,
  measureFields,
  dimensionFields,
  aggregation = 'sum',
  mode,
  format,
  accentColor,
  onNodeClick,
}: {
  data: unknown[];
  measureFields: string[];
  dimensionFields: string[];
  aggregation?: string;
  mode: ThemeMode;
  format?: string;
  accentColor?: string;
  onNodeClick?: (field: string, value: unknown) => void;
}) {
  const [drillPath, setDrillPath] = useState<{ dim: string; value: unknown }[]>([]);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

  const isDark = mode === 'dark';
  const t = getChartTokens(mode);
  const primaryColor = accentColor || PBI_COLORS[0];
  const measureLabel = measureFields[0] || 'Value';
  const connectorColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const barTrack = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  const formatVal = (v: number) => {
    if (format === 'currency') return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (format === 'percent') return `${(v * 100).toFixed(2)}%`;
    return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getFilteredData = (upToLevel: number) => {
    let rows = (data as any[]).slice();
    for (let i = 0; i < upToLevel && i < drillPath.length; i++) {
      const step = drillPath[i];
      const stepVal = step.value === null || step.value === undefined ? '' : step.value;
      rows = rows.filter((r) => String(r?.[step.dim] ?? '') === String(stepVal));
    }
    return rows;
  };

  const getBreakdown = (dim: string, dataRows: any[]) => {
    const grouped = new Map<unknown, any[]>();
    for (const r of dataRows) {
      const key = r?.[dim] ?? '(Blank)';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }
    return Array.from(grouped.entries())
      .map(([key, rows]) => {
        const valuesByMeasure = measureFields.map((mf) => {
          const numeric = rows.some((r) => typeof r[mf] === 'number' || (!isNaN(Number(r[mf])) && r[mf] !== ''));
          const vals = rows.map((r) => (numeric ? Number(r[mf]) || 0 : 1));
          return aggValues(vals, aggregation);
        });
        const primaryVal = valuesByMeasure[0] ?? 0;
        return { name: String(key), values: valuesByMeasure, value: primaryVal };
      })
      .sort((a, b) => b.value - a.value);
  };

  const rootData = useMemo(() => getFilteredData(0), [data, drillPath]);
  const rootValue = useMemo(() => {
    if (!measureFields[0] || rootData.length === 0) return 0;
    const numeric = rootData.some((r) => typeof r[measureFields[0]] === 'number' || (!isNaN(Number(r[measureFields[0]])) && r[measureFields[0]] !== ''));
    const vals = rootData.map((r) => (numeric ? Number(r[measureFields[0]]) || 0 : 1));
    return aggValues(vals, aggregation);
  }, [rootData, measureFields, aggregation]);

  const treeLevels = useMemo(() => {
    const levels: { dim: string; nodes: { name: string; value: number; values: number[]; isSelected: boolean; pct: number }[] }[] = [];
    for (let i = 0; i < dimensionFields.length; i++) {
      const dim = dimensionFields[i];
      const filtered = getFilteredData(i);
      const nodes = getBreakdown(dim, filtered);
      const selectedVal = drillPath[i]?.value;
      const selectedStr = selectedVal === null || selectedVal === undefined ? '(Blank)' : String(selectedVal);
      const maxVal = Math.max(...nodes.map((n) => n.value), 1);
      levels.push({
        dim,
        nodes: nodes.map((n) => ({
          ...n,
          isSelected: n.name === selectedStr,
          pct: maxVal > 0 ? (n.value / maxVal) * 100 : 0,
        })),
      });
    }
    return levels;
  }, [data, drillPath, dimensionFields, measureFields, aggregation]);

  const handleDrillDown = (levelIdx: number, value: unknown) => {
    const dim = dimensionFields[levelIdx];
    const newPath = drillPath.slice(0, levelIdx);
    newPath.push({ dim, value: value === '(Blank)' ? null : value });
    setDrillPath(newPath);
    onNodeClick?.(dim, value);
  };

  const handleClearFilter = (levelIdx: number) => {
    setDrillPath((p) => p.slice(0, levelIdx));
  };

  const toggleExpanded = (levelIdx: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelIdx)) next.delete(levelIdx);
      else next.add(levelIdx);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ color: t.legend, backgroundColor: isDark ? '#1e293b' : '#ffffff' }}>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="flex items-stretch gap-0" style={{ minWidth: 'max-content' }}>
          {/* Column 0: Root — Total Sales style */}
          <div className="flex flex-col justify-center shrink-0 pr-2">
            <div
              className="flex flex-col rounded-lg overflow-hidden min-w-[180px]"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
              }}
            >
              <div className="px-4 pt-3 pb-2">
                <div className="text-base font-medium mb-1" style={{ color: mutedColor }}>
                  {measureLabel}
                </div>
                <div className="text-2xl font-bold mb-3" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
                  {formatVal(rootValue)}
                </div>
              </div>
              <div className="h-3 w-full overflow-hidden" style={{ backgroundColor: barTrack }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: '100%', backgroundColor: primaryColor }}
                />
              </div>
            </div>
          </div>

          {/* Connector + dimension columns */}
          {treeLevels.map((level, levelIdx) => {
            const expanded = expandedLevels.has(levelIdx);
            const visibleNodes = expanded ? level.nodes : level.nodes.slice(0, MAX_VISIBLE_NODES);
            const hasMore = level.nodes.length > MAX_VISIBLE_NODES;
            const canDrill = drillPath.length >= levelIdx;

            return (
              <React.Fragment key={levelIdx}>
                {/* Curved connector */}
                <div className="flex items-center shrink-0 w-8 justify-center self-stretch py-4">
                  <svg width={32} height="100%" className="overflow-visible" style={{ minHeight: 80 }}>
                    <path
                      d="M 0 50 Q 16 50 32 50"
                      fill="none"
                      stroke={connectorColor}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex flex-col min-w-[200px] max-w-[240px] shrink-0">
                  {/* Per-column filter header */}
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-t-lg shrink-0"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                      borderBottom: 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold truncate" style={{ color: mutedColor }}>
                        {level.dim}
                      </span>
                      {drillPath[levelIdx] != null && (
                        <span className="text-sm font-medium truncate" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
                          {String(drillPath[levelIdx].value ?? '(Blank)')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {levelIdx === dimensionFields.length - 1 && (
                        <button
                          type="button"
                          className="p-1 rounded hover:opacity-80"
                          style={{ color: mutedColor }}
                          title="Insights"
                        >
                          <Lightbulb style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                      {drillPath[levelIdx] != null && (
                        <button
                          type="button"
                          onClick={() => handleClearFilter(levelIdx)}
                          className="p-1 rounded hover:bg-black/10"
                          style={{ color: mutedColor }}
                          title={`Clear ${level.dim}`}
                        >
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Breakdown list */}
                  <div
                    className="flex flex-col flex-1 rounded-b-lg border border-t-0"
                    style={{
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                    }}
                  >
                    {visibleNodes.map((node) => {
                      const isSelected = node.isSelected;
                      return (
                        <button
                          key={String(node.name)}
                          type="button"
                          onClick={() => handleDrillDown(levelIdx, node.name === '(Blank)' ? null : node.name)}
                          className="text-left w-full px-3 py-2.5 transition-all hover:opacity-95 border-b last:border-b-0"
                          style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                            backgroundColor: isSelected ? (isDark ? 'rgba(17,141,255,0.18)' : 'rgba(17,141,255,0.1)') : 'transparent',
                          }}
                          title={`Drill into ${node.name}`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className="text-base truncate font-medium"
                              style={{ color: isDark ? '#e2e8f0' : '#0f172a', fontWeight: isSelected ? 600 : 400 }}
                            >
                              {node.name}
                            </span>
                            <span
                              className="text-base font-semibold shrink-0"
                              style={{ color: isSelected ? primaryColor : mutedColor }}
                            >
                              {formatVal(node.value)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: barTrack }}>
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${node.pct}%`,
                                backgroundColor: isSelected ? primaryColor : (isDark ? '#64748b' : '#94a3b8'),
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}

                    {/* Show more / expand */}
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(levelIdx)}
                        className="flex items-center justify-center gap-1 py-2 text-sm font-medium border-t"
                        style={{ color: mutedColor, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                      >
                        <ChevronDown
                          style={{
                            width: 14,
                            height: 14,
                            transform: expanded ? 'rotate(180deg)' : undefined,
                            transition: 'transform 0.2s',
                          }}
                        />
                        {expanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PowerBICombo({
  data,
  xKey,
  yKey,
  lineKey,
  mode,
  id,
  animations = false,
}: {
  data: unknown[];
  xKey?: string;
  yKey?: string;
  lineKey?: string;
  mode: ThemeMode;
  id: string;
  animations?: boolean;
}) {
  const barColor = PBI_COLORS[0];
  const barColor2 = mode === 'dark' ? '#0b5cab' : '#0b6bd6';
  const lineColor = PBI_COLORS[2];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data as any[]} margin={{ top: 12, right: 10, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id={`pbi-combo-bar-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={barColor} stopOpacity={0.95} />
            <stop offset="100%" stopColor={barColor2} stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid {...commonGridProps(mode)} />
        <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
        <YAxis {...commonAxisProps(mode)} />
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        <Bar
          dataKey={yKey}
          fill={`url(#pbi-combo-bar-${id})`}
          radius={[8, 8, 4, 4]}
          isAnimationActive={animations}
          animationDuration={animations ? 300 : 0}
          animationEasing="ease-out"
          cursor="pointer"
          activeBar={animations ? { stroke: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.12)', strokeWidth: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' } : undefined}
        />
        <Line
          type="monotone"
          dataKey={lineKey || yKey}
          stroke={lineColor}
          strokeWidth={2.5}
          dot={{ r: 4, fill: lineColor }}
          activeDot={{ r: 6 }}
          isAnimationActive={animations}
          animationDuration={animations ? 400 : 0}
          animationEasing="ease-out"
          strokeLinecap="round"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

