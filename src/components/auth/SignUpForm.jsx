import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
  FiInfo,
  FiGithub,
  FiTwitter,
  FiBriefcase,
  FiAward,
  FiZap
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false
    }
  });

  const password = watch('password');
  const emailValue = watch('email');
  const displayNameValue = watch('displayName');

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;
    
    // Complexity checks
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) strength += 5;
    if (/(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) strength += 5;
    
    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 80) return 'success';
    if (passwordStrength >= 50) return 'warning';
    return 'danger';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength >= 80) return 'Strong';
    if (passwordStrength >= 50) return 'Medium';
    if (passwordStrength > 0) return 'Weak';
    return '';
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setSignupError(null);
    
    try {
      const userCredential = await signup(data.email, data.password, data.displayName);
      
      toast.success('Account created successfully! Welcome aboard!', {
        icon: '🎉',
        duration: 3000
      });
      
      // Send welcome email or setup initial data
      setTimeout(() => {
        navigate(redirectTo);
      }, 500);
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
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setSignupError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignup = async (provider) => {
    setLoading(true);
    setSignupError(null);
    
    try {
      const userCredential = await signupWithProvider(provider);
      
      toast.success('Account created successfully!', {
        icon: '🎉',
        duration: 2000
      });
      
      navigate(redirectTo);
    } catch (error) {
      console.error(`${provider} signup error:`, error);
      
      let errorMessage = `Failed to sign up with ${provider}.`;
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up popup was closed. Please try again.';
      }
      
      setSignupError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    toast.success('Account created with Google!', {
      icon: '🎉'
    });
    navigate(redirectTo);
  };

  const handlePhoneSuccess = () => {
    toast.success('Account created with Phone!', {
      icon: '📱'
    });
    navigate(redirectTo);
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

  // Benefits list
  const benefits = [
    { icon: <FiBriefcase />, text: 'ATS-optimized templates' },
    { icon: <FiAward />, text: 'Professional designs' },
    { icon: <FiZap />, text: 'AI-powered suggestions' },
    { icon: <FiShield />, text: 'Secure & private' }
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
            <GoogleAuthButton onSuccess={handleGoogleSuccess} mode="signup" />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPhoneAuth(true)}
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
                onClick={() => handleProviderSignup('github')}
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
              <AnimatePresence>
                {signupError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2"
                  >
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{signupError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Full Name"
                type="text"
                icon={<FiUser />}
                placeholder="John Doe"
                autoComplete="name"
                {...register('displayName', {
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z\s'-]+$/,
                    message: 'Name can only contain letters, spaces, hyphens and apostrophes'
                  }
                })}
                error={errors.displayName?.message}
                success={displayNameValue && !errors.displayName && <FiCheckCircle className="w-4 h-4 text-green-500" />}
              />

              <Input
                label="Email Address"
                type="email"
                icon={<FiMail />}
                placeholder="you@example.com"
                autoComplete="email"
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
                  autoComplete="new-password"
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
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    validate: {
                      hasLetter: (value) => /[A-Za-z]/.test(value) || 'Must contain at least one letter',
                      hasNumber: (value) => /\d/.test(value) || 'Must contain at least one number',
                      hasUpperLower: (value) => /(?=.*[a-z])(?=.*[A-Z])/.test(value) || 'Should contain both upper and lower case (recommended)',
                      hasSpecial: (value) => /[^A-Za-z0-9]/.test(value) || 'Should contain at least one special character (recommended)'
                    }
                  })}
                  error={errors.password?.message}
                />
                
                {/* Password Strength Indicator */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength >= 80 ? 'text-green-500' :
                        passwordStrength >= 50 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {getPasswordStrengthLabel()}
                      </span>
                    </div>
                    <Progress 
                      value={passwordStrength} 
                      color={getPasswordStrengthColor()} 
                      size="sm"
                      animated
                    />
                    
                    {/* Password Requirements Checklist */}
                    <div className="mt-2 space-y-1">
                      {[
                        { check: password.length >= 8, label: 'At least 8 characters' },
                        { check: /[A-Z]/.test(password), label: 'Uppercase letter' },
                        { check: /[a-z]/.test(password), label: 'Lowercase letter' },
                        { check: /[0-9]/.test(password), label: 'Number' },
                        { check: /[^A-Za-z0-9]/.test(password), label: 'Special character' }
                      ].map((req, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          {req.check ? (
                            <FiCheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-300" />
                          )}
                          <span className={`text-xs ${req.check ? 'text-gray-500' : 'text-gray-400'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={<FiLock />}
                placeholder="••••••••"
                autoComplete="new-password"
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
                  validate: value => value === password || 'Passwords do not match'
                })}
                error={errors.confirmPassword?.message}
                success={password && watch('confirmPassword') === password && !errors.confirmPassword && (
                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                )}
              />

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      setValue('terms', e.target.checked);
                    }}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{' '}
                    <Link 
                      to="/terms" 
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link 
                      to="/privacy" 
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                    . I also agree to receive product updates and marketing emails (optional).
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    {errors.terms.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={!isValid || !acceptedTerms}
                className="w-full group"
                icon={<FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
              >
                Create Free Account
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
              <span>256-bit SSL</span>
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