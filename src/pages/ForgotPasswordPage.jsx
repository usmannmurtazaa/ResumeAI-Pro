import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import ForgotPassword from '../components/auth/ForgotPassword';
import AuthLayout from '../components/layouts/AuthLayout';
import { usePageTitle } from '../hooks/useDocumentTitle';
import Loader from '../components/common/Loader';

const ForgotPasswordPage = () => {
  const { user, loading, initializing } = useAuth();

  // Set page title
  usePageTitle({
    title: 'Forgot Password',
    description: 'Reset your ResumeAI Pro account password. We\'ll send you a secure link to create a new password.',
  });

  // Show loader while auth is initializing
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Loader variant="brand" size="lg" text="Loading..." />
      </div>
    );
  }

  // Redirect authenticated users
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ForgotPassword />
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
