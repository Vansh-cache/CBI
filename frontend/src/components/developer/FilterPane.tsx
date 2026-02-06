/**
 * Filter Pane Component
 * Power BI-like filter pane with page, visual, and report-level filters
 */

import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronRight, Search, Check } from 'lucide-react';

export type FilterLevel = 'visual' | 'page' | 'report';
export type FilterType = 'basic' | 'advanced' | 'topN' | 'relative-date';

export interface FilterRule {
    id: string;
    field: string;
    level: FilterLevel;
    type: FilterType;
    operator?: 'equals' | 'not-equals' | 'contains' | 'starts-with' | 'greater-than' | 'less-than' | 'between' | 'in' | 'not-in';
    values?: string[];
    topN?: number;
    topNBy?: 'count' | 'sum' | 'avg';
    relativeDateUnit?: 'days' | 'weeks' | 'months' | 'years';
    relativeDateValue?: number;
    isEnabled?: boolean;
}

interface FilterPaneProps {
    filters: FilterRule[];
    availableFields: { name: string; type: string; datasetId: number }[];
    selectedWidgetId?: string;
    onAddFilter: (filter: FilterRule) => void;
    onUpdateFilter: (filterId: string, updates: Partial<FilterRule>) => void;
    onRemoveFilter: (filterId: string) => void;
    onClearAllFilters: (level?: FilterLevel) => void;
    isDark: boolean;
    colors: any;
}

interface FilterItemProps {
    filter: FilterRule;
    onUpdate: (updates: Partial<FilterRule>) => void;
    onRemove: () => void;
    isDark: boolean;
    colors: any;
}

const FilterItem: React.FC<FilterItemProps> = ({
    filter,
    onUpdate,
    onRemove,
    isDark,
    colors
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    // Mock unique values for the field (in real app, fetch from dataset)
    const uniqueValues = ['Value 1', 'Value 2', 'Value 3', 'Value 4', 'Value 5'];
    const filteredValues = uniqueValues.filter(v =>
        v.toLowerCase().includes(searchValue.toLowerCase())
    );

    const toggleValue = (value: string) => {
        const currentValues = filter.values || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        onUpdate({ values: newValues });
    };

    return (
        <div
            className="border rounded-lg overflow-hidden"
            style={{
                borderColor: filter.isEnabled ? colors.cardBorder : colors.muted,
                opacity: filter.isEnabled ? 1 : 0.6
            }}
        >
            <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
                <div className="flex items-center gap-2 flex-1">
                    <input
                        type="checkbox"
                        checked={filter.isEnabled}
                        onChange={(e) => onUpdate({ isEnabled: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-sm font-medium"
                        style={{ color: colors.text }}
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {filter.field}
                    </button>
                </div>
                <button
                    onClick={onRemove}
                    className="p-1 hover:text-red-600 transition-colors"
                    style={{ color: colors.muted }}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {isExpanded && (
                <div className="p-3 border-t space-y-2" style={{ borderColor: colors.cardBorder }}>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: colors.muted }} />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search values..."
                            className="w-full pl-7 pr-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                            style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
                        />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredValues.map(value => (
                            <label
                                key={value}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={filter.values?.includes(value) || false}
                                    onChange={() => toggleValue(value)}
                                    className="w-3 h-3 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-xs" style={{ color: colors.text }}>{value}</span>
                            </label>
                        ))}
                    </div>

                    {filter.values && filter.values.length > 0 && (
                        <div className="pt-2 border-t" style={{ borderColor: colors.cardBorder }}>
                            <span className="text-xs" style={{ color: colors.muted }}>
                                {filter.values.length} selected
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function FilterPane({
    filters,
    availableFields,
    selectedWidgetId,
    onAddFilter,
    onUpdateFilter,
    onRemoveFilter,
    onClearAllFilters,
    isDark,
    colors
}: FilterPaneProps) {
    const [expandedSections, setExpandedSections] = useState<Set<FilterLevel>>(new Set(['page']));
    const [searchTerm, setSearchTerm] = useState('');
    const [addingFilter, setAddingFilter] = useState<FilterLevel | null>(null);
    const [selectedField, setSelectedField] = useState<string>('');

    const toggleSection = (level: FilterLevel) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(level)) {
                next.delete(level);
            } else {
                next.add(level);
            }
            return next;
        });
    };

    const getFiltersForLevel = (level: FilterLevel) => {
        return filters.filter(f => f.level === level);
    };

    const handleAddFilter = (level: FilterLevel) => {
        if (!selectedField) return;

        const field = availableFields.find(f => f.name === selectedField);
        if (!field) return;

        const newFilter: FilterRule = {
            id: `filter-${Date.now()}`,
            field: selectedField,
            level,
            type: 'basic',
            operator: 'in',
            values: [],
            isEnabled: true
        };

        onAddFilter(newFilter);
        setAddingFilter(null);
        setSelectedField('');
    };

    const FilterSection = ({ level, title }: { level: FilterLevel; title: string }) => {
        const levelFilters = getFiltersForLevel(level);
        const isExpanded = expandedSections.has(level);
        const isAdding = addingFilter === level;

        return (
            <div className="border-b" style={{ borderColor: colors.cardBorder }}>
                <button
                    onClick={() => toggleSection(level)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: colors.text }}
                >
                    <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium text-sm">{title}</span>
                        {levelFilters.length > 0 && (
                            <span
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444'
                                }}
                            >
                                {levelFilters.length}
                            </span>
                        )}
                    </div>
                    {levelFilters.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearAllFilters(level);
                            }}
                            className="text-xs hover:underline"
                            style={{ color: colors.muted }}
                        >
                            Clear all
                        </button>
                    )}
                </button>

                {isExpanded && (
                    <div className="px-4 pb-3 space-y-2">
                        {levelFilters.map(filter => (
                            <FilterItem
                                key={filter.id}
                                filter={filter}
                                onUpdate={(updates) => onUpdateFilter(filter.id, updates)}
                                onRemove={() => onRemoveFilter(filter.id)}
                                isDark={isDark}
                                colors={colors}
                            />
                        ))}

                        {isAdding ? (
                            <div className="p-3 border rounded-lg space-y-2" style={{ borderColor: colors.cardBorder }}>
                                <select
                                    value={selectedField}
                                    onChange={(e) => setSelectedField(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
                                >
                                    <option value="">Select field...</option>
                                    {availableFields.map(field => (
                                        <option key={field.name} value={field.name}>
                                            {field.name} ({field.type})
                                        </option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAddFilter(level)}
                                        disabled={!selectedField}
                                        className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAddingFilter(null);
                                            setSelectedField('');
                                        }}
                                        className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingFilter(level)}
                                className="w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm transition-colors hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                style={{ borderColor: colors.cardBorder, color: colors.muted }}
                            >
                                + Add filter
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: colors.cardBg }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.cardBorder }}>
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-indigo-600" />
                    <h3 style={{ color: colors.text }} className="font-semibold">Filters</h3>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.muted }} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search filters..."
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {selectedWidgetId && <FilterSection level="visual" title="Visual level filters" />}
                <FilterSection level="page" title="Page level filters" />
                <FilterSection level="report" title="Report level filters" />
            </div>

            {filters.length > 0 && (
                <div className="px-4 py-3 border-t" style={{ borderColor: colors.cardBorder }}>
                    <button
                        onClick={() => onClearAllFilters()}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
}



