import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles/globals.css';

const APP_NAME = process.env.REACT_APP_NAME || 'ResumeAI Pro';
const APP_VERSION = process.env.REACT_APP_VERSION || '2.5.0';
const APP_ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
const ANALYTICS_ENABLED = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PUBLIC_URL = process.env.PUBLIC_URL || '';

let analyticsModulePromise;

const parseNumberEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildAssetUrl = (path) => {
  const base = PUBLIC_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

const captureStartupError = (error, label) => {
  if (IS_DEVELOPMENT) {
    console.error(label, error);
  }

  if (SENTRY_DSN) {
    Sentry.captureException(error);
  }
};

const loadAnalyticsModule = () => {
  if (!analyticsModulePromise) {
    analyticsModulePromise = import('./services/analytics');
  }

  return analyticsModulePromise;
};

const initializeSentry = () => {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENVIRONMENT,
    release: `resumeai-pro@${APP_VERSION}`,
    enabled: true,
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
      Sentry.replayIntegration(),
    ],
  });
};

const initializeAnalytics = async () => {
  if (!ANALYTICS_ENABLED) {
    return;
  }

  try {
    const analyticsModule = await loadAnalyticsModule();

    if (typeof analyticsModule.initAnalytics === 'function') {
      analyticsModule.initAnalytics();
    }
  } catch (error) {
    captureStartupError(error, 'Analytics initialization failed');
  }
};

const reportPerformanceMetric = async (metric) => {
  if (IS_DEVELOPMENT) {
    console.info('[Web Vitals]', metric.name, Math.round(metric.value), metric);
  }

  try {
    window.dispatchEvent(
      new CustomEvent('app:web-vital', {
        detail: metric,
      })
    );
  } catch (error) {
    if (IS_DEVELOPMENT) {
      console.warn('Unable to dispatch web-vital event', error);
    }
  }

  if (!ANALYTICS_ENABLED) {
    return;
  }

  try {
    const analyticsModule = await loadAnalyticsModule();

    if (typeof analyticsModule.trackWebVital === 'function') {
      analyticsModule.trackWebVital(metric);
    }
  } catch (error) {
    captureStartupError(error, 'Web Vitals reporting failed');
  }
};

const initializeWebVitals = async () => {
  if (!IS_PRODUCTION) {
    return;
  }

  try {
    const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');

    onCLS(reportPerformanceMetric);
    onINP(reportPerformanceMetric);
    onFCP(reportPerformanceMetric);
    onLCP(reportPerformanceMetric);
    onTTFB(reportPerformanceMetric);
  } catch (error) {
    captureStartupError(error, 'Web Vitals initialization failed');
  }
};

const registerServiceWorker = () => {
  if (!IS_PRODUCTION || !('serviceWorker' in navigator)) {
    return;
  }

  const serviceWorkerUrl = buildAssetUrl('/sw.js');

  window.addEventListener(
    'load',
    async () => {
      try {
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (!newWorker) {
            return;
          }

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        });
      } catch (error) {
        captureStartupError(error, 'Service worker registration failed');
      }
    },
    { once: true }
  );
};

const unregisterDevelopmentServiceWorkers = async () => {
  if (!IS_DEVELOPMENT || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );

    if (registrations.length > 0) {
      console.info('[Service Worker] Cleared development registrations');
    }
  } catch (error) {
    captureStartupError(error, 'Service worker cleanup failed');
  }
};

const registerDevelopmentErrorLogging = () => {
  if (!IS_DEVELOPMENT) {
    return;
  }

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  });

  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error || event.message);
  });
};

const logStartupInfo = () => {
  if (!IS_DEVELOPMENT) {
    return;
  }

  console.info(`${APP_NAME} v${APP_VERSION}`);
  console.info(`Environment: ${APP_ENVIRONMENT}`);
};

const removeInitialLoader = () => {
  const loader = document.getElementById('initial-loader');

  if (!loader) {
    return;
  }

  loader.setAttribute('aria-hidden', 'true');
  loader.classList.add('hidden');

  window.setTimeout(() => {
    loader.remove();
  }, 300);
};

initializeSentry();
registerDevelopmentErrorLogging();
logStartupInfo();
void initializeAnalytics();
void initializeWebVitals();
void unregisterDevelopmentServiceWorkers();
registerServiceWorker();

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element "#root" was not found in the document.');
}

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (typeof window.requestAnimationFrame === 'function') {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(removeInitialLoader);
  });
} else {
  window.setTimeout(removeInitialLoader, 0);
}

export { root };
