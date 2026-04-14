import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDebouncedCallback } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

// Create context
const SettingsContext = createContext(null);

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Settings validation schemas
const validateSetting = (key, value) => {
  const validators = {
    emailNotifications: (v) => typeof v === 'boolean',
    sessionTimeout: (v) => ['15', '30', '60', '120', 'never'].includes(v),
    language: (v) => ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'hi'].includes(v),
    dateFormat: (v) => ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(v),
    autoSaveInterval: (v) => ['10', '30', '60', '120'].includes(v),
    defaultTemplate: (v) => ['modern', 'classic', 'creative', 'minimal', 'executive', 'tech'].includes(v),
  };
  
  const validator = validators[key];
  return validator ? validator(value) : true;
};

// Settings Provider Component
export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  
  // Default settings with metadata
  const defaultSettings = {
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    resumeUpdates: true,
    atsScoreAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
    securityAlerts: true,
    soundEnabled: true,
    desktopNotifications: false,
    
    // Privacy & Security
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginAlerts: true,
    showEmail: false,
    showPhone: false,
    showLocation: false,
    dataCollection: true,
    anonymousUsage: true,
    
    // Appearance
    theme: 'system', // 'light', 'dark', 'system'
    fontSize: 'medium', // 'small', 'medium', 'large'
    compactMode: false,
    reducedMotion: false,
    highContrast: false,
    
    // Editor Preferences
    autoSave: true,
    autoSaveInterval: '30',
    defaultTemplate: 'modern',
    spellCheck: true,
    grammarCheck: true,
    showWordCount: true,
    showATSScore: true,
    
    // Regional Settings
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h', // '12h' or '24h'
    currency: 'USD',
    firstDayOfWeek: 'sunday', // 'sunday' or 'monday'
    
    // Data & Storage
    cacheEnabled: true,
    offlineMode: true,
    autoDownload: false,
    compressImages: true,
    storageLocation: 'cloud',
    syncFrequency: 'auto', // 'auto', 'manual', 'daily', 'weekly'
    
    // AI Features
    aiSuggestions: true,
    aiKeywordOptimization: true,
    aiGrammarCheck: true,
    aiContentGeneration: false,
    
    // Advanced
    debugMode: false,
    experimentalFeatures: false,
    betaFeatures: false
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'synced', 'error'
  const [pendingChanges, setPendingChanges] = useState({});
  const [lastSynced, setLastSynced] = useState(null);

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        // Load from localStorage for anonymous users
        const localSettings = localStorage.getItem('anonymousSettings');
        if (localSettings) {
          try {
            const parsed = JSON.parse(localSettings);
            setSettings(prev => ({ ...prev, ...parsed }));
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
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          const savedSettings = settingsDoc.data();
          const metadata = savedSettings._metadata || {};
          
          // Merge saved settings with defaults (for new settings)
          setSettings(prev => ({
            ...prev,
            ...savedSettings,
            timezone: savedSettings.timezone || defaultSettings.timezone
          }));
          setLastSynced(metadata.lastSynced || new Date().toISOString());
        } else {
          // Create default settings document
          const newSettings = {
            ...defaultSettings,
            userId: user.uid,
            _metadata: {
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastSynced: serverTimestamp(),
              version: '2.0.0'
            }
          };
          
          await setDoc(settingsRef, newSettings);
          setSettings(defaultSettings);
          setLastSynced(new Date().toISOString());
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(err);
        
        // Load from cache if available
        const cachedSettings = localStorage.getItem(`settings_${user.uid}`);
        if (cachedSettings) {
          try {
            const parsed = JSON.parse(cachedSettings);
            setSettings(prev => ({ ...prev, ...parsed }));
            toast.success('Loaded settings from cache');
          } catch (e) {
            console.error('Error parsing cached settings:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Save anonymous settings to localStorage
  useEffect(() => {
    if (!user && !loading) {
      localStorage.setItem('anonymousSettings', JSON.stringify(settings));
    }
  }, [settings, user, loading]);

  // Debounced sync for pending changes
  const syncPendingChanges = useDebouncedCallback(async () => {
    if (!user || !isOnline || Object.keys(pendingChanges).length === 0) return;

    try {
      setSyncStatus('syncing');
      
      const settingsRef = doc(db, 'settings', user.uid);
      await updateDoc(settingsRef, {
        ...pendingChanges,
        '_metadata.updatedAt': serverTimestamp(),
        '_metadata.lastSynced': serverTimestamp()
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

  // Trigger sync when pending changes exist
  useEffect(() => {
    if (Object.keys(pendingChanges).length > 0) {
      syncPendingChanges();
    }
  }, [pendingChanges, syncPendingChanges]);

  // Update a single setting
  const updateSetting = useCallback(async (key, value) => {
    // Validate setting
    if (!validateSetting(key, value)) {
      toast.error(`Invalid value for ${key}`);
      return;
    }

    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));

    if (!user) {
      // Just update local state for anonymous users
      toast.success('Setting updated');
      return;
    }

    // Add to pending changes
    setPendingChanges(prev => ({ ...prev, [key]: value }));

    // Update immediately if online and not debounced
    if (isOnline) {
      try {
        const settingsRef = doc(db, 'settings', user.uid);
        await updateDoc(settingsRef, {
          [key]: value,
          '_metadata.updatedAt': serverTimestamp()
        });
        toast.success('Setting updated');
      } catch (err) {
        console.error(`Error updating setting ${key}:`, err);
        if (!isOnline) {
          toast.success('Setting saved locally, will sync when online');
        } else {
          toast.error('Failed to update setting');
          // Revert on error
          setSettings(prev => ({ ...prev, [key]: !value }));
        }
      }
    } else {
      toast.success('Setting saved locally, will sync when online');
    }
  }, [user, isOnline]);

  // Update multiple settings at once
  const updateSettings = useCallback(async (newSettings) => {
    // Validate all settings
    for (const [key, value] of Object.entries(newSettings)) {
      if (!validateSetting(key, value)) {
        toast.error(`Invalid value for ${key}`);
        return;
      }
    }

    // Optimistic update
    setSettings(prev => ({ ...prev, ...newSettings }));

    if (!user) {
      toast.success('Settings saved');
      return;
    }

    setPendingChanges(prev => ({ ...prev, ...newSettings }));

    if (isOnline) {
      try {
        const settingsRef = doc(db, 'settings', user.uid);
        await updateDoc(settingsRef, {
          ...newSettings,
          '_metadata.updatedAt': serverTimestamp()
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
  }, [user, isOnline]);

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default?')) {
      return;
    }

    setSettings(defaultSettings);

    if (!user) {
      localStorage.removeItem('anonymousSettings');
      toast.success('Settings reset to defaults');
      return;
    }

    try {
      const settingsRef = doc(db, 'settings', user.uid);
      await setDoc(settingsRef, {
        ...defaultSettings,
        userId: user.uid,
        _metadata: {
          updatedAt: serverTimestamp(),
          lastSynced: serverTimestamp(),
          version: '2.0.0'
        }
      }, { merge: true });

      setPendingChanges({});
      toast.success('Settings reset to defaults');
    } catch (err) {
      console.error('Error resetting settings:', err);
      toast.error('Failed to reset settings');
      throw err;
    }
  }, [user, defaultSettings]);

  // Toggle a boolean setting
  const toggleSetting = useCallback(async (key) => {
    const currentValue = settings[key];
    await updateSetting(key, !currentValue);
  }, [settings, updateSetting]);

  // Export settings to JSON
  const exportSettings = useCallback(() => {
    const data = {
      settings,
      _metadata: {
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        userId: user?.uid || 'anonymous'
      }
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

  // Import settings from JSON
  const importSettings = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.settings) {
        // Validate imported settings
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
  }, [updateSettings, defaultSettings]);

  // Get setting value with type safety
  const getSetting = useCallback((key, defaultValue = null) => {
    return settings[key] ?? defaultValue;
  }, [settings]);

  // Check if a feature is enabled
  const isFeatureEnabled = useCallback((feature) => {
    return settings[feature] === true;
  }, [settings]);

  // Sync status indicator
  const SyncIndicator = () => {
    if (syncStatus === 'syncing') return '🔄 Syncing...';
    if (syncStatus === 'synced') return '✅ Synced';
    if (syncStatus === 'error') return '❌ Sync failed';
    if (!isOnline) return '📴 Offline';
    return null;
  };

  const value = {
    // State
    settings,
    loading,
    error,
    syncStatus,
    lastSynced,
    isOnline,
    
    // Actions
    updateSetting,
    updateSettings,
    resetSettings,
    toggleSetting,
    exportSettings,
    importSettings,
    getSetting,
    isFeatureEnabled,
    
    // UI Components
    SyncIndicator,
    
    // Constants
    defaultSettings,
    
    // Computed
    hasPendingChanges: Object.keys(pendingChanges).length > 0
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;