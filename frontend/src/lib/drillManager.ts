/**
 * Drill-Down and Drill-Through Manager for Power BI-style hierarchical navigation
 */

export interface DrillPath {
    id: string;
    name: string;
    levels: DrillLevel[];
}

export interface DrillLevel {
    field: string;
    displayName: string;
    order: number;
}

export interface DrillState {
    widgetId: string;
    pathId: string;
    currentLevel: number;
    filters: DrillFilter[];
}

export interface DrillFilter {
    level: number;
    field: string;
    value: any;
}

export interface DrillThroughTarget {
    targetWidgetId: string;
    targetType: 'table' | 'detail' | 'custom';
    fields?: string[]; // Fields to show in drill-through
}

/**
 * Common drill-down hierarchies
 */
export const COMMON_DRILL_PATHS: DrillPath[] = [
    {
        id: 'date-hierarchy',
        name: 'Date Hierarchy',
        levels: [
            { field: 'year', displayName: 'Year', order: 0 },
            { field: 'quarter', displayName: 'Quarter', order: 1 },
            { field: 'month', displayName: 'Month', order: 2 },
            { field: 'day', displayName: 'Day', order: 3 },
        ],
    },
    {
        id: 'geography-hierarchy',
        name: 'Geography Hierarchy',
        levels: [
            { field: 'country', displayName: 'Country', order: 0 },
            { field: 'region', displayName: 'Region', order: 1 },
            { field: 'city', displayName: 'City', order: 2 },
        ],
    },
    {
        id: 'product-hierarchy',
        name: 'Product Hierarchy',
        levels: [
            { field: 'category', displayName: 'Category', order: 0 },
            { field: 'subcategory', displayName: 'Subcategory', order: 1 },
            { field: 'product', displayName: 'Product', order: 2 },
        ],
    },
];

/**
 * Drill-down manager
 */
export class DrillManager {
    private drillStates: Map<string, DrillState> = new Map();
    private drillPaths: Map<string, DrillPath> = new Map();
    private listeners: Set<() => void> = new Set();

    constructor() {
        // Initialize with common drill paths
        COMMON_DRILL_PATHS.forEach(path => {
            this.drillPaths.set(path.id, path);
        });
    }

    /**
     * Register a custom drill path
     */
    registerDrillPath(path: DrillPath): void {
        this.drillPaths.set(path.id, path);
    }

    /**
     * Get all available drill paths
     */
    getDrillPaths(): DrillPath[] {
        return Array.from(this.drillPaths.values());
    }

    /**
     * Get drill path by ID
     */
    getDrillPath(pathId: string): DrillPath | undefined {
        return this.drillPaths.get(pathId);
    }

    /**
     * Infer drill path from available fields
     */
    inferDrillPath(fields: string[]): DrillPath | null {
        const lowerFields = fields.map(f => f.toLowerCase());

        // Check for date hierarchy
        const dateFields = ['year', 'quarter', 'month', 'day', 'date'];
        const hasDateHierarchy = dateFields.filter(df => lowerFields.some(f => f.includes(df))).length >= 2;
        if (hasDateHierarchy) {
            return this.drillPaths.get('date-hierarchy') || null;
        }

        // Check for geography hierarchy
        const geoFields = ['country', 'region', 'state', 'city'];
        const hasGeoHierarchy = geoFields.filter(gf => lowerFields.some(f => f.includes(gf))).length >= 2;
        if (hasGeoHierarchy) {
            return this.drillPaths.get('geography-hierarchy') || null;
        }

        // Check for product hierarchy
        const productFields = ['category', 'subcategory', 'product'];
        const hasProductHierarchy = productFields.filter(pf => lowerFields.some(f => f.includes(pf))).length >= 2;
        if (hasProductHierarchy) {
            return this.drillPaths.get('product-hierarchy') || null;
        }

        return null;
    }

    /**
     * Start drill-down on a widget
     */
    startDrillDown(widgetId: string, pathId: string): void {
        const path = this.drillPaths.get(pathId);
        if (!path) return;

        this.drillStates.set(widgetId, {
            widgetId,
            pathId,
            currentLevel: 0,
            filters: [],
        });

        this.notifyListeners();
    }

    /**
     * Drill down to next level
     */
    drillDown(widgetId: string, value: any): void {
        const state = this.drillStates.get(widgetId);
        if (!state) return;

        const path = this.drillPaths.get(state.pathId);
        if (!path) return;

        // Can't drill down past the last level
        if (state.currentLevel >= path.levels.length - 1) return;

        const currentLevelField = path.levels[state.currentLevel].field;

        // Add filter for current level
        state.filters.push({
            level: state.currentLevel,
            field: currentLevelField,
            value,
        });

        // Move to next level
        state.currentLevel++;

        this.drillStates.set(widgetId, state);
        this.notifyListeners();
    }

    /**
     * Drill up to previous level
     */
    drillUp(widgetId: string): void {
        const state = this.drillStates.get(widgetId);
        if (!state) return;

        // Can't drill up from the top level
        if (state.currentLevel === 0) return;

        // Move to previous level
        state.currentLevel--;

        // Remove filter for current level
        state.filters = state.filters.filter(f => f.level < state.currentLevel);

        this.drillStates.set(widgetId, state);
        this.notifyListeners();
    }

    /**
     * Reset drill state for a widget
     */
    resetDrill(widgetId: string): void {
        this.drillStates.delete(widgetId);
        this.notifyListeners();
    }

    /**
     * Get current drill state for a widget
     */
    getDrillState(widgetId: string): DrillState | undefined {
        return this.drillStates.get(widgetId);
    }

    /**
     * Get current drill level field for a widget
     */
    getCurrentLevelField(widgetId: string): string | undefined {
        const state = this.drillStates.get(widgetId);
        if (!state) return undefined;

        const path = this.drillPaths.get(state.pathId);
        if (!path) return undefined;

        return path.levels[state.currentLevel]?.field;
    }

    /**
     * Get drill filters for a widget
     */
    getDrillFilters(widgetId: string): DrillFilter[] {
        const state = this.drillStates.get(widgetId);
        return state?.filters || [];
    }

    /**
     * Check if widget is in drill mode
     */
    isDrilling(widgetId: string): boolean {
        return this.drillStates.has(widgetId);
    }

    /**
     * Check if can drill down further
     */
    canDrillDown(widgetId: string): boolean {
        const state = this.drillStates.get(widgetId);
        if (!state) return false;

        const path = this.drillPaths.get(state.pathId);
        if (!path) return false;

        return state.currentLevel < path.levels.length - 1;
    }

    /**
     * Check if can drill up
     */
    canDrillUp(widgetId: string): boolean {
        const state = this.drillStates.get(widgetId);
        if (!state) return false;

        return state.currentLevel > 0;
    }

    /**
     * Subscribe to drill state changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of state changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }
}

/**
 * Apply drill filters to data
 */
export function applyDrillFilters(data: any[], filters: DrillFilter[]): any[] {
    if (!data || data.length === 0) return data;
    if (!filters || filters.length === 0) return data;

    let result = data;

    for (const filter of filters) {
        result = result.filter(row => row[filter.field] === filter.value);
    }

    return result;
}

/**
 * Extract date hierarchy from date field
 */
export function extractDateHierarchy(date: Date | string | number): {
    year: number;
    quarter: number;
    month: number;
    day: number;
} {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
        return { year: 0, quarter: 0, month: 0, day: 0 };
    }

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    const day = d.getDate();

    return { year, quarter, month, day };
}

/**
 * Enrich data with date hierarchy fields
 */
export function enrichWithDateHierarchy(data: any[], dateField: string): any[] {
    return data.map(row => {
        const dateValue = row[dateField];
        if (!dateValue) return row;

        const hierarchy = extractDateHierarchy(dateValue);
        return {
            ...row,
            year: hierarchy.year,
            quarter: `Q${hierarchy.quarter}`,
            month: new Date(hierarchy.year, hierarchy.month - 1).toLocaleString('default', { month: 'long' }),
            day: hierarchy.day,
        };
    });
}

// Singleton instance
export const drillManager = new DrillManager();
