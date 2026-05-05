import React, { forwardRef, useState, useId, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiX, FiSearch } from 'react-icons/fi';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const SIZES = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-3 text-base rounded-xl',
  lg: 'px-5 py-4 text-lg rounded-xl',
};

const VARIANTS = {
  default: 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent',
  filled: 'border border-transparent bg-gray-100 dark:bg-gray-800 focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:ring-2 focus-within:ring-primary-500',
  outline: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent focus-within:border-primary-500 focus-within:ring-0',
  underlined: 'border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent rounded-none px-0 focus-within:border-primary-500 focus-within:ring-0',
};

const BASE_INPUT = 'w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-gray-50 dark:read-only:bg-gray-900';

// ── Input Component ──────────────────────────────────────────────────────

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
  const inputRef = useRef(null);

  // FIXED: Combine external ref with internal ref
  const combinedRef = useCallback((node) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const hasValue = props.value !== undefined && props.value !== '';

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    if (disabled || readOnly) return;
    
    // Create a proper synthetic event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    
    if (nativeInputValueSetter && inputRef.current) {
      nativeInputValueSetter.call(inputRef.current, '');
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    onClear?.();
  }, [disabled, readOnly, onClear]);

  // ── Determine right element ─────────────────────────────────────────

  const getRightElement = () => {
    if (isPassword) return (
      <button type="button" onClick={() => setShowPassword(!showPassword)}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
        tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
      </button>
    );
    if (clearable && hasValue && !disabled && !readOnly) return (
      <button type="button" onClick={handleClear}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
        tabIndex={-1} aria-label="Clear input">
        <FiX className="w-4 h-4" />
      </button>
    );
    if (success && !error) return <FiCheckCircle className="w-5 h-5 text-green-500" />;
    if (error) return <FiAlertCircle className="w-5 h-5 text-red-500" />;
    if (rightIcon) return rightIcon;
    return null;
  };

  const rightElement = getRightElement();

  return (
    <div className={cn('space-y-1', wrapperClassName)}>
      {/* Label */}
      {label && (
        <label htmlFor={id} className={cn(
          'block text-sm font-medium text-gray-700 dark:text-gray-300',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500",
          labelClassName
        )}>{label}</label>
      )}

      {/* Input Container */}
      <div className={cn(
        'relative flex items-center transition-all duration-200 rounded-xl',
        SIZES[size] || SIZES.md,
        error ? '!border-red-500 focus-within:!ring-red-500' : 
        success ? '!border-green-500 focus-within:!ring-green-500' : 
        VARIANTS[variant] || VARIANTS.default,
        disabled && 'opacity-50',
        className,
      )}>
        {/* Left Icon */}
        {icon && (
          <div className="flex-shrink-0 ml-3 text-gray-400 dark:text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={combinedRef}
          id={id}
          type={inputType}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            BASE_INPUT,
            icon ? 'pl-3' : 'pl-4',
            rightElement ? 'pr-3' : 'pr-4',
            inputClassName
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />

        {/* Right Element */}
        {rightElement && (
          <div className="flex-shrink-0 mr-3">
            {rightElement}
          </div>
        )}
      </div>

      {/* Helper / Error / Success */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-500 dark:text-gray-400 ml-1">{helperText}</p>
      )}
      <AnimatePresence>
        {error && (
          <motion.p id={`${id}-error`} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 ml-1">
            <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </motion.p>
        )}
        {success && typeof success === 'string' && (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1 ml-1">
            <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />{success}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

// ── Textarea Component ────────────────────────────────────────────────────

export const Textarea = forwardRef(({ 
  label, error, success, className = '', size = 'md', variant = 'default',
  helperText, required, disabled, readOnly, rows = 4, maxLength, showCount = false,
  value, id: providedId, wrapperClassName = '', labelClassName = '', autoResize = false,
  ...props 
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  const textareaRef = useRef(null);
  const currentLength = typeof value === 'string' ? value.length : 0;

  // FIXED: Combine refs
  const combinedRef = useCallback((node) => {
    textareaRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  // Auto-resize
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, autoResize]);

  return (
    <div className={cn('space-y-1', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className={cn(
          'block text-sm font-medium text-gray-700 dark:text-gray-300',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500",
          labelClassName
        )}>{label}</label>
      )}
      <div className="relative">
        <textarea ref={combinedRef} id={id} disabled={disabled} readOnly={readOnly}
          required={required} rows={rows} maxLength={maxLength} value={value}
          className={cn(
            'w-full outline-none transition-all duration-200 resize-none',
            'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-gray-50 dark:read-only:bg-gray-900',
            SIZES[size] || SIZES.md,
            error ? '!border-red-500 focus:!ring-red-500' : VARIANTS[variant] || VARIANTS.default,
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-400 bg-white dark:bg-gray-800 px-1 rounded">
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
      {helperText && !error && <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">{helperText}</p>}
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 ml-1">
          <FiAlertCircle className="w-3.5 h-3.5" />{error}
        </motion.p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ── InputGroup ────────────────────────────────────────────────────────────

export const InputGroup = ({ children, className = '' }) => (
  <div className={cn('flex', '[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:not(:first-child)]:-ml-px', className)}>
    {children}
  </div>
);

// ── SearchInput ───────────────────────────────────────────────────────────

export const SearchInput = forwardRef(({ placeholder = 'Search...', onSearch, className = '', ...props }, ref) => (
  <Input ref={ref} type="search" placeholder={placeholder} icon={<FiSearch className="w-5 h-5" />} clearable className={className} {...props} />
));

SearchInput.displayName = 'SearchInput';

export default React.memo(Input);
