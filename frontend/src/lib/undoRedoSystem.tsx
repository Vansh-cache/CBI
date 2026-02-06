/**
 * Enhanced Undo/Redo System - Power BI-style state management
 * Supports: Action history, state snapshots, branching history, compression
 */

import { useState, useCallback, useRef, useMemo } from 'react';

// Action Types
export type ActionType =
  | 'widget/add'
  | 'widget/delete'
  | 'widget/move'
  | 'widget/resize'
  | 'widget/update'
  | 'widget/duplicate'
  | 'widget/reorder'
  | 'format/change'
  | 'data/bind'
  | 'data/unbind'
  | 'filter/add'
  | 'filter/remove'
  | 'filter/update'
  | 'page/add'
  | 'page/delete'
  | 'page/rename'
  | 'page/reorder'
  | 'canvas/zoom'
  | 'canvas/pan'
  | 'selection/change'
  | 'bulk/operation'
  | 'state/restore';

// History Entry
export interface HistoryEntry<T = any> {
  id: string;
  timestamp: number;
  actionType: ActionType;
  description: string;
  previousState: T;
  nextState: T;
  metadata?: Record<string, any>;
  // For grouping related actions
  groupId?: string;
  // For branching
  branchId?: string;
  parentId?: string;
}

// History State
export interface HistoryState<T> {
  entries: HistoryEntry<T>[];
  currentIndex: number;
  maxEntries: number;
  branches: Map<string, HistoryEntry<T>[]>;
  currentBranch: string;
}

// History Options
export interface HistoryOptions {
  maxEntries?: number;
  debounceMs?: number;
  compressAfter?: number;
  groupingWindow?: number; // ms to group similar actions
}

// Generate unique ID
const generateId = () => `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Enhanced Undo/Redo Hook
 */
export function useEnhancedUndoRedo<T>(
  initialState: T,
  options: HistoryOptions = {}
) {
  const {
    maxEntries = 100,
    debounceMs = 0,
    compressAfter = 50,
    groupingWindow = 300,
  } = options;
  
  const [state, setState] = useState<T>(initialState);
  const [history, setHistory] = useState<HistoryState<T>>({
    entries: [],
    currentIndex: -1,
    maxEntries,
    branches: new Map([['main', []]]),
    currentBranch: 'main',
  });
  
  const lastActionTime = useRef<number>(0);
  const lastActionType = useRef<ActionType | null>(null);
  const lastGroupId = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Can undo/redo
  const canUndo = history.currentIndex >= 0;
  const canRedo = history.currentIndex < history.entries.length - 1;
  
  // Current entry
  const currentEntry = history.currentIndex >= 0 ? history.entries[history.currentIndex] : null;
  
  // Get undo/redo descriptions
  const undoDescription = canUndo ? history.entries[history.currentIndex].description : null;
  const redoDescription = canRedo ? history.entries[history.currentIndex + 1].description : null;
  
  // Push new state
  const pushState = useCallback((
    newState: T,
    actionType: ActionType,
    description: string,
    metadata?: Record<string, any>
  ) => {
    const now = Date.now();
    
    // Debounce if enabled
    if (debounceMs > 0) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        executePushState(newState, actionType, description, metadata, now);
      }, debounceMs);
      
      // Update state immediately
      setState(newState);
      return;
    }
    
    executePushState(newState, actionType, description, metadata, now);
  }, [debounceMs]);
  
  const executePushState = useCallback((
    newState: T,
    actionType: ActionType,
    description: string,
    metadata: Record<string, any> | undefined,
    timestamp: number
  ) => {
    setHistory(prev => {
      // Check if this should be grouped with previous action
      let groupId: string | undefined;
      const timeSinceLastAction = timestamp - lastActionTime.current;
      
      if (
        timeSinceLastAction < groupingWindow &&
        lastActionType.current === actionType &&
        lastGroupId.current
      ) {
        groupId = lastGroupId.current;
      } else {
        groupId = generateId();
      }
      
      // Create new entry
      const newEntry: HistoryEntry<T> = {
        id: generateId(),
        timestamp,
        actionType,
        description,
        previousState: state,
        nextState: newState,
        metadata,
        groupId,
        branchId: prev.currentBranch,
      };
      
      // Remove any redo entries (we're creating a new branch of history)
      const newEntries = prev.entries.slice(0, prev.currentIndex + 1);
      newEntries.push(newEntry);
      
      // Compress if needed
      let finalEntries = newEntries;
      if (newEntries.length > compressAfter) {
        finalEntries = compressHistory(newEntries, maxEntries);
      }
      
      // Limit entries
      if (finalEntries.length > maxEntries) {
        finalEntries = finalEntries.slice(-maxEntries);
      }
      
      // Update refs
      lastActionTime.current = timestamp;
      lastActionType.current = actionType;
      lastGroupId.current = groupId;
      
      return {
        ...prev,
        entries: finalEntries,
        currentIndex: finalEntries.length - 1,
      };
    });
    
    setState(newState);
  }, [state, groupingWindow, compressAfter, maxEntries]);
  
  // Undo
  const undo = useCallback(() => {
    if (!canUndo) return;
    
    setHistory(prev => {
      const entry = prev.entries[prev.currentIndex];
      setState(entry.previousState);
      
      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
      };
    });
  }, [canUndo]);
  
  // Redo
  const redo = useCallback(() => {
    if (!canRedo) return;
    
    setHistory(prev => {
      const entry = prev.entries[prev.currentIndex + 1];
      setState(entry.nextState);
      
      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
      };
    });
  }, [canRedo]);
  
  // Go to specific entry
  const goToEntry = useCallback((entryId: string) => {
    setHistory(prev => {
      const index = prev.entries.findIndex(e => e.id === entryId);
      if (index === -1) return prev;
      
      const entry = prev.entries[index];
      setState(entry.nextState);
      
      return {
        ...prev,
        currentIndex: index,
      };
    });
  }, []);
  
  // Undo multiple steps
  const undoN = useCallback((n: number) => {
    setHistory(prev => {
      const newIndex = Math.max(-1, prev.currentIndex - n);
      if (newIndex === prev.currentIndex) return prev;
      
      if (newIndex === -1) {
        // Go to initial state
        setState(initialState);
      } else {
        setState(prev.entries[newIndex].nextState);
      }
      
      return {
        ...prev,
        currentIndex: newIndex,
      };
    });
  }, [initialState]);
  
  // Redo multiple steps
  const redoN = useCallback((n: number) => {
    setHistory(prev => {
      const newIndex = Math.min(prev.entries.length - 1, prev.currentIndex + n);
      if (newIndex === prev.currentIndex) return prev;
      
      setState(prev.entries[newIndex].nextState);
      
      return {
        ...prev,
        currentIndex: newIndex,
      };
    });
  }, []);
  
  // Clear history
  const clearHistory = useCallback(() => {
    setHistory({
      entries: [],
      currentIndex: -1,
      maxEntries,
      branches: new Map([['main', []]]),
      currentBranch: 'main',
    });
  }, [maxEntries]);
  
  // Reset to initial state
  const reset = useCallback(() => {
    setState(initialState);
    clearHistory();
  }, [initialState, clearHistory]);
  
  // Create branch
  const createBranch = useCallback((branchName: string) => {
    setHistory(prev => {
      const branches = new Map(prev.branches);
      branches.set(branchName, [...prev.entries.slice(0, prev.currentIndex + 1)]);
      
      return {
        ...prev,
        branches,
        currentBranch: branchName,
      };
    });
  }, []);
  
  // Switch branch
  const switchBranch = useCallback((branchName: string) => {
    setHistory(prev => {
      const branchEntries = prev.branches.get(branchName);
      if (!branchEntries) return prev;
      
      if (branchEntries.length > 0) {
        setState(branchEntries[branchEntries.length - 1].nextState);
      } else {
        setState(initialState);
      }
      
      return {
        ...prev,
        entries: branchEntries,
        currentIndex: branchEntries.length - 1,
        currentBranch: branchName,
      };
    });
  }, [initialState]);
  
  // Get history summary
  const historySummary = useMemo(() => {
    const grouped: Map<string, HistoryEntry<T>[]> = new Map();
    
    history.entries.forEach(entry => {
      const key = entry.groupId || entry.id;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });
    
    return Array.from(grouped.entries()).map(([groupId, entries]) => ({
      groupId,
      entries,
      timestamp: entries[0].timestamp,
      description: entries[0].description,
      actionType: entries[0].actionType,
      count: entries.length,
    }));
  }, [history.entries]);
  
  return {
    // State
    state,
    setState: pushState,
    setStateWithoutHistory: setState,
    
    // Undo/Redo
    undo,
    redo,
    undoN,
    redoN,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    
    // History
    history: history.entries,
    currentIndex: history.currentIndex,
    currentEntry,
    goToEntry,
    clearHistory,
    reset,
    historySummary,
    
    // Branches
    branches: Array.from(history.branches.keys()),
    currentBranch: history.currentBranch,
    createBranch,
    switchBranch,
  };
}

// Compress history by merging similar sequential actions
function compressHistory<T>(entries: HistoryEntry<T>[], targetSize: number): HistoryEntry<T>[] {
  if (entries.length <= targetSize) return entries;
  
  const compressed: HistoryEntry<T>[] = [];
  let i = 0;
  
  while (i < entries.length) {
    const current = entries[i];
    
    // Check if we can merge with next entries of same type
    let j = i + 1;
    while (
      j < entries.length &&
      entries[j].actionType === current.actionType &&
      entries[j].groupId === current.groupId
    ) {
      j++;
    }
    
    if (j - i > 1) {
      // Merge entries
      const merged: HistoryEntry<T> = {
        ...current,
        nextState: entries[j - 1].nextState,
        description: `${current.description} (×${j - i})`,
        metadata: {
          ...current.metadata,
          mergedCount: j - i,
        },
      };
      compressed.push(merged);
    } else {
      compressed.push(current);
    }
    
    i = j;
  }
  
  return compressed;
}

/**
 * History Panel Component
 */
import React from 'react';
import { History, RotateCcw, RotateCw, Trash2, GitBranch, Check } from 'lucide-react';

interface HistoryPanelProps<T> {
  entries: HistoryEntry<T>[];
  currentIndex: number;
  onGoToEntry: (entryId: string) => void;
  onClear: () => void;
  branches: string[];
  currentBranch: string;
  onSwitchBranch: (branch: string) => void;
  onCreateBranch: (name: string) => void;
  mode: 'light' | 'dark';
}

export function HistoryPanel<T>({
  entries,
  currentIndex,
  onGoToEntry,
  onClear,
  branches,
  currentBranch,
  onSwitchBranch,
  onCreateBranch,
  mode,
}: HistoryPanelProps<T>) {
  const isDark = mode === 'dark';
  const [showBranches, setShowBranches] = React.useState(false);
  const [newBranchName, setNewBranchName] = React.useState('');
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const actionTypeIcons: Record<string, React.ReactNode> = {
    'widget/add': '➕',
    'widget/delete': '🗑️',
    'widget/move': '↔️',
    'widget/resize': '↕️',
    'widget/update': '✏️',
    'format/change': '🎨',
    'data/bind': '🔗',
    'filter/add': '🔍',
    'page/add': '📄',
    'bulk/operation': '📦',
  };
  
  return (
    <div
      className="flex flex-col h-full border-l"
      style={{
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        width: 260,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" style={{ color: isDark ? '#e5e7eb' : '#374151' }} />
          <span
            className="font-semibold text-sm"
            style={{ color: isDark ? '#f9fafb' : '#111827' }}
          >
            History
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowBranches(!showBranches)}
            className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${showBranches ? 'bg-blue-500/20' : ''}`}
            title="Branches"
          >
            <GitBranch className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} />
          </button>
        </div>
      </div>
      
      {/* Branches panel */}
      {showBranches && (
        <div
          className="px-3 py-2 border-b"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
        >
          <div className="text-xs font-medium mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
            Branches
          </div>
          <div className="space-y-1">
            {branches.map(branch => (
              <button
                key={branch}
                onClick={() => onSwitchBranch(branch)}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs ${
                  branch === currentBranch ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{ color: branch === currentBranch ? '#3b82f6' : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}
              >
                <GitBranch className="w-3 h-3" />
                {branch}
                {branch === currentBranch && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <input
              type="text"
              placeholder="New branch..."
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="flex-1 px-2 py-1 text-xs rounded border bg-transparent"
              style={{
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            />
            <button
              onClick={() => {
                if (newBranchName) {
                  onCreateBranch(newBranchName);
                  setNewBranchName('');
                }
              }}
              disabled={!newBranchName}
              className="px-2 py-1 text-xs rounded bg-blue-500 text-white disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}
      
      {/* History entries */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div
            className="text-center py-8 text-sm"
            style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
          >
            No history yet
          </div>
        ) : (
          <div className="py-2">
            {[...entries].reverse().map((entry, reverseIndex) => {
              const index = entries.length - 1 - reverseIndex;
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;
              
              return (
                <button
                  key={entry.id}
                  onClick={() => onGoToEntry(entry.id)}
                  className={`w-full flex items-start gap-3 px-4 py-2 transition-colors ${
                    isCurrent
                      ? 'bg-blue-500/15'
                      : isFuture
                        ? 'opacity-50 hover:opacity-75'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCurrent ? 'bg-blue-500' : isFuture ? 'bg-gray-300' : 'bg-gray-400'
                      }`}
                    />
                    {reverseIndex < entries.length - 1 && (
                      <div
                        className="w-px flex-1 min-h-[20px]"
                        style={{
                          backgroundColor: isFuture
                            ? isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                            : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {actionTypeIcons[entry.actionType] || '•'}
                      </span>
                      <span
                        className="text-xs font-medium truncate"
                        style={{
                          color: isCurrent
                            ? '#3b82f6'
                            : isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                        }}
                      >
                        {entry.description}
                      </span>
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                    >
                      {formatTime(entry.timestamp)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer info */}
      <div
        className="px-4 py-2 border-t text-xs"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        }}
      >
        {entries.length} action{entries.length !== 1 ? 's' : ''} • Position: {currentIndex + 1}/{entries.length}
      </div>
    </div>
  );
}

export default useEnhancedUndoRedo;
