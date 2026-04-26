import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserProperties,
} from 'firebase/analytics';
import {
  EmailAuthProvider,
  FacebookAuthProvider,
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  inMemoryPersistence,
  OAuthProvider,
  PhoneAuthProvider,
  setPersistence,
  TwitterAuthProvider, // ⚠️ Deprecated: Twitter OAuth 1.0a being phased out (2024)
  browserLocalPersistence,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  CACHE_SIZE_UNLIMITED,
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
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from 'firebase/functions';
import { getPerformance, trace } from 'firebase/performance';
import {
  fetchAndActivate,
  getRemoteConfig,
  // NOTE: getValue and getAll do NOT exist as standalone exports in v9 modular.
  // They are instance methods on the RemoteConfig object:
  //   remoteConfig.getValue(key) → { asBoolean(), asString(), asNumber() }
  //   remoteConfig.getAll()       → Record<string, Value>
} from 'firebase/remote-config';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
} from 'firebase/messaging';
import {
  connectStorageEmulator,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';

// ── Environment Detection ───────────────────────────────────────────────────
const isBrowser = typeof window !== 'undefined';
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const functionsRegion = process.env.REACT_APP_FIREBASE_FUNCTIONS_REGION || 'us-central1';

// Analytics is enabled by default unless explicitly set to "false"
const analyticsEnabledByEnv = process.env.REACT_APP_ENABLE_ANALYTICS !== 'false';

// ── Required Environment Variables ─────────────────────────────────────────
const REQUIRED_FIREBASE_ENV_VARS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

// ── Remote Config Defaults ─────────────────────────────────────────────────
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

// ── Developer Logging ──────────────────────────────────────────────────────
const logDev = (...args) => {
  if (isDevelopment) console.log(...args);
};

const warnDev = (...args) => {
  if (isDevelopment) console.warn(...args);
};

const errorDev = (...args) => {
  if (isDevelopment) console.error(...args);
};

// ── Configuration Validation ───────────────────────────────────────────────
const getMissingFirebaseEnvVars = () =>
  REQUIRED_FIREBASE_ENV_VARS.filter((key) => !process.env[key]);

const validateConfig = () => {
  const missing = getMissingFirebaseEnvVars();

  if (missing.length === 0) return true;

  const message = `Missing required Firebase environment variables: ${missing.join(', ')}`;

  if (isProduction) {
    throw new Error(message);
  }

  console.error(message);
  return false;
};

// ── Firebase Config ────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// ── Firebase UI Configuration ──────────────────────────────────────────────
export const firebaseUIConfig = {
  signInFlow: 'popup',
  signInOptions: [
    {
      provider: GoogleAuthProvider.PROVIDER_ID,
      scopes: ['profile', 'email'],
      customParameters: { prompt: 'select_account' },
    },
    {
      provider: GithubAuthProvider.PROVIDER_ID,
      scopes: ['user:email', 'read:user'],
    },
    {
      provider: TwitterAuthProvider.PROVIDER_ID,
      // ⚠️ Twitter v1.1 API / OAuth 1.0a deprecated as of 2024.
      // Consider migrating to OAuth 2.0 via custom OAuthProvider.
    },
    {
      provider: FacebookAuthProvider.PROVIDER_ID,
      scopes: ['email', 'public_profile'],
    },
    {
      provider: EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: true,
      signInMethod: 'password',
    },
    {
      provider: PhoneAuthProvider.PROVIDER_ID,
      defaultCountry: 'US',
    },
  ],
  tosUrl: '/terms',
  privacyPolicyUrl: '/privacy',
  siteName: 'ResumeAI Pro',
};

// ── Firebase Initialization ────────────────────────────────────────────────
const initializeFirebase = () => {
  validateConfig();

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};

export const app = initializeFirebase();

// ── Auth ───────────────────────────────────────────────────────────────────
export const auth = getAuth(app);

const initializeAuthPersistence = async () => {
  if (!isBrowser) return;

  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    warnDev('browserLocalPersistence failed. Falling back to in-memory persistence.', error);
    try {
      await setPersistence(auth, inMemoryPersistence);
    } catch (fallbackError) {
      errorDev('All auth persistence methods failed. Auth state will not persist.', fallbackError);
    }
  }
};

// Fire-and-forget: runs in background. Auth state listeners will
// re-fire once persistence is established. This is expected Firebase behavior.
void initializeAuthPersistence();

// ── Auth Providers ─────────────────────────────────────────────────────────
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');
githubProvider.addScope('read:user');

export const twitterProvider = new TwitterAuthProvider();

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('User.Read');
microsoftProvider.addScope('email');

export const phoneProvider = new PhoneAuthProvider(auth);

// ── Firestore ──────────────────────────────────────────────────────────────
let firestoreCacheMode = 'memory';

const createFirestore = () => {
  if (!isBrowser) {
    return initializeFirestore(app, { localCache: memoryLocalCache() });
  }

  try {
    const browserCache = persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    });

    firestoreCacheMode = 'persistent';
    return initializeFirestore(app, { localCache: browserCache });
  } catch (error) {
    warnDev(
      'Persistent Firestore cache unavailable (likely private browsing). Using default cache.',
      error
    );
    firestoreCacheMode = 'memory';
    return getFirestore(app);
  }
};

export const db = createFirestore();
export const storage = getStorage(app);
export const functions = getFunctions(app, functionsRegion);

// ── App Check (Production Only) ────────────────────────────────────────────
export let appCheck = null;

if (isBrowser && isProduction && process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    logDev('Firebase App Check initialized.');
  } catch (error) {
    warnDev('App Check initialization failed. Requests may be unverified.', error);
  }
}

// ── Optional Services (Lazy Initialized) ───────────────────────────────────
export let analytics = null;
export let performance = null;
export let remoteConfig = null;
export let messaging = null;

// ── Analytics Event Queue ──────────────────────────────────────────────────
const MAX_QUEUED_EVENTS = 50;
const pendingAnalyticsEvents = [];
let analyticsReadyPromise = Promise.resolve(null);
let messagingReadyPromise = Promise.resolve(null);

const flushAnalyticsQueue = () => {
  if (!analytics || pendingAnalyticsEvents.length === 0) return;

  logDev(`Flushing ${pendingAnalyticsEvents.length} queued analytics events.`);

  while (pendingAnalyticsEvents.length > 0) {
    const nextEvent = pendingAnalyticsEvents.shift();
    if (!nextEvent) continue;

    try {
      logEvent(analytics, nextEvent.name, nextEvent.params);
    } catch (error) {
      warnDev('Failed to send queued analytics event:', error);
    }
  }
};

// ── Service Initializers ───────────────────────────────────────────────────

const initializeAnalytics = async () => {
  if (!isBrowser || !analyticsEnabledByEnv) return null;

  try {
    const supported = await isAnalyticsSupported();
    if (!supported) {
      logDev('Analytics not supported in this browser.');
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
    logDev('Firebase Analytics initialized.');
    return analytics;
  } catch (error) {
    warnDev('Analytics initialization failed.', error);
    return null;
  }
};

const initializePerformance = () => {
  if (!isBrowser) return null;

  try {
    performance = getPerformance(app);
    logDev('Firebase Performance initialized.');
    return performance;
  } catch (error) {
    warnDev('Performance monitoring not supported in this environment.', error);
    return null;
  }
};

const initializeRemoteConfigService = () => {
  if (!isBrowser) return null;

  try {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings = {
      minimumFetchIntervalMillis: isProduction ? 3_600_000 : 60_000,
      fetchTimeoutMillis: 60_000,
    };
    remoteConfig.defaultConfig = REMOTE_CONFIG_DEFAULTS;
    logDev('Firebase Remote Config initialized.');
    return remoteConfig;
  } catch (error) {
    warnDev('Remote Config initialization failed.', error);
    return null;
  }
};

const initializeMessaging = async () => {
  if (!isBrowser || !('serviceWorker' in navigator) || !('Notification' in window)) {
    return null;
  }

  try {
    const supported = await isMessagingSupported();
    if (!supported) {
      logDev('Messaging not supported in this browser.');
      return null;
    }

    messaging = getMessaging(app);
    logDev('Firebase Messaging initialized.');
    return messaging;
  } catch (error) {
    warnDev('Messaging initialization failed.', error);
    return null;
  }
};

// Kick off optional service initialization (non-blocking)
if (isBrowser) {
  analyticsReadyPromise = initializeAnalytics();
  initializePerformance();
  initializeRemoteConfigService();
  messagingReadyPromise = initializeMessaging();
}

// ── Emulator Support (Development Only) ────────────────────────────────────
const useEmulators = isDevelopment && process.env.REACT_APP_USE_EMULATORS === 'true';

if (useEmulators) {
  const emulatorHost = (service) =>
    process.env[`REACT_APP_FIREBASE_${service}_EMULATOR_HOST`] || '127.0.0.1';

  const authHost = emulatorHost('AUTH');
  const authPort = Number(process.env.REACT_APP_FIREBASE_AUTH_EMULATOR_PORT || 9099);
  const firestoreHost = emulatorHost('FIRESTORE');
  const firestorePort = Number(process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_PORT || 8080);
  const storageHost = emulatorHost('STORAGE');
  const storagePort = Number(process.env.REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT || 9199);
  const functionsHost = emulatorHost('FUNCTIONS');
  const functionsPort = Number(process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001);

  try {
    connectAuthEmulator(auth, `http://${authHost}:${authPort}`, { disableWarnings: true });
    connectFirestoreEmulator(db, firestoreHost, firestorePort);
    connectStorageEmulator(storage, storageHost, storagePort);
    connectFunctionsEmulator(functions, functionsHost, functionsPort);

    console.log(
      '%c🔧 Firebase Emulators Connected %c| %cAuth:%s %cFirestore:%s %cStorage:%s %cFunctions:%s',
      'font-weight:bold;', '',
      'color:#9333ea;', `${authHost}:${authPort}`,
      'color:#2563eb;', `${firestoreHost}:${firestorePort}`,
      'color:#059669;', `${storageHost}:${storagePort}`,
      'color:#d97706;', `${functionsHost}:${functionsPort}`
    );
  } catch (error) {
    errorDev(
      '⚠️ Failed to connect to Firebase emulators. Is `firebase emulators:start` running?',
      error
    );
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export const isOfflinePersistenceEnabled = () => firestoreCacheMode === 'persistent';

export const goOffline = async () => {
  try {
    await disableNetwork(db);
    return true;
  } catch (error) {
    console.error('Failed to go offline:', error);
    return false;
  }
};

export const goOnline = async () => {
  try {
    await enableNetwork(db);
    await waitForPendingWrites(db);
    return true;
  } catch (error) {
    console.error('Failed to go online:', error);
    return false;
  }
};

export const fetchRemoteConfig = async () => {
  if (!remoteConfig) return null;

  try {
    await fetchAndActivate(remoteConfig);
    return remoteConfig;
  } catch (error) {
    console.error('Error fetching remote config:', error);
    return null;
  }
};

// ── Remote Config Value Getters (v9 modular — instance methods) ────────────

/**
 * Returns the raw Remote Config Value object.
 * Use the typed helpers below for convenience:
 *   getRemoteConfigBoolean(key), getRemoteConfigString(key), getRemoteConfigNumber(key)
 */
export const getRemoteConfigValue = (key) => {
  if (!remoteConfig) return null;
  return remoteConfig.getValue(key); // ✅ Instance method, not a standalone import
};

export const getRemoteConfigBoolean = (key) => {
  const value = getRemoteConfigValue(key);
  return value ? value.asBoolean() : null;
};

export const getRemoteConfigString = (key) => {
  const value = getRemoteConfigValue(key);
  return value ? value.asString() : null;
};

export const getRemoteConfigNumber = (key) => {
  const value = getRemoteConfigValue(key);
  return value ? value.asNumber() : null;
};

export const getAllRemoteConfig = () => {
  if (!remoteConfig) return {};
  return remoteConfig.getAll(); // ✅ Instance method
};

export const requestNotificationPermission = async () => {
  const messagingService = await messagingReadyPromise;

  if (!messagingService || !process.env.REACT_APP_FIREBASE_VAPID_KEY) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    return await getToken(messagingService, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const deleteNotificationToken = async () => {
  const messagingService = await messagingReadyPromise;
  if (!messagingService) return false;

  try {
    await deleteToken(messagingService);
    return true;
  } catch (error) {
    console.error('Error deleting notification token:', error);
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

export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  const hasPagePath = 'page_path' in eventParams;

  const params = {
    ...eventParams,
    ...(isBrowser && !hasPagePath
      ? { page_path: window.location.pathname }
      : {}),
  };

  if (!analytics) {
    if (pendingAnalyticsEvents.length < MAX_QUEUED_EVENTS) {
      pendingAnalyticsEvents.push({ name: eventName, params });
    } else if (isDevelopment) {
      warnDev(
        `Analytics queue full (${MAX_QUEUED_EVENTS} events). Dropping event: ${eventName}`
      );
    }
    void analyticsReadyPromise;
    return false;
  }

  logEvent(analytics, eventName, params);
  return true;
};

export const startTrace = async (traceName) => {
  if (!performance) return null;

  try {
    const perfTrace = trace(performance, traceName);
    perfTrace.start();
    return perfTrace;
  } catch (error) {
    console.error('Error starting trace:', error);
    return null;
  }
};

export const stopTrace = async (perfTrace) => {
  if (!perfTrace) return false;

  try {
    perfTrace.stop();
    return true;
  } catch (error) {
    console.error('Error stopping trace:', error);
    return false;
  }
};

export const callFunction = async (functionName, data = {}) => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    const message =
      error.details?.message || error.message || 'Unknown function error';
    console.error(`Error calling function "${functionName}":`, message);
    throw error;
  }
};

export const isFirebaseInitialized = () => getApps().length > 0;

export const getFirebaseEnvironment = () => ({
  appName: app.name,
  projectId: app.options.projectId,
  environment: process.env.NODE_ENV,
  emulatorsEnabled: useEmulators,
  firestoreCacheMode,
  analyticsEnabled: Boolean(analytics),
  performanceEnabled: Boolean(performance),
  remoteConfigEnabled: Boolean(remoteConfig),
  messagingEnabled: Boolean(messaging),
  appCheckEnabled: Boolean(appCheck),
});

export const checkFirebaseHealth = async () => ({
  app: Boolean(app),
  auth: Boolean(auth),
  firestore: Boolean(db),
  storage: Boolean(storage),
  functions: Boolean(functions),
  analytics: Boolean(analytics),
  performance: Boolean(performance),
  remoteConfig: Boolean(remoteConfig),
  messaging: Boolean(messaging),
  appCheck: Boolean(appCheck),
});

export const uploadFile = (path, file, onProgress) => {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file?.type || undefined,
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          snapshot.totalBytes > 0
            ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            : 0;
        onProgress?.(progress);
      },
      reject,
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadURL,
            metadata: uploadTask.snapshot.metadata,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteFile = async (path) => {
  try {
    await deleteObject(ref(storage, path));
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// ── Unified Services Export ────────────────────────────────────────────────
const firebaseServices = {
  get app() { return app; },
  get auth() { return auth; },
  get db() { return db; },
  get storage() { return storage; },
  get functions() { return functions; },
  get analytics() { return analytics; },
  get performance() { return performance; },
  get remoteConfig() { return remoteConfig; },
  get messaging() { return messaging; },
  get appCheck() { return appCheck; },
  providers: {
    google: googleProvider,
    github: githubProvider,
    twitter: twitterProvider,
    facebook: facebookProvider,
    microsoft: microsoftProvider,
    phone: phoneProvider,
  },
};

export default firebaseServices;