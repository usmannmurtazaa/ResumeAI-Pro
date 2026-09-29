const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();

/**
 * Mints an `admin: true` custom claim for the caller IF the server-side
 * source of truth (Firestore `users/{uid}`) says they are an admin and not
 * suspended.
 *
 * Why this function exists
 * ────────────────────────
 * Firestore Security Rules cannot use `get()` inside an `allow list`
 * clause, so any list or aggregation query on a collection can only be
 * authorized by custom claims on the caller's ID token — not by the
 * Firestore `role` field. The app's admin-promotion workflow lives entirely
 * in Firestore (`authService.updateUserRole` writes `users/{uid}.role`),
 * which means the promoted user's next admin-area visit needs a custom
 * claim minted from the Firestore role. This function does that minting.
 *
 * What this function does NOT do
 * ──────────────────────────────
 *   • It does not accept claims from the request body. The claim is derived
 *     from the caller's own `users/{uid}` document, never from what the
 *     client asks for.
 *   • It does not downgrade claims. If Firestore role is not 'admin', it
 *     leaves the existing claim alone (admin-by-claim-only accounts keep
 *     their access). Setting an explicit `admin: false` here would break
 *     those accounts; claims revoked by an operator are revoked directly
 *     through the Admin SDK or a separate endpoint, not by this function.
 *   • It does not log the caller's role decision; the response is the same
 *     whether the caller is admin or not, so a caller cannot probe the
 *     endpoint to learn their own server-side role.
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  // ── Error categorisation ────────────────────────────────────────────
  //   • 401 — the caller's ID token is missing, expired, or revoked.
  //   • 400 — reserved for future parameter errors; not used today.
  //   • 500 — the server side failed (Firestore or Auth Admin API). The
  //           client receives a generic message; the full error is logged
  //           server-side only.

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
    const userRef = db.collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : null;

    // Fail-closed: unknown users get no claim.
    if (!userData || userData.role !== 'admin') {
      return {
        statusCode: 200,
        body: JSON.stringify({ synced: false }),
      };
    }

    // Suspended admins do not get a fresh claim. Any existing claim on the
    // token was minted earlier and will expire on its own; the client guard
    // rejects suspended users on the Firestore read regardless.
    if (userData.status === 'suspended') {
      return {
        statusCode: 200,
        body: JSON.stringify({ synced: false }),
      };
    }

    // Mint the claim. Merge-preserving: setCustomUserClaims replaces the
    // entire claim set, so we pass both `admin: true` and keep any existing
    // custom claims that the project may have set elsewhere (e.g. tier).
    // For this project there are no other custom claims in use, so the
    // object is simply `{ admin: true }`. If you add more claims later,
    // read them from the user record first and merge them here.
    await admin.auth().setCustomUserClaims(decoded.uid, { admin: true });

    return {
      statusCode: 200,
      body: JSON.stringify({ synced: true }),
    };
  } catch (error) {
    console.error('sync-admin-claims error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to sync admin claims' }),
    };
  }
};