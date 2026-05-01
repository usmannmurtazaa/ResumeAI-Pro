import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const SIZES = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3', xl: 'h-4' };

const COLORS = {
  primary: 'bg-primary-500', secondary: 'bg-purple-500', success: 'bg-green-500',
  warning: 'bg-yellow-500', danger: 'bg-red-500', error: 'bg-red-500', info: 'bg-blue-500',
};

const GRADIENTS = {
  primary: 'bg-gradient-to-r from-primary-500 to-accent-500',
  success: 'bg-gradient-to-r from-green-500 to-emerald-500',
  warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  danger: 'bg-gradient-to-r from-red-500 to-pink-500',
};

const VARIANTS = { default: 'rounded-full', square: 'rounded-none', rounded: 'rounded', pill: 'rounded-full' };

const STEP_SIZES = {
  sm: { circle: 'w-6 h-6 text-xs', line: 'h-0.5', icon: 'w-3 h-3' },
  md: { circle: 'w-8 h-8 text-sm', line: 'h-1', icon: 'w-4 h-4' },
  lg: { circle: 'w-10 h-10 text-base', line: 'h-1.5', icon: 'w-5 h-5' },
};

const STEP_COLORS = {
  primary: { active: 'bg-primary-500 text-white', completed: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30', line: 'bg-primary-500' },
  success: { active: 'bg-green-500 text-white', completed: 'bg-green-100 text-green-600', line: 'bg-green-500' },
};

const CIRCULAR_COLORS = {
  primary: 'text-primary-500', success: 'text-green-500', warning: 'text-yellow-500',
  danger: 'text-red-500', info: 'text-blue-500',
};

// ── Helpers ──────────────────────────────────────────────────────────────

const getColorClass = (color, isGradient = false) => {
  if (isGradient) return GRADIENTS[color] || GRADIENTS.primary;
  return COLORS[color] || COLORS.primary;
};

// FIXED: Inline the striped background as a CSS-in-JS pattern or Tailwind class
// Using a data attribute approach instead of DOM manipulation
const STRIPED_STYLE = {
  backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)`,
  backgroundSize: '1rem 1rem',
};

// ── Progress Component ────────────────────────────────────────────────────

const Progress = ({ 
  value = 0, max = 100,
  showLabel = false, showPercentage = false, label = 'Progress',
  size = 'md', color = 'primary',
  variant = 'default', animated = true, striped = false,
  indeterminate = false, gradient = false,
  className = '', barClassName = '', labelClassName = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion && !indeterminate;
  const colorClass = getColorClass(color, gradient);

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {(showLabel || showPercentage) && (
        <div className={cn('flex justify-between items-center mb-1', labelClassName)}>
          {showLabel && <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>}
          {showPercentage && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{Math.round(percentage)}%</span>}
        </div>
      )}

      {/* Progress Bar */}
      <div className={cn('w-full bg-gray-200 dark:bg-gray-700 overflow-hidden', VARIANTS[variant] || VARIANTS.default, SIZES[size] || SIZES.md)}>
        {indeterminate ? (
          <motion.div
            className={cn('h-full w-1/3', colorClass, barClassName)}
            style={striped ? STRIPED_STYLE : undefined}
            animate={prefersReducedMotion ? {} : { x: ['-100%', '400%'] }}
            transition={prefersReducedMotion ? {} : { duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        ) : shouldAnimate ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('h-full transition-all', colorClass, VARIANTS[variant] || VARIANTS.default, barClassName)}
            style={striped ? STRIPED_STYLE : undefined}
          />
        ) : (
          <div
            className={cn('h-full transition-all duration-300', colorClass, VARIANTS[variant] || VARIANTS.default, barClassName)}
            style={{ width: `${percentage}%`, ...(striped ? STRIPED_STYLE : {}) }}
          />
        )}
      </div>
    </div>
  );
};

// ── CircularProgress ──────────────────────────────────────────────────────

export const CircularProgress = ({ 
  value = 0, max = 100, size = 64, strokeWidth = 4,
  color = 'primary', showLabel = true, label, className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const colorClass = CIRCULAR_COLORS[color] || CIRCULAR_COLORS.primary;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} aria-label={`${Math.round(percentage)}% complete`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor"
          strokeWidth={strokeWidth} className="text-gray-200 dark:text-gray-700" />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor"
          strokeWidth={strokeWidth} strokeLinecap="round" className={colorClass}
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }} style={{ strokeDasharray: circumference }} />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{label || `${Math.round(percentage)}%`}</span>
        </div>
      )}
    </div>
  );
};

// ── StepProgress ──────────────────────────────────────────────────────────

export const StepProgress = ({ steps = [], currentStep = 0, size = 'md', color = 'primary', className = '' }) => {
  const colorScheme = STEP_COLORS[color] || STEP_COLORS.primary;
  const sizeScheme = STEP_SIZES[size] || STEP_SIZES.md;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div className={cn(
                sizeScheme.circle, 'rounded-full flex items-center justify-center font-medium transition-all duration-300',
                isCompleted || isActive ? colorScheme.active : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              )}>
                {isCompleted ? <FiCheckCircle className={sizeScheme.icon} /> : <span>{index + 1}</span>}
              </div>
              {step && (
                <span className={cn('mt-2 text-xs font-medium text-center', isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500')}>
                  {step}
                </span>
              )}
            </div>
            {!isLast && (
              <div className={cn('flex-1 mx-2', sizeScheme.line, isCompleted ? colorScheme.line : 'bg-gray-200 dark:bg-gray-700', 'rounded-full transition-all duration-300')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── ProgressWithStatus ────────────────────────────────────────────────────

export const ProgressWithStatus = ({ value, max = 100, status, size = 'md', color = 'primary', className = '' }) => {
  const getStatusConfig = () => {
    if (value >= 100) return { icon: FiCheckCircle, color: 'success', text: 'Completed' };
    if (value >= 75) return { icon: FiCheckCircle, color: 'success', text: 'Almost Done' };
    if (value >= 50) return { icon: FiClock, color: 'warning', text: 'In Progress' };
    if (value >= 25) return { icon: FiClock, color: 'info', text: 'Getting Started' };
    return { icon: FiAlertCircle, color: 'danger', text: 'Just Started' };
  };

  const config = status ? { icon: FiCheckCircle, color: 'success', text: status } : getStatusConfig();
  const statusColors = { success: 'text-green-500', warning: 'text-yellow-500', info: 'text-blue-500', danger: 'text-red-500' };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <config.icon className={cn('w-4 h-4', statusColors[config.color] || 'text-gray-500')} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{config.text}</span>
        </div>
        <span className="text-sm text-gray-500">{Math.round((value / max) * 100)}%</span>
      </div>
      <Progress value={value} max={max} size={size} color={config.color} />
    </div>
  );
};

// ── ProgressCard ──────────────────────────────────────────────────────────

export const ProgressCard = ({ title, description, value, max = 100, color = 'primary', className = '', action }) => (
  <div className={cn('p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{title}</h4>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    <Progress value={value} max={max} color={color} showPercentage size="md" />
  </div>
);

export default React.memo(Progress);