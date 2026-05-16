import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs,
  writeBatch, serverTimestamp, increment, limit, startAfter,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const FREE_RESUME_LIMIT = 5;
const RESUMES_PER_PAGE = 20;

export const RESUME_TEMPLATES = [
  'modern',
  'classic',
  'creative',
  'minimal',
  'executive',
  'tech',
  'elegant',
  'corporate',
  'startup',
];

export const RESUME_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

// ── Safe ATS Score Calculation ───────────────────────────────────────────

const calculateATSScoreSafe = async (data) => {
  try {
    const { calculateATSScore } = await import('../utils/atsKeywords');
    return calculateATSScore(data);
  } catch {
    // Fallback: basic score calculation
    let score = 50;
    if (data?.personal?.fullName) score += 10;
    if (data?.personal?.email) score += 5;
    if (data?.experience?.length > 0) score += 15;
    if (data?.education?.length > 0) score += 10;
    if (data?.skills?.technical?.length >= 3) score += 10;
    return Math.min(score, 100);
  }
};

// ── Simple Debounce ──────────────────────────────────────────────────────

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedFn;
};

// ── Context ───────────────────────────────────────────────────────────────

const ResumeContext = createContext(null);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const useResumeContext = useResume;

// ── Provider ──────────────────────────────────────────────────────────────

export const ResumeProvider = ({ children }) => {
  const { user, isPremium } = useAuth();
  const { notify } = useNotifications();
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({
    total: 0, completed: 0, inProgress: 0, archived: 0,
    avgScore: 0, bestScore: 0, totalDownloads: 0, templateDistribution: {},
  });

  const mountedRef = useRef(true);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Calculate Stats ──────────────────────────────────────────────────

  const calculateStats = useCallback((resumeData) => {
    const completed = resumeData.filter((r) => r.status === 'completed' || r.atsScore >= 80).length;
    const archived = resumeData.filter((r) => r.status === 'archived').length;
    const scores = resumeData.map((r) => r.atsScore || 0).filter((s) => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const totalDownloads = resumeData.reduce((sum, r) => sum + (r.downloadCount || 0), 0);

    const templateDistribution = {};
    resumeData.forEach((r) => {
      const t = r.template || 'modern';
      templateDistribution[t] = (templateDistribution[t] || 0) + 1;
    });

    setStats({
      total: resumeData.length, completed,
      inProgress: resumeData.length - completed - archived, archived,
      avgScore, bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      totalDownloads, templateDistribution,
    });
  }, []);

  // ── Real-time Subscription ──────────────────────────────────────────

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
      orderBy('updatedAt', 'desc'),
      limit(RESUMES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        if (!mountedRef.current) return;

        const resumeData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        }));

        setResumes(resumeData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === RESUMES_PER_PAGE);
        calculateStats(resumeData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching resumes:', err);
        if (mountedRef.current) {
          setError(err);
          setLoading(false);
          toast.error('Failed to load resumes');
        }
      }
    );

    return () => unsubscribe();
  }, [user, calculateStats]);

  // ── Load More ────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!user || !lastVisible || !hasMore || loading) return;

    try {
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        startAfter(lastVisible),
        limit(RESUMES_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      if (!mountedRef.current) return;

      const newResumes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }));

      setResumes((prev) => [...prev, ...newResumes]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === RESUMES_PER_PAGE);
    } catch (err) {
      console.error('Error loading more resumes:', err);
    }
  }, [user, lastVisible, hasMore, loading]);

  // ── Permissions ─────────────────────────────────────────────────────

  const canCreateResume = useMemo(() => {
    if (!user) return false;
    if (isPremium) return true;
    return resumes.length < FREE_RESUME_LIMIT;
  }, [user, isPremium, resumes.length]);

  const freeResumesRemaining = useMemo(() => {
    if (isPremium) return Infinity;
    return Math.max(0, FREE_RESUME_LIMIT - resumes.length);
  }, [isPremium, resumes.length]);

  // ── Create Resume ────────────────────────────────────────────────────

  const createResume = useCallback(async (data = {}) => {
    if (!user) throw new Error('User not authenticated');

    if (!canCreateResume) {
      toast.error(`Free plan: ${FREE_RESUME_LIMIT} resumes max. Upgrade to Pro!`);
      throw new Error('Resume limit reached');
    }

    try {
      const initialScore =
        typeof data.atsScore === 'number'
          ? data.atsScore
          : await calculateATSScoreSafe(data.data || {});

      const newResume = {
        userId: user.uid,
        name: data.name || 'Untitled Resume',
        template: data.template || 'modern',
        data: data.data || {},
        status: RESUME_STATUS.DRAFT,
        atsScore: initialScore,
        downloadCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'resumes'), newResume);

      try { notify?.resumeCreated?.(newResume.name); } catch { /* notification non-critical */ }

      return {
        id: docRef.id,
        ...newResume,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (err) {
      console.error('Error creating resume:', err);
      toast.error('Failed to create resume');
      throw err;
    }
  }, [user, canCreateResume, notify]);

  // ── Update Resume ────────────────────────────────────────────────────

  const updateResume = useCallback(async (resumeId, data) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);

      let atsScore = data.atsScore;
      if (data.data && !atsScore) {
        atsScore = await calculateATSScoreSafe(data.data);
      }

      const updates = {
        ...data,
        atsScore,
        updatedAt: serverTimestamp(),
        status: atsScore >= 80 ? RESUME_STATUS.COMPLETED : (data.status || RESUME_STATUS.DRAFT),
      };

      await updateDoc(resumeRef, updates);

      if (currentResume?.id === resumeId) {
        setCurrentResume((prev) => ({ ...prev, ...updates }));
      }

      const oldScore = currentResume?.atsScore || 0;
      if (atsScore >= 80 && oldScore < 80) {
        notify?.atsScoreMilestone?.(data.name || 'Resume', atsScore);
      }

      return true;
    } catch (err) {
      console.error('Error updating resume:', err);
      toast.error('Failed to update resume');
      throw err;
    }
  }, [currentResume, notify]);

  // ── Auto-Save (Debounced) ────────────────────────────────────────────

  const autoSaveHandler = useCallback(async (resumeId, data) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      const atsScore = await calculateATSScoreSafe(data);

      await updateDoc(resumeRef, {
        data,
        atsScore,
        updatedAt: serverTimestamp(),
        status: atsScore >= 80 ? RESUME_STATUS.COMPLETED : RESUME_STATUS.DRAFT,
      });
      return true;
    } catch (err) {
      console.error('Auto-save error:', err);
      return false;
    }
  }, []);

  // FIX: Removed the redundant debounce wrapper here.
  // Builder already debounces calls via its own useDebounce(formData, 1500) effect.
  // Having a second debounce here meant: the write was delayed 1.5s AFTER the builder
  // had already waited 1.5s (total 3s delay), and `await autoSaveResume()` returned
  // undefined immediately (debounced fns are fire-and-forget), breaking save status tracking.
  const autoSaveResume = autoSaveHandler;

  // ── Delete Resume ────────────────────────────────────────────────────

  const deleteResume = useCallback(async (resumeId) => {
    try {
      await deleteDoc(doc(db, 'resumes', resumeId));
      if (currentResume?.id === resumeId) setCurrentResume(null);
      toast.success('Resume deleted');
      return true;
    } catch (err) {
      console.error('Error deleting resume:', err);
      toast.error('Failed to delete resume');
      throw err;
    }
  }, [currentResume]);

  // ── Duplicate Resume ─────────────────────────────────────────────────

  const duplicateResume = useCallback(async (resume) => {
    if (!user) throw new Error('User not authenticated');
    if (!canCreateResume) {
      toast.error(`Free plan: ${FREE_RESUME_LIMIT} resumes max.`);
      throw new Error('Resume limit reached');
    }

    try {
      const { id, createdAt, updatedAt, downloadCount, viewCount, ...resumeData } = resume;

      const newResume = {
        ...resumeData,
        userId: user.uid,
        name: `${resume.name || 'Untitled'} (Copy)`,
        status: RESUME_STATUS.DRAFT,
        downloadCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'resumes'), newResume);
      notify?.success?.('Resume duplicated', `"${newResume.name}" created.`);

      return {
        id: docRef.id,
        ...newResume,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (err) {
      console.error('Error duplicating resume:', err);
      toast.error('Failed to duplicate resume');
      throw err;
    }
  }, [user, canCreateResume, notify]);

  // ── Archive/Unarchive ────────────────────────────────────────────────

  const archiveResume = useCallback(async (resumeId) => {
    try {
      await updateDoc(doc(db, 'resumes', resumeId), {
        status: RESUME_STATUS.ARCHIVED,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Resume archived');
      return true;
    } catch (err) {
      console.error('Archive error:', err);
      toast.error('Failed to archive');
      throw err;
    }
  }, []);

  const unarchiveResume = useCallback(async (resumeId) => {
    try {
      await updateDoc(doc(db, 'resumes', resumeId), {
        status: RESUME_STATUS.DRAFT,
        updatedAt: serverTimestamp(),
      });
      toast.success('Resume restored');
      return true;
    } catch (err) {
      console.error('Restore error:', err);
      toast.error('Failed to restore');
      throw err;
    }
  }, []);

  // ── Counters ─────────────────────────────────────────────────────────

  const incrementDownloadCount = useCallback(async (resumeId) => {
    try {
      await updateDoc(doc(db, 'resumes', resumeId), {
        downloadCount: increment(1),
        lastDownloaded: serverTimestamp(),
      });
      setResumes((prev) => prev.map((r) =>
        r.id === resumeId ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r
      ));
      return true;
    } catch (err) {
      console.error('Download count error:', err);
      return false;
    }
  }, []);

  const incrementViewCount = useCallback(async (resumeId) => {
    try {
      await updateDoc(doc(db, 'resumes', resumeId), {
        viewCount: increment(1),
        lastViewed: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error('View count error:', err);
      return false;
    }
  }, []);

  // ── Get/Load Resume ──────────────────────────────────────────────────

  const getResume = useCallback(async (resumeId) => {
    try {
      const docRef = doc(db, 'resumes', resumeId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
          createdAt: snapshot.data().createdAt?.toDate?.() || new Date(),
          updatedAt: snapshot.data().updatedAt?.toDate?.() || new Date(),
        };
      }
      return null;
    } catch (err) {
      console.error('Get resume error:', err);
      return null;
    }
  }, []);

  const loadResume = useCallback(async (resumeId) => {
    const resume = await getResume(resumeId);
    if (resume) {
      setCurrentResume(resume);
      incrementViewCount(resumeId);
    }
    return resume;
  }, [getResume, incrementViewCount]);

  const clearCurrentResume = useCallback(() => setCurrentResume(null), []);

  // ── Bulk Operations ──────────────────────────────────────────────────

  const deleteMultipleResumes = useCallback(async (resumeIds) => {
    if (!resumeIds.length) return;
    try {
      const batch = writeBatch(db);
      resumeIds.forEach((id) => batch.delete(doc(db, 'resumes', id)));
      await batch.commit();
      if (currentResume && resumeIds.includes(currentResume.id)) setCurrentResume(null);
      toast.success(`Deleted ${resumeIds.length} resumes`);
      return true;
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error('Failed to delete resumes');
      throw err;
    }
  }, [currentResume]);

  const archiveMultipleResumes = useCallback(async (resumeIds) => {
    if (!resumeIds.length) return;
    try {
      const batch = writeBatch(db);
      resumeIds.forEach((id) => batch.update(doc(db, 'resumes', id), {
        status: RESUME_STATUS.ARCHIVED,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
      await batch.commit();
      toast.success(`Archived ${resumeIds.length} resumes`);
      return true;
    } catch (err) {
      console.error('Bulk archive error:', err);
      toast.error('Failed to archive');
      throw err;
    }
  }, []);

  // ── Search & Filter ──────────────────────────────────────────────────

  const searchResumes = useCallback((searchTerm) => {
    if (!searchTerm) return resumes;
    const term = searchTerm.toLowerCase();
    return resumes.filter((r) =>
      r.name?.toLowerCase().includes(term) ||
      r.data?.personal?.fullName?.toLowerCase().includes(term) ||
      r.data?.personal?.title?.toLowerCase().includes(term)
    );
  }, [resumes]);

  const filterResumesByStatus = useCallback((status) => {
    if (status === 'all') return resumes;
    return resumes.filter((r) => r.status === status);
  }, [resumes]);

  const filterResumesByTemplate = useCallback((template) => {
    if (template === 'all') return resumes;
    return resumes.filter((r) => r.template === template);
  }, [resumes]);

  // ── Context Value ────────────────────────────────────────────────────

  const value = useMemo(() => ({
    resumes, currentResume, loading, error, stats, hasMore,
    canCreateResume, freeResumesRemaining,
    createResume, updateResume, autoSaveResume,
    deleteResume, duplicateResume, archiveResume, unarchiveResume,
    deleteMultipleResumes, archiveMultipleResumes,
    incrementDownloadCount, incrementViewCount, loadMore,
    getResume, loadResume, clearCurrentResume, setCurrentResume,
    searchResumes, filterResumesByStatus, filterResumesByTemplate,
    FREE_RESUME_LIMIT, RESUME_TEMPLATES, RESUME_STATUS,
    hasResumes: resumes.length > 0,
    freeLimitReached: !isPremium && resumes.length >= FREE_RESUME_LIMIT,
  }), [
    resumes, currentResume, loading, error, stats, hasMore,
    canCreateResume, freeResumesRemaining,
    createResume, updateResume, autoSaveResume,
    deleteResume, duplicateResume, archiveResume, unarchiveResume,
    deleteMultipleResumes, archiveMultipleResumes,
    incrementDownloadCount, incrementViewCount, loadMore,
    getResume, loadResume, clearCurrentResume,
    searchResumes, filterResumesByStatus, filterResumesByTemplate,
    isPremium,
  ]);

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
};

export default ResumeContext;