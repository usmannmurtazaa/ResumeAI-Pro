import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential
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
  FiLoader,
  FiArrowLeft,
  FiShield,
  FiInfo,
  FiRefreshCw,
  FiLock
} from 'react-icons/fi';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import 'react-phone-number-input/style.css';

const PhoneAuth = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError,
  mode = 'signin',
  linkToExisting = false,
  allowSkip = false
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isValidNumber, setIsValidNumber] = useState(false);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [countryCode, setCountryCode] = useState('US');
  
  const recaptchaRef = useRef(null);
  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  // Maximum attempts before cooldown
  const MAX_ATTEMPTS = 5;
  const COOLDOWN_DURATION = 300; // 5 minutes in seconds

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      setTimeout(() => {
        const firstInput = document.querySelector('.otp-input-container input');
        firstInput?.focus();
      }, 100);
    }
  }, [step]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setOtp('');
      setStep('phone');
      setConfirmationResult(null);
      setError(null);
      setAttempts(0);
      setResendTimer(0);
    }
    
    // Cleanup recaptcha on unmount
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (error) {
          console.error('Error clearing recaptcha:', error);
        }
      }
    };
  }, [isOpen]);

  const setupRecaptcha = useCallback(() => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          toast.error('reCAPTCHA expired. Please try again.');
          setLoading(false);
        }
      });
      
      return window.recaptchaVerifier;
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      throw error;
    }
  }, []);

  const validatePhoneNumber = (number) => {
    // Basic validation - PhoneInput handles most validation
    return number && number.length >= 10;
  };

  const handlePhoneChange = (value) => {
    setPhoneNumber(value || '');
    setIsValidNumber(validatePhoneNumber(value));
    setError(null);
  };

  const sendOTP = async () => {
    if (!isValidNumber) {
      setError('Please enter a valid phone number');
      toast.error('Please enter a valid phone number');
      return;
    }

    // Check if too many attempts
    if (attempts >= MAX_ATTEMPTS) {
      toast.error(`Too many attempts. Please wait ${Math.ceil(COOLDOWN_DURATION / 60)} minutes.`);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const verifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendTimer(60);
      setAttempts(prev => prev + 1);
      
      toast.success('Verification code sent successfully!', {
        icon: '📱',
        duration: 3000
      });
      
      // Log success for analytics
      console.info(`OTP sent to ${phoneNumber}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error) => {
    let errorMessage = 'Failed to send verification code';
    
    switch (error.code) {
      case 'auth/too-many-requests':
        errorMessage = 'Too many requests. Please try again later.';
        setResendTimer(COOLDOWN_DURATION);
        break;
      case 'auth/invalid-phone-number':
        errorMessage = 'Invalid phone number format. Please check and try again.';
        break;
      case 'auth/missing-phone-number':
        errorMessage = 'Please enter your phone number.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Phone authentication is not enabled. Please contact support.';
        break;
      case 'auth/captcha-check-failed':
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
        break;
      case 'auth/quota-exceeded':
        errorMessage = 'SMS quota exceeded. Please try again later.';
        break;
      default:
        errorMessage = error.message || 'Failed to send verification code';
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
    onError?.(error);
  };

  const resendOTP = async () => {
    if (resendTimer > 0) {
      toast.error(`Please wait ${resendTimer} seconds before requesting again`);
      return;
    }
    
    await sendOTP();
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      await handleSuccessfulAuth(user);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      
      let errorMessage = 'Failed to verify code';
      
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'Invalid verification code. Please try again.';
          break;
        case 'auth/code-expired':
          errorMessage = 'Verification code has expired. Please request a new one.';
          setStep('phone');
          setConfirmationResult(null);
          break;
        case 'auth/missing-verification-code':
          errorMessage = 'Please enter the verification code.';
          break;
        default:
          errorMessage = error.message || 'Failed to verify code';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (user) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userDocRef, {
          phoneNumber: user.phoneNumber,
          email: user.email || '',
          displayName: user.displayName || `User${user.uid.slice(0, 6)}`,
          photoURL: user.photoURL || null,
          role: 'user',
          status: 'active',
          emailVerified: false,
          phoneVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: 'phone'
        });
        
        toast.success('Account created successfully! Welcome aboard!', {
          icon: '🎉',
          duration: 3000
        });
      } else {
        // Update existing user
        await updateDoc(userDocRef, {
          phoneVerified: true,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        toast.success('Phone number verified successfully!', {
          icon: '✅',
          duration: 2000
        });
      }
      
      onSuccess?.(user);
      handleClose();
    } catch (error) {
      console.error('Error updating user document:', error);
      // Still call onSuccess even if Firestore update fails
      toast.warning('Verified, but profile update failed. Please try refreshing.');
      onSuccess?.(user);
      handleClose();
    }
  };

  const handleLinkPhone = async () => {
    if (!isValidNumber) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const verifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendTimer(60);
      
      toast.success('Verification code sent! Enter code to link phone.');
    } catch (error) {
      console.error('Error sending OTP for linking:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    setConfirmationResult(null);
    setResendTimer(0);
    setError(null);
    setAttempts(0);
    onClose();
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError(null);
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numbers = pastedText.replace(/\D/g, '').slice(0, 6);
    if (numbers.length === 6) {
      setOtp(numbers);
    }
  };

  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`.trim();
    }
    return phone;
  };

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
            <p className="text-xs text-gray-500">
              {mode === 'signin' ? 'Sign in with your phone' : 'Create account with phone'}
            </p>
          </div>
        </div>
      }
      size="sm"
    >
      <div className="space-y-5">
        <div id="recaptcha-container" className="hidden"></div>
        
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
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
                    defaultCountry={countryCode}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className={`
                      input-field !pl-12
                      ${isValidNumber && !error ? 'border-green-500' : ''}
                      ${error ? 'border-red-500' : ''}
                    `}
                    placeholder="Enter phone number"
                    ref={phoneInputRef}
                    disabled={loading}
                    autoFocus
                  />
                  
                  {isValidNumber && !error && (
                    <FiCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 mt-2 flex items-center gap-1"
                  >
                    <FiAlertCircle className="w-3 h-3" />
                    {error}
                  </motion.p>
                )}
                
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiInfo className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        We'll send a verification code to this number via SMS.
                        Standard message and data rates may apply.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={linkToExisting ? handleLinkPhone : sendOTP}
                  loading={loading}
                  disabled={!isValidNumber}
                  className="w-full group"
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
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <FiShield className="w-3 h-3" />
                <span>Your number is secure and private</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Back Button */}
              <button
                onClick={handleBackToPhone}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                disabled={loading}
              >
                <FiArrowLeft className="w-4 h-4" />
                Change phone number
              </button>
              
              <div>
                <label className="block text-sm font-medium mb-3 text-center text-gray-700 dark:text-gray-300">
                  Enter verification code
                </label>
                
                <div className="otp-input-container" onPaste={handleOtpPaste}>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    shouldAutoFocus={true}
                    containerStyle="justify-center gap-2"
                    renderInput={(props) => (
                      <input
                        {...props}
                        className={`
                          w-11 h-11 sm:w-12 sm:h-12 text-center text-xl font-semibold
                          border-2 rounded-lg transition-all duration-200
                          ${error 
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                          }
                          bg-white dark:bg-gray-800
                          focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          outline-none
                        `}
                        disabled={loading}
                      />
                    )}
                  />
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    Sent to{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatPhoneForDisplay(phoneNumber)}
                    </span>
                  </p>
                  
                  <div className="mt-3">
                    <button
                      onClick={resendOTP}
                      disabled={resendTimer > 0 || loading}
                      className={`
                        inline-flex items-center gap-1 text-sm font-medium transition-all
                        ${resendTimer > 0 || loading
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-primary-600 hover:text-primary-700 dark:text-primary-400'
                        }
                      `}
                    >
                      <FiRefreshCw className={`w-4 h-4 ${resendTimer === 0 && !loading ? 'animate-spin' : ''}`} />
                      {resendTimer > 0 
                        ? `Resend in ${resendTimer}s` 
                        : loading 
                          ? 'Sending...' 
                          : 'Resend code'}
                    </button>
                  </div>
                </div>
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2"
                >
                  <FiAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </motion.div>
              )}
              
              <div className="space-y-3">
                <Button
                  onClick={linkToExisting ? handleLinkPhone : verifyOTP}
                  loading={loading}
                  disabled={otp.length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Button>
              </div>
              
              {/* Attempts Warning */}
              {attempts >= 3 && attempts < MAX_ATTEMPTS && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                  {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        :global(.PhoneInputInput) {
          outline: none !important;
          background: transparent !important;
          border: none !important;
          flex: 1 !important;
          padding: 0.5rem 0 !important;
          font-size: 1rem !important;
        }
        :global(.PhoneInput) {
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }
        :global(.PhoneInputCountry) {
          display: flex !important;
          align-items: center !important;
          gap: 0.25rem !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.5rem !important;
          background: rgba(0, 0, 0, 0.03) !important;
        }
        :global(.dark .PhoneInputCountry) {
          background: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
    </Modal>
  );
};

export default PhoneAuth;