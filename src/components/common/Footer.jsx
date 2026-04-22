import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGithub, FiTwitter, FiLinkedin, FiGlobe, FiHeart,
  FiMail, FiSend, FiCheckCircle, FiAlertCircle, FiArrowRight,
  FiFacebook, FiInstagram, FiYoutube, FiStar, FiAward,
  FiShield, FiCoffee, FiZap, FiChevronUp, FiMessageCircle,
  FiThreads, FiMapPin, FiPhone, FiClock,
} from 'react-icons/fi';
import { siteConfig } from '../../config/siteConfig';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import toast from 'react-hot-toast';

// ============================================
// FOOTER COMPONENT
// ============================================

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const isOnline = useOnlineStatus();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubscribing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscribed(true);
      setEmail('');
      localStorage.setItem('newsletter_subscribed', 'true');
      toast.success('Successfully subscribed to newsletter!');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setSubmittingFeedback(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Thank you for your feedback!');
      setFeedback('');
      setShowFeedback(false);
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    product: [
      { to: '/templates', label: 'Resume Templates', badge: 'Popular' },
      { to: '/builder', label: 'Resume Builder', icon: FiZap },
      { to: '/ats-scanner', label: 'ATS Scanner', badge: 'New' },
      { to: '/cover-letter', label: 'Cover Letter' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/features', label: 'Features' },
    ],
    resources: [
      { to: '/blog', label: 'Blog' },
      { to: '/blog/resume-tips', label: 'Resume Tips' },
      { to: '/blog/career-advice', label: 'Career Advice' },
      { to: '/blog/ats-guide', label: 'ATS Guide' },
      { to: '/faq', label: 'FAQ' },
      { to: '/help', label: 'Help Center' },
    ],
    company: [
      { to: '/about', label: 'About Us' },
      { to: '/careers', label: 'Careers', badge: "We're Hiring!" },
      { to: '/press', label: 'Press' },
      { to: '/partners', label: 'Partners' },
      { to: '/contact', label: 'Contact' },
      { to: '/affiliates', label: 'Affiliates' },
    ],
    legal: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Service' },
      { to: '/cookies', label: 'Cookie Policy' },
      { to: '/security', label: 'Security' },
      { to: '/accessibility', label: 'Accessibility' },
      { to: '/sitemap', label: 'Sitemap' },
    ],
    social: [
      { href: siteConfig.links?.github, icon: FiGithub, label: 'GitHub', color: 'hover:text-gray-900 dark:hover:text-white' },
      { href: siteConfig.links?.twitter, icon: FiTwitter, label: 'Twitter', color: 'hover:text-blue-400' },
      { href: siteConfig.authorLinks?.linkedin, icon: FiLinkedin, label: 'LinkedIn', color: 'hover:text-blue-600' },
      { href: siteConfig.links?.facebook, icon: FiFacebook, label: 'Facebook', color: 'hover:text-blue-600' },
      { href: siteConfig.links?.instagram, icon: FiInstagram, label: 'Instagram', color: 'hover:text-pink-500' },
      { href: siteConfig.links?.youtube, icon: FiYoutube, label: 'YouTube', color: 'hover:text-red-500' },
      { href: siteConfig.links?.discord, icon: FiMessageCircle, label: 'Discord', color: 'hover:text-indigo-500' },
    ].filter(link => link.href),
  };

  const contactInfo = [
    { icon: FiMail, value: siteConfig.contact?.email || 'support@resumeaipro.com', href: `mailto:${siteConfig.contact?.email || 'support@resumeaipro.com'}` },
    { icon: FiPhone, value: siteConfig.contact?.phone || '+1 (555) 123-4567', href: `tel:${siteConfig.contact?.phone || '+15551234567'}` },
    { icon: FiMapPin, value: siteConfig.contact?.address?.city || 'San Francisco, CA' },
    { icon: FiClock, value: '24/7 Support' },
  ];

  return (
    <footer className="relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      {/* Newsletter Section */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="glass-card p-8 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold gradient-text mb-2">
                    Stay Updated
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get the latest resume tips, career advice, and product updates.
                  </p>
                </div>

                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-green-600 dark:text-green-400"
                  >
                    <FiCheckCircle className="w-5 h-5" />
                    <span>Thanks for subscribing!</span>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                    <div className="flex-1 md:w-64">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<FiMail className="w-4 h-4" />}
                        disabled={subscribing}
                      />
                    </div>
                    <Button
                      type="submit"
                      loading={subscribing}
                      icon={<FiSend className="w-4 h-4" />}
                    >
                      Subscribe
                    </Button>
                  </form>
                )}
              </div>
              
              {/* Quick Contact Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <item.icon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    {item.href ? (
                      <a href={item.href} className="hover:text-primary-500 transition-colors truncate">
                        {item.value}
                      </a>
                    ) : (
                      <span className="truncate">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg shadow-md" />
              <span className="text-xl font-bold gradient-text">ResumeAI Pro</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              AI-powered resume builder that helps you create ATS-optimized resumes,
              pass applicant tracking systems, and land your dream job faster.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <FiShield className="w-3 h-3" /> SSL Secure
              </Badge>
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <FiAward className="w-3 h-3" /> GDPR Compliant
              </Badge>
              <Badge variant="primary" size="sm" className="flex items-center gap-1">
                <FiStar className="w-3 h-3" /> 4.9/5 Rating
              </Badge>
              {!isOnline && (
                <Badge variant="danger" size="sm" className="flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> Offline Mode
                </Badge>
              )}
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-2">
              {footerLinks.social.map((social, index) => (
                <Tooltip key={index} content={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-110 ${social.color}`}
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    {link.icon && <link.icon className="w-3 h-3 group-hover:text-primary-500" />}
                    {link.label}
                    {link.badge && (
                      <Badge variant="primary" size="sm" className="ml-1">{link.badge}</Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm flex items-center gap-2"
                  >
                    {link.label}
                    {link.badge && (
                      <Badge variant="success" size="sm" className="ml-1">{link.badge}</Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
              © {currentYear} ResumeAI Pro. All rights reserved.
              <span className="hidden sm:inline mx-2">•</span>
              <span className="flex items-center gap-1">
                Made with <FiHeart className="w-3 h-3 text-red-500 animate-pulse" /> and <FiCoffee className="w-3 h-3 text-amber-600" />
              </span>
            </p>

            <div className="flex items-center gap-4 text-sm">
              {/* Feedback Button */}
              <button
                onClick={() => setShowFeedback(true)}
                className="text-gray-500 hover:text-primary-500 transition-colors text-xs flex items-center gap-1"
              >
                <FiMessageSquare className="w-3 h-3" /> Feedback
              </button>

              <span className="text-gray-400">|</span>

              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <span>Designed & Built by</span>
                <a
                  href={siteConfig.authorLinks?.portfolio || 'https://usmanmurtaza.netlify.app'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 transition-colors group"
                >
                  Usman Murtaza
                  <FiGlobe className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                </a>
              </span>

              <span className="text-gray-400">|</span>

              <Link
                to="/sitemap"
                className="text-gray-500 hover:text-primary-500 transition-colors text-xs"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-2">Share Your Feedback</h3>
              <p className="text-sm text-gray-500 mb-4">We'd love to hear your thoughts!</p>
              
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Feedback Type</label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <option value="suggestion">Suggestion</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Your Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
                    placeholder="Tell us what you think..."
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowFeedback(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submittingFeedback}>
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 z-40 p-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Scroll to top"
          >
            <FiChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
};

// Missing icon component
const FiMessageSquare = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export default React.memo(Footer);