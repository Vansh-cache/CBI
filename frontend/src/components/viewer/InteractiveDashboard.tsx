import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router';
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useCrossFilter } from '../../contexts/CrossFilterContext';
import { useDashboardName } from '../../contexts/DashboardNameContext';
import { getThemeColors } from '../../lib/themeColors';
import { createFilterContext, applyFilterContext, crossFilterEngine } from '../../lib/crossFilterEngine';
import { renderWidget, Widget } from '../shared/WidgetRenderer';

export default function InteractiveDashboard() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { crossFilters, slicerFilters, addSlicerFilter, updateSlicerFilter, removeSlicerFilter, addCrossFilter } = useCrossFilter();
  const { setDashboardName } = useDashboardName();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<number[]>([]);
  const [datasetData, setDatasetData] = useState<Record<number, unknown[]>>({});
  const [loadingData, setLoadingData] = useState<Record<number, boolean>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(100); // percentage
  const [viewportSize, setViewportSize] = useState({ width: 1920, height: 800 });

  const fetchDatasetData = useCallback(async (datasetId: number) => {
    if (loadingData[datasetId] || datasetData[datasetId]) return;

    setLoadingData((prev) => ({ ...prev, [datasetId]: true }));
    try {
      const res = await apiGet<{ data: unknown[]; schema: any }>(`/api/data/datasets/${datasetId}`);
      if (res.success && res.data) {
        const data = (res.data as any).data || [];
        setDatasetData((prev) => ({ ...prev, [datasetId]: data }));
      }
    } catch (e) {
      console.error(`Failed to fetch dataset ${datasetId}:`, e);
    } finally {
      setLoadingData((prev) => ({ ...prev, [datasetId]: false }));
    }
  }, [loadingData, datasetData]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await apiGet<{ id: number; name: string; config: string | object }>(`/api/dashboards/${id}`);
        if (res.success && res.data) {
          setDashboardData(res.data);
          // Set dashboard name in context for the header
          setDashboardName(res.data.name || 'Dashboard');
          const config = typeof res.data.config === 'string' ? JSON.parse(res.data.config) : res.data.config;
          if (config.widgets) {
            setWidgets(config.widgets);
            setSelectedDatasets(config.selectedDatasets || []);
            // Fetch data for all datasets - match builder: widgets + selectedDatasets
            const datasetIds = new Set<number>();
            config.widgets.forEach((w: Widget) => {
              if (w.datasetId) datasetIds.add(w.datasetId);
            });
            (config.selectedDatasets || []).forEach((datasetId: number) => datasetIds.add(datasetId));
            datasetIds.forEach((datasetId) => fetchDatasetData(datasetId));
          }
        }
      } catch (e) {
        console.error('Failed to fetch dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();

    // Clear dashboard name when leaving
    return () => {
      setDashboardName(null);
    };
  }, [id, fetchDatasetData, setDashboardName]);

  // Track viewport size for responsive scaling
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight - 64, // Account for header
      });
    };
    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  // Sync filter widgets to slicerFilters when dashboard loads (Power BI-style global slicers)
  useEffect(() => {
    const filterWidgets = widgets.filter((w) => w.type === 'filter' && w.filterField);
    const validIds = new Set(filterWidgets.map((w) => `slicer-${w.id}`));
    filterWidgets.forEach((w) => {
      const ruleId = `slicer-${w.id}`;
      const values = (w.selectedFilters || []).map(String);
      const existing = slicerFilters.find((f) => f.id === ruleId);
      if (existing) {
        if (JSON.stringify(existing.values || []) !== JSON.stringify(values)) {
          updateSlicerFilter(ruleId, { values });
        }
      } else {
        addSlicerFilter({
          id: ruleId,
          field: w.filterField!,
          level: 'page',
          type: 'basic',
          operator: 'in',
          values,
          isEnabled: true,
        });
      }
    });
    slicerFilters.forEach((f) => {
      if (f.id.startsWith('slicer-') && !validIds.has(f.id)) {
        removeSlicerFilter(f.id);
      }
    });
  }, [widgets, slicerFilters, addSlicerFilter, updateSlicerFilter, removeSlicerFilter]);

  // Memoize widget data with Power BI filter stack (slicers + cross-filters)
  // Matches DashboardBuilder logic for identical data
  const widgetDataCache = useMemo(() => {
    const cache = new Map<string, unknown[]>();
    const filterContext = createFilterContext(crossFilters, slicerFilters, [], []);
    const firstFromSelected = selectedDatasets[0];
    const firstFromWidgets = widgets.find(w => w.datasetId)?.datasetId;
    const fallbackDatasetId = firstFromSelected || firstFromWidgets;
    widgets.forEach((widget) => {
      let raw: unknown[] = [];
      if (widget.datasetId && datasetData[widget.datasetId]) {
        raw = datasetData[widget.datasetId] as any[];
      } else if (fallbackDatasetId && datasetData[fallbackDatasetId]) {
        raw = datasetData[fallbackDatasetId] as any[];
      }
      const filtered = applyFilterContext(raw, filterContext, widget.id);
      cache.set(widget.id, filtered);
    });
    return cache;
  }, [widgets, datasetData, selectedDatasets, crossFilters, slicerFilters]);

  const getWidgetData = useCallback(
    (widget: Widget): unknown[] => {
      return widgetDataCache.get(widget.id) || [];
    },
    [widgetDataCache]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Dashboard not found</p>
      </div>
    );
  }

  // Calculate the actual bounds of the dashboard based on widget positions
  const dashboardBounds = widgets.length > 0 ? {
    maxX: Math.max(...widgets.map((w) => w.position.x + w.size.width)),
    maxY: Math.max(...widgets.map((w) => w.position.y + w.size.height)),
  } : { maxX: 1920, maxY: 1016 };

  // Use actual dashboard content size
  const CANVAS_WIDTH = dashboardBounds.maxX;
  const CANVAS_HEIGHT = dashboardBounds.maxY;

  // Calculate fit-to-screen scale
  const fitScaleX = viewportSize.width / CANVAS_WIDTH;
  const fitScaleY = viewportSize.height / CANVAS_HEIGHT;
  const fitScale = Math.min(fitScaleX, fitScaleY);

  // Apply user zoom level to fit scale
  const scale = (zoomLevel / 100) * fitScale;

  // Calculate scaled dimensions
  const scaledWidth = CANVAS_WIDTH * scale;
  const scaledHeight = CANVAS_HEIGHT * scale;

  // When zoomed out or fit, center the canvas. When zoomed in, allow scrolling
  const needsScroll = scaledWidth > viewportSize.width || scaledHeight > viewportSize.height;

  // Zoom control handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleFitToScreen = () => setZoomLevel(100);

  const mode = isDark ? 'dark' : 'light';

  return (
    <div
      ref={containerRef}
      style={{
        height: 'calc(100vh - 64px)',
        width: '100%',
        overflowX: needsScroll ? 'auto' : 'hidden',
        overflowY: needsScroll ? 'auto' : 'hidden',
        backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
        position: 'relative',
      }}
    >
      {/* Zoom Controls */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 100,
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}
      >
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 50}
          className="transition-smooth hover-scale"
          style={{
            padding: 6,
            borderRadius: 4,
            backgroundColor: isDark ? '#334155' : '#f1f5f9',
            border: 'none',
            cursor: zoomLevel <= 50 ? 'not-allowed' : 'pointer',
            opacity: zoomLevel <= 50 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom Out"
        >
          <ZoomOut size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        </button>
        <span
          style={{
            minWidth: 48,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: isDark ? '#e2e8f0' : '#334155',
          }}
        >
          {zoomLevel}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 200}
          className="transition-smooth hover-scale"
          style={{
            padding: 6,
            borderRadius: 4,
            backgroundColor: isDark ? '#334155' : '#f1f5f9',
            border: 'none',
            cursor: zoomLevel >= 200 ? 'not-allowed' : 'pointer',
            opacity: zoomLevel >= 200 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom In"
        >
          <ZoomIn size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        </button>
        <div style={{ width: 1, height: 20, backgroundColor: isDark ? '#475569' : '#cbd5e1', margin: '0 4px' }} />
        <button
          onClick={handleFitToScreen}
          className="transition-smooth hover-scale"
          style={{
            padding: 6,
            borderRadius: 4,
            backgroundColor: zoomLevel === 100 ? (isDark ? '#3b82f6' : '#3b82f6') : (isDark ? '#334155' : '#f1f5f9'),
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Fit to Screen"
        >
          <Maximize2 size={18} color={zoomLevel === 100 ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')} />
        </button>
      </div>

      {/* Dashboard Canvas */}
      {widgets.length === 0 ? (
        <div className="text-center py-12" style={{ color: colors.muted }}>
          <p>No widgets configured for this dashboard.</p>
        </div>
      ) : (
        <div
          style={{
            width: needsScroll ? scaledWidth : '100%',
            height: needsScroll ? scaledHeight : '100%',
            minHeight: needsScroll ? undefined : 'calc(100vh - 64px)',
            display: 'flex',
            alignItems: needsScroll ? 'flex-start' : 'center',
            justifyContent: needsScroll ? 'flex-start' : 'center',
          }}
        >
          <div
            ref={canvasRef}
            className="relative"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: needsScroll ? 'top left' : 'center center',
              flexShrink: 0,
            }}
          >
            {widgets.map((widget) => {
              const slicerRule = widget.type === 'filter' ? slicerFilters.find((f) => f.id === `slicer-${widget.id}`) : null;
              const effectiveWidget = widget.type === 'filter' && slicerRule
                ? { ...widget, selectedFilters: slicerRule.values || [] }
                : widget;
              return (
                <WidgetCard
                  key={widget.id}
                  widget={effectiveWidget}
                  widgetData={getWidgetData(widget)}
                  isLoading={widget.datasetId ? loadingData[widget.datasetId] : false}
                  colors={colors}
                  isDark={isDark}
                  mode={mode}
                  onSlicerChange={
                    widget.type === 'filter' && widget.filterField
                      ? (value: string, selected: boolean) => {
                        const ruleId = `slicer-${widget.id}`;
                        const current = slicerRule?.values || widget.selectedFilters || [];
                        const newValues = selected ? [...current, value] : current.filter((v) => v !== value);
                        const existing = slicerFilters.find((f) => f.id === ruleId);
                        if (existing) {
                          updateSlicerFilter(ruleId, { values: newValues.map(String) });
                        } else {
                          addSlicerFilter({
                            id: ruleId,
                            field: widget.filterField!,
                            level: 'page',
                            type: 'basic',
                            operator: 'in',
                            values: newValues.map(String),
                            isEnabled: true,
                          });
                        }
                      }
                      : undefined
                  }
                  onDataPointClick={
                    widget.interactionMode !== 'none' && widget.type !== 'filter'
                      ? (field: string, value: unknown) => {
                        // Get current filters directly from engine to avoid stale closure
                        const currentFilters = crossFilterEngine.getCrossFilters();

                        // Check if ANY filter exists from this widget for this field
                        const existingFilterFromWidget = currentFilters.find(
                          f => f.sourceWidgetId === widget.id && f.field === field
                        );

                        // Check if clicking the same value (toggle off) or different value (replace)
                        const isSameValue = existingFilterFromWidget &&
                          existingFilterFromWidget.values.length > 0 &&
                          String(existingFilterFromWidget.values[0]) === String(value);

                        if (isSameValue) {
                          // Toggle off - clicking same value removes the filter
                          crossFilterEngine.removeCrossFiltersFromWidget(widget.id);
                        } else {
                          // Add/replace filter - clicking different value or first click
                          addCrossFilter({
                            id: `cf-${widget.id}-${field}`,
                            sourceWidgetId: widget.id,
                            field,
                            values: value != null ? [value] : [],
                            operator: 'in',
                            timestamp: Date.now(),
                          });
                        }
                      }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized widget card component to prevent unnecessary re-renders
const WidgetCard = React.memo(({
  widget,
  widgetData,
  isLoading,
  colors,
  isDark,
  mode,
  onSlicerChange,
  onDataPointClick,
}: {
  widget: Widget;
  widgetData: unknown[];
  isLoading: boolean;
  colors: any;
  isDark: boolean;
  mode: 'light' | 'dark';
  onSlicerChange?: (value: string, selected: boolean) => void;
  onDataPointClick?: (field: string, value: unknown) => void;
}) => {
  return (
    <div
      className="rounded-lg shadow-sm overflow-hidden"
      style={{
        position: 'absolute',
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        height: widget.size.height,
        minHeight: 160,
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: colors.cardBorder,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
        }}
      >
        <h3 className="font-medium text-base truncate" style={{ color: colors.text }} title={widget.title}>{widget.title}</h3>
      </div>
      <div
        className="p-4 overflow-hidden"
        style={{
          height: 'calc(100% - 48px)',
          minHeight: 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : (
          renderWidget(widget, widgetData, { mode, onSlicerChange, onDataPointClick, animations: true })
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.widget.id === nextProps.widget.id &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.widgetData === nextProps.widgetData &&
    prevProps.isDark === nextProps.isDark
  );
});