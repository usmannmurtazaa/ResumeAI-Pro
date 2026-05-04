import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiMail, FiPhone, FiMapPin, FiSend, FiClock,
  FiMessageCircle, FiHelpCircle, FiCheckCircle, FiBookOpen,
  FiTwitter, FiLinkedin, FiGithub, FiFacebook, FiInstagram,
  FiAlertCircle,
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const CONTACT_INFO = [
  { icon: FiMail, label: 'Email', value: 'support@resumeaipro.com', link: 'mailto:support@resumeaipro.com', color: 'text-blue-500' },
  { icon: FiPhone, label: 'Phone', value: '+1 (555) 123-4567', link: 'tel:+15551234567', color: 'text-green-500' },
  { icon: FiMapPin, label: 'Office', value: 'San Francisco, CA', color: 'text-purple-500' },
  { icon: FiClock, label: 'Support Hours', value: '24/7 - Always here to help', color: 'text-orange-500' },
];

const SOCIAL_LINKS = [
  { icon: FiTwitter, href: 'https://twitter.com/resumeaipro', label: 'Twitter', color: 'hover:text-blue-400' },
  { icon: FiLinkedin, href: 'https://linkedin.com/company/resumeaipro', label: 'LinkedIn', color: 'hover:text-blue-600' },
  { icon: FiGithub, href: 'https://github.com/resumeaipro', label: 'GitHub', color: 'hover:text-gray-900 dark:hover:text-white' },
  { icon: FiFacebook, href: 'https://facebook.com/resumeaipro', label: 'Facebook', color: 'hover:text-blue-600' },
  { icon: FiInstagram, href: 'https://instagram.com/resumeaipro', label: 'Instagram', color: 'hover:text-pink-500' },
];

const CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
];

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  subject: '',
  category: 'general',
  message: '',
};

// ── Validation ───────────────────────────────────────────────────────────

const validateForm = (data) => {
  const errors = {};

  if (!data.name.trim()) errors.name = 'Name is required';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Invalid email format';
  if (!data.subject.trim()) errors.subject = 'Subject is required';
  if (!data.message.trim()) errors.message = 'Message is required';
  else if (data.message.trim().length < 10) errors.message = 'Message must be at least 10 characters';

  return errors;
};

// ── Component ─────────────────────────────────────────────────────────────

const Contact = () => {
  usePageTitle({
    title: 'Contact Us',
    description: 'Get in touch with ResumeAI Pro. Send us a message and we\'ll respond within 24 hours.',
  });

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the form errors before submitting.');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // In production, send to your API
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // if (!response.ok) throw new Error('Failed to send');

      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitted(true);
      toast.success("Message sent! We'll get back to you within 24 hours.", { icon: '📨' });
      setFormData(INITIAL_FORM_DATA);
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setErrors({});
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <Badge variant="primary" className="mb-4">Get in Touch</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contact <span className="gradient-text">Us</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiMessageCircle className="w-5 h-5 text-primary-500" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  {CONTACT_INFO.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{item.label}</p>
                        {item.link ? (
                          <a href={item.link} className="font-medium hover:text-primary-500 transition-colors text-sm">
                            {item.value}
                          </a>
                        ) : (
                          <p className="font-medium text-sm">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 mb-3">Follow Us</p>
                  <div className="flex gap-2">
                    {SOCIAL_LINKS.map((social, index) => (
                      <a key={index} href={social.href} target="_blank" rel="noopener noreferrer"
                        className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${social.color}`}
                        aria-label={social.label}>
                        <social.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Map Placeholder */}
              <Card className="p-2 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 h-48 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FiMapPin className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Karachi, PK</p>
                    <p className="text-xs text-gray-500">Remote-First Company</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-6 md:p-8">
                {submitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiCheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                    <Button onClick={handleReset}>Send Another Message</Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Your Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Alex Richer"
                        error={errors.name}
                        icon={<FiUser />}
                        required
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="alex@example.com"
                        error={errors.email}
                        icon={<FiMail />}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this about?"
                        error={errors.subject}
                        required
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Category
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                          required
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none text-sm ${
                          errors.message ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        placeholder="Tell us how we can help..."
                        maxLength={1000}
                        required
                      />
                      <div className="flex justify-between mt-1">
                        {errors.message ? (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <FiAlertCircle className="w-3.5 h-3.5" />{errors.message}
                          </p>
                        ) : (
                          <span />
                        )}
                        <p className="text-xs text-gray-400">
                          {formData.message.length}/1000
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-gray-500">
                        We typically respond within 24 hours
                      </p>
                      <Button type="submit" loading={loading} icon={<FiSend />}>
                        Send Message
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            </div>
          </div>

          {/* Quick Help Links */}
          <div className="max-w-6xl mx-auto mt-12">
            <h3 className="text-xl font-semibold text-center mb-6">Quick Help</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { to: '/faq', icon: FiHelpCircle, title: 'FAQ', desc: 'Find answers to common questions' },
                { to: '/help', icon: FiBookOpen, title: 'Help Center', desc: 'Browse guides and tutorials' },
                { to: '/blog', icon: FiMessageCircle, title: 'Blog', desc: 'Tips, news, and career advice' },
              ].map(({ to, icon: Icon, title, desc }) => (
                <Link key={to} to={to}>
                  <Card className="p-6 text-center hover:shadow-xl transition-shadow group">
                    <Icon className="w-8 h-8 text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="font-semibold mb-1">{title}</h4>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// Missing FiUser icon
const FiUser = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default Contact;