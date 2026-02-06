/**
 * Visualization Picker - Power BI-style chart type selector
 * Displays all available chart types organized by category
 */

import React, { useState, useMemo } from 'react';
import {
    Search,
    X,
    Star,
    Clock,
    ChevronRight,
    Check,
    Info,
} from 'lucide-react';

import {
    CHART_TYPES,
    ChartTypeDefinition,
    ChartCategory,
    CHART_CATEGORY_LABELS,
    getChartTypesByCategory,
    getChartCategories,
} from '../../lib/visualizationLibrary';

interface VisualizationPickerProps {
    selectedType?: string;
    onSelect: (chartType: ChartTypeDefinition) => void;
    recentTypes?: string[];
    favoriteTypes?: string[];
    onToggleFavorite?: (typeId: string) => void;
    mode: 'light' | 'dark';
    onClose?: () => void;
}

export const VisualizationPicker: React.FC<VisualizationPickerProps> = ({
    selectedType,
    onSelect,
    recentTypes = [],
    favoriteTypes = [],
    onToggleFavorite,
    mode,
    onClose,
}) => {
    const isDark = mode === 'dark';
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<ChartCategory>>(
        new Set(getChartCategories())
    );
    const [hoveredType, setHoveredType] = useState<string | null>(null);

    const filteredChartTypes = useMemo(() => {
        if (!searchTerm) return CHART_TYPES;
        const term = searchTerm.toLowerCase();
        return CHART_TYPES.filter(ct =>
            ct.name.toLowerCase().includes(term) ||
            ct.description.toLowerCase().includes(term) ||
            ct.category.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    const recentChartTypes = useMemo(() => {
        return recentTypes
            .map(id => CHART_TYPES.find(ct => ct.id === id))
            .filter((ct): ct is ChartTypeDefinition => ct !== undefined)
            .slice(0, 5);
    }, [recentTypes]);

    const favoriteChartTypes = useMemo(() => {
        return favoriteTypes
            .map(id => CHART_TYPES.find(ct => ct.id === id))
            .filter((ct): ct is ChartTypeDefinition => ct !== undefined);
    }, [favoriteTypes]);

    const groupedChartTypes = useMemo(() => {
        const groups: Record<ChartCategory, ChartTypeDefinition[]> = {} as any;

        filteredChartTypes.forEach(ct => {
            if (!groups[ct.category]) {
                groups[ct.category] = [];
            }
            groups[ct.category].push(ct);
        });

        return groups;
    }, [filteredChartTypes]);

    const toggleCategory = (category: ChartCategory) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const handleSelect = (chartType: ChartTypeDefinition) => {
        onSelect(chartType);
        onClose?.();
    };

    return (
        <div
            className="flex flex-col h-full rounded-lg border overflow-hidden"
            style={{
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
            >
                <h3
                    className="font-semibold text-sm"
                    style={{ color: isDark ? '#f9fafb' : '#111827' }}
                >
                    Visualizations
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    >
                        <X className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} />
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="px-4 py-3">
                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                >
                    <Search className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                    <input
                        type="text"
                        placeholder="Search visualizations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}>
                            <X className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {/* Recent */}
                {!searchTerm && recentChartTypes.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                            <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                                Recent
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                            {recentChartTypes.map(ct => (
                                <ChartTypeButton
                                    key={ct.id}
                                    chartType={ct}
                                    isSelected={selectedType === ct.id}
                                    isFavorite={favoriteTypes.includes(ct.id)}
                                    onSelect={() => handleSelect(ct)}
                                    onToggleFavorite={() => onToggleFavorite?.(ct.id)}
                                    onHover={setHoveredType}
                                    isDark={isDark}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Favorites */}
                {!searchTerm && favoriteChartTypes.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium">
                            <Star className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                            <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                                Favorites
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                            {favoriteChartTypes.map(ct => (
                                <ChartTypeButton
                                    key={ct.id}
                                    chartType={ct}
                                    isSelected={selectedType === ct.id}
                                    isFavorite={true}
                                    onSelect={() => handleSelect(ct)}
                                    onToggleFavorite={() => onToggleFavorite?.(ct.id)}
                                    onHover={setHoveredType}
                                    isDark={isDark}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories */}
                {Object.entries(groupedChartTypes).map(([category, types]) => {
                    const typeList = types as ChartTypeDefinition[];
                    return (
                    <div key={category} className="mb-2">
                        <button
                            onClick={() => toggleCategory(category as ChartCategory)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                        >
                            <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform ${expandedCategories.has(category as ChartCategory) ? 'rotate-90' : ''
                                    }`}
                                style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                            />
                            <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                                {CHART_CATEGORY_LABELS[category as ChartCategory]}
                            </span>
                            <span
                                className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                }}
                            >
                                {typeList.length}
                            </span>
                        </button>

                        {expandedCategories.has(category as ChartCategory) && (
                            <div className="grid grid-cols-5 gap-1 mt-1 pl-4">
                                {typeList.map(ct => (
                                    <ChartTypeButton
                                        key={ct.id}
                                        chartType={ct}
                                        isSelected={selectedType === ct.id}
                                        isFavorite={favoriteTypes.includes(ct.id)}
                                        onSelect={() => handleSelect(ct)}
                                        onToggleFavorite={() => onToggleFavorite?.(ct.id)}
                                        onHover={setHoveredType}
                                        isDark={isDark}
                                        compact
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    );
                })}

                {/* No results */}
                {searchTerm && filteredChartTypes.length === 0 && (
                    <div
                        className="text-center py-8 text-sm"
                        style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                    >
                        No visualizations found for "{searchTerm}"
                    </div>
                )}
            </div>

            {/* Hovered type info */}
            {hoveredType && (
                <ChartTypeInfo
                    chartType={CHART_TYPES.find(ct => ct.id === hoveredType)!}
                    isDark={isDark}
                />
            )}
        </div>
    );
};

interface ChartTypeButtonProps {
    chartType: ChartTypeDefinition;
    isSelected: boolean;
    isFavorite: boolean;
    onSelect: () => void;
    onToggleFavorite?: () => void;
    onHover: (id: string | null) => void;
    isDark: boolean;
    compact?: boolean;
}

const ChartTypeButton: React.FC<ChartTypeButtonProps> = ({
    chartType,
    isSelected,
    isFavorite,
    onSelect,
    onToggleFavorite,
    onHover,
    isDark,
    compact,
}) => {
    return (
        <div className="relative group">
            <button
                onClick={onSelect}
                onMouseEnter={() => onHover(chartType.id)}
                onMouseLeave={() => onHover(null)}
                className={`w-full aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${isSelected
                        ? 'ring-2 ring-blue-500 border-blue-500'
                        : 'border-transparent hover:border-blue-500/50'
                    }`}
                style={{
                    backgroundColor: isSelected
                        ? isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                        : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
                title={chartType.name}
            >
                <span
                    style={{ color: isSelected ? '#3b82f6' : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                >
                    {chartType.icon}
                </span>
                {!compact && (
                    <span
                        className="text-[10px] text-center truncate px-1 w-full"
                        style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                    >
                        {chartType.name}
                    </span>
                )}
                {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                )}
            </button>

            {/* Favorite button */}
            {onToggleFavorite && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                    }}
                    className="absolute top-0.5 left-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                >
                    <Star
                        className="w-3 h-3"
                        fill={isFavorite ? '#fbbf24' : 'none'}
                        style={{ color: isFavorite ? '#fbbf24' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                    />
                </button>
            )}
        </div>
    );
};

interface ChartTypeInfoProps {
    chartType: ChartTypeDefinition;
    isDark: boolean;
}

const ChartTypeInfo: React.FC<ChartTypeInfoProps> = ({ chartType, isDark }) => {
    return (
        <div
            className="px-4 py-3 border-t"
            style={{
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="p-2 rounded-lg"
                    style={{
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    }}
                >
                    <span style={{ color: '#3b82f6' }}>{chartType.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4
                        className="font-medium text-sm"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                    >
                        {chartType.name}
                    </h4>
                    <p
                        className="text-xs mt-0.5"
                        style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                    >
                        {chartType.description}
                    </p>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1 mt-2">
                        {chartType.supportsCrossFilter && (
                            <CapabilityBadge label="Cross-filter" isDark={isDark} />
                        )}
                        {chartType.supportsDrillDown && (
                            <CapabilityBadge label="Drill-down" isDark={isDark} />
                        )}
                        {chartType.supportsAnalyticsLines && (
                            <CapabilityBadge label="Analytics" isDark={isDark} />
                        )}
                        {chartType.supportsConditionalFormatting && (
                            <CapabilityBadge label="Conditional formatting" isDark={isDark} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CapabilityBadge: React.FC<{ label: string; isDark: boolean }> = ({ label, isDark }) => (
    <span
        className="text-[10px] px-1.5 py-0.5 rounded"
        style={{
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
        }}
    >
        {label}
    </span>
);

// Compact version for toolbar
interface VisualizationPickerCompactProps {
    selectedType?: string;
    onSelect: (chartType: ChartTypeDefinition) => void;
    mode: 'light' | 'dark';
}

export const VisualizationPickerCompact: React.FC<VisualizationPickerCompactProps> = ({
    selectedType,
    onSelect,
    mode,
}) => {
    const isDark = mode === 'dark';
    const [isOpen, setIsOpen] = useState(false);

    const selectedChartType = CHART_TYPES.find(ct => ct.id === selectedType);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                    borderColor: isOpen ? '#3b82f6' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                }}
            >
                {selectedChartType ? (
                    <>
                        <span style={{ color: '#3b82f6' }}>{selectedChartType.icon}</span>
                        <span
                            className="text-sm"
                            style={{ color: isDark ? '#f9fafb' : '#111827' }}
                        >
                            {selectedChartType.name}
                        </span>
                    </>
                ) : (
                    <span
                        className="text-sm"
                        style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                    >
                        Select visualization
                    </span>
                )}
                <ChevronRight
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div
                        className="absolute top-full left-0 mt-1 z-50 w-[400px] max-h-[500px] shadow-xl"
                    >
                        <VisualizationPicker
                            selectedType={selectedType}
                            onSelect={(ct) => {
                                onSelect(ct);
                                setIsOpen(false);
                            }}
                            mode={mode}
                            onClose={() => setIsOpen(false)}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default VisualizationPicker;
