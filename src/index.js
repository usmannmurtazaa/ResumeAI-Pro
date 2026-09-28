import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/globals.css';

// ── Environment Constants ───────────────────────────────────────────────────
const APP_NAME = process.env.REACT_APP_NAME || 'Maniesta Career OS';
const APP_VERSION = process.env.REACT_APP_VERSION || '2.5.0';
const APP_ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
const ANALYTICS_ENABLED = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PUBLIC_URL = process.env.PUBLIC_URL || '';

// ── Module-level caches ─────────────────────────────────────────────────────
let analyticsModulePromise = null;
let devErrorCleanup = null;
let swUpdateIntervalId = null;

// ── Utilities ───────────────────────────────────────────────────────────────

const parseNumberEnv = (value, fallback) => {
  if (value == null || value === '') return fallback;
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
    try {
      Sentry.captureException(error, {
        tags: { phase: 'startup', label },
      });
    } catch {
      // Sentry itself failed - nothing we can do
    }
  }
};

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

const setDocumentCustomProperties = () => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.classList.add('preload');
};

// ── Sentry Initialization ───────────────────────────────────────────────────

const initializeSentry = () => {
  if (!SENTRY_DSN) return;
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: APP_ENVIRONMENT,
      release: `maniestacareeros@${APP_VERSION}`,
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
      beforeSend(event) {
        if (IS_DEVELOPMENT) return null;
        if (event.exception) {
          const values = event.exception.values || [];
          const shouldIgnore = values.some((value) => {
            const type = value.type || '';
            const message = value.value || '';
            if (type.includes('chrome-extension') || message.includes('chrome-extension'))
              return true;
            if (type === 'TypeError' && message.includes('NetworkError')) return true;
            if (message.includes('ResizeObserver loop')) return true;
            if (type === 'AbortError') return true;
            return false;
          });
          if (shouldIgnore) return null;
        }
        return event;
      },
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ],
    });
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

const reportPerformanceMetric = (metric) => {
  if (IS_DEVELOPMENT) {
    console.info('[Web Vitals]', metric.name, Math.round(metric.value), metric);
  }
  try {
    window.dispatchEvent(new CustomEvent('app:web-vital', { detail: metric }));
  } catch (error) {
    if (IS_DEVELOPMENT) {
      console.warn('Unable to dispatch web-vital event', error);
    }
  }
  if (!ANALYTICS_ENABLED) return;
  queueMicrotask(() => {
    (async () => {
      try {
        const analyticsModule = await loadAnalyticsModule();
        if (analyticsModule && typeof analyticsModule.trackWebVital === 'function') {
          analyticsModule.trackWebVital(metric);
        }
      } catch (error) {
        captureStartupError(error, 'Web Vitals reporting failed');
      }
    })();
  });
};

const initializeWebVitals = async () => {
  if (!IS_PRODUCTION) return;
  try {
    const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');
    const safeReport = (label) => (metric) => {
      try {
        reportPerformanceMetric(metric);
      } catch (error) {
        captureStartupError(error, `${label} reporting failed`);
      }
    };
    onCLS(safeReport('CLS'));
    onINP(safeReport('INP'));
    onFCP(safeReport('FCP'));
    onLCP(safeReport('LCP'));
    onTTFB(safeReport('TTFB'));
  } catch (error) {
    captureStartupError(error, 'Web Vitals initialization failed');
  }
};

// ── Service Worker ──────────────────────────────────────────────────────────

const registerServiceWorker = () => {
  if (!IS_PRODUCTION || !('serviceWorker' in navigator)) return;
  const serviceWorkerUrl = buildAssetUrl('/sw.js');
  const performRegistration = async () => {
    try {
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
        updateViaCache: 'none',
      });
      const handleInstallingWorker = (worker) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(
              new CustomEvent('sw-update-available', {
                detail: { registration },
              })
            );
          }
        });
      };
      handleInstallingWorker(registration.installing);
      registration.addEventListener('updatefound', () => {
        handleInstallingWorker(registration.installing);
      });
      if (registration.active) {
        swUpdateIntervalId = setInterval(
          () => {
            if (!navigator.onLine) return;
            registration.update().catch((error) => {
              if (IS_DEVELOPMENT) {
                console.warn('Service worker update check failed:', error);
              }
            });
          },
          60 * 60 * 1000
        );
        window.addEventListener(
          'online',
          () => {
            registration.update().catch(() => {});
          },
          { once: true }
        );
      }
    } catch (error) {
      captureStartupError(error, 'Service worker registration failed');
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(
      () => {
        performRegistration().catch((error) => {
          captureStartupError(error, 'Deferred SW registration failed');
        });
      },
      { timeout: 4000 }
    );
  } else {
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

const unregisterDevelopmentServiceWorkers = async () => {
  if (!IS_DEVELOPMENT || !('serviceWorker' in navigator)) return;
  try {
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
      console.info('[Service Worker] Cleared %d development registration(s)', registrations.length);
    }
  } catch (error) {
    captureStartupError(error, 'Service worker cleanup failed');
  }
};

// ── Development Error Logging ───────────────────────────────────────────────

const registerDevelopmentErrorLogging = () => {
  if (!IS_DEVELOPMENT) return () => {};
  const handleUnhandledRejection = (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
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

const removeInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (!loader) return;
  const focused = document.activeElement;
  if (focused instanceof Node && loader.contains(focused) && typeof focused.blur === 'function') {
    focused.blur();
  }
  loader.setAttribute('aria-hidden', 'true');
  loader.classList.add('exit');
  const cleanup = () => {
    document.documentElement.classList.remove('preload');
    loader.remove();
  };
  const hasTransition = window.getComputedStyle(loader).transitionDuration !== '0s';
  if (hasTransition) {
    const handleTransitionEnd = () => {
      loader.removeEventListener('transitionend', handleTransitionEnd);
      cleanup();
    };
    loader.addEventListener('transitionend', handleTransitionEnd);
    setTimeout(cleanup, 1000);
    requestAnimationFrame(() => {
      loader.style.opacity = '0';
    });
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(cleanup);
    });
  }
};

// ── Bootstrap ───────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  setDocumentCustomProperties();
}

initializeSentry();
devErrorCleanup = registerDevelopmentErrorLogging();
logStartupInfo();

const safeAsyncInit = async (name, initFn) => {
  try {
    await initFn();
  } catch (error) {
    captureStartupError(error, `${name} initialization failed`);
  }
};

safeAsyncInit('Analytics', initializeAnalytics);
safeAsyncInit('Web Vitals', initializeWebVitals);
safeAsyncInit('SW Cleanup', unregisterDevelopmentServiceWorkers);
registerServiceWorker();

const container = document.getElementById('root');

if (!container) {
  throw new Error(
    'Root element "#root" was not found in the document. Ensure index.html contains <div id="root"></div>.'
  );
}

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

if (typeof window !== 'undefined') {
  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(removeInitialLoader);
      });
    });
  } else {
    window.setTimeout(removeInitialLoader, 100);
  }
}

if (IS_DEVELOPMENT && module.hot) {
  module.hot.accept('./App', () => {
    console.info('[HMR] App updated');
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
  module.hot.dispose(() => {
    if (devErrorCleanup) {
      devErrorCleanup();
      devErrorCleanup = null;
    }
    if (swUpdateIntervalId !== null) {
      clearInterval(swUpdateIntervalId);
      swUpdateIntervalId = null;
    }
  });
}

export { root };
