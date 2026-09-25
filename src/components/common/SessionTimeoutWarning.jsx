import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiLogOut, FiRefreshCw } from 'react-icons/fi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

/**
 * SessionTimeoutWarning - Shows a warning modal when the user's session is about to expire.
 * Allows the user to extend their session or log out.
 */
const SessionTimeoutWarning = () => {
  const { sessionTimeout, extendSession, logout } = useAuth();
  const { showWarning, remaining } = sessionTimeout;

  const timerRef = useRef(null);
  const [countdown, setCountdown] = React.useState(Math.ceil(remaining / 1000));

  // Update countdown every second
  useEffect(() => {
    if (!showWarning) {
      setCountdown(Math.ceil(remaining / 1000));
      return;
    }

    setCountdown(Math.ceil(remaining / 1000));

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showWarning, remaining]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleExtend = () => {
    extendSession();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <Modal
          isOpen={showWarning}
          onClose={() => {}} // Prevent closing by clicking outside
          title="Session Expiring Soon"
          size="sm"
          closeOnOutsideClick={false}
          closeOnEsc={false}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Warning Icon */}
            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <FiClock className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Your session will expire in <strong>{formatTime(countdown)}</strong>
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Click "Stay Logged In" to continue working.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                icon={<FiLogOut className="w-4 h-4" />}
                className="flex-1"
              >
                Log Out
              </Button>
              <Button
                onClick={handleExtend}
                icon={<FiRefreshCw className="w-4 h-4" />}
                className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500"
              >
                Stay Logged In
              </Button>
            </div>

            {/* Countdown Progress Bar */}
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-red-500 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${(countdown / Math.ceil(remaining / 1000)) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default SessionTimeoutWarning;
