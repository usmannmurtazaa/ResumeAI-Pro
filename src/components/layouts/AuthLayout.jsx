import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiFacebook,
  FiFileText,
  FiGithub,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import ThemeToggle from '../common/ThemeToggle';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

const FEATURES = [
  { id: 'ats', icon: FiZap, text: 'AI-powered ATS optimization', iconClassName: 'text-yellow-300' },
  {
    id: 'templates',
    icon: FiFileText,
    text: 'Professional resume templates',
    iconClassName: 'text-blue-300',
  },
  {
    id: 'preview',
    icon: FiTarget,
    text: 'Real-time preview and scoring',
    iconClassName: 'text-green-300',
  },
  {
    id: 'keywords',
    icon: FiTrendingUp,
    text: 'Smart keyword suggestions',
    iconClassName: 'text-purple-300',
  },
  {
    id: 'security',
    icon: FiShield,
    text: 'Bank-level account security',
    iconClassName: 'text-cyan-300',
  },
];

const TRUST_BADGES = [
  { id: 'ssl', icon: FiShield, label: 'SSL Secure' },
  { id: 'gdpr', icon: FiShield, label: 'GDPR Ready' },
];

const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Continue with Google', icon: FcGoogle },
  {
    id: 'github',
    label: 'Continue with GitHub',
    icon: FiGithub,
    iconClassName: 'text-gray-800 dark:text-gray-100',
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    icon: FiFacebook,
    iconClassName: 'text-blue-600',
  },
];

// ── Utilities ────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getRouteMeta = (pathname, title, subtitle) => {
  const routes = {
    '/login': {
      heroTitle: 'Welcome Back!',
      heroSubtitle: 'Sign in to continue building your professional resume',
      formTitle: 'Sign in to your account',
      formSubtitle: 'Access your resumes, ATS scores, and saved progress.',
    },
    '/signup': {
      heroTitle: 'Start Your Journey',
      heroSubtitle: 'Build your ATS-optimised resume in minutes',
      formTitle: 'Create your free account',
      formSubtitle: 'Start building your ATS-optimized resume in minutes.',
    },
    '/forgot-password': {
      heroTitle: 'Reset Your Password',
      heroSubtitle: "We'll send you a secure link to reset your password",
      formTitle: 'Reset your password',
      formSubtitle: "Enter your email and we'll help you get back in.",
    },
    '/verify-email': {
      heroTitle: 'Verify Your Email',
      heroSubtitle: 'Check your inbox for the verification link',
      formTitle: 'Verify your email',
      formSubtitle: 'Confirm your address to unlock your account securely.',
    },
  };

  const meta = routes[pathname] || {
    heroTitle: title || 'Create Professional Resumes',
    heroSubtitle: subtitle || 'AI-powered ATS optimization for your resume',
    formTitle: title || 'Create Professional Resumes',
    formSubtitle: subtitle || 'AI-powered ATS optimization for your resume',
  };

  return meta;
};

// ── Component ─────────────────────────────────────────────────────────────

const AuthLayout = ({ children, title, subtitle }) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { loginWithProvider } = useAuth();

  const [loadingProvider, setLoadingProvider] = useState(null);

  const mountedRef = useRef(true);

  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const showSocialLogin = isLogin || isSignup;

  const routeMeta = useMemo(
    () => getRouteMeta(location.pathname, title, subtitle),
    [location.pathname, title, subtitle]
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Social Login Handler ────────────────────────────────────────────

  const handleSocialLogin = useCallback(
    async (provider) => {
      if (loadingProvider) return;

      setLoadingProvider(provider);

      try {
        await loginWithProvider(provider);
      } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
          toast.error(`Failed to sign in with ${provider}. Please try again.`);
        }
        if (IS_DEVELOPMENT) {
          console.warn(`Social login failed for ${provider}`, error);
        }
      } finally {
        if (mountedRef.current) {
          setLoadingProvider(null);
        }
      }
    },
    [loadingProvider, loginWithProvider]
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Hero Panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 lg:flex lg:w-1/2 xl:p-12">
        {/* Top controls */}
        <div className="absolute right-4 top-4 z-20">
          <ThemeToggle />
        </div>
        <div className="absolute left-4 top-4 z-20 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <Link to="/help" className="text-sm text-white/60 hover:text-white/80 transition-colors">
            Help
          </Link>
        </div>

        {/* Background animations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1, 1.16, 1], rotate: [0, 180, 360] }}
            transition={
              shouldReduceMotion ? {} : { duration: 20, repeat: Infinity, ease: 'linear' }
            }
            className="absolute -right-1/2 -top-1/2 h-full w-full rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"
          />
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1.16, 1, 1.16], rotate: [360, 180, 0] }}
            transition={
              shouldReduceMotion ? {} : { duration: 16, repeat: Infinity, ease: 'linear' }
            }
            className="absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full bg-gradient-to-tr from-black/20 to-transparent blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Brand */}
            <div className="mb-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Maniesta Career OS</h1>
                <Badge variant="success" className="border-white/30 bg-white/20 text-white">
                  v2.5
                </Badge>
              </div>
              <h2 className="text-2xl font-semibold leading-tight text-white/95 xl:text-3xl">
                {routeMeta.heroTitle}
              </h2>
              <p className="mt-2 text-lg text-white/80">{routeMeta.heroSubtitle}</p>
            </div>

            {/* Features */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="group flex items-center gap-3 text-white/90"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 group-hover:scale-105 group-hover:bg-white/30 transition-all">
                    <feature.icon className={cn('h-4 w-4', feature.iconClassName)} />
                  </div>
                  <span className="text-base">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/65">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.id} className="flex items-center gap-1.5">
                <badge.icon className="h-3 w-3" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="mb-6 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
              >
                <FiArrowLeft className="h-4 w-4" /> Back to Home
              </Link>
              <ThemeToggle />
            </div>
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-accent-500">
                  <FiFileText className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold gradient-text">Maniesta Career OS</h1>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {routeMeta.heroTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {routeMeta.heroSubtitle}
              </p>
            </div>
          </div>

          {/* Desktop Form Title */}
          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {routeMeta.formTitle}
            </h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{routeMeta.formSubtitle}</p>
          </div>

          {/* Social Login */}
          {showSocialLogin && (
            <div className="mb-6">
              <p className="mb-3 text-center text-xs text-gray-500 dark:text-gray-400">
                Continue with
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SOCIAL_PROVIDERS.map(({ id, label, icon: Icon, iconClassName }) => (
                  <Button
                    key={id}
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin(id)}
                    loading={loadingProvider === id}
                    disabled={Boolean(loadingProvider)}
                    className="justify-center"
                    aria-label={label}
                    title={label}
                  >
                    <Icon className={cn('h-5 w-5', iconClassName || '')} />
                  </Button>
                ))}
              </div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white/80 px-3 text-gray-500 backdrop-blur-sm dark:bg-gray-800/80 dark:text-gray-400">
                    Or with email
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, x: -18 }}
              transition={{ duration: 0.28 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Demo credentials only in development */}
          {isLogin && IS_DEVELOPMENT && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-center text-xs text-blue-700 dark:text-blue-300">
                <strong>Demo:</strong> user@example.com / demo123456
              </p>
            </div>
          )}

          {/* Mobile Trust Badges */}
          <div className="mt-8 lg:hidden">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
              {TRUST_BADGES.map((badge) => (
                <div key={badge.id} className="flex items-center gap-1">
                  <badge.icon className="h-3 w-3" />
                  {badge.label}
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary-500 hover:text-primary-600">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-500 hover:text-primary-600">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AuthLayout);
