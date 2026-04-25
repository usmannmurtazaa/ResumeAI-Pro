import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
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
import { logAnalyticsEvent } from './services/firebase';
import './styles/globals.css';
import './styles/animations.css';

const isDevelopment = process.env.NODE_ENV === 'development';

const ReactQueryDevtools = isDevelopment
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : null;

const createLazyPage = (loader) => {
  const Component = lazy(loader);
  Component.preload = loader;
  return Component;
};

// Lazy-loaded pages
const Home = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Home'));
const Login = createLazyPage(() => import('./pages/Login'));
const SignUp = createLazyPage(() => import('./pages/SignUp'));
const ForgotPasswordPage = createLazyPage(() => import('./pages/ForgotPasswordPage'));
const VerifyEmail = createLazyPage(() => import('./pages/VerifyEmail'));
const Dashboard = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Dashboard'));
const Builder = createLazyPage(() => import(/* webpackPrefetch: true */ './pages/Builder'));
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
const CoverLetter = createLazyPage(() => import('./pages/CoverLetter'));
const NotFound = createLazyPage(() => import('./pages/NotFound'));

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
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
  { path: '/ats-scanner', component: ATSScanner },
  { path: '/analytics', component: Analytics, requirePremium: true },
  { path: '/cover-letter', component: CoverLetter, requirePremium: true },
];

const subscribeToMediaQuery = (mediaQuery, listener) => {
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }

  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
};

const shouldUseDarkMode = (savedTheme, systemPrefersDark) => {
  return savedTheme === 'dark' || ((savedTheme === null || savedTheme === 'system') && systemPrefersDark);
};

const useInitialThemeClass = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isDark) => {
      root.classList.toggle('dark', isDark);
      root.style.colorScheme = isDark ? 'dark' : 'light';
    };

    const syncTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      applyTheme(shouldUseDarkMode(savedTheme, mediaQuery.matches));
    };

    syncTheme();

    const unsubscribe = subscribeToMediaQuery(mediaQuery, (event) => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === null || savedTheme === 'system') {
        applyTheme(event.matches);
      }
    });

    return unsubscribe;
  }, []);
};

const useChunkPrefetch = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const preloadCriticalPages = () => {
      void Dashboard.preload?.();
      void Builder.preload?.();
      void Templates.preload?.();
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadCriticalPages, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(preloadCriticalPages, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);
};

const useOnlineStatusFeedback = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncStatus = (nextOnline, { notify = true } = {}) => {
      setIsOnline(nextOnline);
      document.body.classList.toggle('offline', !nextOnline);

      if (!notify || !hasInitialized.current) {
        return;
      }

      if (nextOnline) {
        toast.dismiss('online-status');
        toast.success('Connection restored.', {
          id: 'online-status',
          duration: 2500,
        });
        return;
      }

      toast.error('You are offline. Some features may be unavailable.', {
        id: 'online-status',
        duration: Infinity,
      });
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
    };
  }, []);

  return isOnline;
};

const AnalyticsTracker = () => {
  const { pathname, search, hash } = useLocation();
  const lastTrackedUrl = useRef('');

  useEffect(() => {
    const currentUrl = `${pathname}${search}${hash}`;

    if (lastTrackedUrl.current === currentUrl) {
      return undefined;
    }

    lastTrackedUrl.current = currentUrl;

    const timeoutId = window.setTimeout(() => {
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

    return () => window.clearTimeout(timeoutId);
  }, [pathname, search, hash]);

  return null;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [pathname, hash]);

  return null;
};

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

const reducedMotionPageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.15, ease: 'linear' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1, ease: 'linear' },
  },
};

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
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
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
      className="min-h-[inherit]"
    >
      {children}
    </motion.div>
  );
};

const renderPage = (Component) => (
  <PageTransition>
    <Component />
  </PageTransition>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {PUBLIC_ROUTES.map(({ path, component: Component }) => (
          <Route key={path} path={path} element={renderPage(Component)} />
        ))}

        {AUTH_ROUTES.map(({ path, component: Component }) => (
          <Route key={path} path={path} element={renderPage(Component)} />
        ))}

        {PROTECTED_ROUTES.map(({ path, component: Component, ...routeProps }) => (
          <Route
            key={path}
            path={path}
            element={<PrivateRoute {...routeProps}>{renderPage(Component)}</PrivateRoute>}
          />
        ))}

        <Route
          path="/admin/*"
          element={<AdminRoute>{renderPage(Admin)}</AdminRoute>}
        />

        <Route path="*" element={renderPage(NotFound)} />
      </Routes>
    </AnimatePresence>
  );
};

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
          <div className="fixed bottom-4 left-4 z-50 opacity-50 transition-opacity hover:opacity-100">
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
              <span aria-hidden="true">🛠️</span>
              <span>Development Mode</span>
            </div>
          </div>
        )}

        <div
          role="status"
          aria-live="polite"
          aria-hidden={isOnline}
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

function App() {
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
