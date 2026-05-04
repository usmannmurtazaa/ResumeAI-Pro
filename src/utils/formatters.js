// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_LOCALE = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

// ── Formatters ────────────────────────────────────────────────────────────

export const formatters = {
  /**
   * Format a date with various presets.
   * @param {string|Date} date - Date to format
   * @param {string} format - 'full' | 'short' | 'monthYear' | 'time' | 'datetime' | 'relative'
   * @param {string} locale - Locale string (default: user's browser locale)
   */
  date(date, format = 'full', locale = DEFAULT_LOCALE) {
    if (!date) return '';

    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';

      switch (format) {
        case 'full':
          return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
        case 'short':
          return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
        case 'monthYear':
          return d.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
        case 'time':
          return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        case 'datetime':
          return d.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        case 'relative': {
          const now = Date.now();
          const diff = now - d.getTime();
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
        }
        default:
          return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch {
      return String(date);
    }
  },

  /**
   * Format a number as currency.
   */
  currency(amount, currency = 'USD', locale = DEFAULT_LOCALE) {
    if (amount === null || amount === undefined) return '';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  },

  /**
   * Format a number with commas and optional decimals.
   */
  number(value, decimals = 0, locale = DEFAULT_LOCALE) {
    if (value === null || value === undefined) return '';
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch {
      return value.toLocaleString();
    }
  },

  /**
   * Format as percentage.
   */
  percentage(value, decimals = 0, locale = DEFAULT_LOCALE) {
    if (value === null || value === undefined) return '';
    return `${Number(value).toFixed(decimals)}%`;
  },

  /**
   * Format a phone number. Handles US and basic international formats.
   */
  phone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');

    // US/Canada: (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // US with country code: +1 (XXX) XXX-XXXX
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    // International: +XX XXX XXX XXX
    if (cleaned.length > 10) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }

    return phone;
  },

  /**
   * Format bytes to human-readable file size.
   */
  fileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    if (bytes === null || bytes === undefined) return '';

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
  },

  /**
   * Format minutes to human-readable duration.
   */
  duration(minutes) {
    if (!minutes && minutes !== 0) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  },

  /**
   * Get initials from a name (max 2 chars).
   */
  initials(name, fallback = '?') {
    if (!name || !name.trim()) return fallback;
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Create a URL-friendly slug from text.
   */
  slug(text) {
    if (!text) return '';
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Truncate text to a given length with ellipsis.
   * FIXED: Uses `slice` instead of deprecated `substr`.
   */
  truncate(text, length = 150, suffix = '...') {
    if (!text) return '';
    if (text.length <= length) return text;

    // Find the last space before the limit
    const cut = text.lastIndexOf(' ', length);
    const end = cut > 0 ? cut : length;
    return text.slice(0, end) + suffix;
  },

  /**
   * Convert camelCase or PascalCase to Title Case.
   * FIXED: Handles consecutive uppercase (acronyms).
   */
  camelToTitle(text) {
    if (!text) return '';

    // Insert space before capital letters, but not for consecutive capitals (acronyms)
    const spaced = text
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // Handle acronyms: ATSCompatible → ATS Compatible
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')       // Handle camelCase: myName → my Name
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');   // Handle remaining: XMLParser → XML Parser

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  },

  /**
   * Pluralize a word based on count.
   */
  pluralize(count, singular, plural) {
    const num = Math.abs(count);
    if (num === 1) return `${count} ${singular}`;
    return `${count} ${plural || singular + 's'}`;
  },

  /**
   * Format a number as compact (1K, 1M, etc.).
   */
  compact(value, locale = DEFAULT_LOCALE) {
    if (value === null || value === undefined) return '';
    try {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);
    } catch {
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return String(value);
    }
  },

  /**
   * Format a name as "First Last" or "Last, First".
   */
  name(first, last, format = 'full') {
    if (!first && !last) return '';
    if (format === 'lastFirst') return last ? `${last}, ${first}` : first;
    return [first, last].filter(Boolean).join(' ');
  },
};

export default formatters;