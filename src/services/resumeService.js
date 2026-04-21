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
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  increment,
  limitToLast
} from 'firebase/firestore';
import { db, logAnalyticsEvent } from './firebase';
import { calculateATSScore } from '../utils/atsKeywords';

// Constants
const FREE_RESUME_LIMIT = 5;

export const resumeService = {
  // ============================================
  // CREATE OPERATIONS
  // ============================================
  
  /**
   * Create a new resume
   */
  async createResume(userId, resumeData) {
    try {
      const resumeRef = doc(collection(db, 'resumes'));
      const atsScore = calculateATSScore(resumeData.data || {});
      
      const data = {
        ...resumeData,
        userId,
        atsScore,
        downloadCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
        status: atsScore >= 80 ? 'completed' : 'draft'
      };
      
      await setDoc(resumeRef, data);
      
      // Log analytics
      logAnalyticsEvent('resume_created', {
        resumeId: resumeRef.id,
        template: resumeData.template,
        atsScore
      });
      
      return { 
        id: resumeRef.id, 
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating resume:', error);
      throw new Error('Failed to create resume');
    }
  },

  /**
   * Duplicate a resume
   */
  async duplicateResume(resumeId, userId) {
    try {
      const original = await this.getResume(resumeId);
      if (!original) {
        throw new Error('Original resume not found');
      }
      
      const { id, createdAt, updatedAt, downloadCount, viewCount, ...resumeData } = original;
      
      const duplicated = await this.createResume(userId, {
        ...resumeData,
        name: `${resumeData.name || 'Untitled'} (Copy)`,
        status: 'draft'
      });
      
      logAnalyticsEvent('resume_duplicated', {
        originalId: resumeId,
        newId: duplicated.id
      });
      
      return duplicated;
    } catch (error) {
      console.error('Error duplicating resume:', error);
      throw new Error('Failed to duplicate resume');
    }
  },

  // ============================================
  // READ OPERATIONS
  // ============================================
  
  /**
   * Get a single resume by ID
   */
  async getResume(resumeId) {
    try {
      const resumeDoc = await getDoc(doc(db, 'resumes', resumeId));
      if (resumeDoc.exists()) {
        const data = resumeDoc.data();
        
        // Increment view count (fire and forget)
        this.incrementViewCount(resumeId).catch(console.error);
        
        return { 
          id: resumeDoc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching resume:', error);
      throw new Error('Failed to fetch resume');
    }
  },

  /**
   * Get all resumes for a user
   */
  async getUserResumes(userId) {
    try {
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });
    } catch (error) {
      console.error('Error fetching user resumes:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  /**
   * Get paginated resumes for a user
   */
  async getUserResumesPaginated(userId, pageSize = 10, lastDoc = null) {
    try {
      let q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(pageSize)
      );
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const querySnapshot = await getDocs(q);
      const resumes = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return {
        resumes,
        lastVisible,
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error fetching paginated resumes:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  /**
   * Get recent resumes for a user
   */
  async getRecentResumes(userId, limitCount = 5) {
    try {
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });
    } catch (error) {
      console.error('Error fetching recent resumes:', error);
      throw new Error('Failed to fetch recent resumes');
    }
  },

  /**
   * Get all resumes (admin only)
   */
  async getAllResumes() {
    try {
      const querySnapshot = await getDocs(collection(db, 'resumes'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });
    } catch (error) {
      console.error('Error fetching all resumes:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  /**
   * Get resumes by template type
   */
  async getResumesByTemplate(userId, template) {
    try {
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        where('template', '==', template),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });
    } catch (error) {
      console.error('Error fetching resumes by template:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  /**
   * Get resumes by status
   */
  async getResumesByStatus(userId, status) {
    try {
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });
    } catch (error) {
      console.error('Error fetching resumes by status:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  // ============================================
  // UPDATE OPERATIONS
  // ============================================
  
  /**
   * Update a resume
   */
  async updateResume(resumeId, resumeData) {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      
      // Calculate ATS score if data is being updated
      let atsScore = resumeData.atsScore;
      if (resumeData.data && !atsScore) {
        atsScore = calculateATSScore(resumeData.data);
      }
      
      const updates = {
        ...resumeData,
        atsScore,
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
        status: atsScore >= 80 ? 'completed' : resumeData.status || 'draft'
      };
      
      await updateDoc(resumeRef, updates);
      
      logAnalyticsEvent('resume_updated', {
        resumeId,
        atsScore
      });
      
      return true;
    } catch (error) {
      console.error('Error updating resume:', error);
      throw new Error('Failed to update resume');
    }
  },

  /**
   * Auto-save resume (silent update)
   */
  async autoSaveResume(resumeId, data) {
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
  },

  /**
   * Increment view count
   */
  async incrementViewCount(resumeId) {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      await updateDoc(resumeRef, {
        viewCount: increment(1),
        lastViewed: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return false;
    }
  },

  /**
   * Increment download count
   */
  async incrementDownloadCount(resumeId) {
    try {
      const resumeRef = doc(db, 'resumes', resumeId);
      await updateDoc(resumeRef, {
        downloadCount: increment(1),
        lastDownloaded: serverTimestamp()
      });
      
      logAnalyticsEvent('resume_downloaded', { resumeId });
      
      return true;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  },

  // ============================================
  // DELETE OPERATIONS
  // ============================================
  
  /**
   * Delete a single resume
   */
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

  /**
   * Delete multiple resumes (batch)
   */
  async deleteMultipleResumes(resumeIds) {
    try {
      const batch = writeBatch(db);
      resumeIds.forEach(id => {
        const resumeRef = doc(db, 'resumes', id);
        batch.delete(resumeRef);
      });
      await batch.commit();
      
      logAnalyticsEvent('resumes_bulk_deleted', { count: resumeIds.length });
      
      return true;
    } catch (error) {
      console.error('Error deleting multiple resumes:', error);
      throw new Error('Failed to delete resumes');
    }
  },

  // ============================================
  // LIMIT & STATS OPERATIONS
  // ============================================
  
  /**
   * Check if user can create more resumes
   */
  async canCreateResume(userId, isPremium = false) {
    if (isPremium) return true;
    
    try {
      const resumes = await this.getUserResumes(userId);
      return resumes.length < FREE_RESUME_LIMIT;
    } catch (error) {
      console.error('Error checking resume limit:', error);
      return false;
    }
  },

  /**
   * Get remaining free resumes count
   */
  async getRemainingFreeResumes(userId, isPremium = false) {
    if (isPremium) return Infinity;
    
    try {
      const resumes = await this.getUserResumes(userId);
      return Math.max(0, FREE_RESUME_LIMIT - resumes.length);
    } catch (error) {
      console.error('Error getting remaining resumes:', error);
      return 0;
    }
  },

  /**
   * Get resume statistics for a user
   */
  async getUserResumeStats(userId) {
    try {
      const resumes = await this.getUserResumes(userId);
      
      const total = resumes.length;
      const completed = resumes.filter(r => r.status === 'completed' || r.atsScore >= 80).length;
      const scores = resumes.map(r => r.atsScore || 0).filter(s => s > 0);
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      const totalDownloads = resumes.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
      const totalViews = resumes.reduce((sum, r) => sum + (r.viewCount || 0), 0);
      
      // Template distribution
      const templateCounts = resumes.reduce((acc, r) => {
        const template = r.template || 'modern';
        acc[template] = (acc[template] || 0) + 1;
        return acc;
      }, {});
      
      // Status distribution
      const statusCounts = resumes.reduce((acc, r) => {
        const status = r.status || 'draft';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        total,
        completed,
        inProgress: total - completed,
        avgScore,
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        worstScore: scores.length > 0 ? Math.min(...scores) : 0,
        totalDownloads,
        totalViews,
        templateCounts,
        statusCounts,
        lastUpdated: resumes.length > 0 ? resumes[0].updatedAt : null,
        freeRemaining: FREE_RESUME_LIMIT - total
      };
    } catch (error) {
      console.error('Error getting resume stats:', error);
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        avgScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalDownloads: 0,
        totalViews: 0,
        templateCounts: {},
        statusCounts: {},
        lastUpdated: null,
        freeRemaining: FREE_RESUME_LIMIT
      };
    }
  },

  // ============================================
  // SEARCH OPERATIONS
  // ============================================
  
  /**
   * Search resumes by name or content (client-side)
   */
  async searchResumes(userId, searchTerm) {
    try {
      const resumes = await this.getUserResumes(userId);
      const term = searchTerm.toLowerCase();
      
      return resumes.filter(resume => 
        resume.name?.toLowerCase().includes(term) ||
        resume.data?.personal?.fullName?.toLowerCase().includes(term) ||
        resume.data?.personal?.title?.toLowerCase().includes(term) ||
        resume.data?.personal?.email?.toLowerCase().includes(term) ||
        resume.data?.personal?.summary?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching resumes:', error);
      throw new Error('Failed to search resumes');
    }
  },

  /**
   * Filter resumes by multiple criteria
   */
  async filterResumes(userId, filters = {}) {
    try {
      let resumes = await this.getUserResumes(userId);
      
      if (filters.template) {
        resumes = resumes.filter(r => r.template === filters.template);
      }
      
      if (filters.status) {
        resumes = resumes.filter(r => r.status === filters.status);
      }
      
      if (filters.minScore) {
        resumes = resumes.filter(r => (r.atsScore || 0) >= filters.minScore);
      }
      
      if (filters.maxScore) {
        resumes = resumes.filter(r => (r.atsScore || 0) <= filters.maxScore);
      }
      
      if (filters.hasDownloads) {
        resumes = resumes.filter(r => (r.downloadCount || 0) > 0);
      }
      
      return resumes;
    } catch (error) {
      console.error('Error filtering resumes:', error);
      throw new Error('Failed to filter resumes');
    }
  },

  // ============================================
  // EXPORT OPERATIONS
  // ============================================
  
  /**
   * Export resume data
   */
  async exportResumeData(resumeId, format = 'json') {
    try {
      const resume = await this.getResume(resumeId);
      if (!resume) throw new Error('Resume not found');
      
      if (format === 'json') {
        return JSON.stringify(resume, null, 2);
      } else if (format === 'csv') {
        // Convert to CSV format
        const flatten = (obj, prefix = '') => {
          return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
              Object.assign(acc, flatten(obj[k], pre + k));
            } else {
              acc[pre + k] = obj[k];
            }
            return acc;
          }, {});
        };
        
        const flat = flatten(resume);
        const headers = Object.keys(flat).join(',');
        const values = Object.values(flat).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        
        return `${headers}\n${values}`;
      }
      
      throw new Error('Unsupported format');
    } catch (error) {
      console.error('Error exporting resume:', error);
      throw new Error('Failed to export resume');
    }
  }
};

export default resumeService;