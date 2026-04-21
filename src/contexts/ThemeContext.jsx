import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

// ============================================
// PREDEFINED THEME PRESETS
// ============================================

export const themePresets = {
  default: {
    name: 'Default',
    primary: '#6366f1',
    accent: '#8b5cf6',
    gradient: 'from-indigo-500 to-purple-600',
  },
  ocean: {
    name: 'Ocean',
    primary: '#0ea5e9',
    accent: '#06b6d4',
    gradient: 'from-sky-500 to-cyan-500',
  },
  forest: {
    name: 'Forest',
    primary: '#10b981',
    accent: '#059669',
    gradient: 'from-emerald-500 to-green-600',
  },
  sunset: {
    name: 'Sunset',
    primary: '#f59e0b',
    accent: '#ef4444',
    gradient: 'from-amber-500 to-red-500',
  },
  rose: {
    name: 'Rose',
    primary: '#ec4899',
    accent: '#f43f5e',
    gradient: 'from-pink-500 to-rose-500',
  },
  midnight: {
    name: 'Midnight',
    primary: '#1e293b',
    accent: '#334155',
    gradient: 'from-slate-700 to-slate-900',
  },
  lavender: {
    name: 'Lavender',
    primary: '#a855f7',
    accent: '#d946ef',
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  mint: {
    name: 'Mint',
    primary: '#14b8a6',
    accent: '#2dd4bf',
    gradient: 'from-teal-500 to-emerald-400',
  },
};

// ============================================
// THEME MODES
// ============================================

export const ThemeModes = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// ============================================
// CONTEXT HOOK
// ============================================

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ============================================
// PROVIDER COMPONENT
// ============================================

export const ThemeProvider = ({ children }) => {
  // Custom theme colors
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('customTheme');
    return saved ? JSON.parse(saved) : { ...themePresets.default };
  });

  // Current theme preset name
  const [currentPreset, setCurrentPreset] = useState(() => {
    return localStorage.getItem('themePreset') || 'default';
  });

  // Theme mode (light/dark/system)
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || ThemeModes.SYSTEM;
  });

  // Actual dark mode state (computed)
  const [isDark, setIsDark] = useState(() => {
    if (themeMode === ThemeModes.SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return themeMode === ThemeModes.DARK;
  });

  // Font size preference
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });

  // Reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem('reducedMotion');
    return saved ? saved === 'true' : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // High contrast mode
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });

  // ============================================
  // APPLY CSS VARIABLES
  // ============================================

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme colors
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-accent', theme.accent);
    
    // Calculate and apply color variants
    root.style.setProperty('--color-primary-light', adjustColor(theme.primary, 20));
    root.style.setProperty('--color-primary-dark', adjustColor(theme.primary, -20));
    root.style.setProperty('--color-accent-light', adjustColor(theme.accent, 20));
    root.style.setProperty('--color-accent-dark', adjustColor(theme.accent, -20));

    // Save to localStorage
    localStorage.setItem('customTheme', JSON.stringify(theme));
  }, [theme]);

  // ============================================
  // APPLY DARK MODE
  // ============================================

  useEffect(() => {
    let isDarkMode = isDark;
    
    if (themeMode === ThemeModes.SYSTEM) {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('themeMode', themeMode);
  }, [themeMode, isDark]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode !== ThemeModes.SYSTEM) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // ============================================
  // APPLY FONT SIZE
  // ============================================

  useEffect(() => {
    const root = document.documentElement;
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px',
    };

    root.style.setProperty('--font-size-base', sizes[fontSize] || sizes.medium);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // ============================================
  // APPLY ACCESSIBILITY SETTINGS
  // ============================================

  useEffect(() => {
    const root = document.documentElement;
    
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    localStorage.setItem('reducedMotion', reducedMotion);

    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('highContrast', highContrast);
  }, [reducedMotion, highContrast]);

  // ============================================
  // THEME ACTIONS
  // ============================================

  const toggleTheme = useCallback(() => {
    if (themeMode === ThemeModes.SYSTEM) {
      setThemeMode(ThemeModes.LIGHT);
      setIsDark(false);
    } else if (themeMode === ThemeModes.LIGHT) {
      setThemeMode(ThemeModes.DARK);
      setIsDark(true);
    } else {
      setThemeMode(ThemeModes.SYSTEM);
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, [themeMode]);

  const setThemeModeDirect = useCallback((mode) => {
    setThemeMode(mode);
    if (mode === ThemeModes.LIGHT) {
      setIsDark(false);
    } else if (mode === ThemeModes.DARK) {
      setIsDark(true);
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  const applyPreset = useCallback((presetName) => {
    const preset = themePresets[presetName];
    if (preset) {
      setTheme({ ...preset });
      setCurrentPreset(presetName);
      localStorage.setItem('themePreset', presetName);
    }
  }, []);

  const updateThemeColor = useCallback((colorType, value) => {
    setTheme((prev) => ({
      ...prev,
      [colorType]: value,
    }));
    setCurrentPreset('custom');
    localStorage.setItem('themePreset', 'custom');
  }, []);

  const resetTheme = useCallback(() => {
    setTheme({ ...themePresets.default });
    setCurrentPreset('default');
    setThemeMode(ThemeModes.SYSTEM);
    setFontSize('medium');
    setReducedMotion(false);
    setHighContrast(false);
    localStorage.setItem('themePreset', 'default');
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const currentThemeName = useMemo(() => {
    if (currentPreset === 'custom') return 'Custom';
    return themePresets[currentPreset]?.name || 'Default';
  }, [currentPreset]);

  const isSystemDark = useMemo(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // Theme colors
    theme,
    setTheme,
    currentPreset,
    currentThemeName,
    
    // Theme mode
    themeMode,
    isDark,
    isSystemDark,
    
    // Accessibility
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
    
    // Actions
    toggleTheme,
    setThemeMode: setThemeModeDirect,
    applyPreset,
    updateThemeColor,
    resetTheme,
    
    // Constants
    themePresets,
    ThemeModes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Adjust color brightness
function adjustColor(hex, percent) {
  // Remove the hash if present
  hex = hex.replace(/^#/, '');

  // Parse the hex values
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

  // Adjust the values
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));

  // Convert back to hex
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default ThemeContext;