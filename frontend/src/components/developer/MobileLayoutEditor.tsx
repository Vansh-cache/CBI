/**
 * Mobile Layout Editor - Power BI-style mobile layout configuration
 * Allows configuring widget layout specifically for mobile devices
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    Smartphone,
    Tablet,
    Monitor,
    Eye,
    EyeOff,
    Move,
    Maximize2,
    RotateCcw,
    ChevronUp,
    ChevronDown,
    Copy,
    Trash2,
    Check,
    X,
} from 'lucide-react';
import {
    DeviceType,
    ResponsiveWidgetLayout,
    createDefaultResponsiveLayout,
    autoLayoutForMobile,
    autoLayoutForTablet,
    getBreakpoint,
    LAYOUT_BREAKPOINTS,
} from '../../lib/responsiveLayout';

interface Widget {
    id: string;
    type: string;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    responsiveLayout?: ResponsiveWidgetLayout;
}

interface MobileLayoutEditorProps {
    widgets: Widget[];
    onUpdateWidget: (id: string, updates: Partial<Widget>) => void;
    onClose: () => void;
    isDark: boolean;
    colors: {
        text: string;
        muted: string;
        bg: string;
        border: string;
        accent: string;
    };
}

export const MobileLayoutEditor: React.FC<MobileLayoutEditorProps> = ({
    widgets,
    onUpdateWidget,
    onClose,
    isDark,
    colors,
}) => {
    const [selectedDevice, setSelectedDevice] = useState<DeviceType>('mobile');
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const [previewScale, setPreviewScale] = useState(0.5);

    const deviceConfig = useMemo(() => getBreakpoint(selectedDevice), [selectedDevice]);

    const getWidgetLayout = useCallback((widget: Widget) => {
        if (!widget.responsiveLayout) {
            return createDefaultResponsiveLayout(widget.position, widget.size);
        }
        return widget.responsiveLayout;
    }, []);

    const updateWidgetLayout = useCallback((
        widgetId: string,
        device: DeviceType,
        updates: Partial<ResponsiveWidgetLayout[DeviceType]>
    ) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;

        const currentLayout = getWidgetLayout(widget);
        const newLayout: ResponsiveWidgetLayout = {
            ...currentLayout,
            [device]: {
                ...currentLayout[device],
                ...updates,
            },
        };

        onUpdateWidget(widgetId, { responsiveLayout: newLayout });
    }, [widgets, getWidgetLayout, onUpdateWidget]);

    const toggleVisibility = useCallback((widgetId: string) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;

        const currentLayout = getWidgetLayout(widget);
        updateWidgetLayout(widgetId, selectedDevice, {
            visible: !currentLayout[selectedDevice].visible,
        });
    }, [widgets, selectedDevice, getWidgetLayout, updateWidgetLayout]);

    const moveWidgetUp = useCallback((widgetId: string) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;

        const currentLayout = getWidgetLayout(widget);
        const currentOrder = currentLayout[selectedDevice].order;
        if (currentOrder <= 0) return;

        // Find the widget above
        const widgetAbove = widgets.find(w => {
            const layout = getWidgetLayout(w);
            return layout[selectedDevice].order === currentOrder - 1;
        });

        if (widgetAbove) {
            updateWidgetLayout(widgetId, selectedDevice, { order: currentOrder - 1 });
            updateWidgetLayout(widgetAbove.id, selectedDevice, { order: currentOrder });
        }
    }, [widgets, selectedDevice, getWidgetLayout, updateWidgetLayout]);

    const moveWidgetDown = useCallback((widgetId: string) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;

        const currentLayout = getWidgetLayout(widget);
        const currentOrder = currentLayout[selectedDevice].order;

        // Find the widget below
        const widgetBelow = widgets.find(w => {
            const layout = getWidgetLayout(w);
            return layout[selectedDevice].order === currentOrder + 1;
        });

        if (widgetBelow) {
            updateWidgetLayout(widgetId, selectedDevice, { order: currentOrder + 1 });
            updateWidgetLayout(widgetBelow.id, selectedDevice, { order: currentOrder });
        }
    }, [widgets, selectedDevice, getWidgetLayout, updateWidgetLayout]);

    const autoLayout = useCallback(() => {
        const widgetList = widgets.map(w => ({
            id: w.id,
            size: w.size,
        }));

        let layouts: Map<string, { position: { x: number; y: number }; size: { width: number; height: number } }>;

        if (selectedDevice === 'mobile') {
            layouts = autoLayoutForMobile(widgetList, deviceConfig.canvasWidth, 10, 48);
        } else if (selectedDevice === 'tablet') {
            layouts = autoLayoutForTablet(widgetList, deviceConfig.canvasWidth, 10, 48);
        } else {
            return; // Desktop uses original layout
        }

        layouts.forEach((layout, widgetId) => {
            updateWidgetLayout(widgetId, selectedDevice, {
                position: layout.position,
                size: layout.size,
            });
        });
    }, [widgets, selectedDevice, deviceConfig, updateWidgetLayout]);

    const resetToDesktop = useCallback(() => {
        widgets.forEach(widget => {
            updateWidgetLayout(widget.id, selectedDevice, {
                position: widget.position,
                size: widget.size,
                visible: true,
                order: 0,
            });
        });
    }, [widgets, selectedDevice, updateWidgetLayout]);

    const sortedWidgets = useMemo(() => {
        return [...widgets].sort((a, b) => {
            const layoutA = getWidgetLayout(a);
            const layoutB = getWidgetLayout(b);
            return layoutA[selectedDevice].order - layoutB[selectedDevice].order;
        });
    }, [widgets, selectedDevice, getWidgetLayout]);

    const selectedWidget = useMemo(() => {
        return widgets.find(w => w.id === selectedWidgetId);
    }, [widgets, selectedWidgetId]);

    return (
        <div
            className="fixed inset-0 z-50 flex"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div
                className="flex-1 flex flex-col"
                style={{ backgroundColor: colors.bg }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: colors.border }}
                >
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                            Mobile Layout Editor
                        </h2>

                        {/* Device Selector */}
                        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                            {LAYOUT_BREAKPOINTS.map((bp) => {
                                const Icon = bp.name === 'mobile' ? Smartphone : bp.name === 'tablet' ? Tablet : Monitor;
                                return (
                                    <button
                                        key={bp.name}
                                        onClick={() => setSelectedDevice(bp.name)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                                        style={{
                                            backgroundColor: selectedDevice === bp.name ? colors.accent : 'transparent',
                                            color: selectedDevice === bp.name ? '#fff' : colors.muted,
                                        }}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm font-medium capitalize">{bp.name}</span>
                                        <span className="text-xs opacity-75">
                                            {bp.canvasWidth}×{bp.canvasHeight}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={autoLayout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
                            style={{
                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                color: colors.text,
                            }}
                        >
                            <Maximize2 className="w-4 h-4" />
                            Auto Layout
                        </button>

                        <button
                            onClick={resetToDesktop}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
                            style={{
                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                color: colors.text,
                            }}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>

                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
                            style={{
                                backgroundColor: '#107c10',
                                color: '#fff',
                            }}
                        >
                            <Check className="w-4 h-4" />
                            Done
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" style={{ color: colors.muted }} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Preview Area */}
                    <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                        <div
                            className="relative rounded-lg shadow-2xl overflow-hidden"
                            style={{
                                width: deviceConfig.canvasWidth * previewScale,
                                height: deviceConfig.canvasHeight * previewScale,
                                backgroundColor: '#f8f9fa',
                                border: `2px solid ${colors.border}`,
                            }}
                        >
                            {/* Device Frame */}
                            {selectedDevice === 'mobile' && (
                                <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 rounded-b-lg"
                                    style={{ backgroundColor: colors.border }}
                                />
                            )}

                            {/* Canvas */}
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{
                                    transform: `scale(${previewScale})`,
                                    transformOrigin: 'top left',
                                    width: deviceConfig.canvasWidth,
                                    height: deviceConfig.canvasHeight,
                                }}
                            >
                                {/* Header */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-12 flex items-center px-4"
                                    style={{ backgroundColor: '#f8f9fa', borderBottom: `1px solid ${colors.border}` }}
                                >
                                    <span className="text-sm font-semibold" style={{ color: '#333' }}>
                                        Dashboard Preview
                                    </span>
                                </div>

                                {/* Widgets */}
                                {sortedWidgets.map((widget) => {
                                    const layout = getWidgetLayout(widget);
                                    const deviceLayout = layout[selectedDevice];

                                    if (!deviceLayout.visible) return null;

                                    return (
                                        <div
                                            key={widget.id}
                                            onClick={() => setSelectedWidgetId(widget.id)}
                                            className="absolute rounded-lg shadow cursor-pointer transition-all"
                                            style={{
                                                left: deviceLayout.position.x,
                                                top: deviceLayout.position.y,
                                                width: deviceLayout.size.width,
                                                height: deviceLayout.size.height,
                                                backgroundColor: '#fff',
                                                border: selectedWidgetId === widget.id
                                                    ? `2px solid ${colors.accent}`
                                                    : '1px solid #e0e0e0',
                                                opacity: deviceLayout.visible ? 1 : 0.5,
                                            }}
                                        >
                                            <div
                                                className="px-2 py-1 text-xs font-medium truncate"
                                                style={{ color: '#333', backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}
                                            >
                                                {widget.title}
                                            </div>
                                            <div className="flex items-center justify-center h-[calc(100%-28px)]">
                                                <span className="text-xs opacity-50" style={{ color: '#666' }}>
                                                    {widget.type}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Widget List Panel */}
                    <div
                        className="w-80 border-l flex flex-col"
                        style={{ borderColor: colors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}
                    >
                        <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                            <h3 className="text-sm font-semibold" style={{ color: colors.text }}>
                                Widgets ({sortedWidgets.length})
                            </h3>
                            <p className="text-xs mt-1" style={{ color: colors.muted }}>
                                Drag to reorder, toggle visibility
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {sortedWidgets.map((widget, index) => {
                                const layout = getWidgetLayout(widget);
                                const deviceLayout = layout[selectedDevice];

                                return (
                                    <div
                                        key={widget.id}
                                        onClick={() => setSelectedWidgetId(widget.id)}
                                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors"
                                        style={{
                                            backgroundColor: selectedWidgetId === widget.id
                                                ? isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                : 'transparent',
                                            border: selectedWidgetId === widget.id
                                                ? `1px solid ${colors.accent}`
                                                : '1px solid transparent',
                                            opacity: deviceLayout.visible ? 1 : 0.5,
                                        }}
                                    >
                                        {/* Order Controls */}
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveWidgetUp(widget.id);
                                                }}
                                                disabled={index === 0}
                                                className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                                            >
                                                <ChevronUp className="w-3 h-3" style={{ color: colors.muted }} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveWidgetDown(widget.id);
                                                }}
                                                disabled={index === sortedWidgets.length - 1}
                                                className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                                            >
                                                <ChevronDown className="w-3 h-3" style={{ color: colors.muted }} />
                                            </button>
                                        </div>

                                        {/* Widget Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium truncate" style={{ color: colors.text }}>
                                                {widget.title}
                                            </div>
                                            <div className="text-[10px]" style={{ color: colors.muted }}>
                                                {widget.type} • {deviceLayout.size.width}×{deviceLayout.size.height}
                                            </div>
                                        </div>

                                        {/* Visibility Toggle */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleVisibility(widget.id);
                                            }}
                                            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                                        >
                                            {deviceLayout.visible ? (
                                                <Eye className="w-4 h-4" style={{ color: colors.muted }} />
                                            ) : (
                                                <EyeOff className="w-4 h-4" style={{ color: colors.muted }} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selected Widget Properties */}
                        {selectedWidget && (
                            <div
                                className="border-t p-4 space-y-3"
                                style={{ borderColor: colors.border }}
                            >
                                <h4 className="text-xs font-semibold" style={{ color: colors.text }}>
                                    {selectedWidget.title} Properties
                                </h4>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] mb-1" style={{ color: colors.muted }}>
                                            Width
                                        </label>
                                        <input
                                            type="number"
                                            value={getWidgetLayout(selectedWidget)[selectedDevice].size.width}
                                            onChange={(e) => updateWidgetLayout(selectedWidget.id, selectedDevice, {
                                                size: {
                                                    ...getWidgetLayout(selectedWidget)[selectedDevice].size,
                                                    width: Number(e.target.value),
                                                },
                                            })}
                                            className="w-full px-2 py-1 text-xs rounded border outline-none"
                                            style={{
                                                backgroundColor: colors.bg,
                                                borderColor: colors.border,
                                                color: colors.text,
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] mb-1" style={{ color: colors.muted }}>
                                            Height
                                        </label>
                                        <input
                                            type="number"
                                            value={getWidgetLayout(selectedWidget)[selectedDevice].size.height}
                                            onChange={(e) => updateWidgetLayout(selectedWidget.id, selectedDevice, {
                                                size: {
                                                    ...getWidgetLayout(selectedWidget)[selectedDevice].size,
                                                    height: Number(e.target.value),
                                                },
                                            })}
                                            className="w-full px-2 py-1 text-xs rounded border outline-none"
                                            style={{
                                                backgroundColor: colors.bg,
                                                borderColor: colors.border,
                                                color: colors.text,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] mb-1" style={{ color: colors.muted }}>
                                            X Position
                                        </label>
                                        <input
                                            type="number"
                                            value={getWidgetLayout(selectedWidget)[selectedDevice].position.x}
                                            onChange={(e) => updateWidgetLayout(selectedWidget.id, selectedDevice, {
                                                position: {
                                                    ...getWidgetLayout(selectedWidget)[selectedDevice].position,
                                                    x: Number(e.target.value),
                                                },
                                            })}
                                            className="w-full px-2 py-1 text-xs rounded border outline-none"
                                            style={{
                                                backgroundColor: colors.bg,
                                                borderColor: colors.border,
                                                color: colors.text,
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] mb-1" style={{ color: colors.muted }}>
                                            Y Position
                                        </label>
                                        <input
                                            type="number"
                                            value={getWidgetLayout(selectedWidget)[selectedDevice].position.y}
                                            onChange={(e) => updateWidgetLayout(selectedWidget.id, selectedDevice, {
                                                position: {
                                                    ...getWidgetLayout(selectedWidget)[selectedDevice].position,
                                                    y: Number(e.target.value),
                                                },
                                            })}
                                            className="w-full px-2 py-1 text-xs rounded border outline-none"
                                            style={{
                                                backgroundColor: colors.bg,
                                                borderColor: colors.border,
                                                color: colors.text,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Zoom Control */}
                <div
                    className="flex items-center justify-center gap-4 px-4 py-2 border-t"
                    style={{ borderColor: colors.border }}
                >
                    <span className="text-xs" style={{ color: colors.muted }}>
                        Preview Zoom
                    </span>
                    <input
                        type="range"
                        min={0.25}
                        max={1}
                        step={0.05}
                        value={previewScale}
                        onChange={(e) => setPreviewScale(Number(e.target.value))}
                        className="w-32 accent-[#107c10]"
                    />
                    <span className="text-xs font-mono w-12" style={{ color: colors.text }}>
                        {Math.round(previewScale * 100)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MobileLayoutEditor;
