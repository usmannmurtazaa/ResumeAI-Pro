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

  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Aggregate counts come from `getCountFromServer` (billed at ~1 read per
  // 1 000 matching documents) so that `total`, `completed`, `archived`, and
  // `inProgress` are computed against the full collection and not against
  // the paginated loaded slice.
  const [resumeCounts, setResumeCounts] = useState({
    total: 0,
    completed: 0,
    archived: 0,
  });
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

  // ── Fetch Accurate Counts (server-side, cheap) ───────────────────────
  // Three parallel count queries. Each is billed as roughly 1 read per
  // 1 000 matching documents. The `where('status', '==', ...)` filters use
  // the existing `(userId, status, updatedAt)` composite index defined in
  // `firestore.indexes.json`, so no new index is required.
  //
  // This callback is invoked from three places:
  //   1. The mount / user-change effect below.
  //   2. After every mutation that can change the totals
  //      (create / delete / duplicate / archive / unarchive / bulk ops).
  // It is intentionally NOT invoked from the real-time `onSnapshot`
  // callback - that would fire it on every resume write (including
  // autosave), far more often than the totals can actually change.

  const refreshCounts = useCallback(async () => {
    if (!user) {
      setResumeCounts({ total: 0, completed: 0, archived: 0 });
      return;
    }

    try {
      const [totalSnap, completedSnap, archivedSnap] = await Promise.all([
        getCountFromServer(query(collection(db, 'resumes'), where('userId', '==', user.uid))),
        getCountFromServer(
          query(
            collection(db, 'resumes'),
            where('userId', '==', user.uid),
            where('status', '==', 'completed')
          )
        ),
        getCountFromServer(
          query(
            collection(db, 'resumes'),
            where('userId', '==', user.uid),
            where('status', '==', 'archived')
          )
        ),
      ]);

      if (mountedRef.current) {
        setResumeCounts({
          total: totalSnap.data().count || 0,
          completed: completedSnap.data().count || 0,
          archived: archivedSnap.data().count || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching resume counts:', err);
    }
  }, [user]);

  // ── Sync counts on mount / sign-in ────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setResumeCounts({ total: 0, completed: 0, archived: 0 });
      return;
    }
    refreshCounts();
  }, [user, refreshCounts]);

  // ── Stats Calculation ────────────────────────────────────────────────
  // `total`, `completed`, `archived`, and `inProgress` come from the
  // authoritative server counts. The remaining statistics (avg score,
  // best score, downloads, template distribution) are computed from the
  // loaded slice because they require per-document data - for accounts
  // whose loaded slice is representative of the collection, this is a
  // reasonable approximation.

  const calculateStats = useCallback(() => {
    const total = resumeCounts.total;
    const completed = resumeCounts.completed;
    const archived = resumeCounts.archived;
    const inProgress = Math.max(0, total - completed - archived);

    const loaded = resumes;
    const scores = loaded.map((r) => r.atsScore || 0).filter((s) => s > 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const totalDownloads = loaded.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
    const templateDistribution = {};
    loaded.forEach((r) => {
      const t = r.template || 'modern';
      templateDistribution[t] = (templateDistribution[t] || 0) + 1;
    });

    setStats({
      total,
      completed,
      inProgress,
      archived,
      avgScore,
      bestScore: scores.length ? Math.max(...scores) : 0,
      totalDownloads,
      templateDistribution,
    });
  }, [resumeCounts, resumes]);

  // ── Real-time Subscription ──────────────────────────────────────────
  // The snapshot callback updates the loaded slice only. Aggregate counts
  // are refreshed separately by `refreshCounts` - see the mount effect
  // above and the mutation call sites below.

  useEffect(() => {
    if (!user) {
      setResumes([]);
      setCurrentResume(null);
      setLoading(false);
      setError(null);
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
  }, [user]);

  // ── Recalculate stats when resumes or counts change ────────────────────

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

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
    return resumeCounts.total < FREE_RESUME_LIMIT;
  }, [user, isPremium, resumeCounts.total]);

  const freeResumesRemaining = useMemo(() => {
    if (isPremium) return Infinity;
    return Math.max(0, FREE_RESUME_LIMIT - resumeCounts.total);
  }, [isPremium, resumeCounts.total]);

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

        await refreshCounts();
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
    [user, canCreateResume, getToken, refreshCounts]
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
          toast.success(`ATS Score ${newScore}% - Great job!`);
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
        await refreshCounts();
        return true;
      } catch (err) {
        console.error('Error deleting resume:', err);
        toast.error('Failed to delete resume');
        throw err;
      }
    },
    [currentResume, refreshCounts]
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

        await refreshCounts();
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
    [user, canCreateResume, getToken, refreshCounts]
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
        await refreshCounts();
        return true;
      } catch (err) {
        console.error('Archive error:', err);
        toast.error('Failed to archive');
        throw err;
      }
    },
    [refreshCounts]
  );

  const unarchiveResume = useCallback(
    async (resumeId) => {
      try {
        await resumeService.updateResume(resumeId, {
          status: RESUME_STATUS.DRAFT,
        });
        toast.success('Resume restored');
        await refreshCounts();
        return true;
      } catch (err) {
        console.error('Restore error:', err);
        toast.error('Failed to restore');
        throw err;
      }
    },
    [refreshCounts]
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
        await refreshCounts();
        return true;
      } catch (err) {
        console.error('Bulk delete error:', err);
        toast.error('Failed to delete resumes');
        throw err;
      }
    },
    [currentResume, refreshCounts]
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
        await refreshCounts();
        return true;
      } catch (err) {
        console.error('Bulk archive error:', err);
        toast.error('Failed to archive');
        throw err;
      }
    },
    [refreshCounts]
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
      hasResumes: resumeCounts.total > 0,
      freeLimitReached: !isPremium && resumeCounts.total >= FREE_RESUME_LIMIT,
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
      resumeCounts.total,
    ]
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
};

export default ResumeContext;
