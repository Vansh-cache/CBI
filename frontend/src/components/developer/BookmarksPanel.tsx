/**
 * Bookmarks Panel - Power BI-style bookmarks management
 * Create, manage, and apply visual state bookmarks with slideshow support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Bookmark,
    Plus,
    Trash2,
    Edit3,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    FolderPlus,
    Settings,
    ChevronDown,
    ChevronRight,
    GripVertical,
    MoreHorizontal,
    Eye,
    Filter,
    Layers,
    Camera,
    Clock,
} from 'lucide-react';
import { DashboardBookmark, BookmarkGroup, createBookmark } from '../../lib/dashboardPage';

interface BookmarksPanelProps {
    bookmarks: DashboardBookmark[];
    groups: BookmarkGroup[];
    currentPageId: string;
    onCreateBookmark: (name: string, capturedState: DashboardBookmark['capturedState']) => void;
    onApplyBookmark: (bookmarkId: string) => void;
    onDeleteBookmark: (bookmarkId: string) => void;
    onRenameBookmark: (bookmarkId: string, newName: string) => void;
    onUpdateBookmark: (bookmarkId: string, updates: Partial<DashboardBookmark>) => void;
    onCreateGroup: (name: string) => void;
    onDeleteGroup: (groupId: string) => void;
    onMoveBookmarkToGroup: (bookmarkId: string, groupId: string | null) => void;
    getCapturedState: () => DashboardBookmark['capturedState'];
    theme?: 'light' | 'dark';
}

// Bookmark Item Component
interface BookmarkItemProps {
    bookmark: DashboardBookmark;
    isSelected: boolean;
    isPlaying: boolean;
    onSelect: () => void;
    onApply: () => void;
    onDelete: () => void;
    onRename: (name: string) => void;
    onUpdate: (updates: Partial<DashboardBookmark>) => void;
    onDragStart: (e: React.DragEvent) => void;
    theme?: 'light' | 'dark';
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
    bookmark,
    isSelected,
    isPlaying,
    onSelect,
    onApply,
    onDelete,
    onRename,
    onUpdate,
    onDragStart,
    theme = 'light',
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(bookmark.name);
    const [showSettings, setShowSettings] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleRename = () => {
        if (editName.trim() && editName !== bookmark.name) {
            onRename(editName.trim());
        } else {
            setEditName(bookmark.name);
        }
        setIsEditing(false);
    };

    return (
        <div
            draggable={!isEditing}
            onDragStart={onDragStart}
            className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
        ${isSelected
                    ? theme === 'dark'
                        ? 'bg-blue-500/20 border border-blue-500/40'
                        : 'bg-blue-50 border border-blue-200'
                    : theme === 'dark'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                }
        ${isPlaying ? 'ring-2 ring-green-500' : ''}
      `}
            onClick={onSelect}
            onDoubleClick={onApply}
        >
            {/* Drag handle */}
            <GripVertical
                className={`
          w-4 h-4 opacity-0 group-hover:opacity-50 cursor-grab
          ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
        `}
            />

            {/* Bookmark icon */}
            <Bookmark
                className={`
          w-4 h-4 flex-shrink-0
          ${isSelected
                        ? 'text-blue-500'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
        `}
            />

            {/* Name */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') {
                            setEditName(bookmark.name);
                            setIsEditing(false);
                        }
                    }}
                    onBlur={handleRename}
                    className={`
            flex-1 px-1 py-0.5 text-sm border rounded outline-none
            ${theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'}
          `}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span
                    className={`
            flex-1 text-sm truncate
            ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
          `}
                >
                    {bookmark.name}
                </span>
            )}

            {/* Status icons */}
            <div className="flex items-center gap-1">
                {!bookmark.displaySettings.includeData && (
                    <Layers className="w-3 h-3 opacity-50" title="Display state only" />
                )}
                {!bookmark.displaySettings.includeFilters && (
                    <Filter className="w-3 h-3 opacity-50" title="Filters not included" />
                )}
                {bookmark.displaySettings.autoAdvanceSeconds && (
                    <Clock className="w-3 h-3 opacity-50" title={`${bookmark.displaySettings.autoAdvanceSeconds}s`} />
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                    className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    title="Rename"
                >
                    <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowSettings(!showSettings);
                    }}
                    className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    title="Settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className={`p-1 rounded text-red-500 ${theme === 'dark' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Settings dropdown */}
            {showSettings && (
                <div
                    className={`
            absolute top-full left-0 mt-1 z-50 p-3 rounded-lg shadow-lg border min-w-[220px]
            ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          `}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={bookmark.displaySettings.includeData !== false}
                                onChange={(e) => onUpdate({
                                    displaySettings: { ...bookmark.displaySettings, includeData: e.target.checked }
                                })}
                                className="rounded"
                            />
                            <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                                Include data changes
                            </span>
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={bookmark.displaySettings.includeDisplayState !== false}
                                onChange={(e) => onUpdate({
                                    displaySettings: { ...bookmark.displaySettings, includeDisplayState: e.target.checked }
                                })}
                                className="rounded"
                            />
                            <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                                Include display state
                            </span>
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={bookmark.displaySettings.includeFilters !== false}
                                onChange={(e) => onUpdate({
                                    displaySettings: { ...bookmark.displaySettings, includeFilters: e.target.checked }
                                })}
                                className="rounded"
                            />
                            <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                                Include filters
                            </span>
                        </label>

                        <div>
                            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Auto-advance (seconds)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="60"
                                value={bookmark.displaySettings.autoAdvanceSeconds || 0}
                                onChange={(e) => onUpdate({
                                    displaySettings: {
                                        ...bookmark.displaySettings,
                                        autoAdvanceSeconds: parseInt(e.target.value) || undefined
                                    }
                                })}
                                className={`
                  w-full px-2 py-1 text-sm border rounded
                  ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'}
                `}
                            />
                        </div>
                    </div>

                    <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button
                            onClick={() => {
                                // Update bookmark with current state
                                setShowSettings(false);
                            }}
                            className={`
                w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded
                ${theme === 'dark'
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'}
              `}
                        >
                            <Camera className="w-4 h-4" />
                            Update bookmark
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Bookmark Group Component
interface BookmarkGroupComponentProps {
    group: BookmarkGroup;
    bookmarks: DashboardBookmark[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onDeleteGroup: () => void;
    onRenameGroup: (name: string) => void;
    onBookmarkDrop: (bookmarkId: string) => void;
    children: React.ReactNode;
    theme?: 'light' | 'dark';
}

const BookmarkGroupComponent: React.FC<BookmarkGroupComponentProps> = ({
    group,
    bookmarks,
    isExpanded,
    onToggleExpand,
    onDeleteGroup,
    onRenameGroup,
    onBookmarkDrop,
    children,
    theme = 'light',
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(group.name);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const bookmarkId = e.dataTransfer.getData('bookmarkId');
        if (bookmarkId) {
            onBookmarkDrop(bookmarkId);
        }
    };

    return (
        <div
            className={`
        rounded-md overflow-hidden
        ${isDragOver
                    ? theme === 'dark'
                        ? 'ring-2 ring-blue-500 bg-blue-500/10'
                        : 'ring-2 ring-blue-500 bg-blue-50'
                    : ''
                }
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Group header */}
            <div
                className={`
          flex items-center gap-2 px-2 py-1.5 cursor-pointer
          ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
        `}
                onClick={onToggleExpand}
            >
                {isExpanded
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                }

                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onRenameGroup(editName.trim() || group.name);
                                setIsEditing(false);
                            }
                            if (e.key === 'Escape') {
                                setEditName(group.name);
                                setIsEditing(false);
                            }
                        }}
                        onBlur={() => {
                            onRenameGroup(editName.trim() || group.name);
                            setIsEditing(false);
                        }}
                        className={`
              flex-1 px-1 py-0.5 text-sm border rounded outline-none
              ${theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'}
            `}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                ) : (
                    <span
                        className={`flex-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                    >
                        {group.name}
                    </span>
                )}

                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {bookmarks.length}
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup();
                    }}
                    className={`
            p-1 rounded opacity-0 group-hover:opacity-100 text-red-500
            ${theme === 'dark' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}
          `}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Group content */}
            {isExpanded && (
                <div className="pl-4">
                    {children}
                </div>
            )}
        </div>
    );
};

// Main Bookmarks Panel
export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
    bookmarks,
    groups,
    currentPageId,
    onCreateBookmark,
    onApplyBookmark,
    onDeleteBookmark,
    onRenameBookmark,
    onUpdateBookmark,
    onCreateGroup,
    onDeleteGroup,
    onMoveBookmarkToGroup,
    getCapturedState,
    theme = 'light',
}) => {
    const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
    const [draggedBookmarkId, setDraggedBookmarkId] = useState<string | null>(null);
    const [showNewGroupInput, setShowNewGroupInput] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Filter bookmarks by current page
    const pageBookmarks = bookmarks.filter(b => b.pageId === currentPageId);
    const ungroupedBookmarks = pageBookmarks.filter(b => !b.groupId);

    // Slideshow controls
    const startSlideshow = useCallback(() => {
        if (pageBookmarks.length === 0) return;
        setIsPlaying(true);
        setCurrentPlayIndex(0);
        onApplyBookmark(pageBookmarks[0].id);
    }, [pageBookmarks, onApplyBookmark]);

    const stopSlideshow = useCallback(() => {
        setIsPlaying(false);
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
        }
    }, []);

    const nextBookmark = useCallback(() => {
        const nextIndex = (currentPlayIndex + 1) % pageBookmarks.length;
        setCurrentPlayIndex(nextIndex);
        onApplyBookmark(pageBookmarks[nextIndex].id);
    }, [currentPlayIndex, pageBookmarks, onApplyBookmark]);

    const prevBookmark = useCallback(() => {
        const prevIndex = (currentPlayIndex - 1 + pageBookmarks.length) % pageBookmarks.length;
        setCurrentPlayIndex(prevIndex);
        onApplyBookmark(pageBookmarks[prevIndex].id);
    }, [currentPlayIndex, pageBookmarks, onApplyBookmark]);

    // Auto-advance during slideshow
    useEffect(() => {
        if (!isPlaying || pageBookmarks.length === 0) return;

        const currentBookmark = pageBookmarks[currentPlayIndex];
        const delay = currentBookmark?.displaySettings.autoAdvanceSeconds
            ? currentBookmark.displaySettings.autoAdvanceSeconds * 1000
            : 5000;

        playTimeoutRef.current = setTimeout(nextBookmark, delay);

        return () => {
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
            }
        };
    }, [isPlaying, currentPlayIndex, pageBookmarks, nextBookmark]);

    // Handle drag
    const handleDragStart = (e: React.DragEvent, bookmarkId: string) => {
        setDraggedBookmarkId(bookmarkId);
        e.dataTransfer.setData('bookmarkId', bookmarkId);
        e.dataTransfer.effectAllowed = 'move';
    };

    // Toggle group expansion
    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    return (
        <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Header */}
            <div
                className={`
          flex items-center justify-between px-3 py-2 border-b
          ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
        `}
            >
                <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Bookmarks
                </h3>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            const state = getCapturedState();
                            const name = `Bookmark ${bookmarks.length + 1}`;
                            onCreateBookmark(name, state);
                        }}
                        className={`
              p-1.5 rounded
              ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}
            `}
                        title="Add bookmark"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setShowNewGroupInput(true)}
                        className={`
              p-1.5 rounded
              ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}
            `}
                        title="Add group"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Slideshow controls */}
            {pageBookmarks.length > 0 && (
                <div
                    className={`
            flex items-center justify-center gap-2 px-3 py-2 border-b
            ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
          `}
                >
                    <button
                        onClick={prevBookmark}
                        disabled={!isPlaying && pageBookmarks.length < 2}
                        className={`
              p-1.5 rounded disabled:opacity-40
              ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
                    >
                        <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                        onClick={isPlaying ? stopSlideshow : startSlideshow}
                        disabled={pageBookmarks.length === 0}
                        className={`
              p-2 rounded-full disabled:opacity-40
              ${isPlaying
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-500 text-white hover:bg-green-600'}
            `}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={nextBookmark}
                        disabled={!isPlaying && pageBookmarks.length < 2}
                        className={`
              p-1.5 rounded disabled:opacity-40
              ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
                    >
                        <SkipForward className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Bookmarks list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* New group input */}
                {showNewGroupInput && (
                    <div className="flex items-center gap-2 p-2">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group name"
                            className={`
                flex-1 px-2 py-1 text-sm border rounded outline-none
                ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
              `}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newGroupName.trim()) {
                                    onCreateGroup(newGroupName.trim());
                                    setNewGroupName('');
                                    setShowNewGroupInput(false);
                                }
                                if (e.key === 'Escape') {
                                    setNewGroupName('');
                                    setShowNewGroupInput(false);
                                }
                            }}
                            autoFocus
                        />
                        <button
                            onClick={() => {
                                if (newGroupName.trim()) {
                                    onCreateGroup(newGroupName.trim());
                                    setNewGroupName('');
                                }
                                setShowNewGroupInput(false);
                            }}
                            className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add
                        </button>
                    </div>
                )}

                {/* Groups */}
                {groups.map(group => {
                    const groupBookmarks = pageBookmarks.filter(b => b.groupId === group.id);
                    return (
                        <BookmarkGroupComponent
                            key={group.id}
                            group={group}
                            bookmarks={groupBookmarks}
                            isExpanded={expandedGroups.has(group.id)}
                            onToggleExpand={() => toggleGroup(group.id)}
                            onDeleteGroup={() => onDeleteGroup(group.id)}
                            onRenameGroup={(name) => {/* Would need rename handler */ }}
                            onBookmarkDrop={(bookmarkId) => onMoveBookmarkToGroup(bookmarkId, group.id)}
                            theme={theme}
                        >
                            {groupBookmarks.map(bookmark => (
                                <BookmarkItem
                                    key={bookmark.id}
                                    bookmark={bookmark}
                                    isSelected={selectedBookmarkId === bookmark.id}
                                    isPlaying={isPlaying && pageBookmarks[currentPlayIndex]?.id === bookmark.id}
                                    onSelect={() => setSelectedBookmarkId(bookmark.id)}
                                    onApply={() => onApplyBookmark(bookmark.id)}
                                    onDelete={() => onDeleteBookmark(bookmark.id)}
                                    onRename={(name) => onRenameBookmark(bookmark.id, name)}
                                    onUpdate={(updates) => onUpdateBookmark(bookmark.id, updates)}
                                    onDragStart={(e) => handleDragStart(e, bookmark.id)}
                                    theme={theme}
                                />
                            ))}
                        </BookmarkGroupComponent>
                    );
                })}

                {/* Ungrouped bookmarks */}
                {ungroupedBookmarks.map(bookmark => (
                    <BookmarkItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        isSelected={selectedBookmarkId === bookmark.id}
                        isPlaying={isPlaying && pageBookmarks[currentPlayIndex]?.id === bookmark.id}
                        onSelect={() => setSelectedBookmarkId(bookmark.id)}
                        onApply={() => onApplyBookmark(bookmark.id)}
                        onDelete={() => onDeleteBookmark(bookmark.id)}
                        onRename={(name) => onRenameBookmark(bookmark.id, name)}
                        onUpdate={(updates) => onUpdateBookmark(bookmark.id, updates)}
                        onDragStart={(e) => handleDragStart(e, bookmark.id)}
                        theme={theme}
                    />
                ))}

                {/* Empty state */}
                {pageBookmarks.length === 0 && (
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No bookmarks yet</p>
                        <p className="text-xs mt-1">
                            Click + to capture the current view
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookmarksPanel;
