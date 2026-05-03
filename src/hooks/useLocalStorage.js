import { useState, useEffect, useCallback, useRef } from 'react';

// ── SSR-Safe localStorage access ────────────────────────────────────────

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const safeGetItem = (key, fallback = null) => {
  try {
    const storage = getStorage();
    if (!storage) return fallback;
    const item = storage.getItem(key);
    return item !== null ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
};

const safeSetItem = (key, value) => {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing localStorage key "${key}":`, error);
    return false;
  }
};

const safeRemoveItem = (key) => {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};

// ── useLocalStorage ──────────────────────────────────────────────────────

/**
 * Persists state to localStorage with cross-tab sync.
 * 
 * @param {string} key - localStorage key
 * @param {*} initialValue - Default value if key doesn't exist
 * @param {Object} options - Configuration
 * @param {boolean} options.sync - Listen for storage events from other tabs
 * @param {Function} options.serializer - Custom serializer (default: JSON.stringify)
 * @param {Function} options.deserializer - Custom deserializer (default: JSON.parse)
 * @returns {[*, Function, Function]} [value, setValue, remove]
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    sync = true,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options;

  const keyRef = useRef(key);

  // ── State ────────────────────────────────────────────────────────────

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const storage = getStorage();
      if (!storage) return initialValue instanceof Function ? initialValue() : initialValue;
      
      const item = storage.getItem(key);
      if (item === null) {
        return initialValue instanceof Function ? initialValue() : initialValue;
      }
      
      return deserializer(item);
    } catch (error) {
      console.warn(`Error initializing localStorage key "${key}":`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  });

  // ── Update localStorage on value change ─────────────────────────────

  useEffect(() => {
    try {
      const storage = getStorage();
      if (!storage) return;

      if (storedValue === undefined) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, serializer(storedValue));
      }
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue, serializer]);

  // ── Handle key changes ──────────────────────────────────────────────

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // ── Cross-tab synchronization ──────────────────────────────────────

  useEffect(() => {
    if (!sync || typeof window === 'undefined') return;

    const handleStorageChange = (event) => {
      // Only respond to changes for the current key
      if (event.key === keyRef.current && event.newValue !== null) {
        try {
          const newValue = deserializer(event.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.warn('Error parsing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [sync, deserializer]);

  // ── Set value ──────────────────────────────────────────────────────

  const setValue = useCallback((value) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  // ── Remove value ───────────────────────────────────────────────────

  const remove = useCallback(() => {
    try {
      safeRemoveItem(key);
      setStoredValue(undefined);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, remove];
};

// ── useLocalStorageState ─────────────────────────────────────────────────

/**
 * Simplified version that returns a state-like API.
 * 
 * @param {string} key - localStorage key
 * @param {*} initialValue - Default value
 * @returns {[*, Function]} [value, setValue]
 */
export const useLocalStorageState = (key, initialValue) => {
  const [value, setValue] = useLocalStorage(key, initialValue, { sync: true });
  return [value, setValue];
};

// ── useLocalStorageWithExpiry ────────────────────────────────────────────

/**
 * Persists state to localStorage with automatic expiry.
 * 
 * @param {string} key - localStorage key
 * @param {*} initialValue - Default value
 * @param {number} ttl - Time to live in milliseconds
 * @returns {[*, Function, Function]} [value, setValue, remove]
 */
export const useLocalStorageWithExpiry = (key, initialValue, ttl = 24 * 60 * 60 * 1000) => {
  const getWithExpiry = () => {
    try {
      const storage = getStorage();
      if (!storage) return initialValue instanceof Function ? initialValue() : initialValue;

      const item = storage.getItem(key);
      if (!item) return initialValue instanceof Function ? initialValue() : initialValue;

      const parsed = JSON.parse(item);
      
      // Check if expired
      if (parsed._expiry && Date.now() > parsed._expiry) {
        storage.removeItem(key);
        return initialValue instanceof Function ? initialValue() : initialValue;
      }

      return parsed._value;
    } catch {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  };

  const [value, setValue] = useState(getWithExpiry);

  const setWithExpiry = useCallback((newValue) => {
    setValue((prev) => {
      const val = newValue instanceof Function ? newValue(prev) : newValue;

      try {
        const storage = getStorage();
        if (storage) {
          storage.setItem(key, JSON.stringify({
            _value: val,
            _expiry: Date.now() + ttl,
          }));
        }
      } catch {
        // silently fail
      }

      return val;
    });
  }, [key, ttl]);

  return [value, setWithExpiry, remove];
};

// ── useLocalStorageRecord ────────────────────────────────────────────────

/**
 * Manages a record/object in localStorage with partial updates.
 * 
 * @param {string} key - localStorage key
 * @param {Object} initialValue - Default record
 * @returns {[Object, Function, Function, Function]} [record, setRecord, updateRecord, removeRecord]
 * 
 * @example
 * const [settings, setSettings, updateSettings] = useLocalStorageRecord('app-settings', { theme: 'light' });
 * updateSettings({ fontSize: 'large' }); // Partial update
 */
export const useLocalStorageRecord = (key, initialValue = {}) => {
  const [record, setRecord, removeRecord] = useLocalStorage(key, initialValue, { sync: true });

  const updateRecord = useCallback((updates) => {
    setRecord((prev) => {
      const newRecord = updates instanceof Function ? updates(prev) : { ...prev, ...updates };
      return newRecord;
    });
  }, [setRecord]);

  return [record, setRecord, updateRecord, removeRecord];
};

export default useLocalStorage;