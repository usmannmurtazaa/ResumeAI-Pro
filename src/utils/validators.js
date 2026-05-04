// ── Common Password Lists ──────────────────────────────────────────────────

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', 'qwerty123',
  'admin123', 'letmein123', 'welcome123', 'abc123456', 'Password1',
  'Password123', 'password123!',
]);

const isCommonPassword = (pwd) =>
  COMMON_PASSWORDS.has(pwd.toLowerCase());

// ── Helpers ────────────────────────────────────────────────────────────────

const isString = (value) => typeof value === 'string';

const isEmpty = (value) =>
  value === null || value === undefined || (isString(value) && value.trim().length === 0);

// ── Validators ─────────────────────────────────────────────────────────────

export const validators = {
  email(value) {
    if (isEmpty(value)) return 'Email is required';
    if (!isString(value)) return 'Invalid email address';
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim())
      ? true
      : 'Invalid email address';
  },

  phone(value) {
    if (isEmpty(value)) return 'Phone number is required';
    if (!isString(value)) return 'Invalid phone number';
    // Accepts a wide range of international formats
    return /^[\+]?[\d\s\(\)\-\.]{7,20}$/.test(value.replace(/\s/g, ''))
      ? true
      : 'Invalid phone number';
  },

  url(value) {
    if (isEmpty(value)) return true; // optional field
    if (!isString(value)) return 'Invalid URL';
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      new URL(withProtocol);
      return true;
    } catch {
      return 'Invalid URL';
    }
  },

  password(value) {
    if (isEmpty(value)) return 'Password is required';
    if (!isString(value)) return 'Invalid password';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
    if (!/[a-z]/.test(value)) return 'Must contain a lowercase letter';
    if (!/[0-9]/.test(value)) return 'Must contain a number';
    if (isCommonPassword(value)) return 'This password is too common — please choose another';
    return true;
  },

  required(value) {
    return !isEmpty(value) ? true : 'This field is required';
  },

  minLength(min) {
    return (value) => {
      if (!isString(value) && !Array.isArray(value)) return `Must be at least ${min} characters`;
      return value.length >= min ? true : `Must be at least ${min} characters`;
    };
  },

  maxLength(max) {
    return (value) => {
      if (!isString(value) && !Array.isArray(value)) return `Must be at most ${max} characters`;
      return value.length <= max ? true : `Must be at most ${max} characters`;
    };
  },

  number(value) {
    if (isEmpty(value)) return 'A number is required';
    if (typeof value === 'number') return isFinite(value) ? true : 'Invalid number';
    if (isString(value) && value.trim() === '') return 'A number is required';
    return !isNaN(Number(value)) && isFinite(Number(value)) ? true : 'Must be a valid number';
  },

  date(value) {
    if (isEmpty(value)) return 'A date is required';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Invalid date';
    // Reject dates where the parsed value doesn't round-trip (catches "2024-13-01", etc.)
    const iso = d.toISOString().slice(0, 10);
    const parsedBack = new Date(iso);
    return parsedBack.toISOString().slice(0, 10) === iso ? true : 'Invalid date';
  },
};

export default validators;