import { useEffect, useMemo, useRef } from 'react';

const normalizeKey = (key) => {
  if (typeof key !== 'string') {
    return '';
  }

  const normalized = key.toLowerCase();

  if (normalized === 'esc') {
    return 'escape';
  }

  if (normalized === 'spacebar') {
    return ' ';
  }

  return normalized;
};

const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;

  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  );
};

const matchesModifiers = (event, { ctrl, alt, shift, meta, exact }) => {
  if (meta) {
    if (!event.metaKey) {
      return false;
    }

    if (exact && event.ctrlKey) {
      return false;
    }
  } else if (ctrl) {
    // Treat ctrl as the primary shortcut modifier:
    // Ctrl on Windows/Linux and Cmd on macOS.
    if (!(event.ctrlKey || event.metaKey)) {
      return false;
    }
  } else if (exact && (event.ctrlKey || event.metaKey)) {
    return false;
  }

  if (alt) {
    if (!event.altKey) {
      return false;
    }
  } else if (exact && event.altKey) {
    return false;
  }

  if (shift) {
    if (!event.shiftKey) {
      return false;
    }
  } else if (exact && event.shiftKey) {
    return false;
  }

  return true;
};

/**
 * Custom hook for keyboard shortcuts.
 *
 * @param {string|string[]} keys
 * @param {(event: KeyboardEvent) => void} callback
 * @param {Object} options
 * @param {boolean} options.ctrl - Primary modifier shortcut (Ctrl on Windows/Linux, Cmd on macOS)
 * @param {boolean} options.alt
 * @param {boolean} options.shift
 * @param {boolean} options.meta - Requires the actual Meta/Command key
 * @param {boolean} options.preventDefault
 * @param {boolean} options.enabled
 * @param {boolean} options.allowInInput
 * @param {boolean} options.allowRepeat
 * @param {boolean} options.exact - Prevent unspecified modifiers from also being pressed
 */
export const useKeyboardShortcut = (keys, callback, options = {}) => {
  const {
    ctrl = false,
    alt = false,
    shift = false,
    meta = false,
    preventDefault = true,
    enabled = true,
    allowInInput = false,
    allowRepeat = false,
    exact = true,
  } = options;

  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const normalizedKeys = useMemo(() => {
    const keyList = Array.isArray(keys) ? keys : [keys];

    return new Set(keyList.map(normalizeKey).filter(Boolean));
  }, [keys]);

  useEffect(() => {
    if (!enabled || normalizedKeys.size === 0 || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.isComposing) {
        return;
      }

      if (!allowRepeat && event.repeat) {
        return;
      }

      if (!allowInInput && isTypingTarget(event.target)) {
        return;
      }

      const eventKey = normalizeKey(event.key);

      if (!normalizedKeys.has(eventKey)) {
        return;
      }

      if (
        !matchesModifiers(event, {
          ctrl,
          alt,
          shift,
          meta,
          exact,
        })
      ) {
        return;
      }

      if (preventDefault) {
        event.preventDefault();
      }

      callbackRef.current?.(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    allowInInput,
    allowRepeat,
    alt,
    ctrl,
    enabled,
    exact,
    meta,
    normalizedKeys,
    preventDefault,
    shift,
  ]);
};

export default useKeyboardShortcut;
