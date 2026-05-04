import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiFileText, FiCheckCircle, FiAlertCircle, FiUsers, FiCreditCard,
  FiShield, FiMail, FiChevronRight, FiGlobe, FiEdit3, FiXCircle,
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import { usePageTitle } from '../hooks/useDocumentTitle';

// ── Constants ─────────────────────────────────────────────────────────────

const LAST_UPDATED = 'January 1, 2026';

const SECTIONS = [
  {
    id: 'acceptance',
    icon: FiCheckCircle,
    title: 'Acceptance of Terms',
    content: `
      By accessing or using ResumeAI Pro ("the Service"), you agree to be bound by these Terms of Service.
      
      • If you do not agree to these terms, you may not access or use the Service.
      • These terms apply to all visitors, users, and others who access the Service.
      • We reserve the right to update these terms at any time with reasonable notice.
    `,
  },
  {
    id: 'accounts',
    icon: FiUsers,
    title: 'User Accounts',
    content: `
      When you create an account, you must provide accurate and complete information.
      
      • You are responsible for maintaining the security of your account credentials.
      • You are responsible for all activities that occur under your account.
      • You must be at least 13 years old to use the Service. Users under 18 require parental consent.
      • You must notify us immediately of any unauthorized access or security breach.
      • We reserve the right to suspend or terminate accounts that violate these terms.
    `,
  },
  {
    id: 'content',
    icon: FiFileText,
    title: 'Content Ownership & License',
    content: `
      You retain full ownership of all content you create using ResumeAI Pro.
      
      • You grant us a limited, worldwide, non-exclusive license to host, store, and display your content solely for the purpose of providing the Service.
      • We do not claim any ownership rights over your resume content, personal information, or data.
      • You may export or delete your content at any time.
      • We may use aggregated, anonymized data for analytics and service improvement.
    `,
  },
  {
    id: 'subscription',
    icon: FiCreditCard,
    title: 'Subscriptions & Payments',
    content: `
      Paid subscriptions are governed by the following terms:
      
      • Free tier includes 5 resumes with basic features.
      • Paid plans are billed in advance on a monthly or annual basis.
      • You may cancel your subscription at any time. Access continues until the end of the billing period.
      • Refunds are available within 30 days of purchase for annual plans.
      • Prices are subject to change with 30 days notice. Price changes do not affect current billing periods.
      • All payments are processed securely through Stripe. We do not store full credit card details.
    `,
  },
  {
    id: 'acceptable-use',
    icon: FiAlertCircle,
    title: 'Acceptable Use Policy',
    content: `
      You agree not to misuse the Service in any way, including:
      
      • Violating any applicable laws or regulations.
      • Uploading malicious code, viruses, or harmful content.
      • Attempting to gain unauthorized access to our systems or other user accounts.
      • Using the Service for spam, harassment, or fraudulent activities.
      • Reselling or redistributing the Service without authorization.
      • Scraping, data mining, or using automated tools to extract data.
      • Interfering with the proper functioning of the Service.
    `,
  },
  {
    id: 'intellectual-property',
    icon: FiEdit3,
    title: 'Intellectual Property',
    content: `
      ResumeAI Pro and its original content, features, and functionality are owned by us.
      
      • Our templates, designs, logos, and software are protected by copyright and intellectual property laws.
      • You may not copy, modify, or distribute our proprietary content without permission.
      • The "ResumeAI Pro" name, logo, and brand are our trademarks.
      • User feedback and suggestions become our property and may be used without compensation.
    `,
  },
  {
    id: 'third-party',
    icon: FiGlobe,
    title: 'Third-Party Services',
    content: `
      The Service may contain links to or integrate with third-party services.
      
      • We are not responsible for the content, privacy policies, or practices of third-party services.
      • Use of third-party services (e.g., Google Sign-In, Stripe Payments) is subject to their respective terms.
      • We do not endorse or assume liability for any third-party content or services.
    `,
  },
  {
    id: 'termination',
    icon: FiXCircle,
    title: 'Termination',
    content: `
      We may terminate or suspend your account at our sole discretion for:
      
      • Violation of these Terms of Service.
      • Extended periods of inactivity (12+ months) on free accounts.
      • Requests from law enforcement or government agencies.
      • Unexpected technical or security issues.
      
      Upon termination, your right to use the Service will immediately cease. We will retain your data for 30 days, during which you may request an export.
    `,
  },
  {
    id: 'liability',
    icon: FiShield,
    title: 'Limitation of Liability',
    content: `
      To the fullest extent permitted by law:
      
      • ResumeAI Pro is provided "as is" and "as available" without warranties of any kind.
      • We are not liable for any indirect, incidental, special, or consequential damages.
      • Our total liability for any claims is limited to the amount you paid us in the last 12 months.
      • We are not responsible for hiring outcomes, interview success, or job placement.
      • Some jurisdictions do not allow these limitations, so they may not apply to you.
    `,
  },
  {
    id: 'governing-law',
    icon: FiGlobe,
    title: 'Governing Law & Disputes',
    content: `
      These Terms shall be governed by the laws of the State of California, USA.
      
      • Any disputes shall be resolved through binding arbitration in San Francisco, CA.
      • You waive any right to participate in class action lawsuits.
      • Claims must be filed within one year of the incident.
      • For EU/UK users, local consumer protection laws may apply.
    `,
  },
  {
    id: 'changes',
    icon: FiEdit3,
    title: 'Changes to Terms',
    content: `
      We may modify these Terms at any time. Material changes will be communicated:
      
      • Via email to the address associated with your account.
      • Through in-app notifications or banners.
      • With at least 30 days notice for material changes.
      
      Continued use of the Service after changes constitutes acceptance of the new terms.
    `,
  },
];

// ── Component ─────────────────────────────────────────────────────────────

const Terms = () => {
  usePageTitle({
    title: 'Terms of Service',
    description: 'Read the terms and conditions for using ResumeAI Pro. Learn about account responsibilities, subscriptions, and acceptable use.',
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
            <FiFileText className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Last updated: {LAST_UPDATED}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents Sidebar */}
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

                <Card className="p-4 mt-4">
                  <h4 className="font-semibold text-sm mb-2">Questions?</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Contact our legal team for questions about these terms.
                  </p>
                  <a
                    href="mailto:legal@resumeaipro.com"
                    className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
                  >
                    <FiMail className="w-4 h-4" />
                    legal@resumeaipro.com
                  </a>
                </Card>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="p-6 md:p-8">
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <p className="lead text-gray-600 dark:text-gray-400">
                    Welcome to ResumeAI Pro. These Terms of Service ("Terms") govern your access to and use of 
                    our resume building platform, including any associated websites, applications, and services 
                    (collectively, the "Service"). Please read these Terms carefully before using the Service.
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
                      transition={{ delay: index * 0.03 }}
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

                {/* Contact */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <FiMail className="w-5 h-5 text-primary-500" />
                    Contact Us
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    📧 Email:{' '}
                    <a href="mailto:legal@resumeaipro.com" className="text-primary-500 hover:text-primary-600">
                      legal@resumeaipro.com
                    </a>
                  </p>
                </div>
              </Card>

              {/* Related Links */}
              <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
                <Link to="/privacy" className="text-primary-500 hover:text-primary-600">
                  Privacy Policy
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

export default Terms;