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
      Sentry.captureException(error);
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
      integrations: [
        Sentry.browserTracingIntegration(),
        // Note: Session replay adds ~60KB gzipped.
        // In production, only 10% of sessions are recorded (configurable above).
        Sentry.replayIntegration(),
      ],
    });
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
      analyticsModule.initAnalytics();
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

  // Use non-blocking async — we don't await this
  void (async () => {
    try {
      const analyticsModule = await loadAnalyticsModule();
      if (analyticsModule && typeof analyticsModule.trackWebVital === 'function') {
        analyticsModule.trackWebVital(metric);
      }
    } catch (error) {
      captureStartupError(error, 'Web Vitals reporting failed');
    }
  })();
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
    onCLS((metric) => reportPerformanceMetric(metric));
    onINP((metric) => reportPerformanceMetric(metric));
    onFCP((metric) => reportPerformanceMetric(metric));
    onLCP((metric) => reportPerformanceMetric(metric));
    onTTFB((metric) => reportPerformanceMetric(metric));
  } catch (error) {
    captureStartupError(error, 'Web Vitals initialization failed');
  }
};

// ── Service Worker ──────────────────────────────────────────────────────────

/**
 * Registers the production Service Worker for PWA functionality.
 * Listens for updates and dispatches a custom event when a new version is available.
 */
const registerServiceWorker = () => {
  if (!IS_PRODUCTION || !('serviceWorker' in navigator)) return;

  const serviceWorkerUrl = buildAssetUrl('/sw.js');

  window.addEventListener(
    'load',
    async () => {
      try {
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl);

        // Helper to handle a new installing worker
        const handleInstallingWorker = (worker) => {
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available — notify the app
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        };

        // Check if a worker is already installing (race condition guard)
        handleInstallingWorker(registration.installing);

        // Listen for future updates
        registration.addEventListener('updatefound', () => {
          handleInstallingWorker(registration.installing);
        });
      } catch (error) {
        captureStartupError(error, 'Service worker registration failed');
      }
    },
    { once: true }
  );
};

/**
 * Cleans up development Service Workers to prevent hot-reload interference.
 */
const unregisterDevelopmentServiceWorkers = async () => {
  if (!IS_DEVELOPMENT || !('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegulations();
    await Promise.all(registrations.map((reg) => reg.unregister()));

    if (registrations.length > 0) {
      console.info('[Service Worker] Cleared %d development registration(s)', registrations.length);
    }
  } catch (error) {
    captureStartupError(error, 'Service worker cleanup failed');
  }
};

// ── Development Error Logging ───────────────────────────────────────────────

const registerDevelopmentErrorLogging = () => {
  if (!IS_DEVELOPMENT) return;

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  });

  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error || event.message);
  });
};

// ── Startup Logging ─────────────────────────────────────────────────────────

const logStartupInfo = () => {
  if (!IS_DEVELOPMENT) return;

  console.info(`${APP_NAME} v${APP_VERSION}`);
  console.info(`Environment: ${APP_ENVIRONMENT}`);
  console.info(`Analytics: ${ANALYTICS_ENABLED ? 'enabled' : 'disabled'}`);
  console.info(`Sentry: ${SENTRY_DSN ? 'configured' : 'not configured'}`);
};

// ── Initial Loader Removal ──────────────────────────────────────────────────

/**
 * Removes the static HTML loader after React has hydrated.
 * Uses double requestAnimationFrame to ensure the browser has painted
 * the React content before hiding the loader, preventing a flash of blank.
 */
const removeInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (!loader) return;

  // Hide from accessibility tree and visually immediately
  loader.setAttribute('aria-hidden', 'true');
  loader.classList.add('hidden');

  // Remove from DOM on next microtask to allow CSS transitions to complete
  // Using queueMicrotask instead of arbitrary setTimeout
  queueMicrotask(() => {
    loader.remove();
  });
};

// ── Bootstrap ───────────────────────────────────────────────────────────────

initializeSentry();
registerDevelopmentErrorLogging();
logStartupInfo();

// Fire-and-forget async initializations (non-blocking)
void initializeAnalytics();
void initializeWebVitals();
void unregisterDevelopmentServiceWorkers();

// Register production Service Worker
registerServiceWorker();

// Mount React
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element "#root" was not found in the document. Ensure index.html contains <div id="root"></div>.');
}

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the static loader after React paints
// Double rAF ensures at least one paint cycle has completed
if (typeof window.requestAnimationFrame === 'function') {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(removeInitialLoader);
  });
} else {
  // Fallback for environments without rAF (jsdom, very old browsers)
  window.setTimeout(removeInitialLoader, 0);
}

export { root };