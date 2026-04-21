import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  unlink,
  deleteUser,
  getIdToken,
  getIdTokenResult,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  applyActionCode,
  checkActionCode,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  onSnapshot,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, logAnalyticsEvent } from '../services/firebase';
import toast from 'react-hot-toast';

// ============================================
// CONTEXT CREATION
// ============================================

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================
// ERROR MESSAGE MAPPING
// ============================================

const getErrorMessage = (code) => {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/popup-closed-by-user': 'Sign-in popup was closed',
    'auth/popup-blocked': 'Popups are blocked. Please allow popups',
    'auth/account-exists-with-different-credential': 'Account exists with different sign-in method',
    'auth/requires-recent-login': 'Please sign in again to continue',
    'auth/user-disabled': 'This account has been disabled',
    'auth/operation-not-allowed': 'This operation is not allowed',
    'auth/invalid-verification-code': 'Invalid verification code',
    'auth/code-expired': 'Verification code has expired',
    'auth/missing-phone-number': 'Phone number is required',
    'auth/invalid-phone-number': 'Invalid phone number format',
    'auth/quota-exceeded': 'SMS quota exceeded. Try again later',
    'auth/invalid-action-code': 'The verification link is invalid or expired',
    'auth/user-token-expired': 'Your session has expired. Please sign in again',
  };

  return messages[code] || 'An unexpected error occurred';
};

// ============================================
// PROVIDER COMPONENT
// ============================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [linkedProviders, setLinkedProviders] = useState([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // ============================================
  // AUTH STATE LISTENER
  // ============================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setInitializing(true);

      if (firebaseUser) {
        // Set basic user info
        setUser(firebaseUser);
        setIsEmailVerified(firebaseUser.emailVerified);
        setLinkedProviders(firebaseUser.providerData.map((p) => p.providerId));
        setMfaEnabled(firebaseUser.multiFactor?.enrolledFactors?.length > 0);

        // Get user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        try {
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setUserRole(data.role || 'user');

            // Update last login
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp(),
              emailVerified: firebaseUser.emailVerified,
              'metadata.lastSeenAt': serverTimestamp(),
            });

            // Log analytics
            logAnalyticsEvent('user_session_started', {
              userId: firebaseUser.uid,
              method: firebaseUser.providerData[0]?.providerId || 'unknown',
            });
          } else {
            // Create user document if it doesn't exist
            const newUserData = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL,
              role: 'user',
              status: 'active',
              emailVerified: firebaseUser.emailVerified,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              authProvider: firebaseUser.providerData[0]?.providerId || 'password',
              metadata: {
                signUpSource: 'direct',
                signUpDate: new Date().toISOString(),
              },
            };

            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
            setUserRole('user');

            logAnalyticsEvent('sign_up_completed', {
              method: newUserData.authProvider,
              userId: firebaseUser.uid,
            });

            toast.success('Welcome to ResumeAI Pro! 🎉');
          }

          // Get subscription info if exists
          const subscriptionDoc = await getDoc(doc(db, 'subscriptions', firebaseUser.uid));
          if (subscriptionDoc.exists()) {
            setSubscription(subscriptionDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAuthError(error);
        }
      } else {
        setUser(null);
        setUserData(null);
        setUserRole(null);
        setIsEmailVerified(false);
        setSubscription(null);
        setLinkedProviders([]);
        setMfaEnabled(false);
      }

      setLoading(false);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // ============================================
  // REAL-TIME SUBSCRIPTION LISTENER
  // ============================================

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, 'subscriptions', user.uid),
      (doc) => {
        if (doc.exists()) {
          setSubscription(doc.data());
        } else {
          setSubscription(null);
        }
      },
      (error) => {
        console.error('Subscription listener error:', error);
      }
    );

    return unsubscribe;
  }, [user]);

  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  const signup = async (email, password, displayName, options = {}) => {
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, { displayName });

      if (options.sendVerification !== false) {
        await sendEmailVerification(userCredential.user, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        });
      }

      const userData = {
        email,
        displayName,
        role: 'user',
        status: 'active',
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        authProvider: 'password',
        metadata: {
          signUpMethod: 'email',
          referrer: options.referrer || null,
          utmSource: options.utmSource || null,
        },
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      logAnalyticsEvent('sign_up', {
        method: 'email',
        userId: userCredential.user.uid,
      });

      toast.success('Account created successfully! Please verify your email.');
      return userCredential.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const login = async (email, password, rememberMe = true) => {
    try {
      setAuthError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      toast.success(`Welcome back, ${userCredential.user.displayName?.split(' ')[0] || 'User'}!`);
      return userCredential.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const loginWithProvider = async (providerName) => {
    try {
      setAuthError(null);

      let provider;
      switch (providerName) {
        case 'google':
          provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          provider.addScope('profile');
          provider.addScope('email');
          break;
        case 'github':
          provider = new GithubAuthProvider();
          provider.addScope('user:email');
          break;
        case 'facebook':
          provider = new FacebookAuthProvider();
          provider.addScope('email');
          provider.addScope('public_profile');
          break;
        case 'microsoft':
          provider = new OAuthProvider('microsoft.com');
          provider.addScope('user.read');
          provider.addScope('email');
          break;
        case 'twitter':
          provider = new TwitterAuthProvider();
          break;
        case 'apple':
          provider = new OAuthProvider('apple.com');
          provider.addScope('email');
          provider.addScope('name');
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      const result = await signInWithPopup(auth, provider);
      const isNewUser = result._tokenResponse?.isNewUser || false;

      if (isNewUser) {
        toast.success('Account created successfully! Welcome aboard!');
      } else {
        toast.success(`Successfully signed in with ${providerName}!`);
      }

      return result.user;
    } catch (error) {
      setAuthError(error);

      if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with this email using a different sign-in method.');
      } else {
        toast.error(getErrorMessage(error.code));
      }

      throw error;
    }
  };

  const loginWithPhone = async (phoneNumber, recaptchaVerifier) => {
    try {
      setAuthError(null);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      toast.success('Verification code sent!');
      return confirmationResult;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const confirmPhoneSignIn = async (confirmationResult, code) => {
    try {
      const result = await confirmationResult.confirm(code);
      toast.success('Phone verified successfully!');
      return result.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthError(null);

      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogout: serverTimestamp(),
        });

        logAnalyticsEvent('logout', { userId: user.uid });
      }

      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      setAuthError(error);
      toast.error('Failed to log out');
      throw error;
    }
  };

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const confirmPasswordReset = async (oobCode, newPassword) => {
    try {
      setAuthError(null);
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast.success('Password reset successfully! You can now sign in.');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  const sendVerificationEmail = async () => {
    try {
      setAuthError(null);
      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const verifyEmail = async (oobCode) => {
    try {
      await applyActionCode(auth, oobCode);

      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          emailVerified: true,
          updatedAt: serverTimestamp(),
        });
        setIsEmailVerified(true);
      }

      toast.success('Email verified successfully!');
      return true;
    } catch (error) {
      console.error('Verify email error:', error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  const updateUserProfile = async (profileData) => {
    try {
      setAuthError(null);

      const updates = {};

      if (profileData.displayName && profileData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: profileData.displayName });
        updates.displayName = profileData.displayName;
      }

      if (profileData.photoURL && profileData.photoURL !== user.photoURL) {
        await updateProfile(user, { photoURL: profileData.photoURL });
        updates.photoURL = profileData.photoURL;
      }

      if (Object.keys(updates).length > 0 || Object.keys(profileData).length > 0) {
        await updateDoc(doc(db, 'users', user.uid), {
          ...profileData,
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      setAuthError(error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const updateUserEmail = async (newEmail, password) => {
    try {
      setAuthError(null);

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      await updateEmail(user, newEmail);
      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        emailVerified: false,
        updatedAt: serverTimestamp(),
      });

      setIsEmailVerified(false);
      toast.success('Email updated! Please verify your new email.');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      setAuthError(null);

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      toast.success('Password updated successfully');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const reauthenticate = async (password) => {
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================

  const deleteAccount = async (password) => {
    try {
      setAuthError(null);

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete user's resumes
      const resumesQuery = query(collection(db, 'resumes'), where('userId', '==', user.uid));
      const resumesSnapshot = await getDocs(resumesQuery);
      const batch = writeBatch(db);
      resumesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete user's notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      notificationsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete user document
      batch.delete(doc(db, 'users', user.uid));

      await batch.commit();

      // Delete Firebase Auth user
      await deleteUser(user);

      logAnalyticsEvent('account_deleted', { userId: user.uid });
      toast.success('Account deleted successfully');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // ============================================
  // PROVIDER LINKING
  // ============================================

  const linkProvider = async (providerName) => {
    try {
      setAuthError(null);

      let provider;
      switch (providerName) {
        case 'google':
          provider = new GoogleAuthProvider();
          break;
        case 'github':
          provider = new GithubAuthProvider();
          break;
        case 'facebook':
          provider = new FacebookAuthProvider();
          break;
        case 'microsoft':
          provider = new OAuthProvider('microsoft.com');
          break;
        case 'apple':
          provider = new OAuthProvider('apple.com');
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      const result = await linkWithCredential(user, provider);
      setLinkedProviders(result.user.providerData.map((p) => p.providerId));

      toast.success(`${providerName} account linked successfully`);
      return result.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const unlinkProvider = async (providerId) => {
    try {
      setAuthError(null);
      await unlink(user, providerId);
      setLinkedProviders((prev) => prev.filter((id) => id !== providerId));
      toast.success('Account unlinked successfully');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  const getToken = async (forceRefresh = false) => {
    try {
      return await getIdToken(user, forceRefresh);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const getTokenResult = async (forceRefresh = false) => {
    try {
      return await getIdTokenResult(user, forceRefresh);
    } catch (error) {
      console.error('Error getting token result:', error);
      return null;
    }
  };

  // ============================================
  // UTILITY METHODS
  // ============================================

  const hasRole = useCallback(
    (requiredRole) => {
      if (!userRole) return false;
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole);
      }
      return userRole === requiredRole;
    },
    [userRole]
  );

  const isPremium = useMemo(() => {
    return (
      userRole === 'premium' ||
      userRole === 'admin' ||
      (subscription?.status === 'active' && subscription?.plan === 'premium')
    );
  }, [userRole, subscription]);

  const refreshUserData = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
      setUserRole(userDoc.data().role || 'user');
    }
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // State
    user,
    userData,
    userRole,
    loading,
    initializing,
    authError,
    isEmailVerified,
    subscription,
    isPremium,
    linkedProviders,
    mfaEnabled,

    // Auth methods
    signup,
    login,
    loginWithProvider,
    loginWithPhone,
    confirmPhoneSignIn,
    logout,

    // Password management
    resetPassword,
    confirmPasswordReset,

    // Email verification
    sendVerificationEmail,
    verifyEmail,

    // Profile methods
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    reauthenticate,
    deleteAccount,

    // Provider methods
    linkProvider,
    unlinkProvider,

    // Token methods
    getToken,
    getTokenResult,

    // Utility methods
    hasRole,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// CUSTOM HOOKS
// ============================================

export const useRequireAuth = (options = {}) => {
  const { user, loading, isEmailVerified, hasRole, sendVerificationEmail } = useAuth();

  const { requireEmailVerified = false, requiredRole = null, redirectTo = '/login' } = options;

  const isLoading = loading;
  const isAuthenticated = !!user;

  const hasRequiredRole = requiredRole ? hasRole(requiredRole) : true;
  const canAccess = isAuthenticated && (!requireEmailVerified || isEmailVerified) && hasRequiredRole;

  return {
    user,
    isLoading,
    isAuthenticated,
    isEmailVerified,
    hasRequiredRole,
    canAccess,
    sendVerificationEmail,
    redirectTo: !canAccess ? redirectTo : null,
  };
};

export default AuthContext;