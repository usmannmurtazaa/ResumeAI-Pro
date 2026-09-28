import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { FiCheck, FiMinus } from 'react-icons/fi';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Checkbox = forwardRef(
  (
    {
      label,
      error,
      helperText,
      indeterminate = false,
      className = '',
      checked,
      defaultChecked,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef(null);
    const combinedRef = ref || innerRef;
    const [isChecked, setIsChecked] = useState(defaultChecked || false);

    const isControlled = checked !== undefined;
    const checkboxChecked = isControlled ? checked : isChecked;

    useEffect(() => {
      const el = combinedRef.current || innerRef.current;
      if (el) {
        el.indeterminate = indeterminate;
      }
    }, [indeterminate, combinedRef]);

    const handleChange = (e) => {
      if (!isControlled) {
        setIsChecked(e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <div className="space-y-1">
        {/*
          The outer <label> is intentionally NOT focusable and has NO keydown
          handler. The <input> below is the sole keyboard entry point; the
          browser natively toggles a focused checkbox on Space and fires the
          change event. Any manual toggle handler on the label would double
          up with that native behaviour — the two toggles cancel each other
          out, and the checkbox appears to ignore the user's keypress.
        */}
        <label
          className={cn(
            'inline-flex items-center gap-3 select-none',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            className
          )}
        >
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              ref={combinedRef}
              className="sr-only peer"
              checked={checkboxChecked}
              disabled={disabled}
              onChange={handleChange}
              {...props}
            />

            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center',
                'transition-all duration-200',
                error
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600',
                checkboxChecked || indeterminate
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white dark:bg-gray-800',
                disabled && 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
                'group-hover:border-primary-400'
              )}
            >
              {checkboxChecked && !indeterminate && (
                <FiCheck className="w-3.5 h-3.5 text-white transition-transform duration-200 scale-100" />
              )}
              {indeterminate && <FiMinus className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          {label && (
            <span
              className={cn(
                'text-sm select-none',
                error ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
                disabled && 'text-gray-400 dark:text-gray-500'
              )}
            >
              {label}
            </span>
          )}
        </label>

        {error && <p className="text-xs text-red-500 dark:text-red-400 ml-8">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-gray-400 dark:text-gray-500 ml-8">{helperText}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default React.memo(Checkbox);
