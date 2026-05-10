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
  FiMail, FiMapPin, FiBriefcase, FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Tooltip from '../ui/Tooltip';
import toast from 'react-hot-toast';

// ── Inline Hooks (if not available in your project) ──────────────────────

/**
 * Detects scroll direction (up/down) for hiding/showing navbar.
 */
const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY.current ? 'down' : 'up';
      
      if (direction !== scrollDirection && 
          (scrollY - lastScrollY.current > 10 || scrollY - lastScrollY.current < -10)) {
        setScrollDirection(direction);
      }
      
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollDirection]);

  return scrollDirection;
};

/**
 * Registers a keyboard shortcut.
 */
const useKeyboardShortcut = (key, callback, options = {}) => {
  useEffect(() => {
    const handler = (event) => {
      const { ctrl = false, meta = false, shift = false, alt = false } = options;
      
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.metaKey === meta &&
        event.shiftKey === shift &&
        event.altKey === alt
      ) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, options]);
};

/**
 * Monitors online/offline status.
 */
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

// ── Breadcrumbs Component ────────────────────────────────────────────────

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
    'my-resumes': { label: 'My Resumes', icon: FiBriefcase },
    'cover-letter': { label: 'Cover Letter', icon: FiFileText },
  };

  if (paths.length === 0) return null;

  return (
    <nav className="flex items-center text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1.5">
        <li>
          <Link 
            to="/" 
            className="text-gray-400 hover:text-primary-500 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Home"
          >
            <FiHome className="w-4 h-4" />
          </Link>
        </li>
        {paths.map((path, index) => {
          const url = `/${paths.slice(0, index + 1).join('/')}`;
          const isLast = index === paths.length - 1;
          const config = breadcrumbMap[path] || { 
            label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
          };
          
          return (
            <li key={url} className="flex items-center space-x-1.5">
              <FiChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              {isLast ? (
                <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1 truncate max-w-[150px]">
                  {config.icon && <config.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="truncate">{config.label}</span>
                </span>
              ) : (
                <Link
                  to={url}
                  className="text-gray-500 hover:text-primary-500 transition-colors flex items-center gap-1 truncate max-w-[150px] rounded px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {config.icon && <config.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="truncate">{config.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// ── Simple Notification Panel (placeholder) ──────────────────────────────

const NotificationPanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-card p-4 shadow-xl z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <FiX className="w-4 h-4" />
        </button>
      </div>
      <div className="text-center py-8 text-gray-500 text-sm">
        <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        No new notifications
      </div>
    </motion.div>
  );
};

// ── Simple Search Bar (placeholder) ──────────────────────────────────────

const SearchBar = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/templates?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSearch} className="glass-card p-3">
            <div className="flex items-center gap-3">
              <FiSearch className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates, resumes, help..."
                className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-400 text-base"
                autoComplete="off"
              />
              <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Simple Command Palette (placeholder - use your full version) ─────────

const CommandPalette = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="fixed inset-x-0 top-[15vh] z-[101] mx-auto max-w-xl" onClick={e => e.stopPropagation()}>
          <div className="glass-card p-4 text-center">
            <FiCommand className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Command Palette</p>
            <p className="text-xs text-gray-400 mt-1">Import your full CommandPalette component here</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Navbar Component ─────────────────────────────────────────────────────

const Navbar = () => {
  const { user, logout, userRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount = 0 } = useNotifications();
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

  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const quickActionsRef = useRef(null);

  const isPremium = userRole === 'premium' || userRole === 'admin';

  // ── Navigation arrays ──────────────────────────────────────────────────

  const navLinks = useMemo(() => [
    { to: '/', label: 'Home', icon: FiHome, exact: true },
    { to: '/templates', label: 'Templates', icon: FiLayout, badge: 'New' },
    { to: '/features', label: 'Features', icon: FiZap },
    { to: '/pricing', label: 'Pricing', icon: FiCreditCard },
  ], []);

  const userLinks = useMemo(() => [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome, shortcut: '⌘D' },
    { to: '/builder', label: 'New Resume', icon: FiFileText, shortcut: '⌘N', highlight: true },
    { to: '/ats-scanner', label: 'ATS Scanner', icon: FiTarget },
    { to: '/my-resumes', label: 'My Resumes', icon: FiFileText },
  ], []);

  // ── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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

  useEffect(() => {
    setIsMenuOpen(false);
    setShowQuickActions(false);
  }, [location.pathname]);

  // Keyboard shortcuts
  useKeyboardShortcut('k', () => setShowCommandPalette(true), { meta: true });
  useKeyboardShortcut('/', (e) => { e.preventDefault(); setShowSearch(true); });
  useKeyboardShortcut('n', () => navigate('/builder'), { meta: true });
  useKeyboardShortcut('d', () => navigate('/dashboard'), { meta: true });

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
      setIsProfileOpen(false);
      setIsMenuOpen(false);
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

  const showBreadcrumbs = location.pathname !== '/' && location.pathname !== '/dashboard';

  return (
    <>
      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {/* Navigation Progress Bar */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 z-[60] origin-left"
          />
        )}
      </AnimatePresence>

      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          scrollDirection === 'down' && !isMenuOpen ? '-translate-y-full' : 'translate-y-0'
        } ${
          isMenuOpen
            ? 'border-b border-gray-200/80 bg-white/95 shadow-md backdrop-blur-md dark:border-gray-700/80 dark:bg-gray-900/95'
            : isScrolled || location.pathname !== '/'
              ? 'glass border-b border-white/20 dark:border-gray-700/20 shadow-sm'
              : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity" />
                  <div className="relative w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                    <FiFileText className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
                <span className="hidden sm:block font-bold text-lg gradient-text">
                  ResumeAI Pro
                </span>
              </Link>

              {showBreadcrumbs && (
                <div className="hidden lg:block">
                  <Breadcrumbs />
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive(link.to, link.exact)
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <link.icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{link.label}</span>
                    {link.badge && (
                      <Badge variant="primary" size="sm">{link.badge}</Badge>
                    )}
                  </span>
                </Link>
              ))}

              {user && (
                <>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
                  {userLinks.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        isActive(link.to)
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                          : link.highlight
                            ? 'text-white bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <link.icon className="w-4 h-4" />
                        <span className="hidden xl:inline">{link.label}</span>
                      </span>
                    </Link>
                  ))}
                </>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1">
              {/* Offline Indicator */}
              {!isOnline && (
                <Badge variant="warning" size="sm" className="hidden sm:inline-flex items-center gap-1">
                  <FiWifiOff className="w-3 h-3" />
                  <span className="hidden md:inline">Offline</span>
                </Badge>
              )}

              {/* Search Button */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Search (press /)"
              >
                <FiSearch className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <FiSun className="w-5 h-5 text-gray-400 hover:text-yellow-500 transition-colors" />
                ) : (
                  <FiMoon className="w-5 h-5 text-gray-600 hover:text-primary-500 transition-colors" />
                )}
              </button>

              {/* Notifications */}
              {user && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  >
                    <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                </div>
              )}

              {/* User Menu / Auth Buttons */}
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="User menu"
                    aria-expanded={isProfileOpen}
                  >
                    <Avatar
                      src={user.photoURL}
                      name={user.displayName || user.email || 'User'}
                      size="sm"
                    />
                    <FiChevronDown className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 glass-card p-2 shadow-xl z-50"
                      >
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
                          <p className="font-medium text-sm truncate">{user.displayName || 'User'}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>

                        {[
                          { to: '/profile', icon: FiUser, label: 'Profile' },
                          { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
                          { to: '/settings', icon: FiSettings, label: 'Settings' },
                        ].map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        ))}

                        {userRole === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          >
                            <FiShield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => navigate('/signup')} className="bg-gradient-to-r from-primary-500 to-accent-500">
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
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
                className="lg:hidden py-2 border-t border-gray-200 bg-white/98 dark:border-gray-700 dark:bg-gray-900/98 max-h-[calc(100vh-4rem)] overflow-y-auto"
              >
                <div className="space-y-1 pb-2">
                  {[...navLinks, ...(user ? userLinks : [])].map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${
                        link.highlight && user
                          ? 'text-white bg-gradient-to-r from-primary-500 to-accent-500'
                          : isActive(link.to, link.exact)
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="flex-1">{link.label}</span>
                      {link.badge && <Badge variant="primary" size="sm">{link.badge}</Badge>}
                    </Link>
                  ))}

                  {user ? (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <FiLogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2 px-2 space-y-2">
                      <Button variant="outline" onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="w-full">
                        Sign In
                      </Button>
                      <Button onClick={() => { navigate('/signup'); setIsMenuOpen(false); }} className="w-full">
                        Get Started Free
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Overlays */}
      <SearchBar isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default React.memo(Navbar);
