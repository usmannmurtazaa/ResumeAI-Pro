import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
  FiShield,
  FiInfo,
  FiGithub,
  FiTwitter,
  FiRefreshCw
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FcPhone } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import GoogleAuthButton from './GoogleAuthButton';
import PhoneAuth from './PhoneAuth';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// ── Security Utilities ──────────────────────────────────────────────────────

/**
 * Rate limiter for login attempts.
 * In production, this should be server-side.
 */
const useLoginRateLimiter = () => {
  const [attempts, setAttempts] = useState(() => {
    try {
      const saved = sessionStorage.getItem('login_attempts');
      return saved ? JSON.parse(saved) : { count: 0, lastAttempt: 0 };
    } catch {
      return { count: 0, lastAttempt: 0 };
    }
  });
  
  const isLocked = attempts.count >= MAX_LOGIN_ATTEMPTS && 
                   Date.now() - attempts.lastAttempt < LOCKOUT_DURATION;
  
  const timeRemaining = isLocked 
    ? Math.ceil((LOCKOUT_DURATION - (Date.now() - attempts.lastAttempt)) / 1000 / 60)
    : 0;
  
  const recordAttempt = useCallback(() => {
    const newAttempts = {
      count: attempts.count + 1,
      lastAttempt: Date.now()
    };
    setAttempts(newAttempts);
    sessionStorage.setItem('login_attempts', JSON.stringify(newAttempts));
  }, [attempts]);
  
  const resetAttempts = useCallback(() => {
    setAttempts({ count: 0, lastAttempt: 0 });
    sessionStorage.removeItem('login_attempts');
  }, []);
  
  return { isLocked, timeRemaining, recordAttempt, resetAttempts };
};

// ── Demo Credentials (Development Only) ────────────────────────────────────

/**
 * FIXED: Demo credentials are only available in development mode.
 * In production, this returns empty values.
 */
const getDemoCredentials = (role) => {
  // NEVER return real credentials in production
  if (IS_PRODUCTION) {
    return { email: '', password: '' };
  }
  
  const credentials = {
    user: {
      email: process.env.REACT_APP_DEMO_USER_EMAIL || 'demo@example.com',
      password: process.env.REACT_APP_DEMO_USER_PASSWORD || 'demo123456',
    },
    admin: {
      email: process.env.REACT_APP_DEMO_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.REACT_APP_DEMO_ADMIN_PASSWORD || 'admin123456',
    },
  };
  
  return credentials[role] || credentials.user;
};

// ── Component ───────────────────────────────────────────────────────────────

const LoginForm = ({ redirectTo = '/dashboard' }) => {
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('remembered_email') !== null;
    } catch {
      return false;
    }
  });
  const [loginError, setLoginError] = useState(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [providerLoading, setProviderLoading] = useState(null); // Track which provider is loading
  
  const { isLocked, timeRemaining, recordAttempt, resetAttempts } = useLoginRateLimiter();
  
  const { register, handleSubmit, setValue, watch, resetField, formState: { errors, isValid, isDirty } } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: (() => {
        try {
          return localStorage.getItem('remembered_email') || '';
        } catch {
          return '';
        }
      })(),
      password: ''
    }
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Check for redirect message from protected route
  const fromLocation = location.state?.from?.pathname || redirectTo;
  const authMessage = location.state?.message;
  const requireAdmin = location.state?.requireAdmin;

  useEffect(() => {
    // Show message if redirected from protected route
    if (authMessage) {
      toast(authMessage, {
        icon: '🔒',
        duration: 5000,
        id: 'auth-redirect-message',
      });
    }
    
    if (requireAdmin) {
      toast('This area requires admin access', {
        icon: '🛡️',
        duration: 5000,
        id: 'admin-required-message',
      });
    }
  }, [authMessage, requireAdmin]);

  // FIXED: Clear error when user starts typing
  useEffect(() => {
    if (isDirty && loginError) {
      setLoginError(null);
    }
  }, [emailValue, passwordValue, isDirty, loginError]);

  // FIXED: Save email to localStorage securely
  useEffect(() => {
    try {
      if (rememberMe && emailValue) {
        localStorage.setItem('remembered_email', emailValue);
      } else if (!rememberMe) {
        localStorage.removeItem('remembered_email');
      }
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }, [rememberMe, emailValue]);

  /**
   * FIXED: Proper admin role check using Firebase token claims.
   */
  const checkAdminRole = async (user) => {
    if (!user) return false;
    
    try {
      // Force refresh to get latest claims
      const idTokenResult = await user.getIdTokenResult(true);
      
      // Check for admin claim in Firebase custom claims
      // These must be set via Firebase Admin SDK or backend
      return idTokenResult.claims.admin === true || 
             idTokenResult.claims.superAdmin === true;
    } catch (error) {
      console.error('Admin role check failed:', error);
      return false;
    }
  };

  /**
   * FIXED: Handle redirect after successful login.
   */
  const handleRedirectAfterLogin = async (userCredential) => {
    try {
      const isAdmin = await checkAdminRole(userCredential.user);
      
      if (isAdmin) {
        toast.success('Welcome, Administrator!', {
          icon: '🛡️',
          duration: 2000,
        });
        navigate('/admin', { replace: true });
      } else {
        toast.success('Welcome back!', {
          icon: '👋',
          duration: 2000,
        });
        navigate(fromLocation, { replace: true });
      }
    } catch (error) {
      // Fallback to dashboard if admin check fails
      console.error('Redirect error:', error);
      navigate('/dashboard', { replace: true });
    }
  };

  const onSubmit = async (data) => {
    // Check rate limiting
    if (isLocked) {
      setLoginError(`Account temporarily locked. Try again in ${timeRemaining} minute(s).`);
      return;
    }
    
    setLoading(true);
    setLoginError(null);
    
    try {
      const userCredential = await login(data.email, data.password);
      
      // Reset attempts on successful login
      resetAttempts();
      
      // Handle remember me
      try {
        if (rememberMe) {
          localStorage.setItem('remembered_email', data.email);
        } else {
          localStorage.removeItem('remembered_email');
        }
      } catch (error) {
        console.warn('Could not update localStorage:', error);
      }
      
      // Redirect to appropriate page
      await handleRedirectAfterLogin(userCredential);
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Record failed attempt
      recordAttempt();
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address. Would you like to create one?';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again or reset your password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support for assistance.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      setLoginError(errorMessage);
      toast.error(errorMessage, {
        id: 'login-error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider) => {
    if (isLocked) {
      setLoginError(`Account temporarily locked. Try again in ${timeRemaining} minute(s).`);
      return;
    }
    
    setProviderLoading(provider);
    setLoginError(null);
    
    try {
      const userCredential = await loginWithProvider(provider);
      
      // Reset attempts on successful login
      resetAttempts();
      
      await handleRedirectAfterLogin(userCredential);
      
    } catch (error) {
      console.error(`${provider} login error:`, error);
      
      // Record failed attempt
      recordAttempt();
      
      let errorMessage = `Failed to sign in with ${provider}.`;
      
      switch (error.code) {
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with the same email. Please sign in using your original method.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in window was closed. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups for this site.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Sign-in cancelled. Please try again.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized for sign-in. Please contact support.';
          break;
        default:
          errorMessage = error.message || `Failed to sign in with ${provider}.`;
      }
      
      setLoginError(errorMessage);
      toast.error(errorMessage, {
        id: 'provider-login-error',
        duration: 5000,
      });
    } finally {
      setProviderLoading(null);
    }
  };

  const handleGoogleSuccess = async (userCredential) => {
    resetAttempts();
    await handleRedirectAfterLogin({ user: userCredential.user });
  };

  const handlePhoneSuccess = async (userCredential) => {
    resetAttempts();
    await handleRedirectAfterLogin({ user: userCredential.user });
  };

  /**
   * FIXED: Fill demo credentials only in development mode.
   */
  const fillDemoCredentials = (role = 'user') => {
    if (IS_PRODUCTION) {
      toast.error('Demo credentials are not available in production');
      return;
    }
    
    const cred = getDemoCredentials(role);
    
    if (!cred.email || !cred.password) {
      toast.error('Demo credentials not configured');
      return;
    }
    
    setValue('email', cred.email, { shouldValidate: true });
    setValue('password', cred.password, { shouldValidate: true });
    
    toast.success(`Demo ${role} credentials filled`, {
      icon: '🔑',
      duration: 3000,
    });
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md mx-auto"
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100/50 dark:border-gray-700/50">
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4 shadow-lg">
              <FiShield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 gradient-text">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Sign in to access your professional resume builder
            </p>
            
            {/* Admin required badge */}
            {requireAdmin && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                <FiShield className="w-3 h-3" />
                Admin access required
              </div>
            )}
          </motion.div>

          {/* FIXED: Demo Credentials - Only visible in development */}
          {IS_DEVELOPMENT && (
            <motion.div variants={itemVariants} className="mb-4">
              <button
                type="button"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                className="w-full text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center gap-1 transition-colors"
              >
                <FiInfo className="w-4 h-4" />
                {showDemoCredentials ? 'Hide demo credentials' : 'Need a demo account?'}
              </button>
              
              <AnimatePresence>
                {showDemoCredentials && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                  >
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      Click to fill demo credentials (Development only):
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fillDemoCredentials('user')}
                        className="flex-1 text-xs"
                      >
                        Demo User
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fillDemoCredentials('admin')}
                        className="flex-1 text-xs"
                      >
                        Demo Admin
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Social Sign In Options */}
          <motion.div variants={itemVariants} className="space-y-3 mb-6">
            <GoogleAuthButton 
              onSuccess={handleGoogleSuccess} 
              mode="signin"
              disabled={loading || isLocked}
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPhoneAuth(true)}
              disabled={loading || isLocked}
              icon={<FcPhone className="w-5 h-5" />}
              className="w-full justify-center bg-white/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"
            >
              Continue with Phone
            </Button>

            {/* Additional Providers */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleProviderLogin('github')}
                loading={providerLoading === 'github'}
                disabled={loading || isLocked}
                icon={<FiGithub className="w-4 h-4" />}
                className="justify-center"
              >
                GitHub
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleProviderLogin('twitter')}
                loading={providerLoading === 'twitter'}
                disabled={loading || isLocked}
                icon={<FiTwitter className="w-4 h-4 text-blue-400" />}
                className="justify-center"
              >
                Twitter
              </Button>
            </div>
          </motion.div>

          {/* Divider */}
          <motion.div variants={itemVariants} className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 backdrop-blur-sm">
                Or continue with email
              </span>
            </div>
          </motion.div>
          
          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <motion.div variants={itemVariants} className="space-y-4">
              {/* Rate Limit Warning */}
              {isLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex items-start gap-2"
                >
                  <FiAlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Account temporarily locked
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Too many failed attempts. Try again in {timeRemaining} minute(s).
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error Alert */}
              <AnimatePresence mode="wait">
                {loginError && !isLocked && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2"
                  >
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-700 dark:text-red-300">{loginError}</p>
                      {/* Show helpful actions based on error */}
                      {loginError.includes('password') && (
                        <button
                          type="button"
                          onClick={() => navigate('/forgot-password')}
                          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 mt-1 underline"
                        >
                          Reset your password
                        </button>
                      )}
                      {loginError.includes('account found') && (
                        <button
                          type="button"
                          onClick={() => navigate('/signup')}
                          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 mt-1 underline"
                        >
                          Create an account
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Email Address"
                type="email"
                icon={<FiMail />}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading || isLocked}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                error={errors.email?.message}
                success={emailValue && !errors.email && <FiCheckCircle className="w-4 h-4 text-green-500" />}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={<FiLock />}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading || isLocked}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  }
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  error={errors.password?.message}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading || isLocked}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:opacity-50" 
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Remember me
                  </span>
                </label>
                
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline transition-all"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={!isValid || loading || isLocked}
                className="w-full group"
                icon={loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </motion.div>
          </form>

          {/* Sign Up Link */}
          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline transition-all"
              >
                Create free account
              </Link>
            </p>
          </motion.div>

          {/* Terms */}
          <motion.p variants={itemVariants} className="text-center text-xs text-gray-400 mt-4">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="hover:text-primary-500">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="hover:text-primary-500">Privacy Policy</Link>
          </motion.p>
        </div>
      </motion.div>

      {/* Phone Authentication Modal */}
      <PhoneAuth
        isOpen={showPhoneAuth}
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handlePhoneSuccess}
      />
    </>
  );
};

export default LoginForm;