import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMail, FiCheckCircle, FiAlertCircle, FiLoader,
  FiArrowRight, FiRefreshCw, FiHome, FiLogIn,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '../services/firebase';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sendVerificationEmail, isEmailVerified, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'already-verified'
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');

  // Get oobCode from URL
  const params = new URLSearchParams(location.search);
  const oobCode = params.get('oobCode');
  const mode = params.get('mode');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!oobCode || mode !== 'verifyEmail') {
        // No code, check if already logged in and verified
        if (user) {
          if (isEmailVerified) {
            setStatus('already-verified');
          } else {
            setStatus('needs-verification');
          }
          setEmail(user.email);
        } else {
          setStatus('needs-login');
        }
        setLoading(false);
        return;
      }

      setVerifying(true);
      try {
        // Check the action code validity
        const info = await checkActionCode(auth, oobCode);
        setEmail(info.data.email);

        // Apply the verification
        await applyActionCode(auth, oobCode);
        
        // Refresh user data if logged in
        if (user) {
          await refreshUserData();
        }

        setStatus('success');
        toast.success('Email verified successfully!');
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        
        switch (error.code) {
          case 'auth/invalid-action-code':
            setErrorMessage('The verification link is invalid or has expired.');
            break;
          case 'auth/user-disabled':
            setErrorMessage('This account has been disabled.');
            break;
          case 'auth/user-not-found':
            setErrorMessage('No account found with this email.');
            break;
          default:
            setErrorMessage(error.message || 'Failed to verify email.');
        }
        
        toast.error('Email verification failed');
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyEmail();
  }, [oobCode, mode, user, isEmailVerified, refreshUserData]);

  const handleResendVerification = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setResending(true);
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error('Failed to send verification email.');
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    // Loading state
    if (loading || verifying) {
      return (
        <div className="text-center py-12">
          <FiLoader className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Verifying Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we verify your email address...
          </p>
        </div>
      );
    }

    // Success state
    if (status === 'success') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Email Verified!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your email {email} has been successfully verified.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {user ? (
              <Button onClick={() => navigate('/dashboard')} icon={<FiArrowRight />}>
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} icon={<FiLogIn />}>
                Sign In
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/')} icon={<FiHome />}>
              Home
            </Button>
          </div>
        </motion.div>
      );
    }

    // Already verified state
    if (status === 'already-verified') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Already Verified</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your email is already verified. You're all set!
          </p>
          <Button onClick={() => navigate('/dashboard')} icon={<FiArrowRight />}>
            Go to Dashboard
          </Button>
        </motion.div>
      );
    }

    // Needs verification (logged in but not verified)
    if (status === 'needs-verification') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiMail className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            We sent a verification email to:
          </p>
          <p className="text-lg font-medium mb-4">{email}</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click the link in the email to verify your account.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleResendVerification} loading={resending} icon={<FiRefreshCw />}>
              Resend Email
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Check your spam folder if you don't see the email.
          </p>
        </motion.div>
      );
    }

    // Needs login state
    if (status === 'needs-login') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiMail className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Check Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We sent a verification link to your email. Please sign in to complete verification.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => navigate('/login')} icon={<FiLogIn />}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} icon={<FiHome />}>
              Home
            </Button>
          </div>
        </motion.div>
      );
    }

    // Error state
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Verification Failed</h2>
        <p className="text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The verification link may have expired. Please request a new one.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate('/login')} icon={<FiLogIn />}>
            Sign In
          </Button>
          <Button variant="outline" onClick={() => navigate('/contact')}>
            Contact Support
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <AuthLayout title="Email Verification" subtitle="Verify your email address">
      <Card className="p-8">{renderContent()}</Card>
    </AuthLayout>
  );
};

export default VerifyEmail;