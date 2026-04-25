import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiAward,
  FiCheckCircle,
  FiFacebook,
  FiFileText,
  FiGithub,
  FiShield,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';

const TARGET_STATS = {
  users: 50000,
  resumes: 100000,
  successRate: 94,
};

const FEATURES = [
  {
    id: 'ats',
    icon: FiZap,
    text: 'AI-powered ATS optimization',
    iconClassName: 'text-yellow-300',
  },
  {
    id: 'templates',
    icon: FiFileText,
    text: '25+ professional templates',
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

const TESTIMONIALS = [
  {
    id: 'sarah-chen',
    text: 'ResumeAI Pro helped me land my dream job at Google. The ATS optimization is incredible.',
    author: 'Sarah Chen',
    role: 'Software Engineer at Google',
    avatar: 'SC',
  },
  {
    id: 'michael-rodriguez',
    text: 'I increased my interview calls by 300% after using this resume builder. Highly recommended.',
    author: 'Michael Rodriguez',
    role: 'Product Manager at Microsoft',
    avatar: 'MR',
  },
  {
    id: 'emily-watson',
    text: 'The AI suggestions are spot-on. My resume went from average to outstanding in minutes.',
    author: 'Emily Watson',
    role: 'Marketing Director at Amazon',
    avatar: 'EW',
  },
  {
    id: 'david-kim',
    text: 'Finally, a resume builder that actually understands ATS systems. Worth every penny.',
    author: 'David Kim',
    role: 'Senior Recruiter at Meta',
    avatar: 'DK',
  },
];

const TRUST_BADGES = [
  { id: 'ssl', icon: FiShield, label: '256-bit SSL' },
  { id: 'gdpr', icon: FiAward, label: 'GDPR Compliant' },
  { id: 'rating', icon: FiStar, label: '4.9/5 Rating' },
  { id: 'guarantee', icon: FiCheckCircle, label: '30-Day Guarantee' },
];

const SOCIAL_PROVIDERS = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: FcGoogle,
  },
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

const compactNumberFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 0,
});

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const formatStatValue = (key, value) => {
  if (key === 'successRate') {
    return `${value}%`;
  }

  return `${compactNumberFormatter.format(value)}+`;
};

const getRouteMeta = (pathname, title, subtitle) => {
  switch (pathname) {
    case '/login':
      return {
        heroTitle: 'Welcome Back!',
        heroSubtitle: 'Sign in to continue building your professional resume',
        formTitle: 'Sign in to your account',
        formSubtitle: 'Access your resumes, ATS scores, and saved progress.',
      };
    case '/signup':
      return {
        heroTitle: 'Start Your Journey',
        heroSubtitle: 'Join professionals using ResumeAI Pro to land better opportunities',
        formTitle: 'Create your free account',
        formSubtitle: 'Start building your ATS-optimized resume in minutes.',
      };
    case '/forgot-password':
      return {
        heroTitle: 'Reset Your Password',
        heroSubtitle: "We'll send you a secure link to reset your password",
        formTitle: 'Reset your password',
        formSubtitle: 'Enter your email and we’ll help you get back in.',
      };
    case '/verify-email':
      return {
        heroTitle: 'Verify Your Email',
        heroSubtitle: 'Check your inbox for the verification link',
        formTitle: 'Verify your email',
        formSubtitle: 'Confirm your address to unlock your account securely.',
      };
    default:
      return {
        heroTitle: title || 'Create Professional Resumes',
        heroSubtitle: subtitle || 'AI-powered ATS optimization for your resume',
        formTitle: title || 'Create Professional Resumes',
        formSubtitle: subtitle || 'AI-powered ATS optimization for your resume',
      };
  }
};

const AuthLayout = ({ children, title, subtitle }) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { loginWithProvider } = useAuth();

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [stats, setStats] = useState(() =>
    shouldReduceMotion ? TARGET_STATS : { users: 0, resumes: 0, successRate: 0 }
  );

  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const showSocialLogin = isLogin || isSignup;

  const routeMeta = useMemo(
    () => getRouteMeta(location.pathname, title, subtitle),
    [location.pathname, title, subtitle]
  );

  const currentTestimonialData = TESTIMONIALS[currentTestimonial];

  useEffect(() => {
    if (shouldReduceMotion) {
      setStats(TARGET_STATS);
      return undefined;
    }

    let animationFrameId;
    const duration = 1200;
    const startTime = performance.now();

    const animateStats = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setStats({
        users: Math.round(TARGET_STATS.users * easedProgress),
        resumes: Math.round(TARGET_STATS.resumes * easedProgress),
        successRate: Math.round(TARGET_STATS.successRate * easedProgress),
      });

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(animateStats);
      }
    };

    animationFrameId = window.requestAnimationFrame(animateStats);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || TESTIMONIALS.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTestimonial((previous) => (previous + 1) % TESTIMONIALS.length);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [shouldReduceMotion]);

  const handleSocialLogin = useCallback(
    async (provider) => {
      if (loadingProvider) {
        return;
      }

      setLoadingProvider(provider);

      try {
        await loginWithProvider(provider);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Social login failed for ${provider}`, error);
        }
      } finally {
        setLoadingProvider(null);
      }
    },
    [loadingProvider, loginWithProvider]
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 lg:flex lg:w-1/2 xl:p-12">
        <div className="absolute right-4 top-4 z-20">
          <ThemeToggle />
        </div>

        <div className="absolute left-4 top-4 z-20 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
          >
            <FiArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/help"
            className="text-sm text-white/60 transition-colors hover:text-white/80"
          >
            Help
          </Link>
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [1, 1.16, 1],
                    rotate: [0, 180, 360],
                  }
            }
            transition={
              shouldReduceMotion
                ? undefined
                : { duration: 20, repeat: Infinity, ease: 'linear' }
            }
            className="absolute -right-1/2 -top-1/2 h-full w-full rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"
          />
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [1.16, 1, 1.16],
                    rotate: [360, 180, 0],
                  }
            }
            transition={
              shouldReduceMotion
                ? undefined
                : { duration: 16, repeat: Infinity, ease: 'linear' }
            }
            className="absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full bg-gradient-to-tr from-black/20 to-transparent blur-3xl"
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-8">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <FiFileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">ResumeAI Pro</h1>
                <Badge
                  variant="success"
                  className="border-white/30 bg-white/20 text-white"
                >
                  v2.5
                </Badge>
              </div>

              <h2 className="text-2xl font-semibold leading-tight text-white/95 xl:text-3xl">
                {routeMeta.heroTitle}
              </h2>
              <p className="mt-2 text-lg text-white/80">{routeMeta.heroSubtitle}</p>
            </div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8 grid grid-cols-3 gap-4"
            >
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm transition-colors hover:bg-white/15">
                <FiUsers className="mx-auto mb-2 h-6 w-6 text-white/80" />
                <div className="text-2xl font-bold text-white">
                  {formatStatValue('users', stats.users)}
                </div>
                <div className="text-xs text-white/70">Active Users</div>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm transition-colors hover:bg-white/15">
                <FiFileText className="mx-auto mb-2 h-6 w-6 text-white/80" />
                <div className="text-2xl font-bold text-white">
                  {formatStatValue('resumes', stats.resumes)}
                </div>
                <div className="text-xs text-white/70">Resumes Created</div>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm transition-colors hover:bg-white/15">
                <FiTrendingUp className="mx-auto mb-2 h-6 w-6 text-white/80" />
                <div className="text-2xl font-bold text-white">
                  {formatStatValue('successRate', stats.successRate)}
                </div>
                <div className="text-xs text-white/70">Success Rate</div>
              </div>
            </motion.div>

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
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 transition-all group-hover:scale-105 group-hover:bg-white/30">
                    <feature.icon className={`h-4 w-4 ${feature.iconClassName}`} />
                  </div>
                  <span className="text-base">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <div
              className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
              aria-live="polite"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonialData.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FiStar
                        key={index}
                        className="h-4 w-4 fill-current text-yellow-400"
                      />
                    ))}
                  </div>

                  <p className="mb-4 text-base italic text-white/90">
                    "{currentTestimonialData.text}"
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/30 to-white/10 font-semibold text-white">
                      {currentTestimonialData.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {currentTestimonialData.author}
                      </p>
                      <p className="text-sm text-white/70">
                        {currentTestimonialData.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 flex justify-center gap-2">
                {TESTIMONIALS.map((testimonial, index) => (
                  <button
                    key={testimonial.id}
                    type="button"
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentTestimonial
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`View testimonial ${index + 1}`}
                    aria-pressed={index === currentTestimonial}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

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

      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <FiArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
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

              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {routeMeta.heroTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {routeMeta.heroSubtitle}
              </p>
            </div>
          </div>

          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {routeMeta.formTitle}
            </h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {routeMeta.formSubtitle}
            </p>
          </div>

          {showSocialLogin && (
            <div className="mb-6">
              <p className="mb-3 text-center text-xs text-gray-500 dark:text-gray-400">
                Continue with
              </p>

              <div className="grid grid-cols-3 gap-2">
                {SOCIAL_PROVIDERS.map((provider) => {
                  const Icon = provider.icon;
                  const isProviderLoading = loadingProvider === provider.id;

                  return (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin(provider.id)}
                      loading={isProviderLoading}
                      disabled={Boolean(loadingProvider)}
                      className="justify-center"
                      aria-label={provider.label}
                      title={provider.label}
                    >
                      <Icon className={`h-5 w-5 ${provider.iconClassName || ''}`} />
                    </Button>
                  );
                })}
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

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, x: -18 }}
              transition={{ duration: 0.28 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {isLogin && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-center text-xs text-blue-700 dark:text-blue-300">
                <strong>Demo Access:</strong> user@example.com / demo123456
              </p>
            </div>
          )}

          <div className="mt-8 lg:hidden">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <FiShield className="h-3 w-3" />
                <span>SSL Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <FiAward className="h-3 w-3" />
                <span>GDPR Ready</span>
              </div>
              <div className="flex items-center gap-1">
                <FiStar className="h-3 w-3" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>

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

export default AuthLayout;
