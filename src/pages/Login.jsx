import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import AuthLayout from '../layouts/AuthLayout';

const Login = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <AuthLayout title="Welcome Back">
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;