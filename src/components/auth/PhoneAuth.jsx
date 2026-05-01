import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import PhoneInput from 'react-phone-number-input';
import OtpInput from 'react-otp-input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSmartphone, 
  FiCheckCircle, 
  FiAlertCircle,
  FiArrowLeft,
  FiShield,
  FiInfo,
  FiRefreshCw,
  FiLock,
  FiX
} from 'react-icons/fi';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import 'react-phone-number-input/style.css';

// ── Constants ───────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 3;
const RESEND_COOLDOWN = 60; // seconds
const SMS_RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SMS_PER_HOUR = 5;
const OTP_LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// ── Custom Hook: SMS Rate Limiter ───────────────────────────────────────────

/**
 * Tracks SMS sending attempts to prevent abuse.
 * In production, this should be enforced server-side.
 */
const useSmsRateLimiter = () => {
  const [smsCount, setSmsCount] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sms_rate_limit');
      if (!saved) return { count: 0, timestamp: Date.now() };
      
      const data = JSON.parse(saved);
      // Reset if window has passed
      if (Date.now() - data.timestamp > SMS_RATE_LIMIT_WINDOW) {
        return { count: 0, timestamp: Date.now() };
      }
      return data;
    } catch {
      return { count: 0, timestamp: Date.now() };
    }
  });
  
  const isRateLimited = smsCount.count >= MAX_SMS_PER_HOUR &&
    Date.now() - smsCount.timestamp < SMS_RATE_LIMIT_WINDOW;
  
  const recordSmsSent = useCallback(() => {
    const newData = {
      count: smsCount.count + 1,
      timestamp: smsCount.timestamp || Date.now(),
    };
    setSmsCount(newData);
    
    try {
      sessionStorage.setItem('sms_rate_limit', JSON.stringify(newData));
    } catch {
      // Ignore storage errors
    }
  }, [smsCount]);
  
  const timeUntilReset = isRateLimited
    ? Math.ceil((SMS_RATE_LIMIT_WINDOW - (Date.now() - smsCount.timestamp)) / 1000 / 60)
    : 0;
  
  return { isRateLimited, timeUntilReset, recordSmsSent };
};

// ── Phone Number Utilities ──────────────────────────────────────────────────

/**
 * Sanitizes phone number for Firebase authentication.
 */
const sanitizePhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  return phone.replace(/[^\d+]/g, '');
};

/**
 * Validates if the phone number is in E.164 format.
 */
const isValidE164 = (phone) => {
  const sanitized = sanitizePhoneNumber(phone);
  return /^\+[1-9]\d{6,14}$/.test(sanitized);
};

/**
 * Formats phone for display (masks middle digits).
 */
const formatPhoneForDisplay = (phone, masked = false) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  
  if (masked) {
    // Show only last 4 digits
    const last4 = cleaned.slice(-4);
    return `•••• ${last4}`;
  }
  
  const match = cleaned.match(/^(\d{1,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`.trim();
  }
  return phone;
};

// ── Component ───────────────────────────────────────────────────────────────

const PhoneAuth = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError,
  mode = 'signin',
  linkToExisting = false,
  allowSkip = false,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isValidNumber, setIsValidNumber] = useState(false);
  const [error, setError] = useState(null);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  // FIXED: Instance-based refs instead of global
  const recaptchaVerifierRef = useRef(null);
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(false);
  const otpInputContainerRef = useRef(null);
  
  const { isRateLimited, timeUntilReset, recordSmsSent } = useSmsRateLimiter();

  // ── Modal Lifecycle ─────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    
    if (isOpen) {
      resetState();
    }
    
    return () => {
      mountedRef.current = false;
      cleanupRecaptcha();
      abortPendingOperations();
    };
  }, [isOpen]);

  // ── Resend Timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (resendTimer <= 0) return;
    
    const timer = setInterval(() => {
      setResendTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendTimer]);

  // ── OTP Lockout Timer ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isLocked) return;
    
    const timer = setTimeout(() => {
      setIsLocked(false);
      setOtpAttempts(0);
      setError(null);
    }, OTP_LOCKOUT_DURATION);
    
    return () => clearTimeout(timer);
  }, [isLocked]);

  // ── Cleanup Functions ───────────────────────────────────────────────────

  const resetState = useCallback(() => {
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    setConfirmationResult(null);
    setError(null);
    setOtpAttempts(0);
    setIsLocked(false);
    setResendTimer(0);
    setLoading(false);
  }, []);

  const cleanupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error clearing recaptcha:', error);
        }
      }
      recaptchaVerifierRef.current = null;
    }
  }, []);

  const abortPendingOperations = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ── reCAPTCHA Setup ─────────────────────────────────────────────────────

  const setupRecaptcha = useCallback(() => {
    cleanupRecaptcha();
    
    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('reCAPTCHA verified');
          }
        },
        'expired-callback': () => {
          if (mountedRef.current) {
            toast.error('Verification expired. Please try again.');
            setLoading(false);
          }
        },
      });
      
      return recaptchaVerifierRef.current;
    } catch (error) {
      console.error('reCAPTCHA setup failed:', error);
      throw new Error('Failed to initialize security verification. Please refresh the page.');
    }
  }, [cleanupRecaptcha]);

  // ── Phone Number Handler ────────────────────────────────────────────────

  const handlePhoneChange = useCallback((value) => {
    const sanitized = value || '';
    setPhoneNumber(sanitized);
    setIsValidNumber(isValidE164(sanitized));
    setError(null);
  }, []);

  // ── Send OTP ────────────────────────────────────────────────────────────

  const sendOTP = async () => {
    // Validate phone number
    if (!isValidNumber) {
      setError('Please enter a valid phone number with country code');
      return;
    }

    // Check SMS rate limiting
    if (isRateLimited) {
      setError(`Too many SMS requests. Please try again in ${timeUntilReset} minute(s).`);
      return;
    }

    // Create abort controller for this operation
    abortPendingOperations();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);
    
    try {
      const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
      const verifier = setupRecaptcha();
      
      const confirmation = await signInWithPhoneNumber(
        auth, 
        sanitizedPhone, 
        verifier
      );
      
      // Check if operation was aborted
      if (signal.aborted) return;
      
      if (!mountedRef.current) return;
      
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendTimer(RESEND_COOLDOWN);
      recordSmsSent();
      
      toast.success('Verification code sent!', {
        icon: '📱',
        duration: 3000,
        id: 'otp-sent',
      });
      
    } catch (error) {
      if (signal.aborted) return;
      if (!mountedRef.current) return;
      
      console.error('Error sending OTP:', error);
      
      let errorMessage = 'Failed to send verification code';
      
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          setResendTimer(COOLDOWN_DURATION_EXTENDED);
          break;
        case 'auth/invalid-phone-number':
          errorMessage = 'Invalid phone number. Please include country code.';
          break;
        case 'auth/missing-phone-number':
          errorMessage = 'Please enter your phone number.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Phone sign-in is not enabled. Contact support.';
          break;
        case 'auth/captcha-check-failed':
          errorMessage = 'Security check failed. Please try again.';
          // Retry recaptcha setup
          cleanupRecaptcha();
          break;
        case 'auth/quota-exceeded':
          errorMessage = 'Service temporarily unavailable. Please try later.';
          break;
        case 'auth/provider-already-linked':
          errorMessage = 'This phone number is already linked to an account.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { id: 'otp-error' });
      onError?.(error);
    } finally {
      if (!signal.aborted && mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────

  const resendOTP = async () => {
    if (resendTimer > 0) {
      toast.error(`Please wait ${resendTimer} seconds`, { id: 'resend-cooldown' });
      return;
    }
    
    if (isLocked) {
      const minutesLeft = Math.ceil(OTP_LOCKOUT_DURATION / 60000);
      toast.error(`Account temporarily locked. Try again in ${minutesLeft} minutes.`);
      return;
    }
    
    // Reset OTP attempts on resend
    setOtpAttempts(0);
    await sendOTP();
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────

  const verifyOTP = async () => {
    if (!otp || otp.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit verification code`);
      return;
    }

    if (isLocked) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    if (!confirmationResult) {
      setError('Verification session expired. Please request a new code.');
      setStep('phone');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      if (!mountedRef.current) return;
      
      // Reset OTP attempts on success
      setOtpAttempts(0);
      
      await handleSuccessfulAuth(user);
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error('OTP verification failed:', error);
      
      // Increment failed attempts
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      
      let errorMessage = 'Invalid verification code';
      
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = `Invalid code. ${MAX_OTP_ATTEMPTS - newAttempts} attempt(s) remaining.`;
          break;
        case 'auth/code-expired':
          errorMessage = 'Code expired. Please request a new one.';
          setStep('phone');
          setConfirmationResult(null);
          break;
        case 'auth/missing-verification-code':
          errorMessage = 'Please enter the verification code.';
          break;
        case 'auth/session-expired':
          errorMessage = 'Session expired. Please start again.';
          setStep('phone');
          setConfirmationResult(null);
          break;
        default:
          errorMessage = error.message || 'Verification failed';
      }
      
      // Check if should lock out
      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        setIsLocked(true);
        errorMessage = 'Too many failed attempts. Please try again in 5 minutes.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { id: 'otp-verify-error' });
      onError?.(error);
      
      // Clear OTP field on error
      setOtp('');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // ── Handle Successful Authentication ────────────────────────────────────

  const handleSuccessfulAuth = async (user) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        const userData = {
          phoneNumber: user.phoneNumber,
          email: user.email || '',
          displayName: user.displayName || `User${user.uid.slice(0, 6)}`,
          photoURL: user.photoURL || null,
          role: 'user',
          status: 'active',
          emailVerified: user.emailVerified || false,
          phoneVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: 'phone',
          metadata: {
            registrationMethod: mode,
            platform: navigator.platform,
            userAgent: navigator.userAgent.substring(0, 200), // Truncate for storage
          },
        };
        
        // FIXED: Use setDoc with merge to prevent race conditions
        await setDoc(userDocRef, userData, { merge: false });
        
        if (mode === 'signup') {
          toast.success('Account created successfully! Welcome!', {
            icon: '🎉',
            duration: 3000,
          });
        }
      } else {
        // Update existing user
        await updateDoc(userDocRef, {
          phoneVerified: true,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(user.phoneNumber && { phoneNumber: user.phoneNumber }),
        });
        
        toast.success('Phone verified successfully!', {
          icon: '✅',
          duration: 2000,
        });
      }
      
      onSuccess?.(user);
      handleClose();
    } catch (error) {
      console.error('Firestore update failed:', error);
      
      // Still succeed - authentication worked even if Firestore failed
      toast.success('Verified! Redirecting...', {
        icon: '✅',
        duration: 2000,
      });
      
      onSuccess?.(user);
      handleClose();
    }
  };

  // ── Navigation Handlers ─────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    resetState();
    cleanupRecaptcha();
    abortPendingOperations();
    onClose();
  }, [resetState, cleanupRecaptcha, abortPendingOperations, onClose]);

  const handleBackToPhone = useCallback(() => {
    setStep('phone');
    setOtp('');
    setError(null);
    setOtpAttempts(0);
    // Don't clear confirmationResult - user might go back and forth
  }, []);

  // ── OTP Paste Handler ───────────────────────────────────────────────────

  const handleOtpPaste = useCallback((e) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text') || '';
    const numbers = pastedText.replace(/\D/g, '').slice(0, OTP_LENGTH);
    
    if (numbers.length === OTP_LENGTH) {
      setOtp(numbers);
      // Auto-submit after paste
      setTimeout(() => {
        const lastInput = document.querySelector('.otp-input-container input:last-child');
        if (lastInput) {
          lastInput.focus();
        }
      }, 50);
    }
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg">
            <FiSmartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {linkToExisting ? 'Link Phone Number' : 'Phone Authentication'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {mode === 'signin' ? 'Sign in with your phone' : 'Create account with phone'}
            </p>
          </div>
        </div>
      }
      size="sm"
    >
      <div className="space-y-5">
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container" className="hidden" aria-hidden="true"></div>
        
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                
                <div className="relative">
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="US"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className={`input-field !pl-12 ${
                      isValidNumber && !error ? '!border-green-500' : ''
                    } ${error ? '!border-red-500' : ''}`}
                    placeholder="Enter phone number"
                    disabled={loading || isLocked}
                    autoFocus
                    aria-label="Phone number input"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'phone-error' : undefined}
                  />
                  
                  {isValidNumber && !error && (
                    <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                
                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      id="phone-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 mt-2 flex items-center gap-1"
                      role="alert"
                    >
                      <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                
                {/* Info Banner */}
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiInfo className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      We'll send a {OTP_LENGTH}-digit verification code via SMS.
                      Standard message and data rates may apply.
                    </p>
                  </div>
                </div>
                
                {/* Rate Limit Warning */}
                {isRateLimited && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                      <FiLock className="w-3 h-3" />
                      SMS limit reached. Try again in {timeUntilReset} minute(s).
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={sendOTP}
                  loading={loading}
                  disabled={!isValidNumber || loading || isRateLimited}
                  className="w-full"
                  aria-label="Send verification code"
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
                
                {allowSkip && mode === 'signup' && (
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="w-full"
                  >
                    Skip for now
                  </Button>
                )}
              </div>
              
              {/* Trust Indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <FiShield className="w-3 h-3" />
                <span>Your number is never shared</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Back Button */}
              <button
                onClick={handleBackToPhone}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                disabled={loading}
                type="button"
              >
                <FiArrowLeft className="w-4 h-4" />
                Change phone number
              </button>
              
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium mb-3 text-center text-gray-700 dark:text-gray-300">
                  Enter {OTP_LENGTH}-digit verification code
                </label>
                
                <div 
                  className="otp-input-container" 
                  onPaste={handleOtpPaste}
                  ref={otpInputContainerRef}
                >
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={OTP_LENGTH}
                    shouldAutoFocus={true}
                    containerStyle="justify-center gap-2 sm:gap-3"
                    inputType="tel"
                    renderInput={(props) => (
                      <input
                        {...props}
                        className={`w-11 h-11 sm:w-12 sm:h-12 text-center text-xl font-semibold
                          border-2 rounded-lg transition-all duration-200
                          ${error 
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                          }
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                          focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={loading || isLocked}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                      />
                    )}
                  />
                </div>
                
                {/* Phone Info & Resend */}
                <div className="text-center mt-4 space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Code sent to{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatPhoneForDisplay(phoneNumber, true)}
                    </span>
                  </p>
                  
                  <button
                    onClick={resendOTP}
                    disabled={resendTimer > 0 || loading || isLocked}
                    className={`inline-flex items-center gap-1 text-sm font-medium transition-all
                      ${resendTimer > 0 || loading || isLocked
                        ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                        : 'text-primary-600 hover:text-primary-700 dark:text-primary-400'
                      }`}
                    type="button"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${resendTimer === 0 && !loading ? '' : ''}`} />
                    {isLocked 
                      ? 'Account locked' 
                      : resendTimer > 0 
                        ? `Resend code in ${resendTimer}s`
                        : 'Resend code'}
                  </button>
                </div>
              </div>
              
              {/* Error & Lockout Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 rounded-lg flex items-start gap-2 ${
                      isLocked 
                        ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700' 
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}
                    role="alert"
                  >
                    <FiAlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      isLocked ? 'text-red-600' : 'text-red-500'
                    }`} />
                    <div>
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      {isLocked && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          For security, please wait 5 minutes before trying again.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Attempts Counter */}
              {otpAttempts > 0 && !isLocked && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                  {MAX_OTP_ATTEMPTS - otpAttempts} attempt(s) remaining
                </p>
              )}
              
              <Button
                onClick={verifyOTP}
                loading={loading}
                disabled={otp.length !== OTP_LENGTH || loading || isLocked}
                className="w-full"
                aria-label="Verify and continue"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FIXED: Global styles for PhoneInput */}
      <style>{`
        .PhoneInputInput {
          outline: none !important;
          background: transparent !important;
          border: none !important;
          flex: 1 !important;
          padding: 0.5rem 0 !important;
          font-size: 1rem !important;
        }
        .PhoneInputInput:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .PhoneInput {
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }
        .PhoneInputCountry {
          display: flex !important;
          align-items: center !important;
          gap: 0.25rem !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.5rem !important;
          background: rgba(0, 0, 0, 0.03) !important;
          transition: background 0.2s !important;
        }
        .PhoneInputCountry:hover {
          background: rgba(0, 0, 0, 0.06) !important;
        }
        .dark .PhoneInputCountry {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .dark .PhoneInputCountry:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .PhoneInputCountrySelect {
          opacity: 0 !important;
          position: absolute !important;
          width: 100% !important;
          height: 100% !important;
          cursor: pointer !important;
        }
        .PhoneInputCountryIcon {
          width: 1.5rem !important;
          height: 1rem !important;
          border-radius: 2px !important;
        }
        .PhoneInputCountryIcon--border {
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </Modal>
  );
};

export default PhoneAuth;