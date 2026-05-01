import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { FiCheck, FiMinus } from 'react-icons/fi';

const Checkbox = forwardRef(({ 
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
}, ref) => {
  const innerRef = useRef(null);
  const combinedRef = ref || innerRef;
  const [isChecked, setIsChecked] = useState(defaultChecked || false);

  // Handle uncontrolled mode
  const isControlled = checked !== undefined;
  const checkboxChecked = isControlled ? checked : isChecked;

  // ── Set indeterminate property ───────────────────────────────────────

  useEffect(() => {
    const el = combinedRef.current || innerRef.current;
    if (el) {
      el.indeterminate = indeterminate;
    }
  }, [indeterminate, combinedRef]);

  // ── Handle change for uncontrolled mode ─────────────────────────────

  const handleChange = (e) => {
    if (!isControlled) {
      setIsChecked(e.target.checked);
    }
    onChange?.(e);
  };

  // ── Keyboard support for label clicks ───────────────────────────────

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const el = combinedRef.current || innerRef.current;
      if (el && !disabled) {
        el.click();
      }
    }
  };

  return (
    <div className="space-y-1">
      <label 
        className={`
          inline-flex items-center gap-3 select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        <div className="relative flex-shrink-0">
          {/* Hidden native checkbox */}
          <input
            type="checkbox"
            ref={combinedRef}
            className="sr-only peer"
            checked={checkboxChecked}
            disabled={disabled}
            onChange={handleChange}
            {...props}
          />
          
          {/* Custom checkbox visual */}
          <div className={`
            w-5 h-5 rounded border-2 flex items-center justify-center
            transition-all duration-200
            ${error 
              ? 'border-red-500 dark:border-red-400' 
              : 'border-gray-300 dark:border-gray-600'
            }
            ${checkboxChecked || indeterminate 
              ? 'bg-primary-500 border-primary-500' 
              : 'bg-white dark:bg-gray-800'
            }
            ${disabled 
              ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
              : ''
            }
            peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2
            group-hover:border-primary-400
          `}>
            {/* Checkmark */}
            {checkboxChecked && !indeterminate && (
              <FiCheck className="w-3.5 h-3.5 text-white transition-transform duration-200 scale-100" />
            )}
            
            {/* Indeterminate dash */}
            {indeterminate && (
              <FiMinus className="w-3.5 h-3.5 text-white" />
            )}
          </div>
        </div>

        {/* Label text */}
        {label && (
          <span className={`
            text-sm select-none
            ${error 
              ? 'text-red-700 dark:text-red-400' 
              : 'text-gray-700 dark:text-gray-300'
            }
            ${disabled ? 'text-gray-400 dark:text-gray-500' : ''}
          `}>
            {label}
          </span>
        )}
      </label>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 ml-8">{error}</p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-xs text-gray-400 dark:text-gray-500 ml-8">{helperText}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default React.memo(Checkbox);