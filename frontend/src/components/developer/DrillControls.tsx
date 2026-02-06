/**
 * Drill Controls - Power BI-style drill-down/drill-through controls
 * Provides UI for managing hierarchical navigation in visuals
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Layers, X, Plus } from 'lucide-react';
import { Widget } from '../shared/WidgetRenderer';
import { DrillPath, DrillState, drillManager } from '../../lib/drillManager';

interface DrillControlsProps {
    widgets: Widget[];
    selectedWidgetId?: string;
    onDrillDown: (widgetId: string, value: any) => void;
    onDrillUp: (widgetId: string) => void;
    onResetDrill: (widgetId: string) => void;
    onStartDrill: (widgetId: string, pathId: string) => void;
    onClose: () => void;
    isDark: boolean;
    colors: any;
}

export default function DrillControls({
    widgets,
    selectedWidgetId,
    onDrillDown,
    onDrillUp,
    onResetDrill,
    onStartDrill,
    onClose,
    isDark,
    colors,
}: DrillControlsProps) {
    const [selectedWidget, setSelectedWidget] = useState<string>(selectedWidgetId || '');
    const [selectedPath, setSelectedPath] = useState<string>('');

    const availablePaths = drillManager.getDrillPaths();
    const widgetObj = widgets.find(w => w.id === selectedWidget);
    const drillState = selectedWidget ? drillManager.getDrillState(selectedWidget) : undefined;
    const isDrilling = selectedWidget ? drillManager.isDrilling(selectedWidget) : false;
    const canDrillDown = selectedWidget ? drillManager.canDrillDown(selectedWidget) : false;
    const canDrillUp = selectedWidget ? drillManager.canDrillUp(selectedWidget) : false;

    const handleStartDrill = () => {
        if (selectedWidget && selectedPath) {
            onStartDrill(selectedWidget, selectedPath);
        }
    };

    const handleResetDrill = () => {
        if (selectedWidget) {
            onResetDrill(selectedWidget);
        }
    };

    const getCurrentPath = (): DrillPath | undefined => {
        if (!drillState) return undefined;
        return drillManager.getDrillPath(drillState.pathId);
    };

    const currentPath = getCurrentPath();
    const currentLevelField = selectedWidget ? drillManager.getCurrentLevelField(selectedWidget) : undefined;

    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: colors.cardBg }}>
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: colors.cardBorder }}>
                <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <h3 style={{ color: colors.text }} className="font-semibold">Drill Controls</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: colors.muted }}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Widget Selector */}
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.cardBorder }}>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                    Select Visual
                </label>
                <select
                    value={selectedWidget}
                    onChange={(e) => setSelectedWidget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                    }}
                >
                    <option value="">Choose a visual...</option>
                    {widgets.map(widget => (
                        <option key={widget.id} value={widget.id}>
                            {widget.title || widget.type}
                        </option>
                    ))}
                </select>
            </div>

            {selectedWidget ? (
                <>
                    {/* Current Drill State */}
                    {isDrilling && currentPath ? (
                        <div className="px-4 py-3 border-b" style={{ borderColor: colors.cardBorder }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium" style={{ color: colors.text }}>
                                    Active Drill Path
                                </span>
                                <button
                                    onClick={handleResetDrill}
                                    className="text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-1"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div
                                    className="px-3 py-2 rounded-lg"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                    }}
                                >
                                    <p className="text-xs font-medium" style={{ color: '#ef4444' }}>
                                        {currentPath.name}
                                    </p>
                                </div>

                                {/* Breadcrumb */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {currentPath.levels.slice(0, (drillState?.currentLevel || 0) + 1).map((level, idx) => (
                                        <React.Fragment key={level.field}>
                                            {idx > 0 && <ChevronDown className="w-3 h-3" style={{ color: colors.muted }} />}
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${idx === drillState?.currentLevel ? 'font-medium' : ''
                                                    }`}
                                                style={{
                                                    backgroundColor: idx === drillState?.currentLevel
                                                        ? isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6'
                                                        : 'transparent',
                                                    color: idx === drillState?.currentLevel ? colors.text : colors.muted,
                                                }}
                                            >
                                                {level.displayName}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Drill Filters */}
                                {drillState && drillState.filters.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-medium" style={{ color: colors.muted }}>
                                            Applied Filters:
                                        </p>
                                        {drillState.filters.map((filter, idx) => (
                                            <div
                                                key={idx}
                                                className="text-xs px-2 py-1 rounded"
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                                                    color: colors.text,
                                                }}
                                            >
                                                <strong>{filter.field}:</strong> {String(filter.value)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Drill Navigation */}
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => onDrillUp(selectedWidget)}
                                    disabled={!canDrillUp}
                                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                                        color: colors.text,
                                    }}
                                >
                                    <ChevronUp className="w-4 h-4" />
                                    Drill Up
                                </button>
                                <button
                                    disabled={!canDrillDown}
                                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                    style={{
                                        backgroundColor: canDrillDown
                                            ? '#ef4444'
                                            : isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                                        color: canDrillDown ? '#ffffff' : colors.muted,
                                    }}
                                >
                                    <ChevronDown className="w-4 h-4" />
                                    Drill Down
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Drill Path Setup */
                        <div className="px-4 py-3 border-b" style={{ borderColor: colors.cardBorder }}>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                                Drill Path
                            </label>
                            <select
                                value={selectedPath}
                                onChange={(e) => setSelectedPath(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-3"
                                style={{
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.inputBorder,
                                    color: colors.text,
                                }}
                            >
                                <option value="">Select a drill path...</option>
                                {availablePaths.map(path => (
                                    <option key={path.id} value={path.id}>
                                        {path.name}
                                    </option>
                                ))}
                            </select>

                            {selectedPath && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium mb-2" style={{ color: colors.muted }}>
                                        Hierarchy Levels:
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {availablePaths
                                            .find(p => p.id === selectedPath)
                                            ?.levels.map((level, idx) => (
                                                <React.Fragment key={level.field}>
                                                    {idx > 0 && <ChevronDown className="w-3 h-3" style={{ color: colors.muted }} />}
                                                    <span
                                                        className="text-xs px-2 py-1 rounded"
                                                        style={{
                                                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                                                            color: colors.text,
                                                        }}
                                                    >
                                                        {level.displayName}
                                                    </span>
                                                </React.Fragment>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleStartDrill}
                                disabled={!selectedPath}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Enable Drill Mode
                            </button>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div
                            className="rounded-lg p-4"
                            style={{
                                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                borderLeft: '3px solid #ef4444',
                            }}
                        >
                            <p className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                                How to use Drill Mode
                            </p>
                            <ul className="text-xs space-y-1" style={{ color: colors.muted }}>
                                <li>• Select a drill path to enable hierarchical navigation</li>
                                <li>• Click on data points in the visual to drill down</li>
                                <li>• Use "Drill Up" to navigate back up the hierarchy</li>
                                <li>• Filters are applied automatically as you drill</li>
                                <li>• Reset to return to the top level</li>
                            </ul>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: colors.muted }} />
                        <p style={{ color: colors.text }} className="font-medium mb-1">
                            Select a Visual
                        </p>
                        <p style={{ color: colors.muted }} className="text-sm">
                            Choose a visual to configure drill-down
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
