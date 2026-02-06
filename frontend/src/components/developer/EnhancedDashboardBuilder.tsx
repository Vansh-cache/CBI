/**
 * Enhanced Dashboard Builder - Power BI-equivalent dashboard building experience
 * Main orchestration component integrating all dashboard building features
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import {
    // Toolbar icons
    Save, Undo, Redo, ZoomIn, ZoomOut,
    Grid, Layers, Eye, EyeOff,
    MousePointer, Hand, Copy, Trash2,
    AlignLeft, AlignCenter, AlignRight,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    // Panel icons
    PanelLeftClose, PanelRightClose,
    Filter, Bookmark, BarChart2, Settings, Table,
    // Action icons
    Play, Download, Share, MoreHorizontal,
    Plus, ChevronDown, ChevronRight,
    // View icons
    Monitor, Tablet, Smartphone,
    // Format icons
    Palette, Type, Layout,
    Lock, Unlock, RotateCcw,
} from 'lucide-react';

// Import libraries
import { Widget, createWidget, cloneWidget, WidgetType } from '../../lib/widgetSystem';
import {
    Dashboard, DashboardPage, DashboardBookmark,
    createDashboard, createPage, createBookmark,
    getActivePage, addWidgetToPage, removeWidgetFromPage, updateWidgetInPage,
    addPage, removePage, clonePage,
} from '../../lib/dashboardPage';
import {
    GridConfig, ViewportConfig, Guide,
    snapPosition, screenToCanvas, canvasToScreen,
    calculateFitZoom, calculateCenterPan,
    bringToFront, sendToBack, bringForward, sendBackward,
    alignWidgets, matchSize,
    DEFAULT_GRID_CONFIG, DEFAULT_VIEWPORT_CONFIG,
} from '../../lib/canvasEngine';
import { VisualFormat, DEFAULT_VISUAL_FORMAT } from '../../lib/formatPane';
import { useEnhancedUndoRedo, ActionType } from '../../lib/undoRedoSystem';

// Import components
import { EnhancedChartRenderer } from './EnhancedChartRenderer';
import { FormatPane } from './FormatPane';
import { FieldWells, DataField } from './FieldWells';
import { VisualizationPicker, VisualizationPickerCompact } from './VisualizationPicker';
import { FilterPanel, FilterConfig } from './FilterPanel';
import { Slicer, SlicerType } from './Slicer';
import { DrillNavigation, useDrillManager, DrillContext } from './DrillNavigation';
import { PageNavigator } from './PageNavigator';
import { BookmarksPanel } from './BookmarksPanel';
import { MobileLayoutEditor } from './MobileLayoutEditor';
import { ConditionalFormattingDialog } from './ConditionalFormattingDialog';
import { ExportDialog, ExportOptions, QuickExportButton } from './ExportManager';
import { EnhancedTooltip, ChartTooltipContent } from './EnhancedTooltip';

// Types
type ViewMode = 'desktop' | 'tablet' | 'mobile';
type ToolMode = 'select' | 'pan' | 'zoom';
type RightPanelTab = 'build' | 'format' | 'analytics' | 'data';
type LeftPanelTab = 'visuals' | 'fields' | 'filters' | 'bookmarks';

interface EnhancedDashboardBuilderProps {
    initialDashboard?: Dashboard;
    onSave?: (dashboard: Dashboard) => Promise<void>;
    datasets?: Array<{
        id: string;
        name: string;
        fields: DataField[];
    }>;
    theme?: 'light' | 'dark';
}

// View Mode Dimensions
const VIEW_DIMENSIONS: Record<ViewMode, { width: number; height: number }> = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 1024, height: 768 },
    mobile: { width: 375, height: 812 },
};

// Enhanced Dashboard Builder Component
export const EnhancedDashboardBuilder: React.FC<EnhancedDashboardBuilderProps> = ({
    initialDashboard,
    onSave,
    datasets = [],
    theme = 'light',
}) => {
    // =============== STATE ===============
    // Dashboard state
    const [dashboard, setDashboard] = useState<Dashboard>(() =>
        initialDashboard || createDashboard('Untitled Dashboard')
    );

    // Selection state
    const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>([]);
    const [hoveredWidgetId, setHoveredWidgetId] = useState<string | null>(null);

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>('desktop');
    const [toolMode, setToolMode] = useState<ToolMode>('select');
    const [viewport, setViewport] = useState<ViewportConfig>(DEFAULT_VIEWPORT_CONFIG);
    const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_GRID_CONFIG);
    const [guides, setGuides] = useState<Guide[]>([]);

    // Panel state
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>('visuals');
    const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('build');

    // Dialog state
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showConditionalFormatting, setShowConditionalFormatting] = useState(false);
    const [showMobileEditor, setShowMobileEditor] = useState(false);
    const [showVisualizationPicker, setShowVisualizationPicker] = useState(false);

    // Refs
    const canvasRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    // =============== COMPUTED VALUES ===============
    const activePage = useMemo(() => getActivePage(dashboard), [dashboard]);
    const widgets = activePage?.widgets || [];
    const selectedWidgets = useMemo(
        () => widgets.filter(w => selectedWidgetIds.includes(w.id)),
        [widgets, selectedWidgetIds]
    );
    const selectedWidget = selectedWidgets.length === 1 ? selectedWidgets[0] : null;

    // =============== UNDO/REDO ===============
    const {
        state: undoState,
        setState: setUndoState,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useEnhancedUndoRedo<Dashboard>(dashboard);

    // Sync undo state with dashboard
    useEffect(() => {
        if (undoState && undoState !== dashboard) {
            setDashboard(undoState);
        }
    }, [undoState]);

    // =============== HANDLERS ===============

    // Update dashboard with undo support
    const updateDashboard = useCallback((
        updater: (prev: Dashboard) => Dashboard,
        actionType: ActionType = 'widget/update'
    ) => {
        setDashboard(prev => {
            const next = updater(prev);
            setUndoState(next, actionType);
            return next;
        });
    }, [setUndoState]);

    // Widget selection
    const handleWidgetSelect = useCallback((widgetId: string, addToSelection?: boolean) => {
        if (addToSelection) {
            setSelectedWidgetIds(prev =>
                prev.includes(widgetId)
                    ? prev.filter(id => id !== widgetId)
                    : [...prev, widgetId]
            );
        } else {
            setSelectedWidgetIds([widgetId]);
        }
    }, []);

    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (e.target === canvasRef.current) {
            setSelectedWidgetIds([]);
        }
    }, []);

    // Add widget
    const handleAddWidget = useCallback((type: WidgetType) => {
        if (!activePage) return;

        const widget = createWidget(type, {
            x: 50 + Math.random() * 100,
            y: 50 + Math.random() * 100,
        });

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const newPages = [...prev.pages];
            newPages[pageIndex] = addWidgetToPage(newPages[pageIndex], widget);

            return { ...prev, pages: newPages };
        }, 'add');

        setSelectedWidgetIds([widget.id]);
    }, [activePage, updateDashboard]);

    // Delete selected widgets
    const handleDeleteWidgets = useCallback(() => {
        if (selectedWidgetIds.length === 0 || !activePage) return;

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const newPages = [...prev.pages];
            selectedWidgetIds.forEach(id => {
                newPages[pageIndex] = removeWidgetFromPage(newPages[pageIndex], id);
            });

            return { ...prev, pages: newPages };
        }, 'delete');

        setSelectedWidgetIds([]);
    }, [selectedWidgetIds, activePage, updateDashboard]);

    // Duplicate widgets
    const handleDuplicateWidgets = useCallback(() => {
        if (selectedWidgetIds.length === 0 || !activePage) return;

        const newWidgetIds: string[] = [];

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const newPages = [...prev.pages];
            selectedWidgets.forEach(widget => {
                const cloned = cloneWidget(widget);
                newWidgetIds.push(cloned.id);
                newPages[pageIndex] = addWidgetToPage(newPages[pageIndex], cloned);
            });

            return { ...prev, pages: newPages };
        }, 'add');

        setSelectedWidgetIds(newWidgetIds);
    }, [selectedWidgetIds, selectedWidgets, activePage, updateDashboard]);

    // Widget move
    const handleWidgetMove = useCallback((widgetId: string, x: number, y: number) => {
        if (!activePage) return;

        // Apply snap
        const otherWidgets = widgets.filter(w => w.id !== widgetId);
        const snapped = snapPosition(x, y, gridConfig, guides, otherWidgets);

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const newPages = [...prev.pages];
            newPages[pageIndex] = updateWidgetInPage(newPages[pageIndex], widgetId, {
                position: {
                    ...widgets.find(w => w.id === widgetId)!.position,
                    x: snapped.x,
                    y: snapped.y,
                },
            });

            return { ...prev, pages: newPages };
        }, 'move');
    }, [activePage, widgets, gridConfig, guides, updateDashboard]);

    // Widget resize
    const handleWidgetResize = useCallback((
        widgetId: string,
        width: number,
        height: number,
        deltaX?: number,
        deltaY?: number
    ) => {
        if (!activePage) return;

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const widget = prev.pages[pageIndex].widgets.find(w => w.id === widgetId);
            if (!widget) return prev;

            const newPages = [...prev.pages];
            newPages[pageIndex] = updateWidgetInPage(newPages[pageIndex], widgetId, {
                position: {
                    ...widget.position,
                    width: Math.max(50, width),
                    height: Math.max(50, height),
                    x: widget.position.x + (deltaX || 0),
                    y: widget.position.y + (deltaY || 0),
                },
            });

            return { ...prev, pages: newPages };
        }, 'resize');
    }, [activePage, updateDashboard]);

    // Widget format update
    const handleWidgetFormatChange = useCallback((format: Partial<VisualFormat>) => {
        if (!selectedWidget) return;

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const newPages = [...prev.pages];
            newPages[pageIndex] = updateWidgetInPage(newPages[pageIndex], selectedWidget.id, {
                format: { ...selectedWidget.format, ...format },
            });

            return { ...prev, pages: newPages };
        }, 'format');
    }, [selectedWidget, updateDashboard]);

    // Layer controls
    const handleBringToFront = useCallback(() => {
        if (!selectedWidget || !activePage) return;

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const newPages = [...prev.pages];
            newPages[pageIndex] = {
                ...newPages[pageIndex],
                widgets: bringToFront(newPages[pageIndex].widgets, selectedWidget.id),
            };

            return { ...prev, pages: newPages };
        }, 'update');
    }, [selectedWidget, activePage, updateDashboard]);

    const handleSendToBack = useCallback(() => {
        if (!selectedWidget || !activePage) return;

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const newPages = [...prev.pages];
            newPages[pageIndex] = {
                ...newPages[pageIndex],
                widgets: sendToBack(newPages[pageIndex].widgets, selectedWidget.id),
            };

            return { ...prev, pages: newPages };
        }, 'update');
    }, [selectedWidget, activePage, updateDashboard]);

    // Alignment
    const handleAlign = useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distributeH' | 'distributeV') => {
        if (selectedWidgetIds.length < 2 || !activePage) return;

        updateDashboard(prev => {
            const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
            if (pageIndex === -1) return prev;

            const newPages = [...prev.pages];
            newPages[pageIndex] = {
                ...newPages[pageIndex],
                widgets: alignWidgets(newPages[pageIndex].widgets, selectedWidgetIds, type),
            };

            return { ...prev, pages: newPages };
        }, 'update');
    }, [selectedWidgetIds, activePage, updateDashboard]);

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setViewport(prev => ({
            ...prev,
            zoom: Math.min(prev.maxZoom, prev.zoom + 25),
        }));
    }, []);

    const handleZoomOut = useCallback(() => {
        setViewport(prev => ({
            ...prev,
            zoom: Math.max(prev.minZoom, prev.zoom - 25),
        }));
    }, []);

    const handleFitToScreen = useCallback(() => {
        if (!canvasContainerRef.current) return;

        const { width: containerWidth, height: containerHeight } = canvasContainerRef.current.getBoundingClientRect();
        const { width: canvasWidth, height: canvasHeight } = VIEW_DIMENSIONS[viewMode];

        const zoom = calculateFitZoom(canvasWidth, canvasHeight, containerWidth, containerHeight);
        const { panX, panY } = calculateCenterPan(canvasWidth, canvasHeight, containerWidth, containerHeight, zoom);

        setViewport(prev => ({
            ...prev,
            zoom,
            panX,
            panY,
        }));
    }, [viewMode]);

    // Page handlers
    const handlePageSelect = useCallback((pageId: string) => {
        setDashboard(prev => ({ ...prev, activePageId: pageId }));
        setSelectedWidgetIds([]);
    }, []);

    const handlePageAdd = useCallback((page: DashboardPage) => {
        updateDashboard(prev => addPage(prev, page), 'add');
    }, [updateDashboard]);

    const handlePageDelete = useCallback((pageId: string) => {
        updateDashboard(prev => removePage(prev, pageId), 'delete');
    }, [updateDashboard]);

    const handlePageDuplicate = useCallback((pageId: string) => {
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) return;

        const duplicated = clonePage(page);
        updateDashboard(prev => addPage(prev, duplicated), 'add');
    }, [dashboard, updateDashboard]);

    // Save handler
    const handleSave = useCallback(async () => {
        if (onSave) {
            await onSave(dashboard);
        }
    }, [dashboard, onSave]);

    // Export handler
    const handleExport = useCallback(async (options: ExportOptions) => {
        if (!canvasRef.current) return;

        try {
            // Dynamic import export utilities
            const { exportToPng, exportToPdf, captureCanvasAsImage, downloadFile } = await import('./ExportManager');

            switch (options.format) {
                case 'png':
                    await exportToPng(canvasRef.current, options);
                    break;

                case 'pdf':
                    // For PDF with multiple pages
                    if (options.pages === 'all') {
                        // Would need to capture all pages - for now export current
                        await exportToPdf([canvasRef.current], options, [activePage?.name || 'Page 1']);
                    } else {
                        await exportToPdf([canvasRef.current], options, [activePage?.name || 'Page 1']);
                    }
                    break;

                case 'pptx':
                    // PowerPoint export - capture as image and notify user
                    const blob = await captureCanvasAsImage(canvasRef.current, options);
                    downloadFile(blob, `${options.fileName}.png`);
                    console.log('PowerPoint export: Image saved. Import into PowerPoint manually.');
                    break;

                default:
                    console.warn('Unknown export format:', options.format);
            }
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }, [activePage]);

    // =============== KEYBOARD SHORTCUTS ===============
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }

            // Copy/Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                handleDuplicateWidgets();
            }

            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                handleDeleteWidgets();
            }

            // Select All
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                setSelectedWidgetIds(widgets.map(w => w.id));
            }

            // Escape
            if (e.key === 'Escape') {
                setSelectedWidgetIds([]);
            }

            // Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, handleDuplicateWidgets, handleDeleteWidgets, widgets, handleSave]);

    // =============== RENDER ===============
    const isDark = theme === 'dark';
    const canvasDimensions = VIEW_DIMENSIONS[viewMode];

    return (
        <div className={`h-screen flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {/* =============== TOOLBAR =============== */}
            <div
                className={`
          flex items-center justify-between px-4 py-2 border-b
          ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}
            >
                {/* Left toolbar */}
                <div className="flex items-center gap-2">
                    {/* File operations */}
                    <div className="flex items-center gap-1 pr-3 border-r border-gray-300 dark:border-gray-600">
                        <button
                            onClick={handleSave}
                            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Save (Ctrl+S)"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Undo/Redo */}
                    <div className="flex items-center gap-1 pr-3 border-r border-gray-300 dark:border-gray-600">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className={`p-2 rounded disabled:opacity-40 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="w-4 h-4" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className={`p-2 rounded disabled:opacity-40 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Redo (Ctrl+Shift+Z)"
                        >
                            <Redo className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tools */}
                    <div className="flex items-center gap-1 pr-3 border-r border-gray-300 dark:border-gray-600">
                        <button
                            onClick={() => setToolMode('select')}
                            className={`p-2 rounded ${toolMode === 'select' ? 'bg-blue-500 text-white' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Select"
                        >
                            <MousePointer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setToolMode('pan')}
                            className={`p-2 rounded ${toolMode === 'pan' ? 'bg-blue-500 text-white' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Pan"
                        >
                            <Hand className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Widget actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleDuplicateWidgets}
                            disabled={selectedWidgetIds.length === 0}
                            className={`p-2 rounded disabled:opacity-40 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Duplicate (Ctrl+D)"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDeleteWidgets}
                            disabled={selectedWidgetIds.length === 0}
                            className={`p-2 rounded disabled:opacity-40 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Alignment (visible when multiple selected) */}
                    {selectedWidgetIds.length > 1 && (
                        <div className="flex items-center gap-1 pl-3 border-l border-gray-300 dark:border-gray-600">
                            <button onClick={() => handleAlign('left')} className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Align Left">
                                <AlignLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAlign('center')} className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Align Center">
                                <AlignCenter className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAlign('right')} className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Align Right">
                                <AlignRight className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                            <button onClick={() => handleAlign('top')} className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Align Top">
                                <AlignVerticalJustifyStart className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAlign('middle')} className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Align Middle">
                                <AlignVerticalJustifyCenter className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAlign('bottom')} className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Align Bottom">
                                <AlignVerticalJustifyEnd className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Center - View mode */}
                <div className="flex items-center gap-2">
                    <div className={`flex items-center rounded-lg p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map(mode => {
                            const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone;
                            return (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`p-2 rounded-md ${viewMode === mode ? 'bg-blue-500 text-white' : ''}`}
                                    title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            );
                        })}
                    </div>

                    {viewMode === 'mobile' && (
                        <button
                            onClick={() => setShowMobileEditor(true)}
                            className={`px-3 py-1.5 text-sm rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                            Edit Mobile Layout
                        </button>
                    )}
                </div>

                {/* Right toolbar */}
                <div className="flex items-center gap-2">
                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 pr-3 border-r border-gray-300 dark:border-gray-600">
                        <button
                            onClick={handleZoomOut}
                            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleFitToScreen}
                            className={`px-2 py-1 text-sm min-w-[60px] text-center rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                            {viewport.zoom}%
                        </button>
                        <button
                            onClick={handleZoomIn}
                            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Grid toggle */}
                    <button
                        onClick={() => setGridConfig(prev => ({ ...prev, showLines: !prev.showLines }))}
                        className={`p-2 rounded ${gridConfig.showLines ? 'text-blue-500' : ''} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        title="Toggle Grid"
                    >
                        <Grid className="w-4 h-4" />
                    </button>

                    {/* Preview/Export */}
                    <div className="flex items-center gap-1 pl-3 border-l border-gray-300 dark:border-gray-600">
                        <button
                            className={`flex items-center gap-2 px-3 py-1.5 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                            <Play className="w-4 h-4" />
                            Preview
                        </button>
                        <QuickExportButton
                            onExport={(format) => setShowExportDialog(true)}
                            theme={theme}
                        />
                    </div>
                </div>
            </div>

            {/* =============== MAIN CONTENT =============== */}
            <div className="flex-1 flex overflow-hidden">
                {/* =============== LEFT PANEL =============== */}
                {leftPanelOpen && (
                    <div
                        className={`
              w-72 flex flex-col border-r
              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}
                    >
                        {/* Panel tabs */}
                        <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            {([
                                { key: 'visuals', icon: BarChart2, label: 'Visuals' },
                                { key: 'fields', icon: Table, label: 'Fields' },
                                { key: 'filters', icon: Filter, label: 'Filters' },
                                { key: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
                            ] as const).map(({ key, icon: Icon, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setLeftPanelTab(key)}
                                    className={`
                    flex-1 flex flex-col items-center gap-1 px-2 py-2 text-xs
                    ${leftPanelTab === key
                                            ? 'border-b-2 border-blue-500 text-blue-500'
                                            : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Panel content */}
                        <div className="flex-1 overflow-y-auto">
                            {leftPanelTab === 'visuals' && (
                                <div className="p-3">
                                    <VisualizationPickerCompact
                                        onSelect={handleAddWidget}
                                        theme={theme}
                                    />
                                </div>
                            )}

                            {leftPanelTab === 'fields' && (
                                <div className="p-3">
                                    {datasets.map(dataset => (
                                        <div key={dataset.id} className="mb-4">
                                            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                {dataset.name}
                                            </h4>
                                            <div className="space-y-1">
                                                {dataset.fields.map(field => (
                                                    <div
                                                        key={field.id}
                                                        draggable
                                                        className={`
                              flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-grab
                              ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                            `}
                                                    >
                                                        {field.fieldType === 'measure' ? '∑' : '#'}
                                                        {field.displayName}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {leftPanelTab === 'filters' && (
                                <FilterPanel
                                    filters={dashboard.reportFilters}
                                    onChange={(filters) => setDashboard(prev => ({ ...prev, reportFilters: filters }))}
                                    level="report"
                                    theme={theme}
                                />
                            )}

                            {leftPanelTab === 'bookmarks' && (
                                <BookmarksPanel
                                    bookmarks={dashboard.bookmarks}
                                    groups={dashboard.bookmarkGroups}
                                    currentPageId={dashboard.activePageId}
                                    onCreateBookmark={(name, state) => {
                                        const bookmark = createBookmark(name, dashboard.activePageId, state, dashboard.bookmarks.length);
                                        setDashboard(prev => ({ ...prev, bookmarks: [...prev.bookmarks, bookmark] }));
                                    }}
                                    onApplyBookmark={(id) => {
                                        const bookmark = dashboard.bookmarks.find(b => b.id === id);
                                        if (!bookmark) return;

                                        // Navigate to the bookmark's page if different
                                        if (bookmark.pageId !== dashboard.activePageId) {
                                            setDashboard(prev => ({ ...prev, activePageId: bookmark.pageId }));
                                        }

                                        // Restore selected widgets
                                        setSelectedWidgetIds(bookmark.capturedState.selectedWidgets || []);

                                        // Restore viewport zoom and pan
                                        setViewport(prev => ({
                                            ...prev,
                                            zoom: bookmark.capturedState.zoom || prev.zoom,
                                            panX: bookmark.capturedState.pan?.x || prev.panX,
                                            panY: bookmark.capturedState.pan?.y || prev.panY,
                                        }));

                                        // Restore filters to the page
                                        if (bookmark.capturedState.filters && bookmark.displaySettings.includeFilters !== false) {
                                            setDashboard(prev => {
                                                const pageIndex = prev.pages.findIndex(p => p.id === bookmark.pageId);
                                                if (pageIndex === -1) return prev;

                                                const newPages = [...prev.pages];
                                                newPages[pageIndex] = {
                                                    ...newPages[pageIndex],
                                                    filterSettings: {
                                                        ...newPages[pageIndex].filterSettings,
                                                        filters: bookmark.capturedState.filters,
                                                    },
                                                };

                                                return { ...prev, pages: newPages };
                                            });
                                        }
                                    }}
                                    onDeleteBookmark={(id) => {
                                        setDashboard(prev => ({
                                            ...prev,
                                            bookmarks: prev.bookmarks.filter(b => b.id !== id),
                                        }));
                                    }}
                                    onRenameBookmark={(id, name) => {
                                        setDashboard(prev => ({
                                            ...prev,
                                            bookmarks: prev.bookmarks.map(b => b.id === id ? { ...b, name } : b),
                                        }));
                                    }}
                                    onUpdateBookmark={(id, updates) => {
                                        setDashboard(prev => ({
                                            ...prev,
                                            bookmarks: prev.bookmarks.map(b => b.id === id ? { ...b, ...updates } : b),
                                        }));
                                    }}
                                    onCreateGroup={(name) => {
                                        const group = {
                                            id: `group-${Date.now()}`,
                                            name,
                                            order: dashboard.bookmarkGroups.length,
                                            bookmarks: [],
                                        };
                                        setDashboard(prev => ({ ...prev, bookmarkGroups: [...prev.bookmarkGroups, group] }));
                                    }}
                                    onDeleteGroup={(id) => {
                                        setDashboard(prev => ({
                                            ...prev,
                                            bookmarkGroups: prev.bookmarkGroups.filter(g => g.id !== id),
                                            bookmarks: prev.bookmarks.map(b => b.groupId === id ? { ...b, groupId: undefined } : b),
                                        }));
                                    }}
                                    onMoveBookmarkToGroup={(bookmarkId, groupId) => {
                                        setDashboard(prev => ({
                                            ...prev,
                                            bookmarks: prev.bookmarks.map(b =>
                                                b.id === bookmarkId ? { ...b, groupId: groupId ?? undefined } : b
                                            ),
                                        }));
                                    }}
                                    getCapturedState={() => ({
                                        filters: activePage?.filterSettings.filters || [],
                                        selectedWidgets: selectedWidgetIds,
                                        highlightedData: {},
                                        slicerValues: {},
                                        zoom: viewport.zoom,
                                        pan: { x: viewport.panX, y: viewport.panY },
                                    })}
                                    theme={theme}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Panel toggle button */}
                <button
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                    className={`
            absolute left-0 top-1/2 transform -translate-y-1/2 z-10
            p-1 rounded-r-lg shadow-md
            ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'}
            ${leftPanelOpen ? 'left-72' : 'left-0'}
          `}
                >
                    <PanelLeftClose className={`w-4 h-4 ${leftPanelOpen ? '' : 'rotate-180'}`} />
                </button>

                {/* =============== CANVAS AREA =============== */}
                <div
                    ref={canvasContainerRef}
                    className={`
            flex-1 overflow-hidden relative
            ${isDark ? 'bg-gray-900' : 'bg-gray-200'}
          `}
                >
                    {/* Canvas */}
                    <div
                        ref={canvasRef}
                        className="absolute cursor-crosshair"
                        style={{
                            width: canvasDimensions.width,
                            height: canvasDimensions.height,
                            transform: `scale(${viewport.zoom / 100}) translate(${viewport.panX}px, ${viewport.panY}px)`,
                            transformOrigin: '0 0',
                            backgroundColor: activePage?.background.color || (isDark ? '#1f1f1f' : '#ffffff'),
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        }}
                        onClick={handleCanvasClick}
                    >
                        {/* Grid lines */}
                        {gridConfig.showLines && (
                            <svg
                                className="absolute inset-0 pointer-events-none"
                                width="100%"
                                height="100%"
                            >
                                <defs>
                                    <pattern
                                        id="grid"
                                        width={gridConfig.size}
                                        height={gridConfig.size}
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <path
                                            d={`M ${gridConfig.size} 0 L 0 0 0 ${gridConfig.size}`}
                                            fill="none"
                                            stroke={gridConfig.lineColor}
                                            strokeWidth="0.5"
                                        />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        )}

                        {/* Widgets */}
                        {widgets.map(widget => {
                            const isSelected = selectedWidgetIds.includes(widget.id);
                            const isHovered = hoveredWidgetId === widget.id;

                            return (
                                <Draggable
                                    key={widget.id}
                                    position={{ x: widget.position.x, y: widget.position.y }}
                                    disabled={widget.position.locked || toolMode === 'pan'}
                                    onStop={(e, data) => handleWidgetMove(widget.id, data.x, data.y)}
                                    grid={gridConfig.snapEnabled ? [gridConfig.size, gridConfig.size] : undefined}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            width: widget.position.width,
                                            height: widget.position.height,
                                            zIndex: widget.position.zIndex,
                                        }}
                                        onMouseEnter={() => setHoveredWidgetId(widget.id)}
                                        onMouseLeave={() => setHoveredWidgetId(null)}
                                    >
                                        <Resizable
                                            size={{
                                                width: widget.position.width,
                                                height: widget.position.height,
                                            }}
                                            onResizeStop={(e, direction, ref, d) => {
                                                handleWidgetResize(
                                                    widget.id,
                                                    widget.position.width + d.width,
                                                    widget.position.height + d.height
                                                );
                                            }}
                                            enable={{
                                                top: isSelected,
                                                right: isSelected,
                                                bottom: isSelected,
                                                left: isSelected,
                                                topRight: isSelected,
                                                bottomRight: isSelected,
                                                bottomLeft: isSelected,
                                                topLeft: isSelected,
                                            }}
                                            handleStyles={{
                                                top: { cursor: 'n-resize' },
                                                right: { cursor: 'e-resize' },
                                                bottom: { cursor: 's-resize' },
                                                left: { cursor: 'w-resize' },
                                                topRight: { cursor: 'ne-resize' },
                                                bottomRight: { cursor: 'se-resize' },
                                                bottomLeft: { cursor: 'sw-resize' },
                                                topLeft: { cursor: 'nw-resize' },
                                            }}
                                        >
                                            <div
                                                className={`
                          h-full w-full overflow-hidden
                          ${isSelected ? 'ring-2 ring-blue-500' : ''}
                          ${isHovered && !isSelected ? 'ring-1 ring-blue-300' : ''}
                        `}
                                                style={{
                                                    backgroundColor: widget.format.general?.backgroundColor || (isDark ? '#2d2d2d' : '#ffffff'),
                                                    borderRadius: widget.format.general?.borderRadius || 0,
                                                    borderWidth: widget.format.general?.borderWidth || 0,
                                                    borderColor: widget.format.general?.borderColor || 'transparent',
                                                    borderStyle: 'solid',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleWidgetSelect(widget.id, e.shiftKey || e.ctrlKey || e.metaKey);
                                                }}
                                            >
                                                {/* Widget content */}
                                                <EnhancedChartRenderer
                                                    widget={widget}
                                                    data={widget.staticData || []}
                                                    width={widget.position.width}
                                                    height={widget.position.height}
                                                    theme={theme}
                                                />

                                                {/* Locked indicator */}
                                                {widget.position.locked && (
                                                    <div className="absolute top-1 right-1">
                                                        <Lock className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </Resizable>
                                    </div>
                                </Draggable>
                            );
                        })}
                    </div>
                </div>

                {/* =============== RIGHT PANEL =============== */}
                {rightPanelOpen && (
                    <div
                        className={`
              w-80 flex flex-col border-l
              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}
                    >
                        {/* Panel tabs */}
                        <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            {([
                                { key: 'build', icon: Layers, label: 'Build' },
                                { key: 'format', icon: Palette, label: 'Format' },
                            ] as const).map(({ key, icon: Icon, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setRightPanelTab(key)}
                                    className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                    ${rightPanelTab === key
                                            ? 'border-b-2 border-blue-500 text-blue-500'
                                            : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Panel content */}
                        <div className="flex-1 overflow-y-auto">
                            {rightPanelTab === 'build' && (
                                <div className="p-3">
                                    {selectedWidget ? (
                                        <>
                                            <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {selectedWidget.name}
                                            </h3>
                                            <FieldWells
                                                chartType={selectedWidget.type}
                                                fields={selectedWidget.fieldWells || {}}
                                                onChange={(fields) => {
                                                    updateDashboard(prev => {
                                                        const pageIndex = prev.pages.findIndex(p => p.id === prev.activePageId);
                                                        if (pageIndex === -1) return prev;

                                                        const newPages = [...prev.pages];
                                                        newPages[pageIndex] = updateWidgetInPage(newPages[pageIndex], selectedWidget.id, {
                                                            fieldWells: fields,
                                                        });

                                                        return { ...prev, pages: newPages };
                                                    }, 'update');
                                                }}
                                                availableFields={datasets.flatMap(d => d.fields)}
                                                theme={theme}
                                            />
                                        </>
                                    ) : (
                                        <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            <Layers className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Select a visual to configure</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {rightPanelTab === 'format' && (
                                <div className="p-3">
                                    {selectedWidget ? (
                                        <FormatPane
                                            format={selectedWidget.format}
                                            onChange={handleWidgetFormatChange}
                                            widgetType={selectedWidget.type}
                                            onConditionalFormatting={() => setShowConditionalFormatting(true)}
                                            theme={theme}
                                        />
                                    ) : (
                                        <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            <Palette className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Select a visual to format</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Right panel toggle */}
                <button
                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                    className={`
            absolute right-0 top-1/2 transform -translate-y-1/2 z-10
            p-1 rounded-l-lg shadow-md
            ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'}
            ${rightPanelOpen ? 'right-80' : 'right-0'}
          `}
                >
                    <PanelRightClose className={`w-4 h-4 ${rightPanelOpen ? '' : 'rotate-180'}`} />
                </button>
            </div>

            {/* =============== PAGE NAVIGATOR =============== */}
            <PageNavigator
                pages={dashboard.pages}
                activePageId={dashboard.activePageId}
                onPageSelect={handlePageSelect}
                onPageAdd={handlePageAdd}
                onPageDelete={handlePageDelete}
                onPageRename={(pageId, name) => {
                    setDashboard(prev => ({
                        ...prev,
                        pages: prev.pages.map(p => p.id === pageId ? { ...p, name } : p),
                    }));
                }}
                onPageDuplicate={handlePageDuplicate}
                onPageReorder={(newOrder) => {
                    setDashboard(prev => ({
                        ...prev,
                        pages: newOrder.map((id, i) => {
                            const page = prev.pages.find(p => p.id === id)!;
                            return { ...page, order: i };
                        }),
                    }));
                }}
                theme={theme}
            />

            {/* =============== DIALOGS =============== */}

            {/* Export Dialog */}
            <ExportDialog
                isOpen={showExportDialog}
                onClose={() => setShowExportDialog(false)}
                onExport={handleExport}
                pages={dashboard.pages}
                currentPageId={dashboard.activePageId}
                dashboardName={dashboard.name}
                theme={theme}
            />

            {/* Conditional Formatting Dialog */}
            {showConditionalFormatting && selectedWidget && (
                <ConditionalFormattingDialog
                    isOpen={showConditionalFormatting}
                    onClose={() => setShowConditionalFormatting(false)}
                    rules={selectedWidget.format.conditionalFormatting || []}
                    onChange={(rules) => handleWidgetFormatChange({ conditionalFormatting: rules })}
                    availableFields={selectedWidget.dataBinding?.fields.map(f => ({
                        name: f.sourceField,
                        displayName: f.displayName,
                        dataType: f.dataType,
                    })) || []}
                    theme={theme}
                />
            )}

            {/* Mobile Layout Editor */}
            {showMobileEditor && (
                <MobileLayoutEditor
                    widgets={widgets}
                    mobileLayout={dashboard.mobileLayout}
                    onLayoutChange={(layout) => setDashboard(prev => ({ ...prev, mobileLayout: layout }))}
                    onClose={() => setShowMobileEditor(false)}
                    theme={theme}
                />
            )}
        </div>
    );
};

export default EnhancedDashboardBuilder;
