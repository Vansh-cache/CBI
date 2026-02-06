/**
 * Slicer Component - Power BI-style visual slicers
 * Supports: List, Dropdown, Tile, Range slider, Date range slicers
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
    ChevronDown,
    Search,
    Check,
    X,
    Calendar,
    Sliders,
    LayoutGrid,
    List,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';

export type SlicerType = 'list' | 'dropdown' | 'tile' | 'range' | 'date' | 'between';

export interface SlicerOption {
    value: any;
    label: string;
    count?: number;
    disabled?: boolean;
}

export interface SlicerConfig {
    type: SlicerType;
    title?: string;
    showTitle?: boolean;
    showSelectAll?: boolean;
    showClearButton?: boolean;
    singleSelect?: boolean;
    searchEnabled?: boolean;
    orientation?: 'vertical' | 'horizontal';
    columns?: number; // For tile view
    responsive?: boolean;
}

interface SlicerProps {
    id: string;
    config: SlicerConfig;
    options: SlicerOption[];
    selectedValues: any[];
    onSelectionChange: (values: any[]) => void;
    mode: 'light' | 'dark';
    width?: number;
    height?: number;
    // For range slicers
    min?: number;
    max?: number;
    step?: number;
    // For date slicers
    minDate?: string;
    maxDate?: string;
}

export const Slicer: React.FC<SlicerProps> = ({
    id,
    config,
    options,
    selectedValues,
    onSelectionChange,
    mode,
    width,
    height,
    min = 0,
    max = 100,
    step = 1,
    minDate,
    maxDate,
}) => {
    const isDark = mode === 'dark';

    const renderSlicer = () => {
        switch (config.type) {
            case 'list':
                return (
                    <ListSlicer
                        config={config}
                        options={options}
                        selectedValues={selectedValues}
                        onSelectionChange={onSelectionChange}
                        isDark={isDark}
                        height={height}
                    />
                );
            case 'dropdown':
                return (
                    <DropdownSlicer
                        config={config}
                        options={options}
                        selectedValues={selectedValues}
                        onSelectionChange={onSelectionChange}
                        isDark={isDark}
                    />
                );
            case 'tile':
                return (
                    <TileSlicer
                        config={config}
                        options={options}
                        selectedValues={selectedValues}
                        onSelectionChange={onSelectionChange}
                        isDark={isDark}
                    />
                );
            case 'range':
                return (
                    <RangeSlicer
                        selectedValues={selectedValues}
                        onSelectionChange={onSelectionChange}
                        min={min}
                        max={max}
                        step={step}
                        isDark={isDark}
                    />
                );
            case 'date':
                return (
                    <DateSlicer
                        selectedValues={selectedValues}
                        onSelectionChange={onSelectionChange}
                        minDate={minDate}
                        maxDate={maxDate}
                        isDark={isDark}
                    />
                );
            case 'between':
                return (
                    <BetweenSlicer
                        selectedValues={selectedValues}
                        onSelectionChange={onSelectionChange}
                        min={min}
                        max={max}
                        isDark={isDark}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="flex flex-col rounded-lg border overflow-hidden h-full"
            style={{
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                width: width || '100%',
            }}
        >
            {/* Title */}
            {config.showTitle && config.title && (
                <div
                    className="px-3 py-2 border-b font-semibold text-sm"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        color: isDark ? '#f9fafb' : '#111827',
                    }}
                >
                    {config.title}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {renderSlicer()}
            </div>
        </div>
    );
};

// List Slicer
interface ListSlicerProps {
    config: SlicerConfig;
    options: SlicerOption[];
    selectedValues: any[];
    onSelectionChange: (values: any[]) => void;
    isDark: boolean;
    height?: number;
}

const ListSlicer: React.FC<ListSlicerProps> = ({
    config,
    options,
    selectedValues,
    onSelectionChange,
    isDark,
    height,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const toggleValue = (value: any) => {
        if (config.singleSelect) {
            const isSelected = selectedValues.includes(value);
            onSelectionChange(isSelected ? [] : [value]);
        } else {
            const isSelected = selectedValues.includes(value);
            onSelectionChange(
                isSelected
                    ? selectedValues.filter(v => v !== value)
                    : [...selectedValues, value]
            );
        }
    };

    const selectAll = () => {
        onSelectionChange(options.map(opt => opt.value));
    };

    const clearAll = () => {
        onSelectionChange([]);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search & Actions */}
            <div className="px-3 py-2 space-y-2">
                {config.searchEnabled && (
                    <div
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                    >
                        <Search className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
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
                )}

                {(config.showSelectAll || config.showClearButton) && (
                    <div className="flex items-center gap-2 text-xs">
                        {config.showSelectAll && (
                            <button
                                onClick={selectAll}
                                className="text-blue-500 hover:underline"
                            >
                                Select all
                            </button>
                        )}
                        {config.showSelectAll && config.showClearButton && (
                            <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>|</span>
                        )}
                        {config.showClearButton && (
                            <button
                                onClick={clearAll}
                                className="text-blue-500 hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Options */}
            <div
                className="flex-1 overflow-y-auto px-2"
                style={{ maxHeight: height ? height - 80 : undefined }}
            >
                {filteredOptions.map((option, index) => {
                    const isSelected = selectedValues.includes(option.value);

                    return (
                        <label
                            key={index}
                            className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            style={{
                                backgroundColor: isSelected
                                    ? isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                                    : 'transparent',
                            }}
                        >
                            <input
                                type={config.singleSelect ? 'radio' : 'checkbox'}
                                checked={isSelected}
                                onChange={() => !option.disabled && toggleValue(option.value)}
                                disabled={option.disabled}
                                className="w-4 h-4 accent-blue-500"
                            />
                            <span
                                className="flex-1 text-sm truncate"
                                style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}
                            >
                                {option.label}
                            </span>
                            {option.count !== undefined && (
                                <span
                                    className="text-xs"
                                    style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                                >
                                    {option.count.toLocaleString()}
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

// Dropdown Slicer
interface DropdownSlicerProps {
    config: SlicerConfig;
    options: SlicerOption[];
    selectedValues: any[];
    onSelectionChange: (values: any[]) => void;
    isDark: boolean;
}

const DropdownSlicer: React.FC<DropdownSlicerProps> = ({
    config,
    options,
    selectedValues,
    onSelectionChange,
    isDark,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const toggleValue = (value: any) => {
        if (config.singleSelect) {
            onSelectionChange([value]);
            setIsOpen(false);
        } else {
            const isSelected = selectedValues.includes(value);
            onSelectionChange(
                isSelected
                    ? selectedValues.filter(v => v !== value)
                    : [...selectedValues, value]
            );
        }
    };

    const displayText = useMemo(() => {
        if (selectedValues.length === 0) return 'Select...';
        if (selectedValues.length === 1) {
            const opt = options.find(o => o.value === selectedValues[0]);
            return opt?.label || String(selectedValues[0]);
        }
        return `${selectedValues.length} selected`;
    }, [selectedValues, options]);

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                    borderColor: isOpen ? '#3b82f6' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                }}
            >
                <span
                    className="text-sm truncate"
                    style={{ color: selectedValues.length > 0 ? (isDark ? '#f9fafb' : '#111827') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)') }}
                >
                    {displayText}
                </span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-xl z-50 overflow-hidden"
                    style={{
                        backgroundColor: isDark ? '#1f2937' : '#fff',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        maxHeight: 300,
                    }}
                >
                    {/* Search */}
                    {config.searchEnabled && (
                        <div
                            className="px-3 py-2 border-b"
                            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                        >
                            <div
                                className="flex items-center gap-2 px-2 py-1.5 rounded"
                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                            >
                                <Search className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none"
                                    style={{ color: isDark ? '#f9fafb' : '#111827' }}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="overflow-y-auto" style={{ maxHeight: config.searchEnabled ? 240 : 280 }}>
                        {filteredOptions.map((option, index) => {
                            const isSelected = selectedValues.includes(option.value);

                            return (
                                <button
                                    key={index}
                                    onClick={() => toggleValue(option.value)}
                                    className="w-full flex items-center gap-3 px-3 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    style={{
                                        backgroundColor: isSelected
                                            ? isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                                            : 'transparent',
                                    }}
                                >
                                    {!config.singleSelect && (
                                        <div
                                            className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : ''
                                                }`}
                                            style={{
                                                borderColor: isSelected ? '#3b82f6' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                            }}
                                        >
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    )}
                                    <span
                                        className="flex-1 text-left text-sm truncate"
                                        style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}
                                    >
                                        {option.label}
                                    </span>
                                    {config.singleSelect && isSelected && (
                                        <Check className="w-4 h-4 text-blue-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Tile Slicer
interface TileSlicerProps {
    config: SlicerConfig;
    options: SlicerOption[];
    selectedValues: any[];
    onSelectionChange: (values: any[]) => void;
    isDark: boolean;
}

const TileSlicer: React.FC<TileSlicerProps> = ({
    config,
    options,
    selectedValues,
    onSelectionChange,
    isDark,
}) => {
    const toggleValue = (value: any) => {
        if (config.singleSelect) {
            const isSelected = selectedValues.includes(value);
            onSelectionChange(isSelected ? [] : [value]);
        } else {
            const isSelected = selectedValues.includes(value);
            onSelectionChange(
                isSelected
                    ? selectedValues.filter(v => v !== value)
                    : [...selectedValues, value]
            );
        }
    };

    const columns = config.columns || 3;
    const isHorizontal = config.orientation === 'horizontal';

    return (
        <div
            className={`p-2 gap-2 ${isHorizontal ? 'flex flex-wrap' : 'grid'}`}
            style={{
                gridTemplateColumns: isHorizontal ? undefined : `repeat(${columns}, 1fr)`,
            }}
        >
            {options.map((option, index) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                    <button
                        key={index}
                        onClick={() => toggleValue(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        style={{
                            backgroundColor: isSelected
                                ? '#3b82f6'
                                : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            color: isSelected
                                ? '#fff'
                                : isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                            boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.4)' : 'none',
                        }}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};

// Range Slicer
interface RangeSlicerProps {
    selectedValues: any[];
    onSelectionChange: (values: any[]) => void;
    min: number;
    max: number;
    step: number;
    isDark: boolean;
}

const RangeSlicer: React.FC<RangeSlicerProps> = ({
    selectedValues,
    onSelectionChange,
    min,
    max,
    step,
    isDark,
}) => {
    const value = typeof selectedValues[0] === 'number' ? selectedValues[0] : min;

    return (
        <div className="px-4 py-6">
            <div className="relative pt-1">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onSelectionChange([Number(e.target.value)])}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} ${((value - min) / (max - min)) * 100}%, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} 100%)`,
                    }}
                />
                <div className="flex justify-between mt-2">
                    <span
                        className="text-xs"
                        style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                    >
                        {min.toLocaleString()}
                    </span>
                    <span
                        className="text-sm font-semibold"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                    >
                        {value.toLocaleString()}
                    </span>
                    <span
                        className="text-xs"
                        style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                    >
                        {max.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Between Slicer (Range with two handles)
interface BetweenSlicerProps {
    selectedValues: any[];
    onSelectionChange: (values: any[]) => void;
    min: number;
    max: number;
    isDark: boolean;
}

const BetweenSlicer: React.FC<BetweenSlicerProps> = ({
    selectedValues,
    onSelectionChange,
    min,
    max,
    isDark,
}) => {
    const [rangeMin, rangeMax] = [
        typeof selectedValues[0] === 'number' ? selectedValues[0] : min,
        typeof selectedValues[1] === 'number' ? selectedValues[1] : max,
    ];

    return (
        <div className="px-4 py-4 space-y-4">
            {/* Min Input */}
            <div className="flex items-center gap-3">
                <span
                    className="text-xs w-12"
                    style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                >
                    From:
                </span>
                <input
                    type="number"
                    value={rangeMin}
                    min={min}
                    max={rangeMax}
                    onChange={(e) => onSelectionChange([Number(e.target.value), rangeMax])}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border bg-transparent"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        color: isDark ? '#f9fafb' : '#111827',
                    }}
                />
            </div>

            {/* Max Input */}
            <div className="flex items-center gap-3">
                <span
                    className="text-xs w-12"
                    style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                >
                    To:
                </span>
                <input
                    type="number"
                    value={rangeMax}
                    min={rangeMin}
                    max={max}
                    onChange={(e) => onSelectionChange([rangeMin, Number(e.target.value)])}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border bg-transparent"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        color: isDark ? '#f9fafb' : '#111827',
                    }}
                />
            </div>

            {/* Range visualization */}
            <div
                className="h-2 rounded-full relative"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
                <div
                    className="absolute h-full rounded-full bg-blue-500"
                    style={{
                        left: `${((rangeMin - min) / (max - min)) * 100}%`,
                        right: `${((max - rangeMax) / (max - min)) * 100}%`,
                    }}
                />
            </div>
        </div>
    );
};

// Date Slicer
interface DateSlicerProps {
    selectedValues: any[];
    onSelectionChange: (values: any[]) => void;
    minDate?: string;
    maxDate?: string;
    isDark: boolean;
}

const DateSlicer: React.FC<DateSlicerProps> = ({
    selectedValues,
    onSelectionChange,
    minDate,
    maxDate,
    isDark,
}) => {
    const startDate = selectedValues[0] || '';
    const endDate = selectedValues[1] || '';

    return (
        <div className="px-4 py-4 space-y-4">
            {/* Start Date */}
            <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                <input
                    type="date"
                    value={startDate}
                    min={minDate}
                    max={endDate || maxDate}
                    onChange={(e) => onSelectionChange([e.target.value, endDate])}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border bg-transparent"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        color: isDark ? '#f9fafb' : '#111827',
                    }}
                />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                <input
                    type="date"
                    value={endDate}
                    min={startDate || minDate}
                    max={maxDate}
                    onChange={(e) => onSelectionChange([startDate, e.target.value])}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border bg-transparent"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        color: isDark ? '#f9fafb' : '#111827',
                    }}
                />
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1">
                {['Today', 'This Week', 'This Month', 'This Year'].map(preset => (
                    <button
                        key={preset}
                        onClick={() => {
                            const now = new Date();
                            let start: Date, end: Date;

                            switch (preset) {
                                case 'Today':
                                    start = end = now;
                                    break;
                                case 'This Week':
                                    start = new Date(now.setDate(now.getDate() - now.getDay()));
                                    end = new Date(now.setDate(now.getDate() + 6));
                                    break;
                                case 'This Month':
                                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                    break;
                                case 'This Year':
                                    start = new Date(now.getFullYear(), 0, 1);
                                    end = new Date(now.getFullYear(), 11, 31);
                                    break;
                                default:
                                    start = end = now;
                            }

                            onSelectionChange([
                                start.toISOString().split('T')[0],
                                end.toISOString().split('T')[0],
                            ]);
                        }}
                        className="px-2 py-1 text-xs rounded hover:bg-blue-500/20 transition-colors"
                        style={{ color: '#3b82f6' }}
                    >
                        {preset}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Slicer;
