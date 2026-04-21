import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiChevronDown, FiChevronUp, FiHelpCircle,
  FiMail, FiMessageCircle, FiBook, FiTarget, FiLock,
  FiCreditCard, FiDownload, FiUser, FiFileText,
  FiArrowRight, FiExternalLink,
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import useDocumentTitle from '../hooks/useDocumentTitle';

const FAQ = () => {
  useDocumentTitle('FAQ - Frequently Asked Questions | ResumeAI Pro');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('general');
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  const categories = [
    { id: 'general', label: 'General', icon: FiHelpCircle, color: 'text-blue-500' },
    { id: 'account', label: 'Account & Billing', icon: FiUser, color: 'text-green-500' },
    { id: 'builder', label: 'Resume Builder', icon: FiFileText, color: 'text-purple-500' },
    { id: 'ats', label: 'ATS & Scoring', icon: FiTarget, color: 'text-orange-500' },
    { id: 'security', label: 'Security & Privacy', icon: FiLock, color: 'text-red-500' },
    { id: 'export', label: 'Export & Download', icon: FiDownload, color: 'text-cyan-500' },
  ];

  const faqData = {
    general: [
      { q: 'What is ResumeAI Pro?', a: 'ResumeAI Pro is an AI-powered resume builder that helps you create ATS-optimized resumes. It provides real-time scoring, keyword suggestions, and professional templates to help you land more interviews.' },
      { q: 'Is ResumeAI Pro free?', a: 'Yes! We offer a free plan that includes 5 resumes, basic templates, and ATS scoring. Premium plans unlock unlimited resumes and advanced AI features.' },
      { q: 'How do I get started?', a: 'Simply sign up for a free account, choose a template, and start building your resume. Our intuitive builder guides you through each section.' },
      { q: 'Can I import my existing resume?', a: 'Yes! You can upload your existing resume (PDF or DOCX) and our ATS scanner will analyze it and populate the builder.' },
      { q: 'Do you offer refunds?', a: 'Yes, we offer a 30-day money-back guarantee on all paid plans. Contact support for assistance.' },
    ],
    account: [
      { q: 'How do I change my password?', a: 'Go to Settings → Security and click "Change Password". You\'ll need to enter your current password and your new password.' },
      { q: 'How do I cancel my subscription?', a: 'You can cancel your subscription anytime from Billing → Manage Subscription. Your access will continue until the end of your billing period.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. All payments are secure and encrypted.' },
      { q: 'Can I upgrade/downgrade my plan?', a: 'Yes! You can change your plan at any time from the Billing page. Upgrades take effect immediately, downgrades at the end of your billing cycle.' },
      { q: 'How do I delete my account?', a: 'You can delete your account from Settings → Account → Delete Account. This action is permanent and cannot be undone.' },
    ],
    builder: [
      { q: 'How many templates do you offer?', a: 'We offer 25+ professionally designed templates across various categories including Modern, Classic, Creative, Executive, and Tech.' },
      { q: 'Can I customize the templates?', a: 'Yes! You can customize colors, fonts, spacing, and section order. Premium users get access to advanced customization options.' },
      { q: 'How do I add custom sections?', a: 'In the builder, click "Add Section" and choose from our pre-built sections or create a custom section with your own fields.' },
      { q: 'Does the builder auto-save?', a: 'Yes! Your work is automatically saved as you type. You can also manually save with ⌘S (Ctrl+S on Windows).' },
      { q: 'Can I reorder sections?', a: 'Absolutely! Simply drag and drop sections to reorder them. You can also hide sections you don\'t need.' },
    ],
    ats: [
      { q: 'What is an ATS score?', a: 'ATS (Applicant Tracking System) score measures how well your resume will perform with automated screening systems used by employers. Aim for 80% or higher.' },
      { q: 'How is the ATS score calculated?', a: 'Our algorithm analyzes 50+ factors including keyword relevance, section completeness, formatting, action verb usage, and quantifiable achievements.' },
      { q: 'How can I improve my ATS score?', a: 'Add industry-specific keywords, use standard section headings, include quantifiable achievements, avoid tables and graphics, and use clean formatting.' },
      { q: 'What keywords should I include?', a: 'We provide personalized keyword suggestions based on your target industry and job title. Check the "Suggestions" panel in the builder.' },
      { q: 'Can I scan an existing resume?', a: 'Yes! Use our ATS Scanner to upload your existing resume and get a detailed analysis with specific improvement suggestions.' },
    ],
    security: [
      { q: 'Is my data secure?', a: 'Absolutely. We use 256-bit SSL encryption, and all data is stored securely on Google Cloud Platform with Firebase security rules.' },
      { q: 'Do you share my data?', a: 'Never. We do not sell or share your personal information with third parties. Your data is private and belongs only to you.' },
      { q: 'Are you GDPR compliant?', a: 'Yes, we are fully GDPR compliant. You can request data export or deletion at any time from your account settings.' },
      { q: 'How long do you retain my data?', a: 'We retain your data as long as your account is active. If you delete your account, all data is permanently removed within 30 days.' },
      { q: 'Do you offer two-factor authentication?', a: '2FA is available for premium users. You can enable it from Settings → Security → Two-Factor Authentication.' },
    ],
    export: [
      { q: 'What formats can I export to?', a: 'You can export your resume as PDF (recommended), DOCX (Microsoft Word), or TXT (plain text).' },
      { q: 'Can I password-protect my PDF?', a: 'Yes, premium users can add password protection to exported PDFs for added security.' },
      { q: 'Is there a limit on downloads?', a: 'Free users can download up to 5 times per resume. Premium users have unlimited downloads.' },
      { q: 'Can I share my resume online?', a: 'Yes! Generate a shareable link that updates automatically when you make changes. You can also set the link to expire.' },
      { q: 'Are the exports print-ready?', a: 'Absolutely. All exports are optimized for printing with proper margins and high resolution.' },
    ],
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const expandAll = (categoryId) => {
    const questions = faqData[categoryId] || [];
    const allIds = questions.map((_, i) => `${categoryId}-${i}`);
    setExpandedQuestions(new Set(allIds));
  };

  const collapseAll = (categoryId) => {
    const questions = faqData[categoryId] || [];
    const allIds = questions.map((_, i) => `${categoryId}-${i}`);
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      allIds.forEach(id => newSet.delete(id));
      return newSet;
    });
  };

  const filteredFaqs = useMemo(() => {
    if (!searchTerm) return faqData;

    const filtered = {};
    Object.entries(faqData).forEach(([category, questions]) => {
      const matched = questions.filter(q =>
        q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.a.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matched.length > 0) {
        filtered[category] = matched;
      }
    });
    return filtered;
  }, [searchTerm]);

  const hasSearchResults = Object.keys(filteredFaqs).length > 0;

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <Badge variant="primary" className="mb-4">Help Center</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Find answers to common questions about ResumeAI Pro
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 outline-none text-lg"
              />
            </div>
          </motion.div>

          {/* Category Tabs */}
          {!searchTerm && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setExpandedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    expandedCategory === cat.id
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <cat.icon className={`w-4 h-4 ${expandedCategory === cat.id ? 'text-white' : cat.color}`} />
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* FAQ Content */}
          <div className="max-w-4xl mx-auto">
            {!hasSearchResults ? (
              <Card className="p-12 text-center">
                <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search terms</p>
                <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredFaqs).map(([categoryId, questions]) => {
                  const category = categories.find(c => c.id === categoryId);
                  const isExpanded = expandedCategory === categoryId || !!searchTerm;

                  return (
                    <Card key={categoryId} className="overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => !searchTerm && setExpandedCategory(isExpanded ? null : categoryId)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${category?.color.split('-')[1]}-100 dark:bg-${category?.color.split('-')[1]}-900/30`}>
                            {category && <category.icon className={`w-5 h-5 ${category.color}`} />}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{category?.label}</h3>
                            <p className="text-sm text-gray-500">{questions.length} questions</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!searchTerm && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); expandAll(categoryId); }}
                                className="text-xs text-primary-500 hover:text-primary-600"
                              >
                                Expand All
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); collapseAll(categoryId); }}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Collapse
                              </button>
                            </>
                          )}
                          {!searchTerm && (
                            isExpanded ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Questions */}
                      <AnimatePresence>
                        {(isExpanded || searchTerm) && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 space-y-2">
                              {questions.map((faq, index) => {
                                const questionId = `${categoryId}-${index}`;
                                const isQuestionExpanded = expandedQuestions.has(questionId);

                                return (
                                  <div key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <button
                                      onClick={() => toggleQuestion(questionId)}
                                      className="w-full py-4 flex items-center justify-between text-left hover:text-primary-500 transition-colors"
                                    >
                                      <span className="font-medium">{faq.q}</span>
                                      {isQuestionExpanded ? (
                                        <FiChevronUp className="w-4 h-4 flex-shrink-0 ml-4" />
                                      ) : (
                                        <FiChevronDown className="w-4 h-4 flex-shrink-0 ml-4" />
                                      )}
                                    </button>
                                    <AnimatePresence>
                                      {isQuestionExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <p className="pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {faq.a}
                                          </p>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Still Have Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 text-center"
          >
            <Card className="p-8 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20 inline-block mx-auto">
              <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Can't find the answer you're looking for? We're here to help.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/contact">
                  <Button icon={<FiMail />}>Contact Support</Button>
                </Link>
                <Link to="/help">
                  <Button variant="outline" icon={<FiBook />}>Help Center</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FAQ;