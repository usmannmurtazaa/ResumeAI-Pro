import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiShield, FiLock, FiEye, FiTrash2, FiGlobe, FiServer,
  FiFileText, FiUserCheck, FiMail, FiChevronRight,
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import { usePageTitle } from '../hooks/useDocumentTitle';

// ── Constants ─────────────────────────────────────────────────────────────

const LAST_UPDATED = 'January 1, 2026';

const SECTIONS = [
  {
    id: 'information-we-collect',
    icon: FiShield,
    title: 'Information We Collect',
    content: `
      We collect information you provide directly, including:
      
      • Account Information: Name, email address, and password when you create an account.
      • Resume Content: Work history, education, skills, and other details you add to your resumes.
      • Payment Information: Processed securely through Stripe. We do not store full credit card numbers.
      • Usage Data: Pages visited, features used, and interactions to improve our services.
      • Communications: Messages sent to our support team or through contact forms.
    `,
  },
  {
    id: 'how-we-use',
    icon: FiLock,
    title: 'How We Use Your Information',
    content: `
      We use your information for the following purposes:
      
      • Service Delivery: To provide, maintain, and improve ResumeAI Pro.
      • Account Management: To manage your account, process payments, and send service notifications.
      • Improvement: To analyze usage patterns and enhance user experience.
      • Communication: To respond to inquiries and send relevant updates (with your consent).
      • Security: To detect and prevent fraud, abuse, and security incidents.
      
      We never sell your personal data to third parties.
    `,
  },
  {
    id: 'information-sharing',
    icon: FiEye,
    title: 'Information Sharing',
    content: `
      We do not share your personal information except in these limited circumstances:
      
      • Service Providers: Trusted third parties (e.g., Stripe for payments, Google Cloud for hosting) who help us operate our platform.
      • Legal Requirements: When required by law, court order, or government regulation.
      • Business Transfers: In connection with a merger, acquisition, or sale of assets.
      • With Your Consent: When you explicitly authorize us to share your information.
      
      All service providers are contractually bound to protect your data.
    `,
  },
  {
    id: 'data-retention',
    icon: FiTrash2,
    title: 'Data Retention & Deletion',
    content: `
      We retain your data as follows:
      
      • Active Accounts: Data is retained as long as your account remains active.
      • Account Deletion: Upon deletion, all personal data is permanently removed within 30 days.
      • Backups: Encrypted backups may retain data for up to 60 days before permanent deletion.
      • Legal Requirements: Certain information may be retained if required by law.
      
      You can export or delete your data at any time from your account settings.
    `,
  },
  {
    id: 'cookies',
    icon: FiFileText,
    title: 'Cookies & Tracking',
    content: `
      We use cookies and similar technologies to:
      
      • Essential Cookies: Required for authentication, security, and core functionality.
      • Preference Cookies: Remember your settings and preferences.
      • Analytics Cookies: Help us understand how you use our platform (using Google Analytics).
      • Marketing Cookies: Used to deliver relevant advertisements (only with your consent).
      
      You can manage cookie preferences through your browser settings or our cookie consent banner.
    `,
  },
  {
    id: 'your-rights',
    icon: FiUserCheck,
    title: 'Your Rights & Choices',
    content: `
      Depending on your location, you may have the following rights:
      
      • Access: Request a copy of your personal data.
      • Rectification: Correct inaccurate or incomplete data.
      • Erasure: Request deletion of your data ("Right to be Forgotten").
      • Portability: Receive your data in a structured, machine-readable format.
      • Objection: Object to certain processing activities.
      • Withdraw Consent: Withdraw previously given consent at any time.
      
      For GDPR (EU/UK) or CCPA (California) requests, contact privacy@resumeaipro.com.
    `,
  },
  {
    id: 'children',
    icon: FiShield,
    title: "Children's Privacy",
    content: `
      ResumeAI Pro is not intended for use by children under the age of 16.
      
      • We do not knowingly collect personal information from children under 16.
      • If we become aware that a child under 16 has provided us with personal data, we will delete it immediately.
      • Parents or guardians who believe their child has provided us with information should contact us.
    `,
  },
  {
    id: 'data-security',
    icon: FiServer,
    title: 'Data Security',
    content: `
      We implement industry-standard security measures:
      
      • Encryption: 256-bit SSL/TLS encryption for data in transit and at rest.
      • Infrastructure: Hosted on Google Cloud Platform with Firebase security rules.
      • Access Controls: Strict internal access policies and authentication requirements.
      • Monitoring: Continuous security monitoring and regular penetration testing.
      • Incident Response: Documented procedures for handling data breaches.
      
      While we strive to protect your data, no method of transmission over the internet is 100% secure.
    `,
  },
  {
    id: 'international',
    icon: FiGlobe,
    title: 'International Data Transfers',
    content: `
      Your data may be transferred and processed outside your country of residence:
      
      • Data Storage: Primarily stored in the United States on Google Cloud Platform.
      • Safeguards: We ensure appropriate safeguards (Standard Contractual Clauses) for international transfers.
      • Compliance: We comply with applicable data protection laws including GDPR.
    `,
  },
  {
    id: 'changes',
    icon: FiFileText,
    title: 'Changes to This Policy',
    content: `
      We may update this Privacy Policy from time to time:
      
      • Material changes will be communicated via email or in-app notification.
      • The "Last Updated" date at the top of this page will be revised.
      • Continued use of ResumeAI Pro after changes constitutes acceptance.
      
      We encourage you to review this policy periodically.
    `,
  },
];

// ── Component ─────────────────────────────────────────────────────────────

const Privacy = () => {
  usePageTitle({
    title: 'Privacy Policy',
    description: 'Learn how ResumeAI Pro collects, uses, and protects your personal information. We take your privacy seriously.',
  });

  const [activeSection, setActiveSection] = useState(null);

  const tocItems = useMemo(() => SECTIONS.map(s => ({ id: s.id, title: s.title })), []);

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <FiShield className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Last updated: {LAST_UPDATED}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-4">
                  <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">
                    Table of Contents
                  </h3>
                  <nav className="space-y-1">
                    {tocItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleScrollTo(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeSection === item.id
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FiChevronRight className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </span>
                      </button>
                    ))}
                  </nav>
                </Card>

                {/* Contact Card */}
                <Card className="p-4 mt-4">
                  <h4 className="font-semibold text-sm mb-2">Questions?</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Contact our Data Protection Officer
                  </p>
                  <a
                    href="mailto:privacy@resumeaipro.com"
                    className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
                  >
                    <FiMail className="w-4 h-4" />
                    privacy@resumeaipro.com
                  </a>
                </Card>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="p-6 md:p-8">
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <p className="lead text-gray-600 dark:text-gray-400">
                    At ResumeAI Pro, we take your privacy seriously. This Privacy Policy explains how we collect, 
                    use, disclose, and safeguard your information when you use our resume builder platform.
                    Please read this policy carefully.
                  </p>
                </div>

                <div className="space-y-8">
                  {SECTIONS.map((section, index) => (
                    <motion.div
                      key={section.id}
                      id={section.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ delay: index * 0.05 }}
                      className="scroll-mt-24"
                    >
                      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        <section.icon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        {section.title}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                      {index < SECTIONS.length - 1 && (
                        <hr className="mt-6 border-gray-200 dark:border-gray-700" />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Contact Section */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <FiMail className="w-5 h-5 text-primary-500" />
                    Contact Us
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    If you have any questions about this Privacy Policy or wish to exercise your data rights, 
                    please contact us:
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      📧 Email:{' '}
                      <a href="mailto:privacy@resumeaipro.com" className="text-primary-500 hover:text-primary-600">
                        privacy@resumeaipro.com
                      </a>
                    </p>
                    <p>
                      📬 Mail: ResumeAI Pro, 123 Market Street, San Francisco, CA 94105
                    </p>
                  </div>
                </div>
              </Card>

              {/* Related Links */}
              <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
                <Link to="/terms" className="text-primary-500 hover:text-primary-600">
                  Terms of Service
                </Link>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <Link to="/cookies" className="text-primary-500 hover:text-primary-600">
                  Cookie Policy
                </Link>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <Link to="/contact" className="text-primary-500 hover:text-primary-600">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;