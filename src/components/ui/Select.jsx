import React, { forwardRef, useId } from 'react';
import { FiChevronDown, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
  underlined: 'border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent rounded-none px-0',
};

const BASE_SELECT = 'w-full appearance-none outline-none transition-all duration-200 text-gray-900 dark:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-500 focus:border-transparent';

// ── Component ─────────────────────────────────────────────────────────────

const Select = forwardRef(({ 
  label, 
  error,
  success,
  helperText,
  options = [], 
  placeholder,
  className = '',
  size = 'md',
  variant = 'default',
  disabled,
  required,
  icon,
  id: providedId,
  wrapperClassName = '',
  labelClassName = '',
  ...props 
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;

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

      {/* Select Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
            {icon}
          </div>
        )}

        <select
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          className={cn(
            BASE_SELECT,
            SIZES[size] || SIZES.md,
            VARIANTS[variant] || VARIANTS.default,
            icon && 'pl-10',
            'pr-10', // Space for chevron
            error && '!border-red-500 focus:!ring-red-500',
            success && '!border-green-500 focus:!ring-green-500',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        >
          {/* Placeholder Option */}
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}

          {/* Options */}
          {options.map((option) => {
            // Support for optgroups
            if (option.group) {
              return (
                <optgroup key={option.group} label={option.group}>
                  {option.options.map((opt) => (
                    <option 
                      key={opt.value} 
                      value={opt.value} 
                      disabled={opt.disabled}
                    >
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              );
            }

            return (
              <option 
                key={option.value} 
                value={option.value} 
                disabled={option.disabled}
              >
                {option.label}
              </option>
            );
          })}
        </select>

        {/* Chevron Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
          <FiChevronDown className="w-5 h-5" />
        </div>
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
            <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {success}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Select.displayName = 'Select';

// ── MultiSelect Component ─────────────────────────────────────────────────

export const MultiSelect = forwardRef(({ 
  label,
  error,
  options = [],
  value = [],
  onChange,
  placeholder = 'Select options...',
  searchable = true,
  size = 'md',
  className = '',
  disabled,
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const containerRef = React.useRef(null);

  // Click outside handler
  React.useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      )}
      
      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2 text-left transition-all duration-200',
            SIZES[size] || SIZES.md,
            'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isOpen && 'ring-2 ring-primary-500 border-transparent',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              selectedOptions.map(opt => (
                <span key={opt.value} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); }}
                    className="hover:text-red-500"
                    aria-label={`Remove ${opt.label}`}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          <FiChevronDown className={cn('w-5 h-5 text-gray-400 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              {searchable && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="max-h-60 overflow-y-auto p-1">
                {filteredOptions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No options found</p>
                ) : (
                  filteredOptions.map(opt => {
                    const isSelected = value.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleOption(opt.value)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left',
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {/* Checkbox indicator */}
                        <span className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                          isSelected
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-gray-300 dark:border-gray-600'
                        )}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {opt.label}
                        {opt.count !== undefined && (
                          <span className="ml-auto text-xs text-gray-400">{opt.count}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              {value.length > 0 && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => onChange?.([])}
                    className="w-full text-xs text-red-500 hover:text-red-600 py-1"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 ml-1">
          <FiAlertCircle className="w-3.5 h-3.5" />{error}
        </p>
      )}
    </div>
  );
});

MultiSelect.displayName = 'MultiSelect';

export default React.memo(Select);
