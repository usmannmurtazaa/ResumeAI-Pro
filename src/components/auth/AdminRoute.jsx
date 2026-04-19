import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';
import { FiShield, FiAlertCircle, FiLock, FiLogIn } from 'react-icons/fi';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const AdminRoute = ({ 
  children, 
  redirectTo = '/dashboard',
  requireVerified = true,
  allowImpersonation = false 
}) => {
  const { user, userRole, loading, isEmailVerified, signOut } = useAuth();
  const location = useLocation();
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Check if user is coming from a different route
  const fromLocation = location.state?.from?.pathname || redirectTo;

  useEffect(() => {
    // Log admin access attempt for audit
    if (!loading && user) {
      const logAccess = async () => {
        try {
          console.info(`[Admin Route] Access attempt by ${user.email} at ${new Date().toISOString()}`);
          // You can send this to your analytics or logging service
        } catch (error) {
          console.error('Failed to log admin access:', error);
        }
      };
      logAccess();
    }

    // Show unauthorized message if user is logged in but not admin
    if (!loading && user && userRole !== 'admin') {
      setShowUnauthorized(true);
      toast.error('You do not have permission to access the admin area');
      
      // Auto-redirect countdown
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, user, userRole]);

  // Handle manual redirect
  const handleManualRedirect = () => {
    window.location.href = redirectTo;
  };

  // Handle sign out and redirect to login
  const handleSignOutAndLogin = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      // Navigate will happen automatically due to auth state change
    } catch (error) {
      toast.error('Failed to sign out');
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
            Verifying admin credentials...
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Please wait while we check your permissions
          </p>
        </motion.div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location,
          message: 'Please sign in to access the admin area',
          requireAdmin: true 
        }} 
        replace 
      />
    );
  }

  // Email not verified (if required)
  if (requireVerified && !isEmailVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full glass-card p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Email Not Verified</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please verify your email address to access the admin area.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/verify-email'}
              className="w-full"
            >
              Resend Verification Email
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Unauthorized - Not an admin
  if (userRole !== 'admin') {
    return (
      <AnimatePresence>
        {showUnauthorized && (
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

                {/* Title */}
                <h2 className="text-2xl font-bold mb-2 gradient-text">
                  Access Denied
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  You don't have permission to access the admin area.
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  This area is restricted to administrators only.
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
                    Role: {userRole || 'user'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => window.location.href = fromLocation}
                    className="w-full"
                  >
                    Return to Dashboard
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleSignOutAndLogin}
                    className="w-full"
                    icon={<FiLogIn />}
                  >
                    Sign in with Different Account
                  </Button>
                </div>

                {/* Auto-redirect notice */}
                {countdown > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-400 mt-4"
                  >
                    Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                  </motion.p>
                )}

                {/* Help Link */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400">
                    Think this is a mistake?{' '}
                    <button
                      onClick={() => toast.success('Support request sent', {
                        icon: '📧'
                      })}
                      className="text-primary-500 hover:text-primary-600"
                    >
                      Contact Support
                    </button>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Admin verified - render children
  return (
    <>
      {/* Admin Indicator - Optional subtle indicator */}
      <div className="fixed bottom-4 right-4 z-50 opacity-30 hover:opacity-100 transition-opacity">
        <div className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
          <FiShield className="w-3.5 h-3.5" />
          <span>Admin Mode</span>
        </div>
      </div>
      
      {children}
    </>
  );
};

// HOC for protecting admin components
export const withAdminProtection = (WrappedComponent, options = {}) => {
  return function WithAdminProtection(props) {
    return (
      <AdminRoute {...options}>
        <WrappedComponent {...props} />
      </AdminRoute>
    );
  };
};

// Custom hook for admin route checks
export const useAdminAccess = () => {
  const { user, userRole, loading } = useAuth();
  
  return {
    isAdmin: userRole === 'admin',
    isLoading: loading,
    canAccess: !loading && user && userRole === 'admin',
    user,
    userRole
  };
};

export default AdminRoute;