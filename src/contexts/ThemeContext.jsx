import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ── Context ───────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ── Constants ─────────────────────────────────────────────────────────────

export const ThemeModes = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const themePresets = {
  default: { name: 'Default', primary: '#6366f1', accent: '#8b5cf6', gradient: 'from-indigo-500 to-purple-600' },
  ocean: { name: 'Ocean', primary: '#0ea5e9', accent: '#06b6d4', gradient: 'from-sky-500 to-cyan-500' },
  forest: { name: 'Forest', primary: '#10b981', accent: '#059669', gradient: 'from-emerald-500 to-green-600' },
  sunset: { name: 'Sunset', primary: '#f59e0b', accent: '#ef4444', gradient: 'from-amber-500 to-red-500' },
  rose: { name: 'Rose', primary: '#ec4899', accent: '#f43f5e', gradient: 'from-pink-500 to-rose-500' },
  midnight: { name: 'Midnight', primary: '#1e293b', accent: '#334155', gradient: 'from-slate-700 to-slate-900' },
  lavender: { name: 'Lavender', primary: '#a855f7', accent: '#d946ef', gradient: 'from-purple-500 to-fuchsia-500' },
  mint: { name: 'Mint', primary: '#14b8a6', accent: '#2dd4bf', gradient: 'from-teal-500 to-emerald-400' },
};

// ── Utility Functions ────────────────────────────────────────────────────

const adjustColor = (hex, percent) => {
  hex = hex.replace(/^#/, '');
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getSystemDarkMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getSystemReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const safeGetLocalStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : fallback;
  } catch {
    return fallback;
  }
};

const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

// ── Provider ──────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }) => {
  // Theme colors
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('customTheme');
      return saved ? JSON.parse(saved) : { ...themePresets.default };
    } catch {
      return { ...themePresets.default };
    }
  });

  const [currentPreset, setCurrentPreset] = useState(() => {
    return safeGetLocalStorage('themePreset', 'default');
  });

  // Theme mode
  const [themeMode, setThemeModeState] = useState(() => {
    return safeGetLocalStorage('themeMode', ThemeModes.SYSTEM);
  });

  // Dark mode (derived)
  const [isDark, setIsDark] = useState(() => {
    const mode = safeGetLocalStorage('themeMode', ThemeModes.SYSTEM);
    return mode === ThemeModes.SYSTEM ? getSystemDarkMode() : mode === ThemeModes.DARK;
  });

  // Accessibility
  const [fontSize, setFontSizeState] = useState(() => {
    return safeGetLocalStorage('fontSize', 'medium');
  });

  const [reducedMotion, setReducedMotionState] = useState(() => {
    const saved = safeGetLocalStorage('reducedMotion', null);
    return saved !== null ? saved === 'true' : getSystemReducedMotion();
  });

  const [highContrast, setHighContrastState] = useState(() => {
    return safeGetLocalStorage('highContrast', 'false') === 'true';
  });

  // ── FIXED: Live system preference listeners ────────────────────────

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (themeMode === ThemeModes.SYSTEM) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      const saved = safeGetLocalStorage('reducedMotion', null);
      if (saved === null) {
        setReducedMotionState(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ── Apply CSS Variables ──────────────────────────────────────────────

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-primary-light', adjustColor(theme.primary, 20));
    root.style.setProperty('--color-primary-dark', adjustColor(theme.primary, -20));
    root.style.setProperty('--color-accent-light', adjustColor(theme.accent, 20));
    root.style.setProperty('--color-accent-dark', adjustColor(theme.accent, -20));
    safeSetLocalStorage('customTheme', JSON.stringify(theme));
  }, [theme]);

  // ── Apply Dark Mode ──────────────────────────────────────────────────

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    safeSetLocalStorage('themeMode', themeMode);
  }, [isDark, themeMode]);

  // ── Apply Font Size ──────────────────────────────────────────────────

  useEffect(() => {
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--font-size-base', sizes[fontSize] || '16px');
    document.documentElement.setAttribute('data-font-size', fontSize);
    safeSetLocalStorage('fontSize', fontSize);
  }, [fontSize]);

  // ── Apply Accessibility ──────────────────────────────────────────────

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    safeSetLocalStorage('reducedMotion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    safeSetLocalStorage('highContrast', String(highContrast));
  }, [highContrast]);

  // ── FIXED: Simpler toggleTheme (Light ↔ Dark only) ──────────────────

  const toggleTheme = useCallback(() => {
    if (isDark) {
      setIsDark(false);
      setThemeModeState(ThemeModes.LIGHT);
    } else {
      setIsDark(true);
      setThemeModeState(ThemeModes.DARK);
    }
  }, [isDark]);

  const setThemeMode = useCallback((mode) => {
    setThemeModeState(mode);
    if (mode === ThemeModes.LIGHT) setIsDark(false);
    else if (mode === ThemeModes.DARK) setIsDark(true);
    else setIsDark(getSystemDarkMode());
  }, []);

  const setFontSize = useCallback((size) => setFontSizeState(size), []);
  const setReducedMotion = useCallback((value) => setReducedMotionState(value), []);
  const setHighContrast = useCallback((value) => setHighContrastState(value), []);

  const applyPreset = useCallback((presetName) => {
    const preset = themePresets[presetName];
    if (preset) {
      setTheme({ ...preset });
      setCurrentPreset(presetName);
      safeSetLocalStorage('themePreset', presetName);
    }
  }, []);

  const updateThemeColor = useCallback((colorType, value) => {
    setTheme((prev) => ({ ...prev, [colorType]: value }));
    setCurrentPreset('custom');
    safeSetLocalStorage('themePreset', 'custom');
  }, []);

  const resetTheme = useCallback(() => {
    setTheme({ ...themePresets.default });
    setCurrentPreset('default');
    setThemeModeState(ThemeModes.SYSTEM);
    setIsDark(getSystemDarkMode());
    setFontSizeState('medium');
    setReducedMotionState(getSystemReducedMotion());
    setHighContrastState(false);
    safeSetLocalStorage('themePreset', 'default');
  }, []);

  // ── Computed Values ──────────────────────────────────────────────────

  const currentThemeName = useMemo(() => {
    return currentPreset === 'custom' ? 'Custom' : themePresets[currentPreset]?.name || 'Default';
  }, [currentPreset]);

  // ── Context Value ────────────────────────────────────────────────────

  const value = useMemo(() => ({
    theme, setTheme, currentPreset, currentThemeName,
    themeMode, isDark,
    fontSize, setFontSize,
    reducedMotion, setReducedMotion,
    highContrast, setHighContrast,
    toggleTheme, setThemeMode, applyPreset, updateThemeColor, resetTheme,
    themePresets, ThemeModes,
  }), [
    theme, currentPreset, currentThemeName,
    themeMode, isDark,
    fontSize, reducedMotion, highContrast,
    toggleTheme, setThemeMode, applyPreset, updateThemeColor, resetTheme,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;