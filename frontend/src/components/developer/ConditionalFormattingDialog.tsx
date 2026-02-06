/**
 * Conditional Formatting Dialog - Power BI-style conditional formatting
 * Supports color scales, color rules, data bars, and icon sets
 */

import React, { useState, useCallback } from 'react';
import {
    X,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    ArrowRight,
    Circle,
    Flag,
    Star,
    AlertCircle,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { ConditionalFormatRule } from '../../lib/formatPane';

interface ConditionalFormattingDialogProps {
    rules: ConditionalFormatRule[];
    fields: string[];
    onSave: (rules: ConditionalFormatRule[]) => void;
    onClose: () => void;
    isDark: boolean;
    colors: {
        text: string;
        muted: string;
        bg: string;
        border: string;
        accent: string;
    };
}

const PRESET_COLOR_SCALES = [
    { name: 'Red-Yellow-Green', min: '#ff0000', mid: '#ffff00', max: '#00ff00' },
    { name: 'Green-Yellow-Red', min: '#00ff00', mid: '#ffff00', max: '#ff0000' },
    { name: 'Blue-White-Red', min: '#0000ff', mid: '#ffffff', max: '#ff0000' },
    { name: 'White-Blue', min: '#ffffff', mid: undefined, max: '#0078d4' },
    { name: 'White-Green', min: '#ffffff', mid: undefined, max: '#107c10' },
    { name: 'White-Red', min: '#ffffff', mid: undefined, max: '#d64550' },
];

const ICON_SETS = {
    arrows: [
        { icon: ArrowUp, color: '#22c55e' },
        { icon: ArrowRight, color: '#eab308' },
        { icon: ArrowDown, color: '#ef4444' },
    ],
    circles: [
        { icon: Circle, color: '#22c55e' },
        { icon: Circle, color: '#eab308' },
        { icon: Circle, color: '#ef4444' },
    ],
    flags: [
        { icon: Flag, color: '#22c55e' },
        { icon: Flag, color: '#eab308' },
        { icon: Flag, color: '#ef4444' },
    ],
    stars: [
        { icon: Star, color: '#eab308' },
        { icon: Star, color: '#d1d5db' },
        { icon: Star, color: '#d1d5db' },
    ],
    ratings: [
        { icon: CheckCircle, color: '#22c55e' },
        { icon: AlertCircle, color: '#eab308' },
        { icon: XCircle, color: '#ef4444' },
    ],
};

export const ConditionalFormattingDialog: React.FC<ConditionalFormattingDialogProps> = ({
    rules,
    fields,
    onSave,
    onClose,
    isDark,
    colors,
}) => {
    const [localRules, setLocalRules] = useState<ConditionalFormatRule[]>(rules);
    const [expandedRuleId, setExpandedRuleId] = useState<string | null>(
        rules.length > 0 ? rules[0].id : null
    );

    const addRule = useCallback((type: ConditionalFormatRule['type']) => {
        const newRule: ConditionalFormatRule = {
            id: Date.now().toString(),
            name: `New ${type} rule`,
            type,
            field: fields[0] || '',
            enabled: true,
            // Color scale defaults
            minColor: '#ffffff',
            midColor: '#ffff00',
            maxColor: '#107c10',
            minValue: 0,
            midValue: 50,
            maxValue: 100,
            // Color rules defaults
            rules: type === 'colorRules' ? [
                { operator: 'greaterThan', value: 75, color: '#22c55e' },
                { operator: 'between', value: 25, value2: 75, color: '#eab308' },
                { operator: 'lessThan', value: 25, color: '#ef4444' },
            ] : undefined,
            // Data bar defaults
            barColor: '#118DFF',
            barDirection: 'leftToRight',
            showValue: true,
            // Icon set defaults
            iconSet: 'arrows',
        };

        setLocalRules([...localRules, newRule]);
        setExpandedRuleId(newRule.id);
    }, [localRules, fields]);

    const updateRule = useCallback((ruleId: string, updates: Partial<ConditionalFormatRule>) => {
        setLocalRules(prev => prev.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
        ));
    }, []);

    const deleteRule = useCallback((ruleId: string) => {
        setLocalRules(prev => prev.filter(rule => rule.id !== ruleId));
        if (expandedRuleId === ruleId) {
            setExpandedRuleId(null);
        }
    }, [expandedRuleId]);

    const handleSave = useCallback(() => {
        onSave(localRules);
        onClose();
    }, [localRules, onSave, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div
                className="w-[600px] max-h-[80vh] flex flex-col rounded-lg shadow-2xl"
                style={{ backgroundColor: colors.bg }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: colors.border }}
                >
                    <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                        Conditional Formatting
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    >
                        <X className="w-5 h-5" style={{ color: colors.muted }} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Add Rule Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            Add rule:
                        </span>
                        <button
                            onClick={() => addRule('colorScale')}
                            className="px-3 py-1 text-xs rounded-md border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: colors.border, color: colors.text }}
                        >
                            Color scale
                        </button>
                        <button
                            onClick={() => addRule('colorRules')}
                            className="px-3 py-1 text-xs rounded-md border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: colors.border, color: colors.text }}
                        >
                            Color rules
                        </button>
                        <button
                            onClick={() => addRule('dataBar')}
                            className="px-3 py-1 text-xs rounded-md border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: colors.border, color: colors.text }}
                        >
                            Data bar
                        </button>
                        <button
                            onClick={() => addRule('icon')}
                            className="px-3 py-1 text-xs rounded-md border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: colors.border, color: colors.text }}
                        >
                            Icons
                        </button>
                    </div>

                    {/* Rules List */}
                    <div className="space-y-2">
                        {localRules.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm" style={{ color: colors.muted }}>
                                    No conditional formatting rules defined.
                                </p>
                                <p className="text-xs mt-1" style={{ color: colors.muted }}>
                                    Click a button above to add a rule.
                                </p>
                            </div>
                        ) : (
                            localRules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="border rounded-lg overflow-hidden"
                                    style={{ borderColor: colors.border }}
                                >
                                    {/* Rule Header */}
                                    <div
                                        className="flex items-center justify-between px-3 py-2 cursor-pointer"
                                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                                        onClick={() => setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {expandedRuleId === rule.id ? (
                                                <ChevronDown className="w-4 h-4" style={{ color: colors.muted }} />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" style={{ color: colors.muted }} />
                                            )}
                                            <span className="text-sm font-medium" style={{ color: colors.text }}>
                                                {rule.name}
                                            </span>
                                            <span
                                                className="px-2 py-0.5 text-[10px] rounded"
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                                    color: colors.muted,
                                                }}
                                            >
                                                {rule.type}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateRule(rule.id, { enabled: !rule.enabled });
                                                }}
                                                className={`px-2 py-0.5 text-[10px] rounded cursor-pointer ${rule.enabled ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-gray-500'
                                                    }`}
                                            >
                                                {rule.enabled ? 'Enabled' : 'Disabled'}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteRule(rule.id);
                                                }}
                                                className="p-1 rounded hover:bg-red-500/20 cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Rule Content */}
                                    {expandedRuleId === rule.id && (
                                        <div className="px-4 py-3 space-y-3 border-t" style={{ borderColor: colors.border }}>
                                            {/* Rule Name */}
                                            <div>
                                                <label className="block text-xs mb-1" style={{ color: colors.muted }}>
                                                    Rule name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={rule.name}
                                                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                                                    className="w-full px-3 py-1.5 text-sm rounded border outline-none"
                                                    style={{
                                                        backgroundColor: colors.bg,
                                                        borderColor: colors.border,
                                                        color: colors.text,
                                                    }}
                                                />
                                            </div>

                                            {/* Field Selection */}
                                            <div>
                                                <label className="block text-xs mb-1" style={{ color: colors.muted }}>
                                                    Apply to field
                                                </label>
                                                <select
                                                    value={rule.field}
                                                    onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                                                    className="w-full px-3 py-1.5 text-sm rounded border outline-none cursor-pointer"
                                                    style={{
                                                        backgroundColor: colors.bg,
                                                        borderColor: colors.border,
                                                        color: colors.text,
                                                    }}
                                                >
                                                    {fields.map((field) => (
                                                        <option key={field} value={field}>
                                                            {field}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Color Scale Settings */}
                                            {rule.type === 'colorScale' && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs mb-2" style={{ color: colors.muted }}>
                                                            Preset color scales
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {PRESET_COLOR_SCALES.map((preset, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => updateRule(rule.id, {
                                                                        minColor: preset.min,
                                                                        midColor: preset.mid,
                                                                        maxColor: preset.max,
                                                                    })}
                                                                    className="h-6 w-20 rounded cursor-pointer border"
                                                                    style={{
                                                                        background: preset.mid
                                                                            ? `linear-gradient(to right, ${preset.min}, ${preset.mid}, ${preset.max})`
                                                                            : `linear-gradient(to right, ${preset.min}, ${preset.max})`,
                                                                        borderColor: colors.border,
                                                                    }}
                                                                    title={preset.name}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-xs mb-1" style={{ color: colors.muted }}>
                                                                Minimum
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={rule.minColor || '#ffffff'}
                                                                    onChange={(e) => updateRule(rule.id, { minColor: e.target.value })}
                                                                    className="w-8 h-8 rounded cursor-pointer"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={rule.minValue ?? 0}
                                                                    onChange={(e) => updateRule(rule.id, { minValue: Number(e.target.value) })}
                                                                    className="flex-1 px-2 py-1 text-xs rounded border outline-none"
                                                                    style={{
                                                                        backgroundColor: colors.bg,
                                                                        borderColor: colors.border,
                                                                        color: colors.text,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs mb-1" style={{ color: colors.muted }}>
                                                                Midpoint
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={rule.midColor || '#ffff00'}
                                                                    onChange={(e) => updateRule(rule.id, { midColor: e.target.value })}
                                                                    className="w-8 h-8 rounded cursor-pointer"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={rule.midValue ?? 50}
                                                                    onChange={(e) => updateRule(rule.id, { midValue: Number(e.target.value) })}
                                                                    className="flex-1 px-2 py-1 text-xs rounded border outline-none"
                                                                    style={{
                                                                        backgroundColor: colors.bg,
                                                                        borderColor: colors.border,
                                                                        color: colors.text,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs mb-1" style={{ color: colors.muted }}>
                                                                Maximum
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={rule.maxColor || '#00ff00'}
                                                                    onChange={(e) => updateRule(rule.id, { maxColor: e.target.value })}
                                                                    className="w-8 h-8 rounded cursor-pointer"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={rule.maxValue ?? 100}
                                                                    onChange={(e) => updateRule(rule.id, { maxValue: Number(e.target.value) })}
                                                                    className="flex-1 px-2 py-1 text-xs rounded border outline-none"
                                                                    style={{
                                                                        backgroundColor: colors.bg,
                                                                        borderColor: colors.border,
                                                                        color: colors.text,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Color Rules Settings */}
                                            {rule.type === 'colorRules' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs" style={{ color: colors.muted }}>
                                                            Rules
                                                        </label>
                                                        <button
                                                            onClick={() => {
                                                                const newRules = [...(rule.rules || []), {
                                                                    operator: 'equals' as const,
                                                                    value: 0,
                                                                    color: '#888888',
                                                                }];
                                                                updateRule(rule.id, { rules: newRules });
                                                            }}
                                                            className="flex items-center gap-1 px-2 py-1 text-[10px] rounded cursor-pointer"
                                                            style={{ color: colors.accent }}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Add rule
                                                        </button>
                                                    </div>

                                                    {rule.rules?.map((r, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-2 p-2 rounded border"
                                                            style={{ borderColor: colors.border }}
                                                        >
                                                            <select
                                                                value={r.operator}
                                                                onChange={(e) => {
                                                                    const newRules = [...(rule.rules || [])];
                                                                    newRules[idx] = { ...r, operator: e.target.value as any };
                                                                    updateRule(rule.id, { rules: newRules });
                                                                }}
                                                                className="px-2 py-1 text-xs rounded border outline-none cursor-pointer"
                                                                style={{
                                                                    backgroundColor: colors.bg,
                                                                    borderColor: colors.border,
                                                                    color: colors.text,
                                                                }}
                                                            >
                                                                <option value="greaterThan">Greater than</option>
                                                                <option value="lessThan">Less than</option>
                                                                <option value="equals">Equals</option>
                                                                <option value="between">Between</option>
                                                                <option value="contains">Contains</option>
                                                            </select>

                                                            <input
                                                                type="text"
                                                                value={r.value}
                                                                onChange={(e) => {
                                                                    const newRules = [...(rule.rules || [])];
                                                                    newRules[idx] = { ...r, value: e.target.value };
                                                                    updateRule(rule.id, { rules: newRules });
                                                                }}
                                                                className="w-16 px-2 py-1 text-xs rounded border outline-none"
                                                                style={{
                                                                    backgroundColor: colors.bg,
                                                                    borderColor: colors.border,
                                                                    color: colors.text,
                                                                }}
                                                            />

                                                            {r.operator === 'between' && (
                                                                <>
                                                                    <span className="text-xs" style={{ color: colors.muted }}>and</span>
                                                                    <input
                                                                        type="text"
                                                                        value={r.value2 || ''}
                                                                        onChange={(e) => {
                                                                            const newRules = [...(rule.rules || [])];
                                                                            newRules[idx] = { ...r, value2: e.target.value };
                                                                            updateRule(rule.id, { rules: newRules });
                                                                        }}
                                                                        className="w-16 px-2 py-1 text-xs rounded border outline-none"
                                                                        style={{
                                                                            backgroundColor: colors.bg,
                                                                            borderColor: colors.border,
                                                                            color: colors.text,
                                                                        }}
                                                                    />
                                                                </>
                                                            )}

                                                            <input
                                                                type="color"
                                                                value={r.color}
                                                                onChange={(e) => {
                                                                    const newRules = [...(rule.rules || [])];
                                                                    newRules[idx] = { ...r, color: e.target.value };
                                                                    updateRule(rule.id, { rules: newRules });
                                                                }}
                                                                className="w-6 h-6 rounded cursor-pointer"
                                                            />

                                                            <button
                                                                onClick={() => {
                                                                    const newRules = (rule.rules || []).filter((_, i) => i !== idx);
                                                                    updateRule(rule.id, { rules: newRules });
                                                                }}
                                                                className="p-1 rounded hover:bg-red-500/20 cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3 h-3" style={{ color: '#ef4444' }} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Data Bar Settings */}
                                            {rule.type === 'dataBar' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs mb-1" style={{ color: colors.muted }}>
                                                            Bar color
                                                        </label>
                                                        <input
                                                            type="color"
                                                            value={rule.barColor || '#118DFF'}
                                                            onChange={(e) => updateRule(rule.id, { barColor: e.target.value })}
                                                            className="w-full h-8 rounded cursor-pointer"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs mb-1" style={{ color: colors.muted }}>
                                                            Direction
                                                        </label>
                                                        <select
                                                            value={rule.barDirection || 'leftToRight'}
                                                            onChange={(e) => updateRule(rule.id, { barDirection: e.target.value as any })}
                                                            className="w-full px-3 py-1.5 text-sm rounded border outline-none cursor-pointer"
                                                            style={{
                                                                backgroundColor: colors.bg,
                                                                borderColor: colors.border,
                                                                color: colors.text,
                                                            }}
                                                        >
                                                            <option value="leftToRight">Left to right</option>
                                                            <option value="rightToLeft">Right to left</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={rule.showValue ?? true}
                                                            onChange={(e) => updateRule(rule.id, { showValue: e.target.checked })}
                                                            className="w-4 h-4 rounded accent-[#107c10]"
                                                        />
                                                        <label className="text-xs" style={{ color: colors.text }}>
                                                            Show value
                                                        </label>
                                                    </div>

                                                    {/* Preview */}
                                                    <div className="p-3 rounded border" style={{ borderColor: colors.border }}>
                                                        <label className="block text-xs mb-2" style={{ color: colors.muted }}>
                                                            Preview
                                                        </label>
                                                        <div className="space-y-1">
                                                            {[75, 50, 25].map((val) => (
                                                                <div key={val} className="flex items-center gap-2">
                                                                    <div
                                                                        className="h-4 rounded"
                                                                        style={{
                                                                            width: `${val}%`,
                                                                            backgroundColor: rule.barColor || '#118DFF',
                                                                        }}
                                                                    />
                                                                    {rule.showValue && (
                                                                        <span className="text-xs" style={{ color: colors.text }}>
                                                                            {val}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Icon Set Settings */}
                                            {rule.type === 'icon' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs mb-2" style={{ color: colors.muted }}>
                                                            Icon set
                                                        </label>
                                                        <div className="flex gap-2">
                                                            {(Object.keys(ICON_SETS) as Array<keyof typeof ICON_SETS>).map((setName) => {
                                                                const icons = ICON_SETS[setName];
                                                                return (
                                                                    <button
                                                                        key={setName}
                                                                        onClick={() => updateRule(rule.id, { iconSet: setName })}
                                                                        className="flex items-center gap-1 px-3 py-2 rounded border cursor-pointer transition-colors"
                                                                        style={{
                                                                            borderColor: rule.iconSet === setName ? colors.accent : colors.border,
                                                                            backgroundColor: rule.iconSet === setName
                                                                                ? isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                                                                : 'transparent',
                                                                        }}
                                                                    >
                                                                        {icons.map((icon, idx) => {
                                                                            const IconComponent = icon.icon;
                                                                            return (
                                                                                <IconComponent
                                                                                    key={idx}
                                                                                    className="w-4 h-4"
                                                                                    style={{ color: icon.color }}
                                                                                />
                                                                            );
                                                                        })}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Preview */}
                                                    <div className="p-3 rounded border" style={{ borderColor: colors.border }}>
                                                        <label className="block text-xs mb-2" style={{ color: colors.muted }}>
                                                            Preview
                                                        </label>
                                                        <div className="space-y-1">
                                                            {[{ val: 100, idx: 0 }, { val: 50, idx: 1 }, { val: 10, idx: 2 }].map(({ val, idx }) => {
                                                                const iconSet = ICON_SETS[rule.iconSet || 'arrows'];
                                                                const iconData = iconSet[Math.min(idx, iconSet.length - 1)];
                                                                const IconComponent = iconData.icon;
                                                                return (
                                                                    <div key={val} className="flex items-center gap-2">
                                                                        <IconComponent className="w-4 h-4" style={{ color: iconData.color }} />
                                                                        <span className="text-xs" style={{ color: colors.text }}>
                                                                            {val}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end gap-2 px-4 py-3 border-t"
                    style={{ borderColor: colors.border }}
                >
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm rounded-md border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: colors.border, color: colors.text }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 text-sm rounded-md cursor-pointer"
                        style={{ backgroundColor: '#107c10', color: '#fff' }}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConditionalFormattingDialog;
