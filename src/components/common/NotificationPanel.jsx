import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, FiX, FiInfo, FiCheck, FiCheckCircle, 
  FiAlertTriangle, FiFileText, FiUser, FiClock,
  FiChevronRight, FiInbox
} from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ── Reuse the same config ──────────────────────────────────────────────────

const NOTIFICATION_CONFIG = {
  success: { icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  warning: { icon: FiAlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  error: { icon: FiAlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  info: { icon: FiInfo, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  resume: { icon: FiFileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  user: { icon: FiUser, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
};

// ── Component ──────────────────────────────────────────────────────────────

/**
 * NotificationPanel - Controlled component for use inside Navbar.
 * 
 * @param {boolean} isOpen - Whether the panel is visible
 * @param {function} onClose - Callback to close the panel
 */
const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { 
    notifications = [], 
    unreadCount = 0, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications?.() || {};

  // ── Escape Key Handler ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.read && markAsRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    if (notification.link) {
      onClose?.();
      setTimeout(() => navigate(notification.link), 150);
    }
  }, [markAsRead, navigate, onClose]);

  const handleMarkAllAsRead = useCallback(async (e) => {
    e.stopPropagation();
    if (!markAllAsRead) return;
    
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  }, [markAllAsRead]);

  const handleViewAll = useCallback(() => {
    onClose?.();
    navigate('/notifications');
  }, [navigate, onClose]);

  const hasUnread = unreadCount > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 mt-2 w-80 sm:w-88 glass-card p-0 overflow-hidden z-50 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          role="dialog"
          aria-label="Notifications"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Notifications
              </h3>
              {hasUnread && (
                <span className="bg-primary-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {hasUnread && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-2 py-1 rounded transition-colors"
                  type="button"
                  title="Mark all as read"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                aria-label="Close notifications"
                type="button"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiInbox className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  We'll let you know when something happens
                </p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.slice(0, 20).map((notif) => {
                  const config = NOTIFICATION_CONFIG[notif.type] || NOTIFICATION_CONFIG.info;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={notif.id}
                      whileTap={{ scale: 0.98 }}
                      className={`relative px-4 py-3 transition-colors group ${
                        notif.read 
                          ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer' 
                          : 'bg-primary-50/30 dark:bg-primary-900/10 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 cursor-pointer'
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationClick(notif);
                        }
                      }}
                    >
                      {!notif.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-r" />
                      )}

                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm truncate ${notif.read ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-900 dark:text-white font-semibold'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5 flex items-center gap-1">
                              <FiClock className="w-2.5 h-2.5" />
                              {notif.time || formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        {notif.link && (
                          <FiChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={handleViewAll}
                className="w-full text-center text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 py-3 px-4 transition-colors flex items-center justify-center gap-1 font-medium"
                type="button"
              >
                View all notifications
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(NotificationPanel);