import React, { Component } from 'react';
import { 
  FiAlertTriangle, 
  FiRefreshCw, 
  FiHome, 
  FiCopy, 
  FiCheck, 
  FiSend,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import toast from 'react-hot-toast';
import { logAnalyticsEvent } from '../../services/firebase';

// ── Constants ───────────────────────────────────────────────────────────────
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// ── Error Boundary Class ────────────────────────────────────────────────────

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
      showDetails: IS_DEVELOPMENT, // Auto-show in dev
      recoveryAttempts: 0,
      isRecovering: false,
    };
    
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Track error frequency
    this.errorCount++;
    this.lastErrorTime = Date.now();

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error to console
    if (IS_DEVELOPMENT) {
      console.group('❌ Error caught by ErrorBoundary');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', errorId);
      console.groupEnd();
    }

    // Log to analytics
    this.logErrorToAnalytics(error, errorInfo, errorId);

    // Send to error tracking service
    if (IS_PRODUCTION) {
      this.sendToErrorTracking(error, errorInfo, errorId);
    }
  }

  componentDidUpdate(prevProps) {
    // Reset error state if children change (new content might work)
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    // Clean up any pending operations
    this.setState = () => {};
  }

  // ── Error Logging ──────────────────────────────────────────────────────

  logErrorToAnalytics = (error, errorInfo, errorId) => {
    try {
      // Use imported module instead of require
      if (typeof logAnalyticsEvent === 'function') {
        logAnalyticsEvent('app_error', {
          error_message: error?.message?.substring(0, 500) || 'Unknown error',
          error_name: error?.name || 'Error',
          error_id: errorId,
          component_stack: errorInfo?.componentStack?.substring(0, 500) || '',
          url: window.location?.href || '',
          route: window.location?.pathname || '',
          error_count: this.errorCount,
          timestamp: new Date().toISOString(),
        });
      }

      // Google Analytics fallback
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: `ErrorBoundary: ${error?.message || 'Unknown error'}`,
          fatal: true,
          error_id: errorId,
        });
      }
    } catch (loggingError) {
      // Silently fail - don't crash the error handler
      if (IS_DEVELOPMENT) {
        console.warn('Failed to log error to analytics:', loggingError);
      }
    }
  };

  sendToErrorTracking = (error, errorInfo, errorId) => {
    try {
      // Sentry integration
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(error, {
          tags: {
            error_boundary: true,
            error_id: errorId,
          },
          extra: {
            componentStack: errorInfo?.componentStack,
            errorId,
            errorCount: this.errorCount,
            url: window.location?.href,
          },
        });
      }
    } catch (trackingError) {
      if (IS_DEVELOPMENT) {
        console.warn('Failed to send error to tracking service:', trackingError);
      }
    }
  };

  // ── Reset Handlers ─────────────────────────────────────────────────────

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
      showDetails: IS_DEVELOPMENT,
      isRecovering: false,
    });
  };

  handleReset = () => {
    const maxAttempts = this.props.maxRecoveryAttempts ?? 3;
    
    if (this.state.recoveryAttempts >= maxAttempts) {
      // Too many recovery attempts, reload page
      toast.error('Unable to recover. Reloading page...', {
        id: 'error-recovery-failed',
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return;
    }

    this.setState(prev => ({
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1,
    }));

    // Try to reset without reload first
    this.resetError();
    
    // Call optional onReset callback
    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
      } catch (callbackError) {
        if (IS_DEVELOPMENT) {
          console.warn('Error in onReset callback:', callbackError);
        }
      }
    }

    this.setState({ isRecovering: false });
    
    toast.success('Attempting to recover...', {
      id: 'error-recovery',
      duration: 2000,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  // ── Error Report Handlers ──────────────────────────────────────────────

  handleCopyError = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorReport = [
      `Error ID: ${errorId}`,
      `Type: ${error?.name || 'Error'}`,
      `Message: ${error?.message || 'Unknown error'}`,
      `Stack: ${error?.stack || 'Not available'}`,
      `Component: ${errorInfo?.componentStack || 'Not available'}`,
      `URL: ${window.location?.href || 'Unknown'}`,
      `User Agent: ${navigator?.userAgent || 'Unknown'}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Recovery Attempts: ${this.state.recoveryAttempts}`,
    ].join('\n');

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(errorReport);
        this.setState({ copied: true });
        toast.success('Error details copied to clipboard');
        setTimeout(() => this.setState({ copied: false }), 2000);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = errorReport;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        this.setState({ copied: true });
        toast.success('Error details copied to clipboard');
        setTimeout(() => this.setState({ copied: false }), 2000);
      }
    } catch (copyError) {
      toast.error('Failed to copy error details. Please take a screenshot.');
    }
  };

  handleReportError = () => {
    const { error, errorId } = this.state;
    
    const subject = encodeURIComponent(`Error Report: ${errorId}`);
    const body = encodeURIComponent([
      `Error ID: ${errorId}`,
      `Message: ${error?.message || 'Unknown'}`,
      `URL: ${window.location?.href || ''}`,
      `Timestamp: ${new Date().toISOString()}`,
      '',
      'Please describe what you were doing when this error occurred:',
      '',
      '',
    ].join('\n'));

    window.location.href = `mailto:support@resumeaipro.com?subject=${subject}&body=${body}`;
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  // ── Render ─────────────────────────────────────────────────────────────

  render() {
    const { 
      hasError, 
      error, 
      errorInfo, 
      errorId, 
      copied, 
      showDetails, 
      isRecovering 
    } = this.state;
    
    const { 
      fallback, 
      showHomeButton = true, 
      showReportButton = true,
      showReloadButton = true,
      title = 'Something went wrong',
      message = "We apologize for the inconvenience. Our team has been automatically notified.",
      resetLabel = 'Try Again',
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback({ 
          error, 
          errorInfo, 
          errorId, 
          reset: this.handleReset, 
          reload: this.handleReload,
        });
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <Card className="max-w-lg w-full text-center p-6 sm:p-8">
            {/* Error Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <FiAlertTriangle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>

            {/* Error ID (Production) */}
            {errorId && IS_PRODUCTION && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Reference ID:{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-xs select-all">
                  {errorId}
                </code>
              </p>
            )}

            {/* Error Details Toggle (Development & Production with toggle) */}
            {error && (
              <div className="mb-6">
                <button
                  onClick={this.toggleDetails}
                  className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 transition-colors mb-2"
                  type="button"
                >
                  {showDetails ? (
                    <>
                      <FiChevronUp className="w-4 h-4" />
                      Hide Technical Details
                    </>
                  ) : (
                    <>
                      <FiChevronDown className="w-4 h-4" />
                      Show Technical Details
                    </>
                  )}
                </button>
                
                {showDetails && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left border border-red-200 dark:border-red-800 max-h-60 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-red-50 dark:bg-red-900/20 pb-2">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        Error Details
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={this.handleCopyError}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-800/30 rounded transition-colors"
                          title="Copy error details"
                          type="button"
                        >
                          {copied ? (
                            <FiCheck className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <FiCopy className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Error:</p>
                        <p className="text-sm font-mono text-red-700 dark:text-red-300 break-all">
                          {error.toString()}
                        </p>
                      </div>
                      
                      {error.stack && (
                        <div>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Stack Trace:</p>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32 p-2 bg-black/5 dark:bg-white/5 rounded whitespace-pre-wrap break-all">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      
                      {errorInfo?.componentStack && (
                        <div>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Component Stack:</p>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32 p-2 bg-black/5 dark:bg-white/5 rounded whitespace-pre-wrap">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recovery Attempts Warning */}
            {this.state.recoveryAttempts > 1 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">
                Recovery attempted {this.state.recoveryAttempts} times. 
                {this.state.recoveryAttempts >= 3 && ' Consider reloading the page.'}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button 
                onClick={this.handleReset} 
                icon={<FiRefreshCw className={isRecovering ? 'animate-spin' : ''} />} 
                variant="primary"
                loading={isRecovering}
                disabled={isRecovering}
              >
                {isRecovering ? 'Recovering...' : resetLabel}
              </Button>
              
              {showReloadButton && (
                <Button 
                  onClick={this.handleReload} 
                  variant="outline"
                  icon={<FiRefreshCw />}
                >
                  Reload Page
                </Button>
              )}
              
              {showHomeButton && (
                <Button 
                  onClick={this.handleGoHome} 
                  variant="outline" 
                  icon={<FiHome />}
                >
                  Go Home
                </Button>
              )}
              
              {showReportButton && (
                <Button 
                  onClick={this.handleReportError} 
                  variant="ghost" 
                  icon={<FiSend />}
                >
                  Report Issue
                </Button>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
              If the problem persists, please contact{' '}
              <a 
                href="mailto:support@resumeaipro.com" 
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:underline"
              >
                support@resumeaipro.com
              </a>
              {errorId && IS_PRODUCTION && (
                <> and reference ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{errorId}</code></>
              )}
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Higher-Order Component ──────────────────────────────────────────────────

/**
 * Wraps a component with ErrorBoundary.
 * 
 * @example
 * export default withErrorBoundary(MyComponent, {
 *   title: 'MyComponent Error',
 *   onReset: () => console.log('Resetting...'),
 * });
 */
export const withErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
  const WithErrorBoundary = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
  
  WithErrorBoundary.displayName = `WithErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return WithErrorBoundary;
};

// ── Functional Wrapper ──────────────────────────────────────────────────────

export const ErrorBoundaryWrapper = ({ children, ...props }) => (
  <ErrorBoundary {...props}>{children}</ErrorBoundary>
);

export default ErrorBoundary;
