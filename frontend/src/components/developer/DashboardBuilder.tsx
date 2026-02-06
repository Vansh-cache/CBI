import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon, Save, Eye, ArrowLeft, Activity, Target, Gauge, Grid3x3, X, Plus, ChevronRight, ChevronDown, ChevronLeft, Layers, Hash, Filter as FilterIcon, GripVertical, Database, Loader2, CheckCircle, ZoomIn, ZoomOut, Maximize2, Settings, MousePointer2, Monitor, Smartphone, Search, Paintbrush } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { apiGet, apiPost, apiPut } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCrossFilter } from '../../contexts/CrossFilterContext';
import { getThemeColors } from '../../lib/themeColors';
import { validateChartConfig } from '../../lib/chartRegistry';
import { ChartRenderer, type ChartWidgetConfig } from '../charts/ChartRenderer';
import { applyCrossFilters, applyFilterContext, createFilterContext, crossFilterEngine } from '../../lib/crossFilterEngine';
import { drillManager, applyDrillFilters } from '../../lib/drillManager';
import { inferDataModel } from '../../lib/dataModel';
import UserAssignmentModal from './UserAssignmentModal';
import DashboardDetailsModal from './DashboardDetailsModal';
import VisualInteractionControls from './VisualInteractionControls';
import DrillControls from './DrillControls';
import { FilterRule } from './FilterPane';

type AggregationType = 'count' | 'countDistinct' | 'sum' | 'first' | 'last' | 'percentage' | 'avg' | 'min' | 'max' | 'none';

interface Widget {
  id: string;
  type:
  | 'bar' | 'line' | 'pie' | 'table' | 'stacked-bar' | 'area' | 'donut' | 'treemap' | 'gauge' | 'card' | 'filter'
  | 'stacked-column' | 'column' | '100-stacked-bar' | '100-stacked-column' | 'stacked-area'
  | 'line-clustered' | 'line-stacked' | 'ribbon' | 'waterfall' | 'funnel' | 'scatter'
  | 'map' | 'filled-map' | 'azure-map' | 'shape-map' | 'arcgis-map'
  | 'multi-row-card' | 'kpi' | 'matrix' | 'r-visual' | 'python-visual'
  | 'key-influencers' | 'decomposition-tree' | 'qa-visual' | 'smart-narrative'
  | 'paginated-report' | 'power-apps' | 'power-automate';
  title: string;
  dataKey?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };

  // Legacy fields (for backward compatibility)
  /**
   * PowerBI-like semantic aggregation for visuals.
   * - Charts: aggregates Values (yAxis/field) by X-axis (and Legend when relevant)
   * - Cards: aggregates single Field
   */
  aggregation?: AggregationType;
  field?: string;
  xAxis?: string;
  yAxis?: string;
  legend?: string;
  filterField?: string;
  selectedFilters?: string[];

  // Per-field aggregations (Power BI style)
  xAxisAggregation?: AggregationType;
  yAxisAggregation?: AggregationType;
  legendAggregation?: AggregationType;
  fieldAggregation?: AggregationType;

  // Power BI-style enhancements
  measures?: string[]; // Array of measure IDs
  dimensions?: string[]; // Array of dimension field names
  drillPathId?: string; // ID of drill path for this widget
  interactionMode?: 'filter' | 'highlight' | 'none'; // How this widget affects others
  allowDrillDown?: boolean; // Enable drill-down on this widget
  allowDrillThrough?: boolean; // Enable drill-through on this widget
  drillThroughTarget?: string; // Target widget ID for drill-through

  // Data source
  datasetId?: number; // Link widget to a data source

  // Styling
  accentColor?: string;
  /** Value format: 'currency' | 'percent' | 'number' | 'decimal' */
  valueFormat?: string;
  showDataLabels?: boolean;
  showLegend?: boolean;
  showGridLines?: boolean;

  // Locked state (from alignment tools)
  locked?: boolean;
}

interface Dataset {
  id: number;
  name: string;
  description: string | null;
  source_type: 'excel' | 'api';
  schema_definition: string | object;
  row_count: number;
  connection_status?: 'connected' | 'error' | 'disconnected';
}

interface Column {
  name: string;
  type: string;
}

/** Power BI-style visualization types - exactly matching Power BI grid layout */
const VIZ_PANEL_TYPES = [
  // Row 1 - Common charts
  { type: 'stacked-bar' as const, icon: BarChart3, label: 'Stacked bar', color: '#118DFF' },
  { type: 'bar' as const, icon: BarChart3, label: 'Clustered bar', color: '#118DFF' },
  { type: 'stacked-column' as const, icon: BarChart3, label: 'Stacked column', color: '#118DFF' },
  { type: 'column' as const, icon: BarChart3, label: 'Clustered column', color: '#118DFF' },
  { type: '100-stacked-bar' as const, icon: BarChart3, label: '100% Stacked bar', color: '#118DFF' },
  { type: '100-stacked-column' as const, icon: BarChart3, label: '100% Stacked column', color: '#118DFF' },
  { type: 'line' as const, icon: LineChartIcon, label: 'Line', color: '#107c10' },
  { type: 'area' as const, icon: Activity, label: 'Area', color: '#107c10' },
  // Row 2 - More charts
  { type: 'stacked-area' as const, icon: Activity, label: 'Stacked area', color: '#107c10' },
  { type: 'line-clustered' as const, icon: LineChartIcon, label: 'Line and clustered', color: '#6B007B' },
  { type: 'line-stacked' as const, icon: LineChartIcon, label: 'Line and stacked', color: '#6B007B' },
  { type: 'ribbon' as const, icon: Activity, label: 'Ribbon', color: '#00B7C3' },
  { type: 'waterfall' as const, icon: BarChart3, label: 'Waterfall', color: '#E66C37' },
  { type: 'funnel' as const, icon: Activity, label: 'Funnel', color: '#744EC2' },
  { type: 'scatter' as const, icon: Activity, label: 'Scatter', color: '#D64550' },
  { type: 'pie' as const, icon: PieChartIcon, label: 'Pie', color: '#E66C37' },
  // Row 3 - Advanced charts
  { type: 'donut' as const, icon: Target, label: 'Donut', color: '#E66C37' },
  { type: 'treemap' as const, icon: Grid3x3, label: 'Treemap', color: '#00B7C3' },
  { type: 'map' as const, icon: Activity, label: 'Map', color: '#744EC2' },
  { type: 'filled-map' as const, icon: Activity, label: 'Filled map', color: '#744EC2' },
  { type: 'azure-map' as const, icon: Activity, label: 'Azure map', color: '#0078D4' },
  { type: 'shape-map' as const, icon: Activity, label: 'Shape map', color: '#744EC2' },
  { type: 'arcgis-map' as const, icon: Activity, label: 'ArcGIS map', color: '#744EC2' },
  { type: 'gauge' as const, icon: Gauge, label: 'Gauge', color: '#107c10' },
  // Row 4 - KPI and special
  { type: 'card' as const, icon: Hash, label: 'Card', color: '#118DFF' },
  { type: 'multi-row-card' as const, icon: TableIcon, label: 'Multi-row card', color: '#118DFF' },
  { type: 'kpi' as const, icon: Target, label: 'KPI', color: '#107c10' },
  { type: 'filter' as const, icon: FilterIcon, label: 'Slicer', color: '#D64550' },
  { type: 'table' as const, icon: TableIcon, label: 'Table', color: '#6B7280' },
  { type: 'matrix' as const, icon: Grid3x3, label: 'Matrix', color: '#6B7280' },
  { type: 'r-visual' as const, icon: Activity, label: 'R visual', color: '#276DC3' },
  { type: 'python-visual' as const, icon: Activity, label: 'Python', color: '#3776AB' },
  // Row 5 - AI visuals
  { type: 'key-influencers' as const, icon: Target, label: 'Key influencers', color: '#744EC2' },
  { type: 'decomposition-tree' as const, icon: Layers, label: 'Decomposition', color: '#744EC2' },
  { type: 'qa-visual' as const, icon: Activity, label: 'Q&A', color: '#118DFF' },
  { type: 'smart-narrative' as const, icon: Activity, label: 'Smart narrative', color: '#118DFF' },
  { type: 'paginated-report' as const, icon: TableIcon, label: 'Paginated', color: '#E66C37' },
  { type: 'power-apps' as const, icon: Activity, label: 'Power Apps', color: '#742774' },
  { type: 'power-automate' as const, icon: Activity, label: 'Power Automate', color: '#0066FF' },
];

// Field labels configuration based on chart type (Power BI style)
const CHART_FIELD_CONFIG: Record<string, {
  axis?: string;
  values?: string;
  legend?: string;
  showAxis?: boolean;
  showValues?: boolean;
  showLegend?: boolean;
  showField?: boolean;
  fieldLabel?: string;
}> = {
  // Bar/Column charts
  'bar': { axis: 'Y-axis', values: 'X-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },
  'column': { axis: 'X-axis', values: 'Y-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },
  'stacked-bar': { axis: 'Y-axis', values: 'X-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },
  'stacked-column': { axis: 'X-axis', values: 'Y-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },
  '100-stacked-bar': { axis: 'Y-axis', values: 'X-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },
  '100-stacked-column': { axis: 'X-axis', values: 'Y-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },

  // Line/Area charts
  'line': { axis: 'X-axis', values: 'Y-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },
  'area': { axis: 'X-axis', values: 'Y-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },
  'stacked-area': { axis: 'X-axis', values: 'Y-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },

  // Combo charts
  'line-clustered': { axis: 'Shared axis', values: 'Column values', legend: 'Line values', showAxis: true, showValues: true, showLegend: true },
  'line-stacked': { axis: 'Shared axis', values: 'Column values', legend: 'Line values', showAxis: true, showValues: true, showLegend: true },
  'ribbon': { axis: 'X-axis', values: 'Y-axis', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },

  // Pie/Donut
  'pie': { axis: 'Legend', values: 'Values', showAxis: true, showValues: true, showLegend: false },
  'donut': { axis: 'Legend', values: 'Values', showAxis: true, showValues: true, showLegend: false },

  // Treemap/Funnel
  'treemap': { axis: 'Category', values: 'Values', legend: 'Details', showAxis: true, showValues: true, showLegend: true },
  'funnel': { axis: 'Category', values: 'Values', showAxis: true, showValues: true, showLegend: false },
  'waterfall': { axis: 'Category', values: 'Y-axis', legend: 'Breakdown', showAxis: true, showValues: true, showLegend: true },

  // Scatter/Bubble
  'scatter': { axis: 'X-axis', values: 'Y-axis', legend: 'Details', showAxis: true, showValues: true, showLegend: true },

  // KPI/Card
  'card': { showAxis: false, showValues: false, showLegend: false, showField: true, fieldLabel: 'Fields' },
  'kpi': { axis: 'Trend axis', values: 'Indicator', legend: 'Target', showAxis: true, showValues: true, showLegend: true },
  'multi-row-card': { showAxis: false, showValues: false, showLegend: false, showField: true, fieldLabel: 'Fields' },

  // Gauge
  'gauge': { values: 'Value', legend: 'Target value', showAxis: false, showValues: true, showLegend: true },

  // Table/Matrix
  'table': { showAxis: false, showValues: true, values: 'Columns', showLegend: false },
  'matrix': { axis: 'Rows', values: 'Columns', legend: 'Values', showAxis: true, showValues: true, showLegend: true },

  // Slicer/Filter
  'filter': { showAxis: false, showValues: false, showLegend: false, showField: true, fieldLabel: 'Field' },

  // Maps
  'map': { axis: 'Location', values: 'Size', legend: 'Legend', showAxis: true, showValues: true, showLegend: true },
  'filled-map': { axis: 'Location', values: 'Legend', showAxis: true, showValues: true, showLegend: false },
  'azure-map': { axis: 'Location', values: 'Size', legend: 'Color', showAxis: true, showValues: true, showLegend: true },
  'shape-map': { axis: 'Location', values: 'Color saturation', showAxis: true, showValues: true, showLegend: false },
  'arcgis-map': { axis: 'Location', values: 'Size', legend: 'Color', showAxis: true, showValues: true, showLegend: true },

  // AI visuals
  'key-influencers': { axis: 'Analyze', values: 'Explain by', showAxis: true, showValues: true, showLegend: false },
  'decomposition-tree': { axis: 'Analyze', values: 'Explain by', showAxis: true, showValues: true, showLegend: false },
  'qa-visual': { showAxis: false, showValues: false, showLegend: false },
  'smart-narrative': { showAxis: false, showValues: false, showLegend: false },

  // Other
  'r-visual': { showAxis: false, showValues: true, values: 'Values', showLegend: false },
  'python-visual': { showAxis: false, showValues: true, values: 'Values', showLegend: false },
  'paginated-report': { showAxis: false, showValues: false, showLegend: false },
  'power-apps': { showAxis: false, showValues: false, showLegend: false },
  'power-automate': { showAxis: false, showValues: false, showLegend: false },
};

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count (All)' },
  { value: 'countDistinct', label: 'Count (Distinct)' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'first', label: 'First' },
  { value: 'last', label: 'Last' },
  { value: 'none', label: 'Don\'t summarize' },
];

export default function DashboardBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);

  // Power BI-style cross-filtering
  const {
    crossFilters,
    addCrossFilter,
    removeCrossFilter,
    clearAllCrossFilters,
    getCrossFiltersForWidget,
    setInteraction,
    getInteraction,
    slicerFilters,
    addSlicerFilter,
    updateSlicerFilter,
    removeSlicerFilter,
    pageFilters,
    reportFilters,
  } = useCrossFilter();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [dataSourcesPanelExpanded, setDataSourcesPanelExpanded] = useState(true);
  const [columnsPanelExpanded, setColumnsPanelExpanded] = useState(true);
  const [dashboardName, setDashboardName] = useState('Untitled Dashboard');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [dashboardCategory, setDashboardCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'publish' | null>(null);
  const [dashboardId, setDashboardId] = useState<number | null>(id ? parseInt(id) : null);

  // Data source management
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<Set<number>>(new Set());
  const [columns, setColumns] = useState<Record<number, Column[]>>({}); // datasetId -> columns
  const [datasetData, setDatasetData] = useState<Record<number, unknown[]>>({}); // datasetId -> data rows
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingData, setLoadingData] = useState<Record<number, boolean>>({});
  const [draggedColumn, setDraggedColumn] = useState<{ datasetId: number; columnName: string } | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');
  const [rightTab, setRightTab] = useState<'visualizations' | 'fields' | 'format'>('fields');

  // Power BI layout (matches reference image)
  const [leftFiltersCollapsed, setLeftFiltersCollapsed] = useState(false);
  const [vizPaneCollapsed, setVizPaneCollapsed] = useState(false);
  const [dataPaneCollapsed, setDataPaneCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const builderContainerRef = useRef<HTMLDivElement>(null);
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'mobile'>('desktop');
  const [keepAllFilters, setKeepAllFilters] = useState(true);
  const [drillThroughFields, setDrillThroughFields] = useState<string[]>([]);
  const [crossReport, setCrossReport] = useState(false);
  const [pages, setPages] = useState([{ id: '1', name: 'Product Sales' }, { id: '2', name: 'Shipment Tracking Dashboard' }, { id: '3', name: 'Page 1' }]);
  const [currentPage, setCurrentPage] = useState(2);

  // Power BI controls
  const [showInteractionControls, setShowInteractionControls] = useState(false);
  const [showDrillControls, setShowDrillControls] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const rightPanelScrollRef = useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      builderContainerRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  // Canva-like canvas: zoom, pan, expandable stage
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; offX: number; offY: number } | null>(null);
  const hasPannedRef = useRef(false);

  // Fetch datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      setLoadingDatasets(true);
      try {
        const res = await apiGet<Dataset[]>('/api/data/datasets');
        if (res.success && res.data) {
          const fetchedDatasets = Array.isArray(res.data) ? res.data : [];
          setDatasets(fetchedDatasets);
        }
      } catch (e) {
        console.error('Failed to fetch datasets:', e);
      } finally {
        setLoadingDatasets(false);
      }
    };
    fetchDatasets();
  }, []);

  // Track viewport size for fit-to-view and canvas layout (throttled to avoid lag)
  useEffect(() => {
    if (!canvasRef.current) return;
    const el = canvasRef.current;
    let rafId: number;
    const update = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        setViewportSize({ w: el.clientWidth || 0, h: el.clientHeight || 0 });
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  // Pan: attach window mousemove/mouseup when isPanning (throttled with rAF)
  useEffect(() => {
    if (!isPanning) return;
    let rafId: number;
    let pendingX = 0;
    let pendingY = 0;
    const flushPan = () => {
      rafId = 0;
      const s = panStartRef.current;
      if (s) {
        setPan({ x: pendingX, y: pendingY });
      }
    };
    const onMove = (e: MouseEvent) => {
      const s = panStartRef.current;
      if (s) {
        hasPannedRef.current = true;
        pendingX = s.offX + e.clientX - s.x;
        pendingY = s.offY + e.clientY - s.y;
        if (!rafId) rafId = requestAnimationFrame(flushPan);
      }
    };
    const onUp = (e: MouseEvent) => {
      // Only deselect when releasing *inside* the canvas. Releasing over Format/sidebar must not deselect.
      const inCanvas = canvasRef.current?.contains(e.target as Node);
      if (!hasPannedRef.current && inCanvas) setSelectedWidget(null);
      panStartRef.current = null;
      setIsPanning(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isPanning]);

  // Wheel zoom (throttled with rAF to avoid lag)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let rafId: number;
    let pendingDelta = 0;
    const flushZoom = () => {
      rafId = 0;
      const delta = pendingDelta;
      pendingDelta = 0;
      if (delta !== 0) {
        setZoom((z) => Math.min(2, Math.max(0.15, z + delta)));
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      pendingDelta += e.deltaY > 0 ? -0.1 : 0.1;
      if (!rafId) rafId = requestAnimationFrame(flushZoom);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Fetch data and columns for selected datasets
  const fetchDatasetData = useCallback(async (datasetId: number) => {
    setLoadingData((prev) => ({ ...prev, [datasetId]: true }));
    try {
      const res = await apiGet<{ data: unknown[]; pagination?: unknown }>(`/api/data/datasets/${datasetId}`);
      if (res.success && res.data) {
        const rows = Array.isArray(res.data.data) ? res.data.data : [];
        setDatasetData((prev) => ({ ...prev, [datasetId]: rows }));

        // Extract columns from schema or first row
        const dataset = datasets.find((d) => d.id === datasetId);
        let cols: Column[] = [];

        if (dataset?.schema_definition) {
          try {
            const schema =
              typeof dataset.schema_definition === 'string'
                ? JSON.parse(dataset.schema_definition)
                : dataset.schema_definition;
            if (Array.isArray(schema)) {
              cols = schema;
            }
          } catch {
            // Fallback to first row
          }
        }

        if (cols.length === 0 && rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
          cols = Object.keys(rows[0] as Record<string, unknown>).map((key) => ({
            name: key,
            type: 'string',
          }));
        }

        setColumns((prev) => ({ ...prev, [datasetId]: cols }));
      }
    } catch (e) {
      console.error('Failed to fetch dataset data:', e);
    } finally {
      setLoadingData((prev) => ({ ...prev, [datasetId]: false }));
    }
  }, [datasets]);

  // Fetch data when dataset is selected
  useEffect(() => {
    selectedDatasets.forEach((datasetId) => {
      if (!columns[datasetId] && !loadingData[datasetId]) {
        fetchDatasetData(datasetId);
      }
    });
  }, [selectedDatasets, columns, loadingData, fetchDatasetData]);

  // Sync filter widgets (slicers) with CrossFilterContext so all visuals react to them
  useEffect(() => {
    const filterWidgets = widgets.filter((w) => w.type === 'filter' && w.filterField);
    const validSlicerIds = new Set(filterWidgets.map((w) => `slicer-${w.id}`));

    filterWidgets.forEach((w) => {
      const ruleId = `slicer-${w.id}`;
      const values = (w.selectedFilters || []).map(String);
      const rule: FilterRule = {
        id: ruleId,
        field: w.filterField!,
        level: 'page',
        type: 'basic',
        operator: 'in',
        values,
        isEnabled: true,
      };
      const existing = slicerFilters.find((f) => f.id === ruleId);
      if (existing) {
        if (JSON.stringify(existing.values || []) !== JSON.stringify(values)) {
          updateSlicerFilter(ruleId, { values });
        }
      } else {
        addSlicerFilter(rule);
      }
    });

    slicerFilters.forEach((f) => {
      if (f.id.startsWith('slicer-') && !validSlicerIds.has(f.id)) {
        removeSlicerFilter(f.id);
      }
    });
  }, [widgets, slicerFilters, addSlicerFilter, updateSlicerFilter, removeSlicerFilter]);

  // Load existing dashboard if id is provided
  useEffect(() => {
    if (id) {
      const loadDashboard = async () => {
        try {
          const res = await apiGet<{
            id: number;
            name: string;
            description: string | null;
            config: string | { widgets: Widget[]; selectedDatasets?: number[]; category?: string };
          }>(`/api/dashboards/${id}`);
          if (res.success && res.data) {
            setDashboardId(res.data.id);
            setDashboardName(res.data.name || 'Untitled Dashboard');
            setDashboardDescription(res.data.description || '');
            const config = typeof res.data.config === 'string' ? JSON.parse(res.data.config) : res.data.config;
            if (config.widgets) {
              setWidgets(config.widgets);
            }
            if (config.selectedDatasets) {
              setSelectedDatasets(new Set(config.selectedDatasets));
            }
            if (config.category) {
              setDashboardCategory(config.category);
            }
          }
        } catch (e) {
          console.error('Failed to load dashboard:', e);
        }
      };
      loadDashboard();
    }
  }, [id]);

  const toggleDatasetSelection = (datasetId: number) => {
    setSelectedDatasets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(datasetId)) {
        newSet.delete(datasetId);
        // Remove columns and data for deselected dataset
        setColumns((cols) => {
          const newCols = { ...cols };
          delete newCols[datasetId];
          return newCols;
        });
        setDatasetData((data) => {
          const newData = { ...data };
          delete newData[datasetId];
          return newData;
        });
      } else {
        newSet.add(datasetId);
      }
      return newSet;
    });
  };

  const handleDragStart = (datasetId: number, columnName: string) => {
    setDraggedColumn({ datasetId, columnName });
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  type FieldBucket = 'xAxis' | 'yAxis' | 'legend' | 'field' | 'filterField' | 'dimensions' | 'measures';

  const handleDrop = (target: FieldBucket, widgetId: string) => {
    if (!draggedColumn || !selectedWidget) return;

    const columnName = draggedColumn.columnName;
    const widget = widgets.find((w) => w.id === widgetId);
    const updates: Partial<Widget> = {};

    if (target === 'dimensions') {
      const existing = widget?.dimensions || [];
      const legacy = [widget?.yAxis, widget?.legend].filter(Boolean) as string[];
      const all = [...legacy, ...existing];
      if (!all.includes(columnName)) {
        updates.dimensions = [...existing, columnName];
      }
    } else if (target === 'measures') {
      const existing = widget?.measures || [];
      const legacyFirst = !existing.length && widget?.xAxis ? [widget.xAxis] : [];
      const all = [...legacyFirst, ...existing];
      if (!all.includes(columnName)) {
        if (!existing.length && widget?.xAxis) {
          updates.measures = [widget.xAxis, columnName];
          updates.xAxis = undefined;
        } else {
          updates.measures = [...existing, columnName];
        }
      }
    } else if (target === 'xAxis') {
      updates.xAxis = columnName;
    } else if (target === 'yAxis') {
      updates.yAxis = columnName;
    } else if (target === 'legend') {
      updates.legend = columnName;
    } else if (target === 'field') {
      updates.field = columnName;
    } else if (target === 'filterField') {
      updates.filterField = columnName;
      updates.selectedFilters = [];
    }

    // Also link widget to the dataset
    updates.datasetId = draggedColumn.datasetId;

    updateWidget(widgetId, updates);
    setDraggedColumn(null);
  };

  const handleRemoveFromArray = (widgetId: string, key: 'dimensions' | 'measures', value: string) => {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;
    const arr = (widget[key] || []).filter((x) => x !== value);
    updateWidget(widgetId, { [key]: arr.length > 0 ? arr : undefined });
  };

  const handleSaveClick = () => {
    if (!dashboardId) {
      // New dashboard - show details modal first
      setPendingAction('save');
      setShowDetailsModal(true);
    } else {
      // Existing dashboard - save directly
      handleSave();
    }
  };

  const handleSave = async (details?: { name: string; category: string; description: string }) => {
    const name = details?.name || dashboardName;
    const category = details?.category || dashboardCategory;
    const description = details?.description || dashboardDescription;

    if (!name.trim()) {
      alert('Please enter a dashboard name');
      return;
    }

    setSaving(true);
    try {
      const config = {
        configVersion: 1,
        widgets,
        selectedDatasets: Array.from(selectedDatasets),
        category: category || undefined,
      };

      if (dashboardId) {
        // Update existing dashboard
        const res = await apiPut<{ id: number; name: string }>(`/api/dashboards/${dashboardId}`, {
          name: name.trim(),
          description: description.trim() || null,
          config: JSON.stringify(config),
        });

        if (res.success) {
          setDashboardName(name);
          setDashboardCategory(category);
          setDashboardDescription(description);
          alert('Dashboard saved successfully!');
        } else {
          throw new Error(res.message || 'Failed to save dashboard');
        }
      } else {
        // Create new dashboard
        const res = await apiPost<{ id: number; name: string }>('/api/dashboards', {
          name: name.trim(),
          description: description.trim() || null,
          config: JSON.stringify(config),
        });

        if (res.success && res.data) {
          setDashboardId(res.data.id);
          setDashboardName(name);
          setDashboardCategory(category);
          setDashboardDescription(description);
          alert('Dashboard saved successfully!');
        } else {
          throw new Error(res.message || 'Failed to save dashboard');
        }
      }
    } catch (e) {
      console.error('Save error:', e);
      alert(e instanceof Error ? e.message : 'Failed to save dashboard');
    } finally {
      setSaving(false);
      setShowDetailsModal(false);
      setPendingAction(null);
    }
  };

  const handlePublishClick = () => {
    if (!dashboardId) {
      // New dashboard - show details modal first
      setPendingAction('publish');
      setShowDetailsModal(true);
    } else {
      // Existing dashboard - show publish modal directly
      setShowPublishModal(true);
    }
  };

  const handleDetailsSave = async (details: { name: string; category: string; description: string }) => {
    setDashboardName(details.name);
    setDashboardCategory(details.category);
    setDashboardDescription(details.description);

    if (pendingAction === 'save') {
      await handleSave(details);
    } else if (pendingAction === 'publish') {
      setShowDetailsModal(false);
      setPendingAction(null);
      // After saving details, proceed with publish
      await handleSave(details);
      setShowPublishModal(true);
    }
  };

  const handlePublishConfirm = async (selectedUserIds: number[], dashboardName?: string) => {
    // Update dashboard name if provided
    if (dashboardName && dashboardName.trim()) {
      setDashboardName(dashboardName.trim());
    }
    if (!dashboardName.trim()) {
      alert('Please enter a dashboard name');
      return;
    }

    setPublishing(true);
    try {
      const config = {
        configVersion: 1,
        widgets,
        selectedDatasets: Array.from(selectedDatasets),
        category: dashboardCategory || undefined,
      };

      let finalDashboardId = dashboardId;

      // Save/Update dashboard first
      if (dashboardId) {
        // Update existing dashboard
        const res = await apiPut<{ id: number; name: string }>(`/api/dashboards/${dashboardId}`, {
          name: dashboardName.trim(),
          description: dashboardDescription.trim() || null,
          config: JSON.stringify(config),
        });

        if (!res.success) {
          throw new Error(res.message || 'Failed to save dashboard');
        }
      } else {
        // Create new dashboard
        const res = await apiPost<{ id: number; name: string }>('/api/dashboards', {
          name: dashboardName.trim(),
          description: dashboardDescription.trim() || null,
          config: JSON.stringify(config),
        });

        if (res.success && res.data) {
          finalDashboardId = res.data.id;
          setDashboardId(res.data.id);
        } else {
          throw new Error(res.message || 'Failed to create dashboard');
        }
      }

      // Assign dashboard to selected users
      if (finalDashboardId && selectedUserIds.length > 0) {
        const assignPromises = selectedUserIds.map((userId) =>
          apiPost(`/api/dashboards/${finalDashboardId}/assign`, {
            user_id: userId,
            permission_type: 'view',
          })
        );

        await Promise.all(assignPromises);
      }

      alert('Dashboard published and assigned successfully!');
      setShowPublishModal(false);
      navigate('/developer/dashboard');
    } catch (e) {
      console.error('Publish error:', e);
      alert(e instanceof Error ? e.message : 'Failed to publish dashboard');
    } finally {
      setPublishing(false);
    }
  };

  const addWidget = (type: Widget['type']) => {
    // Always add a new widget when clicking chart icons
    {
      // Add new widget when no widget is selected
      const size = {
        width: type === 'filter' ? 250 : type === 'card' ? 280 : 450,
        height: type === 'filter' ? 200 : type === 'card' ? 180 : 350
      };
      const position = findNextFreePosition(size);
      const newWidget: Widget = {
        id: Date.now().toString(),
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        position,
        size,
        aggregation: type === 'card' ? 'count' : 'sum',
        field: undefined,
        xAxis: undefined, // No default - user must select
        yAxis: undefined, // No default - user must select
        legend: undefined, // No default - user must select
        filterField: type === 'filter' ? undefined : undefined,
        selectedFilters: [],
        datasetId: selectedDatasets.size > 0 ? (Array.from(selectedDatasets)[0] as number) : undefined,
        accentColor: '#118DFF', // PowerBI-ish default
      };
      setWidgets([...widgets, newWidget]);
      setSelectedWidget(newWidget.id);
      setRightTab('fields');
    }
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    if (selectedWidget === id) {
      setSelectedWidget(null);
    }
  };

  const updateWidgetPosition = useCallback((id: string, x: number, y: number) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, position: { x, y } } : w)));
  }, []);

  const updateWidgetSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);

  const updateWidget = useCallback((id: string, updates: Partial<Widget>) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  /**
   * Dashboard JSON schema (stored in backend dashboard config today)
   * ------------------------------------------------------------
   * {
   *   widgets: Widget[],
   *   selectedDatasets: number[],
   *   category?: string
   * }
   *
   * Widget highlights:
   * - position/size => layout (canvas)
   * - datasetId => binding
   * - xAxis/yAxis/legend/field/filterField => PowerBI-like buckets
   * - aggregation => semantic aggregation (sum/count/etc)
   */
  const COLORS = ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#00B7C3', '#744EC2', '#D64550', '#7FBA00', '#FFB900', '#4C78A8'];
  const GRID_SIZE = 10;
  const CANVAS_PADDING = 24;
  // Power BI–style bounded frame: charts only inside this area
  // Canvas size - width fixed, height dynamic based on content
  const FRAME_WIDTH = 1920;
  const MIN_FRAME_HEIGHT = 600; // Minimum canvas height

  // Calculate dynamic height based on widget positions
  const calculatedHeight = widgets.length > 0
    ? Math.max(...widgets.map(w => w.position.y + w.size.height)) + 100 // Add padding
    : MIN_FRAME_HEIGHT;

  const FRAME_HEIGHT = Math.max(MIN_FRAME_HEIGHT, calculatedHeight);
  const STAGE_WIDTH = FRAME_WIDTH;
  const STAGE_HEIGHT = FRAME_HEIGHT;
  const FRAME_HEADER_HEIGHT = 56; // Title + padding

  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const rectsOverlap = useCallback(
    (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },
    []
  );

  /**
   * PowerBI-like auto-layout:
   * When adding a new visual, find the next free slot on the canvas (grid-snapped)
   * so visuals never overlap. If the row is full, it places the visual below.
   */
  const findNextFreePosition = useCallback(
    (newSize: { width: number; height: number }) => {
      const chartTop = FRAME_HEADER_HEIGHT;
      const usableWidth = Math.max(0, FRAME_WIDTH - CANVAS_PADDING * 2);
      const maxY = FRAME_HEIGHT - CANVAS_PADDING - newSize.height;
      const step = GRID_SIZE;
      const pad = 12;

      const maxX = Math.max(CANVAS_PADDING, CANVAS_PADDING + usableWidth - newSize.width);
      const existing = widgets.map((it) => ({
        x: it.position.x - pad,
        y: it.position.y - pad,
        w: it.size.width + pad * 2,
        h: it.size.height + pad * 2,
      }));

      let y = Math.max(CANVAS_PADDING, chartTop);
      const safetyMaxRows = 600;
      for (let row = 0; row < safetyMaxRows; row++) {
        if (y + newSize.height > FRAME_HEIGHT - CANVAS_PADDING) break;
        for (let x = CANVAS_PADDING; x <= maxX; x += step) {
          const candidate = { x, y, w: newSize.width, h: newSize.height };
          const overlaps = existing.some((r) => rectsOverlap(candidate, r));
          if (!overlaps) return { x: snapToGrid(x), y: snapToGrid(y) };
        }
        const bottoms = existing.map((r) => r.y + r.h);
        const nextY = bottoms.length > 0 ? Math.min(...bottoms.filter((b) => b > y + 1)) : y + newSize.height + pad;
        y = snapToGrid(Number.isFinite(nextY) ? nextY : y + newSize.height + pad);
      }

      const maxBottom = widgets.reduce((m, it) => Math.max(m, it.position.y + it.size.height), 0);
      const fallbackY = Math.min(snapToGrid(maxBottom + pad), Math.max(CANVAS_PADDING, maxY));
      return { x: CANVAS_PADDING, y: fallbackY };
    },
    [CANVAS_PADDING, GRID_SIZE, FRAME_WIDTH, FRAME_HEIGHT, FRAME_HEADER_HEIGHT, rectsOverlap, snapToGrid, widgets]
  );

  // Pre-compute widget data once per filter/data change to avoid redundant work and re-renders
  const widgetDataCache = useMemo(() => {
    const cache = new Map<string, unknown[]>();
    const filterContext = createFilterContext(crossFilters, slicerFilters, pageFilters, reportFilters);
    widgets.forEach((widget) => {
      let rows: unknown[] = [];
      if (widget.datasetId && datasetData[widget.datasetId]) {
        rows = datasetData[widget.datasetId];
      } else if (selectedDatasets.size > 0) {
        const firstDatasetId = Array.from(selectedDatasets)[0];
        rows = datasetData[firstDatasetId] || [];
      }
      rows = applyFilterContext(rows, filterContext, widget.id);
      if (widget.drillPathId && widget.allowDrillDown) {
        const drillFilters = drillManager.getDrillFilters(widget.id);
        if (drillFilters.length > 0) rows = applyDrillFilters(rows, drillFilters);
      }
      cache.set(widget.id, rows);
    });
    return cache;
  }, [widgets, datasetData, selectedDatasets, crossFilters, slicerFilters, pageFilters, reportFilters]);

  const getWidgetData = useCallback(
    (widget: Widget): unknown[] => widgetDataCache.get(widget.id) ?? [],
    [widgetDataCache]
  );

  // Drill-down handlers
  const handleStartDrill = useCallback((widgetId: string, pathId: string) => {
    drillManager.startDrillDown(widgetId, pathId);
    updateWidget(widgetId, { drillPathId: pathId, allowDrillDown: true });
  }, []);

  const handleDrillDown = useCallback((widgetId: string, value: any) => {
    if (drillManager.canDrillDown(widgetId)) {
      drillManager.drillDown(widgetId, value);
      // Force re-render by updating widgets
      setWidgets(prev => [...prev]);
    }
  }, []);

  const handleDrillUp = useCallback((widgetId: string) => {
    if (drillManager.canDrillUp(widgetId)) {
      drillManager.drillUp(widgetId);
      // Force re-render
      setWidgets(prev => [...prev]);
    }
  }, []);

  const handleResetDrill = useCallback((widgetId: string) => {
    drillManager.resetDrill(widgetId);
    updateWidget(widgetId, { drillPathId: undefined, allowDrillDown: false });
  }, []);

  const renderWidget = (widget: Widget) => {
    const rawRows = getWidgetData(widget);
    const mode = isDark ? 'dark' : 'light';

    // Get current drill level field if in drill mode
    const currentXAxis = widget.drillPathId && widget.allowDrillDown
      ? drillManager.getCurrentLevelField(widget.id) || widget.xAxis
      : widget.xAxis;

    const config: ChartWidgetConfig = {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      position: widget.position,
      size: widget.size,
      aggregation: widget.aggregation,
      field: widget.field,
      xAxis: currentXAxis,
      yAxis: widget.yAxis,
      legend: widget.legend,
      filterField: widget.filterField,
      selectedFilters: widget.selectedFilters,
      datasetId: widget.datasetId,
      accentColor: widget.accentColor,
      dimensions: widget.dimensions,
      measures: widget.measures,
      valueFormat: widget.valueFormat,
      // Per-field aggregations
      xAxisAggregation: widget.xAxisAggregation,
      yAxisAggregation: widget.yAxisAggregation,
      legendAggregation: widget.legendAggregation,
      fieldAggregation: widget.fieldAggregation,
    };
    const onSlicerChange =
      widget.type === 'filter' && widget.filterField
        ? (value: string, selected: boolean) => {
          const current = widget.selectedFilters || [];
          const newFilters = selected ? [...current, value] : current.filter((f) => f !== value);
          updateWidget(widget.id, { selectedFilters: newFilters });
          // Sync to CrossFilterContext (slicerFilters) - the sync effect will run, but we update immediately for responsiveness
          const ruleId = `slicer-${widget.id}`;
          const existing = slicerFilters.find((f) => f.id === ruleId);
          if (existing) {
            updateSlicerFilter(ruleId, { values: newFilters.map(String) });
          } else {
            addSlicerFilter({
              id: ruleId,
              field: widget.filterField!,
              level: 'page',
              type: 'basic',
              operator: 'in',
              values: newFilters.map(String),
              isEnabled: true,
            });
          }
        }
        : undefined;
    const onDataPointClick =
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
        : undefined;

    return ChartRenderer(config, rawRows, { mode, onSlicerChange, onDataPointClick, animations: false });
  };

  const selectedWidgetData = useMemo(
    () => widgets.find((w) => w.id === selectedWidget),
    [widgets, selectedWidget]
  );

  const pbi = useMemo(() => ({
    sidebar: (colors as any).pbiSidebar ?? colors.cardBg,
    sidebarBorder: (colors as any).pbiSidebarBorder ?? colors.cardBorder,
    canvas: (colors as any).pbiCanvas ?? colors.bg,
    ribbon: (colors as any).pbiRibbon ?? colors.cardBg,
    ribbonBorder: (colors as any).pbiRibbonBorder ?? colors.cardBorder,
    bucketBg: (colors as any).pbiBucketBg ?? colors.inputBg,
    bucketBorder: (colors as any).pbiBucketBorder ?? colors.inputBorder,
    text: (colors as any).pbiText ?? colors.text,
    textMuted: (colors as any).pbiTextMuted ?? colors.muted,
    accent: (colors as any).pbiAccent ?? '#0078d4',
    accentHover: (colors as any).pbiAccentHover ?? '#106ebe',
    green: (colors as any).pbiGreen ?? '#107c10',
  }), [colors]);

  const BucketDropZone = ({
    label,
    value,
    bucket,
    widgetId,
    hint,
    onClear,
  }: {
    label: string;
    value?: string;
    bucket: FieldBucket;
    widgetId: string;
    hint?: string;
    onClear?: () => void;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label style={{ color: pbi.text }} className="block text-[11px] font-medium">
          {label}
        </label>
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] hover:underline"
            style={{ color: pbi.textMuted }}
          >
            Clear
          </button>
        )}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).style.borderColor = '#107c10';
        }}
        onDragLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = pbi.sidebarBorder;
        }}
        onDrop={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).style.borderColor = pbi.sidebarBorder;
          handleDrop(bucket, widgetId);
        }}
        style={{
          backgroundColor: isDark ? '#2d2d2d' : '#f8f8f8',
          borderColor: pbi.sidebarBorder,
          color: pbi.text,
          borderWidth: 1,
          borderStyle: 'solid',
        }}
        className="w-full px-2.5 py-2 text-[11px] border rounded min-h-[32px] flex items-center transition-colors"
      >
        {value ? (
          <span style={{ color: pbi.text }} className="text-[11px]">{value}</span>
        ) : (
          <span style={{ color: pbi.textMuted }} className="text-[11px]">{hint || 'Add data fields here'}</span>
        )}
      </div>
    </div>
  );

  const MultiFieldDropZone = ({
    label,
    values,
    bucket,
    widgetId,
    hint,
    onRemove,
  }: {
    label: string;
    values: string[];
    bucket: 'dimensions' | 'measures';
    widgetId: string;
    hint?: string;
    onRemove: (value: string) => void;
  }) => (
    <div>
      <label style={{ color: pbi.text }} className="block text-[11px] font-medium mb-1">
        {label}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).style.borderColor = '#107c10';
        }}
        onDragLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = pbi.sidebarBorder;
        }}
        onDrop={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).style.borderColor = pbi.sidebarBorder;
          handleDrop(bucket, widgetId);
        }}
        style={{
          backgroundColor: isDark ? '#2d2d2d' : '#f8f8f8',
          borderColor: pbi.sidebarBorder,
          borderWidth: 1,
          borderStyle: 'solid',
        }}
        className="w-full px-2.5 py-2 text-[11px] border rounded min-h-[32px] transition-colors"
      >
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {values.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  color: pbi.text,
                }}
              >
                {v}
                <button
                  type="button"
                  onClick={() => onRemove(v)}
                  className="ml-0.5 hover:opacity-80 p-0.5 rounded"
                  style={{ color: pbi.textMuted }}
                  title="Remove"
                  aria-label={`Remove ${v}`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: pbi.textMuted }} className="text-[11px]">{hint || 'Drag columns here (supports multiple)'}</span>
        )}
      </div>
    </div>
  );

  return (
    <div ref={builderContainerRef} style={{ backgroundColor: pbi.canvas, height: '100vh', overflow: 'hidden' }} className="flex flex-col">
      {/* Top Ribbon - Power BI style */}
      <div style={{ backgroundColor: pbi.ribbon, borderBottom: `1px solid ${pbi.ribbonBorder}` }} className="px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/developer/dashboard')}
              style={{ color: pbi.text }}
              className="p-2 hover:opacity-80 rounded transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 style={{ color: pbi.text }} className="text-lg font-semibold">Dashboard Builder</h1>
              <p style={{ color: pbi.textMuted }} className="text-xs">
                {selectedWidget
                  ? "✨ Selected: Change type in Build, or click canvas to deselect"
                  : "Scroll to zoom • Drag background to pan • Add visuals • Drag to move • Resize with handles"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Power BI Controls */}
            {crossFilters.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded" style={{ backgroundColor: 'rgba(0,120,212,0.1)' }}>
                <FilterIcon className="w-4 h-4" style={{ color: pbi.accent }} />
                <span className="text-xs font-medium" style={{ color: pbi.accent }}>
                  {crossFilters.length} filter{crossFilters.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={clearAllCrossFilters}
                  className="ml-1 p-0.5 hover:opacity-80 rounded transition-colors"
                  title="Clear all filters"
                >
                  <X className="w-3 h-3" style={{ color: pbi.accent }} />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowInteractionControls(true)}
              style={{ color: pbi.text }}
              className="flex items-center px-3 py-1.5 hover:opacity-80 rounded text-sm transition-colors"
              title="Configure visual interactions"
            >
              <MousePointer2 className="w-4 h-4 mr-2" />
              Interactions
            </button>

            <button
              onClick={() => setShowDrillControls(true)}
              style={{ color: pbi.text }}
              className="flex items-center px-3 py-1.5 hover:opacity-80 rounded text-sm transition-colors"
              title="Configure drill-down"
            >
              <Layers className="w-4 h-4 mr-2" />
              Drill
            </button>

            <input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              placeholder="Report name"
              style={{ backgroundColor: pbi.bucketBg, borderColor: pbi.bucketBorder, color: pbi.text }}
              className="px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-[#0078d4] focus:border-[#0078d4] outline-none"
            />
            <button
              onClick={() => navigate(`/developer/preview/${dashboardId || 'new'}`)}
              style={{ color: colors.text }}
              className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={handleSaveClick}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </button>
            <button
              onClick={handlePublishClick}
              disabled={publishing}
              className="flex items-center px-3 py-1.5 bg-[#107c10] text-white rounded hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Main Builder Area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          {/* Left - Filters (narrow, collapsible, Power BI style) */}
          <div
            style={{
              width: leftFiltersCollapsed ? 32 : 56,
              minWidth: leftFiltersCollapsed ? 32 : 56,
              backgroundColor: pbi.sidebar,
              borderRight: `1px solid ${pbi.sidebarBorder}`,
              height: '100%',
            }}
            className="flex flex-col items-center py-3 transition-all duration-200 shrink-0"
          >
            <button
              onClick={() => setLeftFiltersCollapsed(!leftFiltersCollapsed)}
              className="p-2 rounded hover:bg-white/10 transition-colors cursor-pointer"
              title={leftFiltersCollapsed ? 'Expand Filters' : 'Collapse Filters'}
            >
              {leftFiltersCollapsed ? (
                <ChevronRight className="w-4 h-4" style={{ color: pbi.textMuted }} />
              ) : (
                <ChevronLeft className="w-4 h-4" style={{ color: pbi.textMuted }} />
              )}
            </button>
            {!leftFiltersCollapsed && (
              <>
                <div
                  className="flex flex-col items-center mt-4"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(-180deg)' }}
                >
                  <FilterIcon className="w-4 h-4 mb-2" style={{ color: pbi.textMuted }} />
                  <span style={{ color: pbi.text }} className="text-xs font-medium">Filters</span>
                </div>
                <div className="mt-4 px-1 w-full space-y-1">
                  {(crossFilters.length + slicerFilters.length) > 0 ? (
                    <>
                      <p style={{ color: pbi.textMuted }} className="text-[10px] mb-1">{crossFilters.length + slicerFilters.length} active</p>
                      <button
                        onClick={() => {
                          clearAllCrossFilters();
                          slicerFilters.forEach((f) => removeSlicerFilter(f.id));
                        }}
                        className="w-full py-1 px-2 text-[10px] rounded hover:bg-white/10 cursor-pointer transition-colors"
                        style={{ color: pbi.accent }}
                      >
                        Clear all
                      </button>
                    </>
                  ) : (
                    <p style={{ color: pbi.textMuted }} className="text-[10px]">No filters</p>
                  )}
                </div>
              </>
            )}
          </div>

          <PanelGroup direction="horizontal" className="flex-1 min-w-0 h-full">

            {/* Main Canvas - Canva-like: zoom, pan, expandable stage */}
            <Panel defaultSize={56} minSize={40}>
              <div
                ref={canvasRef}
                className="h-full overflow-hidden relative"
                style={{
                  backgroundColor: pbi.canvas,
                  pointerEvents: (showPublishModal || showDetailsModal) ? 'none' : 'auto',
                  opacity: (showPublishModal || showDetailsModal) ? 0.3 : 1,
                  cursor: isPanning ? 'grabbing' : 'default',
                }}
              >
                {/* Stage: bounded report frame (Power BI–style) */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: STAGE_WIDTH,
                    height: STAGE_HEIGHT,
                    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                    transformOrigin: '0 0',
                    willChange: isPanning ? 'transform' : 'auto',
                  }}
                >
                  {/* Bounded frame: charts only inside this area */}
                  <div
                    className="absolute inset-0 rounded overflow-hidden"
                    style={{
                      border: `2px dashed ${pbi.sidebarBorder}`,
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* Frame header: dashboard title */}
                    <div
                      className="flex items-center px-6 shrink-0"
                      style={{
                        height: FRAME_HEADER_HEIGHT,
                        borderBottom: `1px solid #e5e5e5`,
                      }}
                    >
                      <h2
                        className="text-base font-semibold truncate"
                        style={{ color: '#323130' }}
                      >
                        {dashboardName || 'Untitled Report'}
                      </h2>
                    </div>
                    {/* Chart placement area */}
                    <div
                      className="absolute left-0 right-0 bottom-0"
                      style={{ top: FRAME_HEADER_HEIGHT }}
                    >
                      {/* Background: dotted pattern, drag to pan */}
                      <div
                        role="presentation"
                        className="absolute inset-0"
                        style={{
                          backgroundImage: isDark
                            ? 'radial-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px)'
                            : 'radial-gradient(rgba(107, 114, 128, 0.18) 1px, transparent 1px)',
                          backgroundSize: '18px 18px',
                          cursor: 'grab',
                        }}
                        onMouseDown={(e) => {
                          if (showPublishModal || showDetailsModal) return;
                          hasPannedRef.current = false;
                          panStartRef.current = { x: e.clientX, y: e.clientY, offX: pan.x, offY: pan.y };
                          setIsPanning(true);
                        }}
                      />
                      {widgets.length === 0 ? (
                        <div
                          className="absolute flex items-center justify-center pointer-events-none"
                          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%' }}
                        >
                          <div className="text-center max-w-lg">
                            <h3 style={{ color: '#323130' }} className="text-lg font-semibold mb-2">Build visuals with your data</h3>
                            <p style={{ color: '#605e5c' }} className="text-sm mb-8">
                              Select or drag fields from the <span className="font-semibold">Data</span> pane onto the report canvas.
                            </p>
                            <div className="flex justify-center items-center gap-4">
                              {/* Visual placeholder - matches Power BI exactly */}
                              <div
                                className="relative flex items-end gap-1 p-4 border-2 border-dashed rounded"
                                style={{ borderColor: '#107c10', width: 100, height: 80 }}
                              >
                                <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: '#107c10' }} />
                                <div className="w-3 h-12 rounded-sm" style={{ backgroundColor: '#107c10' }} />
                                <div className="w-3 h-6 rounded-sm" style={{ backgroundColor: '#107c10' }} />
                                <div className="absolute bottom-1 right-1">
                                  <input type="checkbox" checked className="w-4 h-4 accent-[#107c10]" readOnly />
                                </div>
                              </div>
                              {/* Arrow */}
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#107c10' }}>
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {/* Data list placeholder */}
                              <div
                                className="flex flex-col gap-1 p-3 border-2 border-dashed rounded"
                                style={{ borderColor: '#d4d4d4', width: 80, height: 80 }}
                              >
                                <div className="flex items-center gap-1">
                                  <input type="checkbox" className="w-2.5 h-2.5" disabled />
                                  <div className="h-1.5 bg-gray-300 rounded w-10" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <input type="checkbox" className="w-2.5 h-2.5" disabled />
                                  <div className="h-1.5 bg-gray-300 rounded w-8" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <input type="checkbox" className="w-2.5 h-2.5" disabled />
                                  <div className="h-1.5 bg-gray-300 rounded w-12" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <input type="checkbox" className="w-2.5 h-2.5" disabled />
                                  <div className="h-1.5 bg-gray-300 rounded w-6" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {widgets.map((widget) => (
                            <Draggable
                              key={widget.id}
                              position={{ x: widget.position.x, y: widget.position.y }}
                              onStop={(e, data) => {
                                if (showPublishModal || showDetailsModal) return;
                                const rx = Math.max(0, Math.min(FRAME_WIDTH - widget.size.width, snapToGrid(data.x)));
                                const ry = Math.max(FRAME_HEADER_HEIGHT, Math.min(FRAME_HEIGHT - widget.size.height, snapToGrid(data.y)));
                                updateWidgetPosition(widget.id, rx, ry);
                              }}
                              handle=".drag-handle"
                              grid={[GRID_SIZE, GRID_SIZE]}
                              bounds={{ left: 0, top: FRAME_HEADER_HEIGHT, right: FRAME_WIDTH - widget.size.width, bottom: FRAME_HEIGHT - widget.size.height }}
                              disabled={showPublishModal || showDetailsModal}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  zIndex: (showPublishModal || showDetailsModal) ? 0 : (selectedWidget === widget.id ? 1000 : 1),
                                  pointerEvents: (showPublishModal || showDetailsModal) ? 'none' : 'auto',
                                  opacity: (showPublishModal || showDetailsModal) ? 0.3 : 1,
                                }}
                              >
                                <Resizable
                                  size={{ width: widget.size.width, height: widget.size.height }}
                                  onResizeStop={(e, direction, ref, d) => {
                                    const newWidth = snapToGrid(widget.size.width + d.width);
                                    const newHeight = snapToGrid(widget.size.height + d.height);

                                    // Update size
                                    updateWidgetSize(widget.id, {
                                      width: newWidth,
                                      height: newHeight
                                    });

                                    // Update position based on resize direction
                                    let newX = widget.position.x;
                                    let newY = widget.position.y;

                                    // If resizing from left side, move position left by the width delta
                                    if (direction.includes('left')) {
                                      newX = snapToGrid(widget.position.x - d.width);
                                    }

                                    // If resizing from top side, move position up by the height delta
                                    if (direction.includes('top')) {
                                      newY = snapToGrid(widget.position.y - d.height);
                                    }

                                    // Update position if it changed
                                    if (newX !== widget.position.x || newY !== widget.position.y) {
                                      updateWidgetPosition(widget.id, newX, newY);
                                    }
                                  }}
                                  minWidth={150}
                                  minHeight={120}
                                  enable={{
                                    top: true,
                                    right: true,
                                    bottom: true,
                                    left: true,
                                    topRight: true,
                                    topLeft: true,
                                    bottomRight: true,
                                    bottomLeft: true
                                  }}
                                >
                                  <div
                                    onClick={() => setSelectedWidget(widget.id)}
                                    className="h-full relative transition-all"
                                    style={{
                                      backgroundColor: pbi.bucketBg,
                                      boxShadow: selectedWidget === widget.id
                                        ? `0 0 0 2px ${pbi.accent}`
                                        : '0 1px 3px rgba(0,0,0,0.08)',
                                      border: 'none',
                                      borderRadius: 12,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {/* Widget Header with Drag Handle */}
                                    <div
                                      style={{ backgroundColor: pbi.sidebar, borderColor: pbi.sidebarBorder }}
                                      className="drag-handle flex items-center justify-between px-3 py-2 border-b cursor-move"
                                    >
                                      <div className="flex items-center">
                                        <GripVertical className="w-4 h-4 mr-2" style={{ color: pbi.textMuted }} />
                                        <h4 style={{ color: pbi.text }} className="font-medium text-base">{widget.title}</h4>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeWidget(widget.id);
                                        }}
                                        className="p-1 hover:opacity-80 transition-colors"
                                        style={{ color: pbi.textMuted }}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Widget Content */}
                                    <div className="h-[calc(100%-44px)] p-3">
                                      {renderWidget(widget)}
                                    </div>
                                  </div>
                                </Resizable>
                              </div>
                            </Draggable>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-transparent hover:bg-[#107c10]/20 active:bg-[#107c10]/30 transition-colors cursor-col-resize flex-shrink-0" />

            {/* Right Sidebar - Power BI dual-pane: Visualizations | Data */}
            <Panel defaultSize={32} minSize={24} maxSize={45}>
              <div className="h-full flex" style={{ backgroundColor: pbi.sidebar, borderLeft: `1px solid ${pbi.sidebarBorder}` }}>

                {/* VISUALIZATIONS PANE - Left side of right panel */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: `1px solid ${pbi.sidebarBorder}`, minWidth: '220px' }}>
                  {/* Visualizations header with collapse controls */}
                  <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${pbi.sidebarBorder}` }}>
                    <div className="flex items-center gap-2">
                      <button className="p-1 rounded hover:bg-white/10" title="Collapse">
                        <ChevronLeft className="w-3.5 h-3.5" style={{ color: pbi.textMuted }} />
                      </button>
                      <span style={{ color: pbi.text }} className="font-semibold text-xs">Visualizations</span>
                    </div>
                    <button className="p-1 rounded hover:bg-white/10" title="Expand Data">
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: pbi.textMuted }} />
                    </button>
                  </div>

                  {/* Build Visual / Format tabs */}
                  <div className="flex items-center gap-1 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${pbi.sidebarBorder}` }}>
                    <span style={{ color: pbi.textMuted }} className="text-xs mr-2">Build visual</span>
                    <button
                      type="button"
                      onClick={() => setRightTab('visualizations')}
                      className={`p-1.5 rounded transition-colors ${rightTab === 'visualizations' ? 'bg-[#107c10]/20' : 'hover:bg-white/5'}`}
                      style={{
                        color: rightTab === 'visualizations' ? '#107c10' : pbi.textMuted,
                        border: rightTab === 'visualizations' ? '1px solid #107c10' : '1px solid transparent'
                      }}
                      title="Build visual"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightTab('format')}
                      className={`p-1.5 rounded transition-colors ${rightTab === 'format' ? 'bg-[#107c10]/20' : 'hover:bg-white/5'}`}
                      style={{
                        color: rightTab === 'format' ? '#107c10' : pbi.textMuted,
                        border: rightTab === 'format' ? '1px solid #107c10' : '1px solid transparent'
                      }}
                      title="Format visual"
                    >
                      <Paintbrush className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable content area */}
                  <div ref={rightPanelScrollRef} className="flex-1 overflow-y-auto min-h-0">
                    {rightTab === 'visualizations' && (
                      <>
                        {/* Add New Visual Button - shown when widget is selected */}
                        {selectedWidget && (
                          <div className="px-2 pt-2">
                            <button
                              onClick={() => setSelectedWidget(null)}
                              className="w-full px-2 py-1.5 text-[10px] rounded flex items-center justify-center gap-1 transition-colors"
                              style={{
                                backgroundColor: '#107c10',
                                color: '#fff',
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              Add New Visual
                            </button>
                          </div>
                        )}

                        {/* Visualization Icons Grid - Power BI style */}
                        <div className="p-2">
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(8, minmax(24px, 1fr))',
                              gap: '2px',
                            }}
                          >
                            {VIZ_PANEL_TYPES.map((viz) => (
                              <button
                                key={viz.type}
                                onClick={() => {
                                  // If a widget is selected, change its type; otherwise add new widget
                                  if (selectedWidget) {
                                    updateWidget(selectedWidget, {
                                      type: viz.type as Widget['type'],
                                      title: `${viz.label} Chart`
                                    });
                                  } else {
                                    addWidget(viz.type as Widget['type']);
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '6px',
                                  borderRadius: '4px',
                                  aspectRatio: '1',
                                  backgroundColor: selectedWidgetData?.type === viz.type ? 'rgba(16,124,16,0.15)' : 'transparent',
                                  border: selectedWidgetData?.type === viz.type ? '1px solid #107c10' : '1px solid transparent',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedWidgetData?.type !== viz.type) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedWidgetData?.type !== viz.type) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                                title={selectedWidget ? `Change to ${viz.label}` : `Add ${viz.label}`}
                              >
                                <viz.icon style={{ width: '16px', height: '16px', color: viz.color }} />
                              </button>
                            ))}
                            {/* More options indicator */}
                            <button
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px',
                                borderRadius: '4px',
                                aspectRatio: '1',
                                color: pbi.textMuted,
                                cursor: 'pointer',
                              }}
                              title="More visuals"
                            >
                              <span style={{ fontSize: '16px', lineHeight: 1 }}>...</span>
                            </button>
                          </div>
                        </div>

                        {/* Field Wells Section - Power BI style with dynamic labels */}
                        <div className="px-3 pb-3 space-y-2">
                          {selectedWidgetData && (() => {
                            const fieldConfig = CHART_FIELD_CONFIG[selectedWidgetData.type] || { showAxis: true, showValues: true, showLegend: true, axis: 'X-axis', values: 'Values', legend: 'Legend' };

                            // Reusable Field Well component
                            const FieldWell = ({
                              label,
                              fieldKey,
                              aggKey,
                              value,
                              aggregation
                            }: {
                              label: string;
                              fieldKey: 'xAxis' | 'yAxis' | 'legend' | 'field' | 'filterField';
                              aggKey: 'xAxisAggregation' | 'yAxisAggregation' | 'legendAggregation' | 'fieldAggregation' | 'aggregation';
                              value?: string;
                              aggregation?: AggregationType;
                            }) => (
                              <div>
                                <label style={{ color: pbi.textMuted }} className="block text-[11px] font-medium mb-1">{label}</label>
                                <div
                                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#107c10'; }}
                                  onDragLeave={(e) => { e.currentTarget.style.borderColor = pbi.sidebarBorder; }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    (e.currentTarget as HTMLElement).style.borderColor = pbi.sidebarBorder;
                                    if (selectedWidgetData) handleDrop(fieldKey, selectedWidgetData.id);
                                  }}
                                  style={{
                                    backgroundColor: isDark ? '#2d2d2d' : '#f8f8f8',
                                    borderColor: pbi.sidebarBorder,
                                  }}
                                  className="border rounded transition-colors"
                                >
                                  {value ? (
                                    <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span style={{ color: pbi.text }} className="text-[11px] truncate">{value}</span>
                                        <select
                                          value={aggregation || 'sum'}
                                          onChange={(e) => updateWidget(selectedWidgetData.id, { [aggKey]: e.target.value as AggregationType })}
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            backgroundColor: isDark ? '#3c3c3c' : '#e8e8e8',
                                            color: pbi.text,
                                            borderColor: pbi.sidebarBorder,
                                          }}
                                          className="text-[9px] px-1 py-0.5 rounded border outline-none cursor-pointer"
                                        >
                                          {AGGREGATION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <button
                                        onClick={() => updateWidget(selectedWidgetData.id, { [fieldKey]: undefined, [aggKey]: undefined })}
                                        className="p-0.5 rounded hover:bg-red-500/20 transition-colors shrink-0"
                                        title={`Remove ${label}`}
                                      >
                                        <X className="w-3 h-3" style={{ color: '#ef4444' }} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="px-2.5 py-2 text-[11px]" style={{ color: pbi.textMuted }}>
                                      Add data fields here
                                    </div>
                                  )}
                                </div>
                              </div>
                            );

                            return (
                              <>
                                {/* Axis/Category field */}
                                {fieldConfig.showAxis && (
                                  <FieldWell
                                    label={fieldConfig.axis || 'Axis'}
                                    fieldKey="xAxis"
                                    aggKey="xAxisAggregation"
                                    value={selectedWidgetData.xAxis}
                                    aggregation={selectedWidgetData.xAxisAggregation}
                                  />
                                )}

                                {/* Values field */}
                                {fieldConfig.showValues && (
                                  <FieldWell
                                    label={fieldConfig.values || 'Values'}
                                    fieldKey="yAxis"
                                    aggKey="yAxisAggregation"
                                    value={selectedWidgetData.yAxis || selectedWidgetData.field}
                                    aggregation={selectedWidgetData.yAxisAggregation || selectedWidgetData.aggregation}
                                  />
                                )}

                                {/* Legend/Details field */}
                                {fieldConfig.showLegend && (
                                  <FieldWell
                                    label={fieldConfig.legend || 'Legend'}
                                    fieldKey="legend"
                                    aggKey="legendAggregation"
                                    value={selectedWidgetData.legend}
                                    aggregation={selectedWidgetData.legendAggregation}
                                  />
                                )}

                                {/* Single field for cards/slicers */}
                                {fieldConfig.showField && (
                                  <FieldWell
                                    label={fieldConfig.fieldLabel || 'Field'}
                                    fieldKey={selectedWidgetData.type === 'filter' ? 'filterField' : 'field'}
                                    aggKey="fieldAggregation"
                                    value={selectedWidgetData.type === 'filter' ? selectedWidgetData.filterField : selectedWidgetData.field}
                                    aggregation={selectedWidgetData.fieldAggregation || selectedWidgetData.aggregation}
                                  />
                                )}
                              </>
                            );
                          })()}

                          {/* Drill through section */}
                          <div className="pt-2" style={{ borderTop: `1px solid ${pbi.sidebarBorder}` }}>
                            <div className="flex items-center justify-between mb-2">
                              <span style={{ color: pbi.text }} className="text-[11px] font-medium">Drill through</span>
                            </div>
                            <div className="space-y-2 text-[11px]">
                              {/* Cross-report toggle */}
                              <div className="flex items-center justify-between">
                                <span style={{ color: pbi.text }}>Cross-report</span>
                                <button
                                  onClick={() => setCrossReport(!crossReport)}
                                  className="relative w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
                                  style={{ backgroundColor: crossReport ? '#107c10' : isDark ? '#3c3c3c' : '#d4d4d4' }}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                                    style={{ transform: crossReport ? 'translateX(20px)' : 'translateX(0)' }}
                                  />
                                  <span
                                    className="absolute text-[9px] font-medium"
                                    style={{
                                      color: crossReport ? '#fff' : pbi.textMuted,
                                      left: crossReport ? '4px' : 'auto',
                                      right: crossReport ? 'auto' : '4px'
                                    }}
                                  >
                                    {crossReport ? 'On' : 'Off'}
                                  </span>
                                </button>
                              </div>

                              {/* Keep all filters toggle */}
                              <div className="flex items-center justify-between">
                                <span style={{ color: pbi.text }}>Keep all filters</span>
                                <button
                                  onClick={() => setKeepAllFilters(!keepAllFilters)}
                                  className="relative w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
                                  style={{ backgroundColor: keepAllFilters ? '#107c10' : isDark ? '#3c3c3c' : '#d4d4d4' }}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                                    style={{ transform: keepAllFilters ? 'translateX(20px)' : 'translateX(0)' }}
                                  />
                                  <span
                                    className="absolute text-[9px] font-medium"
                                    style={{
                                      color: keepAllFilters ? '#fff' : pbi.textMuted,
                                      left: keepAllFilters ? '4px' : 'auto',
                                      right: keepAllFilters ? 'auto' : '4px'
                                    }}
                                  >
                                    {keepAllFilters ? 'On' : 'Off'}
                                  </span>
                                </button>
                              </div>

                              {/* Drill-through fields drop zone */}
                              <div
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#107c10'; }}
                                onDragLeave={(e) => { e.currentTarget.style.borderColor = pbi.sidebarBorder; }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  (e.currentTarget as HTMLElement).style.borderColor = pbi.sidebarBorder;
                                  if (draggedColumn) {
                                    setDrillThroughFields([...drillThroughFields, draggedColumn.columnName]);
                                    setDraggedColumn(null);
                                  }
                                }}
                                style={{
                                  backgroundColor: isDark ? '#2d2d2d' : '#f8f8f8',
                                  borderColor: pbi.sidebarBorder,
                                  color: pbi.textMuted
                                }}
                                className="w-full px-2.5 py-2 border rounded min-h-[28px] text-[11px]"
                              >
                                {drillThroughFields.length > 0
                                  ? drillThroughFields.join(', ')
                                  : 'Add drill-through fields here'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {(rightTab === 'fields' || rightTab === 'format') && (
                      <div style={{ borderTop: `1px solid ${pbi.sidebarBorder}` }} className="p-4 space-y-3">
                        {!selectedWidgetData ? (
                          <div className="py-8 text-center">
                            <p style={{ color: pbi.textMuted }} className="text-xs">
                              Select a visual on the canvas to configure.
                            </p>
                          </div>
                        ) : (
                          <>
                            {rightTab === 'fields' && (
                              <>
                                {/* Dataset binding */}
                                <div>
                                  <label style={{ color: pbi.text }} className="block text-xs font-medium mb-1">Dataset</label>
                                  <select
                                    value={selectedWidgetData.datasetId || ''}
                                    onChange={(e) => updateWidget(selectedWidgetData.id, { datasetId: Number(e.target.value) || undefined })}
                                    style={{ backgroundColor: pbi.bucketBg, borderColor: pbi.bucketBorder, color: pbi.text }}
                                    className="w-full px-2.5 py-1.5 text-sm border rounded focus:ring-1 focus:ring-[#0078d4] outline-none"
                                  >
                                    <option value="" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                                      Select dataset...
                                    </option>
                                    {Array.from(selectedDatasets).map((datasetId) => {
                                      const dataset = datasets.find((d) => d.id === datasetId);
                                      return (
                                        <option key={datasetId} value={datasetId} style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                                          {dataset?.name || `Dataset ${datasetId}`}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <p style={{ color: pbi.textMuted }} className="text-[11px] mt-1.5">
                                    Drag fields from the Data panel “Columns” panel into buckets below.
                                  </p>
                                </div>

                                {/* Validation errors (Power BI–like) */}
                                {(() => {
                                  const errs = validateChartConfig(selectedWidgetData.type, {
                                    xAxis: selectedWidgetData.xAxis,
                                    yAxis: selectedWidgetData.yAxis,
                                    legend: selectedWidgetData.legend,
                                    field: selectedWidgetData.field,
                                    filterField: selectedWidgetData.filterField,
                                    measures: selectedWidgetData.measures,
                                    dimensions: selectedWidgetData.dimensions,
                                  });
                                  if (errs.length === 0) return null;
                                  return (
                                    <div className="rounded px-2.5 py-1.5 text-xs" style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2', color: '#dc2626' }}>
                                      {errs.map((e, i) => (
                                        <p key={i}>{e}</p>
                                      ))}
                                    </div>
                                  );
                                })()}

                                {/* Buckets */}
                                {!['card', 'gauge', 'filter'].includes(selectedWidgetData.type) && (
                                  <>
                                    {selectedWidgetData.type === 'decomposition-tree' ? (
                                      <>
                                        <MultiFieldDropZone
                                          label="Analyze"
                                          values={selectedWidgetData.measures?.length
                                            ? (selectedWidgetData.measures || [])
                                            : (selectedWidgetData.xAxis ? [selectedWidgetData.xAxis] : [])
                                          }
                                          bucket="measures"
                                          widgetId={selectedWidgetData.id}
                                          hint="Drag measure(s) here (numeric)"
                                          onRemove={(v) => {
                                            if (selectedWidgetData.xAxis === v) {
                                              updateWidget(selectedWidgetData.id, { xAxis: undefined });
                                            } else {
                                              handleRemoveFromArray(selectedWidgetData.id, 'measures', v);
                                            }
                                          }}
                                        />
                                        <MultiFieldDropZone
                                          label="Explain by"
                                          values={[
                                            ...(selectedWidgetData.yAxis ? [selectedWidgetData.yAxis] : []),
                                            ...(selectedWidgetData.legend ? [selectedWidgetData.legend] : []),
                                            ...(selectedWidgetData.dimensions || []),
                                          ].filter((x, i, a) => a.indexOf(x) === i)}
                                          bucket="dimensions"
                                          widgetId={selectedWidgetData.id}
                                          hint="Drag dimension(s) to drill by"
                                          onRemove={(v) => {
                                            if (selectedWidgetData.yAxis === v) {
                                              updateWidget(selectedWidgetData.id, { yAxis: undefined });
                                            } else if (selectedWidgetData.legend === v) {
                                              updateWidget(selectedWidgetData.id, { legend: undefined });
                                            } else {
                                              handleRemoveFromArray(selectedWidgetData.id, 'dimensions', v);
                                            }
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <BucketDropZone
                                          label={selectedWidgetData.type === 'key-influencers' ? 'Analyze' : 'X-axis'}
                                          value={selectedWidgetData.xAxis}
                                          bucket="xAxis"
                                          widgetId={selectedWidgetData.id}
                                          hint={selectedWidgetData.type === 'key-influencers' ? 'Drag measure (numeric) here' : 'Drag category field here'}
                                          onClear={() => updateWidget(selectedWidgetData.id, { xAxis: undefined })}
                                        />
                                        <BucketDropZone
                                          label={selectedWidgetData.type === 'key-influencers' ? 'Explain by' : 'Values'}
                                          value={selectedWidgetData.yAxis || selectedWidgetData.field}
                                          bucket="yAxis"
                                          widgetId={selectedWidgetData.id}
                                          hint={selectedWidgetData.type === 'key-influencers' ? 'Drag dimension(s) to drill by' : 'Drag numeric field here'}
                                          onClear={() => updateWidget(selectedWidgetData.id, { yAxis: undefined, field: undefined })}
                                        />
                                        <BucketDropZone
                                          label="Legend"
                                          value={selectedWidgetData.legend}
                                          bucket="legend"
                                          widgetId={selectedWidgetData.id}
                                          hint="Optional: drag category field here"
                                          onClear={() => updateWidget(selectedWidgetData.id, { legend: undefined })}
                                        />
                                      </>
                                    )}
                                  </>
                                )}

                                {selectedWidgetData.type === 'card' && (
                                  <BucketDropZone
                                    label="Field"
                                    value={selectedWidgetData.field}
                                    bucket="field"
                                    widgetId={selectedWidgetData.id}
                                    hint="Drag a field for KPI"
                                    onClear={() => updateWidget(selectedWidgetData.id, { field: undefined })}
                                  />
                                )}

                                {selectedWidgetData.type === 'filter' && (
                                  <BucketDropZone
                                    label="Filter field"
                                    value={selectedWidgetData.filterField}
                                    bucket="filterField"
                                    widgetId={selectedWidgetData.id}
                                    hint="Drag a field to filter other visuals"
                                    onClear={() => updateWidget(selectedWidgetData.id, { filterField: undefined, selectedFilters: [] })}
                                  />
                                )}
                              </>
                            )}

                            {rightTab === 'format' && (
                              <>
                                <div className="mb-2">
                                  <span style={{ color: pbi.text }} className="text-xs font-semibold">Format visual</span>
                                </div>

                                <div className="mb-3">
                                  <label style={{ color: pbi.text }} className="block text-xs font-medium mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={selectedWidgetData.title ?? ''}
                                    onChange={(e) => updateWidget(selectedWidgetData.id, { title: e.target.value })}
                                    placeholder="Chart title"
                                    style={{ backgroundColor: pbi.bucketBg, borderColor: pbi.bucketBorder, color: pbi.text }}
                                    className="w-full px-2.5 py-1.5 text-sm border rounded focus:ring-1 focus:ring-[#0078d4] outline-none"
                                  />
                                </div>

                                {!['table', 'filter'].includes(selectedWidgetData.type) && (
                                  <>
                                    <div className="mb-3">
                                      <label style={{ color: pbi.text }} className="block text-xs font-medium mb-1">Summarization</label>
                                      <select
                                        value={selectedWidgetData.aggregation || 'sum'}
                                        onChange={(e) => updateWidget(selectedWidgetData.id, { aggregation: e.target.value as Widget['aggregation'] })}
                                        style={{ backgroundColor: pbi.bucketBg, borderColor: pbi.bucketBorder, color: pbi.text }}
                                        className="w-full px-2.5 py-1.5 text-sm border rounded focus:ring-1 focus:ring-[#0078d4] outline-none"
                                      >
                                        <option value="sum" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Sum</option>
                                        <option value="count" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Count</option>
                                        <option value="avg" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Average</option>
                                        <option value="min" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Min</option>
                                        <option value="max" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Max</option>
                                        <option value="first" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>First</option>
                                        <option value="last" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Last</option>
                                        <option value="percentage" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Percentage</option>
                                      </select>
                                    </div>

                                    <div className="mb-3">
                                      <label style={{ color: pbi.text }} className="block text-xs font-medium mb-1">Value format</label>
                                      <div className="flex flex-wrap gap-1">
                                        {[
                                          { v: undefined, label: 'Auto' },
                                          { v: 'currency', label: '$' },
                                          { v: 'percent', label: '%' },
                                          { v: 'number', label: '.0' },
                                          { v: 'decimal', label: '.00' },
                                        ].map(({ v, label }) => {
                                          const isSelected = (selectedWidgetData.valueFormat ?? undefined) === v;
                                          return (
                                            <button
                                              key={label}
                                              type="button"
                                              onClick={() => updateWidget(selectedWidgetData.id, { valueFormat: v })}
                                              className="px-2.5 py-1.5 text-xs font-medium rounded border transition-all"
                                              style={{
                                                backgroundColor: isSelected ? 'rgba(0,120,212,0.15)' : pbi.bucketBg,
                                                borderColor: isSelected ? pbi.accent : pbi.bucketBorder,
                                                color: pbi.text,
                                              }}
                                            >
                                              {label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </>
                                )}

                                <div>
                                  <label style={{ color: pbi.text }} className="block text-xs font-medium mb-2">Accent color</label>
                                  <div className="flex flex-wrap gap-2">
                                    {COLORS.map((c) => {
                                      const isSelected = (selectedWidgetData.accentColor || '#118DFF') === c;
                                      return (
                                        <button
                                          key={c}
                                          type="button"
                                          onClick={() => updateWidget(selectedWidgetData.id, { accentColor: c })}
                                          className="h-8 w-8 rounded-md border flex-shrink-0 transition-all"
                                          style={{
                                            backgroundColor: c,
                                            borderColor: isSelected ? pbi.accent : pbi.bucketBorder,
                                            boxShadow: isSelected ? `0 0 0 2px ${pbi.accent}40` : 'none',
                                          }}
                                          title={c}
                                          aria-label={`Accent color ${c}`}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Data pane - Power BI style (right column) */}
                <div
                  className="flex flex-col overflow-hidden shrink-0"
                  style={{
                    width: dataPaneCollapsed ? '32px' : '140px',
                    transition: 'width 0.2s',
                  }}
                >
                  {dataPaneCollapsed ? (
                    <div
                      onClick={() => setDataPaneCollapsed(false)}
                      className="h-full flex flex-col items-center justify-start py-3 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 mb-2" style={{ color: pbi.textMuted }} />
                      <span
                        style={{
                          color: pbi.text,
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        Data
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Data header */}
                      <div className="flex items-center justify-between px-2 py-2 shrink-0" style={{ borderBottom: `1px solid ${pbi.sidebarBorder}` }}>
                        <div className="flex items-center gap-1">
                          <ChevronLeft className="w-3 h-3" style={{ color: pbi.textMuted }} />
                          <span style={{ color: pbi.text }} className="font-semibold text-xs">Data</span>
                        </div>
                        <button
                          onClick={() => setDataPaneCollapsed(true)}
                          className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                          title="Collapse Data"
                        >
                          <ChevronRight className="w-3 h-3" style={{ color: pbi.textMuted }} />
                        </button>
                      </div>

                      {/* Search */}
                      <div className="px-2 py-2 shrink-0">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: pbi.textMuted }} />
                          <input
                            value={fieldSearch}
                            onChange={(e) => setFieldSearch(e.target.value)}
                            placeholder="Search"
                            style={{
                              backgroundColor: isDark ? '#2d2d2d' : '#f8f8f8',
                              borderColor: pbi.sidebarBorder,
                              color: pbi.text,
                              paddingLeft: '24px'
                            }}
                            className="w-full px-2 py-1 text-[10px] border rounded focus:ring-1 focus:ring-[#107c10] outline-none"
                          />
                        </div>
                      </div>

                      {/* Dataset List */}
                      <div className="flex-1 overflow-y-auto px-1">
                        {loadingDatasets ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#107c10' }} />
                          </div>
                        ) : datasets.length === 0 ? (
                          <p style={{ color: pbi.textMuted }} className="text-[10px] px-1 py-2">No data sources</p>
                        ) : (
                          <div className="space-y-0.5">
                            {datasets.map((dataset) => {
                              const isExpanded = selectedDatasets.has(dataset.id);
                              const datasetColumns = (columns[dataset.id] || []).filter((c) =>
                                fieldSearch.trim() ? c.name.toLowerCase().includes(fieldSearch.trim().toLowerCase()) : true
                              );
                              return (
                                <div key={dataset.id}>
                                  <div
                                    onClick={() => toggleDatasetSelection(dataset.id)}
                                    className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-white/5 cursor-pointer"
                                  >
                                    <ChevronRight
                                      className="w-2.5 h-2.5 shrink-0 transition-transform"
                                      style={{ color: pbi.textMuted, transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                                    />
                                    <TableIcon className="w-2.5 h-2.5 shrink-0" style={{ color: '#107c10' }} />
                                    <span style={{ color: pbi.text }} className="text-[10px] truncate">{dataset.name}</span>
                                  </div>
                                  {isExpanded && (
                                    <div className="ml-3 pl-1 border-l" style={{ borderColor: pbi.sidebarBorder }}>
                                      {loadingData[dataset.id] ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin my-1 ml-1" style={{ color: '#107c10' }} />
                                      ) : (
                                        (datasetColumns.length ? datasetColumns : columns[dataset.id] || []).map((col) => (
                                          <div
                                            key={col.name}
                                            draggable
                                            onDragStart={() => handleDragStart(dataset.id, col.name)}
                                            onDragEnd={handleDragEnd}
                                            className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-white/10 cursor-move"
                                          >
                                            <input type="checkbox" className="w-2.5 h-2.5 accent-[#107c10]" checked={false} readOnly />
                                            <span style={{ color: pbi.text }} className="text-[9px] truncate">{col.name}</span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>

        {/* Footer Bar - Power BI style page tabs */}
        <div
          style={{
            backgroundColor: isDark ? '#1e1e1e' : '#f3f3f3',
            borderTop: `1px solid ${pbi.sidebarBorder}`,
            height: 40,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
          }}
        >
          {/* Left - Layout mode + Page navigation */}
          <div className="flex items-center gap-1 h-full">
            <button
              onClick={() => setLayoutMode('desktop')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${layoutMode === 'desktop' ? 'bg-white/10' : 'hover:bg-white/5'}`}
              style={{ color: pbi.text }}
              title="Desktop layout"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('mobile')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${layoutMode === 'mobile' ? 'bg-white/10' : 'hover:bg-white/5'}`}
              style={{ color: pbi.text }}
              title="Mobile layout"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 mx-1" style={{ backgroundColor: pbi.sidebarBorder }} />

            {/* Page navigation arrows */}
            <button
              onClick={() => setCurrentPage((i) => Math.max(0, i - 1))}
              disabled={currentPage <= 0}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
              style={{ color: pbi.text }}
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((i) => Math.min(pages.length - 1, i + 1))}
              disabled={currentPage >= pages.length - 1}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
              style={{ color: pbi.text }}
              title="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Page Tabs - Power BI style */}
            <div className="flex items-end h-full ml-1">
              {pages.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setCurrentPage(i)}
                  className="relative flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-all group"
                  style={{
                    backgroundColor: i === currentPage ? (isDark ? '#252526' : '#ffffff') : 'transparent',
                    color: i === currentPage ? pbi.text : pbi.textMuted,
                    borderTop: i === currentPage ? '2px solid #107c10' : '2px solid transparent',
                    borderLeft: i === currentPage ? `1px solid ${pbi.sidebarBorder}` : '1px solid transparent',
                    borderRight: i === currentPage ? `1px solid ${pbi.sidebarBorder}` : '1px solid transparent',
                    borderBottom: 'none',
                    marginBottom: i === currentPage ? '-1px' : '0',
                    borderTopLeftRadius: '4px',
                    borderTopRightRadius: '4px',
                  }}
                >
                  {p.name}
                  {/* Close button for tabs */}
                  {pages.length > 1 && i === currentPage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newPages = pages.filter((_, idx) => idx !== i);
                        setPages(newPages);
                        setCurrentPage(Math.min(currentPage, newPages.length - 1));
                      }}
                      className="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 opacity-60 hover:opacity-100"
                      title="Close page"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>
              ))}
            </div>

            {/* Add page button */}
            <button
              onClick={() => {
                const newPage = { id: String(Date.now()), name: `Page ${pages.length + 1}` };
                setPages((prev) => [...prev, newPage]);
                setCurrentPage(pages.length);
              }}
              className="ml-1 p-1.5 rounded hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: '#107c10', color: '#fff' }}
              title="Add page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right - Zoom controls */}
          <div className="flex items-center gap-1">
            <span style={{ color: pbi.textMuted }} className="text-[10px] mr-1">
              {currentPage + 1} of {pages.length}
            </span>
            <div className="w-px h-4 mx-1" style={{ backgroundColor: pbi.sidebarBorder }} />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.15, z / 1.25))}
              className="p-1 hover:opacity-80 rounded"
              style={{ color: pbi.text }}
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-16 flex items-center">
              <input
                type="range"
                min="15"
                max="200"
                value={Math.round(zoom * 100)}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="w-full h-1 rounded cursor-pointer"
                style={{ accentColor: '#107c10' }}
                title="Zoom"
              />
            </div>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z * 1.25))}
              className="p-1 hover:opacity-80 rounded"
              style={{ color: pbi.text }}
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span style={{ color: pbi.textMuted }} className="text-[10px] tabular-nums ml-1 min-w-[2rem]">{Math.round(zoom * 100)}%</span>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer"
              style={{ color: pbi.text }}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Details Modal for New Dashboards */}
      <DashboardDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setPendingAction(null);
        }}
        onSave={handleDetailsSave}
        initialName={dashboardName}
        initialCategory={dashboardCategory}
        initialDescription={dashboardDescription}
        saving={saving}
      />

      {/* User Assignment Modal for Publishing */}
      <UserAssignmentModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublishConfirm}
        dashboardId={dashboardId}
        publishing={publishing}
        dashboardName={dashboardName}
      />

      {/* Power BI Visual Interaction Controls */}
      {showInteractionControls && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl h-[600px] rounded-lg shadow-xl overflow-hidden">
            <VisualInteractionControls
              widgets={widgets}
              selectedWidgetId={selectedWidget || undefined}
              onSetInteraction={setInteraction}
              onGetInteraction={getInteraction}
              onClose={() => setShowInteractionControls(false)}
              isDark={isDark}
              colors={colors}
            />
          </div>
        </div>
      )}

      {/* Power BI Drill Controls */}
      {showDrillControls && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl h-[600px] rounded-lg shadow-xl overflow-hidden">
            <DrillControls
              widgets={widgets}
              selectedWidgetId={selectedWidget || undefined}
              onDrillDown={handleDrillDown}
              onDrillUp={handleDrillUp}
              onResetDrill={handleResetDrill}
              onStartDrill={handleStartDrill}
              onClose={() => setShowDrillControls(false)}
              isDark={isDark}
              colors={colors}
            />
          </div>
        </div>
      )}
    </div>
  );
}