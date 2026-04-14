import React, { useState, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiMail,
  FiLock,
  FiGithub,
  FiTwitter
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const Login = () => {
  const { user, loginWithProvider } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    users: 0,
    resumes: 0,
    successRate: 0
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Redirect message from protected route
  const fromLocation = location.state?.from?.pathname;
  const authMessage = location.state?.message;

  // Show auth message if redirected
  useEffect(() => {
    if (authMessage) {
      toast(authMessage, {
        icon: '🔒',
        duration: 5000
      });
    }
  }, [authMessage]);

  // Animate stats on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        users: Math.min(prev.users + 123, 50000),
        resumes: Math.min(prev.resumes + 456, 100000),
        successRate: Math.min(prev.successRate + 1, 94)
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (user) {
    return <Navigate to={fromLocation || '/dashboard'} />;
  }

  const features = [
    { icon: FiZap, text: 'AI-powered ATS optimization', color: 'text-yellow-400' },
    { icon: FiFileText, text: 'Professional templates', color: 'text-blue-400' },
    { icon: FiTarget, text: 'Real-time preview & scoring', color: 'text-green-400' },
    { icon: FiTrendingUp, text: 'Keyword suggestions', color: 'text-purple-400' },
    { icon: FiShield, text: 'Secure & private', color: 'text-cyan-400' }
  ];

  const testimonials = [
    {
      text: "ResumeAi Pro helped me land my dream job at Google. The ATS optimization is incredible!",
      author: "Sarah Chen",
      role: "Software Engineer at Google",
      avatar: "SC",
      rating: 5
    },
    {
      text: "I increased my interview calls by 300% after using this resume builder. Highly recommended!",
      author: "Michael Rodriguez",
      role: "Product Manager at Microsoft",
      avatar: "MR",
      rating: 5
    },
    {
      text: "The AI suggestions are spot-on. My resume went from average to outstanding in minutes.",
      author: "Emily Watson",
      role: "Marketing Director at Amazon",
      avatar: "EW",
      rating: 5
    }
  ];

  const currentTestimonialData = testimonials[currentTestimonial];

  const handleSocialLogin = async (provider) => {
    try {
      await loginWithProvider(provider);
      toast.success(`Successfully signed in with ${provider}!`);
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error(`Failed to sign in with ${provider}`);
    }
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
        <div className="absolute top-4 left-4 z-20">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
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
                <h1 className="text-3xl font-bold text-white">ResumeAi Pro</h1>
                <Badge variant="success" className="bg-white/20 text-white border-white/30">
                  v2.0
                </Badge>
              </div>
              <h2 className="text-2xl xl:text-3xl font-semibold text-white/95 leading-tight">
                Welcome Back!
              </h2>
              <p className="text-lg text-white/80 mt-2">
                Sign in to continue building your professional resume
              </p>
            </div>

            {/* Live Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <FiUsers className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {(stats.users / 1000).toFixed(0)}K+
                </div>
                <div className="text-xs text-white/70">Active Users</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <FiFileText className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {(stats.resumes / 1000).toFixed(0)}K+
                </div>
                <div className="text-xs text-white/70">Resumes Created</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <FiTrendingUp className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {stats.successRate}%
                </div>
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
              <p className="text-white/90 text-base italic mb-4">
                "{currentTestimonialData.text}"
              </p>
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
                <h1 className="text-2xl font-bold gradient-text">ResumeAi Pro</h1>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Welcome Back!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                Sign in to continue building your resume
              </p>
            </div>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Sign in to your account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back! Please enter your details
            </p>
          </div>

          {/* Quick Social Login */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 text-center mb-3">Quick sign in with</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                className="justify-center"
              >
                <FcGoogle className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('github')}
                className="justify-center"
              >
                <FiGithub className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('twitter')}
                className="justify-center"
              >
                <FiTwitter className="w-5 h-5 text-blue-400" />
              </Button>
            </div>
          </div>

          {/* Divider */}
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
          
          {/* Login Form */}
          <LoginForm redirectTo={fromLocation} />

          {/* Sign Up Link */}
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

          {/* Demo Credentials Hint */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              <strong>Demo Access:</strong> user@example.com / demo123456
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary-500 hover:text-primary-600">
                Terms
              </Link>
              {' '}and{' '}
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