import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';
import { clsx } from 'clsx';

// ============================================
// BUTTON COMPONENT
// ============================================

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  loading = false, 
  icon, 
  iconPosition = 'left',
  className = '',
  disabled,
  size = 'md',
  fullWidth = false,
  rounded = false,
  loadingText = 'Loading...',
  success = false,
  warning = false,
  as: Component = motion.button,
  type = 'button',
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white shadow-md hover:shadow-lg active:shadow-sm',
    secondary: 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-md hover:shadow-lg active:shadow-sm',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 bg-transparent',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg active:shadow-sm',
    success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg active:shadow-sm',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg active:shadow-sm',
    info: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg active:shadow-sm',
    light: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm',
    dark: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 shadow-md',
    link: 'text-primary-600 dark:text-primary-400 hover:underline bg-transparent p-0 shadow-none',
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs rounded-md',
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
    xl: 'px-10 py-5 text-xl rounded-2xl',
    icon: 'p-2 rounded-lg',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
    icon: 'w-5 h-5',
  };

  const loadingSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
    icon: 'w-5 h-5',
  };

  const buttonClasses = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    rounded && '!rounded-full',
    (success || warning) && variants[variant], // Override with success/warning if needed
    success && variants.success,
    warning && variants.warning,
    className
  );

  const iconClass = iconSizes[size] || iconSizes.md;
  const loadingClass = loadingSizes[size] || loadingSizes.md;

  // Render loading spinner
  const renderLoading = () => (
    <>
      <svg className={`animate-spin ${loadingClass}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>{loadingText}</span>
    </>
  );

  // Render icon with proper sizing
  const renderIcon = (iconElement) => {
    if (!iconElement) return null;
    return React.cloneElement(iconElement, {
      className: clsx(iconElement.props.className, iconClass),
    });
  };

  // Render success checkmark
  const renderSuccess = () => (
    <>
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {children}
    </>
  );

  return (
    <Component
      ref={ref}
      type={type}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        renderLoading()
      ) : success ? (
        renderSuccess()
      ) : (
        <>
          {icon && iconPosition === 'left' && renderIcon(icon)}
          {children}
          {icon && iconPosition === 'right' && renderIcon(icon)}
        </>
      )}
    </Component>
  );
});

Button.displayName = 'Button';

// ============================================
// ICON BUTTON COMPONENT
// ============================================

export const IconButton = forwardRef(({ 
  icon, 
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  className = '',
  tooltip,
  ...props 
}, ref) => {
  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const button = (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      loading={loading}
      className={clsx('relative', className)}
      aria-label={label || 'Icon button'}
      {...props}
    >
      {!loading && icon && React.cloneElement(icon, {
        className: clsx(icon.props.className, iconSizes[size] || iconSizes.md),
      })}
    </Button>
  );

  if (tooltip) {
    return (
      <div className="relative group">
        {button}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {tooltip}
        </span>
      </div>
    );
  }

  return button;
});

IconButton.displayName = 'IconButton';

// ============================================
// BUTTON GROUP COMPONENT
// ============================================

export const ButtonGroup = ({ children, vertical = false, className = '' }) => (
  <div className={clsx(
    'inline-flex',
    vertical ? 'flex-col' : 'flex-row',
    '[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none',
    !vertical && '[&>*:not(:first-child)]:-ml-px',
    vertical && '[&>*:not(:first-child)]:-mt-px',
    className
  )}>
    {children}
  </div>
);

// ============================================
// LOADING BUTTON (Pre-configured)
// ============================================

export const LoadingButton = (props) => (
  <Button loading disabled {...props} />
);

// ============================================
// EXPORT DEFAULT
// ============================================

export default Button;