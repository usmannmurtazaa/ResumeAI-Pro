import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

// ── Inline Hooks (Self-contained) ────────────────────────────────────────

/**
 * Monitors online/offline status.
 */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Debounced callback hook.
 */
const useDebouncedCallback = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedFn;
};

// ── Context ───────────────────────────────────────────────────────────────

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// ── Constants ─────────────────────────────────────────────────────────────

export const SettingsCategories = {
  NOTIFICATIONS: 'notifications',
  PRIVACY: 'privacy',
  APPEARANCE: 'appearance',
  EDITOR: 'editor',
  REGIONAL: 'regional',
  STORAGE: 'storage',
  AI: 'ai',
  ADVANCED: 'advanced',
};

export const CategoryLabels = {
  [SettingsCategories.NOTIFICATIONS]: 'Notifications',
  [SettingsCategories.PRIVACY]: 'Privacy & Security',
  [SettingsCategories.APPEARANCE]: 'Appearance',
  [SettingsCategories.EDITOR]: 'Editor Preferences',
  [SettingsCategories.REGIONAL]: 'Regional Settings',
  [SettingsCategories.STORAGE]: 'Data & Storage',
  [SettingsCategories.AI]: 'AI Features',
  [SettingsCategories.ADVANCED]: 'Advanced',
};

export const settingDefinitions = {
  // Notifications
  emailNotifications: { category: 'notifications', type: 'boolean', default: true },
  pushNotifications: { category: 'notifications', type: 'boolean', default: true },
  resumeUpdates: { category: 'notifications', type: 'boolean', default: true },
  atsScoreAlerts: { category: 'notifications', type: 'boolean', default: true },
  marketingEmails: { category: 'notifications', type: 'boolean', default: false },
  weeklyDigest: { category: 'notifications', type: 'boolean', default: true },
  soundEnabled: { category: 'notifications', type: 'boolean', default: true },
  desktopNotifications: { category: 'notifications', type: 'boolean', default: false },

  // Privacy
  sessionTimeout: { category: 'privacy', type: 'select', options: ['15', '30', '60', '120', 'never'], default: '30' },
  showEmail: { category: 'privacy', type: 'boolean', default: false },
  dataCollection: { category: 'privacy', type: 'boolean', default: true },

  // Appearance
  theme: { category: 'appearance', type: 'select', options: ['light', 'dark', 'system'], default: 'system' },
  fontSize: { category: 'appearance', type: 'select', options: ['small', 'medium', 'large'], default: 'medium' },
  compactMode: { category: 'appearance', type: 'boolean', default: false },
  reducedMotion: { category: 'appearance', type: 'boolean', default: false },

  // Editor
  autoSave: { category: 'editor', type: 'boolean', default: true },
  autoSaveInterval: { category: 'editor', type: 'select', options: ['10', '30', '60', '120'], default: '30' },
  defaultTemplate: { category: 'editor', type: 'select', options: ['modern', 'classic', 'creative', 'minimal', 'executive', 'tech'], default: 'modern' },
  spellCheck: { category: 'editor', type: 'boolean', default: true },
  showATSScore: { category: 'editor', type: 'boolean', default: true },

  // Regional
  language: { category: 'regional', type: 'select', options: ['en', 'es', 'fr', 'de', 'zh', 'ja'], default: 'en' },
  dateFormat: { category: 'regional', type: 'select', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], default: 'MM/DD/YYYY' },
  timeFormat: { category: 'regional', type: 'select', options: ['12h', '24h'], default: '12h' },
  currency: { category: 'regional', type: 'select', options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'], default: 'USD' },

  // Storage
  offlineMode: { category: 'storage', type: 'boolean', default: true },
  compressImages: { category: 'storage', type: 'boolean', default: true },

  // AI
  aiSuggestions: { category: 'ai', type: 'boolean', default: true },
  aiKeywordOptimization: { category: 'ai', type: 'boolean', default: true },

  // Advanced
  debugMode: { category: 'advanced', type: 'boolean', default: false },
  experimentalFeatures: { category: 'advanced', type: 'boolean', default: false },
};

// ── Utilities ────────────────────────────────────────────────────────────

const validateSetting = (key, value) => {
  const def = settingDefinitions[key];
  if (!def) return true;
  if (def.type === 'boolean') return typeof value === 'boolean';
  if (def.type === 'select') return def.options.includes(value);
  return true;
};

const generateDefaultSettings = () => {
  const defaults = {};
  Object.entries(settingDefinitions).forEach(([key, def]) => {
    defaults[key] = def.default;
  });
  return defaults;
};

const defaultSettings = generateDefaultSettings();

// ── Provider ──────────────────────────────────────────────────────────────

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const { toggleTheme, setThemeMode } = useTheme();
  const isOnline = useOnlineStatus();

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [pendingChanges, setPendingChanges] = useState({});
  const [lastSynced, setLastSynced] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Apply Settings to App ────────────────────────────────────────────

  const applySettingsToApp = useCallback((settingsToApply) => {
    // Apply theme
    if (settingsToApply.theme && typeof setThemeMode === 'function') {
      setThemeMode(settingsToApply.theme);
    } else if (settingsToApply.theme === 'dark' && !settingsToApply.theme.includes('system')) {
      // Fallback: directly toggle if setThemeMode not available
      const isDark = settingsToApply.theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    }

    // Apply reduced motion
    if (settingsToApply.reducedMotion !== undefined) {
      document.documentElement.classList.toggle('reduce-motion', settingsToApply.reducedMotion);
    }

    // Apply font size
    if (settingsToApply.fontSize) {
      document.documentElement.setAttribute('data-font-size', settingsToApply.fontSize);
    }

    // Apply language
    if (settingsToApply.language) {
      document.documentElement.setAttribute('lang', settingsToApply.language);
    }
  }, [setThemeMode]);

  // ── Load Settings ────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      try {
        const localSettings = localStorage.getItem('anonymousSettings');
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
          applySettingsToApp(parsed);
        }
      } catch {}
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const settingsRef = doc(db, 'settings', user.uid);

    const unsubscribe = onSnapshot(settingsRef,
      (snapshot) => {
        if (!mountedRef.current) return;

        if (snapshot.exists()) {
          const savedSettings = snapshot.data();
          const { _metadata, ...cleanSettings } = savedSettings;

          setSettings(prev => ({ ...prev, ...cleanSettings }));
          setLastSynced(_metadata?.lastSynced?.toDate?.()?.toISOString() || new Date().toISOString());
          applySettingsToApp(cleanSettings);
        } else {
          const newSettings = {
            ...defaultSettings,
            userId: user.uid,
            _metadata: {
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastSynced: serverTimestamp(),
            },
          };
          setDoc(settingsRef, newSettings);
          setSettings(defaultSettings);
          setLastSynced(new Date().toISOString());
          applySettingsToApp(defaultSettings);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Settings listener error:', err);
        if (mountedRef.current) {
          setError(err);
          setLoading(false);

          // Load from cache
          try {
            const cached = localStorage.getItem(`settings_${user.uid}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              setSettings(prev => ({ ...prev, ...parsed }));
            }
          } catch {}
        }
      }
    );

    return () => unsubscribe();
  }, [user, applySettingsToApp]);

  // ── Sync Pending Changes ─────────────────────────────────────────────

  const syncPendingChanges = useDebouncedCallback(async () => {
    if (!user || !isOnline || Object.keys(pendingChanges).length === 0) return;

    try {
      setSyncStatus('syncing');
      const settingsRef = doc(db, 'settings', user.uid);
      await updateDoc(settingsRef, {
        ...pendingChanges,
        '_metadata.updatedAt': serverTimestamp(),
        '_metadata.lastSynced': serverTimestamp(),
      });

      try {
        localStorage.setItem(`settings_${user.uid}`, JSON.stringify(settings));
      } catch {}

      setPendingChanges({});
      setSyncStatus('synced');
      setLastSynced(new Date().toISOString());
      setTimeout(() => { if (mountedRef.current) setSyncStatus('idle'); }, 2000);
    } catch {
      setSyncStatus('error');
      toast.error('Failed to sync settings');
    }
  }, 2000);

  useEffect(() => {
    if (Object.keys(pendingChanges).length > 0) {
      syncPendingChanges();
    }
  }, [pendingChanges, syncPendingChanges]);

  // ── Update Setting ───────────────────────────────────────────────────

  const updateSetting = useCallback(async (key, value) => {
    if (!validateSetting(key, value)) {
      toast.error(`Invalid value for ${key}`);
      return;
    }

    setSettings(prev => ({ ...prev, [key]: value }));
    applySettingsToApp({ [key]: value });

    if (!user) {
      try {
        const local = JSON.parse(localStorage.getItem('anonymousSettings') || '{}');
        local[key] = value;
        localStorage.setItem('anonymousSettings', JSON.stringify(local));
      } catch {}
      return;
    }

    setPendingChanges(prev => ({ ...prev, [key]: value }));

    if (isOnline) {
      try {
        await updateDoc(doc(db, 'settings', user.uid), {
          [key]: value,
          '_metadata.updatedAt': serverTimestamp(),
        });
      } catch {
        toast.error('Failed to update setting');
        setSettings(prev => ({ ...prev, [key]: !value }));
      }
    }
  }, [user, isOnline, applySettingsToApp]);

  const toggleSetting = useCallback(async (key) => {
    await updateSetting(key, !settings[key]);
  }, [settings, updateSetting]);

  // ── Reset Settings ───────────────────────────────────────────────────

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    applySettingsToApp(defaultSettings);

    if (!user) {
      localStorage.removeItem('anonymousSettings');
      toast.success('Settings reset');
      return;
    }

    try {
      await setDoc(doc(db, 'settings', user.uid), {
        ...defaultSettings,
        userId: user.uid,
        _metadata: { updatedAt: serverTimestamp(), lastSynced: serverTimestamp() },
      }, { merge: true });
      setPendingChanges({});
      toast.success('Settings reset to defaults');
    } catch {
      toast.error('Failed to reset settings');
    }
  }, [user, applySettingsToApp]);

  // ── Export/Import ────────────────────────────────────────────────────

  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify({ settings, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumeai-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported');
  }, [settings]);

  const importSettings = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.settings) throw new Error('Invalid file');

      const validated = {};
      Object.entries(data.settings).forEach(([key, value]) => {
        if (key in defaultSettings && validateSetting(key, value)) {
          validated[key] = value;
        }
      });

      setSettings(prev => ({ ...prev, ...validated }));
      applySettingsToApp(validated);
      toast.success(`Imported ${Object.keys(validated).length} settings`);
    } catch {
      toast.error('Failed to import settings');
    }
  }, [applySettingsToApp]);

  // ── Helpers ──────────────────────────────────────────────────────────

  const getSetting = useCallback((key, defaultValue = null) => settings[key] ?? defaultValue, [settings]);
  const isFeatureEnabled = useCallback((feature) => settings[feature] === true, [settings]);

  const getSettingsByCategory = useCallback((category) => {
    return Object.entries(settingDefinitions)
      .filter(([, def]) => def.category === category)
      .reduce((acc, [key]) => { acc[key] = settings[key]; return acc; }, {});
  }, [settings]);

  // ── FIXED: Extracted SyncIndicator ───────────────────────────────────

  const syncIndicatorText = useMemo(() => {
    if (syncStatus === 'syncing') return '🔄 Syncing...';
    if (syncStatus === 'synced') return '✅ Synced';
    if (syncStatus === 'error') return '❌ Sync failed';
    if (!isOnline) return '📴 Offline';
    return null;
  }, [syncStatus, isOnline]);

  // ── Context Value ────────────────────────────────────────────────────

  const value = useMemo(() => ({
    settings, loading, error, syncStatus, lastSynced, isOnline,
    updateSetting, resetSettings, toggleSetting,
    exportSettings, importSettings,
    getSetting, isFeatureEnabled, getSettingsByCategory,
    syncIndicatorText,
    defaultSettings, settingDefinitions, SettingsCategories, CategoryLabels,
    hasPendingChanges: Object.keys(pendingChanges).length > 0,
  }), [
    settings, loading, error, syncStatus, lastSynced, isOnline,
    updateSetting, resetSettings, toggleSetting,
    exportSettings, importSettings,
    getSetting, isFeatureEnabled, getSettingsByCategory,
    syncIndicatorText, pendingChanges,
  ]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export default SettingsContext;