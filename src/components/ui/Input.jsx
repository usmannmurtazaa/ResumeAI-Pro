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
  default:
    'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent',
  filled:
    'border border-transparent bg-gray-100 dark:bg-gray-800 focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:ring-2 focus-within:ring-primary-500',
  outline:
    'border-2 border-gray-300 dark:border-gray-600 bg-transparent focus-within:border-primary-500 focus-within:ring-0',
  underlined:
    'border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent rounded-none px-0 focus-within:border-primary-500 focus-within:ring-0',
};

const BASE_INPUT =
  'w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-gray-50 dark:read-only:bg-gray-900';

// Focus-ring classes for the Textarea. Applied on top of the active variant
// so every standard variant shows a visible focus indicator.
//
// Do NOT rewrite this as `VARIANTS[variant] || VARIANTS.default + ' focus:...'`
// — the `+` operator binds tighter than `||`, so the focus classes would only
// be applied in the fallback branch (i.e. for an unknown variant name), and
// every known variant would lose its focus ring. This is the bug that was
// fixed in `Textarea.jsx` and is fixed here in the same way.
const FOCUS_CLASSES = 'focus:ring-2 focus:ring-primary-500 focus:border-transparent';

// ── Input Component ──────────────────────────────────────────────────────

const Input = forwardRef(
  (
    {
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
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef(null);

    const combinedRef = useCallback(
      (node) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const hasValue = props.value !== undefined && props.value !== '';

    const handleClear = useCallback(() => {
      if (disabled || readOnly) return;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter && inputRef.current) {
        nativeInputValueSetter.call(inputRef.current, '');
        inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }

      onClear?.();
    }, [disabled, readOnly, onClear]);

    const getRightElement = () => {
      if (isPassword)
        return (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
          </button>
        );
      if (clearable && hasValue && !disabled && !readOnly)
        return (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            tabIndex={-1}
            aria-label="Clear input"
          >
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
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500",
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            'relative flex items-center transition-all duration-200 rounded-xl',
            SIZES[size] || SIZES.md,
            error
              ? '!border-red-500 focus-within:!ring-red-500'
              : success
                ? '!border-green-500 focus-within:!ring-green-500'
                : VARIANTS[variant] || VARIANTS.default,
            disabled && 'opacity-50',
            className
          )}
        >
          {icon && (
            <div className="flex-shrink-0 ml-3 text-gray-400 dark:text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={combinedRef}
            id={id}
            type={inputType}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
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

          {rightElement && <div className="flex-shrink-0 mr-3">{rightElement}</div>}
        </div>

        {helperText && !error && (
          <p id={`${id}-helper`} className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            {helperText}
          </p>
        )}
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${id}-error`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 ml-1"
            >
              <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </motion.p>
          )}
          {success && typeof success === 'string' && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1 ml-1"
            >
              <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {success}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

// ── Textarea Component ────────────────────────────────────────────────────

export const Textarea = forwardRef(
  (
    {
      label,
      error,
      success,
      className = '',
      rows = 4,
      size = 'md',
      variant = 'default',
      helperText,
      required,
      disabled,
      readOnly,
      maxLength,
      showCount = false,
      value,
      id: providedId,
      wrapperClassName = '',
      labelClassName = '',
      autoResize = false,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const textareaRef = useRef(null);
    const currentLength = typeof value === 'string' ? value.length : 0;

    const combinedRef = useCallback(
      (node) => {
        textareaRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, [value, autoResize]);

    return (
      <div className={cn('space-y-1', wrapperClassName)}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500",
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={combinedRef}
            id={id}
            rows={rows}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            maxLength={maxLength}
            className={cn(
              'w-full outline-none transition-all duration-200 resize-y',
              'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-gray-50 dark:read-only:bg-gray-900',
              SIZES[size] || SIZES.md,
              error
                ? '!border-red-500 focus:!ring-red-500'
                : success
                  ? '!border-green-500 focus:!ring-green-500'
                  : `${VARIANTS[variant] || VARIANTS.default} ${FOCUS_CLASSES}`,
              autoResize && 'resize-none overflow-hidden',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            {...props}
          />

          {showCount && maxLength && (
            <div
              className={cn(
                'absolute bottom-2 right-3 text-xs rounded px-1.5 py-0.5',
                currentLength > maxLength * 0.9
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'text-gray-400 bg-white/80 dark:bg-gray-800/80'
              )}
            >
              {currentLength}/{maxLength}
            </div>
          )}
        </div>

        {helperText && !error && (
          <p id={`${id}-helper`} className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            {helperText}
          </p>
        )}
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${id}-error`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 ml-1"
            >
              <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </motion.p>
          )}
          {success && typeof success === 'string' && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1 ml-1"
            >
              <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {success}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ── InputGroup ────────────────────────────────────────────────────────────

export const InputGroup = ({ children, className = '' }) => (
  <div
    className={cn(
      'flex',
      '[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:not(:first-child)]:-ml-px',
      className
    )}
  >
    {children}
  </div>
);

InputGroup.displayName = 'InputGroup';

// ── SearchInput ───────────────────────────────────────────────────────────

export const SearchInput = forwardRef(
  ({ placeholder = 'Search...', onSearch, className = '', ...props }, ref) => (
    // `onSearch` is forwarded so that the native `search` event from the
    // <input type="search"> below reaches the caller. Browsers fire that
    // event when the user presses Enter inside the field — the standard
    // "user submitted the query" signal — and when the user clicks the
    // native clear button. Wiring it here restores the prop's contract:
    // without this, callers had to reimplement Enter handling themselves.
    <Input
      ref={ref}
      type="search"
      placeholder={placeholder}
      icon={<FiSearch className="w-5 h-5" />}
      clearable
      className={className}
      onSearch={onSearch}
      {...props}
    />
  )
);

SearchInput.displayName = 'SearchInput';

export default React.memo(Input);
