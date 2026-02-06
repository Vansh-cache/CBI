/**
 * Drill Navigation Component - Power BI-style drill-down and drill-through
 * Supports: Drill down, Drill up, Drill through, Show next level, Expand all
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Layers,
    ExternalLink,
    ArrowLeft,
    History,
    Home,
    MoreHorizontal,
    Maximize2,
    Minimize2,
} from 'lucide-react';

// Hierarchy Level
export interface HierarchyLevel {
    fieldName: string;
    displayName: string;
    values?: any[];
}

// Drill Context
export interface DrillContext {
    hierarchy: HierarchyLevel[];
    currentLevel: number;
    expandedNodes: Set<string>; // For drill down on specific items
    filterPath: Array<{ field: string; value: any }>;
    drillThroughTarget?: {
        pageName: string;
        pageId: string;
        filters: Array<{ field: string; value: any }>;
    };
}

// Drill Action
export type DrillAction =
    | 'drillDown' | 'drillUp' | 'showNextLevel' | 'expandAll'
    | 'drillThrough' | 'resetDrill';

// Drill Mode
export type DrillMode = 'none' | 'drillDown' | 'expandAll' | 'showNextLevel';

interface DrillNavigationProps {
    context: DrillContext;
    onDrillAction: (action: DrillAction, payload?: any) => void;
    drillThroughPages?: Array<{ id: string; name: string }>;
    mode: 'light' | 'dark';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    minimal?: boolean;
}

export const DrillNavigation: React.FC<DrillNavigationProps> = ({
    context,
    onDrillAction,
    drillThroughPages = [],
    mode,
    position = 'top-right',
    minimal = false,
}) => {
    const isDark = mode === 'dark';
    const [showDrillThrough, setShowDrillThrough] = useState(false);

    const canDrillDown = context.currentLevel < context.hierarchy.length - 1;
    const canDrillUp = context.currentLevel > 0 || context.filterPath.length > 0;
    const hasDrillThrough = drillThroughPages.length > 0;

    const currentLevelName = context.hierarchy[context.currentLevel]?.displayName || 'Root';

    // Position classes
    const positionClasses = {
        'top-left': 'top-2 left-2',
        'top-right': 'top-2 right-2',
        'bottom-left': 'bottom-2 left-2',
        'bottom-right': 'bottom-2 right-2',
    };

    if (minimal) {
        return (
            <div className={`absolute ${positionClasses[position]} flex items-center gap-1 z-10`}>
                {canDrillUp && (
                    <button
                        onClick={() => onDrillAction('drillUp')}
                        className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                        title="Drill up"
                    >
                        <ChevronUp className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                    </button>
                )}
                {canDrillDown && (
                    <button
                        onClick={() => onDrillAction('drillDown')}
                        className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                        title="Drill down"
                    >
                        <ChevronDown className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                    </button>
                )}
                {hasDrillThrough && (
                    <button
                        onClick={() => setShowDrillThrough(!showDrillThrough)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                        title="Drill through"
                    >
                        <ExternalLink className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            className={`absolute ${positionClasses[position]} z-10 rounded-lg border shadow-lg overflow-hidden`}
            style={{
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                backdropFilter: 'blur(8px)',
            }}
        >
            {/* Current Level Display */}
            <div
                className="px-3 py-2 border-b flex items-center gap-2"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
            >
                <Layers className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                <span
                    className="text-xs font-medium"
                    style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}
                >
                    Level: {currentLevelName}
                </span>
                {context.filterPath.length > 0 && (
                    <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                        }}
                    >
                        {context.filterPath.length} filters
                    </span>
                )}
            </div>

            {/* Drill Actions */}
            <div className="p-1.5 flex items-center gap-1">
                {/* Drill Up */}
                <button
                    onClick={() => onDrillAction('drillUp')}
                    disabled={!canDrillUp}
                    className={`p-2 rounded-md transition-colors ${canDrillUp ? 'hover:bg-black/5 dark:hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
                        }`}
                    title="Drill up"
                >
                    <ChevronUp className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                </button>

                {/* Drill Down */}
                <button
                    onClick={() => onDrillAction('drillDown')}
                    disabled={!canDrillDown}
                    className={`p-2 rounded-md transition-colors ${canDrillDown ? 'hover:bg-black/5 dark:hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
                        }`}
                    title="Drill down"
                >
                    <ChevronDown className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                </button>

                {/* Separator */}
                <div
                    className="w-px h-5 mx-1"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                />

                {/* Show Next Level */}
                <button
                    onClick={() => onDrillAction('showNextLevel')}
                    disabled={!canDrillDown}
                    className={`p-2 rounded-md transition-colors ${canDrillDown ? 'hover:bg-black/5 dark:hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
                        }`}
                    title="Show next level"
                >
                    <ChevronRight className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                </button>

                {/* Expand All */}
                <button
                    onClick={() => onDrillAction('expandAll')}
                    disabled={!canDrillDown}
                    className={`p-2 rounded-md transition-colors ${canDrillDown ? 'hover:bg-black/5 dark:hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
                        }`}
                    title="Expand all"
                >
                    <Maximize2 className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                </button>

                {/* Separator */}
                {hasDrillThrough && (
                    <div
                        className="w-px h-5 mx-1"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    />
                )}

                {/* Drill Through */}
                {hasDrillThrough && (
                    <div className="relative">
                        <button
                            onClick={() => setShowDrillThrough(!showDrillThrough)}
                            className="p-2 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                            title="Drill through"
                        >
                            <ExternalLink className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                        </button>

                        {showDrillThrough && (
                            <div
                                className="absolute top-full right-0 mt-1 py-1 rounded-lg border shadow-xl min-w-[140px]"
                                style={{
                                    backgroundColor: isDark ? '#1f2937' : '#fff',
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                }}
                            >
                                {drillThroughPages.map(page => (
                                    <button
                                        key={page.id}
                                        onClick={() => {
                                            onDrillAction('drillThrough', page);
                                            setShowDrillThrough(false);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2"
                                    >
                                        <ChevronRight className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                                        <span style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' }}>
                                            {page.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Reset */}
                {(canDrillUp || context.filterPath.length > 0) && (
                    <>
                        <div
                            className="w-px h-5 mx-1"
                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                        />
                        <button
                            onClick={() => onDrillAction('resetDrill')}
                            className="p-2 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                            title="Reset drill"
                        >
                            <Home className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// Drill Breadcrumb - Shows the current drill path
interface DrillBreadcrumbProps {
    context: DrillContext;
    onNavigate: (level: number) => void;
    mode: 'light' | 'dark';
}

export const DrillBreadcrumb: React.FC<DrillBreadcrumbProps> = ({
    context,
    onNavigate,
    mode,
}) => {
    const isDark = mode === 'dark';

    if (context.filterPath.length === 0 && context.currentLevel === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 px-3 py-1.5 flex-wrap">
            {/* Home / Root */}
            <button
                onClick={() => onNavigate(-1)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                style={{ color: '#3b82f6' }}
            >
                <Home className="w-3 h-3" />
                <span>All</span>
            </button>

            {/* Filter Path */}
            {context.filterPath.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRight
                        className="w-3 h-3"
                        style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
                    />
                    <button
                        onClick={() => onNavigate(index)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        style={{ color: index === context.filterPath.length - 1 ? (isDark ? '#f9fafb' : '#111827') : '#3b82f6' }}
                    >
                        {String(item.value)}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

// Drill Manager Hook
export const useDrillManager = (
    initialHierarchy: HierarchyLevel[],
    onDrillThrough?: (target: DrillContext['drillThroughTarget']) => void
) => {
    const [context, setContext] = useState<DrillContext>({
        hierarchy: initialHierarchy,
        currentLevel: 0,
        expandedNodes: new Set(),
        filterPath: [],
    });

    const drillDown = useCallback((value?: any) => {
        setContext(prev => {
            if (prev.currentLevel >= prev.hierarchy.length - 1) return prev;

            const newFilterPath = value !== undefined
                ? [...prev.filterPath, { field: prev.hierarchy[prev.currentLevel].fieldName, value }]
                : prev.filterPath;

            return {
                ...prev,
                currentLevel: prev.currentLevel + 1,
                filterPath: newFilterPath,
            };
        });
    }, []);

    const drillUp = useCallback(() => {
        setContext(prev => {
            if (prev.currentLevel === 0 && prev.filterPath.length === 0) return prev;

            if (prev.filterPath.length > 0) {
                return {
                    ...prev,
                    filterPath: prev.filterPath.slice(0, -1),
                    currentLevel: Math.max(0, prev.currentLevel - 1),
                };
            }

            return {
                ...prev,
                currentLevel: Math.max(0, prev.currentLevel - 1),
            };
        });
    }, []);

    const showNextLevel = useCallback(() => {
        setContext(prev => {
            if (prev.currentLevel >= prev.hierarchy.length - 1) return prev;
            return {
                ...prev,
                currentLevel: prev.currentLevel + 1,
            };
        });
    }, []);

    const expandAll = useCallback(() => {
        setContext(prev => ({
            ...prev,
            currentLevel: prev.hierarchy.length - 1,
        }));
    }, []);

    const drillThrough = useCallback((target: { id: string; name: string }) => {
        const drillThroughTarget: DrillContext['drillThroughTarget'] = {
            pageId: target.id,
            pageName: target.name,
            filters: context.filterPath,
        };

        onDrillThrough?.(drillThroughTarget);
    }, [context.filterPath, onDrillThrough]);

    const resetDrill = useCallback(() => {
        setContext(prev => ({
            ...prev,
            currentLevel: 0,
            filterPath: [],
            expandedNodes: new Set(),
        }));
    }, []);

    const navigateToLevel = useCallback((level: number) => {
        setContext(prev => {
            if (level < 0) {
                return {
                    ...prev,
                    currentLevel: 0,
                    filterPath: [],
                };
            }

            return {
                ...prev,
                filterPath: prev.filterPath.slice(0, level + 1),
                currentLevel: Math.min(level + 1, prev.hierarchy.length - 1),
            };
        });
    }, []);

    const handleDrillAction = useCallback((action: DrillAction, payload?: any) => {
        switch (action) {
            case 'drillDown':
                drillDown(payload);
                break;
            case 'drillUp':
                drillUp();
                break;
            case 'showNextLevel':
                showNextLevel();
                break;
            case 'expandAll':
                expandAll();
                break;
            case 'drillThrough':
                drillThrough(payload);
                break;
            case 'resetDrill':
                resetDrill();
                break;
        }
    }, [drillDown, drillUp, showNextLevel, expandAll, drillThrough, resetDrill]);

    return {
        context,
        drillDown,
        drillUp,
        showNextLevel,
        expandAll,
        drillThrough,
        resetDrill,
        navigateToLevel,
        handleDrillAction,
    };
};

// Hierarchy Selector - For choosing which fields form the drill hierarchy
interface HierarchySelectorProps {
    availableFields: Array<{ name: string; displayName: string }>;
    hierarchy: HierarchyLevel[];
    onHierarchyChange: (hierarchy: HierarchyLevel[]) => void;
    mode: 'light' | 'dark';
}

export const HierarchySelector: React.FC<HierarchySelectorProps> = ({
    availableFields,
    hierarchy,
    onHierarchyChange,
    mode,
}) => {
    const isDark = mode === 'dark';

    const addToHierarchy = (field: { name: string; displayName: string }) => {
        if (hierarchy.some(h => h.fieldName === field.name)) return;

        onHierarchyChange([
            ...hierarchy,
            { fieldName: field.name, displayName: field.displayName },
        ]);
    };

    const removeFromHierarchy = (index: number) => {
        const newHierarchy = [...hierarchy];
        newHierarchy.splice(index, 1);
        onHierarchyChange(newHierarchy);
    };

    const moveInHierarchy = (from: number, to: number) => {
        if (to < 0 || to >= hierarchy.length) return;

        const newHierarchy = [...hierarchy];
        const [item] = newHierarchy.splice(from, 1);
        newHierarchy.splice(to, 0, item);
        onHierarchyChange(newHierarchy);
    };

    const unusedFields = availableFields.filter(
        f => !hierarchy.some(h => h.fieldName === f.name)
    );

    return (
        <div className="space-y-4">
            {/* Current Hierarchy */}
            <div>
                <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                >
                    Drill Hierarchy
                </label>
                <div className="space-y-1">
                    {hierarchy.map((level, index) => (
                        <div
                            key={level.fieldName}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            }}
                        >
                            <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                                style={{
                                    backgroundColor: '#3b82f6',
                                    color: '#fff',
                                }}
                            >
                                {index + 1}
                            </span>
                            <span
                                className="flex-1 text-sm"
                                style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}
                            >
                                {level.displayName}
                            </span>
                            <button
                                onClick={() => moveInHierarchy(index, index - 1)}
                                disabled={index === 0}
                                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
                            >
                                <ChevronUp className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                            </button>
                            <button
                                onClick={() => moveInHierarchy(index, index + 1)}
                                disabled={index === hierarchy.length - 1}
                                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
                            >
                                <ChevronDown className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                            </button>
                            <button
                                onClick={() => removeFromHierarchy(index)}
                                className="p-1 rounded hover:bg-red-500/20"
                            >
                                <span className="text-red-400 text-lg leading-none">&times;</span>
                            </button>
                        </div>
                    ))}

                    {hierarchy.length === 0 && (
                        <div
                            className="px-3 py-4 text-center text-sm rounded-lg border-2 border-dashed"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                            }}
                        >
                            Add fields to create drill hierarchy
                        </div>
                    )}
                </div>
            </div>

            {/* Available Fields */}
            {unusedFields.length > 0 && (
                <div>
                    <label
                        className="block text-xs font-medium mb-2"
                        style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                    >
                        Available Fields
                    </label>
                    <div className="flex flex-wrap gap-1">
                        {unusedFields.map(field => (
                            <button
                                key={field.name}
                                onClick={() => addToHierarchy(field)}
                                className="px-2 py-1 text-xs rounded-md transition-colors hover:bg-blue-500/20"
                                style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                                }}
                            >
                                + {field.displayName}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrillNavigation;
