import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Error tracking (Sentry)
import * as Sentry from '@sentry/react';

// Initialize Sentry if DSN is provided
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT || 'development',
    release: `resumeai-pro@${process.env.REACT_APP_VERSION || '2.5.0'}`,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(), 
      Sentry.replayIntegration(),
    ],
  });
}

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Report Web Vitals
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS(console.log);
    onFID(console.log);
    onFCP(console.log);
    onLCP(console.log);
    onTTFB(console.log);
  });
}

// Service Worker Registration
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, show update prompt
                console.log('🔄 New content available, please refresh.');
                // You can dispatch an event or show a toast here
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Unregister service worker in development
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('🗑️ Service Worker unregistered for development');
    });
  });
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled Promise Rejection:', event.reason);
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(event.reason);
  }
});

// Handle global errors
window.addEventListener('error', (event) => {
  console.error('❌ Global Error:', event.error);
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(event.error);
  }
});

// Log app version on startup
console.log(
  `%c ${process.env.REACT_APP_NAME || 'ResumeAI Pro'} v${process.env.REACT_APP_VERSION || '2.5.0'}`,
  'color: #6366f1; font-weight: bold; font-size: 14px;'
);
console.log(
  `%c Environment: ${process.env.REACT_APP_ENVIRONMENT || 'development'}`,
  'color: #8b5cf6; font-size: 12px;'
);

// Initialize analytics (if using custom analytics)
if (process.env.REACT_APP_ENABLE_ANALYTICS === 'true') {
  import('./services/analytics').then(({ initAnalytics }) => {
    initAnalytics();
  });
}

// Remove initial loader if it exists
const removeInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
  }
};

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove loader after initial render
removeInitialLoader();

// Export for testing
export { root };
