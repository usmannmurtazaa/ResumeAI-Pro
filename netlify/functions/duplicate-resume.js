const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();
const FREE_RESUME_LIMIT = 5;

// ── Payload validation limits ────────────────────────────────────────────
// Firestore caps document IDs at 1,500 bytes (see
// https://firebase.google.com/docs/firestore/quotas). Anything longer is
// rejected by the SDK with an unhelpful "Invalid document reference" error.
// Reject it here so the endpoint returns a clear 400.
const MAX_RESUME_ID_LENGTH = 1500;

/**
 * Validates the client-supplied `resumeId`.
 *
 * Returns `{ valid: true }` when it is a syntactically usable Firestore doc
 * ID, otherwise `{ valid: false, error: '<message>' }`.
 *
 * Rules:
 *   • Must be a string.
 *   • Must be non-empty after trimming.
 *   • Must be at most MAX_RESUME_ID_LENGTH UTF-8 bytes.
 *   • Must not contain `/` - Firestore treats `/` as a path separator, and
 *     `db.collection('resumes').doc('a/b')` becomes a subcollection path
 *     rather than a doc ID.
 */
function validateResumeId(value) {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Field "resumeId" must be a string' };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, error: 'Field "resumeId" is required' };
  }
  if (Buffer.byteLength(trimmed, 'utf8') > MAX_RESUME_ID_LENGTH) {
    return {
      valid: false,
      error: `Field "resumeId" exceeds the maximum allowed length of ${MAX_RESUME_ID_LENGTH} bytes`,
    };
  }
  if (trimmed.includes('/')) {
    return { valid: false, error: 'Field "resumeId" must not contain "/"' };
  }
  return { valid: true };
}

async function isPremiumUser(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  const userRole = userDoc.data()?.role || 'user';

  if (userRole === 'premium' || userRole === 'admin') return true;

  const subscriptionDoc = await db.collection('subscriptions').doc(uid).get();
  const subscription = subscriptionDoc.exists ? subscriptionDoc.data() : null;
  return subscription?.status === 'active' && subscription?.plan === 'premium';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
    };
  }

  // ── Error categorisation ────────────────────────────────────────────
  // The handler distinguishes three categories of failure so the client
  // can respond appropriately and so internal details do not leak:
  //
  //   • 401 - the caller's ID token is missing, expired, or revoked.
  //           The client should prompt for sign-in again.
  //   • 4xx - the request is well-formed but rejected for a business
  //           reason: invalid JSON (400), invalid resumeId (400),
  //           missing resume (404), not the owner (403), free-tier
  //           limit reached (400). Retrying will not help.
  //   • 500 - the server side failed. This includes Firestore failures
  //           and any unexpected exception. The client receives a
  //           generic message; the full error is logged server-side.

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Duplicate resume auth error:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Please sign in again' }),
    };
  }

  try {
    const uid = decodedToken.uid;

    // Parse the request body ourselves so that malformed JSON returns a clean
    // 400 with a clear message, instead of falling through to the outer catch
    // and surfacing the raw `SyntaxError` text to the client.
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON in request body' }),
      };
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Payload must be a JSON object' }),
      };
    }

    // Validate `resumeId` before it is handed to the Admin SDK.
    const validation = validateResumeId(payload.resumeId);
    if (!validation.valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: validation.error }),
      };
    }

    const resumeId = payload.resumeId.trim();
    const originalRef = db.collection('resumes').doc(resumeId);
    const originalSnapshot = await originalRef.get();

    if (!originalSnapshot.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Original resume not found' }),
      };
    }

    const originalData = originalSnapshot.data();
    if (originalData.userId !== uid) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden' }),
      };
    }

    if (!(await isPremiumUser(uid))) {
      const countSnapshot = await db
        .collection('resumes')
        .where('userId', '==', uid)
        .count()
        .get();
      const count = countSnapshot.data().count;

      if (count >= FREE_RESUME_LIMIT) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Resume limit reached' }),
        };
      }
    }

    const resumeRef = db.collection('resumes').doc();
    const now = new Date();

    // Destructure-to-exclude: the `_`-prefixed bindings are declared only
    // so their keys are stripped from `rest`. The clone regenerates all
    // five below. Do NOT remove these bindings - they are load-bearing.
    // The underscore prefix is required by the ESLint
    // `unused-imports/no-unused-vars` rule (`varsIgnorePattern: '^_'`).
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      downloadCount: _downloadCount,
      viewCount: _viewCount,
      ...rest
    } = originalData;

    await resumeRef.set({
      ...rest,
      userId: uid,
      name: `${rest.name || 'Untitled'} (Copy)`,
      status: 'draft',
      downloadCount: 0,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: resumeRef.id,
        ...rest,
        userId: uid,
        name: `${rest.name || 'Untitled'} (Copy)`,
        status: 'draft',
        downloadCount: 0,
        viewCount: 0,
      }),
    };
  } catch (error) {
    console.error('Duplicate resume error:', error);
    // Do not echo `error.message` to the client: Firestore and Admin SDK
    // errors can contain gRPC status codes, resource paths, and internal
    // details that should not reach the browser.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to duplicate resume' }),
    };
  }
};