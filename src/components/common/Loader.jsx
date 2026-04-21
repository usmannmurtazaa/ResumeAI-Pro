import React from 'react';
import { motion } from 'framer-motion';
import { FiLoader, FiFileText } from 'react-icons/fi';

// ============================================
// LOADER COMPONENT
// ============================================

const Loader = ({ 
  fullScreen = false, 
  size = 'md', 
  variant = 'spinner',
  text = 'Loading...',
  showText = true,
  transparent = false,
  message,
  className = '',
}) => {
  const displayText = message || text;

  const sizeClasses = {
    xs: 'w-8 h-8 border-2',
    sm: 'w-12 h-12 border-3',
    md: 'w-16 h-16 border-4',
    lg: 'w-20 h-20 border-4',
    xl: 'w-24 h-24 border-4',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return <SpinnerLoader size={size} sizeClasses={sizeClasses} />;
      case 'dots':
        return <DotsLoader size={size} />;
      case 'pulse':
        return <PulseLoader size={size} />;
      case 'brand':
        return <BrandLoader size={size} sizeClasses={sizeClasses} />;
      case 'progress':
        return <ProgressLoader size={size} />;
      case 'skeleton':
        return <SkeletonLoader />;
      default:
        return <SpinnerLoader size={size} sizeClasses={sizeClasses} />;
    }
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderLoader()}
      {showText && (
        <motion.p 
          className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {displayText}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${
        transparent ? 'bg-white/50 dark:bg-gray-900/50' : 'bg-white/80 dark:bg-gray-900/80'
      } backdrop-blur-sm ${className}`}>
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

// ============================================
// SPINNER LOADER
// ============================================

const SpinnerLoader = ({ size, sizeClasses }) => (
  <div className="relative">
    <motion.div
      className={`${sizeClasses[size]} border-primary-200 dark:border-primary-800 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className={`absolute top-0 left-0 ${sizeClasses[size]} border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

// ============================================
// DOTS LOADER
// ============================================

const DotsLoader = ({ size }) => {
  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${dotSizes[size]} bg-primary-600 dark:bg-primary-400 rounded-full`}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// PULSE LOADER
// ============================================

const PulseLoader = ({ size }) => {
  const pulseSizes = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
  };

  return (
    <motion.div
      className={`${pulseSizes[size]} bg-primary-600 dark:bg-primary-400 rounded-full`}
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    />
  );
};

// ============================================
// BRAND LOADER (with logo)
// ============================================

const BrandLoader = ({ size, sizeClasses }) => {
  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
  };

  return (
    <div className="relative">
      <motion.div
        className={`${sizeClasses[size]} border-primary-200 dark:border-primary-800 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={`absolute top-0 left-0 ${sizeClasses[size]} border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <FiFileText className="text-primary-600 dark:text-primary-400" size={iconSizes[size]} />
      </div>
    </div>
  );
};

// ============================================
// PROGRESS LOADER
// ============================================

const ProgressLoader = ({ size }) => {
  const widthClasses = {
    xs: 'w-16',
    sm: 'w-24',
    md: 'w-32',
    lg: 'w-40',
    xl: 'w-48',
  };

  return (
    <div className={`${widthClasses[size]} h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
      <motion.div
        className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

// ============================================
// SKELETON LOADER (for cards)
// ============================================

const SkeletonLoader = () => (
  <div className="w-full max-w-md p-4 space-y-4">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
    </div>
  </div>
);

// ============================================
// PAGE LOADER (Full page with logo)
// ============================================

export const PageLoader = ({ message = 'Loading amazing things...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <Loader variant="brand" size="lg" showText={false} />
      <motion.p 
        className="mt-4 text-gray-500 dark:text-gray-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </motion.div>
  </div>
);

// ============================================
// INLINE LOADER (Small, for buttons)
// ============================================

export const InlineLoader = ({ className = '' }) => (
  <FiLoader className={`animate-spin ${className}`} />
);

// ============================================
// OVERLAY LOADER (With backdrop)
// ============================================

export const OverlayLoader = ({ message = 'Loading...' }) => (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl">
    <Loader variant="spinner" size="md" text={message} />
  </div>
);

export default Loader;