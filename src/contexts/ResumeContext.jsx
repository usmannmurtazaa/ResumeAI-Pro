import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { resumeService } from '../services/resumeService';
import { calculateDetailedScore } from '../utils/atsScoring';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const FREE_RESUME_LIMIT = 5;
const RESUMES_PER_PAGE = 20;

export const RESUME_TEMPLATES = ['modern', 'classic', 'creative', 'tech', 'elegant'];

export const RESUME_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

const calculateATSScoreSafe = (data) => {
  try {
    return calculateDetailedScore(data).overall;
  } catch {
    let score = 50;
    if (data?.personal?.fullName) score += 10;
    if (data?.personal?.email) score += 5;
    if (data?.experience?.length > 0) score += 15;
    if (data?.education?.length > 0) score += 10;
    if (data?.skills?.technical?.length >= 3) score += 10;
    return Math.min(score, 100);
  }
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
  const { user, isPremium, getToken } = useAuth();
  const { notify } = useNotifications();

  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalResumeCount, setTotalResumeCount] = useState(0);
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

  const mountedRef = useRef(true);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Fetch Accurate Total Count ───────────────────────────────────────

  const refreshTotalCount = useCallback(async () => {
    if (!user) {
      setTotalResumeCount(0);
      return;
    }

    try {
      const q = query(collection(db, 'resumes'), where('userId', '==', user.uid));
      const countSnapshot = await getCountFromServer(q);
      if (mountedRef.current) {
        setTotalResumeCount(countSnapshot.data().count || 0);
      }
    } catch (err) {
      console.error('Error fetching resume count:', err);
    }
  }, [user]);

  // ── Stats Calculation (from loaded resumes for non-total metrics) ────

  const calculateStats = useCallback(
    (resumeData) => {
      const completed = resumeData.filter(
        (r) => r.status === 'completed' || r.atsScore >= 80
      ).length;
      const archived = resumeData.filter((r) => r.status === 'archived').length;
      const scores = resumeData.map((r) => r.atsScore || 0).filter((s) => s > 0);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      const totalDownloads = resumeData.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
      const templateDistribution = {};
      resumeData.forEach((r) => {
        const t = r.template || 'modern';
        templateDistribution[t] = (templateDistribution[t] || 0) + 1;
      });

      setStats({
        total: totalResumeCount, // use accurate count
        completed,
        inProgress: totalResumeCount - completed - archived,
        archived,
        avgScore,
        bestScore: scores.length ? Math.max(...scores) : 0,
        totalDownloads,
        templateDistribution,
      });
    },
    [totalResumeCount]
  );

  // ── Real-time Subscription ──────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setResumes([]);
      setCurrentResume(null);
      setLoading(false);
      setError(null);
      setTotalResumeCount(0);
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

    const unsubscribe = onSnapshot(
      q,
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

        // Fetch accurate total count whenever list updates
        refreshTotalCount();

        setLoading(false);
        setError(null);
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
  }, [user, refreshTotalCount]);

  // ── Recalculate stats when resumes or total count change ─────────────

  useEffect(() => {
    calculateStats(resumes);
  }, [resumes, calculateStats]);

  // ── Load More ──────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!user || !lastVisible || !hasMore || loading || loadingMore) return;

    setLoadingMore(true);

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
      toast.error('Failed to load more resumes');
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [user, lastVisible, hasMore, loading, loadingMore]);

  // ── Permissions ─────────────────────────────────────────────────────

  const canCreateResume = useMemo(() => {
    if (!user) return false;
    if (isPremium) return true;
    return totalResumeCount < FREE_RESUME_LIMIT;
  }, [user, isPremium, totalResumeCount]);

  const freeResumesRemaining = useMemo(() => {
    if (isPremium) return Infinity;
    return Math.max(0, FREE_RESUME_LIMIT - totalResumeCount);
  }, [isPremium, totalResumeCount]);

  // ── Create Resume (through Netlify Function) ─────────────────────────

  const createResume = useCallback(
    async (data = {}) => {
      if (!user) throw new Error('User not authenticated');

      if (!canCreateResume) {
        toast.error(`Free plan: ${FREE_RESUME_LIMIT} resumes max. Upgrade to Pro!`);
        throw new Error('Resume limit reached');
      }

      try {
        const token = await getToken(true);
        if (!token) throw new Error('Unable to authenticate');

        const payload = {
          template: data.template || 'modern',
          name: data.name || 'Untitled Resume',
          data: data.data || {},
          atsScore:
            typeof data.atsScore === 'number'
              ? data.atsScore
              : calculateATSScoreSafe(data.data || {}),
        };

        const response = await fetch('/.netlify/functions/create-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create resume');
        }

        const newResume = await response.json();
        toast.success(`Resume "${newResume.name}" created`);

        await refreshTotalCount();
        return {
          id: newResume.id,
          ...newResume,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (err) {
        console.error('Error creating resume:', err);
        toast.error(err.message || 'Failed to create resume');
        throw err;
      }
    },
    [user, canCreateResume, getToken, refreshTotalCount]
  );

  // ── Update Resume (delegated to resumeService) ───────────────────────

  const updateResume = useCallback(
    async (resumeId, data) => {
      try {
        await resumeService.updateResume(resumeId, data);

        if (currentResume?.id === resumeId) {
          setCurrentResume((prev) => (prev ? { ...prev, ...data } : prev));
        }

        const oldScore = currentResume?.atsScore || 0;
        const newScore = data.atsScore || calculateATSScoreSafe(data.data);
        if (newScore >= 80 && oldScore < 80) {
          toast.success(`ATS Score ${newScore}% — Great job!`);
        }

        return true;
      } catch (err) {
        console.error('Error updating resume:', err);
        toast.error('Failed to update resume');
        throw err;
      }
    },
    [currentResume]
  );

  // ── Auto-Save Handler (delegated to resumeService) ───────────────────

  const autoSaveResume = useCallback(async (resumeId, data) => {
    if (!resumeId || !data) return false;
    return resumeService.autoSaveResume(resumeId, data);
  }, []);

  // ── Delete Resume (delegated to resumeService) ───────────────────────

  const deleteResume = useCallback(
    async (resumeId) => {
      try {
        await resumeService.deleteResume(resumeId);
        if (currentResume?.id === resumeId) setCurrentResume(null);
        toast.success('Resume deleted');
        await refreshTotalCount();
        return true;
      } catch (err) {
        console.error('Error deleting resume:', err);
        toast.error('Failed to delete resume');
        throw err;
      }
    },
    [currentResume, refreshTotalCount]
  );

  // ── Duplicate Resume (through Netlify Function) ─────────────────────

  const duplicateResume = useCallback(
    async (resume) => {
      if (!user) throw new Error('User not authenticated');
      if (!canCreateResume) {
        toast.error(`Free plan: ${FREE_RESUME_LIMIT} resumes max.`);
        throw new Error('Resume limit reached');
      }

      try {
        const token = await getToken(true);
        if (!token) throw new Error('Unable to authenticate');

        const response = await fetch('/.netlify/functions/duplicate-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ resumeId: resume.id }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to duplicate resume');
        }

        const duplicated = await response.json();
        toast.success(`Resume duplicated: "${duplicated.name}"`);

        await refreshTotalCount();
        return {
          id: duplicated.id,
          ...duplicated,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (err) {
        console.error('Error duplicating resume:', err);
        toast.error(err.message || 'Failed to duplicate resume');
        throw err;
      }
    },
    [user, canCreateResume, getToken, refreshTotalCount]
  );

  // ── Archive / Unarchive (using resumeService.updateResume) ───────────

  const archiveResume = useCallback(
    async (resumeId) => {
      try {
        await resumeService.updateResume(resumeId, {
          status: RESUME_STATUS.ARCHIVED,
          archivedAt: new Date().toISOString(),
        });
        toast.success('Resume archived');
        await refreshTotalCount();
        return true;
      } catch (err) {
        console.error('Archive error:', err);
        toast.error('Failed to archive');
        throw err;
      }
    },
    [refreshTotalCount]
  );

  const unarchiveResume = useCallback(
    async (resumeId) => {
      try {
        await resumeService.updateResume(resumeId, {
          status: RESUME_STATUS.DRAFT,
        });
        toast.success('Resume restored');
        await refreshTotalCount();
        return true;
      } catch (err) {
        console.error('Restore error:', err);
        toast.error('Failed to restore');
        throw err;
      }
    },
    [refreshTotalCount]
  );

  // ── Counters (delegated to resumeService) ────────────────────────────

  const incrementDownloadCount = useCallback(async (resumeId) => {
    try {
      const success = await resumeService.incrementDownloadCount(resumeId);
      if (success) {
        setResumes((prev) =>
          prev.map((r) =>
            r.id === resumeId ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r
          )
        );
      }
      return success;
    } catch (err) {
      console.error('Download count error:', err);
      return false;
    }
  }, []);

  const incrementViewCount = useCallback(async (resumeId) => {
    return resumeService.incrementViewCount(resumeId);
  }, []);

  // ── Get / Load Resume (delegated to resumeService) ───────────────────

  const getResume = useCallback(async (resumeId) => {
    try {
      return await resumeService.getResume(resumeId);
    } catch (err) {
      console.error('Get resume error:', err);
      return null;
    }
  }, []);

  const loadResume = useCallback(
    async (resumeId) => {
      const resume = await getResume(resumeId);
      if (resume) {
        setCurrentResume(resume);
        incrementViewCount(resumeId);
      }
      return resume;
    },
    [getResume, incrementViewCount]
  );

  const clearCurrentResume = useCallback(() => setCurrentResume(null), []);

  // ── Bulk Operations (delegated to resumeService) ─────────────────────

  const deleteMultipleResumes = useCallback(
    async (resumeIds) => {
      if (!resumeIds.length) return;
      try {
        await resumeService.deleteMultipleResumes(resumeIds);
        if (currentResume && resumeIds.includes(currentResume.id)) {
          setCurrentResume(null);
        }
        toast.success(`Deleted ${resumeIds.length} resumes`);
        await refreshTotalCount();
        return true;
      } catch (err) {
        console.error('Bulk delete error:', err);
        toast.error('Failed to delete resumes');
        throw err;
      }
    },
    [currentResume, refreshTotalCount]
  );

  const archiveMultipleResumes = useCallback(
    async (resumeIds) => {
      if (!resumeIds.length) return;
      try {
        await Promise.all(
          resumeIds.map((id) =>
            resumeService.updateResume(id, {
              status: RESUME_STATUS.ARCHIVED,
              archivedAt: new Date().toISOString(),
            })
          )
        );
        toast.success(`Archived ${resumeIds.length} resumes`);
        await refreshTotalCount();
        return true;
      } catch (err) {
        console.error('Bulk archive error:', err);
        toast.error('Failed to archive');
        throw err;
      }
    },
    [refreshTotalCount]
  );

  // ── Search & Filter (still client-side) ──────────────────────────────

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

  // ── Memoized Context Value ──────────────────────────────────────────

  const value = useMemo(
    () => ({
      resumes,
      currentResume,
      loading,
      error,
      stats,
      hasMore,
      loadingMore,
      canCreateResume,
      freeResumesRemaining,
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
      getResume,
      loadResume,
      clearCurrentResume,
      setCurrentResume,
      searchResumes,
      filterResumesByStatus,
      filterResumesByTemplate,
      FREE_RESUME_LIMIT,
      RESUME_TEMPLATES,
      RESUME_STATUS,
      hasResumes: totalResumeCount > 0,
      freeLimitReached: !isPremium && totalResumeCount >= FREE_RESUME_LIMIT,
    }),
    [
      resumes,
      currentResume,
      loading,
      error,
      stats,
      hasMore,
      loadingMore,
      canCreateResume,
      freeResumesRemaining,
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
      getResume,
      loadResume,
      clearCurrentResume,
      searchResumes,
      filterResumesByStatus,
      filterResumesByTemplate,
      isPremium,
      totalResumeCount,
    ]
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
};

export default ResumeContext;
