import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { FiX, FiCheck, FiAlertCircle, FiInfo, FiStar } from 'react-icons/fi';

// ============================================
// BADGE COMPONENT
// ============================================

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'left',
  rounded = 'full',
  animated = false,
  dismissible = false,
  onDismiss,
  dot = false,
  outline = false,
  gradient = false,
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    secondary: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    accent: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300',
    light: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600',
    dark: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  };

  const outlineVariants = {
    default: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent',
    primary: 'border border-primary-500 text-primary-600 dark:text-primary-400 bg-transparent',
    success: 'border border-green-500 text-green-600 dark:text-green-400 bg-transparent',
    warning: 'border border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-transparent',
    danger: 'border border-red-500 text-red-600 dark:text-red-400 bg-transparent',
    info: 'border border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent',
  };

  const gradientVariants = {
    primary: 'bg-gradient-to-r from-primary-500 to-accent-500 text-white',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    info: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    purple: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
    xl: 'px-4 py-2 text-lg gap-2',
  };

  const roundedSizes = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const badgeClasses = clsx(
    'inline-flex items-center justify-center font-medium transition-all',
    outline ? outlineVariants[variant] : gradient ? gradientVariants[variant] : variants[variant],
    sizes[size],
    roundedSizes[rounded],
    dismissible && 'pr-1.5',
    animated && 'hover:scale-105',
    className
  );

  const iconElement = icon && (
    <span className={clsx('flex-shrink-0', iconSizes[size])}>
      {React.cloneElement(icon, { className: clsx(icon.props.className, 'w-full h-full') })}
    </span>
  );

  const dotElement = dot && (
    <span className={clsx(
      'inline-block rounded-full',
      size === 'xs' ? 'w-1.5 h-1.5' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
      {
        'bg-gray-500': variant === 'default',
        'bg-primary-500': variant === 'primary',
        'bg-green-500': variant === 'success',
        'bg-yellow-500': variant === 'warning',
        'bg-red-500': variant === 'danger' || variant === 'error',
        'bg-blue-500': variant === 'info',
      }[variant]
    )} />
  );

  const content = (
    <>
      {dotElement && <span className="mr-1">{dotElement}</span>}
      {icon && iconPosition === 'left' && iconElement}
      {children}
      {icon && iconPosition === 'right' && iconElement}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <FiX className={clsx('w-3 h-3', iconSizes[size])} />
        </button>
      )}
    </>
  );

  if (animated) {
    return (
      <motion.span
        className={badgeClasses}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {content}
      </motion.span>
    );
  }

  return (
    <span className={badgeClasses} {...props}>
      {content}
    </span>
  );
};

// ============================================
// STATUS BADGE COMPONENT
// ============================================

export const StatusBadge = ({ 
  status, 
  size = 'md',
  withDot = true,
  className = '',
  ...props 
}) => {
  const statusConfig = {
    active: { variant: 'success', label: 'Active', icon: FiCheck },
    inactive: { variant: 'warning', label: 'Inactive', icon: FiAlertCircle },
    pending: { variant: 'warning', label: 'Pending', icon: FiInfo },
    completed: { variant: 'success', label: 'Completed', icon: FiCheck },
    failed: { variant: 'danger', label: 'Failed', icon: FiAlertCircle },
    draft: { variant: 'default', label: 'Draft' },
    published: { variant: 'primary', label: 'Published' },
    archived: { variant: 'secondary', label: 'Archived' },
    online: { variant: 'success', label: 'Online', icon: FiCheck },
    offline: { variant: 'default', label: 'Offline' },
    busy: { variant: 'warning', label: 'Busy' },
    away: { variant: 'warning', label: 'Away' },
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={config.icon ? <config.icon /> : undefined}
      dot={withDot && !config.icon}
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
};

// ============================================
// PREMIUM BADGE COMPONENT
// ============================================

export const PremiumBadge = ({ size = 'md', className = '', ...props }) => (
  <Badge
    variant="primary"
    gradient
    size={size}
    icon={<FiStar />}
    className={className}
    {...props}
  >
    PRO
  </Badge>
);

// ============================================
// NEW BADGE COMPONENT
// ============================================

export const NewBadge = ({ size = 'md', className = '', ...props }) => (
  <Badge
    variant="success"
    size={size}
    className={clsx('animate-pulse', className)}
    {...props}
  >
    NEW
  </Badge>
);

// ============================================
// BETA BADGE COMPONENT
// ============================================

export const BetaBadge = ({ size = 'md', className = '', ...props }) => (
  <Badge
    variant="warning"
    size={size}
    className={className}
    {...props}
  >
    BETA
  </Badge>
);

// ============================================
// COUNT BADGE COMPONENT
// ============================================

export const CountBadge = ({ count, max = 99, variant = 'danger', size = 'sm', ...props }) => {
  const displayCount = typeof count === 'number' ? (count > max ? `${max}+` : count) : count;
  
  return (
    <Badge variant={variant} size={size} rounded="full" {...props}>
      {displayCount}
    </Badge>
  );
};

// ============================================
// BADGE GROUP COMPONENT
// ============================================

export const BadgeGroup = ({ children, className = '' }) => (
  <div className={clsx('flex flex-wrap gap-1.5', className)}>
    {children}
  </div>
);

export default Badge;