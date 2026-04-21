import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  sendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  FacebookAuthProvider,
  OAuthProvider,
  linkWithCredential,
  unlink,
  getIdToken,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getMultiFactorResolver,
  PhoneAuthProvider as MFAPhoneAuthProvider,
  PhoneMultiFactorGenerator,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
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
  where,
  getDocs,
  writeBatch,
  increment,
  limit,
} from 'firebase/firestore';
import { auth, db, storage, logAnalyticsEvent } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import toast from 'react-hot-toast';

// ============================================
// ERROR MESSAGE MAPPING
// ============================================

const getErrorMessage = (error) => {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 8 characters with letters and numbers.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked': 'Popups are blocked. Please allow popups for this site.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'This operation is not allowed.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/code-expired': 'Verification code has expired.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/invalid-phone-number': 'Invalid phone number format.',
    'auth/quota-exceeded': 'SMS quota exceeded. Try again later.',
    'auth/invalid-action-code': 'The action code is invalid or expired.',
    'auth/user-token-expired': 'Your session has expired. Please sign in again.',
    'auth/web-storage-unsupported': 'Web storage is not supported or disabled.',
    'auth/missing-android-pkg-name': 'Android package name is required.',
    'auth/missing-ios-bundle-id': 'iOS bundle ID is required.',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
    'auth/cancelled-popup-request': 'Another popup is already open.',
    'auth/internal-error': 'An internal error occurred. Please try again.',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred';
};

// ============================================
// AUTHENTICATION SERVICE
// ============================================

export const authService = {
  // ============================================
  // EMAIL/PASSWORD AUTHENTICATION
  // ============================================

  async signUp(email, password, displayName, options = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Send email verification
      if (options.sendVerification !== false) {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        });
      }

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        photoURL: options.photoURL || null,
        phoneNumber: options.phoneNumber || null,
        role: options.role || 'user',
        status: 'active',
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        authProvider: 'password',
        metadata: {
          signUpMethod: 'email',
          referrer: options.referrer || null,
          utmSource: options.utmSource || null,
          signUpSource: options.signUpSource || 'web',
        },
      });

      // Log analytics event
      logAnalyticsEvent('sign_up', {
        method: 'email',
        userId: user.uid,
      });

      toast.success('Account created successfully! Please verify your email.');
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
        code: error.code,
      };
    }
  },

  async signIn(email, password, rememberMe = true) {
    try {
      // Set persistence
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
        'metadata.lastLoginIp': null, // Would be set server-side
      });

      // Create session record
      await this.createSessionRecord(user.uid);

      // Log analytics event
      logAnalyticsEvent('login', {
        method: 'email',
        userId: user.uid,
      });

      toast.success('Welcome back!');
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
        code: error.code,
      };
    }
  },

  // ============================================
  // SOCIAL AUTHENTICATION
  // ============================================

  async signInWithProvider(providerName) {
    try {
      let provider;

      switch (providerName.toLowerCase()) {
        case 'google':
          provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          provider.addScope('profile');
          provider.addScope('email');
          break;
        case 'github':
          provider = new GithubAuthProvider();
          provider.addScope('user:email');
          provider.addScope('read:user');
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
          provider.setCustomParameters({
            prompt: 'select_account',
          });
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
      const user = result.user;
      const isNewUser = result._tokenResponse?.isNewUser || false;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL,
          role: 'user',
          status: 'active',
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: providerName.toLowerCase(),
          providerData: {
            providerId: user.providerData[0]?.providerId,
            uid: user.providerData[0]?.uid,
          },
        });

        if (isNewUser) {
          toast.success('Account created successfully! Welcome aboard!');
        }
      } else {
        // Update existing user
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
          photoURL: user.photoURL || userDoc.data().photoURL,
          updatedAt: serverTimestamp(),
        });
      }

      // Create session record
      await this.createSessionRecord(user.uid);

      // Log analytics event
      logAnalyticsEvent(isNewUser ? 'sign_up' : 'login', {
        method: providerName,
        userId: user.uid,
      });

      toast.success(`Successfully signed in with ${providerName}!`);
      return { success: true, user, isNewUser };
    } catch (error) {
      console.error(`${providerName} sign in error:`, error);
      return {
        success: false,
        error: getErrorMessage(error),
        code: error.code,
      };
    }
  },

  // ============================================
  // PHONE AUTHENTICATION
  // ============================================

  async signInWithPhone(phoneNumber, recaptchaVerifier) {
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );
      toast.success('Verification code sent!');
      return { success: true, confirmationResult };
    } catch (error) {
      console.error('Phone sign in error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
        code: error.code,
      };
    }
  },

  async confirmPhoneSignIn(confirmationResult, code) {
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      const isNewUser = result._tokenResponse?.isNewUser || false;

      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          phoneNumber: user.phoneNumber,
          displayName: `User${user.uid.slice(0, 6)}`,
          role: 'user',
          status: 'active',
          phoneVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: 'phone',
        });
      }

      // Create session record
      await this.createSessionRecord(user.uid);

      // Log analytics event
      logAnalyticsEvent(isNewUser ? 'sign_up' : 'login', {
        method: 'phone',
        userId: user.uid,
      });

      toast.success(isNewUser ? 'Account created!' : 'Phone verified!');
      return { success: true, user, isNewUser };
    } catch (error) {
      console.error('Phone confirmation error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
        code: error.code,
      };
    }
  },

  // ============================================
  // MFA (Multi-Factor Authentication)
  // ============================================

  async enrollMFA(phoneNumber) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const session = await user.multiFactor.getSession();
      const phoneOpts = {
        phoneNumber,
        session,
      };

      const mfaProvider = new PhoneAuthProvider(auth);
      const verificationId = await mfaProvider.verifyPhoneNumber(
        phoneOpts,
        window.recaptchaVerifier
      );

      return { success: true, verificationId };
    } catch (error) {
      console.error('MFA enrollment error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async verifyMFAEnrollment(verificationId, verificationCode) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      await user.multiFactor.enroll(multiFactorAssertion, 'Phone Number');
      
      toast.success('Two-factor authentication enabled!');
      return { success: true };
    } catch (error) {
      console.error('MFA verification error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async unenrollMFA(enrollmentId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      await user.multiFactor.unenroll(enrollmentId);
      toast.success('Two-factor authentication disabled');
      return { success: true };
    } catch (error) {
      console.error('MFA unenroll error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getMFAEnrollments() {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      return user.multiFactor.enrolledFactors || [];
    } catch (error) {
      console.error('Get MFA enrollments error:', error);
      return [];
    }
  },

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async createSessionRecord(userId) {
    try {
      const sessionData = {
        userId,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        ip: null, // Would be set server-side
      };

      await setDoc(doc(collection(db, 'users', userId, 'sessions')), sessionData);
    } catch (error) {
      console.error('Create session error:', error);
    }
  },

  async getActiveSessions() {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const sessionsRef = collection(db, 'users', user.uid, 'sessions');
      const q = query(sessionsRef, orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Get sessions error:', error);
      return [];
    }
  },

  async revokeSession(sessionId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      await deleteDoc(doc(db, 'users', user.uid, 'sessions', sessionId));
      toast.success('Session revoked');
      return { success: true };
    } catch (error) {
      console.error('Revoke session error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async revokeAllOtherSessions() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const sessions = await this.getActiveSessions();
      const batch = writeBatch(db);
      
      // Delete all sessions except the current one (most recent)
      sessions.slice(1).forEach((session) => {
        batch.delete(doc(db, 'users', user.uid, 'sessions', session.id));
      });

      await batch.commit();
      toast.success('All other sessions signed out');
      return { success: true };
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================

  async signOut() {
    try {
      const user = auth.currentUser;
      if (user) {
        // Delete current session
        const sessions = await this.getActiveSessions();
        if (sessions.length > 0) {
          await deleteDoc(doc(db, 'users', user.uid, 'sessions', sessions[0].id));
        }

        await updateDoc(doc(db, 'users', user.uid), {
          lastLogout: serverTimestamp(),
        });
      }

      await signOut(auth);
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      // Always return success to prevent email enumeration
      toast.success('If an account exists, a reset email has been sent.');
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      // Still return success to prevent email enumeration
      toast.success('If an account exists, a reset email has been sent.');
      return { success: true };
    }
  },

  async confirmPasswordReset(oobCode, newPassword) {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast.success('Password reset successfully! You can now sign in.');
      return { success: true };
    } catch (error) {
      console.error('Confirm password reset error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async verifyPasswordResetCode(oobCode) {
    try {
      const email = await verifyPasswordResetCode(auth, oobCode);
      return { success: true, email };
    } catch (error) {
      console.error('Verify reset code error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async sendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });
      toast.success('Verification email sent! Check your inbox.');
      return { success: true };
    } catch (error) {
      console.error('Send verification error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async verifyEmail(oobCode) {
    try {
      await applyActionCode(auth, oobCode);
      
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          emailVerified: true,
          updatedAt: serverTimestamp(),
        });
      }
      
      toast.success('Email verified successfully!');
      return { success: true };
    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async checkActionCodeValidity(oobCode) {
    try {
      const info = await checkActionCode(auth, oobCode);
      return {
        success: true,
        operation: info.operation,
        email: info.data.email,
        fromEmail: info.data.fromEmail,
      };
    } catch (error) {
      console.error('Check action code error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  async updateUserProfile(userId, data) {
    try {
      const user = auth.currentUser;
      const updates = {};

      if (user) {
        if (data.displayName && data.displayName !== user.displayName) {
          await updateProfile(user, { displayName: data.displayName });
          updates.displayName = data.displayName;
        }

        if (data.photoURL && data.photoURL !== user.photoURL) {
          await updateProfile(user, { photoURL: data.photoURL });
          updates.photoURL = data.photoURL;
        }
      }

      // Update Firestore document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async updateUserEmail(newEmail, password) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, newEmail);
      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        emailVerified: false,
        updatedAt: serverTimestamp(),
      });

      toast.success('Email updated! Please verify your new email.');
      return { success: true };
    } catch (error) {
      console.error('Update email error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async updateUserPassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      toast.success('Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async reauthenticate(password) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      return { success: true };
    } catch (error) {
      console.error('Reauthentication error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // ============================================
  // PROFILE IMAGE MANAGEMENT
  // ============================================

  async uploadProfileImage(userId, file, onProgress) {
    try {
      // Compress image if needed (client-side would use browser-image-compression)
      const storageRef = ref(storage, `avatars/${userId}/${Date.now()}-${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file);

      if (onProgress) {
        onProgress(100);
      }

      const downloadURL = await getDownloadURL(uploadTask.ref);

      // Update user profile with new photo URL
      await this.updateUserProfile(userId, { photoURL: downloadURL });

      toast.success('Profile picture updated!');
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload profile image error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async deleteProfileImage(userId, photoURL) {
    try {
      if (photoURL && photoURL.includes('firebasestorage')) {
        const fileRef = ref(storage, photoURL);
        await deleteObject(fileRef);
      }

      await this.updateUserProfile(userId, { photoURL: null });

      toast.success('Profile picture removed');
      return { success: true };
    } catch (error) {
      console.error('Delete profile image error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // ============================================
  // ACCOUNT LINKING
  // ============================================

  async linkProvider(providerName) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      let provider;
      switch (providerName.toLowerCase()) {
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
        case 'twitter':
          provider = new TwitterAuthProvider();
          break;
        case 'apple':
          provider = new OAuthProvider('apple.com');
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      const result = await linkWithCredential(user, provider);

      // Update user document
      await updateDoc(doc(db, 'users', user.uid), {
        [`linkedProviders.${providerName}`]: true,
        updatedAt: serverTimestamp(),
      });

      toast.success(`${providerName} account linked successfully`);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Link provider error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async unlinkProvider(providerId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      await unlink(user, providerId);

      toast.success('Account unlinked successfully');
      return { success: true };
    } catch (error) {
      console.error('Unlink provider error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getLinkedProviders() {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      return user.providerData.map((p) => p.providerId);
    } catch (error) {
      console.error('Get linked providers error:', error);
      return [];
    }
  },

  // ============================================
  // ACCOUNT DELETION
  // ============================================

  async deleteUserAccount(userId, password) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Re-authenticate if password provided (for email/password users)
      if (password && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // Delete user's resumes
      const resumesQuery = query(collection(db, 'resumes'), where('userId', '==', userId));
      const resumesSnapshot = await getDocs(resumesQuery);

      const batch = writeBatch(db);
      resumesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete user's notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      notificationsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete user's sessions
      const sessionsQuery = query(collection(db, 'users', userId, 'sessions'));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      sessionsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete user's settings
      const settingsRef = doc(db, 'settings', userId);
      batch.delete(settingsRef);

      // Delete user document
      batch.delete(doc(db, 'users', userId));

      await batch.commit();

      // Delete Firebase Auth user
      await deleteUser(user);

      // Log deletion
      await setDoc(doc(db, 'deletedAccounts', userId), {
        userId,
        email: user.email,
        deletedAt: serverTimestamp(),
        reason: 'user_requested',
        provider: user.providerData[0]?.providerId || 'password',
      });

      logAnalyticsEvent('account_deleted', { userId });
      toast.success('Account deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // ============================================
  // USER DATA & ROLES
  // ============================================

  async getUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Get user data error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getUserRole(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.data()?.role || 'user';
    } catch (error) {
      console.error('Get user role error:', error);
      return 'user';
    }
  },

  async isUserPremium(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      return userData?.role === 'premium' || userData?.role === 'admin';
    } catch (error) {
      return false;
    }
  },

  async updateUserRole(userId, role) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Update user role error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  async getIdToken(forceRefresh = false) {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await getIdToken(user, forceRefresh);
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  },

  async getIdTokenResult(forceRefresh = false) {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await getIdTokenResult(user, forceRefresh);
    } catch (error) {
      console.error('Get token result error:', error);
      return null;
    }
  },

  // ============================================
  // UTILITIES
  // ============================================

  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  isAuthenticated() {
    return !!auth.currentUser;
  },

  async refreshUserClaims() {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      
      await user.getIdToken(true);
      return true;
    } catch (error) {
      console.error('Refresh claims error:', error);
      return false;
    }
  },
};

export default authService;