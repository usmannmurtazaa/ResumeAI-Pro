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
  getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification types and their configurations
export const NotificationTypes = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  RESUME_UPDATED: 'resume_updated',
  RESUME_DOWNLOADED: 'resume_downloaded',
  ATS_SCORE_CHANGED: 'ats_score_changed',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  NEW_FEATURE: 'new_feature',
  SYSTEM: 'system'
};

// Notification icons mapping
const NotificationIcons = {
  [NotificationTypes.SUCCESS]: '✅',
  [NotificationTypes.INFO]: 'ℹ️',
  [NotificationTypes.WARNING]: '⚠️',
  [NotificationTypes.ERROR]: '❌',
  [NotificationTypes.RESUME_UPDATED]: '📝',
  [NotificationTypes.RESUME_DOWNLOADED]: '📥',
  [NotificationTypes.ATS_SCORE_CHANGED]: '📊',
  [NotificationTypes.SUBSCRIPTION_EXPIRING]: '💳',
  [NotificationTypes.NEW_FEATURE]: '🎉',
  [NotificationTypes.SYSTEM]: '🔔'
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  // Real-time notifications subscription
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

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notificationData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        
        // Sort by created date and read status
        const sorted = notificationData.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return b.createdAt - a.createdAt;
        });
        
        setNotifications(sorted);
        setUnreadCount(notificationData.filter(n => !n.read).length);
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

  // Request browser notification permission
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

  // Show browser notification
  const showBrowserNotification = useCallback((title, options = {}) => {
    if (!settings?.desktopNotifications) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/logo192.png',
        badge: '/favicon.ico',
        ...options
      });
    }
  }, [settings?.desktopNotifications]);

  // Create a new notification
  const createNotification = useCallback(async ({
    type = NotificationTypes.INFO,
    title,
    message,
    link = null,
    metadata = {},
    showToast = true,
    showBrowser = true
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
        icon: NotificationIcons[type] || '🔔'
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      
      // Show toast notification
      if (showToast) {
        toast(message, {
          icon: NotificationIcons[type] || '🔔',
          duration: 5000
        });
      }

      // Show browser notification
      if (showBrowser) {
        showBrowserNotification(title, {
          body: message,
          tag: type
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }, [user, showBrowserNotification]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { 
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  }, []);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(async (notificationIds) => {
    if (!notificationIds.length) return;

    try {
      const batch = writeBatch(db);
      notificationIds.forEach(id => {
        const notificationRef = doc(db, 'notifications', id);
        batch.update(notificationRef, { 
          read: true,
          readAt: serverTimestamp()
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) {
      toast('No unread notifications');
      return;
    }

    await markMultipleAsRead(unreadIds);
    toast.success(`Marked ${unreadIds.length} notifications as read`);
  }, [notifications, markMultipleAsRead]);

  // Delete a single notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      toast.success('Notification removed');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, []);

  // Delete multiple notifications
  const deleteMultiple = useCallback(async (notificationIds) => {
    if (!notificationIds.length) return;

    try {
      const batch = writeBatch(db);
      notificationIds.forEach(id => {
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

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!notifications.length) {
      toast('No notifications to clear');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to clear all notifications?');
    if (!confirmed) return;

    await deleteMultiple(notifications.map(n => n.id));
  }, [notifications, deleteMultiple]);

  // Clear read notifications
  const clearRead = useCallback(async () => {
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    if (!readIds.length) {
      toast('No read notifications to clear');
      return;
    }

    await deleteMultiple(readIds);
  }, [notifications, deleteMultiple]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  // Get recent notifications
  const getRecentNotifications = useCallback((count = 5) => {
    return notifications.slice(0, count);
  }, [notifications]);

  // Check if user has unread notifications of specific type
  const hasUnreadOfType = useCallback((type) => {
    return notifications.some(n => n.type === type && !n.read);
  }, [notifications]);

  // Refresh notifications manually
  const refresh = useCallback(() => {
    // The onSnapshot listener handles real-time updates
    // This is just a placeholder for manual refresh if needed
    setLastSynced(new Date());
  }, []);

  // Predefined notification creators
  const notify = {
    success: (title, message, options = {}) => 
      createNotification({ type: NotificationTypes.SUCCESS, title, message, ...options }),
    info: (title, message, options = {}) => 
      createNotification({ type: NotificationTypes.INFO, title, message, ...options }),
    warning: (title, message, options = {}) => 
      createNotification({ type: NotificationTypes.WARNING, title, message, ...options }),
    error: (title, message, options = {}) => 
      createNotification({ type: NotificationTypes.ERROR, title, message, ...options }),
    resumeUpdated: (resumeName, options = {}) => 
      createNotification({
        type: NotificationTypes.RESUME_UPDATED,
        title: 'Resume Updated',
        message: `"${resumeName}" has been updated successfully.`,
        ...options
      }),
    resumeDownloaded: (resumeName, options = {}) => 
      createNotification({
        type: NotificationTypes.RESUME_DOWNLOADED,
        title: 'Resume Downloaded',
        message: `"${resumeName}" has been downloaded.`,
        ...options
      }),
    atsScoreChanged: (resumeName, oldScore, newScore, options = {}) => 
      createNotification({
        type: NotificationTypes.ATS_SCORE_CHANGED,
        title: 'ATS Score Updated',
        message: `"${resumeName}" score changed from ${oldScore}% to ${newScore}%.`,
        ...options
      }),
    subscriptionExpiring: (daysLeft, options = {}) => 
      createNotification({
        type: NotificationTypes.SUBSCRIPTION_EXPIRING,
        title: 'Subscription Expiring Soon',
        message: `Your subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
        ...options
      }),
    newFeature: (featureName, options = {}) => 
      createNotification({
        type: NotificationTypes.NEW_FEATURE,
        title: 'New Feature Available',
        message: `Check out the new "${featureName}" feature!`,
        ...options
      })
  };

  const value = {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    lastSynced,
    unreadNotifications: getUnreadNotifications,
    
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
    requestBrowserPermission,
    
    // Helpers
    getNotificationsByType,
    getRecentNotifications,
    hasUnreadOfType,
    
    // Predefined notifications
    notify,
    
    // Constants
    NotificationTypes
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;