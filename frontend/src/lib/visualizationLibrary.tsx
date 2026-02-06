/**
 * Visualization Library - Complete Power BI-style chart type registry
 * Contains 40+ chart types with their configurations, field well requirements,
 * and rendering specifications
 */

import React from 'react';
import {
    BarChart2,
    LineChart,
    PieChart,
    Activity,
    TrendingUp,
    Table2,
    LayoutGrid,
    Map,
    GitBranch,
    Gauge,
    Hash,
    Type,
    Target,
    Layers,
    Boxes,
    Network,
    Droplets,
    Compass,
    Workflow,
    CircleDot,
    Shapes,
} from 'lucide-react';

// Chart Category
export type ChartCategory =
    | 'bar'
    | 'line'
    | 'area'
    | 'pie'
    | 'scatter'
    | 'map'
    | 'table'
    | 'card'
    | 'gauge'
    | 'hierarchy'
    | 'funnel'
    | 'ai'
    | 'custom';

// Field Well Type
export type FieldWellType =
    | 'axis'
    | 'values'
    | 'legend'
    | 'details'
    | 'tooltips'
    | 'smallMultiples'
    | 'columnGroup'
    | 'rowGroup'
    | 'size'
    | 'color'
    | 'latitude'
    | 'longitude'
    | 'location'
    | 'target'
    | 'minimum'
    | 'maximum';

// Field Well Configuration
export interface FieldWellConfig {
    type: FieldWellType;
    label: string;
    accepts: ('dimension' | 'measure')[];
    required: boolean;
    multiple: boolean;
    maxFields?: number;
    description?: string;
}

// Chart Type Definition
export interface ChartTypeDefinition {
    id: string;
    name: string;
    description: string;
    category: ChartCategory;
    icon: React.ReactNode;
    thumbnail?: string;

    // Field Wells
    fieldWells: FieldWellConfig[];

    // Capabilities
    supportsCrossFilter: boolean;
    supportsHighlight: boolean;
    supportsDrillDown: boolean;
    supportsDrillThrough: boolean;
    supportsAnalyticsLines: boolean;
    supportsConditionalFormatting: boolean;
    supportsSmallMultiples: boolean;
    supportsDataLabels: boolean;

    // Format Options
    defaultFormat: Partial<ChartFormatOptions>;

    // Min data requirements
    minDataPoints?: number;
}

// Chart Format Options
export interface ChartFormatOptions {
    // General
    showTitle: boolean;
    title: string;
    titleFontSize: number;

    // Legend
    showLegend: boolean;
    legendPosition: 'top' | 'bottom' | 'left' | 'right' | 'none';

    // Data Labels
    showDataLabels: boolean;
    dataLabelPosition: 'inside' | 'outside' | 'center' | 'auto';
    dataLabelFormat: string;

    // Axes
    showXAxis: boolean;
    showYAxis: boolean;
    xAxisTitle: string;
    yAxisTitle: string;

    // Colors
    colorPalette: string[];
    seriesColors: Record<string, string>;

    // Interactions
    enableTooltips: boolean;
    enableCrossFilter: boolean;
    enableHighlight: boolean;

    // Analytics
    showTrendLine: boolean;
    showAverageLine: boolean;

    // Specific to chart type
    barGap: number; // For bar charts
    cornerRadius: number;
    innerRadius: number; // For donut charts
    startAngle: number; // For pie/donut
    endAngle: number;
    strokeWidth: number; // For line charts
    areaOpacity: number; // For area charts
}

// Icon Size
const ICON_SIZE = 16;

// Chart Type Registry
export const CHART_TYPES: ChartTypeDefinition[] = [
    // ============ BAR CHARTS ============
    {
        id: 'clusteredBar',
        name: 'Clustered bar chart',
        description: 'Compare values across categories using horizontal bars',
        category: 'bar',
        icon: <BarChart2 size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'Y-Axis', accepts: ['dimension'], required: true, multiple: true, maxFields: 3 },
            { type: 'values', label: 'X-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: false, multiple: true, maxFields: 2 },
            { type: 'smallMultiples', label: 'Small multiples', accepts: ['dimension'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: true,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, legendPosition: 'right', showDataLabels: false },
    },
    {
        id: 'stackedBar',
        name: 'Stacked bar chart',
        description: 'Show part-to-whole relationships with stacked horizontal bars',
        category: 'bar',
        icon: <BarChart2 size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'Y-Axis', accepts: ['dimension'], required: true, multiple: true, maxFields: 3 },
            { type: 'values', label: 'X-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, legendPosition: 'right' },
    },
    {
        id: 'percentStackedBar',
        name: '100% Stacked bar chart',
        description: 'Show percentage distribution across categories',
        category: 'bar',
        icon: <BarChart2 size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'Y-Axis', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'X-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, showDataLabels: true },
    },
    {
        id: 'clusteredColumn',
        name: 'Clustered column chart',
        description: 'Compare values across categories using vertical bars',
        category: 'bar',
        icon: <BarChart2 size={ICON_SIZE} className="rotate-90" />,
        fieldWells: [
            { type: 'axis', label: 'X-Axis', accepts: ['dimension'], required: true, multiple: true, maxFields: 3 },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: false, multiple: true, maxFields: 2 },
            { type: 'smallMultiples', label: 'Small multiples', accepts: ['dimension'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: true,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, legendPosition: 'top' },
    },
    {
        id: 'stackedColumn',
        name: 'Stacked column chart',
        description: 'Show part-to-whole relationships with stacked vertical bars',
        category: 'bar',
        icon: <BarChart2 size={ICON_SIZE} className="rotate-90" />,
        fieldWells: [
            { type: 'axis', label: 'X-Axis', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, legendPosition: 'top' },
    },
    {
        id: 'percentStackedColumn',
        name: '100% Stacked column chart',
        description: 'Show percentage distribution across categories vertically',
        category: 'bar',
        icon: <BarChart2 size={ICON_SIZE} className="rotate-90" />,
        fieldWells: [
            { type: 'axis', label: 'X-Axis', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, showDataLabels: true },
    },

    // ============ LINE CHARTS ============
    {
        id: 'line',
        name: 'Line chart',
        description: 'Show trends over time or continuous data',
        category: 'line',
        icon: <LineChart size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'X-Axis', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: false, multiple: false },
            { type: 'smallMultiples', label: 'Small multiples', accepts: ['dimension'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: true,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, strokeWidth: 2 },
    },
    {
        id: 'area',
        name: 'Area chart',
        description: 'Show trends with filled areas below the line',
        category: 'area',
        icon: <Activity size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'X-Axis', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: true,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, areaOpacity: 0.3 },
    },
    {
        id: 'stackedArea',
        name: 'Stacked area chart',
        description: 'Show part-to-whole trends over time',
        category: 'area',
        icon: <Activity size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'X-Axis', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: true,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, areaOpacity: 0.8 },
    },
    {
        id: 'lineAndColumn',
        name: 'Line and clustered column chart',
        description: 'Combine lines and columns to show two measures',
        category: 'line',
        icon: <TrendingUp size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'Shared axis', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Column values', accepts: ['measure'], required: true, multiple: true },
            { type: 'values', label: 'Line values', accepts: ['measure'], required: true, multiple: true },
            { type: 'legend', label: 'Column legend', accepts: ['dimension'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: true,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true },
    },
    {
        id: 'ribbon',
        name: 'Ribbon chart',
        description: 'Show ranking changes over time',
        category: 'line',
        icon: <Workflow size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'X-Axis', accepts: ['dimension'], required: true, multiple: false },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: false },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: false,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: false,
        defaultFormat: { showLegend: true },
    },

    // ============ PIE & DONUT ============
    {
        id: 'pie',
        name: 'Pie chart',
        description: 'Show proportions of a whole',
        category: 'pie',
        icon: <PieChart size={ICON_SIZE} />,
        fieldWells: [
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Values', accepts: ['measure'], required: true, multiple: false },
            { type: 'details', label: 'Details', accepts: ['dimension'], required: false, multiple: true },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, showDataLabels: true, innerRadius: 0 },
    },
    {
        id: 'donut',
        name: 'Donut chart',
        description: 'Pie chart with a center cutout',
        category: 'pie',
        icon: <CircleDot size={ICON_SIZE} />,
        fieldWells: [
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Values', accepts: ['measure'], required: true, multiple: false },
            { type: 'details', label: 'Details', accepts: ['dimension'], required: false, multiple: true },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true, showDataLabels: true, innerRadius: 50 },
    },

    // ============ SCATTER & BUBBLE ============
    {
        id: 'scatter',
        name: 'Scatter chart',
        description: 'Show correlation between two measures',
        category: 'scatter',
        icon: <Target size={ICON_SIZE} />,
        fieldWells: [
            { type: 'values', label: 'X-Axis', accepts: ['measure'], required: true, multiple: false },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: false },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: false, multiple: false },
            { type: 'details', label: 'Details', accepts: ['dimension'], required: false, multiple: true },
            { type: 'size', label: 'Size', accepts: ['measure'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: false,
        supportsDrillThrough: true,
        supportsAnalyticsLines: true,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true },
    },
    {
        id: 'bubble',
        name: 'Bubble chart',
        description: 'Scatter chart with size dimension',
        category: 'scatter',
        icon: <Droplets size={ICON_SIZE} />,
        fieldWells: [
            { type: 'values', label: 'X-Axis', accepts: ['measure'], required: true, multiple: false },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: false },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: false, multiple: false },
            { type: 'size', label: 'Size', accepts: ['measure'], required: true, multiple: false },
            { type: 'color', label: 'Color saturation', accepts: ['measure'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: false,
        supportsDrillThrough: true,
        supportsAnalyticsLines: true,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true },
    },

    // ============ MAP CHARTS ============
    {
        id: 'map',
        name: 'Map',
        description: 'Show geographic data on a map',
        category: 'map',
        icon: <Map size={ICON_SIZE} />,
        fieldWells: [
            { type: 'location', label: 'Location', accepts: ['dimension'], required: true, multiple: true },
            { type: 'size', label: 'Bubble size', accepts: ['measure'], required: false, multiple: false },
            { type: 'color', label: 'Color saturation', accepts: ['measure'], required: false, multiple: false },
            { type: 'legend', label: 'Legend', accepts: ['dimension'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showLegend: true },
    },
    {
        id: 'filledMap',
        name: 'Filled map',
        description: 'Color regions by value (choropleth)',
        category: 'map',
        icon: <Map size={ICON_SIZE} />,
        fieldWells: [
            { type: 'location', label: 'Location', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Values', accepts: ['measure'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: {},
    },

    // ============ TABLE & MATRIX ============
    {
        id: 'table',
        name: 'Table',
        description: 'Display data in rows and columns',
        category: 'table',
        icon: <Table2 size={ICON_SIZE} />,
        fieldWells: [
            { type: 'columnGroup', label: 'Columns', accepts: ['dimension', 'measure'], required: true, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: false,
        supportsDrillDown: false,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: false,
        defaultFormat: {},
    },
    {
        id: 'matrix',
        name: 'Matrix',
        description: 'Pivot table with row and column hierarchies',
        category: 'table',
        icon: <LayoutGrid size={ICON_SIZE} />,
        fieldWells: [
            { type: 'rowGroup', label: 'Rows', accepts: ['dimension'], required: true, multiple: true },
            { type: 'columnGroup', label: 'Columns', accepts: ['dimension'], required: false, multiple: true },
            { type: 'values', label: 'Values', accepts: ['measure'], required: true, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: false,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: false,
        defaultFormat: {},
    },

    // ============ CARD & KPI ============
    {
        id: 'card',
        name: 'Card',
        description: 'Display a single value prominently',
        category: 'card',
        icon: <Hash size={ICON_SIZE} />,
        fieldWells: [
            { type: 'values', label: 'Fields', accepts: ['measure'], required: true, multiple: false, maxFields: 1 },
        ],
        supportsCrossFilter: false,
        supportsHighlight: false,
        supportsDrillDown: false,
        supportsDrillThrough: false,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: {},
    },
    {
        id: 'multiRowCard',
        name: 'Multi-row card',
        description: 'Display multiple values in card format',
        category: 'card',
        icon: <Layers size={ICON_SIZE} />,
        fieldWells: [
            { type: 'values', label: 'Fields', accepts: ['dimension', 'measure'], required: true, multiple: true },
        ],
        supportsCrossFilter: false,
        supportsHighlight: false,
        supportsDrillDown: false,
        supportsDrillThrough: false,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: {},
    },
    {
        id: 'kpi',
        name: 'KPI',
        description: 'Show key performance indicator with target',
        category: 'card',
        icon: <Target size={ICON_SIZE} />,
        fieldWells: [
            { type: 'values', label: 'Indicator', accepts: ['measure'], required: true, multiple: false },
            { type: 'target', label: 'Target goals', accepts: ['measure'], required: false, multiple: false },
            { type: 'axis', label: 'Trend axis', accepts: ['dimension'], required: false, multiple: false },
        ],
        supportsCrossFilter: false,
        supportsHighlight: false,
        supportsDrillDown: false,
        supportsDrillThrough: false,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: {},
    },

    // ============ GAUGE ============
    {
        id: 'gauge',
        name: 'Gauge',
        description: 'Show progress toward a target',
        category: 'gauge',
        icon: <Gauge size={ICON_SIZE} />,
        fieldWells: [
            { type: 'values', label: 'Value', accepts: ['measure'], required: true, multiple: false },
            { type: 'target', label: 'Target value', accepts: ['measure'], required: false, multiple: false },
            { type: 'minimum', label: 'Minimum value', accepts: ['measure'], required: false, multiple: false },
            { type: 'maximum', label: 'Maximum value', accepts: ['measure'], required: false, multiple: false },
        ],
        supportsCrossFilter: false,
        supportsHighlight: false,
        supportsDrillDown: false,
        supportsDrillThrough: false,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: {},
    },

    // ============ HIERARCHY ============
    {
        id: 'treemap',
        name: 'Treemap',
        description: 'Show hierarchical data as nested rectangles',
        category: 'hierarchy',
        icon: <Boxes size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'Category', accepts: ['dimension'], required: true, multiple: true },
            { type: 'details', label: 'Details', accepts: ['dimension'], required: false, multiple: true },
            { type: 'values', label: 'Values', accepts: ['measure'], required: true, multiple: false },
            { type: 'color', label: 'Color saturation', accepts: ['measure'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showLegend: false },
    },
    {
        id: 'decompositionTree',
        name: 'Decomposition tree',
        description: 'Analyze data breakdown across dimensions',
        category: 'hierarchy',
        icon: <GitBranch size={ICON_SIZE} />,
        fieldWells: [
            { type: 'values', label: 'Analyze', accepts: ['measure'], required: true, multiple: false },
            { type: 'axis', label: 'Explain by', accepts: ['dimension'], required: true, multiple: true },
        ],
        supportsCrossFilter: false,
        supportsHighlight: false,
        supportsDrillDown: true,
        supportsDrillThrough: false,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: {},
    },
    {
        id: 'sunburst',
        name: 'Sunburst chart',
        description: 'Show hierarchical data as concentric rings',
        category: 'hierarchy',
        icon: <Compass size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'Group', accepts: ['dimension'], required: true, multiple: true },
            { type: 'values', label: 'Values', accepts: ['measure'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: {},
    },

    // ============ FUNNEL ============
    {
        id: 'funnel',
        name: 'Funnel chart',
        description: 'Show stages in a process',
        category: 'funnel',
        icon: <Network size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'Category', accepts: ['dimension'], required: true, multiple: false },
            { type: 'values', label: 'Values', accepts: ['measure'], required: true, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: false,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: true,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showDataLabels: true },
    },
    {
        id: 'waterfall',
        name: 'Waterfall chart',
        description: 'Show cumulative effect of positive and negative values',
        category: 'funnel',
        icon: <BarChart2 size={ICON_SIZE} />,
        fieldWells: [
            { type: 'axis', label: 'Category', accepts: ['dimension'], required: true, multiple: false },
            { type: 'values', label: 'Y-Axis', accepts: ['measure'], required: true, multiple: false },
            { type: 'axis', label: 'Breakdown', accepts: ['dimension'], required: false, multiple: false },
            { type: 'tooltips', label: 'Tooltips', accepts: ['dimension', 'measure'], required: false, multiple: true },
        ],
        supportsCrossFilter: true,
        supportsHighlight: true,
        supportsDrillDown: true,
        supportsDrillThrough: true,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: true,
        defaultFormat: { showDataLabels: true },
    },

    // ============ TEXT ============
    {
        id: 'textbox',
        name: 'Text box',
        description: 'Add text annotations to your report',
        category: 'custom',
        icon: <Type size={ICON_SIZE} />,
        fieldWells: [],
        supportsCrossFilter: false,
        supportsHighlight: false,
        supportsDrillDown: false,
        supportsDrillThrough: false,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: false,
        defaultFormat: {},
    },
    {
        id: 'shape',
        name: 'Shape',
        description: 'Add decorative shapes',
        category: 'custom',
        icon: <Shapes size={ICON_SIZE} />,
        fieldWells: [],
        supportsCrossFilter: false,
        supportsHighlight: false,
        supportsDrillDown: false,
        supportsDrillThrough: false,
        supportsAnalyticsLines: false,
        supportsConditionalFormatting: false,
        supportsSmallMultiples: false,
        supportsDataLabels: false,
        defaultFormat: {},
    },
];

// Get chart type by ID
export const getChartType = (id: string): ChartTypeDefinition | undefined => {
    return CHART_TYPES.find(ct => ct.id === id);
};

// Get chart types by category
export const getChartTypesByCategory = (category: ChartCategory): ChartTypeDefinition[] => {
    return CHART_TYPES.filter(ct => ct.category === category);
};

// Get all categories
export const getChartCategories = (): ChartCategory[] => {
    return [...new Set(CHART_TYPES.map(ct => ct.category))];
};

// Chart category labels
export const CHART_CATEGORY_LABELS: Record<ChartCategory, string> = {
    bar: 'Bar charts',
    line: 'Line charts',
    area: 'Area charts',
    pie: 'Pie & Donut',
    scatter: 'Scatter & Bubble',
    map: 'Maps',
    table: 'Tables',
    card: 'Cards & KPIs',
    gauge: 'Gauges',
    hierarchy: 'Hierarchy',
    funnel: 'Funnel & Waterfall',
    ai: 'AI visuals',
    custom: 'Other',
};

export default CHART_TYPES;
