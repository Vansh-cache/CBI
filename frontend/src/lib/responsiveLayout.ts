/**
 * Responsive Layout Engine for Power BI-style dashboard layouts
 * Handles desktop, tablet, and mobile responsive layouts
 */

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface LayoutBreakpoint {
    name: DeviceType;
    minWidth: number;
    maxWidth: number;
    columns: number;
    aspectRatio: string;
    canvasWidth: number;
    canvasHeight: number;
}

export const LAYOUT_BREAKPOINTS: LayoutBreakpoint[] = [
    {
        name: 'desktop',
        minWidth: 1024,
        maxWidth: Infinity,
        columns: 12,
        aspectRatio: '16:9',
        canvasWidth: 1280,
        canvasHeight: 720,
    },
    {
        name: 'tablet',
        minWidth: 768,
        maxWidth: 1023,
        columns: 8,
        aspectRatio: '4:3',
        canvasWidth: 1024,
        canvasHeight: 768,
    },
    {
        name: 'mobile',
        minWidth: 0,
        maxWidth: 767,
        columns: 4,
        aspectRatio: '9:16',
        canvasWidth: 375,
        canvasHeight: 667,
    },
];

export interface ResponsivePosition {
    x: number;
    y: number;
}

export interface ResponsiveSize {
    width: number;
    height: number;
}

export interface ResponsiveWidgetLayout {
    desktop: {
        position: ResponsivePosition;
        size: ResponsiveSize;
        visible: boolean;
        order: number;
    };
    tablet: {
        position: ResponsivePosition;
        size: ResponsiveSize;
        visible: boolean;
        order: number;
    };
    mobile: {
        position: ResponsivePosition;
        size: ResponsiveSize;
        visible: boolean;
        order: number;
    };
}

export interface LayoutGrid {
    columns: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    gap: number;
}

/**
 * Get current device type based on viewport width
 */
export function getCurrentDevice(viewportWidth: number): DeviceType {
    for (const breakpoint of LAYOUT_BREAKPOINTS) {
        if (viewportWidth >= breakpoint.minWidth && viewportWidth <= breakpoint.maxWidth) {
            return breakpoint.name;
        }
    }
    return 'desktop';
}

/**
 * Get breakpoint configuration for a device
 */
export function getBreakpoint(device: DeviceType): LayoutBreakpoint {
    return LAYOUT_BREAKPOINTS.find(b => b.name === device) || LAYOUT_BREAKPOINTS[0];
}

/**
 * Calculate layout grid for a canvas
 */
export function calculateLayoutGrid(
    canvasWidth: number,
    canvasHeight: number,
    columns: number = 12,
    gap: number = 10
): LayoutGrid {
    const cellWidth = (canvasWidth - (columns - 1) * gap) / columns;
    const rows = Math.ceil(canvasHeight / cellWidth);
    const cellHeight = (canvasHeight - (rows - 1) * gap) / rows;

    return {
        columns,
        rows,
        cellWidth,
        cellHeight,
        gap,
    };
}

/**
 * Snap position to grid
 */
export function snapToLayoutGrid(
    x: number,
    y: number,
    grid: LayoutGrid
): ResponsivePosition {
    const cellWithGap = grid.cellWidth + grid.gap;
    const snappedX = Math.round(x / cellWithGap) * cellWithGap;
    const snappedY = Math.round(y / (grid.cellHeight + grid.gap)) * (grid.cellHeight + grid.gap);

    return { x: snappedX, y: snappedY };
}

/**
 * Convert position between devices
 */
export function convertPositionBetweenDevices(
    position: ResponsivePosition,
    size: ResponsiveSize,
    fromDevice: DeviceType,
    toDevice: DeviceType
): { position: ResponsivePosition; size: ResponsiveSize } {
    const fromBreakpoint = getBreakpoint(fromDevice);
    const toBreakpoint = getBreakpoint(toDevice);

    const scaleX = toBreakpoint.canvasWidth / fromBreakpoint.canvasWidth;
    const scaleY = toBreakpoint.canvasHeight / fromBreakpoint.canvasHeight;

    return {
        position: {
            x: Math.round(position.x * scaleX),
            y: Math.round(position.y * scaleY),
        },
        size: {
            width: Math.round(size.width * scaleX),
            height: Math.round(size.height * scaleY),
        },
    };
}

/**
 * Auto-layout widgets for mobile view (stack vertically)
 */
export function autoLayoutForMobile(
    widgets: Array<{ id: string; size: ResponsiveSize }>,
    canvasWidth: number,
    gap: number = 10,
    headerHeight: number = 48
): Map<string, { position: ResponsivePosition; size: ResponsiveSize }> {
    const layouts = new Map<string, { position: ResponsivePosition; size: ResponsiveSize }>();
    let currentY = headerHeight + gap;

    for (const widget of widgets) {
        const width = canvasWidth - gap * 2;
        const aspectRatio = widget.size.width / widget.size.height;
        const height = Math.min(width / aspectRatio, 300); // Max height 300px for mobile

        layouts.set(widget.id, {
            position: { x: gap, y: currentY },
            size: { width, height },
        });

        currentY += height + gap;
    }

    return layouts;
}

/**
 * Auto-layout widgets for tablet view (2-column grid)
 */
export function autoLayoutForTablet(
    widgets: Array<{ id: string; size: ResponsiveSize }>,
    canvasWidth: number,
    gap: number = 10,
    headerHeight: number = 48
): Map<string, { position: ResponsivePosition; size: ResponsiveSize }> {
    const layouts = new Map<string, { position: ResponsivePosition; size: ResponsiveSize }>();
    const columnWidth = (canvasWidth - gap * 3) / 2;
    let col1Y = headerHeight + gap;
    let col2Y = headerHeight + gap;
    let useCol1 = true;

    for (const widget of widgets) {
        const aspectRatio = widget.size.width / widget.size.height;
        const height = Math.min(columnWidth / aspectRatio, 250);

        if (col1Y <= col2Y) {
            layouts.set(widget.id, {
                position: { x: gap, y: col1Y },
                size: { width: columnWidth, height },
            });
            col1Y += height + gap;
        } else {
            layouts.set(widget.id, {
                position: { x: columnWidth + gap * 2, y: col2Y },
                size: { width: columnWidth, height },
            });
            col2Y += height + gap;
        }

        useCol1 = !useCol1;
    }

    return layouts;
}

/**
 * Check if widget is visible on current device
 */
export function isWidgetVisible(
    layout: ResponsiveWidgetLayout,
    device: DeviceType
): boolean {
    return layout[device].visible;
}

/**
 * Get widget layout for current device
 */
export function getWidgetLayoutForDevice(
    layout: ResponsiveWidgetLayout,
    device: DeviceType
): { position: ResponsivePosition; size: ResponsiveSize; visible: boolean; order: number } {
    return layout[device];
}

/**
 * Create default responsive layout from desktop position
 */
export function createDefaultResponsiveLayout(
    desktopPosition: ResponsivePosition,
    desktopSize: ResponsiveSize
): ResponsiveWidgetLayout {
    const tabletLayout = convertPositionBetweenDevices(
        desktopPosition,
        desktopSize,
        'desktop',
        'tablet'
    );

    const mobileLayout = convertPositionBetweenDevices(
        desktopPosition,
        desktopSize,
        'desktop',
        'mobile'
    );

    return {
        desktop: {
            position: desktopPosition,
            size: desktopSize,
            visible: true,
            order: 0,
        },
        tablet: {
            position: tabletLayout.position,
            size: tabletLayout.size,
            visible: true,
            order: 0,
        },
        mobile: {
            position: mobileLayout.position,
            size: mobileLayout.size,
            visible: true,
            order: 0,
        },
    };
}

/**
 * Calculate optimal canvas size for viewport
 */
export function calculateOptimalCanvasSize(
    viewportWidth: number,
    viewportHeight: number,
    device: DeviceType
): { width: number; height: number; scale: number } {
    const breakpoint = getBreakpoint(device);
    const targetWidth = breakpoint.canvasWidth;
    const targetHeight = breakpoint.canvasHeight;

    const scaleX = viewportWidth / targetWidth;
    const scaleY = viewportHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    return {
        width: targetWidth,
        height: targetHeight,
        scale,
    };
}

/**
 * Layout validation - check for overlapping widgets
 */
export function findOverlappingWidgets(
    widgets: Array<{ id: string; position: ResponsivePosition; size: ResponsiveSize }>
): Array<[string, string]> {
    const overlaps: Array<[string, string]> = [];

    for (let i = 0; i < widgets.length; i++) {
        for (let j = i + 1; j < widgets.length; j++) {
            const a = widgets[i];
            const b = widgets[j];

            const aRight = a.position.x + a.size.width;
            const aBottom = a.position.y + a.size.height;
            const bRight = b.position.x + b.size.width;
            const bBottom = b.position.y + b.size.height;

            if (
                a.position.x < bRight &&
                aRight > b.position.x &&
                a.position.y < bBottom &&
                aBottom > b.position.y
            ) {
                overlaps.push([a.id, b.id]);
            }
        }
    }

    return overlaps;
}

/**
 * Auto-resolve overlapping widgets
 */
export function resolveOverlaps(
    widgets: Array<{ id: string; position: ResponsivePosition; size: ResponsiveSize }>,
    canvasWidth: number,
    canvasHeight: number,
    gap: number = 10
): Map<string, ResponsivePosition> {
    const resolved = new Map<string, ResponsivePosition>();
    const sortedWidgets = [...widgets].sort((a, b) => {
        if (a.position.y !== b.position.y) return a.position.y - b.position.y;
        return a.position.x - b.position.x;
    });

    const occupied: Array<{ x: number; y: number; width: number; height: number }> = [];

    for (const widget of sortedWidgets) {
        let newPosition = { ...widget.position };
        let hasOverlap = true;
        let attempts = 0;

        while (hasOverlap && attempts < 100) {
            hasOverlap = false;

            for (const rect of occupied) {
                const wRight = newPosition.x + widget.size.width;
                const wBottom = newPosition.y + widget.size.height;
                const rRight = rect.x + rect.width;
                const rBottom = rect.y + rect.height;

                if (
                    newPosition.x < rRight + gap &&
                    wRight + gap > rect.x &&
                    newPosition.y < rBottom + gap &&
                    wBottom + gap > rect.y
                ) {
                    hasOverlap = true;
                    // Move widget to the right or below
                    if (rRight + gap + widget.size.width <= canvasWidth) {
                        newPosition.x = rRight + gap;
                    } else {
                        newPosition.x = gap;
                        newPosition.y = rBottom + gap;
                    }
                    break;
                }
            }

            attempts++;
        }

        // Clamp to canvas bounds
        newPosition.x = Math.max(0, Math.min(newPosition.x, canvasWidth - widget.size.width));
        newPosition.y = Math.max(0, Math.min(newPosition.y, canvasHeight - widget.size.height));

        resolved.set(widget.id, newPosition);
        occupied.push({
            x: newPosition.x,
            y: newPosition.y,
            width: widget.size.width,
            height: widget.size.height,
        });
    }

    return resolved;
}

/**
 * Export layout configuration
 */
export interface LayoutExport {
    version: string;
    device: DeviceType;
    canvas: {
        width: number;
        height: number;
    };
    widgets: Array<{
        id: string;
        position: ResponsivePosition;
        size: ResponsiveSize;
        visible: boolean;
        order: number;
    }>;
}

export function exportLayout(
    widgets: Array<{
        id: string;
        layout: ResponsiveWidgetLayout;
    }>,
    device: DeviceType
): LayoutExport {
    const breakpoint = getBreakpoint(device);

    return {
        version: '1.0',
        device,
        canvas: {
            width: breakpoint.canvasWidth,
            height: breakpoint.canvasHeight,
        },
        widgets: widgets.map(w => ({
            id: w.id,
            ...w.layout[device],
        })),
    };
}

/**
 * Import layout configuration
 */
export function importLayout(
    layoutExport: LayoutExport,
    existingWidgets: Map<string, ResponsiveWidgetLayout>
): Map<string, ResponsiveWidgetLayout> {
    const updated = new Map(existingWidgets);

    for (const widgetLayout of layoutExport.widgets) {
        const existing = updated.get(widgetLayout.id);
        if (existing) {
            updated.set(widgetLayout.id, {
                ...existing,
                [layoutExport.device]: {
                    position: widgetLayout.position,
                    size: widgetLayout.size,
                    visible: widgetLayout.visible,
                    order: widgetLayout.order,
                },
            });
        }
    }

    return updated;
}
