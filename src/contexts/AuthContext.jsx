import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  FacebookAuthProvider,
  getAdditionalUserInfo,
  getIdToken,
  getIdTokenResult,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  OAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  TwitterAuthProvider,
  unlink,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth, db, logAnalyticsEvent } from '../services/firebase';

export const AuthContext = createContext(null);

const COLLECTIONS = {
  users: 'users',
  resumes: 'resumes',
  notifications: 'notifications',
  subscriptions: 'subscriptions',
  settings: 'settings',
};

const RESTRICTED_PROFILE_FIELDS = new Set([
  'role',
  'status',
  'emailVerified',
  'authProvider',
  'createdAt',
  'updatedAt',
  'lastLogin',
  'lastLogout',
  'metadata',
  'subscription',
  'uid',
  'userId',
]);

const getErrorMessage = (code) => {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid credentials. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
    'auth/popup-blocked': 'Popups are blocked. Please allow popups and try again.',
    'auth/account-exists-with-different-credential':
      'An account already exists with a different sign-in method.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'This operation is not allowed.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/code-expired': 'Verification code has expired.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/invalid-phone-number': 'Invalid phone number format.',
    'auth/quota-exceeded': 'SMS quota exceeded. Try again later.',
    'auth/invalid-action-code': 'The verification link is invalid or has expired.',
    'auth/user-token-expired': 'Your session has expired. Please sign in again.',
    'auth/no-current-user': 'Please sign in to continue.',
    'auth/no-password-provider': 'This account does not support password-based reauthentication.',
    'auth/missing-password': 'Please enter your password to continue.',
    'auth/missing-recaptcha': 'Phone verification is not ready yet. Please refresh and try again.',
    'auth/provider-not-linked': 'This sign-in method is not linked to your account.',
    'auth/cannot-unlink-last-provider': 'You must keep at least one sign-in method linked.',
    'auth/unsupported-provider': 'This sign-in provider is not supported.',
  };

  return messages[code] || 'An unexpected error occurred. Please try again.';
};

const safeTrackEvent = (eventName, payload = {}) => {
  try {
    logAnalyticsEvent(eventName, payload);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Analytics event "${eventName}" failed`, error);
    }
  }
};

const filterUndefined = (object = {}) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

const sanitizeProfileUpdates = (profileData = {}) =>
  Object.fromEntries(
    Object.entries(filterUndefined(profileData)).filter(
      ([key]) => !RESTRICTED_PROFILE_FIELDS.has(key)
    )
  );

const getPrimaryProviderId = (firebaseUser) =>
  firebaseUser?.providerData?.[0]?.providerId || 'password';

const getLinkedProviderIds = (firebaseUser) =>
  firebaseUser?.providerData?.map((provider) => provider.providerId).filter(Boolean) || [];

const hasPasswordProvider = (firebaseUser) => getLinkedProviderIds(firebaseUser).includes('password');

const getDisplayName = (firebaseUser) =>
  firebaseUser?.displayName?.trim() || firebaseUser?.email?.split('@')[0] || 'User';

const createProvider = (providerName) => {
  switch (providerName) {
    case 'google': {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope('profile');
      provider.addScope('email');
      return provider;
    }
    case 'github': {
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');
      return provider;
    }
    case 'facebook': {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      return provider;
    }
    case 'microsoft': {
      const provider = new OAuthProvider('microsoft.com');
      provider.addScope('User.Read');
      provider.addScope('email');
      return provider;
    }
    case 'twitter':
      return new TwitterAuthProvider();
    case 'apple': {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      return provider;
    }
    default: {
      const error = new Error(`Unsupported provider: ${providerName}`);
      error.code = 'auth/unsupported-provider';
      throw error;
    }
  }
};

const deleteDocumentRefsInBatches = async (refs) => {
  const uniqueRefs = Array.from(
    new Map(refs.filter(Boolean).map((ref) => [ref.path, ref])).values()
  );

  const chunkSize = 400;

  for (let index = 0; index < uniqueRefs.length; index += chunkSize) {
    const batch = writeBatch(db);
    uniqueRefs.slice(index, index + chunkSize).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
};

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
  const [linkedProviders, setLinkedProviders] = useState([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setUserData(null);
    setUserRole(null);
    setIsEmailVerified(false);
    setSubscription(null);
    setLinkedProviders([]);
    setMfaEnabled(false);
    setAuthError(null);
  }, []);

  const syncFirebaseUserState = useCallback((firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setIsEmailVerified(false);
      setLinkedProviders([]);
      setMfaEnabled(false);
      return;
    }

    setUser(firebaseUser);
    setIsEmailVerified(Boolean(firebaseUser.emailVerified));
    setLinkedProviders(getLinkedProviderIds(firebaseUser));
    setMfaEnabled((firebaseUser.multiFactor?.enrolledFactors?.length || 0) > 0);
  }, []);

  const requireAuthenticatedUser = useCallback(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      const error = new Error('No authenticated user.');
      error.code = 'auth/no-current-user';
      throw error;
    }

    return currentUser;
  }, []);

  const reauthenticateWithPassword = useCallback(
    async (password) => {
      const currentUser = requireAuthenticatedUser();

      if (!currentUser.email || !hasPasswordProvider(currentUser)) {
        const error = new Error('Password reauthentication is not available for this account.');
        error.code = 'auth/no-password-provider';
        throw error;
      }

      if (!password) {
        const error = new Error('Password is required.');
        error.code = 'auth/missing-password';
        throw error;
      }

      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      return currentUser;
    },
    [requireAuthenticatedUser]
  );

  const refreshUserData = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      clearAuthState();
      return null;
    }

    try {
      await reload(currentUser);
      syncFirebaseUserState(auth.currentUser || currentUser);

      const [userSnapshot, subscriptionSnapshot] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.users, currentUser.uid)),
        getDoc(doc(db, COLLECTIONS.subscriptions, currentUser.uid)),
      ]);

      if (userSnapshot.exists()) {
        const nextUserData = userSnapshot.data();
        setUserData(nextUserData);
        setUserRole(nextUserData.role || 'user');
      } else {
        setUserData(null);
        setUserRole(null);
      }

      setSubscription(subscriptionSnapshot.exists() ? subscriptionSnapshot.data() : null);

      return userSnapshot.exists() ? userSnapshot.data() : null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setAuthError(error);
      throw error;
    }
  }, [clearAuthState, syncFirebaseUserState]);

  const hydrateUserDocument = useCallback(async (firebaseUser) => {
    const userDocRef = doc(db, COLLECTIONS.users, firebaseUser.uid);
    const existingUserSnapshot = await getDoc(userDocRef);

    if (existingUserSnapshot.exists()) {
      const existingData = existingUserSnapshot.data();
      const mergedData = {
        ...existingData,
        email: firebaseUser.email ?? existingData.email ?? null,
        displayName: existingData.displayName || getDisplayName(firebaseUser),
        photoURL: existingData.photoURL ?? firebaseUser.photoURL ?? null,
        emailVerified: firebaseUser.emailVerified,
      };

      try {
        await updateDoc(userDocRef, {
          email: mergedData.email,
          displayName: mergedData.displayName,
          photoURL: mergedData.photoURL,
          emailVerified: firebaseUser.emailVerified,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          'metadata.lastSeenAt': serverTimestamp(),
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Unable to update user session metadata', error);
        }
      }

      return {
        created: false,
        data: mergedData,
      };
    }

    const newUserData = {
      email: firebaseUser.email ?? null,
      displayName: getDisplayName(firebaseUser),
      photoURL: firebaseUser.photoURL ?? null,
      role: 'user',
      status: 'active',
      emailVerified: firebaseUser.emailVerified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      authProvider: getPrimaryProviderId(firebaseUser),
      metadata: {
        signUpSource: getPrimaryProviderId(firebaseUser),
        signUpDate: new Date().toISOString(),
      },
    };

    await setDoc(userDocRef, newUserData, { merge: true });

    const createdSnapshot = await getDoc(userDocRef);

    return {
      created: true,
      data: createdSnapshot.exists()
        ? createdSnapshot.data()
        : {
            ...newUserData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          },
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isActive) {
        return;
      }

      setInitializing(true);

      try {
        if (!firebaseUser) {
          clearAuthState();
          return;
        }

        syncFirebaseUserState(firebaseUser);

        const { created, data } = await hydrateUserDocument(firebaseUser);

        if (!isActive) {
          return;
        }

        setUserData(data);
        setUserRole(data?.role || 'user');

        const subscriptionSnapshot = await getDoc(
          doc(db, COLLECTIONS.subscriptions, firebaseUser.uid)
        );

        if (!isActive) {
          return;
        }

        setSubscription(subscriptionSnapshot.exists() ? subscriptionSnapshot.data() : null);

        safeTrackEvent('user_session_started', {
          userId: firebaseUser.uid,
          method: getPrimaryProviderId(firebaseUser),
        });

        if (created && getPrimaryProviderId(firebaseUser) !== 'password') {
          safeTrackEvent('sign_up_completed', {
            userId: firebaseUser.uid,
            method: getPrimaryProviderId(firebaseUser),
          });

          toast.success('Welcome to ResumeAI Pro!');
        }
      } catch (error) {
        console.error('Error syncing auth state:', error);

        if (isActive) {
          setAuthError(error);
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setInitializing(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [clearAuthState, hydrateUserDocument, syncFirebaseUserState]);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      doc(db, COLLECTIONS.subscriptions, user.uid),
      (snapshot) => {
        setSubscription(snapshot.exists() ? snapshot.data() : null);
      },
      (error) => {
        console.error('Subscription listener error:', error);
      }
    );

    return unsubscribe;
  }, [user]);

  const signup = useCallback(async (email, password, displayName, options = {}) => {
    try {
      setAuthError(null);

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedDisplayName = displayName?.trim() || normalizedEmail.split('@')[0];
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      await updateProfile(userCredential.user, { displayName: normalizedDisplayName });

      if (options.sendVerification !== false) {
        await sendEmailVerification(userCredential.user, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        });
      }

      await setDoc(
        doc(db, COLLECTIONS.users, userCredential.user.uid),
        {
          email: normalizedEmail,
          displayName: normalizedDisplayName,
          photoURL: userCredential.user.photoURL ?? null,
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
            signUpDate: new Date().toISOString(),
          },
        },
        { merge: true }
      );

      safeTrackEvent('sign_up', {
        method: 'email',
        userId: userCredential.user.uid,
      });

      toast.success('Account created successfully. Please verify your email.');
      return userCredential.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  }, []);

  const login = useCallback(async (email, password, rememberMe = true) => {
    try {
      void rememberMe;
      setAuthError(null);

      const normalizedEmail = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);

      toast.success(
        `Welcome back, ${userCredential.user.displayName?.split(' ')[0] || 'User'}!`
      );

      return userCredential.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  }, []);

  const loginWithProvider = useCallback(async (providerName) => {
    try {
      setAuthError(null);

      const provider = createProvider(providerName);
      const result = await signInWithPopup(auth, provider);
      const additionalUserInfo = getAdditionalUserInfo(result);

      toast.success(
        additionalUserInfo?.isNewUser
          ? 'Account created successfully. Welcome aboard.'
          : `Signed in with ${providerName}.`
      );

      return result.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  }, []);

  const loginWithPhone = useCallback(async (phoneNumber, recaptchaVerifier) => {
    try {
      setAuthError(null);

      if (!recaptchaVerifier) {
        const error = new Error('Recaptcha verifier is required.');
        error.code = 'auth/missing-recaptcha';
        throw error;
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber.trim(),
        recaptchaVerifier
      );

      toast.success('Verification code sent.');
      return confirmationResult;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  }, []);

  const confirmPhoneSignIn = useCallback(async (confirmationResult, code) => {
    try {
      setAuthError(null);

      const result = await confirmationResult.confirm(code);
      toast.success('Phone verified successfully.');
      return result.user;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setAuthError(null);

      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          await updateDoc(doc(db, COLLECTIONS.users, currentUser.uid), {
            lastLogout: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to update logout timestamp', error);
          }
        }

        safeTrackEvent('logout', { userId: currentUser.uid });
      }

      await signOut(auth);
      toast.success('Logged out successfully.');
    } catch (error) {
      setAuthError(error);
      toast.error('Failed to log out.');
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      setAuthError(null);

      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      toast.success('Password reset email sent. Check your inbox.');
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  }, []);

  const confirmPasswordResetAction = useCallback(async (oobCode, newPassword) => {
    try {
      setAuthError(null);

      await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
      toast.success('Password reset successfully. You can now sign in.');
      return true;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    try {
      setAuthError(null);

      const currentUser = requireAuthenticatedUser();

      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      toast.success('Verification email sent. Check your inbox.');
      return true;
    } catch (error) {
      setAuthError(error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  }, [requireAuthenticatedUser]);

  const verifyEmail = useCallback(
    async (oobCode) => {
      try {
        setAuthError(null);

        const actionInfo = await checkActionCode(auth, oobCode);
        await applyActionCode(auth, oobCode);

        const verifiedEmail = actionInfo?.data?.email || actionInfo?.data?.previousEmail || null;
        const currentUser = auth.currentUser;

        if (currentUser) {
          await reload(currentUser);
          syncFirebaseUserState(auth.currentUser || currentUser);
        }

        if (verifiedEmail) {
          const userQuery = query(
            collection(db, COLLECTIONS.users),
            where('email', '==', verifiedEmail)
          );
          const matchingUsers = await getDocs(userQuery);

          if (!matchingUsers.empty) {
            const batch = writeBatch(db);
            matchingUsers.docs.forEach((userDoc) => {
              batch.update(userDoc.ref, {
                emailVerified: true,
                updatedAt: serverTimestamp(),
              });
            });
            await batch.commit();
          }
        } else if (currentUser) {
          await updateDoc(doc(db, COLLECTIONS.users, currentUser.uid), {
            emailVerified: true,
            updatedAt: serverTimestamp(),
          });
        }

        setIsEmailVerified(true);
        await refreshUserData();

        toast.success('Email verified successfully.');
        return true;
      } catch (error) {
        console.error('Verify email error:', error);
        setAuthError(error);
        toast.error(getErrorMessage(error.code));
        throw error;
      }
    },
    [refreshUserData, syncFirebaseUserState]
  );

  const updateUserProfile = useCallback(
    async (profileData = {}) => {
      try {
        setAuthError(null);

        const currentUser = requireAuthenticatedUser();
        const sanitizedUpdates = sanitizeProfileUpdates(profileData);
        const authProfileUpdates = {};

        if (
          Object.prototype.hasOwnProperty.call(sanitizedUpdates, 'displayName') &&
          sanitizedUpdates.displayName !== currentUser.displayName
        ) {
          authProfileUpdates.displayName = sanitizedUpdates.displayName;
        }

        if (
          Object.prototype.hasOwnProperty.call(sanitizedUpdates, 'photoURL') &&
          sanitizedUpdates.photoURL !== currentUser.photoURL
        ) {
          authProfileUpdates.photoURL = sanitizedUpdates.photoURL;
        }

        const firestoreUpdates = filterUndefined({
          ...sanitizedUpdates,
          ...authProfileUpdates,
        });

        if (Object.keys(authProfileUpdates).length > 0) {
          await updateProfile(currentUser, authProfileUpdates);
        }

        if (Object.keys(firestoreUpdates).length === 0) {
          return false;
        }

        await updateDoc(doc(db, COLLECTIONS.users, currentUser.uid), {
          ...firestoreUpdates,
          updatedAt: serverTimestamp(),
        });

        setUserData((prev) => (prev ? { ...prev, ...firestoreUpdates } : prev));
        syncFirebaseUserState(auth.currentUser || currentUser);

        toast.success('Profile updated successfully.');
        return true;
      } catch (error) {
        setAuthError(error);
        toast.error('Failed to update profile.');
        throw error;
      }
    },
    [requireAuthenticatedUser, syncFirebaseUserState]
  );

  const updateUserEmail = useCallback(
    async (newEmail, password) => {
      try {
        setAuthError(null);

        const currentUser = await reauthenticateWithPassword(password);
        const normalizedEmail = newEmail.trim().toLowerCase();

        await updateEmail(currentUser, normalizedEmail);
        await sendEmailVerification(currentUser, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        });

        await updateDoc(doc(db, COLLECTIONS.users, currentUser.uid), {
          email: normalizedEmail,
          emailVerified: false,
          updatedAt: serverTimestamp(),
        });

        setIsEmailVerified(false);
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                email: normalizedEmail,
                emailVerified: false,
              }
            : prev
        );

        toast.success('Email updated. Please verify your new email.');
        return true;
      } catch (error) {
        setAuthError(error);
        toast.error(getErrorMessage(error.code));
        throw error;
      }
    },
    [reauthenticateWithPassword]
  );

  const updateUserPassword = useCallback(
    async (currentPassword, newPassword) => {
      try {
        setAuthError(null);

        const currentUser = await reauthenticateWithPassword(currentPassword);
        await updatePassword(currentUser, newPassword);

        toast.success('Password updated successfully.');
        return true;
      } catch (error) {
        setAuthError(error);
        toast.error(getErrorMessage(error.code));
        throw error;
      }
    },
    [reauthenticateWithPassword]
  );

  const reauthenticate = useCallback(
    async (password) => {
      try {
        setAuthError(null);
        await reauthenticateWithPassword(password);
        return true;
      } catch (error) {
        setAuthError(error);
        toast.error(getErrorMessage(error.code));
        throw error;
      }
    },
    [reauthenticateWithPassword]
  );

  const deleteAccount = useCallback(
    async (password) => {
      try {
        setAuthError(null);

        const currentUser = requireAuthenticatedUser();

        if (hasPasswordProvider(currentUser) && password) {
          await reauthenticateWithPassword(password);
        }

        const [resumesSnapshot, notificationsSnapshot] = await Promise.all([
          getDocs(query(collection(db, COLLECTIONS.resumes), where('userId', '==', currentUser.uid))),
          getDocs(
            query(collection(db, COLLECTIONS.notifications), where('userId', '==', currentUser.uid))
          ),
        ]);

        const refsToDelete = [
          ...resumesSnapshot.docs.map((snapshot) => snapshot.ref),
          ...notificationsSnapshot.docs.map((snapshot) => snapshot.ref),
          doc(db, COLLECTIONS.users, currentUser.uid),
          doc(db, COLLECTIONS.settings, currentUser.uid),
          doc(db, COLLECTIONS.subscriptions, currentUser.uid),
        ];

        await deleteDocumentRefsInBatches(refsToDelete);
        safeTrackEvent('account_deleted', { userId: currentUser.uid });

        await deleteUser(currentUser);
        toast.success('Account deleted successfully.');
        return true;
      } catch (error) {
        setAuthError(error);
        toast.error(getErrorMessage(error.code));
        throw error;
      }
    },
    [reauthenticateWithPassword, requireAuthenticatedUser]
  );

  const linkProvider = useCallback(
    async (providerName) => {
      try {
        setAuthError(null);

        const currentUser = requireAuthenticatedUser();
        const provider = createProvider(providerName);
        const result = await linkWithPopup(currentUser, provider);
        const nextLinkedProviders = getLinkedProviderIds(result.user);

        setLinkedProviders(nextLinkedProviders);

        try {
          await updateDoc(doc(db, COLLECTIONS.users, result.user.uid), {
            authProvider: getPrimaryProviderId(result.user),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to sync linked provider metadata', error);
          }
        }

        toast.success(`${providerName} account linked successfully.`);
        return result.user;
      } catch (error) {
        setAuthError(error);
        toast.error(getErrorMessage(error.code));
        throw error;
      }
    },
    [requireAuthenticatedUser]
  );

  const unlinkProvider = useCallback(
    async (providerId) => {
      try {
        setAuthError(null);

        const currentUser = requireAuthenticatedUser();
        const currentProviderIds = getLinkedProviderIds(currentUser);

        if (!currentProviderIds.includes(providerId)) {
          const error = new Error('Provider is not linked.');
          error.code = 'auth/provider-not-linked';
          throw error;
        }

        if (currentProviderIds.length <= 1) {
          const error = new Error('Cannot unlink the last remaining provider.');
          error.code = 'auth/cannot-unlink-last-provider';
          throw error;
        }

        const updatedUser = await unlink(currentUser, providerId);
        setLinkedProviders(getLinkedProviderIds(updatedUser));

        toast.success('Account unlinked successfully.');
        return updatedUser;
      } catch (error) {
        setAuthError(error);
        toast.error(getErrorMessage(error.code));
        throw error;
      }
    },
    [requireAuthenticatedUser]
  );

  const getToken = useCallback(async (forceRefresh = false) => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return null;
      }

      return await getIdToken(currentUser, forceRefresh);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }, []);

  const getTokenResult = useCallback(async (forceRefresh = false) => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return null;
      }

      return await getIdTokenResult(currentUser, forceRefresh);
    } catch (error) {
      console.error('Error getting token result:', error);
      return null;
    }
  }, []);

  const hasRole = useCallback(
    (requiredRole) => {
      if (!userRole) {
        return false;
      }

      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole);
      }

      return userRole === requiredRole;
    },
    [userRole]
  );

  const isPremium = useMemo(
    () =>
      userRole === 'premium' ||
      userRole === 'admin' ||
      (subscription?.status === 'active' && subscription?.plan === 'premium'),
    [subscription, userRole]
  );

  const value = useMemo(
    () => ({
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
      signup,
      login,
      loginWithProvider,
      loginWithPhone,
      confirmPhoneSignIn,
      logout,
      resetPassword,
      confirmPasswordReset: confirmPasswordResetAction,
      sendVerificationEmail,
      verifyEmail,
      updateUserProfile,
      updateUserEmail,
      updateUserPassword,
      reauthenticate,
      deleteAccount,
      linkProvider,
      unlinkProvider,
      getToken,
      getTokenResult,
      hasRole,
      refreshUserData,
    }),
    [
      authError,
      confirmPasswordResetAction,
      confirmPhoneSignIn,
      deleteAccount,
      getToken,
      getTokenResult,
      hasRole,
      initializing,
      isEmailVerified,
      isPremium,
      linkedProviders,
      linkProvider,
      loading,
      login,
      loginWithPhone,
      loginWithProvider,
      logout,
      mfaEnabled,
      reauthenticate,
      refreshUserData,
      resetPassword,
      sendVerificationEmail,
      signup,
      subscription,
      unlinkProvider,
      updateUserEmail,
      updateUserPassword,
      updateUserProfile,
      user,
      userData,
      userRole,
      verifyEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useRequireAuth = (options = {}) => {
  const { user, loading, initializing, isEmailVerified, hasRole, sendVerificationEmail } =
    useAuth();

  const {
    requireEmailVerified = false,
    requiredRole = null,
    redirectTo = '/login',
  } = options;

  const isLoading = loading || initializing;
  const isAuthenticated = Boolean(user);
  const hasRequiredRole = requiredRole ? hasRole(requiredRole) : true;
  const canAccess =
    isAuthenticated && (!requireEmailVerified || isEmailVerified) && hasRequiredRole;

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
