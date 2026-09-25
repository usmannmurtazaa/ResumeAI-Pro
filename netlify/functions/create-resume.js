const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();
const FREE_RESUME_LIMIT = 5;

async function isPremiumUser(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  const userRole = userDoc.data()?.role || 'user';

  if (userRole === 'premium' || userRole === 'admin') return true;

  const subscriptionDoc = await db.collection('subscriptions').doc(uid).get();
  const subscription = subscriptionDoc.exists ? subscriptionDoc.data() : null;
  return subscription?.status === 'active' && subscription?.plan === 'premium';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
    };
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const payload = JSON.parse(event.body);

    if (!(await isPremiumUser(uid))) {
      const countSnapshot = await db
        .collection('resumes')
        .where('userId', '==', uid)
        .count()
        .get();
      const count = countSnapshot.data().count;

      if (count >= FREE_RESUME_LIMIT) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Resume limit reached' }),
        };
      }
    }

    const resumeRef = db.collection('resumes').doc();
    const now = new Date();

    await resumeRef.set({
      userId: uid,
      name: payload.name || 'Untitled Resume',
      template: payload.template || 'modern',
      data: payload.data || {},
      status: 'draft',
      atsScore: payload.atsScore || 0,
      downloadCount: 0,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: resumeRef.id,
        userId: uid,
        name: payload.name || 'Untitled Resume',
        template: payload.template || 'modern',
        data: payload.data || {},
        status: 'draft',
        atsScore: payload.atsScore || 0,
        downloadCount: 0,
        viewCount: 0,
      }),
    };
  } catch (error) {
    console.error('Create resume error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message || 'Failed to create resume' }),
    };
  }
};