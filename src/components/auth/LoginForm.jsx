import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcPhone } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import GoogleAuthButton from './GoogleAuthButton';
import PhoneAuth from './PhoneAuth';

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    navigate('/dashboard');
  };

  const handlePhoneSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 dark:text-white">
          Welcome Back
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Sign in to your ResumeAi Pro account
        </p>

        {/* Social Sign In Options */}
        <div className="space-y-3 mb-6">
          <GoogleAuthButton onSuccess={handleGoogleSuccess} mode="signin" />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPhoneAuth(true)}
            icon={<FcPhone className="w-5 h-5" />}
            className="w-full bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
          >
            Continue with Phone
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or sign in with email
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            icon={<FiMail />}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={<FiLock />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            }
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            error={errors.password?.message}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Phone Authentication Modal */}
      <PhoneAuth
        isOpen={showPhoneAuth}
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handlePhoneSuccess}
      />
    </>
  );
};

export default LoginForm;