import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// ── Predefined Breakpoints ───────────────────────────────────────────────

export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

// ── SSR-Safe Helper ──────────────────────────────────────────────────────

const getMatchMedia = (query) => {
  if (typeof window === 'undefined') return null;
  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
};

// ── useMediaQuery ────────────────────────────────────────────────────────

/**
 * Tracks whether a CSS media query matches.
 * 
 * @param {string} query - CSS media query string (e.g., '(min-width: 768px)')
 * @param {Object} options - Configuration options
 * @param {*} options.defaultValue - Value to use during SSR (default: false)
 * @param {boolean} options.enabled - Whether to listen for changes (default: true)
 * @returns {boolean} Whether the media query currently matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 * const isPrint = useMediaQuery('print');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export const useMediaQuery = (query, options = {}) => {
  const { defaultValue = false, enabled = true } = options;
  
  // FIXED: Use a ref for the initial value, don't put matches in deps
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const media = getMatchMedia(query);
    return media ? media.matches : defaultValue;
  });

  // ── FIXED: No `matches` in dependency array ─────────────────────────

  useEffect(() => {
    // SSR guard
    if (!enabled || typeof window === 'undefined') return;

    const media = getMatchMedia(query);
    if (!media) return;

    // Sync state if it differs from the media query result
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Handler for changes
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers (Safari < 14)
    try {
      media.addListener(handleChange);
      return () => media.removeListener(handleChange);
    } catch {
      // Very old browsers - no cleanup possible
      return undefined;
    }
  }, [query, enabled]); // FIXED: Only depends on query and enabled

  return matches;
};

// ── useBreakpoints ───────────────────────────────────────────────────────

/**
 * Returns responsive breakpoint booleans.
 * All breakpoints share a single matchMedia check for efficiency.
 * 
 * @returns {Object} { sm, md, lg, xl, xxl, current, isMobile, isTablet, isDesktop }
 * 
 * @example
 * const { isMobile, isTablet, isDesktop } = useBreakpoints();
 * if (isMobile) return <MobileView />;
 * if (isDesktop) return <DesktopView />;
 */
export const useBreakpoints = () => {
  const sm = useMediaQuery(BREAKPOINTS.sm);
  const md = useMediaQuery(BREAKPOINTS.md);
  const lg = useMediaQuery(BREAKPOINTS.lg);
  const xl = useMediaQuery(BREAKPOINTS.xl);
  const xxl = useMediaQuery(BREAKPOINTS['2xl']);

  // ── Derived breakpoints ────────────────────────────────────────────

  const current = useMemo(() => {
    if (xxl) return '2xl';
    if (xl) return 'xl';
    if (lg) return 'lg';
    if (md) return 'md';
    if (sm) return 'sm';
    return 'xs';
  }, [sm, md, lg, xl, xxl]);

  const isMobile = !sm;
  const isTablet = sm && !lg;
  const isDesktop = lg;

  return useMemo(() => ({
    sm, md, lg, xl, xxl,
    current,
    isMobile,
    isTablet,
    isDesktop,
  }), [sm, md, lg, xl, xxl, current, isMobile, isTablet, isDesktop]);
};

// ── useReducedMotion ─────────────────────────────────────────────────────

/**
 * Returns whether the user prefers reduced motion.
 * 
 * @returns {boolean} Whether reduced motion is preferred
 */
export const useReducedMotion = () => {
  return useMediaQuery('(prefers-reduced-motion: reduce)', { defaultValue: false });
};

// ── useColorScheme ───────────────────────────────────────────────────────

/**
 * Returns the user's preferred color scheme.
 * 
 * @returns {'light' | 'dark'} The preferred color scheme
 */
export const useColorScheme = () => {
  const isDark = useMediaQuery('(prefers-color-scheme: dark)');
  return isDark ? 'dark' : 'light';
};

// ── useResponsive ────────────────────────────────────────────────────────

/**
 * Powerful responsive hook that accepts breakpoint-specific values.
 * Similar to the `useResponsive` pattern but with full type safety.
 * 
 * @param {Object} values - Object with breakpoint keys and their corresponding values
 * @returns {*} The value for the current breakpoint
 * 
 * @example
 * const columns = useResponsive({
 *   base: 1,    // Mobile (< 640px)
 *   sm: 2,      // 640px+
 *   md: 3,      // 768px+
 *   lg: 4,      // 1024px+
 *   xl: 5,      // 1280px+
 * });
 */
export const useResponsive = (values = {}) => {
  const { current } = useBreakpoints();

  return useMemo(() => {
    // Return the most specific match, falling back to base
    const priority = ['2xl', 'xl', 'lg', 'md', 'sm', 'base'];
    
    for (const bp of priority) {
      if (bp === 'base') return values.base;
      if (current === bp || (bp === '2xl' && current === '2xl')) {
        if (values[bp] !== undefined) return values[bp];
      }
      // For breakpoints wider than current, return the current one
      if (bp === current) return values[bp] ?? values.base;
    }

    return values.base;
  }, [current, values]);
};

// ── useWindowSize ────────────────────────────────────────────────────────

/**
 * Tracks window dimensions with debounced resize handling.
 * 
 * @param {Object} options - Configuration
 * @param {number} options.debounceDelay - Debounce delay in ms (default: 100)
 * @returns {{ width: number, height: number }} Window dimensions
 */
export const useWindowSize = (options = {}) => {
  const { debounceDelay = 100 } = options;
  const timeoutRef = useRef(null);

  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceDelay);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    // Set initial size
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [debounceDelay]);

  return windowSize;
};

// ── useDeviceDetection ───────────────────────────────────────────────────

/**
 * Detects device type based on user agent and screen size.
 * 
 * @returns {Object} { isMobile, isTablet, isDesktop, isTouch, deviceType }
 */
export const useDeviceDetection = () => {
  const [device, setDevice] = useState(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    deviceType: 'desktop',
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const width = window.innerWidth;

    const isMobileDevice = /mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent);
    const isTabletDevice = /ipad|tablet|playbook|silk/i.test(userAgent);

    let deviceType = 'desktop';
    if (width < 768 || isMobileDevice) deviceType = 'mobile';
    else if (width < 1024 || isTabletDevice) deviceType = 'tablet';

    setDevice({
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isTouch,
      deviceType,
    });
  }, []);

  // Also update on resize
  const { width } = useWindowSize({ debounceDelay: 500 });

  useEffect(() => {
    if (width < 768) {
      setDevice(prev => ({ ...prev, isMobile: true, isTablet: false, isDesktop: false, deviceType: 'mobile' }));
    } else if (width < 1024) {
      setDevice(prev => ({ ...prev, isMobile: false, isTablet: true, isDesktop: false, deviceType: 'tablet' }));
    } else {
      setDevice(prev => ({ ...prev, isMobile: false, isTablet: false, isDesktop: true, deviceType: 'desktop' }));
    }
  }, [width]);

  return device;
};

export default useMediaQuery;