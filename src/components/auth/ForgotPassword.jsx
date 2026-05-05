import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiAlertCircle,
  FiSend,
  FiRefreshCw,
  FiShield,
  FiInfo,
  FiLock,
  FiHelpCircle,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────
const RESEND_COOLDOWN = 60; // seconds
const MAX_RESEND_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// ── Email Domain Suggestions ──────────────────────────────────────────────

/**
 * Common email domain typos and their corrections.
 */
const COMMON_EMAIL_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlok.com': 'outlook.com',
  'icloud.co': 'icloud.com',
  'icloud.cm': 'icloud.com',
  'protonmail.co': 'protonmail.com',
  'protonmail.cm': 'protonmail.com',
};

/**
 * Detects and suggests corrections for common email domain typos.
 */
const getEmailSuggestion = (email) => {
  if (!email || !email.includes('@')) return null;
  
  const [localPart, domain] = email.split('@');
  const lowerDomain = domain.toLowerCase();
  
  if (COMMON_EMAIL_TYPOS[lowerDomain]) {
    return `${localPart}@${COMMON_EMAIL_TYPOS[lowerDomain]}`;
  }
  
  return null;
};

// ── Custom Hook: Rate Limiter ─────────────────────────────────────────────

const useResendRateLimiter = () => {
  const [resendAttempts, setResendAttempts] = useState(() => {
    try {
      const saved = sessionStorage.getItem('password_reset_attempts');
      if (!saved) return { count: 0, timestamp: Date.now() };
      
      const data = JSON.parse(saved);
      // Reset if lockout period has passed
      if (Date.now() - data.timestamp > LOCKOUT_DURATION) {
        return { count: 0, timestamp: Date.now() };
      }
      return data;
    } catch {
      return { count: 0, timestamp: Date.now() };
    }
  });
  
  const isLocked = resendAttempts.count >= MAX_RESEND_ATTEMPTS &&
    Date.now() - resendAttempts.timestamp < LOCKOUT_DURATION;
  
  const timeUntilUnlock = isLocked
    ? Math.ceil((LOCKOUT_DURATION - (Date.now() - resendAttempts.timestamp)) / 1000 / 60)
    : 0;
  
  const recordAttempt = useCallback(() => {
    const newData = {
      count: resendAttempts.count + 1,
      timestamp: Date.now(),
    };
    setResendAttempts(newData);
    
    try {
      sessionStorage.setItem('password_reset_attempts', JSON.stringify(newData));
    } catch {
      // Ignore storage errors
    }
  }, [resendAttempts]);
  
  return { isLocked, timeUntilUnlock, recordAttempt };
};

// ── Component ──────────────────────────────────────────────────────────────

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState(null);
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  
  const { isLocked, timeUntilUnlock, recordAttempt } = useResendRateLimiter();
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const emailValue = watch('email');

  // ── Lifecycle ───────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      // Abort any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ── Cooldown Timer ─────────────────────────────────────────────────────

  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Email Typo Detection ───────────────────────────────────────────────

  useEffect(() => {
    if (emailValue && emailValue.includes('@')) {
      const suggestion = getEmailSuggestion(emailValue);
      setEmailSuggestion(suggestion);
    } else {
      setEmailSuggestion(null);
    }
  }, [emailValue]);

  // ── Submit Handler ─────────────────────────────────────────────────────

  const onSubmit = async (data) => {
    // Check rate limiting
    if (isLocked) {
      setError(`Too many attempts. Please try again in ${timeUntilUnlock} minute(s).`);
      return;
    }
    
    // Create abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setLoading(true);
    setError(null);
    
    try {
      await resetPassword(data.email);
      
      if (signal.aborted) return;
      if (!mountedRef.current) return;
      
      setSentEmail(data.email);
      setEmailSent(true);
      setResendCooldown(RESEND_COOLDOWN);
      recordAttempt();
      
      toast.success('Password reset email sent! Check your inbox.', {
        icon: '📧',
        duration: 5000,
        id: 'reset-email-sent',
      });
    } catch (error) {
      if (signal.aborted) return;
      if (!mountedRef.current) return;
      
      console.error('Password reset error:', error);
      
      let errorMessage;
      
      switch (error.code) {
        case 'auth/user-not-found':
          // FIXED: Consistent security - don't reveal if email exists
          // Show success message but mark internally
          setSentEmail(data.email);
          setEmailSent(true);
          setResendCooldown(RESEND_COOLDOWN);
          
          // Use console.info instead of error for expected security behavior
          if (process.env.NODE_ENV === 'development') {
            console.info('Password reset attempted for non-existent email:', data.email);
          }
          return; // Exit early - don't show error
          
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
          
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          setResendCooldown(300); // 5 minutes
          break;
          
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
          
        case 'auth/operation-not-allowed':
          errorMessage = 'Password reset is not enabled. Please contact support.';
          break;
          
        default:
          errorMessage = error.message || 'Failed to send reset email. Please try again.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { id: 'reset-error' });
    } finally {
      if (!signal.aborted && mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // ── Resend Handler ─────────────────────────────────────────────────────

  const handleResend = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before requesting again`, {
        id: 'resend-cooldown',
      });
      return;
    }
    
    if (isLocked) {
      setError(`Too many attempts. Please try again in ${timeUntilUnlock} minute(s).`);
      return;
    }
    
    if (sentEmail) {
      setLoading(true);
      
      try {
        await resetPassword(sentEmail);
        
        if (!mountedRef.current) return;
        
        setResendCooldown(RESEND_COOLDOWN);
        recordAttempt();
        
        toast.success('Password reset email resent!', {
          icon: '📧',
          id: 'reset-email-resent',
        });
      } catch (error) {
        if (!mountedRef.current) return;
        
        console.error('Resend error:', error);
        
        if (error.code === 'auth/too-many-requests') {
          toast.error('Too many requests. Please try again later.', {
            id: 'resend-error',
          });
        } else {
          toast.error('Failed to resend email. Please try again.', {
            id: 'resend-error',
          });
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }
  };

  // ── Navigation Handlers ────────────────────────────────────────────────

  const handleTryDifferentEmail = useCallback(() => {
    setEmailSent(false);
    setSentEmail('');
    setError(null);
    setResendCooldown(0);
    setEmailSuggestion(null);
  }, []);

  const handleApplySuggestion = useCallback(() => {
    if (emailSuggestion) {
      setValue('email', emailSuggestion, { shouldValidate: true });
      setEmailSuggestion(null);
      toast.success('Email corrected!', { duration: 2000 });
    }
  }, [emailSuggestion, setValue]);

  const handleContactSupport = useCallback(() => {
    // Try to open email client first
    const mailtoLink = `mailto:support@resumeai.com?subject=Password%20Reset%20Help&body=I%20need%20help%20resetting%20my%20password%20for%20${encodeURIComponent(sentEmail || 'my account')}.`;
    
    try {
      window.open(mailtoLink, '_blank');
    } catch {
      // Fallback: navigate to contact page
      navigate('/contact', {
        state: {
          subject: 'Password Reset Help',
          email: sentEmail || '',
        },
      });
    }
  }, [sentEmail, navigate]);

  // ── Animation Variants ─────────────────────────────────────────────────

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto px-4"
    >
      <div className="glass-card p-6 sm:p-8">
        {/* Back Button */}
        <motion.div variants={itemVariants}>
          <Link
            to="/login"
            className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6 group"
          >
            <FiArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Login
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4 shadow-lg">
            <FiLock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text">
            Reset Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Enter your email and we'll send you a reset link
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {emailSent ? (
            <motion.div
              key="success"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Success Message */}
              <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
                <motion.div 
                  className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  <FiCheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                  Check Your Email
                </h3>
                
                <p className="text-green-600 dark:text-green-300 mb-4">
                  We've sent a password reset link to:
                </p>
                
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg break-all">
                  {sentEmail}
                </p>
                
                <p className="text-sm text-green-600 dark:text-green-400">
                  Click the link in the email to reset your password.
                  The link will expire in 1 hour.
                </p>
              </div>

              {/* Tips */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <FiInfo className="w-4 h-4" />
                  Didn't receive the email?
                </h4>
                <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Check your spam or junk folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Ensure <strong>{sentEmail}</strong> is the correct email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Add <strong>noreply@resumeai.com</strong> to your contacts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Wait a few minutes - delivery can sometimes be delayed</span>
                  </li>
                </ul>
              </div>

              {/* Rate Limit Lockout Warning */}
              {isLocked && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Too many reset attempts. Please wait {timeUntilUnlock} minute(s) or try another method.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  loading={loading}
                  disabled={resendCooldown > 0 || isLocked}
                  className="w-full"
                  icon={<FiRefreshCw className="w-4 h-4" />}
                >
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : 'Resend Email'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleTryDifferentEmail}
                  className="w-full"
                  disabled={loading}
                >
                  Try Different Email
                </Button>
              </div>

              {/* Help Link */}
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Still need help?{' '}
                  <button
                    onClick={handleContactSupport}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
                    type="button"
                  >
                    Contact Support
                  </button>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2"
                    role="alert"
                  >
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lockout Warning */}
              {isLocked && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Too many attempts. Please wait {timeUntilUnlock} minute(s) or contact support.
                  </p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  icon={<FiMail />}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  error={errors.email?.message}
                  success={emailValue && !errors.email && (
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                  )}
                />

                {/* Email Typo Suggestion */}
                <AnimatePresence>
                  {emailSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                          <FiInfo className="w-3 h-3 flex-shrink-0" />
                          Did you mean{' '}
                          <span className="font-medium">{emailSuggestion}</span>?
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleApplySuggestion}
                            className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-300 dark:hover:bg-yellow-600 transition-colors"
                          >
                            Fix
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmailSuggestion(null)}
                            className="text-xs p-1 text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-300"
                            aria-label="Dismiss suggestion"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={loading}
                disabled={!isValid || loading || isLocked}
                className="w-full group"
                icon={<FiSend className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
              >
                Send Reset Link
              </Button>

              {/* Security Notice */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiShield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    For your security, the reset link expires in 1 hour and can only be used once.
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </div>
              </div>

              {/* Remember Password */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{' '}
                  <Link
                    to="/login"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>

              {/* Help Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <FiHelpCircle className="w-3 h-3" />
                  <span>Need help?</span>
                  <button
                    type="button"
                    onClick={handleContactSupport}
                    className="text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500"
      >
        <div className="flex items-center gap-1">
          <FiShield className="w-3 h-3" />
          <span>Secure</span>
        </div>
        <div className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
        <div className="flex items-center gap-1">
          <FiLock className="w-3 h-3" />
          <span>Encrypted</span>
        </div>
        <div className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
        <div className="flex items-center gap-1">
          <FiCheckCircle className="w-3 h-3" />
          <span>1-Hour Expiry</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Password Reset Handler Component (for the action link page) ─────────────

/**
 * This component handles the password reset action when user clicks the link.
 * Use this in your password reset page route.
 */
export const ResetPasswordHandler = () => {
  const { confirmPasswordReset } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Get oobCode from URL
  const queryParams = new URLSearchParams(window.location.search);
  const oobCode = queryParams.get('oobCode');
  
  const handleReset = async (e) => {
    e.preventDefault();
    
    if (!oobCode) {
      setError('Invalid or missing reset code. Please request a new password reset.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await confirmPasswordReset(oobCode, newPassword);
      setSuccess(true);
      
      toast.success('Password reset successfully! You can now sign in.', {
        icon: '✅',
        duration: 5000,
      });
      
      // Redirect to login after delay
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successful. Please sign in with your new password.' },
          replace: true,
        });
      }, 2000);
    } catch (error) {
      console.error('Password reset confirmation failed:', error);
      
      switch (error.code) {
        case 'auth/expired-action-code':
          setError('Reset link has expired. Please request a new one.');
          break;
        case 'auth/invalid-action-code':
          setError('Invalid reset link. Please request a new password reset.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Contact support.');
          break;
        case 'auth/user-not-found':
          setError('Account not found. Please check the reset link.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password.');
          break;
        default:
          setError(error.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (!oobCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-4">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="text-primary-500 hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center gradient-text">
          Reset Your Password
        </h2>
        
        <AnimatePresence>
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Password Reset!</h3>
              <p className="text-gray-600">
                Redirecting to sign in...
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleReset}
              className="space-y-4"
            >
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Reset Password
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ForgotPassword;
