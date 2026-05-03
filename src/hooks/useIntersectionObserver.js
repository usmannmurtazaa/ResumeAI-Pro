import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// ── useIntersectionObserver ──────────────────────────────────────────────

/**
 * Observes an element's visibility using IntersectionObserver.
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {Element} options.root - Root element for intersection
 * @param {string} options.rootMargin - Margin around root
 * @param {boolean} options.freezeOnceVisible - Stop observing after first intersection
 * @param {boolean} options.enabled - Whether the observer is active (default: true)
 * @param {Function} options.onIntersect - Callback when intersection changes
 * @returns {Object} { ref, isIntersecting, entry, intersectionRatio }
 */
export const useIntersectionObserver = (options = {}) => {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
    enabled = true,
    onIntersect,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  
  const elementRef = useRef(null);
  const frozenRef = useRef(false);
  const observerRef = useRef(null);
  const onIntersectRef = useRef(onIntersect);

  // Keep callback ref updated
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  // ── Build observer options ──────────────────────────────────────────

  const observerOptions = useMemo(() => ({
    threshold,
    root,
    rootMargin,
  }), [threshold, root, rootMargin]);

  // ── Observe element ─────────────────────────────────────────────────

  useEffect(() => {
    const element = elementRef.current;

    // Don't observe if disabled, no element, or already frozen
    if (!enabled || !element || frozenRef.current) return;

    // Create observer
    observerRef.current = new IntersectionObserver(([entry]) => {
      const intersecting = entry.isIntersecting;

      setIsIntersecting(intersecting);
      setEntry(entry);
      setIntersectionRatio(entry.intersectionRatio);

      // Call callback
      onIntersectRef.current?.(entry, intersecting);

      // Freeze if option enabled
      if (freezeOnceVisible && intersecting) {
        frozenRef.current = true;
        observerRef.current?.unobserve(element);
      }
    }, observerOptions);

    observerRef.current.observe(element);

    return () => {
      if (element && observerRef.current) {
        observerRef.current.unobserve(element);
      }
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [enabled, observerOptions, freezeOnceVisible]);

  // ── Reset frozen state when dependencies change ─────────────────────

  useEffect(() => {
    frozenRef.current = false;
  }, [threshold, root, rootMargin]);

  return useMemo(() => ({
    ref: elementRef,
    isIntersecting,
    entry,
    intersectionRatio,
  }), [isIntersecting, entry, intersectionRatio]);
};

// ── useInView ────────────────────────────────────────────────────────────

/**
 * Simplified version that only returns whether the element is in view.
 * Perfect for scroll-triggered animations and lazy loading.
 * 
 * @param {Object} options - Same as useIntersectionObserver
 * @returns {[React.Ref, boolean]} [ref, isInView]
 */
export const useInView = (options = {}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0,
    ...options,
  });
  
  return [ref, isIntersecting];
};

// ── useLazyLoad ──────────────────────────────────────────────────────────

/**
 * Returns a ref and whether the element has been visible.
 * Once visible, stays true (great for lazy-loading components).
 * 
 * @param {Object} options - Same as useIntersectionObserver
 * @returns {[React.Ref, boolean]} [ref, hasBeenVisible]
 */
export const useLazyLoad = (options = {}) => {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const onIntersectRef = useRef(null);

  const handleIntersect = useCallback((entry, isIntersecting) => {
    if (isIntersecting && !hasBeenVisible) {
      setHasBeenVisible(true);
    }
  }, [hasBeenVisible]);

  const { ref } = useIntersectionObserver({
    threshold: 0,
    freezeOnceVisible: true,
    onIntersect: handleIntersect,
    ...options,
  });

  return [ref, hasBeenVisible];
};

// ── useStaggerAnimation ──────────────────────────────────────────────────

/**
 * Triggers staggered animations when elements enter the viewport.
 * Returns a ref and a delay based on index.
 * 
 * @param {number} index - Element index for stagger calculation
 * @param {number} staggerDelay - Delay between each element (ms)
 * @param {Object} options - Same as useIntersectionObserver
 * @returns {Object} { ref, isVisible, delay }
 */
export const useStaggerAnimation = (index = 0, staggerDelay = 100, options = {}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
    ...options,
  });

  const delay = isIntersecting ? index * staggerDelay : 0;

  return useMemo(() => ({ ref, isVisible: isIntersecting, delay }), [ref, isIntersecting, delay]);
};

// ── useScrollSpy ─────────────────────────────────────────────────────────

/**
 * Tracks which section is currently in view for scroll spy navigation.
 * 
 * @param {string[]} sectionIds - Array of section element IDs to track
 * @param {Object} options - Configuration
 * @param {number} options.offset - Offset from top (default: 0)
 * @param {string} options.rootMargin - Root margin for observer
 * @returns {string|null} Currently visible section ID
 */
export const useScrollSpy = (sectionIds = [], options = {}) => {
  const { offset = 0, rootMargin = '-10% 0px -60% 0px' } = options;
  const [activeId, setActiveId] = useState(null);
  const observersRef = useRef([]);

  useEffect(() => {
    // Cleanup previous observers
    observersRef.current.forEach(observer => observer.disconnect());
    observersRef.current = [];

    if (sectionIds.length === 0) return;

    const handleIntersect = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold: 0.5,
    });

    sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    observersRef.current.push(observer);

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, rootMargin]);

  return activeId;
};

export default useIntersectionObserver;