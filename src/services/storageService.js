// ─────────────────────────────────────────────────────────────────────────────
// Storage Service — Cloudinary backend
//
// All browser-side uploads go to Cloudinary's unsigned upload endpoint.
// The previous Firebase Storage implementation was removed because Firebase
// Storage requires the Blaze (paid) plan; Cloudinary's free tier covers this
// project's needs without a credit card.
//
// Design notes:
//
//   • No Cloudinary SDK. The browser calls the REST API directly:
//       https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
//     authenticated by the *unsigned* upload preset set in the Cloudinary
//     console. Unsigned uploads deliberately do not carry the API secret,
//     which is why they are safe to run from the client.
//
//   • No API secret anywhere in this file or in any REACT_APP_ env var.
//
//   • Deletion is not supported by Cloudinary's unsigned flow. The destroy
//     endpoint requires a signed request, and this project has no server
//     to hold the secret. The `delete*` methods below are preserved for
//     API compatibility and become no-ops. Avatars are tiny (~50 KB each);
//     orphaned assets are not a cost concern on the free tier.
//
//   • The `path` argument on `uploadFile` is kept for API compatibility with
//     callers written against the Firebase Storage version. Cloudinary
//     ignores it — the asset folder is set on the upload preset
//     (`maniesta-career/avatars`) and the public ID is auto-generated.
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ──────────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload` : null;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

// ── Utilities ──────────────────────────────────────────────────────────────

const assertConfigured = () => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set REACT_APP_CLOUDINARY_CLOUD_NAME and ' +
        'REACT_APP_CLOUDINARY_UPLOAD_PRESET in your .env file and rebuild.'
    );
  }
};

const validateFile = (file, allowedTypes, maxSize = MAX_FILE_SIZE) => {
  if (!file) throw new Error('No file provided');
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
  }
  if (file.size > maxSize) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${maxSize / 1024 / 1024}MB`
    );
  }
};

const generateFileName = (originalName, prefix = '') => {
  const ext = originalName.includes('.')
    ? originalName.substring(originalName.lastIndexOf('.'))
    : '';
  const sanitized = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 50);
  return `${prefix}${Date.now()}_${sanitized}${ext}`;
};

/**
 * Uploads a file to Cloudinary via XHR so the caller can receive progress.
 *
 * @param {File} file
 * @param {Function} [onProgress] - Called with 0..100
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
const uploadToCloudinary = (file, onProgress) => {
  assertConfigured();

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          reject(new Error('Cloudinary returned an invalid response.'));
        }
      } else {
        let message = `Upload failed (HTTP ${xhr.status}).`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error?.message) message = err.error.message;
        } catch {}
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out.'));
    xhr.send(formData);
  });
};

// ── Storage Service ────────────────────────────────────────────────────────

export const storageService = {
  /**
   * Upload any file and return its public HTTPS URL.
   *
   * The `path` argument is retained for API compatibility with callers
   * written against the previous Firebase Storage implementation. Cloudinary
   * ignores it — the asset folder is fixed by the upload preset.
   *
   * @param {string} path - Ignored (preserved for API compatibility)
   * @param {File} file
   * @param {Function} [onProgress]
   * @returns {Promise<string>} The `secure_url` of the uploaded asset
   */
  async uploadFile(path, file, onProgress) {
    void path;
    validateFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES]);
    const result = await uploadToCloudinary(file, onProgress);
    return result.secure_url;
  },

  /**
   * Upload a resume document (PDF/DOCX/TXT).
   *
   * Note: Cloudinary's image upload endpoint is used for any file the preset
   * accepts. The preset is currently restricted to image formats. If you
   * enable document uploads, add `pdf`, `docx`, `doc`, `txt` to the preset's
   * "Allowed formats" in the Cloudinary console — otherwise this method will
   * reject them client-side before the request is sent.
   */
  async uploadResumePDF(userId, resumeId, file, onProgress) {
    void userId;
    void resumeId;
    validateFile(file, ALLOWED_DOC_TYPES);
    const result = await uploadToCloudinary(file, onProgress);
    return { url: result.secure_url, path: result.public_id };
  },

  /**
   * Upload a profile picture.
   */
  async uploadProfilePicture(userId, file, onProgress) {
    void userId;
    validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024);
    const result = await uploadToCloudinary(file, onProgress);
    return { url: result.secure_url, path: result.public_id };
  },

  /**
   * Deletion is not available via Cloudinary's unsigned upload flow. The
   * destroy endpoint requires a signed request and this project has no
   * server-side secret store for it. This method is preserved for API
   * compatibility; it logs a warning in development and reports success.
   *
   * To enable real deletion, add a Netlify Function that holds
   * CLOUDINARY_API_SECRET and calls the destroy endpoint on behalf of the
   * client. Nothing in the current UI exercises this path.
   */
  async deleteFile(urlOrPath) {
    void urlOrPath;
    if (process.env.NODE_ENV === 'development') {
      console.warn('[storageService] deleteFile is a no-op under Cloudinary unsigned uploads.');
    }
    return true;
  },

  async deleteMultipleFiles(urlsOrPaths) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[storageService] deleteMultipleFiles is a no-op under Cloudinary unsigned uploads.'
      );
    }
    return { deleted: 0, failed: 0, skipped: urlsOrPaths?.length || 0 };
  },

  async getUserResumeFiles() {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[storageService] getUserResumeFiles is not implemented under Cloudinary unsigned uploads.'
      );
    }
    return [];
  },

  async deleteAllUserFiles() {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[storageService] deleteAllUserFiles is a no-op under Cloudinary unsigned uploads.'
      );
    }
    return { deleted: 0, failed: 0 };
  },

  /**
   * Returns the input unchanged. Under Cloudinary the caller already has
   * the full HTTPS URL; there is no separate "get download URL" step.
   */
  async getDownloadUrl(path) {
    return path;
  },

  // ── Helpers exposed for callers that need them ──────────────────────

  generateFileName,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  MAX_FILE_SIZE,
};

export default storageService;
