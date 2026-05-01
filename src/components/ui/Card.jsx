import React, { forwardRef, useCallback } from 'react';
import { motion } from 'framer-motion';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const VARIANTS = {
  default: 'bg-white dark:bg-gray-800',
  glass: 'glass-card',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg',
  flat: 'bg-gray-50 dark:bg-gray-900',
  outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
  gradient: 'bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20',
  primary: 'bg-gradient-to-br from-primary-500 to-accent-500 text-white',
};

const HOVER_EFFECTS = {
  default: 'hover:shadow-lg',
  glass: 'hover:shadow-xl hover:bg-white/90 dark:hover:bg-gray-800/90',
  elevated: 'hover:shadow-xl',
  flat: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  outlined: 'hover:border-primary-300 dark:hover:border-primary-700',
  gradient: 'hover:shadow-lg',
  primary: 'hover:shadow-xl',
};

const PADDINGS = {
  none: 'p-0', xs: 'p-3', sm: 'p-4', md: 'p-6', lg: 'p-8', xl: 'p-10',
};

const SHADOWS = {
  none: '', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg', xl: 'shadow-xl', '2xl': 'shadow-2xl',
};

const ROUNDED = {
  none: 'rounded-none', sm: 'rounded-lg', md: 'rounded-xl', lg: 'rounded-2xl', xl: 'rounded-3xl', full: 'rounded-full',
};

// ── Card Component ────────────────────────────────────────────────────────

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
  onClick,
  as: Component = 'div',
  ...props 
}, ref) => {
  const cardClasses = cn(
    'transition-all duration-300',
    VARIANTS[variant] || VARIANTS.default,
    PADDINGS[padding] || PADDINGS.md,
    bordered && 'border border-gray-200 dark:border-gray-700',
    SHADOWS[shadow] || '',
    ROUNDED[rounded] || ROUNDED.xl,
    clickable && 'cursor-pointer',
    selected && 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900',
    disabled && 'opacity-50 pointer-events-none',
    hover && !disabled && (HOVER_EFFECTS[variant] || ''),
    className
  );

  // ── Keyboard support for clickable cards ────────────────────────────

  const handleKeyDown = useCallback((e) => {
    if (clickable && !disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  }, [clickable, disabled, onClick]);

  // ── Use motion.div only when animating ──────────────────────────────

  const motionProps = animate ? {
    whileHover: hover && !disabled && !clickable ? { y: -4 } : undefined,
    whileTap: clickable && !disabled ? { scale: 0.98 } : undefined,
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  } : {};

  // Use plain div when not animating (better performance)
  const Tag = animate ? motion.div : 'div';

  return (
    <Tag
      ref={ref}
      className={cardClasses}
      onClick={disabled ? undefined : onClick}
      onKeyDown={clickable ? handleKeyDown : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      {...motionProps}
      {...props}
    >
      {children}
    </Tag>
  );
});

Card.displayName = 'Card';

// ── Sub-Components ────────────────────────────────────────────────────────

export const CardHeader = ({ children, className = '', action, divider = true }) => (
  <div className={cn(
    'flex items-center justify-between',
    divider && 'pb-4 mb-4 border-b border-gray-200 dark:border-gray-700',
    className
  )}>
    <div className="flex-1 min-w-0">{children}</div>
    {action && <div className="flex-shrink-0 ml-4">{action}</div>}
  </div>
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = ({ children, className = '', as: Component = 'h3' }) => (
  <Component className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}>{children}</Component>
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = ({ children, className = '' }) => (
  <p className={cn('text-sm text-gray-500 dark:text-gray-400 mt-1', className)}>{children}</p>
);

CardDescription.displayName = 'CardDescription';

export const CardBody = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

CardBody.displayName = 'CardBody';

export const CardFooter = ({ children, className = '', divider = true }) => (
  <div className={cn(
    'flex items-center justify-end gap-3',
    divider && 'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700',
    className
  )}>{children}</div>
);

CardFooter.displayName = 'CardFooter';

// ── Specialized Cards ─────────────────────────────────────────────────────

export const StatCard = ({ title, value, icon: Icon, change, changeType = 'neutral', className = '', ...props }) => {
  const changeColors = { positive: 'text-green-500', negative: 'text-red-500', neutral: 'text-gray-500' };
  return (
    <Card className={className} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={cn('text-sm mt-2 flex items-center gap-1', changeColors[changeType])}>
              {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''}{change}
            </p>
          )}
        </div>
        {Icon && <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30"><Icon className="w-6 h-6 text-primary-500" /></div>}
      </div>
    </Card>
  );
};

StatCard.displayName = 'StatCard';

export const InfoCard = ({ title, description, icon: Icon, variant = 'default', className = '', ...props }) => {
  const iconColors = {
    default: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500',
    success: 'bg-green-50 dark:bg-green-900/30 text-green-500',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-500',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-500',
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500',
  };
  return (
    <Card className={cn('flex items-start gap-4', className)} {...props}>
      {Icon && <div className={cn('p-3 rounded-xl', iconColors[variant] || iconColors.default)}><Icon className="w-6 h-6" /></div>}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>}
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
    </Card>
  );
};

InfoCard.displayName = 'InfoCard';

export const ActionCard = ({ title, description, icon: Icon, action, className = '', ...props }) => (
  <Card clickable={!!action} onClick={action?.onClick} className={className} {...props}>
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex-shrink-0"><Icon className="w-6 h-6 text-primary-500" /></div>}
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{title}</h4>
          {description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  </Card>
);

ActionCard.displayName = 'ActionCard';

export const LoadingCard = ({ className = '', lines = 3 }) => (
  <Card className={cn('animate-pulse', className)}>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2 mt-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${85 - i * 10}%` }} />
      ))}
    </div>
  </Card>
);

LoadingCard.displayName = 'LoadingCard';

export default React.memo(Card);