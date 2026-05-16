import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ResumeProvider } from './contexts/ResumeContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';
import RouteErrorBoundary from './components/common/RouteErrorBoundary';
import { logAnalyticsEvent } from './services/firebase';
import './styles/globals.css';
import './styles/animations.css';

// ── Environment ──────────────────────────────────────────────────────────────
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * TanStack Query was mounted at the tree root without any useQuery/useMutation usage
 * in the app layer — it only inflated the bundle and suggested a caching layer we do
 * not use (Firestore + contexts own data today). Restore `QueryClientProvider` when you
 * adopt server-state hooks for API endpoints or callable-backed resources.
 */

// ── Lazy Page Factory ───────────────────────────────────────────────────────
const retryDynamicImport = (importFn, retriesLeft = 2, delayMs = 600) =>
  importFn().catch((error) => {
    if (retriesLeft <= 0) {
      if (isDevelopment) {
        console.error('[lazy] Chunk load failed after retries', error);
      }
      throw error;
    }
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        retryDynamicImport(importFn, retriesLeft - 1, delayMs).then(resolve, reject);
      }, delayMs);
    });
  });

const createLazyPage = (loader) => {
  const load = () => retryDynamicImport(loader);
  const Component = lazy(load);
  Component.preload = load;
  Component.displayName = `LazyPage(${loader.name || 'Unknown'})`;
  return Component;
};

// ── Lazy-loaded Pages ───────────────────────────────────────────────────────
const Home = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Home'));
const Dashboard = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Dashboard'));
const Builder = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Builder'));

// Secondary routes
const Login = createLazyPage(() => import('./pages/Login'));
const SignUp = createLazyPage(() => import('./pages/SignUp'));
const ForgotPasswordPage = createLazyPage(() => import('./pages/ForgotPasswordPage'));
const VerifyEmail = createLazyPage(() => import('./pages/VerifyEmail'));
const Admin = createLazyPage(() => import('./pages/Admin'));
const Pricing = createLazyPage(() => import('./pages/Pricing'));
const About = createLazyPage(() => import('./pages/About'));
const Contact = createLazyPage(() => import('./pages/Contact'));
const Privacy = createLazyPage(() => import('./pages/Privacy'));
const Terms = createLazyPage(() => import('./pages/Terms'));
const Profile = createLazyPage(() => import('./pages/Profile'));
const Settings = createLazyPage(() => import('./pages/Settings'));
const Templates = createLazyPage(() => import('./pages/Templates'));
const ATSScannerPage = createLazyPage(() => import('./pages/ATSScannerPage'));
const Analytics = createLazyPage(() => import('./pages/Analytics'));
const Features = createLazyPage(() => import('./pages/Features'));
const Blog = createLazyPage(() => import('./pages/Blog'));
const BlogPost = createLazyPage(() => import('./pages/BlogPost'));
const Careers = createLazyPage(() => import('./pages/Careers'));
const Help = createLazyPage(() => import('./pages/Help'));
const FAQ = createLazyPage(() => import('./pages/FAQ'));
const CoverLetter = createLazyPage(() => import('./pages/CoverLetter'));
const MyResumes = createLazyPage(() => import('./pages/MyResumes'));
const Preview = createLazyPage(() => import('./pages/Preview'));
const Billing = createLazyPage(() => import('./pages/Billing'));
const NotFound = createLazyPage(() => import('./pages/NotFound'));

// ── Route definitions (canonical metadata: src/config/routes.js) ────────────
const PUBLIC_ROUTES = [
  { path: '/', component: Home },
  { path: '/features', component: Features },
  { path: '/pricing', component: Pricing },
  { path: '/templates', component: Templates },
  { path: '/blog', component: Blog },
  { path: '/blog/:slug', component: BlogPost },
  { path: '/about', component: About },
  { path: '/careers', component: Careers },
  { path: '/contact', component: Contact },
  { path: '/help', component: Help },
  { path: '/faq', component: FAQ },
  { path: '/privacy', component: Privacy },
  { path: '/terms', component: Terms },
];

const AUTH_ROUTES = [
  { path: '/login', component: Login },
  { path: '/signup', component: SignUp },
  { path: '/forgot-password', component: ForgotPasswordPage },
  { path: '/verify-email', component: VerifyEmail },
];

const PROTECTED_ROUTES = [
  { path: '/dashboard', component: Dashboard },
  { path: '/builder/:id?', component: Builder },
  { path: '/profile', component: Profile },
  { path: '/settings', component: Settings },
  { path: '/my-resumes', component: MyResumes },
  { path: '/preview/:id', component: Preview },
  { path: '/ats-scanner', component: ATSScannerPage },
  { path: '/billing', component: Billing },
  { path: '/analytics', component: Analytics, requirePremium: true },
  { path: '/cover-letter', component: CoverLetter, requirePremium: true },
];

// ── Utilities ───────────────────────────────────────────────────────────────
const subscribeToMediaQuery = (mediaQuery, listener) => {
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }
  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
};

const resolveIsDark = (savedTheme, systemPrefersDark) => {
  return savedTheme === 'dark' || ((savedTheme === null || savedTheme === 'system') && systemPrefersDark);
};

// ── Custom Hooks ────────────────────────────────────────────────────────────
const useInitialThemeClass = () => {
  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isDark) => {
      root.classList.toggle('dark', isDark);
      root.style.colorScheme = isDark ? 'dark' : 'light';
    };

    const syncTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme');
        applyTheme(resolveIsDark(savedTheme, mediaQuery.matches));
      } catch (error) {
        applyTheme(mediaQuery.matches);
      }
    };

    syncTheme();

    const unsubscribe = subscribeToMediaQuery(mediaQuery, (event) => {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === null || savedTheme === 'system') {
          applyTheme(event.matches);
        }
      } catch {
        // Silently handle localStorage errors
      }
    });

    return unsubscribe;
  }, []);
};

const useChunkPrefetch = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const preloadCriticalPages = () => {
      try {
        void Dashboard.preload?.();
        void Builder.preload?.();
        void Templates.preload?.();
      } catch (error) {
        if (isDevelopment) {
          console.warn('Failed to preload chunks:', error);
        }
      }
    };

    let cleanup;

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadCriticalPages, {
        timeout: 1500,
      });
      cleanup = () => window.cancelIdleCallback(idleId);
    } else {
      const timeoutId = window.setTimeout(preloadCriticalPages, 1200);
      cleanup = () => window.clearTimeout(timeoutId);
    }

    return cleanup;
  }, []);
};

const useOnlineStatusFeedback = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const hasInitialized = useRef(false);
  const toastIdRef = useRef('online-status');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncStatus = (nextOnline, { notify = true } = {}) => {
      setIsOnline(nextOnline);
      document.body.classList.toggle('offline', !nextOnline);

      if (!notify || !hasInitialized.current) {
        if (!hasInitialized.current) {
          hasInitialized.current = true;
        }
        return;
      }

      if (nextOnline) {
        toast.dismiss(toastIdRef.current);
        toast.success('Connection restored.', {
          id: toastIdRef.current,
          duration: 2500,
        });
      } else {
        toast.error('You are offline. Some features may be unavailable.', {
          id: toastIdRef.current,
          duration: Infinity,
        });
      }
    };

    syncStatus(navigator.onLine, { notify: false });
    hasInitialized.current = true;

    const handleOnline = () => syncStatus(true);
    const handleOffline = () => syncStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      toast.dismiss(toastIdRef.current);
    };
  }, []);

  return isOnline;
};

// ── Route-Level Components ──────────────────────────────────────────────────
const AnalyticsTracker = () => {
  const { pathname, search, hash } = useLocation();
  const lastTrackedUrl = useRef('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const currentUrl = `${pathname}${search}${hash}`;

    if (lastTrackedUrl.current === currentUrl) return;

    lastTrackedUrl.current = currentUrl;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      try {
        logAnalyticsEvent('page_view', {
          page_path: pathname,
          page_search: search,
          page_hash: hash,
        });
      } catch (error) {
        if (isDevelopment) {
          console.warn('Analytics page_view failed:', error);
        }
      }
    }, 150);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, search, hash]);

  return null;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [pathname, hash]);

  return null;
};

// ── Page Transition Variants ────────────────────────────────────────────────
const basePageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
};

const reducedMotionPageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0 },
  },
};

// ── Visual Components ───────────────────────────────────────────────────────
const PageLoader = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
        className="text-center"
      >
        <Loader size="lg" />
        <p
          className={`mt-4 text-sm text-gray-500 dark:text-gray-400 ${
            shouldReduceMotion ? '' : 'animate-pulse'
          }`}
        >
          Loading your workspace...
        </p>
      </motion.div>
    </div>
  );
};

const PageTransition = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduceMotion ? reducedMotionPageVariants : basePageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-full w-full"
    >
      {children}
    </motion.div>
  );
};

const renderPage = (Component) => (
  <RouteErrorBoundary>
    <PageTransition>
      <Component />
    </PageTransition>
  </RouteErrorBoundary>
);

// ── Animated Routes ─────────────────────────────────────────────────────────
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes - Added null check with fallback empty array */}
        {(PUBLIC_ROUTES || []).map(({ path, component: Component }) => (
          Component ? (
            <Route key={path} path={path} element={renderPage(Component)} />
          ) : null
        ))}

        {/* Auth routes - Added null check with fallback empty array */}
        {(AUTH_ROUTES || []).map(({ path, component: Component }) => (
          Component ? (
            <Route key={path} path={path} element={renderPage(Component)} />
          ) : null
        ))}

        {/* Protected routes - Added null check and Component validation */}
        {(PROTECTED_ROUTES || []).map(({ path, component: Component, requirePremium }) => (
          Component ? (
            <Route
              key={path}
              path={path}
              element={
                <PrivateRoute requirePremium={requirePremium}>
                  <RouteErrorBoundary>
                    <PageTransition>
                      <Component />
                    </PageTransition>
                  </RouteErrorBoundary>
                </PrivateRoute>
              }
            />
          ) : null
        ))}

        {/* Admin routes - Wrapped in Suspense for lazy loading */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <RouteErrorBoundary>
                <PageTransition>
                  <Suspense fallback={<PageLoader />}>
                    <Admin />
                  </Suspense>
                </PageTransition>
              </RouteErrorBoundary>
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={renderPage(NotFound)} />
      </Routes>
    </AnimatePresence>
  );
};

// ── App Shell ───────────────────────────────────────────────────────────────
const AppShell = () => {
  useInitialThemeClass();
  useChunkPrefetch();
  const isOnline = useOnlineStatusFeedback();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 transition-colors duration-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <AnalyticsTracker />
        <ScrollToTop />

        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
        </Suspense>

        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName="!z-[9999]"
          toastOptions={{
            duration: 4000,
            ariaProps: {
              role: 'status',
              'aria-live': 'polite',
            },
            className:
              '!rounded-xl !border !border-gray-200/60 !bg-white/90 !shadow-xl !backdrop-blur-xl dark:!border-gray-700/60 dark:!bg-gray-800/90',
            success: {
              className:
                '!border-green-200 !bg-green-50/90 dark:!border-green-800 dark:!bg-green-900/30',
            },
            error: {
              className:
                '!border-red-200 !bg-red-50/90 dark:!border-red-800 dark:!bg-red-900/30',
            },
            loading: {
              className:
                '!border-blue-200 !bg-blue-50/90 dark:!border-blue-800 dark:!bg-blue-900/30',
            },
          }}
        />

        {isDevelopment && (
          <div className="pointer-events-none fixed bottom-4 left-4 z-50 opacity-50 transition-opacity hover:opacity-100 sm:bottom-6 sm:left-6">
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
              <span aria-hidden="true">🛠️</span>
              <span>
                Development Mode
                <span className="sr-only"> (this indicator only appears in development)</span>
              </span>
            </div>
          </div>
        )}

        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed inset-x-0 top-0 z-50 transform bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-lg transition-transform duration-300 ${
            isOnline ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          You are currently offline. Some features may be unavailable.
        </div>
      </div>
    </DndProvider>
  );
};

// ── Root Component ──────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <SettingsProvider>
                <NotificationProvider>
                  <ResumeProvider>
                    <AppShell />
                  </ResumeProvider>
                </NotificationProvider>
              </SettingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;