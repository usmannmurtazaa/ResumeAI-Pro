import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiLoader, FiFileText } from 'react-icons/fi';

// ── Constants ───────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  xs: {
    spinner: 'w-6 h-6 border-2',
    dot: 'w-1.5 h-1.5',
    pulse: 'w-8 h-8',
    icon: 12,
    text: 'text-xs',
  },
  sm: {
    spinner: 'w-8 h-8 border-2',
    dot: 'w-2 h-2',
    pulse: 'w-12 h-12',
    icon: 16,
    text: 'text-sm',
  },
  md: {
    spinner: 'w-12 h-12 border-3',
    dot: 'w-3 h-3',
    pulse: 'w-16 h-16',
    icon: 20,
    text: 'text-base',
  },
  lg: {
    spinner: 'w-16 h-16 border-4',
    dot: 'w-4 h-4',
    pulse: 'w-20 h-20',
    icon: 28,
    text: 'text-lg',
  },
  xl: {
    spinner: 'w-20 h-20 border-4',
    dot: 'w-5 h-5',
    pulse: 'w-24 h-24',
    icon: 36,
    text: 'text-xl',
  },
};

const PROGRESS_WIDTHS = {
  xs: 'w-16',
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-40',
  xl: 'w-48',
};

// ── Main Loader Component ──────────────────────────────────────────────────

const Loader = ({ 
  fullScreen = false,
  size = 'md',
  variant = 'spinner',
  text = 'Loading...',
  showText = true,
  transparent = false,
  message,
  className = '',
  ariaLabel,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const displayText = message || text;
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const renderLoader = () => {
    const commonProps = { size, sizeConfig, prefersReducedMotion };

    switch (variant) {
      case 'spinner':
        return <SpinnerLoader {...commonProps} />;
      case 'dots':
        return <DotsLoader {...commonProps} />;
      case 'pulse':
        return <PulseLoader {...commonProps} />;
      case 'brand':
        return <BrandLoader {...commonProps} />;
      case 'progress':
        return <ProgressLoader {...commonProps} />;
      case 'skeleton':
        return <SkeletonLoader {...commonProps} />;
      default:
        return <SpinnerLoader {...commonProps} />;
    }
  };

  const loaderContent = (
    <div 
      className="flex flex-col items-center justify-center space-y-4"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || displayText}
    >
      {renderLoader()}
      
      {showText && !prefersReducedMotion && (
        <motion.p 
          className={`${sizeConfig.text} text-gray-500 dark:text-gray-400 font-medium`}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {displayText}
        </motion.p>
      )}
      
      {/* Static text for reduced motion preference */}
      {showText && prefersReducedMotion && (
        <p className={`${sizeConfig.text} text-gray-500 dark:text-gray-400 font-medium`}>
          {displayText}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          transparent 
            ? 'bg-white/50 dark:bg-gray-900/50' 
            : 'bg-white/80 dark:bg-gray-900/80'
        } backdrop-blur-sm ${className}`}
      >
        {loaderContent}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      {loaderContent}
    </div>
  );
};

// ── Spinner Loader ─────────────────────────────────────────────────────────

const SpinnerLoader = ({ sizeConfig, prefersReducedMotion }) => {
  if (prefersReducedMotion) {
    return (
      <div className={`${sizeConfig.spinner} border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center`}>
        <FiLoader className="w-1/2 h-1/2 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <div className="relative" role="presentation">
      {/* Track ring */}
      <div className={`${sizeConfig.spinner} border-gray-200 dark:border-gray-700 rounded-full`} />
      {/* Spinning arc */}
      <motion.div
        className={`absolute top-0 left-0 ${sizeConfig.spinner} border-transparent border-t-primary-500 dark:border-t-primary-400 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ borderWidth: 'inherit' }}
      />
    </div>
  );
};

// ── Dots Loader ────────────────────────────────────────────────────────────

const DotsLoader = ({ sizeConfig, prefersReducedMotion }) => {
  if (prefersReducedMotion) {
    return (
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeConfig.dot} bg-gray-400 dark:bg-gray-500 rounded-full`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex space-x-2" role="presentation">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeConfig.dot} bg-primary-500 dark:bg-primary-400 rounded-full`}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ── Pulse Loader ───────────────────────────────────────────────────────────

const PulseLoader = ({ sizeConfig, prefersReducedMotion }) => {
  if (prefersReducedMotion) {
    return (
      <div className={`${sizeConfig.pulse} bg-gray-300 dark:bg-gray-600 rounded-full`} />
    );
  }

  return (
    <motion.div
      className={`${sizeConfig.pulse} bg-primary-500 dark:bg-primary-400 rounded-full`}
      animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      role="presentation"
    />
  );
};

// ── Brand Loader ───────────────────────────────────────────────────────────

const BrandLoader = ({ sizeConfig, prefersReducedMotion }) => {
  if (prefersReducedMotion) {
    return (
      <div className="relative">
        <div className={`${sizeConfig.spinner} border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center`}>
          <FiFileText className="text-primary-500 dark:text-primary-400" size={sizeConfig.icon} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative" role="presentation">
      {/* Outer ring */}
      <motion.div
        className={`${sizeConfig.spinner} border-gray-200 dark:border-gray-700 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner spinning arc */}
      <motion.div
        className={`absolute top-0 left-0 ${sizeConfig.spinner} border-transparent border-t-primary-500 dark:border-t-primary-400 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <FiFileText className="text-primary-500 dark:text-primary-400" size={sizeConfig.icon} />
      </div>
    </div>
  );
};

// ── Progress Loader ────────────────────────────────────────────────────────

const ProgressLoader = ({ size, prefersReducedMotion }) => {
  const widthClass = PROGRESS_WIDTHS[size] || PROGRESS_WIDTHS.md;

  if (prefersReducedMotion) {
    return (
      <div className={`${widthClass} h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div className="h-full w-2/3 bg-primary-500 dark:bg-primary-400 rounded-full" />
      </div>
    );
  }

  return (
    <div 
      className={`${widthClass} h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading progress"
    >
      <motion.div
        className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-full"
        style={{ width: '40%' }}
        animate={{ x: ['-100%', '250%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

// ── Skeleton Loader ────────────────────────────────────────────────────────

const SkeletonLoader = ({ prefersReducedMotion }) => {
  const animationClass = prefersReducedMotion ? '' : 'animate-pulse';

  return (
    <div className="w-full max-w-md space-y-4" role="status" aria-label="Loading content">
      {/* Header skeleton */}
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full ${animationClass}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${animationClass} w-3/4`} />
          <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded ${animationClass} w-1/2`} />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-3 pt-2">
        <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded ${animationClass}`} />
        <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded ${animationClass} w-11/12`} />
        <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded ${animationClass} w-4/5`} />
        <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded ${animationClass} w-9/12`} />
      </div>
      
      {/* Action skeleton */}
      <div className="flex space-x-3 pt-4">
        <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded-lg ${animationClass} w-24`} />
        <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded-lg ${animationClass} w-32`} />
      </div>
      
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ── Export Variants ────────────────────────────────────────────────────────

/**
 * Full page loader with branded animation.
 */
export const PageLoader = ({ message = 'Loading amazing things...' }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <Loader variant="brand" size="lg" showText={false} />
        
        {prefersReducedMotion ? (
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {message}
          </p>
        ) : (
          <motion.p 
            className="mt-4 text-gray-500 dark:text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

/**
 * Small inline loader for buttons and inline elements.
 */
export const InlineLoader = ({ className = '', size = 16 }) => (
  <FiLoader className={`animate-spin ${className}`} size={size} aria-label="Loading" />
);

/**
 * Overlay loader with backdrop for containers.
 */
export const OverlayLoader = ({ message = 'Loading...' }) => (
  <div 
    className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl"
    role="status"
    aria-label={message}
  >
    <Loader variant="spinner" size="md" text={message} />
  </div>
);

/**
 * Suspense fallback wrapper for lazy-loaded components.
 * 
 * @example
 * <Suspense fallback={<SuspenseLoader />}>
 *   <LazyComponent />
 * </Suspense>
 */
export const SuspenseLoader = ({ variant = 'skeleton', message = 'Loading...' }) => (
  <div className="min-h-[200px] flex items-center justify-center">
    <Loader variant={variant} size="md" text={message} />
  </div>
);

export default React.memo(Loader);