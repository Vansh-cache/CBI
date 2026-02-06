/**
 * Centralized chart registry — Power BI–like standard chart system.
 * All supported visuals are defined here. Used by ChartRenderer, DashboardBuilder, and WidgetRenderer.
 *
 * Extensibility: Add new chart types to CHART_REGISTRY and TYPE_TO_CHART, then implement
 * the corresponding case in ChartRenderer. Shared aggregation lives in widgetDataUtils.
 */

export type Aggregation = 'count' | 'sum' | 'first' | 'last' | 'percentage';

/** Field roles (Power BI–style buckets) */
export type FieldRole = 'axis' | 'values' | 'legend' | 'tooltips' | 'category' | 'field' | 'filter';

/** Chart type identifier. Matches widget.type for backward compatibility. */
export type ChartType =
  | 'bar'
  | 'column'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'table'
  | 'matrix'
  | 'card'
  | 'kpi'
  | 'slicer'
  | 'scatter'
  | 'bubble'
  | 'waterfall'
  | 'funnel'
  | 'treemap'
  | 'combo'
  | 'gauge'
  | 'maps'
  | 'decomposition-tree'
  | 'key-influencers'
  | 'stacked-bar';

export interface ChartMeta {
  chartType: ChartType;
  label: string;
  /** Required field roles for valid config */
  requiredFields: FieldRole[];
  /** Optional field roles */
  optionalFields: FieldRole[];
  supportedAggregations: Aggregation[];
  /** Extra config (e.g. stacked, donut). Stored on widget. */
  configSchema: Record<string, unknown>;
}

/** Registry: all supported charts. Single source of truth. */
export const CHART_REGISTRY: ChartMeta[] = [
  { chartType: 'bar', label: 'Bar', requiredFields: ['axis', 'values'], optionalFields: ['legend', 'tooltips'], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: {} },
  { chartType: 'column', label: 'Column', requiredFields: ['axis', 'values'], optionalFields: ['legend', 'tooltips'], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: {} },
  { chartType: 'stacked-bar', label: 'Stacked Bar', requiredFields: ['axis', 'values'], optionalFields: ['legend', 'tooltips'], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: { stacked: true } },
  { chartType: 'line', label: 'Line', requiredFields: ['axis', 'values'], optionalFields: ['legend', 'tooltips'], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: {} },
  { chartType: 'area', label: 'Area', requiredFields: ['axis', 'values'], optionalFields: ['legend', 'tooltips'], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: {} },
  { chartType: 'pie', label: 'Pie', requiredFields: ['category', 'values'], optionalFields: ['legend'], supportedAggregations: ['sum', 'count'], configSchema: {} },
  { chartType: 'donut', label: 'Donut', requiredFields: ['category', 'values'], optionalFields: ['legend'], supportedAggregations: ['sum', 'count'], configSchema: { donut: true } },
  { chartType: 'table', label: 'Table', requiredFields: [], optionalFields: ['axis', 'values', 'category'], supportedAggregations: [], configSchema: {} },
  { chartType: 'matrix', label: 'Matrix', requiredFields: [], optionalFields: ['axis', 'values', 'legend', 'category'], supportedAggregations: ['sum', 'count'], configSchema: {} },
  { chartType: 'card', label: 'Card', requiredFields: ['field'], optionalFields: [], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: {} },
  { chartType: 'kpi', label: 'KPI', requiredFields: ['field'], optionalFields: [], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: {} },
  { chartType: 'slicer', label: 'Slicer', requiredFields: ['filter'], optionalFields: [], supportedAggregations: [], configSchema: {} },
  { chartType: 'scatter', label: 'Scatter', requiredFields: ['axis', 'values'], optionalFields: ['legend', 'tooltips'], supportedAggregations: ['sum', 'count', 'first', 'last'], configSchema: {} },
  { chartType: 'bubble', label: 'Bubble', requiredFields: ['axis', 'values'], optionalFields: ['legend', 'tooltips'], supportedAggregations: ['sum', 'count', 'first', 'last'], configSchema: {} },
  { chartType: 'waterfall', label: 'Waterfall', requiredFields: ['axis', 'values'], optionalFields: ['legend'], supportedAggregations: ['sum', 'first', 'last'], configSchema: {} },
  { chartType: 'funnel', label: 'Funnel', requiredFields: ['category', 'values'], optionalFields: ['legend'], supportedAggregations: ['sum', 'count'], configSchema: {} },
  { chartType: 'treemap', label: 'Treemap', requiredFields: ['category', 'values'], optionalFields: ['legend'], supportedAggregations: ['sum', 'count'], configSchema: {} },
  { chartType: 'combo', label: 'Combo (Line + Column)', requiredFields: ['axis', 'values'], optionalFields: ['legend', 'tooltips'], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: {} },
  { chartType: 'gauge', label: 'Gauge', requiredFields: ['field'], optionalFields: [], supportedAggregations: ['sum', 'count', 'first', 'last', 'percentage'], configSchema: {} },
  { chartType: 'maps', label: 'Maps', requiredFields: ['category'], optionalFields: ['values', 'legend'], supportedAggregations: ['sum', 'count'], configSchema: {} },
  { chartType: 'decomposition-tree', label: 'Decomposition Tree', requiredFields: ['category', 'values'], optionalFields: ['legend'], supportedAggregations: ['sum', 'count'], configSchema: {} },
  { chartType: 'key-influencers', label: 'Key Influencers', requiredFields: ['field', 'values'], optionalFields: ['category'], supportedAggregations: ['sum', 'count'], configSchema: {} },
];

const metaByType = new Map<ChartType, ChartMeta>();
CHART_REGISTRY.forEach((m) => metaByType.set(m.chartType, m));

/** Legacy widget "type" (filter) maps to slicer in registry. Aliases map to a canonical type for validation. */
const TYPE_TO_CHART: Record<string, ChartType> = {
  bar: 'bar',
  'stacked-bar': 'stacked-bar',
  '100-stacked-bar': 'stacked-bar',
  column: 'column',
  'stacked-column': 'column',
  '100-stacked-column': 'column',
  line: 'line',
  area: 'area',
  'stacked-area': 'area',
  'line-clustered': 'combo',
  'line-stacked': 'combo',
  ribbon: 'area',
  pie: 'pie',
  donut: 'donut',
  table: 'table',
  matrix: 'matrix',
  card: 'card',
  kpi: 'kpi',
  filter: 'slicer',
  slicer: 'slicer',
  scatter: 'scatter',
  bubble: 'bubble',
  waterfall: 'waterfall',
  funnel: 'funnel',
  treemap: 'treemap',
  combo: 'combo',
  gauge: 'gauge',
  map: 'maps',
  maps: 'maps',
  'filled-map': 'maps',
  'azure-map': 'maps',
  'shape-map': 'maps',
  'arcgis-map': 'maps',
  'decomposition-tree': 'decomposition-tree',
  'key-influencers': 'key-influencers',
};

export function getChartMeta(chartTypeOrLegacyType: string): ChartMeta | undefined {
  const t = TYPE_TO_CHART[chartTypeOrLegacyType] ?? (chartTypeOrLegacyType as ChartType);
  return metaByType.get(t);
}

export function getAllChartTypes(): ChartMeta[] {
  return CHART_REGISTRY;
}

/** Map widget field names (xAxis, yAxis, etc.) to FieldRole. */
export function widgetFieldToRole(
  key: 'xAxis' | 'yAxis' | 'legend' | 'field' | 'filterField'
): FieldRole {
  const map: Record<string, FieldRole> = {
    xAxis: 'axis',
    yAxis: 'values',
    legend: 'legend',
    field: 'field',
    filterField: 'filter',
  };
  return map[key] ?? 'category';
}

/**
 * Validate widget config against chart meta.
 * Returns list of validation errors (missing required fields, etc.).
 */
export function validateChartConfig(
  chartType: string,
  config: { xAxis?: string; yAxis?: string; legend?: string; field?: string; filterField?: string; measures?: string[]; dimensions?: string[] }
): string[] {
  const meta = getChartMeta(chartType);
  if (!meta) return [`Unknown chart type: ${chartType}`];
  const errors: string[] = [];

  const hasAxis = !!(config.xAxis || config.legend);
  const hasValues = !!(config.yAxis || config.field);
  const hasCategory = !!(config.xAxis || config.legend);
  const hasField = !!config.field;
  const hasFilter = !!config.filterField;
  const hasMeasures = !!(config.measures?.length);
  const hasDimensions = !!(config.dimensions?.length || config.yAxis || config.legend);

  if (meta.requiredFields.includes('axis') && !hasAxis && !hasMeasures) errors.push('Axis (X-axis or Legend) or Analyze (measures) is required.');
  if (meta.requiredFields.includes('values') && !hasValues && !hasDimensions) errors.push('Values (Y-axis or Field) or Explain by (dimensions) is required.');
  if (meta.requiredFields.includes('category') && !hasCategory) errors.push('Category (X-axis or Legend) is required.');
  if (meta.requiredFields.includes('field') && !hasField) errors.push('Field is required.');
  if (meta.requiredFields.includes('filter') && !hasFilter) errors.push('Filter field is required.');

  return errors;
}

/** Chart types to show in the builder's visualization panel. Excludes aliases. */
export const BUILDER_CHART_TYPES: ChartType[] = [
  'bar',
  'stacked-bar',
  'column',
  'line',
  'area',
  'pie',
  'donut',
  'table',
  'matrix',
  'card',
  'kpi',
  'slicer',
  'scatter',
  'bubble',
  'waterfall',
  'funnel',
  'treemap',
  'combo',
  'gauge',
  'maps',
  'decomposition-tree',
  'key-influencers',
];
