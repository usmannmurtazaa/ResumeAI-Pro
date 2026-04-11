import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

export const resumeService = {
  async createResume(userId, resumeData) {
    const resumeRef = doc(collection(db, 'resumes'));
    const data = {
      ...resumeData,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    await setDoc(resumeRef, data);
    return { id: resumeRef.id, ...data };
  },

  async getResume(resumeId) {
    const resumeDoc = await getDoc(doc(db, 'resumes', resumeId));
    if (resumeDoc.exists()) {
      return { id: resumeDoc.id, ...resumeDoc.data() };
    }
    return null;
  },

  async getUserResumes(userId) {
    const q = query(
      collection(db, 'resumes'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async updateResume(resumeId, resumeData) {
    const resumeRef = doc(db, 'resumes', resumeId);
    await updateDoc(resumeRef, {
      ...resumeData,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteResume(resumeId) {
    await deleteDoc(doc(db, 'resumes', resumeId));
  },

  async duplicateResume(resumeId, userId) {
    const original = await this.getResume(resumeId);
    if (original) {
      const { id, ...resumeData } = original;
      return this.createResume(userId, {
        ...resumeData,
        name: `${resumeData.name} (Copy)`
      });
    }
    return null;
  },

  async getRecentResumes(userId, limitCount = 5) {
    const q = query(
      collection(db, 'resumes'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getAllResumes() {
    const querySnapshot = await getDocs(collection(db, 'resumes'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};