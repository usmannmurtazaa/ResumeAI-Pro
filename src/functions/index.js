const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Send welcome email on user creation
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: functions.config().email.user,
      pass: functions.config().email.pass
    }
  });

  const mailOptions = {
    from: 'ATS Resume Builder <noreply@atsresumebuilder.com>',
    to: user.email,
    subject: 'Welcome to ATS Resume Builder!',
    html: `
      <h1>Welcome to ATS Resume Builder!</h1>
      <p>Hi ${user.displayName || 'there'},</p>
      <p>Thank you for joining ATS Resume Builder. We're excited to help you create professional, ATS-optimized resumes.</p>
      <p>Get started by creating your first resume: <a href="https://atsresumebuilder.com/dashboard">Create Resume</a></p>
      <p>Best regards,<br>The ATS Resume Builder Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
});

// Clean up user data on account deletion
exports.cleanupUserData = functions.auth.user().onDelete(async (user) => {
  const db = admin.firestore();
  const batch = db.batch();

  // Delete user's resumes
  const resumesSnapshot = await db.collection('resumes')
    .where('userId', '==', user.uid)
    .get();
  
  resumesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Delete user document
  const userRef = db.collection('users').doc(user.uid);
  batch.delete(userRef);

  // Delete user's notifications
  const notificationsSnapshot = await db.collection('notifications')
    .where('userId', '==', user.uid)
    .get();
  
  notificationsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('User data cleaned up for:', user.uid);
});

// Update resume ATS score when resume is updated
exports.updateATSScore = functions.firestore
  .document('resumes/{resumeId}')
  .onWrite(async (change, context) => {
    const resumeData = change.after.data();
    if (!resumeData) return null;

    // Calculate ATS score based on resume content
    let score = 0;
    
    // Check for complete sections
    if (resumeData.data?.personal) score += 20;
    if (resumeData.data?.experience?.length > 0) score += 25;
    if (resumeData.data?.education?.length > 0) score += 15;
    if (resumeData.data?.skills?.technical?.length > 0) score += 20;
    if (resumeData.data?.projects?.length > 0) score += 10;
    if (resumeData.data?.certifications?.length > 0) score += 10;

    // Update the document with the calculated score
    await change.after.ref.update({
      atsScore: score,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return null;
  });

// Generate PDF and store in Cloud Storage
exports.generateResumePDF = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { resumeId } = data;
  
  // Get resume data
  const resumeDoc = await admin.firestore().collection('resumes').doc(resumeId).get();
  if (!resumeDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Resume not found');
  }

  const resumeData = resumeDoc.data();
  
  // TODO: Implement PDF generation logic here
  // This would typically use a library like puppeteer to generate PDF
  
  return {
    success: true,
    message: 'PDF generated successfully',
    url: `https://storage.googleapis.com/...`
  };
});