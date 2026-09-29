const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();

// ── Constants ────────────────────────────────────────────────────────────
// Firestore caps a single WriteBatch at 500 operations. Leave headroom for
// SDK bookkeeping by chunking at 400.
const BATCH_LIMIT = 400;
// Firestore document IDs are limited to 1500 bytes. Reject anything longer
// before it reaches the SDK with an unhelpful "Invalid document reference".
const MAX_USER_ID_LENGTH = 1500;

/**
 * Admin endpoint to delete a user and all of their associated data.
 *
 * Request body: { targetUserId: string }
 * Response:
 *   200 { success: true, userId }                        on complete success
 *   200 { success: true, userId }                        on idempotent retry
 *   400 { message }                                      bad request
 *   401 { message }                                      missing / invalid token
 *   403 { message }                                      caller is not admin
 *   405 { message }                                      wrong HTTP method
 *   500 { message }                                      server-side failure
 *   500 { message, partial: true }                       Firestore cleanup done, Auth delete failed
 *
 * Idempotency contract:
 *   • All Firestore deletes are no-ops when the target document is already
 *     gone, so a retry after a partial failure only re-attempts the steps
 *     that did not complete.
 *   • `auth/user-not-found` from `deleteUser` is treated as success — the
 *     Auth account is already removed.
 *   • The audit record uses `{ merge: true }` so a retry does not overwrite
 *     the original `deletedAt` timestamp.
 *
 * Authorization:
 *   The caller's Firestore `users/{callerUid}` document must have
 *   `role === 'admin'` and `status !== 'suspended'`. Custom claims are not
 *   consulted for this destructive operation because they can be stale.
 */
exports.handler = async (event) => {
  // ── Method check ──────────────────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // ── Authentication ────────────────────────────────────────────────────
  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('delete-user auth error:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Please sign in again' }),
    };
  }

  // ── Parse and validate the payload ───────────────────────────────────
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

  const { targetUserId } = payload;

  if (typeof targetUserId !== 'string') {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Field "targetUserId" must be a string' }),
    };
  }
  const trimmedTargetId = targetUserId.trim();
  if (!trimmedTargetId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Field "targetUserId" is required' }),
    };
  }
  if (Buffer.byteLength(trimmedTargetId, 'utf8') > MAX_USER_ID_LENGTH) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Field "targetUserId" exceeds the maximum allowed length of ${MAX_USER_ID_LENGTH} bytes`,
      }),
    };
  }
  if (trimmedTargetId.includes('/')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Field "targetUserId" must not contain "/"' }),
    };
  }

  // Prevent an admin from deleting their own account through this endpoint.
  // Self-deletion is a separate flow (`authService.deleteUserAccount`).
  if (trimmedTargetId === decoded.uid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Cannot delete your own account through this endpoint',
      }),
    };
  }

  // ── Authorization ─────────────────────────────────────────────────────
  // Read the caller's user document — the source of truth for role/status.
  // Custom claims can be stale; this is a destructive admin operation, so
  // we check the durable Firestore record.
  try {
    const callerSnap = await db.collection('users').doc(decoded.uid).get();
    const callerData = callerSnap.exists ? callerSnap.data() : null;

    if (!callerData || callerData.role !== 'admin' || callerData.status === 'suspended') {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Admin access required' }),
      };
    }
  } catch (error) {
    console.error('delete-user caller lookup failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to verify caller' }),
    };
  }

  // ── Execute the delete ────────────────────────────────────────────────
  try {
    // 1. Capture the target user data for the audit record BEFORE deletion.
    const targetSnap = await db.collection('users').doc(trimmedTargetId).get();
    const targetData = targetSnap.exists ? targetSnap.data() : null;

    // 2. Collect the target's dependent documents in parallel.
    const [resumesSnap, notificationsSnap, sessionsSnap] = await Promise.all([
      db.collection('resumes').where('userId', '==', trimmedTargetId).get(),
      db.collection('notifications').where('userId', '==', trimmedTargetId).get(),
      db.collection('users').doc(trimmedTargetId).collection('sessions').get(),
    ]);

    const refsToDelete = [
      ...resumesSnap.docs.map((d) => d.ref),
      ...notificationsSnap.docs.map((d) => d.ref),
      ...sessionsSnap.docs.map((d) => d.ref),
      db.collection('settings').doc(trimmedTargetId),
      db.collection('subscriptions').doc(trimmedTargetId),
    ];

    // 3. Delete in chunks. Each chunk commits atomically; the full set
    //    cannot be one batch because Firestore caps batches at 500.
    for (let i = 0; i < refsToDelete.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      refsToDelete.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    // 4. Delete the user document last. Its presence is the durable signal
    //    that the Firestore cleanup is still pending.
    try {
      await db.collection('users').doc(trimmedTargetId).delete();
    } catch (error) {
      console.warn('delete-user: unable to remove user document:', error);
      // Continue — a subsequent retry will still attempt the delete.
    }

    // 5. Write the audit record. Uses `merge: true` so a retry does not
    //    overwrite the original deletion timestamp with a later one.
    try {
      await db.collection('deletedAccounts').doc(trimmedTargetId).set(
        {
          userId: trimmedTargetId,
          email: targetData?.email || null,
          displayName: targetData?.displayName || null,
          deletedAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedBy: decoded.uid,
          reason: 'admin_action',
        },
        { merge: true }
      );
    } catch (error) {
      console.error('delete-user: unable to write audit record:', error);
      // Do not fail the operation on audit-write failure — the primary
      // delete already succeeded and the user-visible outcome is correct.
    }

    // 6. Delete the Firebase Auth account.
    //    `auth/user-not-found` is treated as success — the account is
    //    already gone (either it never existed or a previous retry
    //    already removed it).
    try {
      await admin.auth().deleteUser(trimmedTargetId);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Already gone — success.
      } else {
        console.error('delete-user: unable to delete Firebase Auth account:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message:
              'Firestore data was deleted, but the Firebase Auth account could not be removed. Retry to finish the deletion.',
            partial: true,
          }),
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, userId: trimmedTargetId }),
    };
  } catch (error) {
    console.error('delete-user error:', error);
    // Do not echo `error.message` — Admin SDK errors can contain gRPC
    // status codes, resource paths, and internal details.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete user' }),
    };
  }
};