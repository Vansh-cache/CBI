/**
 * Tooltip Manager for Power BI-style interactive tooltips
 * Supports default tooltips, custom tooltip pages, and context-aware data
 */

import { ReactNode } from 'react';

export interface TooltipField {
    label: string;
    value: string | number;
    format?: string;
    color?: string;
    icon?: string;
}

export interface TooltipData {
    title?: string;
    category?: string;
    fields: TooltipField[];
    customContent?: ReactNode;
    position?: { x: number; y: number };
    visible: boolean;
}

export interface TooltipPageConfig {
    id: string;
    name: string;
    widgetIds: string[]; // Widgets to show in tooltip
    width: number;
    height: number;
}

export interface TooltipSettings {
    enabled: boolean;
    showCategory: boolean;
    showValue: boolean;
    showPercent: boolean;
    showTrend: boolean;
    delay: number;
    duration: number;
    customPageId?: string; // Reference to custom tooltip page
}

/**
 * Format value based on format type
 */
export function formatTooltipValue(
    value: number | string,
    format?: string
): string {
    if (typeof value === 'string') return value;

    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);

        case 'percent':
            return new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            }).format(value / 100);

        case 'decimal':
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);

        case 'integer':
            return new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 0,
            }).format(value);

        case 'thousands':
            if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}K`;
            }
            return value.toLocaleString();

        case 'scientific':
            return value.toExponential(2);

        default:
            return typeof value === 'number' ? value.toLocaleString() : String(value);
    }
}

/**
 * Calculate trend indicator
 */
export function calculateTrend(
    currentValue: number,
    previousValue: number
): { direction: 'up' | 'down' | 'flat'; percentage: number; color: string } {
    if (previousValue === 0) {
        return { direction: 'flat', percentage: 0, color: '#6b7280' };
    }

    const change = ((currentValue - previousValue) / previousValue) * 100;

    if (Math.abs(change) < 0.1) {
        return { direction: 'flat', percentage: 0, color: '#6b7280' };
    }

    return {
        direction: change > 0 ? 'up' : 'down',
        percentage: Math.abs(change),
        color: change > 0 ? '#22c55e' : '#ef4444',
    };
}

/**
 * Build tooltip data from data point
 */
export function buildTooltipData(
    dataPoint: Record<string, any>,
    config: {
        categoryField?: string;
        valueField?: string;
        legendField?: string;
        additionalFields?: string[];
        valueFormat?: string;
        showPercent?: boolean;
        total?: number;
    }
): TooltipData {
    const fields: TooltipField[] = [];

    // Category
    if (config.categoryField && dataPoint[config.categoryField] !== undefined) {
        fields.push({
            label: config.categoryField,
            value: dataPoint[config.categoryField],
        });
    }

    // Value
    if (config.valueField && dataPoint[config.valueField] !== undefined) {
        const value = dataPoint[config.valueField];
        fields.push({
            label: config.valueField,
            value: formatTooltipValue(value, config.valueFormat),
        });

        // Percent of total
        if (config.showPercent && config.total && typeof value === 'number') {
            const percent = (value / config.total) * 100;
            fields.push({
                label: '% of Total',
                value: `${percent.toFixed(1)}%`,
            });
        }
    }

    // Legend
    if (config.legendField && dataPoint[config.legendField] !== undefined) {
        fields.push({
            label: config.legendField,
            value: dataPoint[config.legendField],
        });
    }

    // Additional fields
    if (config.additionalFields) {
        for (const field of config.additionalFields) {
            if (dataPoint[field] !== undefined) {
                fields.push({
                    label: field,
                    value: dataPoint[field],
                });
            }
        }
    }

    return {
        title: config.categoryField ? String(dataPoint[config.categoryField] || '') : undefined,
        category: config.categoryField ? String(dataPoint[config.categoryField] || '') : undefined,
        fields,
        visible: true,
    };
}

/**
 * Calculate tooltip position to keep it within viewport
 */
export function calculateTooltipPosition(
    mouseX: number,
    mouseY: number,
    tooltipWidth: number,
    tooltipHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    offset: number = 10
): { x: number; y: number } {
    let x = mouseX + offset;
    let y = mouseY + offset;

    // Flip horizontally if too close to right edge
    if (x + tooltipWidth > viewportWidth - offset) {
        x = mouseX - tooltipWidth - offset;
    }

    // Flip vertically if too close to bottom edge
    if (y + tooltipHeight > viewportHeight - offset) {
        y = mouseY - tooltipHeight - offset;
    }

    // Ensure minimum position
    x = Math.max(offset, x);
    y = Math.max(offset, y);

    return { x, y };
}

/**
 * Tooltip manager for coordinating tooltips across visuals
 */
export class TooltipManager {
    private activeTooltip: TooltipData | null = null;
    private listeners: Set<(tooltip: TooltipData | null) => void> = new Set();
    private hideTimeout: ReturnType<typeof setTimeout> | null = null;
    private showTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(private settings: TooltipSettings = {
        enabled: true,
        showCategory: true,
        showValue: true,
        showPercent: false,
        showTrend: false,
        delay: 200,
        duration: 0,
    }) { }

    /**
     * Show tooltip after delay
     */
    show(data: Omit<TooltipData, 'visible'>): void {
        if (!this.settings.enabled) return;

        // Clear any pending hide
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Clear any pending show
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }

        this.showTimeout = setTimeout(() => {
            this.activeTooltip = { ...data, visible: true };
            this.notifyListeners();
        }, this.settings.delay);
    }

    /**
     * Hide tooltip
     */
    hide(): void {
        // Clear any pending show
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }

        if (this.settings.duration > 0) {
            this.hideTimeout = setTimeout(() => {
                this.activeTooltip = null;
                this.notifyListeners();
            }, this.settings.duration);
        } else {
            this.activeTooltip = null;
            this.notifyListeners();
        }
    }

    /**
     * Update tooltip position
     */
    updatePosition(x: number, y: number): void {
        if (this.activeTooltip) {
            this.activeTooltip.position = { x, y };
            this.notifyListeners();
        }
    }

    /**
     * Get current tooltip
     */
    getTooltip(): TooltipData | null {
        return this.activeTooltip;
    }

    /**
     * Subscribe to tooltip changes
     */
    subscribe(listener: (tooltip: TooltipData | null) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Update settings
     */
    updateSettings(settings: Partial<TooltipSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.activeTooltip));
    }
}

// Global tooltip manager instance
export const globalTooltipManager = new TooltipManager();

/**
 * Create tooltip content for chart types
 */
export function createChartTooltipContent(
    chartType: string,
    dataPoint: Record<string, any>,
    config: {
        xAxis?: string;
        yAxis?: string;
        legend?: string;
        valueFormat?: string;
    }
): TooltipField[] {
    const fields: TooltipField[] = [];

    switch (chartType) {
        case 'bar':
        case 'column':
        case 'line':
        case 'area':
            if (config.xAxis && dataPoint[config.xAxis] !== undefined) {
                fields.push({ label: config.xAxis, value: dataPoint[config.xAxis] });
            }
            if (config.yAxis && dataPoint[config.yAxis] !== undefined) {
                fields.push({
                    label: config.yAxis,
                    value: formatTooltipValue(dataPoint[config.yAxis], config.valueFormat),
                });
            }
            if (config.legend && dataPoint[config.legend] !== undefined) {
                fields.push({ label: config.legend, value: dataPoint[config.legend] });
            }
            break;

        case 'pie':
        case 'donut':
            if (dataPoint.name !== undefined) {
                fields.push({ label: 'Category', value: dataPoint.name });
            }
            if (dataPoint.value !== undefined) {
                fields.push({
                    label: 'Value',
                    value: formatTooltipValue(dataPoint.value, config.valueFormat),
                });
            }
            if (dataPoint.percent !== undefined) {
                fields.push({ label: 'Percentage', value: `${dataPoint.percent.toFixed(1)}%` });
            }
            break;

        case 'scatter':
            if (config.xAxis && dataPoint[config.xAxis] !== undefined) {
                fields.push({
                    label: config.xAxis,
                    value: formatTooltipValue(dataPoint[config.xAxis], config.valueFormat),
                });
            }
            if (config.yAxis && dataPoint[config.yAxis] !== undefined) {
                fields.push({
                    label: config.yAxis,
                    value: formatTooltipValue(dataPoint[config.yAxis], config.valueFormat),
                });
            }
            break;

        case 'treemap':
            if (dataPoint.name !== undefined) {
                fields.push({ label: 'Name', value: dataPoint.name });
            }
            if (dataPoint.value !== undefined) {
                fields.push({
                    label: 'Size',
                    value: formatTooltipValue(dataPoint.value, config.valueFormat),
                });
            }
            break;

        default:
            // Generic tooltip - show all numeric and string fields
            for (const [key, value] of Object.entries(dataPoint)) {
                if (typeof value === 'number' || typeof value === 'string') {
                    fields.push({
                        label: key,
                        value: typeof value === 'number' ? formatTooltipValue(value, config.valueFormat) : value,
                    });
                }
            }
    }

    return fields;
}
