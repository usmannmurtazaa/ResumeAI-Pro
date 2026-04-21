import React, { forwardRef, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import { clsx } from 'clsx';

// ============================================
// INPUT COMPONENT
// ============================================

const Input = forwardRef(({ 
  label, 
  error, 
  success,
  icon, 
  rightIcon,
  className = '',
  type = 'text',
  size = 'md',
  variant = 'default',
  helperText,
  required,
  disabled,
  readOnly,
  clearable = false,
  onClear,
  id: providedId,
  wrapperClassName = '',
  labelClassName = '',
  inputClassName = '',
  ...props 
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const handleClear = () => {
    if (props.onChange) {
      const event = { target: { value: '' } };
      props.onChange(event);
    }
    onClear?.();
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl',
    lg: 'px-5 py-4 text-lg rounded-xl',
  };

  const variants = {
    default: `
      border border-gray-200 dark:border-gray-700
      bg-white dark:bg-gray-800
      focus:ring-2 focus:ring-primary-500 focus:border-transparent
    `,
    filled: `
      border border-transparent
      bg-gray-100 dark:bg-gray-800
      focus:bg-white dark:focus:bg-gray-700
      focus:ring-2 focus:ring-primary-500
    `,
    outline: `
      border-2 border-gray-300 dark:border-gray-600
      bg-transparent
      focus:border-primary-500 focus:ring-0
    `,
    underlined: `
      border-0 border-b-2 border-gray-200 dark:border-gray-700
      bg-transparent rounded-none px-0
      focus:border-primary-500 focus:ring-0
    `,
  };

  const passwordToggle = isPassword && (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
      tabIndex={-1}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
    </button>
  );

  const clearButton = clearable && props.value && !disabled && !readOnly && (
    <button
      type="button"
      onClick={handleClear}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
      tabIndex={-1}
      aria-label="Clear input"
    >
      <FiX className="w-4 h-4" />
    </button>
  );

  const successIcon = success && !error && (
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
      <FiCheckCircle className="w-5 h-5" />
    </div>
  );

  const errorIcon = error && (
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
      <FiAlertCircle className="w-5 h-5" />
    </div>
  );

  // Determine right icon/element priority
  const getRightElement = () => {
    if (isPassword) return passwordToggle;
    if (clearable && props.value) return clearButton;
    if (success) return successIcon;
    if (error) return errorIcon;
    if (rightIcon) return rightIcon;
    return null;
  };

  const rightElement = getRightElement();
  const hasRightElement = !!rightElement;

  return (
    <div className={clsx('space-y-1', wrapperClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={clsx(
            'block text-sm font-medium text-gray-700 dark:text-gray-300',
            required && 'after:content-["*"] after:ml-0.5 after:text-red-500',
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}

        {/* Input Element */}
        <input
          ref={ref}
          id={id}
          type={inputType}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={clsx(
            'w-full outline-none transition-all duration-200',
            'text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'read-only:bg-gray-50 dark:read-only:bg-gray-900',
            sizes[size],
            variants[variant],
            icon && 'pl-10',
            hasRightElement && 'pr-10',
            error && '!border-red-500 focus:!ring-red-500',
            success && '!border-green-500 focus:!ring-green-500',
            isFocused && !error && !success && 'ring-2 ring-primary-500/20',
            className,
            inputClassName
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />

        {/* Right Element */}
        {rightElement && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1"
          >
            <FiAlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {success && typeof success === 'string' && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-green-500 dark:text-green-400 flex items-center gap-1"
          >
            <FiCheckCircle className="w-4 h-4" />
            {success}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

// ============================================
// TEXTAREA COMPONENT
// ============================================

export const Textarea = forwardRef(({ 
  label,
  error,
  success,
  className = '',
  size = 'md',
  variant = 'default',
  helperText,
  required,
  disabled,
  readOnly,
  rows = 4,
  maxLength,
  showCount = false,
  value,
  id: providedId,
  wrapperClassName = '',
  labelClassName = '',
  ...props 
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  const [isFocused, setIsFocused] = useState(false);
  const currentLength = typeof value === 'string' ? value.length : 0;

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl',
    lg: 'px-5 py-4 text-lg rounded-xl',
  };

  const variants = {
    default: `
      border border-gray-200 dark:border-gray-700
      bg-white dark:bg-gray-800
      focus:ring-2 focus:ring-primary-500 focus:border-transparent
    `,
    filled: `
      border border-transparent
      bg-gray-100 dark:bg-gray-800
      focus:bg-white dark:focus:bg-gray-700
      focus:ring-2 focus:ring-primary-500
    `,
  };

  return (
    <div className={clsx('space-y-1', wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={clsx(
            'block text-sm font-medium text-gray-700 dark:text-gray-300',
            required && 'after:content-["*"] after:ml-0.5 after:text-red-500',
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={clsx(
            'w-full outline-none transition-all duration-200 resize-none',
            'text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'read-only:bg-gray-50 dark:read-only:bg-gray-900',
            sizes[size],
            variants[variant],
            error && '!border-red-500 focus:!ring-red-500',
            success && '!border-green-500 focus:!ring-green-500',
            isFocused && !error && !success && 'ring-2 ring-primary-500/20',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />

        {/* Character Count */}
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
            {currentLength}/{maxLength}
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1"
        >
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </motion.p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ============================================
// INPUT GROUP COMPONENT
// ============================================

export const InputGroup = ({ children, className = '' }) => (
  <div className={clsx('flex', '[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:not(:first-child)]:-ml-px', className)}>
    {children}
  </div>
);

// ============================================
// SEARCH INPUT COMPONENT
// ============================================

export const SearchInput = forwardRef(({ 
  placeholder = 'Search...',
  onSearch,
  className = '',
  ...props 
}, ref) => (
  <Input
    ref={ref}
    type="search"
    placeholder={placeholder}
    icon={<FiSearch className="w-5 h-5" />}
    clearable
    className={className}
    {...props}
  />
));

SearchInput.displayName = 'SearchInput';

// Missing icon import
const FiSearch = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default Input;