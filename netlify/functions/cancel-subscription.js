const admin = require('firebase-admin');
const Stripe = require('stripe');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const db = admin.firestore();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

  // ── Error categorisation ────────────────────────────────────────────
  // The handler distinguishes three categories of failure so the client
  // can respond appropriately and so internal details do not leak:
  //
  //   • 401 - the caller's ID token is missing, expired, or revoked.
  //           The client should prompt for sign-in again.
  //   • 400 - the request is well-formed but the caller cannot perform
  //           the operation (e.g. no subscription on file). Retrying will
  //           not help; the UI should surface the message.
  //   • 500 - the server side failed. This includes Firestore failures
  //           and any error from the Stripe API. The client receives a
  //           generic message; the full error (with Stripe's request id,
  //           subscription id, and code) is logged server-side only.

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Cancel subscription auth error:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Please sign in again' }),
    };
  }

  try {
    const subSnapshot = await db.collection('subscriptions').doc(decoded.uid).get();
    const sub = subSnapshot.exists ? subSnapshot.data() : null;

    if (!sub?.stripeSubscriptionId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'No active subscription' }) };
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    // Do not echo `error.message` to the client: it may contain Stripe
    // request ids, subscription ids, and Stripe's internal error codes.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to cancel subscription' }),
    };
  }
};