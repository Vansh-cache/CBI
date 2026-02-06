import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors } from '../../lib/themeColors';

interface DashboardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { name: string; category: string; description: string }) => void;
  initialName?: string;
  initialCategory?: string;
  initialDescription?: string;
  saving?: boolean;
}

const CATEGORIES = [
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'HR',
  'IT',
  'Customer Service',
  'Analytics',
  'Other',
];

export default function DashboardDetailsModal({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialCategory = '',
  initialDescription = '',
  saving = false,
}: DashboardDetailsModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState(initialCategory);
  const [description, setDescription] = useState(initialDescription);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setCategory(initialCategory);
      setDescription(initialDescription);
      setErrors({});
    }
  }, [isOpen, initialName, initialCategory, initialDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Dashboard name is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[99999]" style={{ zIndex: 99999 }}>
      <div style={{ backgroundColor: colors.modalBg, borderColor: colors.cardBorder, zIndex: 100000 }} className="rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col relative border">
        <div style={{ borderColor: colors.cardBorder }} className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 style={{ color: colors.text }} className="text-xl font-semibold">Dashboard Details</h2>
            <p style={{ color: colors.muted }} className="text-sm mt-1">Enter dashboard information for reference</p>
          </div>
          <button
            onClick={onClose}
            style={{ color: colors.muted }}
            className="hover:opacity-70 transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Dashboard Name */}
            <div>
              <label htmlFor="name" style={{ color: colors.text }} className="block text-sm font-medium mb-2">
                Dashboard Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="e.g., Sales Performance Dashboard"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: errors.name ? '#ef4444' : colors.inputBorder,
                  color: colors.text
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                disabled={saving}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" style={{ color: colors.text }} className="block text-sm font-medium mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
                disabled={saving}
              >
                <option value="" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" style={{ color: colors.text }} className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this dashboard..."
                rows={4}
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                disabled={saving}
              />
            </div>
          </div>
        </form>

        <div style={{ borderColor: colors.cardBorder }} className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            disabled={saving}
            style={{ color: colors.text }}
            className="px-4 py-2 hover:opacity-70 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
