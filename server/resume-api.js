import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';

const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const auth = getAuth();
const db = getFirestore();

const FREE_RESUME_LIMIT = 5;

async function verifyIdToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw new Error('Unauthorized');
  return auth.verifyIdToken(token);
}

async function isPremiumUser(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  const userRole = userDoc.data()?.role || 'user';

  if (userRole === 'premium' || userRole === 'admin') return true;

  const subscriptionDoc = await db.collection('subscriptions').doc(uid).get();
  const subscription = subscriptionDoc.exists ? subscriptionDoc.data() : null;
  return subscription?.status === 'active' && subscription?.plan === 'premium';
}

async function enforceLimit(uid) {
  const premium = await isPremiumUser(uid);
  if (premium) return;

  const countSnapshot = await db
    .collection('resumes')
    .where('userId', '==', uid)
    .count()
    .get();

  if (countSnapshot.data().count >= FREE_RESUME_LIMIT) {
    throw new Error('Resume limit reached');
  }
}

async function createResume(uid, payload) {
  await enforceLimit(uid);

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
    id: resumeRef.id,
    userId: uid,
    name: payload.name || 'Untitled Resume',
    template: payload.template || 'modern',
    data: payload.data || {},
    status: 'draft',
    atsScore: payload.atsScore || 0,
    downloadCount: 0,
    viewCount: 0,
  };
}

async function duplicateResume(uid, resumeId) {
  await enforceLimit(uid);

  const originalRef = db.collection('resumes').doc(resumeId);
  const originalSnapshot = await originalRef.get();

  if (!originalSnapshot.exists) {
    throw new Error('Original resume not found');
  }

  const originalData = originalSnapshot.data();
  if (originalData.userId !== uid) {
    throw new Error('Forbidden');
  }

  const resumeRef = db.collection('resumes').doc();
  const now = new Date();

  const { id, createdAt, updatedAt, downloadCount, viewCount, ...rest } = originalData;

  await resumeRef.set({
    ...rest,
    userId: uid,
    name: `${rest.name || 'Untitled'} (Copy)`,
    status: 'draft',
    downloadCount: 0,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: resumeRef.id,
    ...rest,
    userId: uid,
    name: `${rest.name || 'Untitled'} (Copy)`,
    status: 'draft',
    downloadCount: 0,
    viewCount: 0,
  };
}

async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === '/create-resume' && request.method === 'POST') {
    try {
      const decoded = await verifyIdToken(request);
      const payload = await request.json();
      const resume = await createResume(decoded.uid, payload);
      return new Response(JSON.stringify(resume), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ message: error.message || 'Server error' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (url.pathname === '/duplicate-resume' && request.method === 'POST') {
    try {
      const decoded = await verifyIdToken(request);
      const { resumeId } = await request.json();
      const resume = await duplicateResume(decoded.uid, resumeId);
      return new Response(JSON.stringify(resume), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ message: error.message || 'Server error' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env) {
    globalThis.env = env;
    return handleRequest(request);
  },
};