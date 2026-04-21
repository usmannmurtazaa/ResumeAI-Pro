import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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
import { useAuth } from './hooks/useAuth';
import './styles/globals.css';
import './styles/animations.css';

// Lazy load pages for better performance with prefetch hints
const Home = lazy(() => import(/* webpackPrefetch: true */ './pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const Dashboard = lazy(() => import(/* webpackPrefetch: true */ './pages/Dashboard'));
const Builder = lazy(() => import(/* webpackPrefetch: true */ './pages/Builder'));
const Admin = lazy(() => import('./pages/Admin'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Templates = lazy(() => import('./pages/Templates'));
const ATSScanner = lazy(() => import('./pages/ATSScanner'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Features = lazy(() => import('./pages/Features'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Careers = lazy(() => import('./pages/Careers'));
const Help = lazy(() => import('./pages/Help'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Create Query Client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
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

// Analytics wrapper component with enhanced tracking
const AnalyticsTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Track page view
    logAnalyticsEvent('page_view', {
      page_path: location.pathname,
      page_title: document.title,
      page_search: location.search,
      page_hash: location.hash,
      user_id: user?.uid || null,
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
    });
  }, [location, user]);

  return null;
};

// Scroll to top on route change with smooth behavior
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ 
      top: 0, 
      behavior: prefersReducedMotion ? 'auto' : 'smooth' 
    });
  }, [pathname]);

  return null;
};

// Enhanced loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <Loader size="lg" />
      <p className="mt-4 text-gray-500 dark:text-gray-400 animate-pulse">
        Loading amazing things...
      </p>
    </motion.div>
  </div>
);

// Route transition animation variants
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
};

// Animated Routes component with enhanced structure
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Home />
          </motion.div>
        } />
        <Route path="/features" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Features />
          </motion.div>
        } />
        <Route path="/pricing" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Pricing />
          </motion.div>
        } />
        <Route path="/templates" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Templates />
          </motion.div>
        } />
        <Route path="/blog" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Blog />
          </motion.div>
        } />
        <Route path="/blog/:slug" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <BlogPost />
          </motion.div>
        } />
        <Route path="/about" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <About />
          </motion.div>
        } />
        <Route path="/careers" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Careers />
          </motion.div>
        } />
        <Route path="/contact" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Contact />
          </motion.div>
        } />
        <Route path="/help" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Help />
          </motion.div>
        } />
        <Route path="/privacy" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Privacy />
          </motion.div>
        } />
        <Route path="/terms" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Terms />
          </motion.div>
        } />
        
        {/* Auth Routes */}
        <Route path="/login" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Login />
          </motion.div>
        } />
        <Route path="/signup" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <SignUp />
          </motion.div>
        } />
        <Route path="/forgot-password" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ForgotPasswordPage />
          </motion.div>
        } />
        <Route path="/verify-email" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <VerifyEmail />
          </motion.div>
        } />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Dashboard />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/builder/:id?" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Builder />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Profile />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Settings />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/ats-scanner" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ATSScanner />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/analytics" element={
          <PrivateRoute requirePremium>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Analytics />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/cover-letter" element={
          <PrivateRoute requirePremium>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <CoverLetter />
            </motion.div>
          </PrivateRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <AdminRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Admin />
            </motion.div>
          </AdminRoute>
        } />
        
        {/* 404 */}
        <Route path="*" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <NotFound />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// Lazy load VerifyEmail and CoverLetter pages
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const CoverLetter = lazy(() => import('./pages/CoverLetter'));

function App() {
  // Theme initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Online/Offline status
  useEffect(() => {
    const handleOnline = () => {
      document.body.classList.remove('offline');
      // Show reconnected toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success('You are back online!', { id: 'online-status', icon: '🌐' });
      });
    };
    
    const handleOffline = () => {
      document.body.classList.add('offline');
      // Show offline toast
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('You are offline. Some features may be unavailable.', { 
          id: 'online-status', 
          icon: '📴',
          duration: Infinity 
        });
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial offline class
    if (!navigator.onLine) {
      document.body.classList.add('offline');
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Prefetch critical routes
  useEffect(() => {
    const preloadRoutes = ['/dashboard', '/builder', '/templates'];
    preloadRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, []);

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
                      <DndProvider backend={HTML5Backend}>
                        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
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
                              className: '!bg-white/80 dark:!bg-gray-800/80 !backdrop-blur-xl !border !border-gray-200/50 dark:!border-gray-700/50 !shadow-xl !rounded-xl',
                              duration: 4000,
                              success: {
                                icon: '✅',
                                className: '!bg-green-50/80 dark:!bg-green-900/30 !border-green-200 dark:!border-green-800',
                              },
                              error: {
                                icon: '❌',
                                className: '!bg-red-50/80 dark:!bg-red-900/30 !border-red-200 dark:!border-red-800',
                              },
                              loading: {
                                icon: '⏳',
                                className: '!bg-blue-50/80 dark:!bg-blue-900/30 !border-blue-200 dark:!border-blue-800',
                              },
                            }}
                          />
                          
                          {/* Development Mode Indicator */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="fixed bottom-4 left-4 z-50 opacity-40 hover:opacity-100 transition-opacity">
                              <div className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                                <span>🛠️</span>
                                <span>Development Mode</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Offline Indicator */}
                          <div className="offline-indicator fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-sm z-50 transform -translate-y-full transition-transform duration-300">
                            ⚠️ You are currently offline. Some features may be unavailable.
                          </div>
                        </div>
                      </DndProvider>
                    </ResumeProvider>
                  </NotificationProvider>
                </SettingsProvider>
              </AuthProvider>
            </ThemeProvider>
          </Router>
          
          {/* React Query DevTools (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
          )}
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;