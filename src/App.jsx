import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ResumeProvider } from './contexts/ResumeContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';
import { logAnalyticsEvent } from './services/firebase';
import { useAuth } from './hooks/useAuth';
import './styles/globals.css';
import './styles/animations.css';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Builder = lazy(() => import('./pages/Builder'));
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

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Analytics wrapper component
const AnalyticsTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    logAnalyticsEvent('page_view', {
      page_path: location.pathname,
      page_title: document.title,
      user_id: user?.uid || null,
      timestamp: new Date().toISOString(),
    });
  }, [location, user]);

  return null;
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

// Loading fallback component
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

// Route transition animation
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
};

// Animated Routes component
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

function App() {
  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      document.body.classList.remove('offline');
    };
    
    const handleOffline = () => {
      document.body.classList.add('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Preload critical routes
  useEffect(() => {
    const preloadRoutes = ['/dashboard', '/builder'];
    preloadRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <ResumeProvider>
                  <SettingsProvider>
                    <DndProvider backend={HTML5Backend}>
                      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
                        <AnalyticsTracker />
                        <ScrollToTop />
                        
                        <Suspense fallback={<PageLoader />}>
                          <AnimatedRoutes />
                        </Suspense>
                        
                        {/* Toast Notifications */}
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
                        <div className="offline-indicator fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-sm z-50 transform -translate-y-full transition-transform">
                          You are currently offline. Some features may be unavailable.
                        </div>
                      </div>
                    </DndProvider>
                  </SettingsProvider>
                </ResumeProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
        
        {/* React Query DevTools (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;