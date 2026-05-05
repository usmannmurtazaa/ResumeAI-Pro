import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMail, FiCheckCircle, FiAlertCircle, FiLoader,
  FiArrowRight, FiRefreshCw, FiHome, FiLogIn,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/layouts/AuthLayout';
import Button from '../components/ui/Button';
import { usePageTitle } from '../hooks/useDocumentTitle';
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
  const [status, setStatus] = useState('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const mountedRef = useRef(true);

  // Set page title
  usePageTitle({
    title: 'Verify Your Email',
    description: 'Verify your email address to complete your ResumeAI Pro account setup.',
  });

  const params = new URLSearchParams(location.search);
  const oobCode = params.get('oobCode');
  const mode = params.get('mode');

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Verify email with code ──────────────────────────────────────────

  useEffect(() => {
    const verifyEmail = async () => {
      // No code provided - check auth state
      if (!oobCode || mode !== 'verifyEmail') {
        if (user) {
          if (isEmailVerified) {
            setStatus('already-verified');
          } else {
            setStatus('needs-verification');
          }
          setEmail(user.email || '');
        } else {
          setStatus('needs-login');
        }
        setLoading(false);
        return;
      }

      // Have code - verify
      setVerifying(true);
      try {
        const info = await checkActionCode(auth, oobCode);
        if (mountedRef.current) setEmail(info.data.email || '');

        await applyActionCode(auth, oobCode);

        if (user && mountedRef.current) {
          try { await refreshUserData?.(); } catch {}
        }

        if (mountedRef.current) {
          setStatus('success');
          toast.success('Email verified successfully!');
        }
      } catch (error) {
        console.error('Verification error:', error);
        if (!mountedRef.current) return;

        setStatus('error');
        const messages = {
          'auth/invalid-action-code': 'The verification link is invalid or has expired.',
          'auth/user-disabled': 'This account has been disabled.',
          'auth/user-not-found': 'No account found with this email.',
        };
        setErrorMessage(messages[error.code] || error.message || 'Failed to verify email.');
        toast.error('Email verification failed');
      } finally {
        if (mountedRef.current) {
          setVerifying(false);
          setLoading(false);
        }
      }
    };

    verifyEmail();
  }, [oobCode, mode, user, isEmailVerified, refreshUserData]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleResendVerification = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setResending(true);
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch {
      toast.error('Failed to send verification email.');
    } finally {
      if (mountedRef.current) setResending(false);
    }
  };

  // ── Loading State ────────────────────────────────────────────────────

  if (loading || verifying) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <FiLoader className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Verifying Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your email address...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center py-8">
        {/* Success */}
        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Email Verified!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {email ? `Your email ${email} has been verified.` : 'Your email has been verified.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {user ? (
                <Button onClick={() => navigate('/dashboard')} icon={<FiArrowRight />}>Dashboard</Button>
              ) : (
                <Button onClick={() => navigate('/login')} icon={<FiLogIn />}>Sign In</Button>
              )}
              <Button variant="outline" onClick={() => navigate('/')} icon={<FiHome />}>Home</Button>
            </div>
          </motion.div>
        )}

        {/* Already Verified */}
        {status === 'already-verified' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Already Verified</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Your email is already verified. You're all set!</p>
            <Button onClick={() => navigate('/dashboard')} icon={<FiArrowRight />}>Go to Dashboard</Button>
          </motion.div>
        )}

        {/* Needs Verification */}
        {status === 'needs-verification' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMail className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Verify Your Email</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">We sent a verification email to:</p>
            <p className="text-lg font-medium mb-4">{email || user?.email}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={handleResendVerification} loading={resending} icon={<FiRefreshCw />}>Resend</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            </div>
            <p className="text-xs text-gray-400 mt-4">Check your spam folder if you don't see it.</p>
          </motion.div>
        )}

        {/* Needs Login */}
        {status === 'needs-login' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMail className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Check Your Email</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We sent a verification link to your email. Please sign in to complete verification.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/login')} icon={<FiLogIn />}>Sign In</Button>
              <Button variant="outline" onClick={() => navigate('/')} icon={<FiHome />}>Home</Button>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Verification Failed</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The verification link may have expired. Request a new one.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/login')} icon={<FiLogIn />}>Sign In</Button>
              <Button variant="outline" onClick={() => navigate('/contact')}>Contact Support</Button>
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
