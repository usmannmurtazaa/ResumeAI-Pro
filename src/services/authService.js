import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  createUserWithEmailAndPassword,
  deleteUser as firebaseDeleteUser,
  EmailAuthProvider,
  FacebookAuthProvider,
  getAdditionalUserInfo,
  getIdToken as firebaseGetIdToken,
  getIdTokenResult as firebaseGetIdTokenResult,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  OAuthProvider,
  onAuthStateChanged,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  TwitterAuthProvider,
  unlink,
  updateEmail,
  updatePassword,
  updateProfile,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import toast from 'react-hot-toast';
import { auth, db, storage, logAnalyticsEvent } from './firebase';

// ── Constants ──────────────────────────────────────────────────────────────
const COLLECTIONS = {
  users: 'users',
  resumes: 'resumes',
  notifications: 'notifications',
  settings: 'settings',
  subscriptions: 'subscriptions',
  deletedAccounts: 'deletedAccounts',
  sessions: 'sessions',
};

const CURRENT_SESSION_STORAGE_KEY = 'resumeai-pro.current-session-id';
const BATCH_CHUNK_SIZE = 400; // Firestore limit is 500 per batch
const MAX_SESSIONS_DISPLAY = 25;

// Fields that users MUST NOT modify directly
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
  'linkedProviders',
  'providerData',
  'userId',
  'uid',
]);

const ALLOWED_ROLES = new Set(['user', 'premium', 'admin']);

// ── Error Handling ─────────────────────────────────────────────────────────

/**
 * Maps Firebase error codes to user-friendly messages.
 * Provides consistent error messages across the entire auth flow.
 */
const getErrorMessage = (error) => {
  const code = typeof error === 'string' ? error : error?.code;
  const fallbackMessage =
    typeof error === 'object' && error?.message
      ? error.message
      : 'An unexpected error occurred. Please try again.';

  const errorMessages = {
    'auth/email-already-in-use':
      'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password':
      'Password should be at least 8 characters with letters and numbers.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid credentials. Please try again.',
    'auth/too-many-requests':
      'Too many attempts. Please try again later.',
    'auth/network-request-failed':
      'Network error. Please check your connection.',
    'auth/popup-closed-by-user':
      'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked':
      'Popups are blocked. Please allow popups for this site.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/requires-recent-login':
      'Please sign in again to continue.',
    'auth/user-disabled':
      'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed':
      'This operation is not allowed.',
    'auth/invalid-verification-code':
      'Invalid verification code.',
    'auth/code-expired':
      'Verification code has expired.',
    'auth/missing-phone-number':
      'Phone number is required.',
    'auth/invalid-phone-number':
      'Invalid phone number format.',
    'auth/quota-exceeded':
      'SMS quota exceeded. Try again later.',
    'auth/invalid-action-code':
      'The action code is invalid or expired.',
    'auth/user-token-expired':
      'Your session has expired. Please sign in again.',
    'auth/web-storage-unsupported':
      'Web storage is not supported or disabled.',
    'auth/unauthorized-domain':
      'This domain is not authorized for OAuth operations.',
    'auth/cancelled-popup-request':
      'Another popup is already open.',
    'auth/internal-error':
      'An internal error occurred. Please try again.',
    'auth/no-current-user':
      'No user is currently signed in.',
    'auth/no-password-provider':
      'This account does not support password-based reauthentication.',
    'auth/missing-password':
      'Please enter your password to continue.',
    'auth/missing-recaptcha':
      'Phone verification is not ready. Please refresh and try again.',
    'auth/provider-not-linked':
      'This sign-in method is not linked to your account.',
    'auth/cannot-unlink-last-provider':
      'You must keep at least one sign-in method linked.',
    'auth/unsupported-provider':
      'This sign-in provider is not supported.',
  };

  return errorMessages[code] || fallbackMessage;
};

// ── Utilities ──────────────────────────────────────────────────────────────

/**
 * Safely logs an analytics event. Failures are silently caught
 * to prevent analytics errors from breaking the user experience.
 */
const safeTrackEvent = (eventName, params = {}) => {
  try {
    logAnalyticsEvent(eventName, params);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Analytics event "${eventName}" failed`, error);
    }
  }
};

/** Builds an absolute URL for auth action handlers. */
const buildActionUrl = (path) => {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
};

/** Normalizes email: lowercase and trimmed. */
const normalizeEmail = (email = '') => email.trim().toLowerCase();

/** Gets the current authenticated user or throws. */
const getCurrentUserOrThrow = () => {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('No user logged in');
    error.code = 'auth/no-current-user';
    throw error;
  }
  return user;
};

/** Checks if the user has a password provider linked. */
const hasPasswordProvider = (user) =>
  user?.providerData?.some((p) => p.providerId === 'password');

/** Returns an array of linked provider IDs. */
const getProviderIds = (user) =>
  user?.providerData?.map((p) => p.providerId).filter(Boolean) || [];

/** Builds a lookup map from provider IDs. */
const buildLinkedProviderMap = (providerIds = []) =>
  providerIds.reduce((acc, id) => ((acc[id] = true), acc), {});

/** Removes restricted fields from profile update data. */
const sanitizeProfileData = (data = {}) =>
  Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) => !RESTRICTED_PROFILE_FIELDS.has(key) && value !== undefined
    )
  );

/** Generates a unique filename to prevent collisions. */
const generateUniqueFileName = (originalName) => {
  const ext = originalName.includes('.')
    ? originalName.substring(originalName.lastIndexOf('.'))
    : '';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${unique}${ext}`;
};

// ── Session Storage Helpers ────────────────────────────────────────────────

const getSessionStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const getStoredCurrentSessionId = () => {
  return getSessionStorage()?.getItem(CURRENT_SESSION_STORAGE_KEY) || null;
};

const storeCurrentSessionId = (sessionId) => {
  const storage = getSessionStorage();
  if (storage && sessionId) {
    storage.setItem(CURRENT_SESSION_STORAGE_KEY, sessionId);
  }
};

const clearStoredCurrentSessionId = () => {
  getSessionStorage()?.removeItem(CURRENT_SESSION_STORAGE_KEY);
};

// ── Provider Factory ───────────────────────────────────────────────────────

/**
 * Creates a configured Firebase Auth provider instance.
 * Supports: Google, GitHub, Facebook, Microsoft, Twitter, Apple.
 */
const createProvider = (providerName) => {
  const name = providerName.toLowerCase();

  switch (name) {
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
      provider.addScope('read:user');
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
      provider.setCustomParameters({ prompt: 'select_account' });
      return provider;
    }
    case 'twitter': {
      return new TwitterAuthProvider();
    }
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

// ── Firestore Batch Operations ─────────────────────────────────────────────

/**
 * Deletes Firestore documents in batches to respect the 500-operation limit.
 * Deduplicates refs by path to prevent duplicate delete operations.
 */
const deleteInBatches = async (refs, chunkSize = BATCH_CHUNK_SIZE) => {
  const uniqueRefs = Array.from(
    new Map(refs.filter(Boolean).map((refItem) => [refItem.path, refItem])).values()
  );

  for (let index = 0; index < uniqueRefs.length; index += chunkSize) {
    const batch = writeBatch(db);
    uniqueRefs.slice(index, index + chunkSize).forEach((refItem) => {
      batch.delete(refItem);
    });
    await batch.commit();
  }
};

// ── Session Management (Internal) ──────────────────────────────────────────

const createSessionRecord = async (userId) => {
  try {
    const sessionRef = doc(collection(db, COLLECTIONS.users, userId, COLLECTIONS.sessions));

    await setDoc(sessionRef, {
      userId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      platform: typeof navigator !== 'undefined' ? navigator.platform : null,
      language: typeof navigator !== 'undefined' ? navigator.language : null,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      ip: null,
    });

    storeCurrentSessionId(sessionRef.id);
    return sessionRef.id;
  } catch (error) {
    console.error('Create session error:', error);
    return null;
  }
};

const getActiveSessions = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const sessionsRef = collection(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions);
    const sessionsQuery = query(sessionsRef, orderBy('createdAt', 'desc'), limit(MAX_SESSIONS_DISPLAY));
    const snapshot = await getDocs(sessionsQuery);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error('Get sessions error:', error);
    return [];
  }
};

const deleteCurrentSessionRecord = async (userId) => {
  const currentSessionId = getStoredCurrentSessionId();
  if (!currentSessionId) return;

  try {
    await deleteDoc(doc(db, COLLECTIONS.users, userId, COLLECTIONS.sessions, currentSessionId));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to delete current session record', error);
    }
  } finally {
    clearStoredCurrentSessionId();
  }
};

// ── Reauthentication ───────────────────────────────────────────────────────

const reauthenticateWithPassword = async (password) => {
  const user = getCurrentUserOrThrow();

  if (!hasPasswordProvider(user) || !user.email) {
    const error = new Error('Password reauthentication is not available for this account.');
    error.code = 'auth/no-password-provider';
    throw error;
  }

  if (!password) {
    const error = new Error('Password is required.');
    error.code = 'auth/missing-password';
    throw error;
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  return user;
};

// ── User Document Sync ─────────────────────────────────────────────────────

const syncUserDocAfterProviderAuth = async (user, providerName, isNewUser) => {
  const userRef = doc(db, COLLECTIONS.users, user.uid);
  const existingDoc = await getDoc(userRef);

  const baseData = {
    email: user.email || null,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || null,
    status: 'active',
    emailVerified: Boolean(user.emailVerified),
    authProvider: providerName.toLowerCase(),
    linkedProviders: buildLinkedProviderMap(getProviderIds(user)),
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!existingDoc.exists()) {
    await setDoc(userRef, {
      ...baseData,
      role: 'user',
      createdAt: serverTimestamp(),
    });
    return { isNewUser: true };
  }

  // Only update specific fields for existing users — never overwrite role/status
  await updateDoc(userRef, baseData);
  return { isNewUser: false };
};

const updateLinkedProvidersInFirestore = async (user) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
      linkedProviders: buildLinkedProviderMap(getProviderIds(user)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to sync linked providers', error);
    }
  }
};

// ── Auth Service ───────────────────────────────────────────────────────────

export const authService = {
  // ── Sign Up ────────────────────────────────────────────────────────────
  async signUp(email, password, displayName, options = {}) {
    try {
      const normalizedEmail = normalizeEmail(email);
      const normalizedDisplayName = displayName?.trim() || normalizedEmail.split('@')[0];

      const userCredential = await createUserWithEmailAndPassword(
        auth, normalizedEmail, password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: normalizedDisplayName,
        photoURL: options.photoURL || null,
      });

      if (options.sendVerification !== false) {
        await sendEmailVerification(user, {
          url: buildActionUrl('/verify-email'),
          handleCodeInApp: true,
        });
      }

      // Use setDoc without merge for new document creation
      await setDoc(doc(db, COLLECTIONS.users, user.uid), {
        email: normalizedEmail,
        displayName: normalizedDisplayName,
        photoURL: options.photoURL || null,
        phoneNumber: options.phoneNumber || null,
        role: 'user',
        status: 'active',
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        authProvider: 'password',
        linkedProviders: { password: true },
        metadata: {
          signUpMethod: 'email',
          referrer: options.referrer || null,
          utmSource: options.utmSource || null,
          signUpSource: options.signUpSource || 'web',
        },
      });

      await createSessionRecord(user.uid);

      safeTrackEvent('sign_up', { method: 'email', userId: user.uid });

      toast.success('Account created successfully! Please verify your email.');
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Sign In ────────────────────────────────────────────────────────────
  async signIn(email, password, rememberMe = true) {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const userCredential = await signInWithEmailAndPassword(
        auth, normalizeEmail(email), password
      );
      const user = userCredential.user;

      await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
        'metadata.lastLoginIp': null,
      });

      await createSessionRecord(user.uid);

      safeTrackEvent('login', { method: 'email', userId: user.uid });

      toast.success('Welcome back!');
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Social Provider Sign In ────────────────────────────────────────────
  async signInWithProvider(providerName) {
    try {
      const provider = createProvider(providerName);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const authInfo = getAdditionalUserInfo(result);
      const isNewUser = Boolean(authInfo?.isNewUser);

      await syncUserDocAfterProviderAuth(user, providerName.toLowerCase(), isNewUser);
      await createSessionRecord(user.uid);

      safeTrackEvent(isNewUser ? 'sign_up' : 'login', {
        method: providerName.toLowerCase(),
        userId: user.uid,
      });

      toast.success(
        isNewUser
          ? 'Account created successfully! Welcome aboard!'
          : `Successfully signed in with ${providerName}!`
      );

      return { success: true, user, isNewUser };
    } catch (error) {
      console.error(`${providerName} sign in error:`, error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Phone Sign In ──────────────────────────────────────────────────────
  async signInWithPhone(phoneNumber, recaptchaVerifier) {
    try {
      if (!recaptchaVerifier) {
        const error = new Error('Recaptcha verifier is required.');
        error.code = 'auth/missing-recaptcha';
        throw error;
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth, phoneNumber.trim(), recaptchaVerifier
      );

      toast.success('Verification code sent!');
      return { success: true, confirmationResult };
    } catch (error) {
      console.error('Phone sign in error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async confirmPhoneSignIn(confirmationResult, code) {
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      const authInfo = getAdditionalUserInfo(result);
      const userRef = doc(db, COLLECTIONS.users, user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          phoneNumber: user.phoneNumber || null,
          displayName: `User${user.uid.slice(0, 6)}`,
          role: 'user',
          status: 'active',
          phoneVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: 'phone',
          linkedProviders: { phone: true },
        });
      } else {
        await updateDoc(userRef, {
          phoneNumber: user.phoneNumber || userDoc.data()?.phoneNumber || null,
          phoneVerified: true,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await createSessionRecord(user.uid);

      safeTrackEvent(authInfo?.isNewUser ? 'sign_up' : 'login', {
        method: 'phone',
        userId: user.uid,
      });

      toast.success(authInfo?.isNewUser ? 'Account created!' : 'Phone verified!');
      return { success: true, user, isNewUser: Boolean(authInfo?.isNewUser) };
    } catch (error) {
      console.error('Phone confirmation error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── MFA Management ─────────────────────────────────────────────────────
  async enrollMFA(phoneNumber, recaptchaVerifier) {
    try {
      const user = getCurrentUserOrThrow();

      if (!recaptchaVerifier) {
        const error = new Error('Recaptcha verifier is required.');
        error.code = 'auth/missing-recaptcha';
        throw error;
      }

      const session = await user.multiFactor.getSession();
      const mfaProvider = new PhoneAuthProvider(auth);
      const verificationId = await mfaProvider.verifyPhoneNumber(
        { phoneNumber: phoneNumber.trim(), session },
        recaptchaVerifier
      );

      return { success: true, verificationId };
    } catch (error) {
      console.error('MFA enrollment error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async verifyMFAEnrollment(verificationId, verificationCode) {
    try {
      const user = getCurrentUserOrThrow();
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);

      await user.multiFactor.enroll(multiFactorAssertion, 'Phone Number');

      toast.success('Two-factor authentication enabled!');
      return { success: true };
    } catch (error) {
      console.error('MFA verification error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async unenrollMFA(enrollmentId) {
    try {
      const user = getCurrentUserOrThrow();
      await user.multiFactor.unenroll(enrollmentId);

      toast.success('Two-factor authentication disabled');
      return { success: true };
    } catch (error) {
      console.error('MFA unenroll error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async getMFAEnrollments() {
    try {
      const user = auth.currentUser;
      return user?.multiFactor?.enrolledFactors || [];
    } catch (error) {
      console.error('Get MFA enrollments error:', error);
      return [];
    }
  },

  // ── Session Management ─────────────────────────────────────────────────
  async createSessionRecord(userId) {
    const sessionId = await createSessionRecord(userId);
    return { success: Boolean(sessionId), sessionId };
  },

  async getActiveSessions() {
    return await getActiveSessions();
  },

  async revokeSession(sessionId) {
    try {
      const user = getCurrentUserOrThrow();
      await deleteDoc(doc(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions, sessionId));

      if (sessionId === getStoredCurrentSessionId()) {
        clearStoredCurrentSessionId();
      }

      toast.success('Session revoked');
      return { success: true };
    } catch (error) {
      console.error('Revoke session error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async revokeAllOtherSessions() {
    try {
      const user = getCurrentUserOrThrow();
      const sessions = await getActiveSessions();
      const currentSessionId = getStoredCurrentSessionId();
      const refsToDelete = sessions
        .filter((s) => s.id !== currentSessionId)
        .map((s) => doc(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions, s.id));

      if (refsToDelete.length > 0) {
        await deleteInBatches(refsToDelete);
      }

      toast.success('All other sessions signed out');
      return { success: true };
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Sign Out ───────────────────────────────────────────────────────────
  async signOut() {
    try {
      const user = auth.currentUser;

      if (user) {
        await deleteCurrentSessionRecord(user.uid);
        await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
          lastLogout: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to update logout timestamp', error);
          }
        });
      }

      await firebaseSignOut(auth);
      clearStoredCurrentSessionId();
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Password Reset ─────────────────────────────────────────────────────
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, normalizeEmail(email), {
        url: buildActionUrl('/login'),
        handleCodeInApp: false,
      });
    } catch (error) {
      // Log the error internally but DO NOT reveal whether the email exists
      if (process.env.NODE_ENV === 'development') {
        console.warn('Password reset attempt:', error?.code || error);
      }
    }

    // Always show the same message to prevent email enumeration
    toast.success('If an account exists, a reset email has been sent.');
    return { success: true };
  },

  async confirmPasswordReset(oobCode, newPassword) {
    try {
      await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
      toast.success('Password reset successfully! You can now sign in.');
      return { success: true };
    } catch (error) {
      console.error('Confirm password reset error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async verifyPasswordResetCode(oobCode) {
    try {
      const email = await firebaseVerifyPasswordResetCode(auth, oobCode);
      return { success: true, email };
    } catch (error) {
      console.error('Verify reset code error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Email Verification ─────────────────────────────────────────────────
  async sendVerificationEmail() {
    try {
      const user = getCurrentUserOrThrow();
      await sendEmailVerification(user, {
        url: buildActionUrl('/verify-email'),
        handleCodeInApp: true,
      });

      toast.success('Verification email sent! Check your inbox.');
      return { success: true };
    } catch (error) {
      console.error('Send verification error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async verifyEmail(oobCode) {
    try {
      const actionInfo = await checkActionCode(auth, oobCode);
      await applyActionCode(auth, oobCode);

      const verifiedEmail = actionInfo?.data?.email || actionInfo?.data?.previousEmail || null;

      if (verifiedEmail) {
        // Query by email (requires composite index on 'email' field)
        const usersQuery = query(
          collection(db, COLLECTIONS.users),
          where('email', '==', verifiedEmail)
        );
        const snapshot = await getDocs(usersQuery);

        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach((userDoc) => {
            batch.update(userDoc.ref, {
              emailVerified: true,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }
      } else if (auth.currentUser) {
        await updateDoc(doc(db, COLLECTIONS.users, auth.currentUser.uid), {
          emailVerified: true,
          updatedAt: serverTimestamp(),
        });
      }

      toast.success('Email verified successfully!');
      return { success: true };
    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async checkActionCodeValidity(oobCode) {
    try {
      const info = await checkActionCode(auth, oobCode);
      return {
        success: true,
        operation: info.operation,
        email: info.data?.email || null,
        fromEmail: info.data?.fromEmail || null,
      };
    } catch (error) {
      console.error('Check action code error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Profile Management ─────────────────────────────────────────────────
  async updateUserProfile(userId, data) {
    try {
      const currentUser = auth.currentUser;
      const sanitizedData = sanitizeProfileData(data);
      const authUpdates = {};

      if (currentUser && currentUser.uid === userId) {
        if (sanitizedData.displayName !== undefined &&
            sanitizedData.displayName !== currentUser.displayName) {
          authUpdates.displayName = sanitizedData.displayName;
        }
        if (sanitizedData.photoURL !== undefined &&
            sanitizedData.photoURL !== currentUser.photoURL) {
          authUpdates.photoURL = sanitizedData.photoURL;
        }

        if (Object.keys(authUpdates).length > 0) {
          await updateProfile(currentUser, authUpdates);
        }
      }

      await updateDoc(doc(db, COLLECTIONS.users, userId), {
        ...sanitizedData,
        ...authUpdates,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async updateUserEmail(newEmail, password) {
    try {
      const user = await reauthenticateWithPassword(password);
      const normalizedEmail = normalizeEmail(newEmail);

      await updateEmail(user, normalizedEmail);
      await sendEmailVerification(user, {
        url: buildActionUrl('/verify-email'),
        handleCodeInApp: true,
      });

      await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
        email: normalizedEmail,
        emailVerified: false,
        updatedAt: serverTimestamp(),
      });

      toast.success('Email updated! Please verify your new email.');
      return { success: true };
    } catch (error) {
      console.error('Update email error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async updateUserPassword(currentPassword, newPassword) {
    try {
      const user = await reauthenticateWithPassword(currentPassword);
      await updatePassword(user, newPassword);

      toast.success('Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async reauthenticate(password) {
    try {
      await reauthenticateWithPassword(password);
      return { success: true };
    } catch (error) {
      console.error('Reauthentication error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Profile Image ──────────────────────────────────────────────────────
  async uploadProfileImage(userId, file, onProgress) {
    try {
      const uniqueFileName = generateUniqueFileName(file.name);
      const storageRef = ref(storage, `avatars/${userId}/${uniqueFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || undefined,
      });

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (!onProgress) return;
            const progress =
              snapshot.totalBytes > 0
                ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
                : 0;
            onProgress(progress);
          },
          reject,
          resolve
        );
      });

      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      const updateResult = await this.updateUserProfile(userId, { photoURL: downloadURL });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update profile image URL.');
      }

      toast.success('Profile picture updated!');
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload profile image error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async deleteProfileImage(userId, photoURL) {
    try {
      // Only attempt deletion if it's a Firebase Storage URL
      if (photoURL) {
        try {
          const url = new URL(photoURL);
          const isFirebaseStorage =
            url.hostname.includes('firebasestorage.googleapis.com') ||
            url.hostname.includes('storage.googleapis.com');

          if (isFirebaseStorage) {
            // Extract the path from the URL for ref()
            const decodedPath = decodeURIComponent(url.pathname.split('/o/')[1] || '');
            if (decodedPath) {
              const fileRef = ref(storage, decodedPath);
              await deleteObject(fileRef).catch((err) => {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Profile image file delete failed', err);
                }
              });
            }
          }
        } catch {
          // Invalid URL — skip deletion
        }
      }

      const updateResult = await this.updateUserProfile(userId, { photoURL: null });
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to remove profile image.');
      }

      toast.success('Profile picture removed');
      return { success: true };
    } catch (error) {
      console.error('Delete profile image error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Account Linking ────────────────────────────────────────────────────
  async linkProvider(providerName) {
    try {
      const user = getCurrentUserOrThrow();
      const provider = createProvider(providerName);
      const result = await linkWithPopup(user, provider);

      await updateLinkedProvidersInFirestore(result.user);

      toast.success(`${providerName} account linked successfully`);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Link provider error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async unlinkProvider(providerId) {
    try {
      const user = getCurrentUserOrThrow();
      const linkedProviders = getProviderIds(user);

      if (!linkedProviders.includes(providerId)) {
        const error = new Error('Provider not linked.');
        error.code = 'auth/provider-not-linked';
        throw error;
      }

      if (linkedProviders.length <= 1) {
        const error = new Error('Cannot unlink the last provider.');
        error.code = 'auth/cannot-unlink-last-provider';
        throw error;
      }

      const updatedUser = await unlink(user, providerId);
      await updateLinkedProvidersInFirestore(updatedUser);

      toast.success('Account unlinked successfully');
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Unlink provider error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async getLinkedProviders() {
    try {
      const user = auth.currentUser;
      return getProviderIds(user);
    } catch (error) {
      console.error('Get linked providers error:', error);
      return [];
    }
  },

  // ── Account Deletion ───────────────────────────────────────────────────
  async deleteUserAccount(password) {
    try {
      const user = getCurrentUserOrThrow();
      const userId = user.uid;

      if (hasPasswordProvider(user)) {
        await reauthenticateWithPassword(password);
      }

      const [resumesSnapshot, notificationsSnapshot, sessionsSnapshot] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.resumes), where('userId', '==', userId))),
        getDocs(query(collection(db, COLLECTIONS.notifications), where('userId', '==', userId))),
        getDocs(collection(db, COLLECTIONS.users, userId, COLLECTIONS.sessions)),
      ]);

      // Archive deletion record for compliance
      try {
        await setDoc(doc(db, COLLECTIONS.deletedAccounts, userId), {
          userId,
          email: user.email || null,
          deletedAt: serverTimestamp(),
          reason: 'user_requested',
          provider: user.providerData?.[0]?.providerId || 'password',
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to archive deleted account record', error);
        }
      }

      const refsToDelete = [
        ...resumesSnapshot.docs.map((d) => d.ref),
        ...notificationsSnapshot.docs.map((d) => d.ref),
        ...sessionsSnapshot.docs.map((d) => d.ref),
        doc(db, COLLECTIONS.settings, userId),
        doc(db, COLLECTIONS.subscriptions, userId),
        doc(db, COLLECTIONS.users, userId),
      ];

      await deleteInBatches(refsToDelete);

      safeTrackEvent('account_deleted', { userId });

      clearStoredCurrentSessionId();
      await firebaseDeleteUser(user);

      toast.success('Account deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── User Data ──────────────────────────────────────────────────────────
  async getUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.users, userId));
      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: userDoc.data() };
    } catch (error) {
      console.error('Get user data error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  async getUserRole(userId) {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.users, userId));
      return userDoc.data()?.role || 'user';
    } catch (error) {
      console.error('Get user role error:', error);
      return 'user';
    }
  },

  async isUserPremium(userId) {
    try {
      const [userDoc, subscriptionDoc] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.users, userId)),
        getDoc(doc(db, COLLECTIONS.subscriptions, userId)),
      ]);

      const role = userDoc.data()?.role;
      const subscription = subscriptionDoc.exists() ? subscriptionDoc.data() : null;

      return (
        role === 'premium' ||
        role === 'admin' ||
        (subscription?.status === 'active' && subscription?.plan === 'premium')
      );
    } catch {
      return false;
    }
  },

  async updateUserRole(userId, role) {
    try {
      const normalizedRole = ALLOWED_ROLES.has(role) ? role : 'user';
      await updateDoc(doc(db, COLLECTIONS.users, userId), {
        role: normalizedRole,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Update user role error:', error);
      return { success: false, error: getErrorMessage(error), code: error.code };
    }
  },

  // ── Token Management ───────────────────────────────────────────────────
  async getIdToken(forceRefresh = false) {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await firebaseGetIdToken(user, forceRefresh);
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  },

  async getIdTokenResult(forceRefresh = false) {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await firebaseGetIdTokenResult(user, forceRefresh);
    } catch (error) {
      console.error('Get token result error:', error);
      return null;
    }
  },

  // ── Auth State ─────────────────────────────────────────────────────────
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  isAuthenticated() {
    return Boolean(auth.currentUser);
  },

  async refreshUserClaims() {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      await firebaseGetIdToken(user, true);
      return true;
    } catch (error) {
      console.error('Refresh claims error:', error);
      return false;
    }
  },
};

export default authService;