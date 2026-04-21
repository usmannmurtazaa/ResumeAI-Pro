import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {string|string[]} keys - Key or array of keys to listen for
 * @param {Function} callback - Function to call when key is pressed
 * @param {Object} options - Options (ctrl, alt, shift, meta, preventDefault)
 */
export const useKeyboardShortcut = (keys, callback, options = {}) => {
  const { ctrl = false, alt = false, shift = false, meta = false, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event) => {
      const keyMatches = Array.isArray(keys)
        ? keys.includes(event.key)
        : event.key === keys;

      const modifiersMatch =
        (ctrl ? event.ctrlKey : !event.ctrlKey) &&
        (alt ? event.altKey : !event.altKey) &&
        (shift ? event.shiftKey : !event.shiftKey) &&
        (meta ? event.metaKey : !event.metaKey);

      if (keyMatches && modifiersMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    [keys, callback, ctrl, alt, shift, meta, preventDefault]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardShortcut;