/**
 * Cross-Filter Context for Power BI-style visual interactions
 * Provides global state management for cross-filtering across dashboard
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CrossFilter, crossFilterEngine, InteractionMode } from '../lib/crossFilterEngine';
import { FilterRule } from '../components/developer/FilterPane';

interface CrossFilterContextValue {
    // Cross-filter state
    crossFilters: CrossFilter[];
    addCrossFilter: (filter: CrossFilter) => void;
    removeCrossFilter: (filterId: string) => void;
    removeCrossFiltersFromWidget: (widgetId: string) => void;
    clearAllCrossFilters: () => void;
    getCrossFiltersForWidget: (widgetId: string) => CrossFilter[];

    // Interaction configuration
    setInteraction: (sourceWidgetId: string, targetWidgetId: string, mode: InteractionMode) => void;
    getInteraction: (sourceWidgetId: string, targetWidgetId: string) => InteractionMode;

    // Slicer filters (global slicers)
    slicerFilters: FilterRule[];
    addSlicerFilter: (filter: FilterRule) => void;
    updateSlicerFilter: (filterId: string, updates: Partial<FilterRule>) => void;
    removeSlicerFilter: (filterId: string) => void;

    // Page-level filters
    pageFilters: FilterRule[];
    addPageFilter: (filter: FilterRule) => void;
    updatePageFilter: (filterId: string, updates: Partial<FilterRule>) => void;
    removePageFilter: (filterId: string) => void;

    // Report-level filters
    reportFilters: FilterRule[];
    addReportFilter: (filter: FilterRule) => void;
    updateReportFilter: (filterId: string, updates: Partial<FilterRule>) => void;
    removeReportFilter: (filterId: string) => void;

    // Clear all filters
    clearAllFilters: () => void;
}

const CrossFilterContext = createContext<CrossFilterContextValue | undefined>(undefined);

export function CrossFilterProvider({ children }: { children: React.ReactNode }) {
    const [crossFilters, setCrossFilters] = useState<CrossFilter[]>([]);
    const [slicerFilters, setSlicerFilters] = useState<FilterRule[]>([]);
    const [pageFilters, setPageFilters] = useState<FilterRule[]>([]);
    const [reportFilters, setReportFilters] = useState<FilterRule[]>([]);

    // Sync with cross-filter engine
    useEffect(() => {
        const unsubscribe = crossFilterEngine.subscribe(() => {
            setCrossFilters([...crossFilterEngine.getCrossFilters()]);
        });
        return unsubscribe;
    }, []);

    // Cross-filter operations
    const addCrossFilter = useCallback((filter: CrossFilter) => {
        crossFilterEngine.addCrossFilter(filter);
    }, []);

    const removeCrossFilter = useCallback((filterId: string) => {
        crossFilterEngine.removeCrossFilter(filterId);
    }, []);

    const removeCrossFiltersFromWidget = useCallback((widgetId: string) => {
        crossFilterEngine.removeCrossFiltersFromWidget(widgetId);
    }, []);

    const clearAllCrossFilters = useCallback(() => {
        crossFilterEngine.clearAllCrossFilters();
    }, []);

    const getCrossFiltersForWidget = useCallback((widgetId: string) => {
        return crossFilterEngine.getCrossFiltersForWidget(widgetId);
    }, []);

    // Interaction configuration
    const setInteraction = useCallback((sourceWidgetId: string, targetWidgetId: string, mode: InteractionMode) => {
        crossFilterEngine.setInteraction(sourceWidgetId, targetWidgetId, mode);
    }, []);

    const getInteraction = useCallback((sourceWidgetId: string, targetWidgetId: string) => {
        return crossFilterEngine.getInteraction(sourceWidgetId, targetWidgetId);
    }, []);

    // Slicer filter operations
    const addSlicerFilter = useCallback((filter: FilterRule) => {
        setSlicerFilters(prev => [...prev, filter]);
    }, []);

    const updateSlicerFilter = useCallback((filterId: string, updates: Partial<FilterRule>) => {
        setSlicerFilters(prev =>
            prev.map(f => f.id === filterId ? { ...f, ...updates } : f)
        );
    }, []);

    const removeSlicerFilter = useCallback((filterId: string) => {
        setSlicerFilters(prev => prev.filter(f => f.id !== filterId));
    }, []);

    // Page filter operations
    const addPageFilter = useCallback((filter: FilterRule) => {
        setPageFilters(prev => [...prev, filter]);
    }, []);

    const updatePageFilter = useCallback((filterId: string, updates: Partial<FilterRule>) => {
        setPageFilters(prev =>
            prev.map(f => f.id === filterId ? { ...f, ...updates } : f)
        );
    }, []);

    const removePageFilter = useCallback((filterId: string) => {
        setPageFilters(prev => prev.filter(f => f.id !== filterId));
    }, []);

    // Report filter operations
    const addReportFilter = useCallback((filter: FilterRule) => {
        setReportFilters(prev => [...prev, filter]);
    }, []);

    const updateReportFilter = useCallback((filterId: string, updates: Partial<FilterRule>) => {
        setReportFilters(prev =>
            prev.map(f => f.id === filterId ? { ...f, ...updates } : f)
        );
    }, []);

    const removeReportFilter = useCallback((filterId: string) => {
        setReportFilters(prev => prev.filter(f => f.id !== filterId));
    }, []);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        clearAllCrossFilters();
        setSlicerFilters([]);
        setPageFilters([]);
        setReportFilters([]);
    }, [clearAllCrossFilters]);

    const value: CrossFilterContextValue = {
        crossFilters,
        addCrossFilter,
        removeCrossFilter,
        removeCrossFiltersFromWidget,
        clearAllCrossFilters,
        getCrossFiltersForWidget,
        setInteraction,
        getInteraction,
        slicerFilters,
        addSlicerFilter,
        updateSlicerFilter,
        removeSlicerFilter,
        pageFilters,
        addPageFilter,
        updatePageFilter,
        removePageFilter,
        reportFilters,
        addReportFilter,
        updateReportFilter,
        removeReportFilter,
        clearAllFilters,
    };

    return (
        <CrossFilterContext.Provider value={value}>
            {children}
        </CrossFilterContext.Provider>
    );
}

export function useCrossFilter() {
    const context = useContext(CrossFilterContext);
    if (!context) {
        throw new Error('useCrossFilter must be used within CrossFilterProvider');
    }
    return context;
}
