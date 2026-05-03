import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ── useDebounce (value debounce) ──────────────────────────────────────────

/**
 * Debounces a value by the specified delay.
 * Useful for search inputs, form values, etc.
 * 
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount or value/delay change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

// ── useDebouncedCallback (callback debounce) ─────────────────────────────

/**
 * Debounces a callback function.
 * The callback will only be called after the specified delay
 * since the last invocation.
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Additional options
 * @param {boolean} options.leading - Call on the leading edge
 * @param {boolean} options.trailing - Call on the trailing edge (default: true)
 * @returns {Object} { debouncedCallback, cancel, flush, pending }
 */
export const useDebouncedCallback = (callback, delay, options = {}) => {
  const { leading = false, trailing = true } = options;
  
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  const pendingArgsRef = useRef(null);
  const [pending, setPending] = useState(false);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // ── Execute the callback ──────────────────────────────────────────

  const executeCallback = useCallback((args) => {
    callbackRef.current(...args);
    pendingArgsRef.current = null;
    setPending(false);
  }, []);

  // ── Cancel pending execution ──────────────────────────────────────

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingArgsRef.current = null;
    setPending(false);
  }, []);

  // ── Flush (execute immediately) ────────────────────────────────────

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingArgsRef.current) {
      executeCallback(pendingArgsRef.current);
    }
  }, [executeCallback]);

  // ── Debounced callback ────────────────────────────────────────────

  const debouncedCallback = useCallback((...args) => {
    // Leading edge execution
    if (leading && !timeoutRef.current) {
      executeCallback(args);
      return;
    }

    // Store latest args
    pendingArgsRef.current = args;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set pending state
    setPending(true);

    // Set new timeout for trailing edge
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (pendingArgsRef.current) {
          executeCallback(pendingArgsRef.current);
        }
      }, delay);
    }
  }, [delay, leading, trailing, executeCallback]);

  // ── Cleanup on unmount ───────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedCallback,
    cancel,
    flush,
    pending,
  };
};

// ── useThrottle (throttle value) ──────────────────────────────────────────

/**
 * Throttles a value by the specified interval.
 * The value updates at most once per interval.
 * 
 * @param {*} value - The value to throttle
 * @param {number} interval - Throttle interval in milliseconds
 * @returns {*} Throttled value
 */
export const useThrottle = (value, interval) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdatedRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdatedRef.current;

    if (timeSinceLastUpdate >= interval) {
      // Update immediately
      lastUpdatedRef.current = now;
      setThrottledValue(value);
    } else {
      // Schedule update for remaining time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastUpdatedRef.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, interval]);

  return throttledValue;
};

// ── useThrottledCallback (throttle callback) ─────────────────────────────

/**
 * Throttles a callback to execute at most once per interval.
 * 
 * @param {Function} callback - The function to throttle
 * @param {number} interval - Throttle interval in milliseconds
 * @returns {Function} Throttled callback
 */
export const useThrottledCallback = (callback, interval) => {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= interval) {
      lastCallRef.current = now;
      callbackRef.current(...args);
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        timeoutRef.current = null;
        callbackRef.current(...args);
      }, interval - timeSinceLastCall);
    }
  }, [interval]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

// ── useOnlineStatus ──────────────────────────────────────────────────────

/**
 * Tracks online/offline status.
 * 
 * @returns {boolean} Whether the browser is online
 */
export const useOnlineStatus = () => {
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

// ── useScrollDirection ───────────────────────────────────────────────────

/**
 * Detects scroll direction (up/down).
 * 
 * @param {number} threshold - Minimum scroll distance before direction changes
 * @returns {string} 'up' | 'down'
 */
export const useScrollDirection = (threshold = 10) => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY.current;

      if (Math.abs(diff) >= threshold) {
        setScrollDirection(diff > 0 ? 'down' : 'up');
        lastScrollY.current = scrollY;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrollDirection;
};

// ── useKeyboardShortcut ──────────────────────────────────────────────────

/**
 * Registers a keyboard shortcut.
 * 
 * @param {string} key - The key to listen for
 * @param {Function} callback - The function to call
 * @param {Object} options - Modifiers { ctrl, meta, shift, alt }
 */
export const useKeyboardShortcut = (key, callback, options = {}) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (event) => {
      // Skip if target is an input
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target.isContentEditable) {
        return;
      }

      const { ctrl = false, meta = false, shift = false, alt = false } = options;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.metaKey === meta &&
        event.shiftKey === shift &&
        event.altKey === alt
      ) {
        event.preventDefault();
        callbackRef.current(event);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, options]);
};

// ── useLocalStorage ──────────────────────────────────────────────────────

/**
 * Persists state to localStorage.
 * 
 * @param {string} key - localStorage key
 * @param {*} initialValue - Default value
 * @returns {[*, Function]} State and setter
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// ── useMediaQuery ────────────────────────────────────────────────────────

/**
 * Tracks a CSS media query.
 * 
 * @param {string} query - CSS media query string
 * @returns {boolean} Whether the query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (event) => setMatches(event.matches);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Modern browsers
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [query]);

  return matches;
};

// ── useClickOutside ──────────────────────────────────────────────────────

/**
 * Detects clicks outside a ref element.
 * 
 * @param {Function} handler - Called when click is outside
 * @returns {React.RefObject} Ref to attach to element
 */
export const useClickOutside = (handler) => {
  const ref = useRef(null);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handlerRef.current(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, []);

  return ref;
};

export default useDebounce;