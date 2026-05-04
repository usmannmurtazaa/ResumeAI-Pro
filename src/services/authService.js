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
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit,
  orderBy, query, serverTimestamp, setDoc, updateDoc,
  where, writeBatch,
} from 'firebase/firestore';
import {
  deleteObject, getDownloadURL, ref, uploadBytesResumable,
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

const SESSION_STORAGE_KEY = 'resumeai-pro.current-session-id';
const BATCH_CHUNK_SIZE = 400;
const MAX_SESSIONS_DISPLAY = 25;

const RESTRICTED_PROFILE_FIELDS = new Set([
  'role', 'status', 'emailVerified', 'authProvider',
  'createdAt', 'updatedAt', 'lastLogin', 'lastLogout',
  'metadata', 'linkedProviders', 'providerData', 'userId', 'uid',
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
  'auth/account-exists-with-different-credential': 'Account exists with a different sign-in method.',
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
};

// ── Utilities ──────────────────────────────────────────────────────────────

const getErrorMessage = (error) => {
  const code = typeof error === 'string' ? error : error?.code;
  return ERROR_MESSAGES[code] || error?.message || 'An unexpected error occurred.';
};

const safeTrackEvent = (eventName, params = {}) => {
  try { logAnalyticsEvent(eventName, params); } catch {}
};

const buildActionUrl = (path) =>
  typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const getCurrentUserOrThrow = () => {
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('No user logged in'), { code: 'auth/no-current-user' });
  return user;
};

const hasPasswordProvider = (user) =>
  user?.providerData?.some(p => p.providerId === 'password');

const getProviderIds = (user) =>
  user?.providerData?.map(p => p.providerId).filter(Boolean) || [];

const buildLinkedProviderMap = (ids = []) =>
  ids.reduce((acc, id) => ((acc[id] = true), acc), {});

const sanitizeProfileData = (data = {}) =>
  Object.fromEntries(Object.entries(data).filter(([k, v]) => !RESTRICTED_PROFILE_FIELDS.has(k) && v !== undefined));

const generateUniqueFileName = (name) => {
  const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
};

// ── Session Storage ────────────────────────────────────────────────────────

const getSessionStore = () => {
  try { return window.sessionStorage; } catch { return null; }
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
      p.addScope('profile'); p.addScope('email'); return p;
    }
    case 'github': {
      const p = new GithubAuthProvider();
      p.addScope('user:email'); p.addScope('read:user'); return p;
    }
    case 'facebook': {
      const p = new FacebookAuthProvider();
      p.addScope('email'); p.addScope('public_profile'); return p;
    }
    case 'microsoft': {
      const p = new OAuthProvider('microsoft.com');
      p.addScope('User.Read'); p.addScope('email');
      p.setCustomParameters({ prompt: 'select_account' }); return p;
    }
    case 'twitter': return new TwitterAuthProvider();
    case 'apple': {
      const p = new OAuthProvider('apple.com');
      p.addScope('email'); p.addScope('name'); return p;
    }
    default: throw Object.assign(new Error(`Unsupported: ${name}`), { code: 'auth/unsupported-provider' });
  }
};

// ── Batch Delete ───────────────────────────────────────────────────────────

const deleteInBatches = async (refs, chunkSize = BATCH_CHUNK_SIZE) => {
  const unique = Array.from(new Map(refs.filter(Boolean).map(r => [r.path, r])).values());
  for (let i = 0; i < unique.length; i += chunkSize) {
    const batch = writeBatch(db);
    unique.slice(i, i + chunkSize).forEach(r => batch.delete(r));
    await batch.commit();
  }
};

// ── Session Management (Internal) ──────────────────────────────────────────

const createSessionRecord = async (userId) => {
  try {
    const ref = doc(collection(db, COLLECTIONS.users, userId, COLLECTIONS.sessions));
    await setDoc(ref, {
      userId, createdAt: serverTimestamp(), lastActive: serverTimestamp(),
      userAgent: navigator?.userAgent || null,
      platform: navigator?.platform || null,
      language: navigator?.language || null,
    });
    storeSessionId(ref.id);
    return ref.id;
  } catch (e) { console.error('Create session error:', e); return null; }
};

const getActiveSessions = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    const q = query(collection(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions), orderBy('createdAt', 'desc'), limit(MAX_SESSIONS_DISPLAY));
    return (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error('Get sessions error:', e); return []; }
};

const deleteCurrentSessionRecord = async (userId) => {
  const id = getStoredSessionId();
  if (!id) return;
  try { await deleteDoc(doc(db, COLLECTIONS.users, userId, COLLECTIONS.sessions, id)); } catch {}
  clearStoredSessionId();
};

// ── Reauthentication ───────────────────────────────────────────────────────

const reauthenticateWithPassword = async (password) => {
  const user = getCurrentUserOrThrow();
  if (!hasPasswordProvider(user) || !user.email) {
    throw Object.assign(new Error('Password auth not available'), { code: 'auth/no-password-provider' });
  }
  if (!password) throw Object.assign(new Error('Password required'), { code: 'auth/missing-password' });
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  return user;
};

// ── User Doc Sync ──────────────────────────────────────────────────────────

const syncUserDocAfterProviderAuth = async (user, providerName, isNewUser) => {
  const ref = doc(db, COLLECTIONS.users, user.uid);
  const existing = await getDoc(ref);
  const base = {
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
  if (!existing.exists()) {
    await setDoc(ref, { ...base, role: 'user', createdAt: serverTimestamp() });
    return true;
  }
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
      await updateProfile(user, { displayName: displayName?.trim() || normalizeEmail(email).split('@')[0], photoURL: options.photoURL || null });
      if (options.sendVerification !== false) {
        await sendEmailVerification(user, { url: buildActionUrl('/verify-email'), handleCodeInApp: true });
      }
      await setDoc(doc(db, COLLECTIONS.users, user.uid), {
        email: normalizeEmail(email),
        displayName: displayName?.trim() || normalizeEmail(email).split('@')[0],
        photoURL: options.photoURL || null,
        phoneNumber: options.phoneNumber || null,
        role: 'user', status: 'active', emailVerified: false,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastLogin: serverTimestamp(),
        authProvider: 'password', linkedProviders: { password: true },
        metadata: { signUpMethod: 'email', referrer: options.referrer || null, utmSource: options.utmSource || null, signUpSource: options.signUpSource || 'web' },
      });
      await createSessionRecord(user.uid);
      safeTrackEvent('sign_up', { method: 'email', userId: user.uid });
      toast.success('Account created! Please verify your email.');
      return { success: true, user };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async signIn(email, password, rememberMe = true) {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      await updateDoc(doc(db, COLLECTIONS.users, cred.user.uid), { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() });
      await createSessionRecord(cred.user.uid);
      safeTrackEvent('login', { method: 'email', userId: cred.user.uid });
      toast.success('Welcome back!');
      return { success: true, user: cred.user };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async signInWithProvider(name) {
    try {
      const result = await signInWithPopup(auth, createProvider(name));
      const isNew = Boolean(getAdditionalUserInfo(result)?.isNewUser);
      await syncUserDocAfterProviderAuth(result.user, name.toLowerCase(), isNew);
      await createSessionRecord(result.user.uid);
      safeTrackEvent(isNew ? 'sign_up' : 'login', { method: name.toLowerCase(), userId: result.user.uid });
      toast.success(isNew ? 'Account created! Welcome!' : `Signed in with ${name}!`);
      return { success: true, user: result.user, isNewUser: isNew };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async signInWithPhone(phone, recaptcha) {
    try {
      if (!recaptcha) throw Object.assign(new Error('Recaptcha required'), { code: 'auth/missing-recaptcha' });
      const confirmation = await signInWithPhoneNumber(auth, phone.trim(), recaptcha);
      toast.success('Verification code sent!');
      return { success: true, confirmationResult: confirmation };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async confirmPhoneSignIn(confirmation, code) {
    try {
      const result = await confirmation.confirm(code);
      const user = result.user;
      const isNew = Boolean(getAdditionalUserInfo(result)?.isNewUser);
      const ref = doc(db, COLLECTIONS.users, user.uid);
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        await setDoc(ref, {
          phoneNumber: user.phoneNumber, displayName: `User${user.uid.slice(0, 6)}`,
          role: 'user', status: 'active', phoneVerified: true,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastLogin: serverTimestamp(),
          authProvider: 'phone', linkedProviders: { phone: true },
        });
      } else {
        await updateDoc(ref, { phoneNumber: user.phoneNumber || existing.data()?.phoneNumber, phoneVerified: true, lastLogin: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      await createSessionRecord(user.uid);
      safeTrackEvent(isNew ? 'sign_up' : 'login', { method: 'phone', userId: user.uid });
      toast.success(isNew ? 'Account created!' : 'Phone verified!');
      return { success: true, user, isNewUser: isNew };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async signOut() {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteCurrentSessionRecord(user.uid);
        await updateDoc(doc(db, COLLECTIONS.users, user.uid), { lastLogout: serverTimestamp(), updatedAt: serverTimestamp() }).catch(() => {});
      }
      await firebaseSignOut(auth);
      clearStoredSessionId();
      toast.success('Logged out');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async resetPassword(email) {
    try { await sendPasswordResetEmail(auth, normalizeEmail(email), { url: buildActionUrl('/login'), handleCodeInApp: false }); } catch {}
    toast.success('If an account exists, a reset email has been sent.');
    return { success: true };
  },

  async confirmPasswordReset(oobCode, newPassword) {
    try {
      await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
      toast.success('Password reset! You can now sign in.');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async sendVerificationEmail() {
    try {
      await sendEmailVerification(getCurrentUserOrThrow(), { url: buildActionUrl('/verify-email'), handleCodeInApp: true });
      toast.success('Verification email sent!');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async verifyEmail(oobCode) {
    try {
      const info = await checkActionCode(auth, oobCode);
      await applyActionCode(auth, oobCode);
      const email = info?.data?.email;
      if (email) {
        const q = query(collection(db, COLLECTIONS.users), where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.update(d.ref, { emailVerified: true, updatedAt: serverTimestamp() }));
          await batch.commit();
        }
      } else if (auth.currentUser) {
        await updateDoc(doc(db, COLLECTIONS.users, auth.currentUser.uid), { emailVerified: true, updatedAt: serverTimestamp() });
      }
      toast.success('Email verified!');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async updateUserProfile(userId, data) {
    try {
      const user = auth.currentUser;
      const sanitized = sanitizeProfileData(data);
      const authUpdates = {};
      if (user?.uid === userId) {
        if (sanitized.displayName !== undefined && sanitized.displayName !== user.displayName) authUpdates.displayName = sanitized.displayName;
        if (sanitized.photoURL !== undefined && sanitized.photoURL !== user.photoURL) authUpdates.photoURL = sanitized.photoURL;
        if (Object.keys(authUpdates).length) await updateProfile(user, authUpdates);
      }
      await updateDoc(doc(db, COLLECTIONS.users, userId), { ...sanitized, ...authUpdates, updatedAt: serverTimestamp() });
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async updateUserEmail(newEmail, password) {
    try {
      const user = await reauthenticateWithPassword(password);
      await updateEmail(user, normalizeEmail(newEmail));
      await sendEmailVerification(user, { url: buildActionUrl('/verify-email'), handleCodeInApp: true });
      await updateDoc(doc(db, COLLECTIONS.users, user.uid), { email: normalizeEmail(newEmail), emailVerified: false, updatedAt: serverTimestamp() });
      toast.success('Email updated! Verify your new email.');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async updateUserPassword(currentPassword, newPassword) {
    try {
      await updatePassword(await reauthenticateWithPassword(currentPassword), newPassword);
      toast.success('Password updated');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async reauthenticate(password) {
    try { await reauthenticateWithPassword(password); return { success: true }; }
    catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async uploadProfileImage(userId, file, onProgress) {
    try {
      const task = uploadBytesResumable(ref(storage, `avatars/${userId}/${generateUniqueFileName(file.name)}`), file, { contentType: file.type });
      await new Promise((resolve, reject) => task.on('state_changed', snap => onProgress?.(snap.totalBytes > 0 ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0), reject, resolve));
      const url = await getDownloadURL(task.snapshot.ref);
      await this.updateUserProfile(userId, { photoURL: url });
      toast.success('Profile picture updated!');
      return { success: true, url };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
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
      toast.success('Profile picture removed');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async linkProvider(name) {
    try {
      const result = await linkWithPopup(getCurrentUserOrThrow(), createProvider(name));
      await updateLinkedProvidersInFirestore(result.user);
      toast.success(`${name} linked!`);
      return { success: true, user: result.user };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async unlinkProvider(providerId) {
    try {
      const user = getCurrentUserOrThrow();
      const ids = getProviderIds(user);
      if (!ids.includes(providerId)) throw Object.assign(new Error('Not linked'), { code: 'auth/provider-not-linked' });
      if (ids.length <= 1) throw Object.assign(new Error('Cannot unlink last'), { code: 'auth/cannot-unlink-last-provider' });
      const updated = await unlink(user, providerId);
      await updateLinkedProvidersInFirestore(updated);
      toast.success('Unlinked');
      return { success: true, user: updated };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async getLinkedProviders() { return getProviderIds(auth.currentUser); },

  async deleteUserAccount(password) {
    try {
      const user = getCurrentUserOrThrow();
      if (hasPasswordProvider(user)) await reauthenticateWithPassword(password);

      const [resumes, notifs, sessions] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.resumes), where('userId', '==', user.uid))),
        getDocs(query(collection(db, COLLECTIONS.notifications), where('userId', '==', user.uid))),
        getDocs(collection(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions)),
      ]);

      try { await setDoc(doc(db, COLLECTIONS.deletedAccounts, user.uid), { userId: user.uid, email: user.email, deletedAt: serverTimestamp(), reason: 'user_requested' }); } catch {}

      await deleteInBatches([
        ...resumes.docs.map(d => d.ref), ...notifs.docs.map(d => d.ref), ...sessions.docs.map(d => d.ref),
        doc(db, COLLECTIONS.settings, user.uid), doc(db, COLLECTIONS.subscriptions, user.uid), doc(db, COLLECTIONS.users, user.uid),
      ]);
      safeTrackEvent('account_deleted', { userId: user.uid });
      clearStoredSessionId();
      await firebaseDeleteUser(user);
      toast.success('Account deleted');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async getUserData(userId) {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.users, userId));
      return snap.exists() ? { success: true, data: snap.data() } : { success: false, error: 'User not found' };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async getUserRole(userId) {
    try { return (await getDoc(doc(db, COLLECTIONS.users, userId))).data()?.role || 'user'; } catch { return 'user'; }
  },

  async isUserPremium(userId) {
    try {
      const [userDoc, subDoc] = await Promise.all([getDoc(doc(db, COLLECTIONS.users, userId)), getDoc(doc(db, COLLECTIONS.subscriptions, userId))]);
      const role = userDoc.data()?.role;
      const sub = subDoc.exists() ? subDoc.data() : null;
      return role === 'premium' || role === 'admin' || (sub?.status === 'active' && sub?.plan === 'premium');
    } catch { return false; }
  },

  async updateUserRole(userId, role) {
    try {
      await updateDoc(doc(db, COLLECTIONS.users, userId), { role: ALLOWED_ROLES.has(role) ? role : 'user', updatedAt: serverTimestamp() });
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },

  async getIdToken(force = false) {
    try { return auth.currentUser ? await firebaseGetIdToken(auth.currentUser, force) : null; } catch { return null; }
  },

  async getIdTokenResult(force = false) {
    try { return auth.currentUser ? await firebaseGetIdTokenResult(auth.currentUser, force) : null; } catch { return null; }
  },

  onAuthStateChanged(callback) { return onAuthStateChanged(auth, callback); },

  get currentUser() { return auth.currentUser; },
  get isAuthenticated() { return Boolean(auth.currentUser); },

  async refreshUserClaims() {
    try { if (auth.currentUser) { await firebaseGetIdToken(auth.currentUser, true); return true; } return false; } catch { return false; }
  },

  // Session management (public)
  async createSession(userId) {
    const id = await createSessionRecord(userId);
    return { success: Boolean(id), sessionId: id };
  },
  async getActiveSessions() { return getActiveSessions(); },
  async revokeSession(sessionId) {
    try {
      const user = getCurrentUserOrThrow();
      await deleteDoc(doc(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions, sessionId));
      if (sessionId === getStoredSessionId()) clearStoredSessionId();
      toast.success('Session revoked');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },
  async revokeAllOtherSessions() {
    try {
      const user = getCurrentUserOrThrow();
      const sessions = await getActiveSessions();
      const currentId = getStoredSessionId();
      await deleteInBatches(sessions.filter(s => s.id !== currentId).map(s => doc(db, COLLECTIONS.users, user.uid, COLLECTIONS.sessions, s.id)));
      toast.success('All other sessions signed out');
      return { success: true };
    } catch (e) { return { success: false, error: getErrorMessage(e), code: e.code }; }
  },
};

export default authService;