import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Share2, Settings, Loader2 } from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors } from '../../lib/themeColors';
import { ChartRenderer, type ChartWidgetConfig } from '../charts/ChartRenderer';

interface Widget {
    id: string;
    type: 'bar' | 'line' | 'pie' | 'table' | 'stacked-bar' | 'area' | 'donut' | 'treemap' | 'gauge' | 'card' | 'filter';
    title: string;
    dataKey?: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    aggregation?: 'count' | 'sum' | 'first' | 'last' | 'percentage';
    field?: string;
    xAxis?: string;
    yAxis?: string;
    legend?: string;
    filterField?: string;
    selectedFilters?: string[];
    datasetId?: number;
    accentColor?: string;
}

export default function DashboardPreview() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [datasetData, setDatasetData] = useState<Record<number, unknown[]>>({});
    const [loadingData, setLoadingData] = useState<Record<number, boolean>>({});

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
                const res = await apiGet<{ id: number; name: string; description?: string; config: string | object }>(`/api/dashboards/${id}`);
                if (res.success && res.data) {
                    setDashboardData(res.data);
                    const config = typeof res.data.config === 'string' ? JSON.parse(res.data.config) : res.data.config;
                    if (config.widgets) {
                        setWidgets(config.widgets);
                        // Fetch data for all datasets used by widgets
                        const datasetIds = new Set<number>();
                        config.widgets.forEach((w: Widget) => {
                            if (w.datasetId) datasetIds.add(w.datasetId);
                        });
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
    }, [id, fetchDatasetData]);

    const getWidgetData = (widget: Widget): unknown[] => {
        if (widget.datasetId && datasetData[widget.datasetId]) {
            return datasetData[widget.datasetId];
        }
        return [];
    };

    const renderWidget = (widget: Widget, data: unknown[]) => {
        const mode = isDark ? 'dark' : 'light';
        const config: ChartWidgetConfig = {
            id: widget.id,
            type: widget.type,
            title: widget.title,
            xAxis: widget.xAxis,
            yAxis: widget.yAxis,
            legend: widget.legend,
            field: widget.field,
            aggregation: widget.aggregation,
            filterField: widget.filterField,
            selectedFilters: widget.selectedFilters,
            accentColor: widget.accentColor,
        };
        return ChartRenderer(config, data, { mode, animations: false });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]" style={{ color: colors.muted }}>
                <p>Dashboard not found</p>
            </div>
        );
    }

    const canvasMinHeight = widgets.length
        ? Math.max(...widgets.map((w) => w.position.y + w.size.height), 0) + 24
        : 320;

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
            {/* Header */}
            <div className="border-b" style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardBg }}>
                <div className="max-w-[1920px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/developer/dashboard')}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: colors.muted }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = colors.text;
                                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = colors.muted;
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
                                    {dashboardData.name || 'Dashboard Preview'}
                                </h1>
                                <p style={{ color: colors.muted }}>Preview mode - Real-time metrics and KPIs</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                className="flex items-center px-4 py-2 rounded-lg transition-colors"
                                style={{ color: colors.muted, backgroundColor: 'transparent' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </button>
                            <button
                                className="flex items-center px-4 py-2 rounded-lg transition-colors"
                                style={{ color: colors.muted, backgroundColor: 'transparent' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </button>
                            <button
                                className="flex items-center px-4 py-2 rounded-lg transition-colors"
                                style={{ color: colors.muted, backgroundColor: 'transparent' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </button>
                            <button
                                onClick={() => navigate(`/developer/builder/${id}`)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Edit Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Canvas */}
            <div className="max-w-[1920px] mx-auto p-6">
                {widgets.length === 0 ? (
                    <div className="text-center py-12" style={{ color: colors.muted }}>
                        <p>No widgets configured for this dashboard.</p>
                    </div>
                ) : (
                    <div
                        className="relative w-full"
                        style={{ minHeight: canvasMinHeight }}
                    >
                        {widgets.map((widget) => {
                            const widgetData = getWidgetData(widget);
                            const isLoading = widget.datasetId ? loadingData[widget.datasetId] : false;

                            return (
                                <div
                                    key={widget.id}
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
                                        <h3 className="font-medium text-sm truncate" style={{ color: colors.text }} title={widget.title}>
                                            {widget.title}
                                        </h3>
                                    </div>
                                    <div
                                        className="p-4 overflow-hidden"
                                        style={{
                                            height: 'calc(100% - 48px)',
                                            minHeight: 0,
                                        }}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                            </div>
                                        ) : (
                                            renderWidget(widget, widgetData)
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
