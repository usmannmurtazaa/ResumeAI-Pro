import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiXCircle, FiX } from 'react-icons/fi';
import Button from './Button';

// ── Constants ─────────────────────────────────────────────────────────────

const ALERT_CONFIG = {
  success: {
    icon: FiCheckCircle,
    color: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-500',
    titleColor: 'text-green-800 dark:text-green-300',
    textColor: 'text-green-700 dark:text-green-400',
  },
  warning: {
    icon: FiAlertTriangle,
    color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-800 dark:text-yellow-300',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  error: {
    icon: FiXCircle,
    color: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-500',
    titleColor: 'text-red-800 dark:text-red-300',
    textColor: 'text-red-700 dark:text-red-400',
  },
  info: {
    icon: FiInfo,
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800 dark:text-blue-300',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
};

// ── Component ─────────────────────────────────────────────────────────────

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  closable = true,
  autoDismiss = 0,
  actions = [],
  className = '',
  id,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = ALERT_CONFIG[type] || ALERT_CONFIG.info;
  const Icon = config.icon;

  // Guards against `onClose` firing twice for a single dismissal. Two
  // paths would otherwise reach the callback for one user action:
  //   1. handleClose schedules a short delay, and
  //   2. <AnimatePresence onExitComplete> fires when the exit animation ends.
  // Both run roughly 200ms after the user clicks the X (or after
  // autoDismiss fires), so without this guard the callback was invoked
  // twice per dismissal.
  const closedRef = useRef(false);

  const notifyClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    // Reset for a fresh alert instance when identity-defining props change.
    // This mirrors the existing behaviour of bringing the alert back into
    // view; without it, reusing the same component for a new alert would
    // silently skip the onClose callback.
    closedRef.current = false;
    setIsVisible(true);
  }, [title, message, type, id]);

  const handleClose = useCallback(() => {
    // Only flip visibility here. `onClose` is fired from onExitComplete so
    // it runs exactly once, at the natural end of the exit animation.
    setIsVisible(false);
  }, []);

  // Auto-dismiss timer. `handleClose` has stable identity (its own
  // `useCallback` dependencies are `[]`), so including it here satisfies the
  // react-hooks/exhaustive-deps contract without re-arming the timer on
  // every render. Removing it from the dependency array would break the
  // lint rule and, more importantly, invite the same stale-closure drift
  // the rule is designed to prevent.
  useEffect(() => {
    if (autoDismiss > 0 && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, isVisible, handleClose]);

  return (
    <AnimatePresence onExitComplete={notifyClose}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className={`relative flex gap-3 p-4 rounded-lg border-l-4 ${config.color} ${className}`}
          role="alert"
          aria-live="polite"
        >
          <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`font-medium text-sm mb-0.5 ${config.titleColor}`}>{title}</h4>
            )}
            {message && <p className={`text-sm ${config.textColor}`}>{message}</p>}

            {actions.length > 0 && (
              <div className="flex gap-2 mt-2">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || 'outline'}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {closable && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors self-start"
              aria-label="Close alert"
              type="button"
            >
              <FiX className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Alert.displayName = 'Alert';

export default React.memo(Alert);
