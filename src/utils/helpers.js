// ── String Helpers ────────────────────────────────────────────────────────

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const truncate = (str, length = 50, suffix = '...') => {
  if (!str || str.length <= length) return str;
  // Find last space before the limit to avoid cutting words
  const cut = str.lastIndexOf(' ', length);
  const end = cut > 0 ? cut : length;
  return str.slice(0, end) + suffix;
};

const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ── Array Helpers ─────────────────────────────────────────────────────────

const unique = (arr) => [...new Set(arr)];

const chunk = (arr, size) => {
  if (!Array.isArray(arr) || size < 1) return [];
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const shuffle = (arr) => {
  if (!Array.isArray(arr)) return [];
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ── Object Helpers ────────────────────────────────────────────────────────

const pick = (obj, keys) => {
  if (!obj || !Array.isArray(keys)) return {};
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

const omit = (obj, keys) => {
  if (!obj || !Array.isArray(keys)) return { ...obj };
  const keySet = new Set(keys);
  return Object.keys(obj).reduce((acc, key) => {
    if (!keySet.has(key)) acc[key] = obj[key];
    return acc;
  }, {});
};

const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof RegExp) return new RegExp(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);

  const cloned = {};
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone(obj[key]);
  }
  return cloned;
};

const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// ── Number Helpers ────────────────────────────────────────────────────────

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const formatNumber = (num) => {
  if (num === null || num === undefined) return '';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

// ── Date Helpers ──────────────────────────────────────────────────────────

const getRelativeTime = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 0) return 'just now';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

// ── Validation Helpers ────────────────────────────────────────────────────

const isValidEmail = (email) => {
  if (!email) return false;
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim());
};

const isValidPhone = (phone) => {
  if (!phone) return false;
  // Accepts various international formats
  return /^[\+]?[\d\s\(\)\-\.]{7,20}$/.test(phone.replace(/\s/g, ''));
};

const isValidURL = (url) => {
  if (!url) return false;
  // Add protocol if missing before validation
  const withProtocol = url.startsWith('http') ? url : `https://${url}`;
  try {
    new URL(withProtocol);
    return true;
  } catch {
    return false;
  }
};

// ── Storage Helpers ───────────────────────────────────────────────────────

const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

// ── Color Helpers ─────────────────────────────────────────────────────────

const getRandomColor = () => {
  const color = Math.floor(Math.random() * 0x1000000);
  return `#${color.toString(16).padStart(6, '0')}`;
};

const lightenColor = (hex, percent) => {
  // Normalize hex
  let color = hex.replace(/^#/, '');
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }
  if (color.length !== 6) return hex;

  const num = parseInt(color, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));

  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, '0')}`;
};

// ── Function Helpers ──────────────────────────────────────────────────────

const debounce = (fn, delay = 300) => {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};

const throttle = (fn, limit = 300) => {
  let inThrottle;
  let lastFn;
  let lastTime;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      lastFn = () => fn(...args);
      const remaining = limit - (Date.now() - lastTime);
      if (remaining <= 0) {
        lastFn?.();
        lastTime = Date.now();
      }
    }
    setTimeout(() => {
      inThrottle = false;
    }, limit);
  };
};

const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// ── Export ────────────────────────────────────────────────────────────────

export const helpers = {
  // String
  capitalize,
  truncate,
  slugify,

  // Array
  unique,
  chunk,
  shuffle,

  // Object
  pick,
  omit,
  deepClone,
  isEmpty,

  // Number
  random,
  clamp,
  formatNumber,

  // Date
  getRelativeTime,

  // Validation
  isValidEmail,
  isValidPhone,
  isValidURL,

  // Storage
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,

  // Color
  getRandomColor,
  lightenColor,

  // Function
  debounce,
  throttle,
  memoize,
};

export default helpers;