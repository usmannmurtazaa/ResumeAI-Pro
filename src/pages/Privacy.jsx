import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiLock, FiEye, FiTrash2, FiGlobe, FiServer } from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Privacy = () => {
  useDocumentTitle('Privacy Policy - ResumeAI Pro');

  const sections = [
    { icon: FiShield, title: 'Information We Collect', content: 'We collect information you provide directly, such as account details, resume content, and payment information. We also collect usage data to improve our services.' },
    { icon: FiLock, title: 'How We Use Your Information', content: 'We use your information to provide and improve our services, process payments, communicate with you, and ensure platform security. We never sell your personal data.' },
    { icon: FiEye, title: 'Information Sharing', content: 'We do not share your personal information with third parties except as necessary to provide our services (e.g., payment processors) or when required by law.' },
    { icon: FiTrash2, title: 'Data Retention & Deletion', content: 'We retain your data as long as your account is active. You can delete your account at any time, and we will permanently remove your data within 30 days.' },
    { icon: FiServer, title: 'Data Security', content: 'We use industry-standard encryption (256-bit SSL) and secure infrastructure to protect your data. All data is stored on Google Cloud Platform with Firebase security rules.' },
    { icon: FiGlobe, title: 'International Transfers', content: 'Your data may be transferred and stored outside your country. We ensure appropriate safeguards are in place for such transfers.' },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy <span className="gradient-text">Policy</span></h1>
            <p className="text-gray-600 dark:text-gray-400">Last updated: January 1, 2026</p>
          </motion.div>

          <Card className="p-8 space-y-6">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              At ResumeAI Pro, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.
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
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@resumeaipro.com" className="text-primary-500 hover:text-primary-600">privacy@resumeaipro.com</a>.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;