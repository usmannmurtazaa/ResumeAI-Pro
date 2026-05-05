import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AnimatePresence, motion, useMotionTemplate, useReducedMotion,
  useScroll, useTransform,
} from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  FiArrowUp, FiHelpCircle, FiMail, FiMessageCircle, FiSend,
  FiThumbsDown, FiThumbsUp, FiUser, FiX,
} from 'react-icons/fi';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const COOKIE_CONSENT_KEY = 'cookieConsent';
const CHAT_MESSAGES_KEY = 'supportChatMessages';
const CHAT_NAME_INPUT_ID = 'support-chat-name';
const CHAT_EMAIL_INPUT_ID = 'support-chat-email';
const CHAT_INPUT_ID = 'support-chat-input';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  type: 'bot',
  text: 'Hi there! How can I help you today?',
  timestamp: new Date().toISOString(),
};

// ── Utilities ────────────────────────────────────────────────────────────

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
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// FIXED: More robust typing target check
const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox' ||
    target.closest('[contenteditable="true"]')
  );
};

// FIXED: Expanded bot responses
const BOT_RESPONSES = [
  { keywords: ['resume', 'cv', 'builder'], response: 'You can create a professional resume with our builder and ATS-friendly templates. Would you like help choosing a template?' },
  { keywords: ['pricing', 'cost', 'price', 'plan'], response: 'We offer a free plan to get started, and Pro plans unlock premium templates, AI features, and advanced analytics. Visit our pricing page for details.' },
  { keywords: ['ats', 'score', 'scan'], response: 'Our ATS scanner checks structure, keywords, and formatting. A score above 80% is competitive for most applications.' },
  { keywords: ['template', 'design', 'layout'], response: 'We offer multiple templates for different industries. Modern, classic, creative, and tech-focused designs are available.' },
  { keywords: ['help', 'support', 'issue', 'problem'], response: 'I\'m here to help! You can also visit our Help Center or FAQ for quick answers.' },
  { keywords: ['download', 'pdf', 'export'], response: 'You can download your resume as a PDF from the builder. Pro users get additional export formats.' },
  { keywords: ['account', 'login', 'sign', 'password'], response: 'For account issues, visit your profile settings or use the forgot password option on the login page.' },
];

const getBotResponse = (message) => {
  const lower = message.toLowerCase();
  
  for (const { keywords, response } of BOT_RESPONSES) {
    if (keywords.some(kw => lower.includes(kw))) {
      return response;
    }
  }
  
  return 'Thanks for your message! Our team will follow up soon. You can also check our Help Center for quick answers.';
};

// ── Load/Save Chat Messages ─────────────────────────────────────────────

const loadChatMessages = () => {
  try {
    const saved = sessionStorage.getItem(CHAT_MESSAGES_KEY);
    return saved ? JSON.parse(saved) : [DEFAULT_WELCOME_MESSAGE];
  } catch {
    return [DEFAULT_WELCOME_MESSAGE];
  }
};

const saveChatMessages = (messages) => {
  try {
    sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages.slice(-20)));
  } catch {}
};

// ── Component ─────────────────────────────────────────────────────────────

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
  // FIXED: Load messages from sessionStorage
  const [chatMessages, setChatMessages] = useState(loadChatMessages);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatFeedback, setChatFeedback] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showUserForm, setShowUserForm] = useState(true);

  const chatEndRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const location = useLocation();
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  const isHomePage = location.pathname === '/';
  const isTransparentNavbar = transparentNavbar && isHomePage && !hasScrolledPastHero;

  const headerOpacity = useTransform(scrollY, [0, 180], [isTransparentNavbar ? 0.92 : 1, 1]);
  const headerBlurAmount = useTransform(scrollY, [0, 180], [0, 12]);
  const headerBackdropFilter = useMotionTemplate`blur(${headerBlurAmount}px)`;

  const resolvedTitle = useMemo(
    () => (pageTitle ? `${pageTitle} | ResumeAI Pro` : 'ResumeAI Pro'),
    [pageTitle]
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    };
  }, []);

  // FIXED: Save messages when chat closes or component unmounts
  useEffect(() => {
    saveChatMessages(chatMessages);
  }, [chatMessages]);

  // ── User info pre-fill ───────────────────────────────────────────────

  useEffect(() => {
    if (user) {
      setUserName(user.displayName || '');
      setUserEmail(user.email || '');
      setShowUserForm(false);
    } else {
      setUserName('');
      setUserEmail('');
      setShowUserForm(true);
    }
  }, [user]);

  // ── Cookie consent ───────────────────────────────────────────────────

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      setShowCookieConsent(!consent);
    } catch {
      setShowCookieConsent(true);
    }
  }, []);

  // ── Scroll tracking ─────────────────────────────────────────────────

  useEffect(() => {
    const syncScrollState = (value) => {
      setShowScrollButton(value > 400);
      setHasScrolledPastHero(value > 48);
    };
    syncScrollState(scrollY.get());
    const unsubscribe = scrollY.on('change', syncScrollState);
    return () => unsubscribe();
  }, [scrollY]);

  // ── Scroll chat to bottom ───────────────────────────────────────────

  useEffect(() => {
    if (!showChatWidget) return;
    chatEndRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [chatMessages, shouldReduceMotion, showChatWidget]);

  // ── Focus chat input ────────────────────────────────────────────────

  useEffect(() => {
    if (!showChatWidget) return;
    const timer = setTimeout(() => {
      const targetId = showUserForm && !user ? CHAT_NAME_INPUT_ID : CHAT_INPUT_ID;
      document.getElementById(targetId)?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [showChatWidget, showUserForm, user]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape' && showChatWidget) {
        setShowChatWidget(false);
        return;
      }
      if (!showChatSupport || isTypingTarget(event.target)) return;
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setShowChatWidget(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showChatSupport, showChatWidget]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  }, [shouldReduceMotion]);

  const handleCookieConsent = useCallback((status) => {
    try {
      if (status !== 'dismissed') localStorage.setItem(COOKIE_CONSENT_KEY, status);
    } catch {}
    setShowCookieConsent(false);
    if (status !== 'dismissed') toast.success('Preferences saved.');
  }, []);

  const handleUserFormSubmit = useCallback((event) => {
    event.preventDefault();
    if (!userName.trim()) { toast.error('Please enter your name.'); return; }
    if (!isEmailValid(userEmail)) { toast.error('Please enter a valid email address.'); return; }
    setShowUserForm(false);
    toast.success('Thanks! How can we help?');
  }, [userEmail, userName]);

  const handleChatSubmit = useCallback((event) => {
    event.preventDefault();
    if (showUserForm || isTyping) return;
    const message = chatInput.trim();
    if (!message) return;

    setChatFeedback(null);
    setChatMessages(prev => [...prev, createMessage('user', message)]);
    setChatInput('');
    setIsTyping(true);

    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);

    // Random delay for more natural feel
    const delay = 600 + Math.random() * 800;
    
    responseTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setChatMessages(prev => [...prev, createMessage('bot', getBotResponse(message))]);
      setIsTyping(false);
      responseTimeoutRef.current = null;
    }, delay);
  }, [chatInput, isTyping, showUserForm]);

  const handleChatFeedback = useCallback((helpful) => {
    if (chatFeedback !== null) return;
    setChatFeedback(helpful);
    toast.success(helpful ? 'Thanks for your feedback! 😊' : "Thanks. We'll keep improving! 💪");
  }, [chatFeedback]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <ErrorBoundary>
      <Helmet>
        <title>{resolvedTitle}</title>
        {pageDescription && <meta name="description" content={pageDescription} />}
      </Helmet>

      <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        {/* Sticky Header */}
        <motion.div
          style={{ opacity: headerOpacity, backdropFilter: headerBackdropFilter }}
          className={cn(
            'sticky top-0 z-50 transition-colors duration-300',
            isTransparentNavbar
              ? 'border-b border-transparent bg-transparent'
              : 'border-b border-gray-200/60 bg-white/80 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/80'
          )}
        >
          <Navbar />
        </motion.div>

        {/* Main Content */}
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

        {/* Scroll to Top */}
        <AnimatePresence>
          {showScrollToTop && showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.06 }} whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
              onClick={scrollToTop}
              className={cn('fixed right-6 z-40 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 p-3 text-white shadow-lg hover:shadow-xl', showChatSupport ? 'bottom-24' : 'bottom-6')}
              aria-label="Scroll to top"
            >
              <FiArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat Support Widget */}
        {showChatSupport && (
          <div className="fixed bottom-6 right-4 z-40 sm:right-6">
            <AnimatePresence>
              {showChatWidget && (
                <motion.section
                  initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  className="absolute bottom-20 right-0 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                  role="dialog" aria-labelledby="support-chat-title"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                          <FiMessageCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 id="support-chat-title" className="font-semibold">Support Chat</h2>
                          <p className="text-xs opacity-90">We typically reply in a few minutes</p>
                        </div>
                      </div>
                      <button onClick={() => setShowChatWidget(false)} className="rounded-lg p-1.5 hover:bg-white/20" aria-label="Close chat">
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* User Form */}
                  {showUserForm && !user && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleUserFormSubmit} className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                      <Input id={CHAT_NAME_INPUT_ID} icon={<FiUser />} placeholder="Your name" value={userName}
                        onChange={e => setUserName(e.target.value)} className="mb-2" size="sm" autoComplete="name" />
                      <Input id={CHAT_EMAIL_INPUT_ID} icon={<FiMail />} type="email" placeholder="Your email" value={userEmail}
                        onChange={e => setUserEmail(e.target.value)} className="mb-3" size="sm" autoComplete="email" />
                      <Button type="submit" size="sm" className="w-full">Start Chat</Button>
                    </motion.form>
                  )}

                  {/* Messages */}
                  <div className="h-80 space-y-4 overflow-y-auto p-4" role="log" aria-live="polite">
                    {chatMessages.map(msg => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={cn('flex', msg.type === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[82%] rounded-2xl p-3', msg.type === 'user' ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200')}>
                          <p className="text-sm leading-6">{msg.text}</p>
                          <p className="mt-1 text-[10px] opacity-70">{formatMessageTime(msg.timestamp)}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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

                  {/* Feedback */}
                  {chatMessages.length > 2 && chatFeedback === null && (
                    <div className="flex items-center gap-2 px-4 pb-2">
                      <p className="text-xs text-gray-500">Was this helpful?</p>
                      <button onClick={() => handleChatFeedback(true)} className="rounded-lg p-1 hover:bg-green-100 dark:hover:bg-green-900/30"><FiThumbsUp className="h-4 w-4 text-green-500" /></button>
                      <button onClick={() => handleChatFeedback(false)} className="rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/30"><FiThumbsDown className="h-4 w-4 text-red-500" /></button>
                    </div>
                  )}

                  {/* Input */}
                  <form onSubmit={handleChatSubmit} className="border-t border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input id={CHAT_INPUT_ID} type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                        placeholder={showUserForm ? 'Enter your details first...' : 'Type your message...'}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800"
                        disabled={showUserForm} maxLength={400} />
                      <Button type="submit" size="sm" disabled={showUserForm || !chatInput.trim() || isTyping} icon={<FiSend />}>Send</Button>
                    </div>
                  </form>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Chat Toggle Button */}
            <motion.button
              whileHover={shouldReduceMotion ? {} : { scale: 1.08 }} whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
              onClick={() => setShowChatWidget(prev => !prev)}
              className="relative rounded-full bg-gradient-to-r from-primary-500 to-accent-500 p-4 text-white shadow-lg hover:shadow-xl"
              aria-label={showChatWidget ? 'Close chat' : 'Open chat'}
            >
              {showChatWidget ? <FiX className="h-6 w-6" /> : <FiMessageCircle className="h-6 w-6" />}
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
            </motion.button>
          </div>
        )}

        {/* Cookie Consent Banner */}
        <AnimatePresence>
          {showCookieConsent && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:max-w-md">
              <div className="glass-card rounded-2xl border border-gray-200 p-4 shadow-xl dark:border-gray-700 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="hidden text-2xl sm:block" aria-hidden="true">🍪</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="mb-1 font-semibold text-sm">Cookie Preferences</h4>
                    <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                      We use cookies to improve your experience and understand product usage.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button size="sm" onClick={() => handleCookieConsent('accepted')}>Accept All</Button>
                      <Button size="sm" variant="outline" onClick={() => handleCookieConsent('declined')}>Essential Only</Button>
                      <Link to="/privacy" className="inline-flex items-center px-1 py-2 text-xs text-primary-500 hover:text-primary-600">Learn More</Link>
                    </div>
                  </div>
                  <button onClick={() => handleCookieConsent('dismissed')} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0" aria-label="Dismiss">
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Center Widget */}
        {showHelpWidget && (
          <div className="fixed bottom-6 left-6 z-40">
            <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.06 }} whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}>
              <Link to="/help" className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-lg hover:shadow-xl dark:border-gray-700 dark:bg-gray-800" aria-label="Help Center">
                <FiHelpCircle className="h-5 w-5 text-primary-500" />
                <span className="hidden text-sm font-medium sm:inline">Help Center</span>
              </Link>
            </motion.div>
          </div>
        )}

        {/* Skip to top link */}
        <button onClick={scrollToTop} className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-white">
          Back to top
        </button>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(MainLayout);
