import React, { useState, useEffect } from 'react';
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
  FiHelpCircle
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState(null);
  
  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: ''
    }
  });

  const emailValue = watch('email');

  // Cooldown timer for resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      await resetPassword(data.email);
      setSentEmail(data.email);
      setEmailSent(true);
      setResendCooldown(60);
      
      toast.success('Password reset email sent! Check your inbox.', {
        icon: '📧',
        duration: 5000
      });
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          // For security, don't reveal if email exists
          errorMessage = 'If an account exists with this email, a reset link has been sent.';
          setSentEmail(data.email);
          setEmailSent(true);
          setResendCooldown(60);
          break;
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
        default:
          errorMessage = error.message || 'Failed to send reset email.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before requesting again`);
      return;
    }
    
    if (sentEmail) {
      setLoading(true);
      try {
        await resetPassword(sentEmail);
        setResendCooldown(60);
        toast.success('Password reset email resent! Check your inbox.', {
          icon: '📧'
        });
      } catch (error) {
        console.error('Resend error:', error);
        toast.error('Failed to resend email. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTryDifferentEmail = () => {
    setEmailSent(false);
    setSentEmail('');
    setError(null);
    setResendCooldown(0);
  };

  const handleCheckSpam = () => {
    toast.success('Check your spam/junk folder. Add us to your contacts.', {
      icon: '📨',
      duration: 5000
    });
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@resumeai.com?subject=Password%20Reset%20Help';
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
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
            We'll send you a link to reset your password
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {emailSent ? (
            <motion.div
              key="success"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              {/* Success Message */}
              <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="w-8 h-8 text-green-500" />
                </div>
                
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                  Check Your Email
                </h3>
                
                <p className="text-green-600 dark:text-green-300 mb-4">
                  We've sent a password reset link to:
                </p>
                
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-4 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  {sentEmail}
                </p>
                
                <p className="text-sm text-green-600 dark:text-green-400">
                  Click the link in the email to reset your password.
                  The link will expire in 1 hour.
                </p>
              </div>

              {/* Tips */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <FiInfo className="w-4 h-4" />
                  Didn't receive the email?
                </h4>
                <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Check your spam or junk folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Make sure you entered the correct email address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Wait a few minutes - email delivery can sometimes be delayed</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  loading={loading}
                  disabled={resendCooldown > 0}
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
                >
                  Try Different Email
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleCheckSpam}
                  className="w-full text-sm"
                >
                  Check Spam Folder Tips
                </Button>
              </div>

              {/* Help Link */}
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Still need help?{' '}
                  <button
                    onClick={handleContactSupport}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
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
              exit="hidden"
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
                  >
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  icon={<FiMail />}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  error={errors.email?.message}
                  success={emailValue && !errors.email && <FiCheckCircle className="w-4 h-4 text-green-500" />}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={loading}
                disabled={!isValid}
                className="w-full group"
                icon={<FiSend className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
              >
                Send Reset Link
              </Button>

              {/* Security Notice */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiShield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    For your security, the password reset link will expire in 1 hour and can only be used once.
                  </p>
                </div>
              </div>

              {/* Remember Password Link */}
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
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <FiHelpCircle className="w-3 h-3" />
                  <span>Need help?</span>
                  <button
                    onClick={handleContactSupport}
                    className="text-primary-500 hover:text-primary-600"
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
        className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400"
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
          <span>Privacy Protected</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;