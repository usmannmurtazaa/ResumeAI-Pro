import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiMail, FiPhone, FiMapPin, FiSend, FiClock,
  FiMessageCircle, FiHelpCircle, FiAlertCircle, FiCheckCircle,
  FiTwitter, FiLinkedin, FiGithub, FiFacebook, FiInstagram,
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const Contact = () => {
  useDocumentTitle('Contact Us - ResumeAI Pro');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contactInfo = [
    { icon: FiMail, label: 'Email', value: 'support@resumeaipro.com', link: 'mailto:support@resumeaipro.com', color: 'text-blue-500' },
    { icon: FiPhone, label: 'Phone', value: '+1 (555) 123-4567', link: 'tel:+15551234567', color: 'text-green-500' },
    { icon: FiMapPin, label: 'Office', value: 'San Francisco, CA', color: 'text-purple-500' },
    { icon: FiClock, label: 'Support Hours', value: '24/7 - Always here to help', color: 'text-orange-500' },
  ];

  const socialLinks = [
    { icon: FiTwitter, href: 'https://twitter.com/resumeaipro', label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: FiLinkedin, href: 'https://linkedin.com/company/resumeaipro', label: 'LinkedIn', color: 'hover:text-blue-600' },
    { icon: FiGithub, href: 'https://github.com/resumeaipro', label: 'GitHub', color: 'hover:text-gray-900 dark:hover:text-white' },
    { icon: FiFacebook, href: 'https://facebook.com/resumeaipro', label: 'Facebook', color: 'hover:text-blue-600' },
    { icon: FiInstagram, href: 'https://instagram.com/resumeaipro', label: 'Instagram', color: 'hover:text-pink-500' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Contact form submitted:', formData);
      
      setSubmitted(true);
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      
      // Reset form
      setFormData({ name: '', email: '', subject: '', category: 'general', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
            <Badge variant="primary" className="mb-4">Get in Touch</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contact <span className="gradient-text">Us</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiMessageCircle className="w-5 h-5 text-primary-500" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{item.label}</p>
                        {item.link ? (
                          <a href={item.link} className="font-medium hover:text-primary-500 transition-colors">
                            {item.value}
                          </a>
                        ) : (
                          <p className="font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 mb-3">Follow Us</p>
                  <div className="flex gap-2">
                    {socialLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${social.color}`}
                        aria-label={social.label}
                      >
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
                    <p className="text-sm font-medium"> Karachi, PK</p>
                    <p className="text-xs text-gray-500">Remote-First Company</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-6 md:p-8">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiCheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                    <Button onClick={() => setSubmitted(false)}>Send Another Message</Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Your Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="ALex Richer"
                        required
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="alexricher@example.com"
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
                        required
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="general">General Inquiry</option>
                          <option value="support">Technical Support</option>
                          <option value="billing">Billing Question</option>
                          <option value="feature">Feature Request</option>
                          <option value="feedback">Feedback</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className="input-field resize-none"
                        placeholder="Tell us how we can help..."
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between">
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
              <Link to="/faq">
                <Card className="p-6 text-center hover:shadow-xl transition-shadow group">
                  <FiHelpCircle className="w-8 h-8 text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold mb-1">FAQ</h4>
                  <p className="text-sm text-gray-500">Find answers to common questions</p>
                </Card>
              </Link>
              <Link to="/help">
                <Card className="p-6 text-center hover:shadow-xl transition-shadow group">
                  <FiBook className="w-8 h-8 text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold mb-1">Help Center</h4>
                  <p className="text-sm text-gray-500">Browse guides and tutorials</p>
                </Card>
              </Link>
              <Link to="/blog">
                <Card className="p-6 text-center hover:shadow-xl transition-shadow group">
                  <FiMessageCircle className="w-8 h-8 text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold mb-1">Blog</h4>
                  <p className="text-sm text-gray-500">Tips, news, and career advice</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;