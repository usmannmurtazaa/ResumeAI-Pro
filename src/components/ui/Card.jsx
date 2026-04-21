import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// ============================================
// CARD COMPONENT
// ============================================

const Card = forwardRef(({ 
  children, 
  className = '', 
  hover = true,
  variant = 'default',
  padding = 'md',
  bordered = false,
  shadow = 'md',
  rounded = 'xl',
  clickable = false,
  selected = false,
  disabled = false,
  animate = true,
  as: Component = motion.div,
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800',
    glass: 'glass-card',
    elevated: 'bg-white dark:bg-gray-800 shadow-elevated',
    flat: 'bg-gray-50 dark:bg-gray-900',
    outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
    gradient: 'bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20',
    primary: 'bg-gradient-to-br from-primary-500 to-accent-500 text-white',
  };

  const paddings = {
    none: 'p-0',
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  };

  const roundedSizes = {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  };

  const cardClasses = clsx(
    // Base styles
    'transition-all duration-300',
    
    // Variant
    variants[variant],
    
    // Padding
    paddings[padding],
    
    // Border
    bordered && 'border border-gray-200 dark:border-gray-700',
    
    // Shadow
    shadows[shadow],
    
    // Rounded
    roundedSizes[rounded],
    
    // Interactive states
    clickable && 'cursor-pointer',
    selected && 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900',
    disabled && 'opacity-50 pointer-events-none',
    
    // Hover effects
    hover && !disabled && {
      default: 'hover:shadow-lg',
      glass: 'hover:shadow-xl hover:bg-white/90 dark:hover:bg-gray-800/90',
      elevated: 'hover:shadow-xl',
      flat: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      outlined: 'hover:border-primary-300 dark:hover:border-primary-700',
      gradient: 'hover:shadow-lg',
      primary: 'hover:shadow-xl',
    }[variant],
    
    className
  );

  const animationProps = animate ? {
    whileHover: hover && !disabled && !clickable ? { y: -4 } : {},
    whileTap: clickable && !disabled ? { scale: 0.98 } : {},
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  } : {};

  return (
    <Component
      ref={ref}
      className={cardClasses}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

// ============================================
// CARD COMPONENTS (Header, Body, Footer)
// ============================================

export const CardHeader = ({ 
  children, 
  className = '',
  action,
  divider = true,
}) => (
  <div className={clsx(
    'flex items-center justify-between',
    divider && 'pb-4 mb-4 border-b border-gray-200 dark:border-gray-700',
    className
  )}>
    <div className="flex-1">{children}</div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = ({ children, className = '', as: Component = 'h3' }) => (
  <Component className={clsx('text-lg font-semibold text-gray-900 dark:text-white', className)}>
    {children}
  </Component>
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = ({ children, className = '' }) => (
  <p className={clsx('text-sm text-gray-500 dark:text-gray-400 mt-1', className)}>
    {children}
  </p>
);

CardDescription.displayName = 'CardDescription';

export const CardBody = ({ children, className = '' }) => (
  <div className={clsx(className)}>
    {children}
  </div>
);

CardBody.displayName = 'CardBody';

export const CardFooter = ({ 
  children, 
  className = '',
  divider = true,
}) => (
  <div className={clsx(
    'flex items-center justify-end gap-3',
    divider && 'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700',
    className
  )}>
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';

// ============================================
// STAT CARD COMPONENT
// ============================================

export const StatCard = ({ 
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  className = '',
  ...props 
}) => {
  const changeColors = {
    positive: 'text-green-500',
    negative: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <Card className={className} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={clsx('text-sm mt-2 flex items-center gap-1', changeColors[changeType])}>
              {changeType === 'positive' && '↑'}
              {changeType === 'negative' && '↓'}
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30">
            <Icon className="w-6 h-6 text-primary-500" />
          </div>
        )}
      </div>
    </Card>
  );
};

StatCard.displayName = 'StatCard';

// ============================================
// INFO CARD COMPONENT
// ============================================

export const InfoCard = ({ 
  title,
  description,
  icon: Icon,
  variant = 'default',
  className = '',
  ...props 
}) => {
  const iconVariants = {
    default: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500',
    success: 'bg-green-50 dark:bg-green-900/30 text-green-500',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-500',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-500',
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500',
  };

  return (
    <Card className={clsx('flex items-start gap-4', className)} {...props}>
      {Icon && (
        <div className={clsx('p-3 rounded-xl', iconVariants[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="flex-1">
        {title && <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>}
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
    </Card>
  );
};

InfoCard.displayName = 'InfoCard';

// ============================================
// ACTION CARD COMPONENT
// ============================================

export const ActionCard = ({ 
  title,
  description,
  icon: Icon,
  action,
  className = '',
  ...props 
}) => (
  <Card clickable={!!action} className={className} {...props}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30">
            <Icon className="w-6 h-6 text-primary-500" />
          </div>
        )}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  </Card>
);

ActionCard.displayName = 'ActionCard';

// ============================================
// LOADING CARD (Skeleton)
// ============================================

export const LoadingCard = ({ className = '', lines = 3 }) => (
  <Card className={clsx('animate-pulse', className)}>
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2 mt-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
  </Card>
);

LoadingCard.displayName = 'LoadingCard';

// ============================================
// EXPORT DEFAULT
// ============================================

export default Card;