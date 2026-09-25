const admin = require('firebase-admin');
const Stripe = require('stripe');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { planId } = JSON.parse(event.body);

    const priceMap = {
      pro: process.env.STRIPE_PRO_PRICE_ID,
      business: process.env.STRIPE_BUSINESS_PRICE_ID,
    };

    if (!priceMap[planId]) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid plan' }) };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceMap[planId], quantity: 1 }],
      success_url: `${process.env.URL || event.headers.origin}/billing?success=true`,
      cancel_url: `${process.env.URL || event.headers.origin}/billing?canceled=true`,
      client_reference_id: decoded.uid,
      metadata: { firebaseUserId: decoded.uid },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    console.error('Create checkout session error:', error);
    return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
  }
};