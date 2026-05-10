import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles/globals.css';

// ── Environment Constants ───────────────────────────────────────────────────
const APP_NAME = process.env.REACT_APP_NAME || 'ResumeAI Pro';
const APP_VERSION = process.env.REACT_APP_VERSION || '2.5.0';
const APP_ENVIRONMENT =
  process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
const ANALYTICS_ENABLED = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PUBLIC_URL = process.env.PUBLIC_URL || '';

// ── Module-level caches ─────────────────────────────────────────────────────
/** Lazily-loaded analytics module — only imported when analytics are enabled */
let analyticsModulePromise = null;

/** Reference to cleanup functions for development error listeners */
let devErrorCleanup = null;

// ── Utilities ───────────────────────────────────────────────────────────────

/**
 * Safely parses a numeric environment variable.
 * Returns fallback for empty strings, non-numeric values, Infinity, and NaN.
 *
 * @example parseNumberEnv('0.5', 1) // → 0.5
 * @example parseNumberEnv('', 0.1)   // → 0.1
 * @example parseNumberEnv(undefined, 0.1) // → 0.1
 */
const parseNumberEnv = (value, fallback) => {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Builds an absolute asset URL from a path.
 * Handles trailing slashes in PUBLIC_URL and leading slashes in path.
 *
 * @example buildAssetUrl('/sw.js') → 'https://example.com/sw.js'
 * @example buildAssetUrl('sw.js')  → 'https://example.com/sw.js'
 */
const buildAssetUrl = (path) => {
  const base = PUBLIC_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

/**
 * Reports startup errors to console (dev) and Sentry (if configured).
 * Does not throw — failures here should never crash the app.
 */
const captureStartupError = (error, label) => {
  if (IS_DEVELOPMENT) {
    console.error(label, error);
  }

  if (SENTRY_DSN) {
    try {
      Sentry.captureException(error, {
        tags: { phase: 'startup', label },
      });
    } catch {
      // Sentry itself failed — nothing we can do
    }
  }
};

/**
 * Returns the analytics module, lazy-loading it on first call.
 * Returns null if analytics are disabled or import fails.
 */
const loadAnalyticsModule = async () => {
  if (!ANALYTICS_ENABLED) return null;

  if (!analyticsModulePromise) {
    analyticsModulePromise = import('./services/analytics').catch((error) => {
      captureStartupError(error, 'Analytics module import failed');
      return null;
    });
  }

  return analyticsModulePromise;
};

// ── CSS Custom Properties Setup ─────────────────────────────────────────────

/**
 * Sets CSS custom properties that are needed by the stylesheet.
 * Must run before React mounts to prevent CLS.
 */
const setDocumentCustomProperties = () => {
  // Calculate scrollbar width for .no-scroll utility
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

  // Add preload class to prevent transition flashes during initial load
  document.documentElement.classList.add('preload');
};

// ── Sentry Initialization ───────────────────────────────────────────────────

const initializeSentry = () => {
  if (!SENTRY_DSN) return;

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: APP_ENVIRONMENT,
      release: `resumeai-pro@${APP_VERSION}`,
      tracesSampleRate: parseNumberEnv(
        process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE,
        IS_PRODUCTION ? 0.1 : 1
      ),
      replaysSessionSampleRate: parseNumberEnv(
        process.env.REACT_APP_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
        IS_PRODUCTION ? 0.1 : 0
      ),
      replaysOnErrorSampleRate: parseNumberEnv(
        process.env.REACT_APP_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
        1
      ),
      // FIXED: Added beforeSend to filter out noise and respect user privacy
      beforeSend(event) {
        // Don't send events in development
        if (IS_DEVELOPMENT) return null;
        
        // Filter out known irrelevant errors
        if (event.exception) {
          const values = event.exception.values || [];
          const shouldIgnore = values.some(value => {
            const type = value.type || '';
            const message = value.value || '';
            
            // Ignore browser extension errors
            if (type.includes('chrome-extension') || message.includes('chrome-extension')) return true;
            
            // Ignore network errors from third parties
            if (type === 'TypeError' && message.includes('NetworkError')) return true;
            
            // Ignore ResizeObserver loop limit exceeded (harmless)
            if (message.includes('ResizeObserver loop')) return true;
            
            return false;
          });
          
          if (shouldIgnore) return null;
        }
        
        return event;
      },
      integrations: [
        Sentry.browserTracingIntegration(),
        // Note: Session replay adds ~60KB gzipped.
        // In production, only 10% of sessions are recorded (configurable above).
        Sentry.replayIntegration({
          // FIXED: Mask all text by default for privacy, unmask specific elements
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ],
    });
    
    // Set user context if available (e.g., from localStorage)
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        Sentry.setUser({
          id: user.uid || user.id,
          email: user.email,
        });
      }
    } catch {
      // Ignore user context setup errors
    }
  } catch (error) {
    // Sentry initialization failed — log to console but don't crash
    if (IS_DEVELOPMENT) {
      console.error('Sentry initialization failed:', error);
    }
  }
};

// ── Analytics Initialization ────────────────────────────────────────────────

const initializeAnalytics = async () => {
  const analyticsModule = await loadAnalyticsModule();

  if (!analyticsModule) return;

  try {
    if (typeof analyticsModule.initAnalytics === 'function') {
      await analyticsModule.initAnalytics();
    }
  } catch (error) {
    captureStartupError(error, 'Analytics initialization failed');
  }
};

// ── Web Vitals ──────────────────────────────────────────────────────────────

/**
 * Reports a Web Vital metric to:
 * 1. Console (development)
 * 2. CustomEvent on window (for other listeners)
 * 3. Analytics service (production)
 */
const reportPerformanceMetric = (metric) => {
  if (IS_DEVELOPMENT) {
    console.info('[Web Vitals]', metric.name, Math.round(metric.value), metric);
  }

  // Dispatch for any in-app listeners
  try {
    window.dispatchEvent(
      new CustomEvent('app:web-vital', { detail: metric })
    );
  } catch (error) {
    if (IS_DEVELOPMENT) {
      console.warn('Unable to dispatch web-vital event', error);
    }
  }

  // Send to analytics service
  if (!ANALYTICS_ENABLED) return;

  // Schedule analytics reporting without blocking
  const reportToAnalytics = async () => {
    try {
      const analyticsModule = await loadAnalyticsModule();
      if (analyticsModule && typeof analyticsModule.trackWebVital === 'function') {
        analyticsModule.trackWebVital(metric);
      }
    } catch (error) {
      captureStartupError(error, 'Web Vitals reporting failed');
    }
  };

  // Use queueMicrotask for better performance than void
  queueMicrotask(() => {
    reportToAnalytics().catch((error) => {
      captureStartupError(error, 'Async web vital reporting failed');
    });
  });
};

/**
 * Initializes Web Vitals monitoring in production only.
 * Uses dynamic import to avoid bundling the library in development.
 */
const initializeWebVitals = async () => {
  if (!IS_PRODUCTION) return;

  try {
    const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');

    // Wrap in non-async callbacks since web-vitals expects void return
    // FIXED: Added error boundaries to each callback
    onCLS((metric) => {
      try {
        reportPerformanceMetric(metric);
      } catch (error) {
        captureStartupError(error, 'CLS reporting failed');
      }
    });
    
    onINP((metric) => {
      try {
        reportPerformanceMetric(metric);
      } catch (error) {
        captureStartupError(error, 'INP reporting failed');
      }
    });
    
    onFCP((metric) => {
      try {
        reportPerformanceMetric(metric);
      } catch (error) {
        captureStartupError(error, 'FCP reporting failed');
      }
    });
    
    onLCP((metric) => {
      try {
        reportPerformanceMetric(metric);
      } catch (error) {
        captureStartupError(error, 'LCP reporting failed');
      }
    });
    
    onTTFB((metric) => {
      try {
        reportPerformanceMetric(metric);
      } catch (error) {
        captureStartupError(error, 'TTFB reporting failed');
      }
    });
  } catch (error) {
    captureStartupError(error, 'Web Vitals initialization failed');
  }
};

// ── Service Worker ──────────────────────────────────────────────────────────

/**
 * Registers the production Service Worker for PWA functionality.
 * Listens for updates and dispatches a custom event when a new version is available.
 * 
 * FIXED: Now registers immediately instead of waiting for window.load
 * for better PWA performance. Uses requestIdleCallback as optimization.
 */
const registerServiceWorker = () => {
  if (!IS_PRODUCTION || !('serviceWorker' in navigator)) return;

  const serviceWorkerUrl = buildAssetUrl('/sw.js');

  const performRegistration = async () => {
    try {
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
        // FIXED: Added updateViaCache to ensure fresh SW
        updateViaCache: 'none',
      });

      // Helper to handle a new installing worker
      const handleInstallingWorker = (worker) => {
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available — notify the app
            window.dispatchEvent(
              new CustomEvent('sw-update-available', {
                detail: { registration },
              })
            );
          }
        });
      };

      // Check if a worker is already installing (race condition guard)
      handleInstallingWorker(registration.installing);

      // Listen for future updates
      registration.addEventListener('updatefound', () => {
        handleInstallingWorker(registration.installing);
      });

      // FIXED: Setup periodic updates check
      if (registration.active) {
        // Check for updates every hour
        setInterval(() => {
          registration.update().catch((error) => {
            if (IS_DEVELOPMENT) {
              console.warn('Service worker update check failed:', error);
            }
          });
        }, 60 * 60 * 1000);
      }
    } catch (error) {
      captureStartupError(error, 'Service worker registration failed');
    }
  };

  // FIXED: Use requestIdleCallback for non-critical registration
  // Fallback to immediate registration if not supported
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => {
      performRegistration().catch((error) => {
        captureStartupError(error, 'Deferred SW registration failed');
      });
    }, { timeout: 4000 });
  } else {
    // Still use load event for old browsers, but more aggressively
    if (document.readyState === 'complete') {
      performRegistration().catch((error) => {
        captureStartupError(error, 'Immediate SW registration failed');
      });
    } else {
      window.addEventListener(
        'load',
        () => {
          performRegistration().catch((error) => {
            captureStartupError(error, 'On-load SW registration failed');
          });
        },
        { once: true }
      );
    }
  }
};

/**
 * Cleans up development Service Workers to prevent hot-reload interference.
 * 
 * FIXED: Corrected typo from 'getRegulations' to 'getRegistrations'
 */
const unregisterDevelopmentServiceWorkers = async () => {
  if (!IS_DEVELOPMENT || !('serviceWorker' in navigator)) return;

  try {
    // FIXED: Corrected method name
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length > 0) {
      await Promise.all(
        registrations.map(async (reg) => {
          const result = await reg.unregister();
          if (IS_DEVELOPMENT) {
            console.info('[Service Worker] Unregistered:', reg.scope, result);
          }
          return result;
        })
      );
      
      console.info(
        '[Service Worker] Cleared %d development registration(s)',
        registrations.length
      );
    }
  } catch (error) {
    captureStartupError(error, 'Service worker cleanup failed');
  }
};

// ── Development Error Logging ───────────────────────────────────────────────

/**
 * FIXED: Now returns a cleanup function to prevent memory leaks in HMR.
 */
const registerDevelopmentErrorLogging = () => {
  if (!IS_DEVELOPMENT) return () => {};

  const handleUnhandledRejection = (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    // Optionally show in-app notification
    window.dispatchEvent(
      new CustomEvent('app:unhandled-error', {
        detail: { type: 'rejection', error: event.reason },
      })
    );
  };

  const handleGlobalError = (event) => {
    console.error('Global Error:', event.error || event.message);
    window.dispatchEvent(
      new CustomEvent('app:unhandled-error', {
        detail: { type: 'error', error: event.error || event.message },
      })
    );
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleGlobalError);

  // Return cleanup function for HMR support
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleGlobalError);
  };
};

// ── Startup Logging ─────────────────────────────────────────────────────────

const logStartupInfo = () => {
  if (!IS_DEVELOPMENT) return;

  console.group(`${APP_NAME} v${APP_VERSION}`);
  console.info(`Environment: ${APP_ENVIRONMENT}`);
  console.info(`Analytics: ${ANALYTICS_ENABLED ? 'enabled' : 'disabled'}`);
  console.info(`Sentry: ${SENTRY_DSN ? 'configured' : 'not configured'}`);
  console.info(`Public URL: ${PUBLIC_URL || '/'}`);
  console.groupEnd();
};

// ── Initial Loader Removal ──────────────────────────────────────────────────

/**
 * Removes the static HTML loader after React has hydrated.
 * FIXED: Uses a more robust approach with both rAF and transition completion.
 */
const removeInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (!loader) return;

  const focused = document.activeElement;
  if (focused instanceof Node && loader.contains(focused) && typeof focused.blur === 'function') {
    focused.blur();
  }

  // Hide from accessibility tree immediately
  loader.setAttribute('aria-hidden', 'true');
  
  // Add exit class for CSS transition if defined
  loader.classList.add('exit');
  
  // Wait for potential CSS transition
  const handleTransitionEnd = () => {
    loader.removeEventListener('transitionend', handleTransitionEnd);
    cleanup();
  };
  
  const cleanup = () => {
    // Remove preload class to enable transitions
    document.documentElement.classList.remove('preload');
    loader.remove();
  };

  // If loader has transitions, wait for them
  const hasTransition = window.getComputedStyle(loader).transitionDuration !== '0s';
  
  if (hasTransition) {
    loader.addEventListener('transitionend', handleTransitionEnd);
    // Fallback: remove after 1 second regardless
    setTimeout(cleanup, 1000);
    // Start exit animation
    requestAnimationFrame(() => {
      loader.style.opacity = '0';
    });
  } else {
    // No transition, remove immediately on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(cleanup);
    });
  }
};

// ── Bootstrap ───────────────────────────────────────────────────────────────

// Set CSS custom properties before rendering to prevent CLS
if (typeof window !== 'undefined') {
  setDocumentCustomProperties();
}

initializeSentry();

// FIXED: Store cleanup function for HMR support
devErrorCleanup = registerDevelopmentErrorLogging();

logStartupInfo();

// Fire-and-forget async initializations (non-blocking)
// FIXED: Added error boundaries to prevent unhandled rejections
const safeAsyncInit = async (name, initFn) => {
  try {
    await initFn();
  } catch (error) {
    captureStartupError(error, `${name} initialization failed`);
  }
};

// Initialize non-critical services
safeAsyncInit('Analytics', initializeAnalytics);
safeAsyncInit('Web Vitals', initializeWebVitals);
safeAsyncInit('SW Cleanup', unregisterDevelopmentServiceWorkers);

// Register production Service Worker
registerServiceWorker();

// Mount React
const container = document.getElementById('root');

if (!container) {
  throw new Error(
    'Root element "#root" was not found in the document. Ensure index.html contains <div id="root"></div>.'
  );
}

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the static loader after React paints
// FIXED: More robust approach with requestAnimationFrame and fallback
if (typeof window !== 'undefined') {
  if (typeof window.requestAnimationFrame === 'function') {
    // Wait for two animation frames to ensure paint
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        // Additional frame for slower devices
        window.requestAnimationFrame(removeInitialLoader);
      });
    });
  } else {
    // Fallback for environments without rAF (jsdom, very old browsers)
    window.setTimeout(removeInitialLoader, 100);
  }
}

// ── Hot Module Replacement Support ──────────────────────────────────────────

// FIXED: Added HMR cleanup for development
if (IS_DEVELOPMENT && module.hot) {
  module.hot.accept('./App', () => {
    console.info('[HMR] App updated');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });

  module.hot.dispose(() => {
    // Clean up development error listeners on HMR
    if (devErrorCleanup) {
      devErrorCleanup();
    }
  });
}

export { root };