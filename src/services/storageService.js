import { 
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
  listAll, uploadBytes,
} from 'firebase/storage';
import { storage } from './firebase';

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

// ── Utilities ──────────────────────────────────────────────────────────────

const generateFileName = (originalName, prefix = '') => {
  const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';
  const sanitized = originalName.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 50);
  return `${prefix}${Date.now()}_${sanitized}${ext}`;
};

const extractPathFromURL = (url) => {
  try {
    const decoded = decodeURIComponent(url);
    // Handle Firebase Storage URLs
    const match = decoded.match(/\/o\/(.+?)(\?|$)/);
    if (match) return match[1];
    // Handle gs:// URLs
    if (decoded.startsWith('gs://')) {
      const parts = decoded.replace('gs://', '').split('/');
      return parts.slice(1).join('/');
    }
    return decoded;
  } catch {
    return url;
  }
};

const validateFile = (file, allowedTypes, maxSize = MAX_FILE_SIZE) => {
  if (!file) throw new Error('No file provided');
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
  }
  if (file.size > maxSize) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${maxSize / 1024 / 1024}MB`);
  }
};

// ── Storage Service ────────────────────────────────────────────────────────

export const storageService = {
  /**
   * Upload a resume PDF with progress tracking.
   * 
   * @param {string} userId - User ID
   * @param {string} resumeId - Resume ID
   * @param {File} file - PDF file to upload
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadResumePDF(userId, resumeId, file, onProgress) {
    validateFile(file, ALLOWED_DOC_TYPES);

    const fileName = generateFileName(file.name, 'resume_');
    const path = `resumes/${userId}/${resumeId}/${fileName}`;
    const fileRef = ref(storage, path);

    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type || 'application/pdf',
      customMetadata: { userId, resumeId, uploadedAt: new Date().toISOString() },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
          onProgress?.(progress);
        },
        (error) => {
          console.error('Resume upload failed:', error);
          reject(new Error('Failed to upload resume. Please try again.'));
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url, path });
          } catch (error) {
            reject(new Error('Failed to get download URL.'));
          }
        }
      );
    });
  },

  /**
   * Upload a profile picture with progress tracking.
   * 
   * @param {string} userId - User ID
   * @param {File} file - Image file
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadProfilePicture(userId, file, onProgress) {
    validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024); // 5MB max for images

    const fileName = generateFileName(file.name, 'avatar_');
    const path = `avatars/${userId}/${fileName}`;
    const fileRef = ref(storage, path);

    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type || 'image/jpeg',
      customMetadata: { userId, uploadedAt: new Date().toISOString() },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
          onProgress?.(progress);
        },
        (error) => {
          console.error('Profile picture upload failed:', error);
          reject(new Error('Failed to upload profile picture. Please try again.'));
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url, path });
          } catch (error) {
            reject(new Error('Failed to get download URL.'));
          }
        }
      );
    });
  },

  /**
   * Quick upload for small files (no progress tracking).
   * 
   * @param {string} path - Storage path
   * @param {File} file - File to upload
   * @returns {Promise<string>} Download URL
   */
  async uploadFile(path, file) {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file, { contentType: file.type || undefined });
    return getDownloadURL(fileRef);
  },

  /**
   * Delete a file by its download URL or storage path.
   * 
   * @param {string} urlOrPath - Download URL or storage path
   * @returns {Promise<boolean>}
   */
  async deleteFile(urlOrPath) {
    try {
      const path = extractPathFromURL(urlOrPath);
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      // File not found is not a critical error
      if (error.code === 'storage/object-not-found') {
        return true;
      }
      console.error('Error deleting file:', error);
      return false;
    }
  },

  /**
   * Delete multiple files at once.
   * 
   * @param {string[]} urlsOrPaths - Array of download URLs or storage paths
   * @returns {Promise<{deleted: number, failed: number}>}
   */
  async deleteMultipleFiles(urlsOrPaths) {
    let deleted = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      urlsOrPaths.map(url => this.deleteFile(url))
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) deleted++;
      else failed++;
    });

    return { deleted, failed };
  },

  /**
   * Get all files in a user's resumes folder.
   * 
   * @param {string} userId - User ID
   * @param {number} maxResults - Maximum files to return (default: 100)
   * @returns {Promise<Array<{name: string, url: string, path: string}>>}
   */
  async getUserResumeFiles(userId, maxResults = 100) {
    try {
      const folderRef = ref(storage, `resumes/${userId}`);
      const result = await listAll(folderRef);
      
      // Limit results
      const items = result.items.slice(0, maxResults);

      const files = await Promise.all(
        items.map(async (itemRef) => ({
          name: itemRef.name,
          path: itemRef.fullPath,
          url: await getDownloadURL(itemRef),
        }))
      );

      return files;
    } catch (error) {
      console.error('Error listing user files:', error);
      return [];
    }
  },

  /**
   * Delete all files in a user's folder (for account deletion).
   * 
   * @param {string} userId - User ID
   * @returns {Promise<{deleted: number, failed: number}>}
   */
  async deleteAllUserFiles(userId) {
    try {
      const getRecursiveRefs = async (path) => {
        const folderRef = ref(storage, path);
        const result = await listAll(folderRef);
        let refs = [...result.items];

        // Recurse into subfolders
        for (const prefix of result.prefixes) {
          const subRefs = await getRecursiveRefs(prefix.fullPath);
          refs = [...refs, ...subRefs];
        }

        return refs;
      };

      const allRefs = await getRecursiveRefs(`resumes/${userId}`);
      const avatarRefs = await getRecursiveRefs(`avatars/${userId}`);

      const allPaths = [...allRefs, ...avatarRefs].map(r => r.fullPath);
      return this.deleteMultipleFiles(allPaths);
    } catch (error) {
      console.error('Error deleting all user files:', error);
      return { deleted: 0, failed: 1 };
    }
  },

  /**
   * Get a download URL from a storage path.
   * 
   * @param {string} path - Storage path
   * @returns {Promise<string>} Download URL
   */
  async getDownloadUrl(path) {
    try {
      const fileRef = ref(storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  },
};

export default storageService;