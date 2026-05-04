import { collection, addDoc, query, where, getDocs, orderBy, limit, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, logAnalyticsEvent as firebaseAnalyticsEvent } from './firebase';

// ── Constants ──────────────────────────────────────────────────────────────

const BATCH_INTERVAL = 30000;     // Send batched events every 30 seconds
const MAX_BATCH_SIZE = 50;        // Max events per Firestore batch write
const MAX_EVENTS_TO_FETCH = 200;  // Max events to retrieve per query

// Events that should be sampled (not every occurrence needs logging)
const SAMPLED_EVENTS = {
  page_view: 0.2,          // Log 20% of page views to Firestore
  scroll_depth: 0.1,       // Log 10% of scroll events
  input_focus: 0.05,       // Log 5% of input focus events
};

// Events that should NOT be written to Firestore at all (GA4 only)
const GA4_ONLY_EVENTS = [
  'scroll_depth',
  'input_focus',
  'button_hover',
  'tab_switch',
];

// ── Utility ────────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined';

const getTimestamp = () => {
  try {
    return serverTimestamp();
  } catch {
    return new Date().toISOString();
  }
};

// ── Event Queue ────────────────────────────────────────────────────────────

let eventQueue = [];
let batchTimer = null;

/**
 * Sends queued events to Firestore in a single batch write.
 */
const flushEventQueue = async () => {
  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    // Split into chunks of MAX_BATCH_SIZE (Firestore limit: 500 writes per batch)
    for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
      const chunk = batch.slice(i, i + MAX_BATCH_SIZE);
      const writeBatchOp = writeBatch(db);

      chunk.forEach((event) => {
        const docRef = doc(collection(db, 'analytics'));
        writeBatchOp.set(docRef, {
          ...event,
          timestamp: getTimestamp(),
        });
      });

      await writeBatchOp.commit();
    }
  } catch (error) {
    console.warn('Failed to flush analytics events:', error);
    // Re-queue failed events (up to a limit)
    eventQueue = [...batch.slice(0, MAX_BATCH_SIZE * 2), ...eventQueue];
  }
};

/**
 * Schedules a periodic flush of the event queue.
 */
const scheduleFlush = () => {
  if (!isBrowser) return;
  if (batchTimer) clearInterval(batchTimer);
  batchTimer = setInterval(flushEventQueue, BATCH_INTERVAL);

  // Also flush on page unload
  window.addEventListener('beforeunload', flushEventQueue);
};

// Start the flush scheduler immediately
scheduleFlush();

// ── Analytics Service ──────────────────────────────────────────────────────

export const analyticsService = {
  /**
   * Tracks an event.
   * - All events go to Google Analytics (free, aggregate).
   * - Only important events go to Firestore (costly, detailed).
   * - High-frequency events are sampled.
   *
   * @param {string} eventName - Event name (e.g., 'page_view', 'resume_created')
   * @param {object} eventData - Additional event data
   * @param {string} userId - Optional user ID
   */
  async trackEvent(eventName, eventData = {}, userId = null) {
    if (!isBrowser) return;

    // ── 1. Always send to Google Analytics (free) ──────────────────────

    try {
      firebaseAnalyticsEvent(eventName, {
        ...eventData,
        ...(userId ? { user_id: userId } : {}),
        page_path: window.location.pathname,
      });
    } catch (error) {
      // GA4 failure should never break the app
    }

    // ── 2. Only send important events to Firestore (costly) ────────────

    // Skip GA4-only events
    if (GA4_ONLY_EVENTS.includes(eventName)) return;

    // Apply sampling for high-frequency events
    const sampleRate = SAMPLED_EVENTS[eventName];
    if (sampleRate !== undefined && Math.random() > sampleRate) return;

    // Queue event for batch write
    eventQueue.push({
      name: eventName,
      data: eventData,
      userId: userId || null,
      url: window.location.pathname,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent?.substring(0, 200) || null, // Truncate
    });

    // Auto-flush on important events
    const IMPORTANT_EVENTS = ['resume_created', 'resume_downloaded', 'sign_up', 'login', 'subscription_changed', 'account_deleted'];
    if (IMPORTANT_EVENTS.includes(eventName)) {
      await flushEventQueue();
    }
  },

  /**
   * Tracks a page view event.
   */
  async trackPageView(pageName, userId = null) {
    return this.trackEvent('page_view', {
      page: pageName,
      page_title: isBrowser ? document.title : '',
      page_referrer: isBrowser ? document.referrer : '',
    }, userId);
  },

  /**
   * Tracks a resume-related event.
   */
  async trackResumeEvent(eventName, resumeId, userId = null) {
    return this.trackEvent(eventName, {
      resume_id: resumeId,
      event_category: 'resume',
    }, userId);
  },

  /**
   * Tracks a conversion event (higher priority, flushes immediately).
   */
  async trackConversion(eventName, eventData = {}, userId = null) {
    return this.trackEvent(eventName, {
      ...eventData,
      is_conversion: true,
      event_category: 'conversion',
    }, userId);
  },

  /**
   * Tracks an error event (flushes immediately for debugging).
   */
  async trackError(errorType, errorMessage, userId = null) {
    return this.trackEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage?.substring(0, 500),
      url: isBrowser ? window.location.href : '',
    }, userId);
  },

  /**
   * Retrieves analytics events for a user.
   *
   * @param {string} userId - User ID
   * @param {number} maxEvents - Maximum events to retrieve (default: 200)
   */
  async getUserEvents(userId, maxEvents = MAX_EVENTS_TO_FETCH) {
    try {
      const q = query(
        collection(db, 'analytics'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(Math.min(maxEvents, MAX_EVENTS_TO_FETCH))
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
      }));
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return [];
    }
  },

  /**
   * Retrieves aggregate stats for a user.
   */
  async getUserStats(userId) {
    try {
      // Only fetch a limited set for stats calculation
      const q = query(
        collection(db, 'analytics'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(MAX_EVENTS_TO_FETCH)
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => doc.data());

      const counts = {};
      events.forEach(e => {
        counts[e.name] = (counts[e.name] || 0) + 1;
      });

      return {
        totalEvents: events.length,
        pageViews: counts['page_view'] || 0,
        resumesCreated: counts['resume_created'] || 0,
        resumesDownloaded: counts['resume_downloaded'] || 0,
        resumesUpdated: counts['resume_updated'] || 0,
        conversions: events.filter(e => e.data?.is_conversion).length,
        lastActive: events[0]?.timestamp?.toDate?.()?.toISOString() || events[0]?.timestamp || null,
        eventBreakdown: counts,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalEvents: 0,
        pageViews: 0,
        resumesCreated: 0,
        resumesDownloaded: 0,
        resumesUpdated: 0,
        conversions: 0,
        lastActive: null,
        eventBreakdown: {},
      };
    }
  },

  /**
   * Forces an immediate flush of queued events.
   */
  async flush() {
    await flushEventQueue();
  },
};

export default analyticsService;