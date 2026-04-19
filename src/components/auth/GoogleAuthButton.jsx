import React, { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { FcGoogle } from 'react-icons/fc';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ 
  onSuccess, 
  onError,
  mode = 'signin',
  variant = 'outline',
  size = 'md',
  className = '',
  showIcon = true,
  label = null,
  redirectOnMobile = false,
  linkToExisting = false,
  scopes = ['profile', 'email']
}) => {
  const [loading, setLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          await handleSuccessfulAuth(user);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        handleAuthError(error);
      }
    };
    
    handleRedirectResult();
  }, []);

  const handleSuccessfulAuth = async (user, isNewUser = false) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || null,
          role: 'user',
          status: 'active',
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: 'google',
          providerData: {
            providerId: 'google.com',
            uid: user.providerData[0]?.uid
          }
        });
        
        toast.success('Account created successfully! Welcome aboard!', {
          icon: '🎉',
          duration: 3000
        });
      } else {
        // Update existing user document
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          photoURL: user.photoURL || userDoc.data().photoURL,
          emailVerified: user.emailVerified,
          updatedAt: serverTimestamp()
        });
        
        // Only show welcome back for signin
        if (mode === 'signin') {
          toast.success('Welcome back! Successfully signed in with Google', {
            icon: '👋',
            duration: 2000
          });
        }
      }
      
      onSuccess?.(user);
    } catch (error) {
      console.error('Error updating user document:', error);
      // Still call onSuccess even if Firestore update fails
      toast.warning('Signed in, but profile update failed. Please try refreshing.');
      onSuccess?.(user);
    }
  };

  const handleAuthError = (error) => {
    console.error('Google auth error:', error);
    
    let errorMessage = 'Failed to authenticate with Google';
    let showLinkOption = false;
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign-in popup was closed. Please try again.';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Sign-in popup was blocked. Please allow popups for this site.';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'Another sign-in request is already in progress.';
        break;
      case 'auth/account-exists-with-different-credential':
        errorMessage = 'An account already exists with this email using a different sign-in method.';
        showLinkOption = true;
        setPendingCredential(error.credential);
        setShowLinkModal(true);
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Google authentication is not enabled. Please contact support.';
        break;
      case 'auth/internal-error':
        errorMessage = 'An internal error occurred. Please try again.';
        break;
      default:
        errorMessage = error.message || 'Failed to authenticate with Google';
    }
    
    toast.error(errorMessage);
    onError?.(error);
    
    return { errorMessage, showLinkOption };
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    // Add requested scopes
    scopes.forEach(scope => provider.addScope(scope));
    
    // Set custom parameters
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      // Use redirect on mobile if specified
      if (redirectOnMobile && isMobile) {
        await signInWithRedirect(auth, provider);
        return; // Redirect will handle the rest
      }
      
      const result = await signInWithPopup(auth, provider);
      await handleSuccessfulAuth(result.user);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!linkEmail || !linkPassword) {
      toast.error('Please enter your email and password');
      return;
    }

    setLinkLoading(true);
    
    try {
      // Sign in with email/password
      const credential = EmailAuthProvider.credential(linkEmail, linkPassword);
      
      // Link with Google credential
      if (pendingCredential) {
        const result = await linkWithCredential(auth.currentUser, pendingCredential);
        await handleSuccessfulAuth(result.user);
        setShowLinkModal(false);
        toast.success('Accounts linked successfully!');
      }
    } catch (error) {
      console.error('Link account error:', error);
      
      let errorMessage = 'Failed to link accounts';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLinkLoading(false);
    }
  };

  const buttonLabel = label || (mode === 'signin' ? 'Continue with Google' : 'Sign up with Google');

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleGoogleAuth}
        loading={loading}
        icon={showIcon ? <FcGoogle className="w-5 h-5" /> : null}
        className={`
          w-full justify-center
          bg-white hover:bg-gray-50 
          dark:bg-gray-800 dark:hover:bg-gray-700 
          border-gray-300 dark:border-gray-600
          transition-all duration-200
          ${className}
        `}
      >
        {buttonLabel}
      </Button>

      {/* Account Linking Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setPendingCredential(null);
        }}
        title="Link Google Account"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
            <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                Account Already Exists
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                An account with this email already exists. Sign in with your password to link your Google account.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={linkPassword}
              onChange={(e) => setLinkPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowLinkModal(false);
                setPendingCredential(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkAccount}
              loading={linkLoading}
              className="flex-1"
            >
              Link Account
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Forgot your password?{' '}
            <button
              onClick={() => {
                setShowLinkModal(false);
                window.location.href = '/forgot-password';
              }}
              className="text-primary-500 hover:text-primary-600"
            >
              Reset it here
            </button>
          </p>
        </div>
      </Modal>

      {/* Trust Indicator */}
      <AnimatePresence>
        {!loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-2"
          >
            <FiCheckCircle className="w-3 h-3 text-green-500" />
            <span>Secure Google authentication</span>
            <span>•</span>
            <span>We never post without permission</span>
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
};

// Additional component for Google One Tap
export const GoogleOneTap = ({ onSuccess, onError }) => {
  const [showOneTap, setShowOneTap] = useState(true);

  useEffect(() => {
    // Initialize Google One Tap
    const initializeOneTap = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: (response) => {
            // Handle the credential
            console.log('One Tap response:', response);
            onSuccess?.(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('One Tap not displayed:', notification.getNotDisplayedReason());
            setShowOneTap(false);
          }
        });
      }
    };

    // Load Google script if not already loaded
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeOneTap;
      document.head.appendChild(script);
    } else {
      initializeOneTap();
    }
  }, [onSuccess]);

  return null; // One Tap is rendered by Google
};

export default GoogleAuthButton;