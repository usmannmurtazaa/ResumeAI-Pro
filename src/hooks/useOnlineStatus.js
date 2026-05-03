import { useState, useEffect, useCallback, useRef } from 'react';

// ── SSR-Safe Helpers ────────────────────────────────────────────────────

const getNavigator = () => {
  if (typeof navigator === 'undefined') return null;
  return navigator;
};

const getWindow = () => {
  if (typeof window === 'undefined') return null;
  return window;
};

// ── useOnlineStatus ──────────────────────────────────────────────────────

/**
 * Tracks online/offline status with enhanced reliability.
 * Periodically verifies connectivity by attempting to fetch a resource.
 * 
 * @param {Object} options - Configuration
 * @param {boolean} options.verifyWithFetch - Periodically verify connectivity (default: false)
 * @param {number} options.verifyInterval - Verification interval in ms (default: 30000)
 * @param {Function} options.onChange - Callback when status changes
 * @returns {Object} { isOnline, connection, isReliable }
 */
export const useOnlineStatus = (options = {}) => {
  const {
    verifyWithFetch = false,
    verifyInterval = 30000,
    onChange,
  } = options;

  const navigatorRef = useRef(getNavigator());
  const onChangeRef = useRef(onChange);

  const [isOnline, setIsOnline] = useState(() => {
    const nav = navigatorRef.current;
    return nav ? nav.onLine : true; // Default to online for SSR
  });

  const [connection, setConnection] = useState(() => {
    const nav = navigatorRef.current;
    if (!nav?.connection) return null;

    return {
      effectiveType: nav.connection.effectiveType,    // '4g', '3g', '2g', 'slow-2g'
      downlink: nav.connection.downlink,               // Mbps
      rtt: nav.connection.rtt,                         // Round-trip time (ms)
      saveData: nav.connection.saveData,               // Data saver mode
      type: nav.connection.type,                       // 'wifi', 'cellular', etc.
    };
  });

  // ── Keep refs updated ───────────────────────────────────────────────

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // ── Online/Offline events ──────────────────────────────────────────

  useEffect(() => {
    const win = getWindow();
    if (!win) return;

    const handleOnline = () => {
      setIsOnline(true);
      onChangeRef.current?.(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      onChangeRef.current?.(false);
    };

    win.addEventListener('online', handleOnline);
    win.addEventListener('offline', handleOffline);

    return () => {
      win.removeEventListener('online', handleOnline);
      win.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Network Information API ────────────────────────────────────────

  useEffect(() => {
    const nav = getNavigator();
    if (!nav?.connection) return;

    const handleConnectionChange = () => {
      const conn = nav.connection;
      setConnection({
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
        type: conn.type,
      });
    };

    // Modern browsers
    if (typeof nav.connection.addEventListener === 'function') {
      nav.connection.addEventListener('change', handleConnectionChange);
    } else {
      // Fallback
      nav.connection.onchange = handleConnectionChange;
    }

    return () => {
      if (typeof nav.connection.removeEventListener === 'function') {
        nav.connection.removeEventListener('change', handleConnectionChange);
      } else {
        nav.connection.onchange = null;
      }
    };
  }, []);

  // ── Periodic connectivity verification ─────────────────────────────

  useEffect(() => {
    if (!verifyWithFetch) return;

    let isActive = true;

    const verifyConnectivity = async () => {
      try {
        // Use a lightweight endpoint or a HEAD request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isActive) {
          const online = response.ok;
          if (online !== isOnline) {
            setIsOnline(online);
            onChangeRef.current?.(online);
          }
        }
      } catch {
        // Fetch failed - either offline or network error
        if (isActive && isOnline) {
          setIsOnline(false);
          onChangeRef.current?.(false);
        }
      }
    };

    const interval = setInterval(verifyConnectivity, verifyInterval);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [verifyWithFetch, verifyInterval, isOnline]);

  // ── Derived values ─────────────────────────────────────────────────

  const isSlowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
  const isDataSaver = connection?.saveData === true;
  const connectionType = connection?.type || 'unknown';

  return {
    isOnline,
    connection,
    isSlowConnection,
    isDataSaver,
    connectionType,
  };
};

// ── useNetworkQuality ────────────────────────────────────────────────────

/**
 * Returns network quality metrics.
 * 
 * @returns {Object} { type, effectiveType, downlink, rtt, isMetered }
 */
export const useNetworkQuality = () => {
  const [quality, setQuality] = useState(() => {
    const nav = getNavigator();
    if (!nav?.connection) return null;

    return {
      type: nav.connection.type || 'unknown',
      effectiveType: nav.connection.effectiveType || 'unknown',
      downlink: nav.connection.downlink || 0,
      rtt: nav.connection.rtt || 0,
      isMetered: nav.connection.saveData || false,
    };
  });

  useEffect(() => {
    const nav = getNavigator();
    if (!nav?.connection) return;

    const updateQuality = () => {
      setQuality({
        type: nav.connection.type || 'unknown',
        effectiveType: nav.connection.effectiveType || 'unknown',
        downlink: nav.connection.downlink || 0,
        rtt: nav.connection.rtt || 0,
        isMetered: nav.connection.saveData || false,
      });
    };

    if (typeof nav.connection.addEventListener === 'function') {
      nav.connection.addEventListener('change', updateQuality);
      return () => nav.connection.removeEventListener('change', updateQuality);
    }
  }, []);

  return quality;
};

// ── useConnectionAware ───────────────────────────────────────────────────

/**
 * Higher-level hook that combines online status with network quality
 * to make smart decisions about data usage.
 * 
 * @returns {Object} { shouldLoadImages, shouldLoadVideo, shouldUseHighQuality, isOnline }
 */
export const useConnectionAware = () => {
  const { isOnline, isSlowConnection, isDataSaver } = useOnlineStatus({ verifyWithFetch: true });

  return {
    isOnline,
    isSlowConnection,
    isDataSaver,
    shouldLoadImages: isOnline && !isDataSaver,
    shouldLoadVideo: isOnline && !isSlowConnection && !isDataSaver,
    shouldUseHighQuality: isOnline && !isSlowConnection && !isDataSaver,
    shouldDeferNonCritical: isSlowConnection || isDataSaver,
  };
};

export default useOnlineStatus;