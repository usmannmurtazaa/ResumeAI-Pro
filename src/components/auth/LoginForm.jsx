import React, { useState, useEffect } from 'react';
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
  FiTwitter
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FcPhone } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import GoogleAuthButton from './GoogleAuthButton';
import PhoneAuth from './PhoneAuth';
import toast from 'react-hot-toast';

const LoginForm = ({ redirectTo = '/dashboard' }) => {
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    // Check if there's a saved email
    return localStorage.getItem('rememberedEmail') !== null;
  });
  const [loginError, setLoginError] = useState(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: localStorage.getItem('rememberedEmail') || '',
      password: ''
    }
  });

  const emailValue = watch('email');

  // Check for redirect message from protected route
  const fromLocation = location.state?.from?.pathname || redirectTo;
  const authMessage = location.state?.message;

  useEffect(() => {
    // Show message if redirected from protected route
    if (authMessage) {
      toast(authMessage, {
        icon: '🔒',
        duration: 5000
      });
    }
  }, [authMessage]);

  // Save email to localStorage if remember me is checked
  useEffect(() => {
    if (rememberMe && emailValue) {
      localStorage.setItem('rememberedEmail', emailValue);
    } else if (!rememberMe) {
      localStorage.removeItem('rememberedEmail');
    }
  }, [rememberMe, emailValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    setLoginError(null);
    
    try {
      const userCredential = await login(data.email, data.password);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      toast.success('Welcome back! Redirecting...', {
        icon: '👋',
        duration: 2000
      });
      
      // Check if user is admin
      if (userCredential?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(fromLocation);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider) => {
    setLoading(true);
    setLoginError(null);
    
    try {
      const userCredential = await loginWithProvider(provider);
      
      toast.success('Successfully signed in!', {
        icon: '🎉',
        duration: 2000
      });
      
      if (userCredential?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(fromLocation);
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      
      let errorMessage = `Failed to sign in with ${provider}.`;
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed. Please try again.';
      }
      
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    toast.success('Successfully signed in with Google!', {
      icon: '🎉'
    });
    navigate(fromLocation);
  };

  const handlePhoneSuccess = () => {
    toast.success('Successfully signed in with Phone!', {
      icon: '📱'
    });
    navigate(fromLocation);
  };

  const fillDemoCredentials = (role = 'user') => {
    const credentials = {
      user: {
        email: 'demo@example.com',
        password: 'demo123456'
      },
      admin: {
        email: 'admin@example.com',
        password: 'admin123456'
      }
    };
    
    const cred = credentials[role];
    setValue('email', cred.email);
    setValue('password', cred.password);
    toast.success(`Demo ${role} credentials filled`, {
      icon: '🔑'
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
          </motion.div>

          {/* Demo Credentials Toggle */}
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
                    Click to fill demo credentials:
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

          {/* Social Sign In Options */}
          <motion.div variants={itemVariants} className="space-y-3 mb-6">
            <GoogleAuthButton onSuccess={handleGoogleSuccess} mode="signin" />
            
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
                onClick={() => handleProviderLogin('github')}
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
              {/* Error Alert */}
              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2"
                  >
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{loginError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  autoComplete="current-password"
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
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer" 
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
                disabled={!isValid}
                className="w-full group"
                icon={<FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
              >
                Sign In
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
            <Link to="/terms" className="hover:text-primary-500">Terms</Link>
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