import React, { Suspense, lazy, useEffect, useRef, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// ── React Query Devtools (dev only, lazy loaded) ────────────────────────────
const ReactQueryDevtools = isDevelopment
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : null;

// ── Lazy Page Factory ───────────────────────────────────────────────────────
/**
 * Creates a lazily loaded page component with a `.preload()` method.
 * This allows strategic prefetching of critical routes without immediately
 * executing the module.
 */
const createLazyPage = (loader) => {
  const Component = lazy(loader);
  Component.preload = loader;
  Component.displayName = `LazyPage(${loader.name || 'Unknown'})`;
  return Component;
};

// ── Lazy-loaded Pages ───────────────────────────────────────────────────────
// Critical routes (prefetched eagerly via webpackPrefetch / useChunkPrefetch)
const Home = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Home'));
const Dashboard = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Dashboard'));
const Builder = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Builder'));

// Secondary routes (loaded on demand)
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
const ATSScanner = createLazyPage(() => import('./pages/ATSScanner'));
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

// ── React Query Client ──────────────────────────────────────────────────────
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30,   // 30 minutes (formerly cacheTime)
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });

// ── Route Definitions ───────────────────────────────────────────────────────
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
  { path: '/ats-scanner', component: ATSScanner },
  { path: '/billing', component: Billing },
  { path: '/analytics', component: Analytics, requirePremium: true },
  { path: '/cover-letter', component: CoverLetter, requirePremium: true },
];

// ── Utilities ───────────────────────────────────────────────────────────────
const subscribeToMediaQuery = (mediaQuery, listener) => {
  // Modern browsers support addEventListener on MediaQueryList
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }

  // Fallback for very old browsers (Safari < 14)
  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
};

const resolveIsDark = (savedTheme, systemPrefersDark) => {
  return savedTheme === 'dark' || ((savedTheme === null || savedTheme === 'system') && systemPrefersDark);
};

// ── Custom Hooks ────────────────────────────────────────────────────────────

/**
 * Applies the correct theme class to `<html>` before React hydrates
 * to prevent a flash of incorrect theme. Syncs with localStorage and
 * system preference changes.
 * 
 * FIXED: Now uses useLayoutEffect to prevent FOUC (Flash of Unstyled Content)
 */
const useInitialThemeClass = () => {
  // Use useLayoutEffect for synchronous DOM mutations before paint
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
        // localStorage might be unavailable (private browsing in some browsers)
        applyTheme(mediaQuery.matches);
      }
    };

    // Apply immediately before paint
    syncTheme();

    // Listen for system preference changes
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

/**
 * Prefetches critical page bundles during browser idle time.
 * Falls back to setTimeout when requestIdleCallback is unavailable.
 */
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

/**
 * Monitors online/offline status and provides user feedback.
 * Uses a persistent error toast when offline (auto-dismisses on reconnect),
 * plus a slide-down banner for keyboard/screen-reader accessibility.
 * 
 * FIXED: Cleanup toast on unmount to prevent memory leaks
 */
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

    // Set initial status (optimistic — navigator.onLine is best-effort)
    syncStatus(navigator.onLine, { notify: false });
    hasInitialized.current = true;

    const handleOnline = () => syncStatus(true);
    const handleOffline = () => syncStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Clean up persistent toast on unmount
      toast.dismiss(toastIdRef.current);
    };
  }, []);

  return isOnline;
};

// ── Route-Level Components ──────────────────────────────────────────────────

/**
 * Tracks page views in Firebase Analytics.
 * Debounces duplicate events (same URL within rapid re-renders).
 */
const AnalyticsTracker = () => {
  const { pathname, search, hash } = useLocation();
  const lastTrackedUrl = useRef('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const currentUrl = `${pathname}${search}${hash}`;

    if (lastTrackedUrl.current === currentUrl) return;

    lastTrackedUrl.current = currentUrl;

    // Clear previous timeout if exists
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

/**
 * Scrolls to top on route change.
 * Skips scroll when a URL hash is present (browser handles anchor navigation).
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Let the browser handle hash-based scroll naturally
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
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

/**
 * When users prefer reduced motion, we eliminate all movement
 * and minimize duration to near-zero (not just faster).
 * A small opacity fade remains to preserve the sense of navigation
 * without causing discomfort.
 */
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
        transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
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

/**
 * FIXED: Changed min-h-[inherit] to min-h-full for proper height inheritance
 */
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

/**
 * Wraps page component with error boundary and transition
 */
const renderPage = (Component) => (
  <RouteErrorBoundary>
    <PageTransition>
      <Component />
    </PageTransition>
  </RouteErrorBoundary>
);

// ── Animated Routes ─────────────────────────────────────────────────────────

/**
 * Renders all application routes wrapped in AnimatePresence
 * for page-level exit animations. Uses location.pathname as key
 * so that path changes trigger mount/unmount transitions.
 *
 * Note: Query string changes on the same path will NOT trigger
 * a transition animation — this is intentional to avoid jarring
 * re-animations on filter/sort operations.
 */
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        {PUBLIC_ROUTES.map(({ path, component: Component }) => (
          <Route key={path} path={path} element={renderPage(Component)} />
        ))}

        {/* Auth routes */}
        {AUTH_ROUTES.map(({ path, component: Component }) => (
          <Route key={path} path={path} element={renderPage(Component)} />
        ))}

        {/* Protected routes - FIXED: PrivateRoute now properly wraps with element pattern */}
        {PROTECTED_ROUTES.map(({ path, component: Component, requirePremium }) => (
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
        ))}

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <RouteErrorBoundary>
                <PageTransition>
                  <Admin />
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
        {/* Invisible utility components */}
        <AnalyticsTracker />
        <ScrollToTop />

        {/* Lazy-loaded page routes with error boundary */}
        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
        </Suspense>

        {/* Toast notifications */}
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

        {/* Development mode indicator */}
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

        {/* Offline banner (visual only — toast handles the interactive feedback) */}
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

/**
 * ResumeAI Pro — Root Application Component
 *
 * Provider hierarchy (outermost to innermost):
 * ErrorBoundary > HelmetProvider > QueryClientProvider > Router >
 * ThemeProvider > AuthProvider > SettingsProvider >
 * NotificationProvider > ResumeProvider > AppShell
 * 
 * FIXED: QueryClient is now memoized to prevent recreation on re-renders
 */
function App() {
  const queryClient = useMemo(() => createQueryClient(), []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
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

          {isDevelopment && ReactQueryDevtools && (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
            </Suspense>
          )}
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;