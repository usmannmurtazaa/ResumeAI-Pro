// src/hooks/useResume.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
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
import toast from 'react-hot-toast';

export const useResume = (resumeId = null) => {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [recentResumes, setRecentResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalResumes: 0,
    completedResumes: 0,
    avgScore: 0,
    totalDownloads: 0
  });

  // Fetch single resume
  const fetchResume = useCallback(async (id) => {
    if (!user || !id) return;
    
    try {
      setLoading(true);
      const resumeRef = doc(db, 'resumes', id);
      const resumeDoc = await getDoc(resumeRef);
      
      if (resumeDoc.exists()) {
        const data = resumeDoc.data();
        if (data.userId === user.uid) {
          setResume({ id: resumeDoc.id, ...data });
        }
      }
    } catch (err) {
      console.error('Error fetching resume:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all resumes for user
  const fetchAllResumes = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const resumeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setResumes(resumeData);
      setRecentResumes(resumeData.slice(0, 3));
      
      // Calculate stats
      const completed = resumeData.filter(r => r.status === 'completed' || r.atsScore >= 80);
      const scores = resumeData.map(r => r.atsScore || 0).filter(s => s > 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      const downloads = resumeData.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
      
      setStats({
        totalResumes: resumeData.length,
        completedResumes: completed.length,
        avgScore,
        totalDownloads: downloads
      });
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save resume
  const saveResume = useCallback(async (data) => {
    if (!user) return;
    
    try {
      const resumeRef = data.id 
        ? doc(db, 'resumes', data.id)
        : doc(collection(db, 'resumes'));
      
      const resumeData = {
        ...data,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
        ...(data.id ? {} : { createdAt: new Date().toISOString() })
      };
      
      await setDoc(resumeRef, resumeData, { merge: true });
      
      toast.success(data.id ? 'Resume updated' : 'Resume created');
      
      return { id: resumeRef.id, ...resumeData };
    } catch (err) {
      console.error('Error saving resume:', err);
      toast.error('Failed to save resume');
      throw err;
    }
  }, [user]);

  // Update resume
  const updateResume = useCallback(async (id, data) => {
    if (!user || !id) return;
    
    try {
      const resumeRef = doc(db, 'resumes', id);
      await updateDoc(resumeRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      setResume(prev => prev?.id === id ? { ...prev, ...data } : prev);
    } catch (err) {
      console.error('Error updating resume:', err);
      throw err;
    }
  }, [user]);

  // Delete resume
  const deleteResume = useCallback(async (id) => {
    if (!user || !id) return;
    
    try {
      await deleteDoc(doc(db, 'resumes', id));
      setResumes(prev => prev.filter(r => r.id !== id));
      toast.success('Resume deleted');
    } catch (err) {
      console.error('Error deleting resume:', err);
      toast.error('Failed to delete resume');
      throw err;
    }
  }, [user]);

  // Duplicate resume
  const duplicateResume = useCallback(async (resume) => {
    if (!user) return;
    
    try {
      const { id, ...resumeData } = resume;
      const newResume = {
        ...resumeData,
        name: `${resume.name || 'Untitled'} (Copy)`,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        downloadCount: 0
      };
      
      const docRef = doc(collection(db, 'resumes'));
      await setDoc(docRef, newResume);
      
      toast.success('Resume duplicated');
      return { id: docRef.id, ...newResume };
    } catch (err) {
      console.error('Error duplicating resume:', err);
      toast.error('Failed to duplicate resume');
      throw err;
    }
  }, [user]);

  // Load on mount
  useEffect(() => {
    if (resumeId) {
      fetchResume(resumeId);
    }
  }, [resumeId, fetchResume]);

  useEffect(() => {
    fetchAllResumes();
  }, [fetchAllResumes]);

  return {
    resume,
    resumes,
    recentResumes,
    loading,
    error,
    stats,
    fetchResume,
    fetchAllResumes,
    saveResume,
    updateResume,
    deleteResume,
    duplicateResume
  };
};

export default useResume;