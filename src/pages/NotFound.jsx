import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiArrowLeft, FiSearch, FiFileText, FiStar } from 'react-icons/fi';
import { usePageTitle } from '../hooks/useDocumentTitle';
import Button from '../components/ui/Button';
import MainLayout from '../layouts/MainLayout';

// ── Constants ─────────────────────────────────────────────────────────────

const POPULAR_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/builder', label: 'Resume Builder', icon: FiFileText },
  { to: '/templates', label: 'Templates', icon: FiStar },
  { to: '/pricing', label: 'Pricing', icon: FiStar },
  { to: '/blog', label: 'Blog', icon: FiFileText },
  { to: '/help', label: 'Help Center', icon: FiSearch },
];

// ── Component ─────────────────────────────────────────────────────────────

const NotFound = () => {
  const navigate = useNavigate();

  // Set page title
  usePageTitle({
    title: '404 - Page Not Found',
    description: 'The page you\'re looking for doesn\'t exist or has been moved. Navigate back to ResumeAI Pro.',
  });

  // FIXED: Safe back navigation
  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-lg"
        >
          {/* 404 Display */}
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-8xl sm:text-9xl font-bold gradient-text mb-4 select-none"
          >
            404
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button onClick={handleGoBack} variant="outline" icon={<FiArrowLeft />}>
              Go Back
            </Button>
            <Link to="/">
              <Button icon={<FiHome />}>
                Home Page
              </Button>
            </Link>
          </div>

          {/* Popular Pages */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
                Popular Pages
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {POPULAR_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-sm text-gray-700 dark:text-gray-300"
              >
                <Icon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Help Link */}
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Still lost?{' '}
            <Link to="/help" className="text-primary-500 hover:text-primary-600 font-medium">
              Visit our Help Center
            </Link>
            {' '}or{' '}
            <Link to="/contact" className="text-primary-500 hover:text-primary-600 font-medium">
              Contact Support
            </Link>
          </p>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default NotFound;