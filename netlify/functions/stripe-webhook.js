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
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` };
  }

  const subscription = stripeEvent.data.object;

  if (stripeEvent.type === 'checkout.session.completed') {
    const userId = subscription.client_reference_id || subscription.metadata?.firebaseUserId;
    if (userId) {
      await db.collection('subscriptions').doc(userId).set(
        {
          plan: 'premium',
          status: 'active',
          stripeSubscriptionId: subscription.subscription,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  }

  if (stripeEvent.type === 'customer.subscription.updated') {
    const userId = subscription.metadata?.firebaseUserId;
    if (userId) {
      await db.collection('subscriptions').doc(userId).set(
        {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const userId = subscription.metadata?.firebaseUserId;
    if (userId) {
      // The subscription has fully ended. `cancel_at_period_end` is a flag
      // that means "will cancel at the end of the current period" - it is
      // inapplicable once the subscription is gone. Setting it to `true`
      // here would tell the app that the subscription is still active with
      // a scheduled cancellation, which is the opposite of reality and
      // renders a misleading "Cancels at period end" badge plus a
      // "Resume Subscription" button in `Billing.jsx`.
      //
      // Do NOT copy the value from the `customer.subscription.updated`
      // handler above - that branch reflects Stripe's live
      // `subscription.cancel_at_period_end`, which is meaningful only for
      // an active subscription.
      await db.collection('subscriptions').doc(userId).set(
        {
          status: 'canceled',
          cancelAtPeriodEnd: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  }

  return { statusCode: 200, body: 'Webhook received' };
};