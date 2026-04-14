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
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  unlink,
  deleteUser,
  getIdToken,
  getIdTokenResult,
  PhoneAuthProvider,
  signInWithPhoneNumber
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { logAnalyticsEvent } from '../services/firebase';
import toast from 'react-hot-toast';

// Create and export the context
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setInitializing(true);
      
      if (firebaseUser) {
        // Set basic user info
        setUser(firebaseUser);
        setIsEmailVerified(firebaseUser.emailVerified);
        
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
              emailVerified: firebaseUser.emailVerified
            });
            
            // Log analytics
            logAnalyticsEvent('login', {
              method: firebaseUser.providerData[0]?.providerId || 'unknown',
              userId: firebaseUser.uid
            });
          } else {
            // Create user document if it doesn't exist
            const newUserData = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              photoURL: firebaseUser.photoURL,
              role: 'user',
              status: 'active',
              emailVerified: firebaseUser.emailVerified,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              authProvider: firebaseUser.providerData[0]?.providerId || 'password'
            };
            
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
            setUserRole('user');
            
            logAnalyticsEvent('sign_up', {
              method: newUserData.authProvider,
              userId: firebaseUser.uid
            });
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
      }
      
      setLoading(false);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // Real-time subscription listener
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

  // Email/Password Sign Up
  const signup = async (email, password, displayName) => {
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Create user document
      const userData = {
        email,
        displayName,
        role: 'user',
        status: 'active',
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        authProvider: 'password'
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      // Log analytics
      logAnalyticsEvent('sign_up', {
        method: 'email',
        userId: userCredential.user.uid
      });
      
      toast.success('Account created successfully! Please verify your email.');
      return userCredential.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Email/Password Login
  const login = async (email, password, rememberMe = true) => {
    try {
      setAuthError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      toast.success('Welcome back!');
      return userCredential.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Social Login
  const loginWithProvider = async (providerName) => {
    try {
      setAuthError(null);
      
      let provider;
      switch (providerName) {
        case 'google':
          provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          break;
        case 'github':
          provider = new GithubAuthProvider();
          provider.addScope('user:email');
          break;
        case 'twitter':
          provider = new TwitterAuthProvider();
          break;
        default:
          throw new Error('Unsupported provider');
      }
      
      const result = await signInWithPopup(auth, provider);
      
      toast.success(`Successfully signed in with ${providerName}!`);
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

  // Phone Authentication
  const loginWithPhone = async (phoneNumber, recaptchaVerifier) => {
    try {
      setAuthError(null);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setAuthError(null);
      
      // Update last logout time
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogout: serverTimestamp()
        });
      }
      
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      setAuthError(error);
      toast.error('Failed to log out');
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Confirm Password Reset
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

  // Update User Profile
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
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', user.uid), {
          ...updates,
          updatedAt: serverTimestamp()
        });
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      setAuthError(error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  // Update Email
  const updateUserEmail = async (newEmail, password) => {
    try {
      setAuthError(null);
      
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, newEmail);
      await sendEmailVerification(user);
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        emailVerified: false,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Email updated! Please verify your new email.');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Update Password
  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      setAuthError(null);
      
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      toast.success('Password updated successfully');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Send Email Verification
  const sendVerificationEmail = async () => {
    try {
      setAuthError(null);
      await sendEmailVerification(user);
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Delete Account
  const deleteAccount = async (password) => {
    try {
      setAuthError(null);
      
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete user's resumes
      const resumesQuery = query(
        collection(db, 'resumes'),
        where('userId', '==', user.uid)
      );
      const resumesSnapshot = await getDocs(resumesQuery);
      const batch = writeBatch(db);
      resumesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      // Delete user account
      await deleteUser(user);
      
      toast.success('Account deleted successfully');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Link Provider
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
        default:
          throw new Error('Unsupported provider');
      }
      
      const result = await linkWithCredential(user, provider);
      toast.success(`${providerName} account linked successfully`);
      return result.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Unlink Provider
  const unlinkProvider = async (providerId) => {
    try {
      setAuthError(null);
      await unlink(user, providerId);
      toast.success('Account unlinked successfully');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  // Get ID Token
  const getToken = async (forceRefresh = false) => {
    try {
      return await getIdToken(user, forceRefresh);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Get Token Result (with claims)
  const getTokenResult = async (forceRefresh = false) => {
    try {
      return await getIdTokenResult(user, forceRefresh);
    } catch (error) {
      console.error('Error getting token result:', error);
      return null;
    }
  };

  // Check if user has required role
  const hasRole = useCallback((requiredRole) => {
    if (!userRole) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    return userRole === requiredRole;
  }, [userRole]);

  // Check if user has premium access
  const isPremium = useMemo(() => {
    return userRole === 'premium' || userRole === 'admin' || 
           (subscription?.status === 'active' && subscription?.plan === 'premium');
  }, [userRole, subscription]);

  // Error message mapping
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
      'auth/quota-exceeded': 'SMS quota exceeded. Try again later'
    };
    
    return messages[code] || 'An unexpected error occurred';
  };

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
    
    // Auth methods
    signup,
    login,
    loginWithProvider,
    loginWithPhone,
    logout,
    resetPassword,
    confirmPasswordReset,
    
    // Profile methods
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    sendVerificationEmail,
    deleteAccount,
    
    // Provider methods
    linkProvider,
    unlinkProvider,
    
    // Token methods
    getToken,
    getTokenResult,
    
    // Utility methods
    hasRole,
    reauthenticate: async (password) => {
      const credential = EmailAuthProvider.credential(user.email, password);
      return reauthenticateWithCredential(user, credential);
    },
    
    // Refresh user data
    refreshUserData: async () => {
      if (!user) return;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setUserRole(userDoc.data().role || 'user');
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for protected actions
export const useRequireAuth = (options = {}) => {
  const { 
    user, 
    loading, 
    isEmailVerified, 
    hasRole, 
    sendVerificationEmail 
  } = useAuth();
  
  const { requireEmailVerified = false, requiredRole = null } = options;
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    isEmailVerified,
    hasRequiredRole: requiredRole ? hasRole(requiredRole) : true,
    canAccess: !!user && 
              (!requireEmailVerified || isEmailVerified) && 
              (!requiredRole || hasRole(requiredRole)),
    sendVerificationEmail
  };
};

export default AuthContext;