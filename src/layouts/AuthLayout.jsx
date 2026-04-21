import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  FiCheck,
  FiStar,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiShield,
  FiZap,
  FiFileText,
  FiTarget,
  FiArrowLeft,
  FiHome,
  FiClock,
  FiCheckCircle,
  FiGithub,
  FiTwitter,
  FiFacebook,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const AuthLayout = ({ children, title, subtitle }) => {
  const location = useLocation();
  const { loginWithProvider } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [stats, setStats] = useState({
    users: 0,
    resumes: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const isForgotPassword = location.pathname === '/forgot-password';
  const isVerifyEmail = location.pathname === '/verify-email';

  // Features list
  const features = [
    { icon: FiZap, text: 'AI-powered ATS optimization', color: 'text-yellow-400' },
    { icon: FiFileText, text: '25+ Professional templates', color: 'text-blue-400' },
    { icon: FiTarget, text: 'Real-time preview & scoring', color: 'text-green-400' },
    { icon: FiTrendingUp, text: 'Keyword suggestions', color: 'text-purple-400' },
    { icon: FiShield, text: 'Bank-level security', color: 'text-cyan-400' },
  ];

  // Testimonials
  const testimonials = [
    {
      text: "ResumeAI Pro helped me land my dream job at Google. The ATS optimization is incredible!",
      author: "Sarah Chen",
      role: "Software Engineer at Google",
      avatar: "SC",
      rating: 5,
    },
    {
      text: "I increased my interview calls by 300% after using this resume builder. Highly recommended!",
      author: "Michael Rodriguez",
      role: "Product Manager at Microsoft",
      avatar: "MR",
      rating: 5,
    },
    {
      text: "The AI suggestions are spot-on. My resume went from average to outstanding in minutes.",
      author: "Emily Watson",
      role: "Marketing Director at Amazon",
      avatar: "EW",
      rating: 5,
    },
    {
      text: "Finally, a resume builder that actually understands ATS systems. Worth every penny!",
      author: "David Kim",
      role: "Senior Recruiter at Meta",
      avatar: "DK",
      rating: 5,
    },
  ];

  // Animate stats on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        users: Math.min(prev.users + 123, 50000),
        resumes: Math.min(prev.resumes + 456, 100000),
        successRate: Math.min(prev.successRate + 1, 94),
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const currentTestimonialData = testimonials[currentTestimonial];

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    try {
      await loginWithProvider(provider);
      toast.success(`Successfully signed in with ${provider}!`);
    } catch (error) {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const getPageTitle = () => {
    if (isLogin) return 'Welcome Back!';
    if (isSignup) return 'Start Your Journey';
    if (isForgotPassword) return 'Reset Your Password';
    if (isVerifyEmail) return 'Verify Your Email';
    return title || 'Create Professional Resumes';
  };

  const getPageSubtitle = () => {
    if (isLogin) return 'Sign in to continue building your professional resume';
    if (isSignup) return 'Join 50,000+ professionals who landed their dream jobs';
    if (isForgotPassword) return "We'll send you a link to reset your password";
    if (isVerifyEmail) return 'Check your inbox for the verification link';
    return subtitle || 'AI-powered ATS optimization for your resume';
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding & Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 xl:p-12 relative overflow-hidden">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <FiArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <Link to="/help" className="text-white/60 hover:text-white/80 text-sm transition-colors">
            Help
          </Link>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-black/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center max-w-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo & Brand */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FiFileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">ResumeAI Pro</h1>
                <Badge variant="success" className="bg-white/20 text-white border-white/30">
                  v2.5
                </Badge>
              </div>
              <h2 className="text-2xl xl:text-3xl font-semibold text-white/95 leading-tight">
                {getPageTitle()}
              </h2>
              <p className="text-lg text-white/80 mt-2">{getPageSubtitle()}</p>
            </div>

            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:bg-white/15 transition-colors">
                <FiUsers className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {(stats.users / 1000).toFixed(0)}K+
                </div>
                <div className="text-xs text-white/70">Active Users</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:bg-white/15 transition-colors">
                <FiFileText className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {(stats.resumes / 1000).toFixed(0)}K+
                </div>
                <div className="text-xs text-white/70">Resumes Created</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:bg-white/15 transition-colors">
                <FiTrendingUp className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.successRate}%</div>
                <div className="text-xs text-white/70">Success Rate</div>
              </div>
            </motion.div>

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3 mb-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 text-white/90 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 group-hover:scale-110 transition-all">
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                  </div>
                  <span className="text-base">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Testimonial */}
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-white/90 text-base italic mb-4">"{currentTestimonialData.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-white font-semibold">
                  {currentTestimonialData.avatar}
                </div>
                <div>
                  <p className="text-white font-medium">{currentTestimonialData.author}</p>
                  <p className="text-white/70 text-sm">{currentTestimonialData.role}</p>
                </div>
              </div>

              {/* Testimonial Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentTestimonial
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-center gap-6 text-white/60 text-xs">
            <div className="flex items-center gap-1">
              <FiShield className="w-3 h-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1">
              <FiAward className="w-3 h-3" />
              <span>GDPR Compliant</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1">
              <FiStar className="w-3 h-3" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1">
              <FiCheckCircle className="w-3 h-3" />
              <span>30-Day Guarantee</span>
            </div>
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
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                <h1 className="text-2xl font-bold gradient-text">ResumeAI Pro</h1>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {getPageTitle()}
              </h2>
              {subtitle && (
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {isLogin && 'Sign in to your account'}
              {isSignup && 'Create your free account'}
              {isForgotPassword && 'Reset your password'}
              {isVerifyEmail && 'Verify your email'}
              {!isLogin && !isSignup && !isForgotPassword && !isVerifyEmail && title}
            </h2>
            {subtitle && <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>

          {/* Social Login Buttons */}
          {(isLogin || isSignup) && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 text-center mb-3">Continue with</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('google')}
                  loading={isLoading}
                  className="justify-center"
                >
                  <FcGoogle className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('github')}
                  loading={isLoading}
                  className="justify-center"
                >
                  <FiGithub className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('facebook')}
                  loading={isLoading}
                  className="justify-center"
                >
                  <FiFacebook className="w-5 h-5 text-blue-600" />
                </Button>
              </div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 backdrop-blur-sm">
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Demo Credentials Hint (Login only) */}
          {isLogin && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                <strong>Demo Access:</strong> user@example.com / demo123456
              </p>
            </div>
          )}

          {/* Mobile Trust Badges */}
          <div className="lg:hidden mt-8">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <FiShield className="w-3 h-3" />
                <span>SSL Secure</span>
              </div>
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-1">
                <FiAward className="w-3 h-3" />
                <span>GDPR Ready</span>
              </div>
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-1">
                <FiStar className="w-3 h-3" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
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