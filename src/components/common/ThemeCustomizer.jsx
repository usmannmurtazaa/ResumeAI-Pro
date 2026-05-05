import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FiSettings, FiSun, FiMoon, FiCheck, FiRotateCcw,
  FiMonitor, FiX
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_THEME = {
  primary: '#6366f1',  // Indigo
  accent: '#8b5cf6',   // Violet
};

const PRESET_THEMES = [
  { name: 'Default', primary: '#6366f1', accent: '#8b5cf6' },
  { name: 'Ocean', primary: '#0ea5e9', accent: '#06b6d4' },
  { name: 'Forest', primary: '#10b981', accent: '#34d399' },
  { name: 'Sunset', primary: '#f59e0b', accent: '#f97316' },
  { name: 'Rose', primary: '#ec4899', accent: '#f43f5e' },
  { name: 'Midnight', primary: '#6366f1', accent: '#312e81' },
  { name: 'Emerald', primary: '#059669', accent: '#047857' },
  { name: 'Coral', primary: '#f43f5e', accent: '#fb7185' },
];

const APPEARANCE_OPTIONS = [
  { value: 'light', icon: FiSun, label: 'Light' },
  { value: 'dark', icon: FiMoon, label: 'Dark' },
  { value: 'system', icon: FiMonitor, label: 'System' },
];

// ── Color Validation Utility ────────────────────────────────────────────────

const isValidHex = (hex) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);

const normalizeHex = (hex) => {
  if (!hex.startsWith('#')) hex = '#' + hex;
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex.toLowerCase();
};

// ── Component ──────────────────────────────────────────────────────────────

const ThemeCustomizer = () => {
  const { 
    theme: currentTheme, 
    setTheme, 
    isDark, 
    toggleTheme,
    appearance = 'system',
    setAppearance,
  } = useTheme?.() || {};

  const [isOpen, setIsOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(currentTheme || DEFAULT_THEME);
  const [previewAppearance, setPreviewAppearance] = useState(appearance || 'system');
  const [primaryInput, setPrimaryInput] = useState(currentTheme?.primary || DEFAULT_THEME.primary);
  const [accentInput, setAccentInput] = useState(currentTheme?.accent || DEFAULT_THEME.accent);
  const [primaryError, setPrimaryError] = useState(null);
  const [accentError, setAccentError] = useState(null);

  // Sync preview when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewTheme(currentTheme || DEFAULT_THEME);
      setPreviewAppearance(appearance || 'system');
      setPrimaryInput(currentTheme?.primary || DEFAULT_THEME.primary);
      setAccentInput(currentTheme?.accent || DEFAULT_THEME.accent);
      setPrimaryError(null);
      setAccentError(null);
    }
  }, [isOpen, currentTheme, appearance]);

  // Apply live preview of colors
  useEffect(() => {
    if (!isOpen) return;

    // Apply preview colors to CSS variables
    document.documentElement.style.setProperty('--color-primary', previewTheme.primary);
    document.documentElement.style.setProperty('--color-accent', previewTheme.accent);

    return () => {
      // Revert to actual theme on close
      if (currentTheme) {
        document.documentElement.style.setProperty('--color-primary', currentTheme.primary);
        document.documentElement.style.setProperty('--color-accent', currentTheme.accent);
      }
    };
  }, [previewTheme, isOpen, currentTheme]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handlePresetSelect = useCallback((preset) => {
    setPreviewTheme({ primary: preset.primary, accent: preset.accent });
    setPrimaryInput(preset.primary);
    setAccentInput(preset.accent);
    setPrimaryError(null);
    setAccentError(null);
  }, []);

  const handlePrimaryColorChange = useCallback((e) => {
    const value = e.target.value;
    setPrimaryInput(value);
    
    if (isValidHex(value)) {
      setPreviewTheme(prev => ({ ...prev, primary: normalizeHex(value) }));
      setPrimaryError(null);
    } else {
      setPrimaryError('Invalid hex color (e.g., #6366f1)');
    }
  }, []);

  const handleAccentColorChange = useCallback((e) => {
    const value = e.target.value;
    setAccentInput(value);
    
    if (isValidHex(value)) {
      setPreviewTheme(prev => ({ ...prev, accent: normalizeHex(value) }));
      setAccentError(null);
    } else {
      setAccentError('Invalid hex color (e.g., #8b5cf6)');
    }
  }, []);

  const handlePrimaryPickerChange = useCallback((e) => {
    const value = e.target.value;
    setPrimaryInput(value);
    setPreviewTheme(prev => ({ ...prev, primary: value }));
    setPrimaryError(null);
  }, []);

  const handleAccentPickerChange = useCallback((e) => {
    const value = e.target.value;
    setAccentInput(value);
    setPreviewTheme(prev => ({ ...prev, accent: value }));
    setAccentError(null);
  }, []);

  const handleAppearanceChange = useCallback((value) => {
    setPreviewAppearance(value);
  }, []);

  const handleApply = useCallback(() => {
    // Validate before applying
    if (primaryError || accentError) {
      toast.error('Please fix color errors before applying');
      return;
    }

    // Apply accent theme
    if (setTheme) {
      setTheme(previewTheme);
    }

    // Apply appearance
    if (setAppearance) {
      setAppearance(previewAppearance);
    }

    // Save to localStorage
    try {
      localStorage.setItem('customTheme', JSON.stringify(previewTheme));
      localStorage.setItem('appearance', previewAppearance);
    } catch {}

    setIsOpen(false);
    toast.success('Theme applied!', { icon: '🎨', duration: 2000 });
  }, [previewTheme, previewAppearance, primaryError, accentError, setTheme, setAppearance]);

  const handleReset = useCallback(() => {
    setPreviewTheme(DEFAULT_THEME);
    setPrimaryInput(DEFAULT_THEME.primary);
    setAccentInput(DEFAULT_THEME.accent);
    setPreviewAppearance('system');
    setPrimaryError(null);
    setAccentError(null);
    
    if (setTheme) setTheme(DEFAULT_THEME);
    if (setAppearance) setAppearance('system');
    
    try {
      localStorage.removeItem('customTheme');
      localStorage.removeItem('appearance');
    } catch {}
    
    toast.success('Theme reset to default', { duration: 2000 });
  }, [setTheme, setAppearance]);

  const isModified = 
    previewTheme.primary !== (currentTheme?.primary || DEFAULT_THEME.primary) ||
    previewTheme.accent !== (currentTheme?.accent || DEFAULT_THEME.accent) ||
    previewAppearance !== (appearance || 'system');

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all z-40 border border-gray-200 dark:border-gray-700 hover:scale-110"
        aria-label="Customize theme"
        title="Customize theme"
      >
        <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={
          <div className="flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-primary-500" />
            <span>Customize Theme</span>
          </div>
        }
        size="lg"
      >
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Live Preview</p>
            <div className="space-y-2">
              <div 
                className="h-2 rounded-full"
                style={{ background: `linear-gradient(to right, ${previewTheme.primary}, ${previewTheme.accent})` }}
              />
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: previewTheme.primary }} />
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: previewTheme.accent }} />
              </div>
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 text-xs text-white rounded-md"
                  style={{ backgroundColor: previewTheme.primary }}
                >
                  Primary
                </button>
                <button 
                  className="px-3 py-1 text-xs text-white rounded-md"
                  style={{ backgroundColor: previewTheme.accent }}
                >
                  Accent
                </button>
              </div>
            </div>
          </div>

          {/* Appearance Mode */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Appearance</h4>
            <div className="grid grid-cols-3 gap-2">
              {APPEARANCE_OPTIONS.map((option) => {
                const isSelected = previewAppearance === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAppearanceChange(option.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <option.icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Themes */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Preset Themes</h4>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_THEMES.map((preset) => {
                const isSelected = previewTheme.primary === preset.primary && previewTheme.accent === preset.accent;
                
                return (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      isSelected 
                        ? 'border-primary-500 ring-2 ring-primary-200' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-center gap-1 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full ring-1 ring-black/5"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full ring-1 ring-black/5"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className={`text-xs ${isSelected ? 'font-medium text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {preset.name}
                    </span>
                    {isSelected && (
                      <FiCheck className="w-3 h-3 text-primary-500 mx-auto mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Colors */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Custom Colors</h4>
            <div className="space-y-3">
              {/* Primary Color */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={previewTheme.primary}
                      onChange={handlePrimaryPickerChange}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                      aria-label="Primary color picker"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={primaryInput}
                      onChange={handlePrimaryColorChange}
                      placeholder="#6366f1"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        primaryError 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                          : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none`}
                      maxLength={7}
                    />
                    {primaryError && (
                      <p className="text-xs text-red-500 mt-1">{primaryError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={previewTheme.accent}
                      onChange={handleAccentPickerChange}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                      aria-label="Accent color picker"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={accentInput}
                      onChange={handleAccentColorChange}
                      placeholder="#8b5cf6"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        accentError 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                          : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none`}
                      maxLength={7}
                    />
                    {accentError && (
                      <p className="text-xs text-red-500 mt-1">{accentError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleReset}
              icon={<FiRotateCcw className="w-4 h-4" />}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              disabled={!!primaryError || !!accentError}
              icon={<FiCheck className="w-4 h-4" />}
              className="flex-1"
            >
              Apply Theme
            </Button>
          </div>

          {/* Unsaved Changes Indicator */}
          {isModified && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-amber-600 dark:text-amber-400 text-center"
            >
              You have unsaved changes
            </motion.p>
          )}
        </div>
      </Modal>
    </>
  );
};

export default React.memo(ThemeCustomizer);
