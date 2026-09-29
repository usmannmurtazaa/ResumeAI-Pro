const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

// ── Admin claim names ───────────────────────────────────────────────
// Every claim name that grants admin access in this app. Mirrors the
// three paths checked by `AdminRoute.verifyAdminServerSide` and by
// `LoginForm.checkAdminRole`. If a new admin-claim path is added there,
// it MUST be added here as well, otherwise a demotion can leave the
// claim behind.
const ADMIN_CLAIM_KEYS = ['admin', 'superAdmin'];

/**
 * Returns true if the given claims object grants admin access via any of
 * the accepted paths. The `role` claim is only treated as an admin grant
 * when its value is exactly the string 'admin' - other role values are
 * application data, not authorization signals, and must be preserved on
 * demotion.
 */
const hasAdminClaim = (claims) =>
  claims?.admin === true || claims?.superAdmin === true || claims?.role === 'admin';

/**
 * Returns a shallow copy of `claims` with all admin grants removed.
 * Non-admin claims (custom metadata set by other tooling) are preserved
 * verbatim so that this function does not silently destroy data it did
 * not create.
 */
const stripAdminClaims = (claims) => {
  const next = { ...(claims || {}) };
  ADMIN_CLAIM_KEYS.forEach((key) => {
    delete next[key];
  });
  if (next.role === 'admin') {
    delete next.role;
  }
  return next;
};

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
  // This function mirrors that into a custom claim which *can* authorize
  // list operations.
  //
  // The claim is always derived from the server-side Firestore document.
  // It is never accepted from the request body.
  //
  // ── Idempotency contract ────────────────────────────────────────────
  //   • If the caller's Firestore role is `admin` AND the account is not
  //     suspended AND the user document exists, the function ensures the
  //     `admin: true` claim is set.
  //   • Otherwise (role is not admin, account is suspended, or the user
  //     document is missing), the function removes ALL admin claims
  //     (`admin`, `superAdmin`, `role: 'admin'`). Non-admin custom
  //     claims on the account are preserved.
  //   • The function only writes to Firebase Auth when the current
  //     claims differ from the desired state, so calling it repeatedly
  //     is cheap.
  //
  // Clearing the claim is the only correct way to revoke admin access on
  // Spark plan: Firestore rules cannot call `auth.token` from the client
  // to force a refresh, and a demoted user's cached ID token remains
  // valid until it expires. The alternative - relying on the client to
  // notice the demotion and call this endpoint - leaves an interval of
  // up to one hour during which a demoted user continues to pass admin
  // authorization checks. This function is the single authoritative
  // point that mirrors Firestore role → Auth claim.

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

    const isSuspended = userData?.status === 'suspended';
    const isFirestoreAdmin = userData?.role === 'admin';
    const shouldHaveAdminClaim = Boolean(userData) && !isSuspended && isFirestoreAdmin;

    // Read existing claims so unknown claims are preserved on write.
    // `setCustomUserClaims` overwrites the whole claims object, so this
    // read is required. A failure here falls back to an empty base - it
    // is preferable to lose unmanaged claims than to fail the sync.
    let existingClaims = {};
    try {
      const existing = await admin.auth().getUser(decoded.uid);
      existingClaims = existing.customClaims || {};
    } catch (error) {
      console.error('sync-admin-claims: unable to read existing claims:', error);
    }

    const claimsBefore = existingClaims;
    const claimsAfter = shouldHaveAdminClaim
      ? { ...existingClaims, admin: true }
      : stripAdminClaims(existingClaims);

    // Only write when the claim state actually changes. This keeps the
    // function idempotent: a no-op call does not issue an Auth write,
    // which matters on the Spark plan where Auth admin writes count
    // against the same quota regardless of redundancy.
    const needsWrite = hasAdminClaim(claimsBefore) !== shouldHaveAdminClaim;

    if (needsWrite) {
      await admin.auth().setCustomUserClaims(decoded.uid, claimsAfter);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        // The caller's true authorization state *after* this call. A
        // caller MUST use this value rather than treating `success: true`
        // as an authorization signal - `success` only means the sync
        // operation completed, not that the caller is an admin.
        isAdmin: shouldHaveAdminClaim,
        // Diagnostic flags for the client. `synced` is true when an
        // admin claim was added; `cleared` is true when admin claims
        // were removed. Both are false for the idempotent no-op case.
        synced: needsWrite && shouldHaveAdminClaim,
        cleared: needsWrite && !shouldHaveAdminClaim,
      }),
    };
  } catch (error) {
    console.error('sync-admin-claims error:', error);
    // Do not echo `error.message` - it may contain Admin SDK internals.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to sync admin claims' }),
    };
  }
};