import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { calculateATSScore } from '../utils/atsKeywords';
import toast from 'react-hot-toast';

const ResumeContext = createContext(null);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

// Alias for backward compatibility
export const useResumeContext = useResume;

export const ResumeProvider = ({ children }) => {
  const { user, isPremium } = useAuth();
  const { notify } = useNotifications();
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    avgScore: 0,
    totalDownloads: 0
  });

  // Real-time resumes subscription
  useEffect(() => {
    if (!user) {
      setResumes([]);
      setCurrentResume(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'resumes'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const resumeData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        }));
        
        setResumes(resumeData);
        calculateStats(resumeData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching resumes:', err);
        setError(err);
        setLoading(false);
        toast.error('Failed to load resumes');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Calculate resume statistics
  const calculateStats = (resumeData) => {
    const completed = resumeData.filter(r => r.status === 'completed' || r.atsScore >= 80).length;
    const scores = resumeData.map(r => r.atsScore || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const totalDownloads = resumeData.reduce((sum, r) => sum + (r.downloadCount || 0), 0);

    setStats({
      total: resumeData.length,
      completed,
      inProgress: resumeData.length - completed,
      avgScore,
      totalDownloads,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0
    });
  };

  // Check if user can create more resumes
  const canCreateResume = useMemo(() => {
    if (!user) return false;
    if (isPremium) return true;
    
    const FREE_RESUME_LIMIT = 1;
    return resumes.length < FREE_RESUME_LIMIT;
  }, [user, isPremium, resumes.length]);

  // Create a new resume
  const createResume = useCallback(async (data = {}) => {
    if (!user) throw new Error('User not authenticated');
    
    if (!canCreateResume) {
      toast.error('Free plan limited to 1 resume. Upgrade to Pro for unlimited resumes!');
      throw new Error('Resume limit reached');
    }

    try {
      const newResume = {
        userId: user.uid,
        name: data.name || 'Untitled Resume',
        template: data.template || 'modern',
        data: data.data || {},
        status: 'draft',
        atsScore: 0,
        downloadCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'resumes'), newResume);
      
      const createdResume = {
        id: docRef.id,
        ...newResume,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create notification
      await notify?.resumeCreated?.(newResume.name) || 
        notify?.success('Resume Created', `"${newResume.name}" has been created successfully.`);

      toast.success('Resume created successfully');
      return createdResume;
    } catch (error) {
      console.error('Error creating resume:', error);
      toast.error('Failed to create resume');
      throw error;
    }
  }, [user, canCreateResume, notify]);

  // Update a resume
  const updateResume = useCallback(async (resumeId, data) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      
      // Calculate ATS score if data is being updated
      let atsScore = data.atsScore;
      if (data.data && !atsScore) {
        atsScore = calculateATSScore(data.data);
      }

      const updates = {
        ...data,
        atsScore,
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
        status: atsScore >= 80 ? 'completed' : data.status || 'draft'
      };

      await updateDoc(resumeRef, updates);

      // Update current resume if it's the one being edited
      if (currentResume?.id === resumeId) {
        setCurrentResume(prev => ({ ...prev, ...updates }));
      }

      return true;
    } catch (error) {
      console.error('Error updating resume:', error);
      toast.error('Failed to update resume');
      throw error;
    }
  }, [currentResume]);

  // Auto-save resume
  const autoSaveResume = useCallback(async (resumeId, data) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      const atsScore = calculateATSScore(data);
      
      await updateDoc(resumeRef, {
        data,
        atsScore,
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
        status: atsScore >= 80 ? 'completed' : 'draft'
      });

      return true;
    } catch (error) {
      console.error('Error auto-saving resume:', error);
      return false;
    }
  }, []);

  // Delete a resume
  const deleteResume = useCallback(async (resumeId) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      await deleteDoc(resumeRef);

      if (currentResume?.id === resumeId) {
        setCurrentResume(null);
      }

      toast.success('Resume deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
      throw error;
    }
  }, [currentResume]);

  // Duplicate a resume
  const duplicateResume = useCallback(async (resume) => {
    if (!user) throw new Error('User not authenticated');
    
    if (!canCreateResume) {
      toast.error('Free plan limited to 1 resume. Upgrade to Pro for unlimited resumes!');
      throw new Error('Resume limit reached');
    }

    try {
      const { id, createdAt, updatedAt, ...resumeData } = resume;
      
      const newResume = {
        ...resumeData,
        userId: user.uid,
        name: `${resume.name || 'Untitled'} (Copy)`,
        status: 'draft',
        downloadCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'resumes'), newResume);
      
      const duplicatedResume = {
        id: docRef.id,
        ...newResume,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      toast.success('Resume duplicated successfully');
      return duplicatedResume;
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Failed to duplicate resume');
      throw error;
    }
  }, [user, canCreateResume]);

  // Increment download count
  const incrementDownloadCount = useCallback(async (resumeId) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      await updateDoc(resumeRef, {
        downloadCount: increment(1),
        lastDownloaded: serverTimestamp()
      });
      
      // Update local state
      setResumes(prev => 
        prev.map(r => r.id === resumeId 
          ? { ...r, downloadCount: (r.downloadCount || 0) + 1 }
          : r
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  }, []);

  // Get a single resume by ID
  const getResume = useCallback(async (resumeId) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      const resumeDoc = await getDoc(resumeRef);
      
      if (resumeDoc.exists()) {
        const resume = {
          id: resumeDoc.id,
          ...resumeDoc.data(),
          createdAt: resumeDoc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: resumeDoc.data().updatedAt?.toDate?.() || new Date()
        };
        return resume;
      }
      return null;
    } catch (error) {
      console.error('Error fetching resume:', error);
      return null;
    }
  }, []);

  // Load a resume for editing
  const loadResume = useCallback(async (resumeId) => {
    const resume = await getResume(resumeId);
    if (resume) {
      setCurrentResume(resume);
    }
    return resume;
  }, [getResume]);

  // Clear current resume
  const clearCurrentResume = useCallback(() => {
    setCurrentResume(null);
  }, []);

  // Delete multiple resumes (bulk action)
  const deleteMultipleResumes = useCallback(async (resumeIds) => {
    if (!resumeIds.length) return;

    try {
      const batch = writeBatch(db);
      resumeIds.forEach(id => {
        const resumeRef = doc(db, 'resumes', id);
        batch.delete(resumeRef);
      });
      await batch.commit();
      
      if (currentResume && resumeIds.includes(currentResume.id)) {
        setCurrentResume(null);
      }
      
      toast.success(`Deleted ${resumeIds.length} resumes`);
      return true;
    } catch (error) {
      console.error('Error deleting multiple resumes:', error);
      toast.error('Failed to delete resumes');
      throw error;
    }
  }, [currentResume]);

  const value = {
    // State
    resumes,
    currentResume,
    loading,
    error,
    stats,
    canCreateResume,
    
    // Actions
    createResume,
    updateResume,
    autoSaveResume,
    deleteResume,
    duplicateResume,
    deleteMultipleResumes,
    incrementDownloadCount,
    
    // Helpers
    getResume,
    loadResume,
    clearCurrentResume,
    setCurrentResume,
    
    // Computed
    hasResumes: resumes.length > 0,
    freeLimitReached: !isPremium && resumes.length >= 1
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};

export default ResumeContext;