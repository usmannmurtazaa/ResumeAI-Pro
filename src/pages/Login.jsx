import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheck, FiStar, FiAward, FiUsers, FiTrendingUp,
  FiShield, FiZap, FiFileText, FiTarget,
  FiArrowLeft,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import ThemeToggle from '../components/common/ThemeToggle';
import Badge from '../components/ui/Badge';
import { usePageTitle } from '../hooks/useDocumentTitle';
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

const TESTIMONIALS = [
  { text: "ResumeAI Pro helped me land my dream job at Google. The ATS optimization is incredible!", author: "Sarah Chen", role: "Software Engineer at Google", avatar: "SC" },
  { text: "I increased my interview calls by 300% after using this resume builder.", author: "Michael Rodriguez", role: "Product Manager at Microsoft", avatar: "MR" },
  { text: "The AI suggestions are spot-on. My resume went from average to outstanding.", author: "Emily Watson", role: "Marketing Director at Amazon", avatar: "EW" },
];

const TARGET_STATS = { users: 50000, resumes: 100000, successRate: 94 };

// ── Utility ───────────────────────────────────────────────────────────────

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// ── Component ─────────────────────────────────────────────────────────────

const Login = () => {
  const { user, loading, initializing } = useAuth();
  const location = useLocation();

  usePageTitle({
    title: 'Sign In',
    description: 'Sign in to ResumeAI Pro to access your resumes, ATS scores, and saved progress.',
  });

  const [stats, setStats] = useState({ users: 0, resumes: 0, successRate: 0 });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const animationRef = useRef(null);
  const mountedRef = useRef(true);

  const fromLocation = location.state?.from?.pathname || '/dashboard';
  const authMessage = location.state?.message;

  // ── Show auth message ────────────────────────────────────────────────

  useEffect(() => {
    if (authMessage) {
      toast(authMessage, { icon: '🔒', duration: 5000 });
    }
  }, [authMessage]);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ── FIXED: RAF-based stats animation ─────────────────────────────────

  useEffect(() => {
    const duration = 2000;
    const startTime = performance.now();

    const animate = (timestamp) => {
      if (!mountedRef.current) return;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setStats({
        users: Math.round(TARGET_STATS.users * eased),
        resumes: Math.round(TARGET_STATS.resumes * eased),
        successRate: Math.round(TARGET_STATS.successRate * eased),
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ── Auto-rotate testimonials ─────────────────────────────────────────

  useEffect(() => {
    if (TESTIMONIALS.length <= 1) return;
    const interval = setInterval(() => {
      if (mountedRef.current) {
        setCurrentTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const currentTestimonialData = TESTIMONIALS[currentTestimonial];

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
        <div className="absolute top-4 right-4 z-20"><ThemeToggle /></div>
        <Link to="/" className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <FiArrowLeft className="w-4 h-4" /><span className="text-sm">Back to Home</span>
        </Link>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-black/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center max-w-lg mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"><FiFileText className="w-6 h-6 text-white" /></div>
                <h1 className="text-3xl font-bold text-white">ResumeAI Pro</h1>
                <Badge variant="success" className="bg-white/20 text-white border-white/30">v2.5</Badge>
              </div>
              <h2 className="text-2xl xl:text-3xl font-semibold text-white/95">Welcome Back!</h2>
              <p className="text-lg text-white/80 mt-2">Sign in to continue building your professional resume</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <FiUsers className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{(stats.users / 1000).toFixed(0)}K+</div>
                <div className="text-xs text-white/70">Active Users</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <FiFileText className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{(stats.resumes / 1000).toFixed(0)}K+</div>
                <div className="text-xs text-white/70">Resumes Created</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <FiTrendingUp className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.successRate}%</div>
                <div className="text-xs text-white/70">Success Rate</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {FEATURES.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 text-white/90 group">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 group-hover:scale-110 transition-all">
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                  </div>
                  <span className="text-base">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Testimonial */}
            <AnimatePresence mode="wait">
              <motion.div key={currentTestimonial} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}</div>
                <p className="text-white/90 text-base italic mb-4">"{currentTestimonialData.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-white font-semibold">{currentTestimonialData.avatar}</div>
                  <div><p className="text-white font-medium">{currentTestimonialData.author}</p><p className="text-white/70 text-sm">{currentTestimonialData.role}</p></div>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {TESTIMONIALS.map((_, i) => (
                    <button key={i} onClick={() => setCurrentTestimonial(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentTestimonial ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-center gap-6 text-white/60 text-xs">
            <span className="flex items-center gap-1"><FiShield className="w-3 h-3" />256-bit SSL</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1"><FiAward className="w-3 h-3" />GDPR Compliant</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1"><FiStar className="w-3 h-3" />4.9/5 Rating</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600"><FiArrowLeft className="w-4 h-4" /><span className="text-sm">Back to Home</span></Link>
              <ThemeToggle />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center"><FiFileText className="w-5 h-5 text-white" /></div>
                <h1 className="text-2xl font-bold gradient-text">ResumeAI Pro</h1>
              </div>
              <h2 className="text-xl font-semibold">Welcome Back!</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Sign in to continue</p>
            </div>
          </div>

          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Sign in to your account</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Please enter your details</p>
          </div>

          <LoginForm redirectTo={fromLocation} />

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline">Create free account</Link>
            </p>
          </div>

          {/* FIXED: Demo credentials only in development */}
          {IS_DEVELOPMENT && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                <strong>Demo:</strong> user@example.com / demo123456
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>By continuing, you agree to our{' '}
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

export default Login;