import React, { forwardRef } from 'react';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Skeleton Component ────────────────────────────────────────────────────

const Skeleton = forwardRef(({ 
  variant = 'rect', 
  width, 
  height, 
  className = '',
  count = 1,
  animation = 'pulse', // 'pulse', 'wave', 'none'
  as: Component = 'div',
  ...props 
}, ref) => {
  const variants = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
    card: 'rounded-xl',
    avatar: 'rounded-full',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const baseClasses = cn(
    'bg-gray-200 dark:bg-gray-700',
    variants[variant] || variants.rect,
    animations[animation] || animations.pulse,
    className
  );

  const styles = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? undefined : undefined),
  };

  // When count > 1, stagger widths for text-like skeletons
  const getWidth = (index, total) => {
    if (width) return width;
    if (variant !== 'text') return undefined;
    
    // Make the last line shorter (common in content skeletons)
    if (index === total - 1) return '60%';
    
    // Random-ish widths for natural look
    const widths = ['100%', '90%', '85%', '95%', '75%'];
    return widths[index % widths.length];
  };

  if (count <= 1) {
    return (
      <Component
        ref={ref}
        className={baseClasses}
        style={{ ...styles, width: getWidth(0, 1) }}
        aria-hidden="true"
        {...props}
      />
    );
  }

  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Component
          key={index}
          ref={index === 0 ? ref : undefined}
          className={baseClasses}
          style={{ ...styles, width: getWidth(index, count) }}
          {...props}
        />
      ))}
    </div>
  );
});

Skeleton.displayName = 'Skeleton';

// ── Compound Skeleton Components ──────────────────────────────────────────

export const SkeletonText = ({ lines = 3, className = '', ...props }) => (
  <div className={cn('space-y-2', className)} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height="16px"
        width={i === lines - 1 ? '60%' : `${85 - (i * 5)}%`}
        {...props}
      />
    ))}
  </div>
);

SkeletonText.displayName = 'SkeletonText';

export const SkeletonCard = ({ className = '', ...props }) => (
  <div className={cn('p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4', className)} aria-hidden="true">
    {/* Header */}
    <div className="flex items-center gap-3">
      <Skeleton variant="circle" width="40px" height="40px" {...props} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height="14px" {...props} />
        <Skeleton variant="text" width="40%" height="12px" {...props} />
      </div>
    </div>
    {/* Body */}
    <SkeletonText lines={3} {...props} />
    {/* Actions */}
    <div className="flex gap-2">
      <Skeleton variant="rect" width="80px" height="36px" {...props} />
      <Skeleton variant="rect" width="100px" height="36px" {...props} />
    </div>
  </div>
);

SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonList = ({ rows = 3, className = '', ...props }) => (
  <div className={cn('space-y-3', className)} aria-hidden="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton variant="circle" width="36px" height="36px" {...props} />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" width="50%" height="14px" {...props} />
          <Skeleton variant="text" width="35%" height="12px" {...props} />
        </div>
        <Skeleton variant="text" width="60px" height="14px" {...props} />
      </div>
    ))}
  </div>
);

SkeletonList.displayName = 'SkeletonList';

export const SkeletonProfile = ({ className = '', ...props }) => (
  <div className={cn('flex flex-col items-center space-y-4 p-6', className)} aria-hidden="true">
    <Skeleton variant="circle" width="80px" height="80px" {...props} />
    <div className="space-y-2 text-center w-full">
      <Skeleton variant="text" width="150px" height="20px" className="mx-auto" {...props} />
      <Skeleton variant="text" width="200px" height="14px" className="mx-auto" {...props} />
    </div>
    <div className="flex gap-2 w-full justify-center">
      <Skeleton variant="rect" width="100px" height="36px" {...props} />
      <Skeleton variant="rect" width="100px" height="36px" {...props} />
    </div>
  </div>
);

SkeletonProfile.displayName = 'SkeletonProfile';

export const SkeletonDashboard = ({ className = '', ...props }) => (
  <div className={cn('space-y-6', className)} aria-hidden="true">
    {/* Stats row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
          <Skeleton variant="text" width="60%" height="14px" {...props} />
          <Skeleton variant="text" width="40%" height="24px" {...props} />
        </div>
      ))}
    </div>
    {/* Chart */}
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <Skeleton variant="text" width="30%" height="16px" className="mb-4" {...props} />
      <Skeleton variant="rect" width="100%" height="200px" {...props} />
    </div>
    {/* Table */}
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <Skeleton variant="text" width="30%" height="16px" className="mb-4" {...props} />
      <SkeletonList rows={5} {...props} />
    </div>
  </div>
);

SkeletonDashboard.displayName = 'SkeletonDashboard';

// ── Add shimmer animation to global styles (one-time) ────────────────────
// This is a safer approach than document.createElement('style')
// Add this CSS to your globals.css instead:
//
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }
// .animate-shimmer {
//   background: linear-gradient(90deg, 
//     theme('colors.gray.200') 25%, 
//     theme('colors.gray.100') 50%, 
//     theme('colors.gray.200') 75%
//   ) 0 0 / 200% 100%;
//   animation: shimmer 1.5s infinite;
// }
// .dark .animate-shimmer {
//   background: linear-gradient(90deg,
//     theme('colors.gray.700') 25%,
//     theme('colors.gray.600') 50%,
//     theme('colors.gray.700') 75%
//   ) 0 0 / 200% 100%;
// }

export default React.memo(Skeleton);