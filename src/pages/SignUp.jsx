import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SignUpForm from '../components/auth/SignUpForm';
import AuthLayout from '../layouts/AuthLayout';
import { usePageTitle } from '../hooks/useDocumentTitle';
import Loader from '../components/common/Loader';

// ── Utility ───────────────────────────────────────────────────────────────

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// ── Component ─────────────────────────────────────────────────────────────

const SignUp = () => {
  const { user, loading, initializing } = useAuth();
  const location = useLocation();

  // Get plan from URL params
  const params = new URLSearchParams(location.search);
  const selectedPlan = params.get('plan');

  // Set page title
  usePageTitle({
    title: 'Create Your Free Account',
    description: 'Join 50,000+ professionals using ResumeAI Pro to create ATS-optimized resumes. Free plan available.',
  });

  // Show loader while auth initializes
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Loader variant="brand" size="lg" text="Loading..." />
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" state={{ welcome: true }} replace />;
  }

  return (
    <AuthLayout>
      <SignUpForm selectedPlan={selectedPlan} redirectTo="/dashboard" />
    </AuthLayout>
  );
};

export default SignUp;