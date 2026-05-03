import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResumeContext } from '../contexts/ResumeContext';
import { db } from '../services/firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import toast from 'react-hot-toast';

/**
 * Standalone resume hook for use OUTSIDE of ResumeProvider.
 * If used inside ResumeProvider, prefer using useResumeContext() directly.
 * 
 * This hook provides self-contained resume management for pages
 * that need resume data without the full provider overhead.
 */
export const useResume = (resumeId = null) => {
  const { user } = useAuth();
  
  // Try to use the context if available (for consistency)
  let contextResume = null;
  let contextResumes = [];
  try {
    const ctx = useResumeContext();
    contextResume = ctx.currentResume;
    contextResumes = ctx.resumes;
  } catch {
    // Context not available, use local state
  }

  const [resume, setResume] = useState(contextResume || null);
  const [resumes, setResumes] = useState(contextResumes || []);
  const [recentResumes, setRecentResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalResumes: 0,
    completedResumes: 0,
    avgScore: 0,
    totalDownloads: 0,
  });

  const mountedRef = useRef(true);
  const userRef = useRef(user);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    userRef.current = user;
    return () => { mountedRef.current = false; };
  }, [user]);

  // ── Calculate Stats ──────────────────────────────────────────────────

  const calculateStats = useCallback((resumeData) => {
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
      totalDownloads: downloads,
    });
  }, []);

  // ── Real-time subscription (optional) ───────────────────────────────

  useEffect(() => {
    // If context is already providing resumes, don't subscribe
    if (contextResumes.length > 0) return;

    const currentUser = userRef.current;
    if (!currentUser) return;

    setLoading(true);

    const q = query(
      collection(db, 'resumes'),
      where('userId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        if (!mountedRef.current) return;

        const resumeData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setResumes(resumeData);
        setRecentResumes(resumeData.slice(0, 3));
        calculateStats(resumeData);
        setLoading(false);
      },
      (err) => {
        console.error('Error in resume subscription:', err);
        if (mountedRef.current) {
          setError(err);
          setLoading(false);
          toast.error('Failed to load resumes');
        }
      }
    );

    return () => unsubscribe();
  }, [calculateStats, contextResumes.length]);

  // ── Fetch Single Resume ──────────────────────────────────────────────

  const fetchResume = useCallback(async (id) => {
    if (!userRef.current || !id) return null;

    // Check context first
    if (contextResumes.length > 0) {
      const found = contextResumes.find(r => r.id === id);
      if (found) {
        setResume(found);
        return found;
      }
    }

    try {
      setLoading(true);

      const resumeDoc = await getDoc(doc(db, 'resumes', id));

      if (resumeDoc.exists() && mountedRef.current) {
        const data = resumeDoc.data();
        if (data.userId === userRef.current.uid) {
          const resumeData = { id: resumeDoc.id, ...data };
          setResume(resumeData);
          setLoading(false);
          return resumeData;
        }
      }

      setLoading(false);
      return null;
    } catch (err) {
      console.error('Error fetching resume:', err);
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
      return null;
    }
  }, [contextResumes]);

  // ── Save Resume ──────────────────────────────────────────────────────

  const saveResume = useCallback(async (data) => {
    if (!userRef.current) throw new Error('User not authenticated');

    try {
      const resumeData = {
        ...data,
        userId: userRef.current.uid,
        updatedAt: serverTimestamp(),
      };

      let docRef;

      // FIXED: Proper handling of new vs existing documents
      if (data.id) {
        // Update existing
        docRef = doc(db, 'resumes', data.id);
        await setDoc(docRef, resumeData, { merge: true });
      } else {
        // Create new
        docRef = doc(collection(db, 'resumes'));
        resumeData.createdAt = serverTimestamp();
        await setDoc(docRef, resumeData);
      }

      const result = { id: docRef.id, ...resumeData };

      setResume(prev => prev?.id === docRef.id ? { ...prev, ...result } : prev);

      toast.success(data.id ? 'Resume updated!' : 'Resume created!');
      return result;
    } catch (err) {
      console.error('Error saving resume:', err);
      toast.error('Failed to save resume');
      throw err;
    }
  }, []);

  // ── Update Resume ────────────────────────────────────────────────────

  const updateResume = useCallback(async (id, data) => {
    if (!userRef.current || !id) return;

    try {
      const updates = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'resumes', id), updates);

      if (mountedRef.current) {
        setResume(prev => prev?.id === id ? { ...prev, ...updates } : prev);
        setResumes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      }
    } catch (err) {
      console.error('Error updating resume:', err);
      throw err;
    }
  }, []);

  // ── Delete Resume ────────────────────────────────────────────────────

  const deleteResume = useCallback(async (id) => {
    if (!userRef.current || !id) return;

    try {
      await deleteDoc(doc(db, 'resumes', id));

      if (mountedRef.current) {
        setResumes(prev => prev.filter(r => r.id !== id));
        setResume(prev => prev?.id === id ? null : prev);
        toast.success('Resume deleted');
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      toast.error('Failed to delete resume');
      throw err;
    }
  }, []);

  // ── Duplicate Resume ─────────────────────────────────────────────────

  const duplicateResume = useCallback(async (resume) => {
    if (!userRef.current) throw new Error('User not authenticated');

    try {
      const { id, createdAt, updatedAt, downloadCount, viewCount, ...resumeData } = resume;

      const newResume = {
        ...resumeData,
        name: `${resume.name || 'Untitled'} (Copy)`,
        userId: userRef.current.uid,
        status: 'draft',
        downloadCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(collection(db, 'resumes'));
      await setDoc(docRef, newResume);

      const result = { id: docRef.id, ...newResume };
      toast.success('Resume duplicated');
      return result;
    } catch (err) {
      console.error('Error duplicating resume:', err);
      toast.error('Failed to duplicate resume');
      throw err;
    }
  }, []);

  // ── Load resume on mount ─────────────────────────────────────────────

  useEffect(() => {
    if (resumeId) {
      fetchResume(resumeId);
    }
  }, [resumeId, fetchResume]);

  return useMemo(() => ({
    resume,
    resumes,
    recentResumes,
    loading,
    error,
    stats,
    fetchResume,
    saveResume,
    updateResume,
    deleteResume,
    duplicateResume,
  }), [resume, resumes, recentResumes, loading, error, stats, fetchResume, saveResume, updateResume, deleteResume, duplicateResume]);
};

export default useResume;