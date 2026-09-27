import React, { useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiAward,
  FiShield,
  FiZap,
  FiFileText,
  FiTarget,
  FiTrendingUp,
  FiArrowLeft,
} from 'react-icons/fi';
import AuthLayout from '../components/layouts/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import ThemeToggle from '../components/common/ThemeToggle';
import Badge from '../components/ui/Badge';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

const FEATURES = [
  { icon: FiZap, text: 'AI-powered ATS optimization', color: 'text-yellow-400' },
  { icon: FiFileText, text: 'Professional templates', color: 'text-blue-400' },
  { icon: FiTarget, text: 'Real-time preview & scoring', color: 'text-green-400' },
  { icon: FiTrendingUp, text: 'Keyword suggestions', color: 'text-purple-400' },
  { icon: FiShield, text: 'Secure & private', color: 'text-cyan-400' },
];

// ── Component ─────────────────────────────────────────────────────────────

const Login = () => {
  const { user, loading, initializing } = useAuth();
  const location = useLocation();

  const fromLocation = location.state?.from?.pathname || '/dashboard';
  const authMessage = location.state?.message;

  // ── Show auth message ────────────────────────────────────────────────

  useEffect(() => {
    if (authMessage) {
      toast(authMessage, { icon: '🔒', duration: 5000 });
    }
  }, [authMessage]);

  // ── Loading State ────────────────────────────────────────────────────

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Loader variant="brand" size="lg" text="Loading..." />
      </div>
    );
  }

  // ── Redirect if authenticated ────────────────────────────────────────

  if (user) {
    return <Navigate to={fromLocation} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 xl:p-12 relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <Link
          to="/"
          className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-black/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center max-w-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FiFileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Resume Ai Pro</h1>
                <Badge variant="success" className="bg-white/20 text-white border-white/30">
                  v2.5
                </Badge>
              </div>
              <h2 className="text-2xl xl:text-3xl font-semibold text-white/95">Welcome Back!</h2>
              <p className="text-lg text-white/80 mt-2">
                Sign in to continue building your professional resume
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 text-white/90 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 group-hover:scale-110 transition-all">
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                  </div>
                  <span className="text-base">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Honest tagline - replaces fabricated stats and testimonials */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <p className="text-white/90 text-base leading-relaxed">
                Build, optimise, and download your ATS-ready resume - all in one place. Free to
                start, no credit card required.
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-center gap-6 text-white/60 text-xs">
            <span className="flex items-center gap-1">
              <FiShield className="w-3 h-3" />
              256-bit SSL
            </span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1">
              <FiAward className="w-3 h-3" />
              GDPR Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Home</span>
              </Link>
              <ThemeToggle />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <FiFileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold gradient-text">Resume Ai Pro</h1>
              </div>
              <h2 className="text-xl font-semibold">Welcome Back!</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Sign in to continue</p>
            </div>
          </div>

          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Sign in to your account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back! Please enter your details
            </p>
          </div>

          <LoginForm redirectTo={fromLocation} />

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
              >
                Create free account
              </Link>
            </p>
          </div>

          {/* Demo credentials only in development */}
          {IS_DEVELOPMENT && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                <strong>Demo:</strong> user@example.com / demo123456
              </p>
            </div>
          )}

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

export default Login;
