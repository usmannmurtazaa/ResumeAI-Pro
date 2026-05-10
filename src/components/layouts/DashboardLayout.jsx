import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiActivity, FiAlertCircle, FiAward, FiBell, FiCheckCircle,
  FiChevronDown, FiChevronLeft, FiChevronRight, FiCommand,
  FiCreditCard, FiDownload, FiFileText, FiHelpCircle, FiHome,
  FiInfo, FiLayout, FiLogOut, FiMenu, FiMoon, FiPlus,
  FiRefreshCw, FiSearch, FiSettings, FiStar, FiSun,
  FiTarget, FiTrendingUp, FiUser, FiX, FiZap,
} from 'react-icons/fi';
import Sidebar from '../../components/common/Sidebar';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Tooltip from '../../components/ui/Tooltip';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useResume } from '../../contexts/ResumeContext';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const SIDEBAR_STORAGE_KEY = 'dashboardSidebarCollapsed';
const COMMAND_INPUT_ID = 'dashboard-command-palette-input';

const NOTIFICATION_META = {
  success: { icon: FiCheckCircle, className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  warning: { icon: FiAlertCircle, className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  error: { icon: FiAlertCircle, className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  info: { icon: FiInfo, className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
};

const STAT_TONES = {
  blue: { surface: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400' },
  green: { surface: 'bg-green-100 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-400' },
  purple: { surface: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400' },
  orange: { surface: 'bg-orange-100 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-400' },
};

const TEMPLATES = [
  { id: 'modern', name: 'Modern', icon: '🎨', class: 'from-blue-500 to-cyan-500', desc: 'Clean and contemporary' },
  { id: 'classic', name: 'Classic', icon: '📄', class: 'from-gray-600 to-gray-800', desc: 'Traditional format' },
  { id: 'creative', name: 'Creative', icon: '✨', class: 'from-purple-500 to-pink-500', desc: 'Stand out design' },
  { id: 'minimal', name: 'Minimal', icon: '◻️', class: 'from-green-500 to-emerald-500', desc: 'Simple and elegant' },
  { id: 'executive', name: 'Executive', icon: '👔', class: 'from-slate-700 to-slate-900', desc: 'Senior positions' },
  { id: 'tech', name: 'Tech', icon: '💻', class: 'from-indigo-500 to-blue-600', desc: 'Tech industry focus' },
];

// ── Utilities ────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getStoredSidebarCollapsed = () => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved ? JSON.parse(saved) === true : false;
  } catch {
    return false;
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

const getNotificationMeta = (type) => NOTIFICATION_META[type] || NOTIFICATION_META.info;

// ── Sub-Components ────────────────────────────────────────────────────────

const QuickStat = React.memo(({ icon: Icon, label, value, tone = 'blue' }) => {
  const tones = STAT_TONES[tone] || STAT_TONES.blue;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 backdrop-blur-sm dark:bg-gray-800/60">
      <div className={cn('rounded-lg p-2', tones.surface)}>
        <Icon className={cn('h-4 w-4', tones.icon)} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
});

QuickStat.displayName = 'QuickStat';

const WelcomeCard = React.memo(({ greeting, firstName, stats, resumes, onCreateResume, onContinue }) => {
  const totalResumes = stats?.total ?? resumes.length;
  const completedResumes = stats?.completed ?? 0;
  const averageScore = stats?.avgScore ?? 0;
  const totalDownloads = stats?.totalDownloads ?? 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-gray-200/60 bg-gradient-to-br from-primary-50/70 to-accent-50/50 p-6 shadow-sm backdrop-blur-sm dark:border-gray-700/60 dark:from-primary-900/20 dark:to-accent-900/10"
      aria-label="Dashboard welcome summary"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="mb-1 text-2xl font-bold gradient-text">{greeting}, {firstName}! 👋</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            {totalResumes > 0
              ? `You have ${totalResumes} resume${totalResumes !== 1 ? 's' : ''} with an average ATS score of ${averageScore}%.`
              : 'Ready to create your first professional, ATS-friendly resume?'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onCreateResume} icon={<FiPlus />} className="bg-gradient-to-r from-primary-500 to-accent-500">Create New Resume</Button>
          {resumes.length > 0 && <Button variant="outline" onClick={onContinue}>Continue Editing</Button>}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickStat icon={FiFileText} label="Total Resumes" value={totalResumes} tone="blue" />
        <QuickStat icon={FiCheckCircle} label="Completed" value={completedResumes} tone="green" />
        <QuickStat icon={FiTarget} label="Avg ATS Score" value={`${averageScore}%`} tone="purple" />
        <QuickStat icon={FiDownload} label="Downloads" value={totalDownloads} tone="orange" />
      </div>
    </motion.section>
  );
});

WelcomeCard.displayName = 'WelcomeCard';

// ── Main Component ────────────────────────────────────────────────────────

const DashboardLayout = ({ children, title, description, showWelcome = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredSidebarCollapsed);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingResume, setIsCreatingResume] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);

  const quickActionsRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const { user, userRole, logout, isPremium } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead } = useNotifications();
  const { resumes = [], stats = {}, createResume } = useResume();

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there', [user]);
  const accountLabel = useMemo(() => {
    if (userRole === 'admin') return 'Admin';
    if (isPremium || userRole === 'premium') return 'Premium';
    return 'Free';
  }, [isPremium, userRole]);
  const latestResumeId = useMemo(() => resumes[0]?.id || null, [resumes]);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  // ── Floating Menu Helpers ────────────────────────────────────────────

  const closeFloatingPanels = useCallback(() => {
    setShowQuickActions(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, []);

  const openCreateModal = useCallback(() => { closeFloatingPanels(); setShowCreateModal(true); }, [closeFloatingPanels]);
  const openCommandPalette = useCallback(() => { closeFloatingPanels(); setShowCommandPalette(true); }, [closeFloatingPanels]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    // FIXED: Cleanup timeout on unmount
    refreshTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) window.location.reload();
    }, 250);
  }, [isRefreshing]);

  const handleLogout = useCallback(async () => {
    try {
      closeFloatingPanels();
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to log out.');
    }
  }, [closeFloatingPanels, logout, navigate]);

  const handleCreateResume = useCallback(async (template = 'modern') => {
    try {
      setIsCreatingResume(true);
      setShowCreateModal(false);
      const newResume = await createResume({ template });
      if (mountedRef.current && newResume?.id) {
        navigate(`/builder/${newResume.id}`);
      }
    } catch {
      toast.error('Unable to create a new resume right now.');
    } finally {
      if (mountedRef.current) setIsCreatingResume(false);
    }
  }, [createResume, navigate]);

  const handleCommandSelect = useCallback((action) => {
    action();
    setShowCommandPalette(false);
    setSearchTerm('');
    setActiveCommandIndex(0);
  }, []);

  // ── Command Options ──────────────────────────────────────────────────

  const commandOptions = useMemo(() => [
    { id: 'new-resume', label: 'Create New Resume', icon: FiPlus, action: openCreateModal, shortcut: 'Ctrl+N' },
    { id: 'dashboard', label: 'Go to Dashboard', icon: FiHome, action: () => navigate('/dashboard') },
    { id: 'builder', label: 'Resume Builder', icon: FiFileText, action: () => navigate('/builder') },
    { id: 'templates', label: 'Browse Templates', icon: FiLayout, action: () => navigate('/templates') },
    { id: 'ats-scanner', label: 'ATS Scanner', icon: FiActivity, action: () => navigate('/ats-scanner') },
    { id: 'profile', label: 'Profile Settings', icon: FiUser, action: () => navigate('/profile') },
    { id: 'settings', label: 'Account Settings', icon: FiSettings, action: () => navigate('/settings') },
    { id: 'pricing', label: 'View Pricing', icon: FiCreditCard, action: () => navigate('/pricing') },
    { id: 'help', label: 'Help Center', icon: FiHelpCircle, action: () => navigate('/help') },
  ], [navigate, openCreateModal]);

  const filteredCommands = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return commandOptions;
    return commandOptions.filter(cmd => cmd.label.toLowerCase().includes(term));
  }, [commandOptions, searchTerm]);

  // ── Quick Actions ───────────────────────────────────────────────────

  const quickActions = useMemo(() => [
    { id: 'new-resume', icon: FiPlus, label: 'New Resume', action: openCreateModal, iconClassName: 'text-blue-500', shortcut: 'Ctrl+N' },
    { id: 'ats-scanner', icon: FiActivity, label: 'ATS Scanner', action: () => navigate('/ats-scanner'), iconClassName: 'text-purple-500' },
    { id: 'templates', icon: FiLayout, label: 'Templates', action: () => navigate('/templates'), iconClassName: 'text-green-500' },
    { id: 'analytics', icon: FiTrendingUp, label: 'Analytics', action: () => navigate('/analytics'), iconClassName: 'text-orange-500', premium: true },
  ], [navigate, openCreateModal]);

  // ── Effects ─────────────────────────────────────────────────────────

  // Persist sidebar state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); closeFloatingPanels(); }, [location.pathname, closeFloatingPanels]);

  // Lock body scroll
  useEffect(() => {
    if (!sidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [sidebarOpen]);

  // FIXED: Combined command palette effects
  useEffect(() => {
    if (!showCommandPalette) {
      setSearchTerm('');
      setActiveCommandIndex(0);
      return;
    }
    setActiveCommandIndex(0);
    // Focus input
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(COMMAND_INPUT_ID)?.focus();
      });
    });
  }, [showCommandPalette]);

  // Reset index on search
  useEffect(() => { setActiveCommandIndex(0); }, [searchTerm]);

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      if (quickActionsRef.current && !quickActionsRef.current.contains(target)) setShowQuickActions(false);
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (event) => {
      const hasModifier = event.ctrlKey || event.metaKey;
      const typing = isTypingTarget(event.target);

      if (event.key === 'Escape') {
        closeFloatingPanels();
        setSidebarOpen(false);
        setShowCreateModal(false);
        setShowCommandPalette(false);
        return;
      }
      if (typing && !hasModifier) return;
      if (hasModifier && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommandPalette(); }
      if (hasModifier && event.key.toLowerCase() === 'n') { event.preventDefault(); openCreateModal(); }
      if (hasModifier && event.key.toLowerCase() === 'b') { event.preventDefault(); setSidebarCollapsed(prev => !prev); }
      if (hasModifier && event.key === '/') { event.preventDefault(); document.getElementById('global-search')?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeFloatingPanels, openCommandPalette, openCreateModal]);

  // Command palette keyboard nav
  const handleCommandKeyDown = useCallback((event) => {
    if (filteredCommands.length === 0) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveCommandIndex(prev => prev >= filteredCommands.length - 1 ? 0 : prev + 1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveCommandIndex(prev => prev <= 0 ? filteredCommands.length - 1 : prev - 1); }
    if (event.key === 'Enter') { event.preventDefault(); const cmd = filteredCommands[activeCommandIndex]; if (cmd) handleCommandSelect(cmd.action); }
  }, [activeCommandIndex, filteredCommands, handleCommandSelect]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)} aria-hidden="true">
              <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 24, stiffness: 240 }}
                className="relative flex h-full w-72 flex-col bg-white shadow-xl dark:bg-gray-800"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                  <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500" />
                    <span className="text-lg font-bold gradient-text">ResumeAI Pro</span>
                  </Link>
                  <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close menu">
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <Sidebar onClose={() => setSidebarOpen(false)} isMobile isCollapsed={false} />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className={cn('fixed left-0 top-0 z-30 hidden h-full transition-all duration-300 lg:block', sidebarCollapsed ? 'w-20' : 'w-64')}>
          <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
        </aside>

        {/* Main Content */}
        <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')}>
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-gray-200/50 glass dark:border-gray-700/50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden" aria-label="Open menu"><FiMenu className="h-5 w-5" /></button>
                  <button onClick={() => setSidebarCollapsed(prev => !prev)} className="hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:flex" aria-label="Toggle sidebar">
                    {sidebarCollapsed ? <FiChevronRight className="h-5 w-5" /> : <FiChevronLeft className="h-5 w-5" />}
                  </button>
                  <div className="relative hidden md:block">
                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input id="global-search" type="search" placeholder="Search dashboard..."
                      className="w-64 rounded-xl border border-gray-200 bg-white/70 py-2 pl-10 pr-16 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800/60 lg:w-80" />
                    <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Ctrl+/</kbd>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {isPremium && (
                    <Badge variant="warning" className="hidden sm:inline-flex">
                      <FiAward className="mr-1 h-3 w-3" />
                      PRO
                    </Badge>
                  )}
                  <Tooltip content="Command Palette (Ctrl+K)">
                    <button
                      type="button"
                      onClick={openCommandPalette}
                      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Open command palette"
                    >
                      <FiCommand className="h-5 w-5" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Refresh">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                      aria-label="Refresh"
                    >
                      <FiRefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
                    </button>
                  </Tooltip>

                  <div className="relative" ref={quickActionsRef}>
                    <Tooltip content="Quick actions">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false);
                          setShowUserMenu(false);
                          setShowQuickActions((prev) => !prev);
                        }}
                        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Quick actions"
                        aria-expanded={showQuickActions}
                      >
                        <FiZap className="h-5 w-5" />
                      </button>
                    </Tooltip>
                    <AnimatePresence>
                      {showQuickActions && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -8 }}
                          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                          role="menu"
                        >
                          <div className="p-2">
                            <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Quick Actions</p>
                            {quickActions.map((action) => (
                              <button
                                key={action.id}
                                type="button"
                                onClick={() => {
                                  action.action();
                                  setShowQuickActions(false);
                                }}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                role="menuitem"
                              >
                                <span className="flex items-center gap-3">
                                  <action.icon className={cn('h-4 w-4', action.iconClassName)} />
                                  <span className="text-sm text-gray-900 dark:text-white">{action.label}</span>
                                </span>
                                {action.shortcut && (
                                  <span className="text-xs text-gray-400">{action.shortcut}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative" ref={notificationsRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickActions(false);
                        setShowUserMenu(false);
                        setShowNotifications((prev) => !prev);
                      }}
                      className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Notifications"
                      aria-expanded={showNotifications}
                    >
                      <FiBell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge variant="danger" size="sm" className="absolute -right-1 -top-1 min-w-[1.25rem] justify-center px-1">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </button>
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -8 }}
                          className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                          role="menu"
                        >
                          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                              <button
                                type="button"
                                onClick={() => markAllAsRead?.()}
                                className="text-xs text-primary-500 hover:text-primary-600"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.slice(0, 8).map((notif) => {
                                const meta = getNotificationMeta(notif.type);
                                const Icon = meta.icon;
                                return (
                                  <button
                                    key={notif.id}
                                    type="button"
                                    onClick={() => markAsRead?.(notif.id)}
                                    className={cn(
                                      'flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/50',
                                      !notif.read && 'bg-blue-50/40 dark:bg-blue-900/10'
                                    )}
                                    role="menuitem"
                                  >
                                    <div className={cn('rounded-lg p-2', meta.className)}>
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{notif.message}</p>
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-8 text-center">
                                <FiBell className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
                    </button>
                  </Tooltip>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickActions(false);
                        setShowNotifications(false);
                        setShowUserMenu((prev) => !prev);
                      }}
                      className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="User menu"
                      aria-expanded={showUserMenu}
                    >
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-sm font-semibold text-white">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="" className="h-8 w-8 object-cover" />
                        ) : (
                          (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                      <div className="hidden text-left lg:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.displayName || 'Account'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{accountLabel}</p>
                      </div>
                      <FiChevronDown className="hidden h-4 w-4 text-gray-400 lg:block" />
                    </button>
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -8 }}
                          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                          role="menu"
                        >
                          <div className="border-b border-gray-200 p-3 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {greeting}, {firstName}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                            <Badge variant="default" size="sm" className="mt-2">
                              {accountLabel}
                            </Badge>
                          </div>
                          <div className="p-2">
                            {[
                              { id: 'profile', icon: FiUser, label: 'Profile', path: '/profile' },
                              { id: 'settings', icon: FiSettings, label: 'Settings', path: '/settings' },
                              { id: 'billing', icon: FiCreditCard, label: 'Billing', path: '/billing' },
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setShowUserMenu(false);
                                  navigate(item.path);
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                role="menuitem"
                              >
                                <item.icon className="h-4 w-4" />
                                <span className="text-sm">{item.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              role="menuitem"
                            >
                              <FiLogOut className="h-4 w-4" />
                              <span className="text-sm">Sign out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">
            {showWelcome && location.pathname === '/dashboard' && (
              <WelcomeCard greeting={greeting} firstName={firstName} stats={stats} resumes={resumes}
                onCreateResume={openCreateModal}
                onContinue={() => navigate(latestResumeId ? `/builder/${latestResumeId}` : '/builder')} />
            )}
            <motion.div key={location.pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}>
              {children}
            </motion.div>
          </main>

          <footer className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-gray-500 sm:flex-row sm:text-left">
              <p>© {new Date().getFullYear()} ResumeAI Pro</p>
              <div className="flex items-center gap-4">
                <Link to="/privacy" className="hover:text-primary-500">Privacy</Link>
                <Link to="/terms" className="hover:text-primary-500">Terms</Link>
                <Link to="/help" className="hover:text-primary-500">Help</Link>
              </div>
            </div>
          </footer>
        </div>

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create a new resume"
          size="lg"
        >
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Pick a template to start. You can change it later in the builder.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={isCreatingResume}
                onClick={() => handleCreateResume(t.id)}
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-primary-400 hover:shadow-md disabled:opacity-50 dark:border-gray-700 dark:hover:border-primary-500"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-lg text-white',
                    t.class
                  )}
                  aria-hidden
                >
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Modal>

        <Modal
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          title="Go to…"
          size="md"
        >
          <Input
            id={COMMAND_INPUT_ID}
            icon={<FiSearch />}
            placeholder="Search commands…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleCommandKeyDown}
            autoComplete="off"
          />
          <div className="mt-3 max-h-80 overflow-y-auto">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, i) => (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => handleCommandSelect(cmd.action)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors',
                    i === activeCommandIndex
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <cmd.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">{cmd.label}</span>
                  </span>
                  {cmd.shortcut && <kbd className="text-xs text-gray-400">{cmd.shortcut}</kbd>}
                </button>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-gray-500">No commands match.</p>
            )}
          </div>
          <p className="mt-3 border-t border-gray-200 pt-2 text-center text-xs text-gray-400 dark:border-gray-700">
            <kbd className="rounded border px-1">↑↓</kbd> navigate ·{' '}
            <kbd className="rounded border px-1">Enter</kbd> select ·{' '}
            <kbd className="rounded border px-1">Esc</kbd> close
          </p>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(DashboardLayout);
