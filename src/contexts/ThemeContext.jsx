import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────

export const ThemeModes = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const FONT_SIZES = {
  small: '14px',
  medium: '16px',
  large: '18px',
  'x-large': '20px',
};

export const themePresets = {
  default: { name: 'Default', primary: '#6366f1', accent: '#8b5cf6' },
  ocean: { name: 'Ocean', primary: '#0ea5e9', accent: '#06b6d4' },
  forest: { name: 'Forest', primary: '#10b981', accent: '#059669' },
  sunset: { name: 'Sunset', primary: '#f59e0b', accent: '#ef4444' },
  rose: { name: 'Rose', primary: '#ec4899', accent: '#f43f5e' },
  midnight: { name: 'Midnight', primary: '#1e293b', accent: '#334155' },
  lavender: { name: 'Lavender', primary: '#a855f7', accent: '#d946ef' },
  mint: { name: 'Mint', primary: '#14b8a6', accent: '#2dd4bf' },
};

// ── Context ───────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ── Utility Functions ────────────────────────────────────────────────────

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const adjustColor = (hex, percent) => {
  hex = hex.replace(/^#/, '');

  // Normalize 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const num = parseInt(hex, 16);
  const r = clamp((num >> 16) + percent, 0, 255);
  const g = clamp(((num >> 8) & 0x00ff) + percent, 0, 255);
  const b = clamp((num & 0x0000ff) + percent, 0, 255);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

const resolveIsDark = (mode, systemPrefersDark) => {
  if (mode === ThemeModes.DARK) return true;
  if (mode === ThemeModes.LIGHT) return false;
  return systemPrefersDark;
};

// ── Provider ──────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }) => {
  // ── State ────────────────────────────────────────────────────────────

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('customTheme');
      return saved ? JSON.parse(saved) : { ...themePresets.default };
    } catch {
      return { ...themePresets.default };
    }
  });

  const [currentPreset, setCurrentPreset] = useState(() => {
    try {
      return localStorage.getItem('themePreset') || 'default';
    } catch {
      return 'default';
    }
  });

  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('themeMode');
      return saved || ThemeModes.SYSTEM;
    } catch {
      return ThemeModes.SYSTEM;
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [fontSize, setFontSizeState] = useState(() => {
    try {
      return localStorage.getItem('fontSize') || 'medium';
    } catch {
      return 'medium';
    }
  });

  const [reducedMotion, setReducedMotionState] = useState(() => {
    try {
      const saved = localStorage.getItem('reducedMotion');
      if (saved !== null) return saved === 'true';
    } catch {}
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [highContrast, setHighContrastState] = useState(() => {
    try {
      return localStorage.getItem('highContrast') === 'true';
    } catch {
      return false;
    }
  });

  // Derived dark mode state
  const isDark = resolveIsDark(themeMode, systemPrefersDark);

  // ── System Preference Listener ──────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      setSystemPrefersDark(e.matches);
    };

    // Set initial value
    setSystemPrefersDark(mediaQuery.matches);

    // Modern browsers
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // ── Apply CSS Variables (Theme Colors) ──────────────────────────────

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-primary-light', adjustColor(theme.primary, 30));
    root.style.setProperty('--color-primary-dark', adjustColor(theme.primary, -30));
    root.style.setProperty('--color-accent-light', adjustColor(theme.accent, 30));
    root.style.setProperty('--color-accent-dark', adjustColor(theme.accent, -30));

    try {
      localStorage.setItem('customTheme', JSON.stringify(theme));
    } catch {}
  }, [theme]);

  // ── Apply Dark Mode ─────────────────────────────────────────────────

  useEffect(() => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    try {
      localStorage.setItem('themeMode', themeMode);
    } catch {}
  }, [isDark, themeMode]);

  // ── Apply Font Size ─────────────────────────────────────────────────

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-size-base', FONT_SIZES[fontSize] || FONT_SIZES.medium);

    try {
      localStorage.setItem('fontSize', fontSize);
    } catch {}
  }, [fontSize]);

  // ── Apply Accessibility Settings ────────────────────────────────────

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', reducedMotion);
    root.classList.toggle('high-contrast', highContrast);

    try {
      localStorage.setItem('reducedMotion', String(reducedMotion));
      localStorage.setItem('highContrast', String(highContrast));
    } catch {}
  }, [reducedMotion, highContrast]);

  // ── Theme Actions ───────────────────────────────────────────────────

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      if (prev === ThemeModes.SYSTEM) return ThemeModes.LIGHT;
      if (prev === ThemeModes.LIGHT) return ThemeModes.DARK;
      return ThemeModes.SYSTEM;
    });
  }, []);

  const setThemeMode = useCallback((mode) => {
    if (Object.values(ThemeModes).includes(mode)) {
      setThemeModeState(mode);
    }
  }, []);

  const applyPreset = useCallback((presetName) => {
    const preset = themePresets[presetName];
    if (preset) {
      setTheme({ ...preset });
      setCurrentPreset(presetName);
      try {
        localStorage.setItem('themePreset', presetName);
      } catch {}
    }
  }, []);

  const updateThemeColor = useCallback((colorType, value) => {
    setTheme((prev) => ({ ...prev, [colorType]: value }));
    setCurrentPreset('custom');
    try {
      localStorage.setItem('themePreset', 'custom');
    } catch {}
  }, []);

  const setFontSize = useCallback((size) => {
    if (size in FONT_SIZES) {
      setFontSizeState(size);
    }
  }, []);

  const setReducedMotion = useCallback((value) => {
    setReducedMotionState(Boolean(value));
  }, []);

  const setHighContrast = useCallback((value) => {
    setHighContrastState(Boolean(value));
  }, []);

  const resetTheme = useCallback(() => {
    setTheme({ ...themePresets.default });
    setCurrentPreset('default');
    setThemeModeState(ThemeModes.SYSTEM);
    setFontSizeState('medium');
    setReducedMotionState(false);
    setHighContrastState(false);
    try {
      localStorage.setItem('themePreset', 'default');
      localStorage.setItem('themeMode', ThemeModes.SYSTEM);
      localStorage.setItem('fontSize', 'medium');
      localStorage.setItem('reducedMotion', 'false');
      localStorage.setItem('highContrast', 'false');
      localStorage.removeItem('customTheme');
    } catch {}
  }, []);

  // ── Computed Values ─────────────────────────────────────────────────

  const currentThemeName = useMemo(() => {
    if (currentPreset === 'custom') return 'Custom';
    return themePresets[currentPreset]?.name || 'Default';
  }, [currentPreset]);

  // ── Context Value ───────────────────────────────────────────────────

  const value = useMemo(() => ({
    theme,
    setTheme,
    currentPreset,
    currentThemeName,
    themeMode,
    isDark,
    systemPrefersDark,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
    toggleTheme,
    setThemeMode,
    applyPreset,
    updateThemeColor,
    resetTheme,
    themePresets,
    ThemeModes,
  }), [
    theme, currentPreset, currentThemeName,
    themeMode, isDark, systemPrefersDark,
    fontSize, reducedMotion, highContrast,
    toggleTheme, setThemeMode, applyPreset, updateThemeColor, resetTheme,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
