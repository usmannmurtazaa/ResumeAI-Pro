const admin = require('firebase-admin');
const Stripe = require('stripe');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ── Trusted site URL ─────────────────────────────────────────────────────
// `success_url` and `cancel_url` are passed to Stripe and become the
// redirect targets after the customer completes or abandons Checkout.
// Depending on Stripe's account configuration they may also appear in
// receipt and invoice emails. They must therefore come from a trusted,
// server-controlled value.
//
// `event.headers.origin` is client-supplied and MUST NOT be used as a
// fallback here: doing so would let any HTTP client influence where Stripe
// sends the customer. The correct fallback for non-production environments
// is `DEPLOY_PRIME_URL`, which Netlify sets automatically for branch
// deploys and deploy previews.
//
// If neither env var is set, the handler fails closed with a 500 instead
// of silently trusting a request header.
const SITE_URL = (process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/+$/, '');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // Fail closed on deploy-time misconfiguration. Do not fall back to any
  // client-controlled value.
  if (!SITE_URL) {
    console.error(
      'create-checkout-session: neither process.env.URL nor DEPLOY_PRIME_URL is set'
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server is not configured' }),
    };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  // ── Error categorisation ────────────────────────────────────────────
  //   • 401 - the caller's ID token is missing, expired, or revoked.
  //   • 400 - the request is well-formed but rejected (malformed JSON,
  //           unknown planId). Retrying will not help.
  //   • 500 - the server side failed (Stripe API error, config problem).
  //           The client receives a generic message; the full error,
  //           including Stripe's request id, is logged server-side only.

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Create checkout session auth error:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Please sign in again' }),
    };
  }

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

  const { planId } = payload;

  const priceMap = {
    pro: process.env.STRIPE_PRO_PRICE_ID,
    business: process.env.STRIPE_BUSINESS_PRICE_ID,
  };

  if (!planId || !priceMap[planId]) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid plan' }) };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceMap[planId], quantity: 1 }],
      success_url: `${SITE_URL}/billing?success=true`,
      cancel_url: `${SITE_URL}/billing?canceled=true`,
      client_reference_id: decoded.uid,
      metadata: { firebaseUserId: decoded.uid },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    console.error('Create checkout session error:', error);
    // Do not echo `error.message` to the client: it may contain Stripe
    // request ids, price ids, and Stripe's internal error codes.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create checkout session' }),
    };
  }
};