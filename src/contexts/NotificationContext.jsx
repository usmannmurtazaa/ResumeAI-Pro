import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
  getDocs,
  startAfter,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import toast from 'react-hot-toast';

// ============================================
// CONTEXT CREATION
// ============================================

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// ============================================
// NOTIFICATION TYPES & CONFIGURATIONS
// ============================================

export const NotificationTypes = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  RESUME_CREATED: 'resume_created',
  RESUME_UPDATED: 'resume_updated',
  RESUME_DELETED: 'resume_deleted',
  RESUME_DOWNLOADED: 'resume_downloaded',
  RESUME_DUPLICATED: 'resume_duplicated',
  ATS_SCORE_CHANGED: 'ats_score_changed',
  ATS_SCORE_MILESTONE: 'ats_score_milestone',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  PAYMENT_FAILED: 'payment_failed',
  NEW_FEATURE: 'new_feature',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SYSTEM: 'system',
  WELCOME: 'welcome',
  TIP: 'tip',
};

// Notification icons mapping
const NotificationIcons = {
  [NotificationTypes.SUCCESS]: '✅',
  [NotificationTypes.INFO]: 'ℹ️',
  [NotificationTypes.WARNING]: '⚠️',
  [NotificationTypes.ERROR]: '❌',
  [NotificationTypes.RESUME_CREATED]: '📄',
  [NotificationTypes.RESUME_UPDATED]: '📝',
  [NotificationTypes.RESUME_DELETED]: '🗑️',
  [NotificationTypes.RESUME_DOWNLOADED]: '📥',
  [NotificationTypes.RESUME_DUPLICATED]: '📋',
  [NotificationTypes.ATS_SCORE_CHANGED]: '📊',
  [NotificationTypes.ATS_SCORE_MILESTONE]: '🏆',
  [NotificationTypes.SUBSCRIPTION_EXPIRING]: '💳',
  [NotificationTypes.SUBSCRIPTION_RENEWED]: '✅',
  [NotificationTypes.PAYMENT_FAILED]: '❌',
  [NotificationTypes.NEW_FEATURE]: '🎉',
  [NotificationTypes.SYSTEM_MAINTENANCE]: '🔧',
  [NotificationTypes.SYSTEM]: '🔔',
  [NotificationTypes.WELCOME]: '👋',
  [NotificationTypes.TIP]: '💡',
};

// Notification colors for UI
const NotificationColors = {
  [NotificationTypes.SUCCESS]: 'bg-green-50 border-green-200 text-green-800',
  [NotificationTypes.INFO]: 'bg-blue-50 border-blue-200 text-blue-800',
  [NotificationTypes.WARNING]: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  [NotificationTypes.ERROR]: 'bg-red-50 border-red-200 text-red-800',
};

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS = {
  maxNotifications: 100,
  autoDeleteReadAfterDays: 30,
  groupSimilar: true,
};

// ============================================
// PROVIDER COMPONENT
// ============================================

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ============================================
  // REAL-TIME NOTIFICATIONS SUBSCRIPTION
  // ============================================

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));

        // Group similar notifications if enabled
        const grouped = groupSimilarNotifications(notificationData);

        // Sort by created date and read status
        const sorted = grouped.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return b.createdAt - a.createdAt;
        });

        setNotifications(sorted);
        setUnreadCount(notificationData.filter((n) => !n.read).length);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === 50);
        setLastSynced(new Date());
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setError(err);
        setLoading(false);
        toast.error('Failed to load notifications');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================
  // LOAD MORE NOTIFICATIONS (PAGINATION)
  // ============================================

  const loadMore = useCallback(async () => {
    if (!user || !lastVisible || !hasMore || loading) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const newNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      setNotifications((prev) => {
        const allNotifications = [...prev, ...newNotifications];
        return groupSimilarNotifications(allNotifications);
      });
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 50);
    } catch (error) {
      console.error('Error loading more notifications:', error);
    }
  }, [user, lastVisible, hasMore, loading]);

  // ============================================
  // GROUP SIMILAR NOTIFICATIONS
  // ============================================

  const groupSimilarNotifications = useCallback((notifs) => {
    if (!settings?.groupSimilar) return notifs;

    const grouped = [];
    const groupMap = new Map();

    notifs.forEach((notif) => {
      const key = `${notif.type}-${notif.title}`;
      const existing = groupMap.get(key);

      if (existing && !existing.read && !notif.read) {
        existing.count = (existing.count || 1) + 1;
        existing.message = `${existing.count} similar notifications`;
        if (notif.createdAt > existing.createdAt) {
          existing.createdAt = notif.createdAt;
        }
      } else {
        groupMap.set(key, { ...notif, count: 1 });
        grouped.push({ ...notif, count: 1 });
      }
    });

    return grouped;
  }, [settings?.groupSimilar]);

  // ============================================
  // BROWSER NOTIFICATIONS
  // ============================================

  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const showBrowserNotification = useCallback(
    (title, options = {}) => {
      if (!settings?.desktopNotifications) return;

      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          icon: '/logo.png',
          badge: '/favicon.ico',
          silent: !settings?.soundEnabled,
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          if (options.link) {
            window.location.href = options.link;
          }
          notification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      }
    },
    [settings?.desktopNotifications, settings?.soundEnabled]
  );

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!settings?.soundEnabled) return;

    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // Ignore audio errors
    }
  }, [settings?.soundEnabled]);

  // ============================================
  // CREATE NOTIFICATION
  // ============================================

  const createNotification = useCallback(
    async ({
      type = NotificationTypes.INFO,
      title,
      message,
      link = null,
      metadata = {},
      showToast = true,
      showBrowser = true,
      playSound = true,
    }) => {
      if (!user) return null;

      try {
        const notificationData = {
          userId: user.uid,
          type,
          title,
          message,
          link,
          metadata,
          read: false,
          createdAt: serverTimestamp(),
          icon: NotificationIcons[type] || '🔔',
          color: NotificationColors[type] || null,
        };

        const docRef = await addDoc(collection(db, 'notifications'), notificationData);

        if (showToast) {
          toast(message, {
            icon: NotificationIcons[type] || '🔔',
            duration: 5000,
          });
        }

        if (showBrowser) {
          showBrowserNotification(title, {
            body: message,
            tag: type,
            link,
          });
        }

        if (playSound) {
          playNotificationSound();
        }

        return docRef.id;
      } catch (error) {
        console.error('Error creating notification:', error);
        return null;
      }
    },
    [user, showBrowserNotification, playNotificationSound]
  );

  // ============================================
  // MARK AS READ
  // ============================================

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  }, []);

  const markMultipleAsRead = useCallback(async (notificationIds) => {
    if (!notificationIds.length) return;

    try {
      const batch = writeBatch(db);
      notificationIds.forEach((id) => {
        const notificationRef = doc(db, 'notifications', id);
        batch.update(notificationRef, {
          read: true,
          readAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) {
      toast('No unread notifications');
      return;
    }

    await markMultipleAsRead(unreadIds);
    toast.success(`Marked ${unreadIds.length} notifications as read`);
  }, [notifications, markMultipleAsRead]);

  // ============================================
  // DELETE NOTIFICATIONS
  // ============================================

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      toast.success('Notification removed');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, []);

  const deleteMultiple = useCallback(async (notificationIds) => {
    if (!notificationIds.length) return;

    try {
      const batch = writeBatch(db);
      notificationIds.forEach((id) => {
        const notificationRef = doc(db, 'notifications', id);
        batch.delete(notificationRef);
      });
      await batch.commit();
      toast.success(`Deleted ${notificationIds.length} notifications`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Failed to delete notifications');
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (!notifications.length) {
      toast('No notifications to clear');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to clear all notifications?');
    if (!confirmed) return;

    await deleteMultiple(notifications.map((n) => n.id));
  }, [notifications, deleteMultiple]);

  const clearRead = useCallback(async () => {
    const readIds = notifications.filter((n) => n.read).map((n) => n.id);
    if (!readIds.length) {
      toast('No read notifications to clear');
      return;
    }

    await deleteMultiple(readIds);
  }, [notifications, deleteMultiple]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getNotificationsByType = useCallback(
    (type) => {
      return notifications.filter((n) => n.type === type);
    },
    [notifications]
  );

  const getUnreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const getRecentNotifications = useCallback(
    (count = 5) => {
      return notifications.slice(0, count);
    },
    [notifications]
  );

  const hasUnreadOfType = useCallback(
    (type) => {
      return notifications.some((n) => n.type === type && !n.read);
    },
    [notifications]
  );

  const refresh = useCallback(() => {
    setLastSynced(new Date());
  }, []);

  // ============================================
  // PREDEFINED NOTIFICATION CREATORS
  // ============================================

  const notify = {
    success: (title, message, options = {}) =>
      createNotification({ type: NotificationTypes.SUCCESS, title, message, ...options }),
    info: (title, message, options = {}) =>
      createNotification({ type: NotificationTypes.INFO, title, message, ...options }),
    warning: (title, message, options = {}) =>
      createNotification({ type: NotificationTypes.WARNING, title, message, ...options }),
    error: (title, message, options = {}) =>
      createNotification({ type: NotificationTypes.ERROR, title, message, ...options }),
    
    welcome: (userName, options = {}) =>
      createNotification({
        type: NotificationTypes.WELCOME,
        title: 'Welcome to ResumeAI Pro! 🎉',
        message: `Hi ${userName}! Let's create your first professional resume.`,
        ...options,
      }),
    
    resumeCreated: (resumeName, options = {}) =>
      createNotification({
        type: NotificationTypes.RESUME_CREATED,
        title: 'Resume Created',
        message: `"${resumeName}" has been created successfully.`,
        ...options,
      }),
    
    resumeUpdated: (resumeName, options = {}) =>
      createNotification({
        type: NotificationTypes.RESUME_UPDATED,
        title: 'Resume Updated',
        message: `"${resumeName}" has been updated successfully.`,
        ...options,
      }),
    
    resumeDownloaded: (resumeName, options = {}) =>
      createNotification({
        type: NotificationTypes.RESUME_DOWNLOADED,
        title: 'Resume Downloaded',
        message: `"${resumeName}" has been downloaded.`,
        ...options,
      }),
    
    atsScoreChanged: (resumeName, oldScore, newScore, options = {}) =>
      createNotification({
        type: NotificationTypes.ATS_SCORE_CHANGED,
        title: 'ATS Score Updated',
        message: `"${resumeName}" score changed from ${oldScore}% to ${newScore}%.`,
        ...options,
      }),
    
    atsScoreMilestone: (resumeName, score, options = {}) =>
      createNotification({
        type: NotificationTypes.ATS_SCORE_MILESTONE,
        title: '🏆 ATS Score Milestone!',
        message: `Congratulations! "${resumeName}" reached ${score}% ATS score!`,
        ...options,
      }),
    
    subscriptionExpiring: (daysLeft, options = {}) =>
      createNotification({
        type: NotificationTypes.SUBSCRIPTION_EXPIRING,
        title: 'Subscription Expiring Soon',
        message: `Your subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
        ...options,
      }),
    
    newFeature: (featureName, options = {}) =>
      createNotification({
        type: NotificationTypes.NEW_FEATURE,
        title: 'New Feature Available',
        message: `Check out the new "${featureName}" feature!`,
        ...options,
      }),
    
    tip: (tip, options = {}) =>
      createNotification({
        type: NotificationTypes.TIP,
        title: '💡 Pro Tip',
        message: tip,
        ...options,
      }),
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    lastSynced,
    unreadNotifications: getUnreadNotifications,
    hasMore,
    soundEnabled,
    setSoundEnabled,

    // Actions
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    clearAll,
    clearRead,
    createNotification,
    refresh,
    loadMore,
    requestBrowserPermission,

    // Helpers
    getNotificationsByType,
    getRecentNotifications,
    hasUnreadOfType,

    // Predefined notifications
    notify,

    // Constants
    NotificationTypes,
    NotificationIcons,
    NotificationColors,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;