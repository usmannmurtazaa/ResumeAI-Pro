import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ForgotPassword from '../components/auth/ForgotPassword';

const ForgotPasswordPage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <ForgotPassword />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;