import { useState, useEffect, useRef, useCallback } from 'react';

// ── SSR-Safe Helpers ────────────────────────────────────────────────────

const getWindow = () => {
  if (typeof window === 'undefined') return null;
  return window;
};

// ── useScrollDirection ──────────────────────────────────────────────────

/**
 * Detects scroll direction with RAF-based throttling.
 * Does NOT remove/re-add listeners on state changes.
 * 
 * @param {number} threshold - Minimum scroll distance before direction changes (default: 10)
 * @returns {Object} { scrollDirection, scrollY, isScrolled }
 */
export const useScrollDirection = (threshold = 10) => {
  // FIXED: Use refs for mutable values instead of state for deps
  const [scrollDirection, setScrollDirection] = useState('up');
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const lastScrollYRef = useRef(0);
  const lastDirectionRef = useRef('up');
  const tickingRef = useRef(false);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    // Set initial scroll position
    lastScrollYRef.current = window.scrollY;
    setScrollY(window.scrollY);
    setIsScrolled(window.scrollY > threshold);

    const handleScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollYRef.current;

          // Update scroll position
          setScrollY(currentScrollY);
          setIsScrolled(currentScrollY > threshold);

          // Only detect direction if threshold is exceeded
          if (Math.abs(diff) >= threshold) {
            const newDirection = diff > 0 ? 'down' : 'up';

            if (newDirection !== lastDirectionRef.current) {
              lastDirectionRef.current = newDirection;
              setScrollDirection(newDirection);
            }

            lastScrollYRef.current = currentScrollY;
          }

          tickingRef.current = false;
        });

        tickingRef.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      tickingRef.current = false;
    };
  }, [threshold]); // FIXED: Only depends on threshold

  return { scrollDirection, scrollY, isScrolled };
};

// ── useScrollPosition ────────────────────────────────────────────────────

/**
 * Tracks the scroll position with configurable debounce/throttle.
 * 
 * @param {Object} options - Configuration
 * @param {number} options.throttle - Throttle interval in ms (default: 0 = RAF)
 * @returns {{ x: number, y: number }} Scroll position
 */
export const useScrollPosition = (options = {}) => {
  const { throttle = 0 } = options;
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? window.scrollX : 0,
    y: typeof window !== 'undefined' ? window.scrollY : 0,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;
    let lastTime = 0;

    const handleScroll = () => {
      if (throttle > 0) {
        const now = Date.now();
        if (now - lastTime < throttle) return;
        lastTime = now;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setPosition({ x: window.scrollX, y: window.scrollY });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [throttle]);

  return position;
};

// ── useScrollProgress ────────────────────────────────────────────────────

/**
 * Returns the scroll progress as a percentage (0-100).
 * Useful for progress bars, reading indicators, etc.
 * 
 * @returns {number} Scroll percentage (0-100)
 */
export const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

          setProgress(Math.min(100, Math.max(0, scrollPercent)));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
};

// ── useScrollToTop ───────────────────────────────────────────────────────

/**
 * Returns a boolean indicating whether to show a "scroll to top" button.
 * 
 * @param {number} threshold - Pixel threshold to show the button (default: 400)
 * @returns {boolean} Whether to show the button
 */
export const useScrollToTop = (threshold = 400) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShow(window.scrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { show, scrollToTop };
};

// ── useScrollSpy ────────────────────────────────────────────────────────

/**
 * Tracks which section is currently in view based on scroll position.
 * More efficient than IntersectionObserver for simple cases.
 * 
 * @param {string[]} sectionIds - Array of section element IDs
 * @param {number} offset - Offset from top (default: 100)
 * @returns {string|null} Currently visible section ID
 */
export const useScrollSpy = (sectionIds = [], offset = 100) => {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || sectionIds.length === 0) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + offset;

          // Find the section that is currently in view
          for (let i = sectionIds.length - 1; i >= 0; i--) {
            const element = document.getElementById(sectionIds[i]);
            if (element && element.offsetTop <= scrollPosition) {
              setActiveId(sectionIds[i]);
              break;
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds, offset]);

  return activeId;
};

// ── useInfiniteScroll ────────────────────────────────────────────────────

/**
 * Triggers a callback when the user scrolls near the bottom of the page.
 * 
 * @param {Function} callback - Called when near the bottom
 * @param {Object} options - Configuration
 * @param {number} options.threshold - Distance from bottom (px) to trigger (default: 200)
 * @param {boolean} options.enabled - Whether to listen (default: true)
 * @param {boolean} options.hasMore - Whether there's more data to load
 */
export const useInfiniteScroll = (callback, options = {}) => {
  const { threshold = 200, enabled = true, hasMore = true } = options;
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !hasMore || typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const windowHeight = window.innerHeight;
          const docHeight = document.documentElement.scrollHeight;

          if (scrollTop + windowHeight >= docHeight - threshold) {
            callbackRef.current();
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, hasMore, threshold]);
};

// ── useScrollLock ────────────────────────────────────────────────────────

/**
 * Locks body scroll when active.
 * 
 * @param {boolean} isLocked - Whether to lock scrolling
 */
export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
};

export default useScrollDirection;