import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiX,
  FiInfo,
  FiCheck,
  FiCheckCircle,
  FiAlertTriangle,
  FiFileText,
  FiUser,
  FiClock,
  FiChevronRight,
  FiInbox,
  FiTrash2,
  FiLoader,
  FiRefreshCw,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useNotifications } from '../contexts/NotificationContext';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Notification type → icon + colour mapping ──────────────────────────────
//
// Mirrors the mapping in `NotificationPanel.jsx` so that the panel's
// compact list and this full-page list render every notification with the
// same icon and colour. If the mapping in the panel changes, this copy
// must change in the same commit.
const NOTIFICATION_CONFIG = {
  success: {
    icon: FiCheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  warning: {
    icon: FiAlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  error: {
    icon: FiAlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  info: {
    icon: FiInfo,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  resume: {
    icon: FiFileText,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  user: {
    icon: FiUser,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
};

const getNotificationMeta = (type) => NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.info;

// ── Loading skeleton ──────────────────────────────────────────────────────

const NotificationsSkeleton = () => (
  <div className="space-y-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="p-4 animate-pulse">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────

const EmptyState = () => (
  <Card className="p-12 text-center">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
      <FiInbox className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
      No notifications yet
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
      When you receive updates about your resumes, ATS scores, or account activity,
      they will appear here.
    </p>
  </Card>
);

// ── Error state ───────────────────────────────────────────────────────────

const ErrorState = ({ message, onRetry }) => (
  <Card className="p-12 text-center">
    <FiAlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
      Failed to load notifications
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>
    <Button onClick={onRetry} icon={<FiRefreshCw />}>
      Retry
    </Button>
  </Card>
);

// ── Single notification row ───────────────────────────────────────────────

const NotificationRow = React.memo(({ notification, onOpen, onDelete }) => {
  const meta = getNotificationMeta(notification.type);
  const Icon = meta.icon;
  const isUnread = !notification.read;

  const timeLabel = useMemo(() => {
    if (notification.time) return notification.time;
    if (!notification.createdAt) return '';
    try {
      const createdAt =
        typeof notification.createdAt?.toDate === 'function'
          ? notification.createdAt.toDate()
          : new Date(notification.createdAt);
      return formatDistanceToNow(createdAt, { addSuffix: true });
    } catch {
      return '';
    }
  }, [notification.createdAt, notification.time]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`relative group rounded-xl border transition-colors ${
        isUnread
          ? 'bg-primary-50/40 dark:bg-primary-900/10 border-primary-200/70 dark:border-primary-900/40'
          : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {isUnread && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary-500 rounded-r" />
      )}

      <div className="flex gap-3 p-4">
        <button
          type="button"
          onClick={() => onOpen(notification)}
          className="flex gap-3 flex-1 text-left min-w-0 cursor-pointer"
        >
          <div
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${meta.bg}`}
          >
            <Icon className={`w-4 h-4 ${meta.color}`} aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={`text-sm truncate ${
                  isUnread
                    ? 'font-semibold text-gray-900 dark:text-white'
                    : 'font-medium text-gray-700 dark:text-gray-300'
                }`}
              >
                {notification.title}
              </h4>
              {timeLabel && (
                <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5 flex items-center gap-1">
                  <FiClock className="w-2.5 h-2.5" aria-hidden="true" />
                  {timeLabel}
                </span>
              )}
            </div>
            {notification.message && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            )}
          </div>

          {notification.link && (
            <FiChevronRight
              className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 self-center group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors"
              aria-hidden="true"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => onDelete(notification)}
          className="self-start p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Delete notification: ${notification.title}`}
        >
          <FiTrash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
});

NotificationRow.displayName = 'NotificationRow';

// ── Main page ─────────────────────────────────────────────────────────────

const Notifications = () => {
  usePageTitle({
    title: 'Notifications',
    description: 'View all your account notifications, resume updates, and ATS score changes.',
  });

  const navigate = useNavigate();

  const {
    notifications = [],
    unreadCount = 0,
    loading = false,
    error = null,
    hasMore = false,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
    loadMore,
  } = useNotifications();

  // In-flight state for bulk actions. Prevents double-clicks.
  const [bulkAction, setBulkAction] = useState(null);
  // Second-click confirmation for the destructive "clear read" action.
  const [confirmingClearRead, setConfirmingClearRead] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleOpen = useCallback(
    async (notification) => {
      if (!notification.read && markAsRead) {
        try {
          await markAsRead(notification.id);
        } catch {
          // The context already handles its own error toast on failure.
        }
      }
      if (notification.link) {
        // Mirror the panel's small delay so the toast from `markAsRead`
        // (if any) is visible before navigation.
        setTimeout(() => navigate(notification.link), 150);
      }
    },
    [markAsRead, navigate]
  );

  const handleDelete = useCallback(
    async (notification) => {
      if (!deleteNotification) return;
      try {
        await deleteNotification(notification.id);
      } catch {
        // The context handles its own error toast.
      }
    },
    [deleteNotification]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (!markAllAsRead || unreadCount === 0 || bulkAction) return;
    setBulkAction('markAll');
    try {
      await markAllAsRead();
    } finally {
      setBulkAction(null);
    }
  }, [markAllAsRead, unreadCount, bulkAction]);

  const handleClearRead = useCallback(async () => {
    if (!clearRead || bulkAction) return;

    const readCount = notifications.filter((n) => n.read).length;
    if (readCount === 0) {
      toast('No read notifications to clear');
      return;
    }

    // Two-click confirmation. The first click asks; the second commits.
    if (!confirmingClearRead) {
      setConfirmingClearRead(true);
      // Auto-cancel the confirmation after a few seconds so the button
      // does not remain in a "danger" state indefinitely.
      setTimeout(() => setConfirmingClearRead(false), 4000);
      return;
    }

    setConfirmingClearRead(false);
    setBulkAction('clearRead');
    try {
      await clearRead();
    } finally {
      setBulkAction(null);
    }
  }, [clearRead, notifications, bulkAction, confirmingClearRead]);

  const handleLoadMore = useCallback(async () => {
    if (!loadMore || bulkAction) return;
    setBulkAction('loadMore');
    try {
      await loadMore();
    } finally {
      setBulkAction(null);
    }
  }, [loadMore, bulkAction]);

  // ── Derived values ──────────────────────────────────────────────────────

  const readCount = useMemo(
    () => notifications.filter((n) => n.read).length,
    [notifications]
  );

  const hasAnyUnread = unreadCount > 0;
  const hasAnyRead = readCount > 0;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <DashboardLayout showWelcome={false}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <FiBell className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Notifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'You are all caught up'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              loading={bulkAction === 'markAll'}
              disabled={!hasAnyUnread || bulkAction !== null}
              icon={<FiCheck />}
            >
              Mark all as read
            </Button>

            <Button
              variant={confirmingClearRead ? 'danger' : 'outline'}
              size="sm"
              onClick={handleClearRead}
              loading={bulkAction === 'clearRead'}
              disabled={!hasAnyRead || bulkAction !== null}
              icon={<FiX />}
            >
              {confirmingClearRead ? 'Confirm clear' : 'Clear read'}
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading && notifications.length === 0 ? (
          <NotificationsSkeleton />
        ) : error && notifications.length === 0 ? (
          <ErrorState
            message={typeof error === 'string' ? error : 'An unexpected error occurred.'}
            onRetry={() => window.location.reload()}
          />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {notifications.map((notif) => (
                  <NotificationRow
                    key={notif.id}
                    notification={notif}
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  loading={bulkAction === 'loadMore'}
                  disabled={bulkAction !== null}
                  icon={<FiLoader />}
                >
                  Load older notifications
                </Button>
              </div>
            )}

            {/* Count footer */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
              Showing {notifications.length} notification{notifications.length === 1 ? '' : 's'}
              {hasMore ? ' • More available' : ''}
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;