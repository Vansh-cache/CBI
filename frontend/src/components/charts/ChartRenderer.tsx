/**
 * Unified ChartRenderer — Power BI–like standard chart system.
 * Accepts chartType + config + dataset; dynamically renders the correct chart from registry.
 * All charts support resize (parent), theme/colors, and dynamic data binding.
 */

import React from 'react';
import { aggregate, buildAggregatedSeries, getPieDonutData, inferIsNumericField } from '../../lib/widgetDataUtils';
import { getChartMeta } from '../../lib/chartRegistry';
import {
  PowerBIArea,
  PowerBIBar,
  PowerBIBubble,
  PowerBICombo,
  PowerBIDecompositionTree,
  PowerBIFunnel,
  PowerBILine,
  PowerBIPie,
  PowerBIScatter,
  PowerBIStackedBar,
  PowerBITreemap,
  PowerBIWaterfall
} from '../shared/powerbiCharts';

/** Widget-like config. Supports all registry chart types + legacy 'filter'. */
export type AggregationType = 'count' | 'countDistinct' | 'sum' | 'first' | 'last' | 'percentage' | 'avg' | 'min' | 'max' | 'none';

export interface ChartWidgetConfig {
  id: string;
  type: string;
  title?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  aggregation?: AggregationType;
  field?: string;
  xAxis?: string;
  yAxis?: string;
  legend?: string;
  filterField?: string;
  selectedFilters?: string[];
  datasetId?: number;
  accentColor?: string;
  valueFormat?: string;
  slicerStyle?: 'dropdown' | 'tile' | 'list';
  dimensions?: string[];
  /** Power BI-style: measure refs for values */
  measures?: string[];
  /** Multiple columns per bucket */
  xAxisFields?: string[];
  yAxisFields?: string[];
  legendFields?: string[];
  /** Per-field aggregations */
  xAxisAggregation?: AggregationType;
  yAxisAggregation?: AggregationType;
  legendAggregation?: AggregationType;
  fieldAggregation?: AggregationType;
}

export type ChartRendererOptions = {
  mode?: 'light' | 'dark';
  /** When rendering a Slicer, call this on option click. Builder uses it to update selectedFilters + slicerFilters. */
  onSlicerChange?: (value: string, selected: boolean) => void;
  /** Power BI-style: when user clicks a data point (bar, pie slice, etc.), apply cross-filter. */
  onDataPointClick?: (field: string, value: unknown) => void;
  /** Enable chart animations (e.g. in user portal). Set false in builder for snappy editing. */
  animations?: boolean;
  /** Mobile responsive mode - scales fonts down */
  isMobile?: boolean;
};

/**
 * Format number using Indian notation (K, L, Cr) for compact display
 * K = Thousands (1,000)
 * L = Lakhs (1,00,000 = 100,000)
 * Cr = Crores (1,00,00,000 = 10,000,000)
 */
function formatIndianCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 10000000) {
    // Crores (1 Cr = 10,000,000)
    const cr = absValue / 10000000;
    return sign + (cr >= 100 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, '')) + ' Cr';
  } else if (absValue >= 100000) {
    // Lakhs (1 L = 100,000)
    const lakh = absValue / 100000;
    return sign + (lakh >= 100 ? lakh.toFixed(0) : lakh.toFixed(2).replace(/\.?0+$/, '')) + ' L';
  } else if (absValue >= 1000) {
    // Thousands
    const k = absValue / 1000;
    return sign + (k >= 100 ? k.toFixed(0) : k.toFixed(2).replace(/\.?0+$/, '')) + ' K';
  }
  return sign + absValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * Format number with Indian currency prefix (₹) and compact notation
 */
function formatIndianCurrencyCompact(value: number): string {
  return '₹' + formatIndianCompact(value);
}

function formatValue(value: number, format?: string): string {
  if (format === 'currency') return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
  if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (format === 'decimal') return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function getCardValue(config: ChartWidgetConfig, data: unknown[], useCompact: boolean = true): string {
  const aggregation = config.fieldAggregation || config.yAxisAggregation || config.aggregation || 'count';
  // Check for field from various sources (field, yAxis for Values well)
  const field = config.field || config.yAxis;
  const format = config.valueFormat;
  if (data.length === 0) return '0';
  let value: number;
  // Helper to check if a value is valid (not null, undefined, or empty string)
  const hasValue = (val: unknown): boolean => val !== null && val !== undefined && val !== '';
  
  // Helper to format the final value with compact notation if needed
  const formatFinal = (val: number): string => {
    if (format === 'percent') return formatValue(val, format);
    if (format === 'currency') return useCompact ? formatIndianCurrencyCompact(val) : formatValue(val, format);
    if (useCompact && Math.abs(val) >= 1000) return formatIndianCompact(val);
    return formatValue(val, format);
  };

  switch (aggregation) {
    case 'count': {
      // Count rows that have a value in the selected field (exclude null/undefined/empty)
      if (field) {
        value = (data as any[]).filter(item => hasValue(item[field])).length;
      } else {
        // No field selected - count all rows
        value = (data as any[]).length;
      }
      return format === 'percent' ? formatValue(value / Math.max(1, value), format) : (useCompact && value >= 1000 ? formatIndianCompact(value) : value.toLocaleString());
    }
    case 'countDistinct': {
      // Count DISTINCT values in the selected field (exclude null/undefined/empty)
      if (field) {
        const validValues = (data as any[]).filter(item => hasValue(item[field])).map(item => item[field]);
        const uniqueValues = new Set(validValues);
        value = uniqueValues.size;
      } else {
        // No field selected - count all rows
        value = (data as any[]).length;
      }
      return useCompact && value >= 1000 ? formatIndianCompact(value) : value.toLocaleString();
    }
    case 'sum': {
      if (!field) return data.length.toLocaleString();
      value = (data as any[]).reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
      return formatFinal(value);
    }
    case 'avg': {
      if (!field) return '0';
      const sum = (data as any[]).reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
      value = sum / data.length;
      return formatFinal(value);
    }
    case 'min': {
      if (!field) return '0';
      const vals = (data as any[]).map((r) => Number(r[field])).filter((n) => !isNaN(n));
      value = vals.length ? Math.min(...vals) : 0;
      return formatFinal(value);
    }
    case 'max': {
      if (!field) return '0';
      const vals = (data as any[]).map((r) => Number(r[field])).filter((n) => !isNaN(n));
      value = vals.length ? Math.max(...vals) : 0;
      return formatFinal(value);
    }
    case 'first': {
      const val = (data[0] as any)?.[field ?? ''];
      const num = Number(val);
      if (!isNaN(num) && val !== '' && val !== null) return formatFinal(num);
      return String(val ?? '0');
    }
    case 'last': {
      const val = (data[data.length - 1] as any)?.[field ?? ''];
      const num = Number(val);
      if (!isNaN(num) && val !== '' && val !== null) return formatFinal(num);
      return String(val ?? '0');
    }
    case 'percentage': {
      if (!field) return '0';
      const total = (data as any[]).reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
      return `${(total / Math.max(1, data.length) * 100).toFixed(1)}%`;
    }
    case 'none': {
      // No aggregation - just show first value
      if (field) {
        const val = (data[0] as any)?.[field];
        const num = Number(val);
        if (!isNaN(num) && val !== '' && val !== null) return formatFinal(num);
        return String(val ?? '0');
      }
      return useCompact && data.length >= 1000 ? formatIndianCompact(data.length) : data.length.toLocaleString();
    }
    default:
      return useCompact && data.length >= 1000 ? formatIndianCompact(data.length) : data.length.toLocaleString();
  }
}

function PlaceholderChart({ label, mode }: { label: string; mode: 'light' | 'dark' }) {
  const isDark = mode === 'dark';
  return (
    <div className="flex flex-col items-center justify-center h-full text-base" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
      <p className="font-medium mb-1">{label}</p>
      <p className="text-sm opacity-75">Coming soon</p>
    </div>
  );
}

/** Decomposition Tree: rule-based drilldown placeholder. Supports dynamic dimension expansion. */
function DecompositionTreePlaceholder({ config, mode }: { config: ChartWidgetConfig; mode: 'light' | 'dark' }) {
  const isDark = mode === 'dark';
  const cat = config.xAxis || config.legend || 'Category';
  const val = config.yAxis || config.field || 'Value';
  return (
    <div className="h-full flex flex-col p-4 text-base" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
      <p className="font-medium mb-2 opacity-90">Decomposition Tree</p>
      <p className="text-sm mb-3" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
        Rule-based drilldown • Drag <strong>{cat}</strong> and <strong>{val}</strong> in Fields
      </p>
      <div className="flex-1 rounded-lg border flex items-center justify-center" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>
        <p className="text-sm" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Configure category + value, then use drill-down</p>
      </div>
    </div>
  );
}

/** Key Influencers: ML-ready placeholder. Renders a ranked influencer list. */
function KeyInfluencersPlaceholder({ mode }: { mode: 'light' | 'dark' }) {
  const isDark = mode === 'dark';
  const mock = [
    { rank: 1, factor: 'Region', impact: '+12.4%' },
    { rank: 2, factor: 'Product', impact: '+8.1%' },
    { rank: 3, factor: 'Segment', impact: '-3.2%' },
  ];
  return (
    <div className="h-full flex flex-col p-4 text-base" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
      <p className="font-medium mb-2 opacity-90">Key Influencers</p>
      <p className="text-sm mb-3" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
        ML-ready • Backend placeholder
      </p>
      <div className="space-y-2">
        {mock.map(({ rank, factor, impact }) => (
          <div
            key={rank}
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}
          >
            <span className="font-medium">{rank}. {factor}</span>
            <span style={{ color: impact.startsWith('+') ? '#22c55e' : '#ef4444' }}>{impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartRenderer(
  config: ChartWidgetConfig,
  rawData: unknown[],
  options?: ChartRendererOptions
): React.ReactElement {
  const mode = options?.mode ?? 'light';
  const isDark = mode === 'dark';
  const onSlicerChange = options?.onSlicerChange;
  const onDataPointClick = options?.onDataPointClick;
  const animations = options?.animations ?? false;
  const isMobile = options?.isMobile ?? false;
  const xAxisField = config.xAxis;
  const handleBarClick = onDataPointClick && xAxisField ? (data: any) => onDataPointClick(xAxisField, data?.[xAxisField]) : undefined;
  const pieCategoryField = config.xAxis || config.legend;
  const handlePieClick = onDataPointClick && pieCategoryField ? (data: { name: string; value: number }) => onDataPointClick(pieCategoryField, data?.name) : undefined;
  const widgetLike = {
    xAxis: config.xAxis,
    yAxis: config.yAxis,
    legend: config.legend,
    field: config.field,
    aggregation: config.aggregation,
    dimensions: config.dimensions,
    measures: config.measures,
    // Per-field aggregations
    xAxisAggregation: config.xAxisAggregation,
    yAxisAggregation: config.yAxisAggregation,
    legendAggregation: config.legendAggregation,
    fieldAggregation: config.fieldAggregation,
  };

  const emptyMessage = (
    <div className="flex items-center justify-center h-full text-base" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
      {config.datasetId ? 'No data available' : 'Select a data source and assign columns'}
    </div>
  );

  if (rawData.length === 0) return emptyMessage;

  const chartType = config.type === 'filter' ? 'slicer' : config.type;
  const meta = getChartMeta(chartType);

  switch (chartType) {
    case 'bar':
    case 'column':
    case 'stacked-bar':
    case 'stacked-column':
    case '100-stacked-bar':
    case '100-stacked-column': {
      // Require X-axis and Values to avoid rendering raw data with all columns (causes page freeze)
      const hasAxis = !!(config.xAxis || config.xAxisFields?.[0] || config.dimensions?.[0]);
      const hasValues = !!(config.yAxis || config.field || config.yAxisFields?.length || config.measures?.[0] || config.dimensions?.[1]);
      if (!hasAxis || !hasValues) return emptyMessage;

      const series = buildAggregatedSeries(rawData, widgetLike);
      if (series.length === 0) return emptyMessage;

      const isHorizontal = chartType === 'bar' || chartType === 'stacked-bar' || chartType === '100-stacked-bar';
      const layout = isHorizontal ? 'vertical' : 'horizontal';

      const isStacked = chartType === 'stacked-bar' || chartType === 'stacked-column' ||
        chartType === '100-stacked-bar' || chartType === '100-stacked-column' || !!config.legend;

      if (isStacked) {
        const firstRow = series[0] as any;
        const xKeyVal = config.xAxisFields?.[0] ?? config.xAxis ?? '';
        const keys = Object.keys(firstRow || {}).filter((k) => k !== xKeyVal && k !== 'undefined');

        if (keys.length > 0) {
          return (
            <PowerBIStackedBar
              id={config.id}
              data={series}
              xKey={config.xAxis}
              stackKeys={keys}
              mode={mode}
              layout={layout}
              onBarClick={handleBarClick}
              accentColor={config.accentColor}
              animations={animations}
            />
          );
        }
      }

      return (
        <PowerBIBar
          data={series}
          xKey={config.xAxis}
          yKey={config.yAxis || config.field}
          mode={mode}
          id={config.id}
          layout={layout}
          onBarClick={handleBarClick}
          accentColor={config.accentColor}
          animations={animations}
        />
      );
    }
    case 'line': {
      if (!(config.xAxis || config.dimensions?.[0]) || !(config.yAxis || config.field || config.measures?.[0])) return emptyMessage;
      const series = buildAggregatedSeries(rawData, widgetLike);
      if (series.length === 0) return emptyMessage;
      return (
        <PowerBILine
          data={series}
          xKey={config.xAxis}
          yKey={config.yAxis || config.field}
          mode={mode}
          accentColor={config.accentColor}
          animations={animations}
        />
      );
    }
    case 'area':
    case 'stacked-area': {
      if (!(config.xAxis || config.dimensions?.[0]) || !(config.yAxis || config.field || config.measures?.[0])) return emptyMessage;
      const series = buildAggregatedSeries(rawData, widgetLike);
      if (series.length === 0) return emptyMessage;
      return (
        <PowerBIArea
          data={series}
          xKey={config.xAxis}
          yKey={config.yAxis || config.field}
          mode={mode}
          id={config.id}
          accentColor={config.accentColor}
          animations={animations}
        />
      );
    }
    case 'line-clustered':
    case 'line-stacked':
    case 'ribbon': {
      // Combo-style charts: render as combo (line + bar)
      if (!(config.xAxis || config.dimensions?.[0]) || !(config.yAxis || config.field || config.measures?.[0])) return emptyMessage;
      const series = buildAggregatedSeries(rawData, widgetLike);
      if (series.length === 0) return emptyMessage;
      return (
        <PowerBICombo
          data={series}
          xKey={config.xAxis}
          yKey={config.yAxis || config.field}
          lineKey={config.legend}
          mode={mode}
          id={config.id}
          animations={animations}
        />
      );
    }
    case 'pie': {
      const data = getPieDonutData(rawData, widgetLike);
      if (data.length === 0) return emptyMessage;
      return <PowerBIPie id={config.id} data={data} nameKey="name" valueKey="value" mode={mode} onSliceClick={handlePieClick} accentColor={config.accentColor} animations={animations} />;
    }
    case 'donut': {
      const data = getPieDonutData(rawData, widgetLike);
      if (data.length === 0) return emptyMessage;
      return <PowerBIPie id={config.id} data={data} nameKey="name" valueKey="value" mode={mode} donut onSliceClick={handlePieClick} accentColor={config.accentColor} animations={animations} />;
    }
    case 'treemap': {
      const aggregated = buildAggregatedSeries(rawData, widgetLike);
      const xKey = config.xAxis || config.legend;
      const yKey = config.yAxis || config.field;
      const treemapData = xKey && yKey
        ? (aggregated as any[]).map((row, idx) => ({
          name: String(row?.[xKey] ?? `Item ${idx + 1}`),
          value: Number(row?.[yKey]) || 0,
        }))
        : [];
      if (treemapData.length === 0) return emptyMessage;
      return <PowerBITreemap id={config.id} data={treemapData} mode={mode} accentColor={config.accentColor} animations={animations} />;
    }
    case 'gauge': {
      const agg = (config.fieldAggregation || config.aggregation || 'sum') as AggregationType;
      let gaugeValue = 0;
      if (rawData.length > 0 && config.field) {
        const numeric = inferIsNumericField(rawData, config.field);
        const vals = (rawData as any[]).map((r) => (numeric ? Number(r[config.field!]) || 0 : 1));
        gaugeValue = aggregate(vals, agg as 'count' | 'countDistinct' | 'sum' | 'first' | 'last' | 'percentage' | 'avg' | 'min' | 'max' | 'none');
      }
      const arcPercent = Math.min(100, Math.max(0, gaugeValue));
      const trackStroke = isDark ? '#1f2937' : '#e5e7eb';
      const gaugeText = isDark ? '#e2e8f0' : '#111827';
      const gaugeMuted = isDark ? '#94a3b8' : '#6b7280';
      // Use compact notation for large numeric values
      let displayStr: string;
      if (config.valueFormat === 'percent') {
        displayStr = `${Math.round(gaugeValue)}%`;
      } else if (config.valueFormat === 'currency') {
        displayStr = formatIndianCurrencyCompact(gaugeValue);
      } else if (Math.abs(gaugeValue) >= 1000) {
        displayStr = formatIndianCompact(gaugeValue);
      } else {
        displayStr = formatValue(gaugeValue, config.valueFormat);
      }
      const gaugeAccent = config.accentColor || '#3b82f6';
      // Responsive gauge sizing
      const gaugeSize = isMobile ? 'w-20 h-20' : 'w-32 h-32';
      const gaugeFontSize = isMobile ? 'text-lg' : 'text-3xl';
      const labelFontSize = isMobile ? 'text-sm' : 'text-base';
      return (
        <div
          className="flex flex-col items-center justify-center h-full rounded-xl px-4 py-4"
          style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.1)' : '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div className={`relative ${gaugeSize}`}>
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke={trackStroke} strokeWidth="8" opacity={0.8} />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={gaugeAccent}
                strokeWidth="8"
                strokeDasharray={`${arcPercent * 2.64}, 264`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 700ms ease-out', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`${gaugeFontSize} font-bold`} style={{ color: gaugeText }}>{displayStr}</span>
            </div>
          </div>
          <p className={`mt-2 ${labelFontSize} font-medium`} style={{ color: gaugeMuted }}>{config.field || 'Value'}</p>
        </div>
      );
    }
    case 'card':
    case 'kpi': {
      const cardValue = getCardValue(config, rawData);
      const cardText = isDark ? '#f1f5f9' : '#111827';
      const accent = config.accentColor || '#118DFF';
      // Responsive font sizing: smaller on mobile to fit container
      const valueFontClass = isMobile ? 'text-xl' : 'text-5xl md:text-6xl';
      return (
        <div
          className="flex flex-col items-center justify-center h-full rounded-xl overflow-hidden"
          style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div className="w-full h-1.5 shrink-0 rounded-t-xl" style={{ backgroundColor: accent }} />
          <div className="flex-1 w-full flex flex-col items-center justify-center px-2 py-2 min-h-0">
            <p className={`${valueFontClass} font-bold tracking-tight text-center break-all`} style={{ color: cardText, lineHeight: 1.1, textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.2)' : 'none' }}>{cardValue}</p>
          </div>
        </div>
      );
    }
    case 'table':
    case 'matrix': {
      const firstRow = rawData[0] as any;
      const cols = Object.keys(firstRow || {});
      const thBg = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';
      const thColor = isDark ? '#94a3b8' : '#475569';
      const tdColor = isDark ? '#e2e8f0' : '#111827';
      const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
      // Responsive styling for mobile
      const cellPadding = isMobile ? 'px-2 py-1.5' : 'px-4 py-2.5';
      const fontSize = isMobile ? 'text-xs' : 'text-sm';
      return (
        <div className="h-full overflow-auto rounded-xl" style={{ border: `1px solid ${borderColor}`, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
          <table className={`w-full ${isMobile ? 'text-sm' : 'text-base'}`}>
            <thead className="sticky top-0">
              <tr>
                {cols.map((col) => (
                  <th key={col} className={`${cellPadding} text-left ${fontSize} font-semibold first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap`} style={{ backgroundColor: thBg, color: thColor }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rawData as any[]).map((row, idx) => (
                <tr
                  key={idx}
                  className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}
                  style={{ borderTop: idx === 0 ? 'none' : `1px solid ${borderColor}` }}
                >
                  {cols.map((col) => (
                    <td key={col} className={`${cellPadding} ${fontSize}`} style={{ color: tdColor }}>{String(row[col] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'slicer': {
      // Support both filterField and field for backward compatibility
      const filterField = config.filterField || config.field;
      if (!filterField) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-base" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
            <p className="font-medium mb-1">Slicer</p>
            <p className="text-sm opacity-75">Drag a field to the Field bucket</p>
          </div>
        );
      }
      const uniqueValues = Array.from(new Set((rawData as any[]).map((d) => d[filterField]))).filter(v => v !== null && v !== undefined);
      const filterHeaderColor = isDark ? '#94a3b8' : '#374151';
      const filterBtnBase = isDark
        ? { background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }
        : { background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' };
      const filterBtnSelected = isDark
        ? { background: '#0078d4', color: '#ffffff', border: '1px solid #106ebe' }
        : { background: '#0078d4', color: '#ffffff', border: '1px solid #106ebe' };
      const selectedFilters = config.selectedFilters ?? [];
      const slicerStyle = config.slicerStyle || 'list'; // Default to list

      // Dropdown style
      if (slicerStyle === 'dropdown') {
        return (
          <div className="h-full flex flex-col min-h-0">
            <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }}>
              <p className="text-sm font-semibold truncate mb-2" style={{ color: filterHeaderColor }}>{filterField}</p>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    ...filterBtnBase,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  value={selectedFilters[0] || ''}
                  onChange={(e) => {
                    if (e.target.value && onSlicerChange) {
                      // Clear previous selection and select new one
                      selectedFilters.forEach(f => onSlicerChange(f, false));
                      onSlicerChange(e.target.value, true);
                    }
                  }}
                >
                  <option value="">Select a value...</option>
                  {uniqueValues.map((value, index) => (
                    <option key={index} value={String(value)}>
                      {String(value)}
                    </option>
                  ))}
                </select>
                {selectedFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSlicerChange) {
                        selectedFilters.forEach(f => onSlicerChange(f, false));
                      }
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                    style={{
                      ...filterBtnBase,
                      cursor: 'pointer',
                      minWidth: '60px',
                    }}
                    title="Clear filter"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Tile style
      if (slicerStyle === 'tile') {
        return (
          <div className="h-full flex flex-col min-h-0">
            <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }}>
              <p className="text-sm font-semibold truncate" style={{ color: filterHeaderColor }}>{filterField}</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3">
              {uniqueValues.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {uniqueValues.map((value, index) => {
                    const isSelected = selectedFilters.includes(String(value));
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onSlicerChange?.(String(value), !isSelected)}
                        className="text-center px-3 py-3 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
                        style={isSelected ? filterBtnSelected : filterBtnBase}
                        title={String(value)}
                      >
                        <div className="truncate">{String(value)}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-sm py-6" style={{ color: isDark ? '#64748b' : '#6b7280' }}>
                  <p>No values available</p>
                  <p className="text-xs mt-1 opacity-75">Check your data source</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // List style (default)
      return (
        <div className="h-full flex flex-col min-h-0">
          <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }}>
            <p className="text-sm font-semibold truncate" style={{ color: filterHeaderColor }}>{filterField}</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3">
            {uniqueValues.length > 0 ? (
              <div className="space-y-2">
                {uniqueValues.map((value, index) => {
                  const isSelected = selectedFilters.includes(String(value));
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onSlicerChange?.(String(value), !isSelected)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all truncate hover:shadow-sm"
                      style={isSelected ? filterBtnSelected : filterBtnBase}
                      title={String(value)}
                    >
                      {String(value)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-sm py-6" style={{ color: isDark ? '#64748b' : '#6b7280' }}>
                <p>No values available</p>
                <p className="text-xs mt-1 opacity-75">Check your data source</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    case 'scatter': {
      const series = buildAggregatedSeries(rawData, widgetLike);
      if (series.length === 0) return emptyMessage;
      return (
        <PowerBIScatter
          data={series}
          xKey={config.xAxis}
          yKey={config.yAxis || config.field}
          mode={mode}
          animations={animations}
        />
      );
    }
    case 'bubble': {
      const series = buildAggregatedSeries(rawData, widgetLike);
      if (series.length === 0) return emptyMessage;
      return (
        <PowerBIBubble
          data={series}
          xKey={config.xAxis}
          yKey={config.yAxis || config.field}
          zKey={config.legend}
          mode={mode}
          animations={animations}
        />
      );
    }
    case 'waterfall': {
      const series = buildAggregatedSeries(rawData, widgetLike);
      if (series.length === 0) return emptyMessage;
      return (
        <PowerBIWaterfall
          data={series}
          xKey={config.xAxis}
          yKey={config.yAxis || config.field}
          mode={mode}
          animations={animations}
        />
      );
    }
    case 'funnel': {
      const data = getPieDonutData(rawData, widgetLike);
      if (data.length === 0) return emptyMessage;
      return (
        <PowerBIFunnel
          data={data}
          nameKey="name"
          valueKey="value"
          mode={mode}
        />
      );
    }
    case 'combo': {
      const series = buildAggregatedSeries(rawData, widgetLike);
      if (series.length === 0) return emptyMessage;
      return (
        <PowerBICombo
          data={series}
          xKey={config.xAxis}
          yKey={config.yAxis || config.field}
          lineKey={config.legend}
          mode={mode}
          id={config.id}
          animations={animations}
        />
      );
    }
    case 'map':
    case 'maps':
    case 'filled-map':
    case 'azure-map':
    case 'shape-map':
    case 'arcgis-map':
      return <PlaceholderChart label="Map Visual" mode={mode} />;
    case 'multi-row-card': {
      // Multi-row card: show multiple KPI-style rows
      const cardText = isDark ? '#f1f5f9' : '#111827';
      const cardMuted = isDark ? '#94a3b8' : '#6b7280';
      const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
      const displayRows = (rawData as any[]).slice(0, 5);
      const cols = Object.keys(displayRows[0] || {}).slice(0, 3);
      return (
        <div className="h-full overflow-auto p-2">
          {displayRows.map((row, idx) => (
            <div
              key={idx}
              className="p-3 mb-2 rounded-lg"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                border: `1px solid ${borderColor}`,
              }}
            >
              {cols.map((col) => (
                <div key={col} className="flex justify-between items-center py-1">
                  <span className="text-sm" style={{ color: cardMuted }}>{col}</span>
                  <span className="text-base font-medium" style={{ color: cardText }}>{String(row[col] ?? '-')}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    case 'r-visual':
      return <PlaceholderChart label="R Visual" mode={mode} />;
    case 'python-visual':
      return <PlaceholderChart label="Python Visual" mode={mode} />;
    case 'qa-visual':
      return <PlaceholderChart label="Q&A Visual" mode={mode} />;
    case 'smart-narrative': {
      // Smart narrative: auto-generated text summary
      const narrativeColor = isDark ? '#e2e8f0' : '#1e293b';
      const mutedColor = isDark ? '#94a3b8' : '#64748b';
      const rowCount = rawData.length;
      const cols = Object.keys((rawData[0] as any) || {});
      return (
        <div className="h-full p-4 overflow-auto" style={{ color: narrativeColor }}>
          <p className="text-base leading-relaxed">
            This dataset contains <strong>{rowCount.toLocaleString()}</strong> records across{' '}
            <strong>{cols.length}</strong> columns.
            {cols.length > 0 && (
              <> Key fields include: {cols.slice(0, 3).map((c, i) => (
                <span key={c}>
                  <strong>{c}</strong>{i < Math.min(cols.length, 3) - 1 ? ', ' : '.'}
                </span>
              ))}</>
            )}
          </p>
          <p className="text-sm mt-3" style={{ color: mutedColor }}>
            Configure fields to generate detailed insights.
          </p>
        </div>
      );
    }
    case 'paginated-report':
      return <PlaceholderChart label="Paginated Report" mode={mode} />;
    case 'power-apps':
      return <PlaceholderChart label="Power Apps" mode={mode} />;
    case 'power-automate':
      return <PlaceholderChart label="Power Automate" mode={mode} />;
    case 'decomposition-tree': {
      // Analyze = measures (array), Explain by = dimensions (yAxis, legend, dimensions)
      const measureFields = (config.measures?.length ? config.measures : (config.xAxis || config.field ? [config.xAxis || config.field] : [])) as string[];
      const dimensionFields = [config.yAxis, config.legend, ...(config.dimensions || [])].filter((f): f is string => !!f);
      if (measureFields.length === 0 || dimensionFields.length === 0) {
        return <DecompositionTreePlaceholder config={config} mode={mode} />;
      }
      const handleDecompClick = onDataPointClick && dimensionFields.length
        ? (field: string, value: unknown) => onDataPointClick(field, value)
        : undefined;
      return (
        <PowerBIDecompositionTree
          data={rawData}
          measureFields={measureFields}
          dimensionFields={dimensionFields}
          aggregation={(config.xAxisAggregation || config.yAxisAggregation || config.fieldAggregation || config.aggregation) as string || 'sum'}
          mode={mode}
          format={config.valueFormat}
          accentColor={config.accentColor}
          onNodeClick={handleDecompClick}
        />
      );
    }
    case 'key-influencers':
      return <KeyInfluencersPlaceholder mode={mode} />;
    default:
      if (meta) return <PlaceholderChart label={meta.label} mode={mode} />;
      return (
        <div className="flex items-center justify-center h-full text-base" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
          Unknown chart type
        </div>
      );
  }
}
