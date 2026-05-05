import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertCircle, FiBarChart2, FiBell, FiCheckCircle,
  FiChevronDown, FiChevronLeft, FiChevronRight, FiCommand,
  FiCreditCard, FiDatabase, FiFileText, FiFlag, FiHelpCircle,
  FiInfo, FiKey, FiLayout, FiLogOut, FiMenu, FiMoon,
  FiRefreshCw, FiSearch, FiSettings, FiShield, FiSun,
  FiTerminal, FiUser, FiUsers, FiX, FiZap,
} from 'react-icons/fi';
import Sidebar from '../../components/common/Sidebar';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Badge from '../../components/ui/Badge';
import Tooltip from '../../components/ui/Tooltip';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
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

const STATUS_STYLES = {
  operational: {
    container: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
    label: 'Operational',
  },
  degraded: {
    container: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'Degraded',
  },
  outage: {
    container: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'Outage',
  },
};

// ── Utilities ────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getStoredSidebarCollapsed = () => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
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

// ── FIXED: Expanded notification meta to cover all types ──────────────────

const getNotificationMeta = (type) => {
  const map = {
    success: { icon: FiCheckCircle, className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    warning: { icon: FiAlertCircle, className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    error: { icon: FiAlertCircle, className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    info: { icon: FiInfo, className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    resume_created: { icon: FiFileText, className: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    resume_updated: { icon: FiFileText, className: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    subscription_expiring: { icon: FiCreditCard, className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    new_feature: { icon: FiZap, className: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    system: { icon: FiSettings, className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' },
  };
  return map[type] || map.info;
};

// ── Sub-Components ───────────────────────────────────────────────────────

const StatusCard = React.memo(({ label, status, metric }) => {
  const config = STATUS_STYLES[status] || STATUS_STYLES.operational;
  return (
    <div className={cn('rounded-lg p-3', config.container)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <div className={cn('flex items-center gap-1 text-xs', config.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
          <span>{config.label}</span>
        </div>
      </div>
      {metric && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Uptime: {metric}</p>}
    </div>
  );
});

StatusCard.displayName = 'StatusCard';

const SystemStatusButton = React.memo(({ onClick, reduceMotion }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
    aria-label="View system status"
  >
    <div className="relative">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      {!reduceMotion && <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />}
    </div>
    <span className="text-xs text-green-600 dark:text-green-400">System Online</span>
  </button>
));

SystemStatusButton.displayName = 'SystemStatusButton';

// ── Main Component ────────────────────────────────────────────────────────

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
  const redirectHandledRef = useRef(false);
  const refreshTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const { user, logout, hasRole, loading, initializing } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead } = useNotifications();

  const authPending = Boolean(loading || initializing);
  const isAdmin = hasRole('admin');
  const greeting = useMemo(() => getGreeting(), []);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  // ── Close floating menus ─────────────────────────────────────────────

  const closeFloatingMenus = useCallback(() => {
    setShowQuickActions(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, []);

  // ── Quick Actions ────────────────────────────────────────────────────

  const quickActions = useMemo(() => [
    { id: 'users', icon: FiUsers, label: 'View Users', action: () => navigate('/admin/users'), iconClassName: 'text-blue-500', shortcut: 'Ctrl+U' },
    { id: 'resumes', icon: FiFileText, label: 'Manage Resumes', action: () => navigate('/admin/resumes'), iconClassName: 'text-purple-500', shortcut: 'Ctrl+R' },
    { id: 'analytics', icon: FiBarChart2, label: 'Analytics', action: () => navigate('/admin/analytics'), iconClassName: 'text-green-500', shortcut: 'Ctrl+A' },
    { id: 'subscriptions', icon: FiCreditCard, label: 'Subscriptions', action: () => navigate('/admin/subscriptions'), iconClassName: 'text-yellow-500' },
    { id: 'settings', icon: FiSettings, label: 'Settings', action: () => navigate('/admin/settings'), iconClassName: 'text-gray-500', shortcut: 'Ctrl+,' },
  ], [navigate]);

  // ── Command Options ──────────────────────────────────────────────────

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

  // ── Effects ──────────────────────────────────────────────────────────

  // Redirect non-admins
  useEffect(() => {
    if (authPending) return;
    if (!isAdmin && !redirectHandledRef.current) {
      redirectHandledRef.current = true;
      toast.error('You do not have permission to access the admin area.');
      navigate('/dashboard', { replace: true });
    }
  }, [authPending, isAdmin, navigate]);

  // Persist sidebar state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    closeFloatingMenus();
  }, [location.pathname, closeFloatingMenus]);

  // Lock body scroll on mobile sidebar
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [mobileSidebarOpen]);

  // Focus command palette input
  useEffect(() => {
    if (!showCommandPalette) {
      setSearchTerm('');
      setActiveCommandIndex(0);
      return;
    }
    // FIXED: Use double rAF for reliable focus
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(COMMAND_INPUT_ID)?.focus();
      });
    });
  }, [showCommandPalette]);

  // Reset active index on search
  useEffect(() => {
    setActiveCommandIndex(0);
  }, [searchTerm]);

  // Update timestamp when system status opens
  useEffect(() => {
    if (showSystemStatus) setStatusTimestamp(new Date());
  }, [showSystemStatus]);

  // Click outside listeners
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

  // Keyboard shortcuts
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

  // ── Handlers ─────────────────────────────────────────────────────────

  // FIXED: Proper cleanup for refresh timeout
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    refreshTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        window.location.reload();
      }
    }, 250);
  }, [isRefreshing]);

  const handleLogout = useCallback(async () => {
    try {
      closeFloatingMenus();
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to log out.');
    }
  }, [closeFloatingMenus, logout, navigate]);

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

  // ── Render States ────────────────────────────────────────────────────

  if (authPending) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="glass-card px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
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
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            >
              <motion.aside
                initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 24, stiffness: 240 }}
                className="relative h-full w-72"
                onClick={(e) => e.stopPropagation()}
              >
                <Sidebar isCollapsed={false} isAdmin onCloseMobile={() => setMobileSidebarOpen(false)} />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className={cn('fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 lg:block', sidebarCollapsed ? 'w-20' : 'w-64')}>
          <Sidebar isCollapsed={sidebarCollapsed} isAdmin onToggle={() => setSidebarCollapsed(prev => !prev)} />
        </aside>

        {/* Main Content */}
        <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')}>
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-gray-200/50 glass dark:border-gray-700/50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <button onClick={() => setMobileSidebarOpen(true)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden" aria-label="Open admin menu">
                    <FiMenu className="h-5 w-5" />
                  </button>
                  <button onClick={() => setSidebarCollapsed(prev => !prev)} className="hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:flex" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                    {sidebarCollapsed ? <FiChevronRight className="h-5 w-5" /> : <FiChevronLeft className="h-5 w-5" />}
                  </button>
                  <div className="relative hidden md:block">
                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input id="admin-global-search" type="search" placeholder="Search admin..."
                      className="w-64 rounded-xl border border-gray-200 bg-white/70 py-2 pl-10 pr-16 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800/60 lg:w-80"
                      aria-label="Search admin panel" />
                    <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Ctrl+/</kbd>
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <h1 className="truncate text-xl font-semibold gradient-text">{title || 'Admin Dashboard'}</h1>
                    {description && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="hidden md:block">
                    <SystemStatusButton onClick={() => setShowSystemStatus(true)} reduceMotion={shouldReduceMotion} />
                  </div>
                  <Tooltip content="Command Palette (Ctrl+K)">
                    <button onClick={() => { closeFloatingMenus(); setShowCommandPalette(true); }} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Open command palette">
                      <FiCommand className="h-5 w-5" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Refresh data">
                    <button onClick={handleRefresh} disabled={isRefreshing} className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800" aria-label="Refresh data">
                      <FiRefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
                    </button>
                  </Tooltip>

                  {/* Quick Actions */}
                  <div className="relative" ref={quickActionsRef}>
                    <Tooltip content="Quick actions">
                      <button onClick={() => { setShowNotifications(false); setShowUserMenu(false); setShowQuickActions(prev => !prev); }}
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
                              <button key={action.id} onClick={() => { action.action(); setShowQuickActions(false); }}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                                <span className="flex items-center gap-3">
                                  <action.icon className={cn('h-4 w-4', action.iconClassName)} />
                                  <span className="text-sm">{action.label}</span>
                                </span>
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
                    <button onClick={() => { setShowQuickActions(false); setShowUserMenu(false); setShowNotifications(prev => !prev); }}
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
                            {unreadCount > 0 && (
                              <button onClick={() => markAllAsRead?.()} className="text-xs text-primary-500 hover:text-primary-600">Mark all read</button>
                            )}
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? notifications.slice(0, 5).map(notif => {
                              const meta = getNotificationMeta(notif.type);
                              const Icon = meta.icon;
                              return (
                                <button key={notif.id} onClick={() => markAsRead?.(notif.id)}
                                  className={cn('flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/50', !notif.read && 'bg-blue-50/40 dark:bg-blue-900/10')} role="menuitem">
                                  <div className={cn('rounded-lg p-2', meta.className)}><Icon className="h-4 w-4" /></div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{notif.message}</p>
                                  </div>
                                </button>
                              );
                            }) : (
                              <div className="p-8 text-center">
                                <FiBell className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                                <p className="text-sm text-gray-500">No notifications</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Theme Toggle */}
                  <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
                    <button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle theme">
                      {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
                    </button>
                  </Tooltip>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button onClick={() => { setShowQuickActions(false); setShowNotifications(false); setShowUserMenu(prev => !prev); }}
                      className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="User menu" aria-expanded={showUserMenu}>
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-red-500 to-orange-500 font-semibold text-white text-sm">
                        {user?.photoURL ? <img src={user.photoURL} alt="" className="h-8 w-8 object-cover" /> : (user?.displayName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                      </div>
                      <div className="hidden text-left lg:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.displayName || 'Admin'}</p>
                        <p className="text-xs text-gray-500">Administrator</p>
                      </div>
                      <FiChevronDown className="hidden h-4 w-4 lg:block" />
                    </button>
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }}
                          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" role="menu">
                          <div className="border-b border-gray-200 p-3 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">{greeting}, {user?.displayName?.split(' ')[0] || 'Admin'}</p>
                            <p className="truncate text-xs text-gray-500">{user?.email}</p>
                            <Badge variant="danger" size="sm" className="mt-2">Admin</Badge>
                          </div>
                          <div className="p-2">
                            {[
                              { id: 'profile', icon: FiUser, label: 'Profile Settings', path: '/admin/profile' },
                              { id: 'settings', icon: FiSettings, label: 'System Settings', path: '/admin/settings' },
                              { id: 'help', icon: FiHelpCircle, label: 'Help & Support', path: '/admin/help' },
                            ].map(item => (
                              <button key={item.id} onClick={() => { setShowUserMenu(false); navigate(item.path); }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                                <item.icon className="h-4 w-4" /><span className="text-sm">{item.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" role="menuitem">
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
            <div className="mb-4 lg:hidden">
              <Badge variant="danger" className="inline-flex items-center gap-1"><FiShield className="h-3 w-3" />Admin Mode</Badge>
            </div>
            <div className="mb-6 sm:hidden">
              <h1 className="text-2xl font-bold gradient-text">{title || 'Admin Dashboard'}</h1>
              {description && <p className="text-sm text-gray-500">{description}</p>}
            </div>
            <motion.div key={location.pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.12 : 0.26 }}>
              {children}
            </motion.div>
          </main>

          {/* Footer */}
          <footer className="mt-auto border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-gray-500 sm:flex-row sm:text-left">
              <p>© {new Date().getFullYear()} ResumeAI Pro Admin</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setShowSystemStatus(true)} className="hover:text-primary-500">System Status</button>
                <span>v{process.env.REACT_APP_VERSION || '2.5.0'}</span>
              </div>
            </div>
          </footer>
        </div>

        {/* System Status Modal */}
        <Modal isOpen={showSystemStatus} onClose={() => setShowSystemStatus(false)} title="System Status" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {SYSTEM_SERVICES.map(s => <StatusCard key={s.id} label={s.label} status={s.status} metric={s.metric} />)}
            </div>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p className="mb-2 text-sm font-medium">Recent Incidents</p>
              <p className="text-xs text-gray-500">No incidents reported in the last 7 days.</p>
            </div>
            <p className="text-center text-xs text-gray-500">Last updated: {statusTimestamp.toLocaleString()}</p>
          </div>
        </Modal>

        {/* Command Palette Modal */}
        <Modal isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} title="Admin Commands" size="md">
          <div className="space-y-3">
            <Input id={COMMAND_INPUT_ID} icon={<FiSearch />} placeholder="Type a command or search..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleCommandKeyDown} autoComplete="off" />
            <div className="max-h-80 overflow-y-auto">
              {filteredCommands.length > 0 ? filteredCommands.map((cmd, i) => (
                <button key={cmd.id} onClick={() => handleCommandSelect(cmd.action)}
                  className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors', i === activeCommandIndex ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
                  <span className="flex items-center gap-3"><cmd.icon className="h-4 w-4 text-gray-500" /><span className="text-sm">{cmd.label}</span></span>
                  {cmd.shortcut && <kbd className="text-xs text-gray-400">{cmd.shortcut}</kbd>}
                </button>
              )) : <p className="py-4 text-center text-gray-500">No commands found.</p>}
            </div>
            <div className="border-t border-gray-200 pt-2 text-center text-xs text-gray-400 dark:border-gray-700">
              <span className="inline-flex items-center gap-2">
                <kbd className="rounded border px-1.5 py-0.5">↑↓</kbd> navigate
                <kbd className="rounded border px-1.5 py-0.5">Enter</kbd> select
                <kbd className="rounded border px-1.5 py-0.5">Esc</kbd> close
              </span>
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(AdminLayout);
