import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors } from '../../lib/themeColors';

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

interface Dataset {
  id: number;
  name: string;
  description: string | null;
}

interface EditDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  dataset: Dataset | null;
}

export default function EditDatasetModal({ isOpen, onClose, onSave, dataset }: EditDatasetModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const isMobile = useIsMobile();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (dataset) {
      setName(dataset.name || '');
      setDescription(dataset.description || '');
    }
  }, [dataset]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    onSave(name.trim(), description.trim() || '');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 50, padding: isMobile ? '0' : '1rem' }}>
      <div style={{ backgroundColor: colors.cardBg, borderRadius: isMobile ? '1rem 1rem 0 0' : '0.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: isMobile ? '100%' : '28rem', padding: isMobile ? '1.25rem' : '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: 600, color: colors.text }}>Edit Data Source</h2>
          <button
            onClick={onClose}
            style={{ color: colors.muted, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.875rem' : '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.375rem' }}>
              Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Data source name"
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text, fontSize: isMobile ? '1rem' : '0.875rem' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.375rem' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Data source description"
              rows={3}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text, resize: 'none', fontSize: isMobile ? '1rem' : '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'stretch' : 'flex-end', gap: '0.75rem', paddingTop: isMobile ? '0.75rem' : '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem', color: colors.text, backgroundColor: 'transparent', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s', fontSize: isMobile ? '0.9375rem' : '1rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', fontSize: isMobile ? '0.9375rem' : '1rem' }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
