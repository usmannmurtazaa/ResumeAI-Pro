import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  getIdTokenResult,
  onAuthStateChanged,
  onIdTokenChanged,
  reload,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth, db, logAnalyticsEvent } from '../services/firebase';
import { authService } from '../services/authService';
import { SESSION_TIMEOUT_MS, SESSION_WARNING_MS, SESSION_ACTIVITY_EVENTS } from '../data/constants';

// ── Constants ─────────────────────────────────────────────────────────────

const COLLECTIONS = Object.freeze({
  users: 'users',
  resumes: 'resumes',
  notifications: 'notifications',
  subscriptions: 'subscriptions',
  settings: 'settings',
});

const ERROR_MESSAGES = {
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

// ── Utility Functions ─────────────────────────────────────────────────────

const getErrorMessage = (code) =>
  ERROR_MESSAGES[code] || 'An unexpected error occurred. Please try again.';

const safeTrackEvent = (eventName, payload = {}) => {
  try {
    logAnalyticsEvent(eventName, payload);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Analytics event "${eventName}" failed`, error);
    }
  }
};

const getPrimaryProviderId = (firebaseUser) =>
  firebaseUser?.providerData?.[0]?.providerId || 'password';

const getLinkedProviderIds = (firebaseUser) =>
  firebaseUser?.providerData?.map((provider) => provider.providerId).filter(Boolean) || [];

const getDisplayName = (firebaseUser) =>
  firebaseUser?.displayName?.trim() || firebaseUser?.email?.split('@')[0] || 'User';

// ── Context ───────────────────────────────────────────────────────────────

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ── Provider Component ────────────────────────────────────────────────────

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

  // ── Session Timeout State ──────────────────────────────────────────────

  const [sessionTimeout, setSessionTimeout] = useState({
    remaining: SESSION_TIMEOUT_MS,
    isExpired: false,
    showWarning: false,
  });

  const sessionTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  // Tracks the UID that most recently went through `hydrateUserDocument`.
  // Used to distinguish a real sign-in (null → uid, or uid1 → uid2) from a
  // token-refresh event on the same session (uid → uid). Only real sign-ins
  // should write the `lastLogin` audit fields. See `hydrateUserDocument`.
  const lastHydratedUidRef = useRef(null);

  // ── State Helpers ─────────────────────────────────────────────────────

  const clearAuthState = useCallback(() => {
    setUser(null);
    setUserData(null);
    setUserRole(null);
    setIsEmailVerified(false);
    setSubscription(null);
    setLinkedProviders([]);
    setMfaEnabled(false);
    setAuthError(null);
    setSessionTimeout({
      remaining: SESSION_TIMEOUT_MS,
      isExpired: false,
      showWarning: false,
    });
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

  // ── Hydrate User Document ────────────────────────────────────────────
  // Reads the user doc on every auth event (so role / status / subscription
  // stay fresh), but only writes the `lastLogin` audit fields on an actual
  // sign-in. `onAuthStateChanged` fires on token refresh (≈ hourly) as well
  // as on sign-in; without this gate the audit write would run once per
  // hour for every idle signed-in user, consuming the Spark-plan write
  // quota for no benefit.
  //
  // Fields that DO change across a session (displayName, photoURL,
  // emailVerified, email) are written by their own dedicated service
  // methods (`updateUserProfile`, `verifyEmail`, `updateUserEmail`,
  // `sendVerificationEmail`), which target Firestore explicitly - so
  // skipping the write here does not leave them stale.
  const hydrateUserDocument = useCallback(async (firebaseUser) => {
    const isNewSignIn = lastHydratedUidRef.current !== firebaseUser.uid;
    lastHydratedUidRef.current = firebaseUser.uid;

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

      if (isNewSignIn) {
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
      }

      return { created: false, data: mergedData };
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

  // ── Session Timeout Logic ──────────────────────────────────────────────

  const resetSessionTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (!auth.currentUser) {
      setSessionTimeout({
        remaining: SESSION_TIMEOUT_MS,
        isExpired: false,
        showWarning: false,
      });
      return;
    }
    setSessionTimeout({
      remaining: SESSION_TIMEOUT_MS,
      isExpired: false,
      showWarning: false,
    });
    warningTimerRef.current = setTimeout(() => {
      setSessionTimeout((prev) => ({
        ...prev,
        showWarning: true,
        remaining: SESSION_WARNING_MS,
      }));
      sessionTimerRef.current = setTimeout(() => {
        setSessionTimeout((prev) => ({
          ...prev,
          isExpired: true,
          showWarning: false,
          remaining: 0,
        }));
        signOut(auth)
          .then(() => {
            clearAuthState();
            toast.error('Your session has expired due to inactivity. Please sign in again.');
            safeTrackEvent('session_timeout', { userId: auth.currentUser?.uid });
          })
          .catch(() => {});
      }, SESSION_WARNING_MS);
    }, SESSION_TIMEOUT_MS - SESSION_WARNING_MS);
  }, [clearAuthState]);

  const extendSession = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    setSessionTimeout({
      remaining: SESSION_TIMEOUT_MS,
      isExpired: false,
      showWarning: false,
    });
    resetSessionTimer();
    toast.success('Session extended.');
    safeTrackEvent('session_extended', { userId: auth.currentUser?.uid });
  }, [resetSessionTimer]);

  const handleUserActivity = useCallback(() => {
    if (!auth.currentUser) return;
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    activityTimeoutRef.current = setTimeout(() => {
      resetSessionTimer();
    }, 1000);
  }, [resetSessionTimer]);

  // ── Auth State Listener ──────────────────────────────────────────────

  useEffect(() => {
    let isActive = true;
    let hydrationGeneration = 0;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isActive) return;
      const generation = ++hydrationGeneration;
      setInitializing(true);
      setLoading(true);
      try {
        if (!firebaseUser) {
          // Reset the "last hydrated UID" so that a subsequent sign-in for
          // any user is treated as a fresh sign-in by `hydrateUserDocument`.
          lastHydratedUidRef.current = null;
          clearAuthState();
          return;
        }
        syncFirebaseUserState(firebaseUser);
        const { created, data } = await hydrateUserDocument(firebaseUser);
        if (!isActive || generation !== hydrationGeneration) return;
        setUserData(data);
        setUserRole(data?.role || 'user');
        safeTrackEvent('user_session_started', {
          userId: firebaseUser.uid,
          method: getPrimaryProviderId(firebaseUser),
        });
        if (created && getPrimaryProviderId(firebaseUser) !== 'password') {
          safeTrackEvent('sign_up_completed', {
            userId: firebaseUser.uid,
            method: getPrimaryProviderId(firebaseUser),
          });
          // No toast here - provider-layer success feedback is delegated to
          // the caller. The `toast.success('Welcome to Resume Ai Pro!')`
          // that used to live here fired on top of the caller's own welcome
          // toast.
        }
        resetSessionTimer();
      } catch (error) {
        console.error('Error syncing auth state:', error);
        if (isActive && generation === hydrationGeneration) {
          setAuthError(error);
        }
      } finally {
        if (isActive && generation === hydrationGeneration) {
          setLoading(false);
          setInitializing(false);
        }
      }
    });
    return () => {
      isActive = false;
      unsubscribe();
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    };
  }, [clearAuthState, hydrateUserDocument, syncFirebaseUserState, resetSessionTimer]);

  // ── Session Activity Listeners ──────────────────────────────────────
  // Attached exactly once per signed-in session and removed on sign-out
  // or unmount. Previously these were attached inside the onAuthStateChanged
  // callback, which caused the same handlers to be re-registered on every
  // auth event and accumulate duplicate document listeners over time.

  useEffect(() => {
    if (!user) return undefined;

    SESSION_ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      SESSION_ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user, handleUserActivity]);

  // ── Token Refresh Listener ──────────────────────────────────────────

  useEffect(() => {
    let isActive = true;
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!isActive || !firebaseUser) return;
      try {
        await getIdTokenResult(firebaseUser, false);
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    });
    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  // ── Subscription Real-time Listener ─────────────────────────────────

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

  // ── Auth Methods (Delegated to authService) ─────────────────────────
  //
  // Toast contract (see audit N3-19):
  //   The provider layer updates state and propagates errors by throwing.
  //   It does NOT emit `toast.*` for operations whose callers already
  //   provide their own toasts. Exceptions:
  //     • `logout` - the context is the single feedback surface; callers
  //       (Navbar, Settings, SessionTimeout) do not toast on success.
  //     • `deleteAccount` - the modal closes on success, so the context
  //       is the single feedback surface; the error toast is already
  //       suppressed on partial failures.
  //   Any future method added here should follow the same rule: toast
  //   only when the provider is the sole feedback surface.

  const signup = useCallback(async (email, password, displayName, options = {}) => {
    try {
      setAuthError(null);
      const result = await authService.signUp(email, password, displayName, options);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      return result.user;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const login = useCallback(
    async (email, password, rememberMe = true) => {
      try {
        setAuthError(null);
        const result = await authService.signIn(email, password, rememberMe);
        if (!result.success) {
          const error = new Error(result.error);
          error.code = result.code || 'auth/unknown';
          throw error;
        }
        resetSessionTimer();
        return result.user;
      } catch (error) {
        setAuthError(error);
        throw error;
      }
    },
    [resetSessionTimer]
  );

  const loginWithProvider = useCallback(
    async (providerName) => {
      try {
        setAuthError(null);
        const result = await authService.signInWithProvider(providerName);
        if (!result.success) {
          const error = new Error(result.error);
          error.code = result.code || 'auth/unknown';
          throw error;
        }
        resetSessionTimer();
        return result.user;
      } catch (error) {
        setAuthError(error);
        throw error;
      }
    },
    [resetSessionTimer]
  );

  const loginWithPhone = useCallback(async (phoneNumber, recaptchaVerifier) => {
    try {
      setAuthError(null);
      const result = await authService.signInWithPhone(phoneNumber, recaptchaVerifier);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      return result.confirmationResult;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const confirmPhoneSignIn = useCallback(
    async (confirmationResult, code) => {
      try {
        setAuthError(null);
        const result = await authService.confirmPhoneSignIn(confirmationResult, code);
        if (!result.success) {
          const error = new Error(result.error);
          error.code = result.code || 'auth/unknown';
          throw error;
        }
        resetSessionTimer();
        return result.user;
      } catch (error) {
        setAuthError(error);
        throw error;
      }
    },
    [resetSessionTimer]
  );

  const logout = useCallback(async () => {
    try {
      setAuthError(null);
      const result = await authService.signOut();
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      clearAuthState();
      // Provider-layer toast - see the toast contract above. Callers do not
      // consistently toast on logout success, so the provider is the single
      // feedback surface for this action.
      toast.success('Logged out successfully.');
    } catch (error) {
      setAuthError(error);
      toast.error('Failed to log out.');
      throw error;
    }
  }, [clearAuthState]);

  const resetPassword = useCallback(async (email) => {
    try {
      setAuthError(null);
      const result = await authService.resetPassword(email);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const confirmPasswordResetAction = useCallback(async (oobCode, newPassword) => {
    try {
      setAuthError(null);
      const result = await authService.confirmPasswordReset(oobCode, newPassword);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      return true;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    try {
      setAuthError(null);
      const result = await authService.sendVerificationEmail();
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      return true;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const verifyEmail = useCallback(
    async (oobCode) => {
      try {
        setAuthError(null);
        const result = await authService.verifyEmail(oobCode);
        if (!result.success) {
          const error = new Error(result.error);
          error.code = result.code || 'auth/unknown';
          throw error;
        }
        setIsEmailVerified(true);
        await refreshUserData();
        return true;
      } catch (error) {
        console.error('Verify email error:', error);
        setAuthError(error);
        throw error;
      }
    },
    [refreshUserData]
  );

  const updateUserProfile = useCallback(
    async (profileData = {}) => {
      try {
        setAuthError(null);
        const currentUser = requireAuthenticatedUser();
        const result = await authService.updateUserProfile(currentUser.uid, profileData);
        if (!result.success) {
          const error = new Error(result.error);
          error.code = result.code || 'auth/unknown';
          throw error;
        }
        setUserData((prev) => (prev ? { ...prev, ...profileData } : prev));
        syncFirebaseUserState(auth.currentUser || currentUser);
        return true;
      } catch (error) {
        setAuthError(error);
        throw error;
      }
    },
    [requireAuthenticatedUser, syncFirebaseUserState]
  );

  const updateUserEmail = useCallback(async (newEmail, password) => {
    try {
      setAuthError(null);
      const result = await authService.updateUserEmail(newEmail, password);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      setIsEmailVerified(false);
      setUserData((prev) => (prev ? { ...prev, email: newEmail, emailVerified: false } : prev));
      return true;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const updateUserPassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setAuthError(null);
      const result = await authService.updateUserPassword(currentPassword, newPassword);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      return true;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const reauthenticate = useCallback(async (password) => {
    try {
      setAuthError(null);
      const result = await authService.reauthenticate(password);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      return true;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  /**
   * Deletes the current user's account.
   *
   * Forwards the password to `authService.deleteUserAccount`, which handles
   * the reauthentication contract for password users. Password users must
   * supply their password here; OAuth-only users may pass `undefined`.
   *
   * The service returns `{ success: false, partial: true }` when the
   * Firestore cleanup succeeded but the Firebase Auth deletion failed. That
   * flag is preserved on the thrown `Error` so callers can offer a
   * retry-specific UI. The generic error toast is suppressed on partial
   * failures for the same reason - the caller knows the user-facing message
   * better than this layer does.
   */
  const deleteAccount = useCallback(
    async (password) => {
      try {
        setAuthError(null);
        const result = await authService.deleteUserAccount(password);
        if (!result.success) {
          const error = new Error(result.error);
          error.code = result.code || 'auth/unknown';
          // Preserve the partial-completion flag. Without this, a caller that
          // needs to distinguish a clean failure from one that already
          // removed the user's Firestore data has no way to do so.
          if (result.partial) {
            error.partial = true;
          }
          throw error;
        }
        clearAuthState();
        // Provider-layer toast - the delete modal closes on success, so
        // the provider is the single feedback surface for this action.
        toast.success('Account deleted successfully.');
        return true;
      } catch (error) {
        setAuthError(error);
        // Skip the generic toast on partial failures - the caller will
        // present a specific, actionable message (typically with a retry
        // button). A generic toast here would compete with it and confuse
        // the user about what actually happened.
        if (!error.partial) {
          toast.error(getErrorMessage(error.code));
        }
        throw error;
      }
    },
    [clearAuthState]
  );

  const linkProvider = useCallback(async (providerName) => {
    try {
      setAuthError(null);
      const result = await authService.linkProvider(providerName);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      setLinkedProviders(getLinkedProviderIds(result.user));
      return result.user;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const unlinkProvider = useCallback(async (providerId) => {
    try {
      setAuthError(null);
      const result = await authService.unlinkProvider(providerId);
      if (!result.success) {
        const error = new Error(result.error);
        error.code = result.code || 'auth/unknown';
        throw error;
      }
      setLinkedProviders(getLinkedProviderIds(result.user));
      return result.user;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const getToken = useCallback(async (forceRefresh = false) => {
    try {
      return await authService.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }, []);

  const getTokenResult = useCallback(async (forceRefresh = false) => {
    try {
      return await authService.getIdTokenResult(forceRefresh);
    } catch (error) {
      console.error('Error getting token result:', error);
      return null;
    }
  }, []);

  const hasRole = useCallback(
    (requiredRole) => {
      if (!userRole) return false;
      if (Array.isArray(requiredRole)) return requiredRole.includes(userRole);
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

  // ── Memoized Context Value ─────────────────────────────────────────────────

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
      sessionTimeout,
      extendSession,
      resetSessionTimer,
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
      sessionTimeout,
      extendSession,
      resetSessionTimer,
      signup,
      login,
      loginWithProvider,
      loginWithPhone,
      confirmPhoneSignIn,
      logout,
      resetPassword,
      confirmPasswordResetAction,
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
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useRequireAuth = (options = {}) => {
  const { user, loading, initializing, isEmailVerified, hasRole, sendVerificationEmail } =
    useAuth();
  const { requireEmailVerified = false, requiredRole = null, redirectTo = '/login' } = options;
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
