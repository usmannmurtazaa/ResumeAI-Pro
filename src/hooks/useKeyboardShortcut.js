import { useEffect, useMemo, useRef, useCallback, useState } from 'react';

// ── Utility Functions ────────────────────────────────────────────────────

const NORMALIZE_MAP = {
  'esc': 'escape',
  'spacebar': ' ',
  'space': ' ',
  'control': 'ctrl',
  'option': 'alt',
  'command': 'meta',
  'cmd': 'meta',
  'windows': 'meta',
  'up': 'arrowup',
  'down': 'arrowdown',
  'left': 'arrowleft',
  'right': 'arrowright',
  'del': 'delete',
  'return': 'enter',
  'plus': '+',
  'minus': '-',
  'period': '.',
  'comma': ',',
  'slash': '/',
  'backslash': '\\',
};

const normalizeKey = (key) => {
  if (typeof key !== 'string') return '';
  const normalized = key.toLowerCase();
  return NORMALIZE_MAP[normalized] || normalized;
};

const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox' ||
    target.closest('[contenteditable="true"]')
  );
};

/**
 * Matches modifier keys with platform-aware Ctrl/Cmd handling.
 * 
 * - `ctrl`: True on Windows/Linux with Ctrl key, or Mac with Cmd key
 * - `meta`: True only with the actual Meta/Cmd key
 * - `exact`: When true, only the specified modifiers can be pressed
 */
const matchesModifiers = (event, { ctrl, alt, shift, meta, exact }) => {
  if (meta) {
    if (!event.metaKey) return false;
    if (exact && event.ctrlKey) return false;
  } else if (ctrl) {
    // Platform-aware: Ctrl (Windows/Linux) or Cmd (Mac)
    if (!(event.ctrlKey || event.metaKey)) return false;
  } else {
    // Neither ctrl nor meta requested
    if (exact && (event.ctrlKey || event.metaKey)) return false;
  }

  if (alt) {
    if (!event.altKey) return false;
  } else if (exact && event.altKey) return false;

  if (shift) {
    if (!event.shiftKey) return false;
  } else if (exact && event.shiftKey) return false;

  return true;
};

// ── useKeyboardShortcut ──────────────────────────────────────────────────

/**
 * Registers a keyboard shortcut.
 *
 * @param {string|string[]} keys - Key or array of keys to listen for
 * @param {(event: KeyboardEvent) => void} callback - Handler function
 * @param {Object} options - Configuration
 * @param {boolean} options.ctrl - Ctrl (Win/Linux) or Cmd (Mac)
 * @param {boolean} options.alt - Alt/Option key
 * @param {boolean} options.shift - Shift key
 * @param {boolean} options.meta - Actual Meta/Cmd key (not platform-aware)
 * @param {boolean} options.preventDefault - Prevent default browser behavior
 * @param {boolean} options.enabled - Enable/disable the shortcut
 * @param {boolean} options.allowInInput - Fire even when typing in inputs
 * @param {boolean} options.allowRepeat - Fire on key repeat (holding key)
 * @param {boolean} options.exact - Only specified modifiers, no extras
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
  const optionsRef = useRef({ preventDefault, allowInInput, allowRepeat });

  // Keep refs updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    optionsRef.current = { preventDefault, allowInInput, allowRepeat };
  }, [preventDefault, allowInInput, allowRepeat]);

  const normalizedKeys = useMemo(() => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    return new Set(keyList.map(normalizeKey).filter(Boolean));
  }, [keys]);

  useEffect(() => {
    if (!enabled || normalizedKeys.size === 0 || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const { preventDefault: pd, allowInInput: aii, allowRepeat: ar } = optionsRef.current;

      // Skip if composing (e.g., IME input)
      if (event.isComposing) return;

      // Skip key repeat unless allowed
      if (!ar && event.repeat) return;

      // Skip typing targets unless allowed
      if (!aii && isTypingTarget(event.target)) return;

      // Check if the key matches
      const eventKey = normalizeKey(event.key);
      if (!normalizedKeys.has(eventKey)) return;

      // Check modifiers
      if (!matchesModifiers(event, { ctrl, alt, shift, meta, exact })) return;

      // Prevent default if configured
      if (pd) event.preventDefault();

      // Call the callback
      callbackRef.current?.(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [alt, ctrl, enabled, exact, meta, normalizedKeys, shift]);
};

// ── useKeySequence ───────────────────────────────────────────────────────

/**
 * Listens for a sequence of keys pressed in order.
 * Useful for "g + i" style shortcuts (like Gmail).
 * 
 * @param {string[]} sequence - Array of keys in order
 * @param {Function} callback - Called when sequence is matched
 * @param {Object} options - Same as useKeyboardShortcut options
 * 
 * @example
 * useKeySequence(['g', 'i'], () => navigateToInbox());
 */
export const useKeySequence = (sequence, callback, options = {}) => {
  const { enabled = true, allowInInput = false, timeout = 1000 } = options;
  
  const sequenceRef = useRef([]);
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !sequence?.length || typeof document === 'undefined') return;

    const handleKeyDown = (event) => {
      if (!allowInInput && isTypingTarget(event.target)) return;
      if (event.isComposing) return;

      // Clear timeout on new keypress
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Add key to sequence
      sequenceRef.current = [...sequenceRef.current, normalizeKey(event.key)];

      // Check if sequence matches
      const matches = sequence.every(
        (key, index) => normalizeKey(key) === sequenceRef.current[index]
      );

      if (matches && sequenceRef.current.length === sequence.length) {
        event.preventDefault();
        callbackRef.current?.(event);
        sequenceRef.current = [];
      }

      // Reset after timeout
      timeoutRef.current = setTimeout(() => {
        sequenceRef.current = [];
      }, timeout);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, sequence, allowInInput, timeout]);
};

// ── useShortcutList ──────────────────────────────────────────────────────

/**
 * Registers multiple keyboard shortcuts at once.
 * Returns an object to enable/disable individual shortcuts.
 * 
 * @param {Object} shortcuts - Map of shortcut names to configurations
 * @returns {Object} { isEnabled, toggleShortcut, enableShortcut, disableShortcut }
 * 
 * @example
 * const shortcuts = useShortcutList({
 *   save: { keys: 's', ctrl: true, callback: handleSave },
 *   search: { keys: '/', callback: openSearch },
 * });
 */
export const useShortcutList = (shortcuts = {}) => {
  const [disabledShortcuts, setDisabledShortcuts] = useState(new Set());

  const isEnabled = useCallback((name) => !disabledShortcuts.has(name), [disabledShortcuts]);
  const toggleShortcut = useCallback((name) => {
    setDisabledShortcuts(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);
  const enableShortcut = useCallback((name) => {
    setDisabledShortcuts(prev => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }, []);
  const disableShortcut = useCallback((name) => {
    setDisabledShortcuts(prev => new Set([...prev, name]));
  }, []);

  // Register all shortcuts
  Object.entries(shortcuts).forEach(([name, config]) => {
    useKeyboardShortcut(
      config.keys,
      config.callback,
      {
        ...config,
        enabled: config.enabled !== false && isEnabled(name),
      }
    );
  });

  return { isEnabled, toggleShortcut, enableShortcut, disableShortcut };
};

// ── useGlobalShortcutHelp ────────────────────────────────────────────────

/**
 * Returns a formatted list of active shortcuts for help dialogs.
 * 
 * @param {Object} shortcuts - Map of shortcut names to { keys, modifiers }
 * @returns {Array} Formatted shortcut list
 */
export const useShortcutHelp = (shortcuts = {}) => {
  return useMemo(() => {
    return Object.entries(shortcuts).map(([name, config]) => {
      const modifiers = [];
      if (config.ctrl) modifiers.push('⌘');
      if (config.alt) modifiers.push('⌥');
      if (config.shift) modifiers.push('⇧');
      
      const key = Array.isArray(config.keys) ? config.keys.join('/') : config.keys;
      const keyDisplay = key.length === 1 ? key.toUpperCase() : key;
      
      return {
        name,
        keys: [...modifiers, keyDisplay].join(' '),
        description: config.description || name,
      };
    });
  }, [shortcuts]);
};

export default useKeyboardShortcut;