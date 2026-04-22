import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  TwitterAuthProvider,
  PhoneAuthProvider,
  EmailAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { 
  getStorage, 
  connectStorageEmulator,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { 
  getAnalytics, 
  isSupported as isAnalyticsSupported,
  logEvent,
  setUserProperties,
  setAnalyticsCollectionEnabled
} from 'firebase/analytics';
import { 
  getPerformance,
  trace,
  onCLS,
  onFID,
  onLCP,
  onFCP,
  onTTFB
} from 'firebase/performance';
import { 
  getFunctions, 
  connectFunctionsEmulator,
  httpsCallable
} from 'firebase/functions';
import { 
  getRemoteConfig, 
  fetchAndActivate,
  getValue,
  getAll
} from 'firebase/remote-config';
import { 
  getMessaging, 
  getToken, 
  onMessage,
  isSupported as isMessagingSupported,
  deleteToken
} from 'firebase/messaging';
import { getAppCheck, initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// ============================================
// CONFIGURATION VALIDATION
// ============================================

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
    console.error('❌ Missing required Firebase environment variables:', missing);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase configuration is incomplete');
    }
    return false;
  }
  
  console.log('✅ Firebase configuration validated');
  return true;
};

// ============================================
// FIREBASE CONFIGURATION
// ============================================

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// ============================================
// FIREBASE UI CONFIGURATION
// ============================================

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
      provider: FacebookAuthProvider.PROVIDER_ID,
      scopes: ['email', 'public_profile']
    },
    {
      provider: EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: true,
      signInMethod: 'password'
    },
    {
      provider: PhoneAuthProvider.PROVIDER_ID,
      defaultCountry: 'US',
      whitelistedCountries: ['US', 'CA', 'GB', 'AU', 'IN', 'DE', 'FR', 'JP', 'PK']
    }
  ],
  tosUrl: '/terms-of-service',
  privacyPolicyUrl: '/privacy-policy',
  siteName: 'ResumeAI Pro',
  popupMode: true
};

// ============================================
// INITIALIZE FIREBASE
// ============================================

const initializeFirebase = () => {
  validateConfig();
  
  if (getApps().length > 0) {
    console.log('📱 Firebase already initialized, returning existing app');
    return getApp();
  }

  console.log('🔥 Initializing Firebase...');
  
  try {
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    throw error;
  }
};

export const app = initializeFirebase();

// ============================================
// APP CHECK (Production Security)
// ============================================

export let appCheck = null;

if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('🛡️ App Check initialized');
  } catch (error) {
    console.warn('App Check initialization failed:', error);
  }
}

// ============================================
// INITIALIZE SERVICES
// ============================================

export const auth = getAuth(app);

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
microsoftProvider.addScope('user.read');
microsoftProvider.addScope('email');

export const phoneProvider = new PhoneAuthProvider(auth);

setPersistence(auth, browserLocalPersistence).catch(error => {
  console.warn('Failed to set auth persistence:', error);
});

// ============================================
// FIRESTORE WITH NEW CACHE API (NO DEPRECATION WARNING)
// ============================================

export const db = process.env.NODE_ENV === 'production' 
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      })
    })
  : initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      }),
      experimentalForceLongPolling: true
    });

export const storage = getStorage(app);

export const functions = getFunctions(app);
functions.region = 'us-central1';

// ============================================
// OPTIONAL SERVICES (BROWSER ONLY)
// ============================================

export let analytics = null;
export let performance = null;
export let remoteConfig = null;
export let messaging = null;

if (typeof window !== 'undefined') {
  isAnalyticsSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
      setAnalyticsCollectionEnabled(analytics, process.env.NODE_ENV === 'production');
      
      setUserProperties(analytics, {
        app_version: process.env.REACT_APP_VERSION || '2.5.0',
        environment: process.env.NODE_ENV,
        platform: 'web'
      });
      
      console.log('📊 Analytics initialized');
    }
  });

  try {
    performance = getPerformance(app);
    console.log('⚡ Performance monitoring initialized');
    
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_LOG_WEB_VITALS === 'true') {
      onCLS(metric => console.log('CLS:', metric.value));
      onFID(metric => console.log('FID:', metric.value));
      onLCP(metric => console.log('LCP:', metric.value));
      onFCP(metric => console.log('FCP:', metric.value));
      onTTFB(metric => console.log('TTFB:', metric.value));
    }
  } catch (error) {
    console.warn('Performance monitoring not supported:', error);
  }

  try {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings = {
      minimumFetchIntervalMillis: process.env.NODE_ENV === 'production' ? 3600000 : 60000,
      fetchTimeoutMillis: 60000
    };
    
    remoteConfig.defaultConfig = {
      enable_new_features: false,
      maintenance_mode: false,
      min_app_version: '1.0.0',
      max_resumes_free: 5,
      enable_ai_suggestions: true,
      enable_job_matching: true,
      enable_collaboration: false,
      pricing_annual_discount: 20,
      enable_beta_features: false,
      enable_chat_support: true
    };
    
    console.log('🎛️ Remote Config initialized');
  } catch (error) {
    console.warn('Remote Config not supported:', error);
  }

  isMessagingSupported().then(supported => {
    if (supported && 'serviceWorker' in navigator && 'Notification' in window) {
      try {
        messaging = getMessaging(app);
        console.log('📨 Messaging initialized');
      } catch (error) {
        console.warn('Messaging not supported:', error);
      }
    }
  });
}

// ============================================
// OFFLINE PERSISTENCE (FALLBACK)
// ============================================

export const enableOfflinePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('💾 Offline persistence enabled');
    return true;
  } catch (error) {
    console.error('Error enabling offline persistence:', error);
    return false;
  }
};

// ============================================
// NETWORK MANAGEMENT
// ============================================

export const goOffline = async () => {
  try {
    await disableNetwork(db);
    console.log('📴 Firestore offline mode enabled');
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
    console.log('🌐 Firestore online mode restored');
    return true;
  } catch (error) {
    console.error('Failed to go online:', error);
    return false;
  }
};

// ============================================
// EMULATOR CONNECTION (DEVELOPMENT)
// ============================================

const useEmulators = process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true';

if (useEmulators) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to emulators:', error);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export const fetchRemoteConfig = async () => {
  if (!remoteConfig) return null;
  
  try {
    await fetchAndActivate(remoteConfig);
    console.log('✅ Remote config fetched and activated');
    return remoteConfig;
  } catch (error) {
    console.error('Error fetching remote config:', error);
    return null;
  }
};

export const getRemoteConfigValue = (key) => {
  if (!remoteConfig) return null;
  return getValue(remoteConfig, key);
};

export const getAllRemoteConfig = () => {
  if (!remoteConfig) return {};
  return getAll(remoteConfig);
};

export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });
      console.log('🔔 Notification permission granted');
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

export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, {
      ...eventParams,
      timestamp: new Date().toISOString(),
      page: window.location.pathname
    });
  }
};

export const startTrace = async (traceName) => {
  if (!performance) return null;
  
  try {
    const perfTrace = trace(performance, traceName);
    await perfTrace.start();
    return perfTrace;
  } catch (error) {
    console.error('Error starting trace:', error);
    return null;
  }
};

export const stopTrace = async (perfTrace) => {
  if (perfTrace) {
    try {
      await perfTrace.stop();
    } catch (error) {
      console.error('Error stopping trace:', error);
    }
  }
};

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

export const isFirebaseInitialized = () => {
  return getApps().length > 0;
};

export const getFirebaseEnvironment = () => {
  return {
    appName: app.name,
    projectId: app.options.projectId,
    environment: process.env.NODE_ENV,
    emulatorsEnabled: useEmulators,
    offlinePersistenceEnabled: true,
    analyticsEnabled: !!analytics,
    performanceEnabled: !!performance,
    remoteConfigEnabled: !!remoteConfig,
    messagingEnabled: !!messaging,
    appCheckEnabled: !!appCheck
  };
};

export const checkFirebaseHealth = async () => {
  return {
    app: !!app,
    auth: !!auth,
    firestore: !!db,
    storage: !!storage,
    functions: !!functions,
    analytics: !!analytics,
    performance: !!performance,
    remoteConfig: !!remoteConfig,
    messaging: !!messaging,
    appCheck: !!appCheck
  };
};

// ============================================
// STORAGE HELPERS
// ============================================

export const uploadFile = (path, file, onProgress) => {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ downloadURL, metadata: uploadTask.snapshot.metadata });
      }
    );
  });
};

export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// ============================================
// EXPORT DEFAULT
// ============================================

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
  appCheck,
  providers: {
    google: googleProvider,
    github: githubProvider,
    twitter: twitterProvider,
    facebook: facebookProvider,
    microsoft: microsoftProvider,
    phone: phoneProvider
  }
};

if (process.env.NODE_ENV === 'development') {
  console.log('📦 Firebase Services:', Object.keys(firebaseServices).filter(k => firebaseServices[k]));
}

export default firebaseServices;