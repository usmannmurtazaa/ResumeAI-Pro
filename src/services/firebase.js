// Firebase services for Resume Ai Pro.
//
// ── Billing-plan notes ────────────────────────────────────────────────────
//
// This project is designed to run on Firebase's Spark (free) plan wherever
// technically possible.
//
//   • Firebase Auth        - available on Spark.
//   • Cloud Firestore      - available on Spark.
//   • Firebase Storage     - SDK is initialised here because both
//                            `authService.js` and `storageService.js`
//                            import `{ storage }` from this module. Actual
//                            Storage reads/writes require the Firebase
//                            project to have Storage enabled; if it is not
//                            enabled, the failure is a permission/quota
//                            error at upload time, not an import-time crash.
//   • Cloud Functions      - NOT imported here. Server-side logic lives in
//                            Netlify Functions (see `netlify/functions/`).
//
// If you later move away from Firebase Storage, remove the `firebase/storage`
// import below and delete the corresponding imports in `authService.js` and
// `storageService.js` at the same time.

import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserProperties,
} from 'firebase/analytics';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  disableNetwork,
  enableNetwork,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  waitForPendingWrites,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getPerformance, trace } from 'firebase/performance';
import { fetchAndActivate, getRemoteConfig } from 'firebase/remote-config';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
} from 'firebase/messaging';

// ── Environment Detection ─────────────────────────────────────────────────
const isBrowser = typeof window !== 'undefined';
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const analyticsEnabledByEnv = process.env.REACT_APP_ENABLE_ANALYTICS !== 'false';

// ── Required Environment Variables ───────────────────────────────────────
const REQUIRED_FIREBASE_ENV_VARS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

// ── Remote Config Defaults ───────────────────────────────────────────────
const REMOTE_CONFIG_DEFAULTS = {
  enable_new_features: false,
  maintenance_mode: false,
  min_app_version: '1.0.0',
  max_resumes_free: 5,
  enable_ai_suggestions: true,
  enable_job_matching: true,
  enable_collaboration: false,
  pricing_annual_discount: 20,
  enable_beta_features: false,
  enable_chat_support: true,
};

// ── Developer Logging ────────────────────────────────────────────────────
const logDev = (...args) => {
  if (isDevelopment) console.log(...args);
};
const warnDev = (...args) => {
  if (isDevelopment) console.warn(...args);
};
const errorDev = (...args) => {
  if (isDevelopment) console.error(...args);
};

// ── Configuration Validation ─────────────────────────────────────────────
const getMissingFirebaseEnvVars = () =>
  REQUIRED_FIREBASE_ENV_VARS.filter((key) => !process.env[key]);

/**
 * Validates that all required Firebase environment variables are present.
 * In production, missing variables will throw an error to prevent a broken deployment.
 * In development, a warning is logged to the console.
 */
const validateConfig = () => {
  const missing = getMissingFirebaseEnvVars();
  if (missing.length === 0) return true;
  const message = `Missing required Firebase environment variables: ${missing.join(', ')}`;
  if (isProduction) throw new Error(message);
  console.error(message);
  return false;
};

// ── Firebase Config ──────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// ── Firebase Initialization ──────────────────────────────────────────────
const initializeFirebase = () => {
  validateConfig();
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
};

export const app = initializeFirebase();

// ── Auth ──────────────────────────────────────────────────────────────────
// Firebase Web SDK v9+ uses browserLocalPersistence by default.
// Persistence is explicitly set only in AuthContext.login() when
// the user opts out of "remember me" (switching to session persistence).
export const auth = getAuth(app);

// ── Firestore ────────────────────────────────────────────────────────────
// Persistent cache is capped at 50 MB to avoid unbounded IndexedDB growth
// on long-lived devices. Firestore automatically evicts the oldest entries
// when the cap is reached, so this does not affect correctness.
const FIRESTORE_CACHE_BYTES = 50 * 1024 * 1024; // 50 MB
let firestoreCacheMode = 'memory';

/**
 * Creates a Firestore instance with the best available caching strategy.
 * Attempts persistent cache first; falls back to memory cache.
 */
const createFirestore = () => {
  if (!isBrowser) {
    return initializeFirestore(app, { localCache: memoryLocalCache() });
  }

  try {
    const browserCache = persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: FIRESTORE_CACHE_BYTES,
    });
    firestoreCacheMode = 'persistent';
    return initializeFirestore(app, { localCache: browserCache });
  } catch (error) {
    warnDev('Persistent Firestore cache unavailable (private browsing?).', error);
    firestoreCacheMode = 'memory';

    try {
      return initializeFirestore(app, { localCache: memoryLocalCache() });
    } catch {
      // If already initialized by the persistent attempt, fall back to getFirestore
      return getFirestore(app);
    }
  }
};

export const db = createFirestore();

// ── Storage ──────────────────────────────────────────────────────────────
// Firebase Storage is used by `authService.js` (profile images) and
// `storageService.js` (resume PDFs, avatars, generic files). The instance
// below must be exported so those modules' `import { storage } from
// './firebase'` resolves to a real SDK instance instead of `undefined`.
//
// `getStorage(app)` is a synchronous SDK instance creation and performs no
// network I/O, so this line is safe even on a project where the Storage
// backend has not yet been provisioned - failures surface later, at the
// first upload attempt, as permission/quota errors.
export const storage = getStorage(app);

// ── App Check (Production Only) ──────────────────────────────────────────
export let appCheck = null;
if (isBrowser && isProduction && process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    logDev('Firebase App Check initialized.');
  } catch (error) {
    warnDev('App Check initialization failed.', error);
  }
}

// ── Optional Services ────────────────────────────────────────────────────
export let analytics = null;
export let performance = null;
export let remoteConfig = null;
export let messaging = null;

// ── Analytics Event Queue ────────────────────────────────────────────────
const MAX_QUEUED_EVENTS = 50;
const pendingAnalyticsEvents = [];

/**
 * Flushes all queued analytics events now that analytics is ready.
 * Called once after analytics initialization succeeds.
 */
const flushAnalyticsQueue = () => {
  if (!analytics || pendingAnalyticsEvents.length === 0) return;
  logDev(`Flushing ${pendingAnalyticsEvents.length} queued analytics events.`);

  // Process and clear the queue in one pass
  const eventsToSend = pendingAnalyticsEvents.splice(0, pendingAnalyticsEvents.length);
  eventsToSend.forEach((event) => {
    try {
      logEvent(analytics, event.name, event.params);
    } catch (error) {
      warnDev('Failed to send queued analytics event:', error);
    }
  });
};

// ── Service Initializers ─────────────────────────────────────────────────

const initializeAnalytics = async () => {
  if (!isBrowser || !analyticsEnabledByEnv) return null;
  try {
    const supported = await isAnalyticsSupported();
    if (!supported) {
      logDev('Analytics not supported.');
      return null;
    }
    analytics = getAnalytics(app);
    setAnalyticsCollectionEnabled(analytics, isProduction);
    setUserProperties(analytics, {
      app_version: process.env.REACT_APP_VERSION || '2.5.0',
      environment: process.env.NODE_ENV || 'development',
      platform: 'web',
    });
    flushAnalyticsQueue();
    logDev('Analytics initialized.');
    return analytics;
  } catch (error) {
    warnDev('Analytics init failed.', error);
    return null;
  }
};

const initializePerformance = () => {
  if (!isBrowser) return null;
  try {
    performance = getPerformance(app);
    if (isDevelopment) {
      performance.dataCollectionEnabled = false;
    }
    logDev('Performance initialized.');
    return performance;
  } catch (error) {
    warnDev('Performance not supported.', error);
    return null;
  }
};

const initializeRemoteConfigService = () => {
  if (!isBrowser) return null;
  try {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings = {
      minimumFetchIntervalMillis: isProduction ? 3600000 : 60000,
      fetchTimeoutMillis: 60000,
    };
    remoteConfig.defaultConfig = REMOTE_CONFIG_DEFAULTS;
    logDev('Remote Config initialized.');
    return remoteConfig;
  } catch (error) {
    warnDev('Remote Config init failed.', error);
    return null;
  }
};

const initializeMessaging = async () => {
  if (!isBrowser || !('serviceWorker' in navigator) || !('Notification' in window)) return null;
  try {
    const supported = await isMessagingSupported();
    if (!supported) {
      logDev('Messaging not supported.');
      return null;
    }
    messaging = getMessaging(app);
    logDev('Messaging initialized.');
    return messaging;
  } catch (error) {
    warnDev('Messaging init failed.', error);
    return null;
  }
};

if (isBrowser) {
  initializeAnalytics();
  initializePerformance();
  initializeRemoteConfigService();
  initializeMessaging();
}

// ── Emulator Support ─────────────────────────────────────────────────────
// Only Auth and Firestore emulators are supported on Spark plan.
const useEmulators = isDevelopment && process.env.REACT_APP_USE_EMULATORS === 'true';
if (useEmulators) {
  const host = (svc) => process.env[`REACT_APP_FIREBASE_${svc}_EMULATOR_HOST`] || '127.0.0.1';
  try {
    connectAuthEmulator(
      auth,
      `http://${host('AUTH')}:${process.env.REACT_APP_FIREBASE_AUTH_EMULATOR_PORT || 9099}`,
      { disableWarnings: true }
    );
    connectFirestoreEmulator(
      db,
      host('FIRESTORE'),
      Number(process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_PORT || 8080)
    );
    console.log('🔧 Firebase Emulators Connected (Auth + Firestore only)');
  } catch (error) {
    errorDev('Emulator connection failed.', error);
  }
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Indicates whether Firestore is using persistent offline cache.
 */
export const isOfflinePersistenceEnabled = () => firestoreCacheMode === 'persistent';

/**
 * Disables the Firestore network, switching to offline mode.
 */
export const goOffline = async () => {
  try {
    await disableNetwork(db);
    return true;
  } catch (e) {
    console.error('goOffline failed:', e);
    return false;
  }
};

/**
 * Enables the Firestore network and waits for pending writes.
 */
export const goOnline = async () => {
  try {
    await enableNetwork(db);
    await waitForPendingWrites(db);
    return true;
  } catch (e) {
    console.error('goOnline failed:', e);
    return false;
  }
};

/**
 * Fetches and activates Remote Config values from the server.
 */
export const fetchRemoteConfig = async () => {
  if (!remoteConfig) return null;
  try {
    await fetchAndActivate(remoteConfig);
    return remoteConfig;
  } catch (e) {
    console.error('fetchRemoteConfig failed:', e);
    return null;
  }
};

export const getRemoteConfigValue = (key) => remoteConfig?.getValue(key) ?? null;
export const getRemoteConfigBoolean = (key) => getRemoteConfigValue(key)?.asBoolean() ?? null;
export const getRemoteConfigString = (key) => getRemoteConfigValue(key)?.asString() ?? null;
export const getRemoteConfigNumber = (key) => getRemoteConfigValue(key)?.asNumber() ?? null;
export const getAllRemoteConfig = () => remoteConfig?.getAll() ?? {};

/**
 * Requests push notification permission and returns the device token.
 */
export const requestNotificationPermission = async () => {
  if (!messaging || !process.env.REACT_APP_FIREBASE_VAPID_KEY) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    return await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });
  } catch (e) {
    console.error('requestNotificationPermission failed:', e);
    return null;
  }
};

export const deleteNotificationToken = async () => {
  if (!messaging) return false;
  try {
    await deleteToken(messaging);
    return true;
  } catch (e) {
    console.error('deleteNotificationToken failed:', e);
    return false;
  }
};

export const onMessageListener = (callback) => {
  if (!messaging) {
    warnDev('onMessageListener: messaging not initialized.');
    return () => {};
  }
  return onMessage(messaging, callback);
};

/**
 * Logs an analytics event. If analytics is not yet initialized, the event
 * is queued and flushed once initialization completes.
 *
 * @param {string} eventName - The name of the event to log.
 * @param {Object} [eventParams={}] - Additional parameters for the event.
 * @returns {boolean} Whether the event was immediately sent.
 */
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  const params = {
    ...eventParams,
    ...(isBrowser && !('page_path' in eventParams) ? { page_path: window.location.pathname } : {}),
  };

  if (!analytics) {
    if (pendingAnalyticsEvents.length < MAX_QUEUED_EVENTS) {
      pendingAnalyticsEvents.push({ name: eventName, params });
    } else if (isDevelopment) {
      warnDev(`Analytics queue full. Dropping: ${eventName}`);
    }
    return false;
  }

  logEvent(analytics, eventName, params);
  return true;
};

export const startTrace = async (traceName) => {
  if (!performance) return null;
  try {
    const t = trace(performance, traceName);
    t.start();
    return t;
  } catch (e) {
    console.error('startTrace failed:', e);
    return null;
  }
};

export const stopTrace = async (t) => {
  if (!t) return false;
  try {
    t.stop();
    return true;
  } catch (e) {
    console.error('stopTrace failed:', e);
    return false;
  }
};

export const isFirebaseInitialized = () => getApps().length > 0;

/**
 * Returns a health report of all Firebase services.
 */
export const checkFirebaseHealth = async () => ({
  app: Boolean(app),
  auth: Boolean(auth),
  firestore: Boolean(db),
  storage: Boolean(storage),
  analytics: Boolean(analytics),
  performance: Boolean(performance),
  remoteConfig: Boolean(remoteConfig),
  messaging: Boolean(messaging),
  appCheck: Boolean(appCheck),
});

// ── Unified Export ───────────────────────────────────────────────────────
const firebaseServices = {
  get app() {
    return app;
  },
  get auth() {
    return auth;
  },
  get db() {
    return db;
  },
  get storage() {
    return storage;
  },
  get analytics() {
    return analytics;
  },
  get performance() {
    return performance;
  },
  get remoteConfig() {
    return remoteConfig;
  },
  get messaging() {
    return messaging;
  },
  get appCheck() {
    return appCheck;
  },
};

export default firebaseServices;
