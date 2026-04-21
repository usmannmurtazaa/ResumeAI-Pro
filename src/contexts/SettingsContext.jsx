import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDebouncedCallback } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

// ============================================
// CONTEXT CREATION
// ============================================

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// ============================================
// SETTINGS CATEGORIES (for UI organization)
// ============================================

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

// Category labels for display
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

// Setting definitions with metadata
export const settingDefinitions = {
  // Notifications
  emailNotifications: { category: 'notifications', type: 'boolean', default: true },
  pushNotifications: { category: 'notifications', type: 'boolean', default: true },
  resumeUpdates: { category: 'notifications', type: 'boolean', default: true },
  atsScoreAlerts: { category: 'notifications', type: 'boolean', default: true },
  marketingEmails: { category: 'notifications', type: 'boolean', default: false },
  weeklyDigest: { category: 'notifications', type: 'boolean', default: true },
  securityAlerts: { category: 'notifications', type: 'boolean', default: true },
  soundEnabled: { category: 'notifications', type: 'boolean', default: true },
  desktopNotifications: { category: 'notifications', type: 'boolean', default: false },

  // Privacy & Security
  twoFactorAuth: { category: 'privacy', type: 'boolean', default: false },
  sessionTimeout: { category: 'privacy', type: 'select', options: ['15', '30', '60', '120', 'never'], default: '30' },
  loginAlerts: { category: 'privacy', type: 'boolean', default: true },
  showEmail: { category: 'privacy', type: 'boolean', default: false },
  showPhone: { category: 'privacy', type: 'boolean', default: false },
  showLocation: { category: 'privacy', type: 'boolean', default: false },
  dataCollection: { category: 'privacy', type: 'boolean', default: true },
  anonymousUsage: { category: 'privacy', type: 'boolean', default: true },

  // Appearance
  theme: { category: 'appearance', type: 'select', options: ['light', 'dark', 'system'], default: 'system' },
  fontSize: { category: 'appearance', type: 'select', options: ['small', 'medium', 'large'], default: 'medium' },
  compactMode: { category: 'appearance', type: 'boolean', default: false },
  reducedMotion: { category: 'appearance', type: 'boolean', default: false },
  highContrast: { category: 'appearance', type: 'boolean', default: false },

  // Editor Preferences
  autoSave: { category: 'editor', type: 'boolean', default: true },
  autoSaveInterval: { category: 'editor', type: 'select', options: ['10', '30', '60', '120'], default: '30' },
  defaultTemplate: { category: 'editor', type: 'select', options: ['modern', 'classic', 'creative', 'minimal', 'executive', 'tech'], default: 'modern' },
  spellCheck: { category: 'editor', type: 'boolean', default: true },
  grammarCheck: { category: 'editor', type: 'boolean', default: true },
  showWordCount: { category: 'editor', type: 'boolean', default: true },
  showATSScore: { category: 'editor', type: 'boolean', default: true },

  // Regional Settings
  language: { category: 'regional', type: 'select', options: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'hi'], default: 'en' },
  timezone: { category: 'regional', type: 'timezone', default: Intl.DateTimeFormat().resolvedOptions().timeZone },
  dateFormat: { category: 'regional', type: 'select', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], default: 'MM/DD/YYYY' },
  timeFormat: { category: 'regional', type: 'select', options: ['12h', '24h'], default: '12h' },
  currency: { category: 'regional', type: 'select', options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'], default: 'USD' },
  firstDayOfWeek: { category: 'regional', type: 'select', options: ['sunday', 'monday'], default: 'sunday' },

  // Data & Storage
  cacheEnabled: { category: 'storage', type: 'boolean', default: true },
  offlineMode: { category: 'storage', type: 'boolean', default: true },
  autoDownload: { category: 'storage', type: 'boolean', default: false },
  compressImages: { category: 'storage', type: 'boolean', default: true },
  storageLocation: { category: 'storage', type: 'select', options: ['cloud', 'local'], default: 'cloud' },
  syncFrequency: { category: 'storage', type: 'select', options: ['auto', 'manual', 'daily', 'weekly'], default: 'auto' },

  // AI Features
  aiSuggestions: { category: 'ai', type: 'boolean', default: true },
  aiKeywordOptimization: { category: 'ai', type: 'boolean', default: true },
  aiGrammarCheck: { category: 'ai', type: 'boolean', default: true },
  aiContentGeneration: { category: 'ai', type: 'boolean', default: false },

  // Advanced
  debugMode: { category: 'advanced', type: 'boolean', default: false },
  experimentalFeatures: { category: 'advanced', type: 'boolean', default: false },
  betaFeatures: { category: 'advanced', type: 'boolean', default: false },
};

// ============================================
// VALIDATION
// ============================================

const validateSetting = (key, value) => {
  const definition = settingDefinitions[key];
  if (!definition) return true;

  switch (definition.type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'select':
      return definition.options.includes(value);
    case 'timezone':
      return typeof value === 'string' && value.length > 0;
    default:
      return true;
  }
};

// ============================================
// DEFAULT SETTINGS
// ============================================

const generateDefaultSettings = () => {
  const defaults = {};
  Object.entries(settingDefinitions).forEach(([key, def]) => {
    defaults[key] = def.default;
  });
  return defaults;
};

const defaultSettings = generateDefaultSettings();

// ============================================
// PROVIDER COMPONENT
// ============================================

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const { applyPreset, setThemeMode, setFontSize, setReducedMotion, setHighContrast } = useTheme();
  const isOnline = useOnlineStatus();

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [pendingChanges, setPendingChanges] = useState({});
  const [lastSynced, setLastSynced] = useState(null);
  const [settingsVersion, setSettingsVersion] = useState('2.0.0');

  // ============================================
  // LOAD SETTINGS
  // ============================================

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        // Load from localStorage for anonymous users
        const localSettings = localStorage.getItem('anonymousSettings');
        if (localSettings) {
          try {
            const parsed = JSON.parse(localSettings);
            setSettings((prev) => ({ ...prev, ...parsed }));
            applySettingsToApp(parsed);
          } catch (e) {
            console.error('Error parsing local settings:', e);
          }
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const settingsRef = doc(db, 'settings', user.uid);

        // Real-time listener for settings
        const unsubscribe = onSnapshot(
          settingsRef,
          (doc) => {
            if (doc.exists()) {
              const savedSettings = doc.data();
              const metadata = savedSettings._metadata || {};

              // Remove metadata from settings object
              const { _metadata, ...cleanSettings } = savedSettings;

              setSettings((prev) => ({
                ...prev,
                ...cleanSettings,
                timezone: cleanSettings.timezone || defaultSettings.timezone,
              }));
              setSettingsVersion(metadata.version || '2.0.0');
              setLastSynced(metadata.lastSynced?.toDate?.()?.toISOString() || new Date().toISOString());

              // Apply settings to app
              applySettingsToApp(cleanSettings);
            } else {
              // Create default settings document
              const newSettings = {
                ...defaultSettings,
                userId: user.uid,
                _metadata: {
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  lastSynced: serverTimestamp(),
                  version: '2.0.0',
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
            console.error('Error in settings listener:', err);
            setError(err);
            setLoading(false);

            // Load from cache if available
            const cachedSettings = localStorage.getItem(`settings_${user.uid}`);
            if (cachedSettings) {
              try {
                const parsed = JSON.parse(cachedSettings);
                setSettings((prev) => ({ ...prev, ...parsed }));
                toast.success('Loaded settings from cache');
              } catch (e) {
                console.error('Error parsing cached settings:', e);
              }
            }
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(err);
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // ============================================
  // APPLY SETTINGS TO APP
  // ============================================

  const applySettingsToApp = useCallback((settingsToApply) => {
    // Apply theme settings
    if (settingsToApply.theme) {
      setThemeMode(settingsToApply.theme);
    }
    if (settingsToApply.fontSize) {
      setFontSize(settingsToApply.fontSize);
    }
    if (settingsToApply.reducedMotion !== undefined) {
      setReducedMotion(settingsToApply.reducedMotion);
    }
    if (settingsToApply.highContrast !== undefined) {
      setHighContrast(settingsToApply.highContrast);
    }

    // Apply language (would trigger i18n)
    if (settingsToApply.language) {
      document.documentElement.setAttribute('lang', settingsToApply.language);
    }
  }, [setThemeMode, setFontSize, setReducedMotion, setHighContrast]);

  // ============================================
  // SAVE ANONYMOUS SETTINGS
  // ============================================

  useEffect(() => {
    if (!user && !loading) {
      localStorage.setItem('anonymousSettings', JSON.stringify(settings));
      applySettingsToApp(settings);
    }
  }, [settings, user, loading, applySettingsToApp]);

  // ============================================
  // DEBOUNCED SYNC
  // ============================================

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

      // Cache locally
      localStorage.setItem(`settings_${user.uid}`, JSON.stringify(settings));

      setPendingChanges({});
      setSyncStatus('synced');
      setLastSynced(new Date().toISOString());

      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err) {
      console.error('Error syncing settings:', err);
      setSyncStatus('error');
      toast.error('Failed to sync settings');
    }
  }, 2000);

  useEffect(() => {
    if (Object.keys(pendingChanges).length > 0) {
      syncPendingChanges();
    }
  }, [pendingChanges, syncPendingChanges]);

  // ============================================
  // UPDATE SETTINGS
  // ============================================

  const updateSetting = useCallback(
    async (key, value) => {
      if (!validateSetting(key, value)) {
        toast.error(`Invalid value for ${key}`);
        return;
      }

      // Optimistic update
      setSettings((prev) => ({ ...prev, [key]: value }));

      // Apply to app immediately
      applySettingsToApp({ [key]: value });

      if (!user) {
        toast.success('Setting updated');
        return;
      }

      setPendingChanges((prev) => ({ ...prev, [key]: value }));

      if (isOnline) {
        try {
          const settingsRef = doc(db, 'settings', user.uid);
          await updateDoc(settingsRef, {
            [key]: value,
            '_metadata.updatedAt': serverTimestamp(),
          });
          toast.success('Setting updated');
        } catch (err) {
          console.error(`Error updating setting ${key}:`, err);
          if (!isOnline) {
            toast.success('Setting saved locally, will sync when online');
          } else {
            toast.error('Failed to update setting');
            setSettings((prev) => ({ ...prev, [key]: !value }));
          }
        }
      } else {
        toast.success('Setting saved locally, will sync when online');
      }
    },
    [user, isOnline, applySettingsToApp]
  );

  const updateSettings = useCallback(
    async (newSettings) => {
      for (const [key, value] of Object.entries(newSettings)) {
        if (!validateSetting(key, value)) {
          toast.error(`Invalid value for ${key}`);
          return;
        }
      }

      setSettings((prev) => ({ ...prev, ...newSettings }));
      applySettingsToApp(newSettings);

      if (!user) {
        toast.success('Settings saved');
        return;
      }

      setPendingChanges((prev) => ({ ...prev, ...newSettings }));

      if (isOnline) {
        try {
          const settingsRef = doc(db, 'settings', user.uid);
          await updateDoc(settingsRef, {
            ...newSettings,
            '_metadata.updatedAt': serverTimestamp(),
          });
          toast.success('Settings saved successfully');
        } catch (err) {
          console.error('Error updating settings:', err);
          toast.error('Failed to save settings');
          throw err;
        }
      } else {
        toast.success('Settings saved locally, will sync when online');
      }
    },
    [user, isOnline, applySettingsToApp]
  );

  // ============================================
  // RESET SETTINGS
  // ============================================

  const resetSettings = useCallback(async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default?')) {
      return;
    }

    setSettings(defaultSettings);
    applySettingsToApp(defaultSettings);

    if (!user) {
      localStorage.removeItem('anonymousSettings');
      toast.success('Settings reset to defaults');
      return;
    }

    try {
      const settingsRef = doc(db, 'settings', user.uid);
      await setDoc(
        settingsRef,
        {
          ...defaultSettings,
          userId: user.uid,
          _metadata: {
            updatedAt: serverTimestamp(),
            lastSynced: serverTimestamp(),
            version: '2.0.0',
          },
        },
        { merge: true }
      );

      setPendingChanges({});
      toast.success('Settings reset to defaults');
    } catch (err) {
      console.error('Error resetting settings:', err);
      toast.error('Failed to reset settings');
      throw err;
    }
  }, [user, defaultSettings, applySettingsToApp]);

  // ============================================
  // TOGGLE SETTING
  // ============================================

  const toggleSetting = useCallback(
    async (key) => {
      const currentValue = settings[key];
      await updateSetting(key, !currentValue);
    },
    [settings, updateSetting]
  );

  // ============================================
  // IMPORT/EXPORT
  // ============================================

  const exportSettings = useCallback(() => {
    const data = {
      settings,
      _metadata: {
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        userId: user?.uid || 'anonymous',
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumeai-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Settings exported successfully');
  }, [settings, user]);

  const importSettings = useCallback(
    async (file) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.settings) {
          const validatedSettings = {};
          for (const [key, value] of Object.entries(data.settings)) {
            if (key in defaultSettings && validateSetting(key, value)) {
              validatedSettings[key] = value;
            }
          }

          await updateSettings(validatedSettings);
          toast.success(`Imported ${Object.keys(validatedSettings).length} settings`);
        } else {
          throw new Error('Invalid settings file');
        }
      } catch (err) {
        console.error('Error importing settings:', err);
        toast.error('Failed to import settings');
        throw err;
      }
    },
    [updateSettings, defaultSettings]
  );

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getSetting = useCallback(
    (key, defaultValue = null) => {
      return settings[key] ?? defaultValue;
    },
    [settings]
  );

  const isFeatureEnabled = useCallback(
    (feature) => {
      return settings[feature] === true;
    },
    [settings]
  );

  const getSettingsByCategory = useCallback(
    (category) => {
      return Object.entries(settingDefinitions)
        .filter(([, def]) => def.category === category)
        .reduce((acc, [key]) => {
          acc[key] = settings[key];
          return acc;
        }, {});
    },
    [settings]
  );

  // ============================================
  // SYNC INDICATOR
  // ============================================

  const SyncIndicator = () => {
    if (syncStatus === 'syncing') return '🔄 Syncing...';
    if (syncStatus === 'synced') return '✅ Synced';
    if (syncStatus === 'error') return '❌ Sync failed';
    if (!isOnline) return '📴 Offline';
    return null;
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // State
    settings,
    loading,
    error,
    syncStatus,
    lastSynced,
    isOnline,
    settingsVersion,

    // Actions
    updateSetting,
    updateSettings,
    resetSettings,
    toggleSetting,
    exportSettings,
    importSettings,

    // Helpers
    getSetting,
    isFeatureEnabled,
    getSettingsByCategory,

    // UI Components
    SyncIndicator,

    // Constants
    defaultSettings,
    settingDefinitions,
    SettingsCategories,
    CategoryLabels,

    // Computed
    hasPendingChanges: Object.keys(pendingChanges).length > 0,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export default SettingsContext;