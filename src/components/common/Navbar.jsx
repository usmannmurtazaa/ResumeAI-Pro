import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu, FiX, FiUser, FiLogOut, FiSettings,
  FiFileText, FiHome, FiSearch, FiBell,
  FiSun, FiMoon, FiChevronDown, FiChevronRight,
  FiLayout, FiTarget, FiHelpCircle,
  FiCommand, FiStar, FiZap,
  FiCreditCard, FiShield, FiWifiOff,
  FiBookOpen, FiTrendingUp, FiMic, FiMicOff,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Tooltip from '../ui/Tooltip';
import NotificationPanel from './NotificationPanel';
import SearchBar from './SearchBar';
import CommandPalette from './CommandPalette';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import toast from 'react-hot-toast';

// ============================================
// BREADCRUMBS COMPONENT
// ============================================

const Breadcrumbs = () => {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbMap = {
    'dashboard': { label: 'Dashboard', icon: FiHome },
    'builder': { label: 'Resume Builder', icon: FiFileText },
    'templates': { label: 'Templates', icon: FiLayout },
    'profile': { label: 'Profile', icon: FiUser },
    'settings': { label: 'Settings', icon: FiSettings },
    'pricing': { label: 'Pricing', icon: FiCreditCard },
    'features': { label: 'Features', icon: FiZap },
    'blog': { label: 'Blog', icon: FiBookOpen },
    'about': { label: 'About', icon: FiHelpCircle },
    'contact': { label: 'Contact', icon: FiMail },
    'help': { label: 'Help Center', icon: FiHelpCircle },
    'admin': { label: 'Admin', icon: FiShield },
    'ats-scanner': { label: 'ATS Scanner', icon: FiTarget },
    'analytics': { label: 'Analytics', icon: FiTrendingUp },
  };

  if (paths.length === 0) return null;

  return (
    <nav className="flex items-center text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link to="/" className="text-gray-500 hover:text-primary-500 transition-colors">
            <FiHome className="w-4 h-4" />
          </Link>
        </li>
        {paths.map((path, index) => {
          const url = `/${paths.slice(0, index + 1).join('/')}`;
          const isLast = index === paths.length - 1;
          const config = breadcrumbMap[path] || { label: path.charAt(0).toUpperCase() + path.slice(1) };
          
          return (
            <li key={url} className="flex items-center space-x-2">
              <FiChevronRight className="w-3 h-3 text-gray-400" />
              {isLast ? (
                <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  {config.icon && <config.icon className="w-3.5 h-3.5" />}
                  {config.label}
                </span>
              ) : (
                <Link
                  to={url}
                  className="text-gray-500 hover:text-primary-500 transition-colors flex items-center gap-1"
                >
                  {config.icon && <config.icon className="w-3.5 h-3.5" />}
                  {config.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// ============================================
// NAVBAR COMPONENT
// ============================================

const Navbar = () => {
  const { user, logout, userRole, isPremium } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollDirection = useScrollDirection();
  const isOnline = useOnlineStatus();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const quickActionsRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const recognitionRef = useRef(null);

  // Memoized navigation arrays
  const navLinks = useMemo(() => [
    { to: '/', label: 'Home', icon: FiHome, exact: true },
    { to: '/templates', label: 'Templates', icon: FiLayout, badge: 'New' },
    { to: '/features', label: 'Features', icon: FiZap },
    { to: '/pricing', label: 'Pricing', icon: FiCreditCard },
    { to: '/blog', label: 'Blog', icon: FiBookOpen },
  ], []);

  const userLinks = useMemo(() => [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome, shortcut: '⌘D' },
    { to: '/builder', label: 'New Resume', icon: FiFileText, shortcut: '⌘N', highlight: true },
    { to: '/ats-scanner', label: 'ATS Scanner', icon: FiTarget },
    { to: '/analytics', label: 'Analytics', icon: FiTrendingUp, premium: true },
  ], []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation loading state
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowQuickActions(false);
  }, [location.pathname]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isProfileOpen) setIsProfileOpen(false);
        if (showNotifications) setShowNotifications(false);
        if (showQuickActions) setShowQuickActions(false);
        if (isMenuOpen) setIsMenuOpen(false);
        if (showSearch) setShowSearch(false);
        if (showCommandPalette) setShowCommandPalette(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isProfileOpen, showNotifications, showQuickActions, isMenuOpen, showSearch, showCommandPalette]);

  // Keyboard shortcuts
  useKeyboardShortcut('k', () => setShowCommandPalette(true), { ctrl: true });
  useKeyboardShortcut('n', () => navigate('/builder'), { ctrl: true });
  useKeyboardShortcut('d', () => navigate('/dashboard'), { ctrl: true });
  useKeyboardShortcut('p', () => navigate('/profile'), { ctrl: true });
  useKeyboardShortcut('/', (e) => { e.preventDefault(); setShowSearch(true); });

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  }, [logout, navigate]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setShowQuickActions(false);
  }, [navigate]);

  const isActive = useCallback((path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  // Voice search
  const startVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice search is not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening... Speak now');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setShowSearch(true);
      setIsListening(false);
      // The transcript will be passed to SearchBar via a custom event
      window.dispatchEvent(new CustomEvent('voice-search', { detail: transcript }));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast.error('Failed to recognize speech');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const showBreadcrumbs = location.pathname !== '/' && location.pathname !== '/dashboard';

  return (
    <>
      {/* Navigation Progress Bar */}
      {isNavigating && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 z-50"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.3 }}
        />
      )}

      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollDirection === 'down' && !isMenuOpen ? '-translate-y-full' : 'translate-y-0'
        } ${
          isScrolled || location.pathname !== '/'
            ? 'glass border-b border-white/20 dark:border-gray-700/20 shadow-sm'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3 group">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity" />
                  <img
                    src="/logo.svg"
                    alt="ResumeAI Pro"
                    className="relative h-8 w-auto"
                  />
                </motion.div>
                <span className="hidden sm:block font-bold text-lg gradient-text">
                  ResumeAI Pro
                </span>
              </Link>

              {/* Breadcrumbs */}
              {showBreadcrumbs && (
                <div className="hidden lg:block">
                  <Breadcrumbs />
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Tooltip key={link.to} content={link.label}>
                  <Link
                    to={link.to}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all group ${
                      isActive(link.to, link.exact)
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <link.icon className="w-4 h-4" />
                      {link.label}
                      {link.badge && (
                        <Badge variant="primary" size="sm" className="ml-1">
                          {link.badge}
                        </Badge>
                      )}
                    </span>
                  </Link>
                </Tooltip>
              ))}

              {user && (
                <>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
                  {userLinks.map(link => (
                    <Tooltip
                      key={link.to}
                      content={
                        <span className="flex items-center gap-2">
                          {link.label}
                          {link.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded">{link.shortcut}</kbd>
                          )}
                        </span>
                      }
                    >
                      <Link
                        to={link.to}
                        className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all group ${
                          isActive(link.to)
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                            : link.highlight
                              ? 'text-white bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 shadow-md hover:shadow-lg'
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <link.icon className="w-4 h-4" />
                          {link.label}
                          {link.premium && !isPremium && (
                            <FiStar className="w-3 h-3 text-yellow-500" />
                          )}
                        </span>
                      </Link>
                    </Tooltip>
                  ))}
                </>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Offline Indicator */}
              {!isOnline && (
                <Tooltip content="You are offline">
                  <Badge variant="warning" size="sm" className="hidden sm:flex items-center gap-1">
                    <FiWifiOff className="w-3 h-3" />
                    Offline
                  </Badge>
                </Tooltip>
              )}

              {/* Voice Search */}
              <Tooltip content={isListening ? 'Stop listening' : 'Voice search'}>
                <button
                  onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    isListening ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-400'
                  }`}
                  aria-label="Voice search"
                >
                  {isListening ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
                </button>
              </Tooltip>

              {/* Search */}
              <Tooltip content="Search (/)">
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  aria-label="Search"
                >
                  <FiSearch className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500 transition-colors" />
                </button>
              </Tooltip>

              {/* Command Palette */}
              <Tooltip content="Command Palette (⌘K)">
                <button
                  onClick={() => setShowCommandPalette(true)}
                  className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Command palette"
                >
                  <FiCommand className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip content={isDark ? 'Light Mode' : 'Dark Mode'}>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  aria-label="Toggle theme"
                >
                  {isDark ? (
                    <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-yellow-500 transition-colors" />
                  ) : (
                    <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500 transition-colors" />
                  )}
                </button>
              </Tooltip>

              {/* Quick Actions */}
              {user && (
                <div className="relative" ref={quickActionsRef}>
                  <Tooltip content="Quick Actions">
                    <button
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Quick actions"
                      aria-expanded={showQuickActions}
                    >
                      <FiZap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </Tooltip>

                  <AnimatePresence>
                    {showQuickActions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-72 glass-card p-2 shadow-xl z-50"
                      >
                        <p className="text-xs text-gray-500 px-3 py-2">Quick Actions</p>
                        <button
                          onClick={() => handleNavigate('/builder')}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group"
                        >
                          <span className="flex items-center gap-2">
                            <FiFileText className="w-4 h-4 text-primary-500" />
                            Create New Resume
                          </span>
                          <kbd className="text-xs text-gray-400">⌘N</kbd>
                        </button>
                        <button
                          onClick={() => handleNavigate('/ats-scanner')}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group"
                        >
                          <span className="flex items-center gap-2">
                            <FiTarget className="w-4 h-4 text-green-500" />
                            Scan Resume
                          </span>
                        </button>
                        <button
                          onClick={() => handleNavigate('/templates')}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group"
                        >
                          <span className="flex items-center gap-2">
                            <FiLayout className="w-4 h-4 text-purple-500" />
                            Browse Templates
                          </span>
                        </button>
                        {!isPremium && (
                          <button
                            onClick={() => handleNavigate('/pricing')}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 group"
                          >
                            <span className="flex items-center gap-2">
                              <FiStar className="w-4 h-4 text-yellow-500" />
                              Upgrade to Pro
                            </span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Notifications */}
              {user && (
                <div className="relative" ref={notificationsRef}>
                  <Tooltip content="Notifications">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                      aria-label="Notifications"
                      aria-expanded={showNotifications}
                    >
                      <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      {unreadCount > 0 && (
                        <Badge
                          variant="danger"
                          size="sm"
                          className="absolute -top-1 -right-1"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </button>
                  </Tooltip>

                  <NotificationPanel
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    aria-label="User menu"
                    aria-expanded={isProfileOpen}
                  >
                    <Avatar
                      src={user.photoURL}
                      name={user.displayName || user.email || 'User'}
                      size="sm"
                      status={isPremium ? 'premium' : 'online'}
                    />
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                        {user.displayName?.split(' ')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isPremium ? 'Pro' : 'Free'}
                      </p>
                    </div>
                    <FiChevronDown className={`hidden lg:block w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 glass-card p-2 shadow-xl"
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar
                              src={user.photoURL}
                              name={user.displayName || user.email || 'User'}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {user.displayName || 'User'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          {!isPremium && (
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => handleNavigate('/pricing')}
                              className="w-full mt-2"
                            >
                              <FiStar className="w-3 h-3 mr-1" />
                              Upgrade to Pro
                            </Button>
                          )}
                        </div>

                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group"
                          >
                            <span className="flex items-center gap-3">
                              <FiUser className="w-4 h-4 group-hover:text-primary-500" />
                              Profile
                            </span>
                            <kbd className="text-xs text-gray-400">⌘P</kbd>
                          </Link>

                          <Link
                            to="/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group"
                          >
                            <span className="flex items-center gap-3">
                              <FiHome className="w-4 h-4 group-hover:text-primary-500" />
                              Dashboard
                            </span>
                            <kbd className="text-xs text-gray-400">⌘D</kbd>
                          </Link>

                          <Link
                            to="/settings"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group"
                          >
                            <FiSettings className="w-4 h-4 group-hover:text-primary-500" />
                            Settings
                          </Link>

                          <Link
                            to="/help"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group"
                          >
                            <FiHelpCircle className="w-4 h-4 group-hover:text-primary-500" />
                            Help & Support
                          </Link>

                          {userRole === 'admin' && (
                            <>
                              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                              <Link
                                to="/admin"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg group"
                              >
                                <FiShield className="w-4 h-4" />
                                Admin Panel
                              </Link>
                            </>
                          )}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                        <div className="py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg group"
                          >
                            <FiLogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    size="sm"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/signup')}
                    size="sm"
                    className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                  >
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                ref={mobileMenuButtonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <FiX className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                ) : (
                  <FiMenu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700 max-h-[calc(100vh-4rem)] overflow-y-auto"
              >
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setShowSearch(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <FiSearch className="w-5 h-5" />
                    Search
                    <kbd className="ml-auto text-xs text-gray-400">/</kbd>
                  </button>

                  <button
                    onClick={() => {
                      setShowCommandPalette(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <FiCommand className="w-5 h-5" />
                    Command Palette
                    <kbd className="ml-auto text-xs text-gray-400">⌘K</kbd>
                  </button>

                  {[...navLinks, ...(user ? userLinks : [])].map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        link.highlight && user
                          ? 'text-white bg-gradient-to-r from-primary-500 to-accent-500'
                          : isActive(link.to, link.exact)
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {link.icon && <link.icon className="w-5 h-5" />}
                      <span className="flex-1">{link.label}</span>
                      {link.badge && <Badge variant="primary" size="sm">{link.badge}</Badge>}
                      {link.shortcut && <kbd className="text-xs text-gray-400">{link.shortcut}</kbd>}
                    </Link>
                  ))}

                  {user ? (
                    <>
                      <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                      <div className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.photoURL}
                            name={user.displayName || user.email || 'User'}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {user.displayName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <FiUser className="w-5 h-5" /> Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <FiSettings className="w-5 h-5" /> Settings
                      </Link>
                      {userRole === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                        >
                          <FiShield className="w-5 h-5" /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <FiLogOut className="w-5 h-5" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                      <div className="p-2 space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                          className="w-full"
                        >
                          Sign In
                        </Button>
                        <Button
                          onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}
                          className="w-full bg-gradient-to-r from-primary-500 to-accent-500"
                        >
                          Get Started Free
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Search Overlay */}
      <SearchBar isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />

      {/* Keyboard Shortcuts Hint */}
      <div className="hidden lg:block fixed bottom-4 right-4 z-40">
        <button
          onClick={() => toast.success('Press ⌘K for commands, / to search, ⌘N for new resume')}
          className="px-3 py-1.5 glass text-xs text-gray-500 rounded-full hover:text-gray-700 transition-colors"
        >
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">⌘</kbd>
          <span className="mx-1">Shortcuts</span>
        </button>
      </div>
    </>
  );
};

// Import missing icon
const FiMail = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export default React.memo(Navbar);