import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { 
  FiArrowUp, 
  FiMessageCircle, 
  FiHelpCircle,
  FiX,
  FiChevronUp
} from 'react-icons/fi';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const MainLayout = ({ 
  children, 
  showScrollToTop = true,
  showChatSupport = true,
  transparentNavbar = false 
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: '👋 Hi there! How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  const location = useLocation();
  const { scrollY } = useScroll();
  const { user } = useAuth();
  const { isDark } = useTheme();
  
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

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle cookie consent
  const handleCookieConsent = (accepted) => {
    localStorage.setItem('cookieConsent', accepted ? 'accepted' : 'declined');
    setShowCookieConsent(false);
    if (accepted) {
      toast.success('Cookie preferences saved');
    }
  };

  // Handle chat submit
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages(prev => [...prev, { type: 'user', text: chatInput }]);
    setChatInput('');

    // Simulate bot response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Thanks for your message! Our support team will get back to you soon. In the meantime, you can check our FAQ page for quick answers.' 
      }]);
    }, 1000);
  };

  // Check if current page is home
  const isHomePage = location.pathname === '/';

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        {/* Animated Navbar */}
        <motion.div
          style={{ 
            opacity: headerOpacity,
            backdropFilter: `blur(${headerBlur}px)`
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
                      <button
                        onClick={() => setShowChatWidget(false)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

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
                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.type === 'user'
                            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                      <Button type="submit" size="sm">Send</Button>
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
              className="p-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Open chat support"
            >
              {showChatWidget ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMessageCircle className="w-6 h-6" />
              )}
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
                      <Button
                        size="sm"
                        onClick={() => handleCookieConsent(true)}
                      >
                        Accept All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCookieConsent(false)}
                      >
                        Decline
                      </Button>
                      <Link
                        to="/privacy"
                        className="text-xs text-primary-500 hover:text-primary-600 px-3 py-2"
                      >
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
        <div className="fixed bottom-6 left-6 z-40">
          <motion.a
            href="/help"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <FiHelpCircle className="w-5 h-5 text-primary-500" />
            <span className="hidden sm:inline text-sm font-medium">Help Center</span>
          </motion.a>
        </div>

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