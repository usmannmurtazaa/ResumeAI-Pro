const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  // ── Why this function exists ────────────────────────────────────────
  // Firestore rules cannot call `get()` inside `allow list`, so a list
  // operation cannot be authorized by a Firestore-role check. The app's
  // source of truth for "is this user an admin" is `users/{uid}.role`.
  // This function mirrors that into a custom claim (`admin: true`) which
  // *can* authorize list operations. It is called by `AdminRoute` after
  // the client confirms the caller is a Firestore-role admin.
  //
  // The claim is always derived from the server-side Firestore document.
  // It is never accepted from the request body.

  // Split auth from the rest so an invalid token returns 401 rather than
  // falling through to the outer catch as a 500.
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('sync-admin-claims auth error:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Please sign in again' }),
    };
  }

  try {
    const userRef = admin.firestore().collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : null;

    // Fail closed on missing/suspended callers. Both cases return the same
    // shape as the "not an admin" case so the caller cannot probe their
    // own status through this endpoint.
    if (!userData || userData.status === 'suspended' || userData.role !== 'admin') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, synced: false }),
      };
    }

    // Preserve any claims already on the account. `setCustomUserClaims`
    // overwrites the entire claims object, so we read first and merge.
    let existingClaims = {};
    try {
      const existing = await admin.auth().getUser(decoded.uid);
      existingClaims = existing.customClaims || {};
    } catch (error) {
      console.error('sync-admin-claims: unable to read existing claims:', error);
      // Continue with an empty base — the important claim is `admin` and
      // losing unknown claims here is preferable to failing the sync.
    }

    const nextClaims = { ...existingClaims, admin: true };
    await admin.auth().setCustomUserClaims(decoded.uid, nextClaims);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, synced: true }),
    };
  } catch (error) {
    console.error('sync-admin-claims error:', error);
    // Do not echo `error.message` — it may contain Admin SDK internals.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to sync admin claims' }),
    };
  }
};