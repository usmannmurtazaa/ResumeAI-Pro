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

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: functions.config().email.host || 'smtp.gmail.com',
    port: functions.config().email.port || 587,
    secure: false,
    auth: {
      user: functions.config().email.user,
      pass: functions.config().email.pass
    }
  });
};

// ============================================
// AUTHENTICATION TRIGGERS
// ============================================

// Send welcome email on user creation
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const transporter = createTransporter();
  
  // Get user's display name or use email prefix
  const displayName = user.displayName || user.email?.split('@')[0] || 'there';
  
  const mailOptions = {
    from: `"ATS Resume Builder" <${functions.config().email.from || 'noreply@atsresumebuilder.com'}>`,
    to: user.email,
    subject: '🎉 Welcome to ATS Resume Builder!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .feature { background: white; padding: 15px; border-radius: 8px; text-align: center; }
            .feature-icon { font-size: 24px; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ATS Resume Builder! 🚀</h1>
            </div>
            <div class="content">
              <p>Hi ${displayName},</p>
              <p>Thank you for joining ATS Resume Builder! We're thrilled to help you create professional, ATS-optimized resumes that stand out.</p>
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">📄</div>
                  <strong>ATS Templates</strong>
                  <p style="font-size: 12px; margin: 5px 0;">Professional designs</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🤖</div>
                  <strong>AI Suggestions</strong>
                  <p style="font-size: 12px; margin: 5px 0;">Smart improvements</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <strong>ATS Scoring</strong>
                  <p style="font-size: 12px; margin: 5px 0;">Real-time feedback</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">💾</div>
                  <strong>Auto-save</strong>
                  <p style="font-size: 12px; margin: 5px 0;">Never lose work</p>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${functions.config().app.url || 'https://atsresumebuilder.netlify.app'}/dashboard" class="button">Create Your First Resume</a>
              </div>
              
              <p><strong>Quick Tips:</strong></p>
              <ul>
                <li>Use action verbs and quantifiable achievements</li>
                <li>Include industry-specific keywords</li>
                <li>Keep formatting simple and clean</li>
                <li>Aim for an ATS score of 80% or higher</li>
              </ul>
              
              <p>If you have any questions, just reply to this email. We're here to help!</p>
              
              <p>Best regards,<br>The ATS Resume Builder Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ATS Resume Builder. All rights reserved.</p>
              <p>
                <a href="${functions.config().app.url}/privacy">Privacy</a> | 
                <a href="${functions.config().app.url}/terms">Terms</a> | 
                <a href="${functions.config().app.url}/unsubscribe">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', user.email);
    
    // Log analytics event
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

// Send goodbye email on account deletion
exports.sendGoodbyeEmail = functions.auth.user().onDelete(async (user) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"ATS Resume Builder" <${functions.config().email.from}>`,
    to: user.email,
    subject: 'We\'re sorry to see you go 😢',
    html: `
      <h1>Goodbye from ATS Resume Builder</h1>
      <p>Hi ${user.displayName || 'there'},</p>
      <p>We're sorry to see you leave. Your account and all associated data have been successfully deleted.</p>
      <p>If you have a moment, we'd love to hear why you left so we can improve our service.</p>
      <p><a href="${functions.config().app.url}/feedback">Leave Feedback</a></p>
      <p>You can always create a new account if you decide to come back!</p>
      <p>Best regards,<br>The ATS Resume Builder Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Goodbye email sent to:', user.email);
  } catch (error) {
    console.error('❌ Error sending goodbye email:', error);
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
    
    resumesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    console.log(`📄 Deleting ${resumesSnapshot.size} resumes for user ${uid}`);

    // Delete user's PDF files from storage
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: `resumes/${uid}/` });
    await Promise.all(files.map(file => file.delete()));
    console.log(`📁 Deleted ${files.length} storage files for user ${uid}`);

    // Delete user document
    const userRef = db.collection('users').doc(uid);
    batch.delete(userRef);

    // Delete user's notifications
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .get();
    
    notificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's analytics events
    const analyticsSnapshot = await db.collection('analytics')
      .where('userId', '==', uid)
      .get();
    
    analyticsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's API keys
    const apiKeysSnapshot = await db.collection('apiKeys')
      .where('userId', '==', uid)
      .get();
    
    apiKeysSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Successfully cleaned up data for user ${uid}`);
    
    // Log deletion
    await db.collection('deletedAccounts').add({
      userId: uid,
      email: user.email,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      provider: user.providerData[0]?.providerId || 'unknown'
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up user data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to cleanup user data');
  }
});

// Update resume ATS score when resume is updated
exports.updateATSScore = functions.firestore
  .document('resumes/{resumeId}')
  .onWrite(async (change, context) => {
    const resumeData = change.after.data();
    if (!resumeData) return null;

    try {
      // Calculate comprehensive ATS score
      let score = 0;
      const breakdown = {};
      
      // Personal Information (20 points)
      if (resumeData.data?.personal) {
        const personal = resumeData.data.personal;
        let personalScore = 0;
        if (personal.fullName) personalScore += 5;
        if (personal.email) personalScore += 5;
        if (personal.phone) personalScore += 5;
        if (personal.location) personalScore += 3;
        if (personal.summary && personal.summary.length > 50) personalScore += 2;
        breakdown.personal = personalScore;
        score += personalScore;
      }
      
      // Experience (25 points)
      if (resumeData.data?.experience?.length > 0) {
        let expScore = 0;
        const experiences = resumeData.data.experience;
        expScore += Math.min(experiences.length * 5, 15);
        
        // Check for action verbs and metrics
        const descriptions = experiences.map(e => e.description || '').join(' ');
        const hasActionVerbs = /(developed|managed|led|created|implemented|increased|decreased|improved|achieved|launched|designed)/i.test(descriptions);
        const hasMetrics = /(\d+%|\$\d+|\d+ people|\d+ years|\d+ months)/.test(descriptions);
        
        if (hasActionVerbs) expScore += 5;
        if (hasMetrics) expScore += 5;
        
        breakdown.experience = Math.min(expScore, 25);
        score += breakdown.experience;
      }
      
      // Education (15 points)
      if (resumeData.data?.education?.length > 0) {
        let eduScore = Math.min(resumeData.data.education.length * 7, 15);
        breakdown.education = eduScore;
        score += eduScore;
      }
      
      // Skills (20 points)
      if (resumeData.data?.skills) {
        let skillsScore = 0;
        if (resumeData.data.skills.technical?.length > 0) {
          skillsScore += Math.min(resumeData.data.skills.technical.length * 2, 12);
        }
        if (resumeData.data.skills.soft?.length > 0) {
          skillsScore += Math.min(resumeData.data.skills.soft.length, 8);
        }
        breakdown.skills = Math.min(skillsScore, 20);
        score += breakdown.skills;
      }
      
      // Projects (10 points)
      if (resumeData.data?.projects?.length > 0) {
        breakdown.projects = Math.min(resumeData.data.projects.length * 3, 10);
        score += breakdown.projects;
      }
      
      // Certifications (10 points)
      if (resumeData.data?.certifications?.length > 0) {
        breakdown.certifications = Math.min(resumeData.data.certifications.length * 3, 10);
        score += breakdown.certifications;
      }

      // Update the document with the calculated score
      await change.after.ref.update({
        atsScore: Math.min(score, 100),
        atsBreakdown: breakdown,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: score >= 80 ? 'completed' : 'draft'
      });

      console.log(`✅ Updated ATS score for resume ${context.params.resumeId}: ${score}`);
      return null;
      
    } catch (error) {
      console.error('❌ Error updating ATS score:', error);
      return null;
    }
  });

// Update user stats when resume is created/deleted
exports.updateUserStats = functions.firestore
  .document('resumes/{resumeId}')
  .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // Only proceed if userId exists
    const userId = afterData?.userId || beforeData?.userId;
    if (!userId) return null;
    
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) return null;
      
      // Count user's resumes
      const resumesSnapshot = await db.collection('resumes')
        .where('userId', '==', userId)
        .get();
      
      const resumeCount = resumesSnapshot.size;
      const completedCount = resumesSnapshot.docs.filter(doc => 
        doc.data().status === 'completed' || doc.data().atsScore >= 80
      ).length;
      
      // Calculate average ATS score
      const scores = resumesSnapshot.docs
        .map(doc => doc.data().atsScore || 0)
        .filter(score => score > 0);
      
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      
      await userRef.update({
        resumeCount,
        completedResumes: completedCount,
        averageATSScore: avgScore,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Updated stats for user ${userId}`);
      return null;
      
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
      return null;
    }
  });

// ============================================
// HTTP CALLABLE FUNCTIONS
// ============================================

// Generate PDF and store in Cloud Storage
exports.generateResumePDF = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { resumeId, template = 'modern' } = data;
  const userId = context.auth.uid;
  
  try {
    // Get resume data
    const resumeDoc = await db.collection('resumes').doc(resumeId).get();
    if (!resumeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Resume not found');
    }

    const resumeData = resumeDoc.data();
    
    // Check ownership
    if (resumeData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'You do not own this resume');
    }

    // Launch browser for PDF generation
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Generate HTML content
    const html = generateResumeHTML(resumeData, template);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in'
      }
    });
    
    await browser.close();
    
    // Upload to Cloud Storage
    const bucket = storage.bucket();
    const fileName = `resumes/${userId}/${resumeId}/resume-${Date.now()}.pdf`;
    const file = bucket.file(fileName);
    
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          userId,
          resumeId,
          generatedAt: new Date().toISOString()
        }
      }
    });
    
    // Generate signed URL (valid for 7 days)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
    
    // Update resume with PDF URL
    await resumeDoc.ref.update({
      pdfUrl: url,
      pdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      downloadCount: admin.firestore.FieldValue.increment(1)
    });
    
    // Log analytics
    await db.collection('analytics').add({
      event: 'pdf_generated',
      userId,
      resumeId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      url,
      fileName
    };
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate PDF');
  }
});

// Import from LinkedIn
exports.importFromLinkedIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { linkedinUrl } = data;
  
  // TODO: Implement LinkedIn scraping with proper API
  
  return {
    success: true,
    message: 'LinkedIn import feature coming soon'
  };
});

// Get ATS suggestions
exports.getATSSuggestions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { resumeData, industry = 'technology' } = data;
  
  try {
    // Analyze resume and generate suggestions
    const suggestions = [];
    const keywords = getIndustryKeywords(industry);
    
    // Check for missing keywords
    const content = JSON.stringify(resumeData).toLowerCase();
    const missingKeywords = keywords.filter(kw => !content.includes(kw.toLowerCase()));
    
    suggestions.push({
      type: 'keywords',
      title: 'Add Industry Keywords',
      items: missingKeywords.slice(0, 5)
    });
    
    // Check summary length
    if (!resumeData.personal?.summary || resumeData.personal.summary.length < 50) {
      suggestions.push({
        type: 'summary',
        title: 'Expand Your Summary',
        message: 'Add a professional summary of at least 50 characters'
      });
    }
    
    // Check for metrics
    const hasMetrics = /(\d+%|\$\d+|\d+ people)/.test(JSON.stringify(resumeData.experience));
    if (!hasMetrics) {
      suggestions.push({
        type: 'metrics',
        title: 'Add Quantifiable Achievements',
        message: 'Include numbers and percentages to demonstrate impact'
      });
    }
    
    return {
      success: true,
      suggestions
    };
    
  } catch (error) {
    console.error('❌ Error getting suggestions:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get suggestions');
  }
});

// ============================================
// SCHEDULED FUNCTIONS
// ============================================

// Daily analytics summary
exports.dailyAnalyticsSummary = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
      // Get new users count
      const newUsersSnapshot = await db.collection('users')
        .where('createdAt', '>=', yesterday)
        .where('createdAt', '<', today)
        .get();
      
      // Get new resumes count
      const newResumesSnapshot = await db.collection('resumes')
        .where('createdAt', '>=', yesterday)
        .where('createdAt', '<', today)
        .get();
      
      // Get active users
      const activeUsersSnapshot = await db.collection('users')
        .where('lastLogin', '>=', yesterday)
        .where('lastLogin', '<', today)
        .get();
      
      // Save analytics
      await db.collection('dailyAnalytics').add({
        date: admin.firestore.Timestamp.fromDate(yesterday),
        newUsers: newUsersSnapshot.size,
        newResumes: newResumesSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Daily analytics summary saved');
      return null;
      
    } catch (error) {
      console.error('❌ Error in daily analytics:', error);
      return null;
    }
  });

// Clean up expired PDFs (run weekly)
exports.cleanupExpiredPDFs = functions.pubsub
  .schedule('0 0 * * 0') // Every Sunday at midnight
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const bucket = storage.bucket();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    try {
      const [files] = await bucket.getFiles({ prefix: 'resumes/' });
      
      let deletedCount = 0;
      
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const createdAt = new Date(metadata.timeCreated).getTime();
        
        if (createdAt < sevenDaysAgo) {
          await file.delete();
          deletedCount++;
        }
      }
      
      console.log(`✅ Cleaned up ${deletedCount} expired PDF files`);
      return null;
      
    } catch (error) {
      console.error('❌ Error cleaning up PDFs:', error);
      return null;
    }
  });

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateResumeHTML(resumeData, template) {
  // Simplified HTML generation - in production, use a proper templating engine
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { color: #333; }
          .section { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${resumeData.data?.personal?.fullName || 'Resume'}</h1>
        <p>Template: ${template}</p>
        <!-- Resume content would be properly formatted here -->
      </body>
    </html>
  `;
}

function getIndustryKeywords(industry) {
  const keywords = {
    technology: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Agile', 'Scrum', 'REST API', 'Microservices', 'CI/CD'],
    marketing: ['SEO', 'SEM', 'Social Media', 'Content Marketing', 'Google Analytics', 'PPC', 'CRM', 'Email Marketing'],
    finance: ['Financial Analysis', 'Budgeting', 'Forecasting', 'Risk Management', 'Excel', 'Bloomberg', 'SAP'],
    healthcare: ['Patient Care', 'EMR', 'HIPAA', 'Clinical Research', 'Healthcare Management', 'Medical Terminology'],
    sales: ['Business Development', 'Account Management', 'Lead Generation', 'B2B Sales', 'Negotiation', 'CRM']
  };
  
  return keywords[industry] || keywords.technology;
}

// ============================================
// API ENDPOINTS
// ============================================

// Health check endpoint
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  });
});

// Export all functions
module.exports = {
  // Auth triggers
  sendWelcomeEmail: exports.sendWelcomeEmail,
  sendGoodbyeEmail: exports.sendGoodbyeEmail,
  
  // Firestore triggers
  cleanupUserData: exports.cleanupUserData,
  updateATSScore: exports.updateATSScore,
  updateUserStats: exports.updateUserStats,
  
  // Callable functions
  generateResumePDF: exports.generateResumePDF,
  importFromLinkedIn: exports.importFromLinkedIn,
  getATSSuggestions: exports.getATSSuggestions,
  
  // Scheduled functions
  dailyAnalyticsSummary: exports.dailyAnalyticsSummary,
  cleanupExpiredPDFs: exports.cleanupExpiredPDFs,
  
  // HTTP endpoints
  health: exports.health
};