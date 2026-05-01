import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheck, FiAlertCircle, FiInfo, FiStar } from 'react-icons/fi';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const VARIANTS = {
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  secondary: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
};

const OUTLINE_VARIANTS = {
  default: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent',
  primary: 'border border-primary-500 text-primary-600 dark:text-primary-400 bg-transparent',
  success: 'border border-green-500 text-green-600 dark:text-green-400 bg-transparent',
  warning: 'border border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-transparent',
  danger: 'border border-red-500 text-red-600 dark:text-red-400 bg-transparent',
  info: 'border border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent',
};

const GRADIENT_VARIANTS = {
  primary: 'bg-gradient-to-r from-primary-500 to-accent-500 text-white',
  success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
  warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
  danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
  info: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
};

const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
  xl: 'px-4 py-2 text-base gap-2',
};

const ROUNDED = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const DOT_COLORS = {
  default: 'bg-gray-500',
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

// ── Component ─────────────────────────────────────────────────────────────

const Badge = forwardRef(({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'left',
  rounded = 'full',
  dismissible = false,
  onDismiss,
  dot = false,
  outline = false,
  gradient = false,
  disabled = false,
  as: Component = 'span',
  href,
  ...props 
}, ref) => {
  // Determine which variant class to use
  const variantClass = outline 
    ? (OUTLINE_VARIANTS[variant] || OUTLINE_VARIANTS.default)
    : gradient 
      ? (GRADIENT_VARIANTS[variant] || '')
      : (VARIANTS[variant] || VARIANTS.default);

  const badgeClasses = cn(
    'inline-flex items-center justify-center font-medium transition-all select-none',
    variantClass,
    SIZES[size] || SIZES.md,
    ROUNDED[rounded] || ROUNDED.full,
    dismissible && 'pr-1',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  // Render icon with proper sizing
  const iconElement = icon && (
    <span className="flex-shrink-0 inline-flex">
      {icon}
    </span>
  );

  // Render dot indicator
  const dotElement = dot && (
    <span className={cn(
      'inline-block rounded-full flex-shrink-0',
      size === 'xs' ? 'w-1.5 h-1.5' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
      DOT_COLORS[variant] || DOT_COLORS.default
    )} />
  );

  const content = (
    <>
      {dotElement}
      {icon && iconPosition === 'left' && iconElement}
      {children}
      {icon && iconPosition === 'right' && iconElement}
      {dismissible && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <FiX className="w-3 h-3" />
        </button>
      )}
    </>
  );

  // Render as link if href is provided
  if (href) {
    return (
      <a href={href} className={badgeClasses} ref={ref} {...props}>
        {content}
      </a>
    );
  }

  // Render as motion.span if gradient (for animation)
  if (gradient) {
    return (
      <motion.span
        className={badgeClasses}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        ref={ref}
        {...props}
      >
        {content}
      </motion.span>
    );
  }

  // Default render
  return (
    <Component className={badgeClasses} ref={ref} {...props}>
      {content}
    </Component>
  );
});

Badge.displayName = 'Badge';

// ── Status Badge ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: { variant: 'success', label: 'Active', icon: <FiCheck className="w-3 h-3" /> },
  inactive: { variant: 'warning', label: 'Inactive', icon: <FiAlertCircle className="w-3 h-3" /> },
  pending: { variant: 'warning', label: 'Pending', icon: <FiInfo className="w-3 h-3" /> },
  completed: { variant: 'success', label: 'Completed', icon: <FiCheck className="w-3 h-3" /> },
  failed: { variant: 'danger', label: 'Failed', icon: <FiAlertCircle className="w-3 h-3" /> },
  draft: { variant: 'default', label: 'Draft' },
  published: { variant: 'primary', label: 'Published' },
  archived: { variant: 'secondary', label: 'Archived' },
  online: { variant: 'success', label: 'Online', icon: <FiCheck className="w-3 h-3" /> },
  offline: { variant: 'default', label: 'Offline' },
  busy: { variant: 'warning', label: 'Busy' },
  away: { variant: 'warning', label: 'Away' },
};

export const StatusBadge = ({ status, size = 'md', withDot = true, className = '', ...props }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <Badge variant={config.variant} size={size} icon={config.icon} dot={withDot && !config.icon} className={className} {...props}>
      {config.label}
    </Badge>
  );
};

// ── Specialized Badges ────────────────────────────────────────────────────

export const PremiumBadge = ({ size = 'md', className = '', ...props }) => (
  <Badge variant="primary" gradient size={size} icon={<FiStar className="w-3 h-3" />} className={className} {...props}>PRO</Badge>
);

export const NewBadge = ({ size = 'sm', className = '', ...props }) => (
  <Badge variant="success" size={size} className={cn('animate-pulse', className)} {...props}>NEW</Badge>
);

export const BetaBadge = ({ size = 'sm', className = '', ...props }) => (
  <Badge variant="warning" size={size} className={className} {...props}>BETA</Badge>
);

export const CountBadge = ({ count, max = 99, variant = 'danger', size = 'sm', ...props }) => (
  <Badge variant={variant} size={size} rounded="full" {...props}>
    {typeof count === 'number' ? (count > max ? `${max}+` : count) : count}
  </Badge>
);

export const BadgeGroup = ({ children, className = '' }) => (
  <div className={cn('flex flex-wrap gap-1.5', className)}>{children}</div>
);

export default React.memo(Badge);