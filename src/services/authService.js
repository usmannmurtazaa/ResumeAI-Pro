import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export const authService = {
  async signUp(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return userCredential.user;
  },

  async signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async signOut() {
    await signOut(auth);
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  },

  async updateUserProfile(userId, data) {
    const user = auth.currentUser;
    if (user) {
      if (data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }
      if (data.email) {
        await updateEmail(user, data.email);
      }
      if (data.password) {
        await updatePassword(user, data.password);
      }
    }
    
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  async getUserRole(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data()?.role || 'user';
  },

  async deleteUserAccount(userId) {
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
    }
    // Additional cleanup in Firestore would be handled by security rules or cloud functions
  }
};