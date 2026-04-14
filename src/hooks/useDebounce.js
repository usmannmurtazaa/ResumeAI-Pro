// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useDebouncedCallback = (callback, delay) => {
  const debouncedCallback = useDebounce(callback, delay);
  
  useEffect(() => {
    if (typeof debouncedCallback === 'function' && debouncedCallback !== callback) {
      debouncedCallback();
    }
  }, [debouncedCallback, callback]);

  return debouncedCallback;
};

export default useDebounce;