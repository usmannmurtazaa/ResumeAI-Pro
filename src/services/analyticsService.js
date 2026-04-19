import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export const analyticsService = {
  async trackEvent(eventName, eventData, userId = null) {
    try {
      const event = {
        name: eventName,
        data: eventData,
        userId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      await addDoc(collection(db, 'analytics'), event);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  },

  async trackPageView(pageName, userId = null) {
    return this.trackEvent('page_view', { page: pageName }, userId);
  },

  async trackResumeEvent(eventName, resumeId, userId) {
    return this.trackEvent(eventName, { resumeId }, userId);
  },

  async getAnalytics(userId, period = '7d') {
    try {
      const q = query(
        collection(db, 'analytics'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }
  },

  async getStats(userId) {
    const analytics = await this.getAnalytics(userId);
    
    return {
      totalEvents: analytics.length,
      pageViews: analytics.filter(e => e.name === 'page_view').length,
      resumesCreated: analytics.filter(e => e.name === 'resume_created').length,
      resumesDownloaded: analytics.filter(e => e.name === 'resume_downloaded').length,
      lastActive: analytics[0]?.timestamp || null
    };
  }
};