import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import Badge from './Badge';

// ============================================
// PROGRESS COMPONENT
// ============================================

const Progress = ({ 
  value = 0, 
  max = 100, 
  showLabel = false,
  showPercentage = false,
  label = 'Progress',
  size = 'md',
  color = 'primary',
  variant = 'default',
  animated = true,
  striped = false,
  indeterminate = false,
  className = '',
  barClassName = '',
  labelClassName = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  };

  const colors = {
    primary: 'bg-primary-500',
    secondary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    accent: 'bg-accent-500',
  };

  const gradients = {
    primary: 'bg-gradient-to-r from-primary-500 to-accent-500',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500',
    info: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  };

  const variants = {
    default: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded',
    pill: 'rounded-full',
  };

  const getColorClass = () => {
    if (color.includes('gradient') || color in gradients) {
      return gradients[color.replace('gradient-', '')] || gradients.primary;
    }
    return colors[color] || colors.primary;
  };

  const progressContent = (
    <div className={clsx('w-full', className)}>
      {/* Label */}
      {(showLabel || showPercentage) && (
        <div className={clsx('flex justify-between mb-1', labelClassName)}>
          {showLabel && (
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div className={clsx(
        'w-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
        variants[variant],
        sizes[size]
      )}>
        {indeterminate ? (
          <motion.div
            className={clsx(
              'h-full w-1/3',
              getColorClass(),
              striped && 'bg-stripes',
              barClassName
            )}
            animate={{ x: ['-100%', '400%'] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        ) : animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={clsx(
              'h-full transition-all',
              getColorClass(),
              striped && 'bg-stripes',
              variants[variant],
              barClassName
            )}
          />
        ) : (
          <div
            className={clsx(
              'h-full transition-all',
              getColorClass(),
              striped && 'bg-stripes',
              variants[variant],
              barClassName
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );

  return progressContent;
};

// ============================================
// CIRCULAR PROGRESS COMPONENT
// ============================================

export const CircularProgress = ({ 
  value = 0, 
  max = 100,
  size = 64,
  strokeWidth = 4,
  color = 'primary',
  showLabel = true,
  label,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colors = {
    primary: 'text-primary-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  };

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colors[color] || colors.primary}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium">
            {label || `${Math.round(percentage)}%`}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// STEP PROGRESS COMPONENT
// ============================================

export const StepProgress = ({ 
  steps = [],
  currentStep = 0,
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizes = {
    sm: { circle: 'w-6 h-6 text-xs', line: 'h-0.5', icon: 'w-3 h-3' },
    md: { circle: 'w-8 h-8 text-sm', line: 'h-1', icon: 'w-4 h-4' },
    lg: { circle: 'w-10 h-10 text-base', line: 'h-1.5', icon: 'w-5 h-5' },
  };

  const colors = {
    primary: { active: 'bg-primary-500 text-white', completed: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30', line: 'bg-primary-500' },
    success: { active: 'bg-green-500 text-white', completed: 'bg-green-100 text-green-600', line: 'bg-green-500' },
    warning: { active: 'bg-yellow-500 text-white', completed: 'bg-yellow-100 text-yellow-600', line: 'bg-yellow-500' },
  };

  const colorScheme = colors[color] || colors.primary;
  const sizeScheme = sizes[size] || sizes.md;

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div className={clsx(
                sizeScheme.circle,
                'rounded-full flex items-center justify-center font-medium transition-all',
                isCompleted || isActive ? colorScheme.active : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              )}>
                {isCompleted ? (
                  <FiCheckCircle className={sizeScheme.icon} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {step && (
                <span className={clsx(
                  'mt-2 text-xs font-medium',
                  isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                )}>
                  {step}
                </span>
              )}
            </div>
            {!isLast && (
              <div className={clsx(
                'flex-1 mx-2',
                sizeScheme.line,
                isCompleted ? colorScheme.line : 'bg-gray-200 dark:bg-gray-700',
                'rounded-full transition-all'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================
// PROGRESS WITH STATUS COMPONENT
// ============================================

export const ProgressWithStatus = ({ 
  value,
  max = 100,
  status,
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const getStatusConfig = () => {
    if (value >= 100) return { icon: FiCheckCircle, color: 'success', text: 'Completed' };
    if (value >= 75) return { icon: FiCheckCircle, color: 'success', text: 'Almost Done' };
    if (value >= 50) return { icon: FiClock, color: 'warning', text: 'In Progress' };
    if (value >= 25) return { icon: FiClock, color: 'info', text: 'Getting Started' };
    return { icon: FiAlertCircle, color: 'danger', text: 'Just Started' };
  };

  const statusConfig = status ? { icon: FiCheckCircle, color: 'success', text: status } : getStatusConfig();

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <statusConfig.icon className={clsx(
            'w-4 h-4',
            statusConfig.color === 'success' && 'text-green-500',
            statusConfig.color === 'warning' && 'text-yellow-500',
            statusConfig.color === 'info' && 'text-blue-500',
            statusConfig.color === 'danger' && 'text-red-500',
          )} />
          <span className="text-sm font-medium">{statusConfig.text}</span>
        </div>
        <span className="text-sm text-gray-500">{Math.round((value / max) * 100)}%</span>
      </div>
      <Progress value={value} max={max} size={size} color={statusConfig.color} />
    </div>
  );
};

// ============================================
// PROGRESS CARD COMPONENT
// ============================================

export const ProgressCard = ({ 
  title,
  description,
  value,
  max = 100,
  color = 'primary',
  className = '',
  action,
}) => (
  <div className={clsx('p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
    <Progress 
      value={value} 
      max={max} 
      color={color} 
      showPercentage 
      size="md"
    />
  </div>
);

// Add striped background style
const style = document.createElement('style');
style.textContent = `
  .bg-stripes {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 1rem 1rem;
  }
`;
if (!document.querySelector('#progress-stripes-style')) {
  style.id = 'progress-stripes-style';
  document.head.appendChild(style);
}

export default Progress;