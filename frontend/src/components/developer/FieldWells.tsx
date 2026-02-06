/**
 * Field Wells Component - Power BI-style field binding UI
 * Supports Axis, Values, Legend, Tooltips, Small Multiples field wells
 */

import React, { useState, useCallback } from 'react';
import {
    GripVertical,
    X,
    ChevronDown,
    Sigma,
    Hash,
    Calendar,
    Type,
    ChevronRight,
    Filter,
    TrendingUp,
    BarChart2,
    LayoutGrid,
    MessageSquare,
    Palette,
    MoreHorizontal,
    Trash2,
    Copy,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';

// Field Types
export interface DataField {
    id: string;
    name: string;
    displayName: string;
    tableName: string;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    fieldType: 'dimension' | 'measure';
    aggregation?: AggregationType;
    format?: string;
    expression?: string; // For calculated fields
}

export type AggregationType =
    | 'sum' | 'average' | 'count' | 'distinctCount'
    | 'min' | 'max' | 'median' | 'stdDev' | 'variance' | 'first' | 'last' | 'none';

export type WellType =
    | 'axis' | 'values' | 'legend' | 'columnGroup' | 'rowGroup'
    | 'tooltips' | 'smallMultiples' | 'details' | 'size' | 'color' | 'saturation';

export interface FieldWell {
    id: WellType;
    label: string;
    icon: React.ReactNode;
    accepts: ('dimension' | 'measure')[];
    multiple: boolean;
    maxFields?: number;
    fields: DataField[];
}

export interface FieldWellsConfig {
    wells: FieldWell[];
    chartType?: string;
}

// Default configurations for different chart types
export const getFieldWellsForChartType = (chartType: string): FieldWellsConfig => {
    const baseWells: Record<WellType, Omit<FieldWell, 'id' | 'fields'>> = {
        axis: {
            label: 'Axis',
            icon: <BarChart2 className="w-4 h-4" />,
            accepts: ['dimension'],
            multiple: true,
            maxFields: 3,
        },
        values: {
            label: 'Values',
            icon: <Sigma className="w-4 h-4" />,
            accepts: ['measure'],
            multiple: true,
        },
        legend: {
            label: 'Legend',
            icon: <Palette className="w-4 h-4" />,
            accepts: ['dimension'],
            multiple: true,
            maxFields: 2,
        },
        columnGroup: {
            label: 'Column',
            icon: <LayoutGrid className="w-4 h-4" />,
            accepts: ['dimension'],
            multiple: true,
        },
        rowGroup: {
            label: 'Row',
            icon: <LayoutGrid className="w-4 h-4 rotate-90" />,
            accepts: ['dimension'],
            multiple: true,
        },
        tooltips: {
            label: 'Tooltips',
            icon: <MessageSquare className="w-4 h-4" />,
            accepts: ['dimension', 'measure'],
            multiple: true,
        },
        smallMultiples: {
            label: 'Small multiples',
            icon: <LayoutGrid className="w-4 h-4" />,
            accepts: ['dimension'],
            multiple: false,
            maxFields: 1,
        },
        details: {
            label: 'Details',
            icon: <MoreHorizontal className="w-4 h-4" />,
            accepts: ['dimension'],
            multiple: true,
        },
        size: {
            label: 'Size',
            icon: <TrendingUp className="w-4 h-4" />,
            accepts: ['measure'],
            multiple: false,
            maxFields: 1,
        },
        color: {
            label: 'Color saturation',
            icon: <Palette className="w-4 h-4" />,
            accepts: ['measure'],
            multiple: false,
            maxFields: 1,
        },
        saturation: {
            label: 'Saturation',
            icon: <Palette className="w-4 h-4" />,
            accepts: ['measure'],
            multiple: false,
            maxFields: 1,
        },
    };

    const createWell = (id: WellType): FieldWell => ({
        ...baseWells[id],
        id,
        fields: [],
    });

    switch (chartType) {
        case 'bar':
        case 'column':
        case 'stackedBar':
        case 'stackedColumn':
            return {
                chartType,
                wells: [
                    createWell('axis'),
                    createWell('values'),
                    createWell('legend'),
                    createWell('smallMultiples'),
                    createWell('tooltips'),
                ],
            };

        case 'line':
        case 'area':
        case 'stackedArea':
            return {
                chartType,
                wells: [
                    createWell('axis'),
                    createWell('values'),
                    createWell('legend'),
                    createWell('smallMultiples'),
                    createWell('tooltips'),
                ],
            };

        case 'pie':
        case 'donut':
            return {
                chartType,
                wells: [
                    createWell('legend'),
                    createWell('values'),
                    createWell('details'),
                    createWell('tooltips'),
                ],
            };

        case 'scatter':
            return {
                chartType,
                wells: [
                    { ...createWell('values'), label: 'X Axis', maxFields: 1 },
                    { ...createWell('values'), id: 'values', label: 'Y Axis', maxFields: 1, fields: [] },
                    createWell('legend'),
                    createWell('size'),
                    createWell('tooltips'),
                ],
            };

        case 'bubble':
            return {
                chartType,
                wells: [
                    { ...createWell('values'), label: 'X Axis', maxFields: 1 },
                    { ...createWell('values'), id: 'values', label: 'Y Axis', maxFields: 1, fields: [] },
                    createWell('legend'),
                    createWell('size'),
                    createWell('color'),
                    createWell('tooltips'),
                ],
            };

        case 'map':
        case 'filledMap':
            return {
                chartType,
                wells: [
                    { ...createWell('axis'), label: 'Location' },
                    createWell('values'),
                    createWell('legend'),
                    createWell('size'),
                    createWell('tooltips'),
                ],
            };

        case 'table':
        case 'matrix':
            return {
                chartType,
                wells: [
                    createWell('columnGroup'),
                    createWell('rowGroup'),
                    createWell('values'),
                ],
            };

        case 'card':
        case 'kpi':
            return {
                chartType,
                wells: [
                    { ...createWell('values'), label: 'Fields', maxFields: 1 },
                ],
            };

        case 'gauge':
            return {
                chartType,
                wells: [
                    { ...createWell('values'), label: 'Value', maxFields: 1 },
                    { ...createWell('values'), id: 'values', label: 'Target value', maxFields: 1, fields: [] },
                    { ...createWell('values'), id: 'values', label: 'Maximum value', maxFields: 1, fields: [] },
                ],
            };

        case 'treemap':
            return {
                chartType,
                wells: [
                    { ...createWell('axis'), label: 'Category' },
                    createWell('details'),
                    createWell('values'),
                    createWell('saturation'),
                    createWell('tooltips'),
                ],
            };

        case 'funnel':
            return {
                chartType,
                wells: [
                    createWell('axis'),
                    createWell('values'),
                    createWell('tooltips'),
                ],
            };

        case 'waterfall':
            return {
                chartType,
                wells: [
                    createWell('axis'),
                    { ...createWell('values'), label: 'Y Axis', maxFields: 1 },
                    { ...createWell('axis'), id: 'axis', label: 'Breakdown', fields: [] },
                    createWell('tooltips'),
                ],
            };

        case 'combo':
            return {
                chartType,
                wells: [
                    { ...createWell('axis'), label: 'Shared axis' },
                    { ...createWell('values'), label: 'Column values' },
                    { ...createWell('values'), id: 'values', label: 'Line values', fields: [] },
                    createWell('legend'),
                    createWell('smallMultiples'),
                    createWell('tooltips'),
                ],
            };

        default:
            return {
                chartType,
                wells: [
                    createWell('axis'),
                    createWell('values'),
                    createWell('legend'),
                    createWell('tooltips'),
                ],
            };
    }
};

// Get field icon based on data type
const getFieldIcon = (field: DataField) => {
    if (field.fieldType === 'measure') {
        return <Sigma className="w-3.5 h-3.5 text-yellow-500" />;
    }

    switch (field.dataType) {
        case 'number':
            return <Hash className="w-3.5 h-3.5 text-blue-500" />;
        case 'date':
            return <Calendar className="w-3.5 h-3.5 text-green-500" />;
        case 'string':
        default:
            return <Type className="w-3.5 h-3.5 text-purple-500" />;
    }
};

// Aggregation options
const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'distinctCount', label: 'Count (Distinct)' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'median', label: 'Median' },
    { value: 'stdDev', label: 'Standard deviation' },
    { value: 'variance', label: 'Variance' },
    { value: 'first', label: 'First' },
    { value: 'last', label: 'Last' },
    { value: 'none', label: 'Don\'t summarize' },
];

interface FieldWellsProps {
    config: FieldWellsConfig;
    onConfigChange: (config: FieldWellsConfig) => void;
    availableFields: DataField[];
    mode: 'light' | 'dark';
    onFieldDrop?: (wellId: WellType, field: DataField, index?: number) => void;
}

export const FieldWells: React.FC<FieldWellsProps> = ({
    config,
    onConfigChange,
    availableFields,
    mode,
    onFieldDrop,
}) => {
    const isDark = mode === 'dark';
    const [expandedWells, setExpandedWells] = useState<Set<WellType>>(
        new Set(config.wells.map(w => w.id))
    );
    const [draggedField, setDraggedField] = useState<DataField | null>(null);
    const [dragOverWell, setDragOverWell] = useState<WellType | null>(null);

    const toggleWellExpanded = useCallback((wellId: WellType) => {
        setExpandedWells(prev => {
            const next = new Set(prev);
            if (next.has(wellId)) {
                next.delete(wellId);
            } else {
                next.add(wellId);
            }
            return next;
        });
    }, []);

    const handleFieldDragStart = useCallback((e: React.DragEvent, field: DataField) => {
        setDraggedField(field);
        e.dataTransfer.setData('text/plain', JSON.stringify(field));
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleWellDragOver = useCallback((e: React.DragEvent, well: FieldWell) => {
        e.preventDefault();
        if (!draggedField) return;

        // Check if well accepts this field type
        if (well.accepts.includes(draggedField.fieldType)) {
            e.dataTransfer.dropEffect = 'move';
            setDragOverWell(well.id);
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    }, [draggedField]);

    const handleWellDrop = useCallback((e: React.DragEvent, well: FieldWell) => {
        e.preventDefault();
        setDragOverWell(null);

        if (!draggedField || !well.accepts.includes(draggedField.fieldType)) return;

        // Check max fields
        if (well.maxFields && well.fields.length >= well.maxFields) return;

        // Add field to well
        const newConfig = {
            ...config,
            wells: config.wells.map(w => {
                if (w.id === well.id) {
                    return {
                        ...w,
                        fields: [...w.fields, {
                            ...draggedField,
                            aggregation: draggedField.fieldType === 'measure' ? 'sum' : undefined,
                        }],
                    };
                }
                return w;
            }),
        };

        onConfigChange(newConfig);
        onFieldDrop?.(well.id, draggedField);
        setDraggedField(null);
    }, [draggedField, config, onConfigChange, onFieldDrop]);

    const removeFieldFromWell = useCallback((wellId: WellType, fieldIndex: number) => {
        const newConfig = {
            ...config,
            wells: config.wells.map(w => {
                if (w.id === wellId) {
                    const newFields = [...w.fields];
                    newFields.splice(fieldIndex, 1);
                    return { ...w, fields: newFields };
                }
                return w;
            }),
        };
        onConfigChange(newConfig);
    }, [config, onConfigChange]);

    const updateFieldAggregation = useCallback((wellId: WellType, fieldIndex: number, aggregation: AggregationType) => {
        const newConfig = {
            ...config,
            wells: config.wells.map(w => {
                if (w.id === wellId) {
                    const newFields = [...w.fields];
                    newFields[fieldIndex] = { ...newFields[fieldIndex], aggregation };
                    return { ...w, fields: newFields };
                }
                return w;
            }),
        };
        onConfigChange(newConfig);
    }, [config, onConfigChange]);

    const moveField = useCallback((wellId: WellType, fromIndex: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        const newConfig = {
            ...config,
            wells: config.wells.map(w => {
                if (w.id === wellId) {
                    const newFields = [...w.fields];
                    if (toIndex < 0 || toIndex >= newFields.length) return w;
                    [newFields[fromIndex], newFields[toIndex]] = [newFields[toIndex], newFields[fromIndex]];
                    return { ...w, fields: newFields };
                }
                return w;
            }),
        };
        onConfigChange(newConfig);
    }, [config, onConfigChange]);

    return (
        <div className="space-y-1">
            {config.wells.map((well) => (
                <WellSection
                    key={well.id}
                    well={well}
                    expanded={expandedWells.has(well.id)}
                    onToggleExpanded={() => toggleWellExpanded(well.id)}
                    isDragOver={dragOverWell === well.id}
                    isDark={isDark}
                    onDragOver={(e) => handleWellDragOver(e, well)}
                    onDragLeave={() => setDragOverWell(null)}
                    onDrop={(e) => handleWellDrop(e, well)}
                    onRemoveField={(index) => removeFieldFromWell(well.id, index)}
                    onUpdateAggregation={(index, agg) => updateFieldAggregation(well.id, index, agg)}
                    onMoveField={(index, direction) => moveField(well.id, index, direction)}
                    onFieldDragStart={handleFieldDragStart}
                />
            ))}
        </div>
    );
};

interface WellSectionProps {
    well: FieldWell;
    expanded: boolean;
    onToggleExpanded: () => void;
    isDragOver: boolean;
    isDark: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onRemoveField: (index: number) => void;
    onUpdateAggregation: (index: number, aggregation: AggregationType) => void;
    onMoveField: (index: number, direction: 'up' | 'down') => void;
    onFieldDragStart: (e: React.DragEvent, field: DataField) => void;
}

const WellSection: React.FC<WellSectionProps> = ({
    well,
    expanded,
    onToggleExpanded,
    isDragOver,
    isDark,
    onDragOver,
    onDragLeave,
    onDrop,
    onRemoveField,
    onUpdateAggregation,
    onMoveField,
    onFieldDragStart,
}) => {
    const hasFields = well.fields.length > 0;

    return (
        <div
            className={`rounded-lg border transition-all duration-200 ${isDragOver ? 'ring-2 ring-blue-500' : ''
                }`}
            style={{
                backgroundColor: isDark
                    ? isDragOver ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)'
                    : isDragOver ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0,0,0,0.02)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Header */}
            <button
                onClick={onToggleExpanded}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg"
            >
                <div className="flex items-center gap-2">
                    <ChevronRight
                        className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                    />
                    <span
                        className="w-5 h-5 flex items-center justify-center"
                        style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                    >
                        {well.icon}
                    </span>
                    <span
                        className="text-sm font-medium"
                        style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}
                    >
                        {well.label}
                    </span>
                </div>
                {hasFields && (
                    <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            color: isDark ? '#93c5fd' : '#2563eb',
                        }}
                    >
                        {well.fields.length}
                    </span>
                )}
            </button>

            {/* Content */}
            {expanded && (
                <div className="px-2 pb-2 space-y-1">
                    {well.fields.map((field, index) => (
                        <FieldPill
                            key={`${field.id}-${index}`}
                            field={field}
                            index={index}
                            totalFields={well.fields.length}
                            isDark={isDark}
                            onRemove={() => onRemoveField(index)}
                            onUpdateAggregation={(agg) => onUpdateAggregation(index, agg)}
                            onMoveUp={() => onMoveField(index, 'up')}
                            onMoveDown={() => onMoveField(index, 'down')}
                            onDragStart={(e) => onFieldDragStart(e, field)}
                            showAggregation={field.fieldType === 'measure'}
                        />
                    ))}

                    {/* Drop zone placeholder */}
                    {(!well.maxFields || well.fields.length < well.maxFields) && (
                        <div
                            className="flex items-center justify-center h-8 border-2 border-dashed rounded-md text-xs"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                            }}
                        >
                            Add data fields here
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface FieldPillProps {
    field: DataField;
    index: number;
    totalFields: number;
    isDark: boolean;
    onRemove: () => void;
    onUpdateAggregation: (aggregation: AggregationType) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDragStart: (e: React.DragEvent) => void;
    showAggregation: boolean;
}

const FieldPill: React.FC<FieldPillProps> = ({
    field,
    index,
    totalFields,
    isDark,
    onRemove,
    onUpdateAggregation,
    onMoveUp,
    onMoveDown,
    onDragStart,
    showAggregation,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showAggMenu, setShowAggMenu] = useState(false);

    return (
        <div
            className="group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-move transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            }}
            draggable
            onDragStart={onDragStart}
        >
            {/* Grip */}
            <GripVertical
                className="w-4 h-4 opacity-40 group-hover:opacity-70"
                style={{ color: isDark ? '#fff' : '#000' }}
            />

            {/* Field icon */}
            {getFieldIcon(field)}

            {/* Field name */}
            <span
                className="flex-1 text-sm truncate"
                style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}
            >
                {showAggregation && field.aggregation
                    ? `${field.aggregation.charAt(0).toUpperCase() + field.aggregation.slice(1)} of ${field.displayName}`
                    : field.displayName}
            </span>

            {/* Aggregation dropdown (for measures) */}
            {showAggregation && (
                <div className="relative">
                    <button
                        onClick={() => setShowAggMenu(!showAggMenu)}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    >
                        <ChevronDown className="w-3.5 h-3.5" style={{ color: isDark ? '#fff' : '#000', opacity: 0.6 }} />
                    </button>

                    {showAggMenu && (
                        <div
                            className="absolute right-0 top-full mt-1 z-50 py-1 rounded-lg shadow-xl border min-w-[150px]"
                            style={{
                                backgroundColor: isDark ? '#1f2937' : '#fff',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            }}
                            onMouseLeave={() => setShowAggMenu(false)}
                        >
                            {AGGREGATION_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onUpdateAggregation(opt.value);
                                        setShowAggMenu(false);
                                    }}
                                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10 ${field.aggregation === opt.value ? 'bg-blue-500/10 text-blue-500' : ''
                                        }`}
                                    style={{ color: field.aggregation === opt.value ? undefined : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Remove button */}
            <button
                onClick={onRemove}
                className="p-1 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="w-3.5 h-3.5 text-red-400" />
            </button>
        </div>
    );
};

export default FieldWells;
