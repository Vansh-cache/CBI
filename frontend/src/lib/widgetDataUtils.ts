/**
 * Shared utilities for widget data: aggregation and chart-specific transforms.
 * Used by DashboardBuilder (preview) and WidgetRenderer (viewer) so charts look identical.
 */

export type Aggregation = 'count' | 'countDistinct' | 'sum' | 'first' | 'last' | 'percentage' | 'avg' | 'min' | 'max' | 'none';

export interface WidgetLike {
  xAxis?: string;
  yAxis?: string;
  legend?: string;
  field?: string;
  aggregation?: Aggregation;
  /** Power BI-style: dimension fields for grouping (axis, legend) */
  dimensions?: string[];
  /** Power BI-style: measure IDs or field names for values */
  measures?: string[];
  /** Per-field aggregations */
  xAxisAggregation?: Aggregation;
  yAxisAggregation?: Aggregation;
  legendAggregation?: Aggregation;
  fieldAggregation?: Aggregation;
}

/** Parse measure ref: "field" or "field::agg" or "dsId_field_agg" */
function parseMeasureRef(ref: string): { field: string; agg?: Aggregation } {
  if (ref.includes('::')) {
    const [field, agg] = ref.split('::');
    return { field, agg: agg as Aggregation };
  }
  const parts = ref.split('_');
  if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
    const agg = parts[parts.length - 1];
    const field = parts.slice(1, -1).join('_');
    return { field, agg: agg as Aggregation };
  }
  return { field: ref };
}

export function inferIsNumericField(rows: unknown[], field?: string): boolean {
  if (!field) return false;
  const sample = (rows as any[]).slice(0, 50);
  for (const r of sample) {
    const v = r?.[field];
    if (v === null || v === undefined || v === '') continue;
    if (typeof v === 'number') return true;
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) return true;
    return false;
  }
  return false;
}

export function aggregate(values: number[], agg?: Aggregation): number {
  if (values.length === 0) return 0;
  switch (agg) {
    case 'none':
      // For 'none', return the first value (no aggregation)
      return values[0] ?? 0;
    case 'count':
      return values.length;
    case 'countDistinct':
      // Count unique values
      return new Set(values).size;
    case 'first':
      return values[0] ?? 0;
    case 'last':
      return values[values.length - 1] ?? 0;
    case 'percentage': {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return avg;
    }
    case 'avg': {
      const sum = values.reduce((a, b) => a + b, 0);
      return sum / values.length;
    }
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'sum':
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

// Cache for memoizing aggregated series results
const aggregationCache = new WeakMap<unknown[], Map<string, unknown[]>>();

function getCacheKey(widget: WidgetLike): string {
  const dims = (widget as WidgetLike & { dimensions?: string[] }).dimensions;
  const meas = (widget as WidgetLike & { measures?: string[] }).measures;
  return `${widget.xAxis || ''}_${widget.yAxis || ''}_${widget.legend || ''}_${widget.field || ''}_${widget.aggregation || ''}_${widget.xAxisAggregation || ''}_${widget.yAxisAggregation || ''}_${widget.legendAggregation || ''}_${widget.fieldAggregation || ''}_${(dims || []).join(',')}_${(meas || []).join(',')}`;
}

/**
 * PowerBI-like grouping:
 * - If X-axis is set, group by X-axis and aggregate Values.
 * - If Legend is set, group by (X-axis, Legend) and spread to multiple series keys.
 */
export function buildAggregatedSeries(rows: unknown[], widget: WidgetLike): unknown[] {
  // Check cache first
  const cacheKey = getCacheKey(widget);
  let rowCache = aggregationCache.get(rows);

  if (!rowCache) {
    rowCache = new Map<string, unknown[]>();
    aggregationCache.set(rows, rowCache);
  }

  const cached = rowCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const extended = widget as WidgetLike & { dimensions?: string[]; measures?: string[] };
  const useSemantic = extended.dimensions?.length && (extended.measures?.length || extended.field || extended.yAxis);

  const xKey = useSemantic ? extended.dimensions![0] : widget.xAxis;
  const legendKey = useSemantic ? extended.dimensions![1] : widget.legend;
  let yKey = widget.yAxis || widget.field;
  // Use per-field aggregation if available, otherwise fall back to global aggregation
  let agg: Aggregation = widget.yAxisAggregation || widget.fieldAggregation || widget.aggregation || 'sum';

  if (useSemantic && extended.measures?.[0]) {
    const parsed = parseMeasureRef(extended.measures[0]);
    if (parsed.field) yKey = yKey || parsed.field;
    if (parsed.agg) agg = parsed.agg;
  }

  if (!xKey || !yKey) {
    rowCache.set(cacheKey, rows);
    return rows;
  }

  const numeric = inferIsNumericField(rows, yKey);
  const effectiveAgg: Aggregation = numeric ? (agg as Aggregation) : 'count';

  const map = new Map<string, any>();

  for (const r of rows as any[]) {
    const x = r?.[xKey];
    const xLabel = String(x ?? '');

    if (legendKey) {
      const l = r?.[legendKey];
      const lLabel = String(l ?? '');
      const k = `${xLabel}||${lLabel}`;
      const v = numeric ? Number(r?.[yKey]) || 0 : 1;
      const existing = map.get(k) || { __x: xLabel, __legend: lLabel, __vals: [] as number[] };
      existing.__vals.push(v);
      map.set(k, existing);
    } else {
      const k = xLabel;
      const v = numeric ? Number(r?.[yKey]) || 0 : 1;
      const existing = map.get(k) || { [xKey]: xLabel, __vals: [] as number[] };
      existing.__vals.push(v);
      map.set(k, existing);
    }
  }

  let result: unknown[];

  if (!legendKey) {
    const out: any[] = [];
    for (const entry of map.values()) {
      out.push({
        [xKey]: entry[xKey],
        [yKey]: aggregate(entry.__vals, effectiveAgg),
      });
    }
    result = out;
  } else {
    const legendValues = new Set<string>();
    for (const entry of map.values()) legendValues.add(entry.__legend);

    const byX = new Map<string, any>();
    for (const entry of map.values()) {
      const x = entry.__x;
      const l = entry.__legend;
      const val = aggregate(entry.__vals, effectiveAgg);
      const row = byX.get(x) || { [xKey]: x };
      row[l] = val;
      byX.set(x, row);
    }

    result = Array.from(byX.values()).map((row) => {
      for (const l of legendValues) {
        if (row[l] === undefined) row[l] = 0;
      }
      return row;
    });
  }

  // Cache the result
  rowCache.set(cacheKey, result);
  return result;
}

export interface PieDonutItem {
  name: string;
  value: number;
}

/**
 * Pie/donut: nameKey = legend || xAxis, valueKey = yAxis || field; sum by name.
 */
export function getPieDonutData(rows: unknown[], widget: WidgetLike): PieDonutItem[] {
  const nameKey = widget.legend || widget.xAxis;
  const valueKey = widget.yAxis || widget.field;
  if (!nameKey || !valueKey) return [];

  return (rows as any[]).reduce((acc: PieDonutItem[], row) => {
    const name = String(row?.[nameKey] ?? '');
    const v = Number(row?.[valueKey]);
    const value = Number.isFinite(v) ? v : 1;
    const found = acc.find((x) => x.name === name);
    if (found) found.value += value;
    else acc.push({ name, value });
    return acc;
  }, []);
}
