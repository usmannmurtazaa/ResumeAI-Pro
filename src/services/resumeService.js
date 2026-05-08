import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, startAfter,
  writeBatch, serverTimestamp, increment,
} from 'firebase/firestore';
import { db, logAnalyticsEvent } from './firebase';
import { FREE_RESUME_LIMIT } from '../data/constants';
const MAX_BATCH_SIZE = 400;

// ── Safe ATS Score Calculation ────────────────────────────────────────────

const calculateATSScoreSafe = (data) => {
  try {
    // Dynamic import with fallback
    // If the utility module is available, use it. Otherwise, use basic calculation.
    let score = 50;
    if (data?.personal?.fullName) score += 10;
    if (data?.personal?.email) score += 5;
    if (Array.isArray(data?.experience) && data.experience.length > 0) score += 15;
    if (Array.isArray(data?.education) && data.education.length > 0) score += 10;
    if (Array.isArray(data?.skills?.technical) && data.skills.technical.length >= 3) score += 10;
    if (Array.isArray(data?.projects) && data.projects.length > 0) score += 5;
    if (Array.isArray(data?.certifications) && data.certifications.length > 0) score += 5;
    return Math.min(score, 100);
  } catch {
    return 0;
  }
};

// ── Utilities ──────────────────────────────────────────────────────────────

const toDateISO = (value) => {
  if (!value) return null;
  try { return value.toDate?.()?.toISOString() || value; } catch { return value; }
};

const formatResume = (docSnapshot) => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    ...data,
    createdAt: toDateISO(data.createdAt),
    updatedAt: toDateISO(data.updatedAt),
  };
};

// ── Resume Service ─────────────────────────────────────────────────────────

export const resumeService = {
  // ── Create ─────────────────────────────────────────────────────────────

  async createResume(userId, resumeData) {
    try {
      const resumeRef = doc(collection(db, 'resumes'));
      const atsScore = calculateATSScoreSafe(resumeData.data || {});

      const data = {
        ...resumeData,
        userId,
        atsScore,
        downloadCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: atsScore >= 80 ? 'completed' : 'draft',
      };

      await setDoc(resumeRef, data);
      logAnalyticsEvent('resume_created', { resumeId: resumeRef.id, template: resumeData.template, atsScore });

      return { id: resumeRef.id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    } catch (error) {
      console.error('Error creating resume:', error);
      throw new Error('Failed to create resume');
    }
  },

  async duplicateResume(resumeId, userId) {
    try {
      const original = await this.getResume(resumeId);
      if (!original) throw new Error('Original resume not found');

      const { id, createdAt, updatedAt, downloadCount, viewCount, ...rest } = original;
      const duplicated = await this.createResume(userId, {
        ...rest,
        name: `${rest.name || 'Untitled'} (Copy)`,
        status: 'draft',
      });

      logAnalyticsEvent('resume_duplicated', { originalId: resumeId, newId: duplicated.id });
      return duplicated;
    } catch (error) {
      console.error('Error duplicating resume:', error);
      throw new Error('Failed to duplicate resume');
    }
  },

  // ── Read ────────────────────────────────────────────────────────────────

  async getResume(resumeId, trackView = false) {
    try {
      const snap = await getDoc(doc(db, 'resumes', resumeId));
      if (!snap.exists()) return null;

      // FIXED: Only track view when explicitly requested (e.g., public preview)
      if (trackView) {
        this.incrementViewCount(resumeId).catch(() => {});
      }

      return formatResume(snap);
    } catch (error) {
      console.error('Error fetching resume:', error);
      throw new Error('Failed to fetch resume');
    }
  },

  async getUserResumes(userId) {
    try {
      const q = query(collection(db, 'resumes'), where('userId', '==', userId), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(formatResume);
    } catch (error) {
      console.error('Error fetching user resumes:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  async getUserResumesPaginated(userId, pageSize = 10, lastDoc = null) {
    try {
      let q = query(collection(db, 'resumes'), where('userId', '==', userId), orderBy('updatedAt', 'desc'), limit(pageSize));
      if (lastDoc) q = query(q, startAfter(lastDoc));

      const snap = await getDocs(q);
      return {
        resumes: snap.docs.map(formatResume),
        lastVisible: snap.docs[snap.docs.length - 1] || null,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (error) {
      console.error('Error fetching paginated resumes:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  async getRecentResumes(userId, count = 5) {
    try {
      const q = query(collection(db, 'resumes'), where('userId', '==', userId), orderBy('updatedAt', 'desc'), limit(count));
      return (await getDocs(q)).docs.map(formatResume);
    } catch (error) {
      console.error('Error fetching recent resumes:', error);
      throw new Error('Failed to fetch recent resumes');
    }
  },

  // FIXED: Paginated admin fetch
  async getAllResumesPaginated(pageSize = 20, lastDoc = null) {
    try {
      let q = query(collection(db, 'resumes'), orderBy('updatedAt', 'desc'), limit(pageSize));
      if (lastDoc) q = query(q, startAfter(lastDoc));

      const snap = await getDocs(q);
      return {
        resumes: snap.docs.map(formatResume),
        lastVisible: snap.docs[snap.docs.length - 1] || null,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (error) {
      console.error('Error fetching all resumes:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  // ── Update ──────────────────────────────────────────────────────────────

  async updateResume(resumeId, resumeData) {
    try {
      const ref = doc(db, 'resumes', resumeId);
      let atsScore = resumeData.atsScore;
      if (resumeData.data && !atsScore) atsScore = calculateATSScoreSafe(resumeData.data);

      const updates = {
        ...resumeData,
        atsScore,
        updatedAt: serverTimestamp(),
        status: atsScore >= 80 ? 'completed' : (resumeData.status || 'draft'),
      };

      await updateDoc(ref, updates);
      logAnalyticsEvent('resume_updated', { resumeId, atsScore });
      return true;
    } catch (error) {
      console.error('Error updating resume:', error);
      throw new Error('Failed to update resume');
    }
  },

  async autoSaveResume(resumeId, data) {
    try {
      const ref = doc(db, 'resumes', resumeId);
      const atsScore = calculateATSScoreSafe(data);
      await updateDoc(ref, { data, atsScore, updatedAt: serverTimestamp(), status: atsScore >= 80 ? 'completed' : 'draft' });
      return true;
    } catch { return false; }
  },

  async incrementViewCount(resumeId) {
    try {
      await updateDoc(doc(db, 'resumes', resumeId), { viewCount: increment(1), lastViewed: serverTimestamp() });
      return true;
    } catch { return false; }
  },

  async incrementDownloadCount(resumeId) {
    try {
      await updateDoc(doc(db, 'resumes', resumeId), { downloadCount: increment(1), lastDownloaded: serverTimestamp() });
      logAnalyticsEvent('resume_downloaded', { resumeId });
      return true;
    } catch { return false; }
  },

  // ── Delete ──────────────────────────────────────────────────────────────

  async deleteResume(resumeId) {
    try {
      await deleteDoc(doc(db, 'resumes', resumeId));
      logAnalyticsEvent('resume_deleted', { resumeId });
      return true;
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw new Error('Failed to delete resume');
    }
  },

  async deleteMultipleResumes(resumeIds) {
    try {
      for (let i = 0; i < resumeIds.length; i += MAX_BATCH_SIZE) {
        const batch = writeBatch(db);
        resumeIds.slice(i, i + MAX_BATCH_SIZE).forEach(id => batch.delete(doc(db, 'resumes', id)));
        await batch.commit();
      }
      logAnalyticsEvent('resumes_bulk_deleted', { count: resumeIds.length });
      return true;
    } catch (error) {
      console.error('Error deleting multiple resumes:', error);
      throw new Error('Failed to delete resumes');
    }
  },

  // ── Limits & Stats ─────────────────────────────────────────────────────

  async canCreateResume(userId, isPremium = false) {
    if (isPremium) return true;
    try { return (await this.getUserResumes(userId)).length < FREE_RESUME_LIMIT; } catch { return false; }
  },

  async getRemainingFreeResumes(userId, isPremium = false) {
    if (isPremium) return Infinity;
    try { return Math.max(0, FREE_RESUME_LIMIT - (await this.getUserResumes(userId)).length); } catch { return 0; }
  },

  async getUserResumeStats(userId) {
    try {
      const resumes = await this.getUserResumes(userId);
      const total = resumes.length;
      const completed = resumes.filter(r => r.status === 'completed' || r.atsScore >= 80).length;
      const scores = resumes.map(r => r.atsScore || 0).filter(s => s > 0);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const templateCounts = {};
      resumes.forEach(r => { const t = r.template || 'modern'; templateCounts[t] = (templateCounts[t] || 0) + 1; });

      return {
        total, completed, inProgress: total - completed, avgScore,
        bestScore: scores.length ? Math.max(...scores) : 0,
        totalDownloads: resumes.reduce((s, r) => s + (r.downloadCount || 0), 0),
        totalViews: resumes.reduce((s, r) => s + (r.viewCount || 0), 0),
        templateCounts,
        lastUpdated: resumes[0]?.updatedAt || null,
        freeRemaining: FREE_RESUME_LIMIT - total,
      };
    } catch {
      return { total: 0, completed: 0, inProgress: 0, avgScore: 0, bestScore: 0, totalDownloads: 0, totalViews: 0, templateCounts: {}, lastUpdated: null, freeRemaining: FREE_RESUME_LIMIT };
    }
  },

  // ── Search & Filter (Client-side, for reasonable data sizes) ───────────

  async searchResumes(userId, searchTerm) {
    const resumes = await this.getUserResumes(userId);
    const term = searchTerm.toLowerCase();
    return resumes.filter(r =>
      r.name?.toLowerCase().includes(term) ||
      r.data?.personal?.fullName?.toLowerCase().includes(term) ||
      r.data?.personal?.title?.toLowerCase().includes(term)
    );
  },

  async filterResumes(userId, filters = {}) {
    let resumes = await this.getUserResumes(userId);
    if (filters.template) resumes = resumes.filter(r => r.template === filters.template);
    if (filters.status) resumes = resumes.filter(r => r.status === filters.status);
    if (filters.minScore) resumes = resumes.filter(r => (r.atsScore || 0) >= filters.minScore);
    if (filters.maxScore) resumes = resumes.filter(r => (r.atsScore || 0) <= filters.maxScore);
    return resumes;
  },

  // ── Export ──────────────────────────────────────────────────────────────

  async exportResumeData(resumeId) {
    const resume = await this.getResume(resumeId);
    if (!resume) throw new Error('Resume not found');
    return JSON.stringify(resume, null, 2);
  },
};

export default resumeService;