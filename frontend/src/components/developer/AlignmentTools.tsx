/**
 * Alignment Tools Component
 * Power BI-like alignment and distribution tools for widgets
 */

import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd,
    AlignHorizontalSpaceAround,
    AlignVerticalSpaceAround,
    Copy,
    Clipboard,
    Lock,
    Unlock,
    Trash2,
    Layers
} from 'lucide-react';

interface Widget {
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    locked?: boolean;
}

interface AlignmentToolsProps {
    selectedWidgetIds: string[];
    widgets: Widget[];
    onUpdateWidgets: (updates: { id: string; position?: { x: number; y: number }; locked?: boolean }[]) => void;
    onCopyWidgets: () => void;
    onPasteWidgets: () => void;
    onDuplicateWidgets: () => void;
    onDeleteWidgets: () => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
    canPaste: boolean;
    isDark: boolean;
    colors: any;
}

export default function AlignmentTools({
    selectedWidgetIds,
    widgets,
    onUpdateWidgets,
    onCopyWidgets,
    onPasteWidgets,
    onDuplicateWidgets,
    onDeleteWidgets,
    onBringToFront,
    onSendToBack,
    canPaste,
    isDark,
    colors
}: AlignmentToolsProps) {
    const selectedWidgets = widgets.filter(w => selectedWidgetIds.includes(w.id));
    const hasSelection = selectedWidgets.length > 0;
    const hasMultipleSelection = selectedWidgets.length > 1;
    const allLocked = selectedWidgets.every(w => w.locked);
    const anyLocked = selectedWidgets.some(w => w.locked);

    const alignWidgets = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
        if (selectedWidgets.length < 2) return;

        const updates = selectedWidgets.map(widget => {
            let newPosition = { ...widget.position };

            switch (alignment) {
                case 'left': {
                    const minX = Math.min(...selectedWidgets.map(w => w.position.x));
                    newPosition.x = minX;
                    break;
                }
                case 'center': {
                    const minX = Math.min(...selectedWidgets.map(w => w.position.x));
                    const maxX = Math.max(...selectedWidgets.map(w => w.position.x + w.size.width));
                    const centerX = (minX + maxX) / 2;
                    newPosition.x = centerX - widget.size.width / 2;
                    break;
                }
                case 'right': {
                    const maxX = Math.max(...selectedWidgets.map(w => w.position.x + w.size.width));
                    newPosition.x = maxX - widget.size.width;
                    break;
                }
                case 'top': {
                    const minY = Math.min(...selectedWidgets.map(w => w.position.y));
                    newPosition.y = minY;
                    break;
                }
                case 'middle': {
                    const minY = Math.min(...selectedWidgets.map(w => w.position.y));
                    const maxY = Math.max(...selectedWidgets.map(w => w.position.y + w.size.height));
                    const centerY = (minY + maxY) / 2;
                    newPosition.y = centerY - widget.size.height / 2;
                    break;
                }
                case 'bottom': {
                    const maxY = Math.max(...selectedWidgets.map(w => w.position.y + w.size.height));
                    newPosition.y = maxY - widget.size.height;
                    break;
                }
            }

            return { id: widget.id, position: newPosition };
        });

        onUpdateWidgets(updates);
    };

    const distributeWidgets = (direction: 'horizontal' | 'vertical') => {
        if (selectedWidgets.length < 3) return;

        const sorted = [...selectedWidgets].sort((a, b) =>
            direction === 'horizontal'
                ? a.position.x - b.position.x
                : a.position.y - b.position.y
        );

        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const totalSpace = direction === 'horizontal'
            ? (last.position.x + last.size.width) - first.position.x
            : (last.position.y + last.size.height) - first.position.y;

        const totalWidgetSize = sorted.reduce((sum, w) =>
            sum + (direction === 'horizontal' ? w.size.width : w.size.height), 0
        );

        const spacing = (totalSpace - totalWidgetSize) / (sorted.length - 1);

        let currentPos = direction === 'horizontal' ? first.position.x : first.position.y;

        const updates = sorted.map((widget, index) => {
            if (index === 0 || index === sorted.length - 1) {
                return { id: widget.id };
            }

            const newPosition = { ...widget.position };

            if (direction === 'horizontal') {
                currentPos += sorted[index - 1].size.width + spacing;
                newPosition.x = currentPos;
            } else {
                currentPos += sorted[index - 1].size.height + spacing;
                newPosition.y = currentPos;
            }

            return { id: widget.id, position: newPosition };
        });

        onUpdateWidgets(updates.filter(u => u.position));
    };

    const toggleLock = () => {
        const updates = selectedWidgets.map(widget => ({
            id: widget.id,
            locked: !allLocked
        }));
        onUpdateWidgets(updates);
    };

    const ToolButton = ({
        icon: Icon,
        label,
        onClick,
        disabled = false,
        variant = 'default'
    }: {
        icon: any;
        label: string;
        onClick: () => void;
        disabled?: boolean;
        variant?: 'default' | 'danger';
    }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={label}
            className={`p-2 rounded transition-colors ${disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : variant === 'danger'
                        ? 'hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            style={{ color: disabled ? colors.muted : colors.text }}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div
            className="flex items-center gap-1 px-3 py-2 border-b"
            style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                borderColor: colors.cardBorder
            }}
        >
            {/* Clipboard Operations */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: colors.cardBorder }}>
                <ToolButton icon={Copy} label="Copy (Ctrl+C)" onClick={onCopyWidgets} disabled={!hasSelection} />
                <ToolButton icon={Clipboard} label="Paste (Ctrl+V)" onClick={onPasteWidgets} disabled={!canPaste} />
                <ToolButton icon={Copy} label="Duplicate (Ctrl+D)" onClick={onDuplicateWidgets} disabled={!hasSelection} />
            </div>

            {/* Alignment Tools */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: colors.cardBorder }}>
                <ToolButton icon={AlignLeft} label="Align Left" onClick={() => alignWidgets('left')} disabled={!hasMultipleSelection} />
                <ToolButton icon={AlignCenter} label="Align Center" onClick={() => alignWidgets('center')} disabled={!hasMultipleSelection} />
                <ToolButton icon={AlignRight} label="Align Right" onClick={() => alignWidgets('right')} disabled={!hasMultipleSelection} />
            </div>

            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: colors.cardBorder }}>
                <ToolButton icon={AlignVerticalJustifyStart} label="Align Top" onClick={() => alignWidgets('top')} disabled={!hasMultipleSelection} />
                <ToolButton icon={AlignVerticalJustifyCenter} label="Align Middle" onClick={() => alignWidgets('middle')} disabled={!hasMultipleSelection} />
                <ToolButton icon={AlignVerticalJustifyEnd} label="Align Bottom" onClick={() => alignWidgets('bottom')} disabled={!hasMultipleSelection} />
            </div>

            {/* Distribution Tools */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: colors.cardBorder }}>
                <ToolButton
                    icon={AlignHorizontalSpaceAround}
                    label="Distribute Horizontally"
                    onClick={() => distributeWidgets('horizontal')}
                    disabled={selectedWidgets.length < 3}
                />
                <ToolButton
                    icon={AlignVerticalSpaceAround}
                    label="Distribute Vertically"
                    onClick={() => distributeWidgets('vertical')}
                    disabled={selectedWidgets.length < 3}
                />
            </div>

            {/* Layer Controls */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: colors.cardBorder }}>
                <ToolButton icon={Layers} label="Bring to Front" onClick={onBringToFront} disabled={!hasSelection} />
                <ToolButton icon={Layers} label="Send to Back" onClick={onSendToBack} disabled={!hasSelection} />
            </div>

            {/* Lock/Delete */}
            <div className="flex items-center gap-1">
                <ToolButton
                    icon={allLocked ? Lock : Unlock}
                    label={allLocked ? "Unlock" : "Lock"}
                    onClick={toggleLock}
                    disabled={!hasSelection}
                />
                <ToolButton
                    icon={Trash2}
                    label="Delete (Del)"
                    onClick={onDeleteWidgets}
                    disabled={!hasSelection}
                    variant="danger"
                />
            </div>

            {/* Selection Info */}
            {hasSelection && (
                <div className="ml-auto pl-2 border-l" style={{ borderColor: colors.cardBorder }}>
                    <span style={{ color: colors.muted }} className="text-xs">
                        {selectedWidgets.length} selected{anyLocked && ' (locked)'}
                    </span>
                </div>
            )}
        </div>
    );
}
