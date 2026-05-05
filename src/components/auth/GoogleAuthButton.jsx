import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  signInWithCredential,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { FcGoogle } from 'react-icons/fc';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// ── Component ───────────────────────────────────────────────────────────────

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
  disabled = false,
  scopes = ['profile', 'email'],
}) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [redirectProcessed, setRedirectProcessed] = useState(false);
  
  const mountedRef = useRef(false);
  const redirectTimeoutRef = useRef(null);

  // ── Mobile Detection ────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('resize', checkMobile);
      
      // Clear redirect timeout
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // ── Handle Redirect Result ──────────────────────────────────────────────

  useEffect(() => {
    // FIXED: Only process redirect once
    if (redirectProcessed) return;
    
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        
        if (!mountedRef.current) return;
        
        if (result) {
          setRedirectProcessed(true);
          
          const user = result.user;
          await handleSuccessfulAuth(user, true);
          
          // Handle pending credential if exists
          if (pendingCredential && mode === 'link') {
            try {
              await linkWithCredential(user, pendingCredential);
              toast.success('Google account linked successfully!');
            } catch (linkError) {
              console.error('Linking after redirect failed:', linkError);
            }
          }
        }
      } catch (error) {
        if (!mountedRef.current) return;
        
        console.error('Redirect result error:', error);
        
        // Only show error if it's not a "no result" case
        if (error.code !== 'auth/no-auth-event') {
          handleAuthError(error);
        }
        
        setRedirectProcessed(true);
      }
    };
    
    // Set timeout for redirect result (in case it never comes)
    redirectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !redirectProcessed) {
        setRedirectProcessed(true);
      }
    }, 30000); // 30 second timeout
    
    handleRedirectResult();
    
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [redirectProcessed]); // FIXED: Dependencies cleaned up

  // ── Successful Authentication Handler ───────────────────────────────────

  const handleSuccessfulAuth = async (user, isNewUser = false) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        const userData = {
          email: user.email,
          displayName: user.displayName || getDisplayNameFromEmail(user.email),
          photoURL: user.photoURL || null,
          role: 'user',
          status: 'active',
          emailVerified: user.emailVerified || false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: 'google',
          providerData: {
            providerId: GoogleAuthProvider.PROVIDER_ID,
            uid: user.providerData?.[0]?.uid,
          },
          metadata: {
            creationMethod: mode,
            platform: navigator.platform,
          },
        };
        
        await setDoc(userDocRef, userData);
        
        toast.success('Account created successfully! Welcome!', {
          icon: '🎉',
          duration: 3000,
          id: 'google-auth-success',
        });
      } else {
        // Update existing user document
        const updateData = {
          lastLogin: serverTimestamp(),
          photoURL: user.photoURL || userDoc.data().photoURL,
          emailVerified: user.emailVerified !== undefined ? user.emailVerified : userDoc.data().emailVerified,
          updatedAt: serverTimestamp(),
        };
        
        // Only update email if it changed
        if (user.email && user.email !== userDoc.data().email) {
          updateData.email = user.email;
        }
        
        await updateDoc(userDocRef, updateData);
        
        // Only show welcome back for signin mode
        if (mode === 'signin' && !isNewUser) {
          toast.success('Welcome back! Signed in with Google', {
            icon: '👋',
            duration: 2000,
            id: 'google-auth-success',
          });
        }
      }
      
      onSuccess?.(user);
    } catch (error) {
      console.error('Firestore update failed:', error);
      
      // Auth succeeded, Firestore failed - still call success
      toast.success('Signed in successfully!', {
        icon: '✅',
        duration: 2000,
        id: 'google-auth-success',
      });
      
      onSuccess?.(user);
    }
  };

  // ── Error Handler ───────────────────────────────────────────────────────

  const handleAuthError = useCallback((error) => {
    console.error('Google auth error:', error);
    
    let errorMessage = 'Failed to authenticate with Google.';
    let showLinkOption = false;
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign-in was cancelled. Please try again.';
        break;
        
      case 'auth/popup-blocked':
        errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups for this site.';
        break;
        
      case 'auth/cancelled-popup-request':
        errorMessage = 'Another sign-in request is in progress. Please wait.';
        break;
        
      case 'auth/account-exists-with-different-credential':
        errorMessage = 'An account already exists with this email. Sign in with your password to link Google.';
        showLinkOption = true;
        
        // Store the credential and email for linking
        if (error.customData?.email) {
          setPendingEmail(error.customData.email);
        }
        setPendingCredential(GoogleAuthProvider.credentialFromError(error));
        setShowLinkModal(true);
        break;
        
      case 'auth/credential-already-in-use':
        errorMessage = 'This Google account is already linked to another user.';
        break;
        
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
        
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
        
      case 'auth/operation-not-allowed':
        errorMessage = 'Google sign-in is not enabled. Please contact support.';
        break;
        
      case 'auth/internal-error':
        errorMessage = 'A temporary error occurred. Please try again.';
        break;
        
      case 'auth/unauthorized-domain':
        errorMessage = 'This domain is not authorized for Google sign-in.';
        break;
        
      case 'auth/web-storage-unsupported':
        errorMessage = 'Browser storage is not available. Please enable cookies.';
        break;
        
      default:
        errorMessage = error.message || 'Failed to authenticate with Google.';
    }
    
    if (error.code !== 'auth/popup-closed-by-user' && 
        error.code !== 'auth/cancelled-popup-request') {
      toast.error(errorMessage, {
        id: 'google-auth-error',
        duration: 5000,
      });
    }
    
    onError?.(error);
    
    return { errorMessage, showLinkOption };
  }, [onError]);

  // ── Google Authentication Handler ───────────────────────────────────────

  const handleGoogleAuth = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      
      // Add requested scopes
      scopes.forEach(scope => provider.addScope(scope));
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account',
        // Include login_hint if we have a pending email
        ...(pendingEmail && { login_hint: pendingEmail }),
      });
      
      // FIXED: Use redirect on mobile if specified
      if (redirectOnMobile && isMobile) {
        try {
          await signInWithRedirect(auth, provider);
          // Component will handle result via getRedirectResult effect
          return;
        } catch (redirectError) {
          // If redirect fails, fall back to popup
          console.warn('Redirect failed, falling back to popup:', redirectError);
        }
      }
      
      const result = await signInWithPopup(auth, provider);
      
      if (!mountedRef.current) return;
      
      await handleSuccessfulAuth(result.user);
      
    } catch (error) {
      if (!mountedRef.current) return;
      handleAuthError(error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loading, redirectOnMobile, isMobile, scopes, pendingEmail, handleAuthError]);

  // ── Account Linking Handler ─────────────────────────────────────────────

  const handleLinkAccount = async () => {
    if (!linkEmail || !linkPassword) {
      setLinkError('Please enter your email and password');
      return;
    }

    setLinkLoading(true);
    setLinkError(null);
    
    try {
      // FIXED: First sign in with email/password to get the user
      const emailCredential = EmailAuthProvider.credential(linkEmail, linkPassword);
      const userCredential = await signInWithCredential(auth, emailCredential);
      
      // FIXED: Then link the Google credential to the signed-in user
      if (pendingCredential) {
        await linkWithCredential(userCredential.user, pendingCredential);
        
        await handleSuccessfulAuth(userCredential.user);
        
        setShowLinkModal(false);
        setPendingCredential(null);
        setPendingEmail(null);
        
        toast.success('Google account linked successfully!', {
          id: 'link-success',
        });
      }
    } catch (error) {
      console.error('Link account error:', error);
      
      let errorMessage = 'Failed to link accounts.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/credential-already-in-use':
          errorMessage = 'This Google account is already linked to another account.';
          break;
        default:
          errorMessage = error.message || 'Failed to link accounts.';
      }
      
      setLinkError(errorMessage);
      toast.error(errorMessage, { id: 'link-error' });
    } finally {
      setLinkLoading(false);
    }
  };

  // ── Utility Functions ───────────────────────────────────────────────────

  const getDisplayNameFromEmail = (email) => {
    if (!email) return 'User';
    return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
        disabled={loading || disabled}
        icon={showIcon ? <FcGoogle className="w-5 h-5" /> : null}
        className={`w-full justify-center bg-white hover:bg-gray-50 
          dark:bg-gray-800 dark:hover:bg-gray-700 
          border border-gray-300 dark:border-gray-600
          transition-all duration-200 ${className}`}
        aria-label={buttonLabel}
      >
        {buttonLabel}
      </Button>

      {/* Account Linking Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setPendingCredential(null);
          setPendingEmail(null);
          setLinkEmail('');
          setLinkPassword('');
          setLinkError(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <FcGoogle className="w-5 h-5" />
            <span>Link Google Account</span>
          </div>
        }
        size="sm"
      >
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
            <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                Account Already Exists
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {pendingEmail 
                  ? `An account with ${pendingEmail} already exists. Sign in with your password to link Google.`
                  : 'An account with this email already exists. Sign in with your password to link Google.'}
              </p>
            </div>
          </div>

          {/* Error State */}
          <AnimatePresence>
            {linkError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2"
                role="alert"
              >
                <FiAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{linkError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Input */}
          <Input
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            value={linkEmail}
            onChange={(e) => {
              setLinkEmail(e.target.value);
              setLinkError(null);
            }}
            autoComplete="email"
            disabled={linkLoading}
            aria-label="Email address for account linking"
          />

          {/* Password Input */}
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={linkPassword}
            onChange={(e) => {
              setLinkPassword(e.target.value);
              setLinkError(null);
            }}
            autoComplete="current-password"
            disabled={linkLoading}
            aria-label="Password for account linking"
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowLinkModal(false);
                setPendingCredential(null);
                setPendingEmail(null);
                setLinkError(null);
              }}
              disabled={linkLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkAccount}
              loading={linkLoading}
              disabled={!linkEmail || !linkPassword}
              className="flex-1"
            >
              Link Account
            </Button>
          </div>

          {/* Help Links */}
          <div className="text-center space-y-1">
            <button
              onClick={() => {
                setShowLinkModal(false);
                navigate('/forgot-password', { 
                  state: { email: linkEmail || pendingEmail }
                });
              }}
              className="text-xs text-primary-500 hover:text-primary-600 transition-colors"
              type="button"
            >
              Forgot your password?
            </button>
          </div>
          
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Or{' '}
            <button
              onClick={() => {
                setShowLinkModal(false);
                setPendingCredential(null);
                setPendingEmail(null);
                navigate('/login');
              }}
              className="text-primary-500 hover:text-primary-600 transition-colors"
              type="button"
            >
              sign in another way
            </button>
          </p>
        </div>
      </Modal>

      {/* Trust Indicator - Only show when not loading */}
      {!loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center justify-center gap-2 flex-wrap"
        >
          <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
          <span>Secure Google authentication</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">We never post without permission</span>
        </motion.p>
      )}
    </>
  );
};

// ── Google One Tap Component ────────────────────────────────────────────────

export const GoogleOneTap = ({ onSuccess, onError, context = 'signin' }) => {
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      if (IS_DEVELOPMENT) {
        console.warn('Google One Tap: No client ID provided');
      }
      return;
    }

    const initializeOneTap = () => {
      if (initializedRef.current) return;
      
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (IS_DEVELOPMENT) {
                console.log('One Tap response received');
              }
              onSuccess?.(response);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            context: context,
            ux_mode: 'popup',
            // Don't show One Tap if user already signed in
            itp_support: true,
          });

          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
              const reason = notification.getNotDisplayedReason();
              if (IS_DEVELOPMENT) {
                console.log('One Tap not displayed:', reason);
              }
              onError?.({ reason });
            } else if (notification.isSkippedMoment()) {
              const reason = notification.getSkippedReason();
              if (IS_DEVELOPMENT) {
                console.log('One Tap skipped:', reason);
              }
            }
          });
          
          initializedRef.current = true;
        }
      } catch (error) {
        console.error('One Tap initialization failed:', error);
        onError?.(error);
      }
    };

    // Load Google script if not already loaded
    if (!window.google?.accounts?.id && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeOneTap;
      script.onerror = () => {
        console.error('Failed to load Google Identity Services script');
        onError?.({ reason: 'script_load_failed' });
      };
      
      document.head.appendChild(script);
    } else {
      initializeOneTap();
    }

    return () => {
      initializedRef.current = false;
      
      // Cancel One Tap prompt on unmount
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          // Ignore cancel errors
        }
      }
    };
  }, [onSuccess, onError, context]);

  // One Tap is rendered by Google, no visible elements needed
  return null;
};

export default GoogleAuthButton;
