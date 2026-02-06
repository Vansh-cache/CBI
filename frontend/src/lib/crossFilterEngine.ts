/**
 * Cross-Filter Engine for Power BI-style visual interactions
 * Manages global filter state and widget-to-widget filtering
 */

import { FilterRule } from '../components/developer/FilterPane';

export type InteractionMode = 'filter' | 'highlight' | 'none';

export interface VisualInteraction {
    sourceWidgetId: string;
    targetWidgetId: string;
    mode: InteractionMode;
}

export interface CrossFilter {
    id: string;
    sourceWidgetId: string;
    field: string;
    values: any[];
    operator: 'in' | 'not-in' | 'equals' | 'not-equals';
    timestamp: number;
}

export interface FilterContext {
    crossFilters: CrossFilter[];
    slicerFilters: FilterRule[];
    pageFilters: FilterRule[];
    reportFilters: FilterRule[];
}

/**
 * Global filter state manager
 */
export class CrossFilterEngine {
    private filters: CrossFilter[] = [];
    private interactions: Map<string, VisualInteraction[]> = new Map();
    private listeners: Set<() => void> = new Set();

    /**
     * Add a cross-filter from a visual interaction
     */
    addCrossFilter(filter: CrossFilter): void {
        // Remove existing filters from the same source widget and field
        this.filters = this.filters.filter(
            f => !(f.sourceWidgetId === filter.sourceWidgetId && f.field === filter.field)
        );

        // Add new filter
        this.filters.push(filter);
        this.notifyListeners();
    }

    /**
     * Remove cross-filter by ID
     */
    removeCrossFilter(filterId: string): void {
        this.filters = this.filters.filter(f => f.id !== filterId);
        this.notifyListeners();
    }

    /**
     * Remove all cross-filters from a specific widget
     */
    removeCrossFiltersFromWidget(widgetId: string): void {
        this.filters = this.filters.filter(f => f.sourceWidgetId !== widgetId);
        this.notifyListeners();
    }

    /**
     * Clear all cross-filters
     */
    clearAllCrossFilters(): void {
        this.filters = [];
        this.notifyListeners();
    }

    /**
     * Get all active cross-filters
     */
    getCrossFilters(): CrossFilter[] {
        return [...this.filters];
    }

    /**
     * Get cross-filters that should affect a specific widget
     */
    getCrossFiltersForWidget(widgetId: string): CrossFilter[] {
        return this.filters.filter(f => {
            // Don't apply filter to the source widget itself
            if (f.sourceWidgetId === widgetId) return false;

            // Check if interaction is allowed
            const interactions = this.interactions.get(f.sourceWidgetId) || [];
            const interaction = interactions.find(i => i.targetWidgetId === widgetId);

            // If no specific interaction defined, default to filter mode
            if (!interaction) return true;

            return interaction.mode === 'filter' || interaction.mode === 'highlight';
        });
    }

    /**
     * Set interaction mode between two widgets
     */
    setInteraction(sourceWidgetId: string, targetWidgetId: string, mode: InteractionMode): void {
        const interactions = this.interactions.get(sourceWidgetId) || [];
        const existingIndex = interactions.findIndex(i => i.targetWidgetId === targetWidgetId);

        if (existingIndex >= 0) {
            interactions[existingIndex].mode = mode;
        } else {
            interactions.push({ sourceWidgetId, targetWidgetId, mode });
        }

        this.interactions.set(sourceWidgetId, interactions);
        this.notifyListeners();
    }

    /**
     * Get interaction mode between two widgets
     */
    getInteraction(sourceWidgetId: string, targetWidgetId: string): InteractionMode {
        const interactions = this.interactions.get(sourceWidgetId) || [];
        const interaction = interactions.find(i => i.targetWidgetId === targetWidgetId);
        return interaction?.mode || 'filter'; // Default to filter mode
    }

    /**
     * Subscribe to filter changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of filter changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }
}

/**
 * Apply cross-filters to data
 */
export function applyCrossFilters(data: any[], filters: CrossFilter[]): any[] {
    if (!data || data.length === 0) return data;
    if (!filters || filters.length === 0) return data;

    let result = data;

    for (const filter of filters) {
        result = result.filter(row => {
            const value = row[filter.field];

            switch (filter.operator) {
                case 'in':
                    return filter.values.includes(value);

                case 'not-in':
                    return !filter.values.includes(value);

                case 'equals':
                    return filter.values.length > 0 && value === filter.values[0];

                case 'not-equals':
                    return filter.values.length > 0 && value !== filter.values[0];

                default:
                    return true;
            }
        });
    }

    return result;
}

/**
 * Apply highlight filter (returns original data with highlight flags)
 */
export function applyHighlightFilter(
    data: any[],
    filters: CrossFilter[]
): Array<any & { __highlighted?: boolean }> {
    if (!data || data.length === 0) return data;
    if (!filters || filters.length === 0) return data.map(d => ({ ...d, __highlighted: true }));

    return data.map(row => {
        let highlighted = true;

        for (const filter of filters) {
            const value = row[filter.field];
            let matches = false;

            switch (filter.operator) {
                case 'in':
                    matches = filter.values.includes(value);
                    break;

                case 'not-in':
                    matches = !filter.values.includes(value);
                    break;

                case 'equals':
                    matches = filter.values.length > 0 && value === filter.values[0];
                    break;

                case 'not-equals':
                    matches = filter.values.length > 0 && value !== filter.values[0];
                    break;

                default:
                    matches = true;
            }

            if (!matches) {
                highlighted = false;
                break;
            }
        }

        return { ...row, __highlighted: highlighted };
    });
}

/**
 * Combine all filter types into a single filter context
 */
export function createFilterContext(
    crossFilters: CrossFilter[],
    slicerFilters: FilterRule[],
    pageFilters: FilterRule[],
    reportFilters: FilterRule[]
): FilterContext {
    return {
        crossFilters,
        slicerFilters,
        pageFilters,
        reportFilters,
    };
}

/**
 * Apply all filters from context to data
 */
export function applyFilterContext(data: any[], context: FilterContext, widgetId: string): any[] {
    if (!data || data.length === 0) return data;

    let result = data;

    // Apply report-level filters (always apply)
    result = applyFilterRules(result, context.reportFilters);

    // Apply page-level filters
    result = applyFilterRules(result, context.pageFilters);

    // Apply slicer filters
    result = applyFilterRules(result, context.slicerFilters);

    // Apply cross-filters (excluding filters from this widget)
    const relevantCrossFilters = context.crossFilters.filter(f => f.sourceWidgetId !== widgetId);
    result = applyCrossFilters(result, relevantCrossFilters);

    return result;
}

/**
 * Apply filter rules to data
 */
function applyFilterRules(data: any[], rules: FilterRule[]): any[] {
    if (!rules || rules.length === 0) return data;

    let result = data;

    for (const rule of rules) {
        if (!rule.isEnabled) continue;

        result = result.filter(row => {
            const value = row[rule.field];

            if (!rule.values || rule.values.length === 0) return true;

            switch (rule.operator) {
                case 'equals':
                    return rule.values.includes(String(value));

                case 'not-equals':
                    return !rule.values.includes(String(value));

                case 'contains':
                    return rule.values.some(v => String(value).toLowerCase().includes(v.toLowerCase()));

                case 'starts-with':
                    return rule.values.some(v => String(value).toLowerCase().startsWith(v.toLowerCase()));

                case 'in':
                    return rule.values.includes(String(value));

                case 'not-in':
                    return !rule.values.includes(String(value));

                case 'greater-than':
                    return rule.values.length > 0 && Number(value) > Number(rule.values[0]);

                case 'less-than':
                    return rule.values.length > 0 && Number(value) < Number(rule.values[0]);

                case 'between':
                    return rule.values.length >= 2 &&
                        Number(value) >= Number(rule.values[0]) &&
                        Number(value) <= Number(rule.values[1]);

                default:
                    return true;
            }
        });
    }

    return result;
}

// Singleton instance
export const crossFilterEngine = new CrossFilterEngine();
