const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');
const sharp = require('sharp');

// Initialize Firebase Admin
admin.initializeApp();

// Constants
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// ============================================
// EMAIL CONFIGURATION
// ============================================

const createTransporter = () => {
  return nodemailer.createTransport({
    host: functions.config().email?.host || 'smtp.gmail.com',
    port: functions.config().email?.port || 587,
    secure: false,
    auth: {
      user: functions.config().email?.user,
      pass: functions.config().email?.pass
    }
  });
};

// ============================================
// AUTHENTICATION TRIGGERS
// ============================================

// Send welcome email on user creation
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const transporter = createTransporter();
  
  const displayName = user.displayName || user.email?.split('@')[0] || 'there';
  const appUrl = functions.config().app?.url || 'https://resumeaixpro.netlify.app';
  
  const mailOptions = {
    from: `"ResumeAI Pro" <${functions.config().email?.from || 'noreply@resumeaipro.com'}>`,
    to: user.email,
    subject: '🎉 Welcome to ResumeAI Pro!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .feature { background: white; padding: 15px; border-radius: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ResumeAI Pro! 🚀</h1>
            </div>
            <div class="content">
              <p>Hi ${displayName},</p>
              <p>Thank you for joining ResumeAI Pro! We're thrilled to help you create professional, ATS-optimized resumes that stand out.</p>
              
              <div class="features">
                <div class="feature">📄 <strong>ATS Templates</strong></div>
                <div class="feature">🤖 <strong>AI Suggestions</strong></div>
                <div class="feature">📊 <strong>ATS Scoring</strong></div>
                <div class="feature">💾 <strong>Auto-save</strong></div>
              </div>
              
              <div style="text-align: center;">
                <a href="${appUrl}/dashboard" class="button">Create Your First Resume</a>
              </div>
              
              <p><strong>Quick Tips:</strong></p>
              <ul>
                <li>Use action verbs and quantifiable achievements</li>
                <li>Include industry-specific keywords</li>
                <li>Keep formatting simple and clean</li>
                <li>Aim for an ATS score of 80% or higher</li>
              </ul>
              
              <p>Best regards,<br>The ResumeAI Pro Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ResumeAI Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', user.email);
    
    await db.collection('analytics').add({
      event: 'welcome_email_sent',
      userId: user.uid,
      email: user.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
});

// ============================================
// FIRESTORE TRIGGERS
// ============================================

// Clean up user data on account deletion
exports.cleanupUserData = functions.auth.user().onDelete(async (user) => {
  const batch = db.batch();
  const uid = user.uid;

  try {
    // Delete user's resumes
    const resumesSnapshot = await db.collection('resumes')
      .where('userId', '==', uid)
      .get();
    
    resumesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    console.log(`📄 Deleting ${resumesSnapshot.size} resumes for user ${uid}`);

    // Delete user's PDF files from storage
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: `resumes/${uid}/` });
    await Promise.all(files.map(file => file.delete().catch(() => {})));
    console.log(`📁 Deleted ${files.length} storage files for user ${uid}`);

    // Delete user document
    batch.delete(db.collection('users').doc(uid));

    // Delete user's notifications
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .get();
    notificationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete user's settings
    batch.delete(db.collection('settings').doc(uid));

    await batch.commit();
    console.log(`✅ Successfully cleaned up data for user ${uid}`);
    
    await db.collection('deletedAccounts').add({
      userId: uid,
      email: user.email,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up user data:', error);
  }
});

// ============================================
// HTTP CALLABLE FUNCTIONS
// ============================================

// Generate PDF
exports.generateResumePDF = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { resumeId } = data;
  const userId = context.auth.uid;
  
  try {
    const resumeDoc = await db.collection('resumes').doc(resumeId).get();
    if (!resumeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Resume not found');
    }

    const resumeData = resumeDoc.data();
    
    if (resumeData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'You do not own this resume');
    }

    // For now, return success without actual PDF generation
    return {
      success: true,
      message: 'PDF generation ready',
      url: null
    };
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// HEALTH CHECK
// ============================================

exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  });
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  sendWelcomeEmail: exports.sendWelcomeEmail,
  cleanupUserData: exports.cleanupUserData,
  generateResumePDF: exports.generateResumePDF,
  health: exports.health
};