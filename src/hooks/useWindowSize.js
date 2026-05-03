import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ── SSR-Safe Helpers ────────────────────────────────────────────────────

const getWindowSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

// ── useWindowSize ────────────────────────────────────────────────────────

/**
 * Tracks window dimensions with debounced resize handling.
 * 
 * @param {Object} options - Configuration
 * @param {number} options.debounceDelay - Debounce delay in ms (default: 100)
 * @param {boolean} options.includeScrollbar - Include scrollbar in width (default: true)
 * @returns {{ width: number, height: number }} Window dimensions
 */
export const useWindowSize = (options = {}) => {
  const { debounceDelay = 100, includeScrollbar = true } = options;
  const timeoutRef = useRef(null);

  // FIXED: SSR-safe initial state
  const [windowSize, setWindowSize] = useState(() => getWindowSize());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const width = includeScrollbar
          ? window.innerWidth
          : document.documentElement.clientWidth;
        const height = includeScrollbar
          ? window.innerHeight
          : document.documentElement.clientHeight;

        setWindowSize({ width, height });
      }, debounceDelay);
    };

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debounceDelay, includeScrollbar]);

  return windowSize;
};

// ── useBreakpoint ────────────────────────────────────────────────────────

/**
 * Returns the current breakpoint name and whether it matches specific sizes.
 * 
 * @returns {Object} { breakpoint, isXs, isSm, isMd, isLg, isXl, is2xl, isMobile, isTablet, isDesktop }
 */
export const useBreakpoint = () => {
  const { width } = useWindowSize({ debounceDelay: 200 });

  return useMemo(() => {
    const breakpoints = {
      xs: width < 640,
      sm: width >= 640 && width < 768,
      md: width >= 768 && width < 1024,
      lg: width >= 1024 && width < 1280,
      xl: width >= 1280 && width < 1536,
      '2xl': width >= 1536,
    };

    const breakpoint = Object.entries(breakpoints).find(([, matches]) => matches)?.[0] || 'xs';

    return {
      breakpoint,
      isXs: breakpoint === 'xs',
      isSm: breakpoint === 'sm',
      isMd: breakpoint === 'md',
      isLg: breakpoint === 'lg',
      isXl: breakpoint === 'xl',
      is2xl: breakpoint === '2xl',
      isMobile: breakpoint === 'xs' || breakpoint === 'sm',
      isTablet: breakpoint === 'md',
      isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
      width,
    };
  }, [width]);
};

// ── useResponsive ────────────────────────────────────────────────────────

/**
 * Accepts breakpoint-specific values and returns the one for the current viewport.
 * Similar to CSS custom properties / container queries.
 * 
 * @param {Object} values - { base, sm, md, lg, xl, '2xl' }
 * @returns {*} The value for the current breakpoint
 * 
 * @example
 * const columns = useResponsive({ base: 1, sm: 2, lg: 3, xl: 4 });
 */
export const useResponsive = (values = {}) => {
  const { breakpoint } = useBreakpoint();
  
  return useMemo(() => {
    const priority = ['2xl', 'xl', 'lg', 'md', 'sm', 'base'];
    
    for (const bp of priority) {
      if (bp === 'base') return values.base;
      if (bp === breakpoint || (bp === 'sm' && breakpoint === 'sm')) {
        if (values[bp] !== undefined) return values[bp];
      }
      if (bp === breakpoint && values[bp] !== undefined) return values[bp];
    }

    return values.base;
  }, [breakpoint, values]);
};

// ── useOrientation ───────────────────────────────────────────────────────

/**
 * Tracks device orientation (portrait/landscape).
 * Uses both screen dimensions and the Screen Orientation API.
 * 
 * @returns {Object} { orientation, isPortrait, isLandscape, angle }
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(() => {
    if (typeof window === 'undefined') return { type: 'portrait', angle: 0 };
    
    return {
      type: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      angle: screen?.orientation?.angle || 0,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOrientation = () => {
      setOrientation({
        type: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        angle: screen?.orientation?.angle || 0,
      });
    };

    // Screen Orientation API
    if (screen?.orientation?.addEventListener) {
      screen.orientation.addEventListener('change', updateOrientation);
    }

    // Fallback: listen to resize
    window.addEventListener('resize', updateOrientation, { passive: true });

    return () => {
      if (screen?.orientation?.removeEventListener) {
        screen.orientation.removeEventListener('change', updateOrientation);
      }
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return useMemo(() => ({
    orientation: orientation.type,
    isPortrait: orientation.type === 'portrait',
    isLandscape: orientation.type === 'landscape',
    angle: orientation.angle,
  }), [orientation]);
};

// ── useElementSize ───────────────────────────────────────────────────────

/**
 * Tracks the size of a specific DOM element using ResizeObserver.
 * 
 * @param {React.RefObject} ref - Element ref to observe
 * @param {Object} options - ResizeObserver options
 * @returns {{ width: number, height: number }} Element dimensions
 */
export const useElementSize = (ref, options = {}) => {
  const { debounceDelay = 100 } = options;
  const timeoutRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref?.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setSize({ width: Math.round(width), height: Math.round(height) });
        }
      }, debounceDelay);
    });

    observer.observe(element);

    // Set initial size
    const { width, height } = element.getBoundingClientRect();
    setSize({ width: Math.round(width), height: Math.round(height) });

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [ref, debounceDelay]);

  return size;
};

// ── useIsTouchDevice ─────────────────────────────────────────────────────

/**
 * Detects if the current device supports touch.
 * 
 * @returns {boolean} Whether the device supports touch
 */
export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Touch event listener (one-time detection)
    const handleTouch = () => {
      setIsTouch(true);
      window.removeEventListener('touchstart', handleTouch);
    };

    window.addEventListener('touchstart', handleTouch, { once: true });
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

  return isTouch;
};

export default useWindowSize;