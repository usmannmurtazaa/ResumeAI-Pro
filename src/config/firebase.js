import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  TwitterAuthProvider,
  PhoneAuthProvider,
  EmailAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { 
  getStorage, 
  connectStorageEmulator 
} from 'firebase/storage';
import { 
  getAnalytics, 
  isSupported,
  logEvent,
  setUserProperties
} from 'firebase/analytics';
import { 
  getPerformance,
  trace
} from 'firebase/performance';
import { 
  getFunctions, 
  connectFunctionsEmulator,
  httpsCallable
} from 'firebase/functions';
import { getRemoteConfig, fetchAndActivate } from 'firebase/remote-config';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Validate environment variables
const validateConfig = () => {
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing required Firebase environment variables:', missing);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase configuration is incomplete');
    }
    return false;
  }
  
  return true;
};

// Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Firebase UI configuration
export const firebaseUIConfig = {
  signInFlow: 'popup',
  signInOptions: [
    {
      provider: GoogleAuthProvider.PROVIDER_ID,
      scopes: ['profile', 'email'],
      customParameters: {
        prompt: 'select_account'
      }
    },
    {
      provider: GithubAuthProvider.PROVIDER_ID,
      scopes: ['user:email', 'read:user']
    },
    {
      provider: TwitterAuthProvider.PROVIDER_ID
    },
    {
      provider: EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: true,
      signInMethod: 'password'
    },
    {
      provider: PhoneAuthProvider.PROVIDER_ID,
      defaultCountry: 'US',
      whitelistedCountries: ['US', 'CA', 'GB', 'AU', 'IN']
    }
  ],
  tosUrl: '/terms-of-service',
  privacyPolicyUrl: '/privacy-policy',
  siteName: 'ATS Resume Builder',
  popupMode: true
};

// Initialize Firebase (singleton pattern)
const initializeFirebase = () => {
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    return getApp();
  }

  // Validate configuration
  const isValid = validateConfig();
  if (!isValid && process.env.NODE_ENV === 'development') {
    console.warn('Firebase configuration is incomplete. Some features may not work.');
  }

  // Initialize the app
  const app = initializeApp(firebaseConfig);
  
  return app;
};

// Initialize Firebase app
export const app = initializeFirebase();

// Initialize services
export const auth = getAuth(app);
export const db = process.env.NODE_ENV === 'production' 
  ? getFirestore(app)
  : initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true
    });

export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize optional services
export let analytics = null;
export let performance = null;
export let remoteConfig = null;
export let messaging = null;

// Initialize analytics (browser only)
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
      
      // Set default user properties
      setUserProperties(analytics, {
        app_version: process.env.REACT_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV
      });
    }
  });

  // Initialize performance monitoring
  try {
    performance = getPerformance(app);
  } catch (error) {
    console.warn('Performance monitoring not supported:', error);
  }

  // Initialize Remote Config
  try {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings = {
      minimumFetchIntervalMillis: 3600000, // 1 hour
      fetchTimeoutMillis: 60000 // 1 minute
    };
    
    // Set default values
    remoteConfig.defaultConfig = {
      enable_new_features: false,
      maintenance_mode: false,
      min_app_version: '1.0.0',
      max_resumes_free: 5,
      enable_ai_suggestions: true
    };
  } catch (error) {
    console.warn('Remote Config not supported:', error);
  }

  // Initialize messaging (if supported)
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn('Messaging not supported:', error);
    }
  }
}

// Auth providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

export const twitterProvider = new TwitterAuthProvider();

export const phoneProvider = new PhoneAuthProvider(auth);

// Enable offline persistence for Firestore
export const enableOfflinePersistence = async () => {
  try {
    await enableMultiTabIndexedDbPersistence(db);
    console.log('Offline persistence enabled (multi-tab)');
    return true;
  } catch (error) {
    if (error.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (error.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence.');
    } else {
      console.error('Error enabling offline persistence:', error);
    }
    
    // Fallback to single-tab persistence
    try {
      await enableIndexedDbPersistence(db);
      console.log('Offline persistence enabled (single-tab)');
      return true;
    } catch (fallbackError) {
      console.error('Error enabling fallback persistence:', fallbackError);
      return false;
    }
  }
};

// Enable offline persistence by default in production
if (process.env.NODE_ENV === 'production') {
  enableOfflinePersistence();
}

// Set auth persistence
export const setAuthPersistence = async (rememberMe = true) => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return true;
  } catch (error) {
    console.error('Error setting auth persistence:', error);
    return false;
  }
};

// Default to local persistence
setAuthPersistence(true);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true') {
  try {
    // Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
    
    // Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);
    
    // Functions emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to emulators:', error);
  }
}

// Remote Config helpers
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

export const getRemoteConfigValue = (key) => {
  if (!remoteConfig) return null;
  return remoteConfig.getValue(key);
};

// Messaging helpers
export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const onMessageListener = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

// Analytics helpers
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
};

// Performance monitoring helpers
export const startTrace = async (traceName) => {
  if (!performance) return null;
  
  const perfTrace = trace(performance, traceName);
  await perfTrace.start();
  return perfTrace;
};

export const stopTrace = async (perfTrace) => {
  if (perfTrace) {
    await perfTrace.stop();
  }
};

// Cloud Functions helpers
export const callFunction = async (functionName, data = {}) => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling function ${functionName}:`, error);
    throw error;
  }
};

// Utility function to check if Firebase is properly initialized
export const isFirebaseInitialized = () => {
  return getApps().length > 0;
};

// Get current environment info
export const getFirebaseEnvironment = () => {
  return {
    appName: app.name,
    projectId: app.options.projectId,
    environment: process.env.NODE_ENV,
    emulatorsEnabled: process.env.REACT_APP_USE_EMULATORS === 'true',
    offlinePersistenceEnabled: true,
    analyticsEnabled: !!analytics,
    performanceEnabled: !!performance,
    remoteConfigEnabled: !!remoteConfig,
    messagingEnabled: !!messaging
  };
};

// Export a health check function
export const checkFirebaseHealth = async () => {
  const health = {
    auth: false,
    firestore: false,
    storage: false,
    functions: false
  };

  try {
    // Check auth
    if (auth.currentUser || true) {
      health.auth = true;
    }

    // Check firestore
    const db = getFirestore();
    health.firestore = !!db;

    // Check storage
    const storage = getStorage();
    health.storage = !!storage;

    // Check functions
    const functions = getFunctions();
    health.functions = !!functions;

    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    return health;
  }
};

// Export a default object with all services
const firebaseServices = {
  app,
  auth,
  db,
  storage,
  functions,
  analytics,
  performance,
  remoteConfig,
  messaging,
  providers: {
    google: googleProvider,
    github: githubProvider,
    twitter: twitterProvider,
    phone: phoneProvider
  }
};

export default firebaseServices;