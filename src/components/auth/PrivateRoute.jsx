import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';
import { FiLock, FiAlertCircle, FiLogIn, FiMail, FiShield } from 'react-icons/fi';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const PrivateRoute = ({ 
  children, 
  redirectTo = '/login',
  requireEmailVerified = false,
  allowedRoles = null,
  fallbackComponent = null,
  onAccessDenied = null
}) => {
  const { user, loading, isEmailVerified, userRole, sendVerificationEmail } = useAuth();
  const location = useLocation();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for resend verification
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Log access attempt for analytics
  useEffect(() => {
    if (!loading && user) {
      const logAccess = async () => {
        try {
          console.info(`[Private Route] Access: ${user.email} to ${location.pathname} at ${new Date().toISOString()}`);
          // You can send this to your analytics service
        } catch (error) {
          console.error('Failed to log route access:', error);
        }
      };
      logAccess();
    }
  }, [loading, user, location.pathname]);

  // Check role-based access
  const hasRequiredRole = () => {
    if (!allowedRoles) return true;
    if (!userRole) return false;
    
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(userRole);
    }
    return userRole === allowedRoles;
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before requesting again`);
      return;
    }

    setIsVerifying(true);
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      console.error('Failed to send verification email:', error);
      
      let errorMessage = 'Failed to send verification email.';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // Loading state with professional loader
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="mb-6">
            <FiShield className="w-16 h-16 text-primary-500 mx-auto animate-pulse" />
          </div>
          <Loader size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Verifying access...
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Please wait while we check your credentials
          </p>
        </motion.div>
      </div>
    );
  }

  // Not authenticated - redirect to login with return path
  if (!user) {
    // Call onAccessDenied callback if provided
    if (onAccessDenied) {
      onAccessDenied({ reason: 'not_authenticated', path: location.pathname });
    }

    toast.error('Please sign in to access this page', {
      icon: '🔒',
      id: 'auth-required'
    });

    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: 'Please sign in to access this page',
          returnPath: location.pathname
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
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
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
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Check your inbox and spam folder
                </p>
              </div>

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
                
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  I've Verified My Email
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-400 mt-4">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => toast.success('Support request sent', { icon: '📧' })}
                  className="text-primary-500 hover:text-primary-600"
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

  // Role-based access check
  if (allowedRoles && !hasRequiredRole()) {
    // Call onAccessDenied callback if provided
    if (onAccessDenied) {
      onAccessDenied({ 
        reason: 'insufficient_permissions', 
        path: location.pathname,
        requiredRoles: allowedRoles,
        userRole 
      });
    }

    // Show access denied with fallback component or default UI
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
          <div className="max-w-md w-full">
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="glass-card p-8 text-center"
            >
              {/* Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <FiLock className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 gradient-text">
                Access Denied
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                You don't have permission to access this page.
              </p>
              
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                This area requires{' '}
                {Array.isArray(allowedRoles) 
                  ? allowedRoles.join(' or ') 
                  : allowedRoles} access.
              </p>

              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Signed in as:
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current role: {userRole || 'user'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>

              {/* Help Link */}
              <p className="text-xs text-gray-400 mt-4">
                Think this is a mistake?{' '}
                <button
                  onClick={() => toast.success('Support request sent', { icon: '📧' })}
                  className="text-primary-500 hover:text-primary-600"
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

  // Show access granted indicator (optional)
  const showAccessIndicator = process.env.NODE_ENV === 'development';

  // Authenticated and authorized - render children
  return (
    <>
      {showAccessIndicator && (
        <div className="fixed bottom-4 left-4 z-50 opacity-30 hover:opacity-100 transition-opacity">
          <div className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
            <FiShield className="w-3.5 h-3.5" />
            <span>Private Route</span>
            {allowedRoles && <span>• {Array.isArray(allowedRoles) ? allowedRoles.join('/') : allowedRoles}</span>}
          </div>
        </div>
      )}
      
      {children}
    </>
  );
};

// HOC for protecting components
export const withPrivateRoute = (WrappedComponent, options = {}) => {
  return function WithPrivateRoute(props) {
    return (
      <PrivateRoute {...options}>
        <WrappedComponent {...props} />
      </PrivateRoute>
    );
  };
};

// Custom hook for route access checks
export const useRouteAccess = () => {
  const { user, loading, isEmailVerified, userRole } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    isEmailVerified,
    userRole,
    canAccess: (options = {}) => {
      if (!user) return false;
      if (options.requireEmailVerified && !isEmailVerified) return false;
      if (options.allowedRoles) {
        if (Array.isArray(options.allowedRoles)) {
          return options.allowedRoles.includes(userRole);
        }
        return userRole === options.allowedRoles;
      }
      return true;
    }
  };
};

export default PrivateRoute;