const admin = require('firebase-admin');
const Stripe = require('stripe');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const db = admin.firestore();

// ── Trusted site URL ─────────────────────────────────────────────────────
// The billing portal's `return_url` is passed to Stripe and used to redirect
// the customer after they finish managing their subscription - and, depending
// on Stripe's account configuration, to generate links in receipt and invoice
// emails. It must therefore come from a trusted, server-controlled value.
//
// `event.headers.origin` is client-supplied and MUST NOT be used as a
// fallback here: doing so would let any HTTP client influence where Stripe
// sends the customer. The correct fallback for non-production environments
// is `DEPLOY_PRIME_URL`, which Netlify sets automatically for branch deploys
// and deploy previews.
//
// If neither env var is set, the handler fails closed with a 500 instead of
// silently trusting a request header.
const SITE_URL = (process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/+$/, '');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  // Fail closed on deploy-time misconfiguration. Do not fall back to any
  // client-controlled value.
  if (!SITE_URL) {
    console.error('create-portal-session: neither process.env.URL nor DEPLOY_PRIME_URL is set');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server is not configured' }),
    };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const subSnapshot = await db.collection('subscriptions').doc(decoded.uid).get();
    const sub = subSnapshot.exists ? subSnapshot.data() : null;

    if (!sub?.stripeCustomerId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'No customer found' }) };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${SITE_URL}/billing`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    console.error('Create portal session error:', error);
    // Return a generic message to the client. Stripe SDK errors can include
    // request IDs, customer IDs, and other internal details that should not
    // be echoed back to the browser. Full details are logged above.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create billing portal session' }),
    };
  }
};