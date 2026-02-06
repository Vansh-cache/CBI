import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useCrossFilter } from '../../contexts/CrossFilterContext';
import { useDashboardName } from '../../contexts/DashboardNameContext';
import { getThemeColors } from '../../lib/themeColors';
import { createFilterContext, applyFilterContext, crossFilterEngine } from '../../lib/crossFilterEngine';
import { renderWidget, Widget } from '../shared/WidgetRenderer';
import { getCurrentDevice, type DeviceType } from '../../lib/responsiveLayout';

// Fixed canvas dimensions - matches Dashboard Builder (Full HD)
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;
const FRAME_HEADER_HEIGHT = 48;

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
          const widgetsToShow = config.pages?.[0]?.widgets ?? config.widgets;
          if (widgetsToShow) {
            setWidgets(Array.isArray(widgetsToShow) ? widgetsToShow : []);
            setSelectedDatasets(config.selectedDatasets || []);
            const datasetIds = new Set<number>();
            (Array.isArray(widgetsToShow) ? widgetsToShow : []).forEach((w: Widget) => {
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
  // Only run once when widgets are initially loaded
  useEffect(() => {
    const filterWidgets = widgets.filter((w) => w.type === 'filter' && w.filterField);
    filterWidgets.forEach((w) => {
      const ruleId = `slicer-${w.id}`;
      const values = (w.selectedFilters || []).map(String);
      if (values.length > 0) {
        const existing = slicerFilters.find((f) => f.id === ruleId);
        if (!existing) {
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
      }
    });
  }, [widgets.length]); // Only run when widgets are first loaded

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

  // Sort widgets by position for responsive layout (top-to-bottom, left-to-right)
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      const rowA = Math.floor(a.position.y / 100);
      const rowB = Math.floor(b.position.y / 100);
      if (rowA !== rowB) return rowA - rowB;
      return a.position.x - b.position.x;
    });
  }, [widgets]);

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

  // Use fixed canvas dimensions - same as Dashboard Builder
  const CANVAS_WIDTH = FRAME_WIDTH;
  const CANVAS_HEIGHT = FRAME_HEIGHT;

  // Detect device type for responsive layout
  const deviceType: DeviceType = getCurrentDevice(viewportSize.width);
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isResponsive = isMobile || isTablet;

  // Calculate fit-to-screen scale (only used for desktop)
  const fitScaleX = viewportSize.width / CANVAS_WIDTH;
  const fitScaleY = viewportSize.height / CANVAS_HEIGHT;
  const fitScale = Math.min(fitScaleX, fitScaleY);

  // Use fit scale directly
  const scale = fitScale;

  // Calculate scaled dimensions
  const scaledWidth = CANVAS_WIDTH * scale;
  const scaledHeight = CANVAS_HEIGHT * scale;

  // When zoomed out or fit, center the canvas. When zoomed in, allow scrolling
  const needsScroll = scaledWidth > viewportSize.width || scaledHeight > viewportSize.height;

  const mode = isDark ? 'dark' : 'light';

  // Build slicer/cross-filter handler
  const buildSlicerHandler = (widget: Widget) => {
    if (widget.type !== 'filter' || !widget.filterField) return undefined;
    const slicerRule = slicerFilters.find((f) => f.id === `slicer-${widget.id}`);
    return (value: string, selected: boolean) => {
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
    };
  };

  const buildDataPointClickHandler = (widget: Widget) => {
    if (widget.interactionMode === 'none' || widget.type === 'filter' || widget.type === 'decomposition-tree') return undefined;
    return (field: string, value: unknown) => {
      const currentFilters = crossFilterEngine.getCrossFilters();
      const existingFilterFromWidget = currentFilters.find(
        f => f.sourceWidgetId === widget.id && f.field === field
      );
      const isSameValue = existingFilterFromWidget &&
        existingFilterFromWidget.values.length > 0 &&
        String(existingFilterFromWidget.values[0]) === String(value);
      if (isSameValue) {
        crossFilterEngine.removeCrossFiltersFromWidget(widget.id);
      } else {
        addCrossFilter({
          id: `cf-${widget.id}-${field}`,
          sourceWidgetId: widget.id,
          field,
          values: value != null ? [value] : [],
          operator: 'in',
          timestamp: Date.now(),
        });
      }
    };
  };

  // ─── Responsive (mobile / tablet) layout ───
  if (isResponsive) {
    const gap = isMobile ? 12 : 16;
    const padding = isMobile ? 12 : 20;
    const columns = isMobile ? 1 : 2;
    const containerWidth = viewportSize.width;
    const colWidth = (containerWidth - padding * 2 - (columns - 1) * gap) / columns;

    return (
      <div
        ref={containerRef}
        style={{
          minHeight: 'calc(100vh - 64px)',
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
          padding: `${padding}px`,
        }}
      >
        {/* Dashboard title bar */}
        <div
          style={{
            marginBottom: gap,
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 600,
              color: isDark ? '#e2e8f0' : '#1e293b',
              margin: 0,
            }}
          >
            {dashboardData?.name || 'Untitled Report'}
          </h2>
        </div>

        {widgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: colors.muted }}>
            <p>No widgets configured for this dashboard.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: `${gap}px`,
            }}
          >
            {sortedWidgets.map((widget) => {
              const slicerRule = widget.type === 'filter' ? slicerFilters.find((f) => f.id === `slicer-${widget.id}`) : null;
              const effectiveWidget = widget.type === 'filter' && slicerRule
                ? { ...widget, selectedFilters: slicerRule.values || [] }
                : widget;

              // Calculate adaptive height based on widget type
              const aspectRatio = widget.size.width / widget.size.height;
              let widgetHeight: number;
              if (widget.type === 'card' || widget.type === 'kpi') {
                widgetHeight = isMobile ? 100 : 120;
              } else if (widget.type === 'table' || widget.type === 'matrix') {
                widgetHeight = isMobile ? 280 : 320;
              } else if (widget.type === 'filter') {
                widgetHeight = isMobile ? 200 : 240;
              } else {
                // Charts: maintain aspect ratio, clamped
                widgetHeight = Math.max(200, Math.min(colWidth / aspectRatio, isMobile ? 320 : 360));
              }

              // Card/KPI widgets can share a row on mobile (half width)
              const isCompactWidget = (widget.type === 'card' || widget.type === 'kpi');
              const itemWidth = isMobile && isCompactWidget
                ? `calc(50% - ${gap / 2}px)`
                : isTablet
                  ? `calc(50% - ${gap / 2}px)`
                  : '100%';

              return (
                <div
                  key={widget.id}
                  style={{
                    width: itemWidth,
                    flexShrink: 0,
                  }}
                >
                  <ResponsiveWidgetCard
                    widget={effectiveWidget}
                    widgetData={getWidgetData(widget)}
                    isLoading={widget.datasetId ? loadingData[widget.datasetId] : false}
                    colors={colors}
                    isDark={isDark}
                    mode={mode}
                    height={widgetHeight}
                    isMobile={isMobile}
                    onSlicerChange={buildSlicerHandler(widget)}
                    onDataPointClick={buildDataPointClickHandler(widget)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Desktop layout (original fixed canvas with scale) ───

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
      {/* Dashboard Canvas - Fixed Size Frame */}
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
          {/* Fixed Canvas Frame */}
          <div
            ref={canvasRef}
            className="relative rounded-lg overflow-hidden"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: needsScroll ? 'top left' : 'center center',
              flexShrink: 0,
              border: `2px solid ${isDark ? '#3c3c3c' : '#d1d5db'}`,
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {/* Frame Header */}
            <div
              className="flex items-center justify-between px-4 shrink-0"
              style={{
                height: FRAME_HEADER_HEIGHT,
                borderBottom: `1px solid ${isDark ? '#334155' : '#e5e5e5'}`,
                backgroundColor: isDark ? '#0f172a' : '#f8f9fa',
              }}
            >
              <h2
                className="text-sm font-semibold truncate"
                style={{ color: isDark ? '#e2e8f0' : '#323130' }}
              >
                {dashboardData?.name || 'Untitled Report'}
              </h2>
              <span className="text-xs" style={{ color: isDark ? '#64748b' : '#9ca3af' }}>
                {FRAME_WIDTH} × {FRAME_HEIGHT - FRAME_HEADER_HEIGHT}px
              </span>
            </div>
            {/* Widgets Container */}
            <div
              className="relative"
              style={{
                height: FRAME_HEIGHT - FRAME_HEADER_HEIGHT,
                overflow: 'hidden',
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
                      widget.interactionMode !== 'none' && widget.type !== 'filter' && widget.type !== 'decomposition-tree'
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

// ─── Responsive widget card for mobile/tablet ───
const ResponsiveWidgetCard = React.memo(({
  widget,
  widgetData,
  isLoading,
  colors,
  isDark,
  mode,
  height,
  isMobile,
  onSlicerChange,
  onDataPointClick,
}: {
  widget: Widget;
  widgetData: unknown[];
  isLoading: boolean;
  colors: any;
  isDark: boolean;
  mode: 'light' | 'dark';
  height: number;
  isMobile: boolean;
  onSlicerChange?: (value: string, selected: boolean) => void;
  onDataPointClick?: (field: string, value: unknown) => void;
}) => {
  const isCompact = widget.type === 'card' || widget.type === 'kpi';
  const titleSize = isMobile ? (isCompact ? '12px' : '13px') : '14px';
  const titlePadX = isMobile ? '10px' : '14px';
  const titlePadY = isMobile ? '6px' : '10px';
  const contentPad = isMobile ? '8px' : '12px';
  const headerH = isCompact && isMobile ? 28 : 38;

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: isDark
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          padding: `${titlePadY} ${titlePadX}`,
          borderBottom: `1px solid ${colors.cardBorder}`,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
          height: headerH,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            fontWeight: 600,
            fontSize: titleSize,
            color: colors.text,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={widget.title}
        >
          {widget.title}
        </h3>
      </div>
      <div
        style={{
          padding: contentPad,
          height: `calc(100% - ${headerH}px)`,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        ) : (
          renderWidget(widget, widgetData, { mode, onSlicerChange, onDataPointClick, animations: true, isMobile })
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.widget.id === nextProps.widget.id &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.widgetData === nextProps.widgetData &&
    prevProps.isDark === nextProps.isDark &&
    prevProps.height === nextProps.height
  );
});