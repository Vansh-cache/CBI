/**
 * Widget renderer — thin wrapper around ChartRenderer.
 * Uses centralized chart registry. No chart-specific logic here.
 */

import { ChartRenderer, type ChartWidgetConfig } from '../charts/ChartRenderer';

export interface Widget {
  id: string;
  type: string;
  title: string;
  dataKey?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };

  // Legacy fields (for backward compatibility)
  aggregation?: 'count' | 'sum' | 'first' | 'last' | 'percentage' | 'avg' | 'min' | 'max';
  field?: string;
  xAxis?: string;
  yAxis?: string;
  legend?: string;
  filterField?: string;
  selectedFilters?: string[];

  // Power BI-style enhancements
  measures?: string[]; // Array of measure IDs
  dimensions?: string[]; // Array of dimension field names
  drillPathId?: string; // ID of drill path for this widget
  interactionMode?: 'filter' | 'highlight' | 'none'; // How this widget affects others
  allowDrillDown?: boolean; // Enable drill-down on this widget
  allowDrillThrough?: boolean; // Enable drill-through on this widget
  drillThroughTarget?: string; // Target widget ID for drill-through

  // Data source
  datasetId?: number;

  // Styling
  accentColor?: string;
  valueFormat?: string;
  showDataLabels?: boolean;
  showLegend?: boolean;
  showGridLines?: boolean;

  // Locked state (from alignment tools)
  locked?: boolean;
}

export type RenderWidgetOptions = {
  mode?: 'light' | 'dark';
  onSlicerChange?: (value: string, selected: boolean) => void;
  onDataPointClick?: (field: string, value: unknown) => void;
  animations?: boolean;
};

/** For card/KPI value from raw data. Used by builder and elsewhere. */
export function getCardValue(widget: Widget, data: unknown[]): string {
  const aggregation = widget.aggregation || 'count';
  if (!widget.field || data.length === 0) return '0';
  switch (aggregation) {
    case 'count':
      return data.length.toString();
    case 'sum':
      return (data as any[]).reduce((acc, item) => acc + (Number(item[widget.field!]) || 0), 0).toLocaleString();
    case 'avg': {
      const sum = (data as any[]).reduce((acc, item) => acc + (Number(item[widget.field!]) || 0), 0);
      return (sum / data.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    case 'min': {
      const values = (data as any[]).map(item => Number(item[widget.field!])).filter(v => !isNaN(v));
      return values.length > 0 ? Math.min(...values).toLocaleString() : '0';
    }
    case 'max': {
      const values = (data as any[]).map(item => Number(item[widget.field!])).filter(v => !isNaN(v));
      return values.length > 0 ? Math.max(...values).toLocaleString() : '0';
    }
    case 'first':
      return String((data[0] as any)?.[widget.field!] ?? '0');
    case 'last':
      return String((data[data.length - 1] as any)?.[widget.field!] ?? '0');
    case 'percentage': {
      const total = (data as any[]).reduce((acc, item) => acc + (Number(item[widget.field!]) || 0), 0);
      return `${((total / data.length) * 100).toFixed(1)}%`;
    }
    default:
      return '0';
  }
}

export function renderWidget(
  widget: Widget,
  widgetData: unknown[],
  options?: RenderWidgetOptions
) {
  const config: ChartWidgetConfig = {
    id: widget.id,
    type: widget.type,
    title: widget.title,
    position: widget.position,
    size: widget.size,
    aggregation: widget.aggregation,
    field: widget.field,
    xAxis: widget.xAxis,
    yAxis: widget.yAxis,
    legend: widget.legend,
    filterField: widget.filterField,
    selectedFilters: widget.selectedFilters,
    datasetId: widget.datasetId,
    accentColor: widget.accentColor,
    valueFormat: widget.valueFormat,
    dimensions: widget.dimensions,
    measures: widget.measures,
    xAxisAggregation: (widget as any).xAxisAggregation,
    yAxisAggregation: (widget as any).yAxisAggregation,
    legendAggregation: (widget as any).legendAggregation,
    fieldAggregation: (widget as any).fieldAggregation,
  };
  return ChartRenderer(config, widgetData, options);
}
