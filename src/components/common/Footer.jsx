import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGithub,
  FiTwitter,
  FiLinkedin,
  FiHeart,
  FiMail,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiFacebook,
  FiInstagram,
  FiYoutube,
  FiStar,
  FiAward,
  FiShield,
  FiCoffee,
  FiChevronUp,
  FiMessageCircle,
  FiMapPin,
  FiClock,
  FiX,
  FiExternalLink,
} from 'react-icons/fi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import toast from 'react-hot-toast';
import { siteConfig } from '../../config/siteConfig';

// ── Constants ───────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const SCROLL_THRESHOLD = 400;

// ── Custom Hook: Online Status ────────────────────────────────────────────

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// ── Component ──────────────────────────────────────────────────────────────

const Footer = () => {
  const config = siteConfig;

  const isOnline = useOnlineStatus();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    try {
      const isSubscribed = localStorage.getItem('newsletter_subscribed') === 'true';
      if (isSubscribed) {
        setSubscribed(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > SCROLL_THRESHOLD);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubscribing(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubscribed(true);
      setNewsletterEmail('');

      try {
        localStorage.setItem('newsletter_subscribed', 'true');
      } catch {
        // Ignore storage errors
      }

      toast.success('Successfully subscribed! Check your inbox.', {
        icon: <FiMail className="w-5 h-5 text-primary-500" />,
        duration: 4000,
      });
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      toast.error('Failed to subscribe. Please try again later.');
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Thank you for your feedback! We appreciate it.', {
        icon: <FiMessageCircle className="w-5 h-5 text-primary-500" />,
        duration: 3000,
      });

      setFeedback('');
      setShowFeedback(false);
    } catch (error) {
      console.error('Feedback submission failed:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const footerLinks = useMemo(
    () => ({
      product: [
        { to: '/templates', label: 'Resume Templates', badge: 'Popular' },
        { to: '/builder', label: 'Resume Builder' },
        { to: '/ats-scanner', label: 'ATS Scanner', badge: 'New' },
        { to: '/cover-letter', label: 'Cover Letter' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/features', label: 'Features' },
      ],
      resources: [
        { to: '/blog', label: 'Blog' },
        { to: '/blog/resume-tips', label: 'Resume Tips' },
        { to: '/blog/career-advice', label: 'Career Advice' },
        { to: '/faq', label: 'FAQ' },
        { to: '/help', label: 'Help Center' },
      ],
      company: [
        { to: '/about', label: 'About Us' },
        { to: '/careers', label: 'Careers', badge: "We're Hiring!" },
        { to: '/contact', label: 'Contact' },
        { to: '/partners', label: 'Partners', disabled: true },
      ],
      legal: [
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/terms', label: 'Terms of Service' },
      ],
      social: [
        { href: config.links?.github, icon: FiGithub, label: 'GitHub' },
        { href: config.links?.twitter, icon: FiTwitter, label: 'Twitter' },
        { href: config.authorLinks?.linkedin, icon: FiLinkedin, label: 'LinkedIn' },
        { href: config.links?.facebook, icon: FiFacebook, label: 'Facebook' },
        { href: config.links?.instagram, icon: FiInstagram, label: 'Instagram' },
        { href: config.links?.youtube, icon: FiYoutube, label: 'YouTube' },
        { href: config.links?.discord, icon: FiMessageCircle, label: 'Discord' },
      ].filter((link) => link.href),
    }),
    [config]
  );

  const contactInfo = useMemo(
    () => [
      {
        icon: FiMail,
        label: 'Email',
        value: config.contact?.email || 'usmanmurtazaportfolio@gmail.com',
        href: `mailto:${config.contact?.email || 'usmanmurtazaportfolio@gmail.com'}`,
      },
      {
        icon: FiMapPin,
        label: 'Location',
        value: config.contact?.address?.city || 'Karachi, PK',
      },
      {
        icon: FiClock,
        label: 'Support Hours',
        value: '24/7 Support',
      },
    ],
    [config]
  );

  return (
    <footer
      className="relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
      role="contentinfo"
    >
      {/* Newsletter Section */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="glass-card p-8 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold gradient-text mb-2">Stay Updated</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get the latest resume tips, career advice, and product updates.
                  </p>
                </div>

                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg"
                  >
                    <FiCheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Subscribed!</span>
                  </motion.div>
                ) : (
                  <form
                    onSubmit={handleSubscribe}
                    className="flex gap-2 w-full md:w-auto"
                    aria-label="Newsletter subscription"
                  >
                    <div className="flex-1 md:w-64">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        icon={<FiMail className="w-4 h-4" />}
                        disabled={subscribing}
                        aria-label="Email address for newsletter"
                        autoComplete="email"
                      />
                    </div>
                    <Button
                      type="submit"
                      loading={subscribing}
                      disabled={subscribing}
                      icon={<FiSend className="w-4 h-4" />}
                    >
                      <span className="hidden sm:inline">Subscribe</span>
                    </Button>
                  </form>
                )}
              </div>

              {/* Quick Contact Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                {contactInfo.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <item.icon
                      className="w-4 h-4 text-primary-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{item.label}:</span>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="hover:text-primary-500 transition-colors truncate"
                        aria-label={`${item.label}: ${item.value}`}
                      >
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
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="Maniesta Career OS Home">
              <div
                className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg shadow-md"
                aria-hidden="true"
              />
              <span className="text-xl font-bold gradient-text">Maniesta Career OS</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              AI-powered resume builder that helps you create ATS-optimized resumes, pass applicant
              tracking systems, and land your dream job faster.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="success" size="sm">
                <FiShield className="w-3 h-3 mr-1" aria-hidden="true" /> SSL Secure
              </Badge>
              <Badge variant="warning" size="sm">
                <FiAward className="w-3 h-3 mr-1" aria-hidden="true" /> GDPR Compliant
              </Badge>
              <Badge variant="primary" size="sm">
                <FiStar className="w-3 h-3 mr-1" aria-hidden="true" /> 4.9/5 Rating
              </Badge>
              {!isOnline && (
                <Badge variant="danger" size="sm">
                  <FiAlertCircle className="w-3 h-3 mr-1" aria-hidden="true" /> Offline
                </Badge>
              )}
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-2" aria-label="Social media links">
              {footerLinks.social.map((social, index) => (
                <Tooltip key={index} content={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-110 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {[
            { title: 'Product', links: footerLinks.product },
            { title: 'Resources', links: footerLinks.resources },
            { title: 'Company', links: footerLinks.company },
            { title: 'Legal', links: footerLinks.legal },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, index) => (
                  <li key={index}>
                    {link.disabled ? (
                      <span className="text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed flex items-center gap-2">
                        {link.label}
                        <Badge variant="default" size="sm">
                          Soon
                        </Badge>
                      </span>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm flex items-center gap-2 group"
                      >
                        {link.label}
                        {link.badge && (
                          <Badge
                            variant={link.badge === "We're Hiring!" ? 'success' : 'primary'}
                            size="sm"
                          >
                            {link.badge}
                          </Badge>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1 flex-wrap justify-center">
              <span>© {CURRENT_YEAR} Maniesta Career OS. All rights reserved.</span>
              <span className="hidden sm:inline mx-2" aria-hidden="true">
                •
              </span>
              <span className="flex items-center gap-1">
                Made with <FiHeart className="w-3 h-3 text-red-500" aria-label="love" /> and{' '}
                <FiCoffee className="w-3 h-3 text-amber-600" aria-label="coffee" />
              </span>
            </p>

            <div className="flex items-center gap-4 text-sm flex-wrap justify-center">
              <button
                onClick={() => setShowFeedback(true)}
                className="text-gray-500 hover:text-primary-500 transition-colors text-xs flex items-center gap-1"
                type="button"
              >
                <FiMessageCircle className="w-3 h-3" aria-hidden="true" /> Feedback
              </button>

              <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
                |
              </span>

              <span className="text-gray-600 dark:text-gray-400 text-xs flex items-center gap-1">
                <span>Built by</span>
                <a
                  href={config.authorLinks?.portfolio || 'https://usmanmurtaza.netlify.app'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                >
                  Usman Murtaza
                  <FiExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </span>
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
            role="dialog"
            aria-modal="true"
            aria-label="Feedback form"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Share Your Feedback
                </h3>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close feedback form"
                  type="button"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                We'd love to hear your thoughts, suggestions, or bug reports!
              </p>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="feedback-type"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Feedback Type
                  </label>
                  <select
                    id="feedback-type"
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={submittingFeedback}
                  >
                    <option value="suggestion">Suggestion</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="feedback-message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your Feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tell us what you think..."
                    required
                    disabled={submittingFeedback}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{feedback.length}/1000</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFeedback(false)}
                    disabled={submittingFeedback}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={submittingFeedback}
                    disabled={!feedback.trim() || submittingFeedback}
                  >
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
            className="fixed bottom-24 right-4 sm:right-6 z-40 p-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="Scroll to top of page"
          >
            <FiChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
};

export default React.memo(Footer);
