import React, { forwardRef, useState, useId, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const SIZES = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-3 text-base rounded-xl',
  lg: 'px-5 py-4 text-lg rounded-xl',
};

const VARIANTS = {
  default: 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
  filled: 'border border-transparent bg-gray-100 dark:bg-gray-800',
  outline: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent',
};

const BASE_TEXTAREA = 'w-full outline-none transition-all duration-200 resize-y text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-gray-50 dark:read-only:bg-gray-900';

// ── Textarea Component ────────────────────────────────────────────────────

const Textarea = forwardRef(({ 
  label, 
  error,
  success,
  helperText,
  className = '',
  rows = 4,
  size = 'md',
  variant = 'default',
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
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  const textareaRef = useRef(null);
  const currentLength = typeof value === 'string' ? value.length : 0;

  // ── Combine refs ─────────────────────────────────────────────────────

  const combinedRef = useCallback((node) => {
    textareaRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  // ── Auto-resize ──────────────────────────────────────────────────────

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, autoResize]);

  return (
    <div className={cn('space-y-1', wrapperClassName)}>
      {/* Label */}
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

      {/* Textarea Container */}
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
            autoResize && 'resize-none overflow-hidden',
            SIZES[size] || SIZES.md,
            error 
              ? '!border-red-500 focus:!ring-red-500' 
              : success 
                ? '!border-green-500 focus:!ring-green-500' 
                : VARIANTS[variant] || VARIANTS.default + ' focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />

        {/* Character Count */}
        {showCount && maxLength && (
          <div className={cn(
            'absolute bottom-2 right-3 text-xs rounded px-1.5 py-0.5',
            currentLength > maxLength * 0.9 
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
              : 'text-gray-400 bg-white/80 dark:bg-gray-800/80'
          )}>
            {currentLength}/{maxLength}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          {helperText}
        </p>
      )}

      {/* Error Message */}
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
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
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
});

Textarea.displayName = 'Textarea';

export default React.memo(Textarea);