import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon, Save, Eye, ArrowLeft, Activity, Target, Gauge, Grid3x3, X, Plus, ChevronRight, ChevronDown, ChevronLeft, Layers, Hash, Filter as FilterIcon, GripVertical, Database, Loader2, CheckCircle, ZoomIn, ZoomOut, Maximize2, Settings, MousePointer2, Monitor, Smartphone, Search, Paintbrush, Calendar, Type } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
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

  // Legacy fields (for backward compatibility; first element when using *Fields arrays)
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

  // Multiple columns per bucket (all charts)
  xAxisFields?: string[];
  yAxisFields?: string[];
  legendFields?: string[];
  fieldFields?: string[];
  filterFields?: string[];

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
  slicerStyle?: 'dropdown' | 'tile' | 'list'; // Slicer display style

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

/** One report page with its own widgets (Power BI style) */
interface DashboardPage {
  id: string;
  name: string;
  widgets: Widget[];
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

/** Power BI–style sidebar: light gray background, white cards, thin borders, subtle shadows */
const PBI_SIDEBAR_STYLE = {
  panelBg: '#f5f5f5',
  cardBg: '#ffffff',
  border: '#e0e0e0',
  borderLight: '#eeeeee',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  text: '#323130',
  textMuted: '#605e5c',
  selectedBorder: '#0078d4',
  hoverBg: 'rgba(0,0,0,0.04)',
} as const;

/** Icon component for column data type: text (Type), number (Hash), date (Calendar) */
function ColumnTypeIcon({ type }: { type: string }) {
  const t = (type || '').toLowerCase();
  if (t.includes('varchar') || t.includes('char') || t === 'string' || t === 'text' || t.includes('nvarchar') || t.includes('clob')) return <Type className="w-3.5 h-3.5 shrink-0 text-slate-500" strokeWidth={2} />;
  if (t.includes('date') || t.includes('time') || t.includes('timestamp')) return <Calendar className="w-3.5 h-3.5 shrink-0 text-blue-600" strokeWidth={2} />;
  if (t.includes('int') || t.includes('number') || t.includes('decimal') || t.includes('float') || t.includes('numeric') || t.includes('double') || t.includes('real')) return <Hash className="w-3.5 h-3.5 shrink-0 text-amber-600" strokeWidth={2} />;
  return <Type className="w-3.5 h-3.5 shrink-0 text-slate-500" strokeWidth={2} />;
}

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count (All)' },
  { value: 'countDistinct', label: 'Count (Distinct)' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'first', label: 'First' },
  { value: 'last', label: 'Last' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'none', label: "Don't summarize" },
];

export default function DashboardBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user, token, registerBeforeLogout } = useAuth();
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
  const [rightTab, setRightTab] = useState<'visualizations' | 'fields' | 'format'>('visualizations');

  // Power BI layout (matches reference image)
  const [leftFiltersCollapsed, setLeftFiltersCollapsed] = useState(false);
  const [vizPaneCollapsed, setVizPaneCollapsed] = useState(false);
  const [dataPaneCollapsed, setDataPaneCollapsed] = useState(false); // Reference: Data panel visible by default
  const [fieldsSectionExpanded, setFieldsSectionExpanded] = useState(true);
  const [drillThroughSectionExpanded, setDrillThroughSectionExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const builderContainerRef = useRef<HTMLDivElement>(null);
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'mobile'>('desktop');
  const [keepAllFilters, setKeepAllFilters] = useState(true);
  const [drillThroughFields, setDrillThroughFields] = useState<string[]>([]);
  const [crossReport, setCrossReport] = useState(false);
  const [pages, setPages] = useState<DashboardPage[]>([{ id: '1', name: 'Page 1', widgets: [] }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [editingPageName, setEditingPageName] = useState('');
  const currentPageRef = useRef(0);
  currentPageRef.current = currentPage;

  // Derive current page's widgets so the canvas and save/load use the active page
  const widgets = pages[currentPage]?.widgets ?? [];
  const setWidgets = useCallback((updater: Widget[] | ((prev: Widget[]) => Widget[])) => {
    setPages((prevPages) => {
      const idx = currentPageRef.current;
      const page = prevPages[idx];
      if (!page) return prevPages;
      const next = [...prevPages];
      const currentWidgets = page.widgets ?? [];
      const nextWidgets = typeof updater === 'function' ? updater(currentWidgets) : updater;
      next[idx] = { ...page, widgets: nextWidgets };
      return next;
    });
  }, []);

  // Clear selected widget when switching pages so we don't show properties for another page's widget
  useEffect(() => {
    setSelectedWidget(null);
  }, [currentPage]);

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

  // Fit report frame to canvas on first layout so gray canvas is visible (no full-screen white)
  const hasFittedRef = useRef(false);
  useEffect(() => {
    if (hasFittedRef.current || viewportSize.w <= 0 || viewportSize.h <= 0) return;
    hasFittedRef.current = true;
    const fitZoom = Math.min((viewportSize.w - 40) / 1920, (viewportSize.h - 40) / 1080, 1);
    const zoomVal = Math.max(0.3, Math.min(1, fitZoom));
    setZoom(zoomVal);
    const offsetX = Math.max(20, (viewportSize.w - 1920 * zoomVal) / 2);
    const offsetY = Math.max(20, (viewportSize.h - 1080 * zoomVal) / 2);
    setPan({ x: offsetX, y: offsetY });
  }, [viewportSize.w, viewportSize.h]);

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
      // Only update if values actually changed to prevent infinite loops
      if (existing && JSON.stringify(existing.values?.sort() || []) !== JSON.stringify(values.sort())) {
        updateSlicerFilter(ruleId, { values });
      } else if (!existing && values.length > 0) {
        // Only add if there are values selected
        addSlicerFilter(rule);
      }
    });

    // Clean up removed filter widgets
    slicerFilters.forEach((f) => {
      if (f.id.startsWith('slicer-') && !validSlicerIds.has(f.id)) {
        removeSlicerFilter(f.id);
      }
    });
  }, [widgets]);  // Removed slicerFilters, addSlicerFilter, updateSlicerFilter, removeSlicerFilter from dependencies

  // Load existing dashboard if id is provided
  useEffect(() => {
    if (id) {
      const loadDashboard = async () => {
        try {
          const res = await apiGet<{
            id: number;
            name: string;
            description: string | null;
            config: string | {
              widgets?: Widget[];
              pages?: DashboardPage[];
              selectedDatasets?: number[];
              category?: string;
            };
          }>(`/api/dashboards/${id}`);
          if (res.success && res.data) {
            setDashboardId(res.data.id);
            setDashboardName(res.data.name || 'Untitled Dashboard');
            setDashboardDescription(res.data.description || '');
            const config = typeof res.data.config === 'string' ? JSON.parse(res.data.config) : res.data.config;
            if (config.pages && Array.isArray(config.pages) && config.pages.length > 0) {
              setPages(config.pages.map((p: { id: string; name: string; widgets?: Widget[] }) => ({
                id: p.id,
                name: p.name,
                widgets: Array.isArray(p.widgets) ? p.widgets : [],
              })));
              setCurrentPage(0);
            } else if (config.widgets && Array.isArray(config.widgets)) {
              setPages([{ id: '1', name: 'Page 1', widgets: config.widgets }]);
              setCurrentPage(0);
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
      const existing = widget?.xAxisFields ?? (widget?.xAxis ? [widget.xAxis] : []);
      if (!existing.includes(columnName)) {
        const next = [...existing, columnName];
        updates.xAxisFields = next;
        updates.xAxis = next[0];
      }
    } else if (target === 'yAxis') {
      const existing = widget?.yAxisFields ?? (widget?.yAxis || widget?.field ? [widget.yAxis || widget.field].filter(Boolean) as string[] : []);
      if (!existing.includes(columnName)) {
        const next = [...existing, columnName];
        updates.yAxisFields = next;
        updates.yAxis = next[0];
        updates.field = next[0];
      }
    } else if (target === 'legend') {
      const existing = widget?.legendFields ?? (widget?.legend ? [widget.legend] : []);
      if (!existing.includes(columnName)) {
        const next = [...existing, columnName];
        updates.legendFields = next;
        updates.legend = next[0];
      }
    } else if (target === 'field') {
      const existing = widget?.fieldFields ?? (widget?.field ? [widget.field] : []);
      if (!existing.includes(columnName)) {
        const next = [...existing, columnName];
        updates.fieldFields = next;
        updates.field = next[0];
      }
    } else if (target === 'filterField') {
      const existing = widget?.filterFields ?? (widget?.filterField ? [widget.filterField] : []);
      if (!existing.includes(columnName)) {
        const next = [...existing, columnName];
        updates.filterFields = next;
        updates.filterField = next[0];
        updates.selectedFilters = [];
      }
    }

    // Also link widget to the dataset
    updates.datasetId = draggedColumn.datasetId;

    updateWidget(widgetId, updates);
    setDraggedColumn(null);
  };

  type ArrayBucketKey = 'dimensions' | 'measures' | 'xAxisFields' | 'yAxisFields' | 'legendFields' | 'fieldFields' | 'filterFields';

  const handleRemoveFromArray = (widgetId: string, key: ArrayBucketKey, value: string) => {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;
    const arr = ((widget as any)[key] || []).filter((x: string) => x !== value);
    const updates: Partial<Widget> = { [key]: arr.length > 0 ? arr : undefined };
    if (key === 'xAxisFields') {
      updates.xAxis = arr[0];
    } else if (key === 'yAxisFields') {
      updates.yAxis = arr[0];
      updates.field = arr[0];
    } else if (key === 'legendFields') {
      updates.legend = arr[0];
    } else if (key === 'fieldFields') {
      updates.field = arr[0];
    } else if (key === 'filterFields') {
      updates.filterField = arr[0];
      if (arr.length === 0) updates.selectedFilters = [];
    }
    updateWidget(widgetId, updates);
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
        pages,
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

  // Autosave function - saves silently without alerts (for logout/page close)
  const autoSave = useCallback(async () => {
    // Only autosave if we have at least one page and a name
    if (pages.length === 0) return;
    if (!dashboardName.trim() || dashboardName === 'Untitled Dashboard') return;

    try {
      const config = {
        configVersion: 1,
        pages,
        selectedDatasets: Array.from(selectedDatasets),
        category: dashboardCategory || undefined,
      };

      if (dashboardId) {
        // Update existing dashboard
        await apiPut(`/api/dashboards/${dashboardId}`, {
          name: dashboardName.trim(),
          description: dashboardDescription.trim() || null,
          config: JSON.stringify(config),
        });
        console.log('Dashboard autosaved successfully');
      } else {
        // Create new dashboard (only if named)
        const res = await apiPost<{ id: number; name: string }>('/api/dashboards', {
          name: dashboardName.trim(),
          description: dashboardDescription.trim() || null,
          config: JSON.stringify(config),
        });
        if (res.success && res.data) {
          setDashboardId(res.data.id);
          console.log('Dashboard autosaved as new:', res.data.id);
        }
      }
    } catch (e) {
      console.error('Autosave error:', e);
    }
  }, [pages, dashboardName, dashboardDescription, dashboardCategory, dashboardId, selectedDatasets]);

  // Track if dashboard has unsaved changes
  const hasUnsavedChanges = useRef(false);
  useEffect(() => {
    // Mark as having unsaved changes when pages/widgets or metadata change
    if (pages.some((p) => p.widgets.length > 0)) {
      hasUnsavedChanges.current = true;
    }
  }, [pages, dashboardName, selectedDatasets]);

  // Autosave on beforeunload (page close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasWidgets = pages.some((p) => p.widgets.length > 0);
      if (hasUnsavedChanges.current && hasWidgets && dashboardName.trim() && dashboardName !== 'Untitled Dashboard') {
        // Trigger autosave using sendBeacon for reliability
        const config = {
          configVersion: 1,
          pages,
          selectedDatasets: Array.from(selectedDatasets),
          category: dashboardCategory || undefined,
        };

        const token = localStorage.getItem('token');
        const endpoint = dashboardId
          ? `/api/dashboards/${dashboardId}`
          : '/api/dashboards';

        // Use sendBeacon for reliable saving on page unload
        const data = JSON.stringify({
          name: dashboardName.trim(),
          description: dashboardDescription.trim() || null,
          config: JSON.stringify(config),
        });

        // Note: sendBeacon doesn't support PUT, so we use a flag
        const blob = new Blob([data], { type: 'application/json' });
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';

        // For existing dashboards, we'd need a custom endpoint, but for now log
        if (dashboardId) {
          navigator.sendBeacon(`${apiBase}${endpoint}?_method=PUT&token=${token}`, blob);
        } else {
          navigator.sendBeacon(`${apiBase}${endpoint}?token=${token}`, blob);
        }

        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pages, dashboardName, dashboardDescription, dashboardCategory, dashboardId, selectedDatasets]);

  // Autosave when user token changes (logout detection)
  const prevTokenRef = useRef(token);
  useEffect(() => {
    // Detect logout: token was present but now null
    if (prevTokenRef.current && !token) {
      console.log('Logout detected - autosaving dashboard...');
      autoSave();
    }
    prevTokenRef.current = token;
  }, [token, autoSave]);

  // Periodic autosave every 60 seconds if there are unsaved changes
  const hasAnyWidgets = pages.some((p) => p.widgets.length > 0);
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges.current && hasAnyWidgets && dashboardName.trim() && dashboardName !== 'Untitled Dashboard') {
        autoSave().then(() => {
          hasUnsavedChanges.current = false;
        });
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoSave, hasAnyWidgets, dashboardName]);

  // Register autosave callback with auth context (for logout)
  useEffect(() => {
    const unregister = registerBeforeLogout(async () => {
      if (hasAnyWidgets && dashboardName.trim() && dashboardName !== 'Untitled Dashboard') {
        console.log('Autosaving dashboard before logout...');
        await autoSave();
      }
    });
    return unregister;
  }, [registerBeforeLogout, autoSave, hasAnyWidgets, dashboardName]);

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
        pages,
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
      // Use smaller default sizes to fit in fixed canvas
      const size = {
        width: type === 'filter' ? 200 : type === 'card' ? 220 : 350,
        height: type === 'filter' ? 180 : type === 'card' ? 150 : 280
      };
      const position = findNextFreePosition(size);

      // Ensure widget is placed within canvas bounds
      const clampedPosition = {
        x: Math.max(0, Math.min(position.x, FRAME_WIDTH - size.width)),
        y: Math.max(FRAME_HEADER_HEIGHT, Math.min(position.y, FRAME_HEIGHT - size.height))
      };

      const newWidget: Widget = {
        id: Date.now().toString(),
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        position: clampedPosition,
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
      setRightTab('visualizations');
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
  const COLORS = ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#00B7C3', '#744EC2', '#D64550', '#7FBA00', '#FFB900', '#4C78A8', '#E91E63', '#009688', '#FF5722', '#673AB7', '#3F51B5', '#8BC34A', '#FF9800', '#795548', '#607D8B', '#9C27B0'];
  const GRID_SIZE = 10;
  const CANVAS_PADDING = 24;
  // Power BI–style bounded frame: charts only inside this area
  // Canvas size - FIXED dimensions (like Power BI report page)
  const FRAME_WIDTH = 1920; // Fixed width (Full HD canvas)
  const FRAME_HEIGHT = 1080; // Fixed height (16:9 aspect ratio)
  const STAGE_WIDTH = FRAME_WIDTH;
  const STAGE_HEIGHT = FRAME_HEIGHT;
  const FRAME_HEADER_HEIGHT = 48; // Title bar height

  const fitToView = useCallback(() => {
    const fitZoom = Math.min((viewportSize.w - 40) / FRAME_WIDTH, (viewportSize.h - 40) / FRAME_HEIGHT, 1);
    setZoom(Math.max(0.3, Math.min(1, fitZoom)));
    const offsetX = Math.max(20, (viewportSize.w - FRAME_WIDTH * fitZoom) / 2);
    const offsetY = Math.max(20, (viewportSize.h - FRAME_HEIGHT * fitZoom) / 2);
    setPan({ x: offsetX, y: offsetY });
  }, [viewportSize.w, viewportSize.h]);

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
   * so visuals never overlap. If the canvas is full, stack at the bottom within bounds.
   */
  const findNextFreePosition = useCallback(
    (newSize: { width: number; height: number }) => {
      const chartTop = FRAME_HEADER_HEIGHT + CANVAS_PADDING;
      const usableWidth = FRAME_WIDTH - CANVAS_PADDING * 2;
      const usableHeight = FRAME_HEIGHT - FRAME_HEADER_HEIGHT - CANVAS_PADDING * 2;
      const step = GRID_SIZE;
      const pad = 12;

      // Ensure widget fits within canvas - clamp size if needed
      const clampedWidth = Math.min(newSize.width, usableWidth);
      const clampedHeight = Math.min(newSize.height, usableHeight);

      const maxX = CANVAS_PADDING + usableWidth - clampedWidth;
      const maxY = FRAME_HEADER_HEIGHT + CANVAS_PADDING + usableHeight - clampedHeight;

      const existing = widgets.map((it) => ({
        x: it.position.x - pad,
        y: it.position.y - pad,
        w: it.size.width + pad * 2,
        h: it.size.height + pad * 2,
      }));

      // Search for free position within canvas bounds
      for (let y = chartTop; y <= maxY; y += step) {
        for (let x = CANVAS_PADDING; x <= maxX; x += step) {
          const candidate = { x, y, w: clampedWidth, h: clampedHeight };
          const overlaps = existing.some((r) => rectsOverlap(candidate, r));
          if (!overlaps) return { x: snapToGrid(x), y: snapToGrid(y) };
        }
      }

      // If no free spot found, place at first available position (may overlap)
      return { x: CANVAS_PADDING, y: chartTop };
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
      xAxis: currentXAxis ?? widget.xAxisFields?.[0],
      yAxis: widget.yAxis ?? widget.yAxisFields?.[0],
      legend: widget.legend ?? widget.legendFields?.[0],
      filterField: widget.filterField ?? widget.filterFields?.[0],
      selectedFilters: widget.selectedFilters,
      datasetId: widget.datasetId,
      accentColor: widget.accentColor,
      slicerStyle: widget.slicerStyle,
      dimensions: widget.dimensions,
      measures: widget.measures,
      xAxisFields: widget.xAxisFields,
      yAxisFields: widget.yAxisFields,
      legendFields: widget.legendFields,
      valueFormat: widget.valueFormat,
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
          // Update widget - the sync effect will handle updating slicerFilters
          updateWidget(widget.id, { selectedFilters: newFilters });
        }
        : undefined;
    const onDataPointClick =
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

  const arrayKeyForBucket = (bucket: FieldBucket): ArrayBucketKey | null =>
    bucket === 'xAxis' ? 'xAxisFields' : bucket === 'yAxis' ? 'yAxisFields' : bucket === 'legend' ? 'legendFields' : bucket === 'field' ? 'fieldFields' : bucket === 'filterField' ? 'filterFields' : bucket === 'dimensions' ? 'dimensions' : bucket === 'measures' ? 'measures' : null;

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
    bucket: FieldBucket;
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
    <div ref={builderContainerRef} style={{ backgroundColor: pbi.canvas, height: '100vh', width: '100%', overflow: 'hidden' }} className="flex flex-col">
      {/* Top Ribbon – title left; menu bar fixed on the right */}
      <div style={{ backgroundColor: pbi.ribbon, borderBottom: `1px solid ${pbi.ribbonBorder}`, width: '100%' }} className="flex items-center justify-between px-4 py-2.5 shrink-0">
        {/* Left: Back + title + hint */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/developer/dashboard')}
            style={{ color: pbi.text }}
            className="p-2 rounded-lg hover:bg-white/15 transition-colors flex items-center justify-center shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.25} />
          </button>
          <div className="min-w-0">
            <h1 style={{ color: pbi.text }} className="text-base font-semibold truncate">Dashboard Builder</h1>
            <p style={{ color: pbi.textMuted }} className="text-[11px] truncate">
              {selectedWidget ? 'Selected: change type in Build or click canvas to deselect' : "Scroll to zoom • Drag to pan • Fit View to find widgets"}
            </p>
          </div>
        </div>

        {/* Right: Menu bar – all actions grouped and attached to the right */}
        <div
          className="flex items-center gap-2 shrink-0"
          style={{
            borderLeft: `1px solid ${pbi.ribbonBorder}`,
            paddingLeft: 12,
            marginLeft: 8,
          }}
        >
          {crossFilters.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded" style={{ backgroundColor: 'rgba(0,120,212,0.12)' }}>
              <FilterIcon className="w-4 h-4 shrink-0" style={{ color: pbi.accent }} strokeWidth={2} />
              <span className="text-[11px] font-medium" style={{ color: pbi.accent }}>{crossFilters.length} filter{crossFilters.length > 1 ? 's' : ''}</span>
              <button onClick={clearAllCrossFilters} className="p-0.5 hover:bg-white/20 rounded" title="Clear all"><X className="w-3.5 h-3.5" style={{ color: pbi.accent }} strokeWidth={2.5} /></button>
            </div>
          )}
          <button onClick={() => setShowInteractionControls(true)} style={{ color: pbi.text }} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-white/15 text-[12px] transition-colors shrink-0" title="Configure visual interactions">
            <MousePointer2 className="w-4 h-4 shrink-0" strokeWidth={2} />
            Interactions
          </button>
          <button onClick={() => setShowDrillControls(true)} style={{ color: pbi.text }} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-white/15 text-[12px] transition-colors shrink-0" title="Configure drill-down">
            <Layers className="w-4 h-4 shrink-0" strokeWidth={2} />
            Drill
          </button>
          <button onClick={fitToView} style={{ color: pbi.text, backgroundColor: 'rgba(16,124,16,0.12)' }} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:opacity-90 text-[12px] transition-colors shrink-0" title="Fit canvas (Ctrl+0)">
            <Maximize2 className="w-4 h-4 shrink-0" strokeWidth={2} />
            Fit View
          </button>
          <input
            type="text"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            placeholder="Report name"
            style={{ backgroundColor: pbi.bucketBg, borderColor: pbi.bucketBorder, color: pbi.text, width: 140 }}
            className="px-2.5 py-1.5 text-[12px] border rounded focus:ring-1 focus:ring-[#0078d4] outline-none shrink-0"
          />
          <button onClick={() => navigate(`/developer/preview/${dashboardId || 'new'}`)} style={{ color: pbi.text }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/15 text-[12px] transition-colors shrink-0">
            <Eye className="w-4 h-4 shrink-0" strokeWidth={2} />
            Preview
          </button>
          <button onClick={handleSaveClick} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] transition-colors shrink-0 disabled:opacity-50" style={{ backgroundColor: '#5b21b6', color: '#fff' }}>
            {saving ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" strokeWidth={2} /> : <Save className="w-4 h-4 shrink-0" strokeWidth={2} />}
            Save
          </button>
          <button onClick={handlePublishClick} disabled={publishing} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] transition-colors shrink-0 disabled:opacity-50" style={{ backgroundColor: '#107c10', color: '#fff' }}>
            {publishing ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" strokeWidth={2} /> : <CheckCircle className="w-4 h-4 shrink-0" strokeWidth={2} />}
            Publish
          </button>
        </div>
      </div>

      {/* Main Builder Area – full width so right sidebar attaches to viewport right */}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', overflow: 'hidden', width: '100%' }}>
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
              className="p-2.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer flex items-center justify-center"
              title={leftFiltersCollapsed ? 'Expand Filters' : 'Collapse Filters'}
            >
              {leftFiltersCollapsed ? (
                <ChevronRight className="w-5 h-5" style={{ color: pbi.textMuted }} strokeWidth={2.25} />
              ) : (
                <ChevronLeft className="w-5 h-5" style={{ color: pbi.textMuted }} strokeWidth={2.25} />
              )}
            </button>
            {!leftFiltersCollapsed && (
              <>
                <div
                  className="flex flex-col items-center mt-4"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(-180deg)' }}
                >
                  <FilterIcon className="w-5 h-5 mb-2 shrink-0" style={{ color: pbi.textMuted }} strokeWidth={2} />
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

          <PanelGroup direction="horizontal" className="flex-1 min-w-0 h-full w-full" style={{ minWidth: 0 }}>

            {/* Main Canvas - zoom, pan, stage for building the report */}
            <Panel defaultSize={60} minSize={40} className="dashboard-builder-canvas-panel" style={{ position: 'relative', backgroundColor: pbi.canvas, width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
              {/* Full-bleed canvas background so no white ever shows through */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: pbi.canvas,
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
              <div
                ref={canvasRef}
                className="h-full w-full overflow-hidden relative"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: pbi.canvas,
                  width: '100%',
                  minHeight: '100%',
                  pointerEvents: (showPublishModal || showDetailsModal) ? 'none' : 'auto',
                  opacity: (showPublishModal || showDetailsModal) ? 0.3 : 1,
                  cursor: isPanning ? 'grabbing' : 'grab',
                }}
                onMouseDown={(e) => {
                  // Start panning when clicking on the canvas background (not on widgets)
                  if (showPublishModal || showDetailsModal) return;
                  // Only start pan if clicking directly on canvas or the stage background
                  const target = e.target as HTMLElement;
                  const isCanvasOrBackground = target === canvasRef.current ||
                    target.getAttribute('data-canvas-bg') === 'true' ||
                    target.classList.contains('canvas-pan-area');
                  if (isCanvasOrBackground) {
                    e.preventDefault();
                    hasPannedRef.current = false;
                    panStartRef.current = { x: e.clientX, y: e.clientY, offX: pan.x, offY: pan.y };
                    setIsPanning(true);
                  }
                }}
              >
                {/* Canvas background - pannable area; no solid fill so canvas color shows through */}
                <div
                  data-canvas-bg="true"
                  className="absolute inset-0 canvas-pan-area"
                  style={{
                    backgroundColor: 'transparent',
                    backgroundImage: isDark
                      ? 'radial-gradient(rgba(100, 100, 100, 0.15) 1px, transparent 1px)'
                      : 'radial-gradient(rgba(150, 150, 150, 0.2) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />

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
                  {/* Bounded frame: charts only inside this area - FIXED SIZE */}
                  <div
                    className="absolute inset-0 rounded-lg overflow-hidden"
                    style={{
                      border: `2px solid ${isDark ? '#3c3c3c' : '#d1d5db'}`,
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {/* Frame header: dashboard title */}
                    <div
                      className="flex items-center justify-between px-4 shrink-0"
                      style={{
                        height: FRAME_HEADER_HEIGHT,
                        borderBottom: `1px solid #e5e5e5`,
                        backgroundColor: '#f8f9fa',
                      }}
                    >
                      <h2
                        className="text-sm font-semibold truncate"
                        style={{ color: '#323130' }}
                      >
                        {dashboardName || 'Untitled Report'}
                      </h2>
                      <span className="text-xs text-gray-400">
                        {FRAME_WIDTH} × {FRAME_HEIGHT - FRAME_HEADER_HEIGHT}px
                      </span>
                    </div>
                    {/* Chart placement area */}
                    <div
                      className="absolute left-0 right-0 bottom-0"
                      style={{ top: FRAME_HEADER_HEIGHT }}
                    >
                      {/* Background: dotted pattern, drag to pan */}
                      <div
                        role="presentation"
                        data-canvas-bg="true"
                        className="absolute inset-0 canvas-pan-area"
                        style={{
                          backgroundImage: isDark
                            ? 'radial-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px)'
                            : 'radial-gradient(rgba(107, 114, 128, 0.18) 1px, transparent 1px)',
                          backgroundSize: '18px 18px',
                          cursor: isPanning ? 'grabbing' : 'grab',
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
                                    // Calculate new dimensions
                                    let newWidth = snapToGrid(widget.size.width + d.width);
                                    let newHeight = snapToGrid(widget.size.height + d.height);
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

                                    // Enforce canvas bounds
                                    const minX = 0;
                                    const minY = FRAME_HEADER_HEIGHT;
                                    const maxWidth = FRAME_WIDTH - newX;
                                    const maxHeight = FRAME_HEIGHT - newY;

                                    // Clamp position to stay within canvas
                                    newX = Math.max(minX, Math.min(newX, FRAME_WIDTH - 150));
                                    newY = Math.max(minY, Math.min(newY, FRAME_HEIGHT - 120));

                                    // Clamp size to stay within canvas from current position
                                    newWidth = Math.max(150, Math.min(newWidth, FRAME_WIDTH - newX));
                                    newHeight = Math.max(120, Math.min(newHeight, FRAME_HEIGHT - newY));

                                    // Update size
                                    updateWidgetSize(widget.id, {
                                      width: newWidth,
                                      height: newHeight
                                    });

                                    // Update position if it changed
                                    if (newX !== widget.position.x || newY !== widget.position.y) {
                                      updateWidgetPosition(widget.id, newX, newY);
                                    }
                                  }}
                                  minWidth={150}
                                  minHeight={120}
                                  maxWidth={FRAME_WIDTH - widget.position.x}
                                  maxHeight={FRAME_HEIGHT - widget.position.y}
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
                                      <div className="flex items-center min-w-0">
                                        <GripVertical className="w-5 h-5 mr-2 shrink-0" style={{ color: pbi.textMuted }} strokeWidth={2.25} />
                                        <h4 style={{ color: pbi.text }} className="font-semibold text-sm truncate">{widget.title}</h4>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeWidget(widget.id);
                                        }}
                                        className="p-1.5 rounded hover:bg-white/15 transition-colors"
                                        style={{ color: pbi.textMuted }}
                                        title="Remove visual"
                                      >
                                        <X className="w-5 h-5" strokeWidth={2.5} />
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

            {/* Right Sidebar - Power BI style: fixed 300px + 300px, attached to viewport right */}
            <Panel defaultSize={40} minSize={30} maxSize={60} order={2} style={{ backgroundColor: 'transparent', overflow: 'visible', flex: 'none', }}>
              <div className="h-full w-full" style={{ textAlign: 'right' }}>
                <div className="h-full inline-flex" style={{ backgroundColor: PBI_SIDEBAR_STYLE.panelBg, borderLeft: `1px solid ${PBI_SIDEBAR_STYLE.border}` }}>

                  {/* LEFT PANEL – Visualizations (fixed 300px) */}
                  <div
                    className="flex flex-col overflow-hidden shrink-0"
                    style={{
                      width: vizPaneCollapsed ? 28 : 300,
                      minWidth: vizPaneCollapsed ? 28 : 300,
                      borderRight: `1px solid ${PBI_SIDEBAR_STYLE.border}`,
                      transition: 'width 0.2s ease',
                      boxShadow: PBI_SIDEBAR_STYLE.shadow,
                    }}
                  >
                    {vizPaneCollapsed ? (
                      <div
                        onClick={() => setVizPaneCollapsed(false)}
                        className="h-full flex flex-col items-center justify-start py-2 cursor-pointer rounded-r transition-colors"
                        style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, color: PBI_SIDEBAR_STYLE.text }}
                      >
                        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 11, fontWeight: 600 }}>Visualizations</span>
                        <span className="flex flex-col gap-0.5 mt-2" style={{ color: PBI_SIDEBAR_STYLE.textMuted }}>
                          <ChevronRight className="w-3 h-3" strokeWidth={2} />
                          <ChevronRight className="w-3 h-3 -mt-2" strokeWidth={2} />
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Header: Title + >> */}
                        <div className="flex items-center justify-between px-3 py-2.5 shrink-0" style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, borderBottom: `1px solid ${PBI_SIDEBAR_STYLE.border}` }}>
                          <span style={{ color: PBI_SIDEBAR_STYLE.text }} className="font-semibold text-sm">Visualizations</span>
                          <button type="button" onClick={() => setVizPaneCollapsed(true)} className="p-1.5 rounded transition-colors cursor-pointer hover:bg-black/5 flex items-center gap-0.5" title="Collapse">
                            <ChevronRight className="w-4 h-4" style={{ color: PBI_SIDEBAR_STYLE.textMuted }} strokeWidth={2} />
                            <ChevronRight className="w-4 h-4 -ml-1.5" style={{ color: PBI_SIDEBAR_STYLE.textMuted }} strokeWidth={2} />
                          </button>
                        </div>

                        {/* Tabs: Build Visual (active) | Format Visual */}
                        <div className="flex items-center gap-1 px-3 py-2 shrink-0" style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, borderBottom: `1px solid ${PBI_SIDEBAR_STYLE.borderLight}` }}>
                          <button
                            type="button"
                            onClick={() => setRightTab('visualizations')}
                            className="px-3 py-2 text-xs font-medium rounded transition-all cursor-pointer relative"
                            style={{
                              color: rightTab === 'visualizations' ? PBI_SIDEBAR_STYLE.selectedBorder : PBI_SIDEBAR_STYLE.textMuted,
                              backgroundColor: rightTab === 'visualizations' ? 'rgba(0,120,212,0.08)' : 'transparent',
                            }}
                            title="Build Visual"
                          >
                            Build Visual
                            {rightTab === 'visualizations' && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: PBI_SIDEBAR_STYLE.selectedBorder }} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRightTab('format')}
                            className="px-3 py-2 text-xs font-medium rounded transition-all cursor-pointer relative"
                            style={{
                              color: rightTab === 'format' ? PBI_SIDEBAR_STYLE.selectedBorder : PBI_SIDEBAR_STYLE.textMuted,
                              backgroundColor: rightTab === 'format' ? 'rgba(0,120,212,0.08)' : 'transparent',
                            }}
                            title="Format Visual"
                          >
                            Format Visual
                            {rightTab === 'format' && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: PBI_SIDEBAR_STYLE.selectedBorder }} />}
                          </button>
                        </div>

                        {/* Scrollable content area */}
                        <div ref={rightPanelScrollRef} className="flex-1 overflow-y-auto min-h-0">
                          {rightTab === 'visualizations' && (
                            <>
                              {/* Add New Visual Button - Power BI style (only when widget selected) */}
                              {selectedWidget && (
                                <div className="px-3 pt-2">
                                  <button
                                    onClick={() => setSelectedWidget(null)}
                                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors hover:opacity-90 cursor-pointer border-2 border-transparent hover:border-white/30"
                                    style={{
                                      backgroundColor: '#107c10',
                                      color: '#fff',
                                    }}
                                  >
                                    <Plus className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                                    Add New Visual
                                  </button>
                                </div>
                              )}

                              {/* Section 1: Visual Icons Grid – 4 columns, hover highlight, selected = blue border */}
                              <div className="px-3 pt-3 pb-2" style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, borderBottom: `1px solid ${PBI_SIDEBAR_STYLE.borderLight}`, boxShadow: PBI_SIDEBAR_STYLE.shadow }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                  {VIZ_PANEL_TYPES.slice(0, 40).map((viz) => (
                                    <button
                                      key={viz.type}
                                      type="button"
                                      onClick={() => {
                                        if (selectedWidget) updateWidget(selectedWidget, { type: viz.type as Widget['type'], title: `${viz.label} Chart` });
                                        else addWidget(viz.type as Widget['type']);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 8,
                                        borderRadius: 6,
                                        aspectRatio: '1',
                                        backgroundColor: selectedWidgetData?.type === viz.type ? 'rgba(0,120,212,0.1)' : 'transparent',
                                        border: selectedWidgetData?.type === viz.type ? `2px solid ${PBI_SIDEBAR_STYLE.selectedBorder}` : `1px solid ${PBI_SIDEBAR_STYLE.border}`,
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                                      }}
                                      onMouseEnter={(e) => {
                                        if (selectedWidgetData?.type !== viz.type) {
                                          e.currentTarget.style.backgroundColor = PBI_SIDEBAR_STYLE.hoverBg;
                                          e.currentTarget.style.boxShadow = PBI_SIDEBAR_STYLE.shadow;
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (selectedWidgetData?.type !== viz.type) {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.boxShadow = 'none';
                                        }
                                      }}
                                      title={selectedWidget ? `Change to ${viz.label}` : `Add ${viz.label}`}
                                    >
                                      <viz.icon className="shrink-0" style={{ width: 20, height: 20, color: viz.color }} strokeWidth={2} />
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: `1px solid ${PBI_SIDEBAR_STYLE.borderLight}` }}>
                                  <span style={{ color: PBI_SIDEBAR_STYLE.textMuted }} className="text-[11px]">Get more visuals</span>
                                  <button type="button" className="p-1 rounded transition-colors cursor-pointer hover:bg-black/5" style={{ color: PBI_SIDEBAR_STYLE.textMuted }} title="More visuals">
                                    <span className="text-xs font-bold" style={{ letterSpacing: '1px' }}>•••</span>
                                  </button>
                                </div>
                              </div>

                              {/* Section 2: Values Bucket – always visible, large dashed drop zone */}
                              <div className="px-3 pt-3 pb-2" style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, borderBottom: `1px solid ${PBI_SIDEBAR_STYLE.borderLight}`, boxShadow: PBI_SIDEBAR_STYLE.shadow }}>
                                <div style={{ color: PBI_SIDEBAR_STYLE.text }} className="text-xs font-semibold mb-2">Values</div>
                                <div
                                  onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = PBI_SIDEBAR_STYLE.selectedBorder; }}
                                  onDragLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = PBI_SIDEBAR_STYLE.border; }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    (e.currentTarget as HTMLElement).style.borderColor = PBI_SIDEBAR_STYLE.border;
                                    if (!draggedColumn) return;
                                    if (selectedWidgetData) {
                                      const w = selectedWidgetData;
                                      if (!w.datasetId) updateWidget(w.id, { datasetId: draggedColumn.datasetId });
                                      const bucket = (w.type === 'gauge' || w.type === 'card') ? 'field' : 'yAxis';
                                      handleDrop(bucket, w.id);
                                    }
                                    setDraggedColumn(null);
                                  }}
                                  style={{
                                    backgroundColor: PBI_SIDEBAR_STYLE.cardBg,
                                    border: `2px dashed ${PBI_SIDEBAR_STYLE.border}`,
                                    borderRadius: 6,
                                    color: PBI_SIDEBAR_STYLE.textMuted,
                                    minHeight: 56,
                                    boxShadow: PBI_SIDEBAR_STYLE.shadow,
                                    transition: 'border-color 0.15s ease',
                                  }}
                                  className="flex items-center justify-center px-3 py-3 text-sm"
                                >
                                  Add data fields here
                                </div>
                                {/* Assigned values as pills (only when a visual is selected) */}
                                {selectedWidgetData && (() => {
                                  const vals = selectedWidgetData.yAxisFields ?? [selectedWidgetData.yAxis, selectedWidgetData.field].filter(Boolean) as string[];
                                  return vals.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {vals.map((f) => (
                                        <span key={f} style={{ backgroundColor: PBI_SIDEBAR_STYLE.hoverBg, border: `1px solid ${PBI_SIDEBAR_STYLE.border}`, color: PBI_SIDEBAR_STYLE.text }} className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                          {f}
                                          <button type="button" onClick={() => handleRemoveFromArray(selectedWidgetData!.id, (selectedWidgetData!.type === 'gauge' || selectedWidgetData!.type === 'card') ? arrayKeyForBucket('field')! : arrayKeyForBucket('yAxis')!, f)} className="opacity-60 hover:opacity-100 transition-opacity">×</button>
                                        </span>
                                      ))}
                                    </div>
                                  ) : null;
                                })()}
                              </div>

                              {/* Section 3: Drill-through – toggles + drop zone (always visible) */}
                              <div className="px-3 pt-3 pb-3" style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, borderBottom: `1px solid ${PBI_SIDEBAR_STYLE.borderLight}`, boxShadow: PBI_SIDEBAR_STYLE.shadow }}>
                                <div style={{ color: PBI_SIDEBAR_STYLE.text }} className="text-xs font-semibold mb-2">Drill through</div>
                                <div className="space-y-2 text-[11px] mb-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span style={{ color: PBI_SIDEBAR_STYLE.text }}>Cross-report</span>
                                    <button type="button" onClick={() => setCrossReport(!crossReport)} className="relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0" style={{ backgroundColor: crossReport ? PBI_SIDEBAR_STYLE.selectedBorder : PBI_SIDEBAR_STYLE.border }}>
                                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: crossReport ? '22px' : '2px' }} />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span style={{ color: PBI_SIDEBAR_STYLE.text }}>Keep all filters</span>
                                    <button type="button" onClick={() => setKeepAllFilters(!keepAllFilters)} className="relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0" style={{ backgroundColor: keepAllFilters ? PBI_SIDEBAR_STYLE.selectedBorder : PBI_SIDEBAR_STYLE.border }}>
                                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: keepAllFilters ? '22px' : '2px' }} />
                                    </button>
                                  </div>
                                </div>
                                <div
                                  onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = PBI_SIDEBAR_STYLE.selectedBorder; }}
                                  onDragLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = PBI_SIDEBAR_STYLE.border; }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    (e.currentTarget as HTMLElement).style.borderColor = PBI_SIDEBAR_STYLE.border;
                                    if (draggedColumn) { setDrillThroughFields([...drillThroughFields, draggedColumn.columnName]); setDraggedColumn(null); }
                                  }}
                                  style={{
                                    backgroundColor: PBI_SIDEBAR_STYLE.cardBg,
                                    border: `2px dashed ${PBI_SIDEBAR_STYLE.border}`,
                                    borderRadius: 6,
                                    color: PBI_SIDEBAR_STYLE.textMuted,
                                    minHeight: 40,
                                    boxShadow: PBI_SIDEBAR_STYLE.shadow,
                                    transition: 'border-color 0.15s ease',
                                  }}
                                  className="flex items-center justify-center px-3 py-2 text-sm"
                                >
                                  {drillThroughFields.length > 0 ? drillThroughFields.join(', ') : 'Add drill-through fields here'}
                                </div>
                              </div>

                              {/* Buckets section - no dataset dropdown in visualization panel */}
                              {selectedWidgetData && (
                                <div className="px-2 pb-2" style={{ borderTop: `1px solid ${pbi.sidebarBorder}` }}>
                                  <div className="space-y-3 pt-2 pb-2">
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
                                        <div className="rounded px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2', color: '#dc2626' }}>
                                          {errs.map((e, i) => (
                                            <p key={i}>{e}</p>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                    {/* Buckets - driven by CHART_FIELD_CONFIG */}
                                    {selectedWidgetData.type === 'decomposition-tree' ? (
                                      <>
                                        <MultiFieldDropZone label="Analyze" values={selectedWidgetData.measures?.length ? (selectedWidgetData.measures || []) : (selectedWidgetData.xAxis ? [selectedWidgetData.xAxis] : [])} bucket="measures" widgetId={selectedWidgetData.id} hint="Drag measure(s) here (numeric)" onRemove={(v) => { if (selectedWidgetData.xAxis === v) updateWidget(selectedWidgetData.id, { xAxis: undefined }); else handleRemoveFromArray(selectedWidgetData.id, 'measures', v); }} />
                                        <MultiFieldDropZone label="Explain by" values={[...(selectedWidgetData.yAxis ? [selectedWidgetData.yAxis] : []), ...(selectedWidgetData.legend ? [selectedWidgetData.legend] : []), ...(selectedWidgetData.dimensions || [])].filter((x, i, a) => a.indexOf(x) === i)} bucket="dimensions" widgetId={selectedWidgetData.id} hint="Drag dimension(s) to drill by" onRemove={(v) => { if (selectedWidgetData.yAxis === v) updateWidget(selectedWidgetData.id, { yAxis: undefined }); else if (selectedWidgetData.legend === v) updateWidget(selectedWidgetData.id, { legend: undefined }); else handleRemoveFromArray(selectedWidgetData.id, 'dimensions', v); }} />
                                      </>
                                    ) : (() => {
                                      const fieldConfig = CHART_FIELD_CONFIG[selectedWidgetData.type] ?? { showAxis: true, showValues: true, showLegend: true, axis: 'X-axis', values: 'Values', legend: 'Legend' };
                                      const isGauge = selectedWidgetData.type === 'gauge';
                                      const isFilter = selectedWidgetData.type === 'filter';
                                      const axisVals = selectedWidgetData.xAxisFields ?? (selectedWidgetData.xAxis ? [selectedWidgetData.xAxis] : []);
                                      const valueVals = selectedWidgetData.yAxisFields ?? [selectedWidgetData.yAxis, selectedWidgetData.field].filter(Boolean) as string[];
                                      const legendVals = selectedWidgetData.legendFields ?? (selectedWidgetData.legend ? [selectedWidgetData.legend] : []);
                                      const fieldVals = selectedWidgetData.fieldFields ?? (selectedWidgetData.field ? [selectedWidgetData.field] : []);
                                      const filterVals = selectedWidgetData.filterFields ?? (selectedWidgetData.filterField ? [selectedWidgetData.filterField] : []);
                                      return (
                                        <>
                                          {fieldConfig.showAxis && <MultiFieldDropZone label={fieldConfig.axis ?? 'X-axis'} values={axisVals} bucket="xAxis" widgetId={selectedWidgetData.id} hint={selectedWidgetData.type === 'key-influencers' ? 'Drag measure(s) here' : selectedWidgetData.type === 'matrix' ? 'Drag field(s) for rows' : 'Drag category or axis field(s) here'} onRemove={(v) => handleRemoveFromArray(selectedWidgetData.id, arrayKeyForBucket('xAxis')!, v)} />}
                                          {fieldConfig.showValues && <MultiFieldDropZone label={fieldConfig.values ?? 'Values'} values={isGauge ? fieldVals : valueVals} bucket={isGauge ? 'field' : 'yAxis'} widgetId={selectedWidgetData.id} hint={isGauge ? 'Drag value field(s) here' : selectedWidgetData.type === 'table' ? 'Drag column(s) here' : selectedWidgetData.type === 'matrix' ? 'Drag field(s) for columns' : 'Drag numeric field(s) here'} onRemove={(v) => handleRemoveFromArray(selectedWidgetData.id, (isGauge ? arrayKeyForBucket('field') : arrayKeyForBucket('yAxis'))!, v)} />}
                                          {fieldConfig.showLegend && <MultiFieldDropZone label={fieldConfig.legend ?? 'Legend'} values={legendVals} bucket="legend" widgetId={selectedWidgetData.id} hint={isGauge ? 'Optional: target value(s)' : selectedWidgetData.type === 'matrix' ? 'Drag value field(s) here' : 'Optional: drag category field(s) here'} onRemove={(v) => handleRemoveFromArray(selectedWidgetData.id, arrayKeyForBucket('legend')!, v)} />}
                                          {fieldConfig.showField && <MultiFieldDropZone label={fieldConfig.fieldLabel ?? 'Field'} values={isFilter ? filterVals : fieldVals} bucket={isFilter ? 'filterField' : 'field'} widgetId={selectedWidgetData.id} hint={isFilter ? 'Drag field(s) to filter other visuals' : 'Drag field(s) for KPI'} onRemove={(v) => handleRemoveFromArray(selectedWidgetData.id, (isFilter ? arrayKeyForBucket('filterField') : arrayKeyForBucket('field'))!, v)} />}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

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
                                  {/* Field assignment is only in Build visual tab (common panel) - no duplicate here */}
                                  {false && rightTab === 'fields' && (
                                    <>
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
                                      </div>

                                      {/* Columns - same panel: drag from here into buckets below */}
                                      <div>
                                        <label style={{ color: pbi.text }} className="block text-xs font-medium mb-1">Columns</label>
                                        <div className="relative mb-1.5">
                                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: pbi.textMuted }} strokeWidth={2} />
                                          <input
                                            value={fieldSearch}
                                            onChange={(e) => setFieldSearch(e.target.value)}
                                            placeholder="Search columns"
                                            style={{
                                              backgroundColor: pbi.bucketBg,
                                              borderColor: pbi.bucketBorder,
                                              color: pbi.text,
                                              paddingLeft: '22px',
                                            }}
                                            className="w-full pl-7 pr-2 py-1.5 text-[11px] border rounded focus:ring-1 focus:ring-[#107c10] outline-none"
                                          />
                                        </div>
                                        <div
                                          style={{
                                            maxHeight: 180,
                                            overflowY: 'auto',
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            border: `1px solid ${pbi.bucketBorder}`,
                                            borderRadius: 6,
                                            padding: '4px 6px',
                                          }}
                                        >
                                          {loadingDatasets ? (
                                            <div className="flex items-center justify-center py-4">
                                              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#107c10' }} strokeWidth={2} />
                                            </div>
                                          ) : datasets.length === 0 ? (
                                            <p style={{ color: pbi.textMuted }} className="text-[10px] px-1 py-2">No data sources</p>
                                          ) : (
                                            <div className="space-y-0">
                                              {datasets.map((dataset) => {
                                                const isExpanded = selectedDatasets.has(dataset.id);
                                                const datasetColumns = (columns[dataset.id] || []).filter((c) =>
                                                  fieldSearch.trim() ? c.name.toLowerCase().includes(fieldSearch.trim().toLowerCase()) : true
                                                );
                                                return (
                                                  <div key={dataset.id}>
                                                    <div
                                                      onClick={() => toggleDatasetSelection(dataset.id)}
                                                      className="flex items-center gap-1 py-[3px] px-1 hover:bg-white/5 cursor-pointer rounded"
                                                    >
                                                      <ChevronRight
                                                        className="w-3.5 h-3.5 shrink-0 transition-transform"
                                                        style={{
                                                          color: pbi.textMuted,
                                                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                                                          transition: 'transform 0.15s ease',
                                                        }}
                                                        strokeWidth={2}
                                                      />
                                                      <Database className="w-3.5 h-3.5 shrink-0" style={{ color: '#107c10' }} strokeWidth={2} />
                                                      <span style={{ color: pbi.text }} className="text-[10px] truncate font-medium">{dataset.name}</span>
                                                    </div>
                                                    {isExpanded && (
                                                      <div className="ml-3">
                                                        {loadingData[dataset.id] ? (
                                                          <Loader2 className="w-3.5 h-3.5 animate-spin my-1 ml-1.5" style={{ color: '#107c10' }} strokeWidth={2} />
                                                        ) : (
                                                          (datasetColumns.length ? datasetColumns : columns[dataset.id] || []).map((col) => (
                                                            <div
                                                              key={col.name}
                                                              draggable
                                                              onDragStart={() => handleDragStart(dataset.id, col.name)}
                                                              onDragEnd={handleDragEnd}
                                                              className="flex items-center gap-1.5 py-[2px] px-1 hover:bg-white/10 cursor-grab active:cursor-grabbing rounded"
                                                              title={`Drag ${col.name} to a bucket below`}
                                                            >
                                                              <span style={{ color: pbi.text }} className="text-[10px] truncate">{col.name}</span>
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
                                        <p style={{ color: pbi.textMuted }} className="text-[11px] mt-1.5">
                                          Drag fields from the list above into the buckets below.
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

                                      {/* Buckets – driven by CHART_FIELD_CONFIG so each chart type shows only its fields */}
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
                                      ) : (() => {
                                        const fieldConfig = CHART_FIELD_CONFIG[selectedWidgetData.type] ?? {
                                          showAxis: true, showValues: true, showLegend: true,
                                          axis: 'X-axis', values: 'Values', legend: 'Legend',
                                        };
                                        const isGauge = selectedWidgetData.type === 'gauge';
                                        const isFilter = selectedWidgetData.type === 'filter';
                                        const axisVals = selectedWidgetData.xAxisFields ?? (selectedWidgetData.xAxis ? [selectedWidgetData.xAxis] : []);
                                        const valueVals = selectedWidgetData.yAxisFields ?? [selectedWidgetData.yAxis, selectedWidgetData.field].filter(Boolean) as string[];
                                        const legendVals = selectedWidgetData.legendFields ?? (selectedWidgetData.legend ? [selectedWidgetData.legend] : []);
                                        const fieldVals = selectedWidgetData.fieldFields ?? (selectedWidgetData.field ? [selectedWidgetData.field] : []);
                                        const filterVals = selectedWidgetData.filterFields ?? (selectedWidgetData.filterField ? [selectedWidgetData.filterField] : []);
                                        return (
                                          <>
                                            {fieldConfig.showAxis && (
                                              <MultiFieldDropZone
                                                label={fieldConfig.axis ?? 'X-axis'}
                                                values={axisVals}
                                                bucket="xAxis"
                                                widgetId={selectedWidgetData.id}
                                                hint={selectedWidgetData.type === 'key-influencers' ? 'Drag measure(s) here' : selectedWidgetData.type === 'matrix' ? 'Drag field(s) for rows' : 'Drag category or axis field(s) here'}
                                                onRemove={(v) => handleRemoveFromArray(selectedWidgetData.id, arrayKeyForBucket('xAxis')!, v)}
                                              />
                                            )}
                                            {fieldConfig.showValues && (
                                              <MultiFieldDropZone
                                                label={fieldConfig.values ?? 'Values'}
                                                values={isGauge ? fieldVals : valueVals}
                                                bucket={isGauge ? 'field' : 'yAxis'}
                                                widgetId={selectedWidgetData.id}
                                                hint={isGauge ? 'Drag value field(s) here' : selectedWidgetData.type === 'table' ? 'Drag column(s) here' : selectedWidgetData.type === 'matrix' ? 'Drag field(s) for columns' : 'Drag numeric field(s) here'}
                                                onRemove={(v) => handleRemoveFromArray(selectedWidgetData.id, (isGauge ? arrayKeyForBucket('field') : arrayKeyForBucket('yAxis'))!, v)}
                                              />
                                            )}
                                            {fieldConfig.showLegend && (
                                              <MultiFieldDropZone
                                                label={fieldConfig.legend ?? 'Legend'}
                                                values={legendVals}
                                                bucket="legend"
                                                widgetId={selectedWidgetData.id}
                                                hint={isGauge ? 'Optional: target value(s)' : selectedWidgetData.type === 'matrix' ? 'Drag value field(s) here' : 'Optional: drag category field(s) here'}
                                                onRemove={(v) => handleRemoveFromArray(selectedWidgetData.id, arrayKeyForBucket('legend')!, v)}
                                              />
                                            )}
                                            {fieldConfig.showField && (
                                              <MultiFieldDropZone
                                                label={fieldConfig.fieldLabel ?? 'Field'}
                                                values={isFilter ? filterVals : fieldVals}
                                                bucket={isFilter ? 'filterField' : 'field'}
                                                widgetId={selectedWidgetData.id}
                                                hint={isFilter ? 'Drag field(s) to filter other visuals' : 'Drag field(s) for KPI'}
                                                onRemove={(v) => handleRemoveFromArray(selectedWidgetData.id, (isFilter ? arrayKeyForBucket('filterField') : arrayKeyForBucket('field'))!, v)}
                                              />
                                            )}
                                          </>
                                        );
                                      })()}
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

                                      {selectedWidgetData.type === 'filter' && (
                                        <div className="mb-3">
                                          <label style={{ color: pbi.text }} className="block text-xs font-medium mb-1">Slicer style</label>
                                          <select
                                            value={selectedWidgetData.slicerStyle || 'list'}
                                            onChange={(e) => updateWidget(selectedWidgetData.id, { slicerStyle: e.target.value as 'dropdown' | 'tile' | 'list' })}
                                            style={{ backgroundColor: pbi.bucketBg, borderColor: pbi.bucketBorder, color: pbi.text }}
                                            className="w-full px-2.5 py-1.5 text-sm border rounded focus:ring-1 focus:ring-[#0078d4] outline-none"
                                          >
                                            <option value="list" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Vertical list</option>
                                            <option value="tile" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Tile</option>
                                            <option value="dropdown" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Dropdown</option>
                                          </select>
                                        </div>
                                      )}

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
                                              {AGGREGATION_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value} style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                                                  {opt.label}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div className="mb-3">
                                            <label style={{ color: pbi.text }} className="block text-xs font-medium mb-1">Value format</label>
                                            <div className="flex flex-wrap gap-1">
                                              {[
                                                { v: undefined, label: 'Auto' },
                                                { v: 'currency', label: '₹' },
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
                      </>
                    )}
                  </div>

                  {/* RIGHT PANEL – Data (fixed 300px): header + search, dataset tree, column type icons */}
                  <div
                    className="flex flex-col overflow-hidden shrink-0"
                    style={{
                      width: dataPaneCollapsed ? 28 : 300,
                      minWidth: dataPaneCollapsed ? 28 : 300,
                      transition: 'width 0.2s ease',
                      boxShadow: PBI_SIDEBAR_STYLE.shadow,
                    }}
                  >
                    {dataPaneCollapsed ? (
                      <div
                        onClick={() => setDataPaneCollapsed(false)}
                        className="h-full flex flex-col items-center justify-start py-2 cursor-pointer rounded-l transition-colors"
                        style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, color: PBI_SIDEBAR_STYLE.text }}
                      >
                        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 11, fontWeight: 600 }}>Data</span>
                        <span className="flex flex-col gap-0.5 mt-2" style={{ color: PBI_SIDEBAR_STYLE.textMuted }}>
                          <ChevronLeft className="w-3 h-3" strokeWidth={2} />
                          <ChevronLeft className="w-3 h-3 -mt-2" strokeWidth={2} />
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Header: Title + Search input */}
                        <div className="px-3 py-2.5 shrink-0 space-y-2" style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, borderBottom: `1px solid ${PBI_SIDEBAR_STYLE.border}` }}>
                          <div className="flex items-center justify-between">
                            <span style={{ color: PBI_SIDEBAR_STYLE.text }} className="font-semibold text-sm">Data</span>
                            <button type="button" onClick={() => setDataPaneCollapsed(true)} className="p-1.5 rounded transition-colors cursor-pointer hover:bg-black/5 flex items-center gap-0.5" title="Collapse">
                              <ChevronLeft className="w-4 h-4" style={{ color: PBI_SIDEBAR_STYLE.textMuted }} strokeWidth={2} />
                              <ChevronLeft className="w-4 h-4 -ml-1.5" style={{ color: PBI_SIDEBAR_STYLE.textMuted }} strokeWidth={2} />
                            </button>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: PBI_SIDEBAR_STYLE.textMuted }} strokeWidth={2} />
                            <input
                              value={fieldSearch}
                              onChange={(e) => setFieldSearch(e.target.value)}
                              placeholder="Search"
                              style={{
                                backgroundColor: PBI_SIDEBAR_STYLE.cardBg,
                                border: `1px solid ${PBI_SIDEBAR_STYLE.border}`,
                                color: PBI_SIDEBAR_STYLE.text,
                                paddingLeft: 28,
                                boxShadow: PBI_SIDEBAR_STYLE.shadow,
                              }}
                              className="w-full px-2 py-2 text-xs rounded outline-none transition-shadow focus:ring-1 focus:ring-[#0078d4]"
                            />
                          </div>
                        </div>

                        {/* Dataset tree: expandable list, table icon per dataset, columns with data type icon */}
                        <div className="flex-1 overflow-y-auto px-2 py-2" style={{ backgroundColor: PBI_SIDEBAR_STYLE.panelBg }}>
                          {loadingDatasets ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 animate-spin" style={{ color: PBI_SIDEBAR_STYLE.selectedBorder }} strokeWidth={2} />
                            </div>
                          ) : datasets.length === 0 ? (
                            <p style={{ color: PBI_SIDEBAR_STYLE.textMuted }} className="text-xs px-1 py-2">No data sources</p>
                          ) : (
                            <div className="space-y-0">
                              {datasets.map((dataset) => {
                                const isExpanded = selectedDatasets.has(dataset.id);
                                const datasetColumns = (columns[dataset.id] || []).filter((c) =>
                                  fieldSearch.trim() ? c.name.toLowerCase().includes(fieldSearch.trim().toLowerCase()) : true
                                );
                                return (
                                  <div key={dataset.id} className="rounded mb-0.5" style={{ backgroundColor: PBI_SIDEBAR_STYLE.cardBg, border: `1px solid ${PBI_SIDEBAR_STYLE.borderLight}`, boxShadow: PBI_SIDEBAR_STYLE.shadow }}>
                                    <div
                                      onClick={() => toggleDatasetSelection(dataset.id)}
                                      className="flex items-center gap-2 py-2 px-2 rounded transition-colors cursor-pointer hover:bg-black/5"
                                    >
                                      <ChevronRight className="w-4 h-4 shrink-0 transition-transform" style={{ color: PBI_SIDEBAR_STYLE.textMuted, transform: isExpanded ? 'rotate(90deg)' : 'none' }} strokeWidth={2} />
                                      <TableIcon className="w-4 h-4 shrink-0" style={{ color: PBI_SIDEBAR_STYLE.selectedBorder }} strokeWidth={2} />
                                      <span style={{ color: PBI_SIDEBAR_STYLE.text }} className="text-xs font-medium truncate">{dataset.name}</span>
                                    </div>
                                    {isExpanded && (
                                      <div className="ml-6 pb-2 pr-2 border-t" style={{ borderColor: PBI_SIDEBAR_STYLE.borderLight }}>
                                        {loadingData[dataset.id] ? (
                                          <Loader2 className="w-4 h-4 animate-spin my-2 ml-2" style={{ color: PBI_SIDEBAR_STYLE.selectedBorder }} strokeWidth={2} />
                                        ) : (
                                          (datasetColumns.length ? datasetColumns : columns[dataset.id] || []).map((col) => (
                                            <div
                                              key={col.name}
                                              draggable
                                              onDragStart={() => handleDragStart(dataset.id, col.name)}
                                              onDragEnd={handleDragEnd}
                                              className="flex items-center gap-2 py-1.5 px-2 rounded transition-colors cursor-grab active:cursor-grabbing hover:bg-black/5"
                                              title={`Drag ${col.name} to Values bucket`}
                                            >
                                              <ColumnTypeIcon type={col.type} />
                                              <span style={{ color: PBI_SIDEBAR_STYLE.text }} className="text-xs truncate">{col.name}</span>
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
              </div>
            </Panel>
          </PanelGroup>
        </div>

        {/* Footer Bar - Power BI exact style page tabs */}
        <div
          style={{
            backgroundColor: isDark ? '#1e1e1e' : '#f3f3f3',
            borderTop: `1px solid ${pbi.sidebarBorder}`,
            height: 36,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px',
          }}
        >
          {/* Left - Layout mode + Page navigation */}
          <div className="flex items-center h-full">
            {/* Desktop/Mobile toggle - Power BI exact style */}
            <button
              onClick={() => setLayoutMode('desktop')}
              className={`p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${layoutMode === 'desktop' ? 'bg-white/15' : 'opacity-50 hover:opacity-75'}`}
              style={{ color: pbi.text }}
              title="Desktop layout"
            >
              <Monitor className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              onClick={() => setLayoutMode('mobile')}
              className={`p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${layoutMode === 'mobile' ? 'bg-white/15' : 'opacity-50 hover:opacity-75'}`}
              style={{ color: pbi.text }}
              title="Mobile layout"
            >
              <Smartphone className="w-5 h-5" strokeWidth={2} />
            </button>
            <div className="w-px h-4 mx-1" style={{ backgroundColor: pbi.sidebarBorder }} />

            {/* Page navigation arrows - Power BI exact style */}
            <button
              onClick={() => setCurrentPage((i) => Math.max(0, i - 1))}
              disabled={currentPage <= 0}
              className="p-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 hover:bg-white/15 flex items-center justify-center"
              style={{ color: pbi.text }}
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => setCurrentPage((i) => Math.min(pages.length - 1, i + 1))}
              disabled={currentPage >= pages.length - 1}
              className="p-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 hover:bg-white/15 flex items-center justify-center"
              style={{ color: pbi.text }}
              title="Next page"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.25} />
            </button>

            {/* Page Tabs - Power BI exact style */}
            <div className="flex items-end h-full ml-1">
              {pages.map((p, i) => (
                <div
                  key={p.id}
                  className="relative flex items-center gap-0.5 group/tab"
                  style={{
                    backgroundColor: i === currentPage ? (isDark ? '#252526' : '#ffffff') : 'transparent',
                    borderTop: i === currentPage ? '2px solid #107c10' : '2px solid transparent',
                    borderLeft: i === currentPage ? `1px solid ${pbi.sidebarBorder}` : '1px solid transparent',
                    borderRight: i === currentPage ? `1px solid ${pbi.sidebarBorder}` : '1px solid transparent',
                    borderBottom: i === currentPage ? `1px solid ${isDark ? '#252526' : '#ffffff'}` : '1px solid transparent',
                    marginBottom: '-1px',
                    borderTopLeftRadius: '3px',
                    borderTopRightRadius: '3px',
                    marginTop: 'auto',
                  }}
                >
                  {editingPageIndex === i ? (
                    <input
                      type="text"
                      value={editingPageName}
                      onChange={(e) => setEditingPageName(e.target.value)}
                      onBlur={() => {
                        const name = editingPageName.trim() || p.name;
                        setPages((prev) => prev.map((pg, idx) => idx === i ? { ...pg, name } : pg));
                        setEditingPageIndex(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="h-[26px] px-2 min-w-[60px] max-w-[140px] text-[11px] font-medium rounded border-0 outline-none bg-transparent"
                      style={{ color: pbi.text }}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(i)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        setEditingPageIndex(i);
                        setEditingPageName(p.name);
                      }}
                      className="flex items-center gap-1 pl-3 pr-1 py-0.5 h-[28px] text-[11px] font-medium transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'transparent',
                        color: i === currentPage ? pbi.text : pbi.textMuted,
                        border: 'none',
                      }}
                    >
                      {p.name}
                      <span
                        className="ml-1 px-1.5 py-0.5 text-[9px] font-semibold rounded"
                        style={{
                          backgroundColor: i === currentPage ? 'rgba(0,120,212,0.15)' : 'rgba(128,128,128,0.15)',
                          color: i === currentPage ? '#0078d4' : pbi.textMuted,
                        }}
                      >
                        {p.widgets.length}
                      </span>
                    </button>
                  )}
                  {editingPageIndex !== i && pages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPages((prev) => prev.filter((_, idx) => idx !== i));
                        setCurrentPage((prev) => {
                          if (prev === i) return Math.max(0, i - 1);
                          if (prev > i) return prev - 1;
                          return prev;
                        });
                      }}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover/tab:opacity-100 hover:bg-black/15 cursor-pointer"
                      style={{ color: pbi.textMuted }}
                      title="Delete page"
                    >
                      <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add page button - Power BI exact style */}
            <button
              onClick={() => {
                setPages((prev) => [...prev, { id: String(Date.now()), name: `Page ${prev.length + 1}`, widgets: [] }]);
                setCurrentPage(pages.length);
              }}
              className="ml-2 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{ backgroundColor: '#107c10', color: '#fff' }}
              title="Add page"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Right - Zoom controls - Power BI exact style */}
          <div className="flex items-center gap-0.5">
            <div className="w-px h-4 mx-2" style={{ backgroundColor: pbi.sidebarBorder }} />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
              className="p-2.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer flex items-center justify-center"
              style={{ color: pbi.text }}
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" strokeWidth={2} />
            </button>
            <div className="w-20 flex items-center mx-1">
              <input
                type="range"
                min="10"
                max="200"
                value={Math.round(zoom * 100)}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="w-full h-1 rounded cursor-pointer appearance-none"
                style={{
                  accentColor: '#107c10',
                  background: `linear-gradient(to right, #107c10 0%, #107c10 ${((zoom * 100 - 10) / 190) * 100}%, ${isDark ? '#3c3c3c' : '#c8c8c8'} ${((zoom * 100 - 10) / 190) * 100}%, ${isDark ? '#3c3c3c' : '#c8c8c8'} 100%)`
                }}
                title="Zoom"
              />
            </div>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-2.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer flex items-center justify-center"
              style={{ color: pbi.text }}
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" strokeWidth={2} />
            </button>
            <span style={{ color: pbi.text }} className="text-xs font-semibold tabular-nums mx-2 min-w-[2.5rem] text-right">{Math.round(zoom * 100)}%</span>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer flex items-center justify-center"
              style={{ color: pbi.text }}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-5 h-5" strokeWidth={2} />
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