import React, { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const VARIANTS = {
  primary: 'bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white shadow-md hover:shadow-lg active:shadow-sm',
  secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700',
  outline: 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-600 bg-transparent',
  ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg',
  success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg',
  warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg',
  info: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg',
  link: 'text-primary-600 dark:text-primary-400 hover:underline bg-transparent p-0 shadow-none',
};

const SIZES = {
  xs: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  sm: 'px-4 py-2 text-sm rounded-lg gap-2',
  md: 'px-6 py-3 text-base rounded-xl gap-2',
  lg: 'px-8 py-4 text-lg rounded-xl gap-3',
  xl: 'px-10 py-5 text-xl rounded-2xl gap-3',
  icon: 'p-2 rounded-lg gap-0',
};

const ICON_SIZES = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
  icon: 'w-5 h-5',
};

const BASE_CLASSES = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 select-none whitespace-nowrap';

// ── Button Component ──────────────────────────────────────────────────────

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
  loadingText,
  success = false,
  warning = false,
  href,
  type = 'button',
  onClick,
  ...props 
}, ref) => {
  // ── Determine variant ─────────────────────────────────────────────────

  const activeVariant = success ? 'success' : warning ? 'warning' : variant;
  const variantClass = VARIANTS[activeVariant] || VARIANTS.primary;

  // ── Build classes ────────────────────────────────────────────────────

  const buttonClasses = cn(
    BASE_CLASSES,
    variantClass,
    SIZES[size] || SIZES.md,
    fullWidth && 'w-full',
    rounded && '!rounded-full',
    className
  );

  const iconClass = ICON_SIZES[size] || ICON_SIZES.md;

  // ── Determine which component to render ──────────────────────────────

  const isLink = !!href;
  const Component = isLink ? motion.a : motion.button;

  // ── Render icon safely ───────────────────────────────────────────────

  const renderIcon = (iconElement) => {
    if (!iconElement) return null;
    if (React.isValidElement(iconElement)) {
      return React.cloneElement(iconElement, {
        className: cn(iconElement.props?.className, iconClass),
        'aria-hidden': true,
      });
    }
    return <span className={iconClass}>{iconElement}</span>;
  };

  // ── Render loading spinner ──────────────────────────────────────────

  const loadingElement = (
    <>
      <FiLoader className={cn('animate-spin', iconClass)} aria-hidden="true" />
      {loadingText && <span>{loadingText}</span>}
    </>
  );

  // ── Render success check ────────────────────────────────────────────

  const successElement = (
    <>
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {children}
    </>
  );

  // ── Determine content ────────────────────────────────────────────────

  let content;
  if (loading) {
    content = loadingElement;
  } else if (success) {
    content = successElement;
  } else {
    content = (
      <>
        {icon && iconPosition === 'left' && renderIcon(icon)}
        {children}
        {icon && iconPosition === 'right' && renderIcon(icon)}
      </>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <Component
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...(isLink ? { href } : { type })}
      {...props}
    >
      {content}
    </Component>
  );
});

Button.displayName = 'Button';

// ── IconButton ────────────────────────────────────────────────────────────

export const IconButton = forwardRef(({ 
  icon, 
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  className = '',
  ...props 
}, ref) => (
  <Button
    ref={ref}
    variant={variant}
    size="icon"
    loading={loading}
    className={className}
    aria-label={label}
    {...props}
  >
    {!loading && icon}
  </Button>
));

IconButton.displayName = 'IconButton';

// ── ButtonGroup ───────────────────────────────────────────────────────────

export const ButtonGroup = ({ children, vertical = false, className = '' }) => (
  <div className={cn(
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

export default React.memo(Button);
