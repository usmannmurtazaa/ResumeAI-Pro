import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  FiArrowUp,
  FiHelpCircle,
  FiMail,
  FiMessageCircle,
  FiSend,
  FiThumbsDown,
  FiThumbsUp,
  FiUser,
  FiX,
} from 'react-icons/fi';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const COOKIE_CONSENT_KEY = 'cookieConsent';
const CHAT_NAME_INPUT_ID = 'support-chat-name';
const CHAT_EMAIL_INPUT_ID = 'support-chat-email';
const CHAT_INPUT_ID = 'support-chat-input';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const createMessage = (type, text) => ({
  id: createMessageId(),
  type,
  text,
  timestamp: new Date().toISOString(),
});

const formatMessageTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  );
};

const getBotResponse = (message) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
    return 'You can create a professional resume with our builder and ATS-friendly templates. If you want, I can guide you through the best starting template.';
  }

  if (lowerMessage.includes('pricing') || lowerMessage.includes('cost')) {
    return 'We offer a free plan for getting started, and Pro unlocks premium templates, AI features, and deeper analytics. Visit the pricing page for the latest plan details.';
  }

  if (lowerMessage.includes('ats') || lowerMessage.includes('score')) {
    return 'Our ATS scanner checks resume structure, keywords, and formatting. A score above 80% is a strong target for most applications.';
  }

  if (lowerMessage.includes('template') || lowerMessage.includes('design')) {
    return 'We offer multiple resume templates for different styles and industries. The best choice depends on whether you want a modern, classic, or more creative look.';
  }

  return 'Thanks for your message. Our support team will follow up soon, and you can also check the Help Center or FAQ for quick answers.';
};

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
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => [
    createMessage('bot', 'Hi there! How can I help you today?'),
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatFeedback, setChatFeedback] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showUserForm, setShowUserForm] = useState(true);

  const chatEndRef = useRef(null);
  const responseTimeoutRef = useRef(null);

  const location = useLocation();
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  const isHomePage = location.pathname === '/';
  const isTransparentNavbar = transparentNavbar && isHomePage && !hasScrolledPastHero;

  const headerOpacity = useTransform(
    scrollY,
    [0, 180],
    [isTransparentNavbar ? 0.92 : 1, 1]
  );
  const headerBlurAmount = useTransform(scrollY, [0, 180], [0, 12]);
  const headerBackdropFilter = useMotionTemplate`blur(${headerBlurAmount}px)`;

  const resolvedTitle = useMemo(
    () => (pageTitle ? `${pageTitle} | ResumeAI Pro` : 'ResumeAI Pro'),
    [pageTitle]
  );

  useEffect(() => {
    if (user) {
      setUserName(user.displayName || '');
      setUserEmail(user.email || '');
      setShowUserForm(false);
      return;
    }

    setUserName('');
    setUserEmail('');
    setShowUserForm(true);
  }, [user]);

  useEffect(() => {
    try {
      const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      setShowCookieConsent(!consent);
    } catch {
      setShowCookieConsent(true);
    }
  }, []);

  useEffect(() => {
    const syncScrollState = (value) => {
      setShowScrollButton((previous) => {
        const next = value > 400;
        return previous === next ? previous : next;
      });

      setHasScrolledPastHero((previous) => {
        const next = value > 48;
        return previous === next ? previous : next;
      });
    };

    syncScrollState(scrollY.get());
    const unsubscribe = scrollY.on('change', syncScrollState);

    return () => unsubscribe();
  }, [scrollY]);

  useEffect(() => {
    if (!showChatWidget) {
      return;
    }

    chatEndRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [chatMessages, shouldReduceMotion, showChatWidget]);

  useEffect(() => {
    if (!showChatWidget) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const targetId =
        showUserForm && !user ? CHAT_NAME_INPUT_ID : CHAT_INPUT_ID;
      document.getElementById(targetId)?.focus();
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [showChatWidget, showUserForm, user]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showChatWidget) {
        setShowChatWidget(false);
        return;
      }

      if (!showChatSupport || isTypingTarget(event.target)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setShowChatWidget(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChatSupport, showChatWidget]);

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        window.clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  }, [shouldReduceMotion]);

  const handleCookieConsent = useCallback((status) => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, status);
    } catch {
      // Ignore storage errors and just hide the banner.
    }

    setShowCookieConsent(false);

    if (status !== 'dismissed') {
      toast.success('Cookie preferences saved.');
    }
  }, []);

  const handleUserFormSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (!userName.trim()) {
        toast.error('Please enter your name.');
        return;
      }

      if (!isEmailValid(userEmail)) {
        toast.error('Please enter a valid email address.');
        return;
      }

      setShowUserForm(false);
      toast.success('Thanks. How can we help you?');
    },
    [userEmail, userName]
  );

  const handleChatSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (showUserForm || isTyping) {
        return;
      }

      const message = chatInput.trim();

      if (!message) {
        return;
      }

      setChatFeedback(null);
      setChatMessages((previous) => [...previous, createMessage('user', message)]);
      setChatInput('');
      setIsTyping(true);

      if (responseTimeoutRef.current) {
        window.clearTimeout(responseTimeoutRef.current);
      }

      responseTimeoutRef.current = window.setTimeout(() => {
        setChatMessages((previous) => [
          ...previous,
          createMessage('bot', getBotResponse(message)),
        ]);
        setIsTyping(false);
        responseTimeoutRef.current = null;
      }, 900);
    },
    [chatInput, isTyping, showUserForm]
  );

  const handleChatFeedback = useCallback((helpful) => {
    if (chatFeedback !== null) {
      return;
    }

    setChatFeedback(helpful);
    toast.success(helpful ? 'Thanks for your feedback.' : "Thanks. We'll keep improving.");
  }, [chatFeedback]);

  return (
    <ErrorBoundary>
      <Helmet>
        <title>{resolvedTitle}</title>
        {pageDescription ? (
          <meta name="description" content={pageDescription} />
        ) : null}
      </Helmet>

      <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        <motion.div
          style={{
            opacity: headerOpacity,
            backdropFilter: headerBackdropFilter,
          }}
          className={cn(
            'sticky top-0 z-50 transition-colors duration-300',
            isTransparentNavbar
              ? 'border-b border-transparent bg-transparent'
              : 'border-b border-gray-200/60 bg-white/80 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/80'
          )}
        >
          <Navbar transparent={isTransparentNavbar} />
        </motion.div>

        <main className="relative flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
              transition={{ duration: shouldReduceMotion ? 0.12 : 0.28 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />

        <AnimatePresence>
          {showScrollToTop && showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              onClick={scrollToTop}
              className={cn(
                'fixed right-6 z-40 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 p-3 text-white shadow-lg transition-shadow hover:shadow-xl',
                showChatSupport ? 'bottom-24' : 'bottom-6'
              )}
              aria-label="Scroll to top"
            >
              <FiArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {showChatSupport && (
          <div className="fixed bottom-6 right-4 z-40 sm:right-6">
            <AnimatePresence>
              {showChatWidget && (
                <motion.section
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  className="absolute bottom-20 right-0 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                  role="dialog"
                  aria-labelledby="support-chat-title"
                >
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                          <FiMessageCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 id="support-chat-title" className="font-semibold">
                            Support Chat
                          </h2>
                          <p className="text-xs opacity-90">
                            We typically reply in a few minutes
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowChatWidget(false)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
                        aria-label="Close support chat"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {showUserForm && !user && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleUserFormSubmit}
                      className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60"
                    >
                      <Input
                        id={CHAT_NAME_INPUT_ID}
                        icon={<FiUser />}
                        placeholder="Your name"
                        value={userName}
                        onChange={(event) => setUserName(event.target.value)}
                        className="mb-2"
                        size="sm"
                        autoComplete="name"
                        aria-label="Your name"
                      />
                      <Input
                        id={CHAT_EMAIL_INPUT_ID}
                        icon={<FiMail />}
                        type="email"
                        placeholder="Your email"
                        value={userEmail}
                        onChange={(event) => setUserEmail(event.target.value)}
                        className="mb-3"
                        size="sm"
                        autoComplete="email"
                        aria-label="Your email"
                      />
                      <Button type="submit" size="sm" className="w-full">
                        Start Chat
                      </Button>
                    </motion.form>
                  )}

                  <div
                    className="h-80 space-y-4 overflow-y-auto p-4"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions text"
                  >
                    {chatMessages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex',
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[82%] rounded-2xl p-3',
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          )}
                        >
                          <p className="text-sm leading-6">{message.text}</p>
                          <p className="mt-1 text-[10px] opacity-70">
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                        aria-live="polite"
                      >
                        <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-700">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:120ms]" />
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:240ms]" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {chatMessages.length > 2 && chatFeedback === null && (
                    <div className="flex items-center gap-2 px-4 pb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Was this helpful?
                      </p>
                      <button
                        type="button"
                        onClick={() => handleChatFeedback(true)}
                        className="rounded-lg p-1 transition-colors hover:bg-green-100 dark:hover:bg-green-900/30"
                        aria-label="This response was helpful"
                      >
                        <FiThumbsUp className="h-4 w-4 text-green-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChatFeedback(false)}
                        className="rounded-lg p-1 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                        aria-label="This response was not helpful"
                      >
                        <FiThumbsDown className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={handleChatSubmit}
                    className="border-t border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex gap-2">
                      <input
                        id={CHAT_INPUT_ID}
                        type="text"
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder={
                          showUserForm
                            ? 'Enter your name and email first...'
                            : 'Type your message...'
                        }
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800"
                        disabled={showUserForm}
                        maxLength={400}
                        aria-label="Type your support message"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={showUserForm || !chatInput.trim() || isTyping}
                        icon={<FiSend />}
                      >
                        Send
                      </Button>
                    </div>
                  </form>
                </motion.section>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              onClick={() => setShowChatWidget((previous) => !previous)}
              className="relative rounded-full bg-gradient-to-r from-primary-500 to-accent-500 p-4 text-white shadow-lg transition-shadow hover:shadow-xl"
              aria-label={showChatWidget ? 'Close chat support' : 'Open chat support'}
            >
              {showChatWidget ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMessageCircle className="h-6 w-6" />
              )}
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
            </motion.button>
          </div>
        )}

        <AnimatePresence>
          {showCookieConsent && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:max-w-md"
            >
              <div className="glass-card rounded-2xl border border-gray-200 p-4 shadow-xl dark:border-gray-700 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="hidden rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30 sm:block">
                    <span className="text-2xl" aria-hidden="true">
                      🍪
                    </span>
                  </div>

                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Cookie Preferences</h4>
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      We use cookies to improve performance, understand product usage,
                      and provide a better experience.
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleCookieConsent('accepted')}
                      >
                        Accept All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCookieConsent('declined')}
                      >
                        Essential Only
                      </Button>
                      <Link
                        to="/privacy"
                        className="inline-flex items-center px-1 py-2 text-xs text-primary-500 transition-colors hover:text-primary-600"
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCookieConsent('dismissed')}
                    className="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Dismiss cookie banner"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showHelpWidget && (
          <div className="fixed bottom-6 left-6 z-40">
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            >
              <Link
                to="/help"
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-lg transition-shadow hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
                aria-label="Open Help Center"
              >
                <FiHelpCircle className="h-5 w-5 text-primary-500" />
                <span className="hidden text-sm font-medium sm:inline">Help Center</span>
              </Link>
            </motion.div>
          </div>
        )}

        <button
          onClick={scrollToTop}
          className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Back to top
        </button>
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout;
