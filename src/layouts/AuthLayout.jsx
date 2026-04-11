import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/common/ThemeToggle';

const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen flex">
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
            <h1 className="text-4xl font-bold text-white mb-4">
              Create Your ATS-Optimized Resume
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of professionals who've landed their dream jobs with our resume builder.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  ✓
                </div>
                <span>ATS-friendly templates</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  ✓
                </div>
                <span>Real-time preview</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  ✓
                </div>
                <span>Keyword optimization</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden absolute top-4 right-4">
            <ThemeToggle />
          </div>
          
          <div className="mb-8 lg:hidden">
            <h1 className="text-3xl font-bold gradient-text">ATS Resume Builder</h1>
          </div>
          
          {title && (
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {title}
            </h2>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;