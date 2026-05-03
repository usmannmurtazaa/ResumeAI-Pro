import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  FiArrowLeft, FiAward, FiCheckCircle, FiFacebook, FiFileText,
  FiGithub, FiShield, FiStar, FiTarget, FiTrendingUp, FiUsers, FiZap,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

const TARGET_STATS = {
  users: 50000,
  resumes: 100000,
  successRate: 94,
};

const FEATURES = [
  { id: 'ats', icon: FiZap, text: 'AI-powered ATS optimization', iconClassName: 'text-yellow-300' },
  { id: 'templates', icon: FiFileText, text: '25+ professional templates', iconClassName: 'text-blue-300' },
  { id: 'preview', icon: FiTarget, text: 'Real-time preview and scoring', iconClassName: 'text-green-300' },
  { id: 'keywords', icon: FiTrendingUp, text: 'Smart keyword suggestions', iconClassName: 'text-purple-300' },
  { id: 'security', icon: FiShield, text: 'Bank-level account security', iconClassName: 'text-cyan-300' },
];

const TESTIMONIALS = [
  { id: 'sarah', text: 'ResumeAI Pro helped me land my dream job at Google. The ATS optimization is incredible.', author: 'Sarah Chen', role: 'Software Engineer at Google', avatar: 'SC' },
  { id: 'michael', text: 'I increased my interview calls by 300% after using this resume builder.', author: 'Michael Rodriguez', role: 'Product Manager at Microsoft', avatar: 'MR' },
  { id: 'emily', text: 'The AI suggestions are spot-on. My resume went from average to outstanding.', author: 'Emily Watson', role: 'Marketing Director at Amazon', avatar: 'EW' },
  { id: 'david', text: 'Finally, a resume builder that actually understands ATS systems.', author: 'David Kim', role: 'Senior Recruiter at Meta', avatar: 'DK' },
];

const TRUST_BADGES = [
  { id: 'ssl', icon: FiShield, label: '256-bit SSL' },
  { id: 'gdpr', icon: FiAward, label: 'GDPR Compliant' },
  { id: 'rating', icon: FiStar, label: '4.9/5 Rating' },
  { id: 'guarantee', icon: FiCheckCircle, label: '30-Day Guarantee' },
];

const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Continue with Google', icon: FcGoogle },
  { id: 'github', label: 'Continue with GitHub', icon: FiGithub, iconClassName: 'text-gray-800 dark:text-gray-100' },
  { id: 'facebook', label: 'Continue with Facebook', icon: FiFacebook, iconClassName: 'text-blue-600' },
];

// ── Utilities ────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const compactNumberFormatter = new Intl.NumberFormat(navigator.language || 'en', {
  notation: 'compact',
  maximumFractionDigits: 0,
});

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const formatStatValue = (key, value) => {
  if (key === 'successRate') return `${value}%`;
  return `${compactNumberFormatter.format(value)}+`;
};

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
      heroSubtitle: 'Join professionals using ResumeAI Pro to land better opportunities',
      formTitle: 'Create your free account',
      formSubtitle: 'Start building your ATS-optimized resume in minutes.',
    },
    '/forgot-password': {
      heroTitle: 'Reset Your Password',
      heroSubtitle: "We'll send you a secure link to reset your password",
      formTitle: 'Reset your password',
      formSubtitle: 'Enter your email and we\'ll help you get back in.',
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

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState(() =>
    shouldReduceMotion ? TARGET_STATS : { users: 0, resumes: 0, successRate: 0 }
  );

  const mountedRef = useRef(true);
  const statsAnimationRef = useRef(null);

  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const showSocialLogin = isLogin || isSignup;

  const routeMeta = useMemo(
    () => getRouteMeta(location.pathname, title, subtitle),
    [location.pathname, title, subtitle]
  );

  const currentTestimonialData = TESTIMONIALS[currentTestimonial];

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (statsAnimationRef.current) cancelAnimationFrame(statsAnimationRef.current);
    };
  }, []);

  // ── Animated Stats ───────────────────────────────────────────────────

  useEffect(() => {
    if (shouldReduceMotion) {
      setStats(TARGET_STATS);
      return undefined;
    }

    const duration = 1200;
    const startTime = performance.now();

    const animateStats = (timestamp) => {
      if (!mountedRef.current) return;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setStats({
        users: Math.round(TARGET_STATS.users * easedProgress),
        resumes: Math.round(TARGET_STATS.resumes * easedProgress),
        successRate: Math.round(TARGET_STATS.successRate * easedProgress),
      });

      if (progress < 1) {
        statsAnimationRef.current = requestAnimationFrame(animateStats);
      }
    };

    statsAnimationRef.current = requestAnimationFrame(animateStats);

    return () => {
      if (statsAnimationRef.current) cancelAnimationFrame(statsAnimationRef.current);
    };
  }, [shouldReduceMotion]);

  // ── Testimonial Rotation ─────────────────────────────────────────────

  useEffect(() => {
    if (shouldReduceMotion || TESTIMONIALS.length <= 1) return undefined;

    // Pause rotation if user is hovering
    if (isPaused) return undefined;

    const intervalId = setInterval(() => {
      if (mountedRef.current) {
        setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
      }
    }, 8000);

    return () => clearInterval(intervalId);
  }, [shouldReduceMotion, isPaused]);

  // ── Social Login Handler ────────────────────────────────────────────

  const handleSocialLogin = useCallback(
    async (provider) => {
      if (loadingProvider) return;

      setLoadingProvider(provider);

      try {
        await loginWithProvider(provider);
      } catch (error) {
        // FIXED: Show user feedback on error
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
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
            <FiArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <Link to="/help" className="text-sm text-white/60 hover:text-white/80 transition-colors">Help</Link>
        </div>

        {/* Background animations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1, 1.16, 1], rotate: [0, 180, 360] }}
            transition={shouldReduceMotion ? {} : { duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -right-1/2 -top-1/2 h-full w-full rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"
          />
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1.16, 1, 1.16], rotate: [360, 180, 0] }}
            transition={shouldReduceMotion ? {} : { duration: 16, repeat: Infinity, ease: 'linear' }}
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
            <div className="mb-8">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">ResumeAI Pro</h1>
                <Badge variant="success" className="border-white/30 bg-white/20 text-white">v2.5</Badge>
              </div>
              <h2 className="text-2xl font-semibold leading-tight text-white/95 xl:text-3xl">{routeMeta.heroTitle}</h2>
              <p className="mt-2 text-lg text-white/80">{routeMeta.heroSubtitle}</p>
            </div>

            {/* Stats */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8 grid grid-cols-3 gap-4"
            >
              {[
                { key: 'users', icon: FiUsers, label: 'Active Users' },
                { key: 'resumes', icon: FiFileText, label: 'Resumes Created' },
                { key: 'successRate', icon: FiTrendingUp, label: 'Success Rate' },
              ].map(({ key, icon: Icon, label }) => (
                <div key={key} className="rounded-xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm hover:bg-white/15 transition-colors">
                  <Icon className="mx-auto mb-2 h-6 w-6 text-white/80" />
                  <div className="text-2xl font-bold text-white">{formatStatValue(key, stats[key])}</div>
                  <div className="text-xs text-white/70">{label}</div>
                </div>
              ))}
            </motion.div>

            {/* Features */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-8 space-y-3"
            >
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                  className="group flex items-center gap-3 text-white/90"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 group-hover:scale-105 group-hover:bg-white/30 transition-all">
                    <feature.icon className={cn('h-4 w-4', feature.iconClassName)} />
                  </div>
                  <span className="text-base">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Testimonial */}
            <div
              className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
              aria-live="polite"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonialData.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? {} : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FiStar key={i} className="h-4 w-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-base italic text-white/90">"{currentTestimonialData.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/30 to-white/10 font-semibold text-white">
                      {currentTestimonialData.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white">{currentTestimonialData.author}</p>
                      <p className="text-sm text-white/70">{currentTestimonialData.role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dot indicators */}
              <div className="mt-4 flex justify-center gap-2">
                {TESTIMONIALS.map((testimonial, index) => (
                  <button
                    key={testimonial.id}
                    type="button"
                    onClick={() => setCurrentTestimonial(index)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      index === currentTestimonial ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                    )}
                    aria-label={`View testimonial ${index + 1}`}
                    aria-pressed={index === currentTestimonial}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/65">
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
              <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
                <FiArrowLeft className="h-4 w-4" /> Back to Home
              </Link>
              <ThemeToggle />
            </div>
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-accent-500">
                  <FiFileText className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold gradient-text">ResumeAI Pro</h1>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{routeMeta.heroTitle}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{routeMeta.heroSubtitle}</p>
            </div>
          </div>

          {/* Desktop Form Title */}
          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{routeMeta.formTitle}</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{routeMeta.formSubtitle}</p>
          </div>

          {/* Social Login */}
          {showSocialLogin && (
            <div className="mb-6">
              <p className="mb-3 text-center text-xs text-gray-500 dark:text-gray-400">Continue with</p>
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

          {/* FIXED: Demo credentials only in development */}
          {isLogin && IS_DEVELOPMENT && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-center text-xs text-blue-700 dark:text-blue-300">
                <strong>Demo:</strong> user@example.com / demo123456
              </p>
            </div>
          )}

          {/* Mobile Trust Badges */}
          <div className="mt-8 lg:hidden">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1"><FiShield className="h-3 w-3" /> SSL Secure</div>
              <div className="flex items-center gap-1"><FiAward className="h-3 w-3" /> GDPR Ready</div>
              <div className="flex items-center gap-1"><FiStar className="h-3 w-3" /> 4.9/5 Rating</div>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary-500 hover:text-primary-600">Terms</Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-500 hover:text-primary-600">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AuthLayout);