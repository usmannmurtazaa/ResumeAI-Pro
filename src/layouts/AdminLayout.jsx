import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertCircle, FiBarChart2, FiBell, FiCheckCircle, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiCommand, FiCreditCard, FiDatabase,
  FiFileText, FiFlag, FiHelpCircle, FiInfo, FiKey, FiLayout,
  FiLogOut, FiMenu, FiMoon, FiRefreshCw, FiSearch, FiSettings,
  FiShield, FiSun, FiTerminal, FiUser, FiUsers, FiX, FiZap,
} from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import Badge from '../components/ui/Badge';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const ADMIN_SIDEBAR_STORAGE_KEY = 'adminSidebarCollapsed';
const COMMAND_INPUT_ID = 'admin-command-palette-input';

const SYSTEM_SERVICES = [
  { id: 'api', label: 'API', status: 'operational', metric: '99.99%' },
  { id: 'database', label: 'Database', status: 'operational', metric: '100%' },
  { id: 'storage', label: 'Storage', status: 'operational', metric: '100%' },
  { id: 'functions', label: 'Functions', status: 'operational', metric: '99.95%' },
  { id: 'auth', label: 'Authentication', status: 'operational', metric: '100%' },
  { id: 'email', label: 'Email Service', status: 'operational', metric: '99.8%' },
  { id: 'cdn', label: 'CDN', status: 'operational', metric: '100%' },
  { id: 'cache', label: 'Cache', status: 'operational', metric: '99.9%' },
  { id: 'queue', label: 'Queue', status: 'operational', metric: '100%' },
];

// ── Utility Functions ────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getStoredSidebarCollapsed = () => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
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
  const tagName = target.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable;
};

const getNotificationMeta = (type) => {
  switch (type) {
    case 'success':
      return { icon: FiCheckCircle, className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' };
    case 'warning':
      return { icon: FiAlertCircle, className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' };
    case 'error':
      return { icon: FiAlertCircle, className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' };
    default:
      return { icon: FiInfo, className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' };
  }
};

const statusStyles = {
  operational: { container: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500', label: 'Operational' },
  degraded: { container: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', label: 'Degraded' },
  outage: { container: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', label: 'Outage' },
};

// ── Sub-Components ───────────────────────────────────────────────────────

const StatusCard = React.memo(({ label, status, metric }) => {
  const config = statusStyles[status] || statusStyles.operational;
  return (
    <div className={cn('rounded-lg p-3', config.container)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <div className={cn('flex items-center gap-1 text-xs', config.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
          <span>{config.label}</span>
        </div>
      </div>
      {metric && <p className="mt-1 text-xs text-gray-500">Uptime: {metric}</p>}
    </div>
  );
});

StatusCard.displayName = 'StatusCard';

const SystemStatusButton = React.memo(({ onClick, reduceMotion }) => (
  <button type="button" onClick={onClick}
    className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
    aria-label="View system status">
    <div className="relative">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      {!reduceMotion && <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />}
    </div>
    <span className="text-xs text-green-600 dark:text-green-400">System Online</span>
  </button>
));

SystemStatusButton.displayName = 'SystemStatusButton';

// ── AdminLayout ──────────────────────────────────────────────────────────

const AdminLayout = ({ children, title, description }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredSidebarCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [statusTimestamp, setStatusTimestamp] = useState(() => new Date());

  const quickActionsRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const redirectHandledRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const { user, logout, hasRole, loading, initializing } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const authPending = Boolean(loading || initializing);
  const isAdmin = hasRole('admin');
  const greeting = useMemo(() => getGreeting(), []);

  // ── Cleanup timeout on unmount ──────────────────────────────────────

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  // ── Close floating menus ────────────────────────────────────────────

  const closeFloatingMenus = useCallback(() => {
    setShowQuickActions(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, []);

  // ── Quick Actions ──────────────────────────────────────────────────

  const quickActions = useMemo(() => [
    { id: 'users', icon: FiUsers, label: 'View Users', action: () => navigate('/admin/users'), iconClassName: 'text-blue-500', shortcut: 'Ctrl+U' },
    { id: 'resumes', icon: FiFileText, label: 'Manage Resumes', action: () => navigate('/admin/resumes'), iconClassName: 'text-purple-500', shortcut: 'Ctrl+R' },
    { id: 'analytics', icon: FiBarChart2, label: 'Analytics', action: () => navigate('/admin/analytics'), iconClassName: 'text-green-500', shortcut: 'Ctrl+A' },
    { id: 'subscriptions', icon: FiCreditCard, label: 'Subscriptions', action: () => navigate('/admin/subscriptions'), iconClassName: 'text-yellow-500' },
    { id: 'settings', icon: FiSettings, label: 'Settings', action: () => navigate('/admin/settings'), iconClassName: 'text-gray-500', shortcut: 'Ctrl+,' },
  ], [navigate]);

  // ── Command Options ─────────────────────────────────────────────────

  const commandOptions = useMemo(() => [
    { id: 'users', label: 'User Management', icon: FiUsers, action: () => navigate('/admin/users'), shortcut: 'Ctrl+U' },
    { id: 'resumes', label: 'Resume Management', icon: FiFileText, action: () => navigate('/admin/resumes'), shortcut: 'Ctrl+R' },
    { id: 'analytics', label: 'Platform Analytics', icon: FiBarChart2, action: () => navigate('/admin/analytics'), shortcut: 'Ctrl+A' },
    { id: 'subscriptions', label: 'Subscriptions', icon: FiCreditCard, action: () => navigate('/admin/subscriptions') },
    { id: 'templates', label: 'Template Management', icon: FiLayout, action: () => navigate('/admin/templates') },
    { id: 'settings', label: 'System Settings', icon: FiSettings, action: () => navigate('/admin/settings'), shortcut: 'Ctrl+,' },
    { id: 'logs', label: 'System Logs', icon: FiTerminal, action: () => navigate('/admin/logs') },
    { id: 'database', label: 'Database', icon: FiDatabase, action: () => navigate('/admin/database') },
    { id: 'feature-flags', label: 'Feature Flags', icon: FiFlag, action: () => navigate('/admin/feature-flags') },
    { id: 'api-keys', label: 'API Keys', icon: FiKey, action: () => navigate('/admin/api-keys') },
  ], [navigate]);

  const filteredCommands = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return commandOptions;
    return commandOptions.filter(cmd => cmd.label.toLowerCase().includes(term));
  }, [commandOptions, searchTerm]);

  // ── Auth Redirect ──────────────────────────────────────────────────

  useEffect(() => {
    if (authPending) return;
    if (!isAdmin && !redirectHandledRef.current) {
      redirectHandledRef.current = true;
      toast.error('You do not have permission to access the admin area.');
      navigate('/dashboard', { replace: true });
    }
  }, [authPending, isAdmin, navigate]);

  // ── Persist Sidebar State ──────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  // ── Close Mobile Sidebar on Route Change ──────────────────────────

  useEffect(() => {
    setMobileSidebarOpen(false);
    closeFloatingMenus();
  }, [closeFloatingMenus, location.pathname]);

  // ── Lock Body Scroll on Mobile Sidebar ────────────────────────────

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [mobileSidebarOpen]);

  // ── Focus Command Palette Input ────────────────────────────────────

  useEffect(() => {
    if (!showCommandPalette) {
      setSearchTerm('');
      setActiveCommandIndex(0);
      return;
    }
    const timer = setTimeout(() => {
      document.getElementById(COMMAND_INPUT_ID)?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [showCommandPalette]);

  // ── Reset command index on search change ──────────────────────────

  useEffect(() => {
    setActiveCommandIndex(0);
  }, [searchTerm]);

  // ── Update timestamp when system status opens ─────────────────────

  useEffect(() => {
    if (showSystemStatus) setStatusTimestamp(new Date());
  }, [showSystemStatus]);

  // ── Click Outside Handlers ────────────────────────────────────────

  useEffect(() => {
    const handler = (event) => {
      const target = event.target;
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

  // ── Global Keyboard Shortcuts ─────────────────────────────────────

  useEffect(() => {
    const handler = (event) => {
      const hasModifier = event.ctrlKey || event.metaKey;
      const typing = isTypingTarget(event.target);

      if (event.key === 'Escape') {
        closeFloatingMenus();
        setMobileSidebarOpen(false);
        setShowCommandPalette(false);
        setShowSystemStatus(false);
        return;
      }

      if (typing && !hasModifier) return;

      if (hasModifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        closeFloatingMenus();
        setShowCommandPalette(true);
      }

      if (hasModifier && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }

      if (hasModifier && event.key === '/') {
        event.preventDefault();
        document.getElementById('admin-global-search')?.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeFloatingMenus]);

  // ── FIXED: Refresh without page reload ────────────────────────────

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    // Dispatch custom event that pages can listen to for data refresh
    window.dispatchEvent(new CustomEvent('admin:refresh'));
    toast.success('Refreshing data...');
    refreshTimeoutRef.current = setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [isRefreshing]);

  // ── FIXED: Logout with error handling ─────────────────────────────

  const handleLogout = useCallback(async () => {
    try {
      closeFloatingMenus();
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out.');
    }
  }, [closeFloatingMenus, logout, navigate]);

  // ── Command Selection ─────────────────────────────────────────────

  const handleCommandSelect = useCallback((action) => {
    action();
    setShowCommandPalette(false);
    setSearchTerm('');
    setActiveCommandIndex(0);
  }, []);

  const handleCommandKeyDown = useCallback((event) => {
    if (filteredCommands.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveCommandIndex(prev => prev >= filteredCommands.length - 1 ? 0 : prev + 1);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveCommandIndex(prev => prev <= 0 ? filteredCommands.length - 1 : prev - 1);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = filteredCommands[activeCommandIndex];
      if (cmd) handleCommandSelect(cmd.action);
    }
  }, [activeCommandIndex, filteredCommands, handleCommandSelect]);

  // ── FIXED: Handle mark as read safely ─────────────────────────────

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await markAsRead?.(id);
    } catch {
      // Silently fail
    }
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead?.();
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }, [markAllAsRead]);

  // ── Loading State ──────────────────────────────────────────────────

  if (authPending) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="rounded-xl border border-gray-200 bg-white/80 px-5 py-4 text-sm text-gray-600 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
            Checking admin access...
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (!isAdmin) return null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileSidebarOpen(false)} aria-hidden="true">
              <motion.aside
                initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 24, stiffness: 240 }}
                className="relative h-full w-72" onClick={(e) => e.stopPropagation()} aria-label="Admin sidebar">
                <Sidebar isCollapsed={false} isAdmin onToggle={() => setSidebarCollapsed(prev => !prev)} onCloseMobile={() => setMobileSidebarOpen(false)} />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className={cn('fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 lg:block', sidebarCollapsed ? 'w-20' : 'w-64')} aria-label="Desktop admin sidebar">
          <Sidebar isCollapsed={sidebarCollapsed} isAdmin onToggle={() => setSidebarCollapsed(prev => !prev)} />
        </aside>

        {/* Main Content */}
        <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')}>
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-gray-200/50 glass dark:border-gray-700/50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between gap-3">
                {/* Left Section */}
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <button type="button" onClick={() => setMobileSidebarOpen(true)}
                    className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden" aria-label="Open admin menu">
                    <FiMenu className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => setSidebarCollapsed(prev => !prev)}
                    className="hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:flex"
                    aria-label={sidebarCollapsed ? 'Expand' : 'Collapse'}>
                    {sidebarCollapsed ? <FiChevronRight className="h-5 w-5" /> : <FiChevronLeft className="h-5 w-5" />}
                  </button>
                  <div className="relative hidden md:block">
                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input id="admin-global-search" type="search" placeholder="Search admin..."
                      className="w-64 rounded-xl border border-gray-200 bg-white/70 py-2 pl-10 pr-16 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800/60 lg:w-80"
                      aria-label="Search admin panel" />
                    <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Ctrl+/</kbd>
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <h1 className="truncate text-xl font-semibold gradient-text">{title || 'Admin Dashboard'}</h1>
                    {description && <p className="truncate text-xs text-gray-500">{description}</p>}
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <SystemStatusButton onClick={() => setShowSystemStatus(true)} reduceMotion={shouldReduceMotion} />
                  <Tooltip content="Command Palette (Ctrl+K)">
                    <button type="button" onClick={() => { closeFloatingMenus(); setShowCommandPalette(true); }}
                      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Command palette">
                      <FiCommand className="h-5 w-5" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Refresh data">
                    <button type="button" onClick={handleRefresh} disabled={isRefreshing}
                      className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800" aria-label="Refresh">
                      <FiRefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
                    </button>
                  </Tooltip>

                  {/* Quick Actions */}
                  <div className="relative" ref={quickActionsRef}>
                    <Tooltip content="Quick actions">
                      <button type="button" onClick={() => { setShowNotifications(false); setShowUserMenu(false); setShowQuickActions(prev => !prev); }}
                        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Quick actions" aria-expanded={showQuickActions}>
                        <FiZap className="h-5 w-5" />
                      </button>
                    </Tooltip>
                    <AnimatePresence>
                      {showQuickActions && (
                        <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }}
                          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" role="menu">
                          <div className="p-2">
                            <p className="px-3 py-2 text-xs text-gray-500">Quick Actions</p>
                            {quickActions.map(action => (
                              <button key={action.id} type="button" onClick={() => { action.action(); setShowQuickActions(false); }}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                                <span className="flex items-center gap-3"><action.icon className={cn('h-4 w-4', action.iconClassName)} /><span className="text-sm">{action.label}</span></span>
                                {action.shortcut && <span className="text-xs text-gray-400">{action.shortcut}</span>}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Notifications */}
                  <div className="relative" ref={notificationsRef}>
                    <button type="button" onClick={() => { setShowQuickActions(false); setShowUserMenu(false); setShowNotifications(prev => !prev); }}
                      className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Notifications" aria-expanded={showNotifications}>
                      <FiBell className="h-5 w-5" />
                      {unreadCount > 0 && <Badge variant="danger" size="sm" className="absolute -right-1 -top-1">{unreadCount > 9 ? '9+' : unreadCount}</Badge>}
                    </button>
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }}
                          className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" role="menu">
                          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                            {unreadCount > 0 && <button type="button" onClick={handleMarkAllAsRead} className="text-xs text-primary-500 hover:text-primary-600">Mark all read</button>}
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notifications.length > 0 ? notifications.slice(0, 5).map(n => {
                              const meta = getNotificationMeta(n.type);
                              return (
                                <button key={n.id} type="button" onClick={() => handleMarkAsRead(n.id)}
                                  className={cn('flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/50', !n.read && 'bg-blue-50/40 dark:bg-blue-900/10')} role="menuitem">
                                  <div className={cn('rounded-lg p-2', meta.className)}><meta.icon className="h-4 w-4" /></div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{n.title}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                                  </div>
                                </button>
                              );
                            }) : (
                              <div className="p-8 text-center"><FiBell className="mx-auto mb-2 h-8 w-8 text-gray-300" /><p className="text-sm text-gray-500">No notifications</p></div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Theme, User Menu */}
                  <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
                    <button type="button" onClick={toggleTheme} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle theme">
                      {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
                    </button>
                  </Tooltip>
                  <div className="relative" ref={userMenuRef}>
                    <button type="button" onClick={() => { setShowQuickActions(false); setShowNotifications(false); setShowUserMenu(prev => !prev); }}
                      className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="User menu" aria-expanded={showUserMenu}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold">
                        {(user?.displayName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                      </div>
                      <div className="hidden text-left lg:block">
                        <p className="text-sm font-medium">{user?.displayName || 'Admin'}</p>
                        <p className="text-xs text-gray-500">Administrator</p>
                      </div>
                      <FiChevronDown className="hidden h-4 w-4 lg:block" />
                    </button>
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }}
                          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" role="menu">
                          <div className="border-b border-gray-200 p-3 dark:border-gray-700">
                            <p className="font-medium">{greeting}, {user?.displayName?.split(' ')[0] || 'Admin'}</p>
                            <p className="truncate text-xs text-gray-500">{user?.email}</p>
                            <Badge variant="danger" size="sm" className="mt-2">Admin</Badge>
                          </div>
                          <div className="p-2">
                            {[{ id: 'profile', icon: FiUser, label: 'Profile', path: '/admin/profile' }, { id: 'settings', icon: FiSettings, label: 'Settings', path: '/admin/settings' }, { id: 'help', icon: FiHelpCircle, label: 'Help', path: '/admin/help' }].map(item => (
                              <button key={item.id} type="button" onClick={() => { setShowUserMenu(false); navigate(item.path); }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                                <item.icon className="h-4 w-4" /><span className="text-sm">{item.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                            <button type="button" onClick={handleLogout}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" role="menuitem">
                              <FiLogOut className="h-4 w-4" /><span className="text-sm">Sign Out</span>
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

          {/* Main Content */}
          <main className="p-4 sm:p-6 lg:p-8">
            <motion.div key={location.pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.12 : 0.26 }}>
              {children}
            </motion.div>
          </main>
        </div>

        {/* System Status Modal */}
        <Modal isOpen={showSystemStatus} onClose={() => setShowSystemStatus(false)} title="System Status" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {SYSTEM_SERVICES.map(s => <StatusCard key={s.id} label={s.label} status={s.status} metric={s.metric} />)}
            </div>
            <p className="text-center text-xs text-gray-500">Last updated: {statusTimestamp.toLocaleString()}</p>
          </div>
        </Modal>

        {/* Command Palette Modal */}
        <Modal isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} title="Admin Commands" size="md">
          <div className="space-y-3">
            <Input id={COMMAND_INPUT_ID} icon={<FiSearch />} placeholder="Type a command..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} onKeyDown={handleCommandKeyDown} autoComplete="off" />
            <div className="max-h-80 overflow-y-auto">
              {filteredCommands.length > 0 ? filteredCommands.map((cmd, i) => (
                <button key={cmd.id} type="button" onClick={() => handleCommandSelect(cmd.action)}
                  className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left', i === activeCommandIndex ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
                  <span className="flex items-center gap-3"><cmd.icon className="h-4 w-4 text-gray-500" /><span className="text-sm">{cmd.label}</span></span>
                  {cmd.shortcut && <kbd className="text-xs text-gray-400">{cmd.shortcut}</kbd>}
                </button>
              )) : <p className="py-4 text-center text-gray-500">No commands found.</p>}
            </div>
            <div className="border-t border-gray-200 pt-2 text-center text-xs text-gray-400">
              <kbd>↑↓</kbd> navigate <kbd>Enter</kbd> select <kbd>Esc</kbd> close
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(AdminLayout);