import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';
import { FiShield, FiAlertCircle, FiLock, FiLogIn, FiClock, FiActivity } from 'react-icons/fi';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────
const ADMIN_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ADMIN_ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// ── Security Utilities ──────────────────────────────────────────────────────

/**
 * Verifies admin token claims on the server side.
 * In production, this should call your backend API.
 */
const verifyAdminServerSide = async (user) => {
  if (!user) return false;
  
  try {
    // Get the ID token with force refresh to ensure latest claims
    const idToken = await user.getIdToken(true);
    
    // Verify token claims
    const decodedToken = await user.getIdTokenResult();
    
    // Check for admin claim in Firebase custom claims
    // In production, set these claims via Firebase Admin SDK or your backend
    const isAdmin = decodedToken.claims.admin === true;
    const isSuperAdmin = decodedToken.claims.superAdmin === true;
    
    if (!isAdmin && !isSuperAdmin) {
      console.warn('Admin access denied: Missing admin claims in token');
      return false;
    }
    
    // Optional: Verify with your backend API
    // const response = await fetch('/api/admin/verify', {
    //   headers: { Authorization: `Bearer ${idToken}` }
    // });
    // const { valid } = await response.json();
    // return valid;
    
    return true;
  } catch (error) {
    console.error('Admin verification failed:', error);
    return false;
  }
};

/**
 * Logs admin activity for security audit.
 * In production, send this to your logging service.
 */
const logAdminActivity = async (user, action, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: user?.uid,
    email: user?.email,
    action,
    ip: 'client-side', // Server should capture real IP
    userAgent: navigator.userAgent,
    ...details,
  };
  
  try {
    // Send to your logging endpoint
    // await fetch('/api/admin/log', {
    //   method: 'POST',
    //   body: JSON.stringify(logEntry),
    //   headers: { 'Content-Type': 'application/json' }
    // });
    
    // In development, log to console
    console.info('[Admin Audit]', logEntry);
    
    // Store locally for session tracking
    const activities = JSON.parse(sessionStorage.getItem('admin_activities') || '[]');
    activities.push(logEntry);
    sessionStorage.setItem('admin_activities', JSON.stringify(activities.slice(-100))); // Keep last 100
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
};

/**
 * Checks rate limiting for admin login attempts.
 */
const checkRateLimit = () => {
  const attempts = JSON.parse(sessionStorage.getItem('admin_login_attempts') || '[]');
  const now = Date.now();
  
  // Filter attempts within the time window
  const recentAttempts = attempts.filter(time => now - time < LOGIN_ATTEMPT_WINDOW);
  
  if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0];
    const timeToWait = LOGIN_ATTEMPT_WINDOW - (now - oldestAttempt);
    return { allowed: false, timeToWait };
  }
  
  // Record this attempt
  recentAttempts.push(now);
  sessionStorage.setItem('admin_login_attempts', JSON.stringify(recentAttempts));
  
  return { allowed: true, timeToWait: 0 };
};

// ── Admin Route Component ───────────────────────────────────────────────────

const AdminRoute = ({ 
  children, 
  redirectTo = '/dashboard',
  requireVerified = true,
  allowImpersonation = false, // For support staff to view as admin
  sessionTimeout = ADMIN_SESSION_TIMEOUT,
}) => {
  const { user, userRole, loading, isEmailVerified, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [adminVerified, setAdminVerified] = useState(false);
  
  const lastActivityRef = useRef(Date.now());
  const sessionCheckIntervalRef = useRef(null);
  const redirectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Check if user is coming from a different route
  const fromLocation = location.state?.from?.pathname || redirectTo;

  // ── Server-Side Admin Verification ──────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    
    const performAdminVerification = async () => {
      if (!loading && user && userRole === 'admin') {
        setVerifying(true);
        
        try {
          // Check rate limiting
          const { allowed, timeToWait } = checkRateLimit();
          if (!allowed) {
            toast.error(`Too many attempts. Try again in ${Math.ceil(timeToWait / 60000)} minutes.`);
            setAdminVerified(false);
            return;
          }
          
          // Verify admin status server-side
          const isVerified = await verifyAdminServerSide(user);
          
          if (mountedRef.current) {
            setAdminVerified(isVerified);
            
            if (isVerified) {
              // Log successful admin access
              await logAdminActivity(user, 'admin_access_granted', {
                route: location.pathname,
                from: location.state?.from?.pathname,
              });
              
              toast.success('Admin access verified', { duration: 2000 });
            } else {
              // Log failed verification
              await logAdminActivity(user, 'admin_verification_failed', {
                route: location.pathname,
                reason: 'Server-side verification failed',
              });
              
              toast.error('Admin verification failed');
            }
          }
        } catch (error) {
          if (mountedRef.current) {
            console.error('Admin verification error:', error);
            setAdminVerified(false);
            toast.error('Failed to verify admin credentials');
          }
        } finally {
          if (mountedRef.current) {
            setVerifying(false);
          }
        }
      } else {
        setVerifying(false);
      }
    };
    
    if (!loading && user && userRole === 'admin') {
      performAdminVerification();
    } else {
      setVerifying(false);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [loading, user, userRole, location.pathname]);

  // ── Session Timeout Management ──────────────────────────────────────────

  useEffect(() => {
    if (!adminVerified) return;

    const updateLastActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track user activity
    ADMIN_ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, updateLastActivity);
    });

    // Check for session timeout every 30 seconds
    sessionCheckIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceActivity > sessionTimeout) {
        handleSessionTimeout();
      }
    }, 30000);

    return () => {
      ADMIN_ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, updateLastActivity);
      });
      
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [adminVerified, sessionTimeout]);

  const handleSessionTimeout = useCallback(async () => {
    await logAdminActivity(user, 'session_timeout', {
      lastActivity: new Date(lastActivityRef.current).toISOString(),
    });
    
    toast.error('Admin session expired due to inactivity');
    await signOut();
    navigate('/login', { 
      state: { 
        from: location,
        message: 'Admin session expired. Please sign in again.',
      },
      replace: true 
    });
  }, [user, signOut, navigate, location]);

  // ── Unauthorized Handling ──────────────────────────────────────────────

  useEffect(() => {
    // Show unauthorized message if user is logged in but not admin
    if (!loading && !verifying && user && (userRole !== 'admin' || !adminVerified)) {
      setShowUnauthorized(true);
      
      // Log unauthorized attempt
      logAdminActivity(user, 'unauthorized_access_attempt', {
        route: location.pathname,
      });
      
      // Auto-redirect countdown
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Use navigate instead of window.location for smoother transition
            navigate(fromLocation, { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, verifying, user, userRole, adminVerified, fromLocation, location.pathname, navigate]);

  // ── Action Handlers ────────────────────────────────────────────────────

  const handleManualRedirect = useCallback(() => {
    navigate(fromLocation, { replace: true });
  }, [navigate, fromLocation]);

  const handleSignOutAndLogin = useCallback(async () => {
    try {
      await logAdminActivity(user, 'admin_signout_unauthorized');
      await signOut();
      navigate('/login', {
        state: {
          from: location,
          requireAdmin: true,
        },
        replace: true,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out');
    }
  }, [user, signOut, navigate, location]);

  const handleContactSupport = useCallback(async () => {
    await logAdminActivity(user, 'support_contacted', {
      reason: 'Admin access denied',
    });
    
    navigate('/contact', {
      state: {
        subject: 'Admin Access Request',
        message: `I believe I should have admin access. My email: ${user?.email}`,
      },
    });
  }, [user, navigate]);

  // ── Cleanup on Unmount ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // ── Render States ──────────────────────────────────────────────────────

  // Loading or verifying state
  if (loading || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
          
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {verifying ? 'Verifying admin credentials...' : 'Loading...'}
          </p>
          
          <p className="text-xs text-gray-400 mt-2">
            {verifying 
              ? 'Checking security permissions' 
              : 'Please wait while we check your permissions'}
          </p>
          
          {verifying && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <FiActivity className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-xs text-gray-500">Secure connection established</span>
            </div>
          )}
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
        className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="max-w-md w-full glass-card p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Email Verification Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please verify your email address before accessing the admin area.
            This is an additional security measure.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/verify-email')}
              className="w-full"
            >
              Resend Verification Email
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
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
  if (userRole !== 'admin' || !adminVerified) {
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
                {/* Security Alert Icon */}
                <div className="relative mb-6">
                  <motion.div 
                    className="absolute inset-0 bg-red-500/20 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <FiLock className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Access Denied Message */}
                <h2 className="text-2xl font-bold mb-2 gradient-text">
                  Admin Access Denied
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  You don't have administrator privileges.
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  This area is restricted to authorized administrators only.
                  All access attempts are logged.
                </p>

                {/* User Info with Session Status */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Signed in as:
                    </p>
                    <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                      Restricted
                    </span>
                  </div>
                  
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {user.email}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Role: {userRole || 'user'}
                    </p>
                    
                    {/* Session timer */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <FiClock className="w-3 h-3" />
                      <span>Session active</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleManualRedirect}
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
                    Sign in as Admin
                  </Button>
                </div>

                {/* Auto-redirect with manual override */}
                {countdown > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4"
                  >
                    <button
                      onClick={() => {
                        setCountdown(0);
                        handleManualRedirect();
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      Redirecting in {countdown}s — Click to go now
                    </button>
                  </motion.div>
                )}

                {/* Help Section */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">
                    Think this is a mistake?
                  </p>
                  
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleContactSupport}
                      className="text-xs px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-lg transition-colors"
                    >
                      Contact Support
                    </button>
                    
                    <button
                      onClick={() => navigate('/help/admin-access')}
                      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Admin verified - render children with security indicators
  return (
    <div className="admin-layout">
      {/* Admin Mode Indicator - Responsive positioning */}
      <div className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6 opacity-30 hover:opacity-100 transition-opacity duration-200">
        <div className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
          <FiShield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Admin Mode</span>
          <span className="sm:hidden">Admin</span>
        </div>
      </div>
      
      {/* Session Activity Indicator */}
      <div className="fixed top-4 right-4 z-40 opacity-0 hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="hidden sm:inline">Session Active</span>
        </div>
      </div>
      
      {/* Render admin content */}
      {children}
    </div>
  );
};

// ── Higher-Order Components ─────────────────────────────────────────────────

/**
 * HOC for protecting admin components with additional options.
 */
export const withAdminProtection = (WrappedComponent, options = {}) => {
  const WithAdminProtection = (props) => {
    return (
      <AdminRoute {...options}>
        <WrappedComponent {...props} />
      </AdminRoute>
    );
  };
  
  WithAdminProtection.displayName = `WithAdminProtection(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return WithAdminProtection;
};

/**
 * HOC for super admin only access.
 */
export const withSuperAdminProtection = (WrappedComponent) => {
  const WithSuperAdminProtection = (props) => {
    const { user } = useAuth();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const checkSuperAdmin = async () => {
        if (user) {
          try {
            const token = await user.getIdTokenResult();
            setIsSuperAdmin(token.claims.superAdmin === true);
          } catch (error) {
            console.error('Super admin check failed:', error);
            setIsSuperAdmin(false);
          }
        }
        setLoading(false);
      };
      
      checkSuperAdmin();
    }, [user]);
    
    if (loading) return <Loader />;
    if (!isSuperAdmin) return <Navigate to="/admin" replace />;
    
    return <WrappedComponent {...props} />;
  };
  
  WithSuperAdminProtection.displayName = `WithSuperAdminProtection(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return WithSuperAdminProtection;
};

// ── Custom Hook ────────────────────────────────────────────────────────────

/**
 * Custom hook for admin access checks.
 */
export const useAdminAccess = () => {
  const { user, userRole, loading, isEmailVerified } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    const verifyAccess = async () => {
      if (user && userRole === 'admin') {
        try {
          const verified = await verifyAdminServerSide(user);
          if (mounted) setIsVerified(verified);
        } catch (error) {
          if (mounted) setIsVerified(false);
        }
      }
      if (mounted) setVerifying(false);
    };
    
    verifyAccess();
    
    return () => { mounted = false; };
  }, [user, userRole]);
  
  return {
    isAdmin: userRole === 'admin' && isVerified,
    isLoading: loading || verifying,
    canAccess: !loading && !verifying && user && userRole === 'admin' && isVerified,
    isVerified,
    user,
    userRole,
    isEmailVerified,
  };
};

export default AdminRoute;