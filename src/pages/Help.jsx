import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiHelpCircle, FiBook, FiMessageCircle, FiMail,
  FiChevronRight, FiFileText, FiUser, FiLock, FiCreditCard,
  FiDownload, FiTarget, FiLayout, FiCheckCircle,
  FiExternalLink, FiChevronDown, FiChevronUp,
  FiLifeBuoy, FiVideo, FiBookOpen, FiThumbsUp, FiThumbsDown,
  FiClock, FiArrowRight, FiCopy, FiStar, FiZap,
  FiRefreshCw, FiMessageSquare, FiUsers, FiTrendingUp,
  FiAlertCircle, FiX,
} from 'react-icons/fi';
import MainLayout from '../components/layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { usePageTitle } from '../hooks/useDocumentTitle';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const HELP_CATEGORIES = [
  {
    icon: FiUser, title: 'Getting Started', description: 'Learn the basics of ResumeAI Pro',
    articles: [
      { title: 'Creating your first resume', readTime: '5 min' },
      { title: 'Understanding ATS scores', readTime: '4 min' },
      { title: 'Choosing the right template', readTime: '3 min' },
      { title: 'Account setup guide', readTime: '6 min' },
    ],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FiFileText, title: 'Resume Building', description: 'Master the resume builder',
    articles: [
      { title: 'Adding work experience', readTime: '4 min' },
      { title: 'Optimizing for ATS', readTime: '7 min' },
      { title: 'Using AI suggestions', readTime: '5 min' },
      { title: 'Customizing sections', readTime: '3 min' },
    ],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: FiLock, title: 'Account & Security', description: 'Manage your account settings',
    articles: [
      { title: 'Changing your password', readTime: '2 min' },
      { title: 'Two-factor authentication', readTime: '5 min' },
      { title: 'Privacy settings', readTime: '3 min' },
      { title: 'Deleting your account', readTime: '2 min' },
    ],
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FiCreditCard, title: 'Billing & Plans', description: 'Understand pricing and billing',
    articles: [
      { title: 'Upgrading to Pro', readTime: '3 min' },
      { title: 'Managing subscription', readTime: '4 min' },
      { title: 'Cancel subscription', readTime: '2 min' },
      { title: 'Refund policy', readTime: '3 min' },
    ],
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FiDownload, title: 'Export & Download', description: 'Export your resumes',
    articles: [
      { title: 'Downloading as PDF', readTime: '2 min' },
      { title: 'Export formats', readTime: '3 min' },
      { title: 'Printing resumes', readTime: '2 min' },
      { title: 'Sharing resumes', readTime: '3 min' },
    ],
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: FiTarget, title: 'ATS Scanner', description: 'Optimize existing resumes',
    articles: [
      { title: 'How ATS scanning works', readTime: '5 min' },
      { title: 'Improving your score', readTime: '6 min' },
      { title: 'Keyword optimization', readTime: '4 min' },
      { title: 'Common ATS issues', readTime: '5 min' },
    ],
    color: 'from-teal-500 to-green-500',
  },
];

const FAQS = [
  { q: 'What is an ATS-optimized resume?', a: 'An ATS-optimized resume is designed to pass through Applicant Tracking Systems used by employers. It uses standard formatting, relevant keywords, and clean structure.', category: 'ATS' },
  { q: 'Is ResumeAI Pro free to use?', a: 'Yes! We offer a free plan with 5 resumes, basic templates, and ATS scoring.', category: 'Billing' },
  { q: 'Can I import my existing resume?', a: 'Yes! Import from PDF, DOCX, or LinkedIn. Our scanner will analyze and provide suggestions.', category: 'Features' },
  { q: 'How is the ATS score calculated?', a: 'Based on keyword relevance, section completeness, formatting, action verbs, and quantifiable achievements. Aim for 80%+.', category: 'ATS' },
  { q: 'Can I change templates after creating a resume?', a: 'Yes! Switch templates anytime. Your content automatically reformats.', category: 'Templates' },
  { q: 'Is my data secure?', a: 'Absolutely. 256-bit SSL encryption. Data never shared. Delete anytime.', category: 'Security' },
];

const POPULAR_ARTICLES = [
  { title: 'Getting Started with ResumeAI Pro', views: '12.5K', icon: FiZap },
  { title: 'How to Achieve a 90+ ATS Score', views: '8.2K', icon: FiTarget },
  { title: 'Choosing the Perfect Template', views: '6.8K', icon: FiLayout },
  { title: 'AI-Powered Resume Writing Tips', views: '5.4K', icon: FiStar },
  { title: 'Exporting and Sharing Your Resume', views: '4.1K', icon: FiDownload },
];

const QUICK_LINKS = [
  { icon: FiBookOpen, label: 'Documentation', color: 'bg-blue-500', desc: 'Guides & API docs' },
  { icon: FiVideo, label: 'Video Tutorials', color: 'bg-purple-500', desc: 'Watch and learn' },
  { icon: FiMessageSquare, label: 'Community', color: 'bg-green-500', desc: 'Join discussions' },
  { icon: FiLifeBuoy, label: '24/7 Support', color: 'bg-orange-500', desc: 'Always available' },
];

const INITIAL_CONTACT = { name: '', email: '', subject: '', message: '', category: 'general' };

// ── Component ─────────────────────────────────────────────────────────────

const Help = () => {
  usePageTitle({
    title: 'Help Center',
    description: 'Find answers, tutorials, and support for all your resume building needs. Search our knowledge base or contact our 24/7 support team.',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState(INITIAL_CONTACT);
  const [submitting, setSubmitting] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('helpRecentSearches') || '[]');
    } catch { return []; }
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ── Search Results ───────────────────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return [];
    
    const term = debouncedSearchTerm.toLowerCase();
    return HELP_CATEGORIES.flatMap(cat =>
      cat.articles
        .filter(a => a.title.toLowerCase().includes(term))
        .map(a => ({ ...a, category: cat.title }))
    );
  }, [debouncedSearchTerm]);

  const isSearching = searchTerm !== debouncedSearchTerm;

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSearch = useCallback((term) => {
    if (term.trim()) {
      setRecentSearches(prev => {
        const updated = [term, ...prev.filter(s => s !== term)].slice(0, 5);
        try { localStorage.setItem('helpRecentSearches', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  }, []);

  const handleContactSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setContactForm(INITIAL_CONTACT);
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  }, [contactForm]);

  const copyEmail = useCallback(() => {
    navigator.clipboard?.writeText('support@resumeaipro.com');
    toast.success('Email copied!');
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero & Search */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto mb-8"
          >
            <Badge variant="primary" className="mb-4">Help Center</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How can we <span className="gradient-text">help you?</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Find answers, tutorials, and support for all your resume building needs
            </p>

            <div className="max-w-2xl mx-auto relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.trim()) handleSearch(e.target.value);
                }}
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 focus:ring-2 focus:ring-primary-500 outline-none text-lg"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FiX className="w-5 h-5" />
                </button>
              )}
              {isSearching && (
                <FiRefreshCw className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 animate-spin w-5 h-5" />
              )}
            </div>

            {recentSearches.length > 0 && !searchTerm && (
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
                <span className="text-gray-400">Recent:</span>
                {recentSearches.map((term, i) => (
                  <button key={i} onClick={() => setSearchTerm(term)} className="text-primary-500 hover:text-primary-600">
                    {term}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {QUICK_LINKS.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.02 }}
                className="glass-card p-4 text-center hover:shadow-lg transition-all cursor-pointer">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Search Results or Categories */}
          {searchTerm ? (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Results for "{searchTerm}"</h2>
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((result, i) => (
                    <Card key={i} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                          <FiFileText className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{result.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary" size="sm">{result.category}</Badge>
                            <span className="text-xs text-gray-500"><FiClock className="w-3 h-3 inline mr-1" />{result.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search terms</p>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
                </Card>
              )}
            </div>
          ) : (
            <>
              {/* Categories */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {HELP_CATEGORIES.map((cat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}>
                      <Card className="p-6 h-full">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4`}>
                          <cat.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{cat.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{cat.description}</p>
                        <ul className="space-y-2">
                          {cat.articles.map((article, j) => (
                            <li key={j}>
                              <Link to={`/help/${article.title.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-gray-700 dark:text-gray-300 hover:text-primary-500 text-sm flex items-center justify-between group">
                                <span>{article.title}</span>
                                <span className="text-xs text-gray-400">{article.readTime}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                <Card className="divide-y divide-gray-200 dark:divide-gray-700">
                  {FAQS.map((faq, i) => (
                    <div key={i} className="px-6">
                      <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full py-4 flex items-center justify-between text-left">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" size="sm">{faq.category}</Badge>
                          <span className="font-medium text-sm">{faq.q}</span>
                        </div>
                        {expandedFaq === i ? <FiChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {expandedFaq === i && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <p className="pb-4 text-gray-600 dark:text-gray-400 text-sm pl-16">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </Card>
              </div>

              {/* Popular Articles + Contact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiTrendingUp className="w-5 h-5 text-primary-500" />Popular Articles</h2>
                  <Card className="divide-y divide-gray-200 dark:divide-gray-700">
                    {POPULAR_ARTICLES.map((article, i) => (
                      <Link key={i} to={`/help/${article.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex items-center justify-between py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <article.icon className="w-4 h-4 text-primary-500" />
                          <span className="text-sm">{article.title}</span>
                        </div>
                        <span className="text-xs text-gray-400">{article.views} views</span>
                      </Link>
                    ))}
                  </Card>
                </div>

                {/* Contact Form */}
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiMessageCircle className="w-5 h-5 text-blue-500" />Contact Support</h2>
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FiMail className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Email Support</p>
                        <button onClick={copyEmail} className="text-xs text-blue-600 hover:underline">
                          support@resumeaipro.com <FiCopy className="w-3 h-3 inline" />
                        </button>
                      </div>
                    </div>
                    <form onSubmit={handleContactSubmit} className="space-y-3">
                      <Input placeholder="Your Name" value={contactForm.name}
                        onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} size="sm" required />
                      <Input type="email" placeholder="Your Email" value={contactForm.email}
                        onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} size="sm" required />
                      <input placeholder="Subject" value={contactForm.subject}
                        onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                      <textarea placeholder="How can we help?" rows={3} value={contactForm.message}
                        onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 outline-none resize-none" required />
                      <Button type="submit" loading={submitting} className="w-full" size="sm">Send Message</Button>
                    </form>
                    <p className="text-xs text-gray-500 text-center mt-3"><FiClock className="w-3 h-3 inline mr-1" />Response within 24 hours</p>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Help;
