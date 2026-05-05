import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiChevronDown, FiChevronUp, FiHelpCircle,
  FiMail, FiBook, FiTarget, FiLock,
  FiDownload, FiUser, FiFileText, FiCreditCard,
} from 'react-icons/fi';
import MainLayout from '../components/layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { usePageTitle } from '../hooks/useDocumentTitle';

// ── Constants ─────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const CATEGORIES = [
  { id: 'general', label: 'General', icon: FiHelpCircle, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'account', label: 'Account & Billing', icon: FiUser, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'builder', label: 'Resume Builder', icon: FiFileText, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'ats', label: 'ATS & Scoring', icon: FiTarget, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { id: 'security', label: 'Security & Privacy', icon: FiLock, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  { id: 'export', label: 'Export & Download', icon: FiDownload, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
];

const FAQ_DATA = {
  general: [
    { q: 'What is ResumeAI Pro?', a: 'ResumeAI Pro is an AI-powered resume builder that helps you create ATS-optimized resumes with real-time scoring, keyword suggestions, and professional templates.' },
    { q: 'Is ResumeAI Pro free?', a: 'Yes! We offer a free plan with 5 resumes, basic templates, and ATS scoring. Premium plans unlock unlimited resumes and advanced AI features.' },
    { q: 'How do I get started?', a: 'Simply sign up for a free account, choose a template, and start building your resume. Our builder guides you through each section.' },
    { q: 'Can I import my existing resume?', a: 'Yes! Upload your existing resume (PDF/DOCX) and our ATS scanner will analyze and populate the builder.' },
    { q: 'Do you offer refunds?', a: 'Yes, we offer a 30-day money-back guarantee on all paid plans.' },
  ],
  account: [
    { q: 'How do I change my password?', a: 'Go to Settings → Security and click "Change Password". Enter your current and new password.' },
    { q: 'How do I cancel my subscription?', a: 'Cancel anytime from Billing → Manage Subscription. Access continues until end of billing period.' },
    { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, and American Express through Stripe. All payments are encrypted.' },
    { q: 'Can I upgrade/downgrade my plan?', a: 'Yes! Change your plan from Billing. Upgrades effective immediately, downgrades at cycle end.' },
    { q: 'How do I delete my account?', a: 'Delete from Settings → Account → Delete Account. This is permanent and cannot be undone.' },
  ],
  builder: [
    { q: 'How many templates do you offer?', a: 'We offer 25+ professionally designed templates: Modern, Classic, Creative, Executive, Tech, and more.' },
    { q: 'Can I customize templates?', a: 'Yes! Customize colors, fonts, spacing, and sections. Premium users get advanced options.' },
    { q: 'How do I add custom sections?', a: 'Click "Add Section" in the builder and choose from pre-built sections or create custom ones.' },
    { q: 'Does the builder auto-save?', a: 'Yes! Auto-saves as you type. Manual save with ⌘S (Ctrl+S on Windows).' },
    { q: 'Can I reorder sections?', a: 'Yes! Drag and drop to reorder. You can also hide unnecessary sections.' },
  ],
  ats: [
    { q: 'What is an ATS score?', a: 'ATS score measures how well your resume performs with automated screening systems. Aim for 80%+.' },
    { q: 'How is the ATS score calculated?', a: 'We analyze 50+ factors: keywords, section completeness, formatting, action verbs, and quantifiable achievements.' },
    { q: 'How can I improve my ATS score?', a: 'Add keywords, use standard headings, include achievements, avoid tables/graphics, use clean formatting.' },
    { q: 'What keywords should I include?', a: 'We provide personalized suggestions based on your target industry and job title.' },
    { q: 'Can I scan an existing resume?', a: 'Yes! Use our ATS Scanner for detailed analysis with improvement suggestions.' },
  ],
  security: [
    { q: 'Is my data secure?', a: 'Yes. 256-bit SSL encryption, stored on Google Cloud with Firebase security rules.' },
    { q: 'Do you share my data?', a: 'Never. We do not sell or share your personal information. Your data is private.' },
    { q: 'Are you GDPR compliant?', a: 'Yes, fully GDPR compliant. Request data export/deletion from account settings.' },
    { q: 'How long do you retain my data?', a: 'Data retained while account is active. Deleted within 30 days of account deletion.' },
    { q: 'Do you offer two-factor authentication?', a: '2FA available for premium users. Enable from Settings → Security.' },
  ],
  export: [
    { q: 'What formats can I export to?', a: 'Export as PDF (recommended), DOCX (Word), or TXT (plain text).' },
    { q: 'Can I password-protect my PDF?', a: 'Yes, premium users can add password protection to exported PDFs.' },
    { q: 'Is there a limit on downloads?', a: 'Free users: 5 downloads per resume. Premium: unlimited downloads.' },
    { q: 'Can I share my resume online?', a: 'Yes! Generate a shareable link that updates automatically. Set expiration dates.' },
    { q: 'Are the exports print-ready?', a: 'Yes. All exports are optimized for printing with proper margins and resolution.' },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────

const FAQ = () => {
  usePageTitle({
    title: 'FAQ - Frequently Asked Questions',
    description: 'Find answers to common questions about ResumeAI Pro - accounts, resume building, ATS scoring, security, and more.',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('general');
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  // ── Handlers ─────────────────────────────────────────────────────────

  const toggleQuestion = useCallback((questionId) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  }, []);

  const expandAll = useCallback((categoryId) => {
    const questions = FAQ_DATA[categoryId] || [];
    const ids = questions.map((_, i) => `${categoryId}-${i}`);
    setExpandedQuestions(prev => new Set([...prev, ...ids]));
  }, []);

  const collapseAll = useCallback((categoryId) => {
    const questions = FAQ_DATA[categoryId] || [];
    const ids = new Set(questions.map((_, i) => `${categoryId}-${i}`));
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const handleCategoryClick = useCallback((categoryId) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  // ── Filtered FAQs ───────────────────────────────────────────────────

  const { filteredFaqs, hasResults } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { filteredFaqs: FAQ_DATA, hasResults: true };
    }

    const term = searchTerm.toLowerCase();
    const filtered = {};
    let hasAny = false;

    Object.entries(FAQ_DATA).forEach(([category, questions]) => {
      const matched = questions.filter(q =>
        q.q.toLowerCase().includes(term) || q.a.toLowerCase().includes(term)
      );
      if (matched.length > 0) {
        filtered[category] = matched;
        hasAny = true;
      }
    });

    return { filteredFaqs: filtered, hasResults: hasAny };
  }, [searchTerm]);

  const isSearching = !!searchTerm.trim();

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <Badge variant="primary" className="mb-4">Help Center</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Find answers to common questions about ResumeAI Pro
            </p>
            <div className="relative max-w-2xl mx-auto">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 outline-none text-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </motion.div>

          {/* Category Tabs */}
          {!isSearching && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    expandedCategory === cat.id
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                  <cat.icon className={`w-4 h-4 ${expandedCategory === cat.id ? 'text-white' : cat.color}`} />
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* FAQ Content */}
          <div className="max-w-4xl mx-auto">
            {!hasResults ? (
              <Card className="p-12 text-center">
                <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search terms</p>
                <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredFaqs).map(([categoryId, questions]) => {
                  const category = CATEGORIES.find(c => c.id === categoryId);
                  const isExpanded = isSearching || expandedCategory === categoryId;

                  return (
                    <Card key={categoryId} className="overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => !isSearching && handleCategoryClick(categoryId)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {category && (
                            <div className={cn('p-2 rounded-lg', category.bg)}>
                              <category.icon className={cn('w-5 h-5', category.color)} />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-semibold">{category?.label || categoryId}</h3>
                            <p className="text-sm text-gray-500">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isSearching && (
                            <>
                              <button onClick={e => { e.stopPropagation(); expandAll(categoryId); }}
                                className="text-xs text-primary-500 hover:text-primary-600">Expand All</button>
                              <button onClick={e => { e.stopPropagation(); collapseAll(categoryId); }}
                                className="text-xs text-gray-400 hover:text-gray-600">Collapse</button>
                            </>
                          )}
                          {!isSearching && (isExpanded ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />)}
                        </div>
                      </button>

                      {/* Questions */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 space-y-2">
                              {questions.map((faq, index) => {
                                const questionId = `${categoryId}-${index}`;
                                const isOpen = expandedQuestions.has(questionId);

                                return (
                                  <div key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <button onClick={() => toggleQuestion(questionId)}
                                      className="w-full py-4 flex items-center justify-between text-left hover:text-primary-500 transition-colors">
                                      <span className="font-medium pr-4">{faq.q}</span>
                                      {isOpen ? <FiChevronUp className="w-4 h-4 flex-shrink-0" /> : <FiChevronDown className="w-4 h-4 flex-shrink-0" />}
                                    </button>
                                    <AnimatePresence>
                                      {isOpen && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <p className="pb-4 text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{faq.a}</p>
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
          <div className="mt-12 text-center">
            <Card className="p-8 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20 inline-block mx-auto">
              <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Can't find what you're looking for? We're here to help.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/contact"><Button icon={<FiMail />}>Contact Support</Button></Link>
                <Link to="/help"><Button variant="outline" icon={<FiBook />}>Help Center</Button></Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FAQ;
