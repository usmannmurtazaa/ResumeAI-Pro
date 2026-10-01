import { getIdToken } from 'firebase/auth';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
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
} from 'firebase/firestore';
import { auth, db, logAnalyticsEvent } from './firebase';
import { calculateDetailedScore } from '../utils/atsScoring';
import { FREE_RESUME_LIMIT } from '../data/constants';
const MAX_BATCH_SIZE = 400;

// Upper bound on the number of resume documents that `getUserResumeStats`
// fetches to compute per-document aggregates (average score, template
// counts, etc.). Firestore aggregate queries cannot compute these fields,
// so a bounded slice is used. The authoritative `total` is computed
// separately via `getCountFromServer` and is not affected by this bound.
const STATS_SAMPLE_LIMIT = 200;

// ── Field whitelist for resume updates ────────────────────────────────────
// Mirrors `isAllowedResumeUpdate()` in `firestore.rules`. Keeping the
// client-side whitelist aligned with the rules means:
//   • A mis-typed prop in a caller is silently dropped here instead of
//     producing a confusing `Missing or insufficient permissions` from
//     Firestore.
//   • Identity / ownership fields (`userId`, `createdAt`, `id`, …) never
//     reach Firestore even if a caller accidentally includes them.
// If the rules list changes, this set must be updated to match.
const ALLOWED_RESUME_UPDATE_FIELDS = new Set([
  'data',
  'template',
  'name',
  'status',
  'atsScore',
  'downloadCount',
  'viewCount',
  'lastDownloaded',
  'lastViewed',
  'archivedAt',
]);

// ── Safe ATS Score Calculation ────────────────────────────────────────────
//
// Delegates to `atsScoring.calculateDetailedScore` — the canonical scorer
// used throughout the application — so a resume produces the same score
// regardless of whether it was computed here or in the builder. The
// previous implementation used an additive heuristic that produced a
// different value for the same input.
//
// The try/catch guards against circular-reference input, which would
// throw inside the scorer's `JSON.stringify`. Non-object input is
// tolerated by the scorer's own optional chaining.

const calculateATSScoreSafe = (data) => {
  try {
    return calculateDetailedScore(data).overall;
  } catch {
    return 0;
  }
};

// ── Utilities ──────────────────────────────────────────────────────────────

const toDateISO = (value) => {
  if (!value) return null;
  try {
    return value.toDate?.()?.toISOString() || value;
  } catch {
    return value;
  }
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

/**
 * Reports a failed counter increment (H-26).
 *
 * Counter increments are fire-and-forget: their failures are non-critical
 * for the user-visible flow, and the callers of `incrementViewCount` and
 * `incrementDownloadCount` do not expect an exception. But a *silent*
 * failure — as in the previous implementation — hides genuine problems
 * (a `permission-denied` from a misaligned field whitelist, a `not-found`
 * from a concurrently deleted resume, or a `resource-exhausted` from a
 * Spark-plan quota overrun) and makes silent counter drift
 * indistinguishable from "the counter just didn't go up".
 *
 * This helper makes those failures observable without changing the
 * fire-and-forget contract:
 *   • In development, the full error is logged to the console.
 *   • In every environment, a structured `counter_write_failed` analytics
 *     event is emitted with the counter name and the Firestore error code,
 *     so drift is visible in GA4 dashboards rather than invisible.
 *
 * No user-facing toast or retry is emitted. The count is cosmetic, and a
 * toast for every failed view would be noisy. Retry is deliberately
 * omitted: `increment(1)` is atomic on the server, so a retry after a
 * lost response would double-count. Seeing the failure first lets an
 * operator decide, with evidence, whether retry is worth that risk.
 *
 * The return value of the calling method remains `false`, so callers keep
 * their existing optimistic-update contract.
 */
const reportCounterFailure = (counterName, resumeId, error) => {
  const code = error?.code || 'unknown';

  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[resumeService] Failed to increment ${counterName} for resume "${resumeId}" (${code})`,
      error
    );
  }

  // Structured event in every environment so drift shows up in GA4 rather
  // than vanishing. Analytics is free on Spark plan and does not touch
  // Firestore.
  try {
    logAnalyticsEvent('counter_write_failed', {
      counter: counterName,
      resumeId,
      error_code: code,
    });
  } catch {
    // The failure report itself must never break the calling flow. This is
    // a fire-and-forget path; if even the failure report fails, we have
    // done what we can.
  }
};

// ── Resume Service ─────────────────────────────────────────────────────────

export const resumeService = {
  // ── Create ─────────────────────────────────────────────────────────────
  //
  // Server-side delegation (C-09):
  //   Direct client-side resume creation is denied by `firestore.rules`
  //   (`allow create: if isPrivilegedAdmin()`). The Netlify Function
  //   `/.netlify/functions/create-resume` performs the write with the
  //   Firebase Admin SDK, which bypasses rules, so this method works for
  //   every authenticated user.
  //
  //   The `userId` parameter is retained for API compatibility. Ownership
  //   is derived server-side from the verified ID token, so a client
  //   cannot spoof a different user.

  async createResume(userId, resumeData) {
    // `userId` is intentionally not used for ownership. See the block
    // comment above. The parameter is kept so existing callers do not
    // need to change.
    void userId;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await getIdToken(currentUser, true);

      const payload = {
        name: resumeData?.name || 'Untitled Resume',
        template: resumeData?.template || 'modern',
        data: resumeData?.data || {},
        atsScore:
          typeof resumeData?.atsScore === 'number'
            ? resumeData.atsScore
            : calculateATSScoreSafe(resumeData?.data || {}),
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
        const error = new Error(errorData.message || 'Failed to create resume');
        error.status = response.status;
        throw error;
      }

      const newResume = await response.json();

      logAnalyticsEvent('resume_created', {
        resumeId: newResume.id,
        template: newResume.template,
        atsScore: newResume.atsScore,
      });

      return {
        id: newResume.id,
        ...newResume,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating resume:', error);
      throw error;
    }
  },

  // ── Duplicate ──────────────────────────────────────────────────────────
  //
  // Server-side delegation (C-09):
  //   Same reason as `createResume`. The server reads the original via
  //   the Admin SDK, checks ownership, clones the document, and returns
  //   the new record. A client cannot duplicate a resume they do not
  //   own — the server returns 403.
  //
  //   The `userId` parameter is retained for API compatibility and is
  //   not used. Ownership is derived server-side from the verified ID
  //   token.

  async duplicateResume(resumeId, userId) {
    // `userId` is intentionally not used for ownership. See the block
    // comment above.
    void userId;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    if (!resumeId || typeof resumeId !== 'string') {
      throw new Error('A valid resumeId is required');
    }

    try {
      const token = await getIdToken(currentUser, true);

      const response = await fetch('/.netlify/functions/duplicate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Failed to duplicate resume');
        error.status = response.status;
        throw error;
      }

      const duplicated = await response.json();

      logAnalyticsEvent('resume_duplicated', {
        originalId: resumeId,
        newId: duplicated.id,
      });

      return {
        id: duplicated.id,
        ...duplicated,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error duplicating resume:', error);
      throw error;
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
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(formatResume);
    } catch (error) {
      console.error('Error fetching user resumes:', error);
      throw new Error('Failed to fetch resumes');
    }
  },

  async getUserResumesPaginated(userId, pageSize = 10, lastDoc = null) {
    try {
      let q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(pageSize)
      );
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
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(count)
      );
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
    // Argument validation - fail fast with a clear message rather than
    // sending a malformed payload to Firestore.
    if (!resumeId || typeof resumeId !== 'string') {
      throw new Error('A valid resumeId is required');
    }
    if (!resumeData || typeof resumeData !== 'object') {
      throw new Error('A valid updates object is required');
    }

    try {
      const ref = doc(db, 'resumes', resumeId);

      // 1. Whitelist the caller-supplied fields. Anything not on the
      //    allow-list is dropped here so it never reaches Firestore.
      //    This matches the server-side `isAllowedResumeUpdate()` rule.
      const safeUpdates = {};
      for (const key of Object.keys(resumeData)) {
        if (ALLOWED_RESUME_UPDATE_FIELDS.has(key) && resumeData[key] !== undefined) {
          safeUpdates[key] = resumeData[key];
        }
      }

      // 2. Compute the ATS score only when the caller supplied fresh
      //    `data` AND did not explicitly pass a numeric `atsScore`.
      let atsScore;
      if (typeof safeUpdates.atsScore === 'number') {
        atsScore = safeUpdates.atsScore;
      } else if (safeUpdates.data) {
        atsScore = calculateATSScoreSafe(safeUpdates.data);
      }

      // 3. Determine the status.
      //    - If the caller explicitly provided a non-empty status, that
      //      value wins (e.g. `status: 'archived'` from archiveResume).
      //    - Otherwise, derive it from the score, but only when we have
      //      a numeric score to derive from. Do NOT downgrade the status
      //      on updates that have nothing to do with the resume content
      //      (e.g. bumping `downloadCount`).
      const hasExplicitStatus =
        typeof safeUpdates.status === 'string' && safeUpdates.status.length > 0;
      let status;
      if (hasExplicitStatus) {
        status = safeUpdates.status;
      } else if (typeof atsScore === 'number') {
        status = atsScore >= 80 ? 'completed' : 'draft';
      }

      // 4. Build the final payload. `updatedAt` is added here - after the
      //    whitelist - so it is always included and never accidentally
      //    dropped by the field filter.
      const updates = {
        ...safeUpdates,
        updatedAt: serverTimestamp(),
      };
      if (typeof atsScore === 'number') {
        updates.atsScore = atsScore;
      }
      if (status) {
        updates.status = status;
      }

      await updateDoc(ref, updates);
      logAnalyticsEvent('resume_updated', {
        resumeId,
        atsScore: typeof atsScore === 'number' ? atsScore : null,
      });
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
      await updateDoc(ref, {
        data,
        atsScore,
        updatedAt: serverTimestamp(),
        status: atsScore >= 80 ? 'completed' : 'draft',
      });
      return true;
    } catch {
      return false;
    }
  },

  // ── Counters (H-26) ────────────────────────────────────────────────────
  //
  // Both counter increments are fire-and-forget: they return a boolean and
  // never throw, so the calling flow (an in-flight resume view or a download
  // whose file has already been generated) is never interrupted by a counter
  // failure. The previous implementation used an anonymous
  // `catch { return false; }` that discarded every error — including
  // `permission-denied` from a rules/whitelist mismatch — and left silent
  // counter drift invisible. Failures are now reported through
  // `reportCounterFailure` above.

  async incrementViewCount(resumeId) {
    if (!resumeId || typeof resumeId !== 'string') {
      reportCounterFailure(
        'viewCount',
        resumeId,
        Object.assign(new Error('Invalid resumeId'), { code: 'invalid-argument' })
      );
      return false;
    }
    try {
      await updateDoc(doc(db, 'resumes', resumeId), {
        viewCount: increment(1),
        lastViewed: serverTimestamp(),
      });
      return true;
    } catch (error) {
      reportCounterFailure('viewCount', resumeId, error);
      return false;
    }
  },

  async incrementDownloadCount(resumeId) {
    if (!resumeId || typeof resumeId !== 'string') {
      reportCounterFailure(
        'downloadCount',
        resumeId,
        Object.assign(new Error('Invalid resumeId'), { code: 'invalid-argument' })
      );
      return false;
    }
    try {
      await updateDoc(doc(db, 'resumes', resumeId), {
        downloadCount: increment(1),
        lastDownloaded: serverTimestamp(),
      });
      logAnalyticsEvent('resume_downloaded', { resumeId });
      return true;
    } catch (error) {
      reportCounterFailure('downloadCount', resumeId, error);
      return false;
    }
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
        resumeIds
          .slice(i, i + MAX_BATCH_SIZE)
          .forEach((id) => batch.delete(doc(db, 'resumes', id)));
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
  //
  // All three methods below previously read every resume in the user's
  // collection just to count them. On Spark plan this scales linearly with
  // the number of resumes a user has created. They now use Firestore's
  // aggregate `count()` queries, which are billed at approximately 1 read
  // per 1,000 matching documents (minimum 1 read per query), so the cost of
  // these calls is effectively constant regardless of resume count.

  async canCreateResume(userId, isPremium = false) {
    if (isPremium) return true;
    try {
      const snap = await getCountFromServer(
        query(collection(db, 'resumes'), where('userId', '==', userId))
      );
      return (snap.data().count || 0) < FREE_RESUME_LIMIT;
    } catch {
      return false;
    }
  },

  async getRemainingFreeResumes(userId, isPremium = false) {
    if (isPremium) return Infinity;
    try {
      const snap = await getCountFromServer(
        query(collection(db, 'resumes'), where('userId', '==', userId))
      );
      const total = snap.data().count || 0;
      // Defensive: clamp to 0. A premium user whose subscription lapses
      // mid-session could otherwise see a negative "remaining" count.
      return Math.max(0, FREE_RESUME_LIMIT - total);
    } catch {
      return 0;
    }
  },

  // ── getUserResumeStats ─────────────────────────────────────────────────
  // Computes aggregate statistics for a user's resumes.
  //
  // Authoritative `total` — fetched via `getCountFromServer`, exact for any
  // number of resumes.
  //
  // Derived fields — `completed`, `avgScore`, `bestScore`, `templateCounts`,
  // `totalDownloads`, `totalViews`, `lastUpdated` — require per-document
  // data that Firestore aggregates cannot compute. They are computed from a
  // bounded slice of the `STATS_SAMPLE_LIMIT` most recently updated resumes.
  // For users with ≤ STATS_SAMPLE_LIMIT resumes (the overwhelming majority),
  // the values are identical to the previous implementation. For users above
  // the bound, the derived fields reflect the most recent slice rather than
  // the entire collection; `total` remains exact.
  //
  // If the bound ever needs to be removed, note that it exists to cap the
  // read cost of this call — do not delete it without measuring the impact
  // on the Spark-plan quota for the highest-volume users.
  async getUserResumeStats(userId) {
    try {
      const [totalSnap, sampleSnap] = await Promise.all([
        getCountFromServer(query(collection(db, 'resumes'), where('userId', '==', userId))),
        getDocs(
          query(
            collection(db, 'resumes'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc'),
            limit(STATS_SAMPLE_LIMIT)
          )
        ),
      ]);

      const total = totalSnap.data().count || 0;
      const sample = sampleSnap.docs.map(formatResume);

      const completed = sample.filter((r) => r.status === 'completed' || r.atsScore >= 80).length;
      const scores = sample.map((r) => r.atsScore || 0).filter((s) => s > 0);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const templateCounts = {};
      sample.forEach((r) => {
        const t = r.template || 'modern';
        templateCounts[t] = (templateCounts[t] || 0) + 1;
      });

      return {
        total,
        completed,
        // Clamp to 0 for the same reason as `getRemainingFreeResumes`: the
        // sample-derived `completed` cannot exceed the aggregate `total` in
        // steady state, but a replication lag between the two parallel
        // queries could momentarily produce `completed > total`.
        inProgress: Math.max(0, total - completed),
        avgScore,
        bestScore: scores.length ? Math.max(...scores) : 0,
        totalDownloads: sample.reduce((s, r) => s + (r.downloadCount || 0), 0),
        totalViews: sample.reduce((s, r) => s + (r.viewCount || 0), 0),
        templateCounts,
        lastUpdated: sample[0]?.updatedAt || null,
        freeRemaining: Math.max(0, FREE_RESUME_LIMIT - total),
      };
    } catch {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        avgScore: 0,
        bestScore: 0,
        totalDownloads: 0,
        totalViews: 0,
        templateCounts: {},
        lastUpdated: null,
        freeRemaining: FREE_RESUME_LIMIT,
      };
    }
  },

  // ── Search & Filter (Client-side, for reasonable data sizes) ───────────

  async searchResumes(userId, searchTerm) {
    const resumes = await this.getUserResumes(userId);
    const term = searchTerm.toLowerCase();
    return resumes.filter(
      (r) =>
        r.name?.toLowerCase().includes(term) ||
        r.data?.personal?.fullName?.toLowerCase().includes(term) ||
        r.data?.personal?.title?.toLowerCase().includes(term)
    );
  },

  async filterResumes(userId, filters = {}) {
    let resumes = await this.getUserResumes(userId);
    if (filters.template) resumes = resumes.filter((r) => r.template === filters.template);
    if (filters.status) resumes = resumes.filter((r) => r.status === filters.status);
    if (filters.minScore) resumes = resumes.filter((r) => (r.atsScore || 0) >= filters.minScore);
    if (filters.maxScore) resumes = resumes.filter((r) => (r.atsScore || 0) <= filters.maxScore);
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
