/**
 * Dashboard Builder Component Exports
 * Provides all dashboard building components and utilities
 */

// Core Library Exports - Types
export type {
    Widget,
    WidgetType,
    WidgetState,
    DataBinding,
    BoundField,
    InteractionConfig,
    WidgetPosition,
    WidgetTemplate,
} from './lib/widgetSystem';

// Core Library Exports - Functions
export {
    createWidget,
    cloneWidget,
    updateWidget,
    updateWidgetPosition,
    updateWidgetFormat,
    bindDataToWidget,
    widgetSupports,
    widgetRequiresData,
    isChartWidget,
    getWidgetCategory,
    validateWidget,
} from './lib/widgetSystem';

// Dashboard Page Types
export type {
    Dashboard,
    DashboardPage,
    DashboardBookmark,
    BookmarkGroup,
    DashboardTheme,
    PageBackground,
    PageDimensions,
    PageType,
    PageCanvasSettings,
    PageFilterSettings,
} from './lib/dashboardPage';

// Dashboard Page Functions
export {
    createDashboard,
    createPage,
    createDrillthroughPage,
    createTooltipPage,
    createBookmark,
    clonePage,
    getPageById,
    getActivePage,
    addWidgetToPage,
    removeWidgetFromPage,
    updateWidgetInPage,
    addPage,
    removePage,
    reorderPages,
    applyBookmark,
    exportDashboardToJSON,
    importDashboardFromJSON,
    validateDashboard,
    PAGE_DIMENSION_PRESETS,
    DEFAULT_THEME,
} from './lib/dashboardPage';

// Canvas Engine Types
export type {
    GridConfig,
    RulerConfig,
    Guide,
    ViewportConfig,
    CanvasBounds,
    SelectionBox,
    SnapResult,
    AlignmentType,
} from './lib/canvasEngine';

// Canvas Engine Functions
export {
    snapToGrid,
    snapPosition,
    screenToCanvas,
    canvasToScreen,
    calculateFitZoom,
    calculateCenterPan,
    isWidgetInSelection,
    widgetIntersectsSelection,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    alignWidgets,
    matchSize,
    useCanvasInteraction,
    useSelectionBox,
    DEFAULT_GRID_CONFIG,
    DEFAULT_RULER_CONFIG,
    DEFAULT_VIEWPORT_CONFIG,
} from './lib/canvasEngine';

// Format Types
export type {
    VisualFormat,
    TitleFormat,
    AxisFormat,
    LegendFormat,
    DataLabelFormat,
    TooltipFormat,
    ConditionalFormatRule,
    BackgroundFormat,
    BorderFormat,
    ShadowFormat,
    PaddingFormat,
} from './lib/formatPane';

// Format Functions
export {
    DEFAULT_VISUAL_FORMAT,
    formatToStyles,
    hexToRgba,
} from './lib/formatPane';

// Responsive Layout Types and Functions
export type {
    ResponsiveWidgetLayout,
    LayoutBreakpoint,
    DeviceType,
} from './lib/responsiveLayout';

export {
    LAYOUT_BREAKPOINTS,
    getCurrentDevice,
    getBreakpoint,
} from './lib/responsiveLayout';

// Tooltip Types and Functions
export type {
    TooltipPageConfig,
    TooltipData,
    TooltipField,
    TooltipSettings,
} from './lib/tooltipManager';

export {
    TooltipManager,
    formatTooltipValue,
} from './lib/tooltipManager';

// Visualization Types and Functions
export type {
    ChartTypeDefinition,
    ChartCategory,
    ChartFormatOptions,
    FieldWellConfig,
    FieldWellType,
} from './lib/visualizationLibrary';

export {
    CHART_TYPES,
    getChartType,
    getChartTypesByCategory,
    getChartCategories,
    CHART_CATEGORY_LABELS,
} from './lib/visualizationLibrary';

// Undo/Redo Types and Functions
export type {
    HistoryEntry,
    ActionType,
} from './lib/undoRedoSystem';

export {
    useEnhancedUndoRedo,
    HistoryPanel,
} from './lib/undoRedoSystem';

// Component Exports
export { EnhancedDashboardBuilder } from './components/developer/EnhancedDashboardBuilder';
export { EnhancedChartRenderer } from './components/developer/EnhancedChartRenderer';
export { FormatPane } from './components/developer/FormatPane';
export { FieldWells } from './components/developer/FieldWells';
export type { DataField, WellType, AggregationType } from './components/developer/FieldWells';
export { getFieldWellsForChartType } from './components/developer/FieldWells';
export { VisualizationPicker, VisualizationPickerCompact } from './components/developer/VisualizationPicker';
export { FilterPanel } from './components/developer/FilterPanel';
export type { FilterConfig, FilterOperator, FilterCondition } from './components/developer/FilterPanel';
export { Slicer } from './components/developer/Slicer';
export type { SlicerType } from './components/developer/Slicer';
export { DrillNavigation, DrillBreadcrumb, useDrillManager, HierarchySelector } from './components/developer/DrillNavigation';
export type { DrillContext, DrillAction, HierarchyLevel, DrillMode } from './components/developer/DrillNavigation';
export { PageNavigator, CompactPageNavigator } from './components/developer/PageNavigator';
export { BookmarksPanel } from './components/developer/BookmarksPanel';
export { MobileLayoutEditor } from './components/developer/MobileLayoutEditor';
export { ConditionalFormattingDialog } from './components/developer/ConditionalFormattingDialog';
export { ExportDialog, QuickExportButton, captureCanvasAsImage, downloadFile, exportToPng, exportToPdf } from './components/developer/ExportManager';
export type { ExportOptions, ExportFormat } from './components/developer/ExportManager';
export { EnhancedTooltip, CardTooltip, ChartTooltipContent, InfoTooltip } from './components/developer/EnhancedTooltip';
export { AnalyticsLinesRenderer, TrendLineOverlay, ConfidenceBand, AnalyticsConfig, calculateStatistics, linearRegression, exponentialSmoothing, generateConfidenceBand } from './components/developer/AnalyticsLines';
