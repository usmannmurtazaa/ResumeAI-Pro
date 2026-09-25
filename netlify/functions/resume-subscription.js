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

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const subSnapshot = await db.collection('subscriptions').doc(decoded.uid).get();
    const sub = subSnapshot.exists ? subSnapshot.data() : null;

    if (!sub?.stripeSubscriptionId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'No subscription found' }) };
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Resume subscription error:', error);
    return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
  }
};