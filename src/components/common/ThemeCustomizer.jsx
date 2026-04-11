import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiX, FiCheck, FiSun, FiMoon, FiDroplet } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const ThemeCustomizer = () => {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const presetThemes = [
    { name: 'Default', primary: '#6366f1', accent: '#8b5cf6' },
    { name: 'Ocean', primary: '#0ea5e9', accent: '#06b6d4' },
    { name: 'Forest', primary: '#10b981', accent: '#34d399' },
    { name: 'Sunset', primary: '#f59e0b', accent: '#f97316' },
    { name: 'Rose', primary: '#ec4899', accent: '#f43f5e' },
    { name: 'Slate', primary: '#64748b', accent: '#475569' }
  ];

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('customTheme', JSON.stringify(newTheme));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 glass-card rounded-full shadow-lg hover:shadow-xl transition-all z-40"
      >
        <FiSettings className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Customize Theme" size="lg">
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div>
            <h4 className="font-medium mb-3">Appearance</h4>
            <div className="flex gap-3">
              <button
                onClick={() => !isDark && toggleTheme()}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  !isDark ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FiSun className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Light</span>
              </button>
              <button
                onClick={() => isDark && toggleTheme()}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  isDark ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FiMoon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Dark</span>
              </button>
            </div>
          </div>

          {/* Preset Themes */}
          <div>
            <h4 className="font-medium mb-3">Preset Themes</h4>
            <div className="grid grid-cols-3 gap-3">
              {presetThemes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleThemeChange(preset)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme.primary === preset.primary
                      ? 'border-primary-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <span className="text-sm">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div>
            <h4 className="font-medium mb-3">Custom Colors</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.primary}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primary}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.accent}
                    onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.accent}
                    onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={() => setIsOpen(false)} className="w-full">
            Apply Theme
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ThemeCustomizer;