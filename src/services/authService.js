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
  linkWithCredential,
  unlink,
  getIdToken,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
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
  increment
} from 'firebase/firestore';
import { auth, db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import toast from 'react-hot-toast';

// Error message mapping
const getErrorMessage = (error) => {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked': 'Popups are blocked. Please allow popups for this site.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'This operation is not allowed.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/code-expired': 'Verification code has expired.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/invalid-phone-number': 'Invalid phone number format.',
    'auth/quota-exceeded': 'SMS quota exceeded. Try again later.'
  };
  
  return errorMessages[error.code] || error.message || 'An unexpected error occurred';
};

// Authentication Service
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
        await sendEmailVerification(user);
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
          utmSource: options.utmSource || null
        }
      });
      
      // Log analytics event
      await this.logAnalyticsEvent('sign_up', user.uid, { method: 'email' });
      
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        success: false, 
        error: getErrorMessage(error),
        code: error.code 
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
        updatedAt: serverTimestamp()
      });
      
      // Log analytics event
      await this.logAnalyticsEvent('login', user.uid, { method: 'email' });
      
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: getErrorMessage(error),
        code: error.code 
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
          break;
        case 'twitter':
          provider = new TwitterAuthProvider();
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
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
            uid: user.providerData[0]?.uid
          }
        });
      } else {
        // Update existing user
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
          photoURL: user.photoURL || userDoc.data().photoURL,
          updatedAt: serverTimestamp()
        });
      }
      
      // Log analytics event
      await this.logAnalyticsEvent('login', user.uid, { method: providerName });
      
      return { success: true, user };
    } catch (error) {
      console.error(`${providerName} sign in error:`, error);
      return { 
        success: false, 
        error: getErrorMessage(error),
        code: error.code 
      };
    }
  },

  // ============================================
  // PHONE AUTHENTICATION
  // ============================================
  
  async signInWithPhone(phoneNumber, recaptchaVerifier) {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return { success: true, confirmationResult };
    } catch (error) {
      console.error('Phone sign in error:', error);
      return { 
        success: false, 
        error: getErrorMessage(error),
        code: error.code 
      };
    }
  },

  async confirmPhoneSignIn(confirmationResult, code) {
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      
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
          authProvider: 'phone'
        });
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('Phone confirmation error:', error);
      return { 
        success: false, 
        error: getErrorMessage(error),
        code: error.code 
      };
    }
  },

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================
  
  async signOut() {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogout: serverTimestamp()
        });
      }
      
      await signOut(auth);
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
        handleCodeInApp: false
      });
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async confirmPasswordReset(oobCode, newPassword) {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Confirm password reset error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async sendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      await sendEmailVerification(user);
      return { success: true };
    } catch (error) {
      console.error('Send verification error:', error);
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
        updatedAt: serverTimestamp()
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
      await sendEmailVerification(user);
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        emailVerified: false,
        updatedAt: serverTimestamp()
      });
      
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
      const storageRef = ref(storage, `avatars/${userId}/${Date.now()}-${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file);
      
      if (onProgress) {
        onProgress(100);
      }
      
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      // Update user profile with new photo URL
      await this.updateUserProfile(userId, { photoURL: downloadURL });
      
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload profile image error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async deleteProfileImage(userId, photoURL) {
    try {
      if (photoURL) {
        const fileRef = ref(storage, photoURL);
        await deleteObject(fileRef);
      }
      
      await this.updateUserProfile(userId, { photoURL: null });
      
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
        case 'twitter':
          provider = new TwitterAuthProvider();
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }
      
      const result = await linkWithCredential(user, provider);
      
      // Update user document
      await updateDoc(doc(db, 'users', user.uid), {
        [`linkedProviders.${providerName}`]: true,
        updatedAt: serverTimestamp()
      });
      
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
      
      return { success: true };
    } catch (error) {
      console.error('Unlink provider error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  // ============================================
  // ACCOUNT DELETION
  // ============================================
  
  async deleteUserAccount(userId, password) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      // Re-authenticate if password provided
      if (password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }
      
      // Delete user's resumes
      const resumesQuery = query(
        collection(db, 'resumes'),
        where('userId', '==', userId)
      );
      const resumesSnapshot = await getDocs(resumesQuery);
      
      const batch = writeBatch(db);
      resumesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete user document
      batch.delete(doc(db, 'users', userId));
      
      // Delete user's notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      notificationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      
      // Delete Firebase Auth user
      await deleteUser(user);
      
      // Log deletion
      await setDoc(doc(db, 'deletedAccounts', userId), {
        userId,
        email: user.email,
        deletedAt: serverTimestamp(),
        reason: 'user_requested'
      });
      
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

  async logAnalyticsEvent(eventName, userId, params = {}) {
    try {
      await setDoc(doc(db, 'analytics', `${userId}_${Date.now()}`), {
        event: eventName,
        userId,
        ...params,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });
    } catch (error) {
      console.error('Log analytics error:', error);
    }
  },

  async updateUserStats(userId, stats) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...stats,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update user stats error:', error);
      return { success: false };
    }
  }
};

export default authService;