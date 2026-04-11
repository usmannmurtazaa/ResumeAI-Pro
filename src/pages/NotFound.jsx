import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiSearch } from 'react-icons/fi';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg"
      >
        <div className="text-9xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.history.back()} icon={<FiSearch />} variant="outline">
            Go Back
          </Button>
          <Link to="/">
            <Button icon={<FiHome />}>
              Home Page
            </Button>
          </Link>
        </div>

        <div className="mt-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gray-50 dark:bg-gray-900 text-gray-500">
                Popular Pages
              </span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Link to="/dashboard" className="text-primary-600 hover:text-primary-700">
              Dashboard
            </Link>
            <Link to="/builder" className="text-primary-600 hover:text-primary-700">
              Create Resume
            </Link>
            <Link to="/templates" className="text-primary-600 hover:text-primary-700">
              Templates
            </Link>
            <Link to="/pricing" className="text-primary-600 hover:text-primary-700">
              Pricing
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;