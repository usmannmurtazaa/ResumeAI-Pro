import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import {
  FiArrowUp,
  FiMessageCircle,
  FiHelpCircle,
  FiX,
  FiChevronUp,
  FiSend,
  FiUser,
  FiMail,
  FiCheckCircle,
  FiLoader,
  FiThumbsUp,
  FiThumbsDown,
} from 'react-icons/fi';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

const MainLayout = ({
  children,
  showScrollToTop = true,
  showChatSupport = true,
  showHelpWidget = true,
  transparentNavbar = false,
  pageTitle,
  pageDescription,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: '👋 Hi there! How can I help you today?', timestamp: new Date() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatFeedback, setChatFeedback] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showUserForm, setShowUserForm] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef(null);

  const location = useLocation();
  const { scrollY } = useScroll();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      setUserName(user.displayName || '');
      setUserEmail(user.email || '');
      setShowUserForm(false);
    }
  }, [user]);

  // Parallax effect for header
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0.95]);
  const headerBlur = useTransform(scrollY, [0, 300], [0, 8]);

  // Check for saved cookie consent
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

  // Scroll to top button visibility
  useEffect(() => {
    const unsubscribe = scrollY.on('change', (value) => {
      setShowScrollButton(value > 400);
    });
    return () => unsubscribe();
  }, [scrollY]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (showChatWidget) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatWidget]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + / to focus chat
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowChatWidget(true);
      }
      // Escape to close chat
      if (e.key === 'Escape' && showChatWidget) {
        setShowChatWidget(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChatWidget]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCookieConsent = (accepted) => {
    localStorage.setItem('cookieConsent', accepted ? 'accepted' : 'declined');
    setShowCookieConsent(false);
    if (accepted) {
      toast.success('Cookie preferences saved');
    }
  };

  const handleUserFormSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    setShowUserForm(false);
    toast.success('Thanks! How can we help you?');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { type: 'user', text: userMessage, timestamp: new Date() },
    ]);
    setChatInput('');
    setIsTyping(true);

    // Simulate bot response with delay
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: getBotResponse(userMessage),
          timestamp: new Date(),
        },
      ]);
    }, 1500);
  };

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
      return 'You can create a professional resume using our builder! Choose from 25+ ATS-optimized templates. Would you like me to guide you through it?';
    }
    if (lowerMessage.includes('pricing') || lowerMessage.includes('cost')) {
      return 'We offer a free plan with 5 resumes, and Pro plans start at $19/month with unlimited resumes and AI features. Check out our pricing page for details!';
    }
    if (lowerMessage.includes('ats') || lowerMessage.includes('score')) {
      return 'Our ATS scanner analyzes your resume and gives you a compatibility score. Aim for 80% or higher for best results!';
    }
    return "Thanks for your message! Our support team will get back to you soon. In the meantime, you can check our FAQ page for quick answers.";
  };

  const handleChatFeedback = (helpful) => {
    setChatFeedback(helpful);
    toast.success(helpful ? 'Thanks for your feedback!' : 'Thanks! We\'ll improve our responses.');
  };

  const isHomePage = location.pathname === '/';

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        {/* Animated Navbar */}
        <motion.div
          style={{
            opacity: headerOpacity,
            backdropFilter: `blur(${headerBlur}px)`,
          }}
          className={`sticky top-0 z-50 transition-all duration-300 ${
            transparentNavbar && isHomePage && scrollY.get() < 100
              ? 'bg-transparent'
              : 'bg-white/80 dark:bg-gray-900/80'
          }`}
        >
          <Navbar transparent={transparentNavbar && isHomePage && scrollY.get() < 100} />
        </motion.div>

        {/* Main Content */}
        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <Footer />

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollToTop && showScrollButton && (
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
              <FiArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat Support Widget */}
        {showChatSupport && (
          <div className="fixed bottom-6 right-6 z-40">
            <AnimatePresence>
              {showChatWidget && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Chat Header */}
                  <div className="p-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <FiMessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Support Chat</h3>
                          <p className="text-xs opacity-90">We typically reply in a few minutes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs opacity-70 mr-2">⌘/</span>
                        <button
                          onClick={() => setShowChatWidget(false)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* User Info Form */}
                  {showUserForm && !user && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleUserFormSubmit}
                      className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <Input
                        icon={<FiUser />}
                        placeholder="Your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="mb-2"
                        size="sm"
                      />
                      <Input
                        icon={<FiMail />}
                        type="email"
                        placeholder="Your email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="mb-3"
                        size="sm"
                      />
                      <Button type="submit" size="sm" className="w-full">
                        Start Chat
                      </Button>
                    </motion.form>
                  )}

                  {/* Chat Messages */}
                  <div className="h-80 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.type === 'user'
                              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Feedback Buttons */}
                  {chatMessages.length > 2 && chatFeedback === null && (
                    <div className="px-4 pb-2 flex items-center gap-2">
                      <p className="text-xs text-gray-500">Was this helpful?</p>
                      <button
                        onClick={() => handleChatFeedback(true)}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      >
                        <FiThumbsUp className="w-4 h-4 text-green-500" />
                      </button>
                      <button
                        onClick={() => handleChatFeedback(false)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <FiThumbsDown className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}

                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
                        disabled={showUserForm}
                      />
                      <Button type="submit" size="sm" disabled={showUserForm} icon={<FiSend />}>
                        Send
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowChatWidget(!showChatWidget)}
              className="p-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow relative"
              aria-label="Open chat support"
            >
              {showChatWidget ? <FiX className="w-6 h-6" /> : <FiMessageCircle className="w-6 h-6" />}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </motion.button>
          </div>
        )}

        {/* Cookie Consent Banner */}
        <AnimatePresence>
          {showCookieConsent && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50"
            >
              <div className="glass-card p-4 sm:p-5 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:block p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <span className="text-2xl">🍪</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Cookie Consent</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      We use cookies to enhance your experience. By continuing, you agree to our use of cookies.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleCookieConsent(true)}>
                        Accept All
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCookieConsent(false)}>
                        Essential Only
                      </Button>
                      <Link to="/privacy" className="text-xs text-primary-500 hover:text-primary-600 px-3 py-2">
                        Learn More
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCookieConsent(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Widget */}
        {showHelpWidget && (
          <div className="fixed bottom-6 left-6 z-40">
            <motion.a
              href="/help"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <FiHelpCircle className="w-5 h-5 text-primary-500" />
              <span className="hidden sm:inline text-sm font-medium">Help Center</span>
              <span className="hidden lg:inline text-xs text-gray-400 ml-1">⌘?</span>
            </motion.a>
          </div>
        )}

        {/* Back to Top Keyboard Shortcut */}
        <button
          onClick={scrollToTop}
          className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
        >
          Back to top (⌃⌘↑)
        </button>
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout;