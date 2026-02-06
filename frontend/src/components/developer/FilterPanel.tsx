/**
 * Filter Panel - Power BI-style filtering system
 * Supports Visual-level, Page-level, and Report-level filters
 * Including slicers, date range, numeric range, and text filters
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    Filter,
    ChevronDown,
    ChevronRight,
    X,
    Search,
    Calendar,
    Hash,
    Type,
    Check,
    CheckSquare,
    Square,
    LayoutGrid,
    List,
    Sliders,
    Clock,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Trash2,
    Plus,
    GripVertical,
} from 'lucide-react';

// Filter Types
export type FilterType = 'basic' | 'advanced' | 'relative-date' | 'top-n';
export type FilterLevel = 'visual' | 'page' | 'report' | 'drillthrough';

export interface FilterValue {
    value: any;
    selected: boolean;
    count?: number;
}

export interface FilterConfig {
    id: string;
    fieldName: string;
    fieldType: 'string' | 'number' | 'date' | 'boolean';
    displayName: string;
    tableName?: string;
    level: FilterLevel;
    filterType: FilterType;
    enabled: boolean;
    locked?: boolean;
    hidden?: boolean;

    // Basic filter
    operator?: FilterOperator;
    values?: FilterValue[];
    selectedValues?: any[];

    // Advanced filter
    conditions?: FilterCondition[];
    logicalOperator?: 'and' | 'or';

    // Numeric range
    rangeMin?: number;
    rangeMax?: number;

    // Date range
    dateStart?: string;
    dateEnd?: string;
    relativeDateConfig?: RelativeDateConfig;

    // Top N
    topN?: {
        type: 'top' | 'bottom';
        count: number;
        byField: string;
        showOthers: boolean;
    };

    // Slicer display
    slicerType?: 'list' | 'dropdown' | 'tile' | 'range' | 'between';
    showSelectAll?: boolean;
    singleSelect?: boolean;
    searchEnabled?: boolean;
}

export type FilterOperator =
    | 'equals' | 'notEquals'
    | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
    | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual'
    | 'between' | 'notBetween'
    | 'isBlank' | 'isNotBlank'
    | 'in' | 'notIn';

export interface FilterCondition {
    operator: FilterOperator;
    value: any;
    value2?: any; // For between operators
}

export interface RelativeDateConfig {
    anchor: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';
    offset?: number;
    offsetUnit?: 'days' | 'weeks' | 'months' | 'years';
    includeCurrent?: boolean;
}

// Get display operator text
const getOperatorText = (operator: FilterOperator): string => {
    const operators: Record<FilterOperator, string> = {
        equals: 'is',
        notEquals: 'is not',
        contains: 'contains',
        notContains: 'does not contain',
        startsWith: 'starts with',
        endsWith: 'ends with',
        greaterThan: 'is greater than',
        greaterThanOrEqual: 'is greater than or equal to',
        lessThan: 'is less than',
        lessThanOrEqual: 'is less than or equal to',
        between: 'is between',
        notBetween: 'is not between',
        isBlank: 'is blank',
        isNotBlank: 'is not blank',
        in: 'is one of',
        notIn: 'is not one of',
    };
    return operators[operator];
};

// Get operators for field type
const getOperatorsForType = (type: FilterConfig['fieldType']): FilterOperator[] => {
    switch (type) {
        case 'string':
            return ['equals', 'notEquals', 'contains', 'notContains', 'startsWith', 'endsWith', 'isBlank', 'isNotBlank'];
        case 'number':
            return ['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'isBlank', 'isNotBlank'];
        case 'date':
            return ['equals', 'notEquals', 'greaterThan', 'lessThan', 'between', 'isBlank', 'isNotBlank'];
        case 'boolean':
            return ['equals', 'notEquals'];
        default:
            return ['equals', 'notEquals'];
    }
};

interface FilterPanelProps {
    filters: FilterConfig[];
    onFiltersChange: (filters: FilterConfig[]) => void;
    availableFields: Array<{
        name: string;
        displayName: string;
        tableName: string;
        type: FilterConfig['fieldType'];
    }>;
    activeLevel?: FilterLevel;
    onLevelChange?: (level: FilterLevel) => void;
    mode: 'light' | 'dark';
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
    filters,
    onFiltersChange,
    availableFields,
    activeLevel = 'page',
    onLevelChange,
    mode,
    collapsed = false,
    onCollapsedChange,
}) => {
    const isDark = mode === 'dark';
    const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddFilter, setShowAddFilter] = useState(false);

    // Filter filters by level
    const filteredFilters = useMemo(() => {
        return filters.filter(f => f.level === activeLevel && !f.hidden);
    }, [filters, activeLevel]);

    // Available fields for adding
    const addableFields = useMemo(() => {
        const usedFields = new Set(filteredFilters.map(f => `${f.tableName}.${f.fieldName}`));
        return availableFields.filter(f => !usedFields.has(`${f.tableName}.${f.name}`));
    }, [availableFields, filteredFilters]);

    const toggleFilterExpanded = (id: string) => {
        setExpandedFilters(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const addFilter = useCallback((field: typeof availableFields[0]) => {
        const newFilter: FilterConfig = {
            id: `filter-${Date.now()}`,
            fieldName: field.name,
            fieldType: field.type,
            displayName: field.displayName,
            tableName: field.tableName,
            level: activeLevel as FilterLevel,
            filterType: 'basic',
            enabled: true,
            values: [],
            selectedValues: [],
            slicerType: 'list',
            showSelectAll: true,
            singleSelect: false,
            searchEnabled: true,
        };

        onFiltersChange([...filters, newFilter]);
        setExpandedFilters(prev => new Set([...prev, newFilter.id]));
        setShowAddFilter(false);
    }, [filters, activeLevel, onFiltersChange]);

    const removeFilter = useCallback((id: string) => {
        onFiltersChange(filters.filter(f => f.id !== id));
        setExpandedFilters(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, [filters, onFiltersChange]);

    const updateFilter = useCallback((id: string, updates: Partial<FilterConfig>) => {
        onFiltersChange(
            filters.map(f => f.id === id ? { ...f, ...updates } : f)
        );
    }, [filters, onFiltersChange]);

    const clearAllFilters = useCallback(() => {
        onFiltersChange(
            filters.map(f => f.level === activeLevel
                ? { ...f, selectedValues: [], values: f.values?.map(v => ({ ...v, selected: false })) }
                : f
            )
        );
    }, [filters, activeLevel, onFiltersChange]);

    if (collapsed) {
        return (
            <button
                onClick={() => onCollapsedChange?.(false)}
                className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                title="Show Filters"
            >
                <Filter className="w-5 h-5" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
            </button>
        );
    }

    return (
        <div
            className="flex flex-col h-full border-l"
            style={{
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                width: 280,
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                    <span
                        className="font-semibold text-sm"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                    >
                        Filters
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearAllFilters}
                        className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                        title="Clear all filters"
                    >
                        <Trash2 className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} />
                    </button>
                    <button
                        onClick={() => onCollapsedChange?.(true)}
                        className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                        title="Collapse panel"
                    >
                        <X className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} />
                    </button>
                </div>
            </div>

            {/* Filter Level Tabs */}
            <div
                className="flex border-b px-2"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
                {(['visual', 'page', 'report'] as FilterLevel[]).map(level => (
                    <button
                        key={level}
                        onClick={() => onLevelChange?.(level)}
                        className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeLevel === level
                                ? 'border-blue-500 text-blue-500'
                                : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                        style={{
                            color: activeLevel === level
                                ? '#3b82f6'
                                : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        }}
                    >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="px-3 py-2">
                <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                >
                    <Search className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                    <input
                        type="text"
                        placeholder="Search filters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                    />
                </div>
            </div>

            {/* Filters List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {filteredFilters
                    .filter(f => f.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(filter => (
                        <FilterCard
                            key={filter.id}
                            filter={filter}
                            expanded={expandedFilters.has(filter.id)}
                            onToggleExpanded={() => toggleFilterExpanded(filter.id)}
                            onUpdate={(updates) => updateFilter(filter.id, updates)}
                            onRemove={() => removeFilter(filter.id)}
                            isDark={isDark}
                        />
                    ))}

                {filteredFilters.length === 0 && (
                    <div
                        className="text-center py-8 text-sm"
                        style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                    >
                        No filters added yet
                    </div>
                )}
            </div>

            {/* Add Filter Button */}
            <div className="px-3 py-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                {showAddFilter ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                                Add filter field
                            </span>
                            <button
                                onClick={() => setShowAddFilter(false)}
                                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                            >
                                <X className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                            </button>
                        </div>
                        <div
                            className="max-h-48 overflow-y-auto rounded-lg border"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            }}
                        >
                            {addableFields.map(field => (
                                <button
                                    key={`${field.tableName}.${field.name}`}
                                    onClick={() => addFilter(field)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 text-sm"
                                    style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' }}
                                >
                                    {field.type === 'number' && <Hash className="w-4 h-4 text-blue-500" />}
                                    {field.type === 'string' && <Type className="w-4 h-4 text-purple-500" />}
                                    {field.type === 'date' && <Calendar className="w-4 h-4 text-green-500" />}
                                    {field.type === 'boolean' && <CheckSquare className="w-4 h-4 text-orange-500" />}
                                    <span className="truncate">{field.displayName}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddFilter(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add filter</span>
                    </button>
                )}
            </div>
        </div>
    );
};

interface FilterCardProps {
    filter: FilterConfig;
    expanded: boolean;
    onToggleExpanded: () => void;
    onUpdate: (updates: Partial<FilterConfig>) => void;
    onRemove: () => void;
    isDark: boolean;
}

const FilterCard: React.FC<FilterCardProps> = ({
    filter,
    expanded,
    onToggleExpanded,
    onUpdate,
    onRemove,
    isDark,
}) => {
    const [localSearch, setLocalSearch] = useState('');

    const hasActiveFilters = useMemo(() => {
        return (filter.selectedValues?.length ?? 0) > 0;
    }, [filter.selectedValues]);

    const toggleValue = useCallback((value: any) => {
        const currentSelected = filter.selectedValues || [];
        const isSelected = currentSelected.includes(value);

        if (filter.singleSelect) {
            onUpdate({ selectedValues: isSelected ? [] : [value] });
        } else {
            onUpdate({
                selectedValues: isSelected
                    ? currentSelected.filter(v => v !== value)
                    : [...currentSelected, value],
            });
        }
    }, [filter.selectedValues, filter.singleSelect, onUpdate]);

    const selectAll = useCallback(() => {
        const allValues = filter.values?.map(v => v.value) || [];
        onUpdate({ selectedValues: allValues });
    }, [filter.values, onUpdate]);

    const clearSelection = useCallback(() => {
        onUpdate({ selectedValues: [] });
    }, [onUpdate]);

    const filteredValues = useMemo(() => {
        if (!localSearch) return filter.values || [];
        return (filter.values || []).filter(v =>
            String(v.value).toLowerCase().includes(localSearch.toLowerCase())
        );
    }, [filter.values, localSearch]);

    return (
        <div
            className="rounded-lg border overflow-hidden"
            style={{
                borderColor: hasActiveFilters
                    ? 'rgba(59, 130, 246, 0.5)'
                    : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            }}
        >
            {/* Header */}
            <button
                onClick={onToggleExpanded}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
            >
                <ChevronRight
                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                />
                <span
                    className="flex-1 text-left text-sm font-medium truncate"
                    style={{ color: isDark ? '#f9fafb' : '#111827' }}
                >
                    {filter.displayName}
                </span>
                {hasActiveFilters && (
                    <span
                        className="px-1.5 py-0.5 text-xs rounded-full"
                        style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                        }}
                    >
                        {filter.selectedValues?.length}
                    </span>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="p-1 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100"
                >
                    <X className="w-3 h-3 text-red-400" />
                </button>
            </button>

            {/* Content */}
            {expanded && (
                <div
                    className="border-t px-3 py-2 space-y-2"
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                    {/* Filter Type Toggle */}
                    <div className="flex items-center gap-1">
                        {(['basic', 'advanced'] as FilterType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => onUpdate({ filterType: type })}
                                className={`px-2 py-1 text-xs rounded ${filter.filterType === type
                                        ? 'bg-blue-500/20 text-blue-500'
                                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                style={{
                                    color: filter.filterType === type
                                        ? '#3b82f6'
                                        : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                }}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    {filter.filterType === 'basic' && (
                        <>
                            {/* Search within filter */}
                            {filter.searchEnabled && (
                                <div
                                    className="flex items-center gap-2 px-2 py-1 rounded"
                                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                >
                                    <Search className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={localSearch}
                                        onChange={(e) => setLocalSearch(e.target.value)}
                                        className="flex-1 bg-transparent text-xs outline-none"
                                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                                    />
                                </div>
                            )}

                            {/* Select All / Clear */}
                            {filter.showSelectAll && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={selectAll}
                                        className="text-xs text-blue-500 hover:underline"
                                    >
                                        Select all
                                    </button>
                                    <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>|</span>
                                    <button
                                        onClick={clearSelection}
                                        className="text-xs text-blue-500 hover:underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}

                            {/* Values List */}
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {filteredValues.map((fv, index) => {
                                    const isSelected = filter.selectedValues?.includes(fv.value);

                                    return (
                                        <label
                                            key={index}
                                            className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                                        >
                                            <input
                                                type={filter.singleSelect ? 'radio' : 'checkbox'}
                                                checked={isSelected}
                                                onChange={() => toggleValue(fv.value)}
                                                className="w-3.5 h-3.5 accent-blue-500"
                                            />
                                            <span
                                                className="flex-1 text-xs truncate"
                                                style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' }}
                                            >
                                                {String(fv.value)}
                                            </span>
                                            {fv.count !== undefined && (
                                                <span
                                                    className="text-xs"
                                                    style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                                                >
                                                    ({fv.count})
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {filter.filterType === 'advanced' && (
                        <AdvancedFilterEditor
                            filter={filter}
                            onUpdate={onUpdate}
                            isDark={isDark}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

interface AdvancedFilterEditorProps {
    filter: FilterConfig;
    onUpdate: (updates: Partial<FilterConfig>) => void;
    isDark: boolean;
}

const AdvancedFilterEditor: React.FC<AdvancedFilterEditorProps> = ({
    filter,
    onUpdate,
    isDark,
}) => {
    const operators = getOperatorsForType(filter.fieldType);
    const conditions = filter.conditions || [{ operator: 'equals', value: '' }];

    const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], ...updates };
        onUpdate({ conditions: newConditions });
    };

    const addCondition = () => {
        onUpdate({
            conditions: [...conditions, { operator: 'equals', value: '' }],
        });
    };

    const removeCondition = (index: number) => {
        const newConditions = conditions.filter((_, i) => i !== index);
        onUpdate({ conditions: newConditions.length > 0 ? newConditions : [{ operator: 'equals', value: '' }] });
    };

    return (
        <div className="space-y-3">
            {/* Logical Operator */}
            {conditions.length > 1 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Show items when
                    </span>
                    <select
                        value={filter.logicalOperator || 'and'}
                        onChange={(e) => onUpdate({ logicalOperator: e.target.value as 'and' | 'or' })}
                        className="text-xs px-2 py-1 rounded border bg-transparent"
                        style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                            color: isDark ? '#f9fafb' : '#111827',
                        }}
                    >
                        <option value="and">all</option>
                        <option value="or">any</option>
                    </select>
                    <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        conditions are met
                    </span>
                </div>
            )}

            {/* Conditions */}
            {conditions.map((condition, index) => (
                <div key={index} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, { operator: e.target.value as FilterOperator })}
                            className="flex-1 text-xs px-2 py-1.5 rounded border bg-transparent"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                color: isDark ? '#f9fafb' : '#111827',
                            }}
                        >
                            {operators.map(op => (
                                <option key={op} value={op}>{getOperatorText(op)}</option>
                            ))}
                        </select>

                        {conditions.length > 1 && (
                            <button
                                onClick={() => removeCondition(index)}
                                className="p-1 rounded hover:bg-red-500/20"
                            >
                                <X className="w-3 h-3 text-red-400" />
                            </button>
                        )}
                    </div>

                    {!['isBlank', 'isNotBlank'].includes(condition.operator) && (
                        <input
                            type={filter.fieldType === 'number' ? 'number' : filter.fieldType === 'date' ? 'date' : 'text'}
                            value={condition.value ?? ''}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                            placeholder="Enter value..."
                            className="w-full text-xs px-2 py-1.5 rounded border bg-transparent"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                color: isDark ? '#f9fafb' : '#111827',
                            }}
                        />
                    )}

                    {['between', 'notBetween'].includes(condition.operator) && (
                        <input
                            type={filter.fieldType === 'number' ? 'number' : filter.fieldType === 'date' ? 'date' : 'text'}
                            value={condition.value2 ?? ''}
                            onChange={(e) => updateCondition(index, { value2: e.target.value })}
                            placeholder="Enter end value..."
                            className="w-full text-xs px-2 py-1.5 rounded border bg-transparent"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                color: isDark ? '#f9fafb' : '#111827',
                            }}
                        />
                    )}
                </div>
            ))}

            {/* Add Condition */}
            <button
                onClick={addCondition}
                className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
                <Plus className="w-3 h-3" />
                Add condition
            </button>
        </div>
    );
};

export default FilterPanel;
