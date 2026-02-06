/**
 * Page Navigator - Power BI-style page tabs and navigation
 * Manages multiple dashboard pages with add, rename, delete, reorder
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Copy,
    Trash2,
    Eye,
    EyeOff,
    GripVertical,
    MoreHorizontal,
    FileText,
    MessageSquare,
    ArrowRightCircle,
    Settings,
    ChevronDown,
} from 'lucide-react';
import { DashboardPage, PageType, createPage, clonePage } from '../../lib/dashboardPage';

interface PageNavigatorProps {
    pages: DashboardPage[];
    activePageId: string;
    onPageSelect: (pageId: string) => void;
    onPageAdd: (page: DashboardPage) => void;
    onPageDelete: (pageId: string) => void;
    onPageRename: (pageId: string, newName: string) => void;
    onPageDuplicate: (pageId: string) => void;
    onPageReorder: (newOrder: string[]) => void;
    onPageSettingsOpen?: (pageId: string) => void;
    theme?: 'light' | 'dark';
}

interface PageTabProps {
    page: DashboardPage;
    isActive: boolean;
    isEditing: boolean;
    onSelect: () => void;
    onStartRename: () => void;
    onRename: (name: string) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent) => void;
    theme?: 'light' | 'dark';
}

// Individual Page Tab
const PageTab: React.FC<PageTabProps> = ({
    page,
    isActive,
    isEditing,
    onSelect,
    onStartRename,
    onRename,
    onContextMenu,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
    theme = 'light',
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [editName, setEditName] = useState(page.name);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onRename(editName.trim() || page.name);
        } else if (e.key === 'Escape') {
            setEditName(page.name);
            onRename(page.name);
        }
    };

    const handleBlur = () => {
        onRename(editName.trim() || page.name);
    };

    // Get icon based on page type
    const PageIcon = () => {
        switch (page.type) {
            case 'tooltip':
                return <MessageSquare className="w-3.5 h-3.5 opacity-60" />;
            case 'drillthrough':
                return <ArrowRightCircle className="w-3.5 h-3.5 opacity-60" />;
            case 'hidden':
                return <EyeOff className="w-3.5 h-3.5 opacity-60" />;
            default:
                return null;
        }
    };

    return (
        <div
            draggable={!isEditing}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            onClick={onSelect}
            onDoubleClick={onStartRename}
            onContextMenu={onContextMenu}
            className={`
        group relative flex items-center gap-1.5 px-3 py-2 cursor-pointer
        border-r transition-colors select-none min-w-[80px] max-w-[200px]
        ${isActive
                    ? theme === 'dark'
                        ? 'bg-gray-800 border-b-2 border-b-blue-500 text-white'
                        : 'bg-white border-b-2 border-b-blue-500 text-gray-900'
                    : theme === 'dark'
                        ? 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border-b border-transparent'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-b border-transparent'
                }
        ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      `}
        >
            {/* Drag handle (visible on hover) */}
            <GripVertical
                className={`
          w-3 h-3 opacity-0 group-hover:opacity-50 cursor-grab
          ${isEditing ? 'hidden' : ''}
        `}
            />

            {/* Page type icon */}
            <PageIcon />

            {/* Page name */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className={`
            w-full px-1 py-0.5 text-sm border rounded outline-none
            ${theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'}
          `}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="truncate text-sm font-medium">
                    {page.name}
                </span>
            )}

            {/* Navigation disabled indicator */}
            {!page.navigationEnabled && (
                <EyeOff className="w-3 h-3 opacity-40" />
            )}
        </div>
    );
};

// Context Menu
interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onRename: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onHide: () => void;
    onSettings: () => void;
    isHidden: boolean;
    canDelete: boolean;
    theme?: 'light' | 'dark';
}

const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    onClose,
    onRename,
    onDuplicate,
    onDelete,
    onHide,
    onSettings,
    isHidden,
    canDelete,
    theme = 'light',
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const menuItems = [
        { icon: FileText, label: 'Rename', onClick: onRename },
        { icon: Copy, label: 'Duplicate page', onClick: onDuplicate },
        { icon: isHidden ? Eye : EyeOff, label: isHidden ? 'Show page' : 'Hide page', onClick: onHide },
        { icon: Settings, label: 'Page settings', onClick: onSettings },
        { divider: true },
        { icon: Trash2, label: 'Delete', onClick: onDelete, disabled: !canDelete, danger: true },
    ];

    return (
        <div
            ref={menuRef}
            className={`
        fixed z-50 py-1 min-w-[180px] rounded-lg shadow-lg border
        ${theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'}
      `}
            style={{ left: x, top: y }}
        >
            {menuItems.map((item, index) =>
                item.divider ? (
                    <div
                        key={index}
                        className={`my-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                    />
                ) : (
                    <button
                        key={index}
                        onClick={() => {
                            if (!item.disabled) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        disabled={item.disabled}
                        className={`
              w-full flex items-center gap-2 px-3 py-2 text-sm text-left
              ${item.disabled
                                ? 'opacity-40 cursor-not-allowed'
                                : item.danger
                                    ? 'text-red-500 hover:bg-red-500/10'
                                    : theme === 'dark'
                                        ? 'text-gray-200 hover:bg-gray-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                            }
            `}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </button>
                )
            )}
        </div>
    );
};

// Add Page Menu
interface AddPageMenuProps {
    anchorRef: React.RefObject<HTMLButtonElement>;
    onClose: () => void;
    onAddPage: (type: PageType) => void;
    theme?: 'light' | 'dark';
}

const AddPageMenu: React.FC<AddPageMenuProps> = ({
    anchorRef,
    onClose,
    onAddPage,
    theme = 'light',
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                anchorRef.current &&
                !anchorRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorRef]);

    const rect = anchorRef.current?.getBoundingClientRect();

    const pageTypes = [
        { type: 'report' as PageType, icon: FileText, label: 'Report page' },
        { type: 'drillthrough' as PageType, icon: ArrowRightCircle, label: 'Drillthrough page' },
        { type: 'tooltip' as PageType, icon: MessageSquare, label: 'Tooltip page' },
    ];

    return (
        <div
            ref={menuRef}
            className={`
        fixed z-50 py-1 min-w-[180px] rounded-lg shadow-lg border
        ${theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'}
      `}
            style={{
                left: rect?.left ?? 0,
                bottom: rect ? window.innerHeight - rect.top + 4 : 0,
            }}
        >
            {pageTypes.map(({ type, icon: Icon, label }) => (
                <button
                    key={type}
                    onClick={() => {
                        onAddPage(type);
                        onClose();
                    }}
                    className={`
            w-full flex items-center gap-2 px-3 py-2 text-sm text-left
            ${theme === 'dark'
                            ? 'text-gray-200 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
          `}
                >
                    <Icon className="w-4 h-4" />
                    {label}
                </button>
            ))}
        </div>
    );
};

// Main Page Navigator Component
export const PageNavigator: React.FC<PageNavigatorProps> = ({
    pages,
    activePageId,
    onPageSelect,
    onPageAdd,
    onPageDelete,
    onPageRename,
    onPageDuplicate,
    onPageReorder,
    onPageSettingsOpen,
    theme = 'light',
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const addButtonRef = useRef<HTMLButtonElement>(null);

    const [editingPageId, setEditingPageId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        pageId: string;
        x: number;
        y: number;
    } | null>(null);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Check scroll state
    const updateScrollState = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
            container.scrollLeft < container.scrollWidth - container.clientWidth
        );
    }, []);

    useEffect(() => {
        updateScrollState();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', updateScrollState);
            window.addEventListener('resize', updateScrollState);
            return () => {
                container.removeEventListener('scroll', updateScrollState);
                window.removeEventListener('resize', updateScrollState);
            };
        }
    }, [updateScrollState, pages]);

    // Scroll handlers
    const scrollLeft = () => {
        scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
    };

    const scrollRight = () => {
        scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
    };

    // Scroll active page into view
    useEffect(() => {
        const activeTab = document.getElementById(`page-tab-${activePageId}`);
        activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [activePageId]);

    // Handle add page
    const handleAddPage = (type: PageType) => {
        const pageName = type === 'tooltip'
            ? 'Tooltip page'
            : type === 'drillthrough'
                ? 'Drillthrough page'
                : `Page ${pages.length + 1}`;
        const newPage = createPage(pageName, type, pages.length);
        onPageAdd(newPage);
        onPageSelect(newPage.id);
    };

    // Handle context menu
    const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
        e.preventDefault();
        setContextMenu({ pageId, x: e.clientX, y: e.clientY });
    };

    // Handle drag and drop
    const handleDragStart = (e: React.DragEvent, pageId: string) => {
        setDraggedPageId(pageId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetPageId: string) => {
        e.preventDefault();
        if (!draggedPageId || draggedPageId === targetPageId) return;

        const newOrder = [...pages.map(p => p.id)];
        const draggedIndex = newOrder.indexOf(draggedPageId);
        const targetIndex = newOrder.indexOf(targetPageId);

        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedPageId);

        onPageReorder(newOrder);
        setDraggedPageId(null);
    };

    const handleDragEnd = () => {
        setDraggedPageId(null);
    };

    // Sort pages by order
    const sortedPages = [...pages].sort((a, b) => a.order - b.order);

    return (
        <div
            className={`
        flex items-center border-t
        ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}
      `}
        >
            {/* Scroll left button */}
            {canScrollLeft && (
                <button
                    onClick={scrollLeft}
                    className={`
            p-2 hover:bg-opacity-80
            ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          `}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            )}

            {/* Page tabs container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 flex overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {sortedPages.map(page => (
                    <div key={page.id} id={`page-tab-${page.id}`}>
                        <PageTab
                            page={page}
                            isActive={page.id === activePageId}
                            isEditing={page.id === editingPageId}
                            onSelect={() => onPageSelect(page.id)}
                            onStartRename={() => setEditingPageId(page.id)}
                            onRename={(name) => {
                                if (name !== page.name) {
                                    onPageRename(page.id, name);
                                }
                                setEditingPageId(null);
                            }}
                            onContextMenu={(e) => handleContextMenu(e, page.id)}
                            onDragStart={(e) => handleDragStart(e, page.id)}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, page.id)}
                            theme={theme}
                        />
                    </div>
                ))}
            </div>

            {/* Scroll right button */}
            {canScrollRight && (
                <button
                    onClick={scrollRight}
                    className={`
            p-2 hover:bg-opacity-80
            ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          `}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}

            {/* Add page button */}
            <button
                ref={addButtonRef}
                onClick={() => setShowAddMenu(!showAddMenu)}
                className={`
          flex items-center gap-1 px-3 py-2 text-sm border-l
          ${theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800 border-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 border-gray-200'}
        `}
            >
                <Plus className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
            </button>

            {/* Add page menu */}
            {showAddMenu && (
                <AddPageMenu
                    anchorRef={addButtonRef}
                    onClose={() => setShowAddMenu(false)}
                    onAddPage={handleAddPage}
                    theme={theme}
                />
            )}

            {/* Context menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onRename={() => setEditingPageId(contextMenu.pageId)}
                    onDuplicate={() => onPageDuplicate(contextMenu.pageId)}
                    onDelete={() => onPageDelete(contextMenu.pageId)}
                    onHide={() => {
                        // Toggle hidden state
                        const page = pages.find(p => p.id === contextMenu.pageId);
                        if (page) {
                            // Would need to add onPageUpdate to handle this
                        }
                    }}
                    onSettings={() => onPageSettingsOpen?.(contextMenu.pageId)}
                    isHidden={pages.find(p => p.id === contextMenu.pageId)?.type === 'hidden'}
                    canDelete={pages.length > 1}
                    theme={theme}
                />
            )}
        </div>
    );
};

// Compact page navigator for mobile/smaller screens
export const CompactPageNavigator: React.FC<PageNavigatorProps> = ({
    pages,
    activePageId,
    onPageSelect,
    onPageAdd,
    theme = 'light',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const activePage = pages.find(p => p.id === activePageId);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 text-sm rounded-md border
          ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }
        `}
            >
                <FileText className="w-4 h-4" />
                <span className="font-medium">{activePage?.name || 'Select page'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className={`
            absolute bottom-full left-0 mb-2 min-w-[200px] py-1 rounded-lg shadow-lg border z-50
            ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          `}
                >
                    {pages.map(page => (
                        <button
                            key={page.id}
                            onClick={() => {
                                onPageSelect(page.id);
                                setIsOpen(false);
                            }}
                            className={`
                w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                ${page.id === activePageId
                                    ? theme === 'dark'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-blue-50 text-blue-600'
                                    : theme === 'dark'
                                        ? 'text-gray-200 hover:bg-gray-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }
              `}
                        >
                            <FileText className="w-4 h-4" />
                            {page.name}
                        </button>
                    ))}

                    <div className={`my-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />

                    <button
                        onClick={() => {
                            const newPage = createPage(`Page ${pages.length + 1}`, 'report', pages.length);
                            onPageAdd(newPage);
                            onPageSelect(newPage.id);
                            setIsOpen(false);
                        }}
                        className={`
              w-full flex items-center gap-2 px-3 py-2 text-sm text-left
              ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}
            `}
                    >
                        <Plus className="w-4 h-4" />
                        Add page
                    </button>
                </div>
            )}
        </div>
    );
};

export default PageNavigator;
