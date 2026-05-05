import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Animated theme toggle switch.
 * Supports light/dark mode, keyboard navigation, and accessibility.
 */
const ThemeToggle = ({ 
  className = '', 
  showLabel = false,
  size = 'md',
  disabled = false,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Size configurations
  const sizes = {
    sm: { width: 'w-10', height: 'h-5', ball: 'w-3.5 h-3.5', icon: 'w-2.5 h-2.5' },
    md: { width: 'w-14', height: 'h-7', ball: 'w-5 h-5', icon: 'w-3 h-3' },
    lg: { width: 'w-18', height: 'h-9', ball: 'w-6 h-6', icon: 'w-3.5 h-3.5' },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={disabled ? undefined : toggleTheme}
        disabled={disabled}
        className={`
          relative ${sizeConfig.width} ${sizeConfig.height} rounded-full p-1 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-600 hover:bg-gray-500' 
            : 'bg-gray-200 hover:bg-gray-300'
          }
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* Track Background Gradient */}
        <div 
          className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
          }}
        />

        {/* Sliding Ball */}
        <motion.div
          className={`absolute ${sizeConfig.ball} rounded-full shadow-md flex items-center justify-center z-10
            ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          animate={{ 
            x: isDark ? `calc(${sizeConfig.width === 'w-10' ? '20px' : sizeConfig.width === 'w-14' ? '28px' : '36px'} - ${sizeConfig.width === 'w-10' ? '28px' : sizeConfig.width === 'w-14' ? '40px' : '52px'})` : 4 
          }}
          transition={
            prefersReducedMotion 
              ? { duration: 0 }
              : { type: "spring", stiffness: 500, damping: 30 }
          }
        >
          {/* Icon with smooth transition */}
          <motion.div
            initial={false}
            animate={{ 
              rotate: isDark ? 360 : 0,
              scale: [0.5, 1],
            }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            {isDark ? (
              <FiMoon className={`${sizeConfig.icon} text-blue-300`} />
            ) : (
              <FiSun className={`${sizeConfig.icon} text-yellow-500`} />
            )}
          </motion.div>
        </motion.div>

        {/* Stars/Sunrays (decorative - hidden on reduced motion) */}
        {!prefersReducedMotion && (
          <>
            {/* Sun rays */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ 
                boxShadow: isDark 
                  ? '0 0 0 0 rgba(99, 102, 241, 0)' 
                  : '0 0 8px 2px rgba(250, 204, 21, 0.3)'
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Moon stars (tiny dots) */}
            {isDark && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full overflow-hidden"
              >
                <div className="absolute top-1.5 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-60" />
                <div className="absolute bottom-1.5 right-2.5 w-0.5 h-0.5 bg-white rounded-full opacity-40" />
                <div className="absolute top-1 right-3 w-0.5 h-0.5 bg-white rounded-full opacity-30" />
              </motion.div>
            )}
          </>
        )}
      </motion.button>

      {/* Optional Label */}
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-400 select-none">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </div>
  );
};

export default React.memo(ThemeToggle);
