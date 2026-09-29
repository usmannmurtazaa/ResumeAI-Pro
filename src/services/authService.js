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
  browserLocalPersistence,
  browserSessionPersistence,
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
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
// NOTE ON TOASTS IN THIS FILE:
// The service layer is now silent for every operation whose callers provide
// their own user-facing feedback. That covers: signUp, signIn,
// signInWithProvider, signInWithPhone, confirmPhoneSignIn, signOut,
// updateUserEmail, updateUserPassword, linkProvider, unlinkProvider,
// deleteUserAccount, resetPassword, confirmPasswordReset, and
// sendVerificationEmail.
//
// The remaining `toast.success(...)` calls are for operations where the
// service is currently the ONLY feedback surface in the codebase:
//   • `verifyEmail` - no caller in the current tree invokes this method;
//     `VerifyEmail.jsx` uses `applyActionCode` directly.
//   • `uploadProfileImage` / `deleteProfileImage` - no visible caller.
//   • `revokeSession` / `revokeAllOtherSessions` - no visible caller.
// Before removing any of these, wire the caller with its own toast.
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

const SESSION_STORAGE_KEY = 'resumeaixpro.current-session-id';
const BATCH_CHUNK_SIZE = 400;
const MAX_SESSIONS_DISPLAY = 25;

// Firebase Auth caps the `photoURL` field at roughly 2 KB. We validate
// against the same limit client-side so that a caller never sends a value
// that will be rejected with HTTP 400 by `accounts:update`.
const MAX_AUTH_PHOTO_URL_LENGTH = 2048;

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

// ── Error Messages ─────────────────────────────────────────────────────────
const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password should be at least 8 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid credentials. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Popups are blocked. Please allow popups for this site.',
  'auth/account-exists-with-different-credential':
    'Account exists with a different sign-in method.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/invalid-verification-code': 'Invalid verification code.',
  'auth/code-expired': 'Verification code has expired.',
  'auth/invalid-action-code': 'The action code is invalid or expired.',
  'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  'auth/no-current-user': 'No user is currently signed in.',
  'auth/no-password-provider': 'Password authentication not available.',
  'auth/missing-password': 'Please enter your password.',
  'auth/provider-not-linked': 'Provider is not linked.',
  'auth/cannot-unlink-last-provider': 'Cannot unlink the last provider.',
  'auth/unsupported-provider': 'Provider not supported.',
  // Codes used by the guarded `updateUserRole` below.
  'auth/invalid-user-id': 'A valid user id is required.',
  'auth/invalid-role': 'That role is not supported.',
  'auth/insufficient-role': 'Administrator access is required for this action.',
  // Codes used by the suspended-account guard (C-11).
  // The message is intentionally neutral: it confirms the block without
  // leaking the suspension reason, which is server-side information.
  'auth/account-suspended': 'This account has been suspended. Please contact support.',
};

// ── Utilities ──────────────────────────────────────────────────────────────

const getErrorMessage = (error) => {
  const code = typeof error === 'string' ? error : error?.code;
  return ERROR_MESSAGES[code] || error?.message || 'An unexpected error occurred.';
};

const safeTrackEvent = (eventName, params = {}) => {
  try {
    logAnalyticsEvent(eventName, params);
  } catch {}
};

const buildActionUrl = (path) =>
  typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const getCurrentUserOrThrow = () => {
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('No user logged in'), { code: 'auth/no-current-user' });
  return user;
};

const hasPasswordProvider = (user) => user?.providerData?.some((p) => p.providerId === 'password');

const getProviderIds = (user) => user?.providerData?.map((p) => p.providerId).filter(Boolean) || [];

const buildLinkedProviderMap = (ids = []) =>
  ids.reduce((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});

const sanitizeProfileData = (data = {}) =>
  Object.fromEntries(
    Object.entries(data).filter(([k, v]) => !RESTRICTED_PROFILE_FIELDS.has(k) && v !== undefined)
  );

/**
 * Whether a value is safe to forward to Firebase Auth's `updateProfile` as
 * the `photoURL`. Firebase Auth stores the value verbatim and caps the field
 * at roughly 2 KB; larger values, and values that are not `http(s)` URLs
 * (notably the `data:image/...;base64,...` strings produced by
 * `FileReader.readAsDataURL`), are rejected by the server with HTTP 400.
 * Anything that fails this check should be skipped on the Auth side and -
 * if appropriate - handled through Firebase Storage instead.
 */
const isSafeAuthPhotoURL = (value) => {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > MAX_AUTH_PHOTO_URL_LENGTH) return false;
  return /^https?:\/\//i.test(value);
};

const generateUniqueFileName = (name) => {
  const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
};

// ── Suspended-Account Guard (C-11) ─────────────────────────────────────────
//
// Firebase Auth is unaware of the Firestore `users/{uid}.status` field, so
// the sign-in flow can complete successfully for a user whose account has
// been suspended by an admin. Every sign-in entry point in this service
// must therefore read the Firestore document and refuse to complete the
// sign-in when `status === 'suspended'`.
//
// The three callers of this helper are:
//   • signIn (email + password)
//   • syncUserDocAfterProviderAuth (OAuth: Google, GitHub, Facebook, etc.)
//   • confirmPhoneSignIn (phone OTP)
//
// If a fourth sign-in path is ever added, it MUST invoke this helper too.
// The helper does not return on the suspended branch - it throws, so
// callers do not need to check its return value.

/**
 * Signs the Firebase Auth user out and clears the local session identifier,
 * then throws an `auth/account-suspended` error. Called when a sign-in
 * attempt is made against a suspended account.
 *
 * Signing out before throwing is essential: without it, the client would
 * retain a valid Firebase ID token and a subsequent Firebase SDK call could
 * silently re-establish the session. Clearing the session id ensures a
 * subsequent sign-in attempt cannot accidentally reuse the previous
 * session's record.
 */
const failSuspendedSignIn = async (userId) => {
  try {
    await firebaseSignOut(auth);
  } catch {
    // Best effort - the throw below is what the caller observes.
  }
  clearStoredSessionId();
  safeTrackEvent('suspended_sign_in_attempt', userId ? { userId } : {});
  throw Object.assign(new Error('This account has been suspended.'), {
    code: 'auth/account-suspended',
  });
};

// ── Session Storage ────────────────────────────────────────────────────────

const getSessionStore = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const getStoredSessionId = () => getSessionStore()?.getItem(SESSION_STORAGE_KEY) || null;
const storeSessionId = (id) => getSessionStore()?.setItem(SESSION_STORAGE_KEY, id);
const clearStoredSessionId = () => getSessionStore()?.removeItem(SESSION_STORAGE_KEY);

// ── Provider Factory ───────────────────────────────────────────────────────

const createProvider = (name) => {
  switch (name.toLowerCase()) {
    case 'google': {
      const p = new GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      p.addScope('profile');
      p.addScope('email');
      return p;
    }
    case 'github': {
      const p = new GithubAuthProvider();
      p.addScope('user:email');
      p.addScope('read:user');
      return p;
    }
    case 'facebook': {
      const p = new FacebookAuthProvider();
      p.addScope('email');
      p.addScope('public_profile');
      return p;
    }
    case 'microsoft': {
      const p = new OAuthProvider('microsoft.com');
      p.addScope('User.read');
      p.addScope('email');
      p.setCustomParameters({ prompt: 'select_account' });
      return p;
    }
    case 'twitter':
      return new TwitterAuthProvider();
    case 'apple': {
      const p = new OAuthProvider('apple.com');
      p.addScope('email');
      p.addScope('name');
      return p;
    }
    default:
      throw Object.assign(new Error(`Unsupported: ${name}`), { code: 'auth/unsupported-provider' });
  }
};

// ── Batch Delete ───────────────────────────────────────────────────────────

const deleteInBatches = async (refs, chunkSize = BATCH_CHUNK_SIZE) => {
  const unique = Array.from(new Map(refs.filter(Boolean).map((r) => [r.path, r])).values());
  for (let i = 0; i < unique.length; i += chunkSize) {
    const batch = writeBatch(db);
    unique.slice(i, i + chunkSize).forEach((r) => batch.delete(r));
    await batch.commit();
  }
};

// ── Session Management (Internal) ──────────────────────────────────────────

const createSessionRecord = async (userId) => {
  try {
    const ref = doc(collection(db, COLLECTIONS.users, userId, COLLECTIONS.sessions));
    await setDoc(ref, {
      userId,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      userAgent: navigator?.userAgent || null,
      platform: navigator?.platform || null,
      language: navigator?.language || null,
    });
    storeSessionId(ref.id);
    return ref.id;
  } catch (e) {
    console.error('Create session error:', e);
    return null;
  }
};

const getActiveSessions = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    const q = query(
      collection(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions),
      orderBy('createdAt', 'desc'),
      limit(MAX_SESSIONS_DISPLAY)
    );
    return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Get sessions error:', e);
    return [];
  }
};

const deleteCurrentSessionRecord = async (userId) => {
  const id = getStoredSessionId();
  if (!id) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.users, userId, COLLECTIONS.sessions, id));
  } catch {}
  clearStoredSessionId();
};

// ── Reauthentication ───────────────────────────────────────────────────────

const reauthenticateWithPassword = async (password) => {
  const user = getCurrentUserOrThrow();
  if (!hasPasswordProvider(user) || !user.email) {
    throw Object.assign(new Error('Password auth not available'), {
      code: 'auth/no-password-provider',
    });
  }
  if (!password)
    throw Object.assign(new Error('Password required'), { code: 'auth/missing-password' });
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  return user;
};

// ── User Doc Sync ──────────────────────────────────────────────────────────
//
// New-vs-existing is determined from the Firestore document, not from a
// caller-supplied flag. The Auth SDK's `isNewUser` signal and the Firestore
// document's existence can diverge (e.g. after a partial failure), and the
// Firestore document is the authoritative source of truth for whether the
// user record already exists in this app.

const syncUserDocAfterProviderAuth = async (user, providerName) => {
  const ref = doc(db, COLLECTIONS.users, user.uid);
  const existing = await getDoc(ref);

  // C-11: refuse the sign-in if the account has been suspended. Checked
  // before any write so no `lastLogin` update or `setDoc` occurs for a
  // suspended account. `failSuspendedSignIn` signs the Firebase user out
  // and throws; the caller's outer try/catch converts the throw into the
  // standard `{ success: false, error, code }` response.
  if (existing.exists() && existing.data()?.status === 'suspended') {
    await failSuspendedSignIn(user.uid);
  }

  // Fields refreshed on every OAuth sign-in. `status` is intentionally NOT
  // part of this set - it is admin-managed and must persist across sign-ins
  // so that a suspended account stays suspended.
  const base = {
    email: user.email || null,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || null,
    emailVerified: Boolean(user.emailVerified),
    authProvider: providerName.toLowerCase(),
    linkedProviders: buildLinkedProviderMap(getProviderIds(user)),
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!existing.exists()) {
    // New user - provision the document with the default status.
    await setDoc(ref, {
      ...base,
      role: 'user',
      status: 'active',
      createdAt: serverTimestamp(),
    });
    return true;
  }

  // Existing user - update profile fields only. Do not touch `status`.
  await updateDoc(ref, base);
  return false;
};

const updateLinkedProvidersInFirestore = async (user) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
      linkedProviders: buildLinkedProviderMap(getProviderIds(user)),
      updatedAt: serverTimestamp(),
    });
  } catch {}
};

// ── Auth Service ───────────────────────────────────────────────────────────

export const authService = {
  async signUp(email, password, displayName, options = {}) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
      const user = cred.user;
      await updateProfile(user, {
        displayName: displayName?.trim() || normalizeEmail(email).split('@')[0],
        photoURL: options.photoURL || null,
      });
      if (options.sendVerification !== false) {
        await sendEmailVerification(user, {
          url: buildActionUrl('/verify-email'),
          handleCodeInApp: true,
        });
      }
      await setDoc(doc(db, COLLECTIONS.users, user.uid), {
        email: normalizeEmail(email),
        displayName: displayName?.trim() || normalizeEmail(email).split('@')[0],
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
      return { success: true, user };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async signIn(email, password, rememberMe = true) {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);

      // C-11: read the user document once before the `lastLogin` write so
      // we can (a) refuse suspended accounts and (b) preserve the existing
      // behaviour of writing `lastLogin` for everyone else. The single
      // `getDoc` replaces no prior read in this method - previously there
      // was none - so the net cost is +1 read per email/password sign-in,
      // which is well within Spark-plan quota at realistic volumes.
      const userRef = doc(db, COLLECTIONS.users, cred.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data()?.status === 'suspended') {
        await failSuspendedSignIn(cred.user.uid);
      }

      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await createSessionRecord(cred.user.uid);
      safeTrackEvent('login', { method: 'email', userId: cred.user.uid });
      return { success: true, user: cred.user };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async signInWithProvider(name) {
    try {
      const result = await signInWithPopup(auth, createProvider(name));
      const isNew = Boolean(getAdditionalUserInfo(result)?.isNewUser);
      // `syncUserDocAfterProviderAuth` performs the suspended check and
      // will throw before any Firestore write for a suspended account.
      await syncUserDocAfterProviderAuth(result.user, name.toLowerCase());
      await createSessionRecord(result.user.uid);
      safeTrackEvent(isNew ? 'sign_up' : 'login', {
        method: name.toLowerCase(),
        userId: result.user.uid,
      });
      return { success: true, user: result.user, isNewUser: isNew };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async signInWithPhone(phone, recaptcha) {
    try {
      if (!recaptcha)
        throw Object.assign(new Error('Recaptcha required'), { code: 'auth/missing-recaptcha' });
      const confirmation = await signInWithPhoneNumber(auth, phone.trim(), recaptcha);
      return { success: true, confirmationResult: confirmation };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async confirmPhoneSignIn(confirmation, code) {
    try {
      const result = await confirmation.confirm(code);
      const user = result.user;
      const isNew = Boolean(getAdditionalUserInfo(result)?.isNewUser);
      const ref = doc(db, COLLECTIONS.users, user.uid);
      const existing = await getDoc(ref);

      // C-11: same guard as the other two sign-in paths. Checked before any
      // write so no `lastLogin` update or `setDoc` occurs for a suspended
      // account. `failSuspendedSignIn` signs the Firebase user out and
      // throws; the outer catch converts the throw into the standard
      // `{ success: false, error, code }` response.
      if (existing.exists() && existing.data()?.status === 'suspended') {
        await failSuspendedSignIn(user.uid);
      }

      if (!existing.exists()) {
        await setDoc(ref, {
          phoneNumber: user.phoneNumber,
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
        await updateDoc(ref, {
          phoneNumber: user.phoneNumber || existing.data()?.phoneNumber,
          phoneVerified: true,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await createSessionRecord(user.uid);
      safeTrackEvent(isNew ? 'sign_up' : 'login', { method: 'phone', userId: user.uid });
      return { success: true, user, isNewUser: isNew };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async signOut() {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteCurrentSessionRecord(user.uid);
        await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
          lastLogout: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
      await firebaseSignOut(auth);
      clearStoredSessionId();
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  // User-facing feedback for this method is provided by the caller:
  //   • ForgotPassword.onSubmit
  //   • ForgotPassword.handleResend
  // They toast once the request completes. Emitting a toast here would
  // produce two stacked toasts for a single submission.
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, normalizeEmail(email), {
        url: buildActionUrl('/login'),
        handleCodeInApp: false,
      });
    } catch {}
    return { success: true };
  },

  // User-facing feedback for this method is provided by the caller:
  //   • ForgotPassword.ResetPasswordHandler.handleReset
  async confirmPasswordReset(oobCode, newPassword) {
    try {
      await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  // User-facing feedback for this method is provided by the callers:
  //   • VerifyEmail.handleResendVerification
  //   • PrivateRoute.handleResendVerification
  async sendVerificationEmail() {
    try {
      await sendEmailVerification(getCurrentUserOrThrow(), {
        url: buildActionUrl('/verify-email'),
        handleCodeInApp: true,
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  // ── verifyEmail ────────────────────────────────────────────────────────
  //
  // Firebase Auth accepts the action code and flips its own `emailVerified`
  // flag on `applyActionCode`. The matching Firestore document must be
  // updated separately, but the `users/{userId}` rules are isSelf-scoped:
  //
  //     allow read, update: if isSelf(userId) || isPrivilegedAdmin();
  //
  // A `where('email', '==', …)` query cannot be statically proven to return
  // only the caller's own document, so Firestore rejects it with
  // `Missing or insufficient permissions`. The correct approach is to write
  // directly to the caller's own uid when it is available. When it is not
  // (link opened in a different browser), the Firestore write is skipped -
  // the Auth-side flag is already set, and `hydrateUserDocument` will sync
  // the Firestore document on the next sign-in.
  //
  // NOTE: `VerifyEmail.jsx` currently bypasses this method and calls
  // `applyActionCode` directly. If that changes, the Firestore-side
  // `emailVerified` write here becomes live and the toast below should be
  // reviewed against whichever page calls this - it is currently the sole
  // feedback surface for the method.
  async verifyEmail(oobCode) {
    try {
      const info = await checkActionCode(auth, oobCode);
      await applyActionCode(auth, oobCode);

      const verifiedEmail = info?.data?.email || null;
      const currentUser = auth.currentUser;

      if (currentUser?.uid) {
        const emailMatches =
          !verifiedEmail || (currentUser.email || '').toLowerCase() === verifiedEmail.toLowerCase();

        if (emailMatches) {
          try {
            await updateDoc(doc(db, COLLECTIONS.users, currentUser.uid), {
              emailVerified: true,
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            // A Firestore failure here does not invalidate the Auth-side
            // verification. Surface it in development without failing the
            // whole call - the caller's toast and redirect should still fire.
            if (process.env.NODE_ENV === 'development') {
              console.warn('Unable to update Firestore emailVerified flag', error);
            }
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.warn(
            'verifyEmail: signed-in email does not match verified email; skipping Firestore update'
          );
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.info('verifyEmail: no signed-in user; Firestore flag will sync on next sign-in');
      }

      toast.success('Email verified!');
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async updateUserProfile(userId, data) {
    try {
      const user = auth.currentUser;
      const sanitized = sanitizeProfileData(data);
      const authUpdates = {};
      if (user?.uid === userId) {
        if (sanitized.displayName !== undefined && sanitized.displayName !== user.displayName) {
          authUpdates.displayName = sanitized.displayName;
        }

        // Only forward `photoURL` to Firebase Auth when it is an actual
        // `http(s)` URL that fits within the field's size limit. Data URLs
        // (from `FileReader.readAsDataURL`) and other non-URL values are
        // skipped here - Firebase Auth responds with HTTP 400 for them, which
        // would otherwise abort the entire profile save. The value still
        // flows through to the Firestore write below so the app's own avatar
        // display keeps working.
        if (
          sanitized.photoURL !== undefined &&
          sanitized.photoURL !== user.photoURL &&
          isSafeAuthPhotoURL(sanitized.photoURL)
        ) {
          authUpdates.photoURL = sanitized.photoURL;
        }

        if (Object.keys(authUpdates).length) await updateProfile(user, authUpdates);
      }
      await updateDoc(doc(db, COLLECTIONS.users, userId), {
        ...sanitized,
        ...authUpdates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async updateUserEmail(newEmail, password) {
    try {
      const user = await reauthenticateWithPassword(password);
      await updateEmail(user, normalizeEmail(newEmail));
      await sendEmailVerification(user, {
        url: buildActionUrl('/verify-email'),
        handleCodeInApp: true,
      });
      await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
        email: normalizeEmail(newEmail),
        emailVerified: false,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async updateUserPassword(currentPassword, newPassword) {
    try {
      await updatePassword(await reauthenticateWithPassword(currentPassword), newPassword);
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async reauthenticate(password) {
    try {
      await reauthenticateWithPassword(password);
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async uploadProfileImage(userId, file, onProgress) {
    try {
      const task = uploadBytesResumable(
        ref(storage, `avatars/${userId}/${generateUniqueFileName(file.name)}`),
        file,
        { contentType: file.type }
      );
      await new Promise((resolve, reject) =>
        task.on(
          'state_changed',
          (snap) =>
            onProgress?.(
              snap.totalBytes > 0 ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0
            ),
          reject,
          resolve
        )
      );
      const url = await getDownloadURL(task.snapshot.ref);
      await this.updateUserProfile(userId, { photoURL: url });
      // No visible caller; this is the only success feedback.
      toast.success('Profile picture updated!');
      return { success: true, url };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async deleteProfileImage(userId, photoURL) {
    try {
      if (photoURL) {
        try {
          const decoded = decodeURIComponent(new URL(photoURL).pathname.split('/o/')[1] || '');
          if (decoded) await deleteObject(ref(storage, decoded)).catch(() => {});
        } catch {}
      }
      await this.updateUserProfile(userId, { photoURL: null });
      // No visible caller; this is the only success feedback.
      toast.success('Profile picture removed');
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async linkProvider(name) {
    try {
      const result = await linkWithPopup(getCurrentUserOrThrow(), createProvider(name));
      await updateLinkedProvidersInFirestore(result.user);
      return { success: true, user: result.user };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async unlinkProvider(providerId) {
    try {
      const user = getCurrentUserOrThrow();
      const ids = getProviderIds(user);
      if (!ids.includes(providerId))
        throw Object.assign(new Error('Not linked'), { code: 'auth/provider-not-linked' });
      if (ids.length <= 1)
        throw Object.assign(new Error('Cannot unlink last'), {
          code: 'auth/cannot-unlink-last-provider',
        });
      const updated = await unlink(user, providerId);
      await updateLinkedProvidersInFirestore(updated);
      return { success: true, user: updated };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async getLinkedProviders() {
    return getProviderIds(auth.currentUser);
  },

  /**
   * Deletes the current user's account and their Firestore data.
   *
   * Idempotency contract:
   *   1. Fetch `users/{uid}` first. Its presence signals "Firestore cleanup
   *      has not yet completed".
   *   2. If present, delete the dependent documents (resumes, notifications,
   *      sessions, settings, subscriptions) in one pass. The user document is
   *      deleted LAST so that a subsequent retry can detect a partial
   *      completion and skip the cleanup step.
   *   3. Attempt the Firebase Auth deletion. If it fails - most commonly with
   *      `auth/requires-recent-login` for OAuth-only accounts - return
   *      `{ success: false, partial: true }` so the caller can offer a retry.
   *      On retry, `users/{uid}` is missing, so the cleanup is skipped and
   *      only the Auth deletion is attempted.
   *
   * Residual risk (Spark plan, no Cloud Functions):
   *   There is no server-side actor that can delete an Auth account without
   *   the client's own token, and no server-side actor that can clean up
   *   Firestore data after the token is gone. A user who abandons the retry
   *   after step 2 leaves their Auth account behind while their Firestore
   *   data is permanently gone. This is the best achievable on Spark; the
   *   alternative - deleting Auth first - makes the Firestore data orphaned
   *   and unrecoverable to anyone except an admin. The current order keeps
   *   the user's identity, at the cost of the data, which is the safer
   *   default for the account-holder's recovery options (they can sign in
   *   again and start over cleanly).
   */
  async deleteUserAccount(password) {
    try {
      const user = getCurrentUserOrThrow();

      // Pre-flight: password users re-authenticate with their password.
      // OAuth-only users get a fresh ID token (best-effort) - this does not
      // override `requires-recent-login` but does surface other stale-session
      // issues before any destructive work.
      if (hasPasswordProvider(user)) {
        await reauthenticateWithPassword(password);
      } else {
        try {
          await user.getIdToken(true);
        } catch {
          // Ignore - the Auth deletion step below will surface a hard error
          // if the session truly cannot be refreshed.
        }
      }

      const userRef = doc(db, COLLECTIONS.users, user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // First attempt (or an attempt where the cleanup did not complete).
        const [resumes, notifs, sessions] = await Promise.all([
          getDocs(query(collection(db, COLLECTIONS.resumes), where('userId', '==', user.uid))),
          getDocs(
            query(collection(db, COLLECTIONS.notifications), where('userId', '==', user.uid))
          ),
          getDocs(collection(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions)),
        ]);

        // Audit record - written before the destructive step so it survives
        // the Firestore cleanup. On a retry this block is skipped, so the
        // original deletion timestamp is preserved.
        try {
          await setDoc(doc(db, COLLECTIONS.deletedAccounts, user.uid), {
            userId: user.uid,
            email: user.email,
            deletedAt: serverTimestamp(),
            reason: 'user_requested',
          });
        } catch {}

        // Delete everything except the user document.
        await deleteInBatches([
          ...resumes.docs.map((d) => d.ref),
          ...notifs.docs.map((d) => d.ref),
          ...sessions.docs.map((d) => d.ref),
          doc(db, COLLECTIONS.settings, user.uid),
          doc(db, COLLECTIONS.subscriptions, user.uid),
        ]);

        // Delete the user document last. Its presence is the durable signal
        // that Firestore cleanup is still pending; once it is gone, a retry
        // knows the cleanup is complete.
        try {
          await deleteDoc(userRef);
        } catch {
          // Best-effort. If this fails, a retry will still attempt the
          // cleanup - the dependent documents are already gone, so the
          // second cleanup pass is a no-op.
        }
      }
      // Else: retry after a partial failure - nothing left to clean up in
      // Firestore, proceed directly to the Auth deletion.

      safeTrackEvent('account_deleted', { userId: user.uid });
      clearStoredSessionId();
      await firebaseDeleteUser(user);
      return { success: true };
    } catch (e) {
      const code = e?.code;
      // If Auth deletion failed after the Firestore cleanup, mark the
      // response so callers can offer a retry.
      const partial =
        code === 'auth/requires-recent-login' ||
        code === 'auth/user-token-expired' ||
        code === 'auth/network-request-failed';
      return {
        success: false,
        error: getErrorMessage(e),
        code,
        ...(partial ? { partial: true } : {}),
      };
    }
  },

  async getUserData(userId) {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.users, userId));
      return snap.exists()
        ? { success: true, data: snap.data() }
        : { success: false, error: 'User not found' };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async getUserRole(userId) {
    try {
      return (await getDoc(doc(db, COLLECTIONS.users, userId))).data()?.role || 'user';
    } catch {
      return 'user';
    }
  },

  async isUserPremium(userId) {
    try {
      const [userDoc, subDoc] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.users, userId)),
        getDoc(doc(db, COLLECTIONS.subscriptions, userId)),
      ]);
      const role = userDoc.data()?.role;
      const sub = subDoc.exists() ? subDoc.data() : null;
      return (
        role === 'premium' ||
        role === 'admin' ||
        (sub?.status === 'active' && sub?.plan === 'premium')
      );
    } catch {
      return false;
    }
  },

  /**
   * Changes the `role` field of another user document.
   *
   * SECURITY NOTE:
   * The authoritative authorization check for this operation MUST live in
   * Firestore Security Rules (and/or a trusted backend). The client-side
   * guard implemented below is defense-in-depth only - a determined attacker
   * can bypass it by calling the Firestore SDK directly from the console.
   *
   * Firestore rules for `users/{uid}` must therefore enforce that only a
   * caller whose own `users/{callerUid}` document has `role === 'admin'` may
   * update the `role` field of a different user document.
   */
  async updateUserRole(userId, role) {
    try {
      // 1. Require an authenticated caller.
      const caller = getCurrentUserOrThrow();

      // 2. Reject malformed inputs before any network call.
      if (!userId || typeof userId !== 'string') {
        throw Object.assign(new Error('Invalid user id'), { code: 'auth/invalid-user-id' });
      }
      if (!ALLOWED_ROLES.has(role)) {
        throw Object.assign(new Error(`Unsupported role: ${role}`), {
          code: 'auth/invalid-role',
        });
      }

      // 3. Defense-in-depth: block non-admin callers from the client SDK.
      //    The real check lives in Firestore rules - see the docstring above.
      const callerSnap = await getDoc(doc(db, COLLECTIONS.users, caller.uid));
      const callerRole = callerSnap.exists() ? callerSnap.data()?.role : null;
      if (callerRole !== 'admin') {
        throw Object.assign(new Error('Admin access required'), {
          code: 'auth/insufficient-role',
        });
      }

      // 4. Perform the write. Firestore rules are expected to reject this
      //    if the caller is not actually an admin.
      await updateDoc(doc(db, COLLECTIONS.users, userId), {
        role,
        updatedAt: serverTimestamp(),
      });

      safeTrackEvent('role_changed', {
        targetUserId: userId,
        newRole: role,
        changedBy: caller.uid,
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },

  async getIdToken(force = false) {
    try {
      return auth.currentUser ? await firebaseGetIdToken(auth.currentUser, force) : null;
    } catch {
      return null;
    }
  },

  async getIdTokenResult(force = false) {
    try {
      return auth.currentUser ? await firebaseGetIdTokenResult(auth.currentUser, force) : null;
    } catch {
      return null;
    }
  },

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  get currentUser() {
    return auth.currentUser;
  },
  get isAuthenticated() {
    return Boolean(auth.currentUser);
  },

  async refreshUserClaims() {
    try {
      if (auth.currentUser) {
        await firebaseGetIdToken(auth.currentUser, true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Session management (public)
  async createSession(userId) {
    const id = await createSessionRecord(userId);
    return { success: Boolean(id), sessionId: id };
  },
  async getActiveSessions() {
    return getActiveSessions();
  },
  async revokeSession(sessionId) {
    try {
      const user = getCurrentUserOrThrow();
      await deleteDoc(doc(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions, sessionId));
      if (sessionId === getStoredSessionId()) clearStoredSessionId();
      // No visible caller; this is the only success feedback.
      toast.success('Session revoked');
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },
  async revokeAllOtherSessions() {
    try {
      const user = getCurrentUserOrThrow();
      const sessions = await getActiveSessions();
      const currentId = getStoredSessionId();
      await deleteInBatches(
        sessions
          .filter((s) => s.id !== currentId)
          .map((s) => doc(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions, s.id))
      );
      // No visible caller; this is the only success feedback.
      toast.success('All other sessions signed out');
      return { success: true };
    } catch (e) {
      return { success: false, error: getErrorMessage(e), code: e.code };
    }
  },
};

export default authService;
