/**
 * Widget System - Core widget types and utilities for dashboard builder
 * Defines widget structure, data binding, formatting, and interactions
 */

import { VisualFormat, DEFAULT_VISUAL_FORMAT } from './formatPane';
import { ResponsiveWidgetLayout } from './responsiveLayout';
import { FilterConfig } from '../components/developer/FilterPanel';
import { DrillContext } from '../components/developer/DrillNavigation';
import { DataField, AggregationType, FieldWell } from '../components/developer/FieldWells';

// Widget Types
export type WidgetType =
    // Charts
    | 'clusteredBar' | 'stackedBar' | 'percentStackedBar'
    | 'clusteredColumn' | 'stackedColumn' | 'percentStackedColumn'
    | 'line' | 'area' | 'stackedArea' | 'lineAndColumn' | 'ribbon'
    | 'pie' | 'donut'
    | 'scatter' | 'bubble'
    | 'map' | 'filledMap'
    | 'table' | 'matrix'
    | 'card' | 'multiRowCard' | 'kpi'
    | 'gauge'
    | 'treemap' | 'decompositionTree' | 'sunburst'
    | 'funnel' | 'waterfall'
    // Other
    | 'textbox' | 'shape' | 'image' | 'button'
    | 'slicer'
    // Custom
    | 'custom';

// Widget State
export type WidgetState = 'normal' | 'selected' | 'focused' | 'editing' | 'loading' | 'error';

// Data Binding
export interface DataBinding {
    datasetId: string;
    datasetName: string;
    fields: BoundField[];
    filters?: FilterConfig[];
    sortBy?: SortConfig[];
}

export interface BoundField {
    id: string;
    sourceField: string;
    displayName: string;
    tableName: string;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    fieldType: 'dimension' | 'measure';
    aggregation?: AggregationType;
    format?: string;
    wellType: string; // Which well this field is bound to
    order: number;
}

export interface SortConfig {
    field: string;
    direction: 'asc' | 'desc';
}

// Visual Interactions
export interface InteractionConfig {
    // Cross-filtering
    crossFilterMode: 'filter' | 'highlight' | 'none';
    crossFilterTargets?: string[]; // Widget IDs to filter

    // Drill
    drillEnabled: boolean;
    drillHierarchy?: DrillContext['hierarchy'];
    drillThroughTargets?: Array<{ pageId: string; pageName: string }>;

    // Click actions
    onClickAction?: 'drillDown' | 'drillThrough' | 'navigate' | 'none';
    navigationTarget?: {
        type: 'page' | 'url' | 'bookmark';
        target: string;
    };

    // Tooltip
    tooltipType: 'default' | 'reportPage' | 'custom' | 'none';
    tooltipPageId?: string;
    customTooltipFields?: string[];
}

// Widget Position
export interface WidgetPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    rotation?: number;
    locked?: boolean;
}

// Complete Widget Definition
export interface Widget {
    // Identity
    id: string;
    type: WidgetType;
    name: string;

    // Position & Size
    position: WidgetPosition;
    responsiveLayouts?: {
        desktop: ResponsiveWidgetLayout;
        tablet?: ResponsiveWidgetLayout;
        mobile?: ResponsiveWidgetLayout;
    };

    // State
    state: WidgetState;
    visible: boolean;

    // Data
    dataBinding?: DataBinding;
    fieldWells?: Record<string, DataField[]>;
    staticData?: any[];

    // Formatting
    format: VisualFormat;

    // Interactions
    interactions: InteractionConfig;

    // Content (for text/shape/image widgets)
    content?: {
        text?: string;
        richText?: string;
        imageUrl?: string;
        shapeType?: 'rectangle' | 'roundedRectangle' | 'ellipse' | 'triangle' | 'line' | 'arrow';
        buttonAction?: {
            type: 'navigate' | 'bookmark' | 'url' | 'qna' | 'back';
            target?: string;
        };
    };

    // Slicer specific
    slicerConfig?: {
        type: 'list' | 'dropdown' | 'tile' | 'range' | 'date' | 'between';
        fieldName: string;
        showTitle: boolean;
        showSelectAll: boolean;
        showClearButton: boolean;
        singleSelect: boolean;
        searchEnabled: boolean;
        orientation: 'vertical' | 'horizontal';
        columns?: number;
    };

    // Analytics
    analyticsEnabled?: boolean;

    // Metadata
    createdAt: number;
    updatedAt: number;
    createdBy?: string;
}

// Widget Template
export interface WidgetTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnail?: string;
    widget: Partial<Widget>;
}

// Create Default Widget
export const createWidget = (
    type: WidgetType,
    position: Partial<WidgetPosition> = {}
): Widget => {
    const now = Date.now();
    const id = `widget-${now}-${Math.random().toString(36).substr(2, 9)}`;

    const defaultPosition: WidgetPosition = {
        x: position.x ?? 0,
        y: position.y ?? 0,
        width: position.width ?? getDefaultWidthForType(type),
        height: position.height ?? getDefaultHeightForType(type),
        zIndex: position.zIndex ?? 1,
        locked: false,
    };

    return {
        id,
        type,
        name: getDefaultNameForType(type),
        position: defaultPosition,
        state: 'normal',
        visible: true,
        format: { ...DEFAULT_VISUAL_FORMAT },
        interactions: {
            crossFilterMode: 'filter',
            drillEnabled: true,
            tooltipType: 'default',
        },
        createdAt: now,
        updatedAt: now,
    };
};

// Get default dimensions for widget type
const getDefaultWidthForType = (type: WidgetType): number => {
    switch (type) {
        case 'card':
        case 'kpi':
            return 200;
        case 'slicer':
            return 180;
        case 'textbox':
            return 300;
        case 'table':
        case 'matrix':
            return 500;
        default:
            return 400;
    }
};

const getDefaultHeightForType = (type: WidgetType): number => {
    switch (type) {
        case 'card':
        case 'kpi':
            return 120;
        case 'slicer':
            return 300;
        case 'textbox':
            return 100;
        case 'table':
        case 'matrix':
            return 350;
        case 'gauge':
            return 250;
        default:
            return 300;
    }
};

const getDefaultNameForType = (type: WidgetType): string => {
    const names: Record<WidgetType, string> = {
        clusteredBar: 'Clustered bar chart',
        stackedBar: 'Stacked bar chart',
        percentStackedBar: '100% Stacked bar chart',
        clusteredColumn: 'Clustered column chart',
        stackedColumn: 'Stacked column chart',
        percentStackedColumn: '100% Stacked column chart',
        line: 'Line chart',
        area: 'Area chart',
        stackedArea: 'Stacked area chart',
        lineAndColumn: 'Line and column chart',
        ribbon: 'Ribbon chart',
        pie: 'Pie chart',
        donut: 'Donut chart',
        scatter: 'Scatter chart',
        bubble: 'Bubble chart',
        map: 'Map',
        filledMap: 'Filled map',
        table: 'Table',
        matrix: 'Matrix',
        card: 'Card',
        multiRowCard: 'Multi-row card',
        kpi: 'KPI',
        gauge: 'Gauge',
        treemap: 'Treemap',
        decompositionTree: 'Decomposition tree',
        sunburst: 'Sunburst',
        funnel: 'Funnel',
        waterfall: 'Waterfall',
        textbox: 'Text box',
        shape: 'Shape',
        image: 'Image',
        button: 'Button',
        slicer: 'Slicer',
        custom: 'Custom visual',
    };

    return names[type] || 'Widget';
};

// Widget utilities
export const cloneWidget = (widget: Widget, newPosition?: Partial<WidgetPosition>): Widget => {
    const now = Date.now();
    return {
        ...widget,
        id: `widget-${now}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${widget.name} (Copy)`,
        position: {
            ...widget.position,
            x: (newPosition?.x ?? widget.position.x) + 20,
            y: (newPosition?.y ?? widget.position.y) + 20,
            ...newPosition,
        },
        state: 'normal',
        createdAt: now,
        updatedAt: now,
    };
};

export const updateWidget = (widget: Widget, updates: Partial<Widget>): Widget => {
    return {
        ...widget,
        ...updates,
        updatedAt: Date.now(),
    };
};

export const updateWidgetPosition = (widget: Widget, position: Partial<WidgetPosition>): Widget => {
    return updateWidget(widget, {
        position: { ...widget.position, ...position },
    });
};

export const updateWidgetFormat = (widget: Widget, format: Partial<VisualFormat>): Widget => {
    return updateWidget(widget, {
        format: { ...widget.format, ...format },
    });
};

export const bindDataToWidget = (widget: Widget, binding: DataBinding): Widget => {
    return updateWidget(widget, { dataBinding: binding });
};

// Check if widget supports certain features
export const widgetSupports = (widget: Widget, feature: string): boolean => {
    const features: Record<WidgetType, string[]> = {
        clusteredBar: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'analytics', 'conditionalFormat', 'smallMultiples', 'dataLabels'],
        stackedBar: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'conditionalFormat', 'smallMultiples', 'dataLabels'],
        percentStackedBar: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'conditionalFormat', 'smallMultiples', 'dataLabels'],
        clusteredColumn: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'analytics', 'conditionalFormat', 'smallMultiples', 'dataLabels'],
        stackedColumn: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'conditionalFormat', 'smallMultiples', 'dataLabels'],
        percentStackedColumn: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'conditionalFormat', 'smallMultiples', 'dataLabels'],
        line: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'analytics', 'smallMultiples', 'dataLabels'],
        area: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'analytics', 'smallMultiples', 'dataLabels'],
        stackedArea: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'smallMultiples', 'dataLabels'],
        lineAndColumn: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'analytics', 'dataLabels'],
        ribbon: ['crossFilter', 'highlight', 'drillThrough'],
        pie: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'dataLabels'],
        donut: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'dataLabels'],
        scatter: ['crossFilter', 'highlight', 'drillThrough', 'analytics', 'dataLabels'],
        bubble: ['crossFilter', 'highlight', 'drillThrough', 'analytics', 'dataLabels'],
        map: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'dataLabels'],
        filledMap: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'conditionalFormat', 'dataLabels'],
        table: ['crossFilter', 'drillThrough', 'conditionalFormat'],
        matrix: ['crossFilter', 'drillDown', 'drillThrough', 'conditionalFormat'],
        card: ['conditionalFormat', 'dataLabels'],
        multiRowCard: ['conditionalFormat', 'dataLabels'],
        kpi: ['conditionalFormat', 'dataLabels'],
        gauge: ['conditionalFormat', 'dataLabels'],
        treemap: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'conditionalFormat', 'dataLabels'],
        decompositionTree: ['drillDown', 'dataLabels'],
        sunburst: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'dataLabels'],
        funnel: ['crossFilter', 'highlight', 'drillThrough', 'conditionalFormat', 'dataLabels'],
        waterfall: ['crossFilter', 'highlight', 'drillDown', 'drillThrough', 'dataLabels'],
        textbox: [],
        shape: [],
        image: [],
        button: [],
        slicer: ['crossFilter'],
        custom: [],
    };

    return features[widget.type]?.includes(feature) ?? false;
};

// Check if widget requires data
export const widgetRequiresData = (type: WidgetType): boolean => {
    const noDataTypes: WidgetType[] = ['textbox', 'shape', 'image', 'button'];
    return !noDataTypes.includes(type);
};

// Check if widget is a chart
export const isChartWidget = (type: WidgetType): boolean => {
    const nonChartTypes: WidgetType[] = ['textbox', 'shape', 'image', 'button', 'table', 'matrix', 'slicer', 'card', 'multiRowCard', 'kpi'];
    return !nonChartTypes.includes(type);
};

// Get widget category
export const getWidgetCategory = (type: WidgetType): string => {
    const categories: Record<WidgetType, string> = {
        clusteredBar: 'bar',
        stackedBar: 'bar',
        percentStackedBar: 'bar',
        clusteredColumn: 'bar',
        stackedColumn: 'bar',
        percentStackedColumn: 'bar',
        line: 'line',
        area: 'area',
        stackedArea: 'area',
        lineAndColumn: 'line',
        ribbon: 'line',
        pie: 'pie',
        donut: 'pie',
        scatter: 'scatter',
        bubble: 'scatter',
        map: 'map',
        filledMap: 'map',
        table: 'table',
        matrix: 'table',
        card: 'card',
        multiRowCard: 'card',
        kpi: 'card',
        gauge: 'gauge',
        treemap: 'hierarchy',
        decompositionTree: 'hierarchy',
        sunburst: 'hierarchy',
        funnel: 'funnel',
        waterfall: 'funnel',
        textbox: 'other',
        shape: 'other',
        image: 'other',
        button: 'other',
        slicer: 'filter',
        custom: 'other',
    };

    return categories[type] || 'other';
};

// Widget validation
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export const validateWidget = (widget: Widget): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required data binding
    if (widgetRequiresData(widget.type) && !widget.dataBinding && !widget.staticData) {
        errors.push('Widget requires data binding');
    }

    // Check position
    if (widget.position.width <= 0 || widget.position.height <= 0) {
        errors.push('Widget must have positive dimensions');
    }

    // Check field wells for charts
    if (isChartWidget(widget.type) && widget.dataBinding) {
        const requiredWells = getRequiredFieldWells(widget.type);
        const boundWells = Object.keys(widget.fieldWells || {});

        requiredWells.forEach(well => {
            if (!boundWells.includes(well) || !widget.fieldWells?.[well]?.length) {
                warnings.push(`Missing required field well: ${well}`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

const getRequiredFieldWells = (type: WidgetType): string[] => {
    const required: Record<string, string[]> = {
        clusteredBar: ['axis', 'values'],
        stackedBar: ['axis', 'values', 'legend'],
        line: ['axis', 'values'],
        pie: ['legend', 'values'],
        scatter: ['xAxis', 'yAxis'],
        table: ['columns'],
        matrix: ['rows', 'values'],
        card: ['values'],
        gauge: ['values'],
    };

    return required[type] || [];
};

export default {
    createWidget,
    cloneWidget,
    updateWidget,
    updateWidgetPosition,
    updateWidgetFormat,
    bindDataToWidget,
    widgetSupports,
    widgetRequiresData,
    isChartWidget,
    getWidgetCategory,
    validateWidget,
};
