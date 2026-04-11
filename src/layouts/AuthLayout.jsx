import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/common/ThemeToggle';

const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-12 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="inline-block mb-8">
              <img src="/logo-white.svg" alt="ResumeAi Pro" className="h-10" />
            </Link>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Create Your ATS-Optimized Resume
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of professionals who've landed their dream jobs with ResumeAi Pro.
            </p>
            
            <div className="space-y-4">
              {[
                'AI-powered ATS optimization',
                'Professional templates',
                'Real-time preview',
                'Keyword suggestions',
                'Instant PDF download'
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 text-white/90"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">
                    ✓
                  </div>
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block">
              <img src="/logo.svg" alt="ResumeAi Pro" className="h-8 mx-auto mb-4" />
            </Link>
            <h1 className="text-2xl font-bold gradient-text">ResumeAi Pro</h1>
          </div>
          
          <div className="lg:hidden absolute top-4 right-4">
            <ThemeToggle />
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;