/**
 * Dashboard Page System - Manages dashboard pages, bookmarks, and page-level settings
 * Power BI-style multi-page dashboard support
 */

import { Widget } from './widgetSystem';
import { FilterConfig } from '../components/developer/FilterPanel';

// Page Background Types
export interface PageBackground {
    type: 'color' | 'image' | 'transparent';
    color?: string;
    imageUrl?: string;
    imageSize?: 'fit' | 'fill' | 'tile' | 'center';
    imageTransparency?: number;
}

// Page Dimensions
export interface PageDimensions {
    type: 'standard' | 'widescreen' | 'letter' | 'tooltip' | 'custom';
    width: number;
    height: number;
}

export const PAGE_DIMENSION_PRESETS: Record<string, PageDimensions> = {
    standard: { type: 'standard', width: 1280, height: 720 },
    widescreen: { type: 'widescreen', width: 1920, height: 1080 },
    letter: { type: 'letter', width: 816, height: 1056 }, // 8.5" x 11" at 96dpi
    tooltip: { type: 'tooltip', width: 320, height: 240 },
};

// Page Type
export type PageType = 'report' | 'tooltip' | 'drillthrough' | 'hidden';

// Page Wallpaper
export interface PageWallpaper {
    enabled: boolean;
    imageUrl?: string;
    transparency?: number;
}

// Page Canvas Settings
export interface PageCanvasSettings {
    showGridlines: boolean;
    snapToGrid: boolean;
    gridSize: number;
    showRulers: boolean;
    showGuides: boolean;
    guides: Array<{
        type: 'horizontal' | 'vertical';
        position: number;
    }>;
    zoom: number;
    panX: number;
    panY: number;
}

// Page Filter Settings
export interface PageFilterSettings {
    filters: FilterConfig[];
    requireSingleSelection?: boolean;
    hiddenFiltersFromOtherPages?: boolean;
}

// Dashboard Page Definition
export interface DashboardPage {
    id: string;
    name: string;
    type: PageType;
    order: number;

    // Visual Settings
    background: PageBackground;
    wallpaper: PageWallpaper;
    dimensions: PageDimensions;

    // Canvas Settings
    canvas: PageCanvasSettings;

    // Widgets
    widgets: Widget[];

    // Filters
    filterSettings: PageFilterSettings;

    // Drillthrough Settings
    drillthroughSettings?: {
        enabled: boolean;
        filters: FilterConfig[];
        keepAllFilters: boolean;
        backButtonEnabled: boolean;
    };

    // Tooltip Page Settings (for tooltip pages)
    tooltipSettings?: {
        autoShow: boolean;
        fields: string[];
        maxWidth?: number;
        maxHeight?: number;
    };

    // Navigation
    navigationEnabled: boolean;

    // Metadata
    createdAt: number;
    updatedAt: number;
    createdBy?: string;
}

// Bookmark Definition
export interface DashboardBookmark {
    id: string;
    name: string;
    description?: string;
    pageId: string;

    // State Capture
    capturedState: {
        filters: FilterConfig[];
        selectedWidgets: string[];
        highlightedData: Record<string, any>;
        slicerValues: Record<string, any[]>;
        zoom: number;
        pan: { x: number; y: number };
    };

    // Display Settings
    displaySettings: {
        displayName?: string;
        autoAdvanceSeconds?: number;
        includeData?: boolean;
        includeDisplayState?: boolean;
        includeFilters?: boolean;
    };

    // Group
    groupId?: string;
    order: number;

    // Metadata
    createdAt: number;
    updatedAt: number;
}

// Bookmark Group
export interface BookmarkGroup {
    id: string;
    name: string;
    order: number;
    bookmarks: string[]; // Bookmark IDs
}

// Dashboard Theme
export interface DashboardTheme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        tertiary: string;
        accent: string;
        background: string;
        foreground: string;
        muted: string;
        border: string;

        // Chart colors
        dataColors: string[];

        // Semantic colors
        positive: string;
        negative: string;
        neutral: string;
        warning: string;
    };

    fonts: {
        heading: string;
        body: string;
        mono: string;
    };

    // Visual defaults
    visualDefaults: {
        borderRadius: number;
        shadowEnabled: boolean;
        shadowBlur: number;
        borderWidth: number;
    };
}

// Default Theme
export const DEFAULT_THEME: DashboardTheme = {
    id: 'default',
    name: 'Default',
    colors: {
        primary: '#0078d4',
        secondary: '#2b88d8',
        tertiary: '#71afe5',
        accent: '#00bcf2',
        background: '#ffffff',
        foreground: '#323130',
        muted: '#605e5c',
        border: '#edebe9',
        dataColors: [
            '#0078d4', '#00bcf2', '#00b294', '#8764b8', '#e81123',
            '#ff8c00', '#ffd700', '#bad80a', '#107c10', '#00cccc',
            '#6b69d6', '#e3008c', '#8e8cd8', '#00b7c3', '#57a300',
        ],
        positive: '#107c10',
        negative: '#e81123',
        neutral: '#797775',
        warning: '#ff8c00',
    },
    fonts: {
        heading: 'Segoe UI Semibold',
        body: 'Segoe UI',
        mono: 'Consolas',
    },
    visualDefaults: {
        borderRadius: 4,
        shadowEnabled: true,
        shadowBlur: 4,
        borderWidth: 1,
    },
};

// Complete Dashboard Definition
export interface Dashboard {
    id: string;
    name: string;
    description?: string;

    // Pages
    pages: DashboardPage[];
    activePageId: string;

    // Bookmarks
    bookmarks: DashboardBookmark[];
    bookmarkGroups: BookmarkGroup[];

    // Theme
    theme: DashboardTheme;

    // Global Settings
    settings: {
        autoRefreshEnabled: boolean;
        autoRefreshInterval: number; // seconds
        crossFilteringEnabled: boolean;
        crossHighlightingEnabled: boolean;
        defaultInteractionMode: 'filter' | 'highlight';

        // Q&A Settings
        qnaEnabled: boolean;
        synonyms: Record<string, string[]>;
    };

    // Report-level filters
    reportFilters: FilterConfig[];

    // Data Connections
    dataConnections: Array<{
        id: string;
        name: string;
        type: 'dataset' | 'directQuery' | 'liveConnection';
        connectionString?: string;
        datasetId?: string;
        refreshSchedule?: {
            enabled: boolean;
            frequency: 'hourly' | 'daily' | 'weekly';
            time?: string;
        };
    }>;

    // Mobile Layout
    mobileLayout?: {
        enabled: boolean;
        pages: Array<{
            pageId: string;
            widgets: Array<{
                widgetId: string;
                visible: boolean;
                order: number;
            }>;
        }>;
    };

    // Metadata
    createdAt: number;
    updatedAt: number;
    publishedAt?: number;
    version: string;
    createdBy?: string;
    modifiedBy?: string;
}

// Create default page
export const createPage = (
    name: string,
    type: PageType = 'report',
    order: number = 0
): DashboardPage => {
    const now = Date.now();
    const id = `page-${now}-${Math.random().toString(36).substr(2, 9)}`;

    return {
        id,
        name,
        type,
        order,
        background: {
            type: 'color',
            color: '#f3f2f1',
        },
        wallpaper: {
            enabled: false,
        },
        dimensions: PAGE_DIMENSION_PRESETS.widescreen,
        canvas: {
            showGridlines: true,
            snapToGrid: true,
            gridSize: 10,
            showRulers: true,
            showGuides: false,
            guides: [],
            zoom: 100,
            panX: 0,
            panY: 0,
        },
        widgets: [],
        filterSettings: {
            filters: [],
        },
        navigationEnabled: true,
        createdAt: now,
        updatedAt: now,
    };
};

// Create drillthrough page
export const createDrillthroughPage = (
    name: string,
    filters: FilterConfig[],
    order: number = 0
): DashboardPage => {
    const page = createPage(name, 'drillthrough', order);
    page.drillthroughSettings = {
        enabled: true,
        filters,
        keepAllFilters: true,
        backButtonEnabled: true,
    };
    return page;
};

// Create tooltip page
export const createTooltipPage = (
    name: string,
    fields: string[],
    order: number = 0
): DashboardPage => {
    const page = createPage(name, 'tooltip', order);
    page.dimensions = PAGE_DIMENSION_PRESETS.tooltip;
    page.tooltipSettings = {
        autoShow: true,
        fields,
    };
    return page;
};

// Create bookmark
export const createBookmark = (
    name: string,
    pageId: string,
    capturedState: DashboardBookmark['capturedState'],
    order: number = 0
): DashboardBookmark => {
    const now = Date.now();
    return {
        id: `bookmark-${now}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        pageId,
        capturedState,
        displaySettings: {
            includeData: true,
            includeDisplayState: true,
            includeFilters: true,
        },
        order,
        createdAt: now,
        updatedAt: now,
    };
};

// Create dashboard
export const createDashboard = (name: string): Dashboard => {
    const now = Date.now();
    const firstPage = createPage('Page 1');

    return {
        id: `dashboard-${now}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        pages: [firstPage],
        activePageId: firstPage.id,
        bookmarks: [],
        bookmarkGroups: [],
        theme: DEFAULT_THEME,
        settings: {
            autoRefreshEnabled: false,
            autoRefreshInterval: 30,
            crossFilteringEnabled: true,
            crossHighlightingEnabled: true,
            defaultInteractionMode: 'filter',
            qnaEnabled: false,
            synonyms: {},
        },
        reportFilters: [],
        dataConnections: [],
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
    };
};

// Clone page
export const clonePage = (page: DashboardPage, newName?: string): DashboardPage => {
    const now = Date.now();
    const id = `page-${now}-${Math.random().toString(36).substr(2, 9)}`;

    return {
        ...JSON.parse(JSON.stringify(page)), // Deep clone
        id,
        name: newName || `${page.name} (Copy)`,
        widgets: page.widgets.map(w => ({
            ...w,
            id: `widget-${now}-${Math.random().toString(36).substr(2, 9)}`,
        })),
        createdAt: now,
        updatedAt: now,
    };
};

// Page utilities
export const getPageById = (dashboard: Dashboard, pageId: string): DashboardPage | undefined => {
    return dashboard.pages.find(p => p.id === pageId);
};

export const getActivePage = (dashboard: Dashboard): DashboardPage | undefined => {
    return getPageById(dashboard, dashboard.activePageId);
};

export const addWidgetToPage = (page: DashboardPage, widget: Widget): DashboardPage => {
    return {
        ...page,
        widgets: [...page.widgets, widget],
        updatedAt: Date.now(),
    };
};

export const removeWidgetFromPage = (page: DashboardPage, widgetId: string): DashboardPage => {
    return {
        ...page,
        widgets: page.widgets.filter(w => w.id !== widgetId),
        updatedAt: Date.now(),
    };
};

export const updateWidgetInPage = (page: DashboardPage, widgetId: string, updates: Partial<Widget>): DashboardPage => {
    return {
        ...page,
        widgets: page.widgets.map(w =>
            w.id === widgetId ? { ...w, ...updates, updatedAt: Date.now() } : w
        ),
        updatedAt: Date.now(),
    };
};

// Dashboard utilities
export const addPage = (dashboard: Dashboard, page: DashboardPage): Dashboard => {
    return {
        ...dashboard,
        pages: [...dashboard.pages, page],
        updatedAt: Date.now(),
    };
};

export const removePage = (dashboard: Dashboard, pageId: string): Dashboard => {
    const newPages = dashboard.pages.filter(p => p.id !== pageId);
    if (newPages.length === 0) {
        const newPage = createPage('Page 1');
        newPages.push(newPage);
    }

    return {
        ...dashboard,
        pages: newPages,
        activePageId: dashboard.activePageId === pageId ? newPages[0].id : dashboard.activePageId,
        updatedAt: Date.now(),
    };
};

export const reorderPages = (dashboard: Dashboard, newOrder: string[]): Dashboard => {
    const pageMap = new Map(dashboard.pages.map(p => [p.id, p]));
    const reorderedPages = newOrder
        .map((id, index) => {
            const page = pageMap.get(id);
            return page ? { ...page, order: index } : null;
        })
        .filter((p): p is DashboardPage => p !== null);

    return {
        ...dashboard,
        pages: reorderedPages,
        updatedAt: Date.now(),
    };
};

// Bookmark utilities
export const applyBookmark = (dashboard: Dashboard, bookmarkId: string): Dashboard => {
    const bookmark = dashboard.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return dashboard;

    const page = getPageById(dashboard, bookmark.pageId);
    if (!page) return dashboard;

    // Apply captured state
    return {
        ...dashboard,
        activePageId: bookmark.pageId,
        reportFilters: bookmark.displaySettings.includeFilters
            ? bookmark.capturedState.filters
            : dashboard.reportFilters,
        // Additional state would be applied through context providers
    };
};

// Export utilities
export const exportDashboardToJSON = (dashboard: Dashboard): string => {
    return JSON.stringify(dashboard, null, 2);
};

export const importDashboardFromJSON = (json: string): Dashboard | null => {
    try {
        const data = JSON.parse(json);
        // Validate required fields
        if (!data.id || !data.name || !data.pages) {
            throw new Error('Invalid dashboard format');
        }
        return data as Dashboard;
    } catch (error) {
        console.error('Failed to import dashboard:', error);
        return null;
    }
};

// Dashboard validation
export interface DashboardValidationResult {
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
    warnings: Array<{ path: string; message: string }>;
}

export const validateDashboard = (dashboard: Dashboard): DashboardValidationResult => {
    const errors: Array<{ path: string; message: string }> = [];
    const warnings: Array<{ path: string; message: string }> = [];

    // Check for pages
    if (!dashboard.pages || dashboard.pages.length === 0) {
        errors.push({ path: 'pages', message: 'Dashboard must have at least one page' });
    }

    // Check active page exists
    if (!getPageById(dashboard, dashboard.activePageId)) {
        errors.push({ path: 'activePageId', message: 'Active page does not exist' });
    }

    // Check each page
    dashboard.pages.forEach((page, index) => {
        if (!page.name) {
            errors.push({ path: `pages[${index}].name`, message: 'Page name is required' });
        }

        // Check widgets
        page.widgets.forEach((widget, widgetIndex) => {
            if (!widget.id) {
                errors.push({ path: `pages[${index}].widgets[${widgetIndex}].id`, message: 'Widget ID is required' });
            }
        });
    });

    // Check bookmarks reference valid pages
    dashboard.bookmarks.forEach((bookmark, index) => {
        if (!getPageById(dashboard, bookmark.pageId)) {
            warnings.push({ path: `bookmarks[${index}].pageId`, message: 'Bookmark references non-existent page' });
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

export default {
    createPage,
    createDrillthroughPage,
    createTooltipPage,
    createBookmark,
    createDashboard,
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
};
