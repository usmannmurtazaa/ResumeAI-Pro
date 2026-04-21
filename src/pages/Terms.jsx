import React from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiCheckCircle, FiAlertCircle, FiUsers, FiCreditCard, FiShield } from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Terms = () => {
  useDocumentTitle('Terms of Service - ResumeAI Pro');

  const sections = [
    { icon: FiCheckCircle, title: 'Acceptance of Terms', content: 'By accessing or using ResumeAI Pro, you agree to be bound by these Terms of Service. If you disagree, you may not use our services.' },
    { icon: FiUsers, title: 'User Accounts', content: 'You are responsible for maintaining account security and all activities under your account. You must be at least 13 years old to use our services.' },
    { icon: FiFileText, title: 'Content Ownership', content: 'You retain all rights to your resume content. We claim no ownership over your data. You grant us a limited license to host and display your content.' },
    { icon: FiCreditCard, title: 'Subscription & Payments', content: 'Paid plans are billed in advance. You can cancel anytime. Refunds are available within 30 days of purchase. Free tier includes 5 resumes.' },
    { icon: FiAlertCircle, title: 'Acceptable Use', content: 'You agree not to misuse our services, upload malicious content, or violate any laws. We reserve the right to suspend accounts that violate these terms.' },
    { icon: FiShield, title: 'Limitation of Liability', content: 'ResumeAI Pro is provided "as is" without warranties. We are not liable for damages arising from your use of our services.' },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of <span className="gradient-text">Service</span></h1>
            <p className="text-gray-600 dark:text-gray-400">Last updated: January 1, 2026</p>
          </motion.div>

          <Card className="p-8 space-y-6">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Welcome to ResumeAI Pro! These Terms of Service govern your use of our resume building platform.
            </p>

            {sections.map((section, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-primary-500" />
                  {section.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{section.content}</p>
              </motion.div>
            ))}

            <div className="pt-4">
              <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
              <p className="text-gray-600 dark:text-gray-400">
                If you have questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@resumeaipro.com" className="text-primary-500 hover:text-primary-600">legal@resumeaipro.com</a>.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Terms;