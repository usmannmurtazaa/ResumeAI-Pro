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

    if (!sub?.stripeCustomerId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'No customer found' }) };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.URL || event.headers.origin}/billing`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    console.error('Create portal session error:', error);
    return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
  }
};