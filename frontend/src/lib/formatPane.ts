/**
 * Format Pane Configuration for Power BI-style visual formatting
 * Deep formatting options for each visual type
 */

import type { CSSProperties } from 'react';

export type FontWeight = 'normal' | 'bold' | 'semibold' | 'light';
export type TextAlign = 'left' | 'center' | 'right';
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'none';
export type AxisScale = 'linear' | 'log';
export type DisplayUnits = 'auto' | 'none' | 'thousands' | 'millions' | 'billions' | 'trillions';

export interface TitleFormat {
    show: boolean;
    text?: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: FontWeight;
    fontColor: string;
    alignment: TextAlign;
    backgroundColor: string;
    backgroundTransparency: number;
}

export interface BackgroundFormat {
    show: boolean;
    color: string;
    transparency: number;
}

export interface BorderFormat {
    show: boolean;
    color: string;
    width: number;
    radius: number;
}

export interface ShadowFormat {
    show: boolean;
    color: string;
    blur: number;
    spread: number;
    offsetX: number;
    offsetY: number;
}

export interface PaddingFormat {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface DataLabelFormat {
    show: boolean;
    fontFamily: string;
    fontSize: number;
    fontWeight: FontWeight;
    fontColor: string;
    backgroundColor: string;
    backgroundTransparency: number;
    displayUnits: DisplayUnits;
    precision: number;
    position: 'inside' | 'outside' | 'auto';
    orientation: 'horizontal' | 'vertical' | 'auto';
}

export interface AxisFormat {
    show: boolean;
    showTitle: boolean;
    title?: string;
    titleFontSize: number;
    titleFontColor: string;
    titleFontWeight: FontWeight;
    scale: AxisScale;
    rangeStart?: number;
    rangeEnd?: number;
    labelFontFamily: string;
    labelFontSize: number;
    labelFontColor: string;
    labelRotation: number;
    showGridlines: boolean;
    gridlineColor: string;
    gridlineWidth: number;
    gridlineStyle: 'solid' | 'dashed' | 'dotted';
}

export interface LegendFormat {
    show: boolean;
    position: LegendPosition;
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    fontWeight: FontWeight;
    showTitle: boolean;
    title?: string;
    markerShape: 'circle' | 'square' | 'line' | 'triangle';
    markerSize: number;
}

export interface TooltipFormat {
    show: boolean;
    showCategory: boolean;
    showValue: boolean;
    showPercent: boolean;
    backgroundColor: string;
    backgroundTransparency: number;
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
}

export interface ConditionalFormatRule {
    id: string;
    name: string;
    type: 'colorScale' | 'colorRules' | 'dataBar' | 'icon';
    field: string;
    enabled: boolean;
    // Color scale
    minColor?: string;
    midColor?: string;
    maxColor?: string;
    minValue?: number;
    midValue?: number;
    maxValue?: number;
    // Color rules
    rules?: Array<{
        operator: 'greaterThan' | 'lessThan' | 'equals' | 'between' | 'contains';
        value: number | string;
        value2?: number | string;
        color: string;
        backgroundColor?: string;
        icon?: string;
    }>;
    // Data bar
    barColor?: string;
    barDirection?: 'leftToRight' | 'rightToLeft';
    showValue?: boolean;
    // Icon set
    iconSet?: 'arrows' | 'circles' | 'flags' | 'stars' | 'ratings';
}

export interface AnalyticsLine {
    id: string;
    type: 'constant' | 'average' | 'min' | 'max' | 'median' | 'percentile' | 'trend';
    show: boolean;
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
    value?: number;
    percentile?: number;
    showLabel: boolean;
    labelText?: string;
    labelPosition: 'above' | 'below' | 'inline';
}

export interface VisualFormat {
    // General
    title: TitleFormat;
    background: BackgroundFormat;
    border: BorderFormat;
    shadow: ShadowFormat;
    padding: PaddingFormat;

    // Data visualization
    dataLabels: DataLabelFormat;
    xAxis: AxisFormat;
    yAxis: AxisFormat;
    legend: LegendFormat;
    tooltip: TooltipFormat;

    // Colors
    colors: string[];
    colorSaturation: number;

    // Conditional formatting
    conditionalFormatting: ConditionalFormatRule[];

    // Analytics
    analyticsLines: AnalyticsLine[];

    // Interactions
    enableCrossFiltering: boolean;
    enableDrilldown: boolean;
    enableTooltips: boolean;

    // Responsive
    responsiveVisibility: {
        desktop: boolean;
        tablet: boolean;
        mobile: boolean;
    };
}

export const DEFAULT_TITLE_FORMAT: TitleFormat = {
    show: true,
    fontFamily: 'Segoe UI',
    fontSize: 14,
    fontWeight: 'semibold',
    fontColor: '#333333',
    alignment: 'left',
    backgroundColor: 'transparent',
    backgroundTransparency: 100,
};

export const DEFAULT_BACKGROUND_FORMAT: BackgroundFormat = {
    show: true,
    color: '#ffffff',
    transparency: 0,
};

export const DEFAULT_BORDER_FORMAT: BorderFormat = {
    show: false,
    color: '#e0e0e0',
    width: 1,
    radius: 8,
};

export const DEFAULT_SHADOW_FORMAT: ShadowFormat = {
    show: true,
    color: 'rgba(0,0,0,0.1)',
    blur: 8,
    spread: 0,
    offsetX: 0,
    offsetY: 2,
};

export const DEFAULT_PADDING_FORMAT: PaddingFormat = {
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
};

export const DEFAULT_DATA_LABEL_FORMAT: DataLabelFormat = {
    show: false,
    fontFamily: 'Segoe UI',
    fontSize: 11,
    fontWeight: 'normal',
    fontColor: '#333333',
    backgroundColor: 'transparent',
    backgroundTransparency: 100,
    displayUnits: 'auto',
    precision: 2,
    position: 'auto',
    orientation: 'auto',
};

export const DEFAULT_AXIS_FORMAT: AxisFormat = {
    show: true,
    showTitle: false,
    titleFontSize: 12,
    titleFontColor: '#666666',
    titleFontWeight: 'semibold',
    scale: 'linear',
    labelFontFamily: 'Segoe UI',
    labelFontSize: 11,
    labelFontColor: '#666666',
    labelRotation: 0,
    showGridlines: true,
    gridlineColor: '#e0e0e0',
    gridlineWidth: 1,
    gridlineStyle: 'solid',
};

export const DEFAULT_LEGEND_FORMAT: LegendFormat = {
    show: true,
    position: 'top',
    fontFamily: 'Segoe UI',
    fontSize: 11,
    fontColor: '#666666',
    fontWeight: 'normal',
    showTitle: false,
    markerShape: 'circle',
    markerSize: 8,
};

export const DEFAULT_TOOLTIP_FORMAT: TooltipFormat = {
    show: true,
    showCategory: true,
    showValue: true,
    showPercent: false,
    backgroundColor: '#ffffff',
    backgroundTransparency: 5,
    fontFamily: 'Segoe UI',
    fontSize: 12,
    fontColor: '#333333',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 6,
};

export const DEFAULT_VISUAL_FORMAT: VisualFormat = {
    title: DEFAULT_TITLE_FORMAT,
    background: DEFAULT_BACKGROUND_FORMAT,
    border: DEFAULT_BORDER_FORMAT,
    shadow: DEFAULT_SHADOW_FORMAT,
    padding: DEFAULT_PADDING_FORMAT,
    dataLabels: DEFAULT_DATA_LABEL_FORMAT,
    xAxis: DEFAULT_AXIS_FORMAT,
    yAxis: { ...DEFAULT_AXIS_FORMAT },
    legend: DEFAULT_LEGEND_FORMAT,
    tooltip: DEFAULT_TOOLTIP_FORMAT,
    colors: ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#00B7C3', '#744EC2', '#D64550', '#7FBA00', '#FFB900', '#4C78A8'],
    colorSaturation: 100,
    conditionalFormatting: [],
    analyticsLines: [],
    enableCrossFiltering: true,
    enableDrilldown: true,
    enableTooltips: true,
    responsiveVisibility: {
        desktop: true,
        tablet: true,
        mobile: true,
    },
};

/**
 * Get format configuration for a specific visual type
 */
export function getVisualFormatConfig(visualType: string): Partial<VisualFormat> {
    switch (visualType) {
        case 'card':
        case 'kpi':
        case 'multi-row-card':
            return {
                xAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                yAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                legend: { ...DEFAULT_LEGEND_FORMAT, show: false },
                dataLabels: { ...DEFAULT_DATA_LABEL_FORMAT, show: true, fontSize: 24 },
            };

        case 'pie':
        case 'donut':
            return {
                xAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                yAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                dataLabels: { ...DEFAULT_DATA_LABEL_FORMAT, show: true },
            };

        case 'gauge':
            return {
                xAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                yAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                legend: { ...DEFAULT_LEGEND_FORMAT, show: false },
            };

        case 'table':
        case 'matrix':
            return {
                xAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                yAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                legend: { ...DEFAULT_LEGEND_FORMAT, show: false },
            };

        case 'filter':
            return {
                xAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                yAxis: { ...DEFAULT_AXIS_FORMAT, show: false },
                legend: { ...DEFAULT_LEGEND_FORMAT, show: false },
                title: { ...DEFAULT_TITLE_FORMAT, show: true },
            };

        default:
            return {};
    }
}

/**
 * Apply formatting to generate CSS styles
 */
export function formatToStyles(format: VisualFormat): CSSProperties {
    const styles: CSSProperties = {};

    // Background
    if (format.background.show) {
        styles.backgroundColor = format.background.color;
        if (format.background.transparency > 0) {
            const alpha = 1 - format.background.transparency / 100;
            styles.backgroundColor = hexToRgba(format.background.color, alpha);
        }
    }

    // Border
    if (format.border.show) {
        styles.border = `${format.border.width}px solid ${format.border.color}`;
        styles.borderRadius = `${format.border.radius}px`;
    } else {
        styles.borderRadius = `${format.border.radius}px`;
    }

    // Shadow
    if (format.shadow.show) {
        styles.boxShadow = `${format.shadow.offsetX}px ${format.shadow.offsetY}px ${format.shadow.blur}px ${format.shadow.spread}px ${format.shadow.color}`;
    }

    // Padding
    styles.padding = `${format.padding.top}px ${format.padding.right}px ${format.padding.bottom}px ${format.padding.left}px`;

    return styles;
}

/**
 * Convert hex color to rgba
 */
export function hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate conditional format color for a value
 */
export function getConditionalColor(
    value: number,
    rule: ConditionalFormatRule
): string | null {
    if (!rule.enabled) return null;

    switch (rule.type) {
        case 'colorScale': {
            const min = rule.minValue ?? 0;
            const max = rule.maxValue ?? 100;
            const mid = rule.midValue ?? (min + max) / 2;
            const normalized = (value - min) / (max - min);

            if (normalized <= 0.5 && rule.minColor && rule.midColor) {
                return interpolateColor(rule.minColor, rule.midColor, normalized * 2);
            } else if (rule.midColor && rule.maxColor) {
                return interpolateColor(rule.midColor, rule.maxColor, (normalized - 0.5) * 2);
            }
            return null;
        }

        case 'colorRules': {
            if (!rule.rules) return null;
            for (const r of rule.rules) {
                switch (r.operator) {
                    case 'greaterThan':
                        if (value > Number(r.value)) return r.color;
                        break;
                    case 'lessThan':
                        if (value < Number(r.value)) return r.color;
                        break;
                    case 'equals':
                        if (value === Number(r.value)) return r.color;
                        break;
                    case 'between':
                        if (value >= Number(r.value) && value <= Number(r.value2)) return r.color;
                        break;
                }
            }
            return null;
        }

        default:
            return null;
    }
}

/**
 * Interpolate between two colors
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
