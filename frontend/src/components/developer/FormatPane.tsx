/**
 * Format Pane Component - Power BI-style deep formatting panel
 * Provides comprehensive visual formatting options
 */

import React, { useState, useCallback } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Type,
    Palette,
    Square,
    Layers,
    BarChart3,
    TrendingUp,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    Copy,
    RotateCcw,
} from 'lucide-react';
import {
    VisualFormat,
    TitleFormat,
    BackgroundFormat,
    BorderFormat,
    ShadowFormat,
    DataLabelFormat,
    AxisFormat,
    LegendFormat,
    ConditionalFormatRule,
    AnalyticsLine,
    DEFAULT_VISUAL_FORMAT,
    DisplayUnits,
    LegendPosition,
    TextAlign,
    FontWeight,
} from '../../lib/formatPane';

interface FormatPaneProps {
    format: VisualFormat;
    onChange: (format: VisualFormat) => void;
    visualType: string;
    isDark: boolean;
    colors: {
        text: string;
        muted: string;
        bg: string;
        border: string;
        accent: string;
    };
}

interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
    isDark: boolean;
    colors: FormatPaneProps['colors'];
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    defaultOpen = false,
    children,
    isDark,
    colors,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b" style={{ borderColor: colors.border }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {icon && <span style={{ color: colors.muted }}>{icon}</span>}
                    <span className="text-xs font-semibold" style={{ color: colors.text }}>
                        {title}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronDown className="w-4 h-4" style={{ color: colors.muted }} />
                ) : (
                    <ChevronRight className="w-4 h-4" style={{ color: colors.muted }} />
                )}
            </button>
            {isOpen && (
                <div className="px-3 pb-3 space-y-3">
                    {children}
                </div>
            )}
        </div>
    );
};

interface FormFieldProps {
    label: string;
    children: React.ReactNode;
    colors: FormatPaneProps['colors'];
}

const FormField: React.FC<FormFieldProps> = ({ label, children, colors }) => (
    <div className="flex items-center justify-between">
        <label className="text-[11px]" style={{ color: colors.muted }}>
            {label}
        </label>
        {children}
    </div>
);

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    isDark: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, isDark }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
        style={{ backgroundColor: checked ? '#107c10' : isDark ? '#605e5c' : '#8a8886' }}
    >
        <div
            className="absolute w-4 h-4 rounded-full bg-white shadow-sm transition-transform top-0.5"
            style={{
                transform: checked ? 'translateX(22px)' : 'translateX(2px)',
            }}
        />
    </button>
);

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    colors: FormatPaneProps['colors'];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, colors }) => {
    const presetColors = [
        '#118DFF', '#12239E', '#E66C37', '#6B007B', '#00B7C3',
        '#744EC2', '#D64550', '#7FBA00', '#FFB900', '#4C78A8',
        '#000000', '#333333', '#666666', '#999999', '#ffffff',
    ];

    const [showPicker, setShowPicker] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-2 px-2 py-1 rounded border cursor-pointer"
                style={{ borderColor: colors.border, backgroundColor: colors.bg }}
            >
                <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: value, borderColor: colors.border }}
                />
                <span className="text-[10px] font-mono" style={{ color: colors.text }}>
                    {value.toUpperCase()}
                </span>
            </button>

            {showPicker && (
                <div
                    className="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-lg z-50"
                    style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                >
                    <div className="grid grid-cols-5 gap-1 mb-2">
                        {presetColors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => {
                                    onChange(color);
                                    setShowPicker(false);
                                }}
                                className="w-5 h-5 rounded border cursor-pointer hover:scale-110 transition-transform"
                                style={{
                                    backgroundColor: color,
                                    borderColor: value === color ? colors.accent : colors.border,
                                    borderWidth: value === color ? 2 : 1,
                                }}
                            />
                        ))}
                    </div>
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-6 cursor-pointer"
                    />
                </div>
            )}
        </div>
    );
};

interface SliderInputProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    colors: FormatPaneProps['colors'];
}

const SliderInput: React.FC<SliderInputProps> = ({
    value,
    onChange,
    min,
    max,
    step = 1,
    unit = '',
    colors,
}) => (
    <div className="flex items-center gap-2">
        <input
            type="range"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-16 h-1 accent-[#107c10]"
        />
        <span className="text-[10px] font-mono w-8 text-right" style={{ color: colors.text }}>
            {value}{unit}
        </span>
    </div>
);

export const FormatPane: React.FC<FormatPaneProps> = ({
    format,
    onChange,
    visualType,
    isDark,
    colors,
}) => {
    const updateFormat = useCallback(
        <K extends keyof VisualFormat>(key: K, value: VisualFormat[K]) => {
            onChange({ ...format, [key]: value });
        },
        [format, onChange]
    );

    const updateTitle = useCallback(
        <K extends keyof TitleFormat>(key: K, value: TitleFormat[K]) => {
            onChange({ ...format, title: { ...format.title, [key]: value } });
        },
        [format, onChange]
    );

    const updateBackground = useCallback(
        <K extends keyof BackgroundFormat>(key: K, value: BackgroundFormat[K]) => {
            onChange({ ...format, background: { ...format.background, [key]: value } });
        },
        [format, onChange]
    );

    const updateBorder = useCallback(
        <K extends keyof BorderFormat>(key: K, value: BorderFormat[K]) => {
            onChange({ ...format, border: { ...format.border, [key]: value } });
        },
        [format, onChange]
    );

    const updateShadow = useCallback(
        <K extends keyof ShadowFormat>(key: K, value: ShadowFormat[K]) => {
            onChange({ ...format, shadow: { ...format.shadow, [key]: value } });
        },
        [format, onChange]
    );

    const updateDataLabels = useCallback(
        <K extends keyof DataLabelFormat>(key: K, value: DataLabelFormat[K]) => {
            onChange({ ...format, dataLabels: { ...format.dataLabels, [key]: value } });
        },
        [format, onChange]
    );

    const updateXAxis = useCallback(
        <K extends keyof AxisFormat>(key: K, value: AxisFormat[K]) => {
            onChange({ ...format, xAxis: { ...format.xAxis, [key]: value } });
        },
        [format, onChange]
    );

    const updateYAxis = useCallback(
        <K extends keyof AxisFormat>(key: K, value: AxisFormat[K]) => {
            onChange({ ...format, yAxis: { ...format.yAxis, [key]: value } });
        },
        [format, onChange]
    );

    const updateLegend = useCallback(
        <K extends keyof LegendFormat>(key: K, value: LegendFormat[K]) => {
            onChange({ ...format, legend: { ...format.legend, [key]: value } });
        },
        [format, onChange]
    );

    const resetFormat = useCallback(() => {
        onChange(DEFAULT_VISUAL_FORMAT);
    }, [onChange]);

    const showAxes = !['card', 'kpi', 'gauge', 'filter', 'table', 'matrix', 'pie', 'donut'].includes(visualType);
    const showLegend = !['card', 'kpi', 'gauge', 'filter', 'table'].includes(visualType);
    const showDataLabels = !['filter', 'table', 'matrix'].includes(visualType);

    return (
        <div className="h-full overflow-y-auto">
            {/* Reset Button */}
            <div className="px-3 py-2 border-b flex justify-end" style={{ borderColor: colors.border }}>
                <button
                    type="button"
                    onClick={resetFormat}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ color: colors.muted }}
                >
                    <RotateCcw className="w-3 h-3" />
                    Reset to default
                </button>
            </div>

            {/* Title Section */}
            <CollapsibleSection
                title="Title"
                icon={<Type className="w-4 h-4" />}
                defaultOpen={true}
                isDark={isDark}
                colors={colors}
            >
                <FormField label="Show title" colors={colors}>
                    <ToggleSwitch
                        checked={format.title.show}
                        onChange={(v) => updateTitle('show', v)}
                        isDark={isDark}
                    />
                </FormField>

                {format.title.show && (
                    <>
                        <FormField label="Title text" colors={colors}>
                            <input
                                type="text"
                                value={format.title.text || ''}
                                onChange={(e) => updateTitle('text', e.target.value)}
                                placeholder="Auto"
                                className="w-24 px-2 py-1 text-[11px] rounded border outline-none focus:ring-1 focus:ring-[#107c10]"
                                style={{
                                    backgroundColor: colors.bg,
                                    borderColor: colors.border,
                                    color: colors.text,
                                }}
                            />
                        </FormField>

                        <FormField label="Font size" colors={colors}>
                            <SliderInput
                                value={format.title.fontSize}
                                onChange={(v) => updateTitle('fontSize', v)}
                                min={8}
                                max={24}
                                unit="px"
                                colors={colors}
                            />
                        </FormField>

                        <FormField label="Font color" colors={colors}>
                            <ColorPicker
                                value={format.title.fontColor}
                                onChange={(v) => updateTitle('fontColor', v)}
                                colors={colors}
                            />
                        </FormField>

                        <FormField label="Font weight" colors={colors}>
                            <select
                                value={format.title.fontWeight}
                                onChange={(e) => updateTitle('fontWeight', e.target.value as FontWeight)}
                                className="px-2 py-1 text-[11px] rounded border outline-none cursor-pointer"
                                style={{
                                    backgroundColor: colors.bg,
                                    borderColor: colors.border,
                                    color: colors.text,
                                }}
                            >
                                <option value="light">Light</option>
                                <option value="normal">Normal</option>
                                <option value="semibold">Semibold</option>
                                <option value="bold">Bold</option>
                            </select>
                        </FormField>

                        <FormField label="Alignment" colors={colors}>
                            <div className="flex gap-1">
                                {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
                                    <button
                                        key={align}
                                        type="button"
                                        onClick={() => updateTitle('alignment', align)}
                                        className="px-2 py-1 text-[10px] rounded border cursor-pointer transition-colors"
                                        style={{
                                            backgroundColor: format.title.alignment === align ? colors.accent : colors.bg,
                                            borderColor: format.title.alignment === align ? colors.accent : colors.border,
                                            color: format.title.alignment === align ? '#fff' : colors.text,
                                        }}
                                    >
                                        {align.charAt(0).toUpperCase() + align.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </FormField>
                    </>
                )}
            </CollapsibleSection>

            {/* Background Section */}
            <CollapsibleSection
                title="Background"
                icon={<Square className="w-4 h-4" />}
                isDark={isDark}
                colors={colors}
            >
                <FormField label="Show background" colors={colors}>
                    <ToggleSwitch
                        checked={format.background.show}
                        onChange={(v) => updateBackground('show', v)}
                        isDark={isDark}
                    />
                </FormField>

                {format.background.show && (
                    <>
                        <FormField label="Color" colors={colors}>
                            <ColorPicker
                                value={format.background.color}
                                onChange={(v) => updateBackground('color', v)}
                                colors={colors}
                            />
                        </FormField>

                        <FormField label="Transparency" colors={colors}>
                            <SliderInput
                                value={format.background.transparency}
                                onChange={(v) => updateBackground('transparency', v)}
                                min={0}
                                max={100}
                                unit="%"
                                colors={colors}
                            />
                        </FormField>
                    </>
                )}
            </CollapsibleSection>

            {/* Border Section */}
            <CollapsibleSection
                title="Border"
                icon={<Square className="w-4 h-4" />}
                isDark={isDark}
                colors={colors}
            >
                <FormField label="Show border" colors={colors}>
                    <ToggleSwitch
                        checked={format.border.show}
                        onChange={(v) => updateBorder('show', v)}
                        isDark={isDark}
                    />
                </FormField>

                {format.border.show && (
                    <>
                        <FormField label="Color" colors={colors}>
                            <ColorPicker
                                value={format.border.color}
                                onChange={(v) => updateBorder('color', v)}
                                colors={colors}
                            />
                        </FormField>

                        <FormField label="Width" colors={colors}>
                            <SliderInput
                                value={format.border.width}
                                onChange={(v) => updateBorder('width', v)}
                                min={1}
                                max={5}
                                unit="px"
                                colors={colors}
                            />
                        </FormField>
                    </>
                )}

                <FormField label="Rounded corners" colors={colors}>
                    <SliderInput
                        value={format.border.radius}
                        onChange={(v) => updateBorder('radius', v)}
                        min={0}
                        max={24}
                        unit="px"
                        colors={colors}
                    />
                </FormField>
            </CollapsibleSection>

            {/* Shadow Section */}
            <CollapsibleSection
                title="Shadow"
                icon={<Layers className="w-4 h-4" />}
                isDark={isDark}
                colors={colors}
            >
                <FormField label="Show shadow" colors={colors}>
                    <ToggleSwitch
                        checked={format.shadow.show}
                        onChange={(v) => updateShadow('show', v)}
                        isDark={isDark}
                    />
                </FormField>

                {format.shadow.show && (
                    <>
                        <FormField label="Blur" colors={colors}>
                            <SliderInput
                                value={format.shadow.blur}
                                onChange={(v) => updateShadow('blur', v)}
                                min={0}
                                max={20}
                                unit="px"
                                colors={colors}
                            />
                        </FormField>

                        <FormField label="Offset Y" colors={colors}>
                            <SliderInput
                                value={format.shadow.offsetY}
                                onChange={(v) => updateShadow('offsetY', v)}
                                min={-10}
                                max={10}
                                unit="px"
                                colors={colors}
                            />
                        </FormField>
                    </>
                )}
            </CollapsibleSection>

            {/* Data Labels Section */}
            {showDataLabels && (
                <CollapsibleSection
                    title="Data labels"
                    icon={<Type className="w-4 h-4" />}
                    isDark={isDark}
                    colors={colors}
                >
                    <FormField label="Show labels" colors={colors}>
                        <ToggleSwitch
                            checked={format.dataLabels.show}
                            onChange={(v) => updateDataLabels('show', v)}
                            isDark={isDark}
                        />
                    </FormField>

                    {format.dataLabels.show && (
                        <>
                            <FormField label="Font size" colors={colors}>
                                <SliderInput
                                    value={format.dataLabels.fontSize}
                                    onChange={(v) => updateDataLabels('fontSize', v)}
                                    min={8}
                                    max={18}
                                    unit="px"
                                    colors={colors}
                                />
                            </FormField>

                            <FormField label="Color" colors={colors}>
                                <ColorPicker
                                    value={format.dataLabels.fontColor}
                                    onChange={(v) => updateDataLabels('fontColor', v)}
                                    colors={colors}
                                />
                            </FormField>

                            <FormField label="Display units" colors={colors}>
                                <select
                                    value={format.dataLabels.displayUnits}
                                    onChange={(e) => updateDataLabels('displayUnits', e.target.value as DisplayUnits)}
                                    className="px-2 py-1 text-[11px] rounded border outline-none cursor-pointer"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                >
                                    <option value="auto">Auto</option>
                                    <option value="none">None</option>
                                    <option value="thousands">Thousands</option>
                                    <option value="millions">Millions</option>
                                    <option value="billions">Billions</option>
                                </select>
                            </FormField>

                            <FormField label="Decimal places" colors={colors}>
                                <SliderInput
                                    value={format.dataLabels.precision}
                                    onChange={(v) => updateDataLabels('precision', v)}
                                    min={0}
                                    max={4}
                                    colors={colors}
                                />
                            </FormField>
                        </>
                    )}
                </CollapsibleSection>
            )}

            {/* X-Axis Section */}
            {showAxes && (
                <CollapsibleSection
                    title="X-axis"
                    icon={<BarChart3 className="w-4 h-4" />}
                    isDark={isDark}
                    colors={colors}
                >
                    <FormField label="Show axis" colors={colors}>
                        <ToggleSwitch
                            checked={format.xAxis.show}
                            onChange={(v) => updateXAxis('show', v)}
                            isDark={isDark}
                        />
                    </FormField>

                    {format.xAxis.show && (
                        <>
                            <FormField label="Show title" colors={colors}>
                                <ToggleSwitch
                                    checked={format.xAxis.showTitle}
                                    onChange={(v) => updateXAxis('showTitle', v)}
                                    isDark={isDark}
                                />
                            </FormField>

                            {format.xAxis.showTitle && (
                                <FormField label="Title text" colors={colors}>
                                    <input
                                        type="text"
                                        value={format.xAxis.title || ''}
                                        onChange={(e) => updateXAxis('title', e.target.value)}
                                        placeholder="Auto"
                                        className="w-24 px-2 py-1 text-[11px] rounded border outline-none"
                                        style={{
                                            backgroundColor: colors.bg,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        }}
                                    />
                                </FormField>
                            )}

                            <FormField label="Label size" colors={colors}>
                                <SliderInput
                                    value={format.xAxis.labelFontSize}
                                    onChange={(v) => updateXAxis('labelFontSize', v)}
                                    min={8}
                                    max={14}
                                    unit="px"
                                    colors={colors}
                                />
                            </FormField>

                            <FormField label="Label color" colors={colors}>
                                <ColorPicker
                                    value={format.xAxis.labelFontColor}
                                    onChange={(v) => updateXAxis('labelFontColor', v)}
                                    colors={colors}
                                />
                            </FormField>

                            <FormField label="Gridlines" colors={colors}>
                                <ToggleSwitch
                                    checked={format.xAxis.showGridlines}
                                    onChange={(v) => updateXAxis('showGridlines', v)}
                                    isDark={isDark}
                                />
                            </FormField>
                        </>
                    )}
                </CollapsibleSection>
            )}

            {/* Y-Axis Section */}
            {showAxes && (
                <CollapsibleSection
                    title="Y-axis"
                    icon={<BarChart3 className="w-4 h-4 rotate-90" />}
                    isDark={isDark}
                    colors={colors}
                >
                    <FormField label="Show axis" colors={colors}>
                        <ToggleSwitch
                            checked={format.yAxis.show}
                            onChange={(v) => updateYAxis('show', v)}
                            isDark={isDark}
                        />
                    </FormField>

                    {format.yAxis.show && (
                        <>
                            <FormField label="Show title" colors={colors}>
                                <ToggleSwitch
                                    checked={format.yAxis.showTitle}
                                    onChange={(v) => updateYAxis('showTitle', v)}
                                    isDark={isDark}
                                />
                            </FormField>

                            <FormField label="Scale" colors={colors}>
                                <select
                                    value={format.yAxis.scale}
                                    onChange={(e) => updateYAxis('scale', e.target.value as 'linear' | 'log')}
                                    className="px-2 py-1 text-[11px] rounded border outline-none cursor-pointer"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                >
                                    <option value="linear">Linear</option>
                                    <option value="log">Logarithmic</option>
                                </select>
                            </FormField>

                            <FormField label="Range start" colors={colors}>
                                <input
                                    type="number"
                                    value={format.yAxis.rangeStart ?? ''}
                                    onChange={(e) => updateYAxis('rangeStart', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Auto"
                                    className="w-16 px-2 py-1 text-[11px] rounded border outline-none"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                />
                            </FormField>

                            <FormField label="Range end" colors={colors}>
                                <input
                                    type="number"
                                    value={format.yAxis.rangeEnd ?? ''}
                                    onChange={(e) => updateYAxis('rangeEnd', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Auto"
                                    className="w-16 px-2 py-1 text-[11px] rounded border outline-none"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                />
                            </FormField>

                            <FormField label="Gridlines" colors={colors}>
                                <ToggleSwitch
                                    checked={format.yAxis.showGridlines}
                                    onChange={(v) => updateYAxis('showGridlines', v)}
                                    isDark={isDark}
                                />
                            </FormField>
                        </>
                    )}
                </CollapsibleSection>
            )}

            {/* Legend Section */}
            {showLegend && (
                <CollapsibleSection
                    title="Legend"
                    icon={<Palette className="w-4 h-4" />}
                    isDark={isDark}
                    colors={colors}
                >
                    <FormField label="Show legend" colors={colors}>
                        <ToggleSwitch
                            checked={format.legend.show}
                            onChange={(v) => updateLegend('show', v)}
                            isDark={isDark}
                        />
                    </FormField>

                    {format.legend.show && (
                        <>
                            <FormField label="Position" colors={colors}>
                                <select
                                    value={format.legend.position}
                                    onChange={(e) => updateLegend('position', e.target.value as LegendPosition)}
                                    className="px-2 py-1 text-[11px] rounded border outline-none cursor-pointer"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                >
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                    <option value="topLeft">Top left</option>
                                    <option value="topRight">Top right</option>
                                </select>
                            </FormField>

                            <FormField label="Font size" colors={colors}>
                                <SliderInput
                                    value={format.legend.fontSize}
                                    onChange={(v) => updateLegend('fontSize', v)}
                                    min={8}
                                    max={14}
                                    unit="px"
                                    colors={colors}
                                />
                            </FormField>

                            <FormField label="Color" colors={colors}>
                                <ColorPicker
                                    value={format.legend.fontColor}
                                    onChange={(v) => updateLegend('fontColor', v)}
                                    colors={colors}
                                />
                            </FormField>

                            <FormField label="Marker shape" colors={colors}>
                                <select
                                    value={format.legend.markerShape}
                                    onChange={(e) => updateLegend('markerShape', e.target.value as 'circle' | 'square' | 'line' | 'triangle')}
                                    className="px-2 py-1 text-[11px] rounded border outline-none cursor-pointer"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                >
                                    <option value="circle">Circle</option>
                                    <option value="square">Square</option>
                                    <option value="line">Line</option>
                                    <option value="triangle">Triangle</option>
                                </select>
                            </FormField>
                        </>
                    )}
                </CollapsibleSection>
            )}

            {/* Colors Section */}
            <CollapsibleSection
                title="Colors"
                icon={<Palette className="w-4 h-4" />}
                isDark={isDark}
                colors={colors}
            >
                <div className="space-y-2">
                    <div className="text-[11px]" style={{ color: colors.muted }}>
                        Data colors
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {format.colors.map((color, index) => (
                            <div key={index} className="relative group">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => {
                                        const newColors = [...format.colors];
                                        newColors[index] = e.target.value;
                                        updateFormat('colors', newColors);
                                    }}
                                    className="w-6 h-6 rounded cursor-pointer border-0"
                                    style={{ backgroundColor: color }}
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                const newColors = [...format.colors, '#888888'];
                                updateFormat('colors', newColors);
                            }}
                            className="w-6 h-6 rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-solid transition-all"
                            style={{ borderColor: colors.border }}
                        >
                            <Plus className="w-3 h-3" style={{ color: colors.muted }} />
                        </button>
                    </div>
                </div>

                <FormField label="Saturation" colors={colors}>
                    <SliderInput
                        value={format.colorSaturation}
                        onChange={(v) => updateFormat('colorSaturation', v)}
                        min={0}
                        max={100}
                        unit="%"
                        colors={colors}
                    />
                </FormField>
            </CollapsibleSection>

            {/* Analytics Section */}
            {showAxes && (
                <CollapsibleSection
                    title="Analytics"
                    icon={<TrendingUp className="w-4 h-4" />}
                    isDark={isDark}
                    colors={colors}
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px]" style={{ color: colors.muted }}>
                                Reference lines
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    const newLine: AnalyticsLine = {
                                        id: Date.now().toString(),
                                        type: 'constant',
                                        show: true,
                                        color: '#ff0000',
                                        width: 2,
                                        style: 'dashed',
                                        value: 0,
                                        showLabel: true,
                                        labelPosition: 'above',
                                    };
                                    updateFormat('analyticsLines', [...format.analyticsLines, newLine]);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                style={{ color: colors.accent }}
                            >
                                <Plus className="w-3 h-3" />
                                Add line
                            </button>
                        </div>

                        {format.analyticsLines.map((line, index) => (
                            <div
                                key={line.id}
                                className="p-2 rounded border space-y-2"
                                style={{ borderColor: colors.border }}
                            >
                                <div className="flex items-center justify-between">
                                    <select
                                        value={line.type}
                                        onChange={(e) => {
                                            const newLines = [...format.analyticsLines];
                                            newLines[index] = { ...line, type: e.target.value as AnalyticsLine['type'] };
                                            updateFormat('analyticsLines', newLines);
                                        }}
                                        className="px-2 py-1 text-[10px] rounded border outline-none cursor-pointer"
                                        style={{
                                            backgroundColor: colors.bg,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        }}
                                    >
                                        <option value="constant">Constant</option>
                                        <option value="average">Average</option>
                                        <option value="min">Minimum</option>
                                        <option value="max">Maximum</option>
                                        <option value="median">Median</option>
                                        <option value="trend">Trend line</option>
                                    </select>

                                    <div className="flex items-center gap-1">
                                        <ToggleSwitch
                                            checked={line.show}
                                            onChange={(v) => {
                                                const newLines = [...format.analyticsLines];
                                                newLines[index] = { ...line, show: v };
                                                updateFormat('analyticsLines', newLines);
                                            }}
                                            isDark={isDark}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newLines = format.analyticsLines.filter((_, i) => i !== index);
                                                updateFormat('analyticsLines', newLines);
                                            }}
                                            className="p-1 rounded hover:bg-red-500/20 cursor-pointer"
                                        >
                                            <Trash2 className="w-3 h-3" style={{ color: '#ef4444' }} />
                                        </button>
                                    </div>
                                </div>

                                {line.type === 'constant' && (
                                    <FormField label="Value" colors={colors}>
                                        <input
                                            type="number"
                                            value={line.value ?? 0}
                                            onChange={(e) => {
                                                const newLines = [...format.analyticsLines];
                                                newLines[index] = { ...line, value: Number(e.target.value) };
                                                updateFormat('analyticsLines', newLines);
                                            }}
                                            className="w-16 px-2 py-1 text-[10px] rounded border outline-none"
                                            style={{
                                                backgroundColor: colors.bg,
                                                borderColor: colors.border,
                                                color: colors.text,
                                            }}
                                        />
                                    </FormField>
                                )}

                                <div className="flex items-center gap-2">
                                    <ColorPicker
                                        value={line.color}
                                        onChange={(v) => {
                                            const newLines = [...format.analyticsLines];
                                            newLines[index] = { ...line, color: v };
                                            updateFormat('analyticsLines', newLines);
                                        }}
                                        colors={colors}
                                    />
                                    <select
                                        value={line.style}
                                        onChange={(e) => {
                                            const newLines = [...format.analyticsLines];
                                            newLines[index] = { ...line, style: e.target.value as 'solid' | 'dashed' | 'dotted' };
                                            updateFormat('analyticsLines', newLines);
                                        }}
                                        className="px-2 py-1 text-[10px] rounded border outline-none cursor-pointer"
                                        style={{
                                            backgroundColor: colors.bg,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        }}
                                    >
                                        <option value="solid">Solid</option>
                                        <option value="dashed">Dashed</option>
                                        <option value="dotted">Dotted</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Responsive Visibility Section */}
            <CollapsibleSection
                title="Responsive"
                icon={<Eye className="w-4 h-4" />}
                isDark={isDark}
                colors={colors}
            >
                <div className="space-y-2">
                    <FormField label="Desktop" colors={colors}>
                        <ToggleSwitch
                            checked={format.responsiveVisibility.desktop}
                            onChange={(v) => updateFormat('responsiveVisibility', {
                                ...format.responsiveVisibility,
                                desktop: v,
                            })}
                            isDark={isDark}
                        />
                    </FormField>

                    <FormField label="Tablet" colors={colors}>
                        <ToggleSwitch
                            checked={format.responsiveVisibility.tablet}
                            onChange={(v) => updateFormat('responsiveVisibility', {
                                ...format.responsiveVisibility,
                                tablet: v,
                            })}
                            isDark={isDark}
                        />
                    </FormField>

                    <FormField label="Mobile" colors={colors}>
                        <ToggleSwitch
                            checked={format.responsiveVisibility.mobile}
                            onChange={(v) => updateFormat('responsiveVisibility', {
                                ...format.responsiveVisibility,
                                mobile: v,
                            })}
                            isDark={isDark}
                        />
                    </FormField>
                </div>
            </CollapsibleSection>

            {/* Interactions Section */}
            <CollapsibleSection
                title="Interactions"
                icon={<Layers className="w-4 h-4" />}
                isDark={isDark}
                colors={colors}
            >
                <FormField label="Cross-filtering" colors={colors}>
                    <ToggleSwitch
                        checked={format.enableCrossFiltering}
                        onChange={(v) => updateFormat('enableCrossFiltering', v)}
                        isDark={isDark}
                    />
                </FormField>

                <FormField label="Drill-down" colors={colors}>
                    <ToggleSwitch
                        checked={format.enableDrilldown}
                        onChange={(v) => updateFormat('enableDrilldown', v)}
                        isDark={isDark}
                    />
                </FormField>

                <FormField label="Tooltips" colors={colors}>
                    <ToggleSwitch
                        checked={format.enableTooltips}
                        onChange={(v) => updateFormat('enableTooltips', v)}
                        isDark={isDark}
                    />
                </FormField>
            </CollapsibleSection>
        </div>
    );
};

export default FormatPane;
