import React, { forwardRef, createContext, useContext, useId } from 'react';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Radio Context ────────────────────────────────────────────────────────

const RadioContext = createContext(null);

// ── Radio Component ──────────────────────────────────────────────────────

const Radio = forwardRef(
  (
    {
      label,
      name,
      value,
      checked,
      onChange,
      error,
      disabled,
      helperText,
      className = '',
      ...props
    },
    ref
  ) => {
    const context = useContext(RadioContext);
    const helperId = useId();

    const isChecked = context ? context.value === value : checked;

    // When this Radio is used inside a RadioGroup, the group owns the
    // `name` / `checked` / `error` state and only needs the selected value
    // from each option. The DOM event is deliberately not forwarded to the
    // group's `onChange` - this is why the inline arrow takes no arguments.
    // Outside a group, the caller's own `onChange` is forwarded unchanged
    // and continues to receive the native event object.
    const handleChange = context ? () => context.onChange(value) : onChange;

    const isDisabled = context?.disabled || disabled;
    const isError = context?.error || error;
    const groupName = context?.name || name;

    // If there is an error (string), show it in the helper slot with error
    // styling. Otherwise show the plain helperText. `aria-describedby` on
    // the input points at this element so screen readers announce it.
    const helperTextValue = typeof isError === 'string' ? isError : helperText;

    return (
      <label
        className={cn(
          'inline-flex items-start gap-3',
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className
        )}
      >
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="radio"
            name={groupName}
            value={value}
            checked={isChecked}
            onChange={handleChange}
            disabled={isDisabled}
            className="sr-only peer"
            aria-describedby={helperTextValue ? helperId : undefined}
            {...props}
          />

          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
              isError
                ? 'border-red-500 dark:border-red-400'
                : isChecked
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 dark:border-gray-600',
              isDisabled && 'bg-gray-100 dark:bg-gray-700',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
              !isChecked && !isError && 'group-hover:border-primary-400'
            )}
          >
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200',
                isChecked ? 'scale-100' : 'scale-0'
              )}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {label && (
            <span
              className={cn(
                'text-sm select-none',
                isError ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
                isDisabled && 'text-gray-400 dark:text-gray-500'
              )}
            >
              {label}
            </span>
          )}
          {helperTextValue && (
            <p
              id={helperId}
              className={cn(
                'text-xs mt-0.5',
                isError ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {helperTextValue}
            </p>
          )}
        </div>
      </label>
    );
  }
);

Radio.displayName = 'Radio';

// ── RadioGroup Component ──────────────────────────────────────────────────

export const RadioGroup = ({
  name,
  value,
  onChange,
  error,
  disabled,
  children,
  label,
  helperText,
  orientation = 'vertical',
  className = '',
  ...props
}) => {
  const generatedName = useId();
  const groupName = name || generatedName;
  const groupHelperId = useId();

  const contextValue = {
    name: groupName,
    value,
    onChange,
    error,
    disabled,
  };

  return (
    <RadioContext.Provider value={contextValue}>
      <fieldset
        className={className}
        disabled={disabled}
        aria-describedby={error || helperText ? groupHelperId : undefined}
        {...props}
      >
        {label && (
          <legend
            className={cn(
              'block text-sm font-medium mb-2',
              error ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {label}
          </legend>
        )}

        <div
          className={cn(
            orientation === 'horizontal' ? 'flex flex-wrap gap-x-6 gap-y-2' : 'space-y-3'
          )}
        >
          {children}
        </div>

        {error && typeof error === 'string' && (
          <p id={groupHelperId} className="text-xs text-red-500 dark:text-red-400 mt-2">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={groupHelperId} className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {helperText}
          </p>
        )}
      </fieldset>
    </RadioContext.Provider>
  );
};

RadioGroup.displayName = 'RadioGroup';

// ── RadioCard Component (Styled Radio Option) ─────────────────────────────

export const RadioCard = forwardRef(
  ({ label, description, value, icon: Icon, badge, className = '', ...props }, ref) => {
    const context = useContext(RadioContext);
    const isChecked = context ? context.value === value : props.checked;

    return (
      <label
        className={cn(
          'relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
          isChecked
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-md'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800',
          context?.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <Radio ref={ref} value={value} className="mt-0.5" {...props} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
            <span className="font-medium text-sm text-gray-900 dark:text-white">{label}</span>
            {badge && <span className="ml-auto flex-shrink-0">{badge}</span>}
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {isChecked && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </label>
    );
  }
);

RadioCard.displayName = 'RadioCard';

export default React.memo(Radio);
