import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiAlertTriangle, 
  FiRefreshCw, 
  FiHome, 
  FiCopy, 
  FiChevronLeft,
  FiSend
} from 'react-icons/fi';
import ErrorBoundary from './ErrorBoundary';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

// ── Fallback UI Component ──────────────────────────────────────────────────

const RouteErrorFallback = ({ 
  error, 
  errorInfo, 
  errorId, 
  reset, 
  reload,
  title = 'Something went wrong on this page',
  message = 'An unexpected error occurred while loading this page.',
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const handleReset = async () => {
    setIsRecovering(true);
    await reset?.();
    setIsRecovering(false);
  };

  const handleReload = () => {
    reload?.();
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCopyError = async () => {
    const errorReport = [
      `Error ID: ${errorId || 'N/A'}`,
      `Message: ${error?.message || 'Unknown error'}`,
      `URL: ${window.location.href}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(errorReport);
      setCopied(true);
      toast.success('Error details copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy error details');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <div className="glass-card p-6 sm:p-8 text-center">
          {/* Error Icon */}
          <div className="relative mb-6">
            <motion.div 
              className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <FiAlertTriangle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Error Message */}
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            {message}
          </p>

          {/* Error ID (for support) */}
          {errorId && (
            <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Error ID:{' '}
                <code className="font-mono text-gray-700 dark:text-gray-300 select-all">
                  {errorId}
                </code>
              </p>
              {error?.message && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                  {error.message}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleReset}
              loading={isRecovering}
              disabled={isRecovering}
              icon={<FiRefreshCw className={isRecovering ? 'animate-spin' : ''} />}
              className="w-full"
            >
              {isRecovering ? 'Recovering...' : 'Try Again'}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleGoHome}
                icon={<FiHome />}
              >
                Go Home
              </Button>
              <Button
                variant="outline"
                onClick={handleGoBack}
                icon={<FiChevronLeft />}
              >
                Go Back
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyError}
                icon={copied ? <FiSend /> : <FiCopy />}
                className="flex-1"
              >
                {copied ? 'Copied!' : 'Copy Error Info'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReload}
                icon={<FiRefreshCw />}
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
            If this keeps happening, please{' '}
            <a 
              href="mailto:support@resumeaipro.com"
              className="text-primary-500 hover:text-primary-600 underline"
            >
              contact support
            </a>
            {' '}and include the error ID above.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ── RouteErrorBoundary Component ───────────────────────────────────────────

/**
 * A pre-configured error boundary for route-level error isolation.
 * 
 * @example
 * <RouteErrorBoundary>
 *   <MyPageComponent />
 * </RouteErrorBoundary>
 * 
 * @example
 * // With custom props
 * <RouteErrorBoundary 
 *   title="Dashboard Error"
 *   message="We couldn't load your dashboard."
 *   onReset={() => clearCache()}
 * >
 *   <Dashboard />
 * </RouteErrorBoundary>
 */
const RouteErrorBoundary = ({ 
  children,
  title,
  message,
  onReset,
  showHomeButton = true,
  showReloadButton = true,
}) => {
  return (
    <ErrorBoundary
      onReset={onReset}
      maxRecoveryAttempts={2}
      fallback={(errorProps) => (
        <RouteErrorFallback 
          {...errorProps}
          title={title}
          message={message}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// ── Named Exports for Different Use Cases ──────────────────────────────────

/**
 * Error boundary specifically for lazy-loaded components.
 */
export const LazyRouteErrorBoundary = ({ children, componentName = 'component' }) => (
  <RouteErrorBoundary
    title={`Failed to load ${componentName}`}
    message={`The ${componentName} could not be loaded. This might be a network issue.`}
  >
    {children}
  </RouteErrorBoundary>
);

/**
 * Error boundary for data-fetching pages.
 */
export const DataRouteErrorBoundary = ({ children, pageName = 'page' }) => (
  <RouteErrorBoundary
    title={`Couldn't load ${pageName} data`}
    message={`We encountered an error while fetching data for this ${pageName}.`}
  >
    {children}
  </RouteErrorBoundary>
);

export default RouteErrorBoundary;