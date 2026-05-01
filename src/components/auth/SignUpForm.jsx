import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiLock, 
  FiUser, 
  FiEye, 
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiShield,
  FiGithub,
  FiTwitter,
  FiBriefcase,
  FiAward,
  FiZap,
  FiRefreshCw,
  FiXCircle
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FcPhone } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Progress from '../ui/Progress';
import GoogleAuthButton from './GoogleAuthButton';
import PhoneAuth from './PhoneAuth';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MIN_PASSWORD_LENGTH = 8;

// Common passwords to reject (even if they meet complexity requirements)
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty123', 
  'admin123', 'letmein123', 'welcome123', 'abc123456',
  'password1', 'password12', 'password123!', 'adminadmin1',
];

// ── Security Utilities ──────────────────────────────────────────────────────

/**
 * Enhanced password strength checker with common password detection.
 */
const calculatePasswordStrength = (password) => {
  if (!password) return 0;
  
  // Check for common passwords first
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return 10; // Very weak - common password
  }
  
  let strength = 0;
  
  // Length
  if (password.length >= MIN_PASSWORD_LENGTH) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;
  
  // Character variety
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 10;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;
  
  // Complexity patterns
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) strength += 10;
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) strength += 10;
  
  // Penalize sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    strength -= 10;
  }
  
  // Penalize repeated characters
  if (/(.)\1{2,}/.test(password)) {
    strength -= 10;
  }
  
  return Math.max(0, Math.min(strength, 100));
};

/**
 * Checks if password has been compromised using k-anonymity.
 * In production, call the HaveIBeenPwned API.
 */
const checkPasswordBreach = async (password) => {
  if (!IS_PRODUCTION) return false;
  
  try {
    // Hash the password with SHA-1 (as required by HIBP API)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Only send first 5 characters of hash (k-anonymity)
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    
    // Check if our hash suffix appears in the response
    return text.split('\n').some(line => line.split(':')[0] === suffix);
  } catch (error) {
    console.warn('Password breach check failed:', error);
    return false; // Err on the side of allowing signup
  }
};

// ── Component ───────────────────────────────────────────────────────────────

const SignUpForm = ({ redirectTo = '/dashboard' }) => {
  const { signup, signupWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isCommonPassword, setIsCommonPassword] = useState(false);
  const [passwordBreached, setPasswordBreached] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [providerLoading, setProviderLoading] = useState(null);
  
  const { register, handleSubmit, watch, setValue, control, formState: { errors, isValid, isDirty } } = useForm({
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    }
  });

  const password = watch('password');
  const emailValue = watch('email');
  const displayNameValue = watch('displayName');
  const termsAccepted = watch('terms');

  // FIXED: Enhanced password strength with breach checking
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setIsCommonPassword(false);
      setPasswordBreached(false);
      return;
    }

    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
    
    // Check for common passwords
    setIsCommonPassword(COMMON_PASSWORDS.includes(password.toLowerCase()));
    
    // Check for breached passwords (debounced)
    const timer = setTimeout(async () => {
      if (password.length >= MIN_PASSWORD_LENGTH) {
        const breached = await checkPasswordBreach(password);
        setPasswordBreached(breached);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [password]);

  // FIXED: Clear error when user starts typing
  useEffect(() => {
    if (isDirty && signupError) {
      setSignupError(null);
    }
  }, [password, emailValue, displayNameValue, isDirty, signupError]);

  const getPasswordStrengthColor = () => {
    if (isCommonPassword || passwordBreached) return 'danger';
    if (passwordStrength >= 80) return 'success';
    if (passwordStrength >= 50) return 'warning';
    return 'danger';
  };

  const getPasswordStrengthLabel = () => {
    if (isCommonPassword) return 'Common Password - Choose Another';
    if (passwordBreached) return 'Password Breached - Choose Another';
    if (passwordStrength >= 80) return 'Strong';
    if (passwordStrength >= 60) return 'Good';
    if (passwordStrength >= 40) return 'Fair';
    if (passwordStrength > 0) return 'Weak';
    return '';
  };

  const onSubmit = async (data) => {
    // FIXED: Prevent signup with common or breached passwords
    if (isCommonPassword) {
      setSignupError('This is a commonly used password. Please choose a stronger, unique password.');
      toast.error('Please choose a stronger password');
      return;
    }
    
    if (passwordBreached) {
      setSignupError('This password has appeared in data breaches. Please choose a different password.');
      toast.error('Please choose a different password');
      return;
    }
    
    if (!data.terms) {
      setSignupError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    
    setLoading(true);
    setSignupError(null);
    
    try {
      const userCredential = await signup(
        data.email, 
        data.password, 
        data.displayName,
        { marketingConsent } // FIXED: Pass marketing consent
      );
      
      // FIXED: Show verification needed message instead of immediate redirect
      toast.success('Account created successfully! Please verify your email.', {
        icon: '📧',
        duration: 5000,
      });
      
      // Navigate to verification page or show modal
      setTimeout(() => {
        navigate('/verify-email', {
          state: {
            email: data.email,
            message: 'Please check your email to verify your account.',
          },
          replace: true,
        });
      }, 1500);
      
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Failed to create account. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please sign in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Account creation is temporarily disabled. Please try again later.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      setSignupError(errorMessage);
      toast.error(errorMessage, { id: 'signup-error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignup = async (provider) => {
    setProviderLoading(provider);
    setSignupError(null);
    
    try {
      const userCredential = await signupWithProvider(provider);
      
      toast.success('Account created successfully!', {
        icon: '🎉',
        duration: 2000,
      });
      
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error(`${provider} signup error:`, error);
      
      let errorMessage = `Failed to sign up with ${provider}.`;
      
      switch (error.code) {
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with this email. Please sign in using your original method.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-up window was closed. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups for this site.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This sign-in method is not configured. Please use email signup.';
          break;
        default:
          errorMessage = error.message || `Failed to sign up with ${provider}.`;
      }
      
      setSignupError(errorMessage);
      toast.error(errorMessage, { id: 'provider-signup-error' });
    } finally {
      setProviderLoading(null);
    }
  };

  const handleGoogleSuccess = () => {
    toast.success('Account created with Google!', { icon: '🎉' });
    navigate(redirectTo, { replace: true });
  };

  const handlePhoneSuccess = () => {
    toast.success('Account created with Phone!', { icon: '📱' });
    navigate(redirectTo, { replace: true });
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Benefits list
  const benefits = [
    { icon: <FiBriefcase />, text: 'ATS-optimized templates' },
    { icon: <FiAward />, text: 'Professional designs' },
    { icon: <FiZap />, text: 'AI-powered suggestions' },
    { icon: <FiShield />, text: 'Secure & private' },
  ];

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
              <FiUser className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 gradient-text">
              Create Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Join thousands of professionals building better resumes
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="grid grid-cols-2 gap-2">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg"
                >
                  <span className="text-primary-500">{benefit.icon}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{benefit.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Social Sign Up Options */}
          <motion.div variants={itemVariants} className="space-y-3 mb-6">
            <GoogleAuthButton onSuccess={handleGoogleSuccess} mode="signup" disabled={loading} />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPhoneAuth(true)}
              disabled={loading}
              icon={<FcPhone className="w-5 h-5" />}
              className="w-full justify-center bg-white/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"
            >
              Continue with Phone
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleProviderSignup('github')}
                loading={providerLoading === 'github'}
                disabled={loading}
                icon={<FiGithub className="w-4 h-4" />}
                className="justify-center"
              >
                GitHub
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleProviderSignup('twitter')}
                loading={providerLoading === 'twitter'}
                disabled={loading}
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
                Or sign up with email
              </span>
            </div>
          </motion.div>
          
          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <motion.div variants={itemVariants} className="space-y-4">
              {/* Error Alert */}
              <AnimatePresence mode="wait">
                {signupError && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2"
                  >
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-700 dark:text-red-300">{signupError}</p>
                      {signupError.includes('already registered') && (
                        <Link
                          to="/login"
                          className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block"
                        >
                          Sign in instead →
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Full Name"
                type="text"
                icon={<FiUser />}
                placeholder="Your full name"
                autoComplete="name"
                disabled={loading}
                {...register('displayName', {
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 100,
                    message: 'Name must be less than 100 characters',
                  },
                  // FIXED: Allow international characters
                  validate: {
                    noNumbers: (value) => !/\d/.test(value) || 'Name should not contain numbers',
                    noSpecialChars: (value) => !/[<>{}]/.test(value) || 'Name contains invalid characters',
                  },
                })}
                error={errors.displayName?.message}
                success={displayNameValue && !errors.displayName && (
                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                )}
              />

              <Input
                label="Email Address"
                type="email"
                icon={<FiMail />}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                {...register('email', {
                  required: 'Email is required',
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

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={<FiLock />}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  disabled={loading}
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
                      value: MIN_PASSWORD_LENGTH,
                      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
                    },
                    // FIXED: Clear indications of required vs recommended
                    validate: {
                      hasLowercase: (value) => /[a-z]/.test(value) || 'Must contain a lowercase letter',
                      hasUppercase: (value) => /[A-Z]/.test(value) || 'Must contain an uppercase letter',
                      hasNumber: (value) => /\d/.test(value) || 'Must contain a number',
                      hasSpecial: (value) => /[^A-Za-z0-9]/.test(value) || 'Must contain a special character',
                      notCommon: () => !isCommonPassword || 'This password is too common',
                      notBreached: () => !passwordBreached || 'This password has been compromised',
                    },
                  })}
                  error={errors.password?.message}
                />
                
                {/* Password Strength Indicator - FIXED: Enhanced UI */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium flex items-center gap-1 ${
                        passwordStrength >= 80 ? 'text-green-500' :
                        passwordStrength >= 60 ? 'text-green-600' :
                        passwordStrength >= 40 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {getPasswordStrengthLabel()}
                        {isCommonPassword && <FiXCircle className="w-3 h-3" />}
                      </span>
                    </div>
                    
                    <Progress 
                      value={isCommonPassword || passwordBreached ? 10 : passwordStrength} 
                      color={getPasswordStrengthColor()} 
                      size="sm"
                      animated
                    />
                    
                    {/* Password Requirements Checklist - FIXED: Clear required vs optional */}
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Requirements:</p>
                      {[
                        { check: password.length >= MIN_PASSWORD_LENGTH, label: 'At least 8 characters' },
                        { check: /[A-Z]/.test(password), label: 'One uppercase letter' },
                        { check: /[a-z]/.test(password), label: 'One lowercase letter' },
                        { check: /[0-9]/.test(password), label: 'One number' },
                        { check: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
                      ].map((req, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          {req.check ? (
                            <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <FiXCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                          <span className={`text-xs ${req.check ? 'text-gray-600' : 'text-gray-400'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Breach Warning */}
                    {passwordBreached && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
                        <FiAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300">
                          This password has appeared in data breaches. 
                          Please choose a different, unique password for security.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={<FiLock />}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={loading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                }
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                error={errors.confirmPassword?.message}
                success={password && watch('confirmPassword') === password && !errors.confirmPassword && (
                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                )}
              />

              {/* FIXED: Terms and Marketing Consent */}
              <div className="space-y-3">
                {/* Terms Checkbox */}
                <Controller
                  name="terms"
                  control={control}
                  rules={{ required: 'You must agree to the Terms of Service' }}
                  render={({ field: { onChange, value, ...field } }) => (
                    <label className="flex items-start cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={loading}
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                        {...field}
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        I agree to the{' '}
                        <Link 
                          to="/terms" 
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link 
                          to="/privacy" 
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  )}
                />
                {errors.terms && (
                  <p className="text-sm text-red-500 flex items-center gap-1 ml-0">
                    <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.terms.message}
                  </p>
                )}
                
                {/* FIXED: Marketing Consent (Optional) */}
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    disabled={loading}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Send me product updates, tips, and special offers. You can unsubscribe at any time.
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={!isValid || loading || isCommonPassword || passwordBreached}
                className="w-full group"
                icon={loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
              >
                {loading ? 'Creating Account...' : 'Create Free Account'}
              </Button>
            </motion.div>
          </form>

          {/* Sign In Link */}
          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline transition-all"
              >
                Sign In
              </Link>
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants} className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <FiShield className="w-3 h-3" />
              <span>Secure 256-bit SSL</span>
            </div>
            <div className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <FiCheckCircle className="w-3 h-3" />
              <span>No credit card required</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Phone Authentication Modal */}
      <PhoneAuth
        isOpen={showPhoneAuth}
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handlePhoneSuccess}
        mode="signup"
      />
    </>
  );
};

export default SignUpForm;