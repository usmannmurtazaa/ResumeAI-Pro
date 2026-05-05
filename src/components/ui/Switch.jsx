import React, { forwardRef, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const SIZES = {
  sm: { track: 'w-8 h-5', thumb: 'w-3.5 h-3.5', translate: 14 },
  md: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 24 },
  lg: { track: 'w-16 h-8', thumb: 'w-6 h-6', translate: 32 },
};

// ── Switch Component ──────────────────────────────────────────────────────

const Switch = forwardRef(({ 
  checked, 
  onChange,
  label, 
  labelPosition = 'right',
  disabled = false,
  size = 'md',
  helperText,
  error,
  id: providedId,
  className = '',
  ...props 
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  const prefersReducedMotion = useReducedMotion();
  const sizeConfig = SIZES[size] || SIZES.md;

  const switchControl = (
    <div className="relative inline-flex">
      {/* Hidden native checkbox */}
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === 'string' ? label : undefined}
        {...props}
      />

      {/* Track */}
      <div className={cn(
        sizeConfig.track,
        'rounded-full transition-colors duration-200',
        checked 
          ? 'bg-primary-500' 
          : 'bg-gray-300 dark:bg-gray-600',
        error && '!bg-red-500',
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2'
      )}>
        {/* Thumb */}
        <motion.div
          className={cn(
            sizeConfig.thumb,
            'absolute top-0.5 left-0.5 bg-white rounded-full shadow-md'
          )}
          animate={{ 
            x: checked ? sizeConfig.translate : 0 
          }}
          transition={
            prefersReducedMotion 
              ? { duration: 0 }
              : { type: "spring", stiffness: 500, damping: 30 }
          }
        />

        {/* Check/X icons inside thumb (visible on larger sizes) */}
        {size !== 'sm' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <svg 
              className={cn('text-primary-500', size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ marginRight: sizeConfig.translate / 2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>
    </div>
  );

  const labelElement = label && (
    <label 
      htmlFor={id}
      className={cn(
        'text-sm select-none',
        disabled ? 'cursor-not-allowed text-gray-400 dark:text-gray-500' : 'cursor-pointer',
        error ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
      )}
    >
      {label}
    </label>
  );

  return (
    <div className={cn('space-y-1', className)}>
      <div className={cn(
        'inline-flex items-center gap-3',
        labelPosition === 'left' && 'flex-row-reverse'
      )}>
        {switchControl}
        {labelElement}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          {helperText}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 ml-1">
          {error}
        </p>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

// ── SwitchGroup Component ─────────────────────────────────────────────────

export const SwitchGroup = ({ 
  label,
  description,
  error,
  children,
  className = '',
  ...props 
}) => (
  <fieldset className={cn('space-y-3', className)} {...props}>
    {(label || description) && (
      <div>
        {label && (
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </legend>
        )}
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>
    )}
    <div className="space-y-2">
      {children}
    </div>
    {error && (
      <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
    )}
  </fieldset>
);

SwitchGroup.displayName = 'SwitchGroup';

export default React.memo(Switch);
