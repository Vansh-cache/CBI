/**
 * Visual Interaction Controls - Power BI-style interaction editor
 * Allows configuring how visuals interact with each other (filter, highlight, none)
 */

import React, { useState } from 'react';
import { MousePointer2, Eye, Ban, Settings, X } from 'lucide-react';
import { Widget } from '../shared/WidgetRenderer';
import { InteractionMode } from '../../lib/crossFilterEngine';

interface VisualInteractionControlsProps {
    widgets: Widget[];
    selectedWidgetId?: string;
    onSetInteraction: (sourceWidgetId: string, targetWidgetId: string, mode: InteractionMode) => void;
    onGetInteraction: (sourceWidgetId: string, targetWidgetId: string) => InteractionMode;
    onClose: () => void;
    isDark: boolean;
    colors: any;
}

export default function VisualInteractionControls({
    widgets,
    selectedWidgetId,
    onSetInteraction,
    onGetInteraction,
    onClose,
    isDark,
    colors,
}: VisualInteractionControlsProps) {
    const [sourceWidget, setSourceWidget] = useState<string>(selectedWidgetId || '');

    const sourceWidgetObj = widgets.find(w => w.id === sourceWidget);
    const targetWidgets = widgets.filter(w => w.id !== sourceWidget);

    const getInteractionIcon = (mode: InteractionMode) => {
        switch (mode) {
            case 'filter':
                return <MousePointer2 className="w-4 h-4" />;
            case 'highlight':
                return <Eye className="w-4 h-4" />;
            case 'none':
                return <Ban className="w-4 h-4" />;
        }
    };

    const getInteractionLabel = (mode: InteractionMode) => {
        switch (mode) {
            case 'filter':
                return 'Filter';
            case 'highlight':
                return 'Highlight';
            case 'none':
                return 'None';
        }
    };

    const getInteractionColor = (mode: InteractionMode) => {
        switch (mode) {
            case 'filter':
                return '#3b82f6'; // Blue
            case 'highlight':
                return '#f59e0b'; // Amber
            case 'none':
                return '#6b7280'; // Gray
        }
    };

    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: colors.cardBg }}>
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: colors.cardBorder }}>
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <h3 style={{ color: colors.text }} className="font-semibold">Visual Interactions</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: colors.muted }}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Source Widget Selector */}
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.cardBorder }}>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                    Source Visual
                </label>
                <select
                    value={sourceWidget}
                    onChange={(e) => setSourceWidget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                    }}
                >
                    <option value="">Select a visual...</option>
                    {widgets.map(widget => (
                        <option key={widget.id} value={widget.id}>
                            {widget.title || widget.type}
                        </option>
                    ))}
                </select>
                {sourceWidgetObj && (
                    <p className="mt-2 text-xs" style={{ color: colors.muted }}>
                        Configure how <strong>{sourceWidgetObj.title || sourceWidgetObj.type}</strong> affects other visuals
                    </p>
                )}
            </div>

            {/* Interaction Matrix */}
            {sourceWidget ? (
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-3">
                        {targetWidgets.map(targetWidget => {
                            const currentMode = onGetInteraction(sourceWidget, targetWidget.id);

                            return (
                                <div
                                    key={targetWidget.id}
                                    className="border rounded-lg p-3"
                                    style={{ borderColor: colors.cardBorder }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm" style={{ color: colors.text }}>
                                            {targetWidget.title || targetWidget.type}
                                        </span>
                                        <span
                                            className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                            style={{
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                                                color: getInteractionColor(currentMode),
                                            }}
                                        >
                                            {getInteractionIcon(currentMode)}
                                            {getInteractionLabel(currentMode)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {(['filter', 'highlight', 'none'] as InteractionMode[]).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => onSetInteraction(sourceWidget, targetWidget.id, mode)}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${currentMode === mode ? 'ring-2' : ''
                                                    }`}
                                                style={{
                                                    backgroundColor: currentMode === mode
                                                        ? isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                                                        : isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                                                    color: currentMode === mode ? getInteractionColor(mode) : colors.muted,
                                                    borderColor: currentMode === mode ? getInteractionColor(mode) : 'transparent',
                                                }}
                                            >
                                                {getInteractionIcon(mode)}
                                                {getInteractionLabel(mode)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Settings className="w-12 h-12 mx-auto mb-3" style={{ color: colors.muted }} />
                        <p style={{ color: colors.text }} className="font-medium mb-1">
                            Select a Source Visual
                        </p>
                        <p style={{ color: colors.muted }} className="text-sm">
                            Choose a visual to configure its interactions
                        </p>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="px-4 py-3 border-t" style={{ borderColor: colors.cardBorder }}>
                <p className="text-xs font-medium mb-2" style={{ color: colors.text }}>
                    Interaction Modes
                </p>
                <div className="space-y-1 text-xs" style={{ color: colors.muted }}>
                    <div className="flex items-center gap-2">
                        <MousePointer2 className="w-3 h-3" style={{ color: '#3b82f6' }} />
                        <span><strong>Filter:</strong> Clicking filters target visual data</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Eye className="w-3 h-3" style={{ color: '#f59e0b' }} />
                        <span><strong>Highlight:</strong> Clicking highlights related data</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Ban className="w-3 h-3" style={{ color: '#6b7280' }} />
                        <span><strong>None:</strong> No interaction between visuals</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
