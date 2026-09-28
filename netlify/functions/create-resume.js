const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();
const FREE_RESUME_LIMIT = 5;

// ── Payload validation limits ────────────────────────────────────────────
// These bound what a client can write into a resume document. The Firestore
// rules for `resumes/{id}` set `allow create: if isPrivilegedAdmin()`, which
// means a normal client cannot create a resume directly - the only way a
// resume gets created is through this function, via the Admin SDK (which
// bypasses rules). That makes these checks the sole server-side guard on the
// shape of the document.
const MAX_NAME_LENGTH = 200;
const MAX_TEMPLATE_LENGTH = 50;
// Firestore caps a single document at 1 MiB (1,048,576 bytes). Leave ~300 KB
// of headroom for the other fields on the document (userId, timestamps, the
// top-level metadata, etc.).
const MAX_DATA_BYTES = 700 * 1024;

/**
 * Validates the client-supplied payload before it is written to Firestore.
 *
 * Returns `{ valid: true }` when the payload is well-formed, otherwise
 * `{ valid: false, error: '<field-specific message>' }`.
 *
 * Rules:
 *   • The payload must be a plain JSON object.
 *   • `name`, if present, must be a string of at most MAX_NAME_LENGTH chars.
 *   • `template`, if present, must be a string of at most MAX_TEMPLATE_LENGTH chars.
 *   • `data`, if present, must be a plain object whose UTF-8 serialized size is
 *     under MAX_DATA_BYTES.
 *   • `atsScore`, if present, must be a finite number in [0, 100].
 *
 * Absent fields are allowed - the handler substitutes sensible defaults.
 */
function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, error: 'Payload must be a JSON object' };
  }

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string') {
      return { valid: false, error: 'Field "name" must be a string' };
    }
    if (payload.name.length > MAX_NAME_LENGTH) {
      return {
        valid: false,
        error: `Field "name" must be at most ${MAX_NAME_LENGTH} characters`,
      };
    }
  }

  if (payload.template !== undefined) {
    if (typeof payload.template !== 'string') {
      return { valid: false, error: 'Field "template" must be a string' };
    }
    if (payload.template.length > MAX_TEMPLATE_LENGTH) {
      return {
        valid: false,
        error: `Field "template" must be at most ${MAX_TEMPLATE_LENGTH} characters`,
      };
    }
  }

  if (payload.data !== undefined) {
    if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
      return { valid: false, error: 'Field "data" must be a JSON object' };
    }
    let serialized;
    try {
      serialized = JSON.stringify(payload.data);
    } catch {
      return { valid: false, error: 'Field "data" is not JSON-serializable' };
    }
    // Buffer.byteLength gives the accurate UTF-8 byte count, which is what
    // Firestore actually counts against the 1 MiB document limit. String
    // length alone under-counts multi-byte characters.
    if (Buffer.byteLength(serialized, 'utf8') > MAX_DATA_BYTES) {
      return {
        valid: false,
        error: `Field "data" exceeds the maximum allowed size of ${MAX_DATA_BYTES} bytes`,
      };
    }
  }

  if (payload.atsScore !== undefined) {
    if (typeof payload.atsScore !== 'number' || !Number.isFinite(payload.atsScore)) {
      return { valid: false, error: 'Field "atsScore" must be a finite number' };
    }
    if (payload.atsScore < 0 || payload.atsScore > 100) {
      return { valid: false, error: 'Field "atsScore" must be between 0 and 100' };
    }
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

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
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

    // Reject any payload whose shape does not match what this endpoint writes
    // into Firestore. See `validatePayload` above for the exact rules.
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: validation.error }),
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

    await resumeRef.set({
      userId: uid,
      name: payload.name || 'Untitled Resume',
      template: payload.template || 'modern',
      data: payload.data || {},
      status: 'draft',
      atsScore: payload.atsScore || 0,
      downloadCount: 0,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: resumeRef.id,
        userId: uid,
        name: payload.name || 'Untitled Resume',
        template: payload.template || 'modern',
        data: payload.data || {},
        status: 'draft',
        atsScore: payload.atsScore || 0,
        downloadCount: 0,
        viewCount: 0,
      }),
    };
  } catch (error) {
    console.error('Create resume error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message || 'Failed to create resume' }),
    };
  }
};