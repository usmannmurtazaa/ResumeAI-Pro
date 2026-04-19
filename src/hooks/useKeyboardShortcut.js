// src/hooks/useKeyboardShortcut.js
import { useEffect } from 'react';

export const useKeyboardShortcut = (key, callback, options = {}) => {
  const { ctrl = false, alt = false, shift = false, meta = false } = options;

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key: pressedKey, ctrlKey, altKey, shiftKey, metaKey } = event;

      // Check if the key matches
      if (pressedKey.toLowerCase() !== key.toLowerCase()) return;

      // Check modifier keys
      if (ctrl && !ctrlKey) return;
      if (alt && !altKey) return;
      if (shift && !shiftKey) return;
      if (meta && !metaKey) return;
      
      // If we need exact match without modifiers
      if (!ctrl && !alt && !shift && !meta) {
        if (ctrlKey || altKey || shiftKey || metaKey) return;
      }

      event.preventDefault();
      callback();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrl, alt, shift, meta]);
};

export default useKeyboardShortcut;