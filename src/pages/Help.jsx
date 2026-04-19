// src/pages/Help.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiHelpCircle, FiBook, FiMessageCircle, FiMail,
  FiChevronRight, FiFileText, FiUser, FiLock, FiCreditCard,
  FiSettings, FiDownload, FiTarget, FiLayout, FiCheckCircle,
  FiAlertCircle, FiExternalLink, FiChevronDown, FiChevronUp,
  FiLifeBuoy, FiVideo, FiBookOpen, FiThumbsUp, FiThumbsDown,
  FiClock, FiArrowRight, FiCopy, FiCheck, FiStar, FiZap,
  FiGlobe, FiSmartphone, FiRefreshCw, FiCloud, FiShield,
  FiMessageSquare, FiUsers, FiCalendar, FiTrendingUp
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const Help = () => {
  useDocumentTitle('Help Center - ResumeAI Pro');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '', email: '', subject: '', message: '', category: 'general'
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState({});
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Simulated search functionality
  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsSearching(true);
      // Simulate API call
      setTimeout(() => {
        const results = helpCategories.flatMap(cat => 
          cat.articles.filter(article => 
            article.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          ).map(article => ({ ...article, category: cat.title }))
        );
        setSearchResults(results);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  // Save recent searches
  const handleSearch = (term) => {
    if (term && !recentSearches.includes(term)) {
      setRecentSearches(prev => [term, ...prev].slice(0, 5));
      localStorage.setItem('recentSearches', JSON.stringify([term, ...recentSearches].slice(0, 5)));
    }
  };

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const helpCategories = [
    {
      icon: FiUser,
      title: 'Getting Started',
      description: 'Learn the basics of ResumeAI Pro',
      articles: [
        { title: 'Creating your first resume', slug: 'creating-first-resume', readTime: '5 min' },
        { title: 'Understanding ATS scores', slug: 'understanding-ats-scores', readTime: '4 min' },
        { title: 'Choosing the right template', slug: 'choosing-template', readTime: '3 min' },
        { title: 'Account setup guide', slug: 'account-setup', readTime: '6 min' }
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FiFileText,
      title: 'Resume Building',
      description: 'Master the resume builder',
      articles: [
        { title: 'Adding work experience', slug: 'adding-experience', readTime: '4 min' },
        { title: 'Optimizing for ATS', slug: 'ats-optimization', readTime: '7 min' },
        { title: 'Using AI suggestions', slug: 'ai-suggestions', readTime: '5 min' },
        { title: 'Customizing sections', slug: 'customizing-sections', readTime: '3 min' }
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: FiLock,
      title: 'Account & Security',
      description: 'Manage your account settings',
      articles: [
        { title: 'Changing your password', slug: 'change-password', readTime: '2 min' },
        { title: 'Two-factor authentication', slug: 'two-factor-auth', readTime: '5 min' },
        { title: 'Privacy settings', slug: 'privacy-settings', readTime: '3 min' },
        { title: 'Deleting your account', slug: 'delete-account', readTime: '2 min' }
      ],
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: FiCreditCard,
      title: 'Billing & Plans',
      description: 'Understand pricing and billing',
      articles: [
        { title: 'Upgrading to Pro', slug: 'upgrading-to-pro', readTime: '3 min' },
        { title: 'Managing subscription', slug: 'manage-subscription', readTime: '4 min' },
        { title: 'Cancel subscription', slug: 'cancel-subscription', readTime: '2 min' },
        { title: 'Refund policy', slug: 'refund-policy', readTime: '3 min' }
      ],
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: FiDownload,
      title: 'Export & Download',
      description: 'Export your resumes',
      articles: [
        { title: 'Downloading as PDF', slug: 'download-pdf', readTime: '2 min' },
        { title: 'Export formats', slug: 'export-formats', readTime: '3 min' },
        { title: 'Printing resumes', slug: 'printing-resumes', readTime: '2 min' },
        { title: 'Sharing resumes', slug: 'sharing-resumes', readTime: '3 min' }
      ],
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: FiTarget,
      title: 'ATS Scanner',
      description: 'Optimize existing resumes',
      articles: [
        { title: 'How ATS scanning works', slug: 'ats-scanning', readTime: '5 min' },
        { title: 'Improving your score', slug: 'improve-score', readTime: '6 min' },
        { title: 'Keyword optimization', slug: 'keyword-optimization', readTime: '4 min' },
        { title: 'Common ATS issues', slug: 'ats-issues', readTime: '5 min' }
      ],
      color: 'from-teal-500 to-green-500'
    }
  ];

  const faqs = [
    {
      question: 'What is an ATS-optimized resume?',
      answer: 'An ATS-optimized resume is designed to pass through Applicant Tracking Systems used by employers. It uses standard formatting, relevant keywords, and clean structure to ensure your application reaches human recruiters.',
      category: 'ATS'
    },
    {
      question: 'Is ResumeAI Pro free to use?',
      answer: 'Yes! ResumeAI Pro offers a free plan that includes one resume, basic templates, and ATS scoring. Premium plans unlock unlimited resumes, AI suggestions, and advanced features.',
      category: 'Billing'
    },
    {
      question: 'Can I import my existing resume?',
      answer: 'Yes, you can import your existing resume from PDF, DOCX, or LinkedIn. Our ATS scanner will analyze it and provide suggestions for improvement.',
      category: 'Features'
    },
    {
      question: 'How is the ATS score calculated?',
      answer: 'The ATS score is calculated based on multiple factors including keyword relevance, section completeness, formatting, action verb usage, and quantifiable achievements. Aim for 80% or higher for best results.',
      category: 'ATS'
    },
    {
      question: 'Can I change templates after creating a resume?',
      answer: 'Yes! You can switch between any of our templates at any time. Your content will automatically reformat to fit the new template design.',
      category: 'Templates'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use 256-bit SSL encryption, and your data is never shared with third parties. You can delete your data at any time.',
      category: 'Security'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact our support team for a full refund.',
      category: 'Billing'
    },
    {
      question: 'Can I use ResumeAI Pro on mobile?',
      answer: 'Yes! ResumeAI Pro is fully responsive and works on all devices. You can create and edit resumes on your smartphone or tablet.',
      category: 'Features'
    }
  ];

  const popularArticles = [
    { title: 'Getting Started with ResumeAI Pro', views: '12.5K', category: 'Getting Started', icon: FiZap },
    { title: 'How to Achieve a 90+ ATS Score', views: '8.2K', category: 'ATS Optimization', icon: FiTarget },
    { title: 'Choosing the Perfect Template', views: '6.8K', category: 'Templates', icon: FiLayout },
    { title: 'AI-Powered Resume Writing Tips', views: '5.4K', category: 'AI Features', icon: FiStar },
    { title: 'Exporting and Sharing Your Resume', views: '4.1K', category: 'Export', icon: FiDownload }
  ];

  const communityTopics = [
    { title: 'Share your resume success story!', replies: 234, views: 5678 },
    { title: 'Tips for passing ATS at FAANG companies', replies: 156, views: 4321 },
    { title: 'Which template got you the most interviews?', replies: 89, views: 3456 },
    { title: 'Career change resume advice needed', replies: 67, views: 2345 }
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setContactForm({ name: '', email: '', subject: '', message: '', category: 'general' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = (articleId, helpful) => {
    setFeedbackSubmitted(prev => ({ ...prev, [articleId]: helpful }));
    toast.success(helpful ? 'Thanks for your feedback!' : 'Thanks! We\'ll improve this article.');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto mb-8"
          >
            <Badge variant="primary" className="mb-4">Help Center</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How can we{' '}
              <span className="gradient-text">help you?</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Find answers, tutorials, and support for all your resume building needs
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) handleSearch(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 outline-none text-lg"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <FiRefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !searchTerm && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="text-xs text-gray-400">Recent:</span>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchTerm(term)}
                    className="text-xs text-primary-500 hover:text-primary-600"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: FiBookOpen, label: 'Documentation', color: 'bg-blue-500', desc: 'Guides & API docs' },
              { icon: FiVideo, label: 'Video Tutorials', color: 'bg-purple-500', desc: 'Watch and learn' },
              { icon: FiMessageSquare, label: 'Community', color: 'bg-green-500', desc: 'Join the discussion' },
              { icon: FiLifeBuoy, label: '24/7 Support', color: 'bg-orange-500', desc: 'Always here to help' }
            ].map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-4 text-center hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </motion.button>
            ))}
          </div>

          {/* Search Results */}
          {searchTerm && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">
                Search Results for "{searchTerm}"
              </h2>
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <Link to={`/help/${result.slug}`} className="flex items-start gap-4">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                          <FiFileText className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white hover:text-primary-500">
                            {result.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary" size="sm">{result.category}</Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              {result.readTime}
                            </span>
                          </div>
                        </div>
                        <FiChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search terms or browse our categories below.
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Help Categories */}
          {!searchTerm && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Browse by Category</h2>
                <Link to="/help/categories" className="text-primary-500 hover:text-primary-600 text-sm flex items-center gap-1">
                  View all <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {helpCategories.map((category, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="p-6 h-full hover:shadow-xl transition-all">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {category.description}
                      </p>
                      <ul className="space-y-2">
                        {category.articles.map((article, idx) => (
                          <li key={idx}>
                            <Link
                              to={`/help/${article.slug}`}
                              className="text-gray-700 dark:text-gray-300 hover:text-primary-500 text-sm flex items-center justify-between group"
                            >
                              <span className="flex items-center gap-2">
                                <span>{article.title}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{article.readTime}</span>
                                <FiChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to={`/help/category/${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="inline-flex items-center gap-1 text-primary-500 text-sm mt-4 hover:text-primary-600"
                      >
                        See all articles <FiArrowRight className="w-3 h-3" />
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {!searchTerm && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                <Link to="/help/faq" className="text-primary-500 hover:text-primary-600 text-sm flex items-center gap-1">
                  View all FAQs <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <Card className="divide-y divide-gray-200 dark:divide-gray-700">
                {faqs.slice(0, 6).map((faq, index) => (
                  <div key={index} className="py-4 first:pt-0 last:pb-0">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" size="sm">{faq.category}</Badge>
                        <span className="font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                          {faq.question}
                        </span>
                      </div>
                      {expandedFaq === index ? (
                        <FiChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedFaq === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-gray-600 dark:text-gray-400 pt-4 pl-20">
                            {faq.answer}
                          </p>
                          <div className="flex items-center gap-4 mt-3 pl-20">
                            <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                              <FiCopy className="w-3 h-3" /> Copy link
                            </button>
                            <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                              <FiThumbsUp className="w-3 h-3" /> Helpful
                            </button>
                            <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                              <FiThumbsDown className="w-3 h-3" /> Not helpful
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Popular Articles & Community & Contact */}
          {!searchTerm && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Popular Articles */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiTrendingUp className="w-5 h-5 text-primary-500" />
                  Popular Articles
                </h2>
                <Card className="divide-y divide-gray-200 dark:divide-gray-700">
                  {popularArticles.map((article, index) => (
                    <Link
                      key={index}
                      to={`/help/${article.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-3 -mx-3 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <article.icon className="w-4 h-4 text-primary-500" />
                        <span className="text-sm text-gray-900 dark:text-white group-hover:text-primary-500">
                          {article.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{article.views}</span>
                    </Link>
                  ))}
                </Card>
              </div>

              {/* Community */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-green-500" />
                  Community Discussions
                </h2>
                <Card className="divide-y divide-gray-200 dark:divide-gray-700">
                  {communityTopics.map((topic, index) => (
                    <Link
                      key={index}
                      to="/community"
                      className="block py-3 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-3 -mx-3 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-500">
                        {topic.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{topic.replies} replies</span>
                        <span className="text-xs text-gray-400">{topic.views} views</span>
                      </div>
                    </Link>
                  ))}
                </Card>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  Join the Community
                </Button>
              </div>

              {/* Contact Support */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiMessageCircle className="w-5 h-5 text-blue-500" />
                  Contact Support
                </h2>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FiMail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Email Support</p>
                      <button 
                        onClick={() => copyToClipboard('support@resumeaipro.com')}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        support@resumeaipro.com <FiCopy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                        size="sm"
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                        size="sm"
                      />
                    </div>
                    <select
                      value={contactForm.category}
                      onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="billing">Billing Question</option>
                      <option value="technical">Technical Support</option>
                      <option value="feature">Feature Request</option>
                    </select>
                    <Input
                      placeholder="Subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      required
                      size="sm"
                    />
                    <textarea
                      placeholder="How can we help?"
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                      required
                    />
                    <Button type="submit" loading={submitting} className="w-full" size="sm">
                      Send Message
                    </Button>
                  </form>
                  
                  <p className="text-xs text-gray-500 text-center mt-3">
                    <FiClock className="w-3 h-3 inline mr-1" />
                    We typically respond within 24 hours
                  </p>
                </Card>
              </div>
            </div>
          )}

          {/* Still Need Help */}
          {!searchTerm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-center"
            >
              <Card className="p-8 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20 inline-block mx-auto">
                <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our support team is available 24/7 to assist you.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={() => setShowLiveChat(true)} icon={<FiMessageCircle />}>
                    Start Live Chat
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = 'mailto:support@resumeaipro.com'}>
                    Email Us
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Live Chat Modal */}
      <Modal
        isOpen={showLiveChat}
        onClose={() => setShowLiveChat(false)}
        title="Live Chat Support"
        size="md"
      >
        <div className="h-96 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiLifeBuoy className="w-4 h-4 text-primary-500" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl rounded-tl-none">
                <p className="text-sm">👋 Hi there! How can we help you today?</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex gap-2">
              <Input placeholder="Type your message..." className="flex-1" />
              <Button>Send</Button>
            </div>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Help;