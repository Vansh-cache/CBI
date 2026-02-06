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
import { ChevronRight, ChevronDown, RotateCcw, Plus, X } from 'lucide-react';

const PBI_COLORS = [
  '#118DFF', // Power BI-ish blue
  '#12239E',
  '#E66C37',
  '#6B007B',
  '#00B7C3',
  '#744EC2',
  '#D64550',
  '#7FBA00',
  '#FFB900',
  '#4C78A8',
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
    // PowerBI uses subtle gridlines and neutral typography.
    grid: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(107, 114, 128, 0.20)',
    axis: isDark ? 'rgba(226, 232, 240, 0.72)' : 'rgba(55, 65, 81, 0.78)',
    tick: isDark ? 'rgba(226, 232, 240, 0.78)' : 'rgba(55, 65, 81, 0.86)',
    legend: isDark ? 'rgba(226, 232, 240, 0.82)' : 'rgba(17, 24, 39, 0.80)',
    tooltipBg: isDark ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    tooltipBorder: isDark ? 'rgba(55, 65, 81, 1)' : 'rgba(229, 231, 235, 1)',
    tooltipText: isDark ? '#f9fafb' : '#111827',
    fontSize: 13,
  };
}

const tooltipContentStyle = { transition: 'opacity 0.2s ease, transform 0.2s ease' };

export function PowerBITooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean;
  payload?: any[];
  label?: unknown;
  mode: ThemeMode;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const t = getChartTokens(mode);
  return (
    <div
      className="rounded-lg border-2 px-4 py-3 shadow-xl"
      style={{
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        color: t.tooltipText,
        backdropFilter: 'blur(10px)',
        ...tooltipContentStyle,
      }}
    >
      {label !== undefined && label !== null && (
        <div className="text-sm font-semibold mb-2 pb-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          {String(label)}
        </div>
      )}
      <div className="space-y-2">
        {payload.map((p: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-6 text-[13px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color || PBI_COLORS[0] }} />
              <span className="truncate font-medium">
                {String(p.name ?? '')}
              </span>
            </div>
            <span className="font-bold">
              {typeof p.value === 'number' ? p.value.toLocaleString() : String(p.value ?? '')}
            </span>
          </div>
        ))}
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
    strokeDasharray: '2 4',
    vertical: false,
  } as const;
}

function commonLegendProps(mode: ThemeMode) {
  const t = getChartTokens(mode);
  return {
    verticalAlign: 'top' as const,
    align: 'left' as const,
    iconType: 'circle' as const,
    iconSize: 8,
    wrapperStyle: { fontSize: t.fontSize, color: t.legend, paddingBottom: 6 },
  };
}

const commonTooltipProps = {
  isAnimationActive: true,
  animationDuration: 200,
  animationEasing: 'ease-out' as const,
  cursor: { fill: 'rgba(0,0,0,0.04)', stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1 },
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
            <stop offset="0%" stopColor={barColor} stopOpacity={0.95} />
            <stop offset="100%" stopColor={barColor2} stopOpacity={0.85} />
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
        <Legend {...commonLegendProps(mode)} />
        <Bar
          dataKey={yKey}
          fill={`url(#pbi-bar-${id})`}
          radius={[8, 8, 0, 0]}
          isAnimationActive={animations}
          animationDuration={animations ? 300 : 0}
          animationEasing="ease-out"
          onClick={onBarClick}
          cursor="pointer"
          activeBar={animations ? { stroke: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.12)', strokeWidth: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' } : undefined}
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
        <Legend {...commonLegendProps(mode)} />
        {stackKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={`url(#pbi-stacked-${id}-${index})`}
            isAnimationActive={animations}
            animationDuration={animations ? 300 : 0}
            animationEasing="ease-out"
            radius={index === stackKeys.length - 1 ? (layout === 'horizontal' ? [8, 8, 0, 0] : [0, 8, 8, 0]) : [0, 0, 0, 0]}
            onClick={onBarClick}
            cursor="pointer"
            activeBar={animations ? { stroke: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.12)', strokeWidth: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' } : undefined}
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
        <Legend {...commonLegendProps(mode)} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={strokeColor}
          strokeWidth={2.5}
          dot={false}
          activeDot={animations ? { r: 6, fill: strokeColor, stroke: mode === 'dark' ? '#fff' : '#1e293b', strokeWidth: 2, style: { transition: 'all 0.2s ease' } } : { r: 4 }}
          isAnimationActive={animations}
          animationDuration={animations ? 400 : 0}
          animationEasing="ease-out"
          strokeLinecap="round"
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
            <stop offset="0%" stopColor={fillTop} stopOpacity={0.40} />
            <stop offset="100%" stopColor={fillTop} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...commonGridProps(mode)} />
        <XAxis dataKey={xKey} {...commonAxisProps(mode)} />
        <YAxis {...commonAxisProps(mode)} />
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} />
        <Legend {...commonLegendProps(mode)} />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={fillTop}
          strokeWidth={2.25}
          fill={`url(#pbi-area-${id})`}
          isAnimationActive={animations}
          animationDuration={animations ? 400 : 0}
          animationEasing="ease-out"
          activeDot={animations ? { r: 5, fill: fillTop, stroke: mode === 'dark' ? '#fff' : '#1e293b', strokeWidth: 2 } : undefined}
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
        <Tooltip content={(p) => <PowerBITooltip {...(p as any)} mode={mode} />} {...commonTooltipProps} cursor={false} />
        <Legend {...commonLegendProps(mode)} />
        <Pie
          data={data}
          nameKey={nameKey}
          dataKey={valueKey}
          cx="50%"
          cy="52%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={0}
          cornerRadius={8}
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
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))', transition: 'all 0.2s ease' }}
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
        <Legend {...commonLegendProps(mode)} />
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
        <Legend {...commonLegendProps(mode)} />
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
        <Legend {...commonLegendProps(mode)} />
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
                <span className="text-sm font-medium truncate">{name}</span>
                <span className="text-sm font-bold ml-2">{value.toLocaleString()}</span>
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

  const isDark = mode === 'dark';
  const t = getChartTokens(mode);
  const primaryColor = accentColor || PBI_COLORS[5];
  const measureLabel = measureFields[0] || 'Value';

  const formatVal = (v: number) => {
    if (format === 'currency') return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
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
    const levels: { dim: string; nodes: { name: string; value: number; values: number[]; isSelected: boolean }[] }[] = [];
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

  const barTrack = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ color: t.legend, backgroundColor: isDark ? '#1e293b' : '#ffffff' }}>
      {/* Filter headers */}
      <div className="flex flex-wrap items-center gap-2 p-2 shrink-0" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
        {drillPath.map((step, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{step.dim}:</span>
            <span className="font-semibold truncate max-w-[100px]">{String(step.value ?? '(Blank)')}</span>
            <button
              type="button"
              onClick={() => handleClearFilter(i)}
              className="p-0.5 rounded hover:bg-black/10 flex-shrink-0"
              title={`Clear ${step.dim}`}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          </div>
        ))}
      </div>

      {/* Horizontal tree */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="flex gap-6 items-stretch" style={{ minWidth: 'max-content' }}>
          {/* Level 0: Root */}
          <div className="flex flex-col justify-center shrink-0">
            <div
              className="px-4 py-2.5 rounded-lg min-w-[140px]"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <div className="text-xs font-medium mb-1.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {measureLabel}
              </div>
              <div className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
                {formatVal(rootValue)}
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: barTrack, width: 120 }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: '100%', backgroundColor: primaryColor }}
                />
              </div>
            </div>
          </div>

          {/* Level columns */}
          {treeLevels.map((level, levelIdx) => {
            const showLevel = levelIdx === 0 || drillPath.length >= levelIdx;
            if (!showLevel) return null;
            const canDrill = drillPath.length >= levelIdx;

            return (
              <div key={levelIdx} className="flex items-center shrink-0">
                <ChevronRight
                  style={{ width: 20, height: 20, opacity: 0.4, flexShrink: 0 }}
                />
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {level.dim}
                  </div>
                  {level.nodes.map((node) => {
                    const isSelected = node.isSelected;
                    const canClick = canDrill || (levelIdx < drillPath.length && isSelected && levelIdx === drillPath.length - 1);
                    const hasMore = levelIdx < dimensionFields.length - 1 && isSelected;

                    return (
                      <button
                        key={String(node.name)}
                        type="button"
                        onClick={() => canClick && handleDrillDown(levelIdx, node.name === '(Blank)' ? null : node.name)}
                        disabled={!canClick}
                        className="text-left px-3 py-2 rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-default"
                        style={{
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)')
                            : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
                          border: `1px solid ${isSelected ? primaryColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}`,
                        }}
                        title={canClick ? `Click to drill into ${node.name}` : undefined}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-sm truncate font-medium"
                            style={{ fontWeight: isSelected ? 600 : 400 }}
                          >
                            {String(node.name)}
                          </span>
                          {hasMore && dimensionFields.length > levelIdx + 1 && (
                            <Plus style={{ width: 12, height: 12, opacity: 0.6, flexShrink: 0 }} />
                          )}
                        </div>
                        <div className="text-sm font-bold mt-1" style={{ color: isSelected ? primaryColor : undefined }}>
                          {formatVal(node.value)}
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: barTrack }}>
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
                </div>
              </div>
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
        <Legend {...commonLegendProps(mode)} />
        <Bar
          dataKey={yKey}
          fill={`url(#pbi-combo-bar-${id})`}
          radius={[8, 8, 4, 4]}
          isAnimationActive={animations}
          animationDuration={animations ? 300 : 0}
          animationEasing="ease-out"
          cursor="pointer"
          activeBar={animations ? { stroke: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.12)', strokeWidth: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' } : undefined}
          animationEasing="ease-out"
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

