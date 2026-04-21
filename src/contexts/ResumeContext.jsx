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
  getDocs,
  writeBatch,
  serverTimestamp,
  increment,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { calculateATSScore } from '../utils/atsKeywords';
import toast from 'react-hot-toast';

// ============================================
// CONSTANTS
// ============================================

const FREE_RESUME_LIMIT = 5; // Updated from 1 to 5
const RESUME_TEMPLATES = ['modern', 'classic', 'creative', 'minimal', 'executive', 'tech'];
const RESUME_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

// ============================================
// CONTEXT CREATION
// ============================================

const ResumeContext = createContext(null);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const useResumeContext = useResume; // Alias for backward compatibility

// ============================================
// PROVIDER COMPONENT
// ============================================

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
    total: 0,
    completed: 0,
    inProgress: 0,
    archived: 0,
    avgScore: 0,
    bestScore: 0,
    totalDownloads: 0,
    templateDistribution: {},
  });

  // ============================================
  // REAL-TIME RESUMES SUBSCRIPTION
  // ============================================

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
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const resumeData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        }));

        setResumes(resumeData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === 20);
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

  // ============================================
  // CALCULATE STATISTICS
  // ============================================

  const calculateStats = (resumeData) => {
    const completed = resumeData.filter((r) => r.status === 'completed' || r.atsScore >= 80).length;
    const archived = resumeData.filter((r) => r.status === 'archived').length;
    const scores = resumeData.map((r) => r.atsScore || 0).filter((s) => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const totalDownloads = resumeData.reduce((sum, r) => sum + (r.downloadCount || 0), 0);

    // Template distribution
    const templateDistribution = {};
    resumeData.forEach((r) => {
      const template = r.template || 'modern';
      templateDistribution[template] = (templateDistribution[template] || 0) + 1;
    });

    setStats({
      total: resumeData.length,
      completed,
      inProgress: resumeData.length - completed - archived,
      archived,
      avgScore,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      totalDownloads,
      templateDistribution,
    });
  };

  // ============================================
  // LOAD MORE (PAGINATION)
  // ============================================

  const loadMore = useCallback(async () => {
    if (!user || !lastVisible || !hasMore || loading) return;

    try {
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const newResumes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }));

      setResumes((prev) => [...prev, ...newResumes]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 20);
    } catch (error) {
      console.error('Error loading more resumes:', error);
    }
  }, [user, lastVisible, hasMore, loading]);

  // ============================================
  // PERMISSIONS
  // ============================================

  const canCreateResume = useMemo(() => {
    if (!user) return false;
    if (isPremium) return true;
    return resumes.length < FREE_RESUME_LIMIT;
  }, [user, isPremium, resumes.length]);

  const freeResumesRemaining = useMemo(() => {
    if (isPremium) return Infinity;
    return Math.max(0, FREE_RESUME_LIMIT - resumes.length);
  }, [isPremium, resumes.length]);

  // ============================================
  // CREATE RESUME
  // ============================================

  const createResume = useCallback(
    async (data = {}) => {
      if (!user) throw new Error('User not authenticated');

      if (!canCreateResume) {
        toast.error(
          `Free plan limited to ${FREE_RESUME_LIMIT} resumes. Upgrade to Pro for unlimited resumes!`
        );
        throw new Error('Resume limit reached');
      }

      try {
        const newResume = {
          userId: user.uid,
          name: data.name || 'Untitled Resume',
          template: data.template || 'modern',
          data: data.data || {},
          status: RESUME_STATUS.DRAFT,
          atsScore: 0,
          atsBreakdown: {},
          downloadCount: 0,
          viewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastModified: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'resumes'), newResume);

        const createdResume = {
          id: docRef.id,
          ...newResume,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        notify?.resumeCreated?.(newResume.name) ||
          notify?.success('Resume Created', `"${newResume.name}" has been created successfully.`);

        toast.success('Resume created successfully');
        return createdResume;
      } catch (error) {
        console.error('Error creating resume:', error);
        toast.error('Failed to create resume');
        throw error;
      }
    },
    [user, canCreateResume, notify]
  );

  // ============================================
  // UPDATE RESUME
  // ============================================

  const updateResume = useCallback(
    async (resumeId, data) => {
      try {
        const resumeRef = doc(db, 'resumes', resumeId);

        let atsScore = data.atsScore;
        let atsBreakdown = data.atsBreakdown;
        if (data.data && !atsScore) {
          atsScore = calculateATSScore(data.data);
        }

        const updates = {
          ...data,
          atsScore,
          atsBreakdown,
          updatedAt: serverTimestamp(),
          lastModified: serverTimestamp(),
          status: atsScore >= 80 ? RESUME_STATUS.COMPLETED : data.status || RESUME_STATUS.DRAFT,
        };

        await updateDoc(resumeRef, updates);

        if (currentResume?.id === resumeId) {
          setCurrentResume((prev) => ({ ...prev, ...updates }));
        }

        // Check for ATS milestone
        const oldScore = currentResume?.atsScore || 0;
        if (atsScore >= 80 && oldScore < 80) {
          notify?.atsScoreMilestone?.(data.name || 'Resume', atsScore);
        }

        return true;
      } catch (error) {
        console.error('Error updating resume:', error);
        toast.error('Failed to update resume');
        throw error;
      }
    },
    [currentResume, notify]
  );

  // ============================================
  // AUTO-SAVE RESUME
  // ============================================

  const autoSaveResume = useCallback(async (resumeId, data) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      const atsScore = calculateATSScore(data);

      await updateDoc(resumeRef, {
        data,
        atsScore,
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
        status: atsScore >= 80 ? RESUME_STATUS.COMPLETED : RESUME_STATUS.DRAFT,
      });

      return true;
    } catch (error) {
      console.error('Error auto-saving resume:', error);
      return false;
    }
  }, []);

  // ============================================
  // DELETE RESUME
  // ============================================

  const deleteResume = useCallback(
    async (resumeId) => {
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
    },
    [currentResume]
  );

  // ============================================
  // DUPLICATE RESUME
  // ============================================

  const duplicateResume = useCallback(
    async (resume) => {
      if (!user) throw new Error('User not authenticated');

      if (!canCreateResume) {
        toast.error(
          `Free plan limited to ${FREE_RESUME_LIMIT} resumes. Upgrade to Pro for unlimited resumes!`
        );
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
          lastModified: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'resumes'), newResume);

        const duplicatedResume = {
          id: docRef.id,
          ...newResume,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        notify?.success('Resume Duplicated', `"${newResume.name}" has been created.`);

        toast.success('Resume duplicated successfully');
        return duplicatedResume;
      } catch (error) {
        console.error('Error duplicating resume:', error);
        toast.error('Failed to duplicate resume');
        throw error;
      }
    },
    [user, canCreateResume, notify]
  );

  // ============================================
  // ARCHIVE RESUME
  // ============================================

  const archiveResume = useCallback(
    async (resumeId) => {
      try {
        const resumeRef = doc(db, 'resumes', resumeId);
        await updateDoc(resumeRef, {
          status: RESUME_STATUS.ARCHIVED,
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast.success('Resume archived');
        return true;
      } catch (error) {
        console.error('Error archiving resume:', error);
        toast.error('Failed to archive resume');
        throw error;
      }
    },
    []
  );

  const unarchiveResume = useCallback(
    async (resumeId) => {
      try {
        const resumeRef = doc(db, 'resumes', resumeId);
        await updateDoc(resumeRef, {
          status: RESUME_STATUS.DRAFT,
          updatedAt: serverTimestamp(),
        });

        toast.success('Resume restored');
        return true;
      } catch (error) {
        console.error('Error restoring resume:', error);
        toast.error('Failed to restore resume');
        throw error;
      }
    },
    []
  );

  // ============================================
  // INCREMENT DOWNLOAD COUNT
  // ============================================

  const incrementDownloadCount = useCallback(async (resumeId) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      await updateDoc(resumeRef, {
        downloadCount: increment(1),
        lastDownloaded: serverTimestamp(),
      });

      setResumes((prev) =>
        prev.map((r) =>
          r.id === resumeId ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r
        )
      );

      return true;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  }, []);

  // ============================================
  // INCREMENT VIEW COUNT
  // ============================================

  const incrementViewCount = useCallback(async (resumeId) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      await updateDoc(resumeRef, {
        viewCount: increment(1),
        lastViewed: serverTimestamp(),
      });

      setResumes((prev) =>
        prev.map((r) =>
          r.id === resumeId ? { ...r, viewCount: (r.viewCount || 0) + 1 } : r
        )
      );

      return true;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return false;
    }
  }, []);

  // ============================================
  // GET SINGLE RESUME
  // ============================================

  const getResume = useCallback(async (resumeId) => {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      const resumeDoc = await getDoc(resumeRef);

      if (resumeDoc.exists()) {
        const resume = {
          id: resumeDoc.id,
          ...resumeDoc.data(),
          createdAt: resumeDoc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: resumeDoc.data().updatedAt?.toDate?.() || new Date(),
        };
        return resume;
      }
      return null;
    } catch (error) {
      console.error('Error fetching resume:', error);
      return null;
    }
  }, []);

  const loadResume = useCallback(
    async (resumeId) => {
      const resume = await getResume(resumeId);
      if (resume) {
        setCurrentResume(resume);
        await incrementViewCount(resumeId);
      }
      return resume;
    },
    [getResume, incrementViewCount]
  );

  const clearCurrentResume = useCallback(() => {
    setCurrentResume(null);
  }, []);

  // ============================================
  // BULK OPERATIONS
  // ============================================

  const deleteMultipleResumes = useCallback(
    async (resumeIds) => {
      if (!resumeIds.length) return;

      try {
        const batch = writeBatch(db);
        resumeIds.forEach((id) => {
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
    },
    [currentResume]
  );

  const archiveMultipleResumes = useCallback(async (resumeIds) => {
    if (!resumeIds.length) return;

    try {
      const batch = writeBatch(db);
      resumeIds.forEach((id) => {
        const resumeRef = doc(db, 'resumes', id);
        batch.update(resumeRef, {
          status: RESUME_STATUS.ARCHIVED,
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();

      toast.success(`Archived ${resumeIds.length} resumes`);
      return true;
    } catch (error) {
      console.error('Error archiving multiple resumes:', error);
      toast.error('Failed to archive resumes');
      throw error;
    }
  }, []);

  // ============================================
  // SEARCH & FILTER
  // ============================================

  const searchResumes = useCallback(
    (searchTerm) => {
      if (!searchTerm) return resumes;
      const term = searchTerm.toLowerCase();
      return resumes.filter(
        (r) =>
          r.name?.toLowerCase().includes(term) ||
          r.data?.personal?.fullName?.toLowerCase().includes(term) ||
          r.data?.personal?.title?.toLowerCase().includes(term)
      );
    },
    [resumes]
  );

  const filterResumesByStatus = useCallback(
    (status) => {
      if (status === 'all') return resumes;
      return resumes.filter((r) => r.status === status);
    },
    [resumes]
  );

  const filterResumesByTemplate = useCallback(
    (template) => {
      if (template === 'all') return resumes;
      return resumes.filter((r) => r.template === template);
    },
    [resumes]
  );

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // State
    resumes,
    currentResume,
    loading,
    error,
    stats,
    hasMore,
    canCreateResume,
    freeResumesRemaining,

    // Actions
    createResume,
    updateResume,
    autoSaveResume,
    deleteResume,
    duplicateResume,
    archiveResume,
    unarchiveResume,
    deleteMultipleResumes,
    archiveMultipleResumes,
    incrementDownloadCount,
    incrementViewCount,
    loadMore,

    // Helpers
    getResume,
    loadResume,
    clearCurrentResume,
    setCurrentResume,
    searchResumes,
    filterResumesByStatus,
    filterResumesByTemplate,

    // Constants
    FREE_RESUME_LIMIT,
    RESUME_TEMPLATES,
    RESUME_STATUS,

    // Computed
    hasResumes: resumes.length > 0,
    freeLimitReached: !isPremium && resumes.length >= FREE_RESUME_LIMIT,
  };

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
};

export default ResumeContext;