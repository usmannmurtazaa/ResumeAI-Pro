import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

import { app, db, logAnalyticsEvent as firebaseAnalyticsEvent } from './firebase';

// ── Constants ──────────────────────────────────────────────────────────────

const BATCH_INTERVAL = 30000; // Send batched events every 30 seconds
const MAX_BATCH_SIZE = 50; // Max events per Firestore batch write
const MAX_EVENTS_TO_FETCH = 200; // Max events to retrieve per query

// Hard upper bound on the number of events buffered in memory at any time.
// Each queued event is ~500 bytes (name, data, userId, url, referrer,
// userAgent), so 500 events is roughly 250 KB. This is a comfortable buffer
// for a temporarily-failing backend and a hard ceiling for a persistently-
// failing one. When the queue is at capacity, the OLDEST event is dropped
// first — recent events are more likely to be actionable for debugging, and
// the same policy is applied when re-queuing after a failed flush.
const MAX_QUEUE_LENGTH = 500;

// Minimum interval between "queue at capacity" warnings. Prevents console
// spam when the queue is persistently full during an outage.
const QUEUE_OVERFLOW_WARN_INTERVAL_MS = 60_000;

// Bounded window for the best-effort flush that runs when the page is
// hidden or being unloaded. Browsers give async work in these handlers only
// a short window before they may tear down the tab; 500 ms is short enough
// to fit inside that window on every browser we support, and long enough
// for a normal Firestore commit to settle. On timeout, the write continues
// in the background; if the browser discards the tab first, those events
// are lost, which is the best achievable without a server-side beacon
// (see H-28 Option A, deliberately not taken here).
const PAGE_HIDE_TIMEOUT_MS = 500;

// Events that should be sampled (not every occurrence needs logging)
const SAMPLED_EVENTS = {
  page_view: 0.2, // Log 20% of page views to Firestore
  scroll_depth: 0.1, // Log 10% of scroll events
  input_focus: 0.05, // Log 5% of input focus events
};

// Events that should NOT be written to Firestore at all (GA4 only)
const GA4_ONLY_EVENTS = ['scroll_depth', 'input_focus', 'button_hover', 'tab_switch'];

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
let lastQueueOverflowWarnAt = 0;
// Guards against `pagehide` and `visibilitychange:hidden` both firing for
// the same teardown (common on desktop: background the tab, then close it).
let isPageHideFlushInFlight = false;

/**
 * Emits a console warning that the queue has hit its capacity. Throttled to
 * at most once per QUEUE_OVERFLOW_WARN_INTERVAL_MS so a persistent write
 * outage does not flood the console.
 */
const warnQueueOverflow = () => {
  const now = Date.now();
  if (now - lastQueueOverflowWarnAt < QUEUE_OVERFLOW_WARN_INTERVAL_MS) return;
  lastQueueOverflowWarnAt = now;
  console.warn(
    `Analytics queue at capacity (${MAX_QUEUE_LENGTH}); dropping oldest events until it drains.`
  );
};

/**
 * Appends an event to the in-memory queue while respecting
 * MAX_QUEUE_LENGTH. When the queue is full, the oldest event is dropped
 * first. This bounds memory during a persistent Firestore write outage.
 */
const enqueueEvent = (event) => {
  if (eventQueue.length >= MAX_QUEUE_LENGTH) {
    eventQueue.shift();
    warnQueueOverflow();
  }
  eventQueue.push(event);
};

/**
 * Re-queues events after a failed flush. The failed batch and any events
 * that arrived during the flush are concatenated in chronological order,
 * then trimmed to MAX_QUEUE_LENGTH by dropping the oldest first. This
 * preserves the most recent context for debugging and keeps the queue
 * bounded even when the flush fails while new events keep arriving.
 */
const requeueFailedEvents = (failedBatch) => {
  const combined = [...failedBatch, ...eventQueue];
  eventQueue = combined.length > MAX_QUEUE_LENGTH ? combined.slice(-MAX_QUEUE_LENGTH) : combined;
};

/**
 * Writes a batch of events to Firestore, chunked to respect the 500-write
 * per-batch limit. Shared by the periodic flush and the page-hide flush so
 * the chunking logic exists in exactly one place.
 *
 * Rejects if any chunk's `commit()` rejects; the caller decides how to
 * handle the failure (re-queue for the periodic flush, swallow for the
 * page-hide flush).
 */
const writeBatches = async (batch) => {
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
};

/**
 * Periodic flush. Snapshots the queue, drains it, writes in chunks, and
 * re-queues on failure so the events are retried on the next interval.
 */
const flushEventQueue = async () => {
  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    await writeBatches(batch);
  } catch (error) {
    console.warn('Failed to flush analytics events:', error);
    // Re-queue failed events, respecting the total MAX_QUEUE_LENGTH cap.
    // The oldest events are dropped first when the combined size exceeds
    // the cap, matching the enqueue policy.
    requeueFailedEvents(batch);
  }
};

/**
 * Best-effort flush triggered when the page is hidden or being unloaded.
 *
 * Differences from `flushEventQueue`:
 *   • The write is raced against PAGE_HIDE_TIMEOUT_MS so a hung Firestore
 *     call cannot keep the handler waiting past the browser's teardown
 *     window.
 *   • On failure the events are NOT re-queued. During teardown, either the
 *     tab is closing (module state is about to be freed) or the write
 *     already succeeded. Re-queueing would only complicate the state
 *     machine and delay teardown.
 *   • Guarded by `isPageHideFlushInFlight` so `pagehide` and
 *     `visibilitychange:hidden` do not both issue a write for the same
 *     drained queue.
 *
 * The function is synchronous from the caller's perspective: it starts
 * the write and returns immediately. The write promise continues in the
 * background until either it settles or the page is discarded.
 */
const flushForPageHide = () => {
  if (isPageHideFlushInFlight) return;
  if (eventQueue.length === 0) return;

  isPageHideFlushInFlight = true;

  const batch = [...eventQueue];
  eventQueue = [];

  const writePromise = (async () => {
    try {
      await writeBatches(batch);
    } catch (error) {
      // Best-effort path — do not re-queue, do not surface to the user.
      // A dev-only log keeps the failure visible during development
      // without spamming production consoles.
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics flush during page hide failed:', error);
      }
    } finally {
      // Release the guard when the write itself settles — not when the
      // race resolves. The race may resolve on the timeout while the
      // write is still in flight; the write is responsible for clearing
      // the flag so a subsequent page-hide (bfcache restore followed by
      // another hide) is not silently suppressed.
      isPageHideFlushInFlight = false;
    }
  })();

  // Attach a no-op rejection handler so an unexpected rejection does not
  // surface as an unhandled promise rejection in the browser console.
  writePromise.catch(() => {});

  // Race against a short timeout. The race's only purpose is to avoid
  // holding a reference to a hung promise for longer than necessary; the
  // write itself is not cancelled by losing the race.
  Promise.race([
    writePromise,
    new Promise((resolve) => setTimeout(resolve, PAGE_HIDE_TIMEOUT_MS)),
  ]).catch(() => {});
};

/**
 * Schedules the periodic flush and wires the teardown flush.
 *
 * Event choice:
 *   • `pagehide` fires on navigation, tab close, and bfcache entry, in
 *     every browser we support. It is the modern replacement for
 *     `beforeunload`, which is unreliable across browsers (notably not
 *     fired on mobile Safari) and provides no guarantee that async work
 *     will complete.
 *   • `visibilitychange:hidden` fires when the tab is backgrounded. On
 *     desktop, a backgrounded tab may be closed later without a reliable
 *     `pagehide` before teardown; catching the hide gives the flush a
 *     chance to run while the tab is still alive.
 *
 * The two events overlap on desktop ("background, then close"), so
 * `flushForPageHide` is guarded by `isPageHideFlushInFlight`.
 */
const scheduleFlush = () => {
  if (!isBrowser) return;
  if (batchTimer) clearInterval(batchTimer);
  batchTimer = setInterval(flushEventQueue, BATCH_INTERVAL);

  window.addEventListener('pagehide', flushForPageHide);

  // Anonymous listener: `scheduleFlush` is invoked once at module load and
  // the listener lives for the page's lifetime, so there is no meaningful
  // cleanup point. The listener holds no external references.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushForPageHide();
  });
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

    const resolvedUserId = userId || getAuth(app).currentUser?.uid;
    if (!resolvedUserId) return;

    // Apply sampling for high-frequency events
    const sampleRate = SAMPLED_EVENTS[eventName];
    if (sampleRate !== undefined && Math.random() > sampleRate) return;

    // Queue event for batch write. `enqueueEvent` enforces MAX_QUEUE_LENGTH,
    // dropping the oldest event when the queue is at capacity. The GA4
    // emit above already happened, so overflow only affects the Firestore
    // side of the pipeline.
    enqueueEvent({
      name: eventName,
      data: eventData,
      userId: resolvedUserId,
      url: window.location.pathname,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent?.substring(0, 200) || null, // Truncate
    });

    // Auto-flush on important events
    const IMPORTANT_EVENTS = [
      'resume_created',
      'resume_downloaded',
      'sign_up',
      'login',
      'subscription_changed',
      'account_deleted',
    ];
    if (IMPORTANT_EVENTS.includes(eventName)) {
      await flushEventQueue();
    }
  },

  /**
   * Tracks a page view event.
   */
  async trackPageView(pageName, userId = null) {
    return this.trackEvent(
      'page_view',
      {
        page: pageName,
        page_title: isBrowser ? document.title : '',
        page_referrer: isBrowser ? document.referrer : '',
      },
      userId
    );
  },

  /**
   * Tracks a resume-related event.
   */
  async trackResumeEvent(eventName, resumeId, userId = null) {
    return this.trackEvent(
      eventName,
      {
        resume_id: resumeId,
        event_category: 'resume',
      },
      userId
    );
  },

  /**
   * Tracks a conversion event (higher priority, flushes immediately).
   */
  async trackConversion(eventName, eventData = {}, userId = null) {
    return this.trackEvent(
      eventName,
      {
        ...eventData,
        is_conversion: true,
        event_category: 'conversion',
      },
      userId
    );
  },

  /**
   * Tracks an error event (flushes immediately for debugging).
   */
  async trackError(errorType, errorMessage, userId = null) {
    return this.trackEvent(
      'app_error',
      {
        error_type: errorType,
        error_message: errorMessage?.substring(0, 500),
        url: isBrowser ? window.location.href : '',
      },
      userId
    );
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
      return snapshot.docs.map((doc) => ({
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
      const events = snapshot.docs.map((doc) => doc.data());

      const counts = {};
      events.forEach((e) => {
        counts[e.name] = (counts[e.name] || 0) + 1;
      });

      return {
        totalEvents: events.length,
        pageViews: counts['page_view'] || 0,
        resumesCreated: counts['resume_created'] || 0,
        resumesDownloaded: counts['resume_downloaded'] || 0,
        resumesUpdated: counts['resume_updated'] || 0,
        conversions: events.filter((e) => e.data?.is_conversion).length,
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
