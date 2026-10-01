import React, { forwardRef, useId, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

// Mobile-safe font sizing:
//   • `text-base` (16px) is the mobile-first default. iOS Safari auto-zooms
//     when a focused form field renders below 16px, so this prevents that
//     behaviour on phones and small tablets.
//   • `sm:text-sm` (14px at ≥640px) preserves the desktop visual scale that
//     the pre-migration raw textareas used, so existing page layouts are
//     unchanged at desktop widths.
//   • `lg` already renders at 18px, which does not trigger autozoom; it is
//     left untouched.
const SIZES = {
  sm: 'px-3 py-2 text-base sm:text-sm rounded-lg',
  md: 'px-4 py-3 text-base sm:text-sm rounded-xl',
  lg: 'px-5 py-4 text-lg rounded-xl',
};

const VARIANTS = {
  default: 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
  filled: 'border border-transparent bg-gray-100 dark:bg-gray-800',
  outline: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent',
};

// Applied separately from BASE_TEXTAREA so callers cannot accidentally end
// up with two conflicting `resize-*` utilities in the same class string.
// `resize` defaults to `'none'` — this matches every existing raw
// textarea in the codebase and prevents the native resize handle from
// creating layout problems inside cards and grids.
const RESIZE_CLASSES = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

const BASE_TEXTAREA =
  'w-full outline-none transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-gray-50 dark:read-only:bg-gray-900 break-words';

// Focus ring is applied identically to the default, error, and success
// branches. Previously the error and success branches only set the ring
// colour and relied on `globals.css`'s `:focus-visible` box-shadow — which
// uses the primary colour — so an errored textarea would show a *primary*
// focus ring, not red. Adding `focus:ring-2` to those branches keeps the
// ring width consistent across all states.
const FOCUS_CLASSES = 'focus:ring-2 focus:ring-primary-500 focus:border-transparent';
const ERROR_CLASSES = '!border-red-500 focus:!ring-2 focus:!ring-red-500';
const SUCCESS_CLASSES = '!border-green-500 focus:!ring-2 focus:!ring-green-500';

// ── Textarea Component ────────────────────────────────────────────────────

const Textarea = forwardRef(
  (
    {
      label,
      error,
      success,
      helperText,
      className = '',
      rows = 4,
      size = 'md',
      variant = 'default',
      resize = 'none',
      disabled,
      readOnly,
      required,
      maxLength,
      showCount = false,
      autoResize = false,
      value,
      id: providedId,
      wrapperClassName = '',
      labelClassName = '',
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

    const resizeClass = RESIZE_CLASSES[resize] || RESIZE_CLASSES.none;

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
              BASE_TEXTAREA,
              // autoResize disables the native handle and hides overflow;
              // otherwise the caller-selected resize mode applies.
              autoResize ? 'resize-none overflow-hidden' : resizeClass,
              SIZES[size] || SIZES.md,
              error
                ? ERROR_CLASSES
                : success
                  ? SUCCESS_CLASSES
                  : `${VARIANTS[variant] || VARIANTS.default} ${FOCUS_CLASSES}`,
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            {...props}
          />

          {showCount && maxLength && (
            <div
              className={cn(
                'absolute text-xs rounded px-1.5 py-0.5',
                // When the native resize handle is present, shift the badge
                // up-and-left so it does not overlap the corner grab area.
                resize === 'none' && !autoResize ? 'bottom-2 right-3' : 'bottom-1 right-6',
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

export default React.memo(Textarea);
