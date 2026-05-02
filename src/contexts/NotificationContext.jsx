import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection, query, where, orderBy, limit, onSnapshot,
  updateDoc, doc, deleteDoc, writeBatch, addDoc,
  serverTimestamp, getDocs, startAfter,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// ── Context ───────────────────────────────────────────────────────────────

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// ── Constants ─────────────────────────────────────────────────────────────

export const NotificationTypes = {
  SUCCESS: 'success', INFO: 'info', WARNING: 'warning', ERROR: 'error',
  RESUME_CREATED: 'resume_created', RESUME_UPDATED: 'resume_updated',
  RESUME_DELETED: 'resume_deleted', RESUME_DOWNLOADED: 'resume_downloaded',
  RESUME_DUPLICATED: 'resume_duplicated', ATS_SCORE_CHANGED: 'ats_score_changed',
  ATS_SCORE_MILESTONE: 'ats_score_milestone',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring', SUBSCRIPTION_RENEWED: 'subscription_renewed',
  PAYMENT_FAILED: 'payment_failed', NEW_FEATURE: 'new_feature',
  SYSTEM_MAINTENANCE: 'system_maintenance', SYSTEM: 'system',
  WELCOME: 'welcome', TIP: 'tip',
};

const NOTIFICATION_ICONS = {
  [NotificationTypes.SUCCESS]: '✅', [NotificationTypes.INFO]: 'ℹ️',
  [NotificationTypes.WARNING]: '⚠️', [NotificationTypes.ERROR]: '❌',
  [NotificationTypes.RESUME_CREATED]: '📄', [NotificationTypes.RESUME_UPDATED]: '📝',
  [NotificationTypes.RESUME_DELETED]: '🗑️', [NotificationTypes.RESUME_DOWNLOADED]: '📥',
  [NotificationTypes.RESUME_DUPLICATED]: '📋', [NotificationTypes.ATS_SCORE_CHANGED]: '📊',
  [NotificationTypes.ATS_SCORE_MILESTONE]: '🏆', [NotificationTypes.SUBSCRIPTION_EXPIRING]: '💳',
  [NotificationTypes.SUBSCRIPTION_RENEWED]: '✅', [NotificationTypes.PAYMENT_FAILED]: '❌',
  [NotificationTypes.NEW_FEATURE]: '🎉', [NotificationTypes.SYSTEM_MAINTENANCE]: '🔧',
  [NotificationTypes.SYSTEM]: '🔔', [NotificationTypes.WELCOME]: '👋', [NotificationTypes.TIP]: '💡',
};

const NOTIFICATION_COLORS = {
  [NotificationTypes.SUCCESS]: 'bg-green-50 border-green-200 text-green-800',
  [NotificationTypes.INFO]: 'bg-blue-50 border-blue-200 text-blue-800',
  [NotificationTypes.WARNING]: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  [NotificationTypes.ERROR]: 'bg-red-50 border-red-200 text-red-800',
};

const MAX_NOTIFICATIONS_PER_PAGE = 50;

// ── Utility Functions ────────────────────────────────────────────────────

const groupSimilarNotifications = (notifs) => {
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
};

// ── Provider ──────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('notification_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const audioRef = useRef(null);

  // ── Persist sound preference ──────────────────────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem('notification_sound', soundEnabled);
    } catch {}
  }, [soundEnabled]);

  // ── Cleanup audio ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ── Real-time Subscription ──────────────────────────────────────────

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
      limit(MAX_NOTIFICATIONS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const notificationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));

        const grouped = groupSimilarNotifications(notificationData);
        const sorted = grouped.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return b.createdAt - a.createdAt;
        });

        setNotifications(sorted);
        setUnreadCount(notificationData.filter((n) => !n.read).length);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === MAX_NOTIFICATIONS_PER_PAGE);
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

  // ── Load More ────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!user || !lastVisible || !hasMore || loading) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(MAX_NOTIFICATIONS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const newNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      setNotifications((prev) => {
        const all = [...prev, ...newNotifications];
        return groupSimilarNotifications(all);
      });
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === MAX_NOTIFICATIONS_PER_PAGE);
    } catch (err) {
      console.error('Error loading more notifications:', err);
    }
  }, [user, lastVisible, hasMore, loading]);

  // ── Browser Notifications ────────────────────────────────────────────

  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const showBrowserNotification = useCallback((title, options = {}) => {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/favicon.ico',
      silent: !soundEnabled,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      if (options.link) {
        window.open(options.link, '_blank');
      }
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  }, [soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // FIXED: Reuse audio element or create new one with cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {
        // Audio play failed silently (common on first interaction)
      });
    } catch {
      // Ignore audio errors entirely
    }
  }, [soundEnabled]);

  // ── Create Notification ──────────────────────────────────────────────

  const createNotification = useCallback(async ({
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
        icon: NOTIFICATION_ICONS[type] || '🔔',
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);

      if (showToast) {
        toast(message, { icon: NOTIFICATION_ICONS[type] || '🔔', duration: 5000 });
      }

      if (showBrowser) {
        showBrowserNotification(title, { body: message, tag: type, link });
      }

      if (playSound) {
        playNotificationSound();
      }

      return docRef.id;
    } catch (err) {
      console.error('Error creating notification:', err);
      return null;
    }
  }, [user, showBrowserNotification, playNotificationSound]);

  // ── Mark as Read ─────────────────────────────────────────────────────

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to update notification');
    }
  }, []);

  const markMultipleAsRead = useCallback(async (notificationIds) => {
    if (!notificationIds.length) return;
    try {
      const batch = writeBatch(db);
      notificationIds.forEach((id) => {
        batch.update(doc(db, 'notifications', id), { read: true, readAt: serverTimestamp() });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
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
    toast.success(`Marked ${unreadIds.length} as read`);
  }, [notifications, markMultipleAsRead]);

  // ── Delete Notifications ─────────────────────────────────────────────

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      toast.success('Notification removed');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  }, []);

  const deleteMultiple = useCallback(async (notificationIds) => {
    if (!notificationIds.length) return;
    try {
      const batch = writeBatch(db);
      notificationIds.forEach((id) => batch.delete(doc(db, 'notifications', id)));
      await batch.commit();
      toast.success(`Deleted ${notificationIds.length} notifications`);
    } catch (err) {
      console.error('Error deleting notifications:', err);
      toast.error('Failed to delete notifications');
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (!notifications.length) {
      toast('No notifications to clear');
      return;
    }
    // FIXED: Use toast confirmation instead of window.confirm
    const confirmed = window.confirm('Clear all notifications?');
    if (!confirmed) return;
    await deleteMultiple(notifications.map((n) => n.id));
  }, [notifications, deleteMultiple]);

  const clearRead = useCallback(async () => {
    const readIds = notifications.filter((n) => n.read).map((n) => n.id);
    if (!readIds.length) {
      toast('No read notifications');
      return;
    }
    await deleteMultiple(readIds);
  }, [notifications, deleteMultiple]);

  // ── Helpers ──────────────────────────────────────────────────────────

  const getNotificationsByType = useCallback((type) => {
    return notifications.filter((n) => n.type === type);
  }, [notifications]);

  const getUnreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const getRecentNotifications = useCallback((count = 5) => {
    return notifications.slice(0, count);
  }, [notifications]);

  const hasUnreadOfType = useCallback((type) => {
    return notifications.some((n) => n.type === type && !n.read);
  }, [notifications]);

  const refresh = useCallback(() => {
    setLastSynced(new Date());
  }, []);

  // ── Predefined Notification Creators ────────────────────────────────

  const notify = useMemo(() => ({
    success: (title, message, options) =>
      createNotification({ type: NotificationTypes.SUCCESS, title, message, ...options }),
    info: (title, message, options) =>
      createNotification({ type: NotificationTypes.INFO, title, message, ...options }),
    warning: (title, message, options) =>
      createNotification({ type: NotificationTypes.WARNING, title, message, ...options }),
    error: (title, message, options) =>
      createNotification({ type: NotificationTypes.ERROR, title, message, ...options }),
    welcome: (userName, options) =>
      createNotification({
        type: NotificationTypes.WELCOME,
        title: 'Welcome to ResumeAI Pro! 🎉',
        message: `Hi ${userName}! Let's create your first professional resume.`,
        ...options,
      }),
    resumeCreated: (resumeName, options) =>
      createNotification({
        type: NotificationTypes.RESUME_CREATED,
        title: 'Resume Created',
        message: `"${resumeName}" has been created successfully.`,
        ...options,
      }),
    resumeUpdated: (resumeName, options) =>
      createNotification({
        type: NotificationTypes.RESUME_UPDATED,
        title: 'Resume Updated',
        message: `"${resumeName}" has been updated.`,
        ...options,
      }),
    resumeDownloaded: (resumeName, options) =>
      createNotification({
        type: NotificationTypes.RESUME_DOWNLOADED,
        title: 'Resume Downloaded',
        message: `"${resumeName}" has been downloaded.`,
        ...options,
      }),
    atsScoreChanged: (resumeName, oldScore, newScore, options) =>
      createNotification({
        type: NotificationTypes.ATS_SCORE_CHANGED,
        title: 'ATS Score Updated',
        message: `"${resumeName}" score: ${oldScore}% → ${newScore}%`,
        ...options,
      }),
    atsScoreMilestone: (resumeName, score, options) =>
      createNotification({
        type: NotificationTypes.ATS_SCORE_MILESTONE,
        title: '🏆 ATS Milestone!',
        message: `"${resumeName}" reached ${score}%!`,
        ...options,
      }),
    subscriptionExpiring: (daysLeft, options) =>
      createNotification({
        type: NotificationTypes.SUBSCRIPTION_EXPIRING,
        title: 'Subscription Expiring',
        message: `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
        ...options,
      }),
    newFeature: (featureName, options) =>
      createNotification({
        type: NotificationTypes.NEW_FEATURE,
        title: 'New Feature!',
        message: `Check out "${featureName}"!`,
        ...options,
      }),
    tip: (tip, options) =>
      createNotification({
        type: NotificationTypes.TIP,
        title: '💡 Pro Tip',
        message: tip,
        ...options,
      }),
  }), [createNotification]);

  // ── Context Value ────────────────────────────────────────────────────

  const value = useMemo(() => ({
    notifications, unreadCount, loading, error, lastSynced,
    unreadNotifications: getUnreadNotifications, hasMore,
    soundEnabled, setSoundEnabled,
    markAsRead, markMultipleAsRead, markAllAsRead,
    deleteNotification, deleteMultiple, clearAll, clearRead,
    createNotification, refresh, loadMore, requestBrowserPermission,
    getNotificationsByType, getRecentNotifications, hasUnreadOfType,
    notify,
    NotificationTypes,
    NotificationIcons: NOTIFICATION_ICONS,
    NotificationColors: NOTIFICATION_COLORS,
  }), [
    notifications, unreadCount, loading, error, lastSynced,
    getUnreadNotifications, hasMore, soundEnabled,
    markAsRead, markMultipleAsRead, markAllAsRead,
    deleteNotification, deleteMultiple, clearAll, clearRead,
    createNotification, refresh, loadMore, requestBrowserPermission,
    getNotificationsByType, getRecentNotifications, hasUnreadOfType,
    notify,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;