/**
 * Canvas Engine - Grid-based canvas system for dashboard builder
 * Implements snap-to-grid, layer management, guides, and viewport controls
 */

import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Widget } from './widgetSystem';

// Grid Configuration
export interface GridConfig {
    enabled: boolean;
    size: number;
    showLines: boolean;
    lineColor: string;
    snapEnabled: boolean;
    snapThreshold: number;
}

// Ruler Configuration
export interface RulerConfig {
    enabled: boolean;
    units: 'px' | 'pt' | 'in' | 'cm';
    color: string;
    background: string;
    markInterval: number;
    labelInterval: number;
}

// Guide Configuration
export interface Guide {
    id: string;
    type: 'horizontal' | 'vertical';
    position: number;
    locked: boolean;
    color?: string;
}

// Viewport Configuration
export interface ViewportConfig {
    zoom: number;
    minZoom: number;
    maxZoom: number;
    panX: number;
    panY: number;
    fitToScreen: boolean;
}

// Canvas Bounds
export interface CanvasBounds {
    width: number;
    height: number;
    padding: number;
}

// Selection Box
export interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    active: boolean;
}

// Snap Result
export interface SnapResult {
    x: number;
    y: number;
    snappedX: boolean;
    snappedY: boolean;
    snapLineX?: number;
    snapLineY?: number;
}

// Default configurations
export const DEFAULT_GRID_CONFIG: GridConfig = {
    enabled: true,
    size: 10,
    showLines: true,
    lineColor: 'rgba(200, 200, 200, 0.3)',
    snapEnabled: true,
    snapThreshold: 5,
};

export const DEFAULT_RULER_CONFIG: RulerConfig = {
    enabled: true,
    units: 'px',
    color: '#666',
    background: '#f5f5f5',
    markInterval: 10,
    labelInterval: 100,
};

export const DEFAULT_VIEWPORT_CONFIG: ViewportConfig = {
    zoom: 100,
    minZoom: 10,
    maxZoom: 400,
    panX: 0,
    panY: 0,
    fitToScreen: false,
};

// Snap to grid utility
export const snapToGrid = (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
};

// Snap position with threshold
export const snapPosition = (
    x: number,
    y: number,
    gridConfig: GridConfig,
    guides: Guide[] = [],
    otherWidgets: Widget[] = []
): SnapResult => {
    let snappedX = x;
    let snappedY = y;
    let snapLineX: number | undefined;
    let snapLineY: number | undefined;
    let didSnapX = false;
    let didSnapY = false;

    const threshold = gridConfig.snapThreshold;

    // Snap to grid
    if (gridConfig.snapEnabled) {
        const gridX = snapToGrid(x, gridConfig.size);
        const gridY = snapToGrid(y, gridConfig.size);

        if (Math.abs(x - gridX) <= threshold) {
            snappedX = gridX;
            didSnapX = true;
        }
        if (Math.abs(y - gridY) <= threshold) {
            snappedY = gridY;
            didSnapY = true;
        }
    }

    // Snap to guides
    guides.forEach(guide => {
        if (guide.type === 'vertical' && Math.abs(x - guide.position) <= threshold) {
            snappedX = guide.position;
            snapLineX = guide.position;
            didSnapX = true;
        }
        if (guide.type === 'horizontal' && Math.abs(y - guide.position) <= threshold) {
            snappedY = guide.position;
            snapLineY = guide.position;
            didSnapY = true;
        }
    });

    // Snap to other widget edges
    otherWidgets.forEach(widget => {
        const { x: wx, y: wy, width: ww, height: wh } = widget.position;

        // Left edge
        if (Math.abs(x - wx) <= threshold) {
            snappedX = wx;
            snapLineX = wx;
            didSnapX = true;
        }
        // Right edge
        if (Math.abs(x - (wx + ww)) <= threshold) {
            snappedX = wx + ww;
            snapLineX = wx + ww;
            didSnapX = true;
        }
        // Top edge
        if (Math.abs(y - wy) <= threshold) {
            snappedY = wy;
            snapLineY = wy;
            didSnapY = true;
        }
        // Bottom edge
        if (Math.abs(y - (wy + wh)) <= threshold) {
            snappedY = wy + wh;
            snapLineY = wy + wh;
            didSnapY = true;
        }
        // Center X
        if (Math.abs(x - (wx + ww / 2)) <= threshold) {
            snappedX = wx + ww / 2;
            snapLineX = wx + ww / 2;
            didSnapX = true;
        }
        // Center Y
        if (Math.abs(y - (wy + wh / 2)) <= threshold) {
            snappedY = wy + wh / 2;
            snapLineY = wy + wh / 2;
            didSnapY = true;
        }
    });

    return {
        x: snappedX,
        y: snappedY,
        snappedX: didSnapX,
        snappedY: didSnapY,
        snapLineX,
        snapLineY,
    };
};

// Convert screen coordinates to canvas coordinates
export const screenToCanvas = (
    screenX: number,
    screenY: number,
    viewport: ViewportConfig,
    canvasOffset: { x: number; y: number }
): { x: number; y: number } => {
    const scale = viewport.zoom / 100;
    return {
        x: (screenX - canvasOffset.x - viewport.panX) / scale,
        y: (screenY - canvasOffset.y - viewport.panY) / scale,
    };
};

// Convert canvas coordinates to screen coordinates
export const canvasToScreen = (
    canvasX: number,
    canvasY: number,
    viewport: ViewportConfig,
    canvasOffset: { x: number; y: number }
): { x: number; y: number } => {
    const scale = viewport.zoom / 100;
    return {
        x: canvasX * scale + canvasOffset.x + viewport.panX,
        y: canvasY * scale + canvasOffset.y + viewport.panY,
    };
};

// Calculate zoom to fit canvas in container
export const calculateFitZoom = (
    canvasWidth: number,
    canvasHeight: number,
    containerWidth: number,
    containerHeight: number,
    padding: number = 40
): number => {
    const scaleX = (containerWidth - padding * 2) / canvasWidth;
    const scaleY = (containerHeight - padding * 2) / canvasHeight;
    return Math.min(scaleX, scaleY) * 100;
};

// Calculate pan to center canvas
export const calculateCenterPan = (
    canvasWidth: number,
    canvasHeight: number,
    containerWidth: number,
    containerHeight: number,
    zoom: number
): { panX: number; panY: number } => {
    const scale = zoom / 100;
    const scaledWidth = canvasWidth * scale;
    const scaledHeight = canvasHeight * scale;

    return {
        panX: (containerWidth - scaledWidth) / 2,
        panY: (containerHeight - scaledHeight) / 2,
    };
};

// Check if widget is in selection box
export const isWidgetInSelection = (
    widget: Widget,
    selection: SelectionBox
): boolean => {
    const selLeft = Math.min(selection.startX, selection.endX);
    const selRight = Math.max(selection.startX, selection.endX);
    const selTop = Math.min(selection.startY, selection.endY);
    const selBottom = Math.max(selection.startY, selection.endY);

    const { x, y, width, height } = widget.position;

    // Check if widget is fully contained in selection
    return (
        x >= selLeft &&
        x + width <= selRight &&
        y >= selTop &&
        y + height <= selBottom
    );
};

// Check if widget intersects with selection box
export const widgetIntersectsSelection = (
    widget: Widget,
    selection: SelectionBox
): boolean => {
    const selLeft = Math.min(selection.startX, selection.endX);
    const selRight = Math.max(selection.startX, selection.endX);
    const selTop = Math.min(selection.startY, selection.endY);
    const selBottom = Math.max(selection.startY, selection.endY);

    const { x, y, width, height } = widget.position;

    // Check if rectangles intersect
    return !(
        x + width < selLeft ||
        x > selRight ||
        y + height < selTop ||
        y > selBottom
    );
};

// Layer management utilities
export const bringToFront = (widgets: Widget[], widgetId: string): Widget[] => {
    const maxZ = Math.max(...widgets.map(w => w.position.zIndex));
    return widgets.map(w =>
        w.id === widgetId
            ? { ...w, position: { ...w.position, zIndex: maxZ + 1 } }
            : w
    );
};

export const sendToBack = (widgets: Widget[], widgetId: string): Widget[] => {
    const minZ = Math.min(...widgets.map(w => w.position.zIndex));
    return widgets.map(w =>
        w.id === widgetId
            ? { ...w, position: { ...w.position, zIndex: minZ - 1 } }
            : w
    );
};

export const bringForward = (widgets: Widget[], widgetId: string): Widget[] => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return widgets;

    const currentZ = widget.position.zIndex;
    const widgetsAbove = widgets.filter(w => w.position.zIndex > currentZ);

    if (widgetsAbove.length === 0) return widgets;

    const nextZ = Math.min(...widgetsAbove.map(w => w.position.zIndex));

    return widgets.map(w => {
        if (w.id === widgetId) {
            return { ...w, position: { ...w.position, zIndex: nextZ + 1 } };
        }
        if (w.position.zIndex === nextZ) {
            return { ...w, position: { ...w.position, zIndex: currentZ } };
        }
        return w;
    });
};

export const sendBackward = (widgets: Widget[], widgetId: string): Widget[] => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return widgets;

    const currentZ = widget.position.zIndex;
    const widgetsBelow = widgets.filter(w => w.position.zIndex < currentZ);

    if (widgetsBelow.length === 0) return widgets;

    const prevZ = Math.max(...widgetsBelow.map(w => w.position.zIndex));

    return widgets.map(w => {
        if (w.id === widgetId) {
            return { ...w, position: { ...w.position, zIndex: prevZ - 1 } };
        }
        if (w.position.zIndex === prevZ) {
            return { ...w, position: { ...w.position, zIndex: currentZ } };
        }
        return w;
    });
};

// Alignment utilities
export type AlignmentType =
    | 'left' | 'center' | 'right'
    | 'top' | 'middle' | 'bottom'
    | 'distributeH' | 'distributeV';

export const alignWidgets = (
    widgets: Widget[],
    selectedIds: string[],
    alignType: AlignmentType
): Widget[] => {
    const selected = widgets.filter(w => selectedIds.includes(w.id));
    if (selected.length < 2 && !['distributeH', 'distributeV'].includes(alignType)) {
        return widgets;
    }

    let newPositions: Record<string, Partial<Widget['position']>> = {};

    switch (alignType) {
        case 'left': {
            const minX = Math.min(...selected.map(w => w.position.x));
            selected.forEach(w => {
                newPositions[w.id] = { x: minX };
            });
            break;
        }
        case 'center': {
            const avgCenterX = selected.reduce((sum, w) =>
                sum + w.position.x + w.position.width / 2, 0
            ) / selected.length;
            selected.forEach(w => {
                newPositions[w.id] = { x: avgCenterX - w.position.width / 2 };
            });
            break;
        }
        case 'right': {
            const maxRight = Math.max(...selected.map(w => w.position.x + w.position.width));
            selected.forEach(w => {
                newPositions[w.id] = { x: maxRight - w.position.width };
            });
            break;
        }
        case 'top': {
            const minY = Math.min(...selected.map(w => w.position.y));
            selected.forEach(w => {
                newPositions[w.id] = { y: minY };
            });
            break;
        }
        case 'middle': {
            const avgCenterY = selected.reduce((sum, w) =>
                sum + w.position.y + w.position.height / 2, 0
            ) / selected.length;
            selected.forEach(w => {
                newPositions[w.id] = { y: avgCenterY - w.position.height / 2 };
            });
            break;
        }
        case 'bottom': {
            const maxBottom = Math.max(...selected.map(w => w.position.y + w.position.height));
            selected.forEach(w => {
                newPositions[w.id] = { y: maxBottom - w.position.height };
            });
            break;
        }
        case 'distributeH': {
            if (selected.length < 3) return widgets;
            const sorted = [...selected].sort((a, b) => a.position.x - b.position.x);
            const minX = sorted[0].position.x;
            const maxX = sorted[sorted.length - 1].position.x;
            const totalWidth = sorted.reduce((sum, w) => sum + w.position.width, 0);
            const gap = (maxX - minX + sorted[sorted.length - 1].position.width - totalWidth) / (sorted.length - 1);

            let currentX = minX;
            sorted.forEach((w, i) => {
                if (i === 0) return;
                currentX += sorted[i - 1].position.width + gap;
                newPositions[w.id] = { x: currentX };
            });
            break;
        }
        case 'distributeV': {
            if (selected.length < 3) return widgets;
            const sorted = [...selected].sort((a, b) => a.position.y - b.position.y);
            const minY = sorted[0].position.y;
            const maxY = sorted[sorted.length - 1].position.y;
            const totalHeight = sorted.reduce((sum, w) => sum + w.position.height, 0);
            const gap = (maxY - minY + sorted[sorted.length - 1].position.height - totalHeight) / (sorted.length - 1);

            let currentY = minY;
            sorted.forEach((w, i) => {
                if (i === 0) return;
                currentY += sorted[i - 1].position.height + gap;
                newPositions[w.id] = { y: currentY };
            });
            break;
        }
    }

    return widgets.map(w => {
        if (newPositions[w.id]) {
            return {
                ...w,
                position: { ...w.position, ...newPositions[w.id] },
            };
        }
        return w;
    });
};

// Size matching utilities
export const matchSize = (
    widgets: Widget[],
    selectedIds: string[],
    dimension: 'width' | 'height' | 'both'
): Widget[] => {
    const selected = widgets.filter(w => selectedIds.includes(w.id));
    if (selected.length < 2) return widgets;

    // Use first selected as reference
    const reference = selected[0];

    return widgets.map(w => {
        if (!selectedIds.includes(w.id) || w.id === reference.id) return w;

        const updates: Partial<Widget['position']> = {};
        if (dimension === 'width' || dimension === 'both') {
            updates.width = reference.position.width;
        }
        if (dimension === 'height' || dimension === 'both') {
            updates.height = reference.position.height;
        }

        return {
            ...w,
            position: { ...w.position, ...updates },
        };
    });
};

// Custom hook for canvas interactions
export const useCanvasInteraction = (
    containerRef: React.RefObject<HTMLDivElement>,
    viewport: ViewportConfig,
    onViewportChange: (viewport: ViewportConfig) => void
) => {
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handleWheel = useCallback((e: WheelEvent) => {
        if (!containerRef.current) return;

        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
            // Zoom
            const delta = e.deltaY > 0 ? -10 : 10;
            const newZoom = Math.max(
                viewport.minZoom,
                Math.min(viewport.maxZoom, viewport.zoom + delta)
            );

            // Zoom towards mouse position
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const scale = newZoom / viewport.zoom;
            const newPanX = mouseX - (mouseX - viewport.panX) * scale;
            const newPanY = mouseY - (mouseY - viewport.panY) * scale;

            onViewportChange({
                ...viewport,
                zoom: newZoom,
                panX: newPanX,
                panY: newPanY,
            });
        } else {
            // Pan
            onViewportChange({
                ...viewport,
                panX: viewport.panX - e.deltaX,
                panY: viewport.panY - e.deltaY,
            });
        }
    }, [viewport, onViewportChange, containerRef]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isPanning) return;

        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;

        onViewportChange({
            ...viewport,
            panX: viewport.panX + deltaX,
            panY: viewport.panY + deltaY,
        });

        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }, [isPanning, viewport, onViewportChange]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, containerRef]);

    return { isPanning };
};

// Custom hook for selection box
export const useSelectionBox = (
    containerRef: React.RefObject<HTMLDivElement>,
    viewport: ViewportConfig,
    onSelectionComplete: (selection: SelectionBox) => void
) => {
    const [selection, setSelection] = useState<SelectionBox>({
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        active: false,
    });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0 || e.altKey) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const pos = screenToCanvas(
            e.clientX - rect.left,
            e.clientY - rect.top,
            viewport,
            { x: 0, y: 0 }
        );

        setSelection({
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y,
            active: true,
        });
    }, [viewport, containerRef]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!selection.active) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const pos = screenToCanvas(
            e.clientX - rect.left,
            e.clientY - rect.top,
            viewport,
            { x: 0, y: 0 }
        );

        setSelection(prev => ({
            ...prev,
            endX: pos.x,
            endY: pos.y,
        }));
    }, [selection.active, viewport, containerRef]);

    const handleMouseUp = useCallback(() => {
        if (selection.active) {
            onSelectionComplete(selection);
            setSelection(prev => ({ ...prev, active: false }));
        }
    }, [selection, onSelectionComplete]);

    return {
        selection,
        handlers: {
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
        },
    };
};

export default {
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
};
