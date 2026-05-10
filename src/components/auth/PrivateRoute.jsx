import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';
import { FiLock, FiAlertCircle, FiLogIn, FiMail, FiShield, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const EMAIL_VERIFICATION_POLL_INTERVAL = 3000; // 3 seconds
const EMAIL_VERIFICATION_MAX_POLLS = 20; // 1 minute max
const RESEND_COOLDOWN_SECONDS = 60;

// ── Custom Hook: Email Verification Polling ─────────────────────────────────

/**
 * Polls for email verification status and provides manual check capability.
 * FIXED: Replaces window.location.reload() with proper polling and real-time listener.
 */
const useEmailVerificationPoller = (user, isEmailVerified) => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  const startPolling = useCallback(() => {
    if (isEmailVerified || pollCount >= EMAIL_VERIFICATION_MAX_POLLS) return;
    
    setIsPolling(true);
    
    pollIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      
      try {
        // Force refresh the user's ID token to get latest claims
        if (user) {
          await user.reload();
          const updatedUser = user;
          
          setPollCount(prev => prev + 1);
          
          if (updatedUser.emailVerified) {
            stopPolling();
            // Force refresh the auth state
            await user.getIdToken(true);
            return;
          }
        }
      } catch (error) {
        console.error('Email verification poll failed:', error);
      }
      
      setPollCount(prev => {
        if (prev >= EMAIL_VERIFICATION_MAX_POLLS) {
          stopPolling();
          return prev;
        }
        return prev + 1;
      });
    }, EMAIL_VERIFICATION_POLL_INTERVAL);
  }, [user, isEmailVerified, pollCount]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const manualCheck = useCallback(async () => {
    if (!user) return;
    
    try {
      await user.reload();
      await user.getIdToken(true);
      toast.success('Verification status updated!', {
        icon: '✅',
        duration: 2000,
      });
    } catch (error) {
      console.error('Manual verification check failed:', error);
      toast.error('Failed to check verification status');
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Start polling if email is not verified
    if (!isEmailVerified && user) {
      startPolling();
    }
    
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [isEmailVerified, user, startPolling, stopPolling]);

  return {
    isPolling,
    pollCount,
    pollsRemaining: EMAIL_VERIFICATION_MAX_POLLS - pollCount,
    manualCheck,
    startPolling,
    stopPolling,
  };
};

// ── Component ───────────────────────────────────────────────────────────────

const PrivateRoute = ({ 
  children, 
  redirectTo = '/login',
  requireEmailVerified = false,
  allowedRoles = null,
  fallbackComponent = null,
  onAccessDenied = null,
  requirePremium = false,
}) => {
  const { user, loading, initializing, isEmailVerified, userRole, sendVerificationEmail } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [tokenExpired, setTokenExpired] = useState(false);
  
  const { isPolling, pollsRemaining, manualCheck, startPolling } = useEmailVerificationPoller(user, isEmailVerified);
  
  const accessDeniedRef = useRef(null);

  // FIXED: Cooldown timer with cleanup
  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setTimeout(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Proactive ID token refresh — do not treat transient errors as session loss
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiration = async () => {
      try {
        await user.getIdToken(true);
        const token = await user.getIdTokenResult();
        const expirationTime = new Date(token.expirationTime).getTime();
        const now = Date.now();
        const timeUntilExpiry = expirationTime - now;

        if (timeUntilExpiry <= 0) {
          setTokenExpired(true);
          toast.error('Your session has expired. Please sign in again.');
        }
      } catch (error) {
        const code = error?.code || '';
        if (
          code === 'auth/user-token-expired' ||
          code === 'auth/user-disabled' ||
          code === 'auth/invalid-user-token'
        ) {
          setTokenExpired(true);
          toast.error('Your session has expired. Please sign in again.');
          return;
        }
        console.error('Token check failed:', error);
      }
    };

    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const authBusy = loading || initializing;

  // Toast once when redirecting unauthenticated users (avoid spam on re-renders)
  useEffect(() => {
    if (authBusy || user || tokenExpired) return;
    toast.error('Please sign in to access this page', {
      icon: '🔒',
      id: 'auth-required',
      duration: 4000,
    });
  }, [authBusy, user, tokenExpired]);

  // Log access attempt for analytics
  useEffect(() => {
    if (!authBusy && user && !tokenExpired) {
      const logAccess = async () => {
        try {
          console.info(
            `[Private Route] Access: ${user.email} to ${location.pathname} at ${new Date().toISOString()}`
          );
          
          // In production, send to your analytics/logging service
          // await logRouteAccess({
          //   userId: user.uid,
          //   email: user.email,
          //   path: location.pathname,
          //   timestamp: new Date().toISOString(),
          // });
        } catch (error) {
          if (IS_DEVELOPMENT) {
            console.error('Failed to log route access:', error);
          }
        }
      };
      
      logAccess();
    }
  }, [authBusy, user, location.pathname, tokenExpired]);

  // FIXED: Enhanced role-based access check
  const hasRequiredRole = useCallback(() => {
    if (!allowedRoles) return true;
    if (!user || !userRole) return false;
    
    // Check for premium requirement
    if (requirePremium && userRole !== 'premium' && userRole !== 'admin') {
      return false;
    }
    
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(userRole);
    }
    
    return userRole === allowedRoles;
  }, [user, userRole, allowedRoles, requirePremium]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before requesting again`);
      return;
    }

    setIsVerifying(true);
    
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox and spam folder.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      
      // Restart polling after resend
      startPolling();
    } catch (error) {
      console.error('Failed to send verification email:', error);
      
      let errorMessage = 'Failed to send verification email. Please try again.';
      
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
          setResendCooldown(120); // 2 minutes cooldown on rate limit
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // FIXED: Handle back navigation safely
  const handleGoBack = useCallback(() => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // FIXED: Handle access denied callback
  const handleAccessDenied = useCallback((details) => {
    if (onAccessDenied) {
      onAccessDenied(details);
    }
    
    // Log access denied event
    if (IS_DEVELOPMENT) {
      console.warn('[Private Route] Access denied:', details);
    }
  }, [onAccessDenied]);

  // ── Render States ──────────────────────────────────────────────────────────

  // Loading state — wait for Firebase auth + first profile hydration
  if (authBusy) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        role="status"
        aria-live="polite"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <FiShield className="w-16 h-16 text-primary-500 mx-auto" />
          </motion.div>
          <Loader size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
            Verifying access...
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Please wait while we check your credentials
          </p>
        </motion.div>
      </div>
    );
  }

  // FIXED: Token expired - redirect to login
  if (tokenExpired) {
    handleAccessDenied({ reason: 'token_expired', path: location.pathname });
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: 'Your session has expired. Please sign in again.',
          returnPath: location.pathname,
          reason: 'token_expired',
        }} 
        replace 
      />
    );
  }

  // Not authenticated - redirect to login with return path
  if (!user) {
    handleAccessDenied({ reason: 'not_authenticated', path: location.pathname });

    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: 'Please sign in to access this page',
          returnPath: location.pathname,
        }} 
        replace 
      />
    );
  }

  // Email verification check
  if (requireEmailVerified && !isEmailVerified) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
        >
          <div className="max-w-md w-full">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="glass-card p-8 text-center"
            >
              {/* Icon */}
              <div className="relative mb-6">
                <motion.div 
                  className="absolute inset-0 bg-yellow-500/20 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <FiMail className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 gradient-text">
                Verify Your Email
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please verify your email address to access this page.
              </p>

              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verification email sent to:
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-200 break-all">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Check your inbox and spam folder. 
                  {isPolling && (
                    <span className="text-primary-500 ml-1">
                      Automatically checking...
                    </span>
                  )}
                </p>
              </div>

              {/* FIXED: Verification Status */}
              {isPolling && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Waiting for verification... ({pollsRemaining} checks remaining)</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  loading={isVerifying}
                  disabled={resendCooldown > 0}
                  className="w-full"
                  icon={<FiMail className="w-4 h-4" />}
                >
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : 'Resend Verification Email'}
                </Button>
                
                {/* FIXED: Manual check button instead of page reload */}
                <Button
                  variant="outline"
                  onClick={manualCheck}
                  loading={isPolling}
                  className="w-full"
                  icon={<FiCheckCircle className="w-4 h-4" />}
                >
                  Check Verification Status
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard', { replace: true })}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-400 mt-4">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => navigate('/contact', { 
                    state: { subject: 'Email Verification Issue' }
                  })}
                  className="text-primary-500 hover:text-primary-600 underline"
                >
                  contact support
                </button>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Role-based or premium access check
  if ((allowedRoles && !hasRequiredRole()) || (requirePremium && userRole !== 'premium' && userRole !== 'admin')) {
    handleAccessDenied({ 
      reason: requirePremium ? 'premium_required' : 'insufficient_permissions', 
      path: location.pathname,
      requiredRoles: allowedRoles,
      userRole,
    });

    // Show fallback component if provided
    if (fallbackComponent) {
      return fallbackComponent;
    }

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20"
        >
          <div className="max-w-md w-full" ref={accessDeniedRef}>
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="glass-card p-8 text-center"
            >
              {/* Icon */}
              <div className="relative mb-6">
                <motion.div 
                  className="absolute inset-0 bg-red-500/20 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  {requirePremium ? (
                    <FiLock className="w-10 h-10 text-white" />
                  ) : (
                    <FiLock className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 gradient-text">
                {requirePremium ? 'Premium Required' : 'Access Denied'}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {requirePremium 
                  ? 'This feature requires a premium account.' 
                  : "You don't have permission to access this page."}
              </p>
              
              {allowedRoles && !requirePremium && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  This area requires{' '}
                  <span className="font-medium">
                    {Array.isArray(allowedRoles) 
                      ? allowedRoles.join(' or ') 
                      : allowedRoles}
                  </span>{' '}
                  access.
                </p>
              )}

              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Signed in as:
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-200 break-all">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current plan: {userRole || 'Free'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {requirePremium && userRole !== 'premium' && (
                  <Button
                    onClick={() => navigate('/pricing', { replace: true })}
                    className="w-full"
                  >
                    Upgrade to Premium
                  </Button>
                )}
                
                <Button
                  onClick={() => navigate('/dashboard', { replace: true })}
                  variant={requirePremium ? 'outline' : 'primary'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleGoBack}
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>

              {/* Help Link */}
              <p className="text-xs text-gray-400 mt-4">
                Think this is a mistake?{' '}
                <button
                  onClick={() => navigate('/contact', {
                    state: { subject: 'Access Issue' }
                  })}
                  className="text-primary-500 hover:text-primary-600 underline"
                >
                  Contact Support
                </button>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // FIXED: Development indicator - completely stripped in production
  if (IS_DEVELOPMENT) {
    return (
      <>
        <div className="fixed bottom-4 left-4 z-50 opacity-20 hover:opacity-100 transition-opacity duration-200">
          <div className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
            <FiShield className="w-3.5 h-3.5" />
            <span>Private Route</span>
            {allowedRoles && (
              <span>• {Array.isArray(allowedRoles) ? allowedRoles.join('/') : allowedRoles}</span>
            )}
          </div>
        </div>
        
        {children}
      </>
    );
  }

  // Production: authenticated and authorized - render children
  return <>{children}</>;
};

// ── Higher-Order Component ──────────────────────────────────────────────────

export const withPrivateRoute = (WrappedComponent, options = {}) => {
  const WithPrivateRoute = (props) => {
    return (
      <PrivateRoute {...options}>
        <WrappedComponent {...props} />
      </PrivateRoute>
    );
  };
  
  WithPrivateRoute.displayName = `WithPrivateRoute(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return WithPrivateRoute;
};

// ── Custom Hook ─────────────────────────────────────────────────────────────

export const useRouteAccess = () => {
  const { user, loading, initializing, isEmailVerified, userRole } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: loading || initializing,
    isEmailVerified,
    userRole,
    canAccess: (options = {}) => {
      if (!user) return false;
      if (options.requireEmailVerified && !isEmailVerified) return false;
      if (options.requirePremium && userRole !== 'premium' && userRole !== 'admin') return false;
      if (options.allowedRoles) {
        if (Array.isArray(options.allowedRoles)) {
          return options.allowedRoles.includes(userRole);
        }
        return userRole === options.allowedRoles;
      }
      return true;
    },
  };
};

export default PrivateRoute;
