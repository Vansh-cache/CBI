/**
 * Export Manager - Dashboard export to PNG, PDF, PowerPoint
 * Handles canvas capture and document generation
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    Download,
    Image,
    FileText,
    Presentation,
    Settings,
    Loader,
    Check,
    X,
    ChevronDown,
    Monitor,
    Tablet,
    Smartphone,
} from 'lucide-react';
import { DashboardPage } from '../../lib/dashboardPage';

// Export Format Types
export type ExportFormat = 'png' | 'pdf' | 'pptx';

// Export Options
export interface ExportOptions {
    format: ExportFormat;
    scale: number;
    quality: number;
    includeBackground: boolean;
    includeTitle: boolean;
    includeBorder: boolean;
    pageSize: 'auto' | 'A4' | 'letter' | 'custom';
    orientation: 'portrait' | 'landscape';
    margin: number;
    fileName: string;
    pages: 'current' | 'all' | 'selected';
    selectedPageIds?: string[];
}

// Default Export Options
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
    format: 'png',
    scale: 2,
    quality: 1,
    includeBackground: true,
    includeTitle: true,
    includeBorder: false,
    pageSize: 'auto',
    orientation: 'landscape',
    margin: 20,
    fileName: 'dashboard-export',
    pages: 'current',
};

// Export Dialog Props
interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => Promise<void>;
    pages: DashboardPage[];
    currentPageId: string;
    dashboardName: string;
    theme?: 'light' | 'dark';
}

// Export Progress
interface ExportProgress {
    status: 'idle' | 'preparing' | 'rendering' | 'generating' | 'complete' | 'error';
    progress: number;
    message: string;
    error?: string;
}

// Format Info
const FORMAT_INFO: Record<ExportFormat, {
    icon: React.FC<any>;
    label: string;
    description: string;
}> = {
    png: {
        icon: Image,
        label: 'PNG Image',
        description: 'High-quality image, best for sharing or embedding',
    },
    pdf: {
        icon: FileText,
        label: 'PDF Document',
        description: 'Multi-page document, best for printing',
    },
    pptx: {
        icon: Presentation,
        label: 'PowerPoint',
        description: 'Editable presentation slides',
    },
};

// Export Dialog Component
export const ExportDialog: React.FC<ExportDialogProps> = ({
    isOpen,
    onClose,
    onExport,
    pages,
    currentPageId,
    dashboardName,
    theme = 'light',
}) => {
    const [options, setOptions] = useState<ExportOptions>({
        ...DEFAULT_EXPORT_OPTIONS,
        fileName: dashboardName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
    });
    const [progress, setProgress] = useState<ExportProgress>({
        status: 'idle',
        progress: 0,
        message: '',
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        setProgress({ status: 'preparing', progress: 10, message: 'Preparing export...' });

        try {
            setProgress({ status: 'rendering', progress: 30, message: 'Rendering visuals...' });

            await new Promise(resolve => setTimeout(resolve, 500)); // Simulated delay

            setProgress({ status: 'generating', progress: 70, message: 'Generating file...' });

            await onExport(options);

            setProgress({ status: 'complete', progress: 100, message: 'Export complete!' });

            setTimeout(() => {
                onClose();
                setProgress({ status: 'idle', progress: 0, message: '' });
            }, 1500);
        } catch (error) {
            setProgress({
                status: 'error',
                progress: 0,
                message: 'Export failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const currentPage = pages.find(p => p.id === currentPageId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div
                className={`
          w-full max-w-lg rounded-xl shadow-2xl
          ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
        `}
            >
                {/* Header */}
                <div
                    className={`
            flex items-center justify-between px-6 py-4 border-b
            ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
          `}
                >
                    <div className="flex items-center gap-3">
                        <Download className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                        <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Export Dashboard
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            Export Format
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.keys(FORMAT_INFO) as ExportFormat[]).map(format => {
                                const { icon: Icon, label, description } = FORMAT_INFO[format];
                                const isSelected = options.format === format;

                                return (
                                    <button
                                        key={format}
                                        onClick={() => setOptions({ ...options, format })}
                                        className={`
                      p-4 rounded-lg border text-left transition-all
                      ${isSelected
                                                ? theme === 'dark'
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-blue-500 bg-blue-50'
                                                : theme === 'dark'
                                                    ? 'border-gray-600 hover:border-gray-500'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }
                    `}
                                    >
                                        <Icon
                                            className={`w-6 h-6 mb-2 ${isSelected ? 'text-blue-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                                        />
                                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {label}
                                        </div>
                                        <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {description}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pages Selection */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            Pages to Export
                        </label>
                        <div className="space-y-2">
                            {(['current', 'all'] as const).map(pageOption => (
                                <label
                                    key={pageOption}
                                    className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                    ${options.pages === pageOption
                                            ? theme === 'dark'
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-blue-500 bg-blue-50'
                                            : theme === 'dark'
                                                ? 'border-gray-600 hover:border-gray-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }
                  `}
                                >
                                    <input
                                        type="radio"
                                        checked={options.pages === pageOption}
                                        onChange={() => setOptions({ ...options, pages: pageOption })}
                                        className="sr-only"
                                    />
                                    <div
                                        className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${options.pages === pageOption
                                                ? 'border-blue-500'
                                                : theme === 'dark' ? 'border-gray-500' : 'border-gray-300'
                                            }
                    `}
                                    >
                                        {options.pages === pageOption && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {pageOption === 'current' ? 'Current page' : 'All pages'}
                                        </div>
                                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {pageOption === 'current'
                                                ? currentPage?.name
                                                : `${pages.length} page${pages.length !== 1 ? 's' : ''}`
                                            }
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* File Name */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            File Name
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={options.fileName}
                                onChange={(e) => setOptions({ ...options, fileName: e.target.value })}
                                className={`
                  flex-1 px-3 py-2 border rounded-lg text-sm
                  ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-200 text-gray-900'}
                `}
                            />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                .{options.format}
                            </span>
                        </div>
                    </div>

                    {/* Advanced Options Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`
              flex items-center gap-2 text-sm
              ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
            `}
                    >
                        <Settings className="w-4 h-4" />
                        Advanced options
                        <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div
                            className={`
                p-4 rounded-lg space-y-4
                ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}
              `}
                        >
                            {/* Scale */}
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Resolution Scale ({options.scale}x)
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="4"
                                    step="0.5"
                                    value={options.scale}
                                    onChange={(e) => setOptions({ ...options, scale: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs mt-1">
                                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>1x</span>
                                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>4x</span>
                                </div>
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-2">
                                {[
                                    { key: 'includeBackground', label: 'Include background' },
                                    { key: 'includeTitle', label: 'Include page title' },
                                    { key: 'includeBorder', label: 'Add border' },
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options[key as keyof ExportOptions] as boolean}
                                            onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                                            className="rounded border-gray-300"
                                        />
                                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {label}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* PDF-specific options */}
                            {options.format === 'pdf' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Page Size
                                        </label>
                                        <select
                                            value={options.pageSize}
                                            onChange={(e) => setOptions({ ...options, pageSize: e.target.value as any })}
                                            className={`
                        w-full px-2 py-1.5 text-sm border rounded
                        ${theme === 'dark'
                                                    ? 'bg-gray-700 border-gray-600 text-white'
                                                    : 'bg-white border-gray-200 text-gray-900'}
                      `}
                                        >
                                            <option value="auto">Auto</option>
                                            <option value="A4">A4</option>
                                            <option value="letter">Letter</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Orientation
                                        </label>
                                        <select
                                            value={options.orientation}
                                            onChange={(e) => setOptions({ ...options, orientation: e.target.value as any })}
                                            className={`
                        w-full px-2 py-1.5 text-sm border rounded
                        ${theme === 'dark'
                                                    ? 'bg-gray-700 border-gray-600 text-white'
                                                    : 'bg-white border-gray-200 text-gray-900'}
                      `}
                                        >
                                            <option value="landscape">Landscape</option>
                                            <option value="portrait">Portrait</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress */}
                    {progress.status !== 'idle' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                    {progress.message}
                                </span>
                                {progress.status === 'complete' ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : progress.status === 'error' ? (
                                    <X className="w-5 h-5 text-red-500" />
                                ) : (
                                    <Loader className="w-5 h-5 animate-spin text-blue-500" />
                                )}
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div
                                    className={`h-full transition-all duration-300 ${progress.status === 'complete' ? 'bg-green-500' :
                                            progress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${progress.progress}%` }}
                                />
                            </div>
                            {progress.error && (
                                <p className="text-sm text-red-500">{progress.error}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className={`
            flex items-center justify-end gap-3 px-6 py-4 border-t
            ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
          `}
                >
                    <button
                        onClick={onClose}
                        className={`
              px-4 py-2 text-sm font-medium rounded-lg
              ${theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-700'
                                : 'text-gray-700 hover:bg-gray-100'}
            `}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={progress.status !== 'idle' && progress.status !== 'error'}
                        className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
              bg-blue-500 text-white hover:bg-blue-600
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};

// Utility function to capture canvas as image
export const captureCanvasAsImage = async (
    canvasElement: HTMLElement,
    options: ExportOptions
): Promise<Blob> => {
    // Dynamic import html2canvas to reduce bundle size
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(canvasElement, {
        scale: options.scale,
        backgroundColor: options.includeBackground ? null : '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
    });

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create image blob'));
                }
            },
            'image/png',
            options.quality
        );
    });
};

// Utility function to download file
export const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Export to PNG
export const exportToPng = async (
    canvasElement: HTMLElement,
    options: ExportOptions
): Promise<void> => {
    const blob = await captureCanvasAsImage(canvasElement, options);
    downloadFile(blob, `${options.fileName}.png`);
};

// Export to PDF (requires jspdf)
export const exportToPdf = async (
    canvasElements: HTMLElement[],
    options: ExportOptions,
    pageNames: string[]
): Promise<void> => {
    // Dynamic imports
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({
        orientation: options.orientation,
        unit: 'px',
        format: options.pageSize === 'auto' ? 'a4' : options.pageSize.toLowerCase() as any,
    });

    for (let i = 0; i < canvasElements.length; i++) {
        if (i > 0) {
            pdf.addPage();
        }

        const canvas = await html2canvas(canvasElements[i], {
            scale: options.scale,
            backgroundColor: options.includeBackground ? null : '#ffffff',
            logging: false,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const margin = options.margin;
        const titleHeight = options.includeTitle ? 30 : 0;

        // Add title
        if (options.includeTitle && pageNames[i]) {
            pdf.setFontSize(14);
            pdf.text(pageNames[i], margin, margin + 10);
        }

        // Calculate image dimensions
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add image
        pdf.addImage(
            imgData,
            'PNG',
            margin,
            margin + titleHeight,
            imgWidth,
            Math.min(imgHeight, pageHeight - (margin * 2) - titleHeight)
        );
    }

    pdf.save(`${options.fileName}.pdf`);
};

// Quick Export Button Component
interface QuickExportButtonProps {
    onExport: (format: ExportFormat) => void;
    theme?: 'light' | 'dark';
}

export const QuickExportButton: React.FC<QuickExportButtonProps> = ({
    onExport,
    theme = 'light',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 text-sm rounded-lg
          ${theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
        `}
            >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div
                        className={`
              absolute right-0 top-full mt-1 z-20 py-1 min-w-[160px] rounded-lg shadow-lg border
              ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}
                    >
                        {(Object.keys(FORMAT_INFO) as ExportFormat[]).map(format => {
                            const { icon: Icon, label } = FORMAT_INFO[format];
                            return (
                                <button
                                    key={format}
                                    onClick={() => {
                                        onExport(format);
                                        setIsOpen(false);
                                    }}
                                    className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                    ${theme === 'dark'
                                            ? 'text-gray-200 hover:bg-gray-700'
                                            : 'text-gray-700 hover:bg-gray-100'}
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportDialog;
