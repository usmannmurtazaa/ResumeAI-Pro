export const validators = {
  email: (value) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(value) ? true : 'Invalid email address';
  },

  phone: (value) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(value) ? true : 'Invalid phone number';
  },

  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return 'Invalid URL';
    }
  },

  password: (value) => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    return true;
  },

  required: (value) => {
    return value && value.trim().length > 0 ? true : 'This field is required';
  },

  minLength: (min) => (value) => {
    return value.length >= min ? true : `Must be at least ${min} characters`;
  },

  maxLength: (max) => (value) => {
    return value.length <= max ? true : `Must be at most ${max} characters`;
  },

  number: (value) => {
    return !isNaN(value) ? true : 'Must be a number';
  },

  date: (value) => {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? true : 'Invalid date';
  }
};