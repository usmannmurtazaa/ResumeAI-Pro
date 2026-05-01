import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome, FiCopy, FiCheck, FiSend } from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import toast from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error to console
    console.error('❌ Error caught by boundary:', error, errorInfo);

    // Log to analytics service (if available)
    this.logErrorToAnalytics(error, errorInfo, errorId);

    // Send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(error, errorInfo, errorId);
    }
  }

  logErrorToAnalytics = (error, errorInfo, errorId) => {
    try {
      // Firebase Analytics or custom analytics
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: `Error: ${error.message}`,
          fatal: true,
          errorId,
        });
      }

      // Log to Firebase Analytics if available
      const { logAnalyticsEvent } = require('../../services/firebase');
      logAnalyticsEvent?.('app_error', {
        error_message: error.message,
        error_stack: error.stack?.substring(0, 500),
        error_id: errorId,
        component_stack: errorInfo?.componentStack?.substring(0, 500),
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to log error to analytics:', e);
    }
  };

  sendToErrorTracking = (error, errorInfo, errorId) => {
    try {
      // Sentry integration
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          extra: {
            componentStack: errorInfo?.componentStack,
            errorId,
          },
        });
      }
    } catch (e) {
      console.warn('Failed to send error to tracking service:', e);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
    });
    
    // Call optional onReset callback
    this.props.onReset?.();
    
    // Reload page if specified
    if (this.props.reloadOnReset !== false) {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorReport = `
Error ID: ${this.state.errorId}
Message: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component: ${this.state.errorInfo?.componentStack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard?.writeText(errorReport).then(() => {
      this.setState({ copied: true });
      toast.success('Error details copied to clipboard');
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {
      toast.error('Failed to copy error details');
    });
  };

  handleReportError = () => {
    const subject = encodeURIComponent(`Error Report: ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Message: ${this.state.error?.message}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
    `.trim());

    window.location.href = `mailto:support@resumeaipro.com?subject=${subject}&body=${body}`;
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, errorInfo, errorId, copied, showDetails } = this.state;
    const { fallback, showHomeButton = true, showReportButton = true } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback({ error, errorInfo, errorId, reset: this.handleReset });
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <Card className="max-w-lg w-full text-center p-8">
            {/* Error Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <FiAlertTriangle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.props.message || "We apologize for the inconvenience. Our team has been notified."}
            </p>

            {/* Error ID (Production) */}
            {errorId && process.env.NODE_ENV === 'production' && (
              <p className="text-xs text-gray-400 mb-4">
                Error ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{errorId}</code>
              </p>
            )}

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6">
                <button
                  onClick={this.toggleDetails}
                  className="text-sm text-primary-500 hover:text-primary-600 mb-2"
                >
                  {showDetails ? 'Hide' : 'Show'} Technical Details
                </button>
                
                {showDetails && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        Error Details
                      </p>
                      <button
                        onClick={this.handleCopyError}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-800/30 rounded transition-colors"
                        title="Copy error details"
                      >
                        {copied ? (
                          <FiCheck className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <FiCopy className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-mono text-red-700 dark:text-red-300 break-all">
                      {error.toString()}
                    </p>
                    {error.stack && (
                      <pre className="text-xs mt-2 text-gray-600 dark:text-gray-400 overflow-auto max-h-40 p-2 bg-black/5 dark:bg-white/5 rounded">
                        {error.stack}
                      </pre>
                    )}
                    {errorInfo?.componentStack && (
                      <>
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-3 mb-1">
                          Component Stack:
                        </p>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40 p-2 bg-black/5 dark:bg-white/5 rounded">
                          {errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={this.handleReset} icon={<FiRefreshCw />} variant="primary">
                {this.props.resetLabel || 'Refresh Page'}
              </Button>
              
              {showHomeButton && (
                <Button onClick={this.handleGoHome} variant="outline" icon={<FiHome />}>
                  Go Home
                </Button>
              )}
              
              {showReportButton && process.env.NODE_ENV === 'production' && (
                <Button onClick={this.handleReportError} variant="ghost" icon={<FiSend />}>
                  Report Issue
                </Button>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-400 mt-6">
              If the problem persists, please contact{' '}
              <a href="mailto:support@resumeaipro.com" className="text-primary-500 hover:text-primary-600">
                support@resumeaipro.com
              </a>
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-Order Component for easier usage
export const withErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

// Functional wrapper for components that prefer hooks
export const ErrorBoundaryWrapper = ({ children, ...props }) => (
  <ErrorBoundary {...props}>{children}</ErrorBoundary>
);

export default ErrorBoundary;