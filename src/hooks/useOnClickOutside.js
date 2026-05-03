import { useEffect, useRef, useCallback } from 'react';

// ── SSR-Safe Helper ──────────────────────────────────────────────────────

const getDocument = () => {
  if (typeof document === 'undefined') return null;
  return document;
};

// ── useOnClickOutside ────────────────────────────────────────────────────

/**
 * Detects clicks/touches outside a ref element and fires a handler.
 * Also handles Escape key for accessibility.
 * 
 * @param {React.RefObject|React.RefObject[]} refs - Ref or array of refs to monitor
 * @param {Function} handler - Called when click/touch is outside all refs
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether the listener is active (default: true)
 * @param {boolean} options.listenEscape - Also fire on Escape key (default: true)
 * @param {string[]} options.events - Custom events to listen for
 * 
 * @example
 * const dropdownRef = useRef(null);
 * useOnClickOutside(dropdownRef, () => setIsOpen(false));
 * 
 * // Multiple refs
 * useOnClickOutside([modalRef, buttonRef], closeModal);
 */
export const useOnClickOutside = (refs, handler, options = {}) => {
  const {
    enabled = true,
    listenEscape = true,
    events = ['mousedown', 'touchstart'],
  } = options;

  // FIXED: Use ref for handler to avoid re-attaching listeners
  const handlerRef = useRef(handler);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    // SSR guard
    if (typeof document === 'undefined') return;

    const refArray = Array.isArray(refs) ? refs : [refs];

    // ── Click/Touch outside listener ──────────────────────────────────

    const listener = (event) => {
      if (!enabledRef.current) return;

      // Check if the click was inside any of the refs
      const isInside = refArray.some((ref) => {
        const el = ref?.current;
        return el && (el === event.target || el.contains(event.target));
      });

      if (!isInside) {
        handlerRef.current(event);
      }
    };

    // ── Escape key listener ──────────────────────────────────────────

    const handleEscape = (event) => {
      if (!enabledRef.current || !listenEscape) return;
      
      if (event.key === 'Escape') {
        handlerRef.current(event);
      }
    };

    // ── Attach listeners ─────────────────────────────────────────────

    events.forEach((eventName) => {
      document.addEventListener(eventName, listener, { passive: true });
    });

    if (listenEscape) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      events.forEach((eventName) => {
        document.removeEventListener(eventName, listener);
      });

      if (listenEscape) {
        document.removeEventListener('keydown', handleEscape);
      }
    };
  }, [refs, events, listenEscape]); // FIXED: handler removed from deps
};

// ── useFocusTrap ─────────────────────────────────────────────────────────

/**
 * Traps keyboard focus within a container element.
 * Essential for modal dialogs and drawers.
 * 
 * @param {React.RefObject} containerRef - Ref to the container element
 * @param {Object} options - Configuration
 * @param {boolean} options.enabled - Whether the trap is active
 * @param {React.RefObject} options.initialFocusRef - Element to focus on mount
 * @param {boolean} options.autoFocus - Auto-focus first element on mount (default: true)
 * 
 * @example
 * const modalRef = useRef(null);
 * useFocusTrap(modalRef, { enabled: isOpen });
 */
export const useFocusTrap = (containerRef, options = {}) => {
  const {
    enabled = true,
    initialFocusRef = null,
    autoFocus = true,
  } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusableElements = () => 
      Array.from(container.querySelectorAll(focusableSelector))
        .filter(el => el.offsetParent !== null); // Visible elements only

    // ── Handle tab key ───────────────────────────────────────────────

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // ── Initial focus ────────────────────────────────────────────────

    if (autoFocus) {
      const initialElement = initialFocusRef?.current;
      
      if (initialElement && initialElement.focus) {
        initialElement.focus();
      } else {
        const elements = getFocusableElements();
        if (elements.length > 0) {
          elements[0].focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);

    // ── Restore focus on disable ─────────────────────────────────────

    const previouslyFocused = document.activeElement;

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (previouslyFocused && previouslyFocused.focus) {
        try {
          previouslyFocused.focus();
        } catch {
          // Ignore if element is no longer in DOM
        }
      }
    };
  }, [enabled, containerRef, initialFocusRef, autoFocus]);
};

// ── useEscapeKey ─────────────────────────────────────────────────────────

/**
 * Fires a callback when the Escape key is pressed.
 * Respects element hierarchy (closest handler wins).
 * 
 * @param {Function} handler - Called when Escape is pressed
 * @param {Object} options - Configuration
 * @param {boolean} options.enabled - Whether to listen (default: true)
 * @param {Element} options.scope - Only fire if this element contains the active element
 */
export const useEscapeKey = (handler, options = {}) => {
  const { enabled = true, scope = null } = options;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      // If scope is provided, only fire when the active element is inside it
      if (scope) {
        const scopeEl = scope instanceof HTMLElement ? scope : scope.current;
        if (scopeEl && !scopeEl.contains(document.activeElement)) return;
      }

      handlerRef.current(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, scope]);
};

// ── useClickOutside (Alternative API) ────────────────────────────────────

/**
 * Alternative API that returns a ref to attach to the element.
 * Better DX when you don't need a separate ref variable.
 * 
 * @param {Function} handler - Called when click is outside
 * @param {Object} options - Same as useOnClickOutside
 * @returns {React.RefObject} Ref to attach to your element
 * 
 * @example
 * function Dropdown() {
 *   const ref = useClickOutside(() => setIsOpen(false));
 *   return <div ref={ref}>{content}</div>;
 * }
 */
export const useClickOutside = (handler, options = {}) => {
  const ref = useRef(null);
  useOnClickOutside(ref, handler, options);
  return ref;
};

// ── useInteractOutside ───────────────────────────────────────────────────

/**
 * Combines click-outside, escape key, and scroll lock for modal/dialog patterns.
 * The ultimate hook for dismissible overlays.
 * 
 * @param {React.RefObject} ref - Ref to the element
 * @param {Function} onDismiss - Called when interaction outside is detected
 * @param {Object} options - Configuration
 * @param {boolean} options.enabled - Whether to listen (default: true)
 * @param {boolean} options.closeOnEscape - Close on Escape key
 * @param {boolean} options.closeOnOutsideClick - Close on outside click
 * @param {boolean} options.preventScroll - Lock body scroll when active
 */
export const useInteractOutside = (ref, onDismiss, options = {}) => {
  const {
    enabled = true,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    preventScroll = true,
  } = options;

  // ── Click outside ──────────────────────────────────────────────────

  useOnClickOutside(ref, onDismiss, { enabled: enabled && closeOnOutsideClick });

  // ── Escape key ─────────────────────────────────────────────────────

  useEscapeKey(onDismiss, { enabled: enabled && closeOnEscape });

  // ── Scroll lock ────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !preventScroll || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = '';
    };
  }, [enabled, preventScroll]);
};

export default useOnClickOutside;