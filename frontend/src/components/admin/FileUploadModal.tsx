import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette } from '../../lib/themeColors';

// Mobile detection hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: { name: string; type: string; fileName: string; fileSize: number; uploadedAt: string }) => void;
  /** When provided, called with (file, name) to perform actual upload. Modal closes on success. */
  onUpload?: (file: File, name: string) => Promise<void>;
}

export default function FileUploadModal({ isOpen, onClose, onSave, onUpload }: FileUploadModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);
  const isMobile = useIsMobile();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataSourceName, setDataSourceName] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDataSourceName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !dataSourceName.trim()) {
      setErrorMessage('Please select a file and provide a name');
      setUploadStatus('error');
      return;
    }

    if (onUpload) {
      setUploadStatus('loading');
      setErrorMessage('');
      try {
        await onUpload(selectedFile, dataSourceName.trim());
        setUploadStatus('success');
        setTimeout(handleClose, 800);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : 'Upload failed');
        setUploadStatus('error');
      }
      return;
    }

    setUploadStatus('success');
    setTimeout(() => {
      onSave?.({
        name: dataSourceName,
        type: getFileType(selectedFile.name),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      });
      handleClose();
    }, 1000);
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return 'Excel';
    if (ext === 'csv') return 'CSV';
    if (ext === 'json') return 'JSON';
    if (ext === 'xml') return 'XML';
    return 'File';
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDataSourceName('');
    setUploadStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setDataSourceName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: isMobile ? '0' : '1rem' }}>
      <div style={{ backgroundColor: colors.cardBg, borderRadius: isMobile ? '1rem 1rem 0 0' : '0.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: isMobile ? '100%' : '32rem', maxHeight: isMobile ? '90vh' : 'none', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '1rem' : '1rem 1.5rem', borderBottom: `1px solid ${colors.cardBorder}` }}>
          <h2 style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: 600, color: colors.text }}>Upload Data File</h2>
          <button
            onClick={handleClose}
            style={{ padding: '0.25rem', color: colors.muted, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Data Source Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.375rem' }}>
              Data Source Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={dataSourceName}
              onChange={(e) => setDataSourceName(e.target.value)}
              placeholder="e.g., Sales Data Q1 2024"
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text, fontSize: isMobile ? '1rem' : '0.875rem' }}
            />
          </div>

          {/* File Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.375rem' }}>
              Data File <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{ border: `2px dashed ${colors.inputBorder}`, borderRadius: '0.5rem', padding: isMobile ? '1.5rem 1rem' : '2rem', textAlign: 'center', transition: 'border-color 0.2s' }}
            >
              <Upload style={{ width: isMobile ? '2.5rem' : '3rem', height: isMobile ? '2.5rem' : '3rem', color: colors.muted, margin: '0 auto 0.75rem' }} />
              <label style={{ cursor: 'pointer' }}>
                <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                  {isMobile ? 'Tap to upload' : 'Click to upload'}
                </span>
                <span style={{ fontSize: '0.875rem', color: colors.muted }}>{isMobile ? '' : ' or drag and drop'}</span>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept=".xlsx,.xls,.csv,.json,.xml,.txt"
                />
              </label>
              <p style={{ fontSize: '0.75rem', color: colors.muted, marginTop: '0.5rem' }}>
                Excel, CSV, JSON, XML, TXT
              </p>
            </div>
            {selectedFile && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: colors.text, backgroundColor: palette.gray.bg, padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                <FileSpreadsheet style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', marginRight: '0.5rem', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
                  <p style={{ color: colors.muted }}>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', marginLeft: '0.5rem', flexShrink: 0 }} />
              </div>
            )}
          </div>

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: palette.green.text, backgroundColor: palette.green.bg, padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
              <CheckCircle style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
              File uploaded successfully!
            </div>
          )}

          {uploadStatus === 'error' && errorMessage && (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: palette.red.text, backgroundColor: palette.red.bg, padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
              {errorMessage}
            </div>
          )}

          {/* Instructions - hide on mobile to save space */}
          {!isMobile && (
            <div style={{ backgroundColor: palette.blue.bg, border: `1px solid ${isDark ? '#1e40af' : '#bfdbfe'}`, borderRadius: '0.5rem', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: palette.blue.text, marginBottom: '0.5rem' }}>Supported File Formats:</h4>
              <ul style={{ fontSize: '0.75rem', color: palette.blue.text, paddingLeft: '1rem', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li><strong>Excel:</strong> .xlsx, .xls (with headers in first row)</li>
                <li><strong>CSV:</strong> Comma-separated values</li>
                <li><strong>JSON:</strong> Array of objects or nested data</li>
                <li><strong>XML:</strong> Structured XML data</li>
                <li><strong>Text:</strong> Tab or comma delimited</li>
              </ul>
              <p style={{ fontSize: '0.75rem', color: palette.blue.text, marginTop: '0.5rem' }}>
                Maximum file size: 10MB
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'stretch' : 'flex-end', gap: '0.75rem', padding: isMobile ? '1rem' : '1rem 1.5rem', borderTop: `1px solid ${colors.cardBorder}`, backgroundColor: colors.tableBg }}>
          <button
            onClick={handleClose}
            style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem', color: colors.text, backgroundColor: 'transparent', border: `1px solid ${colors.cardBorder}`, borderRadius: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s', fontSize: isMobile ? '0.9375rem' : '1rem' }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !dataSourceName.trim() || uploadStatus === 'loading'}
            style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!selectedFile || !dataSourceName.trim() || uploadStatus === 'loading') ? 0.5 : 1, transition: 'background-color 0.2s', fontSize: isMobile ? '0.9375rem' : '1rem' }}
          >
            {uploadStatus === 'loading' ? (
              <span>Uploading...</span>
            ) : (
              <>
                <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
